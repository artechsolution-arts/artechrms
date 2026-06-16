import { useState, useCallback } from 'react';
import CeoSidebar from './components/CeoSidebar';
import Topbar from './components/Topbar';
import ToastContainer from './components/Toast';
import AIAssistant from './components/AIAssistant';
import { useToast } from './hooks/useToast';
import { useTheme } from './hooks/useTheme';

import CeoDashboard  from './pages/ceo/CeoDashboard';
import Leaves        from './pages/Leaves';
import Employees     from './pages/Employees';
import HRStatusSheet from './pages/HRStatusSheet';
import Attendance    from './pages/Attendance';
import HRWorkMode    from './pages/HRWorkMode';

const CEO_PAGES = {
  'ceo-dashboard':     CeoDashboard,
  'ceo-leaves':        Leaves,
  'ceo-employees':     Employees,
  'ceo-status-sheets': HRStatusSheet,
  'ceo-attendance':    Attendance,
  'ceo-work-mode':     HRWorkMode,
};

export default function CeoApp({ user, logout }) {
  const [page, setPage] = useState('ceo-dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toasts, toast } = useToast();
  useTheme();

  const navigate = useCallback(p => {
    setPage(p);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  const PageComponent = CEO_PAGES[page] || CeoDashboard;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <CeoSidebar
        current={page}
        onNavigate={navigate}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={logout}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:ml-[220px]">
        <Topbar
          current={page}
          onNavigate={navigate}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
        />

        <main className="flex-1 overflow-auto flex flex-col pb-16 lg:pb-0">
          <PageComponent toast={toast} onNavigate={navigate} />
        </main>
      </div>

      <AIAssistant />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
