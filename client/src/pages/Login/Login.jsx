import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login, loading: authLoading, isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/';
  
  // Role-based entry points
  const rolePaths = {
    admin: '/admin-dashboard',
    teacher: '/teacher-dashboard',
    student: '/student-dashboard',
    parent: '/parent-dashboard',
    finance: '/finance-dashboard',
    staff: '/staff-dashboard'
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const target = from === '/' ? (rolePaths[userRole] || '/') : from;
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, navigate, from, userRole]);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await login(formData.email, formData.password, formData.rememberMe);
      
      if (result.success) {
        // Automatically route to the respective dashboard based on role
        const redirectPath = result.redirect || '/';
        navigate(redirectPath, { replace: true });
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Invalid credentials. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

return (
    <div className="login-container" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      backgroundColor: '#f4f7fe',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Left Panel - Branding */}
      <div className="branding-panel" style={{
        flex: 1.2,
        backgroundImage: 'url("/login-bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Deep Gradient Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(0, 132, 62, 0.95) 0%, rgba(0, 107, 50, 0.85) 50%, rgba(15, 23, 42, 0.9) 100%)',
          zIndex: 0
        }}></div>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.08,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        {/* Decorative Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.05)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '5%',
          left: '5%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.05)'
        }}></div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '450px' }}>
          {/* School Logo */}
          <div style={{ margin: '0 auto 40px', display: 'flex', justifyContent: 'center' }}>
            <div className="school-logo-container" style={{
              width: '180px',
              height: '180px',
              borderRadius: '50px',
              backgroundColor: 'rgba(255, 255, 255, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
              border: '8px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <img src="/UBS.png" alt="UBS Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
            </div>
          </div>

          <h1 style={{
            fontSize: '48px',
            fontWeight: '950',
            color: 'white',
            marginBottom: '16px',
            letterSpacing: '-2.5px',
            lineHeight: '0.9',
            textShadow: '0 4px 12px rgba(0,0,0,0.2)',
            fontFamily: "'Outfit', sans-serif"
          }}>
            UHAS <span style={{ color: 'var(--brand-yellow)' }}>BASIC</span> SCHOOL
          </h1>
          <p style={{
            fontSize: '18px',
            fontWeight: '900',
            marginBottom: '24px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontFamily: "'Outfit', sans-serif",
            fontStyle: 'italic',
            background: 'linear-gradient(to right, #ffffff, var(--brand-yellow))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            LEARNING TODAY LEADING TOMORROW
          </p>


          {/* Description */}
          <p style={{
            fontSize: '17px',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: '1.8',
            marginBottom: '0',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: '500',
            maxWidth: '420px',
            margin: '0 auto'
          }}>
            Access your academic dashboard to manage student records, track performance, and handle administrative tasks efficiently.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-panel" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              fontSize: '36px', 
              fontWeight: '900', 
              color: '#0f172a',
              marginBottom: '12px',
              letterSpacing: '-1.5px'
            }}>
              Welcome Back
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: '#64748b',
              fontWeight: '500'
            }}>
              Sign in to manage your academic ecosystem.
            </p>
          </div>


          {/* Error Box */}
          {(errors.submit) && (
            <div style={{ 
              padding: '16px 20px', 
              backgroundColor: '#fef2f2', 
              borderRadius: '14px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              border: '1px solid #fecaca'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ color: '#dc2626', fontSize: '14px', fontWeight: '500', margin: 0 }}>
                {errors.submit}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '24px' }}>
              <label className="premium-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your_id@uhasbasic.edu.gh"
                  className="premium-input"
                  style={{
                    paddingLeft: '52px',
                    borderColor: errors.email ? '#ef4444' : 'var(--brand-slate-200)',
                    boxShadow: errors.email ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none'
                  }}
                />
              </div>
              {errors.email && (
                <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', fontWeight: '600' }}>{errors.email}</p>
              )}
            </div>


            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label className="premium-label">Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="premium-input"
                  style={{
                    paddingLeft: '52px',
                    paddingRight: '52px',
                    borderColor: errors.password ? '#ef4444' : 'var(--brand-slate-200)',
                    boxShadow: errors.password ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '18px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8'
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', fontWeight: '600' }}>{errors.password}</p>
              )}
            </div>


            {/* Remember & Forgot */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '32px' 
            }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    marginRight: '10px',
                    accentColor: '#00843e',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Remember me</span>
              </label>
              <a href="#" style={{ 
                fontSize: '14px', 
                color: '#00843e', 
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="premium-btn-primary"
              style={{
                width: '100%',
                padding: '18px',
                fontSize: '16px',
                opacity: isSubmitting || authLoading ? 0.8 : 1
              }}
            >

              {(isSubmitting || authLoading) ? (
                <>
                  <svg 
                    style={{ animation: 'spin 1s linear infinite' }}
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ 
            marginTop: '40px', 
            paddingTop: '24px', 
            borderTop: '1px solid #e2e8f0', 
            textAlign: 'center' 
          }}>
            <p style={{ color: '#64748b', fontSize: '13px' }}>
              © {new Date().getFullYear()} UHAS-Basic School. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* CSS for animation and responsiveness */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus {
          border-color: #00843e !important;
          box-shadow: 0 0 0 3px rgba(0, 132, 62, 0.1) !important;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .branding-panel h1 {
            font-size: 28px !important;
          }
          .branding-panel img {
             width: 120px !important;
             height: 120px !important;
          }
        }

        @media (max-width: 850px) {
          .login-container {
            flex-direction: column !important;
          }
          
          .branding-panel {
            padding: 40px 20px !important;
            min-height: auto !important;
            flex: none !important;
          }

          .branding-panel p:last-of-type {
            display: none;
          }

          .branding-panel .school-logo-container {
            width: 100px !important;
            height: 100px !important;
            border-radius: 25px !important;
            margin-bottom: 20px !important;
          }

          .branding-panel h1 {
            font-size: 24px !important;
          }

          .login-panel {
            padding: 30px 20px !important;
            background-color: #f4f7fe;
          }

          .login-panel > div {
            max-width: 100% !important;
          }
        }

        @media (max-width: 480px) {
          .branding-panel {
            padding: 30px 15px !important;
          }
          
          .login-panel {
            padding: 20px 15px !important;
          }

          .login-panel h2 {
            font-size: 24px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
