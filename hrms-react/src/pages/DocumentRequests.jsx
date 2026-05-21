import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import { Upload, Download, FileText, RefreshCw, Search } from 'lucide-react';

const TABS = ['All', 'Pending', 'Fulfilled'];

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
      toast('Document uploaded and request fulfilled', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setUploading(null); }
  };

  const pending   = requests.filter(r => r.status === 'Pending').length;
  const fulfilled = requests.filter(r => r.status === 'Fulfilled').length;

  const visible = requests
    .filter(r => tab === 'All' || r.status === tab)
    .filter(r => !search.trim() || r.employee_name?.toLowerCase().includes(search.toLowerCase()) || r.doc_type?.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Document Requests</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Review requests and upload documents for employees</p>
        </div>
        <button onClick={load} className="btn btn-secondary btn-sm gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="page-content space-y-4">

        {/* Summary row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total',     count: requests.length, color: 'text-gray-700 dark:text-gray-300' },
            { label: 'Pending',   count: pending,          color: 'text-amber-600' },
            { label: 'Fulfilled', count: fulfilled,        color: 'text-green-600' },
          ].map(({ label, count, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Pending alert */}
        {pending > 0 && tab !== 'Pending' && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 cursor-pointer"
            onClick={() => setTab('Pending')}
          >
            <FileText size={15} className="text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              {pending} pending request{pending > 1 ? 's' : ''} awaiting document upload
            </p>
            <span className="ml-auto text-xs font-semibold text-amber-700 dark:text-amber-400 underline underline-offset-2">
              View
            </span>
          </div>
        )}

        {/* Filter row */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                  tab === t
                    ? 'text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
                style={tab === t ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent-dark)' } : {}}
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
          <div className="relative ml-auto">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employee or doc type…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 w-52"
              style={{ '--tw-ring-color': 'var(--accent)' }}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="card p-10 text-center text-sm text-gray-400">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <FileText size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {search ? 'No matching requests' : tab === 'All' ? 'No document requests yet' : `No ${tab.toLowerCase()} requests`}
              </p>
              <p className="text-xs text-gray-400 mt-1">Requests raised by employees will appear here</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Document Type</th>
                    <th>Requested On</th>
                    <th>Remarks</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{r.employee_name}</div>
                        <div className="text-[11px] text-gray-400">{r.employee_code}</div>
                      </td>
                      <td className="font-medium text-gray-800 dark:text-gray-200">{r.doc_type}</td>
                      <td>
                        <div className="text-xs text-gray-500">{r.requested_at}</div>
                        {r.fulfilled_at && (
                          <div className="text-[11px] text-green-600 mt-0.5">Fulfilled {r.fulfilled_at}</div>
                        )}
                      </td>
                      <td className="text-gray-500 text-xs max-w-[160px] truncate">{r.remarks || '—'}</td>
                      <td><Badge text={r.status} /></td>
                      <td>
                        {r.status === 'Pending' ? (
                          <button
                            onClick={() => handleUploadClick(r.id)}
                            disabled={uploading === r.id}
                            className="btn btn-primary btn-xs gap-1 disabled:opacity-60"
                          >
                            <Upload size={11} />
                            {uploading === r.id ? 'Uploading…' : 'Upload'}
                          </button>
                        ) : r.file_url ? (
                          <a
                            href={r.file_url}
                            download={r.file_name || 'document'}
                            className="btn btn-secondary btn-xs gap-1"
                          >
                            <Download size={11} /> Download
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input for uploads */}
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
