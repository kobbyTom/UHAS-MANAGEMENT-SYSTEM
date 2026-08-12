import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherAPI, gradeAPI, timetableAPI, courseAPI, settingsAPI, studentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { mapSectionName } from '../../utils/sectionHelper';
import AcademicCalendarWidget from '../../components/dashboard/AcademicCalendarWidget';

// Icon components for premium feel
const Icons = {
  BookOpen: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Users: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Clipboard: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  Calendar: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Clock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Check: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  TrendingUp: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
};

const StatCard = ({ icon, title, value, color, loading, subtitle, onClick }) => (
  <div 
    onClick={onClick} 
    className="glass-card"
    style={{ 
      padding: '32px', 
      display: 'flex', 
      flexDirection: 'column',
      gap: '24px',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseOver={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = color; }}}
    onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
  >
    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: `${color}05`, zIndex: 0 }}></div>
    
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
      <div style={{ 
        width: '60px', 
        height: '60px', 
        borderRadius: '18px', 
        backgroundColor: `${color}12`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: color,
        boxShadow: `0 8px 16px ${color}10`
      }}>
        {icon}
      </div>
      {subtitle && (
        <span style={{ fontSize: '11px', fontWeight: '900', backgroundColor: `${color}12`, color: color, padding: '6px 14px', borderRadius: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {subtitle}
        </span>
      )}
    </div>
    <div style={{ position: 'relative', zIndex: 1 }}>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px' }}>{title}</p>
      {loading ? (
        <div style={{ width: '100px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
      ) : (
        <p style={{ fontSize: '38px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-2px' }}>{value || 0}</p>
      )}
    </div>
  </div>
);

const ScheduleItem = ({ time, className, room, type, last }) => {
  const colors = { 
    Lecture: { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' }, 
    Lab: { bg: '#fdf2f8', text: '#db2777', dot: '#ec4899' }, 
    Exam: { bg: '#fff7ed', text: '#ea580c', dot: '#f97316' } 
  }[type] || { bg: '#ffffff', text: '#475569', dot: '#94a3b8' };

  return (
    <div style={{ display: 'flex', gap: '24px', position: 'relative' }}>
      {!last && <div style={{ position: 'absolute', left: '7px', top: '24px', bottom: '-24px', width: '2px', backgroundColor: '#f1f5f9' }}></div>}
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: colors.dot, border: '4px solid white', boxShadow: '0 0 0 1px #f1f5f9', zIndex: 1, marginTop: '8px' }}></div>
      <div className="glass-card" style={{ flex: 1, padding: '20px 24px', marginBottom: '24px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' }}
        onMouseOver={e => { e.currentTarget.style.transform = 'translateX(8px)'; e.currentTarget.style.borderColor = colors.dot; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>{className}</h4>
          <span style={{ fontSize: '11px', fontWeight: '900', backgroundColor: colors.bg, color: colors.text, padding: '6px 12px', borderRadius: '24px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{type}</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
            <Icons.Clock /> {time}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Room {room}
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ icon, label, onClick, color }) => (
  <button 
    onClick={onClick}
    className="glass-card"
    style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '16px', 
      padding: '24px', 
      cursor: 'pointer', 
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      width: '100%',
      border: '1.5px solid transparent'
    }}
    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 12px 24px ${color}15`; }}
    onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, transition: 'all 0.3s' }}>
      {icon}
    </div>
    <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.2px' }}>{label}</span>
  </button>
);


const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [stats, setStats] = useState({ classes: 0, students: 0, assignments: 0 });
  const [classes, setClasses] = useState([]);
  const [masterClasses, setMasterClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storedUser, setStoredUser] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [avgPerformance, setAvgPerformance] = useState('0%');
  const [recentSubmissions, setRecentSubmissions] = useState([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('[DEBUG] studentAPI:', !!studentAPI);
      const [coursesRes, pendingRes, settingsRes] = await Promise.allSettled([
        teacherAPI.getMyCourses(),
        teacherAPI.getPendingGrading(),
        settingsAPI.getSettings()
      ]);
      
      let teacherProfile = null;
      try {
        const profileRes = await teacherAPI.getAll({ limit: 1000 }); // Find self in teachers
        teacherProfile = profileRes.data?.data?.find(t => t.userId === user?.id || t.user_id === user?.id);
      } catch (e) {}

      if (coursesRes.status === 'fulfilled' && coursesRes.value?.data?.success) {
        const data = coursesRes.value.data.data || [];
        const masterData = coursesRes.value.data.masterClasses || [];
        setClasses(data);
        setMasterClasses(masterData);
        setStats(prev => ({ ...prev, classes: data.length }));
        const totalStudents = data.reduce((sum, c) => sum + (c.studentCount || 0), 0);
        setStats(prev => ({ ...prev, students: totalStudents }));

        // Fetch performance for these courses
        if (data.length > 0) {
          try {
            const allGradesRes = await gradeAPI.getAll({ limit: 5000 });
            const myCourseIds = data.map(c => c.id || c._id);
            const myGrades = (allGradesRes.data?.data || []).filter(g => myCourseIds.includes(g.course_id || g.course));
            if (myGrades.length > 0) {
              const total = myGrades.reduce((sum, g) => sum + (parseFloat(g.total_score) || 0), 0);
              const avg = Math.round(total / myGrades.length);
              setAvgPerformance(`${avg}%`);
            }
          } catch (e) { console.error('Error calculating performance:', e); }
        }
      }
      
      if (pendingRes.status === 'fulfilled' && pendingRes.value?.data?.success) {
        const assignmentsData = pendingRes.value.data.data || [];
        setStats(prev => ({ ...prev, assignments: assignmentsData.length }));

        // 1. Flatten all submissions from these assignments
        const allSubmissions = [];
        const studentIds = new Set();
        
        assignmentsData.forEach(asg => {
          if (Array.isArray(asg.submissions)) {
            asg.submissions.forEach(sub => {
              allSubmissions.push({
                ...sub,
                assignmentTitle: asg.title,
                assignmentId: asg.id
              });
              if (sub.student) studentIds.add(sub.student);
            });
          }
        });

        // 2. Fetch student names for these IDs to ensure data integrity
        let studentMap = {};
        if (studentIds.size > 0) {
          try {
            const studentsRes = await studentAPI.getAll({ limit: 1000 });
            const studentsList = studentsRes.data?.data || [];
            studentsList.forEach(s => {
              studentMap[s.id || s._id] = `${s.firstName || s.first_name} ${s.lastName || s.last_name}`;
            });
          } catch (e) { console.error('Error fetching students for dashboard:', e); }
        }

        // 3. Sort by submission time (newest first) and map for UI
        const sortedSubmissions = allSubmissions
          .filter(s => s.submittedAt || s.submitted_at)
          .sort((a, b) => new Date(b.submittedAt || b.submitted_at) - new Date(a.submittedAt || a.submitted_at))
          .slice(0, 5)
          .map(s => ({
            name: studentMap[s.student] || s.student_name || 'Student',
            task: s.assignmentTitle || 'Task',
            time: s.submittedAt || s.submitted_at ? new Date(s.submittedAt || s.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'
          }));
        
        setRecentSubmissions(sortedSubmissions);
      }
    } catch (error) {
      console.error('Teacher Dashboard Data Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
    fetchDashboardData();
  }, []);

  if (authLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f7fe' }}>
      <div className="spinner" style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTop: '4px solid #00843e', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    </div>
  );

  if (!isAuthenticated) return null;
  const currentUser = storedUser || user;

  return (
    <div className="teacher-dashboard-content">
      <div style={{ padding: '0 0 60px 0', animation: 'fadeIn 0.5s ease-out' }}>
          
          {/* Header Section */}
          <div className="page-header" style={{ marginBottom: '48px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#f0fdf4', color: 'var(--brand-green)', borderRadius: '20px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Staff Ledger</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Academic Operations</span>
              </div>
              <h1 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-2px' }}>
                Teacher <span style={{ color: 'var(--brand-green)' }}>Console</span>
              </h1>
              <p style={{ fontSize: '17px', color: '#64748b', marginTop: '10px', fontWeight: '500' }}>
                Welcome, <span style={{ color: '#0f172a', fontWeight: '800' }}>{currentUser?.first_name || currentUser?.firstName || 'Teacher'}</span>. 
                {masterClasses.length > 0 && (
                  <> Master of <span style={{ color: 'var(--brand-green)', fontWeight: '700' }}>{masterClasses.map(c => `${c.name} ${mapSectionName(c.section)}`).join(', ')}</span>. </>
                )}
                Overseeing <span style={{ color: 'var(--brand-green)', fontWeight: '700' }}>{stats.classes} institutional nodes</span> today.
              </p>
            </div>
            <button 
              onClick={() => navigate('/assignments/create')}
              className="premium-btn-primary"
              style={{ padding: '16px 28px' }}
            >
              <Icons.Plus /> Dispatch Assessment
            </button>
          </div>


          {/* Master Assignment Banner */}
          {masterClasses.length > 0 && (
            <div className="glass-card" style={{ 
              padding: '32px', 
              marginBottom: '40px', 
              background: 'linear-gradient(135deg, var(--brand-green) 0%, #065f46 100%)', 
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 132, 62, 0.2)'
            }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '900', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', padding: '6px 14px', borderRadius: '24px', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Leadership Protocol</span>
                  </div>
                  <h2 style={{ fontSize: '28px', fontWeight: '950', color: 'white', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Class Master Designation</h2>
                  <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', fontWeight: '500', maxWidth: '600px' }}>
                    You are currently serving as the Lead Faculty for <span style={{ fontWeight: '800', color: '#fff' }}>{masterClasses.map(c => `${c.name} ${mapSectionName(c.section)}`).join(' & ')}</span>.
                  </p>
                  <button 
                    onClick={() => navigate('/reports/academic')}
                    style={{
                      marginTop: '20px',
                      padding: '12px 24px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = 'var(--brand-green)'; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white'; }}
                  >
                    <Icons.Clipboard /> Generate Class Reports
                  </button>
                </div>
                <div style={{ width: '80px', height: '80px', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="responsive-grid-3" style={{ marginBottom: '48px' }}>
            <StatCard
              icon={<Icons.BookOpen />}
              title="My Courses" 
              value={stats.classes} 
              color="var(--brand-green)" 
              loading={loading} 
              subtitle="Active"
              onClick={() => navigate('/classes')}
            />
            {masterClasses.length > 0 && (
              <StatCard
                icon={<Icons.Users />}
                title="Master Class Students" 
                value={masterClasses.reduce((sum, c) => sum + (c.studentCount || 0), 0)} 
                color="#db2777" 
                loading={loading} 
                subtitle="Class Master"
                onClick={() => navigate('/students')}
              />
            )}
            <StatCard
              icon={<Icons.Users />}
              title="Students" 
              value={stats.students} 
              color="#8b5cf6" 
              loading={loading} 
              subtitle="Enrolled"
              onClick={() => navigate('/students')}
            />
            <StatCard
              icon={<Icons.Clipboard />}
              title="To Grade" 
              value={stats.assignments} 
              color="#f59e0b" 
              loading={loading} 
              subtitle="Pending"
              onClick={() => navigate('/exams/marks')}
            />
            <StatCard
              icon={<Icons.TrendingUp />}
              title="Avg. Class Perf." 
              value={avgPerformance} 
              color="#06b6d4" 
              loading={loading} 
              subtitle="This Term"
            />
          </div>

          <div className="responsive-grid-2" style={{ gap: '40px' }}>
            
            {/* Left Column: Assigned Classes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Curriculum Allocation</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>Active subject matrices</p>
                  </div>
                  <button onClick={() => navigate('/classes')} className="premium-btn-secondary" style={{ padding: '10px 20px', fontSize: '13px' }}>View All</button>
                </div>

                
                <div className="responsive-grid-2" style={{ gap: '20px' }}>
                  {loading ? [...Array(4)].map((_, i) => (
                    <div key={i} style={{ height: '110px', backgroundColor: '#ffffff', borderRadius: '24px', animation: 'pulse 1.5s infinite' }}></div>
                  )) : classes.length > 0 ? classes.map((cls, i) => (
                    <div key={i} className="glass-card" style={{ padding: '24px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer', border: '1.5px solid transparent' }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--brand-green)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 132, 62, 0.08)'; }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <p style={{ fontSize: '12px', fontWeight: '900', color: 'var(--brand-green)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>{cls.code || 'COURSE'}</p>
                      <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', margin: '0 0 16px 0', letterSpacing: '-0.3px' }}>{cls.name}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '900', backgroundColor: '#f0fdf4', color: 'var(--brand-green)', padding: '6px 14px', borderRadius: '24px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cls.grade} {mapSectionName(cls.section)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', fontWeight: '700' }}>
                          <Icons.Users /> {cls.studentCount || 0} Scholars
                        </div>
                      </div>
                    </div>
                  )) : (

                    <div style={{ gridColumn: 'span 2', padding: '40px', textAlign: 'center', color: '#64748b' }}>No courses assigned.</div>
                  )}
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '24px' }}>Fast Access</h2>
                <div className="responsive-grid-4" style={{ gap: '20px' }}>
                  <QuickAction icon={<Icons.Calendar />} label="Attendance" color="#10b981" onClick={() => navigate('/attendance')} />
                  <QuickAction icon={<Icons.Clipboard />} label="Marks Entry" color="#f59e0b" onClick={() => navigate('/exams/marks')} />
                  <QuickAction icon={<Icons.TrendingUp />} label="Exam Results" color="#3b82f6" onClick={() => navigate('/exams/results')} />
                  <QuickAction icon={<Icons.Users />} label="My Students" color="#8b5cf6" onClick={() => navigate('/students')} />
                </div>
              </div>
            </div>

            {/* Right Column: Schedule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Temporal Registry</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>Daily session protocol</p>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#854d0e', backgroundColor: '#fefce8', padding: '6px 14px', borderRadius: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>ACTIVE SESSIONS</div>
                </div>

                
                <div style={{ marginTop: '10px' }}>
                  {todaySchedule.length > 0 ? todaySchedule.map((item, i) => (
                    <ScheduleItem 
                      key={i}
                      time={`${item.start_time || item.startTime || ''} - ${item.end_time || item.endTime || ''}`} 
                      className={item.course_name || item.subject || 'Class'} 
                      room={item.room || 'TBD'} 
                      type={item.type || 'Lecture'}
                      last={i === todaySchedule.length - 1} 
                    />
                  )) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                      No classes scheduled for today.
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => navigate('/timetable')}
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    backgroundColor: '#ffffff', 
                    color: '#475569', 
                    border: '1px dashed #e2e8f0', 
                    borderRadius: '20px', 
                    fontWeight: '700', 
                    fontSize: '14px',
                    cursor: 'pointer', 
                    marginTop: '10px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--brand-green-light)'; e.currentTarget.style.color = 'var(--brand-green)'; e.currentTarget.style.borderColor = 'var(--brand-green)'; }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  View Full Timetable
                </button>
              </div>

              {/* Recent Submissions */}
              <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Evidence Hub</h2>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>Recent scholar submissions</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {recentSubmissions.length > 0 ? recentSubmissions.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', transition: 'all 0.3s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'var(--brand-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px', boxShadow: '0 8px 16px rgba(0, 132, 62, 0.15)' }}>
                        {item.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{item.name}</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', fontWeight: '600' }}>{item.task}</p>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800' }}>{item.time}</span>
                    </div>
                  )) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
                      Registry empty.
                    </div>
                  )}
                </div>
              </div>

              {/* Academic Calendar */}
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1.5px solid #f1f5f9' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Academic Calendar</h2>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>Upcoming institutional activities</p>
                </div>
                <AcademicCalendarWidget />
              </div>

            </div>
          </div>
        </div>
    </div>
  );
};

export default TeacherDashboard;
