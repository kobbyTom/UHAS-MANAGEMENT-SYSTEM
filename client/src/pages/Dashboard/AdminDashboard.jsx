import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, teacherAPI, courseAPI, feeAPI, parentAPI, attendanceAPI, staffAPI, academicSubjectsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
// Icon components
const Icons = {
  Users: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Book: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Dollar: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Academic: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  Calendar: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Mail: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Activity: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Check: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  Clock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  UserPlus: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  Graduation: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  TrendUp: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
};

// Metric Card Component
const MetricCard = ({ title, value, icon, color, onClick, subtitle }) => (
  <div 
    onClick={onClick}
    className="glass-card"
    style={{
      cursor: onClick ? 'pointer' : 'default',
      padding: '32px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}
    onMouseOver={(e) => { if (onClick) e.currentTarget.style.transform = 'translateY(-8px)'; }}
    onMouseOut={(e) => { if (onClick) e.currentTarget.style.transform = 'none'; }}
  >
    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: `${color}05`, zIndex: 0 }}></div>
    
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
      <div style={{ 
        width: '64px', 
        height: '64px', 
        borderRadius: '18px', 
        backgroundColor: `${color}12`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: color,
        boxShadow: `0 8px 16px ${color}15`
      }}>
        {icon}
      </div>
      {subtitle && (
        <span style={{ fontSize: '11px', color: color, fontWeight: '900', padding: '6px 14px', backgroundColor: `${color}12`, borderRadius: '24px', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
          {subtitle}
        </span>
      )}
    </div>
    <div style={{ position: 'relative', zIndex: 1 }}>
      <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1.2px' }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <p style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-2px' }}>{value || 0}</p>
      </div>
    </div>
  </div>
);

