const bcrypt = require('bcryptjs');
const { executeQuery } = require('./utils/database');

async function createAdminUser() {
    try {
        console.log('⏳ Creating admin user...');

        // Hash the password
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert admin user
        const query = `
            INSERT INTO Users (name, email, password_hash, City, role, admin_approved)
            VALUES ('Master Admin', 'admin@freshmart.com', '${hashedPassword}', 'Headquarters', 'admin', 1)
        `;

        await executeQuery(query);

        console.log('✅ Admin user created successfully!');
        console.log('Email: admin@freshmart.com');
        console.log('Password: admin123');

    } catch (error) {
        if (error.message.includes('Violation of UNIQUE KEY constraint')) {
            console.log('⚠️ Admin user already exists!');
        } else {
            console.error('❌ Error creating admin user:', error.message);
        }
    }
}

createAdminUser();