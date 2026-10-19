import './game.css';
import { storage } from '../lib/storage';
import { ads, configureAds, type AdSpot, type PlayAd } from './ads';
import { configurePayments, payments } from './payments';
import { COIN_PACKS, currentOffer, grant, packBonus, SKIN_OFFERS, type CoinPack, type SkinOffer } from './store';
import { DAILY_ODDS, DAILY_WHEEL, dailyLeft, dailyReady, openDaily, type DailyPrize, type DailyResult } from './daily';
import { audio, type Sfx } from './audio';
import { draw, drawRetroFigure, preloadFx, type Palette, type View } from './draw';
import { DEFAULT_NAME, NAME_MAX, STAR_COLORS, cleanName, wipeProgress, worldWon, type StarColor, loadSave, profileLevel, writeSave, STYLES, SKINS, SKIN_PRICE, type EnemyStyle, type HeroSkin, heroStill } from './save';
import type { Enemy, Mode } from './world';
import { ARMOUR_SLOTS, ARSENAL, ITEMS, itemLevel, type SpiritSkin, UPGRADES, WEAPON_SLOTS, buildLoadout, itemById, upgradeById, upgradePic, upgradePrice, type ItemId, type Slot, type UpgradeId } from './shop';
import { Scene } from './scene';
import { makeT, pickLang, type Key } from './strings';
import {
  CATEGORY, EVO_PARTNER, H, NIGHTMARE_WORLD, canFuse, revivePrice, SKILLS, arrowLook, arrowOptions, bladeElement, bladeOptions, canEvolve, evoOf, fusionOf, fusionWith, pairFusion, arrowElements, settleEffects, rerollChoices, adReroll, adRevive, canAdReroll, canAdRevive, maxLevel, pickArrow, pickBlade, pickSpirit, ROOMS, W, WHEEL, WHEEL_COINS, WHEEL_GOOD, WHEEL_LUCKY, WHEEL_ROOM, WORLDS, WORLD_COUNT, applyWheel, chooseSkill, isBossRoom, leaveWheel, newGame, ownedWeapons, paidRevive, shrinePick, update,
  type ArrowLook, type Category, type Choice, type Fusion, type Game, type GameEvent, type Input, type Look, type SkillId, type WheelOutcome,
} from './world';

/* Bug Hunter's page: the menus (play, shop, enemy looks, options), input
   (touch joystick or keyboard), sound hooks and the frame loop. The rules are
   in world.ts, the drawing in draw.ts, the music in audio.ts. */

const lang = pickLang();
const t = makeT(lang);
document.documentElement.lang = lang;
document.title = `${t('title')} · alvrich`;
configurePayments({ title: t('payTestTitle'), note: t('payTestNote'), ok: t('payTestOk'), cancel: t('payTestCancel') });
configureAds({ pause: () => audio.duck(true), resume: () => audio.duck(false), text: { title: t('adDevTitle'), skip: t('adDevSkip') } });

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
const gearPanel = $<HTMLElement>('gearPanel');
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
audio.setSong(save.song);
dressPalette();
palette.retro = save.retro;
document.documentElement.toggleAttribute('data-retro', save.retro);

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const nightmareLine = () => (save.nightmareBest ? t('nightmareBest', { time: clock(save.nightmareBest.time), kills: save.nightmareBest.kills }) : t('bestNone'));
const bestLine = (world = worldIn(), mode: Mode = save.mode) => {
  if (mode === 'horde') {
    const best = save.hordeBest[world];
    if (!best) return '';
    return best.won ? t('hordeBestWon', { kills: best.kills }) : t('hordeBest', { time: clock(best.time), kills: best.kills });
  }
  const best = save.bestByWorld[world];
  if (!best) return '';
  if (best.time !== undefined) return t('bestWin', { time: clock(best.time) });
  return best.room ? t('best', { room: best.room }) : '';
};
/* Each mode has its own world progress: sprints keep `unlocked`/`world`, on call `hordeUnlocked`/`hordeWorld`. */
const unlockedIn = (mode: Mode = save.mode) => (mode === 'horde' ? save.hordeUnlocked : save.unlocked);
const worldIn = (mode: Mode = save.mode) => (mode === 'horde' ? save.hordeWorld : save.world);
function setWorld(n: number, mode: Mode = save.mode) {
  if (mode === 'horde') save.hordeWorld = n;
  else save.world = n;
}
const modeName = (mode: Mode = save.mode) => t(mode === 'horde' ? 'modeHorde' : 'modeSprints');
const MODE_ICON: Record<Mode, string> = { sprints: '⚔️', horde: '🛡️' };
const NIGHTMARE_ICON = '☠️';
/** Where the run is: the sprint, or the shift's clock. */
const whereLine = (g: Game) => (g.mode === 'horde' ? `${g.endless ? NIGHTMARE_ICON : MODE_ICON.horde} ${clock(g.time)}` : t('sprint', { room: g.room }));
const worldName = (n: number) => t(`world${n}Name` as Key);
const WORLD_ICON = ['🐞', '🔥', '💧', '🍃', '🛡️', '✨', '👻', '💗'];
const coinsLine = (n = save.coins) => `<span class="coin">🪙</span> ${Math.floor(n)}`;

/** The arsenal weapon the last banked run put on sale (its world won for the first time), for the end screen. */
let arsenalOpened: SkillId | null = null;
/** …and the shop item it put on sale (the Senior's Tome waits for the last world). */
let itemOpened: ItemId | null = null;
/** An item that waits for a world is on sale once that world is won in either mode. */
const itemOpen = (item: { world?: number }) => !item.world || worldWon(save, item.world);
/** Banks the coins and the record; returns the world unlocked by this run, if any. */
function bankRun(g: Game): number | null {
  const won = g.phase === 'won';
  const wasWon = worldWon(save, g.world);
  if (g.endless) {
    // Nightmare: only the longest run counts, and it opens nothing.
    const best = save.nightmareBest;
    if (!best || g.time > best.time) save.nightmareBest = { time: g.time, kills: g.kills };
  } else if (g.mode === 'horde') {
    // On call: the longest shift counts, a cleared one above all.
    const best = save.hordeBest[g.world];
    const better = !best || (won && !best.won) || (won === best.won && g.time > best.time);
    if (better) save.hordeBest[g.world] = { time: g.time, kills: g.kills, won };
  } else {
    const best = save.bestByWorld[g.world] ?? { room: 0 };
    const better = won ? best.time === undefined || g.time < best.time : best.time === undefined && g.room > (best.room || 0);
    if (better) save.bestByWorld[g.world] = won ? { room: ROOMS, time: g.time } : { room: g.room };
    if (g.world === 1) save.best = save.bestByWorld[1];
  }
  save.coins += Math.floor(g.coins);
  save.runs += 1;
  save.xp += Math.round(g.xpEarned);
  let unlocked: number | null = null;
  if (won && g.world < WORLD_COUNT && unlockedIn(g.mode) < g.world + 1) {
    if (g.mode === 'horde') save.hordeUnlocked = g.world + 1;
    else save.unlocked = g.world + 1;
    setWorld(g.world + 1, g.mode);
    unlocked = g.world + 1;
  }
  const weapon = ARSENAL.find((a) => a.world === g.world);
  arsenalOpened = won && !wasWon && weapon && !save.arsenal.includes(weapon.id) ? weapon.id : null;
  const item = ITEMS.find((it) => it.world === g.world);
  itemOpened = won && !wasWon && item && !save.owned.includes(item.id) ? item.id : null;
  persist();
  return unlocked;
}

/* ------------------------------------------------------------------ screens */

/** The painted medallion of a skill (static/images/game/skills/, one per skill id). */
const EMOJI: Record<SkillId | 'bow', string> = {
  sword: '🗡️', blades: '🌀', hammer: '🔨', storm: '🌩️', fireball: '☄️', frost: '❄️', spirits: '👻', laser: '🔦', knives: '🔪', boomerang: '🪃',
  fire: '🔥', water: '💧', leaf: '🍃', bolt: '⚡', spark: '✨', ghost: '🫥', double: '🏹', speed: '⏩', power: '💥', heart: '💗', bow: '🏹',
  shoes: '👟', bracer: '🦾', drink: '🥤',
  brick: '🧱', molotov: '🍾', durian: '🌵', mines: '💣', drill: '🔩', rocket: '🚀', ball: '⚽',
};
/* The painted medallion, with the emoji beside it for the retro look (CSS shows one or the other). */
const skillIcon = (id: SkillId | 'bow', size = 40, file: string = id === 'bow' ? 'double' : id) => `<img class="skill-icon" src="./images/game/skills/${file}.webp" width="${size}" height="${size}" alt=""><span class="skill-emoji">${EMOJI[id]}</span>`;
/** Weapons with their own evolved medallion (`skills/<id>-evo.webp`). */
const EVO_ICON: SkillId[] = ['laser', 'brick', 'molotov', 'durian', 'mines', 'drill', 'rocket', 'ball', 'sword', 'blades', 'hammer', 'fireball', 'frost', 'spirits', 'boomerang', 'knives', 'storm'];
const evoIcon = (id: SkillId, g?: Game) => {
  if (!EVO_ICON.includes(id)) return id;
  // The Orbital Saw's medallion takes the colour of the blades' element.
  const el = id === 'blades' && g ? bladeElement(g) : 'steel';
  return el === 'steel' ? `${id}-evo` : `${id}-evo-${el}`;
};
/** The blades show their element's medallion once they have one; the laser its colour (yellow, red from level 2, purple evolved); evolved weapons their evolution's. */
/** The medallion for a skill at `lv` (its current level unless a level-up card shows the next one). */
const iconFile = (g: Game, id: SkillId | 'bow', lv = id === 'bow' ? 0 : g.skills[id]) => {
  if (id !== 'bow' && g.evolved[id] && EVO_ICON.includes(id)) return evoIcon(id, g);
  if (id === 'laser') return lv >= 3 ? 'laser-red' : lv >= 2 ? 'laser-orange' : 'laser';
  if (id === 'bow') {
    // The bow wears the arrow you picked: its medallion (the fusion's once fused and worn).
    const look = arrowLook(g);
    const fusion = fusionOf(g);
    return look === 'fusion' && fusion ? `fusion-${fusion}` : look ?? 'double';
  }
  if (id !== 'blades') return id;
  const el = bladeElement(g);
  return el === 'steel' ? 'blades' : `blades-${el}`;
};
const CATEGORY_LABEL: Record<Category, Key> = { melee: 'catMelee', magic: 'catMagic', ranged: 'catRanged', upgrade: 'catUpgrade' };
const SLOT_LABEL: Record<Slot, Key> = { head: 'slotHead', body: 'slotBody', boots: 'slotBoots', magic: 'slotMagic', melee: 'slotMelee', ranged: 'slotRanged' };
const SLOT_ICON: Record<Slot, string> = { head: '🪖', body: '🦺', boots: '🥾', magic: '🔮', melee: '⚔️', ranged: '🏹' };
/** A painted icon with its emoji behind it for retro (the same switch as `skillIcon`). */
const picIcon = (emoji: string, pic?: string) => pic ? `<img class="item-pic" src="./images/game/${pic}" alt=""><span class="skill-emoji">${emoji}</span>` : emoji;
const STYLE_ICON: Record<EnemyStyle, string> = { world: '🌍', original: '🐞', demon: '😈', viking: '🪓', jungle: '🕷️', greek: '🏛️', robot: '🤖', nightmare: '💀', random: '🎲' };
/** A boss's name: the cast's boss in room 6, the world's own final boss in room 12. */
const bossTitle = (e: Enemy) => t(e.final ? (`final${cap(e.bossId)}` as Key) : BOSS_NAME[e.look]);
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
  short: { l: 0.13, r: 0.13, t: 0.11, b: 0.1, ratio: 720 / 600 },
  tall: { l: 0.13, r: 0.13, t: 0.075, b: 0.07, ratio: 1105 / 620 },
};
function fitPanel() {
  const panel = screen.querySelector<HTMLElement>('.panel');
  const inner = panel?.querySelector<HTMLElement>('.panel-in');
  if (!panel || !inner || screen.hidden || screen.classList.contains('is-menu') || screen.classList.contains('is-map')) return;
  if (save.retro) { panel.classList.remove('is-tall'); panel.style.height = ''; panel.style.padding = ''; return; }
  // offsetWidth, not the bounding box: the pop-up zoom must not shrink the measure.
  const w = panel.offsetWidth;
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
  if (inner.dataset.scroll) inner.scrollTop = Number(inner.dataset.scroll);
}
window.addEventListener('resize', fitPanel);

