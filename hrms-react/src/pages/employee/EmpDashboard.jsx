import { useState, useEffect } from 'react';
import { api } from '../../api';
import { fmtDate, safeDate } from '../../utils/date';
const safeFmt = (d, opts) => { const dt = safeDate(d); return dt ? dt.toLocaleDateString('en-IN', opts) : '—'; };
import Badge from '../../components/Badge';
import StatCard from '../../components/StatCard';
import { CalendarDays, Clock, ClipboardList, Megaphone, Gift, CalendarCheck2, ChevronRight } from 'lucide-react';


const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_COLOR = {
  Present:    'bg-green-500',
  Absent:     'bg-red-400',
  'Half Day': 'bg-yellow-400',
  'On Leave': 'bg-blue-400',
  WFH:        'bg-purple-400',
};

const WM_COLOR = {
  WFH:    'bg-purple-100 text-purple-700',
  WFO:    'bg-blue-100 text-blue-700',
  Hybrid: 'bg-teal-100 text-teal-700',
  Leave:  'bg-amber-100 text-amber-700',
};

const PRIORITY_COLOR = {
  High:   'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low:    'bg-gray-100 text-gray-600 border-gray-200',
};

function SectionCard({ title, icon: Icon, action, onNavigate, children }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-gray-400" />
          <span className="card-title">{title}</span>
        </div>
        {action && (
          <button onClick={() => onNavigate(action)} className="text-xs flex items-center gap-0.5 hover:underline" style={{ color: 'var(--accent)' }}>
            View all <ChevronRight size={12} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export default function EmpDashboard({ toast, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [workMode, setWorkMode] = useState([]);
  const [balances, setBalances] = useState([]);

  const curMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const curYear  = new Date().getFullYear();

  useEffect(() => {
    const dashP = api('GET', '/api/portal/dashboard').then(setData).catch(e => toast(e.message, 'error'));
    const annP  = api('GET', '/api/hrm/announcements?active_only=true').then(d => setAnnouncements(d.slice(0, 5))).catch(() => {});
    const holP  = api('GET', `/api/hrm/holidays?year=${curYear}`).then(d => {
      const today = new Date(); today.setHours(0,0,0,0);
      const upcoming = d.filter(h => new Date(h.date) >= today).slice(0, 5);
      setHolidays(upcoming);
    }).catch(() => {});
    const wmP   = api('GET', `/api/portal/work-mode?month=${curMonth}`).then(d => setWorkMode(d.slice(0, 10))).catch(() => {});
    const lbP   = api('GET', '/api/portal/leave-balances').then(d => setBalances(Array.isArray(d) ? d : [])).catch(() => {});
    Promise.all([dashP, annP, holP, wmP, lbP]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  if (!data) return null;

  const { employee: emp, stats, recent_attendance } = data;

  return (
    <div className="flex-1 p-6 overflow-auto space-y-5">
      {/* Greeting banner */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2E6BE6] rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <div className="text-lg font-bold mb-0.5">Hello, {emp.full_name.split(' ')[0]}! 👋</div>
          <div className="text-white/70 text-sm">{emp.designation || 'Employee'} · {emp.department || 'Artech Solutions'}</div>
          <div className="text-white/50 text-xs mt-1">Employee ID: {emp.employee_id} · Joined {fmtDate(emp.date_of_joining)}</div>
        </div>
        <div className="w-[104px] h-[104px] rounded-full bg-white/15 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white/40">
          {emp.profile_photo
            ? <img src={emp.profile_photo} alt="" className="w-full h-full object-cover" />
            : <span className="text-2xl font-bold">{emp.full_name.split(' ').map(w => w[0]).slice(0,2).join('')}</span>
          }
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Leaves',  value: stats.pending_leaves,  icon: CalendarDays,  gradient: 'amber', action: 'my-leaves' },
          { label: 'Approved Leaves', value: stats.approved_leaves, icon: CalendarDays,  gradient: 'green', action: null },
          { label: 'Leave Balance',   value: balances.reduce((s, b) => s + b.available, 0), icon: Clock, gradient: 'navy', action: 'my-leaves' },
          { label: 'Status Sheet',    value: '→',                   icon: ClipboardList, gradient: 'blue',  action: 'my-status' },
        ].map(({ label, value, icon, gradient, action }, i) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            icon={icon}
            gradient={gradient}
            delay={0.04 * (i + 1)}
            onClick={action ? () => onNavigate(action) : undefined}
          />
        ))}
      </div>

      {/* Last 7 days attendance */}
      <SectionCard title="Last 7 Days Attendance" icon={Clock} action="emp-attendance" onNavigate={onNavigate}>
        {recent_attendance.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">No attendance records yet</div>
        ) : (
          <div className="p-4 flex flex-wrap gap-3">
            {recent_attendance.map(a => (
              <div key={a.date} className="flex flex-col items-center gap-1.5 w-16">
                <div className={`w-10 h-10 rounded-full ${STATUS_COLOR[a.status] || 'bg-gray-200'} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                  {a.status[0]}
                </div>
                <div className="text-[10px] text-gray-500 text-center leading-tight">
                  {safeFmt(a.date, { day: 'numeric', month: 'short' })}
                </div>
                <Badge text={a.status} />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Announcements + Holidays side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard title="Announcements" icon={Megaphone} action="emp-announcements" onNavigate={onNavigate}>
          {announcements.length === 0 ? (
            <div className="p-5 text-center text-sm text-gray-400">No announcements</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {announcements.map(a => (
                <div key={a.id} className="px-5 py-3 flex items-start gap-3">
                  <span className={`mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${PRIORITY_COLOR[a.priority] || PRIORITY_COLOR.Low}`}>
                    {a.priority}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">{a.title}</p>
                    {a.content && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>}
                    <p className="text-[11px] text-gray-400 mt-1">{fmtDate(a.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Upcoming Holidays" icon={Gift} action="emp-holidays" onNavigate={onNavigate}>
          {holidays.length === 0 ? (
            <div className="p-5 text-center text-sm text-gray-400">No upcoming holidays this year</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {holidays.map(h => (
                <div key={h.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{h.name}</p>
                    <p className="text-xs text-gray-400">{h.holiday_type}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {safeFmt(h.date, { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {safeFmt(h.date, { weekday: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Work Mode Sheet */}
      <SectionCard title="Team Calendar — This Month" icon={CalendarCheck2} action="emp-work-mode" onNavigate={onNavigate}>
        {workMode.length === 0 ? (
          <div className="p-5 text-center text-sm text-gray-400">No work mode entries this month</div>
        ) : (
          <div className="p-4 flex flex-wrap gap-2">
            {workMode.map(w => (
              <div key={w.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${WM_COLOR[w.work_mode] || 'bg-gray-100 text-gray-600'}`}>{w.work_mode}</span>
                <span className="text-xs text-gray-500">
                  {safeFmt(w.date, { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Latest salary slip */}
      {stats.latest_net_pay && (
        <div className="card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-1">Latest Salary — {stats.latest_slip_month?.split('/').map((v,i) => i===0 ? MONTHS[+v-1] : v).join(' ')}</div>
            <div className="text-2xl font-bold text-gray-900">₹{stats.latest_net_pay.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-0.5">Net Pay</div>
          </div>
          <button onClick={() => onNavigate('emp-salary')} className="btn btn-secondary btn-sm">
            View Slips
          </button>
        </div>
      )}
    </div>
  );
}
