import { useState, useEffect } from 'react';
import { api } from '../../api';
import Badge from '../../components/Badge';
import { CalendarDays } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function EmpHolidays({ toast }) {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear]     = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    api('GET', `/api/hrm/holidays?year=${year}`)
      .then(setRows)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [year]);

  const grouped = rows.reduce((acc, h) => {
    const m = new Date(h.date).getMonth();
    if (!acc[m]) acc[m] = [];
    acc[m].push(h);
    return acc;
  }, {});

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Holiday Calendar</h2>
          <select className="form-select w-28 text-sm" value={year} onChange={e => setYear(+e.target.value)}>
            {[2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>

        {rows.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <CalendarDays size={36} className="text-gray-200 mb-2"/>
              <p className="text-sm text-gray-500">No holidays for {year}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(grouped).sort(([a],[b]) => +a - +b).map(([month, holidays]) => (
              <div key={month} className="card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 font-semibold text-sm text-gray-700">
                  {MONTHS[+month]}
                </div>
                {holidays.map(h => (
                  <div key={h.id} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="text-center w-8">
                        <div className="text-lg font-bold leading-none text-gray-800">{new Date(h.date).getDate()}</div>
                        <div className="text-[10px] text-gray-400">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(h.date).getDay()]}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{h.name}</div>
                        <Badge text={h.holiday_type} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
