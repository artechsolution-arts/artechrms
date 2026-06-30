import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import Select from '../components/Select';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, RefreshCw, Trash2, Target, Star, ClipboardCheck,
         Crown, Eye, X, FileText, Upload, Download, Lock, CalendarDays, Pencil } from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────
const STATUS_ORDER = ['Goals Set', 'Self Evaluated', 'Manager Evaluated', 'CEO Evaluated', 'Completed'];

// Backend may return 'Business Evaluated' for CEO stage — treat as alias
const DISPLAY_STATUS = s => s === 'Business Evaluated' ? 'CEO Evaluated' : s;

const STATUS_STYLE = {
  'Goals Set':         'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  'Self Evaluated':    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  'Manager Evaluated': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  'CEO Evaluated':     'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  'Business Evaluated':'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  'Completed':         'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
};

// 3-stage evaluation: Self → Manager → CEO
const STAGE_META = [
  { key: 'self_eval',    scoreKey: 'self_score',    label: 'Self Evaluation',    icon: Star,           who: 'Employee',      action: null },
  { key: 'manager_eval', scoreKey: 'manager_score', label: 'Manager Evaluation', icon: ClipboardCheck, who: 'Manager / HR',  action: 'manager-eval' },
  { key: 'ceo_eval',     scoreKey: 'ceo_score',     label: 'CEO Evaluation',     icon: Crown,          who: 'CEO',           action: 'ceo-eval', roles: ['CEO', 'SuperAdmin'] },
];

// Cycle helpers
const CYCLE_TYPES = [
  { value: 'Annual',    label: 'Annual',    desc: 'Jun – May (12 months)' },
  { value: 'Mid-Year',  label: 'Mid-Year',  desc: 'Jun – Nov (6 months)'  },
];

function computePeriod(cycleType, fyYear) {
  const y = parseInt(fyYear);
  const fy = `FY${y}-${String(y + 1).slice(2)}`;
  if (cycleType === 'Annual')    return `Annual ${fy}`;
  if (cycleType === 'Mid-Year') return `Mid-Year ${fy}`;
  return `${cycleType} ${fy}`;
}

function cycleRange(cycleType, fyYear) {
  const y = parseInt(fyYear);
  if (cycleType === 'Annual')    return `1 Jun ${y} – 31 May ${y + 1}`;
  if (cycleType === 'Mid-Year') return `1 Jun ${y} – 30 Nov ${y}`;
  return '';
}

// ── Score display ───────────────────────────────────────────────
function ScorePill({ score }) {
  if (score === null || score === undefined) return <span className="text-xs text-gray-300 dark:text-gray-600">—</span>;
  const pct = (score / 5) * 100;
  const color = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-blue-600' : pct >= 40 ? 'text-amber-600' : 'text-red-500';
  return <span className={`text-xs font-bold ${color}`}>{score.toFixed(1)}<span className="text-gray-400 font-normal">/5</span></span>;
}

function ScoreBar({ score, max = 5 }) {
  if (score === null || score === undefined) return null;
  const pct = Math.min((score / max) * 100, 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-8 text-right">{score.toFixed(1)}</span>
    </div>
  );
}

// ── Eval view (read-only) ───────────────────────────────────────
function EvalView({ evalData, goals }) {
  if (!evalData) return <p className="text-xs text-gray-400 italic">Not submitted yet</p>;
  const scoresMap = Object.fromEntries((evalData.scores || []).map(s => [s.idx, s]));
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {(goals || []).map((g, i) => {
          const s = scoresMap[i];
          return (
            <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-start justify-between gap-3 mb-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{g.title}</span>
                <span className="text-xs font-bold text-[var(--accent)] flex-shrink-0">
                  {s?.score ?? '—'}<span className="text-gray-400 font-normal">/5</span>
                </span>
              </div>
              {s?.score !== undefined && <ScoreBar score={parseFloat(s.score)} />}
              {s?.comments && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{s.comments}</p>}
            </div>
          );
        })}
      </div>
      {evalData.overall_comments && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Overall Comments</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{evalData.overall_comments}</p>
        </div>
      )}
      {evalData.submitted_at && (
        <p className="text-xs text-gray-400">Submitted {evalData.submitted_at?.slice(0, 10)}{evalData.submitted_by ? ` by ${evalData.submitted_by}` : ''}</p>
      )}
    </div>
  );
}

