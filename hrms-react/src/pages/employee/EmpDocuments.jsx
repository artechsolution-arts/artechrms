import { useState, useEffect } from 'react';
import { api } from '../../api';
import Modal, { FormSection, FormGrid, Field } from '../../components/Modal';
import Select from '../../components/Select';
import { Plus, Download, FileText, CheckCircle2, Clock, RefreshCw, X, FileCheck } from 'lucide-react';

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

const STATUS_TABS = ['All', 'Pending', 'Fulfilled'];

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

function RequestCard({ r, onDownload }) {
  const isFulfilled = r.status === 'Fulfilled';
  return (
    <div className={`card p-4 flex flex-col gap-3 transition-shadow hover:shadow-md ${
      isFulfilled ? 'border-green-100 dark:border-green-900/40' : ''
    }`}>
      {/* Icon + type */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${
            isFulfilled
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
          }`}>
            {isFulfilled ? <FileCheck size={18} /> : <FileText size={18} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{r.doc_type}</p>
            <p className="text-xs text-gray-400 mt-0.5">Requested {r.requested_at}</p>
          </div>
        </div>
        <StatusChip status={r.status} />
      </div>

      {/* Remarks */}
      {r.remarks && (
        <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 line-clamp-2">
          {r.remarks}
        </p>
      )}

      {/* Footer */}
      <div className="pt-1 mt-auto">
        {isFulfilled && r.file_url ? (
          <a
            href={r.file_url}
            download={r.file_name || 'document'}
            className="flex items-center justify-center gap-1.5 w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Download size={13} /> Download Document
          </a>
        ) : isFulfilled ? (
          <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-green-600 font-medium">
            <CheckCircle2 size={13} /> Fulfilled {r.fulfilled_at}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 py-1.5 text-xs text-amber-600 dark:text-amber-400">
            <Clock size={12} /> Awaiting HR upload
          </div>
        )}
      </div>
    </div>
  );
}

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
  const readyNow  = requests.filter(r => r.status === 'Fulfilled' && r.file_url).length;

  const visible = tab === 'All' ? requests : requests.filter(r => r.status === tab);

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
            <Plus size={13} /> New Request
          </button>
        </div>
      </div>

      <div className="page-content space-y-4">

        {/* Ready-to-download banner */}
        {readyNow > 0 && (
          <div
            onClick={() => setTab('Fulfilled')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 cursor-pointer hover:shadow-sm transition-shadow"
          >
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                {readyNow === 1 ? '1 document ready to download' : `${readyNow} documents ready to download`}
              </p>
              <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">Click to view fulfilled requests</p>
            </div>
            <span className="ml-auto text-xs font-semibold text-green-700 dark:text-green-400">View →</span>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total',     count: requests.length, color: 'text-gray-700 dark:text-gray-300',  bg: 'bg-gray-50 dark:bg-gray-800' },
            { label: 'Pending',   count: pending,          color: 'text-amber-600',                   bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Fulfilled', count: fulfilled,        color: 'text-green-600',                   bg: 'bg-green-50 dark:bg-green-900/20' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={`card px-4 py-3 text-center ${bg}`}>
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Status tabs */}
        <div className="flex gap-1">
          {STATUS_TABS.map(t => {
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

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse space-y-3">
                <div className="flex gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg" />
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
                {tab === 'All' ? 'No document requests yet' : `No ${tab.toLowerCase()} requests`}
              </p>
              {tab === 'All' && (
                <>
                  <p className="text-xs text-gray-400 mt-1 mb-3">Request official letters or certificates from HR</p>
                  <button
                    onClick={() => { setForm({}); setModal(true); }}
                    className="btn btn-primary btn-sm gap-1.5"
                  >
                    <Plus size={13} /> New Request
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map(r => <RequestCard key={r.id} r={r} />)}
          </div>
        )}
      </div>

      <Modal
        open={modal}
        title="Request a Document"
        onClose={() => { setModal(false); setForm({}); }}
        onSave={submit}
        saving={saving}
        saveLabel={saving ? 'Submitting…' : 'Submit Request'}
      >
        <FormSection title="What document do you need?">
          <FormGrid>
            <Field label="Document Type" required full>
              <Select
                value={form.doc_type || ''}
                onChange={v => setForm(p => ({ ...p, doc_type: v }))}
                options={DOC_TYPES.map(t => ({ value: t, label: t }))}
                placeholder="Select document type…"
              />
            </Field>
            <Field label="Additional Remarks" full>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Any specific instructions or purpose for HR…"
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
