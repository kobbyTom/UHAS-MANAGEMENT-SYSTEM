const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorMiddleware');

// Helper to map DB snake_case to Frontend camelCase
const mapEventToFrontend = (e) => {
  if (!e) return null;
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    eventType: e.event_type,
    startDate: e.start_date,
    endDate: e.end_date,
    location: e.location,
    audience: e.audience,
    isSchoolHoliday: e.is_school_holiday,
    color: e.color,
    createdAt: e.created_at,
    updatedAt: e.updated_at
  };
};

// @desc    Get all events
// @route   GET /api/events
// @access  Private
const getAllEvents = asyncHandler(async (req, res) => {
  const { type, limit } = req.query;
  let events = await supabaseService.getAll(COLLECTIONS.EVENTS, { 
    orderBy: 'start_date', 
    orderDirection: 'asc',
    limit: limit ? parseInt(limit) : 100
  });

  // Data Isolation for Students
  if (req.user.role === 'student') {
    const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', req.user.id);
    if (studentProfile) {
      const studentGrade = studentProfile.grade;
      events = events.filter(e => {
        let audience = [];
        try {
          audience = Array.isArray(e.audience) ? e.audience : (typeof e.audience === 'string' ? JSON.parse(e.audience) : ['all']);
        } catch (err) {
          audience = ['all'];
        }
        
        const studentGradeNorm = (studentGrade || '').trim();
        const audienceNorm = audience.map(a => (a || '').trim());
        
        return audienceNorm.includes('all') || audienceNorm.includes('students') || audienceNorm.includes(studentGradeNorm);
      });
    }
  }

  if (type) {
    events = events.filter(e => e.type === type);
  }

  res.json({ success: true, data: events.map(mapEventToFrontend) });
});

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
// @access  Private
const getUpcomingEvents = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  let events = await supabaseService.query(COLLECTIONS.EVENTS, 'start_date', '>=', today);
  
  // Data Isolation for Students
  if (req.user.role === 'student') {
    const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', req.user.id);
    if (studentProfile) {
      const studentGrade = studentProfile.grade;
      events = events.filter(e => {
        let audience = [];
        try {
          audience = Array.isArray(e.audience) ? e.audience : (typeof e.audience === 'string' ? JSON.parse(e.audience) : ['all']);
        } catch (err) {
          audience = ['all'];
        }
        
        const studentGradeNorm = (studentGrade || '').trim();
        const audienceNorm = audience.map(a => (a || '').trim());
        
        return audienceNorm.includes('all') || audienceNorm.includes('students') || audienceNorm.includes(studentGradeNorm);
      });
    }
  }

  // Sort by start_date ascending
  events.sort((a, b) => new Date(a.start_date || a.startDate) - new Date(b.start_date || b.startDate));
  
  res.json({ success: true, data: events.map(mapEventToFrontend) });
});

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Admin/Teacher)
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, eventType, startDate, endDate, location, audience, isSchoolHoliday, color } = req.body;
  
  const eventData = {
    title,
    description,
    event_type: eventType || 'general',
    start_date: startDate,
    end_date: endDate || startDate,
    location,
    audience: audience || ['all'],
    is_school_holiday: isSchoolHoliday || false,
    color: color || '#3b82f6'
  };

  const event = await supabaseService.create(COLLECTIONS.EVENTS, eventData);
  res.status(201).json({ success: true, data: mapEventToFrontend(event) });
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin/Teacher)
const updateEvent = asyncHandler(async (req, res) => {
  const event = await supabaseService.getById(COLLECTIONS.EVENTS, req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  
  const fieldMapping = {
    title: 'title',
    description: 'description',
    eventType: 'event_type',
    startDate: 'start_date',
    endDate: 'end_date',
    location: 'location',
    audience: 'audience',
    isSchoolHoliday: 'is_school_holiday',
    color: 'color'
  };

  const updates = {};
  Object.keys(fieldMapping).forEach(frontendField => {
    if (req.body[frontendField] !== undefined) {
      updates[fieldMapping[frontendField]] = req.body[frontendField];
    }
  });

  const updatedEvent = await supabaseService.update(COLLECTIONS.EVENTS, req.params.id, updates);
  res.json({ success: true, data: mapEventToFrontend(updatedEvent) });
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin)
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await supabaseService.getById(COLLECTIONS.EVENTS, req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  
  await supabaseService.delete(COLLECTIONS.EVENTS, req.params.id);
  res.json({ success: true, message: 'Event deleted successfully' });
});

module.exports = {
  getAllEvents,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent
};
