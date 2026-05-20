import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Modal, { Field } from '../components/Modal';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, RefreshCw, CalendarCheck2 } from 'lucide-react';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected'];

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getDate()}-${MONTH_NAMES[dt.getMonth()].slice(0,3)}-${String(dt.getFullYear()).slice(2)}`;
}

function StatusBadge({ status }) {
  const map = {
    Approved: 'bg-green-50 text-green-700 border-green-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',
    Pending:  'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      {status}
    </span>
  );
}

export default function HRWorkMode({ toast }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [tab, setTab]     = useState('All');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reject modal
  const [rejectModal, setRejectModal] = useState(null); // { id }
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [acting, setActing] = useState(null); // id being actioned

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const statusParam = tab === 'All' ? '' : `&status=${tab}`;
      setEntries(await api('GET', `/api/hrm/work-mode?month=${monthStr}${statusParam}`));
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [year, month, tab]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    setActing(id);
    try {
      await api('PUT', `/api/hrm/work-mode/${id}/approve`, {});
      toast('Approved', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setActing(null); }
  };

  const openReject = (id) => {
    setRejectRemarks('');
    setRejectModal({ id });
  };

  const confirmReject = async () => {
    if (!rejectModal) return;
    setActing(rejectModal.id);
    try {
      await api('PUT', `/api/hrm/work-mode/${rejectModal.id}/reject`, { remarks: rejectRemarks || null });
      toast('Rejected', 'success');
      setRejectModal(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setActing(null); }
  };

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const pending  = entries.filter(e => e.status === 'Pending').length;
  const approved = entries.filter(e => e.status === 'Approved').length;
  const rejected = entries.filter(e => e.status === 'Rejected').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Work Mode Sheet</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Review and approve employee WFH / leave requests</p>
        </div>
        <button onClick={load} className="btn btn-secondary btn-sm gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-content space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending',  count: pending,  color: 'text-amber-600' },
            { label: 'Approved', count: approved, color: 'text-green-600' },
            { label: 'Rejected', count: rejected, color: 'text-red-500'  },
          ].map(({ label, count, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="btn btn-secondary btn-sm p-1.5">
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-white min-w-[130px] text-center">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button onClick={nextMonth} disabled={isCurrentMonth}
              className="btn btn-secondary btn-sm p-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1">
            {STATUS_TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                  tab === t ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
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
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th className="hidden sm:table-cell w-[90px]">Emp ID</th>
                  <th className="w-[100px]">Date</th>
                  <th className="w-[140px]">Type</th>
                  <th className="hidden md:table-cell">Reason</th>
                  <th className="hidden sm:table-cell w-[140px]">Duration</th>
                  <th className="w-[110px]">Status</th>
                  <th className="w-[130px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading…</td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <CalendarCheck2 size={36} className="mb-2 text-gray-300" />
                      <p className="text-sm text-gray-500">
                        {tab === 'All' ? 'No requests this month' : `No ${tab.toLowerCase()} requests`}
                      </p>
                    </div>
                  </td></tr>
                ) : entries.map(e => (
                  <tr key={e.id}>
                    <td className="font-medium text-gray-900 dark:text-white">{e.employee_name}</td>
                    <td className="hidden sm:table-cell text-xs font-mono text-gray-500">{e.employee_code}</td>
                    <td className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{fmtDate(e.entry_date)}</td>
                    <td>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{e.work_mode}</span>
                    </td>
                    <td className="hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">{e.reason || '—'}</td>
                    <td className="hidden sm:table-cell text-sm text-gray-600 dark:text-gray-400">{e.duration}</td>
                    <td><StatusBadge status={e.status} /></td>
                    <td>
                      {e.status === 'Pending' ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => approve(e.id)}
                            disabled={acting === e.id}
                            className="btn btn-xs gap-1 disabled:opacity-60 text-green-700 border border-green-200 bg-green-50 hover:bg-green-100"
                          >
                            <CheckCircle2 size={11} /> Approve
                          </button>
                          <button
                            onClick={() => openReject(e.id)}
                            disabled={acting === e.id}
                            className="btn btn-danger btn-xs gap-1 disabled:opacity-60"
                          >
                            <XCircle size={11} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">{e.hr_remarks || '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reject modal */}
      <Modal
        open={!!rejectModal}
        title="Reject Request"
        onClose={() => setRejectModal(null)}
        onSave={confirmReject}
        saveLabel="Confirm Reject"
        danger
      >
        <Field label="Reason for Rejection (optional)">
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Explain why the request is being rejected…"
            value={rejectRemarks}
            onChange={e => setRejectRemarks(e.target.value)}
            autoFocus
          />
        </Field>
      </Modal>
    </>
  );
}
