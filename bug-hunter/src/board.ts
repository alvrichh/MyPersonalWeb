import { WORLDS, type Look, type ThreatEl } from './world';
import { BOSS_CAST, bossKit, planBossCast, type BoardBossAttack, type BossPool, type BossShot } from './boardBoss';
export { bossKit } from './boardBoss';

/* «Sprint Planning», the board mode: an auto battler. Between fights you buy bugs from every cast,
   lay them on your half of the board and merge two of a kind into the next one up the cast (two bugs make a
   ticket, two tickets a legacy, two legacy a room-6 boss, two of those the world's final boss); then the fight
   with the round's enemy wave plays out on its own. Your hero watches from the lower right corner and the world's
   final boss, the rival, from the upper left: a round won throws a fireball at the rival, a round lost one back at
   you. Ten lives per commander; waves advance up to round ten, the room-6 boss in round 5 and the final boss in round 10; each world won opens its
   cast in the shop, and a later world's cast is stronger (and dearer) than an earlier one's. No DOM here, so it
   can be simulated in Node; drawn by `boardView.ts`. */

export const COLS = 6;
export const ROWS = 9;
export const CELL = 56;
export const ROUNDS = 10;
export const BOARD_W = COLS * CELL;
export const BOARD_H = ROWS * CELL;
export const LIVES = 10;
/** How long a fight may go on: the hero still standing then has held the board. */
export const FIGHT_TIME = 45;

/** The cast's steps, each made of two of the one before: five, and past the final boss one more for each phase it
    has in the game (two Drakkars make Valdur leaping out of the wreck, two Medusas her awakened form, two Nocthraxes
    its flight and two of those its final form). */
export type Tier = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const TIER_KIND = ['bug', 'ticket', 'legacy', 'boss', 'boss', 'boss', 'boss'] as const;
/** The final bosses' extra phases, by cast (world). */
export const FINAL_PHASES: Record<number, number> = { 3: 1, 4: 1, 9: 2 };
export const maxTier = (cast: number) => (4 + (FINAL_PHASES[cast] ?? 0)) as Tier;
/** What each step is worth in gold before its cast's strength (a sale gives half back). */
export const TIER_VALUE = [1, 2, 4, 8, 16, 32, 64];
const PRICE = [1, 3, 5];

type Stats = { hp: number; dmg: number; rate: number; range: number; speed: number; r: number; splash?: number; ranged?: boolean };
/** Each step's numbers: bugs bite, tickets throw from afar, legacy soaks hits, the bosses hit everything near.
    Each step's health × damage a second is four times the one before, what two units are worth against one. */
export const TIER_STATS: Stats[] = [
  { hp: 70, dmg: 9, rate: 1.1, range: 30, speed: 70, r: 13 },
  { hp: 130, dmg: 24, rate: 0.9, range: 150, speed: 55, r: 14, ranged: true },
  { hp: 560, dmg: 22, rate: 0.9, range: 34, speed: 45, r: 17 },
  { hp: 1400, dmg: 40, rate: 0.8, range: 40, speed: 48, r: 17, splash: 44 },
  { hp: 3600, dmg: 62, rate: 0.8, range: 50, speed: 44, r: 18, splash: 60 },
  { hp: 9000, dmg: 98, rate: 0.85, range: 55, speed: 46, r: 19, splash: 66 },
  { hp: 22000, dmg: 155, rate: 0.9, range: 60, speed: 48, r: 20, splash: 72 },
];
/** The final boss of each world (its art id, as in `world.ts`'s FINAL_BOSS). */
export const FINAL_ID = ['kernel', 'archdemon', 'drakkar', 'medusa', 'queen', 'zeus', 'mech', 'wraith', 'chimera'];
/** A cast's strength: health and damage ×(1 + `CAST.step` a world past the first); its price grows the same. */
export const CAST = { step: 0.25 };
export const castPower = (cast: number) => 1 + CAST.step * (cast - 1);
/** Units native to the selected world get a small, consistent combat bonus in either board variant. */
export const NATIVE_WORLD_BONUS = 0.15;
export const nativeWorldPower = (world: number, cast: number) => cast === world ? 1 + NATIVE_WORLD_BONUS : 1;
/** A unit's base strength follows the selected world; native units then receive their world bonus. */
export const unitPower = (b: { variant: Variant; world: number }, cast: number) => castPower(b.world) * nativeWorldPower(b.world, cast);
export const castLook = (cast: number) => (WORLDS[cast - 1].look === 'random' ? 'core' : WORLDS[cast - 1].look) as Look;

/** How strong the waves are against the gold you have had (×base in world 1, `world` more each world after), and
    how much tougher the enemy's units are than a cast's own each world past the first. */
export const WAVE = { base: 0.88, world: 0.05, tough: 0.012 };
/** Your half of the board: the lower four rows. */
export const WALL_ROW = 4;
export const HOME_ROW = WALL_ROW + 1;

/** Fusion needs two units of one world (five for the stronger gift); Tactics needs two different worlds:
    1 the Backlog +health, 2 fire burns, 3 ice slows, 4 mud takes less damage, 5 the jungle heals, 6 the Arena
    strikes faster, 7 the Forge's hits arc to one more, 8 the haunted servers dodge, 9 the Core hits harder.
    `v` is each level's amount. */
export const SYNERGY = { need: [2, 5], v: { 1: [0.2, 0.35], 2: [0.3, 0.5], 3: [0.3, 0.45], 4: [0.2, 0.3], 5: [0.02, 0.035], 6: [0.2, 0.35], 7: [0.4, 0.6], 8: [0.15, 0.25], 9: [0.2, 0.35] } as Record<number, [number, number]> };
/** How many of your units each world has, and the level of its synergy (0, 1 or 2). */
export function synergies(b: { army: { cast: number }[]; variant?: Variant }) {
  const count: Record<number, number> = {};
  for (const p of b.army) count[p.cast] = (count[p.cast] ?? 0) + 1;
  const worlds = Object.keys(count).length;
  return Object.entries(count).map(([cast, n]) => ({ cast: Number(cast), n, lv: b.variant === 'tactics'
    ? worlds >= 2 ? (b.army.length >= SYNERGY.need[1] ? 2 : 1) : 0
    : n >= SYNERGY.need[1] ? 2 : n >= SYNERGY.need[0] ? 1 : 0 })).sort((a, c) => c.n - a.n || a.cast - c.cast);
}
const synV = (f: { syn: number; synLv: number; tac?: boolean }, world: number) => (!f.tac && f.syn === world && f.synLv ? SYNERGY.v[world][f.synLv - 1] : 0);
/** Tactics: every unit fights with its own world's ability; a mixed-world army strengthens it, and five units
    strengthen it again. All casts are equally strong there. */
export type Ability = 'poison' | 'burn' | 'freeze' | 'slow' | 'drain' | 'shock' | 'armor' | 'dodge' | 'power';
export const ABILITY: Record<number, Ability> = { 1: 'poison', 2: 'burn', 3: 'freeze', 4: 'slow', 5: 'drain', 6: 'shock', 7: 'armor', 8: 'dodge', 9: 'power' };
/** Each ability's amount at its three levels: poison and burn a share of the hit over 3 and 2 s, freeze a chance to
    stop the foe for `FREEZE` seconds, slow by that much for 1.2 s, drain a share of the hit healed, shock a share
    arcing to one more, armor and dodge against hits taken, power more damage. */
export const ABIL_V: Record<Ability, [number, number, number]> = {
  poison: [0.3, 0.4, 0.65], burn: [0.3, 0.4, 0.65], freeze: [0.12, 0.16, 0.3], slow: [0.25, 0.3, 0.5], drain: [0.15, 0.2, 0.35],
  shock: [0.35, 0.42, 0.7], armor: [0.12, 0.16, 0.3], dodge: [0.1, 0.13, 0.24], power: [0.15, 0.2, 0.4],
};
const FREEZE = 0.7;
const abil = (f: { syn: number; synLv: number; tac?: boolean }, a: Ability) => (f.tac && f.synLv && ABILITY[f.syn] === a ? ABIL_V[a][f.synLv - 1] : 0);
/** The room-6 boss's leap: after `wait` seconds of the fight it jumps over the front line to land beside the enemy's
    ranged unit furthest back (or its furthest unit), in `time` seconds, its landing hitting all within `reach`. */
export const LEAP = { wait: 0.8, time: 0.55, reach: 46, dmg: 0.6 };
/** The final boss's charge: every `every` seconds (the first after `first`) it aims for `aim` seconds, then dashes
    `speed` along the line for up to `dash` seconds, hitting each foe it runs through for `dmg` times its blow and
    throwing it aside. */
export const CHARGE = { first: 2.5, every: 8, aim: 0.6, dash: 0.45, speed: 420, dmg: 0.5, push: 26 };
/** Your commander's fireball: it bursts on the thickest knot of enemies, its damage growing with the round. */
export const STRIKE = { fly: 0.6, reach: 75, dmg: 140, perRound: 0.25 };

export type Slot = { c: number; r: number };
/** A unit you own, between fights: its step, the world its cast comes from, and its cell. */
export type Piece = { id: number; tier: Tier; cast: number; slot: Slot; star?: Star };
/** The board's two ways to play: Fusion (two of a kind make the next one up the cast) and Tactics (each card keeps
    its character and rarity, and two copies raise it a star). */
