import { useState, useCallback, useEffect } from 'react';
import EmployeeSidebar from './components/EmployeeSidebar';
import Topbar from './components/Topbar';
import ToastContainer from './components/Toast';
import AIAssistant from './components/AIAssistant';
import { useToast } from './hooks/useToast';
import { useTheme } from './hooks/useTheme';
import { api } from './api';

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
  const [userState, setUserState] = useState(user);
  const { toasts, toast } = useToast();
  const { accent, setAccent, darkMode, setDarkMode } = useTheme();

  const navigate = useCallback(p => {
    setPage(p);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  const handlePhotoUpdate = useCallback(photo => {
    setUserState(prev => ({ ...prev, profile_photo: photo }));
  }, []);

  useEffect(() => {
    api('GET', '/api/portal/profile')
      .then(emp => setUserState(prev => ({ ...prev, profile_photo: emp.profile_photo })))
      .catch(() => {});
  }, []);

  const PageComponent = EMP_PAGES[page] || EmpDashboard;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <EmployeeSidebar
        current={page}
        onNavigate={navigate}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={userState}
        onLogout={logout}
      />

      <div className={`flex flex-col flex-1 min-w-0 overflow-hidden transition-[margin] duration-200 lg:ml-[220px]`}>
        <Topbar
          current={page}
          onNavigate={navigate}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          accent={accent} setAccent={setAccent}
          darkMode={darkMode} setDarkMode={setDarkMode}
        />

        <main className="flex-1 overflow-auto flex flex-col pb-16 lg:pb-0">
          <PageComponent toast={toast} onNavigate={navigate} onPhotoUpdate={handlePhotoUpdate} />
        </main>
      </div>

      <AIAssistant />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
