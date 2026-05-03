// routes/adminVerificationRoutes.js

const express = require('express');
const router = express.Router();
const adminVerificationController = require('../controllers/adminVerificationController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');


// User routes
router.post('/request', authenticate, adminVerificationController.requestAdminAccess);
router.get('/status', authenticate, adminVerificationController.getVerificationStatus);

// Admin only routes
router.get('/pending', authenticate, isAdmin, adminVerificationController.getPendingRequests);
router.post('/review', authenticate, isAdmin, adminVerificationController.reviewAdminRequest);
router.post('/approve/:requestId', authenticate, isAdmin, adminVerificationController.approveAdminRequest);
module.exports = router;