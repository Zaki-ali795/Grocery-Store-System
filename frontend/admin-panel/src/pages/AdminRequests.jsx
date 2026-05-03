import React, { useState, useEffect } from 'react';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  useEffect(() => {
    // Simulated Fetch: GET /api/admin/requests
    setRequests([
      { id: 1, name: 'Sarah Connor', email: 'sarah@freshmart.com', city: 'New York', date: 'Oct 26, 2023', status: 'pending' },
      { id: 2, name: 'Tom Hardy', email: 'tom@freshmart.com', city: 'Chicago', date: 'Oct 24, 2023', status: 'approved' },
    ]);
  }, []);

  const handleApprove = (id) => {
    // Simulated PUT /api/admin/requests/:id/approve
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  };

  const openRejectModal = (id) => {
    setSelectedRequestId(id);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = (e) => {
    e.preventDefault();
    // Simulated PUT /api/admin/requests/:id/reject
    setRequests(requests.map(r => r.id === selectedRequestId ? { ...r, status: 'rejected' } : r));
    setRejectModalOpen(false);
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div>
      <div className="table-container">
        <div className="table-header">
          <h3>Requests <span className="badge" style={{position: 'static', padding: '4px 10px'}}>{pendingCount} Pending</span></h3>
        </div>
        
        {requests.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#6c757d'}}>
            <h2>🛡️ No pending requests</h2>
            <p>You're all caught up!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>City</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td>{req.name}</td>
                  <td>{req.email}</td>
                  <td>{req.city}</td>
                  <td>{req.date}</td>
                  <td>
                    <span className={`status-badge ${req.status === 'pending' ? 'bg-amber' : req.status === 'approved' ? 'bg-green' : 'bg-red'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td>
                    {req.status === 'pending' && (
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button className="btn btn-primary" onClick={() => handleApprove(req.id)}>Approve</button>
                        <button className="btn btn-danger" onClick={() => openRejectModal(req.id)}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rejectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Reject Admin Request</h2>
            <form onSubmit={handleRejectConfirm}>
              <div className="form-group">
                <label>Reason for rejection (Optional)</label>
                <textarea className="form-control" rows="4" placeholder="Type reason here..."></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setRejectModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger">Confirm Reject</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}