/*
 * Bug Hunter's rules, with no drawing and no DOM: an Archero-style room
 * shooter. You move to dodge; the moment you stand still you shoot the
 * nearest bug. Clear a room and its door opens to the next sprint; every
 * level up offers three skills. Sprints 5 and 10 are boss fights.
 *
 * Everything lives in a fixed 360 × 600 room; the renderer scales it to fit.
 */

export const W = 360;
export const H = 600;
export const WALL = 16;
export const ROOMS = 10;
const DOOR_HALF = 32;

export type Vec = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

export type SkillId = 'fire' | 'water' | 'leaf' | 'bolt' | 'spark' | 'ghost' | 'heart' | 'speed' | 'power' | 'double';
export const SKILLS: SkillId[] = ['fire', 'water', 'leaf', 'bolt', 'spark', 'ghost', 'heart', 'speed', 'power', 'double'];
const MAX_LEVEL: Record<SkillId, number> = {
  fire: 3, water: 3, leaf: 3, bolt: 3, spark: 3, ghost: 3, heart: 99, speed: 3, power: 3, double: 2,
};

export type EnemyKind = 'bug' | 'ticket' | 'legacy' | 'boss';

export type Enemy = {
  id: number;
  kind: EnemyKind;
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

export type Arrow = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  pierce: number;
  bounce: number;
  ghost: boolean;
  hits: Set<number>;
  life: number;
};

export type Orb = { x: number; y: number; vx: number; vy: number; r: number; dmg: number; life: number };
export type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string };
export type Zap = { pts: Vec[]; life: number };

export type Player = {
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  speed: number;
  inv: number;
  fire: number;
  moving: boolean;
  face: number;
};

export type Game = {
  room: number;
  phase: 'play' | 'levelup' | 'over' | 'won';
  player: Player;
  enemies: Enemy[];
  arrows: Arrow[];
  orbs: Orb[];
  particles: Particle[];
  zaps: Zap[];
  obstacles: Rect[];
  door: boolean;
  skills: Record<SkillId, number>;
  level: number;
  xp: number;
  xpNext: number;
  pendingLevels: number;
  choices: SkillId[];
  kills: number;
  time: number;
  shake: number;
  /** Things the page may want to react to this frame (banners, sounds). */
  events: ('clear' | 'boss' | 'hurt' | 'levelup' | 'room')[];
};

/* ------------------------------------------------------------------ helpers */

let nextId = 1;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
const inRect = (p: Vec, r: Rect, pad = 0) =>
  p.x > r.x - pad && p.x < r.x + r.w + pad && p.y > r.y - pad && p.y < r.y + r.h + pad;

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

/** True when a rack stands between two points. */
export function blocked(a: Vec, b: Vec, obstacles: Rect[]) {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 8);
  for (let i = 1; i < steps; i++) {
    const p = { x: a.x + ((b.x - a.x) * i) / steps, y: a.y + ((b.y - a.y) * i) / steps };
    if (obstacles.some((o) => inRect(p, o))) return true;
  }
  return false;
}

