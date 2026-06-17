# Artech HRMS — Complete UI Design System

> Copy-paste ready. Everything needed to reproduce this exact look in another React + Tailwind app.

---

## Table of Contents

1. [Stack & Setup](#1-stack--setup)
2. [Brand Palette](#2-brand-palette)
3. [Global CSS — `index.css`](#3-global-css--indexcss)
4. [Tailwind Config](#4-tailwind-config)
5. [Component Library](#5-component-library)
   - StatCard
   - Badge
   - Toast
   - ConfirmModal
6. [Page Shell Patterns](#6-page-shell-patterns)
7. [Sidebar](#7-sidebar-pattern)
8. [Topbar / Header](#8-topbar--header-pattern)
9. [Notification System](#9-notification-system)
10. [Forms](#10-forms)
11. [Tables](#11-tables)
12. [Dark Mode](#12-dark-mode)
13. [Glass / Background Image Mode](#13-glass--background-image-mode)
14. [Animations & Motion](#14-animations--motion)
15. [Mobile Layout](#15-mobile-layout)
16. [Z-index Stack](#16-z-index-stack)
17. [Fonts](#17-fonts)

---

## 1. Stack & Setup

```
React 18+         (Vite)
Tailwind CSS 3    (JIT)
lucide-react      (icons)
```

**`index.html` head** — import Inter font:
```html
<!-- Already handled via CSS @import in index.css -->
```

**`tailwind.config.js`**:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['selector', 'html.dark'],   // toggled by adding html.dark class
  theme: {
    extend: {
      colors: {
        brand:   '#0D1F4E',
        accent:  '#1A6AB4',
        teal:    '#3DC7B3',
        success: '#2DB37A',
        cloud:   '#F4F8FF',
        mist:    '#E8EDF5',
        steel:   '#A0AABF',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

---

## 2. Brand Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | `#1A6AB4` | Primary CTAs, active states, links |
| `--accent-dark` | `#0D1F4E` | Sidebar, headers, deep backgrounds |
| `--accent-50` | `#EBF4FF` | Soft blue tints, selected rows |
| `--teal` | `#3DC7B3` | Secondary accent, icons, highlights |
| `--success` | `#2DB37A` | Success badges, positive data |
| `--cloud` | `#F4F8FF` | Page & card background |
| `--mist` | `#E8EDF5` | Borders, dividers, input backgrounds |
| `--steel` | `#A0AABF` | Secondary text, captions |
| `--navy` | `#0D1F4E` | Body text (same as accent-dark) |

**JS constant (use in inline styles)**:
```js
export const B = {
  navy:  '#0D1F4E',
  blue:  '#1A6AB4',
  teal:  '#3DC7B3',
  green: '#2DB37A',
  amber: '#F59E0B',
  red:   '#EF4444',
  cloud: '#F4F8FF',
  mist:  '#E8EDF5',
  steel: '#A0AABF',
};

export const GRADIENTS = {
  navy:   'linear-gradient(135deg, #0D1F4E 0%, #1A6AB4 100%)',
  blue:   'linear-gradient(135deg, #1A6AB4, #3DC7B3)',
  teal:   'linear-gradient(135deg, #0E7490, #3DC7B3)',
  green:  'linear-gradient(135deg, #065F46, #2DB37A)',
  amber:  'linear-gradient(135deg, #92400E, #F59E0B)',
  orange: 'linear-gradient(135deg, #9A3412, #F97316)',
  rose:   'linear-gradient(135deg, #9F1239, #F43F5E)',
  violet: 'linear-gradient(135deg, #4C1D95, #7C3AED)',
  indigo: 'linear-gradient(135deg, #312E81, #4F46E5)',
};
```

---

## 3. Global CSS — `index.css`

Paste this entire file as your `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── CSS Variables ──────────────────────────────────────────── */
:root {
  --accent:      #1A6AB4;
  --accent-dark: #0D1F4E;
  --accent-50:   #EBF4FF;
  --teal:        #3DC7B3;
  --success:     #2DB37A;
  --cloud:       #F4F8FF;
  --mist:        #E8EDF5;
  --steel:       #A0AABF;
  --navy:        #0D1F4E;
}

@layer base {
  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #0D1F4E;
    -webkit-font-smoothing: antialiased;
    /* Mesh gradient + subtle dot grid */
    background-color: #EEF3FC;
    background-image:
      radial-gradient(ellipse 80% 60% at 10% 10%,  rgba(26,106,180,0.10) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 90% 90%,  rgba(61,199,179,0.09) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 80% 10%,  rgba(45,179,122,0.06) 0%, transparent 55%),
      radial-gradient(ellipse 40% 35% at 20% 85%,  rgba(26,106,180,0.06) 0%, transparent 55%),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Ccircle cx='1.5' cy='1.5' r='1.2' fill='rgba(26%2C106%2C180%2C0.07)'/%3E%3C/svg%3E");
    background-attachment: fixed;
  }

  html.dark body {
    background-color: #081428;
    background-image:
      radial-gradient(ellipse 80% 60% at 10% 10%,  rgba(26,106,180,0.15) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 90% 90%,  rgba(61,199,179,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 80% 10%,  rgba(45,179,122,0.08) 0%, transparent 55%),
      radial-gradient(ellipse 40% 35% at 20% 85%,  rgba(26,106,180,0.10) 0%, transparent 55%),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Ccircle cx='1.5' cy='1.5' r='1.2' fill='rgba(61%2C199%2C179%2C0.06)'/%3E%3C/svg%3E");
    background-attachment: fixed;
    color: #e2e8f0;
  }

  /* ── Glass classes ── */
  .glass-sidebar {
    background: #111827;
    border-right: 1px solid rgba(255,255,255,0.07);
    --sidebar-fg:            rgba(255,255,255,0.82);
    --sidebar-fg-strong:     #fff;
    --sidebar-fg-muted:      rgba(255,255,255,0.5);
    --sidebar-fg-label:      rgba(255,255,255,0.3);
    --sidebar-active-fg:     #60A5FA;
    --sidebar-active-bg:     rgba(26,106,180,0.2);
    --sidebar-hover-bg:      rgba(255,255,255,0.05);
    --sidebar-border:        rgba(255,255,255,0.08);
    --sidebar-divider:       rgba(255,255,255,0.06);
    --sidebar-scrollbar:     rgba(255,255,255,0.10);
    --sidebar-user-btn-bg:   rgba(255,255,255,0.04);
    --sidebar-user-btn-active: rgba(255,255,255,0.08);
    --sidebar-menu-bg:       rgba(31,41,55,0.88);
    --sidebar-menu-border:   rgba(255,255,255,0.14);
    --sidebar-menu-shadow:   rgba(0,0,0,0.45);
  }

  .glass-topbar {
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
  }
  html.dark .glass-topbar {
    background: #0f172a;
    border-bottom: 1px solid #1f2937;
  }

  .glass-mobile-nav {
    background: #ffffff;
    border-top: 1px solid #e5e7eb;
  }
  html.dark .glass-mobile-nav {
    background: #111827;
    border-top: 1px solid #1f2937;
  }

  .glass-mobile-panel { background: #ffffff; }
  html.dark .glass-mobile-panel { background: #111827; }

  .glass-panel {
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(40px) saturate(1.8);
    -webkit-backdrop-filter: blur(40px) saturate(1.8);
    border: 1px solid rgba(255,255,255,0.5);
  }
  html.dark .glass-panel {
    background: rgba(20,27,45,0.74);
    border: 1px solid rgba(255,255,255,0.1);
  }

  /* ── Responsive: sidebar desktop-only, mobile-only helpers ── */
  .sidebar-desktop { display: flex; }
  @media screen and (max-width: 1023px) { .sidebar-desktop { display: none !important; } }
  .mobile-only { display: block; }
  @media screen and (min-width: 1024px) { .mobile-only { display: none !important; } }

  #root { height: 100vh; display: flex; flex-direction: column; }
}

/* ── Component utilities ────────────────────────────────────── */
@layer components {

  /* Buttons */
  .btn {
    @apply inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border cursor-pointer select-none whitespace-nowrap;
    transition: transform 150ms cubic-bezier(0.23,1,0.32,1), filter 150ms ease, background-color 150ms ease, border-color 150ms ease;
  }
  .btn:active { transform: scale(0.97); }

  .btn-primary  { background-color: var(--accent); border-color: var(--accent-dark); @apply text-white; }
  .btn-primary:hover  { filter: brightness(0.92); }
  .btn-primary:active { filter: brightness(0.88); }

  .btn-secondary { background: #ffffff; color: #0D1F4E; border-color: #E8EDF5; }
  .btn-secondary:hover  { background: #F4F8FF; }
  .btn-secondary:active { background: #E8EDF5; }

  .btn-danger  { @apply bg-red-500 text-white border-red-600 hover:bg-red-600 active:bg-red-700; }

  .btn-success { background-color: #2DB37A; border-color: #1e8c5e; @apply text-white; }
  .btn-success:hover { filter: brightness(0.92); }

  .btn-sm { @apply px-2.5 py-1 text-xs; }
  .btn-xs { @apply px-2 py-0.5 text-xs; }

  /* Tinted action buttons (tables / cards) */
  .btn-approve {
    @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
      bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20
      hover:bg-green-100 transition-colors
      disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none whitespace-nowrap;
  }
  .btn-reject {
    @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
      bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/20
      hover:bg-red-100 transition-colors
      disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none whitespace-nowrap;
  }
  .btn-delete {
    @apply inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
      text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer select-none whitespace-nowrap;
  }
  .btn-action {
    @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
      bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-300/60
      hover:bg-gray-100 transition-colors cursor-pointer select-none whitespace-nowrap;
  }

  /* Forms */
  .form-label { @apply block text-xs font-medium mb-1; color: #0D1F4E; }
  .form-input, .form-select, .form-textarea {
    @apply w-full px-3 py-1.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-colors;
    border: 1px solid #E8EDF5;
    background: #ffffff;
    color: #0D1F4E;
    --tw-ring-color: var(--accent);
  }
  .form-textarea { @apply resize-y; }

  /* Cards */
  .card {
    background: rgba(255,255,255,0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(232,237,245,0.9);
    @apply rounded-lg shadow-sm;
  }
  .card-head {
    @apply flex items-center justify-between px-5 py-3.5;
    border-bottom: 1px solid rgba(232,237,245,0.9);
  }
  .card-title { @apply text-sm font-semibold; color: #0D1F4E; }

  /* Tables */
  .table-wrap  { @apply overflow-x-auto; }
  .data-table  { @apply w-full text-sm border-collapse; }
  .data-table thead th {
    @apply px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide;
    background: #F4F8FF; border-bottom: 1px solid #E8EDF5; color: #A0AABF;
  }
  .data-table tbody tr  { border-bottom: 1px solid #E8EDF5; transition: background-color 120ms ease; }
  .data-table tbody tr:hover { background: color-mix(in srgb, var(--accent) 5%, transparent); }
  .data-table tbody td  { @apply px-4 py-2.5; color: #0D1F4E; }

  /* Page structure */
  .page-head {
    @apply flex items-center justify-between px-6 py-4;
    background: rgba(255,255,255,0.80);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(232,237,245,0.9);
  }
  .page-title   { @apply text-lg font-semibold m-0; color: #0D1F4E; }
  .page-content { @apply flex-1 p-6 overflow-auto; }

  .empty-state      { @apply flex flex-col items-center justify-center py-16 text-center; }
  .empty-state-icon { @apply text-5xl mb-3 opacity-40; }
}

/* ── Dark mode overrides ────────────────────────────────────── */
html.dark .card             { background-color: #1e293b; border-color: #334155; }
html.dark .card-head        { border-color: #334155; }
html.dark .card-title       { color: #e2e8f0; }
html.dark .page-head        { background-color: #1e293b; border-color: #334155; }
html.dark .page-title       { color: #f1f5f9; }
html.dark .data-table thead th      { background-color: #1e293b; border-color: #334155; color: #94a3b8; }
html.dark .data-table tbody tr      { border-color: #334155; }
html.dark .data-table tbody tr:hover{ background-color: rgba(255,255,255,0.04) !important; }
html.dark .data-table tbody td      { color: #cbd5e1; }
html.dark .form-input,
html.dark .form-select,
html.dark .form-textarea    { background-color: #1e293b; border-color: #475569; color: #e2e8f0; }
html.dark .form-input:disabled      { background-color: #0f172a !important; color: #64748b !important; }
html.dark .form-input::placeholder,
html.dark .form-select::placeholder,
html.dark .form-textarea::placeholder { color: #64748b; }
html.dark .form-label       { color: #cbd5e1; }
html.dark .btn-secondary    { background-color: #1e293b; color: #e2e8f0; border-color: #475569; }
html.dark .btn-secondary:hover      { background-color: #334155 !important; }
html.dark .btn-approve      { background-color: rgba(74,222,128,0.1); color: #4ade80; }
html.dark .btn-approve:hover{ background-color: rgba(74,222,128,0.18); }
html.dark .btn-reject       { background-color: rgba(248,113,113,0.1); color: #f87171; }
html.dark .btn-reject:hover { background-color: rgba(248,113,113,0.18); }
html.dark .btn-delete       { color: #f87171; }
html.dark .btn-delete:hover { background-color: rgba(248,113,113,0.1); color: #fca5a5; }
html.dark .btn-action       { background-color: rgba(51,65,85,0.6); color: #cbd5e1; }
html.dark .btn-action:hover { background-color: rgba(51,65,85,0.9); }

/* Tailwind text-gray-* → readable in dark */
html.dark .text-gray-900 { color: #f1f5f9; }
html.dark .text-gray-800 { color: #e2e8f0; }
html.dark .text-gray-700 { color: #cbd5e1; }
html.dark .text-gray-600 { color: #94a3b8; }

/* ── Slim scrollbars ────────────────────────────────────────── */
* { scrollbar-width: thin; scrollbar-color: rgba(160,170,191,0.45) transparent; }
html.dark * { scrollbar-color: rgba(71,85,105,0.55) transparent; }
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(160,170,191,0.45); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.70); }
html.dark ::-webkit-scrollbar-thumb { background: rgba(71,85,105,0.55); }

/* ── Animations ─────────────────────────────────────────────── */
@keyframes dashFadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes sidebarSlideIn {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}
@keyframes menuSlideUp {
  from { opacity: 0; transform: scale(0.95) translateY(6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* ── Reduced motion ─────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  .btn:active { transform: none !important; }
}
```

---

## 4. Tailwind Config

Already shown in [Section 1](#1-stack--setup). Key additions:
- `darkMode: ['selector', 'html.dark']` — toggled by JS adding/removing the `dark` class on `<html>`
- Custom color names matching the brand palette

---

## 5. Component Library

### 5a. StatCard

Gradient stat cards used on dashboards. Supports click-to-navigate.

```jsx
// src/components/StatCard.jsx
import { ArrowUpRight } from 'lucide-react';

export const GRADIENTS = {
  navy:   'linear-gradient(135deg, #0D1F4E 0%, #1A6AB4 100%)',
  blue:   'linear-gradient(135deg, #1A6AB4, #3DC7B3)',
  teal:   'linear-gradient(135deg, #0E7490, #3DC7B3)',
  green:  'linear-gradient(135deg, #065F46, #2DB37A)',
  amber:  'linear-gradient(135deg, #92400E, #F59E0B)',
  orange: 'linear-gradient(135deg, #9A3412, #F97316)',
  rose:   'linear-gradient(135deg, #9F1239, #F43F5E)',
  violet: 'linear-gradient(135deg, #4C1D95, #7C3AED)',
  indigo: 'linear-gradient(135deg, #312E81, #4F46E5)',
};

export default function StatCard({ label, value, icon: Icon, gradient, sub, onClick, delay = 0 }) {
  const grad = GRADIENTS[gradient] || gradient || GRADIENTS.navy;
  return (
    <div
      onClick={onClick}
      style={{
        background: grad,
        borderRadius: 16,
        padding: '20px 22px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        animation: `dashFadeUp 0.3s cubic-bezier(0.23,1,0.32,1) ${delay}s both`,
        transition: 'transform 0.25s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.25s ease',
        boxShadow: '0 4px 20px rgba(13,31,78,0.12)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(13,31,78,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(13,31,78,0.12)';
      }}
    >
      {/* Decorative circles */}
      <div style={{ position:'absolute', right:-20, top:-20, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', right:10, bottom:-30, width:70, height:70, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)', letterSpacing:'0.07em', textTransform:'uppercase' }}>
          {label}
        </span>
        {Icon && (
          <div style={{ width:32, height:32, borderRadius:9, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon size={15} color="rgba(255,255,255,0.9)" />
          </div>
        )}
      </div>

      <div style={{ fontSize:'2rem', fontWeight:800, color:'#fff', lineHeight:1, marginBottom:6 }}>
        {value ?? '—'}
      </div>

      {sub && (
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <ArrowUpRight size={11} color="rgba(255,255,255,0.5)" />
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:500 }}>{sub}</span>
        </div>
      )}
    </div>
  );
}
```

**Usage:**
```jsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard label="Pending Leaves"  value={12}   icon={CalendarDays} gradient="amber" delay={0.04} onClick={() => navigate('leaves')} />
  <StatCard label="Approved Leaves" value={45}   icon={CalendarDays} gradient="green" delay={0.08} />
  <StatCard label="Leave Balance"   value={18}   icon={Clock}        gradient="navy"  delay={0.12} />
  <StatCard label="Employees"       value={240}  icon={Users}        gradient="blue"  delay={0.16} />
</div>
```

---

### 5b. Badge

Status pill badges with dot indicators. Covers all common statuses.

```jsx
// src/components/Badge.jsx
const VARIANTS = {
  Active:     { dot:'bg-green-500',  cls:'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400' },
  Inactive:   { dot:'bg-gray-400',   cls:'bg-gray-100 text-gray-500 ring-gray-400/30 dark:bg-gray-800 dark:text-gray-400' },
  Pending:    { dot:'bg-amber-400',  cls:'bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-900/20 dark:text-amber-400' },
  Approved:   { dot:'bg-green-500',  cls:'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400' },
  Rejected:   { dot:'bg-red-500',    cls:'bg-red-50 text-red-600 ring-red-500/20 dark:bg-red-900/20 dark:text-red-400' },
  Cancelled:  { dot:'bg-gray-400',   cls:'bg-gray-100 text-gray-500 ring-gray-400/30 dark:bg-gray-800 dark:text-gray-400' },
  Open:       { dot:'bg-green-500',  cls:'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400' },
  Closed:     { dot:'bg-gray-400',   cls:'bg-gray-100 text-gray-500 ring-gray-400/30 dark:bg-gray-800 dark:text-gray-400' },
  Draft:      { dot:'bg-slate-400',  cls:'bg-slate-100 text-slate-500 ring-slate-400/30 dark:bg-slate-800 dark:text-slate-400' },
  Completed:  { dot:'bg-green-500',  cls:'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400' },
  Present:    { dot:'bg-green-500',  cls:'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400' },
  Absent:     { dot:'bg-red-500',    cls:'bg-red-50 text-red-600 ring-red-500/20 dark:bg-red-900/20 dark:text-red-400' },
  'On Leave': { dot:'bg-amber-400',  cls:'bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-900/20 dark:text-amber-400' },
  'Half Day': { dot:'bg-blue-500',   cls:'bg-blue-50 text-blue-700 ring-blue-500/20 dark:bg-blue-900/20 dark:text-blue-400' },
  WFH:        { dot:'bg-purple-500', cls:'bg-purple-50 text-purple-700 ring-purple-500/20 dark:bg-purple-900/20 dark:text-purple-400' },
  'In Progress': { dot:'bg-blue-500', cls:'bg-blue-50 text-blue-700 ring-blue-500/20 dark:bg-blue-900/20 dark:text-blue-400' },
  Interview:  { dot:'bg-violet-500', cls:'bg-violet-50 text-violet-700 ring-violet-500/20 dark:bg-violet-900/20 dark:text-violet-400' },
  Hired:      { dot:'bg-green-500',  cls:'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400' },
};

export default function Badge({ text }) {
  const v = VARIANTS[text];
  const cls = v?.cls ?? 'bg-blue-50 text-blue-700 ring-blue-500/20 dark:bg-blue-900/20 dark:text-blue-400';
  const dot = v?.dot ?? 'bg-blue-500';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {text || '—'}
    </span>
  );
}
```

**Usage:** `<Badge text="Approved" />` `<Badge text="Pending" />` `<Badge text="WFH" />`

---

### 5c. Toast

Feedback notifications (top-right, auto-dismissed by the hook).

```jsx
// src/components/Toast.jsx
const COLORS = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
};
const ICONS = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };

export default function ToastContainer({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium shadow-md min-w-[260px] max-w-xs pointer-events-auto ${COLORS[t.type] || COLORS.info}`}
          style={{ animation: 'dashFadeUp 0.25s ease both' }}>
          <span className="text-base leading-none">{ICONS[t.type] || ICONS.info}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
```

```js
// src/hooks/useToast.js
import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = 'info', duration = 3500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  return { toasts, toast };
}
```

**Usage:**
```jsx
const { toasts, toast } = useToast();
// ...
toast('Saved successfully', 'success');
toast('Something went wrong', 'error');
// Render: <ToastContainer toasts={toasts} />
```

---

### 5d. ConfirmModal

Reusable confirmation dialog.

```jsx
// src/components/ConfirmModal.jsx
export default function ConfirmModal({
  open, title, message, onConfirm, onCancel,
  confirmLabel = 'Confirm', danger = false
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={onConfirm} className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 5e. SectionCard (Dashboard helper)

Used inside dashboard pages to wrap each content section.

```jsx
function SectionCard({ title, icon: Icon, action, onNavigate, children }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-gray-400" />
          <span className="card-title">{title}</span>
        </div>
        {action && (
          <button
            onClick={() => onNavigate(action)}
            className="text-xs flex items-center gap-0.5 hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            View all <ChevronRight size={12} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
```

---

## 6. Page Shell Patterns

### App shell (layout)
```jsx
// Outer wrapper
<div className="flex h-screen overflow-hidden">

  {/* Fixed sidebar (desktop) */}
  <aside className="glass-sidebar sidebar-desktop flex-col fixed inset-y-0 left-0 z-40 flex-shrink-0"
    style={{ width: 220 }}>
    {/* sidebar content */}
  </aside>

  {/* Main area */}
  <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:ml-[220px]">

    {/* Topbar */}
    <header className="glass-topbar sidebar-desktop h-11 items-center px-4 gap-3 flex-shrink-0 z-20">
      {/* breadcrumb + bell */}
    </header>

    {/* Page content */}
    <main className="flex-1 overflow-auto flex flex-col pb-16 lg:pb-0">
      {/* page component renders here */}
    </main>

  </div>
</div>
```

### Page component structure
```jsx
export default function MyPage({ toast, onNavigate }) {
  return (
    <div className="flex flex-col flex-1">

      {/* Page header — sticky at top */}
      <div className="page-head flex-shrink-0">
        <h1 className="page-title">Page Title</h1>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary btn-sm">
            <Plus size={14} /> Add New
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="page-content">

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input className="form-input max-w-[240px]" placeholder="Search…" />
          <select className="form-select w-auto">
            <option value="">All Status</option>
            <option value="active">Active</option>
          </select>
        </div>

        {/* Data table */}
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td><Badge text={row.status} /></td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button className="btn-action"><Edit size={12} /> Edit</button>
                        <button className="btn-delete"><Trash2 size={12} /> Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
```

### Empty state
```jsx
{rows.length === 0 && (
  <div className="empty-state">
    <div className="empty-state-icon">📋</div>
    <p className="text-gray-500 text-sm font-medium">No records found</p>
    <p className="text-gray-400 text-xs mt-1">Add your first entry to get started</p>
  </div>
)}
```

---

## 7. Sidebar Pattern

The sidebar is a fixed `220px` dark panel. **Critical:** define it as a top-level component (not nested inside another component's function body) so React never unmounts it on re-renders — this preserves the scroll position.

```jsx
// Key structure
<aside className="glass-sidebar sidebar-desktop flex-col fixed inset-y-0 left-0 z-40"
  style={{ width: 220 }}>

  {/* Brand header */}
  <div style={{ padding:'14px 16px 12px', borderBottom:'1px solid var(--sidebar-border)' }}>
    <img src="/logo.svg" style={{ width:28, height:28 }} />
    <span style={{ fontSize:13.5, fontWeight:600, color:'var(--sidebar-fg-strong)' }}>App Name</span>
  </div>

  {/* Nav — scrollable, scroll position stays because component never unmounts */}
  <nav style={{ flex:1, overflowY:'auto', padding:'6px 0',
    scrollbarWidth:'thin', scrollbarColor:'var(--sidebar-scrollbar) transparent' }}>

    {/* Section label */}
    <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase',
      color:'var(--sidebar-fg-label)', padding:'8px 16px 3px' }}>
      HR Management
    </div>

    {/* Nav item */}
    <button style={{
      width:'calc(100% - 16px)', margin:'1px 8px', display:'flex', alignItems:'center',
      gap:8, padding:'6px 10px', borderRadius:6, border:'none', cursor:'pointer',
      background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
      color: isActive ? 'var(--sidebar-active-fg)' : 'var(--sidebar-fg-muted)',
      fontSize:13, fontWeight: isActive ? 500 : 400,
      transition:'background 0.12s, color 0.12s',
    }}>
      {/* Active indicator bar */}
      {isActive && <span style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
        width:2.5, height:14, borderRadius:2, background:'var(--sidebar-active-fg)' }} />}
      <ItemIcon size={14} style={{ opacity: isActive ? 0.95 : 0.65 }} />
      <span>{label}</span>
    </button>

  </nav>

  {/* User footer */}
  <div style={{ padding:'10px', borderTop:'1px solid var(--sidebar-border)' }}>
    <button style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 8px',
      borderRadius:8, background:'var(--sidebar-user-btn-bg)', border:'none', cursor:'pointer' }}>
      <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent)',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>
        {initials}
      </div>
      <div>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--sidebar-fg)' }}>{name}</div>
        <div style={{ fontSize:10.5, color:'var(--sidebar-fg-label)' }}>{role}</div>
      </div>
    </button>
  </div>

</aside>
```

**Collapsible sections** use CSS grid animation:
```jsx
<div style={{ display:'grid', gridTemplateRows: isCollapsed ? '0fr' : '1fr',
  transition:'grid-template-rows 200ms cubic-bezier(0.23,1,0.32,1)' }}>
  <div style={{ overflow:'hidden', opacity: isCollapsed ? 0 : 1, transition:'opacity 150ms ease' }}>
    {/* items */}
  </div>
</div>
```

---

## 8. Topbar / Header Pattern

```jsx
<header className="glass-topbar sidebar-desktop h-11 items-center px-4 gap-3 flex-shrink-0 z-20">

  {/* Menu/collapse toggle */}
  <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
    <Menu size={18} />
  </button>

  {/* Breadcrumb */}
  <nav className="flex items-center gap-1 text-sm text-gray-500 min-w-0">
    <button className="hover:text-gray-900 transition-colors flex-shrink-0">
      <Home size={14} />
    </button>
    <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
    <span className="text-gray-400 hidden sm:block flex-shrink-0">{section}</span>
    <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
    <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{pageLabel}</span>
  </nav>

  {/* Right side */}
  <div className="ml-auto flex items-center gap-1">
    {/* Bell */}
    <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 relative">
      <Bell size={16} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white animate-pulse"
          style={{ backgroundColor:'var(--accent)' }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  </div>

</header>
```

---

## 9. Notification System

### Bell dropdown panel
```jsx
{bellOpen && (
  <div className="absolute right-0 top-10 w-[360px] rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-200/70 dark:border-gray-700/60">

    {/* Gradient header */}
    <div className="px-4 py-3.5 flex items-center justify-between"
      style={{ background:'linear-gradient(135deg, var(--accent-dark,#0D1F4E) 0%, var(--accent,#1A6AB4) 100%)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
          <Bell size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold text-white">Notifications</span>
        {count > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white border border-white/25">
            {count}
          </span>
        )}
      </div>
      <button onClick={close} className="p-1 rounded-lg hover:bg-white/15 text-white/60 hover:text-white">
        <X size={14} />
      </button>
    </div>

    {/* Items */}
    <div className="max-h-[400px] overflow-y-auto bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-800/80">
      {notifs.map(n => (
        <button key={n.id} onClick={() => handleClick(n)}
          className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left group">
          {/* Priority dot */}
          <div className="flex-shrink-0 mt-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColor }} />
          </div>
          {/* Icon */}
          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-base"
            style={{ backgroundColor: lightBg }}>
            {n.icon || '🔔'}
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">{n.title}</span>
              <span className="text-[10px] text-gray-400 flex-shrink-0">{n.time}</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{n.message}</p>
          </div>
          <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 mt-1 flex-shrink-0" />
        </button>
      ))}
    </div>

    {/* Dismiss all footer */}
    {notifs.length > 0 && (
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900 flex justify-center">
        <button onClick={dismissAll} className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-75"
          style={{ color:'var(--accent)' }}>
          <CheckCheck size={13} /> Dismiss all
        </button>
      </div>
    )}
  </div>
)}
```

### Slide-in toast (Teams style — bottom-right, slides up)

```jsx
function SlideNotif({ notif, onClose, onNavigate }) {
  const [phase, setPhase] = useState('enter'); // enter → show → leave
  const SLIDE_DURATION = 5500;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 30);
    const t2 = setTimeout(dismiss, SLIDE_DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const dismiss = () => { setPhase('leave'); setTimeout(onClose, 380); };

  const COLOR = { high:'#ef4444', medium:'#f59e0b', low:'#3b82f6' };
  const color = COLOR[notif.priority] || 'var(--accent)';

  const transform =
    phase === 'show'  ? 'translateY(0) scale(1)'   :
    phase === 'leave' ? 'translateX(115%)'          :
                        'translateY(28px) scale(0.95)';

  return (
    <div style={{ transform, opacity: phase === 'show' ? 1 : 0,
      transition: phase === 'leave'
        ? 'transform 0.32s cubic-bezier(0.4,0,1,1), opacity 0.22s ease'
        : 'transform 0.44s cubic-bezier(0.22,1.3,0.36,1), opacity 0.3s ease',
      width:340, borderRadius:16, overflow:'hidden', cursor:'pointer' }}
      onClick={() => { if (notif.action) onNavigate(notif.action); dismiss(); }}>

      <div className="bg-white/96 dark:bg-gray-900/96 backdrop-blur-2xl border border-gray-200/70 dark:border-gray-700/60 shadow-2xl rounded-2xl overflow-hidden">
        {/* Top accent bar */}
        <div style={{ height:3, background:`linear-gradient(90deg,${color},${color}55)` }} />
        <div className="flex items-start gap-3 px-4 py-3.5">
          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-[17px]"
            style={{ background:color+'18' }}>
            {notif.icon || '🔔'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-gray-900 dark:text-white leading-tight">{notif.title}</p>
            <p className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
            {notif.action && <span className="text-[10px] font-semibold mt-1.5 inline-block" style={{color}}>Click to open →</span>}
          </div>
          <button onClick={e => { e.stopPropagation(); dismiss(); }}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X size={13} />
          </button>
        </div>
        {/* Progress drain bar */}
        <div className="h-[2px] mx-4 mb-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div style={{ height:'100%', borderRadius:9999, backgroundColor:color,
            width: phase === 'show' ? '0%' : '100%',
            transition: phase === 'show' ? `width ${SLIDE_DURATION}ms linear` : 'none' }} />
        </div>
      </div>
    </div>
  );
}

// Portal — renders into document.body, bottom-right
{createPortal(
  <div className="fixed bottom-6 right-6 z-[9998] flex flex-col-reverse gap-3 pointer-events-none">
    {slideNotifs.map(n => (
      <div key={n.uid} className="pointer-events-auto">
        <SlideNotif notif={n} onNavigate={onNavigate}
          onClose={() => setSlideNotifs(prev => prev.filter(x => x.uid !== n.uid))} />
      </div>
    ))}
  </div>,
  document.body
)}
```

### Persistence — "Dismiss all" survives refresh

```js
const SEEN_KEY      = 'app_seen_notif_ids';
const DISMISSED_KEY = 'app_dismissed_notif_ids';

// When applying notifications from API/SSE:
function applyNotifs(list, isInitial = false) {
  const dismissed = new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'));
  const visible   = list.filter(n => !dismissed.has(String(n.id)));

  const seen  = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
  const fresh = visible.filter(n => !seen.has(String(n.id)));

  if (fresh.length && !isInitial) {
    // Show slide-in toasts for fresh items
    setSlideNotifs(prev => [...prev, ...fresh.slice(0,3).map(n => ({ ...n, uid:`${n.id}-${Date.now()}` }))]);
    setUnreadIds(prev => new Set([...prev, ...fresh.map(n => String(n.id))]));
  }

  localStorage.setItem(SEEN_KEY, JSON.stringify(list.map(n => String(n.id))));
  setNotifs(visible);
}

// Dismiss all
function dismissAll() {
  const ids      = notifs.map(n => String(n.id));
  const existing = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...new Set([...existing, ...ids])]));
  setNotifs([]);
  setBellOpen(false);
}
```

---

## 10. Forms

### Standard form field
```jsx
<div>
  <label className="form-label">Email Address</label>
  <input type="email" className="form-input" placeholder="user@company.com" />
</div>
```

### Form grid layout
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="form-label">First Name</label>
    <input className="form-input" />
  </div>
  <div>
    <label className="form-label">Last Name</label>
    <input className="form-input" />
  </div>
  <div className="md:col-span-2">
    <label className="form-label">Notes</label>
    <textarea className="form-textarea" rows={3} />
  </div>
</div>
```

### Modal form wrapper
```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
  <div className="relative glass-panel rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">

    {/* Modal header */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/30 dark:border-gray-700 flex-shrink-0">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Modal Title</h2>
      <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
        <X size={16} />
      </button>
    </div>

    {/* Scrollable body */}
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {/* form fields */}
    </div>

    {/* Footer */}
    <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/30 dark:border-gray-700 flex-shrink-0">
      <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
      <button onClick={handleSubmit} className="btn btn-primary btn-sm">Save</button>
    </div>

  </div>
</div>
```

---

## 11. Tables

### Standard table with badges and actions
```jsx
<div className="card">
  {/* Optional filters */}
  <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-3">
    <input className="form-input max-w-[240px]" placeholder="Search…" />
    <select className="form-select w-auto text-xs">
      <option value="">All Status</option>
    </select>
    <span className="ml-auto text-xs text-gray-400">{count} records</span>
  </div>

  <div className="table-wrap">
    <table className="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Department</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.id}>
            <td>
              <div className="font-medium text-gray-900 dark:text-white">{row.name}</div>
              <div className="text-xs text-gray-400">{row.email}</div>
            </td>
            <td className="text-gray-500 dark:text-gray-400">{row.dept}</td>
            <td><Badge text={row.status} /></td>
            <td>
              <div className="flex items-center gap-1.5">
                <button className="btn-approve"><Check size={12} /> Approve</button>
                <button className="btn-reject"><X size={12} /> Reject</button>
                <button className="btn-action"><Edit size={12} /> Edit</button>
                <button className="btn-delete"><Trash2 size={12} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Empty state */}
  {rows.length === 0 && (
    <div className="empty-state">
      <div className="empty-state-icon">📋</div>
      <p className="text-sm font-medium text-gray-500">No records found</p>
    </div>
  )}
</div>
```

---

## 12. Dark Mode

**Toggle dark mode** by adding/removing `dark` class on `<html>`:
```js
// Enable dark
document.documentElement.classList.add('dark');
localStorage.setItem('theme', 'dark');

// Disable dark
document.documentElement.classList.remove('dark');
localStorage.setItem('theme', 'light');

// On app load — restore saved preference
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
}
```

All dark overrides are in `index.css` as `html.dark .class-name { ... }`.  
Key dark surface colors:
| Element | Dark value |
|---------|-----------|
| Card background | `#1e293b` |
| Card border | `#334155` |
| Page head | `#1e293b` |
| Form input bg | `#1e293b` |
| Form input border | `#475569` |
| Body bg | `#081428` |
| Sidebar bg | `#111827` (unchanged — always dark) |

---

## 13. Glass / Background Image Mode

When a custom background image is active, add `has-bg-image` (and `bg-is-dark` if the image is dark) to `<html>`:

```js
document.documentElement.classList.add('has-bg-image');
document.documentElement.classList.add('bg-is-dark'); // if image is dark
// Set the image via CSS variable:
document.documentElement.style.setProperty('--app-bg-image', `url('/themes/my-photo.jpg')`);
document.documentElement.style.setProperty('--bg-overlay', 'rgba(0,0,0,0.35)'); // dim overlay
```

When `has-bg-image` is set, the CSS automatically converts:
- `.card` → frosted glass (`rgba(255,255,255,0.55)` + `backdrop-filter: blur(34px)`)
- `.glass-sidebar` → frosted dark glass
- `.glass-topbar` → frosted bar
- `.page-head` → frosted header
- `main` and `.page-content` → transparent (image shows through)

No JSX changes needed — all handled by CSS selectors.

---

## 14. Animations & Motion

### Card entrance (staggered)
```css
/* In CSS */
@keyframes dashFadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
```jsx
// In JSX (inline style with delay)
style={{ animation: `dashFadeUp 0.3s cubic-bezier(0.23,1,0.32,1) ${index * 0.04}s both` }}
```

### Sidebar slide-in (mobile)
```css
@keyframes sidebarSlideIn {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}
```
```jsx
style={{ animation: 'sidebarSlideIn 0.28s cubic-bezier(0.32,0.72,0,1) both' }}
```

### Popup menu appear
```css
@keyframes menuSlideUp {
  from { opacity: 0; transform: scale(0.95) translateY(6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
```
```jsx
style={{ animation: 'menuSlideUp 0.15s cubic-bezier(0.23,1,0.32,1) both', transformOrigin: 'bottom left' }}
```

### Collapsible section (CSS grid trick)
```jsx
// Animates height without knowing the height value
<div style={{ display:'grid', gridTemplateRows: isOpen ? '1fr' : '0fr',
  transition:'grid-template-rows 200ms cubic-bezier(0.23,1,0.32,1)' }}>
  <div style={{ overflow:'hidden' }}>
    {children}
  </div>
</div>
```

### Button press feedback
```css
.btn:active { transform: scale(0.97); }
/* Transition set on .btn: transition: transform 150ms cubic-bezier(0.23,1,0.32,1) */
```

---

## 15. Mobile Layout

The app uses a **bottom nav bar** on mobile (< 1024px) and a **fixed sidebar** on desktop.

Key classes:
- `.sidebar-desktop` → `display: flex` on desktop, `display: none` on mobile
- `.mobile-only` → `display: block` on mobile, `display: none` on desktop

### Mobile bottom nav pattern
```jsx
<nav className="fixed bottom-0 left-0 right-0 z-40 mobile-only glass-mobile-nav shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
  <div className="flex items-end justify-around px-1 pt-2 pb-3">

    {/* Regular nav tab */}
    <button className="flex flex-col items-center gap-1 px-2 py-1">
      <Home size={20} style={{ color: isActive ? 'var(--accent)' : '#9CA3AF' }} />
      <span className="text-[10px] font-medium" style={{ color: isActive ? 'var(--accent)' : '#9CA3AF' }}>Home</span>
    </button>

    {/* Centre elevated FAB */}
    <div className="flex flex-col items-center gap-1 -mt-5">
      <button className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        style={{ backgroundColor:'var(--accent)' }}>
        <Menu size={20} className="text-white" />
      </button>
      <span className="text-[10px] font-medium text-gray-500">More</span>
    </div>

  </div>
</nav>
```

### Slide-up drawer (mobile)
```jsx
{/* Backdrop */}
{open && <div className="fixed inset-0 bg-black/40 z-40 mobile-only" onClick={close} />}

{/* Panel */}
<div className={`fixed bottom-0 left-0 right-0 z-50 mobile-only glass-mobile-panel rounded-t-2xl shadow-2xl transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}>
  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Panel Title</span>
    <button onClick={close} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
      <X size={16} />
    </button>
  </div>
  <div className="overflow-y-auto max-h-[65vh] p-4">
    {/* content */}
  </div>
  <div className="h-safe-area-inset-bottom pb-4" />
</div>
```

### Responsive attendance card (mobile vs desktop)
```jsx
{/* Mobile: stacked — check-in first, then circles */}
<div className="md:hidden p-4 space-y-3">
  <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Today</div>
  {/* Check In row */}
  <div className="flex items-center gap-3">
    <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
      <LogIn size={20} className="text-green-600" />
    </div>
    <div>
      <div className="text-[11px] text-gray-400">Check In</div>
      <div className="text-lg font-bold text-green-600">{checkIn}</div>
    </div>
  </div>
  {/* Expected Out row */}
  <div className="flex items-center gap-3">
    <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center">
      <LogOut size={20} className="text-amber-500" />
    </div>
    <div>
      <div className="text-[11px] text-gray-400">Expected Out</div>
      <div className="text-lg font-bold text-amber-500">{expectedOut}</div>
    </div>
  </div>
  {/* 7-day circles below */}
  <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-2">
    {days.map(d => (
      <div key={d.date} className="flex flex-col items-center gap-1 w-9">
        <div className={`w-9 h-9 rounded-full ${statusColor} flex items-center justify-center text-white text-xs font-bold`}>
          {d.status[0]}
        </div>
        <div className="text-[9px] text-gray-500 text-center">{d.label}</div>
      </div>
    ))}
  </div>
</div>

{/* Desktop: horizontal — circles | divider | check-in/out */}
<div className="hidden md:flex items-center gap-2 p-4">
  {/* circles */}  {/* vertical divider */}  {/* today times side-by-side */}
</div>
```

---

## 16. Z-index Stack

| Layer | Value | Element |
|-------|-------|---------|
| Slide toasts | `9998` | `fixed bottom-6 right-6` |
| Toasts (feedback) | `9999` | `fixed top-4 right-4` |
| Modals | `60` | `fixed inset-0` |
| Sidebar (mobile) | `40` | `fixed inset-y-0 left-0` |
| Sidebar (desktop) | `40` | `fixed inset-y-0 left-0` |
| Topbar | `20` | `flex-shrink-0` |
| Notification dropdown | `50` | `absolute right-0 top-10` |
| Backdrop overlays | `30–39` | `fixed inset-0 bg-black/40` |

---

## 17. Fonts

```html
<!-- Google Fonts in index.css -->
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

| Font | Usage |
|------|-------|
| **Inter** | All UI text (body, labels, buttons, nav) |
| **System-ui** | Fallback |

Font size scale used in the app:

| Size | Usage |
|------|-------|
| `9px` | Tiny mobile labels |
| `10px` | Badges, timestamps, empty subtitles |
| `11px` | Secondary labels, table captions |
| `12px` | Sidebar nav, notification titles |
| `13px` | Default body, buttons, sidebar items |
| `14px` | Topbar breadcrumb, standard inputs |
| `15px` | Section headers, modal headings |
| `18–24px` | Stat card values |
| `32px (2rem)` | Large metric values |

---

## Quick Reference Cheatsheet

```jsx
// ── Layout ───────────────────────────────
<div className="flex h-screen overflow-hidden">          {/* App shell */}
<div className="page-content">                           {/* Scrollable page area */}
<div className="page-head">                              {/* Sticky page header */}
<div className="card">                                   {/* Content card */}
<div className="card-head">                              {/* Card title bar */}

// ── Typography ───────────────────────────
<h1 className="page-title">                             {/* Page heading */}
<span className="card-title">                           {/* Card heading */}

// ── Buttons ──────────────────────────────
<button className="btn btn-primary">Save</button>
<button className="btn btn-secondary btn-sm">Cancel</button>
<button className="btn btn-danger btn-sm">Delete</button>
<button className="btn-approve"><Check size={12} /> Approve</button>
<button className="btn-reject"><X size={12} /> Reject</button>
<button className="btn-action"><Edit size={12} /> Edit</button>
<button className="btn-delete"><Trash2 size={12} /></button>

// ── Forms ────────────────────────────────
<label className="form-label">Label</label>
<input className="form-input" />
<select className="form-select" />
<textarea className="form-textarea" />

// ── Table ────────────────────────────────
<div className="table-wrap">
  <table className="data-table">
    <thead><tr><th>Col</th></tr></thead>
    <tbody><tr><td>Value</td></tr></tbody>
  </table>
</div>

// ── Badges ───────────────────────────────
<Badge text="Approved" />    {/* green */}
<Badge text="Pending" />     {/* amber */}
<Badge text="Rejected" />    {/* red */}
<Badge text="Active" />      {/* green */}
<Badge text="WFH" />         {/* purple */}

// ── Glass classes (always available) ─────
.glass-sidebar      → dark sidebar panel
.glass-topbar       → white/frosted topbar
.glass-mobile-nav   → white/frosted bottom nav
.glass-mobile-panel → white/frosted slide-up drawer
.glass-panel        → frosted modal/dialog surface

// ── Accent color (CSS variable) ──────────
style={{ color: 'var(--accent)' }}
style={{ backgroundColor: 'var(--accent)' }}
style={{ borderColor: 'var(--accent-dark)' }}
```
