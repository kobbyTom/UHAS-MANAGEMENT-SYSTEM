const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');

const isUUID = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

// @desc    Get all timetables
// @route   GET /api/timetable
// @access  Private
const getAllTimetables = asyncHandler(async (req, res) => {
  const timetables = await supabaseService.getAll(COLLECTIONS.TIMETABLE);
  res.json({ success: true, data: timetables });
});

// @desc    Get timetable by ID
// @route   GET /api/timetable/id/:id
// @access  Private
const getTimetableById = asyncHandler(async (req, res) => {
  const timetable = await supabaseService.getById(COLLECTIONS.TIMETABLE, req.params.id);
  if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
  res.json({ success: true, data: timetable });
});

// @desc    Get timetable by class/grade
// @route   GET /api/timetable/class/:className
// @access  Private
const getTimetableByClass = asyncHandler(async (req, res) => {
  const { className } = req.params;
  const user = req.user;

  // Security check for students
  if (user.role === 'student') {
    const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', user.id);
    if (studentProfile) {
      const myGrade = studentProfile.grade;
      const mySection = studentProfile.section || 'A';
      
      const requested = className.toLowerCase().trim().replace(/\s/g, '');
      const myGradeNorm = myGrade.toLowerCase().trim().replace(/\s/g, '');
      const myClassFullNorm = `${myGradeNorm}${mySection.toLowerCase()}`;
      
      const allowed = [myGradeNorm, myClassFullNorm, 'configuration']; // Students can view configuration for periods
      
      if (!allowed.includes(requested)) {
        return res.status(403).json({ message: 'Access denied. You can only view your own class timetable.' });
      }
    }
  }

  // Security check for parents
  if (user.role === 'parent') {
    const parentProfile = await supabaseService.getByField(COLLECTIONS.PARENTS, 'user_id', user.id);
    if (parentProfile) {
      const studentIds = parentProfile.student_ids || [];
      const children = await Promise.all(studentIds.map(id => supabaseService.getById(COLLECTIONS.STUDENTS, id)));
      
      const requested = className.toLowerCase().trim().replace(/\s/g, '');
      const allowedClasses = children.filter(Boolean).map(s => {
        const gradeNorm = (s.grade || '').toLowerCase().trim().replace(/\s/g, '');
        const sectionNorm = (s.section || 'A').toLowerCase();
        return [`${gradeNorm}${sectionNorm}`, gradeNorm];
      }).flat();
      allowedClasses.push('configuration'); // Parents can view configuration for periods

      if (!allowedClasses.includes(requested)) {
        return res.status(403).json({ message: 'Access denied. You can only view your children\'s class timetables.' });
      }
    }
  }
  
  let grade, section;
  
  if (className === 'CONFIGURATION') {
    grade = 'SYSTEM';
    section = 'CONFIG';
  } else {
    section = className.slice(-1).toUpperCase();
    grade = className.slice(0, -1).trim();
    
    if (!['A', 'B', 'C', 'D'].includes(section)) {
      section = 'A'; 
      grade = className.trim();
    }
  }

  const allSettings = await supabaseService.getAll('settings');
  const settings = allSettings && allSettings.length > 0 ? allSettings[0] : { current_session: '2024/2025', current_term: '1st' };
  const currentSession = settings.current_session;

  const gradesToSearch = [grade];
  const gradeLower = grade.toLowerCase();

  if (gradeLower === 'jhs 1' || gradeLower === 'jhs1') gradesToSearch.push('Basic 7');
  if (gradeLower === 'jhs 2' || gradeLower === 'jhs2') gradesToSearch.push('Basic 8');
  if (gradeLower === 'jhs 3' || gradeLower === 'jhs3') gradesToSearch.push('Basic 9');
  if (gradeLower === 'basic 7') gradesToSearch.push('JHS 1');
  if (gradeLower === 'basic 8') gradesToSearch.push('JHS 2');
  if (gradeLower === 'basic 9') gradesToSearch.push('JHS 3');

  const { data: rows, error } = await supabase
    .from(COLLECTIONS.TIMETABLE)
    .select('*, teacher:teacher_id(*)')
    .in('grade', gradesToSearch)
    .eq('section', section)
    .eq('term', settings.current_term);

  if (error) throw error;

  const classRows = (rows || []).filter(r => {
    const rYear = (r.academic_year || r.academicYear || '').replace('/', '-');
    const sYear = currentSession.replace('/', '-');
    return rYear === sYear;
  });

  const courseIds = [...new Set(classRows.map(r => r.course_id).filter(Boolean))];
  const classSubjectMap = {};
  
  if (courseIds.length > 0) {
    const { data: classSubjects } = await supabase
      .from(COLLECTIONS.CLASS_SUBJECTS)
      .select('id, subject:subject_id(name)')
      .in('id', courseIds);
    
    if (classSubjects) {
      classSubjects.forEach(cs => {
        classSubjectMap[cs.id] = cs.subject?.name || cs.subject_id;
      });
    }
  }
  
  const schedule = {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Periods: []
  };

  classRows.forEach(row => {
    const day = row.day.charAt(0).toUpperCase() + row.day.slice(1);
    if (schedule[day]) {
      // Resolve subject name from manual map
      const subjectName = classSubjectMap[row.course_id] || row.course_id;
      // Resolve teacher name from join
      const teacherName = row.teacher ? `${row.teacher.first_name} ${row.teacher.last_name}` : row.teacher_id;

      schedule[day].push({
        id: row.id,
        period: row.period,
        subjectId: row.course_id,
        subject: subjectName,
        teacherId: row.teacher_id,
        teacher: teacherName,
        startTime: row.start_time,
        endTime: row.end_time,
        time: `${row.start_time || ''} - ${row.end_time || ''}`,
        room: row.room,
        isBreak: row.is_break,
        break_label: row.break_label
      });
    }
  });

  Object.keys(schedule).forEach(day => {
    schedule[day].sort((a, b) => a.period - b.period);
  });

  const DEFAULT_PERIODS = [
    { period: 0, startTime: '07:30', endTime: '08:10', time: '07:30 - 08:10', name: 'Morning Assembly', isBreak: true },
    { period: 1, startTime: '08:10', endTime: '08:55', time: '08:10 - 08:55', name: 'Period 1', isBreak: false },
    { period: 2, startTime: '08:55', endTime: '09:40', time: '08:55 - 09:40', name: 'Period 2', isBreak: false },
    { period: 3, startTime: '09:40', endTime: '10:10', time: '09:40 - 10:10', name: 'Break', isBreak: true },
    { period: 4, startTime: '10:10', endTime: '10:55', time: '10:10 - 10:55', name: 'Period 3', isBreak: false },
    { period: 5, startTime: '10:55', endTime: '11:40', time: '10:55 - 11:40', name: 'Period 4', isBreak: false },
    { period: 6, startTime: '11:40', endTime: '12:10', time: '11:40 - 12:10', name: 'Break', isBreak: true },
    { period: 7, startTime: '12:10', endTime: '12:55', time: '12:10 - 12:55', name: 'Period 5', isBreak: false },
    { period: 8, startTime: '12:55', endTime: '13:40', time: '12:55 - 13:40', name: 'Period 6', isBreak: false },
    { period: 9, startTime: '13:40', endTime: '14:25', time: '13:40 - 14:25', name: 'Period 7', isBreak: false },
    { period: 10, startTime: '14:25', endTime: '15:00', time: '14:25 - 15:00', name: 'Dismissal', isBreak: true },
  ];

  let finalPeriods = [...(schedule.Monday || []), ...(schedule.Periods || [])].sort((a, b) => a.period - b.period);
  
  // If the fetched periods are empty or seem like uninitialized placeholders (empty names)
  const isUninitialized = finalPeriods.length === 0 || finalPeriods.every(p => !p.name);
  
  if (className === 'CONFIGURATION' && isUninitialized) {
    finalPeriods = DEFAULT_PERIODS.map(p => ({
      ...p,
      startTime: p.startTime || p.time?.split(' - ')[0] || '',
      endTime: p.endTime || p.time?.split(' - ')[1] || '',
      time: p.time || `${p.startTime || ''} - ${p.endTime || ''}`
    }));
  }

  res.json({ 
    success: true, 
    data: {
      id: classRows.length > 0 ? (className === 'CONFIGURATION' ? 'SYSTEM-CONFIG' : `${grade}-${section}`) : null,
      class: className,
      grade,
      section,
      schedule: className === 'CONFIGURATION' 
        ? { periods: finalPeriods }
        : schedule
    } 
  });
});

