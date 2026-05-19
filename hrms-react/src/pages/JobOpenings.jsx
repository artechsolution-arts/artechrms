import { useState, useEffect, useRef } from 'react';
import { api, apiForm } from '../api';
import Badge from '../components/Badge';
import { Plus, RefreshCw, Trash2, XCircle, Paperclip, Share2, Eye, Download, X } from 'lucide-react';

// ── Inline brand SVG icons ─────────────────────────────────────
const LinkedinIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
);
const FacebookIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const InstagramIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

// ── Social media preview components ──────────────────────────

function LinkedInPreview({ title, description, positions, ctc, closesOn }) {
  const snippet = description ? description.slice(0, 180) + (description.length > 180 ? '…' : '') : 'An exciting opportunity to grow your career with us.';
  const ctcLabel = ctc ? `₹${Number(ctc).toLocaleString('en-IN')} CTC` : null;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm font-sans text-[13px]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-[#0A66C2] flex items-center justify-center">
            <LinkedinIcon size={12} className="text-white" />
          </div>
          <span className="font-semibold text-[#0A66C2] text-xs">LinkedIn</span>
        </div>
        <span className="text-[10px] text-gray-400">Preview</span>
      </div>

      {/* Post header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded bg-[#0A66C2] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">AS</div>
          <div>
            <div className="font-semibold text-gray-900 text-sm leading-tight">Artech Solutions</div>
            <div className="text-[11px] text-gray-400">Company · Now · 🌐</div>
          </div>
        </div>
      </div>

      {/* Post text */}
      <div className="px-4 pb-3 text-gray-800 leading-relaxed text-[12.5px]">
        <p>🚀 <strong>We're Hiring!</strong></p>
        <p className="mt-1">We're looking for a talented <strong>{title || 'talented professional'}</strong> to join the Artech Solutions team.</p>
        {snippet && <p className="mt-1 text-gray-600">{snippet}</p>}
        <p className="mt-2">
          {positions > 1 && <span className="mr-3">👥 {positions} openings</span>}
          {ctcLabel && <span className="mr-3">💰 {ctcLabel}</span>}
          {closesOn && <span>📅 Apply by {closesOn}</span>}
        </p>
        <p className="mt-2 text-[#0A66C2]">#Hiring #{(title || '').replace(/\s+/g, '')} #Jobs #Careers #ArtechSolutions</p>
      </div>

      {/* Job card */}
      <div className="mx-4 mb-3 border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#0A66C2] to-[#0050A0] h-10 flex items-center px-4">
          <span className="text-white font-semibold text-sm truncate">{title || 'Job Opening'}</span>
        </div>
        <div className="p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Artech Solutions</div>
            {ctcLabel && <div className="text-xs text-gray-600 mt-0.5">{ctcLabel}</div>}
          </div>
          <button className="px-3 py-1 bg-[#0A66C2] text-white text-xs font-semibold rounded-full">Apply</button>
        </div>
      </div>

      {/* Reactions bar */}
      <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-gray-500 text-xs">
        <button className="flex items-center gap-1 hover:text-[#0A66C2]">👍 Like</button>
        <button className="flex items-center gap-1 hover:text-[#0A66C2]">💬 Comment</button>
        <button className="flex items-center gap-1 hover:text-[#0A66C2]">↗ Repost</button>
        <button className="flex items-center gap-1 hover:text-[#0A66C2]">✉ Send</button>
      </div>
    </div>
  );
}

