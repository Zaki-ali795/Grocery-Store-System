const sql = require('mssql/msnodesqlv8');
const { getDb } = require('../utils/database');

const adminVerificationController = {
    // User requests admin access
    async requestAdminAccess(req, res) {
        try {
            const userId = req.user.userId;
            const { comments } = req.body;
            
            const db = await getDb();
            
            // Check if already admin approved
            const userCheck = await db.request()
                .input('userId', sql.Int, userId)
                .query('SELECT admin_approved FROM Users WHERE UserID = @userId');
            
            if (userCheck.recordset[0].admin_approved === 1) {
                return res.status(400).json({ error: 'You are already an admin' });
            }
            
            // Check for pending request
            const pendingCheck = await db.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT * FROM AdminVerificationRequests 
                    WHERE UserID = @userId AND Status = 'pending'
                `);
            
            if (pendingCheck.recordset.length > 0) {
                return res.status(400).json({ error: 'You already have a pending admin request' });
            }
            
            // Create request
            await db.request()
                .input('userId', sql.Int, userId)
                .input('comments', sql.NVarChar, comments || null)
                .query(`
                    INSERT INTO AdminVerificationRequests (UserID, Comments, RequestDate, Status)
                    VALUES (@userId, @comments, GETDATE(), 'pending')
                `);
            
            res.json({ 
                success: true, 
                message: 'Admin access request submitted. You will be notified once verified.' 
            });
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    
    // Admin: Approve admin request
    async approveAdminRequest(req, res) {
        try {
            const { requestId } = req.params;
            const adminId = req.user.userId;
            
            const db = await getDb();
            
            // Get the request
            const requestResult = await db.request()
                .input('requestId', sql.Int, requestId)
                .query(`
                    SELECT UserID FROM AdminVerificationRequests 
                    WHERE RequestID = @requestId AND Status = 'pending'
                `);
            
            if (requestResult.recordset.length === 0) {
                return res.status(404).json({ error: 'Request not found or already reviewed' });
            }
            
            const userId = requestResult.recordset[0].UserID;
            
            // Update the verification request
            await db.request()
                .input('requestId', sql.Int, requestId)
                .input('reviewedBy', sql.Int, adminId)
                .query(`
                    UPDATE AdminVerificationRequests 
                    SET Status = 'approved', 
                        ReviewedBy = @reviewedBy, 
                        ReviewedDate = GETDATE()
                    WHERE RequestID = @requestId
                `);
            
            // Update user's admin_approved flag (NOT role!)
            await db.request()
                .input('userId', sql.Int, userId)
                .input('approvedBy', sql.Int, adminId)
                .query(`
                    UPDATE Users 
                    SET admin_approved = 1, 
                        approved_by = @approvedBy,
                        approved_at = GETDATE()
                    WHERE UserID = @userId
                `);
            
            res.json({ 
                success: true, 
                message: 'Admin request approved successfully' 
            });
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = adminVerificationController;