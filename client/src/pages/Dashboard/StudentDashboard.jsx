import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, gradeAPI, attendanceAPI, assignmentAPI, feeAPI, courseAPI, eventAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { mapSectionName } from '../../utils/sectionHelper';
import AcademicCalendarWidget from '../../components/dashboard/AcademicCalendarWidget';

// ─── Shared helpers ────────────────────────────────────────────────
const Section = ({ title, action, actionPath, children, navigate }) => (
  <div className="glass-card" style={{ overflow: 'hidden' }}>
    <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{title}</h2>
      {action && <button onClick={() => navigate(actionPath)} className="premium-btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>{action}</button>}
    </div>
    {children}
  </div>
);


const Empty = ({ msg }) => <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>{msg}</div>;

const Pill = ({ label, color, bg }) => (
  <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', color, backgroundColor: bg }}>{label}</span>
);

const SkeletonRow = ({ cols = 3 }) => (
  <tr><td colSpan={cols} style={{ padding: '12px' }}><div style={{ height: '14px', backgroundColor: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div></td></tr>
);

// ─── Main Dashboard ────────────────────────────────────────────────
const StudentDashboard = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  const [profile, setProfile]       = useState(null);
  const [courses, setCourses]       = useState([]);
  const [grades, setGrades]         = useState([]);
  const [attendance, setAttendance] = useState({ present: 0, absent: 0, total: 0, pct: 0, records: [] });
  const [assignments, setAssignments] = useState([]);
  const [fees, setFees]             = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]       = useState(true);
  const currentUser = user;
  const studentId   = currentUser?.studentId || currentUser?.id || currentUser?.uid;
  const grade       = currentUser?.grade || currentUser?.class;
  const scoreFromGrade = (g) => Number(g.score ?? g.total_score ?? g.totalScore ?? g.total ?? ((Number(g.classwork || 0) + Number(g.homework || 0) + Number(g.final || 0)))) || 0;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!currentUser || !studentId) return;
    (async () => {
      setLoading(true);
      try {
        const grade = currentUser?.grade || currentUser?.class;
        console.log('[DEBUG] Student Dashboard Fetch:', { studentId, grade });
        
        const [profRes, courseRes, gradeRes, attRes, asgRes, feeRes, evtRes, summRes] = await Promise.allSettled([
          studentId ? studentAPI.getById(studentId) : Promise.resolve(null),
          grade ? courseAPI.getAll({ grade }) : courseAPI.getAll({ limit: 20 }),
          studentId ? gradeAPI.getByStudent(studentId) : gradeAPI.getAll({ studentId, limit: 20 }),
          studentId ? attendanceAPI.getByStudent(studentId) : attendanceAPI.getAll({ studentId, limit: 100 }),
          studentId ? assignmentAPI.getByStudent(studentId) : assignmentAPI.getAll({ limit: 20 }),
          studentId ? feeAPI.getByStudent(studentId) : feeAPI.getAll({ limit: 20 }),
          eventAPI ? eventAPI.getUpcoming() : Promise.resolve(null),
          studentId ? attendanceAPI.getSummary(studentId) : Promise.resolve(null)
        ]);

        console.log('[DEBUG] API Results:', { 
          prof: profRes.status, 
          course: courseRes.status, 
          att: attRes.status, 
          asg: asgRes.status,
          summ: (summRes && summRes.status) || 'N/A'
        });

        if (profRes.status === 'fulfilled' && profRes.value?.data)
          setProfile(profRes.value.data.data || profRes.value.data);

        if (courseRes.status === 'fulfilled' && courseRes.value?.data)
          setCourses((courseRes.value.data.data || courseRes.value.data || []).slice(0, 8));

        if (gradeRes.status === 'fulfilled' && gradeRes.value?.data)
          setGrades((gradeRes.value.data.data || gradeRes.value.data || []).slice(0, 8));

        if (attRes.status === 'fulfilled' && attRes.value?.data) {
          const recs = attRes.value.data.data || attRes.value.data || [];
          const present = recs.filter(r => r.status === 'present').length;
          const total = recs.length;
          
          let pct = total > 0 ? Math.round((present / total) * 100) : 0;
          
          // Use summary if available
          if (summRes.status === 'fulfilled' && summRes.value?.data?.data) {
            pct = summRes.value.data.data.percentage || pct;
          }
          
          setAttendance({ 
            present, 
            absent: total - present, 
            total, 
            pct, 
            records: recs.slice(0, 5) 
          });
        }

        if (asgRes.status === 'fulfilled' && asgRes.value?.data)
          setAssignments((asgRes.value.data.data || asgRes.value.data || []).slice(0, 6));

        if (feeRes.status === 'fulfilled' && feeRes.value?.data)
          setFees((feeRes.value.data.data || feeRes.value.data || []).slice(0, 5));

        if (evtRes.status === 'fulfilled' && evtRes.value?.data) {
          const evts = evtRes.value.data.data || evtRes.value.data || [];
          setAnnouncements(evts.slice(0, 3).map(e => ({
            title: e.title || 'Announcement',
            body: e.description || e.body || '',
            date: e.date ? new Date(e.date).toLocaleDateString() : 'Recent',
            tag: (e.type || 'INFO').toUpperCase(),
            tc: e.type === 'exam' ? '#dc2626' : e.type === 'event' ? '#00843e' : '#0284c7',
            bg: e.type === 'exam' ? '#fee2e2' : e.type === 'event' ? '#dcfce7' : '#e0f2fe'
          })));
        }

      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [studentId, currentUser?.grade]);

  if (authLoading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:'48px', height:'48px', border:'4px solid #e2e8f0', borderTop:'4px solid #00843e', borderRadius:'50%', animation:'spin 1s linear infinite' }}></div>
    </div>
  );
  if (!isAuthenticated) return null;

  const pendingAsg  = assignments.filter(a => !(a.submissions || []).some(s => s.student === studentId)).length;
  const unpaidFees  = fees.filter(f => f.status !== 'paid').length;
  const avgGrade    = grades.length > 0 ? Math.round(grades.reduce((s, g) => s + scoreFromGrade(g), 0) / grades.length) : null;

  const statCards = [
    { label: 'Avg. Score', value: avgGrade != null ? `${avgGrade}%` : '—', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>, color: '#00843e', bg: '#dcfce7', path: '/exams/results' },
    { label: 'Attendance', value: attendance.total > 0 ? `${attendance.pct}%` : '—', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>, color: '#0284c7', bg: '#e0f2fe', path: '/attendance' },
    { label: 'Pending Tasks', value: pendingAsg, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>, color: '#d97706', bg: '#fef3c7', path: '/assignments' },
    { label: 'My Courses', value: courses.length, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>, color: '#7c3aed', bg: '#ede9fe', path: '/courses' },
    { label: 'Unpaid Fees', value: unpaidFees, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>, color: unpaidFees > 0 ? '#dc2626' : '#00843e', bg: unpaidFees > 0 ? '#fee2e2' : '#dcfce7', path: '/fees' },
  ];

  const gradeColor = s => s >= 80 ? { bg: '#dcfce7', color: '#00843e' } : s >= 60 ? { bg: '#fef3c7', color: '#d97706' } : { bg: '#fee2e2', color: '#dc2626' };

  return (
    <div className="student-dashboard-content">
      <div style={{ padding: '0 0 40px 0', animation: 'fadeIn 0.4s ease-out' }}>

          {/* ── Welcome ─────────────────────────────────── */}
          <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Scholar Hub</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Personal Identity</span>
              </div>
              <h1 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-2px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                Welcome, {currentUser?.first_name || currentUser?.firstName || 'Student'} 
                <span style={{ color: 'var(--brand-green)' }}>✨</span>
              </h1>
              <p style={{ fontSize: '17px', color: '#64748b', marginTop: '10px', fontWeight: '500' }}>
                {currentUser?.grade ? `${currentUser.grade}${currentUser?.section ? ` Section ${mapSectionName(currentUser.section)}` : ''}` : 'Academic Profile'} — Navigating your <span style={{ color: '#0f172a', fontWeight: '800' }}>UHAS Success Matrix</span>.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => navigate('/timetable')} className="premium-btn-secondary" style={{ padding: '14px 24px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Temporal Plan
              </button>
              <button onClick={() => navigate('/assignments')} className="premium-btn-primary" style={{ padding: '14px 24px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                Task Ledger
              </button>
            </div>
          </div>


          {/* ── Stat Row ─────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '40px' }}>
            {statCards.map((c, i) => (
              <div key={i} onClick={() => navigate(c.path)} className="glass-card" style={{ padding: '24px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1.5px solid transparent' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = c.color; e.currentTarget.style.boxShadow = `0 12px 24px ${c.color}10`; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, marginBottom: '16px', boxShadow: `0 8px 16px ${c.color}15` }}>{c.icon}</div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{c.label}</p>
                {loading ? <div style={{ height: '32px', backgroundColor: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
                  : <p style={{ fontSize: '28px', fontWeight: '950', color: '#0f172a', letterSpacing: '-1px' }}>{c.value}</p>}
              </div>
            ))}
          </div>


          {/* ── Main Grid ─────────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px' }}>

            {/* My Courses */}
            <Section title="Enrolled Nodes" action="Full Registry" actionPath="/courses" navigate={navigate}>
              <div style={{ padding: '12px 28px 24px' }}>
                {loading ? <div style={{ height: '100px', backgroundColor: '#ffffff', borderRadius: '16px', animation: 'pulse 1.5s infinite' }}></div>
                  : courses.length === 0 ? <Empty msg="No active nodes." />
                  : courses.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i < courses.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'all 0.2s' }}>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.3px' }}>{c.name || c.courseName || 'Course'}</p>
                        <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginTop: '4px' }}>{(c.teacher?.firstName || c.teacher?.first_name) ? `${c.teacher.firstName || c.teacher.first_name} ${c.teacher.lastName || c.teacher.last_name}` : (c.teacherName || 'Faculty TBA')}</p>
                      </div>
                      <Pill label={c.grade || c.level || 'Active'} color="var(--brand-green)" bg="#f0fdf4" />
                    </div>
                  ))}
              </div>
            </Section>


            {/* My Grades */}
            <Section title="Success Matrix" action="Scholar Transcript" actionPath="/exams/results" navigate={navigate}>
              <div style={{ padding: '12px 28px 24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1.5px solid #f1f5f9' }}>
                    {['Node','Aggregate','Rating','Cycle'].map(h => <th key={h} style={{ textAlign: 'left', padding: '14px 8px', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {loading ? <SkeletonRow cols={4} /> : grades.filter(g => g.total_score > 0 || g.is_finalized).length === 0 ? (
                      <tr><td colSpan={4}><Empty msg="No evaluations yet." /></td></tr>
                    ) : grades.filter(g => g.total_score > 0 || g.is_finalized).map((g, i) => {
                      const s = scoreFromGrade(g);
                      const gc = gradeColor(s);
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #ffffff', transition: 'all 0.2s' }}>
                          <td style={{ padding: '16px 8px', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{g.subject || g.courseName || '—'}</td>
                          <td style={{ padding: '16px 8px', fontSize: '15px', fontWeight: '950', color: '#0f172a' }}>{s}</td>
                          <td style={{ padding: '16px 8px' }}><Pill label={g.letterGrade || (s >= 80 ? 'A' : 'B')} color={gc.color} bg={gc.bg} /></td>
                          <td style={{ padding: '16px 8px', fontSize: '13px', color: '#64748b', fontWeight: '700' }}>{g.term || 'Cycle 1'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>


            {/* My Assignments */}
            <Section title="Active Tasks" action="Task Ledger" actionPath="/assignments" navigate={navigate}>
              <div style={{ padding: '12px 28px 24px' }}>
                {loading ? <div style={{ height: '80px', backgroundColor: '#ffffff', borderRadius: '16px', animation: 'pulse 1.5s infinite' }}></div>
                  : assignments.length === 0 ? <Empty msg="No tasks dispatched." />
                  : assignments.map((a, i) => {
                    const studentSubmission = (a.submissions || []).find(s => s.student === studentId);
                    const isGraded = studentSubmission && (studentSubmission.score !== undefined || studentSubmission.gradedAt);
                    const isSubmitted = !!studentSubmission;
                    const isPending = !isSubmitted;
                    
                    let statusLabel = 'Pending';
                    let statusColor = '#d97706';
                    let statusBg = '#fffbeb';
                    
                    if (isGraded) {
                      statusLabel = 'Graded';
                      statusColor = '#7c3aed';
                      statusBg = '#f5f3ff';
                    } else if (isSubmitted) {
                      statusLabel = 'Submitted';
                      statusColor = 'var(--brand-green)';
                      statusBg = '#f0fdf4';
                    }

                    return (
                      <div key={i} onClick={() => navigate('/assignments')} className="glass-card" style={{ padding: '16px 20px', marginBottom: i < assignments.length - 1 ? '12px' : 0, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1.5px solid transparent' }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateX(8px)'; e.currentTarget.style.borderColor = statusColor; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
                      >
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.2px' }}>{a.title || 'Assignment'}</p>
                          <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                            {a.courseName || a.subject || 'Course'} • Due: <span style={{ color: isPending ? '#d97706' : '#64748b' }}>{a.dueDate || a.due_date ? new Date(a.dueDate || a.due_date).toLocaleDateString() : '—'}</span>
                          </p>
                        </div>
                        <Pill label={statusLabel} color={statusColor} bg={statusBg} />
                      </div>
                    );
                  })}
              </div>
            </Section>


            {/* Attendance Summary */}
            <Section title="Temporal Fidelity" action="Audit Detail" actionPath="/attendance" navigate={navigate}>
              <div style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '28px' }}>
                  <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
                    <svg width="90" height="90" viewBox="0 0 90 90">
                      <circle cx="45" cy="45" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10"/>
                      <circle cx="45" cy="45" r="40" fill="none" stroke="var(--brand-green)" strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - attendance.pct / 100)}`}
                        strokeLinecap="round" transform="rotate(-90 45 45)" style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}/>
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '18px', fontWeight: '950', color: 'var(--brand-green)' }}>{attendance.pct}%</span>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '24px', fontWeight: '950', color: '#0f172a', marginBottom: '6px', letterSpacing: '-1px' }}>
                      {attendance.present} / {attendance.total} Cycles
                    </p>
                    <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Active institutional presence</p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <Pill label={`PRESENT`} color="var(--brand-green)" bg="#f0fdf4" />
                      <Pill label={`ABSENT`} color="#dc2626" bg="#fef2f2" />
                    </div>
                  </div>
                </div>
                {attendance.records.length > 0 && (
                  <div style={{ borderTop: '1.5px solid #f1f5f9', paddingTop: '20px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Recent Presence Nodes</p>
                    {attendance.records.map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < attendance.records.length - 1 ? '1px solid #ffffff' : 'none' }}>
                        <p style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>{r.date ? new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : `Node ${i+1}`}</p>
                        <Pill label={r.status === 'present' ? 'PRESENT' : 'ABSENT'} color={r.status === 'present' ? 'var(--brand-green)' : '#dc2626'} bg={r.status === 'present' ? '#f0fdf4' : '#fef2f2'} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>

          </div>

          {/* ── Bottom Row ─────────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>

            {/* Fees */}
            <Section title={<div style={{display:'flex', alignItems:'center', gap:'8px'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg> My Fees</div>} action="Pay / View All" actionPath="/fees" navigate={navigate}>
              <div style={{ padding:'16px 20px' }}>
                {unpaidFees > 0 && (
                  <div style={{ padding:'12px 16px', backgroundColor:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', marginBottom:'14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:'700', color:'#dc2626' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{marginRight:'4px', verticalAlign:'text-bottom'}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        {unpaidFees} Unpaid {unpaidFees === 1 ? 'Fee' : 'Fees'}
                      </p>
                      <p style={{ fontSize:'12px', color:'#991b1b', marginTop:'2px' }}>Please settle outstanding payments</p>
                    </div>
                    <button onClick={() => navigate('/fees')} style={{ padding:'7px 14px', backgroundColor:'#dc2626', color:'white', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>Pay Now</button>
                  </div>
                )}
                {loading ? <div style={{ height:'60px', backgroundColor:'#f1f5f9', borderRadius:'8px', animation:'pulse 1.5s infinite' }}></div>
                  : fees.length === 0 ? <Empty msg="No fee records found" />
                  : fees.map((f, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i < fees.length - 1 ? '1px solid #ffffff' : 'none' }}>
                      <div>
                        <p style={{ fontSize:'13px', fontWeight:'600', color:'#1e293b' }}>{f.description || f.feeType || 'School Fee'}</p>
                        <p style={{ fontSize:'12px', color:'#64748b' }}>Due: {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontSize:'14px', fontWeight:'700', color:'#1e293b', marginBottom:'4px' }}>GH₵{Number(f.amount).toLocaleString() || '—'}</p>
                        <Pill label={f.status === 'paid' ? 'Paid' : 'Unpaid'} color={f.status === 'paid' ? '#00843e' : '#dc2626'} bg={f.status === 'paid' ? '#dcfce7' : '#fee2e2'} />
                      </div>
                    </div>
                  ))}
              </div>
            </Section>

            {/* Announcements */}
            <Section title={<div style={{display:'flex', alignItems:'center', gap:'8px'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> Announcements</div>}>
              <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:'12px' }}>
                {loading ? <div style={{ height:'60px', backgroundColor:'#f1f5f9', borderRadius:'8px', animation:'pulse 1.5s infinite' }}></div>
                 : announcements.length === 0 ? <Empty msg="No upcoming announcements" />
                 : announcements.map((a, i) => (
                  <div key={i} style={{ padding:'14px', borderRadius:'12px', border:`1px solid ${a.bg}`, backgroundColor: a.bg + '60', cursor:'pointer', transition:'opacity 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.opacity='0.85'}
                    onMouseOut={e => e.currentTarget.style.opacity='1'}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'6px' }}>
                      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                        <Pill label={a.tag} color={a.tc} bg="white" />
                        <p style={{ fontSize:'14px', fontWeight:'700', color:'#1e293b' }}>{a.title}</p>
                      </div>
                      <span style={{ fontSize:'11px', color:'#94a3b8', flexShrink:0 }}>{a.date}</span>
                    </div>
                    <p style={{ fontSize:'13px', color:'#475569', lineHeight:'1.5' }}>{a.body}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Academic Calendar */}
            <Section title={<div style={{display:'flex', alignItems:'center', gap:'8px'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Academic Calendar</div>}>
              <AcademicCalendarWidget />
            </Section>

          </div>

          {/* ── Upcoming Timetable hint ─────────────────────── */}
          <div onClick={() => navigate('/timetable')} style={{ marginTop:'20px', padding:'20px 24px', backgroundColor:'#1e293b', borderRadius:'16px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', transition:'opacity 0.2s' }}
            onMouseOver={e => e.currentTarget.style.opacity='0.9'}
            onMouseOut={e => e.currentTarget.style.opacity='1'}
          >
            <div>
              <p style={{ color:'white', fontSize:'16px', fontWeight:'700', marginBottom:'4px', display:'flex', alignItems:'center', gap:'8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                View My Full Timetable
              </p>
              <p style={{ color:'#94a3b8', fontSize:'13px' }}>See your complete class schedule for each course this year</p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00843e" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>

        </div>
    </div>
  );
};

export default StudentDashboard;
