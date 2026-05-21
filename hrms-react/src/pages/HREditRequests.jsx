import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import { FilePenLine, Check, X, RefreshCw } from 'lucide-react';

const TABS = ['All', 'Pending', 'Approved', 'Rejected'];

const TYPE_CHIP = {
  'Leave Entry':   'bg-blue-50 text-blue-700',
  'Status Sheet':  'bg-violet-50 text-violet-700',
  'Attendance':    'bg-teal-50 text-teal-700',
  'Other':         'bg-gray-100 text-gray-600',
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-teal-500', 'bg-rose-500',
  'bg-amber-500', 'bg-indigo-500',
];
function avatarBg(name) { return AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length]; }
function initials(name) { return (name || '—').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase(); }

export default function HREditRequests({ toast }) {
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('All');
  const [resolving, setResolving] = useState(null);  // req id being approved/rejected
  const [remarks,   setRemarks]   = useState({});     // { [id]: string }
  const remarksRef = useRef({});

  const load = async () => {
    setLoading(true);
    try {
      const param = tab === 'All' ? '' : `?status=${tab}`;
      setRequests(await api('GET', `/api/hrm/edit-requests${param}`));
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const resolve = async (id, action) => {
    setResolving(id);
    try {
      await api('PUT', `/api/hrm/edit-requests/${id}/${action}`, {
        hr_remarks: remarksRef.current[id] || null,
      });
      toast(`Request ${action}d`, action === 'approve' ? 'success' : 'warning');
      setRemarks(p => { const n = { ...p }; delete n[id]; return n; });
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setResolving(null); }
  };

  const pending = requests.filter(r => r.status === 'Pending').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Edit Requests</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Review employee requests to correct leaves, attendance, or status entries
          </p>
        </div>
        <button onClick={load} className="btn btn-secondary btn-sm gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-content space-y-4">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending',  count: requests.filter(r => r.status === 'Pending').length,  color: 'text-amber-600' },
            { label: 'Approved', count: requests.filter(r => r.status === 'Approved').length, color: 'text-green-600' },
            { label: 'Rejected', count: requests.filter(r => r.status === 'Rejected').length, color: 'text-red-500'  },
          ].map(({ label, count, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                tab === t ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
              style={tab === t ? { backgroundColor: 'var(--accent)' } : {}}
            >
              {t}
              {t === 'Pending' && pending > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === 'Pending' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
                }`}>{pending}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="card p-10 text-center text-sm text-gray-400">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <FilePenLine size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">
                {tab === 'All' ? 'No edit requests yet' : `No ${tab.toLowerCase()} requests`}
              </p>
            </div>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100 dark:divide-gray-800">
            {requests.map(r => (
              <div key={r.id} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full ${avatarBg(r.employee_name)} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{initials(r.employee_name)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {r.employee_name}
                      </span>
                      <span className="text-xs text-gray-400">{r.employee_code}</span>
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_CHIP[r.request_type] || 'bg-gray-100 text-gray-600'}`}>
                        {r.request_type}
                      </span>
                      <span className="text-xs text-gray-500">for {r.target_date}</span>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5">{r.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-medium">Reason:</span> {r.reason}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Raised on {r.created_at}</p>

                    {/* HR remarks if already resolved */}
                    {r.status !== 'Pending' && r.hr_remarks && (
                      <p className={`text-xs mt-1.5 font-medium ${r.status === 'Approved' ? 'text-green-600' : 'text-red-500'}`}>
                        Your note: {r.hr_remarks}
                      </p>
                    )}

                    {/* Action area for pending */}
                    {r.status === 'Pending' && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <input
                          type="text"
                          className="form-input text-xs py-1 flex-1 min-w-[200px] max-w-[320px]"
                          placeholder="Remarks (optional)"
                          defaultValue=""
                          onChange={e => { remarksRef.current[r.id] = e.target.value; }}
                        />
                        <button
                          onClick={() => resolve(r.id, 'approve')}
                          disabled={resolving === r.id}
                          className="btn btn-success btn-xs gap-1 disabled:opacity-60"
                        >
                          <Check size={11} /> Approve
                        </button>
                        <button
                          onClick={() => resolve(r.id, 'reject')}
                          disabled={resolving === r.id}
                          className="btn btn-danger btn-xs gap-1 disabled:opacity-60"
                        >
                          <X size={11} /> Reject
                        </button>
                      </div>
                    )}
                  </div>

                  <Badge text={r.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
