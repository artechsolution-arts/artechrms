import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../api';
import { fmtDate } from '../../utils/date';
import DatePicker from '../../components/DatePicker';
import SelectComp from '../../components/Select';
import {
  FileText, FilePen, Lock, BookOpen, Shield, Monitor,
  CreditCard, Globe, GraduationCap, Briefcase, Wallet,
  Building2, FileCheck, Phone, User, Download, Upload,
  CheckCircle2, Clock, X, Save, ChevronRight, Sparkles, AlertCircle,
} from 'lucide-react';

/* ── Brand ── */
const C = { navy: '#0D1F4E', blue: '#1A6AB4', teal: '#3DC7B3', green: '#16A34A', amber: '#D97706', mist: '#E8EDF5', cloud: '#F4F8FF' };

/* ── Step definitions ── */
const STEPS = [
  { key: 'offer_letter',       label: 'Offer Letter',                group: 'Documents to Sign',     icon: FileText,       desc: 'Download, sign and return',         hasUpload: true,  hasDownload: true  },
  { key: 'employment_agreement',label: 'Employment Agreement',        group: 'Documents to Sign',     icon: FilePen,        desc: 'Download, sign and return',         hasUpload: true,  hasDownload: true },
  { key: 'nda',                label: 'NDA / Confidentiality',        group: 'Documents to Sign',     icon: Lock,           desc: 'Download, sign and return',         hasUpload: true,  hasDownload: true },
  { key: 'hr_policy',          label: 'HR Policy Handbook',           group: 'Documents to Sign',     icon: BookOpen,       desc: 'Download and acknowledge',          acknowledge: true, hasDownload: true },
  { key: 'code_of_conduct',    label: 'Code of Conduct',              group: 'Documents to Sign',     icon: Shield,         desc: 'Download and acknowledge',          acknowledge: true, hasDownload: true },
  { key: 'it_policy',          label: 'IT Security Policy',           group: 'Documents to Sign',     icon: Monitor,        desc: 'Download and acknowledge',          acknowledge: true, hasDownload: true },
  { key: 'aadhaar',            label: 'Aadhaar Card',                 group: 'Personal Documents',    icon: CreditCard,     desc: 'Number + upload copy',              hasUpload: true,  hasNumber: true    },
  { key: 'pan',                label: 'PAN Card',                     group: 'Personal Documents',    icon: CreditCard,     desc: 'Number + upload copy',              hasUpload: true,  hasNumber: true    },
  { key: 'passport',           label: 'Passport Copy',                group: 'Personal Documents',    icon: Globe,          desc: 'Optional, if applicable',           hasUpload: true,  hasNumber: true, optional: true },
  { key: 'education_certs',    label: 'Educational Certificates',     group: 'Personal Documents',    icon: GraduationCap,  desc: 'All degree certificates',           hasUpload: true  },
  { key: 'prev_employment',    label: 'Previous Employment Letter',   group: 'Personal Documents',    icon: Briefcase,      desc: 'Relieving / experience letter',     hasUpload: true  },
  { key: 'salary_slips',       label: 'Last 3 Months Salary Slips',   group: 'Personal Documents',    icon: Wallet,         desc: 'From last employer',                hasUpload: true  },
  { key: 'bank_details',       label: 'Bank Account Details',         group: 'Bank & Statutory',      icon: Building2,      desc: 'Account number & IFSC',             hasFields: true  },
  { key: 'pf_form',            label: 'PF Nomination Form',           group: 'Bank & Statutory',      icon: FileCheck,      desc: 'Download, fill and return',         hasUpload: true, hasDownload: true },
  { key: 'emergency_contact',  label: 'Emergency Contact',            group: 'Personal Information',  icon: Phone,          desc: 'Name, relation & phone',            hasFields: true  },
  { key: 'personal_info',      label: 'Personal Details',             group: 'Personal Information',  icon: User,           desc: 'DOB, address & more',               hasFields: true  },
];

const GROUPS = ['Documents to Sign', 'Personal Documents', 'Bank & Statutory', 'Personal Information'];

const GROUP_COLORS = {
  'Documents to Sign':    '#1A6AB4',
  'Personal Documents':   '#3DC7B3',
  'Bank & Statutory':     '#2DB37A',
  'Personal Information': '#8B5CF6',
};

