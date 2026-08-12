import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incomeAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

// Premium Icon Components
const Icons = {
  TrendingUp: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Activity: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  PieChart: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>,
};

const Income = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Finance');
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, currentMonthRevenue: 0, sourceDiversity: 'High' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    description: '',
    category: 'Grant',
    amount: '',
    source: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Received'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [incomeRes, statsRes] = await Promise.all([
        incomeAPI.getAll({ limit: 100 }),
        incomeAPI.getStats()
      ]);
      if (incomeRes.data?.success) setIncome(incomeRes.data.data);
      if (statsRes.data?.success) setStats(statsRes.data.data);
    } catch (error) {
      console.error('Error fetching income:', error);
      setError('The income table is missing or the server is down. Please check your database.');
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
      const res = await incomeAPI.create(formData);
      if (res.data.success) {
        setShowModal(false);
        fetchData();
        setFormData({
          description: '',
          category: 'Grant',
          amount: '',
          source: '',
          date: new Date().toISOString().split('T')[0],
          status: 'Received'
        });
      }
    } catch (error) {
      console.error('Error recording income:', error);
      alert('Failed to record income. Make sure the table exists.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  const filteredIncome = income.filter(i => 
    i.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <main>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Revenue Analysis</h1>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>In-depth view of institutional income, grants, and miscellaneous revenue</p>
            </div>
            {user?.role === 'finance' && (
              <button 
                onClick={() => setShowModal(true)}
                style={{ padding: '12px 24px', backgroundColor: '#00843e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(0, 132, 62, 0.2)' }}
              >
                <Icons.Plus />
                Record Income
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
              title="Total Revenue" 
              value={`₵ ${(stats.totalRevenue || 0).toLocaleString()}`} 
              icon={<Icons.TrendingUp />} 
              gradient="linear-gradient(135deg, #00843e 0%, #10b981 100%)"
              loading={loading}
            />
            <StatCard 
              title="This Month" 
              value={`₵ ${(stats.currentMonthRevenue || 0).toLocaleString()}`} 
              icon={<Icons.Activity />} 
              gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
              loading={loading}
            />
            <StatCard 
              title="Source Diversity" 
              value={stats.sourceDiversity || 'Normal'} 
              icon={<Icons.PieChart />} 
              color="#0ea5e9"
              loading={loading}
            />
          </div>

          {/* Income Table Section */}
          <div style={{ backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fcfcfd' }}>
              <div style={{ position: 'relative', width: '360px' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icons.Search /></div>
                <input 
                  type="text" 
                  placeholder="Search revenue, sources, categories..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px 12px 48px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: 'white', transition: 'all 0.2s' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.Filter />
                  Filter
                </button>
                <button style={{ padding: '10px 20px', backgroundColor: '#1e293b', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: 'white', cursor: 'pointer' }}>Export Data</button>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '20px 32px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Income Detail</th>
                    <th style={{ textAlign: 'left', padding: '20px 32px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Category</th>
                    <th style={{ textAlign: 'left', padding: '20px 32px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '20px 32px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '20px 32px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}><td colSpan={5} style={{ padding: '32px' }}><div style={{ height: '24px', backgroundColor: '#ffffff', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div></td></tr>
                    ))
                  ) : filteredIncome.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '80px', textAlign: 'center' }}>
                      <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Icons.PieChart />
                        <p style={{ margin: 0, fontWeight: '600' }}>No income records found</p>
                      </div>
                    </td></tr>
                  ) : filteredIncome.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #ffffff', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fcfcfd'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '24px 32px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{item.description}</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>{item.source || 'Miscellaneous'}</p>
                      </td>
                      <td style={{ padding: '24px 32px' }}>
                        <span style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#047857', fontSize: '12px', fontWeight: '600' }}>{item.category}</span>
                      </td>
                      <td style={{ padding: '24px 32px' }}>
                        <p style={{ fontSize: '16px', fontWeight: '800', color: '#00843e', margin: 0 }}>₵ {(parseFloat(item.amount) || 0).toLocaleString()}</p>
                      </td>
                      <td style={{ padding: '24px 32px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                        {new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '24px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#059669' }}>{item.status || 'Received'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Record Income Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Record New Revenue</h2>
                <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><Icons.X /></button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Description</label>
                  <input name="description" value={formData.description} onChange={handleInputChange} placeholder="e.g. Government Grant - Q2" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Category</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}>
                      <option>Grant</option>
                      <option>Donation</option>
                      <option>Fundraising</option>
                      <option>Asset Sale</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Amount (₵)</label>
                    <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="0.00" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: '700' }} required />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Source</label>
                  <input name="source" value={formData.source} onChange={handleInputChange} placeholder="e.g. Ministry of Education" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}>
                      <option>Received</option>
                      <option>Pending</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={submitting} style={{ marginTop: '12px', padding: '14px', backgroundColor: '#00843e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0, 132, 62, 0.2)', transition: 'all 0.2s', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Processing...' : 'Record Revenue'}
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

export default Income;
