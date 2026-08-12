const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { auth, adminOnly } = require('../middleware/authMiddleware');

router.get('/', auth, classController.getAllClasses);
router.post('/', auth, adminOnly, classController.createClass);
router.put('/:id', auth, adminOnly, classController.updateClass);
router.delete('/:id', auth, adminOnly, classController.deleteClass);
router.post('/:id/subjects', auth, adminOnly, classController.assignSubjects);

module.exports = router;
