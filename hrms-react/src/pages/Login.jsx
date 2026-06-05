import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, ArrowRight, Users, CalendarDays, Clock, TrendingUp, DollarSign, BarChart3, X, Mail, Phone, CheckCircle2 } from 'lucide-react';

/* ── Artech brand palette ── */
const C = {
  navy:   '#0D1F4E',
  blue:   '#1A6AB4',
  teal:   '#3DC7B3',
  green:  '#2DB37A',
  cloud:  '#F4F8FF',
  mist:   '#E8EDF5',
  steel:  '#A0AABF',
};

const FEATURES = [
  { icon: Users,        num: '01', title: 'Employee Management',  desc: 'Onboard and manage your workforce'       },
  { icon: CalendarDays, num: '02', title: 'Leave Management',     desc: 'Approvals, balances and calendars'       },
  { icon: Clock,        num: '03', title: 'Attendance Tracking',  desc: 'Track hours and working patterns'        },
  { icon: TrendingUp,   num: '04', title: 'Performance Reviews',  desc: 'Goals, appraisals, and growth cycles'    },
  { icon: DollarSign,   num: '05', title: 'Payroll Processing',   desc: 'Accurate payslips and compliance'        },
  { icon: BarChart3,    num: '06', title: 'Reports & Analytics',  desc: 'Insights that drive HR decisions'        },
];

