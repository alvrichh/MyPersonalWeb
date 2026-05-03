'use strict';

const MONTHLY_PLAN_KEY = 'alvrichGymMonthlyPlanV1';
const GYM_STORE_KEYS = ['alvrichGymMayAutoV2', 'alvrichGymMayAutoV1'];

const monthlyPlan = {
  Lunes: {
    title: 'Espalda + bíceps + cardio',
    cardio: '20 min de cinta inclinada o bici al final.',
    exercises: [
      ['Jalón al pecho', '4 x 8-12'],
      ['Remo sentado en polea', '4 x 10-12'],
      ['Remo con mancuerna o máquina', '3 x 10-12'],
      ['Pullover en polea', '3 x 12-15'],
      ['Curl bíceps', '3 x 10-12'],
      ['Curl martillo', '3 x 12'],
    ],
  },
  Martes: {
    title: 'Piernas + core',
    cardio: '10-15 min suave. Pierna fuerte, cardio sin matarte.',
    exercises: [
      ['Prensa de piernas', '4 x 10-12'],
      ['Hack squat o sentadilla goblet', '3 x 10-12'],
      ['Curl femoral', '4 x 10-12'],
      ['Extensión cuádriceps', '3 x 12-15'],
      ['Gemelos', '4 x 12-20'],
      ['Plancha', '3 x 40 s'],
    ],
  },
  Miércoles: {
    title: 'Pecho + tríceps + cardio',
    cardio: '20-30 min de cardio final a ritmo medio.',
    exercises: [
      ['Press pecho máquina o banca', '4 x 8-12'],
      ['Press inclinado con mancuernas', '3 x 10-12'],
      ['Aperturas en máquina o polea', '3 x 12-15'],
      ['Fondos asistidos o press cerrado', '3 x 8-12'],
      ['Tríceps en polea', '3 x 12-15'],
      ['Extensión tríceps por encima cabeza', '2 x 12-15'],
    ],
  },
  Jueves: {
    title: 'Hombros + abdomen',
    cardio: '15-20 min suave/medio al final.',
    exercises: [
      ['Press hombro máquina o mancuernas', '4 x 8-12'],
      ['Elevaciones laterales', '4 x 12-15'],
      ['Reverse pec deck / pájaros', '3 x 12-15'],
      ['Encogimientos trapecio', '3 x 12'],
      ['Elevaciones de piernas', '3 x 12-15'],
      ['Crunch máquina', '3 x 15'],
    ],
  },
  Viernes: {
    title: 'Full upper + brazos',
    cardio: '15-20 min final. Día para rematar torso y brazos.',
    exercises: [
      ['Jalón al pecho', '3 x 10-12'],
      ['Press pecho máquina', '3 x 10-12'],
      ['Remo sentado', '3 x 10-12'],
      ['Elevaciones laterales', '3 x 12-15'],
      ['Curl bíceps barra o máquina', '3 x 10-12'],
      ['Tríceps polea', '3 x 12'],
    ],
  },
  Sábado: {
    title: 'Cardio largo + movilidad',
    cardio: '45-60 min cardio. Ritmo constante, sudar sin reventarte.',
    exercises: [
      ['Cardio largo', '45-60 min'],
      ['Movilidad cadera/espalda', '10 min'],
      ['Estiramientos suaves', '10 min'],
      ['Core opcional', '2-3 series'],
    ],
  },
  Domingo: {
    title: 'Descanso activo editable',
    cardio: 'Puedes cambiarlo por paseo, movilidad, descanso total o lo que realmente hagas.',
    exercises: [
      ['Caminar', '8.000-12.000 pasos'],
      ['Movilidad o estiramientos', '10-15 min'],
      ['Preparar semana', 'comida + ropa gym'],
    ],
  },
};

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
};

const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const readGymStore = () => {
  for (const key of GYM_STORE_KEYS) {
    const value = localStorage.getItem(key);
    if (!value) continue;
    try { return JSON.parse(value); } catch (error) {}
  }
  return { logs: {}, checks: {}, exerciseNotes: {} };
};

const writeGymStore = (value) => writeJson(GYM_STORE_KEYS[0], value);

const isoToday = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const dayName = (date) => ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date(`${date}T12:00:00`).getDay()];
const getPlanForDate = (date) => monthlyPlan[dayName(date)] || monthlyPlan.Lunes;
const today = isoToday();

