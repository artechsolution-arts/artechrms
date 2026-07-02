# AR Peopliz HRMS — Complete Mobile View UI Specification

> Stack: **React + Tailwind CSS + CSS Custom Properties**
> Font: **Inter** (Google Fonts)
> Breakpoint: mobile = `< 1024px` (`lg`)

---

## 1. Design Tokens

### 1.1 Color Palette

```css
:root {
  /* Brand */
  --accent:       #1A6AB4;   /* ARTech Blue — primary CTAs, active states */
  --accent-dark:  #0D1F4E;   /* Deep Navy — headings, dark backgrounds */
  --accent-50:    #EBF4FF;   /* Blue tint — hover backgrounds */
  --teal:         #3DC7B3;   /* Innovation Teal — accents, icons */
  --success:      #2DB37A;   /* Growth Green — success badges, positive data */
  --cloud:        #F4F8FF;   /* Cloud White — page & card backgrounds */
  --mist:         #E8EDF5;   /* Mist Gray — borders, dividers, input bg */
  --steel:        #A0AABF;   /* Steel Gray — secondary text, captions */
  --navy:         #0D1F4E;   /* Deep Navy — body text */

  /* Status */
  --status-success: #2DB37A;
  --status-warning: #F59E0B;
  --status-danger:  #EF4444;
  --status-info:    #3B82F6;
}

/* Dark mode */
html.dark {
  --cloud:      #0f172a;
  --mist:       #1f2937;
  --steel:      #64748b;
  --navy:       #e2e8f0;
  --accent-50:  rgba(26, 106, 180, 0.15);
}
```

### 1.2 Accent Themes (user-selectable)

| Theme | `--accent` | `--accent-dark` | `--accent-50` |
|-------|-----------|-----------------|---------------|
| Blue (default) | `#1A6AB4` | `#0D1F4E` | `#EBF4FF` |
| Teal | `#3DC7B3` | `#0D1F4E` | `#EDFAF7` |
| Purple | `#7C3AED` | `#4C1D95` | `#f5f3ff` |
| Green | `#2DB37A` | `#065F46` | `#ecfdf5` |
| Rose | `#E11D48` | `#9F1239` | `#fff1f2` |
| Indigo | `#4F46E5` | `#312E81` | `#eef2ff` |

Apply via: `<html data-accent="teal">`

### 1.3 Typography Scale (mobile)

| Role | Size | Weight | Class |
|------|------|--------|-------|
| Page title | 18px | 700 | `text-lg font-bold` |
| Section heading | 14px | 600 | `text-sm font-semibold` |
| Body / label | 13px | 400 | `text-[13px]` |
| Caption / meta | 11px | 400–500 | `text-[11px]` |
| Nav label | 10px | 500 | `text-[10px] font-medium` |
| Stat value | 28–32px | 800 | `text-3xl font-extrabold` |

Font stack: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`

### 1.4 Spacing & Radius

```
Page padding:    px-4 (16px)
Card padding:    p-4 (16px)
Card radius:     rounded-2xl (16px)
Button radius:   rounded-xl (12px)
Input radius:    rounded-xl (12px)
Badge radius:    rounded-full
Gap between cards: gap-3 (12px)
Section gap:     gap-4 (16px)
```

---

## 2. Global Layout Shell

### 2.1 Structure (mobile)

```
┌─────────────────────────────────────┐
│           TOPBAR  (56px h)          │  ← fixed, top-0, z-30
├─────────────────────────────────────┤
│                                     │
│           PAGE CONTENT              │  ← pt-14 pb-24 (room for topbar + bottom nav)
│                                     │
│                                     │
├─────────────────────────────────────┤
│        BOTTOM NAV BAR  (64px h)     │  ← fixed, bottom-0, z-40
└─────────────────────────────────────┘
```

### 2.2 Topbar (mobile)

```
height: 56px  |  z-index: 30  |  fixed top-0 left-0 right-0
```

**CSS class:** `.glass-topbar`

```css
.glass-topbar {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}
html.dark .glass-topbar {
  background: #0f172a;
  border-bottom: 1px solid #1f2937;
}
/* With background image active */
html.has-bg-image .glass-topbar {
  background: rgba(255,255,255,0.38) !important;
  backdrop-filter: blur(34px) saturate(1.7);
  border-bottom: 1px solid rgba(255,255,255,0.35) !important;
}
```

**Layout (JSX pattern):**

```jsx
<header className="fixed top-0 left-0 right-0 z-30 glass-topbar h-14 flex items-center px-4 gap-3">
  {/* Logo / App name */}
  <div className="flex items-center gap-2 flex-1">
    <img src="/logo.png" alt="Logo" className="w-7 h-7" />
    <span className="text-sm font-bold text-[--navy]">AR Peopliz</span>
  </div>

  {/* User avatar */}
  <button className="w-8 h-8 rounded-full bg-[--accent] flex items-center justify-center text-white text-xs font-bold">
    JD
  </button>
</header>
```

### 2.3 Page Content Wrapper

```jsx
<main className="pt-14 pb-24 min-h-screen px-4 py-4">
  {/* page-specific content */}
</main>
```

### 2.4 Show/hide: desktop vs mobile

```css
/* Utility classes */
.mobile-only  { display: block; }
.desktop-only { display: none; }

