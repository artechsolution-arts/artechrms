import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import DatePicker from '../components/DatePicker';
import { Plus, RefreshCw, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

export default function Leaves({ toast }) {
  const [rows, setRows] = useState([]);
  const [types, setTypes] = useState([]);
  const [emps, setEmps] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});

  const load = useCallback(async (st = statusFilter) => {
    setLoading(true);
    try {
      let url = '/api/leaves?';
      if (st) url += `status=${st}`;
      setRows(await api('GET', url));
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => {
    let initStatus = '';
    try {
      const pending = sessionStorage.getItem('nav-filter');
      if (pending) {
        sessionStorage.removeItem('nav-filter');
        const f = JSON.parse(pending);
        if (f.leaveStatus) { initStatus = f.leaveStatus; setStatusFilter(f.leaveStatus); }
      }
    } catch {}
    Promise.all([api('GET', '/api/leaves/types'), api('GET', '/api/employees?all=true')])
      .then(([t, e]) => { setTypes(t); setEmps(e); load(initStatus || statusFilter); })
      .catch(e => toast(e.message, 'error'));
  }, []);
  useRefreshOnFocus(load);

  const f = v => setForm(prev => ({ ...prev, ...v }));

  const save = async () => {
    if (!form.employee_id || !form.leave_type_id || !form.from_date || !form.to_date)
      return toast('All required fields must be filled', 'warning');
    try {
      await api('POST', '/api/leaves', {
        employee_id: parseInt(form.employee_id), leave_type_id: parseInt(form.leave_type_id),
        from_date: form.from_date, to_date: form.to_date, reason: form.reason || null,
      });
      toast('Leave applied', 'success'); setModal(false); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const approve = async id => {
    try { await api('PUT', `/api/leaves/${id}/approve`); toast('Approved', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const reject = async id => {
    try { await api('PUT', `/api/leaves/${id}/reject`); toast('Rejected', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const del = async id => {
    if (!confirm('Delete this leave application?')) return;
    try { await api('DELETE', `/api/leaves/${id}`); toast('Deleted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Leave Applications</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={() => { setForm({}); setModal(true); }} className="btn btn-primary btn-sm gap-1.5"><Plus size={13} /> Apply Leave</button>
        </div>
      </div>

      <div className="page-content">
        <div className="card mb-4">
          <div className="p-3">
            <select className="form-select w-auto" value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); load(e.target.value); }}>
              <option value="">All Status</option>
              <option>Pending</option><option>Approved</option><option>Rejected</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Leave Type</th><th>From</th><th>To</th>
                  <th>Days</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📅</div>
                      <p className="text-sm text-gray-500">No leave applications</p>
                    </div>
                  </td></tr>
                ) : rows.map(l => (
                  <tr key={l.id}>
                    <td className="font-semibold text-gray-900">{l.employee_name}</td>
                    <td className="text-gray-600">{l.leave_type}</td>
                    <td className="text-gray-600">{l.from_date}</td>
                    <td className="text-gray-600">{l.to_date}</td>
                    <td className="text-gray-600">{l.total_days}</td>
                    <td><Badge text={l.status} /></td>
                    <td>
                      <div className="flex items-center gap-1 flex-wrap">
                        {l.status === 'Pending' && (
                          <>
                            <button onClick={() => approve(l.id)} className="btn btn-success btn-xs gap-1">
                              <CheckCircle size={11} /> Approve
                            </button>
                            <button onClick={() => reject(l.id)} className="btn btn-danger btn-xs gap-1">
                              <XCircle size={11} /> Reject
                            </button>
                          </>
                        )}
                        <button onClick={() => del(l.id)} className="btn btn-secondary btn-xs gap-1">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modal} title="Apply Leave" onClose={() => setModal(false)} onSave={save} saveLabel="Apply Leave">
        <FormSection title="Leave Details">
          <FormGrid>
            <Field label="Employee" required>
              <select className="form-select" value={form.employee_id || ''} onChange={e => f({ employee_id: e.target.value })}>
                <option value="">Select Employee</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </Field>
            <Field label="Leave Type" required>
              <select className="form-select" value={form.leave_type_id || ''} onChange={e => f({ leave_type_id: e.target.value })}>
                <option value="">Select Type</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="From Date" required>
              <DatePicker value={form.from_date || ''} onChange={v => f({ from_date: v })} placeholder="Select from date" />
            </Field>
            <Field label="To Date" required>
              <DatePicker value={form.to_date || ''} onChange={v => f({ to_date: v })} placeholder="Select to date" min={form.from_date} />
            </Field>
            <Field label="Reason" full>
              <textarea className="form-textarea" rows={3} value={form.reason || ''} onChange={e => f({ reason: e.target.value })} placeholder="Reason for leave..." />
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>
    </>
  );
}
