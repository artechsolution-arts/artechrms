import { useState, useEffect } from 'react';
import { api } from '../../api';
import { ShieldCheck, Save, RotateCcw } from 'lucide-react';

const ROLE_META = {
  Admin:    { label: 'Admin (HR Manager)', color: 'bg-blue-100 text-blue-700',   ring: 'ring-blue-400' },
  Manager:  { label: 'Manager',            color: 'bg-cyan-100 text-cyan-700',   ring: 'ring-cyan-400' },
  'HR User':{ label: 'HR User',            color: 'bg-green-100 text-green-700', ring: 'ring-green-400' },
};

const FEATURE_LABELS = {
  dashboard:         'Dashboard',
  employees:         'Employees',
  departments:       'Departments',
  designations:      'Designations',
  leaves:            'Leaves',
  'leave-types':     'Leave Types',
  'leave-balances':  'Leave Balances',
  attendance:        'Attendance',
  holidays:          'Holidays',
  announcements:     'Announcements',
  'salary-slips':    'Salary Slips',
  'payroll-entry':   'Payroll Entry',
  'salary-components': 'Salary Components',
  expenses:          'Expenses',
  assets:            'Assets',
  'job-openings':    'Job Openings',
  applicants:        'Applicants',
  appraisals:        'Appraisals',
  'document-requests': 'Document Requests',
};

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
  const [allFeatures, setAllFeatures] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('GET', '/api/admin/permissions')
      .then(data => {
        setAllFeatures(data.all_features || []);
        setPermissions(data.permissions || {});
        setOriginal(data.permissions || {});
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

  function toggleAll(role, enable) {
    setPermissions(prev => ({
      ...prev,
      [role]: enable ? [...allFeatures] : [],
    }));
  }

  function reset() {
    setPermissions(JSON.parse(JSON.stringify(original)));
  }

  async function save() {
    setSaving(true);
    try {
      await api('PUT', '/api/admin/permissions', permissions);
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
                Configure which features each role can access in the HR dashboard. Changes take effect immediately after saving.
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
                  <th className="text-left px-5 py-3 font-semibold text-gray-700 dark:text-gray-200 w-48">Feature</th>
                  {roles.map(role => {
                    const meta = ROLE_META[role];
                    const perms = permissions[role] || [];
                    const all = perms.length === allFeatures.length;
                    const none = perms.length === 0;
                    return (
                      <th key={role} className="px-4 py-3 text-center min-w-[140px]">
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
                          <div className="text-xs text-gray-400 font-normal">{perms.length}/{allFeatures.length}</div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature, i) => (
                  <tr key={feature}
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors
                      ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}>
                    <td className="px-5 py-3 font-medium text-gray-700 dark:text-gray-200">
                      {FEATURE_LABELS[feature] || feature}
                    </td>
                    {roles.map(role => {
                      const checked = (permissions[role] || []).includes(feature);
                      return (
                        <td key={role} className="px-4 py-3 text-center">
                          <div className="flex justify-center">
                            <Toggle checked={checked} onChange={() => toggle(role, feature)} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
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
                  <span className="text-xs text-gray-400">{perms.length} features</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {perms.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">No access</span>
                  ) : perms.map(f => (
                    <span key={f} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded">
                      {FEATURE_LABELS[f] || f}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
