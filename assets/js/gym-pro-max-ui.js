'use strict';

const GYM_PRO_STORAGE_KEYS = ['alvrichGymMayAutoV2', 'alvrichGymMayAutoV1'];

const readGymProStore = () => {
  for (const key of GYM_PRO_STORAGE_KEYS) {
    const value = localStorage.getItem(key);
    if (!value) continue;

    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('Could not parse gym storage', key, error);
    }
  }

  return { logs: {}, checks: {}, exerciseNotes: {} };
};

const createGymProMaxStyles = () => {
  if (document.querySelector('[data-gym-pro-max-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-gym-pro-max-style', 'true');
  style.textContent = `
    :root {
      --gym-radius-xl: 28px;
      --gym-radius-lg: 22px;
      --gym-glass: rgba(16, 24, 39, .78);
      --gym-glass-strong: rgba(16, 24, 39, .92);
      --gym-surface-line: rgba(255, 255, 255, .14);
      --gym-soft-shadow: 0 26px 72px rgba(0, 0, 0, .38);
    }

    body.gym-pro-max {
      position: relative;
      background:
        radial-gradient(circle at 16% -8%, rgba(112,225,161,.24), transparent 30%),
        radial-gradient(circle at 88% 4%, rgba(101,167,255,.24), transparent 27%),
        linear-gradient(180deg, #08101a 0%, #05070d 58%, #060a12 100%);
    }

    body.gym-pro-max::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: .36;
      background-image:
        linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
      background-size: 44px 44px;
      mask-image: radial-gradient(circle at top, #000 0%, transparent 68%);
      -webkit-mask-image: radial-gradient(circle at top, #000 0%, transparent 68%);
    }

    body.gym-pro-max .app {
      position: relative;
      z-index: 1;
    }

    body.gym-pro-max .top {
      border-radius: 0 0 26px 26px;
    }

    body.gym-pro-max .back {
      min-height: 2.8rem;
      align-items: center;
      gap: .4rem;
      border-color: rgba(255,255,255,.12);
      background: rgba(255,255,255,.055);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
      transition: transform .18s ease, border-color .18s ease, background .18s ease;
    }

    body.gym-pro-max .back:hover,
    body.gym-pro-max .back:focus-visible {
      transform: translateY(-1px);
      border-color: rgba(112,225,161,.36);
      background: rgba(112,225,161,.09);
    }

    body.gym-pro-max .brand h1 {
      letter-spacing: -.06em;
      background: linear-gradient(135deg, #f7fbff 16%, var(--accent) 62%, var(--accent2));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    body.gym-pro-max .brand p {
      max-width: 34ch;
      line-height: 1.35;
    }

    body.gym-pro-max .pill {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      border-color: rgba(112,225,161,.28);
      background: rgba(112,225,161,.09);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 1px rgba(112,225,161,.08);
    }

    body.gym-pro-max .pill::before {
      content: "";
      width: .48rem;
      height: .48rem;
      border-radius: 999px;
      background: var(--accent);
      box-shadow: 0 0 0 6px rgba(112,225,161,.12);
    }

    body.gym-pro-max .hero,
    body.gym-pro-max .card,
    body.gym-pro-max .day,
    body.gym-pro-max .today {
      border-color: var(--gym-surface-line);
      box-shadow: var(--gym-soft-shadow), inset 0 1px 0 rgba(255,255,255,.065);
    }

    body.gym-pro-max .hero {
      position: relative;
      overflow: hidden;
      padding: clamp(1rem, 4vw, 1.45rem);
      border-radius: var(--gym-radius-xl);
      background:
        radial-gradient(circle at 8% 0%, rgba(112,225,161,.2), transparent 33%),
        radial-gradient(circle at 100% 10%, rgba(101,167,255,.18), transparent 36%),
        linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.026)),
        var(--gym-glass);
    }

    body.gym-pro-max .hero::after {
      content: "";
      position: absolute;
      inset: auto -20% -45% -20%;
      height: 11rem;
      background: radial-gradient(circle, rgba(112,225,161,.12), transparent 62%);
      pointer-events: none;
    }

    body.gym-pro-max .hero > * {
      position: relative;
      z-index: 1;
    }

    body.gym-pro-max .hero p {
      margin-top: 0;
      color: #d7e5f5;
      font-size: clamp(.98rem, 2.4vw, 1.08rem);
      line-height: 1.55;
    }

    .gym-command-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: .62rem;
      margin: .95rem 0 0;
    }

    .gym-command-card {
      min-width: 0;
      border: 1px solid rgba(255,255,255,.11);
      border-radius: 18px;
      padding: .82rem;
      background: rgba(0,0,0,.18);
    }

    .gym-command-card span {
      display: block;
      color: var(--muted);
      font-size: .7rem;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
      line-height: 1.2;
    }

    .gym-command-card strong {
      display: block;
      margin-top: .35rem;
      color: var(--text);
      font-size: clamp(.92rem, 2.8vw, 1.08rem);
      line-height: 1.08;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    body.gym-pro-max .quickActions {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .72rem;
    }

    body.gym-pro-max .quickBtn:first-child {
      grid-column: 1 / -1;
    }

    body.gym-pro-max .quickBtn {
      min-height: 3.3rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 18px;
      box-shadow: 0 18px 42px rgba(112,225,161,.14);
      transition: transform .18s ease, filter .18s ease, box-shadow .18s ease;
    }

    body.gym-pro-max .quickBtn:hover,
    body.gym-pro-max .quickBtn:focus-visible {
      transform: translateY(-2px);
      filter: brightness(1.04);
      box-shadow: 0 22px 52px rgba(112,225,161,.18);
    }

    body.gym-pro-max .quickBtn.secondary {
      background: rgba(255,255,255,.07);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
    }

    body.gym-pro-max .stats {
      gap: .72rem;
    }

    body.gym-pro-max .stat {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border-color: rgba(255,255,255,.11);
      background:
        linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.018)),
        rgba(0,0,0,.2);
    }

    body.gym-pro-max .stat::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top right, rgba(112,225,161,.09), transparent 52%);
      opacity: .9;
      pointer-events: none;
    }

    body.gym-pro-max .stat > * {
      position: relative;
      z-index: 1;
    }

    body.gym-pro-max .stat span {
      font-weight: 900;
      letter-spacing: .06em;
      text-transform: uppercase;
    }

    body.gym-pro-max .stat b {
      display: block;
      margin-top: .22rem;
      font-size: clamp(1.05rem, 4.5vw, 1.48rem);
      line-height: 1.05;
    }

    body.gym-pro-max .tabs {
      box-shadow: 0 -18px 54px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.055);
    }

    body.gym-pro-max .tab {
      min-height: 3rem;
      transition: transform .16s ease, background .16s ease, color .16s ease, border-color .16s ease;
    }

    body.gym-pro-max .tab:active {
      transform: scale(.97);
    }

    body.gym-pro-max .today {
      background:
        radial-gradient(circle at 100% 0%, rgba(112,225,161,.12), transparent 40%),
        rgba(112,225,161,.07);
    }

    body.gym-pro-max .dayHead h2,
    body.gym-pro-max .card h2,
    body.gym-pro-max .card h3 {
      letter-spacing: -.035em;
      line-height: 1.08;
    }

    body.gym-pro-max .exercise {
      transition: background .16s ease, border-color .16s ease;
    }

    body.gym-pro-max .exercise:focus-within,
    body.gym-pro-max .exercise:hover {
      background: rgba(255,255,255,.025);
    }

    body.gym-pro-max .check {
      width: 32px;
      height: 32px;
      cursor: pointer;
    }

    body.gym-pro-max .input,
    body.gym-pro-max textarea,
    body.gym-pro-max select,
    body.gym-pro-max .miniNote {
      transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
    }

    body.gym-pro-max .input:focus,
    body.gym-pro-max textarea:focus,
    body.gym-pro-max select:focus,
    body.gym-pro-max .miniNote:focus {
      outline: 0;
      border-color: rgba(112,225,161,.48);
      box-shadow: 0 0 0 4px rgba(112,225,161,.12);
      background: #0c1627;
    }

    body.gym-pro-max .save,
    body.gym-pro-max .ghost {
      min-height: 3.25rem;
      cursor: pointer;
      transition: transform .16s ease, filter .16s ease, border-color .16s ease;
    }

    body.gym-pro-max .save:hover,
    body.gym-pro-max .ghost:hover,
    body.gym-pro-max .save:focus-visible,
    body.gym-pro-max .ghost:focus-visible {
      transform: translateY(-1px);
      filter: brightness(1.04);
    }

    body.gym-pro-max .calendarHead {
      position: sticky;
      top: 0;
      z-index: 2;
      padding: .25rem 0 .45rem;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    body.gym-pro-max .monthBtn {
      min-width: 2.8rem;
      cursor: pointer;
      transition: transform .16s ease, border-color .16s ease, background .16s ease;
    }

    body.gym-pro-max .monthBtn:hover,
    body.gym-pro-max .monthBtn:focus-visible {
      transform: translateY(-1px);
      border-color: rgba(112,225,161,.34);
      background: rgba(112,225,161,.09);
    }

    body.gym-pro-max .calendarTitle {
      letter-spacing: -.02em;
    }

    body.gym-pro-max .calDay {
      position: relative;
      transition: transform .16s ease, border-color .16s ease, background .16s ease, box-shadow .16s ease;
    }

    body.gym-pro-max .calDay:not(.empty):hover,
    body.gym-pro-max .calDay:not(.empty):focus-visible {
      transform: translateY(-2px);
      border-color: rgba(112,225,161,.34);
      box-shadow: 0 14px 28px rgba(0,0,0,.24);
    }

    body.gym-pro-max .calDay.todayCal::after {
      content: "";
      position: absolute;
      top: .42rem;
      right: .42rem;
      width: .45rem;
      height: .45rem;
      border-radius: 999px;
      background: var(--accent);
      box-shadow: 0 0 0 5px rgba(112,225,161,.13);
    }

    @media (max-width: 520px) {
      body.gym-pro-max {
        padding-top: 10px;
      }

      .gym-command-strip {
        grid-template-columns: 1fr;
        gap: .52rem;
      }

      .gym-command-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: .75rem;
        padding: .78rem .86rem;
      }

      .gym-command-card strong {
        margin-top: 0;
        text-align: right;
        max-width: 48%;
      }

      body.gym-pro-max .quickActions {
        grid-template-columns: 1fr 1fr;
      }

      body.gym-pro-max .stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (min-width: 700px) {
      body.gym-pro-max .quickActions {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      body.gym-pro-max .quickBtn:first-child {
        grid-column: auto;
      }

      body.gym-pro-max .tabs {
        position: sticky;
        top: .8rem;
        z-index: 8;
        background: rgba(7,10,18,.72);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      body.gym-pro-max *,
      body.gym-pro-max *::before,
      body.gym-pro-max *::after {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-duration: .01ms !important;
      }
    }
  `;

  document.head.appendChild(style);
};

const ensureGymThemeMeta = () => {
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }

  meta.content = '#08101a';
};

