import { actOf, foesAt, FIELD, FOE_AIR, FOE_LAND, GUARDIAN, KNOCK, SPELLS, UNITS, specAt, specOf, aimAt, enemyTier, energyMax, looksTier, type Effect, type Fighter, type Siege } from './model';
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
export function preload(world: number, deck: number[], levels: number[] = []) {
  const foes: number[] = [...foesAt(FOE_LAND, world), ...foesAt(FOE_AIR, world), GUARDIAN[actOf(world) - 1]];
  const specs = [...deck.map(id => specAt(id, levels[id])), ...foes.map(id => UNITS[id])];
  specs.forEach(spec => { for (let f = 0; f < (spec.six ? 6 : 3); f++) picture(`${spec.sprite}-${f}`); });
  // The battlefield, and the fortresses and crossbow at every level (the workshop can change ours between battles).
  [SCENE, ...['rock', 'javelin', 'arrow', 'shuriken', 'rocket', 'rockets', ...SPELLS].map(n => `siege/units/shot-${n}`), ...[1, 2, 3].flatMap(n => [`siege/castle-${n}`, `siege/enemy-${n}`, `siege/xbow-base-${n}`, `siege/xbow-arm-${n}`]), ...FX].forEach(still);
}
/** The battlefield, one picture for every world for now (the owner's: our green side left, the bugs' red one right):
    drawn across the field with `pad` field units past each end, its walking ground (`ground`, a share of its height)
    on the troops' ground line; it moves with the troops. */
const SCENE = 'siege/backdrop';
const SCENE_FIT = { pad: 120, ground: 0.8 };
/** The picture's top row averaged down to 16 colours, kept: stretched over any sky above the picture (a tall view) it
    is a smooth gradient, where the raw row stretched would be streaks. */
let skyStrip: HTMLCanvasElement | null = null;
function skyOf(scene: HTMLImageElement) {
  if (skyStrip) return skyStrip;
  const c = document.createElement('canvas'); c.width = 16; c.height = 1;
  const t = c.getContext('2d'); if (t) { t.imageSmoothingQuality = 'high'; t.drawImage(scene, 0, 0, scene.naturalWidth, 8, 0, 0, 16, 1); }
  return (skyStrip = c);
}
/** From this aim on (field units) the arrows start to fall from the sky; at the furthest aim they only rain down. */
const RAIN_FROM = 760;
const FX = ['fx/rocket.webp', 'fx/wings-1.webp', 'fx/gem-big.webp', 'arrows/water.webp', 'arrows/leaf.webp', 'arrows/fire.webp', 'fx/boom-big.webp', 'fx/impact.webp', ...[1, 2, 3, 4, 5, 6].map(n => `fx/bolt-y-${n}.webp`)];
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
/** The fortresses, side on (`siege/castle-N` ours, facing right; `siege/enemy-N` theirs, facing left): three pictures
    each, ours by its workshop level, theirs by world (`looksTier`, `enemyTier`). `h` is the height drawn in field
    units; `deck` how far its foot sinks under the ground line. Our crossbow stands on the battlement at the top right:
    `bow` is that spot as fractions of the picture (x from the left, y from the top). */
const CASTLES = [
  { h: 132, deck: 10, bow: [0.8, 0.255] },
  { h: 150, deck: 10, bow: [0.8, 0.31] },
  { h: 168, deck: 10, bow: [0.84, 0.375] },
] as const;
const ENEMY_H = [138, 156, 172];
/** Our crossbow on the battlement: its base, and its arm pointing right with the pivot at its left end, drawn this many
    field units wide; the arm turns towards where the arrows go and kicks back a little at each shot. */
