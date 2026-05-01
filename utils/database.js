const sql = require('mssql');
const config = require('../dbconfig');

let pool = null;

async function getDb() {
    if (!pool) {
        pool = await sql.connect(config);
        console.log('✅ Database connected');
    }
    return pool;
}

// For regular queries
async function executeQuery(query, params = []) {
    const db = await getDb();
    const request = db.request();
    
    params.forEach(param => {
        request.input(param.name, param.type || sql.NVarChar, param.value);
    });
    
    return await request.query(query);
}

// For stored procedures
async function executeProcedure(procedureName, params = {}) {
    const db = await getDb();
    const request = db.request();
    
    Object.keys(params).forEach(key => {
        request.input(key, params[key]);
    });
    
    return await request.execute(procedureName);
}

module.exports = { getDb, executeQuery, executeProcedure };