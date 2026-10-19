/*
 * Bug Hunter's rules, with no drawing and no DOM: an Archero-style room
 * shooter with Survivor.io-style weapons. You move to dodge; the moment you
 * stand still your ranged weapons (the bow, knives, a boomerang) fire at the
 * nearest bug. Melee weapons and magic work all the time, moving or not.
 * Bugs drop XP gems; every level up offers three picks (one melee, one magic,
 * one ranged or upgrade, when there are any left). Clear a room and its door
 * opens to the next sprint; sprints 5 and 10 are boss fights.
 *
 * Everything lives in a fixed 360 × 600 room; the renderer scales it to fit.
 */

import type { Loadout, SpiritSkin } from './shop';
import { BASE_LOADOUT } from './shop';
import type { EnemyStyle } from './save';

export const W = 360;
export const H = 600;
export const WALL = 16;
export const ROOMS = 12;

/*
 * Two ways to play. Sprints is the room-by-room game above. On call
 * ("Guardia") is the Survivor.io take: an open field that scrolls with you,
 * bugs pouring in from every side for ten minutes, a boss at minute five and
 * the final one at minute ten; kill it to win. Same weapons, same level-ups.
 */
export type Mode = 'sprints' | 'horde';
export const HORDE_LENGTH = 600;
export const HORDE_BOSS_AT = [300, HORDE_LENGTH];
const DOOR_HALF = 32;
/** Shrine rooms: no enemies, a statue that offers health or a skill. */
export const SHRINE_ROOMS = [5, 11];
export const isShrineRoom = (room: number) => SHRINE_ROOMS.includes(room);
/** How much of your health the statue gives back. */
export const STATUE_HEAL = 0.5;
/** The room whose clear also opens the mysterious door, once per run. */
export const WHEEL_ROOM = 8;
/**
 * The fight number of a room, 1–10, the way difficulty was tuned before the
 * shrines were added; 0 for a shrine. Rooms 1–4 fight 1–4, boss 6 is fight 5,
 * rooms 7–10 fight 6–9 and the final boss is fight 10.
 */
const STAGE = [1, 2, 3, 4, 0, 5, 6, 7, 8, 9, 0, 10];
export const stageOf = (room: number) => STAGE[room - 1] ?? room;
/** Where the mysterious door sits in the top wall. */
export const WHEEL_X = W / 2 + 92;

/* ------------------------------------------------------------------ worlds */

/** Each world is ten sprints with its own element: colours, a hazard and
 *  tougher bugs. World 1 is the plain backlog. */
export type Element = 'original' | 'fire' | 'water' | 'leaf' | 'bolt' | 'spark' | 'ghost' | 'heart';
export type HazardKind = 'none' | 'lava' | 'puddle' | 'thorns' | 'strike' | 'bouncy' | 'fog' | 'mixed';
export type WorldDef = { element: Element; hazard: HazardKind; look: Look | 'random'; tint: string; floor: string; grid: string; wall: string; door: string };

/** How an enemy is drawn: the world's cast, or whatever the picker forces. */
export type Look = 'original' | 'demon' | 'viking' | 'jungle' | 'greek' | 'robot' | 'nightmare';
export const LOOKS: Look[] = ['original', 'demon', 'viking', 'jungle', 'greek', 'robot', 'nightmare'];

export const WORLDS: WorldDef[] = [
  { element: 'original', hazard: 'none', look: 'original', tint: '', floor: '#0f141d', grid: 'rgba(255,255,255,0.035)', wall: '#1d2533', door: '' },
  { element: 'fire', hazard: 'lava', look: 'demon', tint: '#ff7a1a', floor: '#1a0c0a', grid: 'rgba(255,122,26,0.08)', wall: '#3a1510', door: '#ff9e4c' },
  { element: 'water', hazard: 'puddle', look: 'viking', tint: '#38bdf8', floor: '#081520', grid: 'rgba(56,189,248,0.08)', wall: '#0f2a3d', door: '#7ad8ff' },
  { element: 'leaf', hazard: 'thorns', look: 'jungle', tint: '#4ade80', floor: '#0a160f', grid: 'rgba(74,222,128,0.07)', wall: '#15321f', door: '#67dfa0' },
  { element: 'bolt', hazard: 'strike', look: 'greek', tint: '#facc15', floor: '#15140a', grid: 'rgba(250,204,21,0.07)', wall: '#2e2a10', door: '#ffd45f' },
  { element: 'spark', hazard: 'bouncy', look: 'robot', tint: '#fb923c', floor: '#160f09', grid: 'rgba(251,146,60,0.08)', wall: '#3b2412', door: '#ffb86f' },
  { element: 'ghost', hazard: 'fog', look: 'nightmare', tint: '#c7d2fe', floor: '#0c0d14', grid: 'rgba(199,210,254,0.05)', wall: '#1f2130', door: '#edf2fb' },
  { element: 'heart', hazard: 'mixed', look: 'random', tint: '#f472b6', floor: '#170a12', grid: 'rgba(244,114,182,0.07)', wall: '#3a1430', door: '#ff79c9' },
];
export const WORLD_COUNT = WORLDS.length;

/** Lava and thorns hurt, puddles slow you down. A boss's meteor or roots leave some that fade (`ttl`, seconds). */
export type Hazard = { kind: 'lava' | 'puddle' | 'thorns'; x: number; y: number; r: number; ttl?: number };
/** A lightning strike on its way: a warning circle, then the hit. */
export type Strike = { x: number; y: number; t: number };

export type Vec = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

/* --------------------------------------------------------------- the picks */

export type SkillId =
  // Melee: hits whatever comes close, all the time.
  | 'sword' | 'blades' | 'hammer' | 'durian' | 'mines'
  // Magic: goes off by itself every few seconds.
  | 'storm' | 'fireball' | 'frost' | 'spirits' | 'laser' | 'brick' | 'molotov'
  // Ranged: fires while you stand still.
  | 'knives' | 'boomerang' | 'drill' | 'rocket' | 'ball'
  // Bow upgrades (the bow is the weapon you start with).
  | 'fire' | 'water' | 'leaf' | 'bolt' | 'spark' | 'ghost' | 'double' | 'speed'
  // For everything.
  | 'power' | 'heart'
  // Passives (after Survivor.io): sports shoes, an exo-bracer, an energy drink.
  | 'shoes' | 'bracer' | 'drink';

export type Category = 'melee' | 'magic' | 'ranged' | 'upgrade';

export const CATEGORY: Record<SkillId, Category> = {
  sword: 'melee', blades: 'melee', hammer: 'melee', durian: 'melee', mines: 'melee',
  storm: 'magic', fireball: 'magic', frost: 'magic', spirits: 'magic', laser: 'magic', brick: 'magic', molotov: 'magic',
  knives: 'ranged', boomerang: 'ranged', drill: 'ranged', rocket: 'ranged', ball: 'ranged',
  fire: 'upgrade', water: 'upgrade', leaf: 'upgrade', bolt: 'upgrade', spark: 'upgrade', ghost: 'upgrade',
  double: 'upgrade', speed: 'upgrade', power: 'upgrade', heart: 'upgrade',
  shoes: 'upgrade', bracer: 'upgrade', drink: 'upgrade',
};
export const SKILLS = Object.keys(CATEGORY) as SkillId[];
const WEAPONS = SKILLS.filter((s) => CATEGORY[s] !== 'upgrade');

/*
 * Evolutions (after Survivor.io's EVO): a weapon at its top level plus one
 * particular upgrade unlocks a far stronger form, offered as a gold card at
 * the next level up. The weapon's effect reads `g.evolved[weapon]`.
 */
export const EVO_PARTNER: Partial<Record<SkillId, SkillId>> = {
  sword: 'power', blades: 'spark', hammer: 'heart', storm: 'bolt', fireball: 'fire', laser: 'speed',
  frost: 'water', spirits: 'ghost', knives: 'double', boomerang: 'leaf',
  // The rest of Survivor.io's actives, paired with the nearest of our upgrades.
  brick: 'power', drill: 'speed', durian: 'bracer', mines: 'bolt', rocket: 'fire', ball: 'shoes', molotov: 'drink',
};
/** A level-up card: a skill, a weapon's evolution, or the arrows' fusion. */
export type Choice = SkillId | `evo:${SkillId}` | 'fuse';
export const evoOf = (c: Choice): SkillId | null => (c.startsWith('evo:') ? (c.slice(4) as SkillId) : null);
/** Fusions are earned: with two elements on the bow a gold «Fusion» card turns up at the next level up, and
    only taking it (spending that level) fuses them. Until then the two elements work on their own. */
export const canFuse = (g: Game) => !g.fused && !!pairFusion(g);
export const canEvolve = (g: Game, w: SkillId) => {
  const partner = EVO_PARTNER[w];
  return !!partner && !g.evolved[w] && g.skills[w] >= maxLevel(w) && g.skills[partner] >= 1;
};
/*
 * Arrow elements and fusions: the bow carries at most two of the four
 * elements a run, and the pair you pick fuses into an effect of its own.
 * The shape upgrades (leaf fan, double, ricochet, hotfix) still stack freely.
 */
export const ARROW_ELEMENTS: SkillId[] = ['fire', 'water', 'bolt', 'ghost'];
export type Fusion = 'steam' | 'plasma' | 'wisp' | 'shock' | 'frostbite' | 'spectral';
const FUSIONS: Record<string, Fusion> = {
  'fire+water': 'steam', 'fire+bolt': 'plasma', 'fire+ghost': 'wisp',
  'water+bolt': 'shock', 'water+ghost': 'frostbite', 'bolt+ghost': 'spectral',
};
const pairKey = (a: SkillId, b: SkillId) => [a, b].sort((x, y) => ARROW_ELEMENTS.indexOf(x) - ARROW_ELEMENTS.indexOf(y)).join('+');
export const arrowElements = (g: Game) => ARROW_ELEMENTS.filter((s) => g.skills[s] > 0);
/** The fusion the two elements you carry would make (whether you took the card or not). */
export function pairFusion(g: Game): Fusion | null {
  const els = arrowElements(g);
  return els.length >= 2 ? FUSIONS[pairKey(els[0], els[1])] : null;
}
/** The fusion at work: only once its card was taken. */
export const fusionOf = (g: Game): Fusion | null => (g.fused ? pairFusion(g) : null);
/** The fusion an element card would make: picking it gives you your second element. */
export function fusionWith(g: Game, s: SkillId): Fusion | null {
  if (!ARROW_ELEMENTS.includes(s) || g.skills[s] > 0) return null;
  const els = arrowElements(g);
  return els.length === 1 ? FUSIONS[pairKey(els[0], s)] : null;
}
const MAX_WEAPONS = 4;
/** The weapons from the rest of Survivor.io's list are On call only: sprints keep their tuned rooms and arsenal. */
export const HORDE_ONLY: SkillId[] = ['brick', 'molotov', 'durian', 'mines', 'drill', 'rocket', 'ball'];
/** …and only once bought in the shop's arsenal (`loadout.arsenal`). */
const allowedIn = (g: Game, s: SkillId) => !HORDE_ONLY.includes(s) || (g.mode === 'horde' && g.loadout.arsenal.includes(s));
export const maxLevel = (s: SkillId) => (s === 'heart' ? 99 : s === 'double' ? 2 : s === 'blades' ? 5 : 3);

/* ---------------------------------------------------------------- the cast */

export type EnemyKind = 'bug' | 'ticket' | 'legacy' | 'boss';

export type Enemy = {
  id: number;
  kind: EnemyKind;
  look: Look;
  /** Element colour of the world it lives in ('' in world 1). */
  tint: string;
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  speed: number;
  dmg: number;
  xp: number;
  /** Seconds until it joins the fight (it is shown as a warning circle). */
  spawn: number;
  hit: number;
  burn: number;
  burnDps: number;
  burnTick: number;
  slow: number;
  slowBy: number;
  /** Pushed back by a hit (decays quickly). */
  kx: number;
  ky: number;
  /** General purpose timers for attacks. */
  cd: number;
  cd2: number;
  cd3: number;
  /** Boss charge: aiming (aim > 0) then dashing (dash > 0) along dir. */
  aim: number;
  dash: number;
  dir: Vec;
  wobble: number;
  /** Walking round a rack that blocked the way: -1 or 1, for `detour` seconds. */
  side: number;
  detour: number;
  dead: boolean;
  /** Bosses: which one ('' for the rest), the final one of the world (room 12, or the second on call), and a
      shadow clone of the nightmare world's final boss (weak, gone after `ttl` seconds). */
  bossId: string;
  final: boolean;
  clone: boolean;
  ttl: number;
  /** A boss off the floor (a leap, a blink): its spawn circle warns where it lands, and `land` says what it does then. */
  vanish: boolean;
  land: '' | 'slam' | 'blink';
  /** Seconds left of its special pose, of a channelled attack (the spiral, the laser), and that attack's tick. */
  pose: number;
  /** Which pose that is: the ring of orbs, the world's move or the signature. */
  act: '' | 'burst' | 'move' | 'sig';
  chan: number;
  chanTick: number;
  /** Cooldowns of the world's special attack and of the final boss's signature, and signatures used (the chimera cycles). */
  cd4: number;
  cd5: number;
  sigs: number;
  /** Charges still to chain (Valdur's frenzy). */
  combo: number;
  /** The final boss's last stand, from 20% health: it runs and charges much faster (`RAGE_AT`). */
  rage: boolean;
  /** Which way it faces, 1 right or -1 left: towards you, or the way it charges or steps round a rack (the sprites face right). */
  face: number;
};

export type Shot = {
  kind: 'arrow' | 'knife' | 'boomerang' | 'orb' | 'crescent' | 'brick' | 'drill' | 'durian' | 'rocket' | 'ball' | 'molotov';
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  pierce: number;
  bounce: number;
  ghost: boolean;
  /** Bow shots carry the bow upgrades (fire, water, lightning). */
  bow: boolean;
  hits: Set<number>;
  life: number;
  /** Spirit orbs: the companion's element, which sets the orb's effect. */
  elem?: SpiritSkin;
  /** Boomerang: seconds until it turns back. */
  out: number;
  spin: number;
  /** Bricks fall: downward pull, in room units a second squared. */
  grav?: number;
  /** Hit radius beyond the bug's own (4 for most shots). */
  size?: number;
  /** Ignores walls and racks (bricks, bottles, and the shots that bounce off the edge of the view). */
  free?: boolean;
  /** Seconds until the shot may hit the same bugs again (drill, durian, ball). */
  tick?: number;
  /** Will-o'-wisp arrows: seconds to the next flame dropped behind. */
  trail?: number;
  /** Rockets: the bug they are after (they fly over the others). */
  aim?: number;
};
/** A mine left on the floor: it arms, then goes off when a bug steps on it. */
export type Mine = { x: number; y: number; arm: number; life: number };
/** Caltrops dropped by the evolved durian. */
export type Spike = { x: number; y: number; life: number; tick: number };

export type Orb = {
  x: number; y: number; vx: number; vy: number; r: number; dmg: number; life: number; bounce: number;
  /** A boss's colour for it ('' or unset: the usual red), and seconds it keeps turning towards you (the robots' missiles). */
  tone?: string;
  home?: number;
  /** A boss shot drawn with one of the weapon pictures (see `ORB_PIC` in draw.ts) instead of a plain orb. */
  pic?: OrbPic;
};
export type OrbPic = 'fireball' | 'rocket' | 'leaf' | 'acid' | 'water' | 'ghost' | 'bolt' | 'spark';
/** What a boss's attack looks like: its element. */
export type ThreatEl = 'fire' | 'water' | 'leaf' | 'bolt' | 'laser' | 'shadow' | 'glitch';
/**
 * A boss attack on its way: an area shown as a warning while `warn` runs down, then harmful for `life` seconds.
 * A circle (meteors, geysers, roots), a line (javelins, the lightning grid), a beam turning round its boss
 * (the mech's laser) or a wave crossing the room with a gap to slip through (the serpent's tide).
 */
export type Threat = {
  kind: 'circle' | 'line' | 'beam' | 'wave';
  /** Centre (circle), start (line, beam), the middle of the wave's starting edge (wave). */
  x: number; y: number;
  /** Radius, or half the width of the line, beam or wave. */
  r: number;
  /** Direction (line, beam; the way a wave travels). */
  a: number;
  /** Length (line, beam), half the wave's length. */
  len: number;
  warn: number; max: number; life: number; dmg: number;
  el: ThreatEl;
  /** Beam: radians a second it turns, and the boss it follows. */
  spin?: number;
  owner?: number;
  /** Wave: speed, how far it has come, and the safe gap (its centre along the wave, half its width). */
  speed?: number;
  done?: number;
  gap?: number;
  gapW?: number;
  /** Left on the floor when it hits. */
  after?: 'lava' | 'thorns';
  /** A javelin: when the warning runs out a bolt flies along the line instead of the whole line striking. */
  shot?: OrbPic;
};
export type Particle = {
  x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string;
  /** How it is drawn: a dot (unset), a puff that swells as it fades, a streak along its flight, a snowflake or a rising wisp. */
  kind?: 'puff' | 'spark' | 'flake' | 'wisp';
};
export type Zap = { pts: Vec[]; life: number };
export type Gem = { x: number; y: number; value: number; pull: boolean };
/** On call: a heart dropped by a tougher bug; touch it for a little health. It fades after a while. */
export type Heart = { x: number; y: number; life: number; pull: boolean };
/** Short-lived shapes the renderer draws: sword arcs, hammer rings, explosions, lightning strikes. */
export type Ember = {
  x: number; y: number; r: number; life: number; max: number;
  /** Burn per second (molotov pools; 12 when unset). */ dps?: number;
  /** Fusion clouds: steam slows as it burns, will-o'-wisp fire is drawn blue-green. */ kind?: 'steam' | 'wisp';
  slow?: number;
};
export type Fx = {
  kind: 'slash' | 'ring' | 'boom' | 'strike' | 'halo' | 'beam' | 'rune' | 'pic'; x: number; y: number; r: number; a: number; life: number; max: number;
  /** Seconds before it starts (the evolved sword's three cuts follow one another). */
  delay?: number;
  /** Turn over its life, in radians (those cuts sweep round). */
  spin?: number;
  /** A beam's half width. */
  w?: number;
  /** A sky laser's foot: where its column strikes the floor. */
  foot?: number;
  /** The ring is the evolved hammer's. */
  big?: boolean;
  /** A 'pic' fx: the effect picture laid on the floor (fx/<pic>.webp), or over the bugs with `top`. */
  pic?: string;
  top?: boolean;
};
export type Fireball = { x: number; y: number; vx: number; vy: number; life: number };
/** A companion ghost: floats beside the hero (`slot` sets where) and shoots when you do. */
export type Spirit = {
  x: number; y: number; vx: number; vy: number; life: number; slot: number; cd: number;
  /** Seconds left of the throwing pose, and which way it threw (1 right, -1 left). */
  cast: number; dir: number;
};

