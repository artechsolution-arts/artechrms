import { useState, useMemo } from 'react';
import { api } from '../../api';
import { Info, IndianRupee, RotateCcw } from 'lucide-react';
import Select from '../../components/Select';
import { useEffect } from 'react';

const fmt = n => n >= 10_00_000
  ? `₹${(n / 10_00_000).toFixed(2)}L`
  : n >= 1_000
  ? `₹${(n / 1_000).toFixed(1)}K`
  : `₹${Math.round(n)}`;

const TABS = [
  { key: 'summary',     label: 'Summary' },
  { key: 'employees',   label: 'Employee-wise' },
  { key: 'departments', label: 'Department-wise' },
];

export default function CompensationPlanner({ toast }) {
  const [hikeData, setHikeData]     = useState(null);
  const [hikePct, setHikePct]       = useState(10);
  const [filterDept, setFilterDept] = useState('All');
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('summary');
  const [empHikes, setEmpHikes]     = useState({});   // { [empId]: pct }

  useEffect(() => {
    api('GET', '/api/dashboard/hike-snapshot')
      .then(d => setHikeData(d))
      .catch(e => toast?.(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  function getHike(id) { return empHikes[id] ?? hikePct; }

  function setEmpHike(id, raw) {
    const val = Math.min(100, Math.max(0, Number(raw) || 0));
    setEmpHikes(prev => ({ ...prev, [id]: val }));
  }

  function resetEmpHike(id) {
    setEmpHikes(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function resetAllHikes() { setEmpHikes({}); }

  const overrideCount = Object.keys(empHikes).length;

  const result = useMemo(() => {
    if (!hikeData) return null;
    const emps = filterDept === 'All'
      ? hikeData.employees
      : hikeData.employees.filter(e => e.department === filterDept);

    const currentMonthly = emps.reduce((s, e) => s + e.gross_salary, 0);
    const hikeAmount     = emps.reduce((s, e) => s + e.gross_salary * (getHike(e.id) / 100), 0);
    const newMonthly     = currentMonthly + hikeAmount;
    const annualImpact   = hikeAmount * 12;

    const deptMap = {};
    emps.forEach(e => {
      const pct = getHike(e.id);
      if (!deptMap[e.department]) deptMap[e.department] = { current: 0, count: 0, hikeTotal: 0 };
      deptMap[e.department].current   += e.gross_salary;
      deptMap[e.department].hikeTotal += e.gross_salary * (pct / 100);
      deptMap[e.department].count     += 1;
    });
    const depts = Object.entries(deptMap)
      .map(([name, { current, count, hikeTotal }]) => ({
        name, count, current, increase: hikeTotal,
      }))
      .sort((a, b) => b.increase - a.increase);

    const empRows = emps
      .map(e => {
        const pct = getHike(e.id);
        return {
          ...e,
          customPct:   empHikes[e.id] !== undefined,
          pct,
          hikeAmt:     e.gross_salary * (pct / 100),
          newGross:    e.gross_salary + e.gross_salary * (pct / 100),
          annualExtra: e.gross_salary * (pct / 100) * 12,
        };
      })
      .sort((a, b) => b.annualExtra - a.annualExtra);

    return { currentMonthly, newMonthly, hikeAmount, annualImpact, depts, count: emps.length, empRows };
  }, [hikeData, hikePct, filterDept, empHikes]);

  const deptOptions = hikeData
    ? ['All', ...new Set(hikeData.employees.map(e => e.department))].map(d => ({ value: d, label: d }))
    : [{ value: 'All', label: 'All' }];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Compensation Planner</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Model salary revision scenarios and their impact on payroll costs
          </p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <Info size={12} /> Based on current gross salaries
        </span>
      </div>

      <div className="page-content space-y-5">
        {loading ? (
          <div className="card p-12 text-center text-sm text-gray-400">Loading salary data…</div>
        ) : !hikeData || hikeData.employees.length === 0 ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <IndianRupee size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No salary data available yet. Add basic salary to employees or run payroll first.
            </p>
          </div>
        ) : (
          <>
            {/* Controls card */}
            <div className="card p-5">
              <div className="flex flex-wrap items-end gap-6">
                <div className="flex-1 min-w-[240px]">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Default Hike —{' '}
                    <span style={{ color: 'var(--accent)' }} className="text-base font-bold">{hikePct}%</span>
                    {overrideCount > 0 && (
                      <span className="ml-2 text-[11px] text-amber-500 dark:text-amber-400 font-normal">
                        ({overrideCount} custom override{overrideCount > 1 ? 's' : ''})
                      </span>
                    )}
                  </label>
                  <input
                    type="range" min="1" max="50" step="1"
                    value={hikePct}
                    onChange={e => setHikePct(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                    <span>1%</span><span>10%</span><span>20%</span><span>30%</span><span>40%</span><span>50%</span>
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Department</label>
                    <Select
                      value={filterDept}
                      onChange={v => setFilterDept(v)}
                      options={deptOptions}
                      size="sm"
                      className="w-48"
                    />
                  </div>
                  {overrideCount > 0 && (
                    <button
                      onClick={resetAllHikes}
                      className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-xs font-medium border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                    >
                      <RotateCcw size={12} /> Reset all to default
                    </button>
                  )}
                </div>
              </div>
            </div>

            {result && (
              <div className="card">
                {/* Tabs */}
                <div className="card-head">
                  <div className="flex flex-wrap gap-2">
                    {TABS.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                          ${tab === t.key
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {result.count} employee{result.count !== 1 ? 's' : ''}
                    {filterDept !== 'All' ? ` · ${filterDept}` : ''}
                  </span>
                </div>

                {/* ── Summary tab ── */}
                {tab === 'summary' && (
                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Employees Affected', value: result.count,             sub: filterDept === 'All' ? 'All departments' : filterDept, color: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-50 dark:bg-blue-900/20' },
                        { label: 'Monthly Hike Cost',  value: fmt(result.hikeAmount),   sub: overrideCount > 0 ? `Blended (${overrideCount} custom)` : `+${hikePct}% on gross`, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                        { label: 'New Monthly Total',  value: fmt(result.newMonthly),   sub: `Current: ${fmt(result.currentMonthly)}`, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
                        { label: 'Annual Extra Cost',  value: fmt(result.annualImpact), sub: 'Additional per year', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                      ].map(({ label, value, sub, color, bg }) => (
                        <div key={label} className={`rounded-xl p-4 ${bg}`}>
                          <div className={`text-2xl font-bold ${color} leading-tight`}>{value}</div>
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-1">{label}</div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>
                        </div>
                      ))}
                    </div>

                    {result.depts.length > 1 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Department Overview</div>
                        <div className="space-y-2.5">
                          {result.depts.map(d => (
                            <div key={d.name} className="flex items-center gap-3">
                              <span className="text-xs text-gray-600 dark:text-gray-400 w-32 truncate flex-shrink-0">{d.name}</span>
                              <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                                <div
                                  className="h-full rounded-lg transition-[width] duration-300 ease-out"
                                  style={{ width: `${result.hikeAmount > 0 ? (d.increase / result.hikeAmount) * 100 : 0}%`, backgroundColor: 'var(--accent)', opacity: 0.75 }}
                                />
                                <span className="absolute inset-0 flex items-center px-2 text-[10px] font-semibold text-gray-700 dark:text-gray-200">
                                  +{fmt(d.increase)}/mo &nbsp;·&nbsp; {d.count} emp
                                </span>
                              </div>
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-16 text-right flex-shrink-0">
                                +{fmt(d.increase * 12)}/yr
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Employee-wise tab ── */}
                {tab === 'employees' && (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Department</th>
                          <th>Designation</th>
                          <th className="text-right">Current Gross / mo</th>
                          <th className="text-center">Hike %</th>
                          <th className="text-right">Hike Amount</th>
                          <th className="text-right">New Gross / mo</th>
                          <th className="text-right">Annual Extra</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.empRows.map(e => (
                          <tr key={e.id}>
                            <td className="font-medium">{e.name}</td>
                            <td>{e.department}</td>
                            <td>{e.designation || '—'}</td>
                            <td className="text-right font-mono">
                              {e.gross_salary > 0 ? fmt(e.gross_salary) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                            </td>
                            <td className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="0" max="100" step="1"
                                  value={e.pct}
                                  onChange={ev => setEmpHike(e.id, ev.target.value)}
                                  className={`form-input text-center text-xs py-1 w-16 ${
                                    e.customPct
                                      ? 'border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-400 font-semibold'
                                      : ''
                                  }`}
                                />
                                <span className="text-xs text-gray-400">%</span>
                                {e.customPct && (
                                  <button
                                    onClick={() => resetEmpHike(e.id)}
                                    title="Reset to default"
                                    className="text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors"
                                  >
                                    <RotateCcw size={11} />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="text-right font-mono text-amber-600 dark:text-amber-400">
                              {e.gross_salary > 0 ? `+${fmt(e.hikeAmt)}` : '—'}
                            </td>
                            <td className="text-right font-mono text-green-600 dark:text-green-400 font-semibold">
                              {e.newGross > 0 ? fmt(e.newGross) : '—'}
                            </td>
                            <td className="text-right font-mono text-rose-600 dark:text-rose-400">
                              {e.gross_salary > 0 ? `+${fmt(e.annualExtra)}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 dark:border-gray-600 font-semibold">
                          <td colSpan={3} className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                            Total — {result.count} employees
                          </td>
                          <td className="text-right font-mono px-4 py-2.5">{fmt(result.currentMonthly)}</td>
                          <td className="px-4 py-2.5" />
                          <td className="text-right font-mono text-amber-600 dark:text-amber-400 px-4 py-2.5">+{fmt(result.hikeAmount)}</td>
                          <td className="text-right font-mono text-green-600 dark:text-green-400 px-4 py-2.5">{fmt(result.newMonthly)}</td>
                          <td className="text-right font-mono text-rose-600 dark:text-rose-400 px-4 py-2.5">+{fmt(result.annualImpact)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* ── Department-wise tab ── */}
                {tab === 'departments' && (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th className="text-right">Employees</th>
                          <th className="text-right">Current Monthly</th>
                          <th className="text-right">Monthly Hike</th>
                          <th className="text-right">New Monthly</th>
                          <th className="text-right">Annual Extra</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.depts.map(d => (
                          <tr key={d.name}>
                            <td className="font-medium">{d.name}</td>
                            <td className="text-right">{d.count}</td>
                            <td className="text-right font-mono">{d.current > 0 ? fmt(d.current) : '—'}</td>
                            <td className="text-right font-mono text-amber-600 dark:text-amber-400">+{fmt(d.increase)}</td>
                            <td className="text-right font-mono text-green-600 dark:text-green-400 font-semibold">{fmt(d.current + d.increase)}</td>
                            <td className="text-right font-mono text-rose-600 dark:text-rose-400">+{fmt(d.increase * 12)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 dark:border-gray-600 font-semibold">
                          <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">Total</td>
                          <td className="text-right px-4 py-2.5">{result.count}</td>
                          <td className="text-right font-mono px-4 py-2.5">{fmt(result.currentMonthly)}</td>
                          <td className="text-right font-mono text-amber-600 dark:text-amber-400 px-4 py-2.5">+{fmt(result.hikeAmount)}</td>
                          <td className="text-right font-mono text-green-600 dark:text-green-400 px-4 py-2.5">{fmt(result.newMonthly)}</td>
                          <td className="text-right font-mono text-rose-600 dark:text-rose-400 px-4 py-2.5">+{fmt(result.annualImpact)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
