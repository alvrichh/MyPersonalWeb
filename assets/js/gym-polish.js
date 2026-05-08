import './gym-view-focus.js';
import './gym-monthly-plan.js';
import './gym-pro-max-ui.js';

'use strict';

const GYM_STORAGE_KEYS = ['alvrichGymMayAutoV2', 'alvrichGymMayAutoV1'];

const readGymStore = () => {
  for (const key of GYM_STORAGE_KEYS) {
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

const normaliseWeight = (weight) => {
  if (!weight) return '';

  const parsed = Number.parseFloat(String(weight).replace(',', '.'));
  if (Number.isNaN(parsed)) return String(weight);

  return `${parsed.toFixed(1)} kg`;
};

const getDayName = (date) => {
  const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return names[new Date(`${date}T12:00:00`).getDay()];
};

const monthMap = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

const getVisibleCalendarYearMonth = () => {
  const title = document.getElementById('calendarTitle')?.textContent?.trim().toLowerCase() || '';
  const match = title.match(/^([a-záéíóúüñ]+)\s+de\s+(\d{4})$/i);

  if (!match) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  return {
    year: Number(match[2]),
    month: monthMap[match[1]] ?? new Date().getMonth(),
  };
};

const createGymPolishStyles = () => {
  if (document.querySelector('[data-gym-polish-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-gym-polish-style', 'true');
  style.textContent = `
    .calDay:not(.empty) {
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: transform .16s ease, border-color .16s ease, background .16s ease;
    }

    .calDay:not(.empty):active {
      transform: scale(.97);
    }

    .calDay.has-entry {
      border-color: rgba(112,225,161,.42);
      background: linear-gradient(180deg, rgba(112,225,161,.11), rgba(255,255,255,.045));
    }

    .gym-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 80;
      display: grid;
      place-items: end center;
      padding: 18px 14px calc(18px + env(safe-area-inset-bottom));
      background: rgba(3, 6, 12, .66);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      opacity: 0;
      pointer-events: none;
      transition: opacity .18s ease;
    }

    .gym-modal-backdrop.is-open {
      opacity: 1;
      pointer-events: auto;
    }

    .gym-modal {
      width: min(100%, 520px);
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 28px;
      background:
        radial-gradient(circle at top left, rgba(112,225,161,.16), transparent 34%),
        linear-gradient(180deg, rgba(16,24,39,.96), rgba(7,10,18,.98));
      box-shadow: 0 28px 80px rgba(0,0,0,.48);
      padding: 18px;
      transform: translateY(18px) scale(.98);
      transition: transform .18s ease;
    }

    .gym-modal-backdrop.is-open .gym-modal {
      transform: translateY(0) scale(1);
    }

    .gym-modal-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 14px;
    }

    .gym-modal-kicker {
      margin: 0 0 5px;
      color: var(--accent);
      font-weight: 900;
      font-size: .82rem;
      letter-spacing: .09em;
      text-transform: uppercase;
    }

    .gym-modal-title {
      margin: 0;
      font-size: 1.38rem;
      line-height: 1.05;
    }

    .gym-modal-close {
      width: 42px;
      height: 42px;
      flex: 0 0 auto;
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 15px;
      background: rgba(255,255,255,.06);
      color: var(--text);
      font-size: 1.35rem;
      font-weight: 900;
    }

    .gym-modal-grid {
      display: grid;
      gap: 10px;
    }

    .gym-modal-stat,
    .gym-modal-note,
    .gym-modal-empty {
      border: 1px solid rgba(255,255,255,.11);
      border-radius: 18px;
      background: rgba(255,255,255,.055);
      padding: 13px;
    }

    .gym-modal-stat span,
    .gym-modal-note span {
      display: block;
      color: var(--muted);
      font-size: .78rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .08em;
      margin-bottom: 4px;
    }

    .gym-modal-stat strong {
      color: var(--accent);
      font-size: 1.32rem;
    }

    .gym-modal-note p,
    .gym-modal-empty p {
      margin: 0;
      color: var(--text);
      line-height: 1.45;
    }

    .gym-modal-notes-list {
      margin: 8px 0 0;
      padding-left: 18px;
      color: var(--muted);
      line-height: 1.45;
    }

    @media (max-width: 520px) {
      body {
        padding: 8px 8px 94px;
      }

      .app {
        max-width: 100%;
      }

      .top {
        position: relative;
        padding: 0 0 8px;
        background: transparent;
      }

      .back {
        margin-bottom: 8px;
        padding: 9px 12px;
        font-size: .93rem;
      }

      .brand {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        align-items: start;
      }

      .brand h1 {
        font-size: clamp(2rem, 12vw, 2.55rem);
        letter-spacing: -.055em;
      }

      .brand p {
        max-width: 14rem;
        margin-top: 4px;
        font-size: .98rem;
        line-height: 1.18;
      }

      .pill {
        justify-self: start;
        padding: 8px 11px;
        font-size: .9rem;
        max-width: 100%;
      }

      .hero {
        margin-top: 6px;
        padding: 16px;
        border-radius: 22px;
      }

      .hero p {
        margin-top: 0;
      }

      .quickActions {
        margin-top: 12px;
        gap: 8px;
      }

      .quickBtn {
        padding: 14px 12px;
        border-radius: 16px;
      }

      .stats {
        gap: 8px;
      }

      .stat {
        padding: 10px;
      }

      .tabs {
        gap: 6px;
        padding-left: 8px;
        padding-right: 8px;
      }

      .tab {
        padding: 10px 4px;
        font-size: .78rem;
        border-radius: 14px;
      }

      .calendarGrid {
        gap: 5px;
      }

      .calDay {
        min-height: 68px;
        border-radius: 14px;
        padding: 7px;
      }
    }
  `;

  document.head.appendChild(style);
};

const ensureGymModal = () => {
  let modal = document.querySelector('[data-gym-modal-backdrop]');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'gym-modal-backdrop';
  modal.setAttribute('data-gym-modal-backdrop', 'true');
  modal.innerHTML = `
    <section class="gym-modal" role="dialog" aria-modal="true" aria-labelledby="gym-modal-title">
      <div class="gym-modal-head">
        <div>
          <p class="gym-modal-kicker" data-gym-modal-kicker>Día</p>
          <h2 class="gym-modal-title" id="gym-modal-title" data-gym-modal-title></h2>
        </div>
        <button class="gym-modal-close" type="button" data-gym-modal-close aria-label="Cerrar">×</button>
      </div>
      <div class="gym-modal-grid" data-gym-modal-body></div>
    </section>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest('[data-gym-modal-close]')) {
      closeGymModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeGymModal();
  });

  return modal;
};

const closeGymModal = () => {
  const modal = document.querySelector('[data-gym-modal-backdrop]');
  if (!modal) return;

  modal.classList.remove('is-open');
  document.body.style.overflow = '';
};

const getExerciseNotesForDate = (store, date) => {
  return Object.entries(store.exerciseNotes || {})
    .filter(([key, value]) => key.startsWith(`${date}|`) && String(value).trim())
    .map(([, value]) => String(value).trim());
};

const getCheckedExerciseCount = (store, date) => {
  return Object.entries(store.checks || {})
    .filter(([key, value]) => key.startsWith(`${date}|`) && value)
    .length;
};

const openGymModal = (date) => {
  const modal = ensureGymModal();
  const store = readGymStore();
  const log = (store.logs || {})[date] || {};
  const title = modal.querySelector('[data-gym-modal-title]');
  const kicker = modal.querySelector('[data-gym-modal-kicker]');
  const body = modal.querySelector('[data-gym-modal-body]');
  const exerciseCount = getCheckedExerciseCount(store, date);
  const exerciseNotes = getExerciseNotesForDate(store, date);

  kicker.textContent = `${getDayName(date)} · ${date}`;
  title.textContent = log.weight ? normaliseWeight(log.weight) : 'Sin peso guardado';

  const notesList = exerciseNotes.length
    ? `<ul class="gym-modal-notes-list">${exerciseNotes.map((note) => `<li>${note}</li>`).join('')}</ul>`
    : '';

  body.innerHTML = `
    <div class="gym-modal-stat">
      <span>Peso</span>
      <strong>${log.weight ? normaliseWeight(log.weight) : '—'}</strong>
    </div>
    <div class="gym-modal-stat">
      <span>Ejercicios marcados</span>
      <strong>${exerciseCount}</strong>
    </div>
    ${log.feeling ? `<div class="gym-modal-note"><span>Sensación</span><p>${log.feeling}</p></div>` : ''}
    ${log.notes ? `<div class="gym-modal-note"><span>Nota del día</span><p>${log.notes}</p></div>` : ''}
    ${notesList ? `<div class="gym-modal-note"><span>Notas de ejercicios</span>${notesList}</div>` : ''}
    ${!log.weight && !log.notes && !log.feeling && exerciseCount === 0 && !exerciseNotes.length ? '<div class="gym-modal-empty"><p>No hay datos guardados para este día todavía.</p></div>' : ''}
  `;

  document.body.style.overflow = 'hidden';
  modal.classList.add('is-open');
};

const decorateCalendarDays = () => {
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;

  const store = readGymStore();
  const { year, month } = getVisibleCalendarYearMonth();

  grid.querySelectorAll('.calDay:not(.empty)').forEach((cell) => {
    const day = cell.querySelector('.dayNum')?.textContent?.trim();
    if (!day) return;

    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasLog = Boolean((store.logs || {})[date]);
    const hasChecks = getCheckedExerciseCount(store, date) > 0;
    const hasNotes = getExerciseNotesForDate(store, date).length > 0;

    cell.dataset.date = date;
    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-label', `Ver detalles del ${date}`);
    cell.classList.toggle('has-entry', hasLog || hasChecks || hasNotes);
  });
};

const hookCalendarClicks = () => {
  const grid = document.getElementById('calendarGrid');
  if (!grid || grid.dataset.gymModalHooked === 'true') return;

  grid.dataset.gymModalHooked = 'true';

  grid.addEventListener('click', (event) => {
    const day = event.target.closest('.calDay:not(.empty)');
    if (!day?.dataset?.date) return;

    openGymModal(day.dataset.date);
  });

  grid.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const day = event.target.closest('.calDay:not(.empty)');
    if (!day?.dataset?.date) return;

    event.preventDefault();
    openGymModal(day.dataset.date);
  });
};

const patchRenderCalendar = () => {
  if (typeof window.renderCalendar !== 'function' || window.renderCalendar.__gymPatched) {
    decorateCalendarDays();
    hookCalendarClicks();
    return;
  }

  const originalRenderCalendar = window.renderCalendar;
  window.renderCalendar = function patchedRenderCalendar(...args) {
    const result = originalRenderCalendar.apply(this, args);
    window.requestAnimationFrame(() => {
      decorateCalendarDays();
      hookCalendarClicks();
    });
    return result;
  };
  window.renderCalendar.__gymPatched = true;
};

const initGymPolish = () => {
  createGymPolishStyles();
  ensureGymModal();
  patchRenderCalendar();
  window.requestAnimationFrame(() => {
    decorateCalendarDays();
    hookCalendarClicks();
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGymPolish);
} else {
  initGymPolish();
}