export type Variant = 'fusion' | 'tactics';
export type Star = 1 | 2 | 3;
/** Tactics: how much stronger each star is (health and damage each), how many copies make the next, what a card of
    each rarity costs (bug common, ticket rare, legacy epic, room-6 boss legendary, final boss mythic) and how often
    the shop shows each, from round 1 to round 10. */
export const TACTICS = {
  star: [1, 1.8, 3.2],
  copies: 2,
  price: [1, 2, 3, 5, 8],
  odds: [[0.62, 0.28, 0.09, 0.01, 0], [0.34, 0.3, 0.22, 0.11, 0.03]],
  /** AI pressure in Tactics. Round 1 stays introductory; from round 2 the
      rival reaches full base strength, receives more budget and keeps scaling. */
  wave: 1,
  enemyBudget: 1.2,
  enemyPerRound: 0.04,
};
export const tacticsEnemyPower = (round: number) =>
  round <= 1 ? 0.9 : TACTICS.wave * (1 + TACTICS.enemyPerRound * Math.max(0, round - 2));
const starOf = (p: { star?: Star }) => p.star ?? 1;
/** A unit in a fight, yours (side 0) or the enemy's (side 1). */
export type Fighter = {
  id: number;
  side: 0 | 1;
  tier: Tier;
  cast: number;
  star: Star;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  dmg: number;
  rate: number;
  range: number;
  speed: number;
  r: number;
  splash: number;
  ranged: boolean;
  cd: number;
  ring: number;
  target: number;
  retarget: number;
  dead: boolean;
  /** Only to be seen: facing, the walk cycle, an attack and a hit. */
  face: number;
  step: number;
  swing: number;
  hit: number;
  /** The world whose synergy it carries (0 for none) and how strong (1 with three of its world, 2 with five). */
  syn: number;
  synLv: number;
  /** Tactics: `syn` is always its own world and `synLv` its ability's level (`ABILITY`). */
  tac?: boolean;
  poison: number;
  poisonDps: number;
  /** Burning (seconds left and damage a second) and slowed (seconds left). */
  burn: number;
  burnDps: number;
  slow: number;
  slowBy: number;
  slowKind?: 'ice' | 'mud';
  freeze: number;
  /** The room-6 boss's leap, once a fight: in the air (`t` running from 0 to `LEAP.time`) from where it stood to beside
      the enemy's ranged units at the back; null on the ground. `leapCd` counts down to it. */
  leap: { t: number; fx: number; fy: number; tx: number; ty: number } | null;
  leapCd: number;
  /** The final boss's charge: aiming (`aim` seconds left, along `dir`), then dashing (`dash` seconds left), hitting
      each foe it runs through once (`hitIds`); `chargeCd` counts down to the next. */
  aim: number;
  dash: number;
  dir: { x: number; y: number };
  chargeCd: number;
  hitIds: number[];
  /** A boss's characteristic move and final signature use independent, deterministic clocks. */
  moveCd: number;
  signatureCd: number;
  bossPose?: 'move' | 'sig';
  bossPoseTime: number;
  channel: number;
};
export type Shot = { x: number; y: number; vx: number; vy: number; side: 0 | 1; dmg: number; target: number; life: number; ring: boolean; syn: number; synLv: number; tac?: boolean; from?: number; pic?: BossShot['pic']; el?: ThreatEl; r?: number; home?: number; delay?: number; group?: BossPool };
export type BoardEffect = { kind: 'arc' | 'heal' | 'dodge' | 'armor' | 'power'; x: number; y: number; tx?: number; ty?: number; age: number };
/** The special rounds, every third: gold rains in, everyone hits faster, everyone is tougher, or a win pays double. */
export type BoardEvent = 'gold' | 'frenzy' | 'giants' | 'bounty';
export const EVENT_EVERY = 3;
export type Offer = { tier: Tier; cast: number; price: number } | null;
export type BoardPhase = 'prep' | 'fight' | 'result' | 'over' | 'won';

export type BoardGame = {
  world: number;
  variant: Variant;
  /** The casts the shop sells from: worlds 1 to this one. */
  casts: number;
  round: number;
  lives: number;
  rivalLives: number;
  /** Consecutive victories for each commander; losing or drawing breaks the streak. */
  winStreak: number;
  rivalStreak: number;
  gold: number;
  phase: BoardPhase;
  army: Piece[];
  /** Tactics cards held in reserve; they do not fight or count toward the field cap. */
  bench: Piece[];
  shop: Offer[];
  /** This round's enemy, drawn faintly on their half while you prepare. */
  wave: Tier[];
  /** The world card each rival unit comes from, chosen from worlds 1 through this world's cast. */
  waveCasts: number[];
  fighters: Fighter[];
  shots: Shot[];
  time: number;
  /** The last fight: won, lost or drawn, the lives it cost, and whether it was won without losing a unit. */
  last: { result: 'win' | 'loss' | 'draw'; lost: number; rivalLost?: number; flawless?: boolean; hp?: [number, number]; timeout?: boolean } | null;
  /** This round's special event, if any. */
  event: BoardEvent | null;
  /** Your commander's fireball, once a fight: on its way (`t` seconds left) or bursting (`boom`). */
  skillUsed: boolean;
  strike: { x: number; y: number; t: number } | null;
  boom: { x: number; y: number; age: number } | null;
  /** The bosses' impacts, only to be seen: a leap's landing (`slam`) and a charge's hits (`ring`). */
  impacts: { x: number; y: number; age: number; kind: 'slam' | 'ring' }[];
  /** Brief, bounded visual feedback for bonuses that actually triggered. */
  effects: BoardEffect[];
  /** Warned attacks from each boss's own Sprints/Guard kit. */
  bossAttacks: BoardBossAttack[];
  /** The last buy that merged by itself: where, into which unit, and how many merges in a row (in Tactics, the
      star it reached). */
  lastMerge: { slot: Slot; id: number; combo: number; star?: Star } | null;
  /** The last unit summoned that did not merge, to pop it in. */
  lastSummon: { slot: Slot; id: number } | null;
  /** Fusion: the auto-merge, bought once a run (`buyAutoMerge`); without it you merge by dragging. */
  autoMerge: boolean;
  /** Whether the auto-merge has been bought this run (then it can be turned on and off at will, `toggleAutoMerge`). */
  autoBought: boolean;
  /** Units summoned this round (each round starts again from the base price). */
  summons: number;
  /** Fusion's auto-merge, played out: the two units about to merge (`a` into `b`), lightning between them until `t`
      runs out, and the merges in a row so far. */
  pending: { a: number; b: number; t: number; combo: number } | null;
  wins: number;
  /** Enemy units beaten, all told (for the profile's totals). */
  kills: number;
  events: string[];
  /** Playing against a person (`net.ts`): which side of the shared fight is yours (the host's army is side 0,
      the guest's side 1, on both phones), the round's seed, the rival's lives and army. */
  online?: Online;
};

export type Online = { me: 0 | 1; seed: number; rivalLives: number; rivalName: string; rivalArmy: Piece[] | null; waiting: boolean; rivalLost?: number };

let nextId = 1;
/** The fight's dice: `Math.random` alone, or seeded during an online fight so both phones roll the same. */
let roll: () => number = Math.random;
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = (a: number, b: number) => a + roll() * (b - a);
const worldUp = (w: number) => 1 + (w - 1) * 0.25;

export const pieceAt = (b: BoardGame, s: Slot) => b.army.find((p) => p.slot.c === s.c && p.slot.r === s.r);
export const inBoard = (s: Slot) => s.c >= 0 && s.c < COLS && s.r >= 0 && s.r < ROWS;
/** Your half: the lower four rows, below the reserved wall row. */
/** The corners where the commanders stand: yours at the lower right, the rival's at the upper left. */
export const isCorner = (s: Slot) => (s.c === COLS - 1 && s.r === ROWS - 1) || (s.c === 0 && s.r === 0);
// The floating commander does not reserve a deployment cell: all four home rows are usable.
export const homeCell = (s: Slot) => inBoard(s) && s.r >= HOME_ROW;
/** The first free cell of your half, from the front row back. */
function freeCell(b: BoardGame, backFirst = false): Slot | null {
  // Fusion's summons fill from the front row back; Tactics' cards bought with a tap from the back row up.
  const rows = Array.from({ length: ROWS - HOME_ROW }, (_, i) => HOME_ROW + i);
  if (backFirst) rows.reverse();
  for (const r of rows) for (const c of [2, 3, 1, 4, 0, 5]) if (homeCell({ c, r }) && !pieceAt(b, { c, r })) return { c, r };
  return null;
}
/** What a step of a cast costs in the shop, and gives back when sold. */
export const priceOf = (tier: Tier, cast: number, variant: Variant = 'fusion') => Math.max(1, Math.round((variant === 'tactics' ? TACTICS.price[tier] : PRICE[Math.min(2, tier)]) * castPower(cast)));
export const saleOf = (p: Piece, variant: Variant = 'fusion', world = p.cast) =>
  variant === 'tactics'
    ? Math.max(1, Math.floor((priceOf(p.tier, world, 'tactics') * TACTICS.copies ** (starOf(p) - 1)) / 2))
    : Math.max(1, Math.floor((TIER_VALUE[p.tier] * castPower(world)) / 2));

