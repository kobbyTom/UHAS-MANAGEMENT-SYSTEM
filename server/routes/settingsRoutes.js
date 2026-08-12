const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth, adminOnly } = require('../middleware/authMiddleware');

router.use(auth);

// Get all settings
router.get('/', settingsController.getSettings);

// Update settings
router.put('/', adminOnly, settingsController.updateSettings);

// Get role statistics
router.get('/roles/stats', settingsController.getRoleStats);

// Get identities (users with roles)
router.get('/identities', settingsController.getIdentities);

// Get academic stats (classes, subjects counts)
router.get('/academic/stats', settingsController.getAcademicStats);

// Get login history
router.get('/login-history', settingsController.getLoginHistory);

// Get system logs
router.get('/system-logs', settingsController.getSystemLogs);

module.exports = router;
