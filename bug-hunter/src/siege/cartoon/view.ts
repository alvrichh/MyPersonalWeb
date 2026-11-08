import { PHASED, HERO_AIR, HERO_GUARDIAN, HERO_LAND, heroLevel, actOf, stageIn, flight, bowReach, highOf, foesAt, FIELD, shotFor, FOE_AIR, FOE_LAND, GUARDIAN, KNOCK, POUNCE, SPELLS, UNITS, isBeam, isBullet, specAt, specOf, aimAt, enemyTier, castleTier, energyMax, looksTier, type Effect, type Fighter, type Siege } from './model';
import { gloom } from './story';

/** Each world's ground colours, under its floor while that loads (moss, embers, snow, mud, jungle, sand, iron,
    haunted stone, crystal); the third is unused pebble colour kept for a later side strip. */
const GROUND: [string, string, string][] = [
  ['#3d5a45', '#18261d', '#8fbf9a'], ['#5e2c1a', '#1e0b07', '#ff8a4c'], ['#c6dbea', '#56738c', '#ffffff'],
  ['#5a4628', '#21180c', '#9a7a48'], ['#46632a', '#17240d', '#9ccf5e'], ['#d2ae6c', '#6e4e26', '#f3dca8'],
  ['#55555f', '#1d1d24', '#ffb35c'], ['#333d5c', '#11151f', '#9fb2ff'], ['#43306a', '#150d24', '#d58cff'],
];
export const THEMES = ['#50e6d0', '#ff885c', '#89d7ff', '#a8c36a', '#75d891', '#e9c66d', '#ffad60', '#a2b5ff', '#e688ff'];
const pictures = new Map<string, { image: HTMLImageElement; crop?: [number, number, number, number] }>();
function picture(path: string) {
  let entry = pictures.get(path);
  if (!entry) {
    const image = new Image(); entry = { image }; pictures.set(path, entry);
    image.onload = () => {
      // Runtime alpha bounds keep existing sprite files and animation canvases untouched.
      const c = document.createElement('canvas'); c.width = image.width; c.height = image.height;
      const cx = c.getContext('2d', { willReadFrequently: true }); if (!cx) return;
      cx.drawImage(image, 0, 0);
      try {
        const data = cx.getImageData(0, 0, c.width, c.height).data;
        let left = c.width, top = c.height, right = 0, bottom = 0;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (data[(y * c.width + x) * 4 + 3] > 35) {
          left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
        }
        if (right >= left && bottom >= top) entry!.crop = [left, top, right - left + 1, bottom - top + 1];
      } catch { /* fallback still renders if pixel reads are unavailable */ }
    };
    image.src = art(`${path}.webp`);
  }
  return entry;
}
/** Pictures redrawn under the same file names: a browser keeps the old copy for days (`/images/` may be served stale
    while it revalidates), so their address carries a revision, raised each time one is drawn again. */
const ART_REV: [string, number][] = [['siege/units/boss-dark-king-', 2], ['siege/units/foe-bellringer-1-3', 2], ['siege/units/foe-wraith-1-3', 2]];
const art = (file: string) => { const r = ART_REV.find(([k]) => file.startsWith(k)); return `/images/game/${file}${r ? `?r=${r[1]}` : ''}`; };
/** Every troop's sheet (`siege/units/...`): 0 standing, 1 attacking, 2 hurt. Walking, breathing, lunges and falls
    are animated here. */
export function sprite(_s: Siege, u: Fighter) { return specOf(u).sprite; }
/** A troop's card picture at its level. */
export const portrait = (id: number, level = 1) => art(`${specAt(id, level).sprite}-0.webp`);
export function preload(world: number, deck: number[], _levels: number[] = [], villain = false) {
  const foes: number[] = villain ? [] : [...foesAt(FOE_LAND, world), ...foesAt(FOE_AIR, world), GUARDIAN[actOf(world) - 1]];
  // The Villain campaign's heroes, at the forms they come in.
  const heroes = villain ? [...foesAt(HERO_LAND, world), ...foesAt(HERO_AIR, world)].map(id => specAt(id, heroLevel(id, world))).concat(specAt(HERO_GUARDIAN[actOf(world) - 1], 99)) : [];
  const specs = [...heroes, ...deck.map(c => specAt(c % 100, Math.floor(c / 100) + 1)), ...deck.map(c => specAt(c % 100, Math.floor(c / 100) + 1)).filter(sp => sp.phase2 !== undefined).map(sp => UNITS[sp.phase2!]), ...foes.flatMap(id => (UNITS[id].phase2 !== undefined ? [UNITS[id], UNITS[UNITS[id].phase2!]] : [UNITS[id]]))];
  const keep = new Set<string>();
  specs.forEach(spec => { for (let f = 0; f < (spec.frames ?? (spec.six ? 6 : 3)); f++) { const path = `${spec.sprite}-${f}`; keep.add(path); picture(path); } });
  // The troops of other battles, and other worlds' battlefields, are let go: decoded pictures are what fills a phone's
  // memory (the whole Siege's would be over 500 MB), and an iPhone throws a page away past its share.
  for (const key of [...pictures.keys()]) if (key.startsWith('siege/units/') && !keep.has(key)) pictures.delete(key);
  const scene = sceneOf(world);
  for (const key of [...stills.keys()]) if (key.startsWith('siege/bg-') && key !== scene) stills.delete(key);
  // The battlefield, and the fortresses and crossbow at every level (the workshop can change ours between battles).
  [sceneOf(world), ...[...SHOTS, ...SPELLS].map(n => `siege/units/shot-${n}`), ...[1, 2, 3, 4].map(n => `siege/units/bolt-${n}`), ...[1, 2, 3, 4, 5].flatMap(n => [`siege/castle-${n}`, ...(n < 5 ? [`siege/xbow-${n}`] : []), `siege/enemy-${n}`]), ...FX].forEach(still);
}
/** The battlefield, a picture per world (the owner's: clean on our side, corrupt on the enemy's), drawn across the
    field with `pad` field units past each end, its walking ground (`ground`, a share of its height) on the troops'
    ground line; it moves with the troops. Every picture has its ground edge on the same row, so the troops stand alike
    on all of them. `SCENES` gives each act its picture, and for some a second one for its fourth stage (a nearby place,
    so a world does not look the same five times), and a third for its guardian's stage (the first world's: the old half
    corrupt picture, the Darkness reaching it); acts without one keep the first picture (`SCENE`). */
const SCENE = 'siege/backdrop';
const SCENE_FIT = { pad: 120, ground: 0.8 };
const SCENES: Record<number, [string, string?, string?]> = { 1: ['siege/bg-clean', undefined, SCENE], 2: ['siege/bg-islands', 'siege/bg-sky'], 3: ['siege/bg-forest', 'siege/bg-swamp'], 4: ['siege/bg-desert'], 5: ['siege/bg-snow'], 6: ['siege/bg-final'] };
/** The owner's battle backgrounds, one per stage, each world's growing darker stage by stage, the fifth its guardian's lair (`siege/backgrounds/world-N/scene-M`), each with where its troops walk
    (`feet`) and the back edge of its path (`back`), shares of its height measured by hand on each picture. */
const STAGE_SCENES: [number, number, number][][] = [
  [[2, 78.5, 75.5], [5, 73.5, 70.5], [3, 79, 76.5], [4, 77, 73.5], [1, 79, 76]],
  [[10, 78.5, 76.5], [11, 78.5, 76.5], [1, 74.5, 72], [8, 78.5, 76], [2, 80, 76.5]],
  [[6, 73, 70.5], [5, 74.5, 72], [2, 74.5, 72], [1, 74.5, 71.5], [3, 79, 76.5]],
  [[5, 76, 73], [3, 75, 72], [2, 77.5, 75], [4, 78, 75], [1, 78.5, 75.5]],
  [[3, 79, 77], [5, 76.5, 75.5], [2, 75, 73], [4, 81, 79.5], [1, 80.5, 79.5]],
  [[5, 77.5, 74.5], [4, 75.5, 73], [3, 74, 71], [2, 74, 70], [1, 78.5, 76]],
];
const FITS: Record<string, { feet: number; back: number }> = {};
STAGE_SCENES.forEach((list, a) => list.forEach(([n, feet, back]) => { FITS[`siege/backgrounds/world-${a + 1}/scene-${n}`] = { feet: feet / 100, back: back / 100 }; }));
/** A picture's walking line and path back edge: its own, or the older pictures' (`SCENE_FIT.ground`, `PATH_TOP`). */
const fitOf = (path: string) => FITS[path] ?? { feet: SCENE_FIT.ground, back: PATH_TOP[path] ?? PATH_TOP.top };
export const sceneOf = (stage: number) => { const own = STAGE_SCENES[actOf(stage) - 1]?.[stageIn(stage) - 1]; if (own) return `siege/backgrounds/world-${actOf(stage)}/scene-${own[0]}`; const pics = SCENES[actOf(stage)]; return pics ? (stageIn(stage) === 4 && pics[1]) || (stageIn(stage) === 5 && pics[2]) || pics[0] : SCENE; };
/** Each picture's top row averaged down to 16 colours, kept: stretched over any sky above the picture (a tall view) it
    is a smooth gradient, where the raw row stretched would be streaks. */
const tops = new Map<HTMLImageElement, HTMLCanvasElement>();
/** The picture's width on the field (field units), fixed whatever the field's length: the far landscape keeps its size. */
const SCENE_W = 2080;
/** How much wider than its own shape the far landscape is drawn on a wide view (see the scene's drawing). */
const SCENE_WIDEN = 1.25;
/** The pictures whose sky is mostly empty (the first, fifth and sixth worlds'): drawn close at `SCENE_W`, their top cut off, rather than
    shrunk to show it all. */
const CLOSE = new Set(['siege/bg-clean', 'siege/backdrop', 'siege/bg-snow', 'siege/bg-final']);
/** The picture's ground layer, which moves with the troops: everything from its cut down to the picture's bottom. The
    cut never goes below the line the troops walk on (`SCENE_FIT.ground`, the base) nor above the back edge of the
    ground they walk on (`PATH_TOP`, measured by hand on each picture); between the two it follows the outlines, along
    the path's back edge and under the feet of the rocks, bones and plants standing there, so none is cut in two. Its
    edge fades over `soft` pixels. `pull` draws it up to the back edge, `step` how far it climbs or drops a column. */
const GROUND_CUT = { pull: 0.35, step: 6, stepCost: 0.03, soft: 6 };
/** Each picture's back edge of the walking ground (a share of its height); others use `top`. */
const PATH_TOP: Record<string, number> = { top: 0.775, 'siege/bg-desert': 0.745 };
const grounds = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
/** The cut, a row per column: the cheapest left-to-right path between the back edge and the base, where following an
    outline (a strong edge) is cheap, crossing a flat area is dear, and every row below the back edge costs a little
    more. */
function groundCut(data: Uint8ClampedArray, w: number, h: number, from: number, to: number) {
  const { pull, step, stepCost } = GROUND_CUT, lo = Math.floor(h * from), hi = Math.floor(h * to), rows = Math.max(2, hi - lo);
  // Luminance, softened (3×3), then the Sobel edge strength, scaled by its 97th percentile.
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) lum[i] = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
  const soft = new Float32Array(w * h), edge = new Float32Array(w * rows);
  for (let y = Math.max(1, lo - 2); y < Math.min(h - 1, hi + 2); y++) for (let x = 1; x < w - 1; x++) {
    let sum = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sum += lum[(y + dy) * w + x + dx];
    soft[y * w + x] = sum / 9;
  }
  const at = (x: number, y: number) => soft[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
  for (let r = 0; r < rows; r++) for (let x = 0; x < w; x++) {
    const y = lo + r;
    const gx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
    const gy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
    edge[r * w + x] = Math.hypot(gx, gy);
  }
  const sample = Array.from({ length: 4000 }, (_, i) => edge[Math.floor((i * 7919) % edge.length)]).sort((a, b) => a - b);
  const top = sample[Math.floor(sample.length * 0.97)] || 1;
  const cost = (r: number, x: number) => (1 - Math.min(1, edge[r * w + x] / top)) ** 2 + pull * r / rows;
  let acc = new Float32Array(rows), next = new Float32Array(rows);
  const back = new Int8Array(w * rows);
  for (let r = 0; r < rows; r++) acc[r] = cost(r, 0);
  for (let x = 1; x < w; x++) {
    for (let r = 0; r < rows; r++) {
      let best = Infinity, arg = 0;
      for (let d = -step; d <= step; d++) { const q = r + d; if (q < 0 || q >= rows) continue; const v = acc[q] + stepCost * Math.abs(d); if (v < best) { best = v; arg = d; } }
      next[r] = best + cost(r, x); back[x * rows + r] = arg;
    }
    [acc, next] = [next, acc];
  }
  let r = 0; for (let q = 1; q < rows; q++) if (acc[q] < acc[r]) r = q;
  const cut = new Int16Array(w);
  for (let x = w - 1; x >= 0; x--) { cut[x] = lo + r; if (x > 0) r += back[x * rows + r]; }
  return cut;
}
function groundOf(image: HTMLImageElement, path: string) {
  let c = grounds.get(image);
  if (!c) {
    const nw = image.naturalWidth, nh = image.naturalHeight, full = document.createElement('canvas');
    full.width = nw; full.height = nh; const f = full.getContext('2d', { willReadFrequently: true });
    c = document.createElement('canvas');
    if (f) {
      f.drawImage(image, 0, 0); const img = f.getImageData(0, 0, nw, nh);
      const fit = fitOf(path), cut = groundCut(img.data, nw, nh, fit.back, fit.feet);
      let y0 = nh; for (const y of cut) y0 = Math.min(y0, y - GROUND_CUT.soft);
      y0 = Math.max(0, y0);
      for (let x = 0; x < nw; x++) for (let y = y0; y < cut[x]; y++) img.data[(y * nw + x) * 4 + 3] *= Math.max(0, 1 - (cut[x] - y) / GROUND_CUT.soft);
      c.width = nw; c.height = nh - y0; c.getContext('2d')?.putImageData(img, 0, -y0);
    }
    grounds.set(image, c);
  }
  return c;
}
function topOf(image: HTMLImageElement) {
  let c = tops.get(image);
  if (!c) { c = document.createElement('canvas'); c.width = 16; c.height = 1; const t = c.getContext('2d'); if (t) { t.imageSmoothingQuality = 'high'; t.drawImage(image, 0, 0, image.naturalWidth, 8, 0, 0, 16, 1); } tops.set(image, c); }
  return c;
}
/** The owner's drawn effects (`siege/fx/<name>-<frame>`) and how many frames each plays. */
/** Effects drawn on the ground: the share of their height (from the top) where their ring or dust meets the ground,
    measured on the sheets; that row is put on the ground line, so the ring circles the troop's feet. */
