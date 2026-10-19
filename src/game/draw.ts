import { H, W, WALL, WHEEL_X, WORLDS, frostReach, waveAt, type Threat, isBossRoom, type Enemy, type Game, type Shot, type Look, type Statue, type Rect, type Vec, type Fusion, arrowLook, fusionOf, bladeCount, bladeElement, bladeOrbit, bladeScale, type BladeElement } from './world';
import { SPIRIT_COLOR, type ItemId, type SpiritSkin } from './shop';
import { FULL_HERO_SETS, heroKey, type HeroSkin } from './save';

/* Bug Hunter's renderer: everything is drawn in room units (360 × 600) and
   scaled to fit the screen. The accent colours are the player's. */

export type Palette = { accent: string; accent2: string; ink: string; rainbow: boolean; hat?: ItemId; body?: ItemId; boots?: ItemId; skin?: HeroSkin; retro?: boolean };

/** How room units map to the canvas; `cx`/`cy` is the middle of the playfield (the camera's seat on call) and `w`/`h` the canvas size, in CSS pixels. */
export type View = { scale: number; ox: number; oy: number; dpr: number; cx: number; cy: number; w: number; h: number };


const hue = (t: number, l = 70, s = 85) => `hsl(${Math.round((t * 60) % 360)} ${s}% ${l}%)`;

let retroLook = false;
/* The painted floors, one per world (static/images/game/floors/worldN.webp). */
const floors = new Map<number, HTMLImageElement>();
function floorImage(world: number) {
  let img = floors.get(world);
  if (!img) { img = new Image(); img.src = `./images/game/floors/world${world}.webp`; floors.set(world, img); }
  return img;
}
export function draw(ctx: CanvasRenderingContext2D, g: Game, view: View, pal: Palette, now: number) {
  retroLook = !!pal.retro;
  ctx.shadowBlur = 0;
  const accent = pal.rainbow ? hue(now) : pal.accent;
  const accent2 = pal.rainbow ? hue(now + 1.5) : pal.accent2;
  const { scale, ox, oy, dpr } = view;
  const horde = g.mode === 'horde';

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#07090f';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const shake = g.shake > 0 ? g.shake * 10 : 0;
  const sx = shake ? (Math.random() - 0.5) * shake : 0;
  const sy = shake ? (Math.random() - 0.5) * shake : 0;
  // On call the camera rides on the hero; the room sits where resize() put it.
  const p = g.player;
  if (horde) ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (view.cx - p.x * scale + sx), dpr * (view.cy - p.y * scale + sy));
  else ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (ox + sx), dpr * (oy + sy));
  // What the canvas shows, in room units (the whole room when it isn't scrolling).
  const vis: Rect = horde
    ? { x: p.x - view.cx / scale, y: p.y - view.cy / scale, w: view.w / scale, h: view.h / scale }
    : { x: 0, y: 0, w: W, h: H };
  const onScreen = (o: Vec, pad: number) => o.x > vis.x - pad && o.x < vis.x + vis.w + pad && o.y > vis.y - pad && o.y < vis.y + vis.h + pad;

  if (horde) drawField(ctx, g, vis, now);
  else drawRoom(ctx, g, accent, now);
  drawHazards(ctx, g, now);
  drawGems(ctx, g, now);
  if (g.chest) drawChest(ctx, g.chest, now);
  drawHearts(ctx, g, now);
  if (g.skills.frost) drawFrost(ctx, g, now);
  drawEmbers(ctx, g, now);
  drawMines(ctx, g, now);
  drawRunes(ctx, g, now);
  drawFx(ctx, g, accent, 'under');
  drawThreats(ctx, g, now, false);
  for (const e of g.enemies) if (onScreen(e, 80)) drawEnemy(ctx, e, now);
  drawThreats(ctx, g, now, true);
  drawOrbs(ctx, g);
  drawShots(ctx, g, accent, accent2);
  drawFireballs(ctx, g);
  drawSpirits(ctx, g, now);
  drawZaps(ctx, g);
  if (pal.retro) drawPlayerRetro(ctx, g, pal, now);
  else drawPlayer(ctx, g, pal, now);
  if (g.skills.blades) drawBlades(ctx, g, accent);
  if (g.skills.frost) drawFrostTop(ctx, g, now);
  drawFx(ctx, g, accent, 'over');
  drawPicFx(ctx, g, true);
  drawBeams(ctx, g);
  drawStrikes(ctx, g, now);
  for (const q of g.particles) {
    ctx.globalAlpha = Math.max(0, q.life / q.max);
    ctx.fillStyle = q.color;
    ctx.beginPath();
    ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (g.hazard === 'fog') drawFog(ctx, g, vis);
}

/* On call: the open field. The world's arena floor has painted walls round
   it, so only its plain middle is tiled, mirrored tile by tile so the seams
   join; flat tiles in retro. The field has no edge: whatever the canvas
   shows gets floor. */
const FLOOR_CROP = { x: 0.21, y: 0.16, w: 0.58, h: 0.68 };
function drawField(ctx: CanvasRenderingContext2D, g: Game, vis: Rect, now: number) {
  const theme = WORLDS[g.world - 1];
  const floor = retroLook ? undefined : floorImage(g.world);
  const tw = W * FLOOR_CROP.w;
  const th = H * FLOOR_CROP.h;
  ctx.fillStyle = theme.floor;
  ctx.fillRect(vis.x, vis.y, vis.w, vis.h);
  if (floor && floor.complete && floor.naturalWidth) {
    const sx = floor.naturalWidth * FLOOR_CROP.x;
    const sy = floor.naturalHeight * FLOOR_CROP.y;
    const sw = floor.naturalWidth * FLOOR_CROP.w;
    const sh = floor.naturalHeight * FLOOR_CROP.h;
    const i0 = Math.floor(vis.x / tw);
    const j0 = Math.floor(vis.y / th);
    for (let i = i0; i * tw < vis.x + vis.w; i++) {
      for (let j = j0; j * th < vis.y + vis.h; j++) {
        ctx.save();
        ctx.translate(i * tw + tw / 2, j * th + th / 2);
        ctx.scale(i & 1 ? -1 : 1, j & 1 ? -1 : 1);
        ctx.drawImage(floor, sx, sy, sw, sh, -tw / 2, -th / 2, tw + 0.5, th + 0.5);
        ctx.restore();
      }
    }
  } else {
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    const step = 36;
    for (let x = Math.floor(vis.x / step) * step; x < vis.x + vis.w; x += step) { ctx.beginPath(); ctx.moveTo(x, vis.y); ctx.lineTo(x, vis.y + vis.h); ctx.stroke(); }
    for (let y = Math.floor(vis.y / step) * step; y < vis.y + vis.h; y += step) { ctx.beginPath(); ctx.moveTo(vis.x, y); ctx.lineTo(vis.x + vis.w, y); ctx.stroke(); }
  }
  // A faint pulse round the hero marks where the bugs are drawn to.
  const pulse = 0.05 + Math.sin(now * 2) * 0.02;
  const ring = ctx.createRadialGradient(g.player.x, g.player.y, 40, g.player.x, g.player.y, 160);
  ring.addColorStop(0, `rgba(255,255,255,${pulse})`);
  ring.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = ring;
  ctx.fillRect(g.player.x - 160, g.player.y - 160, 320, 320);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawRoom(ctx: CanvasRenderingContext2D, g: Game, accent: string, now: number) {
  const theme = WORLDS[g.world - 1];
  // Floor: the world's painted arena, or flat tiles in its colours (retro, or while it loads).
  const floor = retroLook ? undefined : floorImage(g.world);
  if (floor && floor.complete && floor.naturalWidth) {
    ctx.drawImage(floor, 0, 0, W, H);
    if (isBossRoom(g.room)) { ctx.fillStyle = 'rgba(20,10,30,0.25)'; ctx.fillRect(0, 0, W, H); }
  } else {
    ctx.fillStyle = isBossRoom(g.room) && g.world === 1 ? '#140f1c' : theme.floor;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let x = WALL; x < W; x += 36) { ctx.beginPath(); ctx.moveTo(x, WALL); ctx.lineTo(x, H - WALL); ctx.stroke(); }
    for (let y = WALL; y < H; y += 36) { ctx.beginPath(); ctx.moveTo(WALL, y); ctx.lineTo(W - WALL, y); ctx.stroke(); }
  }

  // Walls, with the door gap at the top.
  ctx.fillStyle = theme.wall;
  ctx.fillRect(0, 0, W / 2 - 32, WALL);
  ctx.fillRect(W / 2 + 32, 0, W / 2 - 32, WALL);
  ctx.fillRect(0, H - WALL, W, WALL);
  ctx.fillRect(0, 0, WALL, H);
  ctx.fillRect(W - WALL, 0, WALL, H);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(WALL, WALL - 2, W - WALL * 2, 2);

  // Door: shut bars, or an open glowing gap.
  if (g.door) {
    const pulse = 0.55 + Math.sin(now * 5) * 0.25;
    const grad = ctx.createLinearGradient(0, 0, 0, WALL + 40);
    grad.addColorStop(0, theme.door || accent);
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = pulse;
    ctx.fillStyle = grad;
    ctx.fillRect(W / 2 - 32, 0, 64, WALL + 40);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = '#2b3445';
    ctx.fillRect(W / 2 - 32, 0, 64, WALL);
    ctx.fillStyle = '#ff6b6b';
    for (let i = 0; i < 4; i++) ctx.fillRect(W / 2 - 26 + i * 15, 5, 7, 6);
  }

  // The mysterious door: a purple gap with a question mark, once per run.
  if (g.wheelDoor) {
    const pulse = 0.6 + Math.sin(now * 4) * 0.25;
    ctx.fillStyle = theme.floor;
    ctx.fillRect(WHEEL_X - 32, 0, 64, WALL);
    const grad = ctx.createLinearGradient(0, 0, 0, WALL + 44);
    grad.addColorStop(0, '#c084fc');
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = pulse;
    ctx.fillStyle = grad;
    ctx.fillRect(WHEEL_X - 32, 0, 64, WALL + 44);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f5f3ff';
    ctx.font = '700 22px Fredoka, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', WHEEL_X, WALL + 22 + Math.sin(now * 3) * 2);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  if (g.statue) (retroLook ? drawStatueRetro : drawStatue)(ctx, g.statue, theme.door || accent, now);

  // Server racks, with blinking lights.
  for (const o of g.obstacles) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, o.x + 3, o.y + 5, o.w, o.h, 5);
    ctx.fill();
    const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
    grad.addColorStop(0, '#2c3648');
    grad.addColorStop(1, '#1b2230');
    ctx.fillStyle = grad;
    roundRect(ctx, o.x, o.y, o.w, o.h, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.stroke();
    const lights = Math.max(1, Math.floor(o.w / 12));
    for (let i = 0; i < lights; i++) {
      const on = Math.sin(now * 3 + i * 1.7 + o.x) > 0;
      ctx.fillStyle = on ? (i % 2 ? '#67dfa0' : accent) : 'rgba(255,255,255,0.12)';
      ctx.fillRect(o.x + 6 + i * 12, o.y + 6, 4, 3);
    }
  }
}

/* The healing statue: the owner's altar, lit until its gift is taken. */
const statueOff = new Image();
statueOff.src = './images/game/ui/statue_off.webp';
const statueOn = new Image();
statueOn.src = './images/game/ui/statue_on.webp';
function drawStatue(ctx: CanvasRenderingContext2D, st: Statue, glow: string, now: number) {
  const { x, y } = st;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + 22, 30, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  const img = st.used ? statueOff : statueOn;
  if (img.complete && img.naturalWidth) {
    const w = st.used ? 64 : 72;
    const h = (w * img.naturalHeight) / img.naturalWidth;
    const bob = st.used ? 0 : Math.sin(now * 2.5) * 1.5;
    ctx.drawImage(img, x - w / 2, y + 24 - h + bob, w, h);
  } else {
    ctx.fillStyle = st.used ? '#4b5563' : glow;
    ctx.fillRect(x - 12, y - 20, 24, 44);
  }
  if (!st.used) {
    ctx.fillStyle = '#ff6b8a';
    const hy = y - 58 + Math.sin(now * 2.5 + 1) * 2;
    ctx.beginPath();
    ctx.moveTo(x, hy + 6);
    ctx.bezierCurveTo(x - 9, hy - 2, x - 5, hy - 9, x, hy - 3);
    ctx.bezierCurveTo(x + 5, hy - 9, x + 9, hy - 2, x, hy + 6);
    ctx.fill();
  }
}

/* The hero: the owner's painted figure, one picture per pose, in two skins
   (boy, robot, kitty) each with the head item worn: the hats are painted
   on, so nothing is drawn over the sprite (Kitty has no hat versions). Feet on the shadow, flipped to face
   left; one walking frame alternates with the idle one for a step cycle.
   The circle in world.ts is still what collides. */
type Pose = 'idle' | 'walk' | 'back' | 'shoot' | 'cheer' | 'walk2' | 'front' | 'hurt' | 'down' | 'wshoot' | 'wshoot2' | 'fwalk' | 'fwalk2';
const POSES: Pose[] = ['idle', 'walk', 'back', 'shoot', 'cheer', 'walk2', 'front', 'hurt', 'down', 'wshoot', 'wshoot2', 'fwalk', 'fwalk2'];
/* The sets with the full nine poses, all on one scale with the feet at the
   bottom of a canvas as tall as the tallest pose (Alvrich's new sheet: a
   second step, facing the camera, a flinch and a knock-out). The others
   still have five and fall back for the rest. */
const FULL_SETS = new Set(FULL_HERO_SETS);
/** The full sets' pixel scale (the base set was cut 150px tall); each picture is trimmed to its feet, so it is drawn from its own height at that scale. */
const FULL_BASE_H = 150;
const FALLBACK: Partial<Record<Pose, Pose>> = { walk2: 'walk', front: 'idle', hurt: 'idle', down: 'idle', wshoot: 'walk', wshoot2: 'walk', fwalk: 'idle', fwalk2: 'walk' };
const heroSets = new Map<string, Record<Pose, HTMLImageElement>>();
function heroSet(skin: HeroSkin, hat?: ItemId) {
  const key = heroKey(skin, hat);
  let set = heroSets.get(key);
  if (!set) {
    const full = FULL_SETS.has(key);
    set = Object.fromEntries(POSES.map((pose) => {
      const img = new Image();
      img.src = `./images/game/hero/${key}-${full ? pose : FALLBACK[pose] ?? pose}.webp`;
      return [pose, img];
    })) as Record<Pose, HTMLImageElement>;
    heroSets.set(key, set);
  }
  return set;
}

/* Retro: the ring with the portfolio's avatar and a hand-drawn hat, as the
   game first looked. */
const avatar = new Image();
avatar.src = './images/favicon-192.png';
/* The body and boots items, as the retro figure shows them: a cape behind
   the ring and two feet under it, in the item's colour. */
const CAPE: Partial<Record<ItemId, string>> = { potion: '#2f9e6b', pompom: '#b07a4a', plate: '#9aa5b8', phoenix: '#ff7a1a' };
const BOOTS: Partial<Record<ItemId, string>> = { windBoots: '#38bdf8', magnetBoots: '#ef4444', ironBoots: '#6b7280' };

function drawPlayerRetro(ctx: CanvasRenderingContext2D, g: Game, pal: Palette, now: number) {
  const { accent } = pal;
  const p = g.player;
  if (p.inv > 0 && Math.floor(now * 20) % 2 === 0) return;
  drawRetroFigure(ctx, p.x, p.y, p.r, pal);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.face) * (p.r + 8), p.y + Math.sin(p.face) * (p.r + 8), 2.5, 0, Math.PI * 2);
  ctx.fill();
  const w = 34;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, p.x - w / 2, p.y - p.r - 14, w, 5, 2.5);
  ctx.fill();
  ctx.fillStyle = p.hp / p.maxHp > 0.3 ? '#67dfa0' : '#ff6b6b';
  roundRect(ctx, p.x - w / 2, p.y - p.r - 14, (w * p.hp) / p.maxHp, 5, 2.5);
  ctx.fill();
}