const ensureStyles = () => {
  if (document.querySelector('[data-gym-monthly-plan-style]')) return;
  const style = document.createElement('style');
  style.setAttribute('data-gym-monthly-plan-style', 'true');
  style.textContent = `
    .actualLogCard{border:1px solid rgba(112,225,161,.28);background:rgba(112,225,161,.07);border-radius:20px;padding:14px;margin:12px 0}.actualLogCard h3{margin:0 0 10px}.extraExerciseGrid{display:grid;gap:8px;margin-top:10px}.extraExerciseRow{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.extraExerciseRow button{border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.06);color:var(--text);padding:8px 10px;font-weight:900}.recommendedTag{display:inline-flex;margin-top:5px;color:var(--accent);font-size:.68rem;font-weight:900}.calPlanTitle{font-size:.64rem;color:var(--accent);line-height:1.12;font-weight:900;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.gym-modal-plan{border:1px solid rgba(112,225,161,.22);border-radius:18px;background:rgba(112,225,161,.07);padding:13px}.gym-modal-plan span{display:block;color:var(--accent);font-size:.78rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px}.gym-modal-plan ul{margin:8px 0 0;padding-left:18px;color:var(--muted);line-height:1.45}.gym-modal-plan p{margin:0;color:var(--text);line-height:1.45}.gym-modal-plan strong{color:var(--text)}
  `;
  document.head.appendChild(style);
};

const readMonthly = () => readJson(MONTHLY_PLAN_KEY, { actual: {}, extra: {} });
const writeMonthly = (value) => writeJson(MONTHLY_PLAN_KEY, value);

const exerciseKey = (date, index) => `${date}|${index}`;
const extraKey = (date, index) => `${date}|extra-${index}`;

const getActual = (date) => readMonthly().actual?.[date] || {};
const setActual = (date, patch) => {
  const data = readMonthly();
  data.actual = data.actual || {};
  data.actual[date] = { ...(data.actual[date] || {}), ...patch, updatedAt: new Date().toISOString() };
  writeMonthly(data);
};

const getExtra = (date) => readMonthly().extra?.[date] || [];
const setExtra = (date, extra) => {
  const data = readMonthly();
  data.extra = data.extra || {};
  data.extra[date] = extra;
  writeMonthly(data);
};

const renderTodayEnhanced = () => {
  const target = document.getElementById('todayTraining');
  if (!target) return;

  const store = readGymStore();
  const plan = getPlanForDate(today);
  const actual = getActual(today);
  const extra = getExtra(today);
  const currentDayName = dayName(today);

  target.innerHTML = `
    <div class="today"><strong>Rutina recomendada:</strong> ${currentDayName} · ${plan.title}<br><span class="small">Puedes seguirla tal cual, saltarte cosas o añadir lo que hayas hecho realmente.</span></div>
    <section class="actualLogCard">
      <h3>Lo que he hecho hoy</h3>
      <label>Título real del entreno<input id="actualWorkoutTitle" class="input" placeholder="Ej: Espalda fuerte + cardio" value="${actual.title || ''}"></label>
      <label style="margin-top:10px">Descripción real<textarea id="actualWorkoutDescription" placeholder="Ej: hice jalón, remo, curl y 25 min de cinta. Me faltó una serie de bíceps.">${actual.description || ''}</textarea></label>
      <button class="save" id="saveActualWorkout">Guardar descripción</button>
      <p class="small" id="actualSavedMsg"></p>
    </section>
    <article class="day"><div class="dayHead"><h2>${plan.title}</h2><p>${currentDayName} · ${today}</p></div><div class="content" style="display:block"><h3 class="sectionTitle">Ejercicios recomendados</h3>${plan.exercises.map((e,i)=>{const key=exerciseKey(today,i);return `<div class="exercise"><div class="exerciseTop"><input class="check" type="checkbox" data-check="${key}" ${store.checks&&store.checks[key]?'checked':''}><div class="exMain"><b>${e[0]}</b><span>${e[1]}</span><textarea class="miniNote" data-note="${key}" placeholder="Opcional: peso usado, reps reales, si faltó algo...">${store.exerciseNotes&&store.exerciseNotes[key]||''}</textarea></div></div></div>`}).join('')}<h3 class="sectionTitle">Añadir ejercicios extra</h3><div class="extraExerciseGrid" id="extraExerciseList">${extra.map((item,index)=>renderExtraRow(today,item,index,store)).join('')}</div><label style="margin-top:10px">Nuevo ejercicio<input id="extraExerciseName" class="input" placeholder="Ej: Abdominales, press, bici..."></label><label style="margin-top:8px">Series / detalle<input id="extraExerciseDetail" class="input" placeholder="Ej: 3 x 12 o 20 min"></label><button class="ghost" id="addExtraExercise">Añadir ejercicio</button><h3 class="sectionTitle">Cardio / nota recomendada</h3><p class="small">${plan.cardio}</p></div></article>`;

  bindTodayEnhanced();
};

const renderExtraRow = (date, item, index, store) => {
  const key = extraKey(date, index);
  return `<div class="exercise"><div class="exerciseTop"><input class="check" type="checkbox" data-check="${key}" ${store.checks&&store.checks[key]?'checked':''}><div class="exMain"><b>${item.name}</b><span>${item.detail || 'Extra personalizado'}</span><textarea class="miniNote" data-note="${key}" placeholder="Nota del extra...">${store.exerciseNotes&&store.exerciseNotes[key]||''}</textarea><div class="extraExerciseRow"><span class="small">Ejercicio añadido por ti</span><button type="button" data-remove-extra="${index}">Quitar</button></div></div></div></div>`;
};

