import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Filter,
  Search,
  MoreVertical,
  ChevronRight,
  AlertCircle,
  Users,
  Download,
  Upload,
  ArrowRight
} from 'lucide-react';
import { assignmentAPI, courseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PremiumSelect from '../../components/common/PremiumSelect';

const Assignments = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Assignments');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [courses, setCourses] = useState([]);

  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const studentId = user?.studentId || user?.id;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [asgRes, courseRes] = await Promise.all([
        isTeacher ? assignmentAPI.getByTeacher(user.id) : assignmentAPI.getByStudent(studentId),
        isTeacher ? courseAPI.getByTeacher(user.id) : courseAPI.getAll({ grade: user.grade })
      ]);

      setAssignments(asgRes.data?.data || []);
      setCourses(courseRes.data?.data || []);
    } catch (error) {
      console.error('Task Retrieval Failure:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchesSearch = a.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           a.subject?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filter === 'All') return matchesSearch;
      if (filter === 'Active') return matchesSearch && new Date(a.dueDate) > new Date();
      if (filter === 'Submitted') {
        const submission = a.submissions?.find(s => s.student === studentId);
        return matchesSearch && !!submission;
      }
      if (filter === 'Pending') {
        const submission = a.submissions?.find(s => s.student === studentId);
        return matchesSearch && !submission;
      }
      return matchesSearch;
    });
  }, [assignments, searchTerm, filter, studentId]);

  const stats = useMemo(() => {
    const total = assignments.length;
    const submitted = assignments.filter(a => a.submissions?.some(s => s.student === studentId)).length;
    const pending = total - submitted;
    return { total, submitted, pending };
  }, [assignments, studentId]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
        {/* Animated Background Blobs */}
        <div style={{ position: 'fixed', top: '10%', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(0, 132, 62, 0.05) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0, animation: 'blobFloat 20s infinite alternate' }}></div>
        <div style={{ position: 'fixed', bottom: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255, 184, 28, 0.05) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)', zIndex: 0, animation: 'blobFloat 15s infinite alternate-reverse' }}></div>

        <main style={{ padding: '0', animation: 'fadeIn 0.5s ease-out' }}>
          <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green)', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Academic Ledger</span>
                <span style={{ color: '#94a3b8' }}><ChevronRight size={12} strokeWidth={3} /></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Task Registry</span>
              </div>
              <h1 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-2px' }}>
                Scholar <span style={{ color: 'var(--brand-green)' }}>Assignments</span>
              </h1>
              <p style={{ fontSize: '17px', color: '#64748b', marginTop: '10px', fontWeight: '500' }}>
                Centralized dispatch and management of institutional deliverables.
              </p>
            </div>

            {isTeacher && (
              <button 
                onClick={() => navigate('/assignments/create')}
                className="premium-btn-primary" 
                style={{ padding: '16px 28px' }}
              >
                <Plus size={20} /> Dispatch New Task
              </button>
            )}
          </header>

          {/* Stats Dashboard */}
          <div className="responsive-grid-3" style={{ marginBottom: '40px' }}>
            {[
              { label: 'Total Dispatched', value: stats.total, icon: <FileText size={24} />, color: '#0f172a', bg: 'white' },
              { label: 'Pending Nodes', value: stats.pending, icon: <Clock size={24} />, color: '#ea580c', bg: '#fff7ed' },
              { label: 'Verified Submissions', value: stats.submitted, icon: <CheckCircle2 size={24} />, color: 'var(--brand-green)', bg: 'var(--brand-green-soft)' }
            ].map((stat, i) => (
              <div key={i} className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.02)' }}>
                  {stat.icon}
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{stat.label}</p>
                  <p style={{ fontSize: '28px', fontWeight: '1000', color: '#0f172a', margin: 0 }}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="responsive-layout-wrapper" style={{ gap: '32px' }}>
            <aside>
              <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <Filter size={18} color="var(--brand-green)" /> Task Filters
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['All', 'Active', 'Pending', 'Submitted', 'Graded'].map(item => (
                    <button 
                      key={item}
                      onClick={() => setFilter(item)}
                      style={{
                        textAlign: 'left',
                        padding: '14px 18px',
                        borderRadius: '14px',
                        border: 'none',
                        backgroundColor: filter === item ? 'var(--brand-green-soft)' : 'transparent',
                        color: filter === item ? 'var(--brand-green)' : '#64748b',
                        fontWeight: filter === item ? '900' : '700',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '14px'
                      }}
                    >
                      {item}
                      {filter === item && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--brand-green)' }} />}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Curriculum Insights</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', fontWeight: '600' }}>
                    Ensure all tasks are submitted prior to the deadline to maintain a high academic fidelity score.
                  </p>
                </div>
              </div>
            </aside>

            <section>
              <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="Search by title or subject node..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '16px 16px 16px 56px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #f1f5f9',
                      borderRadius: '16px',
                      fontSize: '15px',
                      fontWeight: '600',
                      outline: 'none',
                      transition: 'all 0.3s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--brand-green-light)'}
                    onBlur={e => e.target.style.borderColor = '#f1f5f9'}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gap: '20px' }}>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} style={{ height: '120px', backgroundColor: 'white', borderRadius: '24px', animation: 'pulse 1.5s infinite' }} />
                  ))
                ) : filteredAssignments.length === 0 ? (
                  <div style={{ padding: '100px', textAlign: 'center', background: 'white', borderRadius: '32px', border: '1.5px dashed #e2e8f0' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <AlertCircle size={40} color="#94a3b8" />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>No tasks discovered</h3>
                    <p style={{ color: '#64748b', marginTop: '8px', fontWeight: '600' }}>Adjust your filters or check back later for new dispatches.</p>
                  </div>
                ) : filteredAssignments.map(assignment => {
                  const submission = assignment.submissions?.find(s => s.student === studentId);
                  const isSubmitted = !!submission;
                  const isOverdue = new Date(assignment.dueDate) < new Date() && !isSubmitted;

                  return (
                    <div key={assignment.id} className="assignment-card-nexus" style={{
                      background: 'white',
                      borderRadius: '24px',
                      padding: '28px',
                      border: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <div style={{ 
                          width: '64px', 
                          height: '64px', 
                          borderRadius: '18px', 
                          background: isSubmitted ? 'var(--brand-green-soft)' : isOverdue ? '#fef2f2' : '#ffffff', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: isSubmitted ? 'var(--brand-green)' : isOverdue ? '#ef4444' : '#64748b',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.02)'
                        }}>
                          {isSubmitted ? <CheckCircle2 size={28} /> : <FileText size={28} />}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <h4 style={{ fontSize: '19px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{assignment.title}</h4>
                            {isOverdue && <span style={{ padding: '2px 8px', backgroundColor: '#fef2f2', color: '#ef4444', fontSize: '10px', fontWeight: '900', borderRadius: '6px', textTransform: 'uppercase' }}>Overdue</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <BookOpen size={14} color="var(--brand-green)" /> {assignment.subject || courses.find(c => c.id === (assignment.course_id || assignment.course))?.name || 'Academic Node'}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Users size={14} color="#8b5cf6" /> {`${assignment.grade || assignment.class || 'All Classes'} ${assignment.section || ''}`.trim()}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: isOverdue ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={14} color={isOverdue ? '#ef4444' : '#0284c7'} /> Due: {new Date(assignment.dueDate || assignment.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: '900', 
                            padding: '4px 12px', 
                            borderRadius: '20px',
                            backgroundColor: assignment.priority === 'High' ? '#fef2f2' : '#ffffff',
                            color: assignment.priority === 'High' ? '#ef4444' : '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {assignment.priority || 'Normal'} Priority
                          </span>
                          <div style={{ fontSize: '13px', fontWeight: '800', marginTop: '6px', color: isSubmitted ? 'var(--brand-green)' : '#0f172a' }}>
                            {isSubmitted ? 'SUBMITTED' : 'NOT SUBMITTED'}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {assignment.fileUrl && (
                            <button className="premium-btn-secondary" style={{ padding: '12px' }}>
                              <Download size={18} />
                            </button>
                          )}
                          <button 
                            className={isSubmitted ? "premium-btn-secondary" : "premium-btn-primary"}
                            style={{ padding: '12px 24px', fontSize: '14px' }}
                            onClick={() => navigate(`/assignments/${assignment.id}`)}
                          >
                            {isSubmitted ? 'View Details' : 'Resolve Task'} <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>

      <style>{`
        @keyframes blobFloat {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 40px) scale(1.1); }
          100% { transform: translate(40px, -20px) scale(1); }
        }
        
        .assignment-card-nexus:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
          border-color: var(--brand-green-light);
        }

        .premium-input:focus {
          border-color: var(--brand-green) !important;
          box-shadow: 0 0 0 4px var(--brand-green-soft);
        }
      `}</style>
    </div>
  );
};

export default Assignments;
