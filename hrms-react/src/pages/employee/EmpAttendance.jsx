import { useState, useEffect } from 'react';
import { api } from '../../api';
import Badge from '../../components/Badge';

const STATUS_BG = {
  Present:    'bg-green-100 border-green-200 text-green-700',
  Absent:     'bg-red-100 border-red-200 text-red-700',
  'Half Day': 'bg-yellow-100 border-yellow-200 text-yellow-700',
  'On Leave': 'bg-blue-100 border-blue-200 text-blue-700',
  WFH:        'bg-purple-100 border-purple-200 text-purple-700',
};

export default function EmpAttendance({ toast }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('GET', '/api/portal/attendance')
      .then(setRecords)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const present = records.filter(r => r.status === 'Present').length;
  const absent  = records.filter(r => r.status === 'Absent').length;
  const wfh     = records.filter(r => r.status === 'WFH').length;
  const rate    = records.length ? Math.round(present / records.length * 100) : 0;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">My Attendance</h1>
        <span className="text-xs text-gray-400">Last 90 days</span>
      </div>

      <div className="page-content space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Days',        value: records.length, color: 'text-gray-800' },
            { label: 'Present',           value: present,        color: 'text-green-600' },
            { label: 'Absent',            value: absent,         color: 'text-red-500' },
            { label: 'Attendance Rate',   value: `${rate}%`,     color: rate >= 90 ? 'text-green-600' : rate >= 75 ? 'text-amber-600' : 'text-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Rate bar */}
        {records.length > 0 && (
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
              <span className="text-green-600">Target: 90%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Records table */}
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Status</th><th>In Time</th><th>Out Time</th><th>Hours</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading…</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">⏰</div>
                      <p className="text-sm text-gray-500">No attendance records</p>
                    </div>
                  </td></tr>
                ) : records.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium text-gray-800">
                      {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td><Badge text={r.status} /></td>
                    <td className="text-gray-600">{r.in_time || '—'}</td>
                    <td className="text-gray-600">{r.out_time || '—'}</td>
                    <td className="text-gray-600">{r.hours ? `${r.hours}h` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
