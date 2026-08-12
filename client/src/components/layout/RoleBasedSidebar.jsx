
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Menu configurations for each role
const menuConfigs = {
  admin: [
    { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', path: '/admin-dashboard' },
    { 
      name: 'Students', 
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', 
      expandable: true,
      subItems: [
        { name: 'All Students', path: '/students' },
        { name: 'Admission Form', path: '/students/add' },
        { name: 'Student Promotion', path: '/students/promote' }
      ]
    },
    { 
      name: 'Staff', 
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', 
      expandable: true,
      subItems: [
        { name: 'Non-Teaching Staff', path: '/staff/non-teaching' },
        { name: 'Teaching Staff', path: '/teachers' }
      ]
    },
    { 
      name: 'Academic', 
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', 
      expandable: true,
      subItems: [
        { name: 'Classes', path: '/classes' },
        { name: 'Sections', path: '/sections' },
        { name: 'Subjects', path: '/subjects' },
        { name: 'Subject Allocation', path: '/courses' },
        { name: 'Timetable', path: '/timetable' }
      ]
    },
    { name: 'Parents', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', path: '/parents' },
    { name: 'Attendance', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/attendance' },
    { 
      name: 'Exams & Results', 
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', 
      expandable: true,
      subItems: [
        { name: 'Results Overview', path: '/exams' },
        { name: 'Exam Schedule', path: '/exams/schedule' },
        { name: 'Marks Entry', path: '/exams/marks' }
      ]
    },
    { 
      name: 'Fees & Finance', 
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 
      expandable: true,
      subItems: [
        { name: 'Overview', path: '/fees' },
        { name: 'Fee Structure', path: '/fees/structure' },
        { name: 'Collection', path: '/fees/collection' },
        { name: 'Expenses', path: '/fees/expenses' },
        { name: 'Income', path: '/fees/income' }
      ]
    },
    { 
      name: 'Reports', 
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 
      expandable: true,
      subItems: [
        { name: 'Academic Reports', path: '/reports/academic' },
        { name: 'Financial Reports', path: '/reports/financial' },
        { name: 'Staff Reports', path: '/reports/staff' }
      ]
    },
    { name: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', path: '/settings' },
    { name: 'Activity Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', path: '/admin/activity-logs' },
  ],
  teacher: [
    { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', path: '/teacher-dashboard' },
    { name: 'My Classes', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', path: '/classes' },
    { name: 'Students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', path: '/students' },
    { name: 'Attendance', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/attendance' },
    { name: 'Assignments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', path: '/assignments' },
    { name: 'Exam Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/exams/schedule' },
    { name: 'Grades', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', path: '/exams/marks' },
    { name: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', path: '/reports/academic' },
    { name: 'Timetable', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', path: '/timetable' },
    { name: 'Courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', path: '/courses' },
  ],
  parent: [
    { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', path: '/parent-dashboard' },
    { 
      name: 'My Children', 
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', 
      path: '/students'
    },
    { name: 'Exam Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/exams/schedule' },
    { name: 'Timetable', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/timetable' },
    { 
      name: 'Academic Info', 
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', 
      path: '/courses'
    },
    { name: 'Attendance', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/attendance' },
    { name: 'Assignments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', path: '/assignments' },
    { 
      name: 'Grades', 
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', 
      path: '/exams'
    },
    { name: 'Terminal Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', path: '/reports/academic' },
    { name: 'Fees & Payments', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', path: '/fees' },
    { name: 'Announcements', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', path: '/announcements' },
  ],
  finance: [
    { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', path: '/finance-dashboard' },
    { 
      name: 'Fees & Finance', 
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 
      expandable: true,
      subItems: [
        { name: 'Overview', path: '/fees' },
        { name: 'Collection', path: '/fees/collection' },
        { name: 'Expenses', path: '/fees/expenses' },
        { name: 'Income', path: '/fees/income' }
      ]
    },
    { name: 'Students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', path: '/students' },
    { name: 'Financial Report', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', path: '/reports/financial' },
  ],
  itsupport: [
    { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', path: '/it-dashboard' },
    { name: 'Exam Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/exams/schedule' },
    { 
      name: 'System Status', 
      icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01', 
      expandable: true,
      subItems: [
        { name: 'Logs', path: '/it/logs' },
        { name: 'Status', path: '/it/system' }
      ]
    },
    { 
      name: 'User Management', 
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', 
      expandable: true,
      subItems: [
        { name: 'Users', path: '/it/users' },
        { name: 'Roles', path: '/it/settings' }
      ]
    },
    { name: 'Error Logs', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', path: '/it/logs' },
    { name: 'Support Tickets', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', path: '/it/tickets' },
    { name: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', path: '/it/settings' },
  ],
 admission: [
    { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', path: '/admission-dashboard' },
    { 
      name: 'Students', 
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', 
      expandable: true,
      subItems: [
        { name: 'All Students', path: '/students' },
        { name: 'Admission Form', path: '/students/add' }
      ]
    },
    { name: 'Parents', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', path: '/parents' },
    { name: 'Attendance', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/attendance' },
    { name: 'Academic', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', path: '/classes' },
    { name: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', path: '/reports/academic' },
  ]
};

const accountItems = [
  { name: 'Help & Support', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', path: '/account/help' },
  { name: 'Login History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', path: '/account/login-history' },
  { name: 'Configuration', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', path: '/account/config' },
];

const RoleBasedSidebar = ({ user, onLogout, activeMenu, setActiveMenu }) => {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);
  
  const role = user?.role || 'admin';
  let menuItems = [...(menuConfigs[role] || menuConfigs.admin)];
  
  // Dynamic addition for Class Masters (Teachers)
  if (role === 'teacher' && user?.masteredSections && user.masteredSections.length > 0) {
    const hasReports = menuItems.some(item => item.name === 'Reports');
    if (!hasReports) {
      menuItems.push({ 
        name: 'Reports', 
        icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 
        path: '/reports/academic' 
      });
    }
  }

  const schoolName = user?.schoolName || 'UHAS-Basic School';
  const schoolSubtitle = 'Learning Today, Leading Tomorrow';

  // Resolve path — supports dynamic segments for student/teacher own profile
  const resolvePath = (item) => {
    if (!item.path) return null;
    const id = user?.studentId || user?.teacherId || user?.id || user?.uid;
    // Student: "My Profile" → their own profile page
    if (role === 'student' && item.name === 'My Profile' && id) return `/students/${id}`;
    // Teacher: "My Classes" could later link to teacher-specific classes
    return item.path;
  };

  const toggleExpand = (item) => {
    setExpandedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handleMenuClick = (item) => {
    if (item.expandable) {
      toggleExpand(item.name);
    } else {
      if (typeof setActiveMenu === 'function') setActiveMenu(item.name);
      const path = resolvePath(item);
      if (path) navigate(path);
      // Close sidebar on mobile after navigation
      if (window.innerWidth <= 1024) setIsOpen(false);
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Get role display name and color
  const getRoleInfo = () => {
    const roles = {
      admin: { name: 'Administrator', color: 'var(--brand-yellow)' }, // Yellow accent
      teacher: { name: 'Teacher', color: 'var(--brand-yellow)' },
      student: { name: 'Student', color: 'var(--brand-yellow)' },
      parent: { name: 'Parent', color: 'var(--brand-yellow)' },
      finance: { name: 'Finance', color: 'var(--brand-yellow)' },
      itsupport: { name: 'IT Support', color: 'var(--brand-yellow)' },
      admission: { name: 'Admission', color: 'var(--brand-yellow)' },
    };
    return roles[role] || roles.admin;
  };

  const roleInfo = getRoleInfo();

const closeSidebar = () => setIsOpen(false);

return (
    <>
    {/* Mobile Overlay */}
    <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={closeSidebar} />
    
    <div className={`role-sidebar ${isOpen ? 'open' : ''}`} style={{
      width: '260px',
      height: '100vh',
      backgroundColor: '#00843e',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
      boxShadow: '4px 0 20px rgba(0, 132, 62, 0.2)',
      overflow: 'hidden'
    }}>
      {/* Logo Section */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              padding: '6px'
            }}>
              <img src="/UBS.png" alt="UBS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '950', color: 'white', lineHeight: '1.1', margin: 0, letterSpacing: '-0.5px', fontFamily: "'Outfit', sans-serif" }}>UHAS <span style={{ color: 'var(--brand-yellow)' }}>BASIC</span></h1>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.95)', marginTop: '2px', fontWeight: '800', letterSpacing: '2px', fontFamily: "'Outfit', sans-serif" }}>SCHOOL</p>
            </div>
          </div>
          <p style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.65)', marginTop: '14px', fontWeight: '800', letterSpacing: '1.2px', whiteSpace: 'nowrap' }}>LEARNING TODAY LEADING TOMORROW</p>
        </div>
      </div>


      {/* Role Badge */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-yellow)', boxShadow: '0 0 10px var(--brand-yellow)' }}></div>
          <span style={{ fontSize: '11px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>{roleInfo.name}</span>
        </div>
      </div>


      <div style={{ flex: 1, padding: '20px 12px', overflowY: 'auto' }}>
        <p style={{ 
          fontSize: '11px', 
          color: 'rgba(255,255,255,0.5)', 
          fontWeight: '700', 
          letterSpacing: '1px',
          marginBottom: '12px',
          paddingLeft: '12px',
          textTransform: 'uppercase'
        }}>
          Navigation
        </p>
        
        {menuItems.map((item) => (
          <div key={item.name}>
            <button
              onClick={() => handleMenuClick(item)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: activeMenu === item.name ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: 'none',
                color: activeMenu === item.name ? 'white' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                marginBottom: '6px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                borderLeft: activeMenu === item.name ? '3px solid var(--brand-yellow)' : '3px solid transparent'
              }}

              onMouseOver={(e) => {
                if (activeMenu !== item.name) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseOut={(e) => {
                if (activeMenu !== item.name) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span style={{ fontSize: '14px', fontWeight: activeMenu === item.name ? '700' : '500' }}>{item.name}</span>
              </div>
              {item.expandable && (
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{ transform: expandedItems[item.name] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            
            {/* Sub-items - Pill-style dropdown on green background */}
            {item.subItems && expandedItems[item.name] && (
              <div style={{ marginLeft: '12px', marginBottom: '8px', padding: '6px', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '12px' }}>
                {item.subItems.map((subItem, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (subItem.path) {
                        navigate(subItem.path);
                        setActiveMenu(subItem.name);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textAlign: 'left',
                      marginBottom: '4px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                    }}
                  >
                    {subItem.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Account Section */}
      <div style={{ padding: '20px 12px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <p style={{ 
          fontSize: '11px', 
          color: 'rgba(255,255,255,0.5)', 
          fontWeight: '700', 
          letterSpacing: '1px',
          marginBottom: '12px',
          paddingLeft: '12px',
          textTransform: 'uppercase'
        }}>
          Account
        </p>
        
        {accountItems.map((item) => (
          <button
            key={item.name}
            onClick={() => handleMenuClick(item)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              marginBottom: '4px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</span>
          </button>
        ))
        }
        
        {/* Sign Out Button */}
        <button
          onClick={handleLogoutClick}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fca5a5',
            cursor: 'pointer',
            marginTop: '8px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#fca5a5';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Sign Out</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default RoleBasedSidebar;
