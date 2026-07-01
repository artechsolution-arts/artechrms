import { useState, useEffect, useCallback, useRef } from 'react';
import { api, apiForm } from '../api';
import { fmtDate } from '../utils/date';
import EmpAvatar from '../components/EmpAvatar';
import ConfirmModal from '../components/ConfirmModal';
import DatePicker from '../components/DatePicker';
import SelectDS from '../components/Select';
import {
  UserPlus, UserMinus, Search, RefreshCw, X, ChevronLeft, ChevronRight,
  CheckCircle2, Circle, Save, Clock, AlertCircle, Plus, Pencil, Trash2,
  History, CheckCheck, User, Calendar, Upload, FileText,
} from 'lucide-react';

const genId = () => Math.random().toString(36).slice(2, 10);

/* ── Row action buttons ── */
function RowActions({ onEdit, onDelete, editing, onSave, onCancel }) {
  if (editing) return (
    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
      <button onClick={onSave}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: '#1A6AB4', color: '#fff', fontSize: 12, fontWeight: 600 }}>
        <Save size={11} /> Save
      </button>
      <button onClick={onCancel}
        className="onb-row-cancel"
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #E5E7EB', cursor: 'pointer', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 600 }}>
        Cancel
      </button>
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
      <button onClick={onEdit} title="Edit"
        className="onb-row-edit"
        style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid #E5E7EB', cursor: 'pointer', background: '#F9FAFB', color: '#374151', display: 'flex', alignItems: 'center' }}>
        <Pencil size={13} />
      </button>
      <button onClick={onDelete} title="Delete"
        style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid #FEE2E2', cursor: 'pointer', background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center' }}>
        <Trash2 size={13} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ONBOARDING STEPS
══════════════════════════════════════════════ */
const ON_STEPS = [
  { key: 'personal_info',  label: 'Personal Info' },
  { key: 'employment',     label: 'Employment' },
  { key: 'documents',      label: 'Documents' },
  { key: 'education',      label: 'Education' },
  { key: 'experience',     label: 'Experience' },
  { key: 'assets',         label: 'Assets' },
  { key: 'it_access',      label: 'IT Access' },
  { key: 'training',       label: 'Training' },
  { key: 'checklist',      label: 'Checklist' },
  { key: 'activity_log',   label: 'Activity Log' },
];

/* ══════════════════════════════════════════════
   OFFBOARDING STEPS
══════════════════════════════════════════════ */
const OFF_STEPS = [
  { key: 'employee_info',      label: 'Employee Info' },
  { key: 'exit_details',       label: 'Exit Details' },
  { key: 'notice_period',      label: 'Notice Period' },
  { key: 'knowledge_transfer', label: 'Knowledge Transfer' },
  { key: 'assets_return',      label: 'Assets Return' },
  { key: 'access_revocation',  label: 'Access Revocation' },
  { key: 'exit_interview',     label: 'Exit Interview' },
  { key: 'final_settlement',   label: 'Final Settlement' },
  { key: 'documents',          label: 'Documents' },
  { key: 'activity_log',       label: 'Activity Log' },
];

/* ── helpers ── */
const Input = ({ label, value, onChange, type = 'text', required, placeholder, disabled, hint }) => (
  <div>
    <label className="onb-form-label" style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 5, letterSpacing: '0.01em' }}>
      {label}{required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
    </label>
    {hint && <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{hint}</div>}
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || ''}
      disabled={disabled}
      className="form-input"
      style={{ fontSize: 13, ...(disabled ? { background: '#F9FAFB', color: '#6B7280' } : {}) }}
    />
  </div>
);

const PhoneInput = ({ label, value, onChange, required, disabled }) => (
  <div>
    <label className="onb-form-label" style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 5, letterSpacing: '0.01em' }}>
      {label}{required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
    </label>
    <div className="flex">
      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 select-none">+91</span>
      <input inputMode="numeric" maxLength={10} value={(value || '').replace(/^\+91/, '')}
        onChange={e => { const d = e.target.value.replace(/\D/g, '').slice(0, 10); onChange(d ? `+91${d}` : ''); }}
        placeholder="10-digit mobile number" disabled={disabled}
        className="form-input rounded-l-none flex-1" style={{ fontSize: 13 }} />
    </div>
  </div>
);
const Select = ({ label, value, onChange, options, required, disabled }) => (
  <div>
    <label className="onb-form-label" style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 5 }}>
      {label}{required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
    </label>
    <SelectDS value={value || ''} onChange={onChange} options={options} disabled={disabled} placeholder="— Select —" />
  </div>
);

const Textarea = ({ label, value, onChange, rows = 3, placeholder }) => (
  <div>
    <label className="onb-form-label" style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 5 }}>{label}</label>
    <textarea value={value || ''} onChange={e => onChange(e.target.value)}
      rows={rows} placeholder={placeholder || ''} className="form-textarea" style={{ fontSize: 13 }} />
  </div>
);

const DateField = ({ label, value, onChange, required, hint, disabled, className }) => (
  <div>
    <label className="onb-form-label" style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 5, letterSpacing: '0.01em' }}>
      {label}{required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
    </label>
    {hint && <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{hint}</div>}
    <DatePicker value={value || ''} onChange={v => onChange(v)} className={className} disabled={disabled} />
  </div>
);

const Toggle = ({ label, value, onChange, description }) => (
  <div className="onb-toggle-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
    <div>
      <div className="onb-toggle-label" style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{label}</div>
      {description && <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{description}</div>}
    </div>
    <button type="button" onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: value ? '#1A6AB4' : '#D1D5DB', position: 'relative', transition: 'background 0.2s',
      }}>
      <span style={{
        position: 'absolute', top: 2, left: value ? 20 : 2, width: 18, height: 18,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div className="onb-section-header" style={{ marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #F3F4F6' }}>
    <h3 className="onb-section-title" style={{ fontSize: 16, fontWeight: 700, color: '#0D1F4E', margin: 0 }}>{title}</h3>
    {subtitle && <p style={{ fontSize: 12.5, color: '#6B7280', marginTop: 4, margin: '4px 0 0' }}>{subtitle}</p>}
  </div>
);

const Grid2 = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>
);

const FieldGroup = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{title}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
  </div>
);

/* ══════════════════════════════════════════════
   STEP FORMS
══════════════════════════════════════════════ */
function OnPersonalInfo({ data, set, emp }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Personal Information" subtitle="Basic personal details of the employee" />
      <Grid2>
        <Input label="Full Name" value={data.full_name || emp?.full_name} onChange={v => set('full_name', v)} required disabled />
        <Input label="Personal Email" value={data.personal_email} onChange={v => set('personal_email', v)} type="email" placeholder="personal@example.com" />
      </Grid2>
      <Grid2>
        <DateField label="Date of Birth" value={data.dob} onChange={v => set('dob', v)} />
        <Select label="Gender" value={data.gender} onChange={v => set('gender', v)} options={['Male', 'Female', 'Other', 'Prefer not to say']} />
      </Grid2>
      <Grid2>
        <PhoneInput label="Mobile Number" value={data.mobile} onChange={v => set('mobile', v)} />
        <PhoneInput label="Alternate Mobile" value={data.alt_mobile} onChange={v => set('alt_mobile', v)} />
      </Grid2>
      <Grid2>
        <Select label="Blood Group" value={data.blood_group} onChange={v => set('blood_group', v)} options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} />
        <Select label="Marital Status" value={data.marital_status} onChange={v => set('marital_status', v)} options={['Single', 'Married', 'Divorced', 'Widowed']} />
      </Grid2>
      <Textarea label="Present Address" value={data.present_address} onChange={v => set('present_address', v)} placeholder="Door No, Street, City, State, PIN" />
      <Textarea label="Permanent Address" value={data.permanent_address} onChange={v => set('permanent_address', v)} placeholder="Door No, Street, City, State, PIN" />
      <FieldGroup title="Emergency Contact">
        <Grid2>
          <Input label="Contact Name" value={data.emergency_name} onChange={v => set('emergency_name', v)} placeholder="Full name" />
          <Input label="Relationship" value={data.emergency_relation} onChange={v => set('emergency_relation', v)} placeholder="e.g. Spouse, Parent" />
        </Grid2>
        <PhoneInput label="Contact Phone" value={data.emergency_phone} onChange={v => set('emergency_phone', v)} />
      </FieldGroup>
    </div>
  );
}

