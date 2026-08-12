import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ModuleNavigation = ({ tabs }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!tabs || tabs.length === 0) return null;

  return (
    <div style={{ 
      display: 'flex', 
      gap: '8px', 
      marginBottom: '32px', 
      backgroundColor: 'white', 
      padding: '8px', 
      borderRadius: '20px',
      width: 'fit-content',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      border: '1.5px solid #f1f5f9'
    }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              padding: '10px 20px',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              border: 'none',
              backgroundColor: isActive ? 'var(--brand-green)' : 'transparent',
              color: isActive ? 'white' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isActive ? '0 4px 12px rgba(0, 132, 62, 0.2)' : 'none'
            }}
          >
            {tab.icon && (
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default ModuleNavigation;
