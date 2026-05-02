const API = 'http://localhost:3000/api';

// Session helpers
function getSession() {
    const raw = localStorage.getItem('freshmart_user') || sessionStorage.getItem('freshmart_user');
    return raw ? JSON.parse(raw) : null;
}

function authHeaders() {
    const session = getSession();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.token}`
    };
}

// Redirect if not logged in
const session = getSession();
if (!session) window.location.href = 'index.html';
else document.getElementById('user-name').textContent = session.name || session.email;

// Toast
function showToast(message, isError = false) {
    const existing = document.querySelector('.toast-message');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-message' + (isError ? ' error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Logout
function logout() {
    localStorage.removeItem('freshmart_user');
    sessionStorage.removeItem('freshmart_user');
    window.location.href = 'index.html';
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

// Status badge class
function statusClass(status) {
    const map = {
        pending: 'status-pending',
        confirmed: 'status-confirmed',
        shipped: 'status-shipped',
        delivered: 'status-delivered',
        cancelled: 'status-cancelled'
    };
    return map[status] || 'status-pending';
}

// Load all orders
async function loadOrders() {
    try {
        const res = await fetch(`${API}/orders`, { headers: authHeaders() });
        const data = await res.json();

        const container = document.getElementById('orders-list');

        if (!data.success || data.orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>You have no orders yet</p>
                    <a href="customer-dashboard.html" class="shop-btn">
                        <i class="fas fa-store"></i> Start Shopping
                    </a>
                </div>`;
            return;
        }

        container.innerHTML = data.orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div class="order-id">Order #${order.OrderID}</div>
                        <div class="order-date">${formatDate(order.orderDate)}</div>
                    </div>
                    <span class="order-status ${statusClass(order.status)}">${order.status}</span>
                </div>
                <div class="order-body">
                    <div class="order-meta">
                        <span><i class="fas fa-map-marker-alt"></i>${order.delivery_address || '—'}</span>
                        <span><i class="fas fa-credit-card"></i>${order.payment_method || 'Cash'}</span>
                    </div>
                    <div class="order-total">Rs. ${parseFloat(order.total_amount).toFixed(0)}</div>
                    <div class="order-actions">
                        <button class="action-btn" onclick="trackOrder(${order.OrderID})">
                            <i class="fas fa-map-pin"></i> Track
                        </button>
                        <button class="action-btn" onclick="viewDetails(${order.OrderID})">
                            <i class="fas fa-list"></i> Details
                        </button>
                    </div>
                </div>
            </div>`).join('');

    } catch {
        showToast('Failed to load orders', true);
    }
}

// Track order — shows status timeline
async function trackOrder(orderId) {
    openModal(`Tracking — Order #${orderId}`, '<p style="color:#6c757d">Loading...</p>');
    try {
        const res = await fetch(`${API}/orders/${orderId}/track`, { headers: authHeaders() });
        const data = await res.json();

        if (!data.success) { showToast('Order not found', true); closeModalDirect(); return; }

        const order = data.order;
        const steps = ['pending', 'confirmed', 'shipped', 'delivered'];
        const currentIndex = steps.indexOf(order.status);

        const stepsHTML = steps.map((step, i) => {
            const done = i < currentIndex;
            const current = i === currentIndex;
            return `
            <div class="track-step ${done ? 'done' : ''} ${current ? 'current' : ''}">
                <div class="step-dot">
                    ${done ? '<i class="fas fa-check"></i>' : (i + 1)}
                </div>
                <div class="step-label">${step.charAt(0).toUpperCase() + step.slice(1)}</div>
            </div>`;
        }).join('');

        document.getElementById('modal-body').innerHTML = `
            <div style="margin-bottom:1rem">
                <div style="font-size:0.85rem;color:#6c757d">Ordered on ${formatDate(order.orderDate)}</div>
                <div style="font-size:0.85rem;color:#6c757d;margin-top:0.3rem">
                    <i class="fas fa-map-marker-alt" style="color:#2c6e2f"></i> ${order.delivery_address || '—'}
                </div>
            </div>
            <div class="track-steps">${stepsHTML}</div>
            <div style="font-size:0.85rem;color:#6c757d;border-top:1px solid #f0f0f0;padding-top:0.8rem">
                Payment: <strong>${order.payment_method || 'Cash'}</strong> —
                <span style="color:${order.payment_status === 'completed' ? '#2c6e2f' : '#856404'}">
                    ${order.payment_status || 'pending'}
                </span>
            </div>`;

    } catch {
        showToast('Failed to load tracking', true);
        closeModalDirect();
    }
}

// View order details — shows item breakdown
async function viewDetails(orderId) {
    openModal(`Order #${orderId} — Details`, '<p style="color:#6c757d">Loading...</p>');
    try {
        const res = await fetch(`${API}/orders/${orderId}/details`, { headers: authHeaders() });
        const data = await res.json();

        if (!data.success) { showToast('Order not found', true); closeModalDirect(); return; }

        const { order, items } = data;

        const itemsHTML = items.map(item => `
            <div class="modal-item">
                <div>
                    <div class="modal-item-name">${item.name}</div>
                    <div class="modal-item-qty">${item.quantity} × Rs. ${parseFloat(item.unit_price).toFixed(0)} / ${item.unit}</div>
                </div>
                <div class="modal-item-price">Rs. ${parseFloat(item.subtotal).toFixed(0)}</div>
            </div>`).join('');

        document.getElementById('modal-body').innerHTML = `
            <div style="margin-bottom:1rem;font-size:0.85rem;color:#6c757d">
                <span><i class="fas fa-calendar" style="color:#2c6e2f"></i> ${formatDate(order.orderDate)}</span>
                &nbsp;&nbsp;
                <span class="order-status ${statusClass(order.status)}" style="font-size:0.78rem">${order.status}</span>
            </div>
            ${itemsHTML}
            <div class="modal-total">
                <span>Total</span>
                <span style="color:#2c6e2f">Rs. ${parseFloat(order.total_amount).toFixed(0)}</span>
            </div>
            <div style="margin-top:1rem;font-size:0.85rem;color:#6c757d">
                <i class="fas fa-map-marker-alt" style="color:#2c6e2f"></i> ${order.delivery_address || '—'}
                &nbsp;&nbsp;
                <i class="fas fa-credit-card" style="color:#2c6e2f"></i> ${order.payment_method || 'Cash'}
            </div>`;

    } catch {
        showToast('Failed to load details', true);
        closeModalDirect();
    }
}

// Modal helpers
function openModal(title, bodyHTML) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-overlay').classList.add('open');
}

function closeModal(e) {
    if (e.target === document.getElementById('modal-overlay')) closeModalDirect();
}

function closeModalDirect() {
    document.getElementById('modal-overlay').classList.remove('open');
}

// Init
loadOrders();
