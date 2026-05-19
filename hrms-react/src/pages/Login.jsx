import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, Users, CalendarDays, DollarSign, BarChart3 } from 'lucide-react';

const FEATURES = [
  { icon: Users,        label: 'Employee Management',  desc: 'Onboard, manage & track your workforce' },
  { icon: CalendarDays, label: 'Leave & Attendance',    desc: 'Streamline approvals and time tracking' },
  { icon: DollarSign,   label: 'Payroll Processing',    desc: 'Accurate salary slips in seconds' },
  { icon: BarChart3,    label: 'Performance Reviews',   desc: 'Goal tracking and appraisal cycles' },
];

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('checking');
  const [form, setForm] = useState({ username: '', password: '', full_name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    fetch('/api/auth/needs-setup')
      .then(r => r.json())
      .then(d => setMode(d.needs_setup ? 'setup' : 'login'))
      .catch(() => setMode('login'));
  }, []);

  const f = v => setForm(prev => ({ ...prev, ...v }));

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) { setError('Username and password are required'); return; }
    setLoading(true);
    try {
      const body = new URLSearchParams({ username: form.username, password: form.password });
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Login failed');
      }
      const data = await res.json();
      onLogin(data.access_token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async e => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password || !form.full_name || !form.email) {
      setError('All fields are required');
      return;
    }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password, full_name: form.full_name, email: form.email, role: 'Admin' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Setup failed');
      }
      const data = await res.json();
      onLogin(data.access_token, data.user);
    } catch (err) {
      if (err.message?.toLowerCase().includes('setup already completed')) {
        setMode('login');
        setError('');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0f172a]">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] relative overflow-hidden p-12 bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0f172a]">

        {/* Animated blobs */}
        <div className="absolute top-[-120px] left-[-120px] w-[420px] h-[420px] rounded-full bg-blue-600/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full bg-indigo-500/20 blur-[80px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[40%] right-[10%] w-[200px] h-[200px] rounded-full bg-cyan-500/10 blur-[60px]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-none">Artech HRMS</div>
            <div className="text-blue-300/60 text-xs">Human Resource Management</div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-300 text-xs font-medium mb-6 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Built for Artech Solutions
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Manage your<br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              people, smarter.
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10">
            A complete HR platform to hire, manage, pay, and grow your team — all in one place.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="group bg-white/5 hover:bg-white/8 border border-white/8 hover:border-blue-500/30 rounded-xl p-4 transition-all duration-200">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mb-3">
                  <Icon size={15} className="text-blue-400" />
                </div>
                <div className="text-white text-sm font-semibold mb-0.5">{label}</div>
                <div className="text-slate-500 text-xs leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tag */}
        <div className="relative z-10 text-slate-600 text-xs">
          © {new Date().getFullYear()} Artech Solutions. All rights reserved.
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-[#0d1117]">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <span className="text-white font-bold text-lg">Artech HRMS</span>
        </div>

        <div className="w-full max-w-[400px]">

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">
              {mode === 'setup' ? 'Create admin account' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 text-sm">
              {mode === 'setup'
                ? 'Set up your first administrator account to get started.'
                : 'Sign in to continue to your dashboard.'}
            </p>
          </div>

          {mode === 'setup' && (
            <div className="mb-5 flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <span className="text-amber-400 text-sm mt-0.5">⚡</span>
              <p className="text-amber-300/80 text-xs leading-relaxed">
                First-time setup — no users exist yet. Create the administrator account to unlock the system.
              </p>
            </div>
          )}

          <form onSubmit={mode === 'setup' ? handleSetup : handleLogin} className="space-y-4">

            {mode === 'setup' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                <input
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="e.g. HR Administrator"
                  value={form.full_name}
                  onChange={e => f({ full_name: e.target.value })}
                  autoFocus
                />
              </div>
            )}

            {mode === 'setup' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                <input
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  type="email"
                  placeholder="admin@artechsolutions.in"
                  value={form.email}
                  onChange={e => f({ email: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Username or Email</label>
              <input
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder={mode === 'setup' ? 'Choose a username' : 'Username or email address'}
                value={form.username}
                onChange={e => f({ username: e.target.value })}
                autoFocus={mode === 'login'}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'setup' ? 'Min. 6 characters' : 'Enter your password'}
                  value={form.password}
                  onChange={e => f({ password: e.target.value })}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors p-1"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <span className="text-red-400 text-sm">⚠</span>
                <span className="text-red-400 text-xs">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> {mode === 'setup' ? 'Creating account…' : 'Signing in…'}</>
                : mode === 'setup' ? 'Create Account & Continue →' : 'Sign In →'
              }
            </button>
          </form>

          {/* Mode switch */}
          {mode === 'setup' && (
            <div className="mt-4 text-center">
              <span className="text-slate-600 text-xs">Already have an account? </span>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
              >
                Sign in instead
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-slate-700 text-xs">secure login</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 text-slate-700 text-xs">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Protected with JWT authentication · Sessions expire in 8 hours
          </div>
        </div>
      </div>
    </div>
  );
}
