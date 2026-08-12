import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseAPI, teacherAPI, studentAPI, parentAPI, academicClassesAPI, academicSectionsAPI, aiAPI, settingsAPI } from '../../services/api';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';
import PremiumSelect from '../../components/common/PremiumSelect';
import { useAlert } from '../../context/AlertContext';
import { mapSectionName } from '../../utils/sectionHelper';
import ReactMarkdown from 'react-markdown';
import './Courses.css';

const normalizeGrade = (g) => {
  if (!g) return '';
  let str = g.toString().toLowerCase().trim();
  if (str.includes('basic 7') || str === 'basic7') return 'jhs1';
  if (str.includes('basic 8') || str === 'basic8') return 'jhs2';
  if (str.includes('basic 9') || str === 'basic9') return 'jhs3';
  if (str.startsWith('basic')) {
    const num = str.replace('basic', '').trim();
    if (['1', '2', '3', '4', '5', '6'].includes(num)) return `primary${num}`;
  }
  return str.replace(/\s+/g, '');
};

const displayGrade = (g) => {
  if (!g) return 'N/A';
  let str = g.toString().trim();
  const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
  if (primaryMatch) return `Basic ${primaryMatch[1]}`;
  return str;
};

const Courses = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { showAlert } = useAlert();
  const [activeMenu, setActiveMenu] = useState('Courses');
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [currentSession, setCurrentSession] = useState('2024-2025');
  const [formData, setFormData] = useState({
    name: '', code: '', description: '', grade: '', section: 'A',
    academicYear: currentSession, teacher: '', credits: 3, hoursPerWeek: 3, room: ''
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'ITSupport' || user?.role === 'admission';
  const isTeacher = user?.role === 'teacher';
  const isParent = user?.role === 'parent';
  const isStudent = user?.role === 'student';

  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [currentCourseStudents, setCurrentCourseStudents] = useState([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [dbGrades, setDbGrades] = useState([]);
  const [uniqueStudentCount, setUniqueStudentCount] = useState(0);

  // AI Lesson Generator State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [selectedAiCourse, setSelectedAiCourse] = useState(null);

  useEffect(() => {
    fetchCourses();
    if (isAdmin) {
      fetchTeachers();
      fetchAcademicMetadata();
      fetchAllSections();
    }
  }, [user, selectedChildId]);

  useEffect(() => {
    if (isParent) {
      parentAPI.getMyChildren().then(res => {
        if (res.data?.success) {
          setLinkedStudents(res.data.data);
          if (res.data.data.length > 0 && !selectedChildId) setSelectedChildId(res.data.data[0].id);
        }
      });
    }
  }, [isParent]);

  const fetchAcademicMetadata = async () => {
    try {
      const gradesRes = await academicClassesAPI.getAll();
      if (gradesRes.data?.success) setDbGrades(gradesRes.data.data);
      
      const settingsRes = await settingsAPI.getSettings().catch(() => null);
      const settingsData = settingsRes?.data?.settings || settingsRes?.data?.data || settingsRes?.data;
      if (settingsData && settingsData.current_session) {
        setCurrentSession(settingsData.current_session);
        setFormData(prev => ({ ...prev, academicYear: settingsData.current_session }));
      }
    } catch (e) {}
  };

  const [allSections, setAllSections] = useState([]);
  const fetchAllSections = async () => {
    try {
      const res = await academicSectionsAPI.getAll();
      if (res.data?.success) setAllSections(res.data.data);
    } catch (e) {}
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      let response;
      const selectedChild = linkedStudents.find(s => s.id === selectedChildId);
      
      if (isStudent && user?.grade) response = await courseAPI.getByGrade(user.grade);
      else if (isTeacher) response = await courseAPI.getAll({ teacher: user?.id || user?.uid });
      else if (isParent && selectedChild) response = await courseAPI.getByGrade(selectedChild.grade);
      else response = await courseAPI.getAll();
      
      let fetched = Array.isArray(response.data) ? response.data : (response.data?.data || []);

      if (isAdmin) {
        const studentRes = await studentAPI.getAll({ limit: 2000 });
        const allStudents = studentRes.data?.data || [];
        setUniqueStudentCount(allStudents.length);
        
        fetched = fetched.map(c => ({
          ...c,
          studentCount: allStudents.filter(s => normalizeGrade(s.grade) === normalizeGrade(c.grade) && (c.section === 'All' || !c.section || s.section === c.section)).length
        }));
      }
      setCourses(fetched);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const fetchTeachers = async () => {
    try {
      const res = await teacherAPI.getAll();
      setTeachers(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (e) {}
  };

  const filteredCourses = courses.filter(c => 
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!filterGrade || c.grade === filterGrade)
  ).filter(c => {
    if (isAdmin || isTeacher) return true;
    if (isParent) {
      const child = linkedStudents.find(s => s.id === selectedChildId);
      if (!child || !child.section) return true;
      return !c.section || c.section === 'All' || c.section === child.section;
    }
    if (isStudent) {
      if (!user?.section) return true;
      return !c.section || c.section === 'All' || c.section === user.section;
    }
    return true;
  });

  const stats = useMemo(() => {
    const uniqueSubjects = new Set(filteredCourses.map(c => `${c.name}-${c.grade}`));
    return {
      total: uniqueSubjects.size,
      totalStudents: uniqueStudentCount,
      activeTeachers: new Set(filteredCourses.map(c => c.teacher_id || (typeof c.teacher === 'string' ? c.teacher : c.teacher?.id)).filter(Boolean)).size
    };
  }, [filteredCourses, uniqueStudentCount]);

  const openModal = (groupedCourse = null) => {
    if (groupedCourse) {
      setEditingCourse(groupedCourse);
      const assignments = {};
      groupedCourse.allocations.forEach(a => {
        assignments[a.section] = a.teacher_id || (typeof a.teacher === 'string' ? a.teacher : a.teacher?.id) || '';
      });
      setFormData({
        name: groupedCourse.name, 
        code: groupedCourse.code, 
        description: groupedCourse.description || '',
        grade: groupedCourse.grade, 
        sectionAssignments: assignments,
        credits: groupedCourse.credits || 3, 
        hoursPerWeek: groupedCourse.hoursPerWeek || 3, 
        room: groupedCourse.room || ''
      });
    } else {
      setEditingCourse(null);
      setFormData({ 
        name: '', code: '', description: '', grade: '', 
        sectionAssignments: {}, 
        credits: 3, hoursPerWeek: 3, room: '' 
      });
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const sectionsForGrade = allSections.filter(s => normalizeGrade(s.class_name || s.grade) === normalizeGrade(formData.grade));
      
      // For each section, update or create allocation
      const promises = sectionsForGrade.map(section => {
        const teacherId = formData.sectionAssignments[section.name] || null;
        const payload = {
          name: formData.name,
          code: formData.code,
          grade: formData.grade,
          section: section.name,
          teacherId: teacherId,
          credits: formData.credits,
          hoursPerWeek: formData.hoursPerWeek,
          room: formData.room
        };

        const existing = editingCourse?.allocations.find(a => a.section === section.name);
        if (existing) return courseAPI.update(existing.id || existing._id, payload);
        return courseAPI.create(payload);
      });

      await Promise.all(promises);
      setShowModal(false);
      fetchCourses();
    } catch (e) { 
      console.error(e);
      showAlert({
        title: 'Allocation Failed',
        message: 'Failed to synchronize subject allocations with the curriculum grid.',
        type: 'error'
      });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    showAlert({
      title: 'Terminate Allocation',
      message: 'Are you sure you want to dissolve this subject-teacher assignment? This will remove the link from the class curriculum.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await courseAPI.delete(id);
          fetchCourses();
        } catch (e) { 
          showAlert({
            title: 'System Error',
            message: 'Failed to delete allocation.',
            type: 'error'
          });
        }
      }
    });
  };

  const viewStudents = async (course) => {
    try {
      setSelectedCourseName(course.name);
      setFetchingStudents(true);
      setShowStudentModal(true);
      const res = await studentAPI.getAll({ grade: course.grade, section: course.section === 'All' ? '' : course.section });
      if (res.data?.success) setCurrentCourseStudents(res.data.data);
    } catch (e) { console.error(e); }
    finally { setFetchingStudents(false); }
  };

  const openAiModal = (course) => {
    setSelectedAiCourse(course);
    setAiTopic('');
    setAiResult('');
    setShowAiModal(true);
  };

  const handleGenerateLesson = async (e) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;
    try {
      setAiGenerating(true);
      const res = await aiAPI.generateLesson({ subject: selectedAiCourse.name, topic: aiTopic });
      if (res.data?.success) {
        setAiResult(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'AI Generation Failed', message: 'Could not connect to the AI service or API key is missing.', type: 'error' });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleLogout = async () => { try { await logout(); } finally { navigate('/login'); } };

  return (
    <div className="courses-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ flex: 1, padding: '24px' }}>
        
        <main>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Institutional Flow</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Academic Hierarchy</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Subject <span style={{ color: 'var(--brand-green)' }}>Allocation</span></h1>
              <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Distribute academic subjects across the institution's curriculum grid.</p>
            </div>
            {isAdmin && (
              <button className="btn-primary" onClick={() => openModal()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Allocate Subject
              </button>
            )}
          </div>

        {/* Stats Dashboard - Matching Academic Classes */}
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label">Allocated Subjects</span>
            <h3 className="stat-value">{stats.total}</h3>
            <div className="stat-bar" style={{ background: 'var(--brand-green)' }}></div>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Enrollment</span>
            <h3 className="stat-value">{stats.totalStudents}</h3>
            <div className="stat-bar" style={{ background: 'var(--brand-blue)' }}></div>
          </div>
          <div className="stat-box">
            <span className="stat-label">Active Educators</span>
            <h3 className="stat-value">{stats.activeTeachers}</h3>
            <div className="stat-bar" style={{ background: 'var(--brand-yellow)' }}></div>
          </div>
        </div>

        {/* Improved Filter Bar */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input 
              type="text" 
              placeholder="Query by subject name or code..." 
              className="premium-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Child Selector for Parents */}
          {isParent && linkedStudents.length > 0 && (
            <div style={{ minWidth: '240px' }}>
              <label className="premium-label">Switch Scholar Profile</label>
              <PremiumSelect 
                label="selectedChildId"
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                options={linkedStudents.map(c => ({
                  value: c.id,
                  label: `${c.firstName} ${c.lastName} (${displayGrade(c.grade)})`
                }))}
              />
            </div>
          )}

          {isAdmin && (
            <div style={{ width: '200px' }}>
              <label className="premium-label">Filter by Class</label>
              <PremiumSelect 
                label="filterGrade"
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                options={dbGrades.map(g => ({ value: g.name, label: displayGrade(g.name) }))}
                placeholder="All Grade Levels"
              />
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}>
            <div className="premium-loader"></div>
            <p style={{ color: 'var(--brand-slate-500)', fontWeight: '600', marginTop: '16px' }}>Synchronizing Curriculum Grid...</p>
          </div>
        ) : (
          <div className="courses-grid">
            {Object.values(filteredCourses.reduce((acc, c) => {
              const key = `${c.name}-${c.grade}`;
              if (!acc[key]) acc[key] = { ...c, allocations: [c] };
              else acc[key].allocations.push(c);
              return acc;
            }, {})).map((groupedCourse) => (
              <div key={groupedCourse._id || groupedCourse.id} className="course-node">
                <div className="node-header">
                  <div className="node-icon">{groupedCourse.name.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <h3 className="node-title">{groupedCourse.name}</h3>
                    <div className="node-tag">{groupedCourse.code} • {displayGrade(groupedCourse.grade)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div className="session-badge">{groupedCourse.academic_year || currentSession}</div>
                    <div className="credit-badge">{groupedCourse.credits || 3} Units</div>
                  </div>
                </div>

                <div className="node-content">
                  <div className="segment">
                    <span className="segment-label">Divisional Assignments</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {groupedCourse.allocations.map(a => (
                        <div key={a.id} className="allocation-row" style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '12px 16px', 
                          background: 'white', 
                          borderRadius: '16px',
                          border: '1px solid var(--brand-slate-100)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Section {mapSectionName(a.section)}</span>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                              {a.teacher ? `${a.teacher.firstName || a.teacher.first_name} ${a.teacher.lastName || a.teacher.last_name}` : 'Unassigned'}
                            </span>
                          </div>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '10px', 
                            backgroundColor: a.teacher ? 'var(--brand-green)' : '#f1f5f9',
                            color: a.teacher ? 'white' : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: '900'
                          }}>
                            {a.teacher ? `${a.teacher.firstName?.[0]}${a.teacher.lastName?.[0]}` : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="segment">
                    <span className="segment-label">Logistics Node</span>
                    <div className="pill-list">
                      <span className="glass-pill pill-room">Room: {groupedCourse.room || 'TBD'}</span>
                      <span className="glass-pill pill-hours">{groupedCourse.hoursPerWeek || 4} Hrs/Wk</span>
                    </div>
                  </div>
                </div>

                <div className="node-actions">
                  {isAdmin && (
                    <>
                      <button className="action-btn" onClick={() => openModal(groupedCourse)}>Configure Assignments</button>
                      <button className="action-btn action-btn-danger" onClick={() => handleDelete(groupedCourse._id || groupedCourse.id)}>Delete</button>
                    </>
                  )}
                  {isTeacher && (
                    <button className="action-btn" onClick={() => openAiModal(groupedCourse)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      Generate Lesson
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </main>

      {/* Allocation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">{editingCourse ? 'Update' : 'New'} Allocation</h2>
            <p className="modal-subtitle">Define subject parameters and educator assignments.</p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="premium-label">Subject Name</label>
                <input name="name" className="premium-input" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label className="premium-label">Code</label>
                  <input name="code" className="premium-input" value={formData.code} onChange={handleInputChange} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="premium-label">Academic Level</label>
                  <PremiumSelect 
                    label="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    options={dbGrades.map(g => ({ value: g.name, label: displayGrade(g.name) }))}
                    placeholder="Select Grade"
                  />
                </div>
              </div>
              <div style={{ maxHeight: '30vh', overflowY: 'auto', padding: '16px', background: 'var(--brand-slate-50)', borderRadius: '20px' }}>
                <label className="premium-label" style={{ marginBottom: '16px' }}>Section Assignments</label>
                {allSections.filter(s => normalizeGrade(s.class_name || s.grade) === normalizeGrade(formData.grade)).length > 0 ? (
                  allSections.filter(s => normalizeGrade(s.class_name || s.grade) === normalizeGrade(formData.grade)).map(section => (
                    <div key={section.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '13px' }}>Section {mapSectionName(section.name)}</span>
                      <PremiumSelect 
                        label={section.name}
                        value={formData.sectionAssignments[section.name] || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          sectionAssignments: { ...prev.sectionAssignments, [section.name]: e.target.value } 
                        }))}
                        options={teachers.map(t => ({ value: t.id || t._id, label: `${t.firstName || t.first_name} ${t.lastName || t.last_name}` }))}
                        placeholder="Select Teacher"
                      />
                    </div>
                  ))
                ) : <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>{formData.grade ? 'No divisions found for this grade' : 'Select a grade to see sections'}</p>}
              </div>
              <div className="responsive-grid-2" style={{ marginBottom: '24px' }}>
                <div>
                  <label className="premium-label">Credits / Units</label>
                  <input name="credits" type="number" className="premium-input" value={formData.credits} onChange={handleInputChange} required />
                </div>
                <div>
                  <label className="premium-label">Weekly Hours</label>
                  <input name="hoursPerWeek" type="number" className="premium-input" value={formData.hoursPerWeek} onChange={handleInputChange} required />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="premium-label">Logistics Node (Room)</label>
                <input name="room" className="premium-input" placeholder="e.g. Science Lab B" value={formData.room} onChange={handleInputChange} />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingCourse ? 'Commit Changes' : 'Initialize Allocation'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster Modal */}
      {showStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <h2 className="modal-title">Scholar Roster</h2>
            <p className="modal-subtitle">Enrolled students for {selectedCourseName}</p>
            
            <div style={{ marginTop: '24px', maxHeight: '50vh', overflowY: 'auto' }}>
              {fetchingStudents ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><div className="premium-loader"></div></div>
              ) : currentCourseStudents.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left' }}>
                      <th style={{ padding: '12px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Identity</th>
                      <th style={{ padding: '12px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Grade</th>
                      <th style={{ padding: '12px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCourseStudents.map(s => (
                      <tr key={s.id || s._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: '700', color: '#1e293b' }}>{s.firstName || s.first_name} {s.lastName || s.last_name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.admission_number || s.id?.substring(0, 8)}</div>
                        </td>
                        <td style={{ padding: '12px' }}>{displayGrade(s.grade)}</td>
                        <td style={{ padding: '12px' }}>{mapSectionName(s.section || 'A')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No scholars found.</p>
              )}
            </div>
            <button onClick={() => setShowStudentModal(false)} className="btn-secondary" style={{ width: '100%', marginTop: '32px' }}>Dismiss</button>
          </div>
        </div>
      )}

      {/* AI Lesson Generator Modal */}
      {showAiModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: aiResult ? '800px' : '500px', transition: 'max-width 0.3s ease' }}>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-yellow)" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              Generate Lesson Plan (GES)
            </h2>
            <p className="modal-subtitle">AI-assisted lesson planning for {selectedAiCourse?.name}</p>
            
            {!aiResult ? (
              <form onSubmit={handleGenerateLesson} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
                <div>
                  <label className="premium-label">Lesson Topic</label>
                  <input 
                    type="text" 
                    className="premium-input" 
                    placeholder="e.g. Fractions and Decimals" 
                    value={aiTopic} 
                    onChange={e => setAiTopic(e.target.value)} 
                    required 
                  />
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={aiGenerating}>
                    {aiGenerating ? 'Generating...' : 'Generate Plan'}
                  </button>
                  <button type="button" onClick={() => setShowAiModal(false)} className="btn-secondary" disabled={aiGenerating}>Cancel</button>
                </div>
              </form>
            ) : (
              <div style={{ marginTop: '24px' }}>
                <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div className="markdown-content">
                    <ReactMarkdown>{aiResult}</ReactMarkdown>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                  <button onClick={() => {
                    navigator.clipboard.writeText(aiResult);
                    showAlert({ title: 'Copied', message: 'Lesson plan copied to clipboard.', type: 'success' });
                  }} className="btn-primary" style={{ flex: 1 }}>Copy to Clipboard</button>
                  <button onClick={() => setShowAiModal(false)} className="btn-secondary">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Courses;