const FX_GROUND: Record<string, number> = { 'arrive-land': 0.79, 'arrive-foe': 0.8, 'arrive-heavy': 0.71 };
const FX_FRAMES: Record<string, number> = {
  'hit-bullet': 5, 'hit-thrown': 5, 'hit-energy': 5, 'hit-ice': 5, 'hit-magic': 5, 'hit-heavy': 5, stun: 4, shatter: 4, heal: 6, aura: 4,
  wreck: 7, soul: 6, crash: 6, loot: 6, trail: 6, smoke: 5, 'arrive-land': 6, 'arrive-air': 6, 'arrive-heavy': 6, 'arrive-foe': 6, 'rock-land': 5,
  burn: 6, collapse: 5, warn: 4, 'storm-bolt': 3, spray: 6, crater: 5, step: 5, charge: 6, horn: 4, skull: 5,
  'dragonfire': 4, 'anchor-hit': 4, 'hand-1': 6, 'hand-2': 6, 'hand-3': 6, 'hand-4': 6, 'king-portal': 2,
  'bowflash-1': 4, 'bowflash-2': 4, 'bowflash-3': 4, 'bowflash-4': 4, 'bird-blue': 4, 'bird-brown': 4,
};
/** Each world's drifting particles (`siege/fx/amb-<kind>-<n>`, six of each): how they move. */
const AMBIENT: Record<number, { kind: string; n: number; fall: number; drift: number; spin: number; size: number }> = {
  1: { kind: 'leaf', n: 6, fall: 22, drift: 26, spin: 1.2, size: 13 }, 2: { kind: 'leaf', n: 6, fall: 20, drift: 30, spin: 1.4, size: 12 },
  3: { kind: 'firefly', n: 6, fall: -4, drift: 14, spin: 0, size: 12 }, 4: { kind: 'sand', n: 6, fall: 4, drift: 120, spin: 0.6, size: 16 },
  5: { kind: 'snow', n: 6, fall: 30, drift: 12, spin: 0.8, size: 10 }, 6: { kind: 'ember', n: 6, fall: -26, drift: 10, spin: 1, size: 12 },
};
const FX_STILLS = [...[1, 2, 3, 4].flatMap(n => [`eye-${n}`, `eye-fire-${n}`]), 'ice-block', 'piece-gear', 'piece-bolt', 'piece-plate', 'casing', 'streak', 'storm-sky', 'rubble', 'piece-stone', 'piece-beam', 'piece-flag',
  ...[0, 1, 2].flatMap(n => [`scorch-${n}`, `crack-${n}`]), ...Object.values(AMBIENT).flatMap(a => Array.from({ length: a.n }, (_, k) => `amb-${a.kind}-${k}`))];
const fxFrame = (name: string, p: number) => still(`siege/fx/${name}-${Math.max(0, Math.min(FX_FRAMES[name] - 1, Math.floor(p * FX_FRAMES[name])))}`);
const FX = [...Array.from({ length: 8 }, (_, f) => `siege/fx/dragonpass-${f}`), ...Array.from({ length: 12 }, (_, f) => `siege/fx/anchor-${f}`), ...Object.keys(PHASED).flatMap(n => Array.from({ length: 12 }, (_, f) => `siege/fx/${n}-${f}`)), ...Object.entries(FX_FRAMES).flatMap(([n, k]) => Array.from({ length: k }, (_, f) => `siege/fx/${n}-${f}`)), ...FX_STILLS.map(n => `siege/fx/${n}`), 'siege/mana', 'siege/mana-dark', ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap(n => [`siege/fx-boom-${n}`, `siege/fx-boom-dark-${n}`, `siege/fx-boom-cyan-${n}`]), 'siege/units/shot-crescent-gold', 'fx/fire-pool.webp', 'fx/fireball.webp', 'fx/rocket.webp', 'fx/volt-burst.webp', 'fx/impact.webp', 'fx/ice-block.webp', 'siege/units/shot-arrow', 'siege/units/shot-ice', 'siege/units/shot-lightning', ...[0, 1, 2].map(n => `fx/wave-strip-${n}.webp`), ...[0, 1, 2, 3, 4, 5, 6].map(n => `fx/icicle-0-${n}.webp`), 'arrows/water.webp', 'arrows/leaf.webp', 'fx/boom-big.webp', 'fx/impact.webp', ...[1, 2, 3, 4, 5, 6].map(n => `fx/bolt-y-${n}.webp`), 'siege/fx/wave-toll', 'siege/fx/wave-scream'];
/** Pictures drawn whole (backdrop, floor, effects): no alpha crop needed. */
const stills = new Map<string, HTMLImageElement>();
function still(path: string) {
  let image = stills.get(path);
  if (!image) { image = new Image(); image.src = art(/\.\w+$/.test(path) ? path : `${path}.webp`); stills.set(path, image); }
  return image;
}
const ok = (image: HTMLImageElement) => image.complete && image.naturalWidth > 0;
/** CSS pixels kept clear left of the field for the aim control. */
const AIM_GUTTER = 60;
/** The fortresses, side on (`siege/castle-N` ours, facing right; `siege/enemy-N` theirs, facing left): five pictures
    each, ours by its workshop level, theirs by world (`looksTier`, `enemyTier`). `h` is the height drawn in field
    units; `deck` how far its foot sinks under the ground line. Our crossbow stands on the battlement at the top right:
    `bow` is that spot as fractions of the picture (x from the left, y from the top). */
const CASTLES = [
  { h: 190, deck: 8, bow: [0.79, 0.17] },
  { h: 225, deck: 8, bow: [0.74, 0.25] },
  { h: 275, deck: 8, bow: [0.79, 0.36] },
  { h: 325, deck: 8, bow: [0.73, 0.32] },
  { h: 365, deck: 8, bow: [0.81, 0.405] },
] as const;
const ENEMY_H = [200, 235, 270, 310, 350];
/** Field units kept clear at the top of the view for the HUD (about 62 screen pixels); set each frame by `render`, read by the
    fortresses so a tall one never runs under the energy and health bars on a short screen. */
let hudRoom = 40;
/** Our crossbow in its turret (`siege/xbow-N`, by the Bow level: three crossbows and a rocket launcher), one picture
    pointing right drawn `width` field units wide, turning on its wheel (`pivot`, fractions of the picture) towards where
    the arrows go and kicking back a little at each shot. */
const XBOW = { width: 83, pivot: [[0.35, 0.62], [0.28, 0.54], [0.34, 0.58], [0.25, 0.6]] } as const;
/** Where our crossbow's arm turns, worked out by `base()` each frame: arrows and the missile leave from it. */
let bowAt = { x: 80, y: 0 };
/** The mana monument's box on the canvas (CSS pixels), for taps: tapping it raises the generator. */
let manaBox = { x: 0, y: 0, w: 0, h: 0 };
export const onMana = (x: number, y: number) => x >= manaBox.x && x <= manaBox.x + manaBox.w && y >= manaBox.y && y <= manaBox.y + manaBox.h;
/** What our crossbow shoots, by its look: Cartoon's arrow, or a rocket from the rocket launcher (level 4). */
let bolt = 'siege/units/bolt-1';
let lastShots = 0, kickUntil = 0, flashAt = -9;
/** Smoke, then flames, on a fortress as it loses health: the owner's drawn smoke puffs and flame loops, more of them
    the lower it gets, each burning at its own pace. */
function damage(ctx: CanvasRenderingContext2D, w: number, h: number, left: number, hp: number, max: number, t: number) {
  const k = hp / max;
  if (k > 0.7) return;
  const spots = k > 0.45 ? [[0.35, 0.45]] : k > 0.2 ? [[0.3, 0.4], [0.68, 0.55]] : [[0.3, 0.4], [0.68, 0.55], [0.5, 0.75], [0.2, 0.7]];
  spots.forEach(([fx, fy], i) => {
    const x = left + w * fx, y = -h * (1 - fy);
    for (let n = 0; n < 2; n++) {
      const p = (t * 0.45 + n * 0.5 + i * 0.3) % 1, puff = fxFrame('smoke', p), sz = 26 + p * 30;
      if (ok(puff)) { ctx.globalAlpha = 0.8 * (1 - p); ctx.drawImage(puff, x - sz / 2 + p * 8, y - 18 - p * 50 - sz / 2, sz, sz * puff.naturalHeight / puff.naturalWidth); }
    }
    ctx.globalAlpha = 1;
    if (k <= 0.45) {
      const flame = fxFrame('burn', (t * 1.6 + i * 0.37) % 1);
      if (ok(flame)) { const fw = 30 + (i % 2) * 8, fh = fw * flame.naturalHeight / flame.naturalWidth; ctx.drawImage(flame, x - fw / 2, y - fh + 8, fw, fh); }
    }
  });
}
function base(ctx: CanvasRenderingContext2D, s: Siege, x: number, ground: number, color: string, enemy: boolean) {
  const hp = s.hp[enemy ? 1 : 0], max = s.maxHp[enemy ? 1 : 0];
  // In a duel the other fortress is the rival's own, as strong as its workshop made it.
  const tier = enemy ? (s.duel ? castleTier(s.duel.fort) : enemyTier(s.world)) : castleTier(s.fort);
  // The Villain campaign swaps the pictures: the dark fortress is ours (left, facing right), our castle theirs.
  const dark = enemy !== !!s.villain;
  const wall = still(`siege/${dark ? 'enemy' : 'castle'}-${tier}`);
  ctx.save(); ctx.translate(x, ground);
  let top = -169;
  if (ok(wall)) {
    // Never taller than the room above the deck under the HUD.
    const look = CASTLES[tier - 1];
    const h = Math.min(dark ? ENEMY_H[tier - 1] : look.h, ground - Math.max(30, hudRoom)), w = h * wall.naturalWidth / wall.naturalHeight;
    // Kept whole on the field: a wide one moves in from the field's edge rather than past it.
    const foot = dark ? 10 : look.deck, left = enemy ? Math.min(-w / 2, FIELD - 4 - x - w) : Math.max(-w / 2, 4 - x);
    // The enemy's pictures face front-right; the fortress is turned to face our side (left).
    // Fallen, it sinks into its dust cloud and is gone; a pile of rubble is left where it stood.
    const fall = enemy && s.razed ? s.effects.find(e => e.art === 'collapse') : undefined, sunk = enemy && s.razed ? (fall ? Math.min(1, (1 - fall.life / fall.max) / 0.45) : 1) : 0;
    if (sunk > 0) { const rubble = still('siege/fx/rubble'); if (ok(rubble)) { const rw = w * 0.95, rh = rw * rubble.naturalHeight / rubble.naturalWidth; ctx.drawImage(rubble, left + (w - rw) / 2, foot - rh + 4, rw, rh); } }
    if (sunk < 1) {
      if (enemy) { ctx.save(); ctx.translate(left + w / 2, 0); ctx.scale(-1, 1); ctx.translate(-(left + w / 2), 0); }
      ctx.save(); ctx.globalAlpha = 1 - sunk; ctx.beginPath(); ctx.rect(left - 50, -h * 2, w + 100, h * 2 + foot); ctx.clip();
      ctx.drawImage(wall, left, -h + foot + h * sunk * 0.8, w, h); ctx.restore();
      if (enemy) ctx.restore();
      if (!sunk) damage(ctx, w, h - foot, left, hp, max, s.time);
    }
    top = -h + foot - 6;
    if (!enemy) {
      // The crossbow seated in the turret, turning on its wheel.
      const bowTier = looksTier(s.bow.level), arm = still(`siege/xbow-${bowTier}`), [fx, fy] = XBOW.pivot[bowTier - 1];
      bolt = `siege/units/bolt-${bowTier}`;
      const spot = dark ? [0.72, 0.24] : look.bow, px = left + w * spot[0], py = -h + foot + h * spot[1];
      bowAt = { x: x + px, y: ground + py };
      if ((s.shots ?? 0) !== lastShots) { lastShots = s.shots ?? 0; kickUntil = s.time + 0.09; flashAt = s.time; }
      // The Villain's fortress has the Eye of Darkness in its turret instead: it glares (and flashes) as each volley of
      // hands is sent; there are no arrows to aim, so it does not turn.
      const eye = s.villain ? still(`siege/fx/${s.time < kickUntil + 0.12 ? 'eye-fire' : 'eye'}-${bowTier}`) : undefined;
      if (eye && ok(eye)) {
        const ew = XBOW.width * 1.05, eh = ew * eye.naturalHeight / eye.naturalWidth;
        ctx.drawImage(eye, px - ew * 0.42, py - eh * 0.72, ew, eh);
        bowTip = { x: bowAt.x + ew * 0.45, y: bowAt.y - eh * 0.3 }; s.bowFrom = { x: bowTip.x, up: ground - bowTip.y };
      } else if (ok(arm)) {
        const aw = XBOW.width, ah = aw * arm.naturalHeight / arm.naturalWidth;
        ctx.save(); ctx.translate(px, py); ctx.rotate(bowAngle(s, ground));
        const kick = s.time < kickUntil ? -5 : 0;
        ctx.drawImage(arm, -aw * fx + kick, -ah * fy, aw, ah);
        ctx.restore();
        const ang = bowAngle(s, ground), reach = aw * (1 - fx);
        bowTip = { x: bowAt.x + Math.cos(ang) * reach, y: bowAt.y + Math.sin(ang) * reach };
        // The model sends the arrows along the same path, to strike the flyers it crosses.
        s.bowFrom = { x: bowTip.x, up: ground - bowTip.y };
        // Each volley flashes at the tip, in the look of its tier (wood, steel, gold, energy).
        const fp = (s.time - flashAt) / 0.16, flash = fp >= 0 && fp < 1 ? fxFrame(`bowflash-${bowTier}`, fp) : undefined;
        if (flash && ok(flash)) { const fw = 34, fh = fw * flash.naturalHeight / flash.naturalWidth; ctx.drawImage(flash, bowTip.x - x - fw / 2, bowTip.y - ground - fh / 2, fw, fh); }
      }
      top = Math.min(top, py - 30);
    }
  } else {
    ctx.shadowColor = color; ctx.shadowBlur = 18;
    ctx.fillStyle = '#111f32'; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-49, 0); ctx.lineTo(-49, -115); ctx.lineTo(-32, -115); ctx.lineTo(-32, -145); ctx.lineTo(32, -145); ctx.lineTo(32, -115); ctx.lineTo(49, -115); ctx.lineTo(49, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    if (!enemy) bowAt = { x, y: ground - 110 };
  }
  ctx.fillStyle = '#050d18'; ctx.fillRect(-60, top - 6, 120, 9); ctx.fillStyle = color; ctx.fillRect(-59, top - 5, 118 * Math.max(0, hp / max), 7);
  ctx.restore();
}
/** The crossbow arm's angle: the way an arrow leaves it for the current aim (the start of its arc): down at a near aim,
    rising as the aim goes further, nearly straight up where the arrows rain from the sky. */
