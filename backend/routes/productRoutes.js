const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.post('/', productController.addProduct);
router.get('/search', productController.searchProducts);
router.get('/flash-deals', productController.getFlashDeals);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);
router.get('/:id/alternatives', productController.getAlternatives);

module.exports = router;