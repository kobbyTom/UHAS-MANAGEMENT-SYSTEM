const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { auth, teacherAndAdmin } = require('../middleware/authMiddleware');

// Get all assignments
router.get('/', auth, assignmentController.getAllAssignments);

// Get course assignments
router.get('/course/:courseId', auth, assignmentController.getCourseAssignments);

// Get assignment by ID
router.get('/:id', auth, assignmentController.getAssignmentById);

// Create assignment
router.post('/', auth, teacherAndAdmin, assignmentController.createAssignment);

// Update assignment
router.put('/:id', auth, teacherAndAdmin, assignmentController.updateAssignment);

// Delete assignment
router.delete('/:id', auth, teacherAndAdmin, assignmentController.deleteAssignment);

const upload = require('../config/multer');
// Submit assignment
router.post('/:id/submit', auth, assignmentController.submitAssignment);

// Upload assignment file
router.post('/upload', auth, upload.single('file'), assignmentController.uploadFile);

// Grade submission
router.post('/:id/grade', auth, teacherAndAdmin, assignmentController.gradeSubmission);

module.exports = router;
