import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ToastContainer from './components/Toast';
import AIAssistant from './components/AIAssistant';
import { useToast } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useBackground } from './hooks/useBackground';
import { usePermissions } from './hooks/usePermissions';
import { useUpdater } from './hooks/useUpdater';
import { api } from './api';

import Login from './pages/Login';
import PortalGate from './components/PortalGate';

// ── HR / Shared pages ──────────────────────────────────────────
import Dashboard         from './pages/Dashboard';
import Employees         from './pages/Employees';
import Departments       from './pages/Departments';
import Designations      from './pages/Designations';
import Leaves            from './pages/Leaves';
import LeaveTypes        from './pages/LeaveTypes';
import LeaveBalances     from './pages/LeaveBalances';
import Attendance        from './pages/Attendance';
import Holidays          from './pages/Holidays';
import Announcements     from './pages/Announcements';
import SalarySlips       from './pages/SalarySlips';
import PayrollEntry      from './pages/PayrollEntry';
import PayrollRules      from './pages/PayrollRules';
import Assets            from './pages/Assets';
import JobOpenings       from './pages/JobOpenings';
import Applicants        from './pages/Applicants';
import Appraisals        from './pages/Appraisals';
import DocumentRequests  from './pages/DocumentRequests';
import Onboarding        from './pages/Onboarding';
import HREditRequests    from './pages/HREditRequests';
import Resignations      from './pages/Resignations';
import HRStatusSheet     from './pages/HRStatusSheet';
import HRWorkMode        from './pages/HRWorkMode';
import CompanyDocs       from './pages/CompanyDocs';
import Reports           from './pages/Reports';

// ── Employee portal pages ──────────────────────────────────────
import EmpDashboard      from './pages/employee/EmpDashboard';
import EmpProfile        from './pages/employee/EmpProfile';
import EmpStartJourney   from './pages/employee/EmpStartJourney';
import EmpLeaves         from './pages/employee/EmpLeaves';
import EmpSalary         from './pages/employee/EmpSalary';
import EmpAttendance     from './pages/employee/EmpAttendance';
import EmpDocuments      from './pages/employee/EmpDocuments';
import EmpStatus         from './pages/employee/EmpStatus';
import EmpWorkMode       from './pages/employee/EmpWorkMode';
import EmpAppraisals     from './pages/employee/EmpAppraisals';
import EmpAnnouncements  from './pages/employee/EmpAnnouncements';
import EmpHolidays       from './pages/employee/EmpHolidays';
import EmpAssets         from './pages/employee/EmpAssets';
import EmpEditRequests   from './pages/employee/EmpEditRequests';
import EmpResignation    from './pages/employee/EmpResignation';

// ── CEO pages ──────────────────────────────────────────────────
import CeoDashboard          from './pages/ceo/CeoDashboard';
import CompensationPlanner   from './pages/ceo/CompensationPlanner';
import CeoAuditLog           from './pages/ceo/CeoAuditLog';

// ── SuperAdmin pages ───────────────────────────────────────────
import AdminOverview     from './pages/superadmin/AdminOverview';
import UserManagement    from './pages/superadmin/UserManagement';
import FeaturePermissions from './pages/superadmin/FeaturePermissions';
import ActivityLog       from './pages/superadmin/ActivityLog';

// ── Unified page map (all roles) ──────────────────────────────
const PAGES = {
  // ── HR / shared ──
  'dashboard':         Dashboard,
  'employees':         Employees,
  'departments':       Departments,
  'designations':      Designations,
  'leaves':            Leaves,
  'leave-types':       LeaveTypes,
  'leave-balances':    LeaveBalances,
  'attendance':        Attendance,
  'holidays':          Holidays,
  'announcements':     Announcements,
  'salary-slips':      SalarySlips,
  'payroll-entry':     PayrollEntry,
  'payroll-rules':     PayrollRules,
  'assets':            Assets,
  'job-openings':      JobOpenings,
  'applicants':        Applicants,
  'appraisals':        Appraisals,
  'edit-requests':     HREditRequests,
  'resignations':      Resignations,
  'onboarding':        Onboarding,
  'document-requests': DocumentRequests,
  'status-sheets':     HRStatusSheet,
  'company-docs':      CompanyDocs,
  'work-mode-sheet':   HRWorkMode,
  'reports':           Reports,
  // ── Employee portal ──
  'my-dashboard':      EmpDashboard,
  'emp-dashboard':     EmpDashboard,
  'start-journey':     EmpStartJourney,
  'my-profile':        EmpProfile,
  'my-leaves':         EmpLeaves,
  'my-salary':         EmpSalary,
  'my-attendance':     EmpAttendance,
  'my-documents':      EmpDocuments,
  'my-status':         EmpStatus,
  'my-work-mode':      EmpWorkMode,
  'my-appraisals':     EmpAppraisals,
  'my-announcements':  EmpAnnouncements,
  'my-holidays':       EmpHolidays,
  'my-assets':         EmpAssets,
  'my-edit-requests':  EmpEditRequests,
  'my-resignation':    EmpResignation,
  // ── CEO ──
  'ceo-dashboard':          CeoDashboard,
  'compensation-planner':   CompensationPlanner,
  'ceo-audit-log':          CeoAuditLog,
  // ── SuperAdmin ──
  'admin-overview':    AdminOverview,
  'admin-users':       UserManagement,
  'admin-permissions': FeaturePermissions,
  'activity-log':      ActivityLog,
};

