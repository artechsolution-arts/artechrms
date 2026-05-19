import { useState, useEffect } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';

export default function SalaryComponents({ toast }) {
  const [comps, setComps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const f = v => setForm(prev => ({ ...prev, ...v }));

  const load = async () => {
    setLoading(true);
    try { setComps(await api('GET', '/api/payroll/components')); }
    catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name?.trim()) return toast('Name required', 'warning');
    try {
      await api('POST', '/api/payroll/components', {
        name: form.name, abbr: form.abbr || '',
        component_type: form.component_type || 'Earning',
        amount: parseFloat(form.amount) || 0,
      });
      toast('Component added', 'success'); setModal(false); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const del = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await api('DELETE', `/api/payroll/components/${id}`); toast('Deleted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Salary Components</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={() => { setForm({ component_type: 'Earning', amount: 0 }); setModal(true); }}
            className="btn btn-primary btn-sm gap-1.5"><Plus size={13} /> Add Component</button>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Abbreviation</th><th>Type</th><th>Default Amount</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : comps.length === 0 ? (
                  <tr><td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">⚙️</div>
                      <p className="text-sm text-gray-500">No salary components</p>
                    </div>
                  </td></tr>
                ) : comps.map(c => (
                  <tr key={c.id}>
                    <td className="font-semibold text-gray-900">{c.name}</td>
                    <td><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{c.abbr || '—'}</code></td>
                    <td><Badge text={c.component_type} /></td>
                    <td className="text-gray-700">₹{c.amount || 0}</td>
                    <td>
                      <button onClick={() => del(c.id, c.name)} className="btn btn-danger btn-xs gap-1">
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

      <Modal open={modal} title="Add Salary Component" onClose={() => setModal(false)} onSave={save} saveLabel="Add Component">
        <FormSection title="Component Details">
          <FormGrid>
            <Field label="Name" required>
              <input className="form-input" value={form.name || ''} onChange={e => f({ name: e.target.value })} placeholder="e.g. Basic Salary" />
            </Field>
            <Field label="Abbreviation">
              <input className="form-input" value={form.abbr || ''} onChange={e => f({ abbr: e.target.value })} placeholder="e.g. BASIC" />
            </Field>
            <Field label="Type">
              <select className="form-select" value={form.component_type || 'Earning'} onChange={e => f({ component_type: e.target.value })}>
                <option>Earning</option><option>Deduction</option>
              </select>
            </Field>
            <Field label="Default Amount">
              <input type="number" className="form-input" value={form.amount || 0} onChange={e => f({ amount: e.target.value })} />
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>
    </>
  );
}
