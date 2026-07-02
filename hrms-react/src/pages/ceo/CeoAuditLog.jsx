import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../api';
import Select from '../../components/Select';
import DatePicker from '../../components/DatePicker';
import {
  Search, Filter, Download, RefreshCw, Clock, User, Shield,
  ArrowRight, ChevronLeft, ChevronRight as ChevronRightIcon,
  Activity, FileText, TrendingUp, UserCog, LogIn,
} from 'lucide-react';

/* ── Colour mappings ───────────────────────────────────────────────────────── */
const ACTION_META = {
  CREATE:          { label: 'Created',          bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' },
  UPDATE:          { label: 'Updated',          bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  DELETE:          { label: 'Deleted',          bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
  APPROVE:         { label: 'Approved',         bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
  REJECT:          { label: 'Rejected',         bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  LOGIN:           { label: 'Logged In',        bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' },
  RESET_PASSWORD:  { label: 'Reset Password',   bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  RUN_PAYROLL:     { label: 'Ran Payroll',      bg: '#EDE9FE', text: '#5B21B6', border: '#DDD6FE' },
  RETURN:          { label: 'Returned',         bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
  PROFILE_UPDATE:  { label: 'Profile Edit',     bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
  PROMOTION:       { label: 'Promoted',         bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  DEMOTION:        { label: 'Demoted',          bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  TRANSFER:        { label: 'Transferred',      bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  STATUS_CHANGE:   { label: 'Status Changed',   bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' },
  DEPARTMENT_CHANGE:{ label: 'Dept. Changed',   bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  JOINING:         { label: 'Joined',           bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' },
  ROLE_CHANGE:     { label: 'Role Changed',     bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
};

const ROLE_META = {
  HR:          { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  SuperAdmin:  { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
  CEO:         { bg: '#FDF2F8', text: '#9D174D', border: '#FBCFE8' },
  Employee:    { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' },
  System:      { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
};

const SOURCE_META = {
  activity: { label: 'System Log', icon: Activity },
  history:  { label: 'HR Action',  icon: UserCog  },
  profile:  { label: 'Self-Edit',  icon: User     },
};

/* ── Helper: relative time ─────────────────────────────────────────────────── */
function relTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function absTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  });
}

/* ── Action badge ──────────────────────────────────────────────────────────── */
function ActionBadge({ action }) {
  const meta = ACTION_META[action] || { label: action, bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: meta.bg, color: meta.text, border: `1px solid ${meta.border}`,
      whiteSpace: 'nowrap',
    }}>
      {meta.label}
    </span>
  );
}

/* ── Role badge ────────────────────────────────────────────────────────────── */
function RoleBadge({ role }) {
  const meta = ROLE_META[role] || ROLE_META.System;
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
      background: meta.bg, color: meta.text, border: `1px solid ${meta.border}`,
    }}>
      {role}
    </span>
  );
}

/* ── Changes cell ──────────────────────────────────────────────────────────── */
function ChangesCell({ changes }) {
  const [expanded, setExpanded] = useState(false);
  if (!changes || changes.length === 0) {
    return <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>—</span>;
  }
  const visible = expanded ? changes : changes.slice(0, 2);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {visible.map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', minWidth: 0 }}>{c.field}:</span>
          {c.old !== null && c.old !== undefined ? (
            <>
              <span style={{
                fontSize: 11, padding: '1px 7px', borderRadius: 4,
                background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA',
                maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                display: 'inline-block',
              }} title={c.old}>{c.old || '(empty)'}</span>
              <ArrowRight size={10} color="#9CA3AF" style={{ flexShrink: 0 }} />
            </>
          ) : null}
          <span style={{
            fontSize: 11, padding: '1px 7px', borderRadius: 4,
            background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0',
            maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            display: 'inline-block',
          }} title={c.new}>{c.new ?? '(empty)'}</span>
        </div>
      ))}
      {changes.length > 2 && (
        <button onClick={e => { e.stopPropagation(); setExpanded(x => !x); }}
          style={{ fontSize: 11, color: '#6366F1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
          {expanded ? '▲ Show less' : `▼ +${changes.length - 2} more`}
        </button>
      )}
    </div>
  );
}

/* ── Filter bar ────────────────────────────────────────────────────────────── */
function Filters({ filters, onChange, onReset }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Search */}
      <div style={{ position: 'relative', minWidth: 220 }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input
          value={filters.search}
          onChange={e => onChange('search', e.target.value)}
          placeholder="Search actor or entity…"
          className="form-input pl-8"
          style={{ paddingLeft: 32 }}
        />
      </div>

      {/* Role */}
      <div style={{ minWidth: 130 }}>
        <Select value={filters.actor_role} onChange={v => onChange('actor_role', v)}
          options={[
            { value: '', label: 'All Roles' },
            { value: 'HR', label: 'HR' },
            { value: 'Employee', label: 'Employee' },
            { value: 'SuperAdmin', label: 'Super Admin' },
            { value: 'CEO', label: 'CEO' },
          ]}
        />
      </div>

      {/* Action */}
      <div style={{ minWidth: 150 }}>
        <Select value={filters.action} onChange={v => onChange('action', v)}
          options={[
            { value: '', label: 'All Actions' },
            { value: 'CREATE', label: 'Created' },
            { value: 'UPDATE', label: 'Updated' },
            { value: 'DELETE', label: 'Deleted' },
            { value: 'APPROVE', label: 'Approved' },
            { value: 'REJECT', label: 'Rejected' },
            { value: 'LOGIN', label: 'Login' },
            { value: 'RUN_PAYROLL', label: 'Payroll Run' },
            { value: 'PROFILE_UPDATE', label: 'Profile Edit' },
            { value: 'PROMOTION', label: 'Promotion' },
            { value: 'TRANSFER', label: 'Transfer' },
            { value: 'DEMOTION', label: 'Demotion' },
            { value: 'RESET_PASSWORD', label: 'Password Reset' },
          ]}
        />
      </div>

      {/* Source */}
      <div style={{ minWidth: 150 }}>
        <Select value={filters.source} onChange={v => onChange('source', v)}
          options={[
            { value: '', label: 'All Sources' },
            { value: 'activity', label: 'System Log' },
            { value: 'history', label: 'HR Actions' },
            { value: 'profile', label: 'Employee Self-Edits' },
          ]}
        />
      </div>

      {/* Date from */}
      <div style={{ minWidth: 150 }}>
        <DatePicker value={filters.from_date} onChange={v => onChange('from_date', v)} placeholder="From date" />
      </div>

      {/* Date to */}
      <div style={{ minWidth: 150 }}>
        <DatePicker value={filters.to_date} onChange={v => onChange('to_date', v)} placeholder="To date" />
      </div>

      {/* Reset */}
      <button onClick={onReset}
        style={{ height: 34, padding: '0 14px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500, fontFamily: 'inherit' }}>
        <RefreshCw size={12} /> Reset
      </button>
    </div>
  );
}

/* ── Row detail modal ──────────────────────────────────────────────────────── */
function EntryModal({ entry, onClose }) {
  if (!entry) return null;
  const src = SOURCE_META[entry.source] || { label: entry.source, icon: FileText };
  const SrcIcon = src.icon;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '88vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Audit Entry Detail</div>
            <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{entry.id}</div>
          </div>
          <button onClick={onClose} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 7, cursor: 'pointer', lineHeight: 0 }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Timestamp',   value: absTime(entry.timestamp) },
              { label: 'Source',      value: src.label },
              { label: 'Actor',       value: entry.actor },
              { label: 'Role',        value: entry.actor_role },
              { label: 'Action',      value: ACTION_META[entry.action]?.label || entry.action },
              { label: 'Entity Type', value: entry.entity_type },
              { label: 'Entity',      value: entry.entity_name || '—' },
              { label: 'IP Address',  value: entry.ip_address || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', wordBreak: 'break-all' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Changes table */}
          {entry.changes && entry.changes.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Changes ({entry.changes.length})
              </div>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB', width: '25%' }}>Field</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#B91C1C', borderBottom: '1px solid #E5E7EB' }}>Old Value</th>
                      <th style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 600, color: '#9CA3AF', borderBottom: '1px solid #E5E7EB', width: 30 }}>→</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#15803D', borderBottom: '1px solid #E5E7EB' }}>New Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.changes.map((c, i) => (
                      <tr key={i} style={{ borderBottom: i < entry.changes.length - 1 ? '1px solid #F3F4F6' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                        <td style={{ padding: '9px 14px', fontWeight: 600, color: '#374151' }}>{c.field}</td>
                        <td style={{ padding: '9px 14px', color: '#B91C1C', wordBreak: 'break-all' }}>
                          {c.old !== null && c.old !== undefined
                            ? <span style={{ background: '#FEF2F2', padding: '1px 6px', borderRadius: 4 }}>{c.old}</span>
                            : <span style={{ color: '#D1D5DB', fontStyle: 'italic' }}>—</span>}
                        </td>
                        <td style={{ padding: '9px 14px', textAlign: 'center', color: '#9CA3AF' }}>→</td>
                        <td style={{ padding: '9px 14px', color: '#15803D', wordBreak: 'break-all' }}>
                          {c.new !== null && c.new !== undefined
                            ? <span style={{ background: '#F0FDF4', padding: '1px 6px', borderRadius: 4 }}>{c.new}</span>
                            : <span style={{ color: '#D1D5DB', fontStyle: 'italic' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
const LIMIT = 30;
const EMPTY_FILTERS = { search: '', actor_role: '', action: '', source: '', from_date: '', to_date: '' };

export default function CeoAuditLog({ toast }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [summary, setSummary]   = useState(null);
  const [filters, setFilters]   = useState(EMPTY_FILTERS);
  const [page, setPage]         = useState(0);
  const [selected, setSelected] = useState(null);
  const debounceRef = useRef(null);

  const fetchData = useCallback(async (f, pg) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', LIMIT);
      params.set('offset', pg * LIMIT);
      if (f.search)     params.set('search',      f.search);
      if (f.actor_role) params.set('actor_role',   f.actor_role);
      if (f.action)     params.set('action',        f.action);
      if (f.source)     params.set('source',        f.source);
      if (f.from_date)  params.set('from_date',     f.from_date + 'T00:00:00');
      if (f.to_date)    params.set('to_date',       f.to_date + 'T23:59:59');
      const d = await api('GET', `/api/audit/log?${params}`);
      setData(d);
    } catch (e) { toast?.(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  const fetchSummary = useCallback(async () => {
    try { setSummary(await api('GET', '/api/audit/summary')); } catch {}
  }, []);

  useEffect(() => { fetchSummary(); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      fetchData(filters, 0);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  useEffect(() => { fetchData(filters, page); }, [page]);

  const changeFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const resetFilters = () => { setFilters(EMPTY_FILTERS); setPage(0); };

  const entries = data?.entries || [];
  const total   = data?.total   || 0;
  const pages   = Math.ceil(total / LIMIT);

  const StatCard = ({ label, value, sub, color, onClick, active }) => (
    <div
      onClick={onClick}
      style={{
        background: active ? color + '10' : '#fff',
        borderRadius: 12, padding: '16px 20px',
        border: active ? `1.5px solid ${color}40` : '1px solid #F3F4F6',
        boxShadow: active ? `0 0 0 3px ${color}18` : '0 1px 6px rgba(0,0,0,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = active ? `0 0 0 3px ${color}28` : '0 2px 12px rgba(0,0,0,0.10)'; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.boxShadow = active ? `0 0 0 3px ${color}18` : '0 1px 6px rgba(0,0,0,0.05)'; }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || '#111827', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="text-xs text-gray-500 mt-0.5">Complete trail of all changes — HR actions, employee self-edits, and system events</p>
        </div>
        <button onClick={() => { fetchData(filters, page); fetchSummary(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-content space-y-5">

        {/* Summary stats */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <StatCard label="Total Events"    value={summary.total?.toLocaleString()}         sub="All time"          color="#111827"
              active={!filters.from_date && !filters.to_date && !filters.action && !filters.actor_role && !filters.search && !filters.source}
              onClick={resetFilters} />
            <StatCard label="Last 24 Hours"   value={summary.today_changes?.toLocaleString()} sub="Changes today"     color="#1D4ED8"
              active={filters.from_date === new Date().toISOString().split('T')[0] && !filters.to_date}
              onClick={() => { setFilters(f => ({ ...f, from_date: new Date().toISOString().split('T')[0], to_date: '' })); setPage(0); }} />
            <StatCard label="Last 7 Days"     value={summary.week_changes?.toLocaleString()}  sub="Changes this week" color="#7C3AED"
              active={filters.from_date === new Date(Date.now() - 6*24*60*60*1000).toISOString().split('T')[0] && !filters.to_date}
              onClick={() => { setFilters(f => ({ ...f, from_date: new Date(Date.now() - 6*24*60*60*1000).toISOString().split('T')[0], to_date: '' })); setPage(0); }} />
            <StatCard label="Filtered Results" value={loading ? '…' : total.toLocaleString()} sub="Matching filter"   color="#0369A1" />
          </div>
        )}

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={11} /> Filters
          </div>
          <Filters filters={filters} onChange={changeFilter} onReset={resetFilters} />
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
              {loading ? 'Loading…' : `${total.toLocaleString()} events`}
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>
              Click any row to view full details
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: '#9CA3AF' }}>
              <div style={{ width: 20, height: 20, border: '2px solid #E5E7EB', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Loading audit log…
            </div>
          ) : entries.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8, color: '#9CA3AF' }}>
              <Activity size={40} style={{ color: '#E5E7EB' }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No entries found</div>
              <div style={{ fontSize: 12 }}>Try adjusting your filters</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    {['Timestamp', 'Actor', 'Action', 'Entity', 'Changed Fields (Old → New)'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => {
                    const src = SOURCE_META[entry.source] || { label: entry.source, icon: FileText };
                    const SrcIcon = src.icon;
                    return (
                      <tr key={entry.id}
                        onClick={() => setSelected(entry)}
                        style={{
                          borderBottom: i < entries.length - 1 ? '1px solid #F3F4F6' : 'none',
                          background: i % 2 === 0 ? '#fff' : '#FAFAFA',
                          cursor: 'pointer',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F0F4FF'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFAFA'}
                      >
                        {/* Timestamp */}
                        <td style={{ padding: '10px 14px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{relTime(entry.timestamp)}</div>
                          <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 2 }}>
                            {new Date(entry.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </div>
                          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <SrcIcon size={10} color="#9CA3AF" />
                            <span style={{ fontSize: 10, color: '#9CA3AF' }}>{src.label}</span>
                          </div>
                        </td>

                        {/* Actor */}
                        <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                                {(entry.actor || 'S').split(/[@._]/)[0].slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {entry.actor}
                              </div>
                              <RoleBadge role={entry.actor_role} />
                            </div>
                          </div>
                          {entry.ip_address && (
                            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>{entry.ip_address}</div>
                          )}
                        </td>

                        {/* Action */}
                        <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                          <ActionBadge action={entry.action} />
                        </td>

                        {/* Entity */}
                        <td style={{ padding: '10px 14px', verticalAlign: 'top', maxWidth: 160 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.entity_name || entry.entity_id || '—'}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>{entry.entity_type}</div>
                        </td>

                        {/* Changes */}
                        <td style={{ padding: '10px 14px', verticalAlign: 'top', maxWidth: 320 }}>
                          <ChangesCell changes={entry.changes} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ padding: '12px 18px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12.5, color: '#6B7280' }}>
                Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total.toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  style={{ width: 32, height: 32, border: '1px solid #E5E7EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 0 ? 'not-allowed' : 'pointer', background: '#fff', opacity: page === 0 ? 0.4 : 1 }}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                  let pg = i;
                  if (pages > 7) {
                    if (page < 4) pg = i;
                    else if (page > pages - 5) pg = pages - 7 + i;
                    else pg = page - 3 + i;
                  }
                  return (
                    <button key={pg} onClick={() => setPage(pg)}
                      style={{ width: 32, height: 32, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12.5, fontWeight: pg === page ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit',
                        background: pg === page ? '#6366F1' : '#fff', color: pg === page ? '#fff' : '#374151' }}>
                      {pg + 1}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}
                  style={{ width: 32, height: 32, border: '1px solid #E5E7EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page >= pages - 1 ? 'not-allowed' : 'pointer', background: '#fff', opacity: page >= pages - 1 ? 0.4 : 1 }}>
                  <ChevronRightIcon size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && <EntryModal entry={selected} onClose={() => setSelected(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