export type Player = {
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  speed: number;
  inv: number;
  /** Seconds left of the flinch after a hit (the hero's hurt pose). */
  ouch: number;
  moving: boolean;
  face: number;
  /** Where the hero is walking (face turns to the target when a shot goes off). */
  heading: number;
};

/** Cooldowns and state for every weapon. */
type Gear = {
  bow: number;
  knives: number;
  boomerang: number;
  sword: number;
  hammer: number;
  storm: number;
  fireball: number;
  spirits: number;
  frost: number;
  laser: number;
  brick: number;
  molotov: number;
  mines: number;
  drill: number;
  rocket: number;
  ball: number;
  /** Seconds to the evolved durian's next caltrop. */
  spikes: number;
  bladeAngle: number;
  /** Per-bug cooldown so a spinning blade doesn't hit the same bug every frame. */
  bladeHits: Map<number, number>;
};

/** The healing statue that appears when the room before a boss is cleared. */
export type Statue = { x: number; y: number; used: boolean };

export type Game = {
  world: number;
  mode: Mode;
  room: number;
  /** On call: seconds to the next spawn, bosses summoned so far, seconds to the next hazard patch. */
  hordeSpawn: number;
  hordeBoss: number;
  hordeHazard: number;
  /** On call: half the visible field, in room units, set by the page so bugs spawn just out of sight. */
  viewHalf: Vec;
  phase: 'play' | 'levelup' | 'wheel' | 'shrine' | 'over' | 'won';
  statue: Statue | null;
  /** A boss's chest: touching it spins the lucky wheel (good slices only). */
  chest: Vec | null;
  /** The wheel being spun is the chest's lucky one (no room change after it). */
  luckyWheel: boolean;
  /** The second, mysterious door is open in this room. */
  wheelDoor: boolean;
  /** The wheel is a once-per-run thing. */
  wheelUsed: boolean;
  /** 1 normally; the wheel can make the next boss tougher. */
  bossHpMult: number;
  /** Coin revives bought this run (each dearer than the last, `REVIVE_PRICES`). */
  paidRevives: number;
  /** The player turned the coin revive down: no more offers this run. */
  reviveDeclined: boolean;
  hazards: Hazard[];
  strikes: Strike[];
  /** Seconds until the next lightning strike (storm worlds). */
  strikeIn: number;
  /** What this room's hazard is (mixed worlds pick one per room). */
  hazard: HazardKind;
  player: Player;
  enemies: Enemy[];
  shots: Shot[];
  orbs: Orb[];
  threats: Threat[];
  particles: Particle[];
  zaps: Zap[];
  gems: Gem[];
  hearts: Heart[];
  fx: Fx[];
  fireballs: Fireball[];
  spirits: Spirit[];
  obstacles: Rect[];
  door: boolean;
  skills: Record<SkillId, number>;
  /** Weapons that have evolved (see EVO_PARTNER). */
  evolved: Partial<Record<SkillId, true>>;
  /** The fusion card was taken (see `canFuse`). */
  fused: boolean;
  /** Burning ground left by the evolved fireball and by molotovs. */
  embers: Ember[];
  mines: Mine[];
  spikes: Spike[];
  gear: Gear;
  loadout: Loadout;
  /** The blades' element the player picked in the skills list (null: the strongest one, automatically). */
  bladePick: BladeElement | null;
  /** The arrow look the player picked in the skills list (null: the first bow upgrade owned). */
  arrowPick: ArrowLook | null;
  /** On call: level-up rerolls left (two a shift). */
  rerolls: number;
  style: EnemyStyle;
  /** Coins earned this run (banked by the page when the run ends). */
  coins: number;
  revives: number;
  level: number;
  xp: number;
  xpNext: number;
  pendingLevels: number;
  choices: Choice[];
  kills: number;
  /** XP picked up this run, in all; the page banks it for the profile level. */
  xpEarned: number;
  time: number;
  shake: number;
  /** Things the page may want to react to this frame (banners, sounds). */
  events: GameEvent[];
};

export type GameEvent =
  | 'fusion' | 'clear' | 'boss' | 'hurt' | 'levelup' | 'room' | 'revive' | 'heal' | 'wheel' | 'shrine'
  | 'shoot' | 'knife' | 'boomerang' | 'orb' | 'hit' | 'kill' | 'gem' | 'heart' | 'chest' | 'slash' | 'slam' | 'strike' | 'boom' | 'minute' | 'rage';

/* ------------------------------------------------------------------ helpers */

let nextId = 1;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
const inRect = (p: Vec, r: Rect, pad = 0) =>
  p.x > r.x - pad && p.x < r.x + r.w + pad && p.y > r.y - pad && p.y < r.y + r.h + pad;
const angleDiff = (a: number, b: number) => Math.abs(((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI);

/** Push a circle out of a rectangle (slides along its edge). */
function pushOut(c: { x: number; y: number; r: number }, rect: Rect) {
  const nx = clamp(c.x, rect.x, rect.x + rect.w);
  const ny = clamp(c.y, rect.y, rect.y + rect.h);
  const dx = c.x - nx;
  const dy = c.y - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= c.r * c.r) return;
  if (d2 > 0) {
    const d = Math.sqrt(d2);
    c.x = nx + (dx / d) * c.r;
    c.y = ny + (dy / d) * c.r;
    return;
  }
  // Centre inside the rectangle: leave by the nearest side.
  const left = c.x - rect.x;
  const right = rect.x + rect.w - c.x;
  const top = c.y - rect.y;
  const bottom = rect.y + rect.h - c.y;
  const least = Math.min(left, right, top, bottom);
  if (least === left) c.x = rect.x - c.r;
  else if (least === right) c.x = rect.x + rect.w + c.r;
  else if (least === top) c.y = rect.y - c.r;
  else c.y = rect.y + rect.h + c.r;
}

/** True when a rack stands between two points (`pad` widens the racks, for a body passing by). */
export function blocked(a: Vec, b: Vec, obstacles: Rect[], pad = 0) {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 8);
  for (let i = 1; i < steps; i++) {
    const p = { x: a.x + ((b.x - a.x) * i) / steps, y: a.y + ((b.y - a.y) * i) / steps };
    if (obstacles.some((o) => inRect(p, o, pad))) return true;
  }
  return false;
}

function keepInRoom(g: Game, c: { x: number; y: number; r: number }) {
  if (g.mode === 'sprints') {
    c.x = clamp(c.x, WALL + c.r, W - WALL - c.r);
    c.y = clamp(c.y, WALL + c.r, H - WALL - c.r);
  }
  for (const o of g.obstacles) pushOut(c, o);
}
/** Inside the room's walls; the open field has none. */
const outside = (g: Game, v: Vec) => g.mode === 'sprints' && (v.x < WALL || v.x > W - WALL || v.y < WALL || v.y > H - WALL);

const live = (g: Game) => g.enemies.filter((e) => !e.dead && e.spawn <= 0);

function nearest(g: Game, from: Vec, sight = false): Enemy | undefined {
  let target: Enemy | undefined;
  let best = Infinity;
  for (const e of live(g)) {
    const d = dist(from, e) + (sight && blocked(from, e, g.obstacles) ? 10000 : 0);
    if (d < best) { best = d; target = e; }
  }
  return target;
}

/* -------------------------------------------------------------------- rooms */

// Server racks to dodge behind. Boss rooms are left open.
const LAYOUTS: Rect[][] = [
  [],
  [{ x: 70, y: 250, w: 64, h: 26 }, { x: 226, y: 250, w: 64, h: 26 }],
  [{ x: 155, y: 270, w: 50, h: 50 }, { x: 60, y: 130, w: 40, h: 40 }, { x: 260, y: 130, w: 40, h: 40 }],
  [{ x: 40, y: 210, w: 100, h: 24 }, { x: 220, y: 210, w: 100, h: 24 }, { x: 150, y: 380, w: 60, h: 24 }],
  [{ x: 90, y: 180, w: 36, h: 36 }, { x: 234, y: 180, w: 36, h: 36 }, { x: 90, y: 370, w: 36, h: 36 }, { x: 234, y: 370, w: 36, h: 36 }],
];
/** Rack layout per fight number (see `stageOf`); bosses and shrines have none. */
const LAYOUT_FOR_STAGE = [0, 1, 2, 3, -1, 4, 1, 3, 2, -1];

export const isBossRoom = (room: number) => room === 6 || room === ROOMS;

function wave(room: number, world: number): EnemyKind[] {
  if (isBossRoom(room)) return ['boss'];
  if (isShrineRoom(room)) return [];
  const kinds: EnemyKind[] = [];
  room = stageOf(room);
  const bugs = 2 + Math.floor(room * 0.7) + (world - 1);
  const tickets = Math.floor(room / 2);
  const legacy = room >= 3 ? Math.floor((room - 1) / 3) : 0;
  for (let i = 0; i < bugs; i++) kinds.push('bug');
  for (let i = 0; i < tickets; i++) kinds.push('ticket');
  for (let i = 0; i < legacy; i++) kinds.push('legacy');
  return kinds;
}

const randomLook = () => LOOKS[Math.floor(Math.random() * LOOKS.length)];

function makeEnemy(g: Game, kind: EnemyKind, room: number, at: Vec, spawn = 0.7): Enemy {
  const wanted = g.style === 'world' ? WORLDS[g.world - 1].look : g.style;
  const look: Look = wanted === 'random' ? randomLook() : wanted;
  const worldUp = 1 + (g.world - 1) * 0.25;
  const horde = g.mode === 'horde';
  // On call: bugs harden with the clock instead of the room.
  // On call hardens faster per world: the field never runs out of bugs to farm.
  const tough = horde ? (1 + (g.time / 60) * 0.2) * (1 + (g.world - 1) * 0.45) : (1 + (stageOf(room) - 1) * 0.095) * worldUp;
  const bossHp = horde ? (g.hordeBoss >= 2 ? 4200 : 1800) * (1 + (g.time / 60) * 0.08) : room === ROOMS ? 2200 : 1000;
  const base = {
    bug: { r: 12, hp: 40, speed: 72, dmg: 10, xp: 6 },
    ticket: { r: 14, hp: 60, speed: 46, dmg: 12, xp: 8 },
    legacy: { r: 20, hp: 170, speed: 34, dmg: 20, xp: 14 },
    boss: { r: 40, hp: bossHp, speed: 40, dmg: 22, xp: 70 },
  }[kind];
  // The world's final boss (room 12, or the second one on call) is bigger and has its own kit.
  const final = kind === 'boss' && (horde ? g.hordeBoss >= 2 : room === ROOMS);
  const hp = Math.round(base.hp * (kind === 'boss' ? worldUp * g.bossHpMult : tough));
  return {
    id: nextId++,
    kind,
    look,
    tint: WORLDS[g.world - 1].tint,
    x: at.x,
    y: at.y,
    r: final ? (g.world === 3 ? 60 : 52) : base.r,
    hp,
    maxHp: hp,
    speed: base.speed * (final && g.world === 3 ? 0.8 : 1) * (1 + (g.world - 1) * 0.03) * (horde && kind !== 'boss' ? 1 + (g.time / 60) * 0.02 : 1),
    dmg: Math.round(base.dmg * (1 + (g.world - 1) * 0.1)),
    xp: base.xp,
    spawn,
    hit: 0,
    burn: 0,
    burnDps: 0,
    burnTick: 0,
    slow: 0,
    slowBy: 0,
    kx: 0,
    ky: 0,
    cd: rand(1.2, 2.4),
    cd2: 4,
    cd3: 6,
    aim: 0,
    dash: 0,
    dir: { x: 0, y: 1 },
    wobble: rand(0, Math.PI * 2),
    side: Math.random() < 0.5 ? -1 : 1,
    detour: 0,
    dead: false,
    bossId: kind !== 'boss' ? '' : final ? FINAL_BOSS[g.world - 1] : look,
    final,
    clone: false,
    ttl: 0,
    vanish: false,
    land: '',
    pose: 0,
    act: '',
    chan: 0,
    chanTick: 0,
    cd4: 3,
    cd5: 4.5,
    sigs: 0,
    combo: 0,
    rage: false,
    face: at.x > g.player?.x ? -1 : 1,
  };
}

function freeSpot(g: Game, r: number): Vec {
  for (let tries = 0; tries < 60; tries++) {
    const p = { x: rand(WALL + r + 8, W - WALL - r - 8), y: rand(WALL + r + 30, H * 0.62) };
    if (dist(p, g.player) < 170) continue;
    if (g.obstacles.some((o) => inRect(p, o, r + 6))) continue;
    if (g.enemies.some((e) => dist(p, e) < e.r + r + 6)) continue;
    return p;
  }
  return { x: W / 2, y: H * 0.3 };
}

/** Hazard circles that don't sit on racks, on the door path or on the player. */
function placeHazards(g: Game, kind: Hazard['kind'], count: number, rMin: number, rMax: number) {
  for (let i = 0; i < count; i++) {
    for (let tries = 0; tries < 40; tries++) {
      const r = rand(rMin, rMax);
      const h = { kind, x: rand(WALL + r, W - WALL - r), y: rand(WALL + r + 50, H - WALL - r - 90), r };
      if (g.obstacles.some((o) => inRect(h, o, r))) continue;
      if (g.hazards.some((o) => dist(h, o) < o.r + r + 10)) continue;
      if (Math.abs(h.x - W / 2) < r + 30 && h.y < 140) continue; // keep the door reachable
      g.hazards.push(h);
      break;
    }
  }
}

function setHazard(g: Game, room: number) {
  const def = WORLDS[g.world - 1];
  let kind = def.hazard;
  if (kind === 'mixed') {
    const pool: HazardKind[] = ['lava', 'puddle', 'thorns', 'strike', 'bouncy', 'fog'];
    kind = pool[Math.floor(Math.random() * pool.length)];
  }
  g.hazard = kind;
  g.hazards = [];
  g.strikes = [];
  g.threats = [];
  g.strikeIn = 2;
  if (isShrineRoom(room)) { g.hazard = 'none'; return; }
  const boss = isBossRoom(room);
  const n = boss ? 2 : 2 + Math.floor(stageOf(room) / 4);
  if (kind === 'lava') placeHazards(g, 'lava', n, 22, 38);
  if (kind === 'puddle') placeHazards(g, 'puddle', n + 1, 30, 48);
  if (kind === 'thorns') placeHazards(g, 'thorns', n + 1, 14, 20);
}

function enterRoom(g: Game, room: number) {
  // Gems still on the floor are banked on the way out.
  for (const gem of g.gems) gainXp(g, gem.value);
  g.room = room;
  g.door = false;
  g.statue = null;
  g.chest = null;
  g.wheelDoor = false;
  const layout = isShrineRoom(room) ? -1 : LAYOUT_FOR_STAGE[stageOf(room) - 1];
  g.obstacles = layout >= 0 ? LAYOUTS[layout] : [];
  setHazard(g, room);
  g.shots = [];
  g.orbs = [];
  g.zaps = [];
  g.gems = [];
  g.fx = [];
  g.fireballs = [];
  g.spirits = [];
  g.embers = [];
  g.mines = [];
  g.spikes = [];
  g.enemies = [];
  g.player.x = W / 2;
  g.player.y = H - 70;
  for (const kind of wave(room, g.world)) {
    const at = kind === 'boss' ? { x: W / 2, y: H * 0.3 } : freeSpot(g, kind === 'legacy' ? 20 : 14);
    g.enemies.push(makeEnemy(g, kind, room, at, kind === 'boss' ? 1.2 : rand(0.5, 1.1)));
  }
  if (isShrineRoom(room)) {
    // A quiet room: the door is open from the start and the statue waits in the middle.
    g.door = true;
    g.statue = { x: W / 2, y: H * 0.42, used: false };
    g.events.push('shrine');
  } else {
    g.events.push(isBossRoom(room) ? 'boss' : 'room');
  }
}

export function newGame(loadout: Loadout = BASE_LOADOUT, style: EnemyStyle = 'world', world = 1, mode: Mode = 'sprints'): Game {
  const g: Game = {
    world: clamp(world, 1, WORLD_COUNT),
    mode,
    room: 1,
    hordeSpawn: 1.5,
    hordeBoss: 0,
    hordeHazard: 6,
    viewHalf: { x: W / 2, y: H / 2 },
    phase: 'play',
    statue: null,
    chest: null,
    luckyWheel: false,
    wheelDoor: false,
    wheelUsed: false,
    bossHpMult: 1,
    paidRevives: 0,
    reviveDeclined: false,
    hazards: [],
    strikes: [],
    strikeIn: 2,
    hazard: 'none',
    player: { x: W / 2, y: H - 70, r: 15, hp: loadout.maxHp, maxHp: loadout.maxHp, speed: 150 * loadout.speedMult, inv: 0, ouch: 0, moving: false, face: -Math.PI / 2, heading: -Math.PI / 2 },
    enemies: [],
    shots: [],
    orbs: [],
    threats: [],
    particles: [],
    zaps: [],
    gems: [],
    hearts: [],
    fx: [],
    fireballs: [],
    spirits: [],
    obstacles: [],
    door: false,
    skills: Object.fromEntries(SKILLS.map((s) => [s, 0])) as Record<SkillId, number>,
    evolved: {},
    fused: false,
    embers: [],
    mines: [],
    spikes: [],
    loadout,
    bladePick: null,
    arrowPick: null,
    rerolls: mode === 'horde' ? 2 : 0,
    style,
    coins: 0,
    revives: loadout.revives,
    gear: {
      bow: 0.4, knives: 0.6, boomerang: 0.8, sword: 0.5, hammer: 1, storm: 1, fireball: 1, spirits: 0.5, frost: 0, laser: 1.2,
      brick: 1, molotov: 1.4, mines: 0.6, drill: 0.9, rocket: 1.2, ball: 1, spikes: 0,
      bladeAngle: 0, bladeHits: new Map(),
    },
    level: 1,
    xp: 0,
    xpNext: 20,
    pendingLevels: 0,
    choices: [],
    kills: 0,
    xpEarned: 0,
    time: 0,
    shake: 0,
    events: [],
  };
  for (const s of loadout.startSkills) g.skills[s] = Math.max(g.skills[s], 1);
  // The Senior's Tome: random weapons at their top level, each with its partner, so the first level up offers to evolve them.
  const ready = (Object.keys(EVO_PARTNER) as SkillId[]).filter((w) => !g.skills[w] && allowedIn(g, w));
  for (let i = 0; i < loadout.startMaxed && ready.length; i++) {
    const w = ready.splice(Math.floor(Math.random() * ready.length), 1)[0];
    g.skills[w] = maxLevel(w);
    const partner = EVO_PARTNER[w]!;
    g.skills[partner] = Math.max(g.skills[partner], 1);
  }
  if (mode === 'horde') {
    // It also starts at a higher bar: level 4 or so after the first minute, not 8.
    g.xpNext = 45;
    startField(g);
  }
  else enterRoom(g, 1);
  g.events = [];
  return g;
}

