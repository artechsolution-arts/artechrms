import { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import Badge from '../../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../../components/Modal';
import { Plus, Download, FileText, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

const DOC_TYPES = [
  'Salary Certificate',
  'Experience Letter',
  'Offer Letter',
  'Relieving Letter',
  'No Objection Certificate (NOC)',
  'Bank Verification Letter',
  'Payslip Copy',
  'Other',
];

const TABS = ['All', 'Pending', 'Fulfilled'];

export default function EmpDocuments({ toast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRequests(await api('GET', '/api/portal/documents'));
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.doc_type) return toast('Select a document type', 'warning');
    setSaving(true);
    try {
      await api('POST', '/api/portal/documents', { doc_type: form.doc_type, remarks: form.remarks || null });
      toast('Request submitted. HR will upload the document shortly.', 'success');
      setModal(false);
      setForm({});
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const pending   = requests.filter(r => r.status === 'Pending').length;
  const fulfilled = requests.filter(r => r.status === 'Fulfilled').length;

  const visible = tab === 'All' ? requests
    : requests.filter(r => r.status === tab);

  const readyToDownload = requests.filter(r => r.status === 'Fulfilled' && r.file_url);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Documents</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Request official documents from HR</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn btn-secondary btn-sm gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => { setForm({}); setModal(true); }}
            className="btn btn-primary btn-sm gap-1.5"
          >
            <Plus size={13} /> Request Document
          </button>
        </div>
      </div>

      <div className="page-content space-y-4">

        {/* Ready-to-download banner */}
        {readyToDownload.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">
              {readyToDownload.length === 1
                ? '1 document is ready to download'
                : `${readyToDownload.length} documents are ready to download`}
            </p>
            <button
              onClick={() => setTab('Fulfilled')}
              className="ml-auto text-xs font-semibold text-green-700 dark:text-green-400 underline underline-offset-2"
            >
              View
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
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

        {/* Filter tabs */}
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                tab === t
                  ? 'text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
              }`}
              style={tab === t ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent-dark)' } : {}}
            >
              {t}
              {t === 'Pending' && pending > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === 'Pending' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
                }`}>{pending}</span>
              )}
              {t === 'Fulfilled' && fulfilled > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === 'Fulfilled' ? 'bg-white/25 text-white' : 'bg-green-100 text-green-700'
                }`}>{fulfilled}</span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="card p-10 text-center text-sm text-gray-400">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <FileText size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {tab === 'All' ? 'No document requests yet' : `No ${tab.toLowerCase()} requests`}
              </p>
              {tab === 'All' && (
                <p className="text-xs text-gray-400 mt-1">Click "Request Document" to ask HR for an official document</p>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>Requested On</th>
                    <th>Remarks</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(r => (
                    <tr key={r.id} className={r.status === 'Fulfilled' && r.file_url ? 'bg-green-50/30 dark:bg-green-900/10' : ''}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{r.doc_type}</span>
                        </div>
                      </td>
                      <td>
                        <div className="text-xs text-gray-500">{r.requested_at}</div>
                        {r.fulfilled_at && (
                          <div className="text-[11px] text-green-600 mt-0.5">Fulfilled {r.fulfilled_at}</div>
                        )}
                      </td>
                      <td className="text-gray-500 text-xs max-w-[180px] truncate">{r.remarks || '—'}</td>
                      <td><Badge text={r.status} /></td>
                      <td>
                        {r.status === 'Fulfilled' && r.file_url ? (
                          <a
                            href={r.file_url}
                            download={r.file_name || 'document'}
                            className="btn btn-success btn-xs gap-1"
                          >
                            <Download size={11} /> Download
                          </a>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Clock size={11} /> Awaiting upload
                          </span>
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

      <Modal
        open={modal}
        title="Request a Document"
        onClose={() => { setModal(false); setForm({}); }}
        onSave={submit}
        saveLabel={saving ? 'Submitting…' : 'Submit Request'}
      >
        <FormSection title="Document Details">
          <FormGrid>
            <Field label="Document Type" required full>
              <select
                className="form-select"
                value={form.doc_type || ''}
                onChange={e => setForm(p => ({ ...p, doc_type: e.target.value }))}
              >
                <option value="">Select document type</option>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Additional Remarks" full>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Any specific details or instructions for HR…"
                value={form.remarks || ''}
                onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
              />
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>
    </>
  );
}
