import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';

// Premium Icon Components
const Icons = {
  Help: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Book: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Message: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  ChevronDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Phone: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
};

const HelpSupport = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [storedUser, setStoredUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('Help & Support');
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
  }, []);

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); navigate('/login'); }
  };

  const currentUser = storedUser || user;

  const faqs = [
    { q: "How do I reset my password?", a: "You can reset your password in the Configuration tab under Account settings. Look for the 'Security' section." },
    { q: "How do I record student attendance?", a: "Navigate to the Attendance page from the sidebar, select the class and date, and mark students as present or absent." },
    { q: "Where can I view my class timetable?", a: "The Timetable page shows your weekly schedule. You can access it from the Academic menu in the sidebar." },
    { q: "How are grades calculated?", a: "Grades are calculated based on the assessment weights defined in the Course settings. The total score is a sum of class assignments, mid-semester exams, and final exams." }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-1.5px', fontFamily: "'Outfit', sans-serif" }}>
          Help & <span style={{ color: 'var(--brand-green)' }}>Support</span>
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', marginTop: '12px', fontWeight: '500', maxWidth: '600px' }}>
          Access comprehensive documentation, interactive assistance, and direct technical protocols.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
        {/* Left Column - FAQs */}
        <div className="glass-card" style={{ padding: '40px', borderRadius: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green)', borderRadius: '16px', border: '1.5px solid var(--brand-green-glow)' }}><Icons.Help /></div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>Operational Protocols (FAQs)</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {faqs.map((faq, index) => (
              <div key={index} style={{ border: '1px solid #f1f5f9', borderRadius: '20px', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                <button 
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  style={{ width: '100%', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: expandedFaq === index ? '#ffffff' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                >
                  <span style={{ fontSize: '16px', fontWeight: '700', color: expandedFaq === index ? 'var(--brand-green)' : '#1e293b' }}>{faq.q}</span>
                  <div style={{ transform: expandedFaq === index ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', color: expandedFaq === index ? 'var(--brand-green)' : '#94a3b8' }}><Icons.ChevronDown /></div>
                </button>
                {expandedFaq === index && (
                  <div style={{ padding: '0 24px 24px', fontSize: '15px', color: '#64748b', lineHeight: '1.7', fontWeight: '500', animation: 'slideDown 0.3s ease-out' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Contact & Docs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Contact Card */}
          <div className="glass-card" style={{ padding: '36px', borderRadius: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '24px', letterSpacing: '-0.4px' }}>Direct Intelligence Desk</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                <div style={{ color: 'var(--brand-green)', padding: '10px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}><Icons.Phone /></div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Technical Line</p>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '4px 0 0' }}>+233 (0) 24 000 0000</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                <div style={{ color: '#8b5cf6', padding: '10px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}><Icons.Message /></div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Priority Support</p>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '4px 0 0' }}>support@uhas.edu.gh</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documentation Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, #00843e 0%, #006831 100%)', 
            borderRadius: '32px', 
            padding: '36px', 
            color: 'white', 
            boxShadow: '0 20px 50px rgba(0, 132, 62, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
            <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '16px', width: 'fit-content', marginBottom: '24px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Icons.Book />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '850', margin: '0 0 12px', letterSpacing: '-0.5px' }}>User Manual</h3>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6', marginBottom: '28px', fontWeight: '500' }}>Comprehensive system documentation for all institutional roles.</p>
            <button 
              className="premium-btn-secondary" 
              style={{ 
                width: '100%', 
                padding: '16px', 
                backgroundColor: 'white', 
                color: '#00843e', 
                border: 'none', 
                borderRadius: '16px', 
                fontWeight: '800', 
                cursor: 'pointer', 
                fontSize: '14px',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
              }}
            >
              Download PDF Manual
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
