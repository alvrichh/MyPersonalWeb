/** Siege has its own balance and save schema. Nothing here changes action/board stats. */
export const FIELD = 1600;
export const LIMIT = 300;
export const CAP = 36;
export const SAVE_KEY = 'bugHunter.siege.v1';
export const CASTS = ['original', 'demon', 'viking', 'mud', 'jungle', 'greek', 'robot', 'nightmare', 'core'];
export interface Spec { id: number; cost: number; hp: number; damage: number; speed: number; range: number; rate: number; cooldown: number; unlock: number; sprite: string; size: number; splash?: number; air?: boolean }
/** Every troop, its `id` its place in this list. */
export const UNITS: readonly Spec[] = [
  { id: 0, cost: 20, hp: 115, damage: 16, speed: 43, range: 35, rate: 0.8, cooldown: 2, unlock: 1, sprite: 'enemies/original-bug', size: 52 },
  { id: 1, cost: 40, hp: 85, damage: 22, speed: 31, range: 185, rate: 1.3, cooldown: 4, unlock: 1, sprite: 'enemies/original-ticket', size: 58 },
  { id: 2, cost: 65, hp: 430, damage: 22, speed: 22, range: 40, rate: 1.5, cooldown: 7, unlock: 1, sprite: 'enemies/original-legacy', size: 77 },
  { id: 3, cost: 35, hp: 90, damage: 19, speed: 75, range: 35, rate: 0.6, cooldown: 4, unlock: 1, sprite: 'enemies/jungle-bug', size: 49 },
  { id: 4, cost: 140, hp: 920, damage: 65, speed: 19, range: 65, rate: 2, cooldown: 19, unlock: 1, sprite: 'bosses/monolith', size: 115, splash: 60 },
  { id: 5, cost: 85, hp: 135, damage: 42, speed: 28, range: 220, rate: 1.8, cooldown: 9, unlock: 3, sprite: 'enemies/demon-ticket', size: 65, splash: 70, air: true },
  { id: 6, cost: 100, hp: 650, damage: 27, speed: 24, range: 45, rate: 1.4, cooldown: 11, unlock: 5, sprite: 'enemies/greek-legacy', size: 84 },
  { id: 7, cost: 180, hp: 740, damage: 88, speed: 30, range: 190, rate: 2.3, cooldown: 24, unlock: 7, sprite: 'bosses/kernel', size: 110, splash: 95 },
  // Air (Cartoon Wars 2's A row): they fly over the field, out of reach of melee troops; only ranged ones hit them.
  { id: 8, cost: 30, hp: 70, damage: 12, speed: 70, range: 35, rate: 0.7, cooldown: 3, unlock: 1, sprite: 'enemies/mud-ticket', size: 50, air: true },
  { id: 9, cost: 50, hp: 110, damage: 20, speed: 55, range: 40, rate: 0.8, cooldown: 5, unlock: 2, sprite: 'enemies/demon-bug', size: 58, air: true },
  { id: 10, cost: 75, hp: 120, damage: 24, speed: 40, range: 170, rate: 1.2, cooldown: 8, unlock: 4, sprite: 'enemies/robot-bug', size: 56, air: true },
  { id: 11, cost: 120, hp: 260, damage: 40, speed: 45, range: 60, rate: 1.1, cooldown: 14, unlock: 6, sprite: 'enemies/core-ticket', size: 72, splash: 50, air: true },
  // More land troops, each world's own cast, unlocked world by world.
  { id: 12, cost: 30, hp: 150, damage: 18, speed: 48, range: 35, rate: 0.8, cooldown: 3, unlock: 2, sprite: 'enemies/viking-bug', size: 54 },
  { id: 13, cost: 55, hp: 110, damage: 26, speed: 32, range: 190, rate: 1.4, cooldown: 5, unlock: 3, sprite: 'enemies/viking-ticket', size: 58 },
  { id: 14, cost: 85, hp: 560, damage: 20, speed: 22, range: 40, rate: 1.5, cooldown: 9, unlock: 3, sprite: 'enemies/viking-legacy', size: 80 },
  { id: 15, cost: 60, hp: 240, damage: 34, speed: 46, range: 38, rate: 0.9, cooldown: 6, unlock: 4, sprite: 'enemies/greek-bug', size: 58 },
  { id: 16, cost: 70, hp: 150, damage: 32, speed: 30, range: 230, rate: 1.5, cooldown: 7, unlock: 5, sprite: 'enemies/greek-ticket', size: 60 },
  { id: 17, cost: 45, hp: 130, damage: 22, speed: 80, range: 35, rate: 0.6, cooldown: 4, unlock: 4, sprite: 'enemies/mud-bug', size: 50 },
  { id: 18, cost: 95, hp: 720, damage: 22, speed: 20, range: 40, rate: 1.6, cooldown: 11, unlock: 4, sprite: 'enemies/mud-legacy', size: 78, splash: 40 },
  { id: 19, cost: 75, hp: 170, damage: 30, speed: 26, range: 210, rate: 1.4, cooldown: 8, unlock: 5, sprite: 'enemies/jungle-ticket', size: 60 },
  { id: 20, cost: 110, hp: 820, damage: 30, speed: 21, range: 45, rate: 1.5, cooldown: 12, unlock: 5, sprite: 'enemies/jungle-legacy', size: 82 },
  { id: 21, cost: 95, hp: 220, damage: 45, speed: 18, range: 280, rate: 1.9, cooldown: 10, unlock: 6, sprite: 'enemies/robot-ticket', size: 64, splash: 50 },
  { id: 22, cost: 130, hp: 1000, damage: 34, speed: 20, range: 45, rate: 1.5, cooldown: 14, unlock: 7, sprite: 'enemies/robot-legacy', size: 84 },
  { id: 23, cost: 25, hp: 160, damage: 15, speed: 36, range: 35, rate: 0.9, cooldown: 2, unlock: 7, sprite: 'enemies/nightmare-bug', size: 54 },
  { id: 24, cost: 70, hp: 260, damage: 36, speed: 44, range: 38, rate: 0.9, cooldown: 6, unlock: 8, sprite: 'enemies/nightmare-ticket', size: 60 },
  { id: 25, cost: 120, hp: 900, damage: 40, speed: 18, range: 150, rate: 2, cooldown: 14, unlock: 8, sprite: 'enemies/nightmare-legacy', size: 80, splash: 60 },
  { id: 26, cost: 160, hp: 1250, damage: 60, speed: 22, range: 60, rate: 1.7, cooldown: 18, unlock: 9, sprite: 'enemies/core-legacy', size: 92, splash: 70 },
  { id: 27, cost: 90, hp: 300, damage: 34, speed: 42, range: 50, rate: 1, cooldown: 9, unlock: 3, sprite: 'enemies/demon-legacy', size: 70, air: true },
  { id: 28, cost: 110, hp: 260, damage: 38, speed: 50, range: 180, rate: 1.3, cooldown: 11, unlock: 9, sprite: 'enemies/core-bug', size: 64, splash: 45, air: true },
];
/** Up to this many land and this many air troops in an army. */
export const DECK = 5;
const isAir = (id: number) => !!UNITS[id]?.air;
/** Can a fighter of `id` hit one of `target`? Melee troops on the ground cannot reach the air. */
export const canHit = (id: number, target: number) => !isAir(target) || isAir(id) || UNITS[id].range >= 100;
/** Keep at most `DECK` of each kind, in order. */
export function capDeck(deck: number[]) { const land = deck.filter(id => !isAir(id)).slice(0, DECK), air = deck.filter(isAir).slice(0, DECK); return deck.filter(id => land.includes(id) || air.includes(id)); }
export interface Progress { version: 1; unlocked: number; coins: number; victories: number[]; upgrades: [number, number, number, number]; deck: number[] }
export const freshProgress = (): Progress => ({ version: 1, unlocked: 1, coins: 0, victories: [], upgrades: [0, 0, 0, 0], deck: [0, 1, 2, 3, 4] });
const integer = (v: unknown, min: number, max: number, fallback: number) => typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v))) : fallback;
export function readProgress(raw: string | null): Progress {
  const p = freshProgress();
  try {
    const v = JSON.parse(raw || 'null');
    if (!v || v.version !== 1) return p;
    p.unlocked = integer(v.unlocked, 1, 9, 1); p.coins = integer(v.coins, 0, 1000000, 0);
    p.victories = Array.isArray(v.victories) ? [...new Set<number>(v.victories.filter((n: unknown) => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 9))] : [];
    p.upgrades = [0, 1, 2, 3].map(i => integer(v.upgrades?.[i], 0, 5, 0)) as Progress['upgrades'];
    p.deck = Array.isArray(v.deck) ? capDeck([...new Set<number>(v.deck.filter((n: unknown) => typeof n === 'number' && UNITS[n]?.unlock <= p.unlocked))]) : [];
    for (let i = 0; p.deck.filter(id => !isAir(id)).length < DECK; i++) if (!p.deck.includes(i) && !isAir(i)) p.deck.push(i);
  } catch { /* corrupt or unavailable storage starts a safe, isolated preview */ }
  return p;
}
export const upgradePrice = (level: number) => 100 + level * 100;
export function upgrade(p: Progress, slot: number): boolean {
  if (!Number.isInteger(slot) || slot < 0 || slot > 3) return false;
  const level = p.upgrades[slot]; const cost = upgradePrice(level);
  if (level >= 5 || p.coins < cost) return false;
  p.coins -= cost; p.upgrades[slot]++; return true;
}
export interface Fighter { uid: number; id: number; side: 0 | 1; x: number; lane: number; hp: number; maxHp: number; damage: number; attack: number; flash: number; boss: boolean; hit?: number }
export interface Effect { x: number; from: number; lane: number; life: number; max: number; kind: 'shot' | 'burst' | 'arrow' | 'rocket'; side: 0 | 1 }
export interface Siege {
  world: number; phase: 'fight' | 'won' | 'lost'; time: number; energy: number; generator: number; cooldowns: number[];
  hp: [number, number]; maxHp: [number, number]; units: Fighter[]; effects: Effect[]; nextId: number; nextWave: number; waves: number; kills: number;
  spell: number; rocket: number; aim: number; bow: Bow;
  /** How many times the bow has shot this battle (the view plays a sound for each new one). */
  shots?: number; bossSpawned: boolean; paid: boolean; power: number; economy: number; deck: number[];
}
export const energyMax = (s: Siege) => 180 + s.generator * 70;
export const energyRate = (s: Siege) => 7 + s.generator * 2.5 + s.economy;
export const generatorPrice = (s: Siege) => 65 + s.generator * 45;
export function newSiege(p: Progress, world: number): Siege {
  world = integer(world, 1, p.unlocked, 1);
  const maxHp: [number, number] = [1700 + p.upgrades[1] * 200, 1500 + world * 170];
  return { world, phase: 'fight', time: 0, energy: 80, generator: 0, cooldowns: UNITS.map(() => 0), hp: [...maxHp], maxHp, units: [], effects: [], nextId: 1, nextWave: 7, waves: 0, kills: 0, spell: 0, rocket: 0, aim: 700, bossSpawned: false, paid: false, power: 1 + p.upgrades[0] * 0.08, economy: p.upgrades[2] * 0.6, deck: [...p.deck], bow: { quiver: BOW.max, drawing: false, held: 0, next: 0, level: p.upgrades[3] } };
}
function spawn(s: Siege, id: number, side: 0 | 1, boss = false) {
  if (s.units.filter(u => u.side === side).length >= CAP) return;
  const spec = UNITS[id]; const scale = side ? 0.8 + s.world * 0.07 : s.power;
  const hp = spec.hp * scale * (boss ? 1.35 : 1);
  s.units.push({ uid: s.nextId++, id, side, x: side ? FIELD - 120 : 120, lane: s.nextId % 3, hp, maxHp: hp, damage: spec.damage * scale, attack: 0, flash: 0, boss });
}
export function canSummon(s: Siege, id: number): boolean {
  return s.phase === 'fight' && s.deck.includes(id) && s.energy >= UNITS[id].cost && s.cooldowns[id] <= 0 && s.units.filter(u => !u.side).length < CAP;
}
export function summon(s: Siege, id: number): boolean {
  if (!canSummon(s, id)) return false;
  s.energy -= UNITS[id].cost; s.cooldowns[id] = UNITS[id].cooldown; spawn(s, id, 0); return true;
}
export function improveGenerator(s: Siege): boolean {
  if (s.phase !== 'fight' || s.generator >= 4 || s.energy < generatorPrice(s)) return false;
  s.energy -= generatorPrice(s); s.generator++; return true;
}
function damageArea(s: Siege, x: number, radius: number, damage: number, life = 0.45) {
  for (const u of s.units) if (u.side === 1 && Math.abs(u.x - x) <= radius) { u.hp -= damage; u.flash = 0.18; }
  s.effects.push({ x, from: 80, lane: 1, life, max: life, kind: 'burst', side: 0 });
}
/** Our fortress's bow, Cartoon Wars-style: one tap sets the archers shooting, arrows one after another at the aim (the
    left slider), faster and more at a time the longer they keep on; another tap stops them, and so does an empty quiver.
    The quiver fills again only while they are not shooting. The workshop's bow upgrade shoots more often and more arrows. */
