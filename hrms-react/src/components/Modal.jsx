import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, title, children, onClose, onSave, saveLabel = 'Save', hideSave = false, wide = false, extraActions = null, danger = false }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`modal-surface bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {children}
        </div>

        <div className="flex justify-between items-center gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex-shrink-0">
          <div>{extraActions}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            {!hideSave && (
              <button onClick={onSave} className={danger ? 'btn btn-danger' : 'btn btn-primary'}>{saveLabel}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormSection({ title, children }) {
  return (
    <div className="mb-5">
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        {title}
      </div>
      {children}
    </div>
  );
}

export function FormGrid({ children, cols = 2 }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-4`}>
      {children}
    </div>
  );
}

export function Field({ label, required, children, full, error }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="form-label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className={error ? 'field-error-wrap' : ''}>
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}
