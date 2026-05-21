import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import { Plus, RefreshCw, Trash2, ChevronDown, Target, Star, ClipboardCheck,
         Briefcase, Crown, Eye, X } from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────
const STATUS_ORDER = ['Goals Set', 'Self Evaluated', 'Manager Evaluated', 'Business Evaluated', 'Completed'];

const STATUS_STYLE = {
  'Goals Set':           'bg-blue-50 text-blue-700 border-blue-200',
  'Self Evaluated':      'bg-purple-50 text-purple-700 border-purple-200',
  'Manager Evaluated':   'bg-amber-50 text-amber-700 border-amber-200',
  'Business Evaluated':  'bg-orange-50 text-orange-700 border-orange-200',
  'Completed':           'bg-green-50 text-green-700 border-green-200',
};

const STAGE_META = [
  { key: 'self_eval',     scoreKey: 'self_score',     label: 'Self Evaluation',           icon: Star,          who: 'Employee',       action: null },
  { key: 'manager_eval',  scoreKey: 'manager_score',  label: 'Manager Evaluation',        icon: ClipboardCheck, who: 'Manager/HR',    action: 'manager-eval' },
  { key: 'business_eval', scoreKey: 'business_score', label: 'Business Evaluation',       icon: Briefcase,     who: 'Business Reviewer', action: 'business-eval' },
  { key: 'biz_head_eval', scoreKey: 'biz_head_score', label: 'Business Head Approval',    icon: Crown,         who: 'Business Head',  action: 'biz-head-eval' },
];

function statusIndex(status) {
  return STATUS_ORDER.indexOf(status);
}

// ── Score display ───────────────────────────────────────────────
function ScorePill({ score }) {
  if (score === null || score === undefined) return <span className="text-xs text-gray-300">—</span>;
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
                <select
                  className="form-select text-xs py-1 px-2 w-20"
                  value={scores[i]?.score ?? ''}
                  onChange={e => update(i, 'score', e.target.value)}
                >
                  <option value="">—</option>
                  {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}/5</option>)}
                </select>
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

