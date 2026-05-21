import { useState, useEffect } from 'react';
import { api } from '../api';
import { Save, Plus, Trash2, Info, RefreshCw } from 'lucide-react';
import Select from '../components/Select';

function Toggle({ checked, onChange }) {
  return (
    <div
      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
      onClick={() => onChange(!checked)}
    >
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </div>
  );
}

function RuleRow({ label, hint, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
    </div>
  );
}

function RuleSection({ title, children }) {
  return (
    <div className="card mb-4">
      <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

function NumInput({ value, onChange, min = 0, step = 0.01, suffix, width = 'w-24' }) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={min}
        step={step}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className={`form-input ${width} text-right`}
      />
      {suffix && <span className="text-xs text-gray-500 whitespace-nowrap">{suffix}</span>}
    </div>
  );
}

const CALC_TYPES = [
  { value: 'fixed',            label: 'Fixed ₹' },
  { value: 'percent_of_basic', label: '% of Basic' },
  { value: 'percent_of_gross', label: '% of Gross' },
];

const COMP_SUFFIX = { fixed: '₹', percent_of_basic: '% of Basic', percent_of_gross: '% of Gross' };

export default function PayrollRules({ toast }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const rules = await api('GET', '/api/payroll/rules');
      setForm({
        ...rules,
        custom_components: rules.custom_components || [],
      });
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const f = v => setForm(prev => ({ ...prev, ...v }));

  const save = async () => {
    setSaving(true);
    try {
      await api('PUT', '/api/payroll/rules', {
        ...form,
        pf_employee_rate:  parseFloat(form.pf_employee_rate)  || 12,
        pf_employee_cap:   parseFloat(form.pf_employee_cap)   ?? 1800,
        pf_employer_rate:  parseFloat(form.pf_employer_rate)  || 12,
        pf_employer_cap:   parseFloat(form.pf_employer_cap)   ?? 1800,
        esi_employee_rate: parseFloat(form.esi_employee_rate) || 0.75,
        esi_employer_rate: parseFloat(form.esi_employer_rate) || 3.25,
        esi_wage_ceiling:  parseFloat(form.esi_wage_ceiling)  || 21000,
        default_hra_percent: parseFloat(form.default_hra_percent) || 40,
        gratuity_rate:     parseFloat(form.gratuity_rate)     || 4.81,
        bonus_rate:        parseFloat(form.bonus_rate)        || 8.33,
        bonus_wage_ceil:   parseFloat(form.bonus_wage_ceil)   || 7000,
        custom_components: form.custom_components.map(c => ({
          ...c,
          value: parseFloat(c.value) || 0,
        })),
      });
      toast('Payroll rules saved. New runs will use these rules.', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const addCustom = () => {
    f({ custom_components: [...(form.custom_components || []), {
      name: '', component_type: 'Earning', calc_type: 'fixed', value: 0,
    }]});
  };

  const updateCustom = (i, patch) => {
    const arr = [...form.custom_components];
    arr[i] = { ...arr[i], ...patch };
    f({ custom_components: arr });
  };

  const removeCustom = i => {
    f({ custom_components: form.custom_components.filter((_, idx) => idx !== i) });
  };

  if (loading || !form) {
    return (
      <div className="page-content flex items-center justify-center h-40 text-gray-400 text-sm">
        Loading payroll rules…
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Payroll Rules</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configure salary computation formulas — applied when Run Payroll is executed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn btn-secondary btn-sm gap-1.5">
            <RefreshCw size={13} /> Reset
          </button>
          <button onClick={save} disabled={saving} className="btn btn-primary btn-sm gap-1.5">
            <Save size={13} /> {saving ? 'Saving…' : 'Save Rules'}
          </button>
        </div>
      </div>

      <div className="page-content space-y-0">

        {/* Info banner */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-4">
          <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            These rules are applied each time you run payroll. Employee-level settings (Basic, HRA %, PF applicable, ESI applicable) override the defaults set here.
            Changes here only affect future payroll runs — existing salary slips are not modified.
          </p>
        </div>

        {/* Provident Fund */}
        <RuleSection title="Provident Fund (PF)">
          <RuleRow label="Employee PF Contribution" hint="Deducted from employee's salary">
            <NumInput value={form.pf_employee_rate} onChange={v => f({ pf_employee_rate: v })} suffix="% of Basic" width="w-20" />
            <span className="text-gray-400 text-xs">cap</span>
            <NumInput value={form.pf_employee_cap} onChange={v => f({ pf_employee_cap: v })} suffix="₹/mo (0 = no cap)" width="w-24" />
          </RuleRow>
          <RuleRow label="Employer PF Contribution" hint="Employer's matching contribution (shown on CTC, not deducted from employee)">
            <NumInput value={form.pf_employer_rate} onChange={v => f({ pf_employer_rate: v })} suffix="% of Basic" width="w-20" />
            <span className="text-gray-400 text-xs">cap</span>
            <NumInput value={form.pf_employer_cap} onChange={v => f({ pf_employer_cap: v })} suffix="₹/mo (0 = no cap)" width="w-24" />
          </RuleRow>
        </RuleSection>

        {/* ESI */}
        <RuleSection title="Employee State Insurance (ESI)">
          <RuleRow label="Employee ESI Contribution" hint="Deducted from salary when gross ≤ wage ceiling">
            <NumInput value={form.esi_employee_rate} onChange={v => f({ esi_employee_rate: v })} step={0.01} suffix="% of Gross" width="w-20" />
          </RuleRow>
          <RuleRow label="Employer ESI Contribution" hint="Employer's contribution (shown on CTC)">
            <NumInput value={form.esi_employer_rate} onChange={v => f({ esi_employer_rate: v })} step={0.01} suffix="% of Gross" width="w-20" />
          </RuleRow>
          <RuleRow label="ESI Wage Ceiling" hint="ESI not applicable if monthly gross exceeds this amount">
            <NumInput value={form.esi_wage_ceiling} onChange={v => f({ esi_wage_ceiling: v })} suffix="₹ Gross/mo" width="w-28" />
          </RuleRow>
        </RuleSection>

        {/* PT & HRA Defaults */}
        <RuleSection title="Professional Tax & HRA">
          <RuleRow label="Professional Tax" hint="Slabs applied per state configured on each employee">
            <span className="text-xs text-gray-500 mr-2">Enable</span>
            <Toggle checked={!!form.pt_enabled} onChange={v => f({ pt_enabled: v })} />
          </RuleRow>
          <RuleRow label="Default HRA %" hint="Used when HRA % is not explicitly set on the employee record">
            <NumInput value={form.default_hra_percent} onChange={v => f({ default_hra_percent: v })} suffix="% of Basic" width="w-20" />
          </RuleRow>
        </RuleSection>

        {/* Loss of Pay */}
        <RuleSection title="Loss of Pay (LOP)">
          <RuleRow label="Deduct for Absent Days" hint="Calculates per-day deduction based on basic salary and attendance records">
            <Toggle checked={!!form.lop_enabled} onChange={v => f({ lop_enabled: v })} />
          </RuleRow>
          {form.lop_enabled && (
            <RuleRow label="LOP Basis" hint="Divisor used to compute per-day salary">
              <Select
                value={form.lop_basis || 'calendar'}
                onChange={v => f({ lop_basis: v })}
                options={[
                  { value: 'calendar', label: 'Calendar days in month' },
                  { value: 'working', label: 'Working days (~26 days)' },
                ]}
                className="w-48"
              />
            </RuleRow>
          )}
        </RuleSection>

        {/* Bonus */}
        <RuleSection title="Bonus">
          <RuleRow label="Include Bonus in Salary" hint="Statutory bonus under Payment of Bonus Act">
            <Toggle checked={!!form.bonus_enabled} onChange={v => f({ bonus_enabled: v })} />
          </RuleRow>
          {form.bonus_enabled && (
            <>
              <RuleRow label="Bonus Rate" hint="Percentage of basic (or wage ceiling if basic > ceiling)">
                <NumInput value={form.bonus_rate} onChange={v => f({ bonus_rate: v })} suffix="% of Basic" width="w-20" />
              </RuleRow>
              <RuleRow label="Wage Ceiling" hint="Bonus is computed on min(Basic, Ceiling) — statutory ceiling is ₹7,000">
                <NumInput value={form.bonus_wage_ceil} onChange={v => f({ bonus_wage_ceil: v })} suffix="₹" width="w-24" />
              </RuleRow>
            </>
          )}
        </RuleSection>

        {/* Gratuity */}
        <RuleSection title="Gratuity">
          <RuleRow label="Include Gratuity Provision" hint="Employer gratuity provision shown on CTC — not deducted from employee salary">
            <Toggle checked={!!form.gratuity_enabled} onChange={v => f({ gratuity_enabled: v })} />
          </RuleRow>
          {form.gratuity_enabled && (
            <RuleRow label="Gratuity Rate" hint="Standard rate is 4.81% (15/26 × 1/12 × 100)">
              <NumInput value={form.gratuity_rate} onChange={v => f({ gratuity_rate: v })} step={0.01} suffix="% of Basic" width="w-20" />
            </RuleRow>
          )}
        </RuleSection>

        {/* Custom Components */}
        <div className="card mb-4">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Custom Components</h3>
              <p className="text-xs text-gray-400 mt-0.5">Add your own earning or deduction components</p>
            </div>
            <button onClick={addCustom} className="btn btn-secondary btn-xs gap-1.5">
              <Plus size={11} /> Add Component
            </button>
          </div>

          {form.custom_components.length === 0 ? (
            <div className="px-5 py-6 text-center text-gray-400">
              <p className="text-sm">No custom components yet</p>
              <p className="text-xs mt-1">Add components like Conveyance Allowance, Medical Allowance, Variable Pay, TDS, etc.</p>
            </div>
          ) : (
            <div className="px-5 py-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      <th className="px-3 py-2 text-left font-medium">Type</th>
                      <th className="px-3 py-2 text-left font-medium">Calculation</th>
                      <th className="px-3 py-2 text-left font-medium">Value</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.custom_components.map((c, i) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-2">
                          <input
                            className="form-input w-full text-xs"
                            placeholder="e.g. Conveyance Allowance"
                            value={c.name || ''}
                            onChange={e => updateCustom(i, { name: e.target.value })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={c.component_type || 'Earning'}
                            onChange={v => updateCustom(i, { component_type: v })}
                            options={['Earning', 'Deduction']}
                            size="sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={c.calc_type || 'fixed'}
                            onChange={v => updateCustom(i, { calc_type: v })}
                            options={CALC_TYPES}
                            size="sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              className="form-input w-24 text-xs text-right"
                              value={c.value ?? ''}
                              onChange={e => updateCustom(i, { value: e.target.value })}
                            />
                            <span className="text-[11px] text-gray-400 whitespace-nowrap">
                              {COMP_SUFFIX[c.calc_type || 'fixed']}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeCustom(i)}
                            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Save footer */}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={save} disabled={saving} className="btn btn-primary gap-2">
            <Save size={14} /> {saving ? 'Saving…' : 'Save All Rules'}
          </button>
        </div>
      </div>
    </>
  );
}
