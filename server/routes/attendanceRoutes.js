const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth, teacherAndAdmin } = require('../middleware/authMiddleware');

// Get all attendance
router.get('/', auth, attendanceController.getAllAttendance);

// Get student attendance
router.get('/student/:studentId', auth, attendanceController.getStudentAttendance);
router.get('/student/:studentId/summary', auth, attendanceController.getStudentAttendanceSummary);

// Get attendance statistics
router.get('/stats', auth, attendanceController.getAttendanceStats);

// Record attendance
router.post('/', auth, teacherAndAdmin, attendanceController.recordAttendance);

// Bulk record attendance
router.post('/bulk', auth, teacherAndAdmin, attendanceController.bulkRecordAttendance);

module.exports = router;

