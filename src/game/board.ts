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
const synV = (f: { syn: number; synLv: number }, world: number) => (f.syn === world && f.synLv ? SYNERGY.v[world][f.synLv - 1] : 0);
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
  wave: 0.75,
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
  /** Burning (seconds left and damage a second) and slowed (seconds left). */
  burn: number;
  burnDps: number;
  slow: number;
  slowBy: number;
};
export type Shot = { x: number; y: number; vx: number; vy: number; side: 0 | 1; dmg: number; target: number; life: number; ring: boolean; syn: number; synLv: number };
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
  last: { result: 'win' | 'loss' | 'draw'; lost: number; flawless?: boolean } | null;
  /** This round's special event, if any. */
  event: BoardEvent | null;
  /** Your commander's fireball, once a fight: on its way (`t` seconds left) or bursting (`boom`). */
  skillUsed: boolean;
  strike: { x: number; y: number; t: number } | null;
  boom: { x: number; y: number; age: number } | null;
  /** The last buy that merged by itself: where, into which unit, and how many merges in a row (in Tactics, the
      star it reached). */
  lastMerge: { slot: Slot; id: number; combo: number; star?: Star } | null;
  /** The last unit summoned that did not merge, to pop it in. */
  lastSummon: { slot: Slot; id: number } | null;
  /** Fusion: the auto-merge, bought once a run (`buyAutoMerge`); without it you merge by dragging. */
  autoMerge: boolean;
  wins: number;
  /** Enemy units beaten, all told (for the profile's totals). */
  kills: number;
  events: string[];
};

let nextId = 1;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const worldUp = (w: number) => 1 + (w - 1) * 0.25;

export const pieceAt = (b: BoardGame, s: Slot) => b.army.find((p) => p.slot.c === s.c && p.slot.r === s.r);
export const inBoard = (s: Slot) => s.c >= 0 && s.c < COLS && s.r >= 0 && s.r < ROWS;
/** Your half: the lower four rows. */
/** The corners where the commanders stand: yours at the lower right, the rival's at the upper left. */
export const isCorner = (s: Slot) => (s.c === COLS - 1 && s.r === ROWS - 1) || (s.c === 0 && s.r === 0);
export const homeCell = (s: Slot) => inBoard(s) && s.r >= HOME_ROW && !isCorner(s);
/** The first free cell of your half, from the front row back. */
function freeCell(b: BoardGame): Slot | null {
  for (let r = HOME_ROW; r < ROWS; r++) for (const c of [2, 3, 1, 4, 0, 5]) if (homeCell({ c, r }) && !pieceAt(b, { c, r })) return { c, r };
  return null;
}
/** What a step of a cast costs in the shop, and gives back when sold. */
export const priceOf = (tier: Tier, cast: number, variant: Variant = 'fusion') => Math.max(1, Math.round((variant === 'tactics' ? TACTICS.price[tier] : PRICE[Math.min(2, tier)]) * castPower(cast)));
export const saleOf = (p: Piece, variant: Variant = 'fusion') =>
  variant === 'tactics'
    ? Math.max(1, Math.floor((priceOf(p.tier, p.cast, 'tactics') * TACTICS.copies ** (starOf(p) - 1)) / 2))
    : Math.max(1, Math.floor((TIER_VALUE[p.tier] * castPower(p.cast)) / 2));

