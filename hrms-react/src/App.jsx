import { useState, useCallback } from 'react';
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
import SalaryComponents from './pages/SalaryComponents';
import Expenses from './pages/Expenses';
import Assets from './pages/Assets';
import JobOpenings from './pages/JobOpenings';
import Applicants from './pages/Applicants';
import Appraisals from './pages/Appraisals';
import DocumentRequests from './pages/DocumentRequests';

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
  'salary-components':  SalaryComponents,
  'expenses':           Expenses,
  'assets':             Assets,
  'job-openings':       JobOpenings,
  'applicants':         Applicants,
  'appraisals':         Appraisals,
  'document-requests':  DocumentRequests,
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toasts, toast } = useToast();
  const { token, user, login, logout, isAuthenticated } = useAuth();
  const { accent, setAccent, darkMode, setDarkMode } = useTheme();

  const navigate = useCallback(p => { setPage(p); setSidebarOpen(false); }, []);

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
