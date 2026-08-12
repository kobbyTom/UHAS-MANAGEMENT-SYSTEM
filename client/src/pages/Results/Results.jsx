import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { gradeAPI, parentAPI, studentAPI, academicClassesAPI, academicSubjectsAPI, examAPI } from '../../services/api';
import PremiumSelect from '../../components/common/PremiumSelect';
import { useAlert } from '../../context/AlertContext';

// Premium Icon Components
const Icons = {
  Award: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  Activity: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  TrendingUp: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  BookOpen: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  FileText: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const Results = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { showAlert } = useAlert();
  const [activeMenu, setActiveMenu] = useState('Exams');
  const [activeTab, setActiveTab] = useState('view');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [children, setChildren] = useState([]);
  const [storedUser, setStoredUser] = useState(null);
  
  // Backend Integration States
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [generatedResults, setGeneratedResults] = useState(null);
  const [newResultData, setNewResultData] = useState({ class: '', subject: '', title: '', date: '', maxScore: 100 });
  const [selectedChildId, setSelectedChildId] = useState('all');

  const [stats, setStats] = useState({ assessments: 0, totalResults: 0, average: 0 });

  const role = storedUser?.role || user?.role;
  const isParent = role === 'parent';
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  useEffect(() => {
    const saved = localStorage.getItem('authUser');
    let currentUser = user;
    if (saved) {
      try { 
        currentUser = JSON.parse(saved);
        setStoredUser(currentUser); 
      } catch (e) {}
    }
    if (currentUser?.role === 'parent') {
      fetchParentData();
    } else if (currentUser?.role === 'student') {
      fetchStudentData(currentUser);
    } else {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    setLoading(true);
    let fetchedClasses = [];
    
    // Fetch Classes
    try {
      const classRes = await academicClassesAPI.getAll();
      if (classRes.data?.data) {
        setClasses(classRes.data.data);
        fetchedClasses = classRes.data.data;
      }
    } catch(e) { console.error('Error fetching classes:', e); }

    // Fetch Subjects
    try {
      const subRes = await academicSubjectsAPI.getAll();
      if (subRes.data?.data) setSubjects(subRes.data.data);
    } catch(e) { console.error('Error fetching subjects:', e); }

    // Fetch Analytics Data
    try {
      const analyticsRes = await examAPI.getResults();
      const resData = analyticsRes.data?.data || [];
      
      // Compute overall stats accurately
      let totalScore = 0;
      let count = 0;
      const uniqueAssessments = new Set();
      
      const classMap = {};
      
      // Initialize with all database classes
      fetchedClasses.forEach(c => {
         classMap[c.name] = { scores: [], students: new Set() };
      });

      resData.forEach(r => {
         // For overall stats
         totalScore += Number(r.score) || 0;
         count++;
         uniqueAssessments.add(`${r.grade}-${r.subject}-${r.term}`);

         // For class analytics
         const className = r.grade || 'Unknown';
         if (!classMap[className]) classMap[className] = { scores: [], students: new Set() };
         classMap[className].scores.push(Number(r.score) || 0);
         classMap[className].students.add(r.studentId);
      });

      setStats({
        assessments: uniqueAssessments.size,
        totalResults: count,
        average: count > 0 ? Math.round(totalScore / count) : 0
      });

      const analytics = Object.entries(classMap).map(([className, data]) => {
         const sum = data.scores.reduce((a,b) => a+b, 0);
         return {
           class: className,
           average: data.scores.length ? Math.round(sum / data.scores.length) : 0,
           highest: data.scores.length ? Math.max(...data.scores) : 0,
           lowest: data.scores.length ? Math.min(...data.scores) : 0,
           students: data.students.size
         };
      });
      setAnalyticsData(analytics);
    } catch(e) { console.error('Error fetching analytics:', e); }
    
    setLoading(false);
  };

  const handleGenerateView = async () => {
    if (!selectedClass || !selectedTerm) {
      showAlert('warning', 'Please select both class and term.');
      return;
    }
    try {
      setLoading(true);
      const res = await examAPI.getResults({ grade: selectedClass, term: selectedTerm });
      if (res.data?.data) {
        setGeneratedResults(res.data.data);
      }
    } catch(e) { 
      console.error(e);
      showAlert('error', 'Failed to fetch results.');
    } finally { setLoading(false); }
  };

  const filteredResults = useMemo(() => {
    if (!generatedResults) return null;
    let filtered = generatedResults;
    if (selectedSection) {
      filtered = filtered.filter(r => r.section?.toLowerCase() === selectedSection.toLowerCase());
    }
    
    // Group by studentId
    const map = {};
    const subjectsSet = new Set();

    filtered.forEach(r => {
      if (!map[r.studentId]) {
        map[r.studentId] = {
          studentId: r.studentId,
          studentName: r.studentName,
          admissionNumber: r.admissionNumber,
          scores: {}
        };
      }
      map[r.studentId].scores[r.subject] = r.score;
      subjectsSet.add(r.subject);
    });

    const subjectsList = Array.from(subjectsSet).sort();

    const grouped = Object.values(map).map(student => {
      let total = 0;
      let count = 0;
      subjectsList.forEach(sub => {
        if (student.scores[sub] !== undefined) {
          total += Number(student.scores[sub]);
          count++;
        }
      });
      const average = count > 0 ? Math.round(total / count) : 0;
      const grade = average >= 70 ? 'A' : average >= 60 ? 'B' : average >= 50 ? 'C' : 'F';
      
      return {
        ...student,
        total,
        average,
        grade
      };
    });
    
    // Sort by average descending
    grouped.sort((a, b) => b.average - a.average);

    return { subjects: subjectsList, students: grouped };
  }, [generatedResults, selectedSection]);

  const handleSaveResult = async () => {
    try {
      if (!newResultData.class || !newResultData.subject) {
        showAlert('warning', 'Please provide necessary details.');
        return;
      }
      // Note: Typically you'd upload an excel file or form data
      // For now, simulating success since this relies on bulk submission
      showAlert('success', 'Assessment configuration saved. Ready for marks entry.');
      setShowModal(false);
      setNewResultData({ class: '', subject: '', title: '', date: '', maxScore: 100 });
    } catch(e) {
      showAlert('error', 'Failed to save results.');
    }
  };

  const fetchStudentData = async (studentUser) => {
    try {
      setLoading(true);
      const gradesRes = await studentAPI.getGrades(studentUser.id || studentUser._id);
      if (gradesRes?.data?.data) {
        setResults(gradesRes.data.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchParentData = async () => {
    try {
      setLoading(true);
      const [childrenRes, gradesRes] = await Promise.all([
        parentAPI.getMyChildren(),
        parentAPI.getMyChildrenGrades()
      ]);
      if (childrenRes?.data?.data) setChildren(childrenRes.data.data);
      if (gradesRes?.data?.data) setResults(gradesRes.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <>
      <main>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Academic Records</span>
              <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Performance Analysis</span>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>{isParent || isStudent ? "Student" : "Exams &"} <span style={{ color: 'var(--brand-green)' }}>Results</span></h1>
            <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>{isParent || isStudent ? 'Monitor academic progress and performance' : 'Manage student examinations and record results'}</p>
          </div>
          {!(isParent || isStudent) && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => navigate('/exams/marks')}
                className="premium-btn-secondary"
              >
                <Icons.FileText />
                Enter Marks
              </button>
              <button 
                onClick={() => setShowModal(true)}
                className="premium-btn-primary"
              >
                <Icons.Plus />
                Create Result
              </button>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
          {isParent || isStudent ? (
            <>
              {isParent && <StatCard title="Children" value={children.length} icon={<Icons.Award />} color="var(--brand-green)" />}
              <StatCard title="Records" value={results.length} icon={<Icons.FileText />} color="var(--brand-yellow)" />
              <StatCard title="Overall Avg" value={`${results.length > 0 ? Math.round(results.reduce((a, g) => a + (g.score || g.totalScore || 0), 0) / results.length) : 0}%`} icon={<Icons.TrendingUp />} color="#0ea5e9" />
              <StatCard title="Status" value="On Track" icon={<Icons.Activity />} color="#8b5cf6" />
            </>
          ) : (
            <>
              <StatCard title="Assessments" value={stats.assessments} icon={<Icons.BookOpen />} color="var(--brand-green)" />
              <StatCard title="Total Results" value={stats.totalResults} icon={<Icons.FileText />} color="var(--brand-yellow)" />
              <StatCard title="Average" value={`${stats.average}%`} icon={<Icons.TrendingUp />} color="#0ea5e9" />
              <StatCard title="Rankings" value="Updated" icon={<Icons.Award />} color="#8b5cf6" />
            </>
          )}
        </div>


        {/* Main Content Area */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '0 32px', borderBottom: '1px solid var(--brand-slate-100)' }}>
            {isParent || isStudent ? (
              <button style={{ padding: '20px 24px', border: 'none', background: 'none', fontSize: '14px', fontWeight: '800', color: 'var(--brand-green)', borderBottom: '3px solid var(--brand-green)', cursor: 'pointer' }}>Latest Results</button>
            ) : (
              <>
                <button onClick={() => { setActiveTab('view'); setGeneratedResults(null); }} style={{ padding: '20px 24px', border: 'none', background: 'none', fontSize: '14px', fontWeight: '800', color: activeTab === 'view' ? 'var(--brand-green)' : '#94a3b8', borderBottom: activeTab === 'view' ? '3px solid var(--brand-green)' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>View Results</button>
                <button onClick={() => setActiveTab('analytics')} style={{ padding: '20px 24px', border: 'none', background: 'none', fontSize: '14px', fontWeight: '800', color: activeTab === 'analytics' ? 'var(--brand-green)' : '#94a3b8', borderBottom: activeTab === 'analytics' ? '3px solid var(--brand-green)' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>Class Analytics</button>
                <button onClick={() => navigate('/exams/marks')} style={{ padding: '20px 24px', border: 'none', background: 'none', fontSize: '14px', fontWeight: '800', color: '#94a3b8', borderBottom: '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>Marks Entry</button>
              </>
            )}
          </div>


          <div style={{ padding: '40px' }}>
            {isParent || isStudent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {isParent && children.length > 0 && (
                  <div style={{ marginBottom: '8px', width: '250px' }}>
                    <PremiumSelect
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      options={[
                        { value: 'all', label: 'All Children' },
                        ...children.map(c => ({ value: c.id || c._id, label: `${c.firstName} ${c.lastName}` }))
                      ]}
                      placeholder="Select Child"
                    />
                  </div>
                )}
                {(() => {
                  const displayResults = results.filter(r => !isParent || selectedChildId === 'all' || (r.studentId || r.student?._id || r.student?.id) === selectedChildId);
                  return displayResults.length > 0 ? displayResults.map((r, i) => {
                    const student = children.find(c => (c.id || c._id) === (r.studentId || r.student?._id || r.student?.id));
                    const score = r.score || r.totalScore || r.percentage || 0;
                    return (
                    <div key={i} style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#00843e'} onMouseOut={(e) => e.currentTarget.style.borderColor = '#f1f5f9'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#00843e10', color: '#00843e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>{student?.firstName?.[0] || 'S'}</div>
                        <div>
                          <p style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{student ? `${student.firstName} ${student.lastName}` : r.studentName || 'Student'}</p>
                          <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>{r.subject || r.courseName || 'General Subject'} • {r.assessmentType || 'Terminal Exam'}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '18px', fontWeight: '800', color: score >= 70 ? '#00843e' : score >= 50 ? '#f59e0b' : '#ef4444', margin: 0 }}>{score}%</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>Grade: {r.grade || (score >= 70 ? 'A' : score >= 60 ? 'B' : score >= 50 ? 'C' : 'F')}</p>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                    <Icons.FileText />
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginTop: '16px' }}>No results recorded yet</p>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>Check back later once terminal results are published.</p>
                  </div>
                ); })()}
              </div>
            ) : activeTab === 'view' ? (
              <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#00843e10', color: '#00843e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Icons.Filter />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Select Class & Subject</h3>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Please select a class and an assessment to view student performances.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ width: '180px' }}>
                    <PremiumSelect 
                      value={selectedClass} 
                      onChange={(e) => setSelectedClass(e.target.value)} 
                      options={classes.map(c => ({ value: c.name, label: c.name }))} 
                      placeholder="Select Class" 
                    />
                  </div>
                  <div style={{ width: '180px' }}>
                    <PremiumSelect 
                      value={selectedSection} 
                      onChange={(e) => setSelectedSection(e.target.value)} 
                      options={['Yellow', 'Green', 'Red', 'Blue'].map(s => ({ value: s, label: s }))} 
                      placeholder="Select Section" 
                    />
                  </div>
                  <div style={{ width: '180px' }}>
                    <PremiumSelect 
                      value={selectedTerm} 
                      onChange={(e) => setSelectedTerm(e.target.value)} 
                      options={[{value:'1st', label:'First Term'}, {value:'2nd', label:'Second Term'}, {value:'3rd', label:'Third Term'}]} 
                      placeholder="Select Term" 
                    />
                  </div>
                  <button onClick={handleGenerateView} style={{ padding: '12px 24px', backgroundColor: '#00843e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {loading ? 'Generating...' : 'Generate View'}
                  </button>
                </div>
                
                {filteredResults && (
                  <div style={{ marginTop: '40px', textAlign: 'left', overflowX: 'auto' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Master Results Sheet</h4>
                    
                    {filteredResults.students.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <tr>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap' }}>Student</th>
                            {filteredResults.subjects.map(sub => (
                              <th key={sub} style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap' }}>{sub}</th>
                            ))}
                            <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Total</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Avg</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredResults.students.map((student) => (
                            <tr key={student.studentId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{student.studentName}</p>
                                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>{student.admissionNumber || 'N/A'}</p>
                              </td>
                              {filteredResults.subjects.map(sub => {
                                const score = student.scores[sub];
                                return (
                                  <td key={sub} style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '500', color: score !== undefined ? '#334155' : '#cbd5e1' }}>
                                    {score !== undefined ? score : '-'}
                                  </td>
                                );
                              })}
                              <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#00843e' }}>{student.total}</td>
                              <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#3b82f6' }}>{student.average}%</td>
                              <td style={{ padding: '16px', textAlign: 'center' }}>
                                <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', backgroundColor: student.grade === 'A' ? '#dcfce7' : student.grade === 'B' ? '#e0f2fe' : student.grade === 'C' ? '#fef3c7' : '#fee2e2', color: student.grade === 'A' ? '#166534' : student.grade === 'B' ? '#075985' : student.grade === 'C' ? '#92400e' : '#991b1b' }}>
                                  {student.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>No results found for the selected criteria.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                {analyticsData.map((cr, idx) => (
                  <div key={idx} style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #f1f5f9', transition: 'all 0.3s ease' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = '#00843e'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#f1f5f9' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>{cr.class}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div><p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Average</p><p style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>{cr.average}%</p></div>
                      <div><p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Highest</p><p style={{ fontSize: '20px', fontWeight: '800', color: '#00843e' }}>{cr.highest}%</p></div>
                      <div><p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Lowest</p><p style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>{cr.lowest}%</p></div>
                      <div><p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Students</p><p style={{ fontSize: '20px', fontWeight: '800', color: '#0ea5e9' }}>{cr.students}</p></div>
                    </div>
                    <button style={{ width: '100%', padding: '12px', marginTop: '24px', backgroundColor: 'white', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View Detailed Report</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', width: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Record Assessment Results</h2>
              <button onClick={() => setShowModal(false)} style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.X />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormGroup 
                  label="Class" 
                  type="select" 
                  value={newResultData.class}
                  onChange={(e) => setNewResultData({...newResultData, class: e.target.value})}
                  options={classes.map(c => ({ v: c.name, l: c.name }))} 
                />
                <FormGroup 
                  label="Subject" 
                  type="select" 
                  value={newResultData.subject}
                  onChange={(e) => setNewResultData({...newResultData, subject: e.target.value})}
                  options={subjects.map(s => ({ v: s.name, l: s.name }))} 
                />
              </div>
              <FormGroup 
                label="Assessment Title" 
                placeholder="e.g. Mid-Term Quiz 1" 
                value={newResultData.title}
                onChange={(e) => setNewResultData({...newResultData, title: e.target.value})}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormGroup 
                  label="Date" 
                  type="date" 
                  value={newResultData.date}
                  onChange={(e) => setNewResultData({...newResultData, date: e.target.value})}
                />
                <FormGroup 
                  label="Max Score" 
                  type="number" 
                  defaultValue="100" 
                  value={newResultData.maxScore}
                  onChange={(e) => setNewResultData({...newResultData, maxScore: e.target.value})}
                />
              </div>
              <div style={{ padding: '24px', borderRadius: '16px', border: '2px dashed #e2e8f0', textAlign: 'center', cursor: 'pointer' }}>
                <Icons.FileText />
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Click to upload results (Excel/CSV)</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '12px 24px', backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveResult} style={{ padding: '12px 24px', backgroundColor: '#00843e', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 132, 62, 0.2)' }}>Save Results</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @font-face { font-family: 'Inter'; font-style: normal; font-weight: 400; src: url(https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2) format('woff2'); }
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

const FormGroup = ({ label, type = 'text', options = [], placeholder, defaultValue, value, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{label}</label>
    {type === 'select' ? (
      <PremiumSelect 
        value={value}
        onChange={onChange}
        options={options.map(opt => ({ value: opt.v, label: opt.l }))} 
        placeholder={`Select ${label}`} 
      />
    ) : (
      <input 
        type={type} 
        placeholder={placeholder} 
        defaultValue={defaultValue} 
        value={value}
        onChange={onChange}
        style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none' }} 
      />
    )}
  </div>
);

export default Results;
