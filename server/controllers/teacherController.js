const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');
const bcrypt = require('bcryptjs');

// Helper to map DB snake_case to Frontend camelCase
const mapTeacherToFrontend = (t) => {
  if (!t) return null;
  return {
    id: t.id,
    userId: t.user_id,
    firstName: t.first_name,
    lastName: t.last_name,
    email: t.email,
    phone: t.phone,
    employeeId: t.employee_id,
    subject: t.subject,
    subjects: t.subjects || [],
    grades: t.grades || [],
    classTeacherOf: t.class_teacher_of,
    salary: t.salary,
    position: t.position || 'Teacher',
    specialization: t.specialization,
    experience: t.experience || 0,
    status: t.status,
    coordinatorBlock: t.coordinator_block,
    profileImage: t.profile_image,
    qualifications: t.qualifications || [],
    dateOfEmployment: t.date_of_employment,
    dateOfBirth: t.date_of_birth,
    gender: t.gender,
    nationality: t.nationality,
    contractType: t.contract_type,
    address: t.address || {
      street: '',
      city: '',
      region: '',
      country: 'Ghana'
    },
    emergencyContact: t.emergency_contact || {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    bankAccount: t.bank_account || {
      bankName: '',
      accountNumber: '',
      accountName: '',
      branch: ''
    },
    socialSecurity: t.social_security,
    bio: t.bio,
    createdAt: t.created_at,
    updatedAt: t.updated_at
  };
};

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
const getAllTeachers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, subject, status = 'active' } = req.query;

  let query = supabase.from(COLLECTIONS.TEACHERS).select('*');
  
  if (req.user.role === 'teacher') {
    query = query.eq('user_id', req.user.id);
  } else {
    query = query.order('last_name', { ascending: true });
  }

  const { data: teachersData, error: teachersError } = await query;
  if (teachersError) throw teachersError;
  let teachers = teachersData || [];

  // No need to filter by isStaff here as COLLECTIONS.TEACHERS only contains teachers

  // Enrich with user emails if missing in teacher records
  const teacherWithEmails = await Promise.all(teachers.map(async (t) => {
    if (!t.email && t.user_id) {
      try {
        const user = await supabaseService.getById(COLLECTIONS.USERS, t.user_id);
        if (user) t.email = user.email;
      } catch (err) {}
    }
    return t;
  }));

  teachers = teacherWithEmails;

  // Fetch all subject names for resolution
  const allSubjects = await supabaseService.getAll(COLLECTIONS.SUBJECTS);
  const subjectMap = {};
  allSubjects.forEach(s => {
    subjectMap[s.id] = s.name;
  });

  // Also fetch class-subject allocations to resolve allocation IDs to subject names
  const allAllocations = await supabase.from(COLLECTIONS.CLASS_SUBJECTS).select('id, subject_id');
  const allocationMap = {};
  if (allAllocations.data) {
    allAllocations.data.forEach(a => {
      if (a.subject_id && subjectMap[a.subject_id]) {
        allocationMap[a.id] = subjectMap[a.subject_id];
      }
    });
  }

  // Apply filters and resolve subject names
  if (status) {
    teachers = teachers.filter(t => t.status === status);
  }
  // Fetch all class-subject allocations to use as the source of truth for assignments
  const { data: allAssignments, error: assignmentsError } = await supabase
    .from(COLLECTIONS.CLASS_SUBJECTS)
    .select(`
      id,
      teacher_id,
      subject:subject_id (name),
      class:class_id (name),
      section,
      academic_year
    `);

  // Group assignments by teacher
  const teacherAssignments = {};
  if (allAssignments) {
    allAssignments.forEach(a => {
      if (!a.teacher_id) return;
      if (!teacherAssignments[a.teacher_id]) {
        teacherAssignments[a.teacher_id] = { subjects: new Set(), grades: new Set() };
      }
      if (a.subject?.name) teacherAssignments[a.teacher_id].subjects.add(a.subject.name);
      if (a.class?.name) {
        const gradeStr = `${a.class.name}${a.section ? ' ' + a.section : ''}`;
        teacherAssignments[a.teacher_id].grades.add(gradeStr);
      }
    });
  }

  // Resolve and merge data
  teachers = teachers.map(t => {
    const assignments = teacherAssignments[t.id];
    if (assignments) {
      // Prioritize live assignments over legacy columns
      t.subjects = Array.from(assignments.subjects);
      t.grades = Array.from(assignments.grades);
      // Update primary subject if assignments exist
      if (t.subjects.length > 0) t.subject = t.subjects[0];
    } else {
      // Fallback to existing logic for legacy resolution if no new assignments found
      if (t.subjects && Array.isArray(t.subjects)) {
        t.subjects = t.subjects
          .map(sId => subjectMap[sId] || allocationMap[sId] || sId)
          .filter(s => {
            // Filter out unresolvable UUIDs
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
            return !isUUID;
          });
        t.subjects = [...new Set(t.subjects)];
      }
      if (t.subject) {
        const resolved = subjectMap[t.subject] || allocationMap[t.subject] || t.subject;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolved);
        t.subject = isUUID ? (t.subjects[0] || 'Teacher') : resolved;
      }
    }
    return t;
  });

  if (search) {
    const searchWords = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    teachers = teachers.filter(t => {
      const fullName = `${t.first_name || ''} ${t.last_name || ''}`.toLowerCase();
      return searchWords.every(word =>
        fullName.includes(word) ||
        t.employee_id?.toLowerCase().includes(word) ||
        t.email?.toLowerCase().includes(word) ||
        (t.subjects && t.subjects.some(s => s.toLowerCase().includes(word)))
      );
    });
  }

  // Pagination
  const total = teachers.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedTeachers = teachers.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedTeachers.map(mapTeacherToFrontend),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Private
