import React, { useState, useEffect } from 'react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    // Simulated Fetch: GET /api/admin/orders
    setOrders([
      { id: 'ORD-991', customer: 'Alice Wong', total: 89.90, method: 'Card', payment: 'Paid', status: 'pending', date: 'Oct 26, 2023', items: [{name: 'Apples', qty: 2, price: 4.5}, {name: 'Milk', qty: 1, price: 4.5}] },
      { id: 'ORD-992', customer: 'Bob Smith', total: 12.50, method: 'COD', payment: 'Unpaid', status: 'shipped', date: 'Oct 25, 2023', items: [{name: 'Bread', qty: 1, price: 3.2}] }
    ]);
  }, []);

  const handleStatusChange = (id, newStatus) => {
    // Simulated PUT /api/admin/orders/:id/status
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <select className="form-control" style={{width: '200px'}}>
          <option>All Statuses</option>
          <option>Pending</option>
          <option>Shipped</option>
        </select>
        <input type="text" className="form-control" placeholder="Search Order ID..." style={{width: '300px'}} />
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <React.Fragment key={order.id}>
              <tr style={{cursor: 'pointer'}} onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                <td><b>{order.id}</b></td>
                <td>{order.customer}</td>
                <td>${order.total.toFixed(2)}</td>
                <td>
                  <span className={`status-badge ${order.status === 'pending' ? 'bg-amber' : 'bg-purple'}`}>{order.status}</span>
                </td>
                <td>{order.date}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select 
                    className="form-control" 
                    value={order.status} 
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </td>
              </tr>
              {expandedOrderId === order.id && (
                <tr style={{background: '#f8f9fa'}}>
                  <td colSpan="6" style={{padding: '20px'}}>
                    <h4 style={{marginBottom: '10px'}}>Order Items:</h4>
                    <ul>
                      {order.items.map((item, idx) => (
                        <li key={idx}>- {item.qty}x {item.name} ($ {item.price})</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}