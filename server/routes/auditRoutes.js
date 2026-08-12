const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/auditController');
const { auth, adminOnly } = require('../middleware/authMiddleware');

router.use(auth);
router.use(adminOnly);

router.route('/').get(getActivityLogs);

module.exports = router;
