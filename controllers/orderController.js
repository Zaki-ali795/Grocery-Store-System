const sql = require('mssql');
const { executeQuery } = require('../utils/database');

const orderController = {
    
    // ========== CHECKOUT - Place order from cart ==========
    async checkout(req, res) {
        try {
            const { delivery_address, payment_method } = req.body;
            
            if (!delivery_address) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Delivery address required' 
                });
            }
            
            // Get cart
            const cartResult = await executeQuery(
                `SELECT OrderID, total_amount FROM Orders 
                 WHERE CustomerID = @userId AND status = 'cart'`,
                [{ name: 'userId', type: sql.Int, value: req.user.id }]
            );
            
            if (cartResult.recordset.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Cart is empty' 
                });
            }
            
            const orderId = cartResult.recordset[0].OrderID;
            const totalAmount = cartResult.recordset[0].total_amount;
            
            if (totalAmount === 0) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Cannot checkout empty cart' 
                });
            }
            
            // Update order status and delivery address
            await executeQuery(
                `UPDATE Orders 
                 SET status = 'pending', 
                     delivery_address = @address, 
                     orderDate = GETDATE() 
                 WHERE OrderID = @orderId`,
                [
                    { name: 'address', type: sql.NVarChar, value: delivery_address },
                    { name: 'orderId', type: sql.Int, value: orderId }
                ]
            );
            
            // Create payment record
            const payMethod = payment_method || 'Cash';
            const payType = payMethod === 'Cash' ? 'COD' : 'Online';
            
            await executeQuery(
                `INSERT INTO Payment(order_id, payment_method, payment_type, status) 
                 VALUES(@orderId, @payMethod, @payType, 'pending')`,
                [
                    { name: 'orderId', type: sql.Int, value: orderId },
                    { name: 'payMethod', type: sql.NVarChar, value: payMethod },
                    { name: 'payType', type: sql.NVarChar, value: payType }
                ]
            );
            
            // Reduce stock quantities
            const itemsResult = await executeQuery(
                `SELECT ProductID, quantity FROM OrderItem WHERE OrderID = @orderId`,
                [{ name: 'orderId', type: sql.Int, value: orderId }]
            );
            
            for (const item of itemsResult.recordset) {
                await executeQuery(
                    `UPDATE Product 
                     SET stock_Quantity = stock_Quantity - @qty 
                     WHERE ProductID = @productId`,
                    [
                        { name: 'qty', type: sql.Int, value: item.quantity },
                        { name: 'productId', type: sql.Int, value: item.ProductID }
                    ]
                );
            }
            
            res.json({
                success: true,
                message: 'Order placed successfully',
                orderId: orderId,
                totalAmount: totalAmount
            });
            
        } catch (error) {
            console.error('Checkout error:', error);
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    },
    
    // ========== GET MY ORDERS - Customer order history ==========
    async getMyOrders(req, res) {
        try {
            const result = await executeQuery(
                `SELECT o.OrderID, o.total_amount, o.orderDate, o.status, 
                        o.delivery_address, p.payment_method, p.status as payment_status
                 FROM Orders o
                 LEFT JOIN Payment p ON o.OrderID = p.order_id
                 WHERE o.CustomerID = @userId AND o.status != 'cart'
                 ORDER BY o.orderDate DESC`,
                [{ name: 'userId', type: sql.Int, value: req.user.id }]
            );
            
            res.json({
                success: true,
                orders: result.recordset
            });
            
        } catch (error) {
            console.error('Get orders error:', error);
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    },
    
    // ========== TRACK ORDER - Get order status ==========
    async trackOrder(req, res) {
        try {
            const { id } = req.params;
            
            const result = await executeQuery(
                `SELECT o.OrderID, o.status, o.orderDate, o.total_amount,
                        o.delivery_address, p.payment_method, p.status as payment_status,
                        p.paid_at
                 FROM Orders o
                 LEFT JOIN Payment p ON o.OrderID = p.order_id
                 WHERE o.OrderID = @orderId AND o.CustomerID = @userId`,
                [
                    { name: 'orderId', type: sql.Int, value: id },
                    { name: 'userId', type: sql.Int, value: req.user.id }
                ]
            );
            
            if (result.recordset.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Order not found' 
                });
            }
            
            res.json({
                success: true,
                order: result.recordset[0]
            });
            
        } catch (error) {
            console.error('Track order error:', error);
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    },
    
    // ========== GET ORDER DETAILS - Full order with items ==========
    async getOrderDetails(req, res) {
        try {
            const { id } = req.params;
            
            // Get order info
            const orderResult = await executeQuery(
                `SELECT o.*, p.payment_method, p.status as payment_status
                 FROM Orders o
                 LEFT JOIN Payment p ON o.OrderID = p.order_id
                 WHERE o.OrderID = @orderId AND o.CustomerID = @userId`,
                [
                    { name: 'orderId', type: sql.Int, value: id },
                    { name: 'userId', type: sql.Int, value: req.user.id }
                ]
            );
            
            if (orderResult.recordset.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Order not found' 
                });
            }
            
            // Get order items
            const itemsResult = await executeQuery(
                `SELECT oi.OrderItemID, p.ProductID, p.pName AS name, 
                        oi.quantity, oi.unit_price, oi.subtotal, p.unit
                 FROM OrderItem oi
                 JOIN Product p ON oi.ProductID = p.ProductID
                 WHERE oi.OrderID = @orderId`,
                [{ name: 'orderId', type: sql.Int, value: id }]
            );
            
            res.json({
                success: true,
                order: orderResult.recordset[0],
                items: itemsResult.recordset
            });
            
        } catch (error) {
            console.error('Order details error:', error);
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    },
    
    // ========== CANCEL ORDER - Customer cancels pending order ==========
    async cancelOrder(req, res) {
        try {
            const { id } = req.params;
            
            // Check if order can be cancelled (only pending or confirmed)
            const orderResult = await executeQuery(
                `SELECT OrderID, status FROM Orders 
                 WHERE OrderID = @orderId AND CustomerID = @userId 
                 AND status IN ('pending', 'confirmed')`,
                [
                    { name: 'orderId', type: sql.Int, value: id },
                    { name: 'userId', type: sql.Int, value: req.user.id }
                ]
            );
            
            if (orderResult.recordset.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Order cannot be cancelled. Only pending or confirmed orders can be cancelled.' 
                });
            }
            
            // Update order status to cancelled
            await executeQuery(
                `UPDATE Orders SET status = 'cancelled' WHERE OrderID = @orderId`,
                [{ name: 'orderId', type: sql.Int, value: id }]
            );
            
            // Restore stock quantities
            const itemsResult = await executeQuery(
                `SELECT ProductID, quantity FROM OrderItem WHERE OrderID = @orderId`,
                [{ name: 'orderId', type: sql.Int, value: id }]
            );
            
            for (const item of itemsResult.recordset) {
                await executeQuery(
                    `UPDATE Product 
                     SET stock_Quantity = stock_Quantity + @qty 
                     WHERE ProductID = @productId`,
                    [
                        { name: 'qty', type: sql.Int, value: item.quantity },
                        { name: 'productId', type: sql.Int, value: item.ProductID }
                    ]
                );
            }
            
            // Update payment status if exists
            await executeQuery(
                `UPDATE Payment SET status = 'refunded' WHERE order_id = @orderId`,
                [{ name: 'orderId', type: sql.Int, value: id }]
            );
            
            res.json({
                success: true,
                message: 'Order cancelled successfully'
            });
            
        } catch (error) {
            console.error('Cancel order error:', error);
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }
};

module.exports = orderController;