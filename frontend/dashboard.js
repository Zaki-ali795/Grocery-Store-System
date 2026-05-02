const API = 'http://localhost:3000/api';

// Get token and user from storage
function getSession() {
    const raw = localStorage.getItem('freshmart_user') || sessionStorage.getItem('freshmart_user');
    return raw ? JSON.parse(raw) : null;
}

function getToken() {
    const session = getSession();
    return session ? session.token : null;
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

// Redirect to login if not logged in
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

// Render product card
function productCard(p) {
    const img = p.image
        ? `<img class="product-img" src="${p.image}" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : '';
    const placeholder = `<div class="product-img-placeholder" ${p.image ? 'style="display:none"' : ''}><i class="fas fa-leaf"></i></div>`;
    const price = p.current_price || p.price;

    return `
    <div class="product-card">
        ${img}
        ${placeholder}
        <div class="product-info">
            <div class="product-name" title="${p.name}">${p.name}</div>
            <div class="product-category">${p.category || ''}</div>
            <div class="product-price-row">
                <div>
                    <span class="product-price">Rs. ${parseFloat(price).toFixed(0)}</span>
                    <span class="product-unit"> / ${p.unit}</span>
                </div>
                <button class="add-btn" onclick="addToCart(${p.ProductID}, '${p.name}')" title="Add to cart">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </div>
    </div>`;
}

// Render products grid
function renderProducts(products, title = 'All Products') {
    document.getElementById('section-title').textContent = title;
    document.getElementById('product-count').textContent = `${products.length} item${products.length !== 1 ? 's' : ''}`;
    const grid = document.getElementById('products-grid');

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <i class="fas fa-search"></i>
                <p>No products found</p>
            </div>`;
        return;
    }

    grid.innerHTML = products.map(productCard).join('');
}

// Load all products
async function loadAllProducts(btn) {
    setActiveCategory(btn);
    document.getElementById('section-title').textContent = 'All Products';
    showSkeletons();
    try {
        const res = await fetch(`${API}/products`);
        const data = await res.json();
        renderProducts(data.products || []);
    } catch {
        showToast('Failed to load products', true);
    }
}

// Load by category
async function loadByCategory(categoryId, btn) {
    setActiveCategory(btn);
    showSkeletons();
    try {
        const res = await fetch(`${API}/products/category/${categoryId}`);
        const data = await res.json();
        const title = btn.textContent.trim();
        renderProducts(data.products || [], title);
    } catch {
        showToast('Failed to load category', true);
    }
}

// Search
async function searchProducts() {
    const q = document.getElementById('search-input').value.trim();
    if (!q) { loadAllProducts(document.querySelector('.category-item')); return; }
    showSkeletons();
    try {
        const res = await fetch(`${API}/products/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        renderProducts(data.products || [], `Results for "${q}"`);
        document.getElementById('deals-section').style.display = 'none';
    } catch {
        showToast('Search failed', true);
    }
}

// Enter key for search
document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchProducts();
});

// Load flash deals
async function loadDeals() {
    try {
        const res = await fetch(`${API}/products/flash-deals`);
        const data = await res.json();
        const grid = document.getElementById('deals-grid');

        if (!data.deals || data.deals.length === 0) {
            document.getElementById('deals-section').style.display = 'none';
            return;
        }

        grid.innerHTML = data.deals.map(d => {
            const pct = Math.round((1 - d.deal_price / d.price) * 100);
            return `
            <div class="deal-card" onclick="addToCart(${d.ProductID}, '${d.name}')">
                ${d.image ? `<img src="${d.image}" alt="${d.name}" onerror="this.style.display='none'">` : ''}
                <div class="deal-name">${d.name}</div>
                <div class="deal-prices">
                    <span class="deal-original">Rs. ${d.price}</span>
                    <span class="deal-current">Rs. ${d.deal_price}</span>
                    <span class="deal-badge">-${pct}%</span>
                </div>
            </div>`;
        }).join('');
    } catch {
        document.getElementById('deals-section').style.display = 'none';
    }
}

// Add to cart
async function addToCart(productId, name) {
    const token = getToken();
    if (!token) { showToast('Please log in first', true); return; }

    try {
        const res = await fetch(`${API}/cart/add`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ productId, quantity: 1 })
        });
        const data = await res.json();
        if (data.success || res.ok) {
            showToast(`✅ ${name} added to cart`);
            updateCartCount();
        } else {
            showToast(data.error || 'Could not add to cart', true);
        }
    } catch {
        showToast('Connection error', true);
    }
}

// Update cart count in navbar
async function updateCartCount() {
    const token = getToken();
    if (!token) return;
    try {
        const res = await fetch(`${API}/cart`, { headers: authHeaders() });
        const data = await res.json();
        const items = data.cart || data.items || [];
        document.getElementById('cart-count').textContent = items.length || 0;
    } catch {}
}

// Skeleton loaders
function showSkeletons() {
    document.getElementById('products-grid').innerHTML = Array(8).fill(`
        <div class="skeleton">
            <div class="skeleton-img"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
        </div>`).join('');
}

function setActiveCategory(btn) {
    document.querySelectorAll('.category-item').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('deals-section').style.display = '';
    document.getElementById('search-input').value = '';
}

// Init
loadDeals();
loadAllProducts(document.querySelector('.category-item'));
updateCartCount();
