const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorMiddleware');
const supabase = require('../config/supabase');

// Robust term normalization
const normalizeTerm = (term) => {
  if (!term) return '1st';
  const t = term.toString().toLowerCase();
  if (t.includes('first') || t === '1' || t === '1st') return '1st';
  if (t.includes('second') || t === '2' || t === '2nd') return '2nd';
  if (t.includes('third') || t === '3' || t === '3rd') return '3rd';
  if (t.includes('fourth') || t === '4' || t === '4th') return '4th';
  if (t === 'all') return 'all';
  return term; // Fallback
};

// Helper to map DB to Frontend (DB has mixed snake/camel case)
const mapFeeToFrontend = (f) => {
  if (!f) return null;
  return {
    id: f.id,
    name: f.name,
    description: f.description,
    academicYear: f.academicYear || f.academic_year,
    term: f.term,
    grade: f.grade,
    amount: f.amount,
    currency: f.currency,
    dueDate: f.dueDate || f.due_date,
    lateFee: f.late_fee || f.lateFee,
    lateFeeAfter: f.late_fee_after || f.lateFeeAfter,
    isOptional: f.is_optional || f.isOptional,
    components: f.components || [],
    paymentMethods: f.payment_methods || f.paymentMethods || [],
    isActive: f.isActive !== undefined ? f.isActive : f.is_active,
    createdBy: f.created_by || f.recorded_by,
    createdAt: f.created_at,
    updatedAt: f.updated_at
  };
};

// @desc    Get all fees
// @route   GET /api/fees
// @access  Private
const getAllFees = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, academicYear, term, grade } = req.query;

  // Fetch all fees - we'll filter in memory to be robust against column naming
  const { data, error } = await supabase
    .from(COLLECTIONS.FEES)
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;

  let fees = data || [];
  
  // Data Isolation for Students
  if (req.user.role === 'student') {
    const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', req.user.id);
    if (studentProfile) {
      fees = fees.filter(f => {
        const normalize = (g) => g ? g.toString().toLowerCase().replace(/\s/g, '') : '';
        return normalize(f.grade) === normalize(studentProfile.grade);
      });
    } else {
      return res.json({ success: true, data: [], pagination: { total: 0 } });
    }
  }

  // Apply filters robustly
  if (academicYear) {
    fees = fees.filter(f => (f.academicYear === academicYear || f.academic_year === academicYear));
  }
  if (term) {
    fees = fees.filter(f => f.term === term);
  }
  if (grade) {
    fees = fees.filter(f => f.grade === grade);
  }

  // Pagination
  const total = fees.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedFees = fees.slice(startIndex, endIndex);

  res.json({ 
    success: true, 
    data: paginatedFees.map(mapFeeToFrontend), 
    pagination: { 
      page: parseInt(page), 
      limit: parseInt(limit), 
      total,
      pages: Math.ceil(total / limit)
    } 
  });
});

// @desc    Get single fee
// @route   GET /api/fees/:id
// @access  Private
const getFeeById = asyncHandler(async (req, res) => {
  const fee = await supabaseService.getById(COLLECTIONS.FEES, req.params.id);
  
  if (!fee) {
    return res.status(404).json({ message: 'Fee not found' });
  }

  // Get payments for this fee - check both fee_id and fee
  let payments = await supabaseService.query(COLLECTIONS.PAYMENTS, 'fee_id', '==', req.params.id);

  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  // Get students in this grade
  const students = await supabaseService.query(COLLECTIONS.STUDENTS, 'grade', '==', fee.grade);
  const activeStudents = students.filter(s => s.status === 'active' || s.status === 'Active');
  const studentCount = activeStudents.length;

  res.json({ 
    success: true, 
    data: { 
      ...mapFeeToFrontend(fee), 
      stats: { 
        totalCollected: totalPaid, 
        expectedStudents: studentCount, 
        pendingAmount: (studentCount * (parseFloat(fee.amount) || 0)) - totalPaid 
      } 
    } 
  });
});

