const sql = require('mssql/msnodesqlv8');
const { executeQuery } = require('../utils/database');

const orderController = {
    async checkout(req, res) {
        try {
            const { delivery_address, payment_method } = req.body;
            
            if (!delivery_address) return res.status(400).json({ error: 'Delivery address required' });
            
            const cartResult = await executeQuery(
                `SELECT OrderID, total_amount FROM Orders WHERE CustomerID = @userId AND status = 'cart'`,
                [{ name: 'userId', type: sql.Int, value: req.user.id }]
            );
            
            if (cartResult.recordset.length === 0) return res.status(400).json({ error: 'Cart is empty' });
            
            const orderId = cartResult.recordset[0].OrderID;
            const totalAmount = cartResult.recordset[0].total_amount;
            
            if (totalAmount === 0) return res.status(400).json({ error: 'Cannot checkout empty cart' });
            
            await executeQuery(
                `UPDATE Orders SET status = 'pending', delivery_address = @address, orderDate = GETDATE() WHERE OrderID = @orderId`,
                [
                    { name: 'address', type: sql.NVarChar, value: delivery_address },
                    { name: 'orderId', type: sql.Int, value: orderId }
                ]
            );
            
            const payMethod = payment_method || 'Cash';
            const payType = payMethod === 'Cash' ? 'COD' : 'Online';
            
            await executeQuery(
                `INSERT INTO Payment(order_id, payment_method, payment_type, status) VALUES(@orderId, @payMethod, @payType, 'pending')`,
                [
                    { name: 'orderId', type: sql.Int, value: orderId },
                    { name: 'payMethod', type: sql.NVarChar, value: payMethod },
                    { name: 'payType', type: sql.NVarChar, value: payType }
                ]
            );
            
            const itemsResult = await executeQuery(
                `SELECT ProductID, quantity FROM OrderItem WHERE OrderID = @orderId`,
                [{ name: 'orderId', type: sql.Int, value: orderId }]
            );
            
            for (const item of itemsResult.recordset) {
                await executeQuery(
                    `UPDATE Product SET stock_Quantity = stock_Quantity - @qty WHERE ProductID = @productId`,
                    [
                        { name: 'qty', type: sql.Int, value: item.quantity },
                        { name: 'productId', type: sql.Int, value: item.ProductID }
                    ]
                );
            }
            
            res.json({ success: true, message: 'Order placed successfully', orderId, totalAmount });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    async getMyOrders(req, res) {
        try {
            const result = await executeQuery(
                `SELECT o.OrderID, o.total_amount, o.orderDate, o.status, o.delivery_address, p.payment_method, p.status as payment_status
                 FROM Orders o LEFT JOIN Payment p ON o.OrderID = p.order_id
                 WHERE o.CustomerID = @userId AND o.status != 'cart' ORDER BY o.orderDate DESC`,
                [{ name: 'userId', type: sql.Int, value: req.user.id }]
            );
            res.json({ success: true, orders: result.recordset });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    async trackOrder(req, res) {
        try {
            const result = await executeQuery(
                `SELECT o.OrderID, o.status, o.orderDate, o.total_amount, o.delivery_address, p.payment_method, p.status as payment_status, p.paid_at
                 FROM Orders o LEFT JOIN Payment p ON o.OrderID = p.order_id
                 WHERE o.OrderID = @orderId AND o.CustomerID = @userId`,
                [
                    { name: 'orderId', type: sql.Int, value: req.params.id },
                    { name: 'userId', type: sql.Int, value: req.user.id }
                ]
            );
            if (result.recordset.length === 0) return res.status(404).json({ error: 'Order not found' });
            res.json({ success: true, order: result.recordset[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    async getOrderDetails(req, res) {
        try {
            const orderResult = await executeQuery(
                `SELECT o.*, p.payment_method, p.status as payment_status
                 FROM Orders o LEFT JOIN Payment p ON o.OrderID = p.order_id
                 WHERE o.OrderID = @orderId AND o.CustomerID = @userId`,
                [
                    { name: 'orderId', type: sql.Int, value: req.params.id },
                    { name: 'userId', type: sql.Int, value: req.user.id }
                ]
            );
            if (orderResult.recordset.length === 0) return res.status(404).json({ error: 'Order not found' });
            
            const itemsResult = await executeQuery(
                `SELECT oi.OrderItemID, p.ProductID, p.pName AS name, oi.quantity, oi.unit_price, oi.subtotal, p.unit
                 FROM OrderItem oi JOIN Product p ON oi.ProductID = p.ProductID WHERE oi.OrderID = @orderId`,
                [{ name: 'orderId', type: sql.Int, value: req.params.id }]
            );
            res.json({ success: true, order: orderResult.recordset[0], items: itemsResult.recordset });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = orderController;