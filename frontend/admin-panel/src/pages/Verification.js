import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ShieldAlert } from 'lucide-react';
import axios from 'axios';

export default function Verification() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch REAL pending requests from the backend
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Since you haven't built the login UI yet, we need a way to prove we are an admin.
        // For development, we are hitting the endpoint. Make sure your backend has the token!
        // If your backend blocks this because you have no token, let me know and we will bypass auth temporarily.
        const response = await axios.get('http://localhost:3000/api/admin-verify/pending', {
             // We will add the token here later once login is built
        });
        
        if (response.data.success) {
            setRequests(response.data.requests);
        } else {
            setError("Failed to load requests.");
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
        setError("Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, []);

  // 2. Handle the Approve Action
  const handleApprove = async (id) => {
    try {
        // Hit the backend approve endpoint
        await axios.post(`http://localhost:3000/api/admin-verify/approve/${id}`, {}, {
            // Headers for token will go here
        });
        
        // Remove the approved card from the screen immediately
        setRequests(requests.filter(req => req.RequestID !== id));
        alert(`Request ${id} approved! User is now an admin.`);
        
    } catch (error) {
        console.error("Error approving request:", error);
        alert("Failed to approve the request.");
    }
  };

  // 3. Handle the Reject Action (If you decide to build a reject endpoint)
  const handleReject = (id) => {
    alert(`Rejected Request ID: ${id}. Note: You need a reject endpoint on the backend to finalize this.`);
    setRequests(requests.filter(req => req.RequestID !== id));
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading live requests...</div>;
  if (error) return <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '24px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #f4f7f6', paddingBottom: '16px' }}>
        <ShieldAlert size={28} color="#f59e0b" style={{ marginRight: '12px' }} />
        <h2 style={{ margin: 0, color: '#1f2937' }}>Pending Admin Requests</h2>
      </div>

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <CheckCircle size={48} color="#10b981" style={{ marginBottom: '16px' }} />
          <h3>All caught up!</h3>
          <p>There are no pending admin requests in the database.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {requests.map((req) => (
            <motion.div 
              key={req.RequestID}
              whileHover={{ y: -5 }}
              style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', backgroundColor: '#f9fafb' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  {/* Note: Adjust 'userName' based on exactly what your backend SQL returns */}
                  <h3 style={{ margin: '0 0 4px 0', color: '#111827' }}>User ID: {req.UserID}</h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Requested: {new Date(req.RequestDate).toLocaleDateString()}</p>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  <Clock size={12} style={{ marginRight: '4px' }} /> Pending
                </span>
              </div>
              
              <div style={{ marginTop: '16px', backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #f3f4f6', fontSize: '14px', color: '#4b5563' }}>
                <strong>Message:</strong> "{req.Comments || "No additional comments provided."}"
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => handleApprove(req.RequestID)}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <CheckCircle size={18} style={{ marginRight: '6px' }} /> Approve
                </button>
                <button 
                  onClick={() => handleReject(req.RequestID)}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <XCircle size={18} style={{ marginRight: '6px' }} /> Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}