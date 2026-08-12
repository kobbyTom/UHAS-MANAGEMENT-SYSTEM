const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { auth, teacherAndAdmin } = require('../middleware/authMiddleware');

router.use(auth);

// Get all grades
router.get('/', gradeController.getAllGrades);

// Get grade by ID
router.get('/:id', gradeController.getGradeById);

// Get student grades
router.get('/student/:studentId', gradeController.getStudentGrades);

// Get course grades
router.get('/course/:courseId', gradeController.getCourseGrades);

// Get grade statistics
router.get('/stats/overview', gradeController.getGradeStats);

// Create grade
router.post('/', teacherAndAdmin, gradeController.createGrade);

// Bulk create grades
router.post('/bulk', teacherAndAdmin, gradeController.bulkCreateGrades);

// Update grade
router.put('/:id', teacherAndAdmin, gradeController.updateGrade);

// Delete grade
router.delete('/:id', teacherAndAdmin, gradeController.deleteGrade);

module.exports = router;