function OnEmployment({ data, set, emp }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Employment Details" subtitle="Job and organisation details" />
      <Grid2>
        <Input label="Employee ID" value={data.employee_id || emp?.employee_id} onChange={v => set('employee_id', v)} disabled />
        <DateField label="Date of Joining" value={data.date_of_joining || emp?.date_of_joining} onChange={v => set('date_of_joining', v)} disabled />
      </Grid2>
      <Grid2>
        <Input label="Department" value={data.department || emp?.department} onChange={v => set('department', v)} disabled />
        <Input label="Designation" value={data.designation || emp?.designation} onChange={v => set('designation', v)} disabled />
      </Grid2>
      <Grid2>
        <Select label="Employment Type" value={data.employment_type} onChange={v => set('employment_type', v)}
          options={['Full-time', 'Part-time', 'Contract', 'Intern', 'Consultant']} />
        <Input label="Work Location" value={data.work_location} onChange={v => set('work_location', v)} placeholder="e.g. Hyderabad HQ" />
      </Grid2>
      <Grid2>
        <Input label="Official Email" value={data.official_email} onChange={v => set('official_email', v)} placeholder="name@artechsolution.co.in" />
        <Input label="Reporting Manager" value={data.reporting_manager} onChange={v => set('reporting_manager', v)} placeholder="Manager name" />
      </Grid2>
      <Grid2>
        <Input label="Notice Period (days)" value={data.notice_period} onChange={v => set('notice_period', v)} type="number" placeholder="30" />
        <Input label="Probation Period (days)" value={data.probation_period} onChange={v => set('probation_period', v)} type="number" placeholder="90" />
      </Grid2>
      <Grid2>
        <Select label="Shift Timing" value={data.shift} onChange={v => set('shift', v)}
          options={['General (9 AM - 6 PM)', 'Morning (7 AM - 4 PM)', 'Evening (2 PM - 11 PM)', 'Night (10 PM - 7 AM)', 'Flexible']} />
        <DateField label="Confirmation Date" value={data.confirmation_date} onChange={v => set('confirmation_date', v)} hint="After probation" />
      </Grid2>
    </div>
  );
}

