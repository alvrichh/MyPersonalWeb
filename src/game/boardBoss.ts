import type { OrbPic, ThreatEl } from './world';

/** The same characteristic moves and signatures as the room/Guard bosses, scaled to the small board.
    A cast's special attacks share a damage pool: overlapping lines, circles and missiles cannot multiply it. */
export type BossMove = 'volley' | 'breath' | 'icerows' | 'geysers' | 'mudball' | 'acid' | 'leap' | 'javelins' | 'missiles' | 'blink';
export type BossSignature = 'spiral' | 'meteors' | 'tide' | 'sigils' | 'roots' | 'grid' | 'laser' | 'clones' | 'frenzy' | 'tornado';
export type BossKit = { move: BossMove; signature?: BossSignature; pic: OrbPic; el: ThreatEl };
const MOVE: BossMove[] = ['volley', 'breath', 'icerows', 'mudball', 'leap', 'javelins', 'missiles', 'blink', 'breath'];
const SIGNATURE: BossSignature[] = ['spiral', 'meteors', 'tide', 'sigils', 'roots', 'grid', 'laser', 'clones', 'tornado'];
const PIC: OrbPic[] = ['glitch', 'fireball', 'water', 'mudball', 'leaf', 'bolt', 'rocket', 'ghost', 'ember'];
const EL: ThreatEl[] = ['glitch', 'fire', 'water', 'mud', 'leaf', 'bolt', 'laser', 'shadow', 'fire'];

export function bossKit(cast: number, tier: number): BossKit | null {
  if (tier < 3) return null;
  const i = cast - 1;
  const move = cast === 3 && tier >= 4 ? (tier >= 5 ? 'leap' : 'geysers')
    : cast === 5 && tier >= 4 ? 'acid' : cast === 9 && tier >= 4 ? 'leap' : MOVE[i];
  return { move, ...(tier >= 4 ? { signature: cast === 3 && tier >= 5 ? 'frenzy' : SIGNATURE[i] } : {}), pic: cast === 5 && tier >= 4 ? 'acid' : PIC[i], el: EL[i] };
}

export const BOSS_CAST = { first: 0.8, move: 5.5, finalMove: 6.5, signatureFirst: 4.5, signature: 8, moveBudget: 1.05, signatureBudget: 1.7 };
export type BossPool = { remaining: number; dmg: number };
type Point = { x: number; y: number };
type Foe = Point & { id: number; r: number; ranged: boolean };
type Source = Foe & { side: 0 | 1; tier: number; cast: number; dmg: number; syn: number; synLv: number; tac?: boolean };
export type BoardBossAttack = Point & {
  kind: 'circle' | 'line' | 'wave' | 'beam' | 'clone';
  a: number; len: number; r: number; age: number; warn: number; life: number;
  speed?: number; spin?: number;
  pic: OrbPic; el: ThreatEl; asset: string;
  side: 0 | 1; from: number; syn: number; synLv: number; tac?: boolean;
  hitIds: number[]; group: BossPool;
  freeze?: number; slow?: number;
};
export type BossShot = Point & {
  vx: number; vy: number; side: 0 | 1; dmg: number; target: number; life: number; ring: boolean;
  syn: number; synLv: number; tac?: boolean; from: number; pic: OrbPic; el: ThreatEl; r: number; home?: number; group: BossPool;
  delay?: number;
};
export type BossPlan = { attacks: BoardBossAttack[]; shots: BossShot[]; hold: number; action?: { kind: 'leap' | 'blink'; x: number; y: number } };

