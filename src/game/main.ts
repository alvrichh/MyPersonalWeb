import './game.css';
import { storage } from '../lib/storage';
import { audio, type Sfx } from './audio';
import { draw, type Palette, type View } from './draw';
import { loadSave, writeSave, STYLES, type EnemyStyle } from './save';
import { ITEMS, SLOTS, buildLoadout, itemById, type ItemId, type Slot } from './shop';
import { Scene } from './scene';
import { makeT, pickLang, type Key } from './strings';
import {
  CATEGORY, H, W, WORLDS, WORLD_COUNT, chooseSkill, isBossRoom, newGame, ownedWeapons, update,
  type Category, type Game, type GameEvent, type Input, type Look, type SkillId,
} from './world';

/* Bug Hunter's page: the menus (play, shop, enemy looks, options), input
   (touch joystick or keyboard), sound hooks and the frame loop. The rules are
   in world.ts, the drawing in draw.ts, the music in audio.ts. */

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
const hud = $<HTMLElement>('hud');
const hudRoom = $<HTMLElement>('hudRoom');
const hudLevel = $<HTMLElement>('hudLevel');
const hudXp = $<HTMLElement>('hudXp');
const hudGear = $<HTMLElement>('hudGear');
const hudCoins = $<HTMLElement>('hudCoins');
const bossBar = $<HTMLElement>('bossBar');
const bossName = $<HTMLElement>('bossName');
const bossHp = $<HTMLElement>('bossHp');
const pauseBtn = $<HTMLButtonElement>('pauseBtn');
$<HTMLAnchorElement>('backLink').setAttribute('aria-label', t('back'));
pauseBtn.setAttribute('aria-label', t('pause'));

const touch = window.matchMedia('(hover: none)').matches;
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------------------------------------------------------------- the save */

const save = loadSave();
const persist = () => writeSave(save);
audio.setVolumes(save.music, save.sfx);
palette.hat = save.equipped.head;

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const bestLine = (world = save.world) => {
  const best = save.bestByWorld[world];
  if (!best) return '';
  if (best.time !== undefined) return t('bestWin', { time: clock(best.time) });
  return best.room ? t('best', { room: best.room }) : '';
};
const worldName = (n: number) => t(`world${n}Name` as Key);
const WORLD_ICON = ['🐞', '🔥', '💧', '🍃', '⚡', '✨', '👻', '💗'];
const coinsLine = (n = save.coins) => `<span class="coin">🪙</span> ${Math.floor(n)}`;

/** Banks the coins and the record; returns the world unlocked by this run, if any. */
function bankRun(g: Game): number | null {
  const won = g.phase === 'won';
  const best = save.bestByWorld[g.world] ?? { room: 0 };
  const better = won ? best.time === undefined || g.time < best.time : best.time === undefined && g.room > (best.room || 0);
  if (better) save.bestByWorld[g.world] = won ? { room: 10, time: g.time } : { room: g.room };
  if (g.world === 1) save.best = save.bestByWorld[1];
  save.coins += Math.floor(g.coins);
  save.runs += 1;
  let unlocked: number | null = null;
  if (won && g.world < WORLD_COUNT && save.unlocked < g.world + 1) {
    save.unlocked = g.world + 1;
    save.world = g.world + 1;
    unlocked = g.world + 1;
  }
  persist();
  return unlocked;
}

/* ------------------------------------------------------------------ screens */

const ICONS: Record<SkillId, string> = {
  sword: '🗡️', blades: '🌀', hammer: '🔨',
  storm: '🌩️', fireball: '☄️', frost: '❄️', spirits: '👻',
  knives: '🔪', boomerang: '🪃',
  fire: '🔥', water: '💧', leaf: '🍃', bolt: '⚡', spark: '✨', ghost: '🫥', double: '🏹', speed: '⏩',
  power: '💥', heart: '💗',
};
const CATEGORY_LABEL: Record<Category, Key> = { melee: 'catMelee', magic: 'catMagic', ranged: 'catRanged', upgrade: 'catUpgrade' };
const SLOT_LABEL: Record<Slot, Key> = { head: 'slotHead', charm: 'slotCharm', relic: 'slotRelic' };
const STYLE_ICON: Record<EnemyStyle, string> = { world: '🌍', original: '🐞', demon: '😈', viking: '🪓', jungle: '🕷️', greek: '🏛️', robot: '🤖', nightmare: '💀', random: '🎲' };
const BOSS_NAME: Record<Look, Key> = { original: 'bossOriginal', demon: 'bossDemon', viking: 'bossViking', jungle: 'bossJungle', greek: 'bossGreek', robot: 'bossRobot', nightmare: 'bossNightmare' };

