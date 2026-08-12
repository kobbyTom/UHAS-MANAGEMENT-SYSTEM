import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { parentAPI, paymentAPI, studentAPI, feeAPI, settingsAPI } from '../../../services/api';

// Premium Icon Components
const Icons = {
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  TrendingUp: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Wallet: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>,
  Activity: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  FileText: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  User: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  CheckCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  AlertCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  ChevronRight: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};

const FeesCollection = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Finance');
  const [loading, setLoading] = useState(true);
  const [isParent, setIsParent] = useState(user?.role === 'parent');

  // Data states
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeComponents, setFeeComponents] = useState([]);
  const [settings, setSettings] = useState(null);
  
  // Search & Profile states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFees, setStudentFees] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    feeId: '',
    amount: '',
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: '',
    term: '1st',
    academicYear: '2023/2024'
  });

  const [liveStats, setLiveStats] = useState({ totalCollected: 0, totalPending: 0, transactionsCount: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, studentsRes, feesRes, settingsRes, statsRes] = await Promise.all([
        paymentAPI.getAll({ limit: 100 }),
        studentAPI.getAll({ limit: 500 }),
        feeAPI.getAll({ limit: 100 }),
        settingsAPI.getSettings(),
        feeAPI.getStats()
      ]);

      if (paymentsRes.data?.success) setPayments(paymentsRes.data.data);
      if (studentsRes.data?.success) setStudents(studentsRes.data.data);
      if (feesRes.data?.success) setFeeComponents(feesRes.data.data);
      if (settingsRes.data?.success) {
        setSettings(settingsRes.data.settings);
        setFormData(prev => ({
          ...prev,
          academicYear: settingsRes.data.settings.currentSession || '2023/2024',
          term: settingsRes.data.settings.currentTerm || '1st'
        }));
      }
      if (statsRes.data?.success) {
        setLiveStats({
          totalCollected: statsRes.data.data.totalCollected || 0,
          totalPending: statsRes.data.data.totalPending || 0,
          transactionsCount: statsRes.data.data.transactionsCount || 0
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle URL param student selection
  useEffect(() => {
    if (studentId && students.length > 0) {
      const student = students.find(s => s.id === studentId || s.studentId === studentId);
      if (student) {
        handleStudentSelect(student);
      }
    }
  }, [studentId, students]);

  useEffect(() => {
    fetchData();
    setIsParent(user?.role === 'parent');
  }, [user]);

  // Click outside search to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setSearchTerm(`${student.firstName} ${student.lastName}`);
    setShowSearchDropdown(false);
    setProfileLoading(true);
    try {
      const res = await feeAPI.getByStudent(student.id);
      if (res.data?.success) {
        setStudentFees(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching student fees:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleOpenPaymentModal = (fee = null) => {
    if (!selectedStudent) {
      alert('Please select a student first');
      return;
    }
    setFormData({
      ...formData,
      studentId: selectedStudent.id,
      feeId: fee?.id || '',
      amount: fee ? fee.balance : '',
      term: fee?.term || settings?.currentTerm || '1st',
      academicYear: fee?.academicYear || settings?.currentSession || '2023/2024'
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.amount) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setSubmitting(true);
      const res = await paymentAPI.create(formData);
      if (res.data.success) {
        alert('Payment recorded successfully!');
        setShowModal(false);
        fetchData(); // Refresh ALL data including live stats
        if (selectedStudent) handleStudentSelect(selectedStudent); // Refresh student profile
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const totalBilled = studentFees.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
  const totalPaid = studentFees.reduce((sum, f) => sum + (parseFloat(f.amountPaid) || 0), 0);
  const totalBalance = totalBilled - totalPaid;

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  return (
    <div>
      <main>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Fiscal Intelligence</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Institutional Ledger</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Smart Fee <span style={{ color: 'var(--brand-green)' }}>Collection</span></h1>
              <p style={{ fontSize: '16px', color: '#475569', marginTop: '8px', fontWeight: '500' }}>Synchronizing institutional revenue streams and student financial profiles.</p>
            </div>
            {user?.role === 'finance' && (
              <button 
                onClick={() => setShowModal(true)}
                className="premium-btn-primary"
              >
                <Icons.Plus />
                Initiate Transaction
              </button>
            )}
          </div>


          <div className="responsive-layout-wrapper" style={{ gap: '24px', alignItems: 'start' }}>
            
            {/* Left Column: Search & Profile */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div ref={searchRef} className="glass-card" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.5px' }}>Identify Student Node</h3>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-green)' }}><Icons.Search /></div>
                  <input 
                    type="text" 
                    placeholder="Search by name or admission number..." 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowSearchDropdown(true); }}
                    onFocus={() => setShowSearchDropdown(true)}
                    className="premium-input"
                    style={{ paddingLeft: '56px', fontSize: '16px', fontWeight: '600' }} 
                  />
                </div>
                
                {showSearchDropdown && searchTerm.length > 0 && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 12px)', left: 0, right: 0, backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', border: '1px solid var(--brand-slate-100)', zIndex: 1000, overflow: 'hidden' }}>
                    {filteredStudents.length > 0 ? filteredStudents.map(s => (
                      <div key={s.id} onClick={() => handleStudentSelect(s)} style={{ padding: '16px 24px', cursor: 'pointer', borderBottom: '1px solid var(--brand-slate-50)', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s ease' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(0, 132, 62, 0.06)'; e.currentTarget.style.color = 'var(--brand-green)'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'inherit'; }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--brand-slate-100)', color: 'var(--brand-slate-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '900' }}>{s.firstName[0]}</div>
                        <div>
                          <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{s.firstName} {s.lastName}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{s.grade} • {s.studentId}</p>
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>No nodes found in directory.</div>
                    )}
                  </div>
                )}
              </div>
              {selectedStudent ? (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '40px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 10% 10%, rgba(255,255,255,0.05) 0%, transparent 50%)', pointerEvents: 'none' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <div style={{ width: '84px', height: '84px', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '900', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                          {selectedStudent.firstName[0]}
                        </div>
                        <div>
                          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <span style={{ padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{selectedStudent.grade}</span>
                            <span style={{ padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{selectedStudent.studentId || 'NO-ID'}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, opacity: 0.7, fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Outstanding</p>
                        <h2 style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: '900', color: 'var(--brand-yellow)', letterSpacing: '-1.5px' }}>₵ {totalBalance.toLocaleString()}</h2>
                      </div>
                    </div>

                    <div className="responsive-grid-3" style={{ marginTop: '40px' }}>
                      <div style={{ padding: '20px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)' }}>
                        <p style={{ margin: 0, opacity: 0.6, fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Billed Nodes</p>
                        <p style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '900' }}>₵ {totalBilled.toLocaleString()}</p>
                      </div>
                      <div style={{ padding: '20px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)' }}>
                        <p style={{ margin: 0, opacity: 0.6, fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Value Synchronized</p>
                        <p style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '900', color: '#10b981' }}>₵ {totalPaid.toLocaleString()}</p>
                      </div>
                      <div style={{ padding: '20px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)' }}>
                        <p style={{ margin: 0, opacity: 0.6, fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Ledger Status</p>
                        <p style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '900', color: totalBalance === 0 ? '#10b981' : 'var(--brand-yellow)' }}>{totalBalance === 0 ? 'CLEARED' : 'PENDING'}</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '32px' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>Assigned Fee Components</h4>
                      <button onClick={() => handleOpenPaymentModal()} style={{ fontSize: '13px', color: '#00843e', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>+ General Payment</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {profileLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Loading fees...</div>
                      ) : studentFees.length > 0 ? studentFees.map(fee => (
                        <div key={fee.id} style={{ padding: '16px 20px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#00843e'}>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: fee.balance === 0 ? '#10b981' : '#f59e0b' }}></div>
                            <div>
                              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{fee.name}</p>
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Due: {new Date(fee.dueDate).toLocaleDateString()} • {fee.term} Term</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div>
                              <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>₵ {fee.balance.toLocaleString()}</p>
                              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Balance</p>
                            </div>
                            {fee.balance > 0 && (
                              <button 
                                onClick={() => handleOpenPaymentModal(fee)}
                                style={{ padding: '8px 16px', backgroundColor: '#ecfdf5', color: '#00843e', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                              >
                                Pay Now
                              </button>
                            )}
                            {fee.balance === 0 && (
                              <div style={{ color: '#10b981' }}><Icons.CheckCircle /></div>
                            )}
                          </div>
                        </div>
                      )) : (
                        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px dashed #e2e8f0', color: '#64748b' }}>
                          No fees assigned to this student yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ height: '400px', backgroundColor: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '16px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.User />
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>Select a student to view financial profile</p>
                </div>
              )}
            </div>

            {/* Right Column: Recent Transactions & Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Quick Stats - Live from DB */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <StatMini card={true} title="Total Collected" value={`₵ ${liveStats.totalCollected.toLocaleString()}`} icon={<Icons.TrendingUp />} color="#00843e" />
                <StatMini card={true} title="Outstanding Balance" value={`₵ ${liveStats.totalPending.toLocaleString()}`} icon={<Icons.Activity />} color="#f59e0b" />
                <StatMini card={true} title="Total Transactions" value={liveStats.transactionsCount} icon={<Icons.Wallet />} color="#8b5cf6" />
              </div>

              {/* Recent History Mini */}
              <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Recent Receipts</h3>
                  <button onClick={() => navigate('/fees/reports')} style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {payments.slice(0, 5).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><Icons.FileText /></div>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{p.student?.firstName || p.student?.first_name || 'N/A'}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{new Date(p.paymentDate || p.payment_date || p.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#00843e' }}>₵ {p.amount.toLocaleString()}</p>
                    </div>
                  ))}
                  {payments.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No transactions yet</p>}
                </div>
              </div>

              {/* Shortcuts */}
              <div style={{ padding: '24px', backgroundColor: '#00843e', borderRadius: '24px', color: 'white' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '800' }}>Finance Shortcuts</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <ShortcutItem title="Fee Structure" path="/fees/structure" icon={<Icons.ChevronRight />} />
                  <ShortcutItem title="Expenses" path="/fees/expenses" icon={<Icons.ChevronRight />} />
                  <ShortcutItem title="Income Report" path="/fees/income" icon={<Icons.ChevronRight />} />
                </div>
              </div>

              </div>
            </div>
          </main>

          {/* Modern Record Payment Modal */}
          {showModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '32px', width: '100%', maxWidth: '600px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'slideIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Record Payment</h2>
                    <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{selectedStudent ? `Payment for ${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Enter payment details'}</p>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #f1f5f9', backgroundColor: 'white', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="responsive-grid-2" style={{ gap: '24px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student *</label>
                    <select 
                      name="studentId" 
                      value={formData.studentId} 
                      onChange={handleInputChange} 
                      className="premium-input"
                      required 
                      disabled={!!selectedStudent}
                    >
                      <option value="">Select Student</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.grade})</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fee Item</label>
                    <select 
                      name="feeId" 
                      value={formData.feeId} 
                      onChange={handleInputChange} 
                      className="premium-input"
                    >
                      <option value="">General Payment / Miscellaneous</option>
                      {feeComponents.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount (₵) *</label>
                    <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="0.00" style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '2px solid #f1f5f9', outline: 'none', backgroundColor: '#ffffff', fontWeight: '800', color: '#00843e', fontSize: '18px' }} required />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Method</label>
                    <select 
                      name="paymentMethod" 
                      value={formData.paymentMethod} 
                      onChange={handleInputChange} 
                      className="premium-input"
                    >
                      <option value="cash">Cash</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Debit/Credit Card</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reference #</label>
                    <input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleInputChange} placeholder="TXN-XXXX" style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '2px solid #f1f5f9', outline: 'none', backgroundColor: '#ffffff', fontWeight: '600' }} />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Reason for payment..." style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '2px solid #f1f5f9', outline: 'none', height: '80px', resize: 'none', backgroundColor: '#ffffff' }}></textarea>
                  </div>

                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '16px', marginTop: '16px' }}>
                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '15px' }}>Discard</button>
                    <button type="submit" disabled={submitting} style={{ flex: 2, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#00843e', color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '15px', boxShadow: '0 10px 20px rgba(0, 132, 62, 0.2)', opacity: submitting ? 0.7 : 1 }}>
                      {submitting ? 'Processing...' : 'Complete Payment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          <style>{`
            @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
        </div>
      );
    };

const StatMini = ({ title, value, icon, color, card }) => (
  <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
    <div>
      <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>{title}</p>
      <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{value}</p>
    </div>
  </div>
);

const ShortcutItem = ({ title, path, icon }) => (
  <div onClick={() => window.location.href = path} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}>
    <span style={{ fontSize: '14px', fontWeight: '600' }}>{title}</span>
    {icon}
  </div>
);

export default FeesCollection;