/** The coin emoji is silver on iPhones: outside retro every 🪙 in a dialog becomes the painted gold coins. */
const COIN_PIC = '<i class="coin-ic" aria-hidden="true"></i>';
/** How long the run's last moment stays on the field before its dialog. */
const END_PAUSE = 1100;
function show(html: string, wide = false, menu = false, extra = '') {
  // A dialog that opens (not one re-rendering itself) pops up with a zoom.
  const opening = screen.hidden;
  if (!save.retro) html = html.replaceAll('🪙', COIN_PIC);
  // A dialog that re-renders itself (the shop after a purchase) keeps its scroll.
  const keepScroll = extra === 'keep-scroll' ? screen.querySelector('.panel-in')?.scrollTop ?? 0 : 0;
  // The corner buttons (close, options) are pulled out of the scrolling box so they stay put.
  const close = (html.match(/<button class="ui-(?:close|opts)"[^>]*>(?:<span[^<]*<\/span>)?<\/button>/g) ?? []).join('');
  for (const b of html.match(/<button class="ui-(?:close|opts)"[^>]*>(?:<span[^<]*<\/span>)?<\/button>/g) ?? []) html = html.replace(b, '');
  const cls = `panel${wide ? ' panel-wide' : ''}${opening && !menu && extra !== 'is-map' ? ' is-pop' : ''}`;
  const old = opening ? null : screen.querySelector<HTMLElement>(':scope > .panel');
  if (old) {
    // A dialog re-rendering itself (a pick, a purchase, a colour) keeps its frame element and every picture
    // it still shows, so nothing blinks while the browser decodes them again (Safari shows a new <img> blank
    // for a frame even when it is cached).
    const kept = new Map<string, HTMLImageElement[]>();
    for (const img of old.querySelectorAll('img')) {
      const list = kept.get(img.src) ?? [];
      list.push(img);
      kept.set(img.src, list);
    }
    old.className = cls;
    old.removeAttribute('style');
    old.innerHTML = `${close}<div class="panel-in">${html}</div>`;
    for (const img of old.querySelectorAll('img')) {
      const same = kept.get(img.src)?.shift();
      if (!same) continue;
      // Only what differs is touched: setting src again could start a reload.
      for (const { name } of [...same.attributes]) if (!img.hasAttribute(name)) same.removeAttribute(name);
      for (const { name, value } of [...img.attributes]) if (same.getAttribute(name) !== value) same.setAttribute(name, value);
      img.replaceWith(same);
    }
  } else {
    screen.innerHTML = `<div class="${cls}">${close}<div class="panel-in">${html}</div></div>`;
  }

  screen.classList.toggle('is-menu', menu);
  screen.classList.toggle('is-map', extra === 'is-map');
  screen.classList.toggle('is-levelup', extra === 'is-levelup');
  screen.hidden = false;
  screen.scrollTop = 0;
  // fitPanel() may run again later (fonts, pictures); each run restores this.
  const inner = screen.querySelector<HTMLElement>('.panel-in');
  if (inner && keepScroll) inner.dataset.scroll = String(keepScroll);
  fitPanel();
  // Fonts and pictures may still be arriving: fit once more when they are in.
  if ('fonts' in document) document.fonts.ready.then(fitPanel);
}
function hide() {
  screen.hidden = true;
  screen.classList.remove('is-menu', 'is-map', 'is-levelup');
  screen.innerHTML = '';
}
/* Rewarded ads (ads.ts). A screen with an ad spot leaves an empty
   `data-ad-slot` and calls offerAd(); its button only appears once an ad is
   ready, so with no provider (or no ad) nothing shows at all. */
const adPlays = new Map<AdSpot, PlayAd>();
function offerAd(spot: AdSpot, button: string) {
  if (!ads.enabled) return;
  const fill = (play: PlayAd | null) => {
    const slot = screen.querySelector<HTMLElement>(`[data-ad-slot="${spot}"]`);
    if (!play || !slot) return;
    adPlays.set(spot, play);
    slot.innerHTML = save.retro ? button : button.replaceAll('🪙', COIN_PIC);
    fitPanel();
  };
  const ready = adPlays.get(spot);
  if (ready) fill(ready);
  else void ads.prepare(spot).then(fill);
}
/** Plays the ad a spot was given; true once it was watched to the end. */
function watchAd(spot: AdSpot) {
  const play = adPlays.get(spot);
  adPlays.delete(spot);
  return play ? play() : Promise.resolve(false);
}
/** 3 h 20 min, 4 h, 35 min. */
const waitText = (ms: number) => {
  const mins = Math.ceil(ms / 60e3);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
};
/** The shop's gift: some coins for an ad, once every few hours. */
const AD_GIFT_COINS = 300;
const AD_GIFT_EVERY = 4 * 3600 * 1000;
/** The coins the last end screen showed, for doubling them. */
let adEarned = 0;

const backButton = (act: string, label: Key = 'menu') => `<button class="ghost" data-act="${act}">← ${t(label)}</button>`;

