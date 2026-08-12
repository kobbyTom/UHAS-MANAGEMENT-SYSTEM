import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login/Login';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import TeacherDashboard from './pages/Dashboard/TeacherDashboard';
import ParentDashboard from './pages/Dashboard/ParentDashboard';
import FinanceDashboard from './pages/Dashboard/FinanceDashboard';
import ITSupportDashboard from './pages/Dashboard/ITSupportDashboard';
import AdmissionDashboard from './pages/Dashboard/AdmissionDashboard';
import Students from './pages/Students/Students';
import AddStudent from './pages/Students/AddStudent/AddStudent';
import StudentProfile from './pages/Students/StudentProfile/StudentProfile';
import PromoteStudents from './pages/Students/PromoteStudents/PromoteStudents';
import Teachers from './pages/Teachers/Teachers';
import AddTeacher from './pages/Teachers/AddTeacher/AddTeacher';
import TeacherProfile from './pages/Teachers/TeacherProfile/TeacherProfile';
import Courses from './pages/Courses/Courses';
import Classes from './pages/Classes/Classes';
import Subjects from './pages/Subjects/Subjects';
import Timetable from './pages/Timetable/Timetable';
import Attendance from './pages/Attendance/Attendance';
import Parents from './pages/Parents/Parents';
import ParentProfile from './pages/Parents/ParentProfile/ParentProfile';
import Assignments from './pages/Assignments/Assignments';
import CreateAssignment from './pages/Assignments/CreateAssignment';
import AssignmentDetail from './pages/Assignments/AssignmentDetail';
import Announcements from './pages/Announcements/Announcements';

import Results from './pages/Results/Results';
import ExamSchedule from './pages/Exams/ExamSchedule/ExamSchedule';
import MarksEntry from './pages/Exams/MarksEntry/MarksEntry';
import ExamResults from './pages/Exams/ExamResults/ExamResults';
import Fees from './pages/Fees/Fees';
import FeesStructure from './pages/Fees/FeesStructure/FeesStructure';
import FeesCollection from './pages/Fees/FeesCollection/FeesCollection';
import Expenses from './pages/Fees/Expenses/Expenses';
import Income from './pages/Fees/Income/Income';
import SettingsGeneral from './pages/Settings/General/General';
import SettingsAcademic from './pages/Settings/Academic/Academic';
import SettingsUsers from './pages/Settings/Users/Users';
import SettingsRoles from './pages/Settings/Roles/Roles';
import SettingsLayout from './pages/Settings/SettingsLayout';
import Reports from './pages/Reports/Reports';
import FinancialReports from './pages/Reports/FinancialReports';
import StaffReports from './pages/Reports/StaffReports';
import Sections from './pages/Sections/Sections';
import NonTeaching from './pages/Staff/NonTeaching';
import StaffProfile from './pages/Staff/StaffProfile/StaffProfile';
import HelpSupport from './pages/Account/HelpSupport';
import LoginHistory from './pages/Account/LoginHistory';
import Configuration from './pages/Account/Configuration';
import ActivityLogs from './pages/Admin/ActivityLogs/ActivityLogs';
import AuthenticatedLayout from './components/layout/AuthenticatedLayout';
import Unauthorized from './pages/Unauthorized/Unauthorized';
import './index.css';

