import { useState, useEffect } from 'react';
import { api } from '../api';
import { RotateCcw, BookOpen } from 'lucide-react';

export default function LeaveBalances({ toast }) {
  const [rows, setRows]       = useState([]);
  const [employees, setEmps]  = useState([]);
  const [leaveTypes, setLTs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear]       = useState(new Date().getFullYear());
  const [filterEmp, setFilterEmp] = useState('');
  const [allocating, setAllocating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [bal, emps, lts] = await Promise.all([
        api('GET', `/api/hrm/leave-balances?year=${year}${filterEmp ? `&employee_id=${filterEmp}` : ''}`),
        api('GET', '/api/employees'),
        api('GET', '/api/leaves/types'),
      ]);
      setRows(bal);
      setEmps(emps);
      setLTs(lts);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [year, filterEmp]);

  const allocateAll = async () => {
    if (!confirm(`Allocate leave balances for all active employees for ${year}?`)) return;
    setAllocating(true);
    try {
      const res = await api('POST', '/api/hrm/leave-balances/allocate-all', { year });
      toast(`Done — ${res.created} created, ${res.updated} updated`, 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setAllocating(false); }
  };

  const grouped = rows.reduce((acc, b) => {
    const key = b.employee_id;
    if (!acc[key]) acc[key] = { name: b.employee_name, balances: [] };
    acc[key].balances.push(b);
    return acc;
  }, {});

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Leave Balances</h1>
        <div className="flex gap-2">
          <select className="form-select w-28 text-sm" value={year} onChange={e => setYear(+e.target.value)}>
            {[2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
          </select>
          <select className="form-select text-sm w-44" value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
          <button onClick={allocateAll} disabled={allocating} className="btn btn-secondary btn-sm gap-1.5">
            <RotateCcw size={13} className={allocating ? 'animate-spin' : ''}/>
            {allocating ? 'Allocating…' : 'Auto-Allocate'}
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="card p-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <BookOpen size={36} className="text-gray-200 mb-2"/>
              <p className="text-sm text-gray-500">No leave balances for {year}. Use Auto-Allocate to initialize.</p>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  {leaveTypes.map(lt => (
                    <th key={lt.id} className="text-center">{lt.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([empId, { name, balances }]) => (
                  <tr key={empId}>
                    <td className="font-medium text-gray-900 dark:text-gray-100">{name}</td>
                    {leaveTypes.map(lt => {
                      const b = balances.find(x => x.leave_type_id === lt.id);
                      return (
                        <td key={lt.id} className="text-center">
                          {b ? (
                            <div>
                              <span className="font-semibold text-gray-800 dark:text-gray-100">{b.available}</span>
                              <span className="text-xs text-gray-400 ml-1">/ {b.allocated}</span>
                            </div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
