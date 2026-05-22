import { useState, useEffect } from 'react';
import { api } from '../../api';
import { fmtDate } from '../../utils/date';
import Modal, { FormSection, FormGrid, Field } from '../../components/Modal';
import DatePicker from '../../components/DatePicker';
import Select from '../../components/Select';
import { Plus, Receipt } from 'lucide-react';

const STATUS_COLOR = {
  Pending:  'bg-amber-50 text-amber-700 border border-amber-200',
  Approved: 'bg-green-50 text-green-700 border border-green-200',
  Rejected: 'bg-red-50 text-red-700 border border-red-200',
};

const EXPENSE_TYPES = ['Travel', 'Meals', 'Accommodation', 'Office Supplies', 'Medical', 'Training', 'Internet', 'Other'];

export default function EmpExpenses({ toast }) {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ claim_date: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    api('GET', '/api/portal/expenses')
      .then(setRows)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const f = v => setForm(p => ({ ...p, ...v }));

  const save = async () => {
    if (!form.expense_type || !form.amount || !form.claim_date)
      return toast('Type, amount and date are required', 'warning');
    try {
      await api('POST', '/api/portal/expenses', { ...form, amount: +form.amount });
      toast('Expense claim submitted', 'success');
      setModal(false);
      setForm({ claim_date: new Date().toISOString().slice(0, 10) });
      const updated = await api('GET', '/api/portal/expenses');
      setRows(updated);
    } catch (e) { toast(e.message, 'error'); }
  };

  const totalPending  = rows.filter(r => r.status === 'Pending').reduce((s, r) => s + r.amount, 0);
  const totalApproved = rows.filter(r => r.status === 'Approved').reduce((s, r) => s + r.amount, 0);

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>;

  return (
    <>
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">My Expense Claims</h2>
            <button onClick={() => setModal(true)} className="btn btn-primary btn-sm gap-1.5"><Plus size={13}/>New Claim</button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Claims', val: rows.length, cls: 'text-gray-800' },
              { label: 'Pending',      val: `₹${totalPending.toLocaleString('en-IN')}`, cls: 'text-amber-600' },
              { label: 'Approved',     val: `₹${totalApproved.toLocaleString('en-IN')}`, cls: 'text-green-600' },
            ].map(c => (
              <div key={c.label} className="card p-4">
                <div className="text-xs text-gray-400 mb-1">{c.label}</div>
                <div className={`text-xl font-bold ${c.cls}`}>{c.val}</div>
              </div>
            ))}
          </div>

          {rows.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <Receipt size={36} className="text-gray-200 mb-2"/>
                <p className="text-sm text-gray-500">No expense claims yet. Click "New Claim" to submit one.</p>
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td className="font-medium text-gray-900">{r.expense_type}</td>
                      <td>{fmtDate(r.claim_date)}</td>
                      <td className="font-semibold">₹{(+r.amount).toLocaleString('en-IN')}</td>
                      <td className="max-w-[160px] truncate text-gray-500">{r.description || '—'}</td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[r.status] || ''}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="text-gray-500 text-xs">{r.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={modal} title="New Expense Claim" onClose={() => setModal(false)} onSave={save} saveLabel="Submit">
        <FormSection title="Claim Details">
          <FormGrid>
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
    </>
  );
}
