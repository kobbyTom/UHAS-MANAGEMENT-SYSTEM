// Error handling middleware

// Not found middleware - handles 404 errors
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err);
  
  // Also log to a file we can read
  try {
    const fs = require('fs');
    const path = require('path');
    const scratchDir = path.join(__dirname, '../../scratch');
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    const logPath = path.join(scratchDir, 'error_debug.log');
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${req.method} ${req.originalUrl}\nError: ${err.message}\nStack: ${err.stack}\n\n`;
    fs.appendFileSync(logPath, logEntry);
  } catch (e) {
    console.error('Failed to write to error log:', e);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      message: 'Resource not found',
      error: 'Invalid ID format'
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      message: `Duplicate field value: ${field}`,
      error: 'Please use a different value'
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      message: 'Validation Error',
      errors: messages
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token',
      error: 'Please log in again'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired',
      error: 'Please log in again'
    });
  }

  // Default error
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async handler to catch errors in async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler
};

