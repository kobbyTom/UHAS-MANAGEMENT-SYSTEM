const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { auth, adminOnly } = require('../middleware/authMiddleware');

router.use(auth);

// Get all non-teaching staff
router.get('/', staffController.getAllStaff);

// Get staff stats
router.get('/stats/overview', staffController.getStaffStats);

// Get staff by ID
router.get('/:id', staffController.getStaffById);

// Create new staff
router.post('/', adminOnly, staffController.createStaff);

// Update staff
router.put('/:id', adminOnly, staffController.updateStaff);

// Delete staff
router.delete('/:id', adminOnly, staffController.deleteStaff);

module.exports = router;