const getTeacherById = asyncHandler(async (req, res) => {
  try {
    const teacher = await supabaseService.getById(COLLECTIONS.TEACHERS, req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Resolve subject UUIDs to names
    const allSubjects = await supabaseService.getAll(COLLECTIONS.SUBJECTS);
    const subjectMap = {};
    allSubjects.forEach(s => {
      subjectMap[s.id] = s.name;
    });

    const { data: assignments, error: assignError } = await supabase
      .from(COLLECTIONS.CLASS_SUBJECTS)
      .select(`*, subject:subject_id(name), class:class_id(name)`)
      .eq('teacher_id', teacher.id);

    if (!assignError && assignments && assignments.length > 0) {
      // Prioritize live assignments
      const liveSubjects = [...new Set(assignments.map(a => a.subject?.name).filter(Boolean))];
      const liveGrades = [...new Set(assignments.map(a => `${a.class?.name}${a.section ? ' ' + a.section : ''}`).filter(Boolean))];
      
      teacher.subjects = liveSubjects;
      teacher.grades = liveGrades;
      if (liveSubjects.length > 0) teacher.subject = liveSubjects[0];
    } else {
      // Fallback to existing logic if no live assignments found
      const allAllocations = await supabase.from(COLLECTIONS.CLASS_SUBJECTS).select('id, subject_id');
      const allocationMap = {};
      if (allAllocations.data) {
        allAllocations.data.forEach(a => {
          if (a.subject_id && subjectMap[a.subject_id]) {
            allocationMap[a.id] = subjectMap[a.subject_id];
          }
        });
      }

      if (teacher.subjects && Array.isArray(teacher.subjects)) {
        teacher.subjects = teacher.subjects
          .map(sId => subjectMap[sId] || allocationMap[sId] || sId)
          .filter(s => {
            // Filter out unresolvable UUIDs
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
            return !isUUID;
          });
        teacher.subjects = [...new Set(teacher.subjects)];
      }
      if (teacher.subject) {
        const resolved = subjectMap[teacher.subject] || allocationMap[teacher.subject] || teacher.subject;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolved);
        teacher.subject = isUUID ? (teacher.subjects[0] || 'Teacher') : resolved;
      }
    }

    const mappedData = mapTeacherToFrontend(teacher);
    res.json({ success: true, data: mappedData });
  } catch (error) {
    console.error(`Critical error fetching teacher ${req.params.id}:`, error);
    res.status(500).json({ 
      message: 'Internal server error while fetching teacher details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Create new teacher
// @route   POST /api/teachers
// @access  Private (Admin)
const createTeacher = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    gender,
    qualifications,
    dateOfEmployment,
    address,
    emergencyContact,
    salary,
    bankAccount,
    socialSecurity,
    subjects,
    grades,
    bio,
    role,
    department,
    employeeId,
    coordinatorBlock
  } = req.body;

  if (!employeeId || !email) {
    return res.status(400).json({ message: 'Employee ID and Email are required.' });
  }

  // Check uniqueness of Employee ID
  const existingTeacher = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'employee_id', employeeId.trim());
  if (existingTeacher) {
    return res.status(400).json({ message: `Teacher with Employee ID '${employeeId}' already exists.` });
  }

  // Check uniqueness of Email
  const existingUser = await supabaseService.getByField(COLLECTIONS.USERS, 'email', email.toLowerCase().trim());
  if (existingUser) {
    return res.status(400).json({ message: `User with email '${email}' already exists.` });
  }
  
  // Generate default password based on employee ID
  const defaultPassword = `${employeeId.toLowerCase().trim()}uhas_basic_password`;

  // Create user account in Supabase users table
  let userUid = null;
  const userEmail = email.toLowerCase().trim();
  
  try {
    // Generate hashed password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Create user account in Supabase users table
    const user = await supabaseService.create(COLLECTIONS.USERS, {
      email: userEmail,
      password: hashedPassword,
      role: role || 'teacher',
      first_name: firstName,
      last_name: lastName,
      is_active: true
    });
    userUid = user.id;
  } catch (error) {
    console.error('Error creating teacher account:', error.message);
    // Try to find by email if creation fails (e.g. user already exists)
    try {
      const existingUser = await supabaseService.getByField(COLLECTIONS.USERS, 'email', userEmail);
      if (existingUser) userUid = existingUser.id;
    } catch (findError) {}
    
    if (!userUid) {
      return res.status(400).json({ message: 'Failed to create or find user account: ' + error.message });
    }
  }


  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  // Filter out undefined values and map to snake_case
  const teacherData = {
    employee_id: employeeId.trim(),
    first_name: firstName,
    last_name: lastName,
    email: userEmail,
    phone: phone,
    date_of_birth: dateOfBirth && dateOfBirth !== '' ? dateOfBirth : null,
    gender: gender,
    qualifications: qualifications || [],
    date_of_employment: dateOfEmployment && dateOfEmployment !== '' ? dateOfEmployment : new Date().toISOString().split('T')[0],
    address: address || {},
    emergency_contact: emergencyContact || {},
    salary: salary || 0,
    bank_account: bankAccount || {},
    social_security: socialSecurity,
    subject: subjects?.[0] || '',
    subjects: subjects || [],
    grades: grades || [],
    position: req.body.position || 'Teacher',
    specialization: req.body.specialization || '',
    experience: parseInt(req.body.experience) || 0,
    bio: bio,
    status: 'active',
    coordinator_block: coordinatorBlock,
    user_id: userUid
  };

  let teacher;
  try {
    teacher = await supabaseService.create(COLLECTIONS.TEACHERS, teacherData);
  } catch (error) {
    console.error('Error in createTeacher:', error);
    const errorMsg = error.message || '';
    const errorCode = error.code || '';
    
    if (errorMsg.includes('column') || errorCode === '42703' || errorMsg.includes('schema cache')) {
      const problematicFieldMatch = errorMsg.match(/column ['"](.*?)['"]/);
      const problematicField = problematicFieldMatch ? problematicFieldMatch[1] : null;
      
      if (problematicField && teacherData[problematicField] !== undefined) {
        console.warn(`Removing problematic field: ${problematicField} and retrying creation...`);
        const safeData = { ...teacherData };
        delete safeData[problematicField];
        
        try {
          teacher = await supabaseService.create(COLLECTIONS.TEACHERS, safeData);
        } catch (retryError) {
          throw retryError;
        }
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  res.status(201).json({
    success: true,
    data: mapTeacherToFrontend(teacher),
    credentials: {
      email: userEmail,
      password: defaultPassword
    }
  });
});

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private (Admin)
const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await supabaseService.getById(COLLECTIONS.TEACHERS, req.params.id);

  if (!teacher) {
    return res.status(404).json({ message: 'Teacher not found' });
  }

  const updates = {};
  const fieldMapping = {
    firstName: 'first_name',
    lastName: 'last_name',
    phone: 'phone',
    gender: 'gender',
    qualifications: 'qualifications',
    dateOfBirth: 'date_of_birth',
    employeeId: 'employee_id',
    subjects: 'subjects',
    grades: 'grades',
    address: 'address',
    emergencyContact: 'emergency_contact',
    salary: 'salary',
    bankAccount: 'bank_account',
    socialSecurity: 'social_security',
    status: 'status',
    profileImage: 'profile_image',
    bio: 'bio',
    subject: 'subject',
    contractType: 'contract_type',
    nationality: 'nationality',
    position: 'position',
    specialization: 'specialization',
    experience: 'experience',
    dateOfEmployment: 'date_of_employment',
    coordinatorBlock: 'coordinator_block'
  };

  Object.keys(fieldMapping).forEach(frontendField => {
    if (req.body[frontendField] !== undefined) {
      let value = req.body[frontendField];
      if ((frontendField === 'dateOfBirth' || frontendField === 'dateOfEmployment') && (value === '' || value == null)) {
        return;
      }
      if (frontendField === 'salary' || frontendField === 'experience') {
        value = (value === '' || value == null) ? 0 : (frontendField === 'experience' ? parseInt(value) : parseFloat(value));
      }
      if (frontendField === 'qualifications' && typeof value === 'string') {
        value = value ? [value] : [];
      }
      if ((frontendField === 'subjects' || frontendField === 'grades') && !Array.isArray(value)) {
        value = value ? [value] : [];
      }
      updates[fieldMapping[frontendField]] = value;
    }
  });

  // Sync primary subject with subjects array
  if (updates.subjects && updates.subjects.length > 0) {
    updates.subject = updates.subjects[0];
  } else if (updates.subject) {
    updates.subjects = [updates.subject];
  }

  if (Object.keys(updates).length === 0) {
    return res.json({ success: true, data: mapTeacherToFrontend(teacher) });
  }

  console.log('Updating teacher with fields:', JSON.stringify(updates, null, 2));

  try {
    const updatedTeacher = await supabaseService.update(
      COLLECTIONS.TEACHERS,
      req.params.id,
      updates
    );

    // Sync with users table if name changed
    if ((updates.first_name || updates.last_name) && updatedTeacher.user_id) {
      await supabase.from('users').update({
        first_name: updatedTeacher.first_name,
        last_name: updatedTeacher.last_name
      }).eq('id', updatedTeacher.user_id);
    }

    res.json({
      success: true,
      data: mapTeacherToFrontend(updatedTeacher)
    });
  } catch (error) {
    console.error('Teacher update error:', error);
    
    // Check for common Postgres/Supabase errors
    const errorMsg = error.message || (typeof error === 'string' ? error : '');
    const errorCode = error.code || '';
    
    // Handle missing columns or schema mismatch
    if (errorMsg.includes('column') || errorCode === '42703' || errorMsg.includes('schema cache')) {
      console.warn('Potential schema mismatch detected. Attempting to identify and remove problematic field...');
      
      const problematicFieldMatch = errorMsg.match(/column ['"](.*?)['"]/);
      const problematicField = problematicFieldMatch ? problematicFieldMatch[1] : null;
      
      if (problematicField) {
        // Find which frontend field maps to this DB column
        const frontendField = Object.keys(fieldMapping).find(key => fieldMapping[key] === problematicField);
        
        if (frontendField && updates[problematicField] !== undefined) {
          console.warn(`Removing problematic field: ${problematicField} and retrying...`);
          const safeUpdates = { ...updates };
          delete safeUpdates[problematicField];
          
          try {
            const fallbackUpdated = await supabaseService.update(
              COLLECTIONS.TEACHERS,
              req.params.id,
              safeUpdates
            );
            return res.json({
              success: true,
              data: mapTeacherToFrontend(fallbackUpdated),
              message: `Updated (field '${problematicField}' skipped due to schema mismatch)`
            });
          } catch (fallbackError) {
            console.error('Fallback update also failed:', fallbackError);
          }
        }
      }
    }

    // If it's a type error (e.g. numeric field got a string)
    if (errorCode === '22P02' || errorMsg.includes('invalid input syntax')) {
      return res.status(400).json({
        message: 'Invalid data format. Please check numeric fields like Salary or Experience.',
        error: errorMsg
      });
    }

    return res.status(500).json({ 
      message: 'Failed to update teacher: ' + (errorMsg || 'Internal Server Error'),
      details: error,
      code: errorCode
    });
  }
});

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private (Admin)
const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await supabaseService.getById(COLLECTIONS.TEACHERS, req.params.id);

  if (!teacher) {
    return res.status(404).json({ message: 'Teacher not found' });
  }

  // Check if teacher is assigned to any subjects
  const assignments = await supabaseService.getManyByField(
    COLLECTIONS.CLASS_SUBJECTS,
    'teacher_id',
    req.params.id
  );

  if (assignments.length > 0) {
    return res.status(400).json({
      message: 'Cannot delete teacher. They are assigned to active subjects/classes.',
    });
  }

  // Delete associated user account in users table (this will cascade to teachers table if configured, 
  // but we'll delete the teacher record explicitly for safety or vice-versa)
  const userId = teacher.user_id;
  
  if (userId) {
    try {
      // In Supabase, deleting from the users table usually requires service_role for Auth users,
      // but here we are using our custom 'users' table which is a public table.
      await supabaseService.delete(COLLECTIONS.USERS, userId);
    } catch (error) {
      console.log('User record delete error:', error.message);
    }
  }

  // If the cascade didn't catch it, delete from teachers
  try {
    await supabaseService.delete(COLLECTIONS.TEACHERS, req.params.id);
  } catch (err) {
    // If it was already deleted by cascade, this might error but that's okay
  }

  res.json({
    success: true,
    message: 'Teacher deleted successfully'
  });
});

// @desc    Get teacher statistics
// @route   GET /api/teachers/stats/overview
// @access  Private (Admin)
const getTeacherStats = asyncHandler(async (req, res) => {
  const teachers = await supabaseService.getAll(COLLECTIONS.TEACHERS);
  
  const totalTeachers = teachers.filter(t => t.status === 'active').length;
  
  // Status distribution
  const statusDistribution = {};
  teachers.forEach(teacher => {
    const status = teacher.status || 'unknown';
    statusDistribution[status] = (statusDistribution[status] || 0) + 1;
  });

  const statusDistributionArray = Object.entries(statusDistribution).map(([status, count]) => ({
    _id: status,
    count
  }));

  res.json({
    success: true,
    data: {
      totalTeachers,
      statusDistribution: statusDistributionArray
    }
  });
});

// @desc    Get teacher's courses
// @route   GET /api/teachers/:id/courses
// @access  Private
const getTeacherCourses = asyncHandler(async (req, res) => {
  const courses = await supabaseService.query(
    COLLECTIONS.COURSES,
    'teacher',
    '==',
    req.params.id
  );

  res.json({
    success: true,
    data: courses
  });
});

// @desc    Get current teacher's courses (logged in teacher)
// @route   GET /api/teachers/me/courses
// @access  Private (Teacher)
const getMyCourses = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[DEBUG] getMyCourses called for user: ${userId}`);

    // Find the teacher profile associated with this user
    const teacher = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', userId);
    
    if (!teacher) {
      console.warn(`[DEBUG] No teacher profile found for user ${userId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher profile not found for the logged in user' 
      });
    }

    console.log(`[DEBUG] Fetching academic assignments for teacher ID: ${teacher.id}`);
    
    // 1. Get sections where they are Class Master (or coordinator)
    let masterSectionsQuery = supabase
      .from(COLLECTIONS.SECTIONS)
      .select('*, class:class_id (*)');
      
    let masterSections = [];
    const { data: ownMasterSections, error: masterError } = await masterSectionsQuery.eq('class_master_id', teacher.id);
    if (masterError) throw masterError;
    masterSections = ownMasterSections || [];

    // 2. Join class_subjects with subjects and academic_classes for taught subjects
    let assignments = [];
    const { data: ownAssignments, error } = await supabase
      .from(COLLECTIONS.CLASS_SUBJECTS)
      .select(`
        *,
        subject:subject_id (*),
        class:class_id (*)
      `)
      .eq('teacher_id', teacher.id);

    if (error) throw error;
    assignments = ownAssignments || [];

    // Coordinator logic
    if (teacher.coordinator_block) {
      const block = String(teacher.coordinator_block).toLowerCase().trim();
      const allClasses = await supabaseService.getAll(COLLECTIONS.ACADEMIC_CLASSES);
      const validClassIds = allClasses.filter(c => c.name && c.name.toLowerCase().includes(block)).map(c => c.id);
      
      if (validClassIds.length > 0) {
        // Fetch all assignments for valid classes
        const { data: coordAssignments, error: coordError } = await supabase
          .from(COLLECTIONS.CLASS_SUBJECTS)
          .select(`
            *,
            subject:subject_id (*),
            class:class_id (*)
          `)
          .in('class_id', validClassIds);
          
        if (!coordError && coordAssignments) {
          // Merge and deduplicate
          const existingIds = new Set(assignments.map(a => a.id));
          coordAssignments.forEach(ca => {
            if (!existingIds.has(ca.id)) assignments.push(ca);
          });
        }
        
        // Fetch sections for valid classes
        const { data: coordSections, error: coordSecError } = await supabase
          .from(COLLECTIONS.SECTIONS)
          .select('*, class:class_id (*)')
          .in('class_id', validClassIds);
          
        if (!coordSecError && coordSections) {
          const existingSecIds = new Set(masterSections.map(s => s.id));
          coordSections.forEach(cs => {
            if (!existingSecIds.has(cs.id)) masterSections.push(cs);
          });
        }
      }
    }

    const getGradeVariations = (gName) => {
      const lower = String(gName || '').toLowerCase();
      const num = lower.replace(/basic|primary|kindergarten|kg|jhs|nursery/g, '').trim();
      const base = [lower, lower.replace('primary', 'basic'), lower.replace('basic', 'primary'), num];
      const toTitleCase = (str) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      const expanded = new Set();
      base.forEach(n => { if (n) { expanded.add(n); expanded.add(n.toUpperCase()); expanded.add(toTitleCase(n)); }});
      return Array.from(expanded);
    };

    const transformedAssignments = await Promise.all(assignments.map(async (item) => {
      const gradeName = item.class?.name || '';
      const gradesToSearch = getGradeVariations(gradeName);
      const targetSec = String(item.section || 'A').toLowerCase().replace('section', '').trim();

      const { data: studentsInGrade } = await supabase
        .from(COLLECTIONS.STUDENTS)
        .select('section')
        .in('grade', gradesToSearch);
        
      const matchingStudents = (studentsInGrade || []).filter(s => {
        const dbSec = String(s.section || '').toLowerCase().replace('section', '').trim();
        return dbSec === targetSec || String(s.section || '').toLowerCase() === String(item.section || 'A').toLowerCase();
      });

      return {
        id: item.id,
        _id: item.id,
        name: item.subject?.name || 'Unknown Subject',
        code: item.subject?.code || 'N/A',
        grade: item.class?.name || 'N/A',
        section: item.section || 'A',
        academic_year: item.academic_year,
        studentCount: matchingStudents.length,
        students: []
      };
    }));

    const transformedMasterClasses = await Promise.all((masterSections || []).map(async (s) => {
      const gradeName = s.class?.name || '';
      const gradesToSearch = getGradeVariations(gradeName);
      const targetSec = String(s.name || 'A').toLowerCase().replace('section', '').trim();

      const { data: studentsInGrade } = await supabase
        .from(COLLECTIONS.STUDENTS)
        .select('section')
        .in('grade', gradesToSearch);
        
      const matchingStudents = (studentsInGrade || []).filter(st => {
        const dbSec = String(st.section || '').toLowerCase().replace('section', '').trim();
        return dbSec === targetSec || String(st.section || '').toLowerCase() === String(s.name || 'A').toLowerCase();
      });

      return {
        id: s.id,
        name: gradeName || 'Class',
        section: s.name,
        academic_year: s.class?.academic_year || '2024/2025',
        studentCount: matchingStudents.length
      };
    }));

    res.json({
      success: true,
      data: transformedAssignments,
      masterClasses: transformedMasterClasses
    });
  } catch (error) {
    console.error('[ERROR] getMyCourses failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while fetching your courses',
      error: error.message
    });
  }
});

