const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { getDb } = require('../utils/database');

const JWT_SECRET = process.env.JWT_SECRET || 'freshmart-secret-key-2024';

/**
 * Admin Authorization Middleware
 * Verifies user has admin role
 */
async function isAdmin(req, res, next) {
    try {
        // First authenticate the user
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Access denied. No token provided.' 
            });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const db = await getDb();
        
        const result = await db.request()
            .input('userId', sql.Int, decoded.userId)
            .query(`
                SELECT UserID, name, email, role 
                FROM Users 
                WHERE UserID = @userId AND role = 'admin'
            `);
        
        if (result.recordset.length === 0) {
            return res.status(403).json({ 
                success: false,
                error: 'Access denied. Admin privileges required.' 
            });
        }
        
        req.user = {
            id: result.recordset[0].UserID,
            name: result.recordset[0].name,
            email: result.recordset[0].email,
            role: result.recordset[0].role
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
        
        console.error('Admin auth error:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
}

/**
 * Check if user is admin (without throwing error)
 * Useful for conditional logic
 */
async function checkAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            req.isAdmin = false;
            return next();
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const db = await getDb();
        
        const result = await db.request()
            .input('userId', sql.Int, decoded.userId)
            .query('SELECT role FROM Users WHERE UserID = @userId AND role = "admin"');
        
        req.isAdmin = result.recordset.length > 0;
        next();
    } catch (error) {
        req.isAdmin = false;
        next();
    }
}

module.exports = { isAdmin, checkAdmin };