@media (min-width: 1024px) {
  .mobile-only  { display: none !important; }
  .desktop-only { display: block; }
}
```

---

## 3. Bottom Navigation Bar

### 3.1 Structure

```
┌──────────────────────────────────────────────┐
│  🏠 Home  |  🕐 Attend  |  [●]  |  🔔  | ⚙  │
│  Home       Attendance   More    Alerts  Settings
└──────────────────────────────────────────────┘
```

- Fixed, bottom-0, z-40
- Height: ~64px + safe-area-inset-bottom
- Center "More" button is elevated with a colored circle (accent)

**CSS class:** `.glass-mobile-nav`

```css
.glass-mobile-nav {
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
}
html.dark .glass-mobile-nav {
  background: #111827;
  border-top: 1px solid #1f2937;
}
html.has-bg-image .glass-mobile-nav {
  background: rgba(255,255,255,0.42) !important;
  backdrop-filter: blur(34px) saturate(1.7) !important;
  border-top: 1px solid rgba(255,255,255,0.35) !important;
}
```

**JSX pattern:**

```jsx
<nav className="fixed bottom-0 left-0 right-0 z-40 mobile-only glass-mobile-nav">
  <div className="flex items-end justify-around px-1 pt-2 pb-3">

    {/* Nav item */}
    <button className="flex flex-col items-center gap-1 px-2 py-1">
      <LayoutDashboard size={20} style={{ color: isActive ? 'var(--accent)' : '#9CA3AF' }} />
      <span className="text-[10px] font-medium" style={{ color: isActive ? 'var(--accent)' : '#9CA3AF' }}>
        Home
      </span>
    </button>

    {/* Centre elevated "More" button */}
    <div className="flex flex-col items-center gap-1 -mt-5">
      <button
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        style={{ backgroundColor: 'var(--accent)' }}>
        <Menu size={20} className="text-white" />
      </button>
      <span className="text-[10px] font-medium text-gray-500">More</span>
    </div>

    {/* Bell with badge */}
    <button className="flex flex-col items-center gap-1 px-2 py-1 relative">
      <div className="relative">
        <Bell size={20} className="text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium text-gray-400">Alerts</span>
    </button>

  </div>
</nav>
```

---

## 4. Slide-Up Panels (Bottom Sheets)

Used for: All Sections drawer, Notifications, Settings, Modals

### 4.1 Pattern

```
┌─────────────────────────────────────┐  ← backdrop (bg-black/40)
│                                     │
│                                     │
├──── drag handle (optional) ─────────┤
│  Panel header  (title + X close)    │  ← rounded-t-2xl
│─────────────────────────────────────│
│                                     │
│  Scrollable content  (max-h-[65vh]) │
│                                     │
│                                     │
│  [safe area padding]                │
└─────────────────────────────────────┘
```

**CSS class:** `.glass-mobile-panel`

```css
.glass-mobile-panel {
  background: #ffffff;
}
html.dark .glass-mobile-panel {
  background: #111827;
}
html.has-bg-image .glass-mobile-panel {
  background: rgba(255,255,255,0.80) !important;
  backdrop-filter: blur(40px) saturate(1.8) !important;
}
html.has-bg-image.bg-is-dark .glass-mobile-panel {
  background: rgba(12,17,35,0.85) !important;
}
```

**JSX pattern:**

```jsx
{/* Backdrop */}
{isOpen && (
  <div className="fixed inset-0 bg-black/40 z-40 mobile-only"
    onClick={() => setIsOpen(false)} />
)}

{/* Panel */}
<div className={`fixed bottom-0 left-0 right-0 z-50 mobile-only glass-mobile-panel
  rounded-t-2xl shadow-2xl transition-transform duration-300
  ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>

  {/* Header */}
  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Panel Title</span>
    <button onClick={() => setIsOpen(false)}
      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
      <X size={16} />
    </button>
  </div>

  {/* Scrollable body */}
  <div className="overflow-y-auto max-h-[65vh] py-2 px-2">
    {/* content */}
  </div>

  {/* Safe area padding */}
  <div className="pb-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }} />
</div>
```

### 4.2 All-Sections Drawer

Sectioned list of all nav items, grouped by section label.

```jsx
<div className="overflow-y-auto max-h-[65vh] py-2 px-2">
  {allItems.map((item, i) =>
    item.type === 'sep' ? (
      <div key={i} className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {item.label}
      </div>
    ) : (
      <button key={item.key}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
          transition-all text-left mb-0.5
          ${current === item.key
            ? 'text-white'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
        style={current === item.key ? { backgroundColor: 'var(--accent)' } : {}}
        onClick={() => navigate(item.key)}>
        <item.icon size={16} className="flex-shrink-0" />
        <span>{item.label}</span>
        {current === item.key && (
          <span className="ml-auto text-xs opacity-60">Current</span>
        )}
      </button>
    )
  )}
</div>
```

### 4.3 Notifications Panel

```jsx
<div className="divide-y divide-gray-100 dark:divide-gray-800 py-1">
  {notifs.map(n => (
    <button key={n.id}
      className={`w-full px-4 py-3.5 flex items-start gap-3 text-left transition-colors
        ${n.is_read
          ? 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
          : 'bg-blue-50/60 dark:bg-blue-900/10 hover:bg-blue-50'}`}>

      {/* Unread dot */}
      <div className="flex-shrink-0 mt-1.5">
        {!n.is_read
          ? <span className="w-2 h-2 rounded-full block bg-blue-500" />
          : <span className="w-2 h-2 block" />}
      </div>

      {/* Icon */}
      <span className="text-xl flex-shrink-0 mt-0.5">{n.icon || '🔔'}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight mb-0.5 ${n.is_read ? 'font-normal text-gray-600' : 'font-semibold text-gray-800'}`}>
          {n.title}
        </p>
        <p className="text-xs text-gray-500 leading-snug line-clamp-2">{n.message}</p>
        <p className="text-[11px] text-gray-400 mt-1">{formatDate(n.created_at)}</p>
      </div>

      {n.action && <ChevronRight size={15} className="flex-shrink-0 text-gray-300 mt-1" />}
    </button>
  ))}
