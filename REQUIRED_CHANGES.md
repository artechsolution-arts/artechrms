# Exact Changes Required for Cross-Platform (Android · iOS · Windows · macOS)

> Audited from actual codebase. Every change listed here is **file + line specific**.
> Changes are grouped: 🔴 Critical (app breaks) → 🟡 Important (feature breaks) → 🟢 Nice-to-have

---

## Summary Table

| File | Change | Priority |
|------|--------|----------|
| `hrms-react/vite.config.js` | Fix `outDir`, add `base` for Tauri | 🔴 Critical |
| `hrms-react/index.html` | Add `viewport-fit=cover` to meta | 🔴 Critical |
| `hrms-react/src/index.css` line 1 | Replace Google Fonts CDN with npm package | 🔴 Critical |
| `hrms-react/src/api.js` | Add dynamic `BASE` URL, fix reload on 401 | 🔴 Critical |
| `backend/main.py` | Add Capacitor + Tauri to CORS origins | 🔴 Critical |
| `hrms-react/src/index.css` | Add safe-area inset CSS | 🟡 Important |
| `hrms-react/src/App.jsx` line 236 | Add bottom padding for mobile nav | 🟡 Important |
| `hrms-react/src/pages/Login.jsx` line 1045 | Fix Microsoft OAuth for native | 🟡 Important |
| `hrms-react/src/pages/CompanyDocs.jsx` | Fix blob download for iOS | 🟡 Important |
| `hrms-react/src/pages/SalarySlips.jsx` | Fix PDF download for iOS | 🟡 Important |
| `hrms-react/src/pages/employee/EmpSalary.jsx` | Fix PDF download for iOS | 🟡 Important |
| `hrms-react/src/hooks/useAuth.js` | Keep as-is, add Capacitor Preferences layer | 🟢 Nice-to-have |
| NEW: `capacitor.config.ts` | Create config file | 🔴 Critical |
| NEW: `hrms-react/src/hooks/usePlatform.js` | Platform detection hook | 🟡 Important |

---

## 🔴 CRITICAL — App will not work without these

---

### Change 1: `hrms-react/vite.config.js`

**Problem:** `outDir: '../frontend'` outputs build to the wrong folder. Capacitor looks for `webDir: 'dist'`. Tauri needs `base: './'` for relative asset paths.

**Current file (all 19 lines):**
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    watch: { usePolling: true, interval: 300 },
    proxy: {
      '/api': process.env.VITE_BACKEND_URL || 'http://localhost:8000',
      '/files': process.env.VITE_BACKEND_URL || 'http://localhost:8000',
    },
  },
  build: {
    outDir: '../frontend',
    emptyOutDir: true,
  },
})
```

**Replace entire file with:**
```js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // When Tauri builds, it sets this env var. Use it to switch to relative paths.
  const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined

  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8000'

  return {
    plugins: [react()],

    // Tauri requires './' — Capacitor & web require '/'
    base: isTauri ? './' : '/',

    server: {
      port: 3000,
      host: '0.0.0.0',
      watch: { usePolling: true, interval: 300 },
      proxy: {
        '/api':   { target: backendUrl, changeOrigin: true },
        '/files': { target: backendUrl, changeOrigin: true },
      },
    },

    build: {
      // 'dist' is what Capacitor and Tauri both look for
      outDir: 'dist',
      emptyOutDir: true,
    },

    // Needed for Tauri IPC bridge
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_'],
  }
})
```

> **Note:** The old `outDir: '../frontend'` was serving the built files from the Python backend's `frontend/` folder. After this change, for the web/server deployment you'll need to point your FastAPI static file mount at `hrms-react/dist/` instead of `frontend/`. Check `backend/main.py` for the `StaticFiles` mount and update the path.

---

### Change 2: `hrms-react/index.html`

**Problem:** Missing `viewport-fit=cover` — without it, iPhone content goes behind the notch and home bar. Also the CSP cache-control headers may block Tauri's IPC.

**Current line 6:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**Replace with:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

That is the **only required** change to this file. The rest stays the same.

---

### Change 3: `hrms-react/src/index.css` — line 1 (Google Fonts)

**Problem:** `@import url('https://fonts.googleapis.com/...')` makes a network request at app boot. On native apps with no internet on first launch, the font fails to load. Also blocked in some Capacitor/Tauri security contexts.

**Step 1 — Install font package:**
```bash
cd hrms-react
npm install @fontsource/inter
```

**Step 2 — Edit `src/index.css`, replace line 1:**

Old line 1:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

Replace with:
```css
@import '@fontsource/inter/300.css';
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/inter/700.css';
```

Lines 2–end of the file stay completely unchanged.

---

### Change 4: `hrms-react/src/api.js`

**Problem 1:** `const BASE = ''` — empty string means "same origin as the page". On native apps there is no concept of "same origin" — the app is served from `capacitor://localhost` or a `tauri://` URL, not from `http://your-server`. Every `/api/...` call fails silently.

