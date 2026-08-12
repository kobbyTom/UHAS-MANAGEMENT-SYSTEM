const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { auth, adminOnly } = require('../middleware/authMiddleware');

router.use(auth);

// Get all parents
router.get('/', parentController.getAllParents);

// Get current parent children (logged in parent)
router.get('/me/children', parentController.getMyChildren);

// Get current parent children's fees
router.get('/me/children/fees', parentController.getMyChildrenFees);

// Get current parent children's grades
router.get('/me/children/grades', parentController.getMyChildrenGrades);

// Get current parent children's attendance
router.get('/me/children/attendance', parentController.getMyChildrenAttendance);

// Get current parent children's assignments
router.get('/me/children/assignments', parentController.getMyChildrenAssignments);

// Get current parent children's announcements
router.get('/me/children/announcements', parentController.getMyChildrenAnnouncements);

// Get parent by ID
router.get('/:id', parentController.getParentById);

// Get parent notifications
router.get('/:id/notifications', parentController.getNotifications);

// Create new parent
router.post('/', parentController.createParent);

// Update parent
router.put('/:id', parentController.updateParent);

// Delete parent
router.delete('/:id', parentController.deleteParent);

// Migrate parents from students
router.post('/migrate', parentController.migrateParentsFromStudents);

// Link student to parent
router.post('/:id/students', parentController.linkStudent);

// Unlink student from parent
router.delete('/:id/students/:studentId', parentController.unlinkStudent);

// Mark notification as read
router.put('/:id/notifications/:notificationId', parentController.markNotificationRead);

// Get parent children's timetables
router.get('/:id/children/timetable', parentController.getChildrenTimetable);

module.exports = router;
