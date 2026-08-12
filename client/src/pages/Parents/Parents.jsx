import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
const Parents = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Parents');
  
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storedUser, setStoredUser] = useState(null);
  const [search, setSearch] = useState('');

  const currentUser = storedUser || user;
  const isAdmin = currentUser?.role === 'admin';

  async function fetchData(searchTerm = '') {
    try {
      setLoading(true);
      const response = await parentAPI.getAll({ limit: 500, search: searchTerm });
      if (response?.data) {
        let allParents = response.data.data || [];
        const parentsWithCount = allParents.map(p => ({
          ...p,
          childrenCount: (p.student_ids || p.studentIds || []).length
        }));
        setParents(parentsWithCount);
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

  const handleAddParent = () => navigate('/parents/add');

  return (
    <div>
      <main>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Family Engagement</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Parental Network</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Family <span style={{ color: 'var(--brand-green)' }}>Registry</span></h1>
              <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Manage institutional parent and guardian communication protocols.</p>
            </div>
            {isAdmin && (
              <button 
                onClick={handleAddParent}
                className="premium-btn-primary"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Register Guardian
              </button>
            )}
          </div>


          <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: '#94a3b8', marginLeft: '8px' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
            <input
              type="text"
              placeholder="Search family registry by name, email or mobile node..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="premium-input"
              style={{ border: 'none', paddingLeft: 0, backgroundColor: 'transparent' }}
            />
          </div>


          {loading ? (
            <div className="responsive-grid-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="glass-card" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="premium-loader"></div>
                </div>
              ))}
            </div>
          ) : parents.length === 0 ? (
            <div className="glass-card" style={{ padding: '100px 40px', textAlign: 'center' }}>
              <div style={{ color: 'var(--brand-slate-200)', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="17" cy="11" r="4"/></svg></div>
              <p style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Registry Empty</p>
              <p style={{ fontSize: '15px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>{search ? 'Try adjusting your search parameters.' : 'There are no parent records currently indexed.'}</p>
            </div>
          ) : (
            <div className="responsive-grid-3">
              {parents.map((parent, idx) => (
                <div 
                  key={idx}
                  onClick={() => navigate(`/parents/${parent.id}`)}
                  className="glass-card premium-row"
                  style={{
                    padding: '32px',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '18px', backgroundColor: 'var(--brand-yellow)', color: '#854d0e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '900', boxShadow: '0 8px 20px rgba(250, 204, 21, 0.2)' }}>
                      {parent.firstName?.[0]}{parent.lastName?.[0]}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>{parent.firstName} {parent.lastName}</h3>
                      <p style={{ fontSize: '12px', fontWeight: '800', color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{parent.relationship || 'Guardian Node'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'var(--brand-slate-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </div>
                      <span style={{ fontSize: '14px', color: '#475569', fontWeight: '600' }}>{parent.email || 'Communication N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'var(--brand-slate-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </div>
                      <span style={{ fontSize: '14px', color: '#475569', fontWeight: '600' }}>{parent.phone || 'Connection N/A'}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--brand-slate-100)', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-green)' }}></div>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{parent.childrenCount || 0} Linked Scholar(s)</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
    </div>
  );
};

export default Parents;
