import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { feeAPI, parentAPI } from '../../../services/api';
// Premium Icon Components
const Icons = {
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Tag: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
};

const FeesStructure = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Finance');
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    grade: 'Basic 1',
    term: '1st',
    academicYear: '2023/2024',
    isActive: true
  });

  const termDisplayMap = {
    '1st': 'First Term',
    '2nd': 'Second Term',
    '3rd': 'Third Term',
    '4th': 'Fourth Term',
    'all': 'All Terms'
  };

  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const isParent = user?.role === 'parent';

  useEffect(() => {
    fetchFees();
    if (isParent) fetchChildren();
  }, [isParent]);

  const fetchChildren = async () => {
    try {
      const res = await parentAPI.getMyChildren();
      if (res.data?.success) {
        setLinkedStudents(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedChildId(res.data.data[0].id);
        }
      }
    } catch (error) { console.error('Error fetching children:', error); }
  };

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await feeAPI.getAll();
      if (res.data.success) {
        setFees(res.data.data);
      }
    } catch (error) { console.error('Error fetching fees:', error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingItem) {
        await feeAPI.update(editingItem.id, formData);
      } else {
        await feeAPI.create(formData);
      }
      setShowModal(false);
      fetchFees();
    } catch (error) {
      alert('Error saving fee component');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || item.fee_name,
      amount: item.amount,
      grade: item.grade,
      term: item.term,
      academicYear: item.academic_year || item.academicYear,
      isActive: item.isActive || item.is_active || item.status === 'active'
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      amount: '',
      grade: 'Basic 1',
      term: '1st',
      academicYear: '2023/2024',
      isActive: true
    });
    setShowModal(true);
  };

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  const selectedChild = linkedStudents.find(s => s.id === selectedChildId);
  const filteredFees = isParent && selectedChild
    ? fees.filter(f => f.grade === selectedChild.grade)
    : fees;

  return (
    <div>
      <main>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Treasury Config</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Fee Architecture</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Financial <span style={{ color: 'var(--brand-green)' }}>Structure</span></h1>
              <p style={{ fontSize: '16px', color: '#475569', marginTop: '8px', fontWeight: '500' }}>Defining institutional fee components across temporal academic cycles.</p>
            </div>
            {user?.role === 'finance' && (
              <button 
                onClick={handleAdd}
                className="premium-btn-primary"
              >
                <Icons.Plus />
                Define Component
              </button>
            )}
          </div>


          {/* List Area */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--brand-slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--brand-slate-50)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Institutional Fee Registry</h2>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {isParent && linkedStudents.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Active Profile:</span>
                    <select
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      className="premium-input"
                      style={{ padding: '8px 32px 8px 16px', fontSize: '13px', minWidth: '200px' }}
                    >
                      {linkedStudents.map(c => (
                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.grade})</option>
                      ))}
                    </select>
                  </div>
                )}
                <select className="premium-input" style={{ padding: '8px 32px 8px 16px', fontSize: '13px' }}>
                  <option>Current Academic Cycle</option>
                  <option>Archive Registry</option>
                </select>
              </div>
            </div>

            
            <div style={{ padding: '24px 32px 32px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--brand-slate-50)' }}>
                    <th className="premium-th">Component Node</th>
                    <th className="premium-th">Grade Classification</th>
                    <th className="premium-th">Value (₵)</th>
                    <th className="premium-th">Temporal Sync</th>
                    <th className="premium-th">Deployment Status</th>
                    {user?.role === 'finance' && <th className="premium-th" style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}><td colSpan={6} style={{ padding: '24px' }}><div className="premium-loader" style={{ margin: '0 auto' }}></div></td></tr>
                    ))
                  ) : filteredFees.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '80px', textAlign: 'center' }}>
                        <div style={{ color: '#cbd5e1', marginBottom: '20px' }}><Icons.Settings /></div>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Empty Fee Architecture</p>
                        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>{isParent ? "No fiscal components detected for this node's level." : "Initiate 'Define Component' to establish institutional fees."}</p>
                      </td>
                    </tr>
                  ) : filteredFees.map((fee) => (
                    <tr key={fee.id} className="premium-row" style={{ borderBottom: '1px solid var(--brand-slate-100)' }}>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--brand-slate-100)', color: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icons.Tag />
                          </div>
                          <p style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{fee.name || fee.fee_name || 'N/A'}</p>
                        </div>
                      </td>
                      <td style={{ padding: '20px 32px', fontSize: '14px', color: '#475569', fontWeight: '600' }}>
                        {fee.grade || 'Global Node'}
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{(parseFloat(fee.amount) || 0).toLocaleString()}</p>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{termDisplayMap[fee.term] || fee.term || 'Primary Term'}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0', fontWeight: '800', textTransform: 'uppercase' }}>{fee.academic_year || fee.academicYear || '2023/2024'}</p>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <span style={{ 
                          padding: '6px 14px', 
                          borderRadius: '10px', 
                          fontSize: '11px', 
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          backgroundColor: (fee.isActive || fee.is_active || fee.status === 'active') ? '#ecfdf5' : '#fef2f2',
                          color: (fee.isActive || fee.is_active || fee.status === 'active') ? '#065f46' : '#991b1b',
                          border: `1px solid ${(fee.isActive || fee.is_active || fee.status === 'active') ? '#d1fae5' : '#fee2e2'}`
                        }}>
                          {(fee.isActive || fee.is_active || fee.status === 'active') ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {user?.role === 'finance' && (
                        <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleEdit(fee)}
                            className="premium-btn-secondary"
                            style={{ padding: '8px' }}
                          >
                            <Icons.Edit />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            </div>
          </main>

          {/* Fee Modal */}
          {showModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{editingItem ? 'Edit Fee Component' : 'Add Fee Component'}</h2>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Component Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Tuition Fee"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} 
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Amount (₵)</label>
                      <input 
                        type="number" 
                        required
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Grade</label>
                      <select 
                        value={formData.grade}
                        onChange={(e) => setFormData({...formData, grade: e.target.value})}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', backgroundColor: 'white' }}
                      >
                        {['Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'Basic 7', 'Basic 8', 'Basic 9'].map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Term</label>
                      <select 
                        value={formData.term}
                        onChange={(e) => setFormData({...formData, term: e.target.value})}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', backgroundColor: 'white' }}
                      >
                        {[
                          { label: 'First Term', value: '1st' },
                          { label: 'Second Term', value: '2nd' },
                          { label: 'Third Term', value: '3rd' },
                          { label: 'All Terms', value: 'all' }
                        ].map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Academic Year</label>
                      <input 
                        type="text" 
                        placeholder="2023/2024"
                        value={formData.academicYear}
                        onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} 
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    style={{ width: '100%', padding: '14px', backgroundColor: '#00843e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0, 132, 62, 0.2)' }}
                  >
                    {submitting ? 'Saving...' : editingItem ? 'Update Component' : 'Create Component'}
                  </button>
                </form>
              </div>
            </div>
          )}
          <style>{`
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
          `}</style>
        </div>
      );
    };

export default FeesStructure;
