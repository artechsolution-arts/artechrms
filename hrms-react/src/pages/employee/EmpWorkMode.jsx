import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import Modal, { FormGrid, Field } from '../../components/Modal';
import DatePicker from '../../components/DatePicker';
import { Plus, Trash2, ChevronLeft, ChevronRight, CalendarCheck2 } from 'lucide-react';

const WORK_MODES = ['WFH', 'PLANNED LEAVE', 'SICK LEAVE', 'CASUAL LEAVE', 'HALF DAY LEAVE', 'OTHER'];
const DURATIONS  = ['FULL-DAY', 'HALF-DAY (Morning)', 'HALF-DAY (Afternoon)'];

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getDate()}-${MONTH_NAMES[dt.getMonth()].slice(0,3)}-${String(dt.getFullYear()).slice(2)}`;
}

function StatusBadge({ status }) {
  const map = {
    Approved: 'bg-green-50 text-green-700 border-green-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',
    Pending:  'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      {status}
    </span>
  );
}

export default function EmpWorkMode({ toast }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      setEntries(await api('GET', `/api/portal/work-mode?month=${monthStr}`));
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm({
      entry_date: today.toISOString().slice(0, 10),
      work_mode:  'PLANNED LEAVE',
      reason:     '',
      duration:   'FULL-DAY',
    });
    setModal(true);
  };

  const submit = async () => {
    if (!form.entry_date) return toast('Select a date', 'warning');
    if (!form.work_mode)  return toast('Select a type', 'warning');
    setSaving(true);
    try {
      await api('POST', '/api/portal/work-mode', {
        entry_date: form.entry_date,
        work_mode:  form.work_mode,
        reason:     form.reason || null,
        duration:   form.duration || 'FULL-DAY',
      });
      toast('Request submitted', 'success');
      setModal(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const cancel = async (id) => {
    if (!confirm('Cancel this work mode request?')) return;
    setDeleting(id);
    try {
      await api('DELETE', `/api/portal/work-mode/${id}`);
      toast('Request cancelled', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setDeleting(null); }
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

  const pending   = entries.filter(e => e.status === 'Pending').length;
  const approved  = entries.filter(e => e.status === 'Approved').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Work Mode Sheet</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Submit WFH and leave requests for HR approval</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary btn-sm gap-1.5">
          <Plus size={13} /> Add Request
        </button>
      </div>

      <div className="page-content space-y-4">

        {/* Month navigator */}
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
          {entries.length > 0 && (
            <div className="flex gap-3 text-xs">
              <span className="text-amber-600 font-medium">{pending} pending</span>
              <span className="text-green-600 font-medium">{approved} approved</span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-[100px]">Date</th>
                  <th className="w-[150px]">Type</th>
                  <th>Reason</th>
                  <th className="hidden sm:table-cell w-[150px]">Duration</th>
                  <th className="w-[110px]">Status</th>
                  <th className="hidden sm:table-cell">HR Remarks</th>
                  <th className="w-[60px]"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading…</td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <CalendarCheck2 size={36} className="mb-2 text-gray-300" />
                      <p className="text-sm text-gray-500">No requests this month</p>
                      <p className="text-xs text-gray-400 mt-1">Click "Add Request" to submit a WFH or leave request</p>
                    </div>
                  </td></tr>
                ) : entries.map(e => (
                  <tr key={e.id}>
                    <td className="font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{fmtDate(e.entry_date)}</td>
                    <td>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{e.work_mode}</span>
                    </td>
                    <td className="text-sm text-gray-600 dark:text-gray-400">{e.reason || '—'}</td>
                    <td className="hidden sm:table-cell text-sm text-gray-600 dark:text-gray-400">{e.duration}</td>
                    <td><StatusBadge status={e.status} /></td>
                    <td className="hidden sm:table-cell text-xs text-gray-500 italic">{e.hr_remarks || '—'}</td>
                    <td>
                      {e.status === 'Pending' && (
                        <button
                          onClick={() => cancel(e.id)}
                          disabled={deleting === e.id}
                          className="btn btn-danger btn-xs gap-1 disabled:opacity-60"
                          title="Cancel request"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={modal}
        title="Add Work Mode Request"
        onClose={() => setModal(false)}
        onSave={submit}
        saveLabel={saving ? 'Submitting…' : 'Submit Request'}
      >
        <FormGrid>
          <Field label="Date" required>
            <DatePicker
              value={form.entry_date || ''}
              onChange={v => setForm(p => ({ ...p, entry_date: v }))}
              placeholder="Select date"
            />
          </Field>
          <Field label="Duration" required>
            <select
              className="form-select"
              value={form.duration || 'FULL-DAY'}
              onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
            >
              {DURATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Type (WFH / Leave)" required full>
            <select
              className="form-select"
              value={form.work_mode || ''}
              onChange={e => setForm(p => ({ ...p, work_mode: e.target.value }))}
            >
              <option value="">Select type…</option>
              {WORK_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Reason" full>
            <input
              className="form-input"
              placeholder="e.g. Marriage, Personal Work, Medical…"
              value={form.reason || ''}
              onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
            />
          </Field>
        </FormGrid>
      </Modal>
    </>
  );
}
