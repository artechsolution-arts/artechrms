import { useState, useEffect } from 'react';
import { api } from '../api';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import { Plus, Monitor, Undo2, Trash2 } from 'lucide-react';

const STATUS_COLOR = {
  Allocated: 'bg-blue-50 text-blue-700 border border-blue-200',
  Returned:  'bg-gray-100 text-gray-600 border border-gray-200',
};

const ASSET_TYPES = ['Laptop', 'Desktop', 'Mobile', 'Tablet', 'Mouse & Keyboard', 'Monitor', 'Headset', 'Access Card', 'Sim Card', 'Other'];

export default function Assets({ toast }) {
  const [rows, setRows]       = useState([]);
  const [employees, setEmps]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal]     = useState(false);
  const [returnModal, setReturnModal] = useState(null);
  const [returnForm, setReturnForm]   = useState({ condition: 'Good', returned_date: new Date().toISOString().slice(0,10) });
  const [form, setForm] = useState({ allocated_date: new Date().toISOString().slice(0, 10), condition: 'Good' });

  const load = async () => {
    setLoading(true);
    try {
      const [assets, emps] = await Promise.all([
        api('GET', `/api/hrm/assets${filterStatus ? `?status=${filterStatus}` : ''}`),
        api('GET', '/api/employees'),
      ]);
      setRows(assets);
      setEmps(emps);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filterStatus]);

  const f = v => setForm(p => ({ ...p, ...v }));

  const save = async () => {
    if (!form.employee_id || !form.asset_name || !form.asset_type)
      return toast('Employee, name and type are required', 'warning');
    try {
      await api('POST', '/api/hrm/assets', { ...form, employee_id: +form.employee_id });
      toast('Asset allocated', 'success');
      setModal(false);
      setForm({ allocated_date: new Date().toISOString().slice(0, 10), condition: 'Good' });
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const doReturn = async () => {
    if (!returnModal) return;
    try {
      await api('PUT', `/api/hrm/assets/${returnModal}/return`, returnForm);
      toast('Asset returned', 'success');
      setReturnModal(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const del = async id => {
    if (!confirm('Delete this asset record?')) return;
    try { await api('DELETE', `/api/hrm/assets/${id}`); toast('Deleted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Asset Management</h1>
        <div className="flex gap-2">
          <select className="form-select text-sm w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>Allocated</option>
            <option>Returned</option>
          </select>
          <button onClick={() => setModal(true)} className="btn btn-primary btn-sm gap-1.5"><Plus size={13}/>Allocate Asset</button>
        </div>
      </div>

      <div className="page-content">
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="empty-state"><Monitor size={36} className="text-gray-200 mb-2"/><p className="text-sm text-gray-500">No assets found</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Serial No.</th>
                  <th>Allocated On</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium text-gray-900">{r.employee_name}</td>
                    <td>{r.asset_name}</td>
                    <td>{r.asset_type}</td>
                    <td className="text-gray-500 font-mono text-xs">{r.serial_number || '—'}</td>
                    <td>{r.allocated_date}</td>
                    <td>{r.condition}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[r.status] || 'bg-gray-100 text-gray-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {r.status === 'Allocated' && (
                          <button
                            onClick={() => { setReturnModal(r.id); setReturnForm({ condition: 'Good', returned_date: new Date().toISOString().slice(0,10) }); }}
                            className="btn btn-secondary btn-xs gap-1">
                            <Undo2 size={11}/>Return
                          </button>
                        )}
                        <button onClick={() => del(r.id)} className="p-1 text-gray-400 hover:text-red-500">
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

      {/* Allocate Asset Modal */}
      <Modal open={modal} title="Allocate Asset" onClose={() => setModal(false)} onSave={save} saveLabel="Allocate">
        <FormSection title="Asset Details">
          <FormGrid>
            <Field label="Employee" required>
              <select className="form-select" value={form.employee_id || ''} onChange={e => f({ employee_id: e.target.value })}>
                <option value="">Select employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </Field>
            <Field label="Asset Name" required>
              <input className="form-input" value={form.asset_name || ''} onChange={e => f({ asset_name: e.target.value })} placeholder="e.g. ThinkPad X1 Carbon"/>
            </Field>
            <Field label="Asset Type" required>
              <select className="form-select" value={form.asset_type || ''} onChange={e => f({ asset_type: e.target.value })}>
                <option value="">Select type</option>
                {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Serial Number">
              <input className="form-input" value={form.serial_number || ''} onChange={e => f({ serial_number: e.target.value })} placeholder="SN-XXXXX"/>
            </Field>
            <Field label="Allocated Date" required>
              <input type="date" className="form-input" value={form.allocated_date || ''} onChange={e => f({ allocated_date: e.target.value })}/>
            </Field>
            <Field label="Condition">
              <select className="form-select" value={form.condition} onChange={e => f({ condition: e.target.value })}>
                {['New', 'Good', 'Fair', 'Poor'].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Notes">
              <input className="form-input" value={form.notes || ''} onChange={e => f({ notes: e.target.value })} placeholder="Any notes…"/>
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>

      {/* Return Asset Modal */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Return Asset</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Return Date</label>
                <input type="date" className="form-input w-full" value={returnForm.returned_date}
                  onChange={e => setReturnForm(p => ({ ...p, returned_date: e.target.value }))}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Condition</label>
                <select className="form-select w-full" value={returnForm.condition}
                  onChange={e => setReturnForm(p => ({ ...p, condition: e.target.value }))}>
                  {['New', 'Good', 'Fair', 'Poor', 'Damaged'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <input className="form-input w-full" value={returnForm.notes || ''}
                  onChange={e => setReturnForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any notes…"/>
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setReturnModal(null)} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={doReturn} className="btn btn-primary btn-sm">Confirm Return</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
