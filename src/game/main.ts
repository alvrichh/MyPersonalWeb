import './game.css';
import { storage } from '../lib/storage';
import { draw, type Palette, type View } from './draw';
import { makeT, pickLang, type Key } from './strings';
import { CATEGORY, H, W, chooseSkill, isBossRoom, newGame, ownedWeapons, update, type Category, type Game, type Input, type SkillId } from './world';

/* Bug Hunter's page: screens, input (touch joystick or keyboard) and the
   frame loop. The rules are in world.ts, the drawing in draw.ts. */

const lang = pickLang();
const t = makeT(lang);
document.documentElement.lang = lang;
document.title = `${t('title')} · alvrich`;

// The player wears the portfolio's accent (dark-mode tones: the arena is dark).
const PALETTES: Record<string, [string, string]> = {
  blue: ['#6c98ff', '#7ad8ff'],
  green: ['#67dfa0', '#7de0c7'],
  red: ['#ff6f79', '#ffad7b'],
  orange: ['#ff9e4c', '#ffb86f'],
  yellow: ['#ffd45f', '#ffbf68'],
  pink: ['#ff79c9', '#ffc58f'],
  white: ['#edf2fb', '#ffffff'],
};
const accentName = storage.get('accent') || 'blue';
const [accent, accent2] = PALETTES[accentName] ?? PALETTES.blue;
const palette: Palette = { accent, accent2, ink: '#07090f', rainbow: accentName === 'rainbow' };
document.documentElement.style.setProperty('--accent', accent);
document.documentElement.style.setProperty('--accent-2', accent2);
if (palette.rainbow) document.documentElement.dataset.rainbow = '';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('stage');
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const screen = $<HTMLElement>('screen');
const toast = $<HTMLElement>('toast');
const hudRoom = $<HTMLElement>('hudRoom');
const hudLevel = $<HTMLElement>('hudLevel');
const hudXp = $<HTMLElement>('hudXp');
const hudGear = $<HTMLElement>('hudGear');
const bossBar = $<HTMLElement>('bossBar');
const bossHp = $<HTMLElement>('bossHp');
const pauseBtn = $<HTMLButtonElement>('pauseBtn');
$<HTMLElement>('bossName').textContent = t('boss');
$<HTMLAnchorElement>('backLink').setAttribute('aria-label', t('back'));
pauseBtn.setAttribute('aria-label', t('pause'));

const touch = window.matchMedia('(hover: none)').matches;
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ records */

type Best = { room: number; time?: number };
const readBest = (): Best => {
  try {
    return JSON.parse(storage.get('bugHunterBest') || '') as Best;
  } catch {
    return { room: 0 };
  }
};
const saveBest = (g: Game) => {
  const best = readBest();
  const won = g.phase === 'won';
  const better = won ? best.time === undefined || g.time < best.time : best.time === undefined && g.room > (best.room || 0);
  if (better) storage.set('bugHunterBest', JSON.stringify(won ? { room: 10, time: g.time } : { room: g.room }));
};
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const bestLine = () => {
  const best = readBest();
  if (best.time !== undefined) return t('bestWin', { time: clock(best.time) });
  return best.room ? t('best', { room: best.room }) : '';
};

/* ------------------------------------------------------------------ screens */

const ICONS: Record<SkillId, string> = {
  sword: '🗡️', blades: '🌀', hammer: '🔨',
  storm: '🌩️', fireball: '☄️', frost: '❄️', spirits: '👻',
  knives: '🔪', boomerang: '🪃',
  fire: '🔥', water: '💧', leaf: '🍃', bolt: '⚡', spark: '✨', ghost: '🫥', double: '🏹', speed: '⏩',
  power: '💥', heart: '💗',
};
const CATEGORY_LABEL: Record<Category, Key> = { melee: 'catMelee', magic: 'catMagic', ranged: 'catRanged', upgrade: 'catUpgrade' };

let game: Game | null = null;
let paused = false;
let shownChoices = '';

function show(html: string, wide = false) {
  screen.innerHTML = `<div class="panel${wide ? ' panel-wide' : ''}">${html}</div>`;
  screen.hidden = false;
}
function hide() {
  screen.hidden = true;
  screen.innerHTML = '';
}

function startScreen() {
  show(`
    <p class="kicker">alvrich</p>
    <h1>${t('title')}</h1>
    <p>${t('tagline')}</p>
    <p class="how">${t(touch ? 'howTouch' : 'howKeys')}</p>
    <button class="primary" data-act="play">${t('play')}</button>
    <p class="best">${bestLine()}</p>
    <a class="link" href="./index.html">← ${t('back')}</a>`);
}

function endScreen(g: Game) {
  const won = g.phase === 'won';
  saveBest(g);
  show(`
    <p class="kicker">${t('sprint', { room: g.room })}</p>
    <h1>${t(won ? 'won' : 'over')}</h1>
    <p>${t(won ? 'wonText' : 'overText', { room: g.room, kills: g.kills, time: clock(g.time) })}</p>
    <button class="primary" data-act="play">${t('again')}</button>
    <p class="best">${bestLine()}</p>
    <a class="link" href="./index.html">← ${t('back')}</a>`);
}

function choiceScreen(g: Game) {
  const cards = g.choices
    .map((id) => {
      const name = t(`${id}Name` as Key);
      const text = t(`${id}Text` as Key);
      const cat = CATEGORY[id];
      const fresh = cat !== 'upgrade' && g.skills[id] === 0;
      const level = id === 'heart' ? '' : `<span class="lvl">${fresh ? t('newWeapon') : t('skillLevel', { level: g.skills[id] + 1 })}</span>`;
      return `<button class="skill skill-${cat}" data-skill="${id}"><span class="icon" aria-hidden="true">${ICONS[id]}</span><span class="cat">${t(CATEGORY_LABEL[cat])}</span><b>${name}</b><span>${text}</span>${level}</button>`;
    })
    .join('');
  show(`<p class="kicker">${t('level', { level: g.level })}</p><h2>${t('levelUp')}</h2><p>${t('choose')}</p><div class="skills">${cards}</div>`, true);
}

