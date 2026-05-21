import { useState, useEffect } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import DatePicker from '../components/DatePicker';
import EmpAvatar from '../components/EmpAvatar';
import { FileText, CheckCircle2, XCircle, Clock, RefreshCw, ChevronDown, Settings2, Save } from 'lucide-react';

const EMP_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'];

function NoticePeriodSettings({ toast }) {
  const [open,    setOpen]    = useState(false);
  const [rules,   setRules]   = useState(null);
  const [draft,   setDraft]   = useState(null);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    api('GET', '/api/hr/notice-period-config')
      .then(d => { setRules(d.rules); setDraft({ ...d.rules }); })
      .catch(() => {});
  }, []);

  const isDirty = rules && draft && JSON.stringify(rules) !== JSON.stringify(draft);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api('PUT', '/api/hr/notice-period-config', { rules: draft });
      setRules(res.rules);
      setDraft({ ...res.rules });
      toast('Notice period policy saved', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  if (!rules) return null;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings2 size={14} className="text-gray-400" />
          <span>Notice Period Policy</span>
          <span className="text-xs text-gray-400 font-normal">— configure days by employment type</span>
        </div>
        <ChevronDown size={13} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {EMP_TYPES.map(et => (
              <div key={et}>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{et}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={draft?.[et] ?? ''}
                    onChange={e => setDraft(p => ({ ...p, [et]: e.target.value === '' ? '' : parseInt(e.target.value) || 1 }))}
                    className="form-input w-full text-sm"
                    placeholder="days"
                  />
                  <span className="text-xs text-gray-400 flex-shrink-0">days</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={save}
              disabled={saving || !isDirty}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                ${isDirty ? 'bg-[var(--accent)] text-white hover:opacity-90' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'}`}
            >
              <Save size={12} /> {saving ? 'Saving…' : 'Save Policy'}
            </button>
            {isDirty && (
              <button
                onClick={() => setDraft({ ...rules })}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Discard
              </button>
            )}
            <p className="text-xs text-gray-400 ml-auto">Changes apply to new resignations only</p>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Withdrawn'];

const STATUS_COLOR = {
  Pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  Approved:  'bg-green-50 text-green-700 border border-green-200',
  Rejected:  'bg-red-50 text-red-700 border border-red-200',
  Withdrawn: 'bg-gray-100 text-gray-500 border border-gray-200',
};

function tenure(doj) {
  if (!doj) return null;
  const diff = Math.floor((Date.now() - new Date(doj)) / (1000 * 60 * 60 * 24 * 30));
  if (diff < 1) return '< 1 month';
  if (diff < 12) return `${diff} months`;
  const yrs = Math.floor(diff / 12); const mos = diff % 12;
  return mos ? `${yrs}y ${mos}m` : `${yrs} year${yrs > 1 ? 's' : ''}`;
}

export default function Resignations({ toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('All');
  const [actionModal, setActionModal] = useState(null); // { row, mode: 'approve'|'reject' }
  const [actionForm, setActionForm] = useState({ hr_remarks: '', approved_last_working_date: '' });
  const [actioning, setActioning] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('GET', '/api/resignations');
      setRows(data);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = statusTab === 'All' ? rows : rows.filter(r => r.status === statusTab);

  const openAction = (row, mode) => {
    setActionForm({ hr_remarks: '', approved_last_working_date: row.last_working_date || '' });
    setActionModal({ row, mode });
  };

  const submitAction = async () => {
    setActioning(true);
    try {
      const { row, mode } = actionModal;
      await api('PUT', `/api/resignations/${row.id}/${mode}`, {
        hr_remarks: actionForm.hr_remarks || null,
        approved_last_working_date: actionForm.approved_last_working_date || null,
      });
      toast(`Resignation ${mode === 'approve' ? 'approved' : 'rejected'}`, 'success');
      setActionModal(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setActioning(false); }
  };

  const pendingCount = rows.filter(r => r.status === 'Pending').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Resignations</h1>
          {pendingCount > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
              {pendingCount} pending action{pendingCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button onClick={load} className="btn btn-secondary btn-sm gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-content space-y-4">
        {/* Notice period policy settings */}
        <NoticePeriodSettings toast={toast} />

        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map(s => {
            const count = s === 'All' ? rows.length : rows.filter(r => r.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatusTab(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5
                  ${statusTab === s
                    ? 'text-white'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}
                style={statusTab === s ? { backgroundColor: 'var(--accent)' } : {}}
              >
                {s}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                    ${statusTab === s ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="card p-10 text-center text-gray-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="card p-10 text-center">
              <FileText size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">No resignations found</p>
            </div>
          ) : filtered.map(r => (
            <div key={r.id} className="card overflow-hidden">
              {/* Header row */}
              <div className="flex items-start gap-4 p-4">
                {/* Avatar */}
                <EmpAvatar name={r.employee_name} photo={r.profile_photo} size="md" colorIndex={r.id} rounded="rounded-full" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.employee_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.designation}{r.department ? ` · ${r.department}` : ''}
                        {r.date_of_joining && <span className="text-gray-400 ml-2">({tenure(r.date_of_joining)} tenure)</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status] || ''}`}>
                        {r.status}
                      </span>
                      <span className="text-xs text-gray-400">{r.created_at}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {r.last_working_date && (
                      <span className="text-xs text-gray-500">
                        <span className="text-gray-400">Requested LWD:</span> <span className="font-medium">{r.last_working_date}</span>
                      </span>
                    )}
                    {r.approved_last_working_date && r.status === 'Approved' && (
                      <span className="text-xs text-green-600">
                        <span className="text-gray-400">Confirmed LWD:</span> <span className="font-medium">{r.approved_last_working_date}</span>
                      </span>
                    )}
                    {r.notice_period_days && (
                      <span className="text-xs text-gray-500">
                        <span className="text-gray-400">Notice:</span> <span className="font-medium">{r.notice_period_days} days</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable reason + action */}
              <div className="border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className="font-medium">Reason & Details</span>
                  <ChevronDown size={13} className={`transition-transform ${expanded === r.id ? 'rotate-180' : ''}`} />
                </button>

                {expanded === r.id && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Reason</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{r.reason}</p>
                    </div>

                    {r.hr_remarks && (
                      <div className={`rounded-lg p-3 ${r.status === 'Approved' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <p className="text-xs text-gray-500 mb-1 font-medium">HR Remarks</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{r.hr_remarks}</p>
                        {r.actioned_by && <p className="text-xs text-gray-400 mt-1">— {r.actioned_by} on {r.actioned_at}</p>}
                      </div>
                    )}

                    {r.status === 'Pending' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => openAction(r, 'approve')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button
                          onClick={() => openAction(r, 'reject')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approve / Reject modal */}
      {actionModal && (
        <Modal
          open
          title={actionModal.mode === 'approve' ? 'Approve Resignation' : 'Reject Resignation'}
          onClose={() => setActionModal(null)}
          onSave={submitAction}
          saving={actioning}
          saveLabel={actionModal.mode === 'approve' ? 'Approve' : 'Reject'}
          saveDanger={actionModal.mode === 'reject'}
        >
          <FormSection title={`${actionModal.row.employee_name}'s Resignation`}>
            <FormGrid>
              {actionModal.mode === 'approve' && (
                <Field label="Confirmed Last Working Date" full>
                  <DatePicker
                    value={actionForm.approved_last_working_date}
                    onChange={v => setActionForm(p => ({ ...p, approved_last_working_date: v }))}
                    placeholder="Confirm last working date"
                  />
                </Field>
              )}
              <Field label={actionModal.mode === 'approve' ? 'Remarks (optional)' : 'Reason for rejection'} full>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder={actionModal.mode === 'approve' ? 'Any remarks for the employee…' : 'Explain why the resignation is being rejected…'}
                  value={actionForm.hr_remarks}
                  onChange={e => setActionForm(p => ({ ...p, hr_remarks: e.target.value }))}
                />
              </Field>
            </FormGrid>
          </FormSection>
        </Modal>
      )}
    </>
  );
}