function keepInRoom(c: { x: number; y: number; r: number }, obstacles: Rect[]) {
  c.x = clamp(c.x, WALL + c.r, W - WALL - c.r);
  c.y = clamp(c.y, WALL + c.r, H - WALL - c.r);
  for (const o of obstacles) pushOut(c, o);
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

function wave(room: number): EnemyKind[] {
  if (isBossRoom(room)) return ['boss'];
  const kinds: EnemyKind[] = [];
  const bugs = 2 + Math.floor(room * 0.6);
  const tickets = Math.floor(room / 2);
  const legacy = room >= 3 ? Math.floor((room - 1) / 3) : 0;
  for (let i = 0; i < bugs; i++) kinds.push('bug');
  for (let i = 0; i < tickets; i++) kinds.push('ticket');
  for (let i = 0; i < legacy; i++) kinds.push('legacy');
  return kinds;
}

function makeEnemy(kind: EnemyKind, room: number, at: Vec, spawn = 0.7): Enemy {
  const tough = 1 + (room - 1) * 0.09;
  const base = {
    bug: { r: 12, hp: 40, speed: 72, dmg: 10, xp: 6 },
    ticket: { r: 14, hp: 60, speed: 46, dmg: 12, xp: 8 },
    legacy: { r: 20, hp: 170, speed: 34, dmg: 20, xp: 14 },
    boss: { r: 40, hp: room === 10 ? 2400 : 900, speed: 40, dmg: 22, xp: 70 },
  }[kind];
  const hp = Math.round(base.hp * (kind === 'boss' ? 1 : tough));
  return {
    id: nextId++,
    kind,
    x: at.x,
    y: at.y,
    r: base.r,
    hp,
    maxHp: hp,
    speed: base.speed,
    dmg: base.dmg,
    xp: base.xp,
    spawn,
    hit: 0,
    burn: 0,
    burnDps: 0,
    burnTick: 0,
    slow: 0,
    slowBy: 0,
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

function enterRoom(g: Game, room: number) {
  g.room = room;
  g.door = false;
  const layout = LAYOUT_FOR_ROOM[room - 1];
  g.obstacles = layout >= 0 ? LAYOUTS[layout] : [];
  g.arrows = [];
  g.orbs = [];
  g.zaps = [];
  g.enemies = [];
  g.player.x = W / 2;
  g.player.y = H - 70;
  for (const kind of wave(room)) {
    const at = kind === 'boss' ? { x: W / 2, y: H * 0.3 } : freeSpot(g, kind === 'legacy' ? 20 : 14);
    g.enemies.push(makeEnemy(kind, room, at, kind === 'boss' ? 1.2 : rand(0.5, 1.1)));
  }
  // A breather before each boss.
  if (isBossRoom(room)) g.player.hp = Math.min(g.player.maxHp, g.player.hp + Math.round(g.player.maxHp * 0.3));
  g.events.push(isBossRoom(room) ? 'boss' : 'room');
}

export function newGame(): Game {
  const g: Game = {
    room: 1,
    phase: 'play',
    player: { x: W / 2, y: H - 70, r: 15, hp: 100, maxHp: 100, speed: 150, inv: 0, fire: 0.4, moving: false, face: -Math.PI / 2 },
    enemies: [],
    arrows: [],
    orbs: [],
    particles: [],
    zaps: [],
    obstacles: [],
    door: false,
    skills: Object.fromEntries(SKILLS.map((s) => [s, 0])) as Record<SkillId, number>,
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
  enterRoom(g, 1);
  return g;
}

/* ------------------------------------------------------------------- skills */

function offerChoices(g: Game) {
  const open = SKILLS.filter((s) => g.skills[s] < MAX_LEVEL[s]);
  const pool = [...open];
  const picks: SkillId[] = [];
  while (picks.length < 3 && pool.length) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  g.choices = picks;
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

const damage = (g: Game) => 20 * (1 + 0.25 * g.skills.power);
const fireRate = (g: Game) => 2 * (1 + 0.28 * g.skills.speed);

function gainXp(g: Game, amount: number) {
  g.xp += amount;
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

function kill(g: Game, e: Enemy) {
  if (e.dead) return;
  e.dead = true;
  g.kills += 1;
  burst(g, e.x, e.y, ENEMY_COLOR[e.kind], e.kind === 'boss' ? 60 : 14, e.kind === 'boss' ? 260 : 140, e.kind === 'boss' ? 5 : 3);
  gainXp(g, e.xp);
  if (e.kind === 'boss') g.shake = 0.6;
  // Legacy code never dies quietly: it splits into two bugs.
  if (e.kind === 'legacy') {
    for (const side of [-1, 1]) {
      const bug = makeEnemy('bug', g.room, { x: e.x + side * 14, y: e.y }, 0.15);
      bug.hp = bug.maxHp = Math.round(bug.maxHp * 0.6);
      bug.xp = 3;
      g.enemies.push(bug);
    }
  }
}

function hurt(g: Game, e: Enemy, amount: number) {
  if (e.dead) return;
  e.hp -= amount;
  e.hit = 0.1;
  if (e.hp <= 0) kill(g, e);
}

function hitWithArrow(g: Game, e: Enemy, a: Arrow) {
  hurt(g, e, a.dmg);
  burst(g, a.x, a.y, '#ffffff', 4, 90, 2);
  if (g.skills.fire) {
    e.burn = 2;
    e.burnDps = 6 * g.skills.fire;
  }
  if (g.skills.water) {
    e.slow = 1.5;
    e.slowBy = 0.25 + 0.1 * g.skills.water;
  }
  // Lightning: the hit arcs on to the nearest bugs it hasn't touched yet.
  if (g.skills.bolt) {
    let from: Vec = e;
    const touched = new Set([e.id]);
    for (let i = 0; i < g.skills.bolt; i++) {
      let next: Enemy | undefined;
      let best = 130;
      for (const o of g.enemies) {
        if (o.dead || o.spawn > 0 || touched.has(o.id)) continue;
        const d = dist(from, o);
        if (d < best) { best = d; next = o; }
      }
      if (!next) break;
      touched.add(next.id);
      g.zaps.push({ pts: zigzag(from, next), life: 0.18 });
      hurt(g, next, a.dmg * 0.6);
      from = next;
    }
  }
}

function zigzag(a: Vec, b: Vec): Vec[] {
  const pts: Vec[] = [{ x: a.x, y: a.y }];
  const steps = 5;
  const nx = -(b.y - a.y);
  const ny = b.x - a.x;
  const len = Math.hypot(nx, ny) || 1;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const off = rand(-9, 9);
    pts.push({ x: a.x + (b.x - a.x) * t + (nx / len) * off, y: a.y + (b.y - a.y) * t + (ny / len) * off });
  }
  pts.push({ x: b.x, y: b.y });
  return pts;
}

function shoot(g: Game, target: Enemy) {
  const p = g.player;
  const angle = Math.atan2(target.y - p.y, target.x - p.x);
  p.face = angle;
  const speed = 430;
  const fan = g.skills.leaf;
  const angles = [angle];
  for (let i = 1; i <= fan; i++) angles.push(angle - i * 0.26, angle + i * 0.26);
  const side = g.skills.double ? [-6, 6] : [0];
  for (const a of angles) {
    for (const offset of side) {
      const ox = Math.cos(a + Math.PI / 2) * offset;
      const oy = Math.sin(a + Math.PI / 2) * offset;
      g.arrows.push({
        x: p.x + ox,
        y: p.y + oy,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        dmg: damage(g) * (g.skills.double === 2 ? 0.85 : 1),
        pierce: g.skills.ghost,
        bounce: g.skills.spark,
        ghost: g.skills.ghost > 0,
        hits: new Set(),
        life: 1.6,
      });
    }
  }
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
      g.orbs.push({ x: e.x, y: e.y, vx: ux * 150, vy: uy * 150, r: 6, dmg: e.dmg, life: 4 });
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
  e.x += mx * e.speed * slowFactor * dt;
  e.y += my * e.speed * slowFactor * dt;
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
      g.orbs.push({ x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 7, dmg: 14, life: 5 });
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
      g.enemies.push(makeEnemy('bug', g.room, { x: clamp(e.x + side * 60, 40, W - 40), y: e.y + 30 }, 0.6));
    }
  }
}

function updateArrow(g: Game, a: Arrow, dt: number): boolean {
  const px = a.x;
  const py = a.y;
  a.x += a.vx * dt;
  a.y += a.vy * dt;
  a.life -= dt;
  if (a.life <= 0) return false;

  // Walls and racks: bounce (sparks), pass (ghost) or stop.
  const hitWallX = a.x < WALL || a.x > W - WALL;
  const hitWallY = a.y < WALL || a.y > H - WALL;
  if (hitWallX || hitWallY) {
    if (a.bounce > 0) {
      a.bounce -= 1;
      if (hitWallX) { a.vx = -a.vx; a.x = clamp(a.x, WALL, W - WALL); }
      if (hitWallY) { a.vy = -a.vy; a.y = clamp(a.y, WALL, H - WALL); }
      burst(g, a.x, a.y, '#ffd27a', 3, 80, 2);
    } else {
      burst(g, a.x, a.y, '#ffffff', 2, 60, 1.5);
      return false;
    }
  }
  if (!a.ghost) {
    for (const o of g.obstacles) {
      if (!inRect(a, o)) continue;
      if (a.bounce > 0) {
        a.bounce -= 1;
        const wasInX = px > o.x && px < o.x + o.w;
        if (wasInX) a.vy = -a.vy; else a.vx = -a.vx;
        a.x = px;
        a.y = py;
        burst(g, a.x, a.y, '#ffd27a', 3, 80, 2);
      } else {
        burst(g, a.x, a.y, '#ffffff', 2, 60, 1.5);
        return false;
      }
    }
  }
  for (const e of g.enemies) {
    if (e.dead || e.spawn > 0 || a.hits.has(e.id)) continue;
    if (Math.hypot(a.x - e.x, a.y - e.y) > e.r + 4) continue;
    a.hits.add(e.id);
    hitWithArrow(g, e, a);
    if (a.pierce > 0) a.pierce -= 1;
    else return false;
  }
  return true;
}

export type Input = { x: number; y: number };

export function update(g: Game, dt: number, input: Input) {
  g.events = [];
  if (g.phase !== 'play') return;
  g.time += dt;
  g.shake = Math.max(0, g.shake - dt);
  const p = g.player;

  // Move, or stand still and shoot.
  const len = Math.hypot(input.x, input.y);
  p.moving = len > 0.15;
  if (p.moving) {
    const k = Math.min(1, len);
    p.x += (input.x / len) * k * p.speed * dt;
    p.y += (input.y / len) * k * p.speed * dt;
    p.face = Math.atan2(input.y, input.x);
  }
  const atDoor = g.door && Math.abs(p.x - W / 2) < DOOR_HALF - 4 && p.y - p.r < WALL + 6;
  if (atDoor) {
    if (g.room === ROOMS) {
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

  const fighting = g.enemies.filter((e) => !e.dead && e.spawn <= 0);
  p.fire = Math.max(0, p.fire - dt);
  if (!p.moving && fighting.length && p.fire === 0) {
    // Nearest bug in plain sight; if every one is behind a rack, the nearest.
    let target = fighting[0];
    let best = Infinity;
    for (const e of fighting) {
      const d = dist(p, e) + (blocked(p, e, g.obstacles) ? 10000 : 0);
      if (d < best) { best = d; target = e; }
    }
    shoot(g, target);
    p.fire = 1 / fireRate(g);
  }

  for (const e of g.enemies) if (!e.dead) updateEnemy(g, e, dt);
  g.enemies = g.enemies.filter((e) => !e.dead);

  g.arrows = g.arrows.filter((a) => updateArrow(g, a, dt));

  g.orbs = g.orbs.filter((o) => {
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.life -= dt;
    if (o.life <= 0 || o.x < WALL || o.x > W - WALL || o.y < WALL || o.y > H - WALL) return false;
    if (g.obstacles.some((r) => inRect(o, r))) return false;
    if (Math.hypot(o.x - p.x, o.y - p.y) < o.r + p.r - 3) {
      hurtPlayer(g, o.dmg);
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

  if (!g.door && g.enemies.length === 0) {
    g.door = true;
    g.orbs = [];
    g.events.push('clear');
  }
  if (g.pendingLevels > 0 && g.phase === 'play') offerChoices(g);
}
