import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { RotateCcw, BookOpen, Search, ChevronDown, ChevronLeft, ChevronRight, Check, X, Pencil, Save } from 'lucide-react';
import EmpAvatar from '../components/EmpAvatar';
import ConfirmModal from '../components/ConfirmModal';
import DatePicker from '../components/DatePicker';

// ── Searchable employee dropdown ────────────────────────────────
function EmpDropdown({ value, onChange, employees }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(''); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = employees.filter(e =>
    !search || e.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = employees.find(e => String(e.id) === String(value));

  const select = (id) => { onChange(id); setOpen(false); setSearch(''); };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-lg border text-sm bg-white dark:bg-gray-900 transition-all min-w-[180px] ${
          open
            ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        {selected ? (
          <EmpAvatar name={selected.full_name} photo={selected.profile_photo} size="xs" colorIndex={selected.id} rounded="rounded-full" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        )}
        <span className="flex-1 text-left text-gray-700 dark:text-gray-300 truncate">
          {selected ? selected.full_name : 'All Employees'}
        </span>
        <div className="flex items-center gap-0.5 ml-1">
          {value && (
            <span
              onClick={e => { e.stopPropagation(); select(''); }}
              className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown size={13} className={`text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                className="w-full pl-7 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] text-gray-700 dark:text-gray-300 placeholder-gray-400"
                placeholder="Search employee…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-56 py-1">
            {/* All employees option */}
            <button
              onClick={() => select('')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                !value
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] text-gray-400">All</span>
              </div>
              <span className="flex-1 text-left font-medium">All Employees</span>
              {!value && <Check size={12} className="text-[var(--accent)]" />}
            </button>

            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No employees found</p>
            ) : filtered.map((e, i) => (
              <button
                key={e.id}
                onClick={() => select(String(e.id))}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  String(e.id) === String(value)
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <EmpAvatar name={e.full_name} photo={e.profile_photo} size="xs" colorIndex={i} rounded="rounded-full" />
                <span className="flex-1 text-left truncate">{e.full_name}</span>
                {String(e.id) === String(value) && <Check size={12} className="text-[var(--accent)] flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Leave progress bar ──────────────────────────────────────────
function LeaveBar({ available, allocated }) {
  if (!allocated) return null;
  const used = allocated - available;
  const usedPct = Math.min((used / allocated) * 100, 100);
  const color = usedPct >= 90 ? 'bg-red-500' : usedPct >= 60 ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${usedPct}%` }} />
    </div>
  );
}

// ── Employee card ───────────────────────────────────────────────
function EmployeeCard({ empId, name, photo, balances, leaveTypes, colorIdx, year, onEditSaved, toast }) {
  const totalAllocated = balances.reduce((s, b) => s + (b.allocated || 0), 0);
  const totalAvailable = balances.reduce((s, b) => s + (b.available || 0), 0);
  const totalUsed      = totalAllocated - totalAvailable;

  const [editing, setEditing] = useState(false);
  const [editVals, setEditVals] = useState({});
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    const init = {};
    leaveTypes.forEach(lt => {
      const b = balances.find(x => x.leave_type_id === lt.id);
      init[`alloc_${lt.id}`] = b ? String(b.allocated) : '0';
      init[`used_${lt.id}`]  = b ? String(b.used ?? 0)  : '0';
    });
    setEditVals(init);
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      for (const lt of leaveTypes) {
        const b = balances.find(x => x.leave_type_id === lt.id);
        const allocated = parseFloat(editVals[`alloc_${lt.id}`]) || 0;
        const used      = parseFloat(editVals[`used_${lt.id}`])  || 0;
        await api('POST', '/api/hrm/leave-balances/allocate', {
          employee_id: parseInt(empId),
          leave_type_id: lt.id,
          year,
          allocated,
        });
        if (b) {
          await api('POST', '/api/hrm/leave-balances/set-used', {
            employee_id: parseInt(empId),
            leave_type_id: lt.id,
            year,
            used,
          });
        }
      }
      toast('Leave balances updated', 'success');
      setEditing(false);
      onEditSaved();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3">
        <EmpAvatar name={name} photo={photo} size="md" colorIndex={colorIdx} rounded="rounded-full" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{totalUsed} used · {totalAvailable} remaining</p>
        </div>
        {editing ? (
          <button
            onClick={saveEdit}
            disabled={saving}
            className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            <Save size={11} /> {saving ? 'Saving…' : 'Save'}
          </button>
        ) : (
          <button
            onClick={openEdit}
            className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-[var(--accent)] px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Pencil size={11} /> Edit
          </button>
        )}
      </div>

      {/* Leave type rows */}
      <div className="space-y-2.5">
        {leaveTypes.map(lt => {
          const b = balances.find(x => x.leave_type_id === lt.id);
          if (!b && !editing) return null;
          return (
            <div key={lt.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate pr-2">{lt.name}</span>
                {editing ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col items-center gap-0.5">
                      <input
                        type="number" min={0} step={0.5}
                        className="w-14 text-xs text-center border border-amber-300 dark:border-amber-700 rounded-md px-1 py-0.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        value={editVals[`used_${lt.id}`] ?? (b ? b.used : 0)}
                        onChange={e => setEditVals(prev => ({ ...prev, [`used_${lt.id}`]: e.target.value }))}
                      />
                      <span className="text-[9px] text-amber-500">taken</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <input
                        type="number" min={0} step={0.5}
                        className="w-14 text-xs text-center border border-gray-200 dark:border-gray-600 rounded-md px-1 py-0.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        value={editVals[`alloc_${lt.id}`] ?? (b ? b.allocated : 0)}
                        onChange={e => setEditVals(prev => ({ ...prev, [`alloc_${lt.id}`]: e.target.value }))}
                      />
                      <span className="text-[9px] text-gray-400">total</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-[10px] text-gray-400">
                      <span className="text-gray-500 dark:text-gray-400">{b?.used ?? 0}</span> taken
                    </span>
                    <span className="text-xs">
                      <span className={`font-semibold ${(b?.available ?? 0) === 0 ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>
                        {b?.available ?? 0}
                      </span>
                      <span className="text-gray-400">/{b?.allocated ?? 0}</span>
                    </span>
                  </div>
                )}
              </div>
              {!editing && <LeaveBar available={b?.available ?? 0} allocated={b?.allocated ?? 0} />}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {!editing && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-1 text-center">
          <div>
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{totalAllocated}</div>
            <div className="text-[10px] text-gray-400">Total</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-amber-600">{totalUsed}</div>
            <div className="text-[10px] text-gray-400">Taken</div>
          </div>
          <div>
            <div className={`text-xs font-semibold ${totalAvailable === 0 ? 'text-red-500' : 'text-emerald-600'}`}>{totalAvailable}</div>
            <div className="text-[10px] text-gray-400">Balance</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────
export default function LeaveBalances({ toast }) {
  const [rows,       setRows]       = useState([]);
  const [employees,  setEmps]       = useState([]);
  const [leaveTypes, setLTs]        = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [year,       setYear]       = useState(new Date().getFullYear());
  const [filterEmp,  setFilterEmp]  = useState('');
  const [search,     setSearch]     = useState('');
  const [initializing, setInitializing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [bal, emps, lts] = await Promise.all([
        api('GET', `/api/hrm/leave-balances?year=${year}${filterEmp ? `&employee_id=${filterEmp}` : ''}`),
        api('GET', '/api/employees?all=true'),
        api('GET', '/api/leaves/types'),
      ]);
      setRows(bal); setEmps(emps); setLTs(lts);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [year, filterEmp]);

  const initializeAll = async () => {
    setConfirmDialog({
      title: 'Initialize Leave Balances',
      message: `Initialize leave balance records for all active employees for ${year}?\n\nThis only creates missing records (allocated = 0). Existing HR-set balances will NOT be changed.`,
      confirmLabel: 'Initialize',
      danger: false,
      onConfirm: async () => {
        setConfirmDialog(null);
        setInitializing(true);
        try {
          const res = await api('POST', '/api/hrm/leave-balances/allocate-all', { year });
          toast(`Done — ${res.created} records created, ${res.skipped} already exist`, 'success');
          load();
        } catch (e) { toast(e.message, 'error'); }
        finally { setInitializing(false); }
      }
    });
    return;
  };

  const grouped = rows.reduce((acc, b) => {
    const key = b.employee_id;
    if (!acc[key]) acc[key] = { name: b.employee_name, photo: b.profile_photo, balances: [] };
    acc[key].balances.push(b);
    return acc;
  }, {});

  const entries = Object.entries(grouped).filter(([, { name }]) =>
    !search || name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Leave Balances</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setYear(y => y - 1)} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"><ChevronLeft size={14} /></button>
            <span className="px-3 py-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg">{year}</span>
            <button type="button" onClick={() => setYear(y => y + 1)} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"><ChevronRight size={14} /></button>
          </div>
          <EmpDropdown value={filterEmp} onChange={setFilterEmp} employees={employees} />
          <button onClick={initializeAll} disabled={initializing} className="btn btn-secondary btn-sm gap-1.5">
            <RotateCcw size={13} className={initializing ? 'animate-spin' : ''} />
            {initializing ? 'Initializing…' : 'Initialize Balances'}
          </button>
        </div>
      </div>

      <div className="page-content space-y-4">
        {!loading && entries.length > 0 && (
          <>
            {/* Search */}
            <div className="relative max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="form-input pl-8 text-sm w-full"
                placeholder="Search employee…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse space-y-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="space-y-1">
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                    <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full w-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <BookOpen size={36} className="text-gray-200 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-500">
                {search ? `No employees matching "${search}"` : `No leave balances for ${year}`}
              </p>
              {!search && (
                <button onClick={initializeAll} disabled={initializing} className="btn btn-primary btn-sm mt-3 gap-1.5">
                  <RotateCcw size={13} /> Initialize Balances for {year}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {entries.map(([empId, { name, photo, balances }], idx) => (
              <EmployeeCard
                key={empId}
                empId={empId}
                name={name}
                photo={photo}
                balances={balances}
                leaveTypes={leaveTypes}
                colorIdx={idx}
                year={year}
                onEditSaved={load}
                toast={toast}
              />
            ))}
          </div>
        )}
      </div>
      <ConfirmModal
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        danger={confirmDialog?.danger}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </>
  );
}