function menuScreen() {
  game = null;
  hud.hidden = true;
  hudGear.hidden = true;
  closeGearPanel();
  bossBar.hidden = true;
  // The cover keeps the music as full as in a run (it used to be muffled here).
  audio.setIntensity(0.5);
  audio.setBoss(false);
  audio.setFinal(false, false);
  const { level, progress } = profileLevel(save.xp);
  const copy = (cls: string, title: string, sub: string) => `<span class="cover-card-copy ${cls}"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>`;
  show(`
    <div class="cover">
      <a class="hot cover-x" href="./index.html" aria-label="${t('back')}"></a>
      <button class="hot cover-more" data-act="options" aria-label="${t('options')}"></button>
      <div class="cover-in">
      <button class="hot cover-gear" data-act="options" aria-label="${t('options')}"></button>
      <button class="hot cover-profile" data-act="profile" aria-label="${t('profile')}: ${esc(save.name)} · ${t('lvShort', { level })}"></button>
      <span class="cover-avatar" aria-hidden="true"><img src="${heroPic()}" alt=""></span>
      <span class="cover-profile-copy"><small>${esc(save.name)}${masteries() ? ` ${stars()}` : ''}</small><b>${t('lvShort', { level })}</b><i><b style="width:${Math.round(progress * 100)}%"></b></i></span>
      <button class="hot cover-coins" data-act="coin-store" aria-label="${t('storeTitle')}: ${Math.floor(save.coins)}"></button>
      <span class="cover-num is-coins">${Math.floor(save.coins)}</span>
      <button class="hot cover-worlds" data-act="map" aria-label="${t('map')}: ${unlockedIn()}/${WORLD_COUNT}"></button>
      <span class="cover-num is-worlds">${unlockedIn()}/${WORLD_COUNT}</span>
      <p class="cover-tagline">${t('landingTagline')}</p>
      <button class="cover-chest${dailyReady(save) ? ' is-ready' : ''}" type="button" data-act="daily" aria-label="${t('dailyTitle')}"><img src="./images/game/fx/chest.webp" width="165" height="140" alt=""><i${dailyReady(save) ? '>' + t('dailyReady') : ` data-daily-clock>${dailyClock()}`}</i></button>
      <button class="hot cover-play" data-act="play" aria-label="${t('playNow')} · ${worldName(worldIn())}"></button>
      <span class="cover-play-copy"><b>${t('playNow')}</b><small>${WORLD_ICON[worldIn() - 1]} ${worldName(worldIn())}</small></span>
      <button class="cover-mode" type="button" data-act="mode" aria-label="${t('modePick')}: ${modeName()}"><span class="${save.mode === 'sprints' ? 'is-on' : ''}">${MODE_ICON.sprints} ${t('modeSprints')}</span><span class="${save.mode === 'horde' ? 'is-on' : ''}">${MODE_ICON.horde} ${t('modeHorde')}</span></button>
      <button class="hot cover-card is-map" data-act="map" aria-label="${t('map')}"></button>
      ${copy('is-map', t('map'), `🌍 ${unlockedIn()} / ${WORLD_COUNT}`)}
      <button class="hot cover-card is-shop" data-act="shop" aria-label="${t('shop')}"></button>
      ${copy('is-shop', t('shop'), `🪙 ${Math.floor(save.coins)}`)}
      <button class="hot cover-card is-styles" data-act="styles" aria-label="${t('styles')}"></button>
      ${copy('is-styles', t('styles'), t(`skin${cap(save.skin)}Name` as Key))}
      <button class="hot cover-card is-options" data-act="options" aria-label="${t('options')}"></button>
      ${copy('is-options', t('options'), '')}
      <p class="cover-best">${bestLine()}</p>
    </div></div>`, false, true);
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** The player's name goes into HTML: escape it. */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/* Masteries: clear all eight worlds of a mode and the map offers that mode's
   mastery. Taking it wipes the progress (`wipeProgress`) for a small
   permanent boost (`MASTERY_STEP`, folded in by `buildLoadout`) and a star by
   the name, whose colour the profile picks. */
const masteries = () => save.mastery.sprints + save.mastery.horde;
const clearedIn = (mode: Mode) =>
  Array.from({ length: WORLD_COUNT }, (_, i) => i + 1).filter((w) => (mode === 'horde' ? save.hordeBest[w]?.won : save.bestByWorld[w]?.time !== undefined)).length;
const worldsLeft = (mode: Mode) => WORLD_COUNT - clearedIn(mode);
const starColor = () => STAR_COLORS[save.starColor];
/** The stars by the name: one per mastery, in the chosen colour. */
const stars = () => (masteries() ? `<span class="mstars" style="--star:${starColor()}" aria-label="${t('profileStars')}: ${masteries()}">${'★'.repeat(Math.min(masteries(), 5))}${masteries() > 5 ? `×${masteries()}` : ''}</span>` : '');
const modeShort = (mode: Mode) => t(mode === 'horde' ? 'modeHordeShort' : 'modeSprintsShort');
function resetScreen() {
  show(`<h2>${t('resetTitle')}</h2>
    <p class="note">${t('resetLeft', { sprints: worldsLeft('sprints'), horde: worldsLeft('horde') })}</p>
    <p>${t('resetText')}</p>
    <button class="ghost is-danger" data-act="reset-do">${t('resetDo')}</button>
    <button class="primary" data-act="profile">${t('cancel')}</button>`);
}
function masteryScreen(mode: Mode) {
  show(`<h2>★ ${t('masteryTitle', { mode: modeShort(mode) })}</h2>
    <p>${t('masteryText')}</p>
    <p class="how">${t('masteryHave', { n: masteries() })}</p>
    <button class="primary" data-act="mastery-do" data-mode-m="${mode}">${t('masteryDo')}</button>
    <button class="ghost" data-act="map">${t('cancel')}</button>`);
}

/* The profile: the player's name (shown on the cover), their level and a few
   totals. The name is kept in the save, cleaned by `cleanName`. */
/* The name shows once, by the hero, with a green pencil; the pencil turns it into a field with ✓ and ✕. */
let editingName = false;
const PENCIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" fill="currentColor"/><path d="M14 6l4 4" stroke="#14532d" stroke-width="1.6"/></svg>';
const TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
function profileScreen(note = '') {
  const { level, progress } = profileLevel(save.xp);
  // While editing, the field takes the whole row under the hero.
  const name = editingName
    ? `<form class="profile-name is-editing" data-form="name" novalidate>
        <input id="profileName" name="name" type="text" value="${esc(save.name)}" maxlength="${NAME_MAX}" autocomplete="nickname" spellcheck="false" enterkeyhint="done" aria-label="${t('profileName')}">
        <button class="name-btn is-ok" type="submit" aria-label="${t('profileSave')}">${TICK}</button>
        <button class="name-btn is-cancel" type="button" data-act="name-cancel" aria-label="${t('profileCancel')}">${CROSS}</button>
      </form>`
    : `<div class="profile-name"><b>${esc(save.name)}</b><button class="name-btn is-edit" type="button" data-act="name-edit" aria-label="${t('profileEdit')}">${PENCIL}</button></div>`;
  const pic = save.retro ? './images/favicon-192.png' : heroPic();
  const stat = (label: Key, value: string) => `<div class="pstat"><small>${t(label)}</small><b>${value}</b></div>`;
  show(`<button class="ui-close" type="button" data-act="menu" aria-label="${t('back')}"></button>
    <h2>${t('profile')}</h2>
    <div class="profile-card">
      <img class="profile-pic${save.retro ? ' is-round' : ''}" src="${pic}" alt="" width="96" height="120">
      <div class="profile-who">${editingName ? '' : name}${stars()}<span>${t('lvShort', { level })}</span><i class="profile-xp" title="${t('profileXp')}"><b style="width:${Math.round(progress * 100)}%"></b></i></div>
    </div>
    ${editingName ? `<div class="profile-form">${name}<small class="how">${t('profileNameHint')}</small>${save.name !== DEFAULT_NAME ? `<button class="ghost small" type="button" data-act="name-reset">${t('profileReset')}</button>` : ''}</div>` : ''}
    ${note ? `<p class="saved" role="status">✓ ${note}</p>` : ''}
    <div class="pstats">
      ${stat('profileRuns', String(save.runs))}
      ${stat('profileWorlds', `${unlockedIn()}/${WORLD_COUNT}`)}
      ${stat('profileCoins', `🪙 ${Math.floor(save.coins)}`)}
    </div>
    <h3 class="slot">${t('profileStars')}</h3>
    ${masteries()
      ? `<p class="mastery-line"><span style="color:${starColor()}">★</span> ${modeShort('sprints')} ${save.mastery.sprints} · ${modeShort('horde')} ${save.mastery.horde}</p>
         <div class="star-pick" role="group" aria-label="${t('profileStarColor')}">${(Object.keys(STAR_COLORS) as StarColor[]).map((c) => `<button type="button" class="star-chip${c === save.starColor ? ' is-on' : ''}" data-star="${c}" style="--star:${STAR_COLORS[c]}" aria-pressed="${c === save.starColor}" aria-label="${c}">★</button>`).join('')}</div>`
      : `<p class="how">${t('masteryNone')}</p>`}
    <button class="ghost is-danger" data-act="reset-ask">${t('resetBtn')}</button>
    ${backButton('menu')}`, false, false, 'keep-scroll');
  if (editingName) {
    const input = screen.querySelector<HTMLInputElement>('#profileName');
    input?.focus();
    input?.select();
  }
}
function setName(raw: string) {
  editingName = false;
  save.name = cleanName(raw) || DEFAULT_NAME;
  persist();
  profileScreen(t('profileSaved'));
}

/* Death with a full purse: coins (banked plus this run's) put you back on
   your feet before the game-over screen, 500 the first time and 1000 the
   second, twice a run at most. */
const canPayRevive = (g: Game) => {
  const price = revivePrice(g);
  return price !== null && save.coins + Math.floor(g.coins) >= price;
};
function reviveScreen(g: Game, note = '') {
  const price = revivePrice(g) ?? 0;
  const last = g.paidRevives >= 1;
  const pay = canPayRevive(g);
  const ad = canAdRevive(g) && ads.enabled;
  show(`${head('defeat', t('reviveTitle'))}<p>${pay ? t(last ? 'reviveTextLast' : 'reviveText', { coins: price }) : t('reviveAdText')}</p>
    ${note ? `<p class="note">${note}</p>` : ''}
    ${pay ? `<p class="earned">${coinsLine(save.coins + Math.floor(g.coins))}</p>` : ''}
    ${ad ? '<div class="ad-slot" data-ad-slot="revive"></div>' : ''}
    ${pay ? `<button class="primary" data-act="revive-pay">${t('reviveBtn', { coins: price })}</button>` : ''}
    <button class="ghost" data-act="revive-no">${t('reviveNo')}</button>`);
  if (ad) offerAd('revive', `<button class="primary ad-btn" data-act="ad-revive">📺 ${t('adRevive')}</button>`);
}
/* At a game over: the revive screen when coins can pay for one; when only an
   ad could, it waits for one to be ready and goes to the end screen if none is. */
function offerRevive(g: Game) {
  if (canPayRevive(g)) { reviveScreen(g); return; }
  void ads.prepare('revive').then((play) => {
    if (game !== g || g.phase !== 'over') return;
    if (!play) { reviveOffered = false; endScreen(g); return; }
    adPlays.set('revive', play);
    reviveScreen(g);
  });
}

function endScreen(g: Game) {
  hud.hidden = true;
  hudGear.hidden = true;
  closeGearPanel();
  bossBar.hidden = true;
  const won = g.phase === 'won';
  const earned = Math.floor(g.coins);
  const unlocked = bankRun(g);
  audio.play(won ? 'win' : 'over');
  const next = unlocked
    ? `<p class="unlocked">${WORLD_ICON[unlocked - 1]} ${t('unlockedWorld', { n: unlocked })}<small>${worldName(unlocked)}</small></p>
       <button class="primary" data-act="map">🗺️ ${t('toMap')}</button>
       <button class="ghost" data-act="play-same">${t('again')}</button>`
    : `<button class="primary" data-act="play-same">${t('again')}</button>`;
  const horde = g.mode === 'horde';
  const record = g.endless && save.nightmareBest?.time === g.time;
  show(`
    <p class="kicker">${worldName(g.world)} · ${g.endless ? `${NIGHTMARE_ICON} ${t('nightmare')}` : horde ? `${MODE_ICON.horde} ${modeName('horde')}` : t('sprint', { room: g.room })}</p>
    ${head(won ? 'victory' : 'defeat', t(horde ? (won ? 'hordeWon' : 'over') : won ? 'won' : 'over'))}
    <p>${t(horde ? (won ? 'hordeWonText' : 'hordeOverText') : won ? 'wonText' : 'overText', { room: g.room, kills: g.kills, time: clock(g.time) })}</p>
    ${record ? `<p class="unlocked">${NIGHTMARE_ICON} ${t('nightmareRecord')}</p>` : ''}
    <p class="earned">${coinsLine(earned)} <small>${t('coinsRun', { coins: earned })}</small></p>
    ${earned > 0 && ads.enabled ? '<div class="ad-slot" data-ad-slot="doubleCoins"></div>' : ''}
    ${itemOpened ? `<p class="unlocked">${picIcon(itemById(itemOpened).icon, itemById(itemOpened).pic)} ${t('itemNew', { name: t(`${itemOpened}Name` as Key) })}</p>` : ''}
    ${arsenalOpened ? `<p class="unlocked">${picIcon(EMOJI[arsenalOpened], `skills/${arsenalOpened}.webp`)} ${t('arsenalNew', { name: t(`${arsenalOpened}Name` as Key) })}</p>` : ''}
    ${next}
    <div class="row">
      <button class="ghost is-warn" data-act="shop">🛒 ${t('shop')}</button>
      <button class="ghost" data-act="menu">${t('menu')}</button>
    </div>
    <p class="best">${g.endless ? nightmareLine() : bestLine(g.world, g.mode)}</p>`);
  adEarned = earned;
  if (earned > 0) offerAd('doubleCoins', `<button class="primary ad-btn" data-act="ad-double">📺 ${t('adDouble', { coins: earned })}</button>`);
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
  if (!mapPick || mapPick > unlockedIn() + 1) mapPick = worldIn();
  const picked = mapPick;
  const pickedOpen = picked <= unlockedIn();
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
    return { n, m, w, h, left, top, cx, cy, open: n <= unlockedIn() };
  });
  const trail = stops.slice(0, -1).map((a, i) => {
    const b = stops[i + 1];
    const mx = (a.cx + b.cx) / 2;
    return `<path class="trail${b.open ? '' : ' is-locked'}" d="M ${a.cx} ${a.cy} Q ${mx} ${a.cy + (b.cy - a.cy) * 0.15} ${b.cx} ${b.cy}"/>`;
  }).join('');
  const islands = stops.map((st) => {
    // The badge always shows (the art has a padlock painted there): locked, cleared, how far you got
    // (the sprint, or the longest shift on call) or ▶ for a world not tried yet.
    const best = save.bestByWorld[st.n];
    const shift = save.hordeBest[st.n];
    const horde = save.mode === 'horde';
    const done = horde ? !!shift?.won : best?.time !== undefined;
    const tried = horde ? shift ? clock(shift.time) : '' : best?.room ? `${best.room}/${ROOMS}` : '';
    const under = !st.open ? '🔒' : done ? '✓' : tried || '▶';
    const style = `left:${(st.left / MAP_W) * 100}%;top:${(st.top / MAP_H) * 100}%;width:${(st.w / MAP_W) * 100}%;--rx:${st.m.ring[0]}%;--ry:${st.m.ring[1]}%;--px:${st.m.plate[0]}%;--py:${st.m.plate[1]}%;--pw:${st.m.plate[2]}%;--ph:${st.m.plate[3]}%;--bx:${st.m.badge[0]}%;--by:${st.m.badge[1]}%;--c:${WORLDS[st.n - 1].tint || '#38bdf8'}`;
    const cls = `${st.open ? ' is-open' : ' is-locked'}${st.n === picked ? ' is-picked' : ''}`;
    // The art overlaps its neighbours, so the ring, plate and badges sit in a layer of their own over every island.
    return [`
      <button class="isle${cls}" data-world="${st.n}" style="${style}" aria-label="${t('worldN', { n: st.n })} · ${worldName(st.n)}">
        <img src="./images/game/map/${ISLAND_ART[st.n - 1]}.webp" alt="" width="${st.m.w}" height="${st.m.h}">
      </button>`, `
      <span class="isle isle-labels${cls}" style="${style};aspect-ratio:${st.m.w}/${st.m.h}" aria-hidden="true">
        <span class="isle-ring"><span>${WORLD_ICON[st.n - 1]}</span></span>
        ${st.n === picked ? `<span class="isle-hero"><img src="${heroPic()}" alt=""></span>` : ''}
        <span class="isle-plate${worldName(st.n).length > 16 ? ' is-long' : ''}">${worldName(st.n)}</span>
        ${under ? `<span class="isle-under${done ? ' is-done' : ''}${st.open ? '' : ' is-lock'}">${under}</span>` : ''}
      </span>`];
  });
  const islandArt = islands.map((x) => x[0]).join('') + islands.map((x) => x[1]).join('');
  const modes = (['sprints', 'horde'] as Mode[]).map((m) =>
    `<button class="mode-opt${save.mode === m ? ' is-on' : ''}" data-mode="${m}" aria-pressed="${save.mode === m}" title="${t(m === 'horde' ? 'modeHordeText' : 'modeSprintsText')}">${MODE_ICON[m]} ${modeName(m)}</button>`).join('');
  const status = pickedOpen
    ? `<small class="map-record">▮▮▮ ${bestLine(picked) || t('bestNone')}</small>`
    : `<small class="map-locked">🔒 ${t('lockedUntil', { n: picked - 1 })}</small>`;
  const mastery = worldsLeft(save.mode) === 0
    ? `<button class="primary mastery-btn" data-act="mastery-ask">${t('masteryBtn', { mode: modeShort(save.mode) })}</button>`
    : '';
  // Nightmare: On call in the last world with no clock, once that world is open there.
  const nightmare = save.mode === 'horde' && picked === NIGHTMARE_WORLD && pickedOpen
    ? `<button class="ghost is-danger nightmare-btn" data-act="play-nightmare">${NIGHTMARE_ICON} ${t('nightmare')} ∞</button><small class="map-record nightmare-rec">${t('nightmareText')} · ${nightmareLine()}</small>`
    : '';
  const action = pickedOpen
    ? `<button class="play" data-act="play-picked"><span class="play-tri" aria-hidden="true"></span><span class="play-copy">${t('playWorld', { n: picked })}</span></button>${nightmare}`
    : `<button class="play is-locked" disabled><span class="play-lock" aria-hidden="true">🔒</span><span class="play-copy">${t('lockedBtn')}</span></button>`;
  // Only the islands scroll; the title, the world's card and the play button stay put. Picking an island
  // re-renders the screen, so the islands keep their scroll.
  const kept = screen.querySelector<HTMLElement>('.map-scroll')?.scrollTop;
  show(`
    <button class="ui-close" type="button" data-act="menu" aria-label="${t('menu')}"></button>
    <div class="mapscreen">
      <h2 class="map-title"><span>${t('map')}</span></h2>
      <div class="map-scroll">
        <div class="map" style="aspect-ratio:${MAP_W}/${MAP_H}">
          <svg viewBox="0 0 ${MAP_W} ${MAP_H}" preserveAspectRatio="none" aria-hidden="true">${trail}</svg>
          ${islandArt}
        </div>
      </div>
      <div class="map-foot">
      <div class="map-info">
        <img class="map-thumb" src="./images/game/map/pv-${ISLAND_ART[picked - 1]}.jpg" alt="" width="400" height="250">
        <div class="map-copy">
          <div class="map-head"><span class="map-ico">${WORLD_ICON[picked - 1]}</span><div><small>${t('worldN', { n: picked })}</small><b>${worldName(picked)}</b></div></div>
          <span>${t(`world${picked}Text` as Key)}</span>
          ${status}
          <div class="mode-pick" role="group" aria-label="${t('modePick')}">${modes}</div>
          <small class="mode-text">${t(save.mode === 'horde' ? 'modeHordeText' : 'modeSprintsText')}</small>
        </div>
      </div>
      ${action}
      ${mastery}
      <button class="ghost hexghost" data-act="menu">← ${t('menu')}</button>
      </div>
    </div>`, true, false, 'is-map');
  const scroller = screen.querySelector<HTMLElement>('.map-scroll');
  if (!scroller) return;
  if (kept !== undefined) scroller.scrollTop = kept;
  else {
    // Opening the map: the picked island in the middle of the view.
    const isle = scroller.querySelector<HTMLElement>(`.isle[data-world="${picked}"]`);
    if (isle) scroller.scrollTop = isle.offsetTop + isle.offsetHeight / 2 - scroller.clientHeight / 2;
  }
}

/** The four arrow elements' marks, for the fusion lines. */
const ELEMENT_MARK: Partial<Record<SkillId, string>> = { fire: '🔥', water: '💧', bolt: '⚡', ghost: '👻' };
const fusionKey = (f: Fusion) => `fusion${cap(f)}` as const;
/** "🔥 + ⚡ = Plasma" for the pair of elements you carry (or would carry with `adding`). */
function fusionLine(g: Game, f: Fusion, adding?: SkillId) {
  const els = [...arrowElements(g), ...(adding ? [adding] : [])].slice(0, 2);
  return `${els.map((e) => ELEMENT_MARK[e]).join(' + ')} = ${t(`${fusionKey(f)}Name` as Key)}`;
}

/** A fusion's medallion (`skills/fusion-<id>.webp`), the two element marks behind it for retro. */
const fusionIcon = (g: Game, f: Fusion, size = 56) =>
  `<img class="skill-icon" src="./images/game/skills/fusion-${f}.webp" width="${size}" height="${size}" alt=""><span class="skill-emoji">${arrowElements(g).slice(0, 2).map((e) => ELEMENT_MARK[e]).join('')}</span>`;

