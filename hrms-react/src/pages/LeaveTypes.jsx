import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import { Plus, Trash2, Pencil, RefreshCw, CheckCircle, XCircle, Settings2, Info } from 'lucide-react';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <div
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
        onClick={() => onChange(!checked)}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
      {label && <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>}
    </label>
  );
}

export default function LeaveTypes({ toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  // Configure policy state
  const [configModal, setConfigModal] = useState(null); // { lt }
  const [configForm, setConfigForm] = useState({});
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  const f = v => setForm(prev => ({ ...prev, ...v }));
  const cf = v => setConfigForm(prev => ({ ...prev, ...v }));

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api('GET', '/api/leaves/types')); }
    catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useRefreshOnFocus(load);

  const openAdd = () => {
    setForm({ is_paid: true, is_carry_forward: false, max_leaves: 12 });
    setModal({ mode: 'add' });
  };

  const openEdit = lt => {
    setForm({ name: lt.name, max_leaves: lt.max_leaves, is_paid: lt.is_paid, is_carry_forward: lt.is_carry_forward });
    setModal({ mode: 'edit', id: lt.id });
  };

  const openConfig = async (lt) => {
    setConfigLoading(true);
    setConfigModal({ lt });
    try {
      const policy = await api('GET', `/api/leaves/types/${lt.id}/policy`);
      setConfigForm({
        prorate_on_joining: policy.prorate_on_joining ?? false,
        prorate_cutoff_day: policy.prorate_cutoff_day ?? 15,
        leaves_before_cutoff: policy.leaves_before_cutoff ?? 2,
        leaves_after_cutoff: policy.leaves_after_cutoff ?? 1,
        carry_forward_max: policy.carry_forward_max ?? 0,
        encashment_allowed: policy.encashment_allowed ?? false,
        min_service_days: policy.min_service_days ?? 0,
      });
    } catch (e) { toast(e.message, 'error'); }
    finally { setConfigLoading(false); }
  };

  const saveConfig = async () => {
    setConfigSaving(true);
    try {
      await api('PUT', `/api/leaves/types/${configModal.lt.id}/policy`, {
        prorate_on_joining: configForm.prorate_on_joining ?? false,
        prorate_cutoff_day: parseInt(configForm.prorate_cutoff_day) || 15,
        leaves_before_cutoff: parseFloat(configForm.leaves_before_cutoff) || 2,
        leaves_after_cutoff: parseFloat(configForm.leaves_after_cutoff) || 1,
        carry_forward_max: parseFloat(configForm.carry_forward_max) || 0,
        encashment_allowed: configForm.encashment_allowed ?? false,
        min_service_days: parseInt(configForm.min_service_days) || 0,
      });
      toast('Policy saved', 'success');
      setConfigModal(null);
    } catch (e) { toast(e.message, 'error'); }
    finally { setConfigSaving(false); }
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

  const lt = configModal?.lt;
  const cutoff = parseInt(configForm.prorate_cutoff_day) || 15;

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
                  <th className="hidden sm:table-cell">Max Days / Year</th>
                  <th>Paid</th>
                  <th className="hidden sm:table-cell">Carry Forward</th>
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
                    <td className="font-semibold text-gray-900 dark:text-gray-100">{lt.name}</td>
                    <td className="hidden sm:table-cell text-gray-600 dark:text-gray-400">{lt.max_leaves} days</td>
                    <td>
                      {lt.is_paid
                        ? <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium"><CheckCircle size={12} /><span className="hidden sm:inline">Paid</span></span>
                        : <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium"><XCircle size={12} /><span className="hidden sm:inline">Unpaid</span></span>}
                    </td>
                    <td className="hidden sm:table-cell">
                      {lt.is_carry_forward
                        ? <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-medium"><CheckCircle size={12} /> Yes</span>
                        : <span className="text-xs text-gray-400">No</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(lt)} className="btn btn-secondary btn-xs gap-1">
                          <Pencil size={11} /> Edit
                        </button>
                        <button
                          onClick={() => openConfig(lt)}
                          className="btn btn-xs gap-1 bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700"
                        >
                          <Settings2 size={11} /> Configure
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

      {/* Add / Edit Leave Type Modal */}
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

      {/* Leave Policy Configuration Modal */}
      <Modal
        open={!!configModal}
        title={`Configure — ${lt?.name || ''}`}
        onClose={() => setConfigModal(null)}
        onSave={saveConfig}
        saveLabel={configSaving ? 'Saving…' : 'Save Policy'}
      >
        {configLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Loading policy…</div>
        ) : (
          <>
            {/* Section 1: Joining Month Accrual */}
            <FormSection title="Joining Month Accrual">
              <div className="px-1 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Pro-rata on Joining Date</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      When an employee joins mid-month, calculate their leave credit based on when in the month they joined.
                    </p>
                  </div>
                  <Toggle
                    checked={!!configForm.prorate_on_joining}
                    onChange={v => cf({ prorate_on_joining: v })}
                  />
                </div>

                {configForm.prorate_on_joining && (
                  <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Cutoff Day</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={28}
                            className="form-input w-20 text-center"
                            value={configForm.prorate_cutoff_day ?? 15}
                            onChange={e => cf({ prorate_cutoff_day: e.target.value })}
                          />
                          <span className="text-xs text-gray-500">of the month</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Joined on/before {cutoff}<sup>th</sup>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={31}
                            step={0.5}
                            className="form-input w-20 text-center"
                            value={configForm.leaves_before_cutoff ?? 2}
                            onChange={e => cf({ leaves_before_cutoff: e.target.value })}
                          />
                          <span className="text-xs text-gray-500">leaves</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Joined after {cutoff}<sup>th</sup>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={31}
                            step={0.5}
                            className="form-input w-20 text-center"
                            value={configForm.leaves_after_cutoff ?? 1}
                            onChange={e => cf({ leaves_after_cutoff: e.target.value })}
                          />
                          <span className="text-xs text-gray-500">leaves</span>
                        </div>
                      </div>
                    </div>

                    {/* Live preview */}
                    <div className="flex items-start gap-2 rounded-lg bg-white dark:bg-gray-800 border border-violet-100 dark:border-violet-800 px-3 py-2.5">
                      <Info size={13} className="text-violet-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        Joining on <span className="font-semibold text-gray-800 dark:text-gray-200">1st–{cutoff}th</span> of the month
                        → <span className="font-semibold text-violet-700 dark:text-violet-400">{configForm.leaves_before_cutoff ?? 2} leave{(configForm.leaves_before_cutoff ?? 2) !== 1 ? 's' : ''}</span> credited for that month.
                        {' '}Joining on <span className="font-semibold text-gray-800 dark:text-gray-200">{cutoff + 1}th onwards</span>
                        → <span className="font-semibold text-violet-700 dark:text-violet-400">{configForm.leaves_after_cutoff ?? 1} leave{(configForm.leaves_after_cutoff ?? 1) !== 1 ? 's' : ''}</span> credited.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            {/* Section 2: Carry Forward */}
            {lt?.is_carry_forward && (
              <FormSection title="Carry Forward Rules">
                <div className="px-1 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Maximum days that can be carried forward to next year
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        className="form-input w-24"
                        value={configForm.carry_forward_max ?? 0}
                        onChange={e => cf({ carry_forward_max: e.target.value })}
                      />
                      <span className="text-xs text-gray-500">days</span>
                      {(parseFloat(configForm.carry_forward_max) || 0) === 0 && (
                        <span className="text-xs text-blue-600 font-medium">(no limit)</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Set to 0 to allow unlimited carry forward</p>
                  </div>
                </div>
              </FormSection>
            )}

            {/* Section 3: Other Rules */}
            <FormSection title="Other Rules">
              <div className="px-1 space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Minimum service days before applying this leave
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      className="form-input w-24"
                      value={configForm.min_service_days ?? 0}
                      onChange={e => cf({ min_service_days: e.target.value })}
                    />
                    <span className="text-xs text-gray-500">days</span>
                    {(parseInt(configForm.min_service_days) || 0) === 0
                      ? <span className="text-xs text-gray-400">(no restriction)</span>
                      : <span className="text-xs text-amber-600">e.g. during probation block</span>
                    }
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Useful for blocking new joiners from applying during probation period
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Allow Encashment</p>
                    <p className="text-xs text-gray-500 mt-0.5">Unused leaves can be encashed</p>
                  </div>
                  <Toggle
                    checked={!!configForm.encashment_allowed}
                    onChange={v => cf({ encashment_allowed: v })}
                  />
                </div>
              </div>
            </FormSection>
          </>
        )}
      </Modal>
    </>
  );
}
