const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');

// Get all attendance with optimized filtering
const getAllAttendance = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, student, date, academic_year, term } = req.query;
  const user = req.user;

  let query = supabase.from(COLLECTIONS.ATTENDANCE).select('*', { count: 'exact' });

  // Data Isolation for Teachers
  if (user.role === 'teacher') {
    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
    if (teacherProfile) {
      const teacherId = teacherProfile.id;
      
      // Get sections where they are Class Master ONLY
      const { data: masterSections } = await supabase.from(COLLECTIONS.SECTIONS).select('name, class:class_id(name)').eq('class_master_id', teacherId);
      
      const assignments = [
        ...(masterSections || []).map(s => ({ grade: s.class?.name, section: s.name }))
      ];

      if (assignments.length > 0) {
        const getGradeVariations = (gName) => {
          const lower = String(gName || '').toLowerCase();
          const num = lower.replace(/basic|primary|kindergarten|kg|jhs|nursery/g, '').trim();
          const base = [lower, lower.replace('primary', 'basic'), lower.replace('basic', 'primary'), num];
          const toTitleCase = (str) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
          const expanded = new Set();
          base.forEach(n => { if (n) { expanded.add(n); expanded.add(n.toUpperCase()); expanded.add(toTitleCase(n)); }});
          return Array.from(expanded);
        };

        let assignedStudents = [];
        for (const a of assignments) {
          if (!a.grade) continue;
          const gradesToSearch = getGradeVariations(a.grade);
          const targetSec = String(a.section || 'A').toLowerCase().replace('section', '').trim();

          const { data: st } = await supabase
            .from(COLLECTIONS.STUDENTS)
            .select('id, section')
            .in('grade', gradesToSearch);
            
          const matched = (st || []).filter(s => {
            const dbSec = String(s.section || '').toLowerCase().replace('section', '').trim();
            return dbSec === targetSec || String(s.section || '').toLowerCase() === String(a.section || 'A').toLowerCase();
          });
          assignedStudents.push(...matched);
        }

        const studentIds = [...new Set(assignedStudents.map(s => s.id))];
        if (studentIds.length > 0) {
          query = query.in('student_id', studentIds);
        } else {
          return res.json({ success: true, data: [], pagination: { total: 0 } });
        }
      } else {
        return res.json({ success: true, data: [], pagination: { total: 0 } });
      }
    }
  }

  // Data Isolation for Students
  if (user.role === 'student') {
    const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', user.id);
    if (studentProfile) {
      query = query.eq('student_id', studentProfile.id);
    } else {
      return res.json({ success: true, data: [], pagination: { total: 0 } });
    }
  }

  // Apply filters directly in Supabase
  if (student) {
    query = query.eq('student_id', student);
  }
  
  if (date) {
    // Check if date is already in YYYY-MM-DD format, else parse it
    const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(String(date)) 
      ? String(date) 
      : new Date(date).toISOString().split('T')[0];
    query = query.eq('date', dateStr);
  }

  if (academic_year) {
    query = query.eq('academic_year', academic_year);
  }

  if (term) {
    query = query.eq('term', term);
  }

  // Pagination and sorting
  const offset = (page - 1) * limit;
  query = query
    .order('date', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  const { data: attendance, count, error } = await query;

  if (error) throw error;

  res.json({ 
    success: true, 
    data: attendance || [], 
    pagination: { 
      page: parseInt(page), 
      limit: parseInt(limit), 
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    } 
  });
});

// Record or update single attendance
const recordAttendance = asyncHandler(async (req, res) => {
  const { student, date, status, notes, course_id } = req.body;
  
  if (!student || !date || !status) {
    return res.status(400).json({ message: 'Student, date, and status are required' });
  }

  const d = new Date(date);
  if (d.getDay() === 0 || d.getDay() === 6) {
    return res.status(400).json({ message: 'Attendance can only be recorded for weekdays (Monday to Friday)' });
  }
  
  const dateStr = d.toISOString().split('T')[0];
  const user = req.user;

  // Security check for teachers
  if (user.role === 'teacher' || user.role === 'staff') {
    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
    if (!teacherProfile) {
      return res.status(403).json({ message: 'Teacher profile not found' });
    }

    const teacherId = teacherProfile.id;
    const studentData = await supabaseService.getById(COLLECTIONS.STUDENTS, student);
    if (!studentData) return res.status(404).json({ message: 'Student not found' });

    // Resolve class_id from grade string
    const studentGrade = studentData.grade;
    const academicClass = await supabaseService.getByField(COLLECTIONS.ACADEMIC_CLASSES, 'name', studentGrade);
    
    if (!academicClass) return res.status(403).json({ message: `Class mapping not found for student grade: ${studentGrade}` });
    const classId = academicClass.id;

    // Check if teacher is master of student's section
    const { data: isMaster } = await supabase
      .from(COLLECTIONS.SECTIONS)
      .select('id')
      .eq('class_id', classId)
      .eq('name', studentData.section)
      .eq('class_master_id', teacherId);
    
    if (!isMaster || isMaster.length === 0) {
        return res.status(403).json({ message: 'Access denied. You can only mark attendance for the class where you are the designated Master.' });
    }
  }

  // Fetch current settings for academic year and term
  const allSettings = await supabaseService.getAll('settings');
  const settings = allSettings && allSettings.length > 0 ? allSettings[0] : { current_session: '2024-2025', current_term: '1st' };

    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
    const resolvedMarkedBy = teacherProfile ? teacherProfile.id : user.id;

    const attendanceData = {
      student_id: student,
      date: dateStr,
      status,
      notes,
      arrival_time: req.body.arrival_time || null,
      course_id: course_id || null,
      period: req.body.period || 'General',
      academic_year: settings.current_session || '2024-2025',
      term: settings.current_term || '1st',
      marked_by: resolvedMarkedBy
    };

  // Upsert per (student_id, date, period) — allows multiple periods per day
  const result = await supabaseService.bulkUpsert(COLLECTIONS.ATTENDANCE, [attendanceData], { 
    onConflict: 'student_id,date,period' 
  });

  res.status(200).json({ success: true, data: result[0] });
});

