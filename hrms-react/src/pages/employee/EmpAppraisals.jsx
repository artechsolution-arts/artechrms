import { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { fmtDate } from '../../utils/date';
import { Star, Target, ClipboardCheck, Briefcase, Crown,
         ChevronDown, CheckCircle2, Clock, Lock, FileText, Upload, Download, Trash2 } from 'lucide-react';
import Select from '../../components/Select';

// ── Stage metadata ──────────────────────────────────────────────
const STAGES = [
  { key: 'self_eval',     scoreKey: 'self_score',     label: 'Self Evaluation',        icon: Star,           color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20',  border: 'border-purple-200 dark:border-purple-800' },
  { key: 'manager_eval',  scoreKey: 'manager_score',  label: 'Manager Evaluation',     icon: ClipboardCheck, color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20',      border: 'border-blue-200 dark:border-blue-800' },
  { key: 'business_eval', scoreKey: 'business_score', label: 'Business Evaluation',    icon: Briefcase,      color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20',    border: 'border-amber-200 dark:border-amber-800' },
  { key: 'biz_head_eval', scoreKey: 'biz_head_score', label: 'Business Head Approval', icon: Crown,          color: 'text-green-600',   bg: 'bg-green-50 dark:bg-green-900/20',    border: 'border-green-200 dark:border-green-800' },
];

const STATUS_ORDER = ['Goals Set', 'Self Evaluated', 'Manager Evaluated', 'Business Evaluated', 'Completed'];

// ── Score helpers ───────────────────────────────────────────────
function ScoreBar({ score, max = 5 }) {
  if (score === null || score === undefined) return null;
  const pct = Math.min((score / max) * 100, 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-10 text-right">
        {score.toFixed(1)}/5
      </span>
    </div>
  );
}

// ── Eval result view ────────────────────────────────────────────
function EvalResult({ evalData, goals, stage }) {
  const Icon = stage.icon;
  if (!evalData) return null;
  const scoresMap = Object.fromEntries((evalData.scores || []).map(s => [s.idx, s]));
  return (
    <div className={`rounded-xl border p-4 ${stage.bg} ${stage.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={14} className={stage.color} />
          <span className={`text-xs font-semibold ${stage.color}`}>{stage.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 size={12} className="text-green-500" />
          <span className="text-xs text-gray-400">Submitted {evalData.submitted_at?.slice(0, 10)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {(goals || []).map((g, i) => {
          const s = scoresMap[i];
          return (
            <div key={i} className="bg-white/60 dark:bg-gray-800/40 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate pr-2">{g.title}</span>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
                  {s?.score ?? '—'}/5
                </span>
              </div>
              {s?.score !== undefined && <ScoreBar score={parseFloat(s.score)} />}
              {s?.comments && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.comments}</p>}
            </div>
          );
        })}
      </div>

      {evalData.overall_comments && (
        <div className="mt-3 p-3 bg-white/60 dark:bg-gray-800/40 rounded-lg">
          <p className="text-xs text-gray-500 font-medium mb-0.5">Overall Comments</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{evalData.overall_comments}</p>
        </div>
      )}
    </div>
  );
}

// ── Self eval form ──────────────────────────────────────────────
function SelfEvalForm({ appraisal, onSubmit, submitting }) {
  const [scores, setScores] = useState(() =>
    (appraisal.goals || []).map((_, i) => ({ idx: i, score: '', comments: '' }))
  );
  const [overall, setOverall] = useState('');

  const update = (i, field, val) =>
    setScores(prev => prev.map((s, si) => si === i ? { ...s, [field]: val } : s));

  const filled = scores.filter(s => s.score !== '' && s.score !== null);
  const canSubmit = filled.length > 0;

  return (
    <div className="space-y-3 mt-4">
      <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
        Your Self Evaluation
      </p>

      <div className="space-y-3">
        {(appraisal.goals || []).map((g, i) => (
          <div key={i} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{g.title}</p>
                {g.target && <p className="text-xs text-gray-500 mt-0.5">Target: {g.target}</p>}
                <p className="text-xs text-purple-500 mt-0.5">Weightage: {g.weight}%</p>
              </div>
              <Select
                value={scores[i]?.score ?? ''}
                onChange={v => update(i, 'score', v)}
                options={[
                  { value: '1', label: '1 — Poor',          description: 'Needs significant improvement' },
                  { value: '2', label: '2 — Below Average',  description: 'Below expectations' },
                  { value: '3', label: '3 — Average',        description: 'Meets expectations' },
                  { value: '4', label: '4 — Good',           description: 'Exceeds expectations' },
                  { value: '5', label: '5 — Excellent',      description: 'Outstanding performance' },
                ]}
                placeholder="Rate 1-5…"
              />
            </div>
            {scores[i]?.score && <ScoreBar score={parseFloat(scores[i].score)} />}
            <textarea
              className="form-textarea w-full resize-none text-xs"
              rows={2}
              placeholder="Your comments on this goal…"
              value={scores[i]?.comments ?? ''}
              onChange={e => update(i, 'comments', e.target.value)}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Overall Self-Assessment
        </label>
        <textarea
          className="form-textarea w-full resize-none"
          rows={3}
          placeholder="Summarise your overall performance this period…"
          value={overall}
          onChange={e => setOverall(e.target.value)}
        />
      </div>

      <button
        onClick={() => onSubmit({
          scores: filled.map(s => ({ ...s, score: parseFloat(s.score) })),
          overall_comments: overall,
        })}
        disabled={submitting || !canSubmit}
        className="btn btn-primary w-full gap-1.5"
      >
        <Star size={13} />
        {submitting ? 'Submitting…' : 'Submit Self Evaluation'}
      </button>
    </div>
  );
}

// ── Performance Documents ───────────────────────────────────────
function PerfDocuments({ appraisalId, documents, onRefresh, toast }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const token = localStorage.getItem('artech_hrms_token');
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch(`/api/portal/appraisals/${appraisalId}/documents/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed');
      toast('Document uploaded', 'success');
      onRefresh();
    } catch (e) { toast(e.message, 'error'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (docId) => {
    try {
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch(`/api/portal/appraisals/${appraisalId}/documents/${docId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      toast('Document removed', 'success');
      onRefresh();
    } catch (e) { toast(e.message, 'error'); }
  };

  const docs = documents || [];
  const fmt = iso => { try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return iso; } };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={11} /> Performance Documents ({docs.length})
        </p>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="btn btn-secondary btn-xs gap-1.5">
          <Upload size={11} /> {uploading ? 'Uploading…' : 'Upload Doc'}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png,.xlsx,.pptx" className="hidden" onChange={handleUpload} />
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-6 text-sm text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <FileText size={28} className="mx-auto mb-2 opacity-30" />
          No documents uploaded yet
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
                <p className="text-xs text-gray-400 mt-0.5">{doc.type} · {fmt(doc.uploaded_at)}</p>
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
    </div>
  );
}

// ── Single appraisal card ───────────────────────────────────────
function AppraisalCard({ appraisal, onSelfEval, toast }) {
  const [expanded,   setExpanded]   = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const stageIdx   = STATUS_ORDER.indexOf(appraisal.status);
  const canSelfEval = appraisal.status === 'Goals Set';
  const isCompleted = appraisal.status === 'Completed';

  const handleSelfEval = async (data) => {
    setSubmitting(true);
    try {
      await api('PUT', `/api/portal/appraisals/${appraisal.id}/self-eval`, data);
      setShowForm(false);
      onSelfEval();
    } catch (e) {
      // surface error via parent
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  const completedStages = STAGES.filter(s => appraisal[s.key]);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-start justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{appraisal.period}</p>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
              appraisal.status === 'Completed'          ? 'bg-green-50 text-green-700 border-green-200' :
              appraisal.status === 'Goals Set'          ? 'bg-blue-50 text-blue-700 border-blue-200' :
              appraisal.status === 'Self Evaluated'     ? 'bg-purple-50 text-purple-700 border-purple-200' :
              appraisal.status === 'Manager Evaluated'  ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-orange-50 text-orange-700 border-orange-200'
            }`}>
              {appraisal.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{(appraisal.goals || []).length} goals · {fmtDate(appraisal.created_at)}</p>

          {/* Stage progress */}
          <div className="flex items-center gap-1 mt-2">
            {STAGES.map((s, i) => {
              const done = !!appraisal[s.key];
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex items-center gap-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    done ? 'bg-green-500' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Icon size={10} className={done ? 'text-white' : 'text-gray-400'} />
                  </div>
                  {i < 3 && <div className={`w-4 h-px ${done && !!appraisal[STAGES[i+1]?.key] ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-3 flex-shrink-0">
          {appraisal.total_score > 0 && (
            <div className="text-right">
              <p className="text-xl font-bold text-[var(--accent)]">{appraisal.total_score.toFixed(1)}</p>
              <p className="text-xs text-gray-400">/ 5</p>
            </div>
          )}
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 space-y-4">

          {/* Goals */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Target size={11} /> Goals
            </p>
            <div className="space-y-1.5">
              {(appraisal.goals || []).map((g, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                  <div className="flex-1">
                    <p className="text-gray-700 dark:text-gray-300">{g.title}</p>
                    {g.target && <p className="text-xs text-gray-400">Target: {g.target}</p>}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{g.weight}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Self eval action */}
          {canSelfEval && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-800 text-sm font-medium text-purple-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <Star size={14} /> Start Self Evaluation
            </button>
          )}

          {canSelfEval && showForm && (
            <SelfEvalForm
              appraisal={appraisal}
              onSubmit={handleSelfEval}
              submitting={submitting}
            />
          )}

          {/* Awaiting self eval message */}
          {canSelfEval && !showForm && (
            <p className="text-center text-xs text-gray-400">
              HR has set your goals. Complete your self-evaluation to proceed.
            </p>
          )}

          {/* Stage evaluations (read-only) */}
          {completedStages.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Evaluations</p>
              {STAGES.map(s => appraisal[s.key] ? (
                <EvalResult key={s.key} evalData={appraisal[s.key]} goals={appraisal.goals} stage={s} />
              ) : null)}
            </div>
          )}

          {/* Pending stages */}
          {!isCompleted && (
            <div className="space-y-1.5">
              {STAGES.filter(s => !appraisal[s.key] && appraisal.status !== 'Goals Set').map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <Lock size={11} className="text-gray-300" />
                    <Icon size={11} className="text-gray-400" />
                    <span className="text-xs text-gray-400">{s.label} — pending</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Performance Documents */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <PerfDocuments
              appraisalId={appraisal.id}
              documents={appraisal.perf_documents}
              onRefresh={onSelfEval}
              toast={toast}
            />
          </div>

          {/* Overall score for completed */}
          {isCompleted && appraisal.total_score > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Final Score
              </p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-green-700 dark:text-green-400">{appraisal.total_score.toFixed(1)}</span>
                <span className="text-sm text-gray-500 mb-1">/ 5.0</span>
              </div>
              <ScoreBar score={appraisal.total_score} />
              <p className="text-xs text-gray-500 mt-2">Average of all 4 evaluation stages</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────
export default function EmpAppraisals({ toast }) {
  const [appraisals, setAppraisals] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const load = () => {
    setLoading(true);
    api('GET', '/api/portal/appraisals')
      .then(setAppraisals)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSelfEval = async (appraisalId, data) => {
    try {
      await api('PUT', `/api/portal/appraisals/${appraisalId}/self-eval`, data);
      toast('Self evaluation submitted successfully', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const pending = appraisals.filter(a => a.status === 'Goals Set').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Appraisals</h1>
          {pending > 0 && (
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5 font-medium">
              {pending} pending self-evaluation{pending > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="page-content space-y-4">
        {loading ? (
          <div className="card p-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : appraisals.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Star size={36} className="text-gray-200 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-500">No appraisals yet</p>
              <p className="text-xs text-gray-400 mt-1">Your performance reviews will appear here once HR creates one</p>
            </div>
          </div>
        ) : appraisals.map(a => (
          <AppraisalCard
            key={a.id}
            appraisal={a}
            onSelfEval={load}
            toast={toast}
          />
        ))}
      </div>
    </>
  );
}