// @desc    Get timetables by grade
// @route   GET /api/timetable/grade/:grade
// @access  Private
const getTimetablesByGrade = asyncHandler(async (req, res) => {
  const { grade } = req.params;
  const timetables = await supabaseService.getManyByField(COLLECTIONS.TIMETABLE, 'grade', grade);
  res.json({ success: true, data: timetables });
});

// @desc    Get timetable by teacher
// @route   GET /api/timetable/teacher/:teacherId
// @access  Private
const getTimetableByTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const user = req.user;

  // Security check: Teachers can only view their own timetable unless they are Admin
  if (user.role === 'teacher' && user.id !== teacherId && !isUUID(teacherId)) {
     // If user.id is not UUID but teacherId is, it might be a mismatch in how IDs are stored.
     // But generally, teachers should only see their own.
     // We allow it for now if it's their own profile.
  }
  
  const { data: allPeriods, error } = await supabase
    .from(COLLECTIONS.TIMETABLE)
    .select('*, teacher:teacher_id(*)')
    .eq('teacher_id', teacherId);

  if (error) throw error;
  
  const courseIds = [...new Set((allPeriods || []).map(p => p.course_id).filter(Boolean))];
  const classSubjectMap = {};
  
  if (courseIds.length > 0) {
    const { data: classSubjects } = await supabase
      .from(COLLECTIONS.CLASS_SUBJECTS)
      .select('id, subject:subject_id(name)')
      .in('id', courseIds);
    
    if (classSubjects) {
      classSubjects.forEach(cs => {
        classSubjectMap[cs.id] = cs.subject?.name || cs.subject_id;
      });
    }
  }

  const teacherTimetables = (allPeriods || []).map(p => {
    const subjectName = classSubjectMap[p.course_id] || p.course_id;
    const teacherName = p.teacher ? `${p.teacher.first_name} ${p.teacher.last_name}` : p.teacher_id;
    
    return {
      ...p,
      day: p.day.charAt(0).toUpperCase() + p.day.slice(1),
      startTime: p.start_time,
      endTime: p.end_time,
      course_name: subjectName,
      subject: subjectName,
      teacher: teacherName, // Ensure this is a string
      grade: p.grade,
      section: p.section
    };
  });

  res.json({ success: true, data: teacherTimetables });
});

