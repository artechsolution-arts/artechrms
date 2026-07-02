import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import SelectComp from '../../components/Select';
import DatePicker from '../../components/DatePicker';
import {
  Clock, CheckCircle2, X, Save, ChevronRight, AlertTriangle,
  ClipboardList, BookOpen, Package, MessageSquare, Landmark,
} from 'lucide-react';

const C = { red: '#DC2626', orange: '#D97706', dark: '#1F1012', mist: '#FEF2F2', border: '#FCA5A5' };

const SECTIONS = [
  { key: 'notice_period',    label: 'Notice Period',      group: 'Your Responsibilities', icon: Clock,          desc: 'Confirm your last working day and notice period' },
  { key: 'knowledge_transfer',label: 'Knowledge Transfer', group: 'Your Responsibilities', icon: BookOpen,       desc: 'Document handover and confirm KT completion' },
  { key: 'assets_return',    label: 'Assets to Return',   group: 'Your Responsibilities', icon: Package,        desc: 'List all company assets you will hand back' },
  { key: 'exit_interview',   label: 'Exit Feedback',      group: 'Your Responsibilities', icon: MessageSquare,  desc: 'Share your feedback and reason for leaving' },
  { key: 'final_settlement', label: 'Bank & PF Details',  group: 'Settlement',            icon: Landmark,       desc: 'Provide bank account details for final settlement' },
];

const GROUPS = ['Your Responsibilities', 'Settlement'];

const GROUP_COLORS = {
  'Your Responsibilities': '#DC2626',
  'Settlement':            '#D97706',
};

const ST = {
  pending:   { label: 'Pending',   bg: '#FEF9C3', border: '#FDE047', text: '#854D0E', dot: '#CA8A04' },
  submitted: { label: 'Submitted', bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', dot: '#16A34A' },
};

const Inp = ({ label, value, onChange, type = 'text', placeholder, required, rows }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
      {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
    </label>
    {rows ? (
      <textarea value={value || ''} onChange={e => onChange(e.target.value)}
        rows={rows} placeholder={placeholder} className="form-textarea" style={{ fontSize: 13 }} />
    ) : type === 'date' ? (
      <DatePicker value={value || ''} onChange={onChange} />
    ) : (
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className="form-input" style={{ fontSize: 13 }} />
    )}
  </div>
);

const Sel = ({ label, value, onChange, opts, required }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
      {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
    </label>
    <SelectComp value={value || ''} onChange={onChange} options={opts} placeholder="— Select —" />
  </div>
);

const Row2 = ({ children }) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;

function SectionForm({ sectionKey, data, setData }) {
  const set = (k, v) => setData({ ...data, [k]: v });

  if (sectionKey === 'notice_period') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Inp label="Last Working Day" value={data.last_working_day} onChange={v => set('last_working_day', v)} type="date" required />
      <Inp label="Manager / Reporting To" value={data.manager} onChange={v => set('manager', v)} placeholder="Your reporting manager's name" />
      <Inp label="KT Handover Person" value={data.handover_person} onChange={v => set('handover_person', v)} placeholder="Who will receive your handover?" required />
      <Inp label="Additional Remarks" value={data.remarks} onChange={v => set('remarks', v)} rows={2} placeholder="Any comments about your notice period" />
    </div>
  );

  if (sectionKey === 'knowledge_transfer') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Inp label="KT Handover Person" value={data.handover_person} onChange={v => set('handover_person', v)} placeholder="Name of the person who received handover" required />
      <Inp label="Projects / Tasks Handed Over" value={data.projects} onChange={v => set('projects', v)} rows={3} placeholder="List the key projects and tasks you have handed over" required />
      <Inp label="Documentation / Links" value={data.docs_link} onChange={v => set('docs_link', v)} placeholder="Link to KT document, Wiki, or Drive folder" />
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!data.confirmed} onChange={e => set('confirmed', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#DC2626', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>
            I confirm that knowledge transfer has been completed to the best of my ability.
          </span>
        </label>
      </div>
    </div>
  );

  if (sectionKey === 'assets_return') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
        List all company assets (laptop, ID card, access card, equipment, etc.) that you will return.
      </p>
      <Inp label="Assets to Return" value={data.assets_list} onChange={v => set('assets_list', v)} rows={4}
        placeholder={'e.g.\n- Dell Laptop (S/N: ABC123)\n- ID Card\n- Access Badge'} required />
      <Inp label="Planned Return Date" value={data.return_date} onChange={v => set('return_date', v)} type="date" />
      <Inp label="Asset Handover Contact (HR/IT)" value={data.return_to} onChange={v => set('return_to', v)} placeholder="Person receiving the assets" />
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!data.confirmed} onChange={e => set('confirmed', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#DC2626', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>
            I confirm the above list is complete and I have no other company assets.
          </span>
        </label>
      </div>
    </div>
  );

  if (sectionKey === 'exit_interview') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Sel label="Primary Reason for Leaving" value={data.primary_reason} onChange={v => set('primary_reason', v)} required
        opts={['Better Opportunity', 'Higher Salary', 'Career Growth', 'Work-Life Balance', 'Personal Reasons', 'Relocation', 'Health', 'Further Studies', 'Other']} />
      <Inp label="What did you enjoy most about working here?" value={data.liked_most} onChange={v => set('liked_most', v)} rows={2} placeholder="Share what you valued..." />
      <Inp label="What could we have done better?" value={data.improvement} onChange={v => set('improvement', v)} rows={2} placeholder="Constructive feedback helps us improve..." />
      <Sel label="Would you recommend us as an employer?" value={data.recommend} onChange={v => set('recommend', v)}
        opts={['Definitely', 'Probably', 'Not Sure', 'Probably Not', 'Definitely Not']} />
      <Inp label="Any other comments?" value={data.other_comments} onChange={v => set('other_comments', v)} rows={2} placeholder="Anything else you'd like to share..." />
    </div>
  );

  if (sectionKey === 'final_settlement') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
        Provide your bank account details where we should credit your final settlement (F&F).
      </p>
      <Row2>
        <Inp label="Bank Name" value={data.bank_name} onChange={v => set('bank_name', v)} placeholder="e.g. HDFC Bank" required />
        <Sel label="Account Type" value={data.account_type} onChange={v => set('account_type', v)} opts={['Savings', 'Current']} />
      </Row2>
      <Inp label="Account Number" value={data.account_number} onChange={v => set('account_number', v)} placeholder="Your bank account number" required />
      <Row2>
        <Inp label="IFSC Code" value={data.ifsc} onChange={v => set('ifsc', v)} placeholder="HDFC0001234" required />
        <Inp label="Branch" value={data.branch} onChange={v => set('branch', v)} placeholder="Branch name" />
      </Row2>
      <Inp label="Account Holder Name" value={data.holder_name} onChange={v => set('holder_name', v)} placeholder="As per bank records" required />
      <Sel label="PF Preference" value={data.pf_preference} onChange={v => set('pf_preference', v)}
        opts={['Transfer to New Employer PF Account', 'Withdraw PF Balance', 'To be decided later']} />
      {data.pf_preference === 'Transfer to New Employer PF Account' && (
        <Inp label="New Employer PF Account Number (UAN)" value={data.new_pf_account} onChange={v => set('new_pf_account', v)} placeholder="New UAN / PF account" />
      )}
    </div>
  );

  return null;
}

