import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { parentAPI } from '../../services/api';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';

// Premium Icon Components
const Icons = {
  Bell: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  ArrowRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Megaphone: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h3a1 1 0 0 0 1-1V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3a1 1 0 0 0-1 1v2a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-2a1 1 0 0 0-1-1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><path d="M2 8h3v8H2z"/><path d="M10 12h.01"/></svg>,
};

const Announcements = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const isParent = user?.role === 'parent';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch announcements
      let announceRes;
      if (isParent) {
        announceRes = await parentAPI.getMyChildrenAnnouncements();
        const childrenRes = await parentAPI.getMyChildren();
        if (childrenRes.data?.success) setLinkedStudents(childrenRes.data.data);
      } else {
        // Fallback for non-parents if needed
        announceRes = { data: { data: [] } }; 
      }
      
      setAnnouncements(announceRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      sessionStorage.removeItem('authToken');
      navigate('/login');
    }
  };

  const filteredAnnouncements = announcements.filter(ann => {
    const matchesSearch = ann.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ann.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChild = selectedChildId === 'all' || ann.studentId === selectedChildId || ann.target === 'school';
    const matchesType = filterType === 'all' || ann.type === filterType;
    return matchesSearch && matchesChild && matchesType;
  });

  return (
    <div style={{ backgroundColor: '#ffffff', fontFamily: "'Inter', sans-serif", animation: 'fadeIn 0.5s ease-out' }}>
        <main style={{ padding: '0' }}>
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ padding: '6px 14px', backgroundColor: 'rgba(0, 132, 62, 0.1)', color: '#00843e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Communications</span>
                <span style={{ color: '#cbd5e1' }}><Icons.ArrowRight /></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Notice Board</span>
              </div>
              <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Official <span style={{ color: 'var(--brand-green)' }}>Announcements</span></h1>
              <p style={{ fontSize: '16px', color: '#64748b', marginTop: '12px', fontWeight: '500' }}>Stay updated with the latest institutional news and targeted notifications.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icons.Search /></div>
                <input 
                  type="text" 
                  placeholder="Search communications..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '14px 16px 14px 44px', border: '1px solid #e2e8f0', borderRadius: '14px', fontSize: '14px', outline: 'none', width: '280px', backgroundColor: '#f8fafc', transition: 'all 0.3s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} 
                  onFocus={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.borderColor = '#00843e'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 132, 62, 0.1)'; }}
                  onBlur={(e) => { e.target.style.backgroundColor = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; }}
                />
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
            {isParent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '10px 20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.5px' }}>VIEWING FOR:</span>
                <select 
                  value={selectedChildId} 
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  style={{ border: 'none', fontSize: '14px', fontWeight: '700', color: '#00843e', outline: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                >
                  <option value="all">All Children</option>
                  {linkedStudents.map(child => (
                    <option key={child.id} value={child.id}>{child.firstName} {child.lastName}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
              {['all', 'urgent', 'school', 'class', 'academic'].map(type => (
                <button 
                  key={type}
                  onClick={() => setFilterType(type)}
                  style={{ 
                    padding: '10px 24px', 
                    borderRadius: '12px', 
                    border: '1px solid',
                    borderColor: filterType === type ? '#00843e' : 'transparent',
                    fontSize: '14px', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    backgroundColor: filterType === type ? '#00843e' : 'white',
                    color: filterType === type ? 'white' : '#64748b',
                    boxShadow: filterType === type ? '0 8px 16px rgba(0, 132, 62, 0.2)' : '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    textTransform: 'capitalize'
                  }}
                  onMouseOver={(e) => { if (filterType !== type) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={(e) => { if (filterType !== type) e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Announcements Grid */}
          <div className="responsive-grid-2">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: '220px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9', animation: 'pulse 1.5s infinite' }}></div>
              ))
            ) : filteredAnnouncements.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '100px 40px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '32px', border: '2px dashed #e2e8f0' }}>
                <div style={{ width: '100px', height: '100px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', color: '#cbd5e1' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 12px' }}>No Communications Found</h3>
                <p style={{ fontSize: '16px', color: '#64748b', margin: 0, maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>There are currently no announcements matching your filters or search criteria. Try adjusting them to see more results.</p>
              </div>
            ) : (
              filteredAnnouncements.map((ann, idx) => (
                <AnnouncementCard key={ann.id || idx} announcement={ann} />
              ))
            )}
          </div>
        </main>
      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
};

const AnnouncementCard = ({ announcement }) => {
  const isUrgent = announcement.type === 'urgent';
  
  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '24px', 
      padding: '32px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      border: isUrgent ? '2px solid #ef4444' : '1px solid #f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '24px',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      zIndex: 1
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-6px)';
      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)';
      e.currentTarget.style.borderColor = isUrgent ? '#ef4444' : '#00843e';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
      e.currentTarget.style.borderColor = isUrgent ? '#ef4444' : '#f1f5f9';
    }}
    >
      {isUrgent && (
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '8px 24px', backgroundColor: '#ef4444', color: 'white', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottomLeftRadius: '20px', boxShadow: '-4px 4px 10px rgba(239, 68, 68, 0.2)' }}>
          Urgent Notice
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: '20px', 
          backgroundColor: isUrgent ? '#fef2f2' : '#f4fbf7', 
          color: isUrgent ? '#ef4444' : '#00843e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: isUrgent ? 'inset 0 2px 4px rgba(239, 68, 68, 0.1)' : 'inset 0 2px 4px rgba(0, 132, 62, 0.1)'
        }}>
          <Icons.Megaphone />
        </div>
        
        <div style={{ flex: 1, paddingRight: isUrgent ? '100px' : '0' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <span style={{ 
              padding: '4px 12px', 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: '12px', 
              fontSize: '11px', 
              fontWeight: '800', 
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {announcement.target || 'General'}
            </span>
          </div>
          
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px', lineHeight: '1.4' }}>{announcement.title}</h3>
          
          <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.7', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {announcement.content || announcement.description}
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '20px', borderTop: '1px dashed #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
            <Icons.Calendar /> {new Date(announcement.date || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            {announcement.author || 'Administration'}
          </div>
        </div>
        
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: 'transparent', border: 'none', fontSize: '14px', fontWeight: '700', color: '#00843e', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(4px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}>
          Read Details <Icons.ArrowRight />
        </button>
      </div>
    </div>
  );
};

export default Announcements;
