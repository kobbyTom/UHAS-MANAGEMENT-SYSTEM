import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useAlert } from '../../../context/AlertContext';
import api from '../../../services/api';
import { Activity, Search, Filter, Clock, User, Shield, Target } from 'lucide-react';
import PremiumSelect from '../../../components/common/PremiumSelect';

const ActivityLogs = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All');
  const [filterAction, setFilterAction] = useState('All');

  useEffect(() => {
    fetchLogs();
  }, [filterRole, filterAction]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/audit', {
        params: { role: filterRole, action: filterAction, limit: 100 }
      });
      if (res.data.success) {
        setLogs(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      showAlert({ type: 'error', title: 'Error', message: 'Failed to fetch activity logs' });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'UPDATE': return { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' };
      case 'DELETE': return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      case 'LOGIN': return { bg: '#f0f9ff', text: '#0284c7', border: '#e0f2fe' };
      default: return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100%', fontFamily: "'Inter', sans-serif", animation: 'fadeIn 0.5s ease-out' }}>
      <main style={{ padding: '0' }}>
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={24} style={{ color: 'var(--brand-green)' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Oversight</span>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-1px', fontFamily: "'Outfit', sans-serif" }}>
              System <span style={{ color: 'var(--brand-green)' }}>Audit Trail</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '15px', marginTop: '8px', fontWeight: '500' }}>Monitor all activities and state changes across the network.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={fetchLogs} style={{ padding: '12px 24px', backgroundColor: 'white', color: '#0f172a', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--brand-green)'} onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
              <Clock size={16} />
              Refresh Logs
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="responsive-grid-2" style={{ marginBottom: '32px', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter by Role</label>
            <PremiumSelect 
              value={filterRole}
              onChange={setFilterRole}
              options={[
                { value: 'All', label: 'All Roles' },
                { value: 'admin', label: 'Administrator' },
                { value: 'teacher', label: 'Teacher' },
                { value: 'parent', label: 'Parent' },
                { value: 'finance', label: 'Finance' }
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter by Action</label>
            <PremiumSelect 
              value={filterAction}
              onChange={setFilterAction}
              options={[
                { value: 'All', label: 'All Actions' },
                { value: 'LOGIN', label: 'Authentication (Login/Logout)' },
                { value: 'CREATE', label: 'Create Record' },
                { value: 'UPDATE', label: 'Update Record' },
                { value: 'DELETE', label: 'Delete Record' },
                { value: 'READ', label: 'Data Access (Read)' }
              ]}
            />
          </div>
        </div>

        {/* Logs Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Timestamp</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Identity / User</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Action Vector</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Entity / Target</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Network IP</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '60px 24px', textAlign: 'center' }}>
                      <div className="premium-loader" style={{ margin: '0 auto' }}></div>
                      <p style={{ marginTop: '16px', color: '#64748b', fontWeight: '600' }}>Synchronizing audit trail...</p>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '60px 24px', textAlign: 'center' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#94a3b8' }}>
                        <Shield size={32} />
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>No Activity Records</h3>
                      <p style={{ color: '#64748b', fontSize: '14px', margin: 0, fontWeight: '500' }}>The current filter criteria yielded zero results.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map(log => {
                    const actionTheme = getActionColor(log.action);
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>{new Date(log.created_at).toLocaleTimeString()}</div>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={16} style={{ color: '#475569' }} />
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{log.user_name || 'System Auto'}</div>
                              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{String(log.role).toUpperCase()}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <span style={{ 
                            backgroundColor: actionTheme.bg, 
                            color: actionTheme.text, 
                            border: `1px solid ${actionTheme.border}`,
                            padding: '6px 12px', 
                            borderRadius: '8px', 
                            fontSize: '11px', 
                            fontWeight: '800',
                            letterSpacing: '0.5px'
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Target size={14} style={{ color: '#94a3b8' }}/>
                            {log.entity}
                          </div>
                          {log.details?.url && (
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginTop: '4px', fontFamily: 'monospace' }}>{log.details?.method} {log.details?.url}</div>
                          )}
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ padding: '6px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '12px', color: '#475569', fontWeight: '600', fontFamily: 'monospace', display: 'inline-block', border: '1px solid #e2e8f0' }}>
                            {log.ip_address || '127.0.0.1'}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ActivityLogs;
