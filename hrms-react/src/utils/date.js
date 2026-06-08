// Normalise any date/datetime string to YYYY-MM-DD
function _toYMD(d) {
  if (!d) return null;
  const s = String(d).trim();
  // PostgreSQL: "2026-05-18 13:55:34.851949+05:30"  → normalise space to T
  const iso = s.replace(' ', 'T');
  // Try Date constructor
  const dt = new Date(iso);
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  // Fallback: take first 10 chars if they look like YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

// Convert any date string → DD-MM-YYYY
export function fmtDate(d) {
  if (!d) return '—';
  const ymd = _toYMD(d);
  if (!ymd) return '—';
  const [y, m, day] = ymd.split('-');
  return `${day}-${m}-${y}`;
}

// Safe new Date() — never throws, returns null on invalid
export function safeDate(d) {
  if (!d) return null;
  const s = String(d).trim().replace(' ', 'T');
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

// Format as "18 May 2026" style
export function fmtDateLong(d) {
  const dt = safeDate(d);
  if (!dt) return '—';
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
