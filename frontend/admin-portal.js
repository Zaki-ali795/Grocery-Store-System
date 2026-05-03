// ─── FreshMart | Admin Portal JS ────────────────────────────────────────────

const API = 'http://localhost:3000/api';

// ─── Auth ────────────────────────────────────────────────────────────────────

function checkAuth() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return null;
    }
    return token;
}

function authHeaders() {
    const token = checkAuth();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
}

function getAdminName() {
    const raw = localStorage.getItem('freshmart_admin') || sessionStorage.getItem('freshmart_admin');
    if (raw) {
        try {
            const data = JSON.parse(raw);
            document.getElementById('admin-name').textContent = data.name || data.email.split('@')[0];
        } catch (e) { /* ignore */ }
    }
}

function logout() {
    ['freshmart_user', 'freshmart_admin', 'token'].forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
    });
    window.location.href = 'index.html';
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.className = 'toast'; }, 3500);
}

// ─── Navigation ──────────────────────────────────────────────────────────────

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function () {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        this.classList.add('active');

        const page = this.getAttribute('data-page');
        ['dashboard', 'products', 'orders', 'requests'].forEach(p =>
            document.getElementById(`${p}-page`).classList.add('hide')
        );
        document.getElementById(`${page}-page`).classList.remove('hide');

        const titles = {
            dashboard: 'Dashboard',
            products:  'Products Management',
            orders:    'Orders Management',
            requests:  'Admin Requests'
        };
        document.getElementById('page-title').textContent = titles[page] || 'Dashboard';

        if (page === 'dashboard') loadDashboard();
        if (page === 'products')  loadProducts();
        if (page === 'orders')    loadAllOrders();
        if (page === 'requests')  loadAdminRequests();
    });
});

// ─── Dashboard ───────────────────────────────────────────────────────────────

async function loadDashboard() {
    try {
        const res  = await fetch(`${API}/orders/admin/stats`, { headers: authHeaders() });
        const data = await res.json();

        if (data.success) {
            const s = data.stats;
            document.getElementById('total-revenue').textContent    = `Rs. ${(s.totalRevenue || 0).toFixed(0)}`;
            document.getElementById('total-orders').textContent     = s.totalOrders    || 0;
            document.getElementById('low-stock').textContent        = s.lowStock       || 0;
            document.getElementById('pending-requests').textContent = s.pendingRequests || 0;

            const tbody  = document.getElementById('recent-orders-table').querySelector('tbody');
            const orders = s.recentOrders || [];
            tbody.innerHTML = orders.length
                ? orders.map(o => `
                    <tr>
                        <td>#${o.OrderID}</td>
                        <td>${o.customer_name || 'Customer'}</td>
                        <td>Rs. ${(o.total_amount || 0).toFixed(0)}</td>
                        <td><span class="status-badge status-${o.status}">${o.status}</span></td>
                        <td>${new Date(o.orderDate).toLocaleDateString()}</td>
                    </tr>`).join('')
                : '<tr><td colspan="5">No orders found</td></tr>';
        }
    } catch (err) {
        console.error('loadDashboard error:', err);
    }
}

// ─── Products ────────────────────────────────────────────────────────────────

async function loadProducts() {
    try {
        const res      = await fetch(`${API}/products`, { headers: authHeaders() });
        const data     = await res.json();
        const products = data.products || [];
        const tbody    = document.getElementById('products-table').querySelector('tbody');

        tbody.innerHTML = products.length
            ? products.map(p => `
                <tr>
                    <td>${p.ProductID}</td>
                    <td>${p.name || p.pName}</td>
                    <td>${p.category || p.CategoryName || '-'}</td>
                    <td>Rs. ${p.price}</td>
                    <td>${p.stock ?? p.stock_Quantity}</td>
                    <td>${p.unit || 'pc'}</td>
                    <td>
                        <button class="btn-sm btn-edit" onclick="openEditModal(${p.ProductID})">Edit</button>
                    </td>
                </tr>`).join('')
            : '<tr><td colspan="7">No products found</td></tr>';
    } catch (err) {
        console.error('loadProducts error:', err);
        document.getElementById('products-table').querySelector('tbody').innerHTML =
            '<tr><td colspan="7">Error loading products</td></tr>';
    }
}

