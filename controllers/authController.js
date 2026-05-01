const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { executeProcedure, executeQuery } = require('../utils/database');

const JWT_SECRET = process.env.JWT_SECRET || 'freshmart-secret-key-2024';

const authController = {

    async register(req, res) {
        try {
            const { name, email, password, phone_no, address, city } = req.body;
            
            // Validation
            if (!name || !email || !password || !city) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Please fill in all required fields' 
                });
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Please provide a valid email address' 
                });
            }
            
            // Validate password length
            if (password.length < 6) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Password must be at least 6 characters long' 
                });
            }
            
            // Hash password with bcrypt
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            // ✅ CALL YOUR sp_SignUp PROCEDURE
            try {
                const result = await executeProcedure('sp_SignUp', {
                    name: name,
                    email: email,
                    password_hash: hashedPassword,
                    phone_no: phone_no || null,
                    Address: address || null,
                    City: city
                });
                
                // If successful (no error from procedure)
                res.status(201).json({ 
                    success: true, 
                    message: 'Account created successfully. Please login.',
                    email: email
                });
                
            } catch (procError) {
                // Handle errors raised by the stored procedure
                if (procError.message.includes('Email already registered')) {
                    return res.status(409).json({ 
                        success: false,
                        error: 'Email already registered. Please use a different email.' 
                    });
                }
                throw procError;
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error. Please try again later.' 
            });
        }
    },

    async login(req, res) {
        try {
            const { email, password, role } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Please enter both email and password' 
                });
            }
            
            let user;
            try {
                const result = await executeProcedure('sp_LogIn', {
                    email: email,
                    password_hash: password  // This won't work with bcrypt!
                });
                user = result.recordset[0];
            } catch (procError) {
                if (procError.message.includes('Email not found') || 
                    procError.message.includes('Incorrect password')) {
                    return res.status(401).json({ 
                        success: false,
                        error: 'Invalid email or password' 
                    });
                }
                throw procError;
            }
            
            res.json({
                success: true,
                message: 'Login successful',
                token: 'temp_token',
                user: user
            });
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error' 
            });
        }
    },
    
    async loginAlternative(req, res) {
        try {
            const { email, password, role } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Please enter both email and password' 
                });
            }
            
            const result = await executeQuery(
                `SELECT UserID, name, email, password_hash, role, admin_approved 
                 FROM Users 
                 WHERE email = @email`,
                [{ name: 'email', value: email }]
            );
            
            if (result.recordset.length === 0) {
                return res.status(401).json({ 
                    success: false,
                    error: 'Invalid email or password' 
                });
            }
            
            const user = result.recordset[0];
            
            // Verify password using bcrypt
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ 
                    success: false,
                    error: 'Invalid email or password' 
                });
            }
            
            // Check role if specified
            if (role && role !== user.role && role !== 'customer') {

                if (role === 'admin' && user.admin_approved !== 1) {
                    return res.status(403).json({ 
                        success: false,
                        error: 'Not authorized as admin. Please request admin access first.' 
                    });
                }
            }
            
            // Generate JWT token
            const tokenRole = (role === 'admin' && user.admin_approved === 1) ? 'admin' : 'customer';
            const token = jwt.sign(
                { 
                    userId: user.UserID, 
                    email: user.email, 
                    role: tokenRole,
                    name: user.name
                },
                JWT_SECRET,
                { expiresIn: tokenRole === 'admin' ? '8h' : '24h' }
            );
            
            res.json({
                success: true,
                message: 'Login successful',
                token: token,
                role: tokenRole,
                user: {
                    id: user.UserID,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isAdmin: user.admin_approved === 1
                }
            });
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error' 
            });
        }
    },
    
    async getCurrentUser(req, res) {
        try {
            const userId = req.user.userId;
            
            const result = await executeQuery(
                `SELECT UserID, name, email, phone_no, Address, City, role, admin_approved, created_at
                 FROM Users 
                 WHERE UserID = @userId`,
                [{ name: 'userId', value: userId, type: sql.Int }]
            );
            
            if (result.recordset.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: 'User not found' 
                });
            }
            
            res.json({ 
                success: true, 
                user: result.recordset[0] 
            });
            
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error' 
            });
        }
    },
    
    // ========== LOGOUT ==========
    async logout(req, res) {
        res.json({ 
            success: true, 
            message: 'Logout successful' 
        });
    },
    
    // ========== CHANGE PASSWORD ==========
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.userId;
            
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Please provide current and new password' 
                });
            }
            
            if (newPassword.length < 6) {
                return res.status(400).json({ 
                    success: false,
                    error: 'New password must be at least 6 characters' 
                });
            }
            
            // Get current password hash
            const result = await executeQuery(
                `SELECT password_hash FROM Users WHERE UserID = @userId`,
                [{ name: 'userId', value: userId, type: sql.Int }]
            );
            
            if (result.recordset.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: 'User not found' 
                });
            }
            
            // Verify current password
            const isValid = await bcrypt.compare(currentPassword, result.recordset[0].password_hash);
            if (!isValid) {
                return res.status(401).json({ 
                    success: false,
                    error: 'Current password is incorrect' 
                });
            }
            
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Update password
            await executeQuery(
                `UPDATE Users SET password_hash = @newPassword WHERE UserID = @userId`,
                [
                    { name: 'newPassword', value: hashedPassword },
                    { name: 'userId', value: userId, type: sql.Int }
                ]
            );
            
            res.json({ 
                success: true, 
                message: 'Password changed successfully' 
            });
            
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error' 
            });
        }
    }
};

module.exports = authController;