const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { auth, adminOnly } = require('../middleware/authMiddleware');

router.use(auth);

// Get all teachers
router.get('/', teacherController.getAllTeachers);

// Get current teacher courses (logged in teacher)
router.get('/me/courses', teacherController.getMyCourses);

// Get current teacher pending grading
router.get('/me/pending-grading', teacherController.getPendingGrading);

// Get teacher statistics
router.get('/stats/overview', teacherController.getTeacherStats);

// Get teacher by ID
router.get('/:id', teacherController.getTeacherById);

// Create new teacher
router.post('/', adminOnly, teacherController.createTeacher);

// Update teacher
router.put('/:id', adminOnly, teacherController.updateTeacher);

// Delete teacher
router.delete('/:id', adminOnly, teacherController.deleteTeacher);

module.exports = router;