const workoutDates = (store) => {
  const dates = new Set();
  Object.entries(store.checks || {}).forEach(([key, value]) => {
    if (value) dates.add(key.split('|')[0]);
  });
  return dates.size;
};

const ensureCommandStrip = () => {
  const hero = document.querySelector('.hero');
  if (!hero || hero.querySelector('[data-gym-command-strip]')) return;

  const intro = hero.querySelector('p');
  const strip = document.createElement('div');
  strip.className = 'gym-command-strip';
  strip.setAttribute('data-gym-command-strip', 'true');
  strip.innerHTML = `
    <div class="gym-command-card">
      <span>Foco hoy</span>
      <strong data-gym-pro-focus>Hoy</strong>
    </div>
    <div class="gym-command-card">
      <span>Peso actual</span>
      <strong data-gym-pro-weight>—</strong>
    </div>
    <div class="gym-command-card">
      <span>Consistencia</span>
      <strong data-gym-pro-consistency>0 días</strong>
    </div>
  `;

  if (intro) {
    intro.insertAdjacentElement('afterend', strip);
  } else {
    hero.prepend(strip);
  }
};

const updateCommandStrip = () => {
  const store = readGymProStore();
  const focus = document.querySelector('[data-gym-pro-focus]');
  const weight = document.querySelector('[data-gym-pro-weight]');
  const consistency = document.querySelector('[data-gym-pro-consistency]');
  const todayPill = document.getElementById('todayPill');
  const currentWeight = document.getElementById('currentWeight');

  if (focus) focus.textContent = todayPill?.textContent?.split('·')?.[0]?.trim() || 'Hoy';
  if (weight) weight.textContent = currentWeight?.textContent?.trim() || '—';
  if (consistency) consistency.textContent = `${workoutDates(store)} días`;
};

const bindGymProUpdates = () => {
  const refresh = () => window.setTimeout(updateCommandStrip, 80);
  document.addEventListener('click', refresh, true);
  document.addEventListener('input', refresh, true);
  window.addEventListener('storage', refresh);
};

const initGymProMaxUi = () => {
  document.body.classList.add('gym-pro-max');
  createGymProMaxStyles();
  ensureGymThemeMeta();
  ensureCommandStrip();
  updateCommandStrip();
  bindGymProUpdates();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGymProMaxUi);
} else {
  initGymProMaxUi();
}
