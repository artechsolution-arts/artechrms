import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { CalendarCheck2, Users, LayoutGrid, List } from 'lucide-react';
import MonthYearPicker from '../components/MonthYearPicker';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const TYPE_CHIP = {
  'Casual Leave':  'bg-blue-100 text-blue-700',
  'Sick Leave':    'bg-rose-100 text-rose-700',
  'Planned':       'bg-teal-100 text-teal-700',
  'Unplanned':     'bg-orange-100 text-orange-700',
};
const STATUS_CHIP = {
  Approved: 'bg-green-100 text-green-700',
  Pending:  'bg-amber-100 text-amber-700',
};
const AVATAR_COLORS = [
  'bg-blue-500','bg-violet-500','bg-teal-500','bg-rose-500',
  'bg-amber-500','bg-indigo-500','bg-emerald-500','bg-pink-500',
];

function avatarColor(name) {
  return AVATAR_COLORS[(name || '?').charCodeAt(0) % AVATAR_COLORS.length];
}
function initials(name) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function AvatarWithFallback({ name, photo, size = 'md' }) {
  const sz = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
  const [imgFailed, setImgFailed] = useState(false);
  if (photo && !imgFailed) {
    return (
      <img
        src={photo} alt={name}
        className={`${sz} rounded-full object-cover flex-shrink-0 border border-white/40 dark:border-gray-700`}
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <div className={`${sz} rounded-full ${avatarColor(name)} flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold">{initials(name)}</span>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getDate()} ${MONTH_NAMES[dt.getMonth()].slice(0, 3)}`;
}

function coversDate(lv, dateStr) {
  return lv.from_date <= dateStr && lv.to_date >= dateStr;
}

// ── Grid View ─────────────────────────────────────────────────
function GridView({ year, month, leaves, today }) {
  const [selected, setSelected] = useState(null);

  const firstDay    = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr    = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const dateStr      = d => `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const leavesOnDay  = d => leaves.filter(lv => coversDate(lv, dateStr(d)));
  const selectedLeaves = selected ? leaves.filter(lv => coversDate(lv, selected)) : [];
  const selectedDay    = selected ? parseInt(selected.split('-')[2]) : null;

  return (
    <div className="card overflow-hidden">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
        {DAY_NAMES.map((d, idx) => (
          <div key={d} className={`py-2 text-center text-[11px] font-semibold uppercase tracking-wide ${idx === 0 || idx === 6 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-gray-100 dark:divide-gray-800">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} className="min-h-[80px] bg-gray-50/50 dark:bg-gray-900/30" />;

          const ds        = dateStr(d);
          const dayLeaves = leavesOnDay(d);
          const isToday   = ds === todayStr;
          const isWeekend = (i % 7 === 0 || i % 7 === 6);
          const isSelected = selected === ds;
          const visible   = dayLeaves.slice(0, 3);
          const overflow  = dayLeaves.length - visible.length;

          return (
            <button
              key={d}
              onClick={() => setSelected(isSelected ? null : ds)}
              className={`min-h-[80px] p-1.5 text-left transition-colors border-b border-gray-100 dark:border-gray-800
                ${isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : isWeekend
                    ? 'bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50/70 dark:hover:bg-red-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
            >
              <div
                className={`w-6 h-6 mb-1 flex items-center justify-center rounded-full text-xs font-semibold
                  ${isToday ? 'text-white' : isWeekend ? 'text-red-400' : 'text-gray-700 dark:text-gray-300'}`}
                style={isToday ? { backgroundColor: 'var(--accent)' } : {}}
              >
                {d}
              </div>
              <div className="flex flex-wrap gap-0.5">
                {visible.map(lv => (
                  <div key={lv.id} title={`${lv.employee_name} — ${lv.leave_type}`}>
                    <AvatarWithFallback name={lv.employee_name} photo={lv.profile_photo} size="sm" />
                  </div>
                ))}
                {overflow > 0 && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300">+{overflow}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel for selected day */}
      {selected && selectedLeaves.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/40">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {selectedDay} {MONTH_NAMES[month - 1]} — {selectedLeaves.length} employee{selectedLeaves.length > 1 ? 's' : ''} on leave
          </p>
          <div className="space-y-2">
            {selectedLeaves.map(lv => (
              <div key={lv.id} className="flex items-center gap-2.5">
                <AvatarWithFallback name={lv.employee_name} photo={lv.profile_photo} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate block">{lv.employee_name}</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_CHIP[lv.leave_type] || 'bg-gray-100 text-gray-600'}`}>{lv.leave_type}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_CHIP[lv.leave_category] || 'bg-gray-100 text-gray-600'}`}>{lv.leave_category}</span>
                    {lv.half_day && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">Half Day</span>}
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_CHIP[lv.status] || 'bg-gray-100 text-gray-600'}`}>{lv.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── List View ─────────────────────────────────────────────────
function ListView({ leaves, month }) {
  if (leaves.length === 0) return (
    <div className="card">
      <div className="empty-state py-14">
        <CalendarCheck2 size={36} className="mb-2 text-gray-300" />
        <p className="text-sm font-medium text-gray-600">No leaves this month</p>
        <p className="text-xs text-gray-400 mt-1">All employees are present in {MONTH_NAMES[month - 1]}</p>
      </div>
    </div>
  );

  return (
    <div className="card divide-y divide-gray-100 dark:divide-gray-800">
      {leaves.map(lv => (
        <div key={lv.id} className="flex items-center gap-3 px-4 py-3">
          <AvatarWithFallback name={lv.employee_name} photo={lv.profile_photo} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{lv.employee_name}</span>
              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_CHIP[lv.leave_type] || 'bg-gray-100 text-gray-600'}`}>{lv.leave_type}</span>
              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_CHIP[lv.leave_category] || 'bg-gray-100 text-gray-600'}`}>{lv.leave_category}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
              <span>
                {lv.half_day
                  ? `${fmtDate(lv.from_date)} · Half Day`
                  : lv.from_date === lv.to_date
                    ? fmtDate(lv.from_date)
                    : `${fmtDate(lv.from_date)} – ${fmtDate(lv.to_date)}`}
              </span>
              <span className="text-gray-300">·</span>
              <span>{lv.total_days} day{lv.total_days !== 1 ? 's' : ''}</span>
              {lv.reason && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="truncate max-w-[200px]">{lv.reason}</span>
                </>
              )}
            </div>
          </div>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_CHIP[lv.status] || 'bg-gray-100 text-gray-600'}`}>
            {lv.status}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function HRWorkMode({ toast }) {
  const today = new Date();
  const [year,   setYear]   = useState(today.getFullYear());
  const [month,  setMonth]  = useState(today.getMonth() + 1);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view,   setView]   = useState('grid');

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLeaves(await api('GET', `/api/hrm/team-leaves?month=${monthStr}`));
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [monthStr]);

  useEffect(() => { load(); }, [load]);

  const approved = leaves.filter(l => l.status === 'Approved').length;
  const pending  = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="page-content space-y-4">
      <div className="page-head">
        <div>
          <h1 className="page-title">Team Calendar</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">All employee leaves for the month</p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setView('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              view === 'grid' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid size={13} /> Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              view === 'list' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={13} /> List
          </button>
        </div>
      </div>

      {/* Month navigator + stats */}
      <div className="flex items-center justify-between gap-3">
        <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
        {leaves.length > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-gray-500">
              <Users size={12} className="text-gray-400" />{leaves.length} leaves
            </span>
            <span className="text-green-600 font-medium">{approved} approved</span>
            {pending > 0 && <span className="text-amber-600 font-medium">{pending} pending</span>}
          </div>
        )}
      </div>

      {loading ? (
        <div className="card py-12 text-center text-sm text-gray-400">Loading…</div>
      ) : view === 'grid' ? (
        <GridView year={year} month={month} leaves={leaves} today={today} />
      ) : (
        <ListView leaves={leaves} month={month} />
      )}
    </div>
  );
}
