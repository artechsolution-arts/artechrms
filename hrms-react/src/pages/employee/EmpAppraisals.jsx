import { useState, useEffect } from 'react';
import { api } from '../../api';
import Badge from '../../components/Badge';
import { Star } from 'lucide-react';

function ScoreBar({ score, max = 5 }) {
  const pct = Math.min(score / max * 100, 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-8 text-right">{score}</span>
    </div>
  );
}

export default function EmpAppraisals({ toast }) {
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api('GET', '/api/portal/appraisals')
      .then(setAppraisals)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">My Appraisals</h1>
      </div>

      <div className="page-content space-y-4">
        {loading ? (
          <div className="card p-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : appraisals.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Star size={36} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-500">No appraisals found</p>
              <p className="text-xs text-gray-400 mt-1">Your performance reviews will appear here</p>
            </div>
          </div>
        ) : appraisals.map(a => (
          <div key={a.id} className="card overflow-hidden">
            {/* Header row */}
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              onClick={() => setExpanded(expanded === a.id ? null : a.id)}
            >
              <div>
                <div className="font-semibold text-gray-900">{a.period}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {(a.goals || []).length} goal{(a.goals || []).length !== 1 ? 's' : ''} evaluated
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-bold text-[#2E6BE6]">{a.total_score}</div>
                  <div className="text-xs text-gray-400">/ {(a.goals || []).length * 5 || 5}</div>
                </div>
                <Badge text={a.status} />
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === a.id ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </button>

            {/* Expanded detail */}
            {expanded === a.id && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50 space-y-4">
                {/* Goals */}
                {(a.goals || []).length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Goals / KRAs</div>
                    <div className="space-y-3">
                      {a.goals.map((g, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">{g.title}</span>
                          </div>
                          <ScoreBar score={parseFloat(g.score || 0)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviewer comments */}
                {a.reviewer_comments && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reviewer Feedback</div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 leading-relaxed">
                      {a.reviewer_comments}
                    </div>
                  </div>
                )}

                {/* Total score bar */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-gray-700">Overall Score</span>
                    <span className="text-base font-bold text-[#2E6BE6]">{a.total_score} / {(a.goals || []).length * 5}</span>
                  </div>
                  <ScoreBar score={a.total_score} max={(a.goals || []).length * 5 || 5} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
