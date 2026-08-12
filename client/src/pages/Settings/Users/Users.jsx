import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import SettingsTabs from '../../../components/layout/SettingsTabs';
import { settingsAPI } from '../../../services/api';
import '../Settings.css';

const SettingsUsers = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Settings');
  const [loading, setLoading] = useState(true);
  const [identities, setIdentities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchIdentities = async () => {
      try {
        const response = await settingsAPI.getIdentities();
        if (response.data.success) {
          setIdentities(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching identities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIdentities();
  }, []);

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); navigate('/login'); } };

  const filteredIdentities = identities.filter(id => 
    id.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    id.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    id.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '1000', color: 'var(--slate-900)', letterSpacing: '-2px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Identity <span style={{ color: 'var(--brand-green)' }}>Management</span>
          </h1>
          <p style={{ color: 'var(--slate-500)', fontWeight: '600', marginTop: '4px' }}>Listing of all active and legacy security nodes within the system.</p>
        </header>

        <SettingsTabs />

        <div className="settings-card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '28px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="settings-card-title">Identity Registry</h3>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>Consolidated view of institutional human vectors</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input 
                  type="text" 
                  placeholder="Search identities..." 
                  className="settings-input" 
                  style={{ padding: '10px 16px 10px 44px', width: '240px', fontSize: '13px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="premium-btn-primary" style={{ padding: '10px 20px', fontSize: '13px', borderRadius: '14px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '6px' }}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>
                New Identity
              </button>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto', minHeight: '300px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <div className="animate-pulse" style={{ color: 'var(--brand-green)', fontWeight: '800', fontSize: '16px' }}>Decrypting Identity Matrix...</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#ffffff' }}>
                    <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Identity Node</th>
                    <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Security Role</th>
                    <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                    <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Temporal Link</th>
                    <th style={{ padding: '16px 32px', textAlign: 'right', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Management</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIdentities.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#64748b', fontSize: '16px', border: '1px solid #e2e8f0' }}>{u.name[0]}</div>
                          <div>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{u.name}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: '10px', 
                          fontSize: '11px', 
                          fontWeight: '900', 
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          backgroundColor: u.role === 'Admin' ? '#fefce8' : '#f0f9ff', 
                          color: u.role === 'Admin' ? '#854d0e' : '#0369a1',
                          border: `1px solid ${u.role === 'Admin' ? '#fef08a' : '#bae6fd'}`
                        }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: u.status === 'Active' ? 'var(--brand-green)' : '#ef4444', boxShadow: `0 0 10px ${u.status === 'Active' ? 'var(--brand-green)' : '#ef4444'}` }}></div>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: u.status === 'Active' ? 'var(--brand-green)' : '#ef4444' }}>{u.status}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>Last Presence</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{u.lastLogin}</p>
                        </div>
                      </td>
                      <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button className="premium-btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '10px' }}>Configure</button>
                          <button style={{ padding: '8px 14px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>Revoke</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div style={{ padding: '20px 32px', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Displaying {filteredIdentities.length} identity nodes</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="settings-tab active" style={{ padding: '6px 12px', fontSize: '12px' }}>1</button>
              <button className="settings-tab" style={{ padding: '6px 12px', fontSize: '12px' }}>2</button>
            </div>
          </div>
        </div>
    </>
  );
};

export default SettingsUsers;