function pauseScreen() {
  show(`<h2>${t('paused')}</h2><button class="primary" data-act="resume">${t('resume')}</button><button class="ghost" data-act="quit">${t('quit')}</button>`);
}

screen.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-act], [data-skill]');
  if (!target) return;
  const act = target.dataset.act;
  if (act === 'play') {
    game = newGame();
    paused = false;
    shownChoices = '';
    hide();
    flash(t('sprint', { room: 1 }));
  } else if (act === 'resume') {
    paused = false;
    hide();
  } else if (act === 'quit') {
    paused = false;
    game = null;
    startScreen();
  } else if (target.dataset.skill && game) {
    chooseSkill(game, target.dataset.skill as SkillId);
    shownChoices = '';
    hide();
  }
});

pauseBtn.addEventListener('click', () => togglePause());
function togglePause(force?: boolean) {
  if (!game || game.phase !== 'play') return;
  paused = force ?? !paused;
  if (paused) pauseScreen();
  else hide();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) togglePause(true);
});

let toastTimer: number | undefined;
function flash(text: string) {
  toast.textContent = text;
  toast.hidden = false;
  toast.classList.remove('is-on');
  void toast.offsetWidth;
  toast.classList.add('is-on');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 1800);
}

/* -------------------------------------------------------------------- input */

const keys = new Set<string>();
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'escape' || key === 'p') { togglePause(); return; }
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    keys.add(key);
    event.preventDefault();
  }
});
window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

// Floating joystick: wherever the finger lands is the centre.
const stick = { on: false, id: -1, ox: 0, oy: 0, x: 0, y: 0 };
const STICK = 46;
canvas.addEventListener('pointerdown', (event) => {
  if (stick.on) return;
  stick.on = true;
  stick.id = event.pointerId;
  stick.ox = stick.x = event.clientX;
  stick.oy = stick.y = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!stick.on || event.pointerId !== stick.id) return;
  stick.x = event.clientX;
  stick.y = event.clientY;
});
const release = (event: PointerEvent) => {
  if (event.pointerId !== stick.id) return;
  stick.on = false;
  stick.id = -1;
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);

function readInput(): Input {
  if (stick.on) {
    const dx = stick.x - stick.ox;
    const dy = stick.y - stick.oy;
    const len = Math.hypot(dx, dy);
    if (len < 6) return { x: 0, y: 0 };
    const k = Math.min(1, len / STICK) / len;
    return { x: dx * k, y: dy * k };
  }
  const x = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
  const y = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
  return { x, y };
}

/* --------------------------------------------------------------- the frame */

const view: View = { scale: 1, ox: 0, oy: 0, dpr: 1 };
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const top = 86; // room for the HUD and the weapons row
  const scale = Math.min(width / W, (height - top - 8) / H);
  view.scale = scale;
  view.dpr = dpr;
  view.ox = (width - W * scale) / 2;
  view.oy = top + (height - top - 8 - H * scale) / 2;
}
window.addEventListener('resize', resize);
resize();

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  const g = game;
  if (g && !paused && g.phase === 'play') {
    update(g, dt, readInput());
    if (calm) g.shake = 0;
    for (const event of g.events) {
      if (event === 'clear') flash(t('doorOpen'));
      if (event === 'room') flash(t('sprint', { room: g.room }));
      if (event === 'boss') flash(`${t('sprint', { room: g.room })} · ${t('boss')}`);
    }
    // update() may have moved the game on (TypeScript still thinks it's 'play').
    const phase = g.phase as Game['phase'];
    if (phase === 'levelup' && shownChoices !== g.choices.join()) {
      shownChoices = g.choices.join();
      stick.on = false;
      keys.clear();
      choiceScreen(g);
    }
    if (phase === 'over' || phase === 'won') endScreen(g);
  }

  if (g) {
    draw(ctx, g, view, palette, now / 1000);
    hudRoom.textContent = t('sprint', { room: g.room });
    hudLevel.textContent = t('level', { level: g.level });
    hudXp.style.width = `${(g.xp / g.xpNext) * 100}%`;
    const gear = ['🏹1', ...ownedWeapons(g).map((id) => `${ICONS[id]}${g.skills[id]}`)].join(' ');
    if (hudGear.dataset.gear !== gear) {
      hudGear.dataset.gear = gear;
      hudGear.innerHTML = gear.split(' ').map((item) => `<span>${item.slice(0, -1)}<sub>${item.slice(-1)}</sub></span>`).join('');
    }
    const boss = isBossRoom(g.room) ? g.enemies.find((e) => e.kind === 'boss' && e.spawn <= 0) : undefined;
    bossBar.hidden = !boss;
    if (boss) bossHp.style.width = `${(Math.max(0, boss.hp) / boss.maxHp) * 100}%`;
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#07090f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Joystick, drawn in screen pixels.
  if (stick.on && g && g.phase === 'play' && !paused) {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    const rect = canvas.getBoundingClientRect();
    const cx = stick.ox - rect.left;
    const cy = stick.oy - rect.top;
    const dx = stick.x - stick.ox;
    const dy = stick.y - stick.oy;
    const len = Math.hypot(dx, dy) || 1;
    const k = Math.min(len, STICK) / len;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, STICK, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(cx + dx * k, cy + dy * k, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
}

startScreen();
requestAnimationFrame(frame);