// Quick Action Button
const ActionCard = ({ icon, title, desc, color, onClick }) => (
  <button 
    onClick={onClick}
    className="glass-card"
    style={{
      width: '100%',
      padding: '28px',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      border: '1.5px solid transparent'
    }}
    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 15px 30px ${color}10`; }}
    onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, transition: 'all 0.3s' }}>
      {icon}
    </div>
    <div>
      <h4 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>{title}</h4>
      <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0', fontWeight: '500' }}>{desc}</p>
    </div>
  </button>
);

// Recent Item Card
const RecentItem = ({ initials, name, subtitle, status, time, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      padding: '20px',
      borderRadius: '20px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      marginBottom: '12px'
    }}
    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.transform = 'translateX(8px)'; }}
    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'none'; }}
  >
    <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '16px', boxShadow: '0 8px 16px rgba(0, 132, 62, 0.2)' }}>
      {initials}
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>{name}</p>
      <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0', fontWeight: '600' }}>{subtitle}</p>
    </div>
    <div style={{ textAlign: 'right' }}>
      {status && (
        <span style={{ fontSize: '11px', fontWeight: '900', padding: '6px 14px', borderRadius: '24px', backgroundColor: status === 'active' ? '#ecfdf5' : '#fef2f2', color: status === 'active' ? '#10b981' : '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {status}
        </span>
      )}
      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '10px 0 0', fontWeight: '700' }}>{time}</p>
    </div>
  </div>
);


const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [storedUser, setStoredUser] = useState(null);
  const [stats, setStats] = useState({ students: 0, teachers: 0, nonTeachingStaff: 0, subjects: 0, revenue: 0, parents: 0, attendanceRate: 0 });
  const [loading, setLoading] = useState(true);
  const [recentStudents, setRecentStudents] = useState([]);
  const [recentTeachers, setRecentTeachers] = useState([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      try { setStoredUser(JSON.parse(savedUser)); } catch (e) { console.error(e); }
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const [studentsRes, teachersRes, subjectsRes, parentsRes, staffRes, attendanceRes] = await Promise.all([
        studentAPI.getAll({ limit: 1000 }),
        teacherAPI.getAll({ limit: 1000 }),
        academicSubjectsAPI.getAll().catch(e => { console.warn('Subjects API failed'); return { data: { data: [] } }; }),
        parentAPI.getAll({ limit: 1000 }).catch(e => { console.warn('Parent API failed'); return null; }),
        staffAPI.getAll({ limit: 1000 }).catch(e => { console.warn('Staff API failed'); return { data: { data: [] } }; }),
        attendanceAPI.getAll({ date: today }).catch(e => { console.warn('Attendance API failed'); return { data: { data: [] } }; })
      ]);

      const students = studentsRes?.data?.data || [];
      const teachers = teachersRes?.data?.data || [];
      const subjects = subjectsRes?.data?.data || [];
      const parents = parentsRes?.data?.data || [];
      const staff = staffRes?.data?.data || [];
      const attendance = attendanceRes?.data?.data || [];

      // Calculate attendance rate
      const totalAttended = attendance.length;
      const presentCount = attendance.filter(r => r.status === 'present').length;
      const attendanceRate = totalAttended > 0 ? Math.round((presentCount / totalAttended) * 100) : 0;

      setStats({
        students: students.length,
        teachers: teachers.length,
        nonTeachingStaff: staff.length,
        subjects: subjects.length,
        revenue: 0,
        parents: parents.length,
        attendanceRate: attendanceRate
      });

      // Get recent students (last 5)
      setRecentStudents(students.slice(0, 5));
      // Get recent teachers (last 5)
      setRecentTeachers(teachers.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      navigate('/login');
    }
  };

  const currentUser = storedUser || user;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-content">
      <main style={{ padding: '0 0 60px 0', animation: 'fadeIn 0.5s ease-out' }}>
          {/* Header */}
          <div className="page-header" style={{ marginBottom: '48px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Institutional Nexus</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Oversight</span>
              </div>
              <h1 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-2px' }}>Executive <span style={{ color: 'var(--brand-green)' }}>Dashboard</span></h1>
              <p style={{ fontSize: '17px', color: '#64748b', marginTop: '10px', fontWeight: '500' }}>Synchronized intelligence and institutional performance metrics for <span style={{ color: '#0f172a', fontWeight: '700' }}>UHAS Basic School</span>.</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="premium-btn-secondary" onClick={fetchDashboardData} style={{ padding: '14px 24px' }}>
                <Icons.Activity /> Refresh Sync
              </button>
            </div>
          </div>



          {/* Metrics Grid */}
          <div className="responsive-grid-3" style={{ marginBottom: '40px' }}>
            <MetricCard 
              title="Total Students" 
              value={stats.students} 
              icon={<Icons.Users />}
              color="var(--brand-green)"
              onClick={() => navigate('/students')}
            />
            <MetricCard 
              title="Total Number of Teachers" 
              value={stats.teachers} 
              icon={<Icons.Graduation />}
              color="#00843e"
              onClick={() => navigate('/staff')}
            />
            <MetricCard 
              title="Non-Teaching Staff" 
              value={stats.nonTeachingStaff} 
              icon={<Icons.Users />}
              color="#64748b"
              onClick={() => navigate('/staff')}
            />
            <MetricCard 
              title="Total Parents" 
              value={stats.parents} 
              icon={<Icons.Users />}
              color="#8b5cf6"
              onClick={() => navigate('/parents')}
            />

            <MetricCard 
              title="Total Subjects" 
              value={stats.subjects} 
              icon={<Icons.Book />}
              color="var(--brand-yellow)"
              onClick={() => navigate('/subjects')}
            />

            <MetricCard 
              title="Attendance" 
              value={`${stats.attendanceRate || 0}%`} 
              icon={<Icons.Activity />}
              color="#06b6d4"
              subtitle="Today's Performance"
            />
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.5px' }}>Strategic Operations</h2>
            <div className="responsive-grid-4">
              <ActionCard 
                icon={<Icons.UserPlus />} 
                title="Student Admission" 
                desc="Enroll new students" 
                color="var(--brand-green)"
                onClick={() => navigate('/students/add')}
              />
              <ActionCard 
                icon={<Icons.Graduation />} 
                title="Staff Onboarding" 
                desc="Onboard new staff" 
                color="#8b5cf6" 
                onClick={() => navigate('/teachers/add')}
              />
              <ActionCard 
                icon={<Icons.Academic />} 
                title="Academic Classes" 
                desc="Manage course logic" 
                color="var(--brand-yellow)"
                onClick={() => navigate('/classes')}
              />
              <ActionCard 
                icon={<Icons.Dollar />} 
                title="Fee Collection" 
                desc="Process institutional fees" 
                color="#00843e"
                onClick={() => navigate('/fees/collection')}
              />
            </div>
          </div>

          {/* Recent Lists */}
          <div className="responsive-grid-2" style={{ gap: '32px' }}>
            {/* Recent Students */}
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Scholar Activity</h2>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>Latest enrollment nodes</p>
                </div>
                <button 
                  onClick={() => navigate('/students')}
                  className="premium-btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '13px' }}
                >
                  View Registry
                </button>
              </div>

              {recentStudents.length > 0 ? (
                recentStudents.map((student, idx) => (
                  <RecentItem 
                    key={idx}
                    initials={`${(student.firstName || student.first_name)?.[0] || ''}${(student.lastName || student.last_name)?.[0] || ''}`}
                    name={`${student.firstName || student.first_name} ${student.lastName || student.last_name}`}
                    subtitle={student.grade || 'No grade'}
                    status={student.status}
                    time={new Date(student.createdAt).toLocaleDateString()}
                    onClick={() => navigate(`/students/${student.id}`)}
                  />
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No students yet</p>
              )}
            </div>

            {/* Recent Teachers */}
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Faculty Pulse</h2>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>Latest professional onboards</p>
                </div>
                <button 
                  onClick={() => navigate('/staff')}
                  className="premium-btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '13px' }}
                >
                  Full Roster
                </button>
              </div>

              {recentTeachers.length > 0 ? (
                recentTeachers.map((teacher, idx) => (
                  <RecentItem 
                    key={idx}
                    initials={`${(teacher.firstName || teacher.first_name)?.[0] || ''}${(teacher.lastName || teacher.last_name)?.[0] || ''}`}
                    name={`${teacher.firstName || teacher.first_name} ${teacher.lastName || teacher.last_name}`}
                    subtitle={teacher.subjects?.join(', ') || teacher.subject || 'Teacher'}
                    status={teacher.status}
                    time={new Date(teacher.createdAt).toLocaleDateString()}
                    onClick={() => navigate(`/staff/${teacher.id}`)}
                  />
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No teachers yet</p>
              )}
            </div>
          </div>
        </main>
    </div>
  );
};

export default AdminDashboard;
