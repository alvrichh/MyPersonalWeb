'use strict';

/*
 * Mi calendario — one month/year view over four layers:
 *   events  (own store + fixed yearly ones like my birthday)
 *   career  (milestones built from assets/data/experience.json)
 *   tasks   (read-only from the Bubble planner)
 *   gym     (read-only from the gym tracker)
 * Gym and Bubble keep owning their data; this page only reads it.
 */

const root = document.documentElement;

const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  },
  json(...keys) {
    for (const key of keys) {
      try {
        const value = JSON.parse(this.get(key));
        if (value) return value;
      } catch (e) { /* corrupt entry, try the next key */ }
    }
    return null;
  },
};

const KEYS = {
  events: 'alvrichCalendarV1',
  layers: 'alvrichCalendarLayers',
  gym: ['alvrichGymMayAutoV2', 'alvrichGymMayAutoV1'],
  gymPlan: ['alvrichGymMonthlyPlanV1'],
  tasks: ['alvrichBubblePlanningV1', 'alvrichOrbitPlanningV1', 'alvrichPlanningAgendaV2'],
};

// Fixed yearly events that live in code, not in the browser.
const FIXED_EVENTS = [
  { id: 'birthday', emoji: '🎂', title: 'Mi cumpleaños', md: '02-22', yearly: true, fixed: true },
];

const LOCALE = 'es-ES';
const LAYERS = ['events', 'career', 'tasks', 'gym'];
const MAX_CHIPS = 3;

/* ----------------------------------------------------------------- Helpers */

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (value) => new Date(`${value}T12:00:00`);
const todayIso = () => iso(new Date());
const lastDayOfMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return `${ym}-${pad(new Date(y, m, 0).getDate())}`;
};
const monthsBetween = (fromYm, toYm) => {
  const [fy, fm] = fromYm.split('-').map(Number);
  const [ty, tm] = toYm.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm) + 1;
};
const currentYm = () => todayIso().slice(0, 7);

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const monthName = (year, month) => capitalise(new Date(year, month, 1).toLocaleDateString(LOCALE, { month: 'long' }));
const longDate = (date) => capitalise(parse(date).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
const shortYm = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(LOCALE, { month: 'short', year: 'numeric' }).replace('.', '');
};
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const duration = (months) => {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years && plural(years, 'año', 'años'), rest && plural(rest, 'mes', 'meses')].filter(Boolean).join(' y ') || 'menos de un mes';
};

/* -------------------------------------------------------------------- Data */

const state = {
  view: 'year',
  cursor: new Date(),
  layers: new Set(LAYERS),
  experience: { work: [], education: [], volunteering: [], certificates: [] },
  selected: null,
};

const savedLayers = storage.json(KEYS.layers);
if (Array.isArray(savedLayers)) state.layers = new Set(savedLayers.filter((l) => LAYERS.includes(l)));

const readEvents = () => {
  const data = storage.json(KEYS.events);
  return Array.isArray(data?.events) ? data.events : [];
};

const writeEvents = (events) => storage.set(KEYS.events, JSON.stringify({ events }));

