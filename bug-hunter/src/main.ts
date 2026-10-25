import { openSiege } from './siege';
import { CONVERGENCE_SCENE, CONVERGENCE_IMAGE } from './scenery';
import './game.css';
import { GAME_BUILD, GAME_VERSION } from './version';
import { storage } from '../lib/storage';
import { ads, configureAds, type AdSpot, type PlayAd } from './ads';
import { configurePayments, payments } from './payments';
import { COIN_PACKS, currentOffer, grant, packBonus, SKIN_OFFERS, type CoinPack, type SkinOffer } from './store';
import { DAILY_ODDS, DAILY_WHEEL, dailyLeft, dailyReady, openDaily, type DailyPrize, type DailyResult } from './daily';
import { audio, BOSS_SONGS, type Sfx, type SongPick } from './audio';
import { MID_ART, boardBackdropBounds, draw, drawRetroFigure, preloadBoardBossFx, preloadCast, preloadFx, type Palette, type View } from './draw';
import { DEFAULT_NAME, NAME_MAX, NET_ID, STAR_COLORS, cleanName, wipeProgress, worldWon, loadSave, profileLevel, writeSave, STYLES, SKINS, WORLD_SKINS, SKIN_GATE, SKIN_GROUPS, skinOpen, ownsSkin, skinPrice, worldOutfit, type EnemyStyle, type HeroSkin, type PlayMode, heroKey, heroStill } from './save';
import { ABILITY, ABIL_V, BENCH_CAP, canFight, moveBenchSeat, CELL, COLS, FINAL_ID, HOME_ROW, NATIVE_WORLD_BONUS, ROWS, ROUNDS, SYNERGY, TACTICS, armyCap, deployBench, sellBench, storeOnBench, toggleAutoMerge, tickMerge, autoMergePrice, buyAutoMerge, summon as boardSummon, summonPrice, commanderStrike, roundBonus, roundGold, synergies, TIER_KIND, boardCoins, buy as boardBuy, castLook, moveUnit, newBoard, nextRound, pieceAt, reroll as boardReroll, saleOf, sell as boardSell, startFight, startOnlineFight, unitStats, updateBoard, waveSpots, waveUnitStats, type BoardGame, type Online, type Piece, type Variant } from './board';
import { cleanCode, dial, hostGame, joinGame, leave as netLeave, presence, presenceOn, presenceReady, send as netSend, type NetHandlers, type NetMsg, type NetProfile, type NetState, type Together } from './net';
import { ABILITY_ICON, ABILITY_PIC, SYNERGY_PIC, FIREBALL, boardMerged, boardUnitBounds, drawBoard, mirrorFight, drawBoardDrag, layoutBoard, slotAt, type BoardDrag, type BoardLayout, type HeroPics } from './boardView';
import type { Enemy } from './world';
import { ARMOUR_SLOTS, ARSENAL, ITEMS, itemLevel, type SpiritSkin, UPGRADES, WEAPON_SLOTS, EXTRA_SLOT_PRICE, buildLoadout, itemById, upgradeById, upgradePic, upgradePrice, type ItemId, type Slot, type UpgradeId } from './shop';
import { Scene } from './scene';
import { ACHIEVEMENTS, achEarned, achTotal, checkAchievements, tierKey, tiersDone, type Ach, type AchId } from './achievements';
import { makeT, pickLang, type Key, type Lang } from './strings';
import {
  CATEGORY, EVO_PARTNER, H, NIGHTMARE_WORLD, SECRET_WORLD, showcaseHit, startShowcase, canFuse, revivePrice, SKILLS, arrowLook, arrowOptions, bladeElement, bladeOptions, canEvolve, evoOf, fusionOf, fusionWith, evoLostBy, pairFusion, arrowElements, settleEffects, rerollChoices, adReroll, adRevive, canAdReroll, canAdRevive, maxLevel, pickArrow, pickBlade, pickSpirit, ROOMS, SHRINE_ROOMS, W, WHEEL, WHEEL_COINS, WHEEL_GOOD, WHEEL_LUCKY, WHEEL_ROOM, WORLDS, WORLD_COUNT, applyWheel, chooseSkill, isBossRoom, leaveWheel, newGame, ownedWeapons, paidRevive, shrinePick, update,
  type ArrowLook, type Category, type Choice, type Fusion, type Game, type GameEvent, type Input, type Look, type SkillId, type WheelOutcome,
  coopApply, coopDealt, coopHits, coopSnapshot,
} from './world';

/* Bug Hunter's page: the menus (play, shop, enemy looks, options), input
   (touch joystick or keyboard), sound hooks and the frame loop. The rules are
   in world.ts, the drawing in draw.ts, the music in audio.ts. */

/** The game's language: the site's saved one, and changed from Options (`setLang`), which saves it for the site too. */
let lang = pickLang();
let t = makeT(lang);
document.documentElement.lang = lang;
function setLang(next: Lang) {
  lang = next;
  t = makeT(lang);
  document.documentElement.lang = lang;
  storage.set('lang', lang);
  // What was set once at load, in the new language.
  document.title = `${t('title')} · alvrich`;
  configurePayments({ title: t('payTestTitle'), note: t('payTestNote'), ok: t('payTestOk'), cancel: t('payTestCancel') });
  backLink.setAttribute('aria-label', t('back'));
  pauseBtn.setAttribute('aria-label', t('pause'));
  hudGear.setAttribute('aria-label', t('gearOpen'));
  hudHp.parentElement?.setAttribute('aria-label', lang === 'es' ? 'Vida' : 'Health');
}
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
/** The showcase's button: a quarter of the boss's health off, to move it on to its next phase or finish it. */
const showcaseBtn = $<HTMLButtonElement>('showcaseHit');
showcaseBtn.addEventListener('click', () => { if (game && showcaseHit(game)) audio.play('hit'); });
const gearPanel = $<HTMLElement>('gearPanel');
const hudCoins = $<HTMLElement>('hudCoins');
const bossBar = $<HTMLElement>('bossBar');
const bossName = $<HTMLElement>('bossName');
const bossHp = $<HTMLElement>('bossHp');
const pauseBtn = $<HTMLButtonElement>('pauseBtn');
const backLink = $<HTMLAnchorElement>('backLink');
backLink.setAttribute('aria-label', t('back'));
backLink.addEventListener('click', (event) => {
  if (!game || game.phase === 'over' || game.phase === 'won') return;
  event.preventDefault();
  leaveScreen('menu');
});
pauseBtn.setAttribute('aria-label', t('pause'));

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------------------------------------------------------------- the save */