/* ------------------------------------------------------------------ on call */

/** The open field: the hero in the middle of nowhere, the world's weather, and the first bugs on their way. */
function startField(g: Game) {
  g.obstacles = [];
  g.player.x = 0;
  g.player.y = 0;
  const def = WORLDS[g.world - 1];
  g.hazard = def.hazard === 'mixed' ? 'lava' : def.hazard;
  g.hazards = [];
  g.strikes = [];
  g.threats = [];
  g.strikeIn = 3;
  for (let i = 0; i < 4; i++) g.enemies.push(makeEnemy(g, 'bug', 1, ringSpot(g, 0.75), rand(0.6, 1.4)));
  g.events.push('room');
}

/** A point on a ring round the hero, just past the edge of what the page shows (`k` scales it). */
function ringSpot(g: Game, k = 1): Vec {
  const p = g.player;
  const a = rand(0, Math.PI * 2);
  const r = (Math.hypot(g.viewHalf.x, g.viewHalf.y) + 40) * k;
  return { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r };
}

/** Ten minutes of bugs: the spawns speed up, the kinds widen, bosses come at 5:00 and 10:00. */
function updateHorde(g: Game, dt: number) {
  const minute = g.time / 60;
  const before = Math.floor((g.time - dt) / 60);
  if (Math.floor(minute) > before && g.time < HORDE_LENGTH) {
    g.coins += 5 * worldPay(g);
    g.events.push('minute');
  }
  // Bosses: summoned once each when their minute comes.
  if (g.hordeBoss < HORDE_BOSS_AT.length && g.time >= HORDE_BOSS_AT[g.hordeBoss]) {
    g.hordeBoss += 1;
    const boss = makeEnemy(g, 'boss', 1, ringSpot(g, 0.6), 1.5);
    g.enemies.push(boss);
    g.events.push('boss');
  }
  const bossOut = g.enemies.some((e) => e.kind === 'boss' && !e.dead);
  // Regular spawns, lighter while a boss is about.
  g.hordeSpawn -= dt;
  const alive = g.enemies.length;
  // Later worlds pour faster, in bigger groups and with a higher cap (on top of tougher bugs).
  const wk = g.world - 1;
  const cap = Math.min(64 + 4 * wk, 30 + Math.floor(minute * 4) + 4 * wk);
  if (g.hordeSpawn <= 0) {
    g.hordeSpawn = Math.max(0.4, (1.7 - minute * 0.12) * (1 - 0.07 * wk)) * (bossOut ? 1.8 : 1);
    const group = 1 + Math.floor(minute / 2) + Math.floor(wk / 2) + (Math.random() < 0.4 + 0.05 * wk ? 1 : 0);
    // Tickets are the dangerous ones (they keep away and throw), so only a few at a time.
    let tickets = g.enemies.filter((e) => e.kind === 'ticket').length;
    const ticketCap = 3 + Math.floor(minute);
    for (let i = 0; i < group && alive + i < cap; i++) {
      const roll = Math.random();
      let kind: EnemyKind = minute >= 2.5 && roll < 0.1 ? 'legacy' : minute >= 1.5 && roll < 0.28 ? 'ticket' : 'bug';
      if (kind === 'ticket' && tickets >= ticketCap) kind = 'bug';
      if (kind === 'ticket') tickets += 1;
      g.enemies.push(makeEnemy(g, kind, 1, ringSpot(g), rand(0.5, 1.1)));
    }
  }
  // Stragglers left far behind are brought round to the front, so the horde stays with you.
  const far = Math.hypot(g.viewHalf.x, g.viewHalf.y) * 2.2;
  for (const e of g.enemies) {
    if (e.kind !== 'boss' && dist(e, g.player) > far) {
      const at = ringSpot(g);
      e.x = at.x;
      e.y = at.y;
    }
  }
  // The world's weather follows you: a fresh patch now and then, old ones far away forgotten.
  if (g.hazard === 'lava' || g.hazard === 'puddle' || g.hazard === 'thorns') {
    g.hordeHazard -= dt;
    if (g.hordeHazard <= 0) {
      g.hordeHazard = rand(4, 7) * (1 - 0.06 * wk);
      const r = g.hazard === 'thorns' ? rand(14, 20) : g.hazard === 'puddle' ? rand(30, 48) : rand(22, 38);
      const at = ringSpot(g, rand(0.45, 0.9));
      g.hazards.push({ kind: g.hazard, x: at.x, y: at.y, r });
    }
    g.hazards = g.hazards.filter((h) => dist(h, g.player) < far);
  }
  // Gems nobody will go back for are banked, so the field doesn't fill up.
  if (g.gems.length > 160) {
    g.gems.sort((a, b) => dist(a, g.player) - dist(b, g.player));
    for (const gem of g.gems.splice(120)) gainXp(g, gem.value);
  }
}

/* ------------------------------------------------------------------- level up */

/** Weapons you carry (the bow always counts). */
export const ownedWeapons = (g: Game) => WEAPONS.filter((s) => g.skills[s] > 0);

function canPick(g: Game, s: SkillId) {
  if (!allowedIn(g, s)) return false;
  // Two arrow elements a run: once you have a pair, the other two stop coming.
  if (ARROW_ELEMENTS.includes(s) && g.skills[s] === 0 && arrowElements(g).length >= 2) return false;
  if (g.skills[s] >= maxLevel(s)) return false;
  // A new weapon only while there's a free slot.
  if (CATEGORY[s] !== 'upgrade' && g.skills[s] === 0 && ownedWeapons(g).length >= MAX_WEAPONS) return false;
  return true;
}

function offerChoices(g: Game, keepEvo?: SkillId | null, avoid: Choice[] = []) {
  const pickFrom = (pool: SkillId[]) => pool.filter((s) => canPick(g, s) && !g.choices.includes(s) && !avoid.includes(s));
  const any = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  g.choices = [];
  // An evolution ready? It takes its weapon's slot, as a gold card (a reroll keeps the one shown).
  const evos = WEAPONS.filter((w) => canEvolve(g, w));
  const evo = keepEvo !== undefined ? keepEvo : evos.length ? any(evos) : null;
  if (evo) g.choices.push(`evo:${evo}`);
  const groups = [['melee'], ['magic'], ['ranged', 'upgrade']] as Category[][];
  const taken = groups.map((kinds) => !!evo && kinds.includes(CATEGORY[evo]));
  // The fusion card: the bow's slot, or the first one an evolution left free (it stays through a reroll).
  if (canFuse(g)) {
    const slot = !taken[2] ? 2 : taken.indexOf(false);
    if (slot >= 0) { g.choices.push('fuse'); taken[slot] = true; }
  }
  // One of each kind when it can: melee, magic, then ranged or a bow upgrade.
  for (const [k, kinds] of groups.entries()) {
    if (taken[k]) continue;
    const pool = pickFrom(SKILLS.filter((s) => kinds.includes(CATEGORY[s])));
    if (pool.length) g.choices.push(any(pool));
  }
  while (g.choices.length < 3) {
    const pool = pickFrom(SKILLS);
    if (!pool.length) break;
    g.choices.push(any(pool));
  }
  // A reroll with too little left to avoid the old cards: allow them back rather than show fewer.
  if (avoid.length && g.choices.length < Math.min(3, avoid.length)) return offerChoices(g, keepEvo);
  g.phase = 'levelup';
}

/** On call: swap the level-up cards for three others (twice a shift); an evolution card stays put. */
export function rerollChoices(g: Game) {
  if (g.phase !== 'levelup' || g.rerolls <= 0) return false;
  g.rerolls -= 1;
  const evoCard = g.choices.map(evoOf).find((e) => e) ?? null;
  offerChoices(g, evoCard, g.choices);
  return true;
}

export function chooseSkill(g: Game, choice: Choice) {
  if (choice === 'fuse') {
    g.fused = true;
    burst(g, g.player.x, g.player.y, '#c4b5fd', 40, 240, 4);
    g.pendingLevels -= 1;
    g.choices = [];
    if (g.pendingLevels > 0) offerChoices(g);
    else g.phase = 'play';
    return;
  }
  const evo = evoOf(choice);
  if (evo) {
    g.evolved[evo] = true;
    burst(g, g.player.x, g.player.y, '#fcd34d', 40, 240, 4);
    g.pendingLevels -= 1;
    g.choices = [];
    if (g.pendingLevels > 0) offerChoices(g);
    else g.phase = 'play';
    return;
  }
  const skill = choice as SkillId;
  g.skills[skill] += 1;
  followElement(g, skill);
  if (skill === 'heart') {
    g.player.maxHp += 25;
    g.player.hp = Math.min(g.player.maxHp, g.player.hp + Math.round(g.player.maxHp * 0.35));
  }
  g.pendingLevels -= 1;
  g.choices = [];
  if (g.pendingLevels > 0) offerChoices(g);
  else g.phase = 'play';
}

const power = (g: Game, cat: Category) => (1 + 0.25 * g.skills.power) * g.loadout.mult[cat];
/** Ranged weapons fire faster with the Hotfix upgrade. */
const haste = (g: Game) => (1 + 0.28 * g.skills.speed) * g.loadout.hasteMult;

function gainXp(g: Game, amount: number) {
  g.xp += amount * g.loadout.xpMult;
  g.xpEarned += amount * g.loadout.xpMult;
  while (g.xp >= g.xpNext) {
    g.xp -= g.xpNext;
    g.level += 1;
    // On call rains XP, so its levels climb geometrically (about twenty in a full shift).
    g.xpNext = g.mode === 'horde' ? Math.round(g.xpNext * 1.2) + 12 : g.xpNext + 15;
    g.pendingLevels += 1;
    g.events.push('levelup');
  }
}

/* -------------------------------------------------------------------- combat */

function burst(g: Game, x: number, y: number, color: string, count: number, speed = 120, size = 3) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(speed * 0.3, speed);
    const life = rand(0.3, 0.7);
    g.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, size: rand(size * 0.6, size * 1.4), color });
  }
}

const ENEMY_COLOR: Record<EnemyKind, string> = { bug: '#ff6b6b', ticket: '#ffd166', legacy: '#9aa3b2', boss: '#c084fc' };

const COINS: Record<EnemyKind, number> = { bug: 1, ticket: 2, legacy: 3, boss: 25 };
/** On call kills pour in (a shift ends with well over a thousand), so each pays 40% of a sprint kill: a won shift in world 1 is about 1400 coins, not 3500. */
const HORDE_PAY = 0.4;
/** Later worlds pay better. */
const worldPay = (g: Game) => g.loadout.coinMult * (1 + (g.world - 1) * 0.5);

/** On call: how often each kind drops a heart, how long one lasts, and how much it heals (share of max health). */
const HEART_CHANCE: Partial<Record<EnemyKind, number>> = { ticket: 0.06, legacy: 0.35 };
export const HEART_LIFE = 18;
const HEART_HEAL = 0.12;

function kill(g: Game, e: Enemy) {
  if (e.dead) return;
  e.dead = true;
  g.kills += 1;
  // A shadow clone only bursts into smoke.
  if (e.clone) {
    burst(g, e.x, e.y, '#a78bfa', 22, 160, 3);
    return;
  }
  // The real boss down: its clones go with it.
  if (e.kind === 'boss') {
    for (const c of g.enemies) if (c.clone && !c.dead) { c.dead = true; burst(g, c.x, c.y, '#a78bfa', 18, 120, 3); }
    g.threats = g.threats.filter((t) => t.owner !== e.id);
  }
  // Plasma (fire + lightning arrows): a burning bug blows up when it dies, setting its neighbours alight.
  if (e.burn > 0 && fusionOf(g) === 'plasma') {
    g.fx.push({ kind: 'pic', pic: 'plasma-burst', top: true, x: e.x, y: e.y, r: 40, a: rand(0, 6), life: 0.35, max: 0.35 });
    for (const o of live(g)) {
      if (o === e || dist(o, e) > 40 + o.r) continue;
      o.burn = Math.max(o.burn, 2);
      o.burnDps = Math.max(o.burnDps, 10);
      hurt(g, o, 14 * power(g, 'ranged'));
    }
  }
  g.coins += COINS[e.kind] * worldPay(g) * (g.mode === 'horde' ? HORDE_PAY : 1);
  g.events.push('kill');
  burst(g, e.x, e.y, ENEMY_COLOR[e.kind], e.kind === 'boss' ? 60 : 14, e.kind === 'boss' ? 260 : 140, e.kind === 'boss' ? 5 : 3);
  // XP drops as gems to collect; the boss scatters a handful.
  const drops = e.kind === 'boss' ? 7 : 1;
  for (let i = 0; i < drops; i++) {
    const a = rand(0, Math.PI * 2);
    const r = drops > 1 ? rand(10, 40) : 0;
    g.gems.push({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, value: e.xp / drops, pull: false });
  }
  if (e.kind === 'boss') {
    g.shake = 0.6;
    // The chest: not for the boss whose death ends the run.
    const last = g.mode === 'horde' ? g.hordeBoss >= HORDE_BOSS_AT.length : g.room === ROOMS;
    if (!last) { g.chest = { x: e.x, y: e.y }; g.events.push('chest'); }
  }
  // On call: tougher bugs may leave a heart behind (bosses always leave three).
  if (g.mode === 'horde') {
    const hearts = e.kind === 'boss' ? 3 : Math.random() < (HEART_CHANCE[e.kind] ?? 0) ? 1 : 0;
    for (let i = 0; i < hearts; i++) {
      const a = rand(0, Math.PI * 2);
      const r = hearts > 1 ? rand(14, 34) : 0;
      g.hearts.push({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, life: HEART_LIFE, pull: false });
    }
  }
  // Legacy code never dies quietly: it splits into two bugs.
  if (e.kind === 'legacy') {
    for (const side of [-1, 1]) {
      const bug = makeEnemy(g, 'bug', g.room, { x: e.x + side * 14, y: e.y }, 0.15);
      bug.hp = bug.maxHp = Math.round(bug.maxHp * 0.6);
      bug.xp = 3;
      g.enemies.push(bug);
    }
  }
}

function hurt(g: Game, e: Enemy, amount: number, push?: Vec) {
  if (e.dead) return;
  e.hp -= amount;
  e.hit = 0.1;
  if (e.bossId === 'drakkar' && e.hp <= e.maxHp / 2) {
    breakShip(g, e);
    return;
  }
  if (e.final && !e.clone && !e.rage && e.hp > 0 && e.hp <= e.maxHp * RAGE_AT) enrage(g, e);
  if (push && e.kind !== 'boss') {
    e.kx += push.x;
    e.ky += push.y;
  }
  if (e.hp <= 0) kill(g, e);
}

const away = (from: Vec, e: Vec, strength: number) => {
  const d = dist(from, e) || 1;
  return { x: ((e.x - from.x) / d) * strength, y: ((e.y - from.y) / d) * strength };
};

function hitWithShot(g: Game, e: Enemy, s: Shot) {
  hurt(g, e, s.dmg, s.kind === 'boomerang' ? undefined : { x: s.vx * 0.06, y: s.vy * 0.06 });
  burst(g, s.x, s.y, '#ffffff', 4, 90, 2);
  g.events.push('hit');
  // The spirit's element: fire burns, tide slows, volt arcs to one more bug.
  if (s.elem === 'fire') { e.burn = 2; e.burnDps = Math.max(e.burnDps, 7); }
  else if (s.elem === 'tide') { e.slow = 1.5; e.slowBy = Math.max(e.slowBy, 0.35); }
  else if (s.elem === 'volt') chain(g, e, 1, s.dmg * 0.6);
  if (!s.bow) return;
  if (g.skills.fire) {
    e.burn = 2;
    e.burnDps = 6 * g.skills.fire;
  }
  if (g.skills.water) {
    e.slow = 1.5;
    e.slowBy = 0.25 + 0.1 * g.skills.water;
  }
  // Lightning: the hit arcs on to the nearest bugs it hasn't touched yet.
  if (g.skills.bolt) chain(g, e, g.skills.bolt, s.dmg * 0.6);
  const fusion = fusionOf(g);
  if (fusion) fuse(g, e, s, fusion);
}

/* The other fusions leave a trail in flight too, only to be seen (will-o'-wisp's flames are real fire):
   steam puffs, pink plasma sparks, blue crackles of electrocution, snowflakes of spectral frost and violet
   wisps of the spectral storm. */
const TRAIL: Partial<Record<Fusion, { every: number; kind: Particle['kind']; colors: string[]; size: [number, number]; life: number; spread: number }>> = {
  steam: { every: 0.03, kind: 'puff', colors: ['#f1f5f9', '#e2e8f0', '#cbd5e1'], size: [4.5, 7], life: 0.6, spread: 22 },
  plasma: { every: 0.016, kind: 'spark', colors: ['#f0abfc', '#e879f9', '#fde68a'], size: [2, 3], life: 0.35, spread: 110 },
  shock: { every: 0.016, kind: 'spark', colors: ['#7dd3fc', '#e0f2fe', '#38bdf8'], size: [1.8, 2.8], life: 0.28, spread: 170 },
  frostbite: { every: 0.035, kind: 'flake', colors: ['#f0f9ff', '#bae6fd'], size: [4, 5.5], life: 0.7, spread: 26 },
  spectral: { every: 0.025, kind: 'wisp', colors: ['#c4b5fd', '#a78bfa', '#ddd6fe'], size: [3.5, 5.5], life: 0.6, spread: 20 },
};
function fusionTrail(g: Game, s: Shot, dt: number, f: Fusion) {
  const t = TRAIL[f];
  if (!t || g.particles.length > 260) return;
  s.trail = (s.trail ?? 0) - dt;
  if (s.trail > 0) return;
  s.trail = t.every;
  const a = rand(0, Math.PI * 2);
  const sp = rand(0.3, 1) * t.spread;
  g.particles.push({
    x: s.x - s.vx * 0.02, y: s.y - s.vy * 0.02,
    vx: Math.cos(a) * sp - s.vx * 0.05, vy: Math.sin(a) * sp - s.vy * 0.05 - (t.kind === 'wisp' ? 30 : 0),
    life: t.life, max: t.life, size: rand(t.size[0], t.size[1]), color: t.colors[Math.floor(Math.random() * t.colors.length)], kind: t.kind,
  });
}

