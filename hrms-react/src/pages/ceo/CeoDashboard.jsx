import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Users, CalendarDays, Clock, CheckCircle, XCircle, ChevronRight, TrendingUp } from 'lucide-react';
import StatCard from '../../components/StatCard';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_COLOR = {
  Pending:  'bg-amber-100 text-amber-700 border-amber-200',
  Approved: 'bg-green-100 text-green-700 border-green-200',
  Rejected: 'bg-red-100 text-red-700 border-red-200',
  'Cancellation Requested': 'bg-orange-100 text-orange-700 border-orange-200',
};

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
      setPending(Array.isArray(p) ? p.slice(0, 8) : []);
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

  const s = data.stats;
  const ls = data.leave_stats || {};
  const depts = data.department_breakdown || [];
  const maxDept = Math.max(...depts.map(d => d.count), 1);

  return (
    <div className="flex-1 p-6 overflow-auto space-y-6">

      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-600 to-rose-400 rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <div className="text-lg font-bold mb-0.5">CEO Overview</div>
          <div className="text-white/70 text-sm">Organisation-wide workforce snapshot</div>
          <div className="text-white/50 text-xs mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <TrendingUp size={48} className="text-white/30 flex-shrink-0" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Employees" value={s.total_employees}   icon={Users}        gradient="navy"  delay={0.04} onClick={() => onNavigate('employees')} />
        <StatCard label="Present Today"    value={s.present_today}     icon={Clock}        gradient="green" delay={0.08} onClick={() => onNavigate('attendance')} />
        <StatCard label="Pending Leaves"   value={s.pending_leaves}    icon={CalendarDays} gradient="amber" delay={0.12} onClick={() => onNavigate('leaves')} />
        <StatCard label="Approved Leaves"  value={ls.approved}         icon={CheckCircle}  gradient="blue"  delay={0.16} onClick={() => onNavigate('leaves')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Pending leave requests — quick actions */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Pending Approvals</span>
            <button onClick={() => onNavigate('ceo-leaves')} className="text-xs flex items-center gap-0.5 hover:underline" style={{ color: 'var(--accent)' }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          {pending.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm text-gray-500">No pending leaves</p>
              <p className="text-xs text-gray-400 mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {pending.map(lv => {
                const days = lv.total_days || 1;
                return (
                  <div key={lv.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-xs font-bold text-rose-700 flex-shrink-0">
                      {(lv.employee_name || 'E')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{lv.employee_name || '—'}</div>
                      <div className="text-xs text-gray-500">
                        {lv.leave_type} · {days} day{days !== 1 ? 's' : ''} · {lv.from_date}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => approve(lv.id)}
                        className="w-7 h-7 rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center text-green-600 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        onClick={() => reject(lv.id)}
                        className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
                        title="Reject"
                      >
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
          <div className="card-head">
            <span className="card-title">Department Headcount</span>
            <button onClick={() => onNavigate('ceo-employees')} className="text-xs flex items-center gap-0.5 hover:underline" style={{ color: 'var(--accent)' }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          {depts.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No data</div>
          ) : (
            <div className="p-4 space-y-3">
              {depts.slice(0, 7).map(d => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-28 truncate flex-shrink-0">{d.name}</span>
                  <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(d.count / maxDept) * 100}%`, backgroundColor: 'var(--accent)', opacity: 0.7 }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-6 text-right flex-shrink-0">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leave breakdown */}
      <div className="card p-5">
        <div className="card-title mb-4">Leave Summary</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending',  value: ls.pending,  color: 'text-amber-600',  bar: 'bg-amber-400' },
            { label: 'Approved', value: ls.approved, color: 'text-green-600',  bar: 'bg-green-400' },
            { label: 'Rejected', value: ls.rejected, color: 'text-red-500',    bar: 'bg-red-400'   },
          ].map(({ label, value, color, bar }) => {
            const total = (ls.pending || 0) + (ls.approved || 0) + (ls.rejected || 0) || 1;
            return (
              <div key={label} className="text-center">
                <div className={`text-3xl font-bold ${color} mb-1`}>{value || 0}</div>
                <div className="text-xs text-gray-500 mb-2">{label}</div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${bar}`} style={{ width: `${((value || 0) / total) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