// @desc    Create new fee
// @route   POST /api/fees
// @access  Private (Admin, Finance)
const createFee = asyncHandler(async (req, res) => {
  const { name, amount, grade, term, academicYear, dueDate, isActive, description } = req.body;
  
  // Create with the columns we SAW in the DB
  const feeData = {
    name,
    amount: parseFloat(amount),
    grade,
    term: normalizeTerm(term),
    academicYear: academicYear || '2023/2024',
    dueDate: dueDate || new Date().toISOString(),
    isActive: isActive !== undefined ? isActive : true,
    description: description || '',
    created_by: req.user.id
  };

  const fee = await supabaseService.create(COLLECTIONS.FEES, feeData);
  res.status(201).json({ success: true, data: mapFeeToFrontend(fee) });
});

// @desc    Update fee
// @route   PUT /api/fees/:id
// @access  Private (Admin, Finance)
const updateFee = asyncHandler(async (req, res) => {
  const fee = await supabaseService.getById(COLLECTIONS.FEES, req.params.id);
  if (!fee) return res.status(404).json({ message: 'Fee not found' });

  // Use the columns we SAW in the DB
  const fieldMapping = {
    name: 'name',
    amount: 'amount',
    grade: 'grade',
    term: 'term',
    academicYear: 'academicYear',
    dueDate: 'dueDate',
    isActive: 'isActive',
    description: 'description'
  };

  const updates = {};
  Object.keys(fieldMapping).forEach(key => {
    if (req.body[key] !== undefined) {
      if (key === 'amount') updates[fieldMapping[key]] = parseFloat(req.body[key]);
      else if (key === 'term') updates[fieldMapping[key]] = normalizeTerm(req.body[key]);
      else updates[fieldMapping[key]] = req.body[key];
    }
  });
  
  const updatedFee = await supabaseService.update(COLLECTIONS.FEES, req.params.id, updates);
  res.json({ success: true, data: mapFeeToFrontend(updatedFee) });
});

// @desc    Delete fee
// @route   DELETE /api/fees/:id
// @access  Private (Admin)
const deleteFee = asyncHandler(async (req, res) => {
  const fee = await supabaseService.getById(COLLECTIONS.FEES, req.params.id);
  if (!fee) return res.status(404).json({ message: 'Fee not found' });
  
  await supabaseService.delete(COLLECTIONS.FEES, req.params.id);
  res.json({ success: true, message: 'Fee deleted successfully' });
});

// @desc    Record payment
// @route   POST /api/fees/:id/payments
// @access  Private
const recordPayment = asyncHandler(async (req, res) => {
  const { studentId, amount, paymentMethod, referenceNumber, notes } = req.body;
  
  const fee = await supabaseService.getById(COLLECTIONS.FEES, req.params.id);
  if (!fee) return res.status(404).json({ message: 'Fee not found' });
  
  const student = await supabaseService.getById(COLLECTIONS.STUDENTS, studentId);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const receiptNumber = `RCP${Date.now()}`;
  
  // Use columns SAW in DB
  const paymentData = {
    student_id: studentId,
    fee_id: req.params.id,
    academicYear: fee.academicYear || fee.academic_year || '2023/2024',
    term: fee.term,
    amount: parseFloat(amount),
    amountPaid: parseFloat(amount),
    balance: (parseFloat(fee.amount) || 0) - parseFloat(amount),
    payment_method: paymentMethod || 'cash',
    paymentDate: new Date().toISOString(),
    reference_number: referenceNumber || `PAY${Date.now()}`,
    receiptNumber: receiptNumber,
    status: 'completed',
    notes: notes || '',
    recorded_by: req.user.id
  };

  const payment = await supabaseService.create(COLLECTIONS.PAYMENTS, paymentData);

  res.status(201).json({ 
    success: true, 
    data: { 
      payment, 
      receipt: { 
        receiptNumber, 
        student: `${student.first_name || student.firstName} ${student.last_name || student.lastName}`, 
        amount 
      } 
    } 
  });
});

