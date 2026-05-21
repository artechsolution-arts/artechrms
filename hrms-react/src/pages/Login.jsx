import { useState, useEffect } from 'react';
import {
  Loader2, Eye, EyeOff, Users, CalendarDays, Clock,
  BarChart3, DollarSign, TrendingUp, Shield, Zap, CheckCircle, Globe,
} from 'lucide-react';

const FEATURES = [
  { icon: Users,        title: 'Employee Management',   desc: 'Onboard and manage your workforce' },
  { icon: CalendarDays, title: 'Leave Management',      desc: 'Streamline leave requests & approvals' },
  { icon: Clock,        title: 'Attendance Tracking',   desc: 'Track attendance and working hours' },
  { icon: TrendingUp,   title: 'Performance Reviews',   desc: 'Goal tracking and appraisal cycles' },
  { icon: DollarSign,   title: 'Payroll Processing',    desc: 'Accurate payslips and compliance' },
  { icon: BarChart3,    title: 'Reports & Analytics',   desc: 'Insights to drive HR decisions' },
];

const BADGES = [
  { icon: Shield,      label: 'Secure',     sub: 'Safe & protected' },
  { icon: Zap,         label: 'Efficient',  sub: 'Save time on tasks' },
  { icon: CheckCircle, label: 'Compliant',  sub: 'Stay regulatory' },
  { icon: Globe,       label: 'Scalable',   sub: 'Grows with you' },
];

