import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ToastContainer from './components/Toast';
import AIAssistant from './components/AIAssistant';
import { useToast } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { usePermissions } from './hooks/usePermissions';

import Login from './pages/Login';
import EmployeeApp from './EmployeeApp';
import CeoApp from './CeoApp';
import SuperAdminApp from './SuperAdminApp';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Designations from './pages/Designations';
import Leaves from './pages/Leaves';
import LeaveTypes from './pages/LeaveTypes';
import LeaveBalances from './pages/LeaveBalances';
import Attendance from './pages/Attendance';
import Holidays from './pages/Holidays';
import Announcements from './pages/Announcements';
import SalarySlips from './pages/SalarySlips';
import PayrollEntry from './pages/PayrollEntry';
import PayrollRules from './pages/PayrollRules';
import Assets from './pages/Assets';
import JobOpenings from './pages/JobOpenings';
import Applicants from './pages/Applicants';
import Appraisals from './pages/Appraisals';
import DocumentRequests from './pages/DocumentRequests';
import HREditRequests   from './pages/HREditRequests';
import EmpProfile      from './pages/employee/EmpProfile';
import EmpLeaves       from './pages/employee/EmpLeaves';
import EmpSalary       from './pages/employee/EmpSalary';
import EmpAttendance   from './pages/employee/EmpAttendance';
import EmpDocuments    from './pages/employee/EmpDocuments';
import EmpStatus       from './pages/employee/EmpStatus';
import EmpWorkMode     from './pages/employee/EmpWorkMode';
import HRStatusSheet   from './pages/HRStatusSheet';
import HRWorkMode      from './pages/HRWorkMode';
import PortalGate      from './components/PortalGate';

const PAGES = {
  'dashboard':          Dashboard,
  'employees':          Employees,
  'departments':        Departments,
  'designations':       Designations,
  'leaves':             Leaves,
  'leave-types':        LeaveTypes,
  'leave-balances':     LeaveBalances,
  'attendance':         Attendance,
  'holidays':           Holidays,
  'announcements':      Announcements,
  'salary-slips':       SalarySlips,
  'payroll-entry':      PayrollEntry,
  'payroll-rules':      PayrollRules,
  'assets':             Assets,
  'job-openings':       JobOpenings,
  'applicants':         Applicants,
  'appraisals':         Appraisals,
  'edit-requests':      HREditRequests,
  'document-requests':  DocumentRequests,
  'status-sheets':      HRStatusSheet,
  'work-mode-sheet':    HRWorkMode,
  'my-profile':         EmpProfile,
  'my-leaves':          EmpLeaves,
  'my-salary':          EmpSalary,
  'my-attendance':      EmpAttendance,
  'my-documents':       EmpDocuments,
  'my-status':          EmpStatus,
  'my-work-mode':       EmpWorkMode,
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toasts, toast } = useToast();
  const { token, user, login, logout, isAuthenticated } = useAuth();
  const { accent, setAccent, darkMode, setDarkMode } = useTheme();

  const { can, allowed } = usePermissions(user?.role);
  const navigate = useCallback(p => { setPage(p); if (window.innerWidth < 1024) setSidebarOpen(false); }, []);

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={login} />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  if (user?.role === 'SuperAdmin') {
    return <SuperAdminApp user={user} logout={logout} />;
  }

  if (user?.role === 'CEO') {
    return <CeoApp user={user} logout={logout} />;
  }

  if (user?.role === 'Employee') {
    return <EmployeeApp user={user} logout={logout} />;
  }

  // Guard: if HR user navigates to a feature they don't have access to, show dashboard
  const effectivePage = (allowed && allowed !== '*' && page !== 'dashboard' && !can(page))
    ? 'dashboard'
    : page;
  const PageComponent = PAGES[effectivePage] || Dashboard;
  const isPortalPage = effectivePage.startsWith('my-');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar
        current={effectivePage}
        onNavigate={navigate}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={logout}
        allowedFeatures={allowed === '*' ? null : allowed}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:ml-[220px]">
        <Topbar
          current={page}
          onNavigate={navigate}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          accent={accent} setAccent={setAccent}
          darkMode={darkMode} setDarkMode={setDarkMode}
        />

        <main className="flex-1 overflow-auto flex flex-col pb-16 lg:pb-0">
          {isPortalPage ? (
            <PortalGate onNavigate={navigate}>
              <PageComponent toast={toast} onNavigate={navigate} />
            </PortalGate>
          ) : (
            <PageComponent toast={toast} onNavigate={navigate} />
          )}
        </main>
      </div>

      <AIAssistant />

      <ToastContainer toasts={toasts} />
    </div>
  );
}
