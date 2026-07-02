import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import {
  CheckCircle, XCircle, Clock, IndianRupee,
  ChevronDown, ChevronUp, Calendar, UserMinus,
} from 'lucide-react';

// ── Salary change helpers ──────────────────────────────────────────────────────

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

// ── TYPE CONFIG ────────────────────────────────────────────────────────────────

const TYPE_META = {
  salary:      { label: 'Salary Change',  Icon: IndianRupee, bg: '#EEF2FF', color: '#4F46E5', badge: '#E0E7FF', badgeText: '#3730A3' },
  leave:       { label: 'Leave Request',  Icon: Calendar,    bg: '#F0FDF4', color: '#16A34A', badge: '#DCFCE7', badgeText: '#15803D' },
  resignation: { label: 'Resignation',    Icon: UserMinus,   bg: '#FFF7ED', color: '#EA580C', badge: '#FFEDD5', badgeText: '#C2410C' },
};

// ── Card shell ─────────────────────────────────────────────────────────────────

function CardShell({ type, name, code, subtitle, date, children }) {
  const [open, setOpen] = useState(false);
  const m = TYPE_META[type];
  const { Icon } = m;
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color={m.color} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              {code && <span style={{ marginRight: 8 }}>{code}</span>}
              {subtitle}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: m.badge, color: m.badgeText }}>{m.label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} />Pending
          </span>
          {date && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{date}</div>}
          <button onClick={() => setOpen(o => !o)}
            style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#6B7280' }}>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {open ? 'Hide' : 'Review'}
          </button>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid #F3F4F6', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ActionRow({ onApprove, onReject, acting, approveLabel = 'Approve', rejectLabel = 'Reject' }) {
  const [localActing, setLocalActing] = useState(null);
  async function handle(which, fn) {
    setLocalActing(which);
    try { await fn(); } finally { setLocalActing(null); }
  }
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={() => handle('approve', onApprove)} disabled={!!localActing || acting}
        style={{ flex: 1, padding: '10px 20px', background: localActing === 'approve' ? '#15803D' : '#16A34A', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: localActing || acting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: localActing && localActing !== 'approve' ? 0.5 : 1, fontFamily: 'inherit', transition: 'background 0.15s' }}>
        <CheckCircle size={15} />{localActing === 'approve' ? `${approveLabel.replace(/e$/, '')}ing…` : approveLabel}
      </button>
      <button onClick={() => handle('reject', onReject)} disabled={!!localActing || acting}
        style={{ flex: 1, padding: '10px 20px', background: localActing === 'reject' ? '#B91C1C' : '#DC2626', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: localActing || acting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: localActing && localActing !== 'reject' ? 0.5 : 1, fontFamily: 'inherit', transition: 'background 0.15s' }}>
        <XCircle size={15} />{localActing === 'reject' ? 'Rejecting…' : rejectLabel}
      </button>
    </div>
  );
}

// ── Salary card ────────────────────────────────────────────────────────────────

