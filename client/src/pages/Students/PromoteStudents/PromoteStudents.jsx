import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, teacherAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import PremiumSelect from '../../../components/common/PremiumSelect';
import { useAlert } from '../../../context/AlertContext';
import '../../Settings/Settings.css';

const PromoteStudents = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Students');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const { showAlert } = useAlert();

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const [masterClasses, setMasterClasses] = useState([]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  const displayGrade = (g) => {
    if (!g) return 'No Grade';
    let str = g.toString().trim();
    // Transform Primary 1-6 to Basic 1-6 for UI display
    const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
    if (primaryMatch) return `Basic ${primaryMatch[1]}`;
    return str;
  };

  const gradeOptions = ['KG 1', 'KG 2', 'KG 3', 'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'Basic 7', 'Basic 8', 'Basic 9'];

  const getNextGrade = (currentGrade) => {
    const currentIndex = gradeOptions.indexOf(currentGrade);
    if (currentIndex === -1 || currentIndex === gradeOptions.length - 1) return currentGrade;
    return gradeOptions[currentIndex + 1];
  };

  useEffect(() => {
    if (isTeacher) {
      teacherAPI.getMyCourses().then(res => {
        if (res.data?.success) {
          const mClasses = res.data.masterClasses || [];
          setMasterClasses(mClasses);
          if (mClasses.length > 0 && !filterGrade) {
            setFilterGrade(mClasses[0].name || mClasses[0].grade);
          }
        }
      }).catch(err => console.error(err));
    }
  }, [user, isTeacher]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getAll({ page, limit, grade: filterGrade });
      const allStudents = response?.data?.data || response?.data || [];
      const pagination = response?.data?.pagination || {};
      
      setStudents(allStudents);
      setTotalPages(pagination.pages || 1);
      setTotalStudents(pagination.total || allStudents.length);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const allowedGrades = isAdmin ? gradeOptions : masterClasses.map(m => m.name || m.grade);

  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const adm = (s.admissionNumber || '').toLowerCase();
    
    // Teacher Master Class Restriction
    if (!isAdmin) {
      if (!allowedGrades.includes(s.grade)) return false;
    }
    
    return fullName.includes(searchTerm.toLowerCase()) || adm.includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    fetchStudents();
  }, [page, filterGrade]);

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  const handlePromote = async (studentId, newGrade) => {
    setPromoting(studentId);
    setError('');
    setSuccess('');
    try {
      await studentAPI.update(studentId, { grade: newGrade });
      setSuccess(`Student promoted to ${newGrade} successfully!`);
      fetchStudents();
    } catch (err) {
      showAlert({
        title: 'Promotion Failed',
        message: err.response?.data?.message || 'Failed to promote student',
        type: 'error'
      });
    } finally {
      setPromoting(null);
    }
  };

  const handlePromoteAll = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    let promoted = 0;
    try {
      const response = await studentAPI.getAll({ limit: 10000 });
      const allStudents = response?.data?.data || response?.data || [];
      
      const eligibleStudents = allStudents.filter(s => isAdmin || allowedGrades.includes(s.grade));
      
      for (const student of eligibleStudents) {
        const newGrade = getNextGrade(student.grade);
        if (newGrade !== student.grade) {
          try {
            await studentAPI.update(student.id || student._id, { grade: newGrade });
            promoted++;
          } catch (err) {
            console.error(`Error promoting ${student.firstName}:`, err);
          }
        }
      }
      setSuccess(`Successfully promoted ${promoted} students!`);
      fetchStudents();
    } catch (err) {
      showAlert({
        title: 'Operation Failure',
        message: 'Failed to fetch full student list for promotion',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeGlobalAdvancement = () => {
    showAlert({
      title: 'Global Advancement Protocol',
      message: `You are about to promote ${isAdmin ? 'all' : 'your'} ${totalStudents} students. This action is irreversible and should only be performed after final results are verified. Proceed?`,
      type: 'confirm',
      onConfirm: () => {
        handlePromoteAll();
      }
    });
  };


  return (
    <div className="promote-students-wrapper" style={{ padding: '24px' }}>
      <main>
      {success && (
          <div className="animate-fade-in" style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '16px 24px', borderRadius: '16px', marginBottom: '32px', marginTop: '20px', border: '1px solid #d1fae5', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {success}
          </div>
        )}

        {error && (
          <div className="animate-fade-in" style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '16px 24px', borderRadius: '16px', marginBottom: '32px', marginTop: '20px', border: '1px solid #fee2e2', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Student Registry</span>
            <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Advancement Protocol</span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px', fontFamily: 'Outfit, sans-serif' }}>
            Student <span style={{ color: 'var(--brand-green)' }}>Advancement</span>
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Execute cohort promotion protocols and manage academic transitions.</p>
        </div>

        {/* Stats Dashboard */}
        <div className="responsive-grid-3" style={{ marginBottom: '24px' }}>
          <div className="settings-stat-nexus animate-fade-in">
            <div className="settings-stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #d1fae5' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="8" r="3"/></svg>
            </div>
            <div>
              <p className="settings-stat-label">Total Scholars</p>
              <h4 className="settings-stat-value">{totalStudents} Nodes</h4>
            </div>
          </div>

          <div className="settings-stat-nexus animate-fade-in stagger-1">
            <div className="settings-stat-icon" style={{ backgroundColor: '#fefce8', color: '#ca8a04', border: '1px solid #fef08a' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <p className="settings-stat-label">Class Distribution</p>
              <h4 className="settings-stat-value">{gradeOptions.length} Tiers</h4>
            </div>
          </div>

          <div className="settings-stat-nexus animate-fade-in stagger-2">
            <div className="settings-stat-icon" style={{ backgroundColor: '#f0f9ff', color: '#0284c7', border: '1px solid #e0f2fe' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5l-5-5-5 5M17 19l-5 5-5-5"/></svg>
            </div>
            <div>
              <p className="settings-stat-label">Active Batch</p>
              <h4 className="settings-stat-value">{students.length} Records</h4>
            </div>
          </div>
        </div>

        {/* Global Promotion Banner */}
        <div className="promotion-banner animate-fade-in stagger-2" style={{ marginBottom: '24px' }}>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>Global Promotion Protocol</h2>
              <p style={{ opacity: 0.9, fontWeight: '600', marginTop: '4px', maxWidth: '500px' }}>
                Executing this protocol will advance all eligible students to their next academic tier. Ensure all final grades are consolidated before proceeding.
              </p>
            </div>
            <button 
              onClick={initializeGlobalAdvancement} 
              disabled={loading || filteredStudents.length === 0 || (!isAdmin && masterClasses.length === 0)}
              style={{ 
                backgroundColor: 'white', 
                color: 'var(--brand-green)', 
                padding: '16px 32px', 
                borderRadius: '18px', 
                fontSize: '15px', 
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '12px', 
                border: 'none',
                cursor: (loading || totalStudents === 0) ? 'not-allowed' : 'pointer',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                transition: 'none',
                transform: 'none'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              Initialize Global Advancement
            </button>
          </div>
        </div>

        <div className="settings-card animate-fade-in stagger-1" style={{ padding: 0, overflow: 'hidden', transform: 'none', transition: 'none' }}>
          <style>{`
            .settings-card:hover {
              transform: none !important;
              box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04) !important;
              border-color: rgba(255, 255, 255, 0.4) !important;
            }
            .settings-card:hover::before {
              opacity: 0 !important;
            }
          `}</style>
          <div style={{ padding: '28px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="settings-card-title">Student Registry</h3>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>Active student distribution and promotion status</p>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '180px' }}>
                <PremiumSelect
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  options={[
                    { value: '', label: isAdmin ? 'All Levels' : 'My Master Classes' },
                    ...(isAdmin ? gradeOptions : allowedGrades).map(g => ({ value: g, label: displayGrade(g) }))
                  ]}
                  placeholder="Filter Level"
                />
              </div>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input 
                  type="text"
                  placeholder="Search scholars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    padding: '10px 16px 10px 40px', 
                    borderRadius: '12px', 
                    border: '1.5px solid #f1f5f9', 
                    fontSize: '13px', 
                    fontWeight: '700',
                    width: '260px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--brand-green)'}
                  onBlur={(e) => e.target.style.borderColor = '#f1f5f9'}
                />
              </div>
              <div style={{ padding: '8px 16px', backgroundColor: 'var(--brand-green-soft)', borderRadius: '12px', fontSize: '12px', fontWeight: '800', color: 'var(--brand-green)' }}>
                {filteredStudents.length} / {totalStudents} Results
              </div>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Student Identity</th>
                  <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Admission</th>
                  <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Phase</th>
                  <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Target Phase</th>
                  <th style={{ padding: '16px 32px', textAlign: 'right', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Execution</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const studentId = student.id || student._id;
                  const nextGrade = getNextGrade(student.grade);
                  const isLastGrade = nextGrade === student.grade;

                  return (
                    <tr key={studentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '1000', fontSize: '15px', border: '1px solid rgba(0,132,62,0.1)' }}>
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--slate-900)', letterSpacing: '-0.3px' }}>{student.firstName} {student.lastName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--brand-green)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Scholar</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--slate-600)' }}>
                          <span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>{student.admissionNumber || 'N/A'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-yellow)' }}></div>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--slate-700)' }}>{displayGrade(student.grade)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '900', color: isLastGrade ? 'var(--slate-400)' : 'var(--brand-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {displayGrade(nextGrade)}
                          {!isLastGrade && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                        </span>
                      </td>
                      <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handlePromote(studentId, nextGrade)} 
                          disabled={promoting === studentId || isLastGrade} 
                          className={isLastGrade ? 'premium-btn-secondary' : 'premium-btn-primary'}
                          style={{ 
                            padding: '10px 24px', 
                            borderRadius: '12px', 
                            fontSize: '12px', 
                            opacity: isLastGrade ? 0.4 : 1, 
                            cursor: isLastGrade ? 'default' : 'pointer',
                            boxShadow: isLastGrade ? 'none' : '0 4px 12px rgba(0, 132, 62, 0.15)'
                          }}
                        >
                          {promoting === studentId ? 'Processing...' : isLastGrade ? 'Max Tier' : 'Promote'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Premium Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: '13px', color: 'var(--slate-500)', fontWeight: '600' }}>
                Showing <span style={{ color: 'var(--slate-900)', fontWeight: '800' }}>{(page - 1) * limit + 1} - {Math.min(page * limit, totalStudents)}</span> of <span style={{ color: 'var(--slate-900)', fontWeight: '800' }}>{totalStudents}</span> students
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="premium-btn-secondary"
                  style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px', opacity: page === 1 ? 0.5 : 1 }}
                >
                  Previous
                </button>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[...Array(totalPages)].map((_, i) => {
                    const p = i + 1;
                    if (totalPages > 5 && Math.abs(p - page) > 1 && p !== 1 && p !== totalPages) {
                      if (Math.abs(p - page) === 2) return <span key={p} style={{ padding: '8px' }}>...</span>;
                      return null;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: page === p ? 'var(--brand-green)' : 'transparent',
                          color: page === p ? 'white' : 'var(--slate-600)',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="premium-btn-secondary"
                  style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px', opacity: page === totalPages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PromoteStudents;
