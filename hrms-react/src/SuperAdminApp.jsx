import { useState, useCallback } from 'react';
import { ShieldCheck, Users, Key, LayoutDashboard, LogOut, X, Menu, ChevronRight } from 'lucide-react';
import { useToast } from './hooks/useToast';
import { useTheme } from './hooks/useTheme';
import ToastContainer from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import MobileBottomNav from './components/MobileBottomNav';
import AdminOverview from './pages/superadmin/AdminOverview';
import UserManagement from './pages/superadmin/UserManagement';
import FeaturePermissions from './pages/superadmin/FeaturePermissions';

const NAV = [
  { key: 'overview',     label: 'Overview',           icon: LayoutDashboard },
  { key: 'users',        label: 'User Accounts',       icon: Users },
  { key: 'permissions',  label: 'Feature Permissions', icon: Key },
];

const PAGES = {
  overview:    AdminOverview,
  users:       UserManagement,
  permissions: FeaturePermissions,
};

export default function SuperAdminApp({ user, logout }) {
  const [page, setPage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { toasts, toast } = useToast();
  useTheme();

  const navigate = useCallback(p => {
    setPage(p);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);
  const PageComponent = PAGES[page] || AdminOverview;

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'SA';

  const drawerItems = [
    ...NAV.map(item => ({ type: 'item', ...item })),
    { type: 'sep', label: 'Account' },
    { type: 'item', key: '__logout__', label: 'Sign Out', icon: LogOut },
  ];

  const handleMobileNav = key => {
    if (key === '__logout__') { setConfirmLogout(true); return; }
    navigate(key);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <aside className="sidebar-desktop flex-col fixed inset-y-0 left-0 z-40 w-[240px] flex-shrink-0 bg-[#0f172a] text-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <img src="/logo.svg" alt="Artech" className="w-9 h-9 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">Artech HRMS</div>
            <div className="text-[11px] text-violet-300 font-medium">Super Admin Panel</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1 rounded hover:bg-white/10 text-white/50 lg:hidden">
            <X size={15} />
          </button>
        </div>

        {/* Badge */}
        <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center gap-2">
          <ShieldCheck size={13} className="text-violet-300 flex-shrink-0" />
          <span className="text-xs text-violet-200 font-medium">CEO / Super Administrator</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 py-2">Administration</div>
          {NAV.map(item => {
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => navigate(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left mb-0.5 ${
                  active ? 'bg-violet-500/25 text-violet-200' : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                }`}>
                <item.icon size={15} className="flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {active && <ChevronRight size={13} className="text-violet-300" />}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{user?.full_name || 'Super Admin'}</div>
              <div className="text-[11px] text-violet-300 truncate">SuperAdmin</div>
            </div>
            <button onClick={() => setConfirmLogout(true)}
              className="p-1.5 rounded-md text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-colors">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:ml-[240px]">
        {/* Topbar */}
        <header className="flex items-center gap-3 px-4 h-13 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <button onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {NAV.find(n => n.key === page)?.label || 'Overview'}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              <ShieldCheck size={11} /> SuperAdmin
            </span>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto flex flex-col pb-16 lg:pb-0">
          <PageComponent toast={toast} />
        </main>
      </div>

      <MobileBottomNav
        primaryItems={NAV}
        allItems={drawerItems}
        current={page}
        onNavigate={handleMobileNav}
        accentColor="#7c3aed"
      />

      <ToastContainer toasts={toasts} />
      <ConfirmModal
        open={confirmLogout}
        title="Sign out?"
        message="Sign out of the Super Admin panel?"
        confirmLabel="Sign Out"
        danger
        onConfirm={() => { setConfirmLogout(false); logout(); }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
