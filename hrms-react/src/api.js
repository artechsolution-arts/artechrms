// Resolve the API base URL once at startup.
//   Web browser  → '' (same-origin; Vite proxy in dev, FastAPI serves built files in prod)
//   Tauri dev    → '' (Vite proxy on localhost:3000 handles /api → localhost:8000)
//   Tauri prod   → VITE_BACKEND_URL (e.g. https://api.arpeopliz.com)
//   Capacitor    → VITE_BACKEND_URL (real server, no proxy available on native)
function resolveBase() {
  if (typeof window === 'undefined') return '';
  if (window.Capacitor?.isNativePlatform?.()) return import.meta.env.VITE_BACKEND_URL || '';
  if ('__TAURI_INTERNALS__' in window) {
    // Dev mode: use Vite proxy (same-origin). Prod build: use explicit backend URL.
    return import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND_URL || '');
  }
  return '';
}

const BASE = resolveBase();

// Shared 401 handler: clears storage and fires an event.
// useAuth listens for this event and resets its state → user sees the login page.
// Replaces window.location.reload() which crashes Capacitor's iOS WebView.
function handle401() {
  localStorage.removeItem('artech_hrms_token');
  localStorage.removeItem('artech_hrms_user');
  localStorage.removeItem('artech_current_page');
  window.dispatchEvent(new CustomEvent('artech:session-expired'));
}

export async function api(method, path, body) {
  const token = localStorage.getItem('artech_hrms_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  if (res.status === 401) {
    handle401();
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return null;
  return res.json().catch(() => null);
}

export async function apiForm(path, formData) {
  const token = localStorage.getItem('artech_hrms_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method: 'POST', headers, body: formData });
  if (res.status === 401) {
    handle401();
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return null;
  return res.json().catch(() => null);
}
