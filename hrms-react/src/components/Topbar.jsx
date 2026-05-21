import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Menu, Bell, Home, ChevronRight, Palette, Sun, Moon, X } from 'lucide-react';
import { NAV } from './Sidebar';
import { EMP_NAV } from './EmployeeSidebar';
import { ACCENT_THEMES } from '../hooks/useTheme';
import { api } from '../api';

const SEEN_KEY = 'artech_seen_notif_ids';
const SLIDE_DURATION = 5000; // ms before auto-dismiss

function SlideNotif({ notif, onClose, onNavigate }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Trigger slide-in on next tick
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss
    const t2 = setTimeout(() => dismiss(), SLIDE_DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(onClose, 350);
  };

  const PRIORITY_BG = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' };
  const bar = PRIORITY_BG[notif.priority] || '#6b7280';

  return (
    <div
      className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[320px] overflow-hidden cursor-pointer select-none"
      style={{
        transform: visible && !leaving ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
        opacity: visible && !leaving ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.2,0.64,1), opacity 0.3s ease',
      }}
      onClick={() => { if (notif.action) { onNavigate(notif.action); dismiss(); } }}
    >
      {/* Priority bar */}
      <div style={{ height: 3, backgroundColor: bar }} />
      <div className="flex items-start gap-3 px-3.5 py-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{notif.icon || '🔔'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{notif.title}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-snug">{notif.message}</p>
          {notif.time && <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>}
        </div>
        <button
          onClick={e => { e.stopPropagation(); dismiss(); }}
          className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 mt-0.5"
        >
          <X size={13} />
        </button>
      </div>
      {/* Progress bar */}
      <div style={{ height: 2, backgroundColor: 'var(--accent-50)' }}>
        <div
          style={{
            height: '100%',
            backgroundColor: 'var(--accent)',
            width: visible && !leaving ? '0%' : '100%',
            transition: visible && !leaving ? `width ${SLIDE_DURATION}ms linear` : 'none',
          }}
        />
      </div>
    </div>
  );
}

const ALL_NAV = [
  ...NAV,
  ...EMP_NAV.map(n => ({ ...n, section: 'Self Service' })),
];

const PRIORITY_DOT = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-gray-300',
};

export default function Topbar({ current, onNavigate, onToggleSidebar, accent, setAccent, darkMode, setDarkMode }) {
  const isEmployee = current?.startsWith('emp-');
  const meta = ALL_NAV.find(n => n.key === current) || { label: current, section: null };
  const homeKey = isEmployee ? 'emp-dashboard' : 'dashboard';

  const [themeOpen, setThemeOpen]   = useState(false);
  const [bellOpen, setBellOpen]     = useState(false);
  const [notifs, setNotifs]         = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [slideNotifs, setSlideNotifs] = useState([]);   // { uid, ...notif }

  const themeRef     = useRef(null);
  const bellRef      = useRef(null);
  const sessionStart = useRef(Date.now());

  const fetchNotifs = useCallback(async () => {
    setNotifsLoading(true);
    try {
      const data = await api('GET', '/api/notifications');
      const list = Array.isArray(data) ? data : [];
      setNotifs(list);

      // Show slide-in toasts for IDs not yet seen
      const seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
      const fresh = list.filter(n => !seen.has(String(n.id)));
      if (fresh.length) {
        // On the very first poll (within 2s of session start), only toast if
        // there are truly new ones — avoids blasting old notifs on every login
        const isFirstPoll = Date.now() - sessionStart.current < 2000;
        if (!isFirstPoll) {
          setSlideNotifs(prev => [
            ...prev,
            ...fresh.slice(0, 3).map(n => ({ ...n, uid: `${n.id}-${Date.now()}` })),
          ]);
        }
      }
      // Mark all current as seen
      localStorage.setItem(SEEN_KEY, JSON.stringify(list.map(n => String(n.id))));
    } catch { setNotifs([]); }
    finally { setNotifsLoading(false); }
  }, []);

  // Fetch on mount and every 30 seconds
  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = e => {
      if (themeRef.current && !themeRef.current.contains(e.target)) setThemeOpen(false);
      if (bellRef.current  && !bellRef.current.contains(e.target))  setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (notif) => {
    if (notif.action) onNavigate(notif.action);
    setBellOpen(false);
  };

  const unreadCount = notifs.length;

  return (
    <>
    <header className="sidebar-desktop h-11 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 items-center px-4 gap-3 flex-shrink-0 z-20">
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

        {/* Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => { setBellOpen(o => !o); if (!bellOpen) fetchNotifs(); }}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 relative"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-9 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-semibold text-gray-800 dark:text-white">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: 'var(--accent)' }}>
                      {unreadCount}
                    </span>
                  )}
                </span>
                <button onClick={() => setBellOpen(false)} className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                  <X size={14} />
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[360px] overflow-y-auto">
                {notifsLoading ? (
                  <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
                ) : notifs.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="text-2xl mb-2">🔔</div>
                    <p className="text-sm text-gray-500">You're all caught up!</p>
                    <p className="text-xs text-gray-400 mt-1">No new notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {notifs.map(n => (
                      <button
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                      >
                        <span className="text-lg flex-shrink-0 mt-0.5">{n.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">{n.title}</span>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[n.priority] || 'bg-gray-300'}`} />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">{n.message}</p>
                          {n.time && <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>}
                        </div>
                        {n.action && (
                          <ChevronRight size={13} className="flex-shrink-0 text-gray-300 mt-1" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifs.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 text-center">
                  <button
                    onClick={() => { setNotifs([]); setBellOpen(false); }}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme picker */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setThemeOpen(o => !o)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            title="Appearance"
          >
            <Palette size={16} />
          </button>

          {themeOpen && (
            <div className="absolute right-0 top-9 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3 z-50">
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
                    {accent === t.name && <span className="w-2.5 h-2.5 rounded-full bg-white/80" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>

    {/* Slide-in notification toasts — top-right, Teams/WhatsApp style */}
    {slideNotifs.length > 0 && createPortal(
      <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-2 pointer-events-none">
        {slideNotifs.map(n => (
          <div key={n.uid} className="pointer-events-auto">
            <SlideNotif
              notif={n}
              onNavigate={onNavigate}
              onClose={() => setSlideNotifs(prev => prev.filter(x => x.uid !== n.uid))}
            />
          </div>
        ))}
      </div>,
      document.body,
    )}
    </>
  );
}
