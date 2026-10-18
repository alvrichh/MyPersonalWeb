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

import type { Loadout } from './shop';
import { BASE_LOADOUT } from './shop';
import type { EnemyStyle } from './save';

export const W = 360;
export const H = 600;
export const WALL = 16;
export const ROOMS = 10;
const DOOR_HALF = 32;

/* ------------------------------------------------------------------ worlds */

/** Each world is ten sprints with its own element: colours, a hazard and
 *  tougher bugs. World 1 is the plain backlog. */
export type Element = 'original' | 'fire' | 'water' | 'leaf' | 'bolt' | 'spark' | 'ghost' | 'heart';
export type HazardKind = 'none' | 'lava' | 'puddle' | 'thorns' | 'strike' | 'bouncy' | 'fog' | 'mixed';
export type WorldDef = { element: Element; hazard: HazardKind; tint: string; floor: string; grid: string; wall: string; door: string };

export const WORLDS: WorldDef[] = [
  { element: 'original', hazard: 'none', tint: '', floor: '#0f141d', grid: 'rgba(255,255,255,0.035)', wall: '#1d2533', door: '' },
  { element: 'fire', hazard: 'lava', tint: '#ff7a1a', floor: '#1a0c0a', grid: 'rgba(255,122,26,0.08)', wall: '#3a1510', door: '#ff9e4c' },
  { element: 'water', hazard: 'puddle', tint: '#38bdf8', floor: '#081520', grid: 'rgba(56,189,248,0.08)', wall: '#0f2a3d', door: '#7ad8ff' },
  { element: 'leaf', hazard: 'thorns', tint: '#4ade80', floor: '#0a160f', grid: 'rgba(74,222,128,0.07)', wall: '#15321f', door: '#67dfa0' },
  { element: 'bolt', hazard: 'strike', tint: '#facc15', floor: '#15140a', grid: 'rgba(250,204,21,0.07)', wall: '#2e2a10', door: '#ffd45f' },
  { element: 'spark', hazard: 'bouncy', tint: '#fb923c', floor: '#160f09', grid: 'rgba(251,146,60,0.08)', wall: '#3b2412', door: '#ffb86f' },
  { element: 'ghost', hazard: 'fog', tint: '#c7d2fe', floor: '#0c0d14', grid: 'rgba(199,210,254,0.05)', wall: '#1f2130', door: '#edf2fb' },
  { element: 'heart', hazard: 'mixed', tint: '#f472b6', floor: '#170a12', grid: 'rgba(244,114,182,0.07)', wall: '#3a1430', door: '#ff79c9' },
];
export const WORLD_COUNT = WORLDS.length;

/** Lava and thorns hurt, puddles slow you down. */
export type Hazard = { kind: 'lava' | 'puddle' | 'thorns'; x: number; y: number; r: number };
/** A lightning strike on its way: a warning circle, then the hit. */
export type Strike = { x: number; y: number; t: number };

export type Vec = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

/* --------------------------------------------------------------- the picks */

export type SkillId =
  // Melee: hits whatever comes close, all the time.
  | 'sword' | 'blades' | 'hammer'
  // Magic: goes off by itself every few seconds.
  | 'storm' | 'fireball' | 'frost' | 'spirits'
  // Ranged: fires while you stand still.
  | 'knives' | 'boomerang'
  // Bow upgrades (the bow is the weapon you start with).
  | 'fire' | 'water' | 'leaf' | 'bolt' | 'spark' | 'ghost' | 'double' | 'speed'
  // For everything.
  | 'power' | 'heart';

export type Category = 'melee' | 'magic' | 'ranged' | 'upgrade';

export const CATEGORY: Record<SkillId, Category> = {
  sword: 'melee', blades: 'melee', hammer: 'melee',
  storm: 'magic', fireball: 'magic', frost: 'magic', spirits: 'magic',
  knives: 'ranged', boomerang: 'ranged',
  fire: 'upgrade', water: 'upgrade', leaf: 'upgrade', bolt: 'upgrade', spark: 'upgrade', ghost: 'upgrade',
  double: 'upgrade', speed: 'upgrade', power: 'upgrade', heart: 'upgrade',
};
export const SKILLS = Object.keys(CATEGORY) as SkillId[];
const WEAPONS = SKILLS.filter((s) => CATEGORY[s] !== 'upgrade');
const MAX_WEAPONS = 4;
const maxLevel = (s: SkillId) => (s === 'heart' ? 99 : s === 'double' ? 2 : 3);

