import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { staffAPI, teacherAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import RoleBasedSidebar from '../../../components/layout/RoleBasedSidebar';
import TopNav from '../../../components/layout/TopNav';

const Icons = {
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Mail: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Phone: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Briefcase: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

const roleOptions = [
  { value: 'Accountant', label: 'Accountant' },
  { value: 'Librarian', label: 'Librarian' },
  { value: 'Security', label: 'Security Guard' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Receptionist', label: 'Receptionist' },
  { value: 'Administrator', label: 'Administrator' },
  { value: 'Office Assistant', label: 'Office Assistant' },
  { value: 'Driver', label: 'Driver' },
];

const departmentOptions = [
  { value: 'Finance', label: 'Finance' },
  { value: 'Library', label: 'Library' },
  { value: 'Security', label: 'Security' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Administration', label: 'Administration' },
  { value: 'Transport', label: 'Transport' },
];

const InfoRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
    <div style={{ color: 'var(--brand-green)', backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '12px', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
    <div>
      <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '900' }}>{label}</p>
      <p style={{ fontSize: '14px', color: '#0f172a', margin: '2px 0 0', fontWeight: '700' }}>{value || 'N/A'}</p>
    </div>
  </div>
);

const FormSection = ({ title, icon, children }) => (
  <div style={{ backgroundColor: 'var(--brand-slate-50)', border: '1px solid var(--brand-slate-100)', borderRadius: '24px', padding: '32px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', color: '#0f172a' }}>
      <div style={{ color: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <h4 style={{ fontSize: '18px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>{title}</h4>
    </div>
    {children}
  </div>
);

const FormGroup = ({ label, name, value, onChange, type = 'text', options = [] }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>{label}</label>
    {type === 'select' ? (
      <select name={name} value={value || ''} onChange={onChange} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', backgroundColor: 'white', transition: 'all 0.2s' }}>
        <option value="">Select Option</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt.v || opt.value || ''}>
            {opt.l || opt.label || ''}
          </option>
        ))}
      </select>
    ) : (
      <input type={type} name={name} value={value || ''} onChange={onChange} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', transition: 'all 0.2s' }} />
    )}
  </div>
);

const DataBlock = ({ label, value, fullWidth = false, badge = false }) => (
  <div style={{ gridColumn: fullWidth ? 'span 2' : 'auto' }}>
    <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{label}</p>
    {badge ? (
      <span style={{ display: 'inline-block', padding: '8px 16px', borderRadius: '12px', backgroundColor: 'var(--brand-slate-50)', color: 'var(--brand-green)', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', border: '1px solid var(--brand-slate-100)' }}>{value || 'N/A'}</span>
    ) : (
      <p style={{ fontSize: '16px', color: '#0f172a', fontWeight: '700', margin: 0 }}>{value || 'Institutional Null'}</p>
    )}
  </div>
);

const StaffProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Staff');
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    fetchStaffData();
  }, [id]);

  const fetchStaffData = async () => {
    if (!id || id === 'add') return;
    try {
      setLoading(true);
      setError('');
      setIsTeacher(false);
      let response;
      try {
        response = await staffAPI.getById(id);
      } catch (err) {
        if (err.response?.status === 404) {
          try {
            const teacherResponse = await teacherAPI.getById(id);
            if (teacherResponse && teacherResponse.data) {
              response = teacherResponse;
              setIsTeacher(true);
            } else {
              throw err;
            }
          } catch (tErr) {
            throw err; 
          }
        } else {
          throw err;
        }
      }

      if (response && response.data) {
        const data = response.data.data || response.data;
        setStaff(data);
      } else {
        setError('Staff member not found');
      }
    } catch (err) {
      console.error('Error fetching staff data:', err);
      setError(err.response?.data?.message || 'Failed to load staff profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      navigate('/login');
    }
  };

  const startEdit = () => {
    setFormData({
      firstName: staff?.firstName || staff?.first_name || '',
      lastName: staff?.lastName || staff?.last_name || '',
      gender: staff?.gender || '',
      dateOfBirth: staff?.dateOfBirth || '',
      nationality: staff?.nationality || 'Ghanaian',
      email: staff?.email || '',
      phone: staff?.phone || '',
      address: staff?.address || { street: '', city: '', region: '', country: 'Ghana' },
      emergencyContact: staff?.emergencyContact || { name: '', relationship: '', phone: '', email: '' },
      department: staff?.department || '',
      role: staff?.position || staff?.role || '',
      qualifications: staff?.qualifications || '',
      salary: staff?.salary || '',
      dateOfEmployment: staff?.dateOfEmployment || '',
      contractType: staff?.contractType || 'permanent',
      socialSecurity: staff?.socialSecurity || '',
      status: staff?.status || 'active'
    });
    setEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...formData, position: formData.role };
      if (isTeacher) {
        await teacherAPI.update(id, payload);
      } else {
        await staffAPI.update(id, payload);
      }
      setSuccess(`${isTeacher ? 'Teacher' : 'Staff'} profile updated successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      setEditing(false);
      fetchStaffData();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fe' }}><div className="spinner"></div></div>;

  if (!staff) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <h2 style={{ color: '#1e293b' }}>Staff not found</h2>
        <button onClick={() => navigate('/staff/non-teaching')} className="premium-btn-primary" style={{ margin: '20px auto 0' }}>Back to Staff</button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={() => navigate('/staff/non-teaching')} 
            className="premium-btn-secondary"
            style={{ width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icons.ArrowLeft />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ padding: '6px 14px', backgroundColor: '#f0fdf4', color: 'var(--brand-green)', borderRadius: '12px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid #dcfce7' }}>Support Staff</span>
              <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Personnel Registry</span>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>
              {staff?.firstName || staff?.first_name} <span style={{ color: 'var(--brand-green)' }}>{staff?.lastName || staff?.last_name}</span>
            </h1>
            <p style={{ fontSize: '16px', color: '#475569', marginTop: '8px', fontWeight: '500' }}>Institutional profile and professional standing for staff ID {staff?.employeeId || staff?.employee_id || 'N/A'}.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="premium-btn-primary" style={{ backgroundColor: 'var(--brand-green)' }}>
                {saving ? <div className="mini-spinner"></div> : <Icons.Check />}
                Commit Profile
              </button>
              <button onClick={() => setEditing(false)} className="premium-btn-secondary">
                <Icons.X />
                Abort
              </button>
            </>
          ) : (
            <button onClick={startEdit} className="premium-btn-primary" style={{ backgroundColor: 'var(--brand-green)' }}>
              <Icons.Edit />
              Update Credentials
            </button>
          )}
        </div>
      </div>

      {success && <div style={{ backgroundColor: '#f5f3ff', color: '#6b21a8', padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', borderLeft: '4px solid #9333ea', fontWeight: '500', animation: 'slideIn 0.3s ease-out' }}>{success}</div>}
      {error && <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', borderLeft: '4px solid #ef4444', fontWeight: '500' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px' }}>
        {/* Profile Sidebar */}
        <aside>
          <div className="glass-card" style={{ padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ 
              width: '140px', 
              height: '140px', 
              borderRadius: '40px', 
              backgroundColor: 'var(--brand-green)', 
              margin: '0 auto 28px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white', 
              fontSize: '48px', 
              fontWeight: '900', 
              boxShadow: '0 20px 40px rgba(168, 85, 247, 0.2)',
              border: '4px solid white'
            }}>
              {(staff?.firstName || staff?.first_name)?.[0]}{(staff?.lastName || staff?.last_name)?.[0]}
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>{staff?.firstName || staff?.first_name} {staff?.lastName || staff?.last_name}</h2>
            <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px', fontWeight: '600' }}>{staff?.position || staff?.role || 'Staff Member'} • {staff?.department || 'N/A'}</p>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 20px', 
              borderRadius: '20px', 
              backgroundColor: staff?.status === 'active' ? '#ecfdf5' : '#fef2f2', 
              color: staff?.status === 'active' ? '#065f46' : '#991b1b', 
              fontSize: '11px', 
              fontWeight: '900', 
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              border: `1px solid ${staff?.status === 'active' ? '#d1fae5' : '#fee2e2'}`
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
              {staff?.status || 'Active'}
            </div>

            <div style={{ marginTop: '40px', borderTop: '1px solid var(--brand-slate-100)', paddingTop: '40px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>Contact Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <InfoRow icon={<Icons.Mail />} label="Institutional Email" value={staff?.email} />
                <InfoRow icon={<Icons.Phone />} label="Personal Phone" value={staff?.phone} />
                <InfoRow icon={<Icons.Briefcase />} label="Employee ID" value={staff?.employeeId || staff?.employee_id} />
                <InfoRow icon={<Icons.MapPin />} label="Current Location" value={staff?.address?.city} />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            {!editing && (
              <div style={{ display: 'flex', padding: '0 32px', backgroundColor: 'var(--brand-slate-50)', borderBottom: '1px solid var(--brand-slate-100)' }}>
                {['personal', 'professional'].map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)} 
                    style={{ 
                      padding: '24px 32px', 
                      border: 'none', 
                      background: 'none', 
                      fontSize: '13px', 
                      fontWeight: '900', 
                      color: activeTab === tab ? 'var(--brand-green)' : '#94a3b8', 
                      borderBottom: activeTab === tab ? '3px solid var(--brand-green)' : '3px solid transparent', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s', 
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    {tab} Data Matrix
                  </button>
                ))}
              </div>
            )}

            <div style={{ padding: '40px' }}>
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  <FormSection title="Identity & Personal" icon={<Icons.User />}>
                    <div className="responsive-grid-3">
                      <FormGroup label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                      <FormGroup label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                      <FormGroup label="Gender" name="gender" value={formData.gender} onChange={handleChange} type="select" options={[{v:'male', l:'Male'}, {v:'female', l:'Female'}]} />
                      <FormGroup label="Date of Birth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} type="date" />
                      <FormGroup label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
                      <FormGroup label="SSNIT Number" name="socialSecurity" value={formData.socialSecurity} onChange={handleChange} />
                    </div>
                  </FormSection>

                  <FormSection title="Contact & Residence" icon={<Icons.MapPin />}>
                    <div className="responsive-grid-3">
                      <FormGroup label="Personal Email" name="email" value={formData.email} onChange={handleChange} />
                      <FormGroup label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
                      <FormGroup label="Street Address" name="address.street" value={formData.address?.street} onChange={handleChange} />
                      <FormGroup label="City" name="address.city" value={formData.address?.city} onChange={handleChange} />
                      <FormGroup label="Emergency Contact" name="emergencyContact.name" value={formData.emergencyContact?.name} onChange={handleChange} />
                      <FormGroup label="Emergency Phone" name="emergencyContact.phone" value={formData.emergencyContact?.phone} onChange={handleChange} />
                    </div>
                  </FormSection>

                  <FormSection title="Professional Career" icon={<Icons.Briefcase />}>
                    <div className="responsive-grid-3">
                      <FormGroup label="Department" name="department" value={formData.department} onChange={handleChange} type="select" options={departmentOptions.map(d => ({v:d.value, l:d.label}))} />
                      <FormGroup label="Position/Role" name="role" value={formData.role} onChange={handleChange} type="select" options={roleOptions.map(r => ({v:r.value, l:r.label}))} />
                      <FormGroup label="Contract" name="contractType" value={formData.contractType} onChange={handleChange} type="select" options={[{v:'permanent', l:'Permanent'}, {v:'contract', l:'Contract'}]} />
                      <FormGroup label="Highest Qualification" name="qualifications" value={formData.qualifications} onChange={handleChange} />
                      <FormGroup label="Monthly Salary (GHS)" name="salary" value={formData.salary} onChange={handleChange} type="number" />
                      <FormGroup label="Employment Date" name="dateOfEmployment" value={formData.dateOfEmployment} onChange={handleChange} type="date" />
                      <FormGroup label="Employment Status" name="status" value={formData.status} onChange={handleChange} type="select" options={[{v:'active', l:'Active'}, {v:'inactive', l:'Inactive'}]} />
                    </div>
                  </FormSection>
                </div>
              ) : (
                <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                  {activeTab === 'personal' && (
                    <div className="responsive-grid-2" style={{ gap: '32px' }}>
                      <DataBlock label="Biological Gender" value={staff?.gender} />
                      <DataBlock label="Date of Birth" value={staff?.dateOfBirth} />
                      <DataBlock label="National Identity" value={staff?.nationality} />
                      <DataBlock label="SSNIT Identifier" value={staff?.socialSecurity} />
                      <DataBlock label="Residential Address" value={`${staff?.address?.street || ''}, ${staff?.address?.city || ''}`.trim().replace(/^,|,$/g, '') || 'N/A'} fullWidth />
                      <DataBlock label="Emergency Protocol" value={`${staff?.emergencyContact?.name || ''} ${staff?.emergencyContact?.phone ? `(${staff.emergencyContact.phone})` : ''}`.trim() || 'N/A'} fullWidth />
                    </div>
                  )}
                  {activeTab === 'professional' && (
                    <div className="responsive-grid-2" style={{ gap: '32px' }}>
                      <DataBlock label="Commission Date" value={staff?.dateOfEmployment} />
                      <DataBlock label="Contract Status" value={staff?.contractType} badge />
                      <DataBlock label="Highest Qualification" value={staff?.qualifications} />
                      <DataBlock label="Department" value={staff?.department} />
                      <DataBlock label="Institutional Remuneration" value={staff?.salary ? `GHS ${Number(staff.salary).toLocaleString()}` : 'N/A'} />
                      <DataBlock label="Faculty Role" value={staff?.position || staff?.role} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--brand-green); borderRadius: 50%; animation: spin 1s linear infinite; }
        .mini-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; borderRadius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        input:focus, select:focus { border-color: var(--brand-green) !important; box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.1) !important; outline: none !important; }
      `}</style>
    </div>
  );
};

export default StaffProfile;
