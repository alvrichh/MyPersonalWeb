import { WORLDS, type Look } from './world';

/* «Sprint Planning», the board mode: you are the bugs. Between fights you buy bugs of the casts you have opened,
   lay them anywhere on the board and merge two of a kind into the next one up the cast (two bugs make a ticket,
   two tickets a legacy, two legacy a room-6 boss, two of those the world's final boss); then the hero comes down
   from the top to clear them, a little stronger every round, and the fight plays out on its own. Ten rounds a
   world; each world won opens its cast in the shop, and a later world's cast is stronger (and dearer) than an
   earlier one's. No DOM here, so it can be simulated in Node; drawn by `boardView.ts`. */

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

/** The hero: its health, its arrows and, from a few rounds in, a sword sweep round it and a spread of arrows. */
export const HERO = { hp: 300, dmg: 16, rate: 2.2, range: 170, speed: 95, r: 16, perRound: 0.32, perWorld: 0.26, sword: 3, spread: 6, swordReach: 58 };

export type Slot = { c: number; r: number };
/** A unit you own, between fights: its step, the world its cast comes from, and its cell. */
export type Piece = { id: number; tier: Tier; cast: number; slot: Slot };
/** A unit in a fight. */
export type Fighter = {
  id: number;
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
  dead: boolean;
  /** Only to be seen: facing, the walk cycle, an attack and a hit. */
  face: number;
  step: number;
  swing: number;
  hit: number;
};
export type Hero = {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  dmg: number;
  rate: number;
  range: number;
  speed: number;
  r: number;
  cd: number;
  sword: number;
  spread: boolean;
  swordOn: boolean;
  dead: boolean;
  /** Coming down from the top before it fights. */
  enter: number;
  face: number;
  step: number;
  shoot: number;
  slash: number;
  hit: number;
};
/** A shot: the bugs' at the hero, or the hero's arrows at the bugs. */
export type Shot = { x: number; y: number; vx: number; vy: number; mine: boolean; dmg: number; life: number; ring: boolean };
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
  fighters: Fighter[];
  hero: Hero | null;
  shots: Shot[];
  time: number;
  /** The last fight: won or lost, and the lives it cost. */
  last: { result: 'win' | 'loss'; lost: number } | null;
  wins: number;
  /** Heroes beaten (for the profile's totals). */
  kills: number;
  events: string[];
};

let nextId = 1;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const worldUp = (w: number) => 1 + (w - 1) * 0.25;

export const pieceAt = (b: BoardGame, s: Slot) => b.army.find((p) => p.slot.c === s.c && p.slot.r === s.r);
export const inBoard = (s: Slot) => s.c >= 0 && s.c < COLS && s.r >= 0 && s.r < ROWS;
/** The first free cell, from the bottom row up (the hero comes in at the top). */
function freeCell(b: BoardGame): Slot | null {
  for (let r = ROWS - 1; r >= 0; r--) for (const c of [2, 3, 1, 4, 0, 5]) if (!pieceAt(b, { c, r })) return { c, r };
  return null;
}
/** What a step of a cast costs in the shop, and gives back when sold. */
export const priceOf = (tier: Tier, cast: number) => Math.max(1, Math.round(PRICE[Math.min(2, tier)] * castPower(cast)));
export const saleOf = (p: Piece) => Math.max(1, Math.floor((TIER_VALUE[p.tier] * castPower(p.cast)) / 2));