let game: Game | null = null;
let paused = false;
let shownChoices = '';
/** Where the Options screen goes back to. */
let optionsFrom: 'menu' | 'pause' = 'menu';

function show(html: string, wide = false, menu = false) {
  screen.innerHTML = `<div class="panel${wide ? ' panel-wide' : ''}">${html}</div>`;
  screen.classList.toggle('is-menu', menu);
  screen.hidden = false;
  screen.scrollTop = 0;
}
function hide() {
  screen.hidden = true;
  screen.innerHTML = '';
}
const backButton = (act: string, label: Key = 'menu') => `<button class="ghost" data-act="${act}">← ${t(label)}</button>`;

function menuScreen() {
  game = null;
  hud.hidden = true;
  hudGear.hidden = true;
  bossBar.hidden = true;
  audio.setIntensity(0);
  show(`
    <p class="kicker">alvrich</p>
    <h1 class="title">${t('title')}</h1>
    <p>${t('tagline')}</p>
    <p class="how">${t(touch ? 'howTouch' : 'howKeys')}</p>
    <button class="primary big" data-act="play">▶ ${t('playNow')}<small>${WORLD_ICON[save.world - 1]} ${worldName(save.world)}</small></button>
    <div class="menu-grid">
      <button class="ghost" data-act="map"><span class="icon">🗺️</span>${t('map')}<small>${save.unlocked}/${WORLD_COUNT}</small></button>
      <button class="ghost" data-act="shop"><span class="icon">🛒</span>${t('shop')}<small>${coinsLine()}</small></button>
      <button class="ghost" data-act="styles"><span class="icon">${STYLE_ICON[save.style]}</span>${t('styles')}<small>${t(`style${cap(save.style)}Name` as Key)}</small></button>
      <button class="ghost" data-act="options"><span class="icon">${save.music === 0 && save.sfx === 0 ? '🔇' : '🔊'}</span>${t('options')}</button>
    </div>
    <p class="best">${bestLine()}</p>
    <a class="link" href="./index.html">← ${t('back')}</a>`, false, true);
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function endScreen(g: Game) {
  const won = g.phase === 'won';
  const earned = Math.floor(g.coins);
  const unlocked = bankRun(g);
  audio.play(won ? 'win' : 'over');
  audio.setIntensity(0);
  const next = unlocked
    ? `<p class="unlocked">${WORLD_ICON[unlocked - 1]} ${t('unlockedWorld', { n: unlocked })}<small>${worldName(unlocked)}</small></p>
       <button class="primary" data-act="map">🗺️ ${t('toMap')}</button>
       <button class="ghost" data-act="play-same">${t('again')}</button>`
    : `<button class="primary" data-act="play-same">${t('again')}</button>`;
  show(`
    <p class="kicker">${worldName(g.world)} · ${t('sprint', { room: g.room })}</p>
    <h1>${t(won ? 'won' : 'over')}</h1>
    <p>${t(won ? 'wonText' : 'overText', { room: g.room, kills: g.kills, time: clock(g.time) })}</p>
    <p class="earned">${coinsLine(earned)} <small>${t('coinsRun', { coins: earned })}</small></p>
    ${next}
    <div class="row">
      <button class="ghost" data-act="shop">🛒 ${t('shop')}</button>
      <button class="ghost" data-act="menu">${t('menu')}</button>
    </div>
    <p class="best">${bestLine(g.world)}</p>`);
}

/** The world map: a winding path with one stop per world and you on the picked one. */
function mapScreen() {
  const stops = WORLDS.map((def, i) => {
    const n = i + 1;
    const open = n <= save.unlocked;
    // Zigzag: alternate left and right, going up.
    const x = 18 + (i % 2 ? 56 : 8) + (i % 4 >= 2 ? 10 : 0);
    const y = 92 - i * 12;
    return { n, open, x, y, color: def.tint || '#6c98ff' };
  });
  const path = stops.map((st, i) => `${i ? 'L' : 'M'} ${st.x + 6} ${st.y + 2}`).join(' ');
  const svgStops = stops.map((st) => `
    <g class="stop${st.open ? ' is-open' : ''}${st.n === save.world ? ' is-here' : ''}" data-world="${st.n}" style="--c:${st.color}">
      <circle cx="${st.x + 6}" cy="${st.y + 2}" r="5.2"></circle>
      <text x="${st.x + 6}" y="${st.y + 3.6}">${st.open ? WORLD_ICON[st.n - 1] : '🔒'}</text>
      ${st.n === save.world ? `<image href="./images/favicon-192.png" x="${st.x + 1}" y="${st.y - 11}" width="10" height="10"></image>` : ''}
    </g>`).join('');
  const picked = save.world;
  const info = `<div class="map-info">
      <b>${WORLD_ICON[picked - 1]} ${t('worldN', { n: picked })} · ${worldName(picked)}</b>
      <span>${t(`world${picked}Text` as Key)}</span>
      <small>${bestLine(picked) || t('bestNone')}</small>
    </div>`;
  show(`
    <h2>${t('map')}</h2>
    <div class="map">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${t('map')}">
        <path class="trail" d="${path}"></path>
        ${svgStops}
      </svg>
    </div>
    ${info}
    <button class="primary" data-act="play">▶ ${t('playWorld', { n: picked })}</button>
    ${backButton('menu')}`, true);
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
  show(`<h2>${t('paused')}</h2>
    <button class="primary" data-act="resume">${t('resume')}</button>
    <button class="ghost" data-act="options-pause">⚙ ${t('options')}</button>
    <button class="ghost" data-act="quit">${t('quit')}</button>`);
}

function optionsScreen() {
  const muted = save.music === 0 && save.sfx === 0;
  show(`
    <h2>${t('options')}</h2>
    <label class="slider"><span>🎵 ${t('music')}</span><input type="range" min="0" max="100" value="${Math.round(save.music * 100)}" data-vol="music"><b>${Math.round(save.music * 100)}%</b></label>
    <label class="slider"><span>🔔 ${t('sfx')}</span><input type="range" min="0" max="100" value="${Math.round(save.sfx * 100)}" data-vol="sfx"><b>${Math.round(save.sfx * 100)}%</b></label>
    <p class="how">${t('musicNote')}</p>
    <button class="ghost" data-act="mute">${muted ? '🔊 ' + t('unmute') : '🔇 ' + t('mute')}</button>
    ${backButton(optionsFrom === 'pause' ? 'pause' : 'menu', optionsFrom === 'pause' ? 'resume' : 'menu')}`);
}

function shopScreen(note = '') {
  const groups = SLOTS.map((slot) => {
    const cards = ITEMS.filter((item) => item.slot === slot)
      .map((item) => {
        const owned = save.owned.includes(item.id);
        const worn = save.equipped[slot] === item.id;
        const can = save.coins >= item.price;
        const action = !owned
          ? `<button class="buy${can ? '' : ' is-poor'}" data-buy="${item.id}">${t('buy')} · 🪙 ${item.price}</button>`
          : worn
            ? `<button class="buy is-worn" data-unequip="${item.id}">✓ ${t('worn')} · ${t('unequip')}</button>`
            : `<button class="buy" data-equip="${item.id}">${t('equip')}</button>`;
        return `<div class="item${worn ? ' is-on' : ''}${owned ? ' is-owned' : ''}">
          <span class="icon" aria-hidden="true">${item.icon}</span>
          <b>${t(`${item.id}Name` as Key)}</b>
          <span>${t(`${item.id}Text` as Key)}</span>
          ${action}
        </div>`;
      })
      .join('');
    return `<h3 class="slot">${t(SLOT_LABEL[slot])}</h3><div class="items">${cards}</div>`;
  }).join('');
  show(`
    <div class="shop-head"><h2>${t('shop')}</h2><p class="wallet">${coinsLine()}</p></div>
    ${note ? `<p class="note">${note}</p>` : `<p class="how">${t('earnHint')}</p>`}
    ${groups}
    ${backButton('menu')}`, true);
}

function stylesScreen() {
  const cards = STYLES.map((style) => `
    <button class="style${save.style === style ? ' is-on' : ''}" data-style="${style}">
      <span class="icon" aria-hidden="true">${STYLE_ICON[style]}</span>
      <b>${t(`style${cap(style)}Name` as Key)}</b>
      <span>${t(`style${cap(style)}Text` as Key)}</span>
    </button>`).join('');
  show(`<h2>${t('styles')}</h2><p>${t('stylePick')}</p><div class="styles">${cards}</div>${backButton('menu')}`, true);
}

function startRun(world = save.world) {
  game = newGame(buildLoadout(save.equipped), save.style, world);
  paused = false;
  shownChoices = '';
  hud.hidden = false;
  hudGear.hidden = false;
  hide();
  flash(`${worldName(game.world)} · ${t('sprint', { room: 1 })}`);
  audio.start();
  audio.setIntensity(0.2);
}

screen.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('button, [data-act], [data-world]');
  if (!target) return;
  audio.unlock();
  const act = target.dataset.act;
  if (act !== 'mute') audio.play('click');
  if (act === 'play') startRun();
  else if (act === 'play-same') startRun(game?.world ?? save.world);
  else if (act === 'map') mapScreen();
  else if (target.dataset.world) {
    const n = Number(target.dataset.world);
    if (n <= save.unlocked) { save.world = n; persist(); mapScreen(); }
    else flash(t('lockedHint', { n: n - 1 }));
  }
  else if (act === 'resume') { paused = false; hide(); }
  else if (act === 'pause') pauseScreen();
  else if (act === 'quit') {
    if (game) bankRun(game);
    paused = false;
    menuScreen();
  } else if (act === 'menu') menuScreen();
  else if (act === 'shop') shopScreen();
  else if (act === 'styles') stylesScreen();
  else if (act === 'options') { optionsFrom = 'menu'; optionsScreen(); }
  else if (act === 'options-pause') { optionsFrom = 'pause'; optionsScreen(); }
  else if (act === 'mute') {
    const muted = save.music === 0 && save.sfx === 0;
    save.music = muted ? 0.6 : 0;
    save.sfx = muted ? 0.8 : 0;
    audio.setVolumes(save.music, save.sfx);
    persist();
    optionsScreen();
  } else if (target.dataset.skill && game) {
    chooseSkill(game, target.dataset.skill as SkillId);
    audio.play('pick');
    shownChoices = '';
    hide();
  } else if (target.dataset.buy) {
    const item = itemById(target.dataset.buy as ItemId);
    if (save.coins < item.price) { shopScreen(t('notEnough')); return; }
    save.coins -= item.price;
    save.owned.push(item.id);
    save.equipped[item.slot] = item.id;
    persist();
    audio.play('coin');
    shopScreen();
  } else if (target.dataset.equip) {
    const item = itemById(target.dataset.equip as ItemId);
    save.equipped[item.slot] = item.id;
    persist();
    shopScreen();
  } else if (target.dataset.unequip) {
    const item = itemById(target.dataset.unequip as ItemId);
    delete save.equipped[item.slot];
    persist();
    shopScreen();
  } else if (target.dataset.style) {
    save.style = target.dataset.style as EnemyStyle;
    persist();
    stylesScreen();
  }
  palette.hat = save.equipped.head;
});

