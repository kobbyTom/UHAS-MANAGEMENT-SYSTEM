const express = require('express');
const router = express.Router();
const { generateLesson } = require('../controllers/aiController');
const { auth } = require('../middleware/authMiddleware');

router.post('/generate-lesson', auth, generateLesson);

module.exports = router;
