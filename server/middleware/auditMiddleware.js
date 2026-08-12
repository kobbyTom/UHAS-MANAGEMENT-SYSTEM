const { supabaseService, COLLECTIONS } = require('../services/supabaseService');

const auditMiddleware = (req, res, next) => {
  // Only intercept state-changing methods to avoid noise
  const trackedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (!trackedMethods.includes(req.method)) {
    return next();
  }

  const originalEnd = res.end;

  res.end = function (chunk, encoding) {
    // Restore original immediately before calling it
    res.end = originalEnd;
    res.end(chunk, encoding);

    // Fire-and-forget audit log — do NOT await, do NOT make res.end async
    if (req.user) {
      const user = req.user;
      const method = req.method;

      let action = 'UPDATE';
      if (method === 'POST') action = 'CREATE';
      if (method === 'DELETE') action = 'DELETE';

      const pathSegments = req.originalUrl.split('?')[0].split('/');
      const entity = pathSegments[2] ? pathSegments[2].toUpperCase() : 'SYSTEM';

      const logData = {
        user_id: user.id || user._id,
        user_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown',
        role: user.role || 'Unknown',
        action,
        entity,
        details: {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
        },
        ip_address: req.ip || req.socket?.remoteAddress || 'Unknown'
      };

      // Fire and forget — use Promise catch to suppress unhandled rejections
      supabaseService.create(COLLECTIONS.ACTIVITY_LOGS, logData).catch((err) => {
        console.error('Audit log write failed:', err.message);
      });
    }
  };

  next();
};

module.exports = auditMiddleware;
