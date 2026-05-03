require('dotenv').config();
const sql = require('mssql/msnodesqlv8');

// BULLETPROOF CONFIGURATION FOR WINDOWS AUTHENTICATION
// This configuration uses the native Windows driver (msnodesqlv8) with ODBC Driver 17
// to avoid ETIMEOUT, ELOGIN, and HY007 (prepared statement) errors
const config = {
    // Server configuration
    server: process.env.DB_SERVER || 'DESKTOP-OBE55B8',
    instance: process.env.DB_INSTANCE || 'SQLEXPRESS',
    database: process.env.DB_NAME || 'FreshMartDB',

    // CRITICAL: Use ODBC Driver 17 for SQL Server (not 18 or default Tedious)
    // This prevents HY007 "Associated statement is not prepared" errors
    driver: 'ODBC Driver 17 for SQL Server',

    // Windows Authentication settings
    authentication: {
        type: 'default',
        options: {
            userName: process.env.DB_USERNAME || undefined,
            password: process.env.DB_PASSWORD || undefined
        }
    },

    // Connection options for Windows Auth
    options: {
        trustedConnection: true,  // Use Windows Authentication
        trustServerCertificate: true,  // Trust self-signed certificates
        encrypt: false,  // Disable encryption for local connections
        enableKeepAlive: true,
        connectionTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 30000,
        requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT) || 30000,
        pool: {
            min: parseInt(process.env.DB_POOL_MIN) || 2,
            max: parseInt(process.env.DB_POOL_MAX) || 10,
            idleTimeoutMillis: 30000
        }
    }
};

let pool = null;

// Get or create connection pool
async function getDb() {
    if (!pool) {
        try {
            pool = await sql.connect(config);
            console.log('✅ Database connected successfully (Windows Auth)');
        } catch (err) {
            console.error('❌ Database connection failed:', err);
            pool = null; // Reset pool on error
            throw err;
        }
    }
    return pool;
}

// Close pool gracefully
async function closeDb() {
    if (pool) {
        try {
            await pool.close();
            console.log('✅ Database connection closed');
            pool = null;
        } catch (err) {
            console.error('❌ Error closing database:', err);
        }
    }
}

// Execute query with parameters (prevents SQL injection)
async function executeQuery(query, params = []) {
    try {
        const db = await getDb();
        const request = db.request();

        params.forEach(param => {
            request.input(param.name, param.type || sql.NVarChar, param.value);
        });

        return await request.query(query);
    } catch (err) {
        console.error('Query execution failed:', err.message);
        throw err;
    }
}

// Execute stored procedure
async function executeProcedure(procedureName, params = {}) {
    try {
        const db = await getDb();
        const request = db.request();

        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });

        return await request.execute(procedureName);
    } catch (err) {
        console.error('Procedure execution failed:', err.message);
        throw err;
    }
}

module.exports = { getDb, closeDb, executeQuery, executeProcedure, sql, config };