function choiceScreen(g: Game) {
  const cards = g.choices
    .map((choice) => {
      if (choice === 'fuse') {
        // The gold fusion card: taking it spends this level and fuses the two elements.
        const f = pairFusion(g);
        if (!f) return '';
        return `<button class="skill skill-ranged is-evo is-fuse" data-skill="fuse"><span class="icon" aria-hidden="true">${fusionIcon(g, f)}</span><span class="cat">★ ${t('fusionCat')}</span><b>${fusionLine(g, f)}</b><span>${t(`${fusionKey(f)}Text` as Key)}</span><span class="lvl">${t('fusionLabel')}</span></button>`;
      }
      const evo = evoOf(choice);
      if (evo) {
        // The gold card: the weapon's evolution.
        return `<button class="skill skill-${CATEGORY[evo]} is-evo" data-skill="${choice}"><span class="icon" aria-hidden="true">${skillIcon(evo, 56, EVO_ICON.includes(evo) ? evoIcon(evo, g) : iconFile(g, evo))}</span><span class="cat">★ ${t('evoCat')}</span><b>${t(`evo${cap(evo)}Name` as Key)}</b><span>${t(`evo${cap(evo)}Text` as Key)}</span><span class="lvl">${t('evoLabel')}</span></button>`;
      }
      const id = choice as SkillId;
      const el = id === 'blades' ? bladeElement(g) : 'steel';
      const name = el === 'steel' ? t(`${id}Name` as Key) : t(`blades${el[0].toUpperCase()}${el.slice(1)}Name` as Key);
      const next = g.skills[id] + 1;
      const text = id === 'blades' && next >= 4 ? t(next >= 5 ? 'bladesGrow5' : 'bladesGrow4')
        : el !== 'steel' ? t(`blades${cap(el)}Text` as Key) : id === 'blades' ? `${t('bladesText')} ${t('bladesHint')}` : t(`${id}Text` as Key);

      const cat = CATEGORY[id];
      const fresh = cat !== 'upgrade' && g.skills[id] === 0;
      const level = id === 'heart' ? '' : `<span class="lvl">${fresh ? t('newWeapon') : t('skillLevel', { level: g.skills[id] + 1 })}</span>`;
      // A second arrow element says which fusion it makes (and that the other two stop coming).
      const fz = fusionWith(g, id);
      const fuse = fz ? `<em class="fuse">${t('fusionCard', { fusion: fusionLine(g, fz, id) })}</em>` : '';
      return `<button class="skill skill-${cat}" data-skill="${id}"><span class="icon" aria-hidden="true">${skillIcon(id, 56, iconFile(g, id, next))}</span><span class="cat">${t(CATEGORY_LABEL[cat])}</span><b>${name}</b><span>${text}${fuse}</span>${level}</button>`;
    })
    .join('');
  // On call: two rerolls a shift.
  const reroll = g.mode === 'horde'
    ? `<button class="ghost small reroll" data-act="reroll"${g.rerolls > 0 ? '' : ' disabled'}>🎲 ${t('reroll', { n: g.rerolls })}</button>`
    : '';
  // …and, once they are spent, one more for an ad.
  const adSlot = canAdReroll(g) && ads.enabled ? '<div class="ad-slot" data-ad-slot="reroll"></div>' : '';
  show(`${head('levelup', t('levelUp'))}<p class="kicker">${t('level', { level: g.level })}</p><p>${t('choose')}</p><div class="skills">${cards}</div>${reroll}${adSlot}`, true, false, 'is-levelup');
  if (adSlot) offerAd('reroll', `<button class="ghost small reroll ad-btn" data-act="ad-reroll">📺 ${t('adReroll')}</button>`);
}

/* The wheel of fate: ten slices, one per wedge of the painted disc. The wheel is
   picked before it spins; the spin is only the show. */