/* What each fusion adds to a bow hit (plasma works on kills, will-o'-wisp
   on the arrow's flight, shock in `chain`). */
function fuse(g: Game, e: Enemy, s: Shot, fusion: Fusion) {
  if (fusion === 'steam') {
    // Steam: a cloud that scalds and slows the bugs inside.
    if (g.embers.filter((k) => k.kind === 'steam').length < 10) {
      g.embers.push({ x: e.x, y: e.y, r: 26, life: 1.3, max: 1.3, dps: 7 * power(g, 'ranged'), kind: 'steam', slow: 0.4 });
    }
  } else if (fusion === 'frostbite') {
    // Spectral frost: every bug the arrow goes through freezes for a moment (bosses only slow).
    if (e.slow < 0.2 && g.fx.filter((f) => f.pic === 'ice-block').length < 10) {
      g.fx.push({ kind: 'pic', pic: 'ice-block', top: true, x: e.x, y: e.y, r: e.r + 6, a: 0, life: 0.5, max: 0.5 });
    }
    e.slow = Math.max(e.slow, 0.5);
    e.slowBy = e.kind === 'boss' ? Math.max(e.slowBy, 0.6) : 1;
  } else if (fusion === 'spectral') {
    // Spectral storm: each bug the arrow goes through calls a bolt from the sky (the first two).
    if (s.hits.size <= 2) {
      // The owner's violet bolt, standing on the bug (its foot is low in the picture).
      g.fx.push({ kind: 'pic', pic: 'spectral-bolt', top: true, x: e.x, y: e.y - 22, r: 28, a: 0, life: 0.3, max: 0.3 });
      for (const o of live(g)) if (dist(o, e) < 22 + o.r) hurt(g, o, s.dmg * 0.35);
    }
  }
}

function chain(g: Game, from: Enemy, jumps: number, amount: number) {
  let at: Vec = from;
  const touched = new Set([from.id]);
  // Shock (water + lightning arrows): the arc reaches further and hits slowed bugs twice as hard.
  const shock = fusionOf(g) === 'shock';
  for (let i = 0; i < jumps; i++) {
    let next: Enemy | undefined;
    let best = shock ? 190 : 130;
    for (const o of live(g)) {
      if (touched.has(o.id)) continue;
      const d = dist(at, o);
      if (d < best) { best = d; next = o; }
    }
    if (!next) break;
    touched.add(next.id);
    g.zaps.push({ pts: zigzag(at, next), life: 0.18 });
    if (shock && next.slow > 0) {
      if (g.fx.filter((f) => f.pic === 'shock-ring').length < 8) g.fx.push({ kind: 'pic', pic: 'shock-ring', top: true, x: next.x, y: next.y, r: next.r + 10, a: rand(0, 6), life: 0.3, max: 0.3 });
      hurt(g, next, amount * 2);
    } else hurt(g, next, amount);
    at = next;
  }
}

function zigzag(a: Vec, b: Vec, wiggle = 9): Vec[] {
  const pts: Vec[] = [{ x: a.x, y: a.y }];
  const steps = 5;
  const nx = -(b.y - a.y);
  const ny = b.x - a.x;
  const len = Math.hypot(nx, ny) || 1;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const off = rand(-wiggle, wiggle);
    pts.push({ x: a.x + (b.x - a.x) * t + (nx / len) * off, y: a.y + (b.y - a.y) * t + (ny / len) * off });
  }
  pts.push({ x: b.x, y: b.y });
  return pts;
}

function shot(kind: Shot['kind'], from: Vec, angle: number, speed: number, dmg: number, extra: Partial<Shot> = {}): Shot {
  return {
    kind,
    x: from.x,
    y: from.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    dmg,
    pierce: 0,
    bounce: 0,
    ghost: false,
    bow: false,
    hits: new Set(),
    life: 1.6,
    out: 0,
    spin: 0,
    ...extra,
  };
}

/* ------------------------------------------------------------------ weapons */

function fireBow(g: Game, target: Enemy) {
  const p = g.player;
  const angle = Math.atan2(target.y - p.y, target.x - p.x);
  p.face = angle;
  const angles = [angle];
  for (let i = 1; i <= g.skills.leaf; i++) angles.push(angle - i * 0.26, angle + i * 0.26);
  const side = g.skills.double ? [-6, 6] : [0];
  const dmg = 20 * power(g, 'ranged') * (g.skills.double === 2 ? 0.85 : 1);
  for (const a of angles) {
    for (const offset of side) {
      const from = { x: p.x + Math.cos(a + Math.PI / 2) * offset, y: p.y + Math.sin(a + Math.PI / 2) * offset };
      g.shots.push(shot('arrow', from, a, 430, dmg, {
        pierce: g.skills.ghost, bounce: g.skills.spark, ghost: g.skills.ghost > 0, bow: true,
      }));
    }
  }
}

function fireKnives(g: Game, target: Enemy) {
  const p = g.player;
  const lv = g.skills.knives;
  const angle = Math.atan2(target.y - p.y, target.x - p.x);
  if (g.evolved.knives) {
    // Evolved (Knife Rain): a ring of knives all round you, each through one bug.
    const n = 8 + lv;
    for (let i = 0; i < n; i++) {
      const a = angle + (i / n) * Math.PI * 2;
      g.shots.push(shot('knife', p, a, 480, (14 + 5 * (lv - 1)) * power(g, 'ranged'), { life: 0.9, spin: a, pierce: 1 }));
    }
    return;
  }
  const n = 2 + lv;
  for (let i = 0; i < n; i++) {
    const a = angle + (i - (n - 1) / 2) * 0.17;
    g.shots.push(shot('knife', p, a, 480, (14 + 5 * (lv - 1)) * power(g, 'ranged'), { life: 0.9, spin: a }));
  }
}

function fireBoomerang(g: Game, target: Enemy) {
  const p = g.player;
  const lv = g.skills.boomerang;
  const angle = Math.atan2(target.y - p.y, target.x - p.x);
  // Evolved (Quantum Boomerang): two more, faster and further.
  const evolved = !!g.evolved.boomerang;
  const n = lv + (evolved ? 2 : 0);
  for (let i = 0; i < n; i++) {
    const a = angle + (i - (n - 1) / 2) * 0.45;
    g.shots.push(shot('boomerang', p, a, evolved ? 400 : 330, (24 + 8 * (lv - 1)) * power(g, 'ranged') * (evolved ? 1.4 : 1), { pierce: 99, ghost: true, life: 3, out: evolved ? 0.7 : 0.5 }));
  }
}

function swingSword(g: Game) {
  const p = g.player;
  const lv = g.skills.sword;
  const evolved = !!g.evolved.sword;
  // Evolved (Lunar Halo): a full circle, wider, half again as strong.
  const reach = (58 + 6 * (lv - 1)) * (evolved ? 1.4 : 1);
  // Swing towards the nearest bug if one is close, else the way you face.
  const close = nearest(g, p);
  const a = close && dist(p, close) < reach + close.r + 20 ? Math.atan2(close.y - p.y, close.x - p.x) : p.face;
  if (evolved) {
    // Lunar Halo: three cuts in a row sweeping round you, each throwing a crescent that flies on.
    for (let k = 0; k < 3; k++) {
      const ak = a + (k * Math.PI * 2) / 3;
      g.fx.push({ kind: 'slash', x: p.x, y: p.y, r: reach, a: ak, life: 0.22, max: 0.22, delay: k * 0.09, spin: 1.4 });
      g.shots.push(shot('crescent', p, ak, 260, (32 + 14 * (lv - 1)) * power(g, 'melee') * 0.7, { pierce: 99, ghost: true, life: 0.55 }));
    }
  } else g.fx.push({ kind: 'slash', x: p.x, y: p.y, r: reach, a, life: 0.22, max: 0.22 });
  g.events.push('slash');
  for (const e of live(g)) {
    if (dist(p, e) > reach + e.r) continue;
    if (!evolved && angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a) > 1.15) continue;
    hurt(g, e, (32 + 14 * (lv - 1)) * power(g, 'melee') * (evolved ? 1.5 : 1), away(p, e, 140));
    heal(g, 1);
  }
}

function slamHammer(g: Game) {
  const p = g.player;
  const lv = g.skills.hammer;
  const evolved = !!g.evolved.hammer;
  // Evolved (Seismic Hammer): a far wider wave that stops every bug it hits for a moment.
  const reach = (72 + 10 * (lv - 1)) * (evolved ? 1.5 : 1);
  g.fx.push({ kind: 'ring', x: p.x, y: p.y, r: reach, a: 0, life: 0.35, max: 0.35, big: evolved });
  g.shake = Math.max(g.shake, evolved ? 0.25 : 0.12);
  g.events.push('slam');
  for (const e of live(g)) {
    if (dist(p, e) > reach + e.r) continue;
    hurt(g, e, (40 + 16 * (lv - 1)) * power(g, 'melee') * (evolved ? 1.4 : 1), away(p, e, 260));
    if (evolved) { e.slow = Math.max(e.slow, 1.2); e.slowBy = 1; }
    heal(g, 1);
  }
}

export const BLADE_ORBIT = 46;
/* Blades by level: one more blade each level up to four, a wider circle
   every level, and from level 3 bigger blades (much bigger at 4 and 5, with
   a fifth blade at 5). The hit reach is the picture's own radius, so a
   bigger saw really cuts further. */
export const bladeCount = (lv: number) => [0, 2, 3, 4, 5, 6][Math.min(lv, 5)];
export const bladeScale = (lv: number) => [1, 1, 1, 1.15, 1.5, 1.9][Math.min(lv, 5)];
export const bladeOrbit = (lv: number) => BLADE_ORBIT * [1, 1, 1.12, 1.25, 1.5, 1.8][Math.min(lv, 5)];
/** The Orbital Saw (evolved blades) is a size up: saws 1.4× bigger on a circle 1.2× wider. */
export const sawScale = (g: Game) => bladeScale(g.skills.blades) * (g.evolved.blades ? 1.4 : 1);
export const sawOrbit = (g: Game) => bladeOrbit(g.skills.blades) * (g.evolved.blades ? 1.2 : 1);
const BLADE_SPARK: Record<BladeElement, string> = { steel: '#e5e7eb', fire: '#ffb347', ice: '#bae6fd', volt: '#fde047', shade: '#e879f9' };

/** Melee hits heal you a little: the reward for fighting up close. */
function heal(g: Game, amount: number) {
  g.player.hp = Math.min(g.player.maxHp, g.player.hp + amount);
}

/*
 * The blades take an element from what else you carry: fire (fire arrows or
 * the fireball) sets bugs alight, ice (frost or water arrows) slows them,
 * volt (lightning arrows, sparks or the storm) arcs to one more bug, shade
 * (ghost arrows or spirits) cuts deeper. The one you have most levels in
 * wins; with none of them they stay plain steel.
 */
export type BladeElement = 'steel' | 'fire' | 'ice' | 'volt' | 'shade';
const BLADE_FROM: Record<Exclude<BladeElement, 'steel'>, SkillId[]> = {
  fire: ['fire', 'fireball'],
  ice: ['frost', 'water'],
  volt: ['bolt', 'spark', 'storm'],
  shade: ['ghost'],
};
/** The Spirits skill counts for the element of the spirit you wear: the default ghost is a ghost, so shade
    (its medallion is the purple ghost); the leaf one has no blade of its own. */
const SPIRIT_BLADE: Record<SpiritSkin, BladeElement> = { water: 'shade', tide: 'ice', fire: 'fire', volt: 'volt', shade: 'shade', thorn: 'steel' };
/** How many levels of each element's skills you carry. */
function bladeSources(g: Game): Record<Exclude<BladeElement, 'steel'>, number> {
  const fromSpirit = SPIRIT_BLADE[g.loadout.spirit];
  const out = { fire: 0, ice: 0, volt: 0, shade: 0 };
  for (const [el, from] of Object.entries(BLADE_FROM) as [Exclude<BladeElement, 'steel'>, SkillId[]][]) {
    out[el] = from.reduce((sum, s) => sum + g.skills[s], 0) + (fromSpirit === el ? g.skills.spirits : 0);
  }
  return out;
}
/** The elements the blades may take right now: plain steel, and each one you carry a skill for. */
export function bladeOptions(g: Game): BladeElement[] {
  const src = bladeSources(g);
  return ['steel', ...(Object.keys(src) as Exclude<BladeElement, 'steel'>[]).filter((el) => src[el] > 0)];
}
export function bladeElement(g: Game): BladeElement {
  // The player's pick wins while it is still available (the wheel can take a skill away).
  if (g.bladePick && bladeOptions(g).includes(g.bladePick)) return g.bladePick;
  let best: BladeElement = 'steel';
  let most = 0;
  const src = bladeSources(g);
  for (const el of Object.keys(src) as Exclude<BladeElement, 'steel'>[]) {
    if (src[el] > most) { most = src[el]; best = el; }
  }
  return best;
}
/* The arrows' look: each bow upgrade paints the arrow its own way (every
   upgrade's effect still applies whatever the look). The player may pick
   any look they own; otherwise the first owned wins. */
export type ArrowLook = 'fire' | 'water' | 'leaf' | 'ghost' | 'bolt' | 'spark';
const ARROW_LOOKS: ArrowLook[] = ['fire', 'water', 'leaf', 'ghost', 'bolt', 'spark'];
export const arrowOptions = (g: Game): ArrowLook[] => ARROW_LOOKS.filter((s) => g.skills[s] > 0);
export function arrowLook(g: Game): ArrowLook | null {
  const opts = arrowOptions(g);
  if (g.arrowPick && opts.includes(g.arrowPick)) return g.arrowPick;
  return opts[0] ?? null;
}
export function pickArrow(g: Game, look: ArrowLook) {
  if (arrowOptions(g).includes(look)) g.arrowPick = look;
}
/** Mid-run choices from the skills list: the blades' element, and which owned spirit follows you. */
export function pickBlade(g: Game, el: BladeElement) {
  if (bladeOptions(g).includes(el)) g.bladePick = el;
}
/** Taking an element skill (fire arrows, frost, the storm…) turns the blades to that element straight
    away, over the automatic choice and any earlier pick; the chips can still change it back. */
export function followElement(g: Game, skill: SkillId) {
  const el = skill === 'spirits' ? SPIRIT_BLADE[g.loadout.spirit]
    : (Object.keys(BLADE_FROM) as Exclude<BladeElement, 'steel'>[]).find((k) => BLADE_FROM[k].includes(skill));
  if (el && el !== 'steel') g.bladePick = el;
}
export function pickSpirit(g: Game, skin: SpiritSkin) {
  g.loadout.spirit = skin;
}

function spinBlades(g: Game, dt: number) {
  const p = g.player;
  const lv = g.skills.blades;
  const gear = g.gear;
  // A little faster each level, so the upgrades feel quicker too.
  gear.bladeAngle += dt * 3.4 * (1 + 0.08 * (lv - 1));
  for (const [id, t] of gear.bladeHits) {
    if (t - dt <= 0) gear.bladeHits.delete(id);
    else gear.bladeHits.set(id, t - dt);
  }
  // Evolved (Orbital Saw): two more saws, cutting half again as deep.
  const n = bladeCount(lv) + (g.evolved.blades ? 2 : 0);
  const orbit = sawOrbit(g);
  const reach = 12 * sawScale(g);
  const el = bladeElement(g);
  const dmg = (14 + 5 * (lv - 1)) * power(g, 'melee') * (el === 'shade' ? 1.3 : 1) * (g.evolved.blades ? 1.5 : 1);
  for (let i = 0; i < n; i++) {
    const a = gear.bladeAngle + (i / n) * Math.PI * 2;
    const bx = p.x + Math.cos(a) * orbit;
    const by = p.y + Math.sin(a) * orbit;
    for (const e of live(g)) {
      if (gear.bladeHits.has(e.id) || Math.hypot(e.x - bx, e.y - by) > e.r + reach) continue;
      gear.bladeHits.set(e.id, 0.4);
      hurt(g, e, dmg, away(p, e, 90));
      if (el === 'fire') { e.burn = 2; e.burnDps = Math.max(e.burnDps, 6); }
      else if (el === 'ice') { e.slow = 1.2; e.slowBy = Math.max(e.slowBy, 0.35); }
      else if (el === 'volt') chain(g, e, 1, dmg * 0.5);
      heal(g, 0.5);
      burst(g, bx, by, BLADE_SPARK[el], 3, 80, 1.6);
    }
  }
}

/* The laser comes from the sky: columns of light fall on the nearest bugs
   (one per level), from the top of the field down to the bug, and burn the
   bug it lands on and any bug right beside it. Evolved (Death Ray), five purple columns fall, faster, and brand
   magic circles on the floor where they cut. */
const laserWidth = (g: Game) => 10 + 3 * (g.skills.laser - 1) + (g.evolved.laser ? 6 : 0);
const laserDamage = (g: Game) => (30 + 12 * (g.skills.laser - 1)) * power(g, 'magic') * (g.evolved.laser ? 1.3 : 1);
/** Where the column starts: the room's top, or just above what the page shows of the open field. */
const laserTop = (g: Game) => (g.mode === 'sprints' ? 0 : g.player.y - g.viewHalf.y - 60);
function fireLaser(g: Game) {
  const p = g.player;
  const evolved = !!g.evolved.laser;
  const n = evolved ? 5 : g.skills.laser;
  const targets = live(g).sort((a, b) => dist(a, p) - dist(b, p)).slice(0, n);
  if (!targets.length) return;
  const half = laserWidth(g);
  const top = laserTop(g);
  const hit = new Set<number>();
  for (const [k, t] of targets.entries()) {
    g.fx.push({ kind: 'beam', x: t.x, y: top, r: t.y - top, a: Math.PI / 2, w: half, foot: t.y, life: 0.34, max: 0.34, delay: k * 0.06 });
    for (const e of live(g)) {
      if (hit.has(e.id) || dist(e, t) > half * 2.2 + e.r) continue;
      hit.add(e.id);
      hurt(g, e, laserDamage(g));
      if (evolved && g.fx.filter((f) => f.kind === 'rune').length < 16) g.fx.push({ kind: 'rune', x: e.x, y: e.y, r: 16 + e.r, a: Math.random() * Math.PI, life: 1, max: 1 });
    }
    if (evolved) g.fx.push({ kind: 'rune', x: t.x, y: t.y, r: 34, a: 0, life: 1.1, max: 1.1 });
  }
  g.events.push('strike');
}

