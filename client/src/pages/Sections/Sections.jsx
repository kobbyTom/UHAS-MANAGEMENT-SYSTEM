import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { academicClassesAPI, academicSectionsAPI, studentAPI, teacherAPI, settingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PremiumSelect from '../../components/common/PremiumSelect';
import { mapSectionName } from '../../utils/sectionHelper';

const normalizeGrade = (g) => {
  if (!g) return '';
  let str = g.toString().toLowerCase().trim();
  if (str.includes('basic 7') || str === 'basic7') return 'jhs1';
  if (str.includes('basic 8') || str === 'basic8') return 'jhs2';
  if (str.includes('basic 9') || str === 'basic9') return 'jhs3';
  if (str.startsWith('basic')) {
    const num = str.replace('basic', '').trim();
    if (['1', '2', '3', '4', '5', '6'].includes(num)) return `primary${num}`;
  }
  return str.replace(/\s+/g, '');
};

const displayGrade = (g) => {
  if (!g) return 'N/A';
  let str = g.toString().trim();
  const primaryMatch = str.match(/^Primary\s*([1-6])$/i);
  if (primaryMatch) return `Basic ${primaryMatch[1]}`;
  return str;
};

const Sections = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Academic');
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [masterFormData, setMasterFormData] = useState({ class_master_id: '' });
  const [saving, setSaving] = useState(false);
  const [currentSession, setCurrentSession] = useState('2024-2025 Session');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, sectionsRes, studentsRes, teachersRes, settingsRes] = await Promise.all([
        academicClassesAPI.getAll(),
        academicSectionsAPI.getAll(),
        studentAPI.getAll({ limit: 2000 }),
        teacherAPI.getAll({ limit: 500 }),
        settingsAPI.getSettings().catch(() => null)
      ]);
      setClasses(classesRes.data?.data || []);
      setSections(sectionsRes.data?.data || []);
      setAllStudents(studentsRes.data?.data || []);
      setTeachers(teachersRes.data?.data || []);
      const settingsData = settingsRes?.data?.settings || settingsRes?.data?.data || settingsRes?.data;
      if (settingsData && settingsData.current_session) {
        setCurrentSession(`${settingsData.current_session} Session`);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const stats = useMemo(() => {
    const totalAssigned = allStudents.filter(s => s.section).length;
    return {
      totalClasses: classes.length,
      totalSections: sections.length,
      unassignedCount: allStudents.length - totalAssigned,
      assignedPercent: allStudents.length ? Math.round((totalAssigned / allStudents.length) * 100) : 0
    };
  }, [classes, sections, allStudents]);

  const openRosterModal = (section) => {
    setSelectedSection(section);
    const cls = classes.find(c => c.id === section.class_id);
    const assignedIds = allStudents
      .filter(s => normalizeGrade(s.grade) === normalizeGrade(cls?.name) && s.section === section.name)
      .map(s => s.id);
    setSelectedStudentIds(assignedIds);
    setShowRosterModal(true);
  };

  const handleRosterUpdate = async () => {
    setSaving(true);
    try {
      const cls = classes.find(c => c.id === selectedSection.class_id);
      await Promise.all(selectedStudentIds.map(async (studentId) => {
        await studentAPI.update(studentId, { grade: cls.name, section: selectedSection.name });
      }));
      await fetchData();
      setShowRosterModal(false);
    } catch (e) { alert('Roster sync failed'); }
    finally { setSaving(false); }
  };

  const handleMasterSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await academicSectionsAPI.update(selectedSection.id, masterFormData);
      await fetchData();
      setShowMasterModal(false);
    } catch (e) { alert('Master assignment failed'); }
    finally { setSaving(false); }
  };

  const getTeacherName = (id) => {
    const t = teachers.find(t => t.id === id);
    return t ? `${t.firstName || t.first_name} ${t.lastName || t.last_name}` : 'Awaiting Nomination';
  };

  const handleLogout = async () => { try { await logout(); } finally { navigate('/login'); } };

  const currentGradeName = classes.find(c => c.id === selectedSection?.class_id)?.name;
  const filteredStudents = allStudents.filter(s => normalizeGrade(s.grade) === normalizeGrade(currentGradeName));

  return (
    <>
      <main>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Institutional Flow</span>
              <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Academic Hierarchy</span>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Class <span style={{ color: 'var(--brand-green)' }}>Divisions</span></h1>
            <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Coordination scholar rosters and divisional leadership across academic tiers.</p>
          </div>
        </div>

        <div className="responsive-grid-3" style={{ marginBottom: '32px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <p className="premium-label" style={{ marginBottom: '12px' }}>Academic Tiers</p>
            <p style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{stats.totalClasses}</p>
            <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--brand-green)', borderRadius: '2px', marginTop: '16px' }}></div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <p className="premium-label" style={{ marginBottom: '12px' }}>Active Sections</p>
            <p style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{stats.totalSections}</p>
            <div style={{ width: '40px', height: '4px', backgroundColor: '#3b82f6', borderRadius: '2px', marginTop: '16px' }}></div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <p className="premium-label" style={{ marginBottom: '12px' }}>Allocation Rate</p>
            <p style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{stats.assignedPercent}%</p>
            <div style={{ width: '40px', height: '4px', backgroundColor: '#facc15', borderRadius: '2px', marginTop: '16px' }}></div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}><div className="premium-loader"></div></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px' }}>
            {classes.map(cls => {
              const tierSections = sections.filter(s => s.class_id === cls.id);
              const tierScholars = allStudents.filter(st => normalizeGrade(st.grade) === normalizeGrade(cls.name)).length;
              return (
                <div key={cls.id} className="glass-card class-node">
                  <div className="node-header">
                    <div className="node-icon">{cls.name.charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <h3 className="node-title">{displayGrade(cls.name)}</h3>
                      <div className="master-assignment">
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Academic Tier Configuration</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div className="session-badge">{currentSession}</div>
                    </div>
                  </div>

                  <div className="node-content">
                    <div className="content-segment">
                      <div className="segment-header">
                        <span className="segment-label">Divisional Sections</span>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--brand-green)' }}>{tierSections.length} Sections</span>
                      </div>
                      <div className="pill-container">
                        {tierSections.length > 0 ? tierSections.map(section => {
                          const count = allStudents.filter(st => normalizeGrade(st.grade) === normalizeGrade(cls.name) && st.section === section.name).length;
                          return (
                            <div key={section.id} className="section-pill-container" onClick={() => openRosterModal(section)}>
                              <span className="glass-pill section-pill">Section {mapSectionName(section.name)} <span style={{ opacity: 0.6, marginLeft: '4px' }}>({count})</span></span>
                              <div className="section-master-hint" onClick={(e) => { e.stopPropagation(); setSelectedSection(section); setMasterFormData({ class_master_id: section.class_master_id || '' }); setShowMasterModal(true); }}>
                                {getTeacherName(section.class_master_id)}
                              </div>
                            </div>
                          );
                        }) : <span className="empty-state">No divisions configured</span>}
                      </div>
                    </div>

                    <div className="content-segment" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                      <div className="segment-header">
                        <span className="segment-label">Allocation Metrics</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '24px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>{tierScholars}</span>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Scholars</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>{Math.round((tierScholars / (tierSections.length * 40 || 1)) * 100)}%</span>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Density</span>
                          </div>
                        </div>
                        <div style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', fontSize: '11px', fontWeight: '800', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          Active Node
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Roster Modal */}
      {showRosterModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ width: '850px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h3 className="modal-title">Division Roster</h3>
                <p className="modal-subtitle">{displayGrade(currentGradeName)} • Section {mapSectionName(selectedSection?.name)}</p>
              </div>
              <button onClick={() => setShowRosterModal(false)} className="premium-close-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            
            <div style={{ maxHeight: '50vh', overflowY: 'auto', border: '1.5px solid var(--brand-slate-100)', borderRadius: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, background: 'var(--brand-slate-50)', zIndex: 1 }}>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Node</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Scholar Identity</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Admission</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.id} 
                        style={{ cursor: 'pointer', transition: '0.2s', backgroundColor: selectedStudentIds.includes(s.id) ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }} 
                        onClick={() => {
                          setSelectedStudentIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]);
                        }}>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--brand-slate-50)' }}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s',
                          backgroundColor: selectedStudentIds.includes(s.id) ? 'var(--brand-green)' : 'transparent',
                          borderColor: selectedStudentIds.includes(s.id) ? 'var(--brand-green)' : '#e2e8f0'
                        }}></div>
                      </td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--brand-slate-50)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px' }}>{s.firstName?.charAt(0)}</div>
                          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>{s.first_name || s.firstName} {s.last_name || s.lastName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--brand-slate-50)', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>{s.admissionNumber || 'PENDING'}</td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--brand-slate-50)' }}>
                        <span style={{ 
                          fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', 
                          background: s.section ? '#ecfdf5' : '#f1f5f9', 
                          color: s.section ? '#059669' : '#94a3b8' 
                        }}>{s.section ? `Section ${mapSectionName(s.section)}` : 'Unallocated'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="modal-footer" style={{ marginTop: '40px' }}>
              <button onClick={handleRosterUpdate} disabled={saving} className="premium-btn-primary" style={{ flex: 2 }}>{saving ? 'Synchronizing...' : 'Commit Changes'}</button>
              <button onClick={() => setShowRosterModal(false)} className="premium-btn-secondary" style={{ flex: 1 }}>Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* Master Modal */}
      {showMasterModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ width: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h3 className="modal-title">Section Leadership</h3>
                <p className="modal-subtitle">Assign Master for {displayGrade(currentGradeName)} - {mapSectionName(selectedSection?.name)}</p>
              </div>
              <button onClick={() => setShowMasterModal(false)} className="premium-close-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={handleMasterSubmit}>
              <div style={{ marginBottom: '32px' }}>
                <label className="premium-label">Nominate Faculty Lead</label>
                <PremiumSelect 
                  value={masterFormData.class_master_id} 
                  onChange={(e) => setMasterFormData({ class_master_id: e.target.value })}
                  options={teachers.map(t => ({ value: t.id, label: `${t.firstName || t.first_name} ${t.lastName || t.last_name}` }))}
                  placeholder="Awaiting Nomination"
                />
              </div>
              <div className="modal-footer">
                <button type="submit" disabled={saving} className="premium-btn-primary" style={{ flex: 2 }}>{saving ? 'Processing...' : 'Confirm Appointment'}</button>
                <button type="button" onClick={() => setShowMasterModal(false)} className="premium-btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        
        :root {
          --brand-green: #00843e;
          --brand-slate-50: #ffffff;
          --brand-slate-100: #f1f5f9;
          --brand-slate-200: #e2e8f0;
          --brand-slate-400: #94a3b8;
          --brand-slate-500: #64748b;
          --brand-slate-900: #0f172a;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .class-node:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 20px 50px rgba(0, 132, 62, 0.05);
          border-color: rgba(0, 132, 62, 0.2);
        }

        .node-header {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid var(--brand-slate-50);
        }

        .node-icon {
          width: 54px;
          height: 54px;
          background: linear-gradient(135deg, var(--brand-green), #10b981);
          color: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 20px;
          box-shadow: 0 8px 20px rgba(0, 132, 62, 0.2);
        }

        .node-title {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .master-assignment {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }

        .session-badge {
          font-size: 10px;
          font-weight: 800;
          padding: 4px 10px;
          background: var(--brand-slate-50);
          color: var(--brand-slate-500);
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .node-content { padding: 24px; }
        .content-segment { margin-bottom: 24px; }
        .content-segment:last-child { margin-bottom: 0; }

        .segment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .segment-label {
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .division-pill-card { 
          background: var(--brand-slate-50); 
          border-radius: 16px; 
          border: 1px solid transparent; 
        }
        .pill-container { display: flex; gap: 12px; flex-wrap: wrap; }
        .section-pill-container { display: flex; flex-direction: column; gap: 4px; cursor: pointer; transition: all 0.2s; }
        .section-pill-container:hover { transform: translateY(-2px); }
        .section-master-hint {
          font-size: 10px; font-weight: 700; color: #94a3b8; padding-left: 4px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;
        }
        .empty-state { font-size: 12px; color: #94a3b8; font-style: italic; }
        .pill-main { 
          padding: 16px 20px; 
          cursor: pointer; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          border-bottom: 1px solid rgba(0,0,0,0.02); 
        }
        .pill-name { font-size: 15px; font-weight: 900; color: var(--brand-slate-900); }
        .pill-stat { font-size: 11px; font-weight: 700; color: var(--brand-slate-500); }
        
        .pill-sub { 
          padding: 12px 20px; 
          background: rgba(0,0,0,0.01); 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          cursor: pointer; 
          transition: 0.2s; 
        }
        .pill-sub:hover { background: #fffbeb; }
        .sub-avatar { 
          width: 32px; height: 32px; border-radius: 8px; 
          background: var(--brand-slate-900); color: white; 
          display: flex; align-items: center; justify-content: center; 
          font-weight: 800; font-size: 12px; 
        }
        .sub-text .sub-lab { display: block; font-size: 9px; font-weight: 800; color: var(--brand-slate-400); text-transform: uppercase; }
        .sub-text .sub-val { display: block; font-size: 12px; font-weight: 750; color: var(--brand-slate-900); }

        .premium-btn-primary {
          background: linear-gradient(135deg, var(--brand-green), #059669);
          color: white;
          padding: 12px 24px;
          border-radius: 16px;
          border: none;
          font-weight: 800;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 8px 20px rgba(0, 132, 62, 0.2);
        }
        .premium-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(0, 132, 62, 0.3); }

        .premium-btn-secondary {
          background: white;
          color: #64748b;
          padding: 12px 24px;
          border-radius: 16px;
          border: 1.5px solid var(--brand-slate-100);
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .premium-btn-secondary:hover { background: var(--brand-slate-50); border-color: var(--brand-slate-200); }

        .premium-label {
          display: block;
          font-size: 13px;
          font-weight: 800;
          color: #475569;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .premium-input {
          width: 100%;
          padding: 14px 18px;
          border-radius: 16px;
          border: 1.5px solid var(--brand-slate-100);
          background: var(--brand-slate-50);
          font-weight: 700;
          color: #1e293b;
          outline: none;
          transition: all 0.2s;
        }
        .premium-input:focus { border-color: var(--brand-green); background: white; }

        .premium-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .premium-modal-content {
          background: white;
          border-radius: 32px;
          padding: 40px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.2);
          position: relative;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-title { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -1px; }
        .modal-subtitle { font-size: 14px; color: #64748b; margin-top: 4px; font-weight: 500; }

        .premium-close-btn {
          background: var(--brand-slate-50);
          border: none;
          border-radius: 12px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
        }
        .premium-close-btn:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }

        .modal-footer { display: flex; gap: 16px; }

        .premium-loader {
          width: 48px;
          height: 48px;
          border: 5px solid var(--brand-slate-50);
          border-top: 5px solid var(--brand-green);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

export default Sections;
