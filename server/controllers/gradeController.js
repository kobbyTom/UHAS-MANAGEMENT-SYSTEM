const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Get all grades
// @route   GET /api/grades
// @access  Private
const getAllGrades = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, student, academicYear, term } = req.query;
  let course = req.query.course;
  const user = req.user;

  // Data Isolation for Teachers
  let teacherCourseIds = null;
  if (user.role === 'teacher' || user.role === 'staff') {
    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
    if (teacherProfile) {
      const teacherCourses = await supabaseService.getAll(COLLECTIONS.COURSES);
      teacherCourseIds = teacherCourses
        .filter(c => (c.teacher_id || c.teacher) === teacherProfile.id)
        .map(c => c.id);
        
      // Coordinator Logic
      let coordinatorCourseIds = [];
      if (teacherProfile.coordinator_block) {
        const block = String(teacherProfile.coordinator_block).toLowerCase().trim();
        const allClasses = await supabaseService.getAll(COLLECTIONS.ACADEMIC_CLASSES);
        const validClasses = allClasses.filter(c => c.name && c.name.toLowerCase().includes(block)).map(c => c.id);
        
        coordinatorCourseIds = teacherCourses.filter(cs => validClasses.includes(cs.class_id)).map(cs => cs.id);
      }
      
      teacherCourseIds = [...teacherCourseIds, ...coordinatorCourseIds];
      
      // If course is requested, ensure it's one of the teacher's courses
      if (course && !teacherCourseIds.includes(course)) {
        return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
      }
    } else {
      return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
    }
  }

  let grades = await supabaseService.getAll(COLLECTIONS.GRADES, { 
    orderBy: 'created_at', 
    orderDirection: 'desc',
    limit: limit === 'none' || parseInt(limit) > 1000 ? null : parseInt(limit)
  });

  // Filter by teacher's courses ONLY if a specific course was requested
  // This allows teachers to see all grades for reporting, while still isolating their active marks entry view
  if (teacherCourseIds && course) {
    grades = grades.filter(g => teacherCourseIds.includes(g.course_id || g.course));
  }

  // Data Isolation for Students
  if (user.role === 'student') {
    const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', user.id);
    if (studentProfile) {
      grades = grades.filter(g => (g.student_id || g.student) === studentProfile.id);
    } else {
      return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
    }
  }

  if (course) {
    grades = grades.filter(g => (g.course_id || g.course) === course);
  }
  if (academicYear) {
    grades = grades.filter(g => (g.academic_year || g.academicYear) === academicYear);
  }
  if (term) {
    grades = grades.filter(g => g.term === term);
  }

  // Pagination — handle limit='none' for unlimited fetch
  const total = grades.length;
  if (limit === 'none') {
    return res.json({ 
      success: true, 
      data: grades, 
      pagination: { page: 1, limit: grades.length, total, pages: 1 } 
    });
  }
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedGrades = grades.slice(startIndex, endIndex);

  res.json({ 
    success: true, 
    data: paginatedGrades, 
    pagination: { 
      page: pageNum, 
      limit: limitNum, 
      total,
      pages: Math.ceil(total / limitNum)
    } 
  });
});

// @desc    Get single grade
// @route   GET /api/grades/:id
// @access  Private
const getGradeById = asyncHandler(async (req, res) => {
  const grade = await supabaseService.getById(COLLECTIONS.GRADES, req.params.id);
  
  if (!grade) {
    return res.status(404).json({ message: 'Grade not found' });
  }
  
  res.json({ success: true, data: grade });
});

// @desc    Create grade
// @route   POST /api/grades
// @access  Private (Teacher, Admin)
const createGrade = asyncHandler(async (req, res) => {
  const { studentId, courseId, academicYear, term, assessments, totalScore, letterGrade, gradePoint, teacherRemarks } = req.body;
  const user = req.user;

  // Security check for teachers
  if (user.role === 'teacher' || user.role === 'staff') {
    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
    if (!teacherProfile) return res.status(403).json({ message: 'Teacher profile not found' });
    
    // Verify course belongs to teacher
    const courseData = await supabaseService.getById(COLLECTIONS.COURSES, courseId);
    
    let isCoordinator = false;
    if (teacherProfile.coordinator_block && courseData) {
      const block = String(teacherProfile.coordinator_block).toLowerCase().trim();
      const classData = await supabaseService.getById(COLLECTIONS.ACADEMIC_CLASSES, courseData.class_id);
      if (classData && classData.name && classData.name.toLowerCase().includes(block)) {
        isCoordinator = true;
      }
    }

    if (!courseData || (courseData.teacher_id !== teacherProfile.id && courseData.teacher !== teacherProfile.id && !isCoordinator)) {
      return res.status(403).json({ message: 'Access denied. You can only record grades for your own classes.' });
    }
  }
  
  // Fetch current settings for academic year and term
  const allSettings = await supabaseService.getAll('settings');
  const settings = allSettings && allSettings.length > 0 ? allSettings[0] : { current_session: '2024-2025', current_term: '1st' };

  const gradeData = {
    student_id: studentId,
    course_id: courseId,
    academic_year: academicYear || settings.current_session || '2024-2025',
    term: term || settings.current_term || '1st',
    assessments: assessments || [],
    total_score: totalScore || 0,
    letter_grade: letterGrade || 'N/A',
    grade_point: gradePoint || 0,
    teacher_remarks: teacherRemarks
  };

  const grade = await supabaseService.create(COLLECTIONS.GRADES, gradeData);
  res.status(201).json({ success: true, data: grade });
});

