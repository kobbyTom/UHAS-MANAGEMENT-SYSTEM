const express = require('express');
const router = express.Router();
const { getAdminOverview } = require('../controllers/dashboardController');
const { auth, admissionAndAdmin } = require('../middleware/authMiddleware');

router.get('/admin', auth, admissionAndAdmin, getAdminOverview);

module.exports = router;
