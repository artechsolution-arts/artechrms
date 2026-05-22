import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

const STATUS_BG = {
  Present:    'bg-green-50 dark:bg-green-900/20',
  Absent:     'bg-red-50 dark:bg-red-900/20',
  'On Leave': 'bg-amber-50 dark:bg-amber-900/20',
  'Half Day': 'bg-blue-50 dark:bg-blue-900/20',
  WFH:        'bg-purple-50 dark:bg-purple-900/20',
};

const STATUS_TEXT = {
  Present:    'text-green-700 dark:text-green-400',
  Absent:     'text-red-600 dark:text-red-400',
  'On Leave': 'text-amber-700 dark:text-amber-400',
  'Half Day': 'text-blue-700 dark:text-blue-400',
  WFH:        'text-purple-700 dark:text-purple-400',
};

const STATUS_BADGE = {
  Present:    'bg-green-100 text-green-700 border-green-200',
  Absent:     'bg-red-100 text-red-700 border-red-200',
  'On Leave': 'bg-amber-100 text-amber-700 border-amber-200',
  'Half Day': 'bg-blue-100 text-blue-700 border-blue-200',
  WFH:        'bg-purple-100 text-purple-700 border-purple-200',
};

export default function AttendanceCalendar({
  records = [],
  holidays = [],
  year,
  month,
  loading = false,
  onPrev,
  onNext,
  selected,
  onSelect,
}) {
  const firstDay    = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const ds = d => `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const attByDate     = records.reduce((m, a) => { m[a.date] = a; return m; }, {});
  const holidayByDate = holidays.reduce((m, h) => { m[h.date] = h; return m; }, {});
  const todayStr      = new Date().toISOString().slice(0, 10);
  const summary       = records.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-4">
      {/* Month navigator */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onPrev}
          className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
        <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          onClick={onNext}
          className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Summary badges */}
      {Object.keys(summary).length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {Object.entries(summary).map(([s, c]) => (
            <span key={s} className={`text-xs px-3 py-1 rounded-full border font-semibold ${STATUS_BADGE[s] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {s}: {c}
            </span>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {DAY_NAMES.map((d, idx) => (
            <div
              key={d}
              className={`py-3 text-center text-xs font-semibold tracking-widest uppercase border-r last:border-r-0 border-gray-200 dark:border-gray-700
                ${idx === 0 || idx === 6 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {d}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">Loading…</div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              if (!d) return (
                <div
                  key={`e-${i}`}
                  className="min-h-[100px] border-r border-b last:border-r-0 border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/20"
                />
              );
              const dateKey = ds(d);
              const rec     = attByDate[dateKey];
              const hol     = holidayByDate[dateKey];
              const isToday = dateKey === todayStr;
              const isWknd  = (i % 7 === 0 || i % 7 === 6);
              const isSel   = selected === dateKey;

              const bgClass = rec
                ? STATUS_BG[rec.status] || 'bg-gray-50'
                : hol
                ? 'bg-green-50 dark:bg-green-900/10'
                : isWknd
                ? 'bg-red-50/30 dark:bg-red-900/10'
                : 'bg-white dark:bg-gray-900';

              return (
                <button
                  key={d}
                  onClick={() => onSelect && onSelect(isSel ? null : dateKey)}
                  className={`min-h-[100px] p-2.5 text-left border-r border-b last:border-r-0 border-gray-100 dark:border-gray-800 transition-all
                    ${bgClass}
                    ${isSel ? 'ring-2 ring-inset ring-[var(--accent)]' : 'hover:brightness-95'}
                  `}
                >
                  {/* Date number */}
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mb-1
                      ${isToday ? 'text-white' : rec ? STATUS_TEXT[rec.status] : hol ? 'text-green-600 dark:text-green-400' : isWknd ? 'text-red-400' : 'text-gray-700 dark:text-gray-300'}`}
                    style={isToday ? { backgroundColor: 'var(--accent)' } : {}}
                  >
                    {d}
                  </span>

                  {/* Holiday name */}
                  {hol && (
                    <div className="text-[11px] font-semibold text-green-600 dark:text-green-400 leading-tight truncate">
                      {hol.name}
                    </div>
                  )}

                  {/* Attendance status + times */}
                  {rec && (
                    <div className={`text-[11px] font-semibold leading-tight ${STATUS_TEXT[rec.status] || 'text-gray-600'}`}>
                      {rec.status === 'On Leave' ? 'On Leave' : rec.status}
                    </div>
                  )}
                  {rec && (rec.in_time || rec.out_time || rec.working_hours) && (
                    <div className="mt-1 space-y-0.5">
                      {rec.in_time  && <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">▲ {rec.in_time}</div>}
                      {rec.out_time && <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">▼ {rec.out_time}</div>}
                      {rec.working_hours ? <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">{rec.working_hours}h</div> : null}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