export function newBoard(world: number, casts: number, variant: Variant = 'fusion'): BoardGame {
  const wave = enemyWave(world, 1, variant);
  const b: BoardGame = {
    world, variant, casts: Math.max(1, Math.min(world, casts, WORLDS.length)), round: 1, lives: LIVES, rivalLives: LIVES, winStreak: 0, rivalStreak: 0, gold: Math.round(8 * castPower(world)), phase: 'prep',
    army: [], bench: [], shop: [], wave, waveCasts: enemyWaveCasts(world, 1, wave, variant), fighters: [], shots: [], time: 0, last: null, wins: 0, kills: 0, events: [], event: null, skillUsed: false, strike: null, boom: null, impacts: [], effects: [], bossAttacks: [], lastMerge: null, lastSummon: null, autoMerge: false, autoBought: false, summons: 0, pending: null,
  };
  // You start with a native bug, which receives this world's bonus.
  b.army.push({ id: nextId++, tier: 0, cast: b.world, slot: { c: 2, r: ROWS - 2 }, star: 1 });
  rollShop(b);
  return b;
}

export const SHOP_SIZE = 3;
/** Shop offers from every world's cast, with rarer units appearing more often in later rounds. */
function rollTacticsOffer(b: BoardGame): NonNullable<Offer> {
  // Rarer cards come more often as the rounds go on.
  const k = (b.round - 1) / (ROUNDS - 1);
  const odds = TACTICS.odds[0].map((o, i) => o + (TACTICS.odds[1][i] - o) * k);
  let roll = Math.random();
  let tier = 0;
  while (tier < 4 && roll >= odds[tier]) { roll -= odds[tier]; tier += 1; }
  // Any world's characters can appear; native characters get a combat bonus in this world.
  const cast = 1 + Math.floor(Math.random() * WORLDS.length);
  return { tier: tier as Tier, cast, price: priceOf(tier as Tier, b.world, 'tactics') };
}

function rollShop(b: BoardGame) {
  // Fusion has no cards: its units are summoned (`summon`).
  if (b.variant === 'fusion') { b.shop = []; return; }
  if (b.variant === 'tactics') { b.shop = Array.from({ length: SHOP_SIZE }, () => rollTacticsOffer(b)); return; }
  b.shop = Array.from({ length: SHOP_SIZE }, () => {
    const roll = Math.random();
    const tier: Tier = b.round >= 4 && roll < 0.08 ? 2 : roll < 0.34 ? 1 : 0;
    const cast = 1 + Math.floor(Math.random() * WORLDS.length);
    return { tier, cast, price: priceOf(tier, cast) };
  });
}

export function reroll(b: BoardGame) {
  if (b.phase !== 'prep' || b.gold < 1) return false;
  b.gold -= 1;
  rollShop(b);
  return true;
}

/** Buys a shop card onto the first free cell. */
/** How many units you may field in a round: four in the first, up to ten. */
export const armyCap = (round: number) => Math.min(10, 3 + Math.ceil(round * 0.7));
export const BENCH_CAP = 4;

export function buy(b: BoardGame, i: number, at?: Slot) {
  const offer = b.shop[i];
  if (b.phase !== 'prep' || !offer || b.gold < offer.price) return false;
  if (b.variant === 'tactics') return buyTactics(b, i, offer, at);
  const twin = b.autoMerge && b.army.find((p) => p.tier === offer.tier && p.cast === offer.cast && p.tier < maxTier(p.cast));
  if (!twin && (b.army.length >= armyCap(b.round) || !freeCell(b))) return false;
  b.gold -= offer.price;
  b.shop[i] = null;
  b.events.push('buy');
  placeFusion(b, offer.tier, offer.cast);
  return true;
}

/** Fusion: a new unit onto the board; next to its twin it merges at once, and on up while the new step has a twin too
    (a combo). The caller has checked there is room or a twin. */
function placeFusion(b: BoardGame, tier: Tier, cast: number) {
  const twin = b.autoMerge ? b.army.find((p) => p.tier === tier && p.cast === cast && p.tier < maxTier(p.cast)) : undefined;
  const cell = freeCell(b);
  if (!twin || cell) {
    // It lands first; with the auto-merge and a twin on the board, the merge comes a moment later (`tickMerge`).
    const p = { id: nextId++, tier, cast, slot: cell! };
    b.army.push(p);
    b.lastSummon = { slot: p.slot, id: p.id };
    if (twin) queueMerge(b, p, twin, 0);
    return;
  }
  twin.tier = (twin.tier + 1) as Tier;
  let combo = 1;
  for (;;) {
    const next = b.army.find((p) => p !== twin && p.tier === twin.tier && p.cast === twin.cast && twin.tier < maxTier(twin.cast));
    if (!next) break;
    b.army = b.army.filter((p) => p !== next);
    twin.tier = (twin.tier + 1) as Tier;
    combo += 1;
  }
  b.lastMerge = { slot: twin.slot, id: twin.id, combo };
  b.events.push('merge');
}

/** How long the lightning plays between two units before they merge, in seconds. */
export const MERGE_DELAY = 0.9;
function queueMerge(b: BoardGame, a: Piece, into: Piece, combo: number) {
  if (!b.pending) b.pending = { a: a.id, b: into.id, t: MERGE_DELAY, combo };
}
/** Plays the auto-merge out: when the lightning has run, the newer unit merges into its twin, and the next pair (if
    the new step has a twin too) is queued at once, a combo. `skip` finishes every one at once (the fight starts). */
export function tickMerge(b: BoardGame, dt: number, skip = false) {
  while (b.pending) {
    b.pending.t -= dt;
    if (b.pending.t > 0 && !skip) return;
    const { a, b: into, combo } = b.pending;
    b.pending = null;
    const p = b.army.find((x) => x.id === a);
    const q = b.army.find((x) => x.id === into);
    if (!p || !q || p.tier !== q.tier || p.cast !== q.cast || q.tier >= maxTier(q.cast)) {
      // Its pair was sold or moved during the lightning: the other pairs still merge.
      if (b.autoMerge) queuePairs(b);
      continue;
    }
    b.army = b.army.filter((x) => x !== p);
    q.tier = (q.tier + 1) as Tier;
    b.lastMerge = { slot: q.slot, id: q.id, combo: combo + 1 };
    b.events.push('merge');
    const next = b.army.find((x) => x !== q && x.tier === q.tier && x.cast === q.cast && q.tier < maxTier(q.cast));
    if (next) queueMerge(b, q, next, combo + 1);
    else {
      // Any other pair left on the board (after the auto-merge was bought) goes next.
      const o = b.army.find((x) => b.army.some((y) => y !== x && y.tier === x.tier && y.cast === x.cast && x.tier < maxTier(x.cast)));
      const o2 = o && b.army.find((y) => y !== o && y.tier === o.tier && y.cast === o.cast);
      if (o && o2) queueMerge(b, o, o2, 0);
    }
    dt = 0;
  }
}

/** Fusion has no shop: the summon button drops a unit straight onto your half for a set price, nearly always a bug,
    now and then a ticket and, from round 4, a legacy. It favours this world's cast, while every cast can appear. */
export const SUMMON = {
  price: 1.5, ticket: 0.25, legacy: 0.06, latest: 0.6, step: 4,
  /** Fusion AI pressure. Round 1 is introductory; from round 2 the rival
      receives stronger stats, more budget and guaranteed merged units. */
  wave: 1.05,
  enemyBudget: 1.2,
  enemyPerRound: 0.045,
};
export const fusionEnemyPower = (round: number) =>
  round <= 1 ? 0.95 : SUMMON.wave * (1 + SUMMON.enemyPerRound * Math.max(0, round - 2));
/** The auto-merge's price, once a run: from then on a unit summoned next to its twin merges by itself, and every
    pair already on the board merges at once. */
