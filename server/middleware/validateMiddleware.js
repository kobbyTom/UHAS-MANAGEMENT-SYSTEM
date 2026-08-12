// Validation middleware

// Validate student data
const validateStudent = (req, res, next) => {
  const { firstName, lastName, email, dateOfBirth, gender, grade, academicYear } = req.body;
  const errors = [];

  if (!firstName || firstName.trim() === '') {
    errors.push('First name is required');
  }

  if (!lastName || lastName.trim() === '') {
    errors.push('Last name is required');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }

  if (!dateOfBirth) {
    errors.push('Date of birth is required');
  }

  if (!gender || !['male', 'female', 'other'].includes(gender)) {
    errors.push('Valid gender is required');
  }

  if (!grade) {
    errors.push('Grade is required');
  }

  if (!academicYear) {
    errors.push('Academic year is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// Validate teacher data
const validateTeacher = (req, res, next) => {
  const { firstName, lastName, email, dateOfBirth, gender, qualifications } = req.body;
  const errors = [];

  if (!firstName || firstName.trim() === '') {
    errors.push('First name is required');
  }

  if (!lastName || lastName.trim() === '') {
    errors.push('Last name is required');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }

  if (!dateOfBirth) {
    errors.push('Date of birth is required');
  }

  if (!gender || !['male', 'female', 'other'].includes(gender)) {
    errors.push('Valid gender is required');
  }

  if (!qualifications || !Array.isArray(qualifications) || qualifications.length === 0) {
    errors.push('At least one qualification is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// Validate parent data
const validateParent = (req, res, next) => {
  const { firstName, lastName, phone, relationship } = req.body;
  const errors = [];

  if (!firstName || firstName.trim() === '') {
    errors.push('First name is required');
  }

  if (!lastName || lastName.trim() === '') {
    errors.push('Last name is required');
  }

  if (!phone || phone.trim() === '') {
    errors.push('Phone number is required');
  }

  if (!relationship || !['father', 'mother', 'guardian', 'other'].includes(relationship)) {
    errors.push('Valid relationship is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// Validate course data
const validateCourse = (req, res, next) => {
  const { name, code, grade, academicYear } = req.body;
  const errors = [];

  if (!name || name.trim() === '') {
    errors.push('Course name is required');
  }

  if (!code || code.trim() === '') {
    errors.push('Course code is required');
  }

  if (!grade) {
    errors.push('Grade is required');
  }

  if (!academicYear) {
    errors.push('Academic year is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// Validate fee data
const validateFee = (req, res, next) => {
  const { name, academicYear, term, grade, amount, dueDate } = req.body;
  const errors = [];

  if (!name || name.trim() === '') {
    errors.push('Fee name is required');
  }

  if (!academicYear) {
    errors.push('Academic year is required');
  }

  if (!term) {
    errors.push('Term is required');
  }

  if (!grade) {
    errors.push('Grade is required');
  }

  if (!amount || amount <= 0) {
    errors.push('Valid amount is required');
  }

  if (!dueDate) {
    errors.push('Due date is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// Validate payment data
const validatePayment = (req, res, next) => {
  const { studentId, amount, paymentMethod } = req.body;
  const errors = [];

  if (!studentId) {
    errors.push('Student ID is required');
  }

  if (!amount || amount <= 0) {
    errors.push('Valid payment amount is required');
  }

  if (!paymentMethod || !['cash', 'mobile_money', 'bank_transfer', 'card', 'online'].includes(paymentMethod)) {
    errors.push('Valid payment method is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// Validate grade data
const validateGrade = (req, res, next) => {
  const { student, course, academicYear, term } = req.body;
  const errors = [];

  if (!student) {
    errors.push('Student is required');
  }

  if (!course) {
    errors.push('Course is required');
  }

  if (!academicYear) {
    errors.push('Academic year is required');
  }

  if (!term) {
    errors.push('Term is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// Validate assignment data
const validateAssignment = (req, res, next) => {
  const { title, course, grade, dueDate, maxScore } = req.body;
  const errors = [];

  if (!title || title.trim() === '') {
    errors.push('Assignment title is required');
  }

  if (!course) {
    errors.push('Course is required');
  }

  if (!grade) {
    errors.push('Grade is required');
  }

  if (!dueDate) {
    errors.push('Due date is required');
  }

  if (!maxScore || maxScore <= 0) {
    errors.push('Valid maximum score is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

module.exports = {
  validateStudent,
  validateTeacher,
  validateParent,
  validateCourse,
  validateFee,
  validatePayment,
  validateGrade,
  validateAssignment
};

