// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const mainTabs = document.querySelectorAll('[data-tab]');
    const subRoleBtns = document.querySelectorAll('.sub-role-btn');
    const customerLoginForm = document.getElementById('customer-login-form');
    const adminLoginForm = document.getElementById('admin-login-form');
    const registerForm = document.getElementById('register-form');
    
    // Toggle between Login and Registration sections
    mainTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update main tabs active state
            mainTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide appropriate section
            if (tabName === 'login') {
                loginSection.classList.remove('hidden-section');
                registerSection.classList.add('hidden-section');
            } else {
                loginSection.classList.add('hidden-section');
                registerSection.classList.remove('hidden-section');
            }
        });
    });
    
    // Switch to login from registration prompt
    const switchToLogin = document.getElementById('switch-to-login');
    if (switchToLogin) {
        switchToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('[data-tab="login"]').click();
        });
    }
    
    // Toggle between Customer and Admin login forms
    subRoleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const role = this.getAttribute('data-role');
            
            subRoleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            if (role === 'customer') {
                customerLoginForm.classList.remove('hidden-form');
                adminLoginForm.classList.add('hidden-form');
            } else {
                adminLoginForm.classList.remove('hidden-form');
                customerLoginForm.classList.add('hidden-form');
            }
        });
    });
    
    // Helper function to show toast notifications
    function showToast(message, isError = false, duration = 3500) {
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        if (isError) toast.classList.add('error');
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), duration);
    }
    
    // Password strength checker
    function checkPasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/\d/)) strength++;
        if (password.match(/[^a-zA-Z\d]/)) strength++;
        return strength; // 0-4
    }
    
    // Add password strength indicator
    const regPassword = document.getElementById('reg-password');
    if (regPassword) {
        regPassword.addEventListener('input', function() {
            const strength = checkPasswordStrength(this.value);
            let strengthClass = '';
            
            if (strength === 0 || strength === 1) {
                strengthClass = 'weak';
            } else if (strength === 2 || strength === 3) {
                strengthClass = 'medium';
            } else if (strength >= 4) {
                strengthClass = 'strong';
            }
            
            let indicator = document.querySelector('.password-strength');
            if (!indicator && this.value.length > 0) {
                indicator = document.createElement('div');
                indicator.className = 'password-strength';
                this.parentElement.parentElement.appendChild(indicator);
            }
            
            if (indicator && this.value.length > 0) {
                indicator.innerHTML = `<div class="strength-bar ${strengthClass}"></div>`;
            } else if (indicator && this.value.length === 0) {
                indicator.remove();
            }
        });
    }
    
    // ----- REGISTRATION FORM HANDLER -----
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            const phone = document.getElementById('reg-phone').value.trim();
            const address = document.getElementById('reg-address').value.trim();
            const city = document.getElementById('reg-city').value.trim();
            const role = document.getElementById('reg-role').value;
            const termsAgreed = document.getElementById('terms-agree').checked;
            
            // Validation
            if (!name || !email || !password || !confirmPassword || !city) {
                showToast('Please fill in all required fields (*)', true);
                return;
            }
            
            if (!email.includes('@') || !email.includes('.')) {
                showToast('Please enter a valid email address', true);
                return;
            }
            
            if (password.length < 8) {
                showToast('Password must be at least 8 characters long', true);
                return;
            }
            
            if (password !== confirmPassword) {
                showToast('Passwords do not match', true);
                return;
            }
            
            if (!termsAgreed) {
                showToast('Please agree to the Terms of Service', true);
                return;
            }
            
            showToast('Creating your account...');
            
            try {
                const response = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, phone_no: phone, address, city, role })
                });
                const result = await response.json();
                
                if (result.success) {
                    showToast(`✅ Welcome ${name}! Account created successfully. Please sign in.`, false, 3000);
                    registerForm.reset();
                    setTimeout(() => {
                        document.querySelector('[data-tab="login"]').click();
                        showToast('Please sign in with your new credentials', false, 3000);
                    }, 2000);
                } else {
                    showToast(result.message || 'Registration failed. Email might already exist.', true);
                }
            } catch (error) {
                console.error('Registration error:', error);
                showToast('Connection error. Please try again.', true);
            }
        });
    }
    
    // ----- CUSTOMER LOGIN -----
    const customerLogin = document.getElementById('login-customer');
    if (customerLogin) {
        customerLogin.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('customer-email').value.trim();
            const password = document.getElementById('customer-password').value;
            const rememberMe = document.querySelector('input[name="remember_customer"]')?.checked;
            
            if (!email || !password) {
                showToast('Please enter both email and password', true);
                return;
            }
            
            try {
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, role: 'customer' })
                });
                const result = await response.json();
                
                if (result.success) {
                    const userData = JSON.stringify({
                        email,
                        role: 'customer',
                        token: result.token,
                        name: result.name || result.user?.name
                    });
                    if (rememberMe) {
                        localStorage.setItem('freshmart_user', userData);
                    } else {
                        sessionStorage.setItem('freshmart_user', userData);
                    }
                    showToast(`✅ Welcome back! Redirecting...`);
                    setTimeout(() => {
                        window.location.href = 'customer-dashboard.html';
                    }, 1500);
                } else {
                    showToast(result.message || 'Invalid credentials', true);
                }
            } catch (error) {
                console.error('Customer login error:', error);
                showToast('Connection error. Please try again.', true);
            }
        });
    }
    
    // ----- ADMIN LOGIN -----
    const adminLogin = document.getElementById('login-admin');
    if (adminLogin) {
        adminLogin.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('admin-email').value.trim();
            const password = document.getElementById('admin-password').value;
            const rememberMe = document.querySelector('input[name="remember_admin"]')?.checked;
            
            if (!email || !password) {
                showToast('Please enter admin credentials', true);
                return;
            }
            
            try {
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, role: 'customer' })
                });
                const result = await response.json();
                
                if (result.success) {
                    const adminData = JSON.stringify({ email, role: 'customer', token: result.token });
                    if (rememberMe) {
                        localStorage.setItem('freshmart_admin', adminData);
                    } else {
                        sessionStorage.setItem('freshmart_admin', adminData);
                    }
                    showToast(`🔒 Welcome Admin! Redirecting...`);
                    setTimeout(() => {
                        window.location.href = '/frontend/admin-request.html';
                    }, 1500);
                } else {
                    showToast(result.error || 'Invalid admin credentials', true);
                }
            } catch (error) {
                console.error('Admin login error:', error);
                showToast('Connection error. Please try again.', true);
            }
        });
    }
    
    // Forgot password handler
    const forgotLinks = document.querySelectorAll('.forgot-link');
    forgotLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showToast('🔐 Password reset link will be sent to your email (feature coming soon)', false);
        });
    });
});