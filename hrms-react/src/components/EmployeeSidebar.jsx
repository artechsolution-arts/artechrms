import { useState } from 'react';
import {
  LayoutDashboard, User, CalendarDays, Clock,
  DollarSign, Star, X, LogOut, Megaphone, Receipt, Gift, Monitor
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const EMP_NAV = [
  { key: 'emp-dashboard',       label: 'My Dashboard',       icon: LayoutDashboard, section: null },
  { key: 'emp-profile',         label: 'My Profile',          icon: User,            section: 'Self Service' },
  { key: 'emp-leaves',          label: 'My Leaves',           icon: CalendarDays,    section: 'Self Service' },
  { key: 'emp-attendance',      label: 'My Attendance',       icon: Clock,           section: 'Self Service' },
  { key: 'emp-salary',          label: 'My Salary Slips',     icon: DollarSign,      section: 'Self Service' },
  { key: 'emp-appraisals',      label: 'My Appraisals',       icon: Star,            section: 'Self Service' },
  { key: 'emp-expenses',        label: 'My Expenses',         icon: Receipt,         section: 'Self Service' },
  { key: 'emp-assets',          label: 'My Assets',           icon: Monitor,         section: 'Self Service' },
  { key: 'emp-announcements',   label: 'Announcements',       icon: Megaphone,       section: 'Company' },
  { key: 'emp-holidays',        label: 'Holidays',            icon: Gift,            section: 'Company' },
];

export { EMP_NAV };

export default function EmployeeSidebar({ current, onNavigate, mobileOpen, onClose, user, onLogout }) {
  const [confirmLogout, setConfirmLogout] = useState(false);

  const grouped = [];
  let lastSection = null;
  EMP_NAV.forEach(item => {
    if (item.section !== lastSection) {
      lastSection = item.section;
      if (item.section) grouped.push({ type: 'sep', label: item.section });
    }
    grouped.push({ type: 'item', ...item });
  });

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'E';

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
            <div className="text-[11px] text-gray-400">Employee Portal</div>
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
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{user?.full_name || 'Employee'}</div>
              <div className="text-[11px] text-gray-400 truncate">{user?.role || 'Employee'}</div>
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
