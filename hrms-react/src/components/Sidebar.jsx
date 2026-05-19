import { useState } from 'react';
import {
  LayoutDashboard, Users, Building2, CalendarDays, Clock,
  DollarSign, FileText, Settings, Briefcase, UserCheck,
  Star, X, Award, ListChecks, LogOut, Megaphone, Gift,
  Receipt, Monitor, BookOpen
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const NAV = [
  { key: 'dashboard',          label: 'Dashboard',         icon: LayoutDashboard, section: null },
  { key: 'employees',          label: 'Employees',          icon: Users,           section: 'HR' },
  { key: 'departments',        label: 'Departments',        icon: Building2,       section: 'HR' },
  { key: 'designations',       label: 'Designations',       icon: Award,           section: 'HR' },
  { key: 'leaves',             label: 'Leave Applications', icon: CalendarDays,    section: 'HR' },
  { key: 'leave-types',        label: 'Leave Types',        icon: ListChecks,      section: 'HR' },
  { key: 'leave-balances',     label: 'Leave Balances',     icon: BookOpen,        section: 'HR' },
  { key: 'attendance',         label: 'Attendance',         icon: Clock,           section: 'HR' },
  { key: 'holidays',           label: 'Holidays',           icon: Gift,            section: 'HR' },
  { key: 'announcements',      label: 'Announcements',      icon: Megaphone,       section: 'HR' },
  { key: 'salary-slips',       label: 'Salary Slips',       icon: DollarSign,      section: 'Payroll' },
  { key: 'payroll-entry',      label: 'Payroll Entry',      icon: FileText,        section: 'Payroll' },
  { key: 'salary-components',  label: 'Salary Components',  icon: Settings,        section: 'Payroll' },
  { key: 'expenses',           label: 'Expense Claims',     icon: Receipt,         section: 'Finance' },
  { key: 'assets',             label: 'Assets',             icon: Monitor,         section: 'Finance' },
  { key: 'job-openings',       label: 'Job Openings',       icon: Briefcase,       section: 'Recruitment' },
  { key: 'applicants',         label: 'Applicants',         icon: UserCheck,       section: 'Recruitment' },
  { key: 'appraisals',         label: 'Appraisals',         icon: Star,            section: 'Appraisals' },
];

export { NAV };

export default function Sidebar({ current, onNavigate, mobileOpen, onClose, user, onLogout }) {
  const [confirmLogout, setConfirmLogout] = useState(false);

  const grouped = [];
  let lastSection = null;
  NAV.forEach(item => {
    if (item.section !== lastSection) {
      lastSection = item.section;
      if (item.section) grouped.push({ type: 'sep', label: item.section });
    }
    grouped.push({ type: 'item', ...item });
  });

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 flex flex-col
        w-[220px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0
        transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* App header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: 'var(--accent-dark)' }}>A</div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">Artech HRMS</div>
            <div className="text-[11px] text-gray-400">Human Resources</div>
          </div>
          <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {grouped.map((item, i) =>
            item.type === 'sep' ? (
              <div key={i} className="px-4 pt-4 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {item.label}
              </div>
            ) : (
              <button
                key={item.key}
                onClick={() => { onNavigate(item.key); onClose(); }}
                className={`
                  w-full flex items-center gap-2.5 px-4 py-2 text-sm rounded-none transition-all duration-100 text-left
                  ${current === item.key
                    ? 'font-semibold border-r-2'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white font-medium'}
                `}
                style={current === item.key ? {
                  backgroundColor: 'var(--accent-50)',
                  color: 'var(--accent)',
                  borderRightColor: 'var(--accent)',
                } : {}}
              >
                <item.icon size={15} className="flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            )
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-2.5">
            {user?.profile_photo ? (
              <img src={user.profile_photo} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: 'var(--accent)' }}>
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{user?.full_name || 'User'}</div>
              <div className="text-[11px] text-gray-400 truncate">{user?.role || 'Admin'}</div>
            </div>
            {onLogout && (
              <button
                onClick={() => setConfirmLogout(true)}
                className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <ConfirmModal
        open={confirmLogout}
        title="Sign out?"
        message="Are you sure you want to sign out of Artech HRMS?"
        confirmLabel="Sign Out"
        danger
        onConfirm={() => { setConfirmLogout(false); onLogout(); }}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