// Default landing page per role
const ROLE_HOME = {
  SuperAdmin: 'admin-overview',
  CEO:        'ceo-dashboard',
  HR:         'dashboard',
  Employee:   'emp-dashboard',
};

// Portal pages that need PortalGate wrapper
const PORTAL_PAGES = new Set([
  'my-dashboard','emp-dashboard','start-journey','my-profile','my-leaves','my-salary',
  'my-attendance','my-documents','my-status','my-work-mode','my-appraisals',
  'my-announcements','my-holidays','my-assets','my-edit-requests','my-resignation',
]);

export default function App() {
  const { toasts, toast }                     = useToast();
  const { token, user, login, logout, isAuthenticated } = useAuth();
  useTheme();
  useBackground();  // re-apply saved background image on load
  useUpdater(toast);
  const { can, allowed, loading: permLoading } = usePermissions(user?.role);

  const home = ROLE_HOME[user?.role] || 'dashboard';
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem('artech_current_page');
    return saved || home;
  });
  // Desktop: sidebar open by default. Mobile (<1024px): closed — uses bottom nav instead.
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  // Desktop rail-collapse (icon-only mode), persisted
  const [railCollapsed, setRailCollapsed] = useState(() => localStorage.getItem('sidebar_rail') === 'true');
  const toggleRail = useCallback(() => setRailCollapsed(v => { const n = !v; localStorage.setItem('sidebar_rail', String(n)); return n; }), []);
  const [userState, setUserState]     = useState(user);

  // Re-sync home page when user role changes (after login) — only if no saved page
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem('artech_current_page');
      if (!saved) setPage(ROLE_HOME[user.role] || 'dashboard');
      setUserState(user);
    }
  }, [user?.role]);

  // Refresh profile photo for employees
  useEffect(() => {
    if (user?.role === 'Employee') {
      api('GET', '/api/portal/profile')
        .then(emp => setUserState(prev => ({ ...prev, profile_photo: emp.profile_photo })))
        .catch(() => {});
    }
  }, [user?.role]);

  const navigate = useCallback(p => {
    setPage(p);
    localStorage.setItem('artech_current_page', p);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={login} />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  // SuperAdmin admin pages + shared management pages accessible to both SuperAdmin and HR
  const SUPERADMIN_FEATURES = ['admin-overview', 'admin-users', 'admin-permissions', 'assets', 'activity-log', 'reports', 'onboarding'];
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const sidebarFeatures = isSuperAdmin ? SUPERADMIN_FEATURES : (allowed === '*' ? null : allowed);

  // Role-based page guard: redirect to home if not allowed
  const effectivePage = (() => {
    if (isSuperAdmin) {
      return SUPERADMIN_FEATURES.includes(page) ? page : home;
    }
    // While permissions are loading, don't allow non-portal pages (prevents 403 flash for employees)
    if (permLoading && !PORTAL_PAGES.has(page)) return home;
    return (allowed && allowed !== '*' && page !== home && !PORTAL_PAGES.has(page) && !can(page)) ? home : page;
  })();

  const PageComponent = PAGES[effectivePage] || PAGES[home] || Dashboard;
  const isPortalPage  = PORTAL_PAGES.has(effectivePage);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        current={effectivePage}
        onNavigate={navigate}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={userState || user}
        onLogout={logout}
        allowedFeatures={sidebarFeatures}
        toast={toast}
        railCollapsed={railCollapsed}
        onToggleRail={toggleRail}
      />

      <div className={`flex flex-col flex-1 min-w-0 overflow-hidden transition-[margin-left] duration-200 ease-out ${railCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[220px]'}`}>
        <Topbar
          current={effectivePage}
          onNavigate={navigate}
          onToggleSidebar={() => {
            // Desktop: collapse/expand rail. Mobile: open/close the drawer.
            if (window.innerWidth >= 1024) toggleRail();
            else setSidebarOpen(o => !o);
          }}
        />

        <main className="flex-1 overflow-auto flex flex-col pt-safe-top lg:pt-0 pb-safe-nav lg:pb-0">
          {isPortalPage ? (
            <PortalGate onNavigate={navigate}>
              <PageComponent
                toast={toast}
                onNavigate={navigate}
                onPhotoUpdate={photo => setUserState(prev => ({ ...prev, profile_photo: photo }))}
              />
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
