const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'school-management-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

const register = asyncHandler(async (req, res) => {
  const { email, password, role, firstName, lastName, phone } = req.body;
  
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
    
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email,
      password: hashedPassword,
      role: role || 'student',
      first_name: firstName,
      last_name: lastName,
      phone,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: 'Failed to create user: ' + error.message });
  }

  let profile = null;
  if (role === 'student') {
    const { data: student } = await supabase
      .from('students')
      .insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        grade: '1',
        academic_year: new Date().getFullYear().toString(),
        status: 'active'
      })
      .select()
      .single();
    profile = student;
  } else if (role === 'teacher') {
    const { data: teacher } = await supabase
      .from('teachers')
      .insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        employee_id: `TCH${Date.now()}`,
        status: 'active'
      })
      .select()
      .single();
    profile = teacher;
  } else if (role === 'parent') {
    const { data: parent } = await supabase
      .from('parents')
      .insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        relationship: 'guardian'
      })
      .select()
      .single();
    profile = parent;
  } else if (['admin', 'finance', 'ITSupport', 'staff'].includes(role?.toLowerCase() || '')) {
    const { data: staff } = await supabase
      .from('staff')
      .insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        employee_id: `STF${Date.now()}`,
        department: role,
        position: role,
        status: 'active'
      })
      .select()
      .single();
    profile = staff;
  }

  const token = generateToken(user.id);
  res.status(201).json({ 
    success: true, 
    token, 
    user: { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      firstName: user.first_name, 
      lastName: user.last_name 
    }, 
    profile 
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  console.log('Login attempt for:', email);

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email.trim())
    .single();

  if (error || !user) {
    console.log('User not found, error:', error?.message);
    return res.status(401).json({ message: 'Invalid credentials - user not found' });
  }

  console.log('User found:', user.email, 'role:', user.role, 'is_active:', user.is_active);

  if (user.is_active === false) {
    return res.status(401).json({ message: 'Account is deactivated' });
  }

  if (user.role === 'student') {
    return res.status(403).json({ message: 'Student access has been deprecated. Please use the Parent portal.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  console.log('Password match result:', isMatch);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials - wrong password' });
  }

  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id);

  // Record detailed login history in background
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    let device = 'Desktop';
    if (/mobile/i.test(userAgent)) device = 'Mobile';
    if (/tablet/i.test(userAgent)) device = 'Tablet';
    if (/iphone|ipad|ipod/i.test(userAgent)) device = 'iOS Device';
    if (/android/i.test(userAgent)) device = 'Android Device';
    
    let browser = 'Browser';
    if (/chrome/i.test(userAgent)) browser = 'Chrome';
    else if (/safari/i.test(userAgent)) browser = 'Safari';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/edg/i.test(userAgent)) browser = 'Edge';

    await supabase
      .from('login_history')
      .insert({
        user_id: user.id,
        device: `${device} (${browser})`,
        ip_address: req.headers['x-forwarded-for'] || req.ip || '127.0.0.1',
        login_time: new Date().toISOString(),
        location: 'Ghana' // Default for now
      });
      
    // Create Audit Log for LOGIN
    const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
    await supabaseService.create(COLLECTIONS.ACTIVITY_LOGS, {
      user_id: user.id,
      user_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown',
      role: user.role || 'Unknown',
      action: 'LOGIN',
      entity: 'AUTH',
      details: { device, browser, ip: req.headers['x-forwarded-for'] || req.ip },
      ip_address: req.headers['x-forwarded-for'] || req.ip || '127.0.0.1'
    });
  } catch (historyErr) {
    console.error('Login History Error:', historyErr.message);
  }

  const token = generateToken(user.id);

  let profile = null;
  if (user.role === 'student') {
    const { data } = await supabase.from('students').select('*').eq('user_id', user.id).single();
    profile = data;
  } else if (user.role === 'teacher') {
    const { data } = await supabase.from('teachers').select('*').eq('user_id', user.id).single();
    profile = data;
    if (profile) {
      const { data: masteredSections } = await supabase
        .from('sections')
        .select('id, name, class_id, academic_year')
        .eq('class_master_id', profile.id);
      profile.masteredSections = masteredSections || [];
    }
  } else if (user.role === 'parent') {
    const { data } = await supabase.from('parents').select('*').eq('user_id', user.id).single();
    profile = data;
  } else if (['admin', 'finance', 'itsupport', 'staff'].includes(user.role?.toLowerCase() || '')) {
    const { data } = await supabase.from('staff').select('*').eq('user_id', user.id).single();
    profile = data;
  }

  // Determine redirect based on role and email
  let redirectPath = '/';
  const userRole = user.role?.toLowerCase();
  
  if (userRole === 'admin') redirectPath = '/admin-dashboard';
  else if (userRole === 'finance') redirectPath = '/finance-dashboard';
  else if (userRole === 'student') redirectPath = '/student-dashboard';
  else if (userRole === 'teacher') redirectPath = '/teacher-dashboard';
  else if (userRole === 'parent') redirectPath = '/parent-dashboard';
  else if (userRole === 'admission') redirectPath = '/admission-dashboard';
  else if (userRole === 'itsupport') redirectPath = '/it-dashboard';
  else if (userRole === 'staff') {
    // Check email for specific staff sub-roles
    const email = user.email?.toLowerCase() || '';
    if (email.includes('it')) {
      redirectPath = '/it-dashboard';
    } else if (email.includes('finance')) {
      redirectPath = '/finance-dashboard';
    } else if (email.includes('admission')) {
      redirectPath = '/admission-dashboard';
    } else {
      redirectPath = '/staff-dashboard';
    }
  }

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    },
    profile,
    redirectPath
  });
});