const save = loadSave();
// Every save also checks the achievements, so a purchase or a run earns them at once; the menu announces them.
const persist = () => { checkAchievements(save); writeSave(save); };
// What an older save already did counts at once (the menu then announces it).
if (checkAchievements(save).length) writeSave(save);
audio.setVolumes(save.music, save.sfx);
audio.setSong(save.song);
dressPalette();
palette.retro = save.retro;
document.documentElement.toggleAttribute('data-retro', save.retro);

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const RUSH_ICON = '👑';
/** Boss Rush runs through the bosses of the worlds open in sprints. */
const rushWorlds = () => Math.min(WORLD_COUNT, save.unlocked);
const secretLine = () => (save.secretBest ? t('secretBest', { time: clock(save.secretBest.time), kills: save.secretBest.kills }) : t('bestNone'));
const rushLine = () => (save.rushBest ? t('rushBest', { n: save.rushBest.stage, total: save.rushBest.stages, time: clock(save.rushBest.time) }) : t('bestNone'));
const nightmareLine = () => (save.nightmareBest ? t('nightmareBest', { time: clock(save.nightmareBest.time), kills: save.nightmareBest.kills }) : t('bestNone'));
const bestLine = (world = worldIn(), mode: PlayMode = save.mode) => {
  if (mode === 'board') {
    const best = save.boardBest[world];
    if (!best) return '';
    return best.won ? t('boardBestWon') : t('boardBest', { n: best.round, total: ROUNDS });
  }
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
const unlockedIn = (mode: PlayMode = save.mode) => (mode === 'board' ? save.boardUnlocked : mode === 'horde' ? save.hordeUnlocked : save.unlocked);
const worldIn = (mode: PlayMode = save.mode) => (mode === 'board' ? save.boardWorld : mode === 'horde' ? save.hordeWorld : save.world);
function setWorld(n: number, mode: PlayMode = save.mode) {
  if (mode === 'board') save.boardWorld = n;
  else if (mode === 'horde') save.hordeWorld = n;
  else save.world = n;
}
const modeName = (mode: PlayMode = save.mode) => t(mode === 'board' ? 'modeBoard' : mode === 'horde' ? 'modeHorde' : 'modeSprints');
const modeText = (mode: PlayMode = save.mode) => t(mode === 'board' ? 'modeBoardText' : mode === 'horde' ? 'modeHordeText' : 'modeSprintsText');
const MODE_ICON: Record<PlayMode, string> = { sprints: '⚔️', horde: '🛡️', board: '♟️' };
const MODES: PlayMode[] = ['sprints', 'horde', 'board'];
// Fourth cover position: preview only, never persisted as a PlayMode.
let extraModePreview = false;
const coverModes = [...MODES, 'coming-soon'] as const;
const extraTitle = () => lang === 'es' ? 'Próximamente' : 'Coming Soon';
const extraText = () => t('siegeHubModes');
const NIGHTMARE_ICON = '☠️';
/** Where the run is: the sprint, or the shift's clock. */
const whereLine = (g: Game) => (g.rush ? `${g.showcase ? '👁' : RUSH_ICON} ${t('rushWhere', { n: g.rush, total: g.stages })}` : g.mode === 'horde' ? `${g.endless ? NIGHTMARE_ICON : MODE_ICON.horde} ${clock(g.time)}` : t('sprint', { room: g.room }));
const worldName = (n: number) => t(`world${n}Name` as Key);
const WORLD_ICON = ['🐞', '🔥', '❄️', '🐸', '🍃', '🛡️', '✨', '👻', '💗'];
const coinsLine = (n = save.coins) => `<span class="coin">🪙</span> ${Math.floor(n)}`;

/** The arsenal weapon the last banked run put on sale (its world won for the first time), for the end screen. */
let arsenalOpened: SkillId | null = null;
/** …and the shop item it put on sale (the Senior's Tome waits for the last world). */
let itemOpened: ItemId | null = null;
/** An item that waits for a world is on sale once that world is won in either mode. */
const itemOpen = (item: { world?: number; needs?: SkillId }) => (!item.world || worldWon(save, item.world)) && (!item.needs || save.arsenal.includes(item.needs));
/** What a closed item's button says: the world to win, or the arsenal weapon to buy first. */
const lockText = (item: { world?: number; needs?: SkillId }) =>
  item.needs && !save.arsenal.includes(item.needs) ? t('arsenalNeeds', { name: t(`${item.needs}Name` as Key) }) : t('arsenalLocked', { n: item.world ?? 0 });
/** Banks the coins and the record; returns the world unlocked by this run, if any. */
/** Time played for the profile: minutes under an hour, hours and minutes after, whole hours past a hundred. */
function playTimeText(seconds: number) {
  const min = Math.floor(seconds / 60);
  const h = Math.floor(min / 60);
  return h >= 100 ? `${h} h` : h ? `${h} h ${min % 60} min` : `${min} min`;
}
function bankRun(g: Game): number | null {
  // The showcase is only for looking: no record, no coins, no run counted.
  if (g.showcase) { arsenalOpened = null; itemOpened = null; return null; }
  const won = g.phase === 'won';
  const wasWon = worldWon(save, g.world);
  if (g.secret) {
    // The secret shift: its own record; it opens nothing and leaves the jungle's records alone.
    const best = save.secretBest;
    if (!best || (won && !best.won) || (won === best.won && g.time > best.time)) save.secretBest = { time: g.time, kills: g.kills, won };
  } else if (g.rush) {
    // Boss Rush: the furthest boss counts (out of more bosses beats fewer), then the fastest clear; it opens nothing.
    const best = save.rushBest;
    const reach = g.rush - (won ? 0 : 1);
    const better = !best || reach > best.stage || (reach === best.stage && won && (!best.won || g.time < best.time));
    if (better && reach > 0) save.rushBest = { stage: reach, stages: g.stages, time: g.time, won };
  } else if (g.endless) {
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
  // The lifetime totals the achievements count: Nightmare's bugs on their own, the rest by the world played in.
  save.stats.kills += g.kills;
  if (g.endless) {
    save.stats.nightmareKills += g.kills;
    save.stats.nightmareLongest = Math.max(save.stats.nightmareLongest, g.time);
  } else save.stats.killsByWorld[g.world] = (save.stats.killsByWorld[g.world] ?? 0) + g.kills;
  save.runs += 1;
  save.playTime = (save.playTime || 0) + g.time;
  save.xp += Math.round(g.xpEarned);
  let unlocked: number | null = null;
  // Only a plain run opens a world or puts things on sale: a Boss Rush ends in its last boss's world and the secret
  // shift plays in the jungle, and neither should open what comes after them.
  const plain = !g.rush && !g.secret && !g.endless;
  if (plain && won && g.world < WORLD_COUNT && unlockedIn(g.mode) < g.world + 1) {
    if (g.mode === 'horde') save.hordeUnlocked = g.world + 1;
    else save.unlocked = g.world + 1;
    setWorld(g.world + 1, g.mode);
    unlocked = g.world + 1;
  }
  // A sprints world won gives alvrich's next world outfit, worn at once.
  const outfit = plain && won && g.mode === 'sprints' ? worldOutfit(g.world) : undefined;
  if (outfit && !save.skins.includes(outfit)) { save.skins.push(outfit); save.skin = outfit; }
  const weapon = ARSENAL.find((a) => a.world === g.world);
  arsenalOpened = plain && won && !wasWon && weapon && !save.arsenal.includes(weapon.id) ? weapon.id : null;
  const item = ITEMS.find((it) => it.world === g.world);
  itemOpened = plain && won && !wasWon && item && !save.owned.includes(item.id) ? item.id : null;
  persist();
  return unlocked;
}

/* ------------------------------------------------------------------ screens */

/** The painted medallion of a skill (static/images/game/skills/, one per skill id). */
const EMOJI: Record<SkillId | 'bow', string> = {
  sword: '🗡️', blades: '🌀', hammer: '🔨', storm: '🌩️', fireball: '☄️', frost: '❄️', spirits: '👻', laser: '🔦', knives: '🔪', boomerang: '🪃',
  fire: '🔥', water: '💧', leaf: '🍃', bolt: '⚡', spark: '✨', ghost: '🫥', double: '🏹', speed: '⏩', power: '💥', heart: '💗', bow: '🏹',
  shoes: '👟', bracer: '🦾', drink: '🥤',
  rear: '🔁', multi: '🚀', headshot: '💀', vampire: '🗑️', crit: '🎯', rage: '😤', dodge: '📶', safe: '🛡️', nova: '💥', giant: '🗿', dwarf: '🐜',
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
const STYLE_ICON: Record<EnemyStyle, string> = { world: '🌍', original: '🐞', demon: '😈', viking: '🪓', mud: '🐸', jungle: '🕷️', greek: '🏛️', robot: '🤖', nightmare: '💀', core: '🐉', random: '🎲' };
/** Each cast's row shows its plain bug, the weakest and most common of its enemies (its first walking frame cropped to the
    figure and squared, `enemies/<look>-bug-icon.webp`); the world's own and the random mix keep their emoji, as does retro. */
const styleIcon = (style: EnemyStyle) => style === 'random' || save.retro ? STYLE_ICON[style]
  // «By world» has the owner's own medallion, a purple armoured bug (`ui/style-world.webp`).
  : style === 'world' ? '<img class="scene-pic" src="./images/game/ui/style-world.webp" alt="">'
  : `<img class="scene-pic boss-pic" src="./images/game/enemies/${style}-bug-icon.webp" alt="">`;
/** A boss's name: the cast's boss in room 6, the world's own final boss in room 12. */
const bossTitle = (e: Enemy) => t(e.final || e.bossId === 'kratos' ? (`final${cap(e.bossId)}` as Key) : BOSS_NAME[e.look]);
const BOSS_NAME: Record<Look, Key> = { original: 'bossOriginal', demon: 'bossDemon', viking: 'bossViking', mud: 'bossMud', jungle: 'bossJungle', greek: 'bossGreek', robot: 'bossRobot', nightmare: 'bossNightmare', core: 'bossCore' };

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
/* Scrolling boxes (`.fade-scroll`: every dialog's, the skills panel, the map) fade at an edge only while there is
   more past it, a little more the further there is to go, up to `FADE` (`--ft`, `--fb` in game.css). */
const FADE = 18;
function fadeEdges(el: HTMLElement) {
  const more = el.scrollHeight - el.clientHeight;
  // Customise's back-to-top button shows only once the list is scrolled down.
  el.parentElement?.querySelector('.ui-top')?.classList.toggle('is-shown', el.scrollTop > 40);
  el.style.setProperty('--ft', `${more > 1 ? Math.min(FADE, el.scrollTop) : 0}px`);
  el.style.setProperty('--fb', `${more > 1 ? Math.min(FADE, more - el.scrollTop) : 0}px`);
}
const fadeAll = () => document.querySelectorAll<HTMLElement>('.fade-scroll').forEach(fadeEdges);
document.addEventListener('scroll', (e) => { if (e.target instanceof HTMLElement && e.target.classList.contains('fade-scroll')) fadeEdges(e.target); }, true);
// Pictures arriving change the heights.
document.addEventListener('load', fadeAll, true);
window.addEventListener('resize', fadeAll);

function fitPanel() {
  requestAnimationFrame(fadeAll);
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
  // A dialog that opens (not one re-rendering itself) pops up with a zoom: over the game, or from the cover
  // (options, Customise, the shop, the map and the rest of the main menu's screens).
  const opening = screen.hidden || (screen.classList.contains('is-menu') && !menu);
  if (!save.retro) html = html.replaceAll('🪙', COIN_PIC);
  // A dialog that re-renders itself (the shop after a purchase) keeps its scroll.
  const keepScroll = extra === 'keep-scroll' ? screen.querySelector('.panel-in')?.scrollTop ?? 0 : 0;
  // The corner buttons (close, options) are pulled out of the scrolling box so they stay put.
  const close = (html.match(/<button class="ui-(?:close|opts|top)"[^>]*>(?:<span[^>]*>(?:[^<]|<(?!\/span>))*<\/span>)?<\/button>/g) ?? []).join('');
  for (const b of html.match(/<button class="ui-(?:close|opts|top)"[^>]*>(?:<span[^>]*>(?:[^<]|<(?!\/span>))*<\/span>)?<\/button>/g) ?? []) html = html.replace(b, '');
  const cls = `panel${wide ? ' panel-wide' : ''}${opening && !menu ? ' is-pop' : ''}`;
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
    old.innerHTML = `${close}<div class="panel-in fade-scroll">${html}</div>`;
    for (const img of old.querySelectorAll('img')) {
      const same = kept.get(img.src)?.shift();
      if (!same) continue;
      // Only what differs is touched: setting src again could start a reload.
      for (const { name } of [...same.attributes]) if (!img.hasAttribute(name)) same.removeAttribute(name);
      for (const { name, value } of [...img.attributes]) if (same.getAttribute(name) !== value) same.setAttribute(name, value);
      img.replaceWith(same);
    }
  } else {
    screen.innerHTML = `<div class="${cls}">${close}<div class="panel-in fade-scroll">${html}</div></div>`;
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
  endBoard();
  friendMini.hidden = true;
  together = null;
  // Back on the cover: your profile may have grown in the run (a level, an item), so the friend gets it again.
  if (friend) netSend(hello());
  else goOnline();
  showcaseBtn.hidden = true;
  game = null;
  audio.setSong(save.song); // a Boss Rush played by world; back to the pick
  hud.hidden = true;
  hudGear.hidden = true;
  closeGearPanel();
  bossBar.hidden = true;
  // The cover keeps the music as full as in a run (it used to be muffled here).
  audio.setIntensity(0.5);
  audio.setBoss(false);
  audio.setFinal(false, false);
  audio.setWorld(0);
  audio.setPreview(false);
  const { level, progress } = profileLevel(save.xp);
  const copy = (cls: string, title: string, sub: string) => `<span class="cover-card-copy ${cls}"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>`;
  show(`
    <div class="cover">
      <a class="hot cover-x" href="./index.html" aria-label="${t('back')}"></a>
      <button class="hot cover-more" data-act="options" aria-label="${t('options')}"></button>
      <div class="cover-in">
      <button class="cover-book${save.bookSeen ? '' : ' is-first'}" type="button" data-act="book" aria-label="${t('bookOpen')}"><img src="./images/game/items/seniorTome.webp" alt=""></button>
      <button class="hot cover-profile" data-act="profile" aria-label="${t('profile')}: ${esc(save.name)} · ${t('lvShort', { level })}"></button>
      <span class="cover-avatar" aria-hidden="true"><img src="${heroPic()}" alt=""></span>
      ${friend ? `<button class="hot cover-friend" type="button" data-act="link" aria-label="${t('onlinePlay')}: ${esc(friend.name)}"><span class="friend-pic"><img data-friend-portrait src="./images/game/hero/${friend.still}.webp" alt=""></span><b>${linkedName()}</b><i class="friend-dot" aria-hidden="true"></i></button>` : `<button class="hot cover-friend is-add" type="button" data-act="link" aria-label="${t('linkAdd')}"><span class="friend-pic is-add" aria-hidden="true"></span><b>${t('linkAdd')}</b></button>`}
      <span class="cover-profile-copy"><small>${esc(save.name)}${masteries() ? ` ${stars()}` : ''}</small><b>${t('lvShort', { level })}</b><i><b style="width:${Math.round(progress * 100)}%"></b></i></span>
      <button class="hot cover-coins" data-act="coin-store" aria-label="${t('storeTitle')}: ${Math.floor(save.coins)}"></button>
      <span class="cover-num is-coins">${Math.floor(save.coins)}</span>
      <button class="hot cover-worlds" data-act="map" aria-label="${t('map')}: ${unlockedIn()}/${WORLD_COUNT}"></button>
      <span class="cover-num is-worlds">${unlockedIn()}/${WORLD_COUNT}</span>
      <p class="cover-tagline">${t('landingTagline')}</p>
      <button class="cover-chest${dailyReady(save) ? ' is-ready' : ''}" type="button" data-act="daily" aria-label="${t('dailyTitle')}"><img src="./images/game/fx/chest.webp" width="165" height="140" alt=""><i${dailyReady(save) ? '>' + t('dailyReady') : ` data-daily-clock>${dailyClock()}`}</i></button>
      <span class="cover-play-bar is-slot" aria-hidden="true"></span>
      <span class="cover-play-bar is-${extraModePreview ? 'coming-soon' : save.mode}" aria-hidden="true"></span>
      <button class="hot cover-play" data-act="${extraModePreview ? 'extra-hub' : 'play'}" aria-label="${extraModePreview ? extraTitle() : t('playNow') + ' · ' + modeName() + ' · ' + worldName(worldIn())}"></button>
      <span class="cover-play-copy is-${extraModePreview ? 'coming-soon' : save.mode}"><b>${extraModePreview ? '🏰 ' + extraTitle() : MODE_ICON[save.mode] + ' ' + modeName()}</b><small>${extraModePreview ? extraText() : t('playNow') + ' · ' + WORLD_ICON[worldIn() - 1] + ' ' + worldName(worldIn())}</small></span>
      <button class="cover-arrow is-prev" type="button" data-act="mode-prev" aria-label="${t('modeSwipe')}"></button>
      <button class="cover-arrow is-next" type="button" data-act="mode-next" aria-label="${t('modeSwipe')}"></button>
      <span class="cover-dots" aria-hidden="true">${coverModes.map((m) => `<i class="is-${m === 'coming-soon' ? 'coming-soon' : m}${(m === 'coming-soon' ? extraModePreview : !extraModePreview && save.mode === m) ? ' is-on' : ''}"></i>`).join('')}</span>
      <button class="hot cover-card is-map" data-act="map" aria-label="${t('map')}"></button>
      ${copy('is-map', t('map'), `🌍 ${unlockedIn()} / ${WORLD_COUNT}`)}
      <button class="hot cover-card is-shop" data-act="shop" aria-label="${t('shop')}"></button>
      ${copy('is-shop', t('shop'), `🪙 ${Math.floor(save.coins)}`)}
      <button class="hot cover-card is-styles" data-act="styles" aria-label="${t('styles')}"></button>
      ${copy('is-styles', t('styles'), t(`skin${cap(save.skin)}Name` as Key))}
      <button class="hot cover-card is-options" data-act="options" aria-label="${t('options')}"></button>
      ${copy('is-options', t('options'), t('optionsSub'))}
      <p class="cover-best">${bestLine()}</p>
      ${save.bookSeen ? '' : `<p class="cover-dim-note" aria-live="polite"><b>${t('introTitle')}</b><span>${t('introText')}</span></p><i class="cover-dim-arrow" aria-hidden="true"></i>`}
    </div>
    <small class="cover-version">Bug Hunter v${GAME_VERSION} · ${GAME_BUILD.built.split('-').reverse().join('/')} · ${GAME_BUILD.commit}</small>
    <nav class="cover-legal" aria-label="${lang === 'es' ? 'Información legal' : 'Legal information'}">
      <a href="/privacy.html">${lang === 'es' ? 'Privacidad' : 'Privacy'}</a>
      <a href="/cookies.html">Cookies</a>
      <a href="/legal.html">${lang === 'es' ? 'Aviso legal' : 'Legal notice'}</a>
    </nav>
    ${save.bookSeen ? '' : '<div class="cover-dim" aria-hidden="true"></div>'}</div>`, false, true);
  announceAchievements();
}

/* Achievements earned since the menu last opened come in as gold toasts at the top, one after another (three at
   most; past that, one toast says how many). A tier is kept as `id`, `id:2`, `id:3` (`tierKey`). */
const achToast = $<HTMLElement>('achToast');
let achQueue: string[] = [];
let achTimer: number | undefined;
const achKey = (id: AchId) => `ach${cap(id)}` as Key;
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
/** An achievement's name, with its tier (I, II, III) when it has more than one. */
const achName = (a: Ach, tier: number) => `${t(achKey(a.id))}${a.goals.length > 1 ? ` ${ROMAN[tier - 1]}` : ''}`;
/** Its medal: the game's own picture in a ring of the tier's metal (the emoji in retro). */
// A plain one is gold, and so is the last tier of one with two.
const metal = (a: Ach, tier: number) => (a.goals.length === 1 || tier === a.goals.length ? 3 : tier);
const achMedal = (a: Ach, tier: number) =>
  `<span class="ach-ic is-t${metal(a, tier)}" aria-hidden="true"><img src="./images/game/${a.pic}" alt=""${a.pic.endsWith('.jpg') ? ' class="is-cover"' : ''}${a.zoom ? ` style="scale:${a.zoom}"` : ''}><i>${a.icon}</i></span>`;
const fmtN = (n: number) => n.toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB');
function parseTier(key: string): [Ach, number] | null {
  const [id, n] = key.split(':');
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  const tier = n ? Number(n) : 1;
  return a && tier >= 1 && tier <= a.goals.length ? [a, tier] : null;
}
function announceAchievements() {
  if (!save.achNew.length) return;
  const fresh = save.achNew.filter((k) => parseTier(k));
  save.achNew = [];
  writeSave(save);
  if (!fresh.length) return;
  // Queued after whatever is still showing.
  achQueue.push(...(fresh.length > 3 ? [...fresh.slice(0, 2), `+${fresh.length - 2}`] : fresh));
  if (achTimer === undefined) nextAchToast();
}
function nextAchToast() {
  const key = achQueue.shift();
  if (!key) { achToast.hidden = true; achTimer = undefined; return; }
  const hit = key.startsWith('+') ? null : parseTier(key);
  achToast.innerHTML = hit
    ? `${achMedal(hit[0], hit[1])}<span><small>${t('achUnlocked')}</small><b>${achName(hit[0], hit[1])}</b></span>`
    : `<span class="ach-ic is-t3" aria-hidden="true"><img src="./images/game/ui/mastery.webp" alt=""><i>🏆</i></span><span><small>${t('achUnlocked')}</small><b>${t('achMore', { n: key.slice(1) })}</b></span>`;
  achToast.hidden = false;
  achToast.classList.remove('is-on');
  void achToast.offsetWidth;
  achToast.classList.add('is-on');
  audio.play('levelup');
  achTimer = window.setTimeout(nextAchToast, 2800);
}

/** The achievements: earned ones lit in their tier's metal with the day the last tier came, the rest greyed; a
    tiered one shows its tiers as pips and a bar towards the next. */
function achievementsScreen() {
  const day = (ms: number) => new Date(ms).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const rows = ACHIEVEMENTS.map((a) => {
    const done = tiersDone(save, a);
    const all = done >= a.goals.length;
    const goal = a.goals[Math.min(done, a.goals.length - 1)];
    const now = Math.min(a.value(save), goal);
    const at = done ? save.achieved[tierKey(a.id, done)] : 0;
    const pips = a.goals.length > 1 ? `<span class="ach-pips">${a.goals.map((_, i) => `<i class="${i < done ? `is-t${i + 1}` : ''}"></i>`).join('')}</span>` : '';
    const bar = !all && goal > 1 ? `<i class="ach-bar"><b style="width:${Math.round((now / goal) * 100)}%"></b></i><small class="ach-n">${fmtN(now)}/${fmtN(goal)}</small>` : '';
    return `<li class="ach${done ? ` is-done is-t${metal(a, done)}` : ''}">${achMedal(a, Math.max(1, done))}<span class="ach-copy"><b>${achName(a, Math.max(1, all ? done : done + 1))}${pips}</b><span>${t(`${achKey(a.id)}Text` as Key, { n: fmtN(goal) })}</span>${bar}</span><span class="ach-state">${all ? `✓<small>${day(at)}</small>` : done ? `<small>${day(at)}</small>` : '🔒'}</span></li>`;
  }).join('');
  show(`<button class="ui-close" type="button" data-act="profile" aria-label="${t('back')}"></button>
    <button class="ui-top" type="button" data-act="to-top" aria-label="${t('toTop')}"><span><svg viewBox="0 0 24 24"><path d="M12 3 L20.5 11.5 L15 11.5 L15 21 L9 21 L9 11.5 L3.5 11.5 Z"/></svg></span></button>
    <h2>🏆 ${t('achTitle')}</h2>
    <p class="how">${t('achCount', { n: achEarned(save), total: achTotal() })}</p>
    <ul class="achs">${rows}</ul>
    ${backButton('profile', 'profile')}`);
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** The player's name goes into HTML: escape it. */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/* Masteries: clear all eight worlds of a mode and the map offers that mode's
   mastery. Taking it wipes the progress (`wipeProgress`) for a small
   permanent boost (`MASTERY_STEP`, folded in by `buildLoadout`) and a star by
   the name, whose colour the profile picks. */
const masteries = () => save.masteries;
/** The mastery is offered once every world of both modes is cleared. */
// The board does not count: it has no shop, items or skills of its own.
const masteryReady = () => worldsLeft('sprints') === 0 && worldsLeft('horde') === 0;
const clearedIn = (mode: PlayMode) =>
  Array.from({ length: WORLD_COUNT }, (_, i) => i + 1).filter((w) => (mode === 'board' ? save.boardBest[w]?.won : mode === 'horde' ? save.hordeBest[w]?.won : save.bestByWorld[w]?.time !== undefined)).length;
const worldsLeft = (mode: PlayMode) => WORLD_COUNT - clearedIn(mode);
const starColor = () => STAR_COLORS[save.starColor];
/** The stars by the name: one per mastery, in the chosen colour. */
/** In the profile, each mastery is the owner's purple bug crest (`ui/mastery.webp`) instead of a star, up to three, then one with
    «×N» so the row fits beside the name on a phone; retro keeps the stars. */
const crest = '<img class="mcrest" src="./images/game/ui/mastery.webp" alt="">';
const crests = () => (!masteries() ? '' : save.retro ? stars()
  : `<span class="mcrests" aria-label="${t('profileStars')}: ${masteries()}">${masteries() <= 3 ? crest.repeat(masteries()) : `${crest}<small>×${masteries()}</small>`}</span>`);
const stars = () => (masteries() ? `<span class="mstars" style="--star:${starColor()}" aria-label="${t('profileStars')}: ${masteries()}">${'★'.repeat(Math.min(masteries(), 5))}${masteries() > 5 ? `×${masteries()}` : ''}</span>` : '');
function resetScreen() {
  show(`<h2>${t('resetTitle')}</h2>
    <p class="note">${t('resetLeft', { sprints: worldsLeft('sprints'), horde: worldsLeft('horde') })}</p>
    <p>${t('resetText')}</p>
    <button class="ghost is-danger" data-act="reset-do">${t('resetDo')}</button>
    <button class="primary" data-act="profile">${t('cancel')}</button>`);
}
function masteryScreen() {
  show(`<h2>★ ${t('masteryTitle')}</h2>
    <p>${t('masteryText')}</p>
    <p class="how">${t('masteryHave', { n: masteries() })}</p>
    <button class="primary" data-act="mastery-do">${t('masteryDo')}</button>
    <button class="ghost" data-act="map">${t('cancel')}</button>`);
}

/* The profile: the player's name (shown on the cover), their level and a few
   totals. The name is kept in the save, cleaned by `cleanName`. */
/* The name shows once, by the hero, with a green pencil; the pencil turns it into a field with ✓ and ✕. */
let editingName = false;
const PENCIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" fill="currentColor"/><path d="M14 6l4 4" stroke="#14532d" stroke-width="1.6"/></svg>';
const TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
/** A piece of news on the end screen (a world, a weapon or an item now open, a record): the painted ring-and-plate row,
    lit, as in Customise and the shop. */
const notice = (icon: string, title: string, sub = '') =>
  `<div class="gear-row is-on is-notice"><span class="icon" aria-hidden="true">${icon}</span><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;

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
      <button class="profile-skin" type="button" data-act="profile-skin" aria-label="${t('skinPick')}">${withWings(`<img class="profile-pic${save.retro ? ' is-round' : ''}" src="${pic}" alt="" width="96" height="120">`)}<span class="profile-skin-tag" aria-hidden="true">👕</span></button>
      <div class="profile-who">${editingName ? '' : name}${crests()}<span>${t('lvShort', { level })}</span><i class="profile-xp" title="${t('profileXp')}"><b style="width:${Math.round(progress * 100)}%"></b></i></div>
    </div>
    ${editingName ? `<div class="profile-form">${name}<small class="how">${t('profileNameHint')}</small>${save.name !== DEFAULT_NAME ? `<button class="ghost small" type="button" data-act="name-reset">${t('profileReset')}</button>` : ''}</div>` : ''}
    ${note ? `<p class="saved" role="status">✓ ${note}</p>` : ''}
    <div class="pstats">
      ${stat('profileRuns', String(save.runs))}
      ${stat('profileTime', playTimeText(save.playTime || 0))}
      ${stat('profileWorlds', `${unlockedIn()}/${WORLD_COUNT}`)}
      ${stat('profileCoins', `🪙 ${Math.floor(save.coins)}`)}
    </div>
    ${friendsBlock()}
    <button class="primary ach-open" data-act="achievements">🏆 ${t('achTitle')} · ${achEarned(save)}/${achTotal()}</button>
    <h3 class="slot">${t('profileStars')}</h3>
    ${masteries()
      ? `<p class="mastery-line">${save.retro ? `<span style="color:${starColor()}">★</span>` : crest} ${t('masteryHave', { n: masteries() })}</p>`
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
  netSend(hello());
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
  showcaseBtn.hidden = true;
  hud.hidden = true;
  hudGear.hidden = true;
  closeGearPanel();
  bossBar.hidden = true;
  const won = g.phase === 'won';
  const earned = Math.floor(g.coins);
  const unlocked = bankRun(g);
  audio.play(won ? 'win' : 'over');
  const next = unlocked
    ? `${notice(save.retro ? WORLD_ICON[unlocked - 1] : `<img class="scene-pic" src="./images/game/map/pv-${ISLAND_ART[unlocked - 1]}.jpg" alt="">`, t('unlockedWorld', { n: unlocked }), worldName(unlocked))}
       <button class="primary" data-act="map">🗺️ ${t('toMap')}</button>
       <button class="primary" data-act="play-next" data-next="${unlocked}">▶ ${t('nextWorld')}</button>`
    : `<button class="primary" data-act="play-same">${t('again')}</button>`;
  const horde = g.mode === 'horde';
  const record = g.endless && save.nightmareBest?.time === g.time;
  const rushRecord = !!g.rush && save.rushBest?.time === g.time;
  show(`
    <p class="kicker">${g.secret ? `${t('secretName')} · ${MODE_ICON.horde} ${modeName('horde')}` : g.rush ? `${RUSH_ICON} ${t('rush')} · ${worldName(g.world)}` : `${worldName(g.world)} ·`} ${g.rush || g.secret ? '' : g.endless ? `${NIGHTMARE_ICON} ${t('nightmare')}` : horde ? `${MODE_ICON.horde} ${modeName('horde')}` : t('sprint', { room: g.room })}</p>
    ${head(won ? 'victory' : 'defeat', t(g.secret ? (won ? 'secretWon' : 'over') : g.rush ? (won ? 'rushWon' : 'over') : horde ? (won ? 'hordeWon' : 'over') : won ? 'won' : 'over'))}
    <p>${g.secret && won ? t('secretWonText', { kills: g.kills }) : g.rush ? t(won ? 'rushWonText' : 'rushOverText', { n: g.rush, total: g.stages, time: clock(g.time) }) : t(horde ? (won ? 'hordeWonText' : 'hordeOverText') : won ? 'wonText' : 'overText', { room: g.room, kills: g.kills, time: clock(g.time) })}</p>
    ${record ? notice(NIGHTMARE_ICON, t('nightmareRecord')) : ''}
    ${rushRecord ? notice(RUSH_ICON, t('rushRecord')) : ''}
    <p class="earned">${coinsLine(earned)} <small>${t('coinsRun', { coins: earned })}</small></p>
    ${earned > 0 && ads.enabled ? '<div class="ad-slot" data-ad-slot="doubleCoins"></div>' : ''}
    ${itemOpened ? notice(picIcon(itemById(itemOpened).icon, itemById(itemOpened).pic), t('itemNew', { name: t(`${itemOpened}Name` as Key) })) : ''}
    ${arsenalOpened ? notice(picIcon(EMOJI[arsenalOpened], `skills/${arsenalOpened}.webp`), t('arsenalNew', { name: t(`${arsenalOpened}Name` as Key) })) : ''}
    ${next}
    <div class="row">
      <button class="ghost is-warn" data-act="shop">🛒 ${t('shop')}</button>
      <button class="ghost" data-act="menu">${t('menu')}</button>
    </div>
    <p class="best">${g.secret ? secretLine() : g.rush ? rushLine() : g.endless ? nightmareLine() : bestLine(g.world, g.mode)}</p>`);
  adEarned = earned;
  if (earned > 0) offerAd('doubleCoins', `<button class="primary ad-btn" data-act="ad-double">📺 ${t('adDouble', { coins: earned })}</button>`);
}

/* The world map: floating islands (the owner's artwork, one per world) laid
   out two to a row down the screen, joined by a dashed light trail. Each
   island is a button; its ring, name plate and badges are drawn over the art
   so they can be translated and show the real lock state. */

const MAP_W = 941;
/** The islands zigzag down the map, left and right in turn, each `MAP_STEP` lower than the one before (so two
    neighbours never sit side by side), the map as tall as they need. */
const MAP_STEP = 205;
const MAP_SPOTS = WORLDS.length % 2 ? WORLDS.length + 1 : WORLDS.length;
const MAP_H = Math.round(150 + (MAP_SPOTS - 1) * MAP_STEP + 190);
const ISLAND_ART = ["original", "infierno", "vikingos", "lodo", "jungla", "rayo", "robots", "demonios", "nucleo"];
/** Per island art: its size, where the ring, plate and lower badge sit (percent of the art), and its scale. */
const ISLAND_META: Record<string, { w: number; h: number; ring: number[]; plate: number[]; badge: number[]; s?: number }> = {"original": {"w": 484, "h": 309, "ring": [49.3, 52.3], "plate": [28.9, 66.7, 39.9, 8.7], "badge": [48.9, 85.7]}, "infierno": {"w": 476, "h": 310, "ring": [49.8, 52.6], "plate": [29.4, 68.7, 40.8, 7.1], "badge": [49.8, 87.7]}, "vikingos": {"w": 477, "h": 313, "ring": [49.9, 50.8], "plate": [30.4, 66.1, 38.6, 7.0], "badge": [49.7, 85.1]}, "lodo": {"w": 445, "h": 318, "ring": [50.0, 34.2], "plate": [30.7, 50.0, 38.7, 12.3], "badge": [50.0, 69.0]}, "jungla": {"w": 490, "h": 333, "ring": [50.6, 49.5], "plate": [30.4, 63.1, 40.4, 7.5], "badge": [50.6, 82.1]}, "rayo": {"w": 504, "h": 335, "ring": [48.3, 43.4], "plate": [29.0, 59.7, 38.7, 8.1], "badge": [48.3, 78.7]}, "robots": {"w": 490, "h": 376, "ring": [51.0, 41.8], "plate": [31.0, 54.0, 40.4, 5.9], "badge": [51.2, 73.0]}, "demonios": {"w": 700, "h": 395, "ring": [50.4, 44.8], "plate": [35.2, 57.0, 30.9, 9.6], "badge": [50.6, 76.0], "s": 1.2}, "soon": {"w": 600, "h": 400, "ring": [49.9, 37.6], "plate": [30.2, 53.0, 39.8, 8.2], "badge": [50.0, 72.3]}, "nucleo": {"w": 502, "h": 378, "ring": [49.5, 42.5], "plate": [30.5, 54.5, 38.0, 6.3], "badge": [49.5, 73.5]}};

/** The world the map is showing (locked ones can be looked at, not played). */
let mapPick = 0;
/** Which of the map's play options the play button shows (the world, the Boss Rush, the showcase, Nightmare). */
let mapPlayIdx = 0;

/** The easter egg behind the «coming soon» island on call: a shift in the jungle where Kratos waits at five and ten. */
function secretScreen() {
  show(`<button class="ui-close" type="button" data-act="map" aria-label="${t('back')}"></button>
    ${head('shrine', t('secretTitle'))}
    <p>${t('secretText')}</p>
    <button class="play" data-act="play-secret"><span class="play-tri" aria-hidden="true"></span><span class="play-copy">${t('secretPlay')}</span></button>
    <button class="ghost small showcase-btn" data-act="play-secret-showcase">👁 ${t('showcaseKratos')}</button>
    <p class="best">${secretLine()}</p>
    ${backButton('map', 'toMap')}`);
}

function mapScreen() {
  endBoard();
  // (with a sprints mastery any island can be picked in sprints, to look at its bosses)
  if (!mapPick || (mapPick > unlockedIn() + 1 && !(save.mode === 'sprints' && masteries() > 0))) mapPick = worldIn();
  const picked = mapPick;
  const pickedOpen = picked <= unlockedIn();
  const islandW = 0.45 * MAP_W;
  // With an odd number of worlds a last island, «coming soon», fills the row so they go two by two.
  const stops = Array.from({ length: MAP_SPOTS }, (_, i) => {
    const n = i + 1;
    const soon = n > WORLDS.length;
    const m = ISLAND_META[soon ? 'soon' : ISLAND_ART[i]];
    // An island whose picture has a wide glow round it (`s`) is drawn bigger, so the island itself matches the rest.
    const w = islandW * (m.s ?? 1);
    const h = (w * m.h) / m.w;
    const cx = (i % 2 ? 0.735 : 0.265) * MAP_W;
    const cy = 150 + i * MAP_STEP;
    const left = cx - (m.ring[0] / 100) * w;
    const top = cy - (m.ring[1] / 100) * h;
    return { n, m, w, h, left, top, cx, cy, open: n <= unlockedIn(), soon };
  });
  const trail = stops.slice(0, -1).map((a, i) => {
    const b = stops[i + 1];
    const mx = (a.cx + b.cx) / 2;
    return `<path class="trail${b.open ? '' : ' is-locked'}${b.soon ? ' is-soon' : ''}" d="M ${a.cx} ${a.cy} Q ${mx} ${a.cy + (b.cy - a.cy) * 0.15} ${b.cx} ${b.cy}"/>`;
  }).join('');
  const islands = stops.map((st) => {
    if (st.soon) {
      const style = `left:${(st.left / MAP_W) * 100}%;top:${(st.top / MAP_H) * 100}%;width:${(st.w / MAP_W) * 100}%;--px:${st.m.plate[0]}%;--py:${st.m.plate[1]}%;--pw:${st.m.plate[2]}%;--ph:${st.m.plate[3]}%`;
      // The easter egg: on call the «coming soon» island can be tapped, and something waits there (`secretScreen`).
      const secret = save.mode === 'horde';
      return [secret ? `
      <button class="isle is-soon is-secret" data-act="secret" style="${style}" aria-label="${t('comingSoon')}"><img src="./images/game/map/soon.webp" alt="" width="${st.m.w}" height="${st.m.h}"></button>` : `
      <span class="isle is-soon" style="${style}"><img src="./images/game/map/soon.webp" alt="" width="${st.m.w}" height="${st.m.h}"></span>`, `
      <span class="isle isle-labels is-soon" style="${style};aspect-ratio:${st.m.w}/${st.m.h}" aria-hidden="true">
        <span class="isle-plate">${t('comingSoon')}</span>
      </span>`];
    }
    // The badge always shows (the art has a padlock painted there): locked, cleared, how far you got
    // (the sprint, or the longest shift on call) or ▶ for a world not tried yet.
    const best = save.bestByWorld[st.n];
    const shift = save.hordeBest[st.n];
    const plan = save.boardBest[st.n];
    const horde = save.mode === 'horde';
    const boardMode = save.mode === 'board';
    const done = boardMode ? !!plan?.won : horde ? !!shift?.won : best?.time !== undefined;
    const tried = boardMode ? plan ? `${plan.round}/${ROUNDS}` : '' : horde ? shift ? clock(shift.time) : '' : best?.room ? `${best.room}/${ROOMS}` : '';
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
  const modes = MODES.map((m) =>
    `<button class="mode-opt${save.mode === m ? ' is-on' : ''}" data-mode="${m}" aria-pressed="${save.mode === m}" title="${modeText(m)}">${MODE_ICON[m]} ${modeName(m)}</button>`).join('');
  const status = pickedOpen
    ? `<small class="map-record">▮▮▮ ${bestLine(picked) || t('bestNone')}</small>`
    : `<small class="map-locked">🔒 ${t('lockedUntil', { n: picked - 1 })}</small>`;
  const mastery = masteryReady()
    ? `<button class="primary mastery-btn" data-act="mastery-ask">${t('masteryBtn')}</button>`
    : '';
  // One play button under the card; its arrows (or a swipe) turn it to the mode's other runs: in sprints the
  // Boss Rush and the showcase once world 1 is won there, on call Nightmare (locked until world 9 is open there).
  // The board: its two ways to play are the play button's two options, Fusion (green) and Tactics (gold).
  const opts: { act: string; label: string; cls: string; locked?: boolean }[] = !pickedOpen
    ? [{ act: '', label: t('lockedBtn'), cls: 'is-locked', locked: true }]
    : save.mode === 'board'
      ? [{ act: 'play-board-fusion', label: `🧬 ${t('boardFusion')} · ${t('worldShort', { n: picked })}`, cls: '' }, { act: 'play-board-tactics', label: `⭐ ${t('boardTactics')} · ${t('worldShort', { n: picked })}`, cls: 'is-rush' }]
      : [{ act: 'play-picked', label: t('playWorld', { n: picked }), cls: '' }];
  if (pickedOpen && save.mode === 'sprints' && save.unlocked >= 2) opts.push({ act: 'play-rush', label: `${RUSH_ICON} ${t('rush')}`, cls: 'is-rush' });
  // A locked world has only its grey locked button: no Boss Rush, no showcase. The showcase shows an open world's own two bosses.
  if (pickedOpen && save.mode === 'sprints') opts.push({ act: 'play-showcase', label: `👁 ${t('showcaseShort')}`, cls: 'is-showcase' });
  if (pickedOpen && save.mode === 'horde') opts.push(save.hordeUnlocked >= NIGHTMARE_WORLD
    ? { act: 'play-nightmare', label: `${NIGHTMARE_ICON} ${t('nightmare')} ∞`, cls: 'is-nightmare' }
    : { act: '', label: `🔒 ${t('nightmare')} ∞`, cls: 'is-nightmare is-dim', locked: true });
  mapPlayIdx = Math.min(mapPlayIdx, opts.length - 1);
  // The board's button opens on the way it was last played.
  if (save.mode === 'board' && pickedOpen && !mapBoardShown) { mapPlayIdx = save.boardVariant === 'tactics' ? 1 : 0; mapBoardShown = true; }
  const opt = opts[mapPlayIdx];
  const many = opts.length > 1;
  const action = `<div class="play-pick${many ? ' has-more' : ''}">
      <button class="play ${opt.cls}"${opt.act ? ` data-act="${opt.act}"` : ' disabled'}>${opt.locked && !opt.cls.includes('is-dim') ? '<span class="play-lock" aria-hidden="true">🔒</span>' : opt.act === 'play-picked' || opt.act === 'play-board-fusion' ? '<span class="play-tri" aria-hidden="true"></span>' : ''}<span class="play-copy">${opt.label}</span></button>
      ${many ? `<button class="play-arrow is-prev" type="button" data-act="play-prev" aria-label="${t('playPrev')}"></button><button class="play-arrow is-next" type="button" data-act="play-next-opt" aria-label="${t('playNextOpt')}"></button>
      <span class="play-dots" aria-hidden="true">${opts.map((_, i) => `<i${i === mapPlayIdx ? ' class="is-on"' : ''}></i>`).join('')}</span>` : ''}
    </div>`;
  // Only the islands scroll; the title, the world's card and the play button stay put. Picking an island
  // re-renders the screen, so the islands keep their scroll.
  const kept = screen.querySelector<HTMLElement>('.map-scroll')?.scrollTop;
  show(`
    <button class="ui-close" type="button" data-act="menu" aria-label="${t('menu')}"></button>
    <div class="mapscreen">
      <h2 class="map-title"><span>${t('map')}</span></h2>
      <div class="map-scroll fade-scroll">
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
          <small class="mode-text">${modeText()}</small>
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
      const fresh = CATEGORY[id] !== 'upgrade' && g.skills[id] === 0;
      // The first blade card always introduces plain steel; later upgrades follow the run's current element.
      const el = id === 'blades' && fresh ? 'steel' : id === 'blades' ? bladeElement(g) : 'steel';
      const name = el === 'steel' ? t(`${id}Name` as Key) : t(`blades${el[0].toUpperCase()}${el.slice(1)}Name` as Key);
      const next = g.skills[id] + 1;
      const text = id === 'blades' && next >= 4 ? t(next >= 5 ? 'bladesGrow5' : 'bladesGrow4')
        : el !== 'steel' ? t(`blades${cap(el)}Text` as Key) : id === 'blades' ? `${t('bladesText')} ${t('bladesHint')}` : t(`${id}Text` as Key);

      const cat = CATEGORY[id];
      const level = id === 'heart' ? '' : `<span class="lvl">${fresh ? t('newWeapon') : t('skillLevel', { level: g.skills[id] + 1 })}</span>`;
      // A second arrow element says which fusion it makes (and that the other two stop coming).
      const fz = fusionWith(g, id);
      // …and warns when that pair shuts out the evolution of a weapon you carry (then the fusion line is cut short to fit).
      const lost = evoLostBy(g, id);
      const fuse = fz ? `<em class="fuse">${t(lost.length ? 'fusionCardShort' : 'fusionCard', { fusion: fusionLine(g, fz, id) })}</em>` : '';
      const warn = lost.length ? `<em class="evo-lost">⚠ ${t(lost.length > 1 ? 'evoLostMany' : 'evoLost', { names: new Intl.ListFormat(lang, { type: 'conjunction' }).format(lost.map((w) => t(`${w}Name` as Key))) })}</em>` : '';
      const icon = id === 'blades' && fresh ? 'blades' : iconFile(g, id, next);
      return `<button class="skill skill-${cat}" data-skill="${id}"><span class="icon" aria-hidden="true">${skillIcon(id, 56, icon)}</span><span class="cat">${t(CATEGORY_LABEL[cat])}</span><b>${name}</b><span>${text}${fuse}${warn}</span>${level}</button>`;
    })
    .join('');
  // Two rerolls a run, in sprints and on call.
  const reroll = `<button class="ghost small reroll" data-act="reroll"${g.rerolls > 0 ? '' : ' disabled'}>🎲 ${t('reroll', { n: g.rerolls })}</button>`;
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
const head = (kind: 'pause' | 'levelup' | 'victory' | 'defeat' | 'shrine' | 'wings', text: string, friendKey?: Key) =>
  `<div class="ui-head is-${kind}"><img src="./images/game/ui/header_${kind}.webp" width="${HEAD_SIZE[kind][0]}" height="${HEAD_SIZE[kind][1]}" alt=""><span${friendKey ? ` data-friend-name data-friend-key="${friendKey}"` : ''}>${text}</span></div>`;

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
    <button class="mute-toggle" type="button" data-act="mute" aria-pressed="${muted}"><span class="toggle-art${muted ? ' is-off' : ''}" aria-hidden="true"></span><span>${muted ? t('unmute') : t('mute')}</span></button>
    <button class="mute-toggle" type="button" data-act="retro" aria-pressed="${save.retro}"><span class="toggle-art${save.retro ? '' : ' is-off'}" aria-hidden="true"></span><span>${t('retro')}</span></button>
    <p class="how">${t('retroNote')}</p>
    <div class="lang-row"><span>🌐 ${t('language')}</span>
      <div class="mode-pick lang-pick" role="group" aria-label="${t('language')}">${(['es', 'en'] as Lang[]).map((l) => `<button type="button" class="mode-opt${l === lang ? ' is-on' : ''}" data-act="lang" data-lang="${l}" aria-pressed="${l === lang}">${l === 'es' ? 'Español' : 'English'}</button>`).join('')}</div>
    </div>
    <nav class="privacy-links" aria-label="${lang === 'es' ? 'Privacidad y aspectos legales' : 'Privacy and legal'}">
      <button class="ghost small" type="button" data-act="privacy-settings">${lang === 'es' ? 'Preferencias de privacidad' : 'Privacy settings'}</button>
      <div><a href="/privacy.html">${lang === 'es' ? 'Privacidad' : 'Privacy'}</a><a href="/cookies.html">Cookies</a><a href="/legal.html">${lang === 'es' ? 'Aviso legal' : 'Legal notice'}</a></div>
    </nav>
    <button class="primary is-blue" data-act="${optionsFrom === 'pause' ? 'pause' : 'menu'}">← ${t(optionsFrom === 'pause' ? 'resume' : 'menu')}</button>`);
}

/* The guide: the book on the cover, which replaced the painted gear (Options has its own card). Its first page
   picks the way to play, three bars in the modes' colours (green sprints, blue on call, red board); the next pages
   say how each one plays, each with a picture of it in world 1 (`book/<mode>.webp`), and how to get stronger. The first visit dims the cover round the book until it is opened
   (`save.bookSeen`). */
let bookPage = 0;
const BOOK = ['modes', 'sprints', 'horde', 'fusion', 'tactics', 'map', 'shop', 'custom', 'grow'] as const;
/** The guide's pictures with words in them have an English copy (`<name>-en.webp`). */
const BOOK_EN = new Set(['fusion', 'tactics', 'tactics-bonus', 'map', 'shop', 'custom']);
const bookPic = (name: string) => (lang === 'en' && BOOK_EN.has(name) ? `${name}-en` : name);
const bookList = (keys: Key[]) => `<ul class="book-list">${keys.map((k) => `<li>${t(k)}</li>`).join('')}</ul>`;
function bookScreen() {
  bookPage = Math.max(0, Math.min(BOOK.length - 1, bookPage));
  const page = BOOK[bookPage];
  const title = { modes: 'bookModesTitle', sprints: 'bookSprintsTitle', horde: 'bookHordeTitle', fusion: 'bookFusionTitle', tactics: 'bookTacticsTitle', map: 'bookMapTitle', shop: 'bookShopTitle', custom: 'bookCustomTitle', grow: 'bookGrowTitle' }[page] as Key;
  const text = { modes: 'bookModesText', sprints: 'bookSprintsText', horde: 'bookHordeText', fusion: 'bookFusionText', tactics: 'bookTacticsText', map: 'bookMapText', shop: 'bookShopText', custom: 'bookCustomText', grow: 'bookGrowText' }[page] as Key;
  const modes = page === 'modes'
    // The cover's own play bar, to learn it here: swiped or turned by its arrows, with a finger showing how.
    ? `<div class="book-play">
        <div class="book-play-bar is-${save.mode}"><b>${MODE_ICON[save.mode]} ${modeName(save.mode)}</b><small>${t(save.mode === 'board' ? 'bookModeBoard' : save.mode === 'horde' ? 'bookModeHorde' : 'bookModeSprints')}</small></div>
        <button class="book-arrow is-prev" type="button" data-act="book-mode-prev" aria-label="${t('modeSwipe')}"></button>
        <button class="book-arrow is-next" type="button" data-act="book-mode-next" aria-label="${t('modeSwipe')}"></button>
        <span class="book-hand" aria-hidden="true">👆</span>
      </div>
      <span class="book-dots" aria-hidden="true">${MODES.map((m) => `<i class="is-${m}${save.mode === m ? ' is-on' : ''}"></i>`).join('')}</span>
      <p class="book-swipe">⬅️ ${t('bookSwipeHint')} ➡️</p>`
    : '';
  const last = bookPage === BOOK.length - 1;
  show(`<button class="ui-close" type="button" data-act="menu" aria-label="${t('back')}"></button>
    <h2>📖 ${t(title)}</h2>
    ${page === 'sprints' || page === 'horde' || page === 'fusion' || page === 'tactics' || page === 'map' || page === 'shop' || page === 'custom' ? `<img class="book-shot is-${page}" src="./images/game/book/${bookPic(page)}.webp" alt="${t(title)}">` : ''}
    <p class="book-text">${t(text)}</p>
    ${page === 'fusion' ? bookList(['bookFusionSummon', 'bookFusionMerge', 'bookBoardFight']) : ''}
    ${page === 'tactics' ? `${bookList(['bookTacticsShop', 'bookTacticsStars', 'bookTacticsBench', 'bookTacticsPower'])}<img class="book-shot is-tactics-bonus" src="./images/game/book/${bookPic('tactics-bonus')}.webp" alt="${t('boardBonusTitle')}">${bookList(['bookTacticsAbility', 'bookTacticsMix', 'bookBoardFight'])}` : ''}
    ${page === 'map' ? bookList(['bookMapIslands', 'bookMapModes', 'bookMapPlay']) : ''}
    ${page === 'shop' ? bookList(['bookShopCoins', 'bookShopForge', 'bookShopGear', 'bookShopArsenal', 'bookShopSpirits']) : ''}
    ${page === 'custom' ? bookList(['bookCustomSlots', 'bookCustomButtons', 'bookCustomShop']) : ''}
    ${modes}
    <small class="book-page">${t('bookPage', { n: bookPage + 1, total: BOOK.length })} · ${t('bookPageSwipe')}</small>
    ${last ? `<button class="primary" data-act="menu">${t('bookDone')}</button>` : `<button class="primary" data-act="book-next">${t('bookNext')} →</button>`}
    ${bookPage ? `<button class="ghost" data-act="book-prev">← ${t('bookPrev')}</button>` : ''}`);
}

/** Which shop sections are unfolded (kept while the shop re-renders after a purchase). */
const shopOpen = new Set<string>();
/** A foldable shop section: one of the owner's ring-and-plate rows (orange while open) with its icon and a count, and its cards only when open. */
const SHOP_SEC_ICON: Record<string, [string, string]> = {
  forge: ['⚒️', 'forge/might.webp'], arsenal: ['🚀', 'skills/rocket.webp'],
  armour: ['🛡️', 'slots/body.webp'], weapons: ['🗡️', 'slots/melee.webp'], spirits: ['👻', 'spirits/water-float-0.webp'],
};
/** The shop opened at one slot's items (from Customise's «Ir a la tienda»): its section unfolded and its heading at
    the top of the dialog. */
function shopAt(slot: Slot) {
  shopOpen.clear();
  shopOpen.add((ARMOUR_SLOTS as readonly Slot[]).includes(slot) ? 'armour' : 'weapons');
  shopOpen.add(`slot:${slot}`);
  shopScreen();
  scrollShopTo(`slot:${slot}`);
}
/** Brings a shop section's row to the top of the dialog, once it has been fitted. */
function scrollShopTo(key: string) {
  const go = () => {
    const box = screen.querySelector<HTMLElement>('.panel-in');
    const head = screen.querySelector<HTMLElement>(`[data-shop-sec="${key}"]`);
    if (!box || !head) return;
    box.scrollTop = head.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 8;
    // `fitPanel()` puts the kept scroll back each time a picture loads (the one Customise had, at first): keep this one.
    box.dataset.scroll = String(box.scrollTop);
  };
  requestAnimationFrame(() => requestAnimationFrame(go));
}
/** Each slot's mark for the retro look (its painted ring otherwise). */
const SLOT_EMOJI: Record<Slot, string> = { head: '🪖', body: '🛡️', boots: '🥾', magic: '🔮', melee: '🗡️', ranged: '🏹' };
function shopSection(key: string, title: string, count: string, body: string, icon?: [string, string]) {
  const open = shopOpen.has(key);
  const [emoji, pic] = icon ?? SHOP_SEC_ICON[key] ?? ['🛒', ''];
  return `<button type="button" class="gear-row shop-sec${key.startsWith('slot:') ? ' is-sub' : ''}${open ? ' is-on' : ''}" data-shop-sec="${key}" aria-expanded="${open}">
      <span class="icon" aria-hidden="true">${picIcon(emoji, pic || undefined)}</span><b>${title}</b><em>${count} ${open ? '▴' : '▾'}</em>
    </button>${open ? body : ''}`;
}

/* Items with levels: pips and an upgrade button like the forge's, in the shop and in Customise. What the
   Phoenix cloak's next level gives is not shown (the owner wants it to be a surprise); the weapon slots' items
   say what they give now, the level their weapon starts at or their bonus (`buildLoadout` in shop.ts). */
function levelNote(id: ItemId, lv: number) {
  const item = itemById(id);
  if (!WEAPON_SLOTS.includes(item.slot)) return '';
  const { effect } = item;
  if (effect.startSkills?.length) return `<small class="lv-note">${t('itemStartsAt', { level: lv })}</small>`;
  const base = effect.mult ? Math.max(...Object.values(effect.mult)) : effect.xpMult ?? effect.hasteMult ?? 1;
  const pct = Math.round((base - 1) * (1 + 0.5 * (lv - 1)) * 100);
  return pct ? `<small class="lv-note">${t('itemBonusAt', { pct })}</small>` : '';
}
function levelBlock(item: { id: ItemId; levels?: number[] }) {
  if (!item.levels || !save.owned.includes(item.id)) return '';
  const lv = itemLevel(save.itemLevels, item.id);
  const max = 1 + item.levels.length;
  const pips = Array.from({ length: max }, (_, i) => `<i class="${i < lv ? 'is-on' : ''}"></i>`).join('');
  const price = lv < max ? item.levels[lv - 1] : 0;
  const up = price
    ? `<button class="buy${save.coins >= price ? '' : ' is-poor'}" data-item-up="${item.id}">${t('upgradeBtn', { price })}</button>`
    : `<button class="buy is-worn" disabled>✓ ${t('upgradeMax')}</button>`;
  return `<span class="pips" aria-label="${t('upgradeLevel', { level: lv, max })}">${pips}</span>${levelNote(item.id, lv)}${up}`;
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
          ? `<button class="buy is-poor" disabled>🔒 ${lockText(item)}</button>`
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
  /** A section holding several slots, each one more foldable row of its own (its items only once it is open), or
      for a single group its items straight away. */
  const merged = (key: string, title: string, parts: Group[], headed = true) => shopSection(key, title,
    `${parts.reduce((n, x) => n + x.owned, 0)}/${parts.reduce((n, x) => n + x.total, 0)}`,
    parts.filter((x) => x.total).map((x) => headed
      ? shopSection(`slot:${x.slot}`, t(SLOT_LABEL[x.slot]), `${x.owned}/${x.total}`, `<div class="items">${x.cards}</div>`, [SLOT_EMOJI[x.slot], `slots/${x.slot}.webp`])
      : `<div class="items">${x.cards}</div>`).join(''));
  // Armour (head, body, boots), Weapons (magic, melee, ranged) and the Spirits on their own.
  const armourSec = merged('armour', t('shopArmour'), ARMOUR_SLOTS.map((slot) => group(slot, () => true)));
  const weaponSecs = merged('weapons', t('shopWeapons'), WEAPON_SLOTS.map((slot) => group(slot, (id) => !isSpirit(id))));
  const spiritSec = merged('spirits', t('shopSpirits'), [group('magic', isSpirit)], false);
  // The forge: permanent, levelled upgrades.
  // The extra charm, sold in the forge too: one more item of any kind, worn from Customise.
  const extraCard = `<div class="item forge-item${save.extraSlot ? ' is-on' : save.coins < EXTRA_SLOT_PRICE ? ' is-locked' : ''}">
      <span class="icon" aria-hidden="true">✚</span>
      <b>${t('extraSlot')}</b>
      <span>${t('extraText')}</span>
      ${save.extraSlot ? `<button class="buy is-worn" disabled>✓ ${t('extraOwned')}</button>` : `<button class="buy${save.coins >= EXTRA_SLOT_PRICE ? '' : ' is-poor'}" data-extra-buy>${t('buy')} · 🪙 ${EXTRA_SLOT_PRICE}</button>`}
    </div>`;
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
  // Skins: a shop window, the dearest things in the game; bought here and worn from here or from Customise.
  // alvrich's world outfits are not sold (each comes with a sprints world): shown with their lock, worn once won.
  const skinCard = (skin: HeroSkin) => {
    const owned = ownsSkin(save, skin);
    const worn = save.skin === skin;
    const open = skinOpen(save, skin);
    const price = skinPrice(skin);
    const gate = SKIN_GATE[skin];
    const lock = !gate ? '' : 'world' in gate ? t('skinLockWorld', { n: gate.world }) : 'boss' in gate ? t('skinLockBoss', { n: gate.boss }) : t('skinLockSecret');
    const can = save.coins >= price;
    const action = owned
      ? worn ? `<button class="buy is-worn" disabled>✓ ${t('worn')}</button>` : `<button class="buy" data-skin-wear="${skin}">${t('equip')}</button>`
      : !open ? `<button class="buy is-poor" disabled>🔒 ${lock}</button>`
      : `<button class="buy${can ? '' : ' is-poor'}" data-skin-buy="${skin}">${t('buy')} · 🪙 ${price}</button>`;
    return `<div class="item skin-item${worn ? ' is-on' : ''}${owned ? ' is-owned' : ''}${!owned && (!can || !open) ? ' is-locked' : ''}">
      <span class="icon" aria-hidden="true"><img class="skin-pic" src="./images/game/hero/${heroStill(skin)}.webp" alt=""></span>
      <b>${t(`skin${cap(skin)}Name` as Key)}</b>
      <span>${t(`skin${cap(skin)}Text` as Key)}</span>
      ${action}
    </div>`;
  };
  // The owner's three groups, as in Customise.
  const skinGroup = (key: Key, list: HeroSkin[]) => `<h4 class="skin-group">${t(key)}</h4><div class="items skin-items">${list.map(skinCard).join('')}</div>`;
  const skinCards = skinGroup('skinGroupWorld', SKIN_GROUPS.world) + skinGroup('skinGroupSpecial', SKIN_GROUPS.special) + skinGroup('skinGroupBoss', SKIN_GROUPS.boss);
  const skinSec = shopSection('skins', t('shopSkins'), `${save.skins.length}/${SKINS.length}`, `<p class="how">${t('shopSkinsHint')}</p>${skinCards}`, ['🧑', `hero/${heroStill(save.skin)}.webp`]);
  show(`
    <button class="ui-close" type="button" data-act="menu" aria-label="${t('back')}"></button>
    <p class="wallet shop-wallet">${coinsLine()} <button class="wallet-plus" type="button" data-act="coin-store" aria-label="${t('storeTitle')}">+</button></p>
    <div class="shop-head shop-title"><h2>${t('shop')}</h2></div>
    ${note ? `<p class="note">${note}</p>` : `<p class="how">${t('earnHint')}</p>`}
    ${giftLine}
    ${skinSec}
    ${shopSection('forge', t('forge'), `${UPGRADES.reduce((n, u) => n + (save.upgrades[u.id] ?? 0), 0)}/${UPGRADES.reduce((n, u) => n + u.max, 0)}`, `<p class="how">${t('forgeHint')}</p><div class="items">${forge}${extraCard}</div>`)}
    ${armourSec}${weaponSecs}
    ${shopSection('arsenal', t('arsenal'), `${save.arsenal.length}/${ARSENAL.length}`, `<p class="how">${t('arsenalHint')}</p><div class="items">${arsenal}</div>`)}
    ${spiritSec}
    <button class="primary is-blue" type="button" data-act="menu">← ${t('menu')}</button>`, true, false, 'keep-scroll');
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
/** The Phoenix cloak at ★3 is worn: its wings show behind the hero in Customise and the profile too (not in retro). */
/** Only one companion floats by you, so the extra charm never holds a second spirit item. */
const isSpirit = (id?: ItemId) => !!id && !!itemById(id).effect.spirit;
const spiritClash = (id: ItemId) => isSpirit(id) && isSpirit(save.equipped.magic);
/** After wearing a spirit item in its own slot, a spirit in the charm comes off. */
const dropExtraClash = () => { if (save.extra && spiritClash(save.extra)) delete save.extra; };
dropExtraClash(); // a save from before the rule
const wingsOn = () => !save.retro && (save.equipped.body === 'phoenix' || save.extra === 'phoenix') && itemLevel(save.itemLevels, 'phoenix') >= 3;
/** The hero picture with the worn wings behind it, flapping (`.wing-host` in game.css). */
const withWings = (img: string) => wingsOn() ? `<span class="wing-host"><span class="wing-box" aria-hidden="true"><img class="hero-wings" src="./images/game/fx/wings-1.webp" alt=""></span>${img}</span>` : img;
const heroPic = () => `./images/game/hero/${heroStill(save.skin, save.equipped.head)}.webp`;
/** What the list under the hero shows: a slot's items, the skins or the enemy looks. */
let dressSlot: Slot | 'skin' | 'foes' | 'scene' | 'song' | 'extra' | null = null;
/** The worlds' songs in Customise, in world order: the world, its versions (only the first world kept two) and
    its strings' key (`<key>Name`, `<key>V2`). The ids stay as they were before the mud world came in as world 4. */
const WORLD_SONGS: [number, readonly SongPick[], string][] = [
  [1, ['w1', 'w1v2'], 'songW1'], [2, ['w2v2'], 'songW2'], [3, ['w3v2'], 'songW3'], [4, ['mudv2'], 'songMud'], [5, ['w4v2'], 'songW4'],
  [6, ['w5v2'], 'songW5'], [7, ['w6v2'], 'songW6'], [8, ['w7v2'], 'songW7'], [9, ['w8v2'], 'songW8'],
];
/** Customise's music list plays what it lists: the music starts (and comes up from silence) the moment it is opened or a song is picked. */
function playMusicNow() {
  audio.unlock();
  if (save.music <= 0) { save.music = 0.6; audio.setVolumes(save.music, save.sfx); persist(); }
  audio.start();
}

function stylesScreen(note = '') {
  // The menus play the original; the music list plays what is picked in it.
  audio.setPreview(dressSlot === 'song');
  const slotButton = (slot: Slot) => {
    const id = save.equipped[slot];
    const item = id ? itemById(id) : null;
    const open = dressSlot === slot;
    return `<button class="dslot${item ? ' is-worn' : ''}${open ? ' is-open' : ''}" data-slot="${slot}" aria-pressed="${open}">
      <span class="ring" aria-hidden="true"><span class="icon${item ? '' : ' is-empty'}">${item ? picIcon(item.icon, item.pic) : picIcon(SLOT_ICON[slot], `slots/${slot}.webp`)}</span></span>
      <span class="plate"><small>${t(SLOT_LABEL[slot])}</small><b>${item ? t(`${item.id}Name` as Key) : '—'}</b></span>
    </button>`;
  };
  // The extra charm: one more item of any kind, under the hero (bought here or in the shop's forge).
  const extraItem = save.extra ? itemById(save.extra) : null;
  const extraButton = `<button class="dslot is-extra${extraItem ? ' is-worn' : ''}${dressSlot === 'extra' ? ' is-open' : ''}" data-slot="extra" aria-pressed="${dressSlot === 'extra'}">
      <span class="ring" aria-hidden="true"><span class="icon${extraItem ? '' : ' is-empty'}">${extraItem ? picIcon(extraItem.icon, extraItem.pic) : save.extraSlot ? '✚' : '🔒'}</span></span>
      <span class="plate"><small>${t('extraShort')}</small><b>${extraItem ? t(`${extraItem.id}Name` as Key) : save.extraSlot ? '—' : `🪙 ${EXTRA_SLOT_PRICE}`}</b></span>
    </button>`;
  const hero = save.retro
    ? `<canvas class="hero-fig" width="180" height="200" aria-hidden="true"></canvas>`
    : withWings(`<img class="hero-fig" src="${heroPic()}" alt="" width="128" height="160">`);
  const row = (attr: string, on: boolean, locked: boolean, icon: string, name: string, text: string, state: string) =>
    `<button class="gear-row${on ? ' is-on' : ''}${locked ? ' is-locked' : ''}" ${attr} aria-pressed="${on}">
      <span class="icon" aria-hidden="true">${icon}</span><b>${name}</b><span>${text}</span>${state ? `<em>${state}</em>` : ''}
    </button>`;
  let picks = `<p class="how">${t('dressHint')}</p>`;
  if (dressSlot === 'skin') {
    const skinRow = (skin: HeroSkin) => {
      const owned = ownsSkin(save, skin);
      const worn = save.skin === skin;
      const open = skinOpen(save, skin);
      const gate = SKIN_GATE[skin];
      const lock = !gate ? '' : 'world' in gate ? t('skinLockWorld', { n: gate.world }) : 'boss' in gate ? t('skinLockBoss', { n: gate.boss }) : t('skinLockSecret');
      if (!open) return row(`data-skin="${skin}"`, false, true, `<img class="skin-pic" src="./images/game/hero/${heroStill(skin)}.webp" alt="">`, t(`skin${cap(skin)}Name` as Key), t(`skin${cap(skin)}Text` as Key), `🔒 ${lock}`);
      return row(`data-skin="${skin}"`, worn, !owned && save.coins < skinPrice(skin), `<img class="skin-pic" src="./images/game/hero/${heroStill(skin, save.equipped.head)}.webp" alt="">`, t(`skin${cap(skin)}Name` as Key), t(`skin${cap(skin)}Text` as Key), worn ? `✓ ${t('worn')}` : owned ? t('equip') : `${t('buy')} 🪙 ${skinPrice(skin)}`);
    };
    // Alvrich's world outfits fold away under one row (open while one of them is worn).
    const world = (WORLD_SKINS as readonly HeroSkin[]);
    const worldOwned = world.filter((k) => ownsSkin(save, k)).length;
    // In the owner's three groups: world (alvrich and his outfits), specials, bosses.
    picks = `<h3 class="slot">${t('skinPick')}</h3>${note ? `<p class="note">${note}</p>` : ''}
      <h4 class="skin-group">${t('skinGroupWorld')}</h4><div class="gear-list">${skinRow('boy')}
      <details class="skin-fold"${world.includes(save.skin) ? ' open' : ''}><summary><img class="skin-pic" src="./images/game/hero/${heroStill(world.includes(save.skin) ? save.skin : 'intern')}.webp" alt=""><b>${t('skinWorlds')}</b><em>${worldOwned}/${world.length}</em></summary>
        <div class="gear-list">${world.map(skinRow).join('')}</div></details></div>
      <h4 class="skin-group">${t('skinGroupSpecial')}</h4><div class="gear-list">${SKIN_GROUPS.special.map(skinRow).join('')}</div>
      <h4 class="skin-group">${t('skinGroupBoss')}</h4><div class="gear-list">${SKIN_GROUPS.boss.map(skinRow).join('')}</div>`;
  } else if (dressSlot === 'foes') {
    picks = `<h3 class="slot">${t('stylePick')}</h3><div class="gear-list">${STYLES.map((style) =>
      row(`data-style="${style}"`, save.style === style, false, styleIcon(style), t(`style${cap(style)}Name` as Key), t(`style${cap(style)}Text` as Key), save.style === style ? '✓' : '')).join('')}</div>`;
  } else if (dressSlot === 'song') {
    const songRow = (id: typeof save.song, icon: string, name: string, text: string) => row(`data-song="${id}"`, save.song === id, false, icon, name, text, save.song === id ? '✓' : '');
    picks = `<h3 class="slot">${t('songPick')}</h3><div class="gear-list">${(['auto', 'worlds', 'b2b', 'breaks', 'doom'] as const).map((id) =>
      // The owner's medallions: headphones for automatic, the world on a record for «by world», a vinyl for the
      // original, Nocthrax on a record for the final boss's own song.
      songRow(id, save.retro ? (id === 'auto' ? '🎚️' : id === 'worlds' ? '🗺️' : id === 'b2b' ? '🎧' : id === 'breaks' ? '🥁' : '🔥')
        : `<img class="scene-pic" src="./images/game/music/${id}.webp" alt="">`,
        t(`song${cap(id)}Name` as Key), t(`song${cap(id)}Text` as Key))).join('')}</div>
      <h3 class="slot">${t('songWorlds')}</h3><div class="gear-list">${WORLD_SONGS.map(([world, ids, key]) => {
        // The first world's song has two versions: picking the row plays the one last picked (v1 at first) and opens a switch between them.
        const on = (ids as readonly string[]).includes(save.song);
        const v2 = on && save.song.endsWith('v2');
        // The world's preview, like the map's card.
        const pic = `<img class="scene-pic" src="./images/game/map/pv-${ISLAND_ART[world - 1]}.jpg" alt="">`;
        if (ids.length === 1) return songRow(ids[0], pic, t(`${key}Name` as Key), t(`${key}V2` as Key));
        const ver = (id: typeof save.song, label: string) => `<button class="mode-opt${save.song === id ? ' is-on' : ''}" data-song="${id}" aria-pressed="${save.song === id}">${label}</button>`;
        return row(`data-song="${on ? save.song : ids[0]}"`, on, false, pic, t(`${key}Name` as Key),
          v2 ? t(`${key}V2` as Key) : t('songWorldText', { world: t(`world${world}Name` as Key) }), on ? `✓ ${v2 ? 'v2' : 'v1'}` : '')
          + (on ? `<div class="mode-pick song-ver" role="group" aria-label="${t('songVersion')}">${ver(ids[0], 'v1')}${ver(ids[1], 'v2')}</div>` : '');
      }).join('')}</div>
      <h3 class="slot">${t('songBosses')}</h3><div class="gear-list">${BOSS_SONGS.map((id, i) =>
        songRow(`boss-${id}`, `<img class="scene-pic boss-pic" src="./images/game/bosses/${id}-0.webp" alt="">`, t(`final${cap(id)}` as Key), t('songBossText', { world: t(`world${i + 1}Name` as Key) }))).join('')}</div>`;
  } else if (dressSlot === 'extra') {
    // Any owned item not already worn in its own slot; or, until bought, the charm itself.
    const worn = Object.values(save.equipped);
    picks = !save.extraSlot
      ? `<h3 class="slot">${t('extraSlot')}</h3>${note ? `<p class="note">${note}</p>` : ''}<p class="how">${t('extraText')}</p>
        <button class="buy${save.coins >= EXTRA_SLOT_PRICE ? '' : ' is-poor'}" data-extra-buy>${t('buy')} · 🪙 ${EXTRA_SLOT_PRICE}</button>`
      : `<h3 class="slot">${t('extraPick')}</h3>${note ? `<p class="note">${note}</p>` : ''}<p class="how">${t('extraText')}</p>
        <div class="gear-list">${ITEMS.filter((item) => save.owned.includes(item.id) && !worn.includes(item.id) && !spiritClash(item.id)).map((item) =>
          row(`data-extra="${item.id}"`, save.extra === item.id, false, picIcon(item.icon, item.pic), item.legendary ? `<span class="legend-name">${t(`${item.id}Name` as Key)}</span>` : t(`${item.id}Name` as Key), t(`${item.id}Text` as Key), save.extra === item.id ? `✓ ${t('worn')}` : t('equip'))).join('') || `<p class="how">${t('extraEmpty')}</p>`}
        ${save.extra ? `<button class="ghost small" data-extra-off>${t('dressNone')}</button>` : ''}
        </div>`;
  } else if (dressSlot === 'scene') {
    picks = `<h3 class="slot">${t('scenePick')}</h3><div class="gear-list">${Array.from({ length: WORLD_COUNT + 1 }, (_, n) => n).map((n) =>
      row(`data-scene="${n}"`, save.scene === n, false, n ? `<img class="scene-pic is-floor" src="./images/game/floors/world${n}.webp" alt="">` : save.retro ? '🌍' : '<img class="scene-pic" src="./images/game/ui/scene-own.webp" alt="">',
        n ? t(`world${n}Name` as Key) : t('sceneOwn'), n ? t('sceneText', { n }) : t('sceneOwnText'), save.scene === n ? '✓' : '')).join('')}${row(`data-scene="${CONVERGENCE_SCENE}"`, save.scene === CONVERGENCE_SCENE, false, `<img class="scene-pic is-floor" src="${CONVERGENCE_IMAGE}" alt="">`, t('sceneConvergence'), t('sceneConvergenceText'), save.scene === CONVERGENCE_SCENE ? '✓' : '')}</div>`;
  } else if (dressSlot) {
    const slot = dressSlot;
    picks = `<h3 class="slot">${t('dressPick', { slot: t(SLOT_LABEL[slot]) })}</h3>
      ${note ? `<p class="note">${note}</p>` : ''}
      <div class="gear-list">${(() => {
        // Only what is already unlocked (and can still be upgraded here); the rest is unlocked in the shop.
        const mine = ITEMS.filter((item) => item.slot === slot && save.owned.includes(item.id));
        return mine.length ? '' : `<p class="how">${t('dressNoneOwned', { slot: t(SLOT_LABEL[slot]) })}</p>`;
      })()}${ITEMS.filter((item) => item.slot === slot && save.owned.includes(item.id)).map((item) => {
        const owned = save.owned.includes(item.id);
        const worn = save.equipped[slot] === item.id;
        const can = save.coins >= item.price;
        const open = itemOpen(item);
        const levels = levelBlock(item);
        return row(`data-dress="${item.id}"`, worn, !owned && (!can || !open), picIcon(item.icon, item.pic), item.legendary ? `<span class="legend-name">${t(`${item.id}Name` as Key)}</span>` : t(`${item.id}Name` as Key), t(`${item.id}Text` as Key), worn ? `✓ ${t('worn')}` : owned ? t('equip') : !open ? `🔒 ${lockText(item)}` : `${item.legendary ? '★ ' : ''}${t('buy')} 🪙 ${item.price}`)
          + (levels ? `<div class="row-levels">${levels}</div>` : '');
      }).join('')}
      ${save.equipped[slot] ? `<button class="ghost small" data-undress="${slot}">${t('dressNone')}</button>` : ''}
      <button class="ghost is-warn" data-act="shop" data-shop-slot="${slot}">🛒 ${t('goShop')}</button>
      </div>`;
  }
  // Each round button shows what is picked now, in the game's own art (the emoji stays for retro and the picks with no picture).
  const navPic = (src: string, cls = '') => `<span class="nav-pic${cls}"><img src="${src}" alt=""></span>`;
  const world = worldIn('sprints');
  const look = save.style === 'world' ? WORLDS[world - 1].look : save.style;
  const songWorld = WORLD_SONGS.find(([, ids]) => (ids as readonly string[]).includes(save.song))?.[0] ?? (save.song === 'worlds' ? world : 0);
  const navIcon = {
    skin: navPic(heroPic(), ' is-hero'),
    // «By world» and «each world its own» show the owner's medallions; a picked cast its bug, a picked world its postcard.
    foes: save.style === 'world' ? navPic('./images/game/ui/style-world.webp') : look === 'random' ? '🎲' : navPic(`./images/game/enemies/${look}-bug-icon.webp`, ' is-foe'),
    scene: save.scene === CONVERGENCE_SCENE ? navPic(CONVERGENCE_IMAGE) : save.scene ? navPic(`./images/game/map/pv-${ISLAND_ART[save.scene - 1]}.jpg`) : navPic('./images/game/ui/scene-own.webp'),
    // Automatic, «by world», the original and the final boss's song show their own medallions; a world's or a boss's song, its postcard or boss.
    song: (['auto', 'worlds', 'b2b', 'breaks', 'doom'] as string[]).includes(save.song) ? navPic(`./images/game/music/${save.song}.webp`)
      : save.song.startsWith('boss-') ? navPic(`./images/game/bosses/${save.song.slice(5)}-0.webp`, ' is-boss')
      : songWorld ? navPic(`./images/game/map/pv-${ISLAND_ART[songWorld - 1]}.jpg`)
      : navPic('./images/game/music/auto.webp'),
  };
  const NAV_EMOJI = { skin: '👕', foes: '👾', scene: '🗺️', song: '🎵' };
  const nav = (key: 'skin' | 'foes' | 'scene' | 'song', label: Key) =>
    `<button class="dnav${dressSlot === key ? ' is-open' : ''}" data-dress-list="${key}" aria-pressed="${dressSlot === key}"><span class="ring${navIcon[key] && !save.retro ? ' has-pic' : ''}" aria-hidden="true">${navIcon[key] && !save.retro ? navIcon[key] : NAV_EMOJI[key]}</span><small>${t(label)}</small></button>`;
  show(`<button class="ui-close" type="button" data-act="menu" aria-label="${t('back')}"></button>
    <button class="ui-top" type="button" data-act="to-top" aria-label="${t('toTop')}"><span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3 L20.5 11.5 L15 11.5 L15 21 L9 21 L9 11.5 L3.5 11.5 Z"/></svg></span></button>
    <div class="dress-title"><h2>${t('styles')}</h2></div>
    <p class="wallet">${coinsLine()}</p>
    <div class="dress">
      <div class="dress-extra">${extraButton}</div>
      <div class="dress-col">${ARMOUR_SLOTS.map(slotButton).join('')}</div>
      <div class="dress-hero"><span class="pad" aria-hidden="true"></span>${hero}</div>
      <div class="dress-col">${WEAPON_SLOTS.map(slotButton).join('')}</div>
    </div>
    <div class="dress-nav">
      <button class="dnav is-back" data-act="menu"><span class="ring" aria-hidden="true"></span><small>${t('backShort')}</small></button>
      ${nav('skin', 'skinBtn')}
      ${nav('foes', 'enemies')}
      ${nav('scene', 'sceneBtn')}
      ${nav('song', 'songBtn')}
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

/** Turn the map's play button to the next or previous option, wrapping round. */
/** The map's board button has been turned to the last variant once since the map opened. */
let mapBoardShown = false;
function mapPlayStep() {
  const n = screen.querySelectorAll('.play-dots i').length || 1;
  mapPlayIdx = (mapPlayIdx + n) % n;
  mapScreen();
}
// A swipe across the map's play button turns it too (and the tap it ends in does not play).
let swipeX: number | null = null;
let swiped = false;
let swipeCover = false;
let swipeBook = false;
screen.addEventListener('pointerdown', (e) => {
  const el = e.target as HTMLElement;
  swipeCover = !!el.closest('.cover-play, .cover-arrow');
  swipeBook = !swipeCover && !!el.closest('.book-play');
  swipeX = swipeCover || swipeBook || el.closest('.play-pick.has-more') ? e.clientX : null;
  swiped = false;
});
let pageX: number | null = null;
let pageY = 0;
screen.addEventListener('pointerdown', (e) => {
  const el = e.target as HTMLElement;
  pageX = screen.querySelector('.book-page') && !el.closest('.book-play') ? e.clientX : null;
  pageY = e.clientY;
});
screen.addEventListener('pointerup', (e) => {
  if (pageX === null) return;
  const dx = e.clientX - pageX, dy = e.clientY - pageY;
  pageX = null;
  // A clear sideways swipe, not a scroll: left for the next page, right for the last one.
  if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  const to = bookPage + (dx < 0 ? 1 : -1);
  if (to < 0 || to >= BOOK.length) return;
  swiped = true;
  bookPage = to;
  bookScreen();
  const panel = screen.querySelector<HTMLElement>('.panel');
  if (panel && !matchMedia('(prefers-reduced-motion: reduce)').matches) panel.animate([{ transform: `translateX(${dx < 0 ? 60 : -60}px)`, opacity: 0.3 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'ease-out' });
});
screen.addEventListener('pointercancel', () => { pageX = null; });
/** What a swipe drags along: the cover's play bar and its words, or the map's play button. */
const swipeParts = () => [...screen.querySelectorAll<HTMLElement>(swipeCover ? '.cover-play-bar:not(.is-slot), .cover-play-copy' : swipeBook ? '.book-play-bar' : '.play-pick.has-more > .play')];
screen.addEventListener('pointermove', (e) => {
  if (swipeX === null) return;
  const dx = e.clientX - swipeX;
  if (Math.abs(dx) > 8) swiped = true;
  // The bar follows the finger, a little less the further it goes.
  const shift = Math.sign(dx) * Math.min(Math.abs(dx), 140) * 0.8;
  for (const el of swipeParts()) { el.style.transition = 'none'; el.style.transform = `translateX(${shift}px)`; }
});
const swipeEnd = (e: PointerEvent) => {
  if (swipeX === null) return;
  const dx = e.type === 'pointercancel' ? 0 : e.clientX - swipeX;
  swipeX = null;
  if (Math.abs(dx) < 40) {
    // Not far enough: it springs back.
    for (const el of swipeParts()) { el.style.transition = 'transform 0.18s ease-out'; el.style.transform = ''; }
    return;
  }
  swiped = true;
  const by = dx < 0 ? 1 : -1;
  if (swipeCover) stepMode(by);
  else if (swipeBook) bookStepMode(by);
  else { mapPlayIdx += by; mapPlayStep(); }
  // The next one slides in from the side the finger came from.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const el of swipeParts()) el.animate([{ transform: `translateX(${by * 70}px)`, opacity: 0.2 }, { transform: 'none', opacity: 1 }], { duration: 200, easing: 'ease-out' });
  }
};
screen.addEventListener('pointerup', swipeEnd);
screen.addEventListener('pointercancel', swipeEnd);
/** The guide's copy of the play bar turns the same way, and picks the mode as the cover's does. */
function bookStepMode(by: number) {
  save.mode = MODES[(MODES.indexOf(save.mode) + by + MODES.length) % MODES.length];
  persist();
  bookScreen();
}
/** The cover's play bar turns to the next or the last way to play (its arrows, or a swipe across it). */
function stepMode(by: number) {
  const index = extraModePreview ? MODES.length : MODES.indexOf(save.mode);
  const next = (index + by + coverModes.length) % coverModes.length;
  extraModePreview = next === MODES.length;
  if (!extraModePreview) { save.mode = MODES[next]; persist(); }
  menuScreen();
}
function extraHubScreen() {
  const es = lang === 'es';
  show(`<button class="ui-close" type="button" data-act="menu" aria-label="${t('back')}"></button>
    <h2>🏰 ${es ? 'Próximamente · Nuevos juegos' : 'Coming Soon · New games'}</h2>
    <p>${es ? 'Aquí reuniremos los próximos modos de Bug Hunter. Los tres modos existentes continúan sin cambios.' : 'This is the home for upcoming Bug Hunter game modes. Existing modes remain unchanged.'}</p>
    <div class="book-modes">
      <div class="book-mode"><b>⚔️ ${t('siegeName')} · ${t('siegeSoon')}</b><p>${t('siegeIntro')}</p><button class="primary" type="button" data-act="siege-preview">${t('siegeLaunch')}</button></div>
      <div class="book-mode"><b>🏰 Fortress · ${es ? 'Asedio' : 'Siege'}</b><p>${es ? 'Ataca fortalezas con tus bichos, destruye edificios y consigue hasta tres estrellas. Prototipo experimental disponible.' : 'Attack fortresses with bugs, destroy buildings and earn up to three stars. Experimental prototype available.'}</p>
      <a class="primary book-mode" href="/fortress-lab.html">${es ? 'Abrir prototipo de Asedio' : 'Open Siege prototype'}</a></div>
      <p>🧪 ${es ? 'Otros modos nuevos: en desarrollo' : 'Other new modes: in development'}</p>
    </div>`);
}
function startRun(world = worldIn(), mode: PlayMode = save.mode, endless = false, rush = 0, secret = false, rushFrom = 1) {
  if (mode === 'board') { boardVariantScreen(world); return; }
  together = null;
  game = newGame({ ...buildLoadout(save.equipped, save.upgrades, masteries(), save.arsenal, save.itemLevels, save.extra), sprintMastery: masteries() }, save.style, world, mode, endless, rush, secret, rushFrom);
  // Boss Rush: every boss in its own world's floor and song (whatever Customise picked); the secret shift, the jungle's.
  game.scene = rush || secret ? 0 : save.scene;
  audio.setSong(rush ? 'worlds' : save.song);
  preloadFx();
  preloadCast(game);
  paused = false;
  shownChoices = '';
  wheelShown = false;
  reviveOffered = false;
  hud.hidden = false;
  hudGear.hidden = false;
  hide();
  hudRoom.style.setProperty('--icon', JSON.stringify(WORLD_ICON[game.world - 1]));
  resize(); // Reserve the live HUD + weapons row, including the iOS safe area.
  flash(game.secret ? t('secretStart') : game.rush ? t('rushStart', { n: game.stages }) : game.endless ? t('nightmareStart') : game.mode === 'horde' ? t('hordeStart') : `${worldName(game.world)} · ${t('sprint', { room: 1 })}`);
  audio.start();
  audio.setIntensity(0.2);
}


/* ------------------------------------------------------------------ the board */

/* «Sprint Planning», the board mode (rules in `board.ts`, drawing in `boardView.ts`): its own top bar and shop
   over the canvas (`#boardUi`), the fight drawn on the canvas, and the result of each round in a dialog. */
const boardUi = $<HTMLElement>('boardUi');
const boardTop = $<HTMLElement>('boardTop');
const boardShop = $<HTMLElement>('boardShop');
const boardSide = $<HTMLElement>('boardSide');
const boardBenchEl = $<HTMLElement>('boardBench');
const boardMobileTray = $<HTMLElement>('boardMobileTray');
const boardMobileActs = $<HTMLElement>('boardMobileActs');
/** The dragged unit's own canvas, over the top bar and the shop (cleared once after a drag ends). */
let floatDrawn = false;
/** The auto-merge whose lightning has crackled already. */
let boardZapped = '';
const boardFloat = $<HTMLCanvasElement>('boardFloat');
const floatCtx = boardFloat.getContext('2d') as CanvasRenderingContext2D;
let board: BoardGame | null = null;
let boardDrag: BoardDrag | null = null;
type BoardInspection = { piece: Piece; stats?: ReturnType<typeof unitStats>; enemy: boolean };
let boardDown: { x: number; y: number; id: number; piece: Piece | null; inspection: BoardInspection | null; moved: boolean; fromBench?: boolean } | null = null;
/** The shop card's long press opens its own stats card instead of buying on release. */
function markBoardPressHeld(down: { held: boolean }) { down.held = true; }
let boardLay: BoardLayout = { s: 1, sx: 1, ox: 0, oy: 0 };
const boardTooltip = $<HTMLElement>('boardTooltip');
window.addEventListener('pointerdown', (event) => {
  if (boardTooltip.hidden || boardTooltip.contains(event.target as Node)) return;
  hideBoardTooltip();
}, { capture: true });
let boardKey = '';
let boardShopPopSlot = -1;
let boardShopPopSerial = 0;
let boardShown = '';
let boardTime = 0;
let boardBanked = false;
/** Your commander in the corner: the worn skin and headwear's poses. */
let heroPics: HeroPics | null = null;
/** A long fight can be watched at twice the speed: a ×2 button shows under your hero after `BOARD_FAST_AFTER`
    seconds of it (back to normal for the next fight). */
const BOARD_FAST_AFTER = 15;
let boardFast = false;
/** The online fight's fixed step and what is left over from the frames (`boardStep`). */
const ONLINE_STEP = 1 / 60;
let boardAcc = 0;
/** When the last fight ended (the frame clock, in seconds), for the fireball. */
let boardEnded: number | null = null;

/** The board's two ways to play, picked each time a board run starts from the cover (the last pick ticked): Fusion,
    green, and Tactics, gold; the map's play button offers them as its two options. */
function boardVariantScreen(world: number) {
  const opt = (v: 'fusion' | 'tactics') => `<button class="primary book-mode board-variant is-${v === 'fusion' ? 'sprints' : 'gold'}${save.boardVariant === v ? ' is-on' : ''}" type="button" data-act="board-variant" data-variant="${v}" data-bworld="${world}"><b>${v === 'fusion' ? '🧬' : '⭐'} ${t(v === 'fusion' ? 'boardFusion' : 'boardTactics')}${save.boardVariant === v ? ' ✓' : ''}</b></button>`;
  show(`<button class="ui-close" type="button" data-act="menu" aria-label="${t('back')}"></button>
    <h2>${MODE_ICON.board} ${t('modeBoard')}</h2>
    <p>${t('boardVariantPick')}</p>
    <div class="book-modes">${opt('fusion')}${opt('tactics')}</div>
    ${friend ? friendInvite() : `<button class="ghost" type="button" data-act="link">👥 ${t('onlinePlay')}</button>`}`);
}
/** With a friend linked: their portrait and name, and one button for each way to invite them to it. */
function friendInvite() {
  if (!friend) return '';
  return `<div class="friend-card"><span class="friend-pic"><img data-friend-portrait src="./images/game/hero/${friend.still}.webp" alt=""></span><b>${linkedName()}</b><i class="friend-dot" aria-hidden="true"></i></div>
    <p class="how">${linkedName('linkInvite')}</p>
    <div class="book-modes">
      <button class="primary book-mode is-sprints" type="button" data-act="invite" data-variant="fusion"><b>🧬 ${t('boardFusion')}</b></button>
      <button class="primary book-mode is-gold" type="button" data-act="invite" data-variant="tactics"><b>⭐ ${t('boardTactics')}</b></button>
    </div>`;
}

/* The link with a friend (`net.ts`): made once from the board's screen, by a code one phone shows and the other
   types in, and kept open while you play on: the cover shows the friend under your profile, the board's screen
   offers to invite them, and in a game their own hero stands in the rival's corner. An invitation carries the
   way, the world and the seed; whoever invites is side 0 of the shared fights. */
type Friend = { id?: string; name: string; key: string; still: string; profile?: NetProfile };
let friend: Friend | null = null;
/** Names stay live without rebuilding a screen that may contain a form, an invitation or a running game. */
function linkedName(key?: Key) {
  const name = esc(friend?.name ?? board?.online?.rivalName ?? '');
  return `<span data-friend-name${key ? ` data-friend-key="${key}"` : ''}>${key ? t(key, { name }) : name}</span>`;
}
function refreshFriendName() {
  if (!friend) return;
  const { name, id, key, still } = friend;
  if (board?.online) board.online.rivalName = name;
  // A hello is sent again after a name, skin or headwear change. Keep open cards
  // and an online board in step without rebuilding the screen.
  document.querySelectorAll<HTMLImageElement>('[data-friend-portrait]').forEach((img) => {
    img.src = `./images/game/hero/${still}.webp`;
  });
  if (id && NET_ID.test(id)) {
    document.querySelectorAll<HTMLImageElement>(`[data-friend-portrait-id="${id}"]`).forEach((img) => {
      img.src = `./images/game/hero/${still}.webp`;
    });
  }
  if (board?.online && heroPics) {
    const pose = (name: string) => Object.assign(new Image(), { src: `./images/game/hero/${key}-${name}.webp` });
    heroPics.rival = { front: pose('front'), shoot: pose('shoot'), hurt: pose('hurt'), cheer: pose('cheer'), down: pose('down') };
  }
  document.querySelectorAll<HTMLElement>('[data-friend-name]').forEach((node) => {
    const key = node.dataset.friendKey as Key | undefined;
    node.textContent = key ? t(key, { name }) : name;
  });
  document.querySelector('.cover-friend:not(.is-add)')?.setAttribute('aria-label', `${t('onlinePlay')}: ${name}`);
  if (id && NET_ID.test(id)) {
    document.querySelectorAll<HTMLElement>(`[data-friend-id="${id}"]`).forEach((node) => { node.textContent = name; });
  }
}
let rivalReady: { round: number; army: Piece[] } | null = null;
let sentArmy: Piece[] | null = null;
/** The invitation you sent and wait on, and the one you were sent and have not answered. */
type Invite = { mode: Together; variant: Variant; world: number; seed: number };
let inviting: Invite | null = null;
let invitedBy: Invite | null = null;
/** What an invitation is to, for its dialogs. */
const inviteWhat = (v: Invite) => v.mode === 'sprints' ? `${MODE_ICON.sprints} ${t('modeSprints')}` : v.mode === 'horde' ? `${MODE_ICON.horde} ${t('modeHorde')}` : `${v.variant === 'tactics' ? '⭐' : '🧬'} ${t(v.variant === 'tactics' ? 'boardTactics' : 'boardFusion')}`;
/** Your whole profile goes with your hello: your hero as worn, its level and masteries, what you wear and how far your
    forge and items are upgraded (each phone plays its own run with its own save, so this is what the other sees). */
const hello = (): NetMsg => ({
  t: 'hello', id: save.netId, name: save.name, key: heroKey(save.skin, save.equipped.head), still: heroStill(save.skin, save.equipped.head),
  profile: {
    level: profileLevel(save.xp).level, masteries: masteries(), skin: save.skin, equipped: Object.values(save.equipped).filter((x): x is ItemId => !!x),
    upgrades: Object.values(save.upgrades ?? {}).reduce((n: number, v) => n + (Number(v) || 0), 0), items: save.owned.length,
  },
});
const ownHeroPortrait = () => `${heroKey(save.skin, save.equipped.head)}|${heroStill(save.skin, save.equipped.head)}`;
function syncFriendPortrait(before: string) {
  if (before !== ownHeroPortrait()) netSend(hello());
}
/** Playing a run together (`startTogether`): the mode and the shared seed (On call's field is laid from it). */
let together: { mode: 'sprints' | 'horde'; seed: number } | null = null;
/** The friend's last state in their run, and when it came (seconds on the frame clock). */
let friendState: (NetState & { at: number; sx: number; sy: number }) | null = null;
let stateSent = 0;
/* Playing with a friend, in a run of your own: your state goes to them a few times a second, and theirs is shown.
   On call, side by side on the same field of blocks, they are drawn where they stand (their hero as worn, walking
   the way they walk), and when they are off the screen their head waits at its edge in a ring, pointing their way;
   in sprints a small card under your health shows their run, the room they are in among the twelve. */
const friendPics = new Map<string, HTMLImageElement>();
function friendPic(name: string) {
  const src = `./images/game/hero/${name}.webp`;
  let img = friendPics.get(src);
  if (!img) { img = new Image(); img.src = src; friendPics.set(src, img); }
  return img;
}
const friendMini = document.createElement('div');
/** Where the HUD ends on screen, measured when the friend card is laid out (used to keep the friend's head below it). */
let hudBottom = 0;
friendMini.className = 'friend-mini';
friendMini.hidden = true;
document.body.append(friendMini);
let overlayAt = 0;
let coopSent = 0;
let raceTold = false;
function friendOverlay(g: Game, now: number, frozen: boolean) {
  const dt = Math.min(0.1, Math.max(0, now - overlayAt));
  overlayAt = now;
  if (friend && now - stateSent > 0.15) {
    stateSent = now;
    const p = g.player;
    netSend({ t: 'state', mode: g.mode, world: g.world, room: g.room, x: Math.round(p.x), y: Math.round(p.y), vx: p.moving ? Math.round(Math.cos(p.heading) * 100) / 100 : 0, vy: p.moving ? Math.round(Math.sin(p.heading) * 100) / 100 : 0, hp: Math.max(0, p.hp) / p.maxHp, level: g.level, phase: g.phase });
  }
  const fs = friendState;
  const fresh = !!friend && !!fs && now - fs.at < 3;
  if (g.coop) {
    g.coop.ally = fresh && fs && fs.mode === 'horde' && fs.phase !== 'over' ? { x: fs.sx, y: fs.sy } : null;
    if (friend && now - coopSent > 0.1) {
      coopSent = now;
      if (g.coop.host) netSend({ t: 'snap', ...coopSnapshot(g) });
      else { const h = coopDealt(g); if (h.length) netSend({ t: 'hits', h }); }
    }
  }
  // Sprints are a race: who clears the world first.
  if (fs && g.mode === 'sprints' && fs.mode === 'sprints' && fs.phase === 'won' && !raceTold && friend) { raceTold = true; if (g.phase === 'play') flash(t('raceFirst', { name: esc(friend.name) })); }
  // Sprints: the friend's run on a small card under your health.
  const mini = fresh && fs && friend && g.mode === 'sprints' && fs.mode === 'sprints' && !g.rush && !g.showcase;
  friendMini.hidden = !mini;
  if (mini && fs && friend) {
    const key = `${friend.name}|${friend.still}|${fs.world}|${fs.room}|${fs.phase}|${Math.round(fs.hp * 10)}`;
    if (friendMini.dataset.key !== key) {
      friendMini.dataset.key = key;
      const dots = Array.from({ length: ROOMS }, (_, i) => {
        const r = i + 1;
        return `<i class="${r < fs.room ? 'is-done' : r === fs.room ? 'is-here' : ''}${SHRINE_ROOMS.includes(r) ? ' is-shrine' : ''}${r === 6 || r === ROOMS ? ' is-boss' : ''}"></i>`;
      }).join('');
      const end = fs.phase === 'over' ? ' 💀' : fs.phase === 'won' ? ' 🏆' : '';
      friendMini.innerHTML = `<span class="friend-pic"><img data-friend-portrait src="./images/game/hero/${friend.still}.webp" alt=""></span>
        <div><b>${linkedName()}${end}</b><small>${t('worldShort', { n: fs.world })} · ${t('linkRoom', { n: fs.room, total: ROOMS })}</small>
        <span class="friend-rooms">${dots}</span><span class="friend-hp"><b style="width:${Math.round(fs.hp * 100)}%"></b></span></div>`;
    }
    // Under the HUD; on wide screens the HUD is a panel down the left, so the card sits beside its top. (Measured
    // when the card is rewritten, not every frame: the measure forces a layout.)
    const box = hud.getBoundingClientRect();
    hudBottom = box.bottom;
    const side = box.height > window.innerHeight * 0.5;
    friendMini.style.top = `${Math.round(side ? box.top + 8 : box.bottom + 6)}px`;
    friendMini.style.left = `${Math.round(side ? box.right + 8 : 8)}px`;
  }
  // On call together: the friend on the same field, or their head at the edge of the screen.
  if (!fresh || !fs || !friend || frozen || save.retro || together?.mode !== 'horde' || g.mode !== 'horde' || fs.mode !== 'horde') return;
  const ahead = Math.min(0.3, now - fs.at);
  const tx = fs.x + fs.vx * 150 * ahead, ty = fs.y + fs.vy * 150 * ahead;
  const k = Math.min(1, dt * 12);
  fs.sx += (tx - fs.sx) * k;
  fs.sy += (ty - fs.sy) * k;
  const p = g.player;
  const x = view.cx + (fs.sx - p.x) * view.scale;
  const y = view.cy + (fs.sy - p.y) * view.scale;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const top = Math.max(60, hudBottom - canvasRect.top + 20);
  ctx.save();
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  const moving = Math.hypot(fs.vx, fs.vy) > 0.2;
  const step = Math.floor(now * 6) % 2 ? '2' : '';
  const pose = fs.phase === 'over' ? 'down' : !moving ? 'front' : fs.vy < -0.6 ? 'back' : fs.vy > 0.6 ? `fwalk${step}` : `walk${step}`;
  const img = friendPic(`${friend.key}-${pose}`);
  const fallback = friendPic(friend.still);
  const pic = img.complete && img.naturalWidth ? img : fallback;
  const inside = x > 0 && x < w && y > top - 40 && y < h + 20;
  if (inside && pic.complete && pic.naturalWidth) {
    const ph = 15 * 3.05 * (pic.naturalHeight / 150) * view.scale;
    const pw = (ph * pic.naturalWidth) / pic.naturalHeight;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y, pw * 0.32, pw * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(x, y);
    if (moving && fs.vx < -0.2) ctx.scale(-1, 1);
    ctx.drawImage(pic, -pw / 2, -ph, pw, ph);
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    // Their name over their head.
    ctx.font = '700 12px Fredoka, sans-serif';
    const label = friend.name;
    const lw = ctx.measureText(label).width + 12;
    ctx.fillStyle = 'rgba(8,12,28,0.7)';
    ctx.beginPath();
    ctx.roundRect(x - lw / 2, y - ph - 20, lw, 17, 8);
    ctx.fill();
    ctx.fillStyle = '#86efac';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y - ph - 11.5);
  } else {
    // Off the screen: their head in a ring at the edge, pointing to where they are.
    const R = 22;
    const cx0 = w / 2, cy0 = (top + h) / 2;
    const dx = x - cx0, dy = y - 25 * view.scale - cy0;
    const kx = (w / 2 - R - 8) / Math.max(1e-6, Math.abs(dx)), ky = ((h - top) / 2 - R - 8) / Math.max(1e-6, Math.abs(dy));
    const kk = Math.min(kx, ky, 1);
    const ex = cx0 + dx * kk, ey = cy0 + dy * kk;
    const a = Math.atan2(dy, dx);
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(ex + Math.cos(a) * (R + 10), ey + Math.sin(a) * (R + 10));
    ctx.lineTo(ex + Math.cos(a + 0.45) * (R + 1), ey + Math.sin(a + 0.45) * (R + 1));
    ctx.lineTo(ex + Math.cos(a - 0.45) * (R + 1), ey + Math.sin(a - 0.45) * (R + 1));
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex, ey, R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(11,24,36,0.9)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#4ade80';
    ctx.stroke();
    const head = fallback.complete && fallback.naturalWidth ? fallback : null;
    if (head) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(ex, ey, R - 2, 0, Math.PI * 2);
      ctx.clip();
      const hh = R * 3.4, hw = (hh * head.naturalWidth) / head.naturalHeight;
      ctx.drawImage(head, ex - hw / 2, ey - R * 0.95, hw, hh);
      ctx.restore();
    }
  }
  ctx.restore();
}
/** Starts what an invitation agreed on, on both phones: the board as before, or a run of your own, side by side. */
function startTogether(mode: Together, variant: Variant, world: number, seed: number, me: 0 | 1) {
  if (!friend) return;
  if (mode === 'board') { startBoard(world, { variant, online: { me, seed, rivalLives: 10, rivalName: friend.name, rivalArmy: null, waiting: false } }); return; }
  startRun(world, mode);
  if (!game) return;
  together = { mode, seed };
  raceTold = false;
  // On call: the same field of blocks for both, laid from the shared seed.
  // and the same bugs: the one who invited makes them, the other's follow (`Coop` in `world.ts`).
  if (mode === 'horde') { game.fieldSeed = seed; game.fieldKey = ''; game.coop = { host: me === 0, ally: null, dealt: new Map(), known: new Set() }; }
  flash(t(mode === 'horde' ? 'linkHordeStart' : 'linkSprintStart', { name: esc(friend.name) }));
}
const onCover = () => !board && !game && !!document.querySelector('.screen.is-menu');
/** The friend's profile, as their phone sent it: level, masteries and what they wear. */
function friendProfile() {
  const p = friend?.profile;
  if (!p) return '';
  const worn = p.equipped.map((id) => itemById(id as ItemId)).filter((it) => !!it).map((it) => `<img src="./images/game/${it!.pic}" alt="" title="${esc(t(`${it!.id}Name` as Key))}" width="30" height="30">`).join('');
  return `<p class="friend-stats">${t('lvShort', { level: p.level })}${p.masteries ? ` · ★${p.masteries}` : ''} · ⚒ ${p.upgrades} · 🎒 ${p.items}</p>${worn ? `<div class="friend-worn">${worn}</div>` : ''}`;
}
/* Saved friends: while the game is open you wait under your own id (`presence` in `net.ts`), and on opening it you
   call each saved friend in turn, so whoever opens the game second finds the other and both are linked, no code. */
