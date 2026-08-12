const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { auth, admissionAndAdmin } = require('../middleware/authMiddleware');

// Get all students
router.get('/', auth, studentController.getAllStudents);

// Get student statistics
router.get('/stats/overview', auth, studentController.getStudentStats);

// Get student by ID
router.get('/:id', auth, studentController.getStudentById);

// Create new student
router.post('/', auth, admissionAndAdmin, studentController.createStudent);

// Update student
router.put('/:id', auth, admissionAndAdmin, studentController.updateStudent);

// Delete student
router.delete('/:id', auth, admissionAndAdmin, studentController.deleteStudent);

// Link parent to student
router.post('/:id/parents', auth, admissionAndAdmin, studentController.linkParent);

// Unlink parent from student
router.delete('/:id/parents/:parentId', auth, admissionAndAdmin, studentController.unlinkParent);

// Change password
router.post('/change-password', auth, studentController.changePassword);

module.exports = router;