// Everything is grouped by ISO date once per render, so cells stay cheap.
function collect(fromIso, toIso) {
  const byDate = new Map();
  const push = (date, item) => {
    if (date < fromIso || date > toIso) return;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(item);
  };
  const fromYear = Number(fromIso.slice(0, 4));
  const toYear = Number(toIso.slice(0, 4));

  if (state.layers.has('events')) {
    [...FIXED_EVENTS, ...readEvents()].forEach((event) => {
      if (event.yearly) {
        const md = event.md || event.date.slice(5);
        for (let y = fromYear; y <= toYear; y += 1) push(`${y}-${md}`, { layer: 'events', ...event });
      } else if (event.date) {
        push(event.date, { layer: 'events', ...event });
      }
    });
  }

  if (state.layers.has('career')) {
    const now = currentYm();
    const add = (item, kind) => {
      const verbStart = {
        education: `Empiezo ${item.role}`,
        volunteering: `Empiezo el voluntariado en ${item.org}`,
      }[kind] || `Empiezo en ${item.org}`;
      const verbEnd = {
        education: `Termino ${item.role}`,
        volunteering: `Termino el voluntariado en ${item.org}`,
      }[kind] || `Último mes en ${item.org}`;
      push(`${item.start}-01`, { layer: 'career', kind, item, title: verbStart, tag: 'inicio' });
      if (item.end) push(lastDayOfMonth(item.end), { layer: 'career', kind, item, title: verbEnd, tag: 'fin' });

      // Work anniversaries, while I'm still there.
      if (kind === 'work') {
        const [sy, sm] = item.start.split('-').map(Number);
        const until = item.end || now;
        for (let y = sy + 1; y <= toYear; y += 1) {
          const ym = `${y}-${pad(sm)}`;
          if (ym > until) break;
          push(`${ym}-01`, { layer: 'career', kind, item, title: `${plural(y - sy, 'año', 'años')} en ${item.org}`, tag: 'aniversario' });
        }
      }
    };
    state.experience.work.forEach((item) => add(item, 'work'));
    state.experience.education.forEach((item) => add(item, 'education'));
    state.experience.volunteering.forEach((item) => add(item, 'volunteering'));

    // Certificates with only a month land on its first day.
    state.experience.certificates.forEach((cert) => {
      push(cert.date.length === 10 ? cert.date : `${cert.date}-01`, {
        layer: 'career',
        kind: 'certificate',
        title: `🎓 ${cert.title}`,
        url: cert.url,
        image: cert.image,
        item: { logo: cert.logo, role: cert.issuer, place: (cert.skills || []).join(', ') || 'Certificado' },
      });
    });
  }

  if (state.layers.has('tasks')) {
    const tasks = storage.json(...KEYS.tasks)?.tasks;
    if (Array.isArray(tasks)) {
      tasks.forEach((task) => {
        if (task?.date) push(task.date, { layer: 'tasks', title: task.title || 'Tarea', done: !!task.done, task });
      });
    }
  }

  if (state.layers.has('gym')) {
    const gym = storage.json(...KEYS.gym) || {};
    const plan = storage.json(...KEYS.gymPlan) || {};
    const dates = new Set([
      ...Object.keys(gym.logs || {}),
      ...Object.keys(gym.checks || {}).filter((k) => gym.checks[k]).map((k) => k.split('|')[0]),
      ...Object.keys(plan.actual || {}),
    ]);
    dates.forEach((date) => {
      const log = gym.logs?.[date] || {};
      const ticks = Object.keys(gym.checks || {}).filter((k) => k.startsWith(`${date}|`) && gym.checks[k]).length;
      const workout = plan.actual?.[date]?.title || '';
      const weight = log.weight ? String(log.weight).replace('.', ',') : '';
      const title = workout || (ticks ? 'Entreno' : weight ? `${weight} kg` : 'Registro');
      push(date, { layer: 'gym', title, weight, ticks, workout, feeling: log.feeling || '', notes: log.notes || '' });
    });
  }

  return byDate;
}

/* ---------------------------------------------------------------- Rendering */

const viewNode = document.querySelector('[data-cal-view]');
const titleNode = document.querySelector('[data-cal-title]');

const chipLabel = (entry) => {
  if (entry.layer === 'events') return `${entry.emoji || '•'} ${entry.title}`;
  if (entry.layer === 'gym') return `💪 ${entry.title}`;
  if (entry.layer === 'tasks') return `${entry.done ? '✓' : '○'} ${entry.title}`;
  return entry.title;
};

function renderMonth() {
  const year = state.cursor.getFullYear();
  const month = state.cursor.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const cells = 42;
  const end = new Date(start);
  end.setDate(start.getDate() + cells - 1);

  const data = collect(iso(start), iso(end));
  const today = todayIso();
  titleNode.innerHTML = `${monthName(year, month)} <em>${year}</em>`;

  const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    .map((d) => `<span>${d}</span>`).join('');

  let html = `<div class="cal-weekdays" aria-hidden="true">${weekdays}</div><div class="cal-grid">`;
  for (let i = 0; i < cells; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const date = iso(day);
    const entries = data.get(date) || [];
    const outside = day.getMonth() !== month;
    const isBirthday = entries.some((e) => e.id === 'birthday');
    const chips = entries.slice(0, MAX_CHIPS).map((e) =>
      `<span class="chip chip-${e.layer}${e.done ? ' is-done' : ''}">${escapeHtml(chipLabel(e))}</span>`).join('');
    const more = entries.length > MAX_CHIPS ? `<span class="chip-more">+${entries.length - MAX_CHIPS}</span>` : '';
    const label = `${longDate(date)}${entries.length ? `, ${plural(entries.length, 'elemento', 'elementos')}` : ''}`;

    html += `<button type="button" class="cal-cell${outside ? ' is-outside' : ''}${date === today ? ' is-today' : ''}${isBirthday ? ' is-birthday' : ''}" data-date="${date}" aria-label="${escapeHtml(label)}">
      <span class="cal-num">${day.getDate()}</span>
      <span class="cal-chips">${chips}${more}</span>
      ${entries.length ? `<span class="cal-dots" aria-hidden="true">${[...new Set(entries.map((e) => e.layer))].map((l) => `<i class="dot-${l}"></i>`).join('')}</span>` : ''}
    </button>`;
  }
  html += '</div>';
  viewNode.innerHTML = html;
}

