import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Building2, CalendarDays, Clock,
  DollarSign, FileText, Briefcase, UserCheck,
  Star, X, Award, ListChecks, LogOut, Megaphone, Gift,
  Monitor, BookOpen, FileDown, UserCircle, Receipt, Wallet, ClipboardList, CalendarCheck2,
  ChevronDown, ChevronRight, FilePenLine
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import MobileBottomNav from './MobileBottomNav';

const HR_PRIMARY = [
  { key: 'dashboard',  label: 'Home',      icon: LayoutDashboard },
  { key: 'employees',  label: 'Employees', icon: Users },
  { key: 'leaves',     label: 'Leaves',    icon: CalendarDays },
  { key: 'attendance', label: 'Attendance',icon: Clock },
];

const NAV = [
  { key: 'dashboard',          label: 'Dashboard',         icon: LayoutDashboard, section: null },
  { key: 'employees',          label: 'Employees',          icon: Users,           section: 'HR' },
  { key: 'departments',        label: 'Departments',        icon: Building2,       section: 'HR' },
  { key: 'designations',       label: 'Designations',       icon: Award,           section: 'HR' },
  { key: 'leaves',             label: 'Leave Applications', icon: CalendarDays,    section: 'HR' },
  { key: 'work-mode-sheet',    label: 'Team Calendar',      icon: CalendarCheck2,  section: 'HR' },
  { key: 'leave-types',        label: 'Leave Types',        icon: ListChecks,      section: 'HR' },
  { key: 'leave-balances',     label: 'Leave Balances',     icon: BookOpen,        section: 'HR' },
  { key: 'attendance',         label: 'Attendance',         icon: Clock,           section: 'HR' },
  { key: 'holidays',           label: 'Holidays',           icon: Gift,            section: 'HR' },
  { key: 'announcements',      label: 'Announcements',      icon: Megaphone,       section: 'HR' },
  { key: 'assets',             label: 'Asset Management',   icon: Monitor,         section: 'HR' },
  { key: 'salary-slips',       label: 'Salary Slips',       icon: DollarSign,      section: 'Payroll' },
  { key: 'payroll-entry',      label: 'Payroll Entry',      icon: FileText,        section: 'Payroll' },
  { key: 'payroll-rules',      label: 'Payroll Rules',      icon: ClipboardList,   section: 'Payroll' },
  { key: 'job-openings',       label: 'Job Openings',       icon: Briefcase,       section: 'Recruitment' },
  { key: 'applicants',         label: 'Applicants',         icon: UserCheck,       section: 'Recruitment' },
  { key: 'appraisals',         label: 'Appraisals',         icon: Star,            section: 'Appraisals' },
  { key: 'edit-requests',      label: 'Edit Requests',      icon: FilePenLine,     section: 'HR' },
  { key: 'document-requests',  label: 'Document Requests',  icon: FileDown,        section: 'Documents' },
  { key: 'status-sheets',      label: 'Status Sheets',      icon: ClipboardList,   section: 'Documents' },
  { key: 'my-profile',         label: 'My Profile',         icon: UserCircle,      section: 'My Portal' },
  { key: 'my-leaves',          label: 'My Leaves',          icon: CalendarDays,    section: 'My Portal' },
  { key: 'my-salary',          label: 'My Salary Slips',    icon: Wallet,          section: 'My Portal' },
  { key: 'my-attendance',      label: 'My Attendance',      icon: Clock,           section: 'My Portal' },
  { key: 'my-documents',       label: 'My Documents',       icon: Receipt,         section: 'My Portal' },
  { key: 'my-status',          label: 'Status Sheet',       icon: ClipboardList,   section: 'My Portal' },
  { key: 'my-work-mode',       label: 'Team Calendar',      icon: CalendarCheck2,  section: 'My Portal' },
];

const ALL_SECTIONS = ['HR', 'Payroll', 'Recruitment', 'Appraisals', 'Documents', 'My Portal'];

function loadCollapsed() {
  try {
    const raw = localStorage.getItem('sidebar-collapsed');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export { NAV };

export default function Sidebar({ current, onNavigate, mobileOpen, onClose, user, onLogout, allowedFeatures }) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [collapsed, setCollapsed] = useState(loadCollapsed);

  // Filter nav items by allowed features (null/undefined = show all, e.g. SuperAdmin)
  const visibleNAV = allowedFeatures
    ? NAV.filter(item => !item.key || item.key === 'dashboard' || allowedFeatures.includes(item.key))
    : NAV;

  // Auto-expand section containing active page
  useEffect(() => {
    const activeItem = visibleNAV.find(n => n.key === current);
    if (activeItem?.section && collapsed[activeItem.section]) {
      const next = { ...collapsed };
      delete next[activeItem.section];
      setCollapsed(next);
      localStorage.setItem('sidebar-collapsed', JSON.stringify(next));
    }
  }, [current]);

  const toggleSection = (section) => {
    const next = { ...collapsed, [section]: !collapsed[section] };
    if (!next[section]) delete next[section];
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(next));
  };

  // Build sections map from visible items
  const sections = {};
  visibleNAV.forEach(item => {
    if (!item.section) return;
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  const dashboardItem = NAV.find(n => n.key === 'dashboard');

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const grouped = [];
  let lastSection = null;
  visibleNAV.forEach(item => {
    if (item.section !== lastSection) {
      lastSection = item.section;
      if (item.section) grouped.push({ type: 'sep', label: item.section });
    }
    grouped.push({ type: 'item', ...item });
  });
  const drawerItems = [...grouped, { type: 'sep', label: 'Account' }, { type: 'item', key: '__logout__', label: 'Sign Out', icon: LogOut }];

  const handleMobileNav = key => {
    if (key === '__logout__') { onLogout?.(); return; }
    onNavigate(key);
  };

  const NavButton = ({ item }) => (
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
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar-desktop flex-col fixed inset-y-0 left-0 z-40 w-[220px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
        {/* App header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <img src="/logo.svg" alt="Artech" className="w-8 h-8 flex-shrink-0" />
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
          {/* Dashboard (no section) */}
          <NavButton item={dashboardItem} />

          {ALL_SECTIONS.map(section => {
            const items = sections[section] || [];
            const isCollapsed = !!collapsed[section];
            const hasActive = items.some(i => i.key === current);
            const ChevronIcon = isCollapsed ? ChevronRight : ChevronDown;

            return (
              <div key={section}>
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center justify-between px-4 pt-4 pb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
                >
                  <span>{section}</span>
                  <ChevronIcon
                    size={11}
                    className={`transition-transform ${hasActive && isCollapsed ? 'text-[var(--accent)]' : ''}`}
                  />
                </button>

                {!isCollapsed && (
                  <div>
                    {items.map(item => <NavButton key={item.key} item={item} />)}
                  </div>
                )}

                {/* Show active item indicator even when collapsed */}
                {isCollapsed && hasActive && (
                  <div className="mx-3 mb-1 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2" style={{ backgroundColor: 'var(--accent-50)', color: 'var(--accent)' }}>
                    {(() => { const a = items.find(i => i.key === current); return a ? <><a.icon size={13} /><span className="truncate">{a.label}</span></> : null; })()}
                  </div>
                )}
              </div>
            );
          })}
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
              <div className="text-[11px] text-gray-400 truncate">{user?.role || 'HR'}</div>
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
        primaryItems={HR_PRIMARY}
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
