const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Get admin dashboard overview data
// @route   GET /api/dashboard/admin
// @access  Private (Admin)
const getAdminOverview = asyncHandler(async (req, res) => {
  // 1. Fetch Stats
  const [students, teachers, parents, courses, staff] = await Promise.all([
    supabaseService.getAll(COLLECTIONS.STUDENTS),
    supabaseService.getAll(COLLECTIONS.TEACHERS),
    supabaseService.getAll(COLLECTIONS.PARENTS),
    supabaseService.getAll(COLLECTIONS.COURSES),
    supabaseService.getAll('staff')
  ]);

  const stats = {
    students: students.length,
    activeStudents: students.filter(s => s.status === 'active').length,
    teachers: teachers.length,
    activeTeachers: teachers.filter(t => t.status === 'active').length,
    parents: parents.length,
    subjects: courses.length,
    staff: staff.length
  };

  // 2. Fetch Recent Activities (Last 5 of each)
  const [recentStudents, recentTeachers, recentEvents] = await Promise.all([
    supabaseService.getAll(COLLECTIONS.STUDENTS, { limit: 5, orderBy: 'created_at', orderDirection: 'desc' }),
    supabaseService.getAll(COLLECTIONS.TEACHERS, { limit: 5, orderBy: 'created_at', orderDirection: 'desc' }),
    supabaseService.getAll(COLLECTIONS.EVENTS, { limit: 5, orderBy: 'created_at', orderDirection: 'desc' })
  ]);

  const activities = [
    ...recentStudents.map(s => ({
      type: 'student',
      title: 'New Student Enrolled',
      desc: `${s.first_name} ${s.last_name} joined ${s.grade}`,
      time: s.created_at,
      icon: 'student'
    })),
    ...recentTeachers.map(t => ({
      type: 'teacher',
      title: 'New Teacher Onboarded',
      desc: `${t.first_name} ${t.last_name} joined the faculty`,
      time: t.created_at,
      icon: 'teacher'
    })),
    ...recentEvents.map(e => ({
      type: 'event',
      title: e.title,
      desc: e.description,
      time: e.start_date,
      icon: 'event'
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

  // 3. Fetch Fee Collection Data for Chart (Last 6 months)
  const payments = await supabaseService.getAll(COLLECTIONS.PAYMENTS);
  const monthlyFees = {};
  
  // Initialize last 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = d.toLocaleString('default', { month: 'short' });
    months.push(monthName);
    monthlyFees[monthName] = { paid: 0, unpaid: 0 };
  }

  payments.forEach(p => {
    const date = new Date(p.payment_date || p.created_at);
    const monthName = date.toLocaleString('default', { month: 'short' });
    if (monthlyFees[monthName]) {
      monthlyFees[monthName].paid += Number(p.amount || 0);
    }
  });

  // Calculate unpaid (dummy logic for now, or based on total expected fees)
  const fees = await supabaseService.getAll(COLLECTIONS.FEES);
  fees.forEach(f => {
    const date = new Date(f.due_date || f.created_at);
    const monthName = date.toLocaleString('default', { month: 'short' });
    if (monthlyFees[monthName]) {
      // In a real app, this would be: total students in grade * fee amount - total paid
      // For now, we'll just set a reasonable unpaid amount for visualization
      monthlyFees[monthName].unpaid += Math.floor(monthlyFees[monthName].paid * 0.2); 
    }
  });

  const chartData = months.map(month => ({
    month,
    paid: monthlyFees[month].paid,
    unpaid: monthlyFees[month].unpaid
  }));

  res.json({
    success: true,
    data: {
      stats,
      activities,
      chartData,
      recentStudents: recentStudents.map(s => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        admissionNumber: s.admission_number,
        grade: s.grade,
        status: s.status
      }))
    }
  });
});

module.exports = {
  getAdminOverview
};