function searchProducts() {
    const term = document.getElementById('product-search').value.toLowerCase();
    document.querySelectorAll('#products-table tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
}

// ─── Orders ──────────────────────────────────────────────────────────────────

async function loadAllOrders() {
    try {
        const res  = await fetch(`${API}/orders/all?_=${Date.now()}`, { headers: authHeaders() });
        const data = await res.json();

        if (data.success) {
            const orders = data.orders || [];
            const tbody  = document.getElementById('all-orders-table').querySelector('tbody');

            tbody.innerHTML = orders.length
                ? orders.map(o => `
                    <tr>
                        <td>#${o.OrderID}</td>
                        <td>${o.customer_name || 'Customer'}</td>
                        <td>Rs. ${(o.total_amount || 0).toFixed(0)}</td>
                        <td><span class="status-badge status-${o.status}">${o.status}</span></td>
                        <td>${new Date(o.orderDate).toLocaleDateString()}</td>
                        <td>
                            <select onchange="updateOrderStatus(${o.OrderID}, this.value)">
                                <option value="pending"   ${o.status === 'pending'   ? 'selected' : ''}>Pending</option>
                                <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                <option value="shipped"   ${o.status === 'shipped'   ? 'selected' : ''}>Shipped</option>
                                <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </td>
                    </tr>`).join('')
                : '<tr><td colspan="6">No orders found</td></tr>';
        }
    } catch (err) {
        console.error('loadAllOrders error:', err);
        document.getElementById('all-orders-table').querySelector('tbody').innerHTML =
            '<tr><td colspan="6">Error loading orders</td></tr>';
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const res  = await fetch(`${API}/orders/${orderId}/status`, {
            method:  'PUT',
            headers: authHeaders(),
            body:    JSON.stringify({ status })
        });
        const data = await res.json();

        if (data.success) {
            showToast(`Order #${orderId} updated to "${status}"`, 'success');
            await loadAllOrders();
            await loadDashboard();
        } else {
            showToast(data.error || 'Failed to update status', 'error');
        }
    } catch (err) {
        console.error('updateOrderStatus error:', err);
        showToast('Connection error', 'error');
    }
}

// ─── Admin Requests ───────────────────────────────────────────────────────────

async function loadAdminRequests() {
    try {
        const res      = await fetch(`${API}/admin-verify/pending`, { headers: authHeaders() });
        const data     = await res.json();
        const requests = data.requests || [];
        const tbody    = document.getElementById('requests-table').querySelector('tbody');

        tbody.innerHTML = requests.length
            ? requests.map(r => `
                <tr>
                    <td>${r.name}</td>
                    <td>${r.email}</td>
                    <td>${new Date(r.RequestDate).toLocaleDateString()}</td>
                    <td>${r.Comments || '-'}</td>
                    <td>
                        <button class="btn-sm btn-approve" onclick="reviewRequest(${r.RequestID}, 'approved')">Approve</button>
                        <button class="btn-sm btn-reject"  onclick="reviewRequest(${r.RequestID}, 'rejected')">Reject</button>
                    </td>
                </tr>`).join('')
            : '<tr><td colspan="5">No pending requests</td></tr>';
    } catch (err) {
        console.error('loadAdminRequests error:', err);
        document.getElementById('requests-table').querySelector('tbody').innerHTML =
            '<tr><td colspan="5">Error loading requests</td></tr>';
    }
}

async function reviewRequest(requestId, action) {
    try {
        const res  = await fetch(`${API}/admin-verify/review`, {
            method:  'POST',
            headers: authHeaders(),
            body:    JSON.stringify({ requestId, action })
        });
        const data = await res.json();

        if (data.success) {
            showToast(`Request ${action} successfully`, 'success');
            loadAdminRequests();
            loadDashboard();
        } else {
            showToast(data.error || 'Failed to process request', 'error');
        }
    } catch (err) {
        console.error('reviewRequest error:', err);
        showToast('Connection error', 'error');
    }
}

// ─── Edit Product Modal ───────────────────────────────────────────────────────

async function loadCategoriesIntoEditModal() {
    try {
        const res  = await fetch(`${API}/products/categories/all`);
        const data = await res.json();
        if (!data.success) return;

        document.getElementById('edit-category').innerHTML =
            data.categories.map(c =>
                `<option value="${c.CategoryName}">${c.CategoryName}</option>`
            ).join('');
    } catch (err) {
        console.error('loadCategoriesIntoEditModal error:', err);
    }
}

async function openEditModal(productId) {
    try {
        const res  = await fetch(`${API}/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        if (!data.success) {
            showToast('Failed to load product details.', 'error');
            return;
        }

        const p = data.product;

        document.getElementById('edit-product-id').value        = p.ProductID;
        document.getElementById('edit-name').value              = p.pName               || '';
        document.getElementById('edit-price').value             = p.price               || '';
        document.getElementById('edit-stock').value             = p.stock_Quantity      || '';
        document.getElementById('edit-unit').value              = p.unit                || '';
        document.getElementById('edit-image').value             = p.pic_url             || '';
        document.getElementById('edit-description').value       = p.product_description || '';

        // Set category
        const select = document.getElementById('edit-category');
        for (const opt of select.options) {
            opt.selected = opt.value === p.CategoryName;
        }

        // Deal fields
        const isOnDeal = p.inDeal === true || p.inDeal === 1;
        document.getElementById('edit-inDeal').checked = isOnDeal;
        toggleDealFields();

        if (isOnDeal) {
            document.getElementById('edit-deal-price').value = p.deal_price || '';
            if (p.deal_end) {
                document.getElementById('edit-deal-end').value =
                    new Date(p.deal_end).toISOString().slice(0, 16);
            }
        } else {
            document.getElementById('edit-deal-price').value = '';
            document.getElementById('edit-deal-end').value   = '';
        }

        document.getElementById('edit-product-modal').classList.remove('hide');

    } catch (err) {
        console.error('openEditModal error:', err);
        showToast('Could not open edit form.', 'error');
    }
}

function closeEditModal() {
    document.getElementById('edit-product-modal').classList.add('hide');
    document.getElementById('edit-product-id').value    = '';
    document.getElementById('edit-inDeal').checked      = false;
    document.getElementById('deal-fields').classList.add('hide');
}

function toggleDealFields() {
    const on = document.getElementById('edit-inDeal').checked;
    document.getElementById('deal-fields').classList.toggle('hide', !on);
}

async function submitEditProduct() {
    const productId = document.getElementById('edit-product-id').value;
    if (!productId) return;

    const name        = document.getElementById('edit-name').value.trim();
    const category    = document.getElementById('edit-category').value;
    const price       = parseFloat(document.getElementById('edit-price').value);
    const stock       = parseInt(document.getElementById('edit-stock').value);
    const unit        = document.getElementById('edit-unit').value.trim();
    const image       = document.getElementById('edit-image').value.trim();
    const description = document.getElementById('edit-description').value.trim();
    const inDeal      = document.getElementById('edit-inDeal').checked;
    const deal_price  = inDeal ? parseFloat(document.getElementById('edit-deal-price').value) : null;
    const deal_end    = inDeal ? document.getElementById('edit-deal-end').value : null;

    if (!name || !category || isNaN(price) || isNaN(stock) || !unit) {
        showToast('Please fill in all required fields.', 'error'); return;
    }
    if (price < 0 || stock < 0) {
        showToast('Price and stock cannot be negative.', 'error'); return;
    }
    if (inDeal) {
        if (!deal_price || isNaN(deal_price)) {
            showToast('Enter a valid deal price.', 'error'); return;
        }
        if (deal_price >= price) {
            showToast('Deal price must be less than the regular price.', 'error'); return;
        }
        if (!deal_end) {
            showToast('Enter a deal end date.', 'error'); return;
        }
        if (new Date(deal_end) <= new Date()) {
            showToast('Deal end date must be in the future.', 'error'); return;
        }
    }

    const btn = document.getElementById('edit-submit-btn');
    btn.disabled   = true;
    btn.innerHTML  = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const res  = await fetch(`${API}/products/${productId}`, {
            method:  'PUT',
            headers: authHeaders(),
            body:    JSON.stringify({
                name, category, price, stock, unit,
                image:       image       || null,
                description: description || null,
                inDeal, deal_price,
                deal_end: deal_end || null
            })
        });
        const data = await res.json();

        if (data.success) {
            showToast('Product updated successfully!', 'success');
            closeEditModal();
            loadProducts();
        } else {
            showToast(data.error || 'Update failed.', 'error');
        }
    } catch (err) {
        console.error('submitEditProduct error:', err);
        showToast('Network error. Please try again.', 'error');
    } finally {
        btn.disabled  = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
}

// ─── Add Product Modal ────────────────────────────────────────────────────────

async function loadCategories() {
    try {
        const res  = await fetch(`${API}/products/categories/all`, { headers: authHeaders() });
        const data = await res.json();
        const select = document.getElementById('product-category');
        if (!select) return;

        select.innerHTML = data.success && data.categories?.length
            ? '<option value="">Select Category</option>' +
              data.categories.map(c =>
                  `<option value="${c.CategoryID}">${c.CategoryName}</option>`
              ).join('')
            : '<option value="">No categories found</option>';
    } catch (err) {
        console.error('loadCategories error:', err);
    }
}

function showAddProductModal() {
    // Remove any stale instance first
    const existing = document.getElementById('add-product-modal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', `
        <div id="add-product-modal" class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3><i class="fas fa-plus-circle" style="color:#2c6e2f;margin-right:.4rem"></i> Add New Product</h3>
                    <button class="modal-close" onclick="closeAddProductModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-name">Product Name *</label>
                            <input type="text" id="product-name" class="modal-input" placeholder="e.g. Apple 1 kg">
                        </div>
                        <div class="form-group">
                            <label for="product-category">Category *</label>
                            <select id="product-category" class="modal-select">
                                <option value="">Loading...</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-price">Price (Rs.) *</label>
                            <input type="number" id="product-price" class="modal-input" step="0.01" min="0">
                        </div>
                        <div class="form-group">
                            <label for="product-stock">Stock Quantity *</label>
                            <input type="number" id="product-stock" class="modal-input" min="0">
                        </div>
                        <div class="form-group">
                            <label for="product-unit">Unit *</label>
                            <input type="text" id="product-unit" class="modal-input" placeholder="kg, liters, pcs">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="product-image">Image URL</label>
                        <input type="text" id="product-image" class="modal-input" placeholder="https://example.com/image.jpg">
                    </div>
                    <div class="form-group">
                        <label for="product-description">Description</label>
                        <textarea id="product-description" class="modal-textarea" rows="3" placeholder="Product description..."></textarea>
                    </div>
                    <div class="deal-section">
                        <h4><i class="fas fa-tag"></i> Deal / Promotion</h4>
                        <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;">
                            <input type="checkbox" id="product-deal" onchange="toggleAddDealFields()"
                                   style="width:16px;height:16px;">
                            <span style="font-size:.9rem;font-weight:500;">Activate Deal</span>
                        </label>
                        <div id="add-deal-fields" class="hide" style="margin-top:.75rem;">
                            <div class="form-row">
                                <div class="form-group" style="margin-bottom:0">
                                    <label for="product-deal-price">Deal Price (Rs.) *</label>
                                    <input type="number" id="product-deal-price" class="modal-input" step="0.01" min="0">
                                </div>
                                <div class="form-group" style="margin-bottom:0">
                                    <label for="product-deal-end">Deal End Date *</label>
                                    <input type="datetime-local" id="product-deal-end" class="modal-input">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-buttons">
                        <button class="btn-cancel" onclick="closeAddProductModal()">Cancel</button>
                        <button class="btn-submit" id="add-submit-btn" onclick="submitAddProduct()">
                            <i class="fas fa-plus"></i> Add Product
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `);

    loadCategories();
}

function closeAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    if (modal) modal.remove();
}

function toggleAddDealFields() {
    const on = document.getElementById('product-deal').checked;
    document.getElementById('add-deal-fields').classList.toggle('hide', !on);
}

async function submitAddProduct() {
    const name        = document.getElementById('product-name').value.trim();
    const categoryId  = document.getElementById('product-category').value;
    const price       = parseFloat(document.getElementById('product-price').value);
    const stock       = parseInt(document.getElementById('product-stock').value);
    const unit        = document.getElementById('product-unit').value.trim();
    const image       = document.getElementById('product-image').value.trim();
    const description = document.getElementById('product-description').value.trim();
    const inDeal      = document.getElementById('product-deal').checked;
    const deal_price  = inDeal ? parseFloat(document.getElementById('product-deal-price').value) : null;
    const deal_end    = inDeal ? document.getElementById('product-deal-end').value : null;

    if (!name || !categoryId || isNaN(price) || isNaN(stock) || !unit) {
        showToast('Please fill in all required fields.', 'error'); return;
    }
    if (price <= 0) {
        showToast('Price must be greater than 0.', 'error'); return;
    }
    if (inDeal) {
        if (!deal_price || isNaN(deal_price) || deal_price >= price) {
            showToast('Deal price must be a valid amount less than the regular price.', 'error'); return;
        }
        if (!deal_end || new Date(deal_end) <= new Date()) {
            showToast('Deal end date must be in the future.', 'error'); return;
        }
    }

    const btn = document.getElementById('add-submit-btn');
    btn.disabled  = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    try {
        const res  = await fetch(`${API}/products/add`, {
            method:  'POST',
            headers: authHeaders(),
            body:    JSON.stringify({
                categoryId:          parseInt(categoryId),
                pName:               name,
                price,
                stock_Quantity:      stock,
                unit,
                product_description: description || null,
                pic_url:             image       || null,
                inDeal,
                deal_price:          deal_price  || null,
                deal_end:            deal_end    || null
            })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            showToast('Product added successfully!', 'success');
            closeAddProductModal();
            loadProducts();
        } else {
            showToast(data.error || 'Failed to add product.', 'error');
        }
    } catch (err) {
        console.error('submitAddProduct error:', err);
        showToast('Network error. Please try again.', 'error');
    } finally {
        btn.disabled  = false;
        btn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
    }
}

// ─── Init ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    getAdminName();
    loadDashboard();
    loadCategoriesIntoEditModal();
});
