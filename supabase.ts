/* ── Grangemill QA — Design tokens ────────────────────────────────── */
/* Palette: slate-industrial base, amber accent, clean data surfaces  */

:root {
  --c-bg:           #F5F4F1;
  --c-surface:      #FFFFFF;
  --c-surface-2:    #F0EEE9;
  --c-border:       #E2DFD8;
  --c-border-strong:#C8C4BC;

  --c-text:         #1C1B19;
  --c-text-2:       #5C5A55;
  --c-text-3:       #9A9790;

  --c-accent:       #C47E1A;       /* amber — Grangemill's asphalt/bitumen world */
  --c-accent-light: #FDF3E0;
  --c-accent-dark:  #8C5A0F;

  --c-ok:           #2A7A4B;
  --c-ok-bg:        #EAF5EE;
  --c-warn:         #B45309;
  --c-warn-bg:      #FEF3C7;
  --c-danger:       #B91C1C;
  --c-danger-bg:    #FEE2E2;

  --c-slate:        #334155;       /* section headers */
  --c-slate-light:  #EEF1F6;

  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;

  --shadow-sm:  0 1px 2px rgba(0,0,0,0.06);
  --shadow-md:  0 2px 8px rgba(0,0,0,0.08);

  --font-sans:  'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono:  'JetBrains Mono', 'Fira Code', monospace;

  --max-w:      960px;
  --max-w-form: 720px;
}

/* ── Reset ──────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 16px; -webkit-font-smoothing: antialiased; }

body {
  font-family: var(--font-sans);
  background: var(--c-bg);
  color: var(--c-text);
  line-height: 1.6;
  min-height: 100vh;
}

/* ── Typography ─────────────────────────────────────────────────────── */
h1 { font-size: 1.5rem;  font-weight: 600; line-height: 1.3; letter-spacing: -0.02em; }
h2 { font-size: 1.125rem; font-weight: 600; line-height: 1.4; }
h3 { font-size: 0.9375rem; font-weight: 600; }
p  { font-size: 0.9375rem; color: var(--c-text-2); }

/* ── Layout ─────────────────────────────────────────────────────────── */
.page-shell {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.main-content {
  padding: 2rem;
  max-width: var(--max-w);
}

/* ── Nav ────────────────────────────────────────────────────────────── */
.sidebar {
  background: var(--c-slate);
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-logo {
  padding: 0 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.sidebar-logo span {
  display: block;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  margin-bottom: 4px;
}

.sidebar-logo strong {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.sidebar-logo .accent-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--c-accent);
  border-radius: 50%;
  margin-left: 4px;
  vertical-align: middle;
  margin-bottom: 2px;
}

.nav-links {
  padding: 1rem 0;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.6rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  transition: color 0.15s, background 0.15s;
  border-left: 3px solid transparent;
}

.nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }

.nav-link.active {
  color: #fff;
  border-left-color: var(--c-accent);
  background: rgba(255,255,255,0.08);
}

/* ── Cards ──────────────────────────────────────────────────────────── */
.card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-body { padding: 1.5rem; }

/* ── Form elements ──────────────────────────────────────────────────── */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--c-text-2);
  letter-spacing: 0.01em;
}

label .required {
  color: var(--c-danger);
  margin-left: 2px;
}

input[type="text"],
input[type="number"],
input[type="date"],
input[type="time"],
select,
textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  font-family: var(--font-sans);
  color: var(--c-text);
  background: var(--c-surface);
  border: 1px solid var(--c-border-strong);
  border-radius: var(--radius-md);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  -webkit-appearance: none;
}

input:focus, select:focus, textarea:focus {
  border-color: var(--c-accent);
  box-shadow: 0 0 0 3px var(--c-accent-light);
}

input.error, select.error { border-color: var(--c-danger); }

textarea { resize: vertical; min-height: 80px; }

/* Number inputs — remove spinner arrows for cleaner data entry */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; }
input[type="number"] { -moz-appearance: textfield; }

