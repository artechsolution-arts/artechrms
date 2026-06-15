import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

// Normalise options to [{value, label, description?}]
function norm(options) {
  return (options || []).map(o =>
    (typeof o === 'string' || typeof o === 'number') ? { value: o, label: String(o) } : o
  );
}

/**
 * Modern custom select dropdown.
 *
 * Props:
 *  value       — controlled value (string | number)
 *  onChange    — called with new value (string | number)
 *  options     — string[] | {value, label, description?}[]
 *  placeholder — text shown when nothing selected
 *  searchable  — show search input (good for 8+ options)
 *  clearable   — show × to clear the value
 *  disabled    — grey out and block interaction
 *  size        — 'sm' | 'md' (default 'md')
 *  className   — forwarded to wrapper div
 */
export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  searchable = false,
  clearable = false,
  disabled = false,
  size = 'md',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-focus search when panel opens
  useEffect(() => {
    if (open && searchable) {
      const t = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open, searchable]);

  const normalised = norm(options);
  const selected   = normalised.find(o => String(o.value) === String(value ?? ''));

  const filtered = searchable && search
    ? normalised.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : normalised;

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setSearch('');
  };

  const triggerSize = size === 'sm'
    ? 'px-2.5 py-1.5 text-xs rounded-md min-h-[30px]'
    : 'px-3 py-2 text-sm rounded-lg min-h-[38px]';

  return (
    <div ref={containerRef} className={`relative ${className}`}>

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={[
          'w-full flex items-center gap-2 border bg-white dark:bg-gray-900 text-left transition-[border-color,box-shadow]',
          triggerSize,
          open
            ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20 shadow-sm'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span className={`flex-1 truncate leading-snug ${
          selected ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
        }`}>
          {selected ? selected.label : placeholder}
        </span>

        <span className="flex items-center gap-1 flex-shrink-0">
          {clearable && value !== '' && value != null && (
            <span
              onMouseDown={e => { e.stopPropagation(); handleSelect(''); }}
              className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1.5 w-full min-w-[180px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">

          {/* Optional search */}
          {searchable && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] text-gray-700 dark:text-gray-300 placeholder-gray-400"
                  placeholder="Search…"
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="overflow-y-auto max-h-60 py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No options found</p>
            ) : (
              filtered.map(o => {
                const isSelected = String(o.value) === String(value ?? '');
                return (
                  <button
                    key={o.value}
                    type="button"
                    onMouseDown={() => handleSelect(o.value)}
                    className={[
                      'w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors',
                      isSelected
                        ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                    ].join(' ')}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-[13px] font-medium leading-snug">
                        {o.label}
                      </span>
                      {o.description && (
                        <span className={`block text-[11px] mt-0.5 leading-snug ${
                          isSelected ? 'text-[var(--accent)]/70' : 'text-gray-400'
                        }`}>
                          {o.description}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <Check size={13} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
