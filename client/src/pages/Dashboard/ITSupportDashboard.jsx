import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ icon, title, value, color, loading, subtitle, onClick }) => (
  <div onClick={onClick} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: onClick ? 'pointer' : 'default' }}
    onMouseOver={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)'; } }}
    onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
  >
    <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
    <div>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: '500' }}>{title}</p>
      {loading
        ? <div style={{ width: '60px', height: '28px', backgroundColor: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
        : <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>{value || 0}</p>}
      {subtitle && <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{subtitle}</p>}
    </div>
  </div>
);

const SystemHealth = () => {
  const items = [
    { label: 'Main Server', detail: 'CPU: 42% | RAM: 68%', status: 'Online', statusColor: 'var(--brand-green)', bg: 'var(--brand-green-light)', icon: 'M2 2h20v8H2zM2 14h20v8H2zM6 6h.01M6 18h.01' },
    { label: 'Primary Database', detail: 'Connections: 142 | Latency: 12ms', status: 'Connected', statusColor: 'var(--brand-green)', bg: 'var(--brand-green-light)', icon: 'M12 2C7.029 2 3 3.343 3 5v14c0 1.657 4.029 3 9 3s9-1.343 9-3V5c0-1.657-4.029-3-9-3z' },
    { label: 'API Gateway', detail: 'Avg Response: 240ms', status: 'Degraded', statusColor: '#a16207', bg: '#fef9c3', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  ];
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={item.statusColor} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/></svg>
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{item.label}</h4>
              <p style={{ fontSize: '12px', color: '#64748b' }}>{item.detail}</p>
            </div>
          </div>
          <span style={{ padding: '6px 12px', backgroundColor: item.bg, color: item.statusColor, borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', backgroundColor: item.statusColor, borderRadius: '50%' }}></span>
            {item.status}
          </span>
        </div>
      ))}
    </div>
  );
};

const ErrorLogsTable = ({ onViewAll }) => {
  const logs = [
    { id: 'ERR-942', time: '10:45 AM', type: 'Database Timeout', user: 'system', status: 'Unresolved' },
    { id: 'ERR-941', time: '09:12 AM', type: 'Failed Login Attempt', user: 'admin@school.edu', status: 'Resolved' },
    { id: 'ERR-940', time: '08:30 AM', type: 'API Rate Limit', user: 'api_client', status: 'Resolved' },
    { id: 'ERR-939', time: 'Yesterday', type: 'Missing Token', user: 'student_124', status: 'Resolved' },
  ];
  return (
    <div style={{ padding: '20px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            {['Log ID', 'Time', 'Error Type', 'Affected User', 'Status'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#ffffff'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <td style={{ padding: '14px 8px', fontSize: '13px', fontWeight: '600', color: 'var(--brand-green)' }}>{log.id}</td>
              <td style={{ padding: '14px 8px', fontSize: '13px', color: '#64748b' }}>{log.time}</td>
              <td style={{ padding: '14px 8px', fontSize: '13px', color: '#1e293b' }}>{log.type}</td>
              <td style={{ padding: '14px 8px', fontSize: '13px', color: '#64748b' }}>{log.user}</td>
              <td style={{ padding: '14px 8px' }}>
                <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: log.status === 'Resolved' ? 'var(--brand-green-light)' : '#fee2e2', color: log.status === 'Resolved' ? 'var(--brand-green)' : '#dc2626' }}>
                  {log.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ITSupportDashboard = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [loading, setLoading] = useState(false);
  const [storedUser, setStoredUser] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const saved = localStorage.getItem('authUser');
    if (saved) { try { setStoredUser(JSON.parse(saved)); } catch (e) {} }
  }, []);

  if (authLoading || !isAuthenticated) return null;

  const currentUser = storedUser || user;

  const userMgmtActions = [
    { label: 'Reset Passwords', desc: 'Force reset for any user', path: '/settings/users', icon: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4' },
    { label: 'Role Assignment', desc: 'Modify user permissions', path: '/settings/roles', icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6' },
    { label: 'Manage Users', desc: 'Add, edit or deactivate accounts', path: '/settings/users', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  ];

  return (
    <div className="it-dashboard-content">
      <div style={{ padding: '0 0 40px 0', animation: 'fadeIn 0.5s ease-out' }}>

          {/* Header */}
          <div className="page-header" style={{ marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', letterSpacing: '-0.5px' }}>IT Support Dashboard</h1>
              <p style={{ fontSize: '15px', color: '#64748b', marginTop: '6px' }}>Monitor system health, manage users, and resolve tickets.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => navigate('/settings/users')} style={{ padding: '10px 16px', backgroundColor: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--brand-green)'; e.currentTarget.style.color = 'var(--brand-green)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Manage Users
              </button>
              <button onClick={() => window.location.reload()} style={{ padding: '10px 18px', backgroundColor: 'var(--brand-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0,132,62,0.2)', transition: 'background-color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--brand-green-dark)'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--brand-green)'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                Refresh Systems
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="responsive-grid-4" style={{ marginBottom: '30px' }}>
            <StatCard icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} title="System Uptime" value="99.9%" subtitle="Last 30 days" color="#dcfce7" loading={loading} />
            <StatCard icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} title="Active Sessions" value="342" subtitle="+12% from last hour" color="#dcfce7" loading={loading}
              onClick={() => navigate('/settings/users')} />
            <StatCard icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} title="Error Logs" value="14" subtitle="Requires attention" color="#fef9c3" loading={loading}
              onClick={() => navigate('/it/logs')} />
            <StatCard icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>} title="Open Tickets" value="8" subtitle="4 High Priority" color="#fef9c3" loading={loading}
              onClick={() => navigate('/it/tickets')} />
          </div>

          {/* System Health + Error Logs */}
          <div className="responsive-grid-2" style={{ marginBottom: '24px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>System Health</h2>
                <button onClick={() => navigate('/it/system')} style={{ fontSize: '13px', color: 'var(--brand-green)', cursor: 'pointer', fontWeight: '600', background: 'none', border: 'none' }}>View Details</button>
              </div>
              <SystemHealth />
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Recent Error Logs</h2>
                <button onClick={() => navigate('/it/logs')} style={{ backgroundColor: 'transparent', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', fontWeight: '600', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--brand-green)'; e.currentTarget.style.color = 'var(--brand-green)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                >View All Logs</button>
              </div>
              <ErrorLogsTable />
            </div>
          </div>

          {/* Bottom row: User Mgmt + Security Banner */}
          <div className="responsive-grid-3">
            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>User Management</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userMgmtActions.map((action, i) => (
                  <button key={i} onClick={() => navigate(action.path)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%' }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = 'var(--brand-green)'; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  >
                    <div style={{ backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '6px', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{action.label}</p>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>{action.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ gridColumn: 'span 2', backgroundColor: '#1e293b', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '-20px', top: '-10px', opacity: '0.07' }}>
                <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ padding: '4px 10px', backgroundColor: '#ef4444', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>URGENT</span>
                  <span style={{ padding: '4px 10px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Security</span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Security Audit Required</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '80%', marginBottom: '24px', lineHeight: '1.6' }}>
                  The quarterly security audit and vulnerability assessment is due in 5 days. Ensure all database backups and firewall configurations have been reviewed.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => navigate('/settings')} style={{ padding: '10px 20px', backgroundColor: 'var(--brand-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--brand-green-dark)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--brand-green)'}
                  >Begin Audit Checklist</button>
                  <button onClick={() => navigate('/it/system')} style={{ padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  >View System Status</button>
                </div>
              </div>
            </div>
          </div>

        </div>
    </div>
  );
};

export default ITSupportDashboard;
