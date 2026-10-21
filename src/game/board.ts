import { WORLDS, type Look } from './world';

/* «Sprint Planning», the board mode: an auto battler. Between fights you buy bugs of the casts you have opened,
   lay them on your half of the board and merge two of a kind into the next one up the cast (two bugs make a
   ticket, two tickets a legacy, two legacy a room-6 boss, two of those the world's final boss); then the fight
   with the round's enemy wave plays out on its own. Your hero watches from the lower right corner and the world's
   final boss, the rival, from the upper left: a round won throws a fireball at the rival, a round lost one back at
   you. Ten rounds a world, the room-6 boss in round 5 and the final boss in round 10; each world won opens its
   cast in the shop, and a later world's cast is stronger (and dearer) than an earlier one's. No DOM here, so it
   can be simulated in Node; drawn by `boardView.ts`. */

export const COLS = 6;
export const ROWS = 8;
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
/** The final boss's ring of orbs: every few seconds, out in a circle. */
const RING = { every: 5, n: 8, dmg: 22, speed: 170 };
/** The final boss of each world (its art id, as in `world.ts`'s FINAL_BOSS). */
export const FINAL_ID = ['kernel', 'archdemon', 'drakkar', 'medusa', 'queen', 'zeus', 'mech', 'wraith', 'chimera'];
/** A cast's strength: health and damage ×(1 + `CAST.step` a world past the first); its price grows the same. */
export const CAST = { step: 0.25 };
export const castPower = (cast: number) => 1 + CAST.step * (cast - 1);
/** A unit's strength: its cast's in Fusion, the world's for every cast in Tactics (all levelled). */
export const unitPower = (b: { variant: Variant; world: number }, cast: number) => castPower(b.variant === 'tactics' ? b.world : cast);
export const castLook = (cast: number) => (WORLDS[cast - 1].look === 'random' ? 'core' : WORLDS[cast - 1].look) as Look;

/** How strong the waves are against the gold you have had (×base in world 1, `world` more each world after), and
    how much tougher the enemy's units are than a cast's own each world past the first. */
export const WAVE = { base: 0.88, world: 0.05, tough: 0.012 };
/** Your half of the board: the lower four rows. */
export const HOME_ROW = 4;

/** Three units of one world (five for the stronger one) give each of them its world's gift in the fight:
    1 the Backlog +health, 2 fire burns, 3 ice slows, 4 mud takes less damage, 5 the jungle heals, 6 the Arena
    strikes faster, 7 the Forge's hits arc to one more, 8 the haunted servers dodge, 9 the Core hits harder.
    `v` is each level's amount. */
export const SYNERGY = { need: [3, 5], v: { 1: [0.2, 0.35], 2: [0.3, 0.5], 3: [0.3, 0.45], 4: [0.2, 0.3], 5: [0.02, 0.035], 6: [0.2, 0.35], 7: [0.4, 0.6], 8: [0.15, 0.25], 9: [0.2, 0.35] } as Record<number, [number, number]> };
/** How many of your units each world has, and the level of its synergy (0, 1 or 2). */
export function synergies(b: { army: { cast: number }[] }) {
  const count: Record<number, number> = {};
  for (const p of b.army) count[p.cast] = (count[p.cast] ?? 0) + 1;
  return Object.entries(count).map(([cast, n]) => ({ cast: Number(cast), n, lv: n >= SYNERGY.need[1] ? 2 : n >= SYNERGY.need[0] ? 1 : 0 })).sort((a, c) => c.n - a.n || a.cast - c.cast);
}
const synV = (f: { syn: number; synLv: number; tac?: boolean }, world: number) => (!f.tac && f.syn === world && f.synLv ? SYNERGY.v[world][f.synLv - 1] : 0);
/** Tactics: every unit fights with its own world's ability, alone at its first level, and stronger with three (second)
    or five (third) of its world on the board, so mixing worlds makes combos; all casts are equally strong there. */
