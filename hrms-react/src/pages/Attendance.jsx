import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { fmtDate } from '../utils/date';
import DatePicker from '../components/DatePicker';
import Select from '../components/Select';
import AttendanceCalendar from '../components/AttendanceCalendar';
import { Plus, RefreshCw, X, Search, Users, Pencil, Save } from 'lucide-react';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import MonthYearPicker from '../components/MonthYearPicker';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_DOT = {
  Present:    'bg-green-500',
  Absent:     'bg-red-500',
  'On Leave': 'bg-amber-500',
  'Half Day': 'bg-blue-500',
  WFH:        'bg-purple-500',
};

const ATT_BAR_COLOR = {
  Present:    'bg-green-500',
  WFH:        'bg-purple-400',
  'Half Day': 'bg-blue-400',
  'On Leave': 'bg-amber-400',
  Absent:     'bg-red-400',
};

function Avatar({ name, photo }) {
  if (photo) {
    return <img src={photo} alt={name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white text-xl font-bold flex items-center justify-center flex-shrink-0">
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

export default function Attendance({ toast }) {
  const today = new Date();
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);

  const [emps, setEmps]         = useState([]);
  const [empSummaries, setEmpSummaries] = useState({});  // { empId: { Present: N, Absent: M, ... } }
  const [loadingEmps, setLoadingEmps]   = useState(true);
  const [search, setSearch]     = useState('');

  // Popup calendar state
  const [popupEmp, setPopupEmp]         = useState(null);
  const [popupYear, setPopupYear]       = useState(today.getFullYear());
  const [popupMonth, setPopupMonth]     = useState(today.getMonth() + 1);
  const [popupRecords, setPopupRecords] = useState([]);
  const [popupHolidays, setPopupHolidays] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupSelected, setPopupSelected] = useState(null);

  // Mark attendance modal
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({});
  const [editModal, setEditModal] = useState(false);
  const [editRow, setEditRow]     = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [inlineForm, setInlineForm] = useState({ status: 'Present', in_time: '', out_time: '' });
  const [inlineSaving, setInlineSaving] = useState(false);

  const todayStr = today.toISOString().split('T')[0];

  const loadSummaries = useCallback(async (year, month) => {
    setLoadingEmps(true);
    try {
      const [employees, att] = await Promise.all([
        api('GET', '/api/employees?all=true'),
        api('GET', `/api/leaves/attendance?year=${year}&month=${month}`),
      ]);
      setEmps(employees);
      const summaries = {};
      for (const a of att) {
        if (!summaries[a.employee_id]) summaries[a.employee_id] = {};
        summaries[a.employee_id][a.status] = (summaries[a.employee_id][a.status] || 0) + 1;
      }
      setEmpSummaries(summaries);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoadingEmps(false); }
  }, []);

  useEffect(() => { loadSummaries(calYear, calMonth); }, [calYear, calMonth, loadSummaries]);
  useRefreshOnFocus(() => loadSummaries(calYear, calMonth));

  // Sync inline edit form when a date is selected in the popup
  useEffect(() => {
    if (!popupSelected) return;
    const rec = popupRecords.find(r => r.date === popupSelected);
    setInlineForm({
      status:   rec?.status   || 'Present',
      in_time:  rec?.in_time  || '',
      out_time: rec?.out_time || '',
    });
  }, [popupSelected, popupRecords]);

  const openPopup = async (emp) => {
    setPopupEmp(emp);
    setPopupYear(calYear);
    setPopupMonth(calMonth);
    setPopupSelected(null);
    setPopupRecords([]);
    setPopupLoading(true);
    try {
      const [att, holidays] = await Promise.all([
        api('GET', `/api/leaves/attendance?employee_id=${emp.id}&year=${calYear}&month=${calMonth}`),
        api('GET', `/api/hrm/holidays?year=${calYear}`),
      ]);
      setPopupRecords(att);
      setPopupHolidays(holidays);
    } catch (e) { toast(e.message, 'error'); }
    finally { setPopupLoading(false); }
  };

  const popupPrev = async () => {
    const ny = popupMonth === 1 ? popupYear - 1 : popupYear;
    const nm = popupMonth === 1 ? 12 : popupMonth - 1;
    setPopupYear(ny); setPopupMonth(nm); setPopupSelected(null);
    setPopupLoading(true);
    try {
      const [att, holidays] = await Promise.all([
        api('GET', `/api/leaves/attendance?employee_id=${popupEmp.id}&year=${ny}&month=${nm}`),
        api('GET', `/api/hrm/holidays?year=${ny}`),
      ]);
      setPopupRecords(att);
      setPopupHolidays(holidays);
    } catch (e) { toast(e.message, 'error'); }
    finally { setPopupLoading(false); }
  };

  const popupNext = async () => {
    const ny = popupMonth === 12 ? popupYear + 1 : popupYear;
    const nm = popupMonth === 12 ? 1 : popupMonth + 1;
    setPopupYear(ny); setPopupMonth(nm); setPopupSelected(null);
    setPopupLoading(true);
    try {
      const [att, holidays] = await Promise.all([
        api('GET', `/api/leaves/attendance?employee_id=${popupEmp.id}&year=${ny}&month=${nm}`),
        api('GET', `/api/hrm/holidays?year=${ny}`),
      ]);
      setPopupRecords(att);
      setPopupHolidays(holidays);
    } catch (e) { toast(e.message, 'error'); }
    finally { setPopupLoading(false); }
  };

  const f = v => setForm(prev => ({ ...prev, ...v }));
  const ef = v => setEditForm(prev => ({ ...prev, ...v }));

  const save = async () => {
    if (!form.employee_id) return toast('Select employee', 'warning');
    try {
      await api('POST', '/api/leaves/attendance', {
        employee_id: parseInt(form.employee_id),
        date: form.date || todayStr,
        status: form.status || 'Present',
        in_time: form.in_time || null,
        out_time: form.out_time || null,
      });
      toast('Attendance marked', 'success');
      setModal(false);
      loadSummaries(calYear, calMonth);
      if (popupEmp) openPopup(popupEmp);
    } catch (e) { toast(e.message, 'error'); }
  };

  const saveEdit = async () => {
    try {
      await api('PUT', `/api/leaves/attendance/${editRow.id}`, {
        status: editForm.status,
        in_time: editForm.in_time || null,
        out_time: editForm.out_time || null,
      });
      toast('Attendance updated', 'success');
      setEditModal(false);
      loadSummaries(calYear, calMonth);
      if (popupEmp) openPopup(popupEmp);
    } catch (e) { toast(e.message, 'error'); }
  };

  const saveInline = async () => {
    if (!popupEmp || !popupSelected) return;
    const rec = popupRecords.find(r => r.date === popupSelected);
    setInlineSaving(true);
    try {
      if (rec) {
        await api('PUT', `/api/leaves/attendance/${rec.id}`, {
          status:   inlineForm.status,
          in_time:  inlineForm.in_time  || null,
          out_time: inlineForm.out_time || null,
        });
      } else {
        await api('POST', '/api/leaves/attendance', {
          employee_id: popupEmp.id,
          date:        popupSelected,
          status:      inlineForm.status,
          in_time:     inlineForm.in_time  || null,
          out_time:    inlineForm.out_time || null,
        });
      }
      toast('Attendance updated', 'success');
      loadSummaries(calYear, calMonth);
      const att = await api('GET', `/api/leaves/attendance?employee_id=${popupEmp.id}&year=${popupYear}&month=${popupMonth}`);
      setPopupRecords(att);
    } catch (e) { toast(e.message, 'error'); }
    finally { setInlineSaving(false); }
  };

  const filtered = emps.filter(e =>
    !search || e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Attendance</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month selector */}
          <MonthYearPicker month={calMonth} year={calYear} onChange={(m, y) => { setCalMonth(m); setCalYear(y); }} />
          <button onClick={() => loadSummaries(calYear, calMonth)} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /></button>
          <button onClick={() => { setForm({ date: todayStr, status: 'Present' }); setModal(true); }} className="btn btn-primary btn-sm gap-1.5">
            <Plus size={13} /> Mark Attendance
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Search */}
        <div className="relative max-w-sm mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="form-input pl-8 py-1.5 text-sm"
            placeholder="Search employees…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Employee grid */}
        {loadingEmps ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse h-44" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Users size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No employees found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map(emp => {
              const s = empSummaries[emp.id] || {};
              const total = Object.values(s).reduce((a, b) => a + b, 0);
              return (
                <div
                  key={emp.id}
                  onClick={() => openPopup(emp)}
                  className="card p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] duration-150 select-none"
                >
                  <Avatar name={emp.full_name} photo={emp.profile_photo} />
                  <div className="mt-3 w-full">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{emp.full_name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{emp.designation || 'No designation'}</p>
                    <p className="text-xs text-gray-400 truncate">{emp.department || 'No department'}</p>
                    <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {emp.status || 'Active'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">{emp.employment_type}</p>
                  </div>
                  {/* Attendance bar */}
                  {total > 0 ? (
                    <div className="mt-3 w-full space-y-1">
                      <div className="flex justify-center gap-2 flex-wrap">
                        {Object.entries(s).map(([status, count]) => (
                          <span key={status} className="flex items-center gap-0.5 text-[10px] text-gray-500">
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || 'bg-gray-400'}`} />
                            {status === 'On Leave' ? 'Leave' : status}: {count}
                          </span>
                        ))}
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                        {['Present','WFH','Half Day','On Leave','Absent'].map(st => {
                          const pct = ((s[st] || 0) / total) * 100;
                          if (!pct) return null;
                          return <div key={st} style={{ width: `${pct}%` }} className={`h-full ${ATT_BAR_COLOR[st]}`} />;
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic mt-3">No records</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Employee Attendance Popup */}
      {popupEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setPopupEmp(null); }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <img
                  src={popupEmp.profile_photo || undefined}
                  onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                  className={`w-10 h-10 rounded-full object-cover ${popupEmp.profile_photo ? '' : 'hidden'}`}
                  alt={popupEmp.full_name}
                />
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white font-bold items-center justify-center ${popupEmp.profile_photo ? 'hidden' : 'flex'}`}>
                  {popupEmp.full_name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{popupEmp.full_name}</p>
                  <p className="text-xs text-gray-400">{popupEmp.designation || popupEmp.employee_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setForm({ employee_id: String(popupEmp.id), date: popupSelected || todayStr, status: 'Present' }); setModal(true); }}
                  className="btn btn-primary btn-sm gap-1"
                >
                  <Plus size={12} /> Mark
                </button>
                <button onClick={() => setPopupEmp(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <AttendanceCalendar
                records={popupRecords}
                holidays={popupHolidays}
                year={popupYear}
                month={popupMonth}
                loading={popupLoading}
                onPrev={popupPrev}
                onNext={popupNext}
                selected={popupSelected}
                onSelect={setPopupSelected}
              />
            </div>

            {/* Inline edit panel — appears when a date is selected */}
            {popupSelected && (
              <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 px-4 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Pencil size={13} className="text-[var(--accent)]" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">
                    {new Date(popupSelected + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {popupRecords.find(r => r.date === popupSelected) ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20 font-medium">Editing existing record</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20 font-medium">No record — will create</span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                    <Select
                      value={inlineForm.status}
                      onChange={v => setInlineForm(p => ({ ...p, status: v }))}
                      options={['Present', 'Absent', 'On Leave', 'Half Day', 'WFH']}
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">In Time</label>
                    <input
                      type="time"
                      className="form-input text-sm w-full"
                      value={inlineForm.in_time}
                      onChange={e => setInlineForm(p => ({ ...p, in_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Out Time</label>
                    <input
                      type="time"
                      className="form-input text-sm w-full"
                      value={inlineForm.out_time}
                      onChange={e => setInlineForm(p => ({ ...p, out_time: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={saveInline}
                      disabled={inlineSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <Save size={12} /> {inlineSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setPopupSelected(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mark Attendance — centered popup */}
      {modal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModal(false); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                  <Plus size={14} className="text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Mark Attendance</h3>
              </div>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Employee <span className="text-red-400">*</span></label>
                <Select
                  value={form.employee_id || ''}
                  onChange={v => f({ employee_id: v })}
                  options={emps.map(e => ({ value: String(e.id), label: e.full_name }))}
                  placeholder="Select employee"
                  searchable
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Date <span className="text-red-400">*</span></label>
                  <DatePicker value={form.date || todayStr} onChange={v => f({ date: v })} placeholder="Select date" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Status</label>
                  <Select
                    value={form.status || 'Present'}
                    onChange={v => f({ status: v })}
                    options={['Present', 'Absent', 'On Leave', 'Half Day', 'WFH']}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">In Time</label>
                  <input type="time" className="form-input w-full" value={form.in_time || ''} onChange={e => f({ in_time: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Out Time</label>
                  <input type="time" className="form-input w-full" value={form.out_time || ''} onChange={e => f({ out_time: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-2xl">
              <button onClick={() => setModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={save} className="btn btn-primary btn-sm">Mark Attendance</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
