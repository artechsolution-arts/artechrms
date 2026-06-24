import { useState, useEffect } from 'react';
import { api } from '../api';
import { fmtDate } from '../utils/date';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import DatePicker from '../components/DatePicker';
import Select from '../components/Select';
import { Plus, Receipt, CheckCircle, XCircle, Trash2, ChevronDown } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const STATUS_COLOR = {
  Pending:  'bg-amber-50 text-amber-700 border border-amber-200',
  Approved: 'bg-green-50 text-green-700 border border-green-200',
  Rejected: 'bg-red-50 text-red-700 border border-red-200',
};

const EXPENSE_TYPES = ['Travel', 'Meals', 'Accommodation', 'Office Supplies', 'Medical', 'Training', 'Internet', 'Other'];

export default function Expenses({ toast }) {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(false);
  const [actionModal, setActionModal] = useState(null); // { id, action: 'approve'|'reject' }
  const [remarks, setRemarks] = useState('');
  const [form, setForm] = useState({ claim_date: new Date().toISOString().slice(0, 10) });
  const [confirmDialog, setConfirmDialog] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [exp, emps] = await Promise.all([
        api('GET', `/api/hrm/expenses${filterStatus ? `?status=${filterStatus}` : ''}`),
        api('GET', '/api/employees?all=true'),
      ]);
      setRows(exp);
      setEmployees(emps);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filterStatus]);

  const f = v => setForm(p => ({ ...p, ...v }));

  const save = async () => {
    if (!form.employee_id || !form.expense_type || !form.amount || !form.claim_date)
      return toast('Employee, type, amount and date are required', 'warning');
    try {
      await api('POST', '/api/hrm/expenses', { ...form, employee_id: +form.employee_id, amount: +form.amount });
      toast('Expense claim added', 'success');
      setModal(false);
      setForm({ claim_date: new Date().toISOString().slice(0, 10) });
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const doAction = async () => {
    if (!actionModal) return;
    const { id, action } = actionModal;
    try {
      await api('PUT', `/api/hrm/expenses/${id}/${action}`, { remarks });
      toast(action === 'approve' ? 'Expense approved' : 'Expense rejected', 'success');
      setActionModal(null);
      setRemarks('');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const del = async id => {
    setConfirmDialog({
      title: 'Delete Expense',
      message: 'Delete this expense claim?',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try { await api('DELETE', `/api/hrm/expenses/${id}`); toast('Deleted', 'success'); load(); }
        catch (e) { toast(e.message, 'error'); }
      }
    });
    return;
  };

  const totalPending  = rows.filter(r => r.status === 'Pending').reduce((s, r) => s + r.amount, 0);
  const totalApproved = rows.filter(r => r.status === 'Approved').reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Expense Claims</h1>
        <div className="flex gap-2">
          <Select
            value={filterStatus}
            onChange={v => setFilterStatus(v)}
            options={[{ value: '', label: 'All Status' }, 'Pending', 'Approved', 'Rejected']}
            size="sm"
            className="w-36"
          />
          <button onClick={() => setModal(true)} className="btn btn-primary btn-sm gap-1.5"><Plus size={13}/>Add Claim</button>
        </div>
      </div>

      <div className="page-content">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total Claims', val: rows.length, cls: 'text-gray-800' },
            { label: 'Pending',      val: rows.filter(r=>r.status==='Pending').length, cls: 'text-amber-600' },
            { label: 'Pending Amt',  val: `₹${totalPending.toLocaleString('en-IN')}`, cls: 'text-amber-600' },
            { label: 'Approved Amt', val: `₹${totalApproved.toLocaleString('en-IN')}`, cls: 'text-green-600' },
          ].map(c => (
            <div key={c.label} className="card p-4">
              <div className="text-xs text-gray-400 mb-1">{c.label}</div>
              <div className={`text-xl font-bold ${c.cls}`}>{c.val}</div>
            </div>
          ))}
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="empty-state"><Receipt size={36} className="text-gray-200 mb-2"/><p className="text-sm text-gray-500">No expense claims</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium text-gray-900 dark:text-white">{r.employee_name}</td>
                    <td>{r.expense_type}</td>
                    <td>{fmtDate(r.claim_date)}</td>
                    <td className="font-semibold">₹{(+r.amount).toLocaleString('en-IN')}</td>
                    <td className="max-w-[180px] truncate text-gray-500">{r.description || '—'}</td>
                    <td>
                      <Badge text={r.status} />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {r.status === 'Pending' && (
                          <>
                            <button onClick={() => { setActionModal({ id: r.id, action: 'approve' }); setRemarks(''); }}
                              className="btn-approve">
                              <CheckCircle size={11}/>Approve
                            </button>
                            <button onClick={() => { setActionModal({ id: r.id, action: 'reject' }); setRemarks(''); }}
                              className="btn-reject">
                              <XCircle size={11}/>Reject
                            </button>
                          </>
                        )}
                        <button onClick={() => del(r.id)} className="btn-delete">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal open={modal} title="Add Expense Claim" onClose={() => setModal(false)} onSave={save} saveLabel="Add">
        <FormSection title="Claim Details">
          <FormGrid>
            <Field label="Employee" required>
              <Select
                value={form.employee_id || ''}
                onChange={v => f({ employee_id: v })}
                options={employees.map(e => ({ value: String(e.id), label: e.full_name }))}
                placeholder="Select employee"
                searchable
              />
            </Field>
            <Field label="Expense Type" required>
              <Select
                value={form.expense_type || ''}
                onChange={v => f({ expense_type: v })}
                options={EXPENSE_TYPES}
                placeholder="Select type"
              />
            </Field>
            <Field label="Amount (₹)" required>
              <input type="number" min="0" step="0.01" className="form-input" value={form.amount || ''} onChange={e => f({ amount: e.target.value })} placeholder="0.00"/>
            </Field>
            <Field label="Date" required>
              <DatePicker value={form.claim_date || ''} onChange={v => f({ claim_date: v })} placeholder="Select claim date" />
            </Field>
            <Field label="Description">
              <input className="form-input" value={form.description || ''} onChange={e => f({ description: e.target.value })} placeholder="Brief description"/>
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>

      {/* Approve/Reject Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              {actionModal.action === 'approve' ? 'Approve' : 'Reject'} Expense
            </h3>
            <p className="text-sm text-gray-500 mb-4">Add remarks (optional)</p>
            <textarea
              className="form-textarea w-full"
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Remarks…"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setActionModal(null)} className="btn btn-secondary btn-sm">Cancel</button>
              <button
                onClick={doAction}
                className={`btn btn-sm ${actionModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              >
                {actionModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

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
