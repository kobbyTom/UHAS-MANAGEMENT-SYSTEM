const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');

// Get all examinations with optional filtering
exports.getAllExams = asyncHandler(async (req, res) => {
  const { grade, term, academicYear } = req.query;
  const user = req.user;
  
  // Use a defensive base query
  let query = supabase.from(COLLECTIONS.EXAMS).select('*');
  
  // 1. Role-based Isolation Logic
  if (user.role === 'student') {
    const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', user.id);
    if (studentProfile && studentProfile.grade) {
      query = query.eq('class', studentProfile.grade);
    } else return res.status(200).json({ success: true, data: [] });
  } 
  else if (user.role === 'parent') {
    const { data: parentData } = await supabase.from(COLLECTIONS.PARENTS).select('student_ids').eq('user_id', user.id).single();
    if (parentData && parentData.student_ids && parentData.student_ids.length > 0) {
      // Get grades of all linked children
      const { data: children } = await supabase.from(COLLECTIONS.STUDENTS).select('grade').in('id', parentData.student_ids);
      const childGrades = [...new Set((children || []).map(c => c.grade).filter(Boolean))];
      if (childGrades.length > 0) {
        query = query.in('class', childGrades);
      } else return res.status(200).json({ success: true, data: [] });
    } else return res.status(200).json({ success: true, data: [] });
  }
  else if (user.role === 'teacher') {
    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
    let allowedGrades = [];
    if (teacherProfile && teacherProfile.grades && teacherProfile.grades.length > 0) {
      allowedGrades = [...teacherProfile.grades];
    }
    
    if (teacherProfile && teacherProfile.coordinator_block) {
      const block = String(teacherProfile.coordinator_block).toLowerCase().trim();
      const allClasses = await supabaseService.getAll(COLLECTIONS.ACADEMIC_CLASSES);
      const validClasses = allClasses.filter(c => c.name && c.name.toLowerCase().includes(block)).map(c => c.name);
      allowedGrades = [...allowedGrades, ...validClasses];
    }

    if (allowedGrades.length > 0) {
      query = query.in('class', allowedGrades);
    }
  }

  // 2. Global Filters
  if (grade) query = query.eq('class', grade);
  if (term) query = query.eq('term', term);
  if (academicYear) query = query.eq('academic_year', academicYear);

  // 3. Chronological Ordering
  const { data: exams, error } = await query.order('date', { ascending: true });
  
  if (error) {
    console.error('[GET ALL EXAMS ERROR]:', error.message);
    return res.status(200).json({ success: true, data: [] });
  }

  res.status(200).json({ success: true, data: exams || [] });
});

// Create a new examination schedule
exports.createExam = asyncHandler(async (req, res) => {
  const { data: settings } = await supabase.from(COLLECTIONS.SETTINGS).select('*').single();
  
  const examData = {
    ...req.body,
    academic_year: req.body.academicYear || req.body.academic_year || settings?.current_session,
    term: req.body.term || settings?.current_term || '1st'
  };
  
  const exam = await supabaseService.create(COLLECTIONS.EXAMS, examData);
  res.status(201).json({ success: true, data: exam });
});

// Update an existing examination
exports.updateExam = asyncHandler(async (req, res) => {
  const exam = await supabaseService.update(COLLECTIONS.EXAMS, req.params.id, req.body);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam configuration not found' });
  res.status(200).json({ success: true, data: exam });
});

// Delete an examination record
exports.deleteExam = asyncHandler(async (req, res) => {
  await supabaseService.delete(COLLECTIONS.EXAMS, req.params.id);
  res.status(200).json({ success: true, message: 'Exam session successfully terminated' });
});

// Retrieve comprehensive examination results
exports.getExamResults = asyncHandler(async (req, res) => {
  const { grade, studentId, term, academicYear } = req.query;
  const user = req.user;

  // 1. Fetch base grades
  let query = supabase.from(COLLECTIONS.GRADES).select('*');

  // Role-based Isolation
  if (user.role === 'student') {
    const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', user.id);
    if (studentProfile) query = query.eq('student_id', studentProfile.id);
    else return res.json({ success: true, data: [] });
  } else if (user.role === 'parent') {
    const { data: parentData } = await supabase.from(COLLECTIONS.PARENTS).select('student_ids').eq('user_id', user.id).single();
    if (parentData && parentData.student_ids && parentData.student_ids.length > 0) {
      query = query.in('student_id', parentData.student_ids);
    } else return res.json({ success: true, data: [] });
  }

  // Filters
  if (studentId) query = query.eq('student_id', studentId);
  if (term) query = query.eq('term', term);
  if (academicYear) query = query.eq('academic_year', academicYear);

  const { data: grades, error: gradesError } = await query.order('created_at', { ascending: false });
  if (gradesError) throw gradesError;

  if (!grades || grades.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  // 2. Fetch related data for mapping (Manual Join)
  const [students, courses, subjects, classes] = await Promise.all([
    supabaseService.getAll(COLLECTIONS.STUDENTS),
    supabaseService.getAll(COLLECTIONS.COURSES),
    supabaseService.getAll(COLLECTIONS.SUBJECTS),
    supabaseService.getAll(COLLECTIONS.ACADEMIC_CLASSES)
  ]);

  // Transform to high-fidelity schema for frontend
  const results = grades.map(g => {
    const student = students.find(s => s.id === g.student_id);
    const course = courses.find(c => c.id === g.course_id);
    const subject = course ? subjects.find(s => s.id === course.subject_id) : null;
    const classData = course ? classes.find(c => c.id === course.class_id) : null;

    // Extract Exam Score specifically from assessments if present
    let examAssessment = null;
    if (Array.isArray(g.assessments)) {
      examAssessment = g.assessments.find(a => 
        a.name?.toLowerCase().includes('exam') || a.name?.toLowerCase().includes('final')
      );
    } else if (g.assessments && typeof g.assessments === 'object') {
      const score = Number(g.assessments.finalExam || g.assessments.final || 0);
      if (score > 0) examAssessment = { score, maxScore: 100 };
    }

    return {
      id: g.id,
      studentId: g.student_id,
      studentName: student ? `${student.first_name} ${student.last_name}` : 'Unknown Scholar',
      admissionNumber: student?.admission_number,
      section: student?.section || 'Yellow',
      subject: subject?.name || 'General Subject',
      grade: classData?.name || g.term,
      score: examAssessment ? examAssessment.score : g.total_score,
      maxScore: examAssessment ? examAssessment.maxScore : 100,
      letterGrade: g.letter_grade,
      examName: `${g.term} Evaluation`,
      academicYear: g.academic_year,
      term: g.term,
      isFinalized: g.is_finalized,
      updatedAt: g.updated_at
    };
  });

  res.status(200).json({ success: true, data: results });
});