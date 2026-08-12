const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Get all sections
// @route   GET /api/sections
// @access  Private
const getAllSections = asyncHandler(async (req, res) => {
  let query = supabase
    .from(COLLECTIONS.SECTIONS)
    .select('*, class:class_id (name)');
  
  if (req.user.role === 'teacher') {
    const teacher = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', req.user.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    // Get sections where the teacher is master
    // AND sections where they teach subjects
    const { data: subjectAssignments } = await supabase
      .from(COLLECTIONS.CLASS_SUBJECTS)
      .select('section, class_id')
      .eq('teacher_id', teacher.id);
    
    const assignedSectionNames = (subjectAssignments || []).map(a => a.section);
    const assignedClassIds = (subjectAssignments || []).map(a => a.class_id);

    // Filter query: master of section OR (class matches AND name matches)
    // Supabase or() filter is a bit limited for cross-table complex conditions, 
    // so we'll fetch and filter in JS if needed, or use a complex or string.
    // Let's fetch all sections for these classes and filter in JS for better accuracy.
    if (assignedClassIds.length > 0) {
        query = query.or(`class_master_id.eq.${teacher.id},class_id.in.(${assignedClassIds.join(',')})`);
    } else {
        query = query.eq('class_master_id', teacher.id);
    }
  }

  const { data: sections, error } = await query;
    
  if (error) throw error;

  let transformed = sections.map(s => ({
    ...s,
    class_name: s.class?.name,
    grade: s.class?.name // Compatibility alias
  }));

  // Further refinement for teachers: if they are in the class but not for ALL sections of that class
  if (req.user.role === 'teacher') {
    const teacher = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', req.user.id);
    const { data: subjectAssignments } = await supabase
      .from(COLLECTIONS.CLASS_SUBJECTS)
      .select('section, class_id')
      .eq('teacher_id', teacher.id);
    
    const assignments = subjectAssignments || [];
    
    transformed = transformed.filter(s => {
      // Keep if master
      if (s.class_master_id === teacher.id) return true;
      // Keep if teaches subject in this class and section
      return assignments.some(a => a.class_id === s.class_id && a.section === s.name);
    });
  }
    
  res.json({
    success: true,
    data: transformed
  });
});

// @desc    Create new section
// @route   POST /api/sections
// @access  Private (Admin)
const createSection = asyncHandler(async (req, res) => {
  const { class_id, name, class_master_id } = req.body;

  const section = await supabaseService.create(COLLECTIONS.SECTIONS, {
    class_id,
    name,
    class_master_id: class_master_id || null
  });

  res.status(201).json({
    success: true,
    data: section
  });
});

// @desc    Update section
// @route   PUT /api/sections/:id
// @access  Private (Admin)
const updateSection = asyncHandler(async (req, res) => {
  const { name, class_master_id } = req.body;

  const updatedSection = await supabaseService.update(COLLECTIONS.SECTIONS, req.params.id, {
    name,
    class_master_id: class_master_id === undefined ? undefined : (class_master_id || null)
  });

  res.json({
    success: true,
    data: updatedSection
  });
});

// @desc    Delete section
// @route   DELETE /api/sections/:id
// @access  Private (Admin)
const deleteSection = asyncHandler(async (req, res) => {
  await supabaseService.delete(COLLECTIONS.SECTIONS, req.params.id);
  res.json({
    success: true,
    message: 'Section deleted successfully'
  });
});

module.exports = {
  getAllSections,
  createSection,
  updateSection,
  deleteSection
};