function OnDocuments({ data, set, empId }) {
  const [hrDocs, setHrDocs]       = useState({});
  const [uploadingKey, setUploadingKey] = useState(null);
  const fileInputRef  = useRef(null);
  const pendingDocKey = useRef(null);

  useEffect(() => {
    if (!empId) return;
    api('GET', `/api/onboarding/${empId}/hr-docs`).then(r => setHrDocs(r.docs || {})).catch(() => {});
  }, [empId]);

  const openUpload = (docKey) => {
    pendingDocKey.current = docKey;
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const docKey = pendingDocKey.current;
    if (!file || !docKey) return;
    setUploadingKey(docKey);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiForm(`/api/onboarding/${empId}/hr-docs/upload/${docKey}`, fd);
      setHrDocs(prev => ({ ...prev, [docKey]: { file_url: res.file_url, file_name: res.file_name } }));
    } catch { }
    finally { setUploadingKey(null); }
  };

  const deleteDoc = async (docKey) => {
    await api('DELETE', `/api/onboarding/${empId}/hr-docs/${docKey}`).catch(() => {});
    setHrDocs(prev => { const n = { ...prev }; delete n[docKey]; return n; });
  };

  const StatusBadge = ({ val, onChange }) => (
    <div style={{ width: 130 }}>
      <SelectDS value={val || 'Pending'} onChange={onChange} options={['Pending', 'Submitted', 'Verified']} size="sm" />
    </div>
  );

  const DocRow = ({ label, fieldKey, placeholder }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
      <Input label={label} value={data[fieldKey]} onChange={v => set(fieldKey, v)} placeholder={placeholder} />
      <DateField label="Expiry Date (if any)" value={data[fieldKey + '_expiry']} onChange={v => set(fieldKey + '_expiry', v)} />
      <div style={{ paddingBottom: 2 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Status</div>
        <StatusBadge val={data[fieldKey + '_status']} onChange={v => set(fieldKey + '_status', v)} />
      </div>
    </div>
  );

  /* Row for docs that have a backend upload slot */
  const uploadDocRow = (label, statusKey, docKey) => {
    const uploaded = hrDocs[docKey];
    const isUploading = uploadingKey === docKey;
    return (
      <div key={docKey} style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 12px', border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}</div>
            {uploaded && (
              <a href={uploaded.file_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#1A6AB4', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3, textDecoration: 'none' }}>
                <FileText size={11} /> {uploaded.file_name || 'View document'}
              </a>
            )}
          </div>
          <StatusBadge val={data[statusKey]} onChange={v => set(statusKey, v)} />
          <div>
            {!uploaded ? (
              <button onClick={() => openUpload(docKey)} disabled={isUploading || !empId}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #E5E7EB', cursor: empId ? 'pointer' : 'not-allowed', background: '#fff', fontSize: 11, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', opacity: !empId ? 0.4 : 1 }}>
                <Upload size={11} /> {isUploading ? 'Uploading…' : 'Upload'}
              </button>
            ) : (
              <button onClick={() => deleteDoc(docKey)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #FEE2E2', cursor: 'pointer', background: '#FEF2F2', fontSize: 11, fontWeight: 600, color: '#EF4444', whiteSpace: 'nowrap' }}>
                <Trash2 size={11} /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* Status-only row (no backend upload slot) */
  const statusOnlyRow = (label, statusKey) => (
    <div key={statusKey} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', padding: '6px 0' }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}</span>
      <StatusBadge val={data[statusKey]} onChange={v => set(statusKey, v)} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* hidden file input shared by all upload rows */}
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileChange} />

      <SectionHeader title="Identity Documents" subtitle="Collect and verify all required government IDs and certificates" />
      <FieldGroup title="Government IDs">
        <DocRow label="Aadhaar Number" fieldKey="aadhaar" placeholder="XXXX XXXX XXXX" />
        <DocRow label="PAN Number" fieldKey="pan" placeholder="ABCDE1234F" />
        <DocRow label="Passport Number" fieldKey="passport" placeholder="A1234567" />
        <DocRow label="Driving License" fieldKey="driving_license" placeholder="DL number" />
        <DocRow label="Voter ID" fieldKey="voter_id" placeholder="Voter ID number" />
      </FieldGroup>

      <FieldGroup title="Joining Documents (Upload)">
        {uploadDocRow('Offer Letter Signed', 'offer_letter_status', 'offer_letter')}
        {uploadDocRow('Employment Agreement', 'employment_agreement_status', 'employment_agreement')}
        {uploadDocRow('NDA / Confidentiality Agreement', 'nda_status', 'nda')}
        {statusOnlyRow('Educational Certificates', 'education_docs_status')}
        {statusOnlyRow('Previous Employment / Relieving Letter', 'relieving_letter_status')}
        {statusOnlyRow('BGV (Background Verification)', 'bgv_status')}
      </FieldGroup>

      <FieldGroup title="Company Policy Documents (Upload)">
        {uploadDocRow('HR Policy Acknowledgement', 'hr_policy_status', 'hr_policy')}
        {uploadDocRow('Code of Conduct', 'code_of_conduct_status', 'code_of_conduct')}
        {uploadDocRow('IT Policy', 'it_policy_status', 'it_policy')}
      </FieldGroup>

      <FieldGroup title="Statutory">
        <Grid2>
          <Input label="PF Account Number" value={data.pf_number} onChange={v => set('pf_number', v)} placeholder="PF number" />
          <Input label="ESI Number" value={data.esi_number} onChange={v => set('esi_number', v)} placeholder="ESI number" />
        </Grid2>
        <Textarea label="Notes" value={data.doc_notes} onChange={v => set('doc_notes', v)} rows={2} placeholder="Any notes on document collection…" />
      </FieldGroup>
    </div>
  );
}

/* ── Reusable row-list hook ── */
function useRowList(data, set, key = 'entries') {
  const rows = (data[key] || []).map(r => r.id ? r : { ...r, id: genId() });
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft]         = useState({});
  const [confirmDialog, setConfirmDialog] = useState(null);

  const startAdd = () => {
    const newRow = { id: genId() };
    set(key, [...rows, newRow]);
    setEditingId(newRow.id);
    setDraft(newRow);
  };
  const startEdit = (row) => { setEditingId(row.id); setDraft({ ...row }); };
  const cancelEdit = () => { setEditingId(null); setDraft({}); };
  const saveEdit = () => {
    set(key, rows.map(r => r.id === editingId ? { ...draft, id: editingId } : r));
    setEditingId(null);
    setDraft({});
  };
  const deleteRow = (id) => {
    setConfirmDialog({
      title: 'Delete Entry',
      message: 'Delete this entry?',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        set(key, rows.filter(r => r.id !== id));
      }
    });
    return;
  };
  return { rows, editingId, draft, setDraft, startAdd, startEdit, cancelEdit, saveEdit, deleteRow, confirmDialog, setConfirmDialog };
}

function OnEducation({ data, set }) {
  const { rows, editingId, draft, setDraft, startAdd, startEdit, cancelEdit, saveEdit, deleteRow, confirmDialog, setConfirmDialog } =
    useRowList(data, set, 'entries');

  const D = (f, p, t = 'text') => (
    <Input label={f} value={draft[p] || ''} onChange={v => setDraft(prev => ({ ...prev, [p]: v }))} placeholder={t === 'text' ? p : undefined} type={t} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader title="Education" subtitle="Academic qualifications and certifications" />
        <button onClick={startAdd} className="btn btn-primary btn-xs gap-1" style={{ flexShrink: 0, marginBottom: 12 }}>
          <Plus size={12} /> Add Row
        </button>
      </div>
      {rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>No education records yet. Click + Add Row.</div>
      )}
      {rows.map((row, i) => (
        <div key={row.id} style={{ background: '#F9FAFB', borderRadius: 10, border: `1.5px solid ${editingId === row.id ? '#1A6AB4' : '#E5E7EB'}`, overflow: 'hidden' }}>
          {/* Row header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: editingId === row.id ? '#EFF6FF' : '#F9FAFB', borderBottom: editingId === row.id ? '1px solid #BFDBFE' : 'none' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: editingId === row.id ? '#1E40AF' : '#6B7280' }}>
              {editingId === row.id ? '✏ Editing Education ' : 'Education '}{i + 1}
              {row.qualification && editingId !== row.id && <span style={{ fontWeight: 400, color: '#374151' }}> — {row.qualification}{row.institution ? `, ${row.institution}` : ''}</span>}
            </span>
            <RowActions onEdit={() => startEdit(row)} onDelete={() => deleteRow(row.id)}
              editing={editingId === row.id} onSave={saveEdit} onCancel={cancelEdit} />
          </div>
          {/* View mode */}
          {editingId !== row.id && row.qualification && (
            <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, fontSize: 12 }}>
              {[['Qualification', row.qualification], ['Field', row.field], ['Institution', row.institution], ['Years', `${row.start_year || '?'} – ${row.end_year || '?'}`], ['Grade', row.grade]].filter(([,v]) => v).map(([k,v]) => (
                <div key={k}><div style={{ color: '#9CA3AF', fontSize: 10.5 }}>{k}</div><div style={{ color: '#111827', fontWeight: 500, marginTop: 1 }}>{v}</div></div>
              ))}
            </div>
          )}
          {/* Edit mode */}
          {editingId === row.id && (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Grid2>
                <Select label="Qualification" value={draft.qualification || ''} onChange={v => setDraft(p => ({ ...p, qualification: v }))}
                  options={['10th / SSLC', '12th / HSC', 'Diploma', "Bachelor's Degree", "Master's Degree", 'MBA', 'PhD', 'Certification', 'Other']} />
                <Input label="Field of Study" value={draft.field || ''} onChange={v => setDraft(p => ({ ...p, field: v }))} placeholder="e.g. Computer Science" />
              </Grid2>
              <Input label="Institution / University" value={draft.institution || ''} onChange={v => setDraft(p => ({ ...p, institution: v }))} placeholder="Institute name" />
              <Grid2>
                <Grid2>
                  <Input label="Start Year" value={draft.start_year || ''} onChange={v => setDraft(p => ({ ...p, start_year: v }))} placeholder="2018" />
                  <Input label="End Year" value={draft.end_year || ''} onChange={v => setDraft(p => ({ ...p, end_year: v }))} placeholder="2022" />
                </Grid2>
                <Input label="Grade / CGPA / %" value={draft.grade || ''} onChange={v => setDraft(p => ({ ...p, grade: v }))} placeholder="e.g. 8.5 CGPA" />
              </Grid2>
            </div>
          )}
        </div>
      ))}
      <ConfirmModal
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        danger={confirmDialog?.danger}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}

function OnExperience({ data, set }) {
  const { rows, editingId, draft, setDraft, startAdd, startEdit, cancelEdit, saveEdit, deleteRow, confirmDialog, setConfirmDialog } =
    useRowList(data, set, 'entries');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader title="Work Experience" subtitle="Previous employment history" />
        <button onClick={startAdd} className="btn btn-primary btn-xs gap-1" style={{ flexShrink: 0, marginBottom: 12 }}>
          <Plus size={12} /> Add Row
        </button>
      </div>
      <Grid2>
        <Input label="Total Experience" value={data.total_exp || ''} onChange={v => set('total_exp', v)} placeholder="e.g. 3 years 6 months" />
        <Input label="Relevant Experience" value={data.relevant_exp || ''} onChange={v => set('relevant_exp', v)} placeholder="e.g. 2 years" />
      </Grid2>
      {rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>No experience records yet. Click + Add Row.</div>
      )}
      {rows.map((row, i) => (
        <div key={row.id} style={{ background: '#F9FAFB', borderRadius: 10, border: `1.5px solid ${editingId === row.id ? '#1A6AB4' : '#E5E7EB'}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: editingId === row.id ? '#EFF6FF' : '#F9FAFB', borderBottom: editingId === row.id ? '1px solid #BFDBFE' : 'none' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: editingId === row.id ? '#1E40AF' : '#6B7280' }}>
              {editingId === row.id ? '✏ Editing ' : ''}Experience {i + 1}
              {row.company && editingId !== row.id && <span style={{ fontWeight: 400, color: '#374151' }}> — {row.role} @ {row.company}</span>}
            </span>
            <RowActions onEdit={() => startEdit(row)} onDelete={() => deleteRow(row.id)}
              editing={editingId === row.id} onSave={saveEdit} onCancel={cancelEdit} />
          </div>
          {editingId !== row.id && row.company && (
            <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, fontSize: 12 }}>
              {[['Company', row.company], ['Role', row.role], ['Period', `${row.from_date || '?'} to ${row.to_date || 'Present'}`], ['Last CTC', row.last_ctc]].filter(([,v]) => v).map(([k,v]) => (
                <div key={k}><div style={{ color: '#9CA3AF', fontSize: 10.5 }}>{k}</div><div style={{ color: '#111827', fontWeight: 500, marginTop: 1 }}>{v}</div></div>
              ))}
            </div>
          )}
          {editingId === row.id && (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Grid2>
                <Input label="Company Name" value={draft.company || ''} onChange={v => setDraft(p => ({ ...p, company: v }))} placeholder="Company name" />
                <Input label="Job Title / Role" value={draft.role || ''} onChange={v => setDraft(p => ({ ...p, role: v }))} placeholder="e.g. Software Engineer" />
              </Grid2>
              <Grid2>
                <DateField label="From" value={draft.from_date || ''} onChange={v => setDraft(p => ({ ...p, from_date: v }))} />
                <DateField label="To" value={draft.to_date || ''} onChange={v => setDraft(p => ({ ...p, to_date: v }))} />
              </Grid2>
              <Input label="Last Drawn CTC" value={draft.last_ctc || ''} onChange={v => setDraft(p => ({ ...p, last_ctc: v }))} placeholder="e.g. ₹5,00,000 p.a." />
              <Textarea label="Key Responsibilities" value={draft.responsibilities || ''} onChange={v => setDraft(p => ({ ...p, responsibilities: v }))} rows={2} />
            </div>
          )}
        </div>
      ))}
      <ConfirmModal
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        danger={confirmDialog?.danger}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}

function OnAssets({ data, set }) {
  const ASSET_TYPES = ['Laptop / Desktop', 'Mobile Phone', 'SIM Card', 'ID Card', 'Access Card', 'Headset / Peripherals', 'Locker / Workstation', 'Other'];
  const { rows, editingId, draft, setDraft, startAdd, startEdit, cancelEdit, saveEdit, deleteRow, confirmDialog, setConfirmDialog } =
    useRowList(data, set, 'assets');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader title="Asset Assignment" subtitle="Company assets issued to the employee" />
        <button onClick={startAdd} className="btn btn-primary btn-xs gap-1" style={{ flexShrink: 0, marginBottom: 12 }}>
          <Plus size={12} /> Add Row
        </button>
      </div>
      {rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>No assets assigned yet. Click + Add Row.</div>
      )}
      {rows.map((row, i) => (
        <div key={row.id} style={{ background: '#F9FAFB', borderRadius: 10, border: `1.5px solid ${editingId === row.id ? '#1A6AB4' : '#E5E7EB'}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: editingId === row.id ? '#EFF6FF' : '#F9FAFB', borderBottom: editingId === row.id ? '1px solid #BFDBFE' : 'none' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: editingId === row.id ? '#1E40AF' : '#6B7280' }}>
              {editingId === row.id ? '✏ Editing ' : ''}Asset {i + 1}
              {row.type && editingId !== row.id && <span style={{ fontWeight: 400, color: '#374151' }}> — {row.type}{row.serial ? ` (${row.serial})` : ''}</span>}
            </span>
            <RowActions onEdit={() => startEdit(row)} onDelete={() => deleteRow(row.id)}
              editing={editingId === row.id} onSave={saveEdit} onCancel={cancelEdit} />
          </div>
          {editingId !== row.id && row.type && (
            <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, fontSize: 12 }}>
              {[['Type', row.type], ['Serial No.', row.serial], ['Issue Date', row.issue_date], ['Condition', row.condition]].filter(([,v]) => v).map(([k,v]) => (
                <div key={k}><div style={{ color: '#9CA3AF', fontSize: 10.5 }}>{k}</div><div style={{ color: '#111827', fontWeight: 500, marginTop: 1 }}>{v}</div></div>
              ))}
            </div>
          )}
          {editingId === row.id && (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Grid2>
                <Select label="Asset Type" value={draft.type || ''} onChange={v => setDraft(p => ({ ...p, type: v }))} options={ASSET_TYPES} />
                <Input label="Asset ID / Serial No." value={draft.serial || ''} onChange={v => setDraft(p => ({ ...p, serial: v }))} placeholder="Serial number" />
              </Grid2>
              <Grid2>
                <DateField label="Issue Date" value={draft.issue_date || ''} onChange={v => setDraft(p => ({ ...p, issue_date: v }))} />
                <Select label="Condition" value={draft.condition || ''} onChange={v => setDraft(p => ({ ...p, condition: v }))} options={['New', 'Good', 'Fair', 'Poor']} />
              </Grid2>
              <Input label="Notes" value={draft.notes || ''} onChange={v => setDraft(p => ({ ...p, notes: v }))} placeholder="Any notes about this asset" />
            </div>
          )}
        </div>
      ))}
      <Textarea label="Additional Remarks" value={data.remarks || ''} onChange={v => set('remarks', v)} rows={2} placeholder="General asset notes…" />
      <ConfirmModal
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        danger={confirmDialog?.danger}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}

