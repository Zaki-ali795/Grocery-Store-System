import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, lowStock: 0, pendingRequests: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    // Simulated Fetch: GET /api/admin/dashboard
    const fetchDashboardData = async () => {
      // Mocking data instead of real fetch for boilerplate
      setStats({ revenue: 24500, orders: 142, lowStock: 8, pendingRequests: 3 });
      setRecentOrders([
        { id: '#ORD-001', name: 'John Doe', amount: 120.50, status: 'delivered', date: '2023-10-24' },
        { id: '#ORD-002', name: 'Jane Smith', amount: 45.00, status: 'pending', date: '2023-10-25' },
        { id: '#ORD-003', name: 'Mike Ross', amount: 310.20, status: 'shipped', date: '2023-10-25' },
      ]);
    };
    fetchDashboardData();
  }, []);

  const getStatusClass = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber';
      case 'confirmed': return 'bg-blue';
      case 'shipped': return 'bg-purple';
      case 'delivered': return 'bg-green';
      case 'cancelled': return 'bg-red';
      default: return 'bg-amber';
    }
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#d1fae5', color: '#047857'}}>💰</div>
          <div className="stat-info">
            <h4>Total Revenue</h4>
            <h2>${stats.revenue.toLocaleString()}</h2>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#dbeafe', color: '#1d4ed8'}}>🛍️</div>
          <div className="stat-info">
            <h4>Total Orders</h4>
            <h2>{stats.orders}</h2>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#fef3c7', color: '#b45309'}}>⚠️</div>
          <div className="stat-info">
            <h4>Low Stock</h4>
            <h2>{stats.lowStock} Items</h2>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#fee2e2', color: '#b91c1c'}}>🛡️</div>
          <div className="stat-info">
            <h4>Pending Requests</h4>
            <h2>{stats.pendingRequests}</h2>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Recent Orders</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Name</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.name}</td>
                <td>${order.amount.toFixed(2)}</td>
                <td><span className={`status-badge ${getStatusClass(order.status)}`}>{order.status}</span></td>
                <td>{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}