import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { parentAPI, studentAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { mapSectionName } from '../../../utils/sectionHelper';

// Modern Icon Components
const Icons = {
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Mail: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Phone: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Briefcase: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Activity: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
};

const ParentProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [parent, setParent] = useState(null);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchParentData(); }, [id]);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      const res = await parentAPI.getById(id);
      if (res.data?.success) {
        const data = res.data.data;
        const normalizedParent = {
          ...data,
          firstName: data.firstName || data.first_name,
          lastName: data.lastName || data.last_name,
          studentIds: data.studentIds || data.student_ids || []
        };
        setParent(normalizedParent);
        
        if (normalizedParent.studentIds.length > 0) {
          const studentPromises = normalizedParent.studentIds.map(sid => studentAPI.getById(sid).catch(() => null));
          const studentRes = await Promise.all(studentPromises);
          setLinkedStudents(studentRes.filter(r => r?.data?.success).map(r => r.data.data));
        }
      }
    } catch (err) { 
      console.error('Fetch error:', err);
      setError('Failed to load profile');
    }
    finally { setLoading(false); }
  };

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); navigate('/login'); } };

  const startEdit = () => {
    setFormData({
      firstName: parent?.firstName || '',
      lastName: parent?.lastName || '',
      email: parent?.email || '',
      phone: parent?.phone || '',
      occupation: parent?.occupation || '',
      address: parent?.address || { street: '', city: '', region: '', country: 'Ghana' },
      relationship: parent?.relationship || 'Parent',
      status: parent?.status || 'active'
    });
    setEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [pKey, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [pKey]: { ...prev[pKey], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await parentAPI.update(id, formData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setEditing(false);
      fetchParentData();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
      setTimeout(() => setError(''), 3000);
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}><div className="premium-loader"></div></div>;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ maxWidth: '1600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <button 
                onClick={() => navigate('/parents')} 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '16px', 
                  border: '1px solid var(--brand-slate-200)', 
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: 'var(--brand-slate-600)'
                }}
              >
                <Icons.ArrowLeft />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guardian Portfolio</span>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--brand-slate-300)' }}></div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--brand-slate-500)' }}>{parent?.relationship || 'Guardian'}</span>
                </div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--brand-slate-900)', margin: 0, letterSpacing: '-0.02em' }}>
                  {parent?.firstName} <span style={{ color: 'var(--brand-green)' }}>{parent?.lastName}</span>
                </h1>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)} className="premium-btn-secondary" style={{ backgroundColor: 'white', border: '1px solid var(--brand-slate-200)', boxShadow: 'none' }}>
                    <Icons.X /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="premium-btn-primary">
                    {saving ? <div className="mini-spinner"></div> : <Icons.Check />} Save Profile
                  </button>
                </>
              ) : (
                <button onClick={startEdit} className="premium-btn-primary">
                  <Icons.Edit /> Edit Details
                </button>
              )}
            </div>
          </div>

          {success && (
            <div style={{ 
              backgroundColor: '#ecfdf5', 
              color: '#065f46', 
              padding: '16px 24px', 
              borderRadius: '16px', 
              marginBottom: '32px', 
              border: '1px solid #d1fae5', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              fontWeight: '600',
              animation: 'slideDown 0.4s ease-out'
            }}>
              <Icons.Check /> {success}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '32px', alignItems: 'start' }}>
            <div className="glass-card" style={{ padding: '40px 32px', position: 'sticky', top: '110px' }}>
              <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 24px' }}>
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '48px', 
                  backgroundColor: '#f59e0b', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '48px', 
                  fontWeight: '800', 
                  color: 'white',
                  border: '4px solid white',
                  boxShadow: '0 10px 25px rgba(245, 158, 11, 0.2)'
                }}>
                  {parent?.firstName?.[0]}{parent?.lastName?.[0]}
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--brand-slate-900)', margin: '0 0 8px 0' }}>{parent?.firstName} {parent?.lastName}</h2>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--brand-slate-500)', margin: 0 }}>{parent?.occupation || 'Institutional Guardian'}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid var(--brand-slate-100)', paddingTop: '32px' }}>
                <QuickInfo icon={<Icons.Mail />} label="Email Address" value={parent?.email} color="#f59e0b" />
                <QuickInfo icon={<Icons.Phone />} label="Phone Number" value={parent?.phone} color="#f59e0b" />
                <QuickInfo icon={<Icons.User />} label="Relationship" value={parent?.relationship} color="#f59e0b" />
                <QuickInfo icon={<Icons.MapPin />} label="Location" value={parent?.address?.city} color="#f59e0b" />
              </div>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', minHeight: '600px' }}>
              <div style={{ display: 'flex', padding: '0 32px', borderBottom: '1px solid var(--brand-slate-100)', backgroundColor: '#fcfdfe' }}>
                {[
                  { id: 'personal', label: 'Guardian Details', icon: <Icons.User /> },
                  { id: 'scholars', label: 'Linked Scholars', icon: <Icons.Activity /> }
                ].map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    style={{ 
                      padding: '24px 24px', 
                      border: 'none', 
                      background: 'none', 
                      fontSize: '14px', 
                      fontWeight: '700', 
                      color: activeTab === tab.id ? 'var(--brand-green)' : 'var(--brand-slate-400)', 
                      borderBottom: activeTab === tab.id ? '3px solid var(--brand-green)' : '3px solid transparent', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span style={{ opacity: activeTab === tab.id ? 1 : 0.6 }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: '40px' }}>
                {editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    <div className="responsive-grid-2">
                      <div style={{ gridColumn: 'span 2' }}><SectionTitle title="Identity & Personal" /></div>
                      <FormGroup label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                      <FormGroup label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                      <FormGroup label="Email" name="email" value={formData.email} onChange={handleChange} />
                      <FormGroup label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
                      <FormGroup label="Occupation" name="occupation" value={formData.occupation} onChange={handleChange} />
                      <FormGroup label="Relationship" name="relationship" value={formData.relationship} onChange={handleChange} />
                    </div>

                    <div className="responsive-grid-2">
                      <div style={{ gridColumn: 'span 2' }}><SectionTitle title="Residence Details" /></div>
                      <FormGroup label="Street" name="address.street" value={formData.address?.street} onChange={handleChange} />
                      <FormGroup label="City" name="address.city" value={formData.address?.city} onChange={handleChange} />
                    </div>
                  </div>
                ) : (
                  <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    {activeTab === 'personal' && (
                      <div className="responsive-grid-2" style={{ gap: '48px' }}>
                        <DetailBlock label="Full Legal Name" value={`${parent?.firstName} ${parent?.lastName}`} icon={<Icons.User />} />
                        <DetailBlock label="Email Access" value={parent?.email} icon={<Icons.Mail />} />
                        <DetailBlock label="Institutional Role" value={parent?.relationship} icon={<Icons.Shield />} />
                        <DetailBlock label="Professional Standing" value={parent?.occupation} icon={<Icons.Briefcase />} />
                        <DetailBlock label="Residential Address" value={`${parent?.address?.street}, ${parent?.address?.city}`} icon={<Icons.MapPin />} fullWidth />
                      </div>
                    )}
                    {activeTab === 'scholars' && (
                      <div>
                        <SectionTitle title="Registered Dependent Scholars" />
                        <div className="responsive-grid-2" style={{ gap: '20px' }}>
                          {linkedStudents.map(student => (
                            <div 
                              key={student._id} 
                              onClick={() => navigate(`/students/${student._id}`)}
                              style={{ 
                                padding: '24px', 
                                backgroundColor: 'white', 
                                borderRadius: '24px', 
                                border: '1px solid var(--brand-slate-100)', 
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.05)';
                                e.currentTarget.style.borderColor = 'var(--brand-green)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = 'var(--brand-slate-100)';
                              }}
                            >
                              <div style={{ width: '60px', height: '60px', borderRadius: '20px', backgroundColor: 'var(--brand-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-green)', fontSize: '20px', fontWeight: '800' }}>
                                {student.firstName?.[0]}{student.lastName?.[0]}
                              </div>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--brand-slate-900)' }}>{student.firstName} {student.lastName}</h4>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--brand-slate-500)', fontWeight: '600' }}>{student.grade} • Section {mapSectionName(student.section || 'A')}</p>
                              </div>
                            </div>
                          ))}
                          {linkedStudents.length === 0 && <p style={{ color: 'var(--brand-slate-400)', fontSize: '14px' }}>No linked scholars found.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .mini-spinner { width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const QuickInfo = ({ icon, label, value, color = 'var(--brand-green)' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--brand-slate-50)', color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--brand-slate-100)' }}>{icon}</div>
    <div>
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--brand-slate-400)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: '14px', color: 'var(--brand-slate-900)', fontWeight: '700' }}>{value || 'N/A'}</p>
    </div>
  </div>
);

const DetailBlock = ({ label, value, icon, fullWidth = false }) => (
  <div style={{ gridColumn: fullWidth ? 'span 2' : 'auto' }}>
    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--brand-slate-400)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <span style={{ color: 'var(--brand-green)', marginTop: '2px', opacity: 0.6 }}>{icon}</span>
      <p style={{ margin: 0, fontSize: '16px', color: 'var(--brand-slate-900)', fontWeight: '600', lineHeight: 1.5 }}>{value || 'Not provided'}</p>
    </div>
  </div>
);

const SectionTitle = ({ title }) => (
  <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--brand-slate-900)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
    {title}
    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--brand-slate-100)' }}></div>
  </h3>
);

const FormGroup = ({ label, name, value, onChange, type = 'text' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label className="premium-label">{label}</label>
    <input type={type} name={name} value={value || ''} onChange={onChange} className="premium-input" />
  </div>
);

export default ParentProfile;