const getMe = asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    return res.status(404).json({ message: 'User not found' });
  }

  let profile = null;
  if (user.role === 'student') {
    const { data } = await supabase.from('students').select('*').eq('user_id', user.id).single();
    profile = data;
  } else if (user.role === 'teacher') {
    const { data } = await supabase.from('teachers').select('*').eq('user_id', user.id).single();
    profile = data;
    if (profile) {
      const { data: masteredSections } = await supabase
        .from('sections')
        .select('id, name, class_id, academic_year')
        .eq('class_master_id', profile.id);
      profile.masteredSections = masteredSections || [];
    }
  } else if (user.role === 'parent') {
    const { data } = await supabase.from('parents').select('*').eq('user_id', user.id).single();
    profile = data;
  } else if (['admin', 'finance', 'itsupport', 'staff'].includes(user.role?.toLowerCase() || '')) {
    const { data } = await supabase.from('staff').select('*').eq('user_id', user.id).single();
    profile = data;
  }

  res.json({ 
    success: true, 
    user: { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      firstName: user.first_name, 
      lastName: user.last_name 
    },
    profile
  });
});

const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', user.id);

  res.json({ success: true, message: 'Password updated successfully' });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const updates = {};
  if (firstName) updates.first_name = firstName;
  if (lastName) updates.last_name = lastName;
  if (phone !== undefined) updates.phone = phone;

  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (updateError) {
    return res.status(400).json({ message: 'Failed to update profile: ' + updateError.message });
  }

  // Also update specific profile tables if needed (teachers, students, etc.)
  if (user.role === 'admin' || user.role === 'staff' || user.role === 'ITSupport' || user.role === 'finance') {
    await supabase.from('staff').update({ first_name: firstName, last_name: lastName, phone }).eq('user_id', user.id);
  } else if (user.role === 'teacher') {
    await supabase.from('teachers').update({ first_name: firstName, last_name: lastName, phone }).eq('user_id', user.id);
  } else if (user.role === 'parent') {
    await supabase.from('parents').update({ first_name: firstName, last_name: lastName, phone }).eq('user_id', user.id);
  } else if (user.role === 'student') {
    await supabase.from('students').update({ first_name: firstName, last_name: lastName, phone }).eq('user_id', user.id);
  }

  res.json({ 
    success: true, 
    message: 'Profile updated successfully',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name
    }
  });
});

const updateNotifications = asyncHandler(async (req, res) => {
  const { notifications } = req.body;
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ notification_preferences: notifications })
    .eq('id', user.id);

  if (updateError) {
    return res.status(400).json({ message: 'Failed to update notification preferences: ' + updateError.message });
  }

  res.json({ success: true, message: 'Notification preferences updated successfully', notifications });
});

const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = { register, login, getMe, updatePassword, updateProfile, updateNotifications, logout };