const presenceHandlers = (): NetHandlers => ({ open: () => netSend(hello()), msg: onNetMsg, drop: friendDropped, close: friendGone, error: () => {} });
let dialled = false;
/** A friend added from a shared link, called first. */
let callFirst = '';
function goOnline() {
  if (friend || presenceOn()) return;
  presence(save.netId, presenceHandlers());
  if (dialled && !callFirst) return;
  dialled = true;
  const queue = [...new Set([callFirst, ...save.friends.map((f) => f.id)].filter(Boolean))];
  callFirst = '';
  let waited = 0;
  const next = () => {
    if (friend || !presenceOn() || !queue.length) return;
    if (!presenceReady()) { if ((waited += 1) < 40) window.setTimeout(next, 250); return; }
    dial(queue.shift()!, { ...presenceHandlers(), error: () => window.setTimeout(next, 200) });
  };
  next();
}
/** Calls one saved friend from the profile. */
function callFriend(id: string) {
  const f = save.friends.find((x) => x.id === id);
  if (!f) return;
  if (friend) { linkScreen(); return; }
  if (!presenceOn()) presence(save.netId, presenceHandlers());
  flash(t('friendCalling', { name: esc(f.name) }));
  let waited = 0;
  const go = () => {
    if (friend) return;
    if (!presenceReady()) { if ((waited += 1) < 40) window.setTimeout(go, 250); else flash(t('onlineError')); return; }
    dial(id, { ...presenceHandlers(), error: () => { if (!friend) flash(t('friendAway', { name: esc(f.name) })); } });
  };
  go();
}
const shareUrl = () => `${location.origin}${location.pathname}#amigo=${save.netId}&n=${encodeURIComponent(save.name)}`;
async function shareProfile() {
  const url = shareUrl();
  try {
    if (navigator.share) { await navigator.share({ title: 'Bug Hunter', text: t('shareText', { name: save.name }), url }); return; }
  } catch (e) { if ((e as Error).name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); flash(t('shareCopied')); }
  catch { window.prompt(t('shareCopy'), url); }
}
/** Opened from a friend's shared link (`#amigo=<id>&n=<name>`): they are saved and called. */
function readShared() {
  const q = new URLSearchParams(location.hash.slice(1));
  const id = q.get('amigo') ?? '';
  if (!id) return;
  history.replaceState(null, '', location.pathname + location.search);
  if (!NET_ID.test(id) || id === save.netId) return;
  const name = cleanName(q.get('n') ?? '') || '?';
  const had = save.friends.find((f) => f.id === id);
  save.friends = [{ id, name, still: had?.still ?? '' }, ...save.friends.filter((f) => f.id !== id)].slice(0, 30);
  persist();
  callFirst = id;
  flash(t('friendAdded', { name: esc(name) }));
}
const friendStill = (still: string) => `./images/game/hero/${still || 'boy-base-front'}.webp`;
function friendsBlock() {
  const rows = save.friends.map((f) => {
    const on = friend?.id === f.id;
    return `<div class="friend-row${on ? ' is-on' : ''}">
      <span class="friend-pic"><img${on ? ` data-friend-portrait-id="${f.id}"` : ""} src="${friendStill(on ? friend!.still : f.still)}" alt=""></span>
      <b data-friend-id="${f.id}">${esc(f.name)}</b>${on ? '<i class="friend-dot" aria-hidden="true"></i>' : ''}
      <button class="friend-go" type="button" data-act="friend-call" data-id="${f.id}">${t(on ? 'friendPlay' : 'friendCall')}</button>
      <button class="friend-del" type="button" data-act="friend-del" data-id="${f.id}" aria-label="${t('friendRemove')}">✕</button>
    </div>`;
  }).join('');
  return `<h3 class="slot">👥 ${t('friendsTitle')}</h3>
    ${rows ? `<div class="friend-list">${rows}</div>` : `<p class="how">${t('friendsNone')}</p>`}
    <button class="primary" type="button" data-act="share">🔗 ${t('shareProfile')}</button>
    <button class="ghost" type="button" data-act="link">${t('friendByCode')}</button>
    <button class="primary is-purple" type="button" data-act="styles">🎨 ${t('styles')}</button>`;
}
function linkScreen(note = '') {
  if (friend) {
    show(`<button class="ui-close" type="button" data-act="menu" aria-label="${t('back')}"></button>
      <h2>👥 ${t('onlinePlay')}</h2>
      <div class="friend-card"><span class="friend-pic"><img data-friend-portrait src="./images/game/hero/${friend.still}.webp" alt=""></span><b>${linkedName()}</b><i class="friend-dot" aria-hidden="true"></i></div>
      ${friendProfile()}
      <p class="how">${linkedName('linkOn')}</p>
      <button class="primary" type="button" data-act="invite" data-mode="sprints">${MODE_ICON.sprints} ${t('linkSprints')}</button>
      <button class="primary" type="button" data-act="invite" data-mode="horde">${MODE_ICON.horde} ${t('linkHorde')}</button>
      <button class="primary" type="button" data-act="board-pick">${MODE_ICON.board} ${t('modeBoard')}</button>
      <button class="ghost is-danger" type="button" data-act="link-off">${t('linkOff')}</button>`);
    return;
  }
  netLeave();
  show(`<button class="ui-close" type="button" data-act="menu" aria-label="${t('back')}"></button>
    <h2>👥 ${t('onlinePlay')}</h2>
    <p>${t('onlineHow')}</p>
    ${note ? `<p class="how">${note}</p>` : ''}
    <button class="primary" type="button" data-act="link-host">${t('onlineHost')}</button>
    <h3 class="slot">${t('onlineJoin')}</h3>
    <input class="online-code" id="onlineCode" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD" aria-label="${t('onlineCodeLabel')}">
    <button class="primary" type="button" data-act="link-join">${t('onlineJoinBtn')}</button>`);
}
const netHandlers = (): NetHandlers => ({
  code: (code) => show(`<button class="ui-close" type="button" data-act="link" aria-label="${t('back')}"></button>
      <h2>👥 ${t('onlineHost')}</h2>
      <p>${t('onlineGive')}</p>
      <p class="online-big">${code}</p>
      <p class="how">⏳ ${t('onlineWait')}</p>`),
  open: () => netSend(hello()),
  msg: onNetMsg,
  drop: friendDropped,
  close: friendGone,
  error: (why) => linkScreen(`⚠ ${t(why === 'peer-unavailable' ? 'onlineNoGame' : 'onlineError')}`),
});
function onNetMsg(m: NetMsg) {
  if (m.t === 'hello') {
    const first = !friend;
    if (dropped) { dropped = false; window.clearTimeout(dropTimer); flash(t('linkBack', { name: esc(cleanName(m.name)) })); }
    friend = { name: cleanName(m.name), key: String(m.key).replace(/[^a-z-]/g, ''), still: String(m.still).replace(/[^a-z-]/g, '') };
    if (m.profile) friend.profile = { level: Number(m.profile.level) || 1, masteries: Number(m.profile.masteries) || 0, skin: String(m.profile.skin), equipped: (m.profile.equipped ?? []).map(String).filter((id) => !!itemById(id as ItemId)), upgrades: Number(m.profile.upgrades) || 0, items: Number(m.profile.items) || 0 };
    const id = String(m.id ?? '');
    if (NET_ID.test(id) && id !== save.netId) {
      friend.id = id;
      // Kept as a friend, to be found again without a code; the newest first.
      save.friends = [{ id, name: friend.name, still: friend.still }, ...save.friends.filter((f) => f.id !== id)].slice(0, 30);
      persist();
    }
    refreshFriendName();
    if (first) { flash(t('linkMade', { name: esc(friend.name) })); audio.play('door'); if (!board && !game) menuScreen(); }
  } else if (m.t === 'invite') {
    if (board || game || inviting) { netSend({ t: 'decline' }); return; }
    invitedBy = { mode: m.mode === 'sprints' || m.mode === 'horde' ? m.mode : 'board', variant: m.variant === 'tactics' ? 'tactics' : 'fusion', world: Math.max(1, Math.min(WORLD_COUNT, Math.round(m.world) || 1)), seed: m.seed >>> 0 };
    audio.play('levelup');
    show(`${friend ? `<div class="friend-card"><span class="friend-pic"><img data-friend-portrait src="./images/game/hero/${friend.still}.webp" alt=""></span><b>${linkedName()}</b></div>` : ''}
      <h2>${linkedName(invitedBy.mode === 'board' ? 'linkInvited' : 'linkInvitedRun')}</h2>
      <p>${inviteWhat(invitedBy)} · ${t('worldShort', { n: invitedBy.world })}</p>
      <button class="primary" type="button" data-act="invite-yes">${t('linkAccept')}</button>
      <button class="ghost" type="button" data-act="invite-no">${t('linkDecline')}</button>`);
  } else if (m.t === 'uninvite') {
    if (invitedBy) { invitedBy = null; if (!board && !game) menuScreen(); }
  } else if (m.t === 'accept') {
    if (inviting && friend) { const v = inviting; inviting = null; startTogether(v.mode, v.variant, v.world, v.seed, 0); }
  } else if (m.t === 'decline') {
    if (inviting) { const v = inviting; inviting = null; flash(t('linkBusy', { name: esc(friend?.name ?? '') })); if (v.mode === 'board') boardVariantScreen(worldIn('board')); else linkScreen(); }
  } else if (m.t === 'ready') {
    // What came over the link is checked before it is used: whole numbers within the board, at most a full army.
    const army = (Array.isArray(m.army) ? m.army : []).slice(0, 12).map((p, i) => ({
      id: i + 1, tier: Math.max(0, Math.min(6, Math.round(Number(p?.tier)) || 0)) as Piece['tier'], cast: Math.max(1, Math.min(WORLD_COUNT, Math.round(Number(p?.cast)) || 1)),
      slot: { c: Math.max(0, Math.min(COLS - 1, Math.round(Number(p?.slot?.c)) || 0)), r: Math.max(HOME_ROW, Math.min(ROWS - 1, Math.round(Number(p?.slot?.r)) || HOME_ROW)) },
      star: Math.max(1, Math.min(3, Math.round(Number(p?.star)) || 1)) as Piece['star'],
    }));
    rivalReady = { round: Math.round(Number(m.round)) || 0, army };
    if (board?.online && !board.online.waiting) flash(t('onlineRivalReady', { name: esc(board.online.rivalName) }));
    tryOnlineFight();
  } else if (m.t === 'state') {
    const at = performance.now() / 1000;
    const prev = friendState;
    const n = (v: unknown, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number(v) || 0));
    const st: NetState = { t: 'state', mode: m.mode === 'horde' ? 'horde' : 'sprints', world: n(m.world, 1, WORLD_COUNT), room: n(m.room, 1, ROOMS), x: n(m.x, -1e6, 1e6), y: n(m.y, -1e6, 1e6), vx: n(m.vx, -1, 1), vy: n(m.vy, -1, 1), hp: n(m.hp, 0, 1), level: n(m.level, 1, 999), phase: String(m.phase).slice(0, 10) };
    friendState = { ...st, at, sx: prev && prev.mode === st.mode ? prev.sx : st.x, sy: prev && prev.mode === st.mode ? prev.sy : st.y };
  } else if (m.t === 'snap') {
    if (game?.coop && !game.coop.host && Array.isArray(m.e)) coopApply(game, { time: Number(m.time) || 0, b: Math.round(Number(m.b)) || 0, won: !!m.won, e: m.e.slice(0, 400).filter((x) => Array.isArray(x) && ['bug', 'ticket', 'legacy', 'boss'].includes(x[1])).map((x) => [Number(x[0]) || 0, x[1], Number(x[2]) || 0, Number(x[3]) || 0, Number(x[4]) || 0, Math.max(1, Number(x[5]) || 1), Math.max(4, Math.min(120, Number(x[6]) || 12)), String(x[7] ?? '').replace(/[^a-z0-9]/g, ''), x[8] ? 1 : 0]) });
  } else if (m.t === 'hits') {
    if (game?.coop?.host && Array.isArray(m.h)) coopHits(game, m.h.slice(0, 500).map((x) => [Number(x?.[0]) || 0, Math.max(0, Number(x?.[1]) || 0)]));
  } else if (m.t === 'quit') rivalQuit();
  else if (m.t === 'bye') friendGone();
}
/** Both armies are in: the fight starts on both phones from the same seed. */
function tryOnlineFight() {
  const b = board;
  if (!b?.online?.waiting || !sentArmy || rivalReady?.round !== b.round) return;
  const rival = rivalReady.army;
  rivalReady = null;
  boardFast = false;
  boardAcc = 0;
  if (startOnlineFight(b, rival, sentArmy)) { audio.play('door'); audio.play('slam'); audio.setIntensity(0.7); }
  sentArmy = null;
  renderBoardUi();
}
/** The friend left the game you were playing (the link stays). */
function rivalQuit() {
  const b = board;
  if (!b?.online || b.phase === 'over' || b.phase === 'won') return;
  b.online = undefined; // nothing more to send them about this game
  paused = true;
  show(`<h2>👥 ${linkedName('onlineGone')}</h2>
    <button class="primary" data-act="board-leave">${t('menu')}</button>`);
}
/** The link dropped without a goodbye (a phone asleep, a blip in the Wi-Fi): it is tried again for a while, the
    friend kept meanwhile; a board game cannot wait (a round's army could be lost), so it ends. */