export const AUTO_MERGE = { price: 3 };
export const autoMergePrice = (b: BoardGame) => Math.round(AUTO_MERGE.price * castPower(b.world));
export function buyAutoMerge(b: BoardGame) {
  if (b.variant !== 'fusion' || b.phase !== 'prep' || b.autoBought || b.gold < autoMergePrice(b)) return false;
  b.gold -= autoMergePrice(b);
  b.autoBought = true;
  b.autoMerge = true;
  queuePairs(b);
  return true;
}
/** Once bought, the auto-merge turns on and off at will; turned on, the pairs on the board merge in turn. */
export function toggleAutoMerge(b: BoardGame) {
  if (b.variant !== 'fusion' || !b.autoBought) return false;
  b.autoMerge = !b.autoMerge;
  if (b.autoMerge && b.phase === 'prep') queuePairs(b);
  if (!b.autoMerge) b.pending = null;
  return true;
}
function queuePairs(b: BoardGame) {
  // The pairs already on the board merge one after another, with the lightning (`tickMerge`).
  const p = b.army.find((x) => b.army.some((y) => y !== x && y.tier === x.tier && y.cast === x.cast && x.tier < maxTier(x.cast)));
  const q = p && b.army.find((y) => y !== p && y.tier === p.tier && y.cast === p.cast);
  if (p && q) queueMerge(b, p, q, 0);
  return true;
}
/** The summon's price: the base, and one gold more for every `SUMMON.step` summons already made this round. */
export const summonPrice = (b: BoardGame) => Math.max(1, Math.round(SUMMON.price * castPower(b.world))) + Math.floor(b.summons / SUMMON.step);
export function summon(b: BoardGame): 'ok' | 'gold' | 'full' | 'none' {
  if (b.phase !== 'prep' || b.variant !== 'fusion') return 'none';
  if (b.gold < summonPrice(b)) return 'gold';
  if (b.army.length >= armyCap(b.round) || !freeCell(b)) return 'full';
  b.gold -= summonPrice(b);
  b.summons += 1;
  const roll = Math.random();
  const tier: Tier = b.round >= 4 && roll < SUMMON.legacy ? 2 : roll < SUMMON.legacy + SUMMON.ticket ? 1 : 0;
  const cast = Math.random() < SUMMON.latest ? b.world : 1 + Math.floor(Math.random() * WORLDS.length);
  b.events.push('summon');
  placeFusion(b, tier, cast);
  return 'ok';
}

/** Tactics: buying a matching card raises the existing copy a star, keeping its character and cell.
    Another copy at the new star continues the chain, up to three stars. */
/** The bench's four seats are fixed: a reserve keeps the seat it was put on (`slot.r`), and gaps are allowed. */
export const freeSeat = (b: BoardGame) => { for (let r = 0; r < BENCH_CAP; r++) if (!b.bench.some((p) => p.slot.r === r)) return r; return -1; };
const seatTaken = (b: BoardGame, seat: number) => b.bench.find((p) => p.slot.r === seat);
function buyTactics(b: BoardGame, i: number, offer: NonNullable<Offer>, where?: Slot) {
  const same = (p: Piece, star: Star) => p.tier === offer.tier && p.cast === offer.cast && starOf(p) === star;
  const pair = [...b.army, ...b.bench].filter((p) => same(p, 1));
  if (pair.length < TACTICS.copies - 1 && b.army.length >= armyCap(b.round) && b.bench.length >= BENCH_CAP) return false;
  // Dragged onto a free cell of your half it lands there; tapped, on the first free cell from the back row up.
  const chosen = where && homeCell(where) && !pieceAt(b, where) ? where : null;
  // Dragged onto a free bench seat it goes there, whatever room the board has.
  const seat = where && where.c === -1 && where.r >= 0 && where.r < BENCH_CAP && !seatTaken(b, where.r) ? where.r : -1;
  // Empty grid cells do not grant extra army capacity. Overflow purchases belong in reserve.
  const at = pair.length >= TACTICS.copies - 1 || seat >= 0 || b.army.length >= armyCap(b.round) ? null : chosen ?? freeCell(b, true);
  const reserve = !at && pair.length < TACTICS.copies - 1 && b.bench.length < BENCH_CAP;
  if (!at && pair.length < TACTICS.copies - 1 && !reserve) return false;
  b.gold -= offer.price;
  b.shop[i] = rollTacticsOffer(b);
  b.events.push('buy');
  if (reserve) { b.bench.push({ id: nextId++, tier: offer.tier, cast: offer.cast, slot: { c: -1, r: seat >= 0 ? seat : freeSeat(b) }, star: 1 }); return true; }
  if (at) { b.army.push({ id: nextId++, tier: offer.tier, cast: offer.cast, slot: at, star: 1 }); return true; }
  let star: Star = 1;
  let keep = pair[0];
  let group = pair.slice(0, TACTICS.copies - 1);
  for (;;) {
    b.army = b.army.filter((p) => !group.includes(p) || p === keep);
    b.bench = b.bench.filter((p) => !group.includes(p) || p === keep);
    star = (star + 1) as Star;
    keep.star = star;
    if (star >= 3) break;
    const next = [...b.army, ...b.bench].filter((p) => p !== keep && same(p, star));
    if (next.length < TACTICS.copies - 1) break;
    group = [keep, ...next.slice(0, TACTICS.copies - 1)];
    keep = group[0];
  }
  if (keep.slot.c >= 0) b.lastMerge = { slot: keep.slot, id: keep.id, combo: star - 1, star };
  b.events.push('merge');
  return true;
}

/** Deploy a reserve into a free cell, or exchange it with the unit occupying the target cell. */
export function deployBench(b: BoardGame, index: number, target?: Slot) {
  if (b.phase !== 'prep' || b.variant !== 'tactics' || b.online?.waiting) return false;
  const p = b.bench[index];
  const at = target ?? freeCell(b, true);
  if (!p || !at || !homeCell(at)) return false;
  const other = pieceAt(b, at);
  if (other) {
    const armyIndex = b.army.indexOf(other);
    other.slot = { c: -1, r: p.slot.r };
    p.slot = { ...at };
    b.army[armyIndex] = p;
    b.bench[index] = other;
    b.events.push('deploy');
    return true;
  }
  if (b.army.length >= armyCap(b.round)) return false;
  b.bench.splice(index, 1);
  p.slot = at;
  b.army.push(p);
  b.events.push('deploy');
  return true;
}

/** Move a reserve to another bench seat, swapping with the one there. */
export function moveBenchSeat(b: BoardGame, index: number, seat: number) {
  const p = b.bench[index];
  if (b.phase !== 'prep' || b.variant !== 'tactics' || !p || seat < 0 || seat >= BENCH_CAP || p.slot.r === seat) return false;
  const there = seatTaken(b, seat);
  if (there) there.slot = { c: -1, r: p.slot.r };
  p.slot = { c: -1, r: seat };
  b.events.push('bench');
  return true;
}

/** Sell a reserve for the same value as the equivalent fielded unit. */
export function sellBench(b: BoardGame, index: number) {
  const p = b.bench[index];
  if (b.phase !== 'prep' || b.variant !== 'tactics' || b.online?.waiting || !p) return false;
  b.gold += saleOf(p, b.variant, b.world);
  b.bench.splice(index, 1);
  b.events.push('sell');
  return true;
}

/** Store a fielded Tactics unit on a bench seat: the one it is dropped on (swapping with the reserve there, which
    takes its cell), or the first free one. */
export function storeOnBench(b: BoardGame, from: Slot, seat = -1) {
  if (b.phase !== 'prep' || b.variant !== 'tactics') return false;
  const p = pieceAt(b, from);
  if (!p) return false;
  const there = seat >= 0 ? seatTaken(b, seat) : undefined;
  if (there) {
    b.army[b.army.indexOf(p)] = there;
    there.slot = { ...p.slot };
    p.slot = { c: -1, r: seat };
    b.bench[b.bench.indexOf(there)] = p;
    b.events.push('bench');
    return true;
  }
  const to = seat >= 0 && seat < BENCH_CAP ? seat : freeSeat(b);
  if (to < 0) return false;
  b.army = b.army.filter((unit) => unit !== p);
  p.slot = { c: -1, r: to };
  b.bench.push(p);
  b.events.push('bench');
  return true;
}

/** Sells a unit for half what it is worth. */
export function sell(b: BoardGame, from: Slot) {
  const p = pieceAt(b, from);
  if (b.phase !== 'prep' || !p) return false;
  b.army = b.army.filter((q) => q !== p);
  b.gold += saleOf(p, b.variant, b.world);
  b.events.push('sell');
  return true;
}

export const canMerge = (p: Piece, q: Piece, variant: Variant = 'fusion') => variant === 'fusion' && p !== q && p.tier === q.tier && p.cast === q.cast && p.tier < maxTier(p.cast);

/** Drags a unit onto a cell of your half: onto its twin (same step, same cast) it merges into the next step, onto another it
    swaps, onto nothing it moves. */
export function moveUnit(b: BoardGame, from: Slot, to: Slot): 'merged' | 'swapped' | 'moved' | 'none' {
  const p = pieceAt(b, from);
  if (b.phase !== 'prep' || !p || !homeCell(to) || (from.c === to.c && from.r === to.r)) return 'none';
  const q = pieceAt(b, to);
  if (q && canMerge(p, q, b.variant)) {
    q.tier = (q.tier + 1) as Tier;
    b.army = b.army.filter((x) => x !== p);
    b.events.push('merge');
    return 'merged';
  }
  if (q) {
    q.slot = { ...from };
    p.slot = { ...to };
    return 'swapped';
  }
  p.slot = { ...to };
  return 'moved';
}

export const cellCentre = (s: Slot) => ({ x: s.c * CELL + CELL / 2, y: s.r * CELL + CELL / 2 });

function combatStats(tier: Tier, mult0: number, syn: number, synLv: number, event: BoardEvent | null, star: Star, tac: boolean) {
  const st = TIER_STATS[tier];
  const mult = mult0 * TACTICS.star[star - 1];
  const f = { syn, synLv, tac };
  const hp = Math.round(st.hp * mult * (1 + synV(f, 1)) * (event === 'giants' ? 1.4 : 1));
  return { hp, maxHp: hp, dmg: st.dmg * mult * (1 + synV(f, 9) + abil(f, 'power')), rate: st.rate * (1 + synV(f, 6)) * (event === 'frenzy' ? 1.3 : 1), range: st.range, speed: st.speed, r: st.r, splash: st.splash ?? 0, ranged: !!st.ranged };
}