// @desc    Update grade
// @route   PUT /api/grades/:id
// @access  Private (Teacher, Admin)
const updateGrade = asyncHandler(async (req, res) => {
  const grade = await supabaseService.getById(COLLECTIONS.GRADES, req.params.id);
  
  if (!grade) {
    return res.status(404).json({ message: 'Grade not found' });
  }
  
  const fieldMapping = {
    studentId: 'student_id',
    courseId: 'course_id',
    academicYear: 'academic_year',
    term: 'term',
    assessments: 'assessments',
    totalScore: 'total_score',
    letterGrade: 'letter_grade',
    gradePoint: 'grade_point',
    teacherRemarks: 'teacher_remarks',
    isFinalized: 'is_finalized'
  };

  const updates = {};
  Object.keys(fieldMapping).forEach(frontendField => {
    if (req.body[frontendField] !== undefined) {
      updates[fieldMapping[frontendField]] = req.body[frontendField];
    }
  });

  const updatedGrade = await supabaseService.update(
    COLLECTIONS.GRADES,
    req.params.id,
    updates
  );
  
  res.json({ success: true, data: updatedGrade });
});

// @desc    Delete grade
// @route   DELETE /api/grades/:id
// @access  Private (Admin)
const deleteGrade = asyncHandler(async (req, res) => {
  const grade = await supabaseService.getById(COLLECTIONS.GRADES, req.params.id);
  
  if (!grade) {
    return res.status(404).json({ message: 'Grade not found' });
  }
  
  await supabaseService.delete(COLLECTIONS.GRADES, req.params.id);
  
  res.json({ success: true, message: 'Grade deleted successfully' });
});

// @desc    Bulk create grades
// @route   POST /api/grades/bulk
// @access  Private (Teacher)
const bulkCreateGrades = asyncHandler(async (req, res) => {
  const user = req.user;

  // Access Control: only teachers (and staff) can submit marks. Admins are view-only.
  if (user.role === 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Only teachers can enter or modify student marks.' 
    });
  }
  
  let teacherProfile = null;
  if (user.role === 'teacher' || user.role === 'staff') {
    teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
  }

  const { grades } = req.body;
  
  if (!grades || !Array.isArray(grades) || grades.length === 0) {
    return res.status(400).json({ success: false, message: 'No grades provided' });
  }

  // Term mapping helper
  const mapTerm = (term) => {
    if (!term) return '1st';
    const t = term.toLowerCase();
    if (t.includes('first') || t === '1st') return '1st';
    if (t.includes('second') || t === '2nd') return '2nd';
    if (t.includes('third') || t === '3rd') return '3rd';
    if (t.includes('fourth') || t === '4th') return '4th';
    return '1st';
  };
  
  const createdGrades = [];
  const updatedGrades = [];
  const failedGrades = [];

  // Use the year/term from the first record for matching
  const academicYear = grades[0]?.academic_year;
  const rawTerm = grades[0]?.term;
  const mappedTerm = mapTerm(rawTerm);

  console.log(`[BULK GRADES] Processing ${grades.length} grades for ${academicYear}, ${mappedTerm}`);

  // Fetch all existing grades for this year and term to check for updates
  // We cannot rely on just the first courseId because deduplicated subjects contain multiple courseIds
  let existingGrades = [];
  try {
    const allGrades = await supabaseService.getAll(COLLECTIONS.GRADES);
    existingGrades = allGrades.filter(g => 
      (g.academic_year === academicYear || g.academicYear === academicYear) &&
      g.term === mappedTerm
    );
  } catch (err) {
    console.error('[BULK GRADES] Failed to fetch existing grades:', err.message);
  }

  for (const grade of grades) {
    if (!grade.student_id || !grade.course_id) continue;
    
    if (teacherProfile) {
      const courseData = await supabaseService.getById(COLLECTIONS.COURSES, grade.course_id);
      let isCoordinator = false;
      if (teacherProfile.coordinator_block && courseData) {
        const block = String(teacherProfile.coordinator_block).toLowerCase().trim();
        const classData = await supabaseService.getById(COLLECTIONS.ACADEMIC_CLASSES, courseData.class_id);
        if (classData && classData.name && classData.name.toLowerCase().includes(block)) {
          isCoordinator = true;
        }
      }
      if (courseData && courseData.teacher_id !== teacherProfile.id && courseData.teacher !== teacherProfile.id && !isCoordinator) {
         failedGrades.push({ name: grade.student_name, error: 'Access denied to this course' });
         continue;
      }
    }
    
    const finalTerm = mapTerm(grade.term);
      const cat1 = parseInt(grade.cat1) || 0;
      const gw = parseInt(grade.gw) || 0;
      const cat2 = parseInt(grade.cat2) || 0;
      const pw = parseInt(grade.pw) || 0;
      const exam = parseInt(grade.exam) || 0;
      const rawTotal = cat1 + gw + cat2 + pw + exam;
      const percentage = Math.round(rawTotal / 2);

      const gradeData = {
        student_id: grade.student_id,
        course_id: grade.course_id,
        academic_year: grade.academic_year,
        term: finalTerm,
        assessments: [
          { name: 'Cat1', score: cat1, maxScore: 25 },
          { name: 'GW', score: gw, maxScore: 25 },
          { name: 'Cat2', score: cat2, maxScore: 25 },
          { name: 'PW', score: pw, maxScore: 25 },
          { name: 'Exam', score: exam, maxScore: 100 }
        ],
        total_score: rawTotal,
        letter_grade: grade.grade || '9',
        grade_point: parseInt(grade.grade) || 9,
        remarks: grade.remarks || 'Satisfactory'
      };

    const existing = existingGrades.find(g => 
      (String(g.student_id) === String(grade.student_id) || String(g.student) === String(grade.student_id)) &&
      (String(g.course_id) === String(grade.course_id) || String(g.course) === String(grade.course_id))
    );

    try {
      if (existing) {
        const updated = await supabaseService.update(COLLECTIONS.GRADES, existing.id, gradeData);
        updatedGrades.push(updated);
      } else {
        const newGrade = await supabaseService.create(COLLECTIONS.GRADES, gradeData);
        createdGrades.push(newGrade);
      }
    } catch (err) {
      failedGrades.push({ name: grade.student_name, error: err.message });
    }
  }

  res.status(201).json({ 
    success: true, 
    data: [...createdGrades, ...updatedGrades], 
    count: createdGrades.length + updatedGrades.length,
    failed: failedGrades 
  });
});

