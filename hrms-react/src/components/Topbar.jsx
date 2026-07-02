import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Home, ChevronRight, X, CheckCheck, Calendar, CalendarX, Edit3, Receipt, FileText, LogOut, UserCog, UserPlus, Megaphone, Info, AlertTriangle, CheckCircle, Clock, ClipboardList, Cake, Award } from 'lucide-react';
import { NAV } from './Sidebar';
import { EMP_NAV } from './EmployeeSidebar';
import { CEO_NAV } from './CeoSidebar';
import { api } from '../api';

const TOKEN_KEY = 'artech_hrms_token';
const SLIDE_DURATION = 5500;

// Persistent notif entity types where entity_id is the employee ID
const EMPLOYEE_ENTITY_TYPES = new Set(['work_hours', 'salary_change', 'new_joiner']);

function _notifNavigate(notif, onNavigate) {
  const empId = notif.employee_id
    ?? (EMPLOYEE_ENTITY_TYPES.has(notif.entity_type) ? notif.entity_id : null);
  const action = notif.action;
  if (!action) return;
  if (empId) sessionStorage.setItem('nav-filter', JSON.stringify({ employeeId: empId }));
  // Store entity deep-link so the destination page can open the specific request
  if (notif.entity_id && notif.entity_type) {
    const dl = { entityId: notif.entity_id, entityType: notif.entity_type };
    sessionStorage.setItem('notif-deeplink', JSON.stringify(dl));
    // Dispatch a custom event so pages already mounted (same-page navigation) catch it immediately
    window.dispatchEvent(new CustomEvent('notif-deeplink', { detail: dl }));
  }
  onNavigate(action);
}

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
      onClick={() => { _notifNavigate(notif, onNavigate); dismiss(); }}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)' }}>
        {/* Top accent bar */}
        <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${color} 0%, ${color}88 100%)` }} />

        <div className="flex items-start gap-3 px-4 py-3.5">
          {/* Icon badge */}
          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
            style={{ background: color + '22' }}>
            <NotifIcon type={notif.type || notif.entity_type} size={17} color={color} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-bold text-gray-900 dark:text-gray-50 leading-tight line-clamp-1">
                {notif.title}
              </p>
              {notif.time && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0 font-medium">{notif.time}</span>
              )}
            </div>
            <p className="text-[11.5px] text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2 leading-snug">
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
            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* Auto-dismiss countdown bar */}
        <div className="h-[2px] mx-4 mb-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
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

const TYPE_ICON_MAP = {
  leave:            Calendar,
  cancel_request:   CalendarX,
  edit_request:     Edit3,
  expense:          Receipt,
  document:         FileText,
  resignation:      LogOut,
  profile_update:   UserCog,
  recruitment:      UserPlus,
  announcement:     Megaphone,
  reminder:         Clock,
  birthday:         Bell,
  anniversary:      Bell,
  probation:        Clock,
  new_joiner:       UserPlus,
  info:             Info,
  warning:          AlertTriangle,
  approval_request: ClipboardList,
  approval_result:  CheckCircle,
  alert:            AlertTriangle,
};

function NotifIcon({ type, size = 16, color }) {
  const Icon = TYPE_ICON_MAP[type] || Bell;
  return <Icon size={size} style={{ color }} />;
}

/* ─────────────────────────────────────────────────────────────
   Reminders Bell — birthdays & work anniversaries (HR/CEO/Admin)
───────────────────────────────────────────────────────────── */
function RemindersBell({ onNavigate }) {
  const [open, setOpen]         = useState(false);
  const [reminders, setReminders] = useState([]);
  const [loaded, setLoaded]     = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    api('GET', '/api/hrm/reminders').then(r => { setReminders(r || []); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const todayItems   = reminders.filter(r => r.days_until === 0);
  const upcomingItems = reminders.filter(r => r.days_until > 0);

  const fmtDay = days => days === 1 ? 'Tomorrow' : `In ${days} days`;
  const fmtDate = d => { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Reminders"
        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 relative"
      >
        <Calendar size={16} />
        {loaded && todayItems.length > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
            style={{ backgroundColor: '#f59e0b' }}
          >
            {todayItems.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-[320px] rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-200/70 dark:border-gray-700/60">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Cake size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold text-white">Reminders</span>
              {reminders.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white border border-white/25">{reminders.length}</span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/15 text-white/60 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto bg-white dark:bg-gray-900">
            {!loaded ? (
              <div className="py-8 flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" /></div>
            ) : reminders.length === 0 ? (
              <div className="py-10 text-center">
                <Cake size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming reminders</p>
              </div>
            ) : (
              <>
                {todayItems.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10">Today 🎉</div>
                    {todayItems.map(r => <ReminderRow key={r.id} r={r} onNavigate={onNavigate} onClose={() => setOpen(false)} label="Today" />)}
                  </div>
                )}
                {upcomingItems.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 dark:bg-gray-800/40">Upcoming</div>
                    {upcomingItems.map(r => <ReminderRow key={r.id} r={r} onNavigate={onNavigate} onClose={() => setOpen(false)} label={fmtDay(r.days_until)} fmtDate={fmtDate} />)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReminderRow({ r, onNavigate, onClose, label, fmtDate }) {
  const isBirthday = r.type === 'birthday';
  return (
    <button
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left"
      onClick={() => {
        sessionStorage.setItem('nav-filter', JSON.stringify({ employeeId: r.employee_id }));
        onNavigate('employees');
        onClose();
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm"
        style={{ background: isBirthday ? '#fef3c720' : '#ede9fe20', border: `1.5px solid ${isBirthday ? '#f59e0b' : '#8b5cf6'}33` }}
      >
        {isBirthday ? <Cake size={15} style={{ color: '#f59e0b' }} /> : <Award size={15} style={{ color: '#8b5cf6' }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 truncate">{r.name}</div>
        <div className="text-[11px] text-gray-400 truncate">{r.detail} · {r.department}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[10px] font-semibold" style={{ color: r.days_until === 0 ? '#f59e0b' : '#6b7280' }}>{label}</div>
        {fmtDate && <div className="text-[10px] text-gray-400">{fmtDate(r.date)}</div>}
      </div>
    </button>
  );
}

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
  const [unreadCount, setUnreadCount]     = useState(0);

  const bellRef    = useRef(null);
  const knownIds   = useRef(new Set()); // tracks IDs seen this session for slide-toast dedup

  /* Format timestamp as relative time */
  const fmtTime = ts => {
    if (!ts) return '';
    const d    = new Date(ts.endsWith('Z') ? ts : ts + 'Z');
    const diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60)    return 'Just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  /* Fetch persistent notifications from DB */
  const fetchNotifs = useCallback(async (silent = false) => {
    if (!silent) setNotifsLoading(true);
    try {
      const data = await api('GET', '/api/notifications/persistent?limit=50');
      const list = Array.isArray(data) ? data : [];

      // Slide-toast for any unread items we haven't seen this session
      const fresh = list.filter(n => !n.is_read && !knownIds.current.has(n.id));
      if (fresh.length && knownIds.current.size > 0) {
        setSlideNotifs(prev => [
          ...prev,
          ...fresh.slice(0, 3).map(n => ({ ...n, uid: `${n.id}-${Date.now()}`, type: n.entity_type, time: fmtTime(n.created_at) })),
        ]);
      }
      list.forEach(n => knownIds.current.add(n.id));

      setNotifs(list.map(n => ({ ...n, time: fmtTime(n.created_at), type: n.entity_type })));
      setUnreadCount(list.filter(n => !n.is_read).length);
    } catch { /* silent fail */ }
    finally { if (!silent) setNotifsLoading(false); }
  }, []);

  /* Initial fetch + poll every 30s */
  useEffect(() => {
    fetchNotifs();
    const id = setInterval(() => fetchNotifs(true), 30000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  /* Outside click closes bell */
  useEffect(() => {
    const handler = e => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Opening bell: refetch + mark all read in DB */
  useEffect(() => {
    if (bellOpen) {
      fetchNotifs();
      api('POST', '/api/notifications/read-all').catch(() => {});
      setUnreadCount(0);
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  }, [bellOpen, fetchNotifs]);

  /* Mark all read + close */
  const clearAll = () => {
    api('POST', '/api/notifications/read-all').catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    setBellOpen(false);
  };

  const handleNotifClick = notif => {
    _notifNavigate(notif, onNavigate);
    setBellOpen(false);
  };

  return (
    <>
      <header className="glass-topbar sidebar-desktop h-11 items-center px-4 gap-3 flex-shrink-0 z-20">

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

          {/* Reminders — birthdays & anniversaries (HR/CEO/Admin only) */}
          {!isEmployee && <RemindersBell onNavigate={onNavigate} />}

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
                      const pc      = PRIORITY_COLORS[n.priority] || PRIORITY_COLORS.low;
                      const isUnread = !n.is_read;
                      return (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left group ${isUnread ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                        >
                          {/* Unread dot */}
                          <div className="flex-shrink-0 mt-2.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isUnread ? pc.dot : 'transparent' }} />
                          </div>

                          {/* Icon */}
                          <div
                            className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: pc.light }}
                          >
                            <NotifIcon type={n.type} size={16} color={pc.dot} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <span className={`text-[12px] leading-tight line-clamp-1 ${isUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-gray-300'}`}>
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
                      Mark all read
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