/** Exactly the combat numbers shown by a piece's inspection card; no dice or IDs are consumed. */
export function unitStats(b: Pick<BoardGame, 'variant' | 'world' | 'event' | 'army'>, p: Piece) {
  const tac = b.variant === 'tactics';
  const lv = synergies(b).find((s) => s.cast === p.cast)?.lv ?? 0;
  const syn = tac || lv ? p.cast : 0;
  const synLv = tac ? 1 + lv : lv;
  return { ...combatStats(p.tier, unitPower(b, p.cast), syn, synLv, b.event, starOf(p), tac), syn, synLv, ability: tac ? ABILITY[p.cast] : undefined, kit: bossKit(p.cast, p.tier) };
}

/** The rival's preview numbers use the same growth and event rules as the fighters created in startFight. */
export function waveUnitStats(b: Pick<BoardGame, 'variant' | 'world' | 'event' | 'round'>, tier: Tier, cast = b.world, star: Star = 1) {
  const tac = b.variant === 'tactics';
  const mult = castPower(b.world) * nativeWorldPower(b.world, cast) * (1 + WAVE.tough * (b.world - 1)) * (tac ? tacticsEnemyPower(b.round) : fusionEnemyPower(b.round));
  const syn = tac ? cast : 0;
  const synLv = tac ? 1 : 0;
  return { ...combatStats(tier, mult, syn, synLv, b.event, star, tac), syn, synLv, ability: tac ? ABILITY[cast] : undefined, kit: bossKit(cast, tier) };
}

function fighter(side: 0 | 1, tier: Tier, cast: number, x: number, y: number, mult0: number, id = nextId++, syn = 0, synLv = 0, event: BoardEvent | null = null, star: Star = 1, tac = false): Fighter {
  return {
    id, side, tier, cast, star, x, y, ...combatStats(tier, mult0, syn, synLv, event, star, tac), cd: rand(0.1, 0.6), ring: 0, target: -1, retarget: 0, dead: false,
    face: side === 0 ? 1 : -1, step: roll() * 4, swing: 0, hit: 0, syn, synLv, tac, poison: 0, poisonDps: 0, burn: 0, burnDps: 0, slow: 0, slowBy: 0, freeze: 0,
    leap: null, leapCd: Infinity, aim: 0, dash: 0, dir: { x: 0, y: side === 0 ? -1 : 1 }, chargeCd: tier >= 4 ? CHARGE.first : Infinity, hitIds: [],
    moveCd: tier >= 3 ? BOSS_CAST.first : Infinity, signatureCd: tier >= 4 ? BOSS_CAST.signatureFirst : Infinity, bossPoseTime: 0, channel: 0,
  };
}

/** How many units the enemy fields in a round (it puts its budget into bigger ones past that). */
const waveMost = (world: number, round: number) => Math.min(8, 2 + Math.ceil(round * 0.6)) + Math.floor((world - 1) / 3);

/** The enemy for a round: a budget of gold's worth grown with the rounds and the world, spent on the world's own
    cast, the room-6 boss in round 5 and the final boss in round 10. */
export function enemyWave(world: number, round: number, variant: Variant = 'fusion'): Tier[] {
  // About the gold you have had by now, a little less in the first world and more in the last.
  const had = 8 + (GOLD.round + 1) * (round - 1);
  // Counted in the world's own cast's units: your gold grows with its prices (`roundGold`).
  let points = Math.round(had * (WAVE.base + WAVE.world * (world - 1)));
  // Both battle variants ramp after the introductory round, but through their
  // own progression systems: stars in Tactics, merged tiers in Fusion.
  if (round >= 2) points = Math.round(points * (variant === 'tactics' ? TACTICS.enemyBudget : SUMMON.enemyBudget));
  const out: Tier[] = [];
  if (variant === 'fusion' && round >= 2) {
    const guaranteed: Tier[] = round >= 7 ? [2, 2] : round >= 4 ? [2] : [1];
    for (const tier of guaranteed) { out.push(tier); points -= TIER_VALUE[tier]; }
  }
  if (round === 5) { out.push(3); points -= TIER_VALUE[3]; }
  if (round === ROUNDS) { out.push(4); points -= TIER_VALUE[4]; }
  const top = Math.min(4, Math.floor((round + 1) / 2.5)) as Tier;
  const most = waveMost(world, round);
  while (points > 0 && out.length < most) {
    const each = points / (most - out.length);
    let t = top;
    const tierBudget = each * (variant === 'fusion' ? 1.8 : 1.4);
    const downgradeChance = variant === 'fusion' ? 0.1 : 0.25;
    while (t > 0 && (TIER_VALUE[t] > Math.max(1, tierBudget) || Math.random() < downgradeChance)) t = (t - 1) as Tier;
    out.push(t);
    points -= TIER_VALUE[t];
  }
  return out.sort((a, c) => c - a);
}

/** Tactics' rival also merges cards as the rounds advance. Its stronger units are
    concentrated on the rarer cards, and the last rounds can field one 3-star. */
export function enemyWaveStars(round: number, wave: Tier[], variant: Variant): Star[] {
  const stars = wave.map((): Star => 1);
  if (variant !== 'tactics' || !wave.length || round <= 1) return stars;
  // Round 2 always introduces at least one ★★. Upgrades then spread through
  // the rival army quickly; ★★★ arrives from round 7 and doubles from round 9.
  const upgraded = Math.min(wave.length, Math.max(1, Math.ceil((round - 1) * 0.55)));
  const threeStar = round >= 9 ? Math.min(2, upgraded) : round >= 7 ? Math.min(1, upgraded) : 0;
  for (let i = 0; i < upgraded; i++) stars[i] = i < threeStar ? 3 : 2;
  return stars;
}

function waveSeed(world: number, round: number, variant: Variant, wave: Tier[], casts: number[] = [], extra = 0) {
  let state = 2166136261;
  for (const n of [world, round, extra, variant === 'tactics' ? 1 : 0, ...wave, ...casts]) state = Math.imul(state ^ n, 16777619) >>> 0;
  return state || 1;
}

/** Assign each rival card a shuffled cast from the current world and its predecessors, balanced across the wave. */
export function enemyWaveCasts(world: number, round: number, wave: Tier[], variant: Variant) {
  const casts = Array.from({ length: Math.max(1, Math.min(world, WORLDS.length)) }, (_, i) => i + 1);
  const random = seeded(waveSeed(world, round, variant, wave));
  const out: number[] = [];
  const counts = new Map<number, number>();
  const maxPerCast = casts.length > 1 ? Math.ceil(wave.length / casts.length) + 1 : wave.length;
  for (let i = 0; i < wave.length; i++) {
    const available = casts.filter((cast) => (counts.get(cast) ?? 0) < maxPerCast);
    let cast = available[Math.floor(random() * available.length)] ?? casts[0];
    if (casts.length > 1 && i > 0 && i === wave.length - 1 && out.every((seen) => seen === cast)) cast = casts.find((candidate) => candidate !== cast)!;
    out.push(cast);
    counts.set(cast, (counts.get(cast) ?? 0) + 1);
  }
  return out;
}

/** Where this round's enemy stands: each card gets a varied cell from the rival's half. */
export function waveSpots(b: BoardGame) {
  const cells: Slot[] = [];
  for (let r = 0; r < WALL_ROW; r++) for (let c = 0; c < COLS; c++) if (!isCorner({ c, r })) cells.push({ c, r });
  const stars = enemyWaveStars(b.round, b.wave, b.variant);
  const wave = b.wave.map((tier, i) => ({ tier, cast: b.waveCasts[i] ?? b.world, star: stars[i] })).sort((a, c) => a.tier - c.tier);
  // Shuffle with a round-local seed so the rival uses varied cells, while previews and both online screens
  // stay stable across frames and devices. Do not consume the fight's random stream here.
  const random = seeded(waveSeed(b.world, b.round, b.variant, b.wave, b.waveCasts, b.online?.seed ?? 0));
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return wave.map(({ tier, cast, star }, i) => ({ tier, cast, star, ...cellCentre(cells[i]) }));
}

/** Sets the fight up: your bugs as placed, the enemy's wave on the upper half. */
/** No unit fielded or in reserve and not enough gold for even the cheapest unit: the round can still be fought (and
    lost), so the run never locks. */
export const stranded = (b: BoardGame) => !b.army.length && !b.bench.length && !b.pending
  && b.gold < (b.variant === 'tactics' ? priceOf(0, b.world, 'tactics') : summonPrice(b));