const WHEEL_ICON: Record<WheelOutcome, string> = {
  newSkill: '✨', skillUp: '⬆️', heal: '❤️', coins: '🪙', loseLevel: '⬇️', hurt: '💔', loseCoins: '💸', bossBuff: '👹', nothing: '😐', evolve: '★',
};
/** The owner's painted prize icons (`ui/wheel/<outcome>.webp`); the emoji stays for retro. */
const WHEEL_PIC = (o: WheelOutcome) => `ui/wheel/${o}.webp`;
const WHEEL_TEXT: Record<WheelOutcome, Key> = {
  newSkill: 'wNewSkill', skillUp: 'wSkillUp', heal: 'wHeal', coins: 'wCoins', loseLevel: 'wLoseLevel', hurt: 'wHurt', loseCoins: 'wLoseCoins', bossBuff: 'wBossBuff', nothing: 'wNothing', evolve: 'wEvolve',
};
function shrineScreen() {
  show(`${head('shrine', t('shrineTitle'))}<p>${t('shrineText')}</p>
    <button class="primary" data-act="shrine-heal">${t('shrineHeal')}</button>
    <button class="ghost" data-act="shrine-skill">${t('shrineSkill')}</button>`);
}
function wheelScreen() {
  const lucky = !!game?.luckyWheel;
  const slices = (lucky ? WHEEL_LUCKY : WHEEL).map((o, i) => `<span class="wheel-slice${WHEEL_GOOD.includes(o) ? ' is-good' : o === 'nothing' ? '' : ' is-bad'}" style="--i:${i}">${picIcon(WHEEL_ICON[o], WHEEL_PIC(o))}</span>`).join('');
  show(`${head('wings', t(lucky ? 'chestTitle' : 'wheelTitle'))}<p>${t(lucky ? 'chestText' : 'wheelText')}</p>
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
  const wheel = g.luckyWheel ? WHEEL_LUCKY : WHEEL;
  const index = Math.floor(Math.random() * wheel.length);
  // Five full turns, then land the chosen slice (centred at index × 36°) under the pin at the top.
  const turn = 5 * 360 - index * (360 / wheel.length);
  disc.style.transform = `rotate(${turn}deg)`;
  // The prize icons turn back by as much, so they stay upright as the disc spins.
  disc.style.setProperty('--turn', `${turn}deg`);
  disc.classList.add('is-spinning');
  audio.play('boomerang');
  window.setTimeout(() => {
    const got = applyWheel(g, wheel[index]);
    const name = got.skill ? t(got.outcome === 'evolve' ? (`evo${cap(got.skill)}Name` as Key) : (`${got.skill}Name` as Key)) : '';
    const good = WHEEL_GOOD.includes(got.outcome);
    result.innerHTML = `<span class="wheel-res-icon" aria-hidden="true">${picIcon(WHEEL_ICON[got.outcome], WHEEL_PIC(got.outcome))}</span> ${esc(t(WHEEL_TEXT[got.outcome], { name, coins: Math.round(WHEEL_COINS * (1 + (g.world - 1) * 0.5)) }))}`;
    result.className = `wheel-result ${good ? 'is-good' : got.outcome === 'nothing' ? '' : 'is-bad'}`;
    audio.play(good ? 'levelup' : got.outcome === 'nothing' ? 'gem' : 'hurt');
    spinBtn.textContent = t('wheelGo');
    spinBtn.dataset.act = 'wheel-go';
    spinBtn.disabled = false;
  }, 3600);
}

/* The coin store (store.ts, payments.ts): the + by the coins on the cover
   and in the shop. Packs of coins, each a bigger heap, up to the ultra
   pack, and a limited-time offer with a skin and its countdown. On the live
   site it is a preview: nothing can be bought until payments are set up. */
let storeFrom: 'menu' | 'shop' = 'menu';
const money = (cents: number) => new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(cents / 100);
/** 6.000 or 6,000: grouped from a thousand up (Spanish would leave four digits ungrouped, next to 13.000). */
const count = (n: number) => n.toLocaleString('en').replace(/,/g, lang === 'es' ? '.' : ',');
/** 2d 14:03:22, or 14:03:22 under a day. */
const untilText = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const clock = [Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
  return s >= 86400 ? `${Math.floor(s / 86400)}d ${clock}` : clock;
};
function coinStoreScreen(note = '') {
  const now = currentOffer(save);
  const offer = now
    ? `<div class="store-offer">
        <span class="store-ribbon">${t('storeOffer')}</span>
        <div class="store-offer-art"><img src="./images/game/hero/${heroStill(now.offer.skin)}.webp" alt=""><img class="store-offer-coins" src="./images/game/store/coins-3.webp" alt=""></div>
        <div class="store-offer-copy">
          <b>${t('storeOfferName', { skin: t(`skin${cap(now.offer.skin)}Name` as Key) })}</b>
          <span>${t('storeOfferText', { skin: t(`skin${cap(now.offer.skin)}Name` as Key), coins: count(now.offer.coins) })}</span>
          <small>⏳ ${t('storeEnds')} <span data-until="${now.ends}">${untilText(now.ends - Date.now())}</span></small>
        </div>
        <button class="buy is-money" data-offer="${now.offer.id}">${money(now.offer.price)}</button>
      </div>`
    : '';
  const tagText = { popular: t('storePopular'), best: t('storeBest'), ultra: t('storeUltra') };
  const packs = COIN_PACKS.map((p) => {
    const bonus = packBonus(p);
    return `<div class="store-pack${p.tag ? ` is-${p.tag}` : ''}">
      ${p.tag ? `<span class="store-tag">${tagText[p.tag]}</span>` : ''}
      ${bonus > 0 ? `<span class="store-bonus">+${bonus}%</span>` : ''}
      <img src="./images/game/store/coins-${p.pic}.webp" width="320" height="240" alt="">
      <b>🪙 ${count(p.coins)}</b>
      <button class="buy is-money" data-pack="${p.id}">${money(p.price)}</button>
    </div>`;
  }).join('');
  show(`<button class="ui-close" type="button" data-act="${storeFrom}" aria-label="${t('back')}"></button>
    <div class="shop-head"><h2>${t('storeTitle')}</h2><p class="wallet">${coinsLine()}</p></div>
    ${note ? `<p class="note">${note}</p>` : ''}
    ${payments.enabled ? '' : `<p class="how store-preview">${t('storePreview')}</p>`}
    ${offer}
    <div class="store-packs">${packs}</div>
    <p class="how">${t('storeSmall')}</p>
    ${backButton(storeFrom, storeFrom === 'shop' ? 'shop' : 'menu')}`, true);
}
function buyStore(what: CoinPack | SkinOffer, name: string) {
  if (!payments.enabled) { coinStoreScreen(t('storeSoon')); return; }
  void payments.buy({ name, price: money(what.price) }).then((paid) => {
    if (!paid) return;
    grant(save, what);
    persist();
    audio.play('win');
    coinStoreScreen(t('storeThanks', { coins: count(what.coins) }));
  });
}

/* The daily chest (daily.ts): a free spin a day on the same painted wheel,
   for coins, an arsenal weapon, an outfit, an accessory or, very rarely, a
   skin. The prize is drawn first; the spin lands on one of its slices. */
const DAILY_ICON: Record<DailyPrize, string> = { coins: '🪙', coinsBig: '💰', jackpot: '💎', weapon: '🗡️', outfit: '🥋', accessory: '🎩', skin: '⭐' };
const DAILY_PIC: Record<DailyPrize, string> = {
  coins: 'ui/wheel/coins.webp', coinsBig: 'ui/wheel/coins.webp', jackpot: 'ui/wheel/coins.webp', weapon: 'ui/wheel/newSkill.webp',
  outfit: 'slots/body.webp', accessory: 'slots/head.webp', skin: `hero/${heroStill('robot')}.webp`,
};
function dailyScreen() {
  const ready = dailyReady(save);
  const slices = DAILY_WHEEL.map((p, i) => `<span class="wheel-slice is-good${p === 'skin' || p === 'jackpot' ? ' is-rare' : ''}" style="--i:${i}">${picIcon(DAILY_ICON[p], DAILY_PIC[p])}</span>`).join('');
  const coinOdds = DAILY_ODDS.coins + DAILY_ODDS.coinsBig + DAILY_ODDS.jackpot;
  show(`<button class="ui-close" type="button" data-act="menu" aria-label="${t('back')}"></button>
    ${head('wings', t('dailyTitle'))}<p>${t('dailyText')}</p>
    <div class="wheel"><div class="wheel-disc" id="wheelDisc">${slices}</div><span class="wheel-pin" aria-hidden="true"></span></div>
    <p class="wheel-result" id="wheelResult"></p>
    ${ready ? `<button class="primary" data-act="daily-spin">${t('dailySpin')}</button>` : `<p class="daily-label">${t('dailyNextLabel')}</p><button class="primary daily-wait" disabled aria-label="${t('dailyNext', { time: dailyClock() })}">⏳ <span data-daily-clock>${dailyClock()}</span></button>`}
    <p class="how daily-odds">${t('dailyOdds', { coins: coinOdds, weapon: DAILY_ODDS.weapon, outfit: DAILY_ODDS.outfit, accessory: DAILY_ODDS.accessory, skin: DAILY_ODDS.skin })}</p>`);
}
/** The time to the next chest, 23:59:59, ticking every second wherever it shows (`data-daily-clock`). */
const dailyClock = () => {
  const s = Math.ceil(dailyLeft(save) / 1000);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
};
window.setInterval(() => {
  // The store's offer: its countdown, and the next offer once it ends.
  for (const el of screen.querySelectorAll<HTMLElement>('[data-until]')) {
    const left = Number(el.dataset.until) - Date.now();
    if (left <= 0) { coinStoreScreen(); break; }
    el.textContent = untilText(left);
  }
  const clocks = screen.querySelectorAll<HTMLElement>('[data-daily-clock]');
  if (!clocks.length) return;
  if (!dailyReady(save)) { for (const c of clocks) c.textContent = dailyClock(); return; }
  // Time's up: the cover's chest wakes up, and a waiting chest screen offers the spin.
  const chest = screen.querySelector<HTMLElement>('.cover-chest');
  if (chest) {
    chest.classList.add('is-ready');
    const label = chest.querySelector('i');
    if (label) { label.removeAttribute('data-daily-clock'); label.textContent = t('dailyReady'); }
  }
  if (screen.querySelector('.daily-wait')) dailyScreen();
}, 1000);
function dailyLine(got: DailyResult): [string, string] {
  if (got.weapon) return [skillIcon(got.weapon, 28), t('dailyWeapon', { name: t(`${got.weapon}Name` as Key) })];
  if (got.item) { const item = itemById(got.item); return [picIcon(item.icon, item.pic), t('dailyItem', { name: t(`${got.item}Name` as Key) })]; }
  if (got.skin) return [`<img class="item-pic" src="./images/game/hero/${heroStill(got.skin)}.webp" alt="">`, t('dailySkin', { name: t(`skin${cap(got.skin)}Name` as Key) })];
  return [picIcon('🪙', DAILY_PIC.coins), t('dailyCoins', { coins: got.coins ?? 0 })];
}
function spinDaily() {
  const spinBtn = screen.querySelector<HTMLButtonElement>('[data-act="daily-spin"]');
  const disc = screen.querySelector<HTMLElement>('#wheelDisc');
  const result = screen.querySelector<HTMLElement>('#wheelResult');
  if (!spinBtn || !disc || !result || spinBtn.disabled || !dailyReady(save)) return;
  spinBtn.disabled = true;
  screen.querySelector('.ui-close')?.remove();
  const got = openDaily(save);
  persist();
  const spots = DAILY_WHEEL.map((p, i) => (p === got.prize ? i : -1)).filter((i) => i >= 0);
  const index = spots[Math.floor(Math.random() * spots.length)];
  const turn = 5 * 360 - index * (360 / DAILY_WHEEL.length);
  disc.style.transform = `rotate(${turn}deg)`;
  disc.style.setProperty('--turn', `${turn}deg`);
  disc.classList.add('is-spinning');
  audio.play('boomerang');
  window.setTimeout(() => {
    const [icon, line] = dailyLine(got);
    result.innerHTML = `<span class="wheel-res-icon" aria-hidden="true">${icon}</span> ${esc(line)}`;
    if (!save.retro) result.innerHTML = result.innerHTML.replaceAll('🪙', COIN_PIC);
    result.className = `wheel-result is-good${got.skin || got.prize === 'jackpot' ? ' is-rare' : ''}`;
    audio.play(got.skin || got.prize === 'jackpot' ? 'win' : 'levelup');
    result.insertAdjacentHTML('afterend', `<p class="how daily-next">${t('dailyNext', { time: `<span data-daily-clock>${dailyClock()}</span>` })}</p>`);
    spinBtn.textContent = t('dailyCollect');
    spinBtn.dataset.act = 'menu';
    spinBtn.disabled = false;
    fitPanel();
  }, 3600);
}

/* Both ways out of a run (the HUD arrow and Quit in the pause menu) ask
   first; a mid-run tap on the arrow is an easy slip on a phone. */
function restartScreen() {
  paused = true;
  show(`<h2>${t('restartTitle')}</h2><p>${t('restartText')}</p>
    <button class="primary" data-act="resume">${t('keepPlaying')}</button>
    <button class="ghost is-warn" data-act="restart">${t('restart')}</button>`);
}

function leaveScreen(to: 'site' | 'menu') {
  paused = true;
  show(`<h2>${t('leaveTitle')}</h2><p>${t('leaveText')}</p>
    <button class="primary" data-act="resume">${t('keepPlaying')}</button>
    <button class="ghost is-danger" data-act="${to === 'site' ? 'leave-site' : 'quit'}">${t(to === 'site' ? 'leaveSite' : 'leaveMenu')}</button>`);
}

/* A header from the UI sheets: the ornament is the picture, the words sit in its plate. */
/* Crest picture sizes, so the dialog can be measured before they load. */
const HEAD_SIZE: Record<string, [number, number]> = {
  pause: [480, 450], levelup: [520, 223], shrine: [450, 480], victory: [431, 480], defeat: [481, 472], boss: [480, 422], wings: [480, 304],
};
const head = (kind: 'pause' | 'levelup' | 'victory' | 'defeat' | 'shrine' | 'wings', text: string) =>
  `<div class="ui-head is-${kind}"><img src="./images/game/ui/header_${kind}.webp" width="${HEAD_SIZE[kind][0]}" height="${HEAD_SIZE[kind][1]}" alt=""><span>${text}</span></div>`;

function pauseScreen() {
  show(`<button class="ui-close" type="button" data-act="resume" aria-label="${t('resume')}"></button>
    ${head('pause', t('paused'))}
    <button class="ui-opts" type="button" data-act="options-pause" aria-label="${t('options')}"><span aria-hidden="true">⚙</span></button>
    <button class="primary" data-act="resume">${t('resume')}</button>
    <button class="ghost is-warn" data-act="confirm-restart">${t('restart')}</button>
    <button class="ghost is-danger" data-act="confirm-quit">${t('quit')}</button>`);
}

function optionsScreen() {
  const muted = save.music === 0 && save.sfx === 0;
  show(`
    <button class="ui-close" type="button" data-act="${optionsFrom === 'pause' ? 'pause' : 'menu'}" aria-label="${t('back')}"></button>
    <h2>${t('options')}</h2>
    <label class="slider"><span>🎵 ${t('music')}</span><b>${Math.round(save.music * 100)}%</b><input type="range" min="0" max="100" value="${Math.round(save.music * 100)}" style="--p:${save.music}" data-vol="music"></label>
    <label class="slider"><span>🔔 ${t('sfx')}</span><b>${Math.round(save.sfx * 100)}%</b><input type="range" min="0" max="100" value="${Math.round(save.sfx * 100)}" style="--p:${save.sfx}" data-vol="sfx"></label>
    <p class="how">${t('musicNote')}</p>
    <button class="mute-toggle" type="button" data-act="mute" aria-pressed="${muted}"><span class="toggle-art${muted ? ' is-off' : ''}" aria-hidden="true"></span><span>${muted ? t('unmute') : t('mute')}</span></button>
    <button class="mute-toggle" type="button" data-act="retro" aria-pressed="${save.retro}"><span class="toggle-art${save.retro ? '' : ' is-off'}" aria-hidden="true"></span><span>${t('retro')}</span></button>
    <p class="how">${t('retroNote')}</p>
    ${backButton(optionsFrom === 'pause' ? 'pause' : 'menu', optionsFrom === 'pause' ? 'resume' : 'menu')}`);
}

/** Which shop sections are unfolded (kept while the shop re-renders after a purchase). */
const shopOpen = new Set<string>();
/** A foldable shop section: one of the owner's ring-and-plate rows (orange while open) with its icon and a count, and its cards only when open. */
const SHOP_SEC_ICON: Record<string, [string, string]> = {
  forge: ['⚒️', 'forge/might.webp'], arsenal: ['🚀', 'skills/rocket.webp'],
  armour: ['🛡️', 'slots/body.webp'], weapons: ['🗡️', 'slots/melee.webp'], spirits: ['👻', 'spirits/water-float-0.webp'],
};
function shopSection(key: string, title: string, count: string, body: string) {
  const open = shopOpen.has(key);
  const [emoji, pic] = SHOP_SEC_ICON[key] ?? ['🛒', ''];
  return `<button type="button" class="gear-row shop-sec${open ? ' is-on' : ''}" data-shop-sec="${key}" aria-expanded="${open}">
      <span class="icon" aria-hidden="true">${picIcon(emoji, pic || undefined)}</span><b>${title}</b><em>${count} ${open ? '▴' : '▾'}</em>
    </button>${open ? body : ''}`;
}

/* Items with levels (the Phoenix cloak): pips and an upgrade button like the forge's, in the shop and in
   Customise. What each level gives is not shown: it is a surprise. */
function levelBlock(item: { id: ItemId; levels?: number[] }) {
  if (!item.levels || !save.owned.includes(item.id)) return '';
  const lv = itemLevel(save.itemLevels, item.id);
  const max = 1 + item.levels.length;
  const pips = Array.from({ length: max }, (_, i) => `<i class="${i < lv ? 'is-on' : ''}"></i>`).join('');
  const price = lv < max ? item.levels[lv - 1] : 0;
  const up = price
    ? `<button class="buy${save.coins >= price ? '' : ' is-poor'}" data-item-up="${item.id}">${t('upgradeBtn', { price })}</button>`
    : `<button class="buy is-worn" disabled>✓ ${t('upgradeMax')}</button>`;
  return `<span class="pips" aria-label="${t('upgradeLevel', { level: lv, max })}">${pips}</span>${up}`;
}

/* The shop card's frame has a lower band for its button (the owner's picture, drawn as a nine-slice). A card
   with two buttons is made tall enough that the band holds only the last one and the rest sits above the
   divider. The ratios are measured on `ui/shop_orange.webp` (266×322, slices of 45 drawn at 15px). */
function bandCards() {
  if (save.retro) return;
  for (const card of screen.querySelectorAll<HTMLElement>('.panel .item.has-levels')) {
    const btn = card.lastElementChild as HTMLElement | null;
    const prev = btn?.previousElementSibling as HTMLElement | null;
    if (!btn || !prev) continue;
    card.style.height = '';
    btn.style.margin = '';
    // offsetTop is from the card's padding edge (the card is `position: relative`), so add its top border.
    if (prev.offsetParent !== card) continue;
    const bodyEnd = prev.offsetTop + prev.offsetHeight + 15 + 8;
    const bh = btn.offsetHeight;
    // The divider's top is at 15 + 0.694·(H − 30); the band runs from 15 + 0.759·(H − 30) to H − 8.
    const h = Math.ceil(Math.max((bodyEnd - 15) / 0.694 + 30, (bh + 14) / 0.241, card.offsetHeight));
    const top = 15 + 0.759 * (h - 30);
    const mid = (top + h - 8) / 2;
    card.style.height = `${h}px`;
    btn.style.marginTop = 'auto';
    btn.style.marginBottom = `${Math.round(h - 24 - (mid + bh / 2))}px`;
  }
}

function shopScreen(note = '') {
  // The ad gift: some coins once every few hours, or how long until the next.
  const giftWait = save.adGiftAt + AD_GIFT_EVERY - Date.now();
  const giftLine = !ads.enabled ? '' : giftWait > 0
    ? `<p class="how">${t('adGiftWait', { time: waitText(giftWait) })}</p>`
    : '<div class="ad-slot" data-ad-slot="gift"></div>';
  // One sub-group per slot; spirit companions (magic-slot items that bring a spirit) get their own section.
  const isSpirit = (id: ItemId) => !!itemById(id).effect.spirit;
  const group = (slot: Slot, keep: (id: ItemId) => boolean) => {
    const all = ITEMS.filter((item) => item.slot === slot && keep(item.id));
    const cards = all
      .map((item) => {
        const owned = save.owned.includes(item.id);
        const worn = save.equipped[slot] === item.id;
        const can = save.coins >= item.price;
        const open = itemOpen(item);
        const action = !owned && !open
          ? `<button class="buy is-poor" disabled>🔒 ${t('arsenalLocked', { n: item.world ?? 0 })}</button>`
          : !owned
          ? `<button class="buy${can ? '' : ' is-poor'}" data-buy="${item.id}">${t('buy')} · 🪙 ${item.price}</button>`
          : worn
            ? `<button class="buy is-worn" data-unequip="${item.id}">✓ ${t('worn')} · ${t('unequip')}</button>`
            : `<button class="buy" data-equip="${item.id}">${t('equip')}</button>`;
        return `<div class="item${item.levels && owned ? ' has-levels' : ''}${worn ? ' is-on' : ''}${owned ? ' is-owned' : ''}${!owned && (!can || !open) ? ' is-locked' : ''}${item.legendary ? ' is-legendary' : ''}">
          <span class="icon" aria-hidden="true">${picIcon(item.icon, item.pic)}</span>
          <b>${item.legendary ? `<small class="legend">★ ${t('legendary')}</small>` : ''}${t(`${item.id}Name` as Key)}</b>
          <span>${t(`${item.id}Text` as Key)}</span>
          ${levelBlock(item)}
          ${action}
        </div>`;
      })
      .join('');
    return { slot, owned: all.filter((i) => save.owned.includes(i.id)).length, total: all.length, cards };
  };
  type Group = ReturnType<typeof group>;
  /** A section holding several sub-groups, each under its own heading (or none, for a single group). */
  const merged = (key: string, title: string, parts: Group[], headed = true) => shopSection(key, title,
    `${parts.reduce((n, x) => n + x.owned, 0)}/${parts.reduce((n, x) => n + x.total, 0)}`,
    parts.filter((x) => x.total).map((x) => `${headed ? `<h3 class="slot">${t(SLOT_LABEL[x.slot])}</h3>` : ''}<div class="items">${x.cards}</div>`).join(''));
  // Armour (head, body, boots), Weapons (magic, melee, ranged) and the Spirits on their own.
  const armourSec = merged('armour', t('shopArmour'), ARMOUR_SLOTS.map((slot) => group(slot, () => true)));
  const weaponSecs = merged('weapons', t('shopWeapons'), WEAPON_SLOTS.map((slot) => group(slot, (id) => !isSpirit(id))))
    + merged('spirits', t('shopSpirits'), [group('magic', isSpirit)], false);
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
      <span class="icon" aria-hidden="true">${picIcon(u.icon, upgradePic(u.id))}</span>
      <b>${t(`${u.id}Name` as Key)}</b>
      <span>${t(`${u.id}Text` as Key)}</span>
      <span class="pips" aria-label="${t('upgradeLevel', { level, max: u.max })}">${pips}</span>
      ${action}
    </div>`;
  }).join('');
  // The arsenal: one weapon per world, on sale once that world is won in either mode, then bought once
  // and from then on it can come up in the level ups of both modes.
  const arsenal = ARSENAL.map(({ id, price, world }) => {
    const owned = save.arsenal.includes(id);
    const open = worldWon(save, world);
    const can = save.coins >= price;
    const action = owned
      ? `<button class="buy is-worn" disabled>✓ ${t('arsenalOwned')}</button>`
      : !open
        ? `<button class="buy is-poor" disabled>🔒 ${t('arsenalLocked', { n: world })}</button>`
        : `<button class="buy${can ? '' : ' is-poor'}" data-arsenal="${id}">${t('buy')} · 🪙 ${price}</button>`;
    return `<div class="item${owned ? ' is-on is-owned' : ''}${!owned && (!can || !open) ? ' is-locked' : ''}">
      <span class="icon" aria-hidden="true">${picIcon(EMOJI[id], `skills/${id}.webp`)}</span>
      <b>${t(`${id}Name` as Key)}</b>
      <span>${t(`${id}Text` as Key)}</span>
      ${action}
    </div>`;
  }).join('');
  show(`
    <button class="ui-close" type="button" data-act="menu" aria-label="${t('back')}"></button>
    <div class="shop-head"><h2>${t('shop')}</h2><p class="wallet">${coinsLine()} <button class="wallet-plus" type="button" data-act="coin-store" aria-label="${t('storeTitle')}">+</button></p></div>
    ${note ? `<p class="note">${note}</p>` : `<p class="how">${t('earnHint')}</p>`}
    ${giftLine}
    ${shopSection('forge', t('forge'), `${UPGRADES.reduce((n, u) => n + (save.upgrades[u.id] ?? 0), 0)}/${UPGRADES.reduce((n, u) => n + u.max, 0)}`, `<p class="how">${t('forgeHint')}</p><div class="items">${forge}</div>`)}
    ${shopSection('arsenal', t('arsenal'), `${save.arsenal.length}/${ARSENAL.length}`, `<p class="how">${t('arsenalHint')}</p><div class="items">${arsenal}</div>`)}
    ${armourSec}${weaponSecs}
    ${backButton('menu')}`, true, false, 'keep-scroll');
  bandCards();
  if (ads.enabled && giftWait <= 0) offerAd('gift', `<button class="primary ad-btn" data-act="ad-gift">📺 ${t('adGift', { coins: AD_GIFT_COINS })}</button>`);
}

