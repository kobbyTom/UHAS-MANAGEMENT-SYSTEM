import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, parentAPI, academicClassesAPI, academicSectionsAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import RoleBasedSidebar from '../../../components/layout/RoleBasedSidebar';
import { mapSectionName } from '../../../utils/sectionHelper';
import TopNav from '../../../components/layout/TopNav';

import PremiumDatePicker from '../../../components/common/PremiumDatePicker';
import PremiumSelect from '../../../components/common/PremiumSelect';

// Form Input Component
const FormInput = ({ label, name, type = 'text', value, onChange, required = false, placeholder = '', options = [] }) => (
  <div style={{ marginBottom: '20px' }}>
    <label className="premium-label">
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    {type === 'date' ? (
      <PremiumDatePicker
        value={value}
        onChange={(val) => onChange({ target: { name, value: val } })}
        placeholder={placeholder || `Select ${label}`}
      />
    ) : options.length > 0 ? (
      <PremiumSelect
        label={name}
        value={value}
        options={options}
        onChange={onChange}
        placeholder={`Select ${label}`}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="premium-input"
      />
    )}
  </div>
);


// Section Header
const SectionHeader = ({ title, icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
    <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-green)', boxShadow: '0 4px 12px rgba(0, 132, 62, 0.08)' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={icon} />
      </svg>
    </div>
    <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{title}</h3>
  </div>
);


