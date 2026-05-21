import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, CalendarDays, Clock,
  ClipboardList, CalendarCheck2, X, LogOut, ChevronDown, ChevronRight,
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import MobileBottomNav from './MobileBottomNav';

const CEO_PRIMARY = [
  { key: 'ceo-dashboard', label: 'Home',   icon: LayoutDashboard },
  { key: 'ceo-leaves',    label: 'Leaves', icon: CalendarDays },
  { key: 'ceo-employees', label: 'People', icon: Users },
];

export const CEO_NAV = [
  { key: 'ceo-dashboard',     label: 'Dashboard',       icon: LayoutDashboard, section: null },
  { key: 'ceo-employees',     label: 'Employees',        icon: Users,           section: 'People' },
  { key: 'ceo-leaves',        label: 'Leave Approvals',  icon: CalendarDays,    section: 'Approvals' },
  { key: 'ceo-work-mode',     label: 'Work Mode Sheet',  icon: CalendarCheck2,  section: 'Approvals' },
  { key: 'ceo-status-sheets', label: 'Status Sheets',    icon: ClipboardList,   section: 'Reports' },
  { key: 'ceo-attendance',    label: 'Attendance',       icon: Clock,           section: 'Reports' },
];

const ALL_SECTIONS = ['People', 'Approvals', 'Reports'];

function loadCollapsed() {
  try { return JSON.parse(localStorage.getItem('ceo-sidebar-collapsed') || '{}'); }
  catch { return {}; }
}

export default function CeoSidebar({ current, onNavigate, mobileOpen, onClose, user, onLogout }) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [collapsed, setCollapsed] = useState(loadCollapsed);

  useEffect(() => {
    const active = CEO_NAV.find(n => n.key === current);
    if (active?.section && collapsed[active.section]) {
      const next = { ...collapsed };
      delete next[active.section];
      setCollapsed(next);
      localStorage.setItem('ceo-sidebar-collapsed', JSON.stringify(next));
    }
  }, [current]);

  const toggleSection = (section) => {
    const next = { ...collapsed, [section]: !collapsed[section] };
    if (!next[section]) delete next[section];
    setCollapsed(next);
    localStorage.setItem('ceo-sidebar-collapsed', JSON.stringify(next));
  };

  const sections = {};
  CEO_NAV.forEach(item => {
    if (!item.section) return;
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  const dashboardItem = CEO_NAV.find(n => n.key === 'ceo-dashboard');
  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'C';

  const grouped = [];
  let lastSection = null;
  CEO_NAV.forEach(item => {
    if (item.section !== lastSection) {
      lastSection = item.section;
      if (item.section) grouped.push({ type: 'sep', label: item.section });
    }
    grouped.push({ type: 'item', ...item });
  });
  const drawerItems = [
    ...grouped,
    { type: 'sep', label: 'Account' },
    { type: 'item', key: '__logout__', label: 'Sign Out', icon: LogOut },
  ];

  const handleMobileNav = key => {
    if (key === '__logout__') { onLogout?.(); return; }
    onNavigate(key);
  };

  const NavButton = ({ item }) => (
    <button
      onClick={() => { onNavigate(item.key); if (window.innerWidth < 1024) onClose(); }}
      className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm rounded-none transition-all duration-100 text-left
        ${current === item.key
          ? 'font-semibold border-r-2'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white font-medium'}`}
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
      <aside className="sidebar-desktop flex-col fixed inset-y-0 left-0 z-40 w-[220px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <img src="/logo.svg" alt="Artech" className="w-8 h-8 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">Artech HRMS</div>
            <div className="text-[11px] text-rose-500 font-medium">CEO Portal</div>
          </div>
          <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
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
                  className="w-full flex items-center justify-between px-4 pt-4 pb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <span>{section}</span>
                  <ChevronIcon size={11} className={hasActive && isCollapsed ? 'text-[var(--accent)]' : ''} />
                </button>

                {!isCollapsed && (
                  <div>{items.map(item => <NavButton key={item.key} item={item} />)}</div>
                )}

                {isCollapsed && hasActive && (
                  <div className="mx-3 mb-1 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2"
                    style={{ backgroundColor: 'var(--accent-50)', color: 'var(--accent)' }}>
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
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{user?.full_name || 'CEO'}</div>
              <div className="text-[11px] text-rose-500 font-medium">CEO</div>
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

      <MobileBottomNav
        primaryItems={CEO_PRIMARY}
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
