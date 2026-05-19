const MAP = {
  Active:      'bg-green-100 text-green-700',
  Inactive:    'bg-gray-100 text-gray-600',
  Left:        'bg-red-100 text-red-600',
  Pending:     'bg-amber-100 text-amber-700',
  Approved:    'bg-green-100 text-green-700',
  Rejected:    'bg-red-100 text-red-600',
  Open:        'bg-green-100 text-green-700',
  Closed:      'bg-gray-100 text-gray-600',
  Draft:       'bg-gray-100 text-gray-600',
  Submitted:   'bg-blue-100 text-blue-700',
  Completed:   'bg-green-100 text-green-700',
  Applied:     'bg-gray-100 text-gray-600',
  Screening:   'bg-amber-100 text-amber-700',
  Interview:   'bg-amber-100 text-amber-700',
  Offered:     'bg-blue-100 text-blue-700',
  Hired:       'bg-green-100 text-green-700',
  Present:     'bg-green-100 text-green-700',
  Absent:      'bg-red-100 text-red-600',
  'On Leave':  'bg-amber-100 text-amber-700',
  'Half Day':  'bg-blue-100 text-blue-700',
  WFH:         'bg-purple-100 text-purple-700',
  Earning:     'bg-green-100 text-green-700',
  Deduction:   'bg-red-100 text-red-600',
};

export default function Badge({ text }) {
  const cls = MAP[text] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {text || '—'}
    </span>
  );
}
