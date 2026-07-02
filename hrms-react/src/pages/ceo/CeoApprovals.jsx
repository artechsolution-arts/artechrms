import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import { CheckCircle, XCircle, Clock, IndianRupee, ChevronDown, ChevronUp } from 'lucide-react';

const SALARY_LABELS = {
  basic_salary:       'Basic Salary',
  hra_percent:        'HRA %',
  special_allowance:  'Special Allowance',
  lta:                'LTA',
  other_allowance:    'Other Allowance',
  ca_allowance:       'CA Allowance',
};

function fmt(key, val) {
  if (val === null || val === undefined) return '—';
  if (key === 'hra_percent') return `${val}%`;
  const n = Number(val);
  if (isNaN(n)) return String(val);
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function ApprovalCard({ item, onAction, acting }) {
  const [open, setOpen]       = useState(false);
  const [remarks, setRemarks] = useState('');
  const [localActing, setLocalActing] = useState(null);

  const ctx     = item.context || {};
  const payload = item.payload || {};
  const fields  = Object.entries(payload).filter(([k]) => SALARY_LABELS[k]);

  async function handle(action) {
    setLocalActing(action);
    try {
      await onAction(item.approval_request_id, action, remarks);
    } finally {
      setLocalActing(null);
    }
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
      boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', background: '#EEF2FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <IndianRupee size={18} color="#4F46E5" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ctx.employee_name || `Employee #${item.entity_id}`}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              {ctx.employee_code && <span style={{ marginRight: 8 }}>{ctx.employee_code}</span>}
              Salary Change Request · #{item.approval_request_id}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
            background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A',
          }}>
            <Clock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Pending
          </span>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.created_at?.slice(0, 10)}</div>
          <button onClick={() => setOpen(o => !o)}
            style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#6B7280' }}>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {open ? 'Hide' : 'Review'}
          </button>
        </div>
      </div>

      {/* Expandable detail */}
      {open && (
        <div style={{ borderTop: '1px solid #F3F4F6', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Changed fields table */}
          {fields.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Proposed Changes
              </div>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12, borderBottom: '1px solid #E5E7EB' }}>Field</th>
                      <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600, color: '#15803D', fontSize: 12, borderBottom: '1px solid #E5E7EB' }}>New Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map(([key, val], i) => (
                      <tr key={key} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: i < fields.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                        <td style={{ padding: '9px 14px', color: '#374151', fontWeight: 500 }}>{SALARY_LABELS[key] || key}</td>
                        <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                          <span style={{ background: '#F0FDF4', color: '#15803D', padding: '2px 8px', borderRadius: 6, fontWeight: 600, border: '1px solid #BBF7D0' }}>
                            {fmt(key, val)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Remarks input */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Remarks <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span>
            </label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Add a note for the HR team..."
              rows={2}
              style={{
                width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8,
                fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none',
                color: '#111827', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => handle('approve')}
              disabled={!!localActing || acting}
              style={{
                flex: 1, padding: '10px 20px', background: localActing === 'approve' ? '#15803D' : '#16A34A',
                color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 13,
                cursor: localActing || acting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                opacity: localActing && localActing !== 'approve' ? 0.5 : 1,
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}>
              <CheckCircle size={15} />
              {localActing === 'approve' ? 'Approving…' : 'Approve'}
            </button>
            <button
              onClick={() => handle('reject')}
              disabled={!!localActing || acting}
              style={{
                flex: 1, padding: '10px 20px', background: localActing === 'reject' ? '#B91C1C' : '#DC2626',
                color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 13,
                cursor: localActing || acting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                opacity: localActing && localActing !== 'reject' ? 0.5 : 1,
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}>
              <XCircle size={15} />
              {localActing === 'reject' ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CeoApprovals({ toast }) {
  const [pending,  setPending]  = useState([]);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(false);
  const [tab,      setTab]      = useState('pending');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        api('GET', '/api/approvals/pending'),
        api('GET', '/api/approvals/history?module=salary_change&limit=20'),
      ]);
      setPending(p);
      setHistory(h);
    } catch (e) {
      toast?.(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAction(approvalId, action, remarks) {
    setActing(true);
    try {
      await api('POST', `/api/approvals/${approvalId}/${action}`, { remarks });
      toast?.(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success');
      load();
    } catch (e) {
      toast?.(e.message, 'error');
    } finally {
      setActing(false);
    }
  }

  const TABS = [
    { key: 'pending', label: `Pending${pending.length ? ` (${pending.length})` : ''}` },
    { key: 'history', label: 'History' },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Approvals</h1>
          <p className="text-xs text-gray-500 mt-0.5">Salary change requests waiting for your decision</p>
        </div>
        <button onClick={load}
          style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
          Refresh
        </button>
      </div>

      <div className="page-content space-y-5">

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '6px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                background: tab === t.key ? '#fff' : 'transparent',
                color: tab === t.key ? '#111827' : '#6B7280',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
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
          pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
              <CheckCircle size={48} style={{ color: '#D1FAE5', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>All clear!</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>No pending approval requests</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pending.map(item => (
                <ApprovalCard key={item.approval_request_id} item={item} onAction={handleAction} acting={acting} />
              ))}
            </div>
          )
        ) : (
          /* History tab */
          history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No history yet</div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    {['#', 'Employee', 'Status', 'Remarks', 'Date'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((r, i) => {
                    const statusColor = r.status === 'approved' ? { bg: '#D1FAE5', text: '#065F46' } : r.status === 'rejected' ? { bg: '#FEE2E2', text: '#991B1B' } : { bg: '#FEF3C7', text: '#92400E' };
                    return (
                      <tr key={r.id} style={{ borderBottom: i < history.length - 1 ? '1px solid #F3F4F6' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                        <td style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: 12 }}>#{r.id}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827' }}>Employee #{r.entity_id}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: statusColor.bg, color: statusColor.text }}>
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#6B7280', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.remarks || '—'}</td>
                        <td style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: 12, whiteSpace: 'nowrap' }}>{r.updated_at?.slice(0, 10) || r.created_at?.slice(0, 10)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
