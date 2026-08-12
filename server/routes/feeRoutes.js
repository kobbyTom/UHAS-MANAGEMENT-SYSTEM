const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { auth, financeAndAdmin } = require('../middleware/authMiddleware');

router.use(auth);

// Get all fees
router.get('/', feeController.getAllFees);

// Get fee statistics
router.get('/stats/overview', feeController.getFeeStats);

// Get fee by ID
router.get('/:id', feeController.getFeeById);

// Get student fees
router.get('/student/:studentId', feeController.getStudentFees);

// Create new fee
router.post('/', financeAndAdmin, feeController.createFee);

// Update fee
router.put('/:id', financeAndAdmin, feeController.updateFee);

// Delete fee
router.delete('/:id', financeAndAdmin, feeController.deleteFee);

// Record payment
router.post('/:id/payments', financeAndAdmin, feeController.recordPayment);

module.exports = router;
