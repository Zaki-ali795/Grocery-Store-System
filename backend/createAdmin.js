const bcrypt = require('bcryptjs'); // Standard import
const sql = require('mssql');

const config = {
    server: 'DESKTOP-OBE55B8\\SQLEXPRESS',
    database: 'FreshMartDB',
    driver: 'msnodesqlv8',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        trustedConnection: true
    }
};

async function createMasterAdmin() {
    console.log("⏳ Connecting to the database...");
    try {
        const pool = await sql.connect(config);
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await pool.request()
            .input('name', sql.NVarChar, 'Master Admin')
            .input('email', sql.NVarChar, 'admin@freshmart.com')
            .input('hash', sql.NVarChar, hashedPassword)
            .input('city', sql.NVarChar, 'Headquarters')
            .query(`
                INSERT INTO Users (name, email, password_hash, City, role, admin_approved) 
                VALUES (@name, @email, @hash, @city, 'customer', 1)
            `);
        
        console.log("🎉 Master Admin created successfully!");
        await sql.close();
        process.exit(0);
    } catch (err) {
        if (err.message.includes('Violation of UNIQUE KEY constraint')) {
            console.log("⚠️ Success: Admin already exists!");
        } else {
            console.error("❌ Error:", err.message);
        }
        process.exit(1);
    }
}
createMasterAdmin();