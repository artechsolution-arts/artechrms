import { useState, useEffect } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import DatePicker from '../components/DatePicker';
import {
  Plus, RefreshCw, Search, Pencil, Trash2, Eye, EyeOff,
  Monitor, Undo2, ChevronDown, ChevronUp,
  LayoutList, LayoutGrid, X,
  Phone, Mail, Calendar, Building2, Briefcase, CreditCard,
  User, AlertCircle,
} from 'lucide-react';

function Avatar({ name, photo, size = 'sm' }) {
  const dim = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  if (photo) {
    return <img src={photo} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white font-bold flex items-center justify-center flex-shrink-0`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

const PT_STATES = ['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Other'];
const ASSET_TYPES = ['Laptop', 'Desktop', 'Mobile', 'Tablet', 'Mouse & Keyboard', 'Monitor', 'Headset', 'Access Card', 'Sim Card', 'Bag', 'Chair', 'Other'];

function calcLivePayroll(form) {
  const basic = parseFloat(form.basic_salary) || 0;
  const hraPct = parseFloat(form.hra_percent) || 40;
  const special = parseFloat(form.special_allowance) || 0;
  const lta = parseFloat(form.lta) || 0;
  const other = parseFloat(form.other_allowance) || 0;
  const pfApplicable = form.pf_applicable !== false && form.pf_applicable !== 'false';
  const esiApplicable = form.esi_applicable !== false && form.esi_applicable !== 'false';
  const ptState = form.pt_state || 'Karnataka';

  if (!basic) return null;

  const hra = Math.round(basic * hraPct / 100);
  const gross = basic + hra + special + lta + other;
  const pfEmp = pfApplicable ? Math.round(Math.min(basic * 0.12, 1800)) : 0;
  const esiEmp = (gross <= 21000 && esiApplicable) ? Math.round(gross * 0.0075) : 0;

  let pt = 0;
  const state = ptState.toLowerCase();
  if (state === 'karnataka') {
    pt = gross > 15000 ? 200 : gross > 10000 ? 150 : 0;
  } else if (state === 'maharashtra') {
    pt = gross > 10000 ? 200 : 0;
  } else if (['tamil nadu', 'andhra pradesh', 'telangana'].includes(state)) {
    pt = gross > 15000 ? 208 : 0;
  }

  return { gross, net: gross - pfEmp - esiEmp - pt };
}

const PAGE_SIZE = 50;

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="text-xs text-gray-400 w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-gray-800 dark:text-gray-200 font-medium flex-1">{value}</span>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="mb-4">
      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-5">{title}</h4>
      <div className="px-5 divide-y divide-gray-100 dark:divide-gray-800">{children}</div>
    </div>
  );
}

export default function Employees({ toast }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [depts, setDepts] = useState([]);
  const [desigs, setDesigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [empAssets, setEmpAssets] = useState([]);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetForm, setAssetForm] = useState({ asset_name: '', asset_type: '', serial_number: '', condition: 'Good', allocated_date: new Date().toISOString().slice(0, 10), notes: '' });

  const [viewMode, setViewMode] = useState(() => localStorage.getItem('emp-view-mode') || 'list');
  const [detailEmp, setDetailEmp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [joinedMonthFilter, setJoinedMonthFilter] = useState('');
  const [joinedMonthLabel, setJoinedMonthLabel] = useState('');

  const load = async (s = search, d = deptFilter, st = statusFilter, pg = page, jm = joinedMonthFilter) => {
    setLoading(true);
    try {
      let url = `/api/employees?page=${pg}&page_size=${PAGE_SIZE}&`;
      if (s) url += `search=${encodeURIComponent(s)}&`;
      if (d) url += `department_id=${d}&`;
      if (st) url += `status=${st}&`;
      if (jm) url += `joined_month=${jm}&`;
      const res = await api('GET', url);
      setRows(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const changePage = (pg) => { setPage(pg); load(search, deptFilter, statusFilter, pg, joinedMonthFilter); };

  useEffect(() => {
    Promise.all([api('GET', '/api/employees/departments'), api('GET', '/api/employees/designations')])
      .then(([d, de]) => {
        setDepts(d);
        setDesigs(de);
        try {
          const pending = sessionStorage.getItem('nav-filter');
          if (pending) {
            sessionStorage.removeItem('nav-filter');
            const f = JSON.parse(pending);
            if (f.joinedMonth) {
              setJoinedMonthFilter(f.joinedMonth);
              setJoinedMonthLabel(f.joinedLabel || f.joinedMonth);
              load(search, deptFilter, statusFilter, 1, f.joinedMonth);
              return;
            }
            if (f.deptName) {
              const match = d.find(dep => dep.name === f.deptName);
              if (match) {
                const id = String(match.id);
                setDeptFilter(id);
                load(search, id, statusFilter, 1);
                return;
              }
            }
          }
        } catch {}
        load();
      })
      .catch(e => toast(e.message, 'error'));
  }, []);

  const switchView = (v) => { setViewMode(v); localStorage.setItem('emp-view-mode', v); };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setDetailEmp({ id, _loading: true });
    try {
      const [emp, contacts, assets] = await Promise.all([
        api('GET', `/api/employees/${id}`),
        api('GET', `/api/hrm/employees/${id}/emergency-contacts`).catch(() => []),
        api('GET', `/api/hrm/assets?employee_id=${id}`).catch(() => []),
      ]);
      const ec = contacts[0] || {};
      setDetailEmp({ ...emp, _ec: ec, _assets: assets });
    } catch (e) { toast(e.message, 'error'); setDetailEmp(null); }
    finally { setDetailLoading(false); }
  };

  const openAdd = () => {
    setForm({
      employment_type: 'Full-time', status: 'Active',
      hra_percent: 40, special_allowance: 0, lta: 0, other_allowance: 0,
      pf_applicable: true, esi_applicable: true, pt_state: 'Karnataka',
      ec_name: '', ec_relationship: '', ec_phone: '', ec_id: null,
    });
    setEmpAssets([]);
    setShowAssetForm(false);
    setModal({ mode: 'add' });
  };

  const openEdit = async (id) => {
    try {
      const [e, contacts, assets] = await Promise.all([
        api('GET', `/api/employees/${id}`),
        api('GET', `/api/hrm/employees/${id}/emergency-contacts`).catch(() => []),
        api('GET', `/api/hrm/assets?employee_id=${id}`).catch(() => []),
      ]);
      const primary = contacts[0] || {};
      setForm({
        ...e,
        ec_name: primary.name || '',
        ec_relationship: primary.relationship_type || '',
        ec_phone: primary.phone || '',
        ec_id: primary.id || null,
      });
      setEmpAssets(assets);
      setShowAssetForm(false);
      setAssetForm({ asset_name: '', asset_type: '', serial_number: '', condition: 'Good', allocated_date: new Date().toISOString().slice(0, 10), notes: '' });
      setModal({ mode: 'edit', id });
    } catch (e) { toast(e.message, 'error'); }
  };

  const allocateAsset = async () => {
    if (!assetForm.asset_name.trim() || !assetForm.asset_type) return toast('Asset name and type are required', 'warning');
    try {
      await api('POST', '/api/hrm/assets', { ...assetForm, employee_id: modal.id });
      toast('Asset allocated', 'success');
      const updated = await api('GET', `/api/hrm/assets?employee_id=${modal.id}`);
      setEmpAssets(updated);
      setAssetForm({ asset_name: '', asset_type: '', serial_number: '', condition: 'Good', allocated_date: new Date().toISOString().slice(0, 10), notes: '' });
      setShowAssetForm(false);
    } catch (e) { toast(e.message, 'error'); }
  };

  const returnAsset = async (assetId) => {
    try {
      await api('PUT', `/api/hrm/assets/${assetId}/return`, { condition: 'Good', returned_date: new Date().toISOString().slice(0, 10) });
      toast('Asset returned', 'success');
      const updated = await api('GET', `/api/hrm/assets?employee_id=${modal.id}`);
      setEmpAssets(updated);
    } catch (e) { toast(e.message, 'error'); }
  };

  const save = async () => {
    if (!form.first_name?.trim()) return toast('First name is required', 'warning');
    if (!form.date_of_joining) return toast('Date of joining is required', 'warning');
    if (modal.mode === 'add') {
      if (!form.username?.trim()) return toast('Username is required', 'warning');
      if (!form.email?.trim()) return toast('Email is required', 'warning');
      if (form.password?.trim() && form.password.length < 6) return toast('Password must be at least 6 characters', 'warning');
    }
    setSaving(true);
    try {
      const salaryFields = {
        basic_salary: form.basic_salary ? parseFloat(form.basic_salary) : null,
        hra_percent: parseFloat(form.hra_percent) || 40.0,
        special_allowance: parseFloat(form.special_allowance) || 0.0,
        lta: parseFloat(form.lta) || 0.0,
        other_allowance: parseFloat(form.other_allowance) || 0.0,
        pf_applicable: form.pf_applicable !== false && form.pf_applicable !== 'false',
        esi_applicable: form.esi_applicable !== false && form.esi_applicable !== 'false',
        pt_state: form.pt_state || 'Karnataka',
      };
      const bankFields = {
        bank_name: form.bank_name || null, bank_account_no: form.bank_account_no || null,
        bank_ifsc: form.bank_ifsc || null, bank_branch: form.bank_branch || null,
        aadhar_no: form.aadhar_no || null, pan_no: form.pan_no || null,
      };

      if (modal.mode === 'add') {
        const result = await api('POST', '/api/employees', {
          first_name: form.first_name, last_name: form.last_name || null,
          email: form.email, mobile: form.mobile || null,
          gender: form.gender || null, date_of_joining: form.date_of_joining,
          date_of_birth: form.date_of_birth || null,
          department_id: form.department_id ? parseInt(form.department_id) : null,
          designation_id: form.designation_id ? parseInt(form.designation_id) : null,
          employment_type: form.employment_type, username: form.username, password: form.password,
          ...salaryFields, ...bankFields,
        });
        if (form.ec_name?.trim()) {
          await api('POST', `/api/hrm/employees/${result.id}/emergency-contacts`, {
            name: form.ec_name.trim(), relationship_type: form.ec_relationship || 'Other',
            phone: form.ec_phone || '', is_primary: true,
          }).catch(() => {});
        }
        toast('Employee added successfully', 'success');
      } else {
        await api('PUT', `/api/employees/${modal.id}`, {
          first_name: form.first_name, last_name: form.last_name || null,
          email: form.email || null, mobile: form.mobile || null,
          gender: form.gender || null, date_of_joining: form.date_of_joining,
          date_of_birth: form.date_of_birth || null, status: form.status,
          department_id: form.department_id ? parseInt(form.department_id) : null,
          designation_id: form.designation_id ? parseInt(form.designation_id) : null,
          employment_type: form.employment_type,
          ...salaryFields, ...bankFields,
        });
        if (form.ec_name?.trim()) {
          if (form.ec_id) {
            await api('PUT', `/api/hrm/emergency-contacts/${form.ec_id}`, {
              name: form.ec_name.trim(), relationship_type: form.ec_relationship || 'Other',
              phone: form.ec_phone || '', is_primary: true,
            }).catch(() => {});
          } else {
            await api('POST', `/api/hrm/employees/${modal.id}/emergency-contacts`, {
              name: form.ec_name.trim(), relationship_type: form.ec_relationship || 'Other',
              phone: form.ec_phone || '', is_primary: true,
            }).catch(() => {});
          }
        }
        toast('Employee saved', 'success');
      }
      setModal(null);
      load();
      if (detailEmp?.id === modal.id) openDetail(modal.id);
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const del = async (id, name) => {
    if (!confirm(`Delete employee "${name}"? This cannot be undone.`)) return;
    try {
      await api('DELETE', `/api/employees/${id}`);
      toast('Employee deleted', 'success');
      if (detailEmp?.id === id) setDetailEmp(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const f = v => setForm(prev => ({ ...prev, ...v }));
  const liveCalc = calcLivePayroll(form);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Employee List</h1>
          {joinedMonthLabel ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white flex items-center gap-1" style={{ backgroundColor: 'var(--accent)' }}>
                Hired in {joinedMonthLabel}
                <button onClick={() => { setJoinedMonthFilter(''); setJoinedMonthLabel(''); setPage(1); load(search, deptFilter, statusFilter, 1, ''); }} className="ml-0.5 opacity-70 hover:opacity-100">×</button>
              </span>
              {total > 0 && <span className="text-xs text-gray-500">{total} employee{total !== 1 ? 's' : ''}</span>}
            </div>
          ) : (
            total > 0 && <p className="text-xs text-gray-500 mt-0.5">{total} total employees</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => switchView('list')}
              className={`p-1.5 transition-colors ${viewMode === 'list' ? 'text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              style={viewMode === 'list' ? { backgroundColor: 'var(--accent)' } : {}}
              title="List view"
            >
              <LayoutList size={15} />
            </button>
            <button
              onClick={() => switchView('grid')}
              className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              style={viewMode === 'grid' ? { backgroundColor: 'var(--accent)' } : {}}
              title="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
          <button onClick={() => { setPage(1); load(search, deptFilter, statusFilter, 1); }} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={openAdd} className="btn btn-primary btn-sm gap-1.5"><Plus size={13} /> Add Employee</button>
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="card mb-4">
          <div className="p-3 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="form-input pl-8"
                placeholder="Search by name, email, ID..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); load(e.target.value, deptFilter, statusFilter, 1); }}
              />
            </div>
            <select className="form-select w-auto min-w-[160px]" value={deptFilter}
              onChange={e => { setDeptFilter(e.target.value); setPage(1); load(search, e.target.value, statusFilter, 1); }}>
              <option value="">All Departments</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="form-select w-auto" value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); load(search, deptFilter, e.target.value, 1); }}>
              <option value="">All Status</option>
              <option>Active</option><option>Inactive</option><option>Left</option>
            </select>
          </div>
        </div>

        {/* ── LIST VIEW ── */}
        {viewMode === 'list' && (
          <div className="card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th><th>Department</th><th>Designation</th>
                    <th>Date of Joining</th><th>Basic Salary</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon">👤</div>
                        <h3 className="text-sm font-semibold text-gray-700 mt-2">No employees found</h3>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or add a new employee</p>
                      </div>
                    </td></tr>
                  ) : rows.map(e => (
                    <tr
                      key={e.id}
                      className="cursor-pointer hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
                      onClick={() => openDetail(e.id)}
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={e.full_name} photo={e.profile_photo} />
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{e.full_name}</div>
                            <div className="text-xs text-gray-400">
                              <code className="bg-gray-100 px-1 rounded text-[10px]">{e.employee_id}</code>
                              {e.email && <span className="ml-1">· {e.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-600">{e.department || <span className="text-gray-300">—</span>}</td>
                      <td className="text-gray-600">{e.designation || <span className="text-gray-300">—</span>}</td>
                      <td className="text-gray-600">{e.date_of_joining || '—'}</td>
                      <td className="text-gray-700 font-medium">
                        {e.basic_salary ? `₹${Number(e.basic_salary).toLocaleString()}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td><Badge text={e.status} /></td>
                      <td onClick={ev => ev.stopPropagation()}>
                        <button
                          onClick={() => del(e.id, e.full_name)}
                          className="btn btn-danger btn-xs gap-1"
                        >
                          <Trash2 size={11} />Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-500">
                  Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} employees
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => changePage(page - 1)} disabled={page === 1} className="btn btn-secondary btn-xs disabled:opacity-40">← Prev</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pg;
                    if (totalPages <= 7) pg = i + 1;
                    else if (page <= 4) pg = i + 1;
                    else if (page >= totalPages - 3) pg = totalPages - 6 + i;
                    else pg = page - 3 + i;
                    return (
                      <button key={pg} onClick={() => changePage(pg)}
                        className={`w-7 h-7 text-xs rounded font-medium transition-all ${pg === page ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        style={pg === page ? { backgroundColor: 'var(--accent)' } : {}}>{pg}</button>
                    );
                  })}
                  <button onClick={() => changePage(page + 1)} disabled={page === totalPages} className="btn btn-secondary btn-xs disabled:opacity-40">Next →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── GRID VIEW ── */}
        {viewMode === 'grid' && (
          <>
            {loading ? (
              <div className="card p-10 text-center text-gray-400">Loading...</div>
            ) : rows.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">👤</div>
                  <h3 className="text-sm font-semibold text-gray-700 mt-2">No employees found</h3>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {rows.map(e => (
                    <div
                      key={e.id}
                      onClick={() => openDetail(e.id)}
                      className="card p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 select-none"
                    >
                      <Avatar name={e.full_name} photo={e.profile_photo} size="lg" />
                      <div className="mt-3 w-full">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{e.full_name}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{e.designation || 'No designation'}</p>
                        <p className="text-xs text-gray-400 truncate">{e.department || 'No department'}</p>
                        <div className="mt-2 flex items-center justify-center">
                          <Badge text={e.status} />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">{e.employment_type}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} employees
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => changePage(page - 1)} disabled={page === 1} className="btn btn-secondary btn-xs disabled:opacity-40">← Prev</button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pg = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                        return (
                          <button key={pg} onClick={() => changePage(pg)}
                            className={`w-7 h-7 text-xs rounded font-medium transition-all ${pg === page ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                            style={pg === page ? { backgroundColor: 'var(--accent)' } : {}}>{pg}</button>
                        );
                      })}
                      <button onClick={() => changePage(page + 1)} disabled={page === totalPages} className="btn btn-secondary btn-xs disabled:opacity-40">Next →</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── EMPLOYEE DETAIL MODAL ── */}
      {detailEmp && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={() => setDetailEmp(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col pointer-events-auto">

            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <Avatar name={detailEmp.full_name} photo={detailEmp.profile_photo} size="md" />
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {detailLoading ? 'Loading…' : detailEmp.full_name}
                </h2>
                {!detailLoading && (
                  <p className="text-xs text-gray-500 truncate">
                    {detailEmp.designation || 'No designation'}{detailEmp.department ? ` · ${detailEmp.department}` : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {!detailLoading && (
                  <>
                    <button
                      onClick={() => { setDetailEmp(null); openEdit(detailEmp.id); }}
                      className="btn btn-secondary btn-sm gap-1"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => del(detailEmp.id, detailEmp.full_name)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete employee"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setDetailEmp(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto py-4">
              {detailLoading ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading details…</div>
              ) : (
                <>
                  {/* Identity chips */}
                  <div className="flex flex-wrap gap-2 px-5 mb-4">
                    <code className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-mono">{detailEmp.employee_id}</code>
                    <Badge text={detailEmp.status} />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{detailEmp.employment_type}</span>
                  </div>

                  <DetailSection title="Personal">
                    <DetailRow label="Full Name" value={detailEmp.full_name} />
                    <DetailRow label="Gender" value={detailEmp.gender} />
                    <DetailRow label="Date of Birth" value={detailEmp.date_of_birth} />
                    <DetailRow label="Email" value={detailEmp.email} />
                    <DetailRow label="Mobile" value={detailEmp.mobile} />
                  </DetailSection>

                  <DetailSection title="Employment">
                    <DetailRow label="Department" value={detailEmp.department} />
                    <DetailRow label="Designation" value={detailEmp.designation} />
                    <DetailRow label="Employment Type" value={detailEmp.employment_type} />
                    <DetailRow label="Date of Joining" value={detailEmp.date_of_joining} />
                    <DetailRow label="Status" value={detailEmp.status} />
                  </DetailSection>

                  {detailEmp.basic_salary && (
                    <DetailSection title="Payroll">
                      <DetailRow label="Basic Salary" value={`₹${Number(detailEmp.basic_salary).toLocaleString('en-IN')}/mo`} />
                      <DetailRow label="HRA %" value={detailEmp.hra_percent ? `${detailEmp.hra_percent}%` : null} />
                      <DetailRow label="Special Allow." value={detailEmp.special_allowance ? `₹${Number(detailEmp.special_allowance).toLocaleString('en-IN')}` : null} />
                      <DetailRow label="PF" value={detailEmp.pf_applicable ? 'Applicable' : 'Not applicable'} />
                      <DetailRow label="ESI" value={detailEmp.esi_applicable ? 'Applicable (if gross ≤ ₹21,000)' : 'Not applicable'} />
                      <DetailRow label="PT State" value={detailEmp.pt_state} />
                    </DetailSection>
                  )}

                  {(detailEmp.bank_name || detailEmp.bank_account_no) && (
                    <DetailSection title="Bank Details">
                      <DetailRow label="Bank" value={detailEmp.bank_name} />
                      <DetailRow label="Account No." value={detailEmp.bank_account_no} />
                      <DetailRow label="IFSC" value={detailEmp.bank_ifsc} />
                      <DetailRow label="Branch" value={detailEmp.bank_branch} />
                    </DetailSection>
                  )}

                  {(detailEmp.aadhar_no || detailEmp.pan_no) && (
                    <DetailSection title="Identity">
                      <DetailRow label="Aadhaar" value={detailEmp.aadhar_no} />
                      <DetailRow label="PAN" value={detailEmp.pan_no} />
                    </DetailSection>
                  )}

                  {detailEmp._ec?.name && (
                    <DetailSection title="Emergency Contact">
                      <DetailRow label="Name" value={detailEmp._ec.name} />
                      <DetailRow label="Relationship" value={detailEmp._ec.relationship_type} />
                      <DetailRow label="Phone" value={detailEmp._ec.phone} />
                    </DetailSection>
                  )}

                  {detailEmp._assets?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-5">Allocated Assets</h4>
                      <div className="px-5 space-y-1.5">
                        {detailEmp._assets.map(a => (
                          <div key={a.id} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
                            <div>
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{a.asset_name}</p>
                              <p className="text-[11px] text-gray-400">{a.asset_type}{a.serial_number ? ` · ${a.serial_number}` : ''}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.status === 'Allocated' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                              {a.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          </div>
        </>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      <Modal open={!!modal} title={modal?.mode === 'add' ? 'New Employee' : form.full_name || 'Edit Employee'}
        onClose={() => setModal(null)} onSave={save} saveLabel={modal?.mode === 'add' ? 'Save Employee' : 'Save Changes'}>
        {modal?.mode === 'add' && (
          <FormSection title="Login Credentials">
            <div className="mb-3 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                These credentials will be used to log into the portal.
                If this person already has an HR/Admin login, enter their existing username and email — leave password blank and the accounts will be linked automatically.
              </p>
            </div>
            <FormGrid>
              <Field label="Username" required>
                <input className="form-input" value={form.username || ''}
                  onChange={e => f({ username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  placeholder="e.g. john.doe" autoComplete="off" />
              </Field>
              <Field label="Email" required>
                <input type="email" className="form-input" value={form.email || ''}
                  onChange={e => f({ email: e.target.value })} placeholder="john@company.com" autoComplete="off" />
              </Field>
              <Field label="Password (leave blank if existing account)">
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} className="form-input pr-10" value={form.password || ''}
                    onChange={e => f({ password: e.target.value })} placeholder="Leave blank to link existing account" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
            </FormGrid>
          </FormSection>
        )}
        <FormSection title="Employment Details">
          <FormGrid>
            {modal?.mode === 'edit' && (
              <Field label="Status">
                <select className="form-select" value={form.status || ''} onChange={e => f({ status: e.target.value })}>
                  {['Active', 'Inactive', 'Left'].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
            )}
            <Field label="Department">
              <select className="form-select" value={form.department_id || ''} onChange={e => f({ department_id: e.target.value })}>
                <option value="">Select</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Designation">
              <select className="form-select" value={form.designation_id || ''} onChange={e => f({ designation_id: e.target.value })}>
                <option value="">Select</option>
                {desigs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Employment Type">
              <select className="form-select" value={form.employment_type || 'Full-time'} onChange={e => f({ employment_type: e.target.value })}>
                {['Full-time', 'Part-time', 'Contract', 'Intern'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Date of Joining" required>
              <DatePicker value={form.date_of_joining || ''} onChange={v => f({ date_of_joining: v })} placeholder="Select joining date" />
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection title="Personal Details">
          <FormGrid>
            <Field label="First Name" required>
              <input className="form-input" value={form.first_name || ''} onChange={e => f({ first_name: e.target.value })} placeholder="First name" />
            </Field>
            <Field label="Last Name">
              <input className="form-input" value={form.last_name || ''} onChange={e => f({ last_name: e.target.value })} placeholder="Last name" />
            </Field>
            {modal?.mode === 'edit' && (
              <Field label="Email">
                <input type="email" className="form-input" value={form.email || ''} onChange={e => f({ email: e.target.value })} placeholder="Email" />
              </Field>
            )}
            <Field label="Mobile">
              <input className="form-input" value={form.mobile || ''} onChange={e => f({ mobile: e.target.value })} placeholder="Mobile" />
            </Field>
            <Field label="Gender">
              <select className="form-select" value={form.gender || ''} onChange={e => f({ gender: e.target.value })}>
                <option value="">Select</option>
                {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Date of Birth">
              <DatePicker value={form.date_of_birth || ''} onChange={v => f({ date_of_birth: v })} placeholder="Select date of birth" />
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Salary & Tax">
          <FormGrid>
            <Field label="Basic Salary (₹/month)">
              <input type="number" className="form-input" value={form.basic_salary || ''} onChange={e => f({ basic_salary: e.target.value })} placeholder="e.g. 30000" min="0" />
            </Field>
            <Field label="HRA % (of Basic)">
              <input type="number" className="form-input" value={form.hra_percent ?? 40} onChange={e => f({ hra_percent: e.target.value })} placeholder="40" min="0" max="100" step="0.1" />
            </Field>
            <Field label="Special Allowance (₹)">
              <input type="number" className="form-input" value={form.special_allowance || 0} onChange={e => f({ special_allowance: e.target.value })} min="0" />
            </Field>
            <Field label="LTA (₹/month)">
              <input type="number" className="form-input" value={form.lta || 0} onChange={e => f({ lta: e.target.value })} min="0" />
            </Field>
            <Field label="Other Allowance (₹)">
              <input type="number" className="form-input" value={form.other_allowance || 0} onChange={e => f({ other_allowance: e.target.value })} min="0" />
            </Field>
            <Field label="PT State">
              <select className="form-select" value={form.pt_state || 'Karnataka'} onChange={e => f({ pt_state: e.target.value })}>
                {PT_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="PF Applicable">
              <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                <div className={`relative w-10 h-5 rounded-full transition-colors ${form.pf_applicable !== false && form.pf_applicable !== 'false' ? 'bg-blue-600' : 'bg-gray-300'}`}
                  onClick={() => f({ pf_applicable: !(form.pf_applicable !== false && form.pf_applicable !== 'false') })}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.pf_applicable !== false && form.pf_applicable !== 'false' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">{form.pf_applicable !== false && form.pf_applicable !== 'false' ? 'Yes' : 'No'}</span>
              </label>
            </Field>
            <Field label="ESI Applicable">
              <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                <div className={`relative w-10 h-5 rounded-full transition-colors ${form.esi_applicable !== false && form.esi_applicable !== 'false' ? 'bg-blue-600' : 'bg-gray-300'}`}
                  onClick={() => f({ esi_applicable: !(form.esi_applicable !== false && form.esi_applicable !== 'false') })}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.esi_applicable !== false && form.esi_applicable !== 'false' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">{form.esi_applicable !== false && form.esi_applicable !== 'false' ? 'Yes (if gross ≤ ₹21,000)' : 'No'}</span>
              </label>
            </Field>
          </FormGrid>
          {liveCalc && (
            <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex flex-wrap gap-6 items-center text-sm">
              <div><span className="text-gray-500">Monthly Gross:</span><span className="ml-2 font-bold text-blue-800">₹{liveCalc.gross.toLocaleString()}</span></div>
              <div><span className="text-gray-500">Net Take-Home:</span><span className="ml-2 font-bold text-green-700">~₹{liveCalc.net.toLocaleString()}</span></div>
            </div>
          )}
        </FormSection>

        <FormSection title="Bank Details">
          <FormGrid>
            <Field label="Bank Name"><input className="form-input" value={form.bank_name || ''} onChange={e => f({ bank_name: e.target.value })} placeholder="e.g. HDFC Bank" /></Field>
            <Field label="Account Number"><input className="form-input" value={form.bank_account_no || ''} onChange={e => f({ bank_account_no: e.target.value })} placeholder="12-digit account number" /></Field>
            <Field label="IFSC Code"><input className="form-input uppercase" value={form.bank_ifsc || ''} onChange={e => f({ bank_ifsc: e.target.value.toUpperCase() })} placeholder="e.g. HDFC0001234" maxLength={11} /></Field>
            <Field label="Branch Name"><input className="form-input" value={form.bank_branch || ''} onChange={e => f({ bank_branch: e.target.value })} placeholder="e.g. Begumpet, Hyderabad" /></Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Identity Details">
          <FormGrid>
            <Field label="Aadhaar Number"><input className="form-input" value={form.aadhar_no || ''} onChange={e => f({ aadhar_no: e.target.value.replace(/\D/g, '').slice(0, 12) })} placeholder="12-digit Aadhaar" maxLength={12} /></Field>
            <Field label="PAN Number"><input className="form-input uppercase" value={form.pan_no || ''} onChange={e => f({ pan_no: e.target.value.toUpperCase().slice(0, 10) })} placeholder="e.g. ABCDE1234F" maxLength={10} /></Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Emergency Contact">
          <FormGrid>
            <Field label="Contact Name"><input className="form-input" value={form.ec_name || ''} onChange={e => f({ ec_name: e.target.value })} placeholder="Full name" /></Field>
            <Field label="Relationship">
              <select className="form-select" value={form.ec_relationship || ''} onChange={e => f({ ec_relationship: e.target.value })}>
                <option value="">Select</option>
                {['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'].map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Phone"><input className="form-input" value={form.ec_phone || ''} onChange={e => f({ ec_phone: e.target.value })} placeholder="Mobile number" /></Field>
          </FormGrid>
        </FormSection>

        {modal?.mode === 'edit' && (
          <FormSection title="Allocated Assets">
            {empAssets.length === 0 ? (
              <div className="flex items-center gap-2 py-3 px-1 text-sm text-gray-400">
                <Monitor size={16} className="text-gray-300" />No assets allocated yet
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 overflow-hidden mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-3 py-2 text-left">Asset</th><th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Serial</th><th className="px-3 py-2 text-left">Given On</th>
                      <th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {empAssets.map(a => (
                      <tr key={a.id} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium text-gray-800">{a.asset_name}</td>
                        <td className="px-3 py-2 text-gray-500">{a.asset_type}</td>
                        <td className="px-3 py-2 text-gray-400 font-mono text-xs">{a.serial_number || '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{a.allocated_date}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'Allocated' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{a.status}</span>
                        </td>
                        <td className="px-3 py-2">
                          {a.status === 'Allocated' && (
                            <button onClick={() => returnAsset(a.id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 transition-colors">
                              <Undo2 size={11} /> Return
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button type="button" onClick={() => setShowAssetForm(v => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors mb-3">
              {showAssetForm ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showAssetForm ? 'Cancel' : '+ Allocate New Asset'}
            </button>
            {showAssetForm && (
              <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 space-y-3">
                <FormGrid>
                  <Field label="Asset Name" required><input className="form-input" value={assetForm.asset_name} onChange={e => setAssetForm(p => ({ ...p, asset_name: e.target.value }))} placeholder="e.g. ThinkPad X1 Carbon" /></Field>
                  <Field label="Type" required>
                    <select className="form-select" value={assetForm.asset_type} onChange={e => setAssetForm(p => ({ ...p, asset_type: e.target.value }))}>
                      <option value="">Select type</option>
                      {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Serial Number"><input className="form-input" value={assetForm.serial_number} onChange={e => setAssetForm(p => ({ ...p, serial_number: e.target.value }))} placeholder="SN-XXXXX" /></Field>
                  <Field label="Condition">
                    <select className="form-select" value={assetForm.condition} onChange={e => setAssetForm(p => ({ ...p, condition: e.target.value }))}>
                      {['New', 'Good', 'Fair', 'Poor'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Given On"><DatePicker value={assetForm.allocated_date} onChange={v => setAssetForm(p => ({ ...p, allocated_date: v }))} placeholder="Select date" /></Field>
                  <Field label="Notes"><input className="form-input" value={assetForm.notes} onChange={e => setAssetForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any notes…" /></Field>
                </FormGrid>
                <button type="button" onClick={allocateAsset} className="btn btn-primary btn-sm gap-1.5"><Monitor size={12} /> Allocate Asset</button>
              </div>
            )}
          </FormSection>
        )}
      </Modal>
    </>
  );
}