/** The bow's reach this frame (set as the battle is drawn), so arrows already in flight keep its arc. */
let reachNow = FIELD * 0.8;
function bowAngle(s: Siege, ground: number) {
  reachNow = bowReach(s.bow);
  // Aimed as a real crossbow would be: the angle whose shot, at the bow's one speed and under gravity, lands on the aim
  // (the flatter of the two). Near aims point down at the ground before our wall, far ones rise.
  const x = aimAt(s.aim); return shotFor(x - bowAt.x, ground - 2 - bowAt.y, x, bowReach(s.bow)).a;
}
/** The tip of our crossbow (where shots leave it), set when it is drawn. */
let bowTip = { x: 80, y: 0 };
/** The camera: its left edge and width in field units, and how far left of the field it may go (a margin past our
    wall, so the aim control stands clear of it). */
/** How the field is viewed, from the settings: `wide` (a wide screen only) stands the camera back until both fortresses
    are on screen at once; otherwise it follows the camera over a stretch of the field. */
export const viewPrefs = { wide: false };
/** The far view's ground line, as a share of the view's height: the picture is drawn whole across the view and
    stretched down to it (taller than drawn, never cropped at the sides). */
const FAR_DECK = 0.7;
export interface Camera { x: number; width: number; min?: number; deck?: number;
  /** CSS pixels at the foot of the view covered by the card bar laid over the field: the ground line stays above them. */
  bottom?: number;
  /** Where the HUD's gold and energy counters are on the canvas (CSS pixels): fallen enemies' orbs fly to them. */
  goldAt?: { x: number; y: number }; manaAt?: { x: number; y: number } }
