import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Users, CalendarDays, Briefcase, Clock, RefreshCw } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_FONT = { family: "'Inter', sans-serif", size: 11 };
const GRID_COLOR = '#F0F0F0';
const TICK_COLOR = '#9CA3AF';

function StatCard({ label, value, color, icon: Icon, onClick }) {
  const colorMap = {
    blue: 'text-[#2E6BE6]',
    green: 'text-green-600',
    amber: 'text-amber-500',
    gray: 'text-gray-700',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`p-2 rounded-lg bg-gray-50 ${colorMap[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className={`text-3xl font-bold ${colorMap[color]}`}>{value}</div>
    </div>
  );
}

function NoData() {
  return <div className="flex items-center justify-center h-full text-sm text-gray-400">No Data</div>;
}

export default function Dashboard({ onNavigate, toast }) {
  const [data, setData] = useState(null);
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
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mr-3" />
      Loading dashboard...
    </div>
  );
  if (!data) return null;

  const s = data.stats;
  const hasHires = data.monthly_hires?.data?.some(v => v > 0);
  const hasLeaves = (data.leave_stats?.pending + data.leave_stats?.approved + data.leave_stats?.rejected) > 0;
  const hasDepts = data.department_breakdown?.length > 0;
  const hasAtt = data.attendance_stats && Object.values(data.attendance_stats).some(v => v > 0);
  const maxDept = Math.max(...(data.department_breakdown?.map(d => d.count) || [1]), 1);

  const hiresChartData = {
    labels: data.monthly_hires?.labels || [],
    datasets: [{
      label: 'New Hires',
      data: data.monthly_hires?.data || [],
      borderColor: '#2E6BE6',
      backgroundColor: 'rgba(46,107,230,0.08)',
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: '#2E6BE6',
      fill: true,
      tension: 0.3,
    }],
  };

  const leavesChartData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [{
      data: [data.leave_stats?.pending, data.leave_stats?.approved, data.leave_stats?.rejected],
      backgroundColor: ['#F5A623', '#2CB87C', '#E84C4C'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const deptsChartData = {
    labels: data.department_breakdown?.map(d => d.name) || [],
    datasets: [{
      label: 'Employees',
      data: data.department_breakdown?.map(d => d.count) || [],
      backgroundColor: ['#2490EF22','#2CB87C22','#F5A62322','#E84C4C22','#9B59B622','#1ABC9C22','#E67E2222','#3498DB22'],
      borderColor: ['#2490EF','#2CB87C','#F5A623','#E84C4C','#9B59B6','#1ABC9C','#E67E22','#3498DB'],
      borderWidth: 1.5,
      borderRadius: 4,
    }],
  };

  const attLabels = Object.keys(data.attendance_stats || {});
  const attColors = { Present:'#2CB87C', Absent:'#E84C4C', 'On Leave':'#F5A623', 'Half Day':'#2490EF', WFH:'#9B59B6' };
  const attChartData = {
    labels: attLabels,
    datasets: [{
      label: 'Days',
      data: attLabels.map(l => data.attendance_stats[l]),
      backgroundColor: attLabels.map(l => (attColors[l] || '#8D99A6') + '33'),
      borderColor: attLabels.map(l => attColors[l] || '#8D99A6'),
      borderWidth: 1.5,
      borderRadius: 4,
    }],
  };

  const chartOpts = (axis = true) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: axis ? {
      x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: CHART_FONT } },
      y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: CHART_FONT, stepSize: 1 }, beginAtZero: true },
    } : {},
  });

  const insightColors = { warning: 'bg-amber-50 border-amber-200 text-amber-800', info: 'bg-blue-50 border-blue-200 text-blue-800', success: 'bg-green-50 border-green-200 text-green-800' };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, Administrator</p>
        </div>
        <button onClick={load} className="btn btn-secondary btn-sm gap-1.5">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {insights.map((i, idx) => (
            <div
              key={idx}
              onClick={() => i.action && onNavigate(i.action)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${insightColors[i.type] || insightColors.info}`}
            >
              <span>{i.icon}</span>
              <span>{i.text}</span>
              {i.action && <span className="ml-1 opacity-50">→</span>}
            </div>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Employees" value={s.total_employees} color="gray"   icon={Users}       onClick={() => onNavigate('employees')} />
        <StatCard label="Pending Leaves"   value={s.pending_leaves}  color="amber"  icon={CalendarDays} onClick={() => onNavigate('leaves')} />
        <StatCard label="Open Positions"   value={s.open_positions}  color="blue"   icon={Briefcase}   onClick={() => onNavigate('job-openings')} />
        <StatCard label="Present Today"    value={s.present_today}   color="green"  icon={Clock}       onClick={() => onNavigate('attendance')} />
      </div>

      {/* New Hires trend */}
      <div className="card mb-4">
        <div className="card-head">
          <div>
            <div className="card-title">New Hires Trend</div>
            <div className="text-xs text-gray-400 mt-0.5">Last 6 months</div>
          </div>
        </div>
        <div className="p-4" style={{ height: 220 }}>
          {hasHires ? <Line data={hiresChartData} options={chartOpts()} /> : <NoData />}
        </div>
      </div>

      {/* Leave + Departments charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Leave Status</div>
          </div>
          <div className="p-4" style={{ height: 220 }}>
            {hasLeaves
              ? <Doughnut data={leavesChartData} options={{ ...chartOpts(false), cutout: '60%', plugins: { legend: { position: 'bottom', labels: { font: CHART_FONT, color: TICK_COLOR, padding: 16, boxWidth: 12 } }, tooltip: { mode: 'index' } } }} />
              : <NoData />}
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Department Breakdown</div>
          </div>
          <div className="p-4" style={{ height: 220 }}>
            {hasDepts ? <Bar data={deptsChartData} options={chartOpts()} /> : <NoData />}
          </div>
        </div>
      </div>

      {/* Attendance chart */}
      <div className="card mb-4">
        <div className="card-head">
          <div className="card-title">Attendance This Month</div>
        </div>
        <div className="p-4" style={{ height: 220 }}>
          {hasAtt ? <Bar data={attChartData} options={chartOpts()} /> : <NoData />}
        </div>
      </div>

      {/* Recent hires + Dept breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-head">
            <span className="card-title">Recent Hires</span>
            <button onClick={() => onNavigate('employees')} className="btn btn-secondary btn-xs">View All</button>
          </div>
          {data.recent_hires?.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Employee</th><th>Department</th><th>Joined</th></tr></thead>
                <tbody>
                  {data.recent_hires.map((e, i) => (
                    <tr key={i}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {e.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{e.name}</div>
                            <div className="text-xs text-gray-400">{e.designation || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-500 text-sm">{e.department || '—'}</td>
                      <td className="text-gray-500 text-sm">{e.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <p className="text-sm text-gray-500">No employees yet</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <span className="card-title">By Department</span>
          </div>
          <div className="p-4">
            {data.department_breakdown?.length ? (
              <div className="space-y-3">
                {data.department_breakdown.map((d, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{d.name}</span>
                      <span className="text-gray-600 font-semibold">{d.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2E6BE6] rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(d.count / maxDept * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No departments configured</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