// ── Eval form (editable) ────────────────────────────────────────
function EvalForm({ goals, onSubmit, submitting }) {
  const [scores, setScores] = useState(() =>
    (goals || []).map((_, i) => ({ idx: i, score: '', comments: '' }))
  );
  const [overall, setOverall] = useState('');

  const update = (i, field, val) => {
    setScores(prev => prev.map((s, si) => si === i ? { ...s, [field]: val } : s));
  };

  const handleSubmit = () => {
    const filled = scores.filter(s => s.score !== '' && s.score !== null);
    if (filled.length === 0) return;
    onSubmit({ scores: filled.map(s => ({ ...s, score: parseFloat(s.score) })), overall_comments: overall });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {(goals || []).map((g, i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{g.title}</p>
                {g.target && <p className="text-xs text-gray-400 mt-0.5">Target: {g.target}</p>}
                <p className="text-xs text-gray-400">Weight: {g.weight}%</p>
              </div>
              <div className="flex-shrink-0">
                <Select
                  value={scores[i]?.score ?? ''}
                  onChange={v => update(i, 'score', v)}
                  options={[
                    { value: '', label: '—' },
                    { value: '1', label: '1 – Poor' },
                    { value: '2', label: '2 – Below Average' },
                    { value: '3', label: '3 – Average' },
                    { value: '4', label: '4 – Good' },
                    { value: '5', label: '5 – Excellent' },
                  ]}
                  placeholder="—"
                  size="sm"
                  className="w-36"
                />
              </div>
            </div>
            <input
              className="form-input text-xs py-1.5 w-full"
              placeholder="Comments for this goal…"
              value={scores[i]?.comments ?? ''}
              onChange={e => update(i, 'comments', e.target.value)}
            />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Overall Comments</label>
        <textarea
          className="form-textarea w-full resize-none text-sm"
          rows={3}
          placeholder="Overall evaluation summary…"
          value={overall}
          onChange={e => setOverall(e.target.value)}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={submitting || scores.every(s => s.score === '' || s.score === null)}
        className="btn btn-primary w-full gap-1.5"
      >
        {submitting ? 'Submitting…' : 'Submit Evaluation'}
      </button>
    </div>
  );
}

// ── Performance Documents ───────────────────────────────────────
function PerfDocuments({ appraisalId, documents, onRefresh, toast, isHR }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const token = localStorage.getItem('artech_hrms_token');
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch(`/api/appraisals/${appraisalId}/documents/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed');
      toast('Document uploaded', 'success');
      onRefresh();
    } catch (e) { toast(e.message, 'error'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (docId) => {
    setConfirmDialog({
      title: 'Remove Document',
      message: 'Remove this document?',
      confirmLabel: 'Remove',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await api('DELETE', `/api/appraisals/${appraisalId}/documents/${docId}`);
          toast('Document removed', 'success');
          onRefresh();
        } catch (e) { toast(e.message, 'error'); }
      }
    });
    return;
  };

  const docs = documents || [];
  const fmt = iso => { try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return iso; } };

  return (
    <div className="space-y-4">
      {isHR && (
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 px-4 py-3 flex items-start gap-3">
          <Upload size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">HR: Document Upload</p>
            <p className="text-xs text-blue-500 dark:text-blue-500 mt-0.5">Upload performance-related documents (offer letters, certificates, achievement records). HR does not submit an evaluation rating.</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{docs.length} Document{docs.length !== 1 ? 's' : ''}</p>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="btn btn-primary btn-xs gap-1.5">
          <Upload size={11} /> {uploading ? 'Uploading…' : 'Upload Document'}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png,.xlsx,.pptx" className="hidden" onChange={handleUpload} />
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">
          <FileText size={32} className="mx-auto mb-2 opacity-30" />
          No documents yet. Upload PDFs, Word docs, or images.
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <FileText size={14} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{doc.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{doc.uploaded_by} · {fmt(doc.uploaded_at)}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a href={doc.url} download target="_blank" rel="noreferrer"
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 transition-colors">
                  <Download size={13} />
                </a>
                <button onClick={() => handleDelete(doc.id)}
                  className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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

// ── Detail Modal ────────────────────────────────────────────────
function AppraisalDetail({ appraisal, onClose, onRefresh, toast }) {
  const [detail, setDetail]         = useState(null);
  const [activeTab, setActiveTab]   = useState('goals');
  const [submitting, setSubmitting] = useState(false);
  const [editGoals, setEditGoals]   = useState(false);
  const [editGoalsList, setEditGoalsList] = useState([]);
  const [savingGoals, setSavingGoals]     = useState(false);

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('artech_hrms_user') || '{}'); } catch { return {}; } })();
  const userRole = currentUser.role || '';
  const isHR = userRole === 'HR' || userRole === 'SuperAdmin';

  const displayStatus = DISPLAY_STATUS(appraisal.status);

  const loadDetail = useCallback(async () => {
    try {
      const d = await api('GET', `/api/appraisals/${appraisal.id}`);
      setDetail(d);
    } catch (e) { toast(e.message, 'error'); }
  }, [appraisal.id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const submitEval = async (stageAction, evalData) => {
    setSubmitting(true);
    try {
      await api('PUT', `/api/appraisals/${appraisal.id}/${stageAction}`, evalData);
      toast('Evaluation submitted successfully', 'success');
      await loadDetail();
      onRefresh();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  // sequential action for current status
  const sequentialActionMap = {
    'Self Evaluated':    STAGE_META.find(s => s.key === 'manager_eval'),
    'Manager Evaluated': STAGE_META.find(s => s.key === 'ceo_eval'),
  };

  const tabs = [
    { key: 'goals',     label: 'Goals',         icon: Target },
    { key: 'documents', label: 'Documents',      icon: FileText },
    { key: 'evaluation',label: 'Evaluation',     icon: ClipboardCheck },
  ];

  if (!detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-white">{appraisal.employee_name}</p>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
              <CalendarDays size={11} />
              {appraisal.period}
              {appraisal.designation && <span className="text-gray-300 dark:text-gray-600">·</span>}
              {appraisal.designation}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge text={displayStatus} />
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Score summary — 3 stages */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 bg-gray-50 dark:bg-gray-800/50">
          {STAGE_META.map(s => (
            <div key={s.key} className="px-3 py-2.5 text-center">
              <p className="text-[10px] text-gray-400 mb-1 font-medium">{s.label.replace(' Evaluation', '')}</p>
              <ScorePill score={detail[s.scoreKey]} />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 px-1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors
                  ${activeTab === t.key
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── GOALS ── */}
          {activeTab === 'goals' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {(detail.goals || []).length} Goals · Total weight: {(editGoals ? editGoalsList : detail.goals || []).reduce((s, g) => s + (parseFloat(g.weight) || 0), 0)}%
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[displayStatus] || ''}`}>
                    {displayStatus}
                  </span>
                  {displayStatus === 'Goals Set' && !editGoals && (
                    <button
                      onClick={() => { setEditGoalsList(JSON.parse(JSON.stringify(detail.goals || []))); setEditGoals(true); }}
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors">
                      <Pencil size={10} /> Edit Goals
                    </button>
                  )}
                  {editGoals && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={async () => {
                          const valid = editGoalsList.filter(g => g.title?.trim());
                          if (!valid.length) return toast('Add at least one goal', 'warning');
                          setSavingGoals(true);
                          try {
                            await api('PUT', `/api/appraisals/${appraisal.id}/goals`, {
                              goals: valid.map(g => ({ title: g.title.trim(), weight: parseFloat(g.weight) || 10, target: g.target || '' }))
                            });
                            toast('Goals updated', 'success');
                            setEditGoals(false);
                            await loadDetail();
                            onRefresh();
                          } catch (e) { toast(e.message, 'error'); }
                          finally { setSavingGoals(false); }
                        }}
                        disabled={savingGoals}
                        className="text-xs px-2 py-0.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity">
                        {savingGoals ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditGoals(false)} className="text-xs px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {editGoals ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_70px_120px_28px] gap-2 px-1 mb-1">
                    <p className="text-[10px] text-gray-400">Goal title</p>
                    <p className="text-[10px] text-gray-400 text-center">Weight %</p>
                    <p className="text-[10px] text-gray-400">Target / KPI</p>
                  </div>
                  {editGoalsList.map((g, i) => (
                    <div key={i} className="grid grid-cols-[1fr_70px_120px_28px] gap-2 items-center">
                      <input className="form-input text-sm" value={g.title} onChange={e => setEditGoalsList(prev => prev.map((x, xi) => xi === i ? { ...x, title: e.target.value } : x))} placeholder={`Goal ${i+1}`} />
                      <input type="number" className="form-input text-sm text-center" min={1} max={100} value={g.weight} onChange={e => setEditGoalsList(prev => prev.map((x, xi) => xi === i ? { ...x, weight: e.target.value } : x))} />
                      <input className="form-input text-sm" value={g.target || ''} onChange={e => setEditGoalsList(prev => prev.map((x, xi) => xi === i ? { ...x, target: e.target.value } : x))} placeholder="Target / KPI" />
                      <button type="button" onClick={() => setEditGoalsList(prev => prev.filter((_, xi) => xi !== i))} className="flex items-center justify-center w-7 h-9 text-gray-300 hover:text-red-400 transition-colors"><X size={13} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setEditGoalsList(prev => [...prev, { title: '', weight: 10, target: '' }])} className="btn btn-secondary btn-sm w-full gap-1.5 mt-1">
                    <Plus size={12} /> Add Goal
                  </button>
                </div>
              ) : (detail.goals || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No goals set yet</p>
              ) : (
                detail.goals.map((g, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="w-7 h-7 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{g.title}</p>
                      {g.target && <p className="text-xs text-gray-500 mt-1">Target: {g.target}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-[var(--accent)]">{g.weight}%</span>
                      <p className="text-[10px] text-gray-400">weight</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── DOCUMENTS ── */}
          {activeTab === 'documents' && (
            <PerfDocuments
              appraisalId={appraisal.id}
              documents={detail.perf_documents}
              onRefresh={loadDetail}
              toast={toast}
              isHR={isHR}
            />
          )}

          {/* ── EVALUATION ── */}
          {activeTab === 'evaluation' && (
            <div className="space-y-4">
              {/* HR notice — no eval form for HR */}
              {isHR && userRole === 'HR' && (
                <div className="rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 px-4 py-3 flex items-start gap-3">
                  <FileText size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">HR does not submit an evaluation rating. Use the <strong>Documents</strong> tab to upload supporting files.</p>
                </div>
              )}

              {STAGE_META.map(stage => {
                const evalData    = detail[stage.key];
                const isSubmitted = !!evalData;

                // Can this user submit this stage?
                let canSubmit = false;
                if (stage.action) {
                  if (stage.roles) {
                    canSubmit = stage.roles.some(r => userRole === r);
                  } else {
                    // Sequential: only when the previous stage's status is reached
                    const requiredStatus = stage.key === 'manager_eval' ? 'Self Evaluated' : null;
                    canSubmit = requiredStatus ? appraisal.status === requiredStatus : false;
                  }
                }

                return (
                  <div key={stage.key} className={`rounded-xl border overflow-hidden ${isSubmitted ? 'border-green-100 dark:border-green-900/30' : 'border-gray-100 dark:border-gray-800'}`}>
                    <div className={`flex items-center justify-between px-4 py-3 ${isSubmitted ? 'bg-green-50 dark:bg-green-900/10' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                      <div className="flex items-center gap-2">
                        <stage.icon size={13} className={isSubmitted ? 'text-green-600' : 'text-gray-400'} />
                        <span className={`text-xs font-semibold ${isSubmitted ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>{stage.label}</span>
                        <span className="text-[10px] text-gray-400">— {stage.who}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSubmitted && <ScorePill score={detail[stage.scoreKey]} />}
                        {stage.roles && !isSubmitted && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                            {stage.roles.filter(r => r !== 'SuperAdmin').join(' / ')} only
                          </span>
                        )}
                        {!canSubmit && !isSubmitted && !stage.roles && stage.key !== 'self_eval' && (
                          <span className="text-[10px] text-gray-300 flex items-center gap-1"><Lock size={9} /> Pending</span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      {isSubmitted ? (
                        <EvalView evalData={evalData} goals={detail.goals} />
                      ) : canSubmit ? (
                        <EvalForm
                          goals={detail.goals}
                          submitting={submitting}
                          onSubmit={data => submitEval(stage.action, data)}
                        />
                      ) : (
                        <p className="text-xs text-gray-400 italic py-2">Not submitted yet</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────
const STATUS_TABS = ['All', ...STATUS_ORDER];

// FY year options (current FY ± 2)
function fyYearOptions() {
  const thisYear = new Date().getFullYear();
  const thisMonth = new Date().getMonth(); // 0-indexed
  const currentFY = thisMonth >= 5 ? thisYear : thisYear - 1; // June = month 5
  return [-1, 0, 1, 2].map(offset => {
    const y = currentFY + offset;
    return { value: String(y), label: `FY ${y}–${String(y + 1).slice(2)}` };
  });
}

export default function Appraisals({ toast }) {
  const [rows,      setRows]      = useState([]);
  const [emps,      setEmps]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('All');
  const [detail,    setDetail]    = useState(null);
  const [newOpen,   setNewOpen]   = useState(false);
  const [cycleType, setCycleType] = useState('Annual');
  const [fyYear,    setFyYear]    = useState(() => {
    const m = new Date().getMonth();
    const y = new Date().getFullYear();
    return String(m >= 5 ? y : y - 1);
  });
  const [empId,     setEmpId]     = useState('');
  const [goals,     setGoals]     = useState([
    { title: '', weight: 25, target: '' },
    { title: '', weight: 25, target: '' },
    { title: '', weight: 25, target: '' },
    { title: '', weight: 25, target: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [appraisals, employees] = await Promise.all([
        api('GET', '/api/appraisals'),
        api('GET', '/api/employees?all=true'),
      ]);
      setRows(appraisals);
      setEmps(employees);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const filtered = tab === 'All' ? rows : rows.filter(r => DISPLAY_STATUS(r.status) === tab);

  const updateGoal = (i, field, val) => {
    setGoals(prev => prev.map((g, gi) => gi === i ? { ...g, [field]: val } : g));
    if (field === 'title' && val.trim()) setFormErrors(prev => ({ ...prev, goals: undefined }));
  };
  const addGoal = () => setGoals(prev => [...prev, { title: '', weight: 10, target: '' }]);
  const removeGoal = i => setGoals(prev => prev.filter((_, gi) => gi !== i));
  const totalWeight = goals.reduce((s, g) => s + (parseFloat(g.weight) || 0), 0);

  const save = async () => {
    const errors = {};
    if (!empId) errors.employee_id = 'Please select an employee';
    const validGoals = goals.filter(g => g.title.trim());
    if (validGoals.length === 0) errors.goals = 'Add at least one goal with a title';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    const period = computePeriod(cycleType, fyYear);
    setSaving(true);
    try {
      await api('POST', '/api/appraisals', {
        employee_id: parseInt(empId),
        period,
        goals: validGoals,
      });
      toast('Appraisal created', 'success');
      setNewOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const del = async (id, e) => {
    e.stopPropagation();
    setConfirmDialog({
      title: 'Delete Appraisal',
      message: 'Delete this appraisal? This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try { await api('DELETE', `/api/appraisals/${id}`); toast('Deleted', 'success'); load(); }
        catch (e) { toast(e.message, 'error'); }
      }
    });
    return;
  };

  const PIPELINE_STAGES = [
    { status: 'Goals Set',         icon: Target,        color: 'text-blue-500' },
    { status: 'Self Evaluated',    icon: Star,          color: 'text-purple-500' },
    { status: 'Manager Evaluated', icon: ClipboardCheck,color: 'text-amber-500' },
    { status: 'CEO Evaluated',     icon: Crown,         color: 'text-orange-500' },
    { status: 'Completed',         icon: Star,          color: 'text-green-500' },
  ];

  const tabCount = s => s === 'All' ? rows.length : rows.filter(r => DISPLAY_STATUS(r.status) === s).length;
  const period = computePeriod(cycleType, fyYear);
  const range  = cycleRange(cycleType, fyYear);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Appraisals</h1>
          <p className="text-xs text-gray-400 mt-0.5">Self · Manager · CEO — Annual & Mid-Year cycles (June – May)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={() => {
            setEmpId('');
            setCycleType('Annual');
            setFyYear(() => {
              const m = new Date().getMonth();
              const y = new Date().getFullYear();
              return String(m >= 5 ? y : y - 1);
            });
            setGoals([
              { title: '', weight: 25, target: '' },
              { title: '', weight: 25, target: '' },
              { title: '', weight: 25, target: '' },
              { title: '', weight: 25, target: '' },
            ]);
            setFormErrors({});
            setNewOpen(true);
          }} className="btn btn-primary btn-sm gap-1.5">
            <Plus size={13} /> New Appraisal
          </button>
        </div>
      </div>

      <div className="page-content space-y-4">

        {/* Pipeline */}
        <div className="card p-3">
          <div className="flex items-center gap-0 overflow-x-auto">
            {PIPELINE_STAGES.map((s, i) => {
              const count = rows.filter(r => DISPLAY_STATUS(r.status) === s.status).length;
              const Icon = s.icon;
              const active = tab === s.status;
              return (
                <div key={s.status} className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => setTab(s.status)}
                    className={`flex flex-col items-center px-4 py-2 rounded-lg transition-all text-center ${
                      active ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon size={14} className={`mb-1 ${active ? '' : s.color}`} />
                    <span className="text-[11px] font-medium whitespace-nowrap">{s.status}</span>
                    <span className={`mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold min-w-[18px] ${
                      active ? 'bg-[var(--accent)] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>{count}</span>
                  </button>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <div className="w-5 h-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                  )}
                </div>
              );
            })}
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setTab('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tab === 'All' ? 'bg-[var(--accent)] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700'
                }`}
              >
                All ({rows.length})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th className="text-center">Self</th>
                  <th className="text-center">Manager</th>
                  <th className="text-center">CEO</th>
                  <th className="text-center">Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <Star size={32} className="text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">No appraisals found</p>
                    </div>
                  </td></tr>
                ) : filtered.map(a => {
                  const ds = DISPLAY_STATUS(a.status);
                  return (
                    <tr key={a.id} className="cursor-pointer" onClick={() => setDetail(a)}>
                      <td>
                        <p className="font-semibold text-gray-900 dark:text-white">{a.employee_name}</p>
                        {a.designation && <p className="text-xs text-gray-400">{a.designation}</p>}
                      </td>
                      <td className="text-gray-600 dark:text-gray-400 text-xs">{a.period}</td>
                      <td>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[ds] || ''}`}>
                          {ds}
                        </span>
                      </td>
                      <td className="text-center"><ScorePill score={a.self_score} /></td>
                      <td className="text-center"><ScorePill score={a.manager_score} /></td>
                      <td className="text-center"><ScorePill score={a.ceo_score} /></td>
                      <td className="text-center">
                        {a.total_score > 0
                          ? <span className="text-sm font-bold text-[var(--accent)]">{a.total_score.toFixed(1)}</span>
                          : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setDetail(a)} className="btn-action">
                            <Eye size={11} />
                            {ds === 'Goals Set' ? 'View' : ds === 'Completed' ? 'View' : 'Evaluate'}
                          </button>
                          <button onClick={e => del(a.id, e)} className="btn-delete">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <AppraisalDetail
          appraisal={detail}
          onClose={() => setDetail(null)}
          onRefresh={() => { load(); setDetail(null); }}
          toast={toast}
        />
      )}

      {/* New Appraisal modal */}
      <Modal
        open={newOpen}
        title="New Appraisal"
        onClose={() => setNewOpen(false)}
        onSave={save}
        saving={saving}
        saveLabel="Create Appraisal"
      >
        <FormSection title="Appraisal Cycle">
          {/* Cycle type buttons */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Evaluation Type</p>
              <div className="grid grid-cols-3 gap-2">
                {CYCLE_TYPES.map(ct => (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => setCycleType(ct.value)}
                    className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                      cycleType === ct.value
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-xs font-semibold">{ct.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{ct.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* FY year selector */}
            <FormGrid>
              <Field label="Fiscal Year">
                <Select
                  value={fyYear}
                  onChange={v => setFyYear(v)}
                  options={fyYearOptions()}
                />
              </Field>
              <Field label="Period (auto-computed)">
                <div className="form-input bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-default select-none">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{period}</p>
                  {range && <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1"><CalendarDays size={10} />{range}</p>}
                </div>
              </Field>
            </FormGrid>
          </div>
        </FormSection>

        <FormSection title="Employee">
          <Field label="Select Employee" required error={formErrors.employee_id}>
            <Select
              value={empId || ''}
              onChange={v => { setEmpId(v); if (v) setFormErrors(prev => ({ ...prev, employee_id: undefined })); }}
              options={[{ value: '', label: 'Select Employee' }, ...emps.map(e => ({ value: String(e.id), label: e.full_name }))]}
              placeholder="Select Employee"
              searchable
            />
          </Field>
        </FormSection>

        <FormSection title="Goals / KRAs">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400">Define goals with weightage. Total must be 100%.</p>
              <span className={`text-xs font-semibold ${Math.abs(totalWeight - 100) < 0.1 ? 'text-green-600' : 'text-amber-500'}`}>
                {totalWeight.toFixed(0)}% / 100%
              </span>
            </div>
            <div className="grid grid-cols-[1fr_70px_120px_28px] gap-2 px-0 mb-1">
              <p className="text-[10px] text-gray-400">Goal title</p>
              <p className="text-[10px] text-gray-400 text-center">Weight %</p>
              <p className="text-[10px] text-gray-400">Target / KPI</p>
            </div>
            {goals.map((g, i) => (
              <div key={i} className="grid grid-cols-[1fr_70px_120px_28px] gap-2 items-start">
                <input
                  className="form-input text-sm"
                  placeholder={`Goal ${i + 1}`}
                  value={g.title}
                  onChange={e => updateGoal(i, 'title', e.target.value)}
                />
                <input
                  type="number" min={1} max={100}
                  className="form-input text-sm text-center"
                  value={g.weight}
                  onChange={e => updateGoal(i, 'weight', parseFloat(e.target.value) || 0)}
                />
                <input
                  className="form-input text-sm"
                  placeholder="Target / KPI"
                  value={g.target}
                  onChange={e => updateGoal(i, 'target', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeGoal(i)}
                  className="flex items-center justify-center w-7 h-9 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addGoal}
              className="btn btn-secondary btn-sm w-full gap-1.5 mt-1"
            >
              <Plus size={12} /> Add Goal
            </button>
            {formErrors.goals && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{formErrors.goals}</p>
            )}
          </div>
        </FormSection>
      </Modal>
      <ConfirmModal
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        danger={confirmDialog?.danger}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </>
  );
}
