export default function ToastContainer({ toasts }) {
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error:   'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium shadow-md animate-fade-in min-w-[260px] max-w-xs ${colors[t.type] || colors.info}`}
        >
          <span className="text-base leading-none">{icons[t.type] || icons.info}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
