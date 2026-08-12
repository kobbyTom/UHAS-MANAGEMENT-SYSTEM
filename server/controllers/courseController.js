const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Get all courses (academic assignments)
// @route   GET /api/courses
// @access  Private
const getAllCourses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, search, grade, section, academicYear } = req.query;
  let teacher = req.query.teacher;
  let query = supabase
    .from(COLLECTIONS.CLASS_SUBJECTS)
    .select('*, subject:subject_id(*), class:class_id(*), teacher:teacher_id(*)');

  // Optimize grade filtering at the DB level
  if (grade) {
    const gradesToSearch = [grade.trim()];
    const gradeLower = grade.toLowerCase().trim();
    if (gradeLower === 'jhs 1' || gradeLower === 'jhs1') gradesToSearch.push('Basic 7');
    if (gradeLower === 'jhs 2' || gradeLower === 'jhs2') gradesToSearch.push('Basic 8');
    if (gradeLower === 'jhs 3' || gradeLower === 'jhs3') gradesToSearch.push('Basic 9');
    if (gradeLower === 'basic 7') gradesToSearch.push('JHS 1');
    if (gradeLower === 'basic 8') gradesToSearch.push('JHS 2');
    if (gradeLower === 'basic 9') gradesToSearch.push('JHS 3');

    const { data: matchedClasses } = await supabase.from(COLLECTIONS.ACADEMIC_CLASSES).select('id').in('name', gradesToSearch);
    if (matchedClasses && matchedClasses.length > 0) {
      query = query.in('class_id', matchedClasses.map(c => c.id));
    } else {
      return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
    }
  }

  // Data Isolation for teachers
  if (req.user.role === 'teacher' || req.user.role === 'staff') {
    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', req.user.id);
    if (teacherProfile) {
      teacher = teacherProfile.id;
      
      // Get sections where they are Class Master
      const { data: masteredSections } = await supabase
        .from(COLLECTIONS.SECTIONS)
        .select('class_id, name')
        .eq('class_master_id', teacher);
      
      const masteredFilters = (masteredSections || []).map(s => `and(class_id.eq.${s.class_id},section.eq."${s.name}")`);
      
      if (masteredFilters.length > 0) {
        // Teacher sees: subjects they teach OR subjects in sections they master
        const orFilter = `teacher_id.eq.${teacher},${masteredFilters.join(',')}`;
        query = query.or(orFilter);
        teacher = null; // Clear to avoid redundant eq('teacher_id') later
      }
    } else {
      return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
    }
  }

  if (teacher) query = query.eq('teacher_id', teacher);
  
  // Normalize academic year (handle both 2024-2025 and 2024/2025)
  if (academicYear) {
    const yearWithDash = academicYear.replace('/', '-');
    const yearWithSlash = academicYear.replace('-', '/');
    query = query.or(`academic_year.eq."${yearWithDash}",academic_year.eq."${yearWithSlash}"`);
  }
  
  if (section) query = query.eq('section', section);
  
  try {
    const { data, error } = await query;
    if (error) {
      console.error('[BACKEND ERROR] Supabase query failed:', error);
      throw error;
    }

    // Transform data to match legacy 'courses' structure
    let transformedData = data.map(item => ({
      id: item.id,
      _id: item.id,
      name: item.subject?.name || 'Unknown Subject',
      code: item.subject?.code || 'N/A',
      grade: item.class?.name || 'N/A',
      section: item.section || 'A',
      teacher_id: item.teacher_id,
      teacher: item.teacher, // Explicitly include the teacher object
      academic_year: item.academic_year,
      room: item.room || 'N/A',
      credits: item.credits || 0,
      hoursPerWeek: item.hours_per_week || 0,
      is_active: true
    }));

    // Data Isolation for students
    if (req.user.role === 'student') {
      const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', req.user.id);
      
      if (studentProfile) {
        const studentGradeNorm = (studentProfile.grade || '').trim();
        
        transformedData = transformedData.filter(c => {
          const courseGradeNorm = (c.grade || '').trim();
          const matchesGrade = courseGradeNorm === studentGradeNorm;
          const matchesSection = !c.section || c.section === 'All' || c.section === studentProfile.section;
          
          return matchesGrade && matchesSection;
        });
      } else {
        return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
      }
    }

    // Manual filtering for grade and search (since they are in joined tables)
    if (grade) {
      transformedData = transformedData.filter(c => {
        const dbGrade = (c.grade || '').toLowerCase().trim();
        const queryGrade = grade.toLowerCase().trim();
        
        // Exact match or space-insensitive match
        if (dbGrade === queryGrade || dbGrade.replace(/\s/g, '') === queryGrade.replace(/\s/g, '')) return true;

        // JHS/Basic Mapping
        const isJHS1 = queryGrade.includes('jhs 1') || queryGrade === 'jhs1';
        const isJHS2 = queryGrade.includes('jhs 2') || queryGrade === 'jhs2';
        const isJHS3 = queryGrade.includes('jhs 3') || queryGrade === 'jhs3';
        
        if (isJHS1 && (dbGrade.includes('basic 7') || dbGrade === 'basic7')) return true;
        if (isJHS2 && (dbGrade.includes('basic 8') || dbGrade === 'basic8')) return true;
        if (isJHS3 && (dbGrade.includes('basic 9') || dbGrade === 'basic9')) return true;

        // Reverse JHS/Basic Mapping
        const isBasic7 = queryGrade.includes('basic 7') || queryGrade === 'basic7';
        const isBasic8 = queryGrade.includes('basic 8') || queryGrade === 'basic8';
        const isBasic9 = queryGrade.includes('basic 9') || queryGrade === 'basic9';

        if (isBasic7 && (dbGrade.includes('jhs 1') || dbGrade === 'jhs1')) return true;
        if (isBasic8 && (dbGrade.includes('jhs 2') || dbGrade === 'jhs2')) return true;
        if (isBasic9 && (dbGrade.includes('jhs 3') || dbGrade === 'jhs3')) return true;

        return false;
      });
    }

    if (search) {
      const searchWords = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
      transformedData = transformedData.filter(c => 
        searchWords.every(word =>
          c.name.toLowerCase().includes(word) || 
          c.code.toLowerCase().includes(word) ||
          (c.grade || '').toLowerCase().includes(word)
        )
      );
    }

    const total = transformedData.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = transformedData.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('[BACKEND CRASH] getAllCourses failed:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while fetching courses',
      error: err.message 
    });
  }
});

