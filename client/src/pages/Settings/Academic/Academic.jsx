import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { settingsAPI, academicCalendarAPI } from '../../../services/api';
import SettingsTabs from '../../../components/layout/SettingsTabs';
import PremiumDatePicker from '../../../components/common/PremiumDatePicker';
import PremiumSelect from '../../../components/common/PremiumSelect';
import PremiumAlert from '../../../components/common/PremiumAlert';
import '../Settings.css';

const SettingsAcademic = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [settings, setSettings] = useState({
    current_session: '',
    current_term: '',
    grading_system: []
  });

  const [academicStats, setAcademicStats] = useState({
    classes: 0,
    sections: 0,
    subjects: 0
  });

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [showCalModal, setShowCalModal] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState({ isOpen: false, id: null });
  const [currentCalEvent, setCurrentCalEvent] = useState({
    id: null, term: '', week: '', startDate: '', endDate: '', activity: '', status: 'Pending'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, statsRes] = await Promise.all([
        settingsAPI.getSettings(),
        settingsAPI.getAcademicStats()
      ]);

      if (settingsRes.data.success) {
        setSettings({
          current_session: settingsRes.data.settings.current_session || settingsRes.data.settings.currentSession || '2024/2025',
          current_term: settingsRes.data.settings.current_term || settingsRes.data.settings.currentTerm || '1st',
          grading_system: settingsRes.data.settings.grading_system || settingsRes.data.settings.gradingSystem || []
        });
      }

      if (statsRes.data.success) {
        setAcademicStats(statsRes.data.data);
      }

      try {
        const calRes = await academicCalendarAPI.getAll();
        if (calRes.data.success) setCalendarEvents(calRes.data.data);
      } catch (e) {
        console.error('Failed to load academic calendar', e);
      }
    } catch (error) {
      console.error('Error fetching academic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleGradeChange = (index, field, value) => {
    const updatedGrades = [...settings.grading_system];
    updatedGrades[index] = { ...updatedGrades[index], [field]: value };
    setSettings(prev => ({ ...prev, grading_system: updatedGrades }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await settingsAPI.updateSettings(settings);
      if (response.data.success) {
        setSuccess('Academic architecture successfully updated.');
        setHasChanges(false);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCalEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...currentCalEvent,
        date_range: currentCalEvent.endDate ? `${currentCalEvent.startDate}|${currentCalEvent.endDate}` : currentCalEvent.startDate,
        dateRange: currentCalEvent.endDate ? `${currentCalEvent.startDate}|${currentCalEvent.endDate}` : currentCalEvent.startDate
      };
      if (currentCalEvent.id) {
        await academicCalendarAPI.update(currentCalEvent.id, payload);
      } else {
        await academicCalendarAPI.create(payload);
      }
      setShowCalModal(false);
      setCurrentCalEvent({ id: null, term: '', week: '', startDate: '', endDate: '', activity: '', status: 'Pending' });
      fetchData(); // refresh calendar
      setSuccess('Academic Calendar updated successfully.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error saving calendar event:', err);
    }
  };

  const handleDeleteCalEvent = async () => {
    if (deleteAlert.id) {
      try {
        await academicCalendarAPI.delete(deleteAlert.id);
        fetchData();
        setDeleteAlert({ isOpen: false, id: null });
      } catch (err) {
        console.error('Failed to delete activity:', err);
      }
    }
  };

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); navigate('/login'); } };



  return (
    <>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div className="premium-loader"></div>
        </div>
      ) : (
        <>
          {success && (
          <div style={{ 
            backgroundColor: '#ecfdf5', 
            color: '#065f46', 
            padding: '16px 24px', 
            borderRadius: '16px', 
            marginBottom: '32px', 
            marginTop: '20px',
            border: '1px solid #d1fae5', 
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }} className="animate-fade-in">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {success}
          </div>
        )}

        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '1000', color: 'var(--slate-900)', letterSpacing: '-2px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Academic <span style={{ color: 'var(--brand-green)' }}>Architecture</span>
          </h1>
          <p style={{ color: 'var(--slate-500)', fontWeight: '600', marginTop: '4px' }}>Configure structural vectors and academic operational parameters.</p>
        </header>

        <SettingsTabs />

        {/* Architecture Metrics */}
        <div className="responsive-grid-3" style={{ marginBottom: '32px' }}>
          <div className="settings-stat-nexus animate-fade-in">
            <div className="settings-stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #d1fae5' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <p className="settings-stat-label">Class Hierarchy</p>
              <h4 className="settings-stat-value">{academicStats.classes} Levels</h4>
            </div>
          </div>

          <div className="settings-stat-nexus animate-fade-in">
            <div className="settings-stat-icon" style={{ backgroundColor: '#fefce8', color: '#ca8a04', border: '1px solid #fef08a' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="8" r="3"/></svg>
            </div>
            <div>
              <p className="settings-stat-label">Section Distribution</p>
              <h4 className="settings-stat-value">{academicStats.sections} Sections</h4>
            </div>
          </div>

          <div className="settings-stat-nexus animate-fade-in">
            <div className="settings-stat-icon" style={{ backgroundColor: '#f0f9ff', color: '#0284c7', border: '1px solid #e0f2fe' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </div>
            <div>
              <p className="settings-stat-label">Curriculum Nodes</p>
              <h4 className="settings-stat-value">{academicStats.subjects} Subjects</h4>
            </div>
          </div>
        </div>

        <div className="settings-card animate-fade-in" style={{ marginBottom: '32px' }}>
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ color: 'var(--brand-yellow)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 className="settings-card-title">Temporal Control</h3>
          </div>
          
          <div className="responsive-grid-2">
            <div className="settings-input-group">
              <label className="settings-label">Active Operational Term</label>
              <PremiumSelect 
                value={settings.current_term}
                onChange={(val) => handleInputChange({ target: { name: 'current_term', value: val } })}
                options={[
                  { value: '1st', label: 'First Academic Term' },
                  { value: '2nd', label: 'Second Academic Term' },
                  { value: '3rd', label: 'Third Academic Term' }
                ]}
              />
            </div>
            <div className="settings-input-group">
              <label className="settings-label">Active Academic Session</label>
              <input 
                type="text"
                name="current_session"
                value={settings.current_session}
                onChange={handleInputChange}
                className="settings-input"
                placeholder="e.g. 2024/2025"
              />
            </div>
          </div>
        </div>

        <div className="settings-card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '28px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="settings-card-title">Evaluation Matrix</h3>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>Grading tiers and classification weightage</p>
            </div>
            <button className="premium-btn-secondary" style={{ fontSize: '12px', padding: '8px 16px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '6px' }}><path d="M12 5v14M5 12h14"/></svg>
              Add Tier
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Grade</th>
                  <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Min</th>
                  <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Max</th>
                  <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Point</th>
                  <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Remark</th>
                </tr>
              </thead>
              <tbody>
                {settings.grading_system.map((grad, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 32px' }}>
                      <input 
                        type="text" 
                        value={grad.grade} 
                        onChange={(e) => handleGradeChange(index, 'grade', e.target.value)}
                        className="settings-input"
                        style={{ width: '70px', padding: '8px 12px', textAlign: 'center', fontWeight: '900', color: 'var(--brand-green)' }} 
                      />
                    </td>
                    <td style={{ padding: '12px 32px' }}>
                      <input 
                        type="number" 
                        value={grad.minScore} 
                        onChange={(e) => handleGradeChange(index, 'minScore', parseInt(e.target.value))}
                        className="settings-input"
                        style={{ width: '80px', padding: '8px 12px', textAlign: 'center' }} 
                      />
                    </td>
                    <td style={{ padding: '12px 32px' }}>
                      <input 
                        type="number" 
                        value={grad.maxScore} 
                        onChange={(e) => handleGradeChange(index, 'maxScore', parseInt(e.target.value))}
                        className="settings-input"
                        style={{ width: '80px', padding: '8px 12px', textAlign: 'center' }} 
                    />
                    </td>
                    <td style={{ padding: '12px 32px' }}>
                      <input 
                        type="number" 
                        step="0.1"
                        value={grad.gradePoint} 
                        onChange={(e) => handleGradeChange(index, 'gradePoint', parseFloat(e.target.value))}
                        className="settings-input"
                        style={{ width: '80px', padding: '8px 12px', textAlign: 'center', fontWeight: '800', color: 'var(--brand-green)' }} 
                      />
                    </td>
                    <td style={{ padding: '12px 32px' }}>
                      <input 
                        type="text" 
                        value={grad.remark} 
                        onChange={(e) => handleGradeChange(index, 'remark', e.target.value)}
                        className="settings-input"
                        style={{ padding: '8px 16px', fontWeight: '600' }} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Academic Calendar Section */}
        <div className="settings-card animate-fade-in" style={{ padding: 0, overflow: 'hidden', marginBottom: '32px' }}>
          <div style={{ padding: '28px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="settings-card-title">Academic Calendar</h3>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>Define terms, weeks, and key activities for the academic year</p>
            </div>
            <button 
              className="premium-btn-secondary" 
              style={{ fontSize: '12px', padding: '8px 16px' }}
              onClick={() => {
                setCurrentCalEvent({ id: null, term: settings.current_term || '1st', week: '', startDate: '', endDate: '', activity: '', status: 'Pending' });
                setShowCalModal(true);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '6px' }}><path d="M12 5v14M5 12h14"/></svg>
              Add Activity
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', width: '60px' }}>S/N</th>
                  <th style={{ padding: '16px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Term</th>
                  <th style={{ padding: '16px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>WK</th>
                  <th style={{ padding: '16px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                  <th style={{ padding: '16px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Activity</th>
                  <th style={{ padding: '16px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                  <th style={{ padding: '16px 32px', textAlign: 'right', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {calendarEvents.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No academic calendar activities defined.</td>
                  </tr>
                ) : (
                  calendarEvents.map((evt, idx) => (
                    <tr key={evt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 32px', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{idx + 1}</td>
                      <td style={{ padding: '16px 16px', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>{evt.term || evt.term}</td>
                      <td style={{ padding: '16px 16px', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>{evt.week}</td>
                      <td style={{ padding: '16px 16px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                        {(() => {
                          const range = evt.date_range || evt.dateRange || '';
                          if (!range) return '';
                          if (!range.includes('|')) {
                            return new Date(range).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                          }
                          const [s, e] = range.split('|');
                          return `${new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${new Date(e).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                        })()}
                      </td>
                      <td style={{ padding: '16px 16px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{evt.activity}</td>
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '24px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                          backgroundColor: (evt.status || '').toLowerCase() === 'completed' ? '#dcfce7' : (evt.status || '').toLowerCase() === 'ongoing' ? '#fef3c7' : '#f1f5f9',
                          color: (evt.status || '').toLowerCase() === 'completed' ? '#166534' : (evt.status || '').toLowerCase() === 'ongoing' ? '#92400e' : '#475569'
                        }}>
                          {evt.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 32px', textAlign: 'right' }}>
                        <button onClick={() => { 
                          const range = evt.date_range || evt.dateRange || '';
                          let start = range, end = '';
                          if (range.includes('|')) {
                            [start, end] = range.split('|');
                          }
                          setCurrentCalEvent({ id: evt.id, term: evt.term, week: evt.week, startDate: start, endDate: end, activity: evt.activity, status: evt.status }); 
                          setShowCalModal(true); 
                        }} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '16px', fontWeight: '700' }}>Edit</button>
                        <button onClick={() => setDeleteAlert({ isOpen: true, id: evt.id })} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '700' }}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Floating Save Bar */}
        <div className={`settings-save-bar ${hasChanges ? 'visible' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 0 10px rgba(255,255,255,0.5)' }}></div>
            <span style={{ fontWeight: '700', fontSize: '14px' }}>Unsaved Academic Changes Detected</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => { fetchData(); setHasChanges(false); }}
              style={{ padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
            >Discard</button>
            <button 
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '10px 24px', backgroundColor: 'white', border: 'none', color: 'var(--brand-green)', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {saving ? 'Synchronizing...' : 'Deploy Changes'}
              {!saving && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
            </button>
          </div>
        </div>

        {/* Academic Calendar Modal */}
        {showCalModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} className="animate-fade-in">
              <h2 style={{ fontSize: '24px', fontWeight: '950', color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.5px' }}>
                {currentCalEvent.id ? 'Edit Activity' : 'Add Activity'}
              </h2>
              <form onSubmit={handleSaveCalEvent}>
                <div className="responsive-grid-2" style={{ marginBottom: '16px' }}>
                  <div className="settings-input-group">
                    <label className="settings-label">Term</label>
                    <input required type="text" className="settings-input" value={currentCalEvent.term} onChange={e => setCurrentCalEvent(p => ({...p, term: e.target.value}))} placeholder="e.g. 1st" />
                  </div>
                  <div className="settings-input-group">
                    <label className="settings-label">Week (Optional)</label>
                    <input type="text" className="settings-input" value={currentCalEvent.week} onChange={e => setCurrentCalEvent(p => ({...p, week: e.target.value}))} placeholder="e.g. 1" />
                  </div>
                </div>
                <div className="responsive-grid-2" style={{ marginBottom: '16px' }}>
                  <div className="settings-input-group">
                    <label className="settings-label">Start Date</label>
                    <PremiumDatePicker 
                      value={currentCalEvent.startDate} 
                      onChange={val => setCurrentCalEvent(p => ({...p, startDate: val}))} 
                      placeholder="Select Start Date" 
                    />
                  </div>
                  <div className="settings-input-group">
                    <label className="settings-label">End Date (Optional)</label>
                    <PremiumDatePicker 
                      value={currentCalEvent.endDate} 
                      onChange={val => setCurrentCalEvent(p => ({...p, endDate: val}))} 
                      placeholder="Select End Date" 
                    />
                  </div>
                </div>
                <div className="settings-input-group" style={{ marginBottom: '16px' }}>
                  <label className="settings-label">Activity Description</label>
                  <input required type="text" className="settings-input" value={currentCalEvent.activity} onChange={e => setCurrentCalEvent(p => ({...p, activity: e.target.value}))} placeholder="e.g. School Resumes" />
                </div>
                <div className="settings-input-group" style={{ marginBottom: '24px' }}>
                  <label className="settings-label">Status</label>
                  <PremiumSelect 
                    value={currentCalEvent.status} 
                    onChange={val => setCurrentCalEvent(p => ({...p, status: val}))}
                    options={[
                      { value: 'Pending', label: 'Pending' },
                      { value: 'Ongoing', label: 'Ongoing' },
                      { value: 'Completed', label: 'Completed' }
                    ]}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowCalModal(false)} style={{ padding: '12px 24px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="premium-btn-primary" style={{ padding: '12px 24px' }}>Save Activity</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <PremiumAlert
          isOpen={deleteAlert.isOpen}
          title="Delete Activity"
          message="Are you sure you want to permanently delete this academic calendar activity? This action cannot be undone."
          type="confirm"
          confirmText="Yes, Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteCalEvent}
          onCancel={() => setDeleteAlert({ isOpen: false, id: null })}
        />
        </>
      )}
    </>
  );
};

export default SettingsAcademic;
