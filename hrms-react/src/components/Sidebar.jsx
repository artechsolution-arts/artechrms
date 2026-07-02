import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Building2, CalendarDays, Clock,
  DollarSign, FileText, Briefcase, UserCheck,
  Star, X, Award, ListChecks, LogOut, Megaphone, Gift,
  Monitor, BookOpen, FileDown, UserCircle, Receipt, Wallet, ClipboardList, CalendarCheck2,
  ChevronDown, ChevronRight, FilePenLine, UserMinus, FolderOpen, ClipboardCheck,
  ShieldCheck, Key, Crown, Settings as SettingsIcon, ChevronRight as ChevronRightIcon,
  BarChart2, Activity, ScrollText, BadgeCheck,
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import MobileBottomNav from './MobileBottomNav';
import SettingsModal from './SettingsModal';

const HR_PRIMARY = [
  { key: 'dashboard',     label: 'Home',       icon: LayoutDashboard },
  { key: 'employees',     label: 'Employees',  icon: Users },
  { key: 'leaves',        label: 'Leaves',     icon: CalendarDays },
  { key: 'attendance',    label: 'Attendance', icon: Clock },
  { key: 'emp-dashboard', label: 'Home',       icon: LayoutDashboard },
  { key: 'ceo-dashboard', label: 'Home',       icon: LayoutDashboard },
  { key: 'admin-overview',label: 'Overview',   icon: ShieldCheck },
];

