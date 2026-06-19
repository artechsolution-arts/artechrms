import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Clock, Menu, X, Bell, Settings, ChevronRight, LogOut, Check, Image as ImageIcon } from 'lucide-react';
import { api } from '../api';
import { useBackground, BACKGROUNDS } from '../hooks/useBackground';

const PRIORITY_DOT = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-gray-300',
};

const NOTIF_ICON = {
  approval_request: '📋',
  approval_result:  '✅',
  info:             'ℹ️',
  alert:            '⚠️',
};

export default function MobileBottomNav({ primaryItems, allItems, current, onNavigate, accentColor, onOpenSettings, onLogout }) {
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [bellOpen, setBellOpen]           = useState(false);
  const [settingsOpen, setSettingsOpen]   = useState(false);
  const [notifs, setNotifs]               = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [notifsLoading, setNotifsLoading] = useState(false);

  const { background, setBackground } = useBackground();

  const accent = accentColor || 'var(--accent, #2563eb)';

  // Fetch unread badge count (lightweight — runs on poll interval)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await api('GET', '/api/notifications/unread-count');
      setUnreadCount(data?.count ?? 0);
    } catch { /* silent */ }
  }, []);

  // Fetch full persistent notification list (only when panel is opened)
  const fetchNotifs = useCallback(async () => {
    setNotifsLoading(true);
    try {
      const data = await api('GET', '/api/notifications/persistent?limit=30');
      setNotifs(Array.isArray(data) ? data : []);
      setUnreadCount((Array.isArray(data) ? data : []).filter(n => !n.is_read).length);
    } catch { setNotifs([]); }
    finally { setNotifsLoading(false); }
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 1024) return;
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(id);
  }, [fetchUnreadCount]);

  const handleNav = key => {
    onNavigate(key);
    setDrawerOpen(false);
    setBellOpen(false);
    setSettingsOpen(false);
  };

  const handleNotifClick = async notif => {
    // Mark as read via API then update local state
    if (!notif.is_read) {
      try {
        await api('POST', `/api/notifications/${notif.id}/read`);
        setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch { /* silent */ }
    }
    if (notif.action) {
      onNavigate(notif.action);
      setBellOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api('POST', '/api/notifications/read-all');
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  // Determine home key from primaryItems
  const homeItem = primaryItems?.[0] || { key: 'dashboard', label: 'Home', icon: LayoutDashboard };

  // Determine attendance key — look in allItems for attendance-like items
  const attItem = allItems?.find(i => i.type === 'item' && (i.key?.includes('attendance')))
    || { key: 'my-attendance', label: 'Attendance', icon: Clock };

  return (
    <>
      {/* Backdrops */}
      {(drawerOpen || bellOpen || settingsOpen) && (
        <div className="fixed inset-0 bg-black/40 z-40 mobile-only"
          onClick={() => { setDrawerOpen(false); setBellOpen(false); setSettingsOpen(false); }} />
      )}

      {/* ── All-items slide-up drawer ── */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 mobile-only glass-mobile-panel rounded-t-2xl shadow-2xl transition-transform duration-300 ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">All Sections</span>
          <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[65vh] py-2 px-2">
          {allItems?.map((item, i) =>
            item.type === 'sep' ? (
              <div key={i} className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {item.label}
              </div>
            ) : item.key === '__logout__' ? null : (
              <button key={item.key} onClick={() => handleNav(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left mb-0.5 ${
                  current === item.key ? 'text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                style={current === item.key ? { backgroundColor: accent } : {}}>
                <item.icon size={16} className="flex-shrink-0" />
                <span>{item.label}</span>
                {current === item.key && <span className="ml-auto text-xs opacity-60">Current</span>}
              </button>
            )
          )}
        </div>
        <div className="h-safe-area-inset-bottom pb-4" />
      </div>

      {/* ── Notifications slide-up panel ── */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 mobile-only glass-mobile-panel rounded-t-2xl shadow-2xl transition-transform duration-300 ${bellOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Bell size={15} style={{ color: accent }} />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: accent }}>
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                className="text-xs font-medium hover:underline" style={{ color: accent }}>
                Mark all read
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
                <button key={n.id} onClick={() => handleNotifClick(n)}
                  className={`w-full px-4 py-3.5 flex items-start gap-3 active:bg-gray-100 dark:active:bg-gray-700 transition-colors text-left ${
                    n.is_read
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                      : 'bg-blue-50/60 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}>
                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    {!n.is_read
                      ? <span className={`w-2 h-2 rounded-full block ${PRIORITY_DOT[n.priority] || 'bg-blue-500'}`} />
                      : <span className="w-2 h-2 block" />
                    }
                  </div>
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {n.icon || NOTIF_ICON[n.notif_type] || '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight mb-0.5 ${n.is_read ? 'font-normal text-gray-600 dark:text-gray-400' : 'font-semibold text-gray-800 dark:text-gray-200'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">{n.message}</p>
                    {n.created_at && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {n.is_cc && <span className="text-[10px] text-gray-400 italic">CC</span>}
                  </div>
                  {n.action && <ChevronRight size={15} className="flex-shrink-0 text-gray-300 mt-1" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="h-safe-area-inset-bottom pb-4" />
      </div>

      {/* ── Settings slide-up panel ── */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 mobile-only glass-mobile-panel rounded-t-2xl shadow-2xl transition-transform duration-300 ${settingsOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Settings size={15} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Settings</span>
          </div>
          <button onClick={() => setSettingsOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-4 space-y-3">
          {/* Background picker */}
          <div className="px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5 mb-0.5">
              <ImageIcon size={13} className="text-gray-500" />
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Background</div>
            </div>
            <div className="text-xs text-gray-400 mb-3">Pick a backdrop theme</div>
            <div className="grid grid-cols-3 gap-2">
              {BACKGROUNDS.map(bg => {
                const active = background === bg.key;
                return (
                  <button key={bg.key} onClick={() => setBackground(bg.key)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${active ? '' : 'border-transparent'}`}
                    style={active ? { borderColor: bg.accent } : {}}>
                    <div className="h-16 w-full" style={{
                      background: bg.thumb ? `url(/themes/${bg.thumb})` : 'linear-gradient(135deg, #1A6AB4, #3DC7B3)',
                      backgroundSize: 'cover', backgroundPosition: 'center',
                    }}>
                      {active && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: bg.accent }}>
                          <Check size={11} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="px-1.5 py-1 bg-white dark:bg-gray-800">
                      <div className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 truncate">{bg.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logout */}
          {onLogout && (
            <>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">Account</div>
              <button
                onClick={() => { setSettingsOpen(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <LogOut size={15} className="text-red-500" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-red-600 dark:text-red-400">Sign Out</div>
                  <div className="text-xs text-red-400/70 dark:text-red-500/60">Sign out of Artech HRMS</div>
                </div>
              </button>
            </>
          )}
        </div>
        <div className="h-safe-area-inset-bottom pb-4" />
      </div>

      {/* ── Bottom nav bar: Home | Attendance | [More] | Bell | Settings ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 mobile-only glass-mobile-nav shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-end justify-around px-1 pt-2 pb-3">

          {/* Home */}
          <NavBtn item={homeItem} current={current} onNavigate={handleNav} accent={accent} label="Home" />

          {/* Attendance */}
          <NavBtn item={attItem} current={current} onNavigate={handleNav} accent={accent} label="Attendance" />

          {/* Centre "More" — elevated pill */}
          <div className="flex flex-col items-center gap-1 -mt-5">
            <button onClick={() => { setDrawerOpen(o => !o); setBellOpen(false); setSettingsOpen(false); }}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-100 active:scale-95"
              style={{ backgroundColor: accent }}>
              {drawerOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
            </button>
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">More</span>
          </div>

          {/* Notifications */}
          <div className="flex flex-col items-center gap-1 px-2 py-1">
            <button onClick={() => { const opening = !bellOpen; setBellOpen(opening); setDrawerOpen(false); setSettingsOpen(false); if (opening) fetchNotifs(); }}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform duration-100"
              style={bellOpen ? { backgroundColor: accent + '22' } : {}}>
              <Bell size={20} style={bellOpen ? { color: accent } : {}} className={bellOpen ? '' : 'text-gray-400 dark:text-gray-500'} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                  style={{ backgroundColor: accent }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <span className="text-[10px] font-medium" style={bellOpen ? { color: accent } : { color: '#9CA3AF' }}>
              Alerts
            </span>
          </div>

          {/* Settings */}
          <div className="flex flex-col items-center gap-1 px-2 py-1">
            <button onClick={() => { setSettingsOpen(o => !o); setDrawerOpen(false); setBellOpen(false); }}
              className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all"
              style={settingsOpen ? { backgroundColor: accent + '22' } : {}}>
              <Settings size={20} style={settingsOpen ? { color: accent } : {}} className={settingsOpen ? '' : 'text-gray-400 dark:text-gray-500'} />
            </button>
            <span className="text-[10px] font-medium" style={settingsOpen ? { color: accent } : { color: '#9CA3AF' }}>
              Settings
            </span>
          </div>

        </div>
      </nav>
    </>
  );
}

function NavBtn({ item, current, onNavigate, accent, label }) {
  const active = current === item?.key;
  return (
    <button onClick={() => item?.key && onNavigate(item.key)}
      className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-transform duration-100 active:scale-95">
      {item?.icon && (
        <item.icon size={20}
          style={active ? { color: accent } : {}}
          className={active ? '' : 'text-gray-400 dark:text-gray-500'} />
      )}
      <span className="text-[10px] font-medium"
        style={active ? { color: accent } : { color: '#9CA3AF' }}>
        {label || item?.label?.replace('My ', '') || ''}
      </span>
    </button>
  );
}
