const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { auth, admissionAndAdmin } = require('../middleware/authMiddleware');

// Get all courses
router.get('/', auth, courseController.getAllCourses);

// Get courses by grade (query param) - must be before /:id
router.get('/grade', auth, courseController.getCoursesByGradeQuery);

// Get courses by grade (path param)
router.get('/grade/:grade', auth, courseController.getCoursesByGrade);

// Get course by ID - must be last
router.get('/:id', auth, courseController.getCourseById);

// Create new course
router.post('/', auth, admissionAndAdmin, courseController.createCourse);

// Update course
router.put('/:id', auth, admissionAndAdmin, courseController.updateCourse);

// Delete course
router.delete('/:id', auth, admissionAndAdmin, courseController.deleteCourse);

// Sync students with course
router.post('/:id/sync-students', auth, admissionAndAdmin, courseController.syncStudentsWithClass);

module.exports = router;