/** The retro hero at (x, y) with radius r: shadow, cape, ring, avatar, boots and hat. */
export function drawRetroFigure(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, pal: Palette) {
  const { accent, accent2 } = pal;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.9, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  const cape = pal.body && CAPE[pal.body];
  if (cape) {
    ctx.fillStyle = cape;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y - r * 0.2);
    ctx.quadraticCurveTo(x - r * 1.5, y + r * 0.9, x - r * 1.05, y + r * 1.25);
    ctx.lineTo(x + r * 1.05, y + r * 1.25);
    ctx.quadraticCurveTo(x + r * 1.5, y + r * 0.9, x + r * 0.9, y - r * 0.2);
    ctx.closePath();
    ctx.fill();
  }
  const boots = pal.boots && BOOTS[pal.boots];
  if (boots) {
    ctx.fillStyle = boots;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + side * r * 0.45, y + r * 1.08, r * 0.4, r * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const ring = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  ring.addColorStop(0, accent);
  ring.addColorStop(1, accent2);
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(x, y, r + 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#e9edf5';
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  if (avatar.complete && avatar.naturalWidth) ctx.drawImage(avatar, x - r, y - r, r * 2, r * 2);
  ctx.restore();
  if (pal.hat) {
    ctx.save();
    ctx.translate(x, y - r * 0.55);
    if (pal.hat === 'wizardHat') {
      ctx.fillStyle = '#4c1d95';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.15, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6d28d9';
      ctx.beginPath();
      ctx.moveTo(-r * 0.75, 0);
      ctx.quadraticCurveTo(0, -r * 0.6, r * 0.45, -r * 1.9);
      ctx.quadraticCurveTo(r * 0.3, -r * 0.7, r * 0.75, 0);
      ctx.closePath();
      ctx.fill();
    } else if (pal.hat === 'gladHelm') {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-r * 0.25, -r * 0.2);
      ctx.quadraticCurveTo(0, -r * 1.5, r * 0.25, -r * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#b7791f';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.95, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
    } else if (pal.hat === 'bandana') {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-r * 0.95, -r * 0.15, r * 1.9, r * 0.32);
    } else if (pal.hat === 'crown') {
      ctx.fillStyle = '#f5c242';
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, 0);
      ctx.lineTo(-r * 0.7, -r * 0.7);
      ctx.lineTo(-r * 0.35, -r * 0.3);
      ctx.lineTo(0, -r * 0.85);
      ctx.lineTo(r * 0.35, -r * 0.3);
      ctx.lineTo(r * 0.7, -r * 0.7);
      ctx.lineTo(r * 0.7, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

/* Retro statue: a stone pedestal and a crystal, drawn by hand. */
function drawStatueRetro(ctx: CanvasRenderingContext2D, st: Statue, glow: string, now: number) {
  const { x, y } = st;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + 20, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b465c';
  roundRect(ctx, x - 20, y + 6, 40, 14, 4);
  ctx.fill();
  ctx.fillStyle = '#4d5a73';
  roundRect(ctx, x - 13, y - 4, 26, 12, 3);
  ctx.fill();
  const bob = st.used ? 0 : Math.sin(now * 2.5) * 2;
  const top = y - 30 + bob;
  const crystal = ctx.createLinearGradient(x - 10, top, x + 10, top + 28);
  crystal.addColorStop(0, st.used ? '#6b7280' : '#ffffff');
  crystal.addColorStop(0.5, st.used ? '#4b5563' : glow);
  crystal.addColorStop(1, st.used ? '#374151' : '#1e293b');
  ctx.fillStyle = crystal;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + 10, top + 14);
  ctx.lineTo(x, top + 28);
  ctx.lineTo(x - 10, top + 14);
  ctx.closePath();
  ctx.fill();
  if (!st.used) {
    ctx.fillStyle = '#ff6b8a';
    const hy = top - 12 + Math.sin(now * 2.5 + 1) * 2;
    ctx.beginPath();
    ctx.moveTo(x, hy + 6);
    ctx.bezierCurveTo(x - 9, hy - 2, x - 5, hy - 9, x, hy - 3);
    ctx.bezierCurveTo(x + 5, hy - 9, x + 9, hy - 2, x, hy + 6);
    ctx.fill();
  }
}

function heroPose(g: Game, now: number, full: boolean): Pose {
  const p = g.player;
  if (g.phase === 'over') return 'down';
  if (p.ouch > 0) return 'hurt';
  if (p.moving) {
    const step = Math.floor(now * 7) % 2;
    // On call fires on the move: walk aiming the blaster while there are bugs about.
    if (full && g.mode === 'horde' && g.enemies.some((e) => e.spawn <= 0)) return step ? 'wshoot' : 'wshoot2';
    if (Math.sin(p.heading) < -0.75) return 'back';
    if (Math.sin(p.heading) > 0.75 && full) return step ? 'fwalk' : 'fwalk2';
    return full ? (step ? 'walk' : 'walk2') : step ? 'walk' : 'idle';
  }
  if (g.enemies.length === 0 && g.door) return 'cheer';
  if (g.enemies.some((e) => e.spawn <= 0)) return 'shoot';
  return full && g.enemies.length === 0 ? 'front' : 'idle';
}

function drawPlayer(ctx: CanvasRenderingContext2D, g: Game, pal: Palette, now: number) {
  const { accent, accent2 } = pal;
  const p = g.player;
  if (p.inv > 0 && Math.floor(now * 20) % 2 === 0) return;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + p.r * 0.9, p.r * 0.9, p.r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  const full = FULL_SETS.has(heroKey(pal.skin ?? 'boy', pal.hat));
  const pose = heroPose(g, now, full);
  const img = heroSet(pal.skin ?? 'boy', pal.hat)[pose];
  // Health bar height: above the picture's top (hats make it taller).
  let barTop = p.y - p.r * 2.5;
  if (img.complete && img.naturalWidth) {
    // The full sets share one canvas height (feet at the bottom); the older ones grow a little to cheer.
    const h = full ? p.r * 3.05 * (img.naturalHeight / FULL_BASE_H) : p.r * (pose === 'cheer' ? 3.1 : 2.7);
    const w = (h * img.naturalWidth) / img.naturalHeight;
    // Feet stay on the shadow: the full sets have their own step frames, so only a tiny bounce while walking.
    const bob = p.moving ? Math.abs(Math.sin(now * 14)) * (full ? 0.6 : 2) : pose === 'cheer' ? Math.abs(Math.sin(now * 6)) * 3 : 0;
    // Shooting on the move faces the target; plain walking faces the way you go.
    const turn = pose === 'wshoot' || pose === 'wshoot2' || !p.moving ? p.face : p.heading;
    const left = Math.cos(turn) < -0.2 && pose !== 'back' && pose !== 'cheer' && pose !== 'front' && pose !== 'fwalk' && pose !== 'fwalk2';
    // Walking up there is one picture (down has two steps): mirror it every step and rock it a little, so it walks rather than glides.
    const vertical = p.moving && (pose === 'front' || pose === 'back');
    const step = Math.floor(now * 7) % 2;
    ctx.save();
    ctx.translate(p.x, p.y + p.r * 0.9 - bob);
    if (left || (vertical && step)) ctx.scale(-1, 1);
    if (vertical) ctx.rotate(0.06 * Math.sin(now * 7 * Math.PI));
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();
    barTop = p.y + p.r * 0.9 - h - 9;
  } else {
    // Until the picture is in: the ring as before.
    const ring = ctx.createLinearGradient(p.x - p.r, p.y - p.r, p.x + p.r, p.y + p.r);
    ring.addColorStop(0, accent);
    ring.addColorStop(1, accent2);
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Aim marker.
  ctx.fillStyle = accent;
  ctx.beginPath();
  const fx = p.x + Math.cos(p.face) * (p.r + 8);
  const fy = p.y + Math.sin(p.face) * (p.r + 8);
  ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Health bar above the head.
  const w = 34;
  const top = barTop;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, p.x - w / 2, top, w, 5, 2.5);
  ctx.fill();
  ctx.fillStyle = p.hp / p.maxHp > 0.3 ? '#67dfa0' : '#ff6b6b';
  roundRect(ctx, p.x - w / 2, top, (w * p.hp) / p.maxHp, 5, 2.5);
  ctx.fill();
}

/* The bow's painted arrows, one per element (static/images/game/arrows): the
   first element owned decides the look, with its trail drawn behind the tip. */
const ARROW_PICTURES = ['fire', 'water', 'leaf', 'ghost', 'bolt', 'spark'];
const arrows = new Map<string, HTMLImageElement>();
function arrowImage(name: string) {
  let img = arrows.get(name);
  if (!img) { img = new Image(); img.src = `./images/game/arrows/${name}.webp`; arrows.set(name, img); }
  return img;
}

function drawShots(ctx: CanvasRenderingContext2D, g: Game, accent: string, accent2: string) {
  const look = arrowLook(g);
  const element = look && ARROW_PICTURES.includes(look) ? look : null;
  const fusion = fusionOf(g);
  ctx.lineCap = 'round';
  for (const a of g.shots) {
    // A fused arrow: the owner's arrow for that fusion (it carries its own trail), else a glow in its colour.
    if (fusion && a.bow && a.kind === 'arrow' && !retroLook) {
      const pic = arrowImage(`fusion-${fusion}`);
      if (ready(pic)) {
        // As thick as a plain arrow: the longer pictures are drawn a little longer.
        const w = Math.min(50, (6.6 * pic.naturalWidth) / pic.naturalHeight);
        const h = (w * pic.naturalHeight) / pic.naturalWidth;
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(Math.atan2(a.vy, a.vx));
        ctx.drawImage(pic, -w, -h / 2, w, h);
        ctx.restore();
        continue;
      }
    }
    if (fusion && a.bow && a.kind === 'arrow') {
      const glow = ctx.createRadialGradient(a.x, a.y, 1, a.x, a.y, 13);
      glow.addColorStop(0, `rgba(${FUSION_COLOR[fusion]},0.8)`);
      glow.addColorStop(1, `rgba(${FUSION_COLOR[fusion]},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 13, 0, Math.PI * 2);
      ctx.fill();
    }
    const len = Math.hypot(a.vx, a.vy) || 1;
    if (drawNewShot(ctx, g, a)) continue;
    if (a.kind === 'orb') {
      // The spirits' orb with a short trail: purple in retro, the water ghost's blue otherwise.
      const tint = retroLook ? ['rgba(192,132,252,0.45)', '#f5f3ff', '#c084fc', 'rgba(168,85,247,0)'] : [...SPIRIT_COLOR[a.elem ?? 'water'], 'rgba(0,0,0,0)'];
      ctx.strokeStyle = tint[0];
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(a.x - (a.vx / len) * 10, a.y - (a.vy / len) * 10);
      ctx.lineTo(a.x, a.y);
      ctx.stroke();
      const glow = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 7);
      glow.addColorStop(0, tint[1]);
      glow.addColorStop(0.45, tint[2]);
      glow.addColorStop(1, tint[3]);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 7, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    if (a.kind === 'knife') {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(Math.atan2(a.vy, a.vx));
      const pic = fxImage('knife');
      if (!retroLook && ready(pic)) {
        const w = 26;
        const h = (w * pic.naturalHeight) / pic.naturalWidth;
        // A short streak behind it in the accent colour, then the knife, tip on the shot.
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-w - 10, 0);
        ctx.lineTo(-w * 0.6, 0);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.drawImage(pic, -w, -h / 2, w, h);
        ctx.restore();
        continue;
      }
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-3, -2.4);
      ctx.lineTo(-3, 2.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.fillRect(-7, -1.5, 4, 3);
      ctx.restore();
      continue;
    }
    if (a.kind === 'crescent') {
      // The Lunar Halo's flying cut: the owner's crescent, bulge forward, fading as it flies.
      const own = fxImage('crescent');
      const pic = ready(own) ? own : fxImage('slash');
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(Math.atan2(a.vy, a.vx));
      ctx.globalAlpha = Math.min(1, a.life / 0.3);
      if (!retroLook && ready(pic)) {
        const w = pic === own ? 46 : 40;
        const h = (w * pic.naturalHeight) / pic.naturalWidth;
        ctx.drawImage(pic, -w * 0.7, -h / 2, w, h);
      } else {
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-6, 0, 12, -1, 1);
        ctx.stroke();
      }
      ctx.restore();
      continue;
    }
    if (a.kind === 'boomerang') {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.spin);
      const pic = fxImage('boomerang');
      if (!retroLook && ready(pic)) {
        const h = 22;
        const w = (h * pic.naturalWidth) / pic.naturalHeight;
        const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
        halo.addColorStop(0, 'rgba(251,146,60,0.45)');
        halo.addColorStop(1, 'rgba(251,146,60,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(pic, -w / 2, -h / 2, w, h);
        ctx.restore();
        continue;
      }
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-9, 6);
      ctx.quadraticCurveTo(0, -10, 9, 6);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
      continue;
    }
    if (a.kind === 'arrow' && element) {
      const arrow = arrowImage(element);
      // The lightning arrow carries its own crackle along the shaft: no separate trail, a little longer.
      const whole = element === 'bolt';
      const trail = arrowImage(`${element}-trail`);
      if (arrow.complete && arrow.naturalWidth) {
        // The tip sits on the shot's point; the picture points right.
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(Math.atan2(a.vy, a.vx));
        if (!whole && trail.complete && trail.naturalWidth) {
          const tw = 58;
          const th = (tw * trail.naturalHeight) / trail.naturalWidth;
          ctx.globalAlpha = 0.85;
          ctx.drawImage(trail, -tw, -th / 2, tw, th);
          ctx.globalAlpha = 1;
        }
        const w = whole ? 42 : 36;
        const h = (w * arrow.naturalHeight) / arrow.naturalWidth;
        ctx.drawImage(arrow, -w, -h / 2, w, h);
        ctx.restore();
        continue;
      }
    }
    const tx = a.x - (a.vx / len) * 14;
    const ty = a.y - (a.vy / len) * 14;
    const tail = ctx.createLinearGradient(tx, ty, a.x, a.y);
    tail.addColorStop(0, 'transparent');
    // Looks without a painted arrow (lightning, sparks) tint the drawn one; so does retro.
    const bolt = look === 'bolt';
    const spark = look === 'spark';
    tail.addColorStop(1, look === 'fire' ? '#ffb347' : look === 'water' ? '#7ad8ff' : look === 'leaf' ? '#86efac' : bolt ? '#fde047' : spark ? '#fb923c' : accent2);
    if (bolt || spark) { ctx.shadowColor = bolt ? '#facc15' : '#fb923c'; ctx.shadowBlur = 8; }
    ctx.strokeStyle = tail;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(a.x, a.y);
    ctx.stroke();
    ctx.strokeStyle = a.ghost ? 'rgba(255,255,255,0.75)' : accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x - (a.vx / len) * 8, a.y - (a.vy / len) * 8);
    ctx.lineTo(a.x, a.y);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(a.x, a.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

/* The weapons from the rest of Survivor.io's list, drawn in code until
   their pictures come: brick (an anvil when evolved), bottle (a barrel),
   durian, drill, rocket and ball. True if it drew the shot. */
/* The owner's pictures for those weapons, all turned to point right (their
   trail behind): [picture, width in room units, how far behind the shot the
   picture starts (share of its width), turn with the flight?]. */
const SHOT_PIC: Partial<Record<Shot['kind'], (g: Game, a: Shot) => [string, number, number, boolean]>> = {
  brick: (g) => (g.evolved.brick ? ['iron', 44, 0.5, false] : ['brick', 26, 0.6, true]),
  molotov: (g) => (g.evolved.molotov ? ['barrel', 34, 0.6, true] : ['molotov', 30, 0.6, true]),
  durian: (g, a) => [g.evolved.durian ? 'durian-big' : 'durian', (a.size ?? 14) * 2.5, 0.62, true],
  drill: (g, a) => [g.evolved.drill ? 'drill-evo' : 'drill', 30 * ((a.size ?? 7) / 7), 0.75, true],
  rocket: (g) => (g.evolved.rocket ? ['rocket-shark', 38, 0.75, true] : ['rocket', 32, 0.75, true]),
  ball: (g, a) => [g.evolved.ball ? 'ball-evo' : 'ball', (a.size ?? 8) * 2.9, 0.62, true],
};
function drawNewShot(ctx: CanvasRenderingContext2D, g: Game, a: Shot) {
  const t = g.time;
  const painted = SHOT_PIC[a.kind];
  if (painted && !retroLook) {
    const [name, w, back, turn] = painted(g, a);
    const pic = fxImage(name);
    if (ready(pic)) {
      const h = (w * pic.naturalHeight) / pic.naturalWidth;
      ctx.save();
      ctx.translate(a.x, a.y);
      if (turn) ctx.rotate(Math.atan2(a.vy, a.vx));
      else ctx.rotate(Math.sin(t * 6 + a.x) * 0.15);
      ctx.drawImage(pic, -w * back, -h / 2, w, h);
      ctx.restore();
      return true;
    }
  }
  if (a.kind === 'brick') {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.spin);
    if (g.evolved.brick) {
      // The 1-ton weight: a dark iron block with "1T" on it.
      ctx.fillStyle = '#374151';
      ctx.beginPath();
      ctx.moveTo(-16, 12); ctx.lineTo(16, 12); ctx.lineTo(11, -12); ctx.lineTo(-11, -12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '700 10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('1T', 0, 1);
    } else {
      ctx.fillStyle = '#b4532a';
      ctx.fillRect(-9, -5, 18, 10);
      ctx.fillStyle = '#d9774a';
      ctx.fillRect(-9, -5, 18, 3);
      ctx.strokeStyle = 'rgba(60,20,10,0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-9, -5, 18, 10);
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke();
    }
    ctx.restore();
    return true;
  }
  if (a.kind === 'molotov') {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.spin);
    if (g.evolved.molotov) {
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-7, -9, 14, 18);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(-7, -4, 14, 2);
      ctx.fillRect(-7, 3, 14, 2);
    } else {
      ctx.fillStyle = 'rgba(132,204,22,0.9)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-2, -9, 4, 6);
    }
    // The lit rag.
    ctx.fillStyle = Math.floor(t * 20) % 2 ? '#fde047' : '#fb923c';
    ctx.beginPath();
    ctx.arc(0, -11, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return true;
  }
  if (a.kind === 'durian') {
    const r = (a.size ?? 14) * 0.85;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.spin * 0.3);
    ctx.fillStyle = g.evolved.durian ? '#4d7c0f' : '#65a30d';
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const k = i % 2 ? r : r * 1.32;
      const ang = (i / 24) * Math.PI * 2;
      if (i) ctx.lineTo(Math.cos(ang) * k, Math.sin(ang) * k); else ctx.moveTo(k, 0);
    }
    ctx.closePath();
    ctx.fill();
    const shine = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
    shine.addColorStop(0, '#d9f99d');
    shine.addColorStop(1, 'rgba(101,163,13,0)');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return true;
  }
  if (a.kind === 'drill') {
    const k = (a.size ?? 7) / 7;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(Math.atan2(a.vy, a.vx));
    ctx.scale(k, k);
    if (g.evolved.drill) {
      ctx.fillStyle = 'rgba(103,232,249,0.35)';
      ctx.beginPath();
      ctx.ellipse(-6, 0, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const grad = ctx.createLinearGradient(0, -6, 0, 6);
    grad.addColorStop(0, '#e5e7eb');
    grad.addColorStop(1, '#6b7280');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(13, 0); ctx.lineTo(-6, -6); ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    // The thread, turning.
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const x = -4 + ((i * 5 + a.spin * 3) % 15);
      const h = 6 * (1 - (x + 6) / 19);
      ctx.beginPath(); ctx.moveTo(x, -h); ctx.lineTo(x + 2, h); ctx.stroke();
    }
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-10, -4, 4, 8);
    ctx.restore();
    return true;
  }
  if (a.kind === 'rocket') {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(Math.atan2(a.vy, a.vx));
    if (g.evolved.rocket) ctx.scale(1.2, 1.2);
    // Flame, body, nose, fins.
    ctx.fillStyle = Math.floor(t * 24) % 2 ? '#fde047' : '#fb923c';
    ctx.beginPath();
    ctx.moveTo(-8, -3); ctx.lineTo(-16 - Math.random() * 4, 0); ctx.lineTo(-8, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = g.evolved.rocket ? '#1e3a8a' : '#e5e7eb';
    ctx.fillRect(-8, -3.5, 13, 7);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(5, -3.5); ctx.lineTo(10, 0); ctx.lineTo(5, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-8, -6, 4, 2.5);
    ctx.fillRect(-8, 3.5, 4, 2.5);
    if (g.evolved.rocket) {
      // Sharkmaw: teeth on the nose.
      ctx.fillStyle = '#fff';
      for (const y of [-2, 0, 2]) { ctx.beginPath(); ctx.moveTo(3, y - 1); ctx.lineTo(5, y); ctx.lineTo(3, y + 1); ctx.fill(); }
    }
    ctx.restore();
    return true;
  }
  if (a.kind === 'ball') {
    const r = (a.size ?? 8) * 0.95;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.spin);
    ctx.fillStyle = g.evolved.ball ? '#c4b5fd' : '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * r * 0.78, Math.sin(ang) * r * 0.78, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (g.evolved.ball) {
      ctx.strokeStyle = 'rgba(167,139,250,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return true;
  }
  return false;
}

/* Mines on the floor (a red light blinks once armed, blue when they carry
   lightning) and the evolved durian's caltrops. */
/* Effect pictures (`'pic'` fx): on the floor (the thunder mine's burst, the
   1-ton weight's impact) or, with `top`, over the bugs (the fusions' bursts,
   rings, ice and bolts). Retro, or until a picture loads: a fading ring. */
function drawPicFx(ctx: CanvasRenderingContext2D, g: Game, top: boolean) {
  for (const f of g.fx) {
    if (f.kind !== 'pic' || !f.pic || !!f.top !== top || (f.delay ?? 0) > 0) continue;
    const k = f.life / f.max;
    const pic = fxImage(f.pic);
    if (retroLook || !ready(pic)) {
      ctx.strokeStyle = `rgba(255,255,255,${0.6 * k})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * (1 - 0.4 * k), 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }
    const w = f.r * 2 * (0.7 + 0.3 * (1 - k));
    const h = (w * pic.naturalHeight) / pic.naturalWidth;
    ctx.globalAlpha = Math.min(1, k * 1.6);
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.a);
    ctx.drawImage(pic, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
function drawMines(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  drawPicFx(ctx, g, false);
  const minePics = !retroLook && ready(fxImage('mine'));
  for (const m of g.mines) {
    if (minePics) {
      const on = m.arm <= 0 && Math.floor(now * 3 + m.x) % 2 === 0;
      const pic = fxImage(m.arm > 0 ? 'mine' : g.evolved.mines ? 'mine-volt' : on ? 'mine-on' : 'mine');
      const w = g.evolved.mines && m.arm <= 0 ? 23 : 19;
      const h = (w * pic.naturalHeight) / pic.naturalWidth;
      ctx.drawImage(pic, m.x - w / 2, m.y - h / 2, w, h);
      continue;
    }
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const on = m.arm <= 0 && Math.floor(now * 3 + m.x) % 2 === 0;
    ctx.fillStyle = m.arm > 0 ? '#9ca3af' : g.evolved.mines ? (on ? '#7dd3fc' : '#0369a1') : on ? '#f87171' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const spikes = fxImage('caltrops');
  if (!retroLook && ready(spikes)) {
    const w = 15;
    const h = (w * spikes.naturalHeight) / spikes.naturalWidth;
    for (const c of g.spikes) {
      ctx.globalAlpha = Math.min(1, c.life);
      ctx.drawImage(spikes, c.x - w / 2, c.y - h / 2, w, h);
    }
    ctx.globalAlpha = 1;
    return;
  }
  ctx.fillStyle = '#9ca3af';
  for (const c of g.spikes) {
    ctx.globalAlpha = Math.min(1, c.life);
    for (let i = 0; i < 3; i++) {
      const ang = i * 2.1 + c.x;
      const x = c.x + Math.cos(ang) * 4;
      const y = c.y + Math.sin(ang) * 4;
      ctx.beginPath();
      ctx.moveTo(x, y - 3.5); ctx.lineTo(x + 3, y + 2); ctx.lineTo(x - 3, y + 2);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/* A boss's chest: the owner's painted chest, bobbing in a gold glow. */
function drawChest(ctx: CanvasRenderingContext2D, at: Vec, now: number) {
  const pic = fxImage('chest');
  const bob = Math.sin(now * 3) * 2;
  const glow = ctx.createRadialGradient(at.x, at.y, 4, at.x, at.y, 34);
  glow.addColorStop(0, `rgba(252,211,77,${0.45 + Math.sin(now * 4) * 0.12})`);
  glow.addColorStop(1, 'rgba(252,211,77,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(at.x, at.y, 34, 0, Math.PI * 2);
  ctx.fill();
  if (!retroLook && ready(pic)) {
    const w = 38;
    const h = (w * pic.naturalHeight) / pic.naturalWidth;
    ctx.drawImage(pic, at.x - w / 2, at.y - h / 2 + bob, w, h);
  } else {
    ctx.font = '26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎁', at.x, at.y + bob);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }
}

/* The laser: a cyan beam with a white core, from the hero along its angle;
   the evolved one is drawn from the gear's sweep, every frame it lasts. */
/** Beam colours (outer glow, body) as r,g,b: yellow at level 1, red from 2, purple once evolved. */
const LASER_TONE = { yellow: ['250,204,21', '253,224,71'], orange: ['249,115,22', '253,186,116'], red: ['220,38,38', '248,80,80'], purple: ['168,85,247', '216,180,254'] } as const;
const laserToneName = (g: Game) =>
  g.evolved.laser ? 'purple' : g.skills.laser >= 3 ? 'red' : g.skills.laser >= 2 ? 'orange' : 'yellow';
const laserTone = (g: Game) => LASER_TONE[laserToneName(g)];
/* The owner's beams: where, in each picture, the column's middle sits, where
   the beam strikes the floor and how wide the column is (shares of the
   picture). The column is stretched from the sky down to the bug; the
   strike below it keeps its own size. */
const LASER_PIC = { yellow: [0.525, 0.883, 0.337], orange: [0.525, 0.883, 0.337], red: [0.489, 0.884, 0.302], purple: [0.514, 0.872, 0.275] } as const;
const LASER_SPLIT = 0.7;
function drawBeams(ctx: CanvasRenderingContext2D, g: Game) {
  const tone = laserTone(g);
  const name = laserToneName(g);
  const pic = fxImage(`laser-${name}`);
  for (const f of g.fx) {
    if (f.kind !== 'beam' || (f.delay ?? 0) > 0) continue;
    const k = f.life / f.max;
    const t = 1 - k;
    const half = (f.w ?? 10) * (t < 0.15 ? t / 0.15 : 0.55 + 0.45 * k);
    if (!retroLook && ready(pic)) {
      const [cx, footY, colW] = LASER_PIC[name];
      const dw = (half * 2.8) / colW;
      const dh = (dw * pic.naturalHeight) / pic.naturalWidth;
      const foot = f.foot ?? f.y + f.r;
      const left = f.x - dw * cx;
      const sw = pic.naturalWidth;
      const split = pic.naturalHeight * LASER_SPLIT;
      // the strike, at its own size, its floor point on the bug
      const strikeTop = foot - dh * (footY - LASER_SPLIT);
      ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.drawImage(pic, 0, split, sw, pic.naturalHeight - split, left, strikeTop, dw, dh * (1 - LASER_SPLIT));
      // the column, stretched from the sky to the top of the strike
      if (strikeTop > f.y) ctx.drawImage(pic, 0, 0, sw, split, left, f.y, dw, strikeTop - f.y + 1);
      ctx.globalAlpha = 1;
      continue;
    }
    // The column from the sky: a soft glow, a bright body and a white core, top to bottom.
    for (const [w, col] of [[half * 4.2, `rgba(${tone[0]},${0.28 * k})`], [half * 2.2, `rgba(${tone[1]},${0.7 * k})`], [half * 0.7, `rgba(255,255,255,${0.95 * k})`]] as const) {
      const grad = ctx.createLinearGradient(f.x - w / 2, 0, f.x + w / 2, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.5, col);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(f.x - w / 2, f.y, w, f.r);
    }
    // Where it strikes: a flat flash on the floor.
    const foot = f.foot ?? f.y + f.r;
    const flash = ctx.createRadialGradient(f.x, foot, 0, f.x, foot, half * 3.2);
    flash.addColorStop(0, `rgba(255,255,255,${0.85 * k})`);
    flash.addColorStop(0.4, `rgba(${tone[1]},${0.55 * k})`);
    flash.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.translate(f.x, foot);
    ctx.scale(1, 0.45);
    ctx.translate(-f.x, -foot);
    ctx.fillStyle = flash;
    ctx.beginPath();
    ctx.arc(f.x, foot, half * 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* A purple magic circle on the ground: two rings, a six-pointed star and
   runes round the rim, turning. The Death Ray leaves a big one at each
   column's foot and a small one under every bug it cuts. */
function rune(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, turn: number, k: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.55); // lying on the floor
  ctx.rotate(turn);
  ctx.shadowColor = '#a855f7';
  ctx.shadowBlur = retroLook ? 0 : 12;
  ctx.strokeStyle = `rgba(216,180,254,${0.85 * k})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  // The star: two triangles.
  for (const off of [0, Math.PI / 3]) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = off + (i * Math.PI * 2) / 3 - Math.PI / 2;
      const px = Math.cos(a) * r * 0.78;
      const py = Math.sin(a) * r * 0.78;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
  // Runes between the rings.
  ctx.fillStyle = `rgba(233,213,255,${0.9 * k})`;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12;
    ctx.save();
    ctx.translate(Math.cos(a) * r * 0.89, Math.sin(a) * r * 0.89);
    ctx.rotate(a);
    ctx.fillRect(-1, -r * 0.05, 2, r * 0.1);
    if (i % 2) ctx.fillRect(-r * 0.04, -1, r * 0.08, 2);
    ctx.restore();
  }
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  glow.addColorStop(0, `rgba(168,85,247,${0.28 * k})`);
  glow.addColorStop(1, 'rgba(168,85,247,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawRunes(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  const pic = fxImage('rune');
  for (const f of g.fx) {
    if (f.kind !== 'rune') continue;
    const k = f.life / f.max;
    const r = f.r * (0.7 + 0.3 * (1 - k));
    if (!retroLook && ready(pic)) {
      // The owner's magic circle, lying on the floor and turning.
      const w = r * 2.3;
      const h = (w * pic.naturalHeight) / pic.naturalWidth;
      ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(1, 0.55);
      ctx.rotate(f.a + now * 1.5);
      ctx.drawImage(pic, -w / 2, -h / 2, w, h);
      ctx.restore();
      ctx.globalAlpha = 1;
    } else rune(ctx, f.x, f.y, r, f.a + now * 1.5, k);
  }
}

/* Burning ground from the evolved fireball: an orange pool with embers. */
/** Each arrow fusion's glow colour (the arrow and the skills list). */
export const FUSION_COLOR: Record<Fusion, string> = {
  steam: '226,232,240', plasma: '240,171,252', wisp: '94,234,212', shock: '125,211,252', frostbite: '186,230,253', spectral: '196,181,253',
};
function drawEmbers(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  for (const em of g.embers) {
    const k = em.life / em.max;
    if (em.kind === 'steam' || em.kind === 'wisp') {
      // Steam: a pale cloud swelling as it fades. Will-o'-wisp: a small blue-green flame.
      const steam = em.kind === 'steam';
      const pic = fxImage(steam ? 'steam-cloud' : 'wisp-flame');
      if (!retroLook && ready(pic)) {
        const w = steam ? em.r * 2.2 * (1.15 - 0.25 * k) : em.r * 1.9 * (0.6 + 0.4 * k);
        const h = (w * pic.naturalHeight) / pic.naturalWidth;
        ctx.globalAlpha = Math.min(1, k * 1.8) * (steam ? 0.8 : 1);
        // the flame stands on its spot; the cloud sits round it
        ctx.drawImage(pic, em.x - w / 2, steam ? em.y - h / 2 : em.y - h * 0.8, w, h);
        ctx.globalAlpha = 1;
        continue;
      }
      const r = steam ? em.r * (1.2 - 0.3 * k) : em.r * (0.6 + 0.4 * k);
      const grad = ctx.createRadialGradient(em.x, em.y, 1, em.x, em.y, r);
      grad.addColorStop(0, steam ? `rgba(248,250,252,${0.55 * k})` : `rgba(204,251,241,${0.8 * k})`);
      grad.addColorStop(0.55, steam ? `rgba(203,213,225,${0.35 * k})` : `rgba(45,212,191,${0.55 * k})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(em.x, em.y - (steam ? 0 : (1 - k) * 6), r, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    const pool = fxImage(em.r > 40 ? 'fire-pool-big' : 'fire-pool');
    if (!retroLook && ready(pool)) {
      // The owner's fire pool, turning slowly, fading in its last half second.
      const w = em.r * 2.1;
      const h = (w * pool.naturalHeight) / pool.naturalWidth;
      ctx.globalAlpha = Math.min(1, em.life * 2) * 0.72;
      ctx.save();
      ctx.translate(em.x, em.y);
      ctx.rotate(now * 0.4 + em.x);
      ctx.drawImage(pool, -w / 2, -h / 2, w, h);
      ctx.restore();
      ctx.globalAlpha = 1;
      continue;
    }
    const grad = ctx.createRadialGradient(em.x, em.y, 2, em.x, em.y, em.r);
    grad.addColorStop(0, `rgba(254,215,170,${0.55 * k})`);
    grad.addColorStop(0.5, `rgba(249,115,22,${0.45 * k})`);
    grad.addColorStop(1, 'rgba(124,45,18,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(em.x, em.y, em.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(254,243,199,${0.8 * k})`;
    for (let i = 0; i < 5; i++) {
      const a = now * 1.5 + i * 1.3 + em.x;
      const rr = em.r * (0.25 + 0.55 * ((now * 0.7 + i * 0.2) % 1));
      ctx.beginPath();
      ctx.arc(em.x + Math.cos(a) * rr, em.y + Math.sin(a) * rr - ((now * 20 + i * 7) % 12), 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* On call's health hearts: a red heart with a soft glow, bobbing, blinking
   in its last few seconds. */
function drawHearts(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  for (const h of g.hearts) {
    if (h.life < 4 && Math.floor(now * 8) % 2 === 0) continue;
    const bob = Math.sin(now * 4 + h.x) * 2;
    const s = 8 + Math.sin(now * 6 + h.y) * 0.6;
    const pic = fxImage('heart');
    if (!retroLook && ready(pic)) {
      const w = s * 3.2;
      const hh = (w * pic.naturalHeight) / pic.naturalWidth;
      ctx.drawImage(pic, h.x - w / 2, h.y + bob - hh / 2, w, hh);
      continue;
    }
    ctx.save();
    ctx.translate(h.x, h.y + bob);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, s * 2.2);
    glow.addColorStop(0, 'rgba(255,99,132,0.55)');
    glow.addColorStop(1, 'rgba(255,99,132,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, s * 2.2, 0, Math.PI * 2);
    ctx.fill();
    const fill = ctx.createLinearGradient(0, -s, 0, s);
    fill.addColorStop(0, '#ff8fa3');
    fill.addColorStop(1, '#e11d48');
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.9);
    ctx.bezierCurveTo(-s * 1.4, -s * 0.1, -s * 0.6, -s * 1.15, 0, -s * 0.4);
    ctx.bezierCurveTo(s * 0.6, -s * 1.15, s * 1.4, -s * 0.1, 0, s * 0.9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.42, -s * 0.38, s * 0.2, s * 0.12, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawGems(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  for (const gem of g.gems) {
    const big = gem.value >= 10; // the boss's (70 XP in seven) and legacy code's
    const s = big ? 6 : 4.5;
    const bob = Math.sin(now * 5 + gem.x) * 1.5;
    // The owner's green gem; the boss's big ones a size up, in a purple copy
    // of the picture (Safari has no canvas filter to tint it on the fly).
    const pic = fxImage(big ? 'gem-big' : 'gem');
    if (!retroLook && ready(pic)) {
      const h = big ? 19 : 13;
      const w = (h * pic.naturalWidth) / pic.naturalHeight;
      ctx.drawImage(pic, gem.x - w / 2, gem.y - h / 2 + bob, w, h);
      continue;
    }
    ctx.save();
    ctx.translate(gem.x, gem.y + bob);
    const grad = ctx.createLinearGradient(0, -s, 0, s);
    grad.addColorStop(0, big ? '#f5d0fe' : '#bbf7d0');
    grad.addColorStop(1, big ? '#c084fc' : '#22c55e');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.3);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s * 1.3);
    ctx.lineTo(-s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-s * 0.35, -s * 0.6, s * 0.3, s * 0.3);
    ctx.restore();
  }
}

/* The frost aura: an icy circle round the hero and snowflakes spiralling
   in towards it, turning as they go, so it reads as cold closing in. More
   flakes each level; the Blizzard (evolved) is wider, colder and thick with
   them. */
function snowflake(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, turn: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    const c = Math.cos(a) * size;
    const d = Math.sin(a) * size;
    ctx.moveTo(-c, -d);
    ctx.lineTo(c, d);
    // the little branches near each tip
    for (const k of [1, -1]) {
      const tx = c * 0.62 * k;
      const ty = d * 0.62 * k;
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + Math.cos(a + 0.7 * k) * size * 0.32 * k, ty + Math.sin(a + 0.7 * k) * size * 0.32 * k);
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + Math.cos(a - 0.7 * k) * size * 0.32 * k, ty + Math.sin(a - 0.7 * k) * size * 0.32 * k);
    }
  }
  ctx.stroke();
  ctx.restore();
}
function drawFrost(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  const p = g.player;
  const r = frostReach(g);
  const evolved = !!g.evolved.frost;
  const breathe = 1 + Math.sin(now * 2) * 0.015;
  // The cold disc: clear in the middle, frosting up towards the rim.
  const grad = ctx.createRadialGradient(p.x, p.y, r * 0.15, p.x, p.y, r);
  grad.addColorStop(0, 'rgba(186,230,253,0)');
  grad.addColorStop(0.7, `rgba(125,211,252,${evolved ? 0.14 : 0.09})`);
  grad.addColorStop(1, `rgba(186,230,253,${evolved ? 0.32 : 0.22})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * breathe, 0, Math.PI * 2);
  ctx.fill();
  // The rim: a bright frosty line and a slower dashed ring turning inside it.
  ctx.strokeStyle = `rgba(224,242,254,${evolved ? 0.75 : 0.55})`;
  ctx.lineWidth = evolved ? 2.2 : 1.6;
  if (!retroLook) { ctx.shadowColor = '#7dd3fc'; ctx.shadowBlur = 8; }
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * breathe, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(186,230,253,0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 7]);
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 0.86, now * 0.35, now * 0.35 + Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Snowflakes spiralling in: each one starts at the rim, drifts round and
  // inwards, shrinking and fading as it reaches the hero, then starts again.
  const n = (evolved ? 22 : 8) + 3 * g.skills.frost;
  ctx.strokeStyle = 'rgba(240,249,255,0.9)';
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const seed = i * 2.399;
    const t = (now * (0.22 + (i % 5) * 0.03) + i / n) % 1;
    const rad = r * (0.98 - 0.78 * t);
    const a = seed + t * 2.2 + now * 0.15;
    const size = (evolved ? 5.6 : 4.8) * (1 - 0.5 * t) * (0.8 + (i % 3) * 0.15);
    ctx.globalAlpha = Math.min(1, t * 6) * (1 - t * 0.85);
    snowflake(ctx, p.x + Math.cos(a) * rad, p.y + Math.sin(a) * rad, size, now * (i % 2 ? 1.2 : -1.2) + seed);
  }
  ctx.globalAlpha = 1;
  if (evolved) drawBlizzardFloor(ctx, p.x, p.y, r, now);
}

/* The Blizzard's floor: a great frost sigil turning slowly under the storm,
   a rim of ice crystals pointing inwards and gusts of wind whirling round. */
function drawBlizzardFloor(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, now: number) {
  ctx.save();
  ctx.lineCap = 'round';
  if (!retroLook) { ctx.shadowColor = '#7dd3fc'; ctx.shadowBlur = 10; }
  ctx.globalAlpha = 0.22 + Math.sin(now * 3) * 0.05;
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 2.4;
  snowflake(ctx, x, y, r * 0.72, now * 0.25);
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 1.4;
  snowflake(ctx, x, y, r * 0.42, -now * 0.4 + 0.5);
  // Ice crystals along the rim, a little ragged so it reads as frozen.
  const spikes = 28;
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = 'rgba(186,230,253,0.55)';
  ctx.strokeStyle = 'rgba(240,249,255,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2 + now * 0.05;
    const len = r * (0.1 + 0.07 * ((i * 7) % 3)) * (1 + Math.sin(now * 2 + i) * 0.12);
    const w = 0.07;
    ctx.moveTo(x + Math.cos(a - w) * r, y + Math.sin(a - w) * r);
    ctx.lineTo(x + Math.cos(a) * (r - len), y + Math.sin(a) * (r - len));
    ctx.lineTo(x + Math.cos(a + w) * r, y + Math.sin(a + w) * r);
  }
  ctx.fill();
  ctx.stroke();
  // Gusts: white arcs whirling round fast, fading towards their tails.
  for (let i = 0; i < 6; i++) {
    const rad = r * (0.38 + 0.11 * i);
    const head = now * (2.6 - i * 0.18) + i * 1.9;
    const len = 0.9 + (i % 3) * 0.25;
    for (let k = 0; k < 6; k++) {
      ctx.globalAlpha = 0.5 * (1 - k / 6);
      ctx.strokeStyle = '#f0f9ff';
      ctx.lineWidth = 2.2 - k * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, rad, head - (len * (k + 1)) / 6, head - (len * k) / 6);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* Over the bugs: frost on everything caught inside the aura (a snowflake
   over each one; in the Blizzard an ice crust too), and in the Blizzard ice
   shards circling the rim and snow blown round in streaks. */
function drawFrostTop(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  const p = g.player;
  const r = frostReach(g);
  const evolved = !!g.evolved.frost;
  ctx.save();
  ctx.lineCap = 'round';
  for (const e of g.enemies) {
    if (e.dead || e.spawn > 0 || Math.hypot(e.x - p.x, e.y - p.y) > r + e.r) continue;
    if (evolved) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#f0f9ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + e.id;
        ctx.moveTo(e.x + Math.cos(a) * e.r * 0.4, e.y + Math.sin(a) * e.r * 0.4);
        ctx.lineTo(e.x + Math.cos(a) * e.r * 1.05, e.y + Math.sin(a) * e.r * 1.05);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1.2;
    snowflake(ctx, e.x, e.y - e.r - 7 + Math.sin(now * 3 + e.id) * 1.5, evolved ? 4.5 : 3.5, now * 1.5 + e.id);
  }
  if (evolved) {
    // Ice shards orbiting the rim, pointing the way they fly.
    if (!retroLook) { ctx.shadowColor = '#7dd3fc'; ctx.shadowBlur = 8; }
    for (let i = 0; i < 6; i++) {
      const a = now * 1.6 + (i / 6) * Math.PI * 2;
      const rad = r * (0.9 + Math.sin(now * 2 + i) * 0.05);
      ctx.save();
      ctx.translate(p.x + Math.cos(a) * rad, p.y + Math.sin(a) * rad);
      ctx.rotate(a + Math.PI / 2);
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(0, -3.5);
      ctx.lineTo(-6, 0);
      ctx.lineTo(0, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.shadowBlur = 0;
    // Snow blown round in short streaks.
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 34; i++) {
      const t = (now * (0.5 + (i % 4) * 0.12) + i * 0.137) % 1;
      const rad = r * (0.25 + ((i * 0.618) % 1) * 0.75);
      const a = i * 2.399 + now * (1.8 + (i % 3) * 0.4);
      const sx = p.x + Math.cos(a) * rad;
      const sy = p.y + Math.sin(a) * rad;
      const tail = 0.12 + (i % 3) * 0.04;
      ctx.globalAlpha = 0.7 * Math.sin(t * Math.PI);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(p.x + Math.cos(a - tail) * rad, p.y + Math.sin(a - tail) * rad);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* Blade colours per element (see `bladeElement`): edge, base, hilt and glow. */
const BLADE_LOOK: Record<BladeElement, [string, string, string, string]> = {
  steel: ['#ffffff', '#9ca3af', '', ''],
  fire: ['#fff7ed', '#f97316', '#dc2626', 'rgba(249,115,22,0.55)'],
  ice: ['#f0f9ff', '#7dd3fc', '#0ea5e9', 'rgba(125,211,252,0.55)'],
  volt: ['#fefce8', '#93c5fd', '#facc15', 'rgba(250,204,21,0.55)'],
  shade: ['#fdf4ff', '#c084fc', '#a21caf', 'rgba(192,132,252,0.6)'],
};
/* The owner's saw blade (static/images/game/blades/<element>.webp: the steel
   one, and its red parts recoloured per element), spinning on its own axis
   as it orbits, with the element's glow behind; retro keeps the drawn
   blades. */
const sawImages = new Map<BladeElement, HTMLImageElement>();
function sawImage(el: BladeElement) {
  let img = sawImages.get(el);
  if (!img) { img = new Image(); img.src = `./images/game/blades/${el}.webp`; sawImages.set(el, img); }
  return img;
}
/** When the blades' angle last changed, so their motion trail shows only while they turn. */
const bladeSeen = { angle: NaN, at: 0 };
function drawBlades(ctx: CanvasRenderingContext2D, g: Game, accent: string) {
  const el = bladeElement(g);
  const img = sawImage(el);
  if (retroLook || !img.complete || !img.naturalWidth) { drawBladesRetro(ctx, g, accent); return; }
  const p = g.player;
  const lv = g.skills.blades;
  const n = bladeCount(lv) + (g.evolved.blades ? 2 : 0);
  const orbit = bladeOrbit(lv);
  const glow = BLADE_LOOK[el][3];
  const size = 24 * bladeScale(lv);
  const streak = glow || 'rgba(226,232,240,0.6)';
  // Motion that grows with the level: a streak along the circle, longer
  // each level, and fading copies of the blade behind it from level 3. It
  // shows only while the blades really turn: not in a cleared room, nor
  // while the run waits on a level up or the pause.
  const now = performance.now();
  if (g.gear.bladeAngle !== bladeSeen.angle) { bladeSeen.angle = g.gear.bladeAngle; bladeSeen.at = now; }
  const on = now - bladeSeen.at < 120;
  const tail = on ? 0.42 + 0.1 * (lv - 1) : 0;
  const echoes = on ? Math.max(0, lv - 2) : 0;
  // Each saw turns on itself with the orbit, so it stops when the orbit does.
  const spin = g.gear.bladeAngle * 4;
  for (let i = 0; i < n; i++) {
    const a = g.gear.bladeAngle + (i / n) * Math.PI * 2;
    if (tail) {
      ctx.save();
      ctx.strokeStyle = streak;
      ctx.lineCap = 'round';
      const steps = 6;
      for (let k = 0; k < steps; k++) {
        ctx.globalAlpha = (1 - k / steps) * 0.85;
        ctx.lineWidth = size * 0.45 * (1 - k / steps);
        ctx.beginPath();
        ctx.arc(p.x, p.y, orbit, a - (tail * (k + 1)) / steps, a - (tail * k) / steps);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (let k = echoes; k >= 1; k--) {
      const b = a - k * 0.16;
      ctx.save();
      ctx.globalAlpha = 0.32 / k;
      ctx.translate(p.x + Math.cos(b) * orbit, p.y + Math.sin(b) * orbit);
      ctx.rotate(spin + i - k * 0.5);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(p.x + Math.cos(a) * orbit, p.y + Math.sin(a) * orbit);
    if (glow) {
      const halo = ctx.createRadialGradient(0, 0, size * 0.3, 0, 0, size * 0.85);
      halo.addColorStop(0, glow);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.rotate(spin + i);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

function drawBladesRetro(ctx: CanvasRenderingContext2D, g: Game, accent: string) {
  const p = g.player;
  const lv = g.skills.blades;
  const n = bladeCount(lv) + (g.evolved.blades ? 2 : 0);
  const orbit = bladeOrbit(lv);
  const [edge, base, hilt, glow] = BLADE_LOOK[bladeElement(g)];
  for (let i = 0; i < n; i++) {
    const a = g.gear.bladeAngle + (i / n) * Math.PI * 2;
    ctx.save();
    ctx.translate(p.x + Math.cos(a) * orbit, p.y + Math.sin(a) * orbit);
    ctx.rotate(a + Math.PI / 2);
    ctx.scale(bladeScale(lv), bladeScale(lv));
    if (glow) {
      const halo = ctx.createRadialGradient(0, -3, 1, 0, -3, 14);
      halo.addColorStop(0, glow);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, -3, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    const grad = ctx.createLinearGradient(0, -11, 0, 6);
    grad.addColorStop(0, edge);
    grad.addColorStop(1, base);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(4, 3);
    ctx.lineTo(-4, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hilt || accent;
    ctx.fillRect(-5, 3, 10, 2.5);
    ctx.fillRect(-1.2, 5.5, 2.4, 4);
    ctx.restore();
  }
}

/* Painted effects cut from the owner's sheet (static/images/game/fx): the
   fireball and its two blast frames, the throwing knife and the boomerang.
   All point right; retro keeps the drawn shapes. */
const fxImages = new Map<string, HTMLImageElement>();
function fxImage(name: string) {
  let img = fxImages.get(name);
  if (!img) { img = new Image(); img.src = `./images/game/fx/${name}.webp`; fxImages.set(name, img); }
  return img;
}
const ready = (img: HTMLImageElement) => img.complete && img.naturalWidth > 0;
/** Warm the effect pictures up when a run starts, so the first swing and strike are already painted. */
export function preloadFx() {
  for (const n of ['fireball', 'boom-small', 'boom-big', 'knife', 'boomerang', 'slash', 'chest', 'slam', 'crystals', 'gem', 'gem-big', 'bolt-1', 'bolt-2', 'bolt-3', 'bolt-4', 'bolt-5', 'bolt-6',
    'brick', 'iron', 'molotov', 'barrel', 'durian', 'durian-big', 'drill', 'drill-evo', 'rocket', 'rocket-shark', 'ball', 'ball-evo',
    'fire-pool', 'fire-pool-big', 'caltrops', 'mine', 'mine-on', 'mine-volt', 'volt-burst', 'impact', 'heart', 'rune', 'crescent',
    'steam-cloud', 'plasma-burst', 'wisp-flame', 'shock-ring', 'ice-block', 'spectral-bolt', 'laser-yellow', 'laser-orange', 'laser-red', 'laser-purple', ...Array.from({ length: 7 }, (_, i) => `lava-${i}`)]) fxImage(n);
}

function drawFireballs(ctx: CanvasRenderingContext2D, g: Game) {
  const pic = fxImage('fireball');
  for (const f of g.fireballs) {
    if (!retroLook && ready(pic)) {
      // The ball sits at the picture's right end, the flames trail behind it.
      const w = 52;
      const h = (w * pic.naturalHeight) / pic.naturalWidth;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(Math.atan2(f.vy, f.vx));
      ctx.drawImage(pic, -w * 0.78, -h / 2, w, h);
      ctx.restore();
      continue;
    }
    const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 11);
    grad.addColorStop(0, '#fffbea');
    grad.addColorStop(0.35, '#ffd166');
    grad.addColorStop(0.7, '#ff7a1a');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 11, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* The spirit companion: the owner's painted ghosts (static/images/game/spirits).
   Every one, the friendly water ghost and the five element spirits, has five
   floating frames and a throw each way. All are square canvases with the body
   near the middle, the same size, drawn centred on the spirit. A skin left
   out of SPIRIT_FRAMES falls back to one picture that bobs and leans in code. */
const SPIRIT_FRAMES: Partial<Record<SpiritSkin, number>> = { water: 5, fire: 5, tide: 5, thorn: 5, volt: 5, shade: 5 };
const spiritFrames = new Map<string, HTMLImageElement>();
function spiritImage(name: string) {
  let img = spiritFrames.get(name);
  if (!img) { img = new Image(); img.src = `./images/game/spirits/${name}.webp`; spiritFrames.set(name, img); }
  return img;
}

function drawSpirits(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  if (retroLook) { drawSpiritsRetro(ctx, g, now); return; }
  const skin = g.loadout.spirit;
  const frames = SPIRIT_FRAMES[skin];
  for (const s of g.spirits) {
    const name = frames
      ? s.cast > 0 ? `${skin}-shoot-${s.dir < 0 ? 'l' : 'r'}` : `${skin}-float-${Math.floor(now * 8 + s.slot * 2) % frames}`
      : `${skin}-float-0`;
    const img = spiritImage(name);
    if (!img.complete || !img.naturalWidth) continue;
    const size = 30;
    ctx.save();
    ctx.globalAlpha = Math.min(1, s.life * 2);
    ctx.translate(s.x, s.y);
    if (!frames) {
      // One picture: a slow breath, and a lean toward the throw.
      const lean = s.cast > 0 ? s.dir * (s.cast / 0.3) * 0.25 : Math.sin(now * 2 + s.slot) * 0.06;
      ctx.rotate(lean);
      const breath = 1 + Math.sin(now * 3 + s.slot * 2) * 0.04;
      ctx.scale(s.dir < 0 ? -breath : breath, breath);
    }
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

function drawSpiritsRetro(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  for (const s of g.spirits) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.globalAlpha = Math.min(1, s.life * 2) * 0.9;
    const w = Math.sin(now * 10 + s.slot) * 1.5;
    ctx.fillStyle = '#eef2ff';
    ctx.beginPath();
    ctx.arc(0, -2, 7, Math.PI, 0);
    ctx.lineTo(7, 7);
    ctx.lineTo(3.5, 5 + w);
    ctx.lineTo(0, 7);
    ctx.lineTo(-3.5, 5 - w);
    ctx.lineTo(-7, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-3.5, -3.5, 2.2, 3);
    ctx.fillRect(1.3, -3.5, 2.2, 3);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawFx(ctx: CanvasRenderingContext2D, g: Game, accent: string, layer: 'under' | 'over') {
  for (const f of g.fx) {
    const t = 1 - f.life / f.max;
    const fade = Math.max(0, f.life / f.max);
    if (layer === 'under' && (f.kind === 'ring' || f.kind === 'strike')) {
      ctx.globalAlpha = fade;
      if (f.kind === 'ring' && !retroLook && ready(fxImage('slam'))) {
        // The owner's slam: the cracked ring spreading out (the crystal burst for the evolved hammer).
        const pic = fxImage(f.big ? 'crystals' : 'slam');
        const w = f.r * 2.3 * (0.55 + 0.45 * Math.min(1, t * 2));
        const h = (w * pic.naturalHeight) / pic.naturalWidth;
        ctx.drawImage(pic, f.x - w / 2, f.y - h * 0.62, w, h);
      } else if (f.kind === 'ring') {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 4 * fade + 1;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * (0.35 + 0.65 * t), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fill();
      } else if (!retroLook && ready(fxImage('bolt-6'))) {
        // The painted strike: a bolt frame for the first part, then the ground burst.
        const frame = t < 0.6 ? 1 + Math.floor(t * 8) % 5 : 6;
        const pic = fxImage(`bolt-${frame}`);
        const h = f.r * (frame === 6 ? 3.2 : 7.5);
        const w = (h * pic.naturalWidth) / pic.naturalHeight;
        ctx.drawImage(pic, f.x - w / 2, f.y - h + f.r * (frame === 6 ? 1.2 : 0.9), w, h);
      } else {
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 1.4);
        grad.addColorStop(0, 'rgba(255,251,224,0.9)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (layer === 'over' && f.kind === 'halo') {
      // The evolved sword: a full bright ring sweeping out.
      const r = f.r * (0.7 + 0.3 * t);
      ctx.globalAlpha = (1 - t) * 0.9;
      const grad = ctx.createRadialGradient(f.x, f.y, r * 0.55, f.x, f.y, r);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.7, 'rgba(253,230,138,0.55)');
      grad.addColorStop(1, 'rgba(252,211,77,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff7d6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r * 0.92, f.a + t * 2, f.a + t * 2 + Math.PI * 2 * (1 - t * 0.3));
      ctx.stroke();
      ctx.globalAlpha = 1;
      continue;
    }
    if (layer === 'over' && (f.kind === 'slash' || f.kind === 'boom')) {
      ctx.globalAlpha = fade;
      if (f.kind === 'slash' && (f.delay ?? 0) > 0) {
        // Not yet: the evolved sword's later cuts wait their turn.
      } else if (f.kind === 'slash' && !retroLook && ready(fxImage('slash'))) {
        // The painted crescent, turned to the swing: it sweeps out from 80% to full size as it fades.
        const pic = fxImage('slash');
        // The bulge is on the picture's right: put that at the reach, the tail behind the hero.
        const w = f.r * 1.6 * (0.8 + 0.2 * Math.min(1, t * 2));
        const h = (w * pic.naturalHeight) / pic.naturalWidth;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.a + (f.spin ?? 0) * t);
        ctx.globalAlpha = fade;
        ctx.drawImage(pic, f.r * 1.1 - w, -h / 2, w, h);
        ctx.restore();
      } else if (f.kind === 'slash') {
        // A crescent sweeping across the swing.
        const sweep = -1.15 + 2.3 * Math.min(1, t * 1.6);
        const grad = ctx.createRadialGradient(f.x, f.y, f.r * 0.45, f.x, f.y, f.r);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.7, 'rgba(255,255,255,0.35)');
        grad.addColorStop(1, '#ffffff');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, f.r, f.a - 1.15, f.a + sweep);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, f.a - 1.15, f.a + sweep);
        ctx.stroke();
      } else if (!retroLook && ready(fxImage('boom-big'))) {
        // The blast: the small frame bursting into the big one.
        const pic = fxImage(t < 0.45 ? 'boom-small' : 'boom-big');
        const w = f.r * (t < 0.45 ? 2.2 + t * 1.2 : 2.8 + t * 0.6);
        const h = (w * pic.naturalHeight) / pic.naturalWidth;
        ctx.drawImage(pic, f.x - w / 2, f.y - h / 2, w, h);
      } else {
        const r = f.r * (0.4 + 0.6 * t);
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
        grad.addColorStop(0, 'rgba(255,251,234,0.95)');
        grad.addColorStop(0.4, 'rgba(255,179,71,0.8)');
        grad.addColorStop(1, 'rgba(255,90,40,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
}

function drawOrbs(ctx: CanvasRenderingContext2D, g: Game) {
  for (const o of g.orbs) {
    const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 1.8);
    grad.addColorStop(0, '#fff3c4');
    grad.addColorStop(0.45, o.tone || '#ff6b6b');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawZaps(ctx: CanvasRenderingContext2D, g: Game) {
  ctx.lineJoin = 'round';
  for (const z of g.zaps) {
    // Storm bolts from the sky are the painted strike now; the short arcs between bugs still draw.
    const first = z.pts[0];
    const last = z.pts[z.pts.length - 1];
    if (!retroLook && Math.hypot(last.x - first.x, last.y - first.y) > 150 && ready(fxImage('bolt-6'))) continue;
    ctx.globalAlpha = Math.min(1, z.life / 0.12);
    // Bolts falling from the sky are blue, like the owner's painted ones; chain lightning between bugs is yellow.
    const sky = Math.hypot(last.x - first.x, last.y - first.y) > 150;
    ctx.shadowColor = sky ? '#38bdf8' : '#facc15';
    ctx.shadowBlur = retroLook ? 0 : 10;
    for (const [width, color] of (sky ? [[6, 'rgba(56,189,248,0.45)'], [2.2, '#e0f2fe']] : [[6, 'rgba(250,204,21,0.45)'], [2.2, '#fef9c3']]) as [number, string][]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      z.pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  // Without this the yellow glow leaks onto everything drawn after (walls, bugs, the hero).
  ctx.shadowBlur = 0;
}

/* Boss attacks (see `Threat` in world.ts): while warning, a faint area that fills up as the hit comes; then
   the hit itself. Circles and lines are drawn under the bugs, live beams and waves over them. */
const THREAT_TONE: Record<Threat['el'], [string, string]> = {
  fire: ['249,115,22', '254,215,170'], water: ['56,189,248', '224,242,254'], leaf: ['74,222,128', '220,252,231'],
  bolt: ['250,204,21', '254,249,195'], laser: ['239,68,68', '254,226,226'], shadow: ['167,139,250', '237,233,254'], glitch: ['192,132,252', '243,232,255'],
};
function drawThreats(ctx: CanvasRenderingContext2D, g: Game, now: number, top: boolean) {
  for (const t of g.threats) {
    const live = t.warn <= 0;
    if (top !== (live && (t.kind === 'beam' || t.kind === 'wave'))) continue;
    const [c, light] = THREAT_TONE[t.el];
    const k = live ? 1 : 1 - t.warn / (t.max || 1);
    ctx.save();
    if (t.kind === 'circle') {
      if (!live) {
        ctx.fillStyle = `rgba(${c},0.12)`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${c},0.3)`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r * k, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(${c},${0.55 + Math.sin(now * 18) * 0.25})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.globalAlpha = Math.min(1, t.life / 0.2);
        const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r);
        grad.addColorStop(0, `rgba(${light},0.95)`);
        grad.addColorStop(0.6, `rgba(${c},0.75)`);
        grad.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r * 1.15, 0, Math.PI * 2);
        ctx.fill();
        if (t.el === 'leaf') {
          // Roots: thorny spikes out of the floor.
          ctx.fillStyle = '#166534';
          for (let i = 0; i < 5; i++) {
            const a = i * 1.26 + t.x * 0.1;
            const bx = t.x + Math.cos(a) * t.r * 0.4;
            const by = t.y + Math.sin(a) * t.r * 0.3;
            ctx.beginPath();
            ctx.moveTo(bx - 4, by + 4);
            ctx.lineTo(bx, by - t.r * 0.9);
            ctx.lineTo(bx + 4, by + 4);
            ctx.fill();
          }
        }
      }
    } else if (t.kind === 'line' || t.kind === 'beam') {
      ctx.translate(t.x, t.y);
      ctx.rotate(t.a);
      if (!live) {
        ctx.fillStyle = `rgba(${c},${0.1 + k * 0.15})`;
        ctx.fillRect(0, -t.r, t.len, t.r * 2);
        ctx.strokeStyle = `rgba(${c},${0.5 + Math.sin(now * 20) * 0.25})`;
        ctx.lineWidth = t.kind === 'beam' ? 1.5 : 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(t.len, 0);
        ctx.stroke();
      } else {
        const flick = t.kind === 'beam' ? 0.85 + Math.sin(now * 40) * 0.15 : Math.min(1, t.life / 0.18);
        if (!retroLook) { ctx.shadowColor = `rgb(${c})`; ctx.shadowBlur = 16; }
        ctx.fillStyle = `rgba(${c},${0.7 * flick})`;
        ctx.fillRect(0, -t.r * 1.3, t.len, t.r * 2.6);
        ctx.fillStyle = `rgba(${light},${flick})`;
        ctx.fillRect(0, -t.r * 0.45, t.len, t.r * 0.9);
        if (t.kind === 'beam') {
          ctx.fillStyle = `rgba(${light},0.9)`;
          ctx.beginPath();
          ctx.arc(0, 0, t.r * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (t.kind === 'wave') {
      const gap = t.gap ?? 0;
      const gapW = t.gapW ?? 0;
      if (!live) {
        // The edge it comes from, with the gap marked.
        ctx.strokeStyle = `rgba(${c},${0.5 + Math.sin(now * 16) * 0.3})`;
        ctx.lineWidth = 5;
        for (const [from, to] of [[-t.len, gap - gapW], [gap + gapW, t.len]]) {
          const a = waveAt(t, from);
          const b = waveAt(t, to);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      } else {
        // The wall of water: a band with a white crest, split where the gap is.
        for (const [from, to] of [[-t.len, gap - gapW], [gap + gapW, t.len]]) {
          if (to <= from) continue;
          const a = waveAt(t, from);
          const b = waveAt(t, to);
          const nx = Math.cos(t.a) * t.r;
          const ny = Math.sin(t.a) * t.r;
          const grad = ctx.createLinearGradient(a.x - nx, a.y - ny, a.x + nx, a.y + ny);
          grad.addColorStop(0, `rgba(${c},0.15)`);
          grad.addColorStop(0.6, `rgba(${c},0.85)`);
          grad.addColorStop(1, `rgba(${light},0.95)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(a.x - nx * 1.6, a.y - ny * 1.6);
          ctx.lineTo(b.x - nx * 1.6, b.y - ny * 1.6);
          ctx.lineTo(b.x + nx, b.y + ny);
          ctx.lineTo(a.x + nx, a.y + ny);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, now: number) {
  // A boss off the floor: its shadow grows where it will land.
  if (e.spawn > 0 && e.vanish) {
    const slam = e.land === 'slam';
    const k = 1 - Math.min(1, e.spawn / (slam ? 1.1 : 0.9));
    const tone = slam ? '134,239,172' : '167,139,250';
    ctx.fillStyle = `rgba(0,0,0,${0.15 + k * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + e.r * 0.6, e.r * (0.5 + k * 0.5), e.r * (0.18 + k * 0.17), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(${tone},${0.5 + Math.sin(now * 20) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(e.x, e.y, slam ? 66 : e.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(${tone},0.18)`;
    ctx.beginPath();
    ctx.arc(e.x, e.y, (slam ? 66 : e.r) * k, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  // Warning circle while it spawns.
  if (e.spawn > 0) {
    ctx.strokeStyle = 'rgba(255,107,107,0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r * (1 + e.spawn * 0.6), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + e.r * 0.85, e.r * 0.9, e.r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(e.x, e.y);
  // Later worlds: an aura in the world's element colour.
  if (e.tint) {
    const aura = ctx.createRadialGradient(0, 0, e.r * 0.5, 0, 0, e.r * 1.5);
    aura.addColorStop(0, e.tint + '55');
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, e.r * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // The world's final boss: a crown of light turning round it (its clones wear it too, to fool you).
  if (e.final) {
    const tone = e.tint || '#fcd34d';
    ctx.save();
    ctx.rotate(now * 0.8);
    ctx.strokeStyle = tone;
    ctx.globalAlpha = 0.55 + Math.sin(now * 3) * 0.15;
    ctx.lineWidth = 2.5;
    if (!retroLook) { ctx.shadowColor = tone; ctx.shadowBlur = 12; }
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, e.r * 1.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * e.r * 1.25, Math.sin(a) * e.r * 1.25);
      ctx.lineTo(Math.cos(a) * e.r * 1.45, Math.sin(a) * e.r * 1.45);
      ctx.stroke();
    }
    ctx.restore();
  }
  // Clones flicker now and then, very slightly.
  if (e.clone && Math.sin(now * 13 + e.id) > 0.93) ctx.globalAlpha = 0.6;
  if (e.kind === 'boss' && e.aim > 0) {
    // Telegraph the charge, whatever the boss looks like.
    ctx.strokeStyle = `rgba(255,107,107,${0.35 + Math.sin(now * 30) * 0.2})`;
    ctx.lineWidth = e.r * 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(e.dir.x * 260, e.dir.y * 260);
    ctx.stroke();
  }
  if (!retroLook && drawEnemySprite(ctx, e, now)) { /* painted */ } else LOOKS[e.look][e.kind](ctx, e, now);
  // Status: white flash on hit, blue tint when slowed, little flames when burning.
  if (e.hit > 0) {
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, e.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (e.slow > 0) {
    ctx.strokeStyle = 'rgba(122,216,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.r + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (e.burn > 0) {
    ctx.fillStyle = '#ff9a1f';
    for (let i = 0; i < 3; i++) {
      const a = now * 4 + i * 2.1;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * e.r * 0.6, -e.r * 0.6 + Math.sin(a * 1.3) * 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  if (e.hp < e.maxHp && e.kind !== 'boss') {
    const w = e.r * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(e.x - w / 2, e.y - e.r - 9, w, 3.5);
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(e.x - w / 2, e.y - e.r - 9, (w * Math.max(0, e.hp)) / e.maxHp, 3.5);
  }
}

function drawBug(ctx: CanvasRenderingContext2D, e: Enemy, now: number) {
  const r = e.r;
  const step = Math.sin(now * 18 + e.id) * 2;
  ctx.strokeStyle = '#3a1416';
  ctx.lineWidth = 2;
  for (const side of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.5, i * r * 0.45);
      ctx.lineTo(side * (r + 4), i * r * 0.6 + (i === 0 ? step : -step) * side);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(side * r * 0.25, -r * 0.8);
    ctx.lineTo(side * r * 0.6, -r * 1.35);
    ctx.stroke();
  }
  const shell = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 1, 0, 0, r);
  shell.addColorStop(0, '#ff9b9b');
  shell.addColorStop(1, '#c0303a');
  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.8, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.55);
  ctx.lineTo(0, r);
  ctx.stroke();
  ctx.fillStyle = '#2a0e10';
  ctx.beginPath();
  ctx.arc(0, -r * 0.65, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(-r * 0.25, -r * 0.75, 2.4, 2.4);
  ctx.fillRect(r * 0.12, -r * 0.75, 2.4, 2.4);
}

function drawTicket(ctx: CanvasRenderingContext2D, e: Enemy) {
  const r = e.r;
  ctx.rotate(Math.sin(e.wobble * 0.5) * 0.15);
  ctx.fillStyle = '#fff1c2';
  roundRect(ctx, -r * 0.85, -r, r * 1.7, r * 2, 3);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(-r * 0.85, -r, r * 1.7, r * 0.45);
  ctx.fillStyle = 'rgba(80,60,20,0.45)';
  for (let i = 0; i < 3; i++) ctx.fillRect(-r * 0.55, -r * 0.25 + i * r * 0.42, r * (i === 2 ? 0.7 : 1.1), 2);
  ctx.fillStyle = '#d64545';
  ctx.font = `bold ${Math.round(r)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('!', r * 0.45, r * 0.85);
}

function drawLegacy(ctx: CanvasRenderingContext2D, e: Enemy) {
  const r = e.r;
  const grad = ctx.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, '#9aa3b2');
  grad.addColorStop(1, '#5a6272');
  ctx.fillStyle = grad;
  roundRect(ctx, -r, -r, r * 2, r * 2, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1.5;
  for (const y of [-r / 3, r / 3]) { ctx.beginPath(); ctx.moveTo(-r, y); ctx.lineTo(r, y); ctx.stroke(); }
  ctx.fillStyle = '#1e2430';
  ctx.font = `bold ${Math.round(r * 0.75)}px ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('</>', 0, 1);
  ctx.textBaseline = 'alphabetic';
}

function drawBoss(ctx: CanvasRenderingContext2D, e: Enemy, now: number) {
  const r = e.r;
  const glow = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.6);
  glow.addColorStop(0, 'rgba(192,132,252,0.35)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createLinearGradient(0, -r, 0, r);
  body.addColorStop(0, '#3b3150');
  body.addColorStop(1, '#16121f');
  ctx.fillStyle = body;
  roundRect(ctx, -r * 0.8, -r * 1.1, r * 1.6, r * 2.2, 10);
  ctx.fill();
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 2;
  ctx.stroke();
  const blink = Math.sin(now * 2.3) > 0.95 ? 0.2 : 1;
  ctx.fillStyle = e.dash > 0 || e.aim > 0 ? '#ff6b6b' : '#e9d5ff';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * r * 0.32, -r * 0.35, r * 0.14, r * 0.14 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(192,132,252,0.5)';
  for (let i = 0; i < 4; i++) ctx.fillRect(-r * 0.5, r * 0.05 + i * r * 0.22, r, 3);
}

/* ------------------------------------------------------------ enemy looks */

type Drawer = (ctx: CanvasRenderingContext2D, e: Enemy, now: number) => void;

/** Red glowing eyes, used by several looks. */
function eyes(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color = '#ff4d4d') {
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function horns(ctx: CanvasRenderingContext2D, r: number, color: string, spread = 0.55, length = 0.9) {
  ctx.fillStyle = color;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * (spread - 0.2), -r * 0.6);
    ctx.quadraticCurveTo(side * r * (spread + 0.5), -r * 1.1, side * r * spread, -r * (0.6 + length));
    ctx.lineTo(side * r * (spread + 0.2), -r * 0.55);
    ctx.closePath();
    ctx.fill();
  }
}

/* Demon: imps, flaming skulls, gargoyles and an overlord. */
const demonImp: Drawer = (ctx, e, now) => {
  const r = e.r;
  const flap = Math.sin(now * 14 + e.id) * 0.4;
  ctx.fillStyle = '#4a0f1a';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.5, -r * 0.1);
    ctx.lineTo(side * r * (1.5 + flap * 0.4), -r * (0.9 + flap));
    ctx.lineTo(side * r * 1.6, r * 0.2);
    ctx.closePath();
    ctx.fill();
  }
  // Tail with a spade tip.
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.7);
  ctx.quadraticCurveTo(r * 0.9, r * 1.3, r * 1.4 + flap * 3, r * 0.8);
  ctx.stroke();
  const body = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
  body.addColorStop(0, '#b91c1c');
  body.addColorStop(1, '#4a0f1a');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  horns(ctx, r, '#2b0a10', 0.45, 0.7);
  eyes(ctx, r * 0.35, -r * 0.15, r * 0.17, '#fde047');
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, r * 0.3, r * 0.4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
};

const demonSkull: Drawer = (ctx, e, now) => {
  const r = e.r;
  // Flames on top.
  for (let i = -1; i <= 1; i++) {
    const h = r * (1.1 + 0.3 * Math.sin(now * 12 + i * 2 + e.id));
    const grad = ctx.createLinearGradient(0, -r * 0.6, 0, -r * 0.6 - h);
    grad.addColorStop(0, '#fb923c');
    grad.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(i * r * 0.45 - r * 0.3, -r * 0.5);
    ctx.quadraticCurveTo(i * r * 0.45 + Math.sin(now * 9 + i) * 3, -r * 0.6 - h, i * r * 0.45 + r * 0.3, -r * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#e7e5e4';
  ctx.beginPath();
  ctx.arc(0, -r * 0.1, r * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-r * 0.5, r * 0.4, r, r * 0.45);
  ctx.fillStyle = '#1c1917';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * r * 0.35, -r * 0.15, r * 0.24, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  eyes(ctx, r * 0.35, -r * 0.15, r * 0.09);
  ctx.fillStyle = '#1c1917';
  for (let i = -1; i <= 1; i++) ctx.fillRect(i * r * 0.28 - 1, r * 0.45, 2, r * 0.35);
};

const demonGargoyle: Drawer = (ctx, e, now) => {
  const r = e.r;
  const grad = ctx.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, '#3f3f46');
  grad.addColorStop(1, '#18181b');
  ctx.fillStyle = grad;
  roundRect(ctx, -r, -r, r * 2, r * 2, 5);
  ctx.fill();
  horns(ctx, r, '#27272a', 0.6, 0.6);
  // Cracks that glow with the fire inside.
  ctx.strokeStyle = `rgba(249,115,22,${0.6 + Math.sin(now * 6) * 0.3})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, r * 0.9);
  ctx.lineTo(-r * 0.3, r * 0.2);
  ctx.lineTo(-r * 0.5, -r * 0.3);
  ctx.moveTo(r * 0.7, r * 0.6);
  ctx.lineTo(r * 0.3, 0);
  ctx.lineTo(r * 0.5, -r * 0.7);
  ctx.stroke();
  eyes(ctx, r * 0.35, -r * 0.25, r * 0.13, '#fb923c');
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-r * 0.5, r * 0.3, r, r * 0.2);
};

const demonOverlord: Drawer = (ctx, e, now) => {
  const r = e.r;
  const glow = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.7);
  glow.addColorStop(0, 'rgba(239,68,68,0.35)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
  ctx.fill();
  const flap = Math.sin(now * 5) * 0.2;
  ctx.fillStyle = '#2b0a10';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.6, -r * 0.3);
    ctx.lineTo(side * r * 1.9, -r * (1.3 + flap));
    ctx.lineTo(side * r * 2.0, -r * 0.2);
    ctx.lineTo(side * r * 1.6, r * 0.3);
    ctx.closePath();
    ctx.fill();
  }
  const body = ctx.createLinearGradient(0, -r, 0, r);
  body.addColorStop(0, '#7f1d1d');
  body.addColorStop(1, '#3b0a12');
  ctx.fillStyle = body;
  roundRect(ctx, -r * 0.85, -r * 1.05, r * 1.7, r * 2.15, 14);
  ctx.fill();
  horns(ctx, r * 1.1, '#1c0509', 0.5, 1.1);
  eyes(ctx, r * 0.32, -r * 0.45, r * 0.13, e.dash > 0 || e.aim > 0 ? '#fde047' : '#ff4d4d');
  // Grin.
  ctx.fillStyle = '#09090b';
  roundRect(ctx, -r * 0.5, r * 0.05, r, r * 0.3, 4);
  ctx.fill();
  ctx.fillStyle = '#f5f5f4';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.45 + i * r * 0.18, r * 0.05);
    ctx.lineTo(-r * 0.36 + i * r * 0.18, r * 0.25);
    ctx.lineTo(-r * 0.27 + i * r * 0.18, r * 0.05);
    ctx.fill();
  }
};

/* Greek: gladiators, javelin throwers, a shield wall and a minotaur. */
function helmet(ctx: CanvasRenderingContext2D, r: number, crest: string) {
  ctx.fillStyle = crest;
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, -r * 0.9);
  ctx.quadraticCurveTo(0, -r * 1.9, r * 0.2, -r * 0.9);
  ctx.closePath();
  ctx.fill();
  const bronze = ctx.createLinearGradient(-r, 0, r, 0);
  bronze.addColorStop(0, '#f1c27d');
  bronze.addColorStop(0.5, '#b7791f');
  bronze.addColorStop(1, '#7c4a03');
  ctx.fillStyle = bronze;
  ctx.beginPath();
  ctx.arc(0, -r * 0.3, r * 0.75, Math.PI, 0);
  ctx.lineTo(r * 0.75, r * 0.4);
  ctx.lineTo(-r * 0.75, r * 0.4);
  ctx.closePath();
  ctx.fill();
  // The T-shaped face opening.
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-r * 0.4, -r * 0.35, r * 0.8, r * 0.22);
  ctx.fillRect(-r * 0.1, -r * 0.35, r * 0.2, r * 0.7);
}

const greekGladiator: Drawer = (ctx, e, now) => {
  const r = e.r;
  const step = Math.sin(now * 12 + e.id) * 2;
  // Round shield on the left, short sword on the right.
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.arc(-r * 0.9, r * 0.2 + step, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f1c27d';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = '#f1c27d';
  ctx.beginPath();
  ctx.arc(-r * 0.9, r * 0.2 + step, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(r * 0.8, r * 0.3 - step);
  ctx.lineTo(r * 1.5, -r * 0.6 - step);
  ctx.stroke();
  ctx.fillStyle = '#b45309';
  roundRect(ctx, -r * 0.6, r * 0.1, r * 1.2, r * 0.9, 3);
  ctx.fill();
  helmet(ctx, r, '#dc2626');
};

const greekHoplite: Drawer = (ctx, e, now) => {
  const r = e.r;
  const arm = Math.sin(e.wobble * 0.5) * 0.2;
  // Long spear, raised to throw.
  ctx.save();
  ctx.rotate(-0.6 + arm);
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 1.4, r * 0.3);
  ctx.lineTo(r * 1.6, r * 0.3);
  ctx.stroke();
  ctx.fillStyle = '#e5e7eb';
  ctx.beginPath();
  ctx.moveTo(r * 1.6, r * 0.3);
  ctx.lineTo(r * 2.1, r * 0.3);
  ctx.lineTo(r * 1.6, r * 0.05);
  ctx.lineTo(r * 1.6, r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#1e3a8a';
  roundRect(ctx, -r * 0.6, r * 0.1, r * 1.2, r * 0.9, 3);
  ctx.fill();
  helmet(ctx, r, '#1d4ed8');
  void now;
};

const greekShieldWall: Drawer = (ctx, e, now) => {
  const r = e.r;
  const bronze = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
  bronze.addColorStop(0, '#fcd9a0');
  bronze.addColorStop(0.6, '#b7791f');
  bronze.addColorStop(1, '#6b3f06');
  ctx.fillStyle = bronze;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  // Greek key ring.
  ctx.strokeStyle = '#3f2a0a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.6, now * 0.5, now * 0.5 + Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#3f2a0a';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  // Spear tips peeking over the top.
  ctx.fillStyle = '#e5e7eb';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.5, -r * 1.35);
    ctx.lineTo(i * r * 0.5 - 3, -r * 0.95);
    ctx.lineTo(i * r * 0.5 + 3, -r * 0.95);
    ctx.closePath();
    ctx.fill();
  }
};

const greekMinotaur: Drawer = (ctx, e, now) => {
  const r = e.r;
  const glow = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.6);
  glow.addColorStop(0, 'rgba(234,88,12,0.3)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Big shoulders and chest.
  const hide = ctx.createLinearGradient(0, -r, 0, r);
  hide.addColorStop(0, '#78350f');
  hide.addColorStop(1, '#3f1d0a');
  ctx.fillStyle = hide;
  roundRect(ctx, -r * 1.0, -r * 0.5, r * 2, r * 1.6, 16);
  ctx.fill();
  // Bull head.
  ctx.fillStyle = '#5b2a0b';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.55, r * 0.6, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Horns, long and curved.
  ctx.strokeStyle = '#f5f5f4';
  ctx.lineWidth = r * 0.16;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.45, -r * 0.9);
    ctx.quadraticCurveTo(side * r * 1.3, -r * 1.2, side * r * 1.1, -r * 1.9);
    ctx.stroke();
  }
  eyes(ctx, r * 0.25, -r * 0.7, r * 0.1, e.dash > 0 || e.aim > 0 ? '#fde047' : '#ff4d4d');
  // Snout with a ring.
  ctx.fillStyle = '#3f1d0a';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.2, r * 0.38, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f1c27d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -r * 0.02, r * 0.14, 0, Math.PI);
  ctx.stroke();
  // Steam from the nostrils when charging.
  if (e.aim > 0) {
    ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(now * 20) * 0.2})`;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * r * 0.2, -r * 0.1 + Math.sin(now * 15) * 2, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

/* Nightmare: zombies, skeletons, tombstones and a lich. */
const nightmareZombie: Drawer = (ctx, e, now) => {
  const r = e.r;
  const sway = Math.sin(now * 4 + e.id) * 0.1;
  ctx.rotate(sway);
  // Arms held out in front.
  ctx.strokeStyle = '#4d7c0f';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.5, r * 0.2);
    ctx.lineTo(side * r * 0.7, r * 1.4 + Math.sin(now * 6 + side) * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#365314';
  roundRect(ctx, -r * 0.65, r * 0.1, r * 1.3, r * 0.9, 3);
  ctx.fill();
  const skin = ctx.createRadialGradient(-r * 0.3, -r * 0.5, 1, 0, -r * 0.2, r);
  skin.addColorStop(0, '#a3e635');
  skin.addColorStop(1, '#4d7c0f');
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -r * 0.25, r * 0.75, 0, Math.PI * 2);
  ctx.fill();
  // One eye wide, one squinting; a stitched mouth.
  ctx.fillStyle = '#f7fee7';
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.35, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a2e05';
  ctx.beginPath();
  ctx.arc(-r * 0.28, -r * 0.33, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(r * 0.1, -r * 0.4, r * 0.35, r * 0.1);
  ctx.strokeStyle = '#1a2e05';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-r * 0.35, r * 0.1);
  ctx.lineTo(r * 0.35, r * 0.05);
  for (let i = -2; i <= 2; i++) { ctx.moveTo(i * r * 0.15, -r * 0.02); ctx.lineTo(i * r * 0.15, r * 0.18); }
  ctx.stroke();
};

const nightmareSkeleton: Drawer = (ctx, e, now) => {
  const r = e.r;
  ctx.strokeStyle = '#e7e5e4';
  ctx.lineWidth = 2;
  // Ribs.
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, r * 0.25 + i * r * 0.25, r * 0.45, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, r * 0.1);
  ctx.lineTo(0, r);
  ctx.stroke();
  // Throwing arm with a bone.
  const arm = Math.sin(e.wobble * 0.6) * 0.5;
  ctx.save();
  ctx.translate(r * 0.6, r * 0.3);
  ctx.rotate(-0.8 + arm);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(r * 0.9, -r * 0.2);
  ctx.stroke();
  ctx.fillStyle = '#e7e5e4';
  ctx.beginPath();
  ctx.arc(r * 0.9, -r * 0.25, 2.2, 0, Math.PI * 2);
  ctx.arc(r * 0.95, -r * 0.1, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Skull.
  ctx.fillStyle = '#f5f5f4';
  ctx.beginPath();
  ctx.arc(0, -r * 0.35, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-r * 0.35, -r * 0.05, r * 0.7, r * 0.3);
  ctx.fillStyle = '#1c1917';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * r * 0.25, -r * 0.4, r * 0.17, 0, Math.PI * 2);
    ctx.fill();
  }
  eyes(ctx, r * 0.25, -r * 0.4, r * 0.06, '#67e8f9');
  for (let i = -1; i <= 1; i++) ctx.fillRect(i * r * 0.2 - 1, r * 0.02, 2, r * 0.22);
  void now;
};

const nightmareTombstone: Drawer = (ctx, e, now) => {
  const r = e.r;
  // Grave mound and a wisp.
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.85, r * 1.1, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  const stone = ctx.createLinearGradient(0, -r, 0, r);
  stone.addColorStop(0, '#6b7280');
  stone.addColorStop(1, '#374151');
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.arc(0, -r * 0.35, r * 0.75, Math.PI, 0);
  ctx.lineTo(r * 0.75, r * 0.9);
  ctx.lineTo(-r * 0.75, r * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#111827';
  ctx.fillRect(-r * 0.08, -r * 0.6, r * 0.16, r * 0.8);
  ctx.fillRect(-r * 0.32, -r * 0.35, r * 0.64, r * 0.14);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, r * 0.6);
  ctx.lineTo(-r * 0.2, r * 0.3);
  ctx.lineTo(-r * 0.35, 0);
  ctx.stroke();
  const wisp = Math.sin(now * 3 + e.id);
  ctx.fillStyle = `rgba(167,243,208,${0.35 + wisp * 0.2})`;
  ctx.beginPath();
  ctx.arc(r * 0.7, -r * 0.9 + wisp * 4, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
};

const nightmareLich: Drawer = (ctx, e, now) => {
  const r = e.r;
  const glow = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.7);
  glow.addColorStop(0, 'rgba(34,211,238,0.3)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
  ctx.fill();
  // Tattered robe.
  const robe = ctx.createLinearGradient(0, -r, 0, r);
  robe.addColorStop(0, '#312e81');
  robe.addColorStop(1, '#0f0a2e');
  ctx.fillStyle = robe;
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.3);
  ctx.lineTo(r * 0.6, -r * 0.3);
  ctx.lineTo(r * 1.0, r * 1.1);
  for (let i = 4; i >= -4; i--) ctx.lineTo(i * r * 0.22, r * (1.1 - (Math.abs(i) % 2) * 0.2 + Math.sin(now * 4 + i) * 0.04));
  ctx.lineTo(-r * 1.0, r * 1.1);
  ctx.closePath();
  ctx.fill();
  // Skull with a crown.
  ctx.fillStyle = '#e7e5e4';
  ctx.beginPath();
  ctx.arc(0, -r * 0.55, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-r * 0.32, -r * 0.25, r * 0.64, r * 0.3);
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, -r * 0.9);
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(-r * 0.55 + i * r * 0.275, -r * (1.4 + (i % 2) * 0.2));
    ctx.lineTo(-r * 0.4125 + i * r * 0.275, -r * 1.05);
  }
  ctx.lineTo(r * 0.55, -r * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0f0a2e';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * r * 0.22, -r * 0.6, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  eyes(ctx, r * 0.22, -r * 0.6, r * 0.07, e.dash > 0 || e.aim > 0 ? '#f472b6' : '#22d3ee');
  for (let i = -1; i <= 1; i++) ctx.fillRect(i * r * 0.15 - 1, -r * 0.22, 2, r * 0.2);
  // Staff with a floating gem.
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(r * 0.95, r * 0.9);
  ctx.lineTo(r * 0.95, -r * 1.2);
  ctx.stroke();
  ctx.fillStyle = '#22d3ee';
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(r * 0.95, -r * 1.4 + Math.sin(now * 3) * 3, r * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
};

/* Vikings: raiders from the sea, axe throwers, a shield wall and the Jarl. */
function hornedHelm(ctx: CanvasRenderingContext2D, r: number, y: number) {
  ctx.fillStyle = '#e7e5e4';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.55, y - r * 0.1);
    ctx.quadraticCurveTo(side * r * 1.05, y - r * 0.4, side * r * 0.85, y - r * 1.05);
    ctx.lineTo(side * r * 0.6, y - r * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  const iron = ctx.createLinearGradient(-r, 0, r, 0);
  iron.addColorStop(0, '#9ca3af');
  iron.addColorStop(1, '#4b5563');
  ctx.fillStyle = iron;
  ctx.beginPath();
  ctx.arc(0, y, r * 0.65, Math.PI, 0);
  ctx.lineTo(r * 0.65, y + r * 0.1);
  ctx.lineTo(-r * 0.65, y + r * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#374151';
  ctx.fillRect(-r * 0.08, y - r * 0.1, r * 0.16, r * 0.45);
}

function beard(ctx: CanvasRenderingContext2D, r: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, y);
  ctx.quadraticCurveTo(0, y + r * 1.0, r * 0.5, y);
  ctx.closePath();
  ctx.fill();
}

const vikingRaider: Drawer = (ctx, e, now) => {
  const r = e.r;
  const step = Math.sin(now * 12 + e.id) * 2;
  // Axe raised on the right, round shield on the left.
  ctx.save();
  ctx.translate(r * 0.9, -r * 0.2 - step);
  ctx.rotate(-0.5 + Math.sin(now * 6) * 0.2);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.8);
  ctx.lineTo(0, -r * 0.6);
  ctx.stroke();
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.7);
  ctx.quadraticCurveTo(r * 0.7, -r * 0.6, r * 0.5, 0);
  ctx.lineTo(0, -r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.arc(-r * 0.9, r * 0.2 + step, r * 0.58, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, r * 0.2 + step);
    ctx.lineTo(-r * 0.9 + Math.cos(i * Math.PI / 2) * r * 0.58, r * 0.2 + step + Math.sin(i * Math.PI / 2) * r * 0.58);
    ctx.stroke();
  }
  ctx.fillStyle = '#1e3a8a';
  roundRect(ctx, -r * 0.6, r * 0.05, r * 1.2, r * 0.95, 3);
  ctx.fill();
  ctx.fillStyle = '#92400e';
  ctx.fillRect(-r * 0.6, r * 0.5, r * 1.2, r * 0.12);
  ctx.fillStyle = '#f5d0b0';
  ctx.beginPath();
  ctx.arc(0, -r * 0.3, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  beard(ctx, r, -r * 0.05, '#d97706');
  hornedHelm(ctx, r, -r * 0.45);
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-r * 0.3, -r * 0.4, r * 0.16, r * 0.16);
  ctx.fillRect(r * 0.14, -r * 0.4, r * 0.16, r * 0.16);
};

const vikingThrower: Drawer = (ctx, e) => {
  const r = e.r;
  const arm = Math.sin(e.wobble * 0.6) * 0.5;
  // A hand axe about to fly.
  ctx.save();
  ctx.translate(r * 0.8, -r * 0.1);
  ctx.rotate(-1.2 + arm);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.6);
  ctx.lineTo(0, -r * 0.5);
  ctx.stroke();
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(-r * 0.05, -r * 0.55);
  ctx.quadraticCurveTo(r * 0.55, -r * 0.5, r * 0.4, -r * 0.05);
  ctx.lineTo(-r * 0.05, -r * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#365314';
  roundRect(ctx, -r * 0.6, r * 0.05, r * 1.2, r * 0.95, 3);
  ctx.fill();
  ctx.fillStyle = '#f5d0b0';
  ctx.beginPath();
  ctx.arc(0, -r * 0.3, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  beard(ctx, r, -r * 0.05, '#7c2d12');
  // Braids instead of a helmet.
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.4, -r * 0.6);
    ctx.lineTo(side * r * 0.65, r * 0.2);
    ctx.stroke();
  }
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath();
  ctx.arc(0, -r * 0.5, r * 0.55, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-r * 0.3, -r * 0.4, r * 0.16, r * 0.16);
  ctx.fillRect(r * 0.14, -r * 0.4, r * 0.16, r * 0.16);
};

const vikingShieldWall: Drawer = (ctx, e, now) => {
  const r = e.r;
  // Three overlapping painted round shields.
  const colors = ['#b91c1c', '#1d4ed8', '#ca8a04'];
  for (let i = -1; i <= 1; i++) {
    const cx = i * r * 0.55;
    const cy = Math.abs(i) * r * 0.15;
    ctx.fillStyle = colors[i + 1];
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.7, cy);
    ctx.lineTo(cx + r * 0.7, cy);
    ctx.moveTo(cx, cy - r * 0.7);
    ctx.lineTo(cx, cy + r * 0.7);
    ctx.stroke();
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  // Spear tips and horns over the top.
  ctx.fillStyle = '#e7e5e4';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.55, -r * 1.25 + Math.sin(now * 3 + i) * 2);
    ctx.lineTo(i * r * 0.55 - 3, -r * 0.8);
    ctx.lineTo(i * r * 0.55 + 3, -r * 0.8);
    ctx.closePath();
    ctx.fill();
  }
};

const vikingJarl: Drawer = (ctx, e, now) => {
  const r = e.r;
  const glow = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.6);
  glow.addColorStop(0, 'rgba(56,189,248,0.3)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Fur cloak, chainmail, a great two-handed axe.
  ctx.fillStyle = '#44403c';
  ctx.beginPath();
  ctx.moveTo(-r * 1.1, -r * 0.4);
  ctx.lineTo(r * 1.1, -r * 0.4);
  ctx.lineTo(r * 0.9, r * 1.1);
  ctx.lineTo(-r * 0.9, r * 1.1);
  ctx.closePath();
  ctx.fill();
  const mail = ctx.createLinearGradient(0, -r, 0, r);
  mail.addColorStop(0, '#9ca3af');
  mail.addColorStop(1, '#374151');
  ctx.fillStyle = mail;
  roundRect(ctx, -r * 0.7, -r * 0.3, r * 1.4, r * 1.4, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let y = -r * 0.2; y < r; y += r * 0.18) for (let x = -r * 0.6; x < r * 0.6; x += r * 0.18) { ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill(); }
  ctx.save();
  ctx.translate(r * 1.0, -r * 0.2);
  ctx.rotate(-0.35 + Math.sin(now * 2) * 0.08);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, r * 1.3);
  ctx.lineTo(0, -r * 1.3);
  ctx.stroke();
  ctx.fillStyle = '#cbd5e1';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.3);
    ctx.quadraticCurveTo(side * r * 0.9, -r * 1.1, side * r * 0.7, -r * 0.3);
    ctx.lineTo(0, -r * 0.6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#f5d0b0';
  ctx.beginPath();
  ctx.arc(0, -r * 0.65, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  beard(ctx, r * 1.1, -r * 0.4, '#e5e7eb');
  hornedHelm(ctx, r * 1.05, -r * 0.8);
  eyes(ctx, r * 0.2, -r * 0.7, r * 0.08, e.dash > 0 || e.aim > 0 ? '#fde047' : '#38bdf8');
};

/* Jungle: spiders, snapping plants, old stumps and the Ancient Treant. */
const jungleSpider: Drawer = (ctx, e, now) => {
  const r = e.r;
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const lift = Math.sin(now * 16 + i * 1.5 + side) * 2;
      ctx.beginPath();
      ctx.moveTo(side * r * 0.4, -r * 0.3 + i * r * 0.25);
      ctx.lineTo(side * r * 1.1, -r * 0.7 + i * r * 0.3 + lift);
      ctx.lineTo(side * r * 1.5, r * 0.1 + i * r * 0.25 + lift);
      ctx.stroke();
    }
  }
  const body = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 1, 0, 0, r * 0.9);
  body.addColorStop(0, '#57534e');
  body.addColorStop(1, '#1c1917');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.15, r * 0.75, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.3);
  ctx.lineTo(r * 0.25, r * 0.2);
  ctx.lineTo(0, r * 0.7);
  ctx.lineTo(-r * 0.25, r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#292524';
  ctx.beginPath();
  ctx.arc(0, -r * 0.8, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, r * 0.15, -r * 0.9, r * 0.08, '#86efac');
  eyes(ctx, r * 0.3, -r * 0.75, r * 0.06, '#86efac');
};

const junglePlant: Drawer = (ctx, e, now) => {
  const r = e.r;
  const open = 0.5 + Math.sin(e.wobble * 0.8) * 0.3;
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, r);
  ctx.quadraticCurveTo(r * 0.3, r * 0.3, 0, -r * 0.1);
  ctx.stroke();
  // Leaves at the base.
  ctx.fillStyle = '#16a34a';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, r * 0.9);
    ctx.quadraticCurveTo(side * r * 0.9, r * 0.8, side * r * 1.1, r * 0.2);
    ctx.quadraticCurveTo(side * r * 0.5, r * 0.5, 0, r * 0.9);
    ctx.fill();
  }
  // Two jaws with teeth.
  for (const [dir, color] of [[-1, '#dc2626'], [1, '#b91c1c']] as const) {
    ctx.save();
    ctx.translate(0, -r * 0.3);
    ctx.rotate(dir * open);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, dir * -r * 0.3, r * 0.7, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.25 - 2, dir * -r * 0.02);
      ctx.lineTo(i * r * 0.25, dir * -r * 0.25);
      ctx.lineTo(i * r * 0.25 + 2, dir * -r * 0.02);
      ctx.fill();
    }
    ctx.restore();
  }
  void now;
};

const jungleStump: Drawer = (ctx, e, now) => {
  const r = e.r;
  const bark = ctx.createLinearGradient(-r, 0, r, 0);
  bark.addColorStop(0, '#78350f');
  bark.addColorStop(0.5, '#a16207');
  bark.addColorStop(1, '#451a03');
  ctx.fillStyle = bark;
  roundRect(ctx, -r * 0.85, -r * 0.5, r * 1.7, r * 1.5, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.3, -r * 0.4); ctx.lineTo(i * r * 0.3 + 2, r * 0.9); ctx.stroke(); }
  // Rings on top.
  ctx.fillStyle = '#d6a96a';
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.5, r * 0.85, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(0, -r * 0.5, r * 0.25 * i, r * 0.1 * i, 0, 0, Math.PI * 2); ctx.stroke(); }
  // A face in the bark, and a sprout.
  eyes(ctx, r * 0.3, r * 0.05, r * 0.1, '#a3e635');
  ctx.fillStyle = '#1c1917';
  roundRect(ctx, -r * 0.35, r * 0.4, r * 0.7, r * 0.15, 2);
  ctx.fill();
  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.ellipse(r * 0.4, -r * 0.95 + Math.sin(now * 3) * 1.5, r * 0.2, r * 0.32, -0.6, 0, Math.PI * 2);
  ctx.fill();
};

const jungleTreant: Drawer = (ctx, e, now) => {
  const r = e.r;
  const glow = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.7);
  glow.addColorStop(0, 'rgba(74,222,128,0.25)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
  ctx.fill();
  // Canopy.
  const sway = Math.sin(now * 1.5) * 3;
  for (const [dx, dy, rr, c] of [[-r * 0.7, -r * 1.1, r * 0.6, '#166534'], [r * 0.6, -r * 1.2, r * 0.65, '#15803d'], [0, -r * 1.45, r * 0.7, '#22c55e']] as const) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(dx + sway * 0.5, dy, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  // Trunk with a face, roots as legs.
  const bark = ctx.createLinearGradient(-r, 0, r, 0);
  bark.addColorStop(0, '#78350f');
  bark.addColorStop(0.5, '#92400e');
  bark.addColorStop(1, '#3b1a08');
  ctx.fillStyle = bark;
  roundRect(ctx, -r * 0.75, -r * 0.7, r * 1.5, r * 1.7, 12);
  ctx.fill();
  ctx.strokeStyle = '#3b1a08';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.4, r * 0.9);
    ctx.lineTo(side * r * 0.8, r * 1.25);
    ctx.moveTo(side * r * 0.75, -r * 0.2);
    ctx.lineTo(side * r * 1.4, -r * 0.5 + Math.sin(now * 2 + side) * 4);
    ctx.stroke();
  }
  eyes(ctx, r * 0.3, -r * 0.2, r * 0.12, e.dash > 0 || e.aim > 0 ? '#fde047' : '#a3e635');
  ctx.fillStyle = '#1c1917';
  roundRect(ctx, -r * 0.4, r * 0.3, r * 0.8, r * 0.2, 3);
  ctx.fill();
};

/* Robots: drones, turrets, armoured crates and the Mainframe. */
const robotDrone: Drawer = (ctx, e, now) => {
  const r = e.r;
  // Spinning rotors.
  ctx.strokeStyle = 'rgba(203,213,225,0.7)';
  ctx.lineWidth = 2;
  for (const side of [-1, 1]) {
    const spin = now * 40 + side;
    ctx.beginPath();
    ctx.moveTo(side * r * 0.9 - Math.cos(spin) * r * 0.6, -r * 0.6 - Math.sin(spin) * r * 0.15);
    ctx.lineTo(side * r * 0.9 + Math.cos(spin) * r * 0.6, -r * 0.6 + Math.sin(spin) * r * 0.15);
    ctx.stroke();
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(side * r * 0.4, -r * 0.1);
    ctx.lineTo(side * r * 0.9, -r * 0.6);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(203,213,225,0.7)';
  }
  const shell = ctx.createLinearGradient(0, -r, 0, r);
  shell.addColorStop(0, '#94a3b8');
  shell.addColorStop(1, '#334155');
  ctx.fillStyle = shell;
  roundRect(ctx, -r * 0.7, -r * 0.3, r * 1.4, r * 1.0, 6);
  ctx.fill();
  // One big lens.
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, r * 0.2, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, 0, r * 0.2, r * 0.16, '#fb923c');
  ctx.fillStyle = '#fb923c';
  ctx.fillRect(-r * 0.5, r * 0.8, r * 0.3, 2);
  ctx.fillRect(r * 0.2, r * 0.8, r * 0.3, 2);
};

const robotTurret: Drawer = (ctx, e) => {
  const r = e.r;
  // Base plate, barrel aiming the way it wobbles.
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.6, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  const tower = ctx.createLinearGradient(-r, 0, r, 0);
  tower.addColorStop(0, '#64748b');
  tower.addColorStop(1, '#334155');
  ctx.fillStyle = tower;
  roundRect(ctx, -r * 0.55, -r * 0.4, r * 1.1, r * 1.0, 5);
  ctx.fill();
  ctx.save();
  ctx.translate(0, -r * 0.1);
  ctx.rotate(Math.sin(e.wobble * 0.5) * 0.4 - Math.PI / 2);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, -r * 0.14, r * 1.2, r * 0.28);
  ctx.fillStyle = '#fb923c';
  ctx.fillRect(r * 1.05, -r * 0.1, r * 0.15, r * 0.2);
  ctx.restore();
  ctx.fillStyle = '#fb923c';
  ctx.fillRect(-r * 0.35, r * 0.3, r * 0.2, r * 0.12);
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(r * 0.1, r * 0.3, r * 0.2, r * 0.12);
};

const robotCrate: Drawer = (ctx, e, now) => {
  const r = e.r;
  const steel = ctx.createLinearGradient(-r, -r, r, r);
  steel.addColorStop(0, '#94a3b8');
  steel.addColorStop(1, '#1e293b');
  ctx.fillStyle = steel;
  roundRect(ctx, -r, -r, r * 2, r * 2, 4);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.strokeRect(-r * 0.75, -r * 0.75, r * 1.5, r * 1.5);
  // Rivets and a warning stripe.
  ctx.fillStyle = '#cbd5e1';
  for (const x of [-0.85, 0.85]) for (const y of [-0.85, 0.85]) { ctx.beginPath(); ctx.arc(x * r, y * r, 1.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.save();
  ctx.beginPath();
  ctx.rect(-r * 0.75, r * 0.3, r * 1.5, r * 0.3);
  ctx.clip();
  for (let i = -4; i < 5; i++) {
    ctx.fillStyle = i % 2 ? '#fbbf24' : '#1c1917';
    ctx.beginPath();
    ctx.moveTo(i * r * 0.3, r * 0.3);
    ctx.lineTo(i * r * 0.3 + r * 0.3, r * 0.3);
    ctx.lineTo(i * r * 0.3, r * 0.6);
    ctx.lineTo(i * r * 0.3 - r * 0.3, r * 0.6);
    ctx.fill();
  }
  ctx.restore();
  // A blinking status light.
  ctx.fillStyle = Math.sin(now * 6 + e.id) > 0 ? '#ef4444' : '#7f1d1d';
  ctx.beginPath();
  ctx.arc(0, -r * 0.3, r * 0.14, 0, Math.PI * 2);
  ctx.fill();
};

const robotMainframe: Drawer = (ctx, e, now) => {
  const r = e.r;
  const glow = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.7);
  glow.addColorStop(0, 'rgba(251,146,60,0.3)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
  ctx.fill();
  // Treads, then the cabinet.
  ctx.fillStyle = '#0f172a';
  roundRect(ctx, -r * 1.1, r * 0.7, r * 2.2, r * 0.5, 8);
  ctx.fill();
  ctx.fillStyle = '#475569';
  for (let i = -3; i <= 3; i++) ctx.fillRect(i * r * 0.3 - 2 + ((now * 40) % (r * 0.3)), r * 0.78, 4, r * 0.34);
  const body = ctx.createLinearGradient(0, -r, 0, r);
  body.addColorStop(0, '#64748b');
  body.addColorStop(1, '#1e293b');
  ctx.fillStyle = body;
  roundRect(ctx, -r * 0.9, -r * 1.1, r * 1.8, r * 1.9, 8);
  ctx.fill();
  // Blinking server lights and a screen face.
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      const on = Math.sin(now * 5 + i * 1.3 + j * 2.1) > 0.2;
      ctx.fillStyle = on ? (j === 1 ? '#4ade80' : '#fb923c') : 'rgba(255,255,255,0.1)';
      ctx.fillRect(-r * 0.7 + j * r * 0.25, -r * 0.95 + i * r * 0.14, r * 0.15, r * 0.07);
    }
  }
  ctx.fillStyle = '#020617';
  roundRect(ctx, -r * 0.7, -r * 0.3, r * 1.4, r * 0.8, 4);
  ctx.fill();
  const mad = e.dash > 0 || e.aim > 0;
  ctx.fillStyle = mad ? '#ef4444' : '#fb923c';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 8;
  for (const side of [-1, 1]) ctx.fillRect(side * r * 0.3 - r * 0.12, -r * 0.15, r * 0.24, mad ? r * 0.1 : r * 0.22);
  ctx.fillRect(-r * 0.3, r * 0.2, r * 0.6, r * 0.08);
  ctx.shadowBlur = 0;
  // Claw arms.
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.9, -r * 0.4);
    ctx.lineTo(side * r * 1.5, -r * 0.1 + Math.sin(now * 3 + side) * 5);
    ctx.lineTo(side * r * 1.4, r * 0.4);
    ctx.stroke();
  }
};

/** One enemy at its own position, for the title screen. */
export function drawSprite(ctx: CanvasRenderingContext2D, e: Enemy, now: number) {
  ctx.save();
  ctx.translate(e.x, e.y);
  LOOKS[e.look][e.kind](ctx, e, now);
  if (e.hit > 0) {
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, e.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* Painted enemies: four frames per kind for the looks that have a sheet
   (static/images/game/enemies/<look>-<kind>-<frame>.webp). The frames cycle
   with the enemy's own wobble so a crowd never steps in unison; the sprite
   is sized to the collision circle (bosses a little bigger) with its feet on
   the shadow. Looks without a sheet fall back to the hand-drawn figures. */
/* Frames per look: the first three sheets have four walking frames; the
   later ones six: three walking, two attacking (wind-up, strike) and one
   taking a hit. */
const SPRITE_FRAMES: Partial<Record<Look, number>> = { original: 4, demon: 4, greek: 4, viking: 6, jungle: 6, robot: 6, nightmare: 6 };
/* Sets cut on one canvas for all their frames (feet on its bottom edge, body centred), so a pose with a
   big swing doesn't shrink the figure: how much larger than usual to draw that canvas, so the body keeps
   the size the old per-frame cuts had. */
const SPRITE_CANVAS: Record<string, number> = { 'viking-boss': 1.265, 'jungle-boss': 1.276 };
const enemySprites = new Map<string, HTMLImageElement[]>();
function enemyFrames(look: Look, kind: Enemy['kind'], count: number) {
  const key = `${look}-${kind}`;
  let frames = enemySprites.get(key);
  if (!frames) {
    frames = Array.from({ length: count }, (_, i) => {
      const img = new Image();
      img.src = `./images/game/enemies/${key}-${i}.webp`;
      return img;
    });
    enemySprites.set(key, frames);
  }
  return frames;
}
/** Which frame an enemy shows right now: hit, attacking, or its walk cycle. */
function enemyFrame(e: Enemy, count: number, now: number) {
  if (count === 4) return Math.floor(now * 6 + e.wobble) % 4;
  if (e.hit > 0) return 5;
  // Attacks: a boss winding up (aim) or charging (dash); a ticket just after it threw (its cooldown was reset high).
  if (e.kind === 'boss' && e.aim > 0) return 3;
  if (e.kind === 'boss' && e.dash > 0) return 4;
  if (e.kind === 'ticket' && e.cd > 1.5) return e.cd > 1.75 ? 3 : 4;
  return Math.floor(now * 6 + e.wobble) % 3;
}
/* Final bosses with a sheet of their own (static/images/game/bosses/<id>-<frame>.webp, nine poses, the same
   order as the prompts: three walking, wind-up and charge, the ring of orbs, the world's move, the signature
   and a hit). Add an id here once its pictures are in; until then a final boss wears its cast's boss, bigger. */
const BOSS_ART = new Set<string>(['kernel']);
/* Each final sheet is cut on one canvas for its nine poses (body centred, its lowest point on the baseline):
   how many times the body's width the canvas is drawn, and how much of the canvas lies under the feet
   (dust, a dash's trail, the volley's orbs). */
const BOSS_CANVAS: Record<string, { k: number; feet: number }> = { kernel: { k: 2.155, feet: 0.1766 } };
const finalSprites = new Map<string, HTMLImageElement[]>();
function finalFrame(e: Enemy, now: number) {
  if (e.hit > 0) return 8;
  if (e.chan > 0) return 7;
  if (e.pose > 0) return e.act === 'sig' ? 7 : e.act === 'move' ? 6 : 5;
  if (e.aim > 0) return 3;
  if (e.dash > 0) return 4;
  return Math.floor(now * 6 + e.wobble) % 3;
}
function drawEnemySprite(ctx: CanvasRenderingContext2D, e: Enemy, now: number) {
  let count = SPRITE_FRAMES[e.look];
  let frames: HTMLImageElement[] | undefined;
  let img: HTMLImageElement | undefined;
  if (e.final && BOSS_ART.has(e.bossId)) {
    frames = finalSprites.get(e.bossId);
    if (!frames) {
      frames = Array.from({ length: 9 }, (_, i) => Object.assign(new Image(), { src: `./images/game/bosses/${e.bossId}-${i}.webp` }));
      finalSprites.set(e.bossId, frames);
    }
    img = frames[finalFrame(e, now)];
    count = 9;
  }
  if (!count) return false;
  frames ??= enemyFrames(e.look, e.kind, count);
  img ??= frames[enemyFrame(e, count, now)] ?? frames[0];
  if (!img.complete || !img.naturalWidth) return false;
  const fit = count === 9 ? BOSS_CANVAS[e.bossId] : undefined;
  const size = e.r * (e.kind === 'boss' ? 2.6 : 2.5) * (fit ? fit.k : SPRITE_CANVAS[`${e.look}-${e.kind}`] ?? 1);
  const ratio = img.naturalWidth / img.naturalHeight;
  const w = ratio >= 1 ? size : size * ratio;
  const h = ratio >= 1 ? size / ratio : size;
  const under = fit ? h * fit.feet : 0;
  const bob = Math.sin(now * 8 + e.wobble) * 1.2;
  // Face the way it moves, when it moves sideways.
  if (e.dir && e.dir.x < -0.3) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, e.r * 0.85 - h + under + bob, w, h);
  return true;
}

const LOOKS: Record<Look, Record<Enemy['kind'], Drawer>> = {
  viking: { bug: vikingRaider, ticket: vikingThrower, legacy: vikingShieldWall, boss: vikingJarl },
  jungle: { bug: jungleSpider, ticket: junglePlant, legacy: jungleStump, boss: jungleTreant },
  robot: { bug: robotDrone, ticket: robotTurret, legacy: robotCrate, boss: robotMainframe },
  original: { bug: drawBug, ticket: (ctx, e) => drawTicket(ctx, e), legacy: (ctx, e) => drawLegacy(ctx, e), boss: drawBoss },
  demon: { bug: demonImp, ticket: demonSkull, legacy: demonGargoyle, boss: demonOverlord },
  greek: { bug: greekGladiator, ticket: greekHoplite, legacy: greekShieldWall, boss: greekMinotaur },
  nightmare: { bug: nightmareZombie, ticket: nightmareSkeleton, legacy: nightmareTombstone, boss: nightmareLich },
};


/* ------------------------------------------------------------- the worlds */

function drawHazards(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  for (const h of g.hazards) {
    // The owner's bubbling lava pool: seven frames looping, each pool on its own beat (the disc is 91% of its picture).
    const lava = h.kind === 'lava' && !retroLook ? fxImage(`lava-${((Math.floor(now * 7 + h.x * 0.05 + h.y * 0.03) % 7) + 7) % 7}`) : null;
    if (lava && ready(lava)) {
      const size = (h.r * 2) / 0.91;
      ctx.drawImage(lava, h.x - size / 2, h.y - size / 2, size, size);
      continue;
    }
    if (h.kind === 'lava') {
      const grad = ctx.createRadialGradient(h.x, h.y, h.r * 0.2, h.x, h.y, h.r);
      grad.addColorStop(0, '#fde68a');
      grad.addColorStop(0.45, '#f97316');
      grad.addColorStop(1, '#7c2d12');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.fill();
      // Slow bubbles.
      ctx.fillStyle = 'rgba(254,243,199,0.6)';
      for (let i = 0; i < 3; i++) {
        const t = (now * 0.7 + i * 0.37 + h.x * 0.01) % 1;
        ctx.globalAlpha = 1 - t;
        ctx.beginPath();
        ctx.arc(h.x + Math.cos(i * 2.1) * h.r * 0.5, h.y + Math.sin(i * 2.1) * h.r * 0.5, 2 + t * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (h.kind === 'puddle') {
      const grad = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r);
      grad.addColorStop(0, 'rgba(56,189,248,0.35)');
      grad.addColorStop(1, 'rgba(14,116,144,0.55)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, h.r, h.r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(186,230,253,0.5)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 2; i++) {
        const t = (now * 0.5 + i * 0.5) % 1;
        ctx.globalAlpha = 1 - t;
        ctx.beginPath();
        ctx.ellipse(h.x, h.y, h.r * (0.2 + t * 0.7), h.r * (0.16 + t * 0.56), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else {
      // Thorns: a dark bush with pale spikes.
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + h.x;
        ctx.beginPath();
        ctx.moveTo(h.x + Math.cos(a) * h.r * 0.5, h.y + Math.sin(a) * h.r * 0.5);
        ctx.lineTo(h.x + Math.cos(a) * (h.r + 5), h.y + Math.sin(a) * (h.r + 5));
        ctx.stroke();
      }
    }
  }
}

function drawStrikes(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  for (const st of g.strikes) {
    const t = 1 - st.t / 0.9;
    ctx.strokeStyle = `rgba(250,204,21,${0.4 + t * 0.5})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(st.x, st.y, 34, now * 3, now * 3 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(250,204,21,${0.08 + t * 0.25})`;
    ctx.beginPath();
    ctx.arc(st.x, st.y, 34 * t, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFog(ctx: CanvasRenderingContext2D, g: Game, vis: Rect) {
  const p = g.player;
  const grad = ctx.createRadialGradient(p.x, p.y, 70, p.x, p.y, 200);
  grad.addColorStop(0, 'rgba(8,9,15,0)');
  grad.addColorStop(0.6, 'rgba(8,9,15,0.6)');
  grad.addColorStop(1, 'rgba(8,9,15,0.86)');
  ctx.fillStyle = grad;
  ctx.fillRect(vis.x, vis.y, vis.w, vis.h);
}
