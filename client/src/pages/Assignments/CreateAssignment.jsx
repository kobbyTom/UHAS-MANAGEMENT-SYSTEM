import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  BookOpen, 
  Type, 
  Layers, 
  AlertCircle,
  CheckCircle2,
  Paperclip,
  ChevronRight,
  X
} from 'lucide-react';
import { assignmentAPI, teacherAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PremiumSelect from '../../components/common/PremiumSelect';

const CreateAssignment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    grade: '',
    section: '',
    dueDate: '',
    assignmentType: 'homework',
    maxScore: 100,
    instructions: '',
    isPublished: true
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await teacherAPI.getMyCourses();
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.course) newErrors.course = 'Course selection is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    if (!formData.description) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const selectedCourse = courses.find(c => c.id === formData.course);
      const payload = {
        ...formData,
        grade: selectedCourse?.grade || formData.grade,
        section: selectedCourse?.section || formData.section
      };

      const response = await assignmentAPI.create(payload);
      if (response.data.success) {
        navigate('/assignments');
      }
    } catch (error) {
      console.error('Failed to create assignment:', error);
      if (error.response && error.response.data) {
        console.error('[SECURITY DEBUG PAYLOAD]:', JSON.stringify(error.response.data, null, 2));
      }
      setErrors({ submit: error.response?.data?.message || 'Failed to dispatch assignment.' });
    } finally {
      setLoading(false);
    }
  };

  const assignmentTypes = [
    { value: 'homework', label: 'Standard Homework' },
    { value: 'quiz', label: 'Assessment Quiz' },
    { value: 'project', label: 'Long-term Project' },
    { value: 'exam', label: 'Mid-term/Final Exam' }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
        {/* Animated Background Blobs */}
        <div style={{ position: 'fixed', top: '10%', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(0, 132, 62, 0.05) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }}></div>
        <div style={{ position: 'fixed', bottom: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255, 184, 28, 0.05) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)', zIndex: 0 }}></div>

        <main style={{ position: 'relative', zIndex: 1 }}>
          <header style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ padding: '4px 12px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green)', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Task Registry</span>
              <span style={{ color: '#94a3b8' }}><ChevronRight size={12} strokeWidth={3} /></span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>New Protocol Initialization</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-2px' }}>
                  Dispatch <span style={{ color: 'var(--brand-green)' }}>New Task</span>
                </h1>
                <p style={{ fontSize: '17px', color: '#64748b', marginTop: '10px', fontWeight: '500' }}>
                  Initialize an advanced academic deliverable for scholar assessment.
                </p>
              </div>
              <button 
                onClick={() => navigate('/assignments')}
                className="premium-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
              >
                <ArrowLeft size={18} /> Back to Registry
              </button>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
            <section>
              <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  
                  {/* Basic Information */}
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Type size={18} />
                      </div>
                      Task Details
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>Task Title</label>
                        <input 
                          type="text"
                          placeholder="e.g., Advanced Calculus - Differentiation Node"
                          style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1.5px solid #f1f5f9', backgroundColor: '#ffffff', fontSize: '15px', fontWeight: '600', outline: 'none', transition: 'all 0.3s' }}
                          value={formData.title}
                          onChange={e => setFormData({...formData, title: e.target.value})}
                        />
                        {errors.title && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', fontWeight: '700' }}>{errors.title}</p>}
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>Detailed Description</label>
                        <textarea 
                          placeholder="Provide a comprehensive summary of the task objectives..."
                          style={{ width: '100%', minHeight: '160px', padding: '16px 20px', borderRadius: '12px', border: '1.5px solid #f1f5f9', backgroundColor: '#ffffff', fontSize: '15px', fontWeight: '500', outline: 'none', transition: 'all 0.3s', lineHeight: '1.6' }}
                          value={formData.description}
                          onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                        {errors.description && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', fontWeight: '700' }}>{errors.description}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Selection */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Target Course</label>
                      <PremiumSelect 
                        value={formData.course}
                        onChange={e => setFormData({...formData, course: e.target.value})}
                        options={courses.map(c => ({ value: c.id, label: `${c.name} (${c.grade}${c.section})` }))}
                        placeholder="Select course"
                        icon={<BookOpen size={18} />}
                      />
                      {errors.course && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', fontWeight: '700' }}>{errors.course}</p>}
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Category</label>
                      <PremiumSelect 
                        value={formData.assignmentType}
                        onChange={e => setFormData({...formData, assignmentType: e.target.value})}
                        options={assignmentTypes}
                        placeholder="Select category"
                        icon={<Layers size={18} />}
                      />
                    </div>
                  </div>

                  {/* Deadline & Score */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Due Date</label>
                      <input 
                        type="date"
                        style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1.5px solid #f1f5f9', backgroundColor: '#ffffff', fontSize: '15px', fontWeight: '600', outline: 'none' }}
                        value={formData.dueDate}
                        onChange={e => setFormData({...formData, dueDate: e.target.value})}
                      />
                      {errors.dueDate && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', fontWeight: '700' }}>{errors.dueDate}</p>}
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Max Score</label>
                      <input 
                        type="number"
                        style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1.5px solid #f1f5f9', backgroundColor: '#ffffff', fontSize: '15px', fontWeight: '600', outline: 'none' }}
                        value={formData.maxScore}
                        onChange={e => setFormData({...formData, maxScore: e.target.value})}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                    <button 
                      type="button" 
                      onClick={() => navigate('/assignments')}
                      className="premium-btn-secondary" 
                      style={{ padding: '14px 28px' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="premium-btn-primary" 
                      style={{ padding: '14px 36px', display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                      {loading ? 'Transmitting...' : 'Dispatch Task'} <Send size={18} />
                    </button>
                  </div>

                  {errors.submit && (
                    <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
                      <AlertCircle size={20} />
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>{errors.submit}</p>
                    </div>
                  )}
                </div>
              </form>
            </section>

            <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '1px' }}>Guidelines</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    "Ensure clear instructions.",
                    "Adhere to term calendar.",
                    "Use max score for analytics."
                  ].map((text, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <CheckCircle2 size={16} color="var(--brand-green)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: '500', lineHeight: '1.5' }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                <Paperclip size={32} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Attachments</p>
                
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(formData.attachments || []).map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{file.filename || file.name || 'Attachment'}</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          const newAtt = [...(formData.attachments || [])];
                          newAtt.splice(idx, 1);
                          setFormData({...formData, attachments: newAtt});
                        }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <input 
                  type="file" 
                  id="attachment-upload" 
                  style={{ display: 'none' }} 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    try {
                      setLoading(true);
                      const uploadData = new FormData();
                      uploadData.append('file', file);
                      
                      const response = await assignmentAPI.upload(uploadData);
                      if (response.data?.success) {
                        setFormData(prev => ({
                          ...prev,
                          attachments: [...(prev.attachments || []), { 
                            url: response.data.data.url, 
                            filename: response.data.data.filename || file.name,
                            mimetype: response.data.data.mimetype || file.type
                          }]
                        }));
                      }
                    } catch (error) {
                      console.error('Upload failed:', error);
                      setErrors({ submit: 'Failed to upload attachment.' });
                    } finally {
                      setLoading(false);
                      e.target.value = ''; // Reset input
                    }
                  }}
                />
                <button 
                  type="button" 
                  className="premium-btn-secondary" 
                  onClick={() => document.getElementById('attachment-upload').click()}
                  disabled={loading}
                  style={{ marginTop: '16px', fontSize: '12px', padding: '8px 16px', width: '100%' }}
                >
                  {loading ? 'Uploading...' : 'Browse'}
                </button>
              </div>
            </aside>
          </div>
        </main>
    </div>
  );
};

export default CreateAssignment;