/* ── Status config ── */
const ST = {
  pending:   { label: 'Pending',   bg: '#FEF9C3', border: '#FDE047', text: '#854D0E', dot: '#CA8A04' },
  submitted: { label: 'Submitted', bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', dot: '#1A6AB4' },
  verified:  { label: 'Verified',  bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', dot: '#16A34A' },
};

/* ── Small helpers ── */
const Inp = ({ label, value, onChange, type = 'text', placeholder, required }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
      {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
    </label>
    <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} className="form-input" style={{ fontSize: 13 }} />
  </div>
);
const PhoneInp = ({ label, value, onChange, required }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
      {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
    </label>
    <div className="flex">
      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 select-none">+91</span>
      <input inputMode="numeric" maxLength={10} value={(value || '').replace(/^\+91/, '')}
        onChange={e => { const d = e.target.value.replace(/\D/g, '').slice(0, 10); onChange(d ? `+91${d}` : ''); }}
        placeholder="10-digit mobile number" className="form-input rounded-l-none flex-1" style={{ fontSize: 13 }} />
    </div>
  </div>
);
const Sel = ({ label, value, onChange, opts }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
    <SelectComp value={value || ''} onChange={onChange} options={opts} placeholder="— Select —" />
  </div>
);
const Row2 = ({ children }) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;

/* ── Step modal content ── */
function StepForm({ step, data, setData, fileUrl, fileName, onUpload, uploading }) {
  // Always pass plain object — parent expects object, not function updater
  const set = (k, v) => setData({ ...data, [k]: v });
  const fileRef = useRef();

  const DownloadBtn = ({ label }) => (
    <a href={`/api/portal/start-journey/download/${step.key}`}
      download
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
        background: C.cloud, border: `1.5px solid ${C.mist}`, borderRadius: 9, cursor: 'pointer',
        fontSize: 13, fontWeight: 600, color: C.navy, textDecoration: 'none',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.blue}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.mist}
    >
      <Download size={15} color={C.blue} />
      {label}
    </a>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Download section */}
      {step.hasDownload && (
        <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '16px 18px', border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Step 1 — Download
          </div>
          <p style={{ fontSize: 13, color: '#374151', marginBottom: 12, lineHeight: 1.6 }}>
            {step.key === 'offer_letter'
              ? 'Your offer letter is ready. Download it, print it, sign it and upload the signed copy.'
              : step.key === 'employment_agreement'
              ? 'Download the Employment Agreement, review and sign it, then upload the signed copy.'
              : step.key === 'nda'
              ? 'Download the NDA / Confidentiality Agreement, sign it, and upload the signed copy.'
              : step.key === 'hr_policy'
              ? 'Download and read the HR Policy Handbook carefully before acknowledging below.'
              : step.key === 'code_of_conduct'
              ? 'Download the Code of Conduct document. Read it fully before acknowledging.'
              : step.key === 'it_policy'
              ? 'Download the IT Security Policy and read it. Acknowledge your understanding below.'
              : 'Download the form, fill it out and upload the completed copy.'}
          </p>
          <DownloadBtn label={`Download ${step.label}`} />
        </div>
      )}

      {/* Step 2 — Sign / Acknowledge (all "Documents to Sign" group) */}
      {['offer_letter','employment_agreement','nda','hr_policy','code_of_conduct','it_policy'].includes(step.key) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Step 2 — {step.acknowledge ? 'Acknowledge' : 'Sign & Acknowledge'}
          </div>
          {step.acknowledge ? (
            // Policy docs — read & agree checkboxes
            <>
              {[
                { key: 'read',  label: `I have read the ${step.label} in full` },
                { key: 'agree', label: `I agree to abide by the ${step.label}` },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!data[key]}
                    onChange={e => set(key, e.target.checked)}
                    style={{ width: 16, height: 16, marginTop: 1, accentColor: C.blue, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>{label}</span>
                </label>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Acknowledgment Date <span style={{ color: '#EF4444' }}>*</span></label>
                <DatePicker value={data.date} onChange={v => set('date', v)} placeholder="Select date" />
              </div>
            </>
          ) : (
            // Offer letter / agreement / NDA — print, sign, return
            <>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                Print the document, sign it physically, then upload the signed copy in Step 3 below.
              </p>
              {[
                { key: 'read',     label: `I have read the ${step.label} in full` },
                { key: 'accepted', label: `I have signed the ${step.label} and will upload the signed copy` },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!data[key]}
                    onChange={e => set(key, e.target.checked)}
                    style={{ width: 16, height: 16, marginTop: 1, accentColor: C.blue, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>{label}</span>
                </label>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Date Signed <span style={{ color: '#EF4444' }}>*</span></label>
                <DatePicker value={data.date} onChange={v => set('date', v)} placeholder="Select date" />
              </div>
            </>
          )}
        </div>
      )}

      {/* Number field */}
      {step.hasNumber && (
        <div>
          <Inp
            label={step.key === 'aadhaar' ? 'Aadhaar Number' : step.key === 'pan' ? 'PAN Number' : 'Document Number'}
            value={data.number}
            onChange={v => set('number', v)}
            placeholder={step.key === 'aadhaar' ? 'XXXX XXXX XXXX' : step.key === 'pan' ? 'ABCDE1234F' : 'Document number'}
            required={!step.optional}
          />
          {step.key === 'passport' && (
            <div style={{ marginTop: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Expiry Date</label>
                <DatePicker value={data.expiry} onChange={v => set('expiry', v)} placeholder="Select expiry date" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bank details */}
      {step.key === 'bank_details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Row2>
            <Inp label="Bank Name" value={data.bank_name} onChange={v => set('bank_name', v)} placeholder="e.g. HDFC Bank" required />
            <Sel label="Account Type" value={data.account_type} onChange={v => set('account_type', v)} opts={['Savings', 'Current']} />
          </Row2>
          <Inp label="Account Number" value={data.account_number} onChange={v => set('account_number', v)} placeholder="Bank account number" required />
          <Row2>
            <Inp label="IFSC Code" value={data.ifsc} onChange={v => set('ifsc', v)} placeholder="HDFC0001234" required />
            <Inp label="Branch Name" value={data.branch} onChange={v => set('branch', v)} placeholder="Branch name" />
          </Row2>
          <Inp label="Account Holder Name" value={data.holder_name} onChange={v => set('holder_name', v)} required />
        </div>
      )}

      {/* Emergency contact */}
      {step.key === 'emergency_contact' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Row2>
            <Inp label="Contact Name" value={data.name} onChange={v => set('name', v)} placeholder="Full name" required />
            <Sel label="Relationship" value={data.relationship} onChange={v => set('relationship', v)} opts={['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other']} />
          </Row2>
          <Row2>
            <PhoneInp label="Phone Number" value={data.phone} onChange={v => set('phone', v)} required />
            <PhoneInp label="Alternate Phone" value={data.alt_phone} onChange={v => set('alt_phone', v)} />
          </Row2>
        </div>
      )}

      {/* Personal info */}
      {step.key === 'personal_info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Row2>
            <Inp label="Personal Email" value={data.personal_email} onChange={v => set('personal_email', v)} type="email" placeholder="personal@example.com" />
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Date of Birth</label>
              <DatePicker value={data.dob} onChange={v => set('dob', v)} placeholder="Select date of birth" />
            </div>
          </Row2>
          <Row2>
            <Sel label="Blood Group" value={data.blood_group} onChange={v => set('blood_group', v)} opts={['A+','A-','B+','B-','O+','O-','AB+','AB-']} />
            <Sel label="Marital Status" value={data.marital_status} onChange={v => set('marital_status', v)} opts={['Single','Married','Divorced','Widowed']} />
          </Row2>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Present Address</label>
            <textarea value={data.present_address || ''} onChange={e => set('present_address', e.target.value)}
              rows={2} placeholder="Door No, Street, City, State, PIN" className="form-textarea" style={{ fontSize: 13 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Permanent Address</label>
            <textarea value={data.permanent_address || ''} onChange={e => set('permanent_address', e.target.value)}
              rows={2} placeholder="Same as present / different" className="form-textarea" style={{ fontSize: 13 }} />
          </div>
        </div>
      )}

      {/* Upload area */}
      {step.hasUpload && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            {step.hasDownload && step.hasUpload
            ? `Step 3 — Upload Signed Copy`
            : step.hasDownload
            ? `Step 3 — Upload Document`
            : 'Upload Document'}
          </div>
          {fileUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
              <CheckCircle2 size={18} color="#16A34A" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fileName || 'Document uploaded'}
                </div>
                <div style={{ fontSize: 11, color: '#4B7A5F', marginTop: 2 }}>Upload successful</div>
              </div>
              <button onClick={() => fileRef.current?.click()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, color: C.blue }}>
                Replace
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '18px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                border: `2px dashed ${uploading ? C.mist : '#BFDBFE'}`,
                background: uploading ? C.cloud : '#F0F7FF',
                color: uploading ? C.mist : '#1E40AF',
                fontSize: 13.5, fontWeight: 600, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!uploading) { e.currentTarget.style.background = '#DBEAFE'; e.currentTarget.style.borderColor = C.blue; }}}
              onMouseLeave={e => { if (!uploading) { e.currentTarget.style.background = '#F0F7FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}}
            >
              <Upload size={18} />
              {uploading ? 'Uploading…' : 'Click to upload — PDF, JPG, PNG, DOC'}
            </button>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { onUpload(step.key, f); e.target.value = ''; }}} />
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Max file size: 5 MB. Accepted: PDF, JPG, PNG, DOC, DOCX</p>
        </div>
      )}
    </div>
  );
}

/* ── Step Card ── */
function StepCard({ step, status, fileUrl, progress, onClick }) {
  const Icon = step.icon;
  const st = ST[status] || ST.pending;
  const color = GROUP_COLORS[step.group];
  const done = status === 'submitted' || status === 'verified';

  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: 14, padding: 18, cursor: 'pointer',
      border: `1.5px solid ${done ? st.border : C.mist}`,
      boxShadow: done ? `0 2px 12px ${st.dot}20` : '0 2px 8px rgba(13,31,78,0.06)',
      transition: 'transform 0.18s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.18s',
      position: 'relative', overflow: 'hidden',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}25`; e.currentTarget.style.borderColor = color; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = done ? `0 2px 12px ${st.dot}20` : '0 2px 8px rgba(13,31,78,0.06)'; e.currentTarget.style.borderColor = done ? st.border : C.mist; }}
    >
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: done ? st.dot : color, opacity: done ? 1 : 0.25, borderRadius: '14px 14px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11, flexShrink: 0,
          background: done ? st.bg : `${color}12`,
          border: `1px solid ${done ? st.border : `${color}25`}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={done ? st.dot : color} />
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
          background: st.bg, color: st.text, border: `1px solid ${st.border}`,
        }}>
          {done ? (status === 'verified' ? '✓ Verified' : '↑ Submitted') : 'Pending'}
        </span>
      </div>

      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.navy, marginBottom: 3, lineHeight: 1.3 }}>{step.label}</div>
      <div style={{ fontSize: 11.5, color: '#9CA3AF', marginBottom: 12, lineHeight: 1.4 }}>{step.desc}</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {step.optional && <span style={{ fontSize: 10.5, color: '#9CA3AF', fontStyle: 'italic' }}>Optional</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: done ? st.dot : color }}>
            {done ? 'Edit' : 'Complete'}
          </span>
          <ChevronRight size={13} color={done ? st.dot : color} />
        </div>
      </div>
    </div>
  );
}

