const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');
const bcrypt = require('bcryptjs');

// Helper to map DB snake_case to Frontend camelCase
const mapStudentToFrontend = (s) => {
  if (!s) return null;
  return {
    id: s.id,
    userId: s.user_id,
    admissionNumber: s.admission_number,
    firstName: s.first_name,
    lastName: s.last_name,
    email: s.email,
    phone: s.phone,
    dateOfBirth: s.date_of_birth,
    gender: s.gender,
    nationality: s.nationality,
    religion: s.religion,
    grade: s.grade,
    section: s.section,
    academicYear: s.academic_year,
    dateOfAdmission: s.date_of_admission,
    address: s.address || {
      street: '',
      city: '',
      region: '',
      country: 'Ghana'
    },
    emergencyContact: s.emergency_contact || {},
    medicalInfo: s.medical_info || {},
    parentIds: s.parent_ids || [],
    status: s.status,
    profileImage: s.profile_image,
    notes: s.notes,
    createdAt: s.created_at,
    updatedAt: s.updated_at
  };
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private
const getAllStudents = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    grade, 
    section, 
    status,
    academicYear 
  } = req.query;

  let students = await supabaseService.getAll(COLLECTIONS.STUDENTS, { 
    orderBy: 'last_name', 
    orderDirection: 'asc' 
  });

  // Data Isolation for Teachers
  if (req.user.role === 'teacher' || req.user.role === 'staff') {
    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', req.user.id);
    if (teacherProfile) {
      const teacherId = teacherProfile.id;
      
      // 1. Get sections where they are Class Master
      const { data: masterSections } = await supabase
        .from(COLLECTIONS.SECTIONS)
        .select('name, class:class_id(name)')
        .eq('class_master_id', teacherId);
      
      // 2. Get sections where they teach subjects
      const { data: subjectSections } = await supabase
        .from(COLLECTIONS.CLASS_SUBJECTS)
        .select('section, class:class_id(name)')
        .eq('teacher_id', teacherId);
      
      const assignments = [
        ...(masterSections || []).map(s => ({ grade: s.class?.name, section: s.name })),
        ...(subjectSections || []).map(s => ({ grade: s.class?.name, section: s.section }))
      ];

      if (assignments.length === 0) {
        return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
      }

      // Helper to match grade names
      const isGradeMatch = (g1, g2) => {
        if (!g1 || !g2) return false;
        return g1.trim().toLowerCase() === g2.trim().toLowerCase();
      };

      // Filter students by grade and section (case-insensitive)
      const normSection = (sec) => String(sec || '').toLowerCase().replace(/section\s*/i, '').trim();
      students = students.filter(s =>
        assignments.some(a => isGradeMatch(a.grade, s.grade) && normSection(a.section) === normSection(s.section))
      );
    } else {
      return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
    }
  }

  // Data Isolation for Students
  if (req.user.role === 'student') {
    students = students.filter(s => s.user_id === req.user.id);
  }

  // Helper to match grade names
  const isGradeMatch = (g1, g2) => {
    if (!g1 || !g2) return false;
    const n1 = g1.toLowerCase().trim();
    const n2 = g2.toLowerCase().trim();
    // Check for exact match or if one is a substring of the other (for partial search)
    return n1.includes(n2) || n2.includes(n1);
  };

  // Apply filters
  if (status) {
    students = students.filter(s => s.status === status);
  }
  if (grade) {
    students = students.filter(s => isGradeMatch(s.grade, grade));
  }
  if (section) {
    const normSec = String(section).toLowerCase().replace(/section\s*/i, '').trim();
    students = students.filter(s => {
      const sSec = String(s.section || '').toLowerCase().replace(/section\s*/i, '').trim();
      return sSec === normSec;
    });
  }
  if (academicYear) {
    students = students.filter(s => s.academic_year === academicYear);
  }
  if (search) {
    const searchWords = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    students = students.filter(s => {
      const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      return searchWords.every(word =>
        fullName.includes(word) ||
        s.admission_number?.toLowerCase().includes(word) ||
        s.email?.toLowerCase().includes(word) ||
        isGradeMatch(s.grade || '', word)
      );
    });
  }

  // Pagination
  const total = students.length;
  if (limit === 'none') {
    return res.json({
      success: true,
      data: students.map(mapStudentToFrontend),
      pagination: {
        page: 1,
        limit: total,
        total,
        pages: 1
      }
    });
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedStudents = students.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedStudents.map(mapStudentToFrontend),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
const getStudentById = asyncHandler(async (req, res) => {
  let student = await supabaseService.getById(COLLECTIONS.STUDENTS, req.params.id);
  
  if (!student) {
    // Try finding by user_id if ID lookup fails
    student = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', req.params.id);
  }

  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  res.json({ success: true, data: mapStudentToFrontend(student) });
});

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Admin)
const createStudent = asyncHandler(async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      dateOfBirth,
      gender,
      grade,
      section,
      academicYear,
      address,
      emergencyContact,
      medicalInfo,
      admissionNumber: providedAdmissionNumber,
      parents
    } = req.body;

    // Generate admission number
    const allStudents = await supabaseService.getAll(COLLECTIONS.STUDENTS);
    const count = allStudents.length + 1;
    const admission_number = providedAdmissionNumber || `STU/2026/${String(count).padStart(4, '0')}`;
    
    const simpleId = admission_number.replace(/\//g, '').replace(/-/g, '').toLowerCase();
    const defaultPassword = `${simpleId}uhas_basic_password`;
    const userEmail = (email && email.trim() !== '') ? email.toLowerCase().trim() : `${simpleId}@uhasbasic.edu.gh`;
    
    console.log(`[Enrolling Student] Email: ${userEmail}, ID: ${admission_number}`);
    
    // Create user account in Supabase
    let userUid = null;
    try {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const user = await supabaseService.create(COLLECTIONS.USERS, {
        email: userEmail,
        password: hashedPassword,
        role: 'student',
        first_name: firstName,
        last_name: lastName,
        is_active: true
      });
      userUid = user?.id;
    } catch (error) {
      console.error('Error creating user account:', error.message);
      try {
        const existingUser = await supabaseService.getByField(COLLECTIONS.USERS, 'email', userEmail);
        if (existingUser) userUid = existingUser.id;
      } catch (findError) {}
    }

    // Normalize grade to match database check constraints
    let dbGrade = grade;
    if (grade && typeof grade === 'string') {
      // Standard normalization: ensure space between name and number (e.g., "Basic1" -> "Basic 1")
      const standardMatch = grade.match(/^([a-zA-Z\s]+)(\d+)$/);
      if (standardMatch) {
        const namePart = standardMatch[1].trim();
        const numPart = standardMatch[2];
        dbGrade = `${namePart} ${numPart}`;
      }
    }

    const addressObj = address || {
      street: req.body.street || '',
      city: req.body.city || '',
      state: req.body.state || '',
      zipCode: req.body.postalCode || req.body.zipCode || '',
      country: req.body.country || 'Ghana'
    };

    const emergencyContactObj = emergencyContact || {
      name: req.body.emergencyContact || req.body.fatherName || req.body.motherName || '',
      phone: req.body.emergencyPhone || req.body.fatherPhone || req.body.motherPhone || '',
      relationship: req.body.relationship || (req.body.fatherName ? 'Father' : (req.body.motherName ? 'Mother' : ''))
    };

    const studentData = {
      admission_number: admission_number,
      first_name: firstName,
      last_name: lastName,
      email: userEmail,
      date_of_birth: dateOfBirth && dateOfBirth !== '' ? dateOfBirth : null,
      gender: gender ? gender.toLowerCase() : null,
      grade: dbGrade,
      section: section || 'A',
      academic_year: academicYear || '2024/2025',
      address: addressObj,
      emergency_contact: emergencyContactObj,
      medical_info: medicalInfo || {
        bloodType: req.body.bloodGroup || req.body.bloodType || '',
        allergies: Array.isArray(req.body.allergies) ? req.body.allergies : (req.body.allergies ? [req.body.allergies] : []),
        medicalConditions: Array.isArray(req.body.medicalConditions) ? req.body.medicalConditions : (req.body.medicalConditions ? [req.body.medicalConditions] : [])
      },
      parent_ids: Array.isArray(parents) ? parents : [],
      status: 'active',
      user_id: userUid
    };

    const student = await supabaseService.create(COLLECTIONS.STUDENTS, studentData);

    // Automatic Parent Creation/Linking
    if (req.body.fatherName || req.body.motherName || req.body.parentEmail) {
      try {
        const parentFirstName = req.body.fatherName || req.body.motherName || 'Parent';
        const parentLastName = req.body.lastName || lastName;
        const parentUserEmail = req.body.parentEmail || `${simpleId.toLowerCase()}.parent@uhasbasic.edu.gh`;
        
        // 1. Check if parent record already exists
        let parentDoc = null;
        try {
          parentDoc = await supabaseService.getByField(COLLECTIONS.PARENTS, 'email', parentUserEmail);
        } catch (e) {}

        if (parentDoc) {
          console.log(`[Linking Existing Parent] Email: ${parentUserEmail}`);
          // Link existing parent to this student
          const studentIds = parentDoc.student_ids || [];
          if (!studentIds.includes(student.id)) {
            studentIds.push(student.id);
            await supabaseService.update(COLLECTIONS.PARENTS, parentDoc.id, { student_ids: studentIds });
          }
          
          // Update student with this parent's ID
          await supabaseService.update(COLLECTIONS.STUDENTS, student.id, {
            parent_ids: [parentDoc.id]
          });
        } else {
          // 2. Parent doesn't exist, create new user and parent record
          let pUserId;
          try {
            const exist = await supabaseService.getByField(COLLECTIONS.USERS, 'email', parentUserEmail);
            pUserId = exist?.id;
          } catch (e) {}

          if (!pUserId) {
            const hashedParentPassword = await bcrypt.hash(defaultPassword, 10);
            const pUser = await supabaseService.create(COLLECTIONS.USERS, {
              email: parentUserEmail, password: hashedParentPassword, role: 'parent',
              first_name: parentFirstName, last_name: parentLastName, is_active: true
            });
            pUserId = pUser?.id;
          }

          const newParentDoc = await supabaseService.create(COLLECTIONS.PARENTS, {
            first_name: parentFirstName, 
            last_name: parentLastName,
            email: parentUserEmail, 
            phone: req.body.fatherPhone || req.body.motherPhone || 'N/A',
            relationship: (req.body.fatherName ? 'father' : (req.body.motherName ? 'mother' : 'guardian')),
            student_ids: [student.id], 
            user_id: pUserId,
            address: addressObj
          });

          // Update student with the new parent ID
          await supabaseService.update(COLLECTIONS.STUDENTS, student.id, {
            parent_ids: [newParentDoc.id]
          });
        }
      } catch (err) { 
        console.error('Parent auto-creation/linking failed:', err.message); 
      }
    }

    res.status(201).json({
      success: true,
      data: mapStudentToFrontend(student),
      credentials: {
        email: userEmail,
        password: defaultPassword
      }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during student enrollment'
    });
  }
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin)
const updateStudent = asyncHandler(async (req, res) => {
  const student = await supabaseService.getById(COLLECTIONS.STUDENTS, req.params.id);

  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  const fieldMapping = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    dateOfBirth: 'date_of_birth',
    gender: 'gender',
    grade: 'grade',
    section: 'section',
    academicYear: 'academic_year',
    nationality: 'nationality',
    religion: 'religion',
    address: 'address',
    emergencyContact: 'emergency_contact',
    medicalInfo: 'medical_info',
    parentIds: 'parent_ids',
    status: 'status',
    notes: 'notes',
    profileImage: 'profile_image'
  };

  const updates = {};
  Object.keys(fieldMapping).forEach(frontendField => {
    if (req.body[frontendField] !== undefined) {
      let value = req.body[frontendField];
      
      // Normalize gender
      if (frontendField === 'gender' && value) {
        value = value.toLowerCase();
      }
      
      // Normalize grade to match database check constraints
      if (frontendField === 'grade' && value && typeof value === 'string') {
        // Standard normalization: ensure space between name and number (e.g., "Basic1" -> "Basic 1")
        const standardMatch = value.match(/^([a-zA-Z\s]+)(\d+)$/);
        if (standardMatch) {
          const namePart = standardMatch[1].trim();
          const numPart = standardMatch[2];
          value = `${namePart} ${numPart}`;
        }
      }

      updates[fieldMapping[frontendField]] = value;
    }
  });

  if (Object.keys(updates).length === 0) {
    return res.json({ success: true, data: mapStudentToFrontend(student) });
  }

  // Update student with safety for potential missing columns
  try {
    const updatedStudent = await supabaseService.update(
      COLLECTIONS.STUDENTS,
      req.params.id,
      updates
    );

    // Sync with users table if name changed
    if ((updates.first_name || updates.last_name) && updatedStudent.user_id) {
      await supabase.from('users').update({
        first_name: updatedStudent.first_name,
        last_name: updatedStudent.last_name
      }).eq('id', updatedStudent.user_id);
    }

    res.json({
      success: true,
      data: mapStudentToFrontend(updatedStudent)
    });
  } catch (err) {
    // Graceful handling for common Supabase schema cache issues
    if (err.message?.includes('column') && err.message?.includes('not find')) {
      console.warn('Schema mismatch detected during update, attempting fallback...', err.message);
      
      // Remove the potentially problematic fields and try again
      const safeUpdates = { ...updates };
      const problematicField = err.message.match(/'([^']+)' column/)?.[1];
      
      if (problematicField && safeUpdates[problematicField]) {
        delete safeUpdates[problematicField];
        
        try {
          const fallbackStudent = await supabaseService.update(
            COLLECTIONS.STUDENTS,
            req.params.id,
            safeUpdates
          );
          return res.json({
            success: true,
            data: mapStudentToFrontend(fallbackStudent),
            warning: `Field '${problematicField}' could not be updated due to a database schema mismatch.`
          });
        } catch (innerErr) {
          throw innerErr;
        }
      }
    }
    throw err;
  }
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin)
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await supabaseService.getById(COLLECTIONS.STUDENTS, req.params.id);

  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  // Delete user account as well
  if (student.user_id) {
    try {
      await supabaseService.delete(COLLECTIONS.USERS, student.user_id);
    } catch (error) {
      console.error('Error deleting associated user:', error.message);
    }
  }

  await supabaseService.delete(COLLECTIONS.STUDENTS, req.params.id);

  res.json({
    success: true,
    message: 'Student deleted successfully'
  });
});

