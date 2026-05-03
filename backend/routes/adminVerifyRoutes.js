const express = require('express');
const router = express.Router();

// FIX 1: Exact spelling of the controller file (missing the 'i')
const adminVerificationController = require('../controllers/adminVerficationController');
const { authenticate } = require('../middleware/auth');

// FIX 2: Exact lowercase spelling of the middleware file
const { isAdmin } = require('../middleware/adminauth');

// User routes - Customer requests to become an admin
router.post('/request', authenticate, adminVerificationController.requestAdminAccess);

// Admin only routes - Existing admin approves the request
// FIX 3: Matched the route to the actual 'approveAdminRequest' function in the controller
router.post('/approve/:requestId', authenticate, isAdmin, adminVerificationController.approveAdminRequest);

module.exports = router;