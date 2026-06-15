import { useState, useEffect } from 'react';
import { api } from '../api';
import { fmtDate } from '../utils/date';
import { Users, CalendarDays, Briefcase, Clock, RefreshCw, TrendingUp, ArrowUpRight, Sparkles } from 'lucide-react';
import EmpAvatar from '../components/EmpAvatar';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

/* ── Brand palette ── */
const B = {
  navy:  '#0D1F4E',
  blue:  '#1A6AB4',
  teal:  '#3DC7B3',
  green: '#2DB37A',
  amber: '#F59E0B',
  red:   '#EF4444',
  cloud: '#F4F8FF',
  mist:  '#E8EDF5',
  steel: '#A0AABF',
};

const CHART_FONT = { family: "'Plus Jakarta Sans', sans-serif", size: 11 };
const GRID_COLOR = 'rgba(13,31,78,0.06)';
const TICK_COLOR = B.steel;

/* ── Stat card ── */
function StatCard({ label, value, icon: Icon, gradient, accent, sub, onClick, delay }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: gradient,
        borderRadius: 16,
        padding: '20px 22px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        animation: `dashFadeUp 0.3s cubic-bezier(0.23, 1, 0.32, 1) ${delay * 0.5}s both`,
        transition: 'transform 0.25s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.25s ease',
        boxShadow: '0 4px 20px rgba(13,31,78,0.12)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(13,31,78,0.2)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(13,31,78,0.12)'; }}
    >
      {/* decorative circle */}
      <div style={{
        position: 'absolute', right: -20, top: -20,
        width: 90, height: 90, borderRadius: '50%',
        background: 'rgba(255,255,255,0.07)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 10, bottom: -30,
        width: 70, height: 70, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color="rgba(255,255,255,0.9)" />
        </div>
      </div>

      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 6, fontFamily: "'DM Serif Display', serif" }}>
        {value ?? '—'}
      </div>

      {sub && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowUpRight size={11} color="rgba(255,255,255,0.5)" />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{sub}</span>
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, subtitle, action, children, delay = 0 }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: `1px solid ${B.mist}`,
      overflow: 'hidden',
      boxShadow: '0 4px 18px rgba(13,31,78,0.10), 0 1px 3px rgba(13,31,78,0.06)',
      animation: `dashFadeUp 0.3s cubic-bezier(0.23, 1, 0.32, 1) ${delay * 0.5}s both`,
    }}>
      {(title || action) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 12px',
          borderBottom: `1px solid ${B.mist}`,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: B.navy, letterSpacing: '0.01em' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: B.steel, marginTop: 2 }}>{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function NoData() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: B.steel, fontSize: 13 }}>
      No data available
    </div>
  );
}

