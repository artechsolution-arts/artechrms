import { useState, useEffect } from 'react';
import { api } from '../../api';
import Badge from '../../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../../components/Modal';
import { Plus, Download, FileText } from 'lucide-react';

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

export default function EmpDocuments({ toast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const total     = requests.length;
  const pending   = requests.filter(r => r.status === 'Pending').length;
  const fulfilled = requests.filter(r => r.status === 'Fulfilled').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Documents</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Request official documents from HR</p>
        </div>
        <button
          onClick={() => { setForm({}); setModal(true); }}
          className="btn btn-primary btn-sm gap-1.5"
        >
          <Plus size={13} /> Request Document
        </button>
      </div>

      <div className="page-content space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Requests', count: total,     color: 'text-gray-700 dark:text-gray-300' },
            { label: 'Pending',        count: pending,   color: 'text-amber-600' },
            { label: 'Fulfilled',      count: fulfilled, color: 'text-green-600' },
          ].map(({ label, count, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="card p-10 text-center text-sm text-gray-400">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <FileText size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">No document requests yet</p>
              <p className="text-xs text-gray-400 mt-1">Click "Request Document" to ask HR for an official document</p>
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
                    <th>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td className="font-medium text-gray-900">{r.doc_type}</td>
                      <td className="text-gray-500 text-xs">{r.requested_at}</td>
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
                          <span className="text-xs text-gray-400">Awaiting upload</span>
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
