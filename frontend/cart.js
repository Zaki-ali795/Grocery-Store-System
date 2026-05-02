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

// Load cart
async function loadCart() {
    try {
        const res = await fetch(`${API}/cart`, { headers: authHeaders() });
        const data = await res.json();

        if (!data.success) {
            showToast('Failed to load cart', true);
            return;
        }

        renderCart(data.cart);
    } catch {
        showToast('Connection error', true);
    }
}

// Render cart
function renderCart(cart) {
    const items = cart.items || [];
    document.getElementById('item-count').textContent = items.length;

    const container = document.getElementById('cart-items');

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <a href="customer-dashboard.html" class="shop-btn">
                    <i class="fas fa-store"></i> Start Shopping
                </a>
            </div>`;
        updateSummary(0);
        document.getElementById('checkout-btn').disabled = true;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="cart-item" id="item-${item.OrderItemID}">
            <div class="item-icon"><i class="fas fa-leaf"></i></div>
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-unit">Rs. ${parseFloat(item.unit_price).toFixed(0)} / ${item.unit}</div>
            </div>
            <div class="qty-controls">
                <button class="qty-btn" onclick="updateQty(${item.OrderItemID}, ${item.quantity - 1})">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQty(${item.OrderItemID}, ${item.quantity + 1})">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="item-price">Rs. ${parseFloat(item.subtotal).toFixed(0)}</div>
            <button class="remove-btn" onclick="removeItem(${item.OrderItemID})" title="Remove">
                <i class="fas fa-times"></i>
            </button>
        </div>`).join('');

    updateSummary(cart.total);
    document.getElementById('checkout-btn').disabled = false;
}

// Update summary
function updateSummary(total) {
    document.getElementById('subtotal').textContent = `Rs. ${parseFloat(total).toFixed(0)}`;
    document.getElementById('total').textContent = `Rs. ${parseFloat(total).toFixed(0)}`;
}

// Update quantity
async function updateQty(itemId, newQty) {
    if (newQty < 1) {
        removeItem(itemId);
        return;
    }
    try {
        const res = await fetch(`${API}/cart/update/${itemId}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ quantity: newQty })
        });
        const data = await res.json();
        if (data.success) {
            loadCart();
        } else {
            showToast(data.error || 'Could not update quantity', true);
        }
    } catch {
        showToast('Connection error', true);
    }
}

// Remove item
async function removeItem(itemId) {
    try {
        const res = await fetch(`${API}/cart/remove/${itemId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showToast('Item removed');
            loadCart();
        } else {
            showToast('Could not remove item', true);
        }
    } catch {
        showToast('Connection error', true);
    }
}

// Clear cart
async function clearCart() {
    if (!confirm('Clear all items from your cart?')) return;
    try {
        const res = await fetch(`${API}/cart/clear`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showToast('Cart cleared');
            loadCart();
        } else {
            showToast('Could not clear cart', true);
        }
    } catch {
        showToast('Connection error', true);
    }
}

// Checkout
async function checkout() {
    const address = document.getElementById('delivery-address').value.trim();
    if (!address) {
        showToast('Please enter a delivery address', true);
        document.getElementById('delivery-address').focus();
        return;
    }

    const btn = document.getElementById('checkout-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';

    try {
        const res = await fetch(`${API}/orders/checkout`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ delivery_address: address })
        });
        const data = await res.json();

        if (data.success) {
            showToast('✅ Order placed successfully!');
            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 1500);
        } else {
            showToast(data.error || 'Checkout failed', true);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-credit-card"></i> Proceed to Checkout';
        }
    } catch {
        showToast('Connection error', true);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-credit-card"></i> Proceed to Checkout';
    }
}

// Init
loadCart();
