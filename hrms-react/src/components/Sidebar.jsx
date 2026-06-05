import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Building2, CalendarDays, Clock,
  DollarSign, FileText, Briefcase, UserCheck,
  Star, X, Award, ListChecks, LogOut, Megaphone, Gift,
  Monitor, BookOpen, FileDown, UserCircle, Receipt, Wallet, ClipboardList, CalendarCheck2,
  ChevronDown, ChevronRight, FilePenLine, UserMinus, FolderOpen, ClipboardCheck,
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import MobileBottomNav from './MobileBottomNav';

const HR_PRIMARY = [
  { key: 'dashboard',  label: 'Home',       icon: LayoutDashboard },
  { key: 'employees',  label: 'Employees',  icon: Users },
  { key: 'leaves',     label: 'Leaves',     icon: CalendarDays },
  { key: 'attendance', label: 'Attendance', icon: Clock },
];

const NAV = [
  { key: 'dashboard',         label: 'Dashboard',          icon: LayoutDashboard, section: null },
  { key: 'employees',         label: 'Employees',           icon: Users,           section: 'HR' },
  { key: 'departments',       label: 'Departments',         icon: Building2,       section: 'HR' },
  { key: 'designations',      label: 'Designations',        icon: Award,           section: 'HR' },
  { key: 'leaves',            label: 'Leave Applications',  icon: CalendarDays,    section: 'HR' },
  { key: 'work-mode-sheet',   label: 'Team Calendar',       icon: CalendarCheck2,  section: 'HR' },
  { key: 'leave-types',       label: 'Leave Types',         icon: ListChecks,      section: 'HR' },
  { key: 'leave-balances',    label: 'Leave Balances',      icon: BookOpen,        section: 'HR' },
  { key: 'attendance',        label: 'Attendance',          icon: Clock,           section: 'HR' },
  { key: 'holidays',          label: 'Holidays',            icon: Gift,            section: 'HR' },
  { key: 'announcements',     label: 'Announcements',       icon: Megaphone,       section: 'HR' },
  { key: 'assets',            label: 'Asset Management',    icon: Monitor,         section: 'HR' },
  { key: 'edit-requests',     label: 'Edit Requests',       icon: FilePenLine,     section: 'HR' },
  { key: 'resignations',      label: 'Resignations',        icon: UserMinus,       section: 'HR' },
  { key: 'onboarding',        label: 'Onboarding / Offboarding', icon: ClipboardCheck,  section: 'Recruitment' },
  { key: 'salary-slips',      label: 'Salary Slips',        icon: DollarSign,      section: 'Payroll' },
  { key: 'payroll-entry',     label: 'Payroll Entry',       icon: FileText,        section: 'Payroll' },
  { key: 'payroll-rules',     label: 'Payroll Rules',       icon: ClipboardList,   section: 'Payroll' },
  { key: 'job-openings',      label: 'Job Openings',        icon: Briefcase,       section: 'Recruitment' },
  { key: 'applicants',        label: 'Applicants',          icon: UserCheck,       section: 'Recruitment' },
  { key: 'appraisals',        label: 'Appraisals',          icon: Star,            section: 'Appraisals' },
  { key: 'document-requests', label: 'Document Requests',   icon: FileDown,        section: 'Documents' },
  { key: 'status-sheets',     label: 'Status Sheets',       icon: ClipboardList,   section: 'Documents' },
  { key: 'company-docs',      label: 'Company Documents',   icon: FolderOpen,      section: 'Documents' },
  { key: 'start-journey',     label: 'Start Journey',        icon: ClipboardCheck,  section: 'My Portal' },
  { key: 'my-profile',        label: 'My Profile',          icon: UserCircle,      section: 'My Portal' },
  { key: 'my-leaves',         label: 'My Leaves',           icon: CalendarDays,    section: 'My Portal' },
  { key: 'my-salary',         label: 'My Salary Slips',     icon: Wallet,          section: 'My Portal' },
  { key: 'my-attendance',     label: 'My Attendance',       icon: Clock,           section: 'My Portal' },
  { key: 'my-documents',      label: 'My Documents',        icon: Receipt,         section: 'My Portal' },
  { key: 'my-status',         label: 'Status Sheet',        icon: ClipboardList,   section: 'My Portal' },
  { key: 'my-work-mode',      label: 'Team Calendar',       icon: CalendarCheck2,  section: 'My Portal' },
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
  const [collapsed, setCollapsed]         = useState(loadCollapsed);

  const visibleNAV = allowedFeatures
    ? NAV.filter(item => !item.key || item.key === 'dashboard' || allowedFeatures.includes(item.key))
    : NAV;

  useEffect(() => {
    const activeItem = visibleNAV.find(n => n.key === current);
    if (activeItem?.section && collapsed[activeItem.section]) {
      const next = { ...collapsed };
      delete next[activeItem.section];
      setCollapsed(next);
      localStorage.setItem('sidebar-collapsed', JSON.stringify(next));
    }
  }, [current]);

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

  const SidebarInner = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Brand */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.svg" alt="Artech" style={{ width: 28, height: 28, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', lineHeight: '1.2', letterSpacing: '-0.01em' }}>Artech HRMS</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>Human Resources</div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4, borderRadius: 5, display: 'flex', marginLeft: 'auto', flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

        {/* Dashboard */}
        <div style={{ padding: '2px 8px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
          <NavBtn item={dashboardItem} isActive={current === 'dashboard'} onNavigate={onNavigate} onClose={onClose} />
        </div>

        {/* Sections */}
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
                  color: 'rgba(255,255,255,0.3)', fontFamily: 'inherit',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {section}
                </span>
                {isCollapsed
                  ? <ChevronRight size={11} />
                  : <ChevronDown  size={11} />
                }
              </button>

              {!isCollapsed && items.map(item => (
                <NavBtn key={item.key} item={item} isActive={current === item.key} onNavigate={onNavigate} onClose={onClose} />
              ))}

              {isCollapsed && hasActive && (() => {
                const a = items.find(i => i.key === current);
                return a ? (
                  <div style={{
                    margin: '2px 8px 4px', padding: '6px 10px', borderRadius: 6,
                    background: 'rgba(61,199,179,0.1)', display: 'flex',
                    alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 500, color: '#3DC7B3',
                  }}>
                    <a.icon size={13} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label}</span>
                  </div>
                ) : null;
              })()}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name || 'User'}
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
              {user?.role || 'HR'}
            </div>
          </div>
          {onLogout && (
            <button
              onClick={() => setConfirmLogout(true)}
              title="Sign out"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 5, borderRadius: 5, display: 'flex', transition: 'color 0.15s, background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'none'; }}
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={`sidebar-desktop flex-col fixed inset-y-0 left-0 z-40 w-[220px] flex-shrink-0 ${!mobileOpen ? 'sidebar-hidden' : ''}`}
        style={{ background: '#111827', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <SidebarInner />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={onClose} />}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-y-0 left-0 z-40 w-[240px] flex flex-col"
          style={{ background: '#111827', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <SidebarInner />
        </div>
      )}

      <MobileBottomNav primaryItems={HR_PRIMARY} allItems={drawerItems} current={current} onNavigate={handleMobileNav} />

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

function NavBtn({ item, isActive, onNavigate, onClose }) {
  return (
    <button
      onClick={() => { onNavigate(item.key); if (window.innerWidth < 1024) onClose(); }}
      style={{
        width: 'calc(100% - 16px)', margin: '1px 8px',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px', borderRadius: 6,
        border: 'none', cursor: 'pointer', textAlign: 'left',
        fontFamily: 'inherit', fontSize: 13, fontWeight: isActive ? 500 : 400,
        background: isActive ? 'rgba(26,106,180,0.2)' : 'transparent',
        color: isActive ? '#60A5FA' : 'rgba(255,255,255,0.5)',
        transition: 'background 0.12s, color 0.12s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.82)'; }}}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}}
    >
      {isActive && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2.5, height: 14, borderRadius: 2, background: '#60A5FA' }} />}
      <item.icon size={14} style={{ flexShrink: 0, opacity: isActive ? 0.9 : 0.6 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
    </button>
  );
}
