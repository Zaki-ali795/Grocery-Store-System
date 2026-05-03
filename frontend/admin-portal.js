const API = 'http://localhost:3000/api';

// Check authentication
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

// Get current admin name
function getAdminName() {
    const admin = localStorage.getItem('freshmart_admin') || sessionStorage.getItem('freshmart_admin');
    if (admin) {
        const data = JSON.parse(admin);
        document.getElementById('admin-name').textContent = data.name || data.email.split('@')[0];
    }
}

// Logout
function logout() {
    localStorage.removeItem('freshmart_user');
    sessionStorage.removeItem('freshmart_user');
    localStorage.removeItem('freshmart_admin');
    sessionStorage.removeItem('freshmart_admin');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Page navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        
        const page = this.getAttribute('data-page');
        document.getElementById('dashboard-page').classList.add('hide');
        document.getElementById('products-page').classList.add('hide');
        document.getElementById('orders-page').classList.add('hide');
        document.getElementById('requests-page').classList.add('hide');
        
        document.getElementById(`${page}-page`).classList.remove('hide');
        document.getElementById('page-title').textContent = 
            page === 'dashboard' ? 'Dashboard' :
            page === 'products' ? 'Products Management' :
            page === 'orders' ? 'Orders Management' : 'Admin Requests';
        
        // Load data based on page
        if (page === 'dashboard') loadDashboard();
        if (page === 'products') loadProducts();
        if (page === 'orders') loadAllOrders();
        if (page === 'requests') loadAdminRequests();
    });
});

// Load Dashboard Stats (UPDATED - uses admin stats endpoint)
async function loadDashboard() {
    try {
        const res = await fetch(`${API}/orders/admin/stats`, { headers: authHeaders() });
        const data = await res.json();
        
        if (data.success) {
            const stats = data.stats;
            document.getElementById('total-revenue').textContent = `Rs. ${(stats.totalRevenue || 0).toFixed(0)}`;
            document.getElementById('total-orders').textContent = stats.totalOrders || 0;
            document.getElementById('low-stock').textContent = stats.lowStock || 0;
            document.getElementById('pending-requests').textContent = stats.pendingRequests || 0;
            
            // Recent orders table
            const recentTable = document.getElementById('recent-orders-table').querySelector('tbody');
            const recentOrders = stats.recentOrders || [];
            if (recentOrders.length > 0) {
                recentTable.innerHTML = recentOrders.map(order => `
                    <tr>
                        <td>#${order.OrderID}</td>
                        <td>${order.customer_name || 'Customer'}</td>
                        <td>Rs. ${(order.total_amount || 0).toFixed(0)}</td>
                        <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                        <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                    </tr>
                `).join('');
            } else {
                recentTable.innerHTML = '<tr><td colspan="5">No orders found</td></tr>';
            }
        }
    } catch (error) {
        console.error('Load dashboard error:', error);
        document.getElementById('total-revenue').textContent = 'Rs. 0';
        document.getElementById('total-orders').textContent = '0';
    }
}

// Load Products (UPDATED - shows all products for admin)
async function loadProducts() {
    try {
        const res = await fetch(`${API}/products`, { headers: authHeaders() });
        const data = await res.json();
        const products = data.products || [];
        
        const table = document.getElementById('products-table').querySelector('tbody');
        if (products.length > 0) {
            table.innerHTML = products.map(p => `
                <tr>
                    <td>${p.ProductID}</td>
                    <td>${p.name}</td>
                    <td>${p.category || '-'}</td>
                    <td>Rs. ${p.price}</td>
                    <td>${p.stock}</td>
                    <td>${p.unit || 'pc'}</td>
                    <td>
                        <button class="btn-sm btn-edit" onclick="editProduct(${p.ProductID})">Edit</button>
                    </td>
                </tr>
            `).join('');
        } else {
            table.innerHTML = '<tr><td colspan="7">No products found</td></tr>';
        }
    } catch (error) {
        console.error('Load products error:', error);
        document.getElementById('products-table').querySelector('tbody').innerHTML = '<tr><td colspan="7">Error loading products</td></tr>';
    }
}

