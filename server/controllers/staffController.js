const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorMiddleware');
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

COLLECTIONS.STAFF = 'staff';

// Helper to map DB snake_case to Frontend camelCase
const mapStaffToFrontend = (s) => {
  if (!s) return null;
  return {
    id: s.id,
    userId: s.user_id,
    employeeId: s.employee_id,
    firstName: s.first_name,
    lastName: s.last_name,
    email: s.email,
    phone: s.phone,
    gender: s.gender,
    department: s.department,
    position: s.position,
    dateOfEmployment: s.date_of_employment,
    salary: s.salary,
    status: s.status,
    profileImage: s.profile_image,
    createdAt: s.created_at,
    updatedAt: s.updated_at
  };
};

// @desc    Get all staff
// @route   GET /api/staff
// @access  Private
const getAllStaff = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, department, status = 'active' } = req.query;

  let staff = await supabaseService.getAll(COLLECTIONS.STAFF, { 
    orderBy: 'last_name', 
    orderDirection: 'asc' 
  });

  // Apply filters
  if (status) {
    staff = staff.filter(s => s.status === status);
  }
  if (department) {
    staff = staff.filter(s => s.department === department);
  }
  if (search) {
    const searchWords = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    staff = staff.filter(s => {
      const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      return searchWords.every(word =>
        fullName.includes(word) ||
        s.employee_id?.toLowerCase().includes(word) ||
        s.email?.toLowerCase().includes(word)
      );
    });
  }

  // Pagination
  const total = staff.length;
  let paginatedStaff = staff;
  
  if (limit !== null && limit !== 'null' && limit !== 'all') {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    paginatedStaff = staff.slice(startIndex, endIndex);
  }

  res.json({
    success: true,
    data: paginatedStaff.map(mapStaffToFrontend),
    pagination: {
      page: parseInt(page),
      limit: limit === 'null' || limit === 'all' ? total : parseInt(limit),
      total,
      pages: limit === 'null' || limit === 'all' ? 1 : Math.ceil(total / limit)
    }
  });
});

// @desc    Get single staff
// @route   GET /api/staff/:id
// @access  Private
const getStaffById = asyncHandler(async (req, res) => {
  const staff = await supabaseService.getById(COLLECTIONS.STAFF, req.params.id);

  if (!staff) {
    return res.status(404).json({ message: 'Staff member not found' });
  }

  res.json({ success: true, data: mapStaffToFrontend(staff) });
});

// @desc    Create new staff
// @route   POST /api/staff
// @access  Private (Admin)
const createStaff = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    gender,
    department,
    role,
    dateOfEmployment,
    salary,
    position
  } = req.body;

  // Generate employee ID
  const allStaff = await supabaseService.getAll(COLLECTIONS.STAFF);
  const count = allStaff.length + 1;
  const employeeId = `STF${String(count).padStart(4, '0')}`;
  
  // Generate default password based on employee ID
  const defaultPassword = `${employeeId.toLowerCase()}uhas_basic_password`;
  const userEmail = (email || `${employeeId}@uhasbasic.edu.gh`).toLowerCase().trim();

  // Create user in Supabase 'users' table
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  let mappedRole = 'staff';
  const roleLower = (role || '').toLowerCase();
  if (roleLower.includes('admin')) mappedRole = 'admin';
  else if (roleLower.includes('finance')) mappedRole = 'finance';
  else if (roleLower.includes('it')) mappedRole = 'itsupport';
  else if (roleLower.includes('admission')) mappedRole = 'admission';
  else if (['admin', 'finance', 'itsupport', 'admission', 'staff'].includes(roleLower)) mappedRole = roleLower;

  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      email: userEmail,
      password: hashedPassword,
      role: mappedRole,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      is_active: true
    })
    .select()
    .single();

  if (userError) {
    return res.status(400).json({ message: 'Error creating user account: ' + userError.message });
  }

  const staffData = {
    user_id: user.id,
    employee_id: employeeId,
    first_name: firstName,
    last_name: lastName,
    email: userEmail,
    phone: phone || null,
    gender: gender || 'other',
    department: department || null,
    position: position || role || 'Staff',
    date_of_employment: (dateOfEmployment && dateOfEmployment !== '') ? dateOfEmployment : new Date().toISOString().split('T')[0],
    salary: salary || 0,
    status: 'active'
  };

  const staffMember = await supabaseService.create(COLLECTIONS.STAFF, staffData);

  res.status(201).json({
    success: true,
    data: mapStaffToFrontend(staffMember),
    credentials: {
      email: userEmail,
      password: defaultPassword
    }
  });
});