function callStorm(g: Game) {
  const lv = g.skills.storm;
  const evolved = !!g.evolved.storm;
  // Evolved (Supercell): twice the bolts, wider, and each one arcs on to two more bugs.
  // The nearest bugs first (a few of them, picked at random), so the bolts come to your aid.
  const p0 = g.player;
  const pool = live(g).sort((a, b) => dist(a, p0) - dist(b, p0)).slice(0, Math.max(4, lv * (evolved ? 4 : 2)));
  const r = evolved ? 36 : 26;
  const dmg = (38 + 10 * (lv - 1)) * power(g, 'magic');
  for (let i = 0; i < lv * (evolved ? 2 : 1) && pool.length; i++) {
    const e = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    g.fx.push({ kind: 'strike', x: e.x, y: e.y, r, a: 0, life: 0.3, max: 0.3 });
    g.events.push('strike');
    g.zaps.push({ pts: zigzag({ x: e.x + rand(-20, 20), y: e.y - 220 }, e, 14), life: 0.22 });
    for (const o of live(g)) if (dist(o, e) < r + o.r) hurt(g, o, dmg);
    if (evolved) chain(g, e, 2, dmg * 0.5);
  }
}

function throwFireball(g: Game) {
  const p = g.player;
  const lv = g.skills.fireball;
  const pool = live(g);
  for (let i = 0; i < (g.evolved.fireball ? 3 : lv === 3 ? 2 : 1) && pool.length; i++) {
    const e = pool[Math.floor(Math.random() * pool.length)];
    const a = Math.atan2(e.y - p.y, e.x - p.x);
    g.fireballs.push({ x: p.x, y: p.y, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, life: 1.4 });
  }
}

function explode(g: Game, at: Vec) {
  const lv = g.skills.fireball;
  const evolved = !!g.evolved.fireball;
  // Evolved (Inferno Bomb): a wider blast that leaves burning ground behind.
  const reach = (46 + 6 * (lv - 1)) * (evolved ? 1.5 : 1);
  if (evolved) g.embers.push({ x: at.x, y: at.y, r: reach * 0.8, life: 3, max: 3 });
  g.fx.push({ kind: 'boom', x: at.x, y: at.y, r: reach, a: 0, life: 0.35, max: 0.35 });
  g.events.push('boom');
  burst(g, at.x, at.y, '#ffb347', 12, 160, 3);
  for (const e of live(g)) {
    if (dist(at, e) > reach + e.r) continue;
    hurt(g, e, (30 + 12 * (lv - 1)) * power(g, 'magic'), away(at, e, 120));
    e.burn = 2;
    e.burnDps = Math.max(e.burnDps, 8);
  }
}

export const frostReach = (g: Game) => (62 + 12 * (g.skills.frost - 1)) * (g.evolved.frost ? 1.5 : 1);

function chill(g: Game, dt: number) {
  const lv = g.skills.frost;
  g.gear.frost -= dt;
  const tick = g.gear.frost <= 0;
  if (tick) g.gear.frost = 0.25;
  for (const e of live(g)) {
    if (dist(g.player, e) > frostReach(g) + e.r) continue;
    // Evolved (Blizzard): all but frozen, and it bites twice as hard.
    e.slow = Math.max(e.slow, 0.3);
    e.slowBy = Math.max(e.slowBy, g.evolved.frost ? 0.85 : 0.3 + 0.1 * lv);
    if (tick) hurt(g, e, (8 + 5 * (lv - 1)) * 0.25 * power(g, 'magic') * (g.evolved.frost ? 2 : 1));
  }
}

/* Spirits: one companion ghost per level floats at the hero's side (left,
   right, then behind) and each one keeps shooting a purple orb at the
   nearest bug, even while you move. They never leave you. */
const SPIRIT_SLOTS = [{ x: -26, y: -10 }, { x: 26, y: -10 }, { x: 0, y: -52 }, { x: -44, y: -40 }, { x: 44, y: -40 }];
function moveSpirits(g: Game, dt: number) {
  const lv = g.skills.spirits;
  const p = g.player;
  // Evolved (Spectral Legion): two more spirits, shooting faster, orbs through one more bug.
  const evolved = !!g.evolved.spirits;
  while (g.spirits.length < lv + (evolved ? 2 : 0) && g.spirits.length < SPIRIT_SLOTS.length) {
    const slot = g.spirits.length;
    g.spirits.push({ x: p.x + SPIRIT_SLOTS[slot].x, y: p.y + SPIRIT_SLOTS[slot].y, vx: 0, vy: 0, life: 0, slot, cd: 0.4 * slot, cast: 0, dir: 1 });
  }
  const fighting = live(g).length > 0;
  for (const s of g.spirits) {
    s.life += dt;
    // Glide to the slot, bobbing a little.
    const home = SPIRIT_SLOTS[s.slot];
    const tx = p.x + home.x;
    const ty = p.y + home.y + Math.sin(s.life * 3 + s.slot) * 3;
    s.x += (tx - s.x) * Math.min(1, dt * 8);
    s.y += (ty - s.y) * Math.min(1, dt * 8);
    s.cd = Math.max(0, s.cd - dt);
    s.cast = Math.max(0, s.cast - dt);
    if (fighting && s.cd === 0) {
      const target = nearest(g, s, true);
      if (target) {
        const a = Math.atan2(target.y - s.y, target.x - s.x);
        const elem = g.loadout.spirit;
        // Thorn orbs go through one bug, shade orbs through all of them.
        const pierce = (elem === 'thorn' ? 1 : elem === 'shade' ? 99 : 0) + (evolved ? 1 : 0);
        g.shots.push(shot('orb', s, a, 320, (14 + 6 * (lv - 1)) * power(g, 'magic'), { life: 1.4, elem, pierce, ghost: elem === 'shade' }));
        s.cd = (evolved ? 0.7 : 1.1) / haste(g);
        s.cast = 0.3;
        s.dir = Math.cos(a) < 0 ? -1 : 1;
        g.events.push('orb');
      }
    }
  }
}

/* ------------------------------------- the rest of Survivor.io's actives */

/** What the bouncing shots see as walls: the room's, or the edge of what the page shows of the open field. */
function bounds(g: Game): Rect {
  if (g.mode === 'sprints') return { x: WALL, y: WALL, w: W - 2 * WALL, h: H - 2 * WALL };
  const p = g.player;
  const v = g.viewHalf;
  return { x: p.x - v.x, y: p.y - v.y, w: v.x * 2, h: v.y * 2 };
}
/** Keep a shot inside a rectangle, turning it back off the side it crossed. True if it bounced. */
function bounceIn(s: Shot, b: Rect) {
  let hit = false;
  if (s.x < b.x) { s.x = b.x; s.vx = Math.abs(s.vx); hit = true; }
  else if (s.x > b.x + b.w) { s.x = b.x + b.w; s.vx = -Math.abs(s.vx); hit = true; }
  if (s.y < b.y) { s.y = b.y; s.vy = Math.abs(s.vy); hit = true; }
  else if (s.y > b.y + b.h) { s.y = b.y + b.h; s.vy = -Math.abs(s.vy); hit = true; }
  return hit;
}
/** An explosion that hurts every bug in reach (rockets, mines); `push` is how hard it throws them back. */
function blast(g: Game, at: Vec, reach: number, dmg: number, color: string, push = 140) {
  g.fx.push({ kind: 'boom', x: at.x, y: at.y, r: reach, a: 0, life: 0.35, max: 0.35 });
  g.events.push('boom');
  burst(g, at.x, at.y, color, 12, 160, 3);
  for (const e of live(g)) if (dist(at, e) <= reach + e.r) hurt(g, e, dmg, away(at, e, push));
}

/* Brick (magic): thrown up into the air, it falls back through the bugs
   round you, hitting every one on the way. Evolved (1-ton Iron): two huge
   weights that hit twice as hard and stop the bugs they land on. */
function throwBricks(g: Game) {
  const lv = g.skills.brick;
  const evolved = !!g.evolved.brick;
  const dmg = (34 + 14 * (lv - 1)) * power(g, 'magic') * (evolved ? 2.2 : 1);
  for (let i = 0; i < (evolved ? 2 : lv); i++) {
    g.shots.push(shot('brick', g.player, -Math.PI / 2 + rand(-0.55, 0.55), rand(470, 560), dmg, {
      pierce: 1e9, ghost: true, free: true, grav: 900, life: 1.3, size: evolved ? 20 : 9, spin: rand(0, 6),
    }));
  }
}

/* Molotov (magic): bottles thrown at the bugs near you burst into a pool of
   fire that burns whatever stands in it. Evolved (Fuel Barrel): three
   barrels, wider pools that burn longer and hotter. */
function throwMolotov(g: Game) {
  const p = g.player;
  const lv = g.skills.molotov;
  const evolved = !!g.evolved.molotov;
  const pool = live(g).sort((a, b) => dist(a, p) - dist(b, p)).slice(0, 6);
  // A slow lob, the bottle tumbling end over end on its way (see updateShot).
  const flight = 0.9;
  for (let i = 0; i < (evolved ? 3 : lv >= 3 ? 2 : 1) && pool.length; i++) {
    const t = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    g.shots.push(shot('molotov', p, 0, 0, 0, { vx: (t.x - p.x) / flight, vy: (t.y - p.y) / flight, life: flight, free: true, ghost: true, spin: rand(0, 6) }));
  }
}
function landMolotov(g: Game, at: Vec) {
  const lv = g.skills.molotov;
  const evolved = !!g.evolved.molotov;
  const life = evolved ? 4.5 : 3;
  g.embers.push({ x: at.x, y: at.y, r: (32 + 6 * (lv - 1)) * (evolved ? 1.6 : 1), life, max: life, dps: (14 + 6 * (lv - 1)) * power(g, 'magic') * (evolved ? 1.5 : 1) });
  burst(g, at.x, at.y, '#fb923c', 10, 140, 3);
  g.events.push('boom');
}

/* Mines (melee): one dropped at your feet every so often; armed after half
   a second, it goes off when a bug steps on it. Evolved (Thunderbolt Bomb):
   a wider blast whose lightning jumps on to three more bugs. */
function dropMine(g: Game) {
  const max = 3 + 2 * g.skills.mines;
  if (g.mines.length >= max) g.mines.shift();
  g.mines.push({ x: g.player.x, y: g.player.y + 6, arm: 0.5, life: 25 });
}
function updateMines(g: Game, dt: number) {
  const lv = g.skills.mines;
  const evolved = !!g.evolved.mines;
  g.mines = g.mines.filter((m) => {
    m.life -= dt;
    m.arm -= dt;
    if (m.life <= 0) return false;
    if (m.arm > 0) return true;
    const foe = live(g).find((e) => dist(m, e) < e.r + 12);
    if (!foe) return true;
    const dmg = (40 + 15 * (lv - 1)) * power(g, 'melee') * (evolved ? 1.3 : 1);
    blast(g, m, (52 + 8 * (lv - 1)) * (evolved ? 1.3 : 1), dmg, '#fca5a5');
    if (evolved) {
      g.fx.push({ kind: 'pic', pic: 'volt-burst', x: m.x, y: m.y, r: 46, a: rand(0, 6), life: 0.4, max: 0.4 });
      g.fx.push({ kind: 'strike', x: m.x, y: m.y, r: 30, a: 0, life: 0.3, max: 0.3 });
      g.zaps.push({ pts: zigzag({ x: m.x + rand(-20, 20), y: m.y - 220 }, m, 14), life: 0.22 });
      chain(g, foe, 3, dmg * 0.6);
    }
    return false;
  });
}

/* Durian (melee): a spiky ball that bounces round you for good, cutting
   every bug it rolls over (each one again a little later). One, two from
   level 3. Evolved (Caltrops): a third, bigger, and they scatter caltrops
   that hurt the bugs walking over them. */
function keepDurians(g: Game, dt: number) {
  const lv = g.skills.durian;
  const evolved = !!g.evolved.durian;
  const want = (lv >= 3 ? 2 : 1) + (evolved ? 1 : 0);
  const mine = g.shots.filter((s) => s.kind === 'durian');
  for (let n = mine.length; n < want; n++) {
    const d = shot('durian', g.player, rand(0, Math.PI * 2), 170 + 15 * lv, 0, { pierce: 1e9, ghost: true, free: true, life: 1e9, tick: 0 });
    g.shots.push(d);
    mine.push(d);
  }
  // Level ups make the ones already rolling stronger and bigger too.
  for (const d of mine) {
    d.dmg = (16 + 7 * (lv - 1)) * power(g, 'melee') * (evolved ? 1.4 : 1);
    d.size = 12 + 3 * lv + (evolved ? 6 : 0);
  }
  if (!evolved) return;
  g.gear.spikes -= dt;
  if (g.gear.spikes > 0) return;
  g.gear.spikes = 0.35;
  for (const d of mine) g.spikes.push({ x: d.x, y: d.y, life: 4, tick: 0 });
  if (g.spikes.length > 36) g.spikes.splice(0, g.spikes.length - 36);
}
function updateSpikes(g: Game, dt: number) {
  const dmg = 10 * power(g, 'melee');
  g.spikes = g.spikes.filter((c) => {
    c.life -= dt;
    c.tick -= dt;
    if (c.tick <= 0) {
      c.tick = 0.5;
      for (const e of live(g)) if (dist(c, e) < e.r + 9) hurt(g, e, dmg);
    }
    return c.life > 0;
  });
}

/* Drill (ranged): bores through every bug in a line and bounces off the
   walls (or the edge of the view on the open field) a few times. Evolved
   (Whistling Arrow): two, faster, bigger, bouncing for longer. */
function fireDrill(g: Game, target: Enemy) {
  const p = g.player;
  const lv = g.skills.drill;
  const evolved = !!g.evolved.drill;
  const angle = Math.atan2(target.y - p.y, target.x - p.x);
  const n = evolved ? 2 : 1;
  for (let i = 0; i < n; i++) {
    g.shots.push(shot('drill', p, angle + (i - (n - 1) / 2) * 0.3, evolved ? 420 : 330, (22 + 8 * (lv - 1)) * power(g, 'ranged') * (evolved ? 1.5 : 1), {
      pierce: 1e9, ghost: true, free: true, bounce: 2 + lv + (evolved ? 4 : 0), life: evolved ? 5 : 3, size: evolved ? 11 : 7, tick: 0,
    }));
  }
}

/* Rocket (ranged): the weapon for the big ones, where the fireball is for
   crowds. It goes after the bug with the most health in view, flies over
   the small fry, and hits hard, throwing everything round it back. Two from
   level 3, each after a different big bug. Evolved (Sharkmaw Gun): a volley
   of five small homing missiles, one for each of the five toughest bugs. */
const toughest = (g: Game, n: number) => {
  const b = bounds(g);
  return live(g).filter((e) => inRect(e, b, 40)).sort((x, y) => y.hp - x.hp).slice(0, n);
};
function fireRocket(g: Game, target: Enemy) {
  const p = g.player;
  const lv = g.skills.rocket;
  const evolved = !!g.evolved.rocket;
  const n = evolved ? 5 : lv >= 3 ? 2 : 1;
  const aims = toughest(g, n);
  if (!aims.length) aims.push(target);
  for (let i = 0; i < n; i++) {
    const t = aims[i % aims.length];
    const spread = evolved ? (i - (n - 1) / 2) * 0.35 : 0;
    const angle = Math.atan2(t.y - p.y, t.x - p.x) + spread;
    const dmg = (70 + 30 * (lv - 1)) * power(g, 'ranged') * (evolved ? 0.6 : 1);
    g.shots.push(shot('rocket', p, angle, evolved ? 300 : 240, dmg, { life: 2.2, size: evolved ? 5 : 7, aim: t.id }));
  }
}
function rocketBoom(g: Game, s: Shot) {
  const evolved = !!g.evolved.rocket;
  const reach = evolved ? 34 : 40 + 6 * (g.skills.rocket - 1);
  // Its own bug takes the full hit; the ones round it half, and they're thrown back.
  const own = g.enemies.find((e) => e.id === s.aim && !e.dead && dist(e, s) <= reach + e.r);
  blast(g, s, reach, s.dmg * 0.5, '#fdba74', evolved ? 200 : 320);
  if (own) hurt(g, own, s.dmg * 0.5);
}

/* Ball (ranged): kicked at the nearest bug, it ricochets from bug to bug
   and off the walls, a few more times each level. Evolved (Quantum Ball):
   three balls that keep bouncing until they fade. */
function kickBall(g: Game, target: Enemy) {
  const p = g.player;
  const lv = g.skills.ball;
  const evolved = !!g.evolved.ball;
  const angle = Math.atan2(target.y - p.y, target.x - p.x);
  const n = evolved ? 3 : 1;
  for (let i = 0; i < n; i++) {
    g.shots.push(shot('ball', p, angle + (i - (n - 1) / 2) * 0.5, 320, (20 + 8 * (lv - 1)) * power(g, 'ranged') * (evolved ? 1.5 : 1), {
      pierce: 1e9, ghost: true, free: true, bounce: evolved ? 1e9 : 3 + 2 * lv, life: evolved ? 5 : 3, size: evolved ? 11 : 8, tick: 0,
    }));
  }
}