/* ── Checkbox / Radio ───────────────────────────────────────────────── */
.checkbox-group, .radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item, .radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-item input, .radio-item input {
  width: 16px;
  height: 16px;
  accent-color: var(--c-accent);
  flex-shrink: 0;
}

.checkbox-item span, .radio-item span {
  font-size: 0.9375rem;
  color: var(--c-text);
}

/* ── Buttons ────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0.5625rem 1.125rem;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: var(--font-sans);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
  white-space: nowrap;
}

.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-primary {
  background: var(--c-accent);
  color: #fff;
  border-color: var(--c-accent);
}
.btn-primary:hover:not(:disabled) { background: var(--c-accent-dark); border-color: var(--c-accent-dark); }

.btn-secondary {
  background: var(--c-surface);
  color: var(--c-text);
  border-color: var(--c-border-strong);
}
.btn-secondary:hover:not(:disabled) { background: var(--c-surface-2); }

.btn-danger {
  background: var(--c-danger-bg);
  color: var(--c-danger);
  border-color: var(--c-danger);
}
.btn-danger:hover:not(:disabled) { background: var(--c-danger); color: #fff; }

.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
.btn-lg { padding: 0.75rem 1.5rem; font-size: 1rem; }

/* ── Badges ─────────────────────────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-ok      { background: var(--c-ok-bg);      color: var(--c-ok); }
.badge-warn    { background: var(--c-warn-bg);     color: var(--c-warn); }
.badge-danger  { background: var(--c-danger-bg);   color: var(--c-danger); }
.badge-neutral { background: var(--c-surface-2);   color: var(--c-text-2); }
.badge-accent  { background: var(--c-accent-light); color: var(--c-accent-dark); }

/* ── Section header (form sections) ────────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.875rem 1.25rem;
  background: var(--c-slate-light);
  border-radius: var(--radius-md);
  margin-bottom: 1.25rem;
}

.section-header h2 {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--c-slate);
  letter-spacing: 0.01em;
}

.section-number {
  width: 24px;
  height: 24px;
  background: var(--c-slate);
  color: #fff;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Data grid ──────────────────────────────────────────────────────── */
.data-grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-grid th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--c-text-3);
  padding: 0.625rem 1rem;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-surface-2);
}

.data-grid td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--c-border);
  color: var(--c-text);
  vertical-align: middle;
}

.data-grid tr:last-child td { border-bottom: none; }
.data-grid tr:hover td { background: var(--c-surface-2); }

/* ── Stat cards ─────────────────────────────────────────────────────── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--c-text-3);
  margin-bottom: 6px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--c-text);
  line-height: 1;
}

.stat-value.accent { color: var(--c-accent); }
.stat-value.danger { color: var(--c-danger); }
.stat-value.ok     { color: var(--c-ok); }

.stat-sub {
  font-size: 0.8125rem;
  color: var(--c-text-3);
  margin-top: 4px;
}

/* ── Page header ────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-header-text h1 { margin-bottom: 4px; }

/* ── Alert / banner ─────────────────────────────────────────────────── */
.alert {
  padding: 0.875rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.alert-success { background: var(--c-ok-bg);      color: var(--c-ok);     border: 1px solid #86efac; }
.alert-warn    { background: var(--c-warn-bg);     color: var(--c-warn);   border: 1px solid #fde68a; }
.alert-danger  { background: var(--c-danger-bg);   color: var(--c-danger); border: 1px solid #fca5a5; }

/* ── Divider ────────────────────────────────────────────────────────── */
.divider {
  height: 1px;
  background: var(--c-border);
  margin: 1.5rem 0;
}

/* ── Loading state ──────────────────────────────────────────────────── */
.skeleton {
  background: linear-gradient(90deg, var(--c-surface-2) 25%, var(--c-border) 50%, var(--c-surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── Responsive ─────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .page-shell { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .main-content { padding: 1rem; }
}
