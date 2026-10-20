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

/** The cast's five steps, each made of two of the one before. */
export type Tier = 0 | 1 | 2 | 3 | 4;
export const TIER_KIND = ['bug', 'ticket', 'legacy', 'boss', 'boss'] as const;
export const MAX_TIER: Tier = 4;
/** What each step is worth in gold before its cast's strength (a sale gives half back). */
export const TIER_VALUE = [1, 2, 4, 8, 16];
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
export const WAVE = { base: 0.88, world: 0.03, tough: 0.008 };
/** Your half of the board: the lower four rows. */
export const HOME_ROW = 4;

export type Slot = { c: number; r: number };
/** A unit you own, between fights: its step, the world its cast comes from, and its cell. */
export type Piece = { id: number; tier: Tier; cast: number; slot: Slot };
/** A unit in a fight, yours (side 0) or the enemy's (side 1). */
export type Fighter = {
  id: number;
  side: 0 | 1;
  tier: Tier;
  cast: number;
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
};
export type Shot = { x: number; y: number; vx: number; vy: number; side: 0 | 1; dmg: number; target: number; life: number; ring: boolean };
export type Offer = { tier: Tier; cast: number; price: number } | null;
export type BoardPhase = 'prep' | 'fight' | 'result' | 'over' | 'won';

