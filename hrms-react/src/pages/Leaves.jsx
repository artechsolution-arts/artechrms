import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { fmtDate } from '../utils/date';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import DatePicker from '../components/DatePicker';
import Select from '../components/Select';
import { Plus, RefreshCw, CheckCircle, XCircle, Trash2, RotateCcw, PencilLine } from 'lucide-react';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import ConfirmModal from '../components/ConfirmModal';

const STATUS_TABS = [
  { value: '',                       label: 'All' },
  { value: 'Pending',                label: 'Pending' },
  { value: 'Cancellation Requested', label: 'Cancel Requests' },
  { value: 'Edit Requested',         label: 'Edit Requests' },
  { value: 'Approved',               label: 'Approved' },
  { value: 'Rejected',               label: 'Rejected' },
  { value: 'Cancelled',              label: 'Cancelled' },
];

// Approval hierarchy: Employee req → HR or CEO; HR req → CEO only; CEO req → nobody.
// SuperAdmin only manages accounts — no approval powers.
function canApprove(approverRole, requesterRole) {
  if (requesterRole === 'HR') return approverRole === 'CEO';
  if (requesterRole === 'CEO') return false;
  return approverRole === 'HR' || approverRole === 'CEO';  // Employee request
}

export default function Leaves({ toast }) {
  const [allRows, setAllRows] = useState([]);
  const [types, setTypes] = useState([]);
  const [emps, setEmps] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [empFilter, setEmpFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('artech_hrms_user') || '{}'); } catch { return {}; } })();
  const myRole = currentUser.role || '';

  const load = useCallback(async (st = statusFilter) => {
    setLoading(true);
    try {
      setAllRows(await api('GET', '/api/leaves'));
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => {
    let initStatus = '';
    try {
      const pending = sessionStorage.getItem('nav-filter');
      if (pending) {
        sessionStorage.removeItem('nav-filter');
        const f = JSON.parse(pending);
        if (f.leaveStatus) { initStatus = f.leaveStatus; setStatusFilter(f.leaveStatus); }
        if (f.employeeId)  setEmpFilter(f.employeeId);
      }
    } catch {}
    Promise.all([api('GET', '/api/leaves/types'), api('GET', '/api/employees?all=true')])
      .then(([t, e]) => { setTypes(t); setEmps(e); load(initStatus || statusFilter); })
      .catch(e => toast(e.message, 'error'));
  }, []);
  useRefreshOnFocus(load);

  const f = (v) => { setForm(prev => ({ ...prev, ...v })); const key = Object.keys(v)[0]; if (key) setFormErrors(prev => ({ ...prev, [key]: '' })); };

  const save = async () => {
    const errs = {};
    if (!form.employee_id) errs.employee_id = 'Employee is required';
    if (!form.leave_type_id) errs.leave_type_id = 'Leave type is required';
    if (!form.from_date) errs.from_date = 'Start date is required';
    if (!form.to_date) errs.to_date = 'End date is required';
    else if (form.from_date && form.to_date < form.from_date) errs.to_date = 'End date must be on or after start date';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    try {
      await api('POST', '/api/leaves', {
        employee_id: parseInt(form.employee_id), leave_type_id: parseInt(form.leave_type_id),
        from_date: form.from_date, to_date: form.to_date, reason: form.reason || null,
      });
      toast('Leave applied', 'success'); setModal(false); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const approve = async id => {
    try { await api('PUT', `/api/leaves/${id}/approve`); toast('Approved', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const reject = async id => {
    try { await api('PUT', `/api/leaves/${id}/reject`); toast('Rejected', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const approveCancel = async id => {
    try { await api('PUT', `/api/leaves/${id}/approve-cancel`); toast('Cancellation approved — leave removed', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const rejectCancel = async id => {
    try { await api('PUT', `/api/leaves/${id}/reject-cancel`); toast('Cancellation rejected — leave restored to Approved', 'info'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const approveEdit = async id => {
    try { await api('PUT', `/api/leaves/${id}/approve-edit`); toast('Date change approved', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const rejectEdit = async id => {
    try { await api('PUT', `/api/leaves/${id}/reject-edit`); toast('Date change rejected — leave restored to original dates', 'info'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const del = async id => {
    setConfirmDialog({
      title: 'Delete Leave',
      message: 'Delete this leave application?',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try { await api('DELETE', `/api/leaves/${id}`); toast('Deleted', 'success'); load(); }
        catch (e) { toast(e.message, 'error'); }
      }
    });
    return;
  };

  const cancelCount = allRows.filter(r => r.status === 'Cancellation Requested').length;
  const editCount   = allRows.filter(r => r.status === 'Edit Requested').length;
  const pendingCount = allRows.filter(r => r.status === 'Pending').length;

  // Apply tab + optional employee filter; cancellation and edit requests float to top
  const rows = (() => {
    let filtered = statusFilter ? allRows.filter(r => r.status === statusFilter) : allRows;
    if (empFilter) filtered = filtered.filter(r => r.employee_id === empFilter);
    return [...filtered].sort((a, b) => {
      const priority = s => s === 'Cancellation Requested' ? 0 : s === 'Edit Requested' ? 1 : s === 'Pending' ? 2 : 3;
      return priority(a.status) - priority(b.status);
    });
  })();

  const empFilterName = empFilter ? (emps.find(e => e.id === empFilter)?.full_name || `ID ${empFilter}`) : null;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Leave Applications</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={() => { setForm({}); setFormErrors({}); setModal(true); }} className="btn btn-primary btn-sm gap-1.5"><Plus size={13} /> Apply Leave</button>
        </div>
      </div>

      <div className="page-content">
        {empFilterName && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <span>Showing leaves for <strong>{empFilterName}</strong></span>
            <button onClick={() => setEmpFilter(null)} className="ml-auto text-xs underline opacity-70 hover:opacity-100">Clear filter</button>
          </div>
        )}
        {/* Status tabs */}
        <div className="flex items-center gap-1 mb-4 flex-wrap">
          {STATUS_TABS.map(tab => {
            const isActive = statusFilter === tab.value;
            const badge = tab.value === 'Cancellation Requested' ? cancelCount
                        : tab.value === 'Edit Requested' ? editCount
                        : tab.value === 'Pending' ? pendingCount
                        : 0;
            const isAlert = (tab.value === 'Cancellation Requested' && cancelCount > 0)
                         || (tab.value === 'Edit Requested' && editCount > 0);
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                  ${isActive
                    ? isAlert
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : isAlert
                      ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                {tab.value === 'Cancellation Requested' && <RotateCcw size={11} />}
                {tab.label}
                {badge > 0 && (
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold
                    ${isActive ? 'bg-white/30 text-white' : isAlert ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Edit requests banner */}
        {editCount > 0 && statusFilter !== 'Edit Requested' && (
          <div
            className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            onClick={() => setStatusFilter('Edit Requested')}
          >
            <div className="flex items-center gap-2.5">
              <PencilLine size={15} className="text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  {editCount} Leave Date Change Request{editCount > 1 ? 's' : ''} Pending Review
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Employees have requested to change their approved leave dates — click to review
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">View →</span>
          </div>
        )}

        {/* Cancellation requests banner when present and not already filtered */}
        {cancelCount > 0 && statusFilter !== 'Cancellation Requested' && (
          <div
            className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            onClick={() => setStatusFilter('Cancellation Requested')}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔄</span>
              <div>
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                  {cancelCount} Leave Cancellation Request{cancelCount > 1 ? 's' : ''} Pending Review
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Employees have requested to cancel their approved leaves — click to review
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400 whitespace-nowrap">View →</span>
          </div>
        )}

        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Leave Type</th><th>From</th><th>To</th>
                  <th>Days</th><th>Reason / Note</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📅</div>
                      <p className="text-sm text-gray-500">No leave applications</p>
                    </div>
                  </td></tr>
                ) : rows.map(l => (
                  <tr
                    key={l.id}
                    className={
                      l.status === 'Cancellation Requested' ? 'bg-orange-50/60 dark:bg-orange-900/10' :
                      l.status === 'Edit Requested' ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''
                    }
                  >
                    <td className="font-semibold text-gray-900 dark:text-gray-100">{l.employee_name}</td>
                    <td className="text-gray-600 dark:text-gray-400">{l.leave_type}</td>
                    <td className="text-gray-600 dark:text-gray-400">
                      {l.status === 'Edit Requested' && l.pending_from_date ? (
                        <span>
                          <span className="line-through text-gray-400 text-xs">{fmtDate(l.from_date)}</span>
                          <span className="block text-blue-600 font-medium">{fmtDate(l.pending_from_date)}</span>
                        </span>
                      ) : fmtDate(l.from_date)}
                    </td>
                    <td className="text-gray-600 dark:text-gray-400">
                      {l.status === 'Edit Requested' && l.pending_to_date ? (
                        <span>
                          <span className="line-through text-gray-400 text-xs">{fmtDate(l.to_date)}</span>
                          <span className="block text-blue-600 font-medium">{fmtDate(l.pending_to_date)}</span>
                        </span>
                      ) : fmtDate(l.to_date)}
                    </td>
                    <td className="text-gray-600 dark:text-gray-400">
                      {l.status === 'Edit Requested' && l.pending_total_days != null ? (
                        <span>
                          <span className="line-through text-gray-400 text-xs">{l.total_days}</span>
                          <span className="block text-blue-600 font-medium">{l.pending_total_days}</span>
                        </span>
                      ) : l.total_days}
                    </td>
                    <td className="text-xs text-gray-500 max-w-[180px]">
                      {l.status === 'Cancellation Requested' && l.cancellation_reason ? (
                        <span className="text-orange-600 dark:text-orange-400 font-medium">{l.cancellation_reason}</span>
                      ) : l.status === 'Edit Requested' && l.edit_reason ? (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">{l.edit_reason}</span>
                      ) : (
                        <span className="truncate block">{l.reason || '—'}</span>
                      )}
                    </td>
                    <td><Badge text={l.status} /></td>
                    <td>
                      <div className="flex items-center gap-1 flex-wrap">
                        {(() => {
                          const actionable = ['Pending', 'Cancellation Requested', 'Edit Requested'].includes(l.status);
                          const allowed = canApprove(myRole, l.requester_role || 'Employee');
                          if (actionable && !allowed) {
                            return (
                              <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                🔒 {l.requester_role === 'HR' ? 'CEO approval required' : l.requester_role === 'CEO' ? 'Top-level — no approval' : 'No permission'}
                              </span>
                            );
                          }
                          return null;
                        })()}
                        {l.status === 'Pending' && canApprove(myRole, l.requester_role || 'Employee') && (
                          <>
                            <button onClick={() => approve(l.id)} className="btn-approve">
                              <CheckCircle size={11} /> Approve
                            </button>
                            <button onClick={() => reject(l.id)} className="btn-reject">
                              <XCircle size={11} /> Reject
                            </button>
                          </>
                        )}
                        {l.status === 'Cancellation Requested' && canApprove(myRole, l.requester_role || 'Employee') && (
                          <>
                            <button onClick={() => approveCancel(l.id)} className="btn-approve">
                              <CheckCircle size={11} /> Approve Cancel
                            </button>
                            <button onClick={() => rejectCancel(l.id)} className="btn-reject">
                              <XCircle size={11} /> Reject Cancel
                            </button>
                          </>
                        )}
                        {l.status === 'Edit Requested' && canApprove(myRole, l.requester_role || 'Employee') && (
                          <>
                            <button onClick={() => approveEdit(l.id)} className="btn-approve">
                              <CheckCircle size={11} /> Approve Edit
                            </button>
                            <button onClick={() => rejectEdit(l.id)} className="btn-reject">
                              <XCircle size={11} /> Reject Edit
                            </button>
                          </>
                        )}
                        <button onClick={() => del(l.id)} className="btn-delete">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        danger={confirmDialog?.danger}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />

      <Modal open={modal} title="Apply Leave" onClose={() => setModal(false)} onSave={save} saveLabel="Apply Leave">
        <FormSection title="Leave Details">
          <FormGrid>
            <Field label="Employee" required error={formErrors.employee_id}>
              <Select
                value={form.employee_id || ''}
                onChange={v => f({ employee_id: v })}
                options={emps.map(e => ({ value: String(e.id), label: e.full_name }))}
                placeholder="Select Employee"
                searchable
              />
            </Field>
            <Field label="Leave Type" required error={formErrors.leave_type_id}>
              <Select
                value={form.leave_type_id || ''}
                onChange={v => f({ leave_type_id: v })}
                options={types.map(t => ({ value: String(t.id), label: t.name }))}
                placeholder="Select Type"
              />
            </Field>
            <Field label="From Date" required error={formErrors.from_date}>
              <DatePicker value={form.from_date || ''} onChange={v => f({ from_date: v })} placeholder="Select from date" />
            </Field>
            <Field label="To Date" required error={formErrors.to_date}>
              <DatePicker value={form.to_date || ''} onChange={v => f({ to_date: v })} placeholder="Select to date" min={form.from_date} />
            </Field>
            <Field label="Reason" full>
              <textarea className="form-textarea" rows={3} value={form.reason || ''} onChange={e => f({ reason: e.target.value })} placeholder="Reason for leave..." />
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>
    </>
  );
}