let dropTimer = 0;
let dropped = false;
function friendDropped() {
  if (!friend) return;
  if (board?.online && board.phase !== 'over' && board.phase !== 'won') rivalQuit();
  if (dropped) return;
  dropped = true;
  flash(t('linkDrop', { name: esc(friend.name) }));
  window.clearTimeout(dropTimer);
  dropTimer = window.setTimeout(() => { if (dropped) friendGone(); }, 40000);
}
/** The link is gone: the friend disconnected or the connection dropped. */
function friendGone() {
  window.clearTimeout(dropTimer);
  dropped = false;
  const was = friend;
  friend = null;
  friendState = null;
  friendMini.hidden = true;
  inviting = null;
  invitedBy = null;
  netLeave();
  goOnline();
  if (board?.online && board.phase !== 'over' && board.phase !== 'won') { rivalQuit(); return; }
  if (was) flash(t('linkLost', { name: esc(was.name) }));
  if (onCover()) menuScreen();
}
function startBoard(world: number, net?: { variant: Variant; online: Online }) {
  preloadBoardBossFx();
  clearBoardInteraction();
  game = null;
  paused = false;
  hud.hidden = true;
  hudGear.hidden = true;
  bossBar.hidden = true;
  showcaseBtn.hidden = true;
  closeGearPanel();
  hide();
  board = newBoard(world, save.boardUnlocked, net?.variant ?? save.boardVariant);
  if (net) { board.online = net.online; board.wave = []; board.waveCasts = []; }
  rivalReady = null;
  sentArmy = null;
  const key = heroKey(save.skin, save.equipped.head);
  const pic = (pose: string) => Object.assign(new Image(), { src: `./images/game/hero/${key}-${pose}.webp` });
  heroPics = { front: pic('front'), shoot: pic('shoot'), hurt: pic('hurt'), cheer: pic('cheer'), down: pic('down'), pad: Object.assign(new Image(), { src: './images/game/ui/portal_pad.webp' }), padRed: Object.assign(new Image(), { src: './images/game/ui/portal_pad_red.webp' }) };
  // Against a friend, their own hero in the rival's corner, from their set's poses.
  if (net && friend) {
    const fk = friend.key;
    const fp = (pose: string) => Object.assign(new Image(), { src: `./images/game/hero/${fk}-${pose}.webp` });
    heroPics.rival = { front: fp('front'), shoot: fp('shoot'), hurt: fp('hurt'), cheer: fp('cheer'), down: fp('down') };
  }
  boardEnded = null;
  boardTime = 0;
  boardBanked = false;
  boardShown = '';
  boardKey = '';
  boardDrag = null;
  boardUi.hidden = false;
  audio.setSong(save.song);
  audio.setWorld(world);
  audio.start();
  audio.setIntensity(0.3);
  flash(net ? t('onlineVs', { name: esc(net.online.rivalName) }) : t('boardStart', { n: world }));
  // How to merge and sell, once, instead of a line in the shop that took room from the board.
  window.setTimeout(() => { if (board?.phase === 'prep' && board.round === 1) flash(t(board.variant === 'tactics' ? 'boardHintT' : 'boardHint')); }, 1900);
  renderBoardUi();
}
/** Leaves the board for the menu or the map (nothing banked: the end screen already banked it, or the player quit). */
function endBoard() {
  if (!board) return;
  clearBoardInteraction();
  if (board.online && board.phase !== 'over' && board.phase !== 'won') netSend({ t: 'quit' });
  board = null;
  boardDrag = null;
  boardUi.hidden = true;
  boardFloat.hidden = true;
  closeGearPanel();
}
/** Banks a finished board run, once: coins, the world's record, a world opened, the totals. */
function bankBoard(b: BoardGame): number | null {
  if (boardBanked) return null;
  boardBanked = true;
  const won = b.phase === 'won';
  if (b.online) {
    // Against a person: the coins and the time, but no record and no world opened.
    save.coins += Math.round(boardCoins(b) * (1 + masteries() * 0.05));
    save.playTime = (save.playTime || 0) + boardTime;
    persist();
    return null;
  }
  const records = b.variant === 'tactics' ? save.boardBestT : save.boardBest;
  const best = records[b.world];
  const reach = won ? ROUNDS : b.round;
  if (!best || (won && !best.won) || (!best.won && reach > best.round)) records[b.world] = { round: reach, won: won || !!best?.won };
  const coins = Math.round(boardCoins(b) * (1 + masteries() * 0.05));
  save.coins += coins;
  save.runs += 1;
  save.playTime = (save.playTime || 0) + boardTime;
  let unlocked: number | null = null;
  if (won && b.world < WORLD_COUNT && save.boardUnlocked < b.world + 1) {
    save.boardUnlocked = b.world + 1;
    save.boardWorld = b.world + 1;
    unlocked = b.world + 1;
  }
  persist();
  return unlocked;
}