export default function Dashboard({ onNavigate, toast }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const d = await api('GET', '/api/dashboard');
      setData(d);
    } catch (e) {
      toast('Failed to load dashboard: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
    try {
      const ai = await api('GET', '/api/ai/insights');
      if (ai.insights?.length) setInsights(ai.insights);
    } catch { /* silent */ }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, gap: 12, color: B.steel, fontSize: 13 }}>
      <div style={{ width: 22, height: 22, border: `2px solid ${B.teal}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading dashboard…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!data) return null;

  const s = data.stats;
  const hasHires  = data.monthly_hires?.data?.some(v => v > 0);
  const hasLeaves = (data.leave_stats?.pending + data.leave_stats?.approved + data.leave_stats?.rejected) > 0;
  const hasDepts  = data.department_breakdown?.length > 0;
  const hasAtt    = data.attendance_stats && Object.values(data.attendance_stats).some(v => v > 0);
  const maxDept   = Math.max(...(data.department_breakdown?.map(d => d.count) || [1]), 1);

  /* ── Chart datasets ── */
  const hiresChartData = {
    labels: data.monthly_hires?.labels || [],
    datasets: [{
      label: 'New Hires',
      data: data.monthly_hires?.data || [],
      borderColor: B.teal,
      backgroundColor: 'rgba(61,199,179,0.08)',
      borderWidth: 2.5,
      pointRadius: 5,
      pointBackgroundColor: '#fff',
      pointBorderColor: B.teal,
      pointBorderWidth: 2,
      fill: true,
      tension: 0.4,
    }],
  };

  const leavesChartData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [{
      data: [data.leave_stats?.pending, data.leave_stats?.approved, data.leave_stats?.rejected],
      backgroundColor: [B.amber, B.green, B.red],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const deptColors = [B.blue, B.teal, B.green, B.amber, '#8B5CF6', '#EC4899', '#F97316', '#06B6D4'];
  const deptsChartData = {
    labels: data.department_breakdown?.map(d => d.name) || [],
    datasets: [{
      label: 'Employees',
      data: data.department_breakdown?.map(d => d.count) || [],
      backgroundColor: deptColors.map(c => c + '28'),
      borderColor: deptColors,
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const attColors = { Present: B.green, Absent: B.red, 'On Leave': B.amber, 'Half Day': B.blue, WFH: '#8B5CF6' };
  const attLabels = Object.keys(data.attendance_stats || {});
  const attChartData = {
    labels: attLabels,
    datasets: [{
      label: 'Days',
      data: attLabels.map(l => data.attendance_stats[l]),
      backgroundColor: attLabels.map(l => (attColors[l] || B.steel) + '30'),
      borderColor: attLabels.map(l => attColors[l] || B.steel),
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const hoverCursor = (event, elements) => {
    if (event.native?.target) event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
  };

  const baseOpts = (axis = true) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, backgroundColor: B.navy, titleFont: CHART_FONT, bodyFont: CHART_FONT, padding: 10, cornerRadius: 8 } },
    onHover: hoverCursor,
    scales: axis ? {
      x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: CHART_FONT } },
      y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: CHART_FONT, stepSize: 1 }, beginAtZero: true },
    } : {},
  });

  const hiresOpts = {
    ...baseOpts(true),
    onClick: (_, elements) => {
      if (!elements.length) return;
      const label = hiresChartData.labels[elements[0].index];
      try {
        const [mon, yr] = label.split(' ');
        const monthIdx = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(mon);
        if (monthIdx !== -1) {
          const ym = `${yr}-${String(monthIdx + 1).padStart(2, '0')}`;
          sessionStorage.setItem('nav-filter', JSON.stringify({ joinedMonth: ym, joinedLabel: label }));
        }
      } catch {}
      onNavigate('employees');
    },
  };

  const leavesOpts = {
    ...baseOpts(false),
    cutout: '65%',
    onClick: (_, elements) => {
      if (!elements.length) return;
      const status = ['Pending', 'Approved', 'Rejected'][elements[0].index];
      sessionStorage.setItem('nav-filter', JSON.stringify({ leaveStatus: status }));
      onNavigate('leaves');
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: CHART_FONT, color: B.steel, padding: 16, boxWidth: 10, usePointStyle: true, pointStyleWidth: 10 },
      },
      tooltip: { mode: 'index', backgroundColor: B.navy, padding: 10, cornerRadius: 8 },
    },
  };

  const deptsOpts = {
    ...baseOpts(true),
    onClick: (_, elements) => {
      if (!elements.length) return;
      const deptName = deptsChartData.labels[elements[0].index];
      sessionStorage.setItem('nav-filter', JSON.stringify({ deptName }));
      onNavigate('employees');
    },
  };

  const attOpts = {
    ...baseOpts(true),
    onClick: () => onNavigate('attendance'),
  };

  const insightStyle = {
    warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: B.amber },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', dot: B.blue },
    success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', dot: B.green },
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const deptBarColors = ['#1A6AB4','#3DC7B3','#2DB37A','#8B5CF6','#F59E0B','#EC4899','#F97316','#06B6D4'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes dashFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .dash-root { font-family: 'Plus Jakarta Sans', sans-serif; }
        .action-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;
          background: ${B.cloud}; border: 1px solid ${B.mist}; color: ${B.navy};
          cursor: pointer; transition: background 0.15s, border-color 0.15s;
          font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: 0.01em;
        }
        .action-btn:hover { background: ${B.mist}; border-color: ${B.steel}; }
        .hire-row { transition: background 0.15s; }
        .hire-row:hover { background: ${B.cloud}; }
      `}</style>

      <div className="dash-root page-content" style={{ background: B.cloud, minHeight: '100%' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, animation: 'dashFadeUp 0.4s ease-out both' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 4, height: 20, borderRadius: 2, background: `linear-gradient(180deg, ${B.blue}, ${B.teal})` }} />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: B.navy, letterSpacing: '-0.01em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Dashboard
              </h1>
            </div>
            <p style={{ fontSize: 12.5, color: B.steel, marginLeft: 12, fontWeight: 400 }}>{dateStr}</p>
          </div>
          <button
            onClick={load}
            className="action-btn"
            style={{ gap: 6 }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
          <StatCard
            label="Active Employees"
            value={s.total_employees}
            icon={Users}
            gradient={`linear-gradient(135deg, ${B.navy} 0%, ${B.blue} 100%)`}
            delay={0.08}
            sub="Total workforce"
            onClick={() => onNavigate('employees')}
          />
          <StatCard
            label="Pending Leaves"
            value={s.pending_leaves}
            icon={CalendarDays}
            gradient={`linear-gradient(135deg, #92400E, ${B.amber})`}
            delay={0.12}
            sub="Awaiting approval"
            onClick={() => { sessionStorage.setItem('nav-filter', JSON.stringify({ leaveStatus: 'Pending' })); onNavigate('leaves'); }}
          />
          {s.cancellation_requests > 0
            ? <StatCard label="Cancel Requests" value={s.cancellation_requests} icon={CalendarDays}
                gradient={`linear-gradient(135deg, #9A3412, #F97316)`} delay={0.16}
                sub="Cancellation pending"
                onClick={() => { sessionStorage.setItem('nav-filter', JSON.stringify({ leaveStatus: 'Cancellation Requested' })); onNavigate('leaves'); }}
              />
            : <StatCard label="Open Positions" value={s.open_positions} icon={Briefcase}
                gradient={`linear-gradient(135deg, ${B.blue}, ${B.teal})`} delay={0.16}
                sub="Active job openings"
                onClick={() => onNavigate('job-openings')}
              />
          }
          <StatCard
            label="Present Today"
            value={s.present_today}
            icon={Clock}
            gradient={`linear-gradient(135deg, #065F46, ${B.green})`}
            delay={0.2}
            sub="In office today"
            onClick={() => onNavigate('attendance')}
          />
        </div>

        {/* ── Hires trend + Leave donut ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, marginBottom: 14 }}>
          <SectionCard title="New Hires Trend" subtitle="Last 6 months — click a bar to filter" delay={0.22}>
            <div style={{ padding: '16px 20px 20px', height: 230 }}>
              {hasHires ? <Line data={hiresChartData} options={hiresOpts} /> : <NoData />}
            </div>
          </SectionCard>

          <SectionCard title="Leave Status" subtitle="Current distribution" delay={0.24}>
            <div style={{ padding: '16px 20px 20px', height: 230 }}>
              {hasLeaves ? <Doughnut data={leavesChartData} options={leavesOpts} /> : <NoData />}
            </div>
          </SectionCard>
        </div>

        {/* ── Dept chart + Attendance chart ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <SectionCard title="Department Breakdown" subtitle="Employees per department" delay={0.26}>
            <div style={{ padding: '16px 20px 20px', height: 220 }}>
              {hasDepts ? <Bar data={deptsChartData} options={deptsOpts} /> : <NoData />}
            </div>
          </SectionCard>

          <SectionCard title="Attendance This Month" subtitle="Status breakdown" delay={0.28}>
            <div style={{ padding: '16px 20px 20px', height: 220 }}>
              {hasAtt ? <Bar data={attChartData} options={attOpts} /> : <NoData />}
            </div>
          </SectionCard>
        </div>

        {/* ── Recent hires + Dept bars ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Recent hires */}
          <SectionCard
            title="Recent Hires"
            subtitle={data.recent_hires?.length ? `${data.recent_hires.length} newest members` : ''}
            action={
              <button className="action-btn" onClick={() => onNavigate('employees')}>
                View All <ArrowUpRight size={11} />
              </button>
            }
            delay={0.3}
          >
            {data.recent_hires?.length ? (
              <div>
                {data.recent_hires.map((e, i) => (
                  <div key={i} className="hire-row" style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 20px',
                    borderBottom: i < data.recent_hires.length - 1 ? `1px solid ${B.mist}` : 'none',
                  }}>
                    <EmpAvatar name={e.name} photo={e.profile_photo} size="sm" colorIndex={i} rounded="rounded-full" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: B.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                      <div style={{ fontSize: 11, color: B.steel, marginTop: 1 }}>{e.designation || '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontSize: 11, fontWeight: 600, color: B.blue,
                        background: 'rgba(26,106,180,0.07)', padding: '3px 8px', borderRadius: 20,
                        border: '1px solid rgba(26,106,180,0.12)',
                      }}>{e.department || '—'}</div>
                      <div style={{ fontSize: 10, color: B.steel, marginTop: 3 }}>{fmtDate(e.joined)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: B.steel, fontSize: 13 }}>No employees yet</div>
            )}
          </SectionCard>

          {/* Department bars */}
          <SectionCard title="By Department" subtitle="Headcount distribution" delay={0.32}>
            <div style={{ padding: '14px 20px 20px' }}>
              {data.department_breakdown?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.department_breakdown.map((d, i) => {
                    const pct = Math.round(d.count / maxDept * 100);
                    const color = deptBarColors[i % deptBarColors.length];
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12.5, fontWeight: 500, color: B.navy }}>{d.name}</span>
                          </div>
                          <span style={{
                            fontSize: 11.5, fontWeight: 700, color,
                            background: color + '18', padding: '2px 8px',
                            borderRadius: 20, border: `1px solid ${color}30`,
                          }}>{d.count}</span>
                        </div>
                        <div style={{ height: 6, background: B.mist, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`,
                            background: `linear-gradient(90deg, ${color}, ${color}AA)`,
                            borderRadius: 4,
                            transition: 'width 0.8s cubic-bezier(0.34,1.2,0.64,1)',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ paddingTop: 24, textAlign: 'center', color: B.steel, fontSize: 13 }}>No departments configured</div>
              )}
            </div>
          </SectionCard>
        </div>

      </div>
    </>
  );
}
