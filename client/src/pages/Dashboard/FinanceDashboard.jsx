import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { feeAPI, studentAPI, paymentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell
} from 'recharts';



// Statistics Card
const StatCard = ({ icon, title, value, color, loading, subtitle, gradient }) => (
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
        <p style={{ fontSize: '28px', fontWeight: '800', color: gradient ? 'white' : '#1e293b', margin: 0 }}>{value || 0}</p>
      )}
      {subtitle && <p style={{ fontSize: '12px', color: gradient ? 'rgba(255,255,255,0.7)' : '#94a3b8', marginTop: '4px' }}>{subtitle}</p>}
    </div>
  </div>
);

// Payment History Table
const PaymentTable = ({ payments, loading }) => (
  <div style={{ padding: '20px' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
          <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Receipt #</th>
          <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Student</th>
          <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Amount</th>
          <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Status</th>
          <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Date</th>
        </tr>
      </thead>
      <tbody>
        {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan="5" style={{ padding: '14px' }}><div style={{ height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}></div></td></tr>) : payments?.length > 0 ? payments.map((payment, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '14px 8px', fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{payment.receipt_number || payment.transaction_id?.substring(0, 8) || `TXN-${i + 1}`}</td>
            <td style={{ padding: '14px 8px', fontSize: '13px', color: '#64748b' }}>
              {payment.student?.first_name ? `${payment.student.first_name} ${payment.student.last_name}` : payment.student_name || 'N/A'}
            </td>
            <td style={{ padding: '14px 8px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>₵ {(parseFloat(payment.amount) || 0).toLocaleString()}</td>
            <td style={{ padding: '14px 8px' }}>
              <span style={{ 
                padding: '4px 8px', 
                borderRadius: '12px', 
                fontSize: '11px', 
                fontWeight: '600', 
                textTransform: 'uppercase',
                backgroundColor: (payment.status === 'completed' || payment.status === 'paid' || payment.status === 'Paid') ? '#dcfce7' : '#fef9c3', 
                color: (payment.status === 'completed' || payment.status === 'paid' || payment.status === 'Paid') ? '#166534' : '#854d0e' 
              }}>
                {payment.status}
              </span>
            </td>
            <td style={{ padding: '14px 8px', fontSize: '13px', color: '#64748b' }}>{new Date(payment.payment_date || payment.createdAt).toLocaleDateString()}</td>
          </tr>
        )) : <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No payment records</td></tr>}
      </tbody>
    </table>
  </div>
);

// Pending Payments
const PendingPayments = ({ payments, loading }) => (
  <div style={{ padding: '20px' }}>
    {loading ? [...Array(3)].map((_, i) => <div key={i} style={{ padding: '16px', marginBottom: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}></div>) : payments?.length > 0 ? payments.map((payment, i) => (
      <div key={i} style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '10px', marginBottom: i < payments.length - 1 ? '12px' : '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
            {payment.student?.first_name ? `${payment.student.first_name} ${payment.student.last_name}` : payment.student_name || 'N/A'}
          </h4>
          <p style={{ fontSize: '12px', color: '#b45309' }}>Grade: {payment.student?.grade || payment.grade || 'N/A'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '16px', fontWeight: '700', color: '#92400e' }}>₵ {(parseFloat(payment.amount) || 0).toLocaleString()}</p>
          <button style={{ padding: '4px 12px', backgroundColor: '#facc15', color: '#1e293b', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}>Remind</button>
        </div>
      </div>
    )) : <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No pending payments</div>}
  </div>
);

// Collection Chart (Simple Bar Chart)
const CollectionChart = ({ data, loading }) => {
  const defaultData = [
    { month: 'Jul', collected: 45000, pending: 12000 },
    { month: 'Aug', collected: 52000, pending: 8000 },
    { month: 'Sep', collected: 48000, pending: 15000 },
    { month: 'Oct', collected: 61000, pending: 9000 },
    { month: 'Nov', collected: 55000, pending: 11000 },
    { month: 'Dec', collected: 67000, pending: 7000 },
  ];

  const chartData = data?.length > 0 ? data : defaultData;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <p style={{ fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ fontSize: '12px', color: entry.color, margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }}></span>
              {entry.name}: ₵ {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '20px', height: '350px', width: '100%', position: 'relative', minWidth: '0' }}>
      {loading ? (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
        </div>
      ) : (
        <ResponsiveContainer width="99%" height={300} debounce={50}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => `₵${value > 1000 ? (value / 1000) + 'k' : value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '13px', color: '#64748b' }}
            />
            <Bar 
              dataKey="collected" 
              name="Collected" 
              fill="#00843e" 
              radius={[6, 6, 0, 0]} 
              barSize={32}
            />
            <Bar 
              dataKey="pending" 
              name="Pending" 
              fill="#facc15" 
              radius={[6, 6, 0, 0]} 
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#ffffff' }}><div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTop: '4px solid #00843e', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></div>;
  if (!isAuthenticated) return null;

  const [stats, setStats] = useState({ totalCollected: 0, totalPending: 0, students: 0, transactions: 0 });
  const [payments, setPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storedUser, setStoredUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) { try { setStoredUser(JSON.parse(savedUser)); } catch (e) {} }
  }, []);

  const handleLogout = async () => {
    try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch stats and payments separately to be more robust
      const statsRes = await feeAPI.getStats();
      if (statsRes.data?.success) {
        const data = statsRes.data.data;
        setStats({
          totalCollected: data.totalCollected || 0,
          totalPending: data.totalPending || 0,
          students: data.studentsCount || 0,
          transactions: data.transactionsCount || 0
        });
        setChartData(data.chartData || []);
      }

      const paymentsRes = await paymentAPI.getAll({ limit: 10 });
      if (paymentsRes.data?.success) {
        const data = paymentsRes.data.data || [];
        setPayments(data);
        setPendingPayments(data.filter(f => f.status !== 'completed' && f.status !== 'paid' && f.status !== 'Paid'));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    setLoading(true);
    // Simulate report generation
    setTimeout(() => {
      const reportData = [
        ['Date', 'Receipt', 'Student', 'Amount', 'Status'],
        ...payments.map(p => [
          new Date(p.paymentDate || p.createdAt).toLocaleDateString(),
          p.receiptNumber || 'N/A',
          p.student?.firstName ? `${p.student.firstName} ${p.student.lastName}` : 'N/A',
          p.amount,
          p.status
        ])
      ];

      const csvContent = "data:text/csv;charset=utf-8," 
        + reportData.map(e => e.join(",")).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Finance_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setLoading(false);
      alert('Finance report generated and downloaded successfully!');
    }, 1500);
  };

  const currentUser = storedUser || user;

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      <main>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>Finance Dashboard</h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Welcome back, {currentUser?.firstName}!</p>
          </div>

          <div className="responsive-grid-4" style={{ marginBottom: '24px' }}>
            <StatCard 
              icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} 
              title="Total Collected" 
              value={`₵${stats.totalCollected.toLocaleString()}`} 
              gradient="linear-gradient(135deg, #00843e 0%, #00a854 100%)"
              loading={loading} 
              subtitle="+12% from last month"
            />
            <StatCard 
              icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>} 
              title="Total Pending" 
              value={`₵${stats.totalPending.toLocaleString()}`} 
              gradient="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
              loading={loading} 
              subtitle="Action required"
            />
            <StatCard 
              icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} 
              title="Active Students" 
              value={stats.students} 
              color="#00843e"
              loading={loading} 
              subtitle="Enrolled this session"
            />
            <StatCard 
              icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>} 
              title="Transactions" 
              value={stats.transactions} 
              color="#f59e0b"
              loading={loading} 
              subtitle="Total this month"
            />
          </div>

          <div className="responsive-grid-2" style={{ gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}><h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Fee Collection Overview</h2></div>
                <CollectionChart data={chartData} loading={loading} />
              </div>
              
              <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}><h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Recent Transactions</h2></div>
                <PaymentTable payments={payments} loading={loading} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}><h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Pending Payments</h2></div>
                <PendingPayments payments={pendingPayments} loading={loading} />
              </div>
              
              <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button style={{ padding: '12px 16px', backgroundColor: '#00843e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                    Create Invoice
                  </button>
                  <button style={{ padding: '12px 16px', backgroundColor: '#00843e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                    Record Payment
                  </button>
                  <button 
                    onClick={handleGenerateReport}
                    disabled={loading}
                    style={{ padding: '12px 16px', backgroundColor: '#facc15', color: '#1e293b', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    {loading ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
      </main>
    </div>
  );
};

export default FinanceDashboard;

