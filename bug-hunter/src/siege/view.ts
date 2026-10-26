import { CASTS, FIELD, UNITS, aimAt, enemyTier, energyMax, looksTier, type Effect, type Fighter, type Siege } from './model';

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
/** Each world's guardian is its own room-6 boss (the jungle and the haunted servers use their only boss). */
const GUARDIANS = ['monolith', 'overlord', 'valkyrie', 'mudmonster', 'queen', 'minotaur', 'mainframe', 'wraith', 'hydra'];
/** The world map's own picture of each world, the battle's backdrop. */
const BACKDROPS = ['original', 'infierno', 'vikingos', 'lodo', 'jungla', 'rayo', 'robots', 'demonios', 'nucleo'];
/** Six-pose sets; the rest walk on four, the boss sheets on their first three (two steps and a stand). */
const SIX = new Set(['enemies/greek-bug', 'enemies/greek-ticket', 'enemies/greek-legacy', 'enemies/demon-bug', 'enemies/demon-ticket', 'enemies/demon-legacy']);
const frames = (path: string): number => path.startsWith('bosses/') ? 3 : SIX.has(path) ? 6 : 4;
export function sprite(s: Siege, u: Fighter) {
  const spec = UNITS[u.id];
  if (!u.side) return spec.sprite;
  if (u.boss) return `bosses/${GUARDIANS[s.world - 1]}`;
  if (spec.air) return spec.sprite;
  const kind = u.id === 1 ? 'ticket' : u.id === 2 ? 'legacy' : 'bug';
  return `enemies/${CASTS[s.world - 1]}-${kind}`;
}
export const portrait = (id: number) => `/images/game/${UNITS[id].sprite}-0.webp`;
export function preload(world: number, deck: number[]) {
  const paths = new Set([...deck.map(id => UNITS[id].sprite), ...['bug', 'ticket', 'legacy'].map(kind => `enemies/${CASTS[world - 1]}-${kind}`), `bosses/${GUARDIANS[world - 1]}`]);
  paths.forEach(path => { for (let f = 0; f < frames(path); f++) picture(`${path}-${f}`); });
  picture(`ui/bench/bench-${world}`);
  // The fortresses and crossbow at every level (the workshop can change ours between battles).
  [backdropPath(world), ...[1, 2, 3].flatMap(n => [`siege/castle-${n}`, `siege/enemy-${n}`, `siege/xbow-base-${n}`, `siege/xbow-arm-${n}`]), ...FX].forEach(still);
}
/** The bridge: the width a whole bridge picture is drawn at, where its deck sits (a share of its height above the
    ground line), and the share of its width holding its two middle slabs, the part repeated to make it long. */
const BRIDGE = { width: 300, deck: 0.3, middle: [0.315, 0.685] };
/** From this aim on (field units) the arrows start to fall from the sky; at the furthest aim they only rain down. */
const RAIN_FROM = 760;
const backdropPath = (world: number) => `map/pv-${BACKDROPS[world - 1]}.jpg`;
/** The story scenes' pictures: the world's map picture behind, its guardian's standing pose speaking. */
export const backdropUrl = (world: number) => `/images/game/${backdropPath(world)}`;
export const guardianUrl = (world: number) => `/images/game/bosses/${GUARDIANS[world - 1]}-2.webp`;
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
      if (ok(arm)) {
        const aw = XBOW.arm, ah = aw * arm.naturalHeight / arm.naturalWidth;
        ctx.save(); ctx.translate(px, py); ctx.rotate(bowAngle(s, ground));
        const kick = s.time < kickUntil ? -5 : 0;
        ctx.drawImage(arm, -aw * XBOW.pivot[0] + kick, -ah * XBOW.pivot[1], aw, ah);
        ctx.restore();
      }
      if (ok(baseImg)) ctx.drawImage(baseImg, seatX - bw / 2, seatY - bh, bw, bh);
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
/** The crossbow arm's angle: the way an arrow leaves it for the current aim (the start of its arc), steeper the further
    the aim, nearly straight up where the arrows rain from the sky. */
