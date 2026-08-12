import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';


const SettingsTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'general', label: 'Institutional Identity', path: '/settings/general', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18M3 7v1a3 3 0 006 0V7m0 1a3 3 0 006 0V7m0 1a3 3 0 006 0V7M4 21V4a2 2 0 012-2h12a2 2 0 012 2v17"/></svg>
    )},
    { id: 'academic', label: 'Academic Architecture', path: '/settings/academic', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    )},
    { id: 'users', label: 'Identity Registry', path: '/settings/users', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="8" r="3"/></svg>
    )},
    { id: 'roles', label: 'Security Protocols', path: '/settings/roles', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    )}
  ];

  const currentTab = tabs.find(tab => location.pathname === tab.path) || tabs[0];

  return (
    <div style={{ 
      display: 'flex', 
      gap: '8px', 
      marginBottom: '40px', 
      padding: '6px', 
      backgroundColor: '#f1f5f9', 
      borderRadius: '16px', 
      width: 'fit-content',
      border: '1px solid #e2e8f0'
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => navigate(tab.path)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '800',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: location.pathname === tab.path ? 'white' : 'transparent',
            color: location.pathname === tab.path ? 'var(--brand-green)' : '#64748b',
            boxShadow: location.pathname === tab.path ? '0 4px 12px rgba(0, 0, 0, 0.05)' : 'none'
          }}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default SettingsTabs;
