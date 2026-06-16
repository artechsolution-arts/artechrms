import { useState, useCallback, useEffect } from 'react';
import EmployeeSidebar from './components/EmployeeSidebar';
import Topbar from './components/Topbar';
import ToastContainer from './components/Toast';
import AIAssistant from './components/AIAssistant';
import { useToast } from './hooks/useToast';
import { useTheme } from './hooks/useTheme';
import { usePermissions } from './hooks/usePermissions';
import { api } from './api';

import EmpDashboard       from './pages/employee/EmpDashboard';
import EmpProfile         from './pages/employee/EmpProfile';
import EmpLeaves          from './pages/employee/EmpLeaves';
import EmpAttendance      from './pages/employee/EmpAttendance';
import EmpSalary          from './pages/employee/EmpSalary';
import EmpAppraisals      from './pages/employee/EmpAppraisals';
import EmpAnnouncements   from './pages/employee/EmpAnnouncements';
import EmpHolidays        from './pages/employee/EmpHolidays';
import EmpAssets          from './pages/employee/EmpAssets';
import EmpDocuments       from './pages/employee/EmpDocuments';
import EmpStatus          from './pages/employee/EmpStatus';
import EmpWorkMode        from './pages/employee/EmpWorkMode';
import EmpEditRequests    from './pages/employee/EmpEditRequests';
import EmpResignation     from './pages/employee/EmpResignation';

const EMP_PAGES = {
  'emp-dashboard':      EmpDashboard,
  'emp-profile':        EmpProfile,
  'emp-leaves':         EmpLeaves,
  'emp-attendance':     EmpAttendance,
  'emp-salary':         EmpSalary,
  'emp-appraisals':     EmpAppraisals,
  'emp-assets':         EmpAssets,
  'emp-announcements':  EmpAnnouncements,
  'emp-holidays':       EmpHolidays,
  'emp-documents':      EmpDocuments,
  'emp-status':         EmpStatus,
  'emp-work-mode':      EmpWorkMode,
  'emp-edit-requests':  EmpEditRequests,
  'emp-resignation':    EmpResignation,
};

export default function EmployeeApp({ user, logout }) {
  const [page, setPage] = useState('emp-dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userState, setUserState] = useState(user);
  const { toasts, toast } = useToast();
  useTheme();

  const { can, allowed } = usePermissions(user?.role);

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

  // Guard: redirect to dashboard if feature is not allowed
  const effectivePage = (allowed && page !== 'emp-dashboard' && !can(page))
    ? 'emp-dashboard'
    : page;
  const PageComponent = EMP_PAGES[effectivePage] || EmpDashboard;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <EmployeeSidebar
        current={effectivePage}
        onNavigate={navigate}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={userState}
        onLogout={logout}
        allowedFeatures={allowed === '*' ? null : allowed}
      />

      <div className={`flex flex-col flex-1 min-w-0 overflow-hidden transition-[margin] duration-200 lg:ml-[220px]`}>
        <Topbar
          current={page}
          onNavigate={navigate}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
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