const boardPic = (tier: number, cast: number) => {
  const mid = tier === 3 ? MID_ART[castLook(cast)] : undefined;
  const boss = tier >= 4 ? FINAL_ID[cast - 1] : mid;
  return boss ? `./images/game/bosses/${boss}-0.webp` : `./images/game/enemies/${castLook(cast)}-${TIER_KIND[tier]}-0.webp`;
};
const boardTierName = (tier: number) => t(`boardTier${tier}` as Key);
const BOARD_CARD_NAMES: Record<number, [Key, Key, Key]> = {
  1: ['boardCard1Bug', 'boardCard1Ticket', 'boardCard1Legacy'],
  2: ['boardCard2Bug', 'boardCard2Ticket', 'boardCard2Legacy'],
  3: ['boardCard3Bug', 'boardCard3Ticket', 'boardCard3Legacy'],
  4: ['boardCard4Bug', 'boardCard4Ticket', 'boardCard4Legacy'],
  5: ['boardCard5Bug', 'boardCard5Ticket', 'boardCard5Legacy'],
  6: ['boardCard6Bug', 'boardCard6Ticket', 'boardCard6Legacy'],
  7: ['boardCard7Bug', 'boardCard7Ticket', 'boardCard7Legacy'],
  8: ['boardCard8Bug', 'boardCard8Ticket', 'boardCard8Legacy'],
  9: ['boardCard9Bug', 'boardCard9Ticket', 'boardCard9Legacy'],
};
const BOARD_SUBBOSS_NAMES: Record<number, Key> = {
  1: 'bossOriginal', 2: 'bossDemon', 3: 'bossViking', 4: 'bossMud', 5: 'bossJungle',
  6: 'bossGreek', 7: 'bossRobot', 8: 'bossNightmare', 9: 'bossCore',
};
const BOARD_FINAL_NAMES: Record<number, Key> = {
  1: 'finalKernel', 2: 'finalArchdemon', 3: 'finalDrakkar', 4: 'finalMedusa', 5: 'finalQueen',
  6: 'finalZeus', 7: 'finalMech', 8: 'finalWraith', 9: 'finalChimera',
};
function boardCharacterName(tier: number, cast: number) {
  if (tier < 3) {
    const names = BOARD_CARD_NAMES[cast];
    if (names) return t(names[tier] ?? names[0]);
  }
  if (tier === 3 && BOARD_SUBBOSS_NAMES[cast]) return t(BOARD_SUBBOSS_NAMES[cast]);
  if (cast === 3 && tier >= 5) return t('finalValdur');
  if (cast === 4 && tier >= 5) return t('boardAwakenedMedusa');
  return BOARD_FINAL_NAMES[cast] ? t(BOARD_FINAL_NAMES[cast]) : boardTierName(tier);
}
function boardTooltipHtml(b: BoardGame, piece: Piece, stats = unitStats(b, piece), enemy = false) {
  const locale = lang === 'es' ? 'es-ES' : 'en-US';
  const number = (value: number) => Math.round(value).toLocaleString(locale);
  const rate = stats.rate.toLocaleString(locale, { maximumFractionDigits: 1 });
  const details: string[] = [];
  if (stats.ability) {
    const level = Math.max(0, Math.min(2, stats.synLv - 1));
    const percent = bonusPercent(ABIL_V[stats.ability][level]);
    details.push(`<section><b>${t(`boardAbil${cap(stats.ability)}` as Key)}</b><p>${t(`boardAbil${cap(stats.ability)}Text` as Key, { n: percent })}</p></section>`);
  } else if (b.variant === 'fusion' && !enemy) {
    const synergy = synergies(b).find((x) => x.cast === piece.cast);
    if (synergy?.lv) {
      const percent = bonusPercent(SYNERGY.v[piece.cast][synergy.lv - 1]);
      details.push(`<section><b>${worldName(piece.cast)}</b><p>${t(`boardSyn${piece.cast}` as Key, { n: percent })}</p></section>`);
    } else details.push(`<section><b>${worldName(piece.cast)}</b><p>${t('boardSynergyUnlock')}</p></section>`);
  }
  if (stats.kit) {
    details.push(`<section><b>${t(`boardBossMove${cap(stats.kit.move)}` as Key)}</b><p>${t(`boardBossMove${cap(stats.kit.move)}Text` as Key)}</p></section>`);
    if (stats.kit.signature) details.push(`<section><b>${t(`boardBossSig${cap(stats.kit.signature)}` as Key)}</b><p>${t(`boardBossSig${cap(stats.kit.signature)}Text` as Key)}</p></section>`);
  } else if (piece.tier === 1) details.push(`<section><b>${t('boardSpecialRange')}</b><p>${t('boardSpecialThrower')}</p></section>`);
  else if (piece.tier === 2) details.push(`<section><b>${t('boardSpecialHeavy')}</b><p>${t('boardSpecialHeavyText')}</p></section>`);

  const rarity = b.variant === 'tactics' ? `<small>${t(`boardRarity${piece.tier}` as Key)} · ${'★'.repeat(piece.star ?? 1)}</small>` : '';
  const splash = stats.splash ? `<div><small>${t('boardStatSplash')}</small><b>${(stats.splash / CELL).toLocaleString(locale, { maximumFractionDigits: 1 })} ${t('boardStatTiles')}</b></div>` : '';
  const characterName = boardCharacterName(piece.tier, piece.cast);
  return `<div class="board-tip-head"><img src="${boardPic(piece.tier, piece.cast)}" alt=""><span><b>${characterName}</b><small>${worldName(piece.cast)}${rarity ? ` · ${rarity}` : ''}</small></span></div>
    <div class="board-tip-stats">
      <div><small>${t('boardStatHealth')}</small><b>${number(stats.maxHp)}</b></div>
      <div><small>${t('boardStatDamage')}</small><b>${number(stats.dmg)}</b></div>
      <div><small>${t('boardStatDps')}</small><b>${number(stats.dmg * stats.rate)}</b></div>
      <div><small>${t('boardStatRate')}</small><b>${rate}/s</b></div>
      <div><small>${t('boardStatRange')}</small><b>${(stats.range / CELL).toLocaleString(locale, { maximumFractionDigits: 1 })} ${t('boardStatTiles')}</b></div>
      <div><small>${t('boardStatSpeed')}</small><b>${number(stats.speed)}</b></div>${splash}
    </div><div class="board-tip-details">${details.join('')}</div>`;
}
function showBoardTooltip(b: BoardGame, piece: Piece, x: number, y: number, stats?: ReturnType<typeof unitStats>, enemy = false) {
  boardTooltip.innerHTML = boardTooltipHtml(b, piece, stats ?? unitStats(b, piece), enemy);
  boardTooltip.hidden = false;
  const box = boardTooltip.getBoundingClientRect();
  const left = Math.max(8, Math.min(x + 14, window.innerWidth - box.width - 8));
  const above = y - box.height - 16;
  const top = above >= 8 ? above : Math.min(window.innerHeight - box.height - 8, y + 16);
  boardTooltip.style.left = `${Math.round(left)}px`;
  boardTooltip.style.top = `${Math.round(Math.max(8, top))}px`;
}
function hideBoardTooltip() { boardTooltip.hidden = true; }
const boardCastIcon = (cast: number) => save.retro ? ABILITY_ICON[ABILITY[cast]] : `<img src="./images/game/${ABILITY_PIC[ABILITY[cast]]}" alt="">`;
const boardPortraits = new Map<string, string>();
/** Boss sheets reserve transparent space for attacks; cards only need the standing figure. */
function fitBoardPortraits() {
  boardShop.querySelectorAll<HTMLImageElement>('.board-card.is-boss > img').forEach((img) => {
    const src = img.getAttribute('src')!;
    const cached = boardPortraits.get(src);
    if (cached) { img.src = cached; return; }
    const fit = () => {
      if (!img.isConnected || !img.naturalWidth) return;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] <= 32) continue;
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      if (right < left) return;
      const crop = document.createElement('canvas');
      crop.width = right - left + 1; crop.height = bottom - top + 1;
      crop.getContext('2d')?.drawImage(canvas, left, top, crop.width, crop.height, 0, 0, crop.width, crop.height);
      const portrait = crop.toDataURL();
      boardPortraits.set(src, portrait);
      img.src = portrait;
    };
    if (img.complete) fit(); else img.addEventListener('load', fit, { once: true });
  });
}

