import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { settingsAPI, staffAPI } from '../../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import UbsLogo from '../../assets/UBS.png';
import RLogo from '../../assets/R.png';

const StaffReports = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Reports');
  const [reportType, setReportType] = useState('attendance');
  const [loading, setLoading] = useState(false);
  const printRef = React.useRef(null);
  
  const [reportData, setReportData] = useState({
    schoolName: 'UHAS Basic School',
    academicYear: '2024/2025',
    date: new Date().toLocaleDateString(),
    stats: {
      total: { value: '42', change: '+2', color: '#3b82f6', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
      present: { value: '38', change: '90.4%', color: '#00843e', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      onLeave: { value: '3', change: '-1', color: '#f59e0b', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      performance: { value: '92%', change: '+3.4%', color: '#8b5cf6', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
    },
    attendanceTrend: [
      { day: 'Mon', rate: 95 },
      { day: 'Tue', rate: 98 },
      { day: 'Wed', rate: 92 },
      { day: 'Thu', rate: 96 },
      { day: 'Fri', rate: 90 }
    ],
    roleDistribution: [
      { name: 'Teaching', value: 28, color: '#00843e' },
      { name: 'Admin', value: 6, color: '#3b82f6' },
      { name: 'Support', value: 8, color: '#f59e0b' }
    ],
    staffList: [
      { name: 'John Smith', role: 'Mathematics Teacher', attendance: '98%', absent: 1, status: 'Excellent', avatar: 'JS' },
      { name: 'Sarah Wilson', role: 'English Teacher', attendance: '94%', absent: 3, status: 'Good', avatar: 'SW' },
      { name: 'Robert Brown', role: 'Physics Teacher', attendance: '88%', absent: 6, status: 'Needs Improvement', avatar: 'RB' },
      { name: 'Linda Davis', role: 'Admin Officer', attendance: '100%', absent: 0, status: 'Perfect', avatar: 'LD' }
    ]
  });

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      if (response?.data?.settings?.schoolName) {
        setReportData(prev => ({ ...prev, schoolName: response.data.settings.schoolName }));
      }
    } catch (e) { console.warn('Could not fetch settings'); }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await staffAPI.getStats();
      if (res.data?.success) {
        setReportData(prev => ({
          ...prev,
          stats: res.data.data.stats,
          attendanceTrend: res.data.data.attendanceTrend,
          roleDistribution: res.data.data.roleDistribution,
          staffList: res.data.data.staffList
        }));
      }
    } catch (error) {
      console.error('Error fetching staff stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchData();
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
      pdf.save(`Staff-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <main>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', backgroundColor: '#fefce8', color: '#854d0e', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Institutional Intelligence</span>
                <span style={{ color: '#94a3b8' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg></span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Faculty Analytics</span>
              </div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' }}>Staff <span style={{ color: 'var(--brand-green)' }}>Reporting</span></h1>
              <p style={{ fontSize: '16px', color: '#475569', marginTop: '8px', fontWeight: '500' }}>Comprehensive faculty performance metrics and temporal attendance vectors.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => window.print()}
                className="premium-btn-secondary"
                style={{ padding: '12px 24px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
                Print Manifest
              </button>
              <button 
                onClick={handleDownloadPdf}
                disabled={loading}
                className="premium-btn-primary"
                style={{ padding: '12px 24px' }}
              >
                {loading ? <div className="premium-loader" style={{ width: '18px', height: '18px', borderColor: 'white', borderTopColor: 'transparent' }}></div> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>}
                {loading ? 'Compiling...' : 'Export Intelligence'}
              </button>
            </div>
          </div>


          <div style={{ display: 'flex', gap: '8px', marginBottom: '40px', backgroundColor: 'var(--brand-slate-100)', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
            {['attendance', 'performance', 'leave'].map(type => (
              <button 
                key={type}
                onClick={() => setReportType(type)}
                style={{ 
                  padding: '10px 24px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: '800', 
                  textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: reportType === type ? 'white' : 'transparent',
                  color: reportType === type ? 'var(--brand-green)' : '#64748b',
                  boxShadow: reportType === type ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                }}
              >{type} Vector</button>
            ))}
          </div>


          {/* Stats Grid */}
          <div className="responsive-grid-4" style={{ marginBottom: '40px' }}>
            <ReportStatCard title="Total Staff" value={reportData.stats.total.value} change={reportData.stats.total.change} color={reportData.stats.total.color} icon={reportData.stats.total.icon} />
            <ReportStatCard title="Present Today" value={reportData.stats.present.value} change={reportData.stats.present.change} color={reportData.stats.present.color} icon={reportData.stats.present.icon} />
            <ReportStatCard title="On Leave" value={reportData.stats.onLeave.value} change={reportData.stats.onLeave.change} color={reportData.stats.onLeave.color} icon={reportData.stats.onLeave.icon} />
            <ReportStatCard title="Performance Avg" value={reportData.stats.performance.value} change={reportData.stats.performance.change} color={reportData.stats.performance.color} icon={reportData.stats.performance.icon} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '40px' }}>
            {/* Attendance Trend */}
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Temporal Attendance Flux</h3>
                <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '1px' }}>Weekly Aggregate</span>
              </div>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '16px' }} 
                      itemStyle={{ fontWeight: '800', fontSize: '14px' }}
                    />
                    <Line type="monotone" dataKey="rate" stroke="var(--brand-green)" strokeWidth={4} dot={{ r: 6, fill: 'white', strokeWidth: 3, stroke: 'var(--brand-green)' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="glass-card" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '32px', letterSpacing: '-0.5px' }}>Institutional Composition</h3>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reportData.roleDistribution} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value">
                      {reportData.roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: '24px', textAlign: 'center', backgroundColor: 'var(--brand-slate-50)', padding: '12px', borderRadius: '14px', border: '1px solid var(--brand-slate-100)' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '700' }}>Faculty Nexus Capacity: <strong style={{ color: '#0f172a', fontSize: '14px' }}>42</strong></p>
              </div>
            </div>
          </div>


          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '28px 32px', borderBottom: '1px solid var(--brand-slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Performance Intelligence Matrix</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ padding: '6px 14px', backgroundColor: 'var(--brand-slate-50)', color: '#64748b', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Consolidated Manifest</span>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--brand-slate-50)' }}>
                    <th className="premium-th">Faculty Node</th>
                    <th className="premium-th">Security Role</th>
                    <th className="premium-th" style={{ textAlign: 'center' }}>Temporal Sync</th>
                    <th className="premium-th" style={{ textAlign: 'center' }}>Absence Nodes</th>
                    <th className="premium-th" style={{ textAlign: 'right' }}>Clearance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.staffList.map((staff, i) => (
                    <tr key={i} className="premium-row" style={{ borderBottom: '1px solid var(--brand-slate-100)' }}>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--brand-slate-100)', color: 'var(--brand-slate-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900' }}>{staff.avatar}</div>
                          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>{staff.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 32px', color: '#475569', fontSize: '14px', fontWeight: '600' }}>{staff.role}</td>
                      <td style={{ padding: '20px 32px', textAlign: 'center' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>{staff.attendance}</div>
                      </td>
                      <td style={{ padding: '20px 32px', textAlign: 'center' }}>
                        <span style={{ color: staff.absent > 3 ? '#ef4444' : '#64748b', fontWeight: '800' }}>{staff.absent}</span>
                      </td>
                      <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                        <span style={{ 
                          padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px',
                          backgroundColor: staff.status === 'Excellent' || staff.status === 'Perfect' ? '#ecfdf5' : staff.status === 'Good' ? '#eff6ff' : '#fef2f2',
                          color: staff.status === 'Excellent' || staff.status === 'Perfect' ? '#065f46' : staff.status === 'Good' ? '#1d4ed8' : '#991b1b',
                          border: `1px solid ${staff.status === 'Excellent' || staff.status === 'Perfect' ? '#d1fae5' : staff.status === 'Good' ? '#dbeafe' : '#fee2e2'}`
                        }}>{staff.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>

        {/* Hidden Official Report for PDF/Print */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div ref={printRef} style={{ width: '800px', padding: '50px', backgroundColor: 'white', color: 'black', fontFamily: "'Times New Roman', serif" }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px', marginBottom: '40px', borderBottom: '4px solid #000', paddingBottom: '20px' }}>
              <img src={RLogo} alt="Logo" style={{ width: '100px', height: '100px' }} />
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>{reportData.schoolName}</h1>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '10px 0', borderBottom: '2px solid #000', display: 'inline-block', padding: '0 20px' }}>STAFF PERFORMANCE & ATTENDANCE REPORT</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', fontWeight: '700', fontSize: '15px', marginTop: '15px' }}>
                  <span>ACADEMIC YEAR: {reportData.academicYear}</span>
                  <span>DATE: {reportData.date}</span>
                </div>
              </div>
              <img src={UbsLogo} alt="Logo" style={{ width: '100px', height: '100px' }} />
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', border: '3px solid #000', marginBottom: '60px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '2px solid #000', padding: '15px', textAlign: 'left' }}>STAFF NAME</th>
                  <th style={{ border: '2px solid #000', padding: '15px', textAlign: 'left' }}>ROLE / DESIGNATION</th>
                  <th style={{ border: '2px solid #000', padding: '15px', textAlign: 'center' }}>ATTENDANCE</th>
                  <th style={{ border: '2px solid #000', padding: '15px', textAlign: 'center' }}>ABSENCES</th>
                  <th style={{ border: '2px solid #000', padding: '15px', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {reportData.staffList.map((staff, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #000', padding: '15px', fontWeight: '700' }}>{staff.name}</td>
                    <td style={{ border: '1px solid #000', padding: '15px' }}>{staff.role}</td>
                    <td style={{ border: '1px solid #000', padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>{staff.attendance}</td>
                    <td style={{ border: '1px solid #000', padding: '15px', textAlign: 'center' }}>{staff.absent}</td>
                    <td style={{ border: '1px solid #000', padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>{staff.status.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-between', padding: '0 50px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '2px solid #000', width: '250px', marginBottom: '10px' }}></div>
                <p style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>Administrator's Signature</p>
                <p style={{ fontSize: '11px', color: '#666' }}>Date: ____________________</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '2px solid #000', width: '250px', marginBottom: '10px' }}></div>
                <p style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>Head Teacher's Signature</p>
                <p style={{ fontSize: '11px', color: '#666' }}>Date: ____________________</p>
              </div>
            </div>

            <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              This report is electronically generated on {reportData.date} • Staff Management Module
            </div>
          </div>
        </div>

        <style>{`
          @media print { .no-print { display: none !important; } }
          @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
    </div>
  );
};

const ReportStatCard = ({ title, value, change, color, icon }) => (
  <div className="glass-card" style={{ padding: '32px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', animation: 'slideIn 0.4s ease-out' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: `${color}10`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={icon}/></svg>
      </div>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: '900', 
        padding: '6px 12px', 
        borderRadius: '10px', 
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        backgroundColor: change.includes('+') || change.includes('%') ? '#ecfdf5' : '#fef2f2', 
        color: change.includes('+') || change.includes('%') ? '#065f46' : '#991b1b',
        border: `1px solid ${change.includes('+') || change.includes('%') ? '#d1fae5' : '#fee2e2'}`
      }}>
        {change}
      </span>
    </div>
    <p style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</p>
    <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{value}</h3>
  </div>
);


export default StaffReports;