/* ---------------------------------------------------------------- the cast */

export type EnemyKind = 'bug' | 'ticket' | 'legacy' | 'boss';

/** How an enemy is drawn (the save's style, or one per enemy under random). */
export type Look = Exclude<EnemyStyle, 'random'>;
export const LOOKS: Look[] = ['original', 'demon', 'greek', 'nightmare'];

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
};

export type Shot = {
  kind: 'arrow' | 'knife' | 'boomerang';
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
  /** Boomerang: seconds until it turns back. */
  out: number;
  spin: number;
};

export type Orb = { x: number; y: number; vx: number; vy: number; r: number; dmg: number; life: number; bounce: number };
export type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string };
export type Zap = { pts: Vec[]; life: number };
export type Gem = { x: number; y: number; value: number; pull: boolean };
/** Short-lived shapes the renderer draws: sword arcs, hammer rings, explosions, lightning strikes. */
export type Fx = { kind: 'slash' | 'ring' | 'boom' | 'strike'; x: number; y: number; r: number; a: number; life: number; max: number };
export type Fireball = { x: number; y: number; vx: number; vy: number; life: number };
export type Spirit = { x: number; y: number; vx: number; vy: number; life: number };

export type Player = {
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  speed: number;
  inv: number;
  moving: boolean;
  face: number;
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
  bladeAngle: number;
  /** Per-bug cooldown so a spinning blade doesn't hit the same bug every frame. */
  bladeHits: Map<number, number>;
};

export type Game = {
  world: number;
  room: number;
  phase: 'play' | 'levelup' | 'over' | 'won';
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
  particles: Particle[];
  zaps: Zap[];
  gems: Gem[];
  fx: Fx[];
  fireballs: Fireball[];
  spirits: Spirit[];
  obstacles: Rect[];
  door: boolean;
  skills: Record<SkillId, number>;
  gear: Gear;
  loadout: Loadout;
  style: EnemyStyle;
  /** Coins earned this run (banked by the page when the run ends). */
  coins: number;
  revives: number;
  level: number;
  xp: number;
  xpNext: number;
  pendingLevels: number;
  choices: SkillId[];
  kills: number;
  time: number;
  shake: number;
  /** Things the page may want to react to this frame (banners, sounds). */
  events: GameEvent[];
};

export type GameEvent =
  | 'clear' | 'boss' | 'hurt' | 'levelup' | 'room' | 'revive'
  | 'shoot' | 'knife' | 'boomerang' | 'hit' | 'kill' | 'gem' | 'slash' | 'slam' | 'strike' | 'boom';

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

function keepInRoom(c: { x: number; y: number; r: number }, obstacles: Rect[]) {
  c.x = clamp(c.x, WALL + c.r, W - WALL - c.r);
  c.y = clamp(c.y, WALL + c.r, H - WALL - c.r);
  for (const o of obstacles) pushOut(c, o);
}

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
const LAYOUT_FOR_ROOM = [0, 1, 2, 3, -1, 4, 1, 3, 2, -1];

export const isBossRoom = (room: number) => room === 5 || room === 10;

function wave(room: number, world: number): EnemyKind[] {
  if (isBossRoom(room)) return ['boss'];
  const kinds: EnemyKind[] = [];
  const bugs = 2 + Math.floor(room * 0.7) + (world - 1);
  const tickets = Math.floor(room / 2);
  const legacy = room >= 3 ? Math.floor((room - 1) / 3) : 0;
  for (let i = 0; i < bugs; i++) kinds.push('bug');
  for (let i = 0; i < tickets; i++) kinds.push('ticket');
  for (let i = 0; i < legacy; i++) kinds.push('legacy');
  return kinds;
}