// @desc    Get single course
// @route   GET /api/courses/:id
const getCourseById = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from(COLLECTIONS.CLASS_SUBJECTS)
    .select(`
      *,
      subject:subject_id (*),
      class:class_id (*),
      teacher:teacher_id (*)
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !data) {
    return res.status(404).json({ message: 'Course assignment not found' });
  }

  res.json({
    success: true,
    data: {
      ...data,
      name: data.subject?.name,
      code: data.subject?.code,
      grade: data.class?.name,
      teacher: data.teacher,
      room: data.room || 'N/A',
      credits: data.credits || 0,
      hoursPerWeek: data.hours_per_week || 0
    }
  });
});

// @desc    Get courses by grade
const getCoursesByGrade = asyncHandler(async (req, res) => {
  const { grade } = req.params;
  
  const academicClass = await supabaseService.getByField(COLLECTIONS.ACADEMIC_CLASSES, 'name', grade);
  
  if (!academicClass) {
    return res.json({ success: true, data: [], count: 0 });
  }

  const { data, error } = await supabase
    .from(COLLECTIONS.CLASS_SUBJECTS)
    .select(`
      *,
      subject:subject_id (*),
      class:class_id (*),
      teacher:teacher_id (*)
    `)
    .eq('class_id', academicClass.id);

  if (error) throw error;
  
  let filteredData = data;
  
  // Data Isolation for students
  if (req.user.role === 'student') {
    const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', req.user.id);
    if (studentProfile) {
      // Already filtered by class_id, but double check section
      filteredData = data.filter(c => !c.section || c.section === 'All' || c.section === studentProfile.section);
    } else {
      return res.json({ success: true, data: [], count: 0 });
    }
  }

  const transformed = filteredData.map(item => ({
    ...item,
    name: item.subject?.name,
    code: item.subject?.code,
    grade: item.class?.name,
    teacher: item.teacher,
    room: item.room || 'N/A',
    credits: item.credits || 0,
    hoursPerWeek: item.hours_per_week || 0
  }));

  res.json({
    success: true,
    data: transformed,
    count: transformed.length
  });
});

const getCoursesByGradeQuery = asyncHandler(async (req, res) => {
    req.params.grade = req.query.grade;
    return getCoursesByGrade(req, res);
});

// @desc    Create course
const createCourse = asyncHandler(async (req, res) => {
  const { name, grade, section, academicYear, teacherId, teacher, room, credits, hoursPerWeek } = req.body;
  const tId = teacherId || teacher || null;
  const finalTeacherId = tId === '' ? null : tId;
  
  if (!name || !grade) {
    return res.status(400).json({ success: false, message: 'Subject name and Grade are required' });
  }

  // 1. Subject
  let subject = await supabaseService.getByField(COLLECTIONS.SUBJECTS, 'name', name);
  if (!subject) {
    subject = await supabaseService.create(COLLECTIONS.SUBJECTS, {
      name,
      code: name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000),
      category: 'Core'
    });
  }

  // 2. Class
  let academicClass = await supabaseService.getByField(COLLECTIONS.ACADEMIC_CLASSES, 'name', grade);
  if (!academicClass) {
    academicClass = await supabaseService.create(COLLECTIONS.ACADEMIC_CLASSES, {
      name: grade,
      level: grade.includes('JHS') ? 'JHS' : (grade.includes('KG') ? 'KG' : 'Basic')
    });
  }

  // 3. Assignment
  const updates = {
    class_id: academicClass.id,
    subject_id: subject.id,
    teacher_id: finalTeacherId,
    section: section || 'A',
    academic_year: academicYear || '2024/2025',
    room: room || '',
    credits: credits || 3,
    hours_per_week: hoursPerWeek || 3
  };

  try {
    const assignments = await supabaseService.bulkUpsert(COLLECTIONS.CLASS_SUBJECTS, [updates], {
      onConflict: 'class_id,subject_id,section'
    });
    const assignment = assignments[0];
    res.status(201).json({
      success: true,
      data: { ...assignment, name: subject.name, grade: academicClass.name }
    });
  } catch (err) {
    // Graceful handling for missing columns
    if (err.message?.includes('column') && err.message?.includes('not find')) {
      console.warn('Schema mismatch detected in class_subjects creation, attempting fallback...', err.message);
      
      const safeUpdates = { ...updates };
      const problematicField = err.message.match(/'([^']+)' column/)?.[1];
      
      if (problematicField && safeUpdates[problematicField]) {
        delete safeUpdates[problematicField];
        try {
          const fallback = await supabaseService.create(COLLECTIONS.CLASS_SUBJECTS, safeUpdates);
          return res.status(201).json({
            success: true,
            data: { ...fallback, name: subject.name, grade: academicClass.name },
            warning: `Field '${problematicField}' could not be saved due to database schema restrictions.`
          });
        } catch (innerErr) {
          throw innerErr;
        }
      }
    }
    throw err;
  }
});

// @desc    Update course
const updateCourse = asyncHandler(async (req, res) => {
  const { name, grade, teacherId, teacher, section, academicYear, room, credits, hoursPerWeek } = req.body;
  const tId = teacherId !== undefined ? teacherId : teacher;
  const finalTeacherId = tId === '' ? null : tId;
  
  const assignment = await supabaseService.getById(COLLECTIONS.CLASS_SUBJECTS, req.params.id);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

  let subjectId = assignment.subject_id;
  if (name) {
    let subject = await supabaseService.getByField(COLLECTIONS.SUBJECTS, 'name', name);
    if (!subject) {
      subject = await supabaseService.create(COLLECTIONS.SUBJECTS, {
        name,
        code: name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000),
        category: 'Core'
      });
    }
    subjectId = subject.id;
  }

  let classId = assignment.class_id;
  if (grade) {
    let academicClass = await supabaseService.getByField(COLLECTIONS.ACADEMIC_CLASSES, 'name', grade);
    if (!academicClass) {
      academicClass = await supabaseService.create(COLLECTIONS.ACADEMIC_CLASSES, {
        name: grade,
        level: grade.includes('JHS') ? 'JHS' : (grade.includes('KG') ? 'KG' : 'Basic')
      });
    }
    classId = academicClass.id;
  }

  const updates = {
    subject_id: subjectId,
    class_id: classId,
    teacher_id: finalTeacherId !== undefined ? finalTeacherId : assignment.teacher_id,
    section: section !== undefined ? section : assignment.section,
    academic_year: academicYear !== undefined ? academicYear : assignment.academic_year,
    room: room !== undefined ? room : assignment.room,
    credits: credits !== undefined ? credits : assignment.credits,
    hours_per_week: hoursPerWeek !== undefined ? hoursPerWeek : assignment.hours_per_week
  };

  try {
    const updated = await supabaseService.update(COLLECTIONS.CLASS_SUBJECTS, req.params.id, updates);
    res.json({ success: true, data: updated });
  } catch (err) {
    // Graceful handling for missing columns (e.g., section, academic_year)
    if (err.message?.includes('column') && err.message?.includes('not find')) {
      console.warn('Schema mismatch detected in class_subjects, attempting fallback...', err.message);
      
      const safeUpdates = { ...updates };
      const problematicField = err.message.match(/'([^']+)' column/)?.[1];
      
      if (problematicField && safeUpdates[problematicField]) {
        delete safeUpdates[problematicField];
        try {
          const fallback = await supabaseService.update(COLLECTIONS.CLASS_SUBJECTS, req.params.id, safeUpdates);
          return res.json({ 
            success: true, 
            data: fallback,
            warning: `Field '${problematicField}' could not be updated due to database schema restrictions.`
          });
        } catch (innerErr) {
          throw innerErr;
        }
      }
    }
    throw err;
  }
});

// @desc    Delete course
const deleteCourse = asyncHandler(async (req, res) => {
  await supabaseService.delete(COLLECTIONS.CLASS_SUBJECTS, req.params.id);
  res.json({ success: true, message: 'Course assignment deleted successfully' });
});

// @desc    Get course stats
const getCourseStats = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from(COLLECTIONS.CLASS_SUBJECTS).select('*, class:class_id (name)');
  if (error) throw error;

  const stats = {
    totalCourses: data.length,
    gradeDistribution: {}
  };

  data.forEach(item => {
    const gradeName = item.class?.name || 'Unknown';
    stats.gradeDistribution[gradeName] = (stats.gradeDistribution[gradeName] || 0) + 1;
  });

  res.json({ success: true, data: stats });
});

const enrollStudent = asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Enrollment is now handled via class sections.' });
});

const unenrollStudent = asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Unenrollment is now handled via class sections.' });
});

const syncStudentsWithClass = asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Synchronization is now handled via class sections.' });
});

module.exports = {
  getAllCourses,
  getCourseById,
  getCoursesByGrade,
  getCoursesByGradeQuery,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
  unenrollStudent,
  getCourseStats,
  syncStudentsWithClass
};
