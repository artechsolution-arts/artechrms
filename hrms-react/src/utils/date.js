// Convert YYYY-MM-DD (or ISO datetime) to DD-MM-YYYY
export function fmtDate(d) {
  if (!d) return '—';
  const s = String(d).split('T')[0];
  const parts = s.split('-');
  if (parts.length !== 3) return String(d);
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}
