import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Users, UserCheck, UserX, ShieldCheck, Briefcase, CalendarClock } from 'lucide-react';

const ROLE_COLORS = {
  SuperAdmin: 'bg-violet-100 text-violet-700',
  Admin:      'bg-blue-100 text-blue-700',
  Manager:    'bg-cyan-100 text-cyan-700',
  'HR User':  'bg-green-100 text-green-700',
  Employee:   'bg-gray-100 text-gray-600',
};

export default function AdminOverview({ toast }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    Promise.all([
      api('GET', '/api/admin/stats'),
      api('GET', '/api/admin/users'),
    ]).then(([s, u]) => { setStats(s); setUsers(u); })
      .catch(e => toast(e.message, 'error'));
  }, []);

  const statCards = stats ? [
    { label: 'Total Accounts',     value: stats.total_users,       icon: Users,        color: 'from-violet-500 to-purple-600' },
    { label: 'Active Accounts',    value: stats.active_users,      icon: UserCheck,    color: 'from-blue-500 to-blue-600' },
    { label: 'Inactive Accounts',  value: stats.inactive_users,    icon: UserX,        color: 'from-rose-500 to-red-600' },
    { label: 'Total Employees',    value: stats.total_employees,   icon: Briefcase,    color: 'from-emerald-500 to-green-600' },
    { label: 'Pending Leaves',     value: stats.pending_leaves,    icon: CalendarClock, color: 'from-amber-500 to-orange-500' },
  ] : [];

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">System Overview</h1>
      </div>

      <div className="page-content space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map(c => (
            <div key={c.label} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center flex-shrink-0`}>
                <c.icon size={18} className="text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{c.value ?? '—'}</div>
                <div className="text-xs text-gray-500">{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Role breakdown */}
        {stats?.role_breakdown && (
          <div className="card p-5">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Accounts by Role</div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.role_breakdown).map(([role, count]) => (
                <div key={role} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-600'}`}>
                  <ShieldCheck size={13} />
                  {role} — {count}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent accounts */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Recent Accounts</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Linked Employee</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 10).map(u => (
                  <tr key={u.id}>
                    <td className="font-medium text-gray-900 dark:text-white">{u.full_name}</td>
                    <td className="text-gray-600"><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">{u.username}</code></td>
                    <td className="text-gray-500 text-xs">{u.email || '—'}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-gray-500 text-xs">{u.linked_employee || '—'}</td>
                    <td className="text-gray-400 text-xs">{u.created_at || '—'}</td>
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
