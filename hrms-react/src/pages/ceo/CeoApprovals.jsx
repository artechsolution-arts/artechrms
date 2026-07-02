import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import Badge from '../../components/Badge';
import DatePicker from '../../components/DatePicker';
import Modal from '../../components/Modal';
import {
  CheckCircle, XCircle, IndianRupee,
  Calendar, UserMinus, RefreshCw,
} from 'lucide-react';

// ── Salary helpers ─────────────────────────────────────────────────────────────

const SALARY_LABELS = {
  basic_salary:      'Basic Salary',
  hra_percent:       'HRA %',
  special_allowance: 'Special Allowance',
  lta:               'LTA',
  other_allowance:   'Other Allowance',
  ca_allowance:      'CA Allowance',
};

function fmtSalary(key, val) {
  if (val === null || val === undefined) return '—';
  if (key === 'hra_percent') return `${val}%`;
  const n = Number(val);
  if (isNaN(n)) return String(val);
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// ── Type config ────────────────────────────────────────────────────────────────

const TYPES = {
  salary: {
    key:     'salary',
    label:   'Salary Changes',
    Icon:    IndianRupee,
    iconCls: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    tagCls:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    cardActive: 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
    barCls:  'bg-indigo-500',
  },
  leave: {
    key:     'leave',
    label:   'Leave Requests',
    Icon:    Calendar,
    iconCls: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    tagCls:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    cardActive: 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20',
    barCls:  'bg-green-500',
  },
  resignation: {
    key:     'resignation',
    label:   'Resignations',
    Icon:    UserMinus,
    iconCls: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    tagCls:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    cardActive: 'border-orange-400 dark:border-orange-500 bg-orange-50 dark:bg-orange-900/20',
    barCls:  'bg-orange-500',
  },
};

// ── Shared primitives ──────────────────────────────────────────────────────────

function InfoBlock({ label, value, highlight }) {
  return (
    <div className={`rounded-lg px-3 py-2 border ${highlight
      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'}`}>
      <div className="text-[10px] font-bold uppercase tracking-wide mb-0.5 text-gray-400">{label}</div>
      <div className={`text-sm font-semibold ${highlight ? 'text-amber-800 dark:text-amber-300' : 'text-gray-900 dark:text-gray-100'}`}>{value}</div>
    </div>
  );
}

// ── Summary filter cards ───────────────────────────────────────────────────────

function SummaryCards({ counts, active, onSelect }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.values(TYPES).map(t => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onSelect(isActive ? null : t.key)}
            className={`card text-left p-4 transition-all border-2 hover:shadow-md ${
              isActive ? t.cardActive : 'border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.iconCls}`}>
                <t.Icon size={18} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-none">
                  {counts[t.key] ?? 0}
                </div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{t.label}</div>
              </div>
            </div>
            {isActive && (
              <div className={`mt-3 h-0.5 rounded-full ${t.barCls}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Salary detail modal (pending) ──────────────────────────────────────────────

function SalaryDetailModal({ item, onClose, onAction, acting }) {
  const [remarks,    setRemarks]    = useState('');
  const [employee,   setEmployee]   = useState(null);
  const [loadingEmp, setLoadingEmp] = useState(true);
  const [localAct,   setLocalAct]   = useState(null);

  const ctx        = item.context || {};
  const rawPayload = item.payload || {};
  // Payload may be {new:{...}, old:{...}} or legacy flat dict
  const newPayload = rawPayload.new || rawPayload;
  const oldPayload = rawPayload.old || {};
  const fields     = Object.entries(newPayload).filter(([k]) => SALARY_LABELS[k]);

  useEffect(() => {
    api('GET', `/api/employees/${item.entity_id}`)
      .then(setEmployee).catch(() => {}).finally(() => setLoadingEmp(false));
  }, [item.entity_id]);

  async function handle(action) {
    setLocalAct(action);
    try { await onAction(action, { remarks }); }
    finally { setLocalAct(null); }
  }

  return (
    <Modal open title={`Salary Change — ${ctx.employee_name || `Employee #${item.entity_id}`}`} onClose={onClose} hideSave wide>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <InfoBlock label="Employee"      value={ctx.employee_name || `#${item.entity_id}`} />
          <InfoBlock label="Employee Code" value={ctx.employee_code || '—'} />
          <InfoBlock label="Requested On"  value={item.created_at?.slice(0, 10) || '—'} />
        </div>

        {fields.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Proposed Changes</p>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th className="text-right">Current Value</th>
                    <th className="text-center w-6"></th>
                    <th className="text-right">Proposed Value</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map(([key, newVal]) => {
                    // Prefer snapshot old value; fall back to live employee data
                    const oldVal = oldPayload[key] != null ? oldPayload[key] : employee?.[key];
                    return (
                      <tr key={key}>
                        <td className="font-medium">{SALARY_LABELS[key]}</td>
                        <td className="text-right text-gray-500 dark:text-gray-400">
                          {oldPayload[key] != null
                            ? fmtSalary(key, oldPayload[key])
                            : loadingEmp ? <span className="text-gray-300 text-xs">loading…</span>
                            : oldVal != null ? fmtSalary(key, oldVal) : '—'}
                        </td>
                        <td className="text-center text-gray-300">→</td>
                        <td className="text-right">
                          <span className="inline-block bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-semibold px-2 py-0.5 rounded border border-green-200 dark:border-green-800">
                            {fmtSalary(key, newVal)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Remarks <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
            placeholder="Add a note…" rows={2} className="form-input resize-y" />
        </div>

        <div className="flex gap-3">
          <button onClick={() => handle('approve')} disabled={!!localAct || acting}
            className="btn btn-approve flex-1 justify-center gap-2">
            <CheckCircle size={14} />{localAct === 'approve' ? 'Approving…' : 'Approve'}
          </button>
          <button onClick={() => handle('reject')} disabled={!!localAct || acting}
            className="btn btn-reject flex-1 justify-center gap-2">
            <XCircle size={14} />{localAct === 'reject' ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── History detail modal ───────────────────────────────────────────────────────

function HistoryDetailModal({ item, type, onClose }) {
  if (!item) return null;

  if (type === 'salary') {
    const empName    = item.context?.employee_name || `Employee #${item.entity_id}`;
    const rawPay     = item.payload || {};
    const newPay     = rawPay.new || rawPay;
    const oldPay     = rawPay.old || {};
    const hasOldNew  = Object.keys(oldPay).length > 0;
    const fields     = Object.entries(newPay).filter(([k]) => SALARY_LABELS[k]);
    return (
      <Modal open title={`Salary Change #${item.id} — ${empName}`} onClose={onClose} hideSave wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoBlock label="Employee"     value={empName} />
            <InfoBlock label="Status"       value={<Badge text={cap(item.status)} />} />
            <InfoBlock label="Submitted"    value={item.created_at?.slice(0, 16)?.replace('T', ' ') || '—'} />
            <InfoBlock label="Last Updated" value={item.updated_at?.slice(0, 16)?.replace('T', ' ') || '—'} />
          </div>
          {fields.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Salary Changes</p>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      {hasOldNew && <th className="text-right">Old Value</th>}
                      {hasOldNew && <th className="text-center w-6"></th>}
                      <th className="text-right">New Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map(([key, newVal]) => (
                      <tr key={key}>
                        <td className="font-medium">{SALARY_LABELS[key]}</td>
                        {hasOldNew && (
                          <td className="text-right text-gray-500 dark:text-gray-400">
                            {oldPay[key] != null ? fmtSalary(key, oldPay[key]) : '—'}
                          </td>
                        )}
                        {hasOldNew && <td className="text-center text-gray-300">→</td>}
                        <td className="text-right">
                          <span className="inline-block bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-semibold px-2 py-0.5 rounded border border-green-200 dark:border-green-800">
                            {fmtSalary(key, newVal)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {item.remarks && <InfoBlock label="Remarks" value={item.remarks} />}
          {item.steps?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Approval Trail</p>
              <div className="space-y-2">
                {item.steps.map((step, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <Badge text={cap(step.status)} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Level {step.level} · {step.approver_role}</span>
                    {step.remarks && <span className="text-xs text-gray-500 italic">"{step.remarks}"</span>}
                    {step.actioned_at && <span className="text-xs text-gray-400 ml-auto">{step.actioned_at.slice(0, 16).replace('T', ' ')}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  if (type === 'leave') {
    return (
      <Modal open title={`Leave Request — ${item.employee_name || '—'}`} onClose={onClose} hideSave>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InfoBlock label="Employee"   value={item.employee_name || '—'} />
            <InfoBlock label="Status"     value={<Badge text={item.status} />} />
            <InfoBlock label="Leave Type" value={item.leave_type} />
            <InfoBlock label="Days"       value={`${item.total_days}d${item.half_day ? ' (half)' : ''}`} />
            <InfoBlock label="From"       value={item.from_date} />
            <InfoBlock label="To"         value={item.to_date} />
            {item.leave_category && <InfoBlock label="Category" value={item.leave_category} />}
            {item.created_at     && <InfoBlock label="Applied On" value={item.created_at?.slice(0, 16)?.replace('T', ' ')} />}
          </div>
          {item.reason && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Reason</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">{item.reason}</div>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  if (type === 'resignation') {
    return (
      <Modal open title={`Resignation — ${item.employee_name || '—'}`} onClose={onClose} hideSave>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InfoBlock label="Employee"    value={item.employee_name || '—'} />
            <InfoBlock label="Status"      value={<Badge text={item.status} />} />
            {item.department  && <InfoBlock label="Department"  value={item.department} />}
            {item.designation && <InfoBlock label="Designation" value={item.designation} />}
            <InfoBlock label="Requested LWD" value={item.last_working_date || '—'} />
            <InfoBlock label="Approved LWD"  value={item.approved_last_working_date || '—'} />
            {item.notice_period_days != null && <InfoBlock label="Notice Period" value={`${item.notice_period_days} days`} />}
            {item.created_at && <InfoBlock label="Submitted" value={item.created_at?.slice(0, 16)?.replace('T', ' ')} />}
          </div>
          {item.reason && (
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg px-4 py-3">
              <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wide mb-1">Reason</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">{item.reason}</div>
            </div>
          )}
          {item.hr_remarks && <InfoBlock label="HR Remarks" value={item.hr_remarks} />}
        </div>
      </Modal>
    );
  }
  return null;
}

// ── Pending item cards ─────────────────────────────────────────────────────────

function SalaryCard({ item, onAction, acting }) {
  const [open, setOpen] = useState(false);
  const ctx = item.context || {};
  const t   = TYPES.salary;
  return (
    <>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.iconCls}`}>
              <t.Icon size={17} />
            </div>
            <div className="min-w-0">
              <button onClick={() => setOpen(true)}
                className="text-sm font-bold text-left hover:underline truncate block"
                style={{ color: 'var(--accent)' }}>
                {ctx.employee_name || `Employee #${item.entity_id}`}
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {ctx.employee_code && <span className="mr-2 font-medium">{ctx.employee_code}</span>}
                Salary Change · #{item.approval_request_id}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${t.tagCls}`}>{t.label.slice(0, -1)}</span>
            <Badge text="Pending" />
            {item.created_at && <span className="hidden sm:block text-[11px] text-gray-400">{item.created_at.slice(0, 10)}</span>}
            <button onClick={() => setOpen(true)} className="btn btn-secondary btn-xs">View</button>
          </div>
        </div>
      </div>
      {open && (
        <SalaryDetailModal item={item} acting={acting} onClose={() => setOpen(false)}
          onAction={async (action, body) => {
            await onAction('salary', item.approval_request_id, action, body);
            setOpen(false);
          }} />
      )}
    </>
  );
}

// ── Leave detail modal (pending) ──────────────────────────────────────────────

function LeaveDetailModal({ item, onClose, onAction, acting }) {
  const [localAct, setLocalAct] = useState(null);
  const isHR = item.requester_role === 'HR';
  const days = item.total_days;

  async function handle(action) {
    setLocalAct(action);
    try { await onAction(action); }
    finally { setLocalAct(null); }
  }

  return (
    <Modal open title={`Leave Request — ${item.employee_name || '—'}`} onClose={onClose} hideSave>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InfoBlock label="Employee"   value={item.employee_name || '—'} />
          <InfoBlock label="Leave Type" value={item.leave_type} />
          <InfoBlock label="From"       value={item.from_date} />
          <InfoBlock label="To"         value={item.to_date} />
          <InfoBlock label="Duration"   value={`${days} day${days !== 1 ? 's' : ''}${item.half_day ? ' (half day)' : ''}`} />
          {item.leave_category && <InfoBlock label="Category" value={item.leave_category} />}
          {isHR && <InfoBlock label="Requested by" value="HR Staff" highlight />}
        </div>
        {item.reason && (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-3">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Reason</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">{item.reason}</div>
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <button onClick={() => handle('approve')} disabled={!!localAct || acting}
            className="btn btn-approve flex-1 justify-center gap-2">
            <CheckCircle size={14} />{localAct === 'approve' ? 'Approving…' : 'Approve'}
          </button>
          <button onClick={() => handle('reject')} disabled={!!localAct || acting}
            className="btn btn-reject flex-1 justify-center gap-2">
            <XCircle size={14} />{localAct === 'reject' ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Resignation detail modal (pending) ────────────────────────────────────────

function ResignationDetailModal({ item, onClose, onAction, acting }) {
  const [remarks,     setRemarks]     = useState('');
  const [approvedLwd, setApprovedLwd] = useState(item.last_working_date || '');
  const [localAct,    setLocalAct]    = useState(null);

  async function handle(action) {
    setLocalAct(action);
    try {
      await onAction(action,
        action === 'approve'
          ? { hr_remarks: remarks, approved_last_working_date: approvedLwd || item.last_working_date }
          : { hr_remarks: remarks });
    } finally { setLocalAct(null); }
  }

  return (
    <Modal open title={`Resignation — ${item.employee_name || '—'}`} onClose={onClose} hideSave>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InfoBlock label="Employee"    value={item.employee_name || '—'} />
          {item.employee_code && <InfoBlock label="Employee Code" value={item.employee_code} />}
          {item.department    && <InfoBlock label="Department"    value={item.department} />}
          {item.designation   && <InfoBlock label="Designation"   value={item.designation} />}
          {item.date_of_joining && <InfoBlock label="Date of Joining" value={item.date_of_joining} />}
          <InfoBlock label="Requested LWD" value={item.last_working_date || '—'} />
          {item.notice_period_days != null && <InfoBlock label="Notice Period" value={`${item.notice_period_days} days`} />}
        </div>
        {item.reason && (
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg px-4 py-3">
            <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wide mb-1">Reason for Resignation</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">{item.reason}</div>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Approved Last Working Day</label>
          <DatePicker value={approvedLwd} onChange={setApprovedLwd} placeholder="Select approved last working day" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Remarks <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
            placeholder="Add a note for the employee…" rows={2} className="form-input resize-y" />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={() => handle('approve')} disabled={!!localAct || acting}
            className="btn btn-approve flex-1 justify-center gap-2">
            <CheckCircle size={14} />{localAct === 'approve' ? 'Accepting…' : 'Accept'}
          </button>
          <button onClick={() => handle('reject')} disabled={!!localAct || acting}
            className="btn btn-reject flex-1 justify-center gap-2">
            <XCircle size={14} />{localAct === 'reject' ? 'Rejecting…' : 'Not Accept'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Compact pending cards (click name → modal) ────────────────────────────────

function LeaveCard({ item, onAction, acting }) {
  const [open, setOpen] = useState(false);
  const isHR = item.requester_role === 'HR';
  const days = item.total_days;
  const t    = TYPES.leave;
  return (
    <>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.iconCls}`}>
              <t.Icon size={17} />
            </div>
            <div className="min-w-0">
              <button onClick={() => setOpen(true)}
                className="text-sm font-bold text-left hover:underline truncate block"
                style={{ color: 'var(--accent)' }}>
                {item.employee_name || `Employee #${item.employee_id}`}
                {isHR && <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">HR</span>}
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {item.leave_type} · {days}d · {item.from_date} → {item.to_date}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${t.tagCls}`}>Leave</span>
            <Badge text="Pending" />
            {item.from_date && <span className="hidden sm:block text-[11px] text-gray-400">{item.from_date}</span>}
            <button onClick={() => setOpen(true)} className="btn btn-secondary btn-xs">View</button>
          </div>
        </div>
      </div>
      {open && (
        <LeaveDetailModal item={item} acting={acting} onClose={() => setOpen(false)}
          onAction={async (action) => {
            await onAction('leave', item.id, action, {});
            setOpen(false);
          }} />
      )}
    </>
  );
}

function ResignationCard({ item, onAction, acting }) {
  const [open, setOpen] = useState(false);
  const t = TYPES.resignation;
  return (
    <>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.iconCls}`}>
              <t.Icon size={17} />
            </div>
            <div className="min-w-0">
              <button onClick={() => setOpen(true)}
                className="text-sm font-bold text-left hover:underline truncate block"
                style={{ color: 'var(--accent)' }}>
                {item.employee_name || `Employee #${item.employee_id}`}
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {item.employee_code && <span className="mr-2 font-medium">{item.employee_code}</span>}
                {item.designation || 'Employee'} · LWD: {item.last_working_date || '—'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${t.tagCls}`}>Resignation</span>
            <Badge text="Pending" />
            {item.created_at && <span className="hidden sm:block text-[11px] text-gray-400">{item.created_at.slice(0, 10)}</span>}
            <button onClick={() => setOpen(true)} className="btn btn-secondary btn-xs">View</button>
          </div>
        </div>
      </div>
      {open && (
        <ResignationDetailModal item={item} acting={acting} onClose={() => setOpen(false)}
          onAction={async (action, body) => {
            await onAction('resignation', item.id, action, body);
            setOpen(false);
          }} />
      )}
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CeoApprovals({ toast }) {
  const [salaryPending,  setSalaryPending]  = useState([]);
  const [leavePending,   setLeavePending]   = useState([]);
  const [resignPending,  setResignPending]  = useState([]);
  const [salaryHistory,  setSalaryHistory]  = useState([]);
  const [leaveHistory,   setLeaveHistory]   = useState([]);
  const [resignHistory,  setResignHistory]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [acting,         setActing]         = useState(false);
  const [tab,            setTab]            = useState('pending');
  const [filterType,     setFilterType]     = useState(null); // null = all
  const [detailModal,    setDetailModal]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [salary, leaves, resigns, salHist, lvHist, rgHist] = await Promise.all([
        api('GET', '/api/approvals/pending'),
        api('GET', '/api/leaves?status=Pending'),
        api('GET', '/api/resignations?status=Pending'),
        api('GET', '/api/approvals/history?limit=20'),
        api('GET', '/api/leaves?status=Approved').then(r => r.slice(0, 10)).catch(() => []),
        api('GET', '/api/resignations').then(r => r.filter(x => x.status !== 'Pending').slice(0, 10)).catch(() => []),
      ]);
      setSalaryPending(salary);
      setLeavePending(leaves);
      setResignPending(resigns);
      setSalaryHistory(salHist);
      setLeaveHistory(lvHist);
      setResignHistory(rgHist);
    } catch (e) {
      toast?.(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Deep-link: when arriving from a notification, auto-filter and scroll to the item
  useEffect(() => {
    if (loading) return;
    const raw = sessionStorage.getItem('notif-deeplink');
    if (!raw) return;
    sessionStorage.removeItem('notif-deeplink');
    try {
      const { entityId, entityType } = JSON.parse(raw);
      const typeMap = { leave: 'leave', resignation: 'resignation', salary_change: 'salary' };
      const t = typeMap[entityType];
      if (t) {
        setFilterType(t);
        setTab('pending');
        setTimeout(() => {
          const el = document.getElementById(`approval-item-${t}-${entityId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2');
            setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2'), 2500);
          }
        }, 150);
      }
    } catch {}
  }, [loading]);

  async function handleAction(type, id, action, body) {
    setActing(true);
    try {
      if (type === 'salary')      await api('POST', `/api/approvals/${id}/${action}`, body);
      else if (type === 'leave')  await api('PUT',  `/api/leaves/${id}/${action}`, body);
      else                        await api('PUT',  `/api/resignations/${id}/${action}`, body);
      toast?.(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success');
      load();
    } catch (e) {
      toast?.(e.message, 'error');
    } finally {
      setActing(false);
    }
  }

  const totalPending = salaryPending.length + leavePending.length + resignPending.length;

  // Unified + filtered pending list (tagged with type for rendering)
  const allPending = [
    ...salaryPending.map(i => ({ ...i, _type: 'salary',      _date: i.created_at })),
    ...leavePending.map(i  => ({ ...i, _type: 'leave',       _date: i.from_date })),
    ...resignPending.map(i => ({ ...i, _type: 'resignation', _date: i.created_at })),
  ].sort((a, b) => (b._date || '').localeCompare(a._date || ''));

  const visiblePending = filterType
    ? allPending.filter(i => i._type === filterType)
    : allPending;

  // Unified history list
  const allHistory = [
    ...salaryHistory.map(i => ({ ...i, _type: 'salary',      _date: i.updated_at || i.created_at, _name: i.context?.employee_name || `Employee #${i.entity_id}` })),
    ...leaveHistory.map(i  => ({ ...i, _type: 'leave',       _date: i.to_date,                    _name: i.employee_name })),
    ...resignHistory.map(i => ({ ...i, _type: 'resignation', _date: i.created_at,                 _name: i.employee_name })),
  ].sort((a, b) => (b._date || '').localeCompare(a._date || ''));

  const visibleHistory = filterType
    ? allHistory.filter(i => i._type === filterType)
    : allHistory;

  const pendingCounts = {
    salary:      salaryPending.length,
    leave:       leavePending.length,
    resignation: resignPending.length,
  };
  const historyCounts = {
    salary:      salaryHistory.length,
    leave:       leaveHistory.length,
    resignation: resignHistory.length,
  };

  const TABS = [
    { key: 'pending', label: `Pending${totalPending ? ` (${totalPending})` : ''}` },
    { key: 'history', label: 'History' },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Approvals</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Salary changes, leaves and resignations waiting for your decision
          </p>
        </div>
        <button onClick={load} className="btn btn-secondary btn-sm gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-content space-y-5">

        {/* Main tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setFilterType(null); }}
              className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-gray-400">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-indigo-500 animate-spin" />
            Loading…
          </div>
        ) : tab === 'pending' ? (
          <div className="space-y-5">
            {/* Summary filter cards */}
            <SummaryCards
              counts={pendingCounts}
              active={filterType}
              onSelect={setFilterType}
            />

            {/* Unified list */}
            {visiblePending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                <CheckCircle size={44} className="text-green-200 dark:text-green-900" />
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">All clear!</div>
                  <div className="text-xs mt-0.5">
                    {filterType ? `No pending ${TYPES[filterType].label.toLowerCase()}` : 'No pending approval requests'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {visiblePending.map(item => {
                  const domId = `approval-item-${item._type}-${item.id ?? item.approval_request_id}`;
                  return (
                    <div key={domId} id={domId} className="rounded-xl transition-all duration-300">
                      {item._type === 'salary'      && <SalaryCard      item={item} onAction={handleAction} acting={acting} />}
                      {item._type === 'leave'       && <LeaveCard       item={item} onAction={handleAction} acting={acting} />}
                      {item._type === 'resignation' && <ResignationCard item={item} onAction={handleAction} acting={acting} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* History tab */
          <div className="space-y-5">
            {/* Summary filter cards */}
            <SummaryCards
              counts={historyCounts}
              active={filterType}
              onSelect={setFilterType}
            />

            {/* Unified history table */}
            {visibleHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">No history yet</div>
                <div className="text-xs">Actioned requests will appear here</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Employee</th>
                      <th>Details</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleHistory.map((r, i) => {
                      const t = TYPES[r._type];
                      let detail = '—';
                      if (r._type === 'salary') {
                        const fields = Object.keys(r.payload || {}).filter(k => SALARY_LABELS[k]);
                        detail = fields.map(k => SALARY_LABELS[k]).join(', ') || '—';
                      } else if (r._type === 'leave') {
                        detail = `${r.leave_type} · ${r.total_days}d (${r.from_date} → ${r.to_date})`;
                      } else if (r._type === 'resignation') {
                        detail = `LWD: ${r.approved_last_working_date || r.last_working_date || '—'}`;
                      }
                      return (
                        <tr key={i} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          onClick={() => setDetailModal({ item: r, type: r._type })}>
                          <td>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${t.tagCls}`}>
                              {t.label.replace(' Requests', '').replace(' Changes', '')}
                            </span>
                          </td>
                          <td className="font-semibold" style={{ color: 'var(--accent)' }}>{r._name || '—'}</td>
                          <td className="text-gray-500 text-xs max-w-[240px] truncate">{detail}</td>
                          <td>
                            <Badge text={r.status ? cap(r.status) : (r.status || '—')} />
                          </td>
                          <td className="text-gray-400 text-xs whitespace-nowrap">{r._date?.slice(0, 10) || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {detailModal && (
        <HistoryDetailModal
          item={detailModal.item}
          type={detailModal.type}
          onClose={() => setDetailModal(null)}
        />
      )}
    </div>
  );
}
