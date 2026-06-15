import { useState, useEffect } from 'react';
import { api } from '../api';
import { fmtDate, fmtHours, fmtTime12 } from '../utils/date';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import DatePicker from '../components/DatePicker';
import Select from '../components/Select';
import {
  Plus, RefreshCw, Search, Pencil, Trash2, Eye, EyeOff,
  Monitor, Undo2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  LayoutList, LayoutGrid, X,
  Phone, Mail, Calendar, Building2, Briefcase, CreditCard,
  User, AlertCircle, Clock, TrendingUp, Star, AlertTriangle,
  LogOut, CheckCircle2, ArrowRightLeft, History,
  GraduationCap, Briefcase as BriefcaseIcon, Plus as PlusIcon,
  Upload, Download, FileText, CalendarDays,
} from 'lucide-react';

function Avatar({ name, photo, size = 'sm' }) {
  const dim = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  if (photo) {
    return <img src={photo} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white font-bold flex items-center justify-center flex-shrink-0`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

const PT_STATES = ['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Other'];
const ASSET_TYPES = ['Laptop', 'Desktop', 'Mobile', 'Tablet', 'Mouse & Keyboard', 'Monitor', 'Headset', 'Access Card', 'Sim Card', 'Bag', 'Chair', 'Other'];

function calcLivePayroll(form) {
  const basic = parseFloat(form.basic_salary) || 0;
  const hraPct = parseFloat(form.hra_percent) || 40;
  const special = parseFloat(form.special_allowance) || 0;
  const lta = parseFloat(form.lta) || 0;
  const other = parseFloat(form.other_allowance) || 0;
  const pfApplicable = form.pf_applicable !== false && form.pf_applicable !== 'false';
  const esiApplicable = form.esi_applicable !== false && form.esi_applicable !== 'false';
  const ptState = form.pt_state || 'Karnataka';

  if (!basic) return null;

  const hra = Math.round(basic * hraPct / 100);
  const gross = basic + hra + special + lta + other;
  const pfEmp = pfApplicable ? Math.round(Math.min(basic * 0.12, 1800)) : 0;
  const esiEmp = (gross <= 21000 && esiApplicable) ? Math.round(gross * 0.0075) : 0;

  let pt = 0;
  const state = ptState.toLowerCase();
  if (state === 'karnataka') {
    pt = gross > 15000 ? 200 : gross > 10000 ? 150 : 0;
  } else if (state === 'maharashtra') {
    pt = gross > 10000 ? 200 : 0;
  } else if (['tamil nadu', 'andhra pradesh', 'telangana'].includes(state)) {
    pt = gross > 15000 ? 208 : 0;
  }

  return { gross, net: gross - pfEmp - esiEmp - pt };
}

const PAGE_SIZE = 50;

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="text-xs text-gray-600 dark:text-gray-300 w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-gray-800 dark:text-gray-200 font-medium flex-1">{value}</span>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="mb-4">
      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-5">{title}</h4>
      <div className="px-5 divide-y divide-gray-100 dark:divide-gray-800">{children}</div>
    </div>
  );
}

const EVENT_TYPES = [
  'Joining', 'Probation Completed', 'Salary Hike', 'Promotion', 'Demotion',
  'Department Change', 'Transfer', 'Role Change', 'Notice Served', 'Resignation', 'Status Change',
];

const EVENT_META = {
  'Joining':             { icon: CheckCircle2,  color: 'bg-green-100 text-green-600',   dot: 'bg-green-500' },
  'Probation Completed': { icon: Star,           color: 'bg-teal-100 text-teal-600',     dot: 'bg-teal-500' },
  'Salary Hike':         { icon: TrendingUp,     color: 'bg-blue-100 text-blue-600',     dot: 'bg-blue-500' },
  'Promotion':           { icon: Star,           color: 'bg-indigo-100 text-indigo-600', dot: 'bg-indigo-500' },
  'Demotion':            { icon: ChevronDown,    color: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
  'Department Change':   { icon: ArrowRightLeft, color: 'bg-purple-100 text-purple-600', dot: 'bg-purple-500' },
  'Transfer':            { icon: ArrowRightLeft, color: 'bg-purple-100 text-purple-600', dot: 'bg-purple-500' },
  'Role Change':         { icon: ArrowRightLeft, color: 'bg-violet-100 text-violet-600', dot: 'bg-violet-500' },
  'Notice Served':       { icon: AlertTriangle,  color: 'bg-amber-100 text-amber-600',   dot: 'bg-amber-500' },
  'Resignation':         { icon: LogOut,         color: 'bg-red-100 text-red-600',       dot: 'bg-red-500' },
  'Status Change':       { icon: Clock,          color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
};

function EmployeeHistoryTab({ emp, history, loading, showForm, setShowForm, form, setForm, saving, onSave, onDelete }) {
  const hasJoining = history.some(r => r.change_type === 'Joining');
  const synthetic = (!hasJoining && emp?.date_of_joining) ? [{
    id: '__synthetic__',
    change_type: 'Joining',
    effective_date: emp.date_of_joining,
    to_designation: emp.designation || null,
    to_department: emp.department || null,
    remarks: 'Joined the organization',
    _synthetic: true,
  }] : [];

  const allEvents = [...history, ...synthetic].sort((a, b) =>
    new Date(b.effective_date) - new Date(a.effective_date)
  );

  const type = form.change_type || '';
  const needsDesig = ['Promotion', 'Demotion', 'Role Change'].includes(type);
  const needsDept  = ['Department Change', 'Transfer'].includes(type);
  const needsSalary = type === 'Salary Hike';
  const needsLwd    = ['Resignation', 'Notice Served'].includes(type);

  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-500">{allEvents.length} event{allEvents.length !== 1 ? 's' : ''} on record</p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="btn btn-primary btn-sm gap-1.5"
        >
          {showForm ? <X size={12} /> : <Plus size={12} />}
          {showForm ? 'Cancel' : 'Add Event'}
        </button>
      </div>

      {showForm && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wider">New History Event</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Event Type <span className="text-red-500">*</span></label>
              <Select
                value={form.change_type || ''}
                onChange={v => setForm({ change_type: v })}
                options={[{ value: '', label: 'Select type' }, ...EVENT_TYPES.map(t => ({ value: t, label: t }))]}
                placeholder="Select type"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Effective Date <span className="text-red-500">*</span></label>
              <DatePicker value={form.effective_date || ''} onChange={v => setForm({ effective_date: v })} placeholder="Select date" />
            </div>
            {needsDesig && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">From Designation</label>
                  <input className="form-input" value={form.from_designation || ''} onChange={e => setForm({ from_designation: e.target.value })} placeholder="Previous designation" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">To Designation</label>
                  <input className="form-input" value={form.to_designation || ''} onChange={e => setForm({ to_designation: e.target.value })} placeholder="New designation" />
                </div>
              </>
            )}
            {needsDept && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">From Department</label>
                  <input className="form-input" value={form.from_department || ''} onChange={e => setForm({ from_department: e.target.value })} placeholder="Previous department" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">To Department</label>
                  <input className="form-input" value={form.to_department || ''} onChange={e => setForm({ to_department: e.target.value })} placeholder="New department" />
                </div>
              </>
            )}
            {needsSalary && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Previous Salary (₹)</label>
                  <input type="number" className="form-input" value={form.salary_before || ''} onChange={e => setForm({ salary_before: e.target.value })} placeholder="e.g. 30000" min="0" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">New Salary (₹)</label>
                  <input type="number" className="form-input" value={form.salary_after || ''} onChange={e => setForm({ salary_after: e.target.value })} placeholder="e.g. 35000" min="0" />
                </div>
              </>
            )}
            {needsLwd && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Last Working Date</label>
                <DatePicker value={form.last_working_date || ''} onChange={v => setForm({ last_working_date: v })} placeholder="Select date" />
              </div>
            )}
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Remarks</label>
              <textarea className="form-textarea" rows={2} value={form.remarks || ''} onChange={e => setForm({ remarks: e.target.value })} placeholder="Any notes…" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="button" onClick={onSave} disabled={saving} className="btn btn-primary btn-sm">
              {saving ? 'Saving…' : 'Save Event'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-24 text-gray-400 text-sm">Loading history…</div>
      ) : allEvents.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <History size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No history recorded yet</p>
          <p className="text-xs mt-1">Add an event to start tracking this employee's journey</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3">
            {allEvents.map((ev, i) => {
              const m = EVENT_META[ev.change_type] || { icon: Clock, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
              const Icon = m.icon;
              return (
                <div key={ev.id || i} className="relative flex gap-3 pl-10">
                  <div className={`absolute left-0 w-8 h-8 rounded-full ${m.color} flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-gray-900 z-10`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{ev.change_type}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{fmtDate(ev.effective_date)}</p>
                        {(ev.from_designation || ev.to_designation) && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1 flex-wrap">
                            {ev.from_designation && <span className="line-through text-gray-400">{ev.from_designation}</span>}
                            {ev.from_designation && ev.to_designation && <span className="text-gray-400">→</span>}
                            {ev.to_designation && <span>{ev.to_designation}</span>}
                          </p>
                        )}
                        {(ev.from_department || ev.to_department) && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1 flex-wrap">
                            {ev.from_department && <span className="text-gray-400">{ev.from_department}</span>}
                            {ev.from_department && ev.to_department && <span className="text-gray-400">→</span>}
                            {ev.to_department && <span>{ev.to_department}</span>}
                          </p>
                        )}
                        {(ev.salary_before != null || ev.salary_after != null) && (
                          <p className="text-xs font-medium mt-1 flex items-center gap-1 flex-wrap">
                            {ev.salary_before != null && <span className="text-gray-400 line-through">₹{Number(ev.salary_before).toLocaleString('en-IN')}</span>}
                            {ev.salary_before != null && ev.salary_after != null && <span className="text-gray-400">→</span>}
                            {ev.salary_after != null && <span className="text-green-600">₹{Number(ev.salary_after).toLocaleString('en-IN')}</span>}
                            {ev.salary_before != null && ev.salary_after != null && ev.salary_before > 0 && (
                              <span className="text-green-500 text-[11px]">(+{Math.round((ev.salary_after - ev.salary_before) / ev.salary_before * 100)}%)</span>
                            )}
                          </p>
                        )}
                        {ev.last_working_date && (
                          <p className="text-xs text-gray-500 mt-1">Last working day: <span className="font-medium">{ev.last_working_date}</span></p>
                        )}
                        {ev.remarks && (
                          <p className="text-[11px] text-gray-400 mt-1 italic">{ev.remarks}</p>
                        )}
                      </div>
                      {!ev._synthetic && (
                        <button
                          onClick={() => onDelete(ev.id)}
                          className="p-1 rounded-lg hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                          title="Delete event"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const DEGREE_OPTIONS = ['High School', 'Diploma', 'B.A.', 'B.Sc.', 'B.Com.', 'B.Tech / B.E.', 'BCA', 'BBA', 'M.A.', 'M.Sc.', 'M.Com.', 'M.Tech / M.E.', 'MCA', 'MBA', 'Ph.D.', 'Other'];
const YEAR_OPTIONS = Array.from({ length: 50 }, (_, i) => String(new Date().getFullYear() - i));

function EduCard({ item, onDelete }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
        <GraduationCap size={14} className="text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.degree}</p>
        <p className="text-xs text-gray-500 mt-0.5">{item.institution}</p>
        <div className="flex flex-wrap gap-x-3 mt-1">
          {(item.start_year || item.end_year) && (
            <span className="text-xs text-gray-400">{item.start_year}{item.end_year && item.end_year !== item.start_year ? ` – ${item.end_year}` : ''}</span>
          )}
          {item.grade && <span className="text-xs text-gray-400">{item.grade}</span>}
        </div>
      </div>
      {onDelete && (
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

function ExpCard({ item, onDelete }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
        <BriefcaseIcon size={14} className="text-violet-600 dark:text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.role}</p>
        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">{item.company}</p>
        <div className="flex flex-wrap gap-x-3 mt-1">
          {(item.from_year || item.to_year) && (
            <span className="text-xs text-gray-400">{item.from_year}{item.to_year && item.to_year !== item.from_year ? ` – ${item.to_year}` : ''}</span>
          )}
        </div>
        {item.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>}
      </div>
      {onDelete && (
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

function EmployeeEduExpTab({ emp, onSave, saving }) {
  const [education, setEducation] = useState(emp?.education || []);
  const [experience, setExperience] = useState(emp?.experience || []);
  const [addingEdu, setAddingEdu] = useState(false);
  const [addingExp, setAddingExp] = useState(false);
  const [eduForm, setEduForm] = useState({ degree: '', institution: '', start_year: '', end_year: '', grade: '' });
  const [expForm, setExpForm] = useState({ company: '', role: '', from_year: '', to_year: '', description: '' });

  useEffect(() => {
    setEducation(emp?.education || []);
    setExperience(emp?.experience || []);
  }, [emp?.id]);

  const ef = v => setEduForm(p => ({ ...p, ...v }));
  const xf = v => setExpForm(p => ({ ...p, ...v }));

  const saveEdu = () => {
    if (!eduForm.degree || !eduForm.institution) return;
    const next = [...education, { ...eduForm }];
    setEducation(next);
    setAddingEdu(false);
    setEduForm({ degree: '', institution: '', start_year: '', end_year: '', grade: '' });
    onSave({ education: next, experience });
  };

  const saveExp = () => {
    if (!expForm.company || !expForm.role) return;
    const next = [...experience, { ...expForm }];
    setExperience(next);
    setAddingExp(false);
    setExpForm({ company: '', role: '', from_year: '', to_year: '', description: '' });
    onSave({ education, experience: next });
  };

  const removeEdu = i => {
    const next = education.filter((_, idx) => idx !== i);
    setEducation(next);
    onSave({ education: next, experience });
  };

  const removeExp = i => {
    const next = experience.filter((_, idx) => idx !== i);
    setExperience(next);
    onSave({ education, experience: next });
  };

  return (
    <div className="px-5 py-4 space-y-6">
      {/* Education */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GraduationCap size={14} className="text-blue-500" />
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Education</span>
          </div>
          {!addingEdu && (
            <button onClick={() => setAddingEdu(true)} className="flex items-center gap-1 text-xs text-[var(--accent)] hover:opacity-80 font-medium">
              <PlusIcon size={12} /> Add
            </button>
          )}
        </div>

        <div className="space-y-2">
          {education.map((item, i) => (
            <EduCard key={i} item={item} onDelete={() => removeEdu(i)} />
          ))}
          {education.length === 0 && !addingEdu && (
            <p className="text-xs text-gray-400 italic">No education records yet</p>
          )}
        </div>

        {addingEdu && (
          <div className="mt-3 p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Degree / Qualification <span className="text-red-400">*</span></label>
                <Select
                  value={eduForm.degree}
                  onChange={v => ef({ degree: v })}
                  options={[{ value: '', label: 'Select…' }, ...DEGREE_OPTIONS.map(d => ({ value: d, label: d }))]}
                  placeholder="Select…"
                  size="sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Institution <span className="text-red-400">*</span></label>
                <input className="form-input text-xs w-full" placeholder="University / College" value={eduForm.institution} onChange={e => ef({ institution: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Start Year</label>
                <Select
                  value={eduForm.start_year}
                  onChange={v => ef({ start_year: v })}
                  options={[{ value: '', label: '–' }, ...YEAR_OPTIONS.map(y => ({ value: y, label: y }))]}
                  placeholder="–"
                  size="sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">End Year</label>
                <Select
                  value={eduForm.end_year}
                  onChange={v => ef({ end_year: v })}
                  options={[{ value: '', label: '–' }, ...YEAR_OPTIONS.map(y => ({ value: y, label: y }))]}
                  placeholder="–"
                  size="sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-0.5">Grade / CGPA / %</label>
                <input className="form-input text-xs w-full" placeholder="e.g. 8.5 CGPA or 78%" value={eduForm.grade} onChange={e => ef({ grade: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={saveEdu} disabled={saving || !eduForm.degree || !eduForm.institution} className="btn btn-primary btn-xs">Save</button>
              <button onClick={() => { setAddingEdu(false); setEduForm({ degree: '', institution: '', start_year: '', end_year: '', grade: '' }); }} className="btn btn-secondary btn-xs">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Experience */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BriefcaseIcon size={14} className="text-violet-500" />
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Work Experience</span>
          </div>
          {!addingExp && (
            <button onClick={() => setAddingExp(true)} className="flex items-center gap-1 text-xs text-[var(--accent)] hover:opacity-80 font-medium">
              <PlusIcon size={12} /> Add
            </button>
          )}
        </div>

        <div className="space-y-2">
          {experience.map((item, i) => (
            <ExpCard key={i} item={item} onDelete={() => removeExp(i)} />
          ))}
          {experience.length === 0 && !addingExp && (
            <p className="text-xs text-gray-400 italic">No experience records yet</p>
          )}
        </div>

        {addingExp && (
          <div className="mt-3 p-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Company <span className="text-red-400">*</span></label>
                <input className="form-input text-xs w-full" placeholder="Company name" value={expForm.company} onChange={e => xf({ company: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Role / Designation <span className="text-red-400">*</span></label>
                <input className="form-input text-xs w-full" placeholder="e.g. Software Engineer" value={expForm.role} onChange={e => xf({ role: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">From Year</label>
                <Select
                  value={expForm.from_year}
                  onChange={v => xf({ from_year: v })}
                  options={[{ value: '', label: '–' }, ...YEAR_OPTIONS.map(y => ({ value: y, label: y }))]}
                  placeholder="–"
                  size="sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">To Year</label>
                <Select
                  value={expForm.to_year}
                  onChange={v => xf({ to_year: v })}
                  options={[{ value: '', label: '–' }, { value: 'Present', label: 'Present' }, ...YEAR_OPTIONS.map(y => ({ value: y, label: y }))]}
                  placeholder="–"
                  size="sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-0.5">Description</label>
                <textarea className="form-input text-xs w-full resize-none" rows={2} placeholder="Brief description of responsibilities" value={expForm.description} onChange={e => xf({ description: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={saveExp} disabled={saving || !expForm.company || !expForm.role} className="btn btn-primary btn-xs">Save</button>
              <button onClick={() => { setAddingExp(false); setExpForm({ company: '', role: '', from_year: '', to_year: '', description: '' }); }} className="btn btn-secondary btn-xs">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Employees({ toast }) {
  const [rows, setRows] = useState([]);
  const [allEmps, setAllEmps] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [depts, setDepts] = useState([]);
  const [desigs, setDesigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [empAssets, setEmpAssets] = useState([]);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [joinDocs, setJoinDocs]   = useState({});
  const [docUploading, setDocUploading] = useState(null);
  const [assetForm, setAssetForm] = useState({ asset_name: '', asset_type: '', serial_number: '', condition: 'Good', allocated_date: new Date().toISOString().slice(0, 10), notes: '' });

  const [viewMode, setViewMode] = useState(() => localStorage.getItem('emp-view-mode') || 'list');
  const [detailEmp, setDetailEmp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('overview');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [historyForm, setHistoryForm] = useState({});
  const [historySaving, setHistorySaving] = useState(false);
  const [empDocs, setEmpDocs] = useState([]);
  const [empDocsLoading, setEmpDocsLoading] = useState(false);
  const [empDocUpload, setEmpDocUpload] = useState(false);
  const [empDocForm, setEmpDocForm] = useState({ document_type: '', document_name: '' });
  const [empDocFile, setEmpDocFile] = useState(null);
  const [empDocSaving, setEmpDocSaving] = useState(false);
  const [empLeaves, setEmpLeaves] = useState([]);
  const [empLeaveBalances, setEmpLeaveBalances] = useState([]);
  const [empLeavesLoading, setEmpLeavesLoading] = useState(false);
  const [empAtt, setEmpAtt] = useState([]);
  const [empAttLoading, setEmpAttLoading] = useState(false);
  const [attCalYear, setAttCalYear] = useState(() => new Date().getFullYear());
  const [attCalMonth, setAttCalMonth] = useState(() => new Date().getMonth() + 1);
  const [attCalSelected, setAttCalSelected] = useState(null);
  const [attHolidays, setAttHolidays] = useState([]);
  const [eduExpSaving, setEduExpSaving] = useState(false);
  const [joinedMonthFilter, setJoinedMonthFilter] = useState('');
  const [joinedMonthLabel, setJoinedMonthLabel] = useState('');
  const [jobInfoEditOpen, setJobInfoEditOpen] = useState(false);
  const [jobInfoForm, setJobInfoForm] = useState({});
  const [jobInfoSaving, setJobInfoSaving] = useState(false);
  const [historyDropdownOpen, setHistoryDropdownOpen] = useState(false);
  const [updateDropdownOpen, setUpdateDropdownOpen] = useState(false);
  const [updateEventType, setUpdateEventType] = useState('');
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({});
  const [updateSaving, setUpdateSaving] = useState(false);

  const load = async (s = search, d = deptFilter, st = statusFilter, pg = page, jm = joinedMonthFilter) => {
    setLoading(true);
    try {
      let url = `/api/employees?page=${pg}&page_size=${PAGE_SIZE}&`;
      if (s) url += `search=${encodeURIComponent(s)}&`;
      if (d) url += `department_id=${d}&`;
      if (st) url += `status=${st}&`;
      if (jm) url += `joined_month=${jm}&`;
      const res = await api('GET', url);
      setRows(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const changePage = (pg) => { setPage(pg); load(search, deptFilter, statusFilter, pg, joinedMonthFilter); };

  useEffect(() => {
    Promise.all([
      api('GET', '/api/employees/departments'),
      api('GET', '/api/employees/designations'),
      api('GET', '/api/employees?all=true'),
    ]).then(([d, de, ae]) => {
        setDepts(d);
        setDesigs(de);
        setAllEmps(Array.isArray(ae) ? ae : (ae?.data || []));
        try {
          const pending = sessionStorage.getItem('nav-filter');
          if (pending) {
            sessionStorage.removeItem('nav-filter');
            const f = JSON.parse(pending);
            if (f.joinedMonth) {
              setJoinedMonthFilter(f.joinedMonth);
              setJoinedMonthLabel(f.joinedLabel || f.joinedMonth);
              load(search, deptFilter, statusFilter, 1, f.joinedMonth);
              return;
            }
            if (f.deptName) {
              const match = d.find(dep => dep.name === f.deptName);
              if (match) {
                const id = String(match.id);
                setDeptFilter(id);
                load(search, id, statusFilter, 1);
                return;
              }
            }
          }
        } catch {}
        load();
      })
      .catch(e => toast(e.message, 'error'));
  }, []);

  const switchView = (v) => { setViewMode(v); localStorage.setItem('emp-view-mode', v); };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setDetailEmp({ id, _loading: true });
    setDetailTab('overview');
    setHistory([]);
    setShowHistoryForm(false);
    setHistoryForm({});
    setEmpDocs([]); setEmpLeaves([]); setEmpLeaveBalances([]); setEmpAtt([]);
    setEmpDocUpload(false); setEmpDocForm({ document_type: '', document_name: '' }); setEmpDocFile(null);
    setAttCalSelected(null);
    const now = new Date(); setAttCalYear(now.getFullYear()); setAttCalMonth(now.getMonth() + 1);
    try {
      const [emp, contacts, assets] = await Promise.all([
        api('GET', `/api/employees/${id}`),
        api('GET', `/api/hrm/employees/${id}/emergency-contacts`).catch(() => []),
        api('GET', `/api/hrm/assets?employee_id=${id}`).catch(() => []),
      ]);
      const ec = contacts[0] || {};
      setDetailEmp({ ...emp, _ec: ec, _assets: assets });
    } catch (e) { toast(e.message, 'error'); setDetailEmp(null); }
    finally { setDetailLoading(false); }
  };

  const loadHistory = async (id) => {
    setHistoryLoading(true);
    try {
      const data = await api('GET', `/api/hrm/employees/${id}/history`);
      setHistory(data);
    } catch (e) { toast(e.message, 'error'); }
    finally { setHistoryLoading(false); }
  };

  const loadEmpDocs = async (id) => {
    setEmpDocsLoading(true);
    try { setEmpDocs(await api('GET', `/api/hrm/employees/${id}/documents`)); }
    catch (e) { toast(e.message, 'error'); }
    finally { setEmpDocsLoading(false); }
  };

  const loadEmpLeaves = async (id) => {
    setEmpLeavesLoading(true);
    try {
      const [leaves, balances] = await Promise.all([
        api('GET', `/api/leaves?employee_id=${id}`),
        api('GET', `/api/hrm/leave-balances/employee/${id}`).catch(() => []),
      ]);
      setEmpLeaves(leaves);
      setEmpLeaveBalances(balances);
    } catch (e) { toast(e.message, 'error'); }
    finally { setEmpLeavesLoading(false); }
  };

  const loadEmpAtt = async (id, year, month) => {
    setEmpAttLoading(true);
    setAttCalSelected(null);
    try {
      const [att, holidays] = await Promise.all([
        api('GET', `/api/leaves/attendance?employee_id=${id}&year=${year}&month=${month}`),
        api('GET', `/api/hrm/holidays?year=${year}`),
      ]);
      setEmpAtt(att);
      setAttHolidays(holidays);
    }
    catch (e) { toast(e.message, 'error'); }
    finally { setEmpAttLoading(false); }
  };

  const uploadEmpDoc = async () => {
    if (!empDocForm.document_type) return toast('Select a document type', 'warning');
    if (!empDocFile) return toast('Choose a file to upload', 'warning');
    setEmpDocSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', empDocFile);
      const token = localStorage.getItem('artech_hrms_token');
      const name = encodeURIComponent(empDocForm.document_name || empDocFile.name);
      const type = encodeURIComponent(empDocForm.document_type);
      const res = await fetch(`/api/hrm/employees/${detailEmp.id}/documents?document_type=${type}&document_name=${name}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Upload failed');
      toast('Document uploaded', 'success');
      setEmpDocUpload(false);
      setEmpDocForm({ document_type: '', document_name: '' });
      setEmpDocFile(null);
      loadEmpDocs(detailEmp.id);
    } catch (e) { toast(e.message, 'error'); }
    finally { setEmpDocSaving(false); }
  };

  const deleteEmpDoc = async (docId) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api('DELETE', `/api/hrm/documents/${docId}`);
      setEmpDocs(d => d.filter(x => x.id !== docId));
      toast('Deleted', 'success');
    } catch (e) { toast(e.message, 'error'); }
  };

  const switchDetailTab = (tab, emp) => {
    setDetailTab(tab);
    if (!emp?.id) return;
    if (tab === 'history')    loadHistory(emp.id);
    if (tab === 'documents')  loadEmpDocs(emp.id);
    if (tab === 'leaves')     loadEmpLeaves(emp.id);
    if (tab === 'attendance') loadEmpAtt(emp.id, attCalYear, attCalMonth);
  };

  const saveHistoryEvent = async () => {
    if (!historyForm.change_type) return toast('Select an event type', 'warning');
    if (!historyForm.effective_date) return toast('Effective date is required', 'warning');
    setHistorySaving(true);
    try {
      await api('POST', `/api/hrm/employees/${detailEmp.id}/history`, {
        change_type: historyForm.change_type,
        effective_date: historyForm.effective_date,
        from_department: historyForm.from_department || null,
        to_department: historyForm.to_department || null,
        from_designation: historyForm.from_designation || null,
        to_designation: historyForm.to_designation || null,
        salary_before: historyForm.salary_before ? parseFloat(historyForm.salary_before) : null,
        salary_after: historyForm.salary_after ? parseFloat(historyForm.salary_after) : null,
        last_working_date: historyForm.last_working_date || null,
        remarks: historyForm.remarks || null,
      });
      toast('Event added', 'success');
      setShowHistoryForm(false);
      setHistoryForm({});
      loadHistory(detailEmp.id);
    } catch (e) { toast(e.message, 'error'); }
    finally { setHistorySaving(false); }
  };

  const deleteHistoryEvent = async (recordId) => {
    if (!confirm('Delete this history event?')) return;
    try {
      await api('DELETE', `/api/hrm/employees/${detailEmp.id}/history/${recordId}`);
      toast('Event deleted', 'success');
      loadHistory(detailEmp.id);
    } catch (e) { toast(e.message, 'error'); }
  };

  const saveEduExp = async ({ education, experience }) => {
    if (!detailEmp?.id) return;
    setEduExpSaving(true);
    try {
      await api('PUT', `/api/employees/${detailEmp.id}`, {
        ...detailEmp,
        education,
        experience,
        department_id: detailEmp.department_id,
        designation_id: detailEmp.designation_id,
        date_of_joining: detailEmp.date_of_joining,
        first_name: detailEmp.first_name,
        last_name: detailEmp.last_name,
        pf_applicable: detailEmp.pf_applicable ?? true,
        esi_applicable: detailEmp.esi_applicable ?? true,
      });
      setDetailEmp(p => ({ ...p, education, experience }));
      toast('Saved', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setEduExpSaving(false); }
  };

  const hf = v => setHistoryForm(p => ({ ...p, ...v }));

  const openAdd = () => {
    setForm({
      employment_type: 'Full-time', status: 'Active',
      hra_percent: 40, special_allowance: 0, lta: 0, other_allowance: 0,
      pf_applicable: true, esi_applicable: true, pt_state: 'Karnataka',
      ec_name: '', ec_relationship: '', ec_phone: '', ec_id: null,
      reports_to_id: null, notice_period_days: null, probation_period_days: null, office_address: '', residential_address: '',
    });
    setEmpAssets([]);
    setShowAssetForm(false);
    setJoinDocs({});
    setModal({ mode: 'add' });
  };

  const loadJoinDocs = async (empId) => {
    try {
      const d = await api('GET', `/api/onboarding/${empId}/hr-docs`);
      setJoinDocs(d.docs || {});
    } catch { setJoinDocs({}); }
  };

  const uploadJoinDoc = async (empId, docKey, file) => {
    setDocUploading(docKey);
    try {
      const token = localStorage.getItem('artech_hrms_token');
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch(`/api/onboarding/${empId}/hr-docs/upload/${docKey}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed');
      await loadJoinDocs(empId);
      toast('Document uploaded', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setDocUploading(null); }
  };

  const removeJoinDoc = async (empId, docKey) => {
    try {
      await api('DELETE', `/api/onboarding/${empId}/hr-docs/${docKey}`);
      await loadJoinDocs(empId);
      toast('Document removed', 'success');
    } catch (e) { toast(e.message, 'error'); }
  };

  const openEdit = async (id) => {
    try {
      const [e, contacts, assets] = await Promise.all([
        api('GET', `/api/employees/${id}`),
        api('GET', `/api/hrm/employees/${id}/emergency-contacts`).catch(() => []),
        api('GET', `/api/hrm/assets?employee_id=${id}`).catch(() => []),
      ]);
      const primary = contacts[0] || {};
      setForm({
        ...e,
        ec_name: primary.name || '',
        ec_relationship: primary.relationship_type || '',
        ec_phone: primary.ec_phone || primary.phone || '',
        ec_id: primary.id || null,
        reports_to_id: e.reports_to_id || null,
        notice_period_days: e.notice_period_days ?? null,
        probation_period_days: e.probation_period_days ?? null,
        office_address: e.office_address || '',
        residential_address: e.residential_address || '',
      });
      setEmpAssets(assets);
      setShowAssetForm(false);
      setAssetForm({ asset_name: '', asset_type: '', serial_number: '', condition: 'Good', allocated_date: new Date().toISOString().slice(0, 10), notes: '' });
      setModal({ mode: 'edit', id });
      loadJoinDocs(id);
    } catch (e) { toast(e.message, 'error'); }
  };

  const openJobInfoEdit = () => {
    setJobInfoForm({
      department_id: detailEmp.department_id || '',
      designation_id: detailEmp.designation_id || '',
      employment_type: detailEmp.employment_type || 'Full-time',
      status: detailEmp.status || 'Active',
      reports_to_id: detailEmp.reports_to_id || null,
      date_of_joining: detailEmp.date_of_joining || '',
      notice_period_days: detailEmp.notice_period_days ?? '',
      probation_period_days: detailEmp.probation_period_days ?? '',
      office_address: detailEmp.office_address || '',
    });
    setJobInfoEditOpen(true);
  };

  const saveJobInfo = async () => {
    setJobInfoSaving(true);
    try {
      await api('PUT', `/api/employees/${detailEmp.id}`, {
        ...detailEmp,
        department_id: jobInfoForm.department_id || detailEmp.department_id,
        designation_id: jobInfoForm.designation_id || detailEmp.designation_id,
        employment_type: jobInfoForm.employment_type,
        status: jobInfoForm.status,
        reports_to_id: jobInfoForm.reports_to_id || null,
        date_of_joining: jobInfoForm.date_of_joining || detailEmp.date_of_joining,
        notice_period_days: jobInfoForm.notice_period_days !== '' ? parseInt(jobInfoForm.notice_period_days) : null,
        probation_period_days: jobInfoForm.probation_period_days !== '' ? parseInt(jobInfoForm.probation_period_days) : null,
        office_address: jobInfoForm.office_address,
      });
      const updated = await api('GET', `/api/employees/${detailEmp.id}`);
      setDetailEmp(p => ({ ...p, ...updated }));
      setJobInfoEditOpen(false);
      toast('Job info saved', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setJobInfoSaving(false); }
  };

  const saveUpdate = async () => {
    if (!updateForm.effective_date) return toast('Effective date is required', 'warning');
    setUpdateSaving(true);
    const approved = updateForm.approved_by?.trim();
    const remarksText = [approved ? `Approved by: ${approved}` : '', updateForm.remarks?.trim() || ''].filter(Boolean).join('. ');
    try {
      await api('POST', `/api/hrm/employees/${detailEmp.id}/history`, {
        change_type: updateEventType,
        effective_date: updateForm.effective_date,
        from_department: updateForm.from_department || null,
        to_department: updateForm.to_department || null,
        from_designation: updateForm.from_designation || null,
        to_designation: updateForm.to_designation || null,
        salary_before: updateForm.salary_before ? parseFloat(updateForm.salary_before) : null,
        salary_after: updateForm.salary_after ? parseFloat(updateForm.salary_after) : null,
        last_working_date: updateForm.last_working_date || null,
        remarks: remarksText || null,
      });
      toast('History event added', 'success');
      setUpdateModalOpen(false);
      setUpdateDropdownOpen(false);
      setUpdateForm({});
      setUpdateEventType('');
      if (historyDropdownOpen) loadHistory(detailEmp.id);
      else setHistory([]);
    } catch (e) { toast(e.message, 'error'); }
    finally { setUpdateSaving(false); }
  };

  const allocateAsset = async () => {
    if (!assetForm.asset_name.trim() || !assetForm.asset_type) return toast('Asset name and type are required', 'warning');
    try {
      await api('POST', '/api/hrm/assets', { ...assetForm, employee_id: modal.id });
      toast('Asset allocated', 'success');
      const updated = await api('GET', `/api/hrm/assets?employee_id=${modal.id}`);
      setEmpAssets(updated);
      setAssetForm({ asset_name: '', asset_type: '', serial_number: '', condition: 'Good', allocated_date: new Date().toISOString().slice(0, 10), notes: '' });
      setShowAssetForm(false);
    } catch (e) { toast(e.message, 'error'); }
  };

  const returnAsset = async (assetId) => {
    try {
      await api('PUT', `/api/hrm/assets/${assetId}/return`, { condition: 'Good', returned_date: new Date().toISOString().slice(0, 10) });
      toast('Asset returned', 'success');
      const updated = await api('GET', `/api/hrm/assets?employee_id=${modal.id}`);
      setEmpAssets(updated);
    } catch (e) { toast(e.message, 'error'); }
  };

  const save = async () => {
    if (!form.first_name?.trim()) return toast('First name is required', 'warning');
    if (!form.date_of_joining) return toast('Date of joining is required', 'warning');
    if (form.mobile && form.mobile.replace(/^\+91/, '').length !== 10) return toast('Mobile number must be 10 digits', 'warning');
    if (modal.mode === 'add') {
      if (!form.username?.trim()) return toast('Username is required', 'warning');
      if (!form.email?.trim()) return toast('Email is required', 'warning');
      if (form.password?.trim() && form.password.length < 6) return toast('Password must be at least 6 characters', 'warning');
    }
    setSaving(true);
    try {
      const salaryFields = {
        basic_salary: form.basic_salary ? parseFloat(form.basic_salary) : null,
        hra_percent: parseFloat(form.hra_percent) || 40.0,
        special_allowance: parseFloat(form.special_allowance) || 0.0,
        lta: parseFloat(form.lta) || 0.0,
        other_allowance: parseFloat(form.other_allowance) || 0.0,
        pf_applicable: form.pf_applicable !== false && form.pf_applicable !== 'false',
        esi_applicable: form.esi_applicable !== false && form.esi_applicable !== 'false',
        pt_state: form.pt_state || 'Karnataka',
      };
      const bankFields = {
        bank_name: form.bank_name || null, bank_account_no: form.bank_account_no || null,
        bank_ifsc: form.bank_ifsc || null, bank_branch: form.bank_branch || null,
        aadhar_no: form.aadhar_no || null, pan_no: form.pan_no || null,
        biometric_id: form.biometric_id || null,
      };

      if (modal.mode === 'add') {
        const result = await api('POST', '/api/employees', {
          first_name: form.first_name, last_name: form.last_name || null,
          email: form.email, mobile: form.mobile || null,
          gender: form.gender || null, date_of_joining: form.date_of_joining,
          date_of_birth: form.date_of_birth || null,
          employee_id: form.employee_id || null,
          department_id: form.department_id ? parseInt(form.department_id) : null,
          designation_id: form.designation_id ? parseInt(form.designation_id) : null,
          reports_to_id: form.reports_to_id ? parseInt(form.reports_to_id) : null,
          employment_type: form.employment_type, username: form.username, password: form.password,
          notice_period_days: form.notice_period_days ? parseInt(form.notice_period_days) : null,
          probation_period_days: form.probation_period_days ? parseInt(form.probation_period_days) : null,
          office_address: form.office_address || null,
          residential_address: form.residential_address || null,
          ...salaryFields, ...bankFields,
        });
        if (form.ec_name?.trim()) {
          await api('POST', `/api/hrm/employees/${result.id}/emergency-contacts`, {
            name: form.ec_name.trim(), relationship_type: form.ec_relationship || 'Other',
            phone: form.ec_phone || '', is_primary: true,
          }).catch(() => {});
        }
        toast('Employee added successfully', 'success');
      } else {
        await api('PUT', `/api/employees/${modal.id}`, {
          first_name: form.first_name, last_name: form.last_name || null,
          email: form.email || null, mobile: form.mobile || null,
          gender: form.gender || null, date_of_joining: form.date_of_joining,
          date_of_birth: form.date_of_birth || null, status: form.status,
          employee_id: form.employee_id || null,
          department_id: form.department_id ? parseInt(form.department_id) : null,
          designation_id: form.designation_id ? parseInt(form.designation_id) : null,
          reports_to_id: form.reports_to_id ? parseInt(form.reports_to_id) : null,
          employment_type: form.employment_type,
          notice_period_days: form.notice_period_days ? parseInt(form.notice_period_days) : null,
          probation_period_days: form.probation_period_days ? parseInt(form.probation_period_days) : null,
          office_address: form.office_address || null,
          residential_address: form.residential_address || null,
          ...salaryFields, ...bankFields,
        });
        if (form.ec_name?.trim()) {
          if (form.ec_id) {
            await api('PUT', `/api/hrm/emergency-contacts/${form.ec_id}`, {
              name: form.ec_name.trim(), relationship_type: form.ec_relationship || 'Other',
              phone: form.ec_phone || '', is_primary: true,
            }).catch(() => {});
          } else {
            await api('POST', `/api/hrm/employees/${modal.id}/emergency-contacts`, {
              name: form.ec_name.trim(), relationship_type: form.ec_relationship || 'Other',
              phone: form.ec_phone || '', is_primary: true,
            }).catch(() => {});
          }
        }
        toast('Employee saved', 'success');
      }
      setModal(null);
      load();
      if (detailEmp?.id === modal.id) openDetail(modal.id);
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const del = async (id, name) => {
    if (!confirm(`Delete employee "${name}"? This cannot be undone.`)) return;
    try {
      await api('DELETE', `/api/employees/${id}`);
      toast('Employee deleted', 'success');
      if (detailEmp?.id === id) setDetailEmp(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const f = v => setForm(prev => ({ ...prev, ...v }));
  const liveCalc = calcLivePayroll(form);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Employee List</h1>
          {joinedMonthLabel ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white flex items-center gap-1" style={{ backgroundColor: 'var(--accent)' }}>
                Hired in {joinedMonthLabel}
                <button onClick={() => { setJoinedMonthFilter(''); setJoinedMonthLabel(''); setPage(1); load(search, deptFilter, statusFilter, 1, ''); }} className="ml-0.5 opacity-70 hover:opacity-100">×</button>
              </span>
              {total > 0 && <span className="text-xs text-gray-500">{total} employee{total !== 1 ? 's' : ''}</span>}
            </div>
          ) : (
            total > 0 && <p className="text-xs text-gray-500 mt-0.5">{total} total employees</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => switchView('list')}
              className={`p-1.5 transition-colors ${viewMode === 'list' ? 'text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              style={viewMode === 'list' ? { backgroundColor: 'var(--accent)' } : {}}
              title="List view"
            >
              <LayoutList size={15} />
            </button>
            <button
              onClick={() => switchView('grid')}
              className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              style={viewMode === 'grid' ? { backgroundColor: 'var(--accent)' } : {}}
              title="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
          <button onClick={() => { setPage(1); load(search, deptFilter, statusFilter, 1); }} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={openAdd} className="btn btn-primary btn-sm gap-1.5"><Plus size={13} /> Add Employee</button>
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="card mb-4">
          <div className="p-3 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="form-input pl-8"
                placeholder="Search by name, email, ID..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); load(e.target.value, deptFilter, statusFilter, 1); }}
              />
            </div>
            <Select
              value={deptFilter}
              onChange={v => { setDeptFilter(v); setPage(1); load(search, v, statusFilter, 1); }}
              options={[{ value: '', label: 'All Departments' }, ...depts.map(d => ({ value: String(d.id), label: d.name }))]}
              placeholder="All Departments"
              className="min-w-[160px]"
            />
            <Select
              value={statusFilter}
              onChange={v => { setStatusFilter(v); setPage(1); load(search, deptFilter, v, 1); }}
              options={[{ value: '', label: 'All Status' }, { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }, { value: 'Left', label: 'Left' }]}
              placeholder="All Status"
              className="w-36"
            />
          </div>
        </div>

        {/* ── LIST VIEW ── */}
        {viewMode === 'list' && (
          <div className="card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th><th>Department</th><th>Designation</th>
                    <th>Date of Joining</th><th>Basic Salary</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon">👤</div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">No employees found</h3>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or add a new employee</p>
                      </div>
                    </td></tr>
                  ) : rows.map(e => (
                    <tr
                      key={e.id}
                      className="cursor-pointer hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
                      onClick={() => openDetail(e.id)}
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={e.full_name} photo={e.profile_photo} />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">{e.full_name}</div>
                            <div className="text-xs text-gray-400">
                              <code className="bg-gray-100 px-1 rounded text-[10px]">{e.employee_id}</code>
                              {e.email && <span className="ml-1">· {e.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-600">{e.department || <span className="text-gray-300">—</span>}</td>
                      <td className="text-gray-600">{e.designation || <span className="text-gray-300">—</span>}</td>
                      <td className="text-gray-600">{fmtDate(e.date_of_joining)}</td>
                      <td className="text-gray-700 dark:text-gray-300 font-medium">
                        {e.basic_salary ? `₹${Number(e.basic_salary).toLocaleString()}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td><Badge text={e.status} /></td>
                      <td onClick={ev => ev.stopPropagation()}>
                        <button
                          onClick={() => del(e.id, e.full_name)}
                          className="btn-delete"
                        >
                          <Trash2 size={11} />Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-500">
                  Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} employees
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => changePage(page - 1)} disabled={page === 1} className="btn btn-secondary btn-xs disabled:opacity-40">← Prev</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pg;
                    if (totalPages <= 7) pg = i + 1;
                    else if (page <= 4) pg = i + 1;
                    else if (page >= totalPages - 3) pg = totalPages - 6 + i;
                    else pg = page - 3 + i;
                    return (
                      <button key={pg} onClick={() => changePage(pg)}
                        className={`w-7 h-7 text-xs rounded font-medium transition-all ${pg === page ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        style={pg === page ? { backgroundColor: 'var(--accent)' } : {}}>{pg}</button>
                    );
                  })}
                  <button onClick={() => changePage(page + 1)} disabled={page === totalPages} className="btn btn-secondary btn-xs disabled:opacity-40">Next →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── GRID VIEW ── */}
        {viewMode === 'grid' && (
          <>
            {loading ? (
              <div className="card p-10 text-center text-gray-400">Loading...</div>
            ) : rows.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">👤</div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">No employees found</h3>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {rows.map(e => (
                    <div
                      key={e.id}
                      onClick={() => openDetail(e.id)}
                      className="card p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] duration-150 select-none"
                    >
                      <Avatar name={e.full_name} photo={e.profile_photo} size="lg" />
                      <div className="mt-3 w-full">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{e.full_name}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{e.designation || 'No designation'}</p>
                        <p className="text-xs text-gray-400 truncate">{e.department || 'No department'}</p>
                        <div className="mt-2 flex items-center justify-center">
                          <Badge text={e.status} />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">{e.employment_type}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} employees
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => changePage(page - 1)} disabled={page === 1} className="btn btn-secondary btn-xs disabled:opacity-40">← Prev</button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pg = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                        return (
                          <button key={pg} onClick={() => changePage(pg)}
                            className={`w-7 h-7 text-xs rounded font-medium transition-all ${pg === page ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                            style={pg === page ? { backgroundColor: 'var(--accent)' } : {}}>{pg}</button>
                        );
                      })}
                      <button onClick={() => changePage(page + 1)} disabled={page === totalPages} className="btn btn-secondary btn-xs disabled:opacity-40">Next →</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── EMPLOYEE DETAIL MODAL ── */}
      {detailEmp && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={() => setDetailEmp(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="modal-surface bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col pointer-events-auto">

            {/* ── Profile header ── */}
            <div className="px-6 pt-6 pb-5 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                {/* Avatar + name block */}
                <div className="flex items-center gap-5">
                  <div className="relative flex-shrink-0">
                    {detailEmp.profile_photo ? (
                      <img src={detailEmp.profile_photo} alt={detailEmp.full_name}
                        className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-800" />
                    ) : (
                      <div className="w-20 h-20 rounded-full ring-4 ring-gray-100 dark:ring-gray-800 bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-2xl font-bold">
                        {detailEmp.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                        {detailEmp.full_name}
                      </h2>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        detailEmp.status === 'Active'
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>{detailEmp.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {detailEmp.designation || 'No designation'}
                    </p>
                    <p className="text-sm font-semibold text-[var(--accent)]">
                      {detailEmp.employee_id}
                    </p>
                  </div>
                </div>

                {/* Contact info grid */}
                <div className="hidden sm:grid grid-cols-1 gap-2 flex-1 max-w-xs ml-auto">
                  {detailEmp.email && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                        <Mail size={13} className="text-blue-500" />
                      </div>
                      <span className="truncate text-xs">{detailEmp.email}</span>
                    </div>
                  )}
                  {detailEmp.mobile && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                        <Phone size={13} className="text-green-500" />
                      </div>
                      <span className="text-xs">{detailEmp.mobile}</span>
                    </div>
                  )}
                  {(detailEmp.office_address || detailEmp.residential_address) && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                        <Building2 size={13} className="text-orange-500" />
                      </div>
                      <span className="text-xs truncate">{detailEmp.office_address || detailEmp.residential_address}</span>
                    </div>
                  )}
                  {detailEmp.date_of_joining && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                        <Calendar size={13} className="text-purple-500" />
                      </div>
                      <span className="text-xs">Joined on {fmtDate(detailEmp.date_of_joining)}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons + close */}
                <div className="flex items-start gap-1.5 flex-shrink-0">
                  {!detailLoading && (
                    <>
                      <button onClick={() => { setDetailEmp(null); openEdit(detailEmp.id); }}
                        className="btn btn-secondary btn-sm gap-1">
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => del(detailEmp.id, detailEmp.full_name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  <button onClick={() => setDetailEmp(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Tab bar ── */}
            {!detailLoading && (
              <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 px-6 overflow-x-auto">
                {[
                  { key: 'overview',    label: 'Overview' },
                  { key: 'job-info',    label: 'Job Info', icon: Briefcase },
                  { key: 'personal',    label: 'Personal Info' },
                  { key: 'documents',   label: 'Documents' },
                  { key: 'attendance',  label: 'Attendance' },
                  { key: 'leaves',      label: 'Leave' },
                  { key: 'edu-exp',     label: 'Education', icon: GraduationCap },
                  { key: 'history',     label: 'History', icon: History },
                  { key: 'payroll',     label: 'Payroll' },
                  { key: 'assets',      label: 'Assets' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => switchDetailTab(tab.key, detailEmp)}
                    className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors -mb-px
                      ${detailTab === tab.key
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    {tab.icon && <tab.icon size={12} />}
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto">
              {detailLoading ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  <div className="animate-spin w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full mr-2.5" />
                  Loading details…
                </div>

              ) : detailTab === 'overview' ? (
                /* ── OVERVIEW: two-column Personal + Job info ── */
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Personal Information</h3>
                    <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
                      {[
                        { label: 'Date of Birth',   value: fmtDate(detailEmp.date_of_birth) },
                        { label: 'Gender',           value: detailEmp.gender },
                        { label: 'Marital Status',   value: detailEmp.marital_status },
                        { label: 'Nationality',      value: detailEmp.nationality },
                        { label: 'Email',            value: detailEmp.email },
                        { label: 'Mobile',           value: detailEmp.mobile },
                      ].map(({ label, value }) => value && value !== '—' ? (
                        <div key={label} className="flex items-start py-3 gap-3">
                          <span className="text-xs text-gray-600 dark:text-gray-300 w-36 flex-shrink-0 pt-0.5">{label}</span>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex-1">{value}</span>
                        </div>
                      ) : null)}
                    </div>
                  </div>

                  {/* Job Information */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Job Information</h3>
                    <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
                      {[
                        { label: 'Department',        value: detailEmp.department },
                        { label: 'Designation',        value: detailEmp.designation },
                        { label: 'Reporting Manager',  value: detailEmp.reporting_manager },
                        { label: 'Employment Type',    value: detailEmp.employment_type },
                        { label: 'Date of Joining',    value: fmtDate(detailEmp.date_of_joining) },
                        { label: 'Notice Period',      value: detailEmp.notice_period_days ? `${detailEmp.notice_period_days} days` : null },
                      ].map(({ label, value }) => value ? (
                        <div key={label} className="flex items-start py-3 gap-3">
                          <span className="text-xs text-gray-600 dark:text-gray-300 w-36 flex-shrink-0 pt-0.5">{label}</span>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex-1">{value}</span>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                </div>

              ) : detailTab === 'job-info' ? (
                /* ── JOB INFORMATION ── */
                <div className="p-6 space-y-6">
                  {/* Header with Update + History + Edit buttons */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Job Information</h3>
                    <div className="flex items-center gap-2">
                      {/* Update button with event-type dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setUpdateDropdownOpen(v => !v)}
                          className="btn btn-primary btn-xs gap-1.5"
                        >
                          <Plus size={11} /> Update
                          <ChevronDown size={10} className={`transition-transform ${updateDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {updateDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setUpdateDropdownOpen(false)} />
                            <div className="absolute right-0 top-full mt-1.5 z-20 w-52 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden py-1">
                              {EVENT_TYPES.filter(t => t !== 'Joining').map(type => {
                                const m = EVENT_META[type] || { icon: Clock, color: 'bg-gray-100 text-gray-600' };
                                const Icon = m.icon;
                                return (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      setUpdateEventType(type);
                                      setUpdateForm({ effective_date: '', approved_by: '', remarks: '' });
                                      setUpdateModalOpen(true);
                                      setUpdateDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                                  >
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${m.color}`}>
                                      <Icon size={11} />
                                    </span>
                                    {type}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          const next = !historyDropdownOpen;
                          setHistoryDropdownOpen(next);
                          if (next && history.length === 0) loadHistory(detailEmp.id);
                        }}
                        className={`btn btn-xs gap-1.5 ${historyDropdownOpen ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        <History size={11} /> History
                        <ChevronDown size={10} className={`transition-transform ${historyDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <button onClick={openJobInfoEdit} className="btn btn-secondary btn-xs gap-1.5">
                        <Pencil size={11} /> Edit
                      </button>
                    </div>
                  </div>

                  {/* Inline history dropdown */}
                  {historyDropdownOpen && (
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Employment History</span>
                        <button onClick={() => setHistoryDropdownOpen(false)} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400">
                          <X size={12} />
                        </button>
                      </div>
                      <div className="p-4">
                        {historyLoading ? (
                          <div className="text-center py-4 text-xs text-gray-400">Loading…</div>
                        ) : history.length === 0 ? (
                          <div className="text-center py-4 text-xs text-gray-400">No history events yet</div>
                        ) : (
                          <div className="relative">
                            <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
                            <div className="space-y-3">
                              {(() => {
                                const synthetic = detailEmp.date_of_joining ? [{
                                  id: '__join__', _synthetic: true,
                                  change_type: 'Joining',
                                  effective_date: detailEmp.date_of_joining,
                                  to_designation: detailEmp.designation,
                                  to_department: detailEmp.department,
                                  remarks: 'Initial joining record',
                                }] : [];
                                const allEvents = [...history, ...synthetic].sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date));
                                return allEvents.map((ev, i) => {
                                  const m = EVENT_META[ev.change_type] || { icon: Clock, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
                                  const Icon = m.icon;
                                  return (
                                    <div key={ev.id || i} className="relative flex gap-3 pl-10">
                                      <div className={`absolute left-0 w-8 h-8 rounded-full ${m.color} flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-gray-900 z-10`}>
                                        <Icon size={14} />
                                      </div>
                                      <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{ev.change_type}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{fmtDate(ev.effective_date)}</p>
                                            {(ev.from_designation || ev.to_designation) && (
                                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1 flex-wrap">
                                                {ev.from_designation && <span className="line-through text-gray-400">{ev.from_designation}</span>}
                                                {ev.from_designation && ev.to_designation && <span className="text-gray-400">→</span>}
                                                {ev.to_designation && <span>{ev.to_designation}</span>}
                                              </p>
                                            )}
                                            {(ev.from_department || ev.to_department) && (
                                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1 flex-wrap">
                                                {ev.from_department && <span className="text-gray-400">{ev.from_department}</span>}
                                                {ev.from_department && ev.to_department && <span className="text-gray-400">→</span>}
                                                {ev.to_department && <span>{ev.to_department}</span>}
                                              </p>
                                            )}
                                            {(ev.salary_before != null || ev.salary_after != null) && (
                                              <p className="text-xs font-medium mt-1 flex items-center gap-1 flex-wrap">
                                                {ev.salary_before != null && <span className="text-gray-400 line-through">₹{Number(ev.salary_before).toLocaleString('en-IN')}</span>}
                                                {ev.salary_before != null && ev.salary_after != null && <span className="text-gray-400">→</span>}
                                                {ev.salary_after != null && <span className="text-green-600">₹{Number(ev.salary_after).toLocaleString('en-IN')}</span>}
                                              </p>
                                            )}
                                            {ev.remarks && <p className="text-[11px] text-gray-400 mt-1 italic">{ev.remarks}</p>}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Grid of info cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Employment Details */}
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Employment Details</span>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {[
                          { label: 'Employee ID',      value: detailEmp.employee_id },
                          { label: 'Department',       value: detailEmp.department },
                          { label: 'Designation',      value: detailEmp.designation },
                          { label: 'Employment Type',  value: detailEmp.employment_type },
                          { label: 'Reporting Manager',value: detailEmp.reporting_manager },
                          { label: 'Work Location',    value: detailEmp.office_address?.split(',')[0] || '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-start px-4 py-3 gap-3">
                            <span className="text-xs text-gray-600 dark:text-gray-300 w-36 flex-shrink-0 pt-0.5">{label}</span>
                            <span className={`text-xs font-semibold flex-1 ${value && value !== '—' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-300 dark:text-gray-600 italic'}`}>{value || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dates & Periods */}
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Dates & Periods</span>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {[
                          { label: 'Date of Joining',   value: fmtDate(detailEmp.date_of_joining) },
                          { label: 'Date of Birth',     value: fmtDate(detailEmp.date_of_birth) },
                          { label: 'Notice Period',     value: detailEmp.notice_period_days ? `${detailEmp.notice_period_days} days` : '—' },
                          { label: 'Probation Period',  value: detailEmp.probation_period_days ? `${detailEmp.probation_period_days} days` : '—' },
                          { label: 'Tenure',            value: (() => { if (!detailEmp.date_of_joining) return '—'; const d = new Date(detailEmp.date_of_joining); const now = new Date(); const months = (now.getFullYear()-d.getFullYear())*12 + now.getMonth()-d.getMonth(); const y = Math.floor(months/12), m = months%12; return y > 0 ? `${y}y ${m}m` : `${m} months`; })() },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-start px-4 py-3 gap-3">
                            <span className="text-xs text-gray-600 dark:text-gray-300 w-36 flex-shrink-0 pt-0.5">{label}</span>
                            <span className={`text-xs font-semibold flex-1 ${value && value !== '—' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-300 dark:text-gray-600 italic'}`}>{value || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Statutory & Compliance */}
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Statutory & Compliance</span>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {[
                          { label: 'Aadhaar No.',      value: detailEmp.aadhar_no ? `****${detailEmp.aadhar_no.slice(-4)}` : '—' },
                          { label: 'PAN No.',          value: detailEmp.pan_no || '—' },
                          { label: 'PF Applicable',    value: detailEmp.pf_applicable ? 'Yes' : 'No' },
                          { label: 'ESI Applicable',   value: detailEmp.esi_applicable ? 'Yes (if eligible)' : 'No' },
                          { label: 'PT State',         value: detailEmp.pt_state || '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-start px-4 py-3 gap-3">
                            <span className="text-xs text-gray-600 dark:text-gray-300 w-36 flex-shrink-0 pt-0.5">{label}</span>
                            <span className={`text-xs font-semibold flex-1 ${value && value !== '—' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-300 dark:text-gray-600 italic'}`}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bank Details */}
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Bank Details</span>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {[
                          { label: 'Bank Name',        value: detailEmp.bank_name || '—' },
                          { label: 'Account No.',      value: detailEmp.bank_account_no ? `****${detailEmp.bank_account_no.slice(-4)}` : '—' },
                          { label: 'IFSC Code',        value: detailEmp.bank_ifsc || '—' },
                          { label: 'Branch',           value: detailEmp.bank_branch || '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-start px-4 py-3 gap-3">
                            <span className="text-xs text-gray-600 dark:text-gray-300 w-36 flex-shrink-0 pt-0.5">{label}</span>
                            <span className={`text-xs font-semibold flex-1 ${value && value !== '—' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-300 dark:text-gray-600 italic'}`}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Status badge row */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    {[
                      { label: detailEmp.status || 'Active',        color: detailEmp.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
                      { label: detailEmp.employment_type,           color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' },
                      detailEmp.pf_applicable  && { label: 'PF Enrolled',   color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800' },
                      detailEmp.esi_applicable && { label: 'ESI Eligible',  color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' },
                    ].filter(Boolean).map(({ label, color }) => label && (
                      <span key={label} className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold ${color}`}>{label}</span>
                    ))}
                  </div>
                </div>

              ) : detailTab === 'personal' ? (
                /* ── PERSONAL INFO: two-column layout ── */
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* LEFT: Personal Details + Address */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Personal Details</h3>
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {[
                          { label: 'Full Name',      value: detailEmp.full_name },
                          { label: 'Date of Birth',  value: fmtDate(detailEmp.date_of_birth) },
                          { label: 'Gender',         value: detailEmp.gender },
                          { label: 'Marital Status', value: detailEmp.marital_status },
                          { label: 'Nationality',    value: detailEmp.nationality },
                          { label: 'Email',          value: detailEmp.email },
                          { label: 'Mobile',         value: detailEmp.mobile },
                        ].map(({ label, value }) => value ? (
                          <div key={label} className="flex items-start py-2.5 gap-3">
                            <span className="text-xs text-gray-500 dark:text-gray-300 w-32 flex-shrink-0 pt-0.5">{label}</span>
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex-1">{value}</span>
                          </div>
                        ) : null)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Address</h3>
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {[
                          { label: 'Residential', value: detailEmp.residential_address },
                          { label: 'Office',      value: detailEmp.office_address },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-start py-2.5 gap-3">
                            <span className="text-xs text-gray-500 dark:text-gray-300 w-32 flex-shrink-0 pt-0.5">{label}</span>
                            <span className={`text-xs font-semibold flex-1 ${value ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600 italic'}`}>
                              {value || '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Bank Details + Identity + Emergency Contact */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Bank Details</h3>
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {[
                          { label: 'Bank Name',      value: detailEmp.bank_name },
                          { label: 'Account No.',    value: detailEmp.bank_account_no },
                          { label: 'IFSC Code',      value: detailEmp.bank_ifsc },
                          { label: 'Branch',         value: detailEmp.bank_branch },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-start py-2.5 gap-3">
                            <span className="text-xs text-gray-500 dark:text-gray-300 w-32 flex-shrink-0 pt-0.5">{label}</span>
                            <span className={`text-xs font-semibold flex-1 ${value ? 'text-gray-800 dark:text-gray-200 font-mono' : 'text-gray-400 dark:text-gray-600 italic'}`}>
                              {value || '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {(detailEmp.aadhar_no || detailEmp.pan_no) && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Identity Documents</h3>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {[
                            { label: 'Aadhaar', value: detailEmp.aadhar_no },
                            { label: 'PAN',     value: detailEmp.pan_no },
                          ].map(({ label, value }) => value ? (
                            <div key={label} className="flex items-start py-2.5 gap-3">
                              <span className="text-xs text-gray-500 dark:text-gray-300 w-32 flex-shrink-0 pt-0.5">{label}</span>
                              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 font-mono flex-1">{value}</span>
                            </div>
                          ) : null)}
                        </div>
                      </div>
                    )}
                    {detailEmp._ec?.name && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Emergency Contact</h3>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {[
                            { label: 'Name',         value: detailEmp._ec.name },
                            { label: 'Relationship', value: detailEmp._ec.relationship_type },
                            { label: 'Phone',        value: detailEmp._ec.phone },
                          ].map(({ label, value }) => value ? (
                            <div key={label} className="flex items-start py-2.5 gap-3">
                              <span className="text-xs text-gray-500 dark:text-gray-300 w-32 flex-shrink-0 pt-0.5">{label}</span>
                              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex-1">{value}</span>
                            </div>
                          ) : null)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              ) : detailTab === 'documents' ? (
                /* ── DOCUMENTS ── */
                <div className="p-6 space-y-4">
                  {/* Upload bar */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Employee Documents</h3>
                    <button
                      onClick={() => setEmpDocUpload(v => !v)}
                      className="btn btn-primary btn-sm gap-1.5"
                    >
                      <Plus size={13} /> Upload
                    </button>
                  </div>

                  {/* Upload form */}
                  {empDocUpload && (
                    <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Document Type</label>
                          <Select
                            value={empDocForm.document_type}
                            onChange={v => setEmpDocForm(p => ({ ...p, document_type: v }))}
                            options={['Aadhaar', 'PAN', 'Passport', 'Offer Letter', 'Experience Letter', 'Education Certificate', 'Other']}
                            placeholder="Select type"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Document Name</label>
                          <input
                            className="form-input text-sm"
                            placeholder="e.g. Aadhaar Card"
                            value={empDocForm.document_name}
                            onChange={e => setEmpDocForm(p => ({ ...p, document_name: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">File</label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[var(--accent)] file:text-white cursor-pointer"
                          onChange={e => setEmpDocFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={uploadEmpDoc}
                          disabled={empDocSaving}
                          className="btn btn-primary btn-sm gap-1.5 disabled:opacity-60"
                        >
                          <Upload size={12} /> {empDocSaving ? 'Uploading…' : 'Upload'}
                        </button>
                        <button
                          onClick={() => { setEmpDocUpload(false); setEmpDocFile(null); setEmpDocForm({ document_type: '', document_name: '' }); }}
                          className="btn btn-secondary btn-sm"
                        >Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Doc list */}
                  {empDocsLoading ? (
                    <div className="text-center py-8 text-sm text-gray-400">Loading documents…</div>
                  ) : empDocs.length === 0 ? (
                    <div className="empty-state py-8">
                      <FileText size={28} className="mx-auto mb-2 text-gray-200" />
                      <p className="text-sm text-gray-400">No documents uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {empDocs.map(d => (
                        <div key={d.id} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <FileText size={14} className="text-[var(--accent)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{d.document_name || d.document_type}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{d.document_type}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <a href={d.file_url} download={d.document_name || 'document'}
                              className="btn btn-secondary btn-xs gap-1">
                              <Download size={11} /> Download
                            </a>
                            <button onClick={() => deleteEmpDoc(d.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              ) : detailTab === 'attendance' ? (
                /* ── ATTENDANCE CALENDAR ── */
                (() => {
                  const ATT_MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                  const ATT_DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                  const STATUS_CELL = {
                    Present:    'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200',
                    Absent:     'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200',
                    'On Leave': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200',
                    'Half Day': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200',
                    WFH:        'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200',
                  };
                  const STATUS_BADGE = {
                    Present:    'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
                    Absent:     'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
                    'On Leave': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
                    'Half Day': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
                    WFH:        'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
                  };
                  const prevAttMonth = () => {
                    const ny = attCalMonth === 1 ? attCalYear - 1 : attCalYear;
                    const nm = attCalMonth === 1 ? 12 : attCalMonth - 1;
                    setAttCalYear(ny); setAttCalMonth(nm); setAttCalSelected(null);
                    if (detailEmp?.id) loadEmpAtt(detailEmp.id, ny, nm);
                  };
                  const nextAttMonth = () => {
                    const ny = attCalMonth === 12 ? attCalYear + 1 : attCalYear;
                    const nm = attCalMonth === 12 ? 1 : attCalMonth + 1;
                    setAttCalYear(ny); setAttCalMonth(nm); setAttCalSelected(null);
                    if (detailEmp?.id) loadEmpAtt(detailEmp.id, ny, nm);
                  };
                  const firstDay    = new Date(attCalYear, attCalMonth - 1, 1).getDay();
                  const daysInMonth = new Date(attCalYear, attCalMonth, 0).getDate();
                  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
                  const ds = d => `${attCalYear}-${String(attCalMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                  const attByDate     = empAtt.reduce((m, a) => { m[a.date] = a; return m; }, {});
                  const holidayByDate = attHolidays.reduce((m, h) => { m[h.date] = h; return m; }, {});
                  const todayStr  = new Date().toISOString().slice(0, 10);
                  const selRec    = attCalSelected ? attByDate[attCalSelected] : null;
                  const selHol    = attCalSelected ? holidayByDate[attCalSelected] : null;
                  const summary   = empAtt.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});

                  return (
                    <div className="p-4 space-y-3">
                      {/* Month navigator */}
                      <div className="flex items-center justify-between">
                        <button onClick={prevAttMonth} className="btn btn-secondary btn-sm p-1.5"><ChevronLeft size={14} /></button>
                        <span className="text-sm font-semibold text-gray-800 dark:text-white">
                          {ATT_MONTH_NAMES[attCalMonth - 1]} {attCalYear}
                        </span>
                        <button onClick={nextAttMonth} className="btn btn-secondary btn-sm p-1.5"><ChevronRight size={14} /></button>
                      </div>

                      {/* Summary chips */}
                      {Object.keys(summary).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(summary).map(([s, c]) => (
                            <span key={s} className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[s] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              {s}: {c}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Calendar grid */}
                      <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                          {ATT_DAY_NAMES.map((d, idx) => (
                            <div key={d} className={`py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider ${idx === 0 || idx === 6 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
                          ))}
                        </div>

                        {empAttLoading ? (
                          <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
                        ) : (
                          <div className="grid grid-cols-7 divide-x divide-gray-100 dark:divide-gray-800">
                            {cells.map((d, i) => {
                              if (!d) return <div key={`e-${i}`} className="min-h-[68px] bg-gray-50/40 dark:bg-gray-900/20" />;
                              const dateKey  = ds(d);
                              const rec      = attByDate[dateKey];
                              const hol      = holidayByDate[dateKey];
                              const isToday  = dateKey === todayStr;
                              const isWknd   = (i % 7 === 0 || i % 7 === 6);
                              const isSel    = attCalSelected === dateKey;
                              return (
                                <button
                                  key={d}
                                  onClick={() => setAttCalSelected(isSel ? null : dateKey)}
                                  className={`min-h-[68px] p-1.5 text-left border-b border-gray-100 dark:border-gray-800 transition-colors
                                    ${isSel ? 'ring-2 ring-inset ring-[var(--accent)]' : ''}
                                    ${rec ? STATUS_CELL[rec.status] || 'bg-gray-100 hover:bg-gray-200'
                                      : hol ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                                      : isWknd ? 'bg-red-50/40 dark:bg-red-900/10'
                                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}
                                >
                                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold mb-0.5
                                    ${isToday ? 'text-white' : rec ? '' : hol ? 'text-green-600 dark:text-green-400' : isWknd ? 'text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
                                    style={isToday ? { backgroundColor: 'var(--accent)' } : {}}>
                                    {d}
                                  </span>
                                  {rec && (
                                    <div className="text-[9px] font-semibold leading-tight truncate opacity-80">
                                      {rec.status === 'On Leave' ? 'Leave' : rec.status}
                                    </div>
                                  )}
                                  {hol && !rec && (
                                    <div className="text-[9px] font-semibold leading-tight truncate text-green-600 dark:text-green-400">
                                      {hol.name}
                                    </div>
                                  )}
                                  {(rec?.in_time || rec?.out_time || rec?.working_hours) && (
                                    <div className="text-[11px] opacity-70 leading-snug mt-0.5 space-y-px">
                                      {rec.in_time  && <div>▲ {fmtTime12(rec.in_time)}</div>}
                                      {rec.out_time && <div>▼ {fmtTime12(rec.out_time)}</div>}
                                      {rec.working_hours ? <div className="opacity-80 font-semibold">{fmtHours(rec.working_hours)}</div> : null}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Selected day detail */}
                      {selRec && (
                        <div className={`rounded-xl border p-3.5 ${STATUS_BADGE[selRec.status] || 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <p className="text-xs font-bold">{fmtDate(selRec.date)} — <span>{selRec.status}</span></p>
                              {(selRec.in_time || selRec.out_time) && (
                                <p className="text-xs mt-0.5 opacity-80">
                                  Login: {fmtTime12(selRec.in_time) || '—'} &nbsp;·&nbsp; Logout: {fmtTime12(selRec.out_time) || '—'}
                                  {selRec.working_hours ? ` · ${fmtHours(selRec.working_hours)} worked` : ''}
                                </p>
                              )}
                            </div>
                            <button onClick={() => setAttCalSelected(null)} className="opacity-50 hover:opacity-100"><X size={13} /></button>
                          </div>
                        </div>
                      )}
                      {selHol && (
                        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3.5 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-green-700 dark:text-green-400">{fmtDate(selHol.date)} — Holiday</p>
                            <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">{selHol.name}{selHol.holiday_type ? ` · ${selHol.holiday_type}` : ''}</p>
                          </div>
                          <button onClick={() => setAttCalSelected(null)} className="opacity-50 hover:opacity-100 text-green-700"><X size={13} /></button>
                        </div>
                      )}
                      {attCalSelected && !selRec && !selHol && !empAttLoading && (
                        <p className="text-xs text-center text-gray-400 py-1">No record for this day</p>
                      )}
                    </div>
                  );
                })()

              ) : detailTab === 'leaves' ? (
                /* ── LEAVES ── */
                <div className="p-6 space-y-5">
                  {empLeavesLoading ? (
                    <div className="text-center py-8 text-sm text-gray-400">Loading leave data…</div>
                  ) : (
                    <>
                      {/* Leave balances */}
                      {empLeaveBalances.length > 0 && (
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Leave Balances</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {empLeaveBalances.map(b => {
                              const usedPct = b.allocated ? Math.min((b.used / b.allocated) * 100, 100) : 0;
                              return (
                                <div key={b.id} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5">
                                  <p className="text-[11px] text-gray-500 truncate mb-1">{b.leave_type}</p>
                                  <div className="flex items-end justify-between">
                                    <span className={`text-base font-bold ${b.available === 0 ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>{b.available}</span>
                                    <span className="text-[11px] text-gray-400">/ {b.allocated}</span>
                                  </div>
                                  <div className="h-1 mt-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${usedPct >= 90 ? 'bg-red-500' : usedPct >= 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${usedPct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Leave applications */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Leave History</h3>
                        {empLeaves.length === 0 ? (
                          <div className="empty-state py-6">
                            <CalendarDays size={28} className="mx-auto mb-2 text-gray-200" />
                            <p className="text-sm text-gray-400">No leave applications</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-72 overflow-y-auto">
                            {empLeaves.map(lv => {
                              const statusColor = { Pending: 'bg-amber-50 text-amber-700 border-amber-200', Approved: 'bg-green-50 text-green-700 border-green-200', Rejected: 'bg-red-50 text-red-700 border-red-200' };
                              return (
                                <div key={lv.id} className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{lv.leave_type}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{lv.from_date} → {lv.to_date} · {lv.total_days} day{lv.total_days !== 1 ? 's' : ''}</p>
                                  </div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${statusColor[lv.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                    {lv.status}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

              ) : detailTab === 'edu-exp' ? (
                <EmployeeEduExpTab
                  emp={detailEmp}
                  onSave={saveEduExp}
                  saving={eduExpSaving}
                />

              ) : detailTab === 'history' ? (
                <EmployeeHistoryTab
                  emp={detailEmp}
                  history={history}
                  loading={historyLoading}
                  showForm={showHistoryForm}
                  setShowForm={setShowHistoryForm}
                  form={historyForm}
                  setForm={hf}
                  saving={historySaving}
                  onSave={saveHistoryEvent}
                  onDelete={deleteHistoryEvent}
                />

              ) : detailTab === 'payroll' ? (
                /* ── PAYROLL ── */
                <div className="p-6 space-y-6">
                  {detailEmp.basic_salary ? (
                    <>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Salary Structure</h3>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {[
                            { label: 'Basic Salary',       value: `₹${Number(detailEmp.basic_salary).toLocaleString('en-IN')} / month` },
                            { label: 'HRA',                value: detailEmp.hra_percent ? `${detailEmp.hra_percent}% of basic` : null },
                            { label: 'Special Allowance',  value: detailEmp.special_allowance ? `₹${Number(detailEmp.special_allowance).toLocaleString('en-IN')}` : null },
                            { label: 'LTA',                value: detailEmp.lta ? `₹${Number(detailEmp.lta).toLocaleString('en-IN')}` : null },
                            { label: 'Other Allowance',    value: detailEmp.other_allowance ? `₹${Number(detailEmp.other_allowance).toLocaleString('en-IN')}` : null },
                            { label: 'PF',                 value: detailEmp.pf_applicable ? 'Applicable' : 'Not applicable' },
                            { label: 'ESI',                value: detailEmp.esi_applicable ? 'Applicable (gross ≤ ₹21,000)' : 'Not applicable' },
                          ].map(({ label, value }) => value ? (
                            <div key={label} className="flex items-start py-2.5 gap-3">
                              <span className="text-xs text-gray-400 w-40 flex-shrink-0 pt-0.5">{label}</span>
                              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex-1">{value}</span>
                            </div>
                          ) : null)}
                        </div>
                      </div>
                      {(() => {
                        const calc = calcLivePayroll(detailEmp);
                        if (!calc) return null;
                        return (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-center">
                              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">₹{calc.gross.toLocaleString('en-IN')}</p>
                              <p className="text-xs text-blue-500 mt-0.5">Gross / month</p>
                            </div>
                            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-3 text-center">
                              <p className="text-lg font-bold text-green-700 dark:text-green-300">₹{calc.net.toLocaleString('en-IN')}</p>
                              <p className="text-xs text-green-500 mt-0.5">Net / month (est.)</p>
                            </div>
                          </div>
                        );
                      })()}
                      {(detailEmp.bank_name || detailEmp.bank_account_no) && (
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Bank Details</h3>
                          <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {[
                              { label: 'Bank',        value: detailEmp.bank_name },
                              { label: 'Account No.', value: detailEmp.bank_account_no },
                              { label: 'IFSC',        value: detailEmp.bank_ifsc },
                              { label: 'Branch',      value: detailEmp.bank_branch },
                            ].map(({ label, value }) => value ? (
                              <div key={label} className="flex items-start py-2.5 gap-3">
                                <span className="text-xs text-gray-400 w-40 flex-shrink-0 pt-0.5">{label}</span>
                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 font-mono flex-1">{value}</span>
                              </div>
                            ) : null)}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="empty-state py-10">
                      <CreditCard size={32} className="mx-auto mb-2 text-gray-200" />
                      <p className="text-sm text-gray-400">No payroll information added yet</p>
                      <button onClick={() => { setDetailEmp(null); openEdit(detailEmp.id); }}
                        className="btn btn-secondary btn-sm mt-3 gap-1"><Pencil size={12} /> Add via Edit</button>
                    </div>
                  )}
                </div>

              ) : detailTab === 'assets' ? (
                /* ── ASSETS ── */
                <div className="p-6">
                  {detailEmp._assets?.length > 0 ? (
                    <div className="space-y-2">
                      {detailEmp._assets.map(a => (
                        <div key={a.id} className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Monitor size={14} className="text-gray-500" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{a.asset_name}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">{a.asset_type}{a.serial_number ? ` · ${a.serial_number}` : ''}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                            a.status === 'Allocated' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-200 text-gray-500'
                          }`}>{a.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state py-10">
                      <Monitor size={32} className="mx-auto mb-2 text-gray-200" />
                      <p className="text-sm text-gray-400">No assets allocated to this employee</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
          </div>
        </>
      )}

      {/* ── UPDATE (HISTORY EVENT) MODAL ── */}
      {(() => {
        const type = updateEventType;
        const needsDesig  = ['Promotion', 'Demotion', 'Role Change'].includes(type);
        const needsDept   = ['Department Change', 'Transfer'].includes(type);
        const needsSalary = type === 'Salary Hike';
        const needsLwd    = ['Resignation', 'Notice Served'].includes(type);
        const m = EVENT_META[type] || { icon: Clock, color: 'bg-gray-100 text-gray-600' };
        const Icon = m.icon;
        const uf = v => setUpdateForm(p => ({ ...p, ...v }));
        return (
          <Modal
            open={updateModalOpen}
            title={
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${m.color}`}>
                  <Icon size={12} />
                </span>
                {type}
              </div>
            }
            onClose={() => { setUpdateModalOpen(false); setUpdateForm({}); setUpdateEventType(''); }}
            onSave={saveUpdate}
            saveLabel={updateSaving ? 'Saving…' : 'Save Event'}
          >
            <FormSection title="Event Details">
              <FormGrid cols={2}>
                <Field label="Effective Date" required>
                  <DatePicker value={updateForm.effective_date || ''} onChange={v => uf({ effective_date: v })} placeholder="Select date" />
                </Field>
                <Field label="Approved By">
                  <input
                    className="form-input w-full"
                    value={updateForm.approved_by || ''}
                    onChange={e => uf({ approved_by: e.target.value })}
                    placeholder="e.g. Rajesh Kumar"
                  />
                </Field>
                {needsDesig && (<>
                  <Field label="From Designation">
                    <input className="form-input w-full" value={updateForm.from_designation || ''} onChange={e => uf({ from_designation: e.target.value })} placeholder="Previous designation" />
                  </Field>
                  <Field label="To Designation">
                    <input className="form-input w-full" value={updateForm.to_designation || ''} onChange={e => uf({ to_designation: e.target.value })} placeholder="New designation" />
                  </Field>
                </>)}
                {needsDept && (<>
                  <Field label="From Department">
                    <input className="form-input w-full" value={updateForm.from_department || ''} onChange={e => uf({ from_department: e.target.value })} placeholder="Previous department" />
                  </Field>
                  <Field label="To Department">
                    <input className="form-input w-full" value={updateForm.to_department || ''} onChange={e => uf({ to_department: e.target.value })} placeholder="New department" />
                  </Field>
                </>)}
                {needsSalary && (<>
                  <Field label="Previous Salary (₹)">
                    <input type="number" className="form-input w-full" value={updateForm.salary_before || ''} onChange={e => uf({ salary_before: e.target.value })} placeholder="e.g. 30000" min="0" />
                  </Field>
                  <Field label="New Salary (₹)">
                    <input type="number" className="form-input w-full" value={updateForm.salary_after || ''} onChange={e => uf({ salary_after: e.target.value })} placeholder="e.g. 35000" min="0" />
                  </Field>
                </>)}
                {needsLwd && (
                  <Field label="Last Working Date">
                    <DatePicker value={updateForm.last_working_date || ''} onChange={v => uf({ last_working_date: v })} placeholder="Select date" />
                  </Field>
                )}
                <Field label="Remarks" full>
                  <textarea className="form-input w-full resize-none" rows={2} value={updateForm.remarks || ''} onChange={e => uf({ remarks: e.target.value })} placeholder="Any additional notes…" />
                </Field>
              </FormGrid>
            </FormSection>
          </Modal>
        );
      })()}

      {/* ── JOB INFO EDIT MODAL ── */}
      <Modal
        open={jobInfoEditOpen}
        title="Edit Job Information"
        onClose={() => setJobInfoEditOpen(false)}
        onSave={saveJobInfo}
        saveLabel={jobInfoSaving ? 'Saving…' : 'Save'}
      >
        <FormSection title="Role & Department">
          <FormGrid cols={2}>
            <Field label="Department">
              <Select
                value={String(jobInfoForm.department_id || '')}
                onChange={v => setJobInfoForm(p => ({ ...p, department_id: v }))}
                options={[{ value: '', label: '– Select –' }, ...depts.map(d => ({ value: String(d.id), label: d.name }))]}
                placeholder="– Select –"
              />
            </Field>
            <Field label="Designation">
              <Select
                value={String(jobInfoForm.designation_id || '')}
                onChange={v => setJobInfoForm(p => ({ ...p, designation_id: v }))}
                options={[{ value: '', label: '– Select –' }, ...desigs.map(d => ({ value: String(d.id), label: d.name }))]}
                placeholder="– Select –"
              />
            </Field>
            <Field label="Employment Type">
              <Select
                value={jobInfoForm.employment_type || ''}
                onChange={v => setJobInfoForm(p => ({ ...p, employment_type: v }))}
                options={['Full-time', 'Part-time', 'Contract', 'Intern', 'Consultant'].map(t => ({ value: t, label: t }))}
              />
            </Field>
            <Field label="Status">
              <Select
                value={jobInfoForm.status || ''}
                onChange={v => setJobInfoForm(p => ({ ...p, status: v }))}
                options={['Active', 'Inactive', 'On Leave', 'Resigned', 'Terminated'].map(s => ({ value: s, label: s }))}
              />
            </Field>
            <Field label="Reporting Manager">
              <Select
                value={String(jobInfoForm.reports_to_id || '')}
                onChange={v => setJobInfoForm(p => ({ ...p, reports_to_id: v || null }))}
                options={[{ value: '', label: '– None –' }, ...allEmps.filter(e => e.id !== detailEmp?.id).map(e => ({ value: String(e.id), label: e.full_name }))]}
                placeholder="– None –"
              />
            </Field>
            <Field label="Work Location">
              <input
                className="form-input w-full"
                value={jobInfoForm.office_address || ''}
                onChange={e => setJobInfoForm(p => ({ ...p, office_address: e.target.value }))}
                placeholder="Office address / location"
              />
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection title="Dates & Periods">
          <FormGrid cols={2}>
            <Field label="Date of Joining">
              <DatePicker
                value={jobInfoForm.date_of_joining || ''}
                onChange={v => setJobInfoForm(p => ({ ...p, date_of_joining: v }))}
              />
            </Field>
            <div />
            <Field label="Notice Period (days)">
              <input
                type="number"
                className="form-input w-full"
                value={jobInfoForm.notice_period_days ?? ''}
                onChange={e => setJobInfoForm(p => ({ ...p, notice_period_days: e.target.value }))}
                placeholder="e.g. 30"
                min={0}
              />
            </Field>
            <Field label="Probation Period (days)">
              <input
                type="number"
                className="form-input w-full"
                value={jobInfoForm.probation_period_days ?? ''}
                onChange={e => setJobInfoForm(p => ({ ...p, probation_period_days: e.target.value }))}
                placeholder="e.g. 90"
                min={0}
              />
            </Field>
          </FormGrid>
        </FormSection>
      </Modal>

      {/* ── ADD / EDIT MODAL ── */}
      <Modal open={!!modal} title={modal?.mode === 'add' ? 'New Employee' : form.full_name || 'Edit Employee'}
        onClose={() => setModal(null)} onSave={save} saveLabel={modal?.mode === 'add' ? 'Save Employee' : 'Save Changes'}>
        {modal?.mode === 'add' && (
          <FormSection title="Login Credentials">
            <div className="mb-3 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                These credentials will be used to log into the portal.
                If this person already has an HR/Admin login, enter their existing username and email — leave password blank and the accounts will be linked automatically.
              </p>
            </div>
            <FormGrid>
              <Field label="Username" required>
                <input className="form-input" value={form.username || ''}
                  onChange={e => f({ username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  placeholder="e.g. john.doe" autoComplete="off" />
              </Field>
              <Field label="Email" required>
                <input type="email" className="form-input" value={form.email || ''}
                  onChange={e => f({ email: e.target.value })} placeholder="john@company.com" autoComplete="off" />
              </Field>
              <Field label="Password (leave blank if existing account)">
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} className="form-input pr-10" value={form.password || ''}
                    onChange={e => f({ password: e.target.value })} placeholder="Leave blank to link existing account" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
            </FormGrid>
          </FormSection>
        )}
        <FormSection title="Employment Details">
          <FormGrid>
            {modal?.mode === 'edit' && (
              <Field label="Status">
                <Select
                  value={form.status || ''}
                  onChange={v => f({ status: v })}
                  options={['Active', 'Inactive', 'Left']}
                />
              </Field>
            )}
            <Field label="Employee ID">
              <input className="form-input font-mono" value={form.employee_id || ''} onChange={e => f({ employee_id: e.target.value })} placeholder="e.g. EMP-0004" />
            </Field>
            <Field label="Department">
              <Select
                value={form.department_id || ''}
                onChange={v => f({ department_id: v })}
                options={[{ value: '', label: 'Select' }, ...depts.map(d => ({ value: String(d.id), label: d.name }))]}
                placeholder="Select"
              />
            </Field>
            <Field label="Designation">
              <Select
                value={form.designation_id || ''}
                onChange={v => f({ designation_id: v })}
                options={[{ value: '', label: 'Select' }, ...desigs.map(d => ({ value: String(d.id), label: d.name }))]}
                placeholder="Select"
              />
            </Field>
            <Field label="Employment Type">
              <Select
                value={form.employment_type || 'Full-time'}
                onChange={v => f({ employment_type: v })}
                options={['Full-time', 'Part-time', 'Contract', 'Intern']}
              />
            </Field>
            <Field label="Date of Joining" required>
              <DatePicker value={form.date_of_joining || ''} onChange={v => f({ date_of_joining: v })} placeholder="Select joining date" />
            </Field>
            <Field label="Reporting Manager">
              <Select
                value={form.reports_to_id || ''}
                onChange={v => f({ reports_to_id: v || null })}
                options={[{ value: '', label: 'None' }, ...allEmps.filter(e => e.id !== modal?.id).map(e => ({ value: String(e.id), label: e.full_name }))]}
                placeholder="None"
                searchable
              />
            </Field>
            <Field label="Notice Period">
              <Select
                value={form.notice_period_days ?? ''}
                onChange={v => f({ notice_period_days: v || null })}
                options={[
                  { value: '', label: 'Not set' },
                  { value: '15', label: '15 days' },
                  { value: '30', label: '30 days (1 month)' },
                  { value: '45', label: '45 days' },
                  { value: '60', label: '60 days (2 months)' },
                  { value: '90', label: '90 days (3 months)' },
                  { value: '180', label: '180 days (6 months)' },
                ]}
                placeholder="Not set"
              />
            </Field>
            <Field label="Probation Period">
              <Select
                value={form.probation_period_days ?? ''}
                onChange={v => f({ probation_period_days: v || null })}
                options={[
                  { value: '', label: 'Not set' },
                  { value: '30', label: '30 days (1 month)' },
                  { value: '60', label: '60 days (2 months)' },
                  { value: '90', label: '90 days (3 months)' },
                  { value: '180', label: '180 days (6 months)' },
                  { value: '365', label: '1 year' },
                ]}
                placeholder="Not set"
              />
            </Field>
            <Field label="Office Address" full>
              <textarea className="form-textarea" rows={2} value={form.office_address || ''} onChange={e => f({ office_address: e.target.value })} placeholder="e.g. 3rd Floor, Tech Park, Whitefield, Bengaluru — 560066" />
            </Field>
            <Field label="Residential Address" full>
              <textarea className="form-textarea" rows={2} value={form.residential_address || ''} onChange={e => f({ residential_address: e.target.value })} placeholder="Home address of the employee" />
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection title="Personal Details">
          <FormGrid>
            <Field label="First Name" required>
              <input className="form-input" value={form.first_name || ''} onChange={e => f({ first_name: e.target.value })} placeholder="First name" />
            </Field>
            <Field label="Last Name">
              <input className="form-input" value={form.last_name || ''} onChange={e => f({ last_name: e.target.value })} placeholder="Last name" />
            </Field>
            {modal?.mode === 'edit' && (
              <Field label="Email">
                <input type="email" className="form-input" value={form.email || ''} onChange={e => f({ email: e.target.value })} placeholder="Email" />
              </Field>
            )}
            <Field label="Mobile">
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 select-none">+91</span>
                <input
                  className="form-input rounded-l-none flex-1"
                  value={(form.mobile || '').replace(/^\+91/, '')}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    f({ mobile: digits ? `+91${digits}` : '' });
                  }}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>
              {form.mobile && form.mobile.replace(/^\+91/, '').length > 0 && form.mobile.replace(/^\+91/, '').length < 10 && (
                <p className="text-xs text-red-500 mt-1">Must be 10 digits</p>
              )}
            </Field>
            <Field label="Gender">
              <Select
                value={form.gender || ''}
                onChange={v => f({ gender: v })}
                options={[{ value: '', label: 'Select' }, ...['Male', 'Female', 'Other'].map(g => ({ value: g, label: g }))]}
                placeholder="Select"
              />
            </Field>
            <Field label="Date of Birth">
              <DatePicker value={form.date_of_birth || ''} onChange={v => f({ date_of_birth: v })} placeholder="Select date of birth" />
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Salary & Tax">
          <FormGrid>
            <Field label="Basic Salary (₹/month)">
              <input type="number" className="form-input" value={form.basic_salary || ''} onChange={e => f({ basic_salary: e.target.value })} placeholder="e.g. 30000" min="0" />
            </Field>
            <Field label="HRA % (of Basic)">
              <input type="number" className="form-input" value={form.hra_percent ?? 40} onChange={e => f({ hra_percent: e.target.value })} placeholder="40" min="0" max="100" step="0.1" />
            </Field>
            <Field label="Special Allowance (₹)">
              <input type="number" className="form-input" value={form.special_allowance || 0} onChange={e => f({ special_allowance: e.target.value })} min="0" />
            </Field>
            <Field label="LTA (₹/month)">
              <input type="number" className="form-input" value={form.lta || 0} onChange={e => f({ lta: e.target.value })} min="0" />
            </Field>
            <Field label="Other Allowance (₹)">
              <input type="number" className="form-input" value={form.other_allowance || 0} onChange={e => f({ other_allowance: e.target.value })} min="0" />
            </Field>
            <Field label="PT State">
              <Select
                value={form.pt_state || 'Karnataka'}
                onChange={v => f({ pt_state: v })}
                options={PT_STATES}
              />
            </Field>
            <Field label="PF Applicable">
              <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                <div className={`relative w-10 h-5 rounded-full transition-colors ${form.pf_applicable !== false && form.pf_applicable !== 'false' ? 'bg-blue-600' : 'bg-gray-300'}`}
                  onClick={() => f({ pf_applicable: !(form.pf_applicable !== false && form.pf_applicable !== 'false') })}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.pf_applicable !== false && form.pf_applicable !== 'false' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">{form.pf_applicable !== false && form.pf_applicable !== 'false' ? 'Yes' : 'No'}</span>
              </label>
            </Field>
            <Field label="ESI Applicable">
              <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                <div className={`relative w-10 h-5 rounded-full transition-colors ${form.esi_applicable !== false && form.esi_applicable !== 'false' ? 'bg-blue-600' : 'bg-gray-300'}`}
                  onClick={() => f({ esi_applicable: !(form.esi_applicable !== false && form.esi_applicable !== 'false') })}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.esi_applicable !== false && form.esi_applicable !== 'false' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">{form.esi_applicable !== false && form.esi_applicable !== 'false' ? 'Yes (if gross ≤ ₹21,000)' : 'No'}</span>
              </label>
            </Field>
          </FormGrid>
          {liveCalc && (
            <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex flex-wrap gap-6 items-center text-sm">
              <div><span className="text-gray-500">Monthly Gross:</span><span className="ml-2 font-bold text-blue-800">₹{liveCalc.gross.toLocaleString()}</span></div>
              <div><span className="text-gray-500">Net Take-Home:</span><span className="ml-2 font-bold text-green-700">~₹{liveCalc.net.toLocaleString()}</span></div>
            </div>
          )}
        </FormSection>

        <FormSection title="Bank Details">
          <FormGrid>
            <Field label="Bank Name"><input className="form-input" value={form.bank_name || ''} onChange={e => f({ bank_name: e.target.value })} placeholder="e.g. HDFC Bank" /></Field>
            <Field label="Account Number"><input className="form-input" value={form.bank_account_no || ''} onChange={e => f({ bank_account_no: e.target.value })} placeholder="12-digit account number" /></Field>
            <Field label="IFSC Code"><input className="form-input uppercase" value={form.bank_ifsc || ''} onChange={e => f({ bank_ifsc: e.target.value.toUpperCase() })} placeholder="e.g. HDFC0001234" maxLength={11} /></Field>
            <Field label="Branch Name"><input className="form-input" value={form.bank_branch || ''} onChange={e => f({ bank_branch: e.target.value })} placeholder="e.g. Begumpet, Hyderabad" /></Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Identity Details">
          <FormGrid>
            <Field label="Aadhaar Number"><input className="form-input" value={form.aadhar_no || ''} onChange={e => f({ aadhar_no: e.target.value.replace(/\D/g, '').slice(0, 12) })} placeholder="12-digit Aadhaar" maxLength={12} /></Field>
            <Field label="PAN Number"><input className="form-input uppercase" value={form.pan_no || ''} onChange={e => f({ pan_no: e.target.value.toUpperCase().slice(0, 10) })} placeholder="e.g. ABCDE1234F" maxLength={10} /></Field>
            <Field label="Biometric / Device ID"><input className="form-input" value={form.biometric_id || ''} onChange={e => f({ biometric_id: e.target.value.trim() })} placeholder="Enrollment no. on the eSSL device (e.g. 3)" /></Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Emergency Contact">
          <FormGrid>
            <Field label="Contact Name"><input className="form-input" value={form.ec_name || ''} onChange={e => f({ ec_name: e.target.value })} placeholder="Full name" /></Field>
            <Field label="Relationship">
              <Select
                value={form.ec_relationship || ''}
                onChange={v => f({ ec_relationship: v })}
                options={[{ value: '', label: 'Select' }, ...['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'].map(r => ({ value: r, label: r }))]}
                placeholder="Select"
              />
            </Field>
            <Field label="Phone"><input className="form-input" value={form.ec_phone || ''} onChange={e => f({ ec_phone: e.target.value })} placeholder="Mobile number" /></Field>
          </FormGrid>
        </FormSection>

        {/* ── Joining Documents — visible in both add and edit ── */}
        <FormSection title="Joining Documents">
          <p className="text-xs text-gray-500 mb-4 -mt-1">
            Upload the documents the employee needs to sign. These will appear as downloadable files on their <strong>Start Journey</strong> page.
            {modal?.mode === 'add' && <span className="text-amber-600 ml-1">Save the employee first, then come back to upload documents.</span>}
          </p>
          {[
            { key: 'offer_letter',        label: 'Offer Letter',             icon: '📄' },
            { key: 'employment_agreement', label: 'Employment Agreement',     icon: '📝' },
            { key: 'nda',                  label: 'NDA / Confidentiality',    icon: '🔒' },
            { key: 'hr_policy',            label: 'HR Policy Handbook',       icon: '📚' },
            { key: 'code_of_conduct',      label: 'Code of Conduct',          icon: '🛡️' },
            { key: 'it_policy',            label: 'IT Security Policy',       icon: '💻' },
          ].map(({ key, label, icon }) => {
            const doc = joinDocs[key];
            const empId = modal?.id;
            const isUploading = docUploading === key;
            const fileRef = { current: null };
            return (
              <div key={key} className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                <span className="text-base flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</div>
                  {doc ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-green-600 font-medium">✓ Uploaded</span>
                      <a href={doc.file_url} target="_blank" rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:underline truncate max-w-[200px]">
                        {doc.file_name || 'View file'}
                      </a>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400 mt-0.5">No document uploaded</div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc && empId && (
                    <button type="button"
                      onClick={() => removeJoinDoc(empId, key)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors">
                      Remove
                    </button>
                  )}
                  {empId && (
                    <label className={`btn btn-secondary btn-xs gap-1 cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) { uploadJoinDoc(empId, key, f); e.target.value = ''; }}} />
                      {isUploading ? 'Uploading…' : doc ? 'Replace' : 'Upload'}
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </FormSection>

        {modal?.mode === 'edit' && (
          <FormSection title="Allocated Assets">
            {empAssets.length === 0 ? (
              <div className="flex items-center gap-2 py-3 px-1 text-sm text-gray-400">
                <Monitor size={16} className="text-gray-300" />No assets allocated yet
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 overflow-hidden mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-3 py-2 text-left">Asset</th><th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Serial</th><th className="px-3 py-2 text-left">Given On</th>
                      <th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {empAssets.map(a => (
                      <tr key={a.id} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium text-gray-800">{a.asset_name}</td>
                        <td className="px-3 py-2 text-gray-500">{a.asset_type}</td>
                        <td className="px-3 py-2 text-gray-400 font-mono text-xs">{a.serial_number || '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{a.allocated_date}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'Allocated' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{a.status}</span>
                        </td>
                        <td className="px-3 py-2">
                          {a.status === 'Allocated' && (
                            <button onClick={() => returnAsset(a.id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 transition-colors">
                              <Undo2 size={11} /> Return
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button type="button" onClick={() => setShowAssetForm(v => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors mb-3">
              {showAssetForm ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showAssetForm ? 'Cancel' : '+ Allocate New Asset'}
            </button>
            {showAssetForm && (
              <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 space-y-3">
                <FormGrid>
                  <Field label="Asset Name" required><input className="form-input" value={assetForm.asset_name} onChange={e => setAssetForm(p => ({ ...p, asset_name: e.target.value }))} placeholder="e.g. ThinkPad X1 Carbon" /></Field>
                  <Field label="Type" required>
                    <Select
                      value={assetForm.asset_type}
                      onChange={v => setAssetForm(p => ({ ...p, asset_type: v }))}
                      options={[{ value: '', label: 'Select type' }, ...ASSET_TYPES.map(t => ({ value: t, label: t }))]}
                      placeholder="Select type"
                    />
                  </Field>
                  <Field label="Serial Number"><input className="form-input" value={assetForm.serial_number} onChange={e => setAssetForm(p => ({ ...p, serial_number: e.target.value }))} placeholder="SN-XXXXX" /></Field>
                  <Field label="Condition">
                    <Select
                      value={assetForm.condition}
                      onChange={v => setAssetForm(p => ({ ...p, condition: v }))}
                      options={['New', 'Good', 'Fair', 'Poor']}
                    />
                  </Field>
                  <Field label="Given On"><DatePicker value={assetForm.allocated_date} onChange={v => setAssetForm(p => ({ ...p, allocated_date: v }))} placeholder="Select date" /></Field>
                  <Field label="Notes"><input className="form-input" value={assetForm.notes} onChange={e => setAssetForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any notes…" /></Field>
                </FormGrid>
                <button type="button" onClick={allocateAsset} className="btn btn-primary btn-sm gap-1.5"><Monitor size={12} /> Allocate Asset</button>
              </div>
            )}
          </FormSection>
        )}
      </Modal>
    </>
  );
}
