import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, parentAPI, academicClassesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PremiumSelect from '../../components/common/PremiumSelect';
import { mapSectionName } from '../../utils/sectionHelper';

const Students = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Students');
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storedUser, setStoredUser] = useState(null);
  const [linkedStudentIds, setLinkedStudentIds] = useState(null);
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [dbGrades, setDbGrades] = useState([]);

  const currentUser = storedUser || user;
  const isAdmin = currentUser?.role === 'admin';
  const isParent = currentUser?.role === 'parent';
  const canAddStudent = currentUser?.role === 'admin' || currentUser?.role === 'admission';

  async function fetchGrades() {
    try {
      const res = await academicClassesAPI.getAll();
      if (res.data?.success) {
        const allowedGrades = ['KG 1', 'KG 2', 'KG 3', 'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'Basic 7', 'Basic 8', 'Basic 9'];
        const filtered = res.data.data.filter(g => allowedGrades.includes(g.name));
        setDbGrades(filtered);
      }
    } catch (e) {}
  }

  async function fetchData(currentPage = 1, searchTerm = '', gradeFilter = '') {
    try {
      setLoading(true);
      
      if (isParent) {
        // Parents should ONLY fetch their own children directly from the specific endpoint
        const response = await parentAPI.getMyChildren();
        let myChildren = response?.data?.data || [];
        
        // Apply local search if needed
        if (searchTerm || gradeFilter) {
          const searchWords = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
          myChildren = myChildren.filter(s => {
            const matchesSearch = searchWords.length === 0 || searchWords.every(word =>
              s.firstName?.toLowerCase().includes(word) || 
              s.lastName?.toLowerCase().includes(word) || 
              s.admissionNumber?.toLowerCase().includes(word) ||
              `${s.firstName} ${s.lastName}`.toLowerCase().includes(word)
            );
            const matchesGrade = !gradeFilter || s.grade === gradeFilter;
            return matchesSearch && matchesGrade;
          });
        }
        
        setStudents(myChildren);
      } else {
        // Admin and other roles fetch all students
        const response = await studentAPI.getAll({ 
          limit: 500, 
          page: currentPage, 
          search: searchTerm,
          grade: gradeFilter 
        });
        const allStudents = response?.data?.data || response?.data || [];
        setStudents(allStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    fetchData(1, search, filterGrade);
    fetchGrades();
    
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setStoredUser(parsed);
      } catch (e) {}
    }
  }, [search, filterGrade, isParent]);

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); }
  };

  const handleViewStudent = (student) => {
    if (currentUser?.role === 'finance') {
      navigate(`/fees/collection/${student.id}`);
    } else {
      navigate(`/students/${student.id}`);
    }
  };
  const handleAddStudent = () => navigate('/students/add');

  const displayGrade = (g) => {
    if (!g) return 'No Grade';
    let str = g.toString().trim();
    const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
    if (primaryMatch) return `Basic ${primaryMatch[1]}`;
    const jhsMatch = str.match(/^JHS\s*([1-3])$/i);
    if (jhsMatch) return `Basic ${parseInt(jhsMatch[1]) + 6}`;
    return str;
  };

  return (
    <>
      <main>
        {/* Header */}
        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Student Registry</span>
              <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{isParent ? 'My Children' : 'All Students'}</span>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>
              {isParent ? 'My' : 'Student'} <span style={{ color: 'var(--brand-green)' }}>{isParent ? 'Children' : 'Directory'}</span>
            </h1>
            <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>
              {isParent ? "Keep track of your children's academic progress." : 'Comprehensive registry of all enrolled students.'}
            </p>
          </div>
          {canAddStudent && (
            <button 
              onClick={handleAddStudent}
              className="premium-btn-primary"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Admission
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="filter-bar">
          <div style={{ position: 'relative', flex: 1, maxWidth: '450px' }}>
            <svg style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, ID or grade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="premium-input"
              style={{ paddingLeft: '48px' }}
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <PremiumSelect 
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              options={dbGrades.map(g => ({ value: g.name, label: displayGrade(g.name) }))}
              placeholder="All Grades"
            />
          </div>
        </div>

        {/* Students Grid */}
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
        ) : students.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '60px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: '16px' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>No students found</p>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>{search ? 'Try a different search term' : 'Get started by adding your first student'}</p>
            {canAddStudent && (
              <button onClick={handleAddStudent} style={{ padding: '12px 24px', backgroundColor: 'var(--brand-green)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Add Student
              </button>
            )}
          </div>
        ) : (
          <div className="responsive-grid-3">
            {students.map((student, idx) => (
              <div 
                key={student.id || idx}
                onClick={() => handleViewStudent(student)}
                className="glass-card student-card"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg, var(--brand-green), #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: '900', boxShadow: '0 8px 20px rgba(0, 132, 62, 0.25)', flexShrink: 0 }}>
                    {student.firstName?.[0]}{student.lastName?.[0]}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 8px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '8px', textTransform: 'uppercase' }}>
                      {student.admissionNumber || 'No ID'}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{student.firstName} {student.lastName}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--brand-green)' }}>{displayGrade(student.grade)}</span>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Section {mapSectionName(student.section || 'A')}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', padding: '16px', backgroundColor: '#ffffff', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>{student.parentName || student.guardian || 'Parent Info Pending'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.email || 'No Email'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>{student.dateOfBirth || 'DOB N/A'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: student.status === 'active' ? '#10b981' : '#ef4444' }}></div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: student.status === 'active' ? '#10b981' : '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {student.status || 'Active'}
                    </span>
                  </div>
                  <button className="premium-btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px' }}>View Profile</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default Students;
