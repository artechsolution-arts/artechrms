import { useState, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ToastContainer from './components/Toast';
import AIAssistant from './components/AIAssistant';
import { useToast } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';

import Login from './pages/Login';
import EmployeeApp from './EmployeeApp';
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
import Assets from './pages/Assets';
import JobOpenings from './pages/JobOpenings';
import Applicants from './pages/Applicants';
import Appraisals from './pages/Appraisals';
import DocumentRequests from './pages/DocumentRequests';
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
  'assets':             Assets,
  'job-openings':       JobOpenings,
  'applicants':         Applicants,
  'appraisals':         Appraisals,
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

  const navigate = useCallback(p => { setPage(p); if (window.innerWidth < 1024) setSidebarOpen(false); }, []);

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={login} />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  // SuperAdmin (CEO) → dedicated admin panel
  if (user?.role === 'SuperAdmin') {
    return <SuperAdminApp user={user} logout={logout} />;
  }

  // Employee role → show self-service portal
  if (user?.role === 'Employee') {
    return <EmployeeApp user={user} logout={logout} />;
  }

  const PageComponent = PAGES[page] || Dashboard;
  const isPortalPage = page.startsWith('my-');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar
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
