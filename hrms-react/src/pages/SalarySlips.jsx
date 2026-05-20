import { useState, useEffect } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import { Plus, RefreshCw, Eye, Printer, FileDown } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ── Indian Salary Slip View ────────────────────────────────────
function SlipView({ slip }) {
  if (!slip) return null;

  const earnings = (slip.earnings || []).filter(e => !e.employer_side);
  const empDeductions = (slip.deductions || []).filter(d => !d.employer_side);
  const employerContribs = (slip.deductions || []).filter(d => d.employer_side);
  const ctc = slip.gross_pay + employerContribs.reduce((a, d) => a + (d.amount || 0), 0);

  return (
    <div className="salary-slip-print" id="salary-slip-content">
      {/* Header */}
      <div className="bg-[#1B3A6B] text-white rounded-xl p-5 mb-5">
        <div className="text-center mb-3">
          <div className="text-lg font-bold tracking-wide">Artech Solutions</div>
          <div className="text-xs text-white/60 mt-0.5">Salary Slip — Confidential</div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-white/80 mt-3">
          <div><span className="text-white/50">Employee:</span> <span className="font-semibold text-white">{slip.employee_name}</span></div>
          <div><span className="text-white/50">Period:</span> <span className="font-semibold text-white">{MONTH_NAMES[(slip.month || 1) - 1]} {slip.year}</span></div>
          <div><span className="text-white/50">Employee ID:</span> <span className="font-semibold text-white">{slip.employee_id || '—'}</span></div>
          <div><span className="text-white/50">Slip ID:</span> <span className="font-semibold text-white">{slip.slip_id}</span></div>
          {slip.designation && <div><span className="text-white/50">Designation:</span> <span className="font-semibold text-white">{slip.designation}</span></div>}
          {slip.department && <div><span className="text-white/50">Department:</span> <span className="font-semibold text-white">{slip.department}</span></div>}
        </div>
      </div>

      {/* Earnings & Deductions side by side */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Earnings */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-green-50 px-4 py-2 text-xs font-bold text-green-800 uppercase tracking-wider border-b border-gray-200">
            Earnings
          </div>
          <table className="w-full text-sm">
            <tbody>
              {earnings.map((e, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 text-gray-700">{e.component || e.name}</td>
                  <td className="px-4 py-2 text-right font-medium text-gray-800">₹{Number(e.amount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-green-50">
                <td className="px-4 py-2.5 font-bold text-green-800">Gross Earnings</td>
                <td className="px-4 py-2.5 text-right font-bold text-green-800">₹{Number(slip.gross_pay || 0).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Deductions */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-red-50 px-4 py-2 text-xs font-bold text-red-800 uppercase tracking-wider border-b border-gray-200">
            Deductions
          </div>
          <table className="w-full text-sm">
            <tbody>
              {empDeductions.map((d, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 text-gray-700">{d.component || d.name}</td>
                  <td className="px-4 py-2 text-right font-medium text-gray-800">₹{Number(d.amount || 0).toLocaleString()}</td>
                </tr>
              ))}
              {empDeductions.length === 0 && (
                <tr><td colSpan={2} className="px-4 py-3 text-gray-400 text-xs text-center">No deductions</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-red-50">
                <td className="px-4 py-2.5 font-bold text-red-800">Total Deductions</td>
                <td className="px-4 py-2.5 text-right font-bold text-red-800">₹{Number(slip.total_deduction || 0).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Employer Contributions (informational) */}
      {employerContribs.length > 0 && (
        <div className="border border-blue-100 rounded-lg overflow-hidden mb-4">
          <div className="bg-blue-50 px-4 py-2 text-xs font-bold text-blue-800 uppercase tracking-wider border-b border-blue-100">
            Employer Contributions (Informational — not deducted from pay)
          </div>
          <table className="w-full text-sm">
            <tbody>
              {employerContribs.map((d, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 text-gray-700">{d.component || d.name}</td>
                  <td className="px-4 py-2 text-right font-medium text-gray-600">₹{Number(d.amount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50">
                <td className="px-4 py-2.5 font-bold text-blue-800">CTC (Gross + Employer Contributions)</td>
                <td className="px-4 py-2.5 text-right font-bold text-blue-800">₹{ctc.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Net Pay */}
      <div className="bg-[#1B3A6B] text-white rounded-xl p-5 flex justify-between items-center">
        <div>
          <div className="text-sm text-white/60 mb-1">Net Pay (Take Home)</div>
          <div className="text-3xl font-bold">₹{Number(slip.net_pay || 0).toLocaleString()}</div>
        </div>
        <div className="text-right text-xs text-white/50">
          <div>{MONTH_NAMES[(slip.month || 1) - 1]} {slip.year}</div>
          <div>{slip.slip_id}</div>
        </div>
      </div>
    </div>
  );
}

export default function SalarySlips({ toast }) {
  const [slips, setSlips] = useState([]);
  const [emps, setEmps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [form, setForm] = useState({});

  const now = new Date();
  const f = v => setForm(prev => ({ ...prev, ...v }));

  const load = async () => {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([api('GET', '/api/payroll/slips'), api('GET', '/api/employees?all=true')]);
      setSlips(s); setEmps(e);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const viewSlip = async id => {
    try { setViewModal(await api('GET', `/api/payroll/slips/${id}`)); }
    catch (e) { toast(e.message, 'error'); }
  };

  const parseLines = text => text.trim().split('\n').filter(Boolean).map(line => {
    const [name, amount] = line.split(':').map(s => s.trim());
    return { component: name, amount: parseFloat(amount) || 0 };
  });

  const save = async () => {
    if (!form.employee_id) return toast('Select employee', 'warning');
    try {
      await api('POST', '/api/payroll/slips', {
        employee_id: parseInt(form.employee_id),
        month: parseInt(form.month || now.getMonth() + 1),
        year: parseInt(form.year || now.getFullYear()),
        earnings: parseLines(form.earnings || ''),
        deductions: parseLines(form.deductions || ''),
      });
      toast('Salary slip created', 'success'); setCreateModal(false); load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handlePrint = () => { window.print(); };

  const downloadPdf = async (slipId, slipRef) => {
    try {
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch(`/api/payroll/slips/${slipId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${slipRef || slipId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          #root { visibility: hidden; }
          #salary-slip-print-wrapper {
            display: block !important;
            visibility: visible;
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            background: white;
            padding: 24px;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          #salary-slip-print-wrapper * { visibility: visible; }
        }
        #salary-slip-print-wrapper { display: none; }
      `}</style>
      {viewModal && (
        <div id="salary-slip-print-wrapper">
          <SlipView slip={viewModal} />
        </div>
      )}

      <div className="page-head">
        <h1 className="page-title">Salary Slips</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={() => { setForm({ month: now.getMonth() + 1, year: now.getFullYear() }); setCreateModal(true); }}
            className="btn btn-primary btn-sm gap-1.5"><Plus size={13} /> Create Slip</button>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Slip ID</th><th>Employee</th><th>Month / Year</th>
                  <th>Gross Pay</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : slips.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">💰</div>
                      <p className="text-sm text-gray-500">No salary slips yet. Run payroll from the Payroll page.</p>
                    </div>
                  </td></tr>
                ) : slips.map(s => (
                  <tr key={s.id}>
                    <td><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{s.slip_id}</code></td>
                    <td className="font-medium text-gray-900">{s.employee_name}</td>
                    <td className="text-gray-600">{MONTHS[s.month - 1]} {s.year}</td>
                    <td className="text-gray-700">₹{Number(s.gross_pay).toLocaleString()}</td>
                    <td className="text-red-600">₹{Number(s.total_deduction).toLocaleString()}</td>
                    <td className="font-semibold text-green-700">₹{Number(s.net_pay).toLocaleString()}</td>
                    <td><Badge text={s.status} /></td>
                    <td className="flex gap-1">
                      <button onClick={() => viewSlip(s.id)} className="btn btn-secondary btn-xs gap-1">
                        <Eye size={11} /> View
                      </button>
                      <button onClick={() => downloadPdf(s.id, s.slip_id)} className="btn btn-secondary btn-xs gap-1">
                        <FileDown size={11} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Slip Modal */}
      <Modal open={createModal} title="Create Salary Slip" onClose={() => setCreateModal(false)} onSave={save} saveLabel="Create Slip">
        <FormSection title="Slip Details">
          <FormGrid>
            <Field label="Employee" required>
              <select className="form-select" value={form.employee_id || ''} onChange={e => f({ employee_id: e.target.value })}>
                <option value="">Select Employee</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </Field>
            <Field label="Month" required>
              <select className="form-select" value={form.month || now.getMonth() + 1} onChange={e => f({ month: e.target.value })}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </Field>
            <Field label="Year" required>
              <input type="number" className="form-input" value={form.year || now.getFullYear()} onChange={e => f({ year: e.target.value })} min="2020" max="2030" />
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection title="Earnings & Deductions">
          <div className="space-y-4">
            <Field label="Earnings (component : amount, one per line)" full>
              <textarea className="form-textarea font-mono text-xs" rows={4}
                value={form.earnings || ''} onChange={e => f({ earnings: e.target.value })}
                placeholder="Basic Salary : 30000&#10;House Rent Allowance : 12000&#10;Special Allowance : 3000" />
            </Field>
            <Field label="Deductions (component : amount, one per line)" full>
              <textarea className="form-textarea font-mono text-xs" rows={3}
                value={form.deductions || ''} onChange={e => f({ deductions: e.target.value })}
                placeholder="Provident Fund (Employee) : 1800&#10;Professional Tax : 200" />
            </Field>
          </div>
        </FormSection>
      </Modal>

      {/* View Slip Modal — Indian Format */}
      {viewModal && (
        <Modal
          open={!!viewModal}
          title={`Salary Slip — ${viewModal.slip_id}`}
          onClose={() => setViewModal(null)}
          hideSave
          wide
          extraActions={
            <div className="flex gap-2">
              <button onClick={() => downloadPdf(viewModal.id, viewModal.slip_id)} className="btn btn-primary btn-sm gap-1.5">
                <FileDown size={13} /> Download PDF
              </button>
              <button onClick={handlePrint} className="btn btn-secondary btn-sm gap-1.5">
                <Printer size={13} /> Print
              </button>
            </div>
          }
        >
          <SlipView slip={viewModal} />
        </Modal>
      )}
    </>
  );
}