function renderYear() {
  const year = state.cursor.getFullYear();
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const data = collect(from, to);
  const today = todayIso();
  titleNode.innerHTML = `<em>${year}</em>`;

  // Career bands: one row per experience that overlaps this year.
  let bands = '';
  if (state.layers.has('career')) {
    const now = currentYm();
    const rows = [
      ...state.experience.work.map((i) => ({ ...i, kind: 'work' })),
      ...state.experience.education.map((i) => ({ ...i, kind: 'education' })),
      ...state.experience.volunteering.map((i) => ({ ...i, kind: 'volunteering' })),
    ].filter((i) => i.start <= `${year}-12` && (i.end || now) >= `${year}-01`)
      .sort((a, b) => a.start.localeCompare(b.start));

    // Certificates of this year, grouped by month, as one extra row of badges.
    const certs = state.experience.certificates.filter((c) => c.date.startsWith(`${year}-`));
    const firstOf = (m) => certs.find((c) => Number(c.date.slice(5, 7)) === m).date;
    const byMonth = new Map();
    certs.forEach((c) => {
      const m = Number(c.date.slice(5, 7));
      byMonth.set(m, [...(byMonth.get(m) || []), c]);
    });
    const certRow = certs.length ? `<div class="cal-band-row">
        <span class="cal-band-label"><span class="cal-cert-icon" aria-hidden="true">🎓</span>Certificados</span>
        <span class="cal-band-track">${[...byMonth].map(([m, list]) => `<button type="button" class="cal-cert" data-date="${firstOf(m).length === 10 ? firstOf(m) : `${firstOf(m)}-01`}" style="grid-column:${m};grid-row:1" title="${escapeHtml(list.map((c) => c.title).join(' · '))}">${list.length}</button>`).join('')}</span>
      </div>` : '';

    if (rows.length || certRow) {
      const months = Array.from({ length: 12 }, (_, m) => `<span>${monthName(year, m).slice(0, 3)}</span>`).join('');
      bands = `<section class="cal-bands" aria-label="Trayectoria en ${year}">
        <div class="cal-bands-head" aria-hidden="true"><span></span><span class="cal-bands-months">${months}</span></div>
        ${rows.map((row) => {
          const startM = row.start < `${year}-01` ? 1 : Number(row.start.slice(5));
          const endYm = row.end || now;
          const endM = endYm > `${year}-12` ? 12 : Number(endYm.slice(5));
          const ongoing = !row.end;
          return `<div class="cal-band-row">
            <span class="cal-band-label"><img src="${escapeHtml(row.logo)}" alt="" width="24" height="24">${escapeHtml(row.org)}</span>
            <span class="cal-band-track">
              <span class="cal-band cal-band-${row.kind}${ongoing ? ' is-ongoing' : ''}" style="grid-column:${startM} / ${endM + 1}" title="${escapeHtml(`${row.role} · ${shortYm(row.start)} – ${row.end ? shortYm(row.end) : 'hoy'}`)}">${escapeHtml(row.role)}</span>
            </span>
          </div>`;
        }).join('')}
        ${certRow}
      </section>`;
    }
  }

  let minis = '<div class="cal-minis">';
  for (let m = 0; m < 12; m += 1) {
    const first = new Date(year, m, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(year, m + 1, 0).getDate();
    let cells = '<span></span>'.repeat(offset);
    for (let d = 1; d <= days; d += 1) {
      const date = `${year}-${pad(m + 1)}-${pad(d)}`;
      const entries = data.get(date) || [];
      const layers = [...new Set(entries.map((e) => e.layer))];
      const cls = [
        date === today && 'is-today',
        entries.some((e) => e.id === 'birthday') && 'is-birthday',
        layers.length && `has-${layers[0]}`,
      ].filter(Boolean).join(' ');
      cells += `<span class="${cls}">${d}</span>`;
    }
    minis += `<button type="button" class="cal-mini" data-month="${m}">
      <span class="cal-mini-name">${monthName(year, m)}</span>
      <span class="cal-mini-grid">${cells}</span>
    </button>`;
  }
  minis += '</div>';

  viewNode.innerHTML = bands + minis;
}

function renderSide() {
  const today = todayIso();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 365);
  const upcoming = collect(today, iso(horizon));
  const nextNode = document.querySelector('[data-cal-next]');
  const nowNode = document.querySelector('[data-cal-now]');

  const items = [];
  [...upcoming.keys()].sort().forEach((date) => {
    upcoming.get(date).forEach((entry) => {
      if (entry.layer === 'gym' || (entry.layer === 'tasks' && entry.done)) return;
      items.push({ date, entry });
    });
  });

  const daysUntil = (date) => Math.round((parse(date) - parse(today)) / 86400000);
  const when = (date) => {
    const n = daysUntil(date);
    if (n === 0) return 'hoy';
    if (n === 1) return 'mañana';
    return `en ${n} días`;
  };

  nextNode.innerHTML = items.length
    ? items.slice(0, 6).map(({ date, entry }) => `<li>
        <button type="button" data-date="${date}" class="cal-next-item chip-${entry.layer}">
          <span class="cal-next-title">${escapeHtml(chipLabel(entry))}</span>
          <span class="cal-next-when">${escapeHtml(capitalise(parse(date).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })))} · ${when(date)}</span>
        </button>
      </li>`).join('')
    : '<li class="cal-empty">Nada a la vista. Disfruta.</li>';

  const now = currentYm();
  const active = [
    ...state.experience.work.map((i) => ({ ...i, kind: 'work' })),
    ...state.experience.education.map((i) => ({ ...i, kind: 'education' })),
    ...state.experience.volunteering.map((i) => ({ ...i, kind: 'volunteering' })),
  ].filter((i) => i.start <= now && (!i.end || i.end >= now));

  nowNode.innerHTML = active.length
    ? active.map((i) => `<li class="cal-now-item">
        <img src="${escapeHtml(i.logo)}" alt="" width="36" height="36">
        <span>
          <strong>${escapeHtml(i.role)}</strong>
          <span>${escapeHtml(i.org)} · desde ${escapeHtml(shortYm(i.start))} · ${duration(monthsBetween(i.start, now))}</span>
        </span>
      </li>`).join('')
    : '<li class="cal-empty">Entre etapas.</li>';
}

