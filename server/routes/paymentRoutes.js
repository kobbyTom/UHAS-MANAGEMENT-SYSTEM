const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, financeAndAdmin } = require('../middleware/authMiddleware');

router.use(auth);

// Get all payments
router.get('/', paymentController.getAllPayments);

// Get payment by ID
router.get('/:id', paymentController.getPaymentById);

// Create new payment
router.post('/', financeAndAdmin, paymentController.createPayment);

module.exports = router;