const NAV = [
  // ── SuperAdmin ──────────────────────────────────────────
  { key: 'admin-overview',    label: 'Overview',                  icon: LayoutDashboard, section: 'Admin' },
  { key: 'admin-users',       label: 'User Accounts',             icon: Users,           section: 'Admin' },
  { key: 'admin-permissions', label: 'Feature Permissions',       icon: Key,             section: 'Admin' },
  { key: 'activity-log',      label: 'Activity Log',              icon: Activity,        section: 'Admin' },
  // ── CEO ─────────────────────────────────────────────────
  { key: 'ceo-dashboard',          label: 'Dashboard',            icon: Crown,       section: 'CEO' },
  { key: 'compensation-planner',   label: 'Compensation Planner', icon: BarChart2,   section: 'CEO' },
  { key: 'ceo-approvals',          label: 'Approvals',            icon: BadgeCheck,  section: 'CEO' },
  { key: 'ceo-audit-log',          label: 'Audit Log',            icon: ScrollText,  section: 'CEO' },
  // ── HR Dashboard (null = always top, filtered by allowedFeatures) ──
  { key: 'dashboard',         label: 'Dashboard',                 icon: LayoutDashboard, section: null },
  // ── Employee Dashboard (null = always top, filtered by allowedFeatures) ──
  { key: 'emp-dashboard',     label: 'Dashboard',                 icon: LayoutDashboard, section: null },
  // ── HR ──────────────────────────────────────────────────
  { key: 'employees',         label: 'Employees',                 icon: Users,           section: 'HR' },
  { key: 'departments',       label: 'Departments',               icon: Building2,       section: 'HR' },
  { key: 'designations',      label: 'Designations',              icon: Award,           section: 'HR' },
  { key: 'leaves',            label: 'Leave Applications',        icon: CalendarDays,    section: 'HR' },
  { key: 'work-mode-sheet',   label: 'Team Calendar',             icon: CalendarCheck2,  section: 'HR' },
  { key: 'leave-types',       label: 'Leave Types',               icon: ListChecks,      section: 'HR' },
  { key: 'leave-balances',    label: 'Leave Balances',            icon: BookOpen,        section: 'HR' },
  { key: 'attendance',        label: 'Attendance',                icon: Clock,           section: 'HR' },
  { key: 'holidays',          label: 'Holidays',                  icon: Gift,            section: 'HR' },
  { key: 'announcements',     label: 'Announcements',             icon: Megaphone,       section: 'HR' },
  { key: 'assets',            label: 'Asset Management',          icon: Monitor,         section: 'HR' },
  { key: 'edit-requests',     label: 'Edit Requests',             icon: FilePenLine,     section: 'HR' },
  { key: 'resignations',      label: 'Resignations',              icon: UserMinus,       section: 'HR' },
  { key: 'reports',           label: 'Reports',                   icon: BarChart2,        section: 'HR' },
  // ── Payroll ─────────────────────────────────────────────
  { key: 'salary-slips',      label: 'Salary Slips',              icon: DollarSign,      section: 'Payroll' },
  { key: 'payroll-entry',     label: 'Payroll Entry',             icon: FileText,        section: 'Payroll' },
  { key: 'payroll-rules',     label: 'Payroll Rules',             icon: ClipboardList,   section: 'Payroll' },
  // ── Recruitment ─────────────────────────────────────────
  { key: 'onboarding',        label: 'Onboarding / Offboarding',  icon: ClipboardCheck,  section: 'Recruitment' },
  { key: 'job-openings',      label: 'Job Openings',              icon: Briefcase,       section: 'Recruitment' },
  { key: 'applicants',        label: 'Applicants',                icon: UserCheck,       section: 'Recruitment' },
  // ── Appraisals ──────────────────────────────────────────
  { key: 'appraisals',        label: 'Appraisals',                icon: Star,            section: 'Appraisals' },
  // ── Documents ───────────────────────────────────────────
  { key: 'document-requests', label: 'Document Requests',         icon: FileDown,        section: 'Documents' },
  { key: 'status-sheets',     label: 'Status Sheets',             icon: ClipboardList,   section: 'Documents' },
  { key: 'company-docs',      label: 'Company Documents',         icon: FolderOpen,      section: 'Documents' },
  // ── Employee Self Service ────────────────────────────────
  { key: 'my-dashboard',      label: 'My Dashboard',              icon: LayoutDashboard, section: 'Self Service' },
  { key: 'start-journey',     label: 'Start Journey',             icon: ClipboardCheck,  section: 'Self Service' },
  { key: 'my-profile',        label: 'My Profile',                icon: UserCircle,      section: 'Self Service' },
  { key: 'my-leaves',         label: 'My Leaves',                 icon: CalendarDays,    section: 'Self Service' },
  { key: 'my-attendance',     label: 'My Attendance',             icon: Clock,           section: 'Self Service' },
  { key: 'my-salary',         label: 'My Salary Slips',           icon: Wallet,          section: 'Self Service' },
  { key: 'my-appraisals',     label: 'My Appraisals',             icon: Star,            section: 'Self Service' },
  { key: 'my-assets',         label: 'My Assets',                 icon: Monitor,         section: 'Self Service' },
  { key: 'my-documents',      label: 'My Documents',              icon: Receipt,         section: 'Self Service' },
  { key: 'my-status',         label: 'Status Sheet',              icon: ClipboardList,   section: 'Self Service' },
  { key: 'my-work-mode',      label: 'Team Calendar',             icon: CalendarCheck2,  section: 'Self Service' },
  { key: 'my-edit-requests',  label: 'Edit Requests',             icon: FilePenLine,     section: 'Self Service' },
  { key: 'my-resignation',    label: 'Resignation',               icon: UserMinus,       section: 'Self Service' },
  // ── Company Info ────────────────────────────────────────
  { key: 'my-announcements',  label: 'Announcements',             icon: Megaphone,       section: 'Company' },
  { key: 'my-holidays',       label: 'Holidays',                  icon: Gift,            section: 'Company' },
];

const ALL_SECTIONS = ['Admin', 'CEO', 'HR', 'Payroll', 'Recruitment', 'Appraisals', 'Documents', 'Self Service', 'Company'];

