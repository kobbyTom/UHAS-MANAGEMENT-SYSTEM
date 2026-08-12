import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';

const SettingsLayout = () => {
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Settings');

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
    <div className="settings-module-content">
      <Outlet />
    </div>
  );
};

export default SettingsLayout;
