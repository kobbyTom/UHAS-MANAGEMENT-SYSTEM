import client from './client';

// ==================== AUTH API ====================
export const authAPI = {
  login: (credentials) => client.post('/auth/login', credentials),
  getProfile: () => client.get('/auth/me'),
  updateProfile: (data) => client.put('/auth/profile', data),
  updatePassword: (data) => client.put('/auth/password', data),
  updateNotifications: (data) => client.put('/auth/notifications', data)
};

// ==================== DASHBOARD API ====================
export const dashboardAPI = {
  getStats: () => client.get('/dashboard/stats'),
  getAdminOverview: () => client.get('/dashboard/admin'),
  getOverview: () => client.get('/dashboard/overview'),
  getStudentDashboard: () => client.get('/dashboard/student'),
  getParentDashboard: () => client.get('/dashboard/parent'),
  getTeacherDashboard: () => client.get('/dashboard/teacher'),
};

// ==================== STUDENTS API ====================
export const studentAPI = {
  getAll: (params) => client.get('/students', { params }),
  getById: (id) => client.get(`/students/${id}`),
};

// ==================== TEACHERS API ====================
export const teacherAPI = {
  getAll: (params) => client.get('/teachers', { params }),
  getById: (id) => client.get(`/teachers/${id}`),
};

// ==================== STAFF API ====================
export const staffAPI = {
  getAll: (params) => client.get('/staff', { params }),
};

// ==================== PARENTS API ====================
export const parentAPI = {
  getAll: (params) => client.get('/parents', { params }),
  getMyChildren: () => client.get('/parents/me/children'),
  getMyChildrenAnnouncements: () => client.get('/parents/me/children/announcements'),
  getMyChildrenGrades: () => client.get('/parents/me/children/grades'),
  getMyChildrenAttendance: () => client.get('/parents/me/children/attendance'),
  getMyChildrenFees: () => client.get('/parents/me/children/fees'),
  getChildrenTimetable: () => client.get('/parents/me/children/timetable'),
  getMyChildrenAssignments: () => client.get('/parents/me/children/assignments'),
};

// ==================== COURSES API ====================
export const courseAPI = {
  getAll: (params) => client.get('/courses', { params }),
  getById: (id) => client.get(`/courses/${id}`),
};

// ==================== TIMETABLE API ====================
export const timetableAPI = {
  getAll: (params) => client.get('/timetables', { params }),
  getByClass: (className) => client.get(`/timetables/class/${encodeURIComponent(className)}`),
  getByGrade: (grade) => client.get(`/timetables/grade/${encodeURIComponent(grade)}`),
  getByTeacher: (teacherId) => client.get(`/timetables/teacher/${teacherId}`),
};

// ==================== SUBJECTS API ====================
export const subjectAPI = {
  getAll: (params) => client.get('/subjects', { params }),
};

// ==================== CLASSES API ====================
export const classAPI = {
  getAll: (params) => client.get('/classes', { params }),
  getById: (id) => client.get(`/classes/${id}`),
};

// ==================== SECTIONS API ====================
export const sectionAPI = {
  getAll: (params) => client.get('/sections', { params }),
  getByClass: (classId) => client.get(`/sections/class/${classId}`),
};

// ==================== ATTENDANCE API ====================
export const attendanceAPI = {
  getAll: (params) => client.get('/attendance', { params }),
  getByStudent: (studentId, params) => client.get(`/attendance/student/${studentId}`, { params }),
  getSummary: (studentId) => client.get(`/attendance/student/${studentId}/summary`),
  record: (data) => client.post('/attendance', data),
  bulkRecord: (data) => client.post('/attendance/bulk', data),
};

// ==================== GRADES API ====================
export const gradeAPI = {
  getAll: (params) => client.get('/grades', { params }),
  getByStudent: (studentId, params) => client.get(`/grades/student/${studentId}`, { params }),
};

// ==================== EVENT/CALENDAR API ====================
export const eventAPI = {
  getAll: (params) => client.get('/events', { params }),
  getUpcoming: () => client.get('/events/upcoming'),
  create: (data) => client.post('/events', data),
  update: (id, data) => client.put(`/events/${id}`, data),
  delete: (id) => client.delete(`/events/${id}`),
};

// ==================== ACADEMIC CALENDAR API ====================
export const academicCalendarAPI = {
  getAll: (params) => client.get('/academic-calendar', { params }),
};

// ==================== REPORTS API ====================
export const reportAPI = {
  getPublishedReports: () => client.get('/reports/published'),
  getStudentReport: (studentId, params) => client.get(`/reports/student/${studentId}`, { params }),
};

// ==================== EXAMS API ====================
export const examAPI = {
  getAll: (params) => client.get('/exams/schedule', { params }),
  getById: (id) => client.get(`/exams/schedule/${id}`),
};

// ==================== FEES API ====================
export const feeAPI = {
  getAll: (params) => client.get('/fees', { params }),
  getStats: () => client.get('/fees/stats'),
};

// ==================== AUDIT API ====================
export const auditAPI = {
  getAll: (params) => client.get('/audit', { params }),
};

// ==================== SETTINGS API ====================
export const settingsAPI = {
  getSettings: () => client.get('/settings'),
};

export default {
  authAPI,
  dashboardAPI,
  studentAPI,
  teacherAPI,
  staffAPI,
  parentAPI,
  courseAPI,
  timetableAPI,
  subjectAPI,
  attendanceAPI,
  gradeAPI,
  eventAPI,
  academicCalendarAPI,
  reportAPI,
  settingsAPI,
  examAPI,
  feeAPI,
  auditAPI,
};
