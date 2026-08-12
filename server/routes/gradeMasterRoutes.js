const express = require('express');
const router = express.Router();
const { 
  getAllGradeMasters, 
  getGradeMasterByGrade, 
  assignGradeMaster 
} = require('../controllers/gradeMasterController');
const { auth, adminOnly, admissionAndAdmin } = require('../middleware/authMiddleware');

router.use(auth);

router.get('/', getAllGradeMasters);
router.get('/:grade', getGradeMasterByGrade);
router.post('/', admissionAndAdmin, assignGradeMaster);

module.exports = router;
