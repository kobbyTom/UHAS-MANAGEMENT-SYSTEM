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
const mapPaymentToFrontend = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    studentId: p.student_id || p.student,
    parentId: p.parent_id || p.parent,
    feeId: p.fee_id || p.fee,
    academicYear: p.academicYear || p.academic_year,
    term: p.term,
    amount: p.amount,
    amountPaid: p.amountPaid || p.amount_paid,
    balance: p.balance,
    paymentMethod: p.payment_method || p.paymentMethod,
    transactionId: p.transaction_id || p.transactionId,
    referenceNumber: p.reference_number || p.referenceNumber,
    paymentDate: p.paymentDate || p.payment_date,
    status: p.status,
    receiptNumber: p.receiptNumber || p.receipt_number,
    receiptGenerated: p.receipt_generated,
    receiptGeneratedAt: p.receipt_generated_at,
    paymentDetails: p.payment_details || p.paymentDetails,
    notes: p.notes,
    recordedBy: p.recorded_by,
    confirmedBy: p.confirmed_by,
    confirmedAt: p.confirmed_at,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    // Joined data
    student: p.students ? {
      id: p.students.id,
      firstName: p.students.firstName || p.students.first_name,
      lastName: p.students.lastName || p.students.last_name,
      grade: p.students.grade
    } : null
  };
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getAllPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, status } = req.query;
  let studentId = req.query.studentId;

  // Data Isolation
  if (req.user.role === 'student') {
    const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', req.user.id);
    if (studentProfile) {
      studentId = studentProfile.id;
    } else {
      return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
    }
  } else if (req.user.role === 'parent') {
    const { data: children } = await supabase
      .from('students')
      .select('id')
      .eq('parent_id', req.user.id);
    
    const childIds = (children || []).map(c => c.id);
    if (studentId && !childIds.includes(studentId)) {
      return res.status(403).json({ message: 'Access denied. You can only view your children\'s payments.' });
    }
    if (!studentId && childIds.length > 0) {
      // If no studentId provided by parent, default to all their children
      // We will filter rawPayments later using childIds
    } else if (!studentId) {
      return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
    }
  }

  // 1. Fetch payments without join
  const { data, error } = await supabase
    .from(COLLECTIONS.PAYMENTS)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  let rawPayments = data || [];

  // 2. Fetch related students manually (to avoid schema cache join errors)
  const studentIds = [...new Set(rawPayments.map(p => p.student_id || p.student).filter(Boolean))];
  let studentsMap = {};
  
  if (studentIds.length > 0) {
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .in('id', studentIds);
    
    if (!studentsError && studentsData) {
      studentsData.forEach(s => {
        studentsMap[s.id] = s;
      });
    }
  }

  // 3. Merge data
  let payments = rawPayments.map(p => ({
    ...p,
    students: studentsMap[p.student_id || p.student] || null
  }));

  // Apply filters
  if (studentId) {
    payments = payments.filter(p => (p.student_id === studentId || p.student === studentId));
  } else if (req.user.role === 'parent') {
    const { data: children } = await supabase.from('students').select('id').eq('parent_id', req.user.id);
    const childIds = (children || []).map(c => c.id);
    payments = payments.filter(p => childIds.includes(p.student_id || p.student));
  }

  if (status) {
    payments = payments.filter(p => p.status === status);
  }

  // Pagination
  const total = payments.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedPayments = payments.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedPayments.map(mapPaymentToFrontend),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = asyncHandler(async (req, res) => {
  // 1. Fetch payment
  const { data: payment, error: paymentError } = await supabase
    .from(COLLECTIONS.PAYMENTS)
    .select('*')
    .eq('id', req.params.id)
    .single();
  
  if (paymentError || !payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  // 2. Fetch student manually
  const studentId = payment.student_id || payment.student;
  let studentData = null;
  if (studentId) {
    const { data: sData } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    studentData = sData;
  }

  // 3. Merge
  const result = {
    ...payment,
    students: studentData
  };

  res.json({
    success: true,
    data: mapPaymentToFrontend(result)
  });
});

// @desc    Create new payment
// @route   POST /api/payments
// @access  Private (Admin, Finance)
const createPayment = asyncHandler(async (req, res) => {
  const {
    studentId,
    feeId,
    amount,
    paymentMethod,
    referenceNumber,
    notes,
    academicYear,
    term
  } = req.body;

  // Use columns SAW in DB
  const paymentData = {
    student_id: studentId,
    fee_id: feeId,
    amount: parseFloat(amount),
    amountPaid: parseFloat(amount),
    payment_method: paymentMethod || 'cash',
    reference_number: referenceNumber || `PAY${Date.now()}`,
    notes,
    academicYear: academicYear || '2023/2024',
    term: normalizeTerm(term),
    status: 'completed',
    paymentDate: new Date().toISOString(),
    recorded_by: req.user.id,
    receiptNumber: `RCP${Date.now()}`
  };

  const result = await supabaseService.create(COLLECTIONS.PAYMENTS, paymentData);
  
  res.status(201).json({
    success: true,
    data: mapPaymentToFrontend(result)
  });
});

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment
};
