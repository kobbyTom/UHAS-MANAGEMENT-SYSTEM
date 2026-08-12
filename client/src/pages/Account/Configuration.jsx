import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';

// Premium Icon Components
const Icons = {
  User: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Lock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Bell: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Camera: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
};

const Configuration = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [storedUser, setStoredUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('Configuration');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
  }, []);

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); navigate('/login'); }
  };

  const currentUser = storedUser || user;

  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleUpdateProfile = async () => {
    setProfileStatus({ type: '', message: '' });
    try {
      setIsUpdatingProfile(true);
      const response = await authAPI.updateProfile(formData);
      if (response.data.success) {
        setProfileStatus({ type: 'success', message: 'Profile synchronized successfully!' });
        const updatedUser = { ...currentUser, ...response.data.user };
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
        setStoredUser(updatedUser);
      } else {
        setProfileStatus({ type: 'error', message: response.data.message || 'Failed to update profile.' });
      }
    } catch (err) {
      setProfileStatus({ type: 'error', message: err.response?.data?.message || 'An error occurred while synchronizing profile.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Notifications State
  const [notifications, setNotifications] = useState({
    systemAlerts: currentUser?.notification_preferences?.systemAlerts ?? true,
    academicUpdates: currentUser?.notification_preferences?.academicUpdates ?? true,
    financialNotices: currentUser?.notification_preferences?.financialNotices ?? false,
    directMessages: currentUser?.notification_preferences?.directMessages ?? true,
  });
  const [notifStatus, setNotifStatus] = useState({ type: '', message: '' });
  const [isUpdatingNotif, setIsUpdatingNotif] = useState(false);

  const handleToggleNotif = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdateNotifications = async () => {
    setNotifStatus({ type: '', message: '' });
    try {
      setIsUpdatingNotif(true);
      const response = await authAPI.updateNotifications({ notifications });
      if (response.data.success) {
        setNotifStatus({ type: 'success', message: 'Notification matrix updated successfully!' });
        const updatedUser = { ...currentUser, notification_preferences: notifications };
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
        setStoredUser(updatedUser);
      } else {
        setNotifStatus({ type: 'error', message: response.data.message || 'Failed to update preferences.' });
      }
    } catch (err) {
      setNotifStatus({ type: 'error', message: err.response?.data?.message || 'An error occurred while saving preferences.' });
    } finally {
      setIsUpdatingNotif(false);
    }
  };

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = async () => {
    setPasswordStatus({ type: '', message: '' });
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'All fields are required.' });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    try {
      setIsUpdatingPassword(true);
      const response = await authAPI.updatePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      if (response.data.success) {
        setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordStatus({ type: 'error', message: response.data.message || 'Failed to update password.' });
      }
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err.response?.data?.message || 'An error occurred while updating the password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-1.5px', fontFamily: "'Outfit', sans-serif" }}>
          Account <span style={{ color: 'var(--brand-green)' }}>Configuration</span>
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', marginTop: '12px', fontWeight: '500', maxWidth: '600px' }}>
          Personalize your institutional profile and manage security parameters.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '48px' }}>
        {/* Left Nav Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<Icons.User />} label="Profile Details" />
          <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Icons.Lock />} label="Security & Protection" />
          <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={<Icons.Bell />} label="Notification Matrix" />
        </div>

        {/* Right Content Area */}
        <div className="glass-card" style={{ padding: '48px', borderRadius: '32px' }}>
          {activeTab === 'profile' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '48px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                    width: '120px', 
                    height: '120px', 
                    borderRadius: '40px', 
                    background: 'linear-gradient(135deg, var(--brand-green) 0%, #006831 100%)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white', 
                    fontSize: '48px', 
                    fontWeight: '900',
                    boxShadow: '0 20px 40px rgba(0, 132, 62, 0.2)'
                  }}>
                    {formData.firstName?.[0] || 'A'}
                  </div>
                  <button style={{ 
                    position: 'absolute', 
                    bottom: '-5px', 
                    right: '-5px', 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '16px', 
                    backgroundColor: 'white', 
                    border: '1.5px solid #f1f5f9', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer', 
                    boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
                    color: 'var(--brand-green)'
                  }}>
                    <Icons.Camera />
                  </button>
                </div>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '850', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{formData.firstName} {formData.lastName}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      backgroundColor: 'var(--brand-green-soft)', 
                      color: 'var(--brand-green)', 
                      borderRadius: '10px', 
                      fontSize: '11px', 
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      {currentUser?.role || 'Administrator'}
                    </span>
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Active institutional node</span>
                  </div>
                </div>
              </div>

              {profileStatus.message && (
                <div style={{ 
                  padding: '16px 20px', 
                  borderRadius: '16px', 
                  marginBottom: '32px', 
                  backgroundColor: profileStatus.type === 'error' ? '#fef2f2' : '#ecfdf5',
                  color: profileStatus.type === 'error' ? '#ef4444' : '#10b981',
                  fontWeight: '700',
                  fontSize: '14px',
                  border: `1px solid ${profileStatus.type === 'error' ? '#fca5a5' : '#a7f3d0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {profileStatus.type === 'success' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  )}
                  {profileStatus.message}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                <InputField label="Institutional Email" name="email" value={formData.email} onChange={handleChange} type="email" />
                <InputField label="Primary Contact" name="phone" value={formData.phone} onChange={handleChange} />
              </div>

              <div style={{ marginTop: '56px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '32px' }}>
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                  className="premium-btn-primary"
                  style={{ 
                    padding: '16px 48px', 
                    borderRadius: '16px', 
                    fontWeight: '800', 
                    fontSize: '15px'
                  }}
                >
                  {isUpdatingProfile ? 'Synchronizing...' : 'Synchronize Profile'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ animation: 'slideUp 0.4s ease-out' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '850', color: '#0f172a', marginBottom: '32px', letterSpacing: '-0.5px' }}>Credential Management</h2>
              
              {passwordStatus.message && (
                <div style={{ 
                  padding: '16px 20px', 
                  borderRadius: '16px', 
                  marginBottom: '24px', 
                  backgroundColor: passwordStatus.type === 'error' ? '#fef2f2' : '#ecfdf5',
                  color: passwordStatus.type === 'error' ? '#ef4444' : '#10b981',
                  fontWeight: '700',
                  fontSize: '14px',
                  border: `1px solid ${passwordStatus.type === 'error' ? '#fca5a5' : '#a7f3d0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {passwordStatus.type === 'success' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  )}
                  {passwordStatus.message}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '480px' }}>
                <InputField label="Current Protocol Password" name="currentPassword" type="password" placeholder="Enter current password" value={passwords.currentPassword} onChange={handlePasswordChange} />
                <InputField label="New Protocol Password" name="newPassword" type="password" placeholder="Define new password" value={passwords.newPassword} onChange={handlePasswordChange} />
                <InputField label="Verify New Protocol" name="confirmPassword" type="password" placeholder="Confirm new password" value={passwords.confirmPassword} onChange={handlePasswordChange} />
              </div>
              <div style={{ marginTop: '56px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '32px' }}>
                <button 
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword}
                  className="premium-btn-primary"
                  style={{ 
                    padding: '16px 48px', 
                    borderRadius: '16px', 
                    fontWeight: '800', 
                    fontSize: '15px'
                  }}
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Credentials'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ animation: 'slideUp 0.4s ease-out' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '850', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>Notification Matrix</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px', fontWeight: '500' }}>Control which automated system events trigger an alert to your device.</p>
              
              {notifStatus.message && (
                <div style={{ 
                  padding: '16px 20px', 
                  borderRadius: '16px', 
                  marginBottom: '24px', 
                  backgroundColor: notifStatus.type === 'error' ? '#fef2f2' : '#ecfdf5',
                  color: notifStatus.type === 'error' ? '#ef4444' : '#10b981',
                  fontWeight: '700',
                  fontSize: '14px',
                  border: `1px solid ${notifStatus.type === 'error' ? '#fca5a5' : '#a7f3d0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {notifStatus.type === 'success' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  )}
                  {notifStatus.message}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
                <ToggleRow 
                  title="Critical System Alerts" 
                  description="Security warnings, deployment status, and system maintenance." 
                  enabled={notifications.systemAlerts} 
                  onToggle={() => handleToggleNotif('systemAlerts')} 
                />
                <ToggleRow 
                  title="Academic Updates" 
                  description="Grades published, exams scheduled, and new term starts." 
                  enabled={notifications.academicUpdates} 
                  onToggle={() => handleToggleNotif('academicUpdates')} 
                />
                <ToggleRow 
                  title="Financial Notices" 
                  description="Fee collection reports and payroll disbursements." 
                  enabled={notifications.financialNotices} 
                  onToggle={() => handleToggleNotif('financialNotices')} 
                />
                <ToggleRow 
                  title="Direct Messages" 
                  description="Internal communications from other staff members." 
                  enabled={notifications.directMessages} 
                  onToggle={() => handleToggleNotif('directMessages')} 
                />
              </div>

              <div style={{ marginTop: '56px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '32px' }}>
                <button 
                  onClick={handleUpdateNotifications}
                  disabled={isUpdatingNotif}
                  className="premium-btn-primary"
                  style={{ 
                    padding: '16px 48px', 
                    borderRadius: '16px', 
                    fontWeight: '800', 
                    fontSize: '15px'
                  }}
                >
                  {isUpdatingNotif ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 20px',
      borderRadius: '16px',
      backgroundColor: active ? '#00843e' : 'white',
      color: active ? 'white' : '#64748b',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      transition: '0.2s',
      fontWeight: '600',
      boxShadow: active ? '0 10px 20px rgba(0, 132, 62, 0.2)' : '0 4px 12px rgba(0,0,0,0.02)'
    }}
  >
    <div style={{ opacity: active ? 1 : 0.7 }}>{icon}</div>
    <span style={{ fontSize: '14px' }}>{label}</span>
  </button>
);

const InputField = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>{label}</label>
    <input 
      {...props} 
      style={{ 
        padding: '12px 16px', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0', 
        fontSize: '14px', 
        color: '#1e293b', 
        outline: 'none',
        backgroundColor: '#ffffff',
        transition: '0.2s'
      }} 
      onFocus={(e) => e.target.style.borderColor = '#00843e'}
      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
    />
  </div>
);

const ToggleRow = ({ title, description, enabled, onToggle }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: '20px',
    borderRadius: '20px',
    backgroundColor: '#f8fafc',
    border: '1px solid #f1f5f9',
    transition: 'all 0.2s',
    cursor: 'pointer'
  }}
  onClick={onToggle}
  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
  >
    <div>
      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{title}</h4>
      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{description}</p>
    </div>
    <div style={{ 
      width: '44px', 
      height: '24px', 
      borderRadius: '24px', 
      backgroundColor: enabled ? '#00843e' : '#cbd5e1',
      position: 'relative',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: enabled ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'inset 0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        position: 'absolute',
        top: '2px',
        left: enabled ? '22px' : '2px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }} />
    </div>
  </div>
);

export default Configuration;