function OnITAccess({ data, set }) {
  const items = [
    { key: 'email', label: 'Official Email ID', desc: 'Corporate email account created' },
    { key: 'system', label: 'System / Network Access', desc: 'Windows/Linux login & domain access' },
    { key: 'vpn', label: 'VPN Access', desc: 'Remote access VPN credentials' },
    { key: 'slack', label: 'Communication Tools', desc: 'Slack / Teams / Google Chat' },
    { key: 'jira', label: 'Project Tools', desc: 'Jira / Trello / Asana access' },
    { key: 'github', label: 'Code Repository', desc: 'GitHub / GitLab / Bitbucket' },
    { key: 'cloud', label: 'Cloud Access', desc: 'AWS / GCP / Azure console access' },
    { key: 'erp', label: 'ERP / HRMS Access', desc: 'AR Peopliz portal login' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="IT Access & Credentials" subtitle="System and software access provisioned for the employee" />
      {items.map(({ key, label, desc }) => (
        <div key={key}>
          <Toggle label={label} value={data[key]} onChange={v => set(key, v)} description={desc} />
          {data[key] && (
            <div style={{ padding: '8px 0 4px', paddingLeft: 12 }}>
              <Input label="Account / Username" value={data[key + '_user']} onChange={v => set(key + '_user', v)} placeholder="Username or email" />
            </div>
          )}
        </div>
      ))}
      <Textarea label="Additional Access Notes" value={data.notes} onChange={v => set('notes', v)} rows={2} />
    </div>
  );
}

function OnTraining({ data, set }) {
  const items = [
    { key: 'induction', label: 'Induction / Orientation', desc: 'Company overview, culture, policies' },
    { key: 'hr_policy', label: 'HR Policy Training', desc: 'Leave policy, code of conduct, POSH' },
    { key: 'it_security', label: 'IT Security Training', desc: 'Data security, password policy, phishing' },
    { key: 'compliance', label: 'Compliance Training', desc: 'Statutory & regulatory compliance' },
    { key: 'technical', label: 'Technical / Role Training', desc: 'Job-specific tools and processes' },
    { key: 'safety', label: 'Health & Safety Training', desc: 'Workplace safety guidelines' },
    { key: 'buddy', label: 'Buddy / Mentor Assigned', desc: 'Peer mentor assigned for first 90 days' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Training & Induction" subtitle="Track completion of all mandatory onboarding training" />
      {items.map(({ key, label, desc }) => (
        <div key={key} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: data[key] ? 8 : 0 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{label}</div>
              <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{desc}</div>
            </div>
            <Toggle label="" value={data[key]} onChange={v => set(key, v)} />
          </div>
          {data[key] && (
            <Grid2>
              <DateField label="Completed Date" value={data[key + '_date']} onChange={v => set(key + '_date', v)} />
              <Input label="Conducted By" value={data[key + '_by']} onChange={v => set(key + '_by', v)} placeholder="Trainer / HR name" />
            </Grid2>
          )}
        </div>
      ))}
      <Textarea label="Additional Remarks" value={data.remarks} onChange={v => set('remarks', v)} rows={2} />
    </div>
  );
}

function OnChecklist({ data, set }) {
  const groups = [
    { title: 'Pre-Joining', items: ['Offer Letter Signed', 'Employment Agreement Signed', 'NDA Signed', 'BGV Initiated', 'Medical Certificate Received'] },
    { title: 'Documents', items: ['Aadhaar Submitted', 'PAN Submitted', 'Passport Copy Submitted', 'Educational Certs Submitted', 'Previous Employment Letter'] },
    { title: 'Bank & Statutory', items: ['Bank Details Submitted', 'PF Form 2 Submitted', 'ESI Form Submitted', 'Gratuity Nomination Submitted', 'Emergency Contact Provided'] },
    { title: 'Company Setup', items: ['Employee ID Issued', 'Email ID Created', 'System Access Granted', 'Laptop Assigned', 'ID Card Issued', 'HR Policy Acknowledged', 'Code of Conduct Signed', 'Induction Completed'] },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Onboarding Checklist" subtitle="MNC compliance checklist — mark each item as completed" />
      {groups.map(({ title, items }) => (
        <div key={title}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{title}</div>
          <div style={{ background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            {items.map((item, i) => (
              <div key={item} onClick={() => set(item, !data[item])}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer',
                  borderBottom: i < items.length - 1 ? '1px solid #F3F4F6' : 'none',
                  background: data[item] ? 'rgba(26,106,180,0.04)' : '#F9FAFB',
                  transition: 'background 0.1s',
                }}>
                {data[item]
                  ? <CheckCircle2 size={16} color="#1A6AB4" />
                  : <Circle size={16} color="#D1D5DB" />
                }
                <span style={{ fontSize: 13, color: data[item] ? '#1A6AB4' : '#374151', fontWeight: data[item] ? 500 : 400, textDecoration: data[item] ? 'line-through' : 'none' }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══ OFFBOARDING STEP FORMS ══ */

function OffEmployeeInfo({ emp }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Employee Information" subtitle="Details of the departing employee" />
      <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          <EmpAvatar name={emp?.full_name} photo={emp?.profile_photo} size="lg" colorIndex={emp?.id} rounded="rounded-full" />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0D1F4E' }}>{emp?.full_name}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{emp?.designation} · {emp?.department}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Joined: {fmtDate(emp?.date_of_joining)} · Employee ID: {emp?.employee_id}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['Employment Type', emp?.employment_type || '—'], ['Status', emp?.status || '—']].map(([k, v]) => (
            <div key={k} style={{ background: '#fff', borderRadius: 8, padding: 12, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0D1F4E' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OffExitDetails({ data, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Exit Details" subtitle="Capture exit reason and resignation details" />
      <Grid2>
        <DateField label="Resignation Date" value={data.resignation_date} onChange={v => set('resignation_date', v)} required />
        <DateField label="Last Working Day" value={data.last_working_day} onChange={v => set('last_working_day', v)} required />
      </Grid2>
      <Select label="Reason for Leaving" value={data.exit_reason} onChange={v => set('exit_reason', v)} required
        options={['Better Opportunity', 'Higher Studies', 'Personal Reasons', 'Relocation', 'Health Issues', 'Company Culture', 'Compensation', 'Career Growth', 'Retirement', 'Involuntary Termination', 'Contract End', 'Other']} />
      <Select label="Resignation Type" value={data.resignation_type} onChange={v => set('resignation_type', v)}
        options={['Voluntary', 'Involuntary / Termination', 'Mutual Separation', 'Retirement', 'Contract Completion']} />
      <Textarea label="Detailed Reason / Comments" value={data.detailed_reason} onChange={v => set('detailed_reason', v)} rows={3} placeholder="Additional context…" />
      <Grid2>
        <Select label="Eligible for Rehire" value={data.rehire_eligible} onChange={v => set('rehire_eligible', v)}
          options={['Yes', 'No', 'Conditional']} />
        <Input label="Resignation Accepted By" value={data.accepted_by} onChange={v => set('accepted_by', v)} placeholder="HR / Manager name" />
      </Grid2>
    </div>
  );
}

function OffNoticePeriod({ data, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Notice Period" subtitle="Track notice period compliance and buyout details" />
      <Grid2>
        <Input label="Required Notice (days)" value={data.required_days} onChange={v => set('required_days', v)} type="number" placeholder="30" />
        <Input label="Served Notice (days)" value={data.served_days} onChange={v => set('served_days', v)} type="number" placeholder="30" />
      </Grid2>
      <Grid2>
        <DateField label="Notice Start Date" value={data.start_date} onChange={v => set('start_date', v)} />
        <DateField label="Notice End Date" value={data.end_date} onChange={v => set('end_date', v)} />
      </Grid2>
      <Toggle label="Notice Period Waived" value={data.waived} onChange={v => set('waived', v)} description="HR approved early release" />
      {data.waived && (
        <Grid2>
          <Input label="Buyout Amount (₹)" value={data.buyout_amount} onChange={v => set('buyout_amount', v)} type="number" placeholder="0" />
          <Input label="Waiver Approved By" value={data.waiver_by} onChange={v => set('waiver_by', v)} placeholder="HR / Manager" />
        </Grid2>
      )}
      <Textarea label="Notes" value={data.notes} onChange={v => set('notes', v)} rows={2} />
    </div>
  );
}

function OffKT({ data, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Knowledge Transfer" subtitle="Ensure smooth handover of responsibilities" />
      <Grid2>
        <Input label="Successor Name" value={data.successor} onChange={v => set('successor', v)} placeholder="Who takes over" />
        <DateField label="KT Start Date" value={data.kt_start} onChange={v => set('kt_start', v)} />
      </Grid2>
      <DateField label="KT End Date" value={data.kt_end} onChange={v => set('kt_end', v)} />
      {[
        { key: 'kt_plan', label: 'KT Plan Document Prepared' },
        { key: 'kt_completed', label: 'Knowledge Transfer Completed' },
        { key: 'tasks_handover', label: 'Pending Tasks Handed Over' },
        { key: 'docs_updated', label: 'Project Documentation Updated' },
        { key: 'creds_shared', label: 'Credentials / Access Shared with Successor' },
      ].map(({ key, label }) => (
        <Toggle key={key} label={label} value={data[key]} onChange={v => set(key, v)} />
      ))}
      <Textarea label="KT Notes / Pending Items" value={data.notes} onChange={v => set('notes', v)} rows={3} placeholder="Describe pending tasks or issues…" />
    </div>
  );
}

function OffAssets({ data, set }) {
  const items = [
    { key: 'laptop', label: 'Laptop / Device', desc: 'Company-issued laptop or desktop' },
    { key: 'id_card', label: 'ID Card', desc: 'Employee ID card returned' },
    { key: 'access_card', label: 'Access Card', desc: 'Office access card / key fob' },
    { key: 'mobile', label: 'Mobile Phone', desc: 'Company mobile (if issued)' },
    { key: 'sim', label: 'SIM Card', desc: 'Company SIM card' },
    { key: 'other', label: 'Other Assets', desc: 'Headset, peripherals, equipment' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Asset Return" subtitle="Confirm all company assets have been returned" />
      {items.map(({ key, label, desc }) => (
        <div key={key} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: data[key] ? 8 : 0 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{label}</div>
              <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{desc}</div>
            </div>
            <Toggle label="" value={data[key]} onChange={v => set(key, v)} />
          </div>
          {data[key] && (
            <Grid2>
              <DateField label="Return Date" value={data[key + '_date']} onChange={v => set(key + '_date', v)} />
              <Select label="Condition" value={data[key + '_condition']} onChange={v => set(key + '_condition', v)}
                options={['Good', 'Minor Damage', 'Major Damage', 'Lost']} />
            </Grid2>
          )}
        </div>
      ))}
      <Textarea label="Asset Return Notes" value={data.notes} onChange={v => set('notes', v)} rows={2} />
    </div>
  );
}

function OffAccess({ data, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Access Revocation" subtitle="Ensure all system and digital access is removed" />
      {[
        { key: 'email', label: 'Official Email Deactivated', desc: 'Corporate email account disabled' },
        { key: 'system', label: 'System / Domain Access Removed', desc: 'Windows/Linux login revoked' },
        { key: 'vpn', label: 'VPN Access Removed', desc: 'Remote access credentials revoked' },
        { key: 'slack', label: 'Communication Tools Removed', desc: 'Slack / Teams / Google Chat access removed' },
        { key: 'code', label: 'Code Repository Access Removed', desc: 'GitHub / GitLab access revoked' },
        { key: 'cloud', label: 'Cloud Access Removed', desc: 'AWS / GCP / Azure access revoked' },
        { key: 'erp', label: 'HRMS / ERP Access Removed', desc: 'AR Peopliz portal access disabled' },
      ].map(({ key, label, desc }) => (
        <Toggle key={key} label={label} value={data[key]} onChange={v => set(key, v)} description={desc} />
      ))}
      <Grid2>
        <DateField label="Revocation Date" value={data.revocation_date} onChange={v => set('revocation_date', v)} />
        <Input label="Executed By" value={data.executed_by} onChange={v => set('executed_by', v)} placeholder="IT admin name" />
      </Grid2>
      <Textarea label="Notes" value={data.notes} onChange={v => set('notes', v)} rows={2} />
    </div>
  );
}

function OffExitInterview({ data, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Exit Interview" subtitle="Record exit interview findings" />
      <Toggle label="Exit Interview Completed" value={data.completed} onChange={v => set('completed', v)} />
      {data.completed && (
        <>
          <Grid2>
            <DateField label="Interview Date" value={data.interview_date} onChange={v => set('interview_date', v)} />
            <Input label="Conducted By" value={data.conducted_by} onChange={v => set('conducted_by', v)} placeholder="HR name" />
          </Grid2>
          <Textarea label="Key Feedback / Reasons" value={data.feedback} onChange={v => set('feedback', v)} rows={3} placeholder="What the employee shared…" />
          <Textarea label="Improvement Suggestions" value={data.suggestions} onChange={v => set('suggestions', v)} rows={2} />
          <Select label="Overall Satisfaction (exit rating)" value={data.satisfaction} onChange={v => set('satisfaction', v)}
            options={['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']} />
          <Select label="Would Recommend Company" value={data.recommend} onChange={v => set('recommend', v)}
            options={['Yes', 'No', 'Maybe']} />
        </>
      )}
    </div>
  );
}

function OffSettlement({ data, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Final Settlement" subtitle="Calculate and process full and final settlement" />
      <FieldGroup title="Leaves & Salary">
        <Grid2>
          <Input label="Pending Leave Days" value={data.pending_leaves} onChange={v => set('pending_leaves', v)} type="number" placeholder="0" />
          <Input label="Leave Encashment (₹)" value={data.leave_encashment} onChange={v => set('leave_encashment', v)} type="number" placeholder="0" />
        </Grid2>
        <Grid2>
          <Input label="Pending Salary (₹)" value={data.pending_salary} onChange={v => set('pending_salary', v)} type="number" placeholder="0" />
          <Input label="Bonus / Arrears (₹)" value={data.bonus} onChange={v => set('bonus', v)} type="number" placeholder="0" />
        </Grid2>
      </FieldGroup>
      <FieldGroup title="Statutory Benefits">
        <Grid2>
          <Select label="PF Status" value={data.pf_status} onChange={v => set('pf_status', v)}
            options={['Pending', 'Withdrawal Initiated', 'Transfer Initiated', 'Completed']} />
          <Input label="PF Amount (₹)" value={data.pf_amount} onChange={v => set('pf_amount', v)} type="number" placeholder="0" />
        </Grid2>
        <Grid2>
          <Input label="Gratuity Amount (₹)" value={data.gratuity} onChange={v => set('gratuity', v)} type="number" placeholder="0" />
          <Input label="ESI Benefit (₹)" value={data.esi} onChange={v => set('esi', v)} type="number" placeholder="0" />
        </Grid2>
      </FieldGroup>
      <FieldGroup title="Deductions">
        <Grid2>
          <Input label="Notice Period Shortfall (₹)" value={data.notice_deduction} onChange={v => set('notice_deduction', v)} type="number" placeholder="0" />
          <Input label="Asset Damage / Recovery (₹)" value={data.asset_deduction} onChange={v => set('asset_deduction', v)} type="number" placeholder="0" />
        </Grid2>
      </FieldGroup>
      <div style={{ background: '#EFF6FF', borderRadius: 10, padding: 14, border: '1px solid #BFDBFE' }}>
        <div style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 700, marginBottom: 4 }}>TOTAL SETTLEMENT AMOUNT</div>
        <Input label="" value={data.total_settlement} onChange={v => set('total_settlement', v)} type="number" placeholder="Calculated total (₹)" />
      </div>
      <Grid2>
        <Select label="Settlement Status" value={data.settlement_status} onChange={v => set('settlement_status', v)}
          options={['Pending', 'Under Process', 'Approved', 'Paid']} />
        <DateField label="Settlement Date" value={data.settlement_date} onChange={v => set('settlement_date', v)} />
      </Grid2>
    </div>
  );
}

function OffDocuments({ data, set }) {
  const docs = [
    { key: 'experience_letter', label: 'Experience Letter' },
    { key: 'relieving_letter', label: 'Relieving Letter' },
    { key: 'noc', label: 'NOC (No Objection Certificate)' },
    { key: 'form16', label: 'Form 16 (Tax Certificate)' },
    { key: 'salary_certificate', label: 'Salary Certificate' },
    { key: 'pf_statement', label: 'PF Statement' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Exit Documents" subtitle="Documents to be issued to the employee on exit" />
      {docs.map(({ key, label }) => (
        <div key={key} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: data[key] ? 8 : 0 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{label}</span>
            <Toggle label="" value={data[key]} onChange={v => set(key, v)} />
          </div>
          {data[key] && (
            <Grid2>
              <DateField label="Issue Date" value={data[key + '_date']} onChange={v => set(key + '_date', v)} />
              <Input label="Issued By" value={data[key + '_by']} onChange={v => set(key + '_by', v)} placeholder="HR name" />
            </Grid2>
          )}
        </div>
      ))}
    </div>
  );
}

function ActivityLog({ sections, steps, history = [] }) {
  const completed = steps.filter(s => sections[s.key]?.saved_at).length;
  const pending   = steps.filter(s => !sections[s.key]?.saved_at).length;
  const fmt = iso => {
    try { return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  };
  const ACTION_STYLES = {
    save:       { bg: '#EFF6FF', border: '#BFDBFE', dot: '#1A6AB4', text: '#1E40AF' },
    add_row:    { bg: '#F0FDF4', border: '#BBF7D0', dot: '#16A34A', text: '#166534' },
    update_row: { bg: '#FFFBEB', border: '#FDE68A', dot: '#CA8A04', text: '#92400E' },
    delete_row: { bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444', text: '#991B1B' },
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Activity Log" subtitle="Full history of all adds, updates and deletes" />

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: 'Sections Saved', value: completed, bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
          { label: 'Pending',        value: pending,   bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' },
          { label: 'Total Changes',  value: history.length, bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
        ].map(({ label, value, bg, color, border }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 11, color, opacity: 0.75, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Section status grid */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Section Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
          {steps.filter(s => s.key !== 'activity_log').map(s => {
            const saved = sections[s.key]?.saved_at;
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: saved ? '#F0FDF4' : '#F9FAFB', border: `1px solid ${saved ? '#BBF7D0' : '#E5E7EB'}` }}>
                {saved ? <CheckCheck size={14} color="#16A34A" /> : <Clock size={14} color="#9CA3AF" />}
                <span style={{ fontSize: 12.5, fontWeight: 500, color: saved ? '#166534' : '#6B7280', flex: 1 }}>{s.label}</span>
                {saved && <span style={{ fontSize: 10, color: '#4B7A5F' }}>{fmt(sections[s.key].saved_at)}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* History timeline */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Change History ({history.length} entries)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {history.map((h, i) => {
              const st = ACTION_STYLES[h.action] || ACTION_STYLES.save;
              return (
                <div key={h.id || i} style={{ display: 'flex', gap: 12, paddingBottom: 12, position: 'relative' }}>
                  {/* timeline line */}
                  {i < history.length - 1 && <div style={{ position: 'absolute', left: 11, top: 24, bottom: 0, width: 2, background: '#E5E7EB' }} />}
                  {/* dot */}
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: st.bg, border: `2px solid ${st.dot}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    {h.action === 'add_row'    ? <Plus size={10} color={st.dot} /> :
                     h.action === 'delete_row' ? <Trash2 size={10} color={st.dot} /> :
                     h.action === 'update_row' ? <Pencil size={10} color={st.dot} /> :
                     <Save size={10} color={st.dot} />}
                  </div>
                  {/* content */}
                  <div style={{ flex: 1, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: st.text }}>{h.summary}</span>
                        <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={10} />{h.changed_by || 'HR'}
                          <Calendar size={10} />{fmt(h.timestamp)}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: st.text, background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {h.action?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {history.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>
          <History size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
          No history yet. Changes will appear here after saving sections.
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   WIZARD MODAL
══════════════════════════════════════════════ */
function WizardModal({ emp, type, onClose }) {
  const steps   = type === 'onboarding' ? ON_STEPS : OFF_STEPS;
  const [step, setStep]       = useState(0);
  const [sections, setSections] = useState({});
  const [history, setHistory]   = useState([]);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const baseUrl = type === 'onboarding' ? `/api/onboarding` : `/api/onboarding/offboarding`;

  const loadSections = useCallback(async () => {
    try {
      const d = await api('GET', `${baseUrl}/${emp.id}/sections`);
      setSections(d.sections || {});
      setHistory(Array.isArray(d.history) ? [...d.history].reverse() : []);
    } catch { /* ignore */ }
  }, [emp.id, baseUrl]);

  useEffect(() => { loadSections(); }, [loadSections]);

  const currentKey  = steps[step].key;
  const sectionData = (sections[currentKey] || {}).data || {};

  const setField = (field, val) => {
    setSections(prev => ({
      ...prev,
      [currentKey]: { ...(prev[currentKey] || {}), data: { ...(prev[currentKey]?.data || {}), [field]: val } }
    }));
    setSaved(false);
  };

  const saveSection = async (action = 'save', rowSummary = '') => {
    setSaving(true);
    try {
      let data = (sections[currentKey] || {}).data || {};

      /* ── Sync asset rows to employee_assets table ── */
      if (currentKey === 'assets' && type === 'onboarding') {
        const rows = data.assets || [];
        const synced = await Promise.all(rows.map(async row => {
          if (row._hrm_id || !row.type) return row;
          try {
            const r = await api('POST', '/api/hrm/assets', {
              employee_id: emp.id,
              asset_name: row.type,
              asset_type: row.type,
              serial_number: row.serial || null,
              allocated_date: row.issue_date || new Date().toISOString().split('T')[0],
              condition: row.condition || 'Good',
              notes: row.notes || null,
            });
            return { ...row, _hrm_id: r.id };
          } catch { return row; }
        }));
        data = { ...data, assets: synced };
      }

      const stepLabel = steps[step].label;
      const summary = rowSummary || `${stepLabel} updated`;
      const res = await api('PUT', `${baseUrl}/${emp.id}/section`, {
        section: currentKey, data, action, row_summary: summary, changed_by: 'HR',
      });
      setSections(prev => ({ ...prev, ...res.sections }));
      // Reload history to get the fresh log
      const hd = await api('GET', `${baseUrl}/${emp.id}/sections`).catch(() => ({ history: [] }));
      setHistory(Array.isArray(hd.history) ? [...hd.history].reverse() : []);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const saveAndNext = async () => {
    await saveSection();
    if (step < steps.length - 1) setStep(s => s + 1);
  };

  const completedCount = steps.filter(s => sections[s.key]?.saved_at).length;
  const pct = Math.round(completedCount / steps.length * 100);
  const isActivityLog = steps[step].key === 'activity_log';
  const isEmpInfo     = steps[step].key === 'employee_info';

  const renderStepContent = () => {
    const d = sectionData;
    const s = setField;
    if (type === 'onboarding') {
      switch (currentKey) {
        case 'personal_info': return <OnPersonalInfo data={d} set={s} emp={emp} />;
        case 'employment':    return <OnEmployment   data={d} set={s} emp={emp} />;
        case 'documents':     return <OnDocuments    data={d} set={s} empId={emp.id} />;
        case 'education':     return <OnEducation    data={d} set={s} />;
        case 'experience':    return <OnExperience   data={d} set={s} />;
        case 'assets':        return <OnAssets       data={d} set={s} />;
        case 'it_access':     return <OnITAccess     data={d} set={s} />;
        case 'training':      return <OnTraining     data={d} set={s} />;
        case 'checklist':     return <OnChecklist    data={d} set={s} />;
        case 'activity_log':  return <ActivityLog sections={sections} steps={ON_STEPS} history={history} />;
        default: return null;
      }
    } else {
      switch (currentKey) {
        case 'employee_info':      return <OffEmployeeInfo emp={emp} />;
        case 'exit_details':       return <OffExitDetails  data={d} set={s} />;
        case 'notice_period':      return <OffNoticePeriod data={d} set={s} />;
        case 'knowledge_transfer': return <OffKT           data={d} set={s} />;
        case 'assets_return':      return <OffAssets       data={d} set={s} />;
        case 'access_revocation':  return <OffAccess       data={d} set={s} />;
        case 'exit_interview':     return <OffExitInterview data={d} set={s} />;
        case 'final_settlement':   return <OffSettlement   data={d} set={s} />;
        case 'documents':          return <OffDocuments    data={d} set={s} />;
        case 'activity_log':       return <ActivityLog sections={sections} steps={OFF_STEPS} history={history} />;
        default: return null;
      }
    }
  };

  const accentColor = type === 'onboarding' ? '#1A6AB4' : '#EF4444';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(13,31,78,0.55)', display: 'flex', alignItems: 'stretch' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ display: 'flex', width: '100%', maxWidth: 960, margin: 'auto', height: '90vh', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 80px rgba(13,31,78,0.3)' }}>

        {/* ── Left: Step list ── */}
        <div style={{ width: 240, flexShrink: 0, background: '#111827', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <EmpAvatar name={emp.full_name} photo={emp.profile_photo} size="xs" colorIndex={emp.id} rounded="rounded-full" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.designation}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {type === 'onboarding' ? 'Onboarding' : 'Offboarding'}
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: accentColor, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{completedCount}/{steps.length} sections saved</div>
          </div>

          {/* Steps */}
          <nav style={{ flex: 1, padding: '8px 0' }}>
            {steps.map((s, i) => {
              const isActive  = i === step;
              const isSaved   = !!sections[s.key]?.saved_at;
              return (
                <button key={s.key} onClick={() => setStep(i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: isActive ? `${accentColor}20` : 'transparent',
                    borderLeft: isActive ? `3px solid ${accentColor}` : '3px solid transparent',
                    fontFamily: 'inherit', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
                    background: isSaved ? '#16A34A' : isActive ? accentColor : 'rgba(255,255,255,0.1)',
                    color: isSaved || isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}>
                    {isSaved ? '✓' : i + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Right: Content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top bar */}
          <div className="onb-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
            <div>
              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>Step {step + 1} of {steps.length} &nbsp;·&nbsp; </span>
              <span className="onb-section-title" style={{ fontSize: 13, fontWeight: 700, color: '#0D1F4E' }}>{steps[step].label}</span>
              {sections[steps[step].key]?.saved_at && (
                <span style={{ marginLeft: 8, fontSize: 11, color: '#16A34A', background: '#F0FDF4', padding: '2px 7px', borderRadius: 20, border: '1px solid #BBF7D0' }}>
                  ✓ Saved
                </span>
              )}
            </div>
            <button onClick={onClose} className="onb-wizard-close" style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}>
              <X size={15} color="#6B7280" />
            </button>
          </div>

          {/* Form area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {renderStepContent()}
          </div>

          {/* Footer */}
          {!isActivityLog && !isEmpInfo && (
            <div className="onb-wizard-footer" style={{ padding: '12px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#FAFAFA' }}>
              <button onClick={() => step > 0 && setStep(s => s - 1)} disabled={step === 0}
                className="btn btn-secondary btn-sm gap-1.5" style={{ opacity: step === 0 ? 0.4 : 1 }}>
                <ChevronLeft size={13} /> Previous
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                {saved && <span style={{ fontSize: 12, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={13} /> Saved!</span>}
                <button onClick={saveSection} disabled={saving} className="btn btn-secondary btn-sm gap-1.5">
                  <Save size={13} /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={saveAndNext} disabled={saving || step === steps.length - 1}
                  className="btn btn-primary btn-sm gap-1.5"
                  style={{ opacity: step === steps.length - 1 ? 0.4 : 1 }}>
                  Save & Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   EMPLOYEE CARD
══════════════════════════════════════════════ */
function EmpCard({ emp, type, onClick }) {
  const pct   = emp.total ? Math.round(emp.progress / emp.total * 100) : 0;
  const color = pct >= 100 ? '#16A34A' : pct >= 50 ? '#CA8A04' : '#1A6AB4';
  return (
    <div onClick={onClick} className="card p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
      style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <EmpAvatar name={emp.full_name} photo={emp.profile_photo} size="sm" colorIndex={emp.id} rounded="rounded-full" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="onb-emp-name" style={{ fontSize: 13, fontWeight: 600, color: '#0D1F4E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {emp.designation || '—'} · {emp.department || '—'}
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '18', padding: '2px 8px', borderRadius: 20, border: `1px solid ${color}30`, flexShrink: 0 }}>
          {emp.progress}/{emp.total}
        </span>
      </div>
      <div className="onb-progress-track" style={{ height: 4, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
      <div style={{ fontSize: 11, color: '#9CA3AF' }}>
        {type === 'onboarding' ? `Joined ${fmtDate(emp.date_of_joining)}` : `Status: ${emp.status}`}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ADD NEW JOINER MODAL
══════════════════════════════════════════════ */
function NewJoinerModal({ depts, desigs, onClose, onCreated, toast }) {
  const EMPTY = { first_name: '', last_name: '', email: '', mobile: '', department_id: '', designation_id: '', date_of_joining: '', employment_type: 'Full-time', basic_salary: '' };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.first_name.trim() || !form.email.trim() || !form.date_of_joining) {
      toast('First name, email and joining date are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const username = form.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
      const emp = await api('POST', '/api/employees', {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim() || null,
        username,
        password: 'Welcome@123',
        department_id: form.department_id ? parseInt(form.department_id) : null,
        designation_id: form.designation_id ? parseInt(form.designation_id) : null,
        date_of_joining: form.date_of_joining,
        employment_type: form.employment_type || 'Full-time',
        basic_salary: form.basic_salary ? parseFloat(form.basic_salary) : null,
        status: 'Active',
      });
      toast(`${form.first_name} added! Temp password: Welcome@123`, 'success');
      onCreated(emp);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(13,31,78,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(13,31,78,0.3)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #F3F4F6' }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0D1F4E', margin: 0 }}>Add New Joiner</h2>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>Creates employee record and opens onboarding wizard</p>
          </div>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}>
            <X size={15} color="#6B7280" />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Grid2>
            <Input label="First Name" value={form.first_name} onChange={v => f('first_name', v)} required placeholder="First name" />
            <Input label="Last Name" value={form.last_name} onChange={v => f('last_name', v)} placeholder="Last name" />
          </Grid2>
          <Input label="Work Email" value={form.email} onChange={v => f('email', v)} required type="email" placeholder="employee@company.com" />
          <PhoneInput label="Mobile" value={form.mobile} onChange={v => f('mobile', v)} />
          <Grid2>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Department</label>
              <SelectDS
                value={form.department_id ? String(form.department_id) : ''}
                onChange={v => f('department_id', v ? parseInt(v) : '')}
                options={depts.map(d => ({ value: String(d.id), label: d.name }))}
                placeholder="— Select —"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Designation</label>
              <SelectDS
                value={form.designation_id ? String(form.designation_id) : ''}
                onChange={v => f('designation_id', v ? parseInt(v) : '')}
                options={desigs.map(d => ({ value: String(d.id), label: d.name }))}
                placeholder="— Select —"
              />
            </div>
          </Grid2>
          <Grid2>
            <DateField label="Date of Joining" value={form.date_of_joining} onChange={v => f('date_of_joining', v)} required />
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Employment Type</label>
              <SelectDS value={form.employment_type} onChange={v => f('employment_type', v)}
                options={['Full-time', 'Part-time', 'Contract', 'Intern', 'Consultant']} />
            </div>
          </Grid2>
          <Input label="Basic Salary (₹/month)" value={form.basic_salary} onChange={v => f('basic_salary', v)} type="number" placeholder="e.g. 50000" hint="Sets up payroll from day one" />
          <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '10px 14px', border: '1px solid #FDE68A', fontSize: 12, color: '#92400E' }}>
            <strong>Temporary password:</strong> Welcome@123 — Share with the employee so they can log in and complete their profile.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn btn-primary btn-sm gap-1.5">
            <UserPlus size={13} /> {saving ? 'Creating…' : 'Create & Start Onboarding'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function Onboarding({ toast }) {
  const [tab, setTab]               = useState('onboarding');
  const [onList, setOnList]         = useState([]);
  const [offList, setOffList]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState('');
  const [showAddJoiner, setShowAddJoiner] = useState(false);
  const [depts, setDepts]           = useState([]);
  const [desigs, setDesigs]         = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [onRes, offRes, depsRes, desRes] = await Promise.allSettled([
      api('GET', '/api/onboarding/list'),
      api('GET', '/api/onboarding/offboarding/list'),
      api('GET', '/api/employees/departments'),
      api('GET', '/api/employees/designations'),
    ]);
    if (onRes.status  === 'fulfilled') setOnList(onRes.value);
    else toast(`Onboarding list: ${onRes.reason?.message || 'failed'}`, 'error');
    if (offRes.status === 'fulfilled') setOffList(offRes.value);
    else toast(`Offboarding list: ${offRes.reason?.message || 'failed'}`, 'error');
    if (depsRes.status === 'fulfilled') { const d = depsRes.value; setDepts(Array.isArray(d) ? d : (d?.departments || [])); }
    if (desRes.status  === 'fulfilled') { const d = desRes.value;  setDesigs(Array.isArray(d) ? d : (d?.designations || [])); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const list = (tab === 'onboarding' ? onList : offList)
    .filter(e => !search.trim() || e.full_name?.toLowerCase().includes(search.toLowerCase()) || e.department?.toLowerCase().includes(search.toLowerCase()));

  const completed  = list.filter(e => e.progress === e.total).length;
  const inProgress = list.filter(e => e.progress > 0 && e.progress < e.total).length;
  const notStarted = list.filter(e => e.progress === 0).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Onboarding / Offboarding</h1>
          <p className="text-xs text-gray-500 mt-0.5">MNC standard employee lifecycle management</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'onboarding' && (
            <button onClick={() => setShowAddJoiner(true)} className="btn btn-primary btn-sm gap-1.5">
              <UserPlus size={13} /> Add New Joiner
            </button>
          )}
          <button onClick={load} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      <div className="page-content space-y-4">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ key: 'onboarding', label: 'Onboarding', icon: UserPlus, color: '#1A6AB4' },
            { key: 'offboarding', label: 'Offboarding', icon: UserMinus, color: '#EF4444' }]
            .map(({ key, label, icon: Icon, color }) => (
              <button key={key} onClick={() => { setTab(key); setSearch(''); }}
                className={tab !== key ? 'onb-tab-inactive' : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                  background: tab === key ? color : '#fff', color: tab === key ? '#fff' : '#6B7280',
                  boxShadow: tab === key ? `0 2px 10px ${color}40` : '0 1px 3px rgba(0,0,0,0.08)',
                  border: tab === key ? 'none' : '1px solid #E5E7EB', transition: 'all 0.15s',
                }}>
                <Icon size={14} /> {label}
              </button>
            ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Total', value: list.length, color: '#1A6AB4', bg: '#EFF6FF' },
            { label: 'Completed', value: completed, color: '#16A34A', bg: '#F0FDF4' },
            { label: 'In Progress', value: inProgress, color: '#CA8A04', bg: '#FFFBEB' },
            { label: 'Not Started', value: notStarted, color: '#EF4444', bg: '#FEF2F2' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="card p-4 text-center" style={{ background: bg, borderColor: color + '25' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 300 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)}
            className="form-input" style={{ paddingLeft: 30, fontSize: 13 }} />
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse space-y-3">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E5E7EB' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 11, background: '#E5E7EB', borderRadius: 4, marginBottom: 6, width: '70%' }} />
                    <div style={{ height: 9, background: '#E5E7EB', borderRadius: 4, width: '50%' }} />
                  </div>
                </div>
                <div style={{ height: 4, background: '#E5E7EB', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="card"><div className="empty-state py-12">
            <p style={{ fontSize: 14, color: '#6B7280' }}>No {tab} records found</p>
          </div></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {list.map(emp => <EmpCard key={emp.id} emp={emp} type={tab} onClick={() => setSelected(emp)} />)}
          </div>
        )}
      </div>

      {selected && (
        <WizardModal emp={selected} type={tab} onClose={() => { setSelected(null); load(); }} />
      )}

      {showAddJoiner && (
        <NewJoinerModal
          depts={depts}
          desigs={desigs}
          toast={toast}
          onClose={() => setShowAddJoiner(false)}
          onCreated={async (newEmp) => {
            setShowAddJoiner(false);
            await load();
            /* Open the wizard for the newly created employee */
            setOnList(prev => {
              const found = prev.find(e => e.id === newEmp.id);
              if (found) setSelected(found);
              return prev;
            });
          }}
        />
      )}
    </>
  );
}
