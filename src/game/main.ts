import './game.css';
import { storage } from '../lib/storage';
import { audio, type Sfx } from './audio';
import { draw, type Palette, type View } from './draw';
import { loadSave, profileLevel, writeSave, STYLES, type EnemyStyle } from './save';
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
  save.xp += Math.round(g.xpEarned);
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

function show(html: string, wide = false, menu = false, extra = '') {
  screen.innerHTML = `<div class="panel${wide ? ' panel-wide' : ''}">${html}</div>`;
  screen.classList.toggle('is-menu', menu);
  screen.classList.toggle('is-map', extra === 'is-map');
  screen.hidden = false;
  screen.scrollTop = 0;
}
function hide() {
  screen.hidden = true;
  screen.classList.remove('is-menu', 'is-map');
  screen.innerHTML = '';
}
const backButton = (act: string, label: Key = 'menu') => `<button class="ghost" data-act="${act}">← ${t(label)}</button>`;

function menuScreen() {
  game = null;
  hud.hidden = true;
  hudGear.hidden = true;
  bossBar.hidden = true;
  audio.setIntensity(0);
  const { level, progress } = profileLevel(save.xp);
  const copy = (cls: string, title: string, sub: string) => `<span class="cover-card-copy ${cls}"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>`;
  show(`
    <div class="cover">
      <a class="hot cover-x" href="./index.html" aria-label="${t('back')}"></a>
      <button class="hot cover-more" data-act="options" aria-label="${t('options')}"></button>
      <button class="hot cover-gear" data-act="options" aria-label="${t('options')}"></button>
      <button class="hot cover-profile" data-act="map" aria-label="alvrich · ${t('lvShort', { level })}"></button>
      <span class="cover-profile-copy"><small>ALVRICH</small><b>${t('lvShort', { level })}</b><i><b style="width:${Math.round(progress * 100)}%"></b></i></span>
      <button class="hot cover-coins" data-act="shop" aria-label="${t('coins')}: ${Math.floor(save.coins)}"></button>
      <span class="cover-num is-coins">${Math.floor(save.coins)}</span>
      <button class="hot cover-worlds" data-act="map" aria-label="${t('map')}: ${save.unlocked}/${WORLD_COUNT}"></button>
      <span class="cover-num is-worlds">${save.unlocked}/${WORLD_COUNT}</span>
      <p class="cover-tagline">${t('landingTagline')}</p>
      <button class="hot cover-play" data-act="play" aria-label="${t('playNow')} · ${worldName(save.world)}"></button>
      <span class="cover-play-copy"><b>${t('playNow')}</b><small>${WORLD_ICON[save.world - 1]} ${worldName(save.world)}</small></span>
      <button class="hot cover-card is-map" data-act="map" aria-label="${t('map')}"></button>
      ${copy('is-map', t('map'), `🌍 ${save.unlocked} / ${WORLD_COUNT}`)}
      <button class="hot cover-card is-shop" data-act="shop" aria-label="${t('shop')}"></button>
      ${copy('is-shop', t('shop'), `🪙 ${Math.floor(save.coins)}`)}
      <button class="hot cover-card is-styles" data-act="styles" aria-label="${t('styles')}"></button>
      ${copy('is-styles', t('styles'), t(`style${cap(save.style)}Name` as Key))}
      <button class="hot cover-card is-options" data-act="options" aria-label="${t('options')}"></button>
      ${copy('is-options', t('options'), '')}
      <p class="cover-best">${bestLine()}</p>
    </div>`, false, true);
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

/* The world map: floating islands (the owner's artwork, one per world) laid
   out two to a row down the screen, joined by a dashed light trail. Each
   island is a button; its ring, name plate and badges are drawn over the art
   so they can be translated and show the real lock state. */

const MAP_W = 941;
const MAP_H = 1240;
const ISLAND_ART = ["original", "infierno", "vikingos", "jungla", "rayo", "robots", "demonios", "nucleo"];
/** Per island art: its size and where the ring, plate and lower badge sit (percent of the art). */
const ISLAND_META: Record<string, { w: number; h: number; ring: number[]; plate: number[]; badge: number[] }> = {"original": {"w": 380, "h": 290, "ring": [52.1, 46.6], "plate": [28.4, 62.8, 47.9, 13.1], "badge": [52.1, 83.4]}, "infierno": {"w": 405, "h": 295, "ring": [46.2, 39.0], "plate": [18.5, 58.3, 55.6, 12.9], "badge": [46.2, 78.6]}, "vikingos": {"w": 425, "h": 285, "ring": [53.6, 45.6], "plate": [32.9, 60.0, 44.2, 13.3], "badge": [54.1, 81.8]}, "jungla": {"w": 445, "h": 330, "ring": [50.1, 45.5], "plate": [28.1, 62.1, 48.3, 11.5], "badge": [50.6, 80.6]}, "rayo": {"w": 405, "h": 295, "ring": [46.2, 39.0], "plate": [18.5, 58.3, 55.6, 12.9], "badge": [46.2, 78.6]}, "robots": {"w": 420, "h": 300, "ring": [53.1, 45.0], "plate": [32.1, 62.7, 42.9, 12.7], "badge": [53.1, 83.3]}, "demonios": {"w": 420, "h": 280, "ring": [47.6, 42.9], "plate": [26.2, 59.6, 44.0, 13.6], "badge": [48.1, 81.4]}, "nucleo": {"w": 420, "h": 280, "ring": [47.6, 42.9], "plate": [26.2, 59.6, 44.0, 13.6], "badge": [48.1, 81.4]}};

/** The world the map is showing (locked ones can be looked at, not played). */
let mapPick = 0;

function mapScreen() {
  if (!mapPick) mapPick = save.world;
  const picked = mapPick;
  const pickedOpen = picked <= save.unlocked;
  const islandW = 0.47 * MAP_W;
  const stops = WORLDS.map((_, i) => {
    const n = i + 1;
    const m = ISLAND_META[ISLAND_ART[i]];
    const w = islandW;
    const h = (w * m.h) / m.w;
    const cx = (i % 2 ? 0.715 : 0.285) * MAP_W;
    const cy = 0.11 * MAP_H + Math.floor(i / 2) * 0.255 * MAP_H;
    const left = cx - (m.ring[0] / 100) * w;
    const top = cy - (m.ring[1] / 100) * h;
    return { n, m, w, h, left, top, cx, cy, open: n <= save.unlocked };
  });
  const trail = stops.slice(0, -1).map((a, i) => {
    const b = stops[i + 1];
    const mx = (a.cx + b.cx) / 2;
    return `<path class="trail${b.open ? '' : ' is-locked'}" d="M ${a.cx} ${a.cy} Q ${mx} ${a.cy + (b.cy - a.cy) * 0.15} ${b.cx} ${b.cy}"/>`;
  }).join('');
  const islands = stops.map((st) => {
    const best = save.bestByWorld[st.n];
    const done = best?.time !== undefined;
    const under = !st.open ? '🔒' : done ? '✓' : best?.room ? `${best.room}/10` : '';
    const style = `left:${(st.left / MAP_W) * 100}%;top:${(st.top / MAP_H) * 100}%;width:${(st.w / MAP_W) * 100}%;--rx:${st.m.ring[0]}%;--ry:${st.m.ring[1]}%;--px:${st.m.plate[0]}%;--py:${st.m.plate[1]}%;--pw:${st.m.plate[2]}%;--ph:${st.m.plate[3]}%;--bx:${st.m.badge[0]}%;--by:${st.m.badge[1]}%;--c:${WORLDS[st.n - 1].tint || '#38bdf8'}`;
    return `
      <button class="isle${st.open ? ' is-open' : ' is-locked'}${st.n === picked ? ' is-picked' : ''}" data-world="${st.n}" style="${style}" aria-label="${t('worldN', { n: st.n })} · ${worldName(st.n)}">
        <img src="./images/game/map/${ISLAND_ART[st.n - 1]}.webp" alt="" width="${st.m.w}" height="${st.m.h}">
        <span class="isle-ring"><span>${WORLD_ICON[st.n - 1]}</span></span>
        ${st.n === picked ? '<img class="isle-hero" src="./images/favicon-192.png" alt="" width="32" height="32">' : ''}
        <span class="isle-plate">${worldName(st.n)}</span>
        ${under ? `<span class="isle-under${done ? ' is-done' : ''}${st.open ? '' : ' is-lock'}">${under}</span>` : ''}
      </button>`;
  }).join('');
  const status = pickedOpen
    ? `<small class="map-record">▮▮▮ ${bestLine(picked) || t('bestNone')}</small>`
    : `<small class="map-locked">🔒 ${t('lockedUntil', { n: picked - 1 })}</small>`;
  const action = pickedOpen
    ? `<button class="play" data-act="play-picked"><span class="play-tri" aria-hidden="true"></span><span class="play-copy">${t('playWorld', { n: picked })}</span></button>`
    : `<button class="play is-locked" disabled><span class="play-lock" aria-hidden="true">🔒</span><span class="play-copy">${t('lockedBtn')}</span></button>`;
  show(`
    <div class="mapscreen">
      <h2 class="map-title"><span>${t('map')}</span></h2>
      <div class="map" style="aspect-ratio:${MAP_W}/${MAP_H}">
        <svg viewBox="0 0 ${MAP_W} ${MAP_H}" preserveAspectRatio="none" aria-hidden="true">${trail}</svg>
        ${islands}
      </div>
      <div class="map-info">
        <img class="map-thumb" src="./images/game/map/pv-${ISLAND_ART[picked - 1]}.jpg" alt="" width="400" height="250">
        <div class="map-copy">
          <b><span class="map-ico">${WORLD_ICON[picked - 1]}</span> ${t('worldN', { n: picked })} · ${worldName(picked)}</b>
          <span>${t(`world${picked}Text` as Key)}</span>
          ${status}
        </div>
      </div>
      ${action}
      <button class="ghost hexghost" data-act="menu">← ${t('menu')}</button>
    </div>`, true, false, 'is-map');
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
  else if (act === 'map') { mapPick = save.world; mapScreen(); }
  else if (act === 'play-picked') { save.world = mapPick; persist(); startRun(mapPick); }
  else if (target.dataset.world) {
    const n = Number(target.dataset.world);
    mapPick = n;
    if (n <= save.unlocked) { save.world = n; persist(); }
    mapScreen();
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
/** The canvas size the bitmap was last made for, in CSS pixels. */
let fitted = { width: 0, height: 0, dpr: 0 };
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  fitted = { width, height, dpr };
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const top = 86; // room for the HUD and the weapons row
  const scale = Math.min(width / W, (height - top - 8) / H);
  view.scale = scale;
  view.dpr = dpr;
  view.ox = (width - W * scale) / 2;
  view.oy = top + (height - top - 8 - H * scale) / 2;
}
/* Phones (iOS above all) can change the canvas box without a resize event:
   the address bar folds, the first layout settles late, the page zooms. So
   the frame loop checks the real size every time and refits when it moved,
   or the picture is drawn squashed into a bitmap of the wrong shape. */
function fitIfMoved() {
  if (canvas.clientWidth !== fitted.width || canvas.clientHeight !== fitted.height || Math.min(2, window.devicePixelRatio || 1) !== fitted.dpr) resize();
}
window.addEventListener('resize', resize);
window.visualViewport?.addEventListener('resize', resize);
if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
resize();

// The menu's backdrop: the title-screen parade (scene.ts).
const scene = new Scene();
function drawMenuBackdrop(now: number) {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  const rb = palette.rainbow ? `hsl(${Math.round((now * 60) % 360)} 85% 70%)` : accent;
  scene.draw(ctx, canvas.clientWidth, canvas.clientHeight, now, rb, palette.rainbow ? `hsl(${Math.round((now * 60 + 90) % 360)} 85% 70%)` : accent2, save.equipped.head);
}

let last = performance.now();
/* One bad frame must never stop the game: the next one is always booked. */
function frame(now: number) {
  try {
    step(now);
  } catch (error) {
    console.error(error);
  }
  requestAnimationFrame(frame);
}
function step(now: number) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  fitIfMoved();
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
  } else if (!screen.classList.contains('is-menu')) {
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
}

/* --------------------------------------------------------------- loading */

/* The title screen is one big picture, so the HTML shows a bar until the
   pictures the menu and the map need are in (weighted by size); then the bar
   fades and the menu opens. Nothing waits longer than a few seconds. */
const PRELOAD: [string, number][] = [
  ['./images/game/cover.jpg', 10],
  ['./images/game/landing-bg.jpg', 1],
  ['./images/favicon-192.png', 1],
  ['./images/game/map/bg.jpg', 1],
  ...['original', 'infierno', 'vikingos', 'jungla', 'rayo', 'robots', 'demonios', 'nucleo'].map((name): [string, number] => [`./images/game/map/${name}.webp`, 1]),
];
const loading = $<HTMLElement>('loading');
const loadingFill = $<HTMLElement>('loadingFill');
$<HTMLElement>('loadingText').textContent = t('loading');
let loadedWeight = 0;
const totalWeight = PRELOAD.reduce((sum, [, weight]) => sum + weight, 0);
const loadOne = ([src, weight]: [string, number]) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    const done = () => {
      loadedWeight += weight;
      loadingFill.style.width = `${Math.max(4, (loadedWeight / totalWeight) * 100)}%`;
      resolve();
    };
    img.onload = done;
    img.onerror = done;
    img.src = src;
  });
const fontsReady = 'fonts' in document ? document.fonts.ready.then(() => undefined) : Promise.resolve();
Promise.race([
  Promise.all([...PRELOAD.map(loadOne), fontsReady]),
  new Promise<void>((resolve) => setTimeout(resolve, 6000)),
]).then(() => {
  loadingFill.style.width = '100%';
  menuScreen();
  loading.classList.add('is-done');
  setTimeout(() => loading.remove(), 400);
});
requestAnimationFrame(frame);
