const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Get all grade masters
// @route   GET /api/grades/masters
// @access  Private
const getAllGradeMasters = asyncHandler(async (req, res) => {
  const masters = await supabaseService.getAll(COLLECTIONS.GRADE_MASTERS);
  res.json({
    success: true,
    data: masters
  });
});

// @desc    Get grade master by grade
// @route   GET /api/grades/masters/:grade
// @access  Private
const getGradeMasterByGrade = asyncHandler(async (req, res) => {
  const { grade } = req.params;
  const master = await supabaseService.getByField(COLLECTIONS.GRADE_MASTERS, 'grade', grade);
  
  res.json({
    success: true,
    data: master
  });
});

// @desc    Assign or update grade master
// @route   POST /api/grades/masters
// @access  Private (Admin)
const assignGradeMaster = asyncHandler(async (req, res) => {
  const { grade, teacherId, academicYear = '2024/2025' } = req.body;

  if (!grade || !teacherId) {
    return res.status(400).json({ message: 'Grade and Teacher ID are required' });
  }

  // Check if mapping already exists
  const existingMapping = await supabaseService.getByField(COLLECTIONS.GRADE_MASTERS, 'grade', grade);

  let result;
  if (existingMapping) {
    // Update existing
    result = await supabaseService.update(COLLECTIONS.GRADE_MASTERS, existingMapping.id, {
      teacher_id: teacherId,
      academic_year: academicYear
    });
  } else {
    // Create new
    result = await supabaseService.create(COLLECTIONS.GRADE_MASTERS, {
      grade,
      teacher_id: teacherId,
      academic_year: academicYear
    });
  }

  // Also update teacher's class_teacher_of field for better visibility
  try {
    const teacher = await supabaseService.getById(COLLECTIONS.TEACHERS, teacherId);
    if (teacher) {
      await supabaseService.update(COLLECTIONS.TEACHERS, teacherId, {
        class_teacher_of: grade // This might be overwritten if they are master of multiple things, but usually it's one grade
      });
    }
  } catch (err) {
    console.warn('Could not update teacher profile:', err.message);
  }

  res.json({
    success: true,
    data: result
  });
});

module.exports = {
  getAllGradeMasters,
  getGradeMasterByGrade,
  assignGradeMaster
};
