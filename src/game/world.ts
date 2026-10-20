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
/** Nightmare (On call in the last world, no clock): a boss every five minutes, the cast's and the world's in turn. */
export const NIGHTMARE_WORLD = 9;
export const NIGHTMARE_BOSS_EVERY = 300;
/** When the next boss comes, or Infinity once a shift has had both. */
const nextBossAt = (g: Game) => (g.endless ? (g.hordeBoss + 1) * NIGHTMARE_BOSS_EVERY : HORDE_BOSS_AT[g.hordeBoss] ?? Infinity);
/** Whether the boss now out is the world's final boss (the second on call; every other one in nightmare). */
const finalBossNow = (g: Game) => (g.endless ? g.hordeBoss > 0 && g.hordeBoss % 2 === 0 : g.hordeBoss >= 2);
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
export type Element = 'original' | 'fire' | 'water' | 'mud' | 'leaf' | 'bolt' | 'spark' | 'ghost' | 'heart';
export type HazardKind = 'none' | 'lava' | 'puddle' | 'thorns' | 'strike' | 'ice' | 'bouncy' | 'mixed';
export type WorldDef = { element: Element; hazard: HazardKind; look: Look | 'random'; tint: string; floor: string; grid: string; wall: string; door: string };

/** How an enemy is drawn: the world's cast, or whatever the picker forces. */
export type Look = 'original' | 'demon' | 'viking' | 'mud' | 'jungle' | 'greek' | 'robot' | 'nightmare';
export const LOOKS: Look[] = ['original', 'demon', 'viking', 'mud', 'jungle', 'greek', 'robot', 'nightmare'];

export const WORLDS: WorldDef[] = [
  { element: 'original', hazard: 'none', look: 'original', tint: '', floor: '#0f141d', grid: 'rgba(255,255,255,0.035)', wall: '#1d2533', door: '' },
  { element: 'fire', hazard: 'lava', look: 'demon', tint: '#ff7a1a', floor: '#1a0c0a', grid: 'rgba(255,122,26,0.08)', wall: '#3a1510', door: '#ff9e4c' },
  { element: 'water', hazard: 'ice', look: 'viking', tint: '#38bdf8', floor: '#081520', grid: 'rgba(56,189,248,0.08)', wall: '#0f2a3d', door: '#7ad8ff' },
  // The mud world, put in between the vikings and the jungle: frogs, bats and mud blobs in the swamp, its puddles slowing you down.
  { element: 'mud', hazard: 'puddle', look: 'mud', tint: '#a16207', floor: '#17120a', grid: 'rgba(161,98,7,0.08)', wall: '#33270f', door: '#d6a75c' },
  { element: 'leaf', hazard: 'thorns', look: 'jungle', tint: '#4ade80', floor: '#0a160f', grid: 'rgba(74,222,128,0.07)', wall: '#15321f', door: '#67dfa0' },
  { element: 'bolt', hazard: 'strike', look: 'greek', tint: '#facc15', floor: '#15140a', grid: 'rgba(250,204,21,0.07)', wall: '#2e2a10', door: '#ffd45f' },
  { element: 'spark', hazard: 'bouncy', look: 'robot', tint: '#fb923c', floor: '#160f09', grid: 'rgba(251,146,60,0.08)', wall: '#3b2412', door: '#ffb86f' },
  { element: 'ghost', hazard: 'none', look: 'nightmare', tint: '#c7d2fe', floor: '#0c0d14', grid: 'rgba(199,210,254,0.05)', wall: '#1f2130', door: '#edf2fb' },
  { element: 'heart', hazard: 'mixed', look: 'random', tint: '#f472b6', floor: '#170a12', grid: 'rgba(244,114,182,0.07)', wall: '#3a1430', door: '#ff79c9' },
];
export const WORLD_COUNT = WORLDS.length;

/** Lava and thorns hurt, puddles slow you down. A boss's meteor or roots leave some that fade (`ttl`, seconds). */
export type Hazard = { kind: 'lava' | 'puddle' | 'thorns'; x: number; y: number; r: number; ttl?: number; /** Drawn by something else (a vine row's picture). */ hidden?: boolean };
/** A lightning strike on its way: a warning circle, then the hit. */
/** A bolt (or, in the viking world, ice spikes breaking out of the floor): `t` seconds of warning left;
   ice spikes stay up a moment after they strike (`t` below zero, `hit` once they have). */
export type Strike = { x: number; y: number; t: number; ice?: boolean; hit?: boolean; dmg?: number; boss?: boolean; r?: number };

export type Vec = { x: number; y: number };
/** A block; `piece` says which of the world's pieces of its size it is drawn as (the open field's blocks carry it). */
export type Rect = { x: number; y: number; w: number; h: number; piece?: number };

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
  | 'shoes' | 'bracer' | 'drink'
  // After Archero: a code review (arrows behind and to the sides), commit and push (a second volley), segfault (a
  // one-shot kill), the garbage collector (health per kill), critical hits, crunch (harder as you weaken), lag (a
  // dodge), safe mode (invincible now and then), a chained exception (bugs burst as they die), and the monolith or
  // the microservice (bigger and harder-hitting, or smaller and quicker; one or the other).
  | 'rear' | 'multi' | 'headshot' | 'vampire' | 'crit' | 'rage' | 'dodge' | 'safe' | 'nova' | 'giant' | 'dwarf';

export type Category = 'melee' | 'magic' | 'ranged' | 'upgrade';

export const CATEGORY: Record<SkillId, Category> = {
  sword: 'melee', blades: 'melee', hammer: 'melee', durian: 'melee', mines: 'melee',
  storm: 'magic', fireball: 'magic', frost: 'magic', spirits: 'magic', laser: 'magic', brick: 'magic', molotov: 'magic',
  knives: 'ranged', boomerang: 'ranged', drill: 'ranged', rocket: 'ranged', ball: 'ranged',
  fire: 'upgrade', water: 'upgrade', leaf: 'upgrade', bolt: 'upgrade', spark: 'upgrade', ghost: 'upgrade',
  double: 'upgrade', speed: 'upgrade', power: 'upgrade', heart: 'upgrade',
  shoes: 'upgrade', bracer: 'upgrade', drink: 'upgrade',
  rear: 'upgrade', multi: 'upgrade', headshot: 'upgrade', vampire: 'upgrade', crit: 'upgrade', rage: 'upgrade',
  dodge: 'upgrade', safe: 'upgrade', nova: 'upgrade', giant: 'upgrade', dwarf: 'upgrade',
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
/** Fusions are earned, like evolutions: with two elements on the bow and one of them at its top level a gold
    «Fusion» card turns up at the next level up, and only taking it (spending that level) fuses them. Until
    then the two elements work on their own. */
export const fusionReady = (g: Game) => !!pairFusion(g) && arrowElements(g).some((s) => g.skills[s] >= maxLevel(s));
export const canFuse = (g: Game) => !g.fused && fusionReady(g);
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
/** An element that can no longer come this run: two others are already on the bow. */
const elementShut = (g: Game, s: SkillId) => ARROW_ELEMENTS.includes(s) && g.skills[s] === 0 && arrowElements(g).length >= 2;
/** The owned, unevolved weapons whose evolution an element card would shut out: taking it fills the pair,
    so the other elements stop coming and the weapons paired with them stay at level 3 for good. */
export function evoLostBy(g: Game, s: SkillId): SkillId[] {
  if (!ARROW_ELEMENTS.includes(s) || g.skills[s] > 0 || arrowElements(g).length !== 1) return [];
  const shut = ARROW_ELEMENTS.filter((e) => e !== s && g.skills[e] === 0);
  return WEAPONS.filter((w) => g.skills[w] > 0 && !g.evolved[w] && shut.includes(EVO_PARTNER[w]!));
}
/** The weapons from the rest of Survivor.io's list belong to the shop's arsenal (one per world, `ARSENAL` in shop.ts)… */
export const ARSENAL_SKILLS: SkillId[] = ['brick', 'molotov', 'durian', 'mines', 'drill', 'rocket', 'ball'];
/** …which come up, in either mode, only once bought in the shop's arsenal (`loadout.arsenal`). */
const allowedIn = (g: Game, s: SkillId) => !ARSENAL_SKILLS.includes(s) || g.loadout.arsenal.includes(s);
export const maxLevel = (s: SkillId) => (s === 'heart' ? 99 : s === 'blades' ? 5 : s === 'double' || s === 'rear' || s === 'multi' ? 2 : s === 'giant' || s === 'dwarf' ? 1 : 3);
/* The Archero picks' numbers. */
export const ARCHERO = {
  /** Commit and push: each level one more volley this long after the last, the bow a little slower and softer. */
  multiGap: 0.11, multiSlow: 0.15, multiSoft: 0.9,
  /** Segfault: the chance a bow arrow kills a bug outright (not a boss), a level. */
  headshot: 0.04,
  /** Garbage collector: health back per kill, as a share of max health, a level. */
  vampire: 0.0015,
  /** Critical hits: the chance a level, and how much harder. */
  crit: 0.08, critHit: 2,
  /** Crunch: extra damage a level at no health left (it grows as health drops). */
  rage: 0.15,
  /** Lag: the chance a level that a hit misses you. */
  dodge: 0.06,
  /** Safe mode: invincible for `safeFor` (+0.5 a level) every `safeEvery` (−2 a level) seconds. */
  safeEvery: 14, safeFor: 1.5,
  /** Chained exception: a bug's burst when it dies, reach and damage (more each level). */
  novaReach: 34, novaDmg: 12,
  /** The monolith's and the microservice's body (the hero's radius is 15) and what each brings. */
  giantR: 18, giantDmg: 1.2, dwarfR: 13, dwarfSpeed: 1.08,
};

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
  /** Seconds it has been close enough to swing at you (0 when not): only for its attack animation, damage is still on contact. */
  swing: number;
  /** Seconds of a boss's hurt pose, and seconds before it can show it again (`BOSS_PAIN`), so it doesn't flinch at every arrow. */
  pain: number;
  painCd: number;
  burn: number;
  burnDps: number;
  /** Burning with the will-o'-wisp's blue flames (its fused arrows and the flames they leave) rather than plain fire. */
  blueFire?: boolean;
  burnTick: number;
  slow: number;
  slowBy: number;
  /** Seconds before it can be stopped dead again (a stun, a freeze, the 1-ton weight): until then those only slow it. */
  paraCd: number;
  /** The Medusa's deep gaze: true while the hero is within its reach (her gaze pose, her tenth picture). */
  gaze: boolean;
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
  /** Walk cycle, in frames: it advances with the ground actually covered, so the sprite never walks on the spot. */
  step: number;
  /** Walking round a rack that blocked the way: -1 or 1, for `detour` seconds. */
  side: number;
  detour: number;
  dead: boolean;
  /** Bosses: which one ('' for the rest), the final one of the world (room 12, or the second on call), and a
      shadow clone of the nightmare world's final boss (weak, gone after `ttl` seconds). */
  bossId: string;
  final: boolean;
  clone: boolean;
  /** A smaller boss a sprint final boss calls once a sprint mastery is taken (`MINION`). */
  minion: boolean;
  /** Seconds to the Queen's next plants. */
  grow: number;
  /** A plant the Carnivorous Queen grows: it stays rooted where it came up and spits at you. */
  rooted: boolean;
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
  /** On call: time to this boss's next leap at you (every boss leaps there, like the Treant). */
  leapCd: number;
  /** Final bosses whose world sells a weapon throw it now and then (`ARMOURY`): time to the next. */
  armCd: number;
  sigs: number;
  /** Charges still to chain (Valdur's frenzy). */
  combo: number;
  /** The final boss's last stand, from 20% health: it runs and charges much faster (`RAGE_AT`). */
  rage: boolean;
  /** Nocthrax's phase: 1 on the ground, 2 in the air from half health (30% bigger), 3 its final form from 20% (40% bigger again). */
  phase: number;
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
  /** The boss that fired it (its `bossId`), for what its hit leaves on you; a boss's shot leaves a track. */
  from?: string;
  /** Fired in the boss's second phase (the green-haired Medusa's turquoise bolts). */
  alt?: boolean;
  /** Seconds to the next dab of its track. */
  trail?: number;
  /** Seconds before it starts (a tornado forming as a vortex on the floor). */
  wait?: number;
  /** A boss shot drawn with one of the weapon pictures (see `ORB_PIC` in draw.ts) instead of a plain orb. */
  pic?: OrbPic;
};
/** A dab of a boss shot's track (see `BOSS_TRAIL`). */
export type BossTrail = { x: number; y: number; r: number; life: number; max: number; dmg: number; tone: string; from?: string };
/** Every boss shot leaves a track: a dab every `every` seconds that lasts `life` and hurts for `share` of the shot. */
const BOSS_TRAIL = { every: 0.05, life: 0.55, share: 0.4, cap: 360 };
export type OrbPic = 'durian' | 'shark' | 'ember' | 'medusa' | 'mudball' | 'venom' | 'tornado' | 'fireball' | 'rocket' | 'leaf' | 'acid' | 'water' | 'ghost' | 'bolt' | 'spark';
/** What a boss's attack looks like: its element. */
export type ThreatEl = 'fire' | 'water' | 'mud' | 'arcane' | 'leaf' | 'bolt' | 'laser' | 'shadow' | 'glitch';
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
  /** The boss that cast it (its `bossId`). */
  from?: string;
  /** Cast in the boss's second phase (the green-haired Medusa's turquoise sigils). */
  alt?: boolean;
  /** A row of thorny vine (which of the two pictures): it bursts along the line and stays as thorns. */
  vine?: number;
  /** Zeus's lightning is blue; everyone else's yellow. */
  blue?: boolean;
  /** Wave: speed, how far it has come, and the safe gap (its centre along the wave, half its width). */
  speed?: number;
  done?: number;
  gap?: number;
  gapW?: number;
  /** Wave: how far it crosses in all, so it can be drawn calm, cresting or breaking by where it is. */
  span?: number;
  /** Left on the floor when it hits. */
  after?: 'lava' | 'thorns' | 'puddle';
  /** Something lobbed onto the circle while it warns (the Mech's fuel barrels, the molotov's evolution). */
  lob?: 'barrel' | 'brick' | 'molotov';
  /** A mine sown by the Drakkar: goes off when its warning runs out, or at once if you step on it. */
  mine?: boolean;
  /** A javelin: when the warning runs out a bolt flies along the line instead of the whole line striking. */
  shot?: OrbPic;
};
export type Particle = {
  x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string;
  /** How it is drawn: a dot (unset), a puff that swells as it fades, a streak along its flight, a snowflake or a rising wisp. */
  kind?: 'puff' | 'spark' | 'flake' | 'wisp' | 'glow' | 'crackle';
  /** Drawn under the shots (an arrow's track). */
  low?: boolean;
};
/** Lightning is yellow; blue only for evolved weapons and Zeus. */
export type Zap = { pts: Vec[]; life: number; blue?: boolean };
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
  kind: 'slash' | 'ring' | 'boom' | 'strike' | 'halo' | 'beam' | 'rune' | 'pic' | 'phoenix'; x: number; y: number; r: number; a: number; life: number; max: number;
  /** Seconds before it starts (the evolved sword's three cuts follow one another). */
  delay?: number;
  /** A strike in blue (evolved weapons, Zeus); yellow otherwise. */
  blue?: boolean;
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
  /** A vine row: drawn along its length, growing out over its first moment. */
  vine?: boolean;
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
  /** Seconds left of what a final boss's hit leaves (see `BOSS_STATUS`): poisoned, stunned, chilled, in the dark. */
  poison: number;
  stun: number;
  chill: number;
  dark: number;
  stone: number;
  mired: number;
  /** Seconds before a stun or the stone can hold you again (each leaves you free a while after it ends). */
  paraCd: number;
  /** Seconds spent within the Medusa's gaze (`GAZE`): at `hold` you turn to stone. */
  gaze: number;
  /** Seconds left of the flames on you after a fire hit (lava, a fireball, meteors, a breath): only to be seen. */
  burn: number;
  /** Seconds left of Safe mode's bubble (the invincibility itself is `inv`): only to be seen. */
  safe: number;
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
  /** Nightmare: On call with no clock, the bugs pouring in faster the longer you last. */
  endless: boolean;
  /** Boss Rush (a sprints run of bosses only): the stage, 1 to `stages`, each a world's room-6 boss and then its
      final boss, in that world's room, floor, hazard and song; 0 when not a rush. */
  rush: number;
  /** How many stages this rush has (two for each world open in sprints). */
  stages: number;
  /** The showcase (Boss Rush's «look at the bosses» mode): nobody takes damage but the bugs they call, and the
      boss loses a quarter of its health only when `showcaseHit` is pressed, to see its phases at leisure. */
  showcase: boolean;
  /** The secret shift (an easter egg behind the map's «coming soon» island, on call): the jungle's field, cast and
      hazards, and both bosses are Kratos (the room-6 kit at 5:00, the final one at 10:00). */
  secret: boolean;
  /** Which world's floor and blocks are drawn (0: the run's own); only the look, picked in Customise to try them out. */
  scene: number;
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
  /** The one revive a run that watching an ad gives (`adRevive`), and the one extra reroll a shift (`adReroll`). */
  adRevived: boolean;
  adRerolled: boolean;
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
  /** What a boss's shots leave along their path: a burning track that fades and hurts to touch. */
  bossTrail: BossTrail[];
  threats: Threat[];
  particles: Particle[];
  zaps: Zap[];
  gems: Gem[];
  hearts: Heart[];
  fx: Fx[];
  fireballs: Fireball[];
  spirits: Spirit[];
  obstacles: Rect[];
  /** On call: the run's seed for the field's blocks, and the cell the hero stood in when they were last laid out. */
  fieldSeed: number;
  fieldKey: string;
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
  /** Level-up rerolls left: two a run, in both modes. */
  rerolls: number;
  /** Commit and push: seconds until each volley still to fire. */
  volleys: number[];
  /** Safe mode: seconds until the next spell of invincibility. */
  safeCd: number;
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
  | 'shoot' | 'knife' | 'boomerang' | 'orb' | 'hit' | 'kill' | 'gem' | 'heart' | 'chest' | 'slash' | 'slam' | 'strike' | 'boom' | 'minute' | 'rage' | 'phase' | 'minion' | 'plants' | 'laser' | 'dodge' | 'safe' | BossStatus;

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
  const tough = horde ? (1 + (g.time / 60) * 0.2) * (1 + (g.world - 1) * 0.3) : (1 + (stageOf(room) - 1) * 0.095) * worldUp;
  // On call bosses have a set health (what the clock used to give at 5:00 and 10:00); only Nightmare's,
  // which keep coming without end, grow 8% for every minute gone.
  const bossHp = horde
    ? g.endless ? (finalBossNow(g) ? 4200 : 1800) * (1 + (g.time / 60) * 0.08) : finalBossNow(g) ? 7560 : 2520
    : room === ROOMS ? 2200 : 1000;
  const base = {
    bug: { r: 12, hp: 40, speed: 72, dmg: 10, xp: 6 },
    ticket: { r: 14, hp: 60, speed: 46, dmg: 12, xp: 8 },
    legacy: { r: 20, hp: 170, speed: 34, dmg: 20, xp: 14 },
    boss: { r: 40, hp: bossHp, speed: 40, dmg: 22, xp: 70 },
  }[kind];
  // The world's final boss (room 12, or the second one on call) is bigger and has its own kit.
  const final = kind === 'boss' && (horde ? finalBossNow(g) : room === ROOMS);
  // The Core's Chimera, the last of all: twice the health of the other final bosses' formula.
  const chimera = final && g.world === WORLD_COUNT ? 2 : 1;
  const hp = Math.round(base.hp * (kind === 'boss' ? worldUp * g.bossHpMult * chimera : tough));
  const bossId: string = kind !== 'boss' ? '' : g.secret ? 'kratos' : final ? FINAL_BOSS[g.world - 1] : look;
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
    speed: base.speed * (final && g.world === 3 ? 0.8 : 1) * (BOSS_PACE[bossId] ?? 1) * (1 + (g.world - 1) * 0.03) * (horde && kind !== 'boss' ? 1 + (g.time / 60) * 0.02 : 1),
    dmg: Math.round(base.dmg * (1 + (g.world - 1) * 0.1)),
    xp: base.xp,
    spawn,
    hit: 0,
    pain: 0,
    painCd: 0,
    burn: 0,
    burnDps: 0,
    burnTick: 0,
    slow: 0,
    slowBy: 0,
    paraCd: 0,
    gaze: false,
    kx: 0,
    ky: 0,
    cd: rand(1.2, 2.4),
    cd2: 4,
    cd3: 6,
    aim: 0,
    dash: 0,
    dir: { x: 0, y: 1 },
    wobble: rand(0, Math.PI * 2),
    step: rand(0, 4),
    side: Math.random() < 0.5 ? -1 : 1,
    detour: 0,
    dead: false,
    bossId,
    final,
    clone: false,
    minion: false,
    rooted: false,
    grow: 4,
    ttl: final ? 8 : 0,
    vanish: false,
    land: '',
    pose: 0,
    act: '',
    chan: 0,
    chanTick: 0,
    cd4: 3,
    cd5: 4.5,
    swing: 0,
    leapCd: 4,
    armCd: 5,
    sigs: 0,
    combo: 0,
    rage: false,
    phase: 1,
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
    // Puddles are kept for a mud world to come; the viking world now brings its ice spikes.
    const pool: HazardKind[] = ['lava', 'ice', 'thorns', 'strike', 'bouncy'];
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
  g.bossTrail = [];
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

