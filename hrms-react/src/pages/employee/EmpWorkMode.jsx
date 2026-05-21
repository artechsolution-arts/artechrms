import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import { ChevronLeft, ChevronRight, CalendarCheck2, Users } from 'lucide-react';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

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

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getDate()} ${MONTH_NAMES[dt.getMonth()].slice(0, 3)}`;
}

function Avatar({ name }) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-blue-500','bg-violet-500','bg-teal-500','bg-rose-500','bg-amber-500','bg-indigo-500'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
      <span className="text-white text-xs font-bold">{initials}</span>
    </div>
  );
}

export default function EmpWorkMode({ toast }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [leaves,  setLeaves]  = useState([]);
  const [loading, setLoading] = useState(true);

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLeaves(await api('GET', `/api/portal/team-leaves?month=${monthStr}`));
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [monthStr]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const approved = leaves.filter(l => l.status === 'Approved').length;
  const pending  = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="page-content space-y-4">
      <div className="page-head">
        <div>
          <h1 className="page-title">Team Leaves</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">All employee leaves for the month</p>
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn btn-secondary btn-sm p-1.5">
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-semibold text-gray-800 dark:text-white min-w-[140px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="btn btn-secondary btn-sm p-1.5">
            <ChevronRight size={15} />
          </button>
        </div>
        {leaves.length > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><Users size={12} className="text-gray-400" />{leaves.length} leaves</span>
            <span className="text-green-600 font-medium">{approved} approved</span>
            {pending > 0 && <span className="text-amber-600 font-medium">{pending} pending</span>}
          </div>
        )}
      </div>

      {/* Leave list */}
      <div className="card">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
        ) : leaves.length === 0 ? (
          <div className="empty-state py-14">
            <CalendarCheck2 size={36} className="mb-2 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No leaves this month</p>
            <p className="text-xs text-gray-400 mt-1">All employees are present in {MONTH_NAMES[month - 1]} {year}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {leaves.map(lv => (
              <div key={lv.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={lv.employee_name} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {lv.employee_name}
                    </span>
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_CHIP[lv.leave_type] || 'bg-gray-100 text-gray-600'}`}>
                      {lv.leave_type}
                    </span>
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_CHIP[lv.leave_category] || 'bg-gray-100 text-gray-600'}`}>
                      {lv.leave_category}
                    </span>
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
        )}
      </div>
    </div>
  );
}