// @desc    Get student statistics
// @route   GET /api/students/stats/overview
// @access  Private (Admin)
const getStudentStats = asyncHandler(async (req, res) => {
  const students = await supabaseService.getAll(COLLECTIONS.STUDENTS);
  
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  
  // Status distribution
  const statusDistribution = {};
  students.forEach(student => {
    const status = student.status || 'active';
    statusDistribution[status] = (statusDistribution[status] || 0) + 1;
  });

  // Grade distribution
  const gradeDistribution = {};
  students.forEach(student => {
    const grade = student.grade || 'Unknown';
    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
  });

  res.json({
    success: true,
    data: {
      totalStudents,
      activeStudents,
      statusDistribution: Object.entries(statusDistribution).map(([status, count]) => ({ _id: status, count })),
      gradeDistribution: Object.entries(gradeDistribution).map(([grade, count]) => ({ _id: grade, count }))
    }
  });
});

// @desc    Link parent to student
// @route   POST /api/students/:id/parents
// @access  Private (Admin)
const linkParent = asyncHandler(async (req, res) => {
  const { parentId } = req.body;
  const studentId = req.params.id;

  const parent = await supabaseService.getById(COLLECTIONS.PARENTS, parentId);
  if (!parent) return res.status(404).json({ message: 'Parent not found' });

  const student_ids = parent.student_ids || [];
  if (!student_ids.includes(studentId)) {
    student_ids.push(studentId);
    await supabaseService.update(COLLECTIONS.PARENTS, parentId, { student_ids });
  }

  res.json({ success: true, message: 'Parent linked successfully' });
});

// @desc    Unlink parent from student
// @route   DELETE /api/students/:id/parents/:parentId
// @access  Private (Admin)
const unlinkParent = asyncHandler(async (req, res) => {
  const { id: studentId, parentId } = req.params;

  const parent = await supabaseService.getById(COLLECTIONS.PARENTS, parentId);
  if (!parent) return res.status(404).json({ message: 'Parent not found' });

  const student_ids = (parent.student_ids || []).filter(id => id !== studentId);
  await supabaseService.update(COLLECTIONS.PARENTS, parentId, { student_ids });

  res.json({ success: true, message: 'Parent unlinked successfully' });
});

// @desc    Change student password
// @route   POST /api/students/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  // This would typically involve auth service
  res.json({ success: true, message: 'Password change functionality depends on auth service implementation' });
});

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats,
  linkParent,
  unlinkParent,
  changePassword
};
