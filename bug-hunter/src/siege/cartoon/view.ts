import { actOf, stageIn, flight, foesAt, FIELD, FLY, shotFor, FOE_AIR, FOE_LAND, GUARDIAN, KNOCK, SPELLS, UNITS, isBeam, isBullet, specAt, specOf, aimAt, enemyTier, castleTier, energyMax, looksTier, type Effect, type Fighter, type Siege } from './model';
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
    image.src = `/images/game/${path}.webp`;
  }
  return entry;
}
/** Every troop's sheet (`siege/units/...`): 0 standing, 1 attacking, 2 hurt. Walking, breathing, lunges and falls
    are animated here. */
export function sprite(_s: Siege, u: Fighter) { return specOf(u).sprite; }
/** A troop's card picture at its level. */
export const portrait = (id: number, level = 1) => `/images/game/${specAt(id, level).sprite}-0.webp`;
export function preload(world: number, deck: number[], _levels: number[] = []) {
  const foes: number[] = [...foesAt(FOE_LAND, world), ...foesAt(FOE_AIR, world), GUARDIAN[actOf(world) - 1]];
  const specs = [...deck.map(c => specAt(c % 100, Math.floor(c / 100) + 1)), ...foes.map(id => UNITS[id])];
  specs.forEach(spec => { for (let f = 0; f < (spec.six ? 6 : 3); f++) picture(`${spec.sprite}-${f}`); });
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
export const sceneOf = (stage: number) => { const pics = SCENES[actOf(stage)]; return pics ? (stageIn(stage) === 4 && pics[1]) || (stageIn(stage) === 5 && pics[2]) || pics[0] : SCENE; };
/** Each picture's top row averaged down to 16 colours, kept: stretched over any sky above the picture (a tall view) it
    is a smooth gradient, where the raw row stretched would be streaks. */
const tops = new Map<HTMLImageElement, HTMLCanvasElement>();
/** The picture's width on the field (field units), fixed whatever the field's length: the far landscape keeps its size. */
const SCENE_W = 2080;
/** The picture's ground layer, which moves with the troops: the path they walk on, from a little above their feet (the
    picture's walking line, `SCENE_FIT.ground`) down; its top `fade` (a share of the picture's height) melts into the
    landscape behind, so where the two layers meet reads as a soft blur. */
const GROUND_LAYER = { above: 0.02, fade: 0.1 };
const grounds = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
function groundOf(image: HTMLImageElement) {
  let c = grounds.get(image);
  if (!c) {
    const nw = image.naturalWidth, nh = image.naturalHeight, y0 = Math.round(nh * (SCENE_FIT.ground - GROUND_LAYER.above - GROUND_LAYER.fade)), h = nh - y0;
    c = document.createElement('canvas'); c.width = nw; c.height = h; const t = c.getContext('2d');
    if (t) {
      t.drawImage(image, 0, y0, nw, h, 0, 0, nw, h);
      const f = nh * GROUND_LAYER.fade, blur = t.createLinearGradient(0, 0, 0, f);
      blur.addColorStop(0, '#0000'); blur.addColorStop(0.35, '#0002'); blur.addColorStop(0.7, '#0009'); blur.addColorStop(1, '#000f');
      t.globalCompositeOperation = 'destination-in'; t.fillStyle = blur; t.fillRect(0, 0, nw, f);
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
const FX = ['siege/mana', ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap(n => [`siege/fx-boom-${n}`, `siege/fx-boom-dark-${n}`]), 'siege/units/shot-crescent-gold', 'fx/fire-pool.webp', 'fx/fireball.webp', 'fx/rocket.webp', 'fx/volt-burst.webp', 'fx/impact.webp', 'fx/ice-block.webp', 'siege/units/shot-arrow', 'siege/units/shot-ice', 'siege/units/shot-lightning', ...[0, 1, 2].map(n => `fx/wave-strip-${n}.webp`), ...[0, 1, 2, 3, 4, 5, 6].map(n => `fx/icicle-0-${n}.webp`), 'arrows/water.webp', 'arrows/leaf.webp', 'fx/boom-big.webp', 'fx/impact.webp', ...[1, 2, 3, 4, 5, 6].map(n => `fx/bolt-y-${n}.webp`)];
/** Pictures drawn whole (backdrop, floor, effects): no alpha crop needed. */
const stills = new Map<string, HTMLImageElement>();
function still(path: string) {
  let image = stills.get(path);
  if (!image) { image = new Image(); image.src = `/images/game/${/\.\w+$/.test(path) ? path : `${path}.webp`}`; stills.set(path, image); }
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
let lastShots = 0, kickUntil = 0;
/** Smoke, then flames, on a fortress as it loses health (the game's steam and flame pictures, drifting). */
function damage(ctx: CanvasRenderingContext2D, w: number, h: number, left: number, hp: number, max: number, t: number) {
  const k = hp / max;
  if (k > 0.6) return;
  const smoke = still('fx/steam-cloud.webp'), flame = still('fx/flame-orange.webp');
  const spots = k > 0.3 ? [[0.35, 0.45]] : [[0.3, 0.4], [0.68, 0.55], [0.5, 0.75]];
  spots.forEach(([fx, fy], i) => {
    const x = left + w * fx, y = -h * (1 - fy);
    if (ok(smoke)) {
      for (let n = 0; n < 2; n++) {
        const p = (t * 0.35 + n * 0.5 + i * 0.3) % 1, sz = 30 + p * 40;
        ctx.globalAlpha = 0.55 * (1 - p);
        ctx.drawImage(smoke, x - sz / 2 + p * 10, y - 20 - p * 60 - sz / 2, sz, sz * smoke.naturalHeight / smoke.naturalWidth);
      }
      ctx.globalAlpha = 1;
    }
    if (k <= 0.3 && ok(flame)) {
      const fh = 30 + Math.sin(t * 9 + i) * 4, fw = fh * flame.naturalWidth / flame.naturalHeight;
      ctx.drawImage(flame, x - fw / 2, y - fh + 6, fw, fh);
    }
  });
}
function base(ctx: CanvasRenderingContext2D, s: Siege, x: number, ground: number, color: string, enemy: boolean) {
  const hp = s.hp[enemy ? 1 : 0], max = s.maxHp[enemy ? 1 : 0];
  const tier = enemy ? enemyTier(s.world) : castleTier(s.fort);
  const wall = still(`siege/${enemy ? 'enemy' : 'castle'}-${tier}`);
  ctx.save(); ctx.translate(x, ground);
  let top = -169;
  if (ok(wall)) {
    // Never taller than the room above the deck under the HUD.
    const look = CASTLES[tier - 1];
    const h = Math.min(enemy ? ENEMY_H[tier - 1] : look.h, ground - Math.max(30, hudRoom)), w = h * wall.naturalWidth / wall.naturalHeight;
    // Kept whole on the field: a wide one moves in from the field's edge rather than past it.
    const foot = enemy ? 10 : look.deck, left = enemy ? Math.min(-w / 2, FIELD - 4 - x - w) : Math.max(-w / 2, 4 - x);
    // The enemy's pictures face front-right; the fortress is turned to face our side (left).
    if (enemy) { ctx.save(); ctx.translate(left + w / 2, 0); ctx.scale(-1, 1); ctx.translate(-(left + w / 2), 0); }
    ctx.drawImage(wall, left, -h + foot, w, h);
    if (enemy) ctx.restore();
    damage(ctx, w, h - foot, left, hp, max, s.time);
    top = -h + foot - 6;
    if (!enemy) {
      // The crossbow seated in the turret, turning on its wheel.
      const bowTier = looksTier(s.bow.level), arm = still(`siege/xbow-${bowTier}`), [fx, fy] = XBOW.pivot[bowTier - 1];
      bolt = `siege/units/bolt-${bowTier}`;
      const px = left + w * look.bow[0], py = -h + foot + h * look.bow[1];
      bowAt = { x: x + px, y: ground + py };
      if ((s.shots ?? 0) !== lastShots) { lastShots = s.shots ?? 0; kickUntil = s.time + 0.09; }
      if (ok(arm)) {
        const aw = XBOW.width, ah = aw * arm.naturalHeight / arm.naturalWidth;
        ctx.save(); ctx.translate(px, py); ctx.rotate(bowAngle(s, ground));
        const kick = s.time < kickUntil ? -5 : 0;
        ctx.drawImage(arm, -aw * fx + kick, -ah * fy, aw, ah);
        ctx.restore();
        const ang = bowAngle(s, ground), reach = aw * (1 - fx);
        bowTip = { x: bowAt.x + Math.cos(ang) * reach, y: bowAt.y + Math.sin(ang) * reach };
        // The model sends the arrows along the same path, to strike the flyers it crosses.
        s.bowFrom = { x: bowTip.x, up: ground - bowTip.y };
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
function bowAngle(s: Siege, ground: number) {
  // Aimed as a real crossbow would be: the angle whose shot, at the bow's one speed and under gravity, lands on the aim
  // (the flatter of the two). Near aims point down at the ground before our wall, far ones rise.
  const x = aimAt(s.aim); return shotFor(x - bowAt.x, ground - 2 - bowAt.y, x).a;
}
/** The tip of our crossbow (where shots leave it), set when it is drawn. */
let bowTip = { x: 80, y: 0 };
/** The camera: its left edge and width in field units, and how far left of the field it may go (a margin past our
    wall, so the aim control stands clear of it). */
export interface Camera { x: number; width: number; min?: number; deck?: number;
  /** CSS pixels at the foot of the view covered by the card bar laid over the field: the ground line stays above them. */
  bottom?: number;
  /** Where the HUD's gold and energy counters are on the canvas (CSS pixels): fallen enemies' orbs fly to them. */
  goldAt?: { x: number; y: number }; manaAt?: { x: number; y: number } }
/** The HUD counters' spots for this frame (`Camera.goldAt`, `manaAt`). */
let hud: Pick<Camera, 'goldAt' | 'manaAt'> = {};
export function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, s: Siege, camera: Camera, reduced: boolean) {
  hud = camera;
  const rect = canvas.getBoundingClientRect(); const w = rect.width, h = rect.height;
  if (!w || !h) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const color = THEMES[actOf(s.world) - 1];
  const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#080f21'); sky.addColorStop(1, '#172c3c');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  // Short, wide fields zoom in a little more, so the troops keep their size.
  // A wide view stands further back (more field and sky, smaller troops), 15% more since v1.15.90 so more of the field
  // and its picture show; an upright phone keeps it closer (further back it only shows more empty sky).
  const scale = w >= h ? Math.min(h / (w / h > 2.2 ? 360 : 425), w / 810) * 0.85 : Math.min(h / 340, w / 650);
  camera.width = w / scale; hudRoom = 62 / scale;
  camera.min = -AIM_GUTTER / scale;
  camera.x = Math.max(camera.min, Math.min(Math.max(camera.min, FIELD - camera.width), camera.x));
  // The stretch of field on screen: the special powers cover it (the model reads it when one is cast).
  s.view = { x: camera.x, width: camera.width };
  // The ground line sits low, so the picture's ground and the sky above both show.
  camera.deck = w / h > 2.2 ? 0.74 : 0.7;
  // A tall view (a phone upright): the ground line comes down until the picture's foot reaches the bottom of the view.
  const below = (FIELD + SCENE_FIT.pad * 2) * (1 - SCENE_FIT.ground) * 724 / 2172;
  camera.deck = Math.max(camera.deck, 1 - (below * 0.95 * scale) / h);
  if (camera.bottom) camera.deck = Math.min(camera.deck, 1 - (camera.bottom + 4) / h);
  const ground = h / scale * camera.deck;
  ctx.scale(scale, scale); ctx.translate(-camera.x + Math.max(0, (camera.width - FIELD) / 2), 0);
  const viewH = h / scale;
  const scene = still(sceneOf(s.world));
  if (ok(scene)) {
    // Two layers. The far landscape keeps its size (`SCENE_W`) and slides slower than the field (parallax): from its
    // left edge with the camera at our end to its right edge at the enemy's. The ground layer (`groundOf`) moves with
    // the troops, stretched along the whole field (a little wider than the picture), so it changes along the way as the
    // landscape behind it does. Its sky colours carry on above the picture.
    const sw = SCENE_W, sh = sw * scene.naturalHeight / scene.naturalWidth, top = ground - sh * SCENE_FIT.ground;
    const lo = camera.min ?? 0, hi = Math.max(lo, FIELD - camera.width), k = hi > lo ? (camera.x - lo) / (hi - lo) : 0;
    const x0 = camera.x - Math.max(0, sw - camera.width) * k - Math.max(0, camera.width - sw) / 2;
    // When the view runs below the picture, its foreground (the part under the walking ground) is stretched down to
    // the view's foot, so the picture itself fills it (never one stretched row, which reads as a blur).
    const nw = scene.naturalWidth, nh = scene.naturalHeight, gRow = nh * SCENE_FIT.ground, foot = Math.max(top + sh, viewH + 1);
    ctx.drawImage(scene, 0, 0, nw, gRow, x0, top, sw, ground - top);
    ctx.drawImage(scene, 0, gRow, nw, nh - gRow, x0, ground, sw, foot - ground);
    const band = groundOf(scene), y0 = nh - band.height, layer = top + sh * (y0 / nh);
    const gx = -SCENE_FIT.pad, gw = FIELD + SCENE_FIT.pad * 2;
    ctx.drawImage(band, 0, 0, nw, gRow - y0, gx, layer, gw, ground - layer);
    ctx.drawImage(band, 0, gRow - y0, nw, nh - gRow, gx, ground, gw, foot - ground);
    if (top > 0) {
      const strip = topOf(scene), fade = 60;
      ctx.drawImage(strip, 0, 0, 16, 1, x0, -1, sw, top + 2);
      for (let i = 0; i < 12; i++) { ctx.globalAlpha = 1 - (i + 0.5) / 12; ctx.drawImage(strip, 0, 0, 16, 1, x0, top + (i * fade) / 12, sw, fade / 12 + 0.5); }
      ctx.globalAlpha = 1;
    }
  } else {
    const [deck, low] = GROUND[actOf(s.world) - 1];
    const earth = ctx.createLinearGradient(0, ground - 10, 0, viewH); earth.addColorStop(0, deck); earth.addColorStop(1, low);
    ctx.fillStyle = earth; ctx.fillRect(-SCENE_FIT.pad, ground - 10, FIELD + SCENE_FIT.pad * 2, viewH);
  }
  // The Darkness spreading act by act (`gloom`): over the land and sky, deeper on the enemy's side; not over the
  // fortresses or troops. Only over the first picture: the worlds' own show their corruption.
  const g = sceneOf(s.world) === SCENE ? gloom(actOf(s.world)) : 0;
  if (g > 0) {
    const shade = ctx.createLinearGradient(0, 0, FIELD, 0);
    shade.addColorStop(0, `rgba(14,4,22,${(g * 0.6).toFixed(2)})`); shade.addColorStop(1, `rgba(30,2,14,${g.toFixed(2)})`);
    ctx.fillStyle = shade; ctx.fillRect(-SCENE_FIT.pad - camera.width, -viewH * 3, FIELD + (SCENE_FIT.pad + camera.width) * 2, viewH * 6);
  }
  base(ctx, s, 80, ground, '#55e5c4', false);
  base(ctx, s, FIELD - 80, ground, '#ff718c', true);
  mana(ctx, s, ground);
  const aimY = ground + 10;
  ctx.strokeStyle = '#ffe3a0'; ctx.globalAlpha = 0.65; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.ellipse(s.aim, aimY, 45, 13, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  // The fallen lie where they fell for a moment (the six-pose sheets' last pose; the others tip over), then fade.
  for (const c of fallen(s)) fighter(ctx, s, c.u, ground, reduced, color, Math.min(1, (s.time - c.at) / DEAD_FOR));
  for (const u of [...s.units].sort((a, b) => a.lane - b.lane || a.x - b.x)) fighter(ctx, s, u, ground, reduced, color);
  for (const e of s.effects) {
    const p = 1 - e.life / e.max; const y = ground - 26;
    if (effect(ctx, e, p, y, ground)) continue;
    ctx.globalAlpha = e.life / e.max; ctx.strokeStyle = e.side ? '#ff98b0' : '#fff0ae'; ctx.lineWidth = 3;
    ctx.beginPath();
    if (e.kind === 'shot') { ctx.moveTo(e.from + (e.x - e.from) * p, y - Math.sin(p * Math.PI) * 30); ctx.lineTo(e.from + (e.x - e.from) * Math.min(1, p + 0.15), y); }
    else ctx.ellipse(e.x, ground + 10, 30 + p * 100, 12 + p * 26, 0, 0, Math.PI * 2);
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/** A point a little further along a flight's path, for its heading; at the very end (where a step forward is the same
    spot, and the arrow would lie flat) the heading continues from a step back. */
function dirAt(at: (t: number) => { x: number; y: number }, p: number) {
  const a = at(Math.max(0, p - 0.02)), b = at(Math.min(1, p + 0.02)), here = at(p);
  return { x: here.x + (b.x - a.x), y: here.y + (b.y - a.y) };
}
/** The height a troop's shot leaves from or flies to: a hand's height on the ground, a flyer's middle in the air. */
const shotY = (up: number | undefined, y: number) => y - 15 - Math.max(0, (up ?? 0) - 10);
/** Every picture a troop's attack shows on its way (`siege/units/shot-<name>`): thrown things, rockets, bullets, beams. */
const SHOTS = ['rock', 'javelin', 'arrow', 'shuriken', 'rocket', 'rockets', 'salvo', 'ice', 'plasma', 'crescent', 'missile', 'bullet', 'bullet-rifle', 'bullet-uzi', 'bullet-sniper', 'ray', 'ray-blue', 'ray-gold', 'ray-pink'];
/** The effect art: our crossbow's Cartoon arrows (or rockets) and missile, the old painted arrows (water for our troops,
    leaf for theirs),
    impacts up close, and a blast with the yellow lightning for the discharge. */
function effect(ctx: CanvasRenderingContext2D, e: Effect, p: number, y: number, ground: number) {
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
      const art = still('siege/units/shot-lightning'); if (!ok(art)) return false;
      const h = at + 6, w = 130, flip = Math.floor(p * 10) % 2 ? -1 : 1;
      ctx.save(); ctx.globalAlpha = p < 0.5 ? 1 : (1 - p) / 0.5; ctx.translate(e.x, 0); ctx.scale(flip, 1); ctx.drawImage(art, -w / 2, 0, w, h);
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
  if (p < 0 && (e.kind === 'boom' || e.kind === 'fire' || e.kind === 'shot' || e.kind === 'stuck')) return true;
  if (e.kind === 'stuck') {
    // A landed arrow stuck in the ground at the angle it came in, its head buried, fading out at the end.
    const art = still(bolt); if (!ok(art)) return false;
    const at = flight(bowTip, { x: e.x, y: ground - 2 - (e.up ?? 0) }), end = at(1), back = at(0.97);
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
    const art = still(`siege/fx-boom-${e.dark ? 'dark-' : ''}${Math.min(7, Math.floor(p * 8))}`); if (!ok(art)) return false;
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
    const y0 = shotY(e.fromUp, y), y1 = shotY(e.toUp, y), len = Math.hypot(e.x - e.from, y1 - y0), h = 12;
    ctx.save(); ctx.globalAlpha = 1 - p; ctx.translate(e.from, y0); ctx.rotate(Math.atan2(y1 - y0, e.x - e.from));
    ctx.drawImage(art, 0, -h / 2, len, h); ctx.restore(); return true;
  }
  if (e.kind === 'shot' && isBullet(e.art)) {
    // A bullet (each gun its own: pistol, rifle, Uzis, sniper), straight and fast from the muzzle to the target.
    const art = still(`siege/units/shot-${e.art}`); if (!ok(art)) return false;
    const y0 = shotY(e.fromUp, y), y1 = shotY(e.toUp, y), x = e.from + (e.x - e.from) * p;
    const w = art.naturalWidth * 0.4, h = art.naturalHeight * 0.4;
    ctx.save(); ctx.translate(x, y0 + (y1 - y0) * p); ctx.rotate(Math.atan2(y1 - y0, e.x - e.from));
    ctx.drawImage(art, -w, -h / 2, w, h); ctx.restore(); return true;
  }
  if (e.kind === 'shot' && e.art) {
    // A troop's own projectile from its sheet (a rock, a javelin, an arrow, a shuriken): from the thrower's hand
    // straight to the target, spinning or pointing along its path, drawn at the sheets' scale.
    const art = still(`siege/units/shot-${e.art}`); if (!ok(art)) return false;
    // Straight from the thrower's hand to the target, no gravity.
    const y0 = shotY(e.fromUp, y), y1 = shotY(e.toUp, y);
    const at = (t: number) => ({ x: e.from + (e.x - e.from) * t, y: y0 + (y1 - y0) * t });
    const here = at(p), ahead = dirAt(at, p), w = art.naturalWidth * 0.4, h = art.naturalHeight * 0.4;
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
    const at = e.kind === 'arrow' ? flight(bowTip, { x: e.x, y: ground - 2 - (e.up ?? 0) })
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
  const pillar = still('siege/mana'); if (!ok(pillar)) return;
  const fill = s.energy / energyMax(s), full = fill >= 0.999, beat = full ? 1 + Math.sin(s.time * 6) * 0.03 : 1;
  const h = 104 * beat, w = h * pillar.naturalWidth / pillar.naturalHeight, x = ANGEL_X - w / 2, y = ground + 4 - h;
  ctx.save();
  ctx.shadowColor = '#5fd8ff'; ctx.shadowBlur = 6 + 26 * fill;
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
function fighter(ctx: CanvasRenderingContext2D, s: Siege, u: Fighter, ground: number, reduced: boolean, color: string, gone?: number) {
  // Air troops fly above their lane, their shadow on the ground under them; the fallen lie on the ground.
  // Every troop on one line (the lanes only order who is drawn in front), so the card bar never hides one.
  const spec = specOf(u), floor = ground;
  const y = gone !== undefined ? floor : spec.air ? floor - (u.alt ?? FLY.high) - u.lane * 8 + (reduced ? 0 : Math.sin(s.time * 4 + u.uid) * 5) : floor;
  const path = spec.sprite, t = s.time + u.uid * 0.37;
  // The pose. Six-pose sheets: walk A/B in turn while walking, the wind-up just before a blow, the blow, hurt, dead.
  // Three-pose sheets: stand (walking in code), attack, hurt.
  const hurt = !!(u.flash || u.knock || u.stun);
  const ready = !u.moving && u.attack > 0 && u.attack < 0.3;
  const pose = spec.six
    ? gone !== undefined ? (gone < DEATH.fly ? 4 : 5) : hurt ? 4 : u.hit ? 3 : ready ? 2 : u.moving && !reduced ? Math.floor(t * 5) % 2 : 0
    : gone !== undefined ? 2 : hurt ? 2 : u.hit ? 1 : 0;
  const stand = picture(`${path}-0`), art = picture(`${path}-${pose}`);
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
      if (!spec.six) lean = -Math.min(1, gone * 6) * 1.45;
    } else if (reduced) { /* still */ }
    else if (u.knock) {
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
    ctx.rotate(lean); ctx.scale(sx, sy);
    if (gone === undefined && u.flash) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 10; }
    // Elites glow gold and wear horns; wrecks are darker the more broken they are; guardians glow red.
    else if (gone === undefined && u.elite) { ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 14; }
    else if (gone === undefined && u.boss) { ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 16; }
    if (u.stage) ctx.filter = `brightness(${1 - u.stage * 0.22}) saturate(${1 - u.stage * 0.3})`;
    // Everything is drawn facing its way of march (a sheet drawn facing left is turned round for that), each pose on its
    // own feet at the troop's x (flyers on their middle), so poses change without sliding.
    const fx = spec.air && gone === undefined ? 0.5 : feetOf(art.image);
    if (spec.facesLeft) { ctx.save(); ctx.scale(-1, 1); ctx.drawImage(art.image, -fx * dw, -dh, dw, dh); ctx.restore(); }
    else ctx.drawImage(art.image, -fx * dw, -dh, dw, dh);
    ctx.filter = 'none';
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