export const BOW = { max: 100, cost: 2.5, regen: 12, every: 0.42, step: 0.04, fastest: 0.13, ramp: 2.5, damage: 16, gap: 24 };
export interface Bow { quiver: number; drawing: boolean; held: number; next: number; level: number }
export const aimAt = (x: number) => Math.max(140, Math.min(1080, x));
/** Seconds between shots and arrows per shot, for the bow's level and how long it has been held. */
export const bowEvery = (b: Bow) => Math.max(BOW.fastest, (BOW.every - b.level * BOW.step) * (1 - Math.min(1, b.held / BOW.ramp) * 0.5));
export const bowCount = (b: Bow) => 1 + Math.floor(b.level / 2) + (b.held >= BOW.ramp ? 1 : 0);
function arrows(s: Siege, count: number) {
  const x = aimAt(s.aim);
  for (let i = 0; i < count; i++) {
    const at = x + (i - (count - 1) / 2) * BOW.gap;
    for (const u of s.units) if (u.side === 1 && Math.abs(u.x - at) <= 28) { u.hp -= BOW.damage * s.power; u.flash = 0.18; }
    s.effects.push({ x: at, from: 80, lane: i % 3, life: 0.5, max: 0.5, kind: 'arrow', side: 0 });
  }
}
/** Start (true) or stop (false) the archers; they only start with at least one shot in the quiver. */
export function draw(s: Siege, on: boolean) { if (s.phase === 'fight') s.bow.drawing = on && s.bow.quiver >= BOW.cost; }
/** The bow button: one tap starts the arrows, the next stops them. */
export const toggleBow = (s: Siege) => draw(s, !s.bow.drawing);
function bow(s: Siege, dt: number) {
  const b = s.bow;
  if (b.drawing) {
    b.held += dt; b.next -= dt;
    if (b.next <= 0) { arrows(s, bowCount(b)); s.shots = (s.shots ?? 0) + 1; b.quiver -= BOW.cost; b.next = bowEvery(b); }
    if (b.quiver < BOW.cost) b.drawing = false;
    if (b.drawing) return;
  }
  b.held = 0; b.next = 0;
  b.quiver = Math.min(BOW.max, b.quiver + BOW.regen * dt);
}
/** The missile: one heavy blast at the aim, a shorter recharge than the discharge. */
export const ROCKET = { radius: 70, damage: 150, every: 12 };
export function missile(s: Siege): boolean {
  if (s.phase !== 'fight' || s.rocket > 0) return false;
  const x = aimAt(s.aim);
  s.effects.push({ x, from: 80, lane: 1, life: 0.55, max: 0.55, kind: 'rocket', side: 0 });
  damageArea(s, x, ROCKET.radius, ROCKET.damage * s.power); s.rocket = ROCKET.every;
  // The blast shows as the missile lands: its effect waits out the flight (drawn only once its life is under `max`).
  s.effects[s.effects.length - 1].life += 0.55; return true;
}
export function strike(s: Siege): boolean {
  if (s.phase !== 'fight' || s.spell > 0) return false;
  damageArea(s, s.aim, 155, 210 * s.power, 0.7); s.spell = 24; return true;
}
/** Fixed-step caller. Accumulate damage before removal so opposing lethal hits resolve fairly. */
export function tick(s: Siege, dt: number) {
  if (s.phase !== 'fight' || !Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, 0.1); s.time += dt;
  s.energy = Math.min(energyMax(s), s.energy + energyRate(s) * dt);
  s.spell = Math.max(0, s.spell - dt); s.rocket = Math.max(0, s.rocket - dt);
  s.cooldowns = s.cooldowns.map(c => Math.max(0, c - dt));
  bow(s, dt);
  s.effects = s.effects.filter(e => (e.life -= dt) > 0);
  s.nextWave -= dt;
  if (s.nextWave <= 0) {
    s.waves++; s.nextWave = Math.max(4.5, 10 - s.world * 0.35 - s.time / 90);
    const count = Math.min(4, 1 + Math.floor(s.time / 55));
    for (let i = 0; i < count; i++) {
      const pool = s.time < 25 ? [0, 0, 1] : [0, 1, 2, 3, 1, 0];
      spawn(s, pool[(s.waves + i) % pool.length], 1);
    }
  }
  if (!s.bossSpawned && (s.hp[1] < s.maxHp[1] * 0.45 || s.time >= 150)) { s.bossSpawned = true; spawn(s, 4, 1, true); }
  const alive = s.units.filter(u => u.hp > 0);
  const hits: { target: Fighter; damage: number }[] = [];
  for (const u of alive) {
    const a = UNITS[u.id]; u.attack -= dt; u.flash = Math.max(0, u.flash - dt); u.hit = Math.max(0, (u.hit ?? 0) - dt);
    const enemy = alive.filter(v => v.side !== u.side && canHit(u.id, v.id)).sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
    const baseX = u.side ? 80 : FIELD - 80;
    const distance = enemy ? Math.abs(enemy.x - u.x) : Infinity;
    if (enemy && distance <= a.range + UNITS[enemy.id].size * 0.25) {
      if (u.attack <= 0) {
        u.attack = a.rate; u.hit = 0.3;
        for (const v of alive) if (v.side !== u.side && canHit(u.id, v.id) && (v === enemy || (a.splash && Math.abs(v.x - enemy.x) < a.splash))) hits.push({ target: v, damage: u.damage });
        s.effects.push({ x: enemy.x, from: u.x, lane: enemy.lane, life: 0.2, max: 0.2, kind: 'shot', side: u.side });
      }
    } else if (Math.abs(baseX - u.x) <= a.range + 35) {
      if (u.attack <= 0) { u.attack = a.rate; u.hit = 0.3; s.hp[u.side ? 0 : 1] -= u.damage; }
    } else {
      const movement = a.speed * dt;
      // Never step through an opponent, even during a long frame.
      u.x += (u.side ? -1 : 1) * Math.max(0, Math.min(movement, distance - 24));
      u.x = Math.max(110, Math.min(FIELD - 110, u.x));
    }
  }
  for (const hit of hits) { hit.target.hp -= hit.damage; hit.target.flash = 0.12; }
  s.kills += s.units.filter(u => u.side && u.hp <= 0).length;
  s.units = s.units.filter(u => u.hp > 0);
  s.hp = s.hp.map(h => Math.max(0, h)) as [number, number];
  if (s.hp[0] <= 0 || s.time >= LIMIT) s.phase = 'lost';
  else if (s.hp[1] <= 0) s.phase = 'won';
}
/** Rewards settle once per battle; a reload cannot replay a settled result. */
export function settle(p: Progress, s: Siege): number {
  if (s.phase === 'fight' || s.paid) return 0;
  s.paid = true;
  if (s.phase !== 'won') return 0;
  const first = !p.victories.includes(s.world);
  const reward = first ? 160 + s.world * 30 : 45 + s.world * 5;
  p.coins += reward;
  if (first) p.victories.push(s.world);
  p.unlocked = Math.min(9, Math.max(p.unlocked, s.world + 1));
  return reward;
}
