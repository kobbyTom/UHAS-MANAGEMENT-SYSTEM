import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import SettingsTabs from '../../../components/layout/SettingsTabs';
import PremiumSelect from '../../../components/common/PremiumSelect';
import '../Settings.css';

const General = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Settings');
  
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [storedUser, setStoredUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const currentUser = storedUser || user;

  async function fetchData() {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      if (response?.data?.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
    fetchData();
  }, []);

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); navigate('/login'); }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsAPI.updateSettings(settings);
      setSuccess('Configuration successfully synchronized with central database.');
      setHasChanges(false);
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setSaving(false);
    }
  };



  return (
    <>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div className="premium-loader"></div>
        </div>
      ) : (
        <>
          {success && (
          <div style={{ 
            backgroundColor: '#ecfdf5', 
            color: '#065f46', 
            padding: '16px 24px', 
            borderRadius: '16px', 
            marginBottom: '32px', 
            marginTop: '20px',
            border: '1px solid #d1fae5', 
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }} className="animate-fade-in">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {success}
          </div>
        )}

        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '1000', color: 'var(--slate-900)', letterSpacing: '-2px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Institutional <span style={{ color: 'var(--brand-green)' }}>Configuration</span>
          </h1>
          <p style={{ color: 'var(--slate-500)', fontWeight: '600', marginTop: '4px' }}>Calibrate global parameters and institutional identity vectors.</p>
        </header>

        <SettingsTabs />

        <div className="settings-grid animate-fade-in">
          {/* School Information */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ color: 'var(--brand-green)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18M3 7v1a3 3 0 006 0V7m0 1a3 3 0 006 0V7m0 1a3 3 0 006 0V7M4 21V4a2 2 0 012-2h12a2 2 0 012 2v17"/></svg>
              </div>
              <h3 className="settings-card-title">Institutional Identity</h3>
            </div>
            
            <div className="settings-input-group">
              <label className="settings-label">Official Institution Name</label>
              <input
                type="text"
                className="settings-input"
                value={settings.school_name || settings.schoolName || ''}
                onChange={(e) => handleChange('school_name', e.target.value)}
                placeholder="Enter school name"
              />
            </div>

            <div className="settings-input-group">
              <label className="settings-label">Administrative Email Address</label>
              <input
                type="email"
                className="settings-input"
                value={settings.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="admin@school.com"
              />
            </div>

            <div className="settings-input-group">
              <label className="settings-label">Primary Contact Hotline</label>
              <input
                type="tel"
                className="settings-input"
                value={settings.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+233 XX XXX XXXX"
              />
            </div>

            <div className="settings-input-group">
              <label className="settings-label">Physical Location / Address</label>
              <textarea
                className="settings-input"
                style={{ minHeight: '100px', resize: 'none' }}
                value={settings.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Institutional address..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div className="settings-input-group">
                <label className="settings-label">Active Operational Term</label>
                <PremiumSelect 
                  value={settings.current_term || settings.currentTerm || ''}
                  onChange={(val) => handleChange('current_term', val)}
                  options={[
                    { value: '1st', label: '1st Term' },
                    { value: '2nd', label: '2nd Term' },
                    { value: '3rd', label: '3rd Term' }
                  ]}
                />
              </div>
              <div className="settings-input-group">
                <label className="settings-label">Academic Session</label>
                <input 
                  type="text"
                  className="settings-input"
                  value={settings.current_session || settings.currentSession || ''}
                  onChange={(e) => handleChange('current_session', e.target.value)}
                  placeholder="e.g. 2024/2025"
                />
              </div>
            </div>
          </div>

          {/* Communication Protocols */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ color: 'var(--brand-yellow)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
              </div>
              <h3 className="settings-card-title">Institutional Alerts</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'white', borderRadius: '16px', border: '1.5px solid var(--slate-100)', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => handleChange('emailNotifications', !settings.emailNotifications)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '10px', color: 'var(--brand-green)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Email Broadcasts</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Automated reports and alerts</p>
                  </div>
                </div>
                <input type="checkbox" checked={settings.email_notifications || settings.emailNotifications} readOnly style={{ width: '20px', height: '20px', accentColor: 'var(--brand-green)' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'white', borderRadius: '16px', border: '1.5px solid var(--slate-100)', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => handleChange('smsNotifications', !settings.smsNotifications)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ padding: '10px', backgroundColor: '#fffbeb', borderRadius: '10px', color: 'var(--brand-yellow)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>SMS Integrations</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Critical mobile notifications</p>
                  </div>
                </div>
                <input type="checkbox" checked={settings.sms_notifications || settings.smsNotifications} readOnly style={{ width: '20px', height: '20px', accentColor: 'var(--brand-green)' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'white', borderRadius: '16px', border: '1.5px solid var(--slate-100)', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => handleChange('pushNotifications', !settings.pushNotifications)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '10px', color: '#0284c7' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Real-time Sync</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '500' }}>In-app push synchrony</p>
                  </div>
                </div>
                <input type="checkbox" checked={settings.push_notifications || settings.pushNotifications} readOnly style={{ width: '20px', height: '20px', accentColor: 'var(--brand-green)' }} />
              </div>
            </div>

            <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '20px', border: '1.5px solid var(--slate-100)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '900', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Operational Mode</h4>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className={`settings-tab ${(settings.system_mode || settings.systemMode) === 'production' ? 'active' : ''}`}
                  onClick={() => handleChange('system_mode', 'production')}
                  style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}
                >Live System</button>
                <button 
                  className={`settings-tab ${(settings.system_mode || settings.systemMode) === 'maintenance' ? 'active' : ''}`}
                  onClick={() => handleChange('system_mode', 'maintenance')}
                  style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}
                >Maintenance</button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Save Bar */}
        <div className={`settings-save-bar ${hasChanges ? 'visible' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 0 10px rgba(255,255,255,0.5)' }}></div>
            <span style={{ fontWeight: '700', fontSize: '14px' }}>Unsaved Configuration Changes Detected</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => { fetchData(); setHasChanges(false); }}
              style={{ padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
            >Discard</button>
            <button 
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '10px 24px', backgroundColor: 'white', border: 'none', color: 'var(--brand-green)', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {saving ? 'Synchronizing...' : 'Deploy Changes'}
              {!saving && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
            </button>
          </div>
        </div>
        </>
      )}
    </>
  );
};

export default General;
