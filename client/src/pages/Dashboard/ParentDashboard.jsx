import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AcademicCalendarWidget from '../../components/dashboard/AcademicCalendarWidget';

const displayGrade = (g) => {
  if (!g) return 'N/A';
  let str = g.toString().trim();
  const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
  if (primaryMatch) return `Basic ${primaryMatch[1]}`;
  return str;
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


const ParentDashboard = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [stats, setStats] = useState({ children: 0, fees: 0, pendingFees: 0, avgGrade: 0 });
  const [children, setChildren] = useState([]);
  const [fees, setFees] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storedUser, setStoredUser] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  const [selectedChildId, setSelectedChildId] = useState('all');
  const [allChildren, setAllChildren] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('authUser');
    if (saved) { try { setStoredUser(JSON.parse(saved)); } catch (e) {} }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [childrenRes, feesRes, gradesRes, attendRes, assignRes, announceRes] = await Promise.allSettled([
        parentAPI.getMyChildren(),
        parentAPI.getMyChildrenFees(),
        parentAPI.getMyChildrenGrades(),
        parentAPI.getMyChildrenAttendance(),
        parentAPI.getMyChildrenAssignments(),
        parentAPI.getMyChildrenAnnouncements()
      ]);

      if (childrenRes.status === 'fulfilled' && childrenRes.value?.data) {
        const data = childrenRes.value.data.data || [];
        setAllChildren(data);
        setChildren(data.slice(0, 5));
        setStats(p => ({ ...p, children: data.length }));
      }

      if (feesRes.status === 'fulfilled' && feesRes.value?.data) {
        const data = feesRes.value.data.data || [];
        setFees(data);
        setStats(p => ({ ...p, fees: data.length, pendingFees: data.filter(f => f.status !== 'paid').length }));
      }

      if (gradesRes.status === 'fulfilled' && gradesRes.value?.data) {
        const data = gradesRes.value.data.data || [];
        setGrades(data.slice(0, 10));
        const avg = data.length > 0 ? Math.round(data.reduce((a, g) => a + (g.score || g.totalScore || 0), 0) / data.length) : 0;
        setStats(p => ({ ...p, avgGrade: avg }));
      }

      if (attendRes.status === 'fulfilled' && attendRes.value?.data) {
        setAttendance(attendRes.value.data.data || []);
      }

      if (assignRes.status === 'fulfilled' && assignRes.value?.data) {
        setAssignments(assignRes.value.data.data || []);
      }

      if (announceRes.status === 'fulfilled' && announceRes.value?.data) {
        setAnnouncements(announceRes.value.data.data || []);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await logout(); } finally {
      localStorage.removeItem('authToken'); localStorage.removeItem('authUser');
      sessionStorage.removeItem('authToken'); navigate('/login');
    }
  };

  if (authLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTop: '4px solid #00843e', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!isAuthenticated) return null;

  const currentUser = storedUser || user;

  return (
    <div className="parent-dashboard-content">
      <div style={{ padding: '0 0 40px 0', animation: 'fadeIn 0.5s ease-out' }}>
          <div className="page-header" style={{ marginBottom: '48px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Family Governance</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Scholar Monitoring</span>
              </div>
              <h1 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-2px' }}>Family <span style={{ color: 'var(--brand-green)' }}>Observer</span></h1>
              <p style={{ fontSize: '17px', color: '#64748b', marginTop: '10px', fontWeight: '500' }}>Overseeing the academic trajectory and fiscal status for your <span style={{ color: '#0f172a', fontWeight: '800' }}>Scholar Nodes</span>.</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => navigate('/fees')} className="premium-btn-secondary" style={{ padding: '14px 24px', backgroundColor: stats.pendingFees > 0 ? '#fef2f2' : 'white', color: stats.pendingFees > 0 ? '#dc2626' : '#64748b' }}>
                {stats.pendingFees > 0 ? `${stats.pendingFees} Outstanding Protocols` : 'View Fee Ledger'}
              </button>
              <button onClick={() => navigate('/exams/results')} className="premium-btn-primary" style={{ padding: '14px 24px' }}>Analyze Results</button>
            </div>
          </div>


          <div className="responsive-grid-4" style={{ marginBottom: '48px' }}>
            <StatCard icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} title="Scholar Count" value={stats.children} color="var(--brand-green)" loading={loading} subtitle="Registered Scholars" onClick={() => navigate('/students')} />
            <StatCard icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2.5"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2"/></svg>} title="Fiscal Ledger" value={stats.fees} color="var(--brand-yellow)" loading={loading} subtitle="Total Records" onClick={() => navigate('/fees')} />
            <StatCard icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>} title="Outstanding" value={stats.pendingFees} color="#ef4444" loading={loading} subtitle="Protocols Pending" onClick={() => navigate('/fees')} />
            <StatCard icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2.5"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422"/></svg>} title="Scholar Success" value={stats.avgGrade > 0 ? stats.avgGrade + '%' : '—'} color="#06b6d4" loading={loading} subtitle="Avg. Aggregate" onClick={() => navigate('/exams/results')} />
          </div>


          <div className="responsive-grid-2" style={{ gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '24px 28px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Scholar Registry</h2>
                    <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginTop: '4px' }}>Active family nodes</p>
                  </div>
                  <button onClick={() => navigate('/students')} className="premium-btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>View All</button>
                </div>
                <div style={{ padding: '24px' }}>
                  {loading ? [...Array(2)].map((_, i) => <div key={i} style={{ height: '80px', backgroundColor: '#ffffff', borderRadius: '16px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}></div>)
                    : children.length > 0 ? children.map((child, i) => (
                      <div key={i} onClick={() => navigate('/students')} className="glass-card" style={{ padding: '20px', marginBottom: i < children.length - 1 ? '16px' : '0', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', border: '1.5px solid transparent', transition: 'all 0.3s' }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateX(8px)'; e.currentTarget.style.borderColor = 'var(--brand-green)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
                      >
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '950', fontSize: '18px', boxShadow: '0 8px 16px rgba(0, 132, 62, 0.15)' }}>{child?.firstName?.[0] || 'S'}</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.3px' }}>{child?.firstName || 'Student'} {child?.lastName || ''}</h4>
                          <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Class: <span style={{ color: 'var(--brand-green)' }}>{displayGrade(child?.grade)}</span></p>
                        </div>
                        <span style={{ padding: '6px 14px', borderRadius: '24px', fontSize: '11px', fontWeight: '900', backgroundColor: child?.status === 'active' ? '#f0fdf4' : '#fef2f2', color: child?.status === 'active' ? 'var(--brand-green)' : '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{child?.status || 'Active'}</span>
                      </div>
                    )) : <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>Registry empty.</div>}
                </div>
              </div>


              <div className="glass-card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#0f172a', marginBottom: '20px', letterSpacing: '-0.3px' }}>Governance Shortcuts</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  {[
                    { label: 'Temporal Records', path: '/attendance', bg: '#f0fdf4', tc: 'var(--brand-green)', icon: '📅' },
                    { label: 'Task Ledger', path: '/assignments', bg: '#fefce8', tc: '#854d0e', icon: '📝' },
                    { label: 'Academic Plan', path: '/timetable', bg: '#f5f3ff', tc: '#7c3aed', icon: '⏰' }
                  ].map((l, i) => (
                    <button key={i} onClick={() => navigate(l.path)} 
                      className="glass-card"
                      style={{ 
                        width: '100%', 
                        padding: '16px', 
                        backgroundColor: l.bg, 
                        color: l.tc, 
                        border: '1.5px solid transparent', 
                        borderRadius: '16px', 
                        fontWeight: '800', 
                        cursor: 'pointer', 
                        textAlign: 'left', 
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateX(6px)'; e.currentTarget.style.borderColor = l.tc; }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
                    >
                      <span style={{ fontSize: '18px' }}>{l.icon}</span> {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '24px 28px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>Directives</h2>
                  <button onClick={() => navigate('/announcements')} className="premium-btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>Archives</button>
                </div>
                <div style={{ padding: '24px' }}>
                  {loading ? <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Syncing...</div>
                    : announcements.length > 0 ? announcements.slice(0, 3).map((announce, i) => (
                      <div key={i} className="glass-card" style={{ padding: '16px', backgroundColor: '#ffffff', marginBottom: i < 2 ? '12px' : 0, border: 'none' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', marginBottom: '6px' }}>{announce.title || 'Announcement'}</h4>
                        <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', lineHeight: '1.5' }}>{announce.description?.substring(0, 100) || 'New administrative update...'}...</p>
                      </div>
                    )) : <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontWeight: '600' }}>No active directives.</div>}
                </div>
              </div>

              {/* Academic Calendar */}
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px 28px', borderBottom: '1.5px solid #f1f5f9' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>Academic Calendar</h2>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>Upcoming institutional activities</p>
                </div>
                <AcademicCalendarWidget />
              </div>

            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '24px 28px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>Temporal Matrix</h2>
                  <button onClick={() => navigate('/attendance')} className="premium-btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>Audit All</button>
                </div>
                <div style={{ padding: '24px' }}>
                  {loading ? <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Syncing...</div>
                    : attendance.length > 0 ? attendance.slice(0, 5).map((att, i) => {
                      const student = children.find(c => (c.id || c._id) === (att.studentId || att.student?._id || att.student?.id));
                      const studentName = student ? `${student.firstName} ${student.lastName}` : 'Scholar';
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < attendance.length - 1 ? '1.5px solid #ffffff' : 'none' }}>
                          <div>
                            <span style={{ fontWeight: '900', color: '#0f172a', fontSize: '15px' }}>{studentName}</span>
                            <br/>
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{att.date || 'Today'}</span>
                          </div>
                          <span style={{ padding: '6px 14px', borderRadius: '24px', fontSize: '11px', fontWeight: '900', backgroundColor: att.status === 'present' ? '#f0fdf4' : att.status === 'absent' ? '#fef2f2' : '#fffbeb', color: att.status === 'present' ? 'var(--brand-green)' : att.status === 'absent' ? '#dc2626' : '#d97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{att.status || 'Present'}</span>
                        </div>
                      );
                    }) : <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>No temporal nodes.</div>}
                </div>
              </div>

              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '24px 28px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>Task Ledger</h2>
                  <button onClick={() => navigate('/assignments')} className="premium-btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>Monitor All</button>
                </div>
                <div style={{ padding: '24px' }}>
                  {loading ? <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Syncing...</div>
                    : assignments.length > 0 ? assignments.slice(0, 5).map((assign, i) => (
                      <div key={i} className="glass-card" style={{ padding: '16px', backgroundColor: '#ffffff', marginBottom: i < 4 ? '12px' : 0, border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: '900', color: '#0f172a', fontSize: '14px' }}>{assign.title || assign.name || 'Task'}</span>
                          <br/>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{assign.dueDate ? `Due: ${new Date(assign.dueDate).toLocaleDateString()}` : 'Indefinite'}</span>
                        </div>
                        <span style={{ padding: '6px 12px', borderRadius: '24px', fontSize: '10px', fontWeight: '900', backgroundColor: assign.status === 'submitted' ? '#f0fdf4' : '#fffbeb', color: assign.status === 'submitted' ? 'var(--brand-green)' : '#d97706', textTransform: 'uppercase' }}>{assign.status || 'Pending'}</span>
                      </div>
                    )) : <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>No active tasks.</div>}
                </div>
              </div>

              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '24px 28px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>Fiscal Ledger</h2>
                  <button onClick={() => navigate('/fees')} className="premium-btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>Verify All</button>
                </div>
                <div style={{ padding: '24px' }}>
                  {loading ? <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Syncing...</div>
                    : fees.length > 0 ? fees.slice(0, 5).map((fee, i) => {
                      const student = children.find(c => (c.id || c._id) === (fee.studentId || fee.student?._id || fee.student?.id));
                      const studentName = student ? `${student.firstName} ${student.lastName}` : (fee.studentName || 'Scholar Node');
                      return (
                        <div key={i} onClick={() => navigate('/fees')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < fees.length - 1 ? '1.5px solid #ffffff' : 'none', cursor: 'pointer' }}>
                          <div>
                            <span style={{ fontWeight: '900', color: '#0f172a', fontSize: '15px' }}>{studentName}</span>
                            <br/>
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{fee.description || 'Institutional Fee'}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: '950', color: '#0f172a', fontSize: '15px' }}>₵{(fee.amount || fee.amountDue || 0).toLocaleString()}</span>
                            <br/>
                            <span style={{ padding: '4px 10px', borderRadius: '24px', fontSize: '10px', fontWeight: '950', backgroundColor: fee.status === 'paid' ? '#f0fdf4' : '#fef2f2', color: fee.status === 'paid' ? 'var(--brand-green)' : '#dc2626', textTransform: 'uppercase' }}>{fee.status || 'Unpaid'}</span>
                          </div>
                        </div>
                      );
                    }) : <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>No fiscal records.</div>}
                </div>
              </div>

              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '24px 28px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>Success Matrix</h2>
                  <button onClick={() => navigate('/exams/results')} className="premium-btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>Analyze All</button>
                </div>
                <div style={{ padding: '24px' }}>
                  {loading ? <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Syncing...</div>
                    : grades.length > 0 ? grades.slice(0, 6).map((grade, i) => {
                      const student = children.find(c => (c.id || c._id) === (grade.studentId || grade.student?._id || grade.student?.id));
                      const studentName = student ? `${student.firstName} ${student.lastName}` : (grade.studentName || 'Scholar');
                      const score = grade.score || grade.totalScore || grade.percentage || 0;
                      const barColor = score >= 80 ? 'var(--brand-green)' : score >= 60 ? '#facc15' : '#ef4444';
                      const gradeLetter = grade.grade || (score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F');
                      
                      return (
                        <div key={i} style={{ marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>{studentName} — {grade.subject || 'Academic Node'}</span>
                            <span style={{ fontSize: '14px', fontWeight: '950', color: barColor }}>{score}% ({gradeLetter})</span>
                          </div>
                          <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${score}%`, backgroundColor: barColor, borderRadius: '4px', transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                          </div>
                        </div>
                      );
                    }) : <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>No evaluation nodes.</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ParentDashboard;
