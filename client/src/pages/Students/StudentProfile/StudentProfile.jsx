import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentAPI, attendanceAPI, gradeAPI, assignmentAPI, academicClassesAPI, academicSectionsAPI, parentAPI, courseAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import PremiumSelect from '../../../components/common/PremiumSelect';
import PremiumDatePicker from '../../../components/common/PremiumDatePicker';
import { mapSectionName } from '../../../utils/sectionHelper';

// Premium Icon Components
const Icons = {
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Phone: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Heart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Award: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  Activity: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Book: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
};

const displayGrade = (g) => {
  if (!g) return 'No Grade';
  let str = g.toString().trim();
  const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
  if (primaryMatch) return `Basic ${primaryMatch[1]}`;
  const jhsMatch = str.match(/^JHS\s*([1-3])$/i);
  if (jhsMatch) return `Basic ${parseInt(jhsMatch[1]) + 6}`;
  return str;
};

const StudentProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [dbGrades, setDbGrades] = useState([]);
  const [dbSections, setDbSections] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [curriculumCount, setCurriculumCount] = useState(0);

  useEffect(() => { 
    fetchStudentData(); 
    fetchAcademicMetadata();
  }, [id]);

  const fetchAcademicMetadata = async () => {
    try {
      const [classesRes, sectionsRes] = await Promise.all([
        academicClassesAPI.getAll(),
        academicSectionsAPI.getAll()
      ]);
      if (classesRes.data.success) setDbGrades(classesRes.data.data);
      if (sectionsRes.data.success) setDbSections(sectionsRes.data.data);
    } catch (err) {
      console.error('Error fetching academic metadata:', err);
    }
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [studentRes, attendanceRes, gradesRes] = await Promise.allSettled([
        studentAPI.getById(id),
        attendanceAPI.getByStudent(id),
        gradeAPI.getByStudent(id)
      ]);

      if (studentRes.status === 'fulfilled' && studentRes.value?.data?.success) {
        const rawStudent = studentRes.value.data.data;
        
        let parentName = rawStudent.parentName || rawStudent.parent_name;
        let parentDetails = {};
        if (rawStudent.parentIds?.length > 0) {
          try {
            const parentRes = await parentAPI.getById(rawStudent.parentIds[0]);
            if (parentRes.data?.success) {
              const p = parentRes.data.data;
              const pName = `${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}`.trim();
              if (!parentName) parentName = pName;
              
              const rel = (p.relationship || '').toLowerCase();
              if (rel === 'father') {
                parentDetails.fatherName = pName;
                parentDetails.fatherPhone = p.phone;
                parentDetails.parentEmail = p.email;
              } else if (rel === 'mother') {
                parentDetails.motherName = pName;
                parentDetails.motherPhone = p.phone;
                parentDetails.parentEmail = p.email;
              } else {
                parentDetails.motherName = pName; // Use mother fields for general guardian
                parentDetails.motherPhone = p.phone;
                parentDetails.guardianEmail = p.email;
                parentDetails.guardianStreet = p.address?.street || '';
              }
            }
          } catch (e) {
            console.warn('Failed to fetch parent details', e);
          }
        }

        const normalizedStudent = {
          ...rawStudent,
          ...parentDetails,
          firstName: rawStudent.firstName || rawStudent.first_name,
          lastName: rawStudent.lastName || rawStudent.last_name,
          admissionNumber: rawStudent.admissionNumber || rawStudent.admission_number,
          dateOfBirth: rawStudent.dateOfBirth || rawStudent.date_of_birth,
          parentName: parentName,
          parentPhone: parentDetails.fatherPhone || parentDetails.motherPhone || rawStudent.parentPhone || rawStudent.parent_phone
        };
        setStudent(normalizedStudent);

        if (normalizedStudent.grade) {
          try {
            const curriculumRes = await courseAPI.getAll({ grade: normalizedStudent.grade });
            if (curriculumRes.data?.success) {
              setCurriculumCount(curriculumRes.data.data.length);
            }
          } catch (e) {
            console.warn('Failed to fetch curriculum count', e);
          }
        }
      }
      if (attendanceRes.status === 'fulfilled' && attendanceRes.value?.data?.success) {
        setAttendance(attendanceRes.value.data.data || []);
      }
      if (gradesRes.status === 'fulfilled' && gradesRes.value?.data?.success) {
        setGrades(gradesRes.value.data.data || []);
      }
    } catch (err) { console.error('Error fetching student data:', err); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => { 
    try { await logout(); } 
    finally { 
      localStorage.removeItem('authToken'); 
      localStorage.removeItem('authUser'); 
      navigate('/login'); 
    } 
  };

  const startEdit = () => {
    setEditFormData({
      firstName: student?.firstName || '',
      lastName: student?.lastName || '',
      dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
      gender: student?.gender || '',
      grade: student?.grade || '',
      section: student?.section || 'A',
      status: student?.status || 'active',
      fatherName: student?.fatherName || student?.father_name || '',
      fatherPhone: student?.fatherPhone || student?.father_phone || '',
      motherName: student?.motherName || student?.mother_name || '',
      motherPhone: student?.motherPhone || student?.mother_phone || '',
      parentEmail: student?.parentEmail || student?.parent_email || student?.email || '',
      guardianEmail: student?.guardianEmail || student?.guardian_email || '',
      guardianStreet: student?.guardianStreet || student?.guardian_street || '',
      address: student?.address || { street: '', city: '', region: '', country: 'Ghana' },
      emergencyContact: student?.emergencyContact || { name: '', relationship: '', phone: '', email: '' },
      medicalInfo: student?.medicalInfo || { bloodType: '', allergies: '', medicalConditions: '' }
    });
    setIsEditing(true);

    const currentGrade = student?.grade;
    if (currentGrade && dbGrades.length > 0) {
      const selectedClass = dbGrades.find(g => g.name === currentGrade || g.id === currentGrade);
      if (selectedClass) {
        setAvailableSections(dbSections.filter(s => s.class_id === selectedClass.id));
      }
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
      
      if (name === 'grade') {
        const selectedClass = dbGrades.find(g => g.name === value || g.id === value);
        if (selectedClass) {
          setAvailableSections(dbSections.filter(s => s.class_id === selectedClass.id));
        } else {
          setAvailableSections([]);
        }
      }
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setError('');
    try {
      await studentAPI.update(id, editFormData);
      
      // Update or Create parent info
      let parentFirstName = '';
      let parentLastName = '';
      let parentEmail = editFormData.parentEmail || editFormData.guardianEmail;
      let parentPhone = '';
      let relationship = 'guardian';

      if (editFormData.fatherName) {
         const names = editFormData.fatherName.trim().split(' ');
         parentFirstName = names[0];
         parentLastName = names.slice(1).join(' ');
         parentPhone = editFormData.fatherPhone;
         relationship = 'father';
      } else if (editFormData.motherName) {
         const names = editFormData.motherName.trim().split(' ');
         parentFirstName = names[0];
         parentLastName = names.slice(1).join(' ');
         parentPhone = editFormData.motherPhone;
         relationship = editFormData.guardianEmail ? 'guardian' : 'mother';
      }

      if (parentFirstName) {
        const parentData = {
          first_name: parentFirstName,
          last_name: parentLastName,
          email: parentEmail,
          phone: parentPhone,
          relationship: relationship,
          address: { street: editFormData.guardianStreet || editFormData.address?.street }
        };

        if (student?.parentIds?.length > 0) {
          await parentAPI.update(student.parentIds[0], parentData).catch(err => console.warn('Failed to update parent:', err));
        } else {
          // No parent linked, so create one and link it to this student
          parentData.students = [id];
          try {
            const newParentRes = await parentAPI.create(parentData);
            if (newParentRes.data?.success) {
              const newParentId = newParentRes.data.data.id;
              await studentAPI.update(id, { parentIds: [newParentId] });
            }
          } catch (err) {
            console.warn('Failed to create and link new parent:', err);
          }
        }
      }

      setSuccess('Student profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setIsEditing(false);
      fetchStudentData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student');
      setTimeout(() => setError(''), 3000);
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}><div className="premium-loader"></div></div>;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ maxWidth: '1600px' }}>
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <button 
                onClick={() => navigate('/students')} 
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
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--brand-slate-50)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <Icons.ArrowLeft />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Records</span>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--brand-slate-300)' }}></div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--brand-slate-500)' }}>#{student?.admissionNumber || 'N/A'}</span>
                </div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--brand-slate-900)', margin: 0, letterSpacing: '-0.02em' }}>
                  {student?.firstName} <span style={{ color: 'var(--brand-green)' }}>{student?.lastName}</span>
                </h1>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="premium-btn-secondary" style={{ backgroundColor: 'white', border: '1px solid var(--brand-slate-200)', boxShadow: 'none' }}>
                    <Icons.X /> Cancel
                  </button>
                  <button onClick={handleSaveEdit} disabled={saving} className="premium-btn-primary">
                    {saving ? <div className="mini-spinner"></div> : <Icons.Check />} Save Changes
                  </button>
                </>
              ) : (
                <button onClick={startEdit} className="premium-btn-primary">
                  <Icons.Edit /> Edit Profile
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
              animation: 'slideDown 0.4s cubic-bezier(0, 0, 0.2, 1)'
            }}>
              <Icons.Check /> {success}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '32px', alignItems: 'start' }}>
            {/* Left Sidebar Card */}
            <div className="glass-card" style={{ padding: '40px 32px', position: 'sticky', top: '110px' }}>
              <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 24px' }}>
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '48px', 
                  backgroundColor: 'var(--brand-green-light)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '48px', 
                  fontWeight: '800', 
                  color: 'var(--brand-green)',
                  border: '4px solid white',
                  boxShadow: '0 10px 25px rgba(0, 132, 62, 0.1)'
                }}>
                  {student?.firstName?.[0]}{student?.lastName?.[0]}
                </div>
                <div style={{ 
                  position: 'absolute', 
                  bottom: '5px', 
                  right: '5px', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '10px', 
                  backgroundColor: student?.status === 'active' ? '#10b981' : '#ef4444',
                  border: '3px solid white',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}></div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--brand-slate-900)', margin: '0 0 8px 0' }}>{student?.firstName} {student?.lastName}</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--brand-slate-500)' }}>{displayGrade(student?.grade)}</span>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--brand-slate-300)' }}></div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--brand-slate-500)' }}>Section {mapSectionName(student?.section || 'A')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid var(--brand-slate-100)', paddingTop: '32px' }}>
                <QuickInfo icon={<Icons.Calendar />} label="Date of Birth" value={student?.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'} />
                <QuickInfo icon={<Icons.MapPin />} label="Location" value={student?.address?.city || 'N/A'} />
                <QuickInfo icon={<Icons.User />} label="Guardian" value={student?.parentName || 'N/A'} />
                <QuickInfo icon={<Icons.Activity />} label="Attendance" value="94%" color="#6366f1" />
              </div>
            </div>

            {/* Main Content Card */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', minHeight: '600px' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', padding: '0 32px', borderBottom: '1px solid var(--brand-slate-100)', backgroundColor: '#fcfdfe' }}>
                {[
                  { id: 'personal', label: 'Personal Details', icon: <Icons.User /> },
                  { id: 'academic', label: 'Academic Journey', icon: <Icons.Award /> },
                  { id: 'medical', label: 'Medical Profile', icon: <Icons.Heart /> }
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
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    <div className="responsive-grid-2" style={{ gap: '32px' }}>
                      <div style={{ gridColumn: 'span 2' }}><SectionTitle title="Basic Information" /></div>
                      <FormGroup label="First Name" name="firstName" value={editFormData.firstName} onChange={handleEditChange} />
                      <FormGroup label="Last Name" name="lastName" value={editFormData.lastName} onChange={handleEditChange} />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="premium-label">Gender</label>
                        <PremiumSelect 
                          value={editFormData.gender}
                          onChange={(e) => handleEditChange({ target: { name: 'gender', value: e.target.value } })}
                          options={[{value:'male', label:'Male'}, {value:'female', label:'Female'}]}
                          placeholder="Select Gender"
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="premium-label">Date of Birth</label>
                        <PremiumDatePicker 
                          value={editFormData.dateOfBirth}
                          onChange={(date) => handleEditChange({ target: { name: 'dateOfBirth', value: date } })}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="premium-label">Grade / Class</label>
                        <PremiumSelect 
                          value={editFormData.grade}
                          onChange={(e) => handleEditChange({ target: { name: 'grade', value: e.target.value } })}
                          options={dbGrades.map(g => ({ value: g.name, label: displayGrade(g.name) }))}
                          placeholder="Select Grade"
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="premium-label">Section</label>
                        <PremiumSelect 
                          value={editFormData.section}
                          onChange={(e) => handleEditChange({ target: { name: 'section', value: e.target.value } })}
                          options={availableSections.map(s => ({ value: s.name, label: s.name }))}
                          placeholder="Select Section"
                        />
                      </div>
                    </div>

                    <div className="responsive-grid-2" style={{ gap: '32px' }}>
                      <div style={{ gridColumn: 'span 2' }}><SectionTitle title="Guardian & Contact" /></div>
                      <div style={{ gridColumn: 'span 2', marginBottom: '-10px' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--brand-green)', textTransform: 'uppercase' }}>Father / Mother Information</h4>
                      </div>
                      <FormGroup label="Father/Mother Name" name="fatherName" value={editFormData.fatherName} onChange={handleEditChange} />
                      <FormGroup label="Father/Mother Phone" name="fatherPhone" value={editFormData.fatherPhone} onChange={handleEditChange} />
                      <FormGroup label="Parent Email" name="parentEmail" value={editFormData.parentEmail} onChange={handleEditChange} />
                      <FormGroup label="Street Address" name="address.street" value={editFormData.address?.street} onChange={handleEditChange} />
                      
                      <div style={{ gridColumn: 'span 2', marginBottom: '-10px', marginTop: '10px' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--brand-green)', textTransform: 'uppercase' }}>Guardian Information</h4>
                      </div>
                      <FormGroup label="Guardian's Name" name="motherName" value={editFormData.motherName} onChange={handleEditChange} />
                      <FormGroup label="Guardian's Phone" name="motherPhone" value={editFormData.motherPhone} onChange={handleEditChange} />
                      <FormGroup label="Guardian Email" name="guardianEmail" value={editFormData.guardianEmail} onChange={handleEditChange} />
                      <FormGroup label="Guardian Address" name="guardianStreet" value={editFormData.guardianStreet} onChange={handleEditChange} />
                      
                      <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                        <SectionTitle title="Additional Details" />
                      </div>
                      <FormGroup label="City" name="address.city" value={editFormData.address?.city} onChange={handleEditChange} />
                      <FormGroup label="Emergency Contact Name" name="emergencyContact.name" value={editFormData.emergencyContact?.name} onChange={handleEditChange} />
                      <FormGroup label="Emergency Contact Phone" name="emergencyContact.phone" value={editFormData.emergencyContact?.phone} onChange={handleEditChange} />
                    </div>

                    <div className="responsive-grid-2" style={{ gap: '32px' }}>
                      <div style={{ gridColumn: 'span 2' }}><SectionTitle title="Medical Information" /></div>
                      <FormGroup label="Blood Group" name="medicalInfo.bloodType" value={editFormData.medicalInfo?.bloodType} onChange={handleEditChange} />
                      <FormGroup label="Allergies" name="medicalInfo.allergies" value={editFormData.medicalInfo?.allergies} onChange={handleEditChange} />
                      <div style={{ gridColumn: 'span 2' }}>
                        <FormGroup label="Medical Conditions" name="medicalInfo.medicalConditions" value={editFormData.medicalInfo?.medicalConditions} onChange={handleEditChange} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    {activeTab === 'personal' && (
                      <div className="responsive-grid-2" style={{ gap: '48px' }}>
                        <DetailBlock label="Gender" value={student?.gender} icon={<Icons.User />} />
                        <DetailBlock label="Date of Birth" value={student?.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'} icon={<Icons.Calendar />} />
                        <DetailBlock label="Home Address" value={student?.address?.street} icon={<Icons.MapPin />} fullWidth />
                        <DetailBlock label="City & Region" value={`${student?.address?.city || ''}, ${student?.address?.region || ''}`} icon={<Icons.MapPin />} />
                        <DetailBlock label="Legal Guardian" value={student?.parentName || 'Unassigned'} icon={<Icons.User />} />
                        <DetailBlock label="Emergency Contact" value={student?.emergencyContact?.name} icon={<Icons.Phone />} />
                        <DetailBlock label="Emergency Phone" value={student?.emergencyContact?.phone} icon={<Icons.Phone />} />
                      </div>
                    )}

                    {activeTab === 'academic' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div className="responsive-grid-3">
                          <StatCard title="Grade Level" value={displayGrade(student?.grade)} icon={<Icons.Award />} color="var(--brand-green)" />
                          <StatCard title="Enrolled Subjects" value={curriculumCount} icon={<Icons.Book />} color="#6366f1" />
                          <StatCard 
                            title="Average Score" 
                            value={grades.length > 0 
                              ? `${(grades.reduce((acc, g) => acc + (parseFloat(g.total_score || g.totalScore || 0)), 0) / grades.length).toFixed(1)}%` 
                              : '0.0%'} 
                            icon={<Icons.Activity />} 
                            color="#f59e0b" 
                          />
                        </div>
                        
                        <div style={{ marginTop: '24px' }}>
                          <SectionTitle title="Institutional Status" />
                          <div style={{ 
                            padding: '24px', 
                            borderRadius: '20px', 
                            backgroundColor: 'var(--brand-slate-50)', 
                            border: '1px solid var(--brand-slate-100)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <p style={{ margin: 0, fontSize: '14px', color: 'var(--brand-slate-500)', fontWeight: '600' }}>Current Enrollment Status</p>
                              <p style={{ margin: '4px 0 0', fontSize: '18px', color: 'var(--brand-slate-900)', fontWeight: '800' }}>Active Scholar</p>
                            </div>
                            <div style={{ padding: '8px 16px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '12px', fontSize: '13px', fontWeight: '800' }}>VERIFIED</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'medical' && (
                      <div className="responsive-grid-2" style={{ gap: '48px' }}>
                        <DetailBlock label="Blood Group" value={student?.medicalInfo?.bloodType} icon={<Icons.Heart />} />
                        <DetailBlock label="Known Allergies" value={student?.medicalInfo?.allergies} icon={<Icons.Activity />} />
                        <DetailBlock label="Medical History" value={student?.medicalInfo?.medicalConditions || 'No recorded conditions'} icon={<Icons.Activity />} fullWidth />
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

// Helper Components
const QuickInfo = ({ icon, label, value, color = 'var(--brand-green)' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ 
      width: '40px', 
      height: '40px', 
      borderRadius: '12px', 
      backgroundColor: 'var(--brand-slate-50)', 
      color: color, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: '1px solid var(--brand-slate-100)'
    }}>{icon}</div>
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

const StatCard = ({ title, value, icon, color }) => (
  <div style={{ 
    padding: '24px', 
    borderRadius: '24px', 
    backgroundColor: 'var(--brand-slate-50)', 
    border: '1px solid var(--brand-slate-100)',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ color: color, marginBottom: '16px', opacity: 0.8 }}>{icon}</div>
    <p style={{ margin: 0, fontSize: '12px', color: 'var(--brand-slate-400)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
    <p style={{ margin: '4px 0 0', fontSize: '24px', color: 'var(--brand-slate-900)', fontWeight: '800', letterSpacing: '-0.02em' }}>{value}</p>
  </div>
);

const SectionTitle = ({ title }) => (
  <h3 style={{ 
    fontSize: '14px', 
    fontWeight: '800', 
    color: 'var(--brand-slate-900)', 
    textTransform: 'uppercase', 
    letterSpacing: '0.1em', 
    margin: '0 0 24px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }}>
    {title}
    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--brand-slate-100)' }}></div>
  </h3>
);

const FormGroup = ({ label, name, value, onChange, type = 'text' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label className="premium-label">{label}</label>
    <input 
      type={type} 
      name={name} 
      value={value || ''} 
      onChange={onChange} 
      className="premium-input"
    />
  </div>
);


export default StudentProfile;
