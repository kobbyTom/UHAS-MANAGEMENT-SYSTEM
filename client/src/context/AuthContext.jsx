import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authAPI } from '../services/api';
import { useAlert } from './AlertContext';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      loading: true,
      error: null,
      login: async () => {},
      register: async () => {},
      logout: async () => {},
      resetPassword: async () => {},
      clearError: () => {},
      isAuthenticated: false,
      userRole: null
    };
  }
  return context;
};

const roleRedirects = {
  admin: '/admin-dashboard',
  student: '/student-dashboard',
  teacher: '/teacher-dashboard',
  parent: '/parent-dashboard',
  finance: '/finance-dashboard',
  staff: '/staff-dashboard'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const logoutTimerRef = useRef(null);
  const { showAlert } = useAlert();
  
  // 15 minutes timeout
  const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

  const logout = async (isAutoLogout = false) => {
    try {
      await authAPI.logout();
    } catch (err) {
      // Continue with local logout even if API fails
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      sessionStorage.removeItem('authToken');
      setUser(null);
      if (isAutoLogout) {
        // We could also redirect with a message by setting state or using alert, 
        // but removing the user will trigger ProtectedRoute to bounce them to login automatically.
        showAlert({
          title: 'Session Expired',
          message: 'Your session has expired due to inactivity. Please log in again.',
          type: 'warning'
        });
      }
    }
  };

  const resetTimer = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (user) {
      logoutTimerRef.current = setTimeout(() => {
        logout(true); // pass true to indicate it's an auto-logout
      }, SESSION_TIMEOUT_MS);
    }
  }, [user]);

  useEffect(() => {
    // Only set up activity listeners if the user is authenticated
    if (!user) {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      return;
    }

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    
    const handleActivity = () => {
      resetTimer();
    };

    // Initial timer setup
    resetTimer();

    // Attach listeners
    events.forEach(event => window.addEventListener(event, handleActivity));

    // Cleanup
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [user, resetTimer]);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('authUser');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          if (userData && userData.grade) {
            userData.grade = userData.grade.replace('Primary', 'Basic');
          }
          setUser(userData);

          // Fetch fresh data from database
          const response = await authAPI.getProfile();
          if (response.data.success) {
            const { user: freshUser, profile } = response.data;
            const mergedUser = {
              ...freshUser,
              ...(profile || {}),
              studentId: freshUser.role === 'student' ? profile?.id || freshUser.studentId : freshUser.studentId,
              teacherId: freshUser.role === 'teacher' ? profile?.id || freshUser.teacherId : freshUser.teacherId,
              parentId: freshUser.role === 'parent' ? profile?.id || freshUser.parentId : freshUser.parentId,
              linkedStudents: profile?.linkedStudents || []
            };

            if (mergedUser.grade) {
              mergedUser.grade = mergedUser.grade.replace('Primary', 'Basic');
            }

            localStorage.setItem('authUser', JSON.stringify(mergedUser));
            setUser(mergedUser);
          }
        } catch (err) {
          console.error('Auth synchronization failed:', err);
          // If profile fetch fails but we have saved user, we keep the saved user
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password, remember = false) => {
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.login({
        email: identifier.includes('@') ? identifier : `${identifier}@school.com`,
        password
      });

      if (response.data.success) {
        const { token, user: userData, profile, redirectPath } = response.data;
        const mergedUser = {
          ...userData,
          ...(profile || {}),
          studentId: userData.role === 'student' ? profile?.id || userData.studentId : userData.studentId,
          teacherId: userData.role === 'teacher' ? profile?.id || userData.teacherId : userData.teacherId,
          parentId: userData.role === 'parent' ? profile?.id || userData.parentId : userData.parentId,
          linkedStudents: profile?.linkedStudents || []
        };
        
        if (mergedUser.grade) {
          mergedUser.grade = mergedUser.grade.replace('Primary', 'Basic');
        }

        if (remember) {
          localStorage.setItem('authToken', token);
        } else {
          sessionStorage.setItem('authToken', token);
        }

        localStorage.setItem('authUser', JSON.stringify(mergedUser));
        setUser(mergedUser);

        return {
          success: true,
          user: mergedUser,
          redirect: redirectPath || roleRedirects[mergedUser.role] || '/'
        };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await authAPI.register(userData);
      
      if (response.data.success) {
        const { token, user: newUser } = response.data;
        
        localStorage.setItem('authToken', token);
        if (newUser && newUser.grade) {
          newUser.grade = newUser.grade.replace('Primary', 'Basic');
        }
        localStorage.setItem('authUser', JSON.stringify(newUser));
        setUser(newUser);
        
        return {
          success: true,
          user: newUser,
          redirect: roleRedirects[newUser.role] || '/'
        };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Moved logout to the top to allow usage inside the hook

  const resetPassword = async (email) => {
    setError(null);
    try {
      const response = await authAPI.resetPassword(email);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Password reset failed.';
      setError(message);
      throw new Error(message);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    clearError,
    isAuthenticated: !!user,
    userRole: user?.role
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
