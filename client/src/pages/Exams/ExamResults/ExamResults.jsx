import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examAPI, studentAPI, courseAPI, parentAPI, assignmentAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import PremiumSelect from '../../../components/common/PremiumSelect';

// Premium Icon Components
const Icons = {
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  TrendingUp: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Users: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="17" cy="11" r="4"/></svg>,
  Award: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
};

const ExamResults = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const currentUser = user;
  const isParent = currentUser?.role === 'parent';

  const [assignments, setAssignments] = useState([]);
  async function fetchData() {
    try {
      setLoading(true);
      const [resultsRes, studentsRes, coursesRes, assignmentsRes] = await Promise.all([
        examAPI.getResults(),
        studentAPI.getAll({ limit: 500 }),
        courseAPI.getAll({ limit: 100 }),
        assignmentAPI.getAll({ limit: 500 })
      ]);
      setResults(resultsRes?.data?.data || resultsRes?.data || []);
      setStudents(studentsRes?.data?.data || studentsRes?.data || []);
      setCourses(coursesRes?.data?.data || coursesRes?.data || []);
      setAssignments(assignmentsRes?.data?.data || assignmentsRes?.data || []);
      
      if (isParent) {
        const parentRes = await parentAPI.getMyChildren();
        if (parentRes.data?.success) {
          setLinkedStudents(parentRes.data.data);
          if (parentRes.data.data.length > 0) {
            setSelectedChildId(parentRes.data.data[0].id);
          }
        }
      }
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    fetchData();
  }, [isParent]);

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId || s._id === studentId);
    return student ? `${student.firstName || student.first_name} ${student.lastName || student.last_name}` : 'Unknown Student';
  };

  const allAcademicData = [
    ...results
      .filter(r => r.score > 0 || r.isFinalized) // Filter out ungraded bulk-created exam stubs
      .map(r => ({ ...r, entryType: 'Exam' })),
    ...assignments.flatMap(a => (a.submissions || [])
      .filter(s => s.score !== undefined)
      .map(s => ({
        id: `asg-${a.id}-${s.student}`,
        studentId: s.student,
        subject: courses.find(c => c.id === (a.course_id || a.course))?.name || a.courseName || a.subject || 'General Subject',
        grade: a.grade || a.class_name,
        examName: a.title,
        score: s.score,
        maxScore: a.max_score || a.maxScore || a.marks || 100,
        entryType: 'Assignment'
      }))
    )
  ];

  const filteredResults = allAcademicData.filter(r => {
    // Permission & Context Filtering
    if (currentUser?.role === 'student') {
      const myId = currentUser.studentId || currentUser.id;
      if (r.studentId !== myId) return false;
    } else if (isParent) {
      if (!selectedChildId || r.studentId !== selectedChildId) return false;
    }

    const studentName = getStudentName(r.studentId).toLowerCase();
    const matchesSearch = studentName.includes(searchQuery.toLowerCase()) || 
                         (r.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (r.examName || '').toLowerCase().includes(searchQuery.toLowerCase());
                         
    if (selectedExam && r.examId !== selectedExam) return false;
    if (selectedClass && !isParent && r.grade !== selectedClass) return false;
    if (searchQuery && !matchesSearch) return false;
    return true;
  });

  const avgScore = filteredResults.length > 0
    ? (filteredResults.reduce((sum, r) => sum + ((r.score / (r.maxScore || 100)) * 100), 0) / filteredResults.length).toFixed(1)
    : 0;

  return (
    <>
      <main style={{ padding: '0 0 40px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Academic Records</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Performance Analysis</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Exam <span style={{ color: 'var(--brand-green)' }}>Results</span></h1>
              <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>
                {isParent ? "Detailed examination outcomes and academic performance records for your children." : "Published examination outcomes and student performance records."}
              </p>
            </div>
            <button 
              onClick={() => navigate('/exams/schedule')} 
              className="premium-btn-secondary"
            >
              <Icons.Calendar />
              View Exam Schedule
            </button>
          </div>


          <div className="responsive-grid-3" style={{ marginBottom: '40px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.TrendingUp /></div>
                <div><p style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{avgScore}%</p><p className="premium-label" style={{ margin: 0 }}>Institutional Avg.</p></div>
              </div>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Award /></div>
                <div><p style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{filteredResults.length}</p><p className="premium-label" style={{ margin: 0 }}>Reports Issued</p></div>
              </div>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Users /></div>
                <div><p style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{isParent ? linkedStudents.length : students.length}</p><p className="premium-label" style={{ margin: 0 }}>{isParent ? "Linked Scholars" : "Candidate Registry"}</p></div>
              </div>
            </div>
          </div>


          <div className="glass-card" style={{ padding: '24px', marginBottom: '32px', display: 'flex', gap: '16px' }}>
            {isParent && linkedStudents.length > 0 && (
              <div style={{ minWidth: '240px', position: 'relative' }}>
                <PremiumSelect 
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  options={linkedStudents.map(c => ({ value: c.id, label: `${c.firstName || c.first_name} ${c.lastName || c.last_name}` }))}
                  placeholder="Select Scholar"
                  icon={<Icons.Users />}
                />
              </div>
            )}
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder={isParent ? "Search by subject or exam type..." : "Filter by name, ID or course..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="premium-input"
                style={{ paddingLeft: '48px' }}
              />
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icons.Search /></div>
            </div>
            {!isParent && (
              <div style={{ minWidth: '200px' }}>
                <PremiumSelect 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  options={['KG 1', 'KG 2', 'KG 3', 'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'Basic 7', 'Basic 8', 'Basic 9'].map(g => ({ value: g, label: g }))}
                  placeholder="All Academic Levels"
                  icon={<Icons.Filter />}
                />
              </div>
            )}
          </div>


          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--brand-slate-50)' }}>
                  <th className="premium-th">Candidate Information</th>
                  <th className="premium-th">Curriculum & Exam</th>
                  <th className="premium-th">Raw Score</th>
                  <th className="premium-th">Classification</th>
                  <th className="premium-th">Progress Vector</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={5} style={{ padding: '24px' }}><div className="premium-loader" style={{ margin: 'auto' }}></div></td></tr>
                  ))
                ) : filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '100px 40px', textAlign: 'center' }}>
                      <div style={{ color: 'var(--brand-slate-200)', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}><Icons.Award /></div>
                      <p style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Data Not Found</p>
                      <p style={{ fontSize: '15px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>There are no examination results matching the current criteria.</p>
                    </td>
                  </tr>
                ) : filteredResults.map((result, idx) => {
                  const score = result.score || 0;
                  const max = result.maxScore || 100;
                  const percent = (score / max) * 100;
                  return (
                    <tr key={idx} className="premium-row" style={{ borderBottom: '1px solid var(--brand-slate-100)' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <p style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>{getStudentName(result.studentId)}</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', fontWeight: '600' }}>Grade: {result.grade || 'N/A'}</p>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#475569', margin: 0 }}>{result.subject || result.courseName || 'N/A'}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: '900', 
                            padding: '2px 8px', 
                            borderRadius: '6px', 
                            backgroundColor: result.entryType === 'Exam' ? '#fdf2f2' : '#eff6ff',
                            color: result.entryType === 'Exam' ? '#ef4444' : '#3b82f6',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>{result.entryType}</span>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{result.examName || 'Standardized Assessment'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <p style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{score}<span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginLeft: '4px' }}>/ {max}</span></p>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: '10px', 
                          fontSize: '11px', 
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          backgroundColor: percent >= 70 ? '#ecfdf5' : percent >= 50 ? '#fefce8' : '#fef2f2',
                          color: percent >= 70 ? '#10b981' : percent >= 50 ? '#ca8a04' : '#ef4444',
                          border: `1px solid ${percent >= 70 ? '#d1fae5' : percent >= 50 ? '#fef08a' : '#fee2e2'}`
                        }}>
                          {percent >= 70 ? 'Distinction' : percent >= 50 ? 'Credit' : 'Requirement Gap'}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px', width: '180px' }}>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--brand-slate-100)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', backgroundColor: percent >= 70 ? 'var(--brand-green)' : percent >= 50 ? 'var(--brand-yellow)' : '#ef4444', borderRadius: '4px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

      </main>
      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #f1f5f9' }}>
    <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
    <div>
      <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</p>
      <p style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '4px 0 0' }}>{value}</p>
    </div>
  </div>
);

export default ExamResults;