</div>
```

---

## 5. Cards & Stat Cards

### 5.1 Stat Card (colored gradient)

Used on dashboard — shows key metrics.

```jsx
function StatCard({ label, value, icon: Icon, gradient, sub, onClick }) {
  return (
    <div onClick={onClick}
      className="rounded-2xl p-5 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      style={{ background: gradient, boxShadow: '0 4px 20px rgba(13,31,78,0.12)' }}>

      {/* Decorative circles */}
      <div className="absolute -right-5 -top-5 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute right-2 -bottom-8 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />

      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
          <Icon size={15} color="rgba(255,255,255,0.9)" />
        </div>
      </div>

      <div className="text-3xl font-extrabold text-white leading-none mb-1.5">{value ?? '—'}</div>

      {sub && (
        <div className="flex items-center gap-1">
          <ArrowUpRight size={11} color="rgba(255,255,255,0.5)" />
          <span className="text-[11px] text-white/50 font-medium">{sub}</span>
        </div>
      )}
    </div>
  );
}
```

**Dashboard gradient presets:**

```js
const STAT_GRADIENTS = {
  blue:   'linear-gradient(135deg, #1A6AB4 0%, #2280D8 100%)',
  teal:   'linear-gradient(135deg, #0891b2 0%, #3DC7B3 100%)',
  green:  'linear-gradient(135deg, #059669 0%, #2DB37A 100%)',
  amber:  'linear-gradient(135deg, #d97706 0%, #F59E0B 100%)',
  purple: 'linear-gradient(135deg, #7C3AED 0%, #a855f7 100%)',
  rose:   'linear-gradient(135deg, #E11D48 0%, #f43f5e 100%)',
};
```

**Mobile grid:** 2-column on mobile

```jsx
<div className="grid grid-cols-2 gap-3">
  <StatCard ... />
  <StatCard ... />
</div>
```

### 5.2 Content Card (white/glass)

```jsx
function SectionCard({ title, subtitle, action, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[--mist] dark:border-gray-800
      overflow-hidden shadow-[0_4px_18px_rgba(13,31,78,0.10)]">

      {/* Card header */}
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-semibold text-[--navy] dark:text-gray-100">{title}</h3>
            {subtitle && <p className="text-[11px] text-[--steel] mt-0.5">{subtitle}</p>}
          </div>
          {action && (
            <button className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
              {action.label}
            </button>
          )}
        </div>
      )}

      {/* Card body */}
      <div className="p-4">{children}</div>
    </div>
  );
}
```

---

## 6. Page Layouts — Screen by Screen

### 6.1 Login Page

```
┌─────────────────────────────┐
│  [centered logo]            │
│  AR Peopliz                 │
│  Powered by AR Tech         │
│                             │
│  ┌─────────────────────┐    │
│  │ Email               │    │  ← glass card
│  ├─────────────────────┤    │
│  │ Password          👁│    │
│  └─────────────────────┘    │
│                             │
│  [Sign In ──────────────]   │  ← full-width button
│                             │
│  Forgot password?           │
└─────────────────────────────┘
```

```jsx
<div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[--cloud] dark:bg-gray-950">
  {/* Logo */}
  <div className="mb-8 text-center">
    <img src="/logo.png" className="w-16 h-16 mx-auto mb-3" />
    <h1 className="text-xl font-bold text-[--navy] dark:text-white">AR Peopliz</h1>
    <p className="text-xs text-[--steel] mt-1">Powered by AR Tech Solutions</p>
  </div>

  {/* Form card */}
  <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 space-y-4">
    <input type="email" placeholder="Email address"
      className="w-full px-4 py-3 rounded-xl bg-[--mist] dark:bg-gray-800 border border-transparent
        focus:border-[--accent] focus:outline-none text-sm text-[--navy] dark:text-white" />
    <input type="password" placeholder="Password"
      className="w-full px-4 py-3 rounded-xl bg-[--mist] dark:bg-gray-800 border border-transparent
        focus:border-[--accent] focus:outline-none text-sm text-[--navy] dark:text-white" />
    <button className="w-full py-3 rounded-xl text-white text-sm font-semibold active:scale-[0.98] transition"
      style={{ background: 'var(--accent)' }}>
      Sign In
    </button>
  </div>
