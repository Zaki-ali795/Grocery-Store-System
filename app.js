// app.js
const sql = require("mssql");
const config = require("./dbconfig");

async function connectAndQuery() 
{
    try 
    {
        console.log('Config:', config); 
        console.log('Server:', config.server); 
        
        let pool = await sql.connect(config);
        console.log('Connected successfully!');const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Home Route
app.get('/', (req, res) => 
    {
    res.json(
        {
        message: 'Online Grocery Store API',
        version: '1.0',
        endpoints: 
        {
            auth: 
            {
                signup: 'POST /api/auth/signup',
                login: 'POST /api/auth/login'
            },
            products: 
            {
                all: 'GET /api/products',
                search: 'GET /api/products/search?q=keyword',
                byId: 'GET /api/products/:id',
                byCategory: 'GET /api/products/category/:id',
                flashDeals: 'GET /api/products/flash-deals',
                alternatives: 'GET /api/products/:id/alternatives'
            },
            cart: 
            {
                view: 'GET /api/cart (requires auth token)',
                add: 'POST /api/cart/add (requires auth token)',
                update: 'PUT /api/cart/update/:itemId (requires auth token)',
                remove: 'DELETE /api/cart/remove/:itemId (requires auth token)',
                clear: 'DELETE /api/cart/clear (requires auth token)'
            },
            orders: 
            {
                checkout: 'POST /api/orders/checkout (requires auth token)',
                myOrders: 'GET /api/orders (requires auth token)',
                track: 'GET /api/orders/:id/track (requires auth token)'
            }
        }
    });
});
// Error handling middleware
app.use((err, req, res, next) => 
    {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
    });

// Start server
app.listen(PORT, () => 
    {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    module.exports = app;
        
    const result = await pool.request().query('SELECT * FROM Product');
    console.log(result.recordset);
        
    } 
    catch (error) 
    {
        console.log('Error:', error.message);
        console.log('Full error:', error);
    } finally 
    {
        await sql.close();
    }
}

connectAndQuery();