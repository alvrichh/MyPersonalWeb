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

/* The world map: a winding road through eight stops, each dressed in its
   world's element. The road itself changes colour and texture as it nears
   the next world. */

type Stop = { n: number; open: boolean; x: number; y: number; color: string };

/** Smooth curve through the stops (Catmull-Rom turned into cubic Béziers), one path per leg. */
function legs(stops: Stop[]) {
  const pt = (i: number) => stops[Math.max(0, Math.min(stops.length - 1, i))];
  return stops.slice(0, -1).map((a, i) => {
    const p0 = pt(i - 1);
    const p1 = a;
    const p2 = pt(i + 1);
    const p3 = pt(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    return { from: p1, to: p2, d: `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}` };
  });
}

/** How the road looks on its way into each world. */
const ROAD_DASH: Record<string, string> = {
  original: '2 2', fire: '1.2 1.8', water: '3 1.4', leaf: '0.7 1.3', bolt: '2.2 0.7 0.6 0.7', spark: '0.5 1.1', ghost: '2 2.4', heart: '1.4 1.4',
};

/** Little props around a stop, drawn with the world's element. */
function dressing(element: string, x: number, y: number, color: string): string {
  const g = (body: string) => `<g class="deco" transform="translate(${x} ${y})" style="--c:${color}">${body}</g>`;
  switch (element) {
    case 'fire':
      return g(`<ellipse cx="-9" cy="6" rx="4" ry="1.6" fill="${color}" opacity=".55"/>
        <path d="M-9 4.5c-1.6-2 0-3.4.4-4.6.9 1.2 2.4 2 1.8 4.2-.3 1-1.6 1.1-2.2.4z" fill="#fde68a"/>
        <path d="M8 -6c-1.4-1.8 0-3 .4-4 .8 1 2 1.8 1.5 3.7-.3.9-1.4 1-1.9.3z" fill="${color}"/>
        <path d="M6 7l1.6-3 1.6 3z" fill="#7c2d12"/><path d="M10 8l1.3-2.4 1.3 2.4z" fill="#7c2d12"/>`);
    case 'water':
      return g(`<path d="M-13 6q2-2 4 0t4 0t4 0" fill="none" stroke="${color}" stroke-width=".8" stroke-linecap="round"/>
        <path d="M2 9q2-2 4 0t4 0" fill="none" stroke="${color}" stroke-width=".8" stroke-linecap="round" opacity=".7"/>
        <path d="M9 -7c0 1.6-1 2.6-1.8 2.6S5.4-5.4 5.4-7c0-1.2 1.8-3.4 1.8-3.4S9 -8.2 9 -7z" fill="${color}" opacity=".9"/>
        <ellipse cx="-9" cy="-5" rx="3.2" ry="1.3" fill="${color}" opacity=".35"/>`);
    case 'leaf':
      return g(`<path d="M-9 -2l3.5-6 3.5 6z" fill="${color}" opacity=".9"/><rect x="-6.2" y="-2" width="1.4" height="2.6" fill="#78350f"/>
        <path d="M-10 5l2.6-4.4 2.6 4.4z" fill="${color}" opacity=".7"/><rect x="-7.9" y="5" width="1" height="2" fill="#78350f"/>
        <ellipse cx="8" cy="-6" rx="2.6" ry="1.2" transform="rotate(-35 8 -6)" fill="${color}"/>
        <ellipse cx="10" cy="6" rx="2.2" ry="1" transform="rotate(25 10 6)" fill="${color}" opacity=".8"/>
        <ellipse cx="-3" cy="9" rx="2" ry=".9" transform="rotate(-15 -3 9)" fill="${color}" opacity=".7"/>`);
    case 'bolt':
      return g(`<g fill="#cbd5e1" opacity=".55"><circle cx="-8" cy="-8" r="2.4"/><circle cx="-5" cy="-9" r="3"/><circle cx="-2" cy="-8" r="2.2"/><rect x="-10.4" y="-8" width="10.6" height="2.4"/></g>
        <path d="M-5 -5.6l-1.6 3h1.4l-1.2 2.8 2.6-3.6h-1.4z" fill="${color}"/>
        <g fill="#cbd5e1" opacity=".4"><circle cx="8" cy="5" r="2"/><circle cx="10.5" cy="4.2" r="2.5"/><circle cx="13" cy="5" r="1.8"/><rect x="6" y="5" width="9" height="2"/></g>
        <path d="M10.5 7.2l-1.3 2.4h1.1l-1 2.4 2.2-3h-1.2z" fill="${color}" opacity=".9"/>`);
    case 'spark': {
      const teeth = Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * Math.PI * 2; return `<rect x="-0.7" y="-4.6" width="1.4" height="1.6" transform="rotate(${(a * 180) / Math.PI})"/>`; }).join('');
      return g(`<g transform="translate(-9 -5)" fill="#9ca3af"><circle r="3.4"/>${teeth}<circle r="1.3" fill="#1f2937"/></g>
        <g transform="translate(8 6) scale(.7)" fill="#9ca3af"><circle r="3.4"/>${teeth}<circle r="1.3" fill="#1f2937"/></g>
        <g fill="${color}"><path d="M9 -7l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/><path d="M-4 8l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z" opacity=".8"/></g>`);
    }
    case 'ghost':
      return g(`<ellipse cx="0" cy="8" rx="15" ry="3" fill="${color}" opacity=".12"/>
        <path d="M-11 6v-5.5a2.5 2.5 0 0 1 5 0V6z" fill="#4b5563"/><rect x="-9" y="1" width="1" height="3" fill="#1f2937"/><rect x="-10" y="2" width="3" height="1" fill="#1f2937"/>
        <path d="M7 7v-4.5a2 2 0 0 1 4 0V7z" fill="#4b5563" opacity=".85"/>
        <circle cx="9" cy="-7" r="1.6" fill="${color}" opacity=".7"/><circle cx="-7" cy="-9" r="1.1" fill="${color}" opacity=".5"/>`);
    case 'heart': {
      const heart = (hx: number, hy: number, sc: number, op: number) => `<path transform="translate(${hx} ${hy}) scale(${sc})" d="M0 2.6s-3-1.8-3.8-3.7C-4.4-2.6-3.5-4-2.1-4c.9 0 1.6.5 2.1 1.3C.5-3.5 1.2-4 2.1-4c1.4 0 2.3 1.4 1.7 2.9C3 .8 0 2.6 0 2.6z" fill="${color}" opacity="${op}"/>`;
      return g(heart(-9, -6, .9, .95) + heart(9, -4, .7, .8) + heart(-7, 7, .6, .7) + heart(10, 7, .55, .6));
    }
    default:
      return g(`<g fill="#2c3648" stroke="#475569" stroke-width=".4"><rect x="-13" y="-2" width="6" height="7" rx=".8"/><rect x="7" y="3" width="6" height="6" rx=".8"/></g>
        <g fill="${color}"><rect x="-12" y="-1" width="1" height=".8"/><rect x="-10.5" y="-1" width="1" height=".8"/><rect x="8" y="4" width="1" height=".8"/></g>
        <g fill="#ff6b6b"><ellipse cx="9" cy="-6" rx="1.3" ry="1.6"/><ellipse cx="-8" cy="9" rx="1" ry="1.3" opacity=".8"/></g>`);
  }
}

