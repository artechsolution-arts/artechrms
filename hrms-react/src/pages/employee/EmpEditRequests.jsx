import { useState, useEffect } from 'react';
import { api } from '../../api';
import Badge from '../../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../../components/Modal';
import DatePicker from '../../components/DatePicker';
import { Plus, FilePenLine, CheckCircle2, XCircle, Clock } from 'lucide-react';

const REQUEST_TYPES = [
  'Leave Entry',
  'Status Sheet',
  'Attendance',
  'Other',
];

const TYPE_CHIP = {
  'Leave Entry':   'bg-blue-50 text-blue-700',
  'Status Sheet':  'bg-violet-50 text-violet-700',
  'Attendance':    'bg-teal-50 text-teal-700',
  'Other':         'bg-gray-100 text-gray-600',
};

function StatusIcon({ status }) {
  if (status === 'Approved') return <CheckCircle2 size={14} className="text-green-500" />;
  if (status === 'Rejected') return <XCircle size={14} className="text-red-400" />;
  return <Clock size={14} className="text-amber-400" />;
}

export default function EmpEditRequests({ toast }) {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);
  const f = v => setForm(p => ({ ...p, ...v }));

  const load = async () => {
    setLoading(true);
    try {
      setRequests(await api('GET', '/api/portal/edit-requests'));
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.request_type) return toast('Select a request type', 'warning');
    if (!form.target_date)  return toast('Select the date you want to update', 'warning');
    if (!form.description?.trim()) return toast('Describe what needs to be changed', 'warning');
    if (!form.reason?.trim())      return toast('Provide a reason for this request', 'warning');
    setSaving(true);
    try {
      await api('POST', '/api/portal/edit-requests', {
        request_type: form.request_type,
        target_date:  form.target_date,
        description:  form.description.trim(),
        reason:       form.reason.trim(),
      });
      toast('Request submitted. HR will review it shortly.', 'success');
      setModal(false);
      setForm({});
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const pending  = requests.filter(r => r.status === 'Pending').length;
  const approved = requests.filter(r => r.status === 'Approved').length;
  const rejected = requests.filter(r => r.status === 'Rejected').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Edit Requests</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Request HR to add or correct a leave, attendance, or status entry
          </p>
        </div>
        <button
          onClick={() => { setForm({}); setModal(true); }}
          className="btn btn-primary btn-sm gap-1.5"
        >
          <Plus size={13} /> Raise Request
        </button>
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

        {/* List */}
        {loading ? (
          <div className="card p-10 text-center text-sm text-gray-400">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <FilePenLine size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">No edit requests yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Click "Raise Request" to ask HR to correct a leave, attendance, or status entry
              </p>
            </div>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100 dark:divide-gray-800">
            {requests.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                <div className="mt-0.5">
                  <StatusIcon status={r.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_CHIP[r.request_type] || 'bg-gray-100 text-gray-600'}`}>
                      {r.request_type}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {r.target_date}
                    </span>
                    <span className="text-xs text-gray-400">· Raised {r.created_at}</span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">{r.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Reason:</span> {r.reason}
                  </p>
                  {r.hr_remarks && (
                    <p className={`text-xs mt-1 font-medium ${r.status === 'Approved' ? 'text-green-600' : 'text-red-500'}`}>
                      HR: {r.hr_remarks}
                    </p>
                  )}
                </div>
                <Badge text={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modal}
        title="Raise an Edit Request"
        onClose={() => { setModal(false); setForm({}); }}
        onSave={submit}
        saveLabel={saving ? 'Submitting…' : 'Submit Request'}
      >
        <FormSection title="Request Details">
          <FormGrid>
            <Field label="Request Type" required>
              <select
                className="form-select"
                value={form.request_type || ''}
                onChange={e => f({ request_type: e.target.value })}
              >
                <option value="">Select type</option>
                {REQUEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>

            <Field label="Date to Correct" required>
              <DatePicker
                value={form.target_date || ''}
                onChange={v => f({ target_date: v })}
                placeholder="Select the date"
              />
            </Field>

            <Field label="What needs to be changed?" required full>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder={
                  form.request_type === 'Leave Entry'
                    ? 'e.g. I was on sick leave on this date but it was not recorded…'
                    : form.request_type === 'Status Sheet'
                    ? 'e.g. I forgot to update my status for this date. Task was XYZ, completed.'
                    : form.request_type === 'Attendance'
                    ? 'e.g. I was present but attendance shows absent…'
                    : 'Describe the correction needed…'
                }
                value={form.description || ''}
                onChange={e => f({ description: e.target.value })}
              />
            </Field>

            <Field label="Reason / Justification" required full>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Why is this correction needed?"
                value={form.reason || ''}
                onChange={e => f({ reason: e.target.value })}
              />
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>
    </>
  );
}