/* The customise screen: the hero in the middle, three armour slots down the
   left (head, body, boots) and three weapon slots down the right (magic,
   melee, ranged). Tapping a slot lists what fits there; owned items are worn
   with a tap, the rest are bought (and worn) with one. Below it, the skin
   and the enemy look as before. */
/** What the hero wears, for the canvas: the painted sprite only knows the hat. */
function dressPalette() {
  palette.hat = save.equipped.head;
  palette.body = save.equipped.body;
  palette.skin = save.skin;
  palette.boots = save.equipped.boots;
}
const heroPic = () => `./images/game/hero/${heroStill(save.skin, save.equipped.head)}.webp`;
/** What the list under the hero shows: a slot's items, the skins or the enemy looks. */
let dressSlot: Slot | 'skin' | 'foes' | 'scene' | 'song' | null = null;
function stylesScreen(note = '') {
  const slotButton = (slot: Slot) => {
    const id = save.equipped[slot];
    const item = id ? itemById(id) : null;
    const open = dressSlot === slot;
    return `<button class="dslot${item ? ' is-worn' : ''}${open ? ' is-open' : ''}" data-slot="${slot}" aria-pressed="${open}">
      <span class="ring" aria-hidden="true"><span class="icon${item ? '' : ' is-empty'}">${item ? picIcon(item.icon, item.pic) : picIcon(SLOT_ICON[slot], `slots/${slot}.webp`)}</span></span>
      <span class="plate"><small>${t(SLOT_LABEL[slot])}</small><b>${item ? t(`${item.id}Name` as Key) : '—'}</b></span>
    </button>`;
  };
  const hero = save.retro
    ? `<canvas class="hero-fig" width="180" height="200" aria-hidden="true"></canvas>`
    : `<img class="hero-fig" src="${heroPic()}" alt="" width="128" height="160">`;
  const row = (attr: string, on: boolean, locked: boolean, icon: string, name: string, text: string, state: string) =>
    `<button class="gear-row${on ? ' is-on' : ''}${locked ? ' is-locked' : ''}" ${attr} aria-pressed="${on}">
      <span class="icon" aria-hidden="true">${icon}</span><b>${name}</b><span>${text}</span>${state ? `<em>${state}</em>` : ''}
    </button>`;
  let picks = `<p class="how">${t('dressHint')}</p>`;
  if (dressSlot === 'skin') {
    picks = `<h3 class="slot">${t('skinPick')}</h3>${note ? `<p class="note">${note}</p>` : ''}<div class="gear-list">${SKINS.map((skin) => {
      const owned = save.skins.includes(skin);
      const worn = save.skin === skin;
      return row(`data-skin="${skin}"`, worn, !owned && save.coins < SKIN_PRICE[skin], `<img class="skin-pic" src="./images/game/hero/${heroStill(skin, save.equipped.head)}.webp" alt="">`, t(`skin${cap(skin)}Name` as Key), t(`skin${cap(skin)}Text` as Key), worn ? `✓ ${t('worn')}` : owned ? t('equip') : `🪙 ${SKIN_PRICE[skin]}`);
    }).join('')}</div>`;
  } else if (dressSlot === 'foes') {
    picks = `<h3 class="slot">${t('stylePick')}</h3><div class="gear-list">${STYLES.map((style) =>
      row(`data-style="${style}"`, save.style === style, false, STYLE_ICON[style], t(`style${cap(style)}Name` as Key), t(`style${cap(style)}Text` as Key), save.style === style ? '✓' : '')).join('')}</div>`;
  } else if (dressSlot === 'song') {
    picks = `<h3 class="slot">${t('songPick')}</h3><div class="gear-list">${(['auto', 'b2b', 'doom'] as const).map((id) =>
      row(`data-song="${id}"`, save.song === id, false, id === 'auto' ? '🎚️' : id === 'b2b' ? '🎧' : '🔥', t(`song${cap(id)}Name` as Key), t(`song${cap(id)}Text` as Key), save.song === id ? '✓' : '')).join('')}</div>`;
  } else if (dressSlot === 'scene') {
    picks = `<h3 class="slot">${t('scenePick')}</h3><div class="gear-list">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
      row(`data-scene="${n}"`, save.scene === n, false, n ? `<img class="scene-pic" src="./images/game/floors/world${n}.webp" alt="">` : '🌍',
        n ? t(`world${n}Name` as Key) : t('sceneOwn'), n ? t('sceneText', { n }) : t('sceneOwnText'), save.scene === n ? '✓' : '')).join('')}</div>`;
  } else if (dressSlot) {
    const slot = dressSlot;
    picks = `<h3 class="slot">${t('dressPick', { slot: t(SLOT_LABEL[slot]) })}</h3>
      ${note ? `<p class="note">${note}</p>` : ''}
      <div class="gear-list">${ITEMS.filter((item) => item.slot === slot).map((item) => {
        const owned = save.owned.includes(item.id);
        const worn = save.equipped[slot] === item.id;
        const can = save.coins >= item.price;
        const open = itemOpen(item);
        const levels = levelBlock(item);
        return row(`data-dress="${item.id}"`, worn, !owned && (!can || !open), picIcon(item.icon, item.pic), item.legendary ? `<span class="legend-name">${t(`${item.id}Name` as Key)}</span>` : t(`${item.id}Name` as Key), t(`${item.id}Text` as Key), worn ? `✓ ${t('worn')}` : owned ? t('equip') : !open ? `🔒 ${t('arsenalLocked', { n: item.world ?? 0 })}` : `${item.legendary ? '★ ' : ''}🪙 ${item.price}`)
          + (levels ? `<div class="row-levels">${levels}</div>` : '');
      }).join('')}
      ${save.equipped[slot] ? `<button class="ghost small" data-undress="${slot}">${t('dressNone')}</button>` : ''}
      </div>`;
  }
  const nav = (key: 'skin' | 'foes' | 'scene' | 'song', icon: string, label: Key) =>
    `<button class="dnav${dressSlot === key ? ' is-open' : ''}" data-dress-list="${key}" aria-pressed="${dressSlot === key}"><span class="ring" aria-hidden="true">${icon}</span><small>${t(label)}</small></button>`;
  show(`<button class="ui-close" type="button" data-act="menu" aria-label="${t('back')}"></button>
    <div class="dress-title"><h2>${t('styles')}</h2></div>
    <p class="wallet">${coinsLine()}</p>
    <div class="dress">
      <div class="dress-col">${ARMOUR_SLOTS.map(slotButton).join('')}</div>
      <div class="dress-hero"><span class="pad" aria-hidden="true"></span>${hero}<b>${esc(save.name)}</b></div>
      <div class="dress-col">${WEAPON_SLOTS.map(slotButton).join('')}</div>
    </div>
    <div class="dress-nav">
      <button class="dnav is-back" data-act="menu"><span class="ring" aria-hidden="true"></span><small>${t('backShort')}</small></button>
      ${nav('skin', '👕', 'skinBtn')}
      ${nav('foes', '👾', 'enemies')}
      ${nav('scene', '🗺️', 'sceneBtn')}
      ${nav('song', '🎵', 'songBtn')}
    </div>
    ${picks}`, true, false, 'keep-scroll');
  const fig = screen.querySelector<HTMLCanvasElement>('canvas.hero-fig');
  if (fig) {
    const ctx = fig.getContext('2d');
    if (ctx) drawRetroFigure(ctx, fig.width / 2, fig.height * 0.52, 46, palette);
  }
}

