const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminauth');

// Public routes (no authentication needed)
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/flash-deals', productController.getFlashDeals);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);
router.get('/:id/alternatives', productController.getAlternatives);
router.get('/categories/all', productController.getCategories);

// Admin only routes (require authentication and admin rights)
router.post('/add', authenticate, isAdmin, productController.addProduct);
router.put('/:id', authenticate, isAdmin, productController.updateProduct);

module.exports = router;