export type Ability = 'poison' | 'burn' | 'freeze' | 'slow' | 'drain' | 'shock' | 'armor' | 'dodge' | 'power';
export const ABILITY: Record<number, Ability> = { 1: 'poison', 2: 'burn', 3: 'freeze', 4: 'slow', 5: 'drain', 6: 'shock', 7: 'armor', 8: 'dodge', 9: 'power' };
/** Each ability's amount at its three levels: poison and burn a share of the hit over 3 and 2 s, freeze a chance to
    stop the foe for `FREEZE` seconds, slow by that much for 1.2 s, drain a share of the hit healed, shock a share
    arcing to one more, armor and dodge against hits taken, power more damage. */
export const ABIL_V: Record<Ability, [number, number, number]> = {
  poison: [0.3, 0.45, 0.65], burn: [0.3, 0.45, 0.65], freeze: [0.12, 0.2, 0.3], slow: [0.25, 0.35, 0.5], drain: [0.15, 0.25, 0.35],
  shock: [0.35, 0.5, 0.7], armor: [0.12, 0.2, 0.3], dodge: [0.1, 0.16, 0.24], power: [0.15, 0.25, 0.4],
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
    its character and rarity, and three copies raise it a star). */
export type Variant = 'fusion' | 'tactics';
export type Star = 1 | 2 | 3;
/** Tactics: how much stronger each star is (health and damage each), how many copies make the next, what a card of
    each rarity costs (bug common, ticket rare, legacy epic, room-6 boss legendary, final boss mythic) and how often
    the shop shows each, from round 1 to round 10. */
export const TACTICS = {
  star: [1, 1.8, 3.2],
  copies: 3,
  price: [1, 2, 3, 5, 8],
  odds: [[0.62, 0.28, 0.09, 0.01, 0], [0.34, 0.3, 0.22, 0.11, 0.03]],
  /** The waves against a tactics army, against a fusion one. */
  wave: 0.68,
};
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
};
export type Shot = { x: number; y: number; vx: number; vy: number; side: 0 | 1; dmg: number; target: number; life: number; ring: boolean; syn: number; synLv: number; tac?: boolean; from?: number };
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
  gold: number;
  phase: BoardPhase;
  army: Piece[];
  shop: Offer[];
  /** This round's enemy, drawn faintly on their half while you prepare. */
  wave: Tier[];
  fighters: Fighter[];
  shots: Shot[];
  time: number;
  /** The last fight: won, lost or drawn, the lives it cost, and whether it was won without losing a unit. */
  last: { result: 'win' | 'loss' | 'draw'; lost: number; flawless?: boolean; hp?: [number, number]; timeout?: boolean } | null;
  /** This round's special event, if any. */
  event: BoardEvent | null;
  /** Your commander's fireball, once a fight: on its way (`t` seconds left) or bursting (`boom`). */
  skillUsed: boolean;
  strike: { x: number; y: number; t: number } | null;
  boom: { x: number; y: number; age: number } | null;
  /** The bosses' impacts, only to be seen: a leap's landing (`slam`) and a charge's hits (`ring`). */
  impacts: { x: number; y: number; age: number; kind: 'slam' | 'ring' }[];
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
/** Your half: the lower four rows. */
/** The corners where the commanders stand: yours at the lower right, the rival's at the upper left. */
export const isCorner = (s: Slot) => (s.c === COLS - 1 && s.r === ROWS - 1) || (s.c === 0 && s.r === 0);
export const homeCell = (s: Slot) => inBoard(s) && s.r >= HOME_ROW && !isCorner(s);
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
    : Math.max(1, Math.floor((TIER_VALUE[p.tier] * castPower(p.cast)) / 2));

export function newBoard(world: number, casts: number, variant: Variant = 'fusion'): BoardGame {
  const b: BoardGame = {
    world, variant, casts: Math.max(1, casts), round: 1, lives: LIVES, gold: Math.round(8 * castPower(world)), phase: 'prep',
    army: [], shop: [], wave: enemyWave(world, 1), fighters: [], shots: [], time: 0, last: null, wins: 0, kills: 0, events: [], event: null, skillUsed: false, strike: null, boom: null, impacts: [], lastMerge: null, lastSummon: null, autoMerge: false, autoBought: false, summons: 0, pending: null,
  };
  // You start with a bug of the latest cast on the board.
  b.army.push({ id: nextId++, tier: 0, cast: b.casts, slot: { c: 2, r: ROWS - 2 }, star: 1 });
  rollShop(b);
  return b;
}

