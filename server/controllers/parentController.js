const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorMiddleware');
const bcrypt = require('bcryptjs');

// Helper to map DB snake_case to Frontend camelCase
const mapParentToFrontend = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    userId: p.user_id,
    firstName: p.first_name,
    lastName: p.last_name,
    email: p.email,
    phone: p.phone,
    alternativePhone: p.alternative_phone,
    occupation: p.occupation,
    relationship: p.relationship,
    studentIds: p.student_ids || [],
    address: p.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Ghana'
    },
    status: p.status,
    profileImage: p.profile_image,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
};

// @desc    Get all parents
// @route   GET /api/parents
// @access  Private
const getAllParents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  let parents = await supabaseService.getAll(COLLECTIONS.PARENTS, { 
    orderBy: 'last_name', 
    orderDirection: 'asc' 
  });

  // Apply search filter
  if (search) {
    const searchWords = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    parents = parents.filter(p => {
      const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
      return searchWords.every(word =>
        fullName.includes(word) ||
        p.email?.toLowerCase().includes(word) ||
        p.phone?.includes(word)
      );
    });
  }

  // Pagination
  const total = parents.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedParents = parents.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedParents.map(mapParentToFrontend),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single parent
// @route   GET /api/parents/:id
// @access  Private
const getParentById = asyncHandler(async (req, res) => {
  const parent = await supabaseService.getById(COLLECTIONS.PARENTS, req.params.id);

  if (!parent) {
    return res.status(404).json({ message: 'Parent not found' });
  }

  const mappedParent = mapParentToFrontend(parent);

  // Get linked students with full details
  const studentIds = parent.student_ids || [];
  if (studentIds.length > 0) {
    const students = [];
    for (const studentId of studentIds) {
      const student = await supabaseService.getById(COLLECTIONS.STUDENTS, studentId);
      if (student) {
        students.push({
          id: student.id,
          firstName: student.first_name,
          lastName: student.last_name,
          grade: student.grade,
          section: student.section,
          admissionNumber: student.admission_number
        });
      }
    }
    mappedParent.students = students;
  }

  res.json({ success: true, data: mappedParent });
});

// @desc    Create new parent
// @route   POST /api/parents
// @access  Private (Admin)
const createParent = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    gender,
    relationship,
    occupation,
    address,
    phone,
    alternativePhone,
    email,
    students
  } = req.body;

  // Generate parent ID
  const allParents = await supabaseService.getAll(COLLECTIONS.PARENTS);
  const parentCount = allParents.length + 1;
  const parentId = `PAR${String(parentCount).padStart(4, '0')}`;
  const defaultPassword = `${parentId}@123`;
  const userEmail = email || `${parentId.toLowerCase()}@uhasbasic.edu.gh`;

  // Create user account
  let userUid = null;
  try {
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const user = await supabaseService.create(COLLECTIONS.USERS, {
      email: userEmail,
      password: hashedPassword,
      role: 'parent',
      first_name: firstName,
      last_name: lastName,
      is_active: true
    });
    userUid = user.id;
  } catch (error) {
    console.error('Error creating parent account:', error.message);
    try {
      const existingUser = await supabaseService.getByField(COLLECTIONS.USERS, 'email', userEmail);
      if (existingUser) userUid = existingUser.id;
    } catch (findError) {}
  }

  const parentData = {
    first_name: firstName,
    last_name: lastName,
    gender,
    relationship,
    occupation,
    phone,
    alternative_phone: alternativePhone,
    email: userEmail,
    student_ids: students || [],
    address: address || {},
    status: 'active',
    user_id: userUid
  };

  const parent = await supabaseService.create(COLLECTIONS.PARENTS, parentData);

  res.status(201).json({
    success: true,
    data: mapParentToFrontend(parent),
    credentials: {
      email: userEmail,
      password: defaultPassword
    }
  });
});

// @desc    Update parent
// @route   PUT /api/parents/:id
// @access  Private (Admin)
const updateParent = asyncHandler(async (req, res) => {
  const parent = await supabaseService.getById(COLLECTIONS.PARENTS, req.params.id);

  if (!parent) {
    return res.status(404).json({ message: 'Parent not found' });
  }

  const fieldMapping = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    alternativePhone: 'alternative_phone',
    gender: 'gender',
    occupation: 'occupation',
    relationship: 'relationship',
    address: 'address',
    studentIds: 'student_ids',
    status: 'status',
    profileImage: 'profile_image'
  };

  const updates = {};
  Object.keys(fieldMapping).forEach(frontendField => {
    if (req.body[frontendField] !== undefined) {
      updates[fieldMapping[frontendField]] = req.body[frontendField];
    }
  });

  if (Object.keys(updates).length === 0) {
    return res.json({ success: true, data: mapParentToFrontend(parent) });
  }

  const updatedParent = await supabaseService.update(
    COLLECTIONS.PARENTS,
    req.params.id,
    updates
  );

  // Sync with users table if name changed
  if ((updates.first_name || updates.last_name) && updatedParent.user_id) {
    await supabase.from('users').update({
      first_name: updatedParent.first_name,
      last_name: updatedParent.last_name
    }).eq('id', updatedParent.user_id);
  }

  res.json({
    success: true,
    data: mapParentToFrontend(updatedParent)
  });
});