function SalaryCard({ item, onAction, acting }) {
  const [remarks, setRemarks] = useState('');
  const ctx     = item.context || {};
  const payload = item.payload || {};
  const fields  = Object.entries(payload).filter(([k]) => SALARY_LABELS[k]);
  return (
    <CardShell type="salary" name={ctx.employee_name || `Employee #${item.entity_id}`} code={ctx.employee_code}
      subtitle={`Salary Change Request · #${item.approval_request_id}`} date={item.created_at?.slice(0, 10)}>
      {fields.length > 0 && (
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '8px 14px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>Proposed Changes</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{ padding: '7px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12, borderBottom: '1px solid #E5E7EB' }}>Field</th>
                <th style={{ padding: '7px 14px', textAlign: 'right', fontWeight: 600, color: '#15803D', fontSize: 12, borderBottom: '1px solid #E5E7EB' }}>New Value</th>
              </tr>
            </thead>
            <tbody>
              {fields.map(([key, val], i) => (
                <tr key={key} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: i < fields.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <td style={{ padding: '9px 14px', color: '#374151', fontWeight: 500 }}>{SALARY_LABELS[key]}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                    <span style={{ background: '#F0FDF4', color: '#15803D', padding: '2px 8px', borderRadius: 6, fontWeight: 600, border: '1px solid #BBF7D0' }}>{fmtSalary(key, val)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Remarks <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></label>
        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Add a note…" rows={2}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none', color: '#111827', boxSizing: 'border-box' }} />
      </div>
      <ActionRow acting={acting}
        onApprove={() => onAction('salary', item.approval_request_id, 'approve', { remarks })}
        onReject={()  => onAction('salary', item.approval_request_id, 'reject',  { remarks })} />
    </CardShell>
  );
}

// ── Leave card ─────────────────────────────────────────────────────────────────

function LeaveCard({ item, onAction, acting }) {
  const isHR    = item.requester_role === 'HR';
  const days    = item.total_days;
  const dateRange = `${item.from_date} → ${item.to_date}`;
  const subtitle = `${item.leave_type} · ${days}d · ${dateRange}${isHR ? ' · HR Staff' : ''}`;
  return (
    <CardShell type="leave" name={item.employee_name || `Employee #${item.employee_id}`}
      subtitle={subtitle} date={item.from_date}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <InfoBlock label="Leave Type"  value={item.leave_type} />
        <InfoBlock label="Duration"    value={`${days} day${days !== 1 ? 's' : ''}${item.half_day ? ' (half day)' : ''}`} />
        <InfoBlock label="From"        value={item.from_date} />
        <InfoBlock label="To"          value={item.to_date} />
        {item.leave_category && <InfoBlock label="Category" value={item.leave_category} />}
        {isHR && <InfoBlock label="Requested by" value="HR Staff" highlight />}
      </div>
      {item.reason && (
        <div style={{ background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Reason</div>
          <div style={{ fontSize: 13, color: '#374151' }}>{item.reason}</div>
        </div>
      )}
      <ActionRow acting={acting}
        onApprove={() => onAction('leave', item.id, 'approve', {})}
        onReject={()  => onAction('leave', item.id, 'reject',  {})} />
    </CardShell>
  );
}

// ── Resignation card ───────────────────────────────────────────────────────────

function ResignationCard({ item, onAction, acting }) {
  const [remarks, setRemarks]  = useState('');
  const [approvedLwd, setApprovedLwd] = useState(item.last_working_date || '');
  const subtitle = `${item.designation || 'Employee'} · ${item.department || ''} · Requested LWD: ${item.last_working_date || '—'}`;
  return (
    <CardShell type="resignation" name={item.employee_name || `Employee #${item.employee_id}`} code={item.employee_code}
      subtitle={subtitle} date={item.created_at}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {item.department   && <InfoBlock label="Department"  value={item.department} />}
        {item.designation  && <InfoBlock label="Designation" value={item.designation} />}
        {item.date_of_joining && <InfoBlock label="Date of Joining" value={item.date_of_joining} />}
        <InfoBlock label="Requested LWD" value={item.last_working_date || '—'} />
        {item.notice_period_days != null && <InfoBlock label="Notice Period" value={`${item.notice_period_days} days`} />}
      </div>
      {item.reason && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Reason for Resignation</div>
          <div style={{ fontSize: 13, color: '#374151' }}>{item.reason}</div>
        </div>
      )}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Approved Last Working Day</label>
        <input type="date" value={approvedLwd} onChange={e => setApprovedLwd(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#111827', boxSizing: 'border-box' }} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Remarks <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></label>
        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Add a note for the employee…" rows={2}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none', color: '#111827', boxSizing: 'border-box' }} />
      </div>
      <ActionRow acting={acting} approveLabel="Accept" rejectLabel="Not Accept"
        onApprove={() => onAction('resignation', item.id, 'approve', { hr_remarks: remarks, approved_last_working_date: approvedLwd || item.last_working_date })}
        onReject={()  => onAction('resignation', item.id, 'reject',  { hr_remarks: remarks })} />
    </CardShell>
  );
}

function InfoBlock({ label, value, highlight }) {
  return (
    <div style={{ background: highlight ? '#FEF3C7' : '#F9FAFB', border: `1px solid ${highlight ? '#FDE68A' : '#F3F4F6'}`, borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: highlight ? '#92400E' : '#111827' }}>{value}</div>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const colors = {
    approved: { bg: '#D1FAE5', text: '#065F46' },
    rejected:  { bg: '#FEE2E2', text: '#991B1B' },
    pending:   { bg: '#FEF3C7', text: '#92400E' },
  };
  const c = colors[status?.toLowerCase()] || colors.pending;
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: c.bg, color: c.text }}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'}
    </span>
  );
}

// ── Section heading ─────────────────────────────────────────────────────────────

function SectionHead({ label, count, color }) {
  if (!count) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 2 }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: color + '22', color }}>{count}</span>
    </div>
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

  async function handleAction(type, id, action, body) {
    setActing(true);
    try {
      if (type === 'salary') {
        await api('POST', `/api/approvals/${id}/${action}`, body);
      } else if (type === 'leave') {
        await api('PUT', `/api/leaves/${id}/${action}`, body);
      } else if (type === 'resignation') {
        await api('PUT', `/api/resignations/${id}/${action}`, body);
      }
      const verb = action === 'approve' || action === 'accept' ? 'approved' : 'rejected';
      toast?.(`Request ${verb} successfully`, 'success');
      load();
    } catch (e) {
      toast?.(e.message, 'error');
    } finally {
      setActing(false);
    }
  }

  const totalPending = salaryPending.length + leavePending.length + resignPending.length;

  const TABS = [
    { key: 'pending', label: `Pending${totalPending ? ` (${totalPending})` : ''}` },
    { key: 'history', label: 'History' },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Approvals</h1>
          <p className="text-xs text-gray-500 mt-0.5">Salary changes, leaves and resignations waiting for your decision</p>
        </div>
        <button onClick={load} style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
          Refresh
        </button>
      </div>

      <div className="page-content space-y-5">

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '6px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? '#111827' : '#6B7280', boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: '#9CA3AF' }}>
            <div style={{ width: 20, height: 20, border: '2px solid #E5E7EB', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Loading…
          </div>
        ) : tab === 'pending' ? (
          totalPending === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
              <CheckCircle size={48} style={{ color: '#D1FAE5', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>All clear!</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>No pending approval requests</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {salaryPending.length > 0 && <>
                <SectionHead label="Salary Changes" count={salaryPending.length} color="#4F46E5" />
                {salaryPending.map(item => (
                  <SalaryCard key={item.approval_request_id} item={item} onAction={handleAction} acting={acting} />
                ))}
              </>}

              {leavePending.length > 0 && <>
                <SectionHead label="Leave Requests" count={leavePending.length} color="#16A34A" />
                {leavePending.map(item => (
                  <LeaveCard key={item.id} item={item} onAction={handleAction} acting={acting} />
                ))}
              </>}

              {resignPending.length > 0 && <>
                <SectionHead label="Resignations" count={resignPending.length} color="#EA580C" />
                {resignPending.map(item => (
                  <ResignationCard key={item.id} item={item} onAction={handleAction} acting={acting} />
                ))}
              </>}
            </div>
          )
        ) : (
          /* History tab */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Salary change history */}
            {salaryHistory.length > 0 && (
              <div>
                <SectionHead label="Salary Changes" count={salaryHistory.length} color="#4F46E5" />
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F3F4F6', overflow: 'hidden', marginTop: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        {['#', 'Employee', 'Status', 'Remarks', 'Date'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {salaryHistory.map((r, i) => (
                        <tr key={r.id} style={{ borderBottom: i < salaryHistory.length - 1 ? '1px solid #F3F4F6' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                          <td style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: 12 }}>#{r.id}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827' }}>Employee #{r.entity_id}</td>
                          <td style={{ padding: '10px 14px' }}><StatusBadge status={r.status} /></td>
                          <td style={{ padding: '10px 14px', color: '#6B7280', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.remarks || '—'}</td>
                          <td style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: 12, whiteSpace: 'nowrap' }}>{(r.updated_at || r.created_at)?.slice(0, 10)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Leave history */}
            {leaveHistory.length > 0 && (
              <div>
                <SectionHead label="Leave Decisions" count={leaveHistory.length} color="#16A34A" />
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F3F4F6', overflow: 'hidden', marginTop: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        {['Employee', 'Leave Type', 'Dates', 'Days', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaveHistory.map((r, i) => (
                        <tr key={r.id} style={{ borderBottom: i < leaveHistory.length - 1 ? '1px solid #F3F4F6' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827' }}>{r.employee_name || `#${r.employee_id}`}</td>
                          <td style={{ padding: '10px 14px', color: '#374151' }}>{r.leave_type}</td>
                          <td style={{ padding: '10px 14px', color: '#6B7280', fontSize: 12 }}>{r.from_date} → {r.to_date}</td>
                          <td style={{ padding: '10px 14px', color: '#374151' }}>{r.total_days}d</td>
                          <td style={{ padding: '10px 14px' }}><StatusBadge status={r.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Resignation history */}
            {resignHistory.length > 0 && (
              <div>
                <SectionHead label="Resignation Decisions" count={resignHistory.length} color="#EA580C" />
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F3F4F6', overflow: 'hidden', marginTop: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        {['Employee', 'Last Working Day', 'Remarks', 'Status', 'Date'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resignHistory.map((r, i) => (
                        <tr key={r.id} style={{ borderBottom: i < resignHistory.length - 1 ? '1px solid #F3F4F6' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827' }}>{r.employee_name || `#${r.employee_id}`}</td>
                          <td style={{ padding: '10px 14px', color: '#374151', fontSize: 12 }}>{r.approved_last_working_date || r.last_working_date || '—'}</td>
                          <td style={{ padding: '10px 14px', color: '#6B7280', fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.hr_remarks || '—'}</td>
                          <td style={{ padding: '10px 14px' }}><StatusBadge status={r.status} /></td>
                          <td style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: 12 }}>{r.actioned_at || r.created_at || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {salaryHistory.length === 0 && leaveHistory.length === 0 && resignHistory.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No history yet</div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
