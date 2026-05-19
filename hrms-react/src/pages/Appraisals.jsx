import { useState, useEffect } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import { Plus, RefreshCw, Trash2, Send } from 'lucide-react';

export default function Appraisals({ toast }) {
  const [rows, setRows] = useState([]);
  const [emps, setEmps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [goals, setGoals] = useState([{ title: '', score: 0 }, { title: '', score: 0 }, { title: '', score: 0 }]);

  const load = async () => {
    setLoading(true);
    try {
      const [a, e] = await Promise.all([api('GET', '/api/appraisals'), api('GET', '/api/employees')]);
      setRows(a); setEmps(e);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const f = v => setForm(prev => ({ ...prev, ...v }));

  const save = async () => {
    if (!form.employee_id || !form.period?.trim()) return toast('Employee and period required', 'warning');
    try {
      await api('POST', '/api/appraisals', {
        employee_id: parseInt(form.employee_id), period: form.period,
        goals: goals.filter(g => g.title.trim()).map(g => ({ title: g.title, score: parseFloat(g.score) || 0 })),
        reviewer_comments: form.reviewer_comments || null,
      });
      toast('Appraisal created', 'success'); setModal(false); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const submit = async id => {
    try { await api('PUT', `/api/appraisals/${id}/submit`); toast('Submitted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const del = async id => {
    if (!confirm('Delete this appraisal?')) return;
    try { await api('DELETE', `/api/appraisals/${id}`); toast('Deleted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const updateGoal = (i, field, val) => {
    const g = [...goals]; g[i] = { ...g[i], [field]: val }; setGoals(g);
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Appraisals</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={() => {
            setForm({ period: `Annual ${new Date().getFullYear()}` });
            setGoals([{ title: '', score: 0 }, { title: '', score: 0 }, { title: '', score: 0 }]);
            setModal(true);
          }} className="btn btn-primary btn-sm gap-1.5"><Plus size={13} /> New Appraisal</button>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Employee</th><th>Period</th><th>Score</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">⭐</div>
                      <p className="text-sm text-gray-500">No appraisals yet</p>
                    </div>
                  </td></tr>
                ) : rows.map(a => (
                  <tr key={a.id}>
                    <td className="font-semibold text-gray-900">{a.employee_name}</td>
                    <td className="text-gray-600">{a.period}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2E6BE6] rounded-full"
                            style={{ width: `${Math.min(a.total_score / 5 * 100, 100)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-sm text-gray-700">{a.total_score}</span>
                      </div>
                    </td>
                    <td><Badge text={a.status} /></td>
                    <td>
                      <div className="flex items-center gap-1">
                        {a.status === 'Draft' && (
                          <button onClick={() => submit(a.id)} className="btn btn-primary btn-xs gap-1"><Send size={11} /> Submit</button>
                        )}
                        <button onClick={() => del(a.id)} className="btn btn-danger btn-xs gap-1"><Trash2 size={11} /> Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modal} title="New Appraisal" onClose={() => setModal(false)} onSave={save} saveLabel="Save Appraisal">
        <FormSection title="Appraisal Details">
          <FormGrid>
            <Field label="Employee" required>
              <select className="form-select" value={form.employee_id || ''} onChange={e => f({ employee_id: e.target.value })}>
                <option value="">Select Employee</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </Field>
            <Field label="Period" required>
              <input className="form-input" value={form.period || ''} onChange={e => f({ period: e.target.value })} placeholder="e.g. Q1 2024, Annual 2024" />
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection title="Goals / KRAs">
          <div className="space-y-2">
            {goals.map((g, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px] gap-2">
                <input
                  className="form-input"
                  placeholder={`Goal / KRA ${i + 1}`}
                  value={g.title}
                  onChange={e => updateGoal(i, 'title', e.target.value)}
                />
                <input
                  type="number" min={0} max={5} step={0.5}
                  className="form-input"
                  placeholder="Score 0-5"
                  value={g.score}
                  onChange={e => updateGoal(i, 'score', e.target.value)}
                />
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setGoals([...goals, { title: '', score: 0 }])}>
              + Add Goal
            </button>
          </div>
        </FormSection>
        <FormSection title="Reviewer Feedback">
          <Field label="Reviewer Comments">
            <textarea className="form-textarea" rows={3} value={form.reviewer_comments || ''} onChange={e => f({ reviewer_comments: e.target.value })} placeholder="Manager feedback..." />
          </Field>
        </FormSection>
      </Modal>
    </>
  );
}
