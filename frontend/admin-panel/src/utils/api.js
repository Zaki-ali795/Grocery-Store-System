// API Utility for React Frontend
// This file provides a centralized way to make API calls to the backend

const API_BASE_URL = 'http://localhost:3000/api';

// Generic fetch wrapper with error handling
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    // Add authorization header if token exists
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, config);

        // Handle different response types
        if (response.status === 204) {
            return { success: true };
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return data;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Authentication API calls
export const authAPI = {
    register: (userData) => apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),

    login: (credentials) => apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    }),

    getProfile: () => apiRequest('/auth/profile'),

    updateProfile: (userData) => apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(userData)
    })
};

// Product API calls
export const productAPI = {
    getAllProducts: () => apiRequest('/products'),

    getProductById: (id) => apiRequest(`/products/${id}`),

    searchProducts: (query) => apiRequest(`/products/search?q=${encodeURIComponent(query)}`),

    createProduct: (productData) => apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(productData)
    })
};

// Cart API calls
export const cartAPI = {
    getCart: () => apiRequest('/cart'),

    addToCart: (productData) => apiRequest('/cart/add', {
        method: 'POST',
        body: JSON.stringify(productData)
    }),

    updateCartItem: (itemData) => apiRequest('/cart/update', {
        method: 'PUT',
        body: JSON.stringify(itemData)
    }),

    removeFromCart: (productId) => apiRequest('/cart/remove', {
        method: 'DELETE',
        body: JSON.stringify({ productId })
    }),

    clearCart: () => apiRequest('/cart/clear', {
        method: 'DELETE'
    })
};

// Order API calls
export const orderAPI = {
    checkout: (orderData) => apiRequest('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(orderData)
    }),

    getMyOrders: () => apiRequest('/orders/my-orders'),

    getOrderById: (orderId) => apiRequest(`/orders/${orderId}`),

    trackOrder: (orderId) => apiRequest(`/orders/${orderId}/track`)
};

// Admin API calls
export const adminAPI = {
    requestAdminAccess: (requestData) => apiRequest('/admin-verify/request', {
        method: 'POST',
        body: JSON.stringify(requestData)
    }),

    getPendingRequests: () => apiRequest('/admin-verify/pending'),

    approveRequest: (requestId) => apiRequest('/admin-verify/approve', {
        method: 'POST',
        body: JSON.stringify({ requestId })
    }),

    rejectRequest: (requestId, reason) => apiRequest('/admin-verify/reject', {
        method: 'POST',
        body: JSON.stringify({ requestId, reason })
    })
};

// Health check
export const healthAPI = {
    checkHealth: () => fetch('http://localhost:3000/api/health')
        .then(res => res.json())
        .catch(err => ({ status: 'error', error: err.message }))
};

// Export default object with all APIs
const api = {
    auth: authAPI,
    products: productAPI,
    cart: cartAPI,
    orders: orderAPI,
    admin: adminAPI,
    health: healthAPI
};

export default api;