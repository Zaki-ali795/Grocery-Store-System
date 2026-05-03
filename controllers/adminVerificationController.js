const sql = require('mssql/msnodesqlv8');
const { getDb } = require('../utils/database');

const adminVerificationController = {
    // User requests admin access
    async requestAdminAccess(req, res) 
    {
        try 
        {
            const userId = req.user.userId || req.user.id; // Support both naming conventions
            const { comments } = req.body;
            
            const db = await getDb();
            
            // Check if already admin approved
            const userCheck = await db.request()
                .input('userId', sql.Int, userId)
                .query(`SELECT admin_approved
                        FROM Users 
                        WHERE UserID = @userId`);
            
            if (userCheck.recordset[0].admin_approved === 1) 
            {
                return res.status(400).json({ success: false, error: 'You are already an admin' });
            }
            
            // Check for pending request
            const pendingCheck = await db.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT * FROM AdminVerificationRequests 
                    WHERE UserID = @userId AND Status = 'pending'
                `);
            
            if (pendingCheck.recordset.length > 0) 
            {
                return res.status(400).json({ success: false, error: 'You already have a pending admin request' });
            }
            
            // Create request
            await db.request()
                .input('userId', sql.Int, userId)
                .input('comments', sql.NVarChar, comments || null)
                .query(`
                    INSERT INTO AdminVerificationRequests (UserID, Comments, RequestDate, Status)
                    VALUES (@userId, @comments, GETDATE(), 'pending')
                `);
            
            res.json
            ({ 
                success: true, 
                message: 'Admin access request submitted. You will be notified once reviewed.' 
            });
            
        } 
        catch (error) 
        {
            console.error(error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    },
    
    // Get user's verification status
    async getVerificationStatus(req, res) 
    {
        try 
        {
            const userId = req.user.userId || req.user.id;
            const db = await getDb();

            const result = await db.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT TOP 1 RequestID, Status, RequestDate, ReviewedDate, Comments
                    FROM AdminVerificationRequests
                    WHERE UserID = @userId
                    ORDER BY RequestDate DESC
                `);

            if (result.recordset.length === 0) 
            {
                return res.json({ success: true, status: 'none', request: null });
            }

            res.json
            ({ 
                success: true, 
                status: result.recordset[0].Status, 
                request: result.recordset[0] 
            });

        } catch (error) 
        {
            console.error(error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    },

    // Admin: Get all pending requests
    async getPendingRequests(req, res) 
    {
        try 
        {
            const db = await getDb();

            const result = await db.request()
                .query(`
                    SELECT r.RequestID, r.Status, r.RequestDate, r.Comments,
                           u.UserID, u.name, u.email, u.City
                    FROM AdminVerificationRequests r
                    JOIN Users u ON r.UserID = u.UserID
                    WHERE r.Status = 'pending'
                    ORDER BY r.RequestDate ASC
                `);

            res.json({ success: true, requests: result.recordset });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    },

    // Admin: Approve admin request (original method)
    async approveAdminRequest(req, res) {
        try {
            const { requestId } = req.params;
            const adminId = req.user.userId || req.user.id;
            
            const db = await getDb();
            
            // Get the request
            const requestResult = await db.request()
                .input('requestId', sql.Int, requestId)
                .query(`
                    SELECT UserID FROM AdminVerificationRequests 
                    WHERE RequestID = @requestId AND Status = 'pending'
                `);
            
            if (requestResult.recordset.length === 0) {
                return res.status(404).json({ success: false, error: 'Request not found or already reviewed' });
            }
            
            const userId = requestResult.recordset[0].UserID;
            
            // Update the verification request
            await db.request()
                .input('requestId', sql.Int, requestId)
                .input('reviewedBy', sql.Int, adminId)
                .query(`
                    UPDATE AdminVerificationRequests 
                    SET Status = 'approved',ReviewedBy = @reviewedBy, ReviewedDate = GETDATE()
                    WHERE RequestID = @requestId
                `);
            
            // Update user's admin_approved flag
            await db.request()
                .input('userId', sql.Int, userId)
                .input('approvedBy', sql.Int, adminId)
                .query(`
                    UPDATE Users 
                    SET admin_approved = 1,approved_by = @approvedBy,approved_at = GETDATE()
                    WHERE UserID = @userId
                `);
            
            res.json({ 
                success: true, 
                message: 'Admin request approved successfully' 
            });
            
        } catch (error) 
        {
            console.error(error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    },

    // Admin: Review admin request (approve/reject)
    async reviewAdminRequest(req, res) 
    {
        try 
        {
            const { requestId, action } = req.body;
            const adminId = req.user.userId || req.user.id;

            if (!requestId || !['approved', 'rejected'].includes(action)) 
            {
                return res.status(400).json({ 
                    success: false, 
                    error: 'requestId and action (approved/rejected) required' 
                });
            }

            const db = await getDb();

            // Get the request
            const requestResult = await db.request()
                .input('requestId', sql.Int, requestId)
                .query(`
                    SELECT UserID 
                    FROM AdminVerificationRequests 
                    WHERE RequestID = @requestId AND Status = 'pending'
                `);

            if (requestResult.recordset.length === 0) 
            {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Request not found or already reviewed' 
                });
            }

            const userId = requestResult.recordset[0].UserID;

            // Update the verification request
            await db.request()
                .input('requestId', sql.Int, requestId)
                .input('reviewedBy', sql.Int, adminId)
                .input('action', sql.NVarChar, action)
                .query(`
                    UPDATE AdminVerificationRequests
                    SET Status = @action, ReviewedBy = @reviewedBy, ReviewedDate = GETDATE()
                    WHERE RequestID = @requestId
                `);

            // If approved, update user's admin_approved flag
            if (action === 'approved') {
                await db.request()
                    .input('userId', sql.Int, userId)
                    .input('approvedBy', sql.Int, adminId)
                    .query(`
                        UPDATE Users
                        SET admin_approved = 1, approved_by = @approvedBy, approved_at = GETDATE()
                        WHERE UserID = @userId
                    `);
            }

            res.json({
                success: true,
                message: `Request ${action} successfully`
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
};

module.exports = adminVerificationController;