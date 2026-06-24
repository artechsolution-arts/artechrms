import { useState, useEffect } from 'react';
import { api } from '../../api';
import { fmtDate } from '../../utils/date';
import { FileText, AlertTriangle, CheckCircle2, XCircle, Clock, Undo2 } from 'lucide-react';
import DatePicker from '../../components/DatePicker';

const STATUS_CONFIG = {
  Pending:   { icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-200 dark:border-amber-800',  label: 'Pending Review' },
  Approved:  { icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-800',  label: 'Approved' },
  Rejected:  { icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-900/20',      border: 'border-red-200 dark:border-red-800',      label: 'Rejected' },
  Withdrawn: { icon: Undo2,         color: 'text-gray-500',   bg: 'bg-gray-50 dark:bg-gray-800',       border: 'border-gray-200 dark:border-gray-700',    label: 'Withdrawn' },
};

export default function EmpResignation({ toast }) {
  const [existing,    setExisting]    = useState(undefined); // undefined=loading, null=none
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState({ reason: '', last_working_date: '', notice_period_days: 0 });
  const [submitting,  setSubmitting]  = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirm,     setConfirm]     = useState(false);
  const [empType,     setEmpType]     = useState('');
  const [noticeDays,  setNoticeDays]  = useState(0);

  const load = () => {
    setLoading(true);
    Promise.all([
      api('GET', '/api/portal/resignation'),
      api('GET', '/api/portal/profile'),
      api('GET', '/api/portal/notice-period-rules'),
    ])
      .then(([resignation, profile, rules]) => {
        setExisting(resignation);
        const et = profile.employment_type || '';
        setEmpType(et);
        const days = rules[et] ?? rules['Part-time'] ?? 15;
        setNoticeDays(days);
        setForm(p => ({ ...p, notice_period_days: days }));
      })
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const f = v => setForm(p => ({ ...p, ...v }));

  const submit = async () => {
    if (!form.reason.trim()) return toast('Please provide a reason for resignation', 'warning');
    setSubmitting(true);
    try {
      await api('POST', '/api/portal/resignation', {
        reason: form.reason.trim(),
        last_working_date: form.last_working_date || null,
        notice_period_days: form.notice_period_days ? parseInt(form.notice_period_days) : null,
      });
      toast('Resignation submitted. HR will review and respond.', 'success');
      setShowForm(false);
      setForm({ reason: '', last_working_date: '', notice_period_days: noticeDays });
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const withdraw = async () => {
    setWithdrawing(true);
    try {
      await api('DELETE', `/api/portal/resignation/${existing.id}`);
      toast('Resignation withdrawn successfully', 'success');
      setConfirm(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setWithdrawing(false); }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  }

  const hasPending = existing && existing.status === 'Pending';
  const hasActive  = existing && existing.status !== 'Withdrawn';

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Resignation</h1>
          <p className="text-xs text-gray-500 mt-0.5">Submit or track your resignation request</p>
        </div>

        {/* Warning banner */}
        {!hasActive && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Before you proceed</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                Submitting a resignation is a formal request. HR will review and respond. You can withdraw it while it's still pending.
              </p>
            </div>
          </div>
        )}

        {/* Existing resignation status */}
        {hasActive && (() => {
          const cfg = STATUS_CONFIG[existing.status] || STATUS_CONFIG.Pending;
          const Icon = cfg.icon;
          return (
            <div className={`card p-5 border ${cfg.border} ${cfg.bg}`}>
              <div className="flex items-start gap-3">
                <Icon size={20} className={`${cfg.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Submitted on {fmtDate(existing.created_at)}</p>

                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">Your reason</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{existing.reason}</p>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                      {existing.last_working_date && (
                        <span className="text-gray-500">
                          <span className="text-gray-400">Requested LWD:</span> <span className="font-medium">{existing.last_working_date}</span>
                        </span>
                      )}
                      {existing.notice_period_days && (
                        <span className="text-gray-500">
                          <span className="text-gray-400">Notice period:</span> <span className="font-medium">{existing.notice_period_days} days</span>
                        </span>
                      )}
                    </div>

                    {existing.approved_last_working_date && existing.status === 'Approved' && (
                      <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" />
                        <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                          Confirmed Last Working Date: {existing.approved_last_working_date}
                        </span>
                      </div>
                    )}

                    {existing.hr_remarks && (
                      <div className="mt-1 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-400 font-medium mb-0.5">HR Remarks</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{existing.hr_remarks}</p>
                        {existing.actioned_at && <p className="text-xs text-gray-400 mt-1">Actioned on {existing.actioned_at}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Withdraw button — only for pending */}
              {hasPending && (
                <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-800">
                  {!confirm ? (
                    <button
                      onClick={() => setConfirm(true)}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Undo2 size={12} /> Withdraw resignation
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Are you sure you want to withdraw?</p>
                      <button onClick={withdraw} disabled={withdrawing}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors">
                        {withdrawing ? 'Withdrawing…' : 'Yes, withdraw'}
                      </button>
                      <button onClick={() => setConfirm(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Submit form — shown when no active resignation, or last was rejected/withdrawn */}
        {(!existing || existing.status === 'Rejected' || existing.status === 'Withdrawn') && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-500 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            <FileText size={15} /> Submit Resignation
          </button>
        )}

        {showForm && (
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Resignation Details</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Reason for Resignation <span className="text-red-400">*</span>
              </label>
              <textarea
                className="form-textarea w-full resize-none"
                rows={4}
                placeholder="Please share your reason for resigning…"
                value={form.reason}
                onChange={e => f({ reason: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Preferred Last Working Date
                </label>
                <DatePicker
                  className="form-input w-full"
                  value={form.last_working_date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={v => f({ last_working_date: v })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Notice Period
                </label>
                <div className="form-input w-full bg-gray-50 dark:bg-gray-800 cursor-default select-none flex items-center justify-between">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{noticeDays} days</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {empType === 'Full-time' ? 'Full-time policy' : 'Standard policy'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={submit}
                disabled={submitting || !form.reason.trim()}
                className="btn btn-primary flex-1 gap-1.5"
              >
                <FileText size={13} />
                {submitting ? 'Submitting…' : 'Submit Resignation'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary px-4">
                Cancel
              </button>
            </div>
          </div>
        )}

        {(!hasActive && !showForm) && (
          <p className="text-center text-xs text-gray-400">
            Your resignation will be reviewed by HR. You will be notified of the decision.
          </p>
        )}
      </div>
    </div>
  );
}
