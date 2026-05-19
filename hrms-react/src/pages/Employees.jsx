import { useState, useEffect } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import { Plus, RefreshCw, Search, Pencil, Trash2 } from 'lucide-react';

function Avatar({ name }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

const PT_STATES = ['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Other'];

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

  const totalDed = pfEmp + esiEmp + pt;
  const net = gross - totalDed;
  return { gross, net };
}

export default function Employees({ toast }) {
  const [rows, setRows] = useState([]);
  const [depts, setDepts] = useState([]);
  const [desigs, setDesigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', emp: {} }
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async (s = search, d = deptFilter, st = statusFilter) => {
    setLoading(true);
    try {
      let url = '/api/employees?';
      if (s) url += `search=${encodeURIComponent(s)}&`;
      if (d) url += `department_id=${d}&`;
      if (st) url += `status=${st}&`;
      const data = await api('GET', url);
      setRows(data);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    Promise.all([api('GET', '/api/employees/departments'), api('GET', '/api/employees/designations')])
      .then(([d, de]) => { setDepts(d); setDesigs(de); load(); })
      .catch(e => toast(e.message, 'error'));
  }, []);

  const openAdd = () => {
    setForm({
      employment_type: 'Full-time',
      status: 'Active',
      hra_percent: 40,
      special_allowance: 0,
      lta: 0,
      other_allowance: 0,
      pf_applicable: true,
      esi_applicable: true,
      pt_state: 'Karnataka',
    });
    setModal({ mode: 'add' });
  };

  const openEdit = async (id) => {
    try {
      const e = await api('GET', `/api/employees/${id}`);
      setForm(e);
      setModal({ mode: 'edit', id });
    } catch (e) { toast(e.message, 'error'); }
  };

  const save = async () => {
    if (!form.first_name?.trim()) return toast('First name is required', 'warning');
    if (!form.date_of_joining) return toast('Date of joining is required', 'warning');
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

      if (modal.mode === 'add') {
        await api('POST', '/api/employees', {
          first_name: form.first_name, last_name: form.last_name || null,
          email: form.email || null, mobile: form.mobile || null,
          gender: form.gender || null, date_of_joining: form.date_of_joining,
          date_of_birth: form.date_of_birth || null,
          department_id: form.department_id ? parseInt(form.department_id) : null,
          designation_id: form.designation_id ? parseInt(form.designation_id) : null,
          employment_type: form.employment_type,
          ...salaryFields,
        });
        toast('Employee added', 'success');
      } else {
        await api('PUT', `/api/employees/${modal.id}`, {
          first_name: form.first_name, last_name: form.last_name || null,
          email: form.email || null, mobile: form.mobile || null,
          gender: form.gender || null, date_of_joining: form.date_of_joining,
          date_of_birth: form.date_of_birth || null, status: form.status,
          department_id: form.department_id ? parseInt(form.department_id) : null,
          designation_id: form.designation_id ? parseInt(form.designation_id) : null,
          employment_type: form.employment_type,
          bank_name: form.bank_name || null, bank_account_no: form.bank_account_no || null,
          ...salaryFields,
        });
        toast('Employee saved', 'success');
      }
      setModal(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const del = async (id, name) => {
    if (!confirm(`Delete employee "${name}"? This cannot be undone.`)) return;
    try { await api('DELETE', `/api/employees/${id}`); toast('Employee deleted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const f = v => setForm(prev => ({ ...prev, ...v }));

  const liveCalc = calcLivePayroll(form);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Employee List</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
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
                onChange={e => { setSearch(e.target.value); load(e.target.value, deptFilter, statusFilter); }}
              />
            </div>
            <select className="form-select w-auto min-w-[160px]" value={deptFilter}
              onChange={e => { setDeptFilter(e.target.value); load(search, e.target.value, statusFilter); }}>
              <option value="">All Departments</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="form-select w-auto" value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); load(search, deptFilter, e.target.value); }}>
              <option value="">All Status</option>
              <option>Active</option><option>Inactive</option><option>Left</option>
            </select>
          </div>
        </div>

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
                  <tr key={e.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={e.full_name} />
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
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(e.id)} className="btn btn-secondary btn-xs gap-1"><Pencil size={11} />Edit</button>
                        <button onClick={() => del(e.id, e.full_name)} className="btn btn-danger btn-xs gap-1"><Trash2 size={11} />Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={!!modal} title={modal?.mode === 'add' ? 'New Employee' : form.full_name || 'Edit Employee'}
        onClose={() => setModal(null)} onSave={save} saveLabel={modal?.mode === 'add' ? 'Save Employee' : 'Save Changes'}>
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
              <input type="date" className="form-input" value={form.date_of_joining || ''} onChange={e => f({ date_of_joining: e.target.value })} />
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
            <Field label="Email">
              <input type="email" className="form-input" value={form.email || ''} onChange={e => f({ email: e.target.value })} placeholder="Email" />
            </Field>
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
              <input type="date" className="form-input" value={form.date_of_birth || ''} onChange={e => f({ date_of_birth: e.target.value })} />
            </Field>
          </FormGrid>
        </FormSection>

        {/* Salary & Tax Section */}
        <FormSection title="Salary & Tax">
          <FormGrid>
            <Field label="Basic Salary (₹/month)">
              <input
                type="number"
                className="form-input"
                value={form.basic_salary || ''}
                onChange={e => f({ basic_salary: e.target.value })}
                placeholder="e.g. 30000"
                min="0"
              />
            </Field>
            <Field label="HRA % (of Basic)">
              <input
                type="number"
                className="form-input"
                value={form.hra_percent ?? 40}
                onChange={e => f({ hra_percent: e.target.value })}
                placeholder="40"
                min="0"
                max="100"
                step="0.1"
              />
            </Field>
            <Field label="Special Allowance (₹)">
              <input
                type="number"
                className="form-input"
                value={form.special_allowance || 0}
                onChange={e => f({ special_allowance: e.target.value })}
                min="0"
              />
            </Field>
            <Field label="LTA (₹/month)">
              <input
                type="number"
                className="form-input"
                value={form.lta || 0}
                onChange={e => f({ lta: e.target.value })}
                min="0"
              />
            </Field>
            <Field label="Other Allowance (₹)">
              <input
                type="number"
                className="form-input"
                value={form.other_allowance || 0}
                onChange={e => f({ other_allowance: e.target.value })}
                min="0"
              />
            </Field>
            <Field label="PT State">
              <select className="form-select" value={form.pt_state || 'Karnataka'} onChange={e => f({ pt_state: e.target.value })}>
                {PT_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="PF Applicable">
              <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                <div
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.pf_applicable !== false && form.pf_applicable !== 'false' ? 'bg-blue-600' : 'bg-gray-300'}`}
                  onClick={() => f({ pf_applicable: !(form.pf_applicable !== false && form.pf_applicable !== 'false') })}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.pf_applicable !== false && form.pf_applicable !== 'false' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">{form.pf_applicable !== false && form.pf_applicable !== 'false' ? 'Yes' : 'No'}</span>
              </label>
            </Field>
            <Field label="ESI Applicable">
              <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                <div
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.esi_applicable !== false && form.esi_applicable !== 'false' ? 'bg-blue-600' : 'bg-gray-300'}`}
                  onClick={() => f({ esi_applicable: !(form.esi_applicable !== false && form.esi_applicable !== 'false') })}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.esi_applicable !== false && form.esi_applicable !== 'false' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">{form.esi_applicable !== false && form.esi_applicable !== 'false' ? 'Yes (if gross ≤ ₹21,000)' : 'No'}</span>
              </label>
            </Field>
          </FormGrid>

          {/* Live Preview */}
          {liveCalc && (
            <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex flex-wrap gap-6 items-center text-sm">
              <div>
                <span className="text-gray-500">Monthly Gross:</span>
                <span className="ml-2 font-bold text-blue-800">₹{liveCalc.gross.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Net Take-Home:</span>
                <span className="ml-2 font-bold text-green-700">~₹{liveCalc.net.toLocaleString()}</span>
              </div>
            </div>
          )}
        </FormSection>

        {modal?.mode === 'edit' && (
          <FormSection title="Bank Details">
            <FormGrid>
              <Field label="Bank Name">
                <input className="form-input" value={form.bank_name || ''} onChange={e => f({ bank_name: e.target.value })} />
              </Field>
              <Field label="Account Number">
                <input className="form-input" value={form.bank_account_no || ''} onChange={e => f({ bank_account_no: e.target.value })} />
              </Field>
            </FormGrid>
          </FormSection>
        )}
      </Modal>
    </>
  );
}
