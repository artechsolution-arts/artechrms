import { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart2, Eye, EyeOff, Calendar, ChevronDown, FileSpreadsheet, RefreshCw, Clock, Users, CheckCircle2, TrendingUp, Pencil, Save, Mail, Target } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../hooks/useToast';
import * as XLSX from 'xlsx';

// ── Date helpers (timezone-safe — use local date, never toISOString) ──
const MONTHS       = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function localISO(d) {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function fmtShort(d) {
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS_SHORT[d.getMonth()]}`;
}

function getWeeksOfMonth(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay  = new Date(year, month, 0);
  const weeks = [];
  let start = new Date(firstDay);

  while (start <= lastDay) {
    const end = new Date(start);
    const daysToSun = (7 - start.getDay()) % 7;
    end.setDate(end.getDate() + daysToSun);
    if (end > lastDay) end.setTime(lastDay.getTime());

    weeks.push({
      label: `Week ${weeks.length + 1}:  ${fmtShort(start)} – ${fmtShort(end)}`,
      start: localISO(start),
      end:   localISO(end),
    });

    start = new Date(end);
    start.setDate(start.getDate() + 1);
    if (start > lastDay) break;
  }
  return weeks;
}

function monthRange(year, month) {
  const first = new Date(year, month - 1, 1);
  const last  = new Date(year, month, 0);
  return { start: localISO(first), end: localISO(last) };
}

function fmtHours(h) {
  if (!h || h <= 0) return '—';
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function hoursToHM(h) {
  const total = Math.round((h || 0) * 60);
  return { h: Math.floor(total / 60), m: total % 60 };
}

function hmToHours(hm) {
  return (parseInt(hm.h) || 0) + (parseInt(hm.m) || 0) / 60;
}

const STATUS_SHORT = { Present: 'P', Absent: 'A', 'On Leave': 'L', 'Half Day': 'HD', WFH: 'WFH' };
const STATUS_COLOR = {
  Present:    { bg: '#dcfce7', fg: '#15803d' },
  Absent:     { bg: '#fee2e2', fg: '#b91c1c' },
  'On Leave': { bg: '#dbeafe', fg: '#1d4ed8' },
  'Half Day': { bg: '#fef9c3', fg: '#a16207' },
  WFH:        { bg: '#f3e8ff', fg: '#7c3aed' },
};

// ── Excel export ───────────────────────────────────────────────
const DAY_ABBR = ['S', 'M', 'T', 'W', 'Th', 'F', 'St'];

function statusCode(status, dateStr) {
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  const isWknd = dow === 0 || dow === 6;
  if (status === '—') return isWknd ? 'WO' : 'A';
  const map = { Present: 'P', Absent: 'A', 'On Leave': 'L', 'Half Day': 'HD', WFH: 'WFH', Holiday: 'H' };
  return map[status] || status;
}

function fmtDuration(h) {
  if (!h || h <= 0) return '';
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function exportToExcel(report, editedHoursMap, getStdHours) {
  const { rows, days, period_label } = report;
  const wb = XLSX.utils.book_new();

  const effHrs = (row) => {
    const v = editedHoursMap[row.employee_id];
    return v !== undefined ? hmToHours(v) : row.total_hours;
  };

  // ── Sheet 1: Summary ──────────────────────────────────────────
  const summaryAoa = [];
  summaryAoa.push(['Attendance Summary Report']);
  summaryAoa.push([period_label]);
  summaryAoa.push(['Generated: ' + new Date().toLocaleString()]);
  summaryAoa.push([]);
  summaryAoa.push([
    'Emp ID', 'Name', 'Department',
    'Present Days', 'Leave Days', 'Absent Days', 'Std Work Hrs', 'Original Hrs', 'Adjusted Hrs', 'Status',
  ]);

  for (const row of rows) {
    const adj = effHrs(row);
    const std = getStdHours ? getStdHours(row) : null;
    summaryAoa.push([
      row.employee_code,
      row.employee_name,
      row.department,
      row.present_days,
      row.in_probation ? '—' : row.leave_days,
      row.in_probation ? row.absent_days + (row.leave_days || 0) : row.absent_days,
      std != null && std > 0 ? fmtDuration(std) : '—',
      fmtDuration(row.total_hours),
      adj !== row.total_hours ? fmtDuration(adj) : '—',
      row.in_probation ? 'Probation' : 'Confirmed',
    ]);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(summaryAoa);
  ws1['!cols'] = [
    { wch: 12 }, { wch: 28 }, { wch: 22 },
    { wch: 14 }, { wch: 13 }, { wch: 13 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

  // ── Sheet 2: Day-wise detail ──────────────────────────────────
  const dayColHdrs = days.map(d => {
    const dt = new Date(d.date + 'T00:00:00');
    return `${dt.getDate()} ${DAY_ABBR[dt.getDay()]}`;
  });

  const detailAoa = [];
  detailAoa.push(['Attendance Detail Report']);
  detailAoa.push([period_label]);
  detailAoa.push([]);
  detailAoa.push(['Emp ID', 'Name', 'Department', 'Field', ...dayColHdrs, 'Total Hrs']);

  for (const row of rows) {
    detailAoa.push([row.employee_code, row.employee_name, row.department, 'Status',   ...row.days.map(d => statusCode(d.status, d.date)), '']);
    detailAoa.push(['', '', '', 'In Time',  ...row.days.map(d => (d.in_time  && d.in_time  !== '—') ? d.in_time  : ''), '']);
    detailAoa.push(['', '', '', 'Out Time', ...row.days.map(d => (d.out_time && d.out_time !== '—') ? d.out_time : ''), '']);
    detailAoa.push(['', '', '', 'Duration', ...row.days.map(d => fmtDuration(d.hours)), fmtDuration(effHrs(row))]);
    detailAoa.push([]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(detailAoa);
  ws2['!cols'] = [
    { wch: 12 }, { wch: 26 }, { wch: 20 }, { wch: 10 },
    ...days.map(() => ({ wch: 8 })), { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Day-wise Detail');

  XLSX.writeFile(wb, `Attendance_${period_label.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
}

// ── Custom Dropdown ────────────────────────────────────────────
function Sel({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm cursor-pointer
            ${open
              ? 'border-accent ring-2 ring-accent/20 shadow-md'
              : 'border-gray-200 dark:border-gray-700 hover:border-accent/50 hover:shadow-md'
            }`}
        >
          <span className={selected?.label ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
            {selected?.label || '— Select —'}
          </span>
          <ChevronDown size={15} strokeWidth={2.5} className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180 text-accent' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
            <div className="max-h-56 overflow-y-auto py-1">
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors duration-100
                    ${String(opt.value) === String(value)
                      ? 'bg-accent/10 text-accent font-semibold dark:bg-accent/20'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub }) {
  const colors = {
    blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   ic: 'text-blue-500' },
    green:  { bg: 'bg-green-50 dark:bg-green-900/20', ic: 'text-green-500' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', ic: 'text-purple-500' },
    amber:  { bg: 'bg-amber-50 dark:bg-amber-900/20',  ic: 'text-amber-500' },
    red:    { bg: 'bg-red-50 dark:bg-red-900/20',      ic: 'text-red-500' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm min-w-[140px]">
      <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={16} className={c.ic} />
      </div>
      <div>
        <div className="text-[11px] text-gray-400 dark:text-gray-500">{label}</div>
        <div className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">{value}</div>
        {sub && <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{sub}</div>}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function Reports() {
  const { toast } = useToast();
  const now = new Date();

  const [periodType, setPeriodType] = useState('week');
  const [wYear,  setWYear]  = useState(now.getFullYear());
  const [wMonth, setWMonth] = useState(now.getMonth() + 1);
  const [wWeek,  setWWeek]  = useState('');
  const [mYear,  setMYear]  = useState(now.getFullYear());
  const [mMonth, setMMonth] = useState(now.getMonth() + 1);
  const [loading,  setLoading]  = useState(false);
  const [report,   setReport]   = useState(null);
  const [preview,  setPreview]  = useState(true);

  // Edit-hours state
  const [editMode,    setEditMode]    = useState(false);
  const [editedHours, setEditedHours] = useState({});   // { empId: string }
  const [editsSaved,  setEditsSaved]  = useState(false);
  const [sending,     setSending]     = useState(false);

  // Required hours (computed after generate)
  const [reqHours,   setReqHours]   = useState(null);  // number
  const [periodHols, setPeriodHols] = useState([]);    // holiday objects in period

  const weeks      = useMemo(() => getWeeksOfMonth(wYear, wMonth), [wYear, wMonth]);
  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  // ── Effective hours (edited or original) ──────────────────────
  const effectiveHours = (empId, orig) => {
    const v = editedHours[empId];
    return v !== undefined ? hmToHours(v) : orig;
  };

  // ── Per-employee required hours (adjusted for mid-period joining) ──
  const holidaySetMemo = useMemo(() => new Set(periodHols.map(h => h.date.slice(0, 10))), [periodHols]);

  const getEmpReqHours = (row) => {
    if (reqHours === null || !report) return null;
    const join = row.date_of_joining ? new Date(row.date_of_joining + 'T00:00:00') : null;
    const pStart = new Date(report.start_date + 'T00:00:00');
    const pEnd   = new Date(report.end_date   + 'T00:00:00');

    // Joined before or on period start → full standard target
    if (!join || join <= pStart) return reqHours;

    // Joined after period ended → not applicable
    if (join > pEnd) return 0;

    // Joined mid-period → count working days from join date to period end
    let workDays = 0;
    const cur = new Date(join);
    while (cur <= pEnd) {
      const dow = cur.getDay();
      const ds  = localISO(cur);
      if (dow !== 0 && dow !== 6 && !holidaySetMemo.has(ds)) workDays++;
      cur.setDate(cur.getDate() + 1);
    }
    return workDays * 9;
  };

  // ── Derived stats (respect edits + per-employee targets) ─────
  const totalPresent = report?.rows.reduce((s, r) => s + r.present_days, 0) ?? 0;
  const totalHours   = report?.rows.reduce((s, r) => s + effectiveHours(r.employee_id, r.total_hours), 0) ?? 0;
  const avgHours     = report?.rows.length ? totalHours / report.rows.length : 0;
  const belowTarget  = report?.rows.filter(r => {
    const req = getEmpReqHours(r);
    return req !== null && req > 0 && effectiveHours(r.employee_id, r.total_hours) < req;
  }).length ?? 0;

  // ── Generate report ───────────────────────────────────────────
  async function generate() {
    let start, end, label, rtype, year;
    if (periodType === 'week') {
      if (!wWeek) return toast('Please select a week', 'warning');
      const w = weeks.find(w => w.start === wWeek);
      if (!w) return toast('Invalid week', 'warning');
      start = w.start; end = w.end;
      label = `${w.label} ${wYear}`;
      rtype = 'attendance_weekly';
      year  = wYear;
    } else {
      const r = monthRange(mYear, mMonth);
      start = r.start; end = r.end;
      label = `${MONTHS[mMonth - 1]} ${mYear}`;
      rtype = 'attendance_monthly';
      year  = mYear;
    }

    setLoading(true);
    setReport(null);
    setEditedHours({});
    setEditMode(false);
    setEditsSaved(false);
    setReqHours(null);
    setPeriodHols([]);

    try {
      const [res, hols] = await Promise.all([
        api('POST', '/api/reports/attendance', { start_date: start, end_date: end, period_label: label, report_type: rtype }),
        api('GET', `/api/hrm/holidays?year=${year}`),
      ]);

      // Restore any previously saved hour edits for this period
      const savedEdits = {};
      (res.rows || []).forEach(r => {
        if (r.edited_hours !== null && r.edited_hours !== undefined) {
          savedEdits[r.employee_id] = hoursToHM(r.edited_hours);
        }
      });
      setEditedHours(savedEdits);

      const startD = new Date(start + 'T00:00:00');
      const endD   = new Date(end   + 'T00:00:00');
      const weekdayHols = (hols || []).filter(h => {
        const hd  = new Date(h.date.slice(0, 10) + 'T00:00:00');
        if (hd < startD || hd > endD) return false;
        const dow = hd.getDay();
        return dow !== 0 && dow !== 6;
      });

      const base = periodType === 'week' ? 45 : 180;
      const req  = Math.max(0, base - weekdayHols.length * 9);

      setReport(res);
      setPeriodHols(weekdayHols);
      setReqHours(req);
      setPreview(true);
      toast(`Report ready — ${res.rows.length} employees`, 'success');
    } catch (e) {
      toast(e?.message || 'Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ── Save edits to DB ──────────────────────────────────────────
  async function handleSave() {
    if (!report) return;
    try {
      const overrides = report.rows.map(r => ({
        employee_id:    r.employee_id,
        original_hours: r.total_hours,
        edited_hours:   editedHours[r.employee_id] !== undefined
          ? hmToHours(editedHours[r.employee_id])
          : r.total_hours,
      }));
      await api('POST', '/api/reports/attendance/save-hours', {
        start_date: report.start_date,
        end_date:   report.end_date,
        overrides,
      });
      setEditMode(false);
      setEditsSaved(true);
      toast('Adjusted hours saved permanently. Send Reminder will use these hours.', 'success');
    } catch (e) {
      toast(e?.message || 'Failed to save hours', 'error');
    }
  }

  function handleCancelEdit() {
    setEditMode(false);
    // Restore previously saved edits (from DB), discard unsaved changes
    const savedEdits = {};
    (report?.rows || []).forEach(r => {
      if (r.edited_hours !== null && r.edited_hours !== undefined) {
        savedEdits[r.employee_id] = hoursToHM(r.edited_hours);
      }
    });
    setEditedHours(savedEdits);
  }

  // ── Send hours reminder emails ────────────────────────────────
  async function handleSend() {
    if (!report || reqHours === null) return;
    setSending(true);
    try {
      const employees = report.rows.map(r => ({
        employee_id:    r.employee_id,
        actual_hours:   effectiveHours(r.employee_id, r.total_hours),
        required_hours: getEmpReqHours(r) ?? 0,
      }));
      const res = await api('POST', '/api/reports/attendance/send-hours-reminder', {
        period_label: report.period_label,
        period_type:  periodType,
        employees,
      });
      if (res.sent === 0) {
        toast('All employees meet the hours target — no reminders needed.', 'success');
      } else {
        toast(`Reminder sent to ${res.sent} employee${res.sent !== 1 ? 's' : ''} below ${reqHours}h target.`, 'success');
      }
    } catch (e) {
      toast(e?.message || 'Failed to send reminders', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-full">

      {/* ── Page header ── */}
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="text-xs text-gray-400 mt-0.5">Generate weekly or monthly attendance reports for all active employees</p>
      </div>

      {/* ── Controls ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Tab strip */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 rounded-t-xl overflow-hidden">
          {[{ v: 'week', l: 'Weekly Report' }, { v: 'month', l: 'Monthly Report' }].map(t => (
            <button
              key={t.v}
              onClick={() => { setPeriodType(t.v); setReport(null); setReqHours(null); setEditsSaved(false); }}
              className={`px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                periodType === t.v
                  ? 'border-accent text-accent dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-5 space-y-4">
          {periodType === 'week' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Sel label="Year"        value={wYear}  onChange={v => { setWYear(+v);  setWWeek(''); setReport(null); }} options={yearOptions.map(y => ({ value: y, label: String(y) }))} />
              <Sel label="Month"       value={wMonth} onChange={v => { setWMonth(+v); setWWeek(''); setReport(null); }} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
              <Sel label="Select Week" value={wWeek}  onChange={setWWeek}
                options={[{ value: '', label: '— Choose a week —' }, ...weeks.map(w => ({ value: w.start, label: w.label }))]} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Sel label="Year"  value={mYear}  onChange={v => { setMYear(+v);  setReport(null); }} options={yearOptions.map(y => ({ value: y, label: String(y) }))} />
              <Sel label="Month" value={mMonth} onChange={v => { setMMonth(+v); setReport(null); }} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-2.5 px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/90 active:scale-95 disabled:opacity-50 transition-all duration-150 shadow-sm hover:shadow-md"
            >
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <BarChart2 size={15} />}
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <RefreshCw size={20} className="animate-spin text-accent" />
          <span className="text-sm">Generating report…</span>
        </div>
      )}

      {/* ── Results ── */}
      {report && !loading && (
        <div className="space-y-4">

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <StatCard icon={Users}        label="Employees"      value={report.rows.length}  color="blue" />
              <StatCard icon={CheckCircle2} label="Present Days"   value={totalPresent}         color="green" />
              <StatCard icon={Clock}        label="Total Hours"    value={fmtHours(totalHours)} color="purple" />
              <StatCard icon={TrendingUp}   label="Avg / Employee" value={fmtHours(avgHours)}   color="amber" />
              {reqHours !== null && (
                <StatCard
                  icon={Target}
                  label="Target Hours"
                  value={`${reqHours}h`}
                  color={belowTarget > 0 ? 'red' : 'green'}
                  sub={periodHols.length > 0
                    ? `${periodHols.length} holiday${periodHols.length > 1 ? 's' : ''} deducted`
                    : `${belowTarget > 0 ? `${belowTarget} below target` : 'All on track'}`}
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              {/* Edit / Save / Cancel */}
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
                >
                  <Pencil size={13} />
                  Edit Hours
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
                  >
                    <Save size={13} />
                    Save
                  </button>
                </>
              )}

              {/* Hide/Preview */}
              <button
                onClick={() => setPreview(p => !p)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
              >
                {preview ? <EyeOff size={13} /> : <Eye size={13} />}
                {preview ? 'Hide' : 'Preview'}
              </button>

              {/* Download */}
              <button
                onClick={() => exportToExcel(report, editedHours, getEmpReqHours)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
              >
                <FileSpreadsheet size={13} />
                Download Excel
              </button>

              {/* Send Reminder — visible whenever report exists */}
              <button
                onClick={handleSend}
                disabled={sending || editMode}
                title={editMode ? 'Save edits first before sending' : ''}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
              >
                {sending
                  ? <RefreshCw size={13} className="animate-spin" />
                  : <Mail size={13} />}
                Send Reminder
              </button>
            </div>
          </div>

          {/* Edit mode notice */}
          {editMode && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
              <Pencil size={13} />
              <span>Edit mode — adjust total hours for employees who had permitted early departures. Click <strong>Save</strong> when done.</span>
            </div>
          )}

          {/* Period + required hours badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {report.period_label} · {report.days.length} day{report.days.length !== 1 ? 's' : ''} · {report.rows.length} active employee{report.rows.length !== 1 ? 's' : ''}
              </span>
            </div>
            {reqHours !== null && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">
                  Target: {reqHours}h {periodType === 'week' ? '/ week' : '/ month'}
                  {periodHols.length > 0 && ` (${periodHols.length} holiday${periodHols.length > 1 ? 's' : ''} × 9h deducted)`}
                </span>
                {belowTarget > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold">
                    {belowTarget} below target
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Preview table */}
          {preview && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-r border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[180px]">
                        Employee
                      </th>
                      <th className="bg-gray-50 dark:bg-gray-800 px-3 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-r border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[120px]">
                        Department
                      </th>
                      {report.days.map(d => (
                        <th key={d.date} className="bg-gray-50 dark:bg-gray-800 px-1 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[80px]">
                          {d.day}
                        </th>
                      ))}
                      <th className="bg-gray-50 dark:bg-gray-800 px-3 py-3 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-l border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Std Work Hrs
                      </th>
                      <th className="bg-gray-50 dark:bg-gray-800 px-3 py-3 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Original Hrs
                      </th>
                      <th className="bg-gray-50 dark:bg-gray-800 px-3 py-3 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Adjusted Hrs{editMode && <span className="ml-1 text-amber-400 normal-case tracking-normal">(edit)</span>}
                      </th>
                      <th className="bg-gray-50 dark:bg-gray-800 px-3 py-3 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Days
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row, ri) => {
                      const effH     = effectiveHours(row.employee_id, row.total_hours);
                      const empReq   = getEmpReqHours(row);
                      const belowReq = empReq !== null && empReq > 0 && effH < empReq;
                      const rowBg    = ri % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/40 dark:bg-gray-800/20';
                      const hm = editedHours[row.employee_id] !== undefined
                        ? editedHours[row.employee_id]
                        : hoursToHM(row.total_hours);
                      const setHM = (field, val) => setEditedHours(prev => ({
                        ...prev,
                        [row.employee_id]: { ...hm, [field]: parseInt(val) || 0 },
                      }));
                      return (
                        <tr
                          key={row.employee_id}
                          className={`${rowBg} hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors`}
                        >
                          {/* Employee name */}
                          <td className={`sticky left-0 z-10 px-4 py-2.5 border-r border-b border-gray-100 dark:border-gray-800 ${rowBg}`}>
                            <div className="font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap">{row.employee_name}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{row.employee_code}</div>
                          </td>
                          {/* Dept */}
                          <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap border-r border-b border-gray-100 dark:border-gray-800">
                            {row.department}
                          </td>
                          {/* Day cells */}
                          {row.days.map(d => {
                            const sc = STATUS_COLOR[d.status];
                            return (
                              <td key={d.date} className="px-1 py-2 text-center border-b border-gray-100 dark:border-gray-800 min-w-[80px]">
                                {d.status === '—' ? (
                                  <span className="text-gray-200 dark:text-gray-700 text-[11px]">—</span>
                                ) : (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span
                                      className="inline-flex items-center justify-center rounded-md text-[10px] font-bold px-1.5 py-0.5 leading-none"
                                      style={{ background: sc?.bg || '#f3f4f6', color: sc?.fg || '#6b7280' }}
                                    >
                                      {STATUS_SHORT[d.status] || d.status}
                                    </span>
                                    {d.in_time !== '—' && (
                                      <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-tight tabular-nums">
                                        {d.in_time}–{d.out_time}
                                      </span>
                                    )}
                                    {d.hours > 0 && (
                                      <span className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
                                        {fmtHours(d.hours)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}

                          {/* Standard Work Hours */}
                          <td className="px-3 py-2 text-right border-l border-b border-gray-100 dark:border-gray-800">
                            <span className="tabular-nums text-blue-600 dark:text-blue-400 text-xs font-medium">
                              {empReq != null && empReq > 0 ? fmtHours(empReq) : '—'}
                            </span>
                          </td>

                          {/* Original Hours */}
                          <td className="px-3 py-2 text-right border-b border-gray-100 dark:border-gray-800">
                            <span className="tabular-nums text-gray-500 dark:text-gray-400 text-xs">
                              {fmtHours(row.total_hours)}
                            </span>
                          </td>

                          {/* Adjusted Hours — editable in edit mode */}
                          <td className="px-3 py-2 text-right border-b border-gray-100 dark:border-gray-800">
                            {editMode ? (
                              <div className="flex items-center gap-0.5 justify-end">
                                <input
                                  type="number" min="0" max="999" step="1"
                                  value={hm.h}
                                  onChange={e => setHM('h', e.target.value)}
                                  className="w-12 text-right bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-600 rounded px-1.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-400"
                                />
                                <span className="text-[10px] text-gray-400">h</span>
                                <input
                                  type="number" min="0" max="59" step="1"
                                  value={hm.m}
                                  onChange={e => setHM('m', e.target.value)}
                                  className="w-10 text-right bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-600 rounded px-1.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-400"
                                />
                                <span className="text-[10px] text-gray-400">m</span>
                              </div>
                            ) : (
                              <span className={`font-semibold tabular-nums whitespace-nowrap ${
                                belowReq ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'
                              }`}>
                                {fmtHours(effH)}
                                {editedHours[row.employee_id] !== undefined && effH !== row.total_hours && (
                                  <span className="ml-1 text-[9px] font-normal text-amber-500">(adj)</span>
                                )}
                                {belowReq && empReq !== null && (
                                  <span className="ml-1 text-[9px] font-normal text-red-400">
                                    ({Math.round((empReq - effH) * 10) / 10}h short)
                                  </span>
                                )}
                              </span>
                            )}
                          </td>

                          {/* Days */}
                          <td className="px-3 py-2.5 text-right tabular-nums border-b border-gray-100 dark:border-gray-800">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[11px] font-semibold">
                              {row.present_days}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">{report.rows.length} employees · {report.days.length} days</span>
                <button
                  onClick={() => exportToExcel(report, editedHours, getEmpReqHours)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold transition-all"
                >
                  <FileSpreadsheet size={11} />
                  Download Excel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
