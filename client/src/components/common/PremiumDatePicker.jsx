import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PremiumCalendar from './PremiumCalendar';

const PremiumDatePicker = ({ value, onChange, placeholder = "Select Date" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  
  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        // Check if the click was inside the datepicker portal or any select portal
        const datepickerPortal = document.getElementById('premium-datepicker-portal');
        if (datepickerPortal && datepickerPortal.contains(event.target)) return;
        const selectPortal = document.getElementById('premium-select-portal');
        if (selectPortal && selectPortal.contains(event.target)) return;
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="premium-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          padding: '12px 16px',
          backgroundColor: 'white',
          position: 'relative',
          zIndex: isOpen ? 10 : 1
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span style={{ color: value ? '#0f172a' : '#94a3b8', fontSize: '14px', fontWeight: '700' }}>
          {value ? formatDate(value) : placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" style={{ marginLeft: 'auto', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>

      {isOpen && createPortal(
        <div 
          id="premium-datepicker-portal"
          style={{ 
            position: 'absolute', 
            top: `${coords.top + 8}px`, 
            left: `${coords.left}px`, 
            zIndex: 9999 
          }}
        >
          <PremiumCalendar 
            value={value} 
            onChange={(val) => {
              onChange(val);
              setIsOpen(false);
            }} 
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default PremiumDatePicker;