// Load All Orders (UPDATED - uses admin all orders endpoint)
async function loadAllOrders() {
    try {
        // Add cache-busting parameter
        const res = await fetch(`${API}/orders/all?_=${Date.now()}`, { 
            headers: authHeaders() 
        });
        const data = await res.json();
        
        console.log('Orders loaded:', data.orders?.length);
        
        if (data.success) {
            const orders = data.orders || [];
            const table = document.getElementById('all-orders-table').querySelector('tbody');
            
            if (orders.length > 0) {
                table.innerHTML = orders.map(order => `
                    <tr>
                        <td>#${order.OrderID}</td>
                        <td>${order.customer_name || 'Customer'}</td>
                        <td>Rs. ${(order.total_amount || 0).toFixed(0)}</td>
                        <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                        <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                        <td>
                            <select onchange="updateOrderStatus(${order.OrderID}, this.value)">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </td>
                    </tr>
                `).join('');
            } else {
                table.innerHTML = '<tr><td colspan="6">No orders found</td></tr>';
            }
        }
    } catch (error) {
        console.error('Load orders error:', error);
        document.getElementById('all-orders-table').querySelector('tbody').innerHTML = '<tr><td colspan="6">Error loading orders</td></tr>';
    }
}
// Load Admin Requests
async function loadAdminRequests() {
    try {
        const res = await fetch(`${API}/admin-verify/pending`, { headers: authHeaders() });
        const data = await res.json();
        const requests = data.requests || [];
        
        const table = document.getElementById('requests-table').querySelector('tbody');
        if (requests.length > 0) {
            table.innerHTML = requests.map(req => `
                <tr>
                    <td>${req.name}</td>
                    <td>${req.email}</td>
                    <td>${new Date(req.RequestDate).toLocaleDateString()}</td>
                    <td>${req.Comments || '-'}</td>
                    <td>
                        <button class="btn-sm btn-approve" onclick="reviewRequest(${req.RequestID}, 'approved')">Approve</button>
                        <button class="btn-sm btn-reject" onclick="reviewRequest(${req.RequestID}, 'rejected')">Reject</button>
                    </td>
                </tr>
            `).join('');
        } else {
            table.innerHTML = '<tr><td colspan="5">No pending requests</td></tr>';
        }
    } catch (error) {
        console.error('Load requests error:', error);
        document.getElementById('requests-table').querySelector('tbody').innerHTML = '<tr><td colspan="5">Error loading requests</td></tr>';
    }
}

// Review admin request
async function reviewRequest(requestId, action) {
    try {
        const res = await fetch(`${API}/admin-verify/review`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ requestId, action })
        });
        const data = await res.json();
        if (data.success) {
            alert(`Request ${action} successfully`);
            loadAdminRequests();
            loadDashboard();
        } else {
            alert(data.error || 'Failed to process request');
        }
    } catch (error) {
        console.error('Review error:', error);
        alert('Connection error');
    }
}

// Update order status (UPDATED - uses new endpoint)
async function updateOrderStatus(orderId, status) {
    console.log(`Updating order ${orderId} to ${status}`);
    
    try {
        const res = await fetch(`${API}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ status })
        });
        
        const data = await res.json();
        console.log('Response:', data);
        
        if (data.success) {
            alert(`Order #${orderId} status updated to ${status}`);
            // Force refresh the page to get fresh data
            await loadAllOrders();
            await loadDashboard();
            // Optional: highlight the updated row
        } else {
            alert(data.error || 'Failed to update status');
        }
    } catch (error) {
        console.error('Update status error:', error);
        alert('Connection error: ' + error.message);
    }
}