</div>
```

### 6.2 Dashboard (HR)

**Mobile layout:**

```
┌─────────────────────────────┐
│  TOPBAR                     │
├─────────────────────────────┤
│  👋 Good morning, John      │  ← greeting header
│  Tuesday, 30 Jun 2026       │
├─────────────────────────────┤
│  [Total Emp] [On Leave]     │  ← 2-col stat grid
│  [Pending]   [Open Pos]     │
├─────────────────────────────┤
│  📋 Recent Hires            │  ← section card
│  ┌─────────────────────┐    │
│  │ avatar  Name  Dept  │    │
│  │ avatar  Name  Dept  │    │
│  └─────────────────────┘    │
├─────────────────────────────┤
│  📊 Attendance Chart        │  ← bar chart card
├─────────────────────────────┤
│  🗓 Pending Leave Requests  │
│  ┌─────────────────────┐    │
│  │ Name | Days | Status│    │
│  └─────────────────────┘    │
├─────────────────────────────┤
│  BOTTOM NAV                 │
└─────────────────────────────┘
```

```jsx
// Main content
<div className="pt-14 pb-24 px-4 space-y-4">
  {/* Greeting */}
  <div className="pt-2">
    <h1 className="text-lg font-bold text-[--navy] dark:text-white">
      👋 Good morning, {firstName}
    </h1>
    <p className="text-[11px] text-[--steel] mt-0.5">{formattedDate}</p>
  </div>

  {/* Stat grid */}
  <div className="grid grid-cols-2 gap-3">
    <StatCard label="Total Employees" value={stats.total} icon={Users}
      gradient="linear-gradient(135deg,#1A6AB4,#2280D8)" />
    <StatCard label="On Leave Today" value={stats.onLeave} icon={CalendarDays}
      gradient="linear-gradient(135deg,#0891b2,#3DC7B3)" />
    <StatCard label="Pending Approvals" value={stats.pending} icon={Clock}
      gradient="linear-gradient(135deg,#d97706,#F59E0B)" />
    <StatCard label="Open Positions" value={stats.openings} icon={Briefcase}
      gradient="linear-gradient(135deg,#7C3AED,#a855f7)" />
  </div>

  {/* Recent Hires */}
  <SectionCard title="Recent Hires" action={{ label: 'See all', onClick: () => navigate('employees') }}>
    <div className="space-y-3">
      {recentHires.map(emp => (
        <div key={emp.id} className="flex items-center gap-3">
          <EmpAvatar name={emp.name} photo={emp.photo} size={32} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[--navy] dark:text-gray-100 truncate">{emp.name}</p>
            <p className="text-[11px] text-[--steel] truncate">{emp.designation}</p>
          </div>
          <span className="text-[11px] text-[--steel]">{emp.join_date}</span>
        </div>
      ))}
    </div>
  </SectionCard>

  {/* Charts — full width on mobile */}
  <SectionCard title="Attendance (This Month)">
    <Bar data={chartData} options={chartOptions} />
  </SectionCard>
</div>
```

### 6.3 Employee Dashboard (Self Service)

```
┌─────────────────────────────┐
│  TOPBAR                     │
├─────────────────────────────┤
│  [Avatar] John Doe          │  ← profile hero card
│           Sr. Developer     │
│           Dept: Engineering │
├─────────────────────────────┤
│  [Balance] [Attendance]     │  ← 2-col info cards
│  [Salary]  [Documents]      │
├─────────────────────────────┤
│  Quick Actions              │
│  [Apply Leave] [Attendance] │  ← action buttons grid
│  [Raise Issue] [Documents]  │
├─────────────────────────────┤
│  📢 Announcements (2)       │
├─────────────────────────────┤
│  BOTTOM NAV                 │
└─────────────────────────────┘
```

```jsx
{/* Profile hero */}
<div className="bg-white dark:bg-gray-900 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-[--mist]">
  <EmpAvatar name={user.name} photo={user.photo} size={56} />
  <div>
    <h2 className="text-base font-bold text-[--navy] dark:text-white">{user.name}</h2>
    <p className="text-xs text-[--steel]">{user.designation}</p>
    <p className="text-xs text-[--steel]">{user.department}</p>
  </div>
</div>

{/* Quick action grid */}
<div className="grid grid-cols-2 gap-3">
  {[
    { label: 'Apply Leave', icon: CalendarDays, key: 'my-leaves' },
    { label: 'Attendance', icon: Clock, key: 'my-attendance' },
    { label: 'Salary Slips', icon: DollarSign, key: 'my-salary' },
    { label: 'Documents', icon: FileText, key: 'my-documents' },
  ].map(a => (
    <button key={a.key} onClick={() => navigate(a.key)}
      className="bg-white dark:bg-gray-900 rounded-2xl p-4 flex items-center gap-3
        border border-[--mist] dark:border-gray-800 active:scale-[0.97] transition-transform shadow-sm">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--accent-50)' }}>
        <a.icon size={18} style={{ color: 'var(--accent)' }} />
      </div>
      <span className="text-sm font-medium text-[--navy] dark:text-gray-200">{a.label}</span>
    </button>
  ))}
