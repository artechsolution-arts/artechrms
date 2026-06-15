import { useState, useEffect } from 'react';
import { api } from '../api';
import { fmtDate } from '../utils/date';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import { Plus, RefreshCw } from 'lucide-react';
import Select from '../components/Select';

export default function Applicants({ toast }) {
  const [rows, setRows] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const f = v => setForm(prev => ({ ...prev, ...v }));

  const load = async (st = statusFilter) => {
    setLoading(true);
    try {
      let url = '/api/recruitment/applicants?';
      if (st) url += `status=${st}`;
      setRows(await api('GET', url));
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    api('GET', '/api/recruitment/openings?status=Open').then(o => setOpenings(o)).catch(() => {});
    load();
  }, []);

  const save = async () => {
    if (!form.name?.trim() || !form.email?.trim() || !form.job_opening_id)
      return toast('Name, email and job opening required', 'warning');
    try {
      await api('POST', '/api/recruitment/applicants', {
        name: form.name, email: form.email,
        phone: form.phone || null,
        job_opening_id: parseInt(form.job_opening_id),
        cover_letter: form.cover_letter || null,
      });
      toast('Applicant added', 'success'); setModal(false); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const updateStatus = async (id, status) => {
    try { await api('PUT', `/api/recruitment/applicants/${id}/status?status=${status}`); toast('Status updated', 'success'); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Applicants</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={() => { setForm({}); setModal(true); }} className="btn btn-primary btn-sm gap-1.5"><Plus size={13} /> Add Applicant</button>
        </div>
      </div>

      <div className="page-content">
        <div className="card mb-4">
          <div className="p-3">
            <Select
              value={statusFilter}
              onChange={v => { setStatusFilter(v); load(v); }}
              options={[{ value: '', label: 'All Status' }, 'Applied', 'Screening', 'Interview', 'Offered', 'Hired', 'Rejected']}
              size="sm"
              className="w-44"
            />
          </div>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Applicant</th><th>Job Opening</th><th>Status</th><th>Applied On</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <p className="text-sm text-gray-500">No applicants yet</p>
                    </div>
                  </td></tr>
                ) : rows.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="font-semibold text-gray-900 dark:text-white">{a.name}</div>
                      <div className="text-xs text-gray-400">{a.email}</div>
                    </td>
                    <td className="text-gray-600 dark:text-gray-300">{a.job_title}</td>
                    <td><Badge text={a.status} /></td>
                    <td className="text-gray-500 dark:text-gray-400">{fmtDate(a.created_at)}</td>
                    <td>
                      <Select
                        value={a.status}
                        onChange={v => updateStatus(a.id, v)}
                        options={['Applied', 'Screening', 'Interview', 'Offered', 'Hired', 'Rejected']}
                        size="sm"
                        className="w-36"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modal} title="Add Applicant" onClose={() => setModal(false)} onSave={save} saveLabel="Add Applicant">
        <FormSection title="Personal Details">
          <FormGrid>
            <Field label="Full Name" required>
              <input className="form-input" value={form.name || ''} onChange={e => f({ name: e.target.value })} placeholder="Applicant name" />
            </Field>
            <Field label="Email" required>
              <input type="email" className="form-input" value={form.email || ''} onChange={e => f({ email: e.target.value })} placeholder="Email" />
            </Field>
            <Field label="Phone">
              <input className="form-input" value={form.phone || ''} onChange={e => f({ phone: e.target.value })} placeholder="Phone number" />
            </Field>
            <Field label="Job Opening" required>
              <Select
                value={form.job_opening_id || ''}
                onChange={v => f({ job_opening_id: v })}
                options={openings.map(o => ({ value: String(o.id), label: o.title }))}
                placeholder="Select"
                searchable
              />
            </Field>
            <Field label="Cover Letter" full>
              <textarea className="form-textarea" rows={4} value={form.cover_letter || ''} onChange={e => f({ cover_letter: e.target.value })} placeholder="Cover letter..." />
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>
    </>
  );
}