export const canFight = (b: BoardGame) => b.army.length > 0 || stranded(b);
export function startFight(b: BoardGame) {
  if (b.phase !== 'prep' || !canFight(b)) return false;
  tickMerge(b, 0, true);
  const lv = Object.fromEntries(synergies(b).map((x) => [x.cast, x.lv]));
  const tac = b.variant === 'tactics';
  b.fighters = b.army.map((p) => { const at = cellCentre(p.slot); return tac
    ? fighter(0, p.tier, p.cast, at.x, at.y, unitPower(b, p.cast), p.id, p.cast, 1 + (lv[p.cast] ?? 0), b.event, starOf(p), true)
    : fighter(0, p.tier, p.cast, at.x, at.y, unitPower(b, p.cast), p.id, lv[p.cast] ? p.cast : 0, lv[p.cast] ?? 0, b.event, starOf(p)); });
  const grow = castPower(b.world) * (1 + WAVE.tough * (b.world - 1)) * (b.variant === 'tactics' ? tacticsEnemyPower(b.round) : fusionEnemyPower(b.round));
  const wave = waveSpots(b);
  const waveWorlds = new Set(wave.map((unit) => unit.cast)).size;
  const enemySynergy = waveWorlds >= 2 ? (wave.length >= SYNERGY.need[1] ? 2 : 1) : 0;
  for (const w of wave) b.fighters.push(tac ? fighter(1, w.tier, w.cast, w.x, w.y, grow * nativeWorldPower(b.world, w.cast), nextId++, w.cast, 1 + enemySynergy, b.event, w.star, true) : fighter(1, w.tier, w.cast, w.x, w.y, grow * nativeWorldPower(b.world, w.cast), nextId++, 0, 0, b.event));
  b.shots = [];
  b.skillUsed = false;
  b.strike = null;
  b.boom = null;
  b.impacts = [];
  b.effects = [];
  b.bossAttacks = [];
  b.time = 0;
  b.phase = 'fight';
  b.events.push('fight');
  return true;
}

/** Starts a fight against a person: the host's army on side 0 in its own cells, the guest's on side 1 turned round
    onto the upper half, in that order and with the same ids and the round's seeded dice on both phones, so the fight
    plays out the same on each (the guest's screen draws it turned round, `mirrorFight` in `boardView.ts`). */
export function startOnlineFight(b: BoardGame, rival: Piece[], mine: Piece[] = b.army) {
  const o = b.online;
  if (!o || b.phase !== 'prep' || (!b.army.length && !mine.length && !stranded(b))) return false;
  tickMerge(b, 0, true);
  roll = seeded(o.seed + b.round * 7919);
  const host = o.me === 0 ? mine : rival;
  const guest = o.me === 0 ? rival : mine;
  let id = 1;
  const make = (side: 0 | 1, army: Piece[]) => {
    const lv = Object.fromEntries(synergies({ army, variant: b.variant }).map((x) => [x.cast, x.lv]));
    return army.map((p) => {
      const at = cellCentre(side === 0 ? p.slot : { c: COLS - 1 - p.slot.c, r: ROWS - 1 - p.slot.r });
      return b.variant === 'tactics'
        ? fighter(side, p.tier, p.cast, at.x, at.y, unitPower(b, p.cast), id++, p.cast, 1 + (lv[p.cast] ?? 0), b.event, starOf(p), true)
        : fighter(side, p.tier, p.cast, at.x, at.y, unitPower(b, p.cast), id++, lv[p.cast] ? p.cast : 0, lv[p.cast] ?? 0, b.event, starOf(p));
    });
  };
  b.fighters = [...make(0, host), ...make(1, guest)];
  o.rivalArmy = rival;
  o.waiting = false;
  b.shots = [];
  b.skillUsed = true; // no commander's fireball between people: it could not be timed alike on both phones
  b.strike = null;
  b.boom = null;
  b.impacts = [];
  b.effects = [];
  b.bossAttacks = [];
  b.time = 0;
  b.phase = 'fight';
  b.events.push('fight');
  return true;
}

/** The same 1, 2, 3 (capped) victory streak damage for either commander. Draws break both streaks. */
function streakDamage(b: BoardGame, result: 'win' | 'loss' | 'draw') {
  b.winStreak = result === 'win' ? b.winStreak + 1 : 0;
  b.rivalStreak = result === 'loss' ? b.rivalStreak + 1 : 0;
  return { lost: result === 'win' ? 0 : result === 'loss' ? Math.min(3, b.rivalStreak) : 1,
    rivalLost: result === 'win' ? Math.min(3, b.winStreak) : 0 };
}

/** Online uses the same streaks; draws retain the one-life cost for both players.
    The game ends when one runs out of lives, or after the last round on lives. */
function endOnline(b: BoardGame, o: Online) {
  roll = Math.random;
  const me = o.me, them = (1 - me) as 0 | 1;
  const mine = alive(b, me), theirs = alive(b, them);
  const hp = (l: Fighter[]) => Math.round(l.reduce((n, f) => n + Math.max(0, f.hp), 0));
  const timeout = mine.length > 0 && theirs.length > 0;
  const result = timeout ? hp(mine) > hp(theirs) ? 'win' : hp(mine) < hp(theirs) ? 'loss' : 'draw'
    : mine.length ? 'win' : theirs.length ? 'loss' : 'draw';
  const roundDamage = streakDamage(b, result);
  const lostMe = Math.min(b.lives, roundDamage.lost), lostThem = Math.min(o.rivalLives, result === 'draw' ? 1 : roundDamage.rivalLost);
  b.lives = Math.max(0, b.lives - lostMe);
  o.rivalLives = Math.max(0, o.rivalLives - lostThem);
  o.rivalLost = lostThem;
  b.last = { result, lost: lostMe, rivalLost: lostThem, ...(timeout ? { hp: [hp(mine), hp(theirs)] as [number, number], timeout } : { flawless: result === 'win' && b.fighters.every((f) => f.side !== me || !f.dead) }) };
  if (result === 'win') b.wins += 1;
  const over = b.lives <= 0 || o.rivalLives <= 0 || b.round >= ROUNDS;
  b.phase = !over ? 'result' : b.lives > o.rivalLives ? 'won' : 'over';
  b.events.push(b.phase === 'over' ? 'over' : b.phase === 'won' ? 'won' : result);
}

const alive = (b: BoardGame, side: 0 | 1) => b.fighters.filter((f) => !f.dead && f.side === side);
const byId = (b: BoardGame, id: number) => b.fighters.find((f) => f.id === id && !f.dead);

function bonusEffect(b: BoardGame, kind: BoardEffect['kind'], at: Fighter, to?: Fighter) {
  if (b.effects.length >= 64) return;
  b.effects.push({ kind, x: at.x, y: at.y, ...(to ? { tx: to.x, ty: to.y } : {}), age: 0 });
}

function damage(b: BoardGame, f: Fighter, dmg: number, direct = true): number {
  if (f.dead || dmg <= 0) return 0;
  // The haunted servers dodge; the mud takes less.
  const dodge = synV(f, 8) || abil(f, 'dodge');
  if (direct && dodge && roll() < dodge) { bonusEffect(b, 'dodge', f); return 0; }
  const armor = synV(f, 4) || abil(f, 'armor');
  const dealt = Math.min(f.hp, dmg * (1 - armor));
  f.hp -= dealt;
  if (direct) {
    f.hit = 0.15;
    if (armor) bonusEffect(b, 'armor', f);
  }
  if (f.hp <= 0) { f.dead = true; if (f.side !== (b.online?.me ?? 0)) b.kills += 1; b.events.push(f.side === 0 ? 'fall' : 'kill'); }
  return dealt;
}

/** A blow landing, with the attacker's synergy: fire burns, ice slows, the Forge arcs to one more. */
function land(b: BoardGame, from: { syn: number; synLv: number; tac?: boolean; id?: number; from?: number }, t: Fighter, dmg: number) {
  const dealt = damage(b, t, dmg);
  if (dealt <= 0) return;
  if (from.tac) { tacticsHit(b, from, t, dmg, dealt); return; }
  if (!t.dead && synV(from, 2)) { t.burn = 2; t.burnDps = Math.max(t.burnDps, (dmg * synV(from, 2)) / 2); }
  if (!t.dead && synV(from, 3)) { t.slow = Math.max(t.slow, 1.2); t.slowBy = Math.max(t.slowBy, synV(from, 3)); t.slowKind = 'ice'; }
  if (synV(from, 9)) bonusEffect(b, 'power', t);
  if (synV(from, 7)) {
    let best = 70;
    let next: Fighter | undefined;
    for (const o of alive(b, t.side)) { const d = Math.hypot(o.x - t.x, o.y - t.y); if (o !== t && d < best) { best = d; next = o; } }
    if (next) { damage(b, next, dmg * synV(from, 7)); bonusEffect(b, 'arc', t, next); b.events.push('arc'); }
  }
}