function bowAngle(s: Siege, ground: number) {
  const x = aimAt(s.aim), dx = Math.max(40, x - bowAt.x), endY = ground - 14;
  const lift = Math.min(150, Math.max(20, bowAt.y - 24));
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
  const color = THEMES[s.world - 1];
  const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#080f21'); sky.addColorStop(1, '#172c3c');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  // Short, wide fields zoom in a little more, so the troops keep their size.
  const scale = Math.min(h / (w / h > 2.2 ? 290 : 340), w / 650);
  camera.width = w / scale;
  camera.min = -AIM_GUTTER / scale;
  camera.x = Math.max(camera.min, Math.min(Math.max(camera.min, FIELD - camera.width), camera.x));
  // The bridge deck the troops walk on runs across the middle of the field.
  // On wide, short fields (phones held sideways) it sits lower, so less of the chasm shows.
  camera.deck = w / h > 2.2 ? 0.62 : 0.5;
  const ground = h / scale * camera.deck;
  // Cartoon Wars-style backdrop: the world's own map picture behind the field, scrolling slower than the troops.
  const back = still(backdropPath(s.world));
  if (ok(back)) {
    const bh = h, bw = Math.max(w * 1.35, bh * back.naturalWidth / back.naturalHeight);
    const pan = FIELD > camera.width ? Math.max(0, Math.min(1, camera.x / (FIELD - camera.width))) : 0.5;
    ctx.drawImage(back, -(bw - w) * pan, 0, bw, bh);
    const shade = ctx.createLinearGradient(0, 0, 0, bh); shade.addColorStop(0, '#080f2155'); shade.addColorStop(0.7, '#080f21aa'); shade.addColorStop(1, '#03060cf2');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, w, bh);
  }
  ctx.scale(scale, scale); ctx.translate(-camera.x + Math.max(0, (camera.width - FIELD) / 2), 0);
  const viewH = h / scale;
  // The battle is fought on a bridge over the abyss, the world's Tactics bridge (`ui/bench/bench-N`) stretched from wall
  // to wall, the troops walking on its deck; the backdrop falls away under it.
  const chasm = ctx.createLinearGradient(0, ground, 0, viewH); chasm.addColorStop(0, '#03060c00'); chasm.addColorStop(1, '#03060cee');
  ctx.fillStyle = chasm; ctx.fillRect(-400, ground, FIELD + 800, viewH);
  const bridge = picture(`ui/bench/bench-${s.world}`);
  if (bridge.image.complete && bridge.image.naturalWidth) {
    // One long bridge: its own left end, then its two middle slabs repeated as far as needed, then its right end.
    const [cx, cy, cw, ch] = bridge.crop ?? [0, 0, bridge.image.width, bridge.image.height];
    const k = BRIDGE.width / cw, segH = ch * k, top = ground - segH * BRIDGE.deck;
    const a = cw * BRIDGE.middle[0], b = cw * BRIDGE.middle[1], leftW = a * k, midW = (b - a) * k, rightW = (cw - b) * k;
    const start = -leftW * 0.45, end = FIELD + rightW * 0.45 - rightW;
    for (let x = start + leftW; x < end + 1; x += midW) ctx.drawImage(bridge.image, cx + a, cy, b - a, ch, x, top, midW + 0.5, segH);
    ctx.drawImage(bridge.image, cx, cy, a, ch, start, top, leftW, segH);
    ctx.drawImage(bridge.image, cx + b, cy, cw - b, ch, end, top, rightW, segH);
  } else {
    const [deck, low] = GROUND[s.world - 1];
    const earth = ctx.createLinearGradient(0, ground - 10, 0, ground + 60); earth.addColorStop(0, deck); earth.addColorStop(1, low);
    ctx.fillStyle = earth; ctx.fillRect(0, ground - 10, FIELD, 70);
  }
  ctx.strokeStyle = color; ctx.globalAlpha = 0.6; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, ground - 10); ctx.lineTo(FIELD, ground - 10); ctx.stroke(); ctx.globalAlpha = 1;
  base(ctx, s, 80, ground, '#55e5c4', false);
  base(ctx, s, FIELD - 80, ground, '#ff718c', true);
  mana(ctx, s, ground);
  const aimY = ground + 10;
  ctx.strokeStyle = '#ffe3a0'; ctx.globalAlpha = 0.65; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.ellipse(s.aim, aimY, 45, 13, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  for (const u of [...s.units].sort((a, b) => a.lane - b.lane || a.x - b.x)) {
    // Air troops fly above their lane, their shadow on the ground under them.
    const spec = UNITS[u.id], floor = ground + u.lane * 12, y = spec.air ? floor - 70 - u.lane * 8 + (reduced ? 0 : Math.sin(s.time * 4 + u.uid) * 5) : floor;
    const path = sprite(s, u);
    // A blow shows: the boss sheets' wind-up pose (3) and flinch (8), the others lunge and lean back when hit.
    const boss = path.startsWith('bosses/');
    const frame = boss && u.hit ? 3 : boss && u.flash ? 8 : reduced ? 0 : Math.floor(s.time * 6 + u.uid) % frames(path);
    const art = picture(`${path}-${frame}`); const size = spec.size * (u.boss ? 1.2 : 1) * Math.pow(0.8, u.stage ?? 0);
    ctx.fillStyle = u.side ? '#ff648577' : '#43ebce77'; ctx.beginPath(); ctx.ellipse(u.x, floor + 2, size * (spec.air ? 0.2 : 0.3), spec.air ? 4 : 7, 0, 0, Math.PI * 2); ctx.fill();
    if (art.image.complete && art.image.naturalWidth) {
      const crop = art.crop ?? [0, 0, art.image.width, art.image.height];
      const ratio = Math.min(size * 1.2 / crop[2], size / crop[3]);
      const dw = crop[2] * ratio, dh = crop[3] * ratio;
      const bob = reduced ? 0 : Math.sin(s.time * 9 + u.uid) * 1.8;
      const lunge = u.hit ? Math.sin((1 - u.hit / 0.3) * Math.PI) * 12 : 0;
      ctx.save(); ctx.translate(u.x + (u.side ? -lunge : lunge), y + bob); if (u.side) ctx.scale(-1, 1);
      if (!boss && u.flash) ctx.rotate(-0.12);
      if (u.flash) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 10; }
      // Elites glow gold and wear horns; wrecks are darker the more broken they are.
      else if (u.elite) { ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 14; }
      if (u.stage) ctx.filter = `brightness(${1 - u.stage * 0.22}) saturate(${1 - u.stage * 0.3})`;
      ctx.drawImage(art.image, ...crop, -dw / 2, -dh, dw, dh); ctx.filter = 'none';
      if (u.elite) {
        ctx.shadowBlur = 0; ctx.fillStyle = '#f5e6c8'; ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 1.5;
        for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * dw * 0.12, -dh * 0.92); ctx.quadraticCurveTo(side * dw * 0.34, -dh * 1.12, side * dw * 0.3, -dh * 1.2); ctx.lineTo(side * dw * 0.22, -dh * 0.9); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      }
      ctx.restore();
    } else {
      ctx.fillStyle = u.side ? '#fd9aac' : color; ctx.beginPath(); ctx.roundRect(u.x - size / 4, y - size * 0.65, size / 2, size * 0.65, 10); ctx.fill();
      ctx.fillStyle = '#102132'; ctx.fillRect(u.x - 9, y - size * 0.45, 5, 5); ctx.fillRect(u.x + 4, y - size * 0.45, 5, 5);
    }
    ctx.fillStyle = '#07111c'; ctx.fillRect(u.x - 21, y - size - 10, 42, 4);
    ctx.fillStyle = u.side ? '#ff718c' : '#55e5c4'; ctx.fillRect(u.x - 21, y - size - 10, 42 * Math.max(0, u.hp / u.maxHp), 4);
  }
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
    const peak = Math.min(190, Math.max(20, y0 - 24)), at = (t: number) => ({ x: from + (e.x - from) * t, y: y0 + (ground + 10 - y0) * t - Math.sin(t * Math.PI) * peak });
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
    const lift = e.kind === 'arrow' ? Math.min(150, Math.max(20, startY - 24)) : 30;
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
