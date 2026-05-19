import { useState, useEffect } from 'react';
import { api } from '../api';
import Modal, { Field } from '../components/Modal';
import { Plus, Trash2, Award } from 'lucide-react';

export default function Designations({ toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    try { setRows(await api('GET', '/api/employees/designations')); }
    catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name?.trim()) return toast('Designation name is required', 'warning');
    try {
      await api('POST', '/api/employees/designations', { name: form.name, description: form.description || null });
      toast('Designation added', 'success');
      setModal(false);
      setForm({});
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const del = async (id, name) => {
    if (!confirm(`Delete designation "${name}"?`)) return;
    try {
      await api('DELETE', `/api/employees/designations/${id}`);
      toast('Deleted', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Designations</h1>
        <button
          onClick={() => { setForm({}); setModal(true); }}
          className="btn btn-primary btn-sm gap-1.5"
        >
          <Plus size={13} /> New Designation
        </button>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Designation</th><th>Description</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={3}>
                    <div className="empty-state">
                      <Award size={32} className="text-gray-200 mb-2" />
                      <p className="text-sm text-gray-500">No designations yet</p>
                    </div>
                  </td></tr>
                ) : rows.map(d => (
                  <tr key={d.id}>
                    <td className="font-semibold text-gray-900">{d.name}</td>
                    <td className="text-gray-500">{d.description || '—'}</td>
                    <td>
                      <button onClick={() => del(d.id, d.name)} className="btn btn-danger btn-xs gap-1">
                        <Trash2 size={11} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modal} title="New Designation" onClose={() => setModal(false)} onSave={save}>
        <Field label="Designation Name" required>
          <input
            className="form-input"
            placeholder="e.g. Senior Developer, HR Manager"
            value={form.name || ''}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && save()}
            autoFocus
          />
        </Field>
        <div className="mt-3">
          <Field label="Description">
            <input
              className="form-input"
              placeholder="Optional description"
              value={form.description || ''}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
