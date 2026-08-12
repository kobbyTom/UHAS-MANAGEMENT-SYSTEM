import axios from 'axios';

// Base URL for the Express server
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:5001' : 'https://uhas-management-system-yhb7.vercel.app');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper function to get token from both storages
const getToken = () => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

// Add interceptors for request/response
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      sessionStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: () => api.post('/api/auth/logout'),
  resetPassword: (email) => api.post('/api/auth/reset-password', { email }),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  updatePassword: (data) => api.put('/api/auth/password', data),
  updateNotifications: (data) => api.put('/api/auth/notifications', data)
};

// ==================== STUDENTS API ====================
export const studentAPI = {
  getAll: (params) => api.get('/api/students', { params }),
  getById: (id) => api.get(`/api/students/${id}`),
  create: (data) => api.post('/api/students', data),
  update: (id, data) => api.put(`/api/students/${id}`, data),
  delete: (id) => api.delete(`/api/students/${id}`),
  search: (query) => api.get('/api/students/search', { params: { q: query } }),
  getByGrade: (grade) => api.get('/api/students/grade', { params: { grade } }),
  getAttendance: (id) => api.get(`/api/students/${id}/attendance`),
  updateAttendance: (id, data) => api.put(`/api/students/${id}/attendance`, data),
  getGrades: (id) => api.get(`/api/students/${id}/grades`)
};

// ==================== TEACHERS API ====================
export const teacherAPI = {
  getAll: (params) => api.get('/api/teachers', { params }),
  getById: (id) => api.get(`/api/teachers/${id}`),
  create: (data) => api.post('/api/teachers', data),
  update: (id, data) => api.put(`/api/teachers/${id}`, data),
  delete: (id) => api.delete(`/api/teachers/${id}`),
  search: (query) => api.get('/api/teachers/search', { params: { q: query } }),
  getBySubject: (subject) => api.get('/api/teachers/subject', { params: { subject } }),
  getMyCourses: () => api.get('/api/teachers/me/courses'),
  getPendingGrading: () => api.get('/api/teachers/me/pending-grading')
};

// ==================== STAFF API ====================
export const staffAPI = {
  getAll: (params) => api.get('/api/staff', { params }),
  getById: (id) => api.get(`/api/staff/${id}`),
  getStats: () => api.get('/api/staff/stats/overview'),
  create: (data) => api.post('/api/staff', data),
  update: (id, data) => api.put(`/api/staff/${id}`, data),
  delete: (id) => api.delete(`/api/staff/${id}`)
};

// ==================== PARENTS API ====================
export const parentAPI = {
  getAll: (params) => api.get('/api/parents', { params }),
  getById: (id) => api.get(`/api/parents/${id}`),
  create: (data) => api.post('/api/parents', data),
  update: (id, data) => api.put(`/api/parents/${id}`, data),
  delete: (id) => api.delete(`/api/parents/${id}`),
  getChildren: (id) => api.get(`/api/parents/${id}/children`),
  getNotifications: (id) => api.get(`/api/parents/${id}/notifications`),
  markNotificationRead: (id, notificationId) => api.put(`/api/parents/${id}/notifications/${notificationId}`),
  migrate: () => api.post('/api/parents/migrate'),
  getChildrenTimetable: (id) => api.get(`/api/parents/${id}/children/timetable`),
  getMyChildren: () => api.get('/api/parents/me/children'),
  getMyChildrenFees: () => api.get('/api/parents/me/children/fees'),
  getMyChildrenGrades: () => api.get('/api/parents/me/children/grades'),
  getMyChildrenAttendance: () => api.get('/api/parents/me/children/attendance'),
  getMyChildrenAssignments: () => api.get('/api/parents/me/children/assignments'),
  getMyChildrenAnnouncements: () => api.get('/api/parents/me/children/announcements')
};

// ==================== COURSES API ====================
export const courseAPI = {
  getAll: (params) => api.get('/api/courses', { params }),
  getById: (id) => api.get(`/api/courses/${id}`),
  create: (data) => api.post('/api/courses', data),
  update: (id, data) => api.put(`/api/courses/${id}`, data),
  delete: (id) => api.delete(`/api/courses/${id}`),
  search: (query) => api.get('/api/courses/search', { params: { q: query } }),
  getByGrade: (grade) => api.get('/api/courses/grade', { params: { grade } }),
  getSyllabus: (id) => api.get(`/api/courses/${id}/syllabus`),
  addMaterial: (id, data) => api.post(`/api/courses/${id}/materials`, data),
  syncStudents: (id, studentIds) => api.post(`/api/courses/${id}/sync-students`, { studentIds }),
  getByTeacher: (teacherId) => api.get('/api/courses', { params: { teacher: teacherId } })
};

