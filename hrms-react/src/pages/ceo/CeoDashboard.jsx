import { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  Users, CalendarDays, Clock, CheckCircle, XCircle, ChevronRight,
  TrendingUp, Briefcase, UserPlus, FileText, AlertCircle,
  Building2, IndianRupee,
} from 'lucide-react';
import StatCard from '../../components/StatCard';

const fmt = n => n >= 10_00_000
  ? `₹${(n / 10_00_000).toFixed(2)}L`
  : n >= 1_000
  ? `₹${(n / 1_000).toFixed(1)}K`
  : `₹${n}`;

const PIPELINE_ORDER = ['Applied', 'Screening', 'Interview', 'Offered', 'Hired', 'Rejected'];
const PIPELINE_COLOR = {
  Applied:   { bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-300' },
  Screening: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  Interview: { bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-300' },
  Offered:   { bg: 'bg-teal-100 dark:bg-teal-900/30',   text: 'text-teal-700 dark:text-teal-300' },
  Hired:     { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  Rejected:  { bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-700 dark:text-red-300' },
};

function SectionHeader({ title, onViewAll, navKey }) {
  return (
    <div className="card-head">
      <span className="card-title">{title}</span>
      {onViewAll && (
        <button
          onClick={() => onViewAll(navKey)}
          className="text-xs flex items-center gap-0.5 hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          View all <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="p-8 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
        <Icon size={18} className="text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

// HikeCalculator moved to CompensationPlanner page
function _removed() {
  const [hikeData, setHikeData] = useState(null);
  const [hikePct, setHikePct] = useState(10);
  const [filterDept, setFilterDept] = useState('All');
  const [loadingHike, setLoadingHike] = useState(true);
  const [hikeTab, setHikeTab] = useState('summary');

  useEffect(() => {
    api('GET', '/api/dashboard/hike-snapshot')
      .then(d => setHikeData(d))
      .catch(() => {})
      .finally(() => setLoadingHike(false));
  }, []);

  const result = useMemo(() => {
    if (!hikeData) return null;
    const emps = filterDept === 'All'
      ? hikeData.employees
      : hikeData.employees.filter(e => e.department === filterDept);

    const currentMonthly = emps.reduce((s, e) => s + e.gross_salary, 0);
    const hikeAmount     = currentMonthly * (hikePct / 100);
    const newMonthly     = currentMonthly + hikeAmount;
    const annualImpact   = hikeAmount * 12;

    // Dept breakdown
    const deptMap = {};
    emps.forEach(e => {
      if (!deptMap[e.department]) deptMap[e.department] = { current: 0, count: 0 };
      deptMap[e.department].current += e.gross_salary;
      deptMap[e.department].count += 1;
    });
    const depts = Object.entries(deptMap)
      .map(([name, { current, count }]) => ({
        name, count,
        current,
        increase: current * (hikePct / 100),
      }))
      .sort((a, b) => b.increase - a.increase);

    // Employee-wise rows
    const empRows = emps
      .map(e => ({
        ...e,
        hikeAmt: e.gross_salary * (hikePct / 100),
        newGross: e.gross_salary + e.gross_salary * (hikePct / 100),
        annualExtra: e.gross_salary * (hikePct / 100) * 12,
      }))
      .sort((a, b) => b.annualExtra - a.annualExtra);

    return { currentMonthly, newMonthly, hikeAmount, annualImpact, depts, count: emps.length, empRows };
  }, [hikeData, hikePct, filterDept]);

  const depts = hikeData
    ? ['All', ...new Set(hikeData.employees.map(e => e.department))]
    : ['All'];

  const TABS = [
    { key: 'summary',     label: 'Summary' },
    { key: 'employees',   label: 'Employee-wise' },
    { key: 'departments', label: 'Department-wise' },
  ];

  return (
    <div className="card">
      {/* Header */}
      <div className="card-head">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--accent-50)' }}>
            <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <span className="card-title">Salary Hike Impact Simulator</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <Info size={11} /> Based on current gross salaries
        </span>
      </div>

      {loadingHike ? (
        <div className="p-8 text-center text-sm text-gray-400">Loading salary data…</div>
      ) : !hikeData || hikeData.employees.length === 0 ? (
        <EmptyState icon={IndianRupee} message="No salary data available yet" />
      ) : (
        <div className="p-5 space-y-4">
          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Hike Percentage — <span style={{ color: 'var(--accent)' }} className="text-base font-bold">{hikePct}%</span>
              </label>
              <input
                type="range" min="1" max="50" step="1"
                value={hikePct}
                onChange={e => setHikePct(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'var(--accent)' }}
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>1%</span><span>10%</span><span>20%</span><span>30%</span><span>40%</span><span>50%</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Department</label>
              <Select
                value={filterDept}
                onChange={v => setFilterDept(v)}
                options={depts.map(d => ({ value: d, label: d }))}
                size="sm"
                className="w-44"
              />
            </div>
          </div>

          {/* Tabs — same pattern as Leave Applications */}
          <div className="flex flex-wrap gap-2">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setHikeTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                  ${hikeTab === t.key
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {result && (
            <>
              {/* ── Summary tab ── */}
              {hikeTab === 'summary' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Employees Affected', value: result.count, sub: filterDept === 'All' ? 'All departments' : filterDept, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Monthly Hike Cost',  value: fmt(result.hikeAmount), sub: `+${hikePct}% on gross`, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'New Monthly Total',  value: fmt(result.newMonthly), sub: `Was ${fmt(result.currentMonthly)}`, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { label: 'Annual Extra Cost',  value: fmt(result.annualImpact), sub: 'Additional per year', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                  ].map(({ label, value, sub, color, bg }) => (
                    <div key={label} className={`rounded-xl p-3.5 ${bg}`}>
                      <div className={`text-xl font-bold ${color} leading-tight`}>{value}</div>
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-0.5">{label}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Employee-wise tab ── */}
              {hikeTab === 'employees' && (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th className="text-right">Current Gross/mo</th>
                        <th className="text-right">Hike ({hikePct}%)</th>
                        <th className="text-right">New Gross/mo</th>
                        <th className="text-right">Annual Extra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.empRows.map(e => (
                        <tr key={e.id}>
                          <td className="font-medium">{e.name}</td>
                          <td className="text-gray-500 dark:text-gray-400">{e.department}</td>
                          <td className="text-gray-500 dark:text-gray-400">{e.designation || '—'}</td>
                          <td className="text-right font-mono">{e.gross_salary > 0 ? fmt(e.gross_salary) : <span className="text-gray-300">—</span>}</td>
                          <td className="text-right font-mono text-amber-600 dark:text-amber-400">+{fmt(e.hikeAmt)}</td>
                          <td className="text-right font-mono text-green-600 dark:text-green-400 font-semibold">{e.newGross > 0 ? fmt(e.newGross) : '—'}</td>
                          <td className="text-right font-mono text-rose-600 dark:text-rose-400">+{fmt(e.annualExtra)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 dark:border-gray-600">
                        <td colSpan={3} className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-2.5">
                          Total ({result.count} employees)
                        </td>
                        <td className="text-right font-mono font-semibold px-4 py-2.5">{fmt(result.currentMonthly)}</td>
                        <td className="text-right font-mono font-semibold text-amber-600 dark:text-amber-400 px-4 py-2.5">+{fmt(result.hikeAmount)}</td>
                        <td className="text-right font-mono font-semibold text-green-600 dark:text-green-400 px-4 py-2.5">{fmt(result.newMonthly)}</td>
                        <td className="text-right font-mono font-semibold text-rose-600 dark:text-rose-400 px-4 py-2.5">+{fmt(result.annualImpact)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* ── Department-wise tab ── */}
              {hikeTab === 'departments' && (
                <div className="space-y-3">
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-1">
                    {[
                      { label: 'Employees', value: result.count, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                      { label: 'Monthly Hike', value: fmt(result.hikeAmount), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                      { label: 'New Monthly Total', value: fmt(result.newMonthly), color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
                      { label: 'Annual Extra', value: fmt(result.annualImpact), color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className={`rounded-xl p-3 ${bg}`}>
                        <div className={`text-lg font-bold ${color}`}>{value}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Department table */}
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th className="text-right">Employees</th>
                          <th className="text-right">Current Monthly</th>
                          <th className="text-right">Monthly Hike</th>
                          <th className="text-right">New Monthly</th>
                          <th className="text-right">Annual Extra</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.depts.map(d => (
                          <tr key={d.name}>
                            <td className="font-medium">{d.name}</td>
                            <td className="text-right">{d.count}</td>
                            <td className="text-right font-mono">{d.current > 0 ? fmt(d.current) : '—'}</td>
                            <td className="text-right font-mono text-amber-600 dark:text-amber-400">+{fmt(d.increase)}</td>
                            <td className="text-right font-mono text-green-600 dark:text-green-400 font-semibold">{fmt(d.current + d.increase)}</td>
                            <td className="text-right font-mono text-rose-600 dark:text-rose-400">+{fmt(d.increase * 12)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 dark:border-gray-600">
                          <td className="font-semibold text-gray-700 dark:text-gray-300 px-4 py-2.5">Total</td>
                          <td className="text-right font-semibold px-4 py-2.5">{result.count}</td>
                          <td className="text-right font-mono font-semibold px-4 py-2.5">{fmt(result.currentMonthly)}</td>
                          <td className="text-right font-mono font-semibold text-amber-600 dark:text-amber-400 px-4 py-2.5">+{fmt(result.hikeAmount)}</td>
                          <td className="text-right font-mono font-semibold text-green-600 dark:text-green-400 px-4 py-2.5">{fmt(result.newMonthly)}</td>
                          <td className="text-right font-mono font-semibold text-rose-600 dark:text-rose-400 px-4 py-2.5">+{fmt(result.annualImpact)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function CeoDashboard({ toast, onNavigate }) {
  const [data, setData]           = useState(null);
  const [pending, setPending]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [leaveMonths, setLeaveMonths] = useState(null);
  const [selMonth, setSelMonth]   = useState(5); // default = latest month

  useEffect(() => {
    Promise.all([
      api('GET', '/api/dashboard'),
      api('GET', '/api/leaves?status=Pending').catch(() => []),
      api('GET', '/api/dashboard/monthly-leaves').catch(() => null),
    ]).then(([d, p, lm]) => {
      setData(d);
      setPending(Array.isArray(p) ? p.slice(0, 6) : []);
      setLeaveMonths(lm);
    }).catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const approve = async (id) => {
    try {
      await api('PUT', `/api/leaves/${id}/approve`);
      toast('Leave approved', 'success');
      setPending(prev => prev.filter(l => l.id !== id));
      setData(d => d ? { ...d, stats: { ...d.stats, pending_leaves: Math.max(0, (d.stats.pending_leaves || 1) - 1) } } : d);
    } catch (e) { toast(e.message, 'error'); }
  };

  const reject = async (id) => {
    try {
      await api('PUT', `/api/leaves/${id}/reject`);
      toast('Leave rejected', 'info');
      setPending(prev => prev.filter(l => l.id !== id));
      setData(d => d ? { ...d, stats: { ...d.stats, pending_leaves: Math.max(0, (d.stats.pending_leaves || 1) - 1) } } : d);
    } catch (e) { toast(e.message, 'error'); }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  if (!data) return null;

  const s    = data.stats || {};
  const ls   = data.leave_stats || {};
  const depts = data.department_breakdown || [];
  const maxDept = Math.max(...depts.map(d => d.count), 1);
  const recentHires = data.recent_hires || [];
  const openJobs    = data.open_jobs || [];
  const pipeline    = data.recruitment_pipeline || {};
  const totalPipelineApplicants = Object.values(pipeline).reduce((a, b) => a + b, 0);

  const totalPendingApprovals =
    (s.pending_leaves || 0) +
    (s.cancellation_requests || 0) +
    (s.pending_resignations || 0) +
    (s.pending_edit_requests || 0);

  return (
    <div className="flex-1 p-6 overflow-auto space-y-6">

      {/* ── Banner ── */}
      <div className="bg-gradient-to-r from-rose-600 to-rose-400 rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <div className="text-lg font-bold mb-0.5">CEO Overview</div>
          <div className="text-white/70 text-sm">Organisation-wide workforce snapshot</div>
          <div className="text-white/50 text-xs mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <TrendingUp size={48} className="text-white/30 flex-shrink-0" />
      </div>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Employees"    value={s.total_employees}      icon={Users}         gradient="navy"  delay={0.04} onClick={() => onNavigate('employees')} />
        <StatCard label="Present Today"       value={s.present_today}        icon={Clock}         gradient="green" delay={0.08} onClick={() => onNavigate('attendance')} />
        <StatCard label="On Leave Today"      value={s.on_leave_today}       icon={CalendarDays}  gradient="amber" delay={0.12} onClick={() => onNavigate('leaves')} />
        <StatCard label="Pending Approvals"   value={totalPendingApprovals}  icon={AlertCircle}   gradient="rose"  delay={0.16} onClick={() => onNavigate('leaves')} />
      </div>

      {/* ── Second row stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="New Hires This Month" value={s.new_hires_this_month} icon={UserPlus}      gradient="blue"  delay={0.04} onClick={() => {
          const now = new Date();
          const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          sessionStorage.setItem('nav-filter', JSON.stringify({ joinedMonth: ym, joinedLabel: 'This Month' }));
          onNavigate('employees');
        }} />
        <StatCard label="Open Positions"       value={s.open_positions}       icon={Briefcase}     gradient="purple" delay={0.08} onClick={() => onNavigate('job-openings')} />
        <StatCard label="Pending Resignations" value={s.pending_resignations} icon={FileText}      gradient="orange" delay={0.12} onClick={() => onNavigate('leaves')} />
        <StatCard
          label="This Month Payroll"
          value={s.monthly_payroll > 0 ? fmt(s.monthly_payroll) : '—'}
          icon={IndianRupee}
          gradient="teal"
          delay={0.16}
          onClick={() => onNavigate('payroll-entry')}
        />
      </div>

      {/* ── Row: Pending approvals + Department headcount ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Pending leave approvals — quick actions */}
        <div className="card">
          <SectionHeader title="Leave Approvals" onViewAll={onNavigate} navKey="leaves" />
          {pending.length === 0 ? (
            <EmptyState icon={CheckCircle} message="All caught up — no pending leaves" />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {pending.map(lv => {
                const days = lv.total_days || 1;
                return (
                  <div key={lv.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-xs font-bold text-rose-700 dark:text-rose-400 flex-shrink-0">
                      {(lv.employee_name || 'E')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{lv.employee_name || '—'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {lv.leave_type} · {days} day{days !== 1 ? 's' : ''} · {lv.from_date}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => approve(lv.id)}
                        className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400 transition-colors"
                        title="Approve">
                        <CheckCircle size={14} />
                      </button>
                      <button onClick={() => reject(lv.id)}
                        className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center text-red-500 dark:text-red-400 transition-colors"
                        title="Reject">
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Department headcount */}
        <div className="card">
          <SectionHeader title="Department Headcount" onViewAll={onNavigate} navKey="employees" />
          {depts.length === 0 ? (
            <EmptyState icon={Building2} message="No department data" />
          ) : (
            <div className="p-4 space-y-3">
              {depts.slice(0, 7).map(d => (
                <div
                  key={d.name}
                  className="flex items-center gap-3 group cursor-pointer rounded-lg px-1 -mx-1 py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                  onClick={() => {
                    sessionStorage.setItem('nav-filter', JSON.stringify({ deptName: d.name }));
                    onNavigate('employees');
                  }}
                >
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-28 truncate flex-shrink-0 group-hover:text-[var(--accent)] transition-colors">{d.name}</span>
                  <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-500 ease-out"
                      style={{ width: `${(d.count / maxDept) * 100}%`, backgroundColor: 'var(--accent)', opacity: 0.75 }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-6 text-right flex-shrink-0">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row: Recruitment pipeline + Open job posts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recruitment pipeline */}
        <div className="card">
          <SectionHeader title="Recruitment Pipeline" onViewAll={onNavigate} navKey="job-openings" />
          {totalPipelineApplicants === 0 ? (
            <EmptyState icon={Briefcase} message="No active applicants" />
          ) : (
            <div className="p-4 space-y-2.5">
              {PIPELINE_ORDER.filter(stage => pipeline[stage]).map(stage => {
                const count = pipeline[stage] || 0;
                const pct   = Math.round((count / totalPipelineApplicants) * 100);
                const { bg, text } = PIPELINE_COLOR[stage] || { bg: 'bg-gray-100', text: 'text-gray-600' };
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full w-20 text-center flex-shrink-0 ${bg} ${text}`}>
                      {stage}
                    </span>
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ease-out ${bg.replace('bg-', 'bg-').replace('/30', '')}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-6 text-right flex-shrink-0">{count}</span>
                  </div>
                );
              })}
              <div className="pt-1 text-xs text-gray-400 dark:text-gray-500">
                {totalPipelineApplicants} total applicant{totalPipelineApplicants !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Open job posts */}
        <div className="card">
          <SectionHeader title="Open Job Posts" onViewAll={onNavigate} navKey="job-openings" />
          {openJobs.length === 0 ? (
            <EmptyState icon={Briefcase} message="No open positions right now" />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {openJobs.map(job => (
                <div key={job.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--accent-50)' }}>
                    <Briefcase size={14} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{job.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {job.positions} position{job.positions !== 1 ? 's' : ''}
                      {job.closes_on ? ` · Closes ${job.closes_on}` : ''}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex-shrink-0">
                    Open
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Monthly Leave Overview (full width) ── */}
      {leaveMonths && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">Monthly Leave Overview</div>
            <button onClick={() => onNavigate('leaves')} className="text-xs flex items-center gap-0.5 hover:underline" style={{ color: 'var(--accent)' }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="p-5 space-y-5">

            {/* ── 6-month bar chart ── */}
            <div className="flex items-end gap-2 h-28">
              {leaveMonths.labels.map((label, mi) => {
                const maxTotal = Math.max(...leaveMonths.month_totals, 1);
                const val = leaveMonths.month_totals[mi] || 0;
                const heightPct = (val / maxTotal) * 100;
                const isSelected = mi === selMonth;
                return (
                  <button
                    key={label}
                    onClick={() => setSelMonth(mi)}
                    className="flex-1 flex flex-col items-center gap-1 group"
                    title={`${label}: ${val} day${val !== 1 ? 's' : ''}`}
                  >
                    <span className={`text-[10px] font-semibold transition-colors ${isSelected ? 'text-[var(--accent)]' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                      {val > 0 ? val : ''}
                    </span>
                    <div className="w-full flex items-end" style={{ height: 80 }}>
                      <div
                        className="w-full rounded-t-md transition-all duration-300"
                        style={{
                          height: `${Math.max(heightPct, val > 0 ? 4 : 0)}%`,
                          minHeight: val > 0 ? 4 : 0,
                          backgroundColor: isSelected ? 'var(--accent)' : 'var(--accent)',
                          opacity: isSelected ? 1 : 0.35,
                        }}
                      />
                    </div>
                    <span className={`text-[10px] transition-colors whitespace-nowrap ${isSelected ? 'font-semibold text-[var(--accent)]' : 'text-gray-400 dark:text-gray-500'}`}>
                      {label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── Employee breakdown for selected month ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {leaveMonths.labels[selMonth]} — Employee Breakdown
                </span>
                <span className="text-xs text-gray-400">
                  {leaveMonths.month_totals[selMonth] || 0} days total ·{' '}
                  {leaveMonths.employees.filter(e => e.monthly[selMonth] > 0).length} employees on leave
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 max-h-72 overflow-y-auto pr-1">
                {leaveMonths.employees.map(emp => {
                  const days = emp.monthly[selMonth] || 0;
                  const maxDays = Math.max(...leaveMonths.employees.map(e => e.monthly[selMonth] || 0), 1);
                  return (
                    <div key={emp.id} className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ backgroundColor: days > 0 ? 'var(--accent)' : '#d1d5db', opacity: days > 0 ? 0.85 : 0.5 }}
                      >
                        {emp.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-xs truncate ${days > 0 ? 'font-medium text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                            {emp.name}
                          </span>
                          <span className={`text-[10px] font-semibold ml-2 flex-shrink-0 ${days > 0 ? 'text-[var(--accent)]' : 'text-gray-300 dark:text-gray-700'}`}>
                            {days > 0 ? `${days}d` : '—'}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-[width] duration-500"
                            style={{ width: `${days > 0 ? (days / maxDays) * 100 : 0}%`, backgroundColor: 'var(--accent)', opacity: 0.7 }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Row: Recent hires ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="card-title">Leave Status</div>
            <button onClick={() => onNavigate('leaves')} className="text-xs flex items-center gap-0.5 hover:underline" style={{ color: 'var(--accent)' }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Pending',               value: ls.pending,               color: 'text-amber-600 dark:text-amber-400',   bar: 'bg-amber-400' },
              { label: 'Approved',              value: ls.approved,              color: 'text-green-600 dark:text-green-400',   bar: 'bg-green-400' },
              { label: 'Cancellation Requests', value: ls.cancellation_requests, color: 'text-orange-500 dark:text-orange-400', bar: 'bg-orange-400' },
              { label: 'Rejected',              value: ls.rejected,              color: 'text-red-500 dark:text-red-400',       bar: 'bg-red-400' },
            ].map(({ label, value, color, bar }) => {
              const total = (ls.pending || 0) + (ls.approved || 0) + (ls.rejected || 0) + (ls.cancellation_requests || 0) || 1;
              return (
                <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                  <div className={`text-2xl font-bold ${color} mb-0.5`}>{value || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{label}</div>
                  <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${((value || 0) / total) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent hires */}
        <div className="card">
          <SectionHeader title="Recent Hires" onViewAll={onNavigate} navKey="employees" />
          {recentHires.length === 0 ? (
            <EmptyState icon={UserPlus} message="No recent hires" />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentHires.map((emp, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  {emp.profile_photo ? (
                    <img src={emp.profile_photo} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-400 flex-shrink-0">
                      {(emp.name || 'E')[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{emp.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {emp.designation}{emp.department ? ` · ${emp.department}` : ''}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{emp.joined}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