function SectionCard({ section, status, onClick }) {
  const Icon = section.icon;
  const st = ST[status] || ST.pending;
  const color = GROUP_COLORS[section.group];
  const done = status === 'submitted';

  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: 14, padding: 18, cursor: 'pointer',
      border: `1.5px solid ${done ? st.border : '#F3F4F6'}`,
      boxShadow: done ? `0 2px 12px ${st.dot}20` : '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
      position: 'relative', overflow: 'hidden',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}25`; e.currentTarget.style.borderColor = color; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = done ? `0 2px 12px ${st.dot}20` : '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = done ? st.border : '#F3F4F6'; }}
    >
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
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
          {done ? '✓ Submitted' : 'Pending'}
        </span>
      </div>

      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1F2937', marginBottom: 3 }}>{section.label}</div>
      <div style={{ fontSize: 11.5, color: '#9CA3AF', marginBottom: 12 }}>{section.desc}</div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: done ? st.dot : color }}>{done ? 'Edit' : 'Complete'}</span>
        <ChevronRight size={13} color={done ? st.dot : color} />
      </div>
    </div>
  );
}

function SectionModal({ section, currentData, onClose, onSave, saving }) {
  const [data, setData] = useState(currentData || {});
  const Icon = section.icon;
  const color = GROUP_COLORS[section.group];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>

        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>{section.label}</div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>{section.group}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: '#F9FAFB', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}>
              <X size={14} color="#6B7280" />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <SectionForm sectionKey={section.key} data={data} setData={setData} />
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={() => onSave(data)} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 9, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: color, color: '#fff', opacity: saving ? 0.6 : 1 }}>
            <Save size={13} /> {saving ? 'Saving…' : 'Save & Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmpOffboarding({ toast }) {
  const [offboarding, setOffboarding] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [modal, setModal]       = useState(null);
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api('GET', '/api/portal/offboarding');
      setOffboarding(d);
    } catch (e) {
      if (e.status === 404 || String(e.message).includes('404') || String(e.message).toLowerCase().includes('no active')) {
        setNotFound(true);
      } else {
        toast(e.message, 'error');
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    if (!modal) return;
    setSaving(true);
    try {
      await api('PUT', '/api/portal/offboarding/step', { key: modal, data });
      toast('Saved!', 'success');
      await load();
      setModal(null);
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-3">
      <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      Loading your offboarding checklist…
    </div>
  );

  if (notFound) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
      <ClipboardList size={40} className="text-gray-300" />
      <div className="text-sm font-medium text-gray-500">No active offboarding found</div>
      <div className="text-xs text-gray-400">Your offboarding checklist will appear here once your resignation is approved by HR.</div>
    </div>
  );

  const emp   = offboarding?.employee;
  const steps = offboarding?.steps || [];
  const pct   = offboarding?.total ? Math.round(offboarding.completed / offboarding.total * 100) : 0;
  const statusOf = key => steps.find(s => s.key === key)?.status || 'pending';
  const dataOf   = key => steps.find(s => s.key === key)?.data || {};

  const currentSection = modal ? SECTIONS.find(s => s.key === modal) : null;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Exit Checklist</h1>
          <p className="text-xs text-gray-500 mt-0.5">Complete the steps below to ensure a smooth exit</p>
        </div>
      </div>

      <div className="page-content space-y-6">

        {/* Hero */}
        <div style={{ borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
          <div style={{ background: 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #DC2626 100%)', padding: '28px 32px', position: 'relative' }}>
            <div style={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 80, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <AlertTriangle size={14} color="#FCA5A5" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#FCA5A5', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Exit Journey</span>
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 5px', letterSpacing: '-0.02em' }}>
                  {emp?.full_name?.split(' ')[0]}, we wish you the best!
                </h2>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', margin: '0 0 6px' }}>
                  {emp?.designation}&nbsp;·&nbsp;{emp?.department}
                </p>
                {offboarding?.last_working_day && (
                  <p style={{ fontSize: 13, color: '#FCA5A5', fontWeight: 600, margin: '0 0 18px' }}>
                    Last Working Day: {new Date(offboarding.last_working_day).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                <div style={{ maxWidth: 360 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>Checklist Progress</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: pct >= 100 ? '#4ade80' : '#fff' }}>
                      {offboarding.completed}/{offboarding.total}&nbsp;({pct}%)
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, transition: 'width 0.8s ease', background: pct >= 100 ? '#4ade80' : 'linear-gradient(90deg, #F87171, #FBBF24)' }} />
                  </div>
                </div>
              </div>

              {/* Progress ring */}
              <div style={{ textAlign: 'center', flexShrink: 0, position: 'relative' }}>
                <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle cx="45" cy="45" r="36" fill="none" stroke={pct >= 100 ? '#4ade80' : '#FCA5A5'} strokeWidth="8"
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
          <div style={{ background: 'rgba(127,29,29,0.92)', padding: '10px 32px', display: 'flex', gap: 24 }}>
            {[
              { label: 'Completed', count: steps.filter(s => s.status === 'submitted').length, color: '#4ade80' },
              { label: 'Pending', count: steps.filter(s => s.status !== 'submitted').length, color: '#FDE047' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{count} {label}</span>
              </div>
            ))}
            {offboarding?.reason && (
              <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                Reason: {offboarding.reason}
              </div>
            )}
          </div>
        </div>

        {/* Cards by group */}
        {GROUPS.map(group => {
          const groupSections = SECTIONS.filter(s => s.group === group);
          const color = GROUP_COLORS[group];
          const done = groupSections.filter(s => statusOf(s.key) === 'submitted').length;
          return (
            <div key={group}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 4, height: 20, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>{group}</span>
                <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{done}/{groupSections.length} completed</span>
                <div style={{ flex: 1, height: 1, background: '#F3F4F6', marginLeft: 4 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                {groupSections.map(section => (
                  <SectionCard
                    key={section.key}
                    section={section}
                    status={statusOf(section.key)}
                    onClick={() => setModal(section.key)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* All done banner */}
        {pct >= 100 && (
          <div style={{ background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', borderRadius: 14, padding: '20px 24px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 16 }}>
            <CheckCircle2 size={32} color="#16A34A" />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#166534' }}>All steps completed!</div>
              <div style={{ fontSize: 13, color: '#4B7A5F', marginTop: 2 }}>HR will review your submissions and process your final settlement. Thank you for your contributions!</div>
            </div>
          </div>
        )}
      </div>

      {modal && currentSection && (
        <SectionModal
          section={currentSection}
          currentData={dataOf(modal)}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </>
  );
}