// @desc    Get student grades
// @route   GET /api/grades/student/:studentId
// @access  Private
const getStudentGrades = asyncHandler(async (req, res) => {
  const { academicYear, term } = req.query;
  
  let queryStudentId = req.params.studentId;
  
  // Try to resolve auth ID to student record ID
  const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', queryStudentId);
  if (studentProfile) {
    queryStudentId = studentProfile.id;
  }
  
  const supabase = require('../config/supabase');
  let { data: grades, error } = await supabase.from(COLLECTIONS.GRADES)
    .select('*, course:course_id(subject:subject_id(name), class:class_id(name))')
    .eq('student_id', queryStudentId);
    
  if (error) {
    grades = [];
  } else if (grades) {
    // Map the joined data so frontend gets subject and courseName
    grades = grades.map(g => ({
      ...g,
      subject: g.course?.subject?.name || 'General Subject',
      courseName: g.course?.subject?.name || 'General Subject',
      className: g.course?.class?.name || g.term
    }));
  }

  if (academicYear) {
    grades = grades.filter(g => (g.academic_year || g.academicYear) === academicYear);
  }
  if (term) {
    grades = grades.filter(g => g.term === term);
  }

  res.json({ success: true, data: grades });
});

// @desc    Get course grades
// @route   GET /api/grades/course/:courseId
// @access  Private
const getCourseGrades = asyncHandler(async (req, res) => {
  const { academicYear, term } = req.query;
  const supabase = require('../config/supabase');
  
  let { data: grades, error } = await supabase
    .from(COLLECTIONS.GRADES)
    .select('*')
    .eq('course_id', req.params.courseId)
    .order('updated_at', { ascending: false });

  if (error || !grades) grades = [];

  if (academicYear) {
    grades = grades.filter(g => (g.academic_year || g.academicYear) === academicYear);
  }
  if (term) {
    grades = grades.filter(g => g.term === term);
  }

  res.json({ success: true, data: grades });
});

// @desc    Get grade statistics
// @route   GET /api/grades/stats/overview
// @access  Private (Admin)
const getGradeStats = asyncHandler(async (req, res) => {
  const grades = await supabaseService.getAll(COLLECTIONS.GRADES);
  
  const totalScores = grades.reduce((sum, g) => sum + (g.total_score || g.score || 0), 0);
  const avgScore = grades.length > 0 ? totalScores / grades.length : 0;

  res.json({ 
    success: true, 
    data: { averageScore: avgScore } 
  });
});

module.exports = { 
  getAllGrades, 
  getGradeById, 
  createGrade, 
  updateGrade, 
  deleteGrade, 
  bulkCreateGrades, 
  getStudentGrades, 
  getCourseGrades, 
  getGradeStats 
};

