const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const { auth, financeAndAdmin } = require('../middleware/authMiddleware');

router.use(auth);

router.get('/', financeAndAdmin, incomeController.getAllIncome);
router.get('/stats/overview', financeAndAdmin, incomeController.getIncomeStats);
router.post('/', financeAndAdmin, incomeController.createIncome);
router.put('/:id', financeAndAdmin, incomeController.updateIncome);
router.delete('/:id', financeAndAdmin, incomeController.deleteIncome);

module.exports = router;
