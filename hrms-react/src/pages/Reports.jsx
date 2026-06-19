import { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart2, Eye, EyeOff, Calendar, ChevronDown, FileSpreadsheet, RefreshCw, Clock, Users, CheckCircle2, TrendingUp } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../hooks/useToast';
import * as XLSX from 'xlsx';

// ── Date helpers (timezone-safe — use local date, never toISOString) ──
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
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
    // advance to Sunday (day 0) or end of month
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

const STATUS_SHORT = { Present: 'P', Absent: 'A', 'On Leave': 'L', 'Half Day': 'HD', WFH: 'WFH' };
const STATUS_COLOR = {
  Present:    { bg: '#dcfce7', fg: '#15803d' },
  Absent:     { bg: '#fee2e2', fg: '#b91c1c' },
  'On Leave': { bg: '#dbeafe', fg: '#1d4ed8' },
  'Half Day': { bg: '#fef9c3', fg: '#a16207' },
  WFH:        { bg: '#f3e8ff', fg: '#7c3aed' },
};

// ── Excel export ───────────────────────────────────────────────
const DAY_ABBR = ['S', 'M', 'T', 'W', 'Th', 'F', 'St']; // Sun=0 … Sat=6

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

function exportToExcel(report) {
  const { rows, days, period_label } = report;
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Summary ──────────────────────────────────────────
  const summaryAoa = [];
  summaryAoa.push(['Attendance Summary Report']);
  summaryAoa.push([period_label]);
  summaryAoa.push(['Generated: ' + new Date().toLocaleString()]);
  summaryAoa.push([]);

  // Headers
  summaryAoa.push([
    'Emp ID', 'Name', 'Department',
    'Present Days', 'Leave Days', 'Absent Days', 'Total Work Hrs', 'Status',
  ]);

  for (const row of rows) {
    summaryAoa.push([
      row.employee_code,
      row.employee_name,
      row.department,
      row.present_days,
      row.in_probation ? '—' : row.leave_days,   // leave only for post-probation
      row.in_probation ? row.absent_days + (row.leave_days || 0) : row.absent_days, // probation: all non-present = absent
      fmtDuration(row.total_hours),
      row.in_probation ? 'Probation' : 'Confirmed',
    ]);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(summaryAoa);
  ws1['!cols'] = [
    { wch: 12 }, { wch: 28 }, { wch: 22 },
    { wch: 14 }, { wch: 13 }, { wch: 13 }, { wch: 15 }, { wch: 12 },
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
    detailAoa.push(['', '', '', 'Duration', ...row.days.map(d => fmtDuration(d.hours)), fmtDuration(row.total_hours)]);
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
        {/* Trigger */}
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

        {/* Dropdown panel */}
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
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   ic: 'text-blue-500' },
    green:  { bg: 'bg-green-50 dark:bg-green-900/20', ic: 'text-green-500' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', ic: 'text-purple-500' },
    amber:  { bg: 'bg-amber-50 dark:bg-amber-900/20',  ic: 'text-amber-500' },
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
  const [loading, setLoading] = useState(false);
  const [report,  setReport]  = useState(null);
  const [preview, setPreview] = useState(true);

  const weeks = useMemo(() => getWeeksOfMonth(wYear, wMonth), [wYear, wMonth]);
  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  async function generate() {
    let start, end, label, rtype;
    if (periodType === 'week') {
      if (!wWeek) return toast('Please select a week', 'warning');
      const w = weeks.find(w => w.start === wWeek);
      if (!w) return toast('Invalid week', 'warning');
      start = w.start; end = w.end;
      label = `${w.label} ${wYear}`;
      rtype = 'attendance_weekly';
    } else {
      const r = monthRange(mYear, mMonth);
      start = r.start; end = r.end;
      label = `${MONTHS[mMonth - 1]} ${mYear}`;
      rtype = 'attendance_monthly';
    }
    setLoading(true);
    setReport(null);
    try {
      const res = await api('POST', '/api/reports/attendance', { start_date: start, end_date: end, period_label: label, report_type: rtype });
      setReport(res);
      setPreview(true);
      toast(`Report ready — ${res.rows.length} employees`, 'success');
    } catch (e) {
      toast(e?.message || 'Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  }

  const totalPresent = report?.rows.reduce((s, r) => s + r.present_days, 0) ?? 0;
  const totalHours   = report?.rows.reduce((s, r) => s + r.total_hours,  0) ?? 0;
  const avgHours     = report?.rows.length ? totalHours / report.rows.length : 0;

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
              onClick={() => { setPeriodType(t.v); setReport(null); }}
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
              <Sel
                label="Year"
                value={wYear}
                onChange={v => { setWYear(+v); setWWeek(''); setReport(null); }}
                options={yearOptions.map(y => ({ value: y, label: String(y) }))}
              />
              <Sel
                label="Month"
                value={wMonth}
                onChange={v => { setWMonth(+v); setWWeek(''); setReport(null); }}
                options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
              />
              <Sel
                label="Select Week"
                value={wWeek}
                onChange={setWWeek}
                options={[{ value: '', label: '— Choose a week —' }, ...weeks.map(w => ({ value: w.start, label: w.label }))]}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Sel
                label="Year"
                value={mYear}
                onChange={v => { setMYear(+v); setReport(null); }}
                options={yearOptions.map(y => ({ value: y, label: String(y) }))}
              />
              <Sel
                label="Month"
                value={mMonth}
                onChange={v => { setMMonth(+v); setReport(null); }}
                options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
              />
            </div>
          )}

          {/* Generate button — always on its own row, full-width on mobile */}
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
              <StatCard icon={Users}        label="Employees"     value={report.rows.length}  color="blue" />
              <StatCard icon={CheckCircle2} label="Present Days"  value={totalPresent}         color="green" />
              <StatCard icon={Clock}        label="Total Hours"   value={fmtHours(totalHours)} color="purple" />
              <StatCard icon={TrendingUp}   label="Avg / Employee" value={fmtHours(avgHours)}  color="amber" />
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setPreview(p => !p)}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                {preview ? <EyeOff size={13} /> : <Eye size={13} />}
                {preview ? 'Hide' : 'Preview'}
              </button>
              <button
                onClick={() => exportToExcel(report)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
              >
                <FileSpreadsheet size={13} />
                Download Excel
              </button>
            </div>
          </div>

          {/* Period badge */}
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {report.period_label} · {report.days.length} day{report.days.length !== 1 ? 's' : ''} · {report.rows.length} active employee{report.rows.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Preview table */}
          {preview && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      {/* Frozen cols */}
                      <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-r border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[180px]">
                        Employee
                      </th>
                      <th className="bg-gray-50 dark:bg-gray-800 px-3 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-r border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[120px]">
                        Department
                      </th>
                      {/* Day columns */}
                      {report.days.map(d => (
                        <th key={d.date} className="bg-gray-50 dark:bg-gray-800 px-1 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[80px]">
                          {d.day}
                        </th>
                      ))}
                      <th className="bg-gray-50 dark:bg-gray-800 px-3 py-3 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-l border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Total Hrs
                      </th>
                      <th className="bg-gray-50 dark:bg-gray-800 px-3 py-3 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Days
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row, ri) => (
                      <tr
                        key={row.employee_id}
                        className={`${ri % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/40 dark:bg-gray-800/20'} hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors`}
                      >
                        {/* Employee name */}
                        <td className={`sticky left-0 z-10 px-4 py-2.5 border-r border-b border-gray-100 dark:border-gray-800 ${ri % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/40 dark:bg-gray-800/20'}`}>
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
                        {/* Totals */}
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap border-l border-b border-gray-100 dark:border-gray-800 tabular-nums">
                          {fmtHours(row.total_hours)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums border-b border-gray-100 dark:border-gray-800">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[11px] font-semibold">
                            {row.present_days}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">{report.rows.length} employees · {report.days.length} days</span>
                <button
                  onClick={() => exportToExcel(report)}
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
