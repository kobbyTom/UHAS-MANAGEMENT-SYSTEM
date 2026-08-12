const express = require('express');
const router = express.Router();
const { getStudentReport, getClassReport, sendReportToParents, getPublishedReports } = require('../controllers/reportController');
const { auth } = require('../middleware/authMiddleware');

router.get('/student/:studentId', auth, getStudentReport);
router.get('/class/:grade', auth, getClassReport);
router.post('/send', auth, sendReportToParents);
router.get('/published', auth, getPublishedReports);
router.delete('/published/:id', auth, require('../controllers/reportController').deletePublishedReport);

module.exports = router;
