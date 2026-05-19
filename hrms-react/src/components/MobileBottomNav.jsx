import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function MobileBottomNav({ primaryItems, allItems, current, onNavigate, accentColor }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const accent = accentColor || 'var(--accent, #2563eb)';

  const handleNav = key => {
    onNavigate(key);
    setDrawerOpen(false);
  };

  // Split: 2 left, center More, 2 right
  const left = primaryItems.slice(0, 2);
  const right = primaryItems.slice(2, 4);

  return (
    <>
      {/* Slide-up drawer backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 mobile-only"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Slide-up all-items drawer */}
      <div className={`
        fixed bottom-0 left-0 right-0 z-50 mobile-only
        bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl
        transition-transform duration-300
        ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Menu</span>
          <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] py-2 px-2">
          {allItems.map((item, i) =>
            item.type === 'sep' ? (
              <div key={i} className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {item.label}
              </div>
            ) : (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left mb-0.5 ${
                  current === item.key
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                style={current === item.key ? { backgroundColor: accent } : {}}
              >
                <item.icon size={16} className="flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          )}
        </div>
        <div className="h-safe-area-inset-bottom pb-4" />
      </div>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 mobile-only bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-end justify-around px-2 pt-2 pb-3">
          {left.map(item => (
            <NavBtn key={item.key} item={item} current={current} onNavigate={handleNav} accent={accent} />
          ))}

          {/* Centre "More" button — elevated */}
          <div className="flex flex-col items-center gap-1 -mt-5">
            <button
              onClick={() => setDrawerOpen(o => !o)}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
              style={{ backgroundColor: accent }}
            >
              {drawerOpen ? <X size={22} className="text-white" /> : <Menu size={22} className="text-white" />}
            </button>
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">More</span>
          </div>

          {right.map(item => (
            <NavBtn key={item.key} item={item} current={current} onNavigate={handleNav} accent={accent} />
          ))}
        </div>
      </nav>
    </>
  );
}

function NavBtn({ item, current, onNavigate, accent }) {
  const active = current === item.key;
  return (
    <button
      onClick={() => onNavigate(item.key)}
      className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all active:scale-95"
    >
      <item.icon
        size={20}
        style={active ? { color: accent } : {}}
        className={active ? '' : 'text-gray-400 dark:text-gray-500'}
      />
      <span
        className="text-[10px] font-medium"
        style={active ? { color: accent } : {}}
      >
        {item.label.replace('My ', '')}
      </span>
    </button>
  );
}
