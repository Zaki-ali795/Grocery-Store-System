const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminauth');

// All order routes require authentication
router.use(authenticate);

// Customer routes
router.post('/checkout', orderController.checkout);
router.get('/', orderController.getMyOrders);  // ← Changed from '/my-orders' to '/'
router.get('/:id/track', orderController.trackOrder);
router.get('/:id/details', orderController.getOrderDetails);

// Admin routes (require admin approval)
router.get('/all', isAdmin, orderController.getAllOrders);
router.get('/admin/stats', isAdmin, orderController.getDashboardStats);
router.put('/:id/status', isAdmin, orderController.updateOrderStatus); 

module.exports = router;