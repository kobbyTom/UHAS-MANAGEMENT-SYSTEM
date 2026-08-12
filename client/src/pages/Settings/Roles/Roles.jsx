import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import SettingsTabs from '../../../components/layout/SettingsTabs';
import { settingsAPI } from '../../../services/api';
import '../Settings.css';

const SettingsRoles = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Settings');
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([
    { id: 1, name: 'Administrator', description: 'Unrestricted system access and global configuration authority.', users: 0, permissions: ['All Access', 'System Settings', 'Security Audit'], color: '#ef4444' },
    { id: 2, name: 'Teacher', description: 'Manage academic delivery, student evaluation, and attendance tracking.', users: 0, permissions: ['Academic Mgmt', 'Grade Entry', 'Attendance', 'Course Content'], color: '#3b82f6' },
    { id: 3, name: 'Student', description: 'Access learning materials, submit evaluations, and track academic progress.', users: 0, permissions: ['Course View', 'Assignments', 'Result Access', 'Timetable'], color: '#10b981' },
    { id: 4, name: 'Parent', description: 'Monitor ward performance, attendance records, and financial standing.', users: 0, permissions: ['Child Performance', 'Fee Payment', 'School News'], color: '#f59e0b' },
    { id: 5, name: 'Finance Officer', description: 'Administer institutional finances, fee collections, and economic reporting.', users: 0, permissions: ['Fee Mgmt', 'Expense Tracking', 'Income Audit', 'Payroll'], color: '#8b5cf6' },
    { id: 6, name: 'IT Support', description: 'Maintain system integrity, monitor server status, and provide technical assistance.', users: 0, permissions: ['System Logs', 'Status Monitor', 'Node Audit', 'Technical Support'], color: '#6366f1' },
    { id: 7, name: 'Admission Officer', description: 'Manage the student intake pipeline and academic section allocations.', users: 0, permissions: ['Enrollment', 'Roster Mgmt', 'Class Placement', 'Profile Mgmt'], color: '#06b6d4' },
  ]);

  useEffect(() => {
    const fetchRoleStats = async () => {
      try {
        const response = await settingsAPI.getRoleStats();
        if (response.data.success) {
          const stats = response.data.data;
          setRoles(prevRoles => prevRoles.map(role => {
            const stat = stats.find(s => s.name === role.name);
            return stat ? { ...role, users: stat.users } : role;
          }));
        }
      } catch (error) {
        console.error("Error fetching role stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleStats();
  }, []);

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); navigate('/login'); } };

  return (
    <>
      <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '1000', color: 'var(--slate-900)', letterSpacing: '-2px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Security <span style={{ color: 'var(--brand-green)' }}>Permissions</span>
          </h1>
          <p style={{ color: 'var(--slate-500)', fontWeight: '600', marginTop: '4px' }}>Manage institutional access levels and operational security nodes.</p>
        </header>

        <SettingsTabs />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div className="animate-pulse" style={{ color: 'var(--brand-green)', fontWeight: '800', fontSize: '18px' }}>Synchronizing Security Nodes...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '24px' }} className="animate-fade-in">
          {roles.map((role) => {
            const getIcon = (roleName) => {
              switch(roleName) {
                case 'Administrator': return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
                case 'Teacher': return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
                case 'Student': return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
                case 'Parent': return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="8" r="3"/></svg>;
                case 'Finance Officer': return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
                case 'IT Support': return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
                case 'Admission Officer': return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>;
                default: return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
              }
            };

            return (
              <div key={role.id} className="settings-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                  <div style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '16px', 
                    backgroundColor: `${role.color}10`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: role.color,
                    border: `1px solid ${role.color}20`
                  }}>
                    {getIcon(role.name)}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      padding: '6px 14px', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: '900', 
                      backgroundColor: '#ffffff', 
                      color: '#64748b', 
                      border: '1px solid #e2e8f0', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px' 
                    }}>{role.users.toLocaleString()} Members</span>
                  </div>
                </div>
                
                <div style={{ marginBottom: '24px', flex: 1 }}>
                  <h3 className="settings-card-title">{role.name}</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', marginTop: '10px', lineHeight: '1.6', fontWeight: '500' }}>{role.description}</p>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <p className="settings-label" style={{ marginBottom: '14px' }}>Permission Nodes:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {role.permissions.map((perm, idx) => (
                      <span key={idx} style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', backgroundColor: '#ffffff', color: '#475569', fontWeight: '700', border: '1px solid #e2e8f0' }}>{perm}</span>
                    ))}
                  </div>
                </div>

              <div style={{ display: 'flex', gap: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', marginTop: 'auto' }}>
                <button className="premium-btn-secondary" style={{ flex: 1, padding: '12px', fontSize: '13px' }}>Configure</button>
                <button className="premium-btn-secondary" style={{ flex: 1, padding: '12px', fontSize: '13px', backgroundColor: '#fefce8', color: '#854d0e', border: '1px solid #fef08a' }}>Permissions</button>
              </div>
            </div>
          );
        })}
        </div>
        )}
    </>
  );
};

export default SettingsRoles;