/** Pure attack planning: no dice, DOM, IDs or game mutations. Both online peers construct the same plan. */
export function planBossCast(f: Source, foes: Foe[], signature: boolean, width: number, height: number): BossPlan {
  const plan: BossPlan = { attacks: [], shots: [], hold: signature ? 0.55 : 0.35 };
  const kit = bossKit(f.cast, f.tier);
  if (!kit || !foes.length) return plan;
  const i = f.cast - 1;
  const sorted = [...foes].sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y) || a.id - b.id);
  const target = sorted[0];
  const a = Math.atan2(target.y - f.y, target.x - f.x);
  const move = signature ? kit.signature : kit.move;
  const group = { remaining: f.dmg * (signature ? BOSS_CAST.signatureBudget : BOSS_CAST.moveBudget), dmg: f.dmg * (signature ? 0.55 : 0.45) };
  const common = { side: f.side, from: f.id, syn: f.syn, synLv: f.synLv, tac: f.tac, pic: kit.pic, el: kit.el, group };
  const clamp = (p: Point, r = 20) => ({ x: Math.max(r, Math.min(width - r, p.x)), y: Math.max(r, Math.min(height - r, p.y)) });
  const attack = (p: Point, more: Partial<BoardBossAttack> = {}) => {
    plan.attacks.push({ ...common, ...clamp(p), kind: 'circle', a, len: 180, r: 28, age: 0, warn: 0.65, life: 0.45, hitIds: [], asset: 'impact', ...more });
  };
  const shot = (angle: number, more: Partial<BossShot> = {}) => {
    const speed = 160;
    plan.shots.push({ ...common, x: f.x, y: f.y - 6, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, dmg: group.dmg, target: -1, life: 2.5, ring: true, r: 6, ...more });
  };
  // Reusable geometric formations: each wave shares this cast's damage pool.
  // Delays on shots and warnings on ground attacks preserve dodge/readability.
  const shapeShots = (angles: number[], delay: number, speed: number, pic: OrbPic) => {
    for (const angle of angles) shot(angle, { vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed, delay, pic, life: 2.4, dmg: group.dmg * 0.42 });
  };
  switch (move) {
    case 'volley':
      for (const off of [-0.18, 0, 0.18]) shot(a + off, { pic: 'glitch' });
      break;
    case 'breath':
      for (const off of [-0.48, -0.24, 0, 0.24, 0.48]) shot(a + off, { pic: f.cast === 9 ? 'ember' : 'fireball', life: 1.55, r: 8 });
      break;
    case 'icerows':
      for (const off of [-0.3, 0, 0.3]) for (let i = 0; i < 3; i++) {
        const d = 45 + i * 44;
        attack({ x: f.x + Math.cos(a + off) * d, y: f.y + Math.sin(a + off) * d }, { warn: 0.55 + i * 0.16, life: 0.7, r: 20, pic: 'water', asset: 'ice-block', slow: 0.25 });
      }
      break;
    case 'geysers':
      for (let i = 0; i < 3; i++) attack(sorted[i % sorted.length], { warn: 0.7 + i * 0.22, r: 25, pic: 'water', asset: 'wave-strip-0', slow: 0.2 });
      break;
    case 'mudball':
      for (let i = 0; i < 3; i++) attack(sorted[i % sorted.length], { warn: 0.7 + i * 0.17, life: 1.3, pic: 'mudball', asset: 'mud-splat', slow: 0.3 });
      break;
    case 'acid':
      for (const off of [-0.3, -0.15, 0, 0.15, 0.3]) shot(a + off, { pic: 'acid', r: 8, life: 2 });
      break;
    case 'leap': {
      const back = (o: Foe) => f.side === 0 ? -o.y : o.y;
      const ranged = foes.filter((o) => o.ranged);
      const last = [...(ranged.length ? ranged : foes)].sort((p, q) => back(q) - back(p) || p.id - q.id)[0];
      const at = clamp({ x: last.x + (last.x < width / 2 ? 1 : -1) * (f.r + last.r) * 0.7, y: last.y + (f.side === 0 ? -6 : 6) }, f.r);
      plan.action = { kind: 'leap', ...at };
      const landing = ['impact', 'boom-big', 'shock-ring', 'medusa-burst', 'vine-row-0', 'bolt-6', 'laser-red', 'spectral-bolt', 'boom-big'][i];
      attack(at, { warn: 0.55, life: 0.25, r: 38, pic: kit.pic, asset: landing });
      plan.hold = 0;
      break;
    }
    case 'javelins':
      for (const off of [-0.25, 0, 0.25]) attack(f, { kind: 'line', a: a + off, len: 230, r: 7, warn: 0.7, life: 0.2, pic: 'bolt', asset: 'bolt-6' });
      break;
    case 'missiles':
      for (const off of [-0.65, 0, 0.65]) shot(a + off, { target: target.id, home: 1.9, life: 2.8, r: 7, pic: 'rocket' });
      break;
    case 'blink': {
      const at = clamp({ x: target.x + (target.x < width / 2 ? 42 : -42), y: target.y + (f.side === 0 ? -24 : 24) }, f.r);
      plan.action = { kind: 'blink', ...at };
      attack(at, { r: 40, warn: 0.45, life: 0.5, pic: 'ghost', asset: 'spectral-bolt' });
      break;
    }
    case 'spiral':
      for (let i = 0; i < 12; i++) shot((i / 12) * Math.PI * 2 + a, { pic: 'glitch', dmg: f.dmg * 0.3, life: 2.3 });
      plan.hold = 0.75;
      break;
    case 'meteors':
      for (let i = 0; i < 3; i++) attack(sorted[i % sorted.length], { warn: 0.9 + i * 0.16, life: 1.2, r: 31, pic: 'fireball', asset: 'boom-big' });
      break;
    case 'tide': {
      const down = target.y > f.y;
      attack({ x: width / 2, y: down ? 16 : height - 16 }, { kind: 'wave', a: down ? Math.PI / 2 : -Math.PI / 2, len: width - 20, r: 11, warn: 0.9, life: height / 170, speed: 170, pic: 'water', asset: 'wave-strip-0', slow: 0.25 });
      break;
    }
    case 'sigils':
      for (let i = 0; i < 3; i++) attack(sorted[i % sorted.length], { warn: 0.85 + i * 0.12, life: 0.55, r: 32, el: 'arcane', pic: 'medusa', asset: f.tier >= 5 ? 'medusa-burst-2' : 'medusa-burst', freeze: 0.4 });
      break;
    case 'roots':
      for (const [i, off] of (f.tier >= 5 ? [-0.6, -0.3, 0, 0.3, 0.6] : [-0.38, 0, 0.38]).entries())
        attack(f, { kind: 'line', a: a + off, len: 190, r: 13, warn: 0.8 + i * 0.12, life: 0.6, pic: 'leaf', asset: 'vine-row-0', slow: 0.35 });
      // Final Queen: two clearly visible vine-wall segments per row, with
      // alternating open corridors. The normal root lanes remain intact.
      if (f.cast === 5 && f.tier >= 4) {
        for (let row = 0; row < 2; row++) {
          const y = Math.max(30, Math.min(height - 30, target.y + (row ? 48 : -48)));
          const gapX = Math.max(70, Math.min(width - 70, target.x + (row ? 42 : -42)));
          const halfGap = 35;
          for (const [left, right] of [[12, gapX - halfGap], [gapX + halfGap, width - 12]]) {
            if (right - left < 12) continue;
            attack({ x: left, y }, { kind: 'line', a: 0, len: right - left,
              r: 12, warn: 0.95 + row * 0.4, life: 0.85,
              pic: 'leaf', asset: 'vine-row-0', slow: 0.35 });
          }
        }
      }
      // Final Queen: a second pattern of staggered thorn walls with shifting gaps.
      if (f.cast === 5 && f.tier >= 4) for (let row = 0; row < 3; row++) {
        const gap = row % 2 === 0 ? 2 : 4;
        const angles = Array.from({ length: 7 }, (_, i) => i)
          .filter(i => i !== gap && i !== gap + 1)
          .map(i => a + (i - 3) * 0.16);
        shapeShots(angles, 0.65 + row * 0.35, 135 + row * 10, 'leaf');
      }
      break;
    case 'grid':
      for (const off of [-60, 0, 60]) {
        attack({ x: 12, y: target.y + off }, { kind: 'line', a: 0, len: width - 24, r: 7, warn: 0.9, life: 0.2, pic: 'bolt', asset: 'bolt-6' });
        attack({ x: target.x + off, y: 12 }, { kind: 'line', a: Math.PI / 2, len: height - 24, r: 7, warn: 1.25, life: 0.2, pic: 'bolt', asset: 'bolt-6' });
      }
      break;
    case 'laser':
      for (const off of [0, Math.PI]) attack(f, { kind: 'beam', a: a + off, len: 280, r: 8, warn: 0.8, life: 1.4, spin: 0.8, el: 'laser', pic: 'spark', asset: 'laser-red' });
      attack(target, { warn: 1.15, r: 27, life: 0.9, pic: 'fireball', el: 'fire', asset: 'boom-big' });
      plan.hold = 2.2;
      break;
    case 'clones':
      for (let i = 0; i < 3; i++) {
        const angle = a + (i / 3) * Math.PI * 2;
        attack({ x: target.x + Math.cos(angle) * 50, y: target.y + Math.sin(angle) * 50 }, { kind: 'clone', warn: 0.65 + i * 0.12, life: 1.1, r: 58, pic: 'ghost', asset: 'spectral-bolt' });
      }
      // Three triangular arcs emerge in succession, leaving open sectors.
      if (f.cast === 8 && f.tier >= 4) for (let side = 0; side < 3; side++) {
        const center = a + side * Math.PI * 2 / 3;
        shapeShots([center - 0.17, center, center + 0.17], 0.7 + side * 0.3, 130, 'ghost');
      }
      // Extra delayed ghost strike follows the initial decoys.
      if (f.tier >= 5) attack(target, { warn: 1.35, life: 0.45, r: 26, pic: 'ghost', el: 'shadow', asset: 'spectral-bolt' });
      break;
    case 'frenzy':
      // Valdur's signature chains short, newly aimed charges; the resolver uses these warned impact lines.
      for (let i = 0; i < 3; i++) {
        const t = sorted[i % sorted.length];
        attack(f, { kind: 'line', a: Math.atan2(t.y - f.y, t.x - f.x), len: 180, r: 17, warn: 0.45 + i * 0.3, life: 0.18, pic: 'water', asset: 'shock-ring' });
      }
      plan.hold = 1.35;
      break;
    case 'tornado': {
      const n = f.tier >= 6 ? 4 : f.tier >= 5 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const angle = a + (i - (n - 1) / 2) * 0.7;
        shot(angle, { vx: Math.cos(angle) * 75, vy: Math.sin(angle) * 75, pic: 'tornado', target: sorted[i % sorted.length].id, home: 3.5, life: 3.5, r: 13, dmg: f.dmg * 0.7 });
      }
      break;
    }
  }
  return plan;
}
