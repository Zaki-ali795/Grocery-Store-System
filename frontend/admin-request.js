const API = 'http://localhost:3000/api';

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

const session = getSession();
if (!session) window.location.href = 'index.html';

function showToast(message, isError = false) {
    const existing = document.querySelector('.toast-message');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-message' + (isError ? ' error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function logout() {
    localStorage.removeItem('freshmart_user');
    sessionStorage.removeItem('freshmart_user');
    window.location.href = 'index.html';
}

function showStatus(status, request) {
    const box = document.getElementById('status-box');
    const icon = document.getElementById('status-icon');
    const title = document.getElementById('status-title');
    const desc = document.getElementById('status-desc');
    const form = document.getElementById('request-form');

    box.style.display = 'flex';
    box.className = `status-box ${status}`;

    if (status === 'pending') {
        icon.textContent = '⏳';
        title.textContent = 'Request Pending';
        desc.textContent = 'Your admin access request is under review. Please check back later.';
        form.style.display = 'none';
    } else if (status === 'approved') {
        icon.textContent = '✅';
        title.textContent = 'Request Approved';
        desc.textContent = 'Your admin access has been approved. Log out and log back in to access admin features.';
        form.style.display = 'none';
    } else if (status === 'rejected') {
        icon.textContent = '❌';
        title.textContent = 'Request Rejected';
        desc.textContent = 'Your admin request was not approved. You may submit a new request.';
        // Keep form visible so they can reapply
    }
}

async function checkStatus() {
    try {
        const res = await fetch(`${API}/admin-verify/status`, { headers: authHeaders() });
        const data = await res.json();

        if (data.success && data.status !== 'none') {
            showStatus(data.status, data.request);
        }
    } catch {
        // no existing request, show form as is
    }
}

async function submitRequest() {
    const comments = document.getElementById('comments').value.trim();
    const btn = document.getElementById('submit-btn');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
        const res = await fetch(`${API}/admin-verify/request`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ comments })
        });
        const data = await res.json();

        if (data.success) {
            showToast('✅ Request submitted successfully!');
            setTimeout(() => showStatus('pending', null), 1000);
        } else {
            showToast(data.error || 'Failed to submit request', true);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Request';
        }
    } catch {
        showToast('Connection error', true);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Request';
    }
}

checkStatus();
