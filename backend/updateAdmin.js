const bcrypt = require('bcryptjs');
const { executeQuery } = require('./utils/database');

async function updateAdminPassword() {
    try {
        console.log('⏳ Updating admin password...');

        // Hash the password
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('New hash:', hashedPassword);

        // Update admin user
        const query = `
            UPDATE Users
            SET password_hash = '${hashedPassword}'
            WHERE email = 'admin@freshmart.com'
        `;

        await executeQuery(query);

        console.log('✅ Admin password updated successfully!');
        console.log('Email: admin@freshmart.com');
        console.log('Password: admin123');

    } catch (error) {
        console.error('❌ Error updating admin password:', error.message);
    }
}

updateAdminPassword();