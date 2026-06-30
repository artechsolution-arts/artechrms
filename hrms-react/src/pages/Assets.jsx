import { useState, useEffect } from 'react';
import { api } from '../api';
import { fmtDate } from '../utils/date';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import DatePicker from '../components/DatePicker';
import Select from '../components/Select';
import Badge from '../components/Badge';
import { Plus, Monitor, Undo2, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const STATUS_COLOR = {
  Allocated: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  Returned:  'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
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
  const [formErrors, setFormErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [assets, emps] = await Promise.all([
        api('GET', `/api/hrm/assets${filterStatus ? `?status=${filterStatus}` : ''}`),
        api('GET', '/api/employees?all=true'),
      ]);
      setRows(assets);
      setEmps(emps);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filterStatus]);

  const f = (v) => {
    setForm(p => ({ ...p, ...v }));
    const key = Object.keys(v)[0];
    if (key) setFormErrors(p => ({ ...p, [key]: '' }));
  };

  const save = async () => {
    const errs = {};
    if (!form.employee_id) errs.employee_id = 'Employee is required';
    if (!form.asset_name?.trim()) errs.asset_name = 'Asset name is required';
    if (!form.asset_type) errs.asset_type = 'Asset type is required';
    if (!form.allocated_date) errs.allocated_date = 'Allocated date is required';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
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
    setConfirmDialog({
      title: 'Delete Asset',
      message: 'Delete this asset record?',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try { await api('DELETE', `/api/hrm/assets/${id}`); toast('Deleted', 'success'); load(); }
        catch (e) { toast(e.message, 'error'); }
      }
    });
    return;
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Asset Management</h1>
        <div className="flex gap-2">
          <Select
            value={filterStatus}
            onChange={v => setFilterStatus(v)}
            options={[{ value: '', label: 'All Status' }, 'Allocated', 'Returned']}
            size="sm"
            className="w-36"
          />
          <button onClick={() => { setFormErrors({}); setForm({ allocated_date: new Date().toISOString().slice(0, 10), condition: 'Good' }); setModal(true); }} className="btn btn-primary btn-sm gap-1.5"><Plus size={13}/>Allocate Asset</button>
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
                    <td className="font-medium text-gray-900 dark:text-white">{r.employee_name}</td>
                    <td>{r.asset_name}</td>
                    <td>{r.asset_type}</td>
                    <td className="text-gray-500 dark:text-gray-400 font-mono text-xs">{r.serial_number || '—'}</td>
                    <td>{fmtDate(r.allocated_date)}</td>
                    <td>{r.condition}</td>
                    <td>
                      <Badge text={r.status} />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {r.status === 'Allocated' && (
                          <button
                            onClick={() => { setReturnModal(r.id); setReturnForm({ condition: 'Good', returned_date: new Date().toISOString().slice(0,10) }); }}
                            className="btn-action">
                            <Undo2 size={11}/>Return
                          </button>
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

      {/* Allocate Asset Modal */}
      <Modal open={modal} title="Allocate Asset" onClose={() => setModal(false)} onSave={save} saveLabel="Allocate">
        <FormSection title="Asset Details">
          <FormGrid>
            <Field label="Employee" required error={formErrors.employee_id}>
              <Select
                value={form.employee_id || ''}
                onChange={v => f({ employee_id: v })}
                options={employees.map(e => ({ value: String(e.id), label: e.full_name }))}
                placeholder="Select employee"
                searchable
              />
            </Field>
            <Field label="Asset Name" required error={formErrors.asset_name}>
              <input className="form-input" value={form.asset_name || ''} onChange={e => f({ asset_name: e.target.value })} placeholder="e.g. ThinkPad X1 Carbon"/>
            </Field>
            <Field label="Asset Type" required error={formErrors.asset_type}>
              <Select
                value={form.asset_type || ''}
                onChange={v => f({ asset_type: v })}
                options={ASSET_TYPES}
                placeholder="Select type"
              />
            </Field>
            <Field label="Serial Number">
              <input className="form-input" value={form.serial_number || ''} onChange={e => f({ serial_number: e.target.value })} placeholder="SN-XXXXX"/>
            </Field>
            <Field label="Allocated Date" required error={formErrors.allocated_date}>
              <DatePicker value={form.allocated_date || ''} onChange={v => f({ allocated_date: v })} placeholder="Select date" />
            </Field>
            <Field label="Condition">
              <Select
                value={form.condition}
                onChange={v => f({ condition: v })}
                options={['New', 'Good', 'Fair', 'Poor']}
              />
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
                <DatePicker value={returnForm.returned_date} onChange={v => setReturnForm(p => ({ ...p, returned_date: v }))} placeholder="Select return date" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Condition</label>
                <Select
                  value={returnForm.condition}
                  onChange={v => setReturnForm(p => ({ ...p, condition: v }))}
                  options={['New', 'Good', 'Fair', 'Poor', 'Damaged']}
                />
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
