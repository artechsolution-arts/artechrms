import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { fmtDate } from '../utils/date';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import DatePicker from '../components/DatePicker';
import Select from '../components/Select';
import AttendanceCalendar from '../components/AttendanceCalendar';
import { Plus, RefreshCw, ChevronLeft, ChevronRight, X, Search, Users } from 'lucide-react';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

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

  const prevMonth = () => {
    const ny = calMonth === 1 ? calYear - 1 : calYear;
    const nm = calMonth === 1 ? 12 : calMonth - 1;
    setCalYear(ny); setCalMonth(nm);
  };
  const nextMonth = () => {
    const ny = calMonth === 12 ? calYear + 1 : calYear;
    const nm = calMonth === 12 ? 1 : calMonth + 1;
    setCalYear(ny); setCalMonth(nm);
  };

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
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1">
            <button onClick={prevMonth} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ChevronLeft size={14} /></button>
            <span className="text-sm font-semibold text-gray-800 dark:text-white min-w-[110px] text-center">
              {MONTH_NAMES[calMonth - 1]} {calYear}
            </span>
            <button onClick={nextMonth} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ChevronRight size={14} /></button>
          </div>
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
                  className="card p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 select-none"
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
                  onClick={() => { setForm({ employee_id: String(popupEmp.id), date: todayStr, status: 'Present' }); setModal(true); }}
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
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      <Modal open={modal} title="Mark Attendance" onClose={() => setModal(false)} onSave={save} saveLabel="Mark Attendance">
        <FormSection title="Attendance Details">
          <FormGrid>
            <Field label="Employee" required>
              <Select
                value={form.employee_id || ''}
                onChange={v => f({ employee_id: v })}
                options={emps.map(e => ({ value: String(e.id), label: e.full_name }))}
                placeholder="Select employee"
                searchable
              />
            </Field>
            <Field label="Date" required>
              <DatePicker value={form.date || todayStr} onChange={v => f({ date: v })} placeholder="Select date" />
            </Field>
            <Field label="Status">
              <Select
                value={form.status || 'Present'}
                onChange={v => f({ status: v })}
                options={['Present', 'Absent', 'On Leave', 'Half Day', 'WFH']}
              />
            </Field>
            <Field label="In Time">
              <input type="time" className="form-input" value={form.in_time || ''} onChange={e => f({ in_time: e.target.value })} />
            </Field>
            <Field label="Out Time">
              <input type="time" className="form-input" value={form.out_time || ''} onChange={e => f({ out_time: e.target.value })} />
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>
    </>
  );
}
