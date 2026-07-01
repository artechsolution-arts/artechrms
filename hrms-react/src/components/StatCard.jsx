import { ArrowUpRight } from 'lucide-react';

/* ── Brand palette ── */
export const B = {
  navy:  '#0D1F4E',
  blue:  '#1A6AB4',
  teal:  '#3DC7B3',
  green: '#2DB37A',
  amber: '#F59E0B',
  red:   '#EF4444',
  cloud: '#F4F8FF',
  mist:  '#E8EDF5',
  steel: '#A0AABF',
};

/* Preset gradients matching the HR dashboard look */
export const GRADIENTS = {
  navy:   `linear-gradient(135deg, ${B.navy} 0%, ${B.blue} 100%)`,
  blue:   `linear-gradient(135deg, ${B.blue}, ${B.teal})`,
  teal:   `linear-gradient(135deg, #0E7490, ${B.teal})`,
  green:  `linear-gradient(135deg, #065F46, ${B.green})`,
  amber:  `linear-gradient(135deg, #92400E, ${B.amber})`,
  orange: `linear-gradient(135deg, #9A3412, #F97316)`,
  rose:   `linear-gradient(135deg, #D4607A, #FFAEC0)`,
  purple: `linear-gradient(135deg, #5B21B6, #C4B5FD)`,
  violet: `linear-gradient(135deg, #4C1D95, #7C3AED)`,
  indigo: `linear-gradient(135deg, #312E81, #4F46E5)`,
};

/* ── Shared Stat Card (same style as HR dashboard) ── */
export default function StatCard({ label, value, icon: Icon, gradient, sub, onClick, delay = 0 }) {
  const grad = GRADIENTS[gradient] || gradient || GRADIENTS.navy;
  return (
    <div
      onClick={onClick}
      style={{
        background: grad,
        borderRadius: 16,
        padding: '20px 22px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        animation: `dashFadeUp 0.3s cubic-bezier(0.23, 1, 0.32, 1) ${delay * 0.5}s both`,
        transition: 'transform 0.25s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.25s ease',
        boxShadow: '0 4px 20px rgba(13,31,78,0.12)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(13,31,78,0.2)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(13,31,78,0.12)'; }}
    >
      {/* decorative circles */}
      <div style={{ position: 'absolute', right: -20, top: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 10, bottom: -30, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {Icon && (
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} color="rgba(255,255,255,0.9)" />
          </div>
        )}
      </div>

      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 6 }}>
        {value ?? '—'}
      </div>

      {sub && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowUpRight size={11} color="rgba(255,255,255,0.5)" />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{sub}</span>
        </div>
      )}
    </div>
  );
}
