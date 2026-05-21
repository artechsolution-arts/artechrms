import { useState, useEffect } from 'react';
import { api } from '../api';
import Badge from '../components/Badge';
import Modal, { FormSection, FormGrid, Field } from '../components/Modal';
import { Play, RefreshCw, Eye, ChevronRight, Settings2, CheckCircle2, XCircle } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function RulePill({ label, value, active }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">
      {active !== undefined && (
        active
          ? <CheckCircle2 size={11} className="text-green-500 flex-shrink-0" />
          : <XCircle size={11} className="text-gray-300 flex-shrink-0" />
      )}
      <span className="text-gray-500 dark:text-gray-400">{label}:</span>
      <span className="font-semibold text-gray-700 dark:text-gray-200">{value}</span>
    </div>
  );
}

export default function PayrollEntry({ toast, onNavigate }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runModal, setRunModal] = useState(false);
  const [runForm, setRunForm] = useState({});
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [rules, setRules] = useState(null);

  const now = new Date();
  const rf = v => setRunForm(prev => ({ ...prev, ...v }));

  const load = async () => {
    setLoading(true);
    try {
      const [entriesData, rulesData] = await Promise.all([
        api('GET', '/api/payroll/entries'),
        api('GET', '/api/payroll/rules').catch(() => null),
      ]);
      setEntries(entriesData);
      if (rulesData) setRules(rulesData);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openRun = () => {
    setRunForm({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      overwrite: false,
    });
    setPreviewData([]);
    setResult(null);
    setRunModal(true);
  };

  const runPreview = async () => {
    setPreviewing(true);
    setPreviewData([]);
    try {
      const emps = await api('GET', '/api/employees?status=Active');
      const previews = await Promise.all(
        emps
          .filter(e => e.basic_salary)
          .map(e =>
            api('GET', `/api/payroll/preview/${e.id}`).catch(() => null)
          )
      );
      setPreviewData(previews.filter(Boolean));
    } catch (e) { toast(e.message, 'error'); }
    finally { setPreviewing(false); }
  };

  const runPayroll = async () => {
    setRunning(true);
    try {
      const res = await api('POST', '/api/payroll/run', {
        month: parseInt(runForm.month),
        year: parseInt(runForm.year),
        overwrite: !!runForm.overwrite,
      });
      setResult(res);
      toast(`Payroll run complete: ${res.created} slips generated`, 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setRunning(false); }
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Payroll</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} /> Refresh</button>
          <button onClick={openRun} className="btn btn-primary btn-sm gap-1.5">
            <Play size={13} /> Run Payroll
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Active Rules Summary */}
        {rules && (
          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings2 size={14} className="text-violet-500" />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Payroll Rules</span>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('payroll-rules')}
                  className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"
                >
                  Edit Rules <ChevronRight size={12} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <RulePill label="Employee PF" value={`${rules.pf_employee_rate}%`} active={true} />
              <RulePill label="Employer PF" value={`${rules.pf_employer_rate}%`} active={true} />
              <RulePill label="Employee ESI" value={`${rules.esi_employee_rate}%`} active={true} />
              <RulePill label="ESI Ceiling" value={`₹${rules.esi_wage_ceiling?.toLocaleString()}`} active={true} />
              <RulePill label="HRA Default" value={`${rules.default_hra_percent}% of Basic`} active={true} />
              <RulePill label="Prof. Tax" value={rules.pt_enabled ? 'On' : 'Off'} active={!!rules.pt_enabled} />
              <RulePill label="LOP" value={rules.lop_enabled ? (rules.lop_basis === 'working' ? 'On (26 days)' : 'On (calendar)') : 'Off'} active={!!rules.lop_enabled} />
              <RulePill label="Bonus" value={rules.bonus_enabled ? `${rules.bonus_rate}%` : 'Off'} active={!!rules.bonus_enabled} />
              <RulePill label="Gratuity" value={rules.gratuity_enabled ? `${rules.gratuity_rate}%` : 'Off'} active={!!rules.gratuity_enabled} />
              {(rules.custom_components?.length > 0) && (
                <RulePill label="Custom" value={`${rules.custom_components.length} component${rules.custom_components.length > 1 ? 's' : ''}`} active={true} />
              )}
            </div>
          </div>
        )}

        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Month / Year</th><th>Company</th><th>Employees</th><th>Total Net Pay</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <p className="text-sm text-gray-500">No payroll entries. Run payroll to get started.</p>
                    </div>
                  </td></tr>
                ) : entries.map(e => (
                  <tr key={e.id}>
                    <td className="font-semibold text-gray-900">{MONTHS[e.month - 1]} {e.year}</td>
                    <td className="text-gray-600">{e.company}</td>
                    <td className="text-gray-600">{e.total_employees ?? '—'}</td>
                    <td className="font-medium text-gray-800">₹{(e.total_net || 0).toLocaleString()}</td>
                    <td><Badge text={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Run Payroll Modal */}
      <Modal
        open={runModal}
        title="Run Payroll"
        onClose={() => setRunModal(false)}
        hideSave
        wide
      >
        {result ? (
          // Success summary
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <div className="text-3xl mb-2">✓</div>
              <div className="text-lg font-bold text-green-800 mb-1">Payroll Processed!</div>
              <div className="text-sm text-green-700">
                <span className="font-semibold">{result.created}</span> salary slips generated
                {result.skipped > 0 && <span className="ml-2 text-green-600">({result.skipped} skipped)</span>}
              </div>
              <div className="text-2xl font-bold text-green-900 mt-3">
                Total Net: ₹{(result.total_net || 0).toLocaleString()}
              </div>
            </div>

            {result.slips && result.slips.length > 0 && (
              <div className="overflow-auto max-h-64">
                <table className="data-table w-full text-sm">
                  <thead>
                    <tr>
                      <th>Employee</th><th>Basic</th><th>Gross</th><th>PF</th><th>ESI</th><th>PT</th><th>Net Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.slips.map((s, i) => (
                      <tr key={i}>
                        <td className="font-medium text-gray-900">{s.employee_name}</td>
                        <td className="text-gray-600">₹{Number(s.basic).toLocaleString()}</td>
                        <td className="text-gray-600">₹{Number(s.gross_pay).toLocaleString()}</td>
                        <td className="text-gray-600">₹{Number(s.pf).toLocaleString()}</td>
                        <td className="text-gray-600">₹{Number(s.esi).toLocaleString()}</td>
                        <td className="text-gray-600">₹{Number(s.pt).toLocaleString()}</td>
                        <td className="font-bold text-green-700">₹{Number(s.net_pay).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              onClick={() => { setResult(null); setRunModal(false); }}
              className="btn btn-primary w-full"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Config */}
            <FormSection title="Payroll Period">
              <FormGrid>
                <Field label="Month">
                  <select className="form-select" value={runForm.month || now.getMonth() + 1} onChange={e => rf({ month: e.target.value })}>
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Year">
                  <input type="number" className="form-input" value={runForm.year || now.getFullYear()} onChange={e => rf({ year: e.target.value })} min="2020" max="2030" />
                </Field>
                <Field label="Overwrite Existing Slips">
                  <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                    <div
                      className={`relative w-10 h-5 rounded-full transition-colors ${runForm.overwrite ? 'bg-orange-500' : 'bg-gray-300'}`}
                      onClick={() => rf({ overwrite: !runForm.overwrite })}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${runForm.overwrite ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm text-gray-700">{runForm.overwrite ? 'Yes – re-run & replace' : 'No – skip existing'}</span>
                  </label>
                </Field>
              </FormGrid>
            </FormSection>

            {/* Preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Preview ({MONTHS[(parseInt(runForm.month) || now.getMonth() + 1) - 1]} {runForm.year || now.getFullYear()})
                </div>
                <button
                  onClick={runPreview}
                  disabled={previewing}
                  className="btn btn-secondary btn-xs gap-1"
                >
                  <Eye size={11} /> {previewing ? 'Loading...' : 'Preview'}
                </button>
              </div>

              {previewData.length > 0 ? (
                <div className="overflow-auto max-h-72 rounded-lg border border-gray-200">
                  <table className="data-table w-full text-xs">
                    <thead>
                      <tr>
                        <th>Employee</th><th>Basic</th><th>Gross</th><th>PF</th><th>ESI</th><th>PT</th><th>Net Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((p, i) => (
                        <tr key={i}>
                          <td>
                            <div className="font-medium text-gray-900">{p.employee_name}</div>
                            {p.designation && <div className="text-gray-400">{p.designation}</div>}
                          </td>
                          <td className="text-gray-600">₹{Number(p.basic).toLocaleString()}</td>
                          <td className="text-gray-600">₹{Number(p.gross_pay).toLocaleString()}</td>
                          <td className="text-gray-600">₹{Number(p.pf_employee).toLocaleString()}</td>
                          <td className="text-gray-600">₹{Number(p.esi_employee).toLocaleString()}</td>
                          <td className="text-gray-600">₹{Number(p.professional_tax).toLocaleString()}</td>
                          <td className="font-bold text-green-700">₹{Number(p.net_pay).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td>Total ({previewData.length} employees)</td>
                        <td></td>
                        <td>₹{previewData.reduce((a, p) => a + p.gross_pay, 0).toLocaleString()}</td>
                        <td>₹{previewData.reduce((a, p) => a + p.pf_employee, 0).toLocaleString()}</td>
                        <td>₹{previewData.reduce((a, p) => a + p.esi_employee, 0).toLocaleString()}</td>
                        <td>₹{previewData.reduce((a, p) => a + p.professional_tax, 0).toLocaleString()}</td>
                        <td className="text-green-700">₹{previewData.reduce((a, p) => a + p.net_pay, 0).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : previewing ? (
                <div className="text-center py-8 text-gray-400 text-sm">Loading preview...</div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  Click "Preview" to see the payroll breakdown before running
                </div>
              )}
            </div>

            {/* Run button */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setRunModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={runPayroll}
                disabled={running}
                className="btn btn-primary flex-1 gap-2"
              >
                <Play size={13} />
                {running ? 'Processing...' : `Run Payroll for ${MONTHS[(parseInt(runForm.month) || now.getMonth() + 1) - 1]} ${runForm.year || now.getFullYear()}`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