// ==================== GRADES API ====================
export const gradeAPI = {
  getAll: (params) => api.get('/api/grades', { params }),
  getById: (id) => api.get(`/api/grades/${id}`),
  create: (data) => api.post('/api/grades', data),
  update: (id, data) => api.put(`/api/grades/${id}`, data),
  delete: (id) => api.delete(`/api/grades/${id}`),
  getByStudent: (studentId, params) => api.get(`/api/grades/student/${studentId}`, { params }),
  getByCourse: (courseId, params) => api.get(`/api/grades/course/${courseId}`, { params }),
  submitBatch: (data) => api.post('/api/grades/bulk', data)
};

// ==================== GRADE MASTER API ====================
export const gradeMasterAPI = {
  getAll: () => api.get('/api/grades/masters'),
  getByGrade: (grade) => api.get(`/api/grades/masters/${encodeURIComponent(grade)}`),
  assign: (data) => api.post('/api/grades/masters', data)
};

// ==================== NEW ACADEMIC API ====================
export const academicClassesAPI = {
  getAll: () => api.get('/api/classes'),
  create: (data) => api.post('/api/classes', data),
  update: (id, data) => api.put(`/api/classes/${id}`, data),
  delete: (id) => api.delete(`/api/classes/${id}`),
  assignSubjects: (id, subjectIds) => api.post(`/api/classes/${id}/subjects`, { subjectIds })
};

export const academicSectionsAPI = {
  getAll: () => api.get('/api/sections'),
  create: (data) => api.post('/api/sections', data),
  update: (id, data) => api.put(`/api/sections/${id}`, data),
  delete: (id) => api.delete(`/api/sections/${id}`)
};

export const academicSubjectsAPI = {
  getAll: () => api.get('/api/subjects'),
  create: (data) => api.post('/api/subjects', data),
  update: (id, data) => api.put(`/api/subjects/${id}`, data),
  delete: (id) => api.delete(`/api/subjects/${id}`)
};

