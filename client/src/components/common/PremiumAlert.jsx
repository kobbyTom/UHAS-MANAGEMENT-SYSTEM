import React from 'react';
import './PremiumAlert.css';

const PremiumAlert = ({ 
  isOpen, 
  title, 
  message, 
  type = 'info', // info, success, warning, error, confirm
  onConfirm, 
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="alert-icon-wrapper success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
        );
      case 'error':
        return (
          <div className="alert-icon-wrapper error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
        );
      case 'warning':
      case 'confirm':
        return (
          <div className="alert-icon-wrapper warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
        );
      default:
        return (
          <div className="alert-icon-wrapper info">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
        );
    }
  };

  return (
    <div className="premium-alert-overlay animate-fade-in">
      <div className="premium-alert-modal animate-slide-up">
        <div className="premium-alert-content">
          {getIcon()}
          <h3 className="premium-alert-title">{title}</h3>
          <p className="premium-alert-message">{message}</p>
        </div>
        
        <div className="premium-alert-actions">
          {type === 'confirm' || type === 'warning' ? (
            <>
              <button className="premium-alert-btn secondary" onClick={onCancel}>
                {cancelText}
              </button>
              <button className={`premium-alert-btn primary ${type}`} onClick={onConfirm}>
                {confirmText}
              </button>
            </>
          ) : (
            <button className={`premium-alert-btn primary ${type}`} onClick={onConfirm}>
              Understood
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumAlert;
