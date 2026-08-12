const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { auth } = require('../middleware/authMiddleware');

router.use(auth);

// Order matters: specific routes before parameterized routes
router.get('/', timetableController.getAllTimetables);
router.get('/class/:className', timetableController.getTimetableByClass);
router.get('/grade/:grade', timetableController.getTimetablesByGrade);
router.get('/teacher/:teacherId', timetableController.getTimetableByTeacher);
router.get('/:id', timetableController.getTimetableById);
router.post('/', timetableController.createTimetable);
router.put('/:id', timetableController.updateTimetable);
router.delete('/all', timetableController.deleteAllTimetables);
router.delete('/:id', timetableController.deleteTimetable);
router.post('/:id/period', timetableController.addPeriod);
router.delete('/:id/period', timetableController.removePeriod);

module.exports = router;