**Problem 2:** `window.location.reload()` on 401 — works on web, but on native this reloads the entire WebView which is jarring. Should instead just clear state and return to login.

**Current file:**
```js
const BASE = '';

export async function api(method, path, body) {
  const token = localStorage.getItem('artech_hrms_token');
  ...
  if (res.status === 401) {
    localStorage.removeItem('artech_hrms_token');
    localStorage.removeItem('artech_hrms_user');
    window.location.reload();           // ← Problem 2
    throw new Error('Session expired. Please log in again.');
  }
  ...
}

export async function apiForm(path, formData) {
  const token = localStorage.getItem('artech_hrms_token');
  ...
  if (res.status === 401) {
    localStorage.removeItem('artech_hrms_token');
    localStorage.removeItem('artech_hrms_user');
    window.location.reload();           // ← Problem 2
    throw new Error('Session expired. Please log in again.');
  }
  ...
}
```

**Replace entire file with:**
```js
// Resolve the API base URL once at startup.
// - Web (browser): '' means same-origin — works through Vite proxy in dev, direct in prod
// - Capacitor native: must be the real server URL (can't use same-origin)
// - Tauri desktop: can also be '' if backend is bundled, or real URL if remote
function resolveBase() {
  // Capacitor native (Android / iOS)
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    return import.meta.env.VITE_BACKEND_URL || 'https://api.arpeopliz.com';
  }
  // Tauri desktop
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  }
  // Web browser — keep same-origin behaviour (Vite proxy handles it in dev)
  return '';
}

const BASE = resolveBase();

// Shared 401 handler — clears storage and dispatches a custom event instead of
// reloading the page (reload is jarring on native; the event lets useAuth reset state)
function handle401() {
  localStorage.removeItem('artech_hrms_token');
  localStorage.removeItem('artech_hrms_user');
  localStorage.removeItem('artech_current_page');
  // Dispatch a custom event that useAuth listens to and resets its state
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
```

---

### Change 5: `hrms-react/src/hooks/useAuth.js`

**Problem:** The session-expired custom event from the new `api.js` needs a listener here to reset state without a page reload.

**Current file (whole file):**
```js
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'artech_hrms_token';
const USER_KEY = 'artech_hrms_user';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  });

  const login = (access_token, userData) => { ... };
  const logout = () => { ... };

  return { token, user, login, logout, isAuthenticated: !!token };
}

export function getToken() {
  return localStorage.getItem(STORAGE_KEY);
}
```

**Add this `useEffect` block inside `useAuth()`, right before the `return` statement:**

```js
  // Listen for session-expired events fired by api.js (replaces window.location.reload)
  useEffect(() => {
    const onExpired = () => { setToken(null); setUser(null); };
    window.addEventListener('artech:session-expired', onExpired);
    return () => window.removeEventListener('artech:session-expired', onExpired);
  }, []);
```

Full updated file:
```js
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'artech_hrms_token';
const USER_KEY = 'artech_hrms_user';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  });

  const login = (access_token, userData) => {
    localStorage.setItem(STORAGE_KEY, access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('artech_current_page');
    setToken(null);
    setUser(null);
  };

  // Listen for session-expired event fired by api.js (replaces window.location.reload)
  useEffect(() => {
    const onExpired = () => { setToken(null); setUser(null); };
    window.addEventListener('artech:session-expired', onExpired);
    return () => window.removeEventListener('artech:session-expired', onExpired);
  }, []);

  return { token, user, login, logout, isAuthenticated: !!token };
}

export function getToken() {
  return localStorage.getItem(STORAGE_KEY);
}
```

