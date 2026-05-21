import { useState, useEffect } from 'react';
import { api } from '../api';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import DatePicker from '../components/DatePicker';
import { Plus, Megaphone, Trash2, ToggleLeft, ToggleRight, AlertCircle, Info, ChevronUp } from 'lucide-react';

const PRIORITY_META = {
  High:   { label: 'High',   dot: 'bg-red-500',   badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',   top: 'border-t-red-400' },
  Medium: { label: 'Medium', dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800', top: 'border-t-amber-400' },
  Low:    { label: 'Low',    dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800', top: 'border-t-blue-400' },
};

const PRIORITY_ICON = { High: AlertCircle, Medium: Megaphone, Low: Info };

export default function Announcements({ toast }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({ priority: 'Medium' });
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true);
    try { setRows(await api('GET', '/api/hrm/announcements')); }
    catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const f = v => setForm(p => ({ ...p, ...v }));

  const save = async () => {
    if (!form.title || !form.content) return toast('Title and content required', 'warning');
    try {
      await api('POST', '/api/hrm/announcements', form);
      toast('Announcement posted', 'success');
      setModal(false); setForm({ priority: 'Medium' }); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const toggle = async (id, is_active) => {
    try { await api('PUT', `/api/hrm/announcements/${id}`, { is_active: !is_active }); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const del = async id => {
    if (!confirm('Delete this announcement?')) return;
    try { await api('DELETE', `/api/hrm/announcements/${id}`); toast('Deleted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const toggleExpand = id => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const active   = rows.filter(r => r.is_active);
  const inactive = rows.filter(r => !r.is_active);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Announcements</h1>
        <button onClick={() => setModal(true)} className="btn btn-primary btn-sm gap-1.5">
          <Plus size={13} /> New Announcement
        </button>
      </div>

      <div className="page-content space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse space-y-3">
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Megaphone size={36} className="text-gray-200 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-500">No announcements yet</p>
              <button onClick={() => setModal(true)} className="btn btn-primary btn-sm mt-3 gap-1.5">
                <Plus size={13} /> Post First Announcement
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Active announcements */}
            {active.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Active · {active.length}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {active.map(a => {
                    const meta = PRIORITY_META[a.priority] || PRIORITY_META.Medium;
                    const Icon = PRIORITY_ICON[a.priority] || Megaphone;
                    const isLong = a.content && a.content.length > 120;
                    const isExp = expanded[a.id];
                    return (
                      <div key={a.id} className={`card flex flex-col overflow-hidden border-t-4 ${meta.top}`}>
                        <div className="p-4 flex-1">
                          {/* Priority badge + title */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <Icon size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{a.title}</p>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${meta.badge}`}>
                              {a.priority}
                            </span>
                          </div>

                          {/* Content */}
                          <p className={`text-xs text-gray-600 dark:text-gray-400 leading-relaxed ${isLong && !isExp ? 'line-clamp-3' : ''}`}>
                            {a.content}
                          </p>
                          {isLong && (
                            <button onClick={() => toggleExpand(a.id)} className="text-[11px] text-[var(--accent)] mt-1 flex items-center gap-0.5">
                              {isExp ? <><ChevronUp size={11} /> Show less</> : 'Read more'}
                            </button>
                          )}

                          {/* Meta */}
                          <div className="text-[11px] text-gray-400 mt-3 space-y-0.5">
                            <p>Posted {new Date(a.created_at).toLocaleDateString('en-IN')}{a.created_by ? ` by ${a.created_by}` : ''}</p>
                            {a.expires_on && <p>Expires {new Date(a.expires_on).toLocaleDateString('en-IN')}</p>}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0 border-t border-gray-100 dark:border-gray-800">
                          <button
                            onClick={() => toggle(a.id, a.is_active)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                          >
                            <ToggleLeft size={13} /> Deactivate
                          </button>
                          <div className="w-px h-8 bg-gray-100 dark:bg-gray-800" />
                          <button
                            onClick={() => del(a.id)}
                            className="flex items-center justify-center w-12 py-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inactive announcements */}
            {inactive.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Inactive · {inactive.length}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inactive.map(a => {
                    const meta = PRIORITY_META[a.priority] || PRIORITY_META.Medium;
                    return (
                      <div key={a.id} className="card p-4 opacity-50 hover:opacity-80 transition-opacity flex flex-col gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{a.title}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggle(a.id, a.is_active)}
                            className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
                          >
                            <ToggleRight size={13} /> Activate
                          </button>
                          <button onClick={() => del(a.id)} className="ml-auto text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={modal} title="New Announcement" onClose={() => setModal(false)} onSave={save} saveLabel="Post">
        <FormSection title="Announcement Details">
          <FormGrid cols={1}>
            <Field label="Title" required>
              <input className="form-input" value={form.title || ''} onChange={e => f({ title: e.target.value })} placeholder="Announcement title" />
            </Field>
            <Field label="Content" required>
              <textarea className="form-textarea" rows={4} value={form.content || ''} onChange={e => f({ content: e.target.value })} placeholder="Write your announcement…" />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Priority">
              <select className="form-select" value={form.priority || 'Medium'} onChange={e => f({ priority: e.target.value })}>
                {['Low', 'Medium', 'High'].map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Expires On (optional)">
              <DatePicker value={form.expires_on || ''} onChange={v => f({ expires_on: v })} placeholder="Select expiry date" />
            </Field>
            <Field label="Posted By">
              <input className="form-input" value={form.created_by || ''} onChange={e => f({ created_by: e.target.value })} placeholder="e.g. HR Team" />
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>
    </>
  );
}
