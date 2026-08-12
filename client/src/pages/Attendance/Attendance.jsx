import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceAPI, studentAPI, courseAPI, parentAPI, settingsAPI, teacherAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { mapSectionName } from '../../utils/sectionHelper';
import PremiumDatePicker from '../../components/common/PremiumDatePicker';
import PremiumCalendar from '../../components/common/PremiumCalendar';
import PremiumSelect from '../../components/common/PremiumSelect';

const displayGrade = (g) => {
  if (!g) return 'No Grade';
  let str = g.toString().trim();
  // Transform Primary 1-6 to Basic 1-6 for UI display
  const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
  if (primaryMatch) return `Basic ${primaryMatch[1]}`;
  return str;
};

// Custom SVG Icons
const Icons = {
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Clock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Save: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Filter: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
};

const Attendance = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Class');
  
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [storedUser, setStoredUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [pendingChanges, setPendingChanges] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [schoolSettings, setSchoolSettings] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');

  // Period schedule — each has a label, start (HH:MM 24h), end, and grace minutes before "Late"
  const PERIOD_SCHEDULE = [
    { id: 'Morning Assembly', label: 'Morning Assembly', start: '07:30', end: '07:45', grace: 5 },
    { id: 'Period 1',         label: 'Period 1',         start: '07:45', end: '08:30', grace: 5 },
    { id: 'Period 2',         label: 'Period 2',         start: '08:30', end: '09:15', grace: 5 },
    { id: 'Period 3',         label: 'Period 3',         start: '09:15', end: '10:00', grace: 5 },
    { id: 'Break',            label: 'Break',            start: '10:00', end: '10:20', grace: 0 },
    { id: 'Period 4',         label: 'Period 4',         start: '10:20', end: '11:05', grace: 5 },
    { id: 'Period 5',         label: 'Period 5',         start: '11:05', end: '11:50', grace: 5 },
    { id: 'Period 6',         label: 'Period 6',         start: '11:50', end: '12:35', grace: 5 },
    { id: 'General',          label: 'General / Other',  start: '00:00', end: '23:59', grace: 0 },
  ];

  // Convert "HH:MM" to total minutes from midnight
  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  // Auto-detect which period is currently active based on real clock
  const detectCurrentPeriod = (now = new Date()) => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for (const p of PERIOD_SCHEDULE) {
      if (p.id === 'General') continue;
      const start = toMinutes(p.start);
      const end   = toMinutes(p.end);
      if (nowMin >= start && nowMin < end) return p.id;
    }
    // Before school or after school — fall back to General
    return 'General';
  };

  // Derived info about the selected period
  const activePeriodInfo = PERIOD_SCHEDULE.find(p => p.id === selectedPeriod) || PERIOD_SCHEDULE[PERIOD_SCHEDULE.length - 1];

  // Progress within selected period (0–100%)
  const periodProgress = useMemo(() => {
    if (!activePeriodInfo || activePeriodInfo.id === 'General') return null;
    const start = toMinutes(activePeriodInfo.start);
    const end   = toMinutes(activePeriodInfo.end);
    const now   = currentTime.getHours() * 60 + currentTime.getMinutes();
    if (now < start) return 0;
    if (now >= end)  return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  }, [currentTime, activePeriodInfo]);

  // Minutes into the period (used for late detection)
  const minutesIntoPeriod = useMemo(() => {
    if (!activePeriodInfo) return 0;
    const start = toMinutes(activePeriodInfo.start);
    const now   = currentTime.getHours() * 60 + currentTime.getMinutes();
    return Math.max(0, now - start);
  }, [currentTime, activePeriodInfo]);

  // Is the current time past the grace window for the active period?
  const isPastGrace = minutesIntoPeriod > (activePeriodInfo?.grace ?? 5);

  const isWeekend = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDay();
    return day === 0 || day === 6; // 0=Sunday, 6=Saturday
  };

  const isSelectedWeekend = isWeekend(selectedDate);

  const currentUser = storedUser || user;
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isAdmin = currentUser?.role === 'admin';

  // Fetch School Settings (kept for other uses like academic year/term)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingsAPI.getSettings();
        if (res.data?.success) setSchoolSettings(res.data.data);
      } catch (err) { console.error('Error fetching settings:', err); }
    };
    fetchSettings();
  }, []);

  // Live Clock — tick every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-detect and set the current period on first load
  useEffect(() => {
    if (!selectedPeriod) {
      setSelectedPeriod(detectCurrentPeriod());
    }
  }, []);

  const isStudent = currentUser?.role === 'student';

  const [summary, setSummary] = useState(null);

  async function fetchData() {
    try {
      setLoading(true);
      setPendingChanges({}); 

      // 1. Handle Role-Specific Student Fetching
      let targetStudents = [];
      let summaryData = null;

      if (isStudent) {
        const studentId = currentUser.studentId || currentUser.id;
        const [studentRes, summaryRes] = await Promise.all([
          studentAPI.getById(studentId),
          attendanceAPI.getSummary(studentId)
        ]);
        if (studentRes.data?.success) targetStudents = [studentRes.data.data];
        if (summaryRes.data?.success) summaryData = summaryRes.data.data;
      } else if (isParent) {
        if (linkedStudents.length === 0) {
          const parentRes = await parentAPI.getMyChildren();
          if (parentRes.data?.success) {
            const children = parentRes.data.data;
            setLinkedStudents(children);
            const initialChildId = selectedChildId || children[0]?.id;
            targetStudents = children.filter(s => s.id === initialChildId);
            
            if (initialChildId) {
              const summaryRes = await attendanceAPI.getSummary(initialChildId);
              if (summaryRes.data?.success) summaryData = summaryRes.data.data;
            }
          }
        } else {
          targetStudents = linkedStudents.filter(s => !selectedChildId || s.id === selectedChildId);
          if (selectedChildId) {
            const summaryRes = await attendanceAPI.getSummary(selectedChildId);
            if (summaryRes.data?.success) summaryData = summaryRes.data.data;
          }
        }
      }

      // 2. Fetch Records & Global Student List
      const [attRes, studentsRes] = await Promise.all([
        attendanceAPI.getByDate(selectedDate),
        (isParent || isStudent)
          ? Promise.resolve({ data: { data: targetStudents } })
          : (isTeacher && !selectedClass)
            ? Promise.resolve({ data: { data: [] } })
            : studentAPI.getAll({ page, limit, grade: selectedClass, section: selectedSection })
      ]);

      setStudents((isParent || isStudent) ? targetStudents : (studentsRes?.data?.data || []));
      setRecords(attRes?.data?.data || []);
      setSummary(summaryData);
      
      const pagination = studentsRes?.data?.pagination || {};
      setTotalPages(pagination.pages || 1);
      setTotalStudents(pagination.total || (isParent || isStudent ? targetStudents.length : 0));

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
  }, []);

  useEffect(() => {
    if (isTeacher && currentUser?.id) {
      const fetchTeacherCourses = async () => {
        try {
          // Use teacherAPI to retrieve both subjects and masterClasses accurately
          const res = await teacherAPI.getMyCourses();
          // Strict Access Control: Extract the dedicated masterClasses array from the API response
          const masterClassesOnly = res.data?.masterClasses || [];
          
          setTeacherCourses(masterClassesOnly);
          if (masterClassesOnly.length > 0 && !selectedClass) {
            setSelectedClass(masterClassesOnly[0].name || masterClassesOnly[0].grade);
            setSelectedSection(masterClassesOnly[0].section || 'A');
          }
        } catch (err) {
          console.error("Error fetching teacher courses:", err);
        }
      };
      fetchTeacherCourses();
    }
  }, [isTeacher, currentUser?.id]);

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedClass, selectedSection, page, selectedChildId, linkedStudents.length]);

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); }
  };

  const getStatusDataForStudent = (studentId) => {
    if (pendingChanges[studentId]) return {
      status: pendingChanges[studentId].status,
      arrival_time: pendingChanges[studentId].arrival_time,
      notes: pendingChanges[studentId].notes !== undefined ? pendingChanges[studentId].notes : ''
    };

    const record = records.find(r => 
      r.student_id === studentId || r.student === studentId || r.student?._id === studentId
    );
    return {
      status: record?.status || 'absent',
      arrival_time: record?.arrival_time || null,
      notes: record?.notes || ''
    };
  };

  const handleNotesChange = (studentId, notes) => {
    setPendingChanges(prev => {
      const current = prev[studentId] || getStatusDataForStudent(studentId);
      return {
        ...prev,
        [studentId]: {
          ...current,
          notes: notes
        }
      };
    });
  };

  const handleStatusChange = (studentId, status) => {
    const now = new Date();
    const arrival_time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    setPendingChanges(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: status,
        arrival_time: status === 'absent' ? null : arrival_time
      }
    }));
  };

  // Force a specific status regardless of grace window (for explicit teacher override)
  const handleForceStatus = (studentId, status) => {
    const now = new Date();
    const arrival_time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    setPendingChanges(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        arrival_time: status === 'absent' ? null : arrival_time
      }
    }));
  };

  const handleMarkAll = (status) => {
    const newChanges = {};
    const now = new Date();
    const arrival_time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    students.forEach(student => {
      const id = student.id || student._id;
      newChanges[id] = {
        ...pendingChanges[id],
        status: status,
        arrival_time: status === 'absent' ? null : arrival_time
      };
    });
    setPendingChanges(prev => ({ ...prev, ...newChanges }));
  };

  const saveAttendance = async () => {
    const changeArray = Object.entries(pendingChanges).map(([studentId, data]) => ({
      student_id: studentId,
      status: data.status,
      date: selectedDate,
      period: selectedPeriod,
      arrival_time: data.arrival_time,
      notes: data.notes || ''
    }));

    if (changeArray.length === 0) return;

    try {
      setSaving(true);
      await attendanceAPI.markBulk({ records: changeArray });
      
      // Update local records state to reflect changes without a full fetch
      setRecords(prev => {
        const newRecords = [...prev];
        changeArray.forEach(change => {
          const index = newRecords.findIndex(r => r.student_id === change.student_id && r.period === change.period);
          if (index !== -1) {
            newRecords[index] = { ...newRecords[index], ...change };
          } else {
            newRecords.push(change);
          }
        });
        return newRecords;
      });

      setPendingChanges({}); // Clear pending changes as they are now committed
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      // Removed fetchData() to keep the current state/scroll position
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s =>
      `${s.firstName || s.first_name} ${s.lastName || s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const stats = useMemo(() => {
    const currentStats = { present: 0, late: 0, absent: 0, total: students.length };
    students.forEach(student => {
      const data = getStatusDataForStudent(student.id || student._id);
      if (data.status === 'present') currentStats.present++;
      else if (data.status === 'late') currentStats.late++;
      else if (data.status === 'absent') currentStats.absent++;
    });
    return currentStats;
  }, [students, pendingChanges, records]);

  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

  // Lock attendance for teachers once records exist for this class on this date
  const isAttendanceLocked = isTeacher && students.length > 0 && records.some(r =>
    students.some(s => {
      const sId = s.id || s._id;
      return r.student_id === sId || r.student === sId || r.student?._id === sId;
    })
  );

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <main style={{ padding: '20px 0 60px 0' }}>
          {/* Header Section */}
          {/* Command Hub: Unified Header, Calendar, and Controls */}
          <div className="glass-card" style={{ padding: '36px', marginBottom: '32px', borderRadius: '32px', background: 'linear-gradient(135deg, #ffffff 0%, #ffffff 100%)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
              
              {/* Left Column: Intelligence Header & Controls */}
              <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ padding: '6px 14px', backgroundColor: 'var(--brand-green)', color: 'white', borderRadius: '20px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Operation Registry</span>
                    <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Attendance</span>
                  </div>
                  <h1 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-1.5px', fontFamily: 'Outfit, sans-serif' }}>
                    {isStudent ? 'My Attendance' : isParent ? 'Child Attendance' : <>Attendance <span style={{ color: 'var(--brand-green)' }}>Intelligence</span></>}
                  </h1>
                  <p style={{ fontSize: '16px', color: '#64748b', marginTop: '12px', fontWeight: '500', maxWidth: '500px', lineHeight: '1.6' }}>
                    {isStudent ? 'Monitor your personal arrival history and punctuality records.' : 
                     isParent ? 'Track your children\'s presence and academic engagement.' : 
                     isAdmin ? 'Comprehensive overview of institutional punctuality tracking across all tiers and nodes.' :
                     'Monitor your institutional punctuality tracking. Select a specific tier and node to commence daily operational logging.'}
                  </p>
                </div>

                {/* Role-Specific Controls */}
                {(isTeacher || isAdmin || isParent) && (
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '40px', padding: '24px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                    
                    {isAdmin && (
                      <div style={{ flex: 1, display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Curriculum Tier</span>
                          <PremiumSelect
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            options={['KG 1', 'KG 2', 'KG 3', 'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'Basic 7', 'Basic 8', 'Basic 9'].map(g => ({ value: g, label: g }))}
                            placeholder="Select Tier"
                          />
                        </div>
                        <div style={{ width: '140px' }}>
                          <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Section Node</span>
                          <PremiumSelect
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            options={['A', 'B', 'C', 'D'].map(s => ({ value: s, label: mapSectionName(s) }))}
                            placeholder="Select Node"
                          />
                        </div>
                      </div>
                    )}

                    {isTeacher && (
                      <>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Assigned Master Class</span>
                          <div style={{ padding: '14px 20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                            {selectedClass && selectedSection ? `${selectedClass} — Section ${mapSectionName(selectedSection)}` : 'No Master Class Assigned'}
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleMarkAll('present')} 
                          disabled={isSelectedWeekend || !selectedClass || isAttendanceLocked}
                          className="premium-btn-secondary"
                          style={{ padding: '14px 24px', height: '52px', marginTop: '23px', whiteSpace: 'nowrap', opacity: (isSelectedWeekend || !selectedClass || isAttendanceLocked) ? 0.5 : 1 }}
                        >
                          Mark All Present
                        </button>
                      </>
                    )}

                    {isParent && linkedStudents.length > 0 && (
                      <div style={{ flex: 1, minWidth: '260px' }}>
                        <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Scholar Profile</span>
                        <PremiumSelect
                          value={selectedChildId}
                          onChange={(e) => setSelectedChildId(e.target.value)}
                          options={linkedStudents.map(c => ({
                            value: c.id,
                            label: `${c.firstName || c.first_name} ${c.lastName || c.last_name}`
                          }))}
                          placeholder="Select Student Profile"
                        />
                      </div>
                    )}

                    {isTeacher && hasUnsavedChanges && (
                      <button
                        onClick={saveAttendance}
                        disabled={saving || isSelectedWeekend}
                        className="premium-btn-primary"
                        style={{
                          padding: '14px 28px',
                          height: '52px',
                          marginTop: '23px',
                          opacity: (saving || isSelectedWeekend) ? 0.6 : 1,
                          cursor: isSelectedWeekend ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {saving ? 'Saving...' : <><Icons.Save /> Commit Registry</>}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Premium Calendar */}
              <div style={{ width: '400px', flexShrink: 0, backgroundColor: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>Operational Date</span>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--brand-green)', backgroundColor: '#f0fdf4', padding: '4px 10px', borderRadius: '12px', letterSpacing: '1px' }}>TIMELINE</span>
                </div>
                <PremiumCalendar 
                  value={selectedDate} 
                  onChange={(val) => setSelectedDate(val)} 
                />
              </div>

            </div>
          </div>


          {/* Weekend Warning Banner */}
          {isSelectedWeekend && (
            <div style={{ 
              backgroundColor: '#fffbeb', 
              border: '1px solid #fde68a', 
              borderRadius: '16px', 
              padding: '16px 24px', 
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <div style={{ 
                backgroundColor: '#f59e0b', 
                color: 'white', 
                width: '40px', 
                height: '40px', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icons.Clock />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#92400e' }}>Weekend Selected</h4>
                <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '600', color: '#b45309' }}>
                  Attendance tracking is restricted to weekdays (Monday to Friday). You cannot mark or modify attendance for this date.
                </p>
              </div>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="responsive-grid-4" style={{ marginBottom: '16px' }}>
            {(isStudent || isParent) && summary ? (
              <>
                {[
                  { label: 'Attendance Rate', value: `${summary.attendancePercentage || 0}%`, color: '#059669', bg: '#ecfdf5', icon: <Icons.Check /> },
                  { label: 'Total Present', value: summary.presentDays || 0, color: '#2563eb', bg: '#eff6ff', icon: <Icons.Users /> },
                  { label: 'Total Absent', value: summary.absentDays || 0, color: '#dc2626', bg: '#fef2f2', icon: <Icons.X /> }
                ].map((stat, i) => (
                  <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
                    <div style={{ backgroundColor: stat.bg, color: stat.color, padding: '12px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>{stat.icon}</div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>{stat.label}</p>
                      <p style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{stat.value}</p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              [
                { label: 'Present', value: stats.present, color: '#059669', bg: '#ecfdf5', icon: <Icons.Check /> },
                { label: 'Late', value: stats.late, color: '#d97706', bg: '#fef3c7', icon: <Icons.Clock /> },
                { label: 'Absent', value: stats.absent, color: '#dc2626', bg: '#fef2f2', icon: <Icons.X /> },
                { label: 'Total Enrolled', value: stats.total, color: '#2563eb', bg: '#eff6ff', icon: <Icons.Users /> }
              ].map((stat, i) => (
                <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
                  <div style={{ backgroundColor: stat.bg, color: stat.color, padding: '12px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>{stat.icon}</div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>{stat.label}</p>
                    <p style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{stat.value}</p>
                  </div>
                </div>
              ))
            )}
          </div>



          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {isStudent || isParent ? (
              <div className="responsive-grid-2-1-3" style={{ gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Temporal Fidelity Matrix */}
                  <div className="glass-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '950', color: '#0f172a', margin: 0 }}>Presence Audit Trail</h3>
                        <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginTop: '4px' }}>Chronological log of institutional presence nodes.</p>
                      </div>
                      <div style={{ padding: '8px 16px', backgroundColor: 'var(--brand-green-soft)', borderRadius: '12px', border: '1.5px solid var(--brand-green-glow)' }}>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '1px' }}>Fidelity Score: {summary?.attendancePercentage || 0}%</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {loading ? (
                         [...Array(5)].map((_, i) => (
                           <div key={i} style={{ height: '60px', backgroundColor: '#ffffff', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
                         ))
                      ) : records.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '24px', border: '1.5px dashed #e2e8f0' }}>
                          <Icons.Clock />
                          <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: '700', color: '#94a3b8' }}>No temporal nodes recorded for this cycle.</p>
                        </div>
                      ) : (
                        records.map((record, i) => (
                          <div key={i} className="attendance-row-nexus" style={{ 
                            padding: '16px 24px', 
                            backgroundColor: 'white', 
                            borderRadius: '18px', 
                            border: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.3s ease'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                              <div style={{ 
                                width: '44px', 
                                height: '44px', 
                                borderRadius: '12px', 
                                backgroundColor: record.status === 'present' ? '#f0fdf4' : (record.status === 'late' ? '#fffbeb' : '#fef2f2'),
                                color: record.status === 'present' ? '#10b981' : (record.status === 'late' ? '#d97706' : '#ef4444'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {record.status === 'present' ? <Icons.Check /> : (record.status === 'late' ? <Icons.Clock /> : <Icons.X />)}
                              </div>
                              <div>
                                <p style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{record.period || 'General Session'}</p>
                                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', margin: '2px 0 0 0' }}>
                                  {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </p>
                                {record.notes && (
                                  <p style={{ fontSize: '11px', color: '#b45309', fontWeight: '700', margin: '4px 0 0 0', backgroundColor: '#fffbeb', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
                                    Reason: {record.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: '14px', fontWeight: '900', color: record.status === 'present' ? '#10b981' : (record.status === 'late' ? '#d97706' : '#ef4444'), margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {record.status}
                              </p>
                              {record.arrival_time && (
                                <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginTop: '2px' }}>
                                  Arrived: {record.arrival_time}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {/* Punctuality Analytics */}
                  <div className="glass-card" style={{ padding: '24px' }}>
                    <h4 className="premium-label" style={{ marginBottom: '20px' }}>Punctuality Matrix</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>On-Time Arrivals</span>
                        <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--brand-green)' }}>{Math.round((summary?.presentDays || 0) * 0.85)}</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '85%', backgroundColor: 'var(--brand-green)', borderRadius: '3px' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Late Transitions</span>
                        <span style={{ fontSize: '14px', fontWeight: '900', color: '#d97706' }}>{Math.round((summary?.presentDays || 0) * 0.15)}</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '15%', backgroundColor: '#f59e0b', borderRadius: '3px' }} />
                      </div>
                    </div>
                  </div>

                  {/* Academic Calendar Hint */}
                  <div style={{ backgroundColor: '#1e293b', borderRadius: '24px', padding: '24px', color: 'white' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <Icons.Clock />
                    </div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Temporal Insights</h4>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px', lineHeight: '1.6', fontWeight: '500' }}>
                      Your attendance is synchronized with the institutional clock. Maintain a fidelity score above 90% for optimal academic performance.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Table Header */}
                <div style={{ padding: '20px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0f172a' }}>
                      {selectedClass ? `${selectedClass}${selectedSection ? ` — Section ${mapSectionName(selectedSection)}` : ''}` : 'Scholar Register'}
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                      {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} · {selectedDate}
                    </p>
                  </div>
                  {/* Search */}
                  <div style={{ position: 'relative', width: '240px' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icons.Search /></span>
                    <input
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Search student…"
                      style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '13px', fontWeight: '600', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Locked banner */}
                {isAttendanceLocked && (
                  <div style={{ margin: '0', padding: '14px 32px', backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: '900', fontSize: '14px', color: '#92400e' }}>Attendance Locked</p>
                      <p style={{ margin: '2px 0 0', fontWeight: '600', fontSize: '12px', color: '#b45309' }}>Attendance has already been recorded for this class on {selectedDate}. Contact an administrator to make corrections.</p>
                    </div>
                  </div>
                )}

                {/* Table */}
                {loading ? (
                  <div style={{ padding: '40px' }}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} style={{ height: '56px', backgroundColor: '#ffffff', borderRadius: '12px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }} />
                    ))}
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ marginBottom: '16px', opacity: 0.5 }}><Icons.Users /></div>
                    <p style={{ fontSize: '16px', fontWeight: '600' }}>No students match your criteria</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#ffffff' }}>
                        <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Scholar</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Arrival</th>
                        <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, idx) => {
                        const studentId = student.id || student._id;
                        const data = getStatusDataForStudent(studentId);
                        const isPending = !!pendingChanges[studentId];
                        const isPresent = data.status === 'present';
                        const isLate = data.status === 'late';
                        const rowBgColor = isPending ? (isPresent ? '#f0fdf4' : (isLate ? '#fffbeb' : '#fef2f2')) : (idx % 2 === 0 ? 'white' : '#fafafa');
                        return (
                          <tr
                            key={studentId}
                            style={{
                              borderBottom: '1px solid #f9fafb',
                              backgroundColor: rowBgColor,
                              transition: 'background 0.2s'
                            }}
                          >
                            {/* Name + ID */}
                            <td style={{ padding: '14px 24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                  width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                                  background: isPresent ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)' : (isLate ? 'linear-gradient(135deg,#fef3c7,#fde68a)' : 'linear-gradient(135deg,#fee2e2,#fecaca)'),
                                  color: isPresent ? '#059669' : (isLate ? '#d97706' : '#dc2626'),
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: '900', fontSize: '14px', letterSpacing: '-0.5px'
                                }}>
                                  {(student.firstName || student.first_name)?.[0]}{(student.lastName || student.last_name)?.[0]}
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontWeight: '900', fontSize: '14px', color: '#0f172a' }}>
                                    {student.firstName || student.first_name} {student.lastName || student.last_name}
                                  </p>
                                  <p style={{ margin: '2px 0 0', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                    {student.admissionNumber || 'ADM—'}
                                  </p>
                                  {data.status === 'late' && (
                                    <div style={{ marginTop: '8px' }}>
                                      <input
                                        type="text"
                                        placeholder="Reason for lateness..."
                                        value={data.notes || ''}
                                        disabled={isSelectedWeekend || isAttendanceLocked || isAdmin}
                                        onChange={(e) => handleNotesChange(studentId, e.target.value)}
                                        style={{
                                          width: '100%',
                                          maxWidth: '300px',
                                          padding: '6px 12px',
                                          fontSize: '12px',
                                          borderRadius: '8px',
                                          border: '1px solid #d97706',
                                          outline: 'none',
                                          backgroundColor: '#fffdfa',
                                          color: '#78350f',
                                          transition: 'all 0.2s',
                                          boxShadow: '0 1px 2px rgba(217, 119, 6, 0.05)'
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Arrival time */}
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block', padding: '4px 12px', borderRadius: '8px',
                                fontSize: '12px', fontWeight: '800',
                                backgroundColor: data.arrival_time ? (isLate ? '#fffbeb' : '#f0fdf4') : '#ffffff',
                                color: data.arrival_time ? (isLate ? '#d97706' : '#059669') : '#94a3b8',
                                border: `1px solid ${data.arrival_time ? (isLate ? '#fde68a' : '#bbf7d0') : '#e2e8f0'}`
                              }}>
                                {data.arrival_time || '— : —'}
                              </span>
                            </td>

                            {/* Present / Absent toggle */}
                            <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '8px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                                {[
                                  { id: 'present', label: 'Present', color: '#10b981', activeColor: '#ecfdf5', icon: <Icons.Check /> },
                                  { id: 'late',    label: 'Late',    color: '#d97706', activeColor: '#fef3c7', icon: <Icons.Clock /> },
                                  { id: 'absent',  label: 'Absent',  color: '#ef4444', activeColor: '#fef2f2', icon: <Icons.X /> }
                                ].map(opt => (
                                  <button
                                    key={opt.id}
                                    onClick={() => handleStatusChange(studentId, opt.id)}
                                    disabled={isSelectedWeekend || isAttendanceLocked || isAdmin}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '6px',
                                      padding: '8px 16px',
                                      border: 'none', borderRadius: '9px',
                                      fontSize: '13px', fontWeight: '800',
                                      cursor: (isSelectedWeekend || isAttendanceLocked) ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.2s',
                                      backgroundColor: data.status === opt.id ? opt.activeColor : 'transparent',
                                      color: data.status === opt.id ? opt.color : '#94a3b8',
                                      boxShadow: data.status === opt.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                      opacity: isAttendanceLocked ? 0.6 : 1
                                    }}
                                  >
                                    {opt.icon}
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

            )}
          </div>


          {/* Bottom Feedback Bar */}
          {showSuccess && (
            <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: 'white', padding: '16px 32px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 1000, animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ color: '#10b981' }}><Icons.Check /></div>
              <span style={{ fontWeight: '600' }}>Attendance for <strong>{selectedPeriod}</strong> saved successfully!</span>
            </div>
          )}

          {/* Styles for animation */}
          <style>{`
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            @keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
            
            .attendance-card:hover {
              transform: translateY(-4px) !important;
              box-shadow: 0 12px 30px rgba(0,0,0,0.06) !important;
              border-color: var(--brand-green-light) !important;
            }
            
            .attendance-action-btn:hover {
              transform: scale(1.05);
            }
            
            .attendance-action-btn.active {
              animation: buttonPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            
            @keyframes buttonPop {
              0% { transform: scale(0.9); }
              50% { transform: scale(1.1); }
            }
          `}</style>
        </main>
    </div>
  );
};

export default Attendance;
