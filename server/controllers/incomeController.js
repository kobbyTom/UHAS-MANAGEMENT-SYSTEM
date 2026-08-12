const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorMiddleware');

// Helper to map DB snake_case to Frontend camelCase
const mapIncomeToFrontend = (i) => {
  if (!i) return null;
  return {
    id: i.id,
    description: i.description,
    category: i.category,
    amount: i.amount,
    date: i.date,
    source: i.source,
    status: i.status,
    recordedBy: i.recorded_by,
    createdAt: i.created_at,
    updatedAt: i.updated_at
  };
};

// @desc    Get all income
// @route   GET /api/income
// @access  Private (Admin, Finance)
const getAllIncome = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category } = req.query;

  let income = await supabaseService.getAll(COLLECTIONS.INCOME, { 
    orderBy: 'date', 
    orderDirection: 'desc' 
  });

  if (category) {
    income = income.filter(i => i.category === category);
  }

  const total = income.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedIncome = income.slice(startIndex, endIndex);

  res.json({ 
    success: true, 
    data: paginatedIncome.map(mapIncomeToFrontend), 
    pagination: { 
      page: parseInt(page), 
      limit: parseInt(limit), 
      total,
      pages: Math.ceil(total / limit)
    } 
  });
});

// @desc    Get income statistics
// @route   GET /api/income/stats/overview
// @access  Private (Admin, Finance)
const getIncomeStats = asyncHandler(async (req, res) => {
  const incomeRecords = await supabaseService.getAll(COLLECTIONS.INCOME);
  const payments = await supabaseService.getAll(COLLECTIONS.PAYMENTS);
  
  const miscIncome = incomeRecords.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  const feeIncome = payments.filter(p => p.status === 'completed' || p.status === 'paid' || p.status === 'Paid').reduce((sum, p) => sum + (parseFloat(p.amountPaid || p.amount) || 0), 0);
  
  const totalRevenue = miscIncome + feeIncome;
  
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  const currentMonthMisc = incomeRecords.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

  const currentMonthFees = payments.filter(p => {
    const d = new Date(p.paymentDate || p.created_at);
    return (p.status === 'completed' || p.status === 'paid' || p.status === 'Paid') && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).reduce((sum, p) => sum + (parseFloat(p.amountPaid || p.amount) || 0), 0);

  res.json({ 
    success: true, 
    data: { 
      totalRevenue, 
      currentMonthRevenue: currentMonthMisc + currentMonthFees,
      sourceDiversity: incomeRecords.length > 0 ? "High" : "Normal"
    } 
  });
});

// @desc    Create new income record
// @route   POST /api/income
// @access  Private (Admin, Finance)
const createIncome = asyncHandler(async (req, res) => {
  const { description, category, amount, date, source, status } = req.body;
  
  const incomeData = {
    description,
    category,
    amount: parseFloat(amount),
    date: date || new Date().toISOString().split('T')[0],
    source,
    status: status || 'Received',
    recorded_by: req.user.id
  };

  const income = await supabaseService.create(COLLECTIONS.INCOME, incomeData);
  res.status(201).json({ success: true, data: mapIncomeToFrontend(income) });
});

// @desc    Update income record
// @route   PUT /api/income/:id
// @access  Private (Admin, Finance)
const updateIncome = asyncHandler(async (req, res) => {
  const record = await supabaseService.getById(COLLECTIONS.INCOME, req.params.id);
  if (!record) return res.status(404).json({ message: 'Income record not found' });
  
  const fieldMapping = {
    description: 'description',
    category: 'category',
    amount: 'amount',
    date: 'date',
    source: 'source',
    status: 'status'
  };

  const updates = {};
  Object.keys(fieldMapping).forEach(key => {
    if (req.body[key] !== undefined) {
      if (key === 'amount') updates[fieldMapping[key]] = parseFloat(req.body[key]);
      else updates[fieldMapping[key]] = req.body[key];
    }
  });

  const updatedRecord = await supabaseService.update(COLLECTIONS.INCOME, req.params.id, updates);
  res.json({ success: true, data: mapIncomeToFrontend(updatedRecord) });
});

// @desc    Delete income record
// @route   DELETE /api/income/:id
// @access  Private (Admin, Finance)
const deleteIncome = asyncHandler(async (req, res) => {
  const record = await supabaseService.getById(COLLECTIONS.INCOME, req.params.id);
  if (!record) return res.status(404).json({ message: 'Income record not found' });
  
  await supabaseService.delete(COLLECTIONS.INCOME, req.params.id);
  res.json({ success: true, message: 'Income record deleted' });
});

module.exports = {
  getAllIncome,
  getIncomeStats,
  createIncome,
  updateIncome,
  deleteIncome
};
