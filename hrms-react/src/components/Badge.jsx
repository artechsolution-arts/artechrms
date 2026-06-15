const VARIANTS = {
  Active:    { dot: 'bg-green-500',  cls: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30' },
  Inactive:  { dot: 'bg-gray-400',   cls: 'bg-gray-100 text-gray-500 ring-gray-400/30 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-500/30' },
  Left:      { dot: 'bg-red-500',    cls: 'bg-red-50 text-red-600 ring-red-500/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-500/30' },
  Pending:   { dot: 'bg-amber-400',  cls: 'bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-500/30' },
  Approved:  { dot: 'bg-green-500',  cls: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30' },
  Rejected:  { dot: 'bg-red-500',    cls: 'bg-red-50 text-red-600 ring-red-500/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-500/30' },
  Cancelled: { dot: 'bg-gray-400',   cls: 'bg-gray-100 text-gray-500 ring-gray-400/30 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-500/30' },
  'Cancellation Requested': { dot: 'bg-orange-400', cls: 'bg-orange-50 text-orange-700 ring-orange-500/20 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-500/30' },
  'Edit Requested': { dot: 'bg-blue-500', cls: 'bg-blue-50 text-blue-700 ring-blue-500/20 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-500/30' },
  Open:      { dot: 'bg-green-500',  cls: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30' },
  Closed:    { dot: 'bg-gray-400',   cls: 'bg-gray-100 text-gray-500 ring-gray-400/30 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-500/30' },
  Draft:     { dot: 'bg-slate-400',  cls: 'bg-slate-100 text-slate-500 ring-slate-400/30 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-500/30' },
  Submitted: { dot: 'bg-blue-500',   cls: null },
  Completed: { dot: 'bg-green-500',  cls: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30' },
  Fulfilled: { dot: 'bg-green-500',  cls: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30' },
  Applied:   { dot: 'bg-gray-400',   cls: 'bg-gray-100 text-gray-500 ring-gray-400/30 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-500/30' },
  Screening: { dot: 'bg-amber-400',  cls: 'bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-500/30' },
  Interview: { dot: 'bg-violet-500', cls: 'bg-violet-50 text-violet-700 ring-violet-500/20 dark:bg-violet-900/20 dark:text-violet-400 dark:ring-violet-500/30' },
  Offered:   { dot: 'bg-blue-500',   cls: null },
  Hired:     { dot: 'bg-green-500',  cls: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30' },
  Present:   { dot: 'bg-green-500',  cls: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30' },
  Absent:    { dot: 'bg-red-500',    cls: 'bg-red-50 text-red-600 ring-red-500/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-500/30' },
  'On Leave':{ dot: 'bg-amber-400',  cls: 'bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-500/30' },
  'Half Day':{ dot: 'bg-blue-500',   cls: null },
  WFH:       { dot: 'bg-purple-500', cls: 'bg-purple-50 text-purple-700 ring-purple-500/20 dark:bg-purple-900/20 dark:text-purple-400 dark:ring-purple-500/30' },
  Earning:   { dot: 'bg-green-500',  cls: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30' },
  Deduction: { dot: 'bg-red-500',    cls: 'bg-red-50 text-red-600 ring-red-500/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-500/30' },
  'In Progress': { dot: 'bg-blue-500', cls: 'bg-blue-50 text-blue-700 ring-blue-500/20 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-500/30' },
  Allocated:     { dot: 'bg-blue-500',  cls: 'bg-blue-50 text-blue-700 ring-blue-500/20 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-500/30' },
  Returned:      { dot: 'bg-gray-400',  cls: 'bg-gray-100 text-gray-500 ring-gray-400/30 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-500/30' },
  Withdrawn:     { dot: 'bg-gray-400',  cls: 'bg-gray-100 text-gray-500 ring-gray-400/30 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-500/30' },
  'Goals Set':          { dot: 'bg-blue-500',   cls: 'bg-blue-50 text-blue-700 ring-blue-500/20 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-500/30' },
  'Self Evaluated':     { dot: 'bg-purple-500', cls: 'bg-purple-50 text-purple-700 ring-purple-500/20 dark:bg-purple-900/20 dark:text-purple-400 dark:ring-purple-500/30' },
  'Manager Evaluated':  { dot: 'bg-amber-400',  cls: 'bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-500/30' },
  'Business Evaluated': { dot: 'bg-orange-400', cls: 'bg-orange-50 text-orange-700 ring-orange-500/20 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-500/30' },
};

export default function Badge({ text }) {
  const v = VARIANTS[text];

  if (!v || v.cls === null) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset"
        style={{ background: '#EBF4FF', color: '#1A6AB4', '--tw-ring-color': 'rgba(26,106,180,0.25)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#1A6AB4' }} />
        {text || '—'}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${v.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${v.dot}`} />
      {text || '—'}
    </span>
  );
}
