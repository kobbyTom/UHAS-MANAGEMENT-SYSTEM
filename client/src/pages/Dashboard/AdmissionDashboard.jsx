import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, parentAPI, dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Icon components
const Icons = {
  Users: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  UserPlus: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  TrendingUp: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Search: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Clock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

// Metric Card Component
const MetricCard = ({ title, value, icon, color, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      backgroundColor: 'white',
      borderRadius: '24px',
      padding: '24px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      border: '1px solid #f1f5f9'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
      <div style={{ 
        width: '48px', 
        height: '48px', 
        borderRadius: '12px', 
        backgroundColor: `${color}15`, 
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
    </div>
    <p style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{value}</p>
  </div>
);

// Recent Admission Row
const AdmissionRow = ({ student, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      borderRadius: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      borderBottom: '1px solid #ffffff'
    }}
    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
  >
    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--brand-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
      {student.firstName[0]}{student.lastName[0]}
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{student.firstName} {student.lastName}</p>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>{student.grade} • {student.admissionNumber}</p>
    </div>
    <div style={{ textAlign: 'right' }}>
      <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#10b981' }}>ENROLLED</span>
      <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>{new Date(student.createdAt).toLocaleDateString()}</p>
    </div>
  </div>
);

const AdmissionDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [stats, setStats] = useState({ totalStudents: 0, newThisMonth: 0, totalParents: 0 });
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes] = await Promise.all([
        dashboardAPI.getAdminOverview()
      ]);

      if (overviewRes?.data?.success) {
        const { stats, recentStudents } = overviewRes.data.data;
        setStats({
          totalStudents: stats.students || 0,
          newThisMonth: stats.activeStudents || 0, // Using active students as proxy for new/recent for now
          totalParents: stats.parents || 0
        });
        setRecentAdmissions(recentStudents || []);
      }
    } catch (err) {
      console.error('Error fetching admission data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } finally { navigate('/login'); }
  };

  if (loading) return null;

  return (
    <div className="admission-dashboard-content">
      <main style={{ padding: '0 0 40px 0', animation: 'fadeIn 0.5s ease-out' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Admission Portal</h1>
            <p style={{ fontSize: '15px', color: '#64748b', marginTop: '4px' }}>Welcome, {user.firstName}. Manage student enrollments and records.</p>
          </div>

          <div className="responsive-grid-3" style={{ marginBottom: '32px' }}>
            <MetricCard title="Total Students" value={stats.totalStudents} icon={<Icons.Users />} color="var(--brand-green)" onClick={() => navigate('/students')} />
            <MetricCard title="New Admissions" value={stats.newThisMonth} icon={<Icons.TrendingUp />} color="#8b5cf6" subtitle="This Month" />
            <MetricCard title="Linked Parents" value={stats.totalParents} icon={<Icons.Users />} color="#f59e0b" onClick={() => navigate('/parents')} />
          </div>

          <div className="responsive-grid-2" style={{ gap: '32px' }}>
            {/* Quick Admissions Actions */}
            <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>Admission Actions</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                <button 
                  onClick={() => navigate('/students/add')}
                  style={{ width: '100%', padding: '20px', backgroundColor: 'var(--brand-green)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Icons.UserPlus /> Register New Student
                </button>
                <button 
                  onClick={() => navigate('/students')}
                  style={{ width: '100%', padding: '20px', backgroundColor: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                >
                  <Icons.Users /> View All Students
                </button>
                <button 
                  onClick={() => navigate('/parents')}
                  style={{ width: '100%', padding: '20px', backgroundColor: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                >
                  <Icons.Users /> Manage Parent Records
                </button>
              </div>
            </div>

            {/* Recent Admissions */}
            <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Recent Admissions</h2>
                <button onClick={() => navigate('/students')} style={{ color: 'var(--brand-green)', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>View All</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentAdmissions.length > 0 ? (
                  recentAdmissions.map(student => (
                    <AdmissionRow key={student.id} student={student} onClick={() => navigate(`/students/${student.id}`)} />
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No recent admissions found.</div>
                )}
              </div>
            </div>
          </div>
        </main>
    </div>
  );
};

export default AdmissionDashboard;
