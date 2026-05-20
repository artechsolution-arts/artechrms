import { useState, useEffect, useCallback } from 'react';
import { Menu, X, Bell, ChevronRight } from 'lucide-react';
import { api } from '../api';

const PRIORITY_DOT = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-gray-300',
};

export default function MobileBottomNav({ primaryItems, allItems, current, onNavigate, accentColor }) {
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [bellOpen, setBellOpen]       = useState(false);
  const [notifs, setNotifs]           = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);

  const accent = accentColor || 'var(--accent, #2563eb)';

  const fetchNotifs = useCallback(async () => {
    setNotifsLoading(true);
    try {
      const data = await api('GET', '/api/notifications');
      setNotifs(Array.isArray(data) ? data : []);
    } catch { setNotifs([]); }
    finally { setNotifsLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 60000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  const handleNav = key => {
    onNavigate(key);
    setDrawerOpen(false);
    setBellOpen(false);
  };

  const handleNotifClick = notif => {
    if (notif.action) onNavigate(notif.action);
    setBellOpen(false);
  };

  const unreadCount = notifs.length;

  // Split: 2 left, center More, Bell, 2 right
  const left  = primaryItems.slice(0, 2);
  const right = primaryItems.slice(2, 4);

  return (
    <>
      {/* Backdrops */}
      {(drawerOpen || bellOpen) && (
        <div
          className="fixed inset-0 bg-black/40 z-40 mobile-only"
          onClick={() => { setDrawerOpen(false); setBellOpen(false); }}
        />
      )}

      {/* ── All-items slide-up drawer ── */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 mobile-only bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
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
                  current === item.key ? 'text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
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

      {/* ── Notifications slide-up panel ── */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 mobile-only bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ${bellOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: accent }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => { setNotifs([]); setBellOpen(false); }}
                className="text-xs font-medium hover:underline"
                style={{ color: accent }}
              >
                Clear all
              </button>
            )}
            <button onClick={() => setBellOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {notifsLoading ? (
            <div className="py-10 text-center text-sm text-gray-400">Loading…</div>
          ) : notifs.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-3xl mb-2">🔔</div>
              <p className="text-sm text-gray-500">You're all caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 py-1">
              {notifs.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className="w-full px-4 py-3.5 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 transition-colors text-left"
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">{n.title}</span>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[n.priority] || 'bg-gray-300'}`} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">{n.message}</p>
                    {n.time && <p className="text-[11px] text-gray-400 mt-1">{n.time}</p>}
                  </div>
                  {n.action && <ChevronRight size={15} className="flex-shrink-0 text-gray-300 mt-1" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="h-safe-area-inset-bottom pb-4" />
      </div>

      {/* ── Bottom nav bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 mobile-only bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-end justify-around px-1 pt-2 pb-3">
          {/* Left 2 items */}
          {left.map(item => (
            <NavBtn key={item.key} item={item} current={current} onNavigate={handleNav} accent={accent} />
          ))}

          {/* Centre "More" button — elevated */}
          <div className="flex flex-col items-center gap-1 -mt-5">
            <button
              onClick={() => { setDrawerOpen(o => !o); setBellOpen(false); }}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
              style={{ backgroundColor: accent }}
            >
              {drawerOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
            </button>
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">More</span>
          </div>

          {/* Bell — with badge */}
          <div className="flex flex-col items-center gap-1 px-2 py-1">
            <button
              onClick={() => { setBellOpen(o => !o); setDrawerOpen(false); if (!bellOpen) fetchNotifs(); }}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all"
              style={bellOpen ? { backgroundColor: accent + '22' } : {}}
            >
              <Bell size={20} style={bellOpen ? { color: accent } : {}} className={bellOpen ? '' : 'text-gray-400 dark:text-gray-500'} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: accent }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <span className="text-[10px] font-medium" style={bellOpen ? { color: accent } : {}} >
              {bellOpen ? '' : <span className="text-gray-400 dark:text-gray-500">Alerts</span>}
              {bellOpen ? <span style={{ color: accent }}>Alerts</span> : ''}
            </span>
          </div>

          {/* Right 2 items */}
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
      className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all active:scale-95"
    >
      <item.icon
        size={20}
        style={active ? { color: accent } : {}}
        className={active ? '' : 'text-gray-400 dark:text-gray-500'}
      />
      <span
        className="text-[10px] font-medium"
        style={active ? { color: accent } : { color: 'inherit' }}
      >
        {item.label.replace('My ', '')}
      </span>
    </button>
  );
}
