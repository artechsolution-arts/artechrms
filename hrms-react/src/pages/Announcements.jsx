import { useState, useEffect } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import { Plus, Megaphone, Trash2 } from 'lucide-react';

const PRIORITY_COLOR = { High: 'bg-red-50 border-l-4 border-red-400', Medium: 'bg-amber-50 border-l-4 border-amber-400', Low: 'bg-blue-50 border-l-4 border-blue-300' };

export default function Announcements({ toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ priority: 'Medium' });

  const load = async () => { setLoading(true); try { setRows(await api('GET', '/api/hrm/announcements')); } catch(e){ toast(e.message,'error'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const f = v => setForm(p => ({ ...p, ...v }));

  const save = async () => {
    if (!form.title || !form.content) return toast('Title and content required', 'warning');
    try { await api('POST', '/api/hrm/announcements', form); toast('Announcement posted','success'); setModal(false); setForm({ priority:'Medium' }); load(); }
    catch(e) { toast(e.message,'error'); }
  };

  const toggle = async (id, is_active) => {
    try { await api('PUT', `/api/hrm/announcements/${id}`, { is_active: !is_active }); load(); }
    catch(e) { toast(e.message,'error'); }
  };

  const del = async id => {
    if (!confirm('Delete this announcement?')) return;
    try { await api('DELETE', `/api/hrm/announcements/${id}`); toast('Deleted','success'); load(); }
    catch(e) { toast(e.message,'error'); }
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Announcements</h1>
        <button onClick={() => setModal(true)} className="btn btn-primary btn-sm gap-1.5"><Plus size={13}/>New Announcement</button>
      </div>
      <div className="page-content space-y-3">
        {loading ? (
          <div className="card p-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="card"><div className="empty-state"><Megaphone size={36} className="text-gray-200 mb-2"/><p className="text-sm text-gray-500">No announcements yet</p></div></div>
        ) : rows.map(a => (
          <div key={a.id} className={`rounded-lg p-4 ${PRIORITY_COLOR[a.priority] || 'bg-gray-50 border-l-4 border-gray-300'} ${!a.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 text-sm">{a.title}</span>
                  <Badge text={a.priority} />
                  {!a.is_active && <Badge text="Inactive" />}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{a.content}</p>
                <div className="text-xs text-gray-400 mt-2">
                  Posted {new Date(a.created_at).toLocaleDateString('en-IN')}
                  {a.created_by && ` by ${a.created_by}`}
                  {a.expires_on && ` · Expires ${new Date(a.expires_on).toLocaleDateString('en-IN')}`}
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => toggle(a.id, a.is_active)} className="btn btn-secondary btn-xs">
                  {a.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => del(a.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={13}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} title="New Announcement" onClose={() => setModal(false)} onSave={save} saveLabel="Post">
        <FormSection title="Announcement Details">
          <FormGrid cols={1}>
            <Field label="Title" required>
              <input className="form-input" value={form.title||''} onChange={e => f({title:e.target.value})} placeholder="Announcement title" />
            </Field>
            <Field label="Content" required>
              <textarea className="form-textarea" rows={4} value={form.content||''} onChange={e => f({content:e.target.value})} placeholder="Write your announcement…"/>
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Priority">
              <select className="form-select" value={form.priority||'Medium'} onChange={e => f({priority:e.target.value})}>
                {['Low','Medium','High'].map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Expires On (optional)">
              <input type="date" className="form-input" value={form.expires_on||''} onChange={e => f({expires_on:e.target.value})}/>
            </Field>
            <Field label="Posted By">
              <input className="form-input" value={form.created_by||''} onChange={e => f({created_by:e.target.value})} placeholder="e.g. HR Team"/>
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>
    </>
  );
}
