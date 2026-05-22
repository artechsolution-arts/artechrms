import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const POPOVER_W = 256;   // w-64
const POPOVER_H = 310;   // approximate height

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toYMD(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function yearRange(centreYear) {
  const start = centreYear - 7;
  return Array.from({ length: 18 }, (_, i) => start + i);
}

export default function DatePicker({ value, onChange, placeholder = 'Select date', min, max, disabled = false, className = '' }) {
  const [open, setOpen]           = useState(false);
  const [view, setView]           = useState('days');
  const [viewYear, setViewYear]   = useState(() => (parseDate(value) || new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (parseDate(value) || new Date()).getMonth());
  const [yearPage, setYearPage]   = useState(() => (parseDate(value) || new Date()).getFullYear());
  const [pos, setPos]             = useState({ top: 0, left: 0, openUp: false });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const selected = parseDate(value);
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const minDate  = parseDate(min);
  const maxDate  = parseDate(max);

  const openCalendar = useCallback(() => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceRight = window.innerWidth  - rect.left;
    const openUp     = spaceBelow < POPOVER_H + 8 && rect.top > POPOVER_H + 8;

    // Align left edge with trigger; if it would overflow right, shift left
    let left = rect.left;
    if (left + POPOVER_W > window.innerWidth - 8) {
      left = Math.max(8, rect.right - POPOVER_W);
    }

    setPos({
      top:    openUp ? rect.top - POPOVER_H - 4 : rect.bottom + 4,
      left,
      openUp,
    });

    const base = selected || today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setYearPage(base.getFullYear());
    setView('days');
    setOpen(true);
  }, [disabled, selected]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp     = spaceBelow < POPOVER_H + 8 && rect.top > POPOVER_H + 8;
      let left = rect.left;
      if (left + POPOVER_W > window.innerWidth - 8) left = Math.max(8, rect.right - POPOVER_W);
      setPos({ top: openUp ? rect.top - POPOVER_H - 4 : rect.bottom + 4, left, openUp });
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMouse = e => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setOpen(false);
    };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onMouse); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const isDayDisabled = d => {
    const dt = new Date(viewYear, viewMonth, d);
    return (minDate && dt < minDate) || (maxDate && dt > maxDate);
  };
  const isSelected = d => selected && selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === d;
  const isToday    = d => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;

  const selectDay = d => {
    if (isDayDisabled(d)) return;
    onChange(toYMD(new Date(viewYear, viewMonth, d)));
    setOpen(false);
  };

  const displayValue = selected
    ? `${String(selected.getDate()).padStart(2, '0')} ${MONTHS[selected.getMonth()].slice(0, 3)} ${selected.getFullYear()}`
    : '';

  const years = yearRange(yearPage);

  const popover = open && createPortal(
    <div
      ref={popoverRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: POPOVER_W, zIndex: 9999 }}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-3"
    >
      {/* ── DAYS VIEW ─────────────────────────────────────── */}
      {view === 'days' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ChevronLeft size={15} />
            </button>
            <button type="button" onClick={() => setView('months')}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 select-none">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <ChevronRight size={12} className="text-gray-400 rotate-90" />
            </button>
            <button type="button" onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d, idx) => (
              <div key={d} className={`text-center text-[11px] font-semibold py-1 ${idx === 0 || idx === 6 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px">
            {cells.map((d, i) => {
              if (!d) return <div key={`e-${i}`} />;
              const sel = isSelected(d);
              const dis = isDayDisabled(d);
              const tod = isToday(d);
              const wknd = (i % 7 === 0 || i % 7 === 6);
              return (
                <button
                  key={d} type="button" disabled={dis} onClick={() => selectDay(d)}
                  className={`w-8 h-8 mx-auto flex items-center justify-center text-xs rounded-full transition-all font-medium
                    ${dis ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'cursor-pointer'}
                    ${sel ? 'text-white font-semibold'
                      : tod ? 'font-bold'
                      : dis ? ''
                      : wknd ? 'text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  style={sel ? { backgroundColor: 'var(--accent)' } : tod && !sel ? { color: 'var(--accent)', border: '1.5px solid var(--accent)' } : {}}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button type="button"
              onClick={() => { onChange(toYMD(today)); setOpen(false); }}
              className="text-xs font-medium hover:underline" style={{ color: 'var(--accent)' }}>
              Today
            </button>
            {value && (
              <button type="button" onClick={() => { onChange(''); setOpen(false); }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium hover:underline">
                Clear
              </button>
            )}
          </div>
        </>
      )}

      {/* ── MONTHS VIEW ───────────────────────────────────── */}
      {view === 'months' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setViewYear(y => y - 1)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 transition-colors">
              <ChevronLeft size={15} />
            </button>
            <button type="button" onClick={() => { setYearPage(viewYear); setView('years'); }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{viewYear}</span>
              <ChevronRight size={12} className="text-gray-400 rotate-90" />
            </button>
            <button type="button" onClick={() => setViewYear(y => y + 1)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MONTHS_SHORT.map((m, idx) => {
              const isCur = selected && selected.getFullYear() === viewYear && selected.getMonth() === idx;
              const isNow = today.getFullYear() === viewYear && today.getMonth() === idx;
              return (
                <button key={m} type="button"
                  onClick={() => { setViewMonth(idx); setView('days'); }}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-all ${isCur ? 'text-white' : isNow ? 'font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  style={isCur ? { backgroundColor: 'var(--accent)' } : isNow && !isCur ? { color: 'var(--accent)', border: '1.5px solid var(--accent)' } : {}}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── YEARS VIEW ────────────────────────────────────── */}
      {view === 'years' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setYearPage(y => y - 18)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 transition-colors">
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 select-none">
              {years[0]} – {years[years.length - 1]}
            </span>
            <button type="button" onClick={() => setYearPage(y => y + 18)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {years.map(yr => {
              const isCur = selected && selected.getFullYear() === yr;
              const isNow = today.getFullYear() === yr;
              return (
                <button key={yr} type="button"
                  onClick={() => { setViewYear(yr); setView('months'); }}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-all ${isCur ? 'text-white' : isNow ? 'font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  style={isCur ? { backgroundColor: 'var(--accent)' } : isNow && !isCur ? { color: 'var(--accent)', border: '1.5px solid var(--accent)' } : {}}
                >
                  {yr}
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
            <button type="button" onClick={() => setYearPage(today.getFullYear())}
              className="text-xs font-medium hover:underline" style={{ color: 'var(--accent)' }}>
              Jump to today's year
            </button>
          </div>
        </>
      )}
    </div>,
    document.body
  );

  return (
    <div className={`relative ${className}`}>
      <div
        ref={triggerRef}
        onClick={openCalendar}
        className={`form-input flex items-center gap-2 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}`}
        style={{ minHeight: '38px' }}
      >
        <CalendarDays size={15} className="flex-shrink-0 text-gray-400" />
        <span className={`flex-1 text-sm ${displayValue ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
          {displayValue || placeholder}
        </span>
        {value && !disabled && (
          <button type="button" onClick={e => { e.stopPropagation(); onChange(''); }}
            className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        )}
      </div>
      {popover}
    </div>
  );
}