export default function Login({ onLogin }) {
  const [mode, setMode]           = useState('checking');
  const [form, setForm]           = useState({ username: '', password: '', full_name: '', email: '' });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent]   = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [supportOpen, setSupportOpen]   = useState(false);

  useEffect(() => {
    fetch('/api/auth/needs-setup')
      .then(r => r.json())
      .then(d => setMode(d.needs_setup ? 'setup' : 'login'))
      .catch(() => setMode('login'));
  }, []);

  const f = v => setForm(prev => ({ ...prev, ...v }));

  const handleForgot = async e => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setForgotLoading(false);
    setForgotSent(true);
  };

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.navy }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <Loader2 size={30} style={{ animation: 'spin 1s linear infinite', color: C.teal }} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,600&family=DM+Serif+Display:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp { font-family: 'Plus Jakarta Sans', sans-serif; min-height: 100vh; display: flex; }

        /* ── keyframes ── */
        @keyframes spin        { to   { transform: rotate(360deg); } }
        @keyframes fadeUp      { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn      { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideRight  { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes meshMove1   { 0%,100% { transform: translate(0,0) scale(1); }   50% { transform: translate(40px,-30px) scale(1.08); } }
        @keyframes meshMove2   { 0%,100% { transform: translate(0,0) scale(1); }   60% { transform: translate(-30px,35px) scale(1.05); } }
        @keyframes meshMove3   { 0%,100% { transform: translate(0,0); }            40% { transform: translate(20px,-20px); } }
        @keyframes floatBadge  { 0%,100% { transform: translateY(0); }             50% { transform: translateY(-5px); } }
        @keyframes shimmerBar  { from { transform: scaleX(0); transform-origin: left; } to { transform: scaleX(1); transform-origin: left; } }
        @keyframes countUp     { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }

        /* ══ LEFT PANEL ══ */
        .lp-left {
          display: none;
          flex-direction: column;
          width: 55%;
          position: relative;
          overflow: hidden;
          background: ${C.navy};
        }
        @media (min-width: 1024px) { .lp-left { display: flex; } }

        /* mesh blobs */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
        }
        .blob-1 {
          width: 500px; height: 500px;
          top: -150px; left: -100px;
          background: radial-gradient(circle, rgba(26,106,180,0.45) 0%, transparent 65%);
          animation: meshMove1 18s ease-in-out infinite;
        }
        .blob-2 {
          width: 400px; height: 400px;
          bottom: -80px; right: -60px;
          background: radial-gradient(circle, rgba(61,199,179,0.35) 0%, transparent 65%);
          animation: meshMove2 22s ease-in-out infinite;
        }
        .blob-3 {
          width: 260px; height: 260px;
          top: 40%; left: 45%;
          background: radial-gradient(circle, rgba(61,199,179,0.2) 0%, transparent 65%);
          animation: meshMove3 14s ease-in-out infinite;
        }
        .blob-4 {
          width: 180px; height: 180px;
          top: 20%; right: 10%;
          background: radial-gradient(circle, rgba(45,179,122,0.2) 0%, transparent 65%);
          animation: meshMove1 16s ease-in-out infinite 2s;
        }

        /* geometric grid overlay */
        .lp-left::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(61,199,179,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(61,199,179,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .lp-left-inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          min-height: 100%;
          padding: 44px 52px 36px;
        }

        /* ══ RIGHT PANEL ══ */
        .lp-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 28px;
          background: ${C.cloud};
          position: relative;
        }

        /* subtle right panel texture */
        .lp-right::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(26,106,180,0.05) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        /* form card */
        .lp-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          padding: 38px 38px 32px;
          box-shadow:
            0 4px 6px rgba(13,31,78,0.04),
            0 20px 60px rgba(13,31,78,0.12),
            0 0 0 1px rgba(13,31,78,0.06);
          animation: fadeUp 0.65s ease-out 0.1s both;
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease;
        }
        .lp-card:hover {
          transform: translateY(-8px) scale(1.012);
          box-shadow:
            0 12px 20px rgba(13,31,78,0.08),
            0 40px 90px rgba(13,31,78,0.2),
            0 0 0 1.5px rgba(26,106,180,0.15);
        }

        /* inputs */
        .lp-input {
          width: 100%;
          background: ${C.cloud};
          border: 1.5px solid ${C.mist};
          border-radius: 10px;
          padding: 12px 14px;
          color: ${C.navy};
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .lp-input::placeholder { color: ${C.steel}; }
        .lp-input:focus {
          border-color: ${C.blue};
          background: #fff;
          box-shadow: 0 0 0 3px rgba(26,106,180,0.1);
        }
        .lp-input-wrap { position: relative; }
        .lp-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: ${C.steel}; display: flex; padding: 4px;
          transition: color 0.2s;
        }
        .lp-eye:hover { color: ${C.blue}; }

        /* label */
        .lp-label {
          display: block;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${C.navy};
          opacity: 0.6;
          margin-bottom: 7px;
        }

        /* CTA button */
        .lp-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 20px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, ${C.blue} 0%, ${C.navy} 100%);
          color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 4px 16px rgba(26,106,180,0.4);
          position: relative;
          overflow: hidden;
        }
        .lp-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, ${C.teal} 0%, ${C.blue} 100%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .lp-btn:hover:not(:disabled)::after { opacity: 1; }
        .lp-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(26,106,180,0.45); }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .lp-btn > * { position: relative; z-index: 1; }

        /* SSO button */
        .lp-sso {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 12px 16px;
          background: #fff;
          border: 1.5px solid ${C.mist};
          border-radius: 10px;
          color: ${C.navy};
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .lp-sso:hover {
          border-color: ${C.blue};
          box-shadow: 0 0 0 3px rgba(26,106,180,0.08);
          transform: translateY(-2px);
        }

        /* divider */
        .lp-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 18px 0;
        }
        .lp-divider::before, .lp-divider::after {
          content: ''; flex: 1; height: 1px; background: ${C.mist};
        }

        /* error */
        .lp-error {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 11px 13px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 8px;
          color: #DC2626;
          font-size: 13px;
          line-height: 1.5;
        }

        /* setup notice */
        .lp-notice {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 11px 13px;
          background: rgba(61,199,179,0.08);
          border: 1px solid rgba(61,199,179,0.3);
          border-radius: 8px;
          color: #0D7A6B;
          font-size: 12.5px;
          line-height: 1.55;
          margin-bottom: 20px;
        }

        /* feature row */
        .lp-feat {
          display: flex; align-items: center; gap: 14px;
          padding: 11px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          animation: slideRight 0.5s ease-out both;
          border-radius: 10px;
          transition: background 0.2s, transform 0.25s cubic-bezier(0.34,1.3,0.64,1);
          cursor: default;
          margin: 0 -10px;
        }
        .lp-feat:last-child { border-bottom: none; }
        .lp-feat:hover {
          background: rgba(61,199,179,0.07);
          transform: translateX(6px);
          border-bottom-color: transparent;
        }

        /* stat cards */
        .lp-stat {
          flex: 1;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px 12px;
          text-align: center;
          animation: countUp 0.5s ease-out both;
          backdrop-filter: blur(8px);
          transition: transform 0.25s cubic-bezier(0.34,1.4,0.64,1), background 0.2s, border-color 0.2s;
          cursor: default;
        }
        .lp-stat:hover {
          transform: translateY(-4px) scale(1.04);
          background: rgba(61,199,179,0.12);
          border-color: rgba(61,199,179,0.3);
        }

        /* checkbox */
        input[type="checkbox"] { accent-color: ${C.blue}; cursor: pointer; width: 14px; height: 14px; }

        /* mobile logo */
        .lp-mob { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; animation: fadeUp 0.5s ease-out both; }
        @media (min-width: 1024px) { .lp-mob { display: none; } }

        /* ── Overlay modals ── */
        .lp-overlay {
          position: fixed; inset: 0; z-index: 100;
          display: flex; align-items: center; justify-content: center; padding: 20px;
          background: rgba(13,31,78,0.55);
          backdrop-filter: blur(6px);
          animation: fadeIn 0.2s ease-out both;
        }
        .lp-modal {
          background: #fff;
          border-radius: 18px;
          width: 100%; max-width: 400px;
          box-shadow: 0 24px 80px rgba(13,31,78,0.22), 0 0 0 1px rgba(13,31,78,0.06);
          animation: fadeUp 0.3s ease-out both;
          overflow: hidden;
        }
        .lp-modal-head {
          padding: 20px 24px 16px;
          border-bottom: 1px solid ${C.mist};
          display: flex; align-items: center; justify-content: space-between;
        }
        .lp-modal-body { padding: 22px 24px 26px; }
        .lp-close {
          background: ${C.cloud}; border: none; cursor: pointer;
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: ${C.steel}; transition: background 0.15s, color 0.15s;
        }
        .lp-close:hover { background: ${C.mist}; color: ${C.navy}; }
        .lp-contact-row {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 14px; border-radius: 10px;
          background: ${C.cloud}; border: 1px solid ${C.mist};
          margin-bottom: 10px; transition: border-color 0.15s;
        }
        .lp-contact-row:hover { border-color: ${C.blue}; }
        .lp-contact-icon {
          width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
      `}</style>

      <div className="lp">

        {/* ══════════════════ LEFT PANEL ══════════════════ */}
        <div className="lp-left">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="blob blob-4" />

          <div className="lp-left-inner">

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52, animation: 'fadeUp 0.5s ease-out both' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(61,199,179,0.2), rgba(26,106,180,0.3))',
                border: '1px solid rgba(61,199,179,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src="/logo.svg" alt="Artech" style={{ width: 26, height: 26 }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '0.01em' }}>Artech HRMS</div>
                <div style={{ fontSize: 11, color: C.teal, opacity: 0.8, marginTop: 1, letterSpacing: '0.04em', fontWeight: 500 }}>Human Resource Management</div>
              </div>
            </div>

            {/* Hero */}
            <div style={{ marginBottom: 44, animation: 'fadeUp 0.6s ease-out 0.07s both' }}>
              {/* gradient accent bar */}
              <div style={{
                height: 4, width: 52, borderRadius: 2, marginBottom: 18,
                background: `linear-gradient(90deg, ${C.teal}, ${C.blue})`,
                animation: 'shimmerBar 0.8s ease-out 0.4s both',
              }} />
              <h1 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '2.4rem',
                lineHeight: 1.22,
                color: '#fff',
                marginBottom: 14,
                letterSpacing: '-0.01em',
              }}>
                Empowering<br />
                <span style={{
                  fontStyle: 'italic',
                  background: `linear-gradient(90deg, ${C.teal}, #6EE7DA)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>People.</span>{' '}
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>Enhancing</span><br />
                <span style={{
                  background: `linear-gradient(90deg, ${C.blue}, ${C.teal})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Performance.</span>
              </h1>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 340, fontWeight: 300 }}>
                A comprehensive HRMS platform built for modern organisations — streamline operations, empower your team, and drive growth.
              </p>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 32, animation: 'fadeUp 0.5s ease-out 0.14s both' }}>
              {[
                { value: '21+', label: 'Employees',   color: C.teal  },
                { value: '6',   label: 'HR Modules',  color: C.blue  },
                { value: '99%', label: 'Uptime',      color: C.green },
              ].map(({ value, label, color }, i) => (
                <div key={i} className="lp-stat" style={{ animationDelay: `${0.18 + i * 0.06}s` }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1, fontFamily: "'DM Serif Display', serif" }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Feature list */}
            <div>
              {FEATURES.map(({ icon: Icon, num, title, desc }, i) => (
                <div key={num} className="lp-feat" style={{ animationDelay: `${0.2 + i * 0.06}s` }}>
                  {/* icon badge */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: i % 2 === 0
                      ? 'linear-gradient(135deg, rgba(61,199,179,0.2), rgba(26,106,180,0.15))'
                      : 'linear-gradient(135deg, rgba(26,106,180,0.2), rgba(61,199,179,0.15))',
                    border: `1px solid ${i % 2 === 0 ? 'rgba(61,199,179,0.25)' : 'rgba(26,106,180,0.25)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color={i % 2 === 0 ? C.teal : '#6EB5E8'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>{title}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', marginTop: 1, fontWeight: 300 }}>{desc}</div>
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: C.teal, opacity: 0.5,
                    fontFamily: "'DM Serif Display', serif", letterSpacing: '0.04em',
                  }}>{num}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              marginTop: 28, paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>
                © {new Date().getFullYear()} Artech Solutions. All rights reserved.
              </span>
              {/* teal-blue pill */}
              <div style={{
                padding: '4px 10px', borderRadius: 20,
                background: 'linear-gradient(90deg, rgba(61,199,179,0.15), rgba(26,106,180,0.15))',
                border: '1px solid rgba(61,199,179,0.2)',
                fontSize: 10, color: C.teal, fontWeight: 600, letterSpacing: '0.05em',
              }}>
                SECURE · COMPLIANT
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL ══════════════════ */}
        <div className="lp-right">

          {/* Mobile logo */}
          <div className="lp-mob">
            <img src="/logo.svg" alt="Artech" style={{ width: 30, height: 30 }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: C.navy }}>Artech HRMS</span>
          </div>

          <div className="lp-card">

            {/* Top accent line */}
            <div style={{
              height: 5, borderRadius: '20px 20px 0 0',
              background: `linear-gradient(90deg, ${C.blue} 0%, ${C.teal} 55%, ${C.green} 100%)`,
              position: 'absolute', top: 0, left: 0, right: 0,
            }} />

            {/* Header */}
            <div style={{ marginBottom: 28, animation: 'fadeUp 0.5s ease-out 0.15s both' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 20, marginBottom: 14,
                background: `linear-gradient(90deg, rgba(26,106,180,0.08), rgba(61,199,179,0.08))`,
                border: `1px solid rgba(26,106,180,0.15)`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {mode === 'setup' ? 'First Time Setup' : 'Secure Sign In'}
                </span>
              </div>
              <h2 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '1.75rem',
                color: C.navy,
                marginBottom: 6,
                fontWeight: 400,
                letterSpacing: '-0.01em',
              }}>
                {mode === 'setup' ? 'Create Admin Account' : 'Welcome back!'}
              </h2>
              <p style={{ fontSize: 13, color: C.steel, fontWeight: 400 }}>
                {mode === 'setup'
                  ? 'Set up your administrator account to get started'
                  : 'Sign in to your Artech HRMS workspace'}
              </p>
            </div>

            {mode === 'setup' && (
              <div className="lp-notice">
                <span style={{ fontSize: 15, marginTop: 1 }}>⚡</span>
                <span>First-time setup — create the administrator account to unlock all system features.</span>
              </div>
            )}

            <form
              onSubmit={mode === 'setup' ? handleSetup : handleLogin}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {mode === 'setup' && (
                <div style={{ animation: 'fadeUp 0.4s ease-out both' }}>
                  <label className="lp-label">Full Name</label>
                  <input className="lp-input" placeholder="HR Administrator" value={form.full_name}
                    onChange={e => f({ full_name: e.target.value })} autoFocus />
                </div>
              )}

              {mode === 'setup' && (
                <div style={{ animation: 'fadeUp 0.4s ease-out 0.04s both' }}>
                  <label className="lp-label">Email Address</label>
                  <input className="lp-input" type="email" placeholder="admin@artechsolution.co.in"
                    value={form.email} onChange={e => f({ email: e.target.value })} />
                </div>
              )}

              <div style={{ animation: 'fadeUp 0.4s ease-out 0.08s both' }}>
                <label className="lp-label">{mode === 'setup' ? 'Username' : 'Username / Employee ID'}</label>
                <input
                  className="lp-input"
                  placeholder={mode === 'setup' ? 'Choose a username' : 'Enter your username or email'}
                  value={form.username}
                  onChange={e => f({ username: e.target.value })}
                  autoFocus={mode === 'login'}
                  autoComplete="username"
                />
              </div>

              <div style={{ animation: 'fadeUp 0.4s ease-out 0.12s both' }}>
                <label className="lp-label">Password</label>
                <div className="lp-input-wrap">
                  <input
                    className="lp-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder={mode === 'setup' ? 'Minimum 6 characters' : 'Enter your password'}
                    value={form.password}
                    onChange={e => f({ password: e.target.value })}
                    style={{ paddingRight: 42 }}
                    autoComplete="current-password"
                  />
                  <button type="button" className="lp-eye" onClick={() => setShowPass(p => !p)}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fadeUp 0.4s ease-out 0.15s both' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                    <input type="checkbox" />
                    <span style={{ fontSize: 12.5, color: C.steel, fontWeight: 500 }}>Remember me</span>
                  </label>
                  <span style={{ fontSize: 12.5, color: C.blue, cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => { setForgotOpen(true); setForgotEmail(''); setForgotSent(false); }}>
                    Forgot Password?
                  </span>
                </div>
              )}

              {error && (
                <div className="lp-error">
                  <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="lp-btn"
                style={{ marginTop: 6, animation: 'fadeUp 0.4s ease-out 0.18s both' }}
              >
                {loading
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {mode === 'setup' ? 'Creating account…' : 'Signing in…'}</>
                  : <>{mode === 'setup' ? 'Create Account' : 'Sign In'} <ArrowRight size={14} /></>
                }
              </button>

              {mode === 'login' && (
                <>
                  <div className="lp-divider" style={{ animation: 'fadeIn 0.4s ease-out 0.22s both' }}>
                    <span style={{ fontSize: 11, color: C.steel, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>or</span>
                  </div>
                  <button type="button" className="lp-sso" style={{ animation: 'fadeUp 0.4s ease-out 0.25s both' }}>
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
                <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease-out 0.28s both' }}>
                  <span style={{ fontSize: 12.5, color: C.steel }}>Already have an account? </span>
                  <button type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    style={{ background: 'none', border: 'none', fontSize: 12.5, color: C.blue, cursor: 'pointer', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Sign in instead
                  </button>
                </div>
              )}
            </form>

            {/* Footer */}
            <div style={{
              marginTop: 22, paddingTop: 18,
              borderTop: `1px solid ${C.mist}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              animation: 'fadeIn 0.5s ease-out 0.35s both',
            }}>
              <span style={{ fontSize: 11.5, color: C.steel }}>
                Need help?{' '}
                <span style={{ color: C.blue, cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setSupportOpen(true)}>Contact HR Support</span>
              </span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal }} />
                <span style={{ fontSize: 10, color: C.steel, fontWeight: 600, letterSpacing: '0.04em' }}>SECURE</span>
              </div>
            </div>

          </div>

          {/* Bottom tagline */}
          <p style={{
            marginTop: 20, fontSize: 12, color: C.steel, fontFamily: 'Plus Jakarta Sans, sans-serif',
            animation: 'fadeIn 0.5s ease-out 0.5s both',
          }}>
            © {new Date().getFullYear()} Artech Solutions · All rights reserved
          </p>
        </div>

      </div>

      {/* ══ FORGOT PASSWORD MODAL ══ */}
      {forgotOpen && (
        <div className="lp-overlay" onClick={e => e.target === e.currentTarget && setForgotOpen(false)}>
          <div className="lp-modal">
            <div className="lp-modal-head">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Password Reset</span>
                </div>
                <h3 style={{ fontSize: 17, fontFamily: "'DM Serif Display',serif", color: C.navy, fontWeight: 400 }}>
                  Forgot your password?
                </h3>
              </div>
              <button className="lp-close" onClick={() => setForgotOpen(false)}><X size={14} /></button>
            </div>
            <div className="lp-modal-body">
              {forgotSent ? (
                <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
                    background: 'rgba(45,179,122,0.1)', border: `1px solid rgba(45,179,122,0.25)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckCircle2 size={26} color={C.green} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Request submitted</p>
                  <p style={{ fontSize: 13, color: C.steel, lineHeight: 1.6, marginBottom: 20 }}>
                    Your HR administrator has been notified and will reset your password shortly. Please check with them directly if you need urgent access.
                  </p>
                  <div style={{ padding: '12px 14px', background: C.cloud, borderRadius: 10, border: `1px solid ${C.mist}`, marginBottom: 16 }}>
                    <p style={{ fontSize: 12, color: C.steel, margin: 0 }}>
                      HR Contact: <strong style={{ color: C.navy }}>support@artechsolution.co.in</strong>
                    </p>
                  </div>
                  <button className="lp-btn" onClick={() => setForgotOpen(false)} style={{ marginTop: 4 }}>
                    Back to Sign In <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot}>
                  <p style={{ fontSize: 13, color: C.steel, lineHeight: 1.6, marginBottom: 18 }}>
                    Enter your username or registered email address. Your HR administrator will be notified to reset your password.
                  </p>
                  <div style={{ marginBottom: 16 }}>
                    <label className="lp-label">Username or Email</label>
                    <input
                      className="lp-input"
                      placeholder="Enter your username or email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button type="submit" disabled={forgotLoading || !forgotEmail.trim()} className="lp-btn">
                    {forgotLoading
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending request…</>
                      : <>Send Reset Request <ArrowRight size={14} /></>
                    }
                  </button>
                  <button type="button" onClick={() => setForgotOpen(false)}
                    style={{ width: '100%', marginTop: 10, padding: '11px', background: 'none', border: `1px solid ${C.mist}`, borderRadius: 10, fontSize: 13, color: C.steel, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 500 }}>
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ CONTACT SUPPORT MODAL ══ */}
      {supportOpen && (
        <div className="lp-overlay" onClick={e => e.target === e.currentTarget && setSupportOpen(false)}>
          <div className="lp-modal">
            <div className="lp-modal-head">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.teal }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: '0.06em', textTransform: 'uppercase' }}>HR Support</span>
                </div>
                <h3 style={{ fontSize: 17, fontFamily: "'DM Serif Display',serif", color: C.navy, fontWeight: 400 }}>
                  Contact HR Support
                </h3>
              </div>
              <button className="lp-close" onClick={() => setSupportOpen(false)}><X size={14} /></button>
            </div>
            <div className="lp-modal-body">
              <p style={{ fontSize: 13, color: C.steel, lineHeight: 1.6, marginBottom: 18 }}>
                Reach out to our HR team for login issues, account access, or any HRMS-related queries.
              </p>

              {[
                { icon: Mail,  color: C.blue,  bg: 'rgba(26,106,180,0.08)', border: 'rgba(26,106,180,0.15)',
                  label: 'Email Support', value: 'support@artechsolution.co.in', href: 'mailto:support@artechsolution.co.in' },
                { icon: Phone, color: C.teal,  bg: 'rgba(61,199,179,0.08)', border: 'rgba(61,199,179,0.2)',
                  label: 'Phone Support', value: '+91 98765 43210', href: 'tel:+919876543210' },
              ].map(({ icon: Icon, color, bg, border, label, value, href }) => (
                <a key={label} href={href} style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="lp-contact-row">
                    <div className="lp-contact-icon" style={{ background: bg, border: `1px solid ${border}` }}>
                      <Icon size={16} color={color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.steel, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.navy }}>{value}</div>
                    </div>
                  </div>
                </a>
              ))}

              <div style={{
                marginTop: 16, padding: '12px 14px', borderRadius: 10,
                background: 'rgba(61,199,179,0.06)', border: '1px solid rgba(61,199,179,0.18)',
              }}>
                <p style={{ fontSize: 12, color: '#0D7A6B', lineHeight: 1.6, margin: 0 }}>
                  <strong>Office Hours:</strong> Mon–Fri, 9:00 AM – 6:00 PM IST<br />
                  For urgent issues outside office hours, email us and we'll respond within 2 hours.
                </p>
              </div>

              <button className="lp-btn" onClick={() => setSupportOpen(false)} style={{ marginTop: 18 }}>
                Close <X size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