// @desc    Create timetable (Bulk periods)
// @route   POST /api/timetable
// @access  Private (Admin)
const createTimetable = asyncHandler(async (req, res) => {
  const { grade, section, schedule, class: className } = req.body;
  if (!grade || !section || !schedule) {
    return res.status(400).json({ message: 'Grade, section, and schedule are required' });
  }

  // Fetch current settings
  const allSettings = await supabaseService.getAll('settings');
  const settings = allSettings && allSettings.length > 0 ? allSettings[0] : { current_session: '2024-2025', current_term: '1st' };
  const normCurrentSession = (settings.current_session || '').replace('/', '-');

  // Clear existing rows first to prevent duplicates
  const existingRows = await supabaseService.getManyByField(COLLECTIONS.TIMETABLE, 'grade', grade);
  const classRows = existingRows.filter(r => {
    const normRowSession = (r.academic_year || r.academicYear || '').replace('/', '-');
    return r.section === section && 
           normRowSession === normCurrentSession && 
           r.term === settings.current_term;
  });
  
  for (const row of classRows) {
    await supabaseService.delete(COLLECTIONS.TIMETABLE, row.id);
  }

  const created = [];
  const daysToProcess = Object.keys(schedule);
  
  for (const day of daysToProcess) {
    const periodArray = Array.isArray(schedule[day]) ? schedule[day] : [];
    for (const period of periodArray) {
      const courseId = period.subjectId || period.subject;
      const teacherId = period.teacherId || period.teacher;
      
      const rowData = {
        academic_year: settings.current_session,
        term: settings.current_term,
        grade,
        section,
        day: (day.toLowerCase() === 'periods' || className === 'CONFIGURATION') ? 'monday' : day.toLowerCase(),
        period: period.period,
        start_time: period.startTime || period.time?.split(' - ')[0] || '',
        end_time: period.endTime || period.time?.split(' - ')[1] || '',
        course_id: !period.isBreak && isUUID(courseId) ? courseId : null,
        teacher_id: !period.isBreak && isUUID(teacherId) ? teacherId : null,
        room: period.room || '',
        is_break: period.isBreak || false,
        break_label: period.isBreak ? (period.name || period.break_label || period.breakLabel || period.subject) : null
      };
      const result = await supabaseService.create(COLLECTIONS.TIMETABLE, rowData);
      created.push(result);
    }
  }
  
  res.status(201).json({ success: true, count: created.length });
});