/** The list a slot or a button opens sits under the fold on a phone: bring its heading up into view. */
function showPicks() {
  const inner = screen.querySelector<HTMLElement>('.panel-in');
  const headTop = screen.querySelector<HTMLElement>('.panel-in > h3.slot');
  if (!inner || !headTop || !dressSlot) return;
  const want = headTop.offsetTop - 12;
  if (want > inner.scrollTop + inner.clientHeight * 0.55 || want < inner.scrollTop) {
    inner.dataset.scroll = String(want);
    inner.scrollTo({ top: want, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}

function startRun(world = worldIn(), mode = save.mode, endless = false) {
  game = newGame({ ...buildLoadout(save.equipped, save.upgrades, masteries(), save.arsenal, save.itemLevels), sprintMastery: save.mastery.sprints }, save.style, world, mode, endless);
  game.scene = save.scene;
  preloadFx();
  paused = false;
  shownChoices = '';
  wheelShown = false;
  reviveOffered = false;
  hud.hidden = false;
  hudGear.hidden = false;
  hide();
  hudRoom.style.setProperty('--icon', JSON.stringify(WORLD_ICON[game.world - 1]));
  resize(); // Reserve the live HUD + weapons row, including the iOS safe area.
  flash(game.endless ? t('nightmareStart') : game.mode === 'horde' ? t('hordeStart') : `${worldName(game.world)} · ${t('sprint', { room: 1 })}`);
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
  else if (act === 'play-same') startRun(game?.world ?? worldIn(), game?.mode ?? save.mode, game?.endless);
  else if (act === 'play-nightmare') startRun(NIGHTMARE_WORLD, 'horde', true);
  else if (act === 'mode') { save.mode = save.mode === 'horde' ? 'sprints' : 'horde'; persist(); menuScreen(); }
  else if (target.dataset.mode) { save.mode = target.dataset.mode as Mode; mapPick = worldIn(); persist(); mapScreen(); }
  else if (act === 'map') { mapPick = worldIn(); mapScreen(); }
  else if (act === 'play-picked') { setWorld(mapPick); persist(); startRun(mapPick); }
  else if (target.dataset.world) {
    const n = Number(target.dataset.world);
    mapPick = n;
    if (n <= unlockedIn()) { setWorld(n); persist(); }
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
    const price = revivePrice(g);
    if (price === null) return;
    const fromRun = Math.min(Math.floor(g.coins), price);
    g.coins -= fromRun;
    save.coins -= price - fromRun;
    persist();
    paidRevive(g);
    reviveOffered = false;
    hide();
    flash(t('revived'));
  } else if (act === 'ad-revive' && game) {
    const g = game;
    void watchAd('revive').then((watched) => {
      if (game !== g) return;
      if (watched && adRevive(g)) { reviveOffered = false; hide(); flash(t('revived')); }
      else if (canPayRevive(g)) reviveScreen(g, t('adNone'));
      else { g.reviveDeclined = true; reviveOffered = false; endScreen(g); }
    });
  } else if (act === 'ad-double') {
    const coins = adEarned;
    void watchAd('doubleCoins').then((watched) => {
      const slot = screen.querySelector<HTMLElement>('[data-ad-slot="doubleCoins"]');
      if (watched && coins > 0) {
        adEarned = 0;
        save.coins += coins;
        persist();
        audio.play('coin');
      }
      if (slot) slot.innerHTML = `<p class="note">${watched ? `✓ ${t('adDoubled', { coins })}` : t('adNone')}</p>`;
    });
  } else if (act === 'ad-reroll' && game) {
    const g = game;
    void watchAd('reroll').then((watched) => {
      if (game !== g || !watched || !adReroll(g)) return;
      shownChoices = g.choices.join();
      choiceScreen(g);
    });
  } else if (act === 'ad-gift') {
    void watchAd('gift').then((watched) => {
      if (watched) {
        save.coins += AD_GIFT_COINS;
        save.adGiftAt = Date.now();
        persist();
        audio.play('coin');
      }
      if (screen.querySelector('[data-ad-slot="gift"]')) shopScreen(watched ? t('adGiftGot', { coins: AD_GIFT_COINS }) : t('adNone'));
    });
  } else if (act === 'revive-no' && game) {
    game.reviveDeclined = true; // no more offers this run
    reviveOffered = false;
    endScreen(game);
  }
  else if (act === 'wheel-spin' && game) spinWheel(game);
  else if (act === 'daily') dailyScreen();
  else if (act === 'coin-store') { storeFrom = screen.querySelector('.shop-sec') ? 'shop' : 'menu'; coinStoreScreen(); }
  else if (target.dataset.pack) {
    const p = COIN_PACKS.find((x) => x.id === target.dataset.pack);
    if (p) buyStore(p, `${count(p.coins)} ${t('coins').toLowerCase()}`);
  } else if (target.dataset.offer) {
    const o = SKIN_OFFERS.find((x) => x.id === target.dataset.offer);
    if (o && currentOffer(save)?.offer.id === o.id) buyStore(o, t('storeOfferName', { skin: t(`skin${cap(o.skin)}Name` as Key) }));
  }
  else if (act === 'daily-spin') spinDaily();
  else if (act === 'wheel-go' && game) {
    const g = game;
    const fromChest = g.luckyWheel;
    leaveWheel(g);
    wheelShown = false;
    hide();
    if (!fromChest) flash(`${worldName(g.world)} · ${t('sprint', { room: g.room })}`);
  }
  else if (act === 'pause') pauseScreen();
  else if (act === 'confirm-quit') leaveScreen('menu');
  else if (act === 'confirm-restart') restartScreen();
  else if (act === 'restart' && game) {
    // Start the same world and mode again; what this run earned is kept.
    const { world, mode, endless } = game;
    bankRun(game);
    paused = false;
    startRun(world, mode, endless);
  }
  else if (act === 'quit') {
    if (game) bankRun(game);
    paused = false;
    menuScreen();
  } else if (act === 'leave-site') {
    if (game) { bankRun(game); persist(); }
    location.href = './index.html';
  } else if (act === 'menu') menuScreen();
  else if (act === 'shop') shopScreen();
  else if (act === 'profile') { editingName = false; profileScreen(); }
  else if (act === 'reset-ask') resetScreen();
  else if (act === 'reset-do') { wipeProgress(save); persist(); dressPalette(); mapPick = 0; profileScreen(t('resetDone')); }
  else if (act === 'mastery-ask') masteryScreen(save.mode);
  else if (act === 'mastery-do') {
    const mode = (target.dataset.modeM as Mode) ?? save.mode;
    if (worldsLeft(mode) === 0) {
      save.mastery[mode] += 1;
      wipeProgress(save);
      persist();
      dressPalette();
      mapPick = 0;
      audio.play('win');
      profileScreen(t('masteryDone'));
    }
  } else if (target.dataset.star) {
    // Changed in place, no re-render: rebuilding the dialog made its painted frame and plates flash.
    save.starColor = target.dataset.star as StarColor;
    persist();
    for (const chip of screen.querySelectorAll<HTMLElement>('[data-star]')) {
      const on = chip.dataset.star === save.starColor;
      chip.classList.toggle('is-on', on);
      chip.setAttribute('aria-pressed', String(on));
    }
    for (const el of screen.querySelectorAll<HTMLElement>('.mstars')) el.style.setProperty('--star', starColor());
    const mark = screen.querySelector<HTMLElement>('.mastery-line span');
    if (mark) mark.style.color = starColor();
  }
  else if (act === 'name-reset') setName(DEFAULT_NAME);
  else if (act === 'name-edit') { editingName = true; profileScreen(); }
  else if (act === 'name-cancel') { editingName = false; profileScreen(); }
  else if (act === 'styles') { dressSlot = null; stylesScreen(); }
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
  } else if (act === 'reroll' && game) {
    if (rerollChoices(game)) {
      audio.play('click');
      shownChoices = game.choices.join();
      choiceScreen(game);
    }
  } else if (target.dataset.skill && game) {
    const choice = target.dataset.skill as Choice;
    const fusedBefore = fusionOf(game);
    chooseSkill(game, choice);
    const evo = evoOf(choice);
    const fused = !fusedBefore && fusionOf(game);
    if (evo) { audio.play('win'); flash(`${t('evoReady')} ${t(`evo${cap(evo)}Name` as Key)}`); }
    else if (fused) { audio.play('win'); flash(`${t('fusionMade')} ${fusionLine(game, fused)}`); }
    else audio.play('pick');
    shownChoices = '';
    hide();
  } else if (target.dataset.itemUp) {
    const item = itemById(target.dataset.itemUp as ItemId);
    const lv = itemLevel(save.itemLevels, item.id);
    const price = item.levels?.[lv - 1];
    if (!price || !save.owned.includes(item.id)) return;
    // Upgraded from the shop or from Customise: the same screen comes back with the note.
    const again = screen.querySelector('.dress') ? stylesScreen : shopScreen;
    if (save.coins < price) { again(t('notEnough')); return; }
    save.coins -= price;
    save.itemLevels[item.id] = lv + 1;
    persist();
    audio.play('levelup');
    again(t('itemUpgraded', { name: t(`${item.id}Name` as Key) }));
  } else if (target.dataset.buy) {
    const item = itemById(target.dataset.buy as ItemId);
    if (!itemOpen(item)) return;
    if (save.coins < item.price) { shopScreen(t('notEnough')); return; }
    save.coins -= item.price;
    save.owned.push(item.id);
    save.equipped[item.slot] = item.id;
    persist();
    audio.play('coin');
    shopScreen();
  } else if (target.dataset.shopSec) {
    const key = target.dataset.shopSec;
    if (shopOpen.has(key)) shopOpen.delete(key); else shopOpen.add(key);
    audio.play('click');
    shopScreen();
  } else if (target.dataset.arsenal) {
    const w = ARSENAL.find((a) => a.id === target.dataset.arsenal);
    if (!w || save.arsenal.includes(w.id) || !worldWon(save, w.world)) return;
    if (save.coins < w.price) { shopScreen(t('notEnough')); return; }
    save.coins -= w.price;
    save.arsenal.push(w.id);
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
  } else if (target.dataset.song) {
    save.song = target.dataset.song as typeof save.song;
    audio.setSong(save.song);
    persist();
    stylesScreen();
  } else if (target.dataset.scene !== undefined) {
    save.scene = Number(target.dataset.scene);
    persist();
    stylesScreen();
  } else if (target.dataset.style) {
    save.style = target.dataset.style as EnemyStyle;
    persist();
    stylesScreen();
  } else if (target.dataset.skin) {
    // Skins are bought once with coins, then worn with a tap.
    const skin = target.dataset.skin as HeroSkin;
    if (!save.skins.includes(skin)) {
      if (save.coins < SKIN_PRICE[skin]) { stylesScreen(t('notEnough')); return; }
      save.coins -= SKIN_PRICE[skin];
      save.skins.push(skin);
      audio.play('coin');
    }
    save.skin = skin;
    persist();
    dressPalette();
    stylesScreen();
  } else if (target.dataset.slot) {
    const slot = target.dataset.slot as Slot;
    dressSlot = dressSlot === slot ? null : slot;
    stylesScreen();
    showPicks();
  } else if (target.dataset.dressList) {
    const key = target.dataset.dressList as 'skin' | 'foes' | 'scene' | 'song';
    dressSlot = dressSlot === key ? null : key;
    stylesScreen();
    showPicks();
  } else if (target.dataset.dress) {
    const item = itemById(target.dataset.dress as ItemId);
    const worn = save.equipped[item.slot] === item.id;
    if (worn) delete save.equipped[item.slot];
    else if (save.owned.includes(item.id)) save.equipped[item.slot] = item.id;
    else if (!itemOpen(item)) { stylesScreen(t('arsenalLocked', { n: item.world ?? 0 })); return; }
    else if (save.coins < item.price) { stylesScreen(t('notEnough')); return; }
    else {
      save.coins -= item.price;
      save.owned.push(item.id);
      save.equipped[item.slot] = item.id;
      audio.play('coin');
    }
    persist();
    dressPalette();
    stylesScreen();
  } else if (target.dataset.undress) {
    delete save.equipped[target.dataset.undress as Slot];
    persist();
    dressPalette();
    stylesScreen();
  }
  dressPalette();
});

screen.addEventListener('input', (event) => {
  const input = event.target as HTMLInputElement;
  if (!input.dataset.vol) return;
  audio.unlock();
  const value = Number(input.value) / 100;
  if (input.dataset.vol === 'music') save.music = value;
  else save.sfx = value;
  audio.setVolumes(save.music, save.sfx);
  input.style.setProperty('--p', String(Number(input.value) / 100));
  const valueLabel = input.closest('.slider')?.querySelector('b');
  if (valueLabel) valueLabel.textContent = `${input.value}%`;
  persist();
  // Hear the music in the menu while adjusting it.
  if (input.dataset.vol === 'music' && value > 0) audio.start();
});
screen.addEventListener('submit', (event) => {
  const form = event.target as HTMLFormElement;
  if (form.dataset.form !== 'name') return;
  event.preventDefault();
  setName(String(new FormData(form).get('name') ?? ''));
});
screen.addEventListener('change', (event) => {
  const input = event.target as HTMLInputElement;
  if (input.dataset.vol === 'sfx') audio.play('levelup');
});

pauseBtn.addEventListener('click', () => togglePause());
/* Tapping the weapon column pauses and opens, to its left, every skill you
   have right now: the bow and your weapons with their level, then the
   upgrades. Any tap (or Esc) closes it and the run goes on. */
function skillName(g: Game, id: SkillId | 'bow') {
  if (id !== 'bow' && g.evolved[id]) return t(`evo${cap(id)}Name` as Key);
  if (id === 'blades') {
    const el = bladeElement(g);
    if (el !== 'steel') return t(`blades${cap(el)}Name` as Key);
  }
  return t(`${id}Name` as Key);
}
function skillText(g: Game, id: SkillId | 'bow') {
  if (id !== 'bow' && g.evolved[id]) return t(`evo${cap(id)}Text` as Key);
  if (id === 'blades') {
    const el = bladeElement(g);
    if (el !== 'steel') return t(`blades${cap(el)}Text` as Key);
  }
  return t(`${id}Text` as Key);
}
/* Mid-run swaps, under their rows: the blades' element (plain steel and each
   element you carry a skill for) and the spirit (the water ghost and every
   spirit you own). Run-only: what you wear in Customise stays as it is. */
const SPIRIT_ITEM: Record<SpiritSkin, ItemId> = { water: 'lantern', fire: 'spiritFire', tide: 'spiritTide', thorn: 'spiritThorn', volt: 'spiritVolt', shade: 'spiritShade' };
const ownedSpirits = (): SpiritSkin[] => ['water', ...(Object.keys(SPIRIT_ITEM) as SpiritSkin[]).filter((s) => s !== 'water' && save.owned.includes(SPIRIT_ITEM[s]))];
const bladeName = (el: string) => t(el === 'steel' ? 'bladesName' : (`blades${cap(el)}Name` as Key));
function bladeChips(g: Game) {
  const opts = bladeOptions(g);
  if (opts.length < 2) return '';
  const now = bladeElement(g);
  return `<div class="gp-chips" role="group" aria-label="${t('gearBladePick')}">${opts.map((el) => `<button type="button" class="gp-chip${el === now ? ' is-on' : ''}" data-blade="${el}" aria-pressed="${el === now}" title="${bladeName(el)}"><img src="./images/game/blades/${el}.webp" alt="${bladeName(el)}" width="28" height="28"></button>`).join('')}</div>`;
}
function arrowChips(g: Game) {
  const opts = arrowOptions(g);
  if (opts.length < 2) return '';
  const now = arrowLook(g);
  const fusion = fusionOf(g);
  const name = (el: ArrowLook) => t(el === 'fusion' && fusion ? (`${fusionKey(fusion)}Name` as Key) : (`${el}Name` as Key));
  const pic = (el: ArrowLook) => (el === 'fusion' && fusion ? `fusion-${fusion}` : el);
  return `<div class="gp-chips" role="group" aria-label="${t('gearArrowPick')}">${opts.map((el) => `<button type="button" class="gp-chip${el === now ? ' is-on' : ''}" data-arrow="${el}" aria-pressed="${el === now}" title="${name(el)}"><img src="./images/game/skills/${pic(el)}.webp" alt="${name(el)}" width="28" height="28"></button>`).join('')}</div>`;
}
function spiritChips(g: Game) {
  const opts = ownedSpirits();
  if (opts.length < 2) return '';
  const now = g.loadout.spirit;
  return `<div class="gp-chips" role="group" aria-label="${t('gearSpiritPick')}">${opts.map((sk) => `<button type="button" class="gp-chip${sk === now ? ' is-on' : ''}" data-spirit="${sk}" aria-pressed="${sk === now}" title="${t(`${SPIRIT_ITEM[sk]}Name` as Key)}"><img src="./images/game/spirits/${sk}-float-0.webp" alt="${t(`${SPIRIT_ITEM[sk]}Name` as Key)}" width="28" height="28"></button>`).join('')}</div>`;
}
gearPanel.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('button');
  if (!target || !game) return;
  if (target.classList.contains('gp-close')) { closeGearPanel(); return; }
  if (target.dataset.blade) pickBlade(game, target.dataset.blade as Parameters<typeof pickBlade>[1]);
  else if (target.dataset.arrow) pickArrow(game, target.dataset.arrow as ArrowLook);
  else if (target.dataset.spirit) pickSpirit(game, target.dataset.spirit as SpiritSkin);
  else return;
  audio.play('pick');
  const scroll = gearPanel.scrollTop;
  renderGearPanel(game);
  gearPanel.scrollTop = scroll;
});

