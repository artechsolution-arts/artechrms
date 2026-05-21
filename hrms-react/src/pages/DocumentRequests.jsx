import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import EmpAvatar from '../components/EmpAvatar';
import { Upload, Download, FileText, RefreshCw, Search, CheckCircle2, Clock, FileCheck } from 'lucide-react';

const TABS = ['All', 'Pending', 'Fulfilled'];

function StatusChip({ status }) {
  if (status === 'Fulfilled') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
        <CheckCircle2 size={10} /> Fulfilled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
      <Clock size={10} /> Pending
    </span>
  );
}

function RequestCard({ r, onUpload, uploading }) {
  const isFulfilled = r.status === 'Fulfilled';
  return (
    <div className={`card p-4 flex flex-col gap-3 transition-shadow hover:shadow-md ${
      isFulfilled ? 'border-green-100 dark:border-green-900/40' : ''
    }`}>
      {/* Employee header */}
      <div className="flex items-center gap-3">
        <EmpAvatar name={r.employee_name} photo={r.profile_photo} size="sm" colorIndex={r.employee_id} rounded="rounded-full" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.employee_name}</p>
          <p className="text-xs text-gray-400">{r.employee_code}</p>
        </div>
        <StatusChip status={r.status} />
      </div>

      {/* Document info */}
      <div className={`flex items-start gap-3 px-3 py-2.5 rounded-xl ${
        isFulfilled
          ? 'bg-green-50 dark:bg-green-900/10'
          : 'bg-gray-50 dark:bg-gray-800/50'
      }`}>
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${
          isFulfilled ? 'bg-green-100 dark:bg-green-800/40 text-green-600' : 'bg-white dark:bg-gray-700 text-gray-400'
        }`}>
          {isFulfilled ? <FileCheck size={14} /> : <FileText size={14} />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{r.doc_type}</p>
          {r.remarks && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.remarks}</p>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 px-0.5">
        <span>Requested {r.requested_at}</span>
        {r.fulfilled_at && <span className="text-green-600">Fulfilled {r.fulfilled_at}</span>}
      </div>

      {/* Action */}
      {r.status === 'Pending' ? (
        <button
          onClick={() => onUpload(r.id)}
          disabled={uploading === r.id}
          className="flex items-center justify-center gap-1.5 w-full py-2 bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold rounded-lg transition-opacity disabled:opacity-60"
        >
          <Upload size={13} />
          {uploading === r.id ? 'Uploading…' : 'Upload Document'}
        </button>
      ) : r.file_url ? (
        <a
          href={r.file_url}
          download={r.file_name || 'document'}
          className="flex items-center justify-center gap-1.5 w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors"
        >
          <Download size={13} /> Download
        </a>
      ) : (
        <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-green-600 font-medium">
          <CheckCircle2 size={13} /> Document fulfilled
        </div>
      )}
    </div>
  );
}

export default function DocumentRequests({ toast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(null);
  const fileInputRef = useRef(null);
  const pendingUploadId = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      setRequests(await api('GET', '/api/hrm/document-requests'));
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleUploadClick = (id) => {
    pendingUploadId.current = id;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUploadId.current) return;
    e.target.value = '';
    const reqId = pendingUploadId.current;
    pendingUploadId.current = null;
    setUploading(reqId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch(`/api/hrm/document-requests/${reqId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Upload failed');
      }
      toast('Document uploaded — employee can now download it', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setUploading(null); }
  };

  const pending   = requests.filter(r => r.status === 'Pending').length;
  const fulfilled = requests.filter(r => r.status === 'Fulfilled').length;

  const visible = requests
    .filter(r => tab === 'All' || r.status === tab)
    .filter(r => !search.trim() ||
      r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.doc_type?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Document Requests</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Upload documents requested by employees</p>
        </div>
        <button onClick={load} className="btn btn-secondary btn-sm gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-content space-y-4">

        {/* Pending alert banner */}
        {pending > 0 && tab !== 'Pending' && (
          <div
            onClick={() => setTab('Pending')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 cursor-pointer hover:shadow-sm transition-shadow"
          >
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {pending} pending request{pending > 1 ? 's' : ''} awaiting document upload
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">Click to view and upload</p>
            </div>
            <span className="ml-auto text-xs font-semibold text-amber-700 dark:text-amber-400">View →</span>
          </div>
        )}

        {/* Summary + search row */}
        <div className="flex flex-wrap gap-3 items-start">
          <div className="flex gap-3">
            {[
              { label: 'Total',     count: requests.length, color: 'text-gray-700 dark:text-gray-300' },
              { label: 'Pending',   count: pending,          color: 'text-amber-600' },
              { label: 'Fulfilled', count: fulfilled,        color: 'text-green-600' },
            ].map(({ label, count, color }) => (
              <div key={label} className="card px-4 py-3 text-center min-w-[80px]">
                <div className={`text-xl font-bold ${color}`}>{count}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <div className="relative ml-auto">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search employee or document…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-7 text-xs w-56"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(t => {
            const cnt = t === 'All' ? requests.length : requests.filter(r => r.status === t).length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  tab === t
                    ? 'text-white'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
                style={tab === t ? { backgroundColor: 'var(--accent)' } : {}}
              >
                {t}
                {cnt > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    tab === t ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>{cnt}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse space-y-3">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                <div className="h-9 bg-gray-100 dark:bg-gray-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="card">
            <div className="empty-state py-12">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <FileText size={28} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {search ? 'No matching requests' : tab === 'All' ? 'No document requests yet' : `No ${tab.toLowerCase()} requests`}
              </p>
              <p className="text-xs text-gray-400 mt-1">Employee requests will appear here for upload</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map(r => (
              <RequestCard
                key={r.id}
                r={r}
                onUpload={handleUploadClick}
                uploading={uploading}
              />
            ))}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
