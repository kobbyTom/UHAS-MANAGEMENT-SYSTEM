import React, { useState, useEffect } from 'react';
import { academicCalendarAPI, settingsAPI } from '../../services/api';

const AcademicCalendarWidget = () => {
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState({ current_term: '', current_session: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, settingsRes] = await Promise.all([
        academicCalendarAPI.getAll(),
        settingsAPI.getSettings()
      ]);
      
      if (eventsRes.data?.success) {
        setEvents(eventsRes.data.data.slice(0, 5));
      }
      
      if (settingsRes.data?.success) {
        setSettings({
          current_term: settingsRes.data.settings.current_term || settingsRes.data.settings.currentTerm || '',
          current_session: settingsRes.data.settings.current_session || settingsRes.data.settings.currentSession || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch academic calendar data', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '0' }}>
      {(settings.current_term || settings.current_session) && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Session</span>
            <span style={{ padding: '4px 10px', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '12px', fontSize: '12px', fontWeight: '800' }}>{settings.current_session || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Term</span>
            <span style={{ padding: '4px 10px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '12px', fontSize: '12px', fontWeight: '800' }}>{settings.current_term || 'N/A'}</span>
          </div>
        </div>
      )}
      <div style={{ padding: '20px' }}>
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} style={{ height: '60px', backgroundColor: '#f1f5f9', borderRadius: '10px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}></div>
          ))
        ) : events.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            No upcoming academic activities.
          </div>
        ) : (
          events.map((event, index) => {
            const isCompleted = (event.status || '').toLowerCase() === 'completed';
            const isOngoing = (event.status || '').toLowerCase() === 'ongoing';
            const statusBg = isCompleted ? '#dcfce7' : isOngoing ? '#fef3c7' : '#f1f5f9';
            const statusColor = isCompleted ? '#166534' : isOngoing ? '#92400e' : '#475569';

            return (
              <div 
                key={event.id || index}
                style={{
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #f1f5f9',
                  marginBottom: index < events.length - 1 ? '12px' : '0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
                    {event.activity}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        {(() => {
                          const range = event.date_range || event.dateRange || '';
                          if (!range) return '';
                          if (!range.includes('|')) {
                            // Only 1 valid date format expected now, if it's old free text it'll render as invalid date
                            const d = new Date(range);
                            return isNaN(d) ? range : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                          }
                          const [s, e] = range.split('|');
                          const start = new Date(s);
                          const end = new Date(e);
                          return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                        })()}
                      </span>
                    </div>
                    {event.week && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>
                          WK {event.week}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <span style={{ 
                  padding: '4px 10px', 
                  borderRadius: '24px', 
                  fontSize: '10px', 
                  fontWeight: '800', 
                  textTransform: 'uppercase',
                  backgroundColor: statusBg,
                  color: statusColor
                }}>
                  {event.status || 'Pending'}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AcademicCalendarWidget;
