import { useState, useEffect, useRef } from 'react';
import { api, apiForm } from '../../api';
import {
  User, Mail, Phone, Calendar, Briefcase, Building2, CreditCard,
  Camera, Loader2, MapPin, Shield, AlertCircle, Monitor,
  GraduationCap, Clock, FileText, Pencil, Check, X,
} from 'lucide-react';
import ImageCropModal from '../../components/ImageCropModal';

function Section({ title, children }) {
  return (
    <div className="card">
      <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-5 py-1 divide-y divide-gray-50 dark:divide-gray-800/60">{children}</div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: 'var(--accent-50)' }}>
        <Icon size={13} style={{ color: 'var(--accent)' }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-gray-400 mb-0.5">{label}</div>
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words whitespace-pre-wrap">{value}</div>
      </div>
    </div>
  );
}

function EduCard({ item }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
        <GraduationCap size={14} className="text-blue-600 dark:text-blue-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.degree}</p>
        <p className="text-xs text-gray-500 mt-0.5">{item.institution}</p>
        <div className="flex flex-wrap gap-x-3 mt-1">
          {(item.start_year || item.end_year) && (
            <span className="text-xs text-gray-400">
              {item.start_year}{item.end_year && item.end_year !== item.start_year ? ` – ${item.end_year}` : ''}
            </span>
          )}
          {item.grade && <span className="text-xs text-gray-400">{item.grade}</span>}
        </div>
      </div>
    </div>
  );
}

function ExpCard({ item }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
        <Briefcase size={14} className="text-violet-600 dark:text-violet-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.role}</p>
        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">{item.company}</p>
        <div className="flex flex-wrap gap-x-3 mt-1">
          {(item.from_year || item.to_year) && (
            <span className="text-xs text-gray-400">
              {item.from_year}{item.to_year && item.to_year !== item.from_year ? ` – ${item.to_year}` : ''}
            </span>
          )}
        </div>
        {item.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'details',  label: 'Details',      icon: User },
  { key: 'edu-exp',  label: 'Education & Experience', icon: GraduationCap },
  { key: 'assets',   label: 'Assets',       icon: Monitor },
];

