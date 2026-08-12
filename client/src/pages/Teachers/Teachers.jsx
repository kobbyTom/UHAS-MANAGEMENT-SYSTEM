import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
const Teachers = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Staff');
  
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storedUser, setStoredUser] = useState(null);
  const [search, setSearch] = useState('');

  const currentUser = storedUser || user;
  const isAdmin = currentUser?.role === 'admin';

  async function fetchData(searchTerm = '') {
    try {
      setLoading(true);
      const response = await teacherAPI.getAll({ limit: 500, search: searchTerm });
      if (response?.data) {
        const allData = response.data.data || response.data || [];
        setTeachers(allData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    fetchData(search);
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
  }, [search]);

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); }
  };

  const handleViewTeacher = (teacher) => navigate(`/teachers/${teacher.id}`);
  const handleAddTeacher = () => navigate('/teachers/add');

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <main style={{ padding: '0 0 60px 0' }}>
          {/* Header */}
          <div className="page-header" style={{ marginBottom: '48px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Faculty Directory</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Teaching Staff</span>
              </div>
              <h1 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-2px' }}>Faculty <span style={{ color: 'var(--brand-green)' }}>Registry</span></h1>
              <p style={{ fontSize: '17px', color: '#64748b', marginTop: '10px', fontWeight: '500' }}>Manage institutional educators and academic specialists.</p>
            </div>
            {isAdmin && (
              <button 
                onClick={handleAddTeacher}
                className="premium-btn-primary"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Teacher
              </button>
            )}
          </div>


          {/* Search */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative', maxWidth: '450px' }}>
              <svg style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search by name, subject or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="premium-input"
                style={{ paddingLeft: '48px' }}
              />
            </div>
          </div>


          {/* Teachers Grid */}
          {loading ? (
            <div className="responsive-grid-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '16px', backgroundColor: '#f1f5f9', animation: 'pulse 1.5s infinite' }}></div>
                    <div>
                      <div style={{ width: '120px', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}></div>
                      <div style={{ width: '80px', height: '12px', backgroundColor: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '60px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: '16px' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>No teachers found</p>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>{search ? 'Try a different search term' : 'Get started by adding your first teacher'}</p>
              {isAdmin && (
                <button onClick={handleAddTeacher} style={{ padding: '12px 24px', backgroundColor: 'var(--brand-green)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Add Teacher
                </button>
              )}
            </div>
          ) : (
            <div className="responsive-grid-3">
              {teachers.map((teacher, idx) => (
                <div 
                  key={teacher.id || idx}
                  onClick={() => handleViewTeacher(teacher)}
                  className="glass-card teacher-card"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg, var(--brand-green), #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: '900', boxShadow: '0 8px 20px rgba(0, 132, 62, 0.25)', flexShrink: 0 }}>
                      {(teacher.firstName || teacher.first_name)?.[0]}{(teacher.lastName || teacher.last_name)?.[0]}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 8px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '8px', textTransform: 'uppercase' }}>
                        {teacher.employeeId || 'No ID'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{teacher.firstName || teacher.first_name} {teacher.lastName || teacher.last_name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--brand-green)' }}>{teacher.position || 'Teacher'}</span>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>{teacher.specialization || 'General Faculty'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                    {(teacher.subjects && teacher.subjects.length > 0) ? (
                      teacher.subjects.slice(0, 3).map((sub, sIdx) => (
                        <span key={sIdx} style={{ fontSize: '10px', fontWeight: '800', padding: '4px 10px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                          {sub}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 10px', backgroundColor: '#ffffff', color: '#94a3b8', borderRadius: '6px' }}>
                        No Subjects Assigned
                      </span>
                    )}
                    {teacher.subjects?.length > 3 && <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', alignSelf: 'center' }}>+{teacher.subjects.length - 3} more</span>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', padding: '16px', backgroundColor: '#ffffff', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>{teacher.email || 'Awaiting email'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>{teacher.experience || 0} Years Experience</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: teacher.status === 'active' ? '#10b981' : '#ef4444' }}></div>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: teacher.status === 'active' ? '#10b981' : '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {teacher.status || 'Active'}
                      </span>
                    </div>
                    <button className="premium-btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px' }}>View Dossier</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </main>
    </div>
  );
};

export default Teachers;
