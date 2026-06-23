import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Menu, Bell, Home, ChevronRight, X, CheckCheck } from 'lucide-react';
import { NAV } from './Sidebar';
import { EMP_NAV } from './EmployeeSidebar';
import { CEO_NAV } from './CeoSidebar';
import { api } from '../api';

const SEEN_KEY      = 'artech_seen_notif_ids';
const DISMISSED_KEY = 'artech_dismissed_notif_ids';
const TOKEN_KEY     = 'artech_hrms_token';
const SLIDE_DURATION = 5500;

/* ─────────────────────────────────────────────────────────────
   Teams-style toast: enters from bottom (slides up),
   exits to the right (left-to-right swipe dismiss)
───────────────────────────────────────────────────────────── */
function SlideNotif({ notif, onClose, onNavigate }) {
  const [phase, setPhase] = useState('enter'); // enter → show → leave

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 30);
    const t2 = setTimeout(dismiss, SLIDE_DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const dismiss = () => {
    setPhase('leave');
    setTimeout(onClose, 380);
  };

  const PRIORITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' };
  const color = PRIORITY_COLOR[notif.priority] || 'var(--accent, #1A6AB4)';

  const transform =
    phase === 'show'  ? 'translateY(0) scale(1)'    :
    phase === 'leave' ? 'translateX(115%)'           :
                        'translateY(28px) scale(0.95)';

  const transition =
    phase === 'leave'
      ? 'transform 0.32s cubic-bezier(0.4,0,1,1), opacity 0.22s ease'
      : 'transform 0.44s cubic-bezier(0.22,1.3,0.36,1), opacity 0.3s ease';

  return (
    <div
      style={{ transform, opacity: phase === 'show' ? 1 : 0, transition }}
      className="w-[340px] rounded-2xl overflow-hidden cursor-pointer select-none"
      onClick={() => { if (notif.action) onNavigate(notif.action); dismiss(); }}
    >
      <div className="bg-white/96 dark:bg-gray-900/96 backdrop-blur-2xl border border-gray-200/70 dark:border-gray-700/60 shadow-2xl rounded-2xl overflow-hidden">
        {/* Top accent gradient */}
        <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${color} 0%, ${color}55 100%)` }} />

        <div className="flex items-start gap-3 px-4 py-3.5">
          {/* Icon badge */}
          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-[17px] mt-0.5"
            style={{ background: color + '18' }}>
            {notif.icon || '🔔'}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-bold text-gray-900 dark:text-white leading-tight line-clamp-1">
                {notif.title}
              </p>
              {notif.time && (
                <span className="text-[10px] text-gray-400 flex-shrink-0">{notif.time}</span>
              )}
            </div>
            <p className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-snug">
              {notif.message}
            </p>
            {notif.action && (
              <span className="text-[10px] font-semibold mt-1.5 inline-block" style={{ color }}>
                Click to open →
              </span>
            )}
          </div>

          <button
            onClick={e => { e.stopPropagation(); dismiss(); }}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* Auto-dismiss countdown bar */}
        <div className="h-[2px] mx-4 mb-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: color,
              width: phase === 'show' ? '0%' : '100%',
              transition: phase === 'show' ? `width ${SLIDE_DURATION}ms linear` : 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Navigation map
───────────────────────────────────────────────────────────── */
const ALL_NAV = [
  ...NAV,
  ...EMP_NAV.map(n => ({ ...n, section: 'Self Service' })),
  ...CEO_NAV.map(n => ({ ...n, section: n.section || 'CEO' })),
];

const PRIORITY_COLORS = {
  high:   { dot: '#ef4444', light: '#fef2f2' },
  medium: { dot: '#f59e0b', light: '#fffbeb' },
  low:    { dot: '#6b7280', light: '#f9fafb' },
};

/* ─────────────────────────────────────────────────────────────
   Topbar
───────────────────────────────────────────────────────────── */
export default function Topbar({ current, onNavigate, onToggleSidebar }) {
  const isEmployee = current?.startsWith('emp-');
  const isCeo      = current?.startsWith('ceo-');
  const meta    = ALL_NAV.find(n => n.key === current) || { label: current, section: null };
  const homeKey = isEmployee ? 'emp-dashboard' : isCeo ? 'ceo-dashboard' : 'dashboard';

  const [bellOpen, setBellOpen]           = useState(false);
  const [notifs, setNotifs]               = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [slideNotifs, setSlideNotifs]     = useState([]);
  const [unreadIds, setUnreadIds]         = useState(new Set());

  const bellRef = useRef(null);

  /* helpers */
  const getDismissed = () => new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'));

  /* Core: update visible notification list + trigger slide-ins for fresh items */
  const applyNotifs = useCallback((list, isInitial = false) => {
    const dismissed = getDismissed();
    const visible   = list.filter(n => !dismissed.has(String(n.id)));

    const seen  = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
    const fresh = visible.filter(n => !seen.has(String(n.id)));

    if (fresh.length) {
      // Always update badge; only show slide-toasts for notifications arriving after initial load
      setUnreadIds(prev => new Set([...prev, ...fresh.map(n => String(n.id))]));
      if (!isInitial) {
        setSlideNotifs(prev => [
          ...prev,
          ...fresh.slice(0, 3).map(n => ({ ...n, uid: `${n.id}-${Date.now()}` })),
        ]);
      }
    }

    // Always update seen to include all received IDs (prevents duplicate slide-ins on reconnect)
    localStorage.setItem(SEEN_KEY, JSON.stringify(list.map(n => String(n.id))));
    setNotifs(visible);
  }, []);

  /* Manual fetch when bell is opened */
  const fetchNotifs = useCallback(async () => {
    setNotifsLoading(true);
    try {
      const data = await api('GET', '/api/notifications');
      applyNotifs(Array.isArray(data) ? data : []);
    } catch { setNotifs([]); }
    finally { setNotifsLoading(false); }
  }, [applyNotifs]);

  /* SSE: real-time push — reconnects with exponential backoff */
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    let es, retryDelay = 3000, retryTimer, isFirst = true;

    const connect = () => {
      es = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`);
      es.onmessage = e => {
        try {
          const list = JSON.parse(e.data);
          if (!Array.isArray(list)) return;
          applyNotifs(list, isFirst);
          isFirst = false;
          retryDelay = 3000;
        } catch {}
      };
      es.addEventListener('auth_error', () => es.close());
      es.onerror = () => {
        es.close();
        retryTimer = setTimeout(() => { retryDelay = Math.min(retryDelay * 2, 30000); connect(); }, retryDelay);
      };
    };

    connect();
    return () => { clearTimeout(retryTimer); if (es) es.close(); };
  }, [applyNotifs]);

  /* Outside click closes bell */
  useEffect(() => {
    const handler = e => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Opening the bell clears the unread badge */
  useEffect(() => {
    if (bellOpen) setUnreadIds(new Set());
  }, [bellOpen]);

  /* Dismiss all — persisted in localStorage so it survives refresh */
  const clearAll = () => {
    const ids      = notifs.map(n => String(n.id));
    const existing = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...new Set([...existing, ...ids])]));
    setNotifs([]);
    setUnreadIds(new Set());
    setBellOpen(false);
  };

  const handleNotifClick = notif => {
    if (notif.action) onNavigate(notif.action);
    setBellOpen(false);
  };

  const unreadCount = unreadIds.size;

  return (
    <>
      <header className="glass-topbar sidebar-desktop h-11 items-center px-4 gap-3 flex-shrink-0 z-20">
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

          {/* Bell button */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => { setBellOpen(o => !o); if (!bellOpen) fetchNotifs(); }}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 relative"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-10 w-[360px] rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-200/70 dark:border-gray-700/60">

                {/* Gradient header */}
                <div
                  className="px-4 py-3.5 flex items-center justify-between"
                  style={{ background: 'linear-gradient(135deg, var(--accent-dark,#0D1F4E) 0%, var(--accent,#1A6AB4) 100%)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                      <Bell size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-bold text-white tracking-tight">Notifications</span>
                    {notifs.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white border border-white/25">
                        {notifs.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setBellOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/15 text-white/60 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Notification list */}
                <div className="max-h-[400px] overflow-y-auto bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-800/80">
                  {notifsLoading ? (
                    <div className="py-10 flex flex-col items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                      />
                      <p className="text-xs text-gray-400">Loading…</p>
                    </div>
                  ) : notifs.length === 0 ? (
                    <div className="py-12 flex flex-col items-center gap-2 px-6">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-1">
                        <Bell size={20} className="text-gray-300 dark:text-gray-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">You're all caught up!</p>
                      <p className="text-xs text-gray-400 text-center">No notifications right now</p>
                    </div>
                  ) : (
                    notifs.map(n => {
                      const pc = PRIORITY_COLORS[n.priority] || PRIORITY_COLORS.low;
                      return (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left group"
                        >
                          {/* Priority dot */}
                          <div className="flex-shrink-0 mt-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pc.dot }} />
                          </div>

                          {/* Icon */}
                          <div
                            className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-base"
                            style={{ backgroundColor: pc.light }}
                          >
                            {n.icon || '🔔'}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 leading-tight line-clamp-1">
                                {n.title}
                              </span>
                              {n.time && (
                                <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{n.time}</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
                              {n.message}
                            </p>
                          </div>

                          {n.action && (
                            <ChevronRight
                              size={14}
                              className="flex-shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors mt-1"
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer — dismiss all (persists after refresh) */}
                {notifs.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900 flex items-center justify-center">
                    <button
                      onClick={clearAll}
                      className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-75 transition-opacity"
                      style={{ color: 'var(--accent)' }}
                    >
                      <CheckCheck size={13} />
                      Dismiss all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Teams-style slide toasts — bottom-right, stacked upward */}
      {slideNotifs.length > 0 && createPortal(
        <div className="fixed bottom-6 right-6 z-[9998] flex flex-col-reverse gap-3 pointer-events-none">
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