/* Boss Rush: stage 1 is world 1's room-6 boss, stage 2 its final boss, stage 3 world 2's room-6 boss, and so on. */
export const rushWorld = (stage: number) => Math.ceil(stage / 2);
/** Boss Rush: bosses give twice the XP, so the levels keep up with a run that has no rooms of bugs. */
const RUSH_XP = 2;
/** …and each new stage gives back this share of max health. */
const RUSH_HEAL = 0.25;
/** …and it starts with this many level ups to pick, what five rooms give a sprint. */
const RUSH_START_PICKS = 4;
function enterStage(g: Game, stage: number) {
  g.rush = stage;
  g.world = rushWorld(stage);
  if (stage > 1) heal(g, g.player.maxHp * RUSH_HEAL);
  enterRoom(g, stage % 2 ? 6 : ROOMS);
  for (const e of g.enemies) if (e.kind === 'boss') e.xp *= RUSH_XP;
}

/** `rush`: a Boss Rush through the bosses of the first `rush` worlds (sprints only). */
/** The secret shift's world: its floor, blocks, cast and hazards are the jungle's. */
export const SECRET_WORLD = 5;
export function newGame(loadout: Loadout = BASE_LOADOUT, style: EnemyStyle = 'world', world = 1, mode: Mode = 'sprints', endless = false, rush = 0, secret = false): Game {
  if (secret) { mode = 'horde'; world = SECRET_WORLD; endless = false; }
  const nightmare = endless && mode === 'horde';
  const g: Game = {
    world: nightmare ? NIGHTMARE_WORLD : clamp(world, 1, WORLD_COUNT),
    mode,
    endless: nightmare,
    rush: 0,
    stages: 0,
    secret: false,
    showcase: false,
    scene: 0,
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
    adRevived: false,
    adRerolled: false,
    reviveDeclined: false,
    hazards: [],
    strikes: [],
    strikeIn: 2,
    hazard: 'none',
    player: { x: W / 2, y: H - 70, r: 15, hp: loadout.maxHp, maxHp: loadout.maxHp, speed: 150 * loadout.speedMult, inv: 0, ouch: 0, moving: false, face: -Math.PI / 2, heading: -Math.PI / 2, poison: 0, stun: 0, chill: 0, dark: 0, stone: 0, mired: 0, paraCd: 0, burn: 0, safe: 0, gaze: 0 },
    enemies: [],
    shots: [],
    orbs: [],
    bossTrail: [],
    threats: [],
    particles: [],
    zaps: [],
    gems: [],
    hearts: [],
    fx: [],
    fireballs: [],
    spirits: [],
    obstacles: [],
    fieldSeed: Math.floor(Math.random() * 2 ** 31),
    fieldKey: '',
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
    rerolls: 2,
    volleys: [],
    safeCd: ARCHERO.safeEvery,
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
  for (const s of loadout.startSkills) g.skills[s] = Math.max(g.skills[s], Math.min(maxLevel(s), loadout.startLevels?.[s] ?? 1));
  // The Senior's Tome: random weapons at their top level, each with its partner, so the first level up offers to evolve them.
  // Only within the four weapon slots, and never past the bow's two elements.
  const ready = (Object.keys(EVO_PARTNER) as SkillId[]).filter((w) => !g.skills[w] && allowedIn(g, w));
  for (let i = 0; i < loadout.startMaxed && ownedWeapons(g).length < MAX_WEAPONS; i++) {
    const fits = ready.filter((w) => !g.skills[w] && !elementShut(g, EVO_PARTNER[w]!));
    if (!fits.length) break;
    const w = fits[Math.floor(Math.random() * fits.length)];
    g.skills[w] = maxLevel(w);
    const partner = EVO_PARTNER[w]!;
    g.skills[partner] = Math.max(g.skills[partner], 1);
  }
  g.secret = secret;
  if (mode === 'horde') {
    // It also starts at a higher bar: level 4 or so after the first minute, not 8.
    g.xpNext = 45;
    startField(g);
  }
  else if (rush) {
    g.stages = 2 * clamp(rush, 1, WORLD_COUNT);
    enterStage(g, 1);
    // With no rooms of bugs before it, the rush starts where a sprint reaches its first boss: a few levels to pick.
    g.level += RUSH_START_PICKS;
    g.pendingLevels += RUSH_START_PICKS;
    for (let i = 0; i < RUSH_START_PICKS; i++) g.xpNext += 15;
  }
  else enterRoom(g, 1);
  g.events = [];
  return g;
}

/* ------------------------------------------------------------------ on call */

/** The open field: the hero in the middle of nowhere, the world's weather, and the first bugs on their way. */
function startField(g: Game) {
  g.player.x = 0;
  g.player.y = 0;
  g.fieldKey = '';
  layField(g);
  const def = WORLDS[g.world - 1];
  g.hazard = def.hazard === 'mixed' ? 'lava' : def.hazard;
  g.hazards = [];
  g.strikes = [];
  g.threats = [];
  g.strikeIn = 3;
  for (let i = 0; i < 4; i++) g.enemies.push(makeEnemy(g, 'bug', 1, ringSpot(g, 0.75), rand(0.6, 1.4)));
  g.events.push('room');
}

/* The world's blocks scattered over the open field, so its pieces show on call too. The field is cut into cells and
   each cell's blocks come from a hash of its place and the run's seed, so a cell left behind and found again holds the
   same ones; only the cells round the hero are kept in `g.obstacles`. Every block is one of the room layouts' blocks,
   with its place among them as its `piece`, so it is drawn as that piece. */
const FIELD_CELL = 300;
/** How many cells out from the hero's are kept (past the spawn ring and the stragglers' reach). */
const FIELD_REACH = 3;
/** The ground round the hero's starting spot stays clear. */
const FIELD_CLEAR = 170;
const FIELD_KINDS: Rect[] = (() => {
  const kinds: Rect[] = [];
  for (const layout of LAYOUTS) {
    layout.forEach((o, i) => {
      const piece = layout.slice(0, i).filter((b) => b.w === o.w && b.h === o.h).length;
      if (!kinds.some((k) => k.w === o.w && k.h === o.h && k.piece === piece)) kinds.push({ x: 0, y: 0, w: o.w, h: o.h, piece });
    });
  }
  return kinds;
})();
/** A small seeded random source (mulberry32) for one cell. */
function cellRandom(seed: number, cx: number, cy: number) {
  let a = (seed ^ Math.imul(cx, 0x27d4eb2d) ^ Math.imul(cy, 0x165667b1)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** A cell's blocks: none a quarter of the time, one half of it, two well apart the rest (about three a screen). */
function cellBlocks(seed: number, cx: number, cy: number): Rect[] {
  const rnd = cellRandom(seed, cx, cy);
  const roll = rnd();
  const count = roll < 0.25 ? 0 : roll < 0.75 ? 1 : 2;
  const out: Rect[] = [];
  const margin = 40;
  for (let i = 0; i < count; i++) {
    const kind = FIELD_KINDS[Math.floor(rnd() * FIELD_KINDS.length)];
    const b = { ...kind, x: cx * FIELD_CELL + margin + rnd() * (FIELD_CELL - 2 * margin - kind.w), y: cy * FIELD_CELL + margin + rnd() * (FIELD_CELL - 2 * margin - kind.h) };
    if (inRect({ x: 0, y: 0 }, b, FIELD_CLEAR)) continue;
    if (out.some((o) => b.x < o.x + o.w + 80 && o.x < b.x + b.w + 80 && b.y < o.y + o.h + 80 && o.y < b.y + b.h + 80)) continue;
    out.push(b);
  }
  return out;
}
/** Lays out the blocks round the hero again whenever the hero walks into another cell. */
function layField(g: Game) {
  const cx = Math.floor(g.player.x / FIELD_CELL);
  const cy = Math.floor(g.player.y / FIELD_CELL);
  const key = `${cx},${cy}`;
  if (key === g.fieldKey) return;
  g.fieldKey = key;
  const blocks: Rect[] = [];
  for (let dx = -FIELD_REACH; dx <= FIELD_REACH; dx++)
    for (let dy = -FIELD_REACH; dy <= FIELD_REACH; dy++) blocks.push(...cellBlocks(g.fieldSeed, cx + dx, cy + dy));
  g.obstacles = blocks;
}

/** A point on a ring round the hero, just past the edge of what the page shows (`k` scales it), off the field's blocks. */
function ringSpot(g: Game, k = 1): Vec {
  const p = g.player;
  const r = (Math.hypot(g.viewHalf.x, g.viewHalf.y) + 40) * k;
  let at: Vec = p;
  for (let tries = 0; tries < 8; tries++) {
    const a = rand(0, Math.PI * 2);
    at = { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r };
    if (!g.obstacles.some((o) => inRect(at, o, 24))) break;
  }
  return at;
}

/** Ten minutes of bugs: the spawns speed up, the kinds widen, bosses come at 5:00 and 10:00. */
function updateHorde(g: Game, dt: number) {
  layField(g);
  const minute = g.time / 60;
  const before = Math.floor((g.time - dt) / 60);
  if (Math.floor(minute) > before && (g.endless || g.time < HORDE_LENGTH)) {
    g.coins += 5 * worldPay(g);
    g.events.push('minute');
  }
  // The showcase on call (the secret shift's): no waiting for the clock, the next boss comes two seconds after the last.
  if (g.showcase && nextBossAt(g) < Infinity && !g.enemies.some((e) => e.kind === 'boss' && !e.dead)) g.time = Math.max(g.time, nextBossAt(g) - 2);
  // Bosses: summoned once each when their minute comes.
  if (g.time >= nextBossAt(g)) {
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
  // Nightmare has no top: the cap keeps rising and the spawns keep quickening the longer you last.
  const cap = g.endless ? Math.min(320, 30 + Math.floor(minute * 5) + 4 * wk) : Math.min(64 + 4 * wk, 30 + Math.floor(minute * 4) + 4 * wk);
  const quickest = g.endless ? Math.max(0.12, 0.4 - Math.max(0, minute - 10) * 0.02) : 0.4;
  if (g.hordeSpawn <= 0) {
    g.hordeSpawn = Math.max(quickest, (1.7 - minute * 0.12) * (1 - 0.07 * wk)) * (bossOut ? 1.8 : 1);
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
  if (elementShut(g, s)) return false;
  // The monolith or the microservice, never both.
  if ((s === 'giant' && g.skills.dwarf) || (s === 'dwarf' && g.skills.giant)) return false;
  // …and a new weapon that evolves with one of those two would stay at level 3 for good, so it stops coming too.
  if (g.skills[s] === 0 && CATEGORY[s] !== 'upgrade' && EVO_PARTNER[s] && elementShut(g, EVO_PARTNER[s]!)) return false;
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
    // With a pair of elements on the way to their fusion, the bow's slot offers one of the two half the time,
    // or a run (sprints above all) would seldom see the card.
    const toward = k === 2 && pairFusion(g) && !g.fused && !canFuse(g) ? pickFrom(arrowElements(g)) : [];
    if (toward.length && Math.random() < 0.5) g.choices.push(any(toward));
    else if (pool.length) g.choices.push(any(pool));
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
    g.arrowPick = 'fusion';
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

const power = (g: Game, cat: Category) => (1 + 0.25 * g.skills.power) * g.loadout.mult[cat]
  // Crunch: harder the less health you have left; the monolith hits harder all the time.
  * (1 + ARCHERO.rage * g.skills.rage * (1 - g.player.hp / g.player.maxHp)) * (g.skills.giant ? ARCHERO.giantDmg : 1);
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
/** Later worlds pay better: +50% a world in sprints, +25% on call, where later worlds also pour in far more bugs
    (a world-7 shift paid about 10000 coins at +50%, more than a skin; now about 6400). */
const worldPay = (g: Game) => g.loadout.coinMult * (1 + (g.world - 1) * (g.mode === 'horde' ? 0.25 : 0.5));

/** On call: how often each kind drops a heart, how long one lasts, and how much it heals (share of max health). */
const HEART_CHANCE: Partial<Record<EnemyKind, number>> = { ticket: 0.06, legacy: 0.35 };
export const HEART_LIFE = 18;
const HEART_HEAL = 0.12;

/** While a chained exception's burst is going off (its own kills don't burst again). */
let novaing = false;
function kill(g: Game, e: Enemy) {
  if (e.dead) return;
  e.dead = true;
  g.kills += 1;
  // A shadow clone only bursts into smoke.
  if (e.clone) {
    burst(g, e.x, e.y, '#a78bfa', 22, 160, 3);
    return;
  }
  // The real boss down: its clones and the bosses it called go with it.
  if (e.kind === 'boss' && !e.minion) {
    for (const c of g.enemies) if ((c.clone || c.minion || c.rooted) && !c.dead) { c.dead = true; burst(g, c.x, c.y, '#a78bfa', 18, 120, 3); }
    g.threats = g.threats.filter((t) => t.owner !== e.id);
  }
  // Plasma (fire + lightning arrows): a burning bug blows up when it dies, setting its neighbours alight.
  if (e.burn > 0 && fusionOf(g) === 'plasma') {
    g.fx.push({ kind: 'pic', pic: 'plasma-burst', top: true, x: e.x, y: e.y, r: 58, a: rand(0, 6), life: 0.45, max: 0.45 });
    for (const o of live(g)) {
      if (o === e || dist(o, e) > 40 + o.r) continue;
      o.burn = Math.max(o.burn, 2);
      o.burnDps = Math.max(o.burnDps, 10);
      o.blueFire = false;
      hurt(g, o, 14 * power(g, 'ranged'));
    }
  }
  // Garbage collector: a little health back for every bug cleared.
  if (g.skills.vampire) heal(g, g.player.maxHp * ARCHERO.vampire * g.skills.vampire);
  // Chained exception: the bug bursts as it dies, hurting the ones round it (a burst's own kills don't burst again).
  if (g.skills.nova && !novaing) {
    const lv = g.skills.nova;
    const reach = ARCHERO.novaReach + 6 * (lv - 1);
    novaing = true;
    g.fx.push({ kind: 'pic', pic: 'nova-burst', top: true, x: e.x, y: e.y, r: reach * 1.4, a: rand(-0.3, 0.3), life: 0.35, max: 0.35 });
    for (const o of live(g)) if (dist(o, e) <= reach + o.r) hurt(g, o, (ARCHERO.novaDmg + 8 * (lv - 1)) * power(g, 'upgrade'));
    novaing = false;
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
    const last = g.mode === 'horde' ? !g.endless && g.hordeBoss >= HORDE_BOSS_AT.length : g.rush ? g.rush === g.stages : g.room === ROOMS;
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

/** A boss shows its hurt pose for `show` seconds when hit, then not again for `every` seconds, however many hits land. */
const BOSS_PAIN = { show: 0.18, every: 1.2 };

/** Set while `showcaseHit` is taking its quarter, so the showcase lets that one blow through. */
let showcaseBlow = false;
function hurt(g: Game, e: Enemy, amount: number, push?: Vec) {
  if (e.dead) return;
  // The showcase: bosses (their clones and helpers too) only lose health to its button.
  if (g.showcase && !showcaseBlow && (e.kind === 'boss' || e.minion || e.clone)) { e.hit = 0.1; return; }
  // Critical hits: a real blow (not a burn's or an aura's tick) now and then lands twice as hard.
  if (g.skills.crit && amount >= 4 && Math.random() < ARCHERO.crit * g.skills.crit) {
    amount *= ARCHERO.critHit;
    g.fx.push({ kind: 'pic', pic: 'crit-spark', top: true, x: e.x, y: e.y - e.r * 0.4, r: 22, a: rand(-0.4, 0.4), life: 0.25, max: 0.25 });
  }
  e.hp -= amount;
  e.hit = 0.1;
  // The hurt pose only shows while the boss walks or stands: it no longer cuts into a wind-up, a charge or an attack.
  if (e.kind === 'boss' && e.painCd <= 0 && e.aim <= 0 && e.dash <= 0 && e.pose <= 0 && e.chan <= 0) { e.pain = BOSS_PAIN.show; e.painCd = BOSS_PAIN.every; }
  if (e.bossId === 'drakkar' && e.hp <= e.maxHp / 2) {
    breakShip(g, e);
    return;
  }
  if (e.bossId === 'chimera' && !e.clone && e.phase < 2 && e.hp > 0 && e.hp <= e.maxHp / 2) takeWing(g, e);
  // The Medusa at half health: her snakes turn green and her eyes red (her second sheet, `medusa2`).
  if (e.bossId === 'medusa' && e.phase < 2 && e.hp > 0 && e.hp <= e.maxHp / 2) {
    e.phase = 2;
    g.shake = Math.max(g.shake, 0.5);
    burst(g, e.x, e.y, '#2dd4bf', 30, 200, 3.5);
    g.events.push('phase');
  }
  // Kratos at half health takes up the Blade of Olympus: his second sheet, `kratos2`, and lightning for fire.
  if (e.bossId === 'kratos' && e.phase < 2 && e.hp > 0 && e.hp <= e.maxHp / 2) {
    e.phase = 2;
    g.shake = Math.max(g.shake, 0.5);
    burst(g, e.x, e.y, '#60a5fa', 34, 220, 3.5);
    g.events.push('phase');
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
  // Segfault: now and then a bow arrow takes a bug down at once (never a boss, a clone or a boss's minion).
  if (s.bow && g.skills.headshot && e.kind !== 'boss' && !e.minion && Math.random() < ARCHERO.headshot * g.skills.headshot) {
    g.fx.push({ kind: 'pic', pic: 'segfault', top: true, x: e.x, y: e.y, r: 34, a: 0, life: 0.4, max: 0.4 });
    burst(g, e.x, e.y, '#f43f5e', 12, 160, 3);
    hurt(g, e, e.hp + 1);
    return;
  }
  hurt(g, e, s.dmg, s.kind === 'boomerang' ? undefined : { x: s.vx * 0.06, y: s.vy * 0.06 });
  burst(g, s.x, s.y, '#ffffff', 4, 90, 2);
  g.events.push('hit');
  // The spirit's element: fire burns, tide slows, volt arcs to one more bug.
  if (s.elem === 'fire') { e.burn = 2; e.burnDps = Math.max(e.burnDps, 7); e.blueFire = false; }
  else if (s.elem === 'tide') { e.slow = 1.5; e.slowBy = Math.max(e.slowBy, 0.35); }
  else if (s.elem === 'volt') chain(g, e, 1, s.dmg * 0.6);
  if (!s.bow) return;
  if (g.skills.fire) {
    e.burn = 2;
    e.burnDps = 6 * g.skills.fire;
    e.blueFire = fusionOf(g) === 'wisp';
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

/* The mark of a fused arrow: a track along its path that lingers back to the bow and fades, only to be seen
   (will-o'-wisp's flames are real fire), whatever look is worn. Plain arrows leave none. Steam puffs, pink
   plasma beads, blue crackles of electrocution, snowflakes of spectral frost and violet wisps of the
   spectral storm. */
const TRAIL: Partial<Record<Fusion, { every: number; kind: Particle['kind']; colors: string[]; size: [number, number]; life: number; spread: number }>> = {
  steam: { every: 0.03, kind: 'puff', colors: ['#f1f5f9', '#e2e8f0', '#cbd5e1'], size: [4.5, 7], life: 0.7, spread: 22 },
  plasma: { every: 0.01, kind: 'glow', colors: ['#f0abfc', '#e879f9', '#fde68a', '#ff5fd2'], size: [2.5, 4.5], life: 0.65, spread: 24 },
  shock: { every: 0.012, kind: 'crackle', colors: ['#7dd3fc', '#e0f2fe', '#38bdf8'], size: [6, 10], life: 0.5, spread: 14 },
  frostbite: { every: 0.035, kind: 'flake', colors: ['#f0f9ff', '#bae6fd'], size: [4, 5.5], life: 0.7, spread: 26 },
  spectral: { every: 0.025, kind: 'wisp', colors: ['#c4b5fd', '#a78bfa', '#ddd6fe'], size: [3.5, 5.5], life: 0.6, spread: 20 },
};
function arrowTrail(g: Game, s: Shot, dt: number, key: Fusion) {
  const t = TRAIL[key];
  if (!t || g.particles.length > 420) return;
  s.trail = (s.trail ?? 0) - dt;
  // Faster than a frame: several a frame, spread back along the path the arrow just covered.
  for (let n = 0; s.trail <= 0 && n < 4; n++) {
    s.trail += t.every;
    const a = rand(0, Math.PI * 2);
    const sp = rand(0.3, 1) * t.spread;
    const back = 0.02 + rand(0, dt);
    g.particles.push({
      x: s.x - s.vx * back, y: s.y - s.vy * back,
      vx: Math.cos(a) * sp - s.vx * 0.05, vy: Math.sin(a) * sp - s.vy * 0.05 - (t.kind === 'wisp' ? 30 : 0),
      life: t.life, max: t.life, size: rand(t.size[0], t.size[1]), color: t.colors[Math.floor(Math.random() * t.colors.length)], kind: t.kind, low: true,
    });
  }
  if (s.trail <= 0) s.trail = t.every;
}

/* What each fusion adds to a bow hit (plasma works on kills, will-o'-wisp
   on the arrow's flight, shock in `chain`). */
function fuse(g: Game, e: Enemy, s: Shot, fusion: Fusion) {
  if (fusion === 'plasma') {
    // Plasma: a small burst of the owner's plasma on every hit (only to be seen; the blast comes on the kill).
    if (g.fx.filter((f) => f.pic === 'plasma-burst').length < 8) {
      g.fx.push({ kind: 'pic', pic: 'plasma-burst', top: true, x: e.x, y: e.y, r: e.r + 10, a: rand(0, 6), life: 0.25, max: 0.25 });
    }
  } else if (fusion === 'steam') {
    // Steam: a cloud that scalds and slows the bugs inside.
    if (g.embers.filter((k) => k.kind === 'steam').length < 10) {
      g.embers.push({ x: e.x, y: e.y, r: 26, life: 1.3, max: 1.3, dps: 7 * power(g, 'ranged'), kind: 'steam', slow: 0.4 });
    }
  } else if (fusion === 'frostbite') {
    // Spectral frost: every bug the arrow goes through freezes for a moment (bosses only slow).
    if (e.slow < 0.2 && g.fx.filter((f) => f.pic === 'ice-block').length < 10) {
      g.fx.push({ kind: 'pic', pic: 'ice-block', top: true, x: e.x, y: e.y, r: e.r + 6, a: 0, life: 0.5, max: 0.5 });
    }
    if (e.kind === 'boss') { e.slow = Math.max(e.slow, 0.5); e.slowBy = Math.max(e.slowBy, 0.6); }
    else paralyze(e, 0.5);
  } else if (fusion === 'spectral') {
    // Spectral storm: each bug the arrow goes through calls a bolt from the sky (the first two).
    if (s.hits.size <= 2) {
      // The owner's violet bolt, standing on the bug (its foot is low in the picture).
      g.fx.push({ kind: 'pic', pic: 'spectral-bolt', top: true, x: e.x, y: e.y - 22, r: 28, a: 0, life: 0.3, max: 0.3 });
      for (const o of live(g)) if (dist(o, e) < 22 + o.r) hurt(g, o, s.dmg * 0.35);
    }
  }
}

function chain(g: Game, from: Enemy, jumps: number, amount: number, blue = false) {
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
    g.zaps.push({ pts: zigzag(at, next), life: 0.18, blue });
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

function fireBow(g: Game, target: Enemy, echo = false) {
  const p = g.player;
  const angle = Math.atan2(target.y - p.y, target.x - p.x);
  p.face = angle;
  const angles = [angle];
  for (let i = 1; i <= g.skills.leaf; i++) angles.push(angle - i * 0.26, angle + i * 0.26);
  // Code review: one arrow behind you, and from level 2 one to each side.
  if (g.skills.rear) angles.push(angle + Math.PI);
  if (g.skills.rear >= 2) angles.push(angle + Math.PI / 2, angle - Math.PI / 2);
  // Commit and push: the next volleys follow on their own (see useWeapons).
  if (!echo) for (let i = 1; i <= g.skills.multi; i++) g.volleys.push(ARCHERO.multiGap * i);
  const side = g.skills.double ? [-6, 6] : [0];
  const dmg = 20 * power(g, 'ranged') * (g.skills.double === 2 ? 0.85 : 1) * ARCHERO.multiSoft ** g.skills.multi;
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
    if (evolved) paralyze(e, 1.2);
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
   any look they own, the fused arrow ('fusion') among them once fused, and its
   trail goes with the look; otherwise the fusion, or the first owned, wins. */
export type ArrowLook = 'fusion' | 'fire' | 'water' | 'leaf' | 'ghost' | 'bolt' | 'spark';
const ARROW_LOOKS: Exclude<ArrowLook, 'fusion'>[] = ['fire', 'water', 'leaf', 'ghost', 'bolt', 'spark'];
export const arrowOptions = (g: Game): ArrowLook[] => [...(fusionOf(g) ? ['fusion' as const] : []), ...ARROW_LOOKS.filter((s) => g.skills[s] > 0)];
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
      if (el === 'fire') { e.burn = 2; e.burnDps = Math.max(e.burnDps, 6); e.blueFire = false; }
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
/** Whether a bug is inside the visible field (always, in a sprint's room). */
const inView = (g: Game, e: Vec) => g.mode !== 'horde' || (Math.abs(e.x - g.player.x) <= g.viewHalf.x && Math.abs(e.y - g.player.y) <= g.viewHalf.y);

function fireLaser(g: Game) {
  const p = g.player;
  const evolved = !!g.evolved.laser;
  const n = evolved ? 5 : g.skills.laser;
  // On call only what is on screen: the sky does not strike bugs you cannot see.
  const seen = live(g).filter((e) => inView(g, e));
  const targets = seen.sort((a, b) => dist(a, p) - dist(b, p)).slice(0, n);
  if (!targets.length) return;
  const half = laserWidth(g);
  const top = laserTop(g);
  const hit = new Set<number>();
  for (const [k, t] of targets.entries()) {
    g.fx.push({ kind: 'beam', x: t.x, y: top, r: t.y - top, a: Math.PI / 2, w: half, foot: t.y, life: 0.34, max: 0.34, delay: k * 0.06 });
    for (const e of seen) {
      if (hit.has(e.id) || dist(e, t) > half * 2.2 + e.r) continue;
      hit.add(e.id);
      hurt(g, e, laserDamage(g));
      if (evolved && g.fx.filter((f) => f.kind === 'rune').length < 16) g.fx.push({ kind: 'rune', x: e.x, y: e.y, r: 16 + e.r, a: Math.random() * Math.PI, life: 1, max: 1 });
    }
    if (evolved) g.fx.push({ kind: 'rune', x: t.x, y: t.y, r: 34, a: 0, life: 1.1, max: 1.1 });
  }
  g.events.push('laser');
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
    g.fx.push({ kind: 'strike', x: e.x, y: e.y, r, a: 0, life: 0.3, max: 0.3, blue: evolved });
    g.events.push('strike');
    g.zaps.push({ pts: zigzag({ x: e.x + rand(-20, 20), y: e.y - 220 }, e, 14), life: 0.22, blue: evolved });
    for (const o of live(g)) if (dist(o, e) < r + o.r) hurt(g, o, dmg);
    if (evolved) chain(g, e, 2, dmg * 0.5, true);
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
    e.blueFire = false;
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
/* The arsenal was tuned for On call, where a crowd keeps pouring in; a sprint room holds a handful of bugs,
   so the weapons that live on crowds (pools, bouncing balls and drills, mines) hit harder there. */
export const SPRINT_BOOST: Partial<Record<SkillId, number>> = { molotov: 2.2, durian: 2.8, drill: 2.3, ball: 2.3, mines: 1.5 };
const boost = (g: Game, s: SkillId) => (g.mode === 'sprints' ? SPRINT_BOOST[s] ?? 1 : 1);

function throwBricks(g: Game) {
  const lv = g.skills.brick;
  const evolved = !!g.evolved.brick;
  const dmg = (34 + 14 * (lv - 1)) * power(g, 'magic') * (evolved ? 2.2 : 1);
  for (let i = 0; i < (evolved ? 2 : lv); i++) {
    g.shots.push(shot('brick', g.player, -Math.PI / 2 + rand(-0.55, 0.55), rand(470, 560), dmg, {
      // It falls back down and breaks on the first bug it hits (`updateShot`), or leaves the room or the view.
      ghost: true, free: true, grav: 900, life: 3, size: evolved ? 26 : 13 + 2 * (lv - 1), spin: rand(0, 6),
    }));
  }
}

/* Molotov (magic): bottles thrown at the bugs near you burst into a pool of
   fire that burns whatever stands in it. Evolved (Fuel Barrel): three
   barrels, wider pools that burn longer and hotter. */
/** Where a bug will be after `secs`: bugs walk at you, so a step along the line to you at its pace (never more
    than half the gap, and not for the rooted or the ones that keep their distance). */
function lead(e: Enemy, to: Vec, secs: number): Vec {
  const d = dist(e, to);
  if (!d || e.rooted || e.kind === 'ticket' || e.kind === 'boss') return { x: e.x, y: e.y };
  const step = Math.min(e.speed * secs * 0.8, d * 0.5);
  return { x: e.x + ((to.x - e.x) / d) * step, y: e.y + ((to.y - e.y) / d) * step };
}
function throwMolotov(g: Game) {
  const p = g.player;
  const lv = g.skills.molotov;
  const evolved = !!g.evolved.molotov;
  // The nearest bugs, in order: the first bottle always goes to the nearest one (it used to pick at random among
  // the six nearest, so it often flew past the bug at your feet).
  const pool = live(g).sort((a, b) => dist(a, p) - dist(b, p));
  // A slow lob, the bottle tumbling end over end on its way (see updateShot)…
  const flight = 0.9;
  for (let i = 0; i < (evolved ? 3 : lv >= 3 ? 2 : 1) && i < pool.length; i++) {
    const t = pool[i];
    // …so it is thrown where the bug will be when it lands, not where it was.
    const at = lead(t, p, flight);
    g.shots.push(shot('molotov', p, 0, 0, 0, { vx: (at.x - p.x) / flight, vy: (at.y - p.y) / flight, life: flight, free: true, ghost: true, spin: rand(0, 6) }));
  }
}
function landMolotov(g: Game, at: Vec) {
  const lv = g.skills.molotov;
  const evolved = !!g.evolved.molotov;
  const life = evolved ? 4.5 : 3;
  g.embers.push({ x: at.x, y: at.y, r: (32 + 6 * (lv - 1)) * (evolved ? 1.6 : 1), life, max: life, dps: (14 + 6 * (lv - 1)) * power(g, 'magic') * (evolved ? 1.5 : 1) * boost(g, 'molotov') });
  burst(g, at.x, at.y, '#fb923c', 10, 140, 3);
  g.events.push('boom');
}

/* Mines (melee): one tossed every so often at the feet of the nearest bug
   within reach (at your own feet when none is), so the ones that keep their
   distance step on them too; armed after half a second, it goes off when a
   bug steps on it. Evolved (Thunderbolt Bomb): a wider blast whose
   lightning jumps on to three more bugs. */
const MINE_TOSS = 140;
function dropMine(g: Game) {
  const p = g.player;
  const max = 3 + 2 * g.skills.mines;
  if (g.mines.length >= max) g.mines.shift();
  const near = live(g).filter((e) => dist(e, p) < MINE_TOSS + e.r).sort((a, b) => dist(a, p) - dist(b, p))[0];
  g.mines.push(near ? { x: near.x, y: near.y + 4, arm: 0.5, life: 25 } : { x: p.x, y: p.y + 6, arm: 0.5, life: 25 });
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
    const dmg = (40 + 15 * (lv - 1)) * power(g, 'melee') * (evolved ? 1.3 : 1) * boost(g, 'mines');
    blast(g, m, (52 + 8 * (lv - 1)) * (evolved ? 1.3 : 1), dmg, '#fca5a5');
    if (evolved) {
      g.fx.push({ kind: 'pic', pic: 'volt-burst', x: m.x, y: m.y, r: 46, a: rand(0, 6), life: 0.4, max: 0.4 });
      g.fx.push({ kind: 'strike', x: m.x, y: m.y, r: 30, a: 0, life: 0.3, max: 0.3, blue: true });
      g.zaps.push({ pts: zigzag({ x: m.x + rand(-20, 20), y: m.y - 220 }, m, 14), life: 0.22, blue: true });
      chain(g, foe, 3, dmg * 0.6, true);
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
    d.dmg = (16 + 7 * (lv - 1)) * power(g, 'melee') * (evolved ? 1.4 : 1) * boost(g, 'durian');
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
    g.shots.push(shot('drill', p, angle + (i - (n - 1) / 2) * 0.3, evolved ? 420 : 330, (22 + 8 * (lv - 1)) * power(g, 'ranged') * (evolved ? 1.5 : 1) * boost(g, 'drill'), {
      pierce: 1e9, ghost: true, free: true, bounce: 2 + lv + (evolved ? 4 : 0), life: evolved ? 5 : 3, size: evolved ? 11 : 7 + (lv - 1), tick: 0,
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
    g.shots.push(shot('rocket', p, angle, evolved ? 200 : 240, dmg, { life: 2.2, size: evolved ? 5 : 7 + (lv - 1), aim: t.id }));
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
    g.shots.push(shot('ball', p, angle + (i - (n - 1) / 2) * 0.5, 320, (20 + 8 * (lv - 1)) * power(g, 'ranged') * (evolved ? 1.5 : 1) * boost(g, 'ball'), {
      pierce: 1e9, ghost: true, free: true, bounce: evolved ? 1e9 : 3 + 2 * lv, life: evolved ? 5 : 3, size: evolved ? 14 : 8 + (lv - 1), tick: 0,
    }));
  }
}

function useWeapons(g: Game, dt: number) {
  const p = g.player;
  const gear = g.gear;
  const sk = g.skills;
  for (const k of ['bow', 'knives', 'boomerang', 'sword', 'hammer', 'storm', 'fireball', 'laser', 'brick', 'molotov', 'mines', 'drill', 'rocket', 'ball'] as const) gear[k] = Math.max(0, gear[k] - dt);
  const fighting = live(g).length > 0;
  if (!fighting) { g.volleys = []; return; }
  // Commit and push: the volleys still to come go off at the nearest bug, wherever you are.
  if (g.volleys.length) {
    g.volleys = g.volleys.map((t) => t - dt);
    const due = g.volleys.filter((t) => t <= 0).length;
    g.volleys = g.volleys.filter((t) => t > 0);
    const target = due ? nearest(g, p, true) ?? nearest(g, p, false) : null;
    for (let i = 0; i < due && target; i++) { fireBow(g, target, true); g.events.push('shoot'); }
  }

  // Ranged: only while standing still, at the nearest bug in plain sight.
  // On call never lets you stand for long, so there they fire on the move
  // too, at a little over half the rate: stopping is still worth it.
  const onTheMove = p.moving && g.mode === 'horde';
  if (!p.moving || onTheMove) {
    const slow = onTheMove ? 1.8 : 1;
    const target = nearest(g, p, true);
    if (target) {
      if (gear.bow === 0) { fireBow(g, target); gear.bow = (slow * (1 + ARCHERO.multiSlow * sk.multi)) / (2 * haste(g)); g.events.push('shoot'); }
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

/* What some final bosses' hits leave on you, for a moment: the Carnivorous Queen poisons (a little damage
   over half a second, never the last point), Zeus stuns (you can't move), the Drakkar and Valdur chill (you
   walk slower) and the Shadow Wraith puts you in the dark (the view closes in round you); the Medusa turns you to
   stone (you can't move, like the stun) and the Mud Monster sticks you in the mud (you walk slower, like the chill). */
export type BossStatus = 'poison' | 'stun' | 'chill' | 'dark' | 'stone' | 'mired';
const BOSS_STATUS: Record<string, [BossStatus, number]> = {
  queen: ['poison', 0.5], zeus: ['stun', 0.5], medusa: ['stone', 0.6], mud: ['mired', 1.2], drakkar: ['chill', 1.5], valdur: ['chill', 1.5], wraith: ['dark', 4], nightmare: ['dark', 4],
};
/** Poison: health lost over its half second. */
const POISON_DMG = 8;
/** Seconds you stay free after a stun or the stone ends, and a bug after it was stopped dead, before it can happen again. */
const PARA_FREE = 2.5;
/** The Medusa's deep gaze: stay within `reach` of her for `hold` seconds and you turn to stone for `stone` seconds
    (the same cooldown as any hold); out of it the gaze fades twice as fast. */
export const GAZE = { reach: 120, hold: 2, stone: 1.5, out: 20 };
/** How fast each boss walks by its build, on its base pace (40, a little more each world): the heavy ones (the Monolith,
    the Treant, the Queen, the Drakkar's longship) as they were, the light and fierce ones much quicker, so none plods. */
const BOSS_PACE: Record<string, number> = {
  original: 1, demon: 1.5, viking: 1.6, mud: 1.15, jungle: 1, greek: 1.45, robot: 1.2, nightmare: 1.3,
  kernel: 1.2, archdemon: 1.35, drakkar: 1, medusa: 1.2, queen: 1, zeus: 1.3, mech: 1.25, wraith: 1.5, chimera: 1.3, kratos: 1.6,
};
/** Stops a bug dead for `secs`, unless it was stopped a moment ago: then it is only slowed (see `paraCd`). */
function paralyze(e: Enemy, secs: number) {
  e.slow = Math.max(e.slow, secs);
  if (e.paraCd > 0) { e.slowBy = Math.max(e.slowBy, 0.5); return; }
  e.slowBy = 1;
  e.paraCd = secs + PARA_FREE;
}
/** Chill: how much slower you walk. */
const CHILL_SLOW = 0.35;
/** The viking world's ice spikes: how much less often than the Greek bolts they come, their reach, how long
   they chill, and how long they stay up after striking. */
export const ICICLE_EVERY = 1.25;
export const ICICLE_STAY = 0.6;
export const ICICLE_R = 30;
const ICICLE_CHILL = 1.2;
/** Brynhild's rows of ice spikes: how many a row, where the first breaks out past her, how far apart, the first's
    warning and how much later each next one comes. */
const ICE_ROW = { count: 7, from: 22, gap: 34, warn: 0.45, step: 0.07, r: 19, spread: 0.55 };

function hurtPlayer(g: Game, amount: number, from?: string, fire = false) {
  const p = g.player;
  if (p.inv > 0 || g.phase !== 'play' || g.showcase) return;
  // Lag: now and then the hit simply never arrives.
  if (g.skills.dodge && Math.random() < ARCHERO.dodge * g.skills.dodge) {
    p.inv = 0.3;
    // Glitch afterimages trailing behind the hero, the way it is going.
    g.fx.push({ kind: 'pic', pic: 'lag-trail', top: true, x: p.x - Math.cos(p.heading) * 10, y: p.y - Math.sin(p.heading) * 10, r: 28, a: p.heading, life: 0.4, max: 0.4 });
    g.events.push('dodge');
    return;
  }
  if (fire) p.burn = 1.2;
  const status = from ? BOSS_STATUS[from] : undefined;
  // Being stopped dead (Zeus's stun, the Medusa's stone) has a cooldown: after one ends you are free for PARA_FREE
  // seconds, so a string of hits can't keep you frozen.
  const holds = status && (status[0] === 'stun' || status[0] === 'stone');
  if (status && (!holds || p.paraCd <= 0)) {
    p[status[0]] = Math.max(p[status[0]], status[1]);
    if (holds) p.paraCd = status[1] + PARA_FREE;
    g.events.push(status[0]);
  }
  // The exo-bracer stacks on the worn armour.
  p.hp -= Math.max(1, Math.round(amount * (1 - Math.min(0.7, g.loadout.armor + 0.07 * g.skills.bracer))));
  p.inv = 0.7;
  p.ouch = 0.3;
  g.shake = Math.max(g.shake, 0.25);
  g.events.push('hurt');
  burst(g, p.x, p.y, '#ff8080', 10, 120, 3);
  if (p.hp <= 0) {
    if (g.revives > 0) {
      // The phoenix feather: back on your feet with half your health, a firebird rising off you.
      g.revives -= 1;
      g.fx.push({ kind: 'phoenix', x: p.x, y: p.y, r: 70, a: 0, life: 1.6, max: 1.6 });
      standUp(g, g.loadout.reviveHp);
      return;
    }
    p.hp = 0;
    g.phase = 'over';
  }
}

/** Back on your feet with half your health, the bugs shoved away. */
function standUp(g: Game, share = 0.5) {
  const p = g.player;
  p.hp = Math.round(p.maxHp * share);
  p.inv = 2;
  g.orbs = [];
  g.bossTrail = [];
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

/** Watching an ad gets you up once a run, before any coin revive, and does not count as one. */
export const canAdRevive = (g: Game) => g.phase === 'over' && !g.adRevived && !g.reviveDeclined;
export function adRevive(g: Game) {
  if (!canAdRevive(g)) return false;
  g.adRevived = true;
  g.phase = 'play';
  standUp(g);
  return true;
}
/** On call: once a shift, an ad buys one more reroll when the two are spent. */
export const canAdReroll = (g: Game) => g.phase === 'levelup' && g.rerolls <= 0 && !g.adRerolled;
export function adReroll(g: Game) {
  if (!canAdReroll(g)) return false;
  g.adRerolled = true;
  g.rerolls += 1;
  return rerollChoices(g);
}

/** Sparks, bolts and effects run on and fade: every frame of play, and after the run ends (the page calls it
    then), so the last hit's sparks don't hang frozen on the fallen hero. Shots and orbs in the air go at once. */
export function settleEffects(g: Game, dt: number) {
  if (g.phase === 'over' || g.phase === 'won') {
    g.shots = [];
    g.orbs = [];
    g.bossTrail = [];
  }
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
  e.pain = Math.max(0, e.pain - dt);
  e.painCd = Math.max(0, e.painCd - dt);
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
  e.paraCd = Math.max(0, e.paraCd - dt);
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
    // The big ones pounce: close enough, they crouch for a moment (their wind-up frame) and then hurl themselves
    // at where you stood (their attack frame), so their attack shows; they still hurt only on contact.
    if (e.kind === 'legacy') {
      e.cd -= dt;
      if (e.aim > 0) {
        e.aim -= dt;
        mx = 0; my = 0;
        if (e.aim <= 0) { e.dash = POUNCE.dash; e.dir = { x: ux, y: uy }; }
      } else if (e.dash > 0) {
        e.dash -= dt;
        mx = e.dir.x * POUNCE.speed; my = e.dir.y * POUNCE.speed;
        if (e.dash <= 0) e.cd = rand(POUNCE.every[0], POUNCE.every[1]);
      } else if (e.cd <= 0 && d < POUNCE.reach && d > e.r + p.r + 6 && !blocked(e, p, g.obstacles)) {
        e.aim = POUNCE.aim;
      }
    }
  } else if (e.kind === 'ticket') {
    // Keeps its distance and throws a ticket at you every couple of seconds.
    if (blocked(e, p, g.obstacles)) { mx = -uy * e.side; my = ux * e.side; } // step out for a clear shot
    else if (d < 150) { mx = -ux; my = -uy; } else if (d > 220) { mx = ux; my = uy; } else { mx = -uy * 0.6; my = ux * 0.6; }
    if (e.rooted) { mx = 0; my = 0; }
    e.cd -= dt;
    if (e.cd <= 0) {
      e.cd = rand(1.8, 2.6);
      // The mud world's bats spit a ball of venom.
      const bat = e.look === 'mud';
      g.orbs.push({ x: e.x, y: e.y, vx: ux * 150, vy: uy * 150, r: 6, dmg: e.dmg, life: 4, bounce: g.hazard === 'bouncy' ? 1 : 0, ...(bat ? { tone: '#a3e635', pic: 'venom' as const } : {}) });
    }
  } else if (e.kind === 'boss') {
    // Everything the boss fires or casts this frame is marked as its own.
    const orbs0 = g.orbs.length;
    const threats0 = g.threats.length;
    updateBoss(g, e, dt, ux, uy);
    for (let i = orbs0; i < g.orbs.length; i++) g.orbs[i].from ??= e.bossId;
    for (let i = threats0; i < g.threats.length; i++) g.threats[i].from ??= e.bossId;
    // The Medusa's attacks take her colour: purple, then turquoise once her snakes turn green.
    if (e.bossId === 'medusa') {
      const alt = e.phase > 1;
      for (let i = orbs0; i < g.orbs.length; i++) if (g.orbs[i].pic === 'medusa') { g.orbs[i].alt = alt; g.orbs[i].tone = alt ? '#2dd4bf' : '#c084fc'; }
      for (let i = threats0; i < g.threats.length; i++) g.threats[i].alt = alt;
    }
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
  // A step per frame, faster the faster it walks (small bugs scurry, legacy code plods); nothing when it stands.
  const pace = Math.hypot(mx, my) * e.speed * slowFactor;
  if (pace > 4) e.step += clamp(pace / (e.r * 0.7), 3.5, 9) * dt;
  // Barely moved although it wanted to: a rack (or a wall, mid-detour) is in
  // the way. Go round it, trying the other side each time it gets stuck.
  if (e.kind !== 'boss' && want > 0.2 && Math.hypot(e.x - fromX, e.y - fromY) < want * 0.35) {
    if (e.detour > 0) e.side = -e.side;
    else if (blocked(e, p, g.obstacles)) e.detour = 2.5;
  }

  const gap = Math.hypot(p.x - e.x, p.y - e.y);
  // Close by, it swings at you, so its attack shows; it still hurts only on contact.
  e.swing = e.kind !== 'boss' && gap < p.r + e.r + ATTACK_REACH ? e.swing + dt : 0;
  if (gap < p.r + e.r - 2) hurtPlayer(g, e.dmg, e.kind === 'boss' ? e.bossId : undefined);
}
/** The big ones' pounce: within `reach` they crouch for `aim` seconds, then hurl themselves at `speed` times their
    pace for `dash` seconds, every 3–4.5 s. */
const POUNCE = { reach: 140, aim: 0.45, dash: 0.32, speed: 6, every: [3, 4.5] as const };
/** How far past touching an enemy starts its attack animation, and how long one swing (wind-up and hit) takes. */
export const ATTACK_REACH = 30;
export const ATTACK_CYCLE = 0.55;

/* ------------------------------------------------------------------ bosses */

/**
 * Two bosses a world. The one in room 6 (the first on call) is the world's cast boss with the usual kit
 * (a ring of orbs, a charge, bugs for backup) plus one move of its world (`MID_MOVE`). The final one in
 * room 12 (the second on call) is a boss of its own (`FINAL_BOSS`), bigger, faster at all of that, with its
 * world's move too, its signature attack (`SIGNATURE`) and a fury under half health that speeds it all up.
 * Moves go by world, not by the cast the picker forces, so the robots' world always has the laser.
 */
export const FINAL_BOSS = ['kernel', 'archdemon', 'drakkar', 'medusa', 'queen', 'zeus', 'mech', 'wraith', 'chimera'] as const;
/** The water world's final boss is a Viking longship with its captain at the helm; at half health the ship
    breaks up and the captain, Valdur, fights on alone: smaller, much faster, leaping and charging in a frenzy. */
export type FinalBoss = (typeof FINAL_BOSS)[number] | 'valdur';
type Move = 'volley' | 'breath' | 'geysers' | 'icerows' | 'mudball' | 'leap' | 'javelins' | 'missiles' | 'blink' | 'acid';
type Signature = 'tornado' | 'spiral' | 'meteors' | 'tide' | 'sigils' | 'roots' | 'grid' | 'laser' | 'clones' | 'frenzy';
const MID_MOVE: Move[] = ['volley', 'breath', 'geysers', 'mudball', 'leap', 'javelins', 'missiles', 'blink'];
const SIGNATURE: Signature[] = ['spiral', 'meteors', 'tide', 'sigils', 'roots', 'grid', 'laser', 'clones'];
/** The last world mixes them: a random move each time, and the signatures of the worlds before it (but the first) in turn. */
/** On call: how often every boss leaps at you, on top of its own move. */
const HORDE_LEAP = 9;
const moveOf = (g: Game, e: Enemy): Move =>
  // Kratos: his blades sweep fire in front of him (the demons' breath); his signature is the fire world's meteors.
  e.bossId === 'kratos' ? (e.phase > 1 ? 'javelins' : 'breath') : e.bossId === 'viking' ? 'icerows' : e.bossId === 'valdur' ? 'leap' : e.bossId === 'queen' ? 'acid' : g.world < WORLD_COUNT ? MID_MOVE[g.world - 1]
  // Nocthrax: the Treant's vanishing leap half the time (the owner's favourite), any other move otherwise.
  : e.bossId === 'chimera' && !e.clone && Math.random() < 0.5 ? 'leap' : MID_MOVE[Math.floor(Math.random() * MID_MOVE.length)];
const signatureOf = (g: Game, e: Enemy): Signature =>
  e.bossId === 'kratos' ? (e.phase > 1 ? 'grid' : 'meteors') : e.bossId === 'valdur' ? 'frenzy' : g.world < WORLD_COUNT ? SIGNATURE[g.world - 1]
  // Nocthrax: its own dark tornadoes every other time, the other worlds' signatures in between.
  : e.bossId === 'chimera' && !e.clone && e.sigs % 2 === 0 ? 'tornado' : SIGNATURE[1 + (Math.floor(e.sigs / 2) % (SIGNATURE.length - 1))];

/** The longship breaks up at half health: wreckage, water on the floor, and Valdur leaps out of it. */
/** Below this share of its health the final boss goes into its last stand. */
export const RAGE_AT = 0.2;
/* Its walk goes from 0.6 to 1.8 of its speed, never faster than 120 (the hero runs at 150),
   its charges are a third faster and it aims for less time. */
const RAGE_WALK = 1.8;
const RAGE_TOP = 120;
/** Nocthrax at half health: it rises into the air, 30% bigger (its phase-2 sheet). */
function takeWing(g: Game, e: Enemy) {
  e.phase = 2;
  e.r = Math.round(e.r * 1.3);
  g.shake = Math.max(g.shake, 0.6);
  burst(g, e.x, e.y, '#e879f9', 30, 200, 3.5);
  g.events.push('phase');
}

function enrage(g: Game, e: Enemy) {
  e.rage = true;
  // Nocthrax's final form: wings fully spread, 40% bigger again.
  if (e.bossId === 'chimera' && e.phase === 2) { e.phase = 3; e.r = Math.round(e.r * 1.4); g.events.push('phase'); }
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
const TONE: Record<ThreatEl, string> = { fire: '#fb923c', water: '#38bdf8', mud: '#a16207', arcane: '#c026d3', leaf: '#4ade80', bolt: '#facc15', laser: '#f87171', shadow: '#a78bfa', glitch: '#c084fc' };

/** A spot inside the room (or the visible field), `m` from its edges. */
function inside(g: Game, v: Vec, m: number): Vec {
  const b = bounds(g);
  return { x: clamp(v.x, b.x + m, b.x + b.w - m), y: clamp(v.y, b.y + m, b.y + b.h - m) };
}
/** The final bosses' rings fly as their element's weapon pictures (the cast bosses keep the plain orbs). */
const RING_PIC: Partial<Record<string, OrbPic>> = { nightmare: 'ember', mud: 'mudball', medusa: 'medusa', archdemon: 'fireball', kratos: 'fireball', kratos2: 'bolt', drakkar: 'water', valdur: 'water', queen: 'leaf', zeus: 'bolt', mech: 'spark', wraith: 'ghost' };
/** Rings in a colour of their own (glow and track); the rest are the usual red. The Lich's embers are purple. */
const RING_TONE: Partial<Record<string, string>> = { nightmare: '#a855f7' };
const ring = (g: Game, e: Enemy, n: number, speed: number, tone = '', turn = rand(0, Math.PI * 2), pic?: OrbPic) => {
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * Math.PI * 2;
    g.orbs.push({ x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 7, dmg: Math.round(e.dmg * 0.64), life: 5, bounce: g.hazard === 'bouncy' ? 1 : 0, tone, pic });
  }
};
const circle = (g: Game, at: Vec, r: number, warn: number, dmg: number, el: ThreatEl, after?: Threat['after']) =>
  g.threats.push({ kind: 'circle', x: at.x, y: at.y, r, a: 0, len: 0, warn, max: warn, life: 0.2, dmg, el, after });

/** The smaller bosses: one more with each sprint mastery up to `most`, every `every` seconds, a share of the final boss's health. */
const MINION = { most: 2, every: 14, r: 26, hp: 0.15 };
/** The Jarls the Drakkar and Valdur call to their side (the viking cast's old boss, now that the room-6 boss is the Valkyrie). */
const JARLS = { most: 2, every: 12, r: 22, hp: 0.08 };
/** The Queen's plants: two at a time every `every` seconds (sooner in her fury), at most `most` up at once. */
const PLANTS = { each: 2, every: 9, most: 4 };

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
    ring(g, e, final ? 14 : 10, final ? 120 : 105, RING_TONE[e.bossId] ?? '', undefined, RING_PIC[e.bossId === 'kratos' && e.phase > 1 ? 'kratos2' : e.bossId]);
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
  // The Carnivorous Queen grows spitting plants round you (rooted tickets of the jungle cast), a few at a time.
  if (e.bossId === 'queen') {
    e.grow -= dt;
    const plants = g.enemies.filter((m) => m.rooted && !m.dead).length;
    if (e.grow <= 0 && plants < PLANTS.most) {
      e.grow = PLANTS.every * fury;
      const a0 = rand(0, Math.PI * 2);
      for (let i = 0; i < PLANTS.each && plants + i < PLANTS.most; i++) {
        // Spread round you, not in a clump.
        const a = a0 + (i * Math.PI * 2) / PLANTS.each + rand(-0.4, 0.4);
        const at = inside(g, { x: g.player.x + Math.cos(a) * rand(120, 180), y: g.player.y + Math.sin(a) * rand(120, 180) }, 30);
        const m = makeEnemy(g, 'ticket', g.room, at, 0.8);
        Object.assign(m, { look: 'jungle' as Look, rooted: true, cd: rand(1, 2) });
        m.hp = m.maxHp = Math.round(m.maxHp * 0.8);
        g.enemies.push(m);
      }
      if (plants === 0) g.events.push('plants');
    }
  }
  // With a sprint mastery, a sprint's final boss calls smaller bosses of its world's cast to its side; the
  // Drakkar (and Valdur after it) always calls Jarls, in both modes, smaller still.
  const jarls = e.bossId === 'drakkar' || e.bossId === 'valdur';
  const most = jarls ? Math.max(JARLS.most, Math.min(MINION.most, g.loadout.sprintMastery)) : g.mode === 'sprints' ? Math.min(MINION.most, g.loadout.sprintMastery) : 0;
  if (final && most > 0) {
    e.ttl -= dt;
    const out = g.enemies.filter((m) => m.minion && !m.dead).length;
    if (e.ttl <= 0 && out < most) {
      e.ttl = (jarls ? JARLS.every : MINION.every) * fury;
      const side = Math.random() < 0.5 ? -1 : 1;
      const near = { x: e.x + side * 90, y: e.y + 40 };
      const at = g.mode === 'sprints' ? { x: clamp(near.x, WALL + 30, W - WALL - 30), y: clamp(near.y, WALL + 30, H - WALL - 30) } : near;
      const m = makeEnemy(g, 'boss', g.room, at, 0.9);
      Object.assign(m, { final: false, minion: true, bossId: e.look, r: jarls ? JARLS.r : MINION.r, cd: rand(1.5, 2.5), cd4: rand(3, 5) });
      m.hp = m.maxHp = Math.round(e.maxHp * (jarls ? JARLS.hp : MINION.hp));
      m.dmg = Math.round(e.dmg * 0.7);
      g.enemies.push(m);
      g.events.push('minion');
    }
  }
  // Calls for backup (on call, only while the field has room; never a called boss).
  e.cd3 -= dt;
  if (!e.minion && e.cd3 <= 0 && (g.mode === 'sprints' || g.enemies.length < 56)) {
    e.cd3 = (final ? 8 : 10) * fury;
    for (const side of [-1, 1]) {
      g.enemies.push(makeEnemy(g, 'bug', g.room, { x: g.mode === 'horde' ? e.x + side * 60 : clamp(e.x + side * 60, 40, W - 40), y: e.y + 30 }, 0.6));
    }
  }
  if (e.dash > 0 || e.aim > 0) return;
  // On call every boss also leaps at you now and then, the Treant's leap, on its own clock (not the clones, the
  // bosses it calls, or the Drakkar's longship; the ones whose own move is the leap already do it).
  if (g.mode === 'horde' && !e.clone && !e.minion && e.bossId !== 'drakkar' && moveOf(g, e) !== 'leap') {
    e.leapCd -= dt;
    if (e.leapCd <= 0) {
      e.leapCd = HORDE_LEAP * fury;
      worldMove(g, e, 'leap');
      return;
    }
  }
  // The world's move.
  e.cd4 -= dt;
  if (e.cd4 <= 0) {
    e.cd4 = (final ? 6.5 : 5.5) * fury;
    worldMove(g, e, moveOf(g, e));
    if (e.spawn > 0 || e.chan > 0) return;
  }
  // The weapon its world puts on sale, thrown now and then, so winning it means something.
  if (final && !e.clone && ARMOURY[e.bossId]) {
    e.armCd -= dt;
    if (e.armCd <= 0) {
      e.armCd = 7.5 * fury;
      ARMOURY[e.bossId]!(g, e, Math.round(e.dmg * 0.8));
    }
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
      // Fire breath: a cone of flames at you, six of them with gaps wide enough to weave through
      // (nine in a narrower cone left no way out once their tracks were added).
      for (let i = 0; i < 6; i++) {
        const a = aim + (i / 5 - 0.5) * 1.25;
        const speed = i % 2 ? 165 : 135;
        g.orbs.push({ x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 7, dmg, life: 3, bounce: 0, tone: TONE.fire, pic: 'fireball' });
      }
      break;
    case 'icerows': {
      e.pose = 0.9;
      // Brynhild stabs her spear into the floor and ice spikes break out of it in three rows towards you, one
      // after another outwards (like the Queen's vines), each the vikings' own spike that hurts and chills.
      for (const off of [-ICE_ROW.spread, 0, ICE_ROW.spread]) {
        for (let i = 0; i < ICE_ROW.count; i++) {
          const d = e.r + ICE_ROW.from + i * ICE_ROW.gap;
          const at = { x: e.x + Math.cos(aim + off) * d, y: e.y + Math.sin(aim + off) * d };
          if (g.mode === 'sprints' && (at.x < WALL + 20 || at.x > W - WALL - 20 || at.y < WALL + 20 || at.y > H - WALL - 20)) break;
          g.strikes.push({ x: at.x, y: at.y, t: ICE_ROW.warn + i * ICE_ROW.step, ice: true, dmg, boss: true, r: ICE_ROW.r });
        }
      }
      break;
    }
    case 'geysers': {
      // Geysers burst under you, then along the way you were going.
      const step = p.moving ? { x: Math.cos(p.heading) * 55, y: Math.sin(p.heading) * 55 } : { x: 0, y: 0 };
      for (let i = 0; i < 3; i++) circle(g, inside(g, { x: p.x + step.x * i, y: p.y + step.y * i }, 30), 30, 0.9 + i * 0.3, dmg, 'water');
      break;
    }
    case 'mudball':
      // Mud balls lobbed onto you and round you: each one splashes where it lands and leaves a puddle a while.
      for (let i = 0; i < 3; i++) {
        const a = rand(0, Math.PI * 2);
        const at = i === 0 ? p : { x: p.x + Math.cos(a) * rand(50, 90), y: p.y + Math.sin(a) * rand(50, 90) };
        circle(g, inside(g, at, 30), 30, 0.9 + i * 0.2, dmg, 'mud', 'puddle');
      }
      break;
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
    case 'tornado': {
      // Dark tornadoes: vortices open round you, rise after a moment and chase you, slowly, for a while
      // (two, three or four by its phase).
      const n = 1 + e.phase;
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2);
        const at = inside(g, { x: p.x + Math.cos(a) * rand(130, 200), y: p.y + Math.sin(a) * rand(130, 200) }, 30);
        const v = Math.atan2(p.y - at.y, p.x - at.x);
        g.orbs.push({ x: at.x, y: at.y, vx: Math.cos(v) * 70, vy: Math.sin(v) * 70, r: 22, dmg, life: 6.5, bounce: 0, tone: '#e879f9', home: 6.5, pic: 'tornado', wait: 0.9 + i * 0.15, from: e.bossId });
      }
      break;
    }
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
      g.threats.push({ kind: 'wave', x: b.x + b.w / 2, y: down ? b.y : b.y + b.h, r: 16, a: down ? Math.PI / 2 : -Math.PI / 2, len: b.w / 2, warn: 1, max: 1, life: 99, dmg, el: 'water', speed: 170, done: 0, gap, gapW: 38, span: b.h });
      if (e.hp < e.maxHp / 2) {
        const right = p.x > e.x;
        g.threats.push({ kind: 'wave', x: right ? b.x : b.x + b.w, y: b.y + b.h / 2, r: 16, a: right ? 0 : Math.PI, len: b.h / 2, warn: 2.4, max: 2.4, life: 99, dmg, el: 'water', speed: 150, done: 0, gap: rand(-b.h / 2 + 60, b.h / 2 - 60), gapW: 42, span: b.w });
      }
      break;
    }
    case 'sigils': {
      // The Medusa's gaze: magic circles open on you and round you, then burst; caught in one, you are turned to stone a moment.
      const n = e.hp < e.maxHp / 2 ? 6 : 5;
      const turn = rand(0, Math.PI * 2);
      for (let i = 0; i < n; i++) {
        const a = turn + (i / (n - 1)) * Math.PI * 2;
        const at = i === 0 ? p : { x: p.x + Math.cos(a) * 105, y: p.y + Math.sin(a) * 105 };
        circle(g, inside(g, at, 34), 34, 1.1 + i * 0.08, dmg, 'arcane');
      }
      break;
    }
    case 'roots': {
      // Three rows of thorny vine burst out of the floor towards you (the owner's vine rows), warned as
      // strips, and stay a moment as walls of thorns.
      const aim = Math.atan2(p.y - e.y, p.x - e.x);
      for (const [i, off] of [-0.4, 0, 0.4].entries()) {
        g.threats.push({ kind: 'line', x: e.x + Math.cos(aim + off) * 30, y: e.y + Math.sin(aim + off) * 30, r: 16, a: aim + off, len: 280, warn: 0.9 + i * 0.08, max: 0.9 + i * 0.08, life: 0.25, dmg: Math.round(dmg * 0.8), el: 'leaf', vine: i % 2 });
      }
      break;
    }
    case 'grid': {
      // The storm grid: three bolts across the room, then three down it (blue when Zeus casts it).
      const blue = e.bossId === 'zeus' || e.bossId === 'kratos';
      for (const [i, dy] of [-110, 0, 110].entries()) {
        const y = clamp(p.y + dy, b.y + 14, b.y + b.h - 14);
        g.threats.push({ kind: 'line', x: b.x, y, r: 12, a: 0, len: b.w, warn: 1 + i * 0.05, max: 1, life: 0.2, dmg, el: 'bolt', blue });
      }
      for (const [i, dx] of [-95, 0, 95].entries()) {
        const x = clamp(p.x + dx, b.x + 14, b.x + b.w - 14);
        g.threats.push({ kind: 'line', x, y: b.y, r: 12, a: Math.PI / 2, len: b.h, warn: 2 + i * 0.05, max: 2, life: 0.2, dmg, el: 'bolt', blue });
      }
      break;
    }
    case 'laser': {
      // Two lasers from the chest, aimed at you, then sweeping round while it stands.
      const aim = Math.atan2(p.y - e.y, p.x - e.x);
      const spin = (Math.random() < 0.5 ? -1 : 1) * 0.95;
      for (const off of [0, Math.PI]) g.threats.push({ kind: 'beam', x: e.x, y: e.y, r: 9, a: aim + off, len: 760, warn: 1, max: 1, life: 3.4, dmg, el: 'laser', spin, owner: e.id });
      // …and fuel barrels lobbed onto you while they sweep, the arsenal's Fuel Barrel: each bursts into a pool of fire.
      fuelBarrels(g, 3, dmg);
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
/** What each boss's leap lands in: its element, the picture on the floor, and the shots it throws out (by bossId:
    the cast bosses go by their look, the final bosses by their own id). */
const LANDING: Record<string, { el: ThreatEl; fx: string; pic?: OrbPic; tone?: string }> = {
  jungle: { el: 'leaf', fx: 'slam', pic: 'leaf' }, queen: { el: 'leaf', fx: 'slam', pic: 'acid' },
  viking: { el: 'water', fx: 'shock-ring', pic: 'water' }, drakkar: { el: 'water', fx: 'shock-ring', pic: 'water' }, valdur: { el: 'water', fx: 'shock-ring', pic: 'water' },
  demon: { el: 'fire', fx: 'boom-big', pic: 'fireball' }, archdemon: { el: 'fire', fx: 'boom-big', pic: 'fireball' }, kratos: { el: 'fire', fx: 'boom-big', pic: 'fireball' }, chimera: { el: 'fire', fx: 'boom-big', pic: 'ember', tone: '#e879f9' },
  greek: { el: 'bolt', fx: 'volt-burst', pic: 'bolt' }, zeus: { el: 'bolt', fx: 'volt-burst', pic: 'bolt' },
  robot: { el: 'fire', fx: 'impact', pic: 'rocket', tone: '#fb923c' }, mech: { el: 'fire', fx: 'boom-big', pic: 'shark', tone: '#fb923c' },
  nightmare: { el: 'shadow', fx: 'spectral-bolt', pic: 'ember', tone: '#a855f7' }, wraith: { el: 'shadow', fx: 'spectral-bolt', pic: 'ghost' },
  mud: { el: 'mud', fx: 'mud-splat', pic: 'mudball' }, medusa: { el: 'arcane', fx: 'medusa-burst', pic: 'medusa' },
  original: { el: 'glitch', fx: 'impact' }, kernel: { el: 'glitch', fx: 'impact' },
};
/** Fuel barrels lobbed onto the hero and round them: warned circles, a barrel tumbling down onto each, then a burst
    of fire and a pool of burning fuel left a while (the molotov's evolution, which the Mech's world sells). */
/** Some final bosses throw the weapon their world's victory puts on sale in the arsenal. */
const ARMOURY: Partial<Record<string, (g: Game, e: Enemy, dmg: number) => void>> = {
  // The Kernel Panic drops legacy bricks onto you: warned circles, a brick falling onto each.
  kernel: (g, _e, dmg) => lobbed(g, 4, dmg, 26, 'glitch', 'brick'),
  // The Archdemon lobs molotovs that leave fire.
  archdemon: (g, _e, dmg) => lobbed(g, 3, dmg, 30, 'fire', 'molotov', 'lava'),
  // The Drakkar sows blue electric mines round you: each goes off after a while, or at once if you step on it.
  drakkar: (g, _e, dmg) => {
    const p = g.player;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + rand(-0.4, 0.4);
      const at = inside(g, { x: p.x + Math.cos(a) * rand(60, 120), y: p.y + Math.sin(a) * rand(60, 120) }, 30);
      const t = circle(g, at, 32, 3.2 + i * 0.3, dmg, 'bolt');
      Object.assign(g.threats[t - 1], { mine: true, blue: true });
    }
  },
  // The Carnivorous Queen spits spiky durians that bounce off the walls a while.
  queen: (g, e, dmg) => {
    const aim = Math.atan2(g.player.y - e.y, g.player.x - e.x);
    for (const off of [-0.45, 0, 0.45]) g.orbs.push({ x: e.x, y: e.y, vx: Math.cos(aim + off) * 120, vy: Math.sin(aim + off) * 120, r: 12, dmg, life: 4.5, bounce: 2, tone: '#a3e635', pic: 'durian' });
  },
};
/** Things lobbed onto the hero and round them: warned circles, the thing tumbling down onto each. */
function lobbed(g: Game, n: number, dmg: number, r: number, el: ThreatEl, lob: Threat['lob'], after?: Threat['after']) {
  const p = g.player;
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    const at = i === 0 ? p : { x: p.x + Math.cos(a) * rand(50, 100), y: p.y + Math.sin(a) * rand(50, 100) };
    const t = circle(g, inside(g, at, r + 4), r, 1.1 + i * 0.22, dmg, el, after);
    g.threats[t - 1].lob = lob;
  }
}
function fuelBarrels(g: Game, n: number, dmg: number) {
  const p = g.player;
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    const at = i === 0 ? p : { x: p.x + Math.cos(a) * rand(55, 100), y: p.y + Math.sin(a) * rand(55, 100) };
    const t = circle(g, inside(g, at, 34), 34, 1.1 + i * 0.25, dmg, 'fire', 'lava');
    g.threats[t - 1].lob = 'barrel';
  }
}
function bossLands(g: Game, e: Enemy) {
  const orbs0 = g.orbs.length;
  const threats0 = g.threats.length;
  landing(g, e);
  // what it threw out on landing is its own, like its other shots (its track, its status, the Medusa's colour)
  for (let i = orbs0; i < g.orbs.length; i++) { g.orbs[i].from ??= e.bossId; if (e.bossId === 'medusa' && e.phase > 1) { g.orbs[i].alt = true; g.orbs[i].tone = '#2dd4bf'; } }
  for (let i = threats0; i < g.threats.length; i++) { g.threats[i].from ??= e.bossId; if (e.bossId === 'medusa' && e.phase > 1) g.threats[i].alt = true; }
}
function landing(g: Game, e: Enemy) {
  const what = e.land;
  e.land = '';
  e.vanish = false;
  if (what === 'slam') {
    // Each boss lands in its own element: its burst on the floor and its own shots flying out (the Treant's leaf
    // arrows were everyone's once every boss leapt on call).
    const land = LANDING[e.bossId === 'kratos' && e.phase > 1 ? 'zeus' : e.bossId] ?? LANDING.jungle;
    const el = land.el;
    circle(g, e, 66, 0, Math.round(e.dmg * 0.9), el);
    g.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 70, a: 0, life: 0.4, max: 0.4, big: true });
    g.fx.push({ kind: 'pic', pic: land.fx, x: e.x, y: e.y + e.r * 0.5, r: 80, a: 0, life: 0.45, max: 0.45 });
    g.shake = Math.max(g.shake, 0.35);
    if (e.bossId === 'mech') {
      // The Mech lands in a full volley of shark missiles: stronger than a ring, and they turn after you a moment.
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + rand(-0.1, 0.1);
        g.orbs.push({ x: e.x, y: e.y, vx: Math.cos(a) * 135, vy: Math.sin(a) * 135, r: 8, dmg: Math.round(e.dmg * 0.85), life: 5, bounce: 0, tone: '#fb923c', home: 1.4, pic: 'shark' });
      }
    } else ring(g, e, 8, 120, land.tone ?? TONE[el], undefined, land.pic);
    if (e.bossId === 'mech') fuelBarrels(g, 2, Math.round(e.dmg * 0.9));
    // Valdur roars as he lands.
    if (e.bossId === 'valdur') { e.pose = 0.6; e.act = 'move'; }
  } else {
    // Out of the shadows (the wraith and its clones alike rise out of them).
    if (e.bossId === 'wraith') { e.pose = 0.5; e.act = 'move'; }
    if (!e.clone) ring(g, e, 12, 100, TONE.shadow, undefined, 'ghost');
    g.fx.push({ kind: 'pic', pic: 'spectral-bolt', top: true, x: e.x, y: e.y - e.r * 0.3, r: e.r * 1.2, a: 0, life: 0.4, max: 0.4 });
  }
  burst(g, e.x, e.y, what !== 'slam' ? '#a78bfa' : (LANDING[e.bossId] ?? LANDING.jungle).tone ?? TONE[(LANDING[e.bossId] ?? LANDING.jungle).el], 20, 150, 3);
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
      // A mine goes off at once when you step on it (once armed, after its first half second).
      if (t.mine && t.max - t.warn > 0.5 && dist(t, p) < t.r * 0.6 + p.r * 0.5) t.warn = 0;
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
    if (t.dmg > 0 && touches(t, p, p.r * 0.6)) hurtPlayer(g, t.dmg, t.from, t.el === 'fire');
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

/** How long a vine row stays as a wall of thorns. */
const VINE_LIFE = 2.5;

/** The moment a warning runs out: the flash, and what it leaves behind. */
function threatHits(g: Game, t: Threat) {
  if (t.kind === 'circle') {
    if (t.el === 'fire') g.fx.push({ kind: 'boom', x: t.x, y: t.y, r: t.r, a: 0, life: 0.35, max: 0.35 });
    else burst(g, t.x, t.y, TONE[t.el], 12, 140, 3);
    // Geysers burst as the steam cloud; roots leave the caltrops' spikes.
    if (t.el === 'water' && t.r < 40) g.fx.push({ kind: 'pic', pic: 'steam-cloud', top: true, x: t.x, y: t.y, r: t.r * 1.6, a: rand(0, 6), life: 0.5, max: 0.5 });
    if (t.el === 'leaf' && t.after) g.fx.push({ kind: 'pic', pic: 'caltrops', x: t.x, y: t.y, r: t.r * 1.2, a: rand(0, 6), life: 2.5, max: 2.5 });
    // Mud balls splash and leave a puddle; the Medusa's sigils burst in purple.
    if (t.mine) g.fx.push({ kind: 'pic', pic: 'volt-burst', top: true, x: t.x, y: t.y, r: t.r * 1.5, a: rand(0, 6), life: 0.45, max: 0.45 });
    if (t.lob === 'brick') g.fx.push({ kind: 'pic', pic: 'impact', top: true, x: t.x, y: t.y, r: t.r * 1.1, a: rand(0, 6), life: 0.4, max: 0.4 });
    if (t.el === 'mud') g.fx.push({ kind: 'pic', pic: 'mud-splat', x: t.x, y: t.y, r: t.r * 1.5, a: 0, life: 0.6, max: 0.6 });
    if (t.el === 'arcane') g.fx.push({ kind: 'pic', pic: t.alt ? 'medusa-burst-2' : 'medusa-burst', top: true, x: t.x, y: t.y, r: t.r * 1.6, a: 0, life: 0.45, max: 0.45 });
    if (t.after) g.hazards.push({ kind: t.after, x: t.x, y: t.y, r: t.after === 'lava' ? 26 : t.after === 'puddle' ? 30 : 16, ttl: t.after === 'lava' ? 4 : t.after === 'puddle' ? 5 : 2.5 });
    if (t.el === 'fire') g.events.push('boom');
  } else if (t.shot) {
    // A javelin: the bolt itself flies down the line it warned.
    g.orbs.push({ x: t.x, y: t.y, vx: Math.cos(t.a) * 430, vy: Math.sin(t.a) * 430, r: 7, dmg: t.dmg, life: 2, bounce: 0, tone: TONE.bolt, pic: t.shot, from: t.from });
    t.life = 0;
    t.dmg = 0;
  } else if (t.kind === 'line' && t.vine !== undefined) {
    // The vine grows along the line and stays a while as a wall of thorns (hidden hazards along it).
    const cx = t.x + Math.cos(t.a) * t.len / 2;
    const cy = t.y + Math.sin(t.a) * t.len / 2;
    g.fx.push({ kind: 'pic', pic: `vine-row-${t.vine}`, x: cx, y: cy, r: t.len / 2, a: t.a, life: VINE_LIFE, max: VINE_LIFE, vine: true });
    for (let d = 14; d < t.len; d += 26) {
      const at = { x: t.x + Math.cos(t.a) * d, y: t.y + Math.sin(t.a) * d };
      if (g.mode === 'sprints' && outside(g, at)) continue;
      g.hazards.push({ kind: 'thorns', x: at.x, y: at.y, r: 13, ttl: VINE_LIFE, hidden: true });
    }
  } else if (t.kind === 'line' && t.el === 'bolt') {
    const end = { x: t.x + Math.cos(t.a) * t.len, y: t.y + Math.sin(t.a) * t.len };
    g.zaps.push({ pts: zigzag(t, end, 10), life: 0.22, blue: t.blue });
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
  if (s.grav) {
    s.vy += s.grav * dt;
    const b = bounds(g);
    if (s.vy > 0 && s.y > b.y + b.h + 40) return false;
  }
  if (s.kind === 'brick' || s.kind === 'ball') s.spin += dt * 9;
  if (s.kind === 'molotov') s.spin += dt * 4.5;
  if (s.kind === 'durian' || s.kind === 'drill') s.spin += dt * 14;
  if (s.kind === 'rocket') {
    // Rockets speed up and steer after their own bug (the evolved missiles turn harder). The shark missiles once went
    // from 300 to 620 in under half a second and could hardly be seen: now they speed up gently and top out lower.
    const speed = Math.min(g.evolved.rocket ? 360 : 480, Math.hypot(s.vx, s.vy) * (1 + dt * 0.9));
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
  } else if (s.bow && s.kind === 'arrow' && fusionOf(g)) arrowTrail(g, s, dt, fusionOf(g) as Fusion);
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
    // A brick breaks on the bug it hits, with the impact burst; the 1-ton weight also stops that bug for a moment.
    if (s.kind === 'brick') {
      const iron = !!g.evolved.brick;
      if (iron) {
        paralyze(e, 0.6);
        g.shake = Math.max(g.shake, 0.08);
      }
      g.fx.push({ kind: 'pic', pic: 'impact', x: e.x, y: e.y + e.r * 0.3, r: iron ? 26 : 18, a: rand(0, 6), life: 0.45, max: 0.45, top: true });
      return false;
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
    hurtPlayer(g, h.kind === 'lava' ? 8 : 10, undefined, h.kind === 'lava');
    if (h.kind === 'lava' && Math.random() < 0.5) burst(g, p.x, p.y + p.r * 0.6, '#ff9a1f', 2, 60, 2.5);
  }
  // The viking world: ice spikes break out of the floor the same way, and chill you.
  const icy = g.hazard === 'ice';
  // The storm: a bolt aims near you, warns for a moment, then hits anything
  // in the circle, bugs included. (A boss's ice spikes come in any world, so the strikes below always run.)
  if (g.hazard === 'strike' || icy) g.strikeIn -= dt;
  if ((g.hazard === 'strike' || icy) && g.strikeIn <= 0) {
    g.strikeIn = g.mode === 'horde' ? Math.max(2.2, 4.5 - (g.time / 60) * 0.25) : Math.max(1.4, 3 - g.room * 0.12);
    if (icy) g.strikeIn *= ICICLE_EVERY;
    const a = rand(0, Math.PI * 2);
    const d = rand(0, 110);
    const at = { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d };
    if (g.mode === 'sprints') { at.x = clamp(at.x, WALL + 30, W - WALL - 30); at.y = clamp(at.y, WALL + 30, H - WALL - 30); }
    g.strikes.push({ x: at.x, y: at.y, t: 0.9, ice: icy || undefined });
  }
  g.strikes = g.strikes.filter((st) => {
    st.t -= dt;
    if (st.t > 0) return true;
    if (st.ice) {
      // Ice spikes break out of the floor: whoever stands on them is hurt and slowed for a moment,
      // and they stay up a little before they crumble.
      if (st.hit) return st.t > -ICICLE_STAY;
      st.hit = true;
      burst(g, st.x, st.y, '#e0f2fe', 16, 150, 3);
      burst(g, st.x, st.y, '#7dd3fc', 8, 90, 2.5);
      g.events.push('strike');
      if (dist(st, p) < (st.r ?? ICICLE_R) + p.r * 0.5 && p.inv <= 0 && g.phase === 'play') {
        hurtPlayer(g, st.dmg ?? 12);
        if (!g.showcase) p.chill = Math.max(p.chill, ICICLE_CHILL);
        g.events.push('chill');
      }
      if (!st.boss) for (const e of live(g)) if (dist(st, e) < ICICLE_R + e.r) hurt(g, e, 40);
      return true;
    }
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

/** Turn a run into the showcase: no skills (so no weapon, aura or companion is drawn), no level ups to pick. */
export function startShowcase(g: Game) {
  g.showcase = true;
  for (const s of SKILLS) g.skills[s] = 0;
  g.evolved = {};
  g.pendingLevels = 0;
  g.choices = [];
  g.volleys = [];
  g.spirits = [];
  g.shots = [];
}

/** The showcase's button: a quarter of the boss's health at once (its phases and last stand go off as they would),
    the backup bugs swept away with it. False when there is no boss to hit. */
export function showcaseHit(g: Game) {
  if (!g.showcase || g.phase !== 'play') return false;
  const boss = live(g).find((e) => e.kind === 'boss' && !e.clone && !e.minion && e.spawn <= 0 && !e.vanish);
  if (!boss) return false;
  showcaseBlow = true;
  hurt(g, boss, boss.maxHp * 0.25 + 1);
  showcaseBlow = false;
  burst(g, boss.x, boss.y, '#fde047', 20, 180, 3);
  return true;
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
  // A boss's hit: stunned you stand, chilled you walk slower, poisoned you lose a little health (never the last point).
  p.poison = Math.max(0, p.poison - dt);
  p.stun = Math.max(0, p.stun - dt);
  p.paraCd = Math.max(0, p.paraCd - dt);
  // The Medusa's gaze: it builds while you stay near her and turns you to stone when it is full.
  const medusa = g.enemies.find((e) => e.bossId === 'medusa' && !e.dead && !e.clone && e.spawn <= 0 && !e.vanish);
  // Hysteresis: the gaze takes you at `reach` and lets go only past `reach + out`, so at its edge it does not flicker.
  const gazed = !!medusa && dist(medusa, p) < GAZE.reach + medusa.r + (medusa.gaze ? GAZE.out : 0) && p.stone <= 0;
  if (medusa) medusa.gaze = gazed;
  p.gaze = gazed ? p.gaze + dt : Math.max(0, p.gaze - 2 * dt);
  // Full: it petrifies as soon as it can (not through a hit's blink, the cooldown after a hold or the showcase).
  if (p.gaze >= GAZE.hold) {
    p.gaze = GAZE.hold;
    if (p.paraCd <= 0 && p.inv <= 0 && !g.showcase) {
      p.gaze = 0;
      p.stone = GAZE.stone;
      p.paraCd = GAZE.stone + PARA_FREE;
      g.events.push('stone');
    }
  }
  p.chill = Math.max(0, p.chill - dt);
  p.dark = Math.max(0, p.dark - dt);
  p.stone = Math.max(0, p.stone - dt);
  p.mired = Math.max(0, p.mired - dt);
  p.burn = Math.max(0, p.burn - dt);
  p.safe = Math.max(0, p.safe - dt);
  if (p.poison > 0) p.hp = Math.max(1, p.hp - (POISON_DMG / 0.5) * dt);
  if (p.stun > 0 || p.stone > 0) p.moving = false;
  if (p.moving) {
    const k = Math.min(1, len) * (wading ? 0.55 : 1) * (p.chill > 0 || p.mired > 0 ? 1 - CHILL_SLOW : 1);
    const shoes = (1 + 0.1 * g.skills.shoes) * (g.skills.dwarf ? ARCHERO.dwarfSpeed : 1);
    p.x += (input.x / len) * k * p.speed * shoes * dt;
    p.y += (input.y / len) * k * p.speed * shoes * dt;
    p.face = Math.atan2(input.y, input.x);
    p.heading = p.face;
  }
  // The monolith's and the microservice's body (drawn by the radius too).
  p.r = g.skills.giant ? ARCHERO.giantR : g.skills.dwarf ? ARCHERO.dwarfR : 15;
  // Safe mode: invincible for a moment every so often, while there is something to fight.
  if (g.skills.safe && live(g).length) {
    g.safeCd -= dt;
    if (g.safeCd <= 0) {
      const lv = g.skills.safe;
      g.safeCd = ARCHERO.safeEvery - 2 * (lv - 1);
      p.inv = Math.max(p.inv, ARCHERO.safeFor + 0.5 * (lv - 1));
      p.safe = ARCHERO.safeFor + 0.5 * (lv - 1);
      g.events.push('safe');
    }
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
    // Boss Rush: on to the next boss, or the win after the last.
    if (g.rush) {
      if (g.rush >= g.stages) { g.coins += 50 * g.stages; g.phase = 'won'; return; }
      enterStage(g, g.rush + 1);
      return;
    }
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

  // The showcase: no weapons, auras or companions on the hero, and the bugs a boss calls gone at once (its clones,
  // helpers and the Queen's plants stay, they are part of it), so nothing covers the boss.
  if (g.showcase) g.enemies = g.enemies.filter((e) => e.kind === 'boss' || e.minion || e.clone || e.rooted);
  else useWeapons(g, dt);
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

  // Boss shots' tracks: they fade, and touching one hurts (with what that boss's hit leaves).
  g.bossTrail = g.bossTrail.filter((d) => {
    d.life -= dt;
    if (d.life <= 0) return false;
    if (d.life > 0.08 && Math.hypot(d.x - p.x, d.y - p.y) < d.r * (0.5 + 0.5 * d.life / d.max) + p.r * 0.5) hurtPlayer(g, d.dmg, d.from);
    return true;
  });
  g.orbs = g.orbs.filter((o) => {
    // A tornado still forming: a vortex on the floor, harmless, until it rises.
    if (o.wait && o.wait > 0) { o.wait -= dt; return true; }
    if (o.from && o.pic !== 'tornado') {
      o.trail = (o.trail ?? 0) - dt;
      if (o.trail <= 0 && g.bossTrail.length < BOSS_TRAIL.cap) {
        o.trail = BOSS_TRAIL.every;
        g.bossTrail.push({ x: o.x, y: o.y, r: o.r * 1.3, life: BOSS_TRAIL.life, max: BOSS_TRAIL.life, dmg: Math.max(1, Math.round(o.dmg * BOSS_TRAIL.share)), tone: o.tone || '#ff6b6b', from: o.from });
      }
    }
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
      hurtPlayer(g, o.dmg, o.from, o.pic === 'fireball' || o.tone === TONE.fire);
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
      e.blueFire = em.kind === 'wisp';
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

  settleEffects(g, dt);

  if (g.mode === 'horde') {
    // The last boss down: the shift is over.
    if (!g.endless && g.hordeBoss >= HORDE_BOSS_AT.length && !g.enemies.some((e) => e.kind === 'boss')) {
      g.coins += 50 * worldPay(g);
      g.phase = 'won';
      return;
    }
  } else if (!g.door && g.enemies.length === 0) {
    g.door = true;
    g.orbs = [];
    g.bossTrail = [];
    g.threats = [];
    g.fireballs = [];
    g.coins += 5 * worldPay(g);
    if (g.room === WHEEL_ROOM && !g.wheelUsed) g.wheelDoor = true;
    g.events.push('clear');
  }
  if (g.pendingLevels > 0 && g.phase === 'play') offerChoices(g);
}