const XBOW = { base: 46, arm: 58, pivot: [0.13, 0.5], seat: 0.2 } as const;
/** Where our crossbow's arm turns, worked out by `base()` each frame: arrows and the missile leave from it. */
let bowAt = { x: 80, y: 0 };
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
  const tier = enemy ? enemyTier(s.world) : looksTier(s.fort);
  const wall = still(`siege/${enemy ? 'enemy' : 'castle'}-${tier}`);
  ctx.save(); ctx.translate(x, ground);
  let top = -169;
  if (ok(wall)) {
    // Never taller than the room above the deck, so its health bar stays in view.
    const look = CASTLES[tier - 1];
    const h = Math.min(enemy ? ENEMY_H[tier - 1] : look.h, ground - 30), w = h * wall.naturalWidth / wall.naturalHeight;
    const foot = look.deck, left = -w / 2;
    ctx.drawImage(wall, left, -h + foot, w, h);
    damage(ctx, w, h - foot, left, hp, max, s.time);
    top = -h + foot - 6;
    if (!enemy) {
      // The crossbow: its base seated on the battlement, its arm turning on the base's pivot.
      const bw = XBOW.base, bowTier = looksTier(s.bow.level);
      const seatX = left + w * look.bow[0], seatY = -h + foot + h * look.bow[1];
      const baseImg = still(`siege/xbow-base-${bowTier}`), arm = still(`siege/xbow-arm-${bowTier}`);
      const bh = ok(baseImg) ? bw * baseImg.naturalHeight / baseImg.naturalWidth : 0;
      const px = seatX, py = seatY - bh * (1 - XBOW.seat);
      bowAt = { x: x + px, y: ground + py };
      if ((s.shots ?? 0) !== lastShots) { lastShots = s.shots ?? 0; kickUntil = s.time + 0.09; }
      const angle = bowAngle(s, ground);
      const drawArm = () => {
        if (!ok(arm)) return;
        const aw = XBOW.arm, ah = aw * arm.naturalHeight / arm.naturalWidth;
        ctx.save(); ctx.translate(px, py); ctx.rotate(angle);
        const kick = s.time < kickUntil ? -5 : 0;
        ctx.drawImage(arm, -aw * XBOW.pivot[0] + kick, -ah * XBOW.pivot[1], aw, ah);
        ctx.restore();
      };
      // Pointing down (a near aim) the arm comes in front of its base, or the base would hide it.
      if (angle <= 0.35) drawArm();
      if (ok(baseImg)) ctx.drawImage(baseImg, seatX - bw / 2, seatY - bh, bw, bh);
      if (angle > 0.35) drawArm();
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
/** How high our shots arc for an aim (0-1 of their full lift): none at the nearest aim, so the crossbow points straight
    down at it, growing to the full arc halfway to where the arrows start raining. */
const arcShare = (x: number) => Math.max(0, Math.min(1, (x - 140) / ((RAIN_FROM - 140) * 0.6)));
/** The crossbow arm's angle: the way an arrow leaves it for the current aim (the start of its arc): down at a near aim,
    rising as the aim goes further, nearly straight up where the arrows rain from the sky. */
function bowAngle(s: Siege, ground: number) {
  const x = aimAt(s.aim), dx = Math.max(20, x - bowAt.x), endY = ground - 14;
  const lift = Math.min(150, Math.max(20, bowAt.y - 24)) * arcShare(x);
  const arc = Math.atan2(endY - bowAt.y - Math.PI * lift, dx);
  const rain = Math.max(0, Math.min(1, (x - RAIN_FROM) / (1080 - RAIN_FROM)));
  return Math.max(-1.35, arc + (-1.25 - arc) * rain);
}
/** The camera: its left edge and width in field units, and how far left of the field it may go (a margin past our
    wall, so the aim control stands clear of it). */
export interface Camera { x: number; width: number; min?: number; deck?: number }
export function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, s: Siege, camera: Camera, reduced: boolean) {
  const rect = canvas.getBoundingClientRect(); const w = rect.width, h = rect.height;
  if (!w || !h) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const color = THEMES[actOf(s.world) - 1];
  const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#080f21'); sky.addColorStop(1, '#172c3c');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  // Short, wide fields zoom in a little more, so the troops keep their size.
  const scale = Math.min(h / (w / h > 2.2 ? 290 : 340), w / 650);
  camera.width = w / scale;
  camera.min = -AIM_GUTTER / scale;
  camera.x = Math.max(camera.min, Math.min(Math.max(camera.min, FIELD - camera.width), camera.x));
  // The ground line sits low, so the picture's ground and the sky above both show.
  camera.deck = w / h > 2.2 ? 0.74 : 0.7;
  // A tall view (a phone upright): the ground line comes down until the picture's foot reaches the bottom of the view.
  const below = (FIELD + SCENE_FIT.pad * 2) * (1 - SCENE_FIT.ground) * 724 / 2172;
  camera.deck = Math.max(camera.deck, 1 - (below * 0.95 * scale) / h);
  const ground = h / scale * camera.deck;
  ctx.scale(scale, scale); ctx.translate(-camera.x + Math.max(0, (camera.width - FIELD) / 2), 0);
  const viewH = h / scale;
  const scene = still(SCENE);
  if (ok(scene)) {
    const sw = FIELD + SCENE_FIT.pad * 2, sh = sw * scene.naturalHeight / scene.naturalWidth;
    const x0 = -SCENE_FIT.pad, top = ground - sh * SCENE_FIT.ground;
    ctx.drawImage(scene, x0, top, sw, sh);
    // Taller views than the picture: its sky colours carried on up, and its last ground row down (a sliver at most).
    if (top > 0) {
      const strip = skyOf(scene), fade = 60;
      ctx.drawImage(strip, 0, 0, 16, 1, x0, -1, sw, top + 2);
      // Faded into the picture's top edge in thin bands, so no seam shows.
      for (let i = 0; i < 12; i++) { ctx.globalAlpha = 1 - (i + 0.5) / 12; ctx.drawImage(strip, 0, 0, 16, 1, x0, top + (i * fade) / 12, sw, fade / 12 + 0.5); }
      ctx.globalAlpha = 1;
    }
    if (top + sh < viewH) ctx.drawImage(scene, 0, scene.naturalHeight - 1, scene.naturalWidth, 1, x0, top + sh - 1, sw, viewH - top - sh + 2);
  } else {
    const [deck, low] = GROUND[actOf(s.world) - 1];
    const earth = ctx.createLinearGradient(0, ground - 10, 0, viewH); earth.addColorStop(0, deck); earth.addColorStop(1, low);
    ctx.fillStyle = earth; ctx.fillRect(-SCENE_FIT.pad, ground - 10, FIELD + SCENE_FIT.pad * 2, viewH);
  }
  // The Darkness spreading act by act (`gloom`): over the land and sky, deeper on the enemy's side; not over the
  // fortresses or troops.
  const g = gloom(actOf(s.world));
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
    const p = 1 - e.life / e.max; const y = ground + e.lane * 12 - 26;
    if (effect(ctx, e, p, y, ground)) continue;
    ctx.globalAlpha = e.life / e.max; ctx.strokeStyle = e.side ? '#ff98b0' : '#fff0ae'; ctx.lineWidth = 3;
    ctx.beginPath();
    if (e.kind === 'shot') { ctx.moveTo(e.from + (e.x - e.from) * p, y - Math.sin(p * Math.PI) * 30); ctx.lineTo(e.from + (e.x - e.from) * Math.min(1, p + 0.15), y); }
    else ctx.ellipse(e.x, ground + 10, 30 + p * 100, 12 + p * 26, 0, 0, Math.PI * 2);
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/** The game's own effect art: the bow's painted arrows (wood from our fortress, water for our troops, leaf for theirs),
    impacts up close, and a blast with the yellow lightning for the discharge. */
function effect(ctx: CanvasRenderingContext2D, e: Effect, p: number, y: number, ground: number) {
  if (e.kind === 'rocket') {
    const art = still('fx/rocket.webp'); if (!ok(art)) return false;
    // From the crossbow on our battlement (`bowAt`) to the aim.
    const from = e.side ? e.from : bowAt.x, y0 = e.side ? ground - 110 : bowAt.y;
    const peak = Math.min(190, Math.max(20, y0 - 24)) * (e.side ? 1 : arcShare(e.x)), at = (t: number) => ({ x: from + (e.x - from) * t, y: y0 + (ground + 10 - y0) * t - Math.sin(t * Math.PI) * peak });
    const here = at(p), ahead = at(Math.min(1, p + 0.02)), len = 64, h = len * art.naturalHeight / art.naturalWidth;
    ctx.save(); ctx.translate(here.x, here.y); ctx.rotate(Math.atan2(ahead.y - here.y, ahead.x - here.x || 0.001));
    ctx.drawImage(art, -len / 2, -h / 2, len, h); ctx.restore(); return true;
  }
  if (e.kind === 'burst' && p < 0) return true;
  if (e.kind === 'bolt') {
    // An elite's lightning: a jagged yellow line from shooter to target, fading.
    ctx.save(); ctx.globalAlpha = 1 - p; ctx.strokeStyle = '#fff38a'; ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 12; ctx.lineWidth = 3;
    ctx.beginPath(); const n = 6;
    for (let i = 0; i <= n; i++) { const t = i / n, x = e.from + (e.x - e.from) * t, jag = i % n ? ((i * 37 + Math.floor(p * 8)) % 7 - 3) * 4 : 0; i ? ctx.lineTo(x, y + jag) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore(); return true;
  }
  if (e.kind === 'shot' && e.art && SPELLS.includes(e.art)) {
    // A wizard's spell lands on the target: the lightning and the tornado stand on it (the tornado turning a little),
    // the meteor comes down from above onto it; all fade at the end.
    const art = still(`siege/units/shot-${e.art}`); if (!ok(art)) return false;
    const h = e.art === 'meteor' ? 150 : 120, w = h * art.naturalWidth / art.naturalHeight, foot = ground + e.lane * 12;
    const drop = e.art === 'meteor' ? Math.max(0, 1 - p * 1.6) * 140 : 0;
    ctx.save(); ctx.globalAlpha = p > 0.75 ? (1 - p) / 0.25 : 1;
    ctx.translate(e.x + drop * 0.5, foot - drop);
    if (e.art === 'tornado') ctx.scale(1 + Math.sin(p * 18) * 0.05, 1);
    ctx.drawImage(art, -w / 2, -h, w, h); ctx.restore(); return true;
  }
  // A flamethrower's flame is in its attack pose: nothing flies.
  if (e.kind === 'shot' && e.art === 'none') return true;
  if (e.kind === 'shot' && e.art === 'ray') {
    // The ray gun: a cyan beam from the muzzle to the target at once, fading.
    const hand = y - 16;
    ctx.save(); ctx.globalAlpha = 1 - p; ctx.lineCap = 'round';
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(e.from, hand); ctx.lineTo(e.x, hand); ctx.stroke();
    ctx.strokeStyle = '#e0f7ff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(e.from, hand); ctx.lineTo(e.x, hand); ctx.stroke();
    ctx.restore(); return true;
  }
  if (e.kind === 'shot' && e.art === 'bullet') {
    // A gunner's bullet: a short bright tracer, straight and fast, from the muzzle to the target.
    const hand = y - 16, x = e.from + (e.x - e.from) * p, dir = Math.sign(e.x - e.from) || 1;
    ctx.save(); ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.globalAlpha = 0.95;
    ctx.beginPath(); ctx.moveTo(x - dir * 16, hand); ctx.lineTo(x, hand); ctx.stroke();
    ctx.fillStyle = '#fff6cf'; ctx.beginPath(); ctx.arc(x, hand, 1.8, 0, Math.PI * 2); ctx.fill(); ctx.restore(); return true;
  }
  if (e.kind === 'shot' && e.art) {
    // A troop's own projectile from its sheet (a rock, a javelin, an arrow, a shuriken): a low arc from the thrower's
    // hand to the target, spinning or pointing along its path, drawn at the sheets' scale.
    const art = still(`siege/units/shot-${e.art}`); if (!ok(art)) return false;
    const hand = y - 14, lift = Math.min(60, Math.abs(e.x - e.from) * 0.18);
    const at = (t: number) => ({ x: e.from + (e.x - e.from) * t, y: hand + 8 * t - Math.sin(t * Math.PI) * lift });
    const here = at(p), ahead = at(Math.min(1, p + 0.03)), w = art.naturalWidth * 0.4, h = art.naturalHeight * 0.4;
    ctx.save(); ctx.translate(here.x, here.y);
    ctx.rotate(e.spin ? p * 14 * (e.x > e.from ? 1 : -1) : Math.atan2(ahead.y - here.y, ahead.x - here.x || 0.001));
    ctx.drawImage(art, -w / 2, -h / 2, w, h); ctx.restore(); return true;
  }
  if (e.kind === 'arrow' || e.kind === 'shot') {
    const close = e.kind === 'shot' && Math.abs(e.x - e.from) < 60;
    const art = still(e.kind === 'arrow' ? 'arrows/fire.webp' : close ? 'fx/impact.webp' : e.side ? 'arrows/leaf.webp' : 'arrows/water.webp');
    if (!ok(art)) return false;
    if (close) { ctx.save(); ctx.globalAlpha = 1 - p; ctx.drawImage(art, e.x - 15, y - 15, 30, 30); ctx.restore(); return true; }
    // A high arc for the fortress's arrows (from its wall top), a flat one for the troops'.
    // Our arrows leave the crossbow on the battlement (`bowAt`).
    const fromX = e.kind === 'arrow' ? bowAt.x : e.from;
    const startY = e.kind === 'arrow' ? bowAt.y : y, endY = e.kind === 'arrow' ? ground + e.lane * 12 - 14 : y;
    // High enough to read as a volley, never over the top of the view.
    const lift = e.kind === 'arrow' ? Math.min(150, Math.max(20, startY - 24)) * arcShare(e.x) : 30;
    // At the far end of the aim the fortress's arrows rain down: they come in from above the view, steep, a little
    // behind their landing spot (the further the aim, the steeper), instead of arcing from the wall.
    const rain = e.kind === 'arrow' ? Math.max(0, Math.min(1, (e.x - RAIN_FROM) / (1080 - RAIN_FROM))) : 0;
    const arc = (t: number) => ({ x: fromX + (e.x - fromX) * t, y: startY + (endY - startY) * t - Math.sin(t * Math.PI) * lift });
    const skyX = e.x - 140 + e.lane * 25, skyY = -40;
    const drop = (t: number) => ({ x: skyX + (e.x - skyX) * t, y: skyY + (endY - skyY) * t * t });
    const at = rain > 0 ? (t: number) => { const a = arc(t), d = drop(t); return { x: a.x + (d.x - a.x) * rain, y: a.y + (d.y - a.y) * rain }; } : arc;
    const here = at(p), ahead = at(Math.min(1, p + 0.02));
    const len = e.kind === 'arrow' ? 72 : 40, h = len * art.naturalHeight / art.naturalWidth;
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
  const wings = still('fx/wings-1.webp'), gem = still('fx/gem-big.webp');
  const fill = s.energy / energyMax(s), full = fill >= 0.999;
  const glow = 0.35 + 0.65 * fill, beat = full ? 1 + Math.sin(s.time * 6) * 0.05 : 1;
  const base = ground - 10, top = base - 48;
  ctx.save();
  // Pedestal.
  ctx.fillStyle = '#3a4a5e'; ctx.strokeStyle = '#7f95b0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ANGEL_X - 26, base); ctx.lineTo(ANGEL_X - 18, top + 16); ctx.lineTo(ANGEL_X + 18, top + 16); ctx.lineTo(ANGEL_X + 26, base); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillRect(ANGEL_X - 24, top + 10, 48, 8);
  if (ok(wings)) {
    ctx.save(); ctx.globalAlpha = 0.55 + 0.45 * fill;
    try { ctx.filter = 'hue-rotate(185deg) saturate(1.2)'; } catch { /* older canvases keep the fire wings */ }
    const ww = 130 * beat, wh = ww * wings.naturalHeight / wings.naturalWidth;
    ctx.drawImage(wings, ANGEL_X - ww / 2, top - wh * 0.62, ww, wh); ctx.restore();
  }
  ctx.shadowColor = '#5fd8ff'; ctx.shadowBlur = 8 + 30 * glow;
  if (ok(gem)) {
    const gw = 40 * beat, gh = gw * gem.naturalHeight / gem.naturalWidth;
    ctx.globalAlpha = 0.5 + 0.5 * glow;
    try { ctx.filter = 'hue-rotate(-75deg)'; } catch { /* purple gem */ }
    ctx.drawImage(gem, ANGEL_X - gw / 2, top + 10 - gh, gw, gh);
  }
  ctx.restore();
  // The energy rising inside the pedestal.
  ctx.fillStyle = '#5fd8ff66'; const h = (base - top - 18) * fill; ctx.fillRect(ANGEL_X - 14, base - h, 28, h);
}

/** Troop portraits carry wide empty margins (the boss sheets most), so on cards they are cropped to what shows (alpha
    over 40), once per picture; every `img[data-trim]` under `scope` gets the cropped copy. */
const trimmed = new Map<string, string>();
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
const DEAD_FOR = 1.6;
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
  const spec = specOf(u), floor = ground + u.lane * 12;
  const y = gone !== undefined ? floor : spec.air ? floor - 70 - u.lane * 8 + (reduced ? 0 : Math.sin(s.time * 4 + u.uid) * 5) : floor;
  const path = spec.sprite, t = s.time + u.uid * 0.37;
  // The pose. Six-pose sheets: walk A/B in turn while walking, the wind-up just before a blow, the blow, hurt, dead.
  // Three-pose sheets: stand (walking in code), attack, hurt.
  const hurt = !!(u.flash || u.knock || u.stun);
  const ready = !u.moving && u.attack > 0 && u.attack < 0.3;
  const pose = spec.six
    ? gone !== undefined ? 5 : hurt ? 4 : u.hit ? 3 : ready ? 2 : u.moving && !reduced ? Math.floor(t * 5) % 2 : 0
    : gone !== undefined ? 2 : hurt ? 2 : u.hit ? 1 : 0;
  const stand = picture(`${path}-0`), art = picture(`${path}-${pose}`);
  const size = spec.size * (u.boss ? 1.6 : 1) * Math.pow(0.8, u.stage ?? 0);
  // The shadow under its feet (the troop's x is where its feet are), the feet standing on its middle.
  if (gone === undefined) { ctx.fillStyle = u.side ? '#ff648577' : '#43ebce77'; ctx.beginPath(); ctx.ellipse(u.x, floor, size * (spec.air ? 0.2 : 0.22), spec.air ? 4 : 5, 0, 0, Math.PI * 2); ctx.fill(); }
  if (ok(stand.image) && ok(art.image)) {
    // One scale for every pose (from the first), so an attack's flash or swing keeps its size.
    const k = size / stand.image.naturalHeight, sw = stand.image.naturalWidth * k;
    const dw = art.image.naturalWidth * k, dh = art.image.naturalHeight * k;
    let lift = 0, lean = 0, sx = 1, sy = 1, push = 0;
    if (gone !== undefined) {
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
