import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, teacherAPI, courseAPI, feeAPI, settingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AcademicCalendarWidget from '../../components/dashboard/AcademicCalendarWidget';
import { 
  BarChart as ReBarChart, 
  Bar as ReBar, 
  XAxis as ReXAxis, 
  YAxis as ReYAxis, 
  CartesianGrid as ReCartesianGrid, 
  Tooltip as ReTooltip, 
  ResponsiveContainer as ReResponsiveContainer, 
  Legend as ReLegend 
} from 'recharts';

// Sidebar Component
const Sidebar = ({ onLogout }) => {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (item) => {
    setExpandedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Student', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', expandable: true },
    { name: 'Staff', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', expandable: true },
    { name: 'Class', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { name: 'Parents', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Results', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', expandable: true },
    { name: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Assessment', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { name: 'Timetable', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Finance', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', expandable: true },
  ];

  const accountItems = [
    { name: 'Help & Support', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Login History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Configuration', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  // Add Sign Out to account items
  const handleAccountClick = (itemName) => {
    if (itemName === 'Sign Out') {
      handleLogoutClick();
    }
  };

  return (
    <div style={{
      width: '260px',
      minHeight: '100vh',
      backgroundColor: '#00843e',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100
    }}>
      {/* Logo Section */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#00843e',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 14l9-5-9-5-9 5 9 5z"/>
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold' }}>Goshen Group</h1>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>of Schools</p>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div style={{ flex: 1, padding: '20px 12px', overflowY: 'auto' }}>
        <p style={{ 
          fontSize: '11px', 
          color: '#64748b', 
          fontWeight: '600', 
          letterSpacing: '1px',
          marginBottom: '12px',
          paddingLeft: '12px'
        }}>
          MENU
        </p>
        
        {menuItems.map((item) => (
          <div key={item.name}>
            <button
              onClick={() => {
                setActiveMenu(item.name);
                if (item.expandable) toggleExpand(item.name);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: activeMenu === item.name ? 'rgba(250, 204, 21, 0.2)' : 'transparent',
                border: 'none',
                color: activeMenu === item.name ? 'white' : '#cbd5e1',
                cursor: 'pointer',
                marginBottom: '4px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</span>
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
          </div>
        ))}
      </div>

      {/* Account Section */}
      <div style={{ padding: '20px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ 
          fontSize: '11px', 
          color: '#64748b', 
          fontWeight: '600', 
          letterSpacing: '1px',
          marginBottom: '12px',
          paddingLeft: '12px'
        }}>
          ACCOUNT
        </p>
        
        {accountItems.map((item) => (
          <button
            key={item.name}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              marginBottom: '4px',
              transition: 'all 0.2s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span style={{ fontSize: '14px' }}>{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Top Navigation Bar
const TopNav = ({ user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  return (
    <div style={{
      height: '70px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px',
      position: 'fixed',
      top: 0,
      left: '260px',
      right: 0,
      zIndex: 99
    }}>
      {/* Search Bar */}
      <div style={{ flex: 1, maxWidth: '400px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f1f5f9',
          borderRadius: '10px',
          padding: '10px 16px',
          gap: '10px'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search students, staffs, events…" 
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              outline: 'none',
              fontSize: '14px',
              width: '100%',
              color: '#1e293b'
            }}
          />
        </div>
      </div>

      {/* Right Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* Academic Session */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#dcfce7',
          borderRadius: '8px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00843e" strokeWidth="2">
            <path d="M12 14l9-5-9-5-9 5 9 5z"/>
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
          </svg>
          <span style={{ fontSize: '13px', color: '#00843e', fontWeight: '500' }}>
            {user?.settings?.currentSession || '2023/2024'} Session – {user?.settings?.currentTerm || 'First Term'}
          </span>
        </div>

        {/* Notification Bell */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '8px',
            height: '8px',
            backgroundColor: '#ef4444',
            borderRadius: '50%'
          }}></span>
        </div>

        {/* User Profile with Dropdown */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#00843e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {user?.firstName?.[0] || 'A'}{user?.lastName?.[0] || 'd'}
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Admin User'}
              </p>
              <p style={{ fontSize: '12px', color: '#64748b' }}>{user?.role || 'Admin'}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              width: '200px',
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              zIndex: 1000
            }}>
              <div style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Admin User'}
                </p>
                <p style={{ fontSize: '12px', color: '#64748b' }}>{user?.email || 'admin@goshenschools.com'}</p>
              </div>
              <div style={{ padding: '8px' }}>
                <button 
                  onClick={() => {
                    setShowDropdown(false);
                    if (onLogout) onLogout();
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#dc2626',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Statistics Card Component
const StatCard = ({ icon, title, value, color, loading }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  }}>
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '12px',
      backgroundColor: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>{title}</p>
      {loading ? (
        <div style={{ width: '60px', height: '28px', backgroundColor: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
      ) : (
        <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>{value || 0}</p>
      )}
    </div>
  </div>
);

// Bar Chart Component
const BarChart = ({ feesData, loading }) => {
  const defaultData = [
    { month: 'Jul', paid: 65, unpaid: 35 },
    { month: 'Aug', paid: 70, unpaid: 30 },
    { month: 'Sep', paid: 55, unpaid: 45 },
    { month: 'Oct', paid: 80, unpaid: 20 },
    { month: 'Nov', paid: 75, unpaid: 25 },
    { month: 'Dec', paid: 85, unpaid: 15 },
  ];

  const data = feesData?.length > 0 ? feesData : defaultData;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <p style={{ fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ fontSize: '12px', color: entry.color, margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }}></span>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '20px', height: '300px', width: '100%' }}>
      {loading ? (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
        </div>
      ) : (
        <ReResponsiveContainer width="100%" height="100%">
          <ReBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <ReCartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <ReXAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              dy={10}
            />
            <ReYAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <ReTooltip content={<CustomTooltip />} />
            <ReLegend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '13px', color: '#64748b' }}
            />
            <ReBar 
              dataKey="paid" 
              name="Paid" 
              fill="#00843e" 
              radius={[6, 6, 0, 0]} 
              barSize={32}
            />
            <ReBar 
              dataKey="unpaid" 
              name="Unpaid" 
              fill="#facc15" 
              radius={[6, 6, 0, 0]} 
              barSize={32}
            />
          </ReBarChart>
        </ReResponsiveContainer>
      )}
    </div>
  );
};

// Calendar Component with full functionality
const Calendar = ({ events = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  const today = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = today.getDate();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get the first day of the month and total days in month
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Navigation handlers
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleDateClick = (date) => {
    setSelectedDate(new Date(currentYear, currentMonth, date));
  };
  
  // Check if a date has events
  const hasEvent = (date) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return events.some(event => {
      const eventDate = new Date(event.date);
      const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
      return eventDateStr === dateStr;
    });
  };
  
  // Get events for selected date
  const getEventsForDate = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
      return eventDateStr === dateStr;
    });
  };
  
  // Check if date is today
  const isToday = (date) => {
    return date === currentDay && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };
  
  // Check if date is selected
  const isSelected = (date) => {
    return selectedDate && date === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
  };
  
  return (
    <div style={{ padding: '20px' }}>
      {/* Calendar Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{monthNames[currentMonth]} {currentYear}</h3>
          <button 
            onClick={goToToday}
            style={{
              fontSize: '12px',
              color: '#00843e',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              marginTop: '4px',
              fontWeight: '600'
            }}
          >
            Today: {monthNames[today.getMonth()]} {today.getDate()}, {today.getFullYear()}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={goToPrevMonth}
            style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '6px', 
              border: '1px solid #e2e8f0',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button 
            onClick={goToNextMonth}
            style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '6px', 
              border: '1px solid #e2e8f0',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
        {days.map((day) => (
          <div key={day} style={{ 
            textAlign: 'center', 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#94a3b8',
            padding: '8px 0'
          }}>
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {/* Previous month days */}
        {[...Array(firstDay)].map((_, i) => (
          <div 
            key={`prev-${i}`} 
            style={{ 
              height: '36px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#cbd5e1'
            }}
          >
            {daysInPrevMonth - firstDay + i + 1}
          </div>
        ))}
        
        {/* Current month days */}
        {dates.map((date) => (
          <div 
            key={date}
            onClick={() => handleDateClick(date)}
            style={{ 
              height: '36px', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              backgroundColor: isSelected(date) ? '#00843e' : isToday(date) ? '#dcfce7' : 'transparent',
              color: isSelected(date) ? 'white' : isToday(date) ? '#00843e' : '#1e293b',
              fontWeight: isToday(date) || isSelected(date) ? '600' : '400',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            <span>{date}</span>
            {hasEvent(date) && (
              <div style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: isSelected(date) ? 'white' : '#ef4444',
                position: 'absolute',
                bottom: '4px'
              }}></div>
            )}
          </div>
        ))}
        
        {/* Next month days */}
        {[...Array(42 - firstDay - daysInMonth)].map((_, i) => (
          <div 
            key={`next-${i}`} 
            style={{ 
              height: '36px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#cbd5e1'
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
      
      {/* Selected date events */}
      {selectedDate && getEventsForDate(selectedDate).length > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
            Events on {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
          </h4>
          {getEventsForDate(selectedDate).map((event, index) => (
            <div 
              key={index}
              style={{
                padding: '8px 12px',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                marginBottom: '6px',
                fontSize: '12px',
                color: '#64748b'
              }}
            >
              {event.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Events Component
const UpcomingEvents = () => {
  const events = [
    { title: "Children's Day Celebration", date: '1st October 2023', time: '12:00 – 4:00 PM' },
    { title: '2023/2024 Summer Lesson', date: '21st October 2023', time: '2:00 – 4:00 PM Daily' },
    { title: '25th Inter-house Sport', date: '29th October 2023', time: '2:00 – 4:00 PM' },
    { title: 'First Term Examination', date: '15th November 2023', time: '8:00 AM – 2:00 PM' },
  ];

  return (
    <div style={{ padding: '20px' }}>
      {events.map((event, index) => (
        <div 
          key={index}
          style={{
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            marginBottom: index < events.length - 1 ? '12px' : '0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}
        >
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
              {event.title}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{event.date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{event.time}</span>
              </div>
            </div>
          </div>
          <button style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

// Students Table Component
const StudentsTable = ({ students, loading }) => {
  return (
    <div style={{ padding: '20px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>S/N</th>
            <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Student ID</th>
            <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Full Name</th>
            <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Gender</th>
            <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Class</th>
            <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 8px' }}><div style={{ width: '20px', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}></div></td>
                <td style={{ padding: '14px 8px' }}><div style={{ width: '60px', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}></div></td>
                <td style={{ padding: '14px 8px' }}><div style={{ width: '120px', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}></div></td>
                <td style={{ padding: '14px 8px' }}><div style={{ width: '50px', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}></div></td>
                <td style={{ padding: '14px 8px' }}><div style={{ width: '60px', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}></div></td>
                <td style={{ padding: '14px 8px' }}><div style={{ width: '80px', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}></div></td>
              </tr>
            ))
          ) : students?.length > 0 ? (
            students.map((student, index) => (
              <tr key={student._id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 8px', fontSize: '13px', color: '#64748b' }}>{index + 1}</td>
                <td style={{ padding: '14px 8px', fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{student.admissionNumber || `STU/${String(index + 1).padStart(3, '0')}`}</td>
                <td style={{ padding: '14px 8px', fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{student.firstName} {student.lastName}</td>
                <td style={{ padding: '14px 8px', fontSize: '13px', color: '#64748b' }}>{student.gender || 'N/A'}</td>
                <td style={{ padding: '14px 8px', fontSize: '13px', color: '#64748b' }}>{student.grade || 'N/A'}</td>
                <td style={{ padding: '14px 8px', fontSize: '13px', color: '#64748b' }}>{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                No students found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading } = useAuth();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }
  
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    subjects: 0
  });
  const [students, setStudents] = useState([]);
  const [feesData, setFeesData] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // Get user from localStorage
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log('Logout API error:', error);
    } finally {
      // Clear any remaining storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      sessionStorage.removeItem('authToken');
      // Navigate to login
      navigate('/login');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [studentsRes, teachersRes, coursesRes, feesRes, settingsRes] = await Promise.allSettled([
        studentAPI.getAll({ limit: 1000 }),
        teacherAPI.getAll({ limit: 1000 }),
        courseAPI.getAll({ limit: 1000 }),
        feeAPI.getAll({ limit: 1000 }),
        settingsAPI.getSettings()
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value?.data?.success) {
        setSettings(settingsRes.value.data.settings);
      }

      // Handle students
      if (studentsRes.status === 'fulfilled' && studentsRes.value?.data) {
        const responseData = studentsRes.value.data;
        // Server returns { success: true, data: [...], pagination: {...} }
        const studentsData = responseData.data || [];
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setStats(prev => ({ ...prev, students: studentsData.length || 0 }));
      }

      // Handle teachers
      if (teachersRes.status === 'fulfilled' && teachersRes.value?.data) {
        const responseData = teachersRes.value.data;
        const teachersData = responseData.data || [];
        setStats(prev => ({ ...prev, teachers: Array.isArray(teachersData) ? teachersData.length : 0 }));
      }

      // Handle courses/subjects
      if (coursesRes.status === 'fulfilled' && coursesRes.value?.data) {
        const responseData = coursesRes.value.data;
        const coursesData = responseData.data || [];
        setStats(prev => ({ ...prev, subjects: Array.isArray(coursesData) ? coursesData.length : 0 }));
      }

      // Handle fees
      if (feesRes.status === 'fulfilled' && feesRes.value?.data) {
        const responseData = feesRes.value.data;
        const fees = responseData.data || [];
        // Process fees data for chart (mock processing - in production would come from API)
        if (Array.isArray(fees) && fees.length > 0) {
          setFeesData([
            { month: 'Jul', paid: 65, unpaid: 35 },
            { month: 'Aug', paid: 70, unpaid: 30 },
            { month: 'Sep', paid: 55 + Math.floor(Math.random() * 30), unpaid: 45 - Math.floor(Math.random() * 20) },
            { month: 'Oct', paid: 80, unpaid: 20 },
            { month: 'Nov', paid: 75, unpaid: 25 },
            { month: 'Dec', paid: 85, unpaid: 15 },
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />
      
      {/* Main Content */}
      <div style={{ marginLeft: '260px', flex: 1 }}>
        {/* Top Navigation */}
        <TopNav user={{ ...user, settings }} onLogout={handleLogout} />
        
        {/* Dashboard Content */}
        <div style={{ padding: '100px 30px 30px 30px' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>Overview</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                <span>Home</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
                <span style={{ color: '#1e293b' }}>Dashboard</span>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
            <StatCard 
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              }
              title="Total Students"
              value={stats.students}
              color="#eff6ff"
              loading={loading}
            />
            <StatCard 
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                  <path d="M9 7h6"/>
                  <path d="M9 11h6"/>
                </svg>
              }
              title="Total Staff"
              value={stats.teachers}
              color="#ecfdf5"
              loading={loading}
            />
            <StatCard 
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              }
              title="Total Subjects"
              value={stats.subjects}
              color="#f5f3ff"
              loading={loading}
            />
          </div>

          {/* Main Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Fees Chart */}
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Paid/Unpaid Fees Report</h2>
                </div>
                <BarChart feesData={feesData} loading={loading} />
              </div>

              {/* Students Table */}
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Newly Admitted Students</h2>
                </div>
                <StudentsTable students={students} loading={loading} />
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Calendar */}
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                overflow: 'hidden'
              }}>
                <Calendar />
              </div>

              {/* Upcoming Academic Activities */}
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Upcoming Academic Activities</h2>
                </div>
                <AcademicCalendarWidget />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