// @desc    Get current teacher's pending assignments to grade
// @route   GET /api/teachers/me/pending-grading
// @access  Private (Teacher)
const getPendingGrading = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[DEBUG] getPendingGrading called for user: ${userId}`);

    // Find the teacher profile
    const teacher = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', userId);
    
    if (!teacher) {
      console.warn(`[DEBUG] No teacher profile found for user ${userId}`);
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    // Get assigned subjects with names for this teacher
    const { data: subjectAssignments, error: assignError } = await supabase
      .from(COLLECTIONS.CLASS_SUBJECTS)
      .select('*, subject:subject_id(name)')
      .eq('teacher_id', teacher.id);

    if (assignError) throw assignError;
    
    // Normalize names for easier lookup later
    const normalizedAssignments = (subjectAssignments || []).map(as => ({
      ...as,
      subject_name: as.subject?.name || 'Unknown Subject'
    }));

    const assignedSubjectIds = normalizedAssignments.map(a => a.id);
    
    if (assignedSubjectIds.length === 0) {
      return res.json({ success: true, data: [], count: 0 });
    }

    let assignments = [];
    try {
      assignments = await supabaseService.query(COLLECTIONS.ASSIGNMENTS, 'course_id', 'in', assignedSubjectIds);
    } catch (assignErr) {
      console.warn('[DEBUG] Assignments table might be missing or empty:', assignErr.message);
      return res.json({
        success: true,
        data: [],
        count: 0,
        warning: 'Assignments feature is currently being initialized.'
      });
    }

    const teacherAssignments = assignments.filter(a => !a.graded);

    const pendingWithStudentInfo = await Promise.all(
      teacherAssignments.map(async (assignment) => {
        const assignmentRecord = normalizedAssignments.find(as => as.id === (assignment.course_id || assignment.course));
        const submissions = assignment.submissions || [];
        const pendingStudents = Array.isArray(submissions) 
          ? submissions.filter(s => !s.graded || s.score === undefined)
          : [];
        
        return {
          ...assignment,
          courseName: assignmentRecord?.subject_name || 'Unknown',
          pendingCount: pendingStudents.length,
          totalSubmissions: Array.isArray(submissions) ? submissions.length : 0
        };
      })
    );

    res.json({
      success: true,
      data: pendingWithStudentInfo,
      count: pendingWithStudentInfo.length
    });
  } catch (error) {
    console.error('[ERROR] getPendingGrading failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while fetching pending grading',
      error: error.message
    });
  }
});

module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherStats,
  getTeacherCourses,
  getMyCourses,
  getPendingGrading
};