export type BoardGame = {
  world: number;
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
  /** The last fight: won, lost or drawn, and the lives it cost. */
  last: { result: 'win' | 'loss' | 'draw'; lost: number } | null;
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
export const homeCell = (s: Slot) => inBoard(s) && s.r >= HOME_ROW;
/** The first free cell of your half, from the front row back. */
function freeCell(b: BoardGame): Slot | null {
  for (let r = HOME_ROW; r < ROWS; r++) for (const c of [2, 3, 1, 4, 0, 5]) if (!pieceAt(b, { c, r })) return { c, r };
  return null;
}
/** What a step of a cast costs in the shop, and gives back when sold. */
export const priceOf = (tier: Tier, cast: number) => Math.max(1, Math.round(PRICE[Math.min(2, tier)] * castPower(cast)));
export const saleOf = (p: Piece) => Math.max(1, Math.floor((TIER_VALUE[p.tier] * castPower(p.cast)) / 2));

export function newBoard(world: number, casts: number): BoardGame {
  const b: BoardGame = {
    world, casts: Math.max(1, casts), round: 1, lives: LIVES, gold: Math.round(8 * castPower(world)), phase: 'prep',
    army: [], shop: [], wave: enemyWave(world, 1), fighters: [], shots: [], time: 0, last: null, wins: 0, kills: 0, events: [],
  };
  // You start with a bug of the latest cast on the board.
  b.army.push({ id: nextId++, tier: 0, cast: b.casts, slot: { c: 2, r: ROWS - 2 } });
  rollShop(b);
  return b;
}

/** Four cards: mostly bugs and tickets (a legacy now and then from round 4), from any cast you have opened, the
    latest more often. */
function rollShop(b: BoardGame) {
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
  if (b.phase !== 'prep' || !offer || b.gold < offer.price || b.army.length >= armyCap(b.round)) return false;
  const at = freeCell(b);
  if (!at) return false;
  b.gold -= offer.price;
  b.shop[i] = null;
  b.army.push({ id: nextId++, tier: offer.tier, cast: offer.cast, slot: at });
  b.events.push('buy');
  return true;
}

/** Sells a unit for half what it is worth. */
export function sell(b: BoardGame, from: Slot) {
  const p = pieceAt(b, from);
  if (b.phase !== 'prep' || !p) return false;
  b.army = b.army.filter((q) => q !== p);
  b.gold += saleOf(p);
  b.events.push('sell');
  return true;
}

export const canMerge = (p: Piece, q: Piece) => p !== q && p.tier === q.tier && p.cast === q.cast && p.tier < MAX_TIER;

/** Drags a unit onto a cell of your half: onto its twin (same step, same cast) it merges into the next step, onto another it
    swaps, onto nothing it moves. */
export function moveUnit(b: BoardGame, from: Slot, to: Slot): 'merged' | 'swapped' | 'moved' | 'none' {
  const p = pieceAt(b, from);
  if (b.phase !== 'prep' || !p || !homeCell(to) || (from.c === to.c && from.r === to.r)) return 'none';
  const q = pieceAt(b, to);
  if (q && canMerge(p, q)) {
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

function fighter(side: 0 | 1, tier: Tier, cast: number, x: number, y: number, mult: number, id = nextId++): Fighter {
  const st = TIER_STATS[tier];
  const hp = Math.round(st.hp * mult);
  return {
    id, side, tier, cast, x, y, hp, maxHp: hp, dmg: st.dmg * mult, rate: st.rate, range: st.range, speed: st.speed, r: st.r,
    splash: st.splash ?? 0, ranged: !!st.ranged, cd: rand(0.1, 0.6), ring: RING.every * 0.6, target: -1, retarget: 0, dead: false,
    face: side === 0 ? 1 : -1, step: Math.random() * 4, swing: 0, hit: 0,
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
  for (const r of [3, 2, 1, 0]) for (const c of [2, 3, 1, 4, 0, 5]) cells.push({ c, r });
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
  b.fighters = b.army.map((p) => { const at = cellCentre(p.slot); return fighter(0, p.tier, p.cast, at.x, at.y, castPower(p.cast), p.id); });
  const grow = castPower(b.world) * (1 + WAVE.tough * (b.world - 1));
  for (const w of waveSpots(b)) b.fighters.push(fighter(1, w.tier, b.world, w.x, w.y, grow));
  b.shots = [];
  b.time = 0;
  b.phase = 'fight';
  b.events.push('fight');
  return true;
}

const alive = (b: BoardGame, side: 0 | 1) => b.fighters.filter((f) => !f.dead && f.side === side);
const byId = (b: BoardGame, id: number) => b.fighters.find((f) => f.id === id && !f.dead);

function damage(b: BoardGame, f: Fighter, dmg: number) {
  if (f.dead) return;
  f.hp -= dmg;
  f.hit = 0.15;
  if (f.hp <= 0) { f.dead = true; if (f.side === 1) b.kills += 1; b.events.push(f.side === 0 ? 'fall' : 'kill'); }
}

function strike(b: BoardGame, f: Fighter, t: Fighter) {
  if (f.ranged) {
    const d = Math.hypot(t.x - f.x, t.y - f.y) || 1;
    b.shots.push({ x: f.x, y: f.y - 8, vx: ((t.x - f.x) / d) * 260, vy: ((t.y - f.y) / d) * 260, side: f.side, dmg: f.dmg, target: t.id, life: 2, ring: false });
    b.events.push('throw');
    return;
  }
  if (f.splash) {
    for (const o of alive(b, t.side)) if (Math.hypot(o.x - t.x, o.y - t.y) <= f.splash + o.r) damage(b, o, o === t ? f.dmg : f.dmg * 0.6);
    b.events.push('slam');
  } else {
    damage(b, t, f.dmg);
    b.events.push('bite');
  }
}

/** One step of the fight: every unit goes for the nearest foe, walks up to it and strikes; it ends when one side
    is gone or the time is up. */
export function updateBoard(b: BoardGame, dt: number) {
  b.events = [];
  if (b.phase !== 'fight') return;
  b.time += dt;
  for (const f of b.fighters) {
    f.hit = Math.max(0, f.hit - dt);
    f.swing = Math.max(0, f.swing - dt);
    if (f.dead) continue;
    f.cd -= dt;
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
      const step = Math.min(f.speed * dt, d - f.range);
      f.x += (dx / d) * step;
      f.y += (dy / d) * step;
      f.step += step / 14;
    } else if (f.cd <= 0) {
      f.cd = 1 / f.rate;
      f.swing = 0.3;
      strike(b, f, t);
    }
    if (f.tier === 4) {
      f.ring -= dt;
      if (f.ring <= 0) {
        f.ring = RING.every;
        for (let i = 0; i < RING.n; i++) {
          const a = (i / RING.n) * Math.PI * 2;
          b.shots.push({ x: f.x, y: f.y, vx: Math.cos(a) * RING.speed, vy: Math.sin(a) * RING.speed, side: f.side, dmg: RING.dmg * (f.dmg / TIER_STATS[4].dmg), target: -1, life: 2.2, ring: true });
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
    if (hit && Math.hypot(hit.x - s.x, hit.y - s.y) < hit.r + 6) { damage(b, hit, s.dmg); s.life = 0; }
  }
  b.shots = b.shots.filter((s) => s.life > 0);
  const mine = alive(b, 0).length;
  const theirs = alive(b, 1).length;
  if (mine && theirs && b.time < FIGHT_TIME) return;
  // The round's result: a loss costs a life plus one for each two enemy steps still standing (four at most).
  if (!theirs && mine) { b.last = { result: 'win', lost: 0 }; b.wins += 1; }
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
export function nextRound(b: BoardGame) {
  if (b.phase !== 'result') return;
  const won = b.last?.result === 'win';
  if (b.round < ROUNDS) b.round += 1;
  b.gold += roundGold(b.world, won);
  b.fighters = [];
  b.shots = [];
  b.phase = 'prep';
  b.wave = enemyWave(b.world, b.round);
  rollShop(b);
}

/** The coins a board run pays: for every fight won, and a bonus for clearing the world. */
export const boardCoins = (b: BoardGame) => Math.round((30 * b.wins + (b.phase === 'won' ? 150 : 0)) * worldUp(b.world));
