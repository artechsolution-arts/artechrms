import { useState } from 'react';
import { api } from '../api';
import { X, Settings as SettingsIcon, Lock, Sun, Moon, Image as ImageIcon, Check, Eye, EyeOff, Palette } from 'lucide-react';
import { useTheme, ACCENT_THEMES } from '../hooks/useTheme';
import { useBackground, BACKGROUNDS } from '../hooks/useBackground';

const TABS = [
  { key: 'password',   label: 'Password',   icon: Lock },
  { key: 'appearance', label: 'Appearance', icon: Sun },
  { key: 'background', label: 'Background',  icon: ImageIcon },
];

export default function SettingsModal({ open, onClose, toast }) {
  const [tab, setTab] = useState('password');
  const { accent, setAccent, darkMode, setDarkMode } = useTheme();
  const { background, setBackground } = useBackground();

  // Password form
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const changePassword = async (e) => {
    e.preventDefault();
    if (!pw.current || !pw.next) return toast('Fill all password fields', 'warning');
    if (pw.next.length < 6) return toast('New password must be at least 6 characters', 'warning');
    if (pw.next !== pw.confirm) return toast('New passwords do not match', 'warning');
    setSaving(true);
    try {
      await api('POST', '/api/auth/change-password', { current_password: pw.current, new_password: pw.next });
      toast('Password changed successfully', 'success');
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const INPUT = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <SettingsIcon size={16} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Settings</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 flex-col sm:flex-row">
          {/* Tab rail — horizontal scrolling on mobile, vertical sidebar on sm+ */}
          <div className="flex sm:flex-col sm:w-44 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800 p-2 flex-shrink-0 overflow-x-auto gap-1 sm:gap-0">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap sm:w-full sm:mb-0.5 transition-colors ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  style={active ? { background: 'var(--accent)' } : {}}>
                  <Icon size={15} /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">

            {/* ── PASSWORD ── */}
            {tab === 'password' && (
              <form onSubmit={changePassword} className="space-y-4 max-w-sm">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Change Password</h3>
                  <p className="text-xs text-gray-400 mb-4">Update your account password</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} className={INPUT + ' pr-10'} style={{ '--tw-ring-color': 'var(--accent)' }}
                      value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-2.5 text-gray-400">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">New Password</label>
                  <input type={showPw ? 'text' : 'password'} className={INPUT} style={{ '--tw-ring-color': 'var(--accent)' }}
                    value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Confirm New Password</label>
                  <input type={showPw ? 'text' : 'password'} className={INPUT} style={{ '--tw-ring-color': 'var(--accent)' }}
                    value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} placeholder="Re-enter new password" />
                </div>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: 'var(--accent)' }}>
                  {saving ? 'Saving…' : 'Update Password'}
                </button>
              </form>
            )}

            {/* ── APPEARANCE ── */}
            {tab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Theme</h3>
                  <p className="text-xs text-gray-400 mb-3">Choose light or dark mode</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { mode: false, label: 'Light', icon: Sun,  bg: '#F4F8FF', fg: '#0D1F4E' },
                      { mode: true,  label: 'Dark',  icon: Moon, bg: '#0F172A', fg: '#e2e8f0' },
                    ].map(({ mode, label, icon: Icon, bg, fg }) => {
                      const active = darkMode === mode;
                      return (
                        <button key={label} onClick={() => setDarkMode(mode)}
                          className={`relative p-4 rounded-xl border-2 transition-all ${active ? '' : 'border-gray-200 dark:border-gray-700'}`}
                          style={active ? { borderColor: 'var(--accent)' } : {}}>
                          <div className="rounded-lg p-4 mb-2 flex items-center justify-center" style={{ background: bg }}>
                            <Icon size={20} style={{ color: fg }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                            {active && <Check size={15} style={{ color: 'var(--accent)' }} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-1.5">
                    <Palette size={14} /> Accent Color
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">Highlight color across the app</p>
                  <div className="flex items-center gap-3">
                    {ACCENT_THEMES.map(t => (
                      <button key={t.name} onClick={() => setAccent(t.name)}
                        className="relative w-10 h-10 rounded-full transition-transform active:scale-90 flex items-center justify-center"
                        style={{ backgroundColor: t.hex, boxShadow: accent === t.name ? `0 0 0 2px var(--background,#fff), 0 0 0 4px ${t.hex}` : 'none' }}
                        title={t.label}>
                        {accent === t.name && <Check size={16} className="text-white" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">Note: choosing a background image overrides the accent.</p>
                </div>
              </div>
            )}

            {/* ── BACKGROUND ── */}
            {tab === 'background' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Background Theme</h3>
                <p className="text-xs text-gray-400 mb-4">Pick a backdrop — accent color and light/dark mode adapt to your choice.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BACKGROUNDS.map(bg => {
                    const active = background === bg.key;
                    return (
                      <button key={bg.key} onClick={() => setBackground(bg.key)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${active ? '' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
                        style={active ? { borderColor: bg.accent } : {}}>
                        <div className="h-24 w-full relative" style={{
                          background: bg.thumb ? `url(/themes/${bg.thumb})` : 'linear-gradient(135deg, #1A6AB4, #3DC7B3)',
                          backgroundSize: 'cover', backgroundPosition: 'center',
                        }}>
                          {active && (
                            <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: bg.accent }}>
                              <Check size={13} className="text-white" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <div className="px-2.5 py-2 bg-white dark:bg-gray-800">
                          <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{bg.label}</div>
                          <div className="text-[10px] text-gray-400">{bg.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