/** Tactics: a blow's world ability (`ABILITY`). */
function tacticsHit(b: BoardGame, from: { syn: number; synLv: number; tac?: boolean; id?: number; from?: number }, t: Fighter, dmg: number, dealt: number) {
  const me = byId(b, from.from ?? from.id ?? -1);
  if (me && abil(from, 'drain') && me.hp < me.maxHp) {
    me.hp = Math.min(me.maxHp, me.hp + dealt * abil(from, 'drain'));
    bonusEffect(b, 'heal', me);
  }
  if (!t.dead) {
    if (abil(from, 'poison')) { t.poison = 3; t.poisonDps = Math.max(t.poisonDps, (dmg * abil(from, 'poison')) / 3); }
    if (abil(from, 'burn')) { t.burn = 2; t.burnDps = Math.max(t.burnDps, (dmg * abil(from, 'burn')) / 2); }
    if (abil(from, 'slow')) { t.slow = Math.max(t.slow, 1.2); if (t.slowBy < 1) t.slowKind = 'mud'; t.slowBy = Math.max(t.slowBy, abil(from, 'slow')); }
    if (abil(from, 'freeze') && t.tier < 3 && roll() < abil(from, 'freeze')) { t.freeze = Math.max(t.freeze, FREEZE); b.events.push('freeze'); }
  }
  if (abil(from, 'power')) bonusEffect(b, 'power', t);
  if (abil(from, 'shock')) {
    let best = 70;
    let next: Fighter | undefined;
    for (const o of alive(b, t.side)) { const d = Math.hypot(o.x - t.x, o.y - t.y); if (o !== t && d < best) { best = d; next = o; } }
    if (next) { damage(b, next, dmg * abil(from, 'shock')); bonusEffect(b, 'arc', t, next); b.events.push('arc'); }
  }
}

function strike(b: BoardGame, f: Fighter, t: Fighter) {
  if (f.ranged) {
    const d = Math.hypot(t.x - f.x, t.y - f.y) || 1;
    b.shots.push({ x: f.x, y: f.y - 8, vx: ((t.x - f.x) / d) * 260, vy: ((t.y - f.y) / d) * 260, side: f.side, dmg: f.dmg, target: t.id, life: 2, ring: false, syn: f.syn, synLv: f.synLv, tac: f.tac, from: f.id });
    b.events.push('throw');
    return;
  }
  if (f.splash) {
    for (const o of alive(b, t.side)) if (o !== t && Math.hypot(o.x - t.x, o.y - t.y) <= f.splash + o.r) damage(b, o, f.dmg * 0.6);
    land(b, f, t, f.dmg);
    b.events.push('slam');
  } else {
    land(b, f, t, f.dmg);
    b.events.push('bite');
  }
}

/** Your commander's fireball, once a fight: thrown at the enemy with the most others round it. */
export function commanderStrike(b: BoardGame) {
  if (b.phase !== 'fight' || b.skillUsed) return false;
  const foes = alive(b, 1);
  let best: Fighter | undefined;
  let most = -1;
  for (const f of foes) {
    const n = foes.filter((o) => Math.hypot(o.x - f.x, o.y - f.y) <= STRIKE.reach).length;
    if (n > most) { most = n; best = f; }
  }
  if (!best) return false;
  b.skillUsed = true;
  b.strike = { x: best.x, y: best.y, t: STRIKE.fly };
  b.events.push('skill');
  return true;
}

/** The bosses' native world move and, for final bosses, signature, adapted to the board. Each cast has a shared
    damage budget so a crowded telegraph cannot multiply its damage. */
function bossMoves(b: BoardGame, f: Fighter, dt: number, slowK: number) {
  const foes = alive(b, f.side === 0 ? 1 : 0);
  if (f.leap) {
    f.leap.t += dt;
    const k = Math.min(1, f.leap.t / LEAP.time);
    f.x = f.leap.fx + (f.leap.tx - f.leap.fx) * k;
    f.y = f.leap.fy + (f.leap.ty - f.leap.fy) * k;
    if (k >= 1) {
      f.leap = null;
      f.swing = 0.4;
      b.impacts.push({ x: f.x, y: f.y, age: 0, kind: 'slam' });
      f.retarget = 0;
      b.events.push('land');
    }
    return true;
  }
  if (!bossKit(f.cast, f.tier) || !foes.length) return false;
  f.channel = Math.max(0, f.channel - dt);
  if (f.bossPoseTime > 0) {
    f.bossPoseTime = Math.max(0, f.bossPoseTime - dt);
    if (!f.bossPoseTime) { f.bossPose = undefined; f.channel = 0; }
    return true;
  }

  const rateDt = dt * slowK;
  f.moveCd -= rateDt;
  if (f.tier >= 4) f.signatureCd -= rateDt;
  const signature = f.tier >= 4 && f.signatureCd <= 0;
  if (f.moveCd > 0 && !signature) return false;

  const plan = planBossCast(f, foes.map((o) => ({ id: o.id, x: o.x, y: o.y, r: o.r, ranged: o.ranged })), signature, BOARD_W, BOARD_H);
  if (signature) {
    f.signatureCd = BOSS_CAST.signature;
    f.moveCd = Math.max(f.moveCd, BOSS_CAST.finalMove);
    f.bossPose = 'sig';
  } else {
    f.moveCd = f.tier >= 4 ? BOSS_CAST.finalMove : BOSS_CAST.move;
    f.bossPose = 'move';
  }
  f.bossPoseTime = plan.hold;
  f.channel = signature ? plan.hold : 0;

  for (const attack of plan.attacks) {
    attack.age = -plan.hold;
    b.bossAttacks.push(attack);
  }
  for (const shot of plan.shots) b.shots.push({ ...shot, delay: plan.hold + (shot.delay ?? 0) });

  if (plan.action?.kind === 'leap') {
    f.leap = { t: 0, fx: f.x, fy: f.y, tx: plan.action.x, ty: plan.action.y };
    f.target = foes.reduce((best, o) => Math.hypot(o.x - f.x, o.y - f.y) < Math.hypot(best.x - f.x, best.y - f.y) ? o : best).id;
    f.face = plan.action.x >= f.x ? 1 : -1;
    b.events.push('leap');
  } else if (plan.action?.kind === 'blink') {
    f.x = plan.action.x; f.y = plan.action.y;
    f.retarget = 0;
    b.impacts.push({ x: f.x, y: f.y, age: 0, kind: 'ring' });
    b.events.push('boss-move');
  } else b.events.push(signature ? 'boss-signature' : 'boss-move');
  return true;
}

function bossAttackTouches(a: BoardBossAttack, f: Fighter) {
  if (a.age < a.warn || a.age > a.warn + a.life || a.hitIds.includes(f.id)) return false;
  const active = a.age - a.warn;
  if (a.kind === 'wave') {
    return Math.abs(f.x - a.x) <= a.len / 2 + f.r && Math.abs(f.y - a.y) <= a.r + f.r;
  }
  const angle = a.a + (a.kind === 'beam' ? (a.spin ?? 0) * active : 0);
  if (a.kind === 'circle' || a.kind === 'clone') return Math.hypot(f.x - a.x, f.y - a.y) <= a.r + f.r;
  const dx = Math.cos(angle) * a.len, dy = Math.sin(angle) * a.len;
  const lx = f.x - a.x, ly = f.y - a.y;
  const along = (lx * dx + ly * dy) / (a.len * a.len || 1);
  if (along < 0 || along > 1) return false;
  const cross = Math.abs(lx * dy - ly * dx) / (a.len || 1);
  return cross <= a.r + f.r;
}

function updateBossAttacks(b: BoardGame, dt: number) {
  for (const attack of b.bossAttacks) {
    attack.age += dt;
    if (attack.kind === 'wave' && attack.age >= attack.warn) attack.y += (attack.speed ?? 0) * Math.sign(Math.sin(attack.a)) * dt;
    if (attack.age < attack.warn || attack.age > attack.warn + attack.life || attack.group.remaining <= 0) continue;
    for (const foe of alive(b, attack.side === 0 ? 1 : 0)) {
      if (!bossAttackTouches(attack, foe)) continue;
      attack.hitIds.push(foe.id);
      const hit = Math.min(attack.group.remaining, attack.group.dmg);
      if (hit <= 0) break;
      attack.group.remaining -= hit;
      const dealt = damage(b, foe, hit);
      if (dealt > 0) {
        if (attack.freeze && foe.tier < 3) { foe.freeze = Math.max(foe.freeze, attack.freeze); b.events.push('freeze'); }
        if (attack.slow) { foe.slow = Math.max(foe.slow, 1.2); foe.slowBy = Math.max(foe.slowBy, attack.slow); foe.slowKind = attack.el === 'mud' ? 'mud' : 'ice'; }
        b.impacts.push({ x: foe.x, y: foe.y, age: 0, kind: 'ring' });
      }
    }
  }
  b.bossAttacks = b.bossAttacks.filter((a) => a.age <= a.warn + a.life && a.group.remaining > 0);
}

/** One step of the fight: every unit goes for the nearest foe, walks up to it and strikes; it ends when one side
    is gone or the time is up. */
