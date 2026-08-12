
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Standard Top Navigation Bar Component
// The left side (search) is consistent across all pages
// The right side displays user info based on the logged-in user
const TopNav = ({ user, onLogout, title, onSearch }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [settings, setSettings] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const { logout, user: authUser } = useAuth();
  const currentUser = user || authUser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, eventsRes] = await Promise.all([
          import('../../services/api').then(m => m.settingsAPI.getSettings()),
          import('../../services/api').then(m => m.eventAPI.getUpcoming())
        ]);
        
        if (settingsRes.data?.success) {
          setSettings(settingsRes.data.settings);
        }
        
        if (eventsRes.data?.success) {
          setNotifications(eventsRes.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching TopNav data:', error);
      }
    };

    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      if (onLogout) {
        onLogout();
      } else {
        await logout();
      }
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      sessionStorage.removeItem('authToken');
      navigate('/login');
    }
  };

  // Get user display info
  const getUserDisplayName = () => {
    const firstName = currentUser?.first_name || currentUser?.firstName;
    const lastName = currentUser?.last_name || currentUser?.lastName;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    return currentUser?.email?.split('@')[0] || 'User';
  };

  const getUserRole = () => {
    const roleLabels = {
      admin: 'Administrator',
      teacher: 'Teacher',
      student: 'Student',
      parent: 'Parent',
      finance: 'Finance Officer',
      'it-support': 'IT Support'
    };
    return roleLabels[currentUser?.role] || currentUser?.role || 'User';
  };

  const getUserInitials = () => {
    const firstName = currentUser?.first_name || currentUser?.firstName;
    const lastName = currentUser?.last_name || currentUser?.lastName;
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    }
    if (firstName) {
      return firstName[0];
    }
    return 'U';
  };

  const getUserColor = () => {
    const colors = {
      admin: 'var(--brand-green)',    // Brand Green
      teacher: 'var(--brand-green)',
      student: 'var(--brand-yellow)',  // Brand Yellow
      parent: 'var(--brand-yellow)',
      finance: 'var(--brand-green)',
      'it-support': 'var(--brand-yellow)'
    };
    return colors[currentUser?.role] || 'var(--brand-green)';
  };

  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <div className="main-top-nav" style={{
      height: 'var(--top-nav-height)',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--content-padding)',
      position: 'fixed',
      top: 0,
      left: 'var(--main-margin)',
      right: 0,
      zIndex: 99,
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
      transition: 'all 0.3s ease'

    }}>
      {/* Mobile Toggle */}
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
        style={{
          display: 'none',
          padding: '10px',
          marginRight: '10px',
          borderRadius: '12px',
          backgroundColor: '#f1f5f9',
          border: 'none',
          cursor: 'pointer'
        }}
        className="mobile-toggle"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-toggle { display: block !important; }
        }
      `}</style>

      {/* Left Side - Spacer */}
      <div style={{ flex: 1 }}></div>

      {/* Right Side - User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Session Indicator */}
        <div className="topnav-session" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 18px',
          backgroundColor: '#f0fdf4',
          borderRadius: '12px',
          border: '1px solid #bbf7d0'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2">
            <path d="M12 14l9-5-9-5-9 5 9 5z"/>
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
          </svg>
          <span style={{ fontSize: '13px', color: 'var(--brand-green)', fontWeight: '600' }}>
            {settings ? `${settings.current_session} | ${settings.current_term}` : '2024/2025'}
          </span>
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative', cursor: 'pointer', padding: '10px', borderRadius: '12px', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          {notifications.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              minWidth: '16px',
              height: '16px',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              border: '2px solid white',
              color: 'white',
              fontSize: '10px',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px'
            }}>
              {notifications.length}
            </span>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '14px', 
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '14px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {/* User Avatar */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: getUserColor(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '800',
              fontSize: '13px',
              boxShadow: `0 8px 16px ${getUserColor() === 'var(--brand-green)' ? 'rgba(0, 132, 62, 0.25)' : 'rgba(250, 204, 21, 0.25)'}`

            }}>
              {getUserInitials()}
            </div>
            
            {/* User Info */}
            <div className="topnav-user-info">
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                {getUserDisplayName()}
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                {getUserRole()}
              </p>
            </div>
            
            {/* Dropdown Arrow */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d={showDropdown ? "M19 14l-7 7m0 0l-7-7m7 7V3" : "M19 9l-7 7-7-7"}/>
            </svg>
          </div>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '240px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              border: '1px solid #f1f5f9',
              overflow: 'hidden',
              zIndex: 1000,
              animation: 'fadeIn 0.2s ease-out'
            }}>
              {/* User Details */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: getUserColor(),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '16px'
                  }}>
                    {getUserInitials()}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                      {getUserDisplayName()}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>{currentUser?.email || 'email@example.com'}</p>
                  </div>
                </div>
              </div>
              
              {/* Menu Items */}
              <div style={{ padding: '8px' }}>
                <button 
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/account/config');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: '500',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = '#1e293b';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  My Profile
                </button>
                
                <button 
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/account/config');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: '500',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = '#1e293b';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Settings
                </button>
                
                <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '8px', paddingTop: '8px' }}>
                  <button 
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontSize: '14px',
                      fontWeight: '500',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef2f2';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNav;