function useWeapons(g: Game, dt: number) {
  const p = g.player;
  const gear = g.gear;
  const sk = g.skills;
  for (const k of ['bow', 'knives', 'boomerang', 'sword', 'hammer', 'storm', 'fireball', 'laser', 'brick', 'molotov', 'mines', 'drill', 'rocket', 'ball'] as const) gear[k] = Math.max(0, gear[k] - dt);
  const fighting = live(g).length > 0;
  if (!fighting) return;

  // Ranged: only while standing still, at the nearest bug in plain sight.
  // On call never lets you stand for long, so there they fire on the move
  // too, at a little over half the rate: stopping is still worth it.
  const onTheMove = p.moving && g.mode === 'horde';
  if (!p.moving || onTheMove) {
    const slow = onTheMove ? 1.8 : 1;
    const target = nearest(g, p, true);
    if (target) {
      if (gear.bow === 0) { fireBow(g, target); gear.bow = slow / (2 * haste(g)); g.events.push('shoot'); }
      if (sk.knives && gear.knives === 0) { fireKnives(g, target); gear.knives = (slow * (1.2 - 0.15 * (sk.knives - 1))) / haste(g); g.events.push('knife'); }
      if (sk.boomerang && gear.boomerang === 0) { fireBoomerang(g, target); gear.boomerang = (slow * (2 - 0.25 * (sk.boomerang - 1))) / haste(g); g.events.push('boomerang'); }
      if (sk.drill && gear.drill === 0) { fireDrill(g, target); gear.drill = (slow * (2.6 - 0.3 * (sk.drill - 1))) / haste(g); g.events.push('knife'); }
      if (sk.rocket && gear.rocket === 0) { fireRocket(g, target); gear.rocket = (slow * (g.evolved.rocket ? 2.2 : 3.2 - 0.4 * (sk.rocket - 1))) / haste(g); g.events.push('boomerang'); }
      if (sk.ball && gear.ball === 0) { kickBall(g, target); gear.ball = (slow * (2.2 - 0.25 * (sk.ball - 1))) / haste(g); g.events.push('boomerang'); }
    }
  }
  // Melee and magic: always.
  if (sk.sword && gear.sword === 0) { swingSword(g); gear.sword = 0.95 - 0.12 * (sk.sword - 1); }
  if (sk.hammer && gear.hammer === 0) { slamHammer(g); gear.hammer = 2.8 - 0.35 * (sk.hammer - 1); }
  if (sk.blades) spinBlades(g, dt);
  if (sk.storm && gear.storm === 0) { callStorm(g); gear.storm = (1.8 - 0.25 * (sk.storm - 1)) * (g.evolved.storm ? 0.6 : 1); }
  if (sk.fireball && gear.fireball === 0) { throwFireball(g); gear.fireball = 2.4 - 0.3 * (sk.fireball - 1); }
  if (sk.frost) chill(g, dt);
  if (sk.laser && gear.laser === 0) { fireLaser(g); gear.laser = g.evolved.laser ? 1.8 : 2.6 - 0.3 * (sk.laser - 1); }
  if (sk.brick && gear.brick === 0) { throwBricks(g); gear.brick = g.evolved.brick ? 2 : 2.2 - 0.3 * (sk.brick - 1); }
  if (sk.molotov && gear.molotov === 0) { throwMolotov(g); gear.molotov = 2.6 - 0.3 * (sk.molotov - 1); }
  if (sk.mines && gear.mines === 0) { dropMine(g); gear.mines = 1.6 - 0.2 * (sk.mines - 1); }
  if (sk.durian) keepDurians(g, dt);
}

function hurtPlayer(g: Game, amount: number) {
  const p = g.player;
  if (p.inv > 0 || g.phase !== 'play') return;
  // The exo-bracer stacks on the worn armour.
  p.hp -= Math.max(1, Math.round(amount * (1 - Math.min(0.7, g.loadout.armor + 0.07 * g.skills.bracer))));
  p.inv = 0.7;
  p.ouch = 0.3;
  g.shake = Math.max(g.shake, 0.25);
  g.events.push('hurt');
  burst(g, p.x, p.y, '#ff8080', 10, 120, 3);
  if (p.hp <= 0) {
    if (g.revives > 0) {
      // The phoenix feather: back on your feet with half your health.
      g.revives -= 1;
      standUp(g);
      return;
    }
    p.hp = 0;
    g.phase = 'over';
  }
}

/** Back on your feet with half your health, the bugs shoved away. */
function standUp(g: Game) {
  const p = g.player;
  p.hp = Math.round(p.maxHp * 0.5);
  p.inv = 2;
  g.orbs = [];
  for (const e of live(g)) {
    const push = away(p, e, 420);
    e.kx += push.x;
    e.ky += push.y;
  }
  burst(g, p.x, p.y, '#ffb347', 40, 220, 4);
  g.shake = 0.5;
  g.events.push('revive');
}

/** What getting up again after a death costs, in coins: cheap the first time, dearer the second, and no more after that. */
export const REVIVE_PRICES = [500, 1000];
/** The next coin revive's price, or null when none is left this run. */
export const revivePrice = (g: Game): number | null => (g.reviveDeclined ? null : REVIVE_PRICES[g.paidRevives] ?? null);

/** Buy your way back from a game over: the page checks and takes the coins. */
export function paidRevive(g: Game) {
  if (g.phase !== 'over' || revivePrice(g) === null) return false;
  g.paidRevives += 1;
  g.phase = 'play';
  standUp(g);
  return true;
}

/* -------------------------------------------------------------------- update */

function updateEnemy(g: Game, e: Enemy, dt: number) {
  const p = g.player;
  if (e.spawn > 0) {
    e.spawn -= dt;
    if (e.spawn <= 0 && e.land) bossLands(g, e);
    return;
  }
  // Shadow clones fade after a while.
  if (e.clone && (e.ttl -= dt) <= 0) {
    e.dead = true;
    burst(g, e.x, e.y, '#a78bfa', 18, 120, 3);
    return;
  }
  e.hit = Math.max(0, e.hit - dt);
  e.wobble += dt * 6;
  if (e.burn > 0) {
    e.burn -= dt;
    e.burnTick -= dt;
    if (e.burnTick <= 0) {
      e.burnTick = 0.4;
      hurt(g, e, e.burnDps * 0.4);
      burst(g, e.x, e.y - e.r * 0.5, '#ff9a1f', 2, 40, 2.5);
    }
  }
  if (e.slow > 0) e.slow -= dt;
  else e.slowBy = 0;
  const slowFactor = e.slow > 0 ? 1 - e.slowBy : 1;
  const dx = p.x - e.x;
  const dy = p.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  let mx = 0;
  let my = 0;

  if (e.kind === 'bug' || e.kind === 'legacy') {
    const sway = e.kind === 'bug' ? Math.sin(e.wobble) * 0.35 : 0;
    mx = ux - uy * sway;
    my = uy + ux * sway;
  } else if (e.kind === 'ticket') {
    // Keeps its distance and throws a ticket at you every couple of seconds.
    if (blocked(e, p, g.obstacles)) { mx = -uy * e.side; my = ux * e.side; } // step out for a clear shot
    else if (d < 150) { mx = -ux; my = -uy; } else if (d > 220) { mx = ux; my = uy; } else { mx = -uy * 0.6; my = ux * 0.6; }
    e.cd -= dt;
    if (e.cd <= 0) {
      e.cd = rand(1.8, 2.6);
      g.orbs.push({ x: e.x, y: e.y, vx: ux * 150, vy: uy * 150, r: 6, dmg: e.dmg, life: 4, bounce: g.hazard === 'bouncy' ? 1 : 0 });
    }
  } else if (e.kind === 'boss') {
    updateBoss(g, e, dt, ux, uy);
    const walk = e.rage ? Math.min(RAGE_WALK, RAGE_TOP / e.speed) : 0.6;
    const run = e.rage ? 12 : 9;
    if (e.dash > 0) { mx = e.dir.x * run; my = e.dir.y * run; } else if (e.aim > 0 || e.chan > 0) { mx = 0; my = 0; } else { mx = ux * walk; my = uy * walk; }
  }

  // Walking round a rack: sidestep, still edging closer, until the player is
  // in sight again (or it gives up after a while).
  if (e.detour > 0) {
    e.detour -= dt;
    if (!blocked(e, p, g.obstacles)) e.detour = 0;
    mx = -uy * e.side + ux * 0.25;
    my = ux * e.side + uy * 0.25;
  }
  // Turn only when clearly to one side, so it doesn't flicker while you stand right above or below it.
  const side = e.dash > 0 ? e.dir.x : e.detour > 0 ? mx : ux;
  if (Math.abs(side) > 0.15) e.face = side < 0 ? -1 : 1;
  const want = Math.hypot(mx, my) * e.speed * slowFactor * dt;
  const fromX = e.x;
  const fromY = e.y;
  e.x += mx * e.speed * slowFactor * dt + e.kx * dt;
  e.y += my * e.speed * slowFactor * dt + e.ky * dt;
  e.kx *= Math.pow(0.002, dt);
  e.ky *= Math.pow(0.002, dt);
  keepInRoom(g, e);
  // Barely moved although it wanted to: a rack (or a wall, mid-detour) is in
  // the way. Go round it, trying the other side each time it gets stuck.
  if (e.kind !== 'boss' && want > 0.2 && Math.hypot(e.x - fromX, e.y - fromY) < want * 0.35) {
    if (e.detour > 0) e.side = -e.side;
    else if (blocked(e, p, g.obstacles)) e.detour = 2.5;
  }

  if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r - 2) hurtPlayer(g, e.dmg);
}

/* ------------------------------------------------------------------ bosses */

/**
 * Two bosses a world. The one in room 6 (the first on call) is the world's cast boss with the usual kit
 * (a ring of orbs, a charge, bugs for backup) plus one move of its world (`MID_MOVE`). The final one in
 * room 12 (the second on call) is a boss of its own (`FINAL_BOSS`), bigger, faster at all of that, with its
 * world's move too, its signature attack (`SIGNATURE`) and a fury under half health that speeds it all up.
 * Moves go by world, not by the cast the picker forces, so the robots' world always has the laser.
 */
export const FINAL_BOSS = ['kernel', 'archdemon', 'drakkar', 'queen', 'zeus', 'mech', 'wraith', 'chimera'] as const;
/** The water world's final boss is a Viking longship with its captain at the helm; at half health the ship
    breaks up and the captain, Valdur, fights on alone: smaller, much faster, leaping and charging in a frenzy. */
export type FinalBoss = (typeof FINAL_BOSS)[number] | 'valdur';
type Move = 'volley' | 'breath' | 'geysers' | 'leap' | 'javelins' | 'missiles' | 'blink' | 'acid';
type Signature = 'spiral' | 'meteors' | 'tide' | 'roots' | 'grid' | 'laser' | 'clones' | 'frenzy';
const MID_MOVE: Move[] = ['volley', 'breath', 'geysers', 'leap', 'javelins', 'missiles', 'blink'];
const SIGNATURE: Signature[] = ['spiral', 'meteors', 'tide', 'roots', 'grid', 'laser', 'clones'];
/** World 8 mixes them: a random move each time, and the signatures of worlds 2–7 in turn. */
const moveOf = (g: Game, e: Enemy): Move =>
  e.bossId === 'valdur' ? 'leap' : e.bossId === 'queen' ? 'acid' : g.world <= 7 ? MID_MOVE[g.world - 1] : MID_MOVE[Math.floor(Math.random() * 7)];
const signatureOf = (g: Game, e: Enemy): Signature =>
  e.bossId === 'valdur' ? 'frenzy' : g.world <= 7 ? SIGNATURE[g.world - 1] : SIGNATURE[1 + (e.sigs % 6)];

/** The longship breaks up at half health: wreckage, water on the floor, and Valdur leaps out of it. */
/** Below this share of its health the final boss goes into its last stand. */
export const RAGE_AT = 0.2;
/* Its walk goes from 0.6 to 1.8 of its speed, never faster than 120 (the hero runs at 150),
   its charges are a third faster and it aims for less time. */
const RAGE_WALK = 1.8;
const RAGE_TOP = 120;
function enrage(g: Game, e: Enemy) {
  e.rage = true;
  e.aim = Math.min(e.aim, 0.2);
  e.cd2 = Math.min(e.cd2, 0.8);
  g.shake = Math.max(g.shake, 0.6);
  burst(g, e.x, e.y, '#ef4444', 26);
  g.events.push('rage');
}

function breakShip(g: Game, e: Enemy) {
  // The burning wreck stays on the water for a moment while he leaps clear.
  g.fx.push({ kind: 'pic', pic: 'drakkar-wreck', x: e.x, y: e.y - 25, r: 85, a: 0, life: 1.6, max: 1.6 });
  e.hp = e.maxHp / 2;
  e.bossId = 'valdur';
  e.r = 40;
  e.speed *= 2.1;
  e.chan = 0;
  e.aim = 0;
  e.dash = 0;
  e.cd2 = 1.2;
  e.cd4 = 3.5;
  e.cd5 = 5;
  burst(g, e.x, e.y, '#a16207', 50, 260, 4);
  burst(g, e.x, e.y, '#e0f2fe', 30, 200, 3);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + rand(0, 1);
    g.hazards.push({ kind: 'puddle', ...inside(g, { x: e.x + Math.cos(a) * 45, y: e.y + Math.sin(a) * 45 }, 30), r: 30, ttl: 7 });
  }
  g.shake = 0.6;
  e.spawn = 0.9;
  e.vanish = true;
  e.land = 'slam';
  g.events.push('boss');
}
const TONE: Record<ThreatEl, string> = { fire: '#fb923c', water: '#38bdf8', leaf: '#4ade80', bolt: '#facc15', laser: '#f87171', shadow: '#a78bfa', glitch: '#c084fc' };

/** A spot inside the room (or the visible field), `m` from its edges. */
function inside(g: Game, v: Vec, m: number): Vec {
  const b = bounds(g);
  return { x: clamp(v.x, b.x + m, b.x + b.w - m), y: clamp(v.y, b.y + m, b.y + b.h - m) };
}
/** The final bosses' rings fly as their element's weapon pictures (the cast bosses keep the plain orbs). */
const RING_PIC: Partial<Record<string, OrbPic>> = { archdemon: 'fireball', drakkar: 'water', valdur: 'water', queen: 'leaf', zeus: 'bolt', mech: 'spark', wraith: 'ghost' };
const ring = (g: Game, e: Enemy, n: number, speed: number, tone = '', turn = rand(0, Math.PI * 2), pic?: OrbPic) => {
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * Math.PI * 2;
    g.orbs.push({ x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 7, dmg: Math.round(e.dmg * 0.64), life: 5, bounce: g.hazard === 'bouncy' ? 1 : 0, tone, pic });
  }
};
const circle = (g: Game, at: Vec, r: number, warn: number, dmg: number, el: ThreatEl, after?: 'lava' | 'thorns') =>
  g.threats.push({ kind: 'circle', x: at.x, y: at.y, r, a: 0, len: 0, warn, max: warn, life: 0.2, dmg, el, after });

function updateBoss(g: Game, e: Enemy, dt: number, ux: number, uy: number) {
  const final = e.final;
  e.pose = Math.max(0, e.pose - dt);
  // Clones only throw rings now and then.
  if (e.clone) {
    e.cd -= dt;
    if (e.cd <= 0) { e.cd = rand(3.2, 4); ring(g, e, 7, 95, TONE.shadow, undefined, 'ghost'); }
    return;
  }
  // The final boss's fury: under half health everything comes a quarter sooner.
  const fury = final && e.hp < e.maxHp / 2 ? 0.75 : 1;
  if (e.chan > 0) {
    channel(g, e, dt);
    return;
  }
  // Radial burst of orbs, turning a little every time.
  e.cd -= dt;
  if (e.cd <= 0) {
    e.cd = (final ? 2.4 : 3.1) * fury;
    ring(g, e, final ? 14 : 10, final ? 120 : 105, '', undefined, final ? RING_PIC[e.bossId] : undefined);
    e.pose = 0.35;
    e.act = 'burst';
  }
  // Charge: stop and aim for a moment, then dash at where you were (Valdur's frenzy chains them).
  if (e.dash > 0) {
    e.dash -= dt;
    if (e.dash <= 0 && e.combo > 0) {
      e.combo -= 1;
      e.aim = 0.35;
      e.dir = { x: ux, y: uy };
    }
  } else if (e.aim > 0) {
    e.aim -= dt;
    if (e.aim <= 0) e.dash = 0.55;
  } else {
    e.cd2 -= dt;
    if (e.cd2 <= 0) {
      e.cd2 = (final ? 5 : 6) * fury * (e.rage ? 0.6 : 1);
      e.aim = e.rage ? 0.4 : 0.7;
      e.dir = { x: ux, y: uy };
    }
  }
  // Calls for backup (on call, only while the field has room).
  e.cd3 -= dt;
  if (e.cd3 <= 0 && (g.mode === 'sprints' || g.enemies.length < 56)) {
    e.cd3 = (final ? 8 : 10) * fury;
    for (const side of [-1, 1]) {
      g.enemies.push(makeEnemy(g, 'bug', g.room, { x: g.mode === 'horde' ? e.x + side * 60 : clamp(e.x + side * 60, 40, W - 40), y: e.y + 30 }, 0.6));
    }
  }
  if (e.dash > 0 || e.aim > 0) return;
  // The world's move.
  e.cd4 -= dt;
  if (e.cd4 <= 0) {
    e.cd4 = (final ? 6.5 : 5.5) * fury;
    worldMove(g, e, moveOf(g, e));
    if (e.spawn > 0 || e.chan > 0) return;
  }
  // The final boss's signature.
  if (final) {
    e.cd5 -= dt;
    if (e.cd5 <= 0) {
      e.cd5 = 8 * fury;
      signature(g, e, signatureOf(g, e));
      e.sigs += 1;
    }
  }
}

