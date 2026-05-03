const { executeQuery, sql } = require('../utils/database');

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

    async addProduct(req, res) {
        try {
            const {
                name,
                category,
                price,
                stock,
                unit,
                image,
                description,
                inDeal,
                deal_price,
                deal_end
            } = req.body;

            if (!name || !category || !price || !stock || !unit) {
                return res.status(400).json({
                    success: false,
                    error: 'Product name, category, price, stock, and unit are required.'
                });
            }

            const categoryResult = await executeQuery(
                `SELECT CategoryID FROM Category WHERE CategoryName = @category`,
                [{ name: 'category', type: sql.NVarChar, value: category }]
            );

            let categoryId;
            if (categoryResult.recordset.length > 0) {
                categoryId = categoryResult.recordset[0].CategoryID;
            } else {
                const insertCategory = await executeQuery(
                    `INSERT INTO Category (CategoryName, numberOfProduct) OUTPUT INSERTED.CategoryID VALUES (@category, 0)`,
                    [{ name: 'category', type: sql.NVarChar, value: category }]
                );
                categoryId = insertCategory.recordset[0].CategoryID;
            }

            await executeQuery(
                `INSERT INTO Product (CategoryID, pName, price, stock_Quantity, product_description, pic_url, unit, inDeal, deal_price, deal_end)
                 VALUES (@categoryId, @name, @price, @stock, @description, @image, @unit, @inDeal, @deal_price, @deal_end)`,
                [
                    { name: 'categoryId', type: sql.Int, value: categoryId },
                    { name: 'name', type: sql.NVarChar, value: name },
                    { name: 'price', type: sql.Decimal(10, 2), value: price },
                    { name: 'stock', type: sql.Int, value: stock },
                    { name: 'description', type: sql.NVarChar, value: description || null },
                    { name: 'image', type: sql.NVarChar, value: image || null },
                    { name: 'unit', type: sql.NVarChar, value: unit },
                    { name: 'inDeal', type: sql.Bit, value: inDeal ? 1 : 0 },
                    { name: 'deal_price', type: sql.Decimal(10, 2), value: deal_price || null },
                    { name: 'deal_end', type: sql.DateTime, value: deal_end || null }
                ]
            );

            await executeQuery(
                `UPDATE Category SET numberOfProduct = numberOfProduct + 1 WHERE CategoryID = @categoryId`,
                [{ name: 'categoryId', type: sql.Int, value: categoryId }]
            );

            const createdProductResult = await executeQuery(
                `SELECT ProductID, pName AS name, price, stock_Quantity AS stock, unit, pic_url AS image
                 FROM Product
                 WHERE ProductID = SCOPE_IDENTITY()`
            );

            const createdProduct = createdProductResult.recordset[0];
            res.status(201).json({ success: true, product: createdProduct });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async getProductById(req, res) {
        try {
            const { id } = req.params;
            const result = await executeQuery(
                `SELECT p.*, c.CategoryName,
                       CASE 
                           WHEN p.inDeal = 1 AND p.deal_end > GETDATE() THEN 1 ELSE 0
                       END AS is_on_deal,
                       CASE 
                           WHEN p.inDeal = 1 AND p.deal_end > GETDATE() THEN p.deal_price
                           ELSE p.price
                       END AS current_price
                FROM Product p
                JOIN Category c ON p.CategoryID = c.CategoryID
                WHERE p.ProductID = @productId`,
                [{ name: 'productId', type: sql.Int, value: id }]
            );

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

            const result = await executeQuery(
                `SELECT ProductID, pName AS name, price, stock_Quantity AS stock, unit, pic_url AS image
                 FROM Product
                 WHERE pName LIKE @search AND stock_Quantity > 0
                 ORDER BY pName`,
                [{ name: 'search', type: sql.NVarChar, value: `%${q}%` }]
            );

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
            const result = await executeQuery(
                `SELECT p.ProductID, p.pName AS name, p.price, p.stock_Quantity AS stock,
                       p.unit, p.pic_url AS image
                 FROM Product p
                 WHERE p.CategoryID = @categoryId AND p.stock_Quantity > 0
                 ORDER BY p.pName`,
                [{ name: 'categoryId', type: sql.Int, value: categoryId }]
            );

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
            const result = await executeQuery(`
                SELECT ProductID, pName AS name, price, deal_price, deal_end,
                       unit, pic_url AS image, stock_Quantity AS stock
                FROM Product
                WHERE inDeal = 1 AND deal_end > GETDATE() AND stock_Quantity > 0
                ORDER BY deal_end ASC
            `);

            res.json({
                success: true,
                count: result.recordset.length,
                deals: result.recordset
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getAlternatives(req, res) {
        try {
            const { id } = req.params;

            const productResult = await executeQuery(
                `SELECT CategoryID FROM Product WHERE ProductID = @productId`,
                [{ name: 'productId', type: sql.Int, value: id }]
            );

            if (productResult.recordset.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            const categoryId = productResult.recordset[0].CategoryID;

            const result = await executeQuery(
                `SELECT ProductID, pName AS name, price, unit, stock_Quantity AS stock
                 FROM Product
                 WHERE CategoryID = @categoryId 
                   AND ProductID != @productId 
                   AND stock_Quantity > 0
                 ORDER BY price
                 OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY`,
                [
                    { name: 'categoryId', type: sql.Int, value: categoryId },
                    { name: 'productId', type: sql.Int, value: id }
                ]
            );

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