</div>
```

### 6.4 Employees List Page

Desktop shows a data table. **Mobile converts to cards.**

```
┌─────────────────────────────┐
│  TOPBAR                     │
├─────────────────────────────┤
│  [🔍 Search employees...]   │  ← search input
│  [Filter ▼]  [+ Add]        │
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │ [Av]  John Doe       │    │  ← employee card
│  │       Sr. Developer  │    │
│  │       Engineering    │    │
│  │  [Active]  [Email]   │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ [Av]  Jane Smith     │    │
│  │  ...                 │    │
│  └─────────────────────┘    │
├─────────────────────────────┤
│  BOTTOM NAV                 │
└─────────────────────────────┘
```

```jsx
{/* Search bar */}
<div className="relative mb-3">
  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--steel]" />
  <input placeholder="Search employees..."
    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-900
      border border-[--mist] dark:border-gray-800 text-sm focus:outline-none focus:border-[--accent]" />
</div>

{/* Employee cards */}
<div className="space-y-2">
  {employees.map(emp => (
    <div key={emp.id}
      className="bg-white dark:bg-gray-900 rounded-2xl p-4
        border border-[--mist] dark:border-gray-800 shadow-sm active:bg-gray-50 transition-colors"
      onClick={() => navigate('employee-detail', emp.id)}>

      <div className="flex items-center gap-3 mb-3">
        <EmpAvatar name={emp.name} photo={emp.photo} size={44} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[--navy] dark:text-white truncate">{emp.name}</p>
          <p className="text-[11px] text-[--steel] truncate">{emp.designation}</p>
          <p className="text-[11px] text-[--steel] truncate">{emp.department}</p>
        </div>
        <StatusBadge status={emp.status} />
      </div>

      <div className="flex items-center gap-2">
        <a href={`mailto:${emp.email}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg
            bg-[--accent-50] text-[--accent] text-xs font-medium">
          <Mail size={13} /> Email
        </a>
        <a href={`tel:${emp.phone}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg
            bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium">
          <Phone size={13} /> Call
        </a>
      </div>
    </div>
  ))}
</div>
```

### 6.5 Leave Applications Page (HR)

```
┌─────────────────────────────┐
│  TOPBAR                     │
├─────────────────────────────┤
│  Leave Applications         │  ← page title
│  [Pending] [Approved] [All] │  ← tab pills
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │ [Av] John Doe        │    │  ← leave card
│  │      Annual Leave    │    │
│  │      3 days · Jun 5–7│    │
│  │  [Pending]           │    │
│  │  [✓ Approve] [✗ Deny]│    │
│  └─────────────────────┘    │
├─────────────────────────────┤
│  BOTTOM NAV                 │
└─────────────────────────────┘
```

```jsx
{/* Filter tabs */}
<div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
  {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
    <button key={f}
      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors
        ${filter === f
          ? 'text-white'
          : 'bg-[--mist] dark:bg-gray-800 text-[--steel] dark:text-gray-400'}`}
      style={filter === f ? { backgroundColor: 'var(--accent)' } : {}}
      onClick={() => setFilter(f)}>
      {f}
    </button>
  ))}
</div>

{/* Leave cards */}
{leaves.map(leave => (
  <div key={leave.id} className="bg-white dark:bg-gray-900 rounded-2xl p-4
    border border-[--mist] dark:border-gray-800 shadow-sm space-y-3 mb-2">
    <div className="flex items-center gap-3">
      <EmpAvatar name={leave.employee_name} size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[--navy] dark:text-white">{leave.employee_name}</p>
        <p className="text-xs text-[--steel]">{leave.leave_type} · {leave.days} day{leave.days !== 1 ? 's' : ''}</p>
        <p className="text-[11px] text-[--steel]">{leave.from_date} – {leave.to_date}</p>
      </div>
      <StatusBadge status={leave.status} />
    </div>

    {leave.reason && (
      <p className="text-xs text-[--steel] bg-[--cloud] dark:bg-gray-800 rounded-lg px-3 py-2">
        {leave.reason}
      </p>
    )}

    {leave.status === 'pending' && (
      <div className="flex gap-2">
        <button className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-green-500 active:bg-green-600">
          Approve
        </button>
        <button className="flex-1 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20">
          Deny
        </button>
      </div>
    )}
  </div>
))}
```

### 6.6 Attendance Page

```
┌─────────────────────────────┐
│  TOPBAR                     │
├─────────────────────────────┤
│  [← Jun 2026 →]             │  ← month navigation
├─────────────────────────────┤
│  Su Mo Tu We Th Fr Sa       │  ← calendar grid
│  ·  ·  ✓  ✓  ✓  ✗  ·       │    (colored dots)
│  ·  ✓  ✓  ✓  ✓  ✓  ·       │
├─────────────────────────────┤
│  [Pres: 18] [Abs: 2] [L: 3] │  ← mini summary row
├─────────────────────────────┤
│  📅 Attendance Log          │
│  ┌─────────────────────┐    │
│  │ 30 Jun  09:02  18:10│    │  ← log rows
│  │ 29 Jun  09:15  17:55│    │
│  └─────────────────────┘    │
├─────────────────────────────┤
│  BOTTOM NAV                 │
└─────────────────────────────┘
```

### 6.7 Payroll Entry Page

Mobile replaces the full table with a vertical list of salary cards.

```
┌─────────────────────────────┐
│  TOPBAR                     │
├─────────────────────────────┤
│  [🔍 Search] [Month: Jun ▼] │
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │ [Av] John Doe        │    │
│  │      ₹ 85,000 gross  │    │
│  │      ₹ 72,400 net    │    │
│  │  [Pending]  [Process]│    │
│  └─────────────────────┘    │
├─────────────────────────────┤
│  BOTTOM NAV                 │
└─────────────────────────────┘
```

### 6.8 My Profile Page (Employee)

```
┌─────────────────────────────┐
│  TOPBAR                     │
├─────────────────────────────┤
│  [     Cover area      ]    │  ← colored gradient banner
│  [   Employee Avatar   ]    │  ← avatar overlapping banner
│   John Doe                  │
│   Sr. Software Developer    │
│   Engineering · Full-Time   │
├─────────────────────────────┤
│  [Personal][Work][Documents]│  ← tab row
├─────────────────────────────┤
│  Personal Info              │
│  ┌───────────────────────┐  │
│  │ Email     john@co.com │  │  ← info rows
│  │ Phone     +91 98765…  │  │
│  │ DOB       15 Jan 1992 │  │
│  │ Address   123 Main St │  │
│  └───────────────────────┘  │
│                             │
│  [✎ Request Edit]           │  ← action button
├─────────────────────────────┤
│  BOTTOM NAV                 │
└─────────────────────────────┘
```

```jsx
{/* Profile header */}
<div className="relative mb-4">
  {/* Banner */}
  <div className="h-28 rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--accent), var(--teal))' }} />
  {/* Avatar */}
  <div className="absolute -bottom-6 left-4">
    <EmpAvatar name={user.name} photo={user.photo} size={64}
      className="ring-4 ring-white dark:ring-gray-950" />
  </div>
</div>

{/* Name / role */}
<div className="mt-8 px-1 mb-4">
  <h2 className="text-lg font-bold text-[--navy] dark:text-white">{user.name}</h2>
  <p className="text-sm text-[--steel]">{user.designation}</p>
  <p className="text-xs text-[--steel]">{user.department} · {user.employment_type}</p>
</div>

{/* Info section */}
<SectionCard title="Personal Information">
  <div className="space-y-3">
    {[
      { label: 'Email', value: user.email, icon: Mail },
      { label: 'Phone', value: user.phone, icon: Phone },
      { label: 'Date of Birth', value: user.dob, icon: CalendarDays },
    ].map(row => (
      <div key={row.label} className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-50)' }}>
          <row.icon size={15} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <p className="text-[11px] text-[--steel]">{row.label}</p>
          <p className="text-sm font-medium text-[--navy] dark:text-gray-100">{row.value || '—'}</p>
        </div>
      </div>
    ))}
  </div>
</SectionCard>
```

---

## 7. Form Components (Mobile)

### 7.1 Text Input

```jsx
<div className="space-y-1.5">
  <label className="text-xs font-semibold text-[--navy] dark:text-gray-300 uppercase tracking-wide">
    {label}
  </label>
  <input
    className="w-full px-4 py-3 rounded-xl bg-[--mist] dark:bg-gray-800
      border border-transparent focus:border-[--accent] focus:ring-2 focus:ring-[--accent]/20
      text-sm text-[--navy] dark:text-white focus:outline-none transition-all"
    placeholder={placeholder}
  />
</div>
```

### 7.2 Select

```jsx
<div className="space-y-1.5">
  <label className="text-xs font-semibold text-[--navy] dark:text-gray-300 uppercase tracking-wide">
    {label}
  </label>
  <div className="relative">
    <select className="w-full px-4 py-3 rounded-xl bg-[--mist] dark:bg-gray-800
      border border-transparent focus:border-[--accent] focus:outline-none
      text-sm text-[--navy] dark:text-white appearance-none pr-10">
      <option value="">Select…</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--steel] pointer-events-none" />
  </div>
</div>
```

### 7.3 Primary Button

```jsx
<button
  className="w-full py-3.5 rounded-xl text-sm font-semibold text-white
    active:scale-[0.98] transition-transform disabled:opacity-50"
  style={{ background: 'var(--accent)' }}>
  {loading ? <Spinner /> : label}
</button>
```

### 7.4 Secondary / Ghost Button

```jsx
<button
  className="w-full py-3.5 rounded-xl text-sm font-semibold
    border border-[--mist] dark:border-gray-700
    text-[--navy] dark:text-gray-200
    bg-white dark:bg-gray-900
    active:bg-gray-50 transition-colors">
  {label}
</button>
```

### 7.5 Danger Button

```jsx
<button
  className="w-full py-3.5 rounded-xl text-sm font-semibold text-white
    bg-red-500 active:bg-red-600 transition-colors">
  {label}
</button>
```

---

## 8. Status Badges

```jsx
const BADGE_STYLES = {
  active:    { bg: '#dcfce7', text: '#15803d' },
  inactive:  { bg: '#f1f5f9', text: '#64748b' },
  pending:   { bg: '#fef3c7', text: '#b45309' },
  approved:  { bg: '#dcfce7', text: '#15803d' },
  rejected:  { bg: '#fee2e2', text: '#b91c1c' },
  cancelled: { bg: '#f1f5f9', text: '#64748b' },
  present:   { bg: '#dcfce7', text: '#15803d' },
  absent:    { bg: '#fee2e2', text: '#b91c1c' },
  leave:     { bg: '#dbeafe', text: '#1d4ed8' },
  wfh:       { bg: '#f3e8ff', text: '#7e22ce' },
};

function StatusBadge({ status }) {
  const s = BADGE_STYLES[status?.toLowerCase()] || BADGE_STYLES.inactive;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
      style={{ backgroundColor: s.bg, color: s.text }}>
      {status}
    </span>
  );
}
```

Dark mode badge adjustment:
```css
html.dark .status-badge { filter: brightness(0.85) saturate(0.9); }
```

---

## 9. Navigation Structures per Role

### 9.1 HR / Admin

**Bottom Nav:** Home | Attendance | [More] | Alerts | Settings

**More drawer sections:**
```
── HR ──────────────────
  Employees
  Departments
  Designations
  Leave Applications
  Team Calendar
  Leave Types
  Leave Balances
  Attendance
  Holidays
  Announcements
  Asset Management
  Edit Requests
  Resignations
  Reports

── Payroll ─────────────
  Salary Slips
  Payroll Entry
  Payroll Rules

── Recruitment ─────────
  Onboarding / Offboarding
  Job Openings
  Applicants

── Appraisals ──────────
  Appraisals

── Documents ───────────
  Document Requests
  Status Sheets
  Company Documents
```

### 9.2 Employee (Self Service)

**Bottom Nav:** Home | Attendance | [More] | Alerts | Settings

**More drawer sections:**
```
── Self Service ────────
  My Dashboard
  Start Journey
  My Profile
  My Leaves
  My Attendance
  My Salary Slips
  My Appraisals
  My Assets
  My Documents
  Status Sheet
  Team Calendar
  Edit Requests
  Resignation
```

### 9.3 CEO

**Bottom Nav:** Dashboard | [More] | Alerts | Settings

**More drawer sections:**
```
── CEO ─────────────────
  Dashboard
  Compensation Planner
```

### 9.4 Super Admin

**Bottom Nav:** Overview | [More] | Alerts | Settings

**More drawer sections:**
```
── Admin ───────────────
  Overview
  User Accounts
  Feature Permissions
  Activity Log
```

---

## 10. Toast Notifications (Mobile)

Teams-style: enters from bottom-right, exits by sliding right.

```
Width: 340px (or full-width-minus-32px on narrow screens)
Position: fixed, bottom-4, right-4 (or bottom-20 above bottom nav)
z-index: 9999
```

```jsx
// Animation states
const transform = {
  enter:  'translateY(28px) scale(0.95)',
  show:   'translateY(0) scale(1)',
  leave:  'translateX(115%)',
};

<div style={{ transform: transform[phase], opacity: phase === 'show' ? 1 : 0,
  transition: phase === 'leave'
    ? 'transform 0.32s cubic-bezier(0.4,0,1,1), opacity 0.22s ease'
    : 'transform 0.44s cubic-bezier(0.22,1.3,0.36,1), opacity 0.3s ease' }}
  className="fixed bottom-20 right-4 w-[calc(100vw-32px)] max-w-[340px] z-[9999]
    bg-white/96 dark:bg-gray-900/96 backdrop-blur-2xl
    border border-gray-200/70 dark:border-gray-700/60
    shadow-2xl rounded-2xl overflow-hidden">

  {/* Top accent line */}
  <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${color} 0%, ${color}55 100%)` }} />

  <div className="flex items-start gap-3 px-4 py-3.5">
    {/* Icon */}
    <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
      style={{ background: color + '18' }}>
      {/* type icon */}
    </div>
    {/* Text */}
    <div className="flex-1 min-w-0">
      <p className="text-[12px] font-bold text-gray-900 dark:text-white leading-tight">{title}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{message}</p>
    </div>
    {/* Close */}
    <button onClick={dismiss} className="p-0.5 text-gray-400 flex-shrink-0">
      <X size={14} />
    </button>
  </div>
