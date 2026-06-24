import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS      = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SH   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const POPOVER_W = 232;
const POPOVER_H = 220;

function yearRange(centre) {
  const start = centre - 7;
  return Array.from({ length: 18 }, (_, i) => start + i);
}

/**
 * MonthYearPicker
 *
 * Props:
 *   month      {number}  1–12
 *   year       {number}  e.g. 2026
 *   onChange   {fn}      (month: number, year: number) => void
 *   maxMonth   {number?} disables "next" when current month >= maxMonth (same year)
 *   maxYear    {number?} hard cap on year
 *   className  {string?}
 *   btnClass   {string?} extra classes on the pill container
 */
export default function MonthYearPicker({
  month, year, onChange,
  maxMonth, maxYear,
  className = '', btnClass = '',
}) {
  const [open,     setOpen]     = useState(false);
  const [view,     setView]     = useState('months'); // 'months' | 'years'
  const [viewYear, setViewYear] = useState(year);
  const [yearPage, setYearPage] = useState(year);
  const [pos,      setPos]      = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const popRef     = useRef(null);

  const today = new Date();

  const isNextDisabled = () => {
    if (!maxYear && !maxMonth) return false;
    const ny = month === 12 ? year + 1 : year;
    const nm = month === 12 ? 1 : month + 1;
    if (maxYear && ny > maxYear) return true;
    if (maxYear && ny === maxYear && maxMonth && nm > maxMonth) return true;
    return false;
  };

  const prev = () => {
    const ny = month === 1 ? year - 1 : year;
    const nm = month === 1 ? 12 : month - 1;
    onChange(nm, ny);
  };
  const next = () => {
    if (isNextDisabled()) return;
    const ny = month === 12 ? year + 1 : year;
    const nm = month === 12 ? 1 : month + 1;
    onChange(nm, ny);
  };

  const openPop = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < POPOVER_H + 8 && rect.top > POPOVER_H + 8;
    let left = rect.left;
    if (left + POPOVER_W > window.innerWidth - 8) left = Math.max(8, rect.right - POPOVER_W);
    setPos({ top: openUp ? rect.top - POPOVER_H - 4 : rect.bottom + 4, left });
    setViewYear(year);
    setYearPage(year);
    setView('months');
    setOpen(true);
  }, [year]);

  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < POPOVER_H + 8 && rect.top > POPOVER_H + 8;
      let left = rect.left;
      if (left + POPOVER_W > window.innerWidth - 8) left = Math.max(8, rect.right - POPOVER_W);
      setPos({ top: openUp ? rect.top - POPOVER_H - 4 : rect.bottom + 4, left });
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => { window.removeEventListener('scroll', reposition, true); window.removeEventListener('resize', reposition); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMouse = e => {
      if (popRef.current && !popRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onMouse); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const years = yearRange(yearPage);

  const popover = open && createPortal(
    <div
      ref={popRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: POPOVER_W, zIndex: 9999 }}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-3"
    >
      {view === 'months' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setViewYear(y => y - 1)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button type="button" onClick={() => { setYearPage(viewYear); setView('years'); }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{viewYear}</span>
              <ChevronRight size={12} className="text-gray-400 rotate-90" />
            </button>
            <button type="button" onClick={() => setViewYear(y => y + 1)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MONTHS_SH.map((m, idx) => {
              const isSel = year === viewYear && month === idx + 1;
              const isNow = today.getFullYear() === viewYear && today.getMonth() === idx;
              const isMax = maxYear && (viewYear > maxYear || (viewYear === maxYear && maxMonth && idx + 1 > maxMonth));
              return (
                <button key={m} type="button" disabled={isMax}
                  onClick={() => { onChange(idx + 1, viewYear); setOpen(false); }}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-all
                    ${isMax ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : isSel ? 'text-white'
                      : isNow ? 'font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  style={isSel ? { backgroundColor: 'var(--accent)' }
                    : isNow && !isSel ? { color: 'var(--accent)', border: '1.5px solid var(--accent)' } : {}}
                >
                  {m}
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between">
            <button type="button"
              onClick={() => { setViewYear(today.getFullYear()); setView('months'); }}
              className="text-xs font-medium hover:underline" style={{ color: 'var(--accent)' }}>
              This month
            </button>
          </div>
        </>
      )}

      {view === 'years' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setYearPage(y => y - 18)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 select-none">
              {years[0]} – {years[years.length - 1]}
            </span>
            <button type="button" onClick={() => setYearPage(y => y + 18)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {years.map(yr => {
              const isSel = year === yr;
              const isNow = today.getFullYear() === yr;
              const isMax = maxYear && yr > maxYear;
              return (
                <button key={yr} type="button" disabled={isMax}
                  onClick={() => { setViewYear(yr); setView('months'); }}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-all
                    ${isMax ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : isSel ? 'text-white'
                      : isNow ? 'font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  style={isSel ? { backgroundColor: 'var(--accent)' }
                    : isNow && !isSel ? { color: 'var(--accent)', border: '1.5px solid var(--accent)' } : {}}
                >
                  {yr}
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
            <button type="button" onClick={() => setYearPage(today.getFullYear())}
              className="text-xs font-medium hover:underline" style={{ color: 'var(--accent)' }}>
              Jump to today
            </button>
          </div>
        </>
      )}
    </div>,
    document.body
  );

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button" onClick={prev}
        className={`p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors ${btnClass}`}
      >
        <ChevronLeft size={14} />
      </button>

      <button
        type="button" ref={triggerRef} onClick={openPop}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${btnClass}`}
      >
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 select-none whitespace-nowrap">
          {MONTHS[month - 1]} {year}
        </span>
        <ChevronRight size={11} className="text-gray-400 rotate-90 flex-shrink-0" />
      </button>

      <button
        type="button" onClick={next} disabled={isNextDisabled()}
        className={`p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${btnClass}`}
      >
        <ChevronRight size={14} />
      </button>

      {popover}
    </div>
  );
}
