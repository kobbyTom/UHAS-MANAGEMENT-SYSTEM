const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Get all activity logs
// @route   GET /api/audit
// @access  Private/Admin
const getActivityLogs = asyncHandler(async (req, res) => {
  const { limit = 100, role, action } = req.query;

  // Since supabaseService.query doesn't easily support multiple dynamic filters in this basic wrapper,
  // we'll fetch all or use standard Supabase client for advanced querying.
  const supabase = require('../config/supabase');
  let sbQuery = supabase.from(COLLECTIONS.ACTIVITY_LOGS).select('*').order('created_at', { ascending: false }).limit(Number(limit));

  if (role && role !== 'All') {
    sbQuery = sbQuery.eq('role', role);
  }
  if (action && action !== 'All') {
    sbQuery = sbQuery.eq('action', action);
  }

  const { data, error } = await sbQuery;

  if (error) {
    if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
      return res.json({ success: true, count: 0, data: [] });
    }
    return res.status(500).json({ success: false, message: error.message });
  }

  res.json({ success: true, count: data.length, data });
});

module.exports = {
  getActivityLogs
};