</div>
```

---

## 11. Page Header Pattern

Used at the top of every page (inside content area, not the topbar).

```jsx
<div className="flex items-center justify-between mb-4">
  <div>
    <h1 className="text-lg font-bold text-[--navy] dark:text-white">{pageTitle}</h1>
    {subtitle && <p className="text-[11px] text-[--steel] mt-0.5">{subtitle}</p>}
  </div>
  {action && (
    <button
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white
        active:scale-95 transition-transform shadow-sm"
      style={{ background: 'var(--accent)' }}
      onClick={action.onClick}>
      {action.icon && <action.icon size={13} />}
      {action.label}
    </button>
  )}
</div>
```

---

## 12. Empty States

```jsx
function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-sm font-semibold text-[--navy] dark:text-gray-200 mb-1">{title}</h3>
      <p className="text-xs text-[--steel] mb-4">{message}</p>
      {action && (
        <button
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white"
          style={{ background: 'var(--accent)' }}
          onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

// Usage:
<EmptyState
  icon="📋"
  title="No leave applications"
  message="All caught up! No pending leaves to review."
  action={{ label: 'Refresh', onClick: refetch }}
/>
```

---

## 13. Loading States

### 13.1 Card skeleton

```jsx
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-[--mist] dark:border-gray-800 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3" />
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-lg w-1/2" />
        </div>
      </div>
    </div>
  );
}
```

### 13.2 Stat card skeleton

```jsx
function StatSkeleton() {
  return (
    <div className="rounded-2xl p-5 bg-gray-200 dark:bg-gray-800 animate-pulse h-[110px]" />
  );
}
```

---

## 14. Background / Theme System

Background themes are stored per user (localStorage key: `artech_bg`).

```js
const BACKGROUNDS = [
  { key: 'default',    label: 'Default',     thumb: null,               accent: '#1A6AB4' },
  { key: 'ocean',      label: 'Ocean',       thumb: 'ocean.jpg',        accent: '#0891b2' },
  { key: 'forest',     label: 'Forest',      thumb: 'forest.jpg',       accent: '#15803d' },
  { key: 'midnight',   label: 'Midnight',    thumb: 'midnight.jpg',     accent: '#818cf8' },
  { key: 'aurora',     label: 'Aurora',      thumb: 'aurora.jpg',       accent: '#3DC7B3' },
  { key: 'desert',     label: 'Desert',      thumb: 'desert.jpg',       accent: '#d97706' },
];
```

When a background image is active, apply `html.has-bg-image` (and `.bg-is-dark` if dark image). Glass classes then activate frosted-glass effects on all panels.

---

## 15. Utility CSS Classes

```css
/* Hide scrollbar but keep scrolling */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Safe-area padding (iPhone home bar) */
.pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }

