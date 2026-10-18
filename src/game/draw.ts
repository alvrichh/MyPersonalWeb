import { BLADE_ORBIT, H, W, WALL, WHEEL_X, WORLDS, frostReach, isBossRoom, type Enemy, type Game, type Look, type Statue, type Rect, type Vec, bladeElement, type BladeElement } from './world';
import { SPIRIT_COLOR, type ItemId, type SpiritSkin } from './shop';
import type { HeroSkin } from './save';

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
  if (g.skills.frost) drawFrost(ctx, g, now);
  drawFx(ctx, g, accent, 'under');
  for (const e of g.enemies) if (onScreen(e, 80)) drawEnemy(ctx, e, now);
  drawOrbs(ctx, g);
  drawShots(ctx, g, accent, accent2);
  drawFireballs(ctx, g);
  drawSpirits(ctx, g, now);
  drawZaps(ctx, g);
  if (pal.retro) drawPlayerRetro(ctx, g, pal, now);
  else drawPlayer(ctx, g, pal, now);
  if (g.skills.blades) drawBlades(ctx, g, accent, now);
  drawFx(ctx, g, accent, 'over');
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
   (boy, robot) each with the head item worn: the hats are painted on, so
   nothing is drawn over the sprite. Feet on the shadow, flipped to face
   left; one walking frame alternates with the idle one for a step cycle.
   The circle in world.ts is still what collides. */
