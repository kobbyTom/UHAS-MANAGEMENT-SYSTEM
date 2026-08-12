import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { settingsAPI } from '../../services/api';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';

// Premium Icon Components
const Icons = {
  History: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Monitor: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Smartphone: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  Shield: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

const LoginHistory = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [storedUser, setStoredUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('Login History');
  const [loading, setLoading] = useState(true);
  const [loginSessions, setLoginSessions] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await settingsAPI.getLoginHistory();
      if (res.data?.success) {
        setLoginSessions(res.data.data);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); navigate('/login'); }
  };

  const currentUser = storedUser || user;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-1.5px', fontFamily: "'Outfit', sans-serif" }}>
          Login <span style={{ color: 'var(--brand-green)' }}>History</span>
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', marginTop: '12px', fontWeight: '500', maxWidth: '600px' }}>
          Chronological ledger of account access nodes and recognized hardware signatures.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
        {/* Summary Banner */}
        <div style={{ 
          background: 'linear-gradient(135deg, #00843e 0%, #006831 100%)', 
          borderRadius: '32px', 
          padding: '40px', 
          color: 'white', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 20px 50px rgba(0, 132, 62, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1 }}>
            <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}><Icons.Shield /></div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '850', margin: 0, letterSpacing: '-0.5px' }}>Identity Security Verified</h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', marginTop: '6px', fontWeight: '500' }}>Your account is fortified with institutional-grade protection protocols.</p>
            </div>
          </div>
          <button 
            className="premium-btn-secondary"
            style={{ 
              padding: '16px 32px', 
              backgroundColor: 'white', 
              color: '#00843e', 
              border: 'none', 
              borderRadius: '16px', 
              fontWeight: '800', 
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              position: 'relative',
              zIndex: 1
            }}
          >
            Audit Security Settings
          </button>
        </div>

        {/* Sessions Table */}
        <div className="glass-card" style={{ borderRadius: '32px', overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '32px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: 'var(--brand-green)', padding: '10px', backgroundColor: 'var(--brand-green-soft)', borderRadius: '12px' }}><Icons.History /></div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0, letterSpacing: '-0.4px' }}>Temporal Access Log</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <th style={{ textAlign: 'left', padding: '24px 40px', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Device / Ecosystem</th>
                  <th style={{ textAlign: 'left', padding: '24px 40px', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Network Node (IP)</th>
                  <th style={{ textAlign: 'left', padding: '24px 40px', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Geolocation</th>
                  <th style={{ textAlign: 'left', padding: '24px 40px', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Temporal Node</th>
                  <th style={{ textAlign: 'right', padding: '24px 40px', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Fidelity Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '80px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #00843e', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <p style={{ marginTop: '20px', color: '#64748b', fontSize: '15px', fontWeight: '600' }}>Retrieving chronological data...</p>
                    </td>
                  </tr>
                ) : loginSessions.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '100px', textAlign: 'center' }}>
                      <p style={{ color: '#94a3b8', fontSize: '16px', fontWeight: '600' }}>No historical access nodes discovered.</p>
                    </td>
                  </tr>
                ) : (
                  loginSessions.map((session, index) => (
                    <tr key={session.id || index} style={{ borderBottom: '1px solid #ffffff', transition: 'all 0.2s ease' }}>
                      <td style={{ padding: '24px 40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '12px', color: '#64748b' }}>
                            {(session.device || '').includes('Mobile') || (session.device || '').includes('iOS') || (session.device || '').includes('Android') ? <Icons.Smartphone /> : <Icons.Monitor />}
                          </div>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{session.device || 'Legacy Hardware'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '24px 40px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                        <span style={{ padding: '4px 10px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #f1f5f9' }}>{session.ip_address || 'Unresolved'}</span>
                      </td>
                      <td style={{ padding: '24px 40px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{session.location || 'Ghana'}</td>
                      <td style={{ padding: '24px 40px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{formatDate(session.login_time)}</td>
                      <td style={{ padding: '24px 40px', textAlign: 'right' }}>
                        <span style={{ 
                          padding: '8px 16px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          backgroundColor: index === 0 ? 'var(--brand-green-soft)' : '#f1f5f9',
                          color: index === 0 ? 'var(--brand-green)' : '#64748b',
                          border: `1px solid ${index === 0 ? 'rgba(0,132,62,0.1)' : 'transparent'}`
                        }}>
                          {index === 0 ? 'Active Matrix' : 'Authenticated'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginHistory;
