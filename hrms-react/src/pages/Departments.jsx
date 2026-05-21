import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Modal, { Field } from '../components/Modal';
import { Plus, Trash2, Pencil, Building2 } from 'lucide-react';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

const BG_PALETTE = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-teal-500 to-cyan-600',
  'from-green-500 to-emerald-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-pink-600',
];

export default function Departments({ toast }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [name,    setName]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api('GET', '/api/employees/departments')); }
    catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useRefreshOnFocus(load);

  const openAdd  = () => { setName(''); setModal({ mode: 'add' }); };
  const openEdit = d  => { setName(d.name); setModal({ mode: 'edit', id: d.id }); };

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
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mb-3" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Building2 size={36} className="text-gray-200 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-500">No departments yet</p>
              <button onClick={openAdd} className="btn btn-primary btn-sm mt-3 gap-1.5">
                <Plus size={13} /> Add First Department
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {rows.map((d, i) => {
              const gradient = BG_PALETTE[i % BG_PALETTE.length];
              const initials = d.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={d.id} className="card p-5 group hover:shadow-md transition-shadow flex flex-col">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 flex-shrink-0`}>
                    <span className="text-white text-sm font-bold">{initials}</span>
                  </div>

                  {/* Name */}
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight flex-1 mb-4">
                    {d.name}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(d)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 text-xs font-medium text-gray-500 hover:text-[var(--accent)] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Pencil size={11} /> Edit
                    </button>
                    <button
                      onClick={() => del(d.id, d.name)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add card */}
            <button
              onClick={openAdd}
              className="card p-5 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[var(--accent)] min-h-[120px]"
            >
              <Plus size={20} />
              <span className="text-xs font-medium">Add Department</span>
            </button>
          </div>
        )}
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
            className="form-input"
            value={name}
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
