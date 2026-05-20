import { useState, useEffect } from 'react';
import { api } from '../api';
import Modal, { FormGrid, Field } from '../components/Modal';
import { Plus, Trash2, Pencil, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export default function LeaveTypes({ toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'add' } | { mode: 'edit', id }
  const [form, setForm] = useState({});
  const f = v => setForm(prev => ({ ...prev, ...v }));

  const load = async () => {
    setLoading(true);
    try { setRows(await api('GET', '/api/leaves/types')); }
    catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ is_paid: true, is_carry_forward: false, max_leaves: 12 });
    setModal({ mode: 'add' });
  };

  const openEdit = lt => {
    setForm({ name: lt.name, max_leaves: lt.max_leaves, is_paid: lt.is_paid, is_carry_forward: lt.is_carry_forward });
    setModal({ mode: 'edit', id: lt.id });
  };

  const save = async () => {
    if (!form.name?.trim()) return toast('Leave type name is required', 'warning');
    const payload = {
      name: form.name,
      max_leaves: parseFloat(form.max_leaves) || 0,
      is_carry_forward: form.is_carry_forward === true,
      is_paid: form.is_paid !== false,
    };
    try {
      if (modal.mode === 'add') {
        await api('POST', '/api/leaves/types', payload);
        toast('Leave type created', 'success');
      } else {
        await api('PUT', `/api/leaves/types/${modal.id}`, payload);
        toast('Leave type updated', 'success');
      }
      setModal(null); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const del = async (id, name) => {
    if (!confirm(`Delete leave type "${name}"?`)) return;
    try { await api('DELETE', `/api/leaves/types/${id}`); toast('Deleted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Leave Types</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={openAdd} className="btn btn-primary btn-sm gap-1.5">
            <Plus size={13} /> New Leave Type
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Max Days / Year</th>
                  <th>Paid</th>
                  <th>Carry Forward</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <p className="text-sm text-gray-500">No leave types configured</p>
                      <p className="text-xs text-gray-400 mt-1">Add leave types before employees can apply for leaves</p>
                    </div>
                  </td></tr>
                ) : rows.map(lt => (
                  <tr key={lt.id}>
                    <td className="font-semibold text-gray-900">{lt.name}</td>
                    <td className="text-gray-600">{lt.max_leaves} days</td>
                    <td>
                      {lt.is_paid
                        ? <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium"><CheckCircle size={12} /> Paid</span>
                        : <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium"><XCircle size={12} /> Unpaid</span>}
                    </td>
                    <td>
                      {lt.is_carry_forward
                        ? <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-medium"><CheckCircle size={12} /> Yes</span>
                        : <span className="text-xs text-gray-400">No</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(lt)} className="btn btn-secondary btn-xs gap-1">
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => del(lt.id, lt.name)} className="btn btn-danger btn-xs gap-1">
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

      <Modal
        open={!!modal}
        title={modal?.mode === 'edit' ? 'Edit Leave Type' : 'New Leave Type'}
        onClose={() => setModal(null)}
        onSave={save}
        saveLabel={modal?.mode === 'edit' ? 'Save Changes' : 'Create'}
      >
        <FormGrid>
          <Field label="Leave Type Name" required full>
            <input
              className="form-input"
              placeholder="e.g. Annual Leave, Sick Leave, Casual Leave"
              value={form.name || ''}
              onChange={e => f({ name: e.target.value })}
              autoFocus
            />
          </Field>
          <Field label="Max Days Per Year">
            <input
              type="number"
              min={0}
              step={0.5}
              className="form-input"
              placeholder="e.g. 12"
              value={form.max_leaves ?? 12}
              onChange={e => f({ max_leaves: e.target.value })}
            />
          </Field>
          <Field label="Options">
            <div className="flex flex-col gap-2 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={form.is_paid !== false}
                  onChange={e => f({ is_paid: e.target.checked })}
                />
                Paid Leave
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={!!form.is_carry_forward}
                  onChange={e => f({ is_carry_forward: e.target.checked })}
                />
                Allow Carry Forward
              </label>
            </div>
          </Field>
        </FormGrid>
      </Modal>
    </>
  );
}
