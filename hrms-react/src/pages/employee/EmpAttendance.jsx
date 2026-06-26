import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import AttendanceCalendar from '../../components/AttendanceCalendar';

export default function EmpAttendance({ toast }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [records, setRecords]     = useState([]);
  const [holidays, setHolidays]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);

  const load = useCallback(async (y, m) => {
    setLoading(true);
    setSelected(null);
    try {
      const [att, hols] = await Promise.all([
        api('GET', `/api/portal/attendance?year=${y}&month=${m}`),
        api('GET', `/api/hrm/holidays?year=${y}`),
      ]);
      setRecords(att);
      setHolidays(hols);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(year, month); }, [year, month, load]);

  const prev = () => {
    const ny = month === 1 ? year - 1 : year;
    const nm = month === 1 ? 12 : month - 1;
    setYear(ny); setMonth(nm);
  };
  const next = () => {
    const ny = month === 12 ? year + 1 : year;
    const nm = month === 12 ? 1 : month + 1;
    setYear(ny); setMonth(nm);
  };

  const present = records.filter(r => r.status === 'Present').length;
  const absent  = records.filter(r => r.status === 'Absent').length;
  const wfh     = records.filter(r => r.status === 'WFH').length;
  const onLeave = records.filter(r => r.status === 'On Leave').length;

  const daysInMonth = new Date(year, month, 0).getDate();

  // Working days = weekdays minus public holidays in this month
  const holidaySet = new Set(
    holidays
      .map(h => h.date.slice(0, 10))
      .filter(d => {
        const [hy, hm] = d.split('-').map(Number);
        return hy === year && hm === month;
      })
  );
  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    const ds  = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (dow !== 0 && dow !== 6 && !holidaySet.has(ds)) workingDays++;
  }

  const rate = workingDays ? Math.round((present + wfh) / workingDays * 100) : 0;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">My Attendance</h1>
      </div>

      <div className="page-content space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Present',      value: present,   color: 'text-green-600' },
            { label: 'WFH',          value: wfh,       color: 'text-purple-600' },
            { label: 'On Leave',     value: onLeave,   color: 'text-amber-600' },
            { label: 'Absent',       value: absent,    color: 'text-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Attendance rate bar */}
        {daysInMonth > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-gray-600 font-medium">Attendance Rate</span>
              <span className={`font-bold ${rate >= 90 ? 'text-green-600' : rate >= 75 ? 'text-amber-600' : 'text-red-500'}`}>{rate}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${rate >= 90 ? 'bg-green-500' : rate >= 75 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${rate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span>
              <span className="text-green-600">Target: 90% &nbsp;·&nbsp; {workingDays} working days</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="card p-4">
          <AttendanceCalendar
            records={records}
            holidays={holidays}
            year={year}
            month={month}
            loading={loading}
            onPrev={prev}
            onNext={next}
            selected={selected}
            onSelect={setSelected}
          />
        </div>
      </div>
    </>
  );
}
