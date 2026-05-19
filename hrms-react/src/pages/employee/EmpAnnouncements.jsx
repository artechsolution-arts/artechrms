import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Megaphone } from 'lucide-react';

const PRIORITY_COLOR = {
  High:   'bg-red-50 border-l-4 border-red-400',
  Medium: 'bg-amber-50 border-l-4 border-amber-400',
  Low:    'bg-blue-50 border-l-4 border-blue-300',
};
const PRIORITY_BADGE = {
  High:   'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low:    'bg-blue-100 text-blue-700',
};

export default function EmpAnnouncements({ toast }) {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('GET', '/api/hrm/announcements?active_only=true')
      .then(setRows)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  );

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Company Announcements</h2>

        {rows.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Megaphone size={36} className="text-gray-200 mb-2"/>
              <p className="text-sm text-gray-500">No announcements at the moment</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(a => (
              <div key={a.id} className={`rounded-lg p-4 ${PRIORITY_COLOR[a.priority] || 'bg-gray-50 border-l-4 border-gray-300'}`}>
                <div className="flex items-start gap-2 mb-1">
                  <span className="font-semibold text-gray-900 text-sm flex-1">{a.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${PRIORITY_BADGE[a.priority] || 'bg-gray-100 text-gray-600'}`}>
                    {a.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{a.content}</p>
                <div className="text-xs text-gray-400 mt-2 flex gap-3">
                  <span>Posted {new Date(a.created_at).toLocaleDateString('en-IN')}</span>
                  {a.created_by && <span>by {a.created_by}</span>}
                  {a.expires_on && <span>· Expires {new Date(a.expires_on).toLocaleDateString('en-IN')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
