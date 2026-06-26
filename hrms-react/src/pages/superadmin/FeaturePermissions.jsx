import { useState, useEffect } from 'react';
import { api } from '../../api';
import { _permissionsCache } from '../../hooks/usePermissions';
import { ShieldCheck, Save, RotateCcw, RefreshCw } from 'lucide-react';

const ROLE_META = {
  CEO:      { label: 'CEO',      color: 'bg-rose-100 text-rose-700',   ring: 'ring-rose-400' },
  HR:       { label: 'HR',       color: 'bg-blue-100 text-blue-700',   ring: 'ring-blue-400' },
  Employee: { label: 'Employee', color: 'bg-gray-100 text-gray-700',   ring: 'ring-gray-400' },
};

// All features grouped by section — must match the keys in App.jsx PAGES / Sidebar NAV
const FEATURE_SECTIONS = [
  {
    section: 'Dashboards',
    features: [
      { key: 'dashboard',        label: 'HR Dashboard' },
      { key: 'ceo-dashboard',    label: 'CEO Dashboard' },
      { key: 'emp-dashboard',    label: 'Employee Dashboard' },
    ],
  },
  {
    section: 'HR — Core',
    features: [
      { key: 'employees',        label: 'Employees' },
      { key: 'departments',      label: 'Departments' },
      { key: 'designations',     label: 'Designations' },
    ],
  },
  {
    section: 'HR — Leaves & Attendance',
    features: [
      { key: 'leaves',           label: 'Leave Applications' },
      { key: 'work-mode-sheet',  label: 'Team Calendar' },
      { key: 'leave-types',      label: 'Leave Types' },
      { key: 'leave-balances',   label: 'Leave Balances' },
      { key: 'attendance',       label: 'Attendance' },
      { key: 'holidays',         label: 'Holidays' },
    ],
  },
  {
    section: 'HR — Company',
    features: [
      { key: 'announcements',    label: 'Announcements' },
      { key: 'assets',           label: 'Asset Management' },
      { key: 'edit-requests',    label: 'Edit Requests' },
      { key: 'resignations',     label: 'Resignations' },
    ],
  },
  {
    section: 'Payroll',
    features: [
      { key: 'salary-slips',     label: 'Salary Slips' },
      { key: 'payroll-entry',    label: 'Payroll Entry' },
      { key: 'payroll-rules',    label: 'Payroll Rules' },
    ],
  },
  {
    section: 'Recruitment',
    features: [
      { key: 'onboarding',       label: 'Onboarding / Offboarding' },
      { key: 'job-openings',     label: 'Job Openings' },
      { key: 'applicants',       label: 'Applicants' },
    ],
  },
  {
    section: 'Appraisals',
    features: [
      { key: 'appraisals',       label: 'Appraisals' },
    ],
  },
  {
    section: 'Documents',
    features: [
      { key: 'document-requests', label: 'Document Requests' },
      { key: 'status-sheets',     label: 'Status Sheets' },
      { key: 'company-docs',      label: 'Company Documents' },
    ],
  },
  {
    section: 'My Portal — Self Service',
    features: [
      { key: 'start-journey',    label: 'Start Journey' },
      { key: 'my-profile',       label: 'My Profile' },
      { key: 'my-leaves',        label: 'My Leaves' },
      { key: 'my-attendance',    label: 'My Attendance' },
      { key: 'my-salary',        label: 'My Salary Slips' },
      { key: 'my-appraisals',    label: 'My Appraisals' },
      { key: 'my-assets',        label: 'My Assets' },
      { key: 'my-documents',     label: 'My Documents' },
      { key: 'my-status',        label: 'Status Sheet' },
      { key: 'my-work-mode',     label: 'Team Calendar' },
      { key: 'my-edit-requests', label: 'Edit Requests' },
      { key: 'my-resignation',   label: 'Resignation' },
    ],
  },
  {
    section: 'My Portal — Company',
    features: [
      { key: 'my-announcements', label: 'Announcements' },
      { key: 'my-holidays',      label: 'Holidays' },
    ],
  },
];

