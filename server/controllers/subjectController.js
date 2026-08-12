const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
const getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await supabaseService.getAll(COLLECTIONS.SUBJECTS, {
    orderBy: 'name',
    orderDirection: 'asc'
  });

  // Fetch live allocations to calculate counts
  const { data: allocations } = await supabase.from(COLLECTIONS.CLASS_SUBJECTS).select('subject_id, teacher_id, class_id');
  
  const enrichedSubjects = subjects.map(s => {
    const subjectAllocations = (allocations || []).filter(a => a.subject_id === s.id);
    const uniqueTeachers = new Set(subjectAllocations.map(a => a.teacher_id).filter(Boolean));
    const uniqueClasses = new Set(subjectAllocations.map(a => a.class_id).filter(Boolean));
    
    return {
      ...s,
      teacherCount: uniqueTeachers.size,
      classCount: uniqueClasses.size
    };
  });

  res.json({
    success: true,
    data: enrichedSubjects
  });
});

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private (Admin)
const createSubject = asyncHandler(async (req, res) => {
  const { name, code, description, category } = req.body;

  const subject = await supabaseService.create(COLLECTIONS.SUBJECTS, {
    name,
    code,
    description,
    category: category || 'Core'
  });

  res.status(201).json({
    success: true,
    data: subject
  });
});

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Admin)
const updateSubject = asyncHandler(async (req, res) => {
  const { name, code, description, category } = req.body;

  const updatedSubject = await supabaseService.update(COLLECTIONS.SUBJECTS, req.params.id, {
    name,
    code,
    description,
    category
  });

  res.json({
    success: true,
    data: updatedSubject
  });
});

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (Admin)
const deleteSubject = asyncHandler(async (req, res) => {
  await supabaseService.delete(COLLECTIONS.SUBJECTS, req.params.id);
  res.json({
    success: true,
    message: 'Subject deleted successfully'
  });
});

module.exports = {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject
};
