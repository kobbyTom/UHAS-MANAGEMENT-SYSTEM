import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleReturnHome = () => {
    // If not logged in, go to login, else go to their specific dashboard
    if (!user) {
      navigate('/login');
    } else {
      navigate('/'); // App.jsx root route handles the role-based dashboard redirect
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <ShieldAlert size={64} color="#ef4444" />
        </div>
        
        <h1 style={styles.title}>Access Denied</h1>
        <p style={styles.subtitle}>
          You do not have the required permissions to view this page.
        </p>
        
        <div style={styles.divider} />
        
        <p style={styles.helpText}>
          If you believe this is a mistake, please contact your system administrator or IT support team.
        </p>

        <button 
          onClick={handleReturnHome}
          style={styles.button}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#166534'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#00843e'}
        >
          <ArrowLeft size={18} style={{ marginRight: '8px' }} />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '48px 40px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
    border: '1px solid #f1f5f9',
  },
  iconContainer: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#fef2f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    lineHeight: '1.5',
    margin: '0 0 24px 0',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e2e8f0',
    margin: '24px 0',
  },
  helpText: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '32px',
    lineHeight: '1.5',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '14px 24px',
    backgroundColor: '#00843e',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }
};

export default Unauthorized;
