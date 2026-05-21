import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import DatePicker from '../../components/DatePicker';
import Select from '../../components/Select';
import { ChevronLeft, ChevronRight, Save, CheckCircle2, ClipboardList } from 'lucide-react';

const STATUSES = ['In Progress', 'Completed', 'On Hold', 'Pending'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getDate()}-${MONTH_NAMES[dt.getMonth()].slice(0, 3)}-${String(dt.getFullYear()).slice(2)}`;
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

export default function EmpStatus({ toast }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [localData, setLocalData] = useState({});
  const [dirty, setDirty]         = useState({});
  const [saving, setSaving]       = useState({});

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const data = await api('GET', `/api/portal/status?month=${monthStr}`);
      setEntries(data);
      const ld = {};
      data.forEach(e => {
        ld[e.id] = {
          task_name:        e.task_name || '',
          due_date:         e.due_date  || '',
          status:           e.status    || 'In Progress',
          percent_complete: e.percent_complete ?? 0,
        };
      });
      setLocalData(ld);
      setDirty({});
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const handleChange = (id, field, value) => {
    setLocalData(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setDirty(prev => ({ ...prev, [id]: true }));
  };

  const saveRow = async (id) => {
    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      await api('PUT', `/api/portal/status/${id}`, localData[id]);
      setDirty(prev => { const n = { ...prev }; delete n[id]; return n; });
      toast('Saved', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(prev => { const n = { ...prev }; delete n[id]; return n; }); }
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

  const completedCount = entries.filter(e => (localData[e.id]?.status || e.status) === 'Completed').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Daily Status Sheet</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Log your daily work activities (Mon–Fri)</p>
        </div>
      </div>

      <div className="page-content space-y-4">

        {/* Month navigator + stats */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="btn btn-secondary btn-sm p-1.5">
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-white min-w-[130px] text-center">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className="btn btn-secondary btn-sm p-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isCurrentMonth && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full font-medium">
                Current Month
              </span>
            )}
            {entries.length > 0 && (
              <span className="text-xs text-gray-500">
                {completedCount}/{entries.length} completed
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-[80px]">Task ID</th>
                  <th>Task Name / Description</th>
                  <th className="hidden md:table-cell w-[130px]">Assigned To</th>
                  <th className="w-[100px]">Start Date</th>
                  <th className="hidden sm:table-cell w-[110px]">Due Date</th>
                  <th className="w-[130px]">Status</th>
                  <th className="hidden sm:table-cell w-[90px]">% Complete</th>
                  {isCurrentMonth && <th className="w-[60px]"></th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-400">Loading…</td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <ClipboardList size={36} className="mb-2 text-gray-300" />
                        <p className="text-sm text-gray-500">No working days in this period</p>
                      </div>
                    </td>
                  </tr>
                ) : entries.map(entry => {
                  const local    = localData[entry.id] || {};
                  const isDirty  = !!dirty[entry.id];
                  const isSaving = !!saving[entry.id];

                  return (
                    <tr
                      key={entry.id}
                      className={isDirty ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}
                    >
                      <td className="font-mono text-xs text-gray-500 whitespace-nowrap">{entry.task_id}</td>

                      <td>
                        {isCurrentMonth ? (
                          <textarea
                            className="form-textarea text-sm min-h-[52px] resize-y w-full"
                            placeholder="What did you work on today?"
                            value={local.task_name}
                            onChange={e => handleChange(entry.id, 'task_name', e.target.value)}
                          />
                        ) : (
                          <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {entry.task_name || <span className="text-gray-400 italic">Not filled</span>}
                          </span>
                        )}
                      </td>

                      <td className="hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">
                        {entry.employee_name}
                      </td>

                      <td className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {fmtDate(entry.entry_date)}
                      </td>

                      <td className="hidden sm:table-cell">
                        {isCurrentMonth ? (
                          <DatePicker
                            value={local.due_date}
                            onChange={v => handleChange(entry.id, 'due_date', v)}
                            placeholder="Due date"
                          />
                        ) : (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {entry.due_date ? fmtDate(entry.due_date) : '—'}
                          </span>
                        )}
                      </td>

                      <td>
                        {isCurrentMonth ? (
                          <Select
                            value={local.status}
                            onChange={v => handleChange(entry.id, 'status', v)}
                            options={STATUSES}
                          />
                        ) : (
                          <StatusBadge status={entry.status} />
                        )}
                      </td>

                      <td className="hidden sm:table-cell">
                        {isCurrentMonth ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              className="form-input text-xs w-16"
                              value={local.percent_complete}
                              onChange={e => handleChange(entry.id, 'percent_complete', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                            />
                            <span className="text-xs text-gray-400">%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-700 dark:text-gray-300">{entry.percent_complete}%</span>
                        )}
                      </td>

                      {isCurrentMonth && (
                        <td className="text-center">
                          {isDirty ? (
                            <button
                              onClick={() => saveRow(entry.id)}
                              disabled={isSaving}
                              className="btn btn-primary btn-xs gap-1 disabled:opacity-60"
                            >
                              {isSaving ? '…' : <><Save size={10} /> Save</>}
                            </button>
                          ) : (
                            <CheckCircle2 size={14} className="text-gray-300 dark:text-gray-600 mx-auto" />
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {!isCurrentMonth && entries.length > 0 && (
          <p className="text-xs text-gray-400 text-center">Past month — read only</p>
        )}
      </div>
    </>
  );
}