/** The round's event and the active gifts, using the same icon in the sidebar and its details panel. */
const bonusPercent = (v: number) => Math.round(v * 1000) / 10;
const EVENT_PIC: Record<string, string> = { gold: 'ui/wheel/coins.webp', frenzy: 'skills/rage.webp', giants: 'skills/giant.webp', bounty: 'ui/wheel/coins.webp' };
function boardBonuses(b: BoardGame) {
  const out: { pic: string; name: string; text: string; count: string; on: boolean; event: boolean; cast: number }[] = [];
  if (b.event) out.push({ pic: EVENT_PIC[b.event], name: t(`boardEvent${cap(b.event)}` as Key), text: t(`boardEvent${cap(b.event)}Text` as Key), count: '⭐', on: true, event: true, cast: 0 });
  if (b.variant === 'tactics') {
    // Tactics: every world on the board brings its ability, stronger with three and five of it.
    for (const x of synergies(b).filter((y) => y.n >= 1)) {
      const ab = ABILITY[x.cast];
      const values = ABIL_V[ab].map(bonusPercent);
      const levels = t('boardBonusLevelsT', { base: values[0], duo: values[1], five: values[2] });
      // The rail counter belongs to this world, not to the whole army. The
      // five-unit team threshold is still global; this number shows how much
      // of the deployed composition comes from the ability/world being shown.
      const worldProgress = `${Math.min(x.n, SYNERGY.need[1])}/${SYNERGY.need[1]}`;
      out.push({ pic: ABILITY_PIC[ab], name: `${t(`boardAbil${cap(ab)}` as Key)} · ${worldName(x.cast)}`, text: `${t(`boardAbil${cap(ab)}Text` as Key, { n: values[x.lv] })} ${levels}`, count: worldProgress, on: true, event: false, cast: x.cast });
    }
    return out;
  }
  for (const x of synergies(b)) {
    const need = x.lv >= 1 ? SYNERGY.need[1] : SYNERGY.need[0];
    const values = SYNERGY.v[x.cast].map(bonusPercent);
    const levels = t('boardBonusLevels', { three: values[0], five: values[1] });
    const active = x.lv ? '' : `${t('boardBonusInactive')} `;
    out.push({ pic: SYNERGY_PIC[x.cast], name: worldName(x.cast), text: `${active}${t(`boardSyn${x.cast}` as Key, { n: values[Math.max(0, x.lv - 1)] })} ${levels}`, count: x.lv >= 2 ? `${x.n} ★★` : `${x.n}/${need}`, on: x.lv > 0, event: false, cast: x.cast });
  }
  return out;
}
/** The bonuses' panel: the run's skills panel, with each one's medallion, name, count and what it does. */
function openBoardBonus() {
  const b = board;
  if (!b) return;
  const rows = boardBonuses(b).map((x) => `<li class="${x.on ? '' : 'is-off '}${x.cast ? `is-world-${x.cast}` : 'is-event'}"><span class="gp-icon"><img src="./images/game/${x.pic}" alt="" width="34" height="34"></span><span class="gp-copy"><b>${x.name}</b><small>${x.text}</small></span><em>${x.count}</em></li>`).join('');
  gearPanel.innerHTML = `<header><b>${t('boardBonusTitle')}</b><button type="button" class="gp-close" aria-label="${t('resume')}">✕</button></header>
    <ul>${rows}</ul><p class="gp-hint">${b.variant === 'tactics' ? t('boardBonusHintT') : t('boardBonusHint', { need: SYNERGY.need[0], more: SYNERGY.need[1] })}</p>`;
  positionBoardBonusPanel();
  gearPanel.hidden = false;
  gearPanel.classList.add('fade-scroll', 'is-board');
  fadeEdges(gearPanel);
  paused = true;
}

function positionBoardBonusPanel() {
  const box = boardSide.getBoundingClientRect();
  const panelTop = Math.max(8, Math.min(box.top, window.innerHeight - 120));
  gearPanel.style.top = `${Math.round(panelTop)}px`;
  gearPanel.style.setProperty('--board-panel-top', `${Math.round(panelTop)}px`);
  const panelWidth = Math.min(300, window.innerWidth - 80);
  const sideOnRight = !window.matchMedia('(min-width: 900px) and (orientation: landscape)').matches;
  const left = sideOnRight ? box.left - panelWidth - 8 : box.right + 8;
  const safeLeft = Math.max(8, Math.min(left, window.innerWidth - panelWidth - 8));
  gearPanel.style.right = `${Math.round(window.innerWidth - safeLeft - panelWidth)}px`;
}

/** The top bar and the shop, rebuilt only when something on them changes. */
/** Each sheet's pictures carry their own empty margin under the feet and round the figure, so on the bench a
    picture is cropped to what shows (alpha over 40) before it is stood on its seat: their feet then share one line. */
const trimmedPics = new Map<string, string>();
function trimPic(img: HTMLImageElement) {
  const src = img.dataset.trim;
  if (!src) return;
  const done = trimmedPics.get(src);
  if (done) { if (img.getAttribute('src') !== done) img.src = done; return; }
  const pic = new Image();
  pic.onload = () => {
    const w = pic.naturalWidth, h = pic.naturalHeight;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    if (!x) return;
    x.drawImage(pic, 0, 0);
    const d = x.getImageData(0, 0, w, h).data;
    let l = w, r = -1, top = h, bot = -1;
    for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) if (d[(y * w + i) * 4 + 3] > 40) { if (i < l) l = i; if (i > r) r = i; if (y < top) top = y; if (y > bot) bot = y; }
    if (r < l) return;
    const o = document.createElement('canvas');
    o.width = r - l + 1; o.height = bot - top + 1;
    o.getContext('2d')?.drawImage(c, l, top, o.width, o.height, 0, 0, o.width, o.height);
    const url = o.toDataURL('image/png');
    trimmedPics.set(src, url);
    boardBenchEl.querySelectorAll<HTMLImageElement>(`img[data-trim="${src}"]`).forEach((el) => { el.src = url; });
  };
  pic.src = src;
}
/** The Tactics bench: one four-seat bench per world (`ui/bench/bench-N.webp`, 640 wide), its height and how far down
    its seats' middle lies, so the reserves stand on them. */
const BENCH_ART: Record<number, [number, number]> = { 1: [271, 0.38], 2: [332, 0.35], 3: [277, 0.38], 4: [270, 0.32], 5: [277, 0.37], 6: [280, 0.36], 7: [295, 0.3], 8: [329, 0.39], 9: [309, 0.43] };
const benchStyle = (world: number) => { const [h, y] = BENCH_ART[world] ?? BENCH_ART[1]; return `--bench: url('/images/game/ui/bench/bench-${world}.webp'); --bench-ar: ${(640 / h).toFixed(4)}; --seat-y: ${y}`; };
function renderBoardUi() {
  const b = board;
  if (!b) return;
  const prep = b.phase === 'prep';
  const speedUp = b.phase === 'fight' && b.time >= BOARD_FAST_AFTER;
  const syns = synergies(b);
  const key = [b.phase, b.round, b.lives, b.gold, b.autoMerge, b.autoBought, b.army.map((p) => `${p.tier}${p.cast}${p.star ?? 1}`).sort().join(','), b.bench.map((p) => `${p.tier}${p.cast}${p.star ?? 1}`).join(','), b.shop.map((o) => (o ? `${o.tier}${o.cast}${o.price}` : '-')).join(''), b.army.length, speedUp, boardFast, b.skillUsed, b.online?.waiting, syns.map((x) => `${x.cast}${x.n}`).join(''), b.event, boardShopPopSerial].join('|');
  if (key === boardKey) return;
  boardKey = key;
  // The game's own pieces: the painted coins, the shop's orange item frame for the
  // cards and the dialogs' bars for the buttons (the emoji and plain shapes stay for retro).
  const coin = save.retro ? '◉' : COIN_PIC;
  // Against a person, once your army is sent the button waits for the rival's.
  const go = b.online?.waiting ? `⏳ ${linkedName('onlineWaitRival')}` : `⚔️ ${t('boardFight')}`;
  // The same pieces as a run's HUD: the round back button, the world's plate with its emblem, the coins' plate and
  // the round pause button (the hearts are over the commanders, the units over the shop's first card).
  boardTop.style.setProperty('--icon', JSON.stringify(WORLD_ICON[b.world - 1]));
  boardTop.innerHTML = `
    <button class="hud-back" type="button" data-bact="quit" aria-label="${t('menu')}"><span aria-hidden="true">←</span></button>
    <span class="hud-room">${t('worldShort', { n: b.world })} · ${t('boardRound', { n: b.round, total: ROUNDS })}</span>
    <span class="hud-coins" aria-label="${t('boardGoldLabel')}"><span class="hud-coin-orb" aria-hidden="true">🪙</span><b>${b.gold}</b></span>
    <button class="hud-pause" type="button" data-bact="pause" aria-label="${t('pause')}"><span aria-hidden="true">Ⅱ</span></button>`;
  // Tactics: buying the second copy at ★1 upgrades it; highlight the matching card with ★↑.
  const starsUp = (o: { tier: number; cast: number }) => [...b.army, ...b.bench].filter((p) => p.tier === o.tier && p.cast === o.cast && (p.star ?? 1) === 1).length >= TACTICS.copies - 1;
  // Fusion has no cards: «Summon» drops a unit straight onto the board; the cards are Tactics' only.
  const fusion = b.variant === 'fusion';
  const cards = b.shop.map((o, i) => o
    ? `<button class="board-card${b.variant === 'tactics' ? ` is-r${o.tier}${starsUp(o) ? ' is-up' : ''}${o.cast === b.world ? ' is-native' : ''}` : ''}${o.tier >= 3 ? ' is-boss' : ''}" type="button" data-bact="buy" data-i="${i}"${!prep ? ' disabled' : b.gold < o.price ? ' aria-disabled="true"' : ''}><i class="board-cast">${b.variant === 'tactics' ? boardCastIcon(o.cast) : t('worldShort', { n: o.cast })}</i><img src="${boardPic(o.tier, o.cast)}" alt="">${b.variant === 'tactics' && o.cast === b.world ? `<em class="board-native-bonus">+${Math.round(NATIVE_WORLD_BONUS * 100)}%</em>` : ''}${b.variant === 'tactics' && starsUp(o) ? '<em class="board-up">★↑</em>' : ''}<b>${boardCharacterName(o.tier, o.cast)}</b><span class="board-price">${coin} ${o.price}</span></button>`
    : '<span class="board-card is-sold"></span>').join('');
  const capLabel = `<span class="board-count" aria-label="${t('boardCapLabel')}">♟ ${b.army.length}/${armyCap(b.round)}</span>`;
  const bench = !fusion ? `<div class="board-bench-head"><span class="board-life${b.lives <= 3 ? ' is-low' : ''}" aria-label="${t('boardLives', { n: b.lives })}">${save.retro ? '❤' : '<img src="./images/game/fx/heart.webp" alt="">'}×${b.lives}</span><small class="board-bench-title">${t('boardBench')} · ${b.bench.length}/${BENCH_CAP}</small>${capLabel}</div><div class="board-bench-slots" style="${benchStyle(b.world)}">${Array.from({ length: BENCH_CAP }, (_, seat) => { const p = b.bench.find((q) => q.slot.r === seat); const i = p ? b.bench.indexOf(p) : -1; return p
    ? `<button type="button" class="board-bench-slot is-world-${p.cast} is-t${p.tier}" data-seat="${seat}" data-bact="bench-deploy" data-i="${i}" aria-label="${t('boardBenchDeploy', { name: boardCharacterName(p.tier, p.cast) })}"${!prep || b.online?.waiting ? ' disabled' : ''}><img data-trim="${boardPic(p.tier, p.cast)}" src="${trimmedPics.get(boardPic(p.tier, p.cast)) ?? boardPic(p.tier, p.cast)}" alt=""><em class="bench-stars is-s${p.star ?? 1}">${'<i></i>'.repeat(p.star ?? 1)}</em></button>`
    : `<span class="board-bench-slot is-empty" data-seat="${seat}"></span>`; }).join('')}</div>` : '';
  // The bench stays in view through the fight too, its reserves dimmed (they do not fight).
  boardBenchEl.hidden = fusion || !(prep || b.phase === 'fight');
  boardBenchEl.setAttribute('aria-label', t('boardBench'));
  boardBenchEl.innerHTML = bench;
  boardBenchEl.querySelectorAll<HTMLImageElement>('img[data-trim]').forEach(trimPic);
  // The round's event and each world's synergy, a column of medallions by the board edge; a tap lists their effects.
  const bonus = boardBonuses(b);
  boardSide.innerHTML = bonus.map((x) => `<button class="board-bonus${x.on ? ' is-on' : ' is-off'}${x.event ? ' is-event' : ''}${x.cast ? ` is-world-${x.cast}` : ''}" type="button" data-bact="bonus" aria-label="${x.name}"><img src="./images/game/${x.pic}" alt=""><small>${x.count}</small></button>`).join('');
  const trayActs = boardMobileActs.querySelector<HTMLElement>('.board-acts');
  if (trayActs) boardShop.append(trayActs);
  boardShop.innerHTML = `${prep ? `
    <div class="board-row">${capLabel}</div>
    <div class="board-sellzone">
      ${fusion ? '' : `<div class="board-cards">${cards}</div>`}
      <b class="board-sell-price" aria-hidden="true"></b>
    </div>
    <div class="board-acts">
      ${fusion ? `<button class="board-auto${b.autoMerge ? ' is-on' : b.autoBought ? ' is-off' : ''}" type="button" data-bact="auto" aria-pressed="${b.autoMerge}"${!b.autoBought && b.gold < autoMergePrice(b) ? ' aria-disabled="true"' : ''} aria-label="${t('boardAuto')}"><i aria-hidden="true"></i>${b.autoBought ? '' : `<small>${coin} ${autoMergePrice(b)}</small>`}</button>` : ''}
      ${fusion
        ? `<button class="ghost board-reroll board-summon" type="button" data-bact="summon"${b.gold < summonPrice(b) ? ' disabled' : ''}>✨ ${t('boardSummon')} · ${coin} ${summonPrice(b)}</button>
           <button class="primary board-go" type="button" data-bact="fight"${canFight(b) && !b.online?.waiting ? '' : ' disabled'}>${go}</button>`
        : `<button class="ghost board-reroll" type="button" data-bact="reroll"${b.gold < 1 ? ' disabled' : ''}>🎲 ${t('boardReroll')} · ${coin} 1</button>
           <button class="primary board-go" type="button" data-bact="fight"${canFight(b) && !b.online?.waiting ? '' : ' disabled'}>${go}</button>`}
    </div>` : `<div class="board-fight-row">${b.online ? '' : `<button class="board-skill" type="button" data-bact="skill"${b.skillUsed ? ' disabled' : ''} aria-label="${t('boardSkill')}">${save.retro ? '🔥' : '<img src="./images/game/skills/fireball.webp" alt="">'}</button>`}<p class="board-fighting">${t('boardFighting')}</p>${speedUp ? `<button class="board-speed${boardFast ? ' is-on' : ''}" type="button" data-bact="speed" aria-pressed="${boardFast}" aria-label="${t('boardSpeed')}">${boardFast ? '×1' : '×2'}</button>` : ''}</div>`}`;
  if (boardShopPopSlot >= 0 && b.variant === 'tactics') {
    boardShop.querySelectorAll<HTMLButtonElement>('.board-card[data-i]').forEach((card) => {
      if (Number(card.dataset.i) === boardShopPopSlot) card.classList.add('is-pop');
    });
    boardShopPopSlot = -1;
  }
  if (prep && !fusion) fitBoardPortraits();
}

/** Mobile Tactics: reserves above the shop; round buttons stay beside the shop cards. */
function syncBoardMobileTray() {
  const b = board;
  if (!b) return;
  const mobileTactics = window.matchMedia('(max-width: 899px)').matches && b.variant === 'tactics';
  const mobileTray = mobileTactics && (b.phase === 'prep' || b.phase === 'fight');
  const acts = boardMobileActs.querySelector<HTMLElement>('.board-acts') ?? boardShop.querySelector<HTMLElement>('.board-acts');
  boardMobileTray.classList.toggle('is-active', mobileTray);
  boardMobileTray.classList.toggle('is-fighting', mobileTray && b.phase === 'fight');
  boardShop.classList.toggle('is-mobile-tactics', mobileTray);
  if (acts && acts.parentElement !== boardShop) boardShop.append(acts);
}

/* Tactics: a shop card can also be dragged onto a cell of your half, where it lands (a tap still buys it onto the
   first free cell from the back). The card's unit follows the finger on the float canvas, the cell under it lit. */
let cardDown: { i: number; x: number; y: number; id: number; offer: NonNullable<BoardGame['shop'][number]>; canBuy: boolean; moved: boolean; held: boolean; timer: number } | null = null;
let cardClickBlockUntil = 0;
boardBenchEl.addEventListener('pointerdown', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-bact="bench-deploy"]');
  const b = board;
  // The bench's seats reach over the board's last row: a unit standing there is the board's to drag.
  if (b && b.phase === 'prep') {
    const r = canvas.getBoundingClientRect();
    const cell = slotAt(boardLay, event.clientX - r.left, event.clientY - r.top);
    if (cell && pieceAt(b, cell)) {
      event.preventDefault();
      event.stopPropagation();
      canvas.setPointerCapture(event.pointerId);
      boardPointerDown(event);
      return;
    }
  }
  if (!button || !b || b.phase !== 'prep' || b.online?.waiting || boardDown || cardDown || event.button !== 0) return;
  const piece = b.bench[Number(button.dataset.i)];
  if (!piece) return;
  event.preventDefault();
  hideBoardTooltip();
  const rect = canvas.getBoundingClientRect();
  boardDown = { x: event.clientX - rect.left, y: event.clientY - rect.top, id: event.pointerId, piece, inspection: null, moved: false, fromBench: true };
  canvas.setPointerCapture(event.pointerId);
});

