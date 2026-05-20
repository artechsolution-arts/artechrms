import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Modal, { Field } from '../components/Modal';
import { Plus, Trash2, Pencil, Building2 } from 'lucide-react';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

export default function Departments({ toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'add' } | { mode: 'edit', id, name }
  const [name, setName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api('GET', '/api/employees/departments')); }
    catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useRefreshOnFocus(load);

  const openAdd = () => { setName(''); setModal({ mode: 'add' }); };
  const openEdit = d => { setName(d.name); setModal({ mode: 'edit', id: d.id }); };

  const save = async () => {
    if (!name.trim()) return toast('Department name is required', 'warning');
    try {
      if (modal.mode === 'add') {
        await api('POST', '/api/employees/departments', { name: name.trim() });
        toast('Department added', 'success');
      } else {
        await api('PUT', `/api/employees/departments/${modal.id}`, { name: name.trim() });
        toast('Department updated', 'success');
      }
      setModal(null); setName(''); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const del = async (id, n) => {
    if (!confirm(`Delete department "${n}"?`)) return;
    try { await api('DELETE', `/api/employees/departments/${id}`); toast('Deleted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Departments</h1>
        <button onClick={openAdd} className="btn btn-primary btn-sm gap-1.5">
          <Plus size={13} /> New Department
        </button>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Department Name</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={2} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={2}>
                    <div className="empty-state">
                      <Building2 size={32} className="text-gray-200 mb-2" />
                      <p className="text-sm text-gray-500">No departments yet</p>
                    </div>
                  </td></tr>
                ) : rows.map(d => (
                  <tr key={d.id}>
                    <td className="font-semibold text-gray-900">{d.name}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(d)} className="btn btn-secondary btn-xs gap-1">
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => del(d.id, d.name)} className="btn btn-danger btn-xs gap-1">
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
        title={modal?.mode === 'edit' ? 'Edit Department' : 'New Department'}
        onClose={() => setModal(null)}
        onSave={save}
        saveLabel={modal?.mode === 'edit' ? 'Save Changes' : 'Add Department'}
      >
        <Field label="Department Name" required>
          <input
            className="form-input" value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Engineering, Sales, HR..."
            onKeyDown={e => e.key === 'Enter' && save()}
            autoFocus
          />
        </Field>
      </Modal>
    </>
  );
}
