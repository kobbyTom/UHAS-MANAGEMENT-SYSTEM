const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorMiddleware');

// Helper to map DB snake_case to Frontend camelCase
const mapExpenseToFrontend = (e) => {
  if (!e) return null;
  return {
    id: e.id,
    description: e.description,
    category: e.category,
    amount: e.amount,
    date: e.date,
    vendor: e.vendor,
    status: e.status,
    recordedBy: e.recorded_by,
    createdAt: e.created_at,
    updatedAt: e.updated_at
  };
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private (Admin, Finance)
const getAllExpenses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, status } = req.query;

  let expenses = await supabaseService.getAll(COLLECTIONS.EXPENSES, { 
    orderBy: 'date', 
    orderDirection: 'desc' 
  });

  if (category) {
    expenses = expenses.filter(e => e.category === category);
  }
  if (status) {
    expenses = expenses.filter(e => e.status === status);
  }

  const total = expenses.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedExpenses = expenses.slice(startIndex, endIndex);

  res.json({ 
    success: true, 
    data: paginatedExpenses.map(mapExpenseToFrontend), 
    pagination: { 
      page: parseInt(page), 
      limit: parseInt(limit), 
      total,
      pages: Math.ceil(total / limit)
    } 
  });
});

// @desc    Get expense statistics
// @route   GET /api/expenses/stats/overview
// @access  Private (Admin, Finance)
const getExpenseStats = asyncHandler(async (req, res) => {
  const expenses = await supabaseService.getAll(COLLECTIONS.EXPENSES);
  
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  const currentMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const vendorCount = new Set(expenses.map(e => e.vendor)).size;

  res.json({ 
    success: true, 
    data: { 
      totalExpenses, 
      currentMonthExpenses,
      vendorCount
    } 
  });
});

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private (Admin, Finance)
const createExpense = asyncHandler(async (req, res) => {
  const { description, category, amount, date, vendor, status } = req.body;
  
  const expenseData = {
    description,
    category,
    amount: parseFloat(amount),
    date: date || new Date().toISOString().split('T')[0],
    vendor,
    status: status || 'Paid',
    recorded_by: req.user.id
  };

  const expense = await supabaseService.create(COLLECTIONS.EXPENSES, expenseData);
  res.status(201).json({ success: true, data: mapExpenseToFrontend(expense) });
});

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private (Admin, Finance)
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await supabaseService.getById(COLLECTIONS.EXPENSES, req.params.id);
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  
  const fieldMapping = {
    description: 'description',
    category: 'category',
    amount: 'amount',
    date: 'date',
    vendor: 'vendor',
    status: 'status'
  };

  const updates = {};
  Object.keys(fieldMapping).forEach(key => {
    if (req.body[key] !== undefined) {
      if (key === 'amount') updates[fieldMapping[key]] = parseFloat(req.body[key]);
      else updates[fieldMapping[key]] = req.body[key];
    }
  });

  const updatedExpense = await supabaseService.update(COLLECTIONS.EXPENSES, req.params.id, updates);
  res.json({ success: true, data: mapExpenseToFrontend(updatedExpense) });
});

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private (Admin, Finance)
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await supabaseService.getById(COLLECTIONS.EXPENSES, req.params.id);
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  
  await supabaseService.delete(COLLECTIONS.EXPENSES, req.params.id);
  res.json({ success: true, message: 'Expense deleted' });
});

module.exports = {
  getAllExpenses,
  getExpenseStats,
  createExpense,
  updateExpense,
  deleteExpense
};
