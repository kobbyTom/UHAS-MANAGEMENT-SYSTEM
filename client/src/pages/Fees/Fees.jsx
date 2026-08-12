import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { feeAPI, studentAPI, parentAPI, paymentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PremiumSelect from '../../components/common/PremiumSelect';

// Premium Icon Components
const Icons = {
  Wallet: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>,
  TrendingUp: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  AlertCircle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  CreditCard: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  FileText: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  PieChart: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  ArrowUpRight: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

const Fees = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Finance');
  
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storedUser, setStoredUser] = useState(null);
  const [activeTab, setActiveTab] = useState('collection');

  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const currentUser = storedUser || user;
  const isParent = currentUser?.role === 'parent';
  const isStudent = currentUser?.role === 'student';

  const [stats, setStats] = useState({ totalPaid: 0, totalPending: 0, totalOverdue: 0 });

  async function fetchData() {
    try {
      setLoading(true);
      const [statsRes, paymentsRes] = await Promise.all([
        feeAPI.getStats(),
        paymentAPI.getAll({ limit: 100 })
      ]);
      
      if (statsRes.data?.success) {
        setStats({
          totalPaid: statsRes.data.data.totalCollected,
          totalPending: statsRes.data.data.totalPending,
          totalOverdue: 0 // Need logic for overdue if available
        });
      }
      setFees(paymentsRes?.data?.data || []);

      if (isParent) {
        const parentRes = await parentAPI.getMyChildren();
        if (parentRes.data?.success) {
          setLinkedStudents(parentRes.data.data);
          if (parentRes.data.data.length > 0) {
            setSelectedChildId(parentRes.data.data[0].id);
          }
        }
      }
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
    fetchData();

    // Re-fetch when tab becomes active again (after navigating back from payment entry)
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') fetchData();
    });
    return () => window.removeEventListener('focus', handleFocus);
  }, [isParent]);

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); }
  };

  const filteredFees = isParent && selectedChildId
    ? fees.filter(f => (f.studentId || f.student?._id || f.student?.id) === selectedChildId)
    : fees;

    return (
      <div>
      <main>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {isParent ? 'Parent Portal' : isStudent ? 'Student Portal' : 'Treasury & Revenue'}
                </span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                  {isParent ? 'Fees & Payments' : isStudent ? 'My Fees' : 'Financial Ledger'}
                </span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>
                {isParent ? "Fees &" : isStudent ? 'My' : 'Finance'} <span style={{ color: 'var(--brand-green)' }}>{isParent ? 'Payments' : isStudent ? 'Fees' : 'Nexus'}</span>
              </h1>
              <p style={{ fontSize: '16px', color: '#475569', marginTop: '8px', fontWeight: '500' }}>
                {isParent ? "View your child's fee status and payment history." : isStudent ? 'Your personal fee records and payment history.' : 'Administrative oversight of institutional liquidity and fee collection protocols.'}
              </p>
            </div>
            {['finance', 'admin'].includes(currentUser?.role) && (
              <button 
                onClick={() => navigate('/fees/collection')}
                className="premium-btn-primary"
              >
                <Icons.Plus />
                Initiate Transaction
              </button>
            )}
          </div>





          {/* Parent Welcome Banner */}
          {isParent && (
            <div style={{ background: 'linear-gradient(135deg, #00843e 0%, #059669 100%)', borderRadius: '24px', padding: '32px', marginBottom: '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Fee Overview</p>
                <h2 style={{ margin: '8px 0 4px', fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>Your Child's Fee Status</h2>
                <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>Track payments, balances and due dates in one place.</p>
              </div>
              {linkedStudents.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '16px 20px', backdropFilter: 'blur(10px)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900' }}>
                    {(linkedStudents.find(c => c.id === selectedChildId)?.firstName || '?')[0]}
                  </div>
                  <PremiumSelect 
                    value={selectedChildId} 
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    options={linkedStudents.map(c => ({
                      value: c.id,
                      label: `${c.firstName} ${c.lastName} — ${c.grade}`
                    }))}
                    placeholder="Select Scholar"
                  />
                </div>
              )}
            </div>
          )}

          {/* Stats Overview */}
          <div className="responsive-grid-3" style={{ marginBottom: '24px' }}>
            <StatCard 
              title={isParent ? 'Amount Paid' : isStudent ? 'Total Paid' : 'Total Collected'}
              value={`₵ ${stats.totalPaid.toLocaleString()}`}
              icon={<Icons.TrendingUp />}
              gradient="linear-gradient(135deg, #00843e 0%, #059669 100%)"
              loading={loading}
            />
            <StatCard 
              title={isParent ? 'Outstanding Balance' : isStudent ? 'Outstanding Balance' : 'Total Pending'}
              value={`₵ ${stats.totalPending.toLocaleString()}`}
              icon={<Icons.Wallet />}
              gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
              loading={loading}
            />
            <StatCard 
              title={isParent ? 'Overdue' : isStudent ? 'Overdue' : 'Overdue Amount'}
              value={`₵ ${stats.totalOverdue.toLocaleString()}`}
              icon={<Icons.AlertCircle />}
              color="#ef4444"
              loading={loading}
            />
          </div>


          {/* Quick Access Cards - Unified Financial Matrix */}
          <div className="responsive-grid-3" style={{ gap: '24px', marginBottom: '24px' }}>
            <QuickActionCard 
              title="Fee Structure"
              desc="Configure institutional fee tiers, scholarships, and academic terms."
              icon={<Icons.FileText />}
              color="#f59e0b"
              onClick={() => navigate('/fees/structure')}
            />
            <QuickActionCard 
              title="Fee Collection"
              desc="Initiate and synchronize student fee payments with the ledger."
              icon={<Icons.Plus />}
              color="#00843e"
              onClick={() => navigate('/fees/collection')}
            />
            <QuickActionCard 
              title="Payments"
              desc="Review comprehensive transaction history and successful receipts."
              icon={<Icons.CreditCard />}
              color="#3b82f6"
              onClick={() => {
                const table = document.getElementById('transaction-history');
                if (table) table.scrollIntoView({ behavior: 'smooth' });
              }}
            />
            {!isParent && !isStudent && (
              <>
                <QuickActionCard 
                  title="Expenses" 
                  desc="Administer institutional operational costs and expenditure." 
                  icon={<Icons.TrendingUp />} 
                  color="#f43f5e" 
                  onClick={() => navigate('/fees/expenses')} 
                />
                <QuickActionCard 
                  title="Income" 
                  desc="Analyze revenue vectors and fiscal growth trends." 
                  icon={<Icons.PieChart />} 
                  color="#10b981" 
                  onClick={() => navigate('/fees/income')} 
                />
              </>
            )}
          </div>


          {/* Recent Transactions */}
          <div id="transaction-history" className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--brand-slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{isParent ? 'Recent Payments' : isStudent ? 'My Payment History' : 'Transaction History'}</h2>
              <button style={{ color: 'var(--brand-green)', backgroundColor: 'transparent', border: 'none', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}>View Report</button>
            </div>
            <div style={{ padding: '24px 32px 32px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--brand-slate-50)' }}>
                    <th className="premium-th">{isParent || isStudent ? 'Student' : 'Identity Node'}</th>
                    <th className="premium-th">{isParent || isStudent ? 'Payment Method' : 'Vector Protocol'}</th>
                    <th className="premium-th">Amount (₵)</th>
                    <th className="premium-th">Status</th>
                    <th className="premium-th">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}><td colSpan={5} style={{ padding: '24px' }}><div className="premium-loader" style={{ margin: '0 auto' }}></div></td></tr>
                    ))
                  ) : filteredFees.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '80px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>{isParent ? 'No payment records found for your child.' : isStudent ? 'No payment records found.' : 'No fiscal records detected in registry.'}</td></tr>
                  ) : filteredFees.slice(0, 8).map((fee, idx) => (
                    <tr key={idx} className="premium-row" style={{ borderBottom: '1px solid var(--brand-slate-100)' }}>
                      <td style={{ padding: '20px 32px' }}>
                        <p style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                          {fee.student?.first_name ? `${fee.student.first_name} ${fee.student.last_name}` : fee.student_name || 'N/A'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', fontWeight: '600' }}>Level: {fee.student?.grade || fee.grade || 'N/A'}</p>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#475569', margin: 0 }}>{fee.payment_method || 'Electronic Transfer'}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0', fontWeight: '800', textTransform: 'uppercase' }}>{fee.receipt_number || 'TRX-NODE'}</p>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{(parseFloat(fee.amount) || 0).toLocaleString()}</p>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <span style={{ 
                          padding: '6px 14px', 
                          borderRadius: '10px', 
                          fontSize: '11px', 
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          backgroundColor: (fee.status === 'completed' || fee.status === 'paid' || fee.status === 'Paid') ? '#ecfdf5' : '#fffbeb',
                          color: (fee.status === 'completed' || fee.status === 'paid' || fee.status === 'Paid') ? '#065f46' : '#854d0e',
                          border: `1px solid ${(fee.status === 'completed' || fee.status === 'paid' || fee.status === 'Paid') ? '#d1fae5' : '#fef08a'}`
                        }}>
                          {fee.status}
                        </span>
                      </td>
                      <td style={{ padding: '20px 32px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                        {new Date(fee.payment_date || fee.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </main>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, gradient, loading }) => (
  <div style={{ 
    background: gradient || 'white', 
    borderRadius: '24px', 
    padding: '28px', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.04)', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '20px',
    border: '1px solid rgba(255,255,255,0.8)',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ 
      width: '64px', 
      height: '64px', 
      borderRadius: '20px', 
      backgroundColor: gradient ? 'rgba(255,255,255,0.2)' : `${color}15`, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      color: gradient ? 'white' : color,
      backdropFilter: gradient ? 'blur(10px)' : 'none'
    }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '13px', fontWeight: '600', color: gradient ? 'rgba(255,255,255,0.8)' : '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
      {loading ? (
        <div style={{ width: '100px', height: '32px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }}></div>
      ) : (
        <p style={{ fontSize: '28px', fontWeight: '800', color: gradient ? 'white' : '#1e293b', margin: 0 }}>{value}</p>
      )}
    </div>
  </div>
);

const QuickActionCard = ({ title, desc, icon, color, onClick }) => (
  <div 
    onClick={onClick}
    style={{ 
      backgroundColor: 'white', 
      padding: '28px', 
      borderRadius: '24px', 
      border: '1px solid #f1f5f9', 
      cursor: 'pointer', 
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
      position: 'relative', 
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
    }}
    onMouseOver={(e) => { 
      e.currentTarget.style.transform = 'translateY(-8px)'; 
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.boxShadow = `0 20px 40px ${color}10`;
    }}
    onMouseOut={(e) => { 
      e.currentTarget.style.transform = 'translateY(0)'; 
      e.currentTarget.style.borderColor = '#f1f5f9';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)';
    }}
  >
    <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: `${color}10`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>{icon}</div>
    <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px' }}>{title}</h4>
    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>{desc}</p>
    <div style={{ position: 'absolute', right: '28px', top: '28px', color: '#cbd5e1' }}><Icons.ArrowUpRight /></div>
  </div>
);

export default Fees;