function mapScreen() {
  const stops: Stop[] = WORLDS.map((def, i) => {
    const n = i + 1;
    // A gentle S up the screen: side to side, with a little drift.
    const t = i / (WORLDS.length - 1);
    const x = 50 + Math.sin(i * 1.25 + 0.4) * 30 + (i % 3 === 1 ? 6 : -3);
    const y = 90 - t * 78;
    return { n, open: n <= save.unlocked, x, y, color: def.tint || '#6c98ff' };
  });
  const road = legs(stops).map((leg, i) => {
    const next = WORLDS[i + 1];
    const open = stops[i + 1].open;
    return `<defs><linearGradient id="leg${i}" gradientUnits="userSpaceOnUse" x1="${leg.from.x}" y1="${leg.from.y}" x2="${leg.to.x}" y2="${leg.to.y}">
        <stop offset="0" stop-color="${stops[i].color}"/><stop offset="1" stop-color="${stops[i + 1].color}"/></linearGradient></defs>
      <path class="leg${open ? '' : ' is-locked'}" d="${leg.d}" stroke="url(#leg${i})" stroke-dasharray="${ROAD_DASH[next.element]}"/>`;
  }).join('');
  const glows = stops.map((st) => `<circle class="glow${st.open ? '' : ' is-locked'}" cx="${st.x}" cy="${st.y}" r="16" fill="${st.color}"/>`).join('');
  const decos = stops.map((st, i) => `<g class="${st.open ? '' : 'is-locked'}">${dressing(WORLDS[i].element, st.x, st.y, st.color)}</g>`).join('');
  const nodes = stops.map((st) => `
    <g class="stop${st.open ? ' is-open' : ''}${st.n === save.world ? ' is-here' : ''}" data-world="${st.n}" style="--c:${st.color}">
      <circle cx="${st.x}" cy="${st.y}" r="5.2"></circle>
      <text x="${st.x}" y="${st.y + 1.6}">${st.open ? WORLD_ICON[st.n - 1] : '🔒'}</text>
      ${st.n === save.world ? `<image href="./images/favicon-192.png" x="${st.x - 5}" y="${st.y - 13}" width="10" height="10"></image>` : ''}
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
        ${glows}${road}${decos}${nodes}
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