/* ── Modal ── */
function StepModal({ step, stepState, stepData, setStepData, onClose, onSave, onUpload, uploading, saving }) {
  const Icon = step.icon;
  const color = GROUP_COLORS[step.group];
  const status = stepState?.status || 'pending';
  const st = ST[status] || ST.pending;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(13,31,78,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 80px rgba(13,31,78,0.25)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.mist}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{step.label}</div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>{step.group}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                {st.label}
              </span>
              <button onClick={onClose} style={{ background: C.cloud, border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}>
                <X size={14} color="#6B7280" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <StepForm
            step={step}
            data={stepData}
            setData={setStepData}
            fileUrl={stepState?.file_url}
            fileName={stepState?.file_name}
            onUpload={onUpload}
            uploading={uploading}
          />
          {stepState?.submitted_at && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={12} color="#9CA3AF" />
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                Last saved {new Date(stepState.submitted_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.mist}`, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={onSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: color, color: '#fff', transition: 'opacity 0.15s', opacity: saving ? 0.6 : 1 }}>
            <Save size={13} /> {saving ? 'Saving…' : 'Save & Mark Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function EmpStartJourney({ toast }) {
  const [journey, setJourney]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);   // step key
  const [stepData, setStepData] = useState({});     // {key: {field: value}}
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api('GET', '/api/portal/start-journey');
      setJourney(d);
      const init = {};
      (d.steps || []).forEach(s => { init[s.key] = s.data || {}; });
      setStepData(init);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const currentStep = modal ? STEPS.find(s => s.key === modal) : null;
  const currentState = modal ? journey?.steps?.find(s => s.key === modal) : null;

  const handleSave = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      await api('PUT', '/api/portal/start-journey/step', { key: modal, data: stepData[modal] || {} });
      toast('Saved!', 'success');
      await load();
      setModal(null);
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleUpload = async (stepKey, file) => {
    setUploading(stepKey);
    try {
      const token = localStorage.getItem('artech_hrms_token');
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/portal/start-journey/upload/${stepKey}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed');
      toast('Document uploaded successfully!', 'success');
      await load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setUploading(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-3">
      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      Loading your journey…
    </div>
  );

  const emp   = journey?.employee;
  const steps = journey?.steps || [];
  const pct   = journey?.total ? Math.round(journey.completed / journey.total * 100) : 0;

  const statusOf = key => steps.find(s => s.key === key)?.status || 'pending';

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Start Your Journey</h1>
          <p className="text-xs text-gray-500 mt-0.5">Complete your onboarding to get fully set up</p>
        </div>
      </div>

      <div className="page-content space-y-6">

        {/* ── Welcome hero ── */}
        <div style={{ borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 24px rgba(13,31,78,0.12)' }}>
          <div style={{ background: 'linear-gradient(135deg, #0D1F4E 0%, #1A3A7A 50%, #1A6AB4 100%)', padding: '28px 32px', position: 'relative' }}>
            {/* bg circles */}
            <div style={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(61,199,179,0.06)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 80, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <Sparkles size={14} color="#3DC7B3" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#3DC7B3', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Welcome aboard</span>
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 5px', letterSpacing: '-0.02em' }}>
                  Hello, {emp?.full_name?.split(' ')[0]}! 👋
                </h2>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', margin: '0 0 22px' }}>
                  {emp?.designation} &nbsp;·&nbsp; {emp?.department} &nbsp;·&nbsp; Joined {fmtDate(emp?.date_of_joining)}
                </p>
                <div style={{ maxWidth: 360 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>Onboarding Progress</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: pct >= 100 ? '#4ade80' : '#fff' }}>
                      {journey.completed}/{journey.total} &nbsp;({pct}%)
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, transition: 'width 0.8s ease', background: pct >= 100 ? '#4ade80' : 'linear-gradient(90deg, #3DC7B3, #60A5FA)' }} />
                  </div>
                </div>
              </div>

              {/* Progress circle */}
              <div style={{ textAlign: 'center', flexShrink: 0, position: 'relative' }}>
                <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle cx="45" cy="45" r="36" fill="none" stroke={pct >= 100 ? '#4ade80' : '#3DC7B3'} strokeWidth="8"
                    strokeDasharray={`${(pct / 100) * 2 * Math.PI * 36} ${2 * Math.PI * 36}`}
                    strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{pct}%</div>
                  <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Done</div>
                </div>
              </div>
            </div>
          </div>

          {/* Status strip */}
          <div style={{ background: 'rgba(13,31,78,0.92)', padding: '10px 32px', display: 'flex', gap: 24 }}>
            {[
              { label: 'Completed', count: steps.filter(s => s.status === 'submitted' || s.status === 'verified').length, color: '#3DC7B3' },
              { label: 'Pending', count: steps.filter(s => !s.status || s.status === 'pending').length, color: '#FDE047' },
              { label: 'Verified', count: steps.filter(s => s.status === 'verified').length, color: '#4ade80' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{count} {label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Step cards by group ── */}
        {GROUPS.map(group => {
          const groupSteps = STEPS.filter(s => s.group === group);
          const color = GROUP_COLORS[group];
          const done = groupSteps.filter(s => ['submitted','verified'].includes(statusOf(s.key))).length;
          return (
            <div key={group}>
              {/* Group header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 4, height: 20, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{group}</span>
                <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
                  {done}/{groupSteps.length} completed
                </span>
                <div style={{ flex: 1, height: 1, background: C.mist, marginLeft: 4 }} />
              </div>

              {/* Cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                {groupSteps.map(step => (
                  <StepCard
                    key={step.key}
                    step={step}
                    status={statusOf(step.key)}
                    fileUrl={steps.find(s => s.key === step.key)?.file_url}
                    onClick={() => setModal(step.key)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* ── All done banner ── */}
        {pct >= 100 && (
          <div style={{ textAlign: 'center', padding: '28px', background: '#F0FDF4', borderRadius: 16, border: '1px solid #BBF7D0' }}>
            <CheckCircle2 size={40} color="#16A34A" style={{ margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: '#166534', marginBottom: 4 }}>All Done! 🎉</div>
            <div style={{ fontSize: 13, color: '#4B7A5F' }}>You've completed all onboarding steps. HR will review and verify your submissions.</div>
          </div>
        )}

      </div>

      {/* ── Modal ── */}
      {modal && currentStep && (
        <StepModal
          step={currentStep}
          stepState={currentState}
          stepData={stepData[modal] || {}}
          setStepData={data => setStepData(prev => ({ ...prev, [modal]: data }))}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onUpload={handleUpload}
          uploading={uploading === modal}
          saving={saving}
        />
      )}
    </>
  );
}
