const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (require authentication)
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);
router.post('/change-password', authController.changePassword);

module.exports = router;