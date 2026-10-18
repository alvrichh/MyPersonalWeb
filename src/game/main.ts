import './game.css';
import { storage } from '../lib/storage';
import { audio, type Sfx } from './audio';
import { draw, type Palette, type View } from './draw';
import { loadSave, profileLevel, writeSave, STYLES, SKINS, type EnemyStyle, type HeroSkin } from './save';
import { ITEMS, SLOTS, UPGRADES, buildLoadout, itemById, upgradeById, upgradePrice, type ItemId, type Slot, type UpgradeId } from './shop';
import { Scene } from './scene';
import { makeT, pickLang, type Key } from './strings';
import {
  CATEGORY, H, REVIVE_PRICE, ROOMS, W, WHEEL, WHEEL_COINS, WHEEL_GOOD, WHEEL_ROOM, WORLDS, WORLD_COUNT, applyWheel, chooseSkill, isBossRoom, leaveWheel, newGame, ownedWeapons, paidRevive, shrinePick, update,
  type Category, type Game, type GameEvent, type Input, type Look, type SkillId, type WheelOutcome,
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
const hudHp = $<HTMLElement>('hudHp');
hudHp.parentElement?.setAttribute('aria-label', lang === 'es' ? 'Vida' : 'Health');
const hudGear = $<HTMLElement>('hudGear');
const hudCoins = $<HTMLElement>('hudCoins');
const bossBar = $<HTMLElement>('bossBar');
const bossName = $<HTMLElement>('bossName');
const bossHp = $<HTMLElement>('bossHp');
const pauseBtn = $<HTMLButtonElement>('pauseBtn');
const backLink = $<HTMLAnchorElement>('backLink');
backLink.setAttribute('aria-label', t('back'));
backLink.addEventListener('click', (event) => {
  if (!game || game.phase !== 'play') return;
  event.preventDefault();
  leaveScreen('site');
});
pauseBtn.setAttribute('aria-label', t('pause'));

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------------------------------------------------------------- the save */

const save = loadSave();
const persist = () => writeSave(save);
audio.setVolumes(save.music, save.sfx);
palette.hat = save.equipped.head;
palette.skin = save.skin;
palette.retro = save.retro;
document.documentElement.toggleAttribute('data-retro', save.retro);

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const bestLine = (world = save.world) => {
  const best = save.bestByWorld[world];
  if (!best) return '';
  if (best.time !== undefined) return t('bestWin', { time: clock(best.time) });
  return best.room ? t('best', { room: best.room }) : '';
};
const worldName = (n: number) => t(`world${n}Name` as Key);
const WORLD_ICON = ['🐞', '🔥', '💧', '🍃', '🛡️', '✨', '👻', '💗'];
const coinsLine = (n = save.coins) => `<span class="coin">🪙</span> ${Math.floor(n)}`;

/** Banks the coins and the record; returns the world unlocked by this run, if any. */
function bankRun(g: Game): number | null {
  const won = g.phase === 'won';
  const best = save.bestByWorld[g.world] ?? { room: 0 };
  const better = won ? best.time === undefined || g.time < best.time : best.time === undefined && g.room > (best.room || 0);
  if (better) save.bestByWorld[g.world] = won ? { room: ROOMS, time: g.time } : { room: g.room };
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

/** The painted medallion of a skill (static/images/game/skills/, one per skill id). */
const EMOJI: Record<SkillId | 'bow', string> = {
  sword: '🗡️', blades: '🌀', hammer: '🔨', storm: '🌩️', fireball: '☄️', frost: '❄️', spirits: '👻', knives: '🔪', boomerang: '🪃',
  fire: '🔥', water: '💧', leaf: '🍃', bolt: '⚡', spark: '✨', ghost: '🫥', double: '🏹', speed: '⏩', power: '💥', heart: '💗', bow: '🏹',
};
/* The painted medallion, with the emoji beside it for the retro look (CSS shows one or the other). */
const skillIcon = (id: SkillId | 'bow', size = 40) => `<img class="skill-icon" src="./images/game/skills/${id === 'bow' ? 'double' : id}.webp" width="${size}" height="${size}" alt=""><span class="skill-emoji">${EMOJI[id]}</span>`;
const CATEGORY_LABEL: Record<Category, Key> = { melee: 'catMelee', magic: 'catMagic', ranged: 'catRanged', upgrade: 'catUpgrade' };
const SLOT_LABEL: Record<Slot, Key> = { head: 'slotHead', charm: 'slotCharm', relic: 'slotRelic' };
const STYLE_ICON: Record<EnemyStyle, string> = { world: '🌍', original: '🐞', demon: '😈', viking: '🪓', jungle: '🕷️', greek: '🏛️', robot: '🤖', nightmare: '💀', random: '🎲' };
const BOSS_NAME: Record<Look, Key> = { original: 'bossOriginal', demon: 'bossDemon', viking: 'bossViking', jungle: 'bossJungle', greek: 'bossGreek', robot: 'bossRobot', nightmare: 'bossNightmare' };

let game: Game | null = null;
let paused = false;
let shownChoices = '';
/** The wheel screen is up (so the frame loop opens it only once). */
let wheelShown = false;
/** The coin-revive offer is on screen (so the frame loop doesn't open the game-over yet). */
let reviveOffered = false;
/** Where the Options screen goes back to. */
let optionsFrom: 'menu' | 'pause' = 'menu';

/*
 * The dialog frames: the plain centre of each picture, as fractions of its
 * size (left, right, top, bottom), and its height/width. fitPanel() measures
 * the dialog's content and picks the picture whose shape is closer, then
 * sizes the padding from these bands so the frame is drawn whole, never
 * sliced, and the content sits inside the centre.
 */
const FRAMES = {
  short: { l: 0.166, r: 0.166, t: 0.105, b: 0.115, ratio: 602 / 446 },
  tall: { l: 0.122, r: 0.122, t: 0.073, b: 0.095, ratio: 1248 / 605 },
};
function fitPanel() {
  const panel = screen.querySelector<HTMLElement>('.panel');
  const inner = panel?.querySelector<HTMLElement>('.panel-in');
  if (!panel || !inner || screen.hidden || screen.classList.contains('is-menu') || screen.classList.contains('is-map')) return;
  if (save.retro) { panel.classList.remove('is-tall'); panel.style.height = ''; panel.style.padding = ''; return; }
  const w = panel.getBoundingClientRect().width;
  const pick = (kind: keyof typeof FRAMES) => {
    const f = FRAMES[kind];
    panel.style.padding = `0 ${f.r * w}px 0 ${f.l * w}px`;
    panel.style.height = 'auto';
    const content = inner.offsetHeight;
    // Height such that the bands, scaled with the height, leave room for the content.
    const h = content / (1 - f.t - f.b);
    return { kind, f, h, off: Math.abs(Math.log(h / w / f.ratio)) };
  };
  // Pictures still loading change the content's height: fit again when they land.
  for (const img of panel.querySelectorAll('img')) if (!img.complete) img.addEventListener('load', fitPanel, { once: true });
  // On phones the three complete horizontal skill cards need the tall frame.
  // Automatic frame selection can choose the narrower short-frame content area.
  const best = screen.classList.contains('is-levelup') && window.matchMedia('(max-width: 480px)').matches
    ? pick('tall')
    : [pick('short'), pick('tall')].sort((a, b) => a.off - b.off)[0];
  const { f, h: wanted } = pick(best.kind);
  // Never taller than the screen: a long dialog scrolls inside its frame.
  const h = Math.min(wanted, screen.clientHeight - 32);
  panel.classList.toggle('is-tall', best.kind === 'tall');
  panel.style.height = `${h}px`;
  panel.style.padding = `${f.t * h}px ${f.r * w}px ${f.b * h}px ${f.l * w}px`;
}
window.addEventListener('resize', fitPanel);

function show(html: string, wide = false, menu = false, extra = '') {
  screen.innerHTML = `<div class="panel${wide ? ' panel-wide' : ''}"><div class="panel-in">${html}</div></div>`;
  screen.classList.toggle('is-menu', menu);
  screen.classList.toggle('is-map', extra === 'is-map');
  screen.classList.toggle('is-levelup', extra === 'is-levelup');
  screen.hidden = false;
  screen.scrollTop = 0;
  fitPanel();
  // Fonts and pictures may still be arriving: fit once more when they are in.
  if ('fonts' in document) document.fonts.ready.then(fitPanel);
}
function hide() {
  screen.hidden = true;
  screen.classList.remove('is-menu', 'is-map', 'is-levelup');
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

/* Death with a full purse: once per run, 1000 coins (banked plus this run's)
   put you back on your feet before the game-over screen. */
const canPayRevive = (g: Game) => !g.paidRevive && save.coins + Math.floor(g.coins) >= REVIVE_PRICE;
function reviveScreen(g: Game) {
  show(`${head('defeat', t('reviveTitle'))}<p>${t('reviveText', { coins: REVIVE_PRICE })}</p>
    <p class="earned">${coinsLine(save.coins + Math.floor(g.coins))}</p>
    <button class="primary" data-act="revive-pay">${t('reviveBtn', { coins: REVIVE_PRICE })}</button>
    <button class="ghost" data-act="revive-no">${t('reviveNo')}</button>`);
}

function endScreen(g: Game) {
  hud.hidden = true;
  hudGear.hidden = true;
  bossBar.hidden = true;
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
    ${head(won ? 'victory' : 'defeat', t(won ? 'won' : 'over'))}
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
    const under = !st.open ? '🔒' : done ? '✓' : best?.room ? `${best.room}/${ROOMS}` : '';
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
      return `<button class="skill skill-${cat}" data-skill="${id}"><span class="icon" aria-hidden="true">${skillIcon(id, 56)}</span><span class="cat">${t(CATEGORY_LABEL[cat])}</span><b>${name}</b><span>${text}</span>${level}</button>`;
    })
    .join('');
  show(`${head('levelup', t('levelUp'))}<p class="kicker">${t('level', { level: g.level })}</p><p>${t('choose')}</p><div class="skills">${cards}</div>`, true, false, 'is-levelup');
}

/* The wheel of fate: eight slices, good and bad alternating. The wheel is
   picked before it spins; the spin is only the show. */
const WHEEL_ICON: Record<WheelOutcome, string> = {
  newSkill: '✨', skillUp: '⬆️', heal: '❤️', coins: '🪙', loseLevel: '⬇️', hurt: '💔', loseCoins: '💸', bossBuff: '👹', nothing: '😐',
};
const WHEEL_TEXT: Record<WheelOutcome, Key> = {
  newSkill: 'wNewSkill', skillUp: 'wSkillUp', heal: 'wHeal', coins: 'wCoins', loseLevel: 'wLoseLevel', hurt: 'wHurt', loseCoins: 'wLoseCoins', bossBuff: 'wBossBuff', nothing: 'wNothing',
};
function shrineScreen() {
  show(`${head('shrine', t('shrineTitle'))}<p>${t('shrineText')}</p>
    <button class="primary" data-act="shrine-heal">${t('shrineHeal')}</button>
    <button class="ghost" data-act="shrine-skill">${t('shrineSkill')}</button>`);
}
function wheelScreen() {
  const slices = WHEEL.map((o, i) => `<span class="wheel-slice${WHEEL_GOOD.includes(o) ? ' is-good' : o === 'nothing' ? '' : ' is-bad'}" style="--i:${i}">${WHEEL_ICON[o]}</span>`).join('');
  show(`${head('wings', t('wheelTitle'))}<p>${t('wheelText')}</p>
    <div class="wheel"><div class="wheel-disc" id="wheelDisc">${slices}</div><span class="wheel-pin" aria-hidden="true"></span></div>
    <p class="wheel-result" id="wheelResult"></p>
    <button class="primary" data-act="wheel-spin">${t('wheelSpin')}</button>`);
}
function spinWheel(g: Game) {
  const spinBtn = screen.querySelector<HTMLButtonElement>('[data-act="wheel-spin"]');
  const disc = screen.querySelector<HTMLElement>('#wheelDisc');
  const result = screen.querySelector<HTMLElement>('#wheelResult');
  if (!spinBtn || !disc || !result || spinBtn.disabled) return;
  spinBtn.disabled = true;
  const index = Math.floor(Math.random() * WHEEL.length);
  // Five full turns, then land the chosen slice (centred at index × 45°) under the pin at the top.
  disc.style.transform = `rotate(${5 * 360 - index * (360 / WHEEL.length)}deg)`;
  disc.classList.add('is-spinning');
  audio.play('boomerang');
  window.setTimeout(() => {
    const got = applyWheel(g, WHEEL[index]);
    const name = got.skill ? t(`${got.skill}Name` as Key) : '';
    const good = WHEEL_GOOD.includes(got.outcome);
    result.textContent = `${WHEEL_ICON[got.outcome]} ${t(WHEEL_TEXT[got.outcome], { name, coins: Math.round(WHEEL_COINS * (1 + (g.world - 1) * 0.5)) })}`;
    result.className = `wheel-result ${good ? 'is-good' : got.outcome === 'nothing' ? '' : 'is-bad'}`;
    audio.play(good ? 'levelup' : got.outcome === 'nothing' ? 'gem' : 'hurt');
    spinBtn.textContent = t('wheelGo');
    spinBtn.dataset.act = 'wheel-go';
    spinBtn.disabled = false;
  }, 3600);
}

/* Both ways out of a run (the HUD arrow and Quit in the pause menu) ask
   first; a mid-run tap on the arrow is an easy slip on a phone. */
function leaveScreen(to: 'site' | 'menu') {
  paused = true;
  show(`<h2>${t('leaveTitle')}</h2><p>${t('leaveText')}</p>
    <button class="primary" data-act="resume">${t('keepPlaying')}</button>
    <button class="ghost" data-act="${to === 'site' ? 'leave-site' : 'quit'}">${t(to === 'site' ? 'leaveSite' : 'leaveMenu')}</button>`);
}

/* A header from the UI sheets: the ornament is the picture, the words sit in its plate. */
/* Crest picture sizes, so the dialog can be measured before they load. */
const HEAD_SIZE: Record<string, [number, number]> = {
  pause: [480, 450], levelup: [480, 452], shrine: [450, 480], victory: [431, 480], defeat: [481, 472], boss: [480, 422], wings: [480, 304],
};
const head = (kind: 'pause' | 'levelup' | 'victory' | 'defeat' | 'shrine' | 'wings', text: string) =>
  `<div class="ui-head is-${kind}"><img src="./images/game/ui/header_${kind}.webp" width="${HEAD_SIZE[kind][0]}" height="${HEAD_SIZE[kind][1]}" alt=""><span>${text}</span></div>`;

function pauseScreen() {
  show(`<button class="ui-close" type="button" data-act="resume" aria-label="${t('resume')}"></button>
    ${head('pause', t('paused'))}
    <button class="primary" data-act="resume">${t('resume')}</button>
    <button class="ghost" data-act="options-pause">⚙ ${t('options')}</button>
    <button class="ghost" data-act="confirm-quit">${t('quit')}</button>`);
}

function optionsScreen() {
  const muted = save.music === 0 && save.sfx === 0;
  show(`
    <button class="ui-close" type="button" data-act="${optionsFrom === 'pause' ? 'pause' : 'menu'}" aria-label="${t('back')}"></button>
    <h2>${t('options')}</h2>
    <label class="slider"><span>🎵 ${t('music')}</span><b>${Math.round(save.music * 100)}%</b><input type="range" min="0" max="100" value="${Math.round(save.music * 100)}" style="--fill:${Math.round(save.music * 100)}%" data-vol="music"></label>
    <label class="slider"><span>🔔 ${t('sfx')}</span><b>${Math.round(save.sfx * 100)}%</b><input type="range" min="0" max="100" value="${Math.round(save.sfx * 100)}" style="--fill:${Math.round(save.sfx * 100)}%" data-vol="sfx"></label>
    <p class="how">${t('musicNote')}</p>
    <button class="mute-toggle" type="button" data-act="mute" aria-pressed="${muted}"><span class="toggle-art${muted ? ' is-off' : ''}" aria-hidden="true"></span><span>${muted ? t('unmute') : t('mute')}</span></button>
    <button class="mute-toggle" type="button" data-act="retro" aria-pressed="${save.retro}"><span class="toggle-art${save.retro ? '' : ' is-off'}" aria-hidden="true"></span><span>${t('retro')}</span></button>
    <p class="how">${t('retroNote')}</p>
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
        return `<div class="item${worn ? ' is-on' : ''}${owned ? ' is-owned' : ''}${!owned && !can ? ' is-locked' : ''}">
          <span class="icon" aria-hidden="true">${item.icon}</span>
          <b>${t(`${item.id}Name` as Key)}</b>
          <span>${t(`${item.id}Text` as Key)}</span>
          ${action}
        </div>`;
      })
      .join('');
    return `<h3 class="slot">${t(SLOT_LABEL[slot])}</h3><div class="items">${cards}</div>`;
  }).join('');
  // The forge: permanent, levelled upgrades.
  const forge = UPGRADES.map((u) => {
    const level = save.upgrades[u.id] ?? 0;
    const maxed = level >= u.max;
    const price = upgradePrice(u, level);
    const can = save.coins >= price;
    const pips = Array.from({ length: u.max }, (_, i) => `<i class="${i < level ? 'is-on' : ''}"></i>`).join('');
    const action = maxed
      ? `<button class="buy is-worn" disabled>✓ ${t('upgradeMax')}</button>`
      : `<button class="buy${can ? '' : ' is-poor'}" data-upgrade="${u.id}">${t('upgradeBtn', { price })}</button>`;
    return `<div class="item forge-item${maxed ? ' is-on' : ''}${!maxed && !can ? ' is-locked' : ''}">
      <span class="icon" aria-hidden="true">${u.icon}</span>
      <b>${t(`${u.id}Name` as Key)}</b>
      <span>${t(`${u.id}Text` as Key)}</span>
      <span class="pips" aria-label="${t('upgradeLevel', { level, max: u.max })}">${pips}</span>
      ${action}
    </div>`;
  }).join('');
  show(`
    <button class="ui-close" type="button" data-act="menu" aria-label="${t('back')}"></button>
    <div class="shop-head"><h2>${t('shop')}</h2><p class="wallet">${coinsLine()}</p></div>
    ${note ? `<p class="note">${note}</p>` : `<p class="how">${t('earnHint')}</p>`}
    <h3 class="slot">${t('forge')}</h3><p class="how">${t('forgeHint')}</p><div class="items">${forge}</div>
    ${groups}
    ${backButton('menu')}`, true);
}

const HAT_SET: Record<string, string> = { wizardHat: 'wizard', gladHelm: 'helm', bandana: 'bandana' };
function stylesScreen() {
  const skins = SKINS.map((skin) => `
    <button class="style skin${save.skin === skin ? ' is-on' : ''}" data-skin="${skin}">
      <span class="icon" aria-hidden="true"><img class="skin-pic" src="./images/game/hero/${skin}-${HAT_SET[save.equipped.head ?? ''] ?? 'base'}-idle.webp" alt=""></span>
      <b>${t(`skin${cap(skin)}Name` as Key)}</b>
      <span>${t(`skin${cap(skin)}Text` as Key)}</span>
    </button>`).join('');
  const cards = STYLES.map((style) => `
    <button class="style${save.style === style ? ' is-on' : ''}" data-style="${style}">
      <span class="icon" aria-hidden="true">${STYLE_ICON[style]}</span>
      <b>${t(`style${cap(style)}Name` as Key)}</b>
      <span>${t(`style${cap(style)}Text` as Key)}</span>
    </button>`).join('');
  show(`<button class="ui-close" type="button" data-act="menu" aria-label="${t('back')}"></button><h2>${t('styles')}</h2>
    <p>${t('skinPick')}</p><div class="styles">${skins}</div>
    <p>${t('stylePick')}</p><div class="styles">${cards}</div>${backButton('menu')}`, true);
}

function startRun(world = save.world) {
  game = newGame(buildLoadout(save.equipped, save.upgrades), save.style, world);
  paused = false;
  shownChoices = '';
  wheelShown = false;
  reviveOffered = false;
  hud.hidden = false;
  hudGear.hidden = false;
  hide();
  hudRoom.style.setProperty('--icon', JSON.stringify(WORLD_ICON[game.world - 1]));
  resize(); // Reserve the live HUD + weapons row, including the iOS safe area.
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
  else if ((act === 'shrine-heal' || act === 'shrine-skill') && game) {
    const got = shrinePick(game, act === 'shrine-heal' ? 'heal' : 'skill');
    wheelShown = false;
    hide();
    if (got.skill) flash(t('wNewSkill', { name: t(`${got.skill}Name` as Key) }));
  }
  else if (act === 'revive-pay' && game) {
    const g = game;
    // The run's coins go first, the bank covers the rest.
    const fromRun = Math.min(Math.floor(g.coins), REVIVE_PRICE);
    g.coins -= fromRun;
    save.coins -= REVIVE_PRICE - fromRun;
    persist();
    paidRevive(g);
    reviveOffered = false;
    hide();
    flash(t('revived'));
  } else if (act === 'revive-no' && game) {
    game.paidRevive = true; // no second offer
    reviveOffered = false;
    endScreen(game);
  }
  else if (act === 'wheel-spin' && game) spinWheel(game);
  else if (act === 'wheel-go' && game) {
    const g = game;
    leaveWheel(g);
    wheelShown = false;
    hide();
    flash(`${worldName(g.world)} · ${t('sprint', { room: g.room })}`);
  }
  else if (act === 'pause') pauseScreen();
  else if (act === 'confirm-quit') leaveScreen('menu');
  else if (act === 'quit') {
    if (game) bankRun(game);
    paused = false;
    menuScreen();
  } else if (act === 'leave-site') {
    if (game) { bankRun(game); persist(); }
    location.href = './index.html';
  } else if (act === 'menu') menuScreen();
  else if (act === 'shop') shopScreen();
  else if (act === 'styles') stylesScreen();
  else if (act === 'options') { optionsFrom = 'menu'; optionsScreen(); }
  else if (act === 'options-pause') { optionsFrom = 'pause'; optionsScreen(); }
  else if (act === 'retro') {
    save.retro = !save.retro;
    palette.retro = save.retro;
    document.documentElement.toggleAttribute('data-retro', save.retro);
    persist();
    resize();
    optionsScreen();
  } else if (act === 'mute') {
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
  } else if (target.dataset.upgrade) {
    const u = upgradeById(target.dataset.upgrade as UpgradeId);
    const level = save.upgrades[u.id] ?? 0;
    const price = upgradePrice(u, level);
    if (level >= u.max) return;
    if (save.coins < price) { shopScreen(t('notEnough')); return; }
    save.coins -= price;
    save.upgrades[u.id] = level + 1;
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
  } else if (target.dataset.skin) {
    save.skin = target.dataset.skin as HeroSkin;
    persist();
    stylesScreen();
  }
  palette.hat = save.equipped.head;
  palette.skin = save.skin;
});

screen.addEventListener('input', (event) => {
  const input = event.target as HTMLInputElement;
  if (!input.dataset.vol) return;
  audio.unlock();
  const value = Number(input.value) / 100;
  if (input.dataset.vol === 'music') save.music = value;
  else save.sfx = value;
  audio.setVolumes(save.music, save.sfx);
  input.style.setProperty('--fill', `${input.value}%`);
  const valueLabel = input.closest('.slider')?.querySelector('b');
  if (valueLabel) valueLabel.textContent = `${input.value}%`;
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
  shoot: 'shoot', knife: 'knife', boomerang: 'boomerang', orb: 'shoot', hit: 'hit', kill: 'kill', gem: 'gem', hurt: 'hurt',
  levelup: 'levelup', slash: 'slash', slam: 'slam', strike: 'strike', boom: 'boom', revive: 'revive', clear: 'door', boss: 'boss',
  heal: 'revive', wheel: 'door', shrine: 'door',
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
const stickRingImage = new Image();
stickRingImage.src = './images/game/ui/stick_ring.webp';
const stickKnobImage = new Image();
stickKnobImage.src = './images/game/ui/stick_knob.webp';
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

/* A meter's fill: the width for the flat retro bars, and --p on the meter
   for the painted ones, whose fill is clipped rather than resized. */
function setMeter(fill: HTMLElement, frac: number) {
  const pct = `${Math.max(0, Math.min(1, frac)) * 100}%`;
  fill.style.width = pct;
  fill.parentElement?.style.setProperty('--p', pct);
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
  // The room starts under the HUD and the weapons row; during a boss fight,
  // under the boss bar too, so it never covers the playfield.
  const bossH = !save.retro && !bossBar.hidden ? bossBar.getBoundingClientRect().height + 4 : 0;
  const top = save.retro ? 86 : Math.max(108, hud.hidden ? 108 : hud.getBoundingClientRect().height + 30) + bossH;
  // Keep the game room below the skinned HUD and the weapons row on notched phones.
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
      if (event === 'clear') flash(g.room === WHEEL_ROOM && g.wheelDoor ? t('wheelHint') : t('doorOpen'));
      if (event === 'shrine') { flash(t('shrineHint')); audio.setIntensity(0.1); }
      if (event === 'heal') flash(t('statueHeal'));
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
    if (phase === 'shrine' && !wheelShown) {
      wheelShown = true;
      stick.on = false;
      keys.clear();
      shrineScreen();
    }
    if (phase === 'wheel' && !wheelShown) {
      wheelShown = true;
      stick.on = false;
      keys.clear();
      wheelScreen();
    }
    if (phase === 'over' && canPayRevive(g)) {
      if (!reviveOffered) { reviveOffered = true; stick.on = false; keys.clear(); audio.play('over'); reviveScreen(g); }
    } else if (phase === 'over' || phase === 'won') endScreen(g);
  }

  if (g) {
    draw(ctx, g, view, palette, now / 1000);
    hudRoom.textContent = `${t('worldShort', { n: g.world })} · ${t('sprint', { room: g.room })}`;
    hudLevel.textContent = t('level', { level: g.level });
    setMeter(hudXp, g.xp / g.xpNext);
    setMeter(hudHp, Math.max(0, g.player.hp) / g.player.maxHp);
    hudCoins.textContent = String(Math.floor(g.coins));
    const gear = [['bow', 1] as const, ...ownedWeapons(g).map((id) => [id, g.skills[id]] as const)];
    const gearKey = gear.map(([id, lvl]) => `${id}${lvl}`).join(' ');
    if (hudGear.dataset.gear !== gearKey) {
      hudGear.dataset.gear = gearKey;
      hudGear.innerHTML = gear.map(([id, lvl]) => `<span>${skillIcon(id, 22)}<sub>${lvl}</sub></span>`).join('');
    }
    const boss = isBossRoom(g.room) ? g.enemies.find((e) => e.kind === 'boss' && e.spawn <= 0) : undefined;
    if (bossBar.hidden !== !boss) {
      bossBar.hidden = !boss;
      requestAnimationFrame(resize); // the room makes room for the bar (after layout)
    }
    if (boss) {
      bossName.textContent = t(BOSS_NAME[boss.look]);
      setMeter(bossHp, Math.max(0, boss.hp) / boss.maxHp);
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
    if (!save.retro && stickRingImage.complete && stickRingImage.naturalWidth) {
      const size = STICK * 2.6;
      ctx.globalAlpha = 0.8;
      ctx.drawImage(stickRingImage, cx - size / 2, cy - size / 2, size, size);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, STICK, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    const knobX = cx + dx * k;
    const knobY = cy + dy * k;
    if (!save.retro && stickKnobImage.complete && stickKnobImage.naturalWidth) {
      ctx.drawImage(stickKnobImage, knobX - 25, knobY - 25, 50, 50);
    } else {
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(knobX, knobY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

// On localhost only: a handle on the running game, so the screens that need
// a long run to reach (the statue, the wheel) can be checked by a script.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  Object.defineProperty(window, 'bugHunter', { get: () => game });
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