// Search products
function searchProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const rows = document.querySelectorAll('#products-table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Edit product placeholder
function editProduct(productId) {
    alert(`Edit product ${productId} - Feature coming soon`);
}

// Add product modal placeholder
function showAddProductModal() {
    alert('Add product feature coming soon');
}

// Load categories for dropdown
async function loadCategories() {
    try {
        console.log('Loading categories...');
        const res = await fetch(`${API}/products/categories/all`, { 
            headers: authHeaders() 
        });
        const data = await res.json();
        
        console.log('Categories response:', data);
        
        const select = document.getElementById('product-category');
        if (select && data.success && data.categories) {
            if (data.categories.length > 0) {
                select.innerHTML = '<option value="">Select Category</option>' +
                    data.categories.map(cat => `<option value="${cat.CategoryID}">${cat.CategoryName}</option>`).join('');
                console.log('Categories loaded:', data.categories.length);
            } else {
                select.innerHTML = '<option value="">No categories found</option>';
            }
        } else if (select) {
            select.innerHTML = '<option value="">Error loading categories</option>';
        }
    } catch (error) {
        console.error('Load categories error:', error);
        const select = document.getElementById('product-category');
        if (select) {
            select.innerHTML = '<option value="">Connection error</option>';
        }
    }
}
// Show Add Product Modal
function showAddProductModal() {
    // Load categories first
    loadCategories();
    
    // Show modal
    const modal = document.getElementById('add-product-modal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        // Create modal if it doesn't exist
        createAddProductModal();
    }
}

// Create Add Product Modal dynamically
function createAddProductModal() {
    const modalHTML = `
        <div id="add-product-modal" class="modal-overlay" style="display:flex">
            <div class="modal">
                <div class="modal-header">
                    <h3><i class="fas fa-plus-circle"></i> Add New Product</h3>
                    <button class="modal-close" onclick="closeAddProductModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="add-product-form">
                        <div class="form-row">
                            <div class="form-group half">
                                <label>Product Name *</label>
                                <input type="text" id="product-name" class="modal-input" required>
                            </div>
                            <div class="form-group half">
                                <label>Category *</label>
                                <select id="product-category" class="modal-input" required>
                                    <option value="">Loading...</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group half">
                                <label>Price (Rs.) *</label>
                                <input type="number" id="product-price" class="modal-input" step="0.01" required>
                            </div>
                            <div class="form-group half">
                                <label>Stock Quantity *</label>
                                <input type="number" id="product-stock" class="modal-input" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group half">
                                <label>Unit *</label>
                                <input type="text" id="product-unit" class="modal-input" placeholder="kg, liter, pcs" required>
                            </div>
                            <div class="form-group half">
                                <label>Image URL</label>
                                <input type="text" id="product-image" class="modal-input" placeholder="https://...">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="product-description" class="modal-textarea" rows="3"></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group half">
                                <label>
                                    <input type="checkbox" id="product-deal" onchange="toggleDealFields()"> Flash Deal
                                </label>
                            </div>
                        </div>
                        
                        <div id="deal-fields" style="display:none">
                            <div class="form-row">
                                <div class="form-group half">
                                    <label>Deal Price (Rs.)</label>
                                    <input type="number" id="product-deal-price" class="modal-input" step="0.01">
                                </div>
                                <div class="form-group half">
                                    <label>Deal End Date</label>
                                    <input type="datetime-local" id="product-deal-end" class="modal-input">
                                </div>
                            </div>
                        </div>
                        
                        <div class="modal-buttons">
                            <button type="button" class="btn-cancel" onclick="closeAddProductModal()">Cancel</button>
                            <button type="submit" class="btn-submit">Add Product</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);
    
    // Load categories
    loadCategories();
    
    // Add form submit event
    document.getElementById('add-product-form').addEventListener('submit', submitAddProduct);
}

// Toggle deal fields
function toggleDealFields() {
    const isDeal = document.getElementById('product-deal').checked;
    const dealFields = document.getElementById('deal-fields');
    dealFields.style.display = isDeal ? 'flex' : 'none';
}

// Close modal
function closeAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    if (modal) {
        modal.remove();
    }
}

// Submit new product
// Submit new product - UPDATED to match backend expectations
async function submitAddProduct(e) {
    e.preventDefault();
    
    // Get values
    const categoryId = document.getElementById('product-category').value;
    const productName = document.getElementById('product-name').value.trim();
    const price = document.getElementById('product-price').value;
    const stock = document.getElementById('product-stock').value;
    const unit = document.getElementById('product-unit').value.trim();
    const description = document.getElementById('product-description').value.trim();
    const imageUrl = document.getElementById('product-image').value.trim();
    
    // Validate
    if (!categoryId) {
        alert('Please select a category');
        return;
    }
    if (!productName) {
        alert('Please enter product name');
        return;
    }
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
        alert('Please enter a valid price');
        return;
    }
    if (!stock || isNaN(stock) || parseInt(stock) < 0) {
        alert('Please enter valid stock quantity');
        return;
    }
    if (!unit) {
        alert('Please enter unit (kg, liter, pcs, etc.)');
        return;
    }
    
    const productData = {
        categoryId: parseInt(categoryId),
        pName: productName,
        price: parseFloat(price),
        stock_Quantity: parseInt(stock),
        unit: unit,
        product_description: description || null,
        pic_url: imageUrl || null
    };
    
    console.log('Sending product data:', productData);
    
    const submitBtn = document.querySelector('#add-product-form button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
    
    try {
        const response = await fetch(`${API}/products/add`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (response.ok && data.success) {
            alert('✅ Product added successfully!');
            closeAddProductModal();
            loadProducts(); // Refresh the product list
        } else {
            alert('❌ ' + (data.error || 'Failed to add product'));
        }
    } catch (error) {
        console.error('Add product error:', error);
        alert('Connection error: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Product';
    }
}

// Update the Add Product button in your HTML
// In admin-portal.html, update the button:
// <button class="btn-sm btn-approve" onclick="showAddProductModal()">
//     <i class="fas fa-plus"></i> Add Product
// </button>

// Initialize
checkAuth();
getAdminName();
loadDashboard();