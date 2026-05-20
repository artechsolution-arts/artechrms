import { useState, useEffect } from 'react';
import { api } from '../../api';
import Badge from '../../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../../components/Modal';
import DatePicker from '../../components/DatePicker';
import { Plus, Trash2 } from 'lucide-react';

export default function EmpLeaves({ toast }) {
  const [leaves, setLeaves] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const f = v => setForm(p => ({ ...p, ...v }));

  const load = async () => {
    setLoading(true);
    try {
      const [lv, lt] = await Promise.all([
        api('GET', '/api/portal/leaves'),
        api('GET', '/api/portal/leave-types'),
      ]);
      setLeaves(lv);
      setTypes(lt);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const apply = async () => {
    if (!form.leave_type_id || !form.from_date || !form.to_date)
      return toast('All required fields must be filled', 'warning');
    if (form.from_date > form.to_date)
      return toast('From date must be before to date', 'warning');
    try {
      await api('POST', '/api/portal/leaves', {
        leave_type_id: parseInt(form.leave_type_id),
        from_date: form.from_date,
        to_date: form.to_date,
        reason: form.reason || null,
      });
      toast('Leave application submitted', 'success');
      setModal(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const cancel = async id => {
    if (!confirm('Cancel this leave application?')) return;
    try {
      await api('DELETE', `/api/portal/leaves/${id}`);
      toast('Leave cancelled', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const pending = leaves.filter(l => l.status === 'Pending');
  const others = leaves.filter(l => l.status !== 'Pending');

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">My Leaves</h1>
        <button onClick={() => { setForm({}); setModal(true); }} className="btn btn-primary btn-sm gap-1.5">
          <Plus size={13} /> Apply Leave
        </button>
      </div>

      <div className="page-content space-y-4">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Applied', count: leaves.length, color: 'text-gray-700' },
            { label: 'Pending',       count: leaves.filter(l => l.status === 'Pending').length,  color: 'text-amber-600' },
            { label: 'Approved',      count: leaves.filter(l => l.status === 'Approved').length, color: 'text-green-600' },
          ].map(({ label, count, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="card p-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : leaves.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <p className="text-sm text-gray-500">No leave applications yet</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {leaves.map(lv => (
                    <tr key={lv.id}>
                      <td className="font-medium text-gray-900">{lv.leave_type}</td>
                      <td className="text-gray-600">{lv.from_date}</td>
                      <td className="text-gray-600">{lv.to_date}</td>
                      <td className="text-gray-600">{lv.total_days}</td>
                      <td className="text-gray-500 text-xs max-w-[160px] truncate">{lv.reason || '—'}</td>
                      <td><Badge text={lv.status} /></td>
                      <td>
                        {lv.status === 'Pending' && (
                          <button onClick={() => cancel(lv.id)} className="btn btn-danger btn-xs gap-1">
                            <Trash2 size={11} /> Cancel
                          </button>
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

      <Modal open={modal} title="Apply for Leave" onClose={() => setModal(false)} onSave={apply} saveLabel="Submit Application">
        <FormSection title="Leave Details">
          <FormGrid>
            <Field label="Leave Type" required full>
              <select className="form-select" value={form.leave_type_id || ''} onChange={e => f({ leave_type_id: e.target.value })}>
                <option value="">Select leave type</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name} ({t.max_leaves} days/year)</option>)}
              </select>
            </Field>
            <Field label="From Date" required>
              <DatePicker value={form.from_date || ''} onChange={v => f({ from_date: v })} placeholder="Select from date" />
            </Field>
            <Field label="To Date" required>
              <DatePicker value={form.to_date || ''} onChange={v => f({ to_date: v })} placeholder="Select to date" min={form.from_date} />
            </Field>
            <Field label="Reason" full>
              <textarea className="form-textarea" rows={3} value={form.reason || ''} onChange={e => f({ reason: e.target.value })} placeholder="Brief reason for leave…" />
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>
    </>
  );
}