// @desc    Update staff
// @route   PUT /api/staff/:id
// @access  Private (Admin)
const updateStaff = asyncHandler(async (req, res) => {
  const staff = await supabaseService.getById(COLLECTIONS.STAFF, req.params.id);

  if (!staff) {
    return res.status(404).json({ message: 'Staff member not found' });
  }

  // Map frontend camelCase to backend snake_case
  const fieldMapping = {
    firstName: 'first_name',
    lastName: 'last_name',
    phone: 'phone',
    gender: 'gender',
    department: 'department',
    role: 'position',
    position: 'position',
    email: 'email',
    status: 'status',
    salary: 'salary',
    dateOfEmployment: 'date_of_employment'
  };

  const updates = {};
  Object.keys(fieldMapping).forEach(frontendField => {
    if (req.body[frontendField] !== undefined) {
      updates[fieldMapping[frontendField]] = req.body[frontendField];
    }
  });

  if (Object.keys(updates).length === 0) {
    return res.json({ success: true, data: staff });
  }

  const updatedStaff = await supabaseService.update(
    COLLECTIONS.STAFF,
    req.params.id,
    updates
  );

  // Sync with users table if name changed
  if ((updates.first_name || updates.last_name) && updatedStaff.user_id) {
    await supabase.from('users').update({
      first_name: updatedStaff.first_name,
      last_name: updatedStaff.last_name
    }).eq('id', updatedStaff.user_id);
  }

  res.json({
    success: true,
    data: mapStaffToFrontend(updatedStaff)
  });
});

// @desc    Delete staff
// @route   DELETE /api/staff/:id
// @access  Private (Admin)
const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await supabaseService.getById(COLLECTIONS.STAFF, req.params.id);

  if (!staff) {
    return res.status(404).json({ message: 'Staff member not found' });
  }

  // Delete associated user account
  if (staff.user_id) {
    await supabase.from('users').delete().eq('id', staff.user_id);
  }

  await supabaseService.delete(COLLECTIONS.STAFF, req.params.id);

  res.json({
    success: true,
    message: 'Staff deleted successfully'
  });
});

// @desc    Get staff statistics
// @route   GET /api/staff/stats/overview
// @access  Private (Admin)
const getStaffStats = asyncHandler(async (req, res) => {
  const allStaff = await supabaseService.getAll(COLLECTIONS.STAFF);
  
  // Stats calculation
  const total = allStaff.length;
  const active = allStaff.filter(s => s.status === 'active').length;
  
  // Role distribution
  const roles = {};
  allStaff.forEach(s => {
    const role = s.position || 'Other';
    roles[role] = (roles[role] || 0) + 1;
  });
  
  const roleDistribution = Object.entries(roles).map(([name, value]) => ({
    name,
    value,
    color: name.toLowerCase().includes('teacher') ? '#00843e' : 
           name.toLowerCase().includes('admin') ? '#3b82f6' : '#f59e0b'
  }));

  // Mock attendance trend (placeholder until staff attendance is implemented)
  const attendanceTrend = [
    { day: 'Mon', rate: 95 },
    { day: 'Tue', rate: 98 },
    { day: 'Wed', rate: 92 },
    { day: 'Thu', rate: 96 },
    { day: 'Fri', rate: 90 }
  ];

  res.json({
    success: true,
    data: {
      stats: {
        total: { value: total, change: '+0', color: '#3b82f6', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
        present: { value: active, change: '100%', color: '#00843e', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        onLeave: { value: 0, change: '0', color: '#f59e0b', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        performance: { value: '95%', change: '+0%', color: '#8b5cf6', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
      },
      attendanceTrend,
      roleDistribution,
      staffList: allStaff.slice(0, 10).map(s => ({
        name: `${s.first_name} ${s.last_name}`,
        role: s.position,
        attendance: '100%',
        absent: 0,
        status: 'Perfect',
        avatar: (s.first_name?.[0] || '') + (s.last_name?.[0] || '')
      }))
    }
  });
});

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffStats
};
