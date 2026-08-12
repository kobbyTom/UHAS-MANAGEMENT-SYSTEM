import React, { useState } from 'react';
import PremiumSelect from './PremiumSelect';

const PremiumCalendar = ({ value, onChange, onClose, style = {} }) => {
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
  
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate years (from 2010 to 10 years ahead)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2010 + 11 }, (_, i) => 2010 + i);
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDateClick = (day) => {
    const selected = new Date(year, month, day);
    const formatted = selected.toISOString().split('T')[0];
    onChange(formatted);
    if (onClose) onClose();
  };
  
  const today = new Date();
  const isToday = (d) => today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
  const isSelected = (d) => {
    if (!value) return false;
    const v = new Date(value);
    return v.getDate() === d && v.getMonth() === month && v.getFullYear() === year;
  };

  const dayCells = [];
  const startOffset = firstDayOfMonth(year, month);
  const totalDays = daysInMonth(year, month);
  
  for (let i = 0; i < startOffset; i++) {
    dayCells.push(<div key={`pad-${i}`} style={{ height: '48px' }} />);
  }
  
  for (let d = 1; d <= totalDays; d++) {
    const selected = isSelected(d);
    const todayFlag = isToday(d);
    
    dayCells.push(
      <div 
        key={d} 
        onClick={() => handleDateClick(d)}
        style={{
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '700',
          transition: 'all 0.2s',
          background: selected ? 'var(--brand-yellow)' : 'transparent',
          color: selected ? '#0f172a' : (todayFlag ? 'var(--brand-green)' : '#1e293b'),
          border: todayFlag ? '2px solid var(--brand-green)' : 'none',
          boxShadow: selected ? '0 8px 20px rgba(250, 204, 21, 0.3)' : 'none',
          zIndex: selected ? 2 : 1
        }}
        onMouseEnter={(e) => {
          if (!selected) e.currentTarget.style.backgroundColor = '#f1f5f9';
        }}
        onMouseLeave={(e) => {
          if (!selected) e.currentTarget.style.backgroundColor = todayFlag ? 'var(--brand-green-light)' : 'transparent';
        }}
      >
        {d}
      </div>
    );
  }

  return (
    <div style={{
      width: '380px',
      maxWidth: '100%',
      backgroundColor: 'white',
      borderRadius: '24px',
      padding: '24px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
      border: '1px solid #f1f5f9',
      zIndex: 1000,
      ...style
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '8px' }}>
        <button onClick={prevMonth} className="calendar-nav-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        
        <div style={{ display: 'flex', gap: '4px', flex: 1, justifyContent: 'center' }}>
          <div style={{ width: '120px' }}>
            <PremiumSelect 
              value={month} 
              onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value), 1))}
              options={monthNames.map((name, i) => ({ value: i, label: name }))}
              placeholder="Month"
            />
          </div>
          <div style={{ width: '100px' }}>
            <PremiumSelect 
              value={year} 
              onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month, 1))}
              options={years.map(y => ({ value: y, label: y.toString() }))}
              placeholder="Year"
            />
          </div>
        </div>

        <button onClick={nextMonth} className="calendar-nav-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      
      {/* Day Labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {d}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {dayCells}
      </div>
      
      {/* Footer */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={() => handleDateClick(today.getDate())}
          style={{ background: 'none', border: 'none', color: 'var(--brand-green)', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
        >
          Jump to Today
        </button>
      </div>

      <style>{`
        .calendar-nav-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .calendar-nav-btn:hover {
          background-color: #f1f5f9;
          color: var(--brand-green);
        }
        .calendar-select:focus {
          outline: none;
          background-color: #f1f5f9;
        }
      `}</style>
    </div>
  );
};

export default PremiumCalendar;