function FacebookPreview({ title, description, positions, ctc, closesOn }) {
  const snippet = description ? description.slice(0, 200) + (description.length > 200 ? '…' : '') : '';
  const ctcLabel = ctc ? `₹${Number(ctc).toLocaleString('en-IN')}` : null;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm font-sans text-[13px]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-[#1877F2] flex items-center justify-center">
            <FacebookIcon size={12} className="text-white" />
          </div>
          <span className="font-semibold text-[#1877F2] text-xs">Facebook</span>
        </div>
        <span className="text-[10px] text-gray-400">Preview</span>
      </div>

      {/* Post header */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">AS</div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">Artech Solutions</div>
            <div className="text-[11px] text-gray-400">Now · 🌐</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2.5 py-1 bg-[#e7f3ff] text-[#1877F2] text-xs font-semibold rounded-md">+ Follow</button>
          <span className="text-gray-400 text-lg leading-none">···</span>
        </div>
      </div>

      {/* Post text */}
      <div className="px-4 pb-3 text-gray-800 leading-relaxed text-[12.5px]">
        <p>🎯 <strong>We're Hiring — {title || 'Come join our team!'}!</strong></p>
        {snippet && <p className="mt-1 text-gray-600">{snippet}</p>}
        <p className="mt-2">
          {positions > 1 && <><strong>{positions}</strong> position{positions > 1 ? 's' : ''} available. </>}
          {closesOn && <>Applications close <strong>{closesOn}</strong>. </>}
        </p>
        <p className="mt-1">Apply today — link in bio! 🔗</p>
      </div>

      {/* Job link card */}
      <div className="mx-4 mb-3 border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-br from-[#1877F2] via-[#0d5fd9] to-[#0a4fbf] px-4 py-5 flex flex-col items-center text-center">
          <div className="text-white/70 text-xs uppercase tracking-wider mb-1">Now Hiring</div>
          <div className="text-white font-bold text-base leading-tight">{title || 'Open Position'}</div>
          {ctcLabel && <div className="text-white/80 text-xs mt-1">CTC: {ctcLabel}</div>}
        </div>
        <div className="px-4 py-2.5 flex items-center justify-between bg-gray-50">
          <div className="text-xs text-gray-500">artech-solutions.com</div>
          <button className="px-3 py-1 bg-[#1877F2] text-white text-xs font-semibold rounded">Apply Now</button>
        </div>
      </div>

      {/* Reactions bar */}
      <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-around text-gray-500 text-xs">
        <button className="flex items-center gap-1.5 hover:text-[#1877F2] px-3 py-1 rounded hover:bg-gray-50">👍 Like</button>
        <button className="flex items-center gap-1.5 hover:text-[#1877F2] px-3 py-1 rounded hover:bg-gray-50">💬 Comment</button>
        <button className="flex items-center gap-1.5 hover:text-[#1877F2] px-3 py-1 rounded hover:bg-gray-50">↗ Share</button>
      </div>
    </div>
  );
}

function InstagramPreview({ title, description, positions, ctc }) {
  const hashtags = ['#Hiring', `#${(title || 'Jobs').replace(/\s+/g, '')}`, '#Careers', '#JobAlert', '#ArtechSolutions', '#NowHiring', '#TechJobs'].join(' ');
  const caption = description ? description.slice(0, 120) + (description.length > 120 ? '…' : '') : '';

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm font-sans text-[13px]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] flex items-center justify-center">
            <InstagramIcon size={11} className="text-white" />
          </div>
          <span className="font-semibold text-xs bg-gradient-to-r from-[#f09433] to-[#bc1888] bg-clip-text text-transparent">Instagram</span>
        </div>
        <span className="text-[10px] text-gray-400">Preview</span>
      </div>

      {/* Post header */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] p-0.5">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700">AS</span>
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-xs">artech_solutions</div>
            <div className="text-[10px] text-gray-400">Sponsored</div>
          </div>
        </div>
        <span className="text-gray-500 text-sm">···</span>
      </div>

      {/* Square image post */}
      <div className="relative w-full" style={{ paddingBottom: '100%' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#667eea] to-[#764ba2] flex flex-col items-center justify-center text-white p-5 text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-white/70 mb-3">We're Hiring</div>
          <div className="text-xl font-black leading-tight mb-3">{title || 'Open Position'}</div>
          <div className="w-10 h-0.5 bg-white/40 mb-3" />
          <div className="text-xs text-white/80 mb-4">
            {positions > 1 ? `${positions} Openings` : '1 Opening'}
            {ctc ? ` · ₹${Number(ctc).toLocaleString('en-IN')} CTC` : ''}
          </div>
          <div className="px-5 py-1.5 border border-white/60 rounded-full text-xs font-semibold tracking-wide">Apply Now</div>
          <div className="absolute bottom-3 text-[10px] text-white/50">artech_solutions</div>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 text-gray-700">
            <button className="hover:text-red-500 transition-colors">🤍</button>
            <button className="hover:text-gray-500">💬</button>
            <button className="hover:text-gray-500">✈️</button>
          </div>
          <button className="hover:text-gray-500">🔖</button>
        </div>
        <div className="text-xs font-semibold text-gray-800 mb-1">127 likes</div>
        <div className="text-xs text-gray-700">
          <span className="font-semibold">artech_solutions</span>
          {caption && <span className="text-gray-600"> {caption}</span>}
        </div>
        <div className="text-xs text-[#00376b] mt-1 leading-relaxed">{hashtags}</div>
        <div className="text-[11px] text-gray-400 mt-1">View all 12 comments</div>
        <div className="text-[10px] text-gray-300 mt-0.5 uppercase tracking-wide">Just now</div>
      </div>
    </div>
  );
}

// ── Share preview modal ───────────────────────────────────────
function SocialPreviewModal({ opening, onClose }) {
  const platforms = opening.social_platforms || [];
  if (!platforms.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Social Media Preview</h3>
            <p className="text-xs text-gray-400 mt-0.5">{opening.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          <div className={`grid gap-6 ${platforms.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : platforms.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {platforms.includes('LinkedIn') && (
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <LinkedinIcon size={15} className="text-[#0A66C2]" />
                  <span className="text-sm font-semibold text-[#0A66C2]">LinkedIn</span>
                </div>
                <LinkedInPreview title={opening.title} description={opening.description} positions={opening.no_of_positions} ctc={opening.expected_ctc} closesOn={opening.closes_on} />
              </div>
            )}
            {platforms.includes('Facebook') && (
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <FacebookIcon size={15} className="text-[#1877F2]" />
                  <span className="text-sm font-semibold text-[#1877F2]">Facebook</span>
                </div>
                <FacebookPreview title={opening.title} description={opening.description} positions={opening.no_of_positions} ctc={opening.expected_ctc} closesOn={opening.closes_on} />
              </div>
            )}
            {platforms.includes('Instagram') && (
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <InstagramIcon size={15} className="text-[#C13584]" />
                  <span className="text-sm font-semibold bg-gradient-to-r from-[#f09433] to-[#bc1888] bg-clip-text text-transparent">Instagram</span>
                </div>
                <InstagramPreview title={opening.title} description={opening.description} positions={opening.no_of_positions} ctc={opening.expected_ctc} />
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Platform badge ─────────────────────────────────────────────
const PLATFORM_STYLES = {
  LinkedIn:  { bg: 'bg-[#0A66C2]', icon: LinkedinIcon },
  Facebook:  { bg: 'bg-[#1877F2]', icon: FacebookIcon },
  Instagram: { bg: 'bg-gradient-to-br from-[#f09433] to-[#bc1888]', icon: InstagramIcon },
};

function PlatformBadge({ platform }) {
  const s = PLATFORM_STYLES[platform];
  if (!s) return null;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-[10px] font-medium ${s.bg}`}>
      <Icon size={9} /> {platform}
    </span>
  );
}

// ── Creation modal ─────────────────────────────────────────────
const TABS = ['Details', 'Attachment', 'Social Media'];

function CreateModal({ open, onClose, onSave, toast }) {
  const [tab, setTab] = useState('Details');
  const [form, setForm] = useState({ no_of_positions: 1 });
  const [platforms, setPlatforms] = useState([]);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const f = v => setForm(p => ({ ...p, ...v }));

  const togglePlatform = p => setPlatforms(prev =>
    prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
  );

  const reset = () => { setForm({ no_of_positions: 1 }); setPlatforms([]); setFile(null); setTab('Details'); };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!form.title?.trim()) { setTab('Details'); return toast('Job title is required', 'warning'); }
    setSaving(true);
    try {
      const res = await api('POST', '/api/recruitment/openings', {
        title: form.title,
        no_of_positions: parseInt(form.no_of_positions) || 1,
        expected_ctc: parseFloat(form.expected_ctc) || null,
        closes_on: form.closes_on || null,
        description: form.description || null,
        social_platforms: platforms,
      });
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        await apiForm(`/api/recruitment/openings/${res.id}/attachment`, fd);
      }
      toast('Job opening created', 'success');
      reset(); onSave();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900">New Job Opening</h3>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t}
              {t === 'Social Media' && platforms.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">{platforms.length}</span>
              )}
              {t === 'Attachment' && file && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-100 text-green-600 text-[10px] font-bold">1</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── Details tab ── */}
          {tab === 'Details' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="form-label">Job Title <span className="text-red-500">*</span></label>
                <input className="form-input" value={form.title || ''} onChange={e => f({ title: e.target.value })} placeholder="e.g. Senior React Developer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">No. of Positions</label>
                  <input type="number" className="form-input" value={form.no_of_positions || 1} onChange={e => f({ no_of_positions: e.target.value })} min="1" />
                </div>
                <div>
                  <label className="form-label">Expected CTC (₹)</label>
                  <input type="number" className="form-input" value={form.expected_ctc || ''} onChange={e => f({ expected_ctc: e.target.value })} placeholder="e.g. 800000" />
                </div>
                <div>
                  <label className="form-label">Closes On</label>
                  <input type="date" className="form-input" value={form.closes_on || ''} onChange={e => f({ closes_on: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">Job Description</label>
                <textarea className="form-textarea" rows={5} value={form.description || ''} onChange={e => f({ description: e.target.value })} placeholder="Describe responsibilities, requirements, skills needed…" />
              </div>
            </div>
          )}

          {/* ── Attachment tab ── */}
          {tab === 'Attachment' && (
            <div className="max-w-lg">
              <p className="text-sm text-gray-500 mb-4">Upload the Job Description document (PDF, DOC, DOCX — max 5MB). Applicants can download it when viewing the opening.</p>
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}
              >
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={e => setFile(e.target.files[0] || null)} />
                {file ? (
                  <div>
                    <div className="text-3xl mb-2">📄</div>
                    <div className="font-semibold text-green-700 text-sm">{file.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</div>
                    <button onClick={e => { e.stopPropagation(); setFile(null); }}
                      className="mt-3 text-xs text-red-500 hover:text-red-700 underline">Remove</button>
                  </div>
                ) : (
                  <div>
                    <Paperclip size={32} className="mx-auto text-gray-300 mb-3" />
                    <div className="text-sm font-medium text-gray-600">Click to upload or drag & drop</div>
                    <div className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 5MB</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Social Media tab ── */}
          {tab === 'Social Media' && (
            <div className="flex gap-6">
              {/* Platform selector */}
              <div className="w-52 flex-shrink-0">
                <p className="text-sm font-medium text-gray-700 mb-3">Share on platforms</p>
                <div className="space-y-2">
                  {[
                    { key: 'LinkedIn',  Icon: LinkedinIcon,  color: '#0A66C2', bg: 'hover:bg-[#e8f0fb]', border: 'border-[#0A66C2]' },
                    { key: 'Facebook',  Icon: FacebookIcon,  color: '#1877F2', bg: 'hover:bg-[#e8f0ff]', border: 'border-[#1877F2]' },
                    { key: 'Instagram', Icon: InstagramIcon, color: '#C13584', bg: 'hover:bg-pink-50',    border: 'border-pink-400' },
                  ].map(({ key, Icon, color, bg, border }) => {
                    const on = platforms.includes(key);
                    return (
                      <button key={key} onClick={() => togglePlatform(key)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${on ? `${border} bg-white shadow-sm` : 'border-gray-200 bg-white'} ${bg}`}>
                        <Icon size={18} style={{ color }} />
                        <span className="text-sm font-medium text-gray-700">{key}</span>
                        <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${on ? 'border-current bg-current' : 'border-gray-300'}`} style={on ? { color, borderColor: color, backgroundColor: color } : {}}>
                          {on && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {platforms.length === 0 && (
                  <p className="text-xs text-gray-400 mt-4 leading-relaxed">Select one or more platforms to see a live preview of how the job post will look.</p>
                )}
              </div>

              {/* Live previews */}
              <div className="flex-1 min-w-0">
                {platforms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center text-gray-400">
                    <Share2 size={40} className="mb-3 opacity-30" />
                    <p className="text-sm">Select a platform on the left to see the preview</p>
                  </div>
                ) : (
                  <div className={`grid gap-5 ${platforms.length === 1 ? 'grid-cols-1 max-w-sm' : platforms.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {platforms.includes('LinkedIn') && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <LinkedinIcon size={14} className="text-[#0A66C2]" /><span className="text-xs font-semibold text-[#0A66C2]">LinkedIn</span>
                        </div>
                        <LinkedInPreview title={form.title} description={form.description} positions={+form.no_of_positions || 1} ctc={form.expected_ctc} closesOn={form.closes_on} />
                      </div>
                    )}
                    {platforms.includes('Facebook') && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <FacebookIcon size={14} className="text-[#1877F2]" /><span className="text-xs font-semibold text-[#1877F2]">Facebook</span>
                        </div>
                        <FacebookPreview title={form.title} description={form.description} positions={+form.no_of_positions || 1} ctc={form.expected_ctc} closesOn={form.closes_on} />
                      </div>
                    )}
                    {platforms.includes('Instagram') && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <InstagramIcon size={14} className="text-[#C13584]" /><span className="text-xs font-semibold bg-gradient-to-r from-[#f09433] to-[#bc1888] bg-clip-text text-transparent">Instagram</span>
                        </div>
                        <InstagramPreview title={form.title} description={form.description} positions={+form.no_of_positions || 1} ctc={form.expected_ctc} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <div className="flex items-center gap-2">
            {platforms.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Share2 size={12} />
                <span>Will share to {platforms.join(', ')}</span>
              </div>
            )}
            {file && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-2">
                <Paperclip size={12} />
                <span>{file.name}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? 'Creating…' : 'Create Opening'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Social Accounts Manager modal ────────────────────────────
function SocialAccountsModal({ open, onClose, toast }) {
  const [accounts, setAccounts] = useState([]);
  const [config, setConfig] = useState({});
  const [connecting, setConnecting] = useState('');

  const load = async () => {
    try {
      const [accs, cfg] = await Promise.all([
        api('GET', '/api/social/accounts'),
        api('GET', '/api/social/config'),
      ]);
      setAccounts(accs);
      setConfig(cfg);
    } catch (e) { toast(e.message, 'error'); }
  };

  useEffect(() => { if (open) load(); }, [open]);

  // Listen for OAuth popup result
  useEffect(() => {
    const handler = e => {
      if (e.data?.type === 'social-auth') {
        setConnecting('');
        if (e.data.status === 'success') {
          toast(`${e.data.platform} connected!`, 'success');
          load();
        } else {
          toast(e.data.error || 'Connection failed', 'error');
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const connect = async (platform) => {
    const endpoint = platform === 'LinkedIn' ? '/api/social/auth/linkedin' : '/api/social/auth/facebook';
    try {
      setConnecting(platform);
      const { url } = await api('GET', endpoint);
      const popup = window.open(url, `${platform} Login`, 'width=600,height=700,scrollbars=yes');
      // If popup blocked
      if (!popup) {
        toast('Popup blocked. Please allow popups for this site.', 'warning');
        setConnecting('');
      }
    } catch (e) {
      toast(e.message, 'error');
      setConnecting('');
    }
  };

  const disconnect = async (id, name) => {
    if (!confirm(`Disconnect "${name}"?`)) return;
    try {
      await api('DELETE', `/api/social/accounts/${id}`);
      toast('Account disconnected', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  if (!open) return null;

  const platforms = [
    { key: 'LinkedIn',  Icon: LinkedinIcon,  color: '#0A66C2', authKey: 'LinkedIn',  note: 'Requires LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET env vars' },
    { key: 'Facebook',  Icon: FacebookIcon,  color: '#1877F2', authKey: 'Facebook',  note: 'Requires FACEBOOK_APP_ID + FACEBOOK_APP_SECRET env vars' },
    { key: 'Instagram', Icon: InstagramIcon, color: '#C13584', authKey: 'Facebook',  note: 'Uses same Meta app as Facebook. Connect Facebook first.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Social Media Accounts</h3>
            <p className="text-xs text-gray-400 mt-0.5">Connect accounts to post job openings directly</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-3">
          {platforms.map(({ key, Icon, color, authKey, note }) => {
            const connected = accounts.filter(a => a.platform === key);
            const configured = config[key]?.configured || config[authKey]?.configured;
            const isConnecting = connecting === authKey;

            return (
              <div key={key} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: color + '20', color }}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{key}</div>
                    {!configured && (
                      <div className="text-xs text-amber-600 mt-0.5">{note}</div>
                    )}
                  </div>
                  {configured && connected.length === 0 && (
                    <button
                      onClick={() => connect(authKey)}
                      disabled={!!connecting}
                      className="btn btn-secondary btn-sm"
                      style={!connecting ? { borderColor: color, color } : {}}>
                      {isConnecting ? 'Connecting…' : 'Connect'}
                    </button>
                  )}
                  {!configured && (
                    <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-md">Not configured</span>
                  )}
                </div>

                {connected.length > 0 && connected.map(acc => (
                  <div key={acc.id} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: color }}>
                      {(acc.account_name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{acc.account_name}</div>
                      {acc.page_name && acc.platform === 'Facebook' && (
                        <div className="text-xs text-gray-400">Page: {acc.page_name}</div>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      ✓ Connected
                    </span>
                    <button onClick={() => disconnect(acc.id, acc.account_name)} className="text-red-400 hover:text-red-600 ml-1">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400">
            Set environment variables before connecting. Redirect URI to register in your app:
            <br />
            LinkedIn: <code className="bg-gray-100 px-1 rounded">{config.app_base_url}/api/social/callback/linkedin</code>
            <br />
            Facebook: <code className="bg-gray-100 px-1 rounded">{config.app_base_url}/api/social/callback/facebook</code>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Post Now modal ────────────────────────────────────────────
function PostNowModal({ opening, onClose, toast }) {
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [posting, setPosting] = useState(false);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    Promise.all([
      api('GET', '/api/social/accounts'),
      api('GET', `/api/social/posts/${opening.id}`),
    ]).then(([accs, hist]) => { setAccounts(accs); setHistory(hist); })
      .catch(e => toast(e.message, 'error'));
  }, []);

  const togglePlatform = p => setSelected(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const post = async () => {
    if (!selected.length) return toast('Select at least one platform', 'warning');
    setPosting(true);
    try {
      const res = await api('POST', `/api/social/post/${opening.id}`, { platforms: selected });
      setResults(res.results);
      const failed = res.results.filter(r => r.status === 'failed');
      const posted = res.results.filter(r => r.status === 'posted');
      if (posted.length) toast(`Posted to ${posted.map(r => r.platform).join(', ')}!`, 'success');
      if (failed.length) toast(`Failed: ${failed.map(r => r.platform).join(', ')}`, 'error');
    } catch (e) { toast(e.message, 'error'); }
    finally { setPosting(false); }
  };

  const connectedPlatforms = accounts.map(a => a.platform);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Post to Social Media</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{opening.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-3">
          {results ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-3">Posting results:</p>
              {results.map(r => (
                <div key={r.platform} className={`flex items-start gap-3 p-3 rounded-lg ${r.status === 'posted' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <span className="text-lg">{r.status === 'posted' ? '✅' : '❌'}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{r.platform}</div>
                    {r.status === 'posted' && r.post_url && (
                      <a href={r.post_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">View post →</a>
                    )}
                    {r.error && <div className="text-xs text-red-600 mt-0.5">{r.error}</div>}
                  </div>
                </div>
              ))}
              <button onClick={onClose} className="btn btn-primary w-full mt-2">Done</button>
            </div>
          ) : (
            <>
              {connectedPlatforms.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  <Share2 size={32} className="mx-auto mb-2 text-gray-300" />
                  <p>No social accounts connected yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Use "Social Accounts" to connect LinkedIn, Facebook, or Instagram.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-1">Select platforms to post to:</p>
                  {[
                    { key: 'LinkedIn',  Icon: LinkedinIcon,  color: '#0A66C2' },
                    { key: 'Facebook',  Icon: FacebookIcon,  color: '#1877F2' },
                    { key: 'Instagram', Icon: InstagramIcon, color: '#C13584' },
                  ].map(({ key, Icon, color }) => {
                    const acc = accounts.find(a => a.platform === key);
                    if (!acc) return null;
                    const on = selected.includes(key);
                    return (
                      <button key={key} onClick={() => togglePlatform(key)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${on ? 'shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                        style={on ? { borderColor: color, backgroundColor: color + '08' } : {}}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: color + '20', color }}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">{key}</div>
                          <div className="text-xs text-gray-400">{acc.account_name}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all`}
                          style={on ? { borderColor: color, backgroundColor: color } : { borderColor: '#d1d5db' }}>
                          {on && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}

                  {history.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-2">Post history</p>
                      <div className="space-y-1.5">
                        {history.slice(0, 5).map(h => (
                          <div key={h.id} className="flex items-center gap-2 text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full ${h.status === 'posted' ? 'bg-green-500' : 'bg-red-400'}`} />
                            <span className="text-gray-600">{h.platform}</span>
                            <span className="text-gray-400">{h.posted_at?.slice(0, 10) || '—'}</span>
                            {h.post_url && <a href={h.post_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline ml-auto">View →</a>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
                    <button onClick={post} disabled={posting || !selected.length} className="btn btn-primary flex-1">
                      {posting ? 'Posting…' : `Post Now`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function JobOpenings({ toast }) {
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [previewOpening, setPreviewOpening] = useState(null);
  const [socialAccModal, setSocialAccModal] = useState(false);
  const [postNowOpening, setPostNowOpening] = useState(null);

  const load = async (st = statusFilter) => {
    setLoading(true);
    try {
      let url = '/api/recruitment/openings?';
      if (st) url += `status=${st}`;
      setRows(await api('GET', url));
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const closeOpening = async id => {
    if (!confirm('Close this job opening?')) return;
    try { await api('PUT', `/api/recruitment/openings/${id}/close`); toast('Closed', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const del = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try { await api('DELETE', `/api/recruitment/openings/${id}`); toast('Deleted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Job Openings</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={() => setSocialAccModal(true)} className="btn btn-secondary btn-sm gap-1.5">
            <Share2 size={13} /> Social Accounts
          </button>
          <button onClick={() => setModal(true)} className="btn btn-primary btn-sm gap-1.5"><Plus size={13} /> New Opening</button>
        </div>
      </div>

      <div className="page-content">
        <div className="card mb-4">
          <div className="p-3">
            <select className="form-select w-auto" value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); load(e.target.value); }}>
              <option value="">All Status</option>
              <option>Open</option><option>Closed</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Positions</th>
                  <th>Applicants</th>
                  <th>Attachment</th>
                  <th>Platforms</th>
                  <th>Closes On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📄</div>
                      <p className="text-sm text-gray-500">No job openings yet</p>
                    </div>
                  </td></tr>
                ) : rows.map(j => (
                  <tr key={j.id}>
                    <td>
                      <div className="font-semibold text-gray-900">{j.title}</div>
                      {j.description && <div className="text-xs text-gray-400 mt-0.5">{j.description.substring(0, 60)}{j.description.length > 60 ? '…' : ''}</div>}
                    </td>
                    <td className="text-gray-600">{j.no_of_positions}</td>
                    <td><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{j.applicant_count}</span></td>
                    <td>
                      {j.attachment_url ? (
                        <a href={j.attachment_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                          <Download size={11} />
                          <span className="max-w-[100px] truncate">{j.attachment_name || 'Download'}</span>
                        </a>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td>
                      {j.social_platforms?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {j.social_platforms.map(p => <PlatformBadge key={p} platform={p} />)}
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="text-gray-600">{j.closes_on || '—'}</td>
                    <td><Badge text={j.status} /></td>
                    <td>
                      <div className="flex items-center gap-1 flex-wrap">
                        <button onClick={() => setPostNowOpening(j)} className="btn btn-secondary btn-xs gap-1" title="Post to social media">
                          <Share2 size={11} /> Post
                        </button>
                        {j.social_platforms?.length > 0 && (
                          <button onClick={() => setPreviewOpening(j)} className="btn btn-secondary btn-xs gap-1" title="Social preview">
                            <Eye size={11} /> Preview
                          </button>
                        )}
                        {j.status === 'Open' && (
                          <button onClick={() => closeOpening(j.id)} className="btn btn-secondary btn-xs gap-1"><XCircle size={11} /> Close</button>
                        )}
                        <button onClick={() => del(j.id, j.title)} className="btn btn-danger btn-xs gap-1"><Trash2 size={11} /> Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateModal open={modal} onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} toast={toast} />
      {previewOpening && <SocialPreviewModal opening={previewOpening} onClose={() => setPreviewOpening(null)} />}
      <SocialAccountsModal open={socialAccModal} onClose={() => setSocialAccModal(false)} toast={toast} />
      {postNowOpening && <PostNowModal opening={postNowOpening} onClose={() => setPostNowOpening(null)} toast={toast} />}
    </>
  );
}