export function newBoard(world: number, casts: number): BoardGame {
  const b: BoardGame = {
    world, casts: Math.max(1, casts), round: 1, lives: LIVES, gold: 8, phase: 'prep',
    army: [], shop: [], fighters: [], hero: null, shots: [], time: 0, last: null, wins: 0, kills: 0, events: [],
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
export function buy(b: BoardGame, i: number) {
  const offer = b.shop[i];
  if (b.phase !== 'prep' || !offer || b.gold < offer.price) return false;
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

/** Drags a unit onto a cell: onto its twin (same step, same cast) it merges into the next step, onto another it
    swaps, onto nothing it moves. */
export function moveUnit(b: BoardGame, from: Slot, to: Slot): 'merged' | 'swapped' | 'moved' | 'none' {
  const p = pieceAt(b, from);
  if (b.phase !== 'prep' || !p || !inBoard(to) || (from.c === to.c && from.r === to.r)) return 'none';
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

function fighter(p: Piece): Fighter {
  const s = TIER_STATS[p.tier];
  const m = castPower(p.cast);
  const at = cellCentre(p.slot);
  const hp = Math.round(s.hp * m);
  return {
    id: p.id, tier: p.tier, cast: p.cast, x: at.x, y: at.y, hp, maxHp: hp, dmg: s.dmg * m, rate: s.rate, range: s.range,
    speed: s.speed, r: s.r, splash: s.splash ?? 0, ranged: !!s.ranged, cd: rand(0.2, 0.8), ring: RING.every * 0.6, dead: false,
    face: 1, step: Math.random() * 4, swing: 0, hit: 0,
  };
}

/** The hero for a round of a world: tougher every round and every world, with the sword from round `HERO.sword`
    and the spread of arrows from round `HERO.spread`; the last round's hero is twice as tough. */
export function heroFor(world: number, round: number): Hero {
  const grow = (1 + HERO.perRound * (round - 1)) * (1 + HERO.perWorld * (world - 1)) * (round === ROUNDS ? 2 : 1);
  const hp = Math.round(HERO.hp * grow);
  return {
    x: BOARD_W / 2, y: -30, hp, maxHp: hp, dmg: HERO.dmg * Math.sqrt(grow), rate: HERO.rate, range: HERO.range, speed: HERO.speed,
    r: HERO.r, cd: 0.6, sword: 1.5, spread: round >= HERO.spread, swordOn: round >= HERO.sword, dead: false, enter: 1,
    face: 1, step: 0, shoot: 0, slash: 0, hit: 0,
  };
}

/** Sets the fight up: your bugs as placed, the hero above the board, coming in. */
export function startFight(b: BoardGame) {
  if (b.phase !== 'prep' || !b.army.length) return false;
  b.fighters = b.army.map(fighter);
  b.hero = heroFor(b.world, b.round);
  b.shots = [];
  b.time = 0;
  b.phase = 'fight';
  b.events.push('fight');
  return true;
}

const alive = (b: BoardGame) => b.fighters.filter((f) => !f.dead);

function hurtBug(b: BoardGame, f: Fighter, dmg: number) {
  if (f.dead) return;
  f.hp -= dmg;
  f.hit = 0.15;
  if (f.hp <= 0) { f.dead = true; b.events.push('fall'); }
}
function hurtHero(b: BoardGame, dmg: number) {
  const h = b.hero;
  if (!h || h.dead || h.enter > 0) return;
  h.hp -= dmg;
  h.hit = 0.12;
  if (h.hp <= 0) { h.dead = true; b.kills += 1; b.events.push('kill'); }
}

/** One step of the fight: the hero comes down, keeps its distance and shoots the nearest bug (and sweeps its
    sword round it); every bug goes for the hero and strikes. It ends when the hero falls, every bug is gone or
    the time is up. */
export function updateBoard(b: BoardGame, dt: number) {
  b.events = [];
  const h = b.hero;
  if (b.phase !== 'fight' || !h) return;
  b.time += dt;
  h.hit = Math.max(0, h.hit - dt);
  h.shoot = Math.max(0, h.shoot - dt);
  h.slash = Math.max(0, h.slash - dt);
  const bugs = alive(b);
  if (!h.dead) {
    if (h.enter > 0) {
      // Down from the top.
      h.enter -= dt;
      h.y += 70 * dt;
      h.step += dt * 6;
    } else {
      let near: Fighter | undefined;
      let best = Infinity;
      for (const f of bugs) { const d = Math.hypot(f.x - h.x, f.y - h.y); if (d < best) { best = d; near = f; } }
      if (near) {
        const dx = near.x - h.x, dy = near.y - h.y;
        const d = Math.hypot(dx, dy) || 1;
        if (Math.abs(dx) > 4) h.face = dx > 0 ? 1 : -1;
        // It backs off from a bug too close (unless its sword is ready), and closes in on one too far.
        const want = h.swordOn && h.sword <= 0.3 ? 30 : h.range * 0.65;
        const move = d < want - 10 ? -1 : d > want + 10 ? 1 : 0;
        if (move) {
          h.x += (dx / d) * h.speed * move * dt;
          h.y += (dy / d) * h.speed * move * dt;
          h.step += (h.speed * dt) / 14;
        }
        h.cd -= dt;
        if (h.cd <= 0 && d <= h.range) {
          h.cd = 1 / h.rate;
          h.shoot = 0.25;
          const a0 = Math.atan2(dy, dx);
          for (const off of h.spread ? [-0.22, 0, 0.22] : [0]) {
            b.shots.push({ x: h.x, y: h.y - 6, vx: Math.cos(a0 + off) * 360, vy: Math.sin(a0 + off) * 360, mine: false, dmg: h.dmg, life: 1.2, ring: false });
          }
          b.events.push('shoot');
        }
        if (h.swordOn) {
          h.sword -= dt;
          if (h.sword <= 0 && best < HERO.swordReach + near.r) {
            h.sword = 2.4;
            h.slash = 0.3;
            for (const f of bugs) if (Math.hypot(f.x - h.x, f.y - h.y) < HERO.swordReach + f.r) hurtBug(b, f, h.dmg * 1.6);
            b.events.push('slash');
          }
        }
      }
      h.x = Math.max(h.r, Math.min(BOARD_W - h.r, h.x));
      h.y = Math.max(h.r, Math.min(BOARD_H - h.r, h.y));
    }
  }
  for (const f of b.fighters) {
    f.hit = Math.max(0, f.hit - dt);
    f.swing = Math.max(0, f.swing - dt);
    if (f.dead || h.dead || h.enter > 0) continue;
    f.cd -= dt;
    const dx = h.x - f.x;
    const dy = h.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    if (Math.abs(dx) > 4) f.face = dx > 0 ? 1 : -1;
    if (d > f.range + h.r * 0.6) {
      const step = Math.min(f.speed * dt, d - f.range);
      f.x += (dx / d) * step;
      f.y += (dy / d) * step;
      f.step += step / 14;
    } else if (f.cd <= 0) {
      f.cd = 1 / f.rate;
      f.swing = 0.3;
      if (f.ranged) {
        b.shots.push({ x: f.x, y: f.y - 8, vx: (dx / d) * 260, vy: (dy / d) * 260, mine: true, dmg: f.dmg, life: 2, ring: false });
        b.events.push('throw');
      } else {
        hurtHero(b, f.dmg);
        b.events.push(f.splash ? 'slam' : 'bite');
      }
    }
    if (f.tier === 4) {
      f.ring -= dt;
      if (f.ring <= 0) {
        f.ring = RING.every;
        for (let i = 0; i < RING.n; i++) {
          const a = (i / RING.n) * Math.PI * 2;
          b.shots.push({ x: f.x, y: f.y, vx: Math.cos(a) * RING.speed, vy: Math.sin(a) * RING.speed, mine: true, dmg: RING.dmg * castPower(f.cast), life: 2.2, ring: true });
        }
        f.swing = 0.5;
        b.events.push('ring');
      }
    }
  }
  // Bugs push one another apart and stay on the board.
  const live = alive(b);
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
    if (s.mine) {
      if (!h.dead && Math.hypot(h.x - s.x, h.y - s.y) < h.r + 6) { hurtHero(b, s.dmg); s.life = 0; }
    } else {
      const hit = live.find((f) => !f.dead && Math.hypot(f.x - s.x, f.y - s.y) < f.r + 5);
      if (hit) { hurtBug(b, hit, s.dmg); s.life = 0; }
    }
  }
  b.shots = b.shots.filter((s) => s.life > 0 && s.x > -40 && s.x < BOARD_W + 40 && s.y > -60 && s.y < BOARD_H + 40);
  const standing = alive(b).length;
  if (!h.dead && standing && b.time < FIGHT_TIME) return;
  // The round's result: the hero down is a win; the hero standing costs a life, and more the fitter it is.
  if (h.dead) { b.last = { result: 'win', lost: 0 }; b.wins += 1; }
  else {
    const lost = 1 + Math.round((Math.max(0, h.hp) / h.maxHp) * 2);
    b.last = { result: 'loss', lost };
    b.lives = Math.max(0, b.lives - lost);
  }
  b.phase = b.lives <= 0 ? 'over' : b.round >= ROUNDS && b.last.result === 'win' ? 'won' : 'result';
  b.events.push(b.phase === 'over' ? 'over' : b.phase === 'won' ? 'won' : b.last.result);
}

/** Gold each round, and the more after a win. */
export const GOLD = { round: 6, win: 2 };

/** On to the next round: gold (more after a win) and a fresh shop. Your bugs come back whole. The last round
    must be won: lose it and you play it again, while lives last. */
export function nextRound(b: BoardGame) {
  if (b.phase !== 'result') return;
  const won = b.last?.result === 'win';
  if (b.round < ROUNDS) b.round += 1;
  b.gold += GOLD.round + (won ? GOLD.win : 0);
  b.fighters = [];
  b.hero = null;
  b.shots = [];
  b.phase = 'prep';
  rollShop(b);
}

/** The coins a board run pays: for every hero beaten, and a bonus for clearing the world. */
export const boardCoins = (b: BoardGame) => Math.round((30 * b.wins + (b.phase === 'won' ? 150 : 0)) * worldUp(b.world));
