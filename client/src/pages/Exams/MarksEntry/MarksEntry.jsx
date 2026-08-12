import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { studentAPI, courseAPI, gradeAPI, settingsAPI, teacherAPI, academicClassesAPI } from '../../../services/api';
import PremiumSelect from '../../../components/common/PremiumSelect';
import { mapSectionName } from '../../../utils/sectionHelper';

const displayGrade = (g) => {
  if (!g) return 'No Grade';
  let str = g.toString().trim();
  const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
  if (primaryMatch) return `Basic ${primaryMatch[1]}`;
  return str;
};

// Premium Icon Components
const Icons = {
  FileText: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Save: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Refresh: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Lock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
};

const MarksEntry = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Exams');

  // Role-based access control
  const currentUser = user || JSON.parse(localStorage.getItem('authUser') || '{}');
  const isTeacher = currentUser?.role === 'teacher';
  const isAdmin = currentUser?.role === 'admin';

  // Teacher-specific state
  const [teacherCourses, setTeacherCourses] = useState([]); // subjects teacher teaches
  const [masterClass, setMasterClass] = useState(null);     // teacher's homeroom class
  const [viewMode, setViewMode] = useState('entry');        // 'entry' | 'overview'
  
  const [filters, setFilters] = useState({
    grade: '',
    section: '',
    courseId: '',
    term: '1st'
  });

  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', title, message }
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // canEdit: only teacher if the selected course is one they personally teach (Admins are strictly view-only)
  const selectedCourse = courses.find(c => (c.id || c._id) === filters.courseId);
  const isAssignedToSelectedCourse = isTeacher && teacherCourses.some(tc => (tc.id || tc._id) === filters.courseId);
  const canEdit = isTeacher && isAssignedToSelectedCourse;

  // Derive available sections for the selected grade (for Admins)
  const selectedClassObj = classes.find(c => c.name === filters.grade);
  const availableSections = selectedClassObj?.sections || [];

  // Derive all unique class+section combos the teacher teaches
  const teachingClasses = React.useMemo(() => {
    const seen = new Set();
    return teacherCourses
      .filter(c => c.grade && c.section)
      .filter(c => {
        const key = `${c.grade}|${c.section}`;
        if (seen.has(key)) return false;
        seen.add(key); return true;
      })
      .map(c => ({ grade: c.grade, section: c.section, label: `${displayGrade(c.grade)} — Section ${mapSectionName(c.section)}` }))
      .sort((a, b) => {
        if (masterClass) {
          const aIsMaster = a.grade === (masterClass.name || masterClass.grade) && a.section === masterClass.section;
          const bIsMaster = b.grade === (masterClass.name || masterClass.grade) && b.section === masterClass.section;
          if (aIsMaster) return -1;
          if (bIsMaster) return 1;
        }
        return a.label.localeCompare(b.label);
      });
  }, [teacherCourses, masterClass]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchInitialData = async () => {
    try {
      const settingsRes = await settingsAPI.getSettings();
      if (settingsRes.data.success) {
        setSettings(settingsRes.data.settings);
        setFilters(prev => ({ 
          ...prev, 
          term: settingsRes.data.settings.currentTerm || '1st'
        }));
      }

      // Fetch all academic classes for the dropdown
      const classesRes = await academicClassesAPI.getAll();
      if (classesRes.data?.data) {
        setClasses(classesRes.data.data);
      }

      if (isTeacher) {
        // Teachers: fetch only their own courses + master class info
        const teacherRes = await teacherAPI.getMyCourses();
        if (teacherRes.data.success) {
          const tCourses = teacherRes.data.data || [];
          setTeacherCourses(tCourses);
          setCourses(tCourses); // only see their own subjects

          const mClasses = teacherRes.data.masterClasses || [];
          if (mClasses.length > 0) {
            const mc = mClasses[0];
            setMasterClass(mc);
            setFilters(prev => ({
              ...prev,
              grade: mc.name || mc.grade || '',
              section: mc.section || ''
            }));
          }
        }
      } else {
        // Admin: see all courses and force overview mode
        setViewMode('overview');
        const coursesRes = await courseAPI.getAll({ limit: 1000 });
        if (coursesRes.data.success) {
          setCourses(coursesRes.data.data);
        }
      }
    } catch (error) { console.error('Error fetching initial data:', error); }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const loadStudents = async () => {
    // For teachers, allow loading with just grade (to see all students in their class)
    if (!filters.grade) return;
    // For course-based marks entry, also need courseId
    if (!filters.courseId && !masterClass) return;

    try {
      setLoading(true);
      setCurrentPage(1);
      const currentYear = settings?.currentSession || '2024/2025';

      console.log('[DEBUG] loadStudents with filters:', filters);

      // Find all courses with the same name in this grade to merge their grades
      const selectedCourse = courses.find(c => c.id === filters.courseId || c._id === filters.courseId);
      const matchingCourseIds = selectedCourse
        ? courses.filter(c =>
            c.name.toLowerCase().trim() === selectedCourse.name.toLowerCase().trim()
          ).map(c => c.id || c._id)
        : filters.courseId ? [filters.courseId] : [];

      console.log('[DEBUG] selectedCourse:', selectedCourse, 'matchingCourseIds:', matchingCourseIds);

      const studentParams = { grade: filters.grade, limit: 'none' };
      if (filters.section) studentParams.section = filters.section;

      const promises = [studentAPI.getAll(studentParams)];
      if (matchingCourseIds.length > 0) {
        matchingCourseIds.forEach(id => promises.push(gradeAPI.getByCourse(id, { term: filters.term, academicYear: currentYear })));
      }

      const [studentsRes, ...gradesResponses] = await Promise.all(promises);

      if (studentsRes.data.success) {
        let studentsList = studentsRes.data.data;
        
        // Strict Section Filtering: if a section is selected, strictly enforce it.
        if (filters.section && filters.section !== '') {
          studentsList = studentsList.filter(s => {
            const dbSec = String(s.section || '').toLowerCase().replace('section', '').trim();
            const filterSec = String(filters.section).toLowerCase().replace('section', '').trim();
            return dbSec.includes(filterSec) || filterSec.includes(dbSec);
          });
        }
        
        setStudents(studentsList);
        
        const allGrades = gradesResponses.flatMap(res => res.data?.data || []);
        
        const initialMarks = {};
        studentsList.forEach(s => {
          const sId = s.id || s._id;

          // Get ALL matching grade records for this student (can be multiple from different sections)
          const matchingGrades = allGrades.filter(g =>
            (g.student === sId || g.student_id === sId) &&
            g.term === filters.term &&
            (g.academic_year === currentYear || g.academicYear === currentYear)
          );

          // Pick the most recently updated one (teacher's latest entry wins)
          const existingGrade = matchingGrades.length > 0
            ? matchingGrades.sort((a, b) =>
                new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
              )[0]
            : null;
          
          if (existingGrade) {
            // First try to read from the assessments array (new format), then fallback to flat fields (bulk-submit format)
            const savedAssessments = Array.isArray(existingGrade.assessments) ? existingGrade.assessments : [];
            const cat1 = savedAssessments.find(a => a.name === 'Cat1')?.score ?? existingGrade.cat1 ?? 0;
            const gw   = savedAssessments.find(a => a.name === 'GW')?.score   ?? existingGrade.gw   ?? 0;
            const cat2 = savedAssessments.find(a => a.name === 'Cat2')?.score ?? existingGrade.cat2 ?? 0;
            const pw   = savedAssessments.find(a => a.name === 'PW')?.score   ?? existingGrade.pw   ?? 0;
            const exam = savedAssessments.find(a => a.name === 'Exam')?.score ?? existingGrade.exam ?? 0;

            initialMarks[sId] = {
              cat1, gw, cat2, pw, exam,
              id: existingGrade.id || existingGrade._id,
              courseId: existingGrade.course_id || existingGrade.course || filters.courseId
            };
          } else {
            initialMarks[sId] = { cat1: 0, gw: 0, cat2: 0, pw: 0, exam: 0, courseId: filters.courseId };
          }
        });
        setMarks(initialMarks);
        setLastUpdated(new Date());

      }
    } catch (error) { console.error('Error loading students:', error); }
    finally { setLoading(false); }
  };

  const handleMarkChange = (studentId, field, value, max) => {
    const val = Math.min(max, Math.max(0, parseInt(value) || 0));
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: val }
    }));
  };


  const calculateTotal = (studentId) => {
    const m = marks[studentId];
    if (!m) return 0;
    return (m.cat1 || 0) + (m.gw || 0) + (m.cat2 || 0) + (m.pw || 0) + (m.exam || 0);
  };


  const getGrade = (total) => {
    const percentage = Math.round(total / 2);
    if (!settings || !settings.gradingSystem || settings.gradingSystem.length === 0) {
      if (percentage >= 90) return '1';
      if (percentage >= 80) return '2';
      if (percentage >= 70) return '3';
      if (percentage >= 60) return '4';
      if (percentage >= 55) return '5';
      if (percentage >= 50) return '6';
      if (percentage >= 40) return '7';
      if (percentage >= 35) return '8';
      return '9';
    }
    const gradeItem = settings.gradingSystem.find(g => percentage >= g.minScore && percentage <= g.maxScore);
    return gradeItem ? gradeItem.grade : '9';
  };

  const submitMarks = async () => {
    try {
      setSaving(true);
      const currentYear = settings?.currentSession || '2024/2025';
      console.log('Submitting marks with academic_year:', currentYear, 'term:', filters.term);
      
      const gradesToSubmit = students.map(s => {
        const sId = s.id || s._id;
        const m = marks[sId] || { cat1: 0, gw: 0, cat2: 0, pw: 0, exam: 0, courseId: filters.courseId };
        const total = calculateTotal(sId);
        return {
          id: m.id,
          student_id: sId,
          student_name: `${s.firstName || s.first_name} ${s.lastName || s.last_name}`,
          course_id: m.courseId || filters.courseId,
          course_name: courses.find(c => (c.id === (m.courseId || filters.courseId) || c._id === (m.courseId || filters.courseId)))?.name,
          academic_year: currentYear,
          term: filters.term,
          cat1: m.cat1 || 0,
          gw: m.gw || 0,
          cat2: m.cat2 || 0,
          pw: m.pw || 0,
          exam: m.exam || 0,
          score: total,
          grade: getGrade(total)
        };
      });


      console.log('Grades to submit:', gradesToSubmit);
      
      const response = await gradeAPI.submitBatch({ grades: gradesToSubmit });
      console.log('Submit response:', response.data);
      if (response.data.success) {
        const count = response.data.count;
        const failed = response.data.failed || [];
        if (failed.length > 0) {
          console.error('Failed grades:', failed);
          showToast('error', 'Partial Sync', `${count} records saved, but ${failed.length} failed. Check console for details.`);
        } else {
          showToast('success', 'Synchronization Complete', `${count} student record${count !== 1 ? 's' : ''} successfully committed to the ledger.`);
        }
        loadStudents();
      } else {
        showToast('error', 'Sync Failed', response.data.message || 'An unknown error occurred.');
      }
    } catch (error) {
      console.error('Error submitting marks:', error);
      showToast('error', 'Connection Error', error.response?.data?.message || error.message);
    }
    finally { setSaving(false); }
  };

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  const grades = [...new Set(courses.map(c => c.grade))];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>

      {/* ── Custom Toast Notification ─────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '28px', right: '32px', zIndex: 9999,
          minWidth: '360px', maxWidth: '440px',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: `1.5px solid ${toast.type === 'success' ? '#bbf7d0' : '#fee2e2'}`,
          padding: '20px 24px',
          display: 'flex', alignItems: 'flex-start', gap: '16px',
          animation: 'toastSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)'
        }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: toast.type === 'success' ? '#f0fdf4' : '#fef2f2'
          }}>
            {toast.type === 'success'
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>{toast.title}</p>
            <p style={{ margin: '4px 0 0', fontWeight: '600', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', lineHeight: 1, flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      <main style={{ padding: '0 0 60px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Assessment Node</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Academic Evaluation</span>
              </div>
              <h1 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-2px' }}>Marks <span style={{ color: 'var(--brand-green)' }}>{canEdit ? 'Entry' : 'Registry'}</span></h1>
              <p style={{ fontSize: '17px', color: '#64748b', marginTop: '10px', fontWeight: '500' }}>{canEdit ? 'Process and synchronize student assessment scores for the current term.' : 'View student assessment scores. Contact the assigned teacher to make changes.'}</p>
            </div>
            {canEdit && students.length > 0 && (
              <button 
                onClick={submitMarks}
                disabled={saving}
                className="premium-btn-primary"
                style={{ padding: '16px 32px' }}
              >
                {saving ? <div className="premium-loader" style={{ width: '20px', height: '20px' }}></div> : <Icons.Save />}
                {saving ? 'Synchronizing...' : 'Finalize & Commit'}
              </button>
            )}
          </div>

          {/* Master Class Badge for Teachers */}
          {isTeacher && masterClass && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', marginBottom: '24px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '900', color: '#15803d', margin: 0 }}>Class Master — {masterClass.name} Section {mapSectionName(masterClass.section)}</p>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#4ade80', margin: '2px 0 0' }}>You can view all student marks. You can only edit marks for subjects you personally teach.</p>
              </div>
            </div>
          )}

          {/* Mode Toggle for Class Masters (Admins are forced to overview) */}
          {isTeacher && masterClass && (
            <div style={{ display: 'flex', gap: '0', marginBottom: '32px', background: '#f1f5f9', padding: '6px', borderRadius: '16px', width: 'fit-content' }}>
              {[
                {
                  id: 'entry',
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
                  label: 'Enter Subject Marks'
                },
                {
                  id: 'overview',
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
                  label: 'View Class Overview'
                }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => { setViewMode(mode.id); setStudents([]); setMarks({}); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '800',
                    fontSize: '14px',
                    transition: 'all 0.25s',
                    backgroundColor: viewMode === mode.id ? 'white' : 'transparent',
                    color: viewMode === mode.id ? '#0f172a' : '#64748b',
                    boxShadow: viewMode === mode.id ? '0 2px 12px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {mode.icon}
                  {mode.label}
                </button>
              ))}
            </div>
          )}

          {/* Read-only banner when a non-owned subject is selected */}
          {!canEdit && filters.courseId && viewMode === 'entry' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', marginBottom: '32px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8', margin: 0 }}>
                {isTeacher
                  ? 'View-Only Mode — You are viewing marks as a Class Master. Only the assigned teacher for this subject can modify scores.'
                  : 'View-Only Mode — Only assigned teachers can enter or modify student marks.'}
              </p>
            </div>
          )}


          <div className="glass-card" style={{ padding: '24px', marginBottom: '32px', display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>

            {/* Class Selector — for teachers, choose from all classes they teach */}
            {isTeacher ? (
              <div style={{ flex: '1 1 200px' }}>
                <label className="premium-label">Target Class</label>
                <PremiumSelect
                  name="teachingClass"
                  value={`${filters.grade}|${filters.section}`}
                  onChange={(e) => {
                    const [g, sec] = e.target.value.split('|');
                    setFilters(prev => ({ ...prev, grade: g, section: sec, courseId: '' }));
                    setStudents([]); setMarks({});
                  }}
                  options={teachingClasses.map(tc => {
                    const isHomeroom = masterClass && tc.grade === (masterClass.name || masterClass.grade) && tc.section === masterClass.section;
                    return {
                      value: `${tc.grade}|${tc.section}`,
                      label: tc.label + (isHomeroom ? ' (Homeroom)' : '')
                    };
                  })}
                  placeholder="Select Class"
                />
              </div>
            ) : (
              <div className="responsive-grid-2" style={{ flex: '1 1 350px' }}>
                <div>
                  <label className="premium-label">Academic Grade</label>
                  <PremiumSelect
                    name="grade"
                    value={filters.grade}
                    onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value, courseId: '' }))}
                    options={classes.map(c => ({ value: c.name, label: displayGrade(c.name) }))}
                    placeholder="Select Grade Level"
                  />
                </div>
                <div>
                  <label className="premium-label">Section / Color</label>
                  <PremiumSelect
                    name="section"
                    value={filters.section}
                    onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value, courseId: '' }))}
                    options={[
                      { value: '', label: 'All Sections' },
                      ...availableSections.map(s => ({ value: s.name, label: s.name }))
                    ]}
                    placeholder="Select Section"
                  />
                </div>
              </div>
            )}

            {/* Subject — filtered to courses in the selected class (Entry Mode Only) */}
            {viewMode === 'entry' && (
              <div style={{ flex: '1 1 200px' }}>
                <label className="premium-label">Curriculum Subject</label>
                <PremiumSelect
                  name="courseId"
                  value={filters.courseId}
                  onChange={(e) => setFilters(prev => ({ ...prev, courseId: e.target.value }))}
                  options={courses
                    .filter(c => {
                      if (!filters.grade) return true;
                      const gradeMatch = c.grade === filters.grade || c.grade?.toLowerCase().includes(filters.grade?.toLowerCase());
                      const sectionMatch = !filters.section || c.section === filters.section;
                      return gradeMatch && sectionMatch;
                    })
                    .filter((c, index, self) => index === self.findIndex(t => t.name === c.name))
                    .map(c => ({ value: c.id || c._id, label: c.name }))}
                  placeholder={isTeacher ? 'Select your subject' : 'Select Course'}
                />
              </div>
            )}

            <div style={{ flex: 1 }}>
              <label className="premium-label">Reporting Term</label>
              <PremiumSelect
                name="term"
                value={filters.term}
                onChange={(e) => setFilters(prev => ({ ...prev, term: e.target.value }))}
                options={[
                  { value: '1st', label: 'First Academic Term' },
                  { value: '2nd', label: 'Second Academic Term' },
                  { value: '3rd', label: 'Third Academic Term' }
                ]}
                placeholder="Select Term"
              />
            </div>
            {viewMode === 'entry' && (
              <button
                onClick={loadStudents}
                disabled={loading || !filters.grade || !filters.courseId}
                className="premium-btn-secondary"
                style={{ height: '48px', padding: '0 24px', opacity: (loading || !filters.grade || !filters.courseId) ? 0.6 : 1 }}
              >
                {loading ? <div className="premium-loader" style={{ width: '18px', height: '18px' }}></div> : <Icons.Search />}
                {canEdit ? 'Initialize Sheet' : 'Load Registry'}
              </button>
            )}
          </div>

          {/* Class Overview Mode — load all subjects automatically */}
          {viewMode === 'overview' && (isAdmin || (isTeacher && masterClass)) && (
            <ClassOverviewPanel
              grade={filters.grade}
              section={filters.section}
              term={filters.term}
              settings={settings}
              getGrade={getGrade}
              onTermChange={(t) => setFilters(prev => ({ ...prev, term: t }))}
            />
          )}


          {viewMode === 'entry' && (
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '28px 32px', borderBottom: '1px solid var(--brand-slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                  {students.length > 0 ? `${filters.grade} — ${courses.find(c => c.id === filters.courseId)?.name}` : 'Grade Ledger Matrix'}
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
                  {students.length > 0 
                    ? (canEdit ? `Processing registry for ${students.length} scholars.` : `Viewing live marks for ${students.length} scholars.`)
                    : (canEdit ? 'Synchronize registry to begin evaluation.' : 'Select grade, subject and term, then click Load Registry.')}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {lastUpdated && (
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                    {canEdit ? 'Last saved' : 'Live data as of'}: {lastUpdated.toLocaleTimeString()}
                    {!canEdit && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', marginLeft: '6px', verticalAlign: 'middle' }}></span>}
                  </span>
                )}
                {students.length > 0 && (
                  <button onClick={loadStudents} className="premium-btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                    <Icons.Refresh /> {canEdit ? 'Refresh Registry' : 'Reload'}
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--brand-slate-50)' }}>
                    <th className="premium-th">Scholar Identity</th>
                    <th className="premium-th">Cat1 (25)</th>
                    <th className="premium-th">GW (25)</th>
                    <th className="premium-th">Cat2 (25)</th>
                    <th className="premium-th">PW (25)</th>
                    <th className="premium-th">Exam (100)</th>
                    <th className="premium-th">Aggregate Score (200)</th>
                    <th className="premium-th">Classification</th>
                  </tr>

                </thead>

                <tbody>
                  {students.length > 0 ? students.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((s) => {
                    const sId = s.id || s._id;
                    const total = calculateTotal(sId);
                    const grade = getGrade(total);
                    return (
                      <tr key={sId} className="premium-row" style={{ borderBottom: '1px solid var(--brand-slate-100)' }}>
                        <td style={{ padding: '20px 24px' }}>
                          <p style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>{s.firstName || s.first_name} {s.lastName || s.last_name}</p>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', fontWeight: '600' }}>ID: {s.admissionNumber || s.admission_number}</p>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          {canEdit
                            ? <input type="number" max="25" value={marks[sId]?.cat1 || 0} onChange={(e) => handleMarkChange(sId, 'cat1', e.target.value, 25)} className="premium-input" style={{ width: '70px', textAlign: 'center', fontWeight: '900', fontSize: '16px', color: 'var(--brand-green)', padding: '8px' }} />
                            : <div className="read-only-badge" style={{ backgroundColor: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', display: 'inline-block', fontWeight: '900', color: '#0f172a', border: '1px solid #e2e8f0' }}>{marks[sId]?.cat1 ?? 0}</div>
                          }
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          {canEdit
                            ? <input type="number" max="25" value={marks[sId]?.gw || 0} onChange={(e) => handleMarkChange(sId, 'gw', e.target.value, 25)} className="premium-input" style={{ width: '70px', textAlign: 'center', fontWeight: '900', fontSize: '16px', color: 'var(--brand-green)', padding: '8px' }} />
                            : <div className="read-only-badge" style={{ backgroundColor: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', display: 'inline-block', fontWeight: '900', color: '#0f172a', border: '1px solid #e2e8f0' }}>{marks[sId]?.gw ?? 0}</div>
                          }
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          {canEdit
                            ? <input type="number" max="25" value={marks[sId]?.cat2 || 0} onChange={(e) => handleMarkChange(sId, 'cat2', e.target.value, 25)} className="premium-input" style={{ width: '70px', textAlign: 'center', fontWeight: '900', fontSize: '16px', color: 'var(--brand-green)', padding: '8px' }} />
                            : <div className="read-only-badge" style={{ backgroundColor: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', display: 'inline-block', fontWeight: '900', color: '#0f172a', border: '1px solid #e2e8f0' }}>{marks[sId]?.cat2 ?? 0}</div>
                          }
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          {canEdit
                            ? <input type="number" max="25" value={marks[sId]?.pw || 0} onChange={(e) => handleMarkChange(sId, 'pw', e.target.value, 25)} className="premium-input" style={{ width: '70px', textAlign: 'center', fontWeight: '900', fontSize: '16px', color: 'var(--brand-green)', padding: '8px' }} />
                            : <div className="read-only-badge" style={{ backgroundColor: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', display: 'inline-block', fontWeight: '900', color: '#0f172a', border: '1px solid #e2e8f0' }}>{marks[sId]?.pw ?? 0}</div>
                          }
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          {canEdit
                            ? <input type="number" max="100" value={marks[sId]?.exam || 0} onChange={(e) => handleMarkChange(sId, 'exam', e.target.value, 100)} className="premium-input" style={{ width: '80px', textAlign: 'center', fontWeight: '900', fontSize: '16px', color: 'var(--brand-green)', padding: '8px' }} />
                            : <div className="read-only-badge" style={{ backgroundColor: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', display: 'inline-block', fontWeight: '900', color: '#0f172a', border: '1px solid #e2e8f0' }}>{marks[sId]?.exam ?? 0}</div>
                          }
                        </td>

                        <td style={{ padding: '20px 24px' }}>
                          <p style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{total}</p>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', fontWeight: '600' }}>{Math.round(total / 2)}%</p>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ 
                              padding: '6px 14px', 
                              borderRadius: '12px', 
                              fontSize: '12px', 
                              fontWeight: '900',
                              backgroundColor: total >= 70 ? '#ecfdf5' : total >= 50 ? '#fefce8' : '#fef2f2',
                              color: total >= 70 ? '#10b981' : total >= 50 ? '#ca8a04' : '#ef4444',
                              border: `1px solid ${total >= 70 ? '#d1fae5' : total >= 50 ? '#fef08a' : '#fee2e2'}`
                            }}>{grade}</span>
                            {total >= 40 && <div style={{ color: '#10b981' }}><Icons.Check /></div>}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '120px 40px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--brand-slate-200)', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}><Icons.FileText /></div>
                        <p style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Ledger Uninitialized</p>
                        <p style={{ fontSize: '15px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Configure academic parameters and initialize the sheet to begin data entry.</p>
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>

              {/* Pagination UI */}
              {students.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px', padding: '12px' }}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#1e293b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    Previous
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {Array.from({ length: Math.ceil(students.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: currentPage === page ? '#00843e' : 'transparent', color: currentPage === page ? 'white' : '#64748b', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(students.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(students.length / itemsPerPage)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#1e293b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: currentPage === Math.ceil(students.length / itemsPerPage) ? 0.5 : 1 }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
          )}
      </main>
      <style>{`
        .mini-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input:focus { border-color: #00843e !important; box-shadow: 0 0 0 4px rgba(0, 132, 62, 0.1) !important; outline: none !important; }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(60px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)    scale(1); }
        }
      `}</style>
    </div>
  );
};

// ─── ClassOverviewPanel ────────────────────────────────────────────────────────
const ClassOverviewPanel = ({ grade, section, term, settings, getGrade, onTermChange }) => {
  const [students, setStudents] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]); // ALL subjects for this grade
  const [allMarks, setAllMarks]   = useState({});
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (grade) loadOverview();
  }, [grade, section, term]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const currentYear = settings?.currentSession || '2024/2025';

      // Fetch students + ALL courses for this grade in parallel
      const studentParams = { grade, limit: 'none' };
      if (section) studentParams.section = section;

      const [studentsRes, coursesRes] = await Promise.all([
        studentAPI.getAll(studentParams),
        courseAPI.getAll({ grade })
      ]);

      if (!studentsRes.data.success) return;
      const studentList = studentsRes.data.data;
      setStudents(studentList);

      // Deduplicate courses by name (same subject across sections → one column)
      const rawCourses = coursesRes.data?.data || [];
      const seen = new Set();
      const uniqueSubjects = rawCourses.filter(c => {
        const key = c.name.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setAllSubjects(uniqueSubjects);

      // Collect all unique course IDs grouped by subject name (to merge multi-section grades)
      const subjectGroups = uniqueSubjects.map(sub => ({
        sub,
        ids: rawCourses
          .filter(c => c.name.toLowerCase().trim() === sub.name.toLowerCase().trim())
          .map(c => c.id || c._id)
      }));

      // Fetch grades for every subject group
      const gradeResponses = await Promise.all(
        subjectGroups.map(({ ids }) =>
          Promise.all(
            ids.map(id =>
              gradeAPI.getByCourse(id, { term, academicYear: currentYear })
                .catch(() => ({ data: { data: [] } }))
            )
          )
        )
      );

      // Build marksMap: { studentId: { subjectName: { total } } }
      const marksMap = {};
      studentList.forEach(s => { marksMap[s.id || s._id] = {}; });

      subjectGroups.forEach(({ sub }, sIdx) => {
        const subKey = sub.name.toLowerCase().trim();
        const allRecords = gradeResponses[sIdx].flatMap(r => r.data?.data || []);
        allRecords.forEach(g => {
          const sId = g.student || g.student_id;
          if (!marksMap[sId]) return;
          // Pick the most recently updated entry
          const existing = marksMap[sId][subKey];
          const assessments = g.assessments || [];
          const cat1 = assessments.find(a => a.name === 'Cat1')?.score ?? g.cat1 ?? 0;
          const gw = assessments.find(a => a.name === 'GW')?.score ?? g.gw ?? 0;
          const cat2 = assessments.find(a => a.name === 'Cat2')?.score ?? g.cat2 ?? 0;
          const pw = assessments.find(a => a.name === 'PW')?.score ?? g.pw ?? 0;
          const exam = assessments.find(a => a.name === 'Exam')?.score ?? g.exam ?? 0;
          const total = cat1 + gw + cat2 + pw + exam;
          const ts = new Date(g.updated_at || g.created_at || 0).getTime();
          if (!existing || ts > (existing._ts || 0)) {
            marksMap[sId][subKey] = { total, _ts: ts };
          }
        });
      });
      setAllMarks(marksMap);
    } catch (err) {
      console.error('ClassOverviewPanel error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Term Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <span style={{ fontSize: '13px', fontWeight: '800', color: '#64748b' }}>Reporting Term:</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['1st', '2nd', '3rd'].map(t => (
            <button key={t} onClick={() => onTermChange(t)} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '13px', backgroundColor: term === t ? '#00843e' : '#f1f5f9', color: term === t ? 'white' : '#64748b', transition: 'all 0.2s' }}>{t} Term</button>
          ))}
        </div>
        <button onClick={loadOverview} style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', overflowX: 'auto' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
            {grade} — Section {mapSectionName(section)}
            <span style={{ color: '#64748b', fontWeight: '600', fontSize: '14px', marginLeft: '12px' }}>Full Class Grade Overview ({term} Term)</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
            Read-only view of all {allSubjects.length} subjects for every student in your homeroom.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div className="premium-loader" style={{ margin: '0 auto' }}></div>
            <p style={{ color: '#64748b', marginTop: '16px', fontWeight: '600' }}>Loading class grades...</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${260 + allSubjects.length * 110}px` }}>
            <thead>
              <tr style={{ backgroundColor: '#ffffff' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 1 }}>Scholar</th>
                {allSubjects.map(c => (
                  <th key={c.id || c._id} style={{ padding: '14px 10px', textAlign: 'center', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', minWidth: '100px' }}>
                    {c.name}
                  </th>
                ))}
                <th style={{ padding: '16px 16px', textAlign: 'center', fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', minWidth: '70px' }}>Avg</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={allSubjects.length + 2} style={{ padding: '80px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>No students found for this class.</td></tr>
              ) : students.map((s, idx) => {
                const sId = s.id || s._id;
                const subjectMarks = allMarks[sId] || {};
                const totals = allSubjects.map(c => subjectMarks[c.name.toLowerCase().trim()]?.total ?? null).filter(v => v !== null);
                const avg = totals.length > 0 ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : null;
                return (
                  <tr key={sId} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '14px 24px', position: 'sticky', left: 0, backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa', zIndex: 1 }}>
                      <p style={{ margin: 0, fontWeight: '900', fontSize: '14px', color: '#0f172a' }}>{s.firstName || s.first_name} {s.lastName || s.last_name}</p>
                      <p style={{ margin: '2px 0 0', fontWeight: '600', fontSize: '11px', color: '#94a3b8' }}>{s.admissionNumber || s.admission_number}</p>
                    </td>
                    {allSubjects.map(c => {
                      const key = c.name.toLowerCase().trim();
                      const m = subjectMarks[key];
                      const total = m?.total ?? null;
                      const gradeLabel = total !== null ? getGrade(total) : '—';
                      const color = total !== null ? (total >= 70 ? '#10b981' : total >= 50 ? '#ca8a04' : '#ef4444') : '#94a3b8';
                      return (
                        <td key={c.id || c._id} style={{ padding: '14px 10px', textAlign: 'center' }}>
                          <span style={{ fontWeight: '900', fontSize: '15px', color }}>{total !== null ? total : '—'}</span>
                          {total !== null && <span style={{ display: 'block', fontSize: '10px', fontWeight: '800', color, marginTop: '2px' }}>{gradeLabel}</span>}
                        </td>
                      );
                    })}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {avg !== null
                        ? <span style={{ padding: '5px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '900', backgroundColor: avg >= 70 ? '#ecfdf5' : avg >= 50 ? '#fefce8' : '#fef2f2', color: avg >= 70 ? '#10b981' : avg >= 50 ? '#ca8a04' : '#ef4444' }}>{avg}%</span>
                        : <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MarksEntry;