const AddStudent = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Students');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [parents, setParents] = useState([]);
  const [parentSearch, setParentSearch] = useState('');
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [dbGrades, setDbGrades] = useState([]);
  const [dbSections, setDbSections] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const dropdownRef = React.useRef(null);
  
  // Initial fetch of parents, classes, and sections
  React.useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [parentsRes, classesRes, sectionsRes] = await Promise.all([
          parentAPI.getAll({ limit: 10 }),
          academicClassesAPI.getAll(),
          academicSectionsAPI.getAll()
        ]);
        
        if (parentsRes.data.success) setParents(parentsRes.data.data);
        if (classesRes.data.success) setDbGrades(classesRes.data.data);
        if (sectionsRes.data.success) setDbSections(sectionsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch admission data:', err);
      }
    };
    fetchInitialData();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowParentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Server-side search with debounce
  React.useEffect(() => {
    if (!parentSearch || selectedParent) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await parentAPI.getAll({ search: parentSearch, limit: 10 });
        if (response.data.success) {
          setParents(response.data.data);
          setShowParentDropdown(true);
        }
      } catch (err) {
        console.error('Search failed:', err);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [parentSearch, selectedParent]);
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', gender: '', dateOfBirth: '', bloodGroup: '', nationality: 'Ghanaian', religion: '',
    email: '', phone: '', street: '', city: '', state: '', postalCode: '',
    admissionNumber: '', admissionDate: new Date().toISOString().split('T')[0], grade: '', section: '', rollNumber: '',
    fatherName: '', fatherPhone: '', fatherOccupation: '', motherName: '', motherPhone: '', motherOccupation: '', parentEmail: '',
    guardianEmail: '', guardianStreet: '',
    medicalConditions: '', allergies: '', emergencyContact: '',
    status: 'active'
  });

  const displayGrade = (g) => {
    if (!g) return 'N/A';
    let str = g.toString().trim();
    const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
    if (primaryMatch) return `Basic ${primaryMatch[1]}`;
    const jhsMatch = str.match(/^JHS\s*([1-3])$/i);
    if (jhsMatch) return `Basic ${parseInt(jhsMatch[1]) + 6}`;
    return str;
  };

  const gradeOptions = dbGrades.map(g => ({ value: g.name, label: displayGrade(g.name) }));

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  const sectionOptions = availableSections.length > 0 
    ? availableSections.map(s => ({ value: s.name, label: `Section ${mapSectionName(s.name)}` }))
    : [
        { value: 'A', label: `Section ${mapSectionName('A')}` },
        { value: 'B', label: `Section ${mapSectionName('B')}` },
        { value: 'C', label: `Section ${mapSectionName('C')}` },
        { value: 'D', label: `Section ${mapSectionName('D')}` }
      ];

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Filter sections when grade changes
    if (name === 'grade') {
      // Find the class ID for the selected grade name (or ID if we store ID)
      const selectedClass = dbGrades.find(g => g.name === value || g.id === value);
      if (selectedClass) {
        const filtered = dbSections.filter(s => s.class_id === selectedClass.id);
        setAvailableSections(filtered);
      } else {
        setAvailableSections([]);
      }
      
      // Auto-generate roll number based on number of students in the class
      try {
        const response = await studentAPI.getAll({ limit: 1000, grade: value });
        const students = response?.data?.data || response?.data || [];
        setFormData(prev => ({ ...prev, rollNumber: String(students.length + 1).padStart(2, '0') }));
      } catch (err) {
        console.error('Failed to auto-generate roll number:', err);
      }
    }

    // If user manually types parent email, clear selected parent to avoid confusion
    if (name === 'parentEmail' && selectedParent) {
      setSelectedParent(null);
    }
  };

  const handleSelectParent = (parent) => {
    setSelectedParent(parent);
    setFormData(prev => ({
      ...prev,
      fatherName: parent.relationship === 'father' ? `${parent.firstName} ${parent.lastName}` : prev.fatherName,
      motherName: (parent.relationship === 'mother' || parent.relationship === 'guardian') ? `${parent.firstName} ${parent.lastName}` : prev.motherName,
      parentEmail: parent.email,
      fatherPhone: parent.relationship === 'father' ? parent.phone : prev.fatherPhone,
      motherPhone: (parent.relationship === 'mother' || parent.relationship === 'guardian') ? parent.phone : prev.motherPhone,
    }));
    setParentSearch(`${parent.firstName} ${parent.lastName} (${parent.email})`);
    setShowParentDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);

    try {
      const response = await studentAPI.create(formData);
      if (response.data.success) {
        setSuccess('Student and Parent records created successfully!');
        setTimeout(() => navigate('/students'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student. Please check all required fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } 
    finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); navigate('/login'); }
  };

  return (
    <div className="add-student-page-content">
      <main style={{ padding: '20px 0 40px 0' }}>
          <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>New Enrollment</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Admission Form</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Register <span style={{ color: 'var(--brand-green)' }}>Student</span></h1>
              <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Complete the official school enrollment form.</p>
            </div>
            <button onClick={() => navigate('/students')} className="premium-btn-secondary" style={{ backgroundColor: 'white', border: '1px solid var(--brand-slate-200)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back to Directory
            </button>
          </div>


          {success && <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', borderLeft: '4px solid #10b981', fontWeight: '500' }}>{success}</div>}
          {error && <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', borderLeft: '4px solid #ef4444', fontWeight: '500' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
              
              {/* Personal Section */}
              <div className="glass-card">
                <SectionHeader title="Student Profile" icon="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                  <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="John" />
                  <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Doe" />
                  <FormInput label="Gender" name="gender" value={formData.gender} onChange={handleChange} required options={genderOptions} />
                  <FormInput label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
                  <FormInput label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} placeholder="Ghanaian" />
                  <FormInput label="Religion" name="religion" value={formData.religion} onChange={handleChange} placeholder="Christian" />
                </div>
              </div>

              {/* Academic Section */}
              <div className="glass-card">
                <SectionHeader title="Academic Details" icon="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                  <FormInput label="Class / Grade" name="grade" value={formData.grade} onChange={handleChange} required options={gradeOptions} />
                  <FormInput label="Section" name="section" value={formData.section} onChange={handleChange} required options={sectionOptions} />
                  <FormInput label="Admission Number" name="admissionNumber" value={formData.admissionNumber} onChange={handleChange} placeholder="Auto-generated if empty" />
                  <FormInput label="Admission Date" name="admissionDate" type="date" value={formData.admissionDate} onChange={handleChange} />
                  <FormInput label="Roll Number" name="rollNumber" value={formData.rollNumber} onChange={handleChange} placeholder="e.g. 01" />
                </div>
              </div>

              <div className="glass-card">
                <SectionHeader title="Guardian & Contact" icon="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />

                
                {/* Parent Search */}
                <div style={{ marginBottom: '32px', position: 'relative' }} ref={dropdownRef}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Search Existing Parent (Optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={parentSearch}
                      onChange={(e) => {
                        setParentSearch(e.target.value);
                        setShowParentDropdown(true);
                        if (!e.target.value) setSelectedParent(null);
                      }}
                      onFocus={() => setShowParentDropdown(true)}
                      className="premium-input"
                      style={{ paddingLeft: '44px' }}
                    />

                    <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    {selectedParent && (
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedParent(null);
                          setParentSearch('');
                          setFormData(prev => ({ ...prev, fatherName: '', motherName: '', parentEmail: '', fatherPhone: '', motherPhone: '' }));
                        }}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                  
                  {showParentDropdown && parentSearch && !selectedParent && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '250px', overflowY: 'auto' }}>
                      {parents.length > 0 ? (
                        parents.map(parent => (
                          <div 
                            key={parent.id} 
                            onClick={() => handleSelectParent(parent)}
                            style={{ 
                              padding: '14px 18px', 
                              cursor: 'pointer', 
                              borderBottom: '1px solid #f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(0, 132, 62, 0.06)';
                              e.currentTarget.style.color = 'var(--brand-green)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.color = 'inherit';
                            }}
                          >
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
                              {parent.firstName?.[0] || 'P'}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{parent.firstName} {parent.lastName}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{parent.email}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                          No matching parents found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                  <div style={{ gridColumn: '1 / -1', marginBottom: '-10px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '900', color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Father / Mother Information</h4>
                  </div>
                  <FormInput label="Father/Mother Name" name="fatherName" value={formData.fatherName} onChange={handleChange} placeholder="Full Name" />
                  <FormInput label="Father/Mother Phone" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} placeholder="+233..." />
                  <FormInput label="Parent Email" name="parentEmail" type="email" value={formData.parentEmail} onChange={handleChange} placeholder="email@example.com" />
                  <FormInput label="Street Address" name="street" value={formData.street} onChange={handleChange} placeholder="123 School St" />
                  
                  <div style={{ gridColumn: '1 / -1', marginBottom: '-10px', marginTop: '12px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '900', color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Guardian Information</h4>
                  </div>
                  <FormInput label="Guardian's Name" name="motherName" value={formData.motherName} onChange={handleChange} placeholder="Full Name" />
                  <FormInput label="Guardian's Phone" name="motherPhone" value={formData.motherPhone} onChange={handleChange} placeholder="+233..." />
                  <FormInput label="Guardian Email" name="guardianEmail" type="email" value={formData.guardianEmail} onChange={handleChange} placeholder="guardian@example.com" />
                  <FormInput label="Guardian Address" name="guardianStreet" value={formData.guardianStreet} onChange={handleChange} placeholder="Guardian's Address" />
                </div>
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '12px' }}>
                <button type="button" onClick={() => navigate('/students')} className="premium-btn-secondary" style={{ backgroundColor: 'white', border: '1px solid var(--brand-slate-200)', color: 'var(--brand-slate-600)' }}>Cancel</button>
                <button type="submit" disabled={loading} className="premium-btn-primary" style={{ padding: '16px 40px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Registering...' : 'Enroll Student'}
                  {!loading && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                </button>
              </div>


            </div>
          </form>
        </main>
      </div>
    );
};

export default AddStudent;