screen.addEventListener('input', (event) => {
  const input = event.target as HTMLInputElement;
  if (!input.dataset.vol) return;
  audio.unlock();
  const value = Number(input.value) / 100;
  if (input.dataset.vol === 'music') save.music = value;
  else save.sfx = value;
  audio.setVolumes(save.music, save.sfx);
  (input.nextElementSibling as HTMLElement).textContent = `${input.value}%`;
  persist();
  // Hear the music in the menu while adjusting it.
  if (input.dataset.vol === 'music' && value > 0) audio.start();
});
screen.addEventListener('change', (event) => {
  const input = event.target as HTMLInputElement;
  if (input.dataset.vol === 'sfx') audio.play('levelup');
});

pauseBtn.addEventListener('click', () => togglePause());
function togglePause(force?: boolean) {
  if (!game || game.phase !== 'play') return;
  paused = force ?? !paused;
  if (paused) pauseScreen();
  else hide();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    togglePause(true);
    audio.stop();
  } else if (game && !document.hidden) {
    audio.start();
  }
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

/* -------------------------------------------------------------------- sound */

const SFX_FOR: Partial<Record<GameEvent, Sfx>> = {
  shoot: 'shoot', knife: 'knife', boomerang: 'boomerang', hit: 'hit', kill: 'kill', gem: 'gem', hurt: 'hurt',
  levelup: 'levelup', slash: 'slash', slam: 'slam', strike: 'strike', boom: 'boom', revive: 'revive', clear: 'door', boss: 'boss',
};
// Hits and gems happen many times a frame; one sound per kind per frame is plenty.
function playEvents(events: GameEvent[]) {
  const seen = new Set<GameEvent>();
  for (const event of events) {
    if (seen.has(event)) continue;
    seen.add(event);
    const name = SFX_FOR[event];
    if (name) audio.play(name);
  }
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

// The menu's backdrop: the title-screen parade (scene.ts).
const scene = new Scene();
function drawMenuBackdrop(now: number) {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  const rb = palette.rainbow ? `hsl(${Math.round((now * 60) % 360)} 85% 70%)` : accent;
  scene.draw(ctx, canvas.clientWidth, canvas.clientHeight, now, rb, palette.rainbow ? `hsl(${Math.round((now * 60 + 90) % 360)} 85% 70%)` : accent2, save.equipped.head);
}

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  const g = game;
  if (g && !paused && g.phase === 'play') {
    update(g, dt, readInput());
    if (calm) g.shake = 0;
    playEvents(g.events);
    for (const event of g.events) {
      if (event === 'clear') flash(t('doorOpen'));
      if (event === 'room') { flash(t('sprint', { room: g.room })); audio.setIntensity(Math.min(0.8, 0.2 + g.room * 0.05 + (g.world - 1) * 0.05)); }
      if (event === 'boss') {
        const boss = g.enemies.find((e) => e.kind === 'boss');
        flash(`${t('sprint', { room: g.room })} · ${t(BOSS_NAME[boss?.look ?? 'original'])}`);
        audio.setIntensity(1);
      }
      if (event === 'revive') flash(t('revived'));
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
    hudRoom.textContent = `${t('worldShort', { n: g.world })} · ${t('sprint', { room: g.room })}`;
    hudLevel.textContent = t('level', { level: g.level });
    hudXp.style.width = `${(g.xp / g.xpNext) * 100}%`;
    hudCoins.textContent = String(Math.floor(g.coins));
    const gear = ['🏹1', ...ownedWeapons(g).map((id) => `${ICONS[id]}${g.skills[id]}`)].join(' ');
    if (hudGear.dataset.gear !== gear) {
      hudGear.dataset.gear = gear;
      hudGear.innerHTML = gear.split(' ').map((item) => `<span>${item.slice(0, -1)}<sub>${item.slice(-1)}</sub></span>`).join('');
    }
    const boss = isBossRoom(g.room) ? g.enemies.find((e) => e.kind === 'boss' && e.spawn <= 0) : undefined;
    bossBar.hidden = !boss;
    if (boss) {
      bossName.textContent = t(BOSS_NAME[boss.look]);
      bossHp.style.width = `${(Math.max(0, boss.hp) / boss.maxHp) * 100}%`;
    }
  } else {
    drawMenuBackdrop(now / 1000);
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

menuScreen();
requestAnimationFrame(frame);
