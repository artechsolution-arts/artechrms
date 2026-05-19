import { useState, useEffect } from 'react';
import { api } from '../api';
import Modal, { Field } from '../components/Modal';
import { Plus, Trash2, Building2 } from 'lucide-react';

export default function Departments({ toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');

  const load = async () => {
    setLoading(true);
    try { setRows(await api('GET', '/api/employees/departments')); }
    catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!name.trim()) return toast('Department name is required', 'warning');
    try {
      await api('POST', '/api/employees/departments', { name: name.trim() });
      toast('Department added', 'success'); setModal(false); setName(''); load();
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
        <button onClick={() => { setName(''); setModal(true); }} className="btn btn-primary btn-sm gap-1.5">
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

      <Modal open={modal} title="New Department" onClose={() => setModal(false)} onSave={save}>
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
