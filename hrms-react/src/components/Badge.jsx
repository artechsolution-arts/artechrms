/* Brand-aligned badge colours
   Blue variants → ARTech Blue  #1A6AB4 on #EBF4FF
   Green variants → Growth Green #2DB37A on #E6F7EF
*/
const MAP = {
  Active:      'bg-green-100 text-green-700',
  Inactive:    'bg-gray-100 text-gray-500',
  Left:        'bg-red-100 text-red-600',
  Pending:     'bg-amber-100 text-amber-700',
  Approved:    'bg-green-100 text-green-700',
  Rejected:    'bg-red-100 text-red-600',
  Cancelled:   'bg-gray-100 text-gray-500',
  'Cancellation Requested': 'bg-orange-100 text-orange-700',
  'Edit Requested': 'bg-blue-100 text-blue-700',
  Open:        'bg-green-100 text-green-700',
  Closed:      'bg-gray-100 text-gray-500',
  Draft:       'bg-gray-100 text-gray-500',
  Submitted:   null,   /* brand-blue — see inline style below */
  Completed:   'bg-green-100 text-green-700',
  Fulfilled:   'bg-green-100 text-green-700',
  Applied:     'bg-gray-100 text-gray-500',
  Screening:   'bg-amber-100 text-amber-700',
  Interview:   'bg-amber-100 text-amber-700',
  Offered:     null,   /* brand-blue */
  Hired:       'bg-green-100 text-green-700',
  Present:     'bg-green-100 text-green-700',
  Absent:      'bg-red-100 text-red-600',
  'On Leave':  'bg-amber-100 text-amber-700',
  'Half Day':  null,   /* brand-blue */
  WFH:         'bg-purple-100 text-purple-700',
  Earning:     'bg-green-100 text-green-700',
  Deduction:   'bg-red-100 text-red-600',
};

const BRAND_BLUE = { background: '#EBF4FF', color: '#1A6AB4' };

export default function Badge({ text }) {
  const cls = MAP[text];
  if (cls === null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            style={BRAND_BLUE}>
        {text || '—'}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls || 'bg-gray-100 text-gray-500'}`}>
      {text || '—'}
    </span>
  );
}