function worldMove(g: Game, e: Enemy, move: Move) {
  const p = g.player;
  const aim = Math.atan2(p.y - e.y, p.x - e.x);
  const dmg = Math.round(e.dmg * 0.6);
  e.pose = 0.5;
  e.act = 'move';
  switch (move) {
    case 'volley':
      // A stream of bug reports: three fans of three, each a little faster.
      for (const [k, speed] of [150, 185, 220].entries()) {
        for (const off of [-0.18, 0, 0.18]) {
          const a = aim + off + (k - 1) * 0.04;
          g.orbs.push({ x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 6, dmg, life: 5, bounce: 0, tone: TONE.glitch });
        }
      }
      break;
    case 'breath':
      // Fire breath: a cone of flames at you.
      for (let i = 0; i < 9; i++) {
        const a = aim + (i / 8 - 0.5) * 1.05;
        const speed = i % 2 ? 165 : 135;
        g.orbs.push({ x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 7, dmg, life: 3, bounce: 0, tone: TONE.fire, pic: 'fireball' });
      }
      break;
    case 'geysers': {
      // Geysers burst under you, then along the way you were going.
      const step = p.moving ? { x: Math.cos(p.heading) * 55, y: Math.sin(p.heading) * 55 } : { x: 0, y: 0 };
      for (let i = 0; i < 3; i++) circle(g, inside(g, { x: p.x + step.x * i, y: p.y + step.y * i }, 30), 30, 0.9 + i * 0.3, dmg, 'water');
      break;
    }
    case 'acid':
      // The Carnivorous Queen spits a gush of acid: big, slow blobs in a fan.
      for (let i = 0; i < 5; i++) {
        const a = aim + (i / 4 - 0.5) * 0.7;
        const speed = 115 + (i % 2) * 30;
        g.orbs.push({ x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 9, dmg, life: 4, bounce: 0, tone: '#d9f99d', pic: 'acid' });
      }
      break;
    case 'leap':
      // Leaps off the floor and comes down where you stand; its shadow warns where (no pose: it is in the air).
      e.pose = 0;
      Object.assign(e, inside(g, p, e.r + 8));
      e.spawn = 1.1;
      e.vanish = true;
      e.land = 'slam';
      break;
    case 'javelins':
      // Three javelins of lightning, shown before they fly.
      for (const off of [-0.25, 0, 0.25]) g.threats.push({ kind: 'line', x: e.x, y: e.y, r: 9, a: aim + off, len: 720, warn: 0.75, max: 0.75, life: 0.18, dmg, el: 'bolt', shot: 'bolt' });
      break;
    case 'missiles':
      // Three missiles that turn after you for a couple of seconds.
      for (const off of [-0.9, 0, 0.9]) {
        const a = aim + off;
        g.orbs.push({ x: e.x, y: e.y, vx: Math.cos(a) * 125, vy: Math.sin(a) * 125, r: 6, dmg, life: 5, bounce: 0, tone: '#fb923c', home: 2.4, pic: 'rocket' });
      }
      break;
    case 'blink': {
      // Fades into the shadows and comes back somewhere round you.
      e.pose = 0;
      const a = rand(0, Math.PI * 2);
      Object.assign(e, inside(g, { x: p.x + Math.cos(a) * 130, y: p.y + Math.sin(a) * 130 }, e.r + 8));
      e.spawn = 0.8;
      e.vanish = true;
      e.land = 'blink';
      break;
    }
  }
}

function signature(g: Game, e: Enemy, sig: Signature) {
  const p = g.player;
  const b = bounds(g);
  const dmg = Math.round(e.dmg * 0.7);
  e.pose = 0.8;
  e.act = 'sig';
  switch (sig) {
    case 'spiral':
      // Stack overflow: a double spiral of glitches for three seconds, standing still.
      e.chan = 3;
      e.chanTick = 0;
      e.dir = { x: 0, y: 1 };
      break;
    case 'meteors':
      // Meteor rain: two on you, the rest round the room; each one leaves lava for a while.
      for (let i = 0; i < 7; i++) {
        const at = i < 2 ? { x: p.x + rand(-30, 30) * i, y: p.y + rand(-30, 30) * i } : { x: rand(b.x, b.x + b.w), y: rand(b.y, b.y + b.h) };
        circle(g, inside(g, at, 34), 34, 1.2 + i * 0.12, dmg, 'fire', 'lava');
      }
      break;
    case 'tide': {
      // A tidal wave across the room with one gap in it; under fury a second one follows from the side.
      const down = p.y > e.y;
      const gap = rand(-b.w / 2 + 50, b.w / 2 - 50);
      g.threats.push({ kind: 'wave', x: b.x + b.w / 2, y: down ? b.y : b.y + b.h, r: 16, a: down ? Math.PI / 2 : -Math.PI / 2, len: b.w / 2, warn: 1, max: 1, life: 99, dmg, el: 'water', speed: 170, done: 0, gap, gapW: 38 });
      if (e.hp < e.maxHp / 2) {
        const right = p.x > e.x;
        g.threats.push({ kind: 'wave', x: right ? b.x : b.x + b.w, y: b.y + b.h / 2, r: 16, a: right ? 0 : Math.PI, len: b.h / 2, warn: 2.4, max: 2.4, life: 99, dmg, el: 'water', speed: 150, done: 0, gap: rand(-b.h / 2 + 60, b.h / 2 - 60), gapW: 42 });
      }
      break;
    }
    case 'roots': {
      // Roots burst out of the floor in three rows towards you, leaving thorns behind.
      const aim = Math.atan2(p.y - e.y, p.x - e.x);
      for (const off of [-0.4, 0, 0.4]) {
        for (let k = 1; k <= 7; k++) {
          const at = { x: e.x + Math.cos(aim + off) * k * 40, y: e.y + Math.sin(aim + off) * k * 40 };
          circle(g, inside(g, at, 18), 20, 0.55 + k * 0.11, Math.round(dmg * 0.8), 'leaf', k % 2 ? 'thorns' : undefined);
        }
      }
      break;
    }
    case 'grid': {
      // The storm grid: three bolts across the room, then three down it.
      for (const [i, dy] of [-110, 0, 110].entries()) {
        const y = clamp(p.y + dy, b.y + 14, b.y + b.h - 14);
        g.threats.push({ kind: 'line', x: b.x, y, r: 12, a: 0, len: b.w, warn: 1 + i * 0.05, max: 1, life: 0.2, dmg, el: 'bolt' });
      }
      for (const [i, dx] of [-95, 0, 95].entries()) {
        const x = clamp(p.x + dx, b.x + 14, b.x + b.w - 14);
        g.threats.push({ kind: 'line', x, y: b.y, r: 12, a: Math.PI / 2, len: b.h, warn: 2 + i * 0.05, max: 2, life: 0.2, dmg, el: 'bolt' });
      }
      break;
    }
    case 'laser': {
      // Two lasers from the chest, aimed at you, then sweeping round while it stands.
      const aim = Math.atan2(p.y - e.y, p.x - e.x);
      const spin = (Math.random() < 0.5 ? -1 : 1) * 0.95;
      for (const off of [0, Math.PI]) g.threats.push({ kind: 'beam', x: e.x, y: e.y, r: 9, a: aim + off, len: 760, warn: 1, max: 1, life: 3.4, dmg, el: 'laser', spin, owner: e.id });
      e.chan = 4.4;
      break;
    }
    case 'frenzy':
      // Berserker frenzy: four charges in a row, each aimed again.
      e.combo = 3;
      e.aim = 0.45;
      e.dir = { x: Math.cos(Math.atan2(p.y - e.y, p.x - e.x)), y: Math.sin(Math.atan2(p.y - e.y, p.x - e.x)) };
      g.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 60, a: 0, life: 0.4, max: 0.4 });
      break;
    case 'clones': {
      // Splits into the shadows: it and three clones come back round you, and only one is real.
      const turn = rand(0, Math.PI * 2);
      const spots = [0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + turn;
        return inside(g, { x: p.x + Math.cos(a) * 135, y: p.y + Math.sin(a) * 135 }, e.r + 8);
      });
      const real = Math.floor(Math.random() * 4);
      spots.forEach((at, i) => {
        if (i === real) {
          Object.assign(e, at);
          e.spawn = 0.9;
          e.vanish = true;
          e.land = 'blink';
          return;
        }
        const c = makeEnemy(g, 'boss', g.room, at, 0.9);
        Object.assign(c, { look: e.look, bossId: e.bossId, final: true, clone: true, ttl: 7, r: e.r, hp: Math.max(40, Math.round(e.maxHp * 0.05)), cd: rand(1.2, 2.2), vanish: true, land: 'blink' as const });
        c.maxHp = c.hp;
        c.dmg = Math.round(e.dmg * 0.6);
        g.enemies.push(c);
      });
      break;
    }
  }
}

/** A channelled attack: the boss stands still while it lasts. */
function channel(g: Game, e: Enemy, dt: number) {
  e.chan -= dt;
  e.pose = Math.max(e.pose, 0.2);
  if (signatureOf(g, e) === 'spiral' && g.world === 1) {
    e.chanTick -= dt;
    if (e.chanTick <= 0) {
      e.chanTick = 0.11;
      const a = e.chan * 2.3;
      for (const off of [0, Math.PI]) {
        g.orbs.push({ x: e.x, y: e.y, vx: Math.cos(a + off) * 135, vy: Math.sin(a + off) * 135, r: 6, dmg: Math.round(e.dmg * 0.55), life: 4.5, bounce: 0, tone: TONE.glitch });
      }
    }
  }
}

/** A boss comes back down: a slam with a ring of shockwave orbs, or out of the shadows with a ring of its own. */
function bossLands(g: Game, e: Enemy) {
  const what = e.land;
  e.land = '';
  e.vanish = false;
  if (what === 'slam') {
    const el: ThreatEl = e.bossId === 'valdur' ? 'water' : 'leaf';
    circle(g, e, 66, 0, Math.round(e.dmg * 0.9), el);
    g.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 70, a: 0, life: 0.4, max: 0.4, big: true });
    // The hammer's painted slam under it (blue rings of water for Valdur).
    g.fx.push({ kind: 'pic', pic: el === 'water' ? 'shock-ring' : 'slam', x: e.x, y: e.y + e.r * 0.5, r: 80, a: 0, life: 0.45, max: 0.45 });
    g.shake = Math.max(g.shake, 0.35);
    ring(g, e, 8, 120, TONE[el], undefined, el === 'water' ? 'water' : 'leaf');
    // Valdur roars as he lands.
    if (e.bossId === 'valdur') { e.pose = 0.6; e.act = 'move'; }
  } else {
    // Out of the shadows (the wraith and its clones alike rise out of them).
    if (e.bossId === 'wraith') { e.pose = 0.5; e.act = 'move'; }
    if (!e.clone) ring(g, e, 12, 100, TONE.shadow, undefined, 'ghost');
    g.fx.push({ kind: 'pic', pic: 'spectral-bolt', top: true, x: e.x, y: e.y - e.r * 0.3, r: e.r * 1.2, a: 0, life: 0.4, max: 0.4 });
  }
  burst(g, e.x, e.y, what !== 'slam' ? '#a78bfa' : e.bossId === 'valdur' ? '#7dd3fc' : '#86efac', 20, 150, 3);
}

/** Distance from a point to the segment from (x, y) along angle a for len. */
function toSegment(v: Vec, x: number, y: number, a: number, len: number) {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const t = clamp((v.x - x) * dx + (v.y - y) * dy, 0, len);
  return Math.hypot(v.x - (x + dx * t), v.y - (y + dy * t));
}

function updateThreats(g: Game, dt: number) {
  if (!g.threats.length) return;
  const p = g.player;
  g.threats = g.threats.filter((t) => {
    if (t.kind === 'beam' && t.owner !== undefined) {
      const boss = g.enemies.find((e) => e.id === t.owner && !e.dead);
      if (!boss) return false;
      t.x = boss.x;
      t.y = boss.y;
    }
    if (t.warn > 0) {
      t.warn -= dt;
      if (t.warn <= 0) threatHits(g, t);
      return true;
    }
    if (t.kind === 'beam') t.a += (t.spin ?? 0) * dt;
    if (t.kind === 'wave') {
      t.done = (t.done ?? 0) + (t.speed ?? 0) * dt;
      // Gone once it has crossed the room.
      const across = Math.abs(Math.cos(t.a)) > 0.5 ? bounds(g).w : bounds(g).h;
      if (t.done > across + t.r) return false;
      if (Math.random() < 0.8) {
        const s = rand(-t.len, t.len);
        if (Math.abs(s - (t.gap ?? 0)) > (t.gapW ?? 0)) {
          const at = waveAt(t, s);
          g.particles.push({ x: at.x, y: at.y, vx: Math.cos(t.a) * 60 + rand(-30, 30), vy: Math.sin(t.a) * 60 + rand(-30, 30), life: 0.4, max: 0.4, size: 2.6, color: '#e0f2fe' });
        }
      }
    }
    if (t.dmg > 0 && touches(t, p, p.r * 0.6)) hurtPlayer(g, t.dmg);
    t.life -= dt;
    return t.life > 0;
  });
}

/** The point `s` along a wave's front (from its middle). */
export function waveAt(t: Threat, s: number): Vec {
  const fx = t.x + Math.cos(t.a) * (t.done ?? 0);
  const fy = t.y + Math.sin(t.a) * (t.done ?? 0);
  return { x: fx - Math.sin(t.a) * s, y: fy + Math.cos(t.a) * s };
}

function touches(t: Threat, v: Vec, r: number) {
  if (t.kind === 'circle') return dist(t, v) < t.r + r;
  if (t.kind === 'line' || t.kind === 'beam') return toSegment(v, t.x, t.y, t.a, t.len) < t.r + r;
  // The wave: how far along its path the point is, and where along the front.
  const dx = v.x - t.x;
  const dy = v.y - t.y;
  const along = dx * Math.cos(t.a) + dy * Math.sin(t.a);
  const side = -dx * Math.sin(t.a) + dy * Math.cos(t.a);
  return Math.abs(along - (t.done ?? 0)) < t.r + r && Math.abs(side) < t.len && Math.abs(side - (t.gap ?? 0)) > (t.gapW ?? 0);
}

/** The moment a warning runs out: the flash, and what it leaves behind. */
function threatHits(g: Game, t: Threat) {
  if (t.kind === 'circle') {
    if (t.el === 'fire') g.fx.push({ kind: 'boom', x: t.x, y: t.y, r: t.r, a: 0, life: 0.35, max: 0.35 });
    else burst(g, t.x, t.y, TONE[t.el], 12, 140, 3);
    // Geysers burst as the steam cloud; roots leave the caltrops' spikes.
    if (t.el === 'water' && t.r < 40) g.fx.push({ kind: 'pic', pic: 'steam-cloud', top: true, x: t.x, y: t.y, r: t.r * 1.6, a: rand(0, 6), life: 0.5, max: 0.5 });
    if (t.el === 'leaf' && t.after) g.fx.push({ kind: 'pic', pic: 'caltrops', x: t.x, y: t.y, r: t.r * 1.2, a: rand(0, 6), life: 2.5, max: 2.5 });
    if (t.after) g.hazards.push({ kind: t.after, x: t.x, y: t.y, r: t.after === 'lava' ? 26 : 16, ttl: t.after === 'lava' ? 4 : 2.5 });
    if (t.el === 'fire') g.events.push('boom');
  } else if (t.shot) {
    // A javelin: the bolt itself flies down the line it warned.
    g.orbs.push({ x: t.x, y: t.y, vx: Math.cos(t.a) * 430, vy: Math.sin(t.a) * 430, r: 7, dmg: t.dmg, life: 2, bounce: 0, tone: TONE.bolt, pic: t.shot });
    t.life = 0;
    t.dmg = 0;
  } else if (t.kind === 'line' && t.el === 'bolt') {
    const end = { x: t.x + Math.cos(t.a) * t.len, y: t.y + Math.sin(t.a) * t.len };
    g.zaps.push({ pts: zigzag(t, end, 10), life: 0.22 });
    g.events.push('strike');
  }
}

