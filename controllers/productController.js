const { executeQuery, sql } = require('../utils/database');

const productController = {
    // ========== GET ALL PRODUCTS ==========
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
            console.error('Get all products error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // ========== ADD NEW PRODUCT (Admin) ==========
// ========== ADD NEW PRODUCT ==========
// ========== ADD NEW PRODUCT ==========
async addProduct(req, res) {
    try {
        console.log('=== ADD PRODUCT ===');
        console.log('Request body:', req.body);
        console.log('User:', req.user);
        
        const { categoryId, pName, price, stock_Quantity, unit, product_description, pic_url } = req.body;
        
        // Validation
        if (!categoryId) {
            return res.status(400).json({ success: false, error: 'Category ID is required' });
        }
        if (!pName) {
            return res.status(400).json({ success: false, error: 'Product name is required' });
        }
        if (!price || price <= 0) {
            return res.status(400).json({ success: false, error: 'Valid price is required' });
        }
        if (stock_Quantity === undefined || stock_Quantity < 0) {
            return res.status(400).json({ success: false, error: 'Valid stock quantity is required' });
        }
        if (!unit) {
            return res.status(400).json({ success: false, error: 'Unit is required' });
        }
        
        // Insert product
        await executeQuery(
            `INSERT INTO Product (CategoryID, pName, price, stock_Quantity, unit, product_description, pic_url)
             VALUES (@catId, @name, @price, @stock, @unit, @desc, @pic)`,
            [
                { name: 'catId', type: sql.Int, value: parseInt(categoryId) },
                { name: 'name', type: sql.NVarChar, value: pName },
                { name: 'price', type: sql.Decimal(10,2), value: parseFloat(price) },
                { name: 'stock', type: sql.Int, value: parseInt(stock_Quantity) },
                { name: 'unit', type: sql.NVarChar, value: unit },
                { name: 'desc', type: sql.NVarChar, value: product_description || null },
                { name: 'pic', type: sql.NVarChar, value: pic_url || null }
            ]
        );
        
        console.log('Product added successfully');
        
        res.status(201).json({ 
            success: true, 
            message: 'Product added successfully' 
        });
        
    } catch (error) {
        console.error('Add product error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
},

    // ========== GET PRODUCT BY ID ==========
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
                return res.status(404).json({ 
                    success: false, 
                    error: 'Product not found' 
                });
            }

            res.json({ 
                success: true, 
                product: result.recordset[0] 
            });
            
        } catch (error) {
            console.error('Get product by ID error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // ========== SEARCH PRODUCTS ==========
    async searchProducts(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Search query required' 
                });
            }

            const result = await executeQuery(
                `SELECT ProductID, pName AS name, price, stock_Quantity AS stock, 
                        unit, pic_url AS image
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
            console.error('Search products error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // ========== GET PRODUCTS BY CATEGORY ==========
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
            console.error('Get products by category error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // ========== GET FLASH DEALS ==========
    async getFlashDeals(req, res) {
        try {
            const { category } = req.query;
            let query = `
                SELECT ProductID, pName AS name, price, deal_price, deal_end,
                       unit, pic_url AS image, stock_Quantity AS stock
                FROM Product
                WHERE inDeal = 1 AND deal_end > GETDATE() AND stock_Quantity > 0
            `;

            const params = [];
            
            if (category) {
                query += ` AND CategoryID = @categoryId`;
                params.push({ name: 'categoryId', type: sql.Int, value: parseInt(category) });
            }
            
            query += ` ORDER BY deal_end ASC`;

            const result = await executeQuery(query, params);
            
            res.json({ 
                success: true, 
                count: result.recordset.length, 
                deals: result.recordset 
            });
            
        } catch (error) {
            console.error('Get flash deals error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // ========== GET PRODUCT ALTERNATIVES ==========
    async getAlternatives(req, res) {
        try {
            const { id } = req.params;

            // Get product's category
            const productResult = await executeQuery(
                `SELECT CategoryID FROM Product WHERE ProductID = @productId`,
                [{ name: 'productId', type: sql.Int, value: id }]
            );

            if (productResult.recordset.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Product not found' 
                });
            }

            const categoryId = productResult.recordset[0].CategoryID;

            // Get alternative products (up to 5)
            const result = await executeQuery(
                `SELECT ProductID, pName AS name, price, unit, stock_Quantity AS stock,
                        pic_url AS image
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
                count: result.recordset.length,
                alternatives: result.recordset
            });
            
        } catch (error) {
            console.error('Get alternatives error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // ========== UPDATE PRODUCT (Admin) ==========
    async updateProduct(req, res) {
        try {
            const { id } = req.params;
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

            // Check if product exists
            const checkProduct = await executeQuery(
                `SELECT ProductID FROM Product WHERE ProductID = @productId`,
                [{ name: 'productId', type: sql.Int, value: id }]
            );

            if (checkProduct.recordset.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Product not found' 
                });
            }

            // Update category if changed
            if (category) {
                const categoryResult = await executeQuery(
                    `SELECT CategoryID FROM Category WHERE CategoryName = @category`,
                    [{ name: 'category', type: sql.NVarChar, value: category }]
                );

                let categoryId;
                if (categoryResult.recordset.length > 0) {
                    categoryId = categoryResult.recordset[0].CategoryID;
                } else {
                    const insertCategory = await executeQuery(
                        `INSERT INTO Category (CategoryName, numberOfProduct) 
                         OUTPUT INSERTED.CategoryID 
                         VALUES (@category, 0)`,
                        [{ name: 'category', type: sql.NVarChar, value: category }]
                    );
                    categoryId = insertCategory.recordset[0].CategoryID;
                }

                // Update product with new category
                await executeQuery(
                    `UPDATE Product 
                     SET CategoryID = @categoryId, pName = ISNULL(@name, pName),
                         price = ISNULL(@price, price), stock_Quantity = ISNULL(@stock, stock_Quantity),
                         product_description = ISNULL(@description, product_description),
                         pic_url = ISNULL(@image, pic_url), unit = ISNULL(@unit, unit),
                         inDeal = ISNULL(@inDeal, inDeal), deal_price = @deal_price,
                         deal_end = @deal_end
                     WHERE ProductID = @productId`,
                    [
                        { name: 'productId', type: sql.Int, value: id },
                        { name: 'categoryId', type: sql.Int, value: categoryId },
                        { name: 'name', type: sql.NVarChar, value: name || null },
                        { name: 'price', type: sql.Decimal(10, 2), value: price || null },
                        { name: 'stock', type: sql.Int, value: stock || null },
                        { name: 'description', type: sql.NVarChar, value: description || null },
                        { name: 'image', type: sql.NVarChar, value: image || null },
                        { name: 'unit', type: sql.NVarChar, value: unit || null },
                        { name: 'inDeal', type: sql.Bit, value: inDeal !== undefined ? (inDeal ? 1 : 0) : null },
                        { name: 'deal_price', type: sql.Decimal(10, 2), value: deal_price || null },
                        { name: 'deal_end', type: sql.DateTime, value: deal_end || null }
                    ]
                );
            } else {
                // Update product without changing category
                await executeQuery(
                    `UPDATE Product 
                     SET pName = ISNULL(@name, pName), price = ISNULL(@price, price),
                         stock_Quantity = ISNULL(@stock, stock_Quantity),
                         product_description = ISNULL(@description, product_description),
                         pic_url = ISNULL(@image, pic_url), unit = ISNULL(@unit, unit),
                         inDeal = ISNULL(@inDeal, inDeal), deal_price = @deal_price,
                         deal_end = @deal_end
                     WHERE ProductID = @productId`,
                    [
                        { name: 'productId', type: sql.Int, value: id },
                        { name: 'name', type: sql.NVarChar, value: name || null },
                        { name: 'price', type: sql.Decimal(10, 2), value: price || null },
                        { name: 'stock', type: sql.Int, value: stock || null },
                        { name: 'description', type: sql.NVarChar, value: description || null },
                        { name: 'image', type: sql.NVarChar, value: image || null },
                        { name: 'unit', type: sql.NVarChar, value: unit || null },
                        { name: 'inDeal', type: sql.Bit, value: inDeal !== undefined ? (inDeal ? 1 : 0) : null },
                        { name: 'deal_price', type: sql.Decimal(10, 2), value: deal_price || null },
                        { name: 'deal_end', type: sql.DateTime, value: deal_end || null }
                    ]
                );
            }

            res.json({ 
                success: true, 
                message: 'Product updated successfully' 
            });
            
        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // ========== DELETE PRODUCT (Admin) ==========
    async deleteProduct(req, res) {
        try {
            const { id } = req.params;

            // Get category before deleting
            const productResult = await executeQuery(
                `SELECT CategoryID FROM Product WHERE ProductID = @productId`,
                [{ name: 'productId', type: sql.Int, value: id }]
            );

            if (productResult.recordset.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Product not found' 
                });
            }

            const categoryId = productResult.recordset[0].CategoryID;

            // Delete product
            await executeQuery(
                `DELETE FROM Product WHERE ProductID = @productId`,
                [{ name: 'productId', type: sql.Int, value: id }]
            );

            // Update category product count
            await executeQuery(
                `UPDATE Category SET numberOfProduct = numberOfProduct - 1 
                 WHERE CategoryID = @categoryId AND numberOfProduct > 0`,
                [{ name: 'categoryId', type: sql.Int, value: categoryId }]
            );

            res.json({ 
                success: true, 
                message: 'Product deleted successfully' 
            });
            
        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // ========== GET FEATURED PRODUCTS ==========
    async getFeaturedProducts(req, res) {
        try {
            const result = await executeQuery(`
                SELECT TOP 8 ProductID, pName AS name, price, stock_Quantity AS stock,
                       unit, pic_url AS image,
                       CASE 
                           WHEN inDeal = 1 AND deal_end > GETDATE() THEN deal_price
                           ELSE price
                       END AS current_price
                FROM Product
                WHERE stock_Quantity > 0
                ORDER BY ProductID DESC
            `);

            res.json({
                success: true,
                count: result.recordset.length,
                products: result.recordset
            });
            
        } catch (error) {
            console.error('Get featured products error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },// Add this function to your productController.js
async getCategories(req, res) {
    try {
        const result = await executeQuery(
            `SELECT CategoryID, CategoryName FROM Category ORDER BY CategoryName`,
            []
        );
        
        res.json({
            success: true,
            categories: result.recordset
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
};

module.exports = productController;