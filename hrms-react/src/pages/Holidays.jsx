import { useState, useEffect } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import { Plus, CalendarDays, Trash2 } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Holidays({ toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ holiday_type: 'Public' });

  const load = async () => {
    setLoading(true);
    try { setRows(await api('GET', `/api/hrm/holidays?year=${year}`)); }
    catch(e) { toast(e.message,'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [year]);
  const f = v => setForm(p => ({ ...p, ...v }));

  const save = async () => {
    if (!form.name || !form.date) return toast('Name and date required', 'warning');
    try { await api('POST', '/api/hrm/holidays', form); toast('Holiday added','success'); setModal(false); setForm({holiday_type:'Public'}); load(); }
    catch(e) { toast(e.message,'error'); }
  };

  const del = async id => {
    if (!confirm('Delete this holiday?')) return;
    try { await api('DELETE', `/api/hrm/holidays/${id}`); toast('Deleted','success'); load(); }
    catch(e) { toast(e.message,'error'); }
  };

  const grouped = rows.reduce((acc, h) => {
    const m = new Date(h.date).getMonth();
    if (!acc[m]) acc[m] = [];
    acc[m].push(h);
    return acc;
  }, {});

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Holiday Calendar</h1>
        <div className="flex gap-2">
          <select className="form-select w-28 text-sm" value={year} onChange={e => setYear(+e.target.value)}>
            {[2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
          </select>
          <button onClick={() => setModal(true)} className="btn btn-primary btn-sm gap-1.5"><Plus size={13}/>Add Holiday</button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="card p-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="card"><div className="empty-state"><CalendarDays size={36} className="text-gray-200 mb-2"/><p className="text-sm text-gray-500">No holidays for {year}</p></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(grouped).sort(([a],[b]) => +a - +b).map(([month, holidays]) => (
              <div key={month} className="card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 font-semibold text-sm text-gray-700">
                  {MONTHS[+month]}
                </div>
                {holidays.map(h => (
                  <div key={h.id} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 group">
                    <div className="flex items-center gap-3">
                      <div className="text-center w-8">
                        <div className="text-lg font-bold leading-none text-gray-800">{new Date(h.date).getDate()}</div>
                        <div className="text-[10px] text-gray-400">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(h.date).getDay()]}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{h.name}</div>
                        <Badge text={h.holiday_type} />
                      </div>
                    </div>
                    <button onClick={() => del(h.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modal} title="Add Holiday" onClose={() => setModal(false)} onSave={save} saveLabel="Add">
        <FormSection title="Holiday Details">
          <FormGrid>
            <Field label="Holiday Name" required>
              <input className="form-input" value={form.name||''} onChange={e => f({name:e.target.value})} placeholder="e.g. Republic Day"/>
            </Field>
            <Field label="Date" required>
              <input type="date" className="form-input" value={form.date||''} onChange={e => f({date:e.target.value})}/>
            </Field>
            <Field label="Type">
              <select className="form-select" value={form.holiday_type||'Public'} onChange={e => f({holiday_type:e.target.value})}>
                {['Public','Optional','Restricted'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Description (optional)">
              <input className="form-input" value={form.description||''} onChange={e => f({description:e.target.value})}/>
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>
    </>
  );
}