// @desc    Delete parent
// @route   DELETE /api/parents/:id
// @access  Private (Admin)
const deleteParent = asyncHandler(async (req, res) => {
  const parent = await supabaseService.getById(COLLECTIONS.PARENTS, req.params.id);

  if (!parent) {
    return res.status(404).json({ message: 'Parent not found' });
  }

  if (parent.user_id) {
    try {
      await supabaseService.delete(COLLECTIONS.USERS, parent.user_id);
    } catch (error) {
      console.error('Error deleting user:', error.message);
    }
  }

  await supabaseService.delete(COLLECTIONS.PARENTS, req.params.id);

  res.json({ success: true, message: 'Parent deleted successfully' });
});



// @desc    Get current parent's children
// @route   GET /api/parents/me/children
// @access  Private (Parent)
const getMyChildren = asyncHandler(async (req, res) => {
  const parent = await supabaseService.query(COLLECTIONS.PARENTS, 'user_id', '==', req.user.id);
  if (!parent || parent.length === 0) return res.status(404).json({ message: 'Parent profile not found' });
  
  const studentIds = parent[0].student_ids || [];
  const children = await Promise.all(studentIds.map(async id => {
    const s = await supabaseService.getById(COLLECTIONS.STUDENTS, id);
    if (!s) return null;
    return {
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      email: s.email,
      grade: s.grade,
      section: s.section,
      status: s.status,
      admissionNumber: s.admission_number,
      profileImage: s.profile_image,
      dateOfBirth: s.date_of_birth,
      gender: s.gender,
      phone: s.phone,
      address: s.address,
      createdAt: s.created_at
    };
  }));
  
  res.json({ success: true, data: children.filter(Boolean) });
});

// @desc    Link student to parent
// @route   POST /api/parents/:id/students
// @access  Private (Admin)
const linkStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const parentId = req.params.id;

  const parent = await supabaseService.getById(COLLECTIONS.PARENTS, parentId);
  if (!parent) return res.status(404).json({ message: 'Parent not found' });

  const student_ids = parent.student_ids || [];
  if (!student_ids.includes(studentId)) {
    student_ids.push(studentId);
    await supabaseService.update(COLLECTIONS.PARENTS, parentId, { student_ids });
  }

  res.json({ success: true, message: 'Student linked successfully' });
});

// @desc    Unlink student from parent
// @route   DELETE /api/parents/:id/students/:studentId
// @access  Private (Admin)
const unlinkStudent = asyncHandler(async (req, res) => {
  const { id: parentId, studentId } = req.params;

  const parent = await supabaseService.getById(COLLECTIONS.PARENTS, parentId);
  if (!parent) return res.status(404).json({ message: 'Parent not found' });

  const student_ids = (parent.student_ids || []).filter(id => id !== studentId);
  await supabaseService.update(COLLECTIONS.PARENTS, parentId, { student_ids });

  res.json({ success: true, message: 'Student unlinked successfully' });
});

// Placeholder for remaining methods to stop the crash
// @desc    Get current parent's children's fees
// @route   GET /api/parents/me/children/fees
// @access  Private (Parent)
const getMyChildrenFees = asyncHandler(async (req, res) => {
  const parent = await supabaseService.query(COLLECTIONS.PARENTS, 'user_id', '==', req.user.id);
  if (!parent || parent.length === 0) return res.status(404).json({ message: 'Parent profile not found' });
  
  const studentIds = parent[0].student_ids || [];
  if (studentIds.length === 0) return res.json({ success: true, data: [] });

  const fees = await supabaseService.getAll(COLLECTIONS.FEES);
  
  const childrenData = await Promise.all(studentIds.map(async id => {
    const s = await supabaseService.getById(COLLECTIONS.STUDENTS, id);
    if (!s) return null;
    const student = { id: s.id, firstName: s.first_name, lastName: s.last_name };
    const studentFees = fees.filter(f => f.student_id === id).map(f => ({
      id: f.id, amount: f.amount, paid: f.amount_paid, status: f.status, description: f.description, type: f.fee_type, title: f.title, due_date: f.due_date
    }));
    return { student, fees: studentFees };
  }));
  
  res.json({ success: true, data: childrenData.filter(Boolean) });
});

