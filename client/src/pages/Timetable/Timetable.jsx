import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { timetableAPI, teacherAPI, courseAPI, parentAPI, academicSubjectsAPI, settingsAPI } from '../../services/api';
import PremiumSelect from '../../components/common/PremiumSelect';
import { useAlert } from '../../context/AlertContext';
import { mapSectionName } from '../../utils/sectionHelper';

const displayGrade = (g) => {
  if (!g) return 'N/A';
  let str = g.toString().trim();
  const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
  if (primaryMatch) return `Basic ${primaryMatch[1]}`;
  return str;
};

import './Timetable.css';

const DEFAULT_PERIODS = [
  { period: 0, time: '07:30 - 08:10', name: 'Morning Assembly', isBreak: true },
  { period: 1, time: '08:10 - 08:55', name: 'Period 1' },
  { period: 2, time: '08:55 - 09:40', name: 'Period 2' },
  { period: 3, time: '09:40 - 10:10', name: 'Break', isBreak: true },
  { period: 4, time: '10:10 - 10:55', name: 'Period 3' },
  { period: 5, time: '10:55 - 11:40', name: 'Period 4' },
  { period: 6, time: '11:40 - 12:10', name: 'Break', isBreak: true },
  { period: 7, time: '12:10 - 12:55', name: 'Period 5' },
  { period: 8, time: '12:55 - 13:40', name: 'Period 6' },
  { period: 9, time: '13:40 - 14:25', name: 'Period 7' },
  { period: 10, time: '14:25 - 15:00', name: 'Dismissal', isBreak: true },
];

