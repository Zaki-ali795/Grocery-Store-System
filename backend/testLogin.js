const bcrypt = require('bcryptjs');
const { executeProcedure } = require('./utils/database');

async function testLogin() {
    try {
        console.log('Testing login...');

        // Get user from database
        const result = await executeProcedure('sp_LogIn', {
            email: 'admin@freshmart.com'
        });

        const user = result.recordset[0];
        console.log('User found:', user.name);

        // Test password
        const isValid = await bcrypt.compare('admin123', user.password_hash);
        console.log('Password valid:', isValid);

        if (isValid) {
            console.log('✅ Login test successful!');
        } else {
            console.log('❌ Password verification failed');
        }

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testLogin();