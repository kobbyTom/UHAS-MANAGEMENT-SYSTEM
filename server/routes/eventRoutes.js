const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { auth, adminOnly } = require('../middleware/authMiddleware');

router.use(auth);

router.get('/', eventController.getAllEvents);
router.get('/upcoming', eventController.getUpcomingEvents);
router.post('/', adminOnly, eventController.createEvent);
router.put('/:id', adminOnly, eventController.updateEvent);
router.delete('/:id', adminOnly, eventController.deleteEvent);

module.exports = router;
