import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import { Activity, RefreshCw, Search, Filter } from 'lucide-react';

const ACTION_COLORS = {
  LOGIN:          'bg-blue-100 text-blue-700',
  CREATE:         'bg-green-100 text-green-700',
  UPDATE:         'bg-amber-100 text-amber-700',
  DELETE:         'bg-red-100 text-red-700',
  APPROVE:        'bg-emerald-100 text-emerald-700',
  REJECT:         'bg-rose-100 text-rose-700',
  RETURN:         'bg-teal-100 text-teal-700',
  RUN_PAYROLL:    'bg-purple-100 text-purple-700',
  RESET_PASSWORD: 'bg-orange-100 text-orange-700',
};

const ROLE_COLORS = {
  SuperAdmin: 'bg-violet-100 text-violet-700',
  CEO:        'bg-rose-100 text-rose-700',
  HR:         'bg-blue-100 text-blue-700',
  Employee:   'bg-gray-100 text-gray-600',
  system:     'bg-slate-100 text-slate-500',
};

const ENTITY_TYPES = ['', 'Auth', 'Employee', 'Leave', 'Asset', 'Payroll', 'User', 'Permissions'];
const ACTIONS      = ['', 'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'RETURN', 'RUN_PAYROLL', 'RESET_PASSWORD'];

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function ChangesCell({ changes }) {
  if (!changes) return <span className="text-[var(--text-muted)]">—</span>;
  const entries = Object.entries(changes);
  if (!entries.length) return <span className="text-[var(--text-muted)]">—</span>;
  return (
    <div className="space-y-0.5 text-xs">
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-1 flex-wrap">
          <span className="font-medium text-[var(--text-secondary)]">{k}:</span>
          <span className="text-[var(--text-primary)]">
            {Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

const PAGE_SIZE = 50;

export default function ActivityLog({ toast }) {
  const [logs, setLogs]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [offset, setOffset]     = useState(0);

  const [actor,      setActor]      = useState('');
  const [action,     setAction]     = useState('');
  const [entityType, setEntityType] = useState('');

  const fetchLogs = useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: PAGE_SIZE, offset: off });
      if (actor)      params.append('actor',       actor);
      if (action)     params.append('action',      action);
      if (entityType) params.append('entity_type', entityType);
      const data = await api('GET', `/api/admin/activity-logs?${params}`);
      setLogs(data.logs);
      setTotal(data.total);
      setOffset(off);
    } catch {
      toast?.('error', 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [actor, action, entityType, toast]);

  useEffect(() => { fetchLogs(0); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchLogs(0); };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity size={22} className="text-[var(--primary)]" />
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Activity Log</h1>
            <p className="text-xs text-[var(--text-muted)]">{total.toLocaleString()} events recorded</p>
          </div>
        </div>
        <button
          onClick={() => fetchLogs(0)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] text-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs text-[var(--text-muted)] font-medium">Actor (username)</label>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={actor}
              onChange={e => setActor(e.target.value)}
              placeholder="e.g. admin"
              className="pl-8 pr-3 py-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] w-full"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs text-[var(--text-muted)] font-medium">Action</label>
          <select
            value={action}
            onChange={e => setAction(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
          >
            {ACTIONS.map(a => <option key={a} value={a}>{a || 'All actions'}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs text-[var(--text-muted)] font-medium">Entity type</label>
          <select
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
          >
            {ENTITY_TYPES.map(t => <option key={t} value={t}>{t || 'All types'}</option>)}
          </select>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium"
        >
          <Filter size={14} />
          Apply
        </button>
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="whitespace-nowrap">Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Name / Description</th>
                <th>Details</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-[var(--text-muted)]">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-[var(--text-muted)]">No activity recorded yet</td></tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap text-xs text-[var(--text-secondary)]">{formatTime(log.created_at)}</td>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm text-[var(--text-primary)]">{log.actor}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium w-fit ${ROLE_COLORS[log.actor_role] || 'bg-gray-100 text-gray-600'}`}>
                        {log.actor_role}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="text-sm text-[var(--text-secondary)]">{log.entity_type}</td>
                  <td className="text-sm text-[var(--text-primary)] max-w-[220px]">
                    <span className="line-clamp-2">{log.entity_name || '—'}</span>
                  </td>
                  <td className="max-w-[200px]"><ChangesCell changes={log.changes} /></td>
                  <td className="text-xs text-[var(--text-muted)] whitespace-nowrap">{log.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)] text-sm text-[var(--text-secondary)]">
            <span>Page {currentPage} of {totalPages} ({total} total)</span>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => fetchLogs(Math.max(0, offset - PAGE_SIZE))}
                className="px-3 py-1.5 rounded border border-[var(--border-color)] disabled:opacity-40 hover:bg-[var(--bg-secondary)]"
              >
                Previous
              </button>
              <button
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => fetchLogs(offset + PAGE_SIZE)}
                className="px-3 py-1.5 rounded border border-[var(--border-color)] disabled:opacity-40 hover:bg-[var(--bg-secondary)]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
