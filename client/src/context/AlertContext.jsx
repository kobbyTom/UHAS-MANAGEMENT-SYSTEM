import React, { createContext, useContext, useState, useCallback } from 'react';
import PremiumAlert from '../components/common/PremiumAlert';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = useCallback((config) => {
    setAlertConfig({
      isOpen: true,
      title: config.title || 'Notification',
      message: config.message || '',
      type: config.type || 'info',
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      onConfirm: () => {
        if (config.onConfirm) config.onConfirm();
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        if (config.onCancel) config.onCancel();
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      <PremiumAlert 
        {...alertConfig} 
        onConfirm={alertConfig.onConfirm || closeAlert}
        onCancel={alertConfig.onCancel || closeAlert}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