/** The HUD counters' spots for this frame (`Camera.goldAt`, `manaAt`). */
let hud: Pick<Camera, 'goldAt' | 'manaAt'> = {};
/** The painted backdrop, kept between frames (see `render`). */
const backdrop = { canvas: document.createElement('canvas'), key: '' };
/** The canvas's size in CSS pixels, read once and again only when it changes (a ResizeObserver), not every frame. */
const sizes = new WeakMap<HTMLCanvasElement, { w: number; h: number }>();
function sizeOf(canvas: HTMLCanvasElement) {
  let size = sizes.get(canvas);
  if (!size) {
    const r = canvas.getBoundingClientRect(); const fresh = { w: r.width, h: r.height }; size = fresh; sizes.set(canvas, fresh);
    if ('ResizeObserver' in window) new ResizeObserver(([e]) => { fresh.w = e.contentRect.width; fresh.h = e.contentRect.height; }).observe(canvas);
    else sizes.delete(canvas);
  }
  return size;
}
export function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, s: Siege, camera: Camera, reduced: boolean) {
  dragAt = s.zones?.find(z => z.kind === 'drag')?.x;
  hud = camera;
  const { w, h } = sizeOf(canvas);
  if (!w || !h) return;
  // Full sharpness (the screen's pixels, at most 2 a CSS pixel): the troops must stay crisp.
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const color = THEMES[actOf(s.world) - 1];
  // Short, wide fields zoom in a little more, so the troops keep their size.
  // A wide view stands further back (more field and sky, smaller troops); an upright phone keeps it closer.
  const scale = viewPrefs.wide && w >= h ? Math.min(h / 425, w / (FIELD + AIM_GUTTER * 2 + 80)) : w >= h ? Math.min(h / (w / h > 2.2 ? 360 : 425), w / 810) : Math.min(h / 340, w / 650);
  camera.width = w / scale; hudRoom = 62 / scale;
  camera.min = -AIM_GUTTER / scale;
  camera.x = Math.max(camera.min, Math.min(Math.max(camera.min, FIELD - camera.width), camera.x));
  // The stretch of field on screen: the special powers cover it (the model reads it when one is cast).
  s.view = { x: camera.x, width: camera.width };
  // The ground line sits low, so the picture's ground and the sky above both show.
  camera.deck = w / h > 2.2 ? 0.74 : 0.7;
  // A tall view (a phone upright): the ground line comes down until the picture's foot reaches the bottom of the view.
  const below = (FIELD + SCENE_FIT.pad * 2) * (1 - fitOf(sceneOf(s.world)).feet) * 724 / 2172;
  camera.deck = Math.max(camera.deck, 1 - (below * 0.95 * scale) / h);
  const viewH = h / scale;
  const scene = still(sceneOf(s.world));
  // The far view: the whole picture across the view, its top at the top; the ground line comes up to its walking line.
  const far = camera.width >= FIELD;
  if (far) camera.deck = FAR_DECK;
  if (camera.bottom) camera.deck = Math.min(camera.deck, 1 - (camera.bottom + 4) / h);
  const ground = h / scale * camera.deck;
  // The backdrop (sky, far landscape, ground, gloom) is painted into its own canvas and only repainted when the view
  // moves or resizes; otherwise each frame copies it whole (one picture instead of a dozen large ones).
  const key = `${s.villain ? 'v' : ''}${sceneOf(s.world)}|${ok(scene)}|${camera.x.toFixed(2)}|${camera.width.toFixed(1)}|${canvas.width}x${canvas.height}|${ground.toFixed(2)}`;
  if (backdrop.key !== key) {
    backdrop.key = key; const c = backdrop.canvas; if (c.width !== canvas.width || c.height !== canvas.height) { c.width = canvas.width; c.height = canvas.height; }
    const b = c.getContext('2d')!; b.setTransform(dpr, 0, 0, dpr, 0, 0);
    // The Villain campaign sees the world turned round: its own (corrupt) side on the left, where it stands.
    const put = (img: CanvasImageSource, sx: number, sy: number, sw0: number, sh0: number, dx: number, dy: number, dw: number, dh: number) => {
      if (!s.villain) { b.drawImage(img, sx, sy, sw0, sh0, dx, dy, dw, dh); return; }
      b.save(); b.translate(dx * 2 + dw, 0); b.scale(-1, 1); b.drawImage(img, sx, sy, sw0, sh0, dx, dy, dw, dh); b.restore();
    };
    const sky = b.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#080f21'); sky.addColorStop(1, '#172c3c');
    b.fillStyle = sky; b.fillRect(0, 0, w, h);
    b.scale(scale, scale); b.translate(-camera.x + Math.max(0, (camera.width - FIELD) / 2), 0);
    if (ok(scene)) {
      // Two layers. The far landscape keeps its size (`SCENE_W`) and slides slower than the field (parallax): from its
      // left edge with the camera at our end to its right edge at the enemy's. The ground layer (`groundOf`) moves with
      // the troops, stretched along the whole field (a little wider than the picture), so it changes along the way as the
      // landscape behind it does. Its sky colours carry on above the picture.
      // A tall view (a phone upright) draws it big enough to reach the view's top (no stretched sky above it). On a wide
      // view the far landscape is drawn smaller, so its top meets the view's top (none of it cut off above) while
      // its walking line stays at the troops' feet; never narrower than the view. A tall view keeps it at `SCENE_W`.
      // Shrunk like that it would barely slide (hardly wider than the view), so it is also widened by `SCENE_WIDEN`: the
      // camera's run then moves it about five times as far, while its height still fits the view.
      const ratio = scene.naturalHeight / scene.naturalWidth, feet = fitOf(sceneOf(s.world)).feet, fit = Math.max(ground / feet, camera.width * ratio);
      const sh = far || w < h ? Math.max(SCENE_W * ratio, ground / feet) : CLOSE.has(sceneOf(s.world)) ? SCENE_W * ratio : Math.min(SCENE_W * ratio, fit), sw = far ? camera.width : sh / ratio * (sh < SCENE_W * ratio ? SCENE_WIDEN : 1), top = ground - sh * feet;
      const lo = camera.min ?? 0, hi = Math.max(lo, FIELD - camera.width), k = hi > lo ? (camera.x - lo) / (hi - lo) : 0.5;
      // The view's left edge in field units (a far view centres the field, so it starts before the camera's x).
      const left = camera.x - Math.max(0, (camera.width - FIELD) / 2);
      const x0 = left - Math.max(0, sw - camera.width) * k - Math.max(0, camera.width - sw) / 2;
      // When the view runs below the picture, its foreground (the part under the walking ground) is stretched down to
      // the view's foot, so the picture itself fills it (never one stretched row, which reads as a blur).
      const nw = scene.naturalWidth, nh = scene.naturalHeight, gRow = nh * feet, foot = Math.max(top + sh, viewH + 1);
      put(scene, 0, 0, nw, gRow, x0, top, sw, ground - top);
      put(scene, 0, gRow, nw, nh - gRow, x0, ground, sw, foot - ground);
      const band = groundOf(scene, sceneOf(s.world)), y0 = nh - band.height, layer = top + sh * (y0 / nh);
      const gx = Math.min(-SCENE_FIT.pad, left), gw = Math.max(FIELD + SCENE_FIT.pad, left + camera.width) - gx;
      put(band, 0, 0, nw, gRow - y0, gx, layer, gw, ground - layer);
      put(band, 0, gRow - y0, nw, nh - gRow, gx, ground, gw, foot - ground);
      if (top > 0) {
        const strip = topOf(scene), fade = 60;
        put(strip, 0, 0, 16, 1, x0, -1, sw, top + 2);
        for (let i = 0; i < 12; i++) { b.globalAlpha = 1 - (i + 0.5) / 12; put(strip, 0, 0, 16, 1, x0, top + (i * fade) / 12, sw, fade / 12 + 0.5); }
        b.globalAlpha = 1;
      }
    } else {
      const [deck, low] = GROUND[actOf(s.world) - 1];
      const earth = b.createLinearGradient(0, ground - 10, 0, viewH); earth.addColorStop(0, deck); earth.addColorStop(1, low);
      b.fillStyle = earth; b.fillRect(-SCENE_FIT.pad, ground - 10, FIELD + SCENE_FIT.pad * 2, viewH);
    }
    // The Darkness spreading act by act (`gloom`): over the land and sky, deeper on the enemy's side; not over the
    // fortresses or troops. Only over the first picture: the worlds' own show their corruption.
    const g = sceneOf(s.world) === SCENE ? gloom(actOf(s.world)) : 0;
    if (g > 0) {
      const shade = b.createLinearGradient(0, 0, FIELD, 0);
      shade.addColorStop(0, `rgba(14,4,22,${(g * 0.6).toFixed(2)})`); shade.addColorStop(1, `rgba(30,2,14,${g.toFixed(2)})`);
      b.fillStyle = shade; b.fillRect(-SCENE_FIT.pad - camera.width, -viewH * 3, FIELD + (SCENE_FIT.pad + camera.width) * 2, viewH * 6);
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(backdrop.canvas, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.scale(scale, scale); ctx.translate(-camera.x + Math.max(0, (camera.width - FIELD) / 2), 0);
  // The world's air (leaves, snow, embers, birds) drifts in the background, behind the fortresses and the troops.
  if (!reduced) ambient(ctx, s, camera, ground, viewH);
  base(ctx, s, 80, ground, '#55e5c4', false);
  base(ctx, s, FIELD - 80, ground, '#ff718c', true);
  mana(ctx, s, ground);
  const aimY = ground + 10;
  ctx.strokeStyle = '#ffe3a0'; ctx.globalAlpha = 0.65; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.ellipse(s.aim, aimY, 45, 13, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  // The fallen lie where they fell for a moment (the six-pose sheets' last pose; the others tip over), then fade.
  // What is off screen is not drawn (a margin for the big ones, the guardians' sweeps and the falling powers).
  const left = camera.x - 260, right = camera.x + camera.width + 260, seen = (x: number) => x >= left && x <= right;
  for (const c of fallen(s)) if (seen(c.u.x)) fighter(ctx, s, c.u, ground, reduced, color, Math.min(1, (s.time - c.at) / DEAD_FOR));
  // Beams (the ray gun's and the others') are drawn first, under the troops, so a shooter stands over its own ray.
  const beam = (e: Effect) => e.kind === 'shot' && isBeam(e.art);
  for (const e of s.effects) if (beam(e) && !(e.x < left - 500 && e.from < left - 500 || e.x > right + 500 && e.from > right + 500)) effect(ctx, e, 1 - e.life / e.max, ground - 26, ground);
  // Marks and dust on the ground lie under the troops, and so do the arrivals (the circle, the portal, the dust ring,
  // the whirl): the troop steps out of them, drawn over.
  const under = (e: Effect) => e.floor || (e.kind === 'anim' && !!e.art?.startsWith('arrive-'));
  for (const e of s.effects) if (under(e) && seen(e.x)) effect(ctx, e, 1 - e.life / e.max, ground - 26, ground);
  for (const u of s.units.filter(u => seen(u.x)).sort((a, b) => a.lane - b.lane || a.x - b.x)) fighter(ctx, s, u, ground, reduced, color);
  for (const e of s.effects) {
    if (under(e) || beam(e) || e.x < left - 500 && e.from < left - 500 || e.x > right + 500 && e.from > right + 500) continue;
    const p = 1 - e.life / e.max; const y = ground - 26;
    if (effect(ctx, e, p, y, ground)) continue;
    ctx.globalAlpha = e.life / e.max; ctx.strokeStyle = e.side ? '#ff98b0' : '#fff0ae'; ctx.lineWidth = 3;
    ctx.beginPath();
    if (e.kind === 'shot') { ctx.moveTo(e.from + (e.x - e.from) * p, y - Math.sin(p * Math.PI) * 30); ctx.lineTo(e.from + (e.x - e.from) * Math.min(1, p + 0.15), y); }
    else ctx.ellipse(e.x, ground + 10, 30 + p * 100, 12 + p * 26, 0, 0, Math.PI * 2);
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  moments(ctx, s, w, h, reduced);
}
/** The world's air: its particles drifting over the battle (leaves, fireflies, sand, snow, embers), and now and then a
    bird crossing the sky. Worked out from the time alone, so nothing is kept between frames. */
function ambient(ctx: CanvasRenderingContext2D, s: Siege, camera: Camera, ground: number, viewH: number) {
  const a = AMBIENT[actOf(s.world)]; if (!a) return;
  const x0 = camera.x - 40, span = camera.width + 80, top = ground - viewH + 40, depth = viewH - 60;
  ctx.save();
  for (let i = 0; i < 16; i++) {
    const seed = (i * 0.618034) % 1, speed = 0.6 + ((i * 0.37) % 1) * 0.8;
    const fy = ((seed + s.time * a.fall * speed / depth) % 1 + 1) % 1, fx = ((seed * 7.3 + s.time * a.drift * speed / span) % 1 + 1) % 1;
    const x = x0 + fx * span + Math.sin(s.time * 1.3 + i) * 10, y = a.fall ? top + fy * depth : top + depth * (0.35 + 0.5 * seed) + Math.sin(s.time * 2 + i * 3) * 8;
    const art = still(`siege/fx/amb-${a.kind}-${i % a.n}`); if (!ok(art)) continue;
    // Far off: small and a little faded, so they read as the distance, not as things in front of the battle.
    const w = a.size * (0.5 + seed * 0.35), h = w * art.naturalHeight / art.naturalWidth;
    ctx.globalAlpha = a.kind === 'firefly' ? 0.4 + 0.35 * Math.sin(s.time * 4 + i * 2) : 0.6;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(s.time * a.spin + i) * a.spin); ctx.drawImage(art, -w / 2, -h / 2, w, h); ctx.restore();
  }
  // A bird across the sky every twenty seconds or so, the far side to the near.
  const cycle = 21, k = Math.floor(s.time / cycle), q = (s.time % cycle) / 7;
  if (q < 1) {
    const bird = fxFrame(k % 2 ? 'bird-brown' : 'bird-blue', (s.time * 3) % 1);
    if (ok(bird)) { const bw = 30, bh = bw * bird.naturalHeight / bird.naturalWidth; ctx.globalAlpha = 0.95; ctx.drawImage(bird, camera.x - 40 + (camera.width + 80) * q, top + 20 + (k % 3) * 22 + Math.sin(q * 9) * 6, bw, bh); }
  }
  ctx.restore();
}
/** Moments shown on the screen itself, over the battle: the war horn of a new wave, the guardian's skull as it comes,
    and the storm sky of the lightning power with its bolts. */
function moments(ctx: CanvasRenderingContext2D, s: Siege, w: number, h: number, reduced: boolean) {
  for (const e of s.effects) {
    if (e.kind !== 'anim' || !e.hud || !e.art) continue;
    const p = 1 - e.life / e.max; if (p < 0) continue;
    ctx.save();
    if (e.art === 'storm-sky') {
      const sky = still('siege/fx/storm-sky'); if (!ok(sky)) { ctx.restore(); continue; }
      // High in the sky: its top half above the screen's edge, the bottom of the clouds showing under the HUD.
      const sh = Math.min(h * 0.32, w * sky.naturalHeight / sky.naturalWidth * 1.4), y = -sh * 0.42 - sh * 0.25 * (1 - Math.min(1, p * 6));
      ctx.globalAlpha = Math.min(1, p * 6, (1 - p) * 4) * 0.95;
      for (let x = -((s.time * 12) % (sh * sky.naturalWidth / sky.naturalHeight)); x < w; x += sh * sky.naturalWidth / sky.naturalHeight) ctx.drawImage(sky, x, y, sh * sky.naturalWidth / sky.naturalHeight, sh);
      if (!reduced) for (let i = 0; i < 3; i++) {
        const f = (p * 5 + i * 0.37) % 1, bolt = fxFrame('storm-bolt', f); if (!ok(bolt) || f > 0.6) continue;
        const bw = Math.min(160, w * 0.22), bh = bw * bolt.naturalHeight / bolt.naturalWidth; ctx.globalAlpha = 1 - f / 0.6;
        ctx.drawImage(bolt, ((i * 0.31 + Math.floor(p * 5) * 0.23) % 1) * (w - bw), y + sh * 0.2, bw, bh);
      }
    } else {
      // A badge popping in at the top middle, pulsing, then fading.
      const art = fxFrame(e.art, (p * 3) % 1); if (!ok(art)) { ctx.restore(); continue; }
      const pop = p < 0.15 ? 0.6 + 0.4 * Math.sin(p / 0.15 * Math.PI / 2) * 1.1 : 1, size = Math.min(e.size ?? 90, h * 0.24) * pop, sh = size * art.naturalHeight / art.naturalWidth;
      ctx.globalAlpha = p > 0.8 ? (1 - p) / 0.2 : 1; ctx.drawImage(art, w / 2 - size / 2, Math.max(70, h * 0.16), size, sh);
    }
    ctx.restore();
  }
}

/** A point a little further along a flight's path, for its heading; at the very end (where a step forward is the same
    spot, and the arrow would lie flat) the heading continues from a step back. */
function dirAt(at: (t: number) => { x: number; y: number }, p: number) {
  const a = at(Math.max(0, p - 0.02)), b = at(Math.min(1, p + 0.02)), here = at(p);
  return { x: here.x + (b.x - a.x), y: here.y + (b.y - a.y) };
}
/** The height a troop's shot leaves from or flies to: a hand's height on the ground, a flyer's middle in the air. */
const shotY = (up: number | undefined, y: number) => y - 15 - Math.max(0, (up ?? 0) - 10);
/** Each shooter's muzzles on its attack pose (`-3`), as shares of that picture's width and height, read off the sheet as
    drawn (an enemy's facing left): the gun's mouth, the bow, the hand that throws, the cannon on its back. Several take
    turns, shot after shot. `+` is a second gun (the heavy robot's hands). Spells fall on their target; flames, breath
    and the enemy's shots are part of their attack pose. */
/** Where a reaper's anchor is being hauled back to now (its `drag` zone), for drawing it there. */
let dragAt: number | undefined;
const zoneX = (_e: Effect) => dragAt;
/** The lightning rain's colour by form, as a filter on the blue bolt: white-yellow lightning, orange-yellow thunder,
    and the storm of wrath's blue. */
const BOLT_TINTS: Record<number, string> = { 1: 'hue-rotate(195deg) saturate(.75) brightness(1.35)', 2: 'hue-rotate(189deg) saturate(1.9) brightness(1.08)', 3: 'none' };
/** The shot sheets drawn at a higher resolution than the first ones, and the scale that keeps them their size in battle. */
const SHOT_SCALE: Record<string, number> = { darkorb: 0.75, skull: 0.7, 'plasma-cyan': 0.45, 'rocket-dark': 0.2, 'rockets-dark': 0.2, 'salvo-dark': 0.2 };
const MUZZLE: Record<string, [number, number][]> = {
  'ally-archer-1': [[0.69, 0.36]], 'ally-archer-2': [[0.71, 0.27]], 'ally-archer-3': [[0.75, 0.43]], 'ally-archer-4': [[0.86, 0.44]],
  'ally-gunner-1': [[0.74, 0.45]], 'ally-gunner-2': [[0.73, 0.46]], 'ally-gunner-3': [[0.72, 0.35], [0.72, 0.52]], 'ally-gunner-4': [[0.74, 0.43]],
  'ally-blaster-1': [[0.73, 0.33]], 'ally-blaster-2': [[0.74, 0.46]], 'ally-blaster-3': [[0.76, 0.44]],
  'ally-robot-1': [[0.74, 0.2]], 'ally-robot-2': [[0.75, 0.31], [0.75, 0.46]], 'ally-robot-3': [[0.74, 0.41], [0.74, 0.59]],
  'ally-heavy-robot-1': [[0.72, 0.54], [0.32, 0.61]],
  'ally-heavy-robot-2': [[0.64, 0.17], [0.25, 0.16]], 'ally-heavy-robot-2+': [[0.74, 0.54], [0.44, 0.56]],
  'ally-heavy-robot-3': [[0.69, 0.15], [0.37, 0.15]], 'ally-heavy-robot-3+': [[0.74, 0.56], [0.43, 0.58]],
  'ally-heavy-robot-4': [[0.58, 0.14]], 'ally-heavy-robot-4+': [[0.72, 0.6], [0.36, 0.62]],
  'ally-armed-fighter-1': [[0.74, 0.49]], 'ally-armed-fighter-2': [[0.7, 0.46]], 'ally-armed-fighter-3': [[0.58, 0.5]], 'ally-armed-fighter-4': [[0.6, 0.55]],
  'ally-helicopter-1': [[0.66, 0.66]], 'ally-helicopter-2': [[0.48, 0.7], [0.86, 0.79]], 'ally-helicopter-3': [[0.58, 0.72], [0.88, 0.82]],
  'ally-angel-2': [[0.85, 0.21]], 'ally-angel-3': [[0.7, 0.43]],
  'ally-mech-2': [[0.62, 0.45]], 'ally-mech-3': [[0.82, 0.6]], 'ally-mech-5': [[0.5, 0.45]],
  'boss-dark-king-air': [[0.2, 0.42]], 'boss-dark-king-air+': [[0.45, 0.17]],
  'foe-shooter-1': [[0.03, 0.52]], 'foe-archer-1': [[0.05, 0.5]],
  'ally-catapult-1': [[0.32, 0.12]], 'ally-catapult-2': [[0.85, 0.12]], 'ally-balloon-1': [[0.5, 0.97]],
};
/** Where a shot leaves from (`e.gun`): its muzzle on the shooter's attack pose, placed as `fighter` draws that pose (the
    same size, on its feet, or on its middle when it flies); otherwise the old height over the thrower's x. */
function muzzle(e: Effect, y: number) {
  const g = e.gun, base = g?.sprite.replace(/\+$/, ''), list = g && MUZZLE[g.sprite.slice('siege/units/'.length)];
  if (g && base && list) {
    const stand = picture(`${base}-0`).image, art = picture(`${base}-3`).image;
    if (ok(stand) && ok(art)) {
      const [mx, my] = list[g.i % list.length], k = g.size / stand.naturalHeight, anchor = POSE_ANCHOR[`${base}-3`];
      const fx = anchor ? anchor[0] : g.air ? 0.5 : feetOf(art), fy = anchor ? anchor[1] : 1, ahead = (g.left ? fx - mx : mx - fx) * art.naturalWidth * k;
      const ground = y + 26 - (g.air ? (e.fromUp ?? 0) + e.lane * 8 : 0);
      return { x: e.from + (e.side ? -ahead : ahead), y: ground - (fy - my) * art.naturalHeight * k };
    }
  }
  return { x: e.from, y: shotY(e.fromUp, y) };
}
/** Every picture a troop's attack shows on its way (`siege/units/shot-<name>`): thrown things, rockets, bullets, beams. */
const SHOTS = ['rock', 'javelin', 'arrow', 'shuriken', 'rocket', 'rockets', 'salvo', 'ice', 'plasma', 'crescent', 'missile', 'bullet', 'bullet-rifle', 'bullet-uzi', 'bullet-sniper', 'ray', 'ray-blue', 'ray-gold', 'ray-pink', 'ray-red', 'arrow-red', 'boulder', 'boulder-blue', 'bomb', 'darkorb', 'skull', 'plasma-cyan', 'plasma-cyan-flash', 'rocket-dark', 'rockets-dark', 'salvo-dark'];
/** The effect art: our crossbow's Cartoon arrows (or rockets) and missile, the old painted arrows (water for our troops,
    leaf for theirs),
    impacts up close, and a blast with the yellow lightning for the discharge. */
function effect(ctx: CanvasRenderingContext2D, e: Effect, p: number, y: number, ground: number) {
  if (e.kind === 'anim' && e.art && PHASED[e.art]) {
    // A power at work, in three parts (`PHASED`): coming in, looping while it acts, going; standing on the ground (its
    // drawn ground line on it) or floating `up` over it.
    if (p < 0) return true;
    const ph = PHASED[e.art], t = p * e.max, left = e.max - t;
    const f = t < ph.in ? Math.min(3, Math.floor(t / ph.in * 4)) : left < ph.out ? 8 + Math.min(3, Math.floor((1 - left / ph.out) * 4)) : 4 + Math.floor(t * 8) % 4;
    const art = still(`siege/fx/${e.art}-${f}`); if (!ok(art)) return false;
    const w = e.size ?? 180, h = w * art.naturalHeight / art.naturalWidth, base = ground + 6 - (e.up ?? 0);
    ctx.drawImage(art, e.x - w / 2, ph.ground ? base - h * ph.ground : base - h / 2, w, h); return true;
  }
  if (e.kind === 'anim' && e.art === 'dragonpass') {
    // The dragon flies across, breathing its fire down ahead of it (looping its breath frames), its wings beating.
    if (p < 0) return true;
    const art = still(`siege/fx/dragonpass-${4 + Math.floor(p * e.max * 10) % 4}`); if (!ok(art)) return false;
    const w = e.size ?? 230, h = w * art.naturalHeight / art.naturalWidth, x = e.from + (e.x - e.from) * p;
    ctx.save(); ctx.globalAlpha = Math.min(1, p * 8, (1 - p) * 8); ctx.drawImage(art, x - w / 2, ground - (e.up ?? 0) - h / 2, w, h); ctx.restore(); return true;
  }
  if (e.kind === 'anim' && e.art === 'anchor') {
    // The reaper's anchor: thrown in an arc from our side (spinning frames), it hooks the ground and is hauled back.
    if (p < 0) return true;
    const t = p * e.max, throwT = e.arc ?? 0.45, w = e.size ?? 150;
    let x: number, y: number, f: number;
    if (t < throwT) { const q = t / throwT; x = e.from + (e.x - e.from) * q; y = ground - 40 - Math.sin(q * Math.PI) * 140; f = Math.floor(t * 14) % 4; }
    else { const q = (t - throwT) / (e.max - throwT), z = (zoneX(e) ?? e.x); x = z; y = ground + 4; f = 4 + Math.min(3, Math.floor(q * 4)); }
    const art = still(`siege/fx/anchor-${f}`); if (!ok(art)) return false;
    const h = w * art.naturalHeight / art.naturalWidth; ctx.save(); ctx.globalAlpha = p > 0.9 ? (1 - p) / 0.1 : 1;
    ctx.drawImage(art, x - w / 2, f < 4 ? y - h / 2 : y - h, w, h); ctx.restore(); return true;
  }
  if (e.kind === 'anim' && e.art && e.hud) return true;
  if (e.kind === 'anim' && e.art && !FX_FRAMES[e.art] && FX_STILLS.includes(e.art)) {
    // A mark left on the ground (a scorch, a crack): flat under the troops, fading out over its last third.
    if (p < 0) return true;
    const art = still(`siege/fx/${e.art}`); if (!ok(art)) return false;
    const w = e.size ?? 60, h = w * art.naturalHeight / art.naturalWidth * (e.floor ? 0.6 : 1);
    ctx.save(); ctx.globalAlpha = (p < 0.08 ? p / 0.08 : p > 0.66 ? (1 - p) / 0.34 : 1) * 0.85; ctx.drawImage(art, e.x - w / 2, ground + 6 - (e.up ?? 0) - h * 0.7, w, h); ctx.restore(); return true;
  }
  if (e.kind === 'anim' && e.art && FX_FRAMES[e.art]) {
    // One of the owner's drawn effects, frame by frame: standing on the ground (`up` above it), round its middle
    // (`centre`: a hit at body height), or at a shooter's muzzle (`gun`); fading over its last frames.
    if (p < 0) return true;
    const art = fxFrame(e.art, p); if (!ok(art)) return false;
    const w = e.size ?? 50, h = w * art.naturalHeight / art.naturalWidth;
    // An arrival's ring lies round the feet: the row of its picture that is the ground (`FX_GROUND`) goes on the ground line.
    const base = FX_GROUND[e.art] !== undefined && !e.up ? h * (FX_GROUND[e.art] - 0.5) : e.centre ? 0 : h / 2;
    const at = e.gun ? muzzle(e, y) : { x: e.x, y: ground - (e.up ?? 0) - base + (e.floor ? 8 : 0) };
    ctx.save(); ctx.globalAlpha = p > 0.8 ? (1 - p) / 0.2 : 1; ctx.translate(at.x, at.y); if (e.flip) ctx.scale(-1, 1);
    ctx.drawImage(art, -w / 2, -h / 2, w, h); ctx.restore(); return true;
  }
  if (e.kind === 'piece' && e.art) {
    // A piece thrown out (a casing from a gun, scrap from a wreck): an arc from where it left down to the ground, spinning.
    if (p < 0) return true;
    const art = still(`siege/fx/${e.art}`); if (!ok(art)) return false;
    const start = e.gun ? muzzle(e, y) : { x: e.from, y: ground - (e.up ?? 0) }, end = ground - 2;
    const x = start.x + (e.x - start.x) * p, yy = start.y + (end - start.y) * p - 4 * (e.arc ?? 30) * p * (1 - p);
    const w = e.size ?? 12, h = w * art.naturalHeight / art.naturalWidth;
    ctx.save(); ctx.globalAlpha = p > 0.75 ? (1 - p) / 0.25 : 1; ctx.translate(x, yy); if (e.spin) ctx.rotate(p * 9 * (e.x < e.from ? -1 : 1));
    ctx.drawImage(art, -w / 2, -h / 2, w, h); ctx.restore(); return true;
  }
  if (e.kind === 'rocket') {
    const art = still('siege/units/shot-missile'); if (!ok(art)) return false;
    // From the crossbow on our battlement (`bowAt`) to the aim.
    const from = e.side ? e.from : bowTip.x, y0 = e.side ? ground - 110 : bowTip.y;
    // A missile flies straight at its spot, no gravity.
    const at = (t: number) => ({ x: from + (e.x - from) * t, y: y0 + (ground + 4 - y0) * t });
    const here = at(p), ahead = dirAt(at, p), len = 64, h = len * art.naturalHeight / art.naturalWidth;
    ctx.save(); ctx.translate(here.x, here.y); ctx.rotate(Math.atan2(ahead.y - here.y, ahead.x - here.x || 0.001));
    ctx.drawImage(art, -len / 2, -h / 2, len, h); ctx.restore(); return true;
  }
  // The special powers: things falling on the field, lightning, the tsunami and what they leave where they land.
  if (e.kind === 'fall' || e.kind === 'ground' || e.kind === 'zap' || e.kind === 'wave') {
    if (p < 0) return true;
    const at = ground + 2 - (e.up ?? 0);
    if (e.kind === 'fall') {
      // Down from above the screen, a little slanted, pointing along its path.
      const art = still(e.art === 'ice' ? 'siege/units/shot-ice' : e.art === 'fire' ? 'fx/fireball.webp' : e.art === 'rocket' ? 'siege/units/bolt-4' : 'siege/units/shot-arrow'); if (!ok(art)) return false;
      // The rocket rain drops the crossbow's red rockets nose first from the sky; they blow up where they land (`boom`).
      const len = e.art === 'arrow' ? 64 : e.art === 'ice' ? 60 : e.art === 'rocket' ? 74 : 58, h = len * art.naturalHeight / art.naturalWidth, drop = (1 - p) * 640;
      ctx.save(); ctx.translate(e.x - drop * 0.3, at - drop); ctx.rotate(Math.atan2(1, 0.3)); ctx.drawImage(art, -len / 2, -h / 2, len, h); ctx.restore(); return true;
    }
    if (e.kind === 'ground') {
      // Where it landed: an ice burst growing, a spark of lightning, a puff of dust.
      ctx.save(); ctx.globalAlpha = p < 0.7 ? 1 : (1 - p) / 0.3;
      if (e.art === 'ice') {
        const art = still(`fx/icicle-0-${Math.min(6, Math.floor(p * 9))}.webp`); if (!ok(art)) { ctx.restore(); return false; }
        const w = 54, h = w * art.naturalHeight / art.naturalWidth; ctx.drawImage(art, e.x - w / 2, at - h + 6, w, h);
      } else if (e.art === 'arrow') {
        // A landed arrow stuck in the ground, fading out.
        const art = still('siege/units/shot-arrow'); if (!ok(art)) { ctx.restore(); return false; }
        const ang = Math.atan2(1, 0.3), len = 64, h = len * art.naturalHeight / art.naturalWidth;
        ctx.globalAlpha = p < 0.6 ? 1 : (1 - p) / 0.4; ctx.beginPath(); ctx.rect(e.x - 80, -5000, 160, 5000 + at); ctx.clip();
        ctx.translate(e.x - Math.cos(ang) * len * 0.22, at - Math.sin(ang) * len * 0.22); ctx.rotate(ang); ctx.drawImage(art, -len / 2, -h / 2, len, h);
      } else {
        const art = still(e.art === 'volt' ? 'fx/volt-burst.webp' : 'fx/impact.webp'); if (!ok(art)) { ctx.restore(); return false; }
        const w = e.art === 'volt' ? 70 : 26, h = w * art.naturalHeight / art.naturalWidth; ctx.drawImage(art, e.x - w / 2, at - h * (e.art === 'volt' ? 0.8 : 0.6), w, h);
      }
      ctx.restore(); return true;
    }
    if (e.kind === 'zap') {
      // A column of lightning from the top of the screen to the ground, flickering as it fades.
      // The lightning rain's bolts are its form's colour (the drawing is blue: a hue turn recolours it).
      const art = still('siege/units/shot-lightning'); if (!ok(art)) return false;
      const h = at + 6, w = 130, flip = Math.floor(p * 10) % 2 ? -1 : 1, tint = BOLT_TINTS[Number(e.art) || 0];
      ctx.save(); ctx.globalAlpha = p < 0.5 ? 1 : (1 - p) / 0.5; ctx.translate(e.x, 0); ctx.scale(flip, 1);
      if (tint) ctx.filter = tint;
      ctx.drawImage(art, -w / 2, 0, w, h);
      // Drawn twice, the second time adding light, so the bolt blazes against the sky.
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.7; ctx.drawImage(art, -w / 2, 0, w, h); ctx.restore(); return true;
    }
    // The tsunami: a wall of water running from the left of the screen to the right, foam along its crest and its foot.
    const q = Math.min(1, p / 0.8), front = e.from + (e.x - e.from) * q, a = p < 0.8 ? 1 : (1 - p) / 0.2, size = Number(e.art) || 1;
    const H = 120 + size * 28, tail = 360 + size * 60, left = Math.max(e.from - 80, front - tail);
    ctx.save(); ctx.globalAlpha = 0.9 * a;
    const body = ctx.createLinearGradient(0, at - H, 0, at + 4); body.addColorStop(0, '#bdf0ff'); body.addColorStop(0.25, '#3fb4f0'); body.addColorStop(1, '#0d5aa6');
    ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(left, at + 4); ctx.lineTo(left, at - H * 0.05);
    ctx.quadraticCurveTo((left + front) / 2, at - H * 0.3, front - 46, at - H); ctx.quadraticCurveTo(front + 6, at - H * 0.95, front + 18, at - H * 0.45); ctx.lineTo(front + 22, at + 4); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip();
    for (let k = 0; k < 3; k++) {
      const strip = still(`fx/wave-strip-${k}.webp`); if (!ok(strip)) continue;
      const sw = Math.max(40, front + 20 - left), sh = Math.max(14, sw * strip.naturalHeight / strip.naturalWidth * 1.8);
      ctx.drawImage(strip, 0, 0, strip.naturalWidth * Math.min(1, sw / 420), strip.naturalHeight, left, at - H * (0.18 + k * 0.28) - sh / 2, sw, sh);
    }
    ctx.restore(); ctx.lineWidth = 3; ctx.strokeStyle = '#0a2f66'; ctx.stroke();
    ctx.globalAlpha = 0.8 * a; ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 9; k++) { const sx = front - 60 + ((k * 37 + Math.floor(p * 30) * 11) % 90) - 30, sy = at - H * 0.9 + ((k * 53) % 70) - Math.sin(p * 12 + k) * 8; ctx.beginPath(); ctx.arc(sx, sy, 3 + (k % 3), 0, Math.PI * 2); ctx.fill(); }
    ctx.restore(); return true;
  }
  if (e.kind === 'breath') {
    // A dragon's breath: a stream of fire puffs from its mouth down onto the field ahead, swelling as they go, fading.
    const [core, edge] = e.colors ?? ['#fff3c4', '#ff7a1a'];
    const dir = e.x >= e.from ? 1 : -1, reach = Math.abs(e.x - e.from), body = e.size ?? 120, grow = Math.min(1, p / 0.3), fade = p < 0.55 ? 1 : (1 - p) / 0.45;
    const mx = e.from + dir * body * 0.42, my = ground - (e.fromUp ?? 0) - body * 0.55, tx = e.from + dir * reach * grow, ty = ground - 18;
    ctx.save();
    for (let k = 0; k < 22; k++) {
      const f = (k + 1) / 22, wob = Math.sin(k * 2.1 + p * 14) * 8 * f;
      const x = mx + (tx - mx) * f, y = my + (ty - my) * f * f + wob, r = 8 + 46 * f;
      ctx.globalAlpha = 0.32 * fade * (1 - f * 0.4); ctx.fillStyle = edge; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.45 * fade * (1 - f * 0.6); ctx.fillStyle = core; ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore(); return true;
  }
  if (e.kind === 'beam') {
    // The star eater's cosmic beam along the ground: from where its attack pose's beam strikes the ground ahead of it,
    // on as far as it reaches, a white core in a blue glow, flaring then fading, sparks running along it.
    const body = e.size ?? 120, dir = e.x >= e.from ? 1 : -1, fade = p < 0.5 ? 1 : (1 - p) / 0.5, w = 24 * (p < 0.15 ? p / 0.15 : 1);
    const x0 = e.from + dir * body * 1.49, ly = ground - 20;
    const path = () => { ctx.beginPath(); ctx.moveTo(x0, ly); ctx.lineTo(e.x, ly); };
    ctx.save(); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.45 * fade; ctx.strokeStyle = '#2f7dff'; ctx.lineWidth = w * 2.2; path(); ctx.stroke();
    ctx.globalAlpha = 0.8 * fade; ctx.strokeStyle = '#7fd8ff'; ctx.lineWidth = w; path(); ctx.stroke();
    ctx.globalAlpha = fade; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = w * 0.35; path(); ctx.stroke();
    ctx.fillStyle = '#fff6c4';
    for (let k = 0; k < 10; k++) { const f = (k / 10 + p * 2.5) % 1, x = x0 + (e.x - x0) * f; ctx.globalAlpha = fade * (1 - f * 0.5); ctx.beginPath(); ctx.arc(x, ly + Math.sin(k * 5 + p * 20) * 8, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore(); return true;
  }
  if (e.kind === 'heal') {
    // The medic's mending: green crosses rising off each troop it heals; round the medic, a soft green ring.
    ctx.save(); ctx.globalAlpha = p < 0.7 ? 1 : (1 - p) / 0.3;
    if (e.size) { ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(e.x, ground - 4, 40 + 100 * p, 10 + 18 * p, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); return true; }
    // Each troop it heals: the owner's green crosses and sparkles rising off it.
    const art = fxFrame('heal', p); if (ok(art)) { const w = 46, h = w * art.naturalHeight / art.naturalWidth; ctx.drawImage(art, e.x - w / 2, ground - (e.up ?? 0) - h, w, h); }
    ctx.restore(); return true;
  }
  if (e.kind === 'ripple') {
    // The Bell Ringer's toll and the Crowned Wraith's scream: their rings (cut from the attack pose) leave the mouth
    // and run out over the reach, growing and fading, a second pass adding light.
    if (p < 0) return true;
    const art = still(`siege/fx/${e.art}`); if (!ok(art)) return false;
    const dir = e.x >= e.from ? 1 : -1, ease = 1 - (1 - p) * (1 - p), reach = Math.abs(e.x - e.from);
    const h = (e.size ?? 100) * 0.42 * (1 + ease * 0.7), w = h * art.naturalWidth / art.naturalHeight;
    // The rings' inner side starts at the mouth.
    const cx = e.from + dir * (reach * ease + w / 2), cy = ground - (e.fromUp ?? 0);
    ctx.save(); ctx.globalAlpha = Math.min(1, p / 0.12) * (p < 0.55 ? 1 : (1 - p) / 0.45); ctx.translate(cx, cy); ctx.scale(-dir, 1);
    ctx.drawImage(art, -w / 2, -h / 2, w, h);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.35; ctx.drawImage(art, -w / 2, -h / 2, w, h);
    ctx.restore(); return true;
  }
  if (e.kind === 'sweep') {
    // The archangel's golden crescent: a wide arc sweeping out from the angel over the ground ahead of it, growing, a
    // white-hot core and gold streaks behind, fading; it is drawn twice, the second time adding light.
    const art = still('siege/units/shot-crescent-gold'); if (!ok(art)) return false;
    const dir = e.x >= e.from ? 1 : -1, reach = Math.abs(e.x - e.from), q = Math.min(1, p / 0.8), ease = 1 - (1 - q) * (1 - q);
    const cx = e.from + dir * reach * ease, cy = ground - 36 - (e.fromUp ?? 0) * 0.4, h = 90 + 60 * ease, w = h * art.naturalWidth / art.naturalHeight;
    ctx.save(); ctx.globalAlpha = p < 0.7 ? 1 : (1 - p) / 0.3; ctx.translate(cx, cy); ctx.scale(dir, 1);
    ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 26;
    ctx.drawImage(art, -w / 2, -h / 2, w, h);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.45; ctx.drawImage(art, -w / 2, -h / 2, w, h);
    ctx.shadowBlur = 0; ctx.globalAlpha *= 0.8; ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(-w * (0.5 + 0.3 * (1 - Math.abs(k) / 3)), k * h * 0.18); ctx.lineTo(-w * (0.9 + 0.5 * ease), k * h * 0.18); ctx.stroke(); }
    ctx.restore(); return true;
  }
  if (e.kind === 'burst' && p < 0) return true;
  if (e.kind === 'gust') {
    // The corrupt wind: a purple wall of air rushing from the enemy fortress across the field, streaks in it.
    const front = e.x - (e.x + 200) * Math.min(1, p * 1.25), a = p < 0.8 ? 1 : (1 - p) / 0.2;
    ctx.save(); ctx.globalAlpha = 0.8 * a;
    const g = ctx.createLinearGradient(front, 0, front + 620, 0); g.addColorStop(0, '#d070ff00'); g.addColorStop(0.12, '#b048f0dd'); g.addColorStop(0.5, '#7a20b088'); g.addColorStop(1, '#3a0a4a00');
    ctx.fillStyle = g; ctx.fillRect(front, -2000, 620, ground + 2060);
    ctx.strokeStyle = '#f0b8ff'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.globalAlpha = 0.7 * a;
    for (let i = 0; i < 7; i++) {
      const yy = ground - 30 - i * 32 - (i % 2) * 10, x0 = front + 40 + ((i * 53) % 160), len = 90 + (i % 3) * 40;
      ctx.beginPath(); ctx.moveTo(x0, yy); ctx.quadraticCurveTo(x0 + len / 2, yy - 14, x0 + len, yy); ctx.stroke();
    }
    ctx.restore(); return true;
  }
  if (e.kind === 'loot') {
    // A fallen enemy's bounty: a gold orb flying up to the gold counter and a blue one to the energy, from where it fell.
    const m = ctx.getTransform(), d = Math.min(2, window.devicePixelRatio || 1);
    const from = { x: (m.a * e.x + m.e) / d, y: (m.d * (ground - 40) + m.f) / d }, t = p * p * (3 - 2 * p);
    ctx.save(); ctx.setTransform(d, 0, 0, d, 0, 0);
    for (const [to, inner, outer, k] of [[hud.goldAt, '#ffffff', '#f2b600', 0], [hud.manaAt, '#ffffff', '#00d4ff', 0.08]] as const) {
      if (!to) continue;
      const q = Math.max(0, Math.min(1, (t - k) / (1 - k))), lift = 120;
      const x = from.x + (to.x - from.x) * q, y = from.y + (to.y - from.y) * q - Math.sin(q * Math.PI) * lift * 0.4;
      const r = 7 * (1 - q * 0.3), g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
      g.addColorStop(0, inner); g.addColorStop(1, outer);
      ctx.globalAlpha = q > 0.92 ? (1 - q) / 0.08 : 1; ctx.shadowColor = outer; ctx.shadowBlur = 12; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.lineWidth = 1.6; ctx.strokeStyle = '#1b1b1b'; ctx.stroke();
    }
    ctx.restore(); return true;
  }
  if (e.kind === 'bolt') {
    // An elite's lightning: a jagged yellow line from shooter to target, fading.
    ctx.save(); ctx.globalAlpha = 1 - p; ctx.strokeStyle = '#fff38a'; ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 12; ctx.lineWidth = 3;
    ctx.beginPath(); const n = 6;
    for (let i = 0; i <= n; i++) { const t = i / n, x = e.from + (e.x - e.from) * t, jag = i % n ? ((i * 37 + Math.floor(p * 8)) % 7 - 3) * 4 : 0; i ? ctx.lineTo(x, y + jag) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore(); return true;
  }
  // Effects that wait for a shot to land (`life` past `max`) are not drawn yet.
  if (p < 0 && (e.kind === 'boom' || e.kind === 'fire' || e.kind === 'shot' || e.kind === 'stuck' || e.kind === 'anim' || e.kind === 'piece')) return true;
  if (e.kind === 'stuck') {
    // A landed arrow stuck in the ground at the angle it came in, its head buried, fading out at the end.
    const art = still(bolt); if (!ok(art)) return false;
    const at = flight(bowTip, { x: e.x, y: ground - 2 - (e.up ?? 0) }, reachNow), end = at(1), back = at(0.97);
    // Never flatter than about 35° down, so even a near, flat shot reads as stuck in the ground.
    const ang = Math.max(0.6, Math.atan2(end.y - back.y, end.x - back.x || 0.001)), len = 60, h = len * art.naturalHeight / art.naturalWidth;
    ctx.save(); ctx.globalAlpha = p < 0.6 ? 1 : (1 - p) / 0.4;
    ctx.beginPath(); ctx.rect(e.x - 80, -5000, 160, 5000 + ground + 2 - (e.up ?? 0)); ctx.clip();
    ctx.translate(e.x - Math.cos(ang) * len * 0.22, ground + 2 - (e.up ?? 0) - Math.sin(ang) * len * 0.22); ctx.rotate(ang);
    ctx.drawImage(art, -len / 2, -h / 2, len, h); ctx.restore(); return true;
  }
  if (e.kind === 'boom') {
    // A rocket's explosion where it lands: the owner's eight frames (`siege/fx-boom-0..7`), a flash rising into a
    // mushroom cloud that turns to smoke, standing on the ground.
    const art = still(`siege/fx-boom-${e.cyan ? 'cyan-' : e.dark ? 'dark-' : ''}${Math.min(7, Math.floor(p * 8))}`); if (!ok(art)) return false;
    const w = (e.size ?? 70) * 0.85, h = w * art.naturalHeight / art.naturalWidth, at = ground + 4 - (e.up ?? 0);
    ctx.save(); ctx.globalAlpha = p < 0.85 ? 1 : (1 - p) / 0.15; ctx.drawImage(art, e.x - w / 2, at - h, w, h); ctx.restore(); return true;
  }
  if (e.kind === 'fire') {
    // A meteor's fire on the ground: the game's fire pool (its world 2 lava) squashed into a flat oval, breathing,
    // fading at the end; `up` sets it back (higher) or in front (lower) on the ground.
    const art = still('fx/fire-pool.webp'); if (!ok(art)) return false;
    const w = (e.size ?? 60) * (1 + Math.sin(p * 40) * 0.04), h = w * 0.34, at = ground + 2 - (e.up ?? 0);
    ctx.save(); ctx.globalAlpha = p < 0.08 ? p / 0.08 : p > 0.75 ? (1 - p) / 0.25 : 1;
    ctx.drawImage(art, e.x - w / 2, at - h / 2, w, h); ctx.restore(); return true;
  }
  if (e.kind === 'shot' && e.art && SPELLS.includes(e.art)) {
    // A wizard's spell lands on the target: the lightning and the tornado stand on it (the tornado turning a little),
    // the meteor comes down from above onto it; all fade at the end.
    const art = still(`siege/units/shot-${e.art}`); if (!ok(art)) return false;
    const h = e.art === 'meteor' ? 105 : 120, w = h * art.naturalWidth / art.naturalHeight, foot = ground - (e.up ?? 0);
    const drop = e.art === 'meteor' ? Math.max(0, 1 - p * 1.6) * 170 : 0;
    ctx.save(); ctx.globalAlpha = p > 0.75 ? (1 - p) / 0.25 : 1;
    // The meteor comes down from the upper left, steeply (about 70° from the ground), its tail behind it on the left.
    ctx.translate(e.x - drop * 0.36, foot - drop);
    if (e.art === 'tornado') ctx.scale(1 + Math.sin(p * 18) * 0.05, 1);
    // Its picture is drawn falling at 45°: turned 25° more so the tail trails its steeper path (turned about its rock).
    if (e.art === 'meteor') { ctx.translate(w * 0.15, -h * 0.2); ctx.rotate(25 * Math.PI / 180); ctx.translate(-w * 0.15, h * 0.2); }
    ctx.drawImage(art, -w / 2, -h, w, h); ctx.restore(); return true;
  }
  // A flamethrower's flame is in its attack pose: nothing flies.
  if (e.kind === 'shot' && e.art === 'none') return true;
  if (e.kind === 'shot' && isBeam(e.art)) {
    // A beam (the ray gun's cyan, the mech's blue, the archangel's gold, the air magician's pink lightning): its picture
    // stretched from the muzzle to the target at once, fading.
    const art = still(`siege/units/shot-${e.art}`); if (!ok(art)) return false;
    const { x: x0, y: y0 } = muzzle(e, y), y1 = shotY(e.toUp, y), len = Math.hypot(e.x - x0, y1 - y0), h = 12;
    ctx.save(); ctx.globalAlpha = 1 - p; ctx.translate(x0, y0); ctx.rotate(Math.atan2(y1 - y0, e.x - x0));
    ctx.drawImage(art, 0, -h / 2, len, h); ctx.restore(); return true;
  }
  if (e.kind === 'shot' && isBullet(e.art)) {
    // A bullet (each gun its own: pistol, rifle, Uzis, sniper), straight and fast from the muzzle to the target.
    const art = still(`siege/units/shot-${e.art}`); if (!ok(art)) return false;
    const { x: x0, y: y0 } = muzzle(e, y), y1 = shotY(e.toUp, y), x = x0 + (e.x - x0) * p;
    const w = art.naturalWidth * 0.4, h = art.naturalHeight * 0.4;
    ctx.save(); ctx.translate(x, y0 + (y1 - y0) * p); ctx.rotate(Math.atan2(y1 - y0, e.x - x0));
    ctx.drawImage(art, -w, -h / 2, w, h); ctx.restore(); return true;
  }
  if (e.kind === 'shot' && e.art) {
    // A troop's own projectile from its sheet (a rock, a javelin, an arrow, a shuriken): from the thrower's hand
    // straight to the target, spinning or pointing along its path, drawn at the sheets' scale.
    const art = still(`siege/units/shot-${e.art}`); if (!ok(art)) return false;
    // Straight from the thrower's hand to the target, no gravity; a lobbed one (`arc`) climbs high and falls back down.
    const { x: x0, y: y0 } = muzzle(e, y), y1 = shotY(e.toUp, y), arc = e.arc ?? 0;
    const at = (t: number) => ({ x: x0 + (e.x - x0) * t, y: y0 + (y1 - y0) * t - 4 * arc * t * (1 - t) });
    // Most sheets are drawn at 0.4; the ones drawn later at a higher resolution have their own scale (`SHOT_SCALE`).
    const big = SHOT_SCALE[e.art] ?? 0.4, here = at(p), ahead = dirAt(at, p), w = art.naturalWidth * big, h = art.naturalHeight * big;
    // The heavy robot's plasma ball leaves its cannon with a cyan flash, pointing along the shot, fading.
    if (e.art === 'plasma-cyan' && p < 0.4) {
      const flash = still('siege/units/shot-plasma-cyan-flash');
      if (ok(flash)) { const fw = 62, fh = fw * flash.naturalHeight / flash.naturalWidth; ctx.save(); ctx.globalAlpha = 1 - p / 0.4; ctx.translate(x0, y0); ctx.rotate(Math.atan2(y1 - y0, e.x - x0)); ctx.drawImage(flash, -fw * 0.15, -fh / 2, fw, fh); ctx.restore(); }
    }
    // Rockets leave puffs of smoke behind them; arrows and javelins a speed streak.
    if (/rocket|salvo|missile/.test(e.art)) for (let k = 1; k <= 3; k++) {
      const q = p - k * 0.09; if (q < 0) break;
      const puff = fxFrame('trail', Math.min(0.99, k / 4 + p * 0.3)), at2 = at(q), pw = 18 + k * 4;
      if (ok(puff)) { ctx.save(); ctx.globalAlpha = 0.85 - k * 0.2; ctx.drawImage(puff, at2.x - pw / 2, at2.y - pw * 0.3, pw, pw * puff.naturalHeight / puff.naturalWidth); ctx.restore(); }
    }
    if (e.art === 'arrow' || e.art === 'javelin' || e.art === 'arrow-red') {
      const streak = still('siege/fx/streak');
      if (ok(streak)) { const sw = 46, sh = sw * streak.naturalHeight / streak.naturalWidth, back = dirAt(at, p); ctx.save(); ctx.globalAlpha = 0.7; ctx.translate(here.x, here.y); ctx.rotate(Math.atan2(back.y - here.y, back.x - here.x || 0.001)); ctx.drawImage(streak, -sw - w * 0.3, -sh / 2, sw, sh); ctx.restore(); }
    }
    // The King's orb and skulls fly upright, flames trailing (drawn heading left; turned round heading right).
    if (e.art === 'darkorb' || e.art === 'skull') { ctx.save(); ctx.translate(here.x, here.y); if (e.x > x0) ctx.scale(-1, 1); ctx.drawImage(art, -w / 2, -h / 2, w, h); ctx.restore(); return true; }
    ctx.save(); ctx.translate(here.x, here.y);
    ctx.rotate(e.spin ? p * 14 * (e.x > e.from ? 1 : -1) : Math.atan2(ahead.y - here.y, ahead.x - here.x || 0.001));
    ctx.drawImage(art, -w / 2, -h / 2, w, h); ctx.restore(); return true;
  }
  if (e.kind === 'arrow' || e.kind === 'shot') {
    const close = e.kind === 'shot' && Math.abs(e.x - e.from) < 60;
    const art = still(e.kind === 'arrow' ? bolt : close ? 'fx/impact.webp' : e.side ? 'arrows/leaf.webp' : 'arrows/water.webp');
    if (!ok(art)) return false;
    if (close) { ctx.save(); ctx.globalAlpha = 1 - p; ctx.drawImage(art, e.x - 15, y - 15, 30, 30); ctx.restore(); return true; }
    // Our arrows leave the crossbow's tip and fly under gravity onto their spot (`flight`); a troop's shot flies straight.
    const at = e.kind === 'arrow' ? flight(bowTip, { x: e.x, y: ground - 2 - (e.up ?? 0) }, reachNow)
      : (t: number) => ({ x: e.from + (e.x - e.from) * t, y });
    const here = at(p), ahead = dirAt(at, p);
    const len = e.kind === 'arrow' ? (bolt.endsWith('rocket') ? 46 : 60) : 40, h = len * art.naturalHeight / art.naturalWidth;
    ctx.save(); ctx.translate(here.x, here.y); ctx.rotate(Math.atan2(ahead.y - here.y, ahead.x - here.x || 0.001));
    ctx.drawImage(art, -len / 2, -h / 2, len, h); ctx.restore(); return true;
  }
  const big = e.max > 0.6;
  const art = still(big ? `fx/bolt-y-${1 + Math.min(5, Math.floor(p * 6))}.webp` : 'fx/boom-big.webp');
  const blast = still('fx/boom-big.webp');
  if (!ok(art) || !ok(blast)) return false;
  ctx.save(); ctx.globalAlpha = 1 - p * 0.8;
  const bw = 90 + p * 90; ctx.drawImage(blast, e.x - bw / 2, ground + 10 - bw * 0.7, bw, bw * blast.naturalHeight / blast.naturalWidth);
  if (big) { const h = ground + 10, w = h * art.naturalWidth / art.naturalHeight; ctx.drawImage(art, e.x - w / 2, 0, w, h); }
  ctx.restore(); return true;
}

/** The mana angel, Cartoon Wars 2's statue on our side of the field: a crystal with wings on a pedestal that glows
    brighter the more energy there is, and pulses when it is full. */
const ANGEL_X = 290;
function mana(ctx: CanvasRenderingContext2D, s: Siege, ground: number) {
  // The mana monument (the owner's winged crystal pillar): it glows brighter as the energy fills, and pulses when full.
  // The Villain's is the same pillar in black stone with blood-red crystals.
  const pillar = still(s.villain ? 'siege/mana-dark' : 'siege/mana'); if (!ok(pillar)) return;
  const fill = s.energy / energyMax(s), full = fill >= 0.999, beat = full ? 1 + Math.sin(s.time * 6) * 0.03 : 1;
  const h = 104 * beat, w = h * pillar.naturalWidth / pillar.naturalHeight, x = ANGEL_X - w / 2, y = ground + 4 - h;
  ctx.save();
  ctx.shadowColor = s.villain ? '#ff3b3b' : '#5fd8ff'; ctx.shadowBlur = 6 + 26 * fill;
  ctx.drawImage(pillar, x, y, w, h);
  { const m = ctx.getTransform(), d = Math.min(2, window.devicePixelRatio || 1); manaBox = { x: (m.a * x + m.e) / d, y: (m.d * y + m.f) / d, w: m.a * w / d, h: m.d * h / d }; }
  ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.28 * fill * (full ? 0.8 + Math.sin(s.time * 6) * 0.2 : 1);
  ctx.drawImage(pillar, x, y, w, h);
  ctx.restore();
}

/** Troop portraits carry wide empty margins (the boss sheets most), so on cards they are cropped to what shows (alpha
    over 40), once per picture; every `img[data-trim]` under `scope` gets the cropped copy. */
const trimmed = new Map<string, string>();
/** A picture's trimmed copy, once made (so a screen drawn again shows it at once, never the untrimmed one first). */
export const trimmedOf = (src: string) => trimmed.get(src);
export function trimImages(scope: ParentNode) {
  scope.querySelectorAll<HTMLImageElement>('img[data-trim]').forEach(img => {
    const src = img.dataset.trim!, done = trimmed.get(src);
    if (done) { img.src = done; return; }
    const pic = new Image();
    pic.onload = () => {
      const w = pic.naturalWidth, h = pic.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true }); if (!x) return;
      x.drawImage(pic, 0, 0);
      let l = w, r = -1, t = h, b = -1;
      try {
        const d = x.getImageData(0, 0, w, h).data;
        for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) if (d[(y * w + i) * 4 + 3] > 40) { if (i < l) l = i; if (i > r) r = i; if (y < t) t = y; if (y > b) b = y; }
      } catch { return; }
      if (r < l) return;
      const o = document.createElement('canvas'); o.width = r - l + 1; o.height = b - t + 1;
      o.getContext('2d')?.drawImage(c, l, t, o.width, o.height, 0, 0, o.width, o.height);
      const url = o.toDataURL('image/png'); trimmed.set(src, url);
      document.querySelectorAll<HTMLImageElement>(`img[data-trim="${src}"]`).forEach(el => { el.src = url; });
    };
    pic.src = src;
  });
}

/** Where a pose's feet are, as a share of its picture's width: the middle of what is opaque in its lowest rows (a
    long spear, a cape or a flash in the picture would otherwise put the troop off its feet). Measured once a picture. */
const feet = new WeakMap<HTMLImageElement, number>();
function feetOf(img: HTMLImageElement) {
  let f = feet.get(img);
  if (f !== undefined) return f;
  f = 0.5;
  try {
    const w = img.naturalWidth, h = img.naturalHeight, band = Math.max(3, Math.round(h * 0.07));
    const c = document.createElement('canvas'); c.width = w; c.height = band;
    const t = c.getContext('2d', { willReadFrequently: true });
    if (t) {
      t.drawImage(img, 0, h - band, w, band, 0, 0, w, band);
      const data = t.getImageData(0, 0, w, band).data;
      let sum = 0, n = 0;
      for (let y = 0; y < band; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 120) { sum += x; n++; }
      if (n) f = sum / n / w;
    }
  } catch { /* a picture that cannot be read stays centred */ }
  feet.set(img, f);
  return f;
}
/** How long the fallen stay on the field, in seconds (fading over the last third). */
const DEAD_FOR = 2;
/** A killed troop is thrown back this far (field units) in the first `DEATH_FLY` share of its fall, then lies there. */
const DEATH = { back: 46, fly: 0.3 };
/** The fallen of the battle on screen: troops seen last frame and gone now (only death takes a troop off the field). */
let seenOf: Siege | null = null;
let seen = new Map<number, Fighter>();
let dead: { u: Fighter; at: number }[] = [];
function fallen(s: Siege) {
  if (seenOf !== s) { seenOf = s; seen = new Map(); dead = []; }
  const now = new Map(s.units.map(u => [u.uid, u]));
  for (const [uid, u] of seen) if (!now.has(uid) && !UNITS[u.id].splits) dead.push({ u: { ...u, flash: 0, hit: 0, knock: 0, stun: 0, moving: false }, at: s.time });
  seen = new Map([...now].map(([uid, u]) => [uid, { ...u }]));
  dead = dead.filter(c => s.time - c.at < DEAD_FOR && s.time >= c.at);
  return dead;
}
/** One troop: its pose for what it is doing, animated in code (walking, breathing, lunges, knock-backs); `gone` (0-1)
    draws it fallen, fading at the end. */
/** Where a pose wider or taller than its body stands: its body's middle and foot, as shares of the picture (the star
    eater's beam poses, whose beam reaches far ahead of and below it). */
/** The King of Darkness's poses are anchored on his throne (in the air) or between his feet (on foot), measured on each. */
const KING_ANCHOR: Record<string, [number, number]> = { 'siege/units/boss-dark-king-air-0': [0.407, 0.998], 'siege/units/boss-dark-king-air-1': [0.473, 0.998], 'siege/units/boss-dark-king-air-2': [0.443, 0.998], 'siege/units/boss-dark-king-air-3': [0.454, 0.998], 'siege/units/boss-dark-king-air-4': [0.392, 0.998], 'siege/units/boss-dark-king-air-5': [0.425, 0.875], 'siege/units/boss-dark-king-air-6': [0.421, 0.998], 'siege/units/boss-dark-king-air-7': [0.449, 0.998], 'siege/units/boss-dark-king-air-8': [0.42, 0.998], 'siege/units/boss-dark-king-air-9': [0.494, 0.998], 'siege/units/boss-dark-king-air-10': [0.457, 0.998], 'siege/units/boss-dark-king-air-11': [0.461, 0.998], 'siege/units/boss-dark-king-ground-0': [0.594, 0.998], 'siege/units/boss-dark-king-ground-1': [0.595, 0.998], 'siege/units/boss-dark-king-ground-2': [0.543, 0.998], 'siege/units/boss-dark-king-ground-3': [0.533, 0.998], 'siege/units/boss-dark-king-ground-4': [0.505, 0.998], 'siege/units/boss-dark-king-ground-5': [0.49, 0.995], 'siege/units/boss-dark-king-ground-6': [0.51, 0.997], 'siege/units/boss-dark-king-ground-7': [0.557, 0.995], 'siege/units/boss-dark-king-ground-8': [0.511, 0.998], 'siege/units/boss-dark-king-ground-9': [0.507, 0.998], 'siege/units/boss-dark-king-ground-10': [0.517, 0.998], 'siege/units/boss-dark-king-ground-11': [0.486, 0.998] };
const POSE_ANCHOR: Record<string, [number, number]> = { ...KING_ANCHOR, 'siege/units/ally-star-eater-1-6': [0.183, 0.585], 'siege/units/ally-star-eater-1-7': [0.171, 0.796], 'siege/units/ally-dragon-1-6': [0.313, 0.712], 'siege/units/ally-dragon-1-7': [0.254, 0.848], 'siege/units/ally-reaper-1-3': [0.297, 1],
  // The Bell Ringer lying dead: its body (hands and feet, row 165 of 201) lies on the ground line like every other
  // troop's; the bone thrown in front of it hangs lower, nearer to us.
  'siege/units/foe-bellringer-1-5': [0.385, 0.821] };
function fighter(ctx: CanvasRenderingContext2D, s: Siege, u: Fighter, ground: number, reduced: boolean, color: string, gone?: number) {
  // Air troops fly above their lane, their shadow on the ground under them; the fallen lie on the ground.
  // Every troop on one line (the lanes only order who is drawn in front), so the card bar never hides one.
  const spec = specOf(u), floor = ground;
  // A flyer killed in the air falls from where it was to the ground over the first part of its fall (it no longer
  // drops there at once).
  const fell = gone !== undefined && spec.air ? Math.min(1, gone / DEATH.fly) : 1;
  const y = gone !== undefined ? floor - (u.alt ?? highOf(u)) * (1 - fell * fell) : spec.air ? floor - (u.alt ?? highOf(u)) - u.lane * 8 + (reduced ? 0 : spec.raid ? Math.sin(s.time * 0.9 + u.uid) * 2 : Math.sin(s.time * 4 + u.uid) * 5) : floor;
  const path = spec.sprite, t = s.time + u.uid * 0.37;
  // The pose. Six-pose sheets: walk A/B in turn while walking, the wind-up just before a blow, the blow, hurt, dead.
  // Three-pose sheets: stand (walking in code), attack, hurt.
  // Hurt when thrown back, stunned or wincing at a heavy blow (`WINCE`), not at every scratch; its own blow shows
  // first (a charger strikes, then stands dazed).
  const thrown = !!u.knock, hurt = !!(u.stun || u.wince);
  const ready = !u.moving && u.attack > 0 && u.attack < 0.3;
  const pose = spec.six
    ? gone !== undefined ? (gone < DEATH.fly ? 4 : 5) : thrown ? 4 : u.hit ? 3 : hurt ? 4 : ready ? 2 : u.moving && !reduced ? Math.floor(t * 5) % 2 : 0
    : gone !== undefined ? 2 : thrown ? 2 : u.hit ? 1 : hurt ? 2 : 0;
  // The dragon and the star eater have two attack poses of their own: down at the ground (6) or level at a flyer (7).
  // A guardian with several attacks (`moves`) winds up and strikes in that attack's own poses; the King of Darkness falls
  // in his throne's breaking pose between his two forms; one with no fallen pose stays hurt as it tips over.
  const moves = spec.moves, next = moves ? moves[((u.move ?? -1) + 1) % moves.length] : undefined;
  const shot = u.landing ? 5 : spec.tipOver && gone !== undefined ? 4 : moves && pose === 3 && u.move !== undefined ? moves[u.move].strike : moves && pose === 2 && next ? next.ready : spec.aimPoses && pose === 3 ? (u.aimAir ? 7 : 6) : pose;
  const stand = picture(`${path}-0`), art = picture(`${path}-${shot}`), anchor = POSE_ANCHOR[`${path}-${shot}`];
  const size = spec.size * (u.boss ? 1.6 : 1) * (u.grow ?? 1) * Math.pow(0.8, u.stage ?? 0);
  // The shadow under its feet (the troop's x is where its feet are), the feet standing on its middle.
  if (gone === undefined) { ctx.fillStyle = u.side ? '#ff648577' : '#43ebce77'; ctx.beginPath(); ctx.ellipse(u.x, floor, size * (spec.air ? 0.2 : 0.22), spec.air ? 4 : 5, 0, 0, Math.PI * 2); ctx.fill(); }
  if (ok(stand.image) && ok(art.image)) {
    // One scale for every pose (from the first), so an attack's flash or swing keeps its size.
    const k = size / stand.image.naturalHeight, sw = stand.image.naturalWidth * k;
    const dw = art.image.naturalWidth * k, dh = art.image.naturalHeight * k;
    let lift = 0, lean = 0, sx = 1, sy = 1, push = 0;
    if (gone !== undefined) {
      // The killing blow throws it back: up in an arc, hurt, over `DEATH.fly` of its fall, then it lies where it lands.
      const f = Math.min(1, gone / DEATH.fly);
      push = -DEATH.back * (1 - (1 - f) * (1 - f));
      if (!reduced && f < 1) { lift = Math.sin(f * Math.PI) * 22; lean = -Math.sin(f * Math.PI) * 0.5; }
      // Three-pose sheets have no dead pose: the hurt one tips over backwards as it falls.
      if (!spec.six || spec.tipOver) lean = -Math.min(1, gone * 6) * 1.45;
    } else if (reduced) { /* still */ }
    else if (u.leap || u.bound) {
      // A pounce: a long low leap onto its prey, leaning into it, then a short low hop back, still facing its foes.
      const p = u.leap ? 1 - u.leap / POUNCE.time : 1 - (u.bound ?? 0) / POUNCE.back;
      lift = Math.sin(p * Math.PI) * (u.leap ? POUNCE.height : POUNCE.height * 0.5); lean = u.leap ? 0.18 * Math.sin(p * Math.PI) : -0.08 * Math.sin(p * Math.PI);
    } else if (u.knock) {
      // Flying back from a heavy blow: up in an arc, turned over backwards, down again (and the model gets it up).
      const p = 1 - u.knock / KNOCK.time;
      lift = Math.sin(p * Math.PI) * 26; lean = -Math.sin(p * Math.PI) * 1.1;
    } else if (u.stun) lean = Math.sin(s.time * 60) * 0.06;
    else if (u.hit) push = Math.sin((1 - u.hit / 0.3) * Math.PI) * 10;
    else if (u.moving && !spec.air) {
      // A stride: a hop on each step (and, without walking poses, a squash as the foot lands and a lean).
      const step = Math.sin(t * Math.PI * 5);
      lift = Math.abs(step) * (spec.six ? 1.6 : 3.2);
      if (!spec.six) { sy = 1 - (1 - Math.abs(step)) * 0.05; sx = 1 + (1 - Math.abs(step)) * 0.03; lean = step * 0.05 + 0.04; }
    } else if (!spec.air) sy = 1 + Math.sin(t * 3) * 0.015;
    ctx.save(); ctx.translate(u.x + (u.side ? -push : push), y - lift); if (u.side) ctx.scale(-1, 1);
    if (gone !== undefined) ctx.globalAlpha = gone < 0.66 ? 1 : 1 - (gone - 0.66) / 0.34;
    // Unseen (the ninja): a little see-through, wrapped in drifting puffs of dark smoke, so it reads as stealth.
    else if (u.hidden) {
      ctx.globalAlpha = 0.6;
      if (!reduced) for (let k = 0; k < 7; k++) {
        const f = (s.time * 0.8 + k / 7 + u.uid * 0.13) % 1, px = Math.sin(k * 2.4 + s.time * 1.7) * size * 0.35, py = -size * (0.15 + 0.7 * f);
        ctx.save(); ctx.globalAlpha = 0.28 * Math.sin(f * Math.PI); ctx.fillStyle = '#16121c';
        ctx.beginPath(); ctx.arc(px, py, size * (0.12 + 0.12 * f), 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }
    ctx.rotate(lean); ctx.scale(sx, sy);
    // A hit flashes it bright (drawn again, added on top: a blur on every hit troop costs too much each frame).
    const flash = gone === undefined && !!u.flash;
    // Elites glow gold and wear horns; wrecks are darker the more broken they are; guardians glow red.
    if (flash) { /* below */ }
    else if (gone === undefined && u.elite) { ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 14; }
    else if (gone === undefined && u.boss) { ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 16; }
    if (u.stage) ctx.filter = `brightness(${1 - u.stage * 0.22}) saturate(${1 - u.stage * 0.3})`;
    // Everything is drawn facing its way of march (a sheet drawn facing left is turned round for that), each pose on its
    // own feet at the troop's x (flyers on their middle), so poses change without sliding.
    const fx = anchor ? anchor[0] : spec.air && gone === undefined ? 0.5 : feetOf(art.image), fy = anchor ? anchor[1] : 1;
    const paint = () => { if (spec.facesLeft) { ctx.save(); ctx.scale(-1, 1); ctx.drawImage(art.image, -fx * dw, -fy * dh, dw, dh); ctx.restore(); } else ctx.drawImage(art.image, -fx * dw, -fy * dh, dw, dh); };
    // An elite stands in a gold flame aura (the owner's, looping behind it).
    if (u.elite && gone === undefined && !reduced) { const art = fxFrame('aura', (s.time * 2) % 1); if (ok(art)) { const aw = size * 1.15, ah = aw * art.naturalHeight / art.naturalWidth; ctx.save(); ctx.shadowBlur = 0; ctx.globalAlpha *= 0.85; ctx.drawImage(art, -aw / 2, -ah + 6, aw, ah); ctx.restore(); } }
    paint();
    if (u.stage) ctx.filter = 'none';
    // Frozen: a block of ice round it; stunned: stars and little birds circling over its head.
    if (gone === undefined && u.frozen) { const art = still('siege/fx/ice-block'); if (ok(art)) { const bw = (spec.air ? dw * 0.7 : Math.max(sw, size * 0.7)) * 0.95, bh = Math.min(size * 1.05, bw * art.naturalHeight / art.naturalWidth * 1.3); ctx.save(); ctx.shadowBlur = 0; ctx.globalAlpha = 0.82; ctx.drawImage(art, -bw / 2, (spec.air ? dh * 0.15 : 4) - bh, bw, bh); ctx.restore(); } }
    else if (gone === undefined && u.stun && !u.knock) { const art = fxFrame('stun', (s.time * 2.2) % 1); if (ok(art)) { const rw = Math.max(34, size * 0.45), rh = rw * art.naturalHeight / art.naturalWidth; ctx.save(); ctx.shadowBlur = 0; ctx.drawImage(art, -rw / 2, -size * 0.98 - rh / 2, rw, rh); ctx.restore(); } }
    if (flash) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.45; paint(); ctx.restore(); }
    if (u.elite && gone === undefined) {
      ctx.shadowBlur = 0; ctx.fillStyle = '#f5e6c8'; ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 1.5;
      const hw = sw, hh = size;
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * hw * 0.12, -hh * 0.92); ctx.quadraticCurveTo(side * hw * 0.34, -hh * 1.12, side * hw * 0.3, -hh * 1.2); ctx.lineTo(side * hw * 0.22, -hh * 0.9); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
    ctx.restore();
  } else if (gone === undefined) {
    ctx.fillStyle = u.side ? '#fd9aac' : color; ctx.beginPath(); ctx.roundRect(u.x - size / 4, y - size * 0.65, size / 2, size * 0.65, 10); ctx.fill();
    ctx.fillStyle = '#102132'; ctx.fillRect(u.x - 9, y - size * 0.45, 5, 5); ctx.fillRect(u.x + 4, y - size * 0.45, 5, 5);
  }
  if (gone !== undefined) return;
  ctx.fillStyle = '#07111c'; ctx.fillRect(u.x - 21, y - size - 10, 42, 4);
  ctx.fillStyle = u.side ? '#ff718c' : '#55e5c4'; ctx.fillRect(u.x - 21, y - size - 10, 42 * Math.max(0, u.hp / u.maxHp), 4);
}