const bindTodayEnhanced = () => {
  document.querySelectorAll('[data-check]').forEach((el) => el.addEventListener('change', () => {
    const data = readGymStore();
    data.checks = data.checks || {};
    data.checks[el.dataset.check] = el.checked;
    writeGymStore(data);
    window.renderCalendar?.();
  }));

  document.querySelectorAll('[data-note]').forEach((el) => el.addEventListener('input', () => {
    const data = readGymStore();
    data.exerciseNotes = data.exerciseNotes || {};
    data.exerciseNotes[el.dataset.note] = el.value;
    writeGymStore(data);
    window.renderCalendar?.();
  }));

  document.getElementById('saveActualWorkout')?.addEventListener('click', () => {
    setActual(today, {
      title: document.getElementById('actualWorkoutTitle')?.value.trim() || '',
      description: document.getElementById('actualWorkoutDescription')?.value.trim() || '',
    });
    const msg = document.getElementById('actualSavedMsg');
    if (msg) msg.textContent = 'Entreno real guardado para hoy.';
    window.renderCalendar?.();
  });

  document.getElementById('addExtraExercise')?.addEventListener('click', () => {
    const name = document.getElementById('extraExerciseName')?.value.trim();
    const detail = document.getElementById('extraExerciseDetail')?.value.trim();
    if (!name) return;
    const extra = getExtra(today);
    extra.push({ name, detail });
    setExtra(today, extra);
    renderTodayEnhanced();
    window.renderCalendar?.();
  });

  document.querySelectorAll('[data-remove-extra]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.removeExtra);
    const extra = getExtra(today).filter((_, itemIndex) => itemIndex !== index);
    setExtra(today, extra);
    renderTodayEnhanced();
    window.renderCalendar?.();
  }));
};

const decorateCalendarWithPlan = () => {
  const grid = document.getElementById('calendarGrid');
  const title = document.getElementById('calendarTitle')?.textContent?.trim().toLowerCase() || '';
  if (!grid) return;

  const monthMap = { enero:0, febrero:1, marzo:2, abril:3, mayo:4, junio:5, julio:6, agosto:7, septiembre:8, setiembre:8, octubre:9, noviembre:10, diciembre:11 };
  const match = title.match(/^([a-záéíóúüñ]+)\s+de\s+(\d{4})$/i);
  const now = new Date();
  const year = match ? Number(match[2]) : now.getFullYear();
  const month = match ? (monthMap[match[1]] ?? now.getMonth()) : now.getMonth();

  grid.querySelectorAll('.calDay:not(.empty)').forEach((cell) => {
    const day = cell.querySelector('.dayNum')?.textContent?.trim();
    if (!day || cell.querySelector('.calPlanTitle')) return;
    const date = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const actual = getActual(date);
    const plan = getPlanForDate(date);
    const label = actual.title || plan.title;
    const tag = document.createElement('div');
    tag.className = 'calPlanTitle';
    tag.textContent = label;
    cell.appendChild(tag);
  });
};

const enhanceCalendarModal = (date) => {
  const body = document.querySelector('[data-gym-modal-body]');
  if (!body || body.querySelector('[data-modal-plan-extra]')) return;

  const plan = getPlanForDate(date);
  const actual = getActual(date);
  const extra = getExtra(date);
  const panel = document.createElement('div');
  panel.className = 'gym-modal-plan';
  panel.setAttribute('data-modal-plan-extra', 'true');
  panel.innerHTML = `
    <span>Rutina / tareas del día</span>
    <p><strong>${actual.title || plan.title}</strong></p>
    ${actual.description ? `<p>${actual.description}</p>` : `<p class="small">Rutina recomendada para ${dayName(date)}. Puedes editar lo real desde Hoy.</p>`}
    <ul>${plan.exercises.map(([name, detail]) => `<li>${name} · ${detail}</li>`).join('')}${extra.map((item) => `<li>${item.name} · ${item.detail || 'Extra'}</li>`).join('')}</ul>
  `;
  body.prepend(panel);
};

const hookCalendarModalEnhancement = () => {
  document.addEventListener('click', (event) => {
    const cell = event.target.closest('.calDay:not(.empty)');
    const date = cell?.dataset?.date;
    if (!date) return;
    window.setTimeout(() => enhanceCalendarModal(date), 80);
  }, true);
};

const patchRenderCalendar = () => {
  if (typeof window.renderCalendar === 'function' && !window.renderCalendar.__monthlyPlanPatched) {
    const original = window.renderCalendar;
    window.renderCalendar = function patchedRenderCalendar(...args) {
      const result = original.apply(this, args);
      window.requestAnimationFrame(decorateCalendarWithPlan);
      return result;
    };
    window.renderCalendar.__monthlyPlanPatched = true;
  }
  decorateCalendarWithPlan();
};

const initMonthlyPlan = () => {
  ensureStyles();
  renderTodayEnhanced();
  patchRenderCalendar();
  hookCalendarModalEnhancement();
  window.requestAnimationFrame(decorateCalendarWithPlan);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMonthlyPlan);
} else {
  initMonthlyPlan();
}