/* Animate fade+slide up (used on dashboard cards) */
@keyframes dashFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Tap highlight removal (mobile) */
* { -webkit-tap-highlight-color: transparent; }

/* Line clamp utilities */
.line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
```

---

## 16. Tailwind Config Additions

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        accent:  'var(--accent)',
        'accent-dark': 'var(--accent-dark)',
        'accent-50':   'var(--accent-50)',
        teal:    'var(--teal)',
        success: 'var(--success)',
        cloud:   'var(--cloud)',
        mist:    'var(--mist)',
        steel:   'var(--steel)',
        navy:    'var(--navy)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 4px 18px rgba(13,31,78,0.10), 0 1px 3px rgba(13,31,78,0.06)',
        stat: '0 4px 20px rgba(13,31,78,0.12)',
      },
    },
  },
  plugins: [],
};
```

---

## 17. Page → Key Mapping Reference

| Page | Route Key | Role |
|------|-----------|------|
| HR Dashboard | `dashboard` | HR |
| Employees | `employees` | HR |
| Departments | `departments` | HR |
| Designations | `designations` | HR |
| Leave Applications | `leaves` | HR |
| Team Calendar | `work-mode-sheet` | HR |
| Leave Types | `leave-types` | HR |
| Leave Balances | `leave-balances` | HR |
| Attendance | `attendance` | HR |
| Holidays | `holidays` | HR |
| Announcements | `announcements` | HR |
| Asset Management | `assets` | HR |
| Edit Requests | `edit-requests` | HR |
| Resignations | `resignations` | HR |
| Reports | `reports` | HR |
| Salary Slips | `salary-slips` | Payroll |
| Payroll Entry | `payroll-entry` | Payroll |
| Payroll Rules | `payroll-rules` | Payroll |
| Onboarding | `onboarding` | Recruitment |
| Job Openings | `job-openings` | Recruitment |
| Applicants | `applicants` | Recruitment |
| Appraisals | `appraisals` | Appraisals |
| Document Requests | `document-requests` | Documents |
| Status Sheets | `status-sheets` | Documents |
| Company Docs | `company-docs` | Documents |
| Emp Dashboard | `emp-dashboard` | Employee |
| My Profile | `my-profile` | Employee |
| My Leaves | `my-leaves` | Employee |
| My Attendance | `my-attendance` | Employee |
| My Salary | `my-salary` | Employee |
| My Appraisals | `my-appraisals` | Employee |
| My Assets | `my-assets` | Employee |
| My Documents | `my-documents` | Employee |
| My Edit Requests | `my-edit-requests` | Employee |
| My Resignation | `my-resignation` | Employee |
| CEO Dashboard | `ceo-dashboard` | CEO |
| Compensation Planner | `compensation-planner` | CEO |
| Admin Overview | `admin-overview` | SuperAdmin |
| User Accounts | `admin-users` | SuperAdmin |
| Feature Permissions | `admin-permissions` | SuperAdmin |
| Activity Log | `activity-log` | SuperAdmin |

