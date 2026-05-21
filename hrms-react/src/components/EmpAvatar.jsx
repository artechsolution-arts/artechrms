const GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-teal-500 to-cyan-600',
  'from-green-500 to-emerald-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-pink-600',
];

const SIZE = {
  xs:  'w-6 h-6 text-[10px]',
  sm:  'w-8 h-8 text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-12 h-12 text-sm',
  xl:  'w-16 h-16 text-base',
};

/**
 * Employee avatar — shows uploaded photo when available, falls back to
 * gradient initials tile. Accepts a stable `colorIndex` to keep gradient
 * consistent across re-renders.
 */
export default function EmpAvatar({ name = '', photo, size = 'md', colorIndex = 0, className = '', rounded = 'rounded-xl' }) {
  const dim = SIZE[size] || SIZE.md;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const gradient = GRADIENTS[Math.abs(colorIndex) % GRADIENTS.length];

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${dim} ${rounded} object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div className={`${dim} ${rounded} bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 ${className}`}>
      <span className="text-white font-bold leading-none">{initials}</span>
    </div>
  );
}