// ── Detail Modal ────────────────────────────────────────────────
function AppraisalDetail({ appraisal, onClose, onRefresh, toast }) {
  const [detail, setDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('goals');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api('GET', `/api/appraisals/${appraisal.id}`)
      .then(setDetail)
      .catch(e => toast(e.message, 'error'));
  }, [appraisal.id]);

  const currentStageIdx = statusIndex(appraisal.status);

  const submitEval = async (stageAction, evalData) => {
    setSubmitting(true);
    try {
      await api('PUT', `/api/appraisals/${appraisal.id}/${stageAction}`, evalData);
      toast('Evaluation submitted', 'success');
      const updated = await api('GET', `/api/appraisals/${appraisal.id}`);
      setDetail(updated);
      onRefresh();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const tabs = [
    { key: 'goals', label: 'Goals', icon: Target },
    ...STAGE_META.map(s => ({ key: s.key, label: s.label, icon: s.icon })),
  ];

  // Which HR stage is actionable right now?
  const actionableStage = STAGE_META.find((s, i) => {
    const requiredStatuses = ['Self Evaluated', 'Manager Evaluated', 'Business Evaluated'];
    return s.action && appraisal.status === requiredStatuses[i - 1 + 1] || false;
  });
  // Simpler: map status → actionable
  const actionMap = {
    'Self Evaluated':     STAGE_META[1],
    'Manager Evaluated':  STAGE_META[2],
    'Business Evaluated': STAGE_META[3],
  };
  const currentAction = actionMap[appraisal.status];

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
            <p className="text-xs text-gray-500 mt-0.5">{appraisal.period} · {appraisal.designation}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[appraisal.status] || ''}`}>
              {appraisal.status}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Score summary bar */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 dark:divide-gray-800 bg-gray-50 dark:bg-gray-800/50">
          {STAGE_META.map(s => (
            <div key={s.key} className="px-3 py-2 text-center">
              <p className="text-[10px] text-gray-400 mb-0.5">{s.label.split(' ')[0]}</p>
              <ScorePill score={detail[s.scoreKey]} />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-100 dark:border-gray-800 overflow-x-auto px-1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors
                  ${activeTab === t.key
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'goals' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {(detail.goals || []).length} Goals Defined
                </p>
                <div className="text-xs text-gray-400">
                  Total weight: {(detail.goals || []).reduce((s, g) => s + (g.weight || 0), 0)}%
                </div>
              </div>
              {(detail.goals || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No goals set yet</p>
              ) : (
                detail.goals.map((g, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{g.title}</p>
                      {g.target && <p className="text-xs text-gray-500 mt-0.5">Target: {g.target}</p>}
                    </div>
                    <span className="text-xs font-semibold text-gray-500 flex-shrink-0">{g.weight}%</span>
                  </div>
                ))
              )}
            </div>
          )}

          {STAGE_META.map((stage, si) => activeTab === stage.key && (
            <div key={stage.key}>
              <div className="flex items-center gap-2 mb-4">
                <stage.icon size={14} className="text-[var(--accent)]" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{stage.label}</h3>
                <span className="text-xs text-gray-400">— by {stage.who}</span>
              </div>

              {/* Current actionable HR stage */}
              {currentAction?.key === stage.key ? (
                <EvalForm
                  goals={detail.goals}
                  submitting={submitting}
                  onSubmit={evalData => submitEval(stage.action, evalData)}
                />
              ) : (
                <EvalView evalData={detail[stage.key]} goals={detail.goals} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────
const STATUS_TABS = ['All', ...STATUS_ORDER];

export default function Appraisals({ toast }) {
  const [rows,    setRows]    = useState([]);
  const [emps,    setEmps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('All');
  const [detail,  setDetail]  = useState(null);  // appraisal row for detail modal
  const [newOpen, setNewOpen] = useState(false);
  const [form,    setForm]    = useState({ employee_id: '', period: '' });
  const [goals,   setGoals]   = useState([
    { title: '', weight: 25, target: '' },
    { title: '', weight: 25, target: '' },
    { title: '', weight: 25, target: '' },
    { title: '', weight: 25, target: '' },
  ]);
  const [saving,  setSaving]  = useState(false);

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

  const filtered = tab === 'All' ? rows : rows.filter(r => r.status === tab);
  const f = v => setForm(p => ({ ...p, ...v }));

  const updateGoal = (i, field, val) => {
    setGoals(prev => prev.map((g, gi) => gi === i ? { ...g, [field]: val } : g));
  };

  const addGoal = () => setGoals(prev => [...prev, { title: '', weight: 10, target: '' }]);
  const removeGoal = i => setGoals(prev => prev.filter((_, gi) => gi !== i));

  const totalWeight = goals.reduce((s, g) => s + (parseFloat(g.weight) || 0), 0);

  const save = async () => {
    if (!form.employee_id || !form.period?.trim()) return toast('Employee and period required', 'warning');
    const validGoals = goals.filter(g => g.title.trim());
    if (validGoals.length === 0) return toast('Add at least one goal', 'warning');
    setSaving(true);
    try {
      await api('POST', '/api/appraisals', {
        employee_id: parseInt(form.employee_id),
        period: form.period,
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
    if (!confirm('Delete this appraisal? This cannot be undone.')) return;
    try { await api('DELETE', `/api/appraisals/${id}`); toast('Deleted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const tabCount = t => t === 'All' ? rows.length : rows.filter(r => r.status === t).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Appraisals</h1>
          <p className="text-xs text-gray-400 mt-0.5">Goals → Self → Manager → Business → Business Head</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={() => {
            setForm({ employee_id: '', period: `Annual ${new Date().getFullYear()}` });
            setGoals([
              { title: '', weight: 25, target: '' },
              { title: '', weight: 25, target: '' },
              { title: '', weight: 25, target: '' },
              { title: '', weight: 25, target: '' },
            ]);
            setNewOpen(true);
          }} className="btn btn-primary btn-sm gap-1.5">
            <Plus size={13} /> New Appraisal
          </button>
        </div>
      </div>

      <div className="page-content space-y-4">
        {/* Stage pipeline visual */}
        <div className="card p-3 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max">
            {STATUS_ORDER.map((s, i) => {
              const count = rows.filter(r => r.status === s).length;
              const meta = STAGE_META[i - 1];
              const Icon = i === 0 ? Target : meta?.icon || Star;
              return (
                <div key={s} className="flex items-center">
                  <button
                    onClick={() => setTab(s)}
                    className={`flex flex-col items-center px-4 py-2 rounded-lg transition-all text-center ${
                      tab === s ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon size={14} className="mb-1" />
                    <span className="text-[11px] font-medium whitespace-nowrap">{s}</span>
                    {count > 0 && (
                      <span className={`mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        tab === s ? 'bg-[var(--accent)] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>{count}</span>
                    )}
                  </button>
                  {i < STATUS_ORDER.length - 1 && (
                    <div className="w-6 h-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                  )}
                </div>
              );
            })}
            <div className="flex items-center ml-4">
              <button
                onClick={() => setTab('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tab === 'All' ? 'bg-[var(--accent)] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}
              >
                All ({rows.length})
              </button>
            </div>
          </div>
        </div>

        {/* List */}
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
                  <th className="text-center">Business</th>
                  <th className="text-center">BH</th>
                  <th className="text-center">Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9}>
                    <div className="empty-state">
                      <Star size={32} className="text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">No appraisals found</p>
                    </div>
                  </td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id} className="cursor-pointer" onClick={() => setDetail(a)}>
                    <td>
                      <p className="font-semibold text-gray-900 dark:text-white">{a.employee_name}</p>
                      {a.designation && <p className="text-xs text-gray-400">{a.designation}</p>}
                    </td>
                    <td className="text-gray-600 dark:text-gray-400">{a.period}</td>
                    <td>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[a.status] || ''}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="text-center"><ScorePill score={a.self_score} /></td>
                    <td className="text-center"><ScorePill score={a.manager_score} /></td>
                    <td className="text-center"><ScorePill score={a.business_score} /></td>
                    <td className="text-center"><ScorePill score={a.biz_head_score} /></td>
                    <td className="text-center">
                      {a.total_score > 0 ? (
                        <span className="text-sm font-bold text-[var(--accent)]">{a.total_score.toFixed(1)}</span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetail(a)}
                          className="btn btn-secondary btn-xs gap-1"
                        >
                          <Eye size={11} />
                          {a.status === 'Goals Set' ? 'View' :
                           a.status === 'Self Evaluated' ? 'Evaluate' :
                           a.status === 'Manager Evaluated' ? 'Evaluate' :
                           a.status === 'Business Evaluated' ? 'Evaluate' : 'View'}
                        </button>
                        <button onClick={e => del(a.id, e)} className="btn btn-danger btn-xs">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
        <FormSection title="Basic Info">
          <FormGrid>
            <Field label="Employee" required>
              <select className="form-select" value={form.employee_id || ''} onChange={e => f({ employee_id: e.target.value })}>
                <option value="">Select Employee</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </Field>
            <Field label="Appraisal Period" required>
              <input
                className="form-input"
                value={form.period || ''}
                onChange={e => f({ period: e.target.value })}
                placeholder="e.g. Annual 2025, H1 2025, Q1 2025"
              />
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Goals / KRAs">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Define goals with weightage. Total should be 100%.</p>
              <span className={`text-xs font-semibold ${Math.abs(totalWeight - 100) < 0.1 ? 'text-green-600' : 'text-amber-500'}`}>
                {totalWeight.toFixed(0)}% / 100%
              </span>
            </div>
            {goals.map((g, i) => (
              <div key={i} className="grid grid-cols-[1fr_70px_120px_28px] gap-2 items-start">
                <input
                  className="form-input text-sm"
                  placeholder={`Goal ${i + 1}`}
                  value={g.title}
                  onChange={e => updateGoal(i, 'title', e.target.value)}
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number" min={1} max={100}
                    className="form-input text-sm text-center"
                    value={g.weight}
                    onChange={e => updateGoal(i, 'weight', parseFloat(e.target.value) || 0)}
                  />
                </div>
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
            <div className="grid grid-cols-[1fr_70px_120px_28px] gap-2 px-0">
              <p className="text-xs text-gray-400 col-span-1">Goal title</p>
              <p className="text-xs text-gray-400 text-center">Weight%</p>
              <p className="text-xs text-gray-400">Target / KPI</p>
            </div>
            <button
              type="button"
              onClick={addGoal}
              className="btn btn-secondary btn-sm w-full gap-1.5"
            >
              <Plus size={12} /> Add Goal
            </button>
          </div>
        </FormSection>
      </Modal>
    </>
  );
}
