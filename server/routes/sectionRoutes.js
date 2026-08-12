const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const { auth, adminOnly } = require('../middleware/authMiddleware');

router.get('/', auth, sectionController.getAllSections);
router.post('/', auth, adminOnly, sectionController.createSection);
router.put('/:id', auth, adminOnly, sectionController.updateSection);
router.delete('/:id', auth, adminOnly, sectionController.deleteSection);

module.exports = router;