function render() {
  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.setAttribute('aria-selected', String(btn.dataset.view === state.view));
  });
  document.querySelectorAll('[data-layer]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(state.layers.has(btn.dataset.layer)));
  });
  viewNode.dataset.view = state.view;
  if (state.view === 'year') renderYear(); else renderMonth();
  renderSide();
}

/* ---------------------------------------------------------------- Day panel */

const dialog = document.querySelector('[data-cal-day]');
const dayBody = document.querySelector('[data-cal-day-body]');
const addForm = document.querySelector('[data-cal-add]');

function openDay(date) {
  state.selected = date;
  const entries = collect(date, date).get(date) || [];
  const groups = { events: [], career: [], tasks: [], gym: [] };
  entries.forEach((e) => groups[e.layer].push(e));
  const daysAway = Math.round((parse(date) - parse(todayIso())) / 86400000);

  document.querySelector('[data-cal-day-kicker]').textContent =
    daysAway === 0 ? 'Hoy' : daysAway === 1 ? 'Mañana' : daysAway === -1 ? 'Ayer'
      : daysAway > 0 ? `Dentro de ${daysAway} días` : `Hace ${-daysAway} días`;
  document.querySelector('[data-cal-day-title]').textContent = longDate(date);

  const section = (title, layer, body) => body ? `<section class="cal-day-group group-${layer}"><h3>${title}</h3>${body}</section>` : '';

  const events = groups.events.map((e) => `<div class="cal-day-item">
      <span class="cal-day-emoji">${escapeHtml(e.emoji || '•')}</span>
      <span class="cal-day-text"><strong>${escapeHtml(e.title)}</strong>${e.yearly ? '<small>Cada año</small>' : ''}</span>
      ${e.fixed ? '' : `<button type="button" class="cal-link-btn" data-delete-event="${escapeHtml(e.id)}">Quitar</button>`}
    </div>`).join('');

  const career = groups.career.map((e) => `<div class="cal-day-item">
      <img src="${escapeHtml(e.item.logo)}" alt="" width="36" height="36" class="cal-day-logo">
      <span class="cal-day-text"><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(e.item.role)} · ${escapeHtml(e.item.place)}</small></span>
      ${e.url ? `<a class="cal-link-btn" href="${escapeHtml(e.url)}" target="_blank" rel="noreferrer">Ver ↗</a>` : ''}
    </div>${e.image ? `<a class="cal-day-cert" href="${escapeHtml(e.url)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(e.image)}" alt="Certificado: ${escapeHtml(e.title.replace('🎓 ', ''))}" loading="lazy"></a>` : ''}`).join('');

  const tasks = groups.tasks.map((e) => `<div class="cal-day-item${e.done ? ' is-done' : ''}">
      <span class="cal-day-emoji">${e.done ? '✓' : '○'}</span>
      <span class="cal-day-text"><strong>${escapeHtml(e.title)}</strong>${e.task.note ? `<small>${escapeHtml(e.task.note)}</small>` : ''}</span>
    </div>`).join('');

  const gym = groups.gym.map((e) => `<div class="cal-day-item">
      <span class="cal-day-emoji">💪</span>
      <span class="cal-day-text">
        <strong>${escapeHtml(e.workout || (e.ticks ? 'Entreno' : 'Registro del día'))}</strong>
        <small>${[e.weight && `${escapeHtml(e.weight)} kg`, e.ticks && plural(e.ticks, 'ejercicio hecho', 'ejercicios hechos'), e.feeling && escapeHtml(e.feeling)].filter(Boolean).join(' · ')}</small>
        ${e.notes ? `<small>${escapeHtml(e.notes)}</small>` : ''}
      </span>
    </div>`).join('');

  dayBody.innerHTML = [
    section('Eventos', 'events', events),
    section('Trayectoria', 'career', career),
    section('Tareas', 'tasks', tasks && `${tasks}<a class="cal-link-btn" href="./planning.html">Abrir en Bubble →</a>`),
    section('Gym', 'gym', gym && `${gym}<a class="cal-link-btn" href="./gym.html">Abrir el gym →</a>`),
  ].join('') || '<p class="cal-empty">Día libre. Nada apuntado.</p>';

  addForm.reset();
  if (!dialog.open) dialog.showModal();
}