// @desc    Get current parent's children's grades
// @route   GET /api/parents/me/children/grades
// @access  Private (Parent)
const getMyChildrenGrades = asyncHandler(async (req, res) => {
  const parent = await supabaseService.query(COLLECTIONS.PARENTS, 'user_id', '==', req.user.id);
  if (!parent || parent.length === 0) return res.status(404).json({ message: 'Parent profile not found' });
  
  const studentIds = parent[0].student_ids || [];
  if (studentIds.length === 0) return res.json({ success: true, data: [] });

  const grades = await supabaseService.getAll(COLLECTIONS.GRADES);
  
  const childrenData = await Promise.all(studentIds.map(async id => {
    const s = await supabaseService.getById(COLLECTIONS.STUDENTS, id);
    if (!s) return null;
    const student = { id: s.id, firstName: s.first_name, lastName: s.last_name, grade: s.grade };
    const studentGrades = grades.filter(g => g.student_id === id).map(g => ({
      id: g.id, subject: g.subject_name || g.subject, score: g.score || g.total_score, grade: g.grade_level || g.grade, term: g.term
    }));
    return { student, grades: studentGrades };
  }));
  
  res.json({ success: true, data: childrenData.filter(Boolean) });
});

// @desc    Get current parent's children's attendance
// @route   GET /api/parents/me/children/attendance
// @access  Private (Parent)
const getMyChildrenAttendance = asyncHandler(async (req, res) => {
  const parent = await supabaseService.query(COLLECTIONS.PARENTS, 'user_id', '==', req.user.id);
  if (!parent || parent.length === 0) return res.status(404).json({ message: 'Parent profile not found' });
  
  const studentIds = parent[0].student_ids || [];
  if (studentIds.length === 0) return res.json({ success: true, data: [] });

  const attendance = await supabaseService.getAll(COLLECTIONS.ATTENDANCE);
  
  const childrenData = await Promise.all(studentIds.map(async id => {
    const s = await supabaseService.getById(COLLECTIONS.STUDENTS, id);
    if (!s) return null;
    const student = { id: s.id, firstName: s.first_name, lastName: s.last_name };
    const studentAttendance = attendance.filter(a => a.student_id === id).map(a => ({
      id: a.id, date: a.date, status: a.status, remarks: a.remarks
    }));
    return { student, attendance: studentAttendance };
  }));
  
  res.json({ success: true, data: childrenData.filter(Boolean) });
});

// @desc    Get current parent's children's assignments
// @route   GET /api/parents/me/children/assignments
// @access  Private (Parent)
const getMyChildrenAssignments = asyncHandler(async (req, res) => {
  const parent = await supabaseService.query(COLLECTIONS.PARENTS, 'user_id', '==', req.user.id);
  if (!parent || parent.length === 0) return res.status(404).json({ message: 'Parent profile not found' });
  
  const studentIds = parent[0].student_ids || [];
  if (studentIds.length === 0) return res.json({ success: true, data: [] });

  const assignments = await supabaseService.getAll(COLLECTIONS.ASSIGNMENTS);
  
  const childrenData = await Promise.all(studentIds.map(async id => {
    const s = await supabaseService.getById(COLLECTIONS.STUDENTS, id);
    if (!s) return null;
    const student = { id: s.id, firstName: s.first_name, lastName: s.last_name };
    // Assuming assignments belong to the student's grade/section, but for simplicity we return all
    const studentAssignments = assignments.map(a => ({
      id: a.id, title: a.title, description: a.description, due_date: a.due_date, status: a.status, score: a.score, subject: a.subject, subject_name: a.subject_name
    }));
    return { student, assignments: studentAssignments };
  }));
  
  res.json({ success: true, data: childrenData.filter(Boolean) });
});

// @desc    Get announcements for parent
// @route   GET /api/parents/me/children/announcements
// @access  Private (Parent)
const getMyChildrenAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await supabaseService.getAll(COLLECTIONS.EVENTS, { limit: 10, orderBy: 'created_at', orderDirection: 'desc' });
  res.json({ success: true, data: announcements });
});

const getNotifications = asyncHandler(async (req, res) => res.json({ success: true, data: [] }));
const migrateParentsFromStudents = asyncHandler(async (req, res) => res.json({ success: true }));
const markNotificationRead = asyncHandler(async (req, res) => res.json({ success: true }));
const getChildrenTimetable = asyncHandler(async (req, res) => {
  const parent = await supabaseService.query(COLLECTIONS.PARENTS, 'user_id', '==', req.user.id);
  if (!parent || parent.length === 0) return res.status(404).json({ message: 'Parent profile not found' });
  
  const studentIds = parent[0].student_ids || [];
  if (studentIds.length === 0) return res.json({ success: true, data: [] });

  const students = await Promise.all(studentIds.map(id => supabaseService.getById(COLLECTIONS.STUDENTS, id)));
  const gradesData = students.filter(Boolean).map(s => s.grade);
  
  const timetables = await supabaseService.getAll('timetables');
  const myChildrenTimetables = timetables.filter(t => gradesData.includes(t.grade));
  
  res.json({ success: true, data: myChildrenTimetables });
});

module.exports = {
  getAllParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent,
  getMyChildren,
  getMyChildrenFees,
  getMyChildrenGrades,
  getMyChildrenAttendance,
  getMyChildrenAssignments,
  getMyChildrenAnnouncements,
  getNotifications,
  migrateParentsFromStudents,
  linkStudent,
  unlinkStudent,
  markNotificationRead,
  getChildrenTimetable
};
