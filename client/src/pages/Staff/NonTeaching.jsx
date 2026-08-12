import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { staffAPI } from '../../services/api';
import PremiumSelect from '../../components/common/PremiumSelect';

const NonTeaching = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Staff');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: '', department: '', status: 'active'
  });

  const roleOptions = [
    { value: 'Accountant', label: 'Accountant' },
    { value: 'Librarian', label: 'Librarian' },
    { value: 'Security', label: 'Security Guard' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Receptionist', label: 'Receptionist' },
    { value: 'Admission Officer', label: 'Admission Officer' },
    { value: 'Office Assistant', label: 'Office Assistant' },
    { value: 'Driver', label: 'Driver' },
  ];

  const departmentOptions = [
    { value: 'Finance', label: 'Finance' },
    { value: 'Library', label: 'Library' },
    { value: 'Security', label: 'Security' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Administration', label: 'Administration' },
    { value: 'Admission', label: 'Admission' },
    { value: 'Transport', label: 'Transport' },
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffAPI.getAll({ limit: 500 });
      setStaff(response?.data?.data || response?.data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [generatedCredentials, setGeneratedCredentials] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setGeneratedCredentials(null);
    setSaving(true);
    try {
      const staffData = { ...formData, isStaff: true };
      
      if (editingStaff) {
        await staffAPI.update(editingStaff.id || editingStaff._id, staffData);
        setSuccess('Staff updated successfully!');
      } else {
        const response = await staffAPI.create(staffData);
        if (response.data.credentials) {
          setGeneratedCredentials(response.data.credentials);
        }
        setSuccess('Staff added successfully!');
      }
      setShowModal(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', role: '', department: '', status: 'active' });
      setEditingStaff(null);
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save staff');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName || staffMember.first_name || '',
      lastName: staffMember.lastName || staffMember.last_name || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      role: staffMember.position || staffMember.role || '',
      department: staffMember.department || '',
      status: staffMember.status || 'active'
    });
    setShowModal(true);
  };

  const handleDelete = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await staffAPI.delete(staffId);
      setSuccess('Staff deleted successfully!');
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete staff');
    }
  };

  return (
    <>
      <main>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Institutional Support</span>
              <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Non-Teaching Faculty</span>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Staff <span style={{ color: 'var(--brand-green)' }}>Management</span></h1>
            <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Manage administrative and support staff records</p>
          </div>
          <button 
            onClick={() => { setEditingStaff(null); setFormData({ firstName: '', lastName: '', email: '', phone: '', role: '', department: '', status: 'active' }); setShowModal(true); }} 
            className="premium-btn-primary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Register Staff
          </button>
        </div>

        {success && <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', borderLeft: '4px solid #10b981', fontWeight: '500' }}>{success}</div>}
        
        {generatedCredentials && (
          <div className="glass-card" style={{ border: '1.5px solid #bae6fd', backgroundColor: '#f0f9ff', padding: '24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0369a1', margin: 0, letterSpacing: '-0.5px' }}>Security Credentials Generated</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label className="premium-label" style={{ color: '#0369a1' }}>User Identification</label>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0, backgroundColor: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>{generatedCredentials.email}</p>
              </div>
              <div>
                <label className="premium-label" style={{ color: '#0369a1' }}>Access Token</label>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0, backgroundColor: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>{generatedCredentials.password}</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '16px', fontWeight: '500' }}>Please securely transmit these credentials to the staff member. A mandatory password update is required on first access.</p>
          </div>
        )}

        {error && <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', borderLeft: '4px solid #ef4444', fontWeight: '500' }}>{error}</div>}

        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}><div className="premium-loader"></div></div>
          ) : staff.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 40px', color: '#64748b' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: '#ffffff', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="11" r="3"/></svg>
              </div>
              <h3 style={{ fontWeight: '900', fontSize: '22px', color: '#1e293b', marginBottom: '8px', letterSpacing: '-0.5px' }}>Empty Staff Registry</h3>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>There are no non-teaching staff records to display. Register a new staff member to begin.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <th className="premium-th">Staff Member</th>
                  <th className="premium-th">Specialization</th>
                  <th className="premium-th">Connectivity</th>
                  <th className="premium-th">Status</th>
                  <th className="premium-th" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(member => (
                  <tr key={member.id || member._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s' }} className="table-row">
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }} onClick={() => navigate(`/staff/${member.id || member._id}`)}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px' }}>
                          {member.firstName?.[0] || member.first_name?.[0]}{member.lastName?.[0] || member.last_name?.[0]}
                        </div>
                        <div>
                          <p style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{member.firstName || member.first_name} {member.lastName || member.last_name}</p>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>{member.employeeId || member.employee_id || 'STF-0000'}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#475569', margin: 0 }}>{member.position || member.role || 'Staff'}</p>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>{member.department || 'General'}</p>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>{member.email || 'N/A'}</p>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>{member.phone || 'N/A'}</p>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', backgroundColor: member.status === 'active' ? '#ecfdf5' : '#fef2f2', color: member.status === 'active' ? '#10b981' : '#ef4444', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                        {member.status || 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => handleEdit(member)} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }} title="Edit">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => handleDelete(member.id || member._id)} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #fee2e2', backgroundColor: '#fff1f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s' }} title="Delete">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {showModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ width: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0, letter_spacing: '-1px' }}>{editingStaff ? 'Update' : 'Register'} Staff Member</h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>Enter personnel details for the institutional registry.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="premium-close-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="form-grid">
              <div style={{ gridColumn: 'span 1' }}>
                <label className="premium-label">First Name</label>
                <input name="firstName" className="premium-input" value={formData.firstName} onChange={handleChange} required placeholder="e.g. John" />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label className="premium-label">Last Name</label>
                <input name="lastName" className="premium-input" value={formData.lastName} onChange={handleChange} required placeholder="e.g. Doe" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="premium-label">Official Email (Optional)</label>
                <input name="email" type="email" className="premium-input" value={formData.email} onChange={handleChange} placeholder="system-generated if left blank" />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label className="premium-label">Phone Number</label>
                <input name="phone" type="tel" className="premium-input" value={formData.phone} onChange={handleChange} placeholder="+233..." />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label className="premium-label">Personnel Role</label>
                <PremiumSelect 
                  value={formData.role} 
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  options={roleOptions}
                  placeholder="Select Role"
                />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label className="premium-label">Department</label>
                <PremiumSelect 
                  value={formData.department} 
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  options={departmentOptions}
                  placeholder="Select Dept"
                />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label className="premium-label">Account Status</label>
                <PremiumSelect 
                  value={formData.status} 
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' }
                  ]}
                  placeholder="Status"
                />
              </div>
              
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button type="submit" disabled={saving} className="premium-btn-primary" style={{ flex: 1, padding: '16px', fontSize: '15px' }}>
                  {saving ? 'Processing...' : editingStaff ? 'Update Record' : 'Enroll Personnel'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '16px 28px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '16px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default NonTeaching;
