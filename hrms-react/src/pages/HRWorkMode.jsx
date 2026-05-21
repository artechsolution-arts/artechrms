import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Modal, { Field } from '../components/Modal';
import {
  ChevronLeft, ChevronRight, CalendarCheck2, Users,
  LayoutGrid, List, CheckCircle2, XCircle, RefreshCw,
} from 'lucide-react';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const WM_CHIP = {
  WFH:    'bg-purple-100 text-purple-700',
  WFO:    'bg-blue-100 text-blue-700',
  Hybrid: 'bg-teal-100 text-teal-700',
  Leave:  'bg-amber-100 text-amber-700',
};
const STATUS_CHIP = {
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
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
  const [failed, setFailed] = useState(false);
  if (photo && !failed) {
    return (
      <img
        src={photo} alt={name}
        className={`${sz} rounded-full object-cover flex-shrink-0 border border-white/40 dark:border-gray-700`}
        onError={() => setFailed(true)}
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

// ── Grid View ─────────────────────────────────────────────────
function GridView({ year, month, entries, today, onApprove, onOpenReject, acting }) {
  const [selected, setSelected] = useState(null);

  const firstDay    = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr    = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const dateStr   = d => `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const onDay     = d => entries.filter(e => e.entry_date === dateStr(d));
  const selectedEntries = selected ? entries.filter(e => e.entry_date === selected) : [];
  const selectedDay     = selected ? parseInt(selected.split('-')[2]) : null;

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
        {DAY_NAMES.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-gray-100 dark:divide-gray-800">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} className="min-h-[80px] bg-gray-50/50 dark:bg-gray-900/30" />;

          const ds         = dateStr(d);
          const dayEntries = onDay(d);
          const isToday    = ds === todayStr;
          const isWeekend  = (i % 7 === 0 || i % 7 === 6);
          const isSelected = selected === ds;
          const visible    = dayEntries.slice(0, 3);
          const overflow   = dayEntries.length - visible.length;

          return (
            <button
              key={d}
              onClick={() => setSelected(isSelected ? null : ds)}
              className={`min-h-[80px] p-1.5 text-left transition-colors border-b border-gray-100 dark:border-gray-800
                ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : isWeekend ? 'bg-gray-50/60 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
            >
              <div className={`w-6 h-6 mb-1 flex items-center justify-center rounded-full text-xs font-semibold
                ${isToday ? 'text-white' : isWeekend ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}
                style={isToday ? { backgroundColor: 'var(--accent)' } : {}}>
                {d}
              </div>
              <div className="flex flex-wrap gap-0.5">
                {visible.map(e => (
                  <div key={e.id} title={`${e.employee_name} — ${e.work_mode}`}>
                    <AvatarWithFallback name={e.employee_name} photo={e.profile_photo} size="sm" />
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

      {selected && selectedEntries.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/40">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {selectedDay} {MONTH_NAMES[month-1]} — {selectedEntries.length} entr{selectedEntries.length > 1 ? 'ies' : 'y'}
          </p>
          <div className="space-y-3">
            {selectedEntries.map(e => (
              <div key={e.id} className="flex items-center gap-2.5">
                <AvatarWithFallback name={e.employee_name} photo={e.profile_photo} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block truncate">{e.employee_name}</span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${WM_CHIP[e.work_mode] || 'bg-gray-100 text-gray-600'}`}>{e.work_mode}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_CHIP[e.status] || 'bg-gray-100 text-gray-600'}`}>{e.status}</span>
                    {e.duration && <span className="text-[10px] text-gray-400">{e.duration}</span>}
                  </div>
                </div>
                {e.status === 'Pending' && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => onApprove(e.id)} disabled={acting === e.id}
                      className="btn btn-xs gap-1 disabled:opacity-60 text-green-700 border border-green-200 bg-green-50 hover:bg-green-100">
                      <CheckCircle2 size={11} /> Approve
                    </button>
                    <button onClick={() => onOpenReject(e.id)} disabled={acting === e.id}
                      className="btn btn-danger btn-xs gap-1 disabled:opacity-60">
                      <XCircle size={11} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── List View ─────────────────────────────────────────────────
function ListView({ entries, month, onApprove, onOpenReject, acting }) {
  if (entries.length === 0) return (
    <div className="card">
      <div className="empty-state py-14">
        <CalendarCheck2 size={36} className="mb-2 text-gray-300" />
        <p className="text-sm font-medium text-gray-600">No work mode entries this month</p>
      </div>
    </div>
  );

  return (
    <div className="card divide-y divide-gray-100 dark:divide-gray-800">
      {entries.map(e => (
        <div key={e.id} className="flex items-center gap-3 px-4 py-3">
          <AvatarWithFallback name={e.employee_name} photo={e.profile_photo} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{e.employee_name}</span>
              <span className="text-xs text-gray-400 font-mono">{e.employee_code}</span>
              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${WM_CHIP[e.work_mode] || 'bg-gray-100 text-gray-600'}`}>{e.work_mode}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
              <span>{fmtDate(e.entry_date)}</span>
              {e.duration && <><span className="text-gray-300">·</span><span>{e.duration}</span></>}
              {e.reason && <><span className="text-gray-300">·</span><span className="truncate max-w-[200px]">{e.reason}</span></>}
              {e.hr_remarks && <><span className="text-gray-300">·</span><span className="italic text-gray-400">{e.hr_remarks}</span></>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_CHIP[e.status] || 'bg-gray-100 text-gray-600'}`}>{e.status}</span>
            {e.status === 'Pending' && (
              <div className="flex gap-1">
                <button onClick={() => onApprove(e.id)} disabled={acting === e.id}
                  className="btn btn-xs gap-1 disabled:opacity-60 text-green-700 border border-green-200 bg-green-50 hover:bg-green-100">
                  <CheckCircle2 size={11} /> Approve
                </button>
                <button onClick={() => onOpenReject(e.id)} disabled={acting === e.id}
                  className="btn btn-danger btn-xs gap-1 disabled:opacity-60">
                  <XCircle size={11} /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected'];

export default function HRWorkMode({ toast }) {
  const today = new Date();
  const [year,    setYear]    = useState(today.getFullYear());
  const [month,   setMonth]   = useState(today.getMonth() + 1);
  const [tab,     setTab]     = useState('All');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState('list');

  const [rejectModal,   setRejectModal]   = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [acting,        setActing]        = useState(null);

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const monthStr    = `${year}-${String(month).padStart(2, '0')}`;
      const statusParam = tab === 'All' ? '' : `&status=${tab}`;
      setEntries(await api('GET', `/api/hrm/work-mode?month=${monthStr}${statusParam}`));
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [year, month, tab]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    setActing(id);
    try {
      await api('PUT', `/api/hrm/work-mode/${id}/approve`, {});
      toast('Approved', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setActing(null); }
  };

  const openReject = (id) => { setRejectRemarks(''); setRejectModal({ id }); };

  const confirmReject = async () => {
    if (!rejectModal) return;
    setActing(rejectModal.id);
    try {
      await api('PUT', `/api/hrm/work-mode/${rejectModal.id}/reject`, { remarks: rejectRemarks || null });
      toast('Rejected', 'success');
      setRejectModal(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setActing(null); }
  };

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const pending  = entries.filter(e => e.status === 'Pending').length;
  const approved = entries.filter(e => e.status === 'Approved').length;
  const rejected = entries.filter(e => e.status === 'Rejected').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Work Mode Sheet</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Review and approve employee WFH / leave requests</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={load} className="btn btn-secondary btn-sm gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
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
      </div>

      <div className="page-content space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending',  count: pending,  color: 'text-amber-600' },
            { label: 'Approved', count: approved, color: 'text-green-600' },
            { label: 'Rejected', count: rejected, color: 'text-red-500'  },
          ].map(({ label, count, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="btn btn-secondary btn-sm p-1.5">
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-white min-w-[130px] text-center">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button onClick={nextMonth} disabled={isCurrentMonth}
              className="btn btn-secondary btn-sm p-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {entries.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Users size={12} className="text-gray-400" />{entries.length} entries
              </span>
            )}
            {/* Status filter tabs */}
            <div className="flex gap-1">
              {STATUS_TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                    tab === t ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                  }`}
                  style={tab === t ? { backgroundColor: 'var(--accent)' } : {}}
                >
                  {t}
                  {t === 'Pending' && pending > 0 && (
                    <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      tab === 'Pending' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
                    }`}>{pending}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card py-12 text-center text-sm text-gray-400">Loading…</div>
        ) : view === 'grid' ? (
          <GridView
            year={year} month={month} entries={entries} today={today}
            onApprove={approve} onOpenReject={openReject} acting={acting}
          />
        ) : (
          <ListView
            entries={entries} month={month}
            onApprove={approve} onOpenReject={openReject} acting={acting}
          />
        )}
      </div>

      <Modal
        open={!!rejectModal}
        title="Reject Request"
        onClose={() => setRejectModal(null)}
        onSave={confirmReject}
        saveLabel="Confirm Reject"
        danger
      >
        <Field label="Reason for Rejection (optional)">
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Explain why the request is being rejected…"
            value={rejectRemarks}
            onChange={e => setRejectRemarks(e.target.value)}
            autoFocus
          />
        </Field>
      </Modal>
    </>
  );
}