type Pose = 'idle' | 'walk' | 'back' | 'shoot' | 'cheer';
const POSES: Pose[] = ['idle', 'walk', 'back', 'shoot', 'cheer'];
const HAT_SET: Partial<Record<ItemId, string>> = { wizardHat: 'wizard', gladHelm: 'helm', bandana: 'bandana' };
const heroSets = new Map<string, Record<Pose, HTMLImageElement>>();
function heroSet(skin: HeroSkin, hat?: ItemId) {
  const key = `${skin}-${(hat && HAT_SET[hat]) || 'base'}`;
  let set = heroSets.get(key);
  if (!set) {
    set = Object.fromEntries(POSES.map((pose) => {
      const img = new Image();
      img.src = `./images/game/hero/${key}-${pose}.webp`;
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

function heroPose(g: Game, now: number): Pose {
  const p = g.player;
  if (p.moving) {
    if (Math.sin(p.face) < -0.75) return 'back';
    return Math.floor(now * 7) % 2 ? 'walk' : 'idle';
  }
  if (g.enemies.length === 0 && g.door) return 'cheer';
  if (g.enemies.some((e) => e.spawn <= 0)) return 'shoot';
  return 'idle';
}

function drawPlayer(ctx: CanvasRenderingContext2D, g: Game, pal: Palette, now: number) {
  const { accent, accent2 } = pal;
  const p = g.player;
  if (p.inv > 0 && Math.floor(now * 20) % 2 === 0) return;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + p.r * 0.9, p.r * 0.9, p.r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  const pose = heroPose(g, now);
  const img = heroSet(pal.skin ?? 'boy', pal.hat)[pose];
  // Health bar height: above the picture's top (hats make it taller).
  let barTop = p.y - p.r * 2.5;
  if (img.complete && img.naturalWidth) {
    const h = p.r * (pose === 'cheer' ? 3.1 : 2.7);
    const w = (h * img.naturalWidth) / img.naturalHeight;
    const bob = p.moving ? Math.abs(Math.sin(now * 14)) * 2 : pose === 'cheer' ? Math.abs(Math.sin(now * 6)) * 3 : 0;
    const left = Math.cos(p.face) < -0.2 && pose !== 'back' && pose !== 'cheer';
    ctx.save();
    ctx.translate(p.x, p.y + p.r * 0.9 - bob);
    if (left) ctx.scale(-1, 1);
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
const ARROW_ELEMENTS = ['fire', 'water', 'leaf', 'ghost'] as const;
const arrows = new Map<string, HTMLImageElement>();
function arrowImage(name: string) {
  let img = arrows.get(name);
  if (!img) { img = new Image(); img.src = `./images/game/arrows/${name}.webp`; arrows.set(name, img); }
  return img;
}

function drawShots(ctx: CanvasRenderingContext2D, g: Game, accent: string, accent2: string) {
  const fire = g.skills.fire > 0;
  const water = g.skills.water > 0;
  const element = ARROW_ELEMENTS.find((e) => g.skills[e] > 0);
  ctx.lineCap = 'round';
  for (const a of g.shots) {
    const len = Math.hypot(a.vx, a.vy) || 1;
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
    if (a.kind === 'boomerang') {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.spin);
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
      const trail = arrowImage(`${element}-trail`);
      if (arrow.complete && arrow.naturalWidth) {
        // The tip sits on the shot's point; the picture points right.
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(Math.atan2(a.vy, a.vx));
        if (trail.complete && trail.naturalWidth) {
          const tw = 58;
          const th = (tw * trail.naturalHeight) / trail.naturalWidth;
          ctx.globalAlpha = 0.85;
          ctx.drawImage(trail, -tw, -th / 2, tw, th);
          ctx.globalAlpha = 1;
        }
        const w = 36;
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
    tail.addColorStop(1, fire ? '#ffb347' : water ? '#7ad8ff' : accent2);
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
  }
}

function drawGems(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  for (const gem of g.gems) {
    const big = gem.value > 10;
    const s = big ? 6 : 4.5;
    const bob = Math.sin(now * 5 + gem.x) * 1.5;
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

function drawFrost(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  const p = g.player;
  const r = frostReach(g);
  const grad = ctx.createRadialGradient(p.x, p.y, r * 0.3, p.x, p.y, r);
  grad.addColorStop(0, 'rgba(122,216,255,0)');
  grad.addColorStop(0.8, 'rgba(122,216,255,0.12)');
  grad.addColorStop(1, 'rgba(122,216,255,0.28)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(186,230,253,0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 6]);
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, now * 0.4, now * 0.4 + Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // A few flakes drifting round.
  ctx.fillStyle = 'rgba(224,242,254,0.8)';
  for (let i = 0; i < 6; i++) {
    const a = now * 0.8 + i * 1.05;
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(a) * r * 0.75, p.y + Math.sin(a) * r * 0.75, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
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
function drawBlades(ctx: CanvasRenderingContext2D, g: Game, accent: string, now: number) {
  const el = bladeElement(g);
  const img = sawImage(el);
  if (retroLook || !img.complete || !img.naturalWidth) { drawBladesRetro(ctx, g, accent); return; }
  const p = g.player;
  const n = g.skills.blades + 1;
  const glow = BLADE_LOOK[el][3];
  const size = 24;
  for (let i = 0; i < n; i++) {
    const a = g.gear.bladeAngle + (i / n) * Math.PI * 2;
    ctx.save();
    ctx.translate(p.x + Math.cos(a) * BLADE_ORBIT, p.y + Math.sin(a) * BLADE_ORBIT);
    if (glow) {
      const halo = ctx.createRadialGradient(0, 0, size * 0.3, 0, 0, size * 0.85);
      halo.addColorStop(0, glow);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.rotate(now * 14 + i);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

function drawBladesRetro(ctx: CanvasRenderingContext2D, g: Game, accent: string) {
  const p = g.player;
  const n = g.skills.blades + 1;
  const [edge, base, hilt, glow] = BLADE_LOOK[bladeElement(g)];
  for (let i = 0; i < n; i++) {
    const a = g.gear.bladeAngle + (i / n) * Math.PI * 2;
    ctx.save();
    ctx.translate(p.x + Math.cos(a) * BLADE_ORBIT, p.y + Math.sin(a) * BLADE_ORBIT);
    ctx.rotate(a + Math.PI / 2);
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

function drawFireballs(ctx: CanvasRenderingContext2D, g: Game) {
  for (const f of g.fireballs) {
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
}

function drawFx(ctx: CanvasRenderingContext2D, g: Game, accent: string, layer: 'under' | 'over') {
  for (const f of g.fx) {
    const t = 1 - f.life / f.max;
    const fade = Math.max(0, f.life / f.max);
    if (layer === 'under' && (f.kind === 'ring' || f.kind === 'strike')) {
      ctx.globalAlpha = fade;
      if (f.kind === 'ring') {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 4 * fade + 1;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * (0.35 + 0.65 * t), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fill();
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
    if (layer === 'over' && (f.kind === 'slash' || f.kind === 'boom')) {
      ctx.globalAlpha = fade;
      if (f.kind === 'slash') {
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
    grad.addColorStop(0.45, '#ff6b6b');
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
    ctx.globalAlpha = Math.min(1, z.life / 0.12);
    for (const [width, color] of [[5, 'rgba(255,212,95,0.35)'], [2, '#fffbe0']] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      z.pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, now: number) {
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
function drawEnemySprite(ctx: CanvasRenderingContext2D, e: Enemy, now: number) {
  const count = SPRITE_FRAMES[e.look];
  if (!count) return false;
  const frames = enemyFrames(e.look, e.kind, count);
  const img = frames[enemyFrame(e, count, now)] ?? frames[0];
  if (!img.complete || !img.naturalWidth) return false;
  const size = e.r * (e.kind === 'boss' ? 2.6 : 2.5);
  const ratio = img.naturalWidth / img.naturalHeight;
  const w = ratio >= 1 ? size : size * ratio;
  const h = ratio >= 1 ? size / ratio : size;
  const bob = Math.sin(now * 8 + e.wobble) * 1.2;
  // Face the way it moves, when it moves sideways.
  if (e.dir && e.dir.x < -0.3) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, e.r * 0.85 - h + bob, w, h);
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
