import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff, ArrowRight, UserRound, CalendarDays, Clock3, TrendingUp, Wallet, BarChart3, X, Mail, Phone, CheckCircle2 } from 'lucide-react';

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
  { icon: UserRound,    title: 'Employee Management'  },
  { icon: CalendarDays, title: 'Leave Management'      },
  { icon: Clock3,       title: 'Attendance Tracking'  },
  { icon: TrendingUp,   title: 'Performance Reviews'  },
  { icon: Wallet,       title: 'Payroll Processing'   },
  { icon: BarChart3,    title: 'Reports & Analytics'  },
];

/* hexagon arrangement: row → feature indices */
const HEX_ROWS = [[0, 1, 2], [3, 4, 5]];

export default function Login({ onLogin }) {
  const [mode, setMode]               = useState('checking');
  const [revealed, setRevealed]       = useState(false);
  const [form, setForm]               = useState({ username: '', password: '', full_name: '', email: '' });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [forgotOpen, setForgotOpen]   = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent]   = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const rightPanelRef = useRef(null);
  const cardRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Handle Microsoft SSO callback — token passed as query param
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get('sso_token');
    const ssoUser  = params.get('sso_user');
    const ssoError = params.get('sso_error');
    if (ssoToken && ssoUser) {
      try {
        const user = JSON.parse(decodeURIComponent(ssoUser));
        window.history.replaceState({}, '', '/');
        onLogin(decodeURIComponent(ssoToken), user);
        return;
      } catch { /* fall through to normal login */ }
    }
    if (ssoError) {
      const msgs = {
        user_not_found: 'No AR Peopliz account linked to your Microsoft email.',
        account_deactivated: 'Your account is deactivated. Contact HR.',
        token_exchange_failed: 'Microsoft login failed. Please try again.',
      };
      setError(msgs[ssoError] || `SSO error: ${ssoError}`);
      window.history.replaceState({}, '', '/');
    }
    fetch('/api/auth/needs-setup')
      .then(r => r.json())
      .then(d => setMode(d.needs_setup ? 'setup' : 'login'))
      .catch(() => setMode('login'));
  }, []);

  useEffect(() => {
    if (revealed) {
      // Reset card scroll after transition completes (autofill scrolls to password field)
      const t = setTimeout(() => {
        if (cardRef.current) cardRef.current.scrollTop = 0;
      }, 980);
      return () => clearTimeout(t);
    }
  }, [revealed]);

  /* ── Canvas: flowing particles + connection lines ── */
  useEffect(() => {
    if (!revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width  = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
    const ctx = canvas.getContext('2d');
    const N = 38;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.38,
      vy: (Math.random() - 0.5) * 0.38,
      r: Math.random() * 1.4 + 0.7,
      a: Math.random() * 0.35 + 0.25,
    }));
    const DIST = 105;
    let raf;
    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < DIST) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(61,199,179,${0.13 * (1 - d / DIST)})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(61,199,179,${p.a})`;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      raf = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(raf);
  }, [revealed]);

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

        .lp {
          font-family: 'Plus Jakarta Sans', sans-serif;
          height: 100vh;
          display: flex;
          overflow: hidden;
        }

        /* ── keyframes ── */
        @keyframes spin       { to   { transform: rotate(360deg); } }
        @keyframes fadeUp     { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn     { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes meshMove1  { 0%,100% { transform: translate(0,0) scale(1); }   50% { transform: translate(40px,-30px) scale(1.08); } }
        @keyframes meshMove2  { 0%,100% { transform: translate(0,0) scale(1); }   60% { transform: translate(-30px,35px) scale(1.05); } }
        @keyframes meshMove3  { 0%,100% { transform: translate(0,0); }            40% { transform: translate(20px,-20px); } }
        @keyframes shimmerBar { from { transform: scaleX(0); transform-origin: left; } to { transform: scaleX(1); transform-origin: left; } }
        @keyframes countUp    { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes heroUp     { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow  {
          0%,100% { box-shadow: 0 0 0 0 rgba(61,199,179,0); }
          50%     { box-shadow: 0 0 32px 8px rgba(61,199,179,0.35); }
        }
        @keyframes hexFloatA  { 0%,100% { transform: translateY(0px); }   50% { transform: translateY(-9px); }  }
        @keyframes hexFloatB  { 0%,100% { transform: translateY(0px); }   50% { transform: translateY(7px);  }  }
        @keyframes hexFloatC  { 0%,100% { transform: translateY(0px); }   50% { transform: translateY(-6px); }  }

        /* ══ LEFT PANEL ══ */
        .lp-left {
          position: relative;
          overflow: hidden;
          background: ${C.navy};
          width: 100%;
          flex-shrink: 0;
          transition: width 0.92s cubic-bezier(0.7, 0, 0.2, 1);
        }
        .lp-left.revealed { width: 58%; }

        @media (max-width: 767px) {
          .lp-left { width: 100%; }
          .lp-left.revealed { width: 0; }
        }

        /* video background */
        .lp-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
        }
        .lp-video-tint {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: linear-gradient(135deg,
            rgba(13,31,78,0.74) 0%,
            rgba(13,31,78,0.50) 45%,
            rgba(13,31,78,0.80) 100%);
        }

        /* mesh blobs */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          z-index: 1;
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

        /* grid overlay */
        .lp-left::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 2;
          background-image:
            linear-gradient(rgba(61,199,179,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(61,199,179,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* ── Hero overlay (phase 1) ── */
        .lp-hero {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 52px;
          text-align: center;
          opacity: 1;
          transition: opacity 0.45s ease;
        }
        .lp-hero.hidden {
          opacity: 0;
          pointer-events: none;
        }

        /* CTA button */
        .lp-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 15px 36px;
          border: none;
          border-radius: 50px;
          background: linear-gradient(135deg, ${C.teal} 0%, ${C.blue} 100%);
          color: ${C.navy};
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          animation: pulseGlow 2.8s ease-in-out infinite;
          transition: transform 0.2s ease-out, filter 0.2s ease-out;
        }
        .lp-cta:hover { transform: translateY(-2px) scale(1.02); filter: brightness(1.06); }
        .lp-cta:active { transform: translateY(0) scale(0.98); }

        /* ── Features panel (phase 2) ── */
        .lp-left-inner {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          min-height: 100%;
          padding: 36px 48px 28px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.5s ease 0.55s;
        }
        .lp-left-inner.visible {
          opacity: 1;
          pointer-events: auto;
        }

        /* ── Hexagon grid — 3+3 honeycomb ── */
        .hex-grid {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          gap: 0;
        }
        .hex-row {
          display: flex;
          gap: 16px;
        }
        /* Row 2 shifts right by (hex_w+gap)/2 = (126+16)/2 = 71px.
           Each row shifts ±35px so the pair is visually centered. */
        .hex-row-1 { transform: translateX(-35px); }
        .hex-row-2 { transform: translateX(36px); margin-top: 14px; }

        /* motion.div wrapper — receives framer-motion transforms */
        .hex-wrap {
          filter: drop-shadow(0 0 10px rgba(20,211,195,0.10));
          transition: filter 0.3s ease;
          cursor: default;
        }
        .hex-wrap:hover {
          filter: drop-shadow(0 0 28px rgba(45,212,191,0.38));
        }

        /* wrapper: just the hex shape, no external label */
        .hex-item-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* border layer */
        .hex-outer {
          width: 126px;
          height: 146px;
          position: relative;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          background: rgba(255,255,255,0.08);
          transition: background 0.3s ease;
        }
        .hex-wrap:hover .hex-outer { background: rgba(45,212,191,0.50); }

        /* fill layer — sits 1.5px inset */
        .hex-inner {
          position: absolute;
          inset: 1.5px;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          background: rgba(255,255,255,0.04);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 14px 10px;
          transition: background 0.3s ease;
        }
        .hex-wrap:hover .hex-inner { background: rgba(45,212,191,0.12); }

        /* label inside the hexagon, below the icon */
        .hex-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.88);
          text-align: center;
          line-height: 1.3;
          max-width: 82px;
        }

        /* per-hex float variants */
        .hf-a { animation: hexFloatA 3.2s ease-in-out infinite; }
        .hf-b { animation: hexFloatB 3.8s ease-in-out infinite; }
        .hf-c { animation: hexFloatC 3.5s ease-in-out infinite; }

        /* ══ RIGHT PANEL ══ */
        .lp-right {
          width: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0;
          background: ${C.cloud};
          position: relative;
          flex-shrink: 0;
          transition: width 0.92s cubic-bezier(0.7, 0, 0.2, 1);
        }
        .lp-right.revealed {
          width: 42%;
          overflow-y: auto;
          height: 100vh;
          /* no justify-content here — centering is done by lp-right-inner */
        }

        /* Inner wrapper: min-height 100% so the card is always centered
           even at low zoom, while still scrollable when content is taller */
        .lp-right-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100%;
          padding: 24px;
          width: 100%;
        }

        @media (max-width: 767px) {
          .lp-right.revealed { width: 100%; }
          .lp-right-inner { padding: 24px 16px; }
          .lp-card { padding: 28px 24px 24px; }
          .lp-input { padding: 12px 14px; font-size: 14px; }
          .lp-label { font-size: 11.5px; margin-bottom: 7px; }
          .lp-btn { padding: 14px 20px; font-size: 14px; }
          .lp-sso { padding: 12px 16px; }
          .lp-mobile-form { gap: 14px !important; }
          .lp-mobile-header { margin-bottom: 20px !important; }
          .lp-mobile-logo { margin-bottom: 20px !important; }
          .lp-mobile-h2 { font-size: 1.75rem !important; }
          .lp-mobile-footer { margin-top: 22px !important; padding-top: 18px !important; }
        }

        /* subtle dot texture */
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
          padding: 18px 28px 14px;
          box-shadow:
            0 4px 6px rgba(13,31,78,0.04),
            0 20px 60px rgba(13,31,78,0.12),
            0 0 0 1px rgba(13,31,78,0.06);
          animation: fadeUp 0.55s ease-out both;
          transition: transform 0.3s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s ease;
        }
        .lp-card:hover {
          transform: translateY(-4px) scale(1.006);
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
          padding: 9px 12px;
          color: ${C.navy};
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
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
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${C.navy};
          opacity: 0.6;
          margin-bottom: 5px;
        }

        /* submit button */
        .lp-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 20px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, ${C.blue} 0%, ${C.navy} 100%);
          color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
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
          padding: 9px 16px;
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

        /* checkbox */
        input[type="checkbox"] { accent-color: ${C.blue}; cursor: pointer; width: 14px; height: 14px; }

        /* mobile logo */
        .lp-mob { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; animation: fadeUp 0.5s ease-out both; }
        @media (min-width: 768px) { .lp-mob { display: none; } }

        /* reduced motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
        }

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
        <div className={`lp-left${revealed ? ' revealed' : ''}`}>

          {/* Video background */}
          <video className="lp-video" autoPlay loop muted playsInline preload="auto">
            <source src="/login-bg.mp4" type="video/mp4" />
          </video>
          <div className="lp-video-tint" />

          {/* Blobs */}
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="blob blob-4" />

          {/* ── PHASE 1: Hero overlay ── */}
          <div className={`lp-hero${revealed ? ' hidden' : ''}`}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 44, animation: 'heroUp 0.6s ease-out 0.1s both' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13,
                background: 'linear-gradient(135deg, rgba(61,199,179,0.2), rgba(26,106,180,0.3))',
                border: '1px solid rgba(61,199,179,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src="/logo.svg" alt="Artech" style={{ width: 28, height: 28 }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '0.01em' }}>AR Peopliz</div>
                <div style={{ fontSize: 11, color: C.teal, marginTop: 1, letterSpacing: '0.04em', fontWeight: 500 }}>Human Resource Management</div>
              </div>
            </div>

            {/* Headline */}
            <div style={{ marginBottom: 20, animation: 'heroUp 0.65s ease-out 0.18s both' }}>
              <div style={{
                height: 4, width: 52, borderRadius: 2, marginBottom: 20, margin: '0 auto 20px',
                background: `linear-gradient(90deg, ${C.teal}, ${C.blue})`,
                animation: 'shimmerBar 0.9s ease-out 0.5s both',
              }} />
              <h1 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                lineHeight: 1.2,
                color: '#fff',
                marginBottom: 16,
                letterSpacing: '-0.02em',
              }}>
                Empowering{' '}
                <span style={{ fontStyle: 'italic', color: C.teal }}>People.</span>
                <br />
                Enhancing{' '}
                <span style={{ color: '#6EB5E8' }}>Performance.</span>
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, maxWidth: 420, margin: '0 auto', fontWeight: 300 }}>
                A comprehensive HRMS platform built for modern organisations — streamline operations, empower your team, and drive growth.
              </p>
            </div>

            {/* CTA */}
            <button
              className="lp-cta"
              onClick={() => setRevealed(true)}
              style={{ animation: 'heroUp 0.6s ease-out 0.4s both' }}
            >
              Get Started <ArrowRight size={16} />
            </button>

          </div>

          {/* ── PHASE 2: Features panel ── */}
          <div className={`lp-left-inner${revealed ? ' visible' : ''}`}>

            {/* Canvas: particles + connection lines */}
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />

            {/* Logo — centered */}
            <motion.div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16, position: 'relative', zIndex: 1, width: '100%' }}
              initial={{ opacity: 0, y: 20 }}
              animate={revealed ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.58, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(61,199,179,0.2), rgba(26,106,180,0.3))',
                border: '1px solid rgba(61,199,179,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <img src="/logo.svg" alt="Artech" style={{ width: 26, height: 26 }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '0.01em' }}>AR Peopliz</div>
                <div style={{ fontSize: 11, color: C.teal, opacity: 0.85, marginTop: 1, letterSpacing: '0.04em', fontWeight: 500 }}>Human Resource Management</div>
              </div>
            </motion.div>

            {/* Tagline — centered */}
            <motion.div
              style={{ marginBottom: 22, position: 'relative', zIndex: 1 }}
              initial={{ opacity: 0, y: 20 }}
              animate={revealed ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.64, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              <h2 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 'clamp(1.5rem, 2.1vw, 1.9rem)',
                color: '#fff',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                textAlign: 'center',
              }}>
                Everything you need<br />
                <span style={{
                  fontStyle: 'italic',
                  background: 'linear-gradient(90deg, #2DD4BF, #14B8A6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>in one place</span>
              </h2>
            </motion.div>

            {/* Hexagon grid — 3+3 honeycomb, labels below */}
            <div className="hex-grid">
              {HEX_ROWS.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className={`hex-row hex-row-${rowIdx + 1}`}
                >
                  {row.map((featIdx) => {
                    const { icon: Icon, title } = FEATURES[featIdx];
                    const floatClass = ['hf-a', 'hf-b', 'hf-c'][featIdx % 3];
                    return (
                      <motion.div
                        key={title}
                        className="hex-wrap"
                        initial={{ opacity: 0, y: 32, scale: 0.80 }}
                        animate={revealed ? { opacity: 1, y: 0, scale: 1 } : {}}
                        transition={{ delay: 0.70 + featIdx * 0.09, duration: 0.52, ease: [0.23, 1, 0.32, 1] }}
                        whileHover={{ y: -8, scale: 1.07, transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] } }}
                      >
                        <div className="hex-item-wrap">
                          <div className={`hex-outer ${floatClass}`} style={{ animationDelay: `${featIdx * 0.22}s` }}>
                            <div className="hex-inner">
                              <Icon size={26} color="#2DD4BF" strokeWidth={2.2} />
                              <span className="hex-label">{title}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <motion.div
              style={{
                paddingTop: 14, marginTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'relative', zIndex: 1,
              }}
              initial={{ opacity: 0 }}
              animate={revealed ? { opacity: 1 } : {}}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
                © {new Date().getFullYear()} Artech Solutions. All rights reserved.
              </span>
              <div style={{
                padding: '4px 10px', borderRadius: 20,
                background: 'linear-gradient(90deg, rgba(61,199,179,0.15), rgba(26,106,180,0.15))',
                border: '1px solid rgba(61,199,179,0.2)',
                fontSize: 10, color: C.teal, fontWeight: 600, letterSpacing: '0.05em',
              }}>
                SECURE · COMPLIANT
              </div>
            </motion.div>

          </div>

        </div>

        {/* ══════════════════ RIGHT PANEL ══════════════════ */}
        <div ref={rightPanelRef} className={`lp-right${revealed ? ' revealed' : ''}`}>
        <div className="lp-right-inner">

          <div ref={cardRef} className="lp-card">

            {/* Top accent bar */}
            <div style={{
              height: 5, borderRadius: '20px 20px 0 0',
              background: `linear-gradient(90deg, ${C.blue} 0%, ${C.teal} 55%, ${C.green} 100%)`,
              position: 'absolute', top: 0, left: 0, right: 0,
            }} />

            {/* Logo inside card — always visible, no scroll needed */}
            <div className="lp-mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, animation: 'fadeUp 0.5s ease-out 0.05s both' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, rgba(61,199,179,0.15), rgba(26,106,180,0.2))`,
                border: `1px solid rgba(61,199,179,0.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src="/logo.svg" alt="AR Peopliz" style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: C.navy, letterSpacing: '-0.01em', lineHeight: 1.1 }}>AR Peopliz</div>
                <div style={{ fontSize: 10.5, color: C.teal, fontWeight: 600, letterSpacing: '0.04em', marginTop: 1 }}>Human Resource Management</div>
              </div>
            </div>

            {/* Header */}
            <div className="lp-mobile-header" style={{ marginBottom: 8, animation: 'fadeUp 0.5s ease-out 0.15s both' }}>
              <h2 className="lp-mobile-h2" style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '1.35rem',
                color: C.navy,
                marginBottom: 3,
                fontWeight: 400,
                letterSpacing: '-0.01em',
              }}>
                {mode === 'setup' ? 'Create Admin Account' : 'Welcome back!'}
              </h2>
              <p style={{ fontSize: 12.5, color: '#5E6B85', fontWeight: 400 }}>
                {mode === 'setup'
                  ? 'Set up your administrator account to get started'
                  : 'Sign in to your AR Peopliz workspace'}
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
              className="lp-mobile-form" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
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
                  <button type="button"
                    style={{ background: 'none', border: 'none', fontSize: 12.5, color: C.blue, cursor: 'pointer', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    onClick={() => { setForgotOpen(true); setForgotEmail(''); setForgotSent(false); }}>
                    Forgot Password?
                  </button>
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
                style={{ marginTop: 2, animation: 'fadeUp 0.4s ease-out 0.18s both' }}
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
                  <button type="button" className="lp-sso"
                    style={{ animation: 'fadeUp 0.4s ease-out 0.25s both' }}
                    onClick={() => { window.location.href = '/api/auth/microsoft'; }}>
                    {/* Microsoft logo */}
                    <svg width="16" height="16" viewBox="0 0 21 21" fill="none">
                      <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
                      <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
                      <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
                      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                    </svg>
                    Continue with Microsoft
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
            <div className="lp-mobile-footer" style={{
              marginTop: 10, paddingTop: 10,
              borderTop: `1px solid ${C.mist}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              animation: 'fadeIn 0.5s ease-out 0.35s both',
            }}>
              <span style={{ fontSize: 11.5, color: C.steel }}>
                Need help?{' '}
                <button type="button"
                  style={{ background: 'none', border: 'none', fontSize: 11.5, color: C.blue, cursor: 'pointer', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  onClick={() => setSupportOpen(true)}>Contact HR Support</button>
              </span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal }} />
                <span style={{ fontSize: 10, color: C.steel, fontWeight: 600, letterSpacing: '0.04em' }}>SECURE</span>
              </div>
            </div>

          </div>

        </div>{/* lp-right-inner */}
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
                    Your HR administrator has been notified and will reset your password shortly.
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
                { icon: Mail,  color: C.blue, bg: 'rgba(26,106,180,0.08)', border: 'rgba(26,106,180,0.15)',
                  label: 'Email Support', value: 'support@artechsolution.co.in', href: 'mailto:support@artechsolution.co.in' },
                { icon: Phone, color: C.teal, bg: 'rgba(61,199,179,0.08)', border: 'rgba(61,199,179,0.2)',
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
