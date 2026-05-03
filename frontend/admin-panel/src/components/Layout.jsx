import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/admin/dashboard': return 'Dashboard Overview';
      case '/admin/products': return 'Inventory Management';
      case '/admin/orders': return 'Orders';
      case '/admin/requests': return 'Admin Access Requests';
      default: return 'FreshMart Admin';
    }
  };

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>🌿</span> FreshMart
        </div>
        <nav className="nav-links">
          <NavLink to="/admin/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/admin/products" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            📦 Products
          </NavLink>
          <NavLink to="/admin/orders" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            🛍️ Orders
          </NavLink>
          <NavLink to="/admin/requests" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            🛡️ Admin Requests
          </NavLink>
        </nav>
        <button onClick={handleLogout} className="logout-btn">
          🚪 Logout
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="header">
          <h2>{getPageTitle()}</h2>
          <input type="text" className="header-search" placeholder="Search anything..." />
          <div className="header-right">
            <div className="bell-icon">
              🔔 <span className="badge">3</span>
            </div>
            <div className="profile">
              <div className="avatar">A</div>
              <span>Admin User</span>
              <span>▼</span>
            </div>
          </div>
        </header>
        
        <section className="content-area">
          <Outlet />
        </section>
      </main>
    </div>
  );
}