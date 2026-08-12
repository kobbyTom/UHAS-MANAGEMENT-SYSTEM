const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Get all academic classes
// @route   GET /api/classes
// @access  Private
const getAllClasses = asyncHandler(async (req, res) => {
  let teacherProfile = null;
  if (req.user.role === 'teacher') {
    teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', req.user.id);
    if (!teacherProfile) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }
  }

  // Fetch all classes first
  let query = supabase.from(COLLECTIONS.ACADEMIC_CLASSES).select('*');
  
  if (teacherProfile) {
    // Get class IDs where the teacher is assigned
    const { data: sectionAssignments } = await supabase.from(COLLECTIONS.SECTIONS).select('class_id').eq('class_master_id', teacherProfile.id);
    const { data: subjectAssignments } = await supabase.from(COLLECTIONS.CLASS_SUBJECTS).select('class_id').eq('teacher_id', teacherProfile.id);
    
    const classIds = new Set([
      ...(sectionAssignments || []).map(s => s.class_id),
      ...(subjectAssignments || []).map(s => s.class_id)
    ]);

    if (classIds.size === 0) {
      return res.json({ success: true, data: [] });
    }
    query = query.in('id', Array.from(classIds));
  } else {
    query = query.order('name', { ascending: true });
  }

  const { data: classes, error } = await query;
  if (error) throw error;

  // Enrich classes with sections and subjects using joins
  const enrichedClasses = await Promise.all(classes.map(async (cls) => {
    // 1. Fetch sections
    let sectionsQuery = supabase.from(COLLECTIONS.SECTIONS).select('*').eq('class_id', cls.id);
    const { data: sectionsData } = await sectionsQuery;
    let sections = sectionsData || [];

    // 2. Fetch subject assignments with details
    const { data: classSubjects } = await supabase
      .from(COLLECTIONS.CLASS_SUBJECTS)
      .select(`
        *,
        subject:subject_id (*),
        teacher:teacher_id (*)
      `)
      .eq('class_id', cls.id);
    
    const assignments = classSubjects || [];

    // Filter sections for teachers
    if (teacherProfile) {
      const assignedSectionNames = assignments
        .filter(a => a.teacher_id === teacherProfile.id)
        .map(a => a.section);
      
      sections = sections.filter(s => s.class_master_id === teacherProfile.id || assignedSectionNames.includes(s.name));
    }

    // Group subjects
    const groupedSubjects = [];
    const processedSubjectIds = new Set();
    
    assignments.forEach(item => {
      if (item.subject) {
        if (!processedSubjectIds.has(item.subject.id)) {
          groupedSubjects.push({
            ...item.subject,
            teachers: item.teacher ? [item.teacher] : [],
            sections: [item.section]
          });
          processedSubjectIds.add(item.subject.id);
        } else {
          const existing = groupedSubjects.find(s => s.id === item.subject.id);
          if (item.teacher && !existing.teachers.find(t => t.id === item.teacher.id)) {
            existing.teachers.push(item.teacher);
          }
          if (!existing.sections.includes(item.section)) {
            existing.sections.push(item.section);
          }
        }
      }
    });

    return {
      ...cls,
      sections,
      subjects: groupedSubjects
    };
  }));

  res.json({
    success: true,
    data: enrichedClasses
  });
});

// @desc    Create new academic class
// @route   POST /api/classes
// @access  Private (Admin)
const createClass = asyncHandler(async (req, res) => {
  const { name, academic_year } = req.body;

  const newClass = await supabaseService.create(COLLECTIONS.ACADEMIC_CLASSES, {
    name,
    academic_year: academic_year || '2024/2025'
  });

  res.status(201).json({
    success: true,
    data: newClass
  });
});

// @desc    Update academic class
// @route   PUT /api/classes/:id
// @access  Private (Admin)
const updateClass = asyncHandler(async (req, res) => {
  const { name, academic_year } = req.body;

  const updatedClass = await supabaseService.update(COLLECTIONS.ACADEMIC_CLASSES, req.params.id, {
    name,
    academic_year
  });

  res.json({
    success: true,
    data: updatedClass
  });
});

// @desc    Delete academic class
// @route   DELETE /api/classes/:id
// @access  Private (Admin)
const deleteClass = asyncHandler(async (req, res) => {
  await supabaseService.delete(COLLECTIONS.ACADEMIC_CLASSES, req.params.id);
  res.json({
    success: true,
    message: 'Class deleted successfully'
  });
});

// @desc    Assign subjects to class
// @route   POST /api/classes/:id/subjects
// @access  Private (Admin)
const assignSubjects = asyncHandler(async (req, res) => {
  const { subjectIds } = req.body;
  const classId = req.params.id;

  // 1. Get current assignments for this class
  const { data: currentAssignments } = await supabase
    .from(COLLECTIONS.CLASS_SUBJECTS)
    .select('subject_id')
    .eq('class_id', classId);
  
  const currentSubjectIds = Array.from(new Set((currentAssignments || []).map(a => a.subject_id)));
  
  // 2. Determine changes
  const subjectsToAdd = subjectIds.filter(id => !currentSubjectIds.includes(id));
  const subjectsToRemove = currentSubjectIds.filter(id => !subjectIds.includes(id));

  // 3. Remove subjects no longer assigned
  if (subjectsToRemove.length > 0) {
    await supabase
      .from(COLLECTIONS.CLASS_SUBJECTS)
      .delete()
      .eq('class_id', classId)
      .in('subject_id', subjectsToRemove);
  }

  // 4. Add new subjects for all sections
  if (subjectsToAdd.length > 0) {
    const { data: sections } = await supabase.from(COLLECTIONS.SECTIONS).select('name').eq('class_id', classId);
    const sectionNames = sections && sections.length > 0 ? sections.map(s => s.name) : ['A'];

    for (const subjectId of subjectsToAdd) {
      for (const sectionName of sectionNames) {
        try {
          await supabaseService.create(COLLECTIONS.CLASS_SUBJECTS, {
            class_id: classId,
            subject_id: subjectId,
            section: sectionName
          });
        } catch (err) {
          // Ignore conflict errors
        }
      }
    }
  }

  res.json({
    success: true,
    message: 'Curriculum synchronized successfully'
  });
});

module.exports = {
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
  assignSubjects
};