// ==================== ATTENDANCE API ====================
export const attendanceAPI = {
  getAll: (params) => api.get('/api/attendance', { params }),
  getById: (id) => api.get(`/api/attendance/${id}`),
  create: (data) => api.post('/api/attendance', data),
  update: (id, data) => api.put(`/api/attendance/${id}`, data),
  delete: (id) => api.delete(`/api/attendance/${id}`),
  getByStudent: (studentId, params) => api.get(`/api/attendance/student/${studentId}`, { params }),
  getByDate: (date) => {
    const dateStr = date instanceof Date 
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` 
      : date;
    return api.get('/api/attendance', { params: { date: dateStr } });
  },
  getByCourse: (courseId, date) => api.get('/api/attendance/course', { params: { courseId, date } }),
  markBulk: (data) => api.post('/api/attendance/bulk', data),
  getSummary: (studentId) => api.get(`/api/attendance/student/${studentId}/summary`)
};

// ==================== FEES API ====================
export const feeAPI = {
  getAll: (params) => api.get('/api/fees', { params }),
  getById: (id) => api.get(`/api/fees/${id}`),
  getStats: () => api.get('/api/fees/stats/overview'),
  create: (data) => api.post('/api/fees', data),
  update: (id, data) => api.put(`/api/fees/${id}`, data),
  delete: (id) => api.delete(`/api/fees/${id}`),
  getByStudent: (studentId) => api.get(`/api/fees/student/${studentId}`),
  sendReminder: (studentId) => api.post(`/api/fees/${studentId}/remind`),
  sendBulkReminders: () => api.post('/api/fees/remind-all')
};

// ==================== EXPENSES API ====================
export const expenseAPI = {
  getAll: (params) => api.get('/api/expenses', { params }),
  getStats: () => api.get('/api/expenses/stats/overview'),
  create: (data) => api.post('/api/expenses', data),
  update: (id, data) => api.put(`/api/expenses/${id}`, data),
  delete: (id) => api.delete(`/api/expenses/${id}`)
};

// ==================== INCOME API ====================
export const incomeAPI = {
  getAll: (params) => api.get('/api/income', { params }),
  getStats: () => api.get('/api/income/stats/overview'),
  create: (data) => api.post('/api/income', data),
  update: (id, data) => api.put(`/api/income/${id}`, data),
  delete: (id) => api.delete(`/api/income/${id}`)
};

// ==================== PAYMENTS API ====================
export const paymentAPI = {
  getAll: (params) => api.get('/api/payments', { params }),
  getById: (id) => api.get(`/api/payments/${id}`),
  create: (data) => api.post('/api/payments', data),
  getByStudent: (studentId) => api.get('/api/payments/student', { params: { studentId } }),
  getByDateRange: (startDate, endDate) => api.get('/api/payments/date-range', { params: { startDate, endDate } }),
  generateReceipt: (id) => api.get(`/api/payments/${id}/receipt`)
};

// ==================== ASSIGNMENTS API ====================
export const assignmentAPI = {
  getAll: (params) => api.get('/api/assignments', { params }),
  getById: (id) => api.get(`/api/assignments/${id}`),
  create: (data) => api.post('/api/assignments', data),
  update: (id, data) => api.put(`/api/assignments/${id}`, data),
  delete: (id) => api.delete(`/api/assignments/${id}`),
  getByCourse: (courseId) => api.get('/api/assignments/course', { params: { courseId } }),
  getByStudent: (studentId) => api.get('/api/assignments', { params: { student: studentId } }),
  submit: (id, data) => api.post(`/api/assignments/${id}/submit`, data),
  grade: (id, data) => api.post(`/api/assignments/${id}/grade`, data),
  upload: (formData) => api.post('/api/assignments/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getByTeacher: (teacherId) => api.get('/api/assignments', { params: { teacher: teacherId } })
};

// ==================== REPORTS API ====================
export const reportAPI = {
  getFinancialReport: (params) => api.get('/api/reports/financial', { params }),
  getAcademicReport: (params) => api.get('/api/reports/academic', { params }),
  getAttendanceReport: (params) => api.get('/api/reports/attendance', { params }),
  getStudentReport: (studentId, params) => api.get(`/api/reports/student/${studentId}`, { params }),
  getClassReport: (grade, params) => api.get(`/api/reports/class/${encodeURIComponent(grade)}`, { params }),
  getFeeReport: (params) => api.get('/api/reports/fees', { params }),
  sendToParents: (reports) => api.post('/api/reports/send', { reports }),
  getPublishedReports: () => api.get('/api/reports/published'),
  deletePublishedReport: (id) => api.delete(`/api/reports/published/${id}`)
};

// ==================== DASHBOARD API ====================
export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
  getAdminOverview: () => api.get('/api/dashboard/admin'),
  getRecentActivity: () => api.get('/api/dashboard/activity'),
  getUpcomingEvents: () => api.get('/api/dashboard/events')
};

// ==================== EVENT/CALENDAR API ====================
export const eventAPI = {
  getAll: (params) => api.get('/api/events', { params }),
  getUpcoming: () => api.get('/api/events/upcoming'),
  create: (data) => api.post('/api/events', data),
  update: (id, data) => api.put(`/api/events/${id}`, data),
  delete: (id) => api.delete(`/api/events/${id}`)
};

export const academicCalendarAPI = {
  getAll: () => api.get('/api/academic-calendar'),
  create: (data) => api.post('/api/academic-calendar', data),
  update: (id, data) => api.put(`/api/academic-calendar/${id}`, data),
  delete: (id) => api.delete(`/api/academic-calendar/${id}`)
};

export const aiAPI = {
  generateLesson: (data) => api.post('/api/ai/generate-lesson', data)
};

// ==================== TIMETABLE API ====================
export const timetableAPI = {
  getAll: () => api.get('/api/timetable'),
  getById: (id) => api.get(`/api/timetable/id/${id}`),
  getByClass: (className) => api.get(`/api/timetable/class/${encodeURIComponent(className)}`),
  getByGrade: (grade) => api.get(`/api/timetable/grade/${encodeURIComponent(grade)}`),
  getByTeacher: (teacherId) => api.get(`/api/timetable/teacher/${teacherId}`),
  create: (data) => api.post('/api/timetable', data),
  update: (id, data) => api.put(`/api/timetable/${id}`, data),
  delete: (id) => api.delete(`/api/timetable/${id}`),
  deleteAll: () => api.delete('/api/timetable/all'),
  addPeriod: (id, data) => api.post(`/api/timetable/${id}/period`, data),
  removePeriod: (id, data) => api.delete(`/api/timetable/${id}/period`, data)
};

// ==================== SETTINGS API ====================
export const settingsAPI = {
  getSettings: () => api.get('/api/settings'),
  updateSettings: (data) => api.put('/api/settings', data),
  getRoleStats: () => api.get('/api/settings/roles/stats'),
  getIdentities: () => api.get('/api/settings/identities'),
  getAcademicStats: () => api.get('/api/settings/academic/stats'),
  getLoginHistory: () => api.get('/api/settings/login-history'),
  getSystemLogs: () => api.get('/api/settings/system-logs')
};

// ==================== EXAM API ====================
export const examAPI = {
  getSchedule: (params) => api.get('/api/exams/schedule', { params }),
  createSchedule: (data) => api.post('/api/exams/schedule', data),
  updateSchedule: (id, data) => api.put(`/api/exams/schedule/${id}`, data),
  deleteSchedule: (id) => api.delete(`/api/exams/schedule/${id}`),
  getResults: (params) => api.get('/api/exams/results', { params })
};

export default api;

