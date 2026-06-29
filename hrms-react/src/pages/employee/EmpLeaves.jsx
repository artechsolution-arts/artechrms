import { useState, useEffect } from 'react';
import { api } from '../../api';
import { fmtDate } from '../../utils/date';
import Badge from '../../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../../components/Modal';
import DatePicker from '../../components/DatePicker';
import Select from '../../components/Select';
import { Plus, Trash2, CalendarDays, XCircle, PencilLine } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

export default function EmpLeaves({ toast }) {
  const [leaves,   setLeaves]   = useState([]);
  const [types,    setTypes]    = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [modal,       setModal]       = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [editModal,   setEditModal]   = useState(false);

  const [cancelId,    setCancelId]    = useState(null);
  const [cancelReason,setCancelReason]= useState('');

  const [editLeave,   setEditLeave]   = useState(null);
  const [editForm,    setEditForm]    = useState({});

  const [confirmDialog, setConfirmDialog] = useState(null);

  const [form, setForm] = useState({});
  const f = v => setForm(p => ({ ...p, ...v }));

  const load = async () => {
    setLoading(true);
    try {
      const [lv, lt, lb] = await Promise.all([
        api('GET', '/api/portal/leaves'),
        api('GET', '/api/portal/leave-types'),
        api('GET', '/api/portal/leave-balances'),
      ]);
      setLeaves(lv);
      setTypes(lt);
      setBalances(Array.isArray(lb) ? lb : []);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const selectedBal = balances.find(b => b.leave_type_id === parseInt(form.leave_type_id));

  const apply = async () => {
    if (!form.leave_type_id || !form.from_date || !form.to_date)
      return toast('All required fields must be filled', 'warning');
    if (form.from_date > form.to_date)
      return toast('From date must be before to date', 'warning');
    const isHalfDay = form.duration === 'Half Day';
    const days = isHalfDay ? 0.5 : (new Date(form.to_date) - new Date(form.from_date)) / 86400000 + 1;
    if (selectedBal && days > selectedBal.available)
      return toast(`Only ${selectedBal.available} ${selectedBal.leave_type} days available`, 'warning');
    try {
      await api('POST', '/api/portal/leaves', {
        leave_type_id:  parseInt(form.leave_type_id),
        from_date:      form.from_date,
        to_date:        isHalfDay ? form.from_date : form.to_date,
        half_day:       isHalfDay,
        leave_category: form.leave_category || 'Planned',
        reason:         form.reason || null,
      });
      toast('Leave application submitted', 'success');
      setModal(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const cancel = async id => {
    setConfirmDialog({
      title: 'Cancel Leave',
      message: 'Cancel this leave application?',
      confirmLabel: 'Cancel Leave',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await api('DELETE', `/api/portal/leaves/${id}`);
          toast('Leave cancelled', 'success');
          load();
        } catch (e) { toast(e.message, 'error'); }
      }
    });
    return;
  };

  const openCancelRequest = id => { setCancelId(id); setCancelReason(''); setCancelModal(true); };

  const submitCancelRequest = async () => {
    if (!cancelReason.trim()) return toast('Please provide a reason for cancellation', 'warning');
    try {
      await api('POST', `/api/portal/leaves/${cancelId}/cancel-request`, { reason: cancelReason.trim() });
      toast('Cancellation request submitted. HR will review it.', 'success');
      setCancelModal(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const openEditRequest = lv => {
    setEditLeave(lv);
    setEditForm({ from_date: lv.from_date, to_date: lv.to_date, reason: '' });
    setEditModal(true);
  };

  const submitEditRequest = async () => {
    if (!editForm.from_date || !editForm.to_date)
      return toast('Please select new dates', 'warning');
    if (editForm.from_date > editForm.to_date)
      return toast('From date must be before to date', 'warning');
    if (!editForm.reason?.trim())
      return toast('Please provide a reason for the date change', 'warning');
    try {
      await api('POST', `/api/portal/leaves/${editLeave.id}/edit-request`, {
        from_date: editForm.from_date,
        to_date: editForm.to_date,
        reason: editForm.reason.trim(),
      });
      toast('Date change request submitted. HR will review it.', 'success');
      setEditModal(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Leaves</h1>
          <p className="text-xs text-gray-500 mt-0.5">Apply and track your leave applications</p>
        </div>
        <button onClick={() => { setForm({}); setModal(true); }} className="btn btn-primary btn-sm gap-1.5">
          <Plus size={13} /> Apply Leave
        </button>
      </div>

      <div className="page-content space-y-5">

        {/* Leave balance summary */}
        {balances.length > 0 && (() => {
          const totalLeaves  = balances.reduce((s, b) => s + (b.allocated || 0), 0);
          const leavesTaken  = balances.reduce((s, b) => s + (b.used     || 0), 0);
          const leaveBalance = balances.reduce((s, b) => s + (b.available|| 0), 0);
          return (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Leaves',   value: totalLeaves,  color: 'text-gray-700 dark:text-gray-200' },
                { label: 'Leaves Taken',   value: leavesTaken,  color: 'text-amber-600' },
                { label: 'Leave Balance',  value: leaveBalance, color: leaveBalance === 0 ? 'text-red-500' : 'text-emerald-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card p-4 text-center">
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Application summary */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Applied', count: leaves.length,                                        color: 'text-gray-700' },
            { label: 'Pending',       count: leaves.filter(l => l.status === 'Pending').length,    color: 'text-amber-600' },
            { label: 'Approved',      count: leaves.filter(l => l.status === 'Approved').length,   color: 'text-green-600' },
            { label: 'Rejected',      count: leaves.filter(l => l.status === 'Rejected').length,   color: 'text-red-600' },
          ].map(({ label, count, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Leave history table */}
        {loading ? (
          <div className="card p-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : leaves.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <CalendarDays size={36} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">No leave applications yet</p>
              <p className="text-xs text-gray-400 mt-1">Click "Apply Leave" to submit your first request</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Duration</th><th>Category</th><th>Reason</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {leaves.map(lv => (
                    <tr key={lv.id} className={lv.status === 'Edit Requested' ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}>
                      <td className="font-medium text-gray-900">{lv.leave_type}</td>
                      <td className="text-gray-600">
                        {lv.status === 'Edit Requested' && lv.pending_from_date ? (
                          <span>
                            <span className="line-through text-gray-400">{fmtDate(lv.from_date)}</span>
                            <span className="block text-blue-600 font-medium">{fmtDate(lv.pending_from_date)}</span>
                          </span>
                        ) : fmtDate(lv.from_date)}
                      </td>
                      <td className="text-gray-600">
                        {lv.status === 'Edit Requested' && lv.pending_to_date ? (
                          <span>
                            <span className="line-through text-gray-400">{fmtDate(lv.half_day ? lv.from_date : lv.to_date)}</span>
                            <span className="block text-blue-600 font-medium">{fmtDate(lv.pending_to_date)}</span>
                          </span>
                        ) : fmtDate(lv.half_day ? lv.from_date : lv.to_date)}
                      </td>
                      <td className="text-gray-600">
                        {lv.status === 'Edit Requested' && lv.pending_total_days != null ? (
                          <span>
                            <span className="line-through text-gray-400">{lv.total_days}</span>
                            <span className="block text-blue-600 font-medium">{lv.pending_total_days}</span>
                          </span>
                        ) : lv.total_days}
                      </td>
                      <td>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lv.half_day ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {lv.half_day ? 'Half Day' : 'Full Day'}
                        </span>
                      </td>
                      <td>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lv.leave_category === 'Unplanned' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>
                          {lv.leave_category || 'Planned'}
                        </span>
                      </td>
                      <td className="text-gray-500 text-xs max-w-[140px]">
                        {lv.status === 'Edit Requested' && lv.edit_reason ? (
                          <span className="text-blue-600 dark:text-blue-400 font-medium truncate block" title={lv.edit_reason}>{lv.edit_reason}</span>
                        ) : (
                          <span className="truncate block">{lv.reason || '—'}</span>
                        )}
                      </td>
                      <td><Badge text={lv.status} /></td>
                      <td>
                        {lv.status === 'Pending' && (
                          <button onClick={() => cancel(lv.id)} className="btn-delete">
                            <Trash2 size={11} /> Cancel
                          </button>
                        )}
                        {lv.status === 'Approved' && (
                          <div className="flex flex-col gap-1">
                            <button onClick={() => openEditRequest(lv)} className="btn-action" style={{ color: '#2563eb' }}>
                              <PencilLine size={11} /> Edit Dates
                            </button>
                            <button onClick={() => openCancelRequest(lv.id)} className="btn-action" style={{ color: '#ea580c' }}>
                              <XCircle size={11} /> Request Cancel
                            </button>
                          </div>
                        )}
                        {lv.status === 'Cancellation Requested' && (
                          <span className="text-xs text-orange-500 font-medium">Awaiting HR</span>
                        )}
                        {lv.status === 'Edit Requested' && (
                          <span className="text-xs text-blue-500 font-medium">Awaiting HR</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Cancel approved leave modal */}
      <Modal
        open={cancelModal}
        title="Request Leave Cancellation"
        onClose={() => setCancelModal(false)}
        onSave={submitCancelRequest}
        saveLabel="Submit Request"
      >
        <FormSection title="Cancellation Details">
          <FormGrid>
            <Field label="Reason for Cancellation" required full>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Explain why you need to cancel this approved leave…"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>

      {/* Edit approved leave dates modal */}
      <Modal
        open={editModal}
        title="Request Date Change"
        onClose={() => setEditModal(false)}
        onSave={submitEditRequest}
        saveLabel="Submit for Approval"
      >
        <FormSection title="New Leave Dates">
          <div className="mb-3 px-1">
            <p className="text-xs text-gray-500">
              Current approved dates:&nbsp;
              <span className="font-medium text-gray-700">{fmtDate(editLeave?.from_date)} – {fmtDate(editLeave?.half_day ? editLeave?.from_date : editLeave?.to_date)}</span>
              &nbsp;({editLeave?.total_days} day{editLeave?.total_days !== 1 ? 's' : ''})
            </p>
          </div>
          <FormGrid>
            <Field label="New From Date" required>
              <DatePicker
                value={editForm.from_date || ''}
                onChange={v => setEditForm(p => ({ ...p, from_date: v }))}
                placeholder="Select new from date"
              />
            </Field>
            {!editLeave?.half_day && (
              <Field label="New To Date" required>
                <DatePicker
                  value={editForm.to_date || ''}
                  onChange={v => setEditForm(p => ({ ...p, to_date: v }))}
                  placeholder="Select new to date"
                  min={editForm.from_date}
                />
              </Field>
            )}
            <Field label="Reason for Date Change" required full>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Explain why the dates need to change…"
                value={editForm.reason || ''}
                onChange={e => setEditForm(p => ({ ...p, reason: e.target.value }))}
              />
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>

      {/* Apply leave modal */}
      <Modal open={modal} title="Apply for Leave" onClose={() => setModal(false)} onSave={apply} saveLabel="Submit Application">
        <FormSection title="Leave Details">
          <FormGrid>
            <Field label="Leave Type" required full>
              <Select
                value={form.leave_type_id || ''}
                onChange={v => f({ leave_type_id: v })}
                options={types.map(t => {
                  const bal = balances.find(b => b.leave_type_id === t.id);
                  const avail = bal ? bal.available : 0;
                  return {
                    value: String(t.id),
                    label: t.name,
                    description: `${avail} day${avail !== 1 ? 's' : ''} available`,
                  };
                })}
                placeholder="Select leave type"
              />
              {selectedBal && (
                <p className="text-xs mt-1" style={{ color: selectedBal.available > 0 ? 'var(--accent)' : '#ef4444' }}>
                  {selectedBal.available > 0
                    ? `${selectedBal.available} days available (${selectedBal.used} used of ${selectedBal.allocated} allocated)`
                    : 'No balance remaining for this leave type'}
                </p>
              )}
            </Field>

            <Field label="Duration" required>
              <Select
                value={form.duration || 'Full Day'}
                onChange={v => f({ duration: v })}
                options={[
                  { value: 'Full Day', label: 'Full Day' },
                  { value: 'Half Day', label: 'Half Day' },
                ]}
              />
            </Field>

            <Field label="Leave Category" required>
              <Select
                value={form.leave_category || 'Planned'}
                onChange={v => f({ leave_category: v })}
                options={[
                  { value: 'Planned', label: 'Planned Leave' },
                  { value: 'Unplanned', label: 'Unplanned Leave' },
                ]}
              />
            </Field>

            <Field label="From Date" required>
              <DatePicker value={form.from_date || ''} onChange={v => f({ from_date: v })} placeholder="Select from date" />
            </Field>
            {form.duration !== 'Half Day' && (
              <Field label="To Date" required>
                <DatePicker value={form.to_date || ''} onChange={v => f({ to_date: v })} placeholder="Select to date" min={form.from_date} />
              </Field>
            )}

            <Field label="Reason" full>
              <textarea className="form-textarea" rows={3} value={form.reason || ''} onChange={e => f({ reason: e.target.value })} placeholder="Brief reason for leave…" />
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>
      <ConfirmModal
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        danger={confirmDialog?.danger}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </>
  );
}
