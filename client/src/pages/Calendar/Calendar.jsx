import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { parentAPI, eventAPI } from '../../services/api';
import PremiumDatePicker from '../../components/common/PremiumDatePicker';
import PremiumSelect from '../../components/common/PremiumSelect';

const Calendar = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [storedUser, setStoredUser] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'event', description: '' });

  const role = storedUser?.role || user?.role;
  const isParent = role === 'parent';
  const isStudent = role === 'student';
  const isAdmin = role === 'admin' || role === 'staff' || role === 'ITSupport' || role === 'teacher';

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  useEffect(() => {
    const saved = localStorage.getItem('authUser');
    if (saved) { try { setStoredUser(JSON.parse(saved)); } catch (e) {} }
    fetchEvents();
    if (isParent) fetchAnnouncements();
  }, [isParent]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventAPI.getAll();
      if (res.data?.success) {
        setEvents(prev => {
          const newEvents = res.data.data.map(e => ({
            id: e.id,
            title: e.title,
            date: e.startDate || e.date,
            time: e.time,
            type: e.eventType || e.type,
            color: e.color || (e.type === 'exam' ? '#ef4444' : e.type === 'holiday' ? '#facc15' : '#00843e'),
            description: e.description
          }));
          const existingIds = new Set(prev.map(p => p.id));
          return [...prev, ...newEvents.filter(n => !existingIds.has(n.id))];
        });
      }
    } catch (e) { console.error('Failed to fetch events:', e); }
    finally { setLoading(false); }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await parentAPI.getMyChildrenAnnouncements();
      if (res.data?.data) {
        setEvents(prev => {
          const ann = res.data.data.map(e => ({ ...e, type: 'announcement', color: '#00843e' }));
          const existingIds = new Set(prev.map(p => p.id));
          return [...prev, ...ann.filter(n => !existingIds.has(n.id))];
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const defaultEvents = [];

  const displayEvents = events.length > 0 ? events : defaultEvents;

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return displayEvents.filter(e => e.date === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const eventToSave = {
        title: newEvent.title,
        description: newEvent.description,
        startDate: newEvent.date,
        eventType: newEvent.type,
        time: newEvent.time, // Note: backend doesn't currently use time, but we send it anyway
        color: newEvent.type === 'exam' ? '#ef4444' : newEvent.type === 'holiday' ? '#facc15' : '#00843e',
        audience: ['all']
      };
      const res = await eventAPI.create(eventToSave);
      if (res.data?.success) {
        setEvents(prev => [...prev, res.data.data]);
        setShowModal(false);
        setNewEvent({ title: '', date: '', time: '', type: 'event', description: '' });
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventAPI.delete(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  return (
    <div className="calendar-module-content">
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>School Calendar</h1>
            <p style={{ fontSize: '15px', color: '#64748b', marginTop: '0', fontWeight: '500' }}>View school events and academic calendar</p>
          </div>
          {!isStudent && (
            <button onClick={() => setShowModal(true)} style={{ padding: '12px 24px', backgroundColor: '#00843e', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 15px rgba(0, 132, 62, 0.3)', transition: 'all 0.2s' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16m8-8H4"/></svg>
              Add Event
            </button>
          )}
        </div>

        <div className="responsive-grid-2-1-3" style={{ gap: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={prevMonth} style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
              </button>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
              <button onClick={nextMonth} style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {dayNames.map(day => (<div key={day} style={{ textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>{day}</div>))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {[...Array(startingDay)].map((_, i) => (<div key={`empty-${i}`} style={{ minHeight: '90px' }}></div>))}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDay(day);
                  const today = new Date();
                  const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
                  return (
                    <div key={day} style={{ padding: '10px', minHeight: '90px', borderRadius: '12px', backgroundColor: isToday ? '#dcfce7' : '#ffffff', border: isToday ? '2px solid #00843e' : '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '14px', fontWeight: isToday ? '700' : '500', color: isToday ? '#00843e' : '#1e293b', marginBottom: '6px' }}>{day}</div>
                      {dayEvents.slice(0, 2).map(event => (
                        <div key={event.id || event._id} style={{ padding: '4px 6px', backgroundColor: `${event.color}15`, borderRadius: '6px', marginBottom: '4px', fontSize: '11px', color: event.color, fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Event Legend</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#00843e' }}></div><span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Meetings</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#00843e' }}></div><span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Activities</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#facc15' }}></div><span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Holidays</span></div>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1)', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Upcoming Events</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {displayEvents.slice(0, 5).map(event => (
                  <div key={event.id || event._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px', backgroundColor: '#ffffff', borderRadius: '12px', transition: 'all 0.2s', position: 'relative' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `${event.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={event.color} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' }}>{event.title}</p>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: '500' }}>{event.date} • {event.time || 'All Day'}</p>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDeleteEvent(event.id)} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      <style>{`
        input:focus, select:focus, textarea:focus {
          border-color: #00843e !important;
          box-shadow: 0 0 0 4px rgba(0, 132, 62, 0.1) !important;
        }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Add New Event</h2>
            <form onSubmit={handleCreateEvent}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Event Title</label>
                <input type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Date</label>
                  <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Time (Optional)</label>
                  <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Event Type</label>
                <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }} required>
                  <option value="event">General Event</option>
                  <option value="meeting">Meeting</option>
                  <option value="holiday">Holiday</option>
                  <option value="exam">Exam</option>
                </select>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Description (Optional)</label>
                <textarea value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', minHeight: '80px', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#64748b' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#00843e', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: 'white' }}>{loading ? 'Saving...' : 'Save Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default Calendar;