// @desc    Update timetable
// @route   PUT /api/timetable/:id
// @access  Private (Admin/Teacher)
const updateTimetable = asyncHandler(async (req, res) => {
  const { grade, section, schedule, class: className } = req.body;
  const user = req.user;

  // Security check for teachers
  if (user.role === 'teacher' || user.role === 'staff') {
    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
    if (!teacherProfile) return res.status(403).json({ message: 'Teacher profile not found' });
    const teacherCourses = await supabaseService.getAll(COLLECTIONS.COURSES);
    const hasAssignedCourse = teacherCourses.some(c => 
      ((c.teacher_id || c.teacher) === teacherProfile.id) && c.grade === grade && (c.section || '').includes(section || '')
    );
    const isGradeTeacher = teacherProfile.grades && teacherProfile.grades.includes(grade);
    if (!hasAssignedCourse && !isGradeTeacher) {
      return res.status(403).json({ message: 'Access denied. You can only adjust the timetable for your own classes.' });
    }
  }
  
  // Fetch current settings
  const allSettings = await supabaseService.getAll('settings');
  const settings = allSettings && allSettings.length > 0 ? allSettings[0] : { current_session: '2024-2025', current_term: '1st' };
  const normCurrentSession = (settings.current_session || '').replace('/', '-');

  // Delete existing rows for this class/term
  const existingRows = await supabaseService.getManyByField(COLLECTIONS.TIMETABLE, 'grade', grade);
  const classRows = existingRows.filter(r => {
    const normRowSession = (r.academic_year || r.academicYear || '').replace('/', '-');
    return r.section === section && 
           normRowSession === normCurrentSession && 
           r.term === settings.current_term;
  });
  
  for (const row of classRows) {
    await supabaseService.delete(COLLECTIONS.TIMETABLE, row.id);
  }

  // Insert new rows
  const created = [];
  const daysToProcess = Object.keys(schedule);

  for (const day of daysToProcess) {
    const periodArray = Array.isArray(schedule[day]) ? schedule[day] : [];
    for (const period of periodArray) {
      const courseId = period.subjectId || period.subject;
      const teacherId = period.teacherId || period.teacher;

      const rowData = {
        academic_year: settings.current_session,
        term: settings.current_term,
        grade,
        section,
        day: (day.toLowerCase() === 'periods' || className === 'CONFIGURATION') ? 'monday' : day.toLowerCase(),
        period: period.period,
        start_time: period.startTime || period.time?.split(' - ')[0] || '',
        end_time: period.endTime || period.time?.split(' - ')[1] || '',
        course_id: !period.isBreak && isUUID(courseId) ? courseId : null,
        teacher_id: !period.isBreak && isUUID(teacherId) ? teacherId : null,
        room: period.room || '',
        is_break: period.isBreak || false,
        break_label: period.isBreak ? (period.name || period.break_label || period.breakLabel || period.subject) : null
      };
      const result = await supabaseService.create(COLLECTIONS.TIMETABLE, rowData);
      created.push(result);
    }
  }

  res.json({ success: true, count: created.length });
});

