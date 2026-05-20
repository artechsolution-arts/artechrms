# Artech HRMS — UI Design System Spec

> Paste this file into a new Claude conversation and say:
> **"Build [your app name] using this UI spec."**
> Claude will produce a React + Tailwind app with identical visual language.

---

## Stack

- **React 18** with Vite
- **Tailwind CSS v3**
- **lucide-react** for all icons
- **Inter** font from Google Fonts
- No UI library (MUI, Chakra, etc.) — all components are hand-built

---

## 1. Brand Palette & CSS Variables

Add to `src/index.css` before Tailwind directives:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --accent:      #1A6AB4;   /* ARTech Blue — primary CTAs */
  --accent-dark: #0D1F4E;   /* Deep Navy — borders, hover states */
  --accent-50:   #EBF4FF;   /* Light blue — active backgrounds */
  --teal:        #3DC7B3;   /* Innovation Teal — highlights */
  --success:     #2DB37A;   /* Growth Green — success states */
  --cloud:       #F4F8FF;   /* Cloud White — page background */
  --mist:        #E8EDF5;   /* Mist Gray — borders, dividers */
  --steel:       #A0AABF;   /* Steel Gray — secondary text */
  --navy:        #0D1F4E;   /* Deep Navy — primary text */
}

/* Swappable accent themes */
html[data-accent="teal"]   { --accent: #3DC7B3; --accent-dark: #0D1F4E; --accent-50: #EDFAF7; }
html[data-accent="purple"] { --accent: #7C3AED; --accent-dark: #4C1D95; --accent-50: #f5f3ff; }
html[data-accent="green"]  { --accent: #2DB37A; --accent-dark: #065F46; --accent-50: #ecfdf5; }
html[data-accent="rose"]   { --accent: #E11D48; --accent-dark: #9F1239; --accent-50: #fff1f2; }
html[data-accent="indigo"] { --accent: #4F46E5; --accent-dark: #312E81; --accent-50: #eef2ff; }
```

**Body defaults:**
```css
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #F4F8FF;
  color: #0D1F4E;
  -webkit-font-smoothing: antialiased;
}
html.dark body { background: #0a1628; color: #e2e8f0; }
```

---

## 2. Utility Classes (Tailwind `@layer components`)

Copy these into `index.css` inside `@layer components {}`:

### Buttons
```css
.btn {
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border transition-all duration-150 cursor-pointer select-none whitespace-nowrap;
}
.btn-primary   { background-color: var(--accent); border-color: var(--accent-dark); @apply text-white; }
.btn-primary:hover  { filter: brightness(0.92); }
.btn-secondary { background: #fff; color: #0D1F4E; border-color: #E8EDF5; }
.btn-secondary:hover { background: #F4F8FF; }
.btn-danger    { @apply bg-red-500 text-white border-red-600 hover:bg-red-600; }
.btn-success   { background-color: #2DB37A; border-color: #1e8c5e; @apply text-white; }
.btn-success:hover { filter: brightness(0.92); }
.btn-sm  { @apply px-2.5 py-1 text-xs; }
.btn-xs  { @apply px-2 py-0.5 text-xs; }
```

### Form Controls
```css
.form-label   { @apply block text-xs font-medium mb-1; color: #0D1F4E; }
.form-input   { @apply w-full px-3 py-1.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-colors; border: 1px solid #E8EDF5; background: #fff; color: #0D1F4E; --tw-ring-color: var(--accent); }
.form-select  { /* same as form-input */ }
.form-textarea { @apply w-full px-3 py-1.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:border-transparent resize-y; border: 1px solid #E8EDF5; background: #fff; color: #0D1F4E; }
```

### Cards
```css
.card        { background: #fff; border: 1px solid #E8EDF5; @apply rounded-lg shadow-sm; }
.card-head   { @apply flex items-center justify-between px-5 py-3.5; border-bottom: 1px solid #E8EDF5; }
.card-title  { @apply text-sm font-semibold; color: #0D1F4E; }
```

### Tables
```css
.table-wrap  { @apply overflow-x-auto; }
.data-table  { @apply w-full text-sm border-collapse; }
.data-table thead th {
  @apply px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide;
  background: #F4F8FF; border-bottom: 1px solid #E8EDF5; color: #A0AABF;
}
.data-table tbody tr  { border-bottom: 1px solid #E8EDF5; @apply transition-colors; }
.data-table tbody tr:hover { background: color-mix(in srgb, var(--accent) 5%, transparent); }
.data-table tbody td  { @apply px-4 py-2.5; color: #0D1F4E; }
```

### Page Layout
```css
.page-head    { @apply flex items-center justify-between px-6 py-4; background: #fff; border-bottom: 1px solid #E8EDF5; }
.page-title   { @apply text-lg font-semibold m-0; color: #0D1F4E; }
.page-content { @apply flex-1 p-6 overflow-auto; }
.empty-state  { @apply flex flex-col items-center justify-center py-16 text-center; }
```

---

## 3. Dark Mode

Toggle by adding/removing the `dark` class on `<html>`. Store preference in `localStorage`.

```css
html.dark .card            { background-color: #1e293b; border-color: #334155; }
html.dark .page-head       { background-color: #1e293b; border-color: #334155; }
html.dark .data-table thead th { background-color: #1e293b; border-color: #334155; color: #94a3b8; }
html.dark .data-table tbody tr { border-color: #334155; }
html.dark .data-table tbody td { color: #cbd5e1; }
html.dark .form-input,
html.dark .form-select,
html.dark .form-textarea   { background-color: #1e293b; border-color: #475569; color: #e2e8f0; }
html.dark .btn-secondary   { background-color: #1e293b; color: #e2e8f0; border-color: #475569; }
html.dark .text-gray-900 { color: #f1f5f9; }
html.dark .text-gray-800 { color: #e2e8f0; }
html.dark .text-gray-700 { color: #cbd5e1; }
html.dark .text-gray-600 { color: #94a3b8; }
```

---

## 4. Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (220px fixed left, desktop only)           │
│  ┌──────────────────────────────────────────────┐   │
│  │  Logo + App name                             │   │
│  │  ─────────────────────────────               │   │
│  │  Dashboard (no section)                      │   │
│  │                                              │   │
│  │  ▾ HR                    ← collapsible       │   │
│  │    Employees                                 │   │
│  │    Departments                               │   │
│  │    ...                                       │   │
│  │                                              │   │
│  │  ▾ Payroll                                   │   │
│  │  ▾ Recruitment                               │   │
│  │  ▾ Documents                                 │   │
│  │  ─────────────────────────────               │   │
│  │  [Avatar] User name · Role    [Logout]       │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  Main area (flex-1, lg:ml-[220px])                  │
│  ┌──────────────────────────────────────────────┐   │
│  │  Topbar: [☰] Home > Section > Page  [🔔][🎨] │   │
│  ├──────────────────────────────────────────────┤   │
│  │  <main> overflow-auto flex-1 pb-16 lg:pb-0   │   │
│  │    .page-head  (title + action buttons)      │   │
│  │    .page-content  (cards, tables, grids)     │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Shell JSX:**
```jsx
<div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
  <Sidebar />
  <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:ml-[220px]">
    <Topbar />
    <main className="flex-1 overflow-auto flex flex-col pb-16 lg:pb-0">
      <PageComponent />
    </main>
  </div>
</div>
```

---

## 5. Sidebar Component

- Fixed left, `w-[220px]`, white background, `border-r border-gray-200`
- Hidden on mobile (`display: none` below lg) — replaced by a bottom nav bar
- Sections are collapsible accordions with `ChevronDown` / `ChevronRight` toggle
- Collapsed state persisted in `localStorage` under key `sidebar-collapsed` (JSON object)
- Active section auto-expands when navigating to a page inside it
- Active item: `bg-[var(--accent-50)] text-[var(--accent)] border-r-2 border-[var(--accent)] font-semibold`
- Inactive item: `text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium`
- Section headers: `text-[10px] font-bold text-gray-400 uppercase tracking-widest` with chevron on the right
- User footer: avatar initials circle (accent bg) + name + role + logout icon button

```jsx
// Active nav item style
style={current === item.key ? {
  backgroundColor: 'var(--accent-50)',
  color: 'var(--accent)',
  borderRightColor: 'var(--accent)',
} : {}}
```

---

## 6. Topbar Component

- Height `h-11`, white background, `border-b border-gray-200`
- Desktop only (hidden on mobile — same `.sidebar-desktop` class)
- Left: hamburger menu button → breadcrumb `Home > Section > Current Page`
- Right: Bell icon + Theme picker (palette icon → popover with dark mode toggle + 5 accent colour swatches)

**Accent colour swatches** (5 colours, grid-cols-5):
| Name | Hex |
|---|---|
| Blue | `#2E6BE6` |
| Purple | `#7C3AED` |
| Green | `#059669` |
| Rose | `#E11D48` |
| Indigo | `#4F46E5` |

---

## 7. Page Pattern

Every page follows this exact structure:

```jsx
export default function MyPage({ toast }) {
  return (
    <>
      {/* Fixed header with title and actions */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Page Title</h1>
          <p className="text-xs text-gray-500 mt-0.5">Subtitle / count</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm gap-1.5">
            <Plus size={13} /> Add Item
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="page-content space-y-4">
        {/* Filter bar */}
        <div className="card">
          <div className="p-3 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="form-input pl-8" placeholder="Search..." />
            </div>
            <select className="form-select w-auto">...</select>
          </div>
        </div>

        {/* Data table */}
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Col</th></tr></thead>
              <tbody>
                {rows.map(r => <tr key={r.id}><td>{r.name}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
```

---

## 8. Modal Component

```jsx
// Props: open, title, children, onClose, onSave, saveLabel, hideSave, wide, danger, extraActions
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
  <div className={`bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] flex flex-col`}>
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18}/></button>
    </div>
    {/* Body — scrollable */}
    <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
    {/* Footer */}
    <div className="flex justify-between items-center gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
      <div>{extraActions}</div>
      <div className="flex gap-2">
        <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        {!hideSave && (
          <button onClick={onSave} className={danger ? 'btn btn-danger' : 'btn btn-primary'}>{saveLabel}</button>
        )}
      </div>
    </div>
  </div>
</div>
```

**Modal sub-components for forms:**
```jsx
// FormSection — titled group inside a modal
<div className="mb-5">
  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
    {title}
  </div>
  {children}
</div>

// FormGrid — responsive 2-column grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>

// Field — labelled form field wrapper
<div className={full ? 'md:col-span-2' : ''}>
  <label className="form-label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
  {children}
</div>
```

---

## 9. Badge Component

Pill-shaped status indicator. `px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center`

| Status | Classes |
|---|---|
| Active, Approved, Completed, Fulfilled, Present, Open, Hired | `bg-green-100 text-green-700` |
| Pending, Screening, Interview, On Leave | `bg-amber-100 text-amber-700` |
| Inactive, Left, Rejected, Absent, Closed, Draft | `bg-red-100 text-red-600` or `bg-gray-100 text-gray-500` |
| WFH | `bg-purple-100 text-purple-700` |
| Submitted, Half Day, Offered | `background: #EBF4FF; color: #1A6AB4` (brand blue, inline style) |

---

## 10. DatePicker Component

Custom calendar popover replacing all `<input type="date">`. Props: `value` (YYYY-MM-DD), `onChange(v)`, `placeholder`, `min`, `max`, `disabled`.

**Trigger:** `form-input` styled div with `CalendarDays` icon on left, formatted date text (`DD Mon YYYY`), `X` clear button on right.

**Popover:** `w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-3`, positioned below trigger (auto-flips upward if near screen bottom).

**Structure:**
- Header: `ChevronLeft` · `Month Year` · `ChevronRight`
- Day headers: Su Mo Tu We Th Fr Sa — `text-[11px] font-semibold text-gray-400`
- Day grid: `grid grid-cols-7 gap-px`
  - Selected day: `w-8 h-8 rounded-full text-white` with `backgroundColor: var(--accent)`
  - Today (not selected): `font-bold` with `color: var(--accent); border: 1.5px solid var(--accent)`
  - Disabled: `text-gray-300 cursor-not-allowed`
  - Normal hover: `hover:bg-gray-100 rounded-full`
- Footer: "Today" link (accent color) · "Clear" link (gray)
- Closes on outside click or Escape key

---

## 11. Confirm Modal Component

Small destructive-action dialog. `max-w-sm`, no scroll.

```jsx
<div className="fixed inset-0 z-[60] flex items-center justify-center">
  <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
  <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 border border-gray-200">
    <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
    <p className="text-sm text-gray-500 mb-5">{message}</p>
    <div className="flex justify-end gap-2">
      <button className="btn btn-secondary btn-sm">Cancel</button>
      <button className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`}>{confirmLabel}</button>
    </div>
  </div>
</div>
```

---

## 12. Toast Notifications

Fixed top-right stack. `top-4 right-4 z-[9999] flex flex-col gap-2`.

Each toast: `flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium shadow-md min-w-[260px] max-w-xs`

| Type | Classes |
|---|---|
| success | `bg-green-50 border-green-200 text-green-800` + `✓` icon |
| error | `bg-red-50 border-red-200 text-red-800` + `✕` icon |
| warning | `bg-amber-50 border-amber-200 text-amber-800` + `⚠` icon |
| info | `bg-blue-50 border-blue-200 text-blue-800` + `ℹ` icon |

```js
// useToast hook
function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = (msg, type = 'info', duration = 3500) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  };
  return { toasts, toast };
}
```

---

## 13. Stats / Summary Cards

Used at the top of list pages. `grid grid-cols-1 sm:grid-cols-3 gap-3` (or 4 cols for dashboards).

```jsx
<div className="card p-4 text-center">
  <div className="text-2xl font-bold text-green-600">{count}</div>
  <div className="text-xs text-gray-500 mt-0.5">Label</div>
</div>
```

For dashboard-style metric cards:
```jsx
<div className="card p-4">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-50)' }}>
      <Icon size={18} style={{ color: 'var(--accent)' }} />
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  </div>
</div>
```

---

## 14. Filter Tabs (status tabs with badge counts)

```jsx
{['All', 'Pending', 'Approved', 'Rejected'].map(t => (
  <button
    key={t}
    onClick={() => setTab(t)}
    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
      tab === t ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
    }`}
    style={tab === t ? { backgroundColor: 'var(--accent)' } : {}}
  >
    {t}
    {t === 'Pending' && pendingCount > 0 && (
      <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
        tab === 'Pending' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
      }`}>{pendingCount}</span>
    )}
  </button>
))}
```

---

## 15. Pagination Controls

```jsx
{totalPages > 1 && (
  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
    <span className="text-xs text-gray-500">
      Showing {((page-1)*pageSize)+1}–{Math.min(page*pageSize, total)} of {total}
    </span>
    <div className="flex items-center gap-1">
      <button onClick={() => setPage(p => p-1)} disabled={page===1} className="btn btn-secondary btn-xs disabled:opacity-40">← Prev</button>
      {/* Page number buttons — current page gets accent bg */}
      <button onClick={() => setPage(p => p+1)} disabled={page===totalPages} className="btn btn-secondary btn-xs disabled:opacity-40">Next →</button>
    </div>
  </div>
)}
```

---

## 16. Mobile Bottom Navigation

On screens below `lg` (1024px), the sidebar is hidden and replaced by a fixed bottom bar.

```jsx
// Fixed bottom, white bg, border-top, safe area padding
<nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex lg:hidden">
  {primaryItems.map(item => (
    <button key={item.key} onClick={() => onNavigate(item.key)}
      className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium"
      style={current === item.key ? { color: 'var(--accent)' } : { color: '#A0AABF' }}>
      <item.icon size={20} />
      <span>{item.label}</span>
    </button>
  ))}
  {/* "More" button opens a slide-up drawer with full nav */}
</nav>
```

---

## 17. Empty States

Used when a table/list has no data:

```jsx
<div className="empty-state">
  <FileText size={40} className="mb-3 text-gray-300" />
  <p className="text-sm font-medium text-gray-600">No items found</p>
  <p className="text-xs text-gray-400 mt-1">Descriptive hint about how to add items</p>
</div>
```

---

## 18. Responsive Sidebar Visibility

```css
/* Desktop only */
.sidebar-desktop { display: flex; }
@media screen and (max-width: 1023px) { .sidebar-desktop { display: none !important; } }

/* Mobile only */
.mobile-only { display: block; }
@media screen and (min-width: 1024px) { .mobile-only { display: none !important; } }
```

Main content shifts right on desktop: `lg:ml-[220px]`

---

## 19. Key Interaction Patterns

| Pattern | Implementation |
|---|---|
| Add button opens modal | `setModal(true)` / `setModal({ mode: 'add' })` |
| Edit button loads record then opens modal | `async openEdit(id)` → fetch → `setForm(data)` → `setModal({ mode: 'edit', id })` |
| Delete with confirmation | Native `confirm()` dialog, then `api('DELETE', ...)` |
| Save in modal | `async save()` → validate → `api('POST'/'PUT', ...)` → `toast(...)` → `setModal(false)` → `load()` |
| Search/filter | Controlled inputs → call `load(newParams)` immediately on change, reset page to 1 |
| Loading state | `setLoading(true)` before fetch, `setLoading(false)` in `finally` — show loading row in table |
| Error handling | All `catch(e)` → `toast(e.message, 'error')` |

---

## 20. API Utility

```js
// src/api.js
const BASE = '';
export async function api(method, path, body) {
  const token = localStorage.getItem('artech_hrms_token');
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}
```

---

## 21. Tailwind Config

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
}
```

---

## 22. Complete Component Checklist

When building a new app with this UI, create these components:

- [ ] `Sidebar.jsx` — collapsible sections, active highlight, user footer
- [ ] `Topbar.jsx` — breadcrumb, bell, theme picker popover
- [ ] `Modal.jsx` + `FormSection` + `FormGrid` + `Field` sub-components
- [ ] `ConfirmModal.jsx` — destructive action dialog
- [ ] `DatePicker.jsx` — custom calendar popover
- [ ] `Badge.jsx` — status pill with colour map
- [ ] `Toast.jsx` + `useToast.js` hook — notification stack
- [ ] `MobileBottomNav.jsx` — bottom bar + slide-up drawer for mobile
- [ ] `useTheme.js` hook — accent colour + dark mode with localStorage
- [ ] `api.js` — fetch wrapper with JWT auth header

---

## 23. Vite + Package Setup

```json
// package.json dependencies
{
  "react": "^18",
  "react-dom": "^18",
  "lucide-react": "latest",
  "tailwindcss": "^3",
  "autoprefixer": "^10",
  "postcss": "^8",
  "@vitejs/plugin-react": "^4",
  "vite": "^5"
}
```

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: { '/api': 'http://localhost:8000' },
  },
})
```

---

*This spec is self-contained. Give it to Claude with a description of your app's pages and data model and it will produce a pixel-identical UI.*