boardUi.addEventListener('pointerdown', (event) => {
  const card = (event.target as HTMLElement).closest<HTMLButtonElement>('.board-card[data-i]');
  const b = board;
  if (!card || !b || b.variant !== 'tactics' || b.phase !== 'prep' || cardDown || boardDown) return;
  const i = Number(card.dataset.i);
  const offer = b.shop[i];
  if (!offer) return;
  event.preventDefault(); // or the card's picture starts the browser's own drag, which cancels the pointer
  const down = cardDown = { i, x: event.clientX, y: event.clientY, id: event.pointerId, offer, canBuy: !card.hasAttribute('aria-disabled'), moved: false, held: false, timer: 0 };
  down.timer = window.setTimeout(() => {
    if (cardDown !== down || down.moved || board !== b || b.phase !== 'prep') return;
    markBoardPressHeld(down);
    showBoardTooltip(b, { id: -1, tier: offer.tier, cast: offer.cast, slot: { c: -1, r: -1 }, star: 1 }, event.clientX, event.clientY);
  }, 520);
  cardClickBlockUntil = 0;
});
window.addEventListener('pointermove', (event) => {
  const b = board;
  if (!cardDown || !b || event.pointerId !== cardDown.id) return;
  const down = cardDown;
  const offer = down.offer;
  if (!down.moved && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 10) return;
  if (!down.canBuy) return;
  if (!down.moved) { down.moved = true; window.clearTimeout(down.timer); hideBoardTooltip(); }
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left, y = event.clientY - rect.top;
  boardDrag = { piece: { id: -1, tier: offer.tier, cast: offer.cast, slot: { c: -1, r: -1 }, star: 1 }, x, y, over: slotAt(boardLay, x, y) };
});
window.addEventListener('pointerup', (event) => {
  const b = board;
  const down = cardDown;
  if (!down || event.pointerId !== down.id) return;
  cardDown = null;
  window.clearTimeout(down.timer);
  hideBoardTooltip();
  if (down.held || down.moved) cardClickBlockUntil = performance.now() + 350;
  if (!b || !down.moved || !down.canBuy) { boardDrag = null; return; }
  const seat = b.variant === 'tactics' ? benchSeatAt(event.clientX, event.clientY) : -1;
  const over = seat >= 0 ? { c: -1, r: seat } : boardDrag?.over;
  boardDrag = null;
  const offer = b.shop[down.i];
  if (!over || !offer) return;
  if (b.gold < offer.price) { flash(t('boardNoGold')); return; }
  if (boardBuy(b, down.i, over)) afterBuy(b, down.i);
  else flash(t('boardBenchFull'));
  boardKey = '';
  renderBoardUi();
  syncBoardMobileTray();
});
window.addEventListener('pointercancel', (event) => cancelBoardPointer(event));
function clearBoardInteraction() {
  if (cardDown) window.clearTimeout(cardDown.timer);
  boardDown = null; cardDown = null; boardDrag = null; cardClickBlockUntil = 0;
  boardUi.classList.remove('is-dragging', 'is-selling', 'is-benching');
  boardFloat.hidden = true;
  hideBoardTooltip();
}
function cancelBoardPointer(event: PointerEvent) {
  if (boardDown?.id === event.pointerId) { boardDown = null; boardDrag = null; }
  if (cardDown?.id === event.pointerId) { window.clearTimeout(cardDown.timer); cardDown = null; boardDrag = null; }
  boardUi.classList.remove('is-dragging', 'is-selling', 'is-benching');
  hideBoardTooltip();
}
/** After a card is bought: its star upgrade with the smoke, or a pick sound. */
function afterBuy(b: BoardGame, shopIndex?: number) {
  if (b.variant === 'tactics' && shopIndex !== undefined) {
    boardShopPopSlot = shopIndex;
    boardShopPopSerial += 1;
  }
  if (b.lastMerge) {
    const m = b.lastMerge;
    b.lastMerge = null;
    boardMerged(m.slot, m.id, performance.now() / 1000);
    audio.play('zip');
    const name = boardTierName(pieceAt(b, m.slot)?.tier ?? 0);
    flash(m.star ? t('boardStarUp', { name, star: '★'.repeat(m.star) }) : m.combo > 1 ? t('boardCombo', { n: m.combo, name }) : t('boardMerged', { name }));
  } else audio.play('pick');
}
boardUi.addEventListener('click', (event) => {
  const el = (event.target as HTMLElement).closest<HTMLElement>('[data-bact]');
  const b = board;
  if (!el || !b) return;
  // Waiting for the rival: the army already sent can no longer change.
  if (b.online?.waiting && !['quit', 'pause', 'bonus'].includes(el.dataset.bact ?? '')) return;
  // The click that ends a card's drag is not a tap.
  if (['buy', 'bench-deploy'].includes(el.dataset.bact ?? '') && performance.now() <= cardClickBlockUntil) {
    cardClickBlockUntil = 0; event.preventDefault(); return;
  }
  audio.unlock();
  const act = el.dataset.bact;
  if (act === 'bench-deploy') {
    if (!deployBench(b, Number(el.dataset.i))) flash(t('boardBenchNoRoom'));
  } else if (act === 'buy') {
    const index = Number(el.dataset.i);
    const offer = b.shop[index];
    if (offer && b.gold < offer.price) flash(t('boardNoGold'));
    else if (!boardBuy(b, index)) flash(t('boardBenchFull'));
    else afterBuy(b, index);
  } else if (act === 'reroll') { if (boardReroll(b)) audio.play('click'); }
  else if (act === 'auto') {
    if (b.autoBought) { toggleAutoMerge(b); audio.play('click'); flash(t(b.autoMerge ? 'boardAutoResumed' : 'boardAutoPaused')); }
    else if (b.gold < autoMergePrice(b)) flash(`${t('boardAuto')} · ${t('boardNoGold')}`);
    else if (buyAutoMerge(b)) {
      audio.play('zip');
      flash(t('boardAutoBought'));
    }
  }
  else if (act === 'summon') {
    const r = boardSummon(b);
    if (r === 'gold') flash(t('boardNoGold'));
    else if (r === 'full') flash(t('boardBenchFull'));
    else if (r === 'ok') {
      const now = performance.now() / 1000;
      // The merge, if any, comes a moment later with its lightning (`tickMerge`, in `boardStep`).
      if (b.lastSummon) {
        // A puff where it lands, too, and its name.
        boardMerged(b.lastSummon.slot, b.lastSummon.id, now);
        audio.play('pick');
        const p = pieceAt(b, b.lastSummon.slot);
        if (p && p.tier > 0) flash(t('boardSummoned', { name: boardTierName(p.tier) }));
      }
      b.lastSummon = null;
    }
  }
  else if (act === 'speed') { boardFast = !boardFast; audio.play('click'); }
  else if (act === 'skill') { if (commanderStrike(b)) audio.play('shoot'); }
  else if (act === 'bonus') openBoardBonus();
  else if (act === 'fight' && b.online) {
    if (b.online.waiting || !canFight(b)) return;
    // Your army as it stands goes to the other phone; the fight starts once theirs is in too.
    tickMerge(b, 0, true);
    sentArmy = JSON.parse(JSON.stringify(b.army)) as Piece[];
    b.online.waiting = true;
    netSend({ t: 'ready', round: b.round, army: sentArmy });
    audio.play('click');
    tryOnlineFight();
  }
  else if (act === 'fight') {
    boardFast = false;
    if (startFight(b)) { audio.play('door'); audio.play('slam'); audio.setIntensity(0.7); audio.setBoss(b.round === ROUNDS); }
    else flash(t('boardEmpty'));
  } else if (act === 'quit') { paused = true; boardQuitScreen(); }
  else if (act === 'pause') { paused = true; boardPauseScreen(); }
  renderBoardUi();
});
/** The board's pause: the fight stops (`boardStep` reads `paused`) until it is resumed. */
function boardPauseScreen() {
  show(`<button class="ui-close" type="button" data-act="board-stay" aria-label="${t('resume')}"></button>
    ${head('pause', t('paused'))}
    <button class="ui-opts" type="button" data-act="options-pause" aria-label="${t('options')}"><span aria-hidden="true">⚙</span></button>
    <button class="primary" data-act="board-stay">${t('resume')}</button>
    <button class="ghost is-danger" data-act="board-quit-ask">${t('quit')}</button>`);
}

function boardQuitScreen() {
  show(`<h2>${t('menu')}</h2><p>${t('boardQuit')}</p>
    <button class="ghost is-danger" data-act="board-leave">${t('quit')}</button>
    <button class="primary" data-act="board-stay">${t('cancel')}</button>`);
}

/** After each fight: the round's result, or the end of the run. */
function boardResultScreen(b: BoardGame) {
  const last = b.last;
  if (!last) return;
  if (b.phase === 'over' || b.phase === 'won') {
    const won = b.phase === 'won';
    const unlocked = bankBoard(b);
    const coins = Math.round(boardCoins(b) * (1 + masteries() * 0.05));
    audio.play(won ? 'win' : 'over');
    audio.setBoss(false);
    if (b.online) {
      const draw = b.lives === b.online.rivalLives;
      const titleKey = draw ? undefined : won ? 'onlineWon' : 'onlineLost';
      show(`${head(won ? 'victory' : 'defeat', titleKey ? t(titleKey, { name: esc(b.online.rivalName) }) : t('onlineDraw'), titleKey)}
        <p>❤ ${b.lives} · ${linkedName()} ❤ ${b.online.rivalLives}</p>
        <p class="reward">+${coins} 🪙</p>
        <button class="primary" data-act="board-pick">👥 ${t('onlineAgain')}</button>
        <button class="ghost" data-act="board-leave">← ${t('menu')}</button>`);
      return;
    }
    show(`${head(won ? 'victory' : 'defeat', t(won ? 'boardWon' : 'boardOver'))}
      <p>${t('boardReached', { n: won ? ROUNDS : b.round, total: ROUNDS })}</p>
      <p class="reward">+${coins} 🪙</p>
      ${unlocked ? notice(save.retro ? WORLD_ICON[unlocked - 1] : `<img class="scene-pic" src="./images/game/map/pv-${ISLAND_ART[unlocked - 1]}.jpg" alt="">`, t('unlockedWorld', { n: unlocked }), worldName(unlocked)) : ''}
      ${unlocked ? `<button class="primary is-go" data-act="play-next" data-next="${unlocked}">▶ ${t('nextWorld')}</button>` : `<button class="primary" data-act="board-again">${t('again')}</button>`}
      <button class="ghost" data-act="map">${t('map')}</button>
      <button class="ghost" data-act="menu">← ${t('menu')}</button>`);
    return;
  }
  audio.setBoss(false);
  audio.setIntensity(0.3);
  const win = last.result === 'win';
  show(`${head(win ? 'victory' : 'defeat', t(win ? 'boardWin' : 'boardLoss'))}
    ${last.hp ? `<p>⏱ ${t('boardTimeHp', { a: last.hp[0], b: last.hp[1] })}</p>` : ''}
    ${last.lost ? `<p>${t('boardLost', { n: last.lost })}</p>` : ''}
    ${last.flawless ? `<p class="board-flawless">🎁 ${t('boardFlawless')}</p>` : ''}
    <p class="how">${t('boardGold', { n: roundGold(b.world, win && !last.timeout) + roundBonus(b) })}</p>
    <button class="primary" data-act="board-next">▶ ${t('boardNext')}</button>`);
}

/** One frame of the board: the fight's step, its sounds, the result once it ends, and the picture. */
function boardStep(dt: number, now: number) {
  const b = board;
  if (!b) return;
  if (b.phase === 'fight' && !paused) {
    boardTime += dt;
    // At ×2 the fight takes two steps a frame (the same steps, so it plays out the same, only faster).
    let hit = false;
    let bossCue = false;
    // Against a person the fight goes in fixed steps of 1/60 s, so it plays out the same on both phones whatever
    // their frame rates.
    const fixed = !!b.online;
    if (fixed) boardAcc = Math.min(0.25, boardAcc + dt * (boardFast ? 2 : 1));
    const steps = fixed ? Math.floor(boardAcc / ONLINE_STEP) : boardFast ? 2 : 1;
    if (fixed) boardAcc -= steps * ONLINE_STEP;
    for (let i = 0; i < steps && b.phase === 'fight'; i++) {
      updateBoard(b, fixed ? ONLINE_STEP : dt);
      for (const e of b.events) {
        if ((e === 'bite' || e === 'slam') && !hit) { hit = true; audio.play(e === 'slam' ? 'slam' : 'hit'); }
        if (e === 'kill') audio.play('kill');
        if (e === 'throw') audio.play('shoot');
        if (e === 'ring') audio.play('boom');
        if ((e === 'leap' || e === 'charge' || e === 'boss-move' || e === 'boss-signature') && !bossCue) {
          bossCue = true;
          audio.play('boss');
        }
        if (e === 'land') audio.play('slam');
      }
    }
  } else boardTime += b.phase === 'prep' ? dt : 0;
  // Fusion's auto-merge plays out here: the lightning, then the merge with its smoke, its bloop and its name.
  if (b.phase === 'prep' && !paused) {
    // The lightning's crackle as it starts.
    const pend = b.pending ? `${b.pending.a}>${b.pending.b}` : '';
    if (pend && pend !== boardZapped) audio.play('strike');
    boardZapped = pend;
    tickMerge(b, dt);
    if (b.lastMerge) {
      const m = b.lastMerge;
      b.lastMerge = null;
      boardMerged(m.slot, m.id, now / 1000);
      audio.play('zip');
      const name = boardTierName(pieceAt(b, m.slot)?.tier ?? 0);
      flash(m.combo > 1 ? t('boardCombo', { n: m.combo, name }) : t('boardMerged', { name }));
      boardKey = '';
    }
  }
  const shown = `${b.phase}${b.round}${b.lives}`;
  if ((b.phase === 'result' || b.phase === 'over' || b.phase === 'won') && boardShown !== shown) {
    boardShown = shown;
    boardEnded = now / 1000;
    audio.play('shoot');
    window.setTimeout(() => { if (board === b) audio.play('boom'); }, FIREBALL.fly * 1000);
    // A win: a chime as the fireball strikes, and the hero's celebration plays a moment longer before the dialog.
    const won = b.last?.result === 'win';
    if (won) window.setTimeout(() => { if (board === b) audio.play('win'); }, (FIREBALL.fly + 0.1) * 1000);
    window.setTimeout(() => { if (board === b) boardResultScreen(b); }, (FIREBALL.fly + FIREBALL.blast) * 1000 + (won ? 1500 : 450));
  }
  renderBoardUi();
  syncBoardMobileTray();
  // The board between the top bar and the shop.
  const rect = canvas.getBoundingClientRect();
  const top = boardTop.getBoundingClientRect().bottom - rect.top + 6;
  const wide = window.matchMedia('(min-width: 900px) and (orientation: landscape)').matches;
  const shopRect = boardShop.getBoundingClientRect();
  const bottom = wide ? canvas.clientHeight - 8 : shopRect.top - rect.top;
  // The cards sit over the arena's lower edge. Fit its art first, then keep the grid inside its walls.
  const acts = boardShop.querySelector('.board-acts, .board-fighting')?.getBoundingClientRect();
  // Floating desktop controls do not reserve space: the arena stays centred on the full screen.
  const floor = {
    top: top - 6,
    // Fusion's floor ends above its action buttons; Tactics continues behind its shop.
    // Tactics' floor ends at the shop's middle, so the arena's own lower wall shows round the bench, not below the shop.
    bottom: wide ? bottom : b.variant === 'fusion' ? (acts ? acts.top - rect.top - 4 : bottom) : (shopRect.top + shopRect.bottom) / 2 - rect.top,
    controlsTop: acts ? acts.top - rect.top : bottom,
  };
  const fieldWidth = canvas.clientWidth;
  const mobileTactics = !wide && b.variant === 'tactics';
  if (mobileTactics && (b.phase === 'prep' || b.phase === 'fight')) {
    const trayHeight = boardMobileTray.getBoundingClientRect().height;
    boardMobileTray.style.left = `${Math.round(rect.left + 8)}px`;
    boardMobileTray.style.top = `${Math.round(shopRect.top - trayHeight - 4)}px`;
    boardMobileTray.style.width = `${Math.max(0, fieldWidth - 16)}px`;
  }
  // Keep the grid fitted to the playable area above the shop; only the background stretches behind the shop.
  const arena = boardBackdropBounds(b.world, fieldWidth, floor.top, wide ? floor.bottom : bottom - 4);
  const trayRect = mobileTactics && (b.phase === 'prep' || b.phase === 'fight') ? boardMobileTray.getBoundingClientRect() : null;
  // Four reserve slots sit above the shop cards and buttons, with the same combined height.
  const gridBottom = wide ? Math.min(bottom, arena.y + arena.h * 0.96) : trayRect ? Math.min(bottom, trayRect.top - rect.top - 4) : bottom;
  const mobileGridWidth = Math.max(150, fieldWidth - 54);
  const mobileBackdropScale = Math.max(1, fieldWidth / Math.max(1, arena.w));
  boardLay = layoutBoard(
    fieldWidth,
    wide ? Math.max(top, arena.y + arena.h * 0.04) : top,
    gridBottom,
    wide ? arena.w * 0.96 : fieldWidth,
    wide ? 1.25 : 4, // expand the grid into its available space; keep unit art at the board's vertical scale
    wide ? fieldWidth - 448 : mobileGridWidth,
    !wide,
  );
  if (!wide) {
    const gridWidth = COLS * CELL * boardLay.sx;
    boardLay.ox = (fieldWidth - gridWidth) / 2;
  }
  // Phone Tactics: the whole board, its wall too, half a cell lower, over the bench's top.
  if (mobileTactics) boardLay.oy += CELL * boardLay.s * 0.5;
  // Desktop keeps the reserve floating beside the grid. Mobile Tactics owns the
  // reserve through boardMobileTray, so never apply viewport coordinates to its
  // child: when that child is positioned for the caption overlay, left/top would
  // become relative offsets and push the whole bench off-screen.
  const benchInMobileTray = mobileTactics && boardMobileTray.classList.contains('is-active');
  if (!boardBenchEl.hidden && !benchInMobileTray) {
    const box = boardBenchEl.getBoundingClientRect();
    const benchHeight = box.height || 190;
    const boardLeft = rect.left + boardLay.ox;
    const benchWidth = box.width || 300;
    const left = wide ? (boardLeft - benchWidth - 14 > rect.left + 8 ? boardLeft - benchWidth - 14 : boardLeft + 3) : rect.left + 8;
    const halfTop = rect.top + boardLay.oy + HOME_ROW * CELL * boardLay.s;
    const desiredTop = wide
      ? halfTop + Math.max(0, (ROWS - HOME_ROW) * CELL * boardLay.s / 2 - benchHeight / 2)
      : shopRect.top - benchHeight - 4;
    const topPx = wide ? Math.max(rect.top + top + 6, Math.min(desiredTop, rect.bottom - benchHeight - 12)) : desiredTop;
    const pos = `${Math.round(left)}px,${Math.round(topPx)}px`;
    if (boardBenchEl.dataset.at !== pos) {
      boardBenchEl.dataset.at = pos;
      const [x, y] = pos.split(',');
      boardBenchEl.style.left = x;
      boardBenchEl.style.top = y;
    }
  } else if (benchInMobileTray) {
    boardBenchEl.dataset.at = '';
    boardBenchEl.style.left = '';
    boardBenchEl.style.top = '';
  }
  // Bonuses float over the grid's right edge, above the canvas and clear of the shop.
  const wallTop = rect.top + boardLay.oy + (HOME_ROW * CELL - 4) * boardLay.s;
  const sideHeight = `${Math.max(43, wallTop - rect.top - top - 12)}px`;
  if (boardSide.style.maxHeight !== sideHeight) boardSide.style.maxHeight = sideHeight;
  const sideBottom = Math.round(window.innerHeight - wallTop + 8);
  const sideLeft = rect.left + boardLay.ox + COLS * CELL * boardLay.sx - 40;
  const tacticsSide = b.variant === 'tactics';
  const sideAt = tacticsSide ? `right,${sideBottom}px` : `${Math.round(sideLeft)}px,${sideBottom}px`;
  if (boardSide.dataset.at !== sideAt) {
    boardSide.dataset.at = sideAt;
    const [x, y] = sideAt.split(',');
    boardSide.style.left = tacticsSide ? 'auto' : x;
    boardSide.style.right = tacticsSide ? '0px' : 'auto';
    boardSide.style.bottom = y;
    boardSide.style.top = 'auto';
    if (!gearPanel.hidden && gearPanel.classList.contains('is-board')) positionBoardBonusPanel();
  }
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.fillStyle = '#0b0820';
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  if (b.phase === 'prep' || b.phase === 'fight') boardEnded = null;
  // The guest sees the shared fight turned round, its own army at the bottom.
  const seen = b.online?.me === 1 ? mirrorFight(b) : b;
  if (heroPics) drawBoard(ctx, seen, boardLay, now / 1000, boardDrag, save.retro, view.dpr, heroPics, boardEnded === null ? null : now / 1000 - boardEnded, { ...floor, width: fieldWidth, widthScale: wide ? boardLay.sx / boardLay.s : mobileBackdropScale, scene: save.scene === CONVERGENCE_SCENE ? CONVERGENCE_SCENE : 0 }, wide);
  boardFloat.hidden = !boardDrag;
  if (boardDrag || floatDrawn) {
    const w = Math.round(canvas.clientWidth * view.dpr), h = Math.round(canvas.clientHeight * view.dpr);
    if (boardFloat.width !== w || boardFloat.height !== h) { boardFloat.width = w; boardFloat.height = h; }
    drawBoardDrag(floatCtx, boardLay, boardDrag, now / 1000, save.retro, view.dpr, b.variant === 'tactics');
    floatDrawn = !!boardDrag;
  }
}

/* A tap inspects any unit; during preparation your own units can still be dragged, merged and sold. */
function boardPointerDown(event: PointerEvent) {
  const b = board;
  if (!b || boardDown || cardDown) return;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const bx = (x - boardLay.ox) / boardLay.s;
  const by = (y - boardLay.oy) / boardLay.s;
  const spread = boardLay.sx / boardLay.s;
  let piece: Piece | null = null;
  let inspection: BoardInspection | null = null;
  if (b.phase === 'prep') {
    const slot = slotAt(boardLay, x, y);
    piece = (slot && pieceAt(b, slot)) || null;
    if (piece) inspection = { piece, enemy: false };
    else {
      const spot = waveSpots(b).map((enemy) => ({ enemy, bounds: boardUnitBounds({ tier: enemy.tier, star: enemy.star }) }))
        .filter(({ enemy, bounds }) => bx >= enemy.x * spread + bounds.x - 8 && bx <= enemy.x * spread + bounds.x + bounds.w + 8 && by >= enemy.y + bounds.y - 8 && by <= enemy.y + bounds.y + bounds.h + 8)
        .sort((a, c) => Math.hypot(bx - a.enemy.x * spread, by - a.enemy.y) - Math.hypot(bx - c.enemy.x * spread, by - c.enemy.y))[0]?.enemy;
      if (spot) {
        const rivalPiece: Piece = { id: -1, tier: spot.tier, cast: spot.cast, slot: { c: -1, r: -1 }, star: spot.star };
        inspection = { piece: rivalPiece, stats: waveUnitStats(b, spot.tier, spot.cast, spot.star), enemy: true };
      }
    }
  } else if (b.phase === 'fight') {
    const seen = b.online?.me === 1 ? mirrorFight(b) : b;
    const target = seen.fighters.filter((fighter) => !fighter.dead)
      .map((fighter) => ({ fighter, bounds: boardUnitBounds({ tier: fighter.tier, star: b.variant === 'tactics' ? fighter.star : 1 }) }))
      .filter(({ fighter, bounds }) => bx >= fighter.x * spread + bounds.x - 10 && bx <= fighter.x * spread + bounds.x + bounds.w + 10 && by >= fighter.y + bounds.y - 10 && by <= fighter.y + bounds.y + bounds.h + 10)
      .sort((a, c) => Math.hypot(bx - a.fighter.x * spread, by - a.fighter.y) - Math.hypot(bx - c.fighter.x * spread, by - c.fighter.y))[0]?.fighter;
    if (target) {
      const fighterPiece: Piece = { id: target.id, tier: target.tier, cast: target.cast, slot: { c: -1, r: -1 }, star: target.star };
      const base = target.side === 1 ? waveUnitStats(b, target.tier, target.cast, target.star) : unitStats(b, fighterPiece);
      const stats = { ...base, hp: target.hp, maxHp: target.maxHp, dmg: target.dmg, rate: target.rate, range: target.range, speed: target.speed, r: target.r, splash: target.splash, ranged: target.ranged, syn: target.syn, synLv: target.synLv, ability: target.tac ? ABILITY[target.cast] : undefined };
      inspection = { piece: fighterPiece, stats, enemy: target.side === 1 };
    }
  }
  if (!piece && !inspection) return;
  boardDown = { x, y, id: event.pointerId, piece, inspection, moved: false };
  canvas.setPointerCapture(event.pointerId);
}
/** Only the visible cards or Fusion's sell strip accept a sale; the sidebar's height is not a drop target. */
function isBoardSellPoint(clientX: number, clientY: number) {
  const zone = boardShop.querySelector('.board-sellzone');
  if (!zone) return false;
  const rect = zone.getBoundingClientRect();
  const shop = boardShop.getBoundingClientRect();
  // The shop can scroll on shorter screens: do not sell over the clipped part of its cards.
  const left = Math.max(rect.left, shop.left), right = Math.min(rect.right, shop.right);
  const top = Math.max(rect.top, shop.top), bottom = Math.min(rect.bottom, shop.bottom);
  return right > left && bottom > top && clientX >= left && clientX < right && clientY >= top && clientY < bottom;
}
/** The bench seat under a point (its column across the bench), or -1. */
function benchSeatAt(clientX: number, clientY: number) {
  if (boardBenchEl.hidden) return -1;
  for (const el of boardBenchEl.querySelectorAll<HTMLElement>('[data-seat]')) {
    const r = el.getBoundingClientRect();
    if (clientX >= r.left && clientX < r.right && clientY >= r.top && clientY < r.bottom) return Number(el.dataset.seat);
  }
  return -1;
}
function isBoardBenchPoint(clientX: number, clientY: number) {
  if (!board || board.variant !== 'tactics' || board.phase !== 'prep' || boardBenchEl.hidden) return false;
  // Only the seats themselves: the bench's art reaches up over the board's last row, which must stay the board's.
  return benchSeatAt(clientX, clientY) >= 0;
}
function boardPointerMove(event: PointerEvent) {
  const down = boardDown;
  if (!down || event.pointerId !== down.id) return;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (!down.piece) {
    if (!down.moved && Math.hypot(x - down.x, y - down.y) >= 10) down.moved = true;
    return;
  }
  if (!down.moved && Math.hypot(x - down.x, y - down.y) < 10) return;
  if (!down.moved) {
    down.moved = true;
    hideBoardTooltip();
    boardDrag = { piece: down.piece, x, y, over: slotAt(boardLay, x, y) };
  }
  if (!boardDrag) return;
  boardDrag.x = x;
  boardDrag.y = y;
  boardDrag.over = slotAt(boardLay, boardDrag.x, boardDrag.y);
  // The red preview and the completed sale use the same target; a board cell always keeps the unit on the board.
  boardUi.classList.add('is-dragging');
  const benching = isBoardBenchPoint(event.clientX, event.clientY);
  if (benching) boardDrag.over = null;
  const selling = !boardDrag.over && !benching && isBoardSellPoint(event.clientX, event.clientY);
  boardUi.classList.toggle('is-benching', benching);
  boardUi.classList.toggle('is-selling', selling);
  // What it would sell for, in the middle of the red.
  const price = boardShop.querySelector<HTMLElement>('.board-sell-price');
  if (price && board) {
    const text = `+${save.retro ? '◉' : COIN_PIC} ${saleOf(boardDrag.piece, board.variant, board.world)}`;
    if (price.dataset.v !== text) { price.dataset.v = text; price.innerHTML = text; }
  }
}
function boardPointerUp(event: PointerEvent) {
  if (cardDown) return; // a shop card being dragged: its own handler on the window ends it
  const b = board;
  const down = boardDown;
  if (!down || event.pointerId !== down.id) return;
  boardDrag = null;
  boardDown = null;
  boardUi.classList.remove('is-dragging', 'is-selling', 'is-benching');
  if (!b) { hideBoardTooltip(); return; }
  if (down.fromBench) {
    cardClickBlockUntil = performance.now() + 350;
    const index = b.bench.indexOf(down.piece!);
    const rect = canvas.getBoundingClientRect();
    const target = slotAt(boardLay, event.clientX - rect.left, event.clientY - rect.top);
    const onBench = benchSeatAt(event.clientX, event.clientY) >= 0;
    if (!down.moved) {
      if (deployBench(b, index)) audio.play('click');
      else flash(t('boardBenchNoRoom'));
    } else if (!onBench && !target && isBoardSellPoint(event.clientX, event.clientY)) {
      const gain = saleOf(down.piece!, b.variant, b.world);
      if (sellBench(b, index)) { audio.play('coin'); flash(t('boardSold', { n: gain })); }
    } else if (!onBench && target) {
      if (deployBench(b, index, target)) audio.play('click');
      else flash(t('boardBenchNoRoom'));
    } else if (onBench) {
      const seat = benchSeatAt(event.clientX, event.clientY);
      if (seat >= 0 && moveBenchSeat(b, index, seat)) audio.play('click');
    }
    hideBoardTooltip();
    boardKey = '';
    renderBoardUi();
    syncBoardMobileTray();
    return;
  }
  if (!down.moved) {
    if (down.inspection) showBoardTooltip(b, down.inspection.piece, event.clientX, event.clientY, down.inspection.stats, down.inspection.enemy);
    return;
  }
  if (!down.piece) return;
  hideBoardTooltip();
  const drag = { piece: down.piece, over: slotAt(boardLay, event.clientX - canvas.getBoundingClientRect().left, event.clientY - canvas.getBoundingClientRect().top) };
  const from = drag.piece.slot;
  if (isBoardBenchPoint(event.clientX, event.clientY)) {
    if (storeOnBench(b, from, benchSeatAt(event.clientX, event.clientY))) { audio.play('click'); flash(t('boardBench')); }
    else flash(t('boardBenchFull'));
    boardKey = '';
    renderBoardUi();
    syncBoardMobileTray();
    return;
  }
  // Dropped on the shop: sold, for half what it is worth.
  if (!drag.over && isBoardSellPoint(event.clientX, event.clientY)) {
    const gain = saleOf(drag.piece, b.variant, b.world);
    if (boardSell(b, from)) { audio.play('coin'); flash(t('boardSold', { n: gain })); }
    renderBoardUi();
    return;
  }
  if (!drag.over) return;
  const done = moveUnit(b, from, drag.over);
  if (done === 'merged') {
    const merged = pieceAt(b, drag.over);
    if (merged) boardMerged(drag.over, merged.id, performance.now() / 1000);
    audio.play('zip');
    flash(t('boardMerged', { name: boardTierName(merged?.tier ?? 0) }));
  }
  else if (done !== 'none') audio.play('click');
  renderBoardUi();
}

