const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { getDb } = require('../utils/database');

const JWT_SECRET = process.env.JWT_SECRET || 'freshmart-secret-key-2024';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
async function authenticate(req, res, next) {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Access denied. No token provided.' 
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get database connection
        const db = await getDb();
        
        // ✅ FIXED: Added admin_approved to SELECT
        const result = await db.request()
            .input('userId', sql.Int, decoded.userId)
            .query(`
                SELECT UserID, name, email, role, phone_no, City, Address, admin_approved
                FROM Users 
                WHERE UserID = @userId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ 
                success: false,
                error: 'User not found or inactive' 
            });
        }
        
        const user = result.recordset[0];
        
        // ✅ FIXED: Attach isAdmin flag to req.user
        req.user = {
            id: user.UserID,
            name: user.name,
            email: user.email,
            role: user.role,  // Always 'customer'
            phone: user.phone_no,
            city: user.City,
            address: user.Address,
            isAdmin: user.admin_approved === 1  // ← ADDED THIS
        };
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid token.' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                error: 'Token expired. Please login again.' 
            });
        }
        
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
}

/**
 * Optional Authentication
 * Similar to authenticate but doesn't fail if no token
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            const db = await getDb();
            
            // ✅ FIXED: Added admin_approved
            const result = await db.request()
                .input('userId', sql.Int, decoded.userId)
                .query('SELECT UserID, name, email, role, admin_approved FROM Users WHERE UserID = @userId');
            
            if (result.recordset.length > 0) {
                const user = result.recordset[0];
                req.user = {
                    id: user.UserID,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isAdmin: user.admin_approved === 1  // ← ADDED THIS
                };
            }
        }
        next();
    } catch (error) {
        // Just continue without user
        next();
    }
}

module.exports = { authenticate, optionalAuth };