dayBody.addEventListener('click', (event) => {
  const id = event.target.closest('[data-delete-event]')?.dataset.deleteEvent;
  if (!id) return;
  writeEvents(readEvents().filter((e) => e.id !== id));
  render();
  openDay(state.selected);
});

addForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(addForm);
  const title = String(form.get('title') || '').trim();
  if (!title || !state.selected) return;
  const yearly = form.get('yearly') === 'on';
  const entry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    emoji: String(form.get('emoji') || '').trim() || '📌',
    title,
    date: state.selected,
    yearly,
  };
  if (yearly) entry.md = state.selected.slice(5);
  writeEvents([...readEvents(), entry]);
  render();
  openDay(state.selected);
});

dialog.addEventListener('click', (event) => {
  // Click on the backdrop closes the panel.
  if (event.target === dialog) dialog.close();
});

/* ---------------------------------------------------------------- Controls */

// One month (or one year) back or forward, with a slide in that direction.
function step(direction) {
  const c = state.cursor;
  state.cursor = state.view === 'year'
    ? new Date(c.getFullYear() + direction, c.getMonth(), 1)
    : new Date(c.getFullYear(), c.getMonth() + direction, 1);
  render();
  viewNode.classList.remove('slide-next', 'slide-prev');
  void viewNode.offsetWidth; // restart the animation
  viewNode.classList.add(direction > 0 ? 'slide-next' : 'slide-prev');
}

// Horizontal scroll (trackpad, or Shift + wheel) pages through dates. Deltas
// are added up until they pass a threshold, then input pauses briefly so one
// flick moves exactly one month.
const SWIPE_THRESHOLD = 90;
const SWIPE_COOLDOWN = 550;
let wheelSum = 0;
let wheelLockedUntil = 0;
let wheelResetTimer;

