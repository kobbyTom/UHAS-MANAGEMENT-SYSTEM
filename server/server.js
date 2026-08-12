require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const courseRoutes = require('./routes/courseRoutes');
const feeRoutes = require('./routes/feeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const parentRoutes = require('./routes/parentRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const eventRoutes = require('./routes/eventRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const staffRoutes = require('./routes/staffRoutes');
const auditRoutes = require('./routes/auditRoutes');

const dashboardRoutes = require('./routes/dashboardRoutes');
const examRoutes = require('./routes/examRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const gradeMasterRoutes = require('./routes/gradeMasterRoutes');
const classRoutes = require('./routes/classRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const academicCalendarRoutes = require('./routes/academicCalendarRoutes');
const aiRoutes = require('./routes/aiRoutes');


const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'School Management API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/debug/eval', async (req, res) => {
  const { code } = req.body;
  try {
    const supabase = require('./config/supabase');
    const { supabaseService, COLLECTIONS } = require('./services/supabaseService');
    const result = await eval(`(async () => { ${code} })()`);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

app.post('/api/debug/fix-password', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  
  const hashed = await bcrypt.hash(password, 10);
  const { error } = await supabase.from('users').update({ password: hashed }).eq('email', email.toLowerCase());
  if (error) return res.status(500).json({ message: error.message });
  
  res.json({ message: 'Password updated', email });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades/masters', gradeMasterRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/academic-calendar', academicCalendarRoutes);
app.use('/api/ai', aiRoutes);



app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
