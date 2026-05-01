const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { getDb } = require('../utils/database');

const JWT_SECRET = process.env.JWT_SECRET || 'freshmart-secret-key-2024';

const authController = {
    // REGISTRATION - Always creates customer role
    async register(req, res) {
        try {
            const { name, email, password, phone_no, address, city, role } = req.body;
            
            if (!name || !email || !password || !city) {
                return res.status(400).json({ error: 'Please fill in all required fields' });
            }
            
            const db = await getDb();
            
            // Check if user exists
            const checkUser = await db.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT UserID FROM Users WHERE email = @email');
            
            if (checkUser.recordset.length > 0) {
                return res.status(409).json({ error: 'Email already registered' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // ALWAYS create as customer (role forced to 'customer')
            await db.request()
                .input('name', sql.NVarChar, name)
                .input('email', sql.NVarChar, email)
                .input('password_hash', sql.NVarChar, hashedPassword)
                .input('phone_no', sql.NVarChar, phone_no || null)
                .input('address', sql.NVarChar, address || null)
                .input('city', sql.NVarChar, city)
                .query(`
                    INSERT INTO Users (name, email, password_hash, phone_no, Address, City, role, created_at, admin_approved)
                    VALUES (@name, @email, @password_hash, @phone_no, @address, @city, 'customer', GETDATE(), 0)
                `);
            
            res.status(201).json({ 
                success: true, 
                message: 'Account created successfully. You can now login as customer.' 
            });
            
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    
    // LOGIN - The code you asked about goes HERE
    async login(req, res) {
        try {
            const { email, password, role } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ error: 'Please enter both email and password' });
            }
            
            const db = await getDb();
            
            // Get user from database
            const result = await db.request()
                .input('email', sql.NVarChar, email)
                .query(`
                    SELECT UserID, name, email, password_hash, role, admin_approved 
                    FROM Users 
                    WHERE email = @email
                `);
            
            if (result.recordset.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            
            const user = result.recordset[0];
            
            // Verify password
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            
            // Handle role-based login
            if (role === 'customer') {
                // ALWAYS allowed for any user
                const token = jwt.sign(
                    { 
                        userId: user.UserID, 
                        email: user.email, 
                        role: 'customer',
                        name: user.name
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                return res.json({ 
                    success: true,
                    token, 
                    role: 'customer',
                    user: {
                        id: user.UserID,
                        name: user.name,
                        email: user.email,
                        role: 'customer'
                    }
                });
                
            } else if (role === 'admin') {
                // Check if user has admin approval
                if (user.admin_approved === 1) {
                    const token = jwt.sign(
                        { 
                            userId: user.UserID, 
                            email: user.email, 
                            role: 'admin',
                            name: user.name
                        },
                        JWT_SECRET,
                        { expiresIn: '8h' }  // Shorter expiry for admin
                    );
                    
                    return res.json({ 
                        success: true,
                        token, 
                        role: 'admin',
                        user: {
                            id: user.UserID,
                            name: user.name,
                            email: user.email,
                            role: 'admin'
                        }
                    });
                } else {
                    return res.status(403).json({ 
                        error: 'Not authorized as admin. Please request admin access first.' 
                    });
                }
            } else {
                return res.status(400).json({ error: 'Invalid role specified' });
            }
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    
    // Get current user (works for both customer and admin)
    async getCurrentUser(req, res) {
        try {
            const userId = req.user.userId;
            const db = await getDb();
            
            const result = await db.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT UserID, name, email, phone_no, Address, City, role, admin_approved, created_at
                    FROM Users 
                    WHERE UserID = @userId
                `);
            
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ success: true, user: result.recordset[0] });
            
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    
    // Logout
    async logout(req, res) {
        res.json({ success: true, message: 'Logout successful' });
    }
};

module.exports = authController;