// Bulk record attendance using efficient upsert
const bulkRecordAttendance = asyncHandler(async (req, res) => {
  const { records } = req.body;
  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'Records array is required' });
  }

  const user = req.user;
  
  // Fetch current settings
  const allSettings = await supabaseService.getAll('settings');
  const settings = allSettings && allSettings.length > 0 ? allSettings[0] : { current_session: '2024-2025', current_term: '1st' };

  const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
  const resolvedMarkedBy = teacherProfile ? teacherProfile.id : user.id;

  // Validate all records for weekend dates
  for (const record of records) {
    const d = new Date(record.date);
    if (d.getDay() === 0 || d.getDay() === 6) {
      return res.status(400).json({ message: 'Attendance can only be recorded for weekdays (Monday to Friday)' });
    }
  }

  const formattedRecords = records.map(record => {
    let dateStr;
    try {
      dateStr = new Date(record.date).toISOString().split('T')[0];
    } catch (e) {
      dateStr = new Date().toISOString().split('T')[0];
    }

    return {
      student_id: record.student_id || record.student,
      date: dateStr,
      status: record.status || 'present',
      notes: record.notes || '',
      arrival_time: record.arrival_time || null,
      course_id: (record.course_id && record.course_id !== 'undefined') ? record.course_id : null,
      period: record.period || 'General',
      academic_year: settings.current_session || '2024-2025',
      term: settings.current_term || '1st',
      marked_by: resolvedMarkedBy
    };
  });

  const result = await supabaseService.bulkUpsert(COLLECTIONS.ATTENDANCE, formattedRecords, { 
    onConflict: 'student_id,date,period' 
  });

  res.status(200).json({ success: true, data: result });
});

// Get student attendance
const getStudentAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const { studentId } = req.params;
  
  let queryStudentId = studentId;
  
  // If the ID looks like it could be a user_id (or if we just want to be safe)
  // we check if a student exists with this user_id
  const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', studentId);
  if (studentProfile) {
    queryStudentId = studentProfile.id;
  }
  
  let query = supabase
    .from(COLLECTIONS.ATTENDANCE)
    .select('*')
    .eq('student_id', queryStudentId);

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query.order('date', { ascending: false });
  if (error) throw error;

  res.json({ success: true, data: data || [] });
});

// Get attendance statistics
const getAttendanceStats = asyncHandler(async (req, res) => {
  const { academic_year, term } = req.query;
  
  let query = supabase.from(COLLECTIONS.ATTENDANCE).select('status');
  
  if (academic_year) query = query.eq('academic_year', academic_year);
  if (term) query = query.eq('term', term);

  const { data, error } = await query;
  if (error) throw error;
  
  const stats = {};
  data.forEach(record => {
    const status = record.status || 'unknown';
    stats[status] = (stats[status] || 0) + 1;
  });

  const statsArray = Object.entries(stats).map(([status, count]) => ({
    _id: status,
    count
  }));

  res.json({ success: true, data: statsArray });
});

// Get student attendance summary
const getStudentAttendanceSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  
  let queryStudentId = studentId;
  const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', studentId);
  if (studentProfile) {
    queryStudentId = studentProfile.id;
  }
  
  const { data, error } = await supabase
    .from(COLLECTIONS.ATTENDANCE)
    .select('status')
    .eq('student_id', queryStudentId);
    
  if (error) throw error;
  
  const total = data.length;
  // Legacy support: count 'late' as 'present' if any exist in DB
  const present = data.filter(r => ['present', 'Present', 'late', 'Late'].includes(r.status)).length;
  const absent = data.filter(r => ['absent', 'Absent'].includes(r.status)).length;
  
  const percentage = total > 0 ? (present / total) * 100 : 100;
  
  res.json({
    success: true,
    data: {
      total,
      present,
      absent,
      percentage: Math.round(percentage)
    }
  });
});

module.exports = { 
  getAllAttendance, 
  recordAttendance, 
  bulkRecordAttendance, 
  getStudentAttendance, 
  getAttendanceStats,
  getStudentAttendanceSummary
};

