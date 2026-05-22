import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { fmtDate } from '../utils/date';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import DatePicker from '../components/DatePicker';
import Select from '../components/Select';
import { Plus, RefreshCw, Clock } from 'lucide-react';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

export default function Attendance({ toast }) {
  const [rows, setRows] = useState([]);
  const [emps, setEmps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({});
  const [editForm, setEditForm] = useState({});

  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api('GET', '/api/leaves/attendance')); }
    catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    api('GET', '/api/employees?all=true').then(e => setEmps(e)).catch(() => {});
    load();
  }, [load]);
  useRefreshOnFocus(load);

  const f = v => setForm(prev => ({ ...prev, ...v }));
  const ef = v => setEditForm(prev => ({ ...prev, ...v }));

  const save = async () => {
    if (!form.employee_id) return toast('Select employee', 'warning');
    try {
      await api('POST', '/api/leaves/attendance', {
        employee_id: parseInt(form.employee_id),
        date: form.date || today,
        status: form.status || 'Present',
        in_time: form.in_time || null,
        out_time: form.out_time || null,
      });
      toast('Attendance marked', 'success'); setModal(false); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const openEdit = row => {
    setEditRow(row);
    setEditForm({
      status: row.status,
      in_time: row.in_time || '',
      out_time: row.out_time || '',
    });
    setEditModal(true);
  };

  const saveEdit = async () => {
    try {
      await api('PUT', `/api/leaves/attendance/${editRow.id}`, {
        status: editForm.status,
        in_time: editForm.in_time || null,
        out_time: editForm.out_time || null,
      });
      toast('Attendance updated', 'success'); setEditModal(false); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Attendance</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={() => { setForm({ date: today, status: 'Present' }); setModal(true); }} className="btn btn-primary btn-sm gap-1.5">
            <Plus size={13} /> Mark Attendance
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Date</th><th>Status</th>
                  <th>In Time</th><th>Out Time</th><th>Hours</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">⏰</div>
                      <p className="text-sm text-gray-500">No attendance records</p>
                    </div>
                  </td></tr>
                ) : rows.map(a => (
                  <tr key={a.id}>
                    <td className="font-semibold text-gray-900">{a.employee_name}</td>
                    <td className="text-gray-600">{fmtDate(a.date)}</td>
                    <td><Badge text={a.status} /></td>
                    <td className="text-gray-600">{a.in_time || '—'}</td>
                    <td className="text-gray-600">{a.out_time || '—'}</td>
                    <td className="text-gray-600">{a.working_hours || 0}h</td>
                    <td>
                      <button onClick={() => openEdit(a)} className="btn btn-secondary btn-xs gap-1">
                        <Clock size={11} /> Edit Times
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      <Modal open={modal} title="Mark Attendance" onClose={() => setModal(false)} onSave={save} saveLabel="Mark Attendance">
        <FormSection title="Attendance Details">
          <FormGrid>
            <Field label="Employee" required>
              <Select
                value={form.employee_id || ''}
                onChange={v => f({ employee_id: v })}
                options={emps.map(e => ({ value: String(e.id), label: e.full_name }))}
                placeholder="Select employee"
                searchable
              />
            </Field>
            <Field label="Date" required>
              <DatePicker value={form.date || today} onChange={v => f({ date: v })} placeholder="Select date" />
            </Field>
            <Field label="Status">
              <Select
                value={form.status || 'Present'}
                onChange={v => f({ status: v })}
                options={['Present', 'Absent', 'On Leave', 'Half Day', 'WFH']}
              />
            </Field>
            <Field label="In Time">
              <input type="time" className="form-input" value={form.in_time || ''} onChange={e => f({ in_time: e.target.value })} />
            </Field>
            <Field label="Out Time">
              <input type="time" className="form-input" value={form.out_time || ''} onChange={e => f({ out_time: e.target.value })} />
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>

      {/* Edit In/Out Times Modal */}
      {editRow && (
        <Modal open={editModal} title={`Edit Attendance — ${editRow.employee_name} (${editRow.date})`} onClose={() => setEditModal(false)} onSave={saveEdit} saveLabel="Update">
          <FormSection title="Update Times">
            <FormGrid>
              <Field label="Status">
                <Select
                  value={editForm.status || 'Present'}
                  onChange={v => ef({ status: v })}
                  options={['Present', 'Absent', 'On Leave', 'Half Day', 'WFH']}
                />
              </Field>
              <div />
              <Field label="In Time (Check-In)">
                <input type="time" className="form-input" value={editForm.in_time || ''} onChange={e => ef({ in_time: e.target.value })} />
              </Field>
              <Field label="Out Time (Check-Out)">
                <input type="time" className="form-input" value={editForm.out_time || ''} onChange={e => ef({ out_time: e.target.value })} />
              </Field>
            </FormGrid>
            {editForm.in_time && editForm.out_time && (() => {
              try {
                const [ih, im] = editForm.in_time.split(':').map(Number);
                const [oh, om] = editForm.out_time.split(':').map(Number);
                const hours = ((oh * 60 + om) - (ih * 60 + im)) / 60;
                if (hours > 0) return (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 font-medium">
                    Working hours: {hours.toFixed(2)}h
                  </div>
                );
              } catch {}
              return null;
            })()}
          </FormSection>
        </Modal>
      )}
    </>
  );
}
