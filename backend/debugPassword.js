const bcrypt = require('bcryptjs');
const { executeProcedure } = require('./utils/database');

async function debugPassword() {
    try {
        console.log('Debugging password...');

        // Get user from database
        const result = await executeProcedure('sp_LogIn', {
            email: 'admin@freshmart.com'
        });

        const user = result.recordset[0];
        console.log('Stored hash:', user.password_hash);

        // Generate new hash
        const newHash = await bcrypt.hash('admin123', 10);
        console.log('New hash would be:', newHash);

        // Test comparison
        const isValid = await bcrypt.compare('admin123', user.password_hash);
        console.log('Current hash valid:', isValid);

        // Test with new hash
        const isNewValid = await bcrypt.compare('admin123', newHash);
        console.log('New hash valid:', isNewValid);

    } catch (error) {
        console.error('Debug failed:', error.message);
    }
}

debugPassword();