---

## 18. Checklist for Mobile Implementation

- [ ] `mobile-only` / `desktop-only` utility classes set up
- [ ] Body background with gradient mesh (see Section 1 body styles)
- [ ] Topbar fixed at top with `glass-topbar` class
- [ ] Bottom nav with 5 items: Home, Attendance, More, Alerts, Settings
- [ ] Slide-up panel (`.glass-mobile-panel`) for drawer/notifications/settings
- [ ] CSS custom properties (color tokens) injected at `:root`
- [ ] Dark mode via `html.dark` class
- [ ] Accent theme switcher via `html[data-accent]`
- [ ] Background image theme via `html.has-bg-image` + `html.bg-is-dark`
- [ ] `env(safe-area-inset-bottom)` on bottom nav and panels (for iPhone)
- [ ] `-webkit-tap-highlight-color: transparent` on `*`
- [ ] No-scrollbar utility for tab bars and horizontal scrolls
- [ ] `active:scale-[0.97]` on all tappable cards for press feedback
- [ ] Card skeleton loaders while data fetches
- [ ] Empty states for zero-data screens
- [ ] Unread notification badge on bell icon (polls every 60s)
- [ ] Toast notifications positioned above bottom nav (`bottom-20`)
- [ ] `pt-14 pb-24` on main content to clear topbar + bottom nav
