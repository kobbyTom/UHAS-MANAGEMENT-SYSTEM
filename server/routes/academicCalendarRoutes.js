const express = require('express');
const router = express.Router();
const academicCalendarController = require('../controllers/academicCalendarController');
const { auth, adminOnly } = require('../middleware/authMiddleware');

router.use(auth);

router.get('/', academicCalendarController.getAllCalendarEntries);
router.post('/', adminOnly, academicCalendarController.createCalendarEntry);
router.put('/:id', adminOnly, academicCalendarController.updateCalendarEntry);
router.delete('/:id', adminOnly, academicCalendarController.deleteCalendarEntry);

module.exports = router;
