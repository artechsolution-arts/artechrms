import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import { RefreshCw, Search, ArrowLeft } from 'lucide-react';
import MonthYearPicker from '../components/MonthYearPicker';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getDate()}-${MONTH_NAMES[dt.getMonth()].slice(0,3)}-${String(dt.getFullYear()).slice(2)}`;
}

function Avatar({ name, photo }) {
  if (photo) return <img src={photo} alt={name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />;
  return (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white font-bold text-lg flex items-center justify-center flex-shrink-0">
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    'Completed':   'bg-green-50 text-green-700 border-green-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    'On Hold':     'bg-amber-50 text-amber-700 border-amber-200',
    'Pending':     'bg-gray-50 text-gray-600 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      {status || '—'}
    </span>
  );
}

export default function HRStatusSheet({ toast }) {
  const today = new Date();
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedEmp, setSelectedEmp] = useState(null); // full emp object
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [sheetData, setSheetData] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false);

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  useEffect(() => {
    setEmpLoading(true);
    api('GET', '/api/employees?all=true')
      .then(data => setEmployees(Array.isArray(data) ? data : data.items || []))
      .catch(e => toast(e.message, 'error'))
      .finally(() => setEmpLoading(false));
  }, []);

  const loadSheet = useCallback(async (empId, y, m) => {
    if (!empId) return;
    setSheetLoading(true);
    try {
      const monthStr = `${y}-${String(m).padStart(2, '0')}`;
      setSheetData(await api('GET', `/api/hrm/status?employee_id=${empId}&month=${monthStr}`));
    } catch (e) { toast(e.message, 'error'); }
    finally { setSheetLoading(false); }
  }, []);

  const openSheet = (emp) => {
    setSelectedEmp(emp);
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    setSheetData(null);
    loadSheet(emp.id, today.getFullYear(), today.getMonth() + 1);
  };

  const filtered = employees.filter(e => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      e.full_name?.toLowerCase().includes(s) ||
      e.employee_id?.toLowerCase().includes(s) ||
      e.department?.toLowerCase().includes(s) ||
      e.designation?.toLowerCase().includes(s)
    );
  });

  const entries = sheetData?.entries || [];
  const completedCount = entries.filter(e => e.status === 'Completed').length;
  const filled = entries.filter(e => e.task_name).length;

  // ── SHEET VIEW ───────────────────────────────────────────────
  if (selectedEmp) {
    return (
      <>
        <div className="page-head">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedEmp(null); setSheetData(null); }}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="page-title">{selectedEmp.full_name}</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedEmp.employee_id} · {selectedEmp.designation || 'No designation'} · {selectedEmp.department || 'No department'}
              </p>
            </div>
          </div>

          {/* Month navigation */}
          <MonthYearPicker
            month={month} year={year}
            onChange={(m, y) => { setMonth(m); setYear(y); loadSheet(selectedEmp?.id, y, m); }}
            maxMonth={new Date().getMonth() + 1} maxYear={new Date().getFullYear()}
          />
        </div>

        <div className="page-content">
          {sheetLoading ? (
            <div className="card p-10 text-center text-sm text-gray-400">Loading…</div>
          ) : (
            <div className="card">
              {entries.length > 0 && (
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar name={selectedEmp.full_name} photo={selectedEmp.profile_photo} />
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-white">{selectedEmp.full_name}</div>
                      <div className="text-xs text-gray-400">{selectedEmp.employee_id} · {MONTH_NAMES[month - 1]} {year}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>{entries.length} working days</span>
                    <span className="text-green-600 font-medium">{completedCount} completed</span>
                    <span className={filled < entries.length ? 'text-amber-600' : 'text-gray-400'}>
                      {filled}/{entries.length} filled
                    </span>
                  </div>
                </div>
              )}

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-[80px]">Task ID</th>
                      <th>Task Name / Description</th>
                      <th className="w-[100px]">Start Date</th>
                      <th className="hidden sm:table-cell w-[100px]">Due Date</th>
                      <th className="w-[130px]">Status</th>
                      <th className="hidden sm:table-cell w-[90px]">% Complete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                          No entries for {MONTH_NAMES[month - 1]} {year}
                        </td>
                      </tr>
                    ) : entries.map(e => (
                      <tr key={e.id}>
                        <td className="font-mono text-xs text-gray-500 whitespace-nowrap">{e.task_id}</td>
                        <td className="text-sm text-gray-700 dark:text-gray-300 max-w-xs whitespace-pre-wrap">
                          {e.task_name || <span className="text-gray-400 italic text-xs">Not filled</span>}
                        </td>
                        <td className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{fmtDate(e.entry_date)}</td>
                        <td className="hidden sm:table-cell text-xs text-gray-600 dark:text-gray-400">{e.due_date ? fmtDate(e.due_date) : '—'}</td>
                        <td><StatusBadge status={e.status} /></td>
                        <td className="hidden sm:table-cell text-xs text-gray-700 dark:text-gray-300">{e.percent_complete}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // ── GRID VIEW ────────────────────────────────────────────────
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Status Sheets</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Click any employee to view their daily work log</p>
        </div>
        <button
          onClick={() => { setEmpLoading(true); api('GET', '/api/employees?all=true').then(d => setEmployees(Array.isArray(d) ? d : d.items || [])).catch(e => toast(e.message,'error')).finally(() => setEmpLoading(false)); }}
          className="btn btn-secondary btn-sm gap-1.5"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-content">
        {/* Search */}
        <div className="card mb-4 p-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="form-input pl-8"
              placeholder="Search by name, ID, department, designation…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {empLoading ? (
          <div className="card p-10 text-center text-sm text-gray-400">Loading employees…</div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <p className="text-sm text-gray-500">No employees match your search</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map(e => (
              <div
                key={e.id}
                onClick={() => openSheet(e)}
                className="card p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 select-none"
              >
                <Avatar name={e.full_name} photo={e.profile_photo} />
                <div className="mt-3 w-full">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{e.full_name}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{e.designation || 'No designation'}</p>
                  <p className="text-xs text-gray-400 truncate">{e.department || 'No department'}</p>
                  <div className="mt-2 flex items-center justify-center">
                    <Badge text={e.status} />
                  </div>
                  <code className="text-[10px] text-gray-400 mt-1 block">{e.employee_id}</code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
