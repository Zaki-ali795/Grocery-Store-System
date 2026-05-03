const sql = require('mssql');
const { getDb } = require('../utils/database');

const adminVerificationController = {

    async requestAdminAccess(req, res) {
        try {
            const userId = req.user.id;
            const { comments } = req.body;
            const db = await getDb();

            const userCheck = await db.request()
                .input('userId', sql.Int, userId)
                .query('SELECT admin_approved FROM Users WHERE UserID = @userId');

            if (userCheck.recordset[0].admin_approved === 1) {
                return res.status(400).json({ success: false, error: 'You are already an admin' });
            }

            const pendingCheck = await db.request()
                .input('userId', sql.Int, userId)
                .query(`SELECT * FROM AdminVerificationRequests WHERE UserID = @userId AND Status = 'pending'`);

            if (pendingCheck.recordset.length > 0) {
                return res.status(400).json({ success: false, error: 'You already have a pending admin request' });
            }

            await db.request()
                .input('userId', sql.Int, userId)
                .input('comments', sql.NVarChar, comments || null)
                .query(`INSERT INTO AdminVerificationRequests (UserID, Comments, RequestDate, Status)
                        VALUES (@userId, @comments, GETDATE(), 'pending')`);

            res.json({
                success: true,
                message: 'Admin access request submitted. You will be notified once reviewed.'
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    },

    async getVerificationStatus(req, res) {
        try {
            const userId = req.user.id;
            const db = await getDb();

            const result = await db.request()
                .input('userId', sql.Int, userId)
                .query(`SELECT TOP 1 RequestID, Status, RequestDate, ReviewedDate, Comments
                        FROM AdminVerificationRequests
                        WHERE UserID = @userId
                        ORDER BY RequestDate DESC`);

            if (result.recordset.length === 0) {
                return res.json({ success: true, status: 'none', request: null });
            }

            res.json({ success: true, status: result.recordset[0].Status, request: result.recordset[0] });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    },

    async getPendingRequests(req, res) {
        try {
            const db = await getDb();

            const result = await db.request()
                .query(`SELECT r.RequestID, r.Status, r.RequestDate, r.Comments,
                               u.UserID, u.name, u.email, u.City
                        FROM AdminVerificationRequests r
                        JOIN Users u ON r.UserID = u.UserID
                        WHERE r.Status = 'pending'
                        ORDER BY r.RequestDate ASC`);

            res.json({ success: true, requests: result.recordset });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    },

    async reviewAdminRequest(req, res) {
        try {
            const { requestId, action } = req.body;
            const adminId = req.user.id;

            if (!requestId || !['approved', 'rejected'].includes(action)) {
                return res.status(400).json({ success: false, error: 'requestId and action (approved/rejected) required' });
            }

            const db = await getDb();

            const requestResult = await db.request()
                .input('requestId', sql.Int, requestId)
                .query(`SELECT UserID FROM AdminVerificationRequests WHERE RequestID = @requestId AND Status = 'pending'`);

            if (requestResult.recordset.length === 0) {
                return res.status(404).json({ success: false, error: 'Request not found or already reviewed' });
            }

            const userId = requestResult.recordset[0].UserID;

            await db.request()
                .input('requestId', sql.Int, requestId)
                .input('reviewedBy', sql.Int, adminId)
                .input('action', sql.NVarChar, action)
                .query(`UPDATE AdminVerificationRequests
                        SET Status = @action, ReviewedBy = @reviewedBy, ReviewedDate = GETDATE()
                        WHERE RequestID = @requestId`);

            if (action === 'approved') {
                await db.request()
                    .input('userId', sql.Int, userId)
                    .input('approvedBy', sql.Int, adminId)
                    .query(`UPDATE Users
                            SET admin_approved = 1, approved_by = @approvedBy, approved_at = GETDATE()
                            WHERE UserID = @userId`);
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
