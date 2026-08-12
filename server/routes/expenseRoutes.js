const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { auth, financeAndAdmin } = require('../middleware/authMiddleware');

router.use(auth);

router.get('/', financeAndAdmin, expenseController.getAllExpenses);
router.get('/stats/overview', financeAndAdmin, expenseController.getExpenseStats);
router.post('/', financeAndAdmin, expenseController.createExpense);
router.put('/:id', financeAndAdmin, expenseController.updateExpense);
router.delete('/:id', financeAndAdmin, expenseController.deleteExpense);

module.exports = router;