function loadCollapsed() {
  try {
    const raw = localStorage.getItem('sidebar-collapsed');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export { NAV };

/* ─────────────────────────────────────────────────────────────
   NavBtn — stable top-level component
───────────────────────────────────────────────────────────── */
function NavBtn({ item, isActive, onNavigate, onClose, rail = false }) {
  return (
    <button
      onClick={() => { onNavigate(item.key); if (window.innerWidth < 1024) onClose(); }}
      title={rail ? item.label : undefined}
      style={{
        width: rail ? 44 : 'calc(100% - 16px)',
        height: rail ? 40 : 'auto',
        margin: rail ? '2px auto' : '1px 8px',
        display: 'flex', alignItems: 'center', justifyContent: rail ? 'center' : 'flex-start', gap: 8,
        padding: rail ? 0 : '6px 10px', borderRadius: rail ? 9 : 6,
        border: 'none', cursor: 'pointer', textAlign: 'left',
        fontFamily: 'inherit', fontSize: 13, fontWeight: isActive ? 500 : 400,
        background: isActive ? 'var(--sidebar-active-bg, rgba(26,106,180,0.2))' : 'transparent',
        color: isActive ? 'var(--sidebar-active-fg, #60A5FA)' : 'var(--sidebar-fg-muted, rgba(255,255,255,0.5))',
        transition: 'background 0.12s, color 0.12s, transform 100ms cubic-bezier(0.23,1,0.32,1)',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--sidebar-hover-bg, rgba(255,255,255,0.05))'; e.currentTarget.style.color = 'var(--sidebar-fg, rgba(255,255,255,0.82))'; }}}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-fg-muted, rgba(255,255,255,0.5))'; } e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {isActive && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2.5, height: rail ? 18 : 14, borderRadius: 2, background: 'var(--sidebar-active-fg, #60A5FA)' }} />}
      <item.icon size={rail ? 17 : 14} style={{ flexShrink: 0, opacity: isActive ? 0.95 : 0.65 }} />
      {!rail && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   SidebarContent — TOP-LEVEL component so React never unmounts
   it on parent re-render, preserving the nav scroll position.
───────────────────────────────────────────────────────────── */
function SidebarContent({
  railMode, dashboardItem, sections, collapsed, toggleSection,
  current, onNavigate, onClose, onToggleRail,
  userMenuOpen, setUserMenuOpen, settingsOpen, setSettingsOpen,
  user, initials, setConfirmLogout, toast,
}) {
  const rail = railMode;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Brand — clicking logo toggles rail (desktop) or closes drawer (mobile) */}
      <div style={{ padding: rail ? '14px 0 12px' : '14px 16px 12px', borderBottom: '1px solid var(--sidebar-border, rgba(255,255,255,0.08))', flexShrink: 0 }}>
        <button
          onClick={onToggleRail || onClose}
          title={rail ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: rail ? 'center' : 'flex-start', background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: 0, borderRadius: 8, transition: 'opacity 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <img src="/logo.svg" alt="Artech" style={{ width: 28, height: 28, flexShrink: 0 }} />
          <div style={{ overflow: 'hidden', opacity: rail ? 0 : 1, maxWidth: rail ? 0 : 200, transition: 'opacity 0.12s ease, max-width 0.18s cubic-bezier(0.23,1,0.32,1)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--sidebar-fg-strong, #fff)', lineHeight: '1.2', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>AR Peopliz</div>
            <div style={{ fontSize: 11, color: 'var(--sidebar-fg-label, rgba(255,255,255,0.38))', marginTop: 1, whiteSpace: 'nowrap' }}>Human Resources</div>
          </div>
        </button>
      </div>

      {/* Nav — scroll position is preserved because this component never unmounts */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0', scrollbarWidth: 'thin', scrollbarColor: 'var(--sidebar-scrollbar, rgba(255,255,255,0.1)) transparent' }}>

        {rail ? (
          <>
            {dashboardItem && (
              <div style={{ padding: '2px 0 6px', borderBottom: '1px solid var(--sidebar-divider, rgba(255,255,255,0.06))', marginBottom: 4 }}>
                <NavBtn item={dashboardItem} isActive={current === dashboardItem.key} onNavigate={onNavigate} onClose={onClose} rail />
              </div>
            )}
            {ALL_SECTIONS.map((section, si) => {
              const items = sections[section] || [];
              if (!items.length) return null;
              return (
                <div key={section} style={{ marginBottom: 4 }}>
                  {si > 0 && <div style={{ height: 1, background: 'var(--sidebar-divider, rgba(255,255,255,0.06))', margin: '4px 16px' }} />}
                  {items.map(item => (
                    <NavBtn key={item.key} item={item} isActive={current === item.key} onNavigate={onNavigate} onClose={onClose} rail />
                  ))}
                </div>
              );
            })}
          </>
        ) : (
          <>
            {dashboardItem && (
              <div style={{ padding: '2px 8px 8px', borderBottom: '1px solid var(--sidebar-divider, rgba(255,255,255,0.06))', marginBottom: 4 }}>
                <NavBtn item={dashboardItem} isActive={current === dashboardItem.key} onNavigate={onNavigate} onClose={onClose} />
              </div>
            )}

            {ALL_SECTIONS.map(section => {
              const items = sections[section] || [];
              if (!items.length) return null;
              const isCollapsed = !!collapsed[section];
              const hasActive   = items.some(i => i.key === current);

              return (
                <div key={section} style={{ marginBottom: 2 }}>
                  <button
                    onClick={() => toggleSection(section)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 16px 3px', background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--sidebar-fg-label, rgba(255,255,255,0.3))', fontFamily: 'inherit', transition: 'color 0.12s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--sidebar-fg-muted, rgba(255,255,255,0.55))'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--sidebar-fg-label, rgba(255,255,255,0.3))'}
                  >
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {section}
                    </span>
                    <ChevronDown size={11} style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 150ms cubic-bezier(0.23,1,0.32,1)' }} />
                  </button>

                  <div style={{ display: 'grid', gridTemplateRows: isCollapsed ? '0fr' : '1fr', transition: 'grid-template-rows 200ms cubic-bezier(0.23,1,0.32,1)' }}>
                    <div style={{ overflow: 'hidden', opacity: isCollapsed ? 0 : 1, transition: 'opacity 150ms ease' }}>
                      {items.map(item => (
                        <NavBtn key={item.key} item={item} isActive={current === item.key} onNavigate={onNavigate} onClose={onClose} />
                      ))}
                    </div>
                  </div>

                  {isCollapsed && hasActive && (() => {
                    const a = items.find(i => i.key === current);
                    return a ? (
                      <div style={{
                        margin: '2px 8px 4px', padding: '6px 10px', borderRadius: 6,
                        background: 'var(--sidebar-active-bg, rgba(61,199,179,0.1))', display: 'flex',
                        alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 500, color: 'var(--sidebar-active-fg, #3DC7B3)',
                      }}>
                        <a.icon size={13} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label}</span>
                      </div>
                    ) : null;
                  })()}
                </div>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 10px 12px', borderTop: '1px solid var(--sidebar-border, rgba(255,255,255,0.08))', flexShrink: 0, position: 'relative' }}>

        {userMenuOpen && (
          <>
            <div onClick={() => setUserMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{
              position: 'absolute', bottom: '100%', marginBottom: 6, zIndex: 50,
              ...(rail ? { left: 8, width: 180 } : { left: 10, right: 10 }),
              background: 'var(--sidebar-menu-bg, rgba(31,41,55,0.88))', backdropFilter: 'blur(24px) saturate(1.5)', WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
              border: '1px solid var(--sidebar-menu-border, rgba(255,255,255,0.14))', borderRadius: 12,
              boxShadow: '0 12px 40px var(--sidebar-menu-shadow, rgba(0,0,0,0.45))', overflow: 'hidden', padding: 6,
              animation: 'menuSlideUp 0.15s cubic-bezier(0.23,1,0.32,1) both',
              transformOrigin: 'bottom left',
            }}>
              <button
                onClick={() => { setUserMenuOpen(false); setSettingsOpen(true); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, color: 'var(--sidebar-fg, rgba(255,255,255,0.85))', fontSize: 13, fontWeight: 500, textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-hover-bg, rgba(255,255,255,0.07))'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <SettingsIcon size={15} /> Settings
              </button>
              <button
                onClick={() => { setUserMenuOpen(false); setConfirmLogout(true); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, color: '#f87171', fontSize: 13, fontWeight: 500, textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <LogOut size={15} /> Log out
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => setUserMenuOpen(o => !o)}
          title={rail ? (user?.full_name || 'User') : undefined}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: rail ? 'center' : 'flex-start', gap: 8, padding: rail ? '6px 0' : '7px 8px', borderRadius: 8, background: userMenuOpen ? 'var(--sidebar-user-btn-active, rgba(255,255,255,0.08))' : 'var(--sidebar-user-btn-bg, rgba(255,255,255,0.04))', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => { if (!userMenuOpen) e.currentTarget.style.background = 'var(--sidebar-hover-bg, rgba(255,255,255,0.07))'; }}
          onMouseLeave={e => { if (!userMenuOpen) e.currentTarget.style.background = 'var(--sidebar-user-btn-bg, rgba(255,255,255,0.04))'; }}>
          {user?.profile_photo ? (
            <img src={user.profile_photo} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff',
            }}>
              {initials}
            </div>
          )}
          {!rail && (
            <>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sidebar-fg, rgba(255,255,255,0.85))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.full_name || 'User'}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--sidebar-fg-label, rgba(255,255,255,0.35))', marginTop: 1 }}>
                  {user?.role || 'HR'}
                </div>
              </div>
              <ChevronRightIcon size={14} style={{ color: 'var(--sidebar-fg-label, rgba(255,255,255,0.3))', transform: userMenuOpen ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.15s' }} />
            </>
          )}
        </button>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} toast={toast || (() => {})} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sidebar
───────────────────────────────────────────────────────────── */
export default function Sidebar({ current, onNavigate, mobileOpen, onClose, user, onLogout, allowedFeatures, toast, railCollapsed = false, onToggleRail }) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [collapsed, setCollapsed]         = useState(loadCollapsed);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [settingsOpen, setSettingsOpen]   = useState(false);
  const rail = railCollapsed;

  // Always show my-dashboard when the user has any Self Service portal access,
  // even if the backend permissions list doesn't explicitly include this new key.
  // BUT: if emp-dashboard is the top dashboardItem (pure Employee, no HR dashboard),
  // skip my-dashboard — it's a duplicate pointing to the same page.
  const hasPortalAccess = !allowedFeatures || allowedFeatures.some(f => f.startsWith('my-') || f === 'emp-dashboard');
  const empDashIsTopItem = allowedFeatures &&
    allowedFeatures.includes('emp-dashboard') &&
    !allowedFeatures.includes('dashboard');
  const visibleNAV = allowedFeatures
    ? NAV.filter(item => !item.key || allowedFeatures.includes(item.key) || (item.key === 'my-dashboard' && hasPortalAccess && !empDashIsTopItem))
    : NAV;

  // Auto-expand the section containing the active page
  useEffect(() => {
    const activeItem = visibleNAV.find(n => n.key === current);
    if (activeItem?.section && collapsed[activeItem.section]) {
      const next = { ...collapsed };
      delete next[activeItem.section];
      setCollapsed(next);
      localStorage.setItem('sidebar-collapsed', JSON.stringify(next));
    }
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSection = section => {
    const next = { ...collapsed, [section]: !collapsed[section] };
    if (!next[section]) delete next[section];
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(next));
  };

  const sections = {};
  visibleNAV.forEach(item => {
    if (!item.section) return;
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  const nullItems = visibleNAV.filter(n => n.section === null);
  const dashboardItem = nullItems[0];

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const grouped = [];
  let lastSection = null;
  visibleNAV.filter(item => item.section !== null).forEach(item => {
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

  // Shared props passed to SidebarContent
  const contentProps = {
    dashboardItem, sections, collapsed, toggleSection,
    current, onNavigate, onClose, onToggleRail,
    userMenuOpen, setUserMenuOpen, settingsOpen, setSettingsOpen,
    user, initials, setConfirmLogout, toast,
  };

  return (
    <>
      {/* Desktop — SidebarContent is always mounted here, scroll position persists */}
      <aside className="glass-sidebar sidebar-desktop flex-col fixed inset-y-0 left-0 z-40 flex-shrink-0"
        style={{ width: rail ? 76 : 220, transition: 'width 0.18s cubic-bezier(0.23,1,0.32,1)' }}>
        <SidebarContent railMode={rail} {...contentProps} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={onClose} />}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="glass-sidebar lg:hidden fixed inset-y-0 left-0 z-40 w-[240px] flex flex-col"
          style={{ animation: 'sidebarSlideIn 0.28s cubic-bezier(0.32, 0.72, 0, 1) both' }}>
          <SidebarContent railMode={false} {...contentProps} />
        </div>
      )}

      <MobileBottomNav primaryItems={HR_PRIMARY} allItems={drawerItems} current={current} onNavigate={handleMobileNav} onLogout={() => setConfirmLogout(true)} />

      <ConfirmModal
        open={confirmLogout}
        title="Sign out?"
        message="Are you sure you want to sign out of AR Peopliz?"
        confirmLabel="Sign Out"
        danger
        onConfirm={() => { setConfirmLogout(false); onLogout(); }}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