---

### Change 6: FastAPI CORS — `backend/main.py`

**Problem:** Capacitor apps run from `capacitor://localhost` and `https://localhost`. Tauri apps run from `tauri://localhost`. Neither is in the current CORS allowlist, so every API call gets a CORS error on native.

Find where `CORSMiddleware` is configured in `backend/main.py`. It currently looks something like:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    ...
)
```

**Add these origins to the list:**
```python
"capacitor://localhost",       # Capacitor iOS + Android
"https://localhost",           # Capacitor androidScheme: 'https'
"http://localhost",            # Capacitor (some configs)
"tauri://localhost",           # Tauri desktop
"https://tauri.localhost",     # Tauri alternative
```

Full updated origins list:
```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "capacitor://localhost",       # Capacitor Android / iOS
    "https://localhost",           # Capacitor with androidScheme: 'https'
    "http://localhost",
    "ionic://localhost",
    "tauri://localhost",           # Tauri desktop
    "https://tauri.localhost",
    "https://arpeopliz.com",       # production domain
    "https://api.arpeopliz.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Change 7: Create `hrms-react/capacitor.config.ts` (NEW FILE)

This file doesn't exist yet. Create it at `hrms-react/capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.artech.hrms',
  appName: 'AR Peopliz',
  webDir: 'dist',                   // matches vite.config.js outDir: 'dist'

  server: {
    androidScheme: 'https',         // use https:// scheme on Android
    // For live-reload during dev, uncomment and set your machine's LAN IP:
    // url: 'http://192.168.1.100:3000',
    // cleartext: true,
  },

  android: {
    backgroundColor: '#EEF3FC',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,  // set true during dev
  },

  ios: {
    backgroundColor: '#EEF3FC',
    contentInset: 'automatic',          // respects safe area automatically
    scrollEnabled: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#EEF3FC',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Default',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
```

---

### Change 8: Create `.env` files (NEW FILES)

Create `hrms-react/.env`:
```
VITE_APP_NAME=AR Peopliz
```

Create `hrms-react/.env.development`:
```
VITE_BACKEND_URL=http://localhost:8000
```

Create `hrms-react/.env.production`:
```
VITE_BACKEND_URL=https://api.arpeopliz.com
```

Create `hrms-react/.env.local` (git-ignored — add to `.gitignore`):
```
# For testing on a physical device, use your machine's LAN IP
# VITE_BACKEND_URL=http://192.168.1.100:8000
```

Add to `hrms-react/.gitignore`:
```
.env.local
.env.*.local
```

---

### Change 9: Add scripts to `hrms-react/package.json`

**Current `scripts` block:**
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

**Replace with:**
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "tauri": "tauri",
  "tauri:dev": "tauri dev",
  "tauri:build": "tauri build",
  "cap:sync": "npm run build && npx cap sync",
  "cap:android": "npm run cap:sync && npx cap run android",
  "cap:ios": "npm run cap:sync && npx cap run ios",
  "build:android": "npm run build && npx cap sync android",
  "build:desktop": "tauri build"
}
```

---

## 🟡 IMPORTANT — Features break without these

---

### Change 10: `hrms-react/src/index.css` — Safe Area CSS

**Where to add:** At the end of `src/index.css`, append these rules.

```css
/* ── Safe area insets (iPhone notch / home bar, Android gesture nav) ── */
:root {
  --safe-top:    env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

/* Page bottom padding: clears the bottom nav + home bar */
.pb-safe-nav {
  padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
}

/* Bottom nav: must clear the home bar */
.glass-mobile-nav {
  padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
}

/* Slide-up panels: bottom gap for home bar */
.glass-mobile-panel .panel-bottom-gap {
  height: max(16px, env(safe-area-inset-bottom, 16px));
}

/* Disable iOS tap highlight on all interactive elements */
button, a, [role="button"] {
  -webkit-tap-highlight-color: transparent;
}

/* Prevent body bounce/rubber-band on iOS outside scroll containers */
body {
  overscroll-behavior: none;
}

/* Input font-size 16px min on mobile — prevents iOS auto-zoom on focus */
@media (max-width: 1023px) {
  input, select, textarea {
    font-size: max(16px, 1em) !important;
  }
}
```

---

### Change 11: `hrms-react/src/App.jsx` — Main content bottom padding

**Problem:** Line 236 currently has `pb-16 lg:pb-0`. On mobile with safe area (iPhone), the home bar sits below the 16px padding and content gets cut off behind the bottom nav.

**Line 236 current:**
```jsx
<main className="flex-1 overflow-auto flex flex-col pb-16 lg:pb-0">
```

**Replace with:**
```jsx
<main className="flex-1 overflow-auto flex flex-col pb-safe-nav lg:pb-0">
```

`pb-safe-nav` is the CSS class you added in Change 10 above:
`padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px))`.

---

### Change 12: `hrms-react/src/components/MobileBottomNav.jsx` — Safe area on nav bar

**Line 273 current:**
```jsx
<nav className="fixed bottom-0 left-0 right-0 z-40 mobile-only glass-mobile-nav shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
```

The `glass-mobile-nav` class now includes safe area padding from Change 10, so no JSX change needed here — already handled by CSS.

**Lines 129, 202, 269** — the `<div className="h-safe-area-inset-bottom pb-4" />` currently used at the bottom of slide-up panels. Replace all three with:
```jsx
<div className="panel-bottom-gap" />
```

Or simply leave the `pb-4` — it provides 16px which is sufficient on most devices. Only change this if you find content being clipped on iPhone 14/15 Pro.

---

### Change 13: `hrms-react/src/pages/Login.jsx` — Microsoft OAuth

**Problem:** Line 1045:
```jsx
onClick={() => { window.location.href = '/api/auth/microsoft'; }}
```

On native apps, `window.location.href = '/api/auth/...'` will redirect the entire WebView away from your app. The OAuth flow completes in the same WebView, then tries to redirect back to `localhost` — which the native WebView can't route.

**Option A (simplest — disable Microsoft OAuth on native):**

Add a platform check before rendering the Microsoft button. First create the platform detector:

Create `hrms-react/src/hooks/usePlatform.js` (NEW FILE):
```js
import { useState, useEffect } from 'react';

export function usePlatform() {
  const [isNative, setIsNative]   = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.Capacitor?.isNativePlatform?.()) setIsNative(true);
    else if ('__TAURI_INTERNALS__' in window)    setIsDesktop(true);
  }, []);

  return { isNative, isDesktop, isWeb: !isNative && !isDesktop };
}
```

Then in `Login.jsx`, import and use it:

```jsx
// At top of Login.jsx, add:
import { usePlatform } from '../hooks/usePlatform';

// Inside the Login component:
const { isNative } = usePlatform();

// Then wrap the Microsoft button:
{!isNative && (
  <button onClick={() => { window.location.href = '/api/auth/microsoft'; }}>
    Sign in with Microsoft
  </button>
)}
```

**Option B (full native support — install Capacitor Browser plugin):**

```bash
npm install @capacitor/browser
npx cap sync
```

Then change the onclick:
```jsx
import { Browser } from '@capacitor/browser';
import { usePlatform } from '../hooks/usePlatform';

const { isNative } = usePlatform();

const handleMicrosoftLogin = async () => {
  if (isNative) {
    // Open in-app browser; OAuth redirect will close it and return token via deep link
    await Browser.open({ url: `${import.meta.env.VITE_BACKEND_URL}/api/auth/microsoft` });
  } else {
    window.location.href = '/api/auth/microsoft';
  }
};
```

Option A is sufficient for now. Implement Option B later if Microsoft OAuth on native is required.

---

### Change 14: Fix file downloads on iOS (`CompanyDocs.jsx`, `SalarySlips.jsx`, `EmpSalary.jsx`, `DocumentRequests.jsx`)

**Problem:** The pattern `a.href = blobUrl; a.click()` is used to trigger file downloads. This works on web and Android Capacitor, but **fails silently on iOS** — iOS WebView does not support programmatic anchor clicks for blob downloads.

**Files affected and their download functions:**

| File | Function | Lines (approx) |
|------|----------|------|
| `CompanyDocs.jsx` | PDF generation download | 333–337 |
| `CompanyDocs.jsx` | Template generate download | 789–793 |
| `CompanyDocs.jsx` | Company doc download | 2279–2286 |
| `SalarySlips.jsx` | `downloadPdf()` | 184–197 |
| `DocumentRequests.jsx` | `downloadFile()` | 24–35 |
| `EmpSalary.jsx` | salary slip download | ~148 area |

**Fix — create a shared download utility:**

Create `hrms-react/src/utils/download.js` (NEW FILE):
```js
/**
 * Cross-platform file download.
 * - Web / Android: standard blob anchor click
 * - iOS Capacitor: open in a new tab (Safari handles the download)
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);

  // Detect iOS Capacitor
  const isIOS = typeof window !== 'undefined' &&
    window.Capacitor?.isNativePlatform?.() &&
    /iphone|ipad|ipod/i.test(navigator.userAgent);

  if (isIOS) {
    // iOS: open blob in new browser tab — user taps Share → Save to Files
    window.open(url, '_blank');
    // Clean up after a delay
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } else {
    // Web + Android: programmatic click
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Fetch a file from an authenticated URL and download it.
 */
export async function downloadAuthFile(url, filename) {
  const token = localStorage.getItem('artech_hrms_token');
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  downloadBlob(blob, filename);
}
```

**Then update the download calls in each file:**

In `SalarySlips.jsx`, replace `downloadPdf` function:
```js
// OLD:
const downloadPdf = async (slipId, slipRef) => {
  const token = localStorage.getItem('artech_hrms_token');
  const res = await fetch(`/api/payroll/slips/${slipId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Payslip_${slipRef || slipId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

// NEW:
import { downloadAuthFile } from '../utils/download';

const downloadPdf = (slipId, slipRef) =>
  downloadAuthFile(`/api/payroll/slips/${slipId}/pdf`, `Payslip_${slipRef || slipId}.pdf`);
```

Apply the same pattern to `DocumentRequests.jsx`, `CompanyDocs.jsx`, and `EmpSalary.jsx` — replace their `downloadFile` / download functions with calls to `downloadAuthFile` from the shared utility.

---

### Change 15: `hrms-react/src/pages/JobOpenings.jsx` — OAuth popup

**Current (approx line 573):**
```jsx
const popup = window.open(url, `${platform} Login`, 'width=600,height=700,scrollbars=yes');
```

**Problem:** `window.open()` is blocked by native WebViews.

**Fix — same approach as Change 13, Option A: hide on native:**

```jsx
import { usePlatform } from '../hooks/usePlatform';

const { isNative } = usePlatform();

// In the render, wrap the social OAuth buttons:
{!isNative && (
  <button onClick={() => {
    const popup = window.open(url, `${platform} Login`, 'width=600,height=700,scrollbars=yes');
  }}>
    Connect {platform}
  </button>
)}
```

---

## 🟢 NICE-TO-HAVE — Improve native experience

---

### Change 16: Add haptic feedback to approve/reject buttons

In `hrms-react/src/pages/Leaves.jsx` and anywhere you have approve/reject/submit actions:

```bash
npm install @capacitor/haptics
npx cap sync
```

```js
import { Haptics, ImpactStyle } from '@capacitor/haptics';

async function haptic(style = ImpactStyle.Light) {
  try { await Haptics.impact({ style }); } catch {}
}

// Then on approve button:
<button onClick={async () => { await haptic(ImpactStyle.Medium); handleApprove(); }}>
  Approve
</button>
```

---

### Change 17: Add offline banner

In `hrms-react/src/App.jsx`, after the imports add:

```bash
npm install @capacitor/network
npx cap sync
```

```jsx
// In App.jsx, add to the JSX output (before </div> at the end):
<NetworkBanner />
```

Create `hrms-react/src/components/NetworkBanner.jsx` (NEW FILE):
```jsx
import { useState, useEffect } from 'react';

export default function NetworkBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const go  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online',  go);
    window.addEventListener('offline', off);
    setOnline(navigator.onLine);

    // On native, also use Capacitor Network plugin if available
    let capListener;
    import('@capacitor/network').then(({ Network }) => {
      Network.getStatus().then(s => setOnline(s.connected));
      Network.addListener('networkStatusChange', s => setOnline(s.connected))
        .then(l => { capListener = l; });
    }).catch(() => {});

    return () => {
      window.removeEventListener('online',  go);
      window.removeEventListener('offline', off);
      capListener?.remove?.();
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-[999] bg-red-500 text-white
      text-xs text-center py-1.5 font-semibold tracking-wide mobile-only">
      No internet connection
    </div>
  );
}
```

---

### Change 18: `hrms-react/src/pages/Login.jsx` — URL param on native

**Current line 46:**
```jsx
const params = new URLSearchParams(window.location.search);
```

On Capacitor, `window.location.search` is always empty because the app doesn't load from a URL. This is used for OAuth callback params. Since OAuth will be disabled on native (Change 13), this line is fine as-is — it just returns an empty URLSearchParams, which causes no error.

No change required here.

---

## Backend: Static Files Path (if applicable)

If your `backend/main.py` mounts the frontend as static files like this:

```python
from fastapi.staticfiles import StaticFiles
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
```

Update the path after the vite.config.js change:

```python
app.mount("/", StaticFiles(directory="../hrms-react/dist", html=True), name="frontend")
```

Or keep the old path and add a build script that copies `dist/` to `../frontend/` — whichever is easier for your deployment.

---

## Installation Commands (run in order)

```bash
cd hrms-react

# 1. Font package (replaces Google Fonts CDN)
npm install @fontsource/inter

# 2. Capacitor core + CLI
npm install @capacitor/core
npm install -D @capacitor/cli

# 3. Platform packages
npm install @capacitor/android
npm install @capacitor/ios          # only if you have macOS + Xcode

# 4. Capacitor plugins used by existing code
npm install @capacitor/splash-screen @capacitor/status-bar
npm install @capacitor/keyboard @capacitor/app
npm install @capacitor/network
npm install @capacitor/haptics       # for Change 16 (optional)
npm install @capacitor/browser       # for Change 13 Option B (optional)

# 5. Tauri
npm install -D @tauri-apps/cli@^2
npm install @tauri-apps/api@^2

# 6. Add platforms (after editing vite.config.js + capacitor.config.ts)
npm run build
npx cap add android
npx cap add ios         # macOS only

# 7. Initialize Tauri (follow the prompts)
npx tauri init
# Answer: webDir = ../dist  |  devUrl = http://localhost:3000  |  devCmd = npm run dev  |  buildCmd = npm run build

# 8. Generate app icons from your logo
npx tauri icon public/logo.png      # generates all sizes into src-tauri/icons/
```

---

## Checklist of All Changes

```
🔴 Critical
  [ ] vite.config.js        — fix outDir + add base for Tauri
  [ ] index.html            — add viewport-fit=cover
  [ ] src/index.css line 1  — replace Google Fonts CDN with @fontsource/inter
  [ ] npm install @fontsource/inter
  [ ] src/api.js            — add dynamic BASE, replace window.location.reload
  [ ] src/hooks/useAuth.js  — add artech:session-expired event listener
  [ ] backend/main.py       — add capacitor:// and tauri:// to CORS origins
  [ ] capacitor.config.ts   — create new file
  [ ] .env files            — create .env, .env.development, .env.production

🟡 Important
  [ ] src/index.css (end)   — add safe-area CSS + tap-highlight removal
  [ ] src/App.jsx line 236  — change pb-16 to pb-safe-nav
  [ ] src/utils/download.js — create shared cross-platform download utility
  [ ] SalarySlips.jsx       — use downloadAuthFile from shared util
  [ ] DocumentRequests.jsx  — use downloadAuthFile from shared util
  [ ] CompanyDocs.jsx       — use downloadBlob from shared util
  [ ] EmpSalary.jsx         — use downloadAuthFile from shared util
  [ ] src/hooks/usePlatform.js — create platform detection hook
  [ ] Login.jsx line 1045   — hide Microsoft OAuth button on native
  [ ] JobOpenings.jsx       — hide OAuth popup on native

🟢 Nice-to-have
  [ ] npm install @capacitor/haptics — add to approve/reject buttons
  [ ] NetworkBanner.jsx     — create offline indicator component
  [ ] App.jsx               — add <NetworkBanner /> to render tree
```
