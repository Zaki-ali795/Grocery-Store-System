const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate); // All order routes require authentication

router.post('/checkout', orderController.checkout);
router.get('/', orderController.getMyOrders);
router.get('/:id/track', orderController.trackOrder);
router.get('/:id/details', orderController.getOrderDetails);

module.exports = router;