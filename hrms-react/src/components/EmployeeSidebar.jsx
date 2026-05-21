import { useState } from 'react';
import {
  LayoutDashboard, User, CalendarDays, Clock,
  DollarSign, Star, X, LogOut, Megaphone, Gift, Monitor, FileDown,
  ClipboardList, CalendarCheck2, FilePenLine, LogOut as ResignIcon
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import MobileBottomNav from './MobileBottomNav';

const EMP_PRIMARY = [
  { key: 'emp-dashboard',  label: 'Home',      icon: LayoutDashboard },
  { key: 'emp-leaves',     label: 'Leaves',    icon: CalendarDays },
  { key: 'emp-attendance', label: 'Attendance',icon: Clock },
  { key: 'emp-profile',    label: 'Profile',   icon: User },
];

const EMP_NAV = [
  { key: 'emp-dashboard',       label: 'My Dashboard',       icon: LayoutDashboard, section: null },
  { key: 'emp-profile',         label: 'My Profile',          icon: User,            section: 'Self Service' },
  { key: 'emp-leaves',          label: 'My Leaves',           icon: CalendarDays,    section: 'Self Service' },
  { key: 'emp-attendance',      label: 'My Attendance',       icon: Clock,           section: 'Self Service' },
  { key: 'emp-salary',          label: 'My Salary Slips',     icon: DollarSign,      section: 'Self Service' },
  { key: 'emp-appraisals',      label: 'My Appraisals',       icon: Star,            section: 'Self Service' },
  { key: 'emp-assets',          label: 'My Assets',           icon: Monitor,         section: 'Self Service' },
  { key: 'emp-documents',       label: 'My Documents',        icon: FileDown,        section: 'Self Service' },
  { key: 'emp-status',          label: 'Status Sheet',        icon: ClipboardList,   section: 'Self Service' },
  { key: 'emp-work-mode',       label: 'Team Calendar',       icon: CalendarCheck2,  section: 'Self Service' },
  { key: 'emp-edit-requests',  label: 'Edit Requests',       icon: FilePenLine,     section: 'Self Service' },
  { key: 'emp-resignation',   label: 'Resignation',         icon: ResignIcon,      section: 'Self Service' },
  { key: 'emp-announcements',   label: 'Announcements',       icon: Megaphone,       section: 'Company' },
  { key: 'emp-holidays',        label: 'Holidays',            icon: Gift,            section: 'Company' },
];

export { EMP_NAV };

export default function EmployeeSidebar({ current, onNavigate, mobileOpen, onClose, user, onLogout, allowedFeatures }) {
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Filter by allowed features — dashboard always visible
  const visibleNAV = allowedFeatures
    ? EMP_NAV.filter(item => !item.key || item.key === 'emp-dashboard' || allowedFeatures.includes(item.key))
    : EMP_NAV;

  const grouped = [];
  let lastSection = null;
  visibleNAV.forEach(item => {
    if (item.section !== lastSection) {
      lastSection = item.section;
      if (item.section) grouped.push({ type: 'sep', label: item.section });
    }
    grouped.push({ type: 'item', ...item });
  });

  // Mobile bottom nav drawer also includes logout at the bottom
  const drawerItems = [...grouped, { type: 'sep', label: 'Account' }, { type: 'item', key: '__logout__', label: 'Sign Out', icon: LogOut }];

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'E';

  const handleMobileNav = key => {
    if (key === '__logout__') { onLogout?.(); return; }
    onNavigate(key);
  };

  return (
    <>
      {/* Desktop sidebar only */}
      <aside className="sidebar-desktop flex-col fixed inset-y-0 left-0 z-40 w-[220px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
        {/* App header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <img src="/logo.svg" alt="Artech" className="w-8 h-8 flex-shrink-0" />
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
                onClick={() => { onNavigate(item.key); if (window.innerWidth < 1024) onClose(); }}
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

      {/* Mobile bottom nav */}
      <MobileBottomNav
        primaryItems={EMP_PRIMARY}
        allItems={drawerItems}
        current={current}
        onNavigate={handleMobileNav}
      />

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
