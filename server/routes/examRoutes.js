const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { auth, checkRole } = require('../middleware/authMiddleware');

router.use(auth);

router.get('/schedule', examController.getAllExams);
router.post('/schedule', checkRole('admin', 'teacher'), examController.createExam);
router.put('/schedule/:id', checkRole('admin', 'teacher'), examController.updateExam);
router.delete('/schedule/:id', checkRole('admin', 'teacher'), examController.deleteExam);

router.get('/results', examController.getExamResults);

module.exports = router;