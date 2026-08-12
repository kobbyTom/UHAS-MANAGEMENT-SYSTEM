const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { auth, adminOnly } = require('../middleware/authMiddleware');

router.get('/', auth, subjectController.getAllSubjects);
router.post('/', auth, adminOnly, subjectController.createSubject);
router.put('/:id', auth, adminOnly, subjectController.updateSubject);
router.delete('/:id', auth, adminOnly, subjectController.deleteSubject);

module.exports = router;
