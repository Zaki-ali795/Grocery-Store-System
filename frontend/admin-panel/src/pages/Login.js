import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../utils/api';

export default function Login({ setAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({
        email,
        password,
        role: 'admin'
      });

      if (response.token) {
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('adminName', response.user?.name || 'Admin');
        setAuth(true);
      } else {
        setError('Invalid login response');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--bg-color) 0%, #e8f5e8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'var(--font-family, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif)'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundColor: 'var(--white)',
          padding: '40px',
          borderRadius: 'var(--radius)',
          width: '100%',
          maxWidth: '420px',
          boxShadow: 'var(--shadow)',
          border: '1px solid rgba(44, 110, 47, 0.1)'
        }}
      >
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              backgroundColor: 'var(--primary)',
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 25px rgba(44, 110, 47, 0.3)'
            }}
          >
            <Lock size={36} color="white" />
          </motion.div>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--text-dark)',
            letterSpacing: '-0.5px'
          }}>
            Welcome Back
          </h1>
          <p style={{
            margin: 0,
            color: 'var(--text-muted)',
            fontSize: '16px'
          }}>
            Sign in to your FreshMart Admin account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '16px',
              borderRadius: 'var(--radius)',
              color: 'var(--danger)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <AlertCircle size={20} style={{ marginRight: '12px', flexShrink: 0 }} />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Email Field */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-dark)'
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} color="#9ca3af" style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1
              }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@freshmart.com"
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 52px',
                  borderRadius: 'var(--radius)',
                  border: '2px solid #e5e7eb',
                  outline: 'none',
                  fontSize: '16px',
                  fontWeight: '400',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  backgroundColor: '#fafafa'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(44, 110, 47, 0.1)';
                  e.target.style.backgroundColor = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                  e.target.style.backgroundColor = '#fafafa';
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-dark)'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} color="#9ca3af" style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '16px 52px 16px 52px',
                  borderRadius: 'var(--radius)',
                  border: '2px solid #e5e7eb',
                  outline: 'none',
                  fontSize: '16px',
                  fontWeight: '400',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  backgroundColor: '#fafafa'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(44, 110, 47, 0.1)';
                  e.target.style.backgroundColor = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                  e.target.style.backgroundColor = '#fafafa';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  color: '#9ca3af',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              marginTop: '8px',
              backgroundColor: loading ? '#9ca3af' : 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '16px 24px',
              borderRadius: 'var(--radius)',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(44, 110, 47, 0.3)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Signing In...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Sign In to Dashboard
              </>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '14px',
            margin: 0
          }}>
            Secure admin access for FreshMart management
          </p>
        </div>
      </motion.div>

      {/* Add spinner animation CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}