function makeEnemy(g: Game, kind: EnemyKind, room: number, at: Vec, spawn = 0.7): Enemy {
  const look: Look = g.style === 'random' ? LOOKS[Math.floor(Math.random() * LOOKS.length)] : g.style;
  const worldUp = 1 + (g.world - 1) * 0.25;
  const tough = (1 + (room - 1) * 0.08) * worldUp;
  const base = {
    bug: { r: 12, hp: 40, speed: 72, dmg: 10, xp: 6 },
    ticket: { r: 14, hp: 60, speed: 46, dmg: 12, xp: 8 },
    legacy: { r: 20, hp: 170, speed: 34, dmg: 20, xp: 14 },
    boss: { r: 40, hp: room === 10 ? 2000 : 900, speed: 40, dmg: 22, xp: 70 },
  }[kind];
  const hp = Math.round(base.hp * (kind === 'boss' ? worldUp : tough));
  return {
    id: nextId++,
    kind,
    look,
    tint: WORLDS[g.world - 1].tint,
    x: at.x,
    y: at.y,
    r: base.r,
    hp,
    maxHp: hp,
    speed: base.speed * (1 + (g.world - 1) * 0.03),
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
  g.strikeIn = 2;
  const boss = isBossRoom(room);
  const n = boss ? 2 : 2 + Math.floor(room / 4);
  if (kind === 'lava') placeHazards(g, 'lava', n, 22, 38);
  if (kind === 'puddle') placeHazards(g, 'puddle', n + 1, 30, 48);
  if (kind === 'thorns') placeHazards(g, 'thorns', n + 1, 14, 20);
}

function enterRoom(g: Game, room: number) {
  // Gems still on the floor are banked on the way out.
  for (const gem of g.gems) gainXp(g, gem.value);
  g.room = room;
  g.door = false;
  const layout = LAYOUT_FOR_ROOM[room - 1];
  g.obstacles = layout >= 0 ? LAYOUTS[layout] : [];
  setHazard(g, room);
  g.shots = [];
  g.orbs = [];
  g.zaps = [];
  g.gems = [];
  g.fx = [];
  g.fireballs = [];
  g.spirits = [];
  g.enemies = [];
  g.player.x = W / 2;
  g.player.y = H - 70;
  for (const kind of wave(room, g.world)) {
    const at = kind === 'boss' ? { x: W / 2, y: H * 0.3 } : freeSpot(g, kind === 'legacy' ? 20 : 14);
    g.enemies.push(makeEnemy(g, kind, room, at, kind === 'boss' ? 1.2 : rand(0.5, 1.1)));
  }
  // A breather before each boss.
  if (isBossRoom(room)) g.player.hp = Math.min(g.player.maxHp, g.player.hp + Math.round(g.player.maxHp * 0.3));
  g.events.push(isBossRoom(room) ? 'boss' : 'room');
}

export function newGame(loadout: Loadout = BASE_LOADOUT, style: EnemyStyle = 'original', world = 1): Game {
  const g: Game = {
    world: clamp(world, 1, WORLD_COUNT),
    room: 1,
    phase: 'play',
    hazards: [],
    strikes: [],
    strikeIn: 2,
    hazard: 'none',
    player: { x: W / 2, y: H - 70, r: 15, hp: loadout.maxHp, maxHp: loadout.maxHp, speed: 150 * loadout.speedMult, inv: 0, moving: false, face: -Math.PI / 2 },
    enemies: [],
    shots: [],
    orbs: [],
    particles: [],
    zaps: [],
    gems: [],
    fx: [],
    fireballs: [],
    spirits: [],
    obstacles: [],
    door: false,
    skills: Object.fromEntries(SKILLS.map((s) => [s, 0])) as Record<SkillId, number>,
    loadout,
    style,
    coins: 0,
    revives: loadout.revives,
    gear: {
      bow: 0.4, knives: 0.6, boomerang: 0.8, sword: 0.5, hammer: 1, storm: 1, fireball: 1, spirits: 0.5, frost: 0,
      bladeAngle: 0, bladeHits: new Map(),
    },
    level: 1,
    xp: 0,
    xpNext: 20,
    pendingLevels: 0,
    choices: [],
    kills: 0,
    time: 0,
    shake: 0,
    events: [],
  };
  for (const s of loadout.startSkills) g.skills[s] = Math.max(g.skills[s], 1);
  enterRoom(g, 1);
  g.events = [];
  return g;
}

/* ------------------------------------------------------------------- level up */

/** Weapons you carry (the bow always counts). */
export const ownedWeapons = (g: Game) => WEAPONS.filter((s) => g.skills[s] > 0);

function canPick(g: Game, s: SkillId) {
  if (g.skills[s] >= maxLevel(s)) return false;
  // A new weapon only while there's a free slot.
  if (CATEGORY[s] !== 'upgrade' && g.skills[s] === 0 && ownedWeapons(g).length >= MAX_WEAPONS) return false;
  return true;
}

function offerChoices(g: Game) {
  const pickFrom = (pool: SkillId[]) => pool.filter((s) => canPick(g, s) && !g.choices.includes(s));
  const any = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  g.choices = [];
  // One of each kind when it can: melee, magic, then ranged or a bow upgrade.
  for (const kinds of [['melee'], ['magic'], ['ranged', 'upgrade']] as Category[][]) {
    const pool = pickFrom(SKILLS.filter((s) => kinds.includes(CATEGORY[s])));
    if (pool.length) g.choices.push(any(pool));
  }
  while (g.choices.length < 3) {
    const pool = pickFrom(SKILLS);
    if (!pool.length) break;
    g.choices.push(any(pool));
  }
  g.phase = 'levelup';
}

export function chooseSkill(g: Game, skill: SkillId) {
  g.skills[skill] += 1;
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
const haste = (g: Game) => 1 + 0.28 * g.skills.speed;

function gainXp(g: Game, amount: number) {
  g.xp += amount * g.loadout.xpMult;
  while (g.xp >= g.xpNext) {
    g.xp -= g.xpNext;
    g.level += 1;
    g.xpNext += 15;
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
/** Later worlds pay better. */
const worldPay = (g: Game) => g.loadout.coinMult * (1 + (g.world - 1) * 0.5);

function kill(g: Game, e: Enemy) {
  if (e.dead) return;
  e.dead = true;
  g.kills += 1;
  g.coins += COINS[e.kind] * worldPay(g);
  g.events.push('kill');
  burst(g, e.x, e.y, ENEMY_COLOR[e.kind], e.kind === 'boss' ? 60 : 14, e.kind === 'boss' ? 260 : 140, e.kind === 'boss' ? 5 : 3);
  // XP drops as gems to collect; the boss scatters a handful.
  const drops = e.kind === 'boss' ? 7 : 1;
  for (let i = 0; i < drops; i++) {
    const a = rand(0, Math.PI * 2);
    const r = drops > 1 ? rand(10, 40) : 0;
    g.gems.push({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, value: e.xp / drops, pull: false });
  }
  if (e.kind === 'boss') g.shake = 0.6;
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
}

function chain(g: Game, from: Enemy, jumps: number, amount: number) {
  let at: Vec = from;
  const touched = new Set([from.id]);
  for (let i = 0; i < jumps; i++) {
    let next: Enemy | undefined;
    let best = 130;
    for (const o of live(g)) {
      if (touched.has(o.id)) continue;
      const d = dist(at, o);
      if (d < best) { best = d; next = o; }
    }
    if (!next) break;
    touched.add(next.id);
    g.zaps.push({ pts: zigzag(at, next), life: 0.18 });
    hurt(g, next, amount);
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
  for (let i = 0; i < lv; i++) {
    const a = angle + (i - (lv - 1) / 2) * 0.45;
    g.shots.push(shot('boomerang', p, a, 330, (24 + 8 * (lv - 1)) * power(g, 'ranged'), { pierce: 99, ghost: true, life: 3, out: 0.5 }));
  }
}

function swingSword(g: Game) {
  const p = g.player;
  const lv = g.skills.sword;
  const reach = 58 + 6 * (lv - 1);
  // Swing towards the nearest bug if one is close, else the way you face.
  const close = nearest(g, p);
  const a = close && dist(p, close) < reach + close.r + 20 ? Math.atan2(close.y - p.y, close.x - p.x) : p.face;
  g.fx.push({ kind: 'slash', x: p.x, y: p.y, r: reach, a, life: 0.22, max: 0.22 });
  g.events.push('slash');
  for (const e of live(g)) {
    if (dist(p, e) > reach + e.r) continue;
    if (angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a) > 1.15) continue;
    hurt(g, e, (32 + 14 * (lv - 1)) * power(g, 'melee'), away(p, e, 140));
    heal(g, 1);
  }
}

function slamHammer(g: Game) {
  const p = g.player;
  const lv = g.skills.hammer;
  const reach = 72 + 10 * (lv - 1);
  g.fx.push({ kind: 'ring', x: p.x, y: p.y, r: reach, a: 0, life: 0.35, max: 0.35 });
  g.shake = Math.max(g.shake, 0.12);
  g.events.push('slam');
  for (const e of live(g)) {
    if (dist(p, e) > reach + e.r) continue;
    hurt(g, e, (40 + 16 * (lv - 1)) * power(g, 'melee'), away(p, e, 260));
    heal(g, 1);
  }
}

export const BLADE_ORBIT = 46;

/** Melee hits heal you a little: the reward for fighting up close. */
function heal(g: Game, amount: number) {
  g.player.hp = Math.min(g.player.maxHp, g.player.hp + amount);
}

function spinBlades(g: Game, dt: number) {
  const p = g.player;
  const lv = g.skills.blades;
  const gear = g.gear;
  gear.bladeAngle += dt * 3.4;
  for (const [id, t] of gear.bladeHits) {
    if (t - dt <= 0) gear.bladeHits.delete(id);
    else gear.bladeHits.set(id, t - dt);
  }
  const n = lv + 1;
  for (let i = 0; i < n; i++) {
    const a = gear.bladeAngle + (i / n) * Math.PI * 2;
    const bx = p.x + Math.cos(a) * BLADE_ORBIT;
    const by = p.y + Math.sin(a) * BLADE_ORBIT;
    for (const e of live(g)) {
      if (gear.bladeHits.has(e.id) || Math.hypot(e.x - bx, e.y - by) > e.r + 10) continue;
      gear.bladeHits.set(e.id, 0.4);
      hurt(g, e, (14 + 5 * (lv - 1)) * power(g, 'melee'), away(p, e, 90));
      heal(g, 0.5);
      burst(g, bx, by, '#e5e7eb', 3, 80, 1.6);
    }
  }
}

function callStorm(g: Game) {
  const lv = g.skills.storm;
  const pool = live(g);
  for (let i = 0; i < lv && pool.length; i++) {
    const e = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    g.fx.push({ kind: 'strike', x: e.x, y: e.y, r: 26, a: 0, life: 0.3, max: 0.3 });
    g.events.push('strike');
    g.zaps.push({ pts: zigzag({ x: e.x + rand(-20, 20), y: e.y - 220 }, e, 14), life: 0.22 });
    for (const o of live(g)) if (dist(o, e) < 26 + o.r) hurt(g, o, (38 + 10 * (lv - 1)) * power(g, 'magic'));
  }
}

function throwFireball(g: Game) {
  const p = g.player;
  const lv = g.skills.fireball;
  const pool = live(g);
  for (let i = 0; i < (lv === 3 ? 2 : 1) && pool.length; i++) {
    const e = pool[Math.floor(Math.random() * pool.length)];
    const a = Math.atan2(e.y - p.y, e.x - p.x);
    g.fireballs.push({ x: p.x, y: p.y, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, life: 1.4 });
  }
}

function explode(g: Game, at: Vec) {
  const lv = g.skills.fireball;
  const reach = 46 + 6 * (lv - 1);
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

export const frostReach = (g: Game) => 62 + 12 * (g.skills.frost - 1);

function chill(g: Game, dt: number) {
  const lv = g.skills.frost;
  g.gear.frost -= dt;
  const tick = g.gear.frost <= 0;
  if (tick) g.gear.frost = 0.25;
  for (const e of live(g)) {
    if (dist(g.player, e) > frostReach(g) + e.r) continue;
    e.slow = Math.max(e.slow, 0.3);
    e.slowBy = Math.max(e.slowBy, 0.3 + 0.1 * lv);
    if (tick) hurt(g, e, (8 + 5 * (lv - 1)) * 0.25 * power(g, 'magic'));
  }
}

function moveSpirits(g: Game, dt: number) {
  const lv = g.skills.spirits;
  g.gear.spirits -= dt;
  if (lv && g.gear.spirits <= 0 && g.spirits.length < lv + 1) {
    g.gear.spirits = 2.5;
    const a = rand(0, Math.PI * 2);
    g.spirits.push({ x: g.player.x, y: g.player.y, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, life: 4 });
  }
  g.spirits = g.spirits.filter((s) => {
    s.life -= dt;
    if (s.life <= 0) return false;
    const target = nearest(g, s);
    if (target) {
      const d = dist(s, target) || 1;
      s.vx += ((target.x - s.x) / d) * 600 * dt;
      s.vy += ((target.y - s.y) / d) * 600 * dt;
      const v = Math.hypot(s.vx, s.vy);
      if (v > 170) { s.vx *= 170 / v; s.vy *= 170 / v; }
      if (d < target.r + 6) {
        hurt(g, target, (22 + 8 * (lv - 1)) * power(g, 'magic'));
        burst(g, s.x, s.y, '#e9ecf5', 8, 90, 2.2);
        return false;
      }
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    return true;
  });
}

function useWeapons(g: Game, dt: number) {
  const p = g.player;
  const gear = g.gear;
  const sk = g.skills;
  for (const k of ['bow', 'knives', 'boomerang', 'sword', 'hammer', 'storm', 'fireball'] as const) gear[k] = Math.max(0, gear[k] - dt);
  const fighting = live(g).length > 0;
  if (!fighting) return;

  // Ranged: only while standing still, at the nearest bug in plain sight.
  if (!p.moving) {
    const target = nearest(g, p, true);
    if (target) {
      if (gear.bow === 0) { fireBow(g, target); gear.bow = 1 / (2 * haste(g)); g.events.push('shoot'); }
      if (sk.knives && gear.knives === 0) { fireKnives(g, target); gear.knives = (1.2 - 0.15 * (sk.knives - 1)) / haste(g); g.events.push('knife'); }
      if (sk.boomerang && gear.boomerang === 0) { fireBoomerang(g, target); gear.boomerang = (2 - 0.25 * (sk.boomerang - 1)) / haste(g); g.events.push('boomerang'); }
    }
  }
  // Melee and magic: always.
  if (sk.sword && gear.sword === 0) { swingSword(g); gear.sword = 0.95 - 0.12 * (sk.sword - 1); }
  if (sk.hammer && gear.hammer === 0) { slamHammer(g); gear.hammer = 2.8 - 0.35 * (sk.hammer - 1); }
  if (sk.blades) spinBlades(g, dt);
  if (sk.storm && gear.storm === 0) { callStorm(g); gear.storm = 1.8 - 0.25 * (sk.storm - 1); }
  if (sk.fireball && gear.fireball === 0) { throwFireball(g); gear.fireball = 2.4 - 0.3 * (sk.fireball - 1); }
  if (sk.frost) chill(g, dt);
}

function hurtPlayer(g: Game, amount: number) {
  const p = g.player;
  if (p.inv > 0 || g.phase !== 'play') return;
  p.hp -= amount;
  p.inv = 0.7;
  g.shake = Math.max(g.shake, 0.25);
  g.events.push('hurt');
  burst(g, p.x, p.y, '#ff8080', 10, 120, 3);
  if (p.hp <= 0) {
    if (g.revives > 0) {
      // The phoenix feather: back on your feet with half your health.
      g.revives -= 1;
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
      return;
    }
    p.hp = 0;
    g.phase = 'over';
  }
}

/* -------------------------------------------------------------------- update */

function updateEnemy(g: Game, e: Enemy, dt: number) {
  const p = g.player;
  if (e.spawn > 0) {
    e.spawn -= dt;
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
    if (e.dash > 0) { mx = e.dir.x * 9; my = e.dir.y * 9; } else if (e.aim > 0) { mx = 0; my = 0; } else { mx = ux * 0.6; my = uy * 0.6; }
  }

  // Walking round a rack: sidestep, still edging closer, until the player is
  // in sight again (or it gives up after a while).
  if (e.detour > 0) {
    e.detour -= dt;
    if (!blocked(e, p, g.obstacles)) e.detour = 0;
    mx = -uy * e.side + ux * 0.25;
    my = ux * e.side + uy * 0.25;
  }
  const want = Math.hypot(mx, my) * e.speed * slowFactor * dt;
  const fromX = e.x;
  const fromY = e.y;
  e.x += mx * e.speed * slowFactor * dt + e.kx * dt;
  e.y += my * e.speed * slowFactor * dt + e.ky * dt;
  e.kx *= Math.pow(0.002, dt);
  e.ky *= Math.pow(0.002, dt);
  keepInRoom(e, g.obstacles);
  // Barely moved although it wanted to: a rack (or a wall, mid-detour) is in
  // the way. Go round it, trying the other side each time it gets stuck.
  if (e.kind !== 'boss' && want > 0.2 && Math.hypot(e.x - fromX, e.y - fromY) < want * 0.35) {
    if (e.detour > 0) e.side = -e.side;
    else if (blocked(e, p, g.obstacles)) e.detour = 2.5;
  }

  if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r - 2) hurtPlayer(g, e.dmg);
}

function updateBoss(g: Game, e: Enemy, dt: number, ux: number, uy: number) {
  const final = g.room === 10;
  // Radial burst of orbs, turning a little every time.
  e.cd -= dt;
  if (e.cd <= 0) {
    e.cd = final ? 2.2 : 3.1;
    const n = final ? 16 : 10;
    const speed = final ? 120 : 105;
    const turn = rand(0, Math.PI * 2);
    for (let i = 0; i < n; i++) {
      const a = turn + (i / n) * Math.PI * 2;
      g.orbs.push({ x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 7, dmg: 14, life: 5, bounce: g.hazard === 'bouncy' ? 1 : 0 });
    }
  }
  // Charge: stop and aim for a moment, then dash at where you were.
  if (e.dash > 0) {
    e.dash -= dt;
  } else if (e.aim > 0) {
    e.aim -= dt;
    if (e.aim <= 0) e.dash = 0.55;
  } else {
    e.cd2 -= dt;
    if (e.cd2 <= 0) {
      e.cd2 = final ? 4.5 : 6;
      e.aim = 0.7;
      e.dir = { x: ux, y: uy };
    }
  }
  // Calls for backup.
  e.cd3 -= dt;
  if (e.cd3 <= 0) {
    e.cd3 = final ? 6 : 10;
    for (const side of [-1, 1]) {
      g.enemies.push(makeEnemy(g, 'bug', g.room, { x: clamp(e.x + side * 60, 40, W - 40), y: e.y + 30 }, 0.6));
    }
  }
}

function updateShot(g: Game, s: Shot, dt: number): boolean {
  const p = g.player;
  const px = s.x;
  const py = s.y;
  s.life -= dt;
  if (s.life <= 0) return false;
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

  // Walls and racks: bounce (sparks), pass (ghost, boomerang) or stop.
  const hitWallX = s.x < WALL || s.x > W - WALL;
  const hitWallY = s.y < WALL || s.y > H - WALL;
  if (hitWallX || hitWallY) {
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
    if (Math.hypot(s.x - e.x, s.y - e.y) > e.r + (s.kind === 'boomerang' ? 9 : 4)) continue;
    s.hits.add(e.id);
    hitWithShot(g, e, s);
    if (s.pierce > 0) s.pierce -= 1;
    else return false;
  }
  return true;
}

function updateHazards(g: Game, dt: number) {
  const p = g.player;
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
    g.strikeIn = Math.max(1.4, 3 - g.room * 0.12);
    const a = rand(0, Math.PI * 2);
    const d = rand(0, 110);
    g.strikes.push({ x: clamp(p.x + Math.cos(a) * d, WALL + 30, W - WALL - 30), y: clamp(p.y + Math.sin(a) * d, WALL + 30, H - WALL - 30), t: 0.9 });
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
    p.x += (input.x / len) * k * p.speed * dt;
    p.y += (input.y / len) * k * p.speed * dt;
    p.face = Math.atan2(input.y, input.x);
  }
  updateHazards(g, dt);
  const atDoor = g.door && Math.abs(p.x - W / 2) < DOOR_HALF - 4 && p.y - p.r < WALL + 6;
  if (atDoor) {
    if (g.room === ROOMS) {
      g.coins += 50 * worldPay(g);
      g.phase = 'won';
      return;
    }
    enterRoom(g, g.room + 1);
    return;
  }
  // The open door lets you step into the wall gap.
  if (g.door && Math.abs(p.x - W / 2) < DOOR_HALF - 4) {
    p.x = clamp(p.x, WALL + p.r, W - WALL - p.r);
    p.y = clamp(p.y, p.r, H - WALL - p.r);
    for (const o of g.obstacles) pushOut(p, o);
  } else {
    keepInRoom(p, g.obstacles);
  }
  p.inv = Math.max(0, p.inv - dt);

  useWeapons(g, dt);
  moveSpirits(g, dt);

  for (const e of g.enemies) if (!e.dead) updateEnemy(g, e, dt);
  g.enemies = g.enemies.filter((e) => !e.dead);

  g.shots = g.shots.filter((s) => updateShot(g, s, dt));

  g.fireballs = g.fireballs.filter((f) => {
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.life -= dt;
    const hitBug = live(g).some((e) => dist(f, e) < e.r + 6);
    const hitWall = f.x < WALL || f.x > W - WALL || f.y < WALL || f.y > H - WALL || g.obstacles.some((o) => inRect(f, o));
    if (hitBug || hitWall || f.life <= 0) {
      explode(g, f);
      return false;
    }
    if (Math.random() < 0.6) g.particles.push({ x: f.x, y: f.y, vx: rand(-20, 20), vy: rand(-20, 20), life: 0.3, max: 0.3, size: 3, color: '#ff9a1f' });
    return true;
  });

  g.orbs = g.orbs.filter((o) => {
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.life -= dt;
    if (o.bounce > 0 && (o.x < WALL || o.x > W - WALL || o.y < WALL || o.y > H - WALL)) {
      // Spark worlds: tickets ricochet off the walls once.
      o.bounce -= 1;
      if (o.x < WALL || o.x > W - WALL) { o.vx = -o.vx; o.x = clamp(o.x, WALL, W - WALL); }
      if (o.y < WALL || o.y > H - WALL) { o.vy = -o.vy; o.y = clamp(o.y, WALL, H - WALL); }
      burst(g, o.x, o.y, '#ffd27a', 3, 80, 2);
    }
    if (o.life <= 0 || o.x < WALL || o.x > W - WALL || o.y < WALL || o.y > H - WALL) return false;
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
    if (d < 95 || g.door) gem.pull = true;
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

  g.particles = g.particles.filter((q) => {
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.vx *= 0.92;
    q.vy *= 0.92;
    q.life -= dt;
    return q.life > 0;
  });
  g.zaps = g.zaps.filter((z) => (z.life -= dt) > 0);
  g.fx = g.fx.filter((f) => (f.life -= dt) > 0);

  if (!g.door && g.enemies.length === 0) {
    g.door = true;
    g.orbs = [];
    g.fireballs = [];
    g.coins += 5 * worldPay(g);
    g.events.push('clear');
  }
  if (g.pendingLevels > 0 && g.phase === 'play') offerChoices(g);
}
