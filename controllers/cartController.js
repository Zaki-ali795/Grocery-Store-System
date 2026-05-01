const { executeQuery } = require('../utils/database');

const cartController = {
    async viewCart(req, res) {
        try {
            // Get or create cart
            let cartResult = await executeQuery(`
                SELECT OrderID FROM Orders 
                WHERE CustomerID = ${req.user.id} AND status = 'cart'
            `);
            
            let orderId;
            if (cartResult.recordset.length === 0) {
                const insertResult = await executeQuery(`
                    INSERT INTO Orders(CustomerID, status) 
                    VALUES(${req.user.id}, 'cart');
                    SELECT SCOPE_IDENTITY() AS OrderID;
                `);
                orderId = insertResult.recordset[0].OrderID;
            } else {
                orderId = cartResult.recordset[0].OrderID;
            }
            
            // Get cart items
            const itemsResult = await executeQuery(`
                SELECT oi.OrderItemID, p.ProductID, p.pName AS name, 
                       oi.quantity, oi.unit_price, oi.subtotal, p.unit
                FROM OrderItem oi
                JOIN Product p ON oi.ProductID = p.ProductID
                WHERE oi.OrderID = ${orderId}
            `);
            
            // Get total
            const totalResult = await executeQuery(`
                SELECT total_amount FROM Orders WHERE OrderID = ${orderId}
            `);
            
            res.json({
                success: true,
                cart: {
                    orderId: orderId,
                    items: itemsResult.recordset,
                    total: totalResult.recordset[0]?.total_amount || 0,
                    itemCount: itemsResult.recordset.length
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    async addToCart(req, res) {
        try {
            const { productId, quantity } = req.body;
            
            if (!productId || !quantity || quantity < 1) {
                return res.status(400).json({ error: 'Product ID and valid quantity required' });
            }
            
            // Check product stock
            const productResult = await executeQuery(`
                SELECT price, stock_Quantity, inDeal, deal_price, deal_end 
                FROM Product WHERE ProductID = ${productId}
            `);
            
            if (productResult.recordset.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            const product = productResult.recordset[0];
            if (product.stock_Quantity < quantity) {
                return res.status(400).json({ error: 'Insufficient stock' });
            }
            
            // Get or create cart
            let cartResult = await executeQuery(`
                SELECT OrderID FROM Orders 
                WHERE CustomerID = ${req.user.id} AND status = 'cart'
            `);
            
            let orderId;
            if (cartResult.recordset.length === 0) {
                const insertResult = await executeQuery(`
                    INSERT INTO Orders(CustomerID, status) 
                    VALUES(${req.user.id}, 'cart');
                    SELECT SCOPE_IDENTITY() AS OrderID;
                `);
                orderId = insertResult.recordset[0].OrderID;
            } else {
                orderId = cartResult.recordset[0].OrderID;
            }
            
            // Calculate price
            let unitPrice = product.price;
            if (product.inDeal === 1 && product.deal_end && new Date(product.deal_end) > new Date()) {
                unitPrice = product.deal_price;
            }
            
            const subtotal = unitPrice * quantity;
            
            // Check if product already in cart
            const existingItem = await executeQuery(`
                SELECT OrderItemID, quantity FROM OrderItem 
                WHERE OrderID = ${orderId} AND ProductID = ${productId}
            `);
            
            if (existingItem.recordset.length > 0) {
                const newQuantity = existingItem.recordset[0].quantity + quantity;
                const newSubtotal = unitPrice * newQuantity;
                await executeQuery(`
                    UPDATE OrderItem 
                    SET quantity = ${newQuantity}, subtotal = ${newSubtotal}
                    WHERE OrderItemID = ${existingItem.recordset[0].OrderItemID}
                `);
            } else {
                await executeQuery(`
                    INSERT INTO OrderItem(OrderID, ProductID, quantity, unit_price, subtotal)
                    VALUES(${orderId}, ${productId}, ${quantity}, ${unitPrice}, ${subtotal})
                `);
            }
            
            res.json({
                success: true,
                message: 'Item added to cart',
                productId: productId,
                quantity: quantity
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    async updateCartItem(req, res) {
        try {
            const { itemId } = req.params;
            const { quantity } = req.body;
            
            if (quantity < 1) {
                return res.status(400).json({ error: 'Quantity must be at least 1' });
            }
            
            const itemResult = await executeQuery(`
                SELECT oi.OrderID, oi.ProductID, oi.unit_price, p.stock_Quantity
                FROM OrderItem oi
                JOIN Product p ON oi.ProductID = p.ProductID
                WHERE oi.OrderItemID = ${itemId}
            `);
            
            if (itemResult.recordset.length === 0) {
                return res.status(404).json({ error: 'Cart item not found' });
            }
            
            const item = itemResult.recordset[0];
            if (item.stock_Quantity < quantity) {
                return res.status(400).json({ error: 'Insufficient stock' });
            }
            
            const newSubtotal = item.unit_price * quantity;
            
            await executeQuery(`
                UPDATE OrderItem 
                SET quantity = ${quantity}, subtotal = ${newSubtotal}
                WHERE OrderItemID = ${itemId}
            `);
            
            res.json({
                success: true,
                message: 'Cart updated successfully'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    async removeFromCart(req, res) {
        try {
            const { itemId } = req.params;
            await executeQuery(`DELETE FROM OrderItem WHERE OrderItemID = ${itemId}`);
            
            res.json({
                success: true,
                message: 'Item removed from cart'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    async clearCart(req, res) {
        try {
            const cartResult = await executeQuery(`
                SELECT OrderID FROM Orders 
                WHERE CustomerID = ${req.user.id} AND status = 'cart'
            `);
            
            if (cartResult.recordset.length > 0) {
                const orderId = cartResult.recordset[0].OrderID;
                await executeQuery(`DELETE FROM OrderItem WHERE OrderID = ${orderId}`);
            }
            
            res.json({
                success: true,
                message: 'Cart cleared successfully'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = cartController;