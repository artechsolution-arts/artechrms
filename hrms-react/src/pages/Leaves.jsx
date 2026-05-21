import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import DatePicker from '../components/DatePicker';
import { Plus, RefreshCw, CheckCircle, XCircle, Trash2, RotateCcw } from 'lucide-react';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

const STATUS_TABS = [
  { value: '',                     label: 'All' },
  { value: 'Pending',              label: 'Pending' },
  { value: 'Cancellation Requested', label: 'Cancel Requests' },
  { value: 'Approved',             label: 'Approved' },
  { value: 'Rejected',             label: 'Rejected' },
  { value: 'Cancelled',            label: 'Cancelled' },
];

export default function Leaves({ toast }) {
  const [allRows, setAllRows] = useState([]);
  const [types, setTypes] = useState([]);
  const [emps, setEmps] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});

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
      }
    } catch {}
    Promise.all([api('GET', '/api/leaves/types'), api('GET', '/api/employees?all=true')])
      .then(([t, e]) => { setTypes(t); setEmps(e); load(initStatus || statusFilter); })
      .catch(e => toast(e.message, 'error'));
  }, []);
  useRefreshOnFocus(load);

  const f = v => setForm(prev => ({ ...prev, ...v }));

  const save = async () => {
    if (!form.employee_id || !form.leave_type_id || !form.from_date || !form.to_date)
      return toast('All required fields must be filled', 'warning');
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

  const del = async id => {
    if (!confirm('Delete this leave application?')) return;
    try { await api('DELETE', `/api/leaves/${id}`); toast('Deleted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const cancelCount = allRows.filter(r => r.status === 'Cancellation Requested').length;
  const pendingCount = allRows.filter(r => r.status === 'Pending').length;

  // Apply tab filter, cancellation requests always float to top
  const rows = (() => {
    const filtered = statusFilter ? allRows.filter(r => r.status === statusFilter) : allRows;
    return [...filtered].sort((a, b) => {
      const priority = s => s === 'Cancellation Requested' ? 0 : s === 'Pending' ? 1 : 2;
      return priority(a.status) - priority(b.status);
    });
  })();

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Leave Applications</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={() => { setForm({}); setModal(true); }} className="btn btn-primary btn-sm gap-1.5"><Plus size={13} /> Apply Leave</button>
        </div>
      </div>

      <div className="page-content">
        {/* Status tabs */}
        <div className="flex items-center gap-1 mb-4 flex-wrap">
          {STATUS_TABS.map(tab => {
            const isActive = statusFilter === tab.value;
            const badge = tab.value === 'Cancellation Requested' ? cancelCount
                        : tab.value === 'Pending' ? pendingCount
                        : 0;
            const isAlert = tab.value === 'Cancellation Requested' && cancelCount > 0;
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
                    className={l.status === 'Cancellation Requested' ? 'bg-orange-50/60 dark:bg-orange-900/10' : ''}
                  >
                    <td className="font-semibold text-gray-900 dark:text-gray-100">{l.employee_name}</td>
                    <td className="text-gray-600 dark:text-gray-400">{l.leave_type}</td>
                    <td className="text-gray-600 dark:text-gray-400">{l.from_date}</td>
                    <td className="text-gray-600 dark:text-gray-400">{l.to_date}</td>
                    <td className="text-gray-600 dark:text-gray-400">{l.total_days}</td>
                    <td className="text-xs text-gray-500 max-w-[180px]">
                      {l.status === 'Cancellation Requested' && l.cancellation_reason ? (
                        <span className="text-orange-600 dark:text-orange-400 font-medium">{l.cancellation_reason}</span>
                      ) : (
                        <span className="truncate block">{l.reason || '—'}</span>
                      )}
                    </td>
                    <td><Badge text={l.status} /></td>
                    <td>
                      <div className="flex items-center gap-1 flex-wrap">
                        {l.status === 'Pending' && (
                          <>
                            <button onClick={() => approve(l.id)} className="btn btn-success btn-xs gap-1">
                              <CheckCircle size={11} /> Approve
                            </button>
                            <button onClick={() => reject(l.id)} className="btn btn-danger btn-xs gap-1">
                              <XCircle size={11} /> Reject
                            </button>
                          </>
                        )}
                        {l.status === 'Cancellation Requested' && (
                          <>
                            <button onClick={() => approveCancel(l.id)} className="btn btn-success btn-xs gap-1">
                              <CheckCircle size={11} /> Approve Cancel
                            </button>
                            <button onClick={() => rejectCancel(l.id)} className="btn btn-danger btn-xs gap-1">
                              <XCircle size={11} /> Reject Cancel
                            </button>
                          </>
                        )}
                        <button onClick={() => del(l.id)} className="btn btn-secondary btn-xs gap-1">
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

      <Modal open={modal} title="Apply Leave" onClose={() => setModal(false)} onSave={save} saveLabel="Apply Leave">
        <FormSection title="Leave Details">
          <FormGrid>
            <Field label="Employee" required>
              <select className="form-select" value={form.employee_id || ''} onChange={e => f({ employee_id: e.target.value })}>
                <option value="">Select Employee</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </Field>
            <Field label="Leave Type" required>
              <select className="form-select" value={form.leave_type_id || ''} onChange={e => f({ leave_type_id: e.target.value })}>
                <option value="">Select Type</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="From Date" required>
              <DatePicker value={form.from_date || ''} onChange={v => f({ from_date: v })} placeholder="Select from date" />
            </Field>
            <Field label="To Date" required>
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
