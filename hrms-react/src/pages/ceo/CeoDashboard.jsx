import { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  Users, CalendarDays, Clock, CheckCircle, XCircle, ChevronRight,
  TrendingUp, Briefcase, DollarSign, UserPlus, FileText, AlertCircle,
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

export default function CeoDashboard({ toast, onNavigate }) {
  const [data, setData] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('GET', '/api/dashboard'),
      api('GET', '/api/leaves?status=Pending').catch(() => []),
    ]).then(([d, p]) => {
      setData(d);
      setPending(Array.isArray(p) ? p.slice(0, 6) : []);
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
        <StatCard label="Active Employees"    value={s.total_employees}      icon={Users}         gradient="navy"  delay={0.04} onClick={() => onNavigate('ceo-employees')} />
        <StatCard label="Present Today"       value={s.present_today}        icon={Clock}         gradient="green" delay={0.08} onClick={() => onNavigate('ceo-attendance')} />
        <StatCard label="On Leave Today"      value={s.on_leave_today}       icon={CalendarDays}  gradient="amber" delay={0.12} onClick={() => onNavigate('ceo-leaves')} />
        <StatCard label="Pending Approvals"   value={totalPendingApprovals}  icon={AlertCircle}   gradient="rose"  delay={0.16} onClick={() => onNavigate('ceo-leaves')} />
      </div>

      {/* ── Second row stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="New Hires This Month" value={s.new_hires_this_month} icon={UserPlus}      gradient="blue"  delay={0.04} onClick={() => onNavigate('ceo-employees')} />
        <StatCard label="Open Positions"       value={s.open_positions}       icon={Briefcase}     gradient="purple" delay={0.08} onClick={() => onNavigate('recruitment')} />
        <StatCard label="Pending Resignations" value={s.pending_resignations} icon={FileText}      gradient="orange" delay={0.12} onClick={() => onNavigate('ceo-leaves')} />
        <StatCard
          label="This Month Payroll"
          value={s.monthly_payroll > 0 ? fmt(s.monthly_payroll) : '—'}
          icon={IndianRupee}
          gradient="teal"
          delay={0.16}
          onClick={() => onNavigate('payroll')}
        />
      </div>

      {/* ── Row: Pending approvals + Department headcount ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Pending leave approvals — quick actions */}
        <div className="card">
          <SectionHeader title="Leave Approvals" onViewAll={onNavigate} navKey="ceo-leaves" />
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
          <SectionHeader title="Department Headcount" onViewAll={onNavigate} navKey="ceo-employees" />
          {depts.length === 0 ? (
            <EmptyState icon={Building2} message="No department data" />
          ) : (
            <div className="p-4 space-y-3">
              {depts.slice(0, 7).map(d => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-28 truncate flex-shrink-0">{d.name}</span>
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
          <SectionHeader title="Recruitment Pipeline" onViewAll={onNavigate} navKey="recruitment" />
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
          <SectionHeader title="Open Job Posts" onViewAll={onNavigate} navKey="recruitment" />
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

      {/* ── Row: Leave summary + Recent hires ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Leave breakdown */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="card-title">Leave Summary</div>
            <button onClick={() => onNavigate('ceo-leaves')} className="text-xs flex items-center gap-0.5 hover:underline" style={{ color: 'var(--accent)' }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Pending',               value: ls.pending,                color: 'text-amber-600 dark:text-amber-400',  bar: 'bg-amber-400' },
              { label: 'Approved',              value: ls.approved,               color: 'text-green-600 dark:text-green-400',  bar: 'bg-green-400' },
              { label: 'Cancellation Requests', value: ls.cancellation_requests,  color: 'text-orange-500 dark:text-orange-400', bar: 'bg-orange-400' },
              { label: 'Rejected',              value: ls.rejected,               color: 'text-red-500 dark:text-red-400',      bar: 'bg-red-400' },
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
          <SectionHeader title="Recent Hires" onViewAll={onNavigate} navKey="ceo-employees" />
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
