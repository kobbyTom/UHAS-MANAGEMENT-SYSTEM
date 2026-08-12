import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenseAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

// Premium Icon Components
const Icons = {
  TrendingUp: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  TrendingDown: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  Package: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>,
};

const Expenses = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Finance');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalExpenses: 0, currentMonthExpenses: 0, vendorCount: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    description: '',
    category: 'Utilities',
    amount: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Paid'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [expensesRes, statsRes] = await Promise.all([
        expenseAPI.getAll({ limit: 100 }),
        expenseAPI.getStats()
      ]);
      if (expensesRes.data?.success) setExpenses(expensesRes.data.data);
      if (statsRes.data?.success) setStats(statsRes.data.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('The expenses table is missing or the server is down. Please check your database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await expenseAPI.create(formData);
      if (res.data.success) {
        setShowModal(false);
        fetchData();
        setFormData({
          description: '',
          category: 'Utilities',
          amount: '',
          vendor: '',
          date: new Date().toISOString().split('T')[0],
          status: 'Paid'
        });
      }
    } catch (error) {
      console.error('Error recording expense:', error);
      alert('Failed to record expense. Make sure the table exists.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  const filteredExpenses = expenses.filter(e => 
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <main>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Fiscal Oversight</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Expenditure Ledger</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>School <span style={{ color: '#ef4444' }}>Expenses</span></h1>
              <p style={{ fontSize: '16px', color: '#475569', marginTop: '8px', fontWeight: '500' }}>Comprehensive monitoring of institutional operational costs and vendor liabilities.</p>
            </div>
            {user?.role === 'finance' && (
              <button 
                onClick={() => setShowModal(true)}
                className="premium-btn-primary"
                style={{ backgroundColor: '#ef4444', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.2)' }}
              >
                <Icons.Plus />
                Record Expenditure
              </button>
            )}
          </div>


          {error && (
            <div style={{ padding: '20px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '16px', color: '#991b1b', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{error}</p>
            </div>
          )}

          {/* Stats Overview */}
          <div className="responsive-grid-3" style={{ marginBottom: '24px' }}>
            <StatCard 
              title="Total Expenses" 
              value={`₵ ${(stats.totalExpenses || 0).toLocaleString()}`} 
              icon={<Icons.TrendingDown />} 
              gradient="linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)"
              loading={loading}
            />
            <StatCard 
              title="This Month" 
              value={`₵ ${(stats.currentMonthExpenses || 0).toLocaleString()}`} 
              icon={<Icons.TrendingUp />} 
              gradient="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
              loading={loading}
            />
            <StatCard 
              title="Active Vendors" 
              value={stats.vendorCount || 0} 
              icon={<Icons.Package />} 
              color="#0ea5e9"
              loading={loading}
            />
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--brand-slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--brand-slate-50)' }}>
              <div style={{ position: 'relative', width: '400px' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444' }}><Icons.Search /></div>
                <input 
                  type="text" 
                  placeholder="Analyze expenditures, vendors, categories..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="premium-input"
                  style={{ paddingLeft: '48px', backgroundColor: 'white' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="premium-btn-secondary" style={{ padding: '10px 20px' }}>
                  <Icons.Filter />
                  Temporal Filter
                </button>
                <button className="premium-btn-primary" style={{ padding: '10px 20px', backgroundColor: '#1e293b' }}>Export Manifest</button>
              </div>
            </div>

            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--brand-slate-50)' }}>
                    <th className="premium-th">Expenditure Node</th>
                    <th className="premium-th">Classification</th>
                    <th className="premium-th">Value (₵)</th>
                    <th className="premium-th">Temporal Sync</th>
                    <th className="premium-th">Auth Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}><td colSpan={5} style={{ padding: '32px' }}><div className="premium-loader" style={{ margin: '0 auto', borderColor: '#ef4444' }}></div></td></tr>
                    ))
                  ) : filteredExpenses.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '80px', textAlign: 'center' }}>
                      <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Icons.Package />
                        <p style={{ margin: 0, fontWeight: '800', fontSize: '16px' }}>No expenditure records detected.</p>
                      </div>
                    </td></tr>
                  ) : filteredExpenses.map((e) => (
                    <tr key={e.id} className="premium-row" style={{ borderBottom: '1px solid var(--brand-slate-100)' }}>
                      <td style={{ padding: '24px 32px' }}>
                        <p style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{e.description}</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', fontWeight: '600' }}>Vendor: {e.vendor || 'Institutional Node'}</p>
                      </td>
                      <td style={{ padding: '24px 32px' }}>
                        <span style={{ padding: '6px 14px', borderRadius: '10px', backgroundColor: 'var(--brand-slate-100)', color: 'var(--brand-slate-600)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{e.category}</span>
                      </td>
                      <td style={{ padding: '24px 32px' }}>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{(parseFloat(e.amount) || 0).toLocaleString()}</p>
                      </td>
                      <td style={{ padding: '24px 32px', fontSize: '13px', color: '#64748b', fontWeight: '700' }}>
                        {new Date(e.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '24px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: e.status?.toLowerCase() === 'paid' ? '#10b981' : '#f59e0b' }}></div>
                          <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', color: e.status?.toLowerCase() === 'paid' ? '#065f46' : '#854d0e' }}>{e.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </main>

          {/* Record Expense Modal */}
          {showModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Record New Expense</h2>
                  <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><Icons.X /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Description</label>
                    <input name="description" value={formData.description} onChange={handleInputChange} placeholder="e.g. Electricity Bill - March" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Category</label>
                      <select name="category" value={formData.category} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}>
                        <option>Utilities</option>
                        <option>Maintenance</option>
                        <option>Salaries</option>
                        <option>Supplies</option>
                        <option>Infrastructure</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Amount (₵)</label>
                      <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="0.00" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: '700' }} required />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Vendor / Payee</label>
                    <input name="vendor" value={formData.vendor} onChange={handleInputChange} placeholder="e.g. ECG" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Date</label>
                      <input type="date" name="date" value={formData.date} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Status</label>
                      <select name="status" value={formData.status} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}>
                        <option>Paid</option>
                        <option>Pending</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={submitting} style={{ marginTop: '12px', padding: '14px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)', transition: 'all 0.2s', opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? 'Processing...' : 'Record Expense'}
                  </button>
                </form>
              </div>
            </div>
          )}

          <style>{`
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
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
    border: gradient ? 'none' : '1px solid #e2e8f0',
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

export default Expenses;
