const { executeQuery } = require('../utils/database');

const productController = {
    async getAllProducts(req, res) {
        try {
            const result = await executeQuery(`
                SELECT p.ProductID, p.pName AS name, p.price, p.stock_Quantity AS stock,
                       p.unit, p.pic_url AS image, c.CategoryName AS category,
                       CASE 
                           WHEN p.inDeal = 1 AND p.deal_end > GETDATE() THEN p.deal_price
                           ELSE p.price
                       END AS current_price
                FROM Product p
                JOIN Category c ON p.CategoryID = c.CategoryID
                WHERE p.stock_Quantity > 0
                ORDER BY p.pName
            `);
            
            res.json({
                success: true,
                count: result.recordset.length,
                products: result.recordset
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    async getProductById(req, res) {
        try {
            const { id } = req.params;
            const result = await executeQuery(`
                SELECT p.*, c.CategoryName,
                       CASE 
                           WHEN p.inDeal = 1 AND p.deal_end > GETDATE() THEN 1 ELSE 0
                       END AS is_on_deal,
                       CASE 
                           WHEN p.inDeal = 1 AND p.deal_end > GETDATE() THEN p.deal_price
                           ELSE p.price
                       END AS current_price
                FROM Product p
                JOIN Category c ON p.CategoryID = c.CategoryID
                WHERE p.ProductID = ${id}
            `);
            
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            res.json({ success: true, product: result.recordset[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    async searchProducts(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ error: 'Search query required' });
            }
            
            const result = await executeQuery(`
                SELECT ProductID, pName AS name, price, stock_Quantity AS stock, unit, pic_url AS image
                FROM Product
                WHERE pName LIKE '%${q}%' AND stock_Quantity > 0
                ORDER BY pName
            `);
            
            res.json({
                success: true,
                count: result.recordset.length,
                searchTerm: q,
                products: result.recordset
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    async getProductsByCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const result = await executeQuery(`
                SELECT p.ProductID, p.pName AS name, p.price, p.stock_Quantity AS stock,
                       p.unit, p.pic_url AS image
                FROM Product p
                WHERE p.CategoryID = ${categoryId} AND p.stock_Quantity > 0
                ORDER BY p.pName
            `);
            
            res.json({
                success: true,
                count: result.recordset.length,
                products: result.recordset
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    async getFlashDeals(req, res) {
        try {
        const { category } = req.query;
        let query = `SELECT ProductID, pName AS name, price, deal_price, deal_end,
                            unit, pic_url AS image, stock_Quantity AS stock
                     FROM Product
                     WHERE inDeal = 1 AND deal_end > GETDATE() AND stock_Quantity > 0`;

        if (category) query += ` AND CategoryID = ${parseInt(category)}`;
        query += ` ORDER BY deal_end ASC`;

        const result = await executeQuery(query);
        res.json({ success: true, count: result.recordset.length, deals: result.recordset });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    async getAlternatives(req, res) {
        try {
            const { id } = req.params;
            
            // Get product's category
            const productResult = await executeQuery(`
                SELECT CategoryID FROM Product WHERE ProductID = ${id}
            `);
            
            if (productResult.recordset.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            const categoryId = productResult.recordset[0].CategoryID;
            
            // Get alternative products
            const result = await executeQuery(`
                SELECT ProductID, pName AS name, price, unit, stock_Quantity AS stock
                FROM Product
                WHERE CategoryID = ${categoryId} 
                AND ProductID != ${id} 
                AND stock_Quantity > 0
                ORDER BY price
                OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY
            `);
            
            res.json({
                success: true,
                alternatives: result.recordset
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = productController;