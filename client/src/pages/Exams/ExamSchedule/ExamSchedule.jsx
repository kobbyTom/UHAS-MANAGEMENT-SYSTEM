import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import PremiumSelect from '../../../components/common/PremiumSelect';
import PremiumDatePicker from '../../../components/common/PremiumDatePicker';
import { examAPI, parentAPI, academicClassesAPI, settingsAPI } from '../../../services/api';
import { useAlert } from '../../../context/AlertContext';

// Premium Icon Components
const Icons = {
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Clock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Book: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  FileText: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
};

const ExamSchedule = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { showAlert } = useAlert();
  const [activeMenu, setActiveMenu] = useState('Exams');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    subject: '', class: '', date: '', time: '', duration: '', venue: ''
  });

  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [dbGrades, setDbGrades] = useState([]);
  const [settings, setSettings] = useState({ currentTerm: '1st', currentSession: '2024/2025' });
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  const isParent = user?.role === 'parent';
  const isAdmin = user?.role === 'admin' || user?.role === 'teacher';

  const [exams, setExams] = useState([]);

  // Extract all available subjects from the classes data
  const allAvailableSubjects = React.useMemo(() => {
    const unique = new Map();
    dbGrades.forEach(g => {
      (g.subjects || []).forEach(sub => {
        if (sub.name && !unique.has(sub.name)) unique.set(sub.name, sub.name);
      });
    });
    return Array.from(unique.values()).sort();
  }, [dbGrades]);

  // Filter available grades based on the selected subject
  const filteredGrades = React.useMemo(() => {
    if (!formData.subject) return dbGrades;
    return dbGrades.filter(g => 
      (g.subjects || []).some(sub => sub.name === formData.subject)
    );
  }, [dbGrades, formData.subject]);

  useEffect(() => {
    fetchMetadata();
  }, [user]);

  useEffect(() => {
    if (selectedTerm && selectedSession) {
      fetchExams();
    }
    if (isParent) fetchLinkedStudents();
  }, [user, selectedChildId, selectedTerm, selectedSession]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = {
        term: selectedTerm,
        academicYear: selectedSession
      };
      const res = await examAPI.getSchedule(params);
      if (res.data?.success) setExams(res.data.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const fetchMetadata = async () => {
    try {
      const [classesRes, settingsRes] = await Promise.all([
        academicClassesAPI.getAll(),
        settingsAPI.getSettings()
      ]);

      if (classesRes.data?.success) setDbGrades(classesRes.data.data);
      
      if (settingsRes.data?.success) {
        const s = settingsRes.data.settings;
        const currentTerm = s.current_term || s.currentTerm || '1st';
        const currentSession = s.current_session || s.currentSession || '2024/2025';
        
        setSettings({ currentTerm, currentSession });
        setSelectedTerm(currentTerm);
        setSelectedSession(currentSession);
      }
    } catch (e) {
      console.error('Metadata fetch error:', e);
    }
  };

  const fetchLinkedStudents = async () => {
    try {
      const res = await parentAPI.getMyChildren();
      if (res.data?.success) {
        setLinkedStudents(res.data.data);
        if (res.data.data.length > 0 && !selectedChildId) {
          setSelectedChildId(res.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching linked students:', error);
    }
  };

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  const filteredExams = exams.filter(exam => {
    if (user?.role === 'student') {
      const studentGrade = (user.grade || '').toLowerCase().trim();
      const examGrade = (exam.class || '').toLowerCase().trim();
      return examGrade === studentGrade;
    } else if (isParent) {
      if (!selectedChildId) return true;
      const child = linkedStudents.find(s => s.id === selectedChildId);
      const childGrade = (child?.grade || '').toLowerCase().trim();
      const examGrade = (exam.class || '').toLowerCase().trim();
      return examGrade === childGrade;
    }
    return true;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        term: selectedTerm,
        academicYear: selectedSession
      };
      
      let res;
      if (editId) {
        res = await examAPI.updateSchedule(editId, payload);
      } else {
        res = await examAPI.createSchedule(payload);
      }
      
      if (res.data?.success) {
        setShowModal(false);
        setEditId(null);
        setFormData({ subject: '', class: '', date: '', time: '', duration: '', venue: '' });
        fetchExams();
        showAlert({
          title: editId ? 'Schedule Updated' : 'Schedule Synchronized',
          message: editId ? 'The examination event has been successfully updated.' : 'The new examination event has been successfully logged into the institutional calendar.',
          type: 'success'
        });
      }
    } catch (e) {
      showAlert({
        title: 'Sync Failure',
        message: 'Failed to record the examination session. Please verify network connectivity.',
        type: 'error'
      });
    }
  };

  const handleEdit = (exam) => {
    setEditId(exam._id || exam.id);
    setFormData({
      subject: exam.subject || '',
      class: exam.class || '',
      date: exam.date || '',
      time: exam.time || '',
      duration: exam.duration || '',
      venue: exam.venue || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    showAlert({
      title: 'Terminate Session',
      message: 'Are you sure you want to expunge this examination event from the official log? This action cannot be reversed.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await examAPI.deleteSchedule(id);
          fetchExams();
        } catch (e) {
          showAlert({
            title: 'System Error',
            message: 'An anomaly occurred during the deletion protocol.',
            type: 'error'
          });
        }
      }
    });
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Institutional Calendar</span>
            <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{selectedSession} Log</span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>{selectedTerm?.toUpperCase()} <span style={{ color: 'var(--brand-green)' }}>TERM SCHEDULE</span></h1>
          <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Manage and coordinate institutional examination dates and venues.</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <button 
            onClick={() => { setEditId(null); setFormData({ subject: '', class: '', date: '', time: '', duration: '', venue: '' }); setShowModal(true); }}
            className="premium-btn-primary"
          >
            <Icons.Plus />
            Create Session
          </button>
        )}
      </div>


      {/* Schedule Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', backgroundColor: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '28px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{selectedTerm?.toUpperCase()} EXAMINATION LOGISTICS</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>Official coordination of assessment events for {selectedSession}.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <PremiumSelect 
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              options={[
                { value: '2023/2024', label: '2023/2024' },
                { value: '2024/2025', label: '2024/2025' }
              ]}
              style={{ minWidth: '140px' }}
            />
            <PremiumSelect 
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              options={[
                { value: '1st', label: '1ST TERM' },
                { value: '2nd', label: '2ND TERM' },
                { value: '3rd', label: '3RD TERM' }
              ]}
              style={{ minWidth: '130px' }}
            />
            {isParent && linkedStudents.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="premium-label" style={{ fontSize: '11px' }}>Filter Scholar:</span>
                <PremiumSelect 
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  options={linkedStudents.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))}
                  placeholder="Select Scholar"
                  style={{ minWidth: '180px' }}
                />
              </div>
            )}
            <button className="premium-btn-secondary" style={{ padding: '8px 20px', fontSize: '13px' }}>Export PDF</button>
          </div>
        </div>
        <div style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#ffffff' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Curriculum Scope</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Temporal Alignment</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Session Span</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Geographic Node</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Operational Status</th>
                {isAdmin && <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '100px 40px' }}>
                    <div style={{ color: '#e2e8f0', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}><Icons.Calendar /></div>
                    <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>No Assignments Logged</p>
                    <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>There are no examination events registered for this criteria.</p>
                  </td>
                </tr>
              ) : filteredExams.map((exam) => (
                <tr key={exam.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#ffffff', color: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9' }}>
                        <Icons.Book />
                      </div>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>{exam.subject}</p>
                        <p style={{ fontSize: '12px', color: 'var(--brand-green)', margin: '4px 0 0', fontWeight: '800', textTransform: 'uppercase' }}>{exam.class}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#0f172a', fontWeight: '800' }}>
                        <span style={{ color: 'var(--brand-green)' }}><Icons.Calendar /></span> {exam.date}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        <Icons.Clock /> {exam.time}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569', fontWeight: '800' }}>{exam.duration}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>
                      <span style={{ color: '#64748b' }}><Icons.MapPin /></span> {exam.venue}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', backgroundColor: '#ecfdf5', color: '#10b981', border: '1px solid #d1fae5' }}>{exam.status}</span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '20px 24px', display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleEdit(exam)}
                        style={{ background: '#fefce8', border: '1px solid #fef08a', color: '#a16207', borderRadius: '8px', cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800' }}
                        title="Edit Session"
                      >
                        <Icons.FileText /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(exam._id || exam.id)}
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800' }}
                        title="Delete Session"
                      >
                        <Icons.X /> Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}

            </tbody>
          </table>
          {loading && (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div className="premium-loader" style={{ width: '48px', height: '48px', border: '5px solid #f1f5f9', borderTop: '5px solid var(--brand-green)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
              <p style={{ marginTop: '16px', color: '#64748b', fontWeight: '600' }}>Synchronizing Schedule Matrix...</p>
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ width: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{editId ? 'Update Assessment' : 'New Assessment'}</h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>{editId ? 'Modify an existing examination event.' : 'Register a new examination event into the institutional log.'}</p>
              </div>
              <button onClick={() => { setShowModal(false); setEditId(null); }} className="premium-close-btn">
                <Icons.X />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label className="premium-label">Subject Identification</label>
                <PremiumSelect 
                  name="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value, class: '' }))}
                  options={allAvailableSubjects.map(s => ({ value: s, label: s }))}
                  placeholder="Select Subject"
                />
              </div>
              
              <div className="responsive-grid-2" style={{ marginBottom: '24px' }}>
                <div>
                  <label className="premium-label">Academic Level</label>
                  <PremiumSelect 
                    name="class"
                    value={formData.class}
                    onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                    options={filteredGrades.map(g => ({ value: g.name, label: g.name }))}
                    placeholder="Select Level"
                  />
                </div>
                <div>
                  <label className="premium-label">Scheduled Date</label>
                  <PremiumDatePicker 
                    value={formData.date}
                    onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                  />
                </div>
              </div>

              <div className="responsive-grid-2" style={{ marginBottom: '24px' }}>
                <div>
                  <label className="premium-label">Deployment Time</label>
                  <input type="time" name="time" className="premium-input" value={formData.time} onChange={handleInputChange} required />
                </div>
                <div>
                  <label className="premium-label">Session Duration</label>
                  <input type="text" name="duration" className="premium-input" value={formData.duration} onChange={handleInputChange} placeholder="e.g. 120 Minutes" />
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label className="premium-label">Examination Venue</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" name="venue" className="premium-input" value={formData.venue} onChange={handleInputChange} placeholder="e.g. Grand Auditorium" style={{ paddingLeft: '44px' }} />
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icons.MapPin /></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button type="submit" className="premium-btn-primary" style={{ flex: 1, padding: '16px', fontSize: '15px' }}>{editId ? 'Update Schedule' : 'Sync Schedule'}</button>
                <button type="button" onClick={() => { setShowModal(false); setEditId(null); }} style={{ padding: '16px 28px', backgroundColor: 'var(--brand-slate-100)', color: 'var(--brand-slate-600)', border: 'none', borderRadius: '16px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}


      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </>
  );
};

const FormGroup = ({ label, name, value, onChange, type = 'text', options = [], placeholder, required = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{label} {required && '*'}</label>
    {type === 'select' ? (
      <select name={name} value={value} onChange={onChange} required={required} style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', backgroundColor: 'white', outline: 'none' }}>
        <option value="">Select Class</option>
        {options.map(opt => <option key={opt.v} value={opt.v}>{opt.l}</option>)}
      </select>
    ) : (
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none' }} />
    )}
  </div>
);

export default ExamSchedule;