// @desc    Get student fees
// @route   GET /api/fees/student/:studentId
// @access  Private
const getStudentFees = asyncHandler(async (req, res) => {
  const { academicYear } = req.query;
  
  let student = await supabaseService.getById(COLLECTIONS.STUDENTS, req.params.studentId);
  if (!student) {
    student = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', req.params.studentId);
  }
  
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const studentGrade = student.grade;
  
  const { data: fees, error } = await supabase
    .from(COLLECTIONS.FEES)
    .select('*')
    .eq('grade', studentGrade);
    
  if (error) throw error;

  if (academicYear) {
    fees = fees.filter(f => (f.academicYear === academicYear || f.academic_year === academicYear));
  }

  // Get payments - check both student_id and student
  let payments = await supabaseService.query(COLLECTIONS.PAYMENTS, 'student_id', '==', student.id);

  const feesWithStatus = fees.map(fee => {
    const feePayments = payments.filter(p => p.fee_id === fee.id);
    const totalPaid = feePayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    return { 
      ...mapFeeToFrontend(fee), 
      amountPaid: totalPaid, 
      balance: (parseFloat(fee.amount) || 0) - totalPaid, 
      isPaid: totalPaid >= (parseFloat(fee.amount) || 0) 
    };
  });

  res.json({ success: true, data: feesWithStatus });
});

// @desc    Get fee statistics
// @route   GET /api/fees/stats/overview
// @access  Private (Admin, Finance)
const getFeeStats = asyncHandler(async (req, res) => {
  // Use direct supabase calls for consistency
  const [paymentsRes, studentsRes, feesRes] = await Promise.all([
    supabase.from(COLLECTIONS.PAYMENTS).select('*'),
    supabase.from(COLLECTIONS.STUDENTS).select('*'),
    supabase.from(COLLECTIONS.FEES).select('*')
  ]);

  let payments = paymentsRes.data || [];
  let students = studentsRes.data || [];
  let fees = feesRes.data || [];

  // Data Isolation
  if (req.user.role === 'student') {
    const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', req.user.id);
    if (studentProfile) {
      payments = payments.filter(p => (p.student_id === studentProfile.id || p.student === studentProfile.id));
      students = students.filter(s => s.id === studentProfile.id);
      fees = fees.filter(f => {
        const normalize = (g) => g ? g.toString().toLowerCase().replace(/\s/g, '') : '';
        return normalize(f.grade) === normalize(studentProfile.grade);
      });
    } else {
      return res.json({ success: true, data: { totalCollected: 0, totalPending: 0, studentsCount: 0, transactionsCount: 0, chartData: [] } });
    }
  } else if (req.user.role === 'parent') {
    const { data: children } = await supabase.from('students').select('*').eq('parent_id', req.user.id);
    const childIds = (children || []).map(c => c.id);
    const childGrades = [...new Set((children || []).map(c => c.grade).filter(Boolean))];
    
    payments = payments.filter(p => childIds.includes(p.student_id || p.student));
    students = children || [];
    fees = fees.filter(f => {
      const normalize = (g) => g ? g.toString().toLowerCase().replace(/\s/g, '') : '';
      return childGrades.some(cg => normalize(f.grade) === normalize(cg));
    });
  }

  const completedPayments = payments.filter(p => 
    p.status === 'completed' || p.status === 'paid' || p.status === 'Paid'
  );
  const totalCollected = completedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  let totalExpected = 0;
  fees.forEach(fee => {
    const studentCount = students.filter(s => 
      s.grade === fee.grade && (s.status === 'active' || s.status === 'Active')
    ).length;
    totalExpected += (studentCount * (parseFloat(fee.amount) || 0));
  });

  const totalPending = Math.max(0, totalExpected - totalCollected);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    
    const monthPayments = completedPayments.filter(p => {
      const pDate = new Date(p.paymentDate || p.payment_date || p.created_at);
      return pDate.getMonth() === d.getMonth() && pDate.getFullYear() === year;
    });
    
    const collected = monthPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const pending = i === 0 ? totalPending * 0.2 : 0; 

    chartData.push({
      month: monthName,
      collected,
      pending
    });
  }

  res.json({ 
    success: true, 
    data: { 
      totalCollected, 
      totalPending,
      studentsCount: students.length,
      transactionsCount: payments.length,
      chartData
    } 
  });
});

module.exports = { 
  getAllFees, 
  getFeeById, 
  createFee, 
  updateFee, 
  deleteFee, 
  recordPayment, 
  getStudentFees, 
  getFeeStats 
};
