const jwt = require('jsonwebtoken');
const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const auditMiddleware = require('./auditMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'school-management-secret-key';

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user by Supabase ID
    let user = null;
    let users = await supabaseService.query(COLLECTIONS.USERS, 'id', '==', decoded.id);
    if (users.length > 0) user = users[0];

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (user.is_active === false || user.isActive === false) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    req.user.id = decoded.id; // Supabase ID
    req.token = token;
    
    // Call auditMiddleware to optionally log this request
    auditMiddleware(req, res, () => {
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user has required role
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    
    next();
  };
};

// Admin only middleware
const adminOnly = checkRole('admin');

// Finance and Admin middleware
const financeAndAdmin = checkRole('admin', 'finance');

// Teacher and Admin middleware
const teacherAndAdmin = checkRole('admin', 'teacher', 'staff', 'admission');

// Parent and Admin middleware
const parentAndAdmin = checkRole('admin', 'parent');

// IT Support middleware
const itSupportOnly = checkRole('admin', 'ITSupport');

// Admission and Admin middleware
const admissionAndAdmin = checkRole('admin', 'admission');

module.exports = {
  auth,
  checkRole,
  adminOnly,
  financeAndAdmin,
  teacherAndAdmin: checkRole('admin', 'teacher', 'staff', 'admission'),
  parentAndAdmin,
  itSupportOnly,
  admissionAndAdmin
};