function openGearPanel() {
  const g = game;
  if (!g || g.phase !== 'play' || paused) return;
  paused = true;
  stick.on = false;
  keys.clear();
  renderGearPanel(g);
  // Open beside the column, its top level with the column's.
  const box = hudGear.getBoundingClientRect();
  gearPanel.style.top = `${Math.round(box.top)}px`;
  gearPanel.style.right = `${Math.round(window.innerWidth - box.left + 8)}px`;
  gearPanel.hidden = false;
  document.documentElement.classList.add('gear-open');
  audio.play('click');
}
function renderGearPanel(g: Game) {
  const row = (id: SkillId | 'bow') => {
    // The bow shows the level of the arrow it wears (the fusion's own label once fused).
    const look = id === 'bow' ? arrowLook(g) : null;
    const lv = id === 'bow' ? (look && look !== 'fusion' ? g.skills[look] : 0) : g.skills[id];
    const max = id === 'bow' ? (look && look !== 'fusion' ? maxLevel(look) : 0) : maxLevel(id);
    const evolved = id !== 'bow' && !!g.evolved[id];
    const level = id === 'bow' ? (look === 'fusion' ? `★ ${t('fusionCat')}` : look ? t('gearLevel', { level: lv, max }) : '') : evolved ? `★ ${t('evoLabel')}` : max > 50 ? t('gearLevelOnly', { level: lv }) : t('gearLevel', { level: lv, max });
    const partner = id !== 'bow' && !evolved ? EVO_PARTNER[id] : undefined;
    const hint = partner ? `<small class="gp-evo${canEvolve(g, id as SkillId) ? ' is-ready' : ''}">★ ${t('evoWith', { skill: t(`${partner}Name` as Key) })}</small>` : '';
    return `<li${evolved ? ' class="is-evo"' : ''}><span class="gp-icon">${skillIcon(id, 34, iconFile(g, id))}</span><span class="gp-copy"><b>${skillName(g, id)}</b><small>${skillText(g, id)}</small>${hint}</span>${level ? `<em>${level}</em>` : ''}${id === 'blades' ? bladeChips(g) : id === 'spirits' ? spiritChips(g) : id === 'bow' ? arrowChips(g) : ''}</li>`;
  };
  const weapons = ['bow' as const, ...ownedWeapons(g)];
  const upgrades = SKILLS.filter((s) => CATEGORY[s] === 'upgrade' && g.skills[s] > 0);
  const fusion = fusionOf(g);
  const fusionRow = fusion
    ? `<h4>${t('gearFusion')}</h4><ul><li class="is-fusion"><span class="gp-icon" aria-hidden="true">${fusionIcon(g, fusion, 34)}</span><span class="gp-copy"><b>${fusionLine(g, fusion)}</b><small>${t(`${fusionKey(fusion)}Text` as Key)}</small></span></li></ul>`
    : canFuse(g) ? `<p class="gp-hint">${t('fusionPending', { fusion: fusionLine(g, pairFusion(g) as Fusion) })}</p>`
    : pairFusion(g) ? `<p class="gp-hint">${t('fusionNeedMax', { fusion: fusionLine(g, pairFusion(g) as Fusion), max: 3 })}</p>`
    : arrowElements(g).length === 1 ? `<p class="gp-hint">${t('fusionHint')}</p>` : '';
  gearPanel.innerHTML = `<header><b>${t('gearTitle')}</b><button type="button" class="gp-close" aria-label="${t('resume')}">✕</button></header>
    <h4>${t('gearWeapons')}</h4><ul>${weapons.map(row).join('')}</ul>${fusionRow}
    ${upgrades.length ? `<h4>${t('gearUpgrades')}</h4><ul>${upgrades.map(row).join('')}</ul>` : ''}
    <p class="gp-hint">${t('gearHint')}</p>`;
}
function closeGearPanel() {
  if (gearPanel.hidden) return;
  gearPanel.hidden = true;
  document.documentElement.classList.remove('gear-open');
  paused = false;
}
hudGear.setAttribute('aria-label', t('gearOpen'));
hudGear.addEventListener('click', (event) => {
  event.stopPropagation();
  if (gearPanel.hidden) openGearPanel();
  else closeGearPanel();
});
hudGear.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); hudGear.click(); }
});
// A tap outside it closes it (inside, the swaps and the ✕ work as buttons).
window.addEventListener('pointerdown', (event) => {
  if (gearPanel.hidden || (event.target as HTMLElement).closest('#hudGear, #gearPanel')) return;
  event.preventDefault();
  closeGearPanel();
}, { capture: true });

function togglePause(force?: boolean) {
  if (!gearPanel.hidden) {
    // Esc / P close the skills list; hiding the tab keeps it paused.
    if (force !== true) closeGearPanel();
    return;
  }
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
  heal: 'revive', heart: 'gem', chest: 'levelup', wheel: 'door', shrine: 'door', rage: 'boss',
};
// Hits and gems happen many times a frame; one sound per kind per frame is plenty.
/** The laser's sound follows its beam colour: a tier a level, and the Death Ray's own. */
const laserSfx = (g: Game): Sfx => (g.evolved.laser ? 'laserEvo' : g.skills.laser >= 3 ? 'laser3' : g.skills.laser === 2 ? 'laser2' : 'laser1');
function playEvents(g: Game) {
  const seen = new Set<GameEvent>();
  for (const event of g.events) {
    if (seen.has(event)) continue;
    seen.add(event);
    const name = event === 'laser' ? laserSfx(g) : SFX_FOR[event];
    if (name) audio.play(name);
  }
}

/* -------------------------------------------------------------------- input */

const keys = new Set<string>();
window.addEventListener('keydown', (event) => {
  // Typing in a field (the profile name) is not steering the hero.
  if ((event.target as HTMLElement).closest?.('input, textarea')) return;
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

const view: View = { scale: 1, ox: 0, oy: 0, dpr: 1, cx: 0, cy: 0, w: 0, h: 0 };
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
  const hudH = hud.hidden ? 96 : hud.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--hud-h', `${hudH}px`);
  const bossH = !save.retro && !bossBar.hidden ? bossBar.getBoundingClientRect().height - 8 : 0;
  // Wide screens park the HUD down the left side (game.css sets --hud-side), so the room gets the whole height.
  const side = getComputedStyle(document.documentElement).getPropertyValue('--hud-side').trim() === '1';
  const top = side ? 8 : save.retro ? 86 : Math.max(96, hud.hidden ? 96 : hud.getBoundingClientRect().height + 2) + bossH;
  // Keep the game room below the skinned HUD and the weapons row on notched phones.
  const scale = Math.min(width / W, (height - top - 8) / H);
  view.scale = scale;
  view.dpr = dpr;
  view.ox = (width - W * scale) / 2;
  // Spare height goes mostly below the room, so it hugs the HUD.
  view.oy = top + (height - top - 8 - H * scale) * 0.15;
  // On call the camera sits in the middle of the free area under the HUD.
  view.w = width;
  view.h = height;
  view.cx = width / 2;
  view.cy = top + (height - top) / 2;
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
  // Once the run is over its sparks and effects still play out and fade.
  if (g && (g.phase === 'over' || g.phase === 'won')) settleEffects(g, dt);
  if (g && !paused && g.phase === 'play') {
    update(g, dt, readInput());
    if (calm) g.shake = 0;
    playEvents(g);
    for (const event of g.events) {
      if (event === 'clear') flash(g.room === WHEEL_ROOM && g.wheelDoor ? t('wheelHint') : t('doorOpen'));
      if (event === 'shrine') flash(t('shrineHint'));
      if (event === 'heal') flash(t('statueHeal'));
      if (event === 'room' && g.mode === 'sprints') { flash(t('sprint', { room: g.room })); audio.setIntensity(Math.min(0.8, 0.2 + g.room * 0.05 + (g.world - 1) * 0.05)); }
      if (event === 'plants') {
        const boss = g.enemies.find((e) => e.bossId === 'queen');
        if (boss) flash(t('bossPlants', { name: bossTitle(boss) }));
      }
      if (event === 'minion') {
        const boss = g.enemies.find((e) => e.final && !e.clone);
        if (boss) flash(t('bossMinion', { name: bossTitle(boss) }));
      }
      if (event === 'phase') {
        const boss = g.enemies.find((e) => e.phase > 1);
        if (boss) flash(t(boss.phase > 2 ? 'bossFinalForm' : 'bossWing', { name: bossTitle(boss) }));
      }
      if (event === 'rage') {
        const boss = g.enemies.find((e) => e.rage);
        // Nocthrax's final form says so instead.
        if (boss && boss.phase < 3) flash(t('bossRage', { name: bossTitle(boss) }));
      }
      if (event === 'minute') { flash(t('minuteN', { n: Math.floor(g.time / 60) })); audio.setIntensity(Math.min(0.85, 0.25 + (g.time / 60) * 0.06)); }
      if (event === 'boss') {
        const boss = g.enemies.find((e) => e.kind === 'boss' && !e.clone);
        const name = boss ? bossTitle(boss) : t('bossOriginal');
        flash(g.mode === 'horde' ? t(!g.endless && g.hordeBoss >= 2 ? 'hordeFinal' : 'hordeBossIn', { name }) : `${t('sprint', { room: g.room })} · ${name}`);
        audio.setIntensity(1);
      }
      if (event === 'revive') flash(t('revived'));
      if (event === 'poison' || event === 'stun' || event === 'chill' || event === 'dark') flash(t(`status${cap(event)}` as Key));
      if (event === 'chest') flash(t('chestHint'));
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
    // The run ends on the field first: the hero down on the floor (or cheering) for a moment, then the dialog pops up.
    if (phase === 'over' || phase === 'won') {
      stick.on = false;
      keys.clear();
      window.setTimeout(() => {
        if (game !== g || g.phase !== phase) return;
        if (phase === 'over' && (canPayRevive(g) || (ads.enabled && canAdRevive(g)))) {
          if (!reviveOffered) { reviveOffered = true; audio.play('over'); offerRevive(g); }
        } else endScreen(g);
      }, END_PAUSE);
    }
  }

  if (g) {
    // On call: the field is whatever the canvas shows, so bugs spawn just past its edge.
    g.viewHalf = { x: Math.max(W / 2, view.cx / view.scale), y: Math.max(H / 2, (view.h - view.cy) / view.scale, view.cy / view.scale) };
    draw(ctx, g, view, palette, now / 1000);
    hudRoom.textContent = `${t('worldShort', { n: g.world })} · ${whereLine(g)}`;
    hudLevel.textContent = t('level', { level: g.level });
    setMeter(hudXp, g.xp / g.xpNext);
    setMeter(hudHp, Math.max(0, g.player.hp) / g.player.maxHp);
    // The wallet: what is banked plus what this run has picked up so far (banked when the run ends).
    hudCoins.textContent = String(Math.floor(save.coins + g.coins));
    const bowLook = arrowLook(g);
    const gear = [['bow', bowLook && bowLook !== 'fusion' ? g.skills[bowLook] : 1] as const, ...ownedWeapons(g).map((id) => [id, g.skills[id]] as const)];
    const isEvo = (id: SkillId | 'bow') => id !== 'bow' && !!g.evolved[id];
    const gearKey = gear.map(([id, lvl]) => `${iconFile(g, id)}${lvl}${isEvo(id) ? 'E' : ''}`).join(' ');
    if (hudGear.dataset.gear !== gearKey) {
      hudGear.dataset.gear = gearKey;
      hudGear.innerHTML = gear.map(([id, lvl]) => `<span${isEvo(id) ? ' class="is-evo"' : ''}>${skillIcon(id, 22, iconFile(g, id))}<sub>${isEvo(id) ? '★' : lvl}</sub></span>`).join('');
    }
    const boss = g.mode === 'horde' || isBossRoom(g.room) ? g.enemies.find((e) => e.kind === 'boss' && !e.clone && !e.minion && (e.spawn <= 0 || e.vanish)) : undefined;
    audio.setBoss(g.phase !== 'over' && g.phase !== 'won' && g.enemies.some((e) => e.kind === 'boss' && !e.clone && !e.minion && !e.dead));
    const finalOut = g.phase !== 'over' && g.phase !== 'won' ? g.enemies.find((e) => e.final && !e.clone && !e.dead) : undefined;
    audio.setFinal(!!finalOut, !!finalOut?.rage);
    if (bossBar.hidden !== !boss) {
      bossBar.hidden = !boss;
      requestAnimationFrame(resize); // the room makes room for the bar (after layout)
    }
    if (boss) {
      bossName.textContent = bossTitle(boss);
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
/** Wide landscape screens get the owner's desktop cover (game.css switches at the same query). */
const WIDE_COVER = window.matchMedia('(min-width: 900px) and (orientation: landscape)').matches;
const PRELOAD: [string, number][] = [
  [WIDE_COVER ? './images/game/cover-wide.jpg' : './images/game/cover-tall.jpg', 10],
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
      loadingFill.style.setProperty('--p', String(Math.max(0.04, loadedWeight / totalWeight)));
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
  loadingFill.style.setProperty('--p', '1');
  menuScreen();
  loading.classList.add('is-done');
  setTimeout(() => loading.remove(), 400);
});
requestAnimationFrame(frame);