function updateShot(g: Game, s: Shot, dt: number): boolean {
  const p = g.player;
  const px = s.x;
  const py = s.y;
  s.life -= dt;
  if (s.life <= 0) {
    if (s.kind === 'rocket') rocketBoom(g, s);
    else if (s.kind === 'molotov') landMolotov(g, s);
    return false;
  }
  // Shots that may hit the same bugs again after a moment.
  if (s.tick !== undefined) {
    s.tick -= dt;
    if (s.tick <= 0) { s.tick = 0.4; s.hits.clear(); }
  }
  if (s.grav) s.vy += s.grav * dt;
  if (s.kind === 'brick' || s.kind === 'ball') s.spin += dt * 9;
  if (s.kind === 'molotov') s.spin += dt * 4.5;
  if (s.kind === 'durian' || s.kind === 'drill') s.spin += dt * 14;
  if (s.kind === 'rocket') {
    // Rockets speed up and steer after their own bug (the evolved missiles turn harder).
    const speed = Math.min(620, Math.hypot(s.vx, s.vy) * (1 + dt * 1.6));
    let a = Math.atan2(s.vy, s.vx);
    const t = g.enemies.find((e) => e.id === s.aim && !e.dead) ?? (g.evolved.rocket ? nearest(g, s) : undefined);
    if (t) {
      const want = Math.atan2(t.y - s.y, t.x - s.x);
      const turn = ((want - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const rate = g.evolved.rocket ? 4 : 2;
      a += clamp(turn, -rate * dt, rate * dt);
    }
    s.vx = Math.cos(a) * speed;
    s.vy = Math.sin(a) * speed;
    if (Math.random() < 0.7) g.particles.push({ x: s.x, y: s.y, vx: -s.vx * 0.1 + rand(-20, 20), vy: -s.vy * 0.1 + rand(-20, 20), life: 0.35, max: 0.35, size: 2.5, color: '#fdba74' });
  }
  if (s.kind === 'boomerang') {
    s.spin += dt * 16;
    s.out -= dt;
    // On the way back it homes in on you, and can hit each bug again.
    if (s.out <= 0) {
      if (s.out + dt > 0) s.hits.clear();
      const d = dist(s, p) || 1;
      if (d < p.r) return false;
      s.vx = ((p.x - s.x) / d) * 360;
      s.vy = ((p.y - s.y) / d) * 360;
    }
  }
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  // Will-o'-wisp (fire + ghost arrows): the arrow leaves a trail of blue-green flame.
  if (s.bow && s.kind === 'arrow' && fusionOf(g) === 'wisp') {
    s.trail = (s.trail ?? 0) - dt;
    if (s.trail <= 0 && g.embers.length < 70) {
      s.trail = 0.07;
      g.embers.push({ x: s.x, y: s.y, r: 11, life: 1, max: 1, dps: 9 * power(g, 'ranged'), kind: 'wisp' });
    }
  } else if (s.bow && s.kind === 'arrow' && fusionOf(g)) fusionTrail(g, s, dt, fusionOf(g) as Fusion);
  // A bottle in flight touches nothing; it bursts where it lands.
  if (s.kind === 'molotov') return true;
  // Rockets blow up on walls and racks.
  if (s.kind === 'rocket' && (outside(g, s) || g.obstacles.some((o) => inRect(s, o)))) { rocketBoom(g, s); return false; }
  // Drill, durian and ball bounce off the walls, or the edge of the view on the open field.
  if (s.kind === 'drill' || s.kind === 'durian' || s.kind === 'ball') {
    if (bounceIn(s, bounds(g)) && s.kind === 'drill') {
      s.bounce -= 1;
      if (s.bounce < 0) return false;
    }
  }

  // Walls and racks: bounce (sparks), pass (ghost, boomerang) or stop.
  const hitWallX = g.mode === 'sprints' && (s.x < WALL || s.x > W - WALL);
  const hitWallY = g.mode === 'sprints' && (s.y < WALL || s.y > H - WALL);
  if ((hitWallX || hitWallY) && !s.free) {
    if (s.kind === 'boomerang') {
      s.x = clamp(s.x, WALL, W - WALL);
      s.y = clamp(s.y, WALL, H - WALL);
      s.out = Math.min(s.out, 0);
    } else if (s.bounce > 0) {
      s.bounce -= 1;
      if (hitWallX) { s.vx = -s.vx; s.x = clamp(s.x, WALL, W - WALL); }
      if (hitWallY) { s.vy = -s.vy; s.y = clamp(s.y, WALL, H - WALL); }
      burst(g, s.x, s.y, '#ffd27a', 3, 80, 2);
    } else {
      burst(g, s.x, s.y, '#ffffff', 2, 60, 1.5);
      return false;
    }
  }
  if (!s.ghost) {
    for (const o of g.obstacles) {
      if (!inRect(s, o)) continue;
      if (s.bounce > 0) {
        s.bounce -= 1;
        const wasInX = px > o.x && px < o.x + o.w;
        if (wasInX) s.vy = -s.vy; else s.vx = -s.vx;
        s.x = px;
        s.y = py;
        burst(g, s.x, s.y, '#ffd27a', 3, 80, 2);
      } else {
        burst(g, s.x, s.y, '#ffffff', 2, 60, 1.5);
        return false;
      }
    }
  }
  for (const e of g.enemies) {
    if (e.dead || e.spawn > 0 || s.hits.has(e.id)) continue;
    if (Math.hypot(s.x - e.x, s.y - e.y) > e.r + (s.size ?? (s.kind === 'boomerang' ? 9 : 4))) continue;
    s.hits.add(e.id);
    if (s.kind === 'rocket') {
      // It flies over the small fry while its own bug is still standing.
      if (s.aim !== undefined && e.id !== s.aim && g.enemies.some((o) => o.id === s.aim && !o.dead)) { s.hits.delete(e.id); continue; }
      rocketBoom(g, s);
      return false;
    }
    hitWithShot(g, e, s);
    // The 1-ton weight stops the bugs it lands on.
    if (s.kind === 'brick' && g.evolved.brick) {
      e.slow = Math.max(e.slow, 0.6);
      e.slowBy = 1;
      g.shake = Math.max(g.shake, 0.08);
      if (s.hits.size === 1) g.fx.push({ kind: 'pic', pic: 'impact', x: e.x, y: e.y + e.r * 0.5, r: 24, a: rand(0, 6), life: 0.6, max: 0.6 });
    }
    // The ball flies off the bug it hit, a little to one side, until its bounces run out.
    if (s.kind === 'ball') {
      s.bounce -= 1;
      if (s.bounce < 0) return false;
      const speed = Math.hypot(s.vx, s.vy);
      const a = Math.atan2(s.y - e.y, s.x - e.x) + rand(-0.7, 0.7);
      s.vx = Math.cos(a) * speed;
      s.vy = Math.sin(a) * speed;
      return true;
    }
    if (s.pierce > 0) { s.pierce -= 1; continue; }
    // Ricochet: the arrow turns towards the nearest bug it hasn't hit yet.
    if (s.bounce > 0 && s.kind === 'arrow') {
      let next: Enemy | undefined;
      let best = 170;
      for (const o of live(g)) {
        if (s.hits.has(o.id)) continue;
        const d = dist(s, o);
        if (d < best) { best = d; next = o; }
      }
      if (next) {
        s.bounce -= 1;
        s.dmg *= 0.65; // each bounce hits softer
        const speed = Math.hypot(s.vx, s.vy);
        const a = Math.atan2(next.y - s.y, next.x - s.x);
        s.vx = Math.cos(a) * speed;
        s.vy = Math.sin(a) * speed;
        s.life = Math.max(s.life, 0.8);
        burst(g, s.x, s.y, '#ffd27a', 4, 90, 2);
        return true;
      }
    }
    return false;
  }
  return true;
}

function updateHazards(g: Game, dt: number) {
  const p = g.player;
  // What a boss left on the floor fades.
  if (g.hazards.some((h) => h.ttl !== undefined)) g.hazards = g.hazards.filter((h) => h.ttl === undefined || (h.ttl -= dt) > 0);
  updateThreats(g, dt);
  for (const h of g.hazards) {
    if (h.kind === 'puddle' || dist(h, p) > h.r + p.r * 0.4) continue;
    hurtPlayer(g, h.kind === 'lava' ? 8 : 10);
    if (h.kind === 'lava' && Math.random() < 0.5) burst(g, p.x, p.y + p.r * 0.6, '#ff9a1f', 2, 60, 2.5);
  }
  if (g.hazard !== 'strike') return;
  // The storm: a bolt aims near you, warns for a moment, then hits anything
  // in the circle, bugs included.
  g.strikeIn -= dt;
  if (g.strikeIn <= 0) {
    g.strikeIn = g.mode === 'horde' ? Math.max(2.2, 4.5 - (g.time / 60) * 0.25) : Math.max(1.4, 3 - g.room * 0.12);
    const a = rand(0, Math.PI * 2);
    const d = rand(0, 110);
    const at = { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d };
    if (g.mode === 'sprints') { at.x = clamp(at.x, WALL + 30, W - WALL - 30); at.y = clamp(at.y, WALL + 30, H - WALL - 30); }
    g.strikes.push({ x: at.x, y: at.y, t: 0.9 });
  }
  g.strikes = g.strikes.filter((st) => {
    st.t -= dt;
    if (st.t > 0) return true;
    g.fx.push({ kind: 'strike', x: st.x, y: st.y, r: 34, a: 0, life: 0.3, max: 0.3 });
    g.zaps.push({ pts: zigzag({ x: st.x + rand(-20, 20), y: st.y - 240 }, st, 14), life: 0.22 });
    g.events.push('strike');
    if (dist(st, p) < 34 + p.r * 0.5) hurtPlayer(g, 14);
    for (const e of live(g)) if (dist(st, e) < 34 + e.r) hurt(g, e, 40);
    return false;
  });
}

/* ------------------------------------------------------------------ shrine */

export type ShrinePick = 'heal' | 'skill';

/** Take the statue's offer: half your health back, or a random new skill. */
export function shrinePick(g: Game, pick: ShrinePick): { skill?: SkillId } {
  if (g.phase !== 'shrine' || !g.statue) return {};
  g.statue.used = true;
  g.phase = 'play';
  // Step back so the statue is not touched again on the same frame.
  g.player.y = g.statue.y + g.player.r + 30;
  if (pick === 'heal') {
    heal(g, Math.round(g.player.maxHp * STATUE_HEAL));
    g.events.push('heal');
    return {};
  }
  const got = applyWheel(g, 'newSkill');
  g.events.push('levelup');
  return { skill: got.skill };
}

/* ------------------------------------------------------------------- wheel */

export type WheelOutcome = 'newSkill' | 'skillUp' | 'heal' | 'coins' | 'loseLevel' | 'hurt' | 'loseCoins' | 'bossBuff' | 'nothing' | 'evolve';
/** The slices clockwise from the top, one per wedge of the owner's painted disc
    (gold, red, green, gold, purple, gold, red, green, purple, blue), each prize
    on the colour that means it: gold coins, green health, purple skills and
    levels, blue a skill up, red harm. */
export const WHEEL: WheelOutcome[] = ['coins', 'hurt', 'heal', 'loseCoins', 'newSkill', 'nothing', 'bossBuff', 'heal', 'loseLevel', 'skillUp'];
export const WHEEL_GOOD: WheelOutcome[] = ['newSkill', 'heal', 'skillUp', 'coins', 'evolve'];
/** The boss chest's wheel, on the same disc: every slice helps, and the red ones evolve a weapon that is ready. */
export const WHEEL_LUCKY: WheelOutcome[] = ['coins', 'evolve', 'heal', 'coins', 'newSkill', 'coins', 'evolve', 'heal', 'newSkill', 'skillUp'];
export const WHEEL_COINS = 40;

/**
 * Apply a wheel result. Returns what really happened (a result that can't
 * apply falls back to a kinder one) and the skill it touched, if any.
 */
export function applyWheel(g: Game, outcome: WheelOutcome): { outcome: WheelOutcome; skill?: SkillId } {
  const any = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  const owned = SKILLS.filter((s) => g.skills[s] > 0);
  const p = g.player;
  switch (outcome) {
    case 'newSkill': {
      const pool = WEAPONS.filter((s) => g.skills[s] === 0 && canPick(g, s));
      if (!pool.length) return applyWheel(g, 'skillUp');
      const skill = any(pool);
      g.skills[skill] = 1;
      followElement(g, skill);
      return { outcome, skill };
    }
    case 'skillUp': {
      const pool = owned.filter((s) => canPick(g, s));
      if (!pool.length) return applyWheel(g, 'heal');
      const skill = any(pool);
      g.skills[skill] += 1;
      followElement(g, skill);
      if (skill === 'heart') { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); }
      return { outcome, skill };
    }
    case 'heal':
      p.hp = p.maxHp;
      return { outcome };
    case 'evolve': {
      const ready = WEAPONS.filter((w) => canEvolve(g, w));
      if (!ready.length) return applyWheel(g, 'skillUp');
      const skill = any(ready);
      g.evolved[skill] = true;
      return { outcome, skill };
    }
    case 'coins':
      g.coins += WHEEL_COINS * worldPay(g);
      return { outcome };
    case 'loseLevel': {
      if (!owned.length) return applyWheel(g, 'hurt');
      const skill = any(owned);
      g.skills[skill] -= 1;
      if (skill === 'heart') { p.maxHp = Math.max(50, p.maxHp - 25); p.hp = Math.min(p.hp, p.maxHp); }
      return { outcome, skill };
    }
    case 'hurt':
      p.hp = Math.max(1, p.hp - Math.round(p.maxHp * 0.3));
      return { outcome };
    case 'loseCoins':
      g.coins = Math.floor(g.coins / 2);
      return { outcome };
    case 'bossBuff':
      g.bossHpMult = 1.25;
      return { outcome };
    default:
      return { outcome: 'nothing' };
  }
}

/** Walk on from the wheel room into the next one. */
export function leaveWheel(g: Game) {
  if (g.phase !== 'wheel') return;
  g.phase = 'play';
  // The chest's wheel: back to the same room (or field).
  if (g.luckyWheel) { g.luckyWheel = false; return; }
  enterRoom(g, g.room + 1);
}

export type Input = { x: number; y: number };

export function update(g: Game, dt: number, input: Input) {
  g.events = [];
  if (g.phase !== 'play') return;
  g.time += dt;
  g.shake = Math.max(0, g.shake - dt);
  const p = g.player;

  // Move, or stand still and shoot. Puddles slow you down.
  const len = Math.hypot(input.x, input.y);
  p.moving = len > 0.15;
  const wading = g.hazards.some((h) => h.kind === 'puddle' && dist(h, p) < h.r);
  if (p.moving) {
    const k = Math.min(1, len) * (wading ? 0.55 : 1);
    const shoes = 1 + 0.1 * g.skills.shoes;
    p.x += (input.x / len) * k * p.speed * shoes * dt;
    p.y += (input.y / len) * k * p.speed * shoes * dt;
    p.face = Math.atan2(input.y, input.x);
    p.heading = p.face;
  }
  updateHazards(g, dt);
  // Touching a boss's chest spins the lucky wheel.
  if (g.chest && dist(p, g.chest) < p.r + 20) {
    g.chest = null;
    g.luckyWheel = true;
    g.phase = 'wheel';
    g.events.push('wheel');
    return;
  }
  // Touching the statue opens its offer: health or a skill.
  if (g.statue && !g.statue.used && dist(p, g.statue) < p.r + 24) {
    g.phase = 'shrine';
    return;
  }
  const atWheel = g.mode === 'sprints' && g.wheelDoor && Math.abs(p.x - WHEEL_X) < DOOR_HALF - 4 && p.y - p.r < WALL + 6;
  if (atWheel) {
    g.wheelDoor = false;
    g.wheelUsed = true;
    g.phase = 'wheel';
    g.events.push('wheel');
    return;
  }
  const atDoor = g.mode === 'sprints' && g.door && Math.abs(p.x - W / 2) < DOOR_HALF - 4 && p.y - p.r < WALL + 6;
  if (atDoor) {
    if (g.room === ROOMS) {
      g.coins += 50 * worldPay(g);
      g.phase = 'won';
      return;
    }
    enterRoom(g, g.room + 1);
    return;
  }
  // An open door lets you step into its wall gap.
  if (g.mode === 'sprints' && ((g.door && Math.abs(p.x - W / 2) < DOOR_HALF - 4) || (g.wheelDoor && Math.abs(p.x - WHEEL_X) < DOOR_HALF - 4))) {
    p.x = clamp(p.x, WALL + p.r, W - WALL - p.r);
    p.y = clamp(p.y, p.r, H - WALL - p.r);
    for (const o of g.obstacles) pushOut(p, o);
  } else {
    keepInRoom(g, p);
  }
  if (g.mode === 'horde') updateHorde(g, dt);
  p.inv = Math.max(0, p.inv - dt);
  p.ouch = Math.max(0, p.ouch - dt);

  useWeapons(g, dt);
  // The energy drink: a little health back every second.
  if (g.skills.drink) heal(g, 0.6 * g.skills.drink * dt);
  moveSpirits(g, dt);

  for (const e of g.enemies) if (!e.dead) updateEnemy(g, e, dt);
  g.enemies = g.enemies.filter((e) => !e.dead);

  g.shots = g.shots.filter((s) => updateShot(g, s, dt));

  g.fireballs = g.fireballs.filter((f) => {
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.life -= dt;
    const hitBug = live(g).some((e) => dist(f, e) < e.r + 6);
    const hitWall = outside(g, f) || g.obstacles.some((o) => inRect(f, o));
    if (hitBug || hitWall || f.life <= 0) {
      explode(g, f);
      return false;
    }
    if (Math.random() < 0.6) g.particles.push({ x: f.x, y: f.y, vx: rand(-20, 20), vy: rand(-20, 20), life: 0.3, max: 0.3, size: 3, color: '#ff9a1f' });
    return true;
  });

  g.orbs = g.orbs.filter((o) => {
    if (o.home && o.home > 0) {
      // The robots' missiles turn towards you for a while.
      o.home -= dt;
      const speed = Math.hypot(o.vx, o.vy);
      let a = Math.atan2(o.vy, o.vx);
      const turn = ((Math.atan2(p.y - o.y, p.x - o.x) - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      a += clamp(turn, -2.4 * dt, 2.4 * dt);
      o.vx = Math.cos(a) * speed;
      o.vy = Math.sin(a) * speed;
      if (Math.random() < 0.5) g.particles.push({ x: o.x, y: o.y, vx: -o.vx * 0.15, vy: -o.vy * 0.15, life: 0.3, max: 0.3, size: 2.2, color: '#fdba74' });
    }
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.life -= dt;
    if (o.bounce > 0 && outside(g, o)) {
      // Spark worlds: tickets ricochet off the walls once.
      o.bounce -= 1;
      if (o.x < WALL || o.x > W - WALL) { o.vx = -o.vx; o.x = clamp(o.x, WALL, W - WALL); }
      if (o.y < WALL || o.y > H - WALL) { o.vy = -o.vy; o.y = clamp(o.y, WALL, H - WALL); }
      burst(g, o.x, o.y, '#ffd27a', 3, 80, 2);
    }
    if (o.life <= 0 || outside(g, o)) return false;
    if (g.obstacles.some((r) => inRect(o, r))) return false;
    if (Math.hypot(o.x - p.x, o.y - p.y) < o.r + p.r - 3) {
      hurtPlayer(g, o.dmg);
      return false;
    }
    return true;
  });

  // XP gems: drawn in when you come near, or all at once when the room is clear.
  g.gems = g.gems.filter((gem) => {
    const d = dist(gem, p) || 1;
    if (d < 95 + g.loadout.magnet || g.door) gem.pull = true;
    if (gem.pull) {
      const speed = 340 * dt;
      gem.x += ((p.x - gem.x) / d) * Math.min(speed, d);
      gem.y += ((p.y - gem.y) / d) * Math.min(speed, d);
    }
    if (d < p.r + 6) {
      gainXp(g, gem.value);
      g.events.push('gem');
      return false;
    }
    return true;
  });

  // Burning ground: bugs standing in it keep burning.
  g.embers = g.embers.filter((em) => {
    em.life -= dt;
    if (em.life <= 0) return false;
    for (const e of live(g)) {
      if (dist(em, e) >= em.r + e.r * 0.5) continue;
      e.burn = Math.max(e.burn, 0.6);
      e.burnDps = Math.max(e.burnDps, em.dps ?? 12);
      if (em.slow) { e.slow = Math.max(e.slow, 0.3); e.slowBy = Math.max(e.slowBy, em.slow); }
    }
    return true;
  });

  updateMines(g, dt);
  updateSpikes(g, dt);

  // Hearts: drawn in when close, heal on touch, fade after a while.
  g.hearts = g.hearts.filter((h) => {
    h.life -= dt;
    if (h.life <= 0) return false;
    const d = dist(h, p) || 1;
    if (d < 60) h.pull = true;
    if (h.pull) {
      const speed = 260 * dt;
      h.x += ((p.x - h.x) / d) * Math.min(speed, d);
      h.y += ((p.y - h.y) / d) * Math.min(speed, d);
    }
    if (d < p.r + 8) {
      heal(g, Math.round(p.maxHp * HEART_HEAL));
      burst(g, p.x, p.y - 4, '#ff6b8b', 10, 110, 2.6);
      g.events.push('heart');
      return false;
    }
    return true;
  });

  g.particles = g.particles.filter((q) => {
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.vx *= 0.92;
    q.vy *= 0.92;
    q.life -= dt;
    return q.life > 0;
  });
  g.zaps = g.zaps.filter((z) => (z.life -= dt) > 0);
  g.fx = g.fx.filter((f) => (f.delay && f.delay > 0 ? ((f.delay -= dt), true) : (f.life -= dt) > 0));

  if (g.mode === 'horde') {
    // The last boss down: the shift is over.
    if (g.hordeBoss >= HORDE_BOSS_AT.length && !g.enemies.some((e) => e.kind === 'boss')) {
      g.coins += 50 * worldPay(g);
      g.phase = 'won';
      return;
    }
  } else if (!g.door && g.enemies.length === 0) {
    g.door = true;
    g.orbs = [];
    g.threats = [];
    g.fireballs = [];
    g.coins += 5 * worldPay(g);
    if (g.room === WHEEL_ROOM && !g.wheelUsed) g.wheelDoor = true;
    g.events.push('clear');
  }
  if (g.pendingLevels > 0 && g.phase === 'play') offerChoices(g);
}