export function newBoard(world: number, casts: number, variant: Variant = 'fusion'): BoardGame {
  const b: BoardGame = {
    world, variant, casts: Math.max(1, casts), round: 1, lives: LIVES, gold: Math.round(8 * castPower(world)), phase: 'prep',
    army: [], shop: [], wave: enemyWave(world, 1), fighters: [], shots: [], time: 0, last: null, wins: 0, kills: 0, events: [], event: null, skillUsed: false, strike: null, boom: null, lastMerge: null, lastSummon: null, autoMerge: false,
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
      const cast = Math.random() < 0.5 ? b.casts : 1 + Math.floor(Math.random() * b.casts);
      return { tier: tier as Tier, cast, price: priceOf(tier as Tier, cast, 'tactics') };
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

export function buy(b: BoardGame, i: number) {
  const offer = b.shop[i];
  if (b.phase !== 'prep' || !offer || b.gold < offer.price) return false;
  if (b.variant === 'tactics') return buyTactics(b, i, offer);
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
  if (!twin) {
    const p = { id: nextId++, tier, cast, slot: freeCell(b)! };
    b.army.push(p);
    b.lastSummon = { slot: p.slot, id: p.id };
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

/** Fusion has no shop: the summon button drops a unit straight onto your half for a set price, nearly always a bug,
    now and then a ticket and, from round 4, a legacy, of the latest world's cast six times in ten and any opened
    one otherwise; it merges with its twin at once. */
export const SUMMON = { price: 1.5, ticket: 0.25, legacy: 0.06, latest: 0.6 };
/** The auto-merge's price, once a run: from then on a unit summoned next to its twin merges by itself, and every
    pair already on the board merges at once. */
export const AUTO_MERGE = { price: 3 };
export const autoMergePrice = (b: BoardGame) => Math.round(AUTO_MERGE.price * castPower(b.world));
export function buyAutoMerge(b: BoardGame) {
  if (b.variant !== 'fusion' || b.phase !== 'prep' || b.autoMerge || b.gold < autoMergePrice(b)) return false;
  b.gold -= autoMergePrice(b);
  b.autoMerge = true;
  // The pairs already on the board merge at once (the first one found, then on up).
  let combo = 0;
  let last: Piece | undefined;
  for (;;) {
    const p = b.army.find((x) => b.army.some((y) => y !== x && y.tier === x.tier && y.cast === x.cast && x.tier < maxTier(x.cast)));
    if (!p) break;
    const q = b.army.find((y) => y !== p && y.tier === p.tier && y.cast === p.cast)!;
    b.army = b.army.filter((y) => y !== q);
    p.tier = (p.tier + 1) as Tier;
    combo += 1;
    last = p;
  }
  if (last) { b.lastMerge = { slot: last.slot, id: last.id, combo }; b.events.push('merge'); }
  return true;
}
export const summonPrice = (b: BoardGame) => Math.max(1, Math.round(SUMMON.price * castPower(b.world)));
export function summon(b: BoardGame): 'ok' | 'gold' | 'full' | 'none' {
  if (b.phase !== 'prep' || b.variant !== 'fusion') return 'none';
  if (b.gold < summonPrice(b)) return 'gold';
  if (b.army.length >= armyCap(b.round) || !freeCell(b)) return 'full';
  b.gold -= summonPrice(b);
  const roll = Math.random();
  const tier: Tier = b.round >= 4 && roll < SUMMON.legacy ? 2 : roll < SUMMON.legacy + SUMMON.ticket ? 1 : 0;
  const cast = Math.random() < SUMMON.latest ? b.casts : 1 + Math.floor(Math.random() * b.casts);
  b.events.push('summon');
  placeFusion(b, tier, cast);
  return 'ok';
}

/** Tactics: a card bought makes three copies of the same character at the same star with two on the board? They
    become one, a star up, where the first one stood (and on up when that makes three of the next star). */
function buyTactics(b: BoardGame, i: number, offer: NonNullable<Offer>) {
  const same = (p: Piece, star: Star) => p.tier === offer.tier && p.cast === offer.cast && starOf(p) === star;
  const pair = b.army.filter((p) => same(p, 1));
  if (pair.length < TACTICS.copies - 1 && b.army.length >= armyCap(b.round)) return false;
  const at = pair.length >= TACTICS.copies - 1 ? null : freeCell(b);
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
  b.gold += saleOf(p, b.variant);
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

function fighter(side: 0 | 1, tier: Tier, cast: number, x: number, y: number, mult0: number, id = nextId++, syn = 0, synLv = 0, event: BoardEvent | null = null, star: Star = 1): Fighter {
  const st = TIER_STATS[tier];
  const mult = mult0 * TACTICS.star[star - 1];
  const f = { syn, synLv };
  const hp = Math.round(st.hp * mult * (1 + synV(f, 1)) * (event === 'giants' ? 1.4 : 1));
  return {
    id, side, tier, cast, star, x, y, hp, maxHp: hp, dmg: st.dmg * mult * (1 + synV(f, 9)), rate: st.rate * (1 + synV(f, 6)) * (event === 'frenzy' ? 1.3 : 1), range: st.range, speed: st.speed, r: st.r,
    splash: st.splash ?? 0, ranged: !!st.ranged, cd: rand(0.1, 0.6), ring: RING.every * 0.6, target: -1, retarget: 0, dead: false,
    face: side === 0 ? 1 : -1, step: Math.random() * 4, swing: 0, hit: 0, syn, synLv, burn: 0, burnDps: 0, slow: 0, slowBy: 0,
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
  const lv = Object.fromEntries(synergies(b).map((x) => [x.cast, x.lv]));
  b.fighters = b.army.map((p) => { const at = cellCentre(p.slot); return fighter(0, p.tier, p.cast, at.x, at.y, castPower(p.cast), p.id, lv[p.cast] ? p.cast : 0, lv[p.cast] ?? 0, b.event, starOf(p)); });
  const grow = castPower(b.world) * (1 + WAVE.tough * (b.world - 1)) * (b.variant === 'tactics' ? TACTICS.wave : 1);
  for (const w of waveSpots(b)) b.fighters.push(fighter(1, w.tier, b.world, w.x, w.y, grow, nextId++, 0, 0, b.event));
  b.shots = [];
  b.skillUsed = false;
  b.strike = null;
  b.boom = null;
  b.time = 0;
  b.phase = 'fight';
  b.events.push('fight');
  return true;
}

const alive = (b: BoardGame, side: 0 | 1) => b.fighters.filter((f) => !f.dead && f.side === side);
const byId = (b: BoardGame, id: number) => b.fighters.find((f) => f.id === id && !f.dead);

function damage(b: BoardGame, f: Fighter, dmg: number) {
  if (f.dead) return;
  // The haunted servers dodge; the mud takes less.
  if (synV(f, 8) && Math.random() < synV(f, 8)) return;
  f.hp -= dmg * (1 - synV(f, 4));
  f.hit = 0.15;
  if (f.hp <= 0) { f.dead = true; if (f.side === 1) b.kills += 1; b.events.push(f.side === 0 ? 'fall' : 'kill'); }
}

/** A blow landing, with the attacker's synergy: fire burns, ice slows, the Forge arcs to one more. */
function land(b: BoardGame, from: { syn: number; synLv: number }, t: Fighter, dmg: number) {
  damage(b, t, dmg);
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

function strike(b: BoardGame, f: Fighter, t: Fighter) {
  if (f.ranged) {
    const d = Math.hypot(t.x - f.x, t.y - f.y) || 1;
    b.shots.push({ x: f.x, y: f.y - 8, vx: ((t.x - f.x) / d) * 260, vy: ((t.y - f.y) / d) * 260, side: f.side, dmg: f.dmg, target: t.id, life: 2, ring: false, syn: f.syn, synLv: f.synLv });
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

/** One step of the fight: every unit goes for the nearest foe, walks up to it and strikes; it ends when one side
    is gone or the time is up. */
export function updateBoard(b: BoardGame, dt: number) {
  b.events = [];
  if (b.phase !== 'fight') return;
  b.time += dt;
  if (b.boom) { b.boom.age += dt; if (b.boom.age > 0.5) b.boom = null; }
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
    f.slow = Math.max(0, f.slow - dt);
    if (f.slow <= 0) f.slowBy = 0;
    if (synV(f, 5)) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * synV(f, 5) * dt);
    // Slowed by ice: it walks and strikes 30% (45%) slower.
    const slowK = 1 - f.slowBy;
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
  const live = b.fighters.filter((f) => !f.dead);
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
  // The round's result: a loss costs a life plus one for each two enemy steps still standing (four at most).
  if (!theirs && mine) { b.last = { result: 'win', lost: 0, flawless: b.fighters.every((f) => f.side === 1 || !f.dead) }; b.wins += 1; }
  else {
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
  return (b.last?.flawless ? Math.round(3 * castPower(b.world)) : 0) + (won && b.event === 'bounty' ? roundGold(b.world, true) : 0);
}
const EVENTS: BoardEvent[] = ['gold', 'frenzy', 'giants', 'bounty'];

export function nextRound(b: BoardGame) {
  if (b.phase !== 'result') return;
  const won = b.last?.result === 'win';
  b.gold += roundBonus(b);
  if (b.round < ROUNDS) b.round += 1;
  b.gold += roundGold(b.world, won);
  // Every third round is a special one (never the last, which is the final boss's).
  b.event = b.round % EVENT_EVERY === 0 && b.round < ROUNDS ? EVENTS[Math.floor(Math.random() * EVENTS.length)] : null;
  if (b.event === 'gold') b.gold += Math.round(6 * castPower(b.world));
  b.fighters = [];
  b.shots = [];
  b.phase = 'prep';
  b.wave = enemyWave(b.world, b.round);
  rollShop(b);
}

/** The coins a board run pays: for every fight won, and a bonus for clearing the world. */
export const boardCoins = (b: BoardGame) => Math.round((30 * b.wins + (b.phase === 'won' ? 150 : 0)) * worldUp(b.world));