document.querySelector('.cal-main').addEventListener('wheel', (event) => {
  const dx = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
  if (Math.abs(dx) <= Math.abs(event.shiftKey ? 0 : event.deltaY)) return;
  event.preventDefault(); // also stops the browser's back/forward swipe
  if (Date.now() < wheelLockedUntil) return;

  wheelSum += dx;
  clearTimeout(wheelResetTimer);
  wheelResetTimer = setTimeout(() => { wheelSum = 0; }, 200);

  if (Math.abs(wheelSum) >= SWIPE_THRESHOLD) {
    step(wheelSum > 0 ? 1 : -1);
    wheelSum = 0;
    wheelLockedUntil = Date.now() + SWIPE_COOLDOWN;
  }
}, { passive: false });

// Touch swipe on phones and tablets.
let touchStart = null;
viewNode.addEventListener('touchstart', (event) => {
  const t = event.touches[0];
  touchStart = { x: t.clientX, y: t.clientY, time: Date.now() };
}, { passive: true });

viewNode.addEventListener('touchend', (event) => {
  if (!touchStart) return;
  const t = event.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  const quick = Date.now() - touchStart.time < 600;
  touchStart = null;
  if (quick && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    suppressClick = true;
    step(dx < 0 ? 1 : -1);
  }
}, { passive: true });

// A swipe that ends on a day should not also open that day.
let suppressClick = false;
viewNode.addEventListener('click', (event) => {
  if (!suppressClick) return;
  suppressClick = false;
  event.stopPropagation();
}, true);

document.addEventListener('click', (event) => {
  const dayBtn = event.target.closest('[data-date]');
  if (dayBtn && !dialog.contains(dayBtn)) {
    openDay(dayBtn.dataset.date);
    return;
  }

  const mini = event.target.closest('[data-month]');
  if (mini) {
    state.cursor = new Date(state.cursor.getFullYear(), Number(mini.dataset.month), 1);
    state.view = 'month';
    render();
    return;
  }

  const nav = event.target.closest('[data-nav]')?.dataset.nav;
  if (nav) {
    if (nav === 'today') {
      state.cursor = new Date();
      render();
    } else {
      step(nav === 'prev' ? -1 : 1);
    }
    return;
  }

  const view = event.target.closest('[data-view]')?.dataset.view;
  if (view) {
    state.view = view;
    render();
    return;
  }

  const layer = event.target.closest('[data-layer]')?.dataset.layer;
  if (layer) {
    if (state.layers.has(layer)) state.layers.delete(layer); else state.layers.add(layer);
    storage.set(KEYS.layers, JSON.stringify([...state.layers]));
    render();
  }
});

document.addEventListener('keydown', (event) => {
  if (dialog.open || event.target.closest('input, textarea')) return;
  if (event.key === 'ArrowLeft') document.querySelector('[data-nav="prev"]').click();
  if (event.key === 'ArrowRight') document.querySelector('[data-nav="next"]').click();
});

/* ------------------------------------------------------------------- Theme */

const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches);

document.querySelector('[data-theme-toggle]').addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  root.dataset.theme = next;
  storage.set('theme', next);
});

// Other tabs (portfolio, gym, Bubble) may change data, theme or accent.
window.addEventListener('storage', (event) => {
  if (event.key === 'theme' && event.newValue) root.dataset.theme = event.newValue;
  if (event.key === 'accent' && event.newValue) root.dataset.accent = event.newValue;
  render();
});

/* -------------------------------------------------------------------- Boot */

// Deep links: #2027-02-22 opens that day, #2026 opens that year.
function applyHash() {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (/^\d{4}-\d{2}-\d{2}$/.test(hash)) {
    state.view = 'month';
    state.cursor = parse(hash);
    render();
    openDay(hash);
  } else if (/^\d{4}$/.test(hash)) {
    state.view = 'year';
    state.cursor = new Date(Number(hash), 0, 1);
    render();
  }
}

window.addEventListener('hashchange', applyHash);

render();

fetch('./data/experience.json')
  .then((res) => (res.ok ? res.json() : null))
  .then((data) => {
    if (!data) return;
    state.experience = {
      work: data.work || [],
      education: data.education || [],
      volunteering: data.volunteering || [],
      certificates: data.certificates || [],
    };
    render();
    applyHash();
  })
  .catch(() => { /* offline or file:// — the other layers still work */ });