export default function EmpProfile({ toast, onPhotoUpdate }) {
  const [emp,       setEmp]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [cropFile,  setCropFile]  = useState(null);
  const [tab,       setTab]       = useState('details');

  // edit state
  const [editing,   setEditing]   = useState(false);
  const [editForm,  setEditForm]  = useState({});
  const [saving,    setSaving]    = useState(false);

  const fileRef = useRef(null);

  const load = () =>
    api('GET', '/api/portal/profile')
      .then(d => { setEmp(d); setEditForm({ email: d.email || '', mobile: d.mobile || '', residential_address: d.residential_address || '' }); })
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handlePhotoChange = e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return toast('File must be under 20 MB', 'warning');
    if (!file.type.startsWith('image/')) return toast('Please select an image file', 'warning');
    setCropFile(file);
  };

  const uploadCropped = async blob => {
    setCropFile(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', blob, 'profile.jpg');
      const { profile_photo } = await apiForm('/api/portal/profile/photo', fd);
      setEmp(prev => ({ ...prev, profile_photo }));
      onPhotoUpdate?.(profile_photo);
      toast('Profile photo updated', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const startEdit = () => {
    setEditForm({ email: emp.email || '', mobile: emp.mobile || '', residential_address: emp.residential_address || '' });
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api('PATCH', '/api/portal/profile', editForm);
      setEmp(prev => ({ ...prev, ...editForm }));
      setEditing(false);
      toast('Profile updated', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const ef = v => setEditForm(p => ({ ...p, ...v }));

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  if (!emp) return null;

  const initials = emp.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

        {/* Profile header */}
        <div className="card p-5 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {emp.profile_photo ? (
              <img src={emp.profile_photo} alt={emp.full_name}
                className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-gray-900" />
            ) : (
              <div className="w-24 h-24 rounded-full text-white flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-white dark:ring-gray-900"
                style={{ background: 'linear-gradient(135deg, var(--accent-dark), var(--accent))' }}>
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-900 shadow-md flex items-center justify-center hover:scale-110 transition-transform"
              style={{ color: 'var(--accent)' }}
              title="Change photo"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            {cropFile && (
              <ImageCropModal file={cropFile} onConfirm={uploadCropped} onCancel={() => setCropFile(null)} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{emp.full_name}</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {emp.designation}{emp.department ? ` · ${emp.department}` : ''}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                style={{ backgroundColor: 'var(--accent-50)', color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                {emp.employee_id}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${emp.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-600'}`}>
                {emp.status}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                {emp.employment_type}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card flex">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors flex-1 justify-center
                ${tab === t.key
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── DETAILS TAB ── */}
        {tab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Editable section — full width */}
            <div className="card md:col-span-2">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact & Address</h3>
                {!editing ? (
                  <button onClick={startEdit}
                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 transition-colors">
                    <Pencil size={12} /> Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button onClick={cancelEdit}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                      <X size={12} /> Cancel
                    </button>
                    <button onClick={saveEdit} disabled={saving}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg text-white transition-colors"
                      style={{ backgroundColor: 'var(--accent)' }}>
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
              <div className="px-5 py-1 divide-y divide-gray-50 dark:divide-gray-800/60">
                {editing ? (
                  <div className="py-4 space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email Address</label>
                      <input type="email" className="form-input w-full" value={editForm.email} onChange={e => ef({ email: e.target.value })} placeholder="your@email.com" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Mobile Number</label>
                      <input type="tel" className="form-input w-full" value={editForm.mobile} onChange={e => ef({ mobile: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Residential Address</label>
                      <textarea className="form-textarea w-full resize-none" rows={3} value={editForm.residential_address} onChange={e => ef({ residential_address: e.target.value })} placeholder="Your home address" />
                    </div>
                  </div>
                ) : (
                  <>
                    <Row icon={Mail}  label="Email Address"        value={emp.email} />
                    <Row icon={Phone} label="Mobile Number"        value={emp.mobile} />
                    <Row icon={MapPin} label="Residential Address" value={emp.residential_address} />
                  </>
                )}
              </div>
            </div>

            <Section title="Personal">
              <Row icon={User}     label="Full Name"     value={emp.full_name} />
              <Row icon={User}     label="Gender"        value={emp.gender} />
              <Row icon={Calendar} label="Date of Birth" value={emp.date_of_birth} />
            </Section>

            <Section title="Employment">
              <Row icon={Building2} label="Department"        value={emp.department} />
              <Row icon={Briefcase} label="Designation"       value={emp.designation} />
              <Row icon={Briefcase} label="Employment Type"   value={emp.employment_type} />
              <Row icon={Calendar}  label="Date of Joining"   value={emp.date_of_joining} />
              <Row icon={User}      label="Reporting Manager" value={emp.reporting_manager} />
              <Row icon={Clock}     label="Notice Period"     value={emp.notice_period_days ? `${emp.notice_period_days} days` : null} />
              <Row icon={Clock}     label="Probation Period"  value={emp.probation_period_days ? `${emp.probation_period_days} days` : null} />
              <Row icon={MapPin}    label="Office Address"    value={emp.office_address} />
            </Section>

            {emp.basic_salary && (
              <Section title="Payroll">
                <Row icon={CreditCard} label="Basic Salary"       value={`₹${Number(emp.basic_salary).toLocaleString('en-IN')} / month`} />
                <Row icon={CreditCard} label="HRA"                value={`${emp.hra_percent}% of Basic`} />
                {emp.special_allowance > 0 && (
                  <Row icon={CreditCard} label="Special Allowance" value={`₹${Number(emp.special_allowance).toLocaleString('en-IN')}`} />
                )}
                <Row icon={Shield} label="Provident Fund" value={emp.pf_applicable  ? 'Applicable' : 'Not applicable'} />
                <Row icon={Shield} label="ESI"            value={emp.esi_applicable ? 'Applicable (if gross ≤ ₹21,000)' : 'Not applicable'} />
                <Row icon={Shield} label="PT State"       value={emp.pt_state} />
              </Section>
            )}

            {(emp.bank_name || emp.bank_account_no) && (
              <Section title="Bank Details">
                <Row icon={CreditCard} label="Bank Name"    value={emp.bank_name} />
                <Row icon={CreditCard} label="Account No."  value={emp.bank_account_no} />
                <Row icon={CreditCard} label="IFSC Code"    value={emp.bank_ifsc} />
                <Row icon={CreditCard} label="Branch"       value={emp.bank_branch} />
              </Section>
            )}

            {(emp.aadhar_no || emp.pan_no) && (
              <Section title="Identity">
                <Row icon={FileText} label="Aadhaar No." value={emp.aadhar_no} />
                <Row icon={FileText} label="PAN No."     value={emp.pan_no} />
              </Section>
            )}

            {emp._ec?.name && (
              <Section title="Emergency Contact">
                <Row icon={AlertCircle} label="Name"         value={emp._ec.name} />
                <Row icon={AlertCircle} label="Relationship" value={emp._ec.relationship_type} />
                <Row icon={Phone}       label="Phone"        value={emp._ec.phone} />
                {emp._ec.email && <Row icon={Mail} label="Email" value={emp._ec.email} />}
              </Section>
            )}
          </div>
        )}

        {/* ── EDUCATION & EXPERIENCE TAB ── */}
        {tab === 'edu-exp' && (
          <>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap size={15} className="text-blue-500" />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Education</span>
              </div>
              {emp.education?.length > 0 ? (
                <div className="space-y-2">
                  {emp.education.map((item, i) => <EduCard key={i} item={item} />)}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No education records on file. Contact HR to update.</p>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={15} className="text-violet-500" />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Work Experience</span>
              </div>
              {emp.experience?.length > 0 ? (
                <div className="space-y-2">
                  {emp.experience.map((item, i) => <ExpCard key={i} item={item} />)}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No experience records on file. Contact HR to update.</p>
              )}
            </div>
          </>
        )}

        {/* ── ASSETS TAB ── */}
        {tab === 'assets' && (
          <div className="card">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Allocated Assets</span>
            </div>
            {emp._assets?.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {emp._assets.map(a => (
                  <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Monitor size={14} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{a.asset_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.asset_type}{a.serial_number ? ` · ${a.serial_number}` : ''}</p>
                      {a.allocated_date && (
                        <p className="text-xs text-gray-400 mt-0.5">Allocated: {a.allocated_date}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                        {a.status}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                        ${a.condition === 'Good' ? 'bg-green-50 text-green-700' : a.condition === 'Fair' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                        {a.condition}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-gray-400">
                <Monitor size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No assets allocated</p>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-2">For other changes, please contact HR.</p>
      </div>
    </div>
  );
}