const Timetable = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { showAlert } = useAlert();
  const [activeMenu, setActiveMenu] = useState('Timetable');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(user?.role === 'teacher' ? 'teacher' : 'class');
  const [timetable, setTimetable] = useState(null);
  const [timetableId, setTimetableId] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [courses, setCourses] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [storedUser, setStoredUser] = useState(null);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [allSubjects, setAllSubjects] = useState([]);

  const isAdmin = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'ITSupport';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';
  const canEdit = isAdmin || isTeacher;

  const grades = ['KG 1', 'KG 2', 'KG 3', 'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'Basic 7', 'Basic 8', 'Basic 9'];
  const sections = ['A', 'B', 'C', 'D'];
  
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [currentSession, setCurrentSession] = useState('2024-2025');
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  
  const isWeekend = () => {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  };
  const isTodayWeekend = isWeekend();
  const [editingPeriods, setEditingPeriods] = useState([]);

  const [subjects, setSubjects] = useState([]);

  const selectedClass = (selectedGrade && selectedSection) ? `${selectedGrade}${selectedSection}` : null;

  useEffect(() => {
    const fetchLinkedStudents = async () => {
      if (isParent) {
        try {
          const res = await parentAPI.getMyChildren();
          if (res.data?.success) {
            setLinkedStudents(res.data.data);
            if (res.data.data.length > 0 && !selectedChild) {
              setSelectedChild(res.data.data[0]);
            }
          }
        } catch (error) {
          console.error('Error fetching linked students:', error);
        }
      }
    };
    
    fetchLinkedStudents();
    
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setStoredUser(parsed);
      } catch (e) {}
    }

    settingsAPI.getSettings().then(res => {
      const data = res?.data?.settings || res?.data?.data || res?.data;
      if (data && data.current_session) setCurrentSession(data.current_session);
    }).catch(() => {});
  }, [user, isParent]);

  useEffect(() => {
    const userGrade = user?.grade;
    const userSection = user?.section;
    
    if (isTeacher && userGrade && !selectedGrade) {
      setSelectedGrade(userGrade || '');
      setSelectedSection(userSection || 'A');
    }
    if (isStudent && userGrade) {
      setSelectedGrade(userGrade || '');
      setSelectedSection(userSection || 'A');
    }
    if (isParent && selectedChild) {
      const g = selectedChild.grade || '';
      const s = selectedChild.section || 'A';
      if (selectedGrade !== g || selectedSection !== s) {
        setSelectedGrade(g);
        setSelectedSection(s);
      }
    }

    if (user && viewMode === 'class' && isTeacher) {
      setViewMode('teacher');
    }
  }, [isTeacher, isStudent, isParent, user, selectedChild]);

  const currentViewMode = viewMode;
  
  const getClassToFetch = () => {
    if (isParent && selectedChild) {
      return `${selectedChild.grade}${selectedChild.section}`;
    }
    return selectedClass;
  };
  
  useEffect(() => {
    if (currentViewMode === 'teacher' || (selectedGrade && selectedSection)) {
      fetchData();
    }
  }, [selectedGrade, selectedSection, currentViewMode, selectedChild, selectedTeacherId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const classToFetch = getClassToFetch();
      
      const promises = [
        currentViewMode === 'class' 
          ? timetableAPI.getByClass(classToFetch) 
          : timetableAPI.getByTeacher(isAdmin && selectedTeacherId ? selectedTeacherId : (user?.id || user?.uid))
      ];

      // Only fetch these if not already loaded or if needed
      const fetchTeachers = teachers.length === 0;
      const fetchCoursesList = true; // Courses might depend on selectedGrade
      const fetchSubjects = allSubjects.length === 0;
      const fetchConfig = true; // Always fetch or check config to stay in sync

      if (fetchTeachers) promises.push(teacherAPI.getAll());
      if (fetchCoursesList) promises.push(courseAPI.getAll({ grade: selectedGrade, academicYear: currentSession }));
      if (fetchSubjects) promises.push(academicSubjectsAPI.getAll());
      if (fetchConfig) promises.push(timetableAPI.getByClass('CONFIGURATION'));

      const results = await Promise.allSettled(promises);
      
      // Index 0 is always the timetable
      const timetableRes = results[0];
      if (timetableRes.status === 'fulfilled' && timetableRes.value?.data?.data) {
        const ttData = timetableRes.value.data.data;
        if (currentViewMode === 'teacher' && Array.isArray(ttData)) {
          const teacherSchedule = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] };
          ttData.forEach(p => {
            if (teacherSchedule[p.day]) {
              teacherSchedule[p.day].push({ ...p, subject: p.subject || p.course_name, room: `${p.grade} - ${mapSectionName(p.section || 'A')}${p.room ? ` (${p.room})` : ''}` });
            }
          });
          setTimetable(teacherSchedule);
        } else {
          if (ttData.id) setTimetableId(ttData.id);
          setTimetable(ttData.schedule || { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] });
        }
      } else {
        setTimetable({ Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] });
      }

      // Handle other results based on what was pushed
      let currentIdx = 1;
      if (fetchTeachers) {
        const res = results[currentIdx++];
        if (res?.status === 'fulfilled' && res.value?.data?.data) setTeachers(res.value.data.data);
      }
      if (fetchCoursesList) {
        const res = results[currentIdx++];
        if (res?.status === 'fulfilled' && res.value?.data?.data) {
          const allFetched = res.value.data.data;
          const unique = [];
          const seen = new Set();
          allFetched.forEach(c => {
            const key = `${c.name}-${c.code}`;
            if (!seen.has(key)) { seen.add(key); unique.push(c); }
          });
          setCourses(unique);
        }
      }
      if (fetchSubjects) {
        const res = results[currentIdx++];
        if (res?.status === 'fulfilled' && res.value?.data?.data) {
          setAllSubjects(res.value.data.data);
          setSubjects(res.value.data.data.map(s => s.name));
        }
      }
      if (fetchConfig) {
        const res = results[currentIdx++];
        if (res?.status === 'fulfilled' && res.value?.data?.data?.schedule?.periods) {
          let fetchedPeriods = res.value.data.data.schedule.periods.map(p => ({
            ...p,
            name: p.name || '',
            time: p.time || (p.startTime && p.endTime ? `${p.startTime} - ${p.endTime}` : '')
          }));
          
          // Check if the fetched periods are effectively empty/placeholders
          const isMostlyEmpty = fetchedPeriods.length === 0 || fetchedPeriods.every(p => !p.name);
          if (isMostlyEmpty) {
            fetchedPeriods = [...DEFAULT_PERIODS];
          }
          
          setPeriods(fetchedPeriods);
        }
      }

    } catch (error) {
      console.error('Error fetching timetable:', error);
      setTimetable({ Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      sessionStorage.removeItem('authToken');
      navigate('/login');
    }
  };

  const getSubjectColor = (subject) => {
    const colors = {
      Mathematics: '#059669',
      English: '#d97706',
      Science: '#ea580c',
      'Social Studies': '#7c3aed',
      ICT: '#0891b2',
      'Religious Studies': '#c026d3',
      French: '#db2777',
      'Creative Arts': '#ec4899',
      'Physical Education': '#16a34a',
      'Home Economics': '#ca8a04',
      Music: '#9333ea',
      Assembly: '#64748b',
      Break: '#94a3b8',
    };
    return colors[subject] || '#64748b';
  };

  const getPeriodData = (day, periodNum) => {
    const daySchedule = timetable?.[day] || [];
    return daySchedule.find(p => p.period === periodNum);
  };

  const openEditModal = (day, period) => {
    if (!canEdit) return;
    const existingData = getPeriodData(day, period);
    setEditingCell({ 
      day, 
      period, 
      existingData, 
      subject: existingData?.subjectId || existingData?.subject || '', 
      teacherId: existingData?.teacherId || '', 
      teacher: existingData?.teacher || '', 
      room: existingData?.room || '' 
    });
    setEditModalOpen(true);
  };

  const handleSavePeriod = async () => {
    if (!editingCell?.subject) return;
    try {
      setSaving(true);
      const currentTimetable = timetable || {
        Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
      };
      const daySchedule = currentTimetable[editingCell.day] || [];
      const updatedSchedule = { ...currentTimetable };
      
      const newPeriod = {
        period: editingCell.period,
        subjectId: editingCell.subject, 
        subject: getCourseName(editingCell.subject), 
        teacher: editingCell.teacher,
        teacherId: editingCell.teacherId,
        room: editingCell.room,
        startTime: periods.find(p => p.period === editingCell.period)?.time?.split(' - ')[0] || '',
        endTime: periods.find(p => p.period === editingCell.period)?.time?.split(' - ')[1] || ''
      };

      const periodIndex = daySchedule.findIndex(p => p.period === editingCell.period);
      if (periodIndex >= 0) {
        daySchedule[periodIndex] = newPeriod;
      } else {
        daySchedule.push(newPeriod);
      }
      daySchedule.sort((a, b) => a.period - b.period);
      updatedSchedule[editingCell.day] = daySchedule;

      let finalPeriods = [...(updatedSchedule.Monday || []), ...(updatedSchedule.Periods || [])].sort((a, b) => a.period - b.period);
      if (selectedClass === 'CONFIGURATION' && finalPeriods.length === 0) {
        finalPeriods = DEFAULT_PERIODS.map(p => ({
          ...p,
          startTime: p.startTime || p.time?.split(' - ')[0] || '',
          endTime: p.endTime || p.time?.split(' - ')[1] || '',
          time: p.time || `${p.startTime} - ${p.endTime}`
        }));
      }

      if (timetableId) {
        await timetableAPI.update(timetableId, { class: selectedClass, grade: selectedGrade, section: selectedSection, schedule: updatedSchedule });
      } else {
        const result = await timetableAPI.create({ class: selectedClass, grade: selectedGrade, section: selectedSection, schedule: updatedSchedule });
        if (result.data?.data?.id) {
          setTimetableId(result.data.data.id);
        }
      }
      
      setTimetable(updatedSchedule);
      setEditModalOpen(false);
      setEditingCell(null);
    } catch (error) {
      showAlert({
        title: 'Temporal Error',
        message: 'Failed to save period. Please verify connectivity.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInitializeFromSchema = async () => {
    if (!selectedGrade || !selectedSection) {
      showAlert({
        title: 'Configuration Error',
        message: 'Please select a specific grade and section node first.',
        type: 'warning'
      });
      return;
    }

    showAlert({
      title: 'Initialize Chronos Matrix',
      message: `Initialize ${selectedGrade}${selectedSection} timetable from default schema? This will set up the institutional time slots.`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          setSaving(true);
          const configRes = await timetableAPI.getByClass('CONFIGURATION');
          const configPeriods = configRes.data?.data?.schedule?.periods || DEFAULT_PERIODS;
          
          const newSchedule = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] };
          
          configPeriods.forEach(p => {
            if (p.isBreak) {
              days.forEach(day => {
                newSchedule[day].push({
                  period: p.period,
                  subject: p.name,
                  isBreak: true,
                  startTime: p.startTime || p.time?.split(' - ')[0] || '',
                  endTime: p.endTime || p.time?.split(' - ')[1] || ''
                });
              });
            }
          });

          await timetableAPI.create({ 
            class: selectedClass, 
            grade: selectedGrade, 
            section: selectedSection, 
            schedule: newSchedule 
          });

          fetchData();
          showAlert({
            title: 'Synchronization Complete',
            message: 'Timetable initialized with institutional schema breaks and periods.',
            type: 'success'
          });
        } catch (error) {
          showAlert({
            title: 'System Failure',
            message: 'Failed to initialize temporal nodes.',
            type: 'error'
          });
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleRemovePeriod = async () => {
    if (!editingCell || !timetableId) return;
    try {
      setSaving(true);
      const currentTimetable = timetable || {
        Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
      };
      const updatedSchedule = { ...currentTimetable };
      updatedSchedule[editingCell.day] = (currentTimetable[editingCell.day] || []).filter(p => p.period !== editingCell.period);
      
      await timetableAPI.update(timetableId, { class: selectedClass, grade: selectedGrade, section: selectedSection, schedule: updatedSchedule });
      setTimetable(updatedSchedule);
      setEditModalOpen(false);
      setEditingCell(null);
    } catch (error) {
      console.error('Error removing period:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetTimetable = async () => {
    const classLabel = viewMode === 'class' ? `${selectedGrade} Section ${mapSectionName(selectedSection)}` : 'selected faculty';
    
    showAlert({
      title: 'Confirm Temporal Purge',
      message: `Are you sure you want to purge the ${classLabel} timetable? This action is permanent.`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          setResetting(true);
          if (viewMode === 'class' && selectedGrade && selectedSection) {
            const idToDelete = `${selectedGrade}-${selectedSection}`;
            await timetableAPI.delete(idToDelete);
          } else {
            await timetableAPI.delete(timetableId);
          }
          await fetchData();
          setTimetableId(null);
          showAlert({
            title: 'Purge Successful',
            message: 'Timetable has been purged and synchronized.',
            type: 'success'
          });
        } catch (error) {
          showAlert({
            title: 'Purge Failed',
            message: 'Failed to purge timetable records.',
            type: 'error'
          });
        } finally {
          setResetting(false);
        }
      }
    });
  };

  const handleTeacherSelect = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId || t._id === teacherId);
    if (teacher) {
      const name = `${teacher.firstName || teacher.first_name || ''} ${teacher.lastName || teacher.last_name || ''}`.trim();
      setEditingCell(prev => ({ ...prev, teacherId, teacher: name }));
    } else {
      setEditingCell(prev => ({ ...prev, teacherId, teacher: '' }));
    }
  };

  const handleSavePeriods = async () => {
    try {
      setSaving(true);
      const configData = {
        class: 'CONFIGURATION',
        grade: 'SYSTEM',
        section: 'CONFIG',
        schedule: { periods: editingPeriods }
      };

      const periodRes = await timetableAPI.getByClass('CONFIGURATION');
      if (periodRes.data?.data?.id) {
        await timetableAPI.update(periodRes.data.data.id, configData);
      } else {
        await timetableAPI.create(configData);
      }

      setPeriods(editingPeriods);
      setPeriodModalOpen(false);
      await fetchData();
      showAlert({
        title: 'Axis Synchronized',
        message: 'Period schema synchronized successfully.',
        type: 'success'
      });
    } catch (error) {
      showAlert({
        title: 'Save Failed',
        message: 'Failed to save period schema.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const isPeriodActive = (timeRange) => {
    if (isTodayWeekend) return false;
    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const parts = timeRange.split(/\s*-\s*/);
      if (parts.length < 2) return false;
      const [start, end] = parts;
      
      const parseTime = (t) => {
        const [hours, minutes] = t.split(':').map(Number);
        return hours * 60 + minutes;
      };

      return currentMinutes >= parseTime(start) && currentMinutes <= parseTime(end);
    } catch (e) {
      return false;
    }
  };

  const getCourseName = (courseIdOrName) => {
    if (!courseIdOrName) return '';
    const course = courses.find(c => c.id === courseIdOrName || c._id === courseIdOrName || c.name === courseIdOrName);
    if (course) return course.name;
    const subject = allSubjects.find(s => s.id === courseIdOrName || s._id === courseIdOrName || s.name === courseIdOrName);
    return subject ? subject.name : courseIdOrName;
  };

  const getDailyProgress = () => {
    if (isTodayWeekend) return 0;
    try {
      if (!periods || periods.length === 0) return 0;
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const dayStart = periods[0].time.split(' - ')[0];
      const dayEnd = periods[periods.length - 1].time.split(' - ')[1];
      const parseTime = (t) => {
        const [hours, minutes] = t.split(':').map(Number);
        return hours * 60 + minutes;
      };
      const start = parseTime(dayStart);
      const end = parseTime(dayEnd);
      if (currentMinutes < start) return 0;
      if (currentMinutes > end) return 100;
      return Math.round(((currentMinutes - start) / (end - start)) * 100);
    } catch (e) {
      return 0;
    }
  };

  const currentPeriod = periods.find(p => isPeriodActive(p.time));
  const dailyProgress = getDailyProgress();
  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

  const getNextPeriod = () => {
    if (isTodayWeekend || !periods || periods.length === 0) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    return periods.find(p => {
      const parts = p.time.split(/\s*-\s*/);
      if (parts.length < 2) return null;
      const [start] = parts;
      const [hours, minutes] = start.split(':').map(Number);
      return (hours * 60 + minutes) > currentMinutes;
    });
  };

  const nextPeriod = getNextPeriod();

  return (
    <div className="timetable-module-content">
      <main>
          <div className="timetable-header">
            <div>
              <div className="badge-academic">Temporal Flow Alpha</div>
              <h1 className="timetable-title">
                {isParent && selectedChild ? (
                  <>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: 'var(--chronos-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Scholar Perspective</span>
                    {selectedChild.firstName} {selectedChild.lastName}'s <span>Temporal Matrix</span>
                  </>
                ) : isStudent ? (
                  <>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: 'var(--chronos-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Personal Learning Axis</span>
                     {displayGrade(user?.grade)}{mapSectionName(user?.section)} <span>Chronos Node</span>
                  </>
                ) : isTeacher ? (
                  <>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: 'var(--chronos-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Faculty Teaching Spectrum</span>
                    My <span>Temporal Schedule</span>
                  </>
                ) : (
                  <>Institutional <span>Chronos Matrix</span></>
                )}
              </h1>
              <p className="timetable-subtitle">
                {isStudent ? 'Your personalized academic timeline for the current term.' : 
                 isTeacher ? 'Your assigned teaching periods and classroom allocations.' :
                 'Synchronization of academic temporal nodes and faculty allocations across the institutional spectrum.'}
              </p>
            </div>

            {isTodayWeekend && (
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '24px',
                padding: '20px 32px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                animation: 'chronosSlideUp 0.6s ease-out forwards',
                boxShadow: '0 10px 30px rgba(217, 119, 6, 0.08)'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#f59e0b',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#92400e', textTransform: 'uppercase', letterSpacing: '1px' }}>Weekend Mode Active</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: '600', color: '#b45309' }}>The institutional chronos matrix is currently off-cycle. Systems will resume normal temporal flow on Monday.</p>
                </div>
              </div>
            )}
          </div>

          <div className="responsive-grid-3" style={{ marginBottom: '40px' }}>
            <div className="stat-box">
              <span className="stat-label">Active Temporal State</span>
              <h3 className="stat-value">{currentPeriod ? currentPeriod.name : 'Off-Cycle'}</h3>
              <div className="stat-bar" style={{ background: 'var(--chronos-primary)' }}></div>
            </div>
            
            <div className="stat-box">
              <span className="stat-label">Daily Cycle Completion</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <h3 className="stat-value">{dailyProgress}%</h3>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--chronos-primary)' }}>Synchronized</span>
              </div>
              <div className="stat-bar" style={{ background: 'var(--chronos-primary)' }}></div>
            </div>

            <div className="stat-box">
              <span className="stat-label">Next Temporal Node</span>
              <h3 className="stat-value">{nextPeriod ? nextPeriod.name : 'Cycle End'}</h3>
              <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--chronos-text-muted)' }}>
                {nextPeriod ? `Commencing at ${nextPeriod.time.split(/\s*-\s*/)[0]}` : 'Institutional shutdown'}
              </div>
              <div className="stat-bar" style={{ background: 'var(--chronos-accent)' }}></div>
            </div>
          </div>

          {(isAdmin || isParent || canEdit) && (
            <div className="control-deck">
              {isAdmin && (
                <div className="control-item">
                  <span className="premium-label">Perspective Shift</span>
                  <div className="perspective-toggle">
                    <button onClick={() => setViewMode('class')} className={`perspective-btn ${viewMode === 'class' ? 'active' : ''}`}>Class Matrix</button>
                    <button onClick={() => setViewMode('teacher')} className={`perspective-btn ${viewMode === 'teacher' ? 'active' : ''}`}>Faculty Node</button>
                  </div>
                </div>
              )}

              {isParent && linkedStudents.length > 0 && (
                <div className="control-item" style={{ minWidth: '240px' }}>
                  <label className="premium-label">Scholar Identity</label>
                  <PremiumSelect 
                    value={selectedChild?.id || selectedChild?._id || ''} 
                    onChange={(e) => {
                      const child = linkedStudents.find(c => c.id === e.target.value || c._id === e.target.value);
                      setSelectedChild(child);
                    }}
                    options={linkedStudents.map(c => ({
                      value: c.id || c._id,
                      label: `${c.firstName} ${c.lastName} (${c.grade})`
                    }))}
                    placeholder="Scholar Identity"
                  />
                </div>
              )}

              {isAdmin && viewMode === 'class' && (
                <>
                  <div className="control-item" style={{ minWidth: '180px' }}>
                    <label className="premium-label">Academic Level</label>
                    <PremiumSelect 
                      value={selectedGrade || ''} 
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      options={grades.map(g => ({ value: g, label: g }))}
                      placeholder="Select Level"
                    />
                  </div>
                  <div className="control-item" style={{ minWidth: '120px' }}>
                    <label className="premium-label">Stream</label>
                    <PremiumSelect 
                      value={selectedSection || ''} 
                      onChange={(e) => setSelectedSection(e.target.value)}
                      options={sections.map(s => ({ value: s, label: mapSectionName(s) }))}
                      placeholder="Select Node"
                    />
                  </div>
                </>
              )}

              {isAdmin && viewMode === 'teacher' && (
                <div className="control-item" style={{ minWidth: '240px' }}>
                  <label className="premium-label">Faculty Identity</label>
                  <PremiumSelect 
                    value={selectedTeacherId} 
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    options={teachers.map(t => ({
                      value: t.id || t._id,
                      label: `${t.firstName || t.first_name} ${t.lastName || t.last_name}`
                    }))}
                    placeholder="Select Faculty"
                  />
                </div>
              )}

              <div style={{ flex: 1 }}></div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {isAdmin && (
                  <>
                    <button 
                      onClick={() => { 
                        const initialPeriods = (periods && periods.length > 0) ? [...periods] : [...DEFAULT_PERIODS];
                        setEditingPeriods(initialPeriods); 
                        setPeriodModalOpen(true); 
                      }} 
                      style={{ padding: '12px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: 'var(--chronos-text-muted)', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                      Config Axis
                    </button>
                    {!timetableId && viewMode === 'class' && selectedGrade && selectedSection && (
                       <button onClick={handleInitializeFromSchema} disabled={saving} className="premium-btn-secondary" style={{ padding: '12px 20px', borderRadius: '16px', fontSize: '13px', fontWeight: '800' }}>
                          {saving ? 'Initializing...' : 'Initialize Schema'}
                       </button>
                    )}
                  </>
                )}
                {(isAdmin || isTeacher) && (
                  <button onClick={fetchData} disabled={isTodayWeekend} className="premium-btn-primary" style={{ padding: '12px 24px', height: 'auto', opacity: isTodayWeekend ? 0.6 : 1, cursor: isTodayWeekend ? 'not-allowed' : 'pointer' }}>Sync Matrix</button>
                )}
                {isAdmin && timetableId && (
                  <button onClick={handleResetTimetable} disabled={resetting} style={{ padding: '12px 20px', borderRadius: '16px', border: 'none', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '13px', fontWeight: '800', cursor: resetting ? 'not-allowed' : 'pointer' }}>{resetting ? 'Purging...' : 'Purge'}</button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--chronos-glass)', borderRadius: '40px', border: '1px solid var(--chronos-glass-border)' }}>
              <div className="premium-loader"></div>
            </div>
          ) : (
            <div className="timetable-grid-wrapper">
              <div className="day-headers">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingLeft: '20px' }}>
                  <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--chronos-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 12px 24px rgba(0, 132, 62, 0.25)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--chronos-text-muted)', textTransform: 'uppercase', letterSpacing: '2px', display: 'block' }}>Chronos</span>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--chronos-text-main)' }}>Axis</span>
                  </div>
                </div>
                {days.map(day => (
                  <div key={day} className={`day-header-card ${todayName === day ? 'is-today' : ''}`}>{day}</div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {periods.map((period, pIndex) => {
                  const active = isPeriodActive(period.time);
                  return (
                    <div key={period.period} className="temporal-row" style={{ 
                      animation: `chronosSlideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards ${pIndex * 0.05}s`,
                      opacity: 0
                    }}>
                      <div className="time-marker">
                        <div className="time-labels">
                          <div className="time-start" style={{ color: active ? 'var(--chronos-primary)' : 'var(--chronos-text-main)' }}>{period.time.split(' - ')[0]}</div>
                          <div className="time-end">{period.time.split(' - ')[1]}</div>
                          <div className="time-duration">
                            {(() => {
                              try {
                                const t = period.time || `${period.startTime || ''} - ${period.endTime || ''}`;
                                if (!t || t === ' - ') return '';
                                const parts = t.split(/\s*-\s*/);
                                if (parts.length < 2) return '';
                                const [s, e] = parts;
                                const pt = (timeStr) => { 
                                  if (!timeStr) return 0;
                                  const bits = timeStr.trim().split(':').map(Number);
                                  if (bits.length < 2 || isNaN(bits[0])) return 0;
                                  return bits[0] * 60 + (bits[1] || 0);
                                };
                                const startMin = pt(s);
                                const endMin = pt(e);
                                if (startMin === 0 && endMin === 0) return '';
                                const diff = endMin - startMin;
                                return diff > 0 ? `${diff}m` : '';
                              } catch { return ''; }
                            })()}
                          </div>
                        </div>
                        <div className="axis-node">
                          <div className={`axis-dot ${active ? 'active' : ''}`}></div>
                          <div className="axis-line"></div>
                        </div>
                      </div>

                      {days.map(day => {
                        const periodData = getPeriodData(day, period.period);
                        const isBreak = period.isBreak || periodData?.isBreak;
                        const subjectName = periodData ? getCourseName(periodData.subject) : (isBreak ? period.name : '');
                        const color = getSubjectColor(subjectName);
                        
                        return (
                          <div 
                            key={day} 
                            className={`period-card-premium ${isBreak ? 'is-break' : ''} ${active && !isBreak && periodData ? 'is-active' : ''}`}
                            style={{ 
                              cursor: canEdit && !isBreak ? 'pointer' : 'default',
                              borderTop: (isBreak || periodData) ? `6px solid ${color}` : undefined,
                            }}
                            onClick={() => canEdit && !isBreak && openEditModal(day, period.period)}
                          >
                            {active && !isBreak && periodData && (
                              <div className="live-indicator">
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1.5s infinite' }}></span>
                                LIVE
                              </div>
                            )}

                            {(periodData || isBreak) ? (
                              <>
                                <div>
                                  <div className="node-label" style={{ color: isBreak ? 'var(--chronos-text-muted)' : `${color}bb` }}>{period.name}</div>
                                  <div className="subject-badge-premium">
                                    {subjectName}
                                  </div>
                                </div>
                                
                                <div className="teacher-info">
                                  {periodData?.teacher && !isBreak && (
                                    <>
                                      <div className="teacher-avatar-small" style={{ backgroundColor: `${color}15`, color: color, borderColor: `${color}30` }}>
                                        {periodData.teacher.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </div>
                                      {periodData.teacher}
                                    </>
                                  )}
                                </div>
                                {periodData?.room && !isBreak && (
                                  <div className="room-info">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    Node {periodData.room}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="open-slot" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <span className="node-label" style={{ margin: 0, opacity: 0.2 }}>{period.name}</span>
                                {canEdit && (
                                  <div className="allocate-hover-indicator" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '800', color: 'var(--chronos-primary)', opacity: 0 }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                                    ALLOCATE
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {canEdit && (
            <div className="spectrum-container">
              <div className="spectrum-title">
                <div className="spectrum-bar"></div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--chronos-text-main)', margin: 0, letterSpacing: '-0.5px' }}>Subject Identity Spectrum</h3>
              </div>
              <div className="spectrum-grid">
                {courses.map((subject) => (
                  <div key={subject.id || subject._id} className="spectrum-item">
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: getSubjectColor(subject.name) }}></div>
                    <span style={{ fontSize: '13px', color: 'var(--chronos-text-main)', fontWeight: '800' }}>{subject.name}</span>
                  </div>
                ))}
                {['Morning Assembly', 'Break', 'Dismissal'].map(n => (
                  <div key={n} className="spectrum-item">
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: getSubjectColor(n) }}></div>
                    <span style={{ fontSize: '13px', color: 'var(--chronos-text-main)', fontWeight: '800' }}>{n}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      
      {editModalOpen && editingCell && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ width: '550px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <div>
                <h3 className="modal-title">
                  {editingCell.existingData ? 'Refine Allocation' : 'Initialize Allocation'}
                </h3>
                <p className="modal-subtitle">{editingCell.day} • Temporal Node {editingCell.period} • {periods.find(p => p.period === editingCell.period)?.time}</p>
              </div>
              <button onClick={() => { setEditModalOpen(false); setEditingCell(null); }} className="premium-close-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div style={{ marginBottom: '28px' }}>
              <label className="premium-label">Curriculum Identity</label>
              <PremiumSelect 
                value={editingCell.subject || ''} 
                onChange={(e) => setEditingCell(prev => ({ ...prev, subject: e.target.value }))}
                options={courses.map(c => ({
                  value: c.id || c._id,
                  label: `${c.name} (${c.code})`
                }))}
                placeholder="Select Subject"
              />
            </div>
 
            <div style={{ marginBottom: '28px' }}>
              <label className="premium-label">Faculty Mentor</label>
              <PremiumSelect 
                value={editingCell.teacherId || ''} 
                onChange={(e) => handleTeacherSelect(e.target.value)}
                options={teachers.map(t => ({
                  value: t.id || t._id,
                  label: `${t.firstName || t.first_name} ${t.lastName || t.last_name}`
                }))}
                placeholder="Assign Faculty (Optional)"
              />
            </div>

            <div style={{ marginBottom: '40px' }}>
              <label className="premium-label">Geographic Node (Room)</label>
              <input type="text" value={editingCell.room || ''} onChange={(e) => setEditingCell(prev => ({ ...prev, room: e.target.value }))} placeholder="e.g. Lab 04" className="premium-input" />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              {editingCell.existingData && (
                <button onClick={handleRemovePeriod} disabled={saving} style={{ padding: '16px 24px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '16px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
                  Purge
                </button>
              )}
              <button onClick={() => { setEditModalOpen(false); setEditingCell(null); }} style={{ flex: 1, padding: '16px', backgroundColor: 'var(--brand-slate-100)', color: 'var(--brand-slate-600)', border: 'none', borderRadius: '16px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSavePeriod} disabled={saving || !editingCell.subject} className="premium-btn-primary" style={{ flex: 2 }}>
                {saving ? 'Syncing...' : 'Commit Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {periodModalOpen && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ width: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h3 className="modal-title">Academic Period Schema</h3>
                <p className="modal-subtitle">Configure global timetable slots and durations.</p>
              </div>
              <button onClick={() => setPeriodModalOpen(false)} className="premium-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '24px', paddingRight: '10px' }}>
              {editingPeriods.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: '#64748b' }}>{idx}</div>
                  <input type="text" value={p.name || ''} onChange={(e) => {
                    const newP = [...editingPeriods];
                    newP[idx].name = e.target.value;
                    setEditingPeriods(newP);
                  }} className="premium-input" style={{ flex: 2 }} placeholder="Period Name" />
                  <input type="text" value={p.time || ''} onChange={(e) => {
                    const newP = [...editingPeriods];
                    newP[idx].time = e.target.value;
                    setEditingPeriods(newP);
                  }} className="premium-input" style={{ flex: 2 }} placeholder="08:00 - 09:00" />
                  <div 
                    onClick={() => {
                      const newP = [...editingPeriods];
                      newP[idx].isBreak = !newP[idx].isBreak;
                      setEditingPeriods(newP);
                    }}
                    style={{ 
                      padding: '12px 20px', 
                      borderRadius: '16px', 
                      backgroundColor: p.isBreak ? '#fee2e2' : '#f1f5f9',
                      color: p.isBreak ? '#dc2626' : '#64748b',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      border: '1.5px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    {p.isBreak ? 'BREAK' : 'CLASS'}
                  </div>
                  <button onClick={() => {
                    const newP = editingPeriods.filter((_, i) => i !== idx);
                    setEditingPeriods(newP);
                  }} style={{ color: '#ef4444', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '10px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  </button>
                </div>
              ))}
              <button 
                onClick={() => setEditingPeriods([...editingPeriods, { period: editingPeriods.length, name: 'New Period', time: '00:00 - 00:00', isBreak: false }])}
                className="premium-btn-secondary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '10px', backgroundColor: '#f0fdf4', color: 'var(--brand-green)', border: '1.5px dashed var(--brand-green)', boxShadow: 'none' }}
              >
                + Add Academic Node
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => setPeriodModalOpen(false)} style={{ flex: 1, padding: '16px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '16px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>Discard</button>
              <button onClick={handleSavePeriods} disabled={saving} className="premium-btn-primary" style={{ flex: 2 }}>{saving ? 'Saving...' : 'Sync System Schema'}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Timetable;
