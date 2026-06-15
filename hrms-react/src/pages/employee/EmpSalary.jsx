import { useState, useEffect } from 'react';
import { api } from '../../api';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { Eye, Printer, FileDown } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function SlipView({ slip }) {
  if (!slip) return null;

  const earnings = (slip.earnings || []).filter(e => !e.employer_side);
  const empDeductions = (slip.deductions || []).filter(d => !d.employer_side);
  const employerContribs = (slip.deductions || []).filter(d => d.employer_side);
  const ctc = slip.gross_pay + employerContribs.reduce((a, d) => a + (d.amount || 0), 0);

  return (
    <div id="emp-salary-slip-content">
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

      {/* Earnings & Deductions */}
      <div className="grid grid-cols-2 gap-4 mb-4">
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

      {/* Employer Contributions */}
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

export default function EmpSalary({ toast }) {
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewSlip, setViewSlip] = useState(null);

  useEffect(() => {
    api('GET', '/api/portal/salary-slips')
      .then(setSlips)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const openSlip = async id => {
    try { setViewSlip(await api('GET', `/api/portal/salary-slips/${id}`)); }
    catch (e) { toast(e.message, 'error'); }
  };

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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) { toast(e.message, 'error'); }
  };

  const latest = slips[0];

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          #root { visibility: hidden; }
          #emp-salary-print-wrapper {
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
          #emp-salary-print-wrapper * { visibility: visible; }
        }
        #emp-salary-print-wrapper { display: none; }
      `}</style>
      {viewSlip && (
        <div id="emp-salary-print-wrapper">
          <SlipView slip={viewSlip} />
        </div>
      )}

      <div className="page-head">
        <h1 className="page-title">My Salary Slips</h1>
      </div>

      <div className="page-content space-y-4">
        {/* Latest slip highlight */}
        {latest && (
          <div className="card p-5 bg-gradient-to-r from-[#1B3A6B] to-[#2E6BE6] text-white">
            <div className="text-xs text-white/60 mb-1">Latest Pay — {MONTHS[latest.month - 1]} {latest.year}</div>
            <div className="text-3xl font-bold mb-3">₹{Number(latest.net_pay).toLocaleString()}</div>
            <div className="flex items-center gap-4 text-sm text-white/70">
              <span>Gross: ₹{Number(latest.gross_pay).toLocaleString()}</span>
              <span>Deductions: ₹{Number(latest.total_deduction).toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Slip ID</th><th>Month / Year</th><th>Gross Pay</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading…</td></tr>
                ) : slips.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">💰</div>
                      <p className="text-sm text-gray-500">No salary slips available yet</p>
                    </div>
                  </td></tr>
                ) : slips.map(s => (
                  <tr key={s.id}>
                    <td><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{s.slip_id}</code></td>
                    <td className="font-medium text-gray-900">{MONTHS[s.month - 1]} {s.year}</td>
                    <td className="text-gray-700">₹{Number(s.gross_pay).toLocaleString()}</td>
                    <td className="text-red-500">₹{Number(s.total_deduction).toLocaleString()}</td>
                    <td className="font-semibold text-green-700">₹{Number(s.net_pay).toLocaleString()}</td>
                    <td><Badge text={s.status} /></td>
                    <td className="flex gap-1">
                      <button onClick={() => openSlip(s.id)} className="btn-action">
                        <Eye size={11} /> View
                      </button>
                      <button onClick={() => downloadPdf(s.id, s.slip_id)} className="btn-action">
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

      {viewSlip && (
        <Modal
          open={!!viewSlip}
          title={`Salary Slip — ${viewSlip.slip_id}`}
          onClose={() => setViewSlip(null)}
          hideSave
          wide
          extraActions={
            <div className="flex gap-2">
              <button onClick={() => downloadPdf(viewSlip.id, viewSlip.slip_id)} className="btn btn-primary btn-sm gap-1.5">
                <FileDown size={13} /> Download PDF
              </button>
              <button onClick={() => window.print()} className="btn btn-secondary btn-sm gap-1.5">
                <Printer size={13} /> Print
              </button>
            </div>
          }
        >
          <SlipView slip={viewSlip} />
        </Modal>
      )}
    </>
  );
}