export function updateBoard(b: BoardGame, dt: number) {
  b.events = [];
  if (b.phase !== 'fight') return;
  b.time += dt;
  if (b.boom) { b.boom.age += dt; if (b.boom.age > 0.5) b.boom = null; }
  for (const i of b.impacts) i.age += dt;
  b.impacts = b.impacts.filter((i) => i.age < 0.5);
  for (const e of b.effects) e.age += dt;
  b.effects = b.effects.filter((e) => e.age < 0.5);
  if (b.strike) {
    b.strike.t -= dt;
    if (b.strike.t <= 0) {
      const { x, y } = b.strike;
      const dmg = STRIKE.dmg * castPower(b.world) * (1 + STRIKE.perRound * (b.round - 1));
      for (const o of alive(b, 1)) if (Math.hypot(o.x - x, o.y - y) <= STRIKE.reach + o.r) damage(b, o, dmg);
      b.boom = { x, y, age: 0 };
      b.strike = null;
      b.events.push('boom');
    }
  }
  for (const f of b.fighters) {
    f.hit = Math.max(0, f.hit - dt);
    f.swing = Math.max(0, f.swing - dt);
    if (f.dead) continue;
    if (f.burn > 0) { const tick = Math.min(dt, f.burn); f.burn = Math.max(0, f.burn - dt); damage(b, f, f.burnDps * tick, false); }
    if (f.burn <= 0) f.burnDps = 0;
    if (f.dead) continue;
    if (f.poison > 0) { const tick = Math.min(dt, f.poison); f.poison = Math.max(0, f.poison - dt); damage(b, f, f.poisonDps * tick, false); }
    if (f.poison <= 0) f.poisonDps = 0;
    if (f.dead) continue;
    f.slow = Math.max(0, f.slow - dt);
    f.freeze = Math.max(0, f.freeze - dt);
    if (f.slow <= 0) f.slowBy = 0;
    if (synV(f, 5) && f.hp < f.maxHp) {
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * synV(f, 5) * dt);
      if (Math.floor((b.time - dt) * 2) < Math.floor(b.time * 2)) bonusEffect(b, 'heal', f);
    }
    if (f.freeze > 0) continue;
    // Slowed by ice: it walks and strikes 30% (45%) slower.
    const slowK = 1 - f.slowBy;
    if (bossMoves(b, f, dt, slowK)) continue;
    f.cd -= dt * slowK;
    f.retarget -= dt;
    let t = byId(b, f.target);
    if (!t || f.retarget <= 0) {
      let best = Infinity;
      for (const o of alive(b, f.side === 0 ? 1 : 0)) {
        const d = Math.hypot(o.x - f.x, o.y - f.y);
        if (d < best) { best = d; t = o; }
      }
      f.target = t?.id ?? -1;
      f.retarget = 0.5;
    }
    if (!t) continue;
    const dx = t.x - f.x;
    const dy = t.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    if (Math.abs(dx) > 4) f.face = dx > 0 ? 1 : -1;
    if (d > f.range + t.r * 0.6) {
      const step = Math.min(f.speed * slowK * dt, d - f.range);
      f.x += (dx / d) * step;
      f.y += (dy / d) * step;
      f.step += step / 14;
    } else if (f.cd <= 0) {
      f.cd = 1 / f.rate;
      f.swing = 0.3;
      strike(b, f, t);
    }
  }
  updateBossAttacks(b, dt);
  // Units push one another apart and stay on the board.
  const live = b.fighters.filter((f) => !f.dead && !f.leap);
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
    const a = live[i], c = live[j];
    const dx = c.x - a.x, dy = c.y - a.y;
    const d = Math.hypot(dx, dy) || 0.01;
    const min = (a.r + c.r) * 0.9;
    if (d < min) {
      const push = (min - d) / 2;
      a.x -= (dx / d) * push; a.y -= (dy / d) * push;
      c.x += (dx / d) * push; c.y += (dy / d) * push;
    }
  }
  for (const f of live) { f.x = Math.max(f.r, Math.min(BOARD_W - f.r, f.x)); f.y = Math.max(f.r, Math.min(BOARD_H - f.r, f.y)); }
  for (const s of b.shots) {
    s.life -= dt;
    if (s.delay && s.delay > 0) { s.delay = Math.max(0, s.delay - dt); continue; }
    if (s.home && s.home > 0) {
      const target = byId(b, s.target);
      s.home = Math.max(0, s.home - dt);
      if (target) {
        const speed = Math.hypot(s.vx, s.vy);
        const current = Math.atan2(s.vy, s.vx);
        const wanted = Math.atan2(target.y - s.y, target.x - s.x);
        const delta = Math.atan2(Math.sin(wanted - current), Math.cos(wanted - current));
        const angle = current + Math.max(-2.4 * dt, Math.min(2.4 * dt, delta));
        s.vx = Math.cos(angle) * speed; s.vy = Math.sin(angle) * speed;
      }
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    const foes = alive(b, s.side === 0 ? 1 : 0);
    const radius = s.r ?? 6;
    const hit = s.ring ? foes.find((o) => Math.hypot(o.x - s.x, o.y - s.y) < o.r + radius) : byId(b, s.target);
    if (!s.ring && !hit) { s.life = 0; continue; }
    if (hit && Math.hypot(hit.x - s.x, hit.y - s.y) < hit.r + radius) {
      if (s.group) {
        const dealt = Math.min(s.dmg, s.group.remaining);
        s.group.remaining -= dealt;
        if (dealt > 0) damage(b, hit, dealt);
      } else if (s.ring) damage(b, hit, s.dmg);
      else land(b, s, hit, s.dmg);
      s.life = 0;
    }
    if (s.x < -20 || s.x > BOARD_W + 20 || s.y < -20 || s.y > BOARD_H + 20) s.life = 0;
  }
  b.shots = b.shots.filter((s) => s.life > 0);
  const mine = alive(b, 0).length;
  const theirs = alive(b, 1).length;
  if (mine && theirs && b.time < FIGHT_TIME) return;
  if (b.online) { endOnline(b, b.online); return; }
  // Decide the winner first, then apply the same streak damage to either commander.
  if (!theirs && mine) {
    b.last = { result: 'win', lost: 0, flawless: b.fighters.every((f) => f.side === 1 || !f.dead) };
  } else if (mine && theirs) {
    const hp = (side: 0 | 1) => Math.round(alive(b, side).reduce((n, f) => n + Math.max(0, f.hp), 0));
    const ours = hp(0), rival = hp(1);
    const result = ours > rival ? 'win' : ours < rival ? 'loss' : 'draw';
    // Timeout wins still pay only plain round gold, without a win bonus, chest or bounty.
    b.last = { result, lost: 0, hp: [ours, rival], timeout: true };
  } else {
    b.last = { result: 'loss', lost: 0 };
  }
  const roundDamage = streakDamage(b, b.last.result);
  roundDamage.lost = Math.min(b.lives, roundDamage.lost);
  roundDamage.rivalLost = Math.min(b.rivalLives, roundDamage.rivalLost);
  Object.assign(b.last, roundDamage);
  if (b.last.result === 'win') b.wins += 1;
  b.lives = Math.max(0, b.lives - roundDamage.lost);
  b.rivalLives = Math.max(0, b.rivalLives - roundDamage.rivalLost);
  b.phase = b.lives <= 0 ? 'over' : b.rivalLives <= 0 ? 'won' : 'result';
  b.events.push(b.phase === 'over' ? 'over' : b.phase === 'won' ? 'won' : b.last.result);
}

/** Gold each round, and the more after a win. */
export const GOLD = { round: 6, win: 2 };
/** The gold a round pays: more in a later world, as its cast's prices are higher (so an earlier cast comes cheap). */
export const roundGold = (world: number, won: boolean) => Math.round((GOLD.round + (won ? GOLD.win : 0)) * castPower(world));

/** On to the next round: gold (more after a win), a fresh shop and the next wave. Your bugs come back whole. The last wave
    repeats until a commander runs out of lives. */
/** The gold a round pays on top: a flawless win's chest, and double the win's gold in a bounty round. */
export function roundBonus(b: BoardGame) {
  const won = b.last?.result === 'win';
  return (b.last?.flawless ? Math.round(3 * castPower(b.world)) : 0) + (won && !b.last?.timeout && b.event === 'bounty' ? roundGold(b.world, true) : 0);
}
const EVENTS: BoardEvent[] = ['gold', 'frenzy', 'giants', 'bounty'];

export function nextRound(b: BoardGame) {
  if (b.phase !== 'result') return;
  const won = b.last?.result === 'win';
  b.gold += roundBonus(b);
  if (b.round < ROUNDS) b.round += 1;
  b.gold += roundGold(b.world, won && !b.last?.timeout);
  // Every third round is a special one (never the last, which is the final boss's).
  // Against a person the event comes from the shared seed, so both get the same one.
  const die = b.online ? seeded(b.online.seed + b.round * 104729)() : Math.random();
  b.event = b.round % EVENT_EVERY === 0 && b.round < ROUNDS ? EVENTS[Math.floor(die * EVENTS.length)] : null;
  if (b.event === 'gold') b.gold += Math.round(6 * castPower(b.world));
  b.fighters = [];
  b.shots = [];
  b.phase = 'prep';
  b.summons = 0;
  b.wave = b.online ? [] : enemyWave(b.world, b.round, b.variant);
  b.waveCasts = b.online ? [] : enemyWaveCasts(b.world, b.round, b.wave, b.variant);
  if (b.online) { b.online.rivalArmy = null; b.online.waiting = false; }
  rollShop(b);
}

/** The coins a board run pays: for every fight won, and a bonus for clearing the world. */
export const boardCoins = (b: BoardGame) => Math.round((30 * b.wins + (b.phase === 'won' ? 150 : 0)) * worldUp(b.world));