// PublicRoute - Redirects to dashboard if already authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #00843e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// RoleBasedRoute - Routes to role-specific dashboard
const RoleBasedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const teacherAllowedPaths = new Set([
    '/',
    '/teacher-dashboard',
    '/classes',
    '/students',
    '/attendance',
    '/assignments',
    '/exams/marks',
    '/timetable',
    '/courses',
    '/exams/schedule',
    '/reports',
    '/reports/academic',
    '/announcements',
    '/account/help',
    '/account/login-history',
    '/account/config',
  ]);

  const parentAllowedPaths = new Set([
    '/',
    '/parent-dashboard',
    '/students',
    '/courses',
    '/attendance',
    '/assignments',
    '/exams',
    '/exams/results',
    '/exams/marks',
    '/exams/schedule',
    '/timetable',
    '/fees',
    '/announcements',
    '/reports/academic',
    '/account/login-history',
    '/account/config',
  ]);

  const admissionAllowedPaths = new Set([
    '/',
    '/admission-dashboard',
    '/students',
    '/students/add',
    '/students/:id',
    '/parents',
    '/parents/:id',
    '/attendance',
    '/classes',
    '/sections',
    '/subjects',
    '/courses',
    '/reports',
    '/account/login-history',
    '/account/config',
  ]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #00843e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle root path redirection
  if (location.pathname === '/') {
    if (user.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />;
    if (user.role === 'parent') return <Navigate to="/parent-dashboard" replace />;
    if (user.role === 'admission') return <Navigate to="/admission-dashboard" replace />;
    if (user.role === 'finance') return <Navigate to="/finance-dashboard" replace />;
    if (user.role === 'itsupport') return <Navigate to="/it-dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
  }


  
  if (user.role === 'teacher') {
    const isAllowed = teacherAllowedPaths.has(location.pathname) || location.pathname.startsWith('/assignments/');
    if (!isAllowed) return <Navigate to="/unauthorized" replace />;
  }

  if (user.role === 'parent') {
    const isAllowed = parentAllowedPaths.has(location.pathname) || location.pathname.startsWith('/assignments/');
    if (!isAllowed) return <Navigate to="/unauthorized" replace />;
  }
  if (user.role === 'admission' && !admissionAllowedPaths.has(location.pathname)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AlertProvider>
        <AuthProvider>
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Handle /5173/login route - redirect to /login */}
          <Route path="/5173/login" element={<Navigate to="/login" replace />} />
          
          {/* Protected routes - Role-based dashboards */}
          <Route element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <AuthenticatedLayout />
              </RoleBasedRoute>
            </ProtectedRoute>
          }>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
            <Route path="/parent-dashboard" element={<ParentDashboard />} />
            <Route path="/finance-dashboard" element={<FinanceDashboard />} />
            <Route path="/it-dashboard" element={<ITSupportDashboard />} />
            <Route path="/admission-dashboard" element={<AdmissionDashboard />} />
            
            {/* Student Management Routes */}
            <Route path="/students" element={<Students />} />
            <Route path="/students/add" element={<AddStudent />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/students/promote" element={<PromoteStudents />} />
            
            {/* Teacher Management Routes */}
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/teachers/add" element={<AddTeacher />} />
            <Route path="/teachers/:id" element={<TeacherProfile />} />
            
            {/* Academic Routes */}
            <Route path="/courses" element={<Courses />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/attendance" element={<Attendance />} />
            
            {/* Parents Route */}
            <Route path="/parents" element={<Parents />} />
            <Route path="/parents/:id" element={<ParentProfile />} />
            
            {/* System / Admin Routes */}
            <Route path="/admin/activity-logs" element={<ActivityLogs />} />
            
            {/* Assignments Routes */}
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/assignments/create" element={<CreateAssignment />} />
            <Route path="/assignments/:id" element={<AssignmentDetail />} />
            
            {/* Exams & Results */}
            <Route path="/exams" element={<Results />} />
            <Route path="/exams/schedule" element={<ExamSchedule />} />
            <Route path="/exams/marks" element={<MarksEntry />} />
            <Route path="/exams/results" element={<ExamResults />} />
            
            {/* Finance */}
            <Route path="/fees" element={<Fees />} />
            <Route path="/fees/structure" element={<FeesStructure />} />
            <Route path="/fees/collection" element={<FeesCollection />} />
            <Route path="/fees/collection/:studentId" element={<FeesCollection />} />
            <Route path="/fees/expenses" element={<Expenses />} />
            <Route path="/fees/income" element={<Income />} />
            
            {/* Reports */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/academic" element={<Reports type="academic" />} />
            <Route path="/reports/financial" element={<FinancialReports />} />
            <Route path="/reports/staff" element={<StaffReports />} />

            {/* Sections Management */}
            <Route path="/sections" element={<Sections />} />

            {/* Staff Management */}
            <Route path="/staff/non-teaching" element={<NonTeaching />} />
            <Route path="/staff/:id" element={<StaffProfile />} />

            {/* Account Settings */}
            <Route path="/account/help" element={<HelpSupport />} />
            <Route path="/account/login-history" element={<LoginHistory />} />
            <Route path="/account/config" element={<Configuration />} />
            
            {/* Settings Grouped */}
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<SettingsGeneral />} />
              <Route path="general" element={<SettingsGeneral />} />
              <Route path="academic" element={<SettingsAcademic />} />
              <Route path="users" element={<SettingsUsers />} />
              <Route path="roles" element={<SettingsRoles />} />
            </Route>
            
            <Route path="/announcements" element={<Announcements />} />
          </Route>
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </AlertProvider>
    </Router>
  );
}

export default App;
