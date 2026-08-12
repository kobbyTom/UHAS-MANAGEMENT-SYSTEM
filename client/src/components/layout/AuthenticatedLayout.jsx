import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleBasedSidebar from './RoleBasedSidebar';
import TopNav from './TopNav';

const AuthenticatedLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = '/login';
    }
  };

  return (
    <div className="authenticated-app-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'white' }}>
      <RoleBasedSidebar user={user} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      
      <div className="main-content-wrapper responsive-layout-wrapper" style={{ 
        flex: 1, 
        position: 'relative', 
        minHeight: '100vh',
        transition: 'margin-left 0.3s ease'
      }}>
        <TopNav user={user} onLogout={handleLogout} />
        
        <div style={{ 
          padding: 'calc(var(--top-nav-height) + 40px) var(--content-padding) 60px var(--content-padding)',
          maxWidth: 'var(--main-content-max-width, 1800px)',
          margin: '0',
          animation: 'fadeIn 0.4s ease-out'
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