// Flat list of all feature keys (used for "toggle all")
const ALL_FEATURE_KEYS = FEATURE_SECTIONS.flatMap(s => s.features.map(f => f.key));

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1
        ${checked ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5
        ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function FeaturePermissions({ toast }) {
  const [permissions, setPermissions] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('GET', '/api/admin/permissions')
      .then(data => {
        // Normalize: ensure all roles have an array
        const perms = data.permissions || {};
        const roles = Object.keys(ROLE_META);
        roles.forEach(role => { if (!perms[role]) perms[role] = []; });
        setPermissions(perms);
        setOriginal(JSON.parse(JSON.stringify(perms)));
      })
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  function toggle(role, feature) {
    setPermissions(prev => {
      const current = prev[role] || [];
      const next = current.includes(feature)
        ? current.filter(f => f !== feature)
        : [...current, feature];
      return { ...prev, [role]: next };
    });
  }

  function toggleSection(role, sectionKeys, enable) {
    setPermissions(prev => {
      const current = prev[role] || [];
      let next;
      if (enable) {
        next = [...new Set([...current, ...sectionKeys])];
      } else {
        next = current.filter(f => !sectionKeys.includes(f));
      }
      return { ...prev, [role]: next };
    });
  }

  function toggleAll(role, enable) {
    setPermissions(prev => ({
      ...prev,
      [role]: enable ? [...ALL_FEATURE_KEYS] : [],
    }));
  }

  function reset() {
    setPermissions(JSON.parse(JSON.stringify(original)));
  }

  async function resetToDefaults(role) {
    try {
      const data = await api('POST', `/api/admin/permissions/${role}/reset`);
      setPermissions(prev => ({ ...prev, [role]: data.allowed_features }));
      setOriginal(prev => ({ ...prev, [role]: data.allowed_features }));
      Object.keys(_permissionsCache).forEach(k => delete _permissionsCache[k]);
      toast(`${role} permissions reset to defaults`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function save() {
    setSaving(true);
    try {
      await api('PUT', '/api/admin/permissions', { permissions });
      // Bust client-side cache so affected roles re-fetch on next page load
      Object.keys(_permissionsCache).forEach(k => delete _permissionsCache[k]);
      setOriginal(JSON.parse(JSON.stringify(permissions)));
      toast('Permissions saved', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const isDirty = JSON.stringify(permissions) !== JSON.stringify(original);
  const roles = Object.keys(ROLE_META);

  if (loading) {
    return (
      <>
        <div className="page-head"><h1 className="page-title">Feature Permissions</h1></div>
        <div className="page-content flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Feature Permissions</h1>
        <div className="flex items-center gap-2">
          {isDirty && (
            <button onClick={reset}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <RotateCcw size={14} /> Discard
            </button>
          )}
          <button onClick={save} disabled={saving || !isDirty}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${isDirty ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="page-content space-y-5">
        {/* Info banner */}
        <div className="card p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
          <div className="flex items-start gap-3">
            <ShieldCheck size={16} className="text-violet-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-violet-800 dark:text-violet-300">SuperAdmin always has full access.</p>
              <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
                Configure which features each role can access. Changes take effect immediately after saving.
              </p>
            </div>
          </div>
        </div>

        {/* Permission matrix */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-5 py-3 font-semibold text-gray-700 dark:text-gray-200 w-56">Feature</th>
                  {roles.map(role => {
                    const meta = ROLE_META[role];
                    const perms = permissions[role] || [];
                    const all = perms.length === ALL_FEATURE_KEYS.length;
                    const none = perms.length === 0;
                    return (
                      <th key={role} className="px-4 py-3 text-center min-w-[130px]">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                            <ShieldCheck size={10} /> {role}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <button onClick={() => toggleAll(role, true)}
                              className={`px-1.5 py-0.5 rounded hover:text-green-600 transition-colors ${all ? 'text-green-600 font-medium' : ''}`}>
                              All
                            </button>
                            <span>/</span>
                            <button onClick={() => toggleAll(role, false)}
                              className={`px-1.5 py-0.5 rounded hover:text-red-500 transition-colors ${none ? 'text-red-500 font-medium' : ''}`}>
                              None
                            </button>
                          </div>
                          <button onClick={() => resetToDefaults(role)}
                            title="Reset to system defaults"
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-violet-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
                            <RefreshCw size={9} /> Defaults
                          </button>
                          <div className="text-xs text-gray-400 font-normal">{perms.length}/{ALL_FEATURE_KEYS.length}</div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {FEATURE_SECTIONS.map(({ section, features }) => {
                  const sectionKeys = features.map(f => f.key);
                  return (
                    <>
                      {/* Section header row */}
                      <tr key={`section-${section}`} className="bg-gray-50 dark:bg-gray-800/60">
                        <td
                          colSpan={1}
                          className="px-5 py-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          {section}
                        </td>
                        {roles.map(role => {
                          const perms = permissions[role] || [];
                          const allOn = sectionKeys.every(k => perms.includes(k));
                          const allOff = sectionKeys.every(k => !perms.includes(k));
                          return (
                            <td key={role} className="px-4 py-2 text-center">
                              <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
                                <button
                                  onClick={() => toggleSection(role, sectionKeys, true)}
                                  className={`px-1.5 py-0.5 rounded hover:text-green-600 transition-colors ${allOn ? 'text-green-600 font-semibold' : ''}`}
                                >All</button>
                                <span>/</span>
                                <button
                                  onClick={() => toggleSection(role, sectionKeys, false)}
                                  className={`px-1.5 py-0.5 rounded hover:text-red-500 transition-colors ${allOff ? 'text-red-500 font-semibold' : ''}`}
                                >None</button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Feature rows */}
                      {features.map((feature, i) => (
                        <tr key={feature.key}
                          className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors
                            ${i % 2 === 0 ? '' : 'bg-gray-50/30 dark:bg-gray-800/10'}`}>
                          <td className="px-5 py-2.5 text-gray-700 dark:text-gray-300 pl-8">
                            {feature.label}
                          </td>
                          {roles.map(role => {
                            const checked = (permissions[role] || []).includes(feature.key);
                            return (
                              <td key={role} className="px-4 py-2.5 text-center">
                                <div className="flex justify-center">
                                  <Toggle checked={checked} onChange={() => toggle(role, feature.key)} />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-role summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map(role => {
            const meta = ROLE_META[role];
            const perms = permissions[role] || [];
            return (
              <div key={role} className={`card p-4 border-l-4 ${meta.ring}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                    <ShieldCheck size={10} /> {meta.label}
                  </span>
                  <span className="text-xs text-gray-400">{perms.length} / {ALL_FEATURE_KEYS.length} features</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {perms.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">No access</span>
                  ) : perms.map(f => {
                    const label = FEATURE_SECTIONS.flatMap(s => s.features).find(x => x.key === f)?.label || f;
                    return (
                      <span key={f} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded">
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