/** With a mouse, a click outside a dialog closes it as its ✕ would (on a touch screen a stray tap could, so not there). */
const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
screen.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('button, [data-act], [data-world]');
  if (!target) {
    if (mouse.matches && !screen.classList.contains('is-menu') && !(event.target as HTMLElement).closest('.panel')) screen.querySelector<HTMLElement>(':scope > .panel > .ui-close')?.click();
    return;
  }
  if (swiped) { swiped = false; return; }
  audio.unlock();
  const act = target.dataset.act;
  if (act !== 'mute') audio.play('click');
  if (act === 'extra-hub') extraHubScreen();
  else if (act === 'siege-preview') (siegeOpen = true, openSiege(t, () => { siegeOpen = false; extraHubScreen(); }, { pic: `/images/game/hero/${heroStill(save.skin, save.equipped.head)}.webp`, name: save.name || DEFAULT_NAME }, (name) => audio.play(name)));
  else if (act === 'play') startRun();
  // The world this run unlocked, in the same mode.
  else if (act === 'play-next') { const n = Number(target.dataset.next); setWorld(n, game?.mode ?? save.mode); persist(); startRun(n, game?.mode ?? save.mode); }
  else if (act === 'play-secret-showcase' || (act === 'play-same' && game?.secret && game.showcase)) { startRun(SECRET_WORLD, 'horde', false, 0, true); if (game) startShowcase(game); flash(t('showcaseStart')); }
  else if (act === 'play-same' && game?.secret) startRun(SECRET_WORLD, 'horde', false, 0, true);
  else if (act === 'play-same') game?.rush ? startRun(1, 'sprints', false, rushWorlds()) : startRun(game?.world ?? worldIn(), game?.mode ?? save.mode, game?.endless);
  else if (act === 'play-rush') startRun(1, 'sprints', false, rushWorlds());
  else if (act === 'play-showcase' || (act === 'play-same' && game?.showcase)) {
    // The showcase: only the picked world's two bosses (the same world again on a replay).
    const w = act === 'play-same' && game ? game.rushFrom : mapPick;
    startRun(w, 'sprints', false, 1, false, w);
    if (game) startShowcase(game);
    flash(t('showcaseStart'));
  }
  else if (act === 'board-next' && board) {
    nextRound(board);
    hide();
    renderBoardUi();
    if (board.event) { audio.play('levelup'); flash(`⭐ ${t(`boardEvent${cap(board.event)}` as Key)}`); }
  }
  else if (act === 'board-again' && board) startBoard(board.world);
  else if (act === 'board-stay') { paused = false; hide(); }
  else if (act === 'board-variant') {
    save.boardVariant = target.dataset.variant === 'tactics' ? 'tactics' : 'fusion';
    persist();
    startBoard(Number(target.dataset.bworld) || worldIn('board'));
  }
  else if (act === 'link') linkScreen();
  else if (act === 'friend-call') callFriend(target.dataset.id ?? '');
  else if (act === 'friend-del') {
    const f = save.friends.find((x) => x.id === target.dataset.id);
    if (!f) return;
    show(`<h2>${t('friendRemove')}</h2><p>${t('friendRemoveAsk', { name: esc(f.name) })}</p>
      <button class="ghost is-danger" type="button" data-act="friend-del-yes" data-id="${f.id}">${t('friendRemove')}</button>
      <button class="primary" type="button" data-act="profile">${t('cancel')}</button>`);
  }
  else if (act === 'friend-del-yes') {
    const id = target.dataset.id ?? '';
    if (friend?.id === id) { const was = friend.name; friend = null; netLeave(); flash(t('linkLost', { name: esc(was) })); }
    // Waiting under your own id again, so they (or anyone) can still find you.
    goOnline();
    save.friends = save.friends.filter((f) => f.id !== id);
    persist();
    profileScreen();
  }
  else if (act === 'share') void shareProfile();
  else if (act === 'link-off') { const was = friend?.name; friend = null; netLeave(); if (was) flash(t('linkLost', { name: esc(was) })); menuScreen(); }
  else if (act === 'link-host') {
    show(`<h2>👥 ${t('onlineHost')}</h2><p class="how">⏳ ${t('onlineMaking')}</p><button class="ghost" data-act="link">${t('cancel')}</button>`);
    hostGame(netHandlers());
  }
  else if (act === 'link-join') {
    const code = cleanCode((document.getElementById('onlineCode') as HTMLInputElement | null)?.value ?? '');
    if (code.length !== 4) { flash(t('onlineCodeLabel')); return; }
    show(`<h2>👥 ${t('onlineJoin')}</h2><p class="how">⏳ ${t('onlineJoining', { code })}</p><button class="ghost" data-act="link">${t('cancel')}</button>`);
    joinGame(code, netHandlers());
  }
  else if (act === 'board-pick') { menuScreen(); boardVariantScreen(worldIn('board')); }
  else if (act === 'invite' && friend) {
    const mode: Together = target.dataset.mode === 'sprints' || target.dataset.mode === 'horde' ? target.dataset.mode : 'board';
    inviting = { mode, variant: target.dataset.variant === 'tactics' ? 'tactics' : 'fusion', world: worldIn(mode), seed: Math.floor(Math.random() * 2 ** 31) };
    netSend({ t: 'invite', ...inviting });
    show(`<div class="friend-card"><span class="friend-pic"><img data-friend-portrait src="./images/game/hero/${friend.still}.webp" alt=""></span><b>${linkedName()}</b></div>
      <p class="how">⏳ ${linkedName('linkWaitAnswer')}</p>
      <button class="ghost" type="button" data-act="invite-cancel">${t('cancel')}</button>`);
  }
  else if (act === 'invite-cancel') { const v = inviting; inviting = null; netSend({ t: 'uninvite' }); if (v?.mode === 'board') boardVariantScreen(worldIn('board')); else linkScreen(); }
  else if (act === 'invite-yes' && invitedBy && friend) {
    const v = invitedBy;
    invitedBy = null;
    netSend({ t: 'accept' });
    startTogether(v.mode, v.variant, v.world, v.seed, 1);
  }
  else if (act === 'invite-no') { invitedBy = null; netSend({ t: 'decline' }); menuScreen(); }
  else if (act === 'board-quit-ask') boardQuitScreen();
  else if (act === 'board-leave' && board) { bankBoard(board); menuScreen(); }
  else if (act === 'secret') secretScreen();
  else if (act === 'play-secret') startRun(SECRET_WORLD, 'horde', false, 0, true);
  else if (act === 'play-nightmare') startRun(NIGHTMARE_WORLD, 'horde', true);
  else if (act === 'mode-prev' || act === 'mode-next') stepMode(act === 'mode-prev' ? -1 : 1);
  else if (act === 'book') { bookPage = 0; if (!save.bookSeen) { save.bookSeen = true; persist(); } bookScreen(); }
  else if (act === 'book-prev' || act === 'book-next') { bookPage += act === 'book-prev' ? -1 : 1; bookScreen(); }
  else if (act === 'book-mode-prev' || act === 'book-mode-next') bookStepMode(act === 'book-mode-prev' ? -1 : 1);
  else if (target.dataset.bookMode) { save.mode = target.dataset.bookMode as PlayMode; persist(); bookScreen(); }
  else if (target.dataset.mode) { save.mode = target.dataset.mode as PlayMode; mapPick = worldIn(); mapPlayIdx = 0; mapBoardShown = false; persist(); mapScreen(); }
  else if (act === 'map') { mapPick = worldIn(); mapBoardShown = false; mapScreen(); }
  else if (act === 'play-prev' || act === 'play-next-opt') { mapPlayIdx += act === 'play-prev' ? -1 : 1; mapPlayStep(); }
  else if (act === 'play-picked') { setWorld(mapPick); persist(); startRun(mapPick); }
  else if (act === 'play-board-fusion' || act === 'play-board-tactics') {
    save.boardVariant = act === 'play-board-tactics' ? 'tactics' : 'fusion';
    setWorld(mapPick);
    persist();
    startBoard(mapPick);
  }
  else if (target.dataset.world) {
    const n = Number(target.dataset.world);
    mapPick = n;
    if (n <= unlockedIn()) { setWorld(n); persist(); }
    mapScreen();
  }
  else if (act === 'to-top') screen.querySelector('.panel-in')?.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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
  else if (act === 'pause') { if (board && !game) boardPauseScreen(); else pauseScreen(); }
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
  else if (act === 'shop' && target.dataset.shopSlot) shopAt(target.dataset.shopSlot as Slot);
  else if (act === 'shop') shopScreen();
  else if (act === 'profile') { editingName = false; profileScreen(); }
  else if (act === 'achievements') achievementsScreen();
  else if (act === 'reset-ask') resetScreen();
  else if (act === 'reset-do') { wipeProgress(save); persist(); netSend(hello()); dressPalette(); mapPick = 0; profileScreen(t('resetDone')); }
  else if (act === 'mastery-ask') masteryScreen();
  else if (act === 'mastery-do') {
    if (masteryReady()) {
      save.masteries += 1;
      wipeProgress(save);
      persist();
      netSend(hello());
      dressPalette();
      mapPick = 0;
      audio.play('win');
      profileScreen(t('masteryDone'));
    }
  }
  else if (act === 'name-reset') setName(DEFAULT_NAME);
  else if (act === 'name-edit') { editingName = true; profileScreen(); }
  else if (act === 'name-cancel') { editingName = false; profileScreen(); }
  else if (act === 'styles') { dressSlot = null; stylesScreen(); }
  else if (act === 'options') { optionsFrom = 'menu'; optionsScreen(); }
  else if (act === 'options-pause') { optionsFrom = 'pause'; optionsScreen(); }
  else if (act === 'privacy-settings') { (window as Window & { openPrivacyChoices?: () => void }).openPrivacyChoices?.(); }
  else if (act === 'lang') {
    const next = target.dataset.lang as Lang;
    if (next && next !== lang) { setLang(next); boardKey = ''; renderBoardUi(); optionsScreen(); }
  } else if (act === 'retro') {
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
    // More than one level up waiting (two at once, or the Boss Rush's opening picks): the next cards straight away,
    // since the frame loop only opens the level-up screen as the game leaves play.
    if (game.phase === 'levelup' && game.choices.length) {
      shownChoices = game.choices.join();
      choiceScreen(game);
    } else {
      shownChoices = '';
      hide();
    }
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
    // Unlocking only adds it to what you own; it is put on from Customise (the owner's call).
    save.coins -= item.price;
    save.owned.push(item.id);
    persist();
    audio.play('coin');
    shopScreen();
  } else if (target.dataset.shopSec) {
    // One section open at a time, and one slot inside it, so the shop never grows too long to scroll.
    const key = target.dataset.shopSec;
    const sub = key.startsWith('slot:');
    const was = shopOpen.has(key);
    for (const k of [...shopOpen]) if (k.startsWith('slot:') || !sub) shopOpen.delete(k);
    if (!was) shopOpen.add(key);
    audio.play('click');
    shopScreen();
    if (!was) scrollShopTo(key);
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
    const portrait = ownHeroPortrait();
    const item = itemById(target.dataset.equip as ItemId);
    save.equipped[item.slot] = item.id;
    if (save.extra === item.id) delete save.extra;
    dropExtraClash();
    persist();
    syncFriendPortrait(portrait);
    shopScreen();
  } else if (target.dataset.unequip) {
    const portrait = ownHeroPortrait();
    const item = itemById(target.dataset.unequip as ItemId);
    delete save.equipped[item.slot];
    persist();
    syncFriendPortrait(portrait);
    shopScreen();
  } else if (target.dataset.song) {
    save.song = target.dataset.song as typeof save.song;
    audio.setSong(save.song);
    playMusicNow();
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
  } else if (target.dataset.skinBuy) {
    // A skin unlocked from the shop: bought, not worn (that is Customise's).
    const skin = target.dataset.skinBuy as HeroSkin;
    if (ownsSkin(save, skin) || !skinOpen(save, skin)) return;
    if (save.coins < skinPrice(skin)) { shopScreen(t('notEnough')); return; }
    save.coins -= skinPrice(skin);
    save.skins.push(skin);
    audio.play('coin');
    persist();
    shopScreen(t('skinBought', { name: t(`skin${cap(skin)}Name` as Key) }));
  } else if (target.dataset.skinWear) {
    // A skin already owned, worn straight from the shop.
    const skin = target.dataset.skinWear as HeroSkin;
    if (!ownsSkin(save, skin)) return;
    const portrait = ownHeroPortrait();
    save.skin = skin;
    persist();
    syncFriendPortrait(portrait);
    dressPalette();
    shopScreen();
  } else if (act === 'styles-skin') {
    dressSlot = 'skin';
    stylesScreen();
  } else if (act === 'profile-skin') {
    // From the profile's hero: Customise opens already scrolled to the character list.
    dressSlot = 'skin';
    stylesScreen();
    const go = () => {
      const box = screen.querySelector<HTMLElement>('.panel-in');
      const head = box?.querySelector<HTMLElement>('h3.slot');
      if (!box || !head) return;
      box.scrollTop = head.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 8;
      // `fitPanel()` puts the kept scroll back each time a picture loads: keep this one.
      box.dataset.scroll = String(box.scrollTop);
    };
    requestAnimationFrame(() => requestAnimationFrame(go));
  } else if (target.dataset.skin) {
    const portrait = ownHeroPortrait();
    // Skins are bought once with coins, then worn with a tap.
    const skin = target.dataset.skin as HeroSkin;
    if (!ownsSkin(save, skin)) {
      if (!skinOpen(save, skin)) return;
      if (save.coins < skinPrice(skin)) { stylesScreen(t('notEnough')); return; }
      save.coins -= skinPrice(skin);
      save.skins.push(skin);
      audio.play('coin');
    } else save.skin = skin;
    persist();
    syncFriendPortrait(portrait);
    dressPalette();
    stylesScreen();
  } else if (target.dataset.extraBuy !== undefined) {
    // The extra charm, from Customise or the shop.
    const again = screen.querySelector('.dress') ? stylesScreen : shopScreen;
    if (save.extraSlot) return;
    if (save.coins < EXTRA_SLOT_PRICE) { again(t('notEnough')); return; }
    save.coins -= EXTRA_SLOT_PRICE;
    save.extraSlot = true;
    persist();
    audio.play('levelup');
    again(t('extraBought'));
  } else if (target.dataset.extra) {
    const id = target.dataset.extra as ItemId;
    save.extra = save.extra === id ? undefined : id;
    persist();
    dressPalette();
    stylesScreen();
  } else if (target.dataset.extraOff !== undefined) {
    delete save.extra;
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
    if (key === 'song') playMusicNow();
    dressSlot = dressSlot === key ? null : key;
    stylesScreen();
    showPicks();
  } else if (target.dataset.dress) {
    const portrait = ownHeroPortrait();
    const item = itemById(target.dataset.dress as ItemId);
    const worn = save.equipped[item.slot] === item.id;
    if (worn) delete save.equipped[item.slot];
    else if (save.owned.includes(item.id)) { save.equipped[item.slot] = item.id; if (save.extra === item.id) delete save.extra; dropExtraClash(); }
    else if (!itemOpen(item)) { stylesScreen(lockText(item)); return; }
    else if (save.coins < item.price) { stylesScreen(t('notEnough')); return; }
    else {
      // Unlocking does not put it on: a second tap does.
      save.coins -= item.price;
      save.owned.push(item.id);
      audio.play('coin');
    }
    persist();
    syncFriendPortrait(portrait);
    dressPalette();
    stylesScreen();
  } else if (target.dataset.undress) {
    const portrait = ownHeroPortrait();
    delete save.equipped[target.dataset.undress as Slot];
    persist();
    syncFriendPortrait(portrait);
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
  if (!target) return;
  if (target.classList.contains('gp-close')) { closeGearPanel(); return; }
  if (!game) return;
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
  gearPanel.classList.add('fade-scroll');
  fadeEdges(gearPanel);
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
  requestAnimationFrame(() => fadeEdges(gearPanel));
}
function closeGearPanel() {
  if (gearPanel.hidden) return;
  gearPanel.hidden = true;
  gearPanel.classList.remove('is-board');
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
  if (board && !game) {
    // The board: only while no other dialog (a round's result, the quit question) is up.
    if (!screen.hidden && !paused) return;
    paused = force ?? !paused;
    if (paused) boardPauseScreen();
    else hide();
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
  } else if (!document.hidden && save.music > 0) {
    // Back on the page: the music goes on, in a run or on the cover.
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
  if (board) { boardPointerDown(event); return; }
  if (stick.on) return;
  stick.on = true;
  stick.id = event.pointerId;
  stick.ox = stick.x = event.clientX;
  stick.oy = stick.y = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (board) { boardPointerMove(event); return; }
  if (!stick.on || event.pointerId !== stick.id) return;
  stick.x = event.clientX;
  stick.y = event.clientY;
});
const release = (event: PointerEvent) => {
  if (board) { event.type === 'pointercancel' ? cancelBoardPointer(event) : boardPointerUp(event); return; }
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
/** A meter's fill, written only when it moves by a quarter of a percent (a style write every frame invalidated the
    HUD's style for nothing). */
function setMeter(fill: HTMLElement, frac: number) {
  const pct = `${Math.round(Math.max(0, Math.min(1, frac)) * 400) / 4}%`;
  if (fill.dataset.p === pct) return;
  fill.dataset.p = pct;
  fill.style.width = pct;
  fill.parentElement?.style.setProperty('--p', pct);
}
/** A HUD line, written only when it changes. */
function setText(el: HTMLElement, text: string) {
  if (el.textContent !== text) el.textContent = text;
}
/** Where the canvas sits on the page, kept by `resize()`: reading it every frame for the joystick forced a layout
    right after the HUD's writes. */
let canvasRect = { left: 0, top: 0 };
/** The field has been drawn since the run stood still (see `step`); a resize clears the canvas, so it is drawn again. */
let stillDrawn = false;

/* --------------------------------------------------------------- the frame */

const view: View = { scale: 1, ox: 0, oy: 0, dpr: 1, cx: 0, cy: 0, w: 0, h: 0 };
/** The canvas size the bitmap was last made for, in CSS pixels. */
let fitted = { width: 0, height: 0, dpr: 0 };
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  const r = canvas.getBoundingClientRect();
  canvasRect = { left: r.left, top: r.top };
  stillDrawn = false;
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

/** Siege runs its own frame loop over an inert page: the menu backdrop is not drawn underneath meanwhile. */
let siegeOpen = false;
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
  if (board) { boardStep(dt, now); return; }
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
      if (event === 'snakes') {
        const boss = g.enemies.find((e) => e.bossId === 'medusa' && !e.clone);
        if (boss) flash(t('bossSnakes', { name: bossTitle(boss) }));
      }
      if (event === 'minion') {
        const boss = g.enemies.find((e) => e.final && !e.clone);
        if (boss) flash(t('bossMinion', { name: bossTitle(boss) }));
      }
      if (event === 'phase') {
        const boss = g.enemies.find((e) => e.phase > 1);
        if (boss) flash(t(boss.phase > 2 ? 'bossFinalForm' : boss.bossId === 'medusa' ? 'bossMedusaShift' : boss.bossId === 'kratos' ? 'bossKratosShift' : 'bossWing', { name: bossTitle(boss) }));
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
      if (event === 'poison' || event === 'stun' || event === 'chill' || event === 'dark' || event === 'stone' || event === 'mired') flash(t(`status${cap(event)}` as Key));
      if (event === 'chest') flash(t('chestHint'));
      if (event === 'dodge') flash(t('dodgeFlash'));
      if (event === 'safe') flash(t('safeFlash'));
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
    // Paused, or a level-up, shrine or wheel dialog up: nothing moves, so the field is drawn once and left (it was
    // redrawn every frame under the dialog's full-screen blur). A resize draws it again.
    const still = paused || (g.phase !== 'play' && g.phase !== 'over' && g.phase !== 'won');
    if (!still || !stillDrawn) draw(ctx, g, view, palette, now / 1000);
    friendOverlay(g, now / 1000, still && stillDrawn);
    stillDrawn = still;
    setText(hudRoom, `${t('worldShort', { n: g.world })} · ${whereLine(g)}`);
    showcaseBtn.hidden = !g.showcase || g.phase !== 'play' || !g.enemies.some((e) => e.kind === 'boss' && !e.dead);
    // Boss Rush moves from world to world: the plate's icon follows.
    if (hudRoom.dataset.world !== String(g.world)) { hudRoom.dataset.world = String(g.world); hudRoom.style.setProperty('--icon', JSON.stringify(WORLD_ICON[g.world - 1])); }
    setText(hudLevel, t('level', { level: g.level }));
    setMeter(hudXp, g.xp / g.xpNext);
    setMeter(hudHp, Math.max(0, g.player.hp) / g.player.maxHp);
    // The wallet: what is banked plus what this run has picked up so far (banked when the run ends).
    setText(hudCoins, String(Math.floor(save.coins + g.coins)));
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
    audio.setFinal(!!finalOut, !!finalOut?.rage, finalOut?.bossId);
    // «By world»: the world's song while the run is on; the menus' once it is over.
    audio.setWorld(g.phase === 'over' || g.phase === 'won' ? 0 : g.world);
    if (bossBar.hidden !== !boss) {
      bossBar.hidden = !boss;
      requestAnimationFrame(resize); // the room makes room for the bar (after layout)
    }
    if (boss) {
      bossName.textContent = bossTitle(boss);
      setMeter(bossHp, Math.max(0, boss.hp) / boss.maxHp);
    }
  } else if (!screen.classList.contains('is-menu')) {
    if (!siegeOpen) drawMenuBackdrop(now / 1000);
  }

  // Joystick, drawn in screen pixels.
  if (stick.on && g && g.phase === 'play' && !paused) {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    const cx = stick.ox - canvasRect.left;
    const cy = stick.oy - canvasRect.top;
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
  Object.defineProperty(window, 'bugHunterBoard', { get: () => board });
  Object.defineProperty(window, 'bugHunterBoardLay', { get: () => boardLay });
}

/* --------------------------------------------------------------- loading */

/* The title screen is one big picture, so the HTML shows a bar until the
   pictures the menu and the map need are in (weighted by size); then the bar
   fades and the menu opens. Nothing waits longer than a few seconds. */
/** Wide landscape screens get the owner's desktop cover (game.css switches at the same query). */
const WIDE_COVER = window.matchMedia('(min-width: 900px) and (orientation: landscape)').matches;
const PRELOAD: [string, number][] = [
  [WIDE_COVER ? './images/game/cover-wide-ext.jpg' : './images/game/cover-tall.jpg', 10],
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
  readShared();
  menuScreen();
  loading.classList.add('is-done');
  setTimeout(() => loading.remove(), 400);
  musicOnLanding();
});
/* The music starts as soon as the cover is up. Browsers only let a page make sound after the player has touched
   it, so it is tried at once (allowed when the page was opened from a tap, or the browser trusts the site) and
   again on the very first touch, click or key anywhere, whatever it lands on. Muted music stays silent. */
function musicOnLanding() {
  const go = () => {
    if (save.music <= 0) return;
    audio.unlock();
    audio.start();
  };
  go();
  const first = () => {
    go();
    for (const e of ['pointerdown', 'pointerup', 'touchend', 'keydown'] as const) window.removeEventListener(e, first, true);
  };
  for (const e of ['pointerdown', 'pointerup', 'touchend', 'keydown'] as const) window.addEventListener(e, first, true);
}
requestAnimationFrame(frame);


