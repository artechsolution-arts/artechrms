import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Home, ChevronRight, Palette, Sun, Moon } from 'lucide-react';
import { NAV } from './Sidebar';
import { EMP_NAV } from './EmployeeSidebar';
import { ACCENT_THEMES } from '../hooks/useTheme';

const ALL_NAV = [
  ...NAV,
  ...EMP_NAV.map(n => ({ ...n, section: 'Self Service' })),
];

export default function Topbar({ current, onNavigate, onToggleSidebar, accent, setAccent, darkMode, setDarkMode }) {
  const isEmployee = current?.startsWith('emp-');
  const meta = ALL_NAV.find(n => n.key === current) || { label: current, section: null };
  const homeKey = isEmployee ? 'emp-dashboard' : 'dashboard';
  const [themeOpen, setThemeOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setThemeOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-11 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3 flex-shrink-0 z-20">
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 min-w-0">
        <button onClick={() => onNavigate(homeKey)} className="hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0">
          <Home size={14} />
        </button>
        {meta.section && (
          <>
            <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
            <span className="text-gray-400 flex-shrink-0 hidden sm:block">{meta.section}</span>
          </>
        )}
        <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
        <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{meta.label}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 relative">
          <Bell size={16} />
        </button>

        {/* Theme picker */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setThemeOpen(o => !o)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            title="Appearance"
          >
            <Palette size={16} />
          </button>

          {themeOpen && (
            <div className="absolute right-0 top-9 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3 z-50">
              {/* Dark / Light toggle */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Dark Mode</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
                  style={darkMode ? { backgroundColor: 'var(--accent)' } : {}}
                >
                  <span className={`absolute w-4 h-4 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  {darkMode ? <Moon size={10} className="absolute left-1 text-white" /> : <Sun size={10} className="absolute right-1 text-gray-400" />}
                </button>
              </div>

              {/* Accent colour swatches */}
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Accent Colour</div>
              <div className="grid grid-cols-5 gap-1.5">
                {ACCENT_THEMES.map(t => (
                  <button
                    key={t.name}
                    onClick={() => setAccent(t.name)}
                    title={t.label}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: t.hex }}
                  >
                    {accent === t.name && (
                      <span className="w-2.5 h-2.5 rounded-full bg-white/80" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
