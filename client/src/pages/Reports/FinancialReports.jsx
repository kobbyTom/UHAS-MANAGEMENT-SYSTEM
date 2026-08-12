import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { settingsAPI } from '../../services/api';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import UbsLogo from '../../assets/UBS.png';
import RLogo from '../../assets/R.png';

const FinancialReports = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Financial Report');
  const [loading, setLoading] = useState(false);
  const printRef = React.useRef(null);
  
  const [reportData, setReportData] = useState({
    schoolName: 'UHAS Basic School',
    academicYear: '2024/2025',
    term: 'First Term',
    date: new Date().toLocaleDateString(),
    stats: {
      revenue: { value: '45,230', change: '+12.5%', color: '#00843e', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      expenses: { value: '12,840', change: '-2.4%', color: '#ef4444', icon: 'M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
      outstanding: { value: '8,120', change: '+5.2%', color: '#f59e0b', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
      net: { value: '32,390', change: '+18.3%', color: '#3b82f6', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
    },
    collectionStatus: [
      { label: 'Tuition Fees', percentage: 85, color: '#00843e' },
      { label: 'Transportation', percentage: 62, color: '#3b82f6' },
      { label: 'Library & Labs', percentage: 94, color: '#8b5cf6' },
      { label: 'Extra Curricular', percentage: 45, color: '#f59e0b' }
    ],
    chartData: [
      { name: 'Tuition', value: 42500, color: '#00843e' },
      { name: 'Transport', value: 6200, color: '#3b82f6' },
      { name: 'Library', value: 4700, color: '#8b5cf6' },
      { name: 'Extras', value: 3600, color: '#f59e0b' }
    ]
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsAPI.getSettings();
        if (response?.data?.settings?.schoolName) {
          setReportData(prev => ({ ...prev, schoolName: response.data.settings.schoolName }));
        }
      } catch (e) { console.warn('Could not fetch settings'); }
    };
    fetchSettings();
  }, []);

  const handleLogout = async () => {
    try { await logout(); } finally { 
      localStorage.removeItem('authToken'); 
      localStorage.removeItem('authUser'); 
      navigate('/login'); 
    }
  };

  const handleDownloadPdf = async () => {
    setLoading(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
      pdf.save(`Financial-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <main>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>Financial Reporting</h1>
              <p style={{ fontSize: '15px', color: '#64748b', marginTop: '6px' }}>Analyze school revenue, expenses, and fee collection performance.</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => window.print()}
                style={{ padding: '12px 24px', backgroundColor: 'white', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
                Print Report
              </button>
              <button 
                onClick={handleDownloadPdf}
                disabled={loading}
                style={{ padding: '12px 24px', backgroundColor: '#00843e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(0, 132, 62, 0.2)', opacity: loading ? 0.7 : 1 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                {loading ? 'Generating...' : 'Export PDF'}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="responsive-grid-4" style={{ marginBottom: '24px' }}>
            <PremiumStatCard title="Total Revenue" value={`GH₵ ${reportData.stats.revenue.value}`} change={reportData.stats.revenue.change} color="#00843e" icon={reportData.stats.revenue.icon} />
            <PremiumStatCard title="Total Expenses" value={`GH₵ ${reportData.stats.expenses.value}`} change={reportData.stats.expenses.change} color="#ef4444" icon={reportData.stats.expenses.icon} />
            <PremiumStatCard title="Outstanding Fees" value={`GH₵ ${reportData.stats.outstanding.value}`} change={reportData.stats.outstanding.change} color="#f59e0b" icon={reportData.stats.outstanding.icon} />
            <PremiumStatCard title="Net Position" value={`GH₵ ${reportData.stats.net.value}`} change={reportData.stats.net.change} color="#3b82f6" icon={reportData.stats.net.icon} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            {/* Revenue Visualization */}
            <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Revenue Analysis by Category</h3>
                <select style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '600', color: '#64748b', outline: 'none' }}>
                  <option>Current Term</option>
                  <option>Previous Term</option>
                  <option>Academic Year</option>
                </select>
              </div>
              <div style={{ height: '350px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `₵${val / 1000}k`} />
                    <Tooltip cursor={{ fill: '#ffffff' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                      {reportData.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Collection Status */}
            <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '24px' }}>Collection Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {reportData.collectionStatus.map((item, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>{item.label}</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: item.color }}>{item.percentage}%</span>
                    </div>
                    <div style={{ height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.percentage}%`, backgroundColor: item.color, borderRadius: '5px', transition: 'width 1s ease-out' }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
                  <strong>Tip:</strong> Collection for <span style={{ color: '#ef4444', fontWeight: '700' }}>Extra Curricular</span> is below target. Consider sending automated reminders.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Hidden Official Report for PDF/Print */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div ref={printRef} style={{ width: '800px', padding: '50px', backgroundColor: 'white', color: 'black', fontFamily: "'Times New Roman', serif" }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px', marginBottom: '40px', borderBottom: '4px solid #000', paddingBottom: '20px' }}>
              <img src={RLogo} alt="UBS Logo" style={{ width: '100px', height: '100px' }} />
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>{reportData.schoolName}</h1>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '10px 0', borderBottom: '2px solid #000', display: 'inline-block', padding: '0 20px' }}>FINANCIAL SUMMARY REPORT</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', fontWeight: '700', fontSize: '15px', marginTop: '15px' }}>
                  <span>ACADEMIC YEAR: {reportData.academicYear}</span>
                  <span>TERM: {reportData.term}</span>
                </div>
              </div>
              <img src={UbsLogo} alt="Logo" style={{ width: '100px', height: '100px' }} />
            </div>

            <div className="responsive-grid-3" style={{ marginBottom: '40px' }}>
              <div style={{ padding: '20px', border: '2px solid #000', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Total Revenue</p>
                <p style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>GH₵ {reportData.stats.revenue.value}</p>
              </div>
              <div style={{ padding: '20px', border: '2px solid #000', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Total Expenses</p>
                <p style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>GH₵ {reportData.stats.expenses.value}</p>
              </div>
              <div style={{ padding: '20px', border: '2px solid #000', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Net Position</p>
                <p style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>GH₵ {reportData.stats.net.value}</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', border: '3px solid #000', marginBottom: '60px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '2px solid #000', padding: '15px', textAlign: 'left', fontSize: '14px' }}>REVENUE CATEGORY</th>
                  <th style={{ border: '2px solid #000', padding: '15px', textAlign: 'right', fontSize: '14px' }}>ACTUAL AMOUNT (GH₵)</th>
                  <th style={{ border: '2px solid #000', padding: '15px', textAlign: 'center', fontSize: '14px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {reportData.chartData.map((cat, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #000', padding: '15px', fontWeight: '700', fontSize: '14px' }}>{cat.name.toUpperCase()}</td>
                    <td style={{ border: '1px solid #000', padding: '15px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>{cat.value.toLocaleString()}.00</td>
                    <td style={{ border: '1px solid #000', padding: '15px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>COLLECTED</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#f9f9f9', fontWeight: '900' }}>
                  <td style={{ border: '2px solid #000', padding: '15px', fontSize: '16px' }}>GRAND TOTAL</td>
                  <td style={{ border: '2px solid #000', padding: '15px', textAlign: 'right', fontSize: '16px' }}>GH₵ {reportData.stats.revenue.value}.00</td>
                  <td style={{ border: '2px solid #000', padding: '15px' }}></td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-between', padding: '0 50px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '2px solid #000', width: '250px', marginBottom: '10px' }}></div>
                <p style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>Finance Officer's Signature</p>
                <p style={{ fontSize: '11px', color: '#666' }}>Date: ____________________</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '2px solid #000', width: '250px', marginBottom: '10px' }}></div>
                <p style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>Head Teacher's Signature</p>
                <p style={{ fontSize: '11px', color: '#666' }}>Date: ____________________</p>
              </div>
            </div>

            <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              This report is electronically generated on {reportData.date} • UBS-RMS Financial Module
            </div>
          </div>
        </div>

        <style>{`
          @media print { .no-print { display: none !important; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
    </div>
  );
};

const PremiumStatCard = ({ title, value, change, color, icon }) => (
  <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', animation: 'slideUp 0.4s ease-out' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: `${color}10`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={icon}/></svg>
      </div>
      <span style={{ fontSize: '12px', fontWeight: '800', padding: '6px 12px', borderRadius: '10px', backgroundColor: change.startsWith('+') ? '#ecfdf5' : '#fef2f2', color: change.startsWith('+') ? '#10b981' : '#ef4444' }}>
        {change}
      </span>
    </div>
    <p style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>{title}</p>
    <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: 0 }}>{value}</h3>
  </div>
);

export default FinancialReports;
