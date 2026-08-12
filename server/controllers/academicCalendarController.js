const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorMiddleware');

const mapCalendarToFrontend = (c) => {
  if (!c) return null;
  return {
    id: c.id,
    academicYear: c.academic_year,
    term: c.term,
    week: c.week,
    dateRange: c.date_range,
    activity: c.activity,
    status: c.status,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  };
};

// @desc    Get all academic calendar entries
// @route   GET /api/academic-calendar
// @access  Private (All Roles)
const getAllCalendarEntries = asyncHandler(async (req, res) => {
  const entries = await supabaseService.getAll(COLLECTIONS.ACADEMIC_CALENDAR, { 
    orderBy: 'created_at', 
    orderDirection: 'asc' 
  });
  res.json({ success: true, data: entries.map(mapCalendarToFrontend) });
});

// @desc    Create new academic calendar entry
// @route   POST /api/academic-calendar
// @access  Private (Admin)
const createCalendarEntry = asyncHandler(async (req, res) => {
  const { academicYear, term, week, dateRange, activity, status } = req.body;
  
  const entryData = {
    academic_year: academicYear,
    term: term,
    week: week,
    date_range: dateRange,
    activity: activity,
    status: status || '',
    created_by: req.user.id
  };

  const entry = await supabaseService.create(COLLECTIONS.ACADEMIC_CALENDAR, entryData);
  res.status(201).json({ success: true, data: mapCalendarToFrontend(entry) });
});

// @desc    Update academic calendar entry
// @route   PUT /api/academic-calendar/:id
// @access  Private (Admin)
const updateCalendarEntry = asyncHandler(async (req, res) => {
  const entry = await supabaseService.getById(COLLECTIONS.ACADEMIC_CALENDAR, req.params.id);
  if (!entry) return res.status(404).json({ message: 'Calendar entry not found' });
  
  const fieldMapping = {
    academicYear: 'academic_year',
    term: 'term',
    week: 'week',
    dateRange: 'date_range',
    activity: 'activity',
    status: 'status'
  };

  const updates = {};
  Object.keys(fieldMapping).forEach(frontendField => {
    if (req.body[frontendField] !== undefined) {
      updates[fieldMapping[frontendField]] = req.body[frontendField];
    }
  });

  const updatedEntry = await supabaseService.update(COLLECTIONS.ACADEMIC_CALENDAR, req.params.id, updates);
  res.json({ success: true, data: mapCalendarToFrontend(updatedEntry) });
});

// @desc    Delete academic calendar entry
// @route   DELETE /api/academic-calendar/:id
// @access  Private (Admin)
const deleteCalendarEntry = asyncHandler(async (req, res) => {
  const entry = await supabaseService.getById(COLLECTIONS.ACADEMIC_CALENDAR, req.params.id);
  if (!entry) return res.status(404).json({ message: 'Calendar entry not found' });
  
  await supabaseService.delete(COLLECTIONS.ACADEMIC_CALENDAR, req.params.id);
  res.json({ success: true, message: 'Calendar entry deleted successfully' });
});

module.exports = {
  getAllCalendarEntries,
  createCalendarEntry,
  updateCalendarEntry,
  deleteCalendarEntry
};
