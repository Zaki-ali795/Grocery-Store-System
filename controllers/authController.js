const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { executeProcedure, executeQuery } = require('../utils/database');

const JWT_SECRET = process.env.JWT_SECRET || 'freshmart-secret-key-2024';

const authController = {

    async register(req, res) {
        try {
            const { name, email, password, phone_no, address, city } = req.body;

            if (!name || !email || !password || !city) {
                return res.status(400).json({
                    success: false,
                    error: 'Please fill in all required fields'
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide a valid email address'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Password must be at least 6 characters long'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            try {
                await executeProcedure('sp_SignUp', {
                    name: name,
                    email: email,
                    password_hash: hashedPassword,
                    phone_no: phone_no || null,
                    Address: address || null,
                    City: city
                });

                res.status(201).json({
                    success: true,
                    message: 'Account created successfully. Please login.',
                    email: email
                });

            } catch (procError) {
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

    // ✅ UPDATED LOGIN - Works with dual-role schema
    async login(req, res) {
        try {
            const { email, password, role } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Please enter both email and password'
                });
            }

            // Get user from database - note role is always 'customer' in DB
            const result = await executeQuery(
                `SELECT UserID, name, email, password_hash, phone_no, Address, City, 
                        role, admin_approved, approved_at
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

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            // ✅ Determine access based on admin_approved, not role
            let tokenRole = 'customer';
            let isAdminUser = false;

            if (role === 'admin') {
                if (user.admin_approved === 1) {
                    tokenRole = 'admin';
                    isAdminUser = true;
                } else {
                    return res.status(403).json({
                        success: false,
                        error: 'Not authorized as admin. Your admin request may be pending or rejected.'
                    });
                }
            }

            // ✅ Generate token - role in token is for frontend display only
            const token = jwt.sign(
                {
                    userId: user.UserID,
                    email: user.email,
                    role: tokenRole,  // 'customer' or 'admin' for frontend
                    name: user.name,
                    isAdmin: user.admin_approved === 1  // Add this flag
                },
                JWT_SECRET,
                { expiresIn: tokenRole === 'admin' ? '8h' : '24h' }
            );

            res.json({
                success: true,
                message: `Login successful as ${tokenRole}`,
                token: token,
                role: tokenRole,
                name: user.name,
                isAdmin: user.admin_approved === 1,
                user: {
                    id: user.UserID,
                    name: user.name,
                    email: user.email,
                    phone: user.phone_no,
                    address: user.Address,
                    city: user.City,
                    role: 'customer',  // Always 'customer' from DB
                    isAdmin: user.admin_approved === 1,  // This tells frontend if admin
                    canAccessAdmin: user.admin_approved === 1
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
                `SELECT UserID, name, email, phone_no, Address, City, role, admin_approved, approved_at, created_at
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

            const user = result.recordset[0];

            res.json({
                success: true,
                user: {
                    id: user.UserID,
                    name: user.name,
                    email: user.email,
                    phone: user.phone_no,
                    address: user.Address,
                    city: user.City,
                    role: user.role,  // Always 'customer'
                    isAdmin: user.admin_approved === 1,
                    adminApproved: user.admin_approved === 1,
                    approvedAt: user.approved_at
                }
            });

        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    async logout(req, res) {
        res.json({
            success: true,
            message: 'Logout successful'
        });
    },

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

            const isValid = await bcrypt.compare(currentPassword, result.recordset[0].password_hash);
            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Current password is incorrect'
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

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
    },

    // ✅ New: Check if user is admin (for frontend)
    async checkAdminStatus(req, res) {
        try {
            const userId = req.user.userId;

            const result = await executeQuery(
                `SELECT admin_approved FROM Users WHERE UserID = @userId`,
                [{ name: 'userId', value: userId, type: sql.Int }]
            );

            res.json({
                success: true,
                isAdmin: result.recordset[0]?.admin_approved === 1
            });

        } catch (error) {
            console.error('Check admin error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
};

module.exports = authController;