export default function Login({ onLogin }) {
  const [mode, setMode]       = useState('checking');
  const [form, setForm]       = useState({ username: '', password: '', full_name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
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
      const body = new URLSearchParams({ username: form.username.trim(), password: form.password.trim() });
      const res  = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || 'Login failed'); }
      const data = await res.json();
      onLogin(data.access_token, data.user);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSetup = async e => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password || !form.full_name || !form.email) { setError('All fields are required'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password, full_name: form.full_name, email: form.email, role: 'SuperAdmin' }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || 'Setup failed'); }
      const data = await res.json();
      onLogin(data.access_token, data.user);
    } catch (err) {
      if (err.message?.toLowerCase().includes('setup already completed')) { setMode('login'); setError(''); }
      else { setError(err.message); }
    } finally { setLoading(false); }
  };

  if (mode === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F4F8FF' }}>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(45px,-35px) scale(1.08)} 66%{transform:translate(-28px,22px) scale(0.93)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-38px,44px) scale(1.11)} 75%{transform:translate(30px,-20px) scale(0.95)} }
        @keyframes blob3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(22px,-32px) scale(1.06)} }
        @keyframes blob4 { 0%,100%{transform:translate(0,0)} 30%{transform:translate(-18px,28px)} 70%{transform:translate(24px,-16px)} }
        @keyframes ptUp  { 0%{transform:translateY(0) scale(1);opacity:0.8} 100%{transform:translateY(-110px) scale(0.2);opacity:0} }
        @keyframes riseIn{ from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:translateY(0)} }
        @keyframes illus { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes shimmerBtn { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes cardBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>

      {/* ══════════════════ LEFT PANEL ══════════════════ */}
      <div className="hidden lg:flex flex-col w-[58%] relative overflow-hidden"
           style={{ background: 'linear-gradient(158deg, #F4F8FF 0%, #EBF4FF 50%, #EDFAF7 100%)' }}>

        {/* ── Animated blobs ── */}
        <div className="absolute pointer-events-none rounded-full" style={{
          width: 460, height: 460, top: -160, left: -130,
          background: 'radial-gradient(circle, rgba(26,106,180,0.15) 0%, rgba(61,199,179,0.08) 55%, transparent 75%)',
          filter: 'blur(44px)', animation: 'blob1 17s ease-in-out infinite',
        }}/>
        <div className="absolute pointer-events-none rounded-full" style={{
          width: 320, height: 320, bottom: '8%', right: '-10%',
          background: 'radial-gradient(circle, rgba(61,199,179,0.2) 0%, transparent 68%)',
          filter: 'blur(38px)', animation: 'blob2 21s ease-in-out infinite',
        }}/>
        <div className="absolute pointer-events-none rounded-full" style={{
          width: 240, height: 240, top: '42%', left: '52%',
          background: 'radial-gradient(circle, rgba(26,106,180,0.12) 0%, transparent 70%)',
          filter: 'blur(32px)', animation: 'blob3 14s ease-in-out infinite',
        }}/>
        <div className="absolute pointer-events-none rounded-full" style={{
          width: 180, height: 180, top: '20%', right: '15%',
          background: 'radial-gradient(circle, rgba(61,199,179,0.15) 0%, transparent 70%)',
          filter: 'blur(28px)', animation: 'blob4 19s ease-in-out infinite 2s',
        }}/>

        {/* ── Floating particles ── */}
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute pointer-events-none rounded-full" style={{
            width:  3 + (i % 4),
            height: 3 + (i % 4),
            left:   `${6 + i * 9}%`,
            bottom: `${5 + (i % 5) * 10}%`,
            background: `rgba(26,106,180,${0.15 + (i % 3) * 0.07})`,
            animation: `ptUp ${4.5 + i * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.55}s`,
          }}/>
        ))}

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col h-full px-10 py-9">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8" style={{ animation: 'riseIn 0.6s ease-out both' }}>
            <img src="/logo.svg" alt="Artech" className="w-11 h-11 drop-shadow-md" />
            <div>
              <div className="font-bold text-brand text-[17px] leading-none">Artech HRMS</div>
              <div className="text-steel text-[11px] mt-0.5">Human Resource Management System</div>
            </div>
          </div>

          {/* Hero headline */}
          <div className="mb-5" style={{ animation: 'riseIn 0.7s ease-out 0.08s both' }}>
            <h1 className="text-[2.1rem] font-extrabold text-brand leading-tight mb-2.5 tracking-tight">
              Empowering People.<br />
              <span style={{ color: '#1A6AB4' }}>Enhancing Performance.</span>
            </h1>
            <p className="text-steel text-[13px] leading-relaxed max-w-[340px]">
              HRMS is a comprehensive solution to manage your most valuable asset — your people.
              Streamline HR processes, improve efficiency and drive organisation success.
            </p>
          </div>

          {/* Section label */}
          <div className="text-[11px] font-bold uppercase tracking-widest text-steel mb-3"
               style={{ animation: 'riseIn 0.6s ease-out 0.15s both' }}>
            Key HR Management Solutions
          </div>

          {/* Features 2×3 grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-auto">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <div key={i}
                   className="flex items-start gap-2.5 p-3 rounded-xl"
                   style={{
                     background: 'rgba(255,255,255,0.62)',
                     backdropFilter: 'blur(10px)',
                     border: '1px solid rgba(219,234,254,0.85)',
                     animation: `riseIn 0.55s ease-out ${0.2 + i * 0.065}s both`,
                     boxShadow: '0 1px 4px rgba(26,106,180,0.06)',
                   }}>
                <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: 'linear-gradient(135deg, #EBF4FF 0%, #EDFAF7 100%)' }}>
                  <Icon size={14} style={{ color: '#1A6AB4' }} />
                </div>
                <div>
                  <div className="text-[11.5px] font-semibold text-brand leading-tight">{title}</div>
                  <div className="text-[10.5px] text-steel mt-0.5 leading-snug">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom: illustration + badges */}
          <div className="flex items-end justify-between mt-6 pt-4"
               style={{ borderTop: '1px solid rgba(191,219,254,0.5)' }}>

            {/* SVG HR people illustration */}
            <div style={{ animation: 'illus 6s ease-in-out infinite', transformOrigin: 'bottom center' }}>
              <svg width="200" height="110" viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Floor / desk */}
                <rect x="10" y="76" width="168" height="7" rx="3.5" fill="#D6EAF8"/>
                <rect x="22" y="83" width="7" height="22" rx="2.5" fill="#C8E8E4"/>
                <rect x="161" y="83" width="7" height="22" rx="2.5" fill="#C8E8E4"/>

                {/* Monitor stand */}
                <rect x="88" y="72" width="24" height="6" rx="2" fill="#C8E8E4"/>
                <rect x="96" y="78" width="8" height="3" rx="1" fill="#A8DDD8"/>

                {/* Monitor */}
                <rect x="60" y="30" width="80" height="44" rx="5" fill="#1e40af" fillOpacity="0.12"/>
                <rect x="64" y="34" width="72" height="37" rx="3" fill="#1A6AB4" fillOpacity="0.18"/>
                {/* Screen UI lines */}
                <rect x="70" y="41" width="36" height="2.5" rx="1.2" fill="#1A6AB4" fillOpacity="0.55"/>
                <rect x="70" y="47" width="24" height="2" rx="1" fill="#3DC7B3" fillOpacity="0.5"/>
                <rect x="70" y="52" width="30" height="2" rx="1" fill="#3DC7B3" fillOpacity="0.4"/>
                <rect x="70" y="57" width="20" height="2" rx="1" fill="#3DC7B3" fillOpacity="0.35"/>
                {/* Chart bar in monitor */}
                <rect x="112" y="55" width="6" height="11" rx="1.5" fill="#3DC7B3" fillOpacity="0.45"/>
                <rect x="120" y="49" width="6" height="17" rx="1.5" fill="#1A6AB4" fillOpacity="0.55"/>

                {/* Person 1 — seated left */}
                <circle cx="34" cy="54" r="10" fill="#D6EAF8"/>
                <rect x="24" y="63" width="20" height="16" rx="4" fill="#EBF4FF"/>
                {/* Hair */}
                <path d="M24 54 Q34 42 44 54" fill="#C8E8E4"/>
                {/* Arm on desk */}
                <rect x="38" y="70" width="30" height="6" rx="3" fill="#D6EAF8"/>

                {/* Person 2 — standing right */}
                <circle cx="162" cy="48" r="10" fill="#C8E8E4"/>
                <rect x="152" y="57" width="20" height="20" rx="4" fill="#D6EAF8"/>
                {/* Hair */}
                <path d="M152 48 Q162 37 172 48" fill="#3DC7B3"/>
                {/* Clipboard */}
                <rect x="172" y="46" width="18" height="24" rx="2.5" fill="#EBF4FF"/>
                <rect x="179" y="43" width="6" height="4" rx="1.5" fill="#A8DDD8"/>
                <rect x="175" y="51" width="12" height="1.8" rx="0.9" fill="#C8E8E4"/>
                <rect x="175" y="55" width="8" height="1.8" rx="0.9" fill="#C8E8E4"/>
                <rect x="175" y="59" width="10" height="1.8" rx="0.9" fill="#C8E8E4"/>

                {/* Plant pot left */}
                <ellipse cx="12" cy="72" rx="8" ry="10" fill="#bbf7d0" fillOpacity="0.8"/>
                <ellipse cx="6" cy="69" rx="6" ry="8" fill="#86efac" fillOpacity="0.7"/>
                <rect x="10" y="74" width="4" height="8" rx="1.5" fill="#4ade80" fillOpacity="0.55"/>

                {/* Star/sparkle decoration */}
                <circle cx="140" cy="25" r="2.5" fill="#C8E8E4" fillOpacity="0.7"/>
                <circle cx="52" cy="22" r="2" fill="#3DC7B3" fillOpacity="0.6"/>
                <circle cx="170" cy="30" r="1.5" fill="#D6EAF8" fillOpacity="0.8"/>
              </svg>
            </div>

            {/* Trust badges 2×2 */}
            <div className="grid grid-cols-2 gap-2">
              {BADGES.map(({ icon: Icon, label, sub }, i) => (
                <div key={i}
                     className="flex flex-col items-center text-center px-3 py-2 rounded-xl"
                     style={{
                       background: 'rgba(255,255,255,0.58)',
                       border: '1px solid rgba(26,106,180,0.15)',
                       backdropFilter: 'blur(8px)',
                       animation: `cardBob ${5 + i * 0.8}s ease-in-out infinite`,
                       animationDelay: `${i * 0.5}s`,
                     }}>
                  <Icon size={14} style={{ color: '#1A6AB4', marginBottom: 3 }} />
                  <div className="text-[10px] font-bold text-brand">{label}</div>
                  <div className="text-[9px] text-steel leading-tight">{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-steel text-[10px] mt-4">
            © {new Date().getFullYear()} Artech Solutions. All rights reserved.
          </div>
        </div>
      </div>

      {/* ══════════════════ RIGHT PANEL ══════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white"
           style={{ animation: 'riseIn 0.75s ease-out 0.05s both' }}>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <img src="/logo.svg" alt="Artech" className="w-9 h-9 drop-shadow-sm" />
          <span className="font-bold text-brand text-lg">Artech HRMS</span>
        </div>

        <div className="w-full max-w-[380px]">

          {/* Avatar + heading */}
          <div className="text-center mb-7" style={{ animation: 'riseIn 0.6s ease-out 0.12s both' }}>
            <img src="/logo.svg" alt="Artech" className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
            <h2 className="text-[1.55rem] font-bold text-brand mb-1">
              {mode === 'setup' ? 'Create Admin Account' : 'Welcome Back!'}
            </h2>
            <p className="text-gray-500 text-[13px]">
              {mode === 'setup' ? 'Set up your administrator account' : 'Sign in to your HRMS account'}
            </p>
          </div>

          {mode === 'setup' && (
            <div className="mb-4 flex items-start gap-2 rounded-xl px-4 py-3"
                 style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
              <span className="text-amber-500 text-sm">⚡</span>
              <p className="text-amber-700 text-xs leading-relaxed">
                First-time setup — create the administrator account to unlock the system.
              </p>
            </div>
          )}

          <form onSubmit={mode === 'setup' ? handleSetup : handleLogin}
                className="space-y-4"
                style={{ animation: 'riseIn 0.6s ease-out 0.2s both' }}>

            {mode === 'setup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-mist text-brand text-sm placeholder-steel outline-none focus:border-accent focus:ring-2 focus:ring-mist transition-all"
                  placeholder="HR Administrator"
                  value={form.full_name}
                  onChange={e => f({ full_name: e.target.value })}
                  autoFocus
                />
              </div>
            )}

            {mode === 'setup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-mist text-brand text-sm placeholder-steel outline-none focus:border-accent focus:ring-2 focus:ring-mist transition-all"
                  type="email"
                  placeholder="admin@artechsolution.co.in"
                  value={form.email}
                  onChange={e => f({ email: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {mode === 'setup' ? 'Username' : 'Username / Employee ID'}
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-mist text-brand text-sm placeholder-steel outline-none focus:border-accent focus:ring-2 focus:ring-mist transition-all"
                placeholder={mode === 'setup' ? 'Choose a username' : 'Enter your username or email'}
                value={form.username}
                onChange={e => f({ username: e.target.value })}
                autoFocus={mode === 'login'}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-mist text-brand text-sm placeholder-steel outline-none focus:border-accent focus:ring-2 focus:ring-mist transition-all"
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'setup' ? 'Min. 6 characters' : 'Enter your password'}
                  value={form.password}
                  onChange={e => f({ password: e.target.value })}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded accent-accent" />
                  <span className="text-xs text-gray-500">Remember me</span>
                </label>
                <span className="text-xs text-accent cursor-pointer hover:underline">Forgot Password?</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                   style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <span className="text-red-500">⚠</span>
                <span className="text-red-600 text-xs">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-white font-semibold text-sm rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1 hover:shadow-lg hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #1A6AB4 0%, #0D1F4E 100%)',
                boxShadow: '0 4px 16px rgba(26,106,180,0.32)',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> {mode === 'setup' ? 'Creating…' : 'Signing in…'}</>
                : mode === 'setup' ? 'Create Account & Continue' : 'Login'
              }
            </button>

            {mode === 'login' && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <button type="button"
                        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium text-brand border border-mist hover:bg-gray-50 transition-all hover:-translate-y-0.5"
                        style={{ transition: 'background 0.15s, transform 0.2s' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Login with SSO
                </button>
              </>
            )}

            {mode === 'setup' && (
              <div className="text-center">
                <span className="text-gray-500 text-xs">Already have an account? </span>
                <button type="button" onClick={() => { setMode('login'); setError(''); }}
                        className="text-accent hover:underline text-xs font-medium">
                  Sign in instead
                </button>
              </div>
            )}
          </form>

          <div className="text-center mt-6 text-xs text-gray-400">
            Need help?{' '}
            <span className="text-accent hover:underline cursor-pointer">Contact HR Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}