/** Four cards: mostly bugs and tickets (a legacy now and then from round 4), from any cast you have opened, the
    latest more often. */
function rollShop(b: BoardGame) {
  // Fusion has no cards: its units are summoned (`summon`).
  if (b.variant === 'fusion') { b.shop = []; return; }
  if (b.variant === 'tactics') {
    // Rarer cards come more often as the rounds go on.
    const k = (b.round - 1) / (ROUNDS - 1);
    const odds = TACTICS.odds[0].map((o, i) => o + (TACTICS.odds[1][i] - o) * k);
    b.shop = Array.from({ length: 4 }, () => {
      let roll = Math.random();
      let tier = 0;
      while (tier < 4 && roll >= odds[tier]) { roll -= odds[tier]; tier += 1; }
      // Every world's cast from the start, all equally strong and priced: what sets them apart is their ability.
      const cast = 1 + Math.floor(Math.random() * WORLDS.length);
      return { tier: tier as Tier, cast, price: priceOf(tier as Tier, b.world, 'tactics') };
    });
    return;
  }
  b.shop = Array.from({ length: 4 }, () => {
    const roll = Math.random();
    const tier: Tier = b.round >= 4 && roll < 0.08 ? 2 : roll < 0.34 ? 1 : 0;
    const cast = Math.random() < 0.5 ? b.casts : 1 + Math.floor(Math.random() * b.casts);
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
    if (!p || !q || p.tier !== q.tier || p.cast !== q.cast || q.tier >= maxTier(q.cast)) continue;
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
    now and then a ticket and, from round 4, a legacy, of the latest world's cast six times in ten and any opened
    one otherwise; it merges with its twin at once. */
export const SUMMON = { price: 1.5, ticket: 0.25, legacy: 0.06, latest: 0.6, step: 4, wave: 0.9 };
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
  const cast = Math.random() < SUMMON.latest ? b.casts : 1 + Math.floor(Math.random() * b.casts);
  b.events.push('summon');
  placeFusion(b, tier, cast);
  return 'ok';
}

/** Tactics: a card bought makes three copies of the same character at the same star with two on the board? They
    become one, a star up, where the first one stood (and on up when that makes three of the next star). */
function buyTactics(b: BoardGame, i: number, offer: NonNullable<Offer>, where?: Slot) {
  const same = (p: Piece, star: Star) => p.tier === offer.tier && p.cast === offer.cast && starOf(p) === star;
  const pair = b.army.filter((p) => same(p, 1));
  if (pair.length < TACTICS.copies - 1 && b.army.length >= armyCap(b.round)) return false;
  // Dragged onto a free cell of your half it lands there; tapped, on the first free cell from the back row up.
  const chosen = where && homeCell(where) && !pieceAt(b, where) ? where : null;
  const at = pair.length >= TACTICS.copies - 1 ? null : chosen ?? freeCell(b, true);
  if (!at && pair.length < TACTICS.copies - 1) return false;
  b.gold -= offer.price;
  b.shop[i] = null;
  b.events.push('buy');
  if (at) { b.army.push({ id: nextId++, tier: offer.tier, cast: offer.cast, slot: at, star: 1 }); return true; }
  let star: Star = 1;
  let keep = pair[0];
  let group = pair.slice(0, TACTICS.copies - 1);
  for (;;) {
    b.army = b.army.filter((p) => !group.includes(p) || p === keep);
    star = (star + 1) as Star;
    keep.star = star;
    if (star >= 3) break;
    const next = b.army.filter((p) => p !== keep && same(p, star));
    if (next.length < TACTICS.copies - 1) break;
    group = [keep, ...next.slice(0, TACTICS.copies - 1)];
    keep = group[0];
  }
  b.lastMerge = { slot: keep.slot, id: keep.id, combo: star - 1, star };
  b.events.push('merge');
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

function fighter(side: 0 | 1, tier: Tier, cast: number, x: number, y: number, mult0: number, id = nextId++, syn = 0, synLv = 0, event: BoardEvent | null = null, star: Star = 1, tac = false): Fighter {
  const st = TIER_STATS[tier];
  const mult = mult0 * TACTICS.star[star - 1];
  const f = { syn, synLv, tac };
  const hp = Math.round(st.hp * mult * (1 + synV(f, 1)) * (event === 'giants' ? 1.4 : 1));
  return {
    id, side, tier, cast, star, x, y, hp, maxHp: hp, dmg: st.dmg * mult * (1 + synV(f, 9) + abil(f, 'power')), rate: st.rate * (1 + synV(f, 6)) * (event === 'frenzy' ? 1.3 : 1), range: st.range, speed: st.speed, r: st.r,
    splash: st.splash ?? 0, ranged: !!st.ranged, cd: rand(0.1, 0.6), ring: RING.every * 0.6, target: -1, retarget: 0, dead: false,
    face: side === 0 ? 1 : -1, step: roll() * 4, swing: 0, hit: 0, syn, synLv, tac, poison: 0, poisonDps: 0, burn: 0, burnDps: 0, slow: 0, slowBy: 0,
    leap: null, leapCd: tier === 3 ? LEAP.wait : Infinity, aim: 0, dash: 0, dir: { x: 0, y: side === 0 ? -1 : 1 }, chargeCd: tier >= 4 ? CHARGE.first : Infinity, hitIds: [],
  };
}

/** How many units the enemy fields in a round (it puts its budget into bigger ones past that). */
const waveMost = (world: number, round: number) => Math.min(8, 2 + Math.ceil(round * 0.6)) + Math.floor((world - 1) / 3);

/** The enemy for a round: a budget of gold's worth grown with the rounds and the world, spent on the world's own
    cast, the room-6 boss in round 5 and the final boss in round 10. */
export function enemyWave(world: number, round: number): Tier[] {
  // About the gold you have had by now, a little less in the first world and more in the last.
  const had = 8 + (GOLD.round + 1) * (round - 1);
  // Counted in the world's own cast's units: your gold grows with its prices (`roundGold`).
  let points = Math.round(had * (WAVE.base + WAVE.world * (world - 1)));
  const out: Tier[] = [];
  if (round === 5) { out.push(3); points -= TIER_VALUE[3]; }
  if (round === ROUNDS) { out.push(4); points -= TIER_VALUE[4]; }
  const top = Math.min(4, Math.floor((round + 1) / 2.5)) as Tier;
  const most = waveMost(world, round);
  while (points > 0 && out.length < most) {
    const each = points / (most - out.length);
    let t = top;
    while (t > 0 && (TIER_VALUE[t] > Math.max(1, each * 1.4) || Math.random() < 0.25)) t = (t - 1) as Tier;
    out.push(t);
    points -= TIER_VALUE[t];
  }
  return out.sort((a, c) => c - a);
}

/** Where this round's enemy stands: the small ones from the front row back, the bosses at the back in the middle. */
export function waveSpots(b: BoardGame) {
  const cells: Slot[] = [];
  for (const r of [3, 2, 1, 0]) for (const c of [2, 3, 1, 4, 0, 5]) if (!isCorner({ c, r })) cells.push({ c, r });
  let i = 0;
  let boss = 0;
  return [...b.wave].sort((a, c) => a - c).map((tier) => {
    if (tier >= 3) return { tier, x: BOARD_W / 2 + (boss++ ? CELL * 1.5 : 0), y: CELL * 0.8 };
    const at = cellCentre(cells[i % cells.length]);
    i += 1;
    return { tier, ...at };
  });
}

/** Sets the fight up: your bugs as placed, the enemy's wave on the upper half. */
export function startFight(b: BoardGame) {
  if (b.phase !== 'prep' || !b.army.length) return false;
  tickMerge(b, 0, true);
  const lv = Object.fromEntries(synergies(b).map((x) => [x.cast, x.lv]));
  const tac = b.variant === 'tactics';
  b.fighters = b.army.map((p) => { const at = cellCentre(p.slot); return tac
    ? fighter(0, p.tier, p.cast, at.x, at.y, unitPower(b, p.cast), p.id, p.cast, 1 + (lv[p.cast] ?? 0), b.event, starOf(p), true)
    : fighter(0, p.tier, p.cast, at.x, at.y, castPower(p.cast), p.id, lv[p.cast] ? p.cast : 0, lv[p.cast] ?? 0, b.event, starOf(p)); });
  const grow = castPower(b.world) * (1 + WAVE.tough * (b.world - 1)) * (b.variant === 'tactics' ? TACTICS.wave : SUMMON.wave);
  for (const w of waveSpots(b)) b.fighters.push(tac ? fighter(1, w.tier, b.world, w.x, w.y, grow, nextId++, b.world, 1, b.event, 1, true) : fighter(1, w.tier, b.world, w.x, w.y, grow, nextId++, 0, 0, b.event));
  b.shots = [];
  b.skillUsed = false;
  b.strike = null;
  b.boom = null;
  b.impacts = [];
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
  if (!o || b.phase !== 'prep' || !b.army.length) return false;
  tickMerge(b, 0, true);
  roll = seeded(o.seed + b.round * 7919);
  const host = o.me === 0 ? mine : rival;
  const guest = o.me === 0 ? rival : mine;
  let id = 1;
  const make = (side: 0 | 1, army: Piece[]) => {
    const lv = Object.fromEntries(synergies({ army }).map((x) => [x.cast, x.lv]));
    return army.map((p) => {
      const at = cellCentre(side === 0 ? p.slot : { c: COLS - 1 - p.slot.c, r: ROWS - 1 - p.slot.r });
      return b.variant === 'tactics'
        ? fighter(side, p.tier, p.cast, at.x, at.y, unitPower(b, p.cast), id++, p.cast, 1 + (lv[p.cast] ?? 0), b.event, starOf(p), true)
        : fighter(side, p.tier, p.cast, at.x, at.y, castPower(p.cast), id++, lv[p.cast] ? p.cast : 0, lv[p.cast] ?? 0, b.event, starOf(p));
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
  b.time = 0;
  b.phase = 'fight';
  b.events.push('fight');
  return true;
}

/** The end of a fight against a person, from your side: the loser loses a life plus one for each two of the
    winner's steps still standing (four at most); on time, the side with more health wins and the other loses one;
    both gone at once, both lose one. The game ends when one runs out of lives, or after the last round on lives. */
function endOnline(b: BoardGame, o: Online) {
  roll = Math.random;
  const me = o.me, them = (1 - me) as 0 | 1;
  const mine = alive(b, me), theirs = alive(b, them);
  const steps = (l: Fighter[]) => l.reduce((n, f) => n + f.tier + 1, 0);
  const hp = (l: Fighter[]) => Math.round(l.reduce((n, f) => n + Math.max(0, f.hp), 0));
  let result: 'win' | 'loss' | 'draw';
  let lostMe = 0, lostThem = 0;
  let timeout = false;
  if (mine.length && theirs.length) {
    timeout = true;
    result = hp(mine) > hp(theirs) ? 'win' : hp(mine) < hp(theirs) ? 'loss' : 'draw';
    if (result === 'win') lostThem = 1; else if (result === 'loss') lostMe = 1; else { lostMe = 1; lostThem = 1; }
  } else if (!mine.length && !theirs.length) { result = 'draw'; lostMe = 1; lostThem = 1; }
  else if (mine.length) { result = 'win'; lostThem = Math.min(4, 1 + Math.floor(steps(mine) / 2)); }
  else { result = 'loss'; lostMe = Math.min(4, 1 + Math.floor(steps(theirs) / 2)); }
  b.lives = Math.max(0, b.lives - lostMe);
  o.rivalLives = Math.max(0, o.rivalLives - lostThem);
  o.rivalLost = lostThem;
  b.last = { result, lost: lostMe, ...(timeout ? { hp: [hp(mine), hp(theirs)] as [number, number], timeout } : { flawless: result === 'win' && b.fighters.every((f) => f.side !== me || !f.dead) }) };
  if (result === 'win') b.wins += 1;
  const over = b.lives <= 0 || o.rivalLives <= 0 || b.round >= ROUNDS;
  b.phase = !over ? 'result' : b.lives > o.rivalLives ? 'won' : 'over';
  b.events.push(b.phase === 'over' ? 'over' : b.phase === 'won' ? 'won' : result);
}

const alive = (b: BoardGame, side: 0 | 1) => b.fighters.filter((f) => !f.dead && f.side === side);
const byId = (b: BoardGame, id: number) => b.fighters.find((f) => f.id === id && !f.dead);

function damage(b: BoardGame, f: Fighter, dmg: number) {
  if (f.dead) return;
  // The haunted servers dodge; the mud takes less.
  if (synV(f, 8) && roll() < synV(f, 8)) return;
  if (abil(f, 'dodge') && roll() < abil(f, 'dodge')) return;
  f.hp -= dmg * (1 - synV(f, 4)) * (1 - abil(f, 'armor'));
  f.hit = 0.15;
  if (f.hp <= 0) { f.dead = true; if (f.side !== (b.online?.me ?? 0)) b.kills += 1; b.events.push(f.side === 0 ? 'fall' : 'kill'); }
}

/** A blow landing, with the attacker's synergy: fire burns, ice slows, the Forge arcs to one more. */
function land(b: BoardGame, from: { syn: number; synLv: number; tac?: boolean; id?: number; from?: number }, t: Fighter, dmg: number) {
  damage(b, t, dmg);
  if (from.tac) { tacticsHit(b, from, t, dmg); return; }
  if (t.dead) return;
  if (synV(from, 2)) { t.burn = 2; t.burnDps = Math.max(t.burnDps, (dmg * synV(from, 2)) / 2); }
  if (synV(from, 3)) { t.slow = Math.max(t.slow, 1.2); t.slowBy = Math.max(t.slowBy, synV(from, 3)); }
  if (synV(from, 7)) {
    let best = 70;
    let next: Fighter | undefined;
    for (const o of alive(b, t.side)) { const d = Math.hypot(o.x - t.x, o.y - t.y); if (o !== t && d < best) { best = d; next = o; } }
    if (next) { damage(b, next, dmg * synV(from, 7)); b.events.push('arc'); }
  }
}

/** Tactics: a blow's world ability (`ABILITY`). */
function tacticsHit(b: BoardGame, from: { syn: number; synLv: number; tac?: boolean; id?: number; from?: number }, t: Fighter, dmg: number) {
  const me = byId(b, from.from ?? from.id ?? -1);
  if (me && abil(from, 'drain')) me.hp = Math.min(me.maxHp, me.hp + dmg * abil(from, 'drain'));
  if (t.dead) return;
  if (abil(from, 'poison')) { t.poison = 3; t.poisonDps = Math.max(t.poisonDps, (dmg * abil(from, 'poison')) / 3); }
  if (abil(from, 'burn')) { t.burn = 2; t.burnDps = Math.max(t.burnDps, (dmg * abil(from, 'burn')) / 2); }
  if (abil(from, 'slow')) { t.slow = Math.max(t.slow, 1.2); t.slowBy = Math.max(t.slowBy, abil(from, 'slow')); }
  if (abil(from, 'freeze') && t.tier < 3 && roll() < abil(from, 'freeze')) { t.slow = Math.max(t.slow, FREEZE); t.slowBy = 1; b.events.push('freeze'); }
  if (abil(from, 'shock')) {
    let best = 70;
    let next: Fighter | undefined;
    for (const o of alive(b, t.side)) { const d = Math.hypot(o.x - t.x, o.y - t.y); if (o !== t && d < best) { best = d; next = o; } }
    if (next) { damage(b, next, dmg * abil(from, 'shock')); b.events.push('arc'); }
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

/** The bosses' moves, which take over their turn while they run: the room-6 boss leaps once over the front line
    onto the archers at the back; the final boss charges through a line of foes every few seconds. */
function bossMoves(b: BoardGame, f: Fighter, dt: number) {
  const foes = alive(b, f.side === 0 ? 1 : 0);
  if (f.leap) {
    f.leap.t += dt;
    const k = Math.min(1, f.leap.t / LEAP.time);
    f.x = f.leap.fx + (f.leap.tx - f.leap.fx) * k;
    f.y = f.leap.fy + (f.leap.ty - f.leap.fy) * k;
    if (k >= 1) {
      for (const o of foes) if (Math.hypot(o.x - f.x, o.y - f.y) <= LEAP.reach + o.r) land(b, f, o, f.dmg * LEAP.dmg);
      f.leap = null;
      f.swing = 0.4;
      b.impacts.push({ x: f.x, y: f.y, age: 0, kind: 'slam' });
      f.retarget = 0;
      b.events.push('land');
    }
    return true;
  }
  if (f.leapCd !== Infinity) {
    f.leapCd -= dt;
    if (f.leapCd <= 0) {
      f.leapCd = Infinity;
      // The ranged foe furthest back, or the furthest foe of all.
      const back = (o: Fighter) => (f.side === 0 ? -o.y : o.y);
      const pool = foes.some((o) => o.ranged) ? foes.filter((o) => o.ranged) : foes;
      const t = pool.sort((p, q) => back(q) - back(p))[0];
      if (t) {
        const side = t.x < BOARD_W / 2 ? 1 : -1;
        const tx = Math.max(f.r, Math.min(BOARD_W - f.r, t.x + side * (t.r + f.r) * 0.7));
        const ty = Math.max(f.r, Math.min(BOARD_H - f.r, t.y + (f.side === 0 ? -1 : 1) * 6));
        f.leap = { t: 0, fx: f.x, fy: f.y, tx, ty };
        f.target = t.id;
        f.face = tx > f.x ? 1 : -1;
        b.events.push('leap');
        return true;
      }
    }
  }
  if (f.dash > 0) {
    f.dash -= dt;
    const step = CHARGE.speed * dt;
    f.x = Math.max(f.r, Math.min(BOARD_W - f.r, f.x + f.dir.x * step));
    f.y = Math.max(f.r, Math.min(BOARD_H - f.r, f.y + f.dir.y * step));
    for (const o of foes) {
      if (f.hitIds.includes(o.id) || Math.hypot(o.x - f.x, o.y - f.y) > f.r + o.r) continue;
      f.hitIds.push(o.id);
      land(b, f, o, f.dmg * CHARGE.dmg);
      b.impacts.push({ x: o.x, y: o.y, age: 0, kind: 'ring' });
      // Thrown aside, off its line.
      const side = (o.x - f.x) * f.dir.y - (o.y - f.y) * f.dir.x >= 0 ? 1 : -1;
      o.x = Math.max(o.r, Math.min(BOARD_W - o.r, o.x - f.dir.y * side * CHARGE.push));
      o.y = Math.max(o.r, Math.min(BOARD_H - o.r, o.y + f.dir.x * side * CHARGE.push));
      b.events.push('slam');
    }
    if (f.dash <= 0) f.retarget = 0;
    return true;
  }
  if (f.aim > 0) {
    f.aim -= dt;
    if (f.aim <= 0) { f.dash = CHARGE.dash; f.hitIds = []; b.events.push('charge'); }
    return true;
  }
  if (f.chargeCd !== Infinity) {
    f.chargeCd -= dt;
    if (f.chargeCd <= 0 && foes.length) {
      f.chargeCd = CHARGE.every;
      // At the thickest knot of foes within reach of a dash.
      let best: Fighter | undefined;
      let most = -1;
      for (const o of foes) {
        const n = foes.filter((q) => Math.hypot(q.x - o.x, q.y - o.y) <= 60).length - Math.hypot(o.x - f.x, o.y - f.y) / 400;
        if (n > most) { most = n; best = o; }
      }
      if (best) {
        const dx = best.x - f.x, dy = best.y - f.y, d = Math.hypot(dx, dy) || 1;
        f.dir = { x: dx / d, y: dy / d };
        f.face = dx >= 0 ? 1 : -1;
        f.aim = CHARGE.aim;
        return true;
      }
    }
  }
  return false;
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
    if (f.burn > 0) { f.burn -= dt; damage(b, f, f.burnDps * dt); if (f.dead) continue; }
    if (f.poison > 0) { f.poison -= dt; damage(b, f, f.poisonDps * dt); if (f.dead) continue; } else f.poisonDps = 0;
    f.slow = Math.max(0, f.slow - dt);
    if (f.slow <= 0) f.slowBy = 0;
    if (synV(f, 5)) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * synV(f, 5) * dt);
    // Slowed by ice: it walks and strikes 30% (45%) slower.
    const slowK = 1 - f.slowBy;
    if (bossMoves(b, f, dt)) continue;
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
    if (f.tier >= 4) {
      f.ring -= dt;
      if (f.ring <= 0) {
        f.ring = RING.every;
        for (let i = 0; i < RING.n; i++) {
          const a = (i / RING.n) * Math.PI * 2;
          b.shots.push({ x: f.x, y: f.y, vx: Math.cos(a) * RING.speed, vy: Math.sin(a) * RING.speed, side: f.side, dmg: RING.dmg * (f.dmg / TIER_STATS[4].dmg), target: -1, life: 2.2, ring: true, syn: 0, synLv: 0 });
        }
        f.swing = 0.5;
        b.events.push('ring');
      }
    }
  }
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
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    const foes = alive(b, s.side === 0 ? 1 : 0);
    const hit = s.ring ? foes.find((o) => Math.hypot(o.x - s.x, o.y - s.y) < o.r + 6) : byId(b, s.target);
    if (!s.ring && !hit) { s.life = 0; continue; }
    if (hit && Math.hypot(hit.x - s.x, hit.y - s.y) < hit.r + 6) { if (s.ring) damage(b, hit, s.dmg); else land(b, s, hit, s.dmg); s.life = 0; }
  }
  b.shots = b.shots.filter((s) => s.life > 0);
  const mine = alive(b, 0).length;
  const theirs = alive(b, 1).length;
  if (mine && theirs && b.time < FIGHT_TIME) return;
  if (b.online) { endOnline(b, b.online); return; }
  // The round's result: a loss costs a life plus one for each two enemy steps still standing (four at most).
  const flawless = () => b.fighters.every((f) => f.side === 1 || !f.dead);
  if (!theirs && mine) { b.last = { result: 'win', lost: 0, flawless: flawless() }; b.wins += 1; }
  else if (mine && theirs) {
    // Time's up with both sides standing: the side with more health left in all wins (a loss costs one life).
    const hp = (side: 0 | 1) => Math.round(alive(b, side).reduce((n, f) => n + Math.max(0, f.hp), 0));
    const ours = hp(0), rival = hp(1);
    const result = ours > rival ? 'win' : ours < rival ? 'loss' : 'draw';
    // A win on time keeps your life but pays only a round's plain gold: no win bonus, no chest, no bounty.
    b.last = { result, lost: result === 'win' ? 0 : 1, hp: [ours, rival], timeout: true };
    if (result === 'win') b.wins += 1;
    else b.lives = Math.max(0, b.lives - 1);
  } else {
    const left = alive(b, 1).reduce((n, f) => n + f.tier + 1, 0);
    const lost = mine ? 1 : Math.min(4, 1 + Math.floor(left / 2));
    b.last = { result: mine ? 'draw' : 'loss', lost };
    b.lives = Math.max(0, b.lives - lost);
  }
  b.phase = b.lives <= 0 ? 'over' : b.round >= ROUNDS && b.last.result === 'win' ? 'won' : 'result';
  b.events.push(b.phase === 'over' ? 'over' : b.phase === 'won' ? 'won' : b.last.result);
}

/** Gold each round, and the more after a win. */
export const GOLD = { round: 6, win: 2 };
/** The gold a round pays: more in a later world, as its cast's prices are higher (so an earlier cast comes cheap). */
export const roundGold = (world: number, won: boolean) => Math.round((GOLD.round + (won ? GOLD.win : 0)) * castPower(world));

/** On to the next round: gold (more after a win), a fresh shop and the next wave. Your bugs come back whole. The last round
    must be won: lose it and you play it again, while lives last. */
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
  b.wave = b.online ? [] : enemyWave(b.world, b.round);
  if (b.online) { b.online.rivalArmy = null; b.online.waiting = false; }
  rollShop(b);
}

/** The coins a board run pays: for every fight won, and a bonus for clearing the world. */
export const boardCoins = (b: BoardGame) => Math.round((30 * b.wins + (b.phase === 'won' ? 150 : 0)) * worldUp(b.world));
