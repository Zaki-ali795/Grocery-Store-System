const express = require('express');
const cors = require('cors');
const { getDb, closeDb } = require('./utils/database');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration - Allow React frontend on ports 3001 and 3002
const corsOptions = {
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3002', 'http://127.0.0.1:3002'], // React dev server
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminVerificationRoutes = require('./routes/adminVerifyRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin-verify', adminVerificationRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Test database connection
        await getDb();
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            server: 'running'
        });
    } catch (err) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: err.message
        });
    }
});

// Home Route
app.get('/', (req, res) => {
    res.json({
        message: 'Fresh Mart API is running successfully!',
        status: 'Active',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            products: '/api/products',
            cart: '/api/cart',
            orders: '/api/orders',
            admin: '/api/admin-verify',
            health: '/api/health'
        }
    });
});

// 404 Handler - Express 5 compatible
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
    });
});

// Start server with database connection test
const server = app.listen(PORT, async () => {
    console.log(`🚀 Fresh Mart Server running on http://localhost:${PORT}`);
    console.log(`📡 CORS enabled for React frontend on port 3001`);

    // Test database connection at startup
    try {
        await getDb();
        console.log('✅ Database connection verified at startup (Windows Auth)');
    } catch (err) {
        console.error('❌ Database connection failed at startup:', err.message);
        console.error('💡 Check your SQL Server configuration and .env file');
        process.exit(1);
    }
});

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(async () => {
        await closeDb();
        console.log('✅ Graceful shutdown complete');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(async () => {
        await closeDb();
        console.log('✅ Graceful shutdown complete');
        process.exit(0);
    });
});

module.exports = app;