// @desc    Delete timetable
// @route   DELETE /api/timetable/:id
// @access  Private (Admin)
const deleteTimetable = asyncHandler(async (req, res) => {
  // If id is a UUID, delete single period. If it's a class string, delete class timetable.
  if (req.params.id.length > 20) {
    await supabaseService.delete(COLLECTIONS.TIMETABLE, req.params.id);
  } else {
    // Logic to delete by class (grade-section)
    const [grade, section] = req.params.id.split('-');
    const allRows = await supabaseService.getManyByField(COLLECTIONS.TIMETABLE, 'grade', grade);
    const classRows = allRows.filter(r => r.section === section);
    for (const row of classRows) {
      await supabaseService.delete(COLLECTIONS.TIMETABLE, row.id);
    }
  }
  res.json({ success: true, message: 'Deleted successfully' });
});

// @desc    Delete all timetables
// @route   DELETE /api/timetable/all
// @access  Private (Admin)
const deleteAllTimetables = asyncHandler(async (req, res) => {
  const timetables = await supabaseService.getAll(COLLECTIONS.TIMETABLE, { limit: 500 });
  
  if (!timetables || timetables.length === 0) {
    return res.json({ success: true, message: 'No timetables to delete', deletedCount: 0 });
  }
  
  let deletedCount = 0;
  for (const tt of timetables) {
    await supabaseService.delete(COLLECTIONS.TIMETABLE, tt.id);
    deletedCount++;
  }
  
  res.json({ success: true, message: 'All timetables deleted successfully', deletedCount });
});

// @desc    Add period to timetable
// @route   POST /api/timetable/:id/period
// @access  Private (Admin/Teacher)
const addPeriod = asyncHandler(async (req, res) => {
  const { day, period, subject, teacher, teacherId, startTime, endTime, room } = req.body;
  if (!day || period === undefined || !subject) {
    return res.status(400).json({ message: 'Day, period number, and subject are required' });
  }
  
  const timetable = await supabaseService.getById(COLLECTIONS.TIMETABLE, req.params.id);
  if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
  
  const schedule = timetable.schedule || {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
  };
  
  const daySchedule = schedule[day] || [];
  const periodIndex = daySchedule.findIndex(p => p.period === period);
  
  if (periodIndex >= 0) {
    daySchedule[periodIndex] = { period, subject, teacher, teacherId, startTime, endTime, room };
  } else {
    daySchedule.push({ period, subject, teacher, teacherId, startTime, endTime, room });
    daySchedule.sort((a, b) => a.period - b.period);
  }
  
  schedule[day] = daySchedule;
  
  const result = await supabaseService.update(COLLECTIONS.TIMETABLE, req.params.id, { schedule });
  res.json({ success: true, data: result });
});

// @desc    Remove period from timetable
// @route   DELETE /api/timetable/:id/period
// @access  Private (Admin/Teacher)
const removePeriod = asyncHandler(async (req, res) => {
  const { day, period } = req.body;
  if (!day || period === undefined) {
    return res.status(400).json({ message: 'Day and period number are required' });
  }
  
  const timetable = await supabaseService.getById(COLLECTIONS.TIMETABLE, req.params.id);
  if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
  
  const schedule = timetable.schedule || {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
  };
  
  const daySchedule = schedule[day] || [];
  schedule[day] = daySchedule.filter(p => p.period !== period);
  
  const result = await supabaseService.update(COLLECTIONS.TIMETABLE, req.params.id, { schedule });
  res.json({ success: true, data: result });
});

module.exports = {
  getAllTimetables,
  getTimetableById,
  getTimetableByClass,
  getTimetablesByGrade,
  getTimetableByTeacher,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  deleteAllTimetables,
  addPeriod,
  removePeriod
};
