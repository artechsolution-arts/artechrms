import { useState, useEffect } from 'react';
import { api } from '../../api';
import Badge from '../../components/Badge';
import { CalendarDays, Clock, TrendingUp } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_COLOR = {
  Present:  'bg-green-500',
  Absent:   'bg-red-400',
  'Half Day': 'bg-yellow-400',
  'On Leave': 'bg-blue-400',
  WFH:      'bg-purple-400',
};

export default function EmpDashboard({ toast, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('GET', '/api/portal/dashboard')
      .then(setData)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  if (!data) return null;

  const { employee: emp, stats, recent_attendance } = data;
  const attendanceRate = stats.attendance_this_month
    ? Math.round(stats.present_this_month / stats.attendance_this_month * 100)
    : 0;

  return (
    <div className="flex-1 p-6 overflow-auto space-y-6">
      {/* Greeting banner */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2E6BE6] rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <div className="text-lg font-bold mb-0.5">Hello, {emp.full_name.split(' ')[0]}! 👋</div>
          <div className="text-white/70 text-sm">{emp.designation || 'Employee'} · {emp.department || 'Artech Solutions'}</div>
          <div className="text-white/50 text-xs mt-1">Employee ID: {emp.employee_id} · Joined {emp.date_of_joining}</div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-2xl font-bold">
          {emp.full_name.split(' ').map(w => w[0]).slice(0,2).join('')}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Leaves',    value: stats.pending_leaves,    icon: CalendarDays, color: 'text-amber-500',  bg: 'bg-amber-50',  action: 'emp-leaves' },
          { label: 'Approved Leaves',   value: stats.approved_leaves,   icon: CalendarDays, color: 'text-green-600', bg: 'bg-green-50',  action: null },
          { label: 'Days Present',      value: stats.present_this_month, icon: Clock,        color: 'text-blue-600',  bg: 'bg-blue-50',   action: 'emp-attendance' },
          { label: 'Attendance Rate',    value: `${attendanceRate}%`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', action: 'emp-attendance' },
        ].map(({ label, value, icon: Icon, color, bg, action }) => (
          <button
            key={label}
            onClick={() => action && onNavigate(action)}
            className={`card p-5 text-left ${action ? 'hover:shadow-md transition-shadow cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{value ?? 0}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </button>
        ))}
      </div>

      {/* Recent attendance */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Last 7 Days Attendance</span>
          <button onClick={() => onNavigate('emp-attendance')} className="text-xs text-blue-600 hover:underline">View all</button>
        </div>
        {recent_attendance.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">No attendance records yet</div>
        ) : (
          <div className="p-4 flex flex-wrap gap-3">
            {recent_attendance.map(a => (
              <div key={a.date} className="flex flex-col items-center gap-1.5 w-16">
                <div className={`w-10 h-10 rounded-full ${STATUS_COLOR[a.status] || 'bg-gray-200'} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                  {a.status[0]}
                </div>
                <div className="text-[10px] text-gray-500 text-center leading-tight">
                  {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
                <Badge text={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Latest salary slip */}
      {stats.latest_net_pay && (
        <div className="card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-1">Latest Salary — {stats.latest_slip_month?.split('/').map((v,i) => i===0 ? MONTHS[+v-1] : v).join(' ')}</div>
            <div className="text-2xl font-bold text-gray-900">₹{stats.latest_net_pay.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-0.5">Net Pay</div>
          </div>
          <button onClick={() => onNavigate('emp-salary')} className="btn btn-secondary btn-sm">
            View Slips
          </button>
        </div>
      )}
    </div>
  );
}
