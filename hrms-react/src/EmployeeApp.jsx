import { useState, useCallback } from 'react';
import EmployeeSidebar from './components/EmployeeSidebar';
import Topbar from './components/Topbar';
import ToastContainer from './components/Toast';
import AIAssistant from './components/AIAssistant';
import { useToast } from './hooks/useToast';
import { useTheme } from './hooks/useTheme';

import EmpDashboard       from './pages/employee/EmpDashboard';
import EmpProfile         from './pages/employee/EmpProfile';
import EmpLeaves          from './pages/employee/EmpLeaves';
import EmpAttendance      from './pages/employee/EmpAttendance';
import EmpSalary          from './pages/employee/EmpSalary';
import EmpAppraisals      from './pages/employee/EmpAppraisals';
import EmpExpenses        from './pages/employee/EmpExpenses';
import EmpAnnouncements   from './pages/employee/EmpAnnouncements';
import EmpHolidays        from './pages/employee/EmpHolidays';
import EmpAssets          from './pages/employee/EmpAssets';
import EmpDocuments       from './pages/employee/EmpDocuments';

const EMP_PAGES = {
  'emp-dashboard':      EmpDashboard,
  'emp-profile':        EmpProfile,
  'emp-leaves':         EmpLeaves,
  'emp-attendance':     EmpAttendance,
  'emp-salary':         EmpSalary,
  'emp-appraisals':     EmpAppraisals,
  'emp-expenses':       EmpExpenses,
  'emp-assets':         EmpAssets,
  'emp-announcements':  EmpAnnouncements,
  'emp-holidays':       EmpHolidays,
  'emp-documents':      EmpDocuments,
};

export default function EmployeeApp({ user, logout }) {
  const [page, setPage] = useState('emp-dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toasts, toast } = useToast();
  const { accent, setAccent, darkMode, setDarkMode } = useTheme();

  const navigate = useCallback(p => { setPage(p); setSidebarOpen(false); }, []);

  const PageComponent = EMP_PAGES[page] || EmpDashboard;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <EmployeeSidebar
        current={page}
        onNavigate={navigate}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={logout}
      />

      <div className={`flex flex-col flex-1 min-w-0 overflow-hidden transition-[margin] duration-200 ${sidebarOpen ? 'ml-[220px]' : 'ml-0'}`}>
        <Topbar
          current={page}
          onNavigate={navigate}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          accent={accent} setAccent={setAccent}
          darkMode={darkMode} setDarkMode={setDarkMode}
        />

        <main className="flex-1 overflow-auto flex flex-col">
          <PageComponent toast={toast} onNavigate={navigate} />
        </main>
      </div>

      <AIAssistant />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
