import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const PremiumSelect = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select Option",
  label = "",
  disabled = false,
  icon = null
}) => {
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
        const portalContent = document.getElementById('premium-select-portal');
        if (portalContent && portalContent.contains(event.target)) return;
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue) => {
    onChange({ target: { name: label, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="premium-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '12px 16px',
          backgroundColor: disabled ? '#ffffff' : 'white',
          opacity: disabled ? 0.7 : 1,
          position: 'relative',
          zIndex: isOpen ? 10 : 1,
          borderColor: isOpen ? 'var(--brand-green)' : 'var(--brand-slate-200)',
          boxShadow: isOpen ? '0 0 0 4px rgba(0, 132, 62, 0.08)' : 'none'
        }}
      >
        {icon && <span style={{ color: 'var(--brand-green)', display: 'flex' }}>{icon}</span>}
        <span style={{ 
          color: selectedOption ? '#0f172a' : '#94a3b8', 
          fontSize: '14px', 
          fontWeight: '700',
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg 
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" 
          style={{ 
            marginLeft: 'auto', 
            transform: isOpen ? 'rotate(180deg)' : 'none', 
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>

      {isOpen && createPortal(
        <div 
          id="premium-select-portal"
          style={{ 
            position: 'absolute', 
            top: `${coords.top + 6}px`, 
            left: `${coords.left}px`, 
            width: `${coords.width}px`,
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 15px 40px rgba(0,0,0,0.12), 0 5px 15px rgba(0,0,0,0.05)',
            border: '1px solid #f1f5f9',
            padding: '8px',
            zIndex: 99999,
            maxHeight: '300px',
            overflowY: 'auto',
            animation: 'premiumSelectFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <style>{`
            @keyframes premiumSelectFadeIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .premium-option {
              padding: 10px 14px;
              border-radius: 10px;
              cursor: pointer;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              font-size: 14px;
              font-weight: 700;
              color: #475569;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .premium-option:hover {
              background-color: rgba(0, 132, 62, 0.06);
              color: var(--brand-green);
              padding-left: 18px;
            }
            .premium-option.selected {
              background-color: var(--brand-green);
              color: white;
              box-shadow: 0 4px 12px rgba(0, 132, 62, 0.2);
            }
            /* Custom Scrollbar */
            #premium-select-portal::-webkit-scrollbar {
              width: 5px;
            }
            #premium-select-portal::-webkit-scrollbar-track {
              background: transparent;
            }
            #premium-select-portal::-webkit-scrollbar-thumb {
              background: #e2e8f0;
              border-radius: 10px;
            }
          `}</style>
          {options.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No options available</div>
          ) : (
            options.map((opt) => (
              <div 
                key={opt.value}
                className={`premium-option ${opt.value === value ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.value === value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17L4 12"/>
                  </svg>
                )}
                {opt.label}
              </div>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default PremiumSelect;
