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

const TYPE_COLORS = [
  { bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-100 dark:border-blue-800',   icon: 'bg-blue-500',   text: 'text-blue-700 dark:text-blue-300' },
  { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-100 dark:border-green-800', icon: 'bg-green-500',  text: 'text-green-700 dark:text-green-300' },
  { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-800', icon: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300' },
  { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800', icon: 'bg-amber-500',  text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-rose-50 dark:bg-rose-900/20',   border: 'border-rose-100 dark:border-rose-800',   icon: 'bg-rose-500',   text: 'text-rose-700 dark:text-rose-300' },
  { bg: 'bg-cyan-50 dark:bg-cyan-900/20',   border: 'border-cyan-100 dark:border-cyan-800',   icon: 'bg-cyan-500',   text: 'text-cyan-700 dark:text-cyan-300' },
];

export default function LeaveTypes({ toast }) {
  const [rows,   setRows]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,  setModal]  = useState(null);
  const [form,   setForm]   = useState({});

  const [configModal,   setConfigModal]   = useState(null);
  const [configForm,    setConfigForm]    = useState({});
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving,  setConfigSaving]  = useState(false);

  const f  = v => setForm(prev => ({ ...prev, ...v }));
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
        prorate_on_joining:    policy.prorate_on_joining    ?? false,
        prorate_cutoff_day:    policy.prorate_cutoff_day    ?? 15,
        leaves_before_cutoff:  policy.leaves_before_cutoff  ?? 2,
        leaves_after_cutoff:   policy.leaves_after_cutoff   ?? 1,
        carry_forward_max:     policy.carry_forward_max     ?? 0,
        cf_joined_h1:          policy.cf_joined_h1          ?? 0,
        cf_joined_h2:          policy.cf_joined_h2          ?? 0,
        encashment_allowed:    policy.encashment_allowed    ?? false,
        min_service_days:      policy.min_service_days      ?? 0,
      });
    } catch (e) { toast(e.message, 'error'); }
    finally { setConfigLoading(false); }
  };

  const saveConfig = async () => {
    setConfigSaving(true);
    try {
      await api('PUT', `/api/leaves/types/${configModal.lt.id}/policy`, {
        prorate_on_joining:   configForm.prorate_on_joining   ?? false,
        prorate_cutoff_day:   parseInt(configForm.prorate_cutoff_day) || 15,
        leaves_before_cutoff: parseFloat(configForm.leaves_before_cutoff) || 2,
        leaves_after_cutoff:  parseFloat(configForm.leaves_after_cutoff) || 1,
        carry_forward_max:    parseFloat(configForm.carry_forward_max) || 0,
        cf_joined_h1:         parseFloat(configForm.cf_joined_h1) || 0,
        cf_joined_h2:         parseFloat(configForm.cf_joined_h2) || 0,
        encashment_allowed:   configForm.encashment_allowed ?? false,
        min_service_days:     parseInt(configForm.min_service_days) || 0,
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
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse space-y-3">
                <div className="flex gap-3"><div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800" /><div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded mt-2" /></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="text-sm text-gray-500">No leave types configured</p>
              <p className="text-xs text-gray-400 mt-1">Add leave types before employees can apply for leaves</p>
              <button onClick={openAdd} className="btn btn-primary btn-sm mt-3 gap-1.5">
                <Plus size={13} /> Add First Leave Type
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((lt, i) => {
              const theme = TYPE_COLORS[i % TYPE_COLORS.length];
              const initials = lt.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={lt.id} className={`card p-5 border ${theme.border} ${theme.bg} group hover:shadow-md transition-shadow`}>
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${theme.icon} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${theme.text} truncate`}>{lt.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{lt.max_leaves} days / year</p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {lt.is_paid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        <CheckCircle size={10} /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                        <XCircle size={10} /> Unpaid
                      </span>
                    )}
                    {lt.is_carry_forward && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        <CheckCircle size={10} /> Carry Forward
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-3 border-t border-black/5 dark:border-white/5">
                    <button
                      onClick={() => openEdit(lt)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 hover:text-[var(--accent)] hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-lg transition-colors"
                    >
                      <Pencil size={11} /> Edit
                    </button>
                    <button
                      onClick={() => openConfig(lt)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-lg transition-colors"
                    >
                      <Settings2 size={11} /> Configure
                    </button>
                    <button
                      onClick={() => del(lt.id, lt.name)}
                      className="flex items-center justify-center w-7 h-7 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add card */}
            <button
              onClick={openAdd}
              className="card p-5 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[var(--accent)] min-h-[140px]"
            >
              <Plus size={20} />
              <span className="text-xs font-medium">Add Leave Type</span>
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
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
              type="number" min={0} step={0.5}
              className="form-input"
              placeholder="e.g. 12"
              value={form.max_leaves ?? 12}
              onChange={e => f({ max_leaves: e.target.value })}
            />
          </Field>
          <Field label="Options">
            <div className="flex flex-col gap-2 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300"
                  checked={form.is_paid !== false}
                  onChange={e => f({ is_paid: e.target.checked })} />
                Paid Leave
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300"
                  checked={!!form.is_carry_forward}
                  onChange={e => f({ is_carry_forward: e.target.checked })} />
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
            <FormSection title="Joining Month Accrual">
              <div className="px-1 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Pro-rata on Joining Date</p>
                    <p className="text-xs text-gray-500 mt-0.5">Calculate leave credit based on joining date in the month.</p>
                  </div>
                  <Toggle checked={!!configForm.prorate_on_joining} onChange={v => cf({ prorate_on_joining: v })} />
                </div>
                {configForm.prorate_on_joining && (
                  <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Cutoff Day</label>
                        <div className="flex items-center gap-1.5">
                          <input type="number" min={1} max={28} className="form-input w-20 text-center"
                            value={configForm.prorate_cutoff_day ?? 15}
                            onChange={e => cf({ prorate_cutoff_day: e.target.value })} />
                          <span className="text-xs text-gray-500">of month</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">On/before {cutoff}<sup>th</sup></label>
                        <div className="flex items-center gap-1.5">
                          <input type="number" min={0} max={31} step={0.5} className="form-input w-20 text-center"
                            value={configForm.leaves_before_cutoff ?? 2}
                            onChange={e => cf({ leaves_before_cutoff: e.target.value })} />
                          <span className="text-xs text-gray-500">days</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">After {cutoff}<sup>th</sup></label>
                        <div className="flex items-center gap-1.5">
                          <input type="number" min={0} max={31} step={0.5} className="form-input w-20 text-center"
                            value={configForm.leaves_after_cutoff ?? 1}
                            onChange={e => cf({ leaves_after_cutoff: e.target.value })} />
                          <span className="text-xs text-gray-500">days</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg bg-white dark:bg-gray-800 border border-violet-100 dark:border-violet-800 px-3 py-2.5">
                      <Info size={13} className="text-violet-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        Joining 1st–{cutoff}th → <strong>{configForm.leaves_before_cutoff ?? 2}</strong> leave{(configForm.leaves_before_cutoff ?? 2) !== 1 ? 's' : ''} credited.
                        {' '}Joining {cutoff + 1}th+ → <strong>{configForm.leaves_after_cutoff ?? 1}</strong> leave{(configForm.leaves_after_cutoff ?? 1) !== 1 ? 's' : ''} credited.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            {lt?.is_carry_forward && (
              <FormSection title="Carry Forward Rules">
                <div className="px-1 space-y-4">
                  {/* Joining-half-year based carry forward */}
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 space-y-3">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Based on Joining Half-Year</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5 font-medium">Joined Jan – Jun</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min={0} step={0.5} className="form-input w-20 text-center"
                            value={configForm.cf_joined_h1 ?? 0}
                            onChange={e => cf({ cf_joined_h1: e.target.value })} />
                          <span className="text-xs text-gray-500">days</span>
                        </div>
                        {(parseFloat(configForm.cf_joined_h1) || 0) === 0 && (
                          <p className="text-[11px] text-blue-500 mt-0.5">no limit</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5 font-medium">Joined Jul – Dec</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min={0} step={0.5} className="form-input w-20 text-center"
                            value={configForm.cf_joined_h2 ?? 0}
                            onChange={e => cf({ cf_joined_h2: e.target.value })} />
                          <span className="text-xs text-gray-500">days</span>
                        </div>
                        {(parseFloat(configForm.cf_joined_h2) || 0) === 0 && (
                          <p className="text-[11px] text-blue-500 mt-0.5">no limit</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-800 px-3 py-2">
                      <Info size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Set 0 for no limit. At year-end, unused leave is capped at this value before carrying forward based on the employee's joining month.
                      </p>
                    </div>
                  </div>

                  {/* Legacy overall cap */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Overall cap (overrides above if set)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} step={0.5} className="form-input w-24"
                        value={configForm.carry_forward_max ?? 0}
                        onChange={e => cf({ carry_forward_max: e.target.value })} />
                      <span className="text-xs text-gray-500">days</span>
                      {(parseFloat(configForm.carry_forward_max) || 0) === 0 && (
                        <span className="text-xs text-gray-400">(not used)</span>
                      )}
                    </div>
                  </div>
                </div>
              </FormSection>
            )}

            <FormSection title="Other Rules">
              <div className="px-1 space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Minimum service days before applying</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} className="form-input w-24"
                      value={configForm.min_service_days ?? 0}
                      onChange={e => cf({ min_service_days: e.target.value })} />
                    <span className="text-xs text-gray-500">days</span>
                    {(parseInt(configForm.min_service_days) || 0) === 0
                      ? <span className="text-xs text-gray-400">(no restriction)</span>
                      : <span className="text-xs text-amber-600">blocks new joiners during probation</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Allow Encashment</p>
                    <p className="text-xs text-gray-500 mt-0.5">Unused leaves can be encashed</p>
                  </div>
                  <Toggle checked={!!configForm.encashment_allowed} onChange={v => cf({ encashment_allowed: v })} />
                </div>
              </div>
            </FormSection>
          </>
        )}
      </Modal>
    </>
  );
}
