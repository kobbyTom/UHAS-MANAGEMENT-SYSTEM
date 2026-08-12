import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import RoleBasedSidebar from '../../../components/layout/RoleBasedSidebar';
import PremiumDatePicker from '../../../components/common/PremiumDatePicker';
import PremiumSelect from '../../../components/common/PremiumSelect';


const FormInput = ({ label, name, type = 'text', value, onChange, required = false, placeholder = '', options = [] }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
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

const SectionHeader = ({ title, icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{title}</h3>
  </div>
);

const AddTeacher = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeMenu, setActiveMenu] = useState('Staff');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', gender: '', dateOfBirth: '', nationality: '', religion: '',
    email: '', phone: '', street: '', city: '', state: '',
    employeeId: '', subject: '', position: '', qualifications: '', specialization: '',
    experience: '', dateOfEmployment: '', salary: '', subjects: [], coordinatorBlock: ''
  });

  const subjectOptions = [
    { value: 'Mathematics', label: 'Mathematics' },
    { value: 'English', label: 'English' },
    { value: 'Science', label: 'Science' },
    { value: 'Social Studies', label: 'Social Studies' },
    { value: 'ICT', label: 'ICT' },
    { value: 'Religious Studies', label: 'Religious Studies' },
    { value: 'French', label: 'French' },
    { value: 'Creative Arts', label: 'Creative Arts' },
    { value: 'Physical Education', label: 'Physical Education' },
    { value: 'Home Economics', label: 'Home Economics' },
    { value: 'Technical', label: 'Technical' },
    { value: 'Business', label: 'Business' },
  ];

  const qualificationOptions = [
    { value: 'Diploma', label: 'Diploma' },
    { value: 'Bachelor Degree', label: 'Bachelor Degree' },
    { value: 'Master Degree', label: 'Master Degree' },
    { value: 'PhD', label: 'PhD' },
  ];

  const coordinatorOptions = [
    { value: '', label: 'None (Regular Teacher)' },
    { value: 'KG', label: 'Kindergarten (KG 1-3)' },
    { value: 'Basic 1-3', label: 'Lower Basic (Basic 1-3)' },
    { value: 'Basic 4-6', label: 'Upper Basic (Basic 4-6)' },
    { value: 'JHS', label: 'Basic 7-9 (JHS)' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const teacherData = {
        ...formData,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: 'Ghana'
        },
        subjects: formData.subject ? [formData.subject] : []
      };
      
      const response = await teacherAPI.create(teacherData);
      if (response.data.success) {
        setSuccess('Teacher added successfully!');
        setTimeout(() => navigate('/teachers'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add teacher.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Add New Teacher</h1>
        <button onClick={() => navigate('/teachers')} style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>Back to List</button>
      </div>

      {success && <div style={{ padding: '16px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '20px' }}>{success}</div>}
      {error && <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <SectionHeader title="Personal Information" />
          <div className="form-grid-3">
            <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
            <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
            <FormInput label="Gender" name="gender" value={formData.gender} onChange={handleChange} required options={[{value:'male',label:'Male'},{value:'female',label:'Female'}]} />
            <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="e.g. teacher@uhasbasic.edu.gh" />
            <FormInput label="Phone" name="phone" value={formData.phone} onChange={handleChange} required />
            <FormInput label="Employee ID" name="employeeId" value={formData.employeeId} onChange={handleChange} required placeholder="e.g. TCH011" />
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <SectionHeader title="Professional Information" />
          <div className="form-grid-3">
            <FormInput label="Subject" name="subject" value={formData.subject} onChange={handleChange} required options={subjectOptions} />
            <FormInput label="Qualification" name="qualifications" value={formData.qualifications} onChange={handleChange} required options={qualificationOptions} />
            <FormInput label="Coordinator Block" name="coordinatorBlock" value={formData.coordinatorBlock} onChange={handleChange} options={coordinatorOptions} />
            <FormInput label="Salary" name="salary" type="number" value={formData.salary} onChange={handleChange} />
            <FormInput label="Join Date" name="dateOfEmployment" type="date" value={formData.dateOfEmployment} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" onClick={() => navigate('/teachers')} style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '12px 24px', backgroundColor: 'var(--brand-green)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Add Teacher'}
          </button>
        </div>
      </form>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AddTeacher;
