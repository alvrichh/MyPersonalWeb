import { GAZE, H, W, WALL, WHEEL_X, ICICLE_R, ICICLE_STAY, ATTACK_CYCLE, WORLDS, frostReach, waveAt, type Threat, type OrbPic, isBossRoom, type Enemy, type Game, type Shot, type Look, type Statue, type Rect, type Vec, type Fusion, arrowLook, fusionOf, bladeCount, bladeElement, sawOrbit, sawScale, type BladeElement, type Fx, type SkillId } from './world';
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
  // Fire on the floor (molotov pools, the inferno's ground) lies under the walls, like the lava.
  drawEmbers(ctx, g, now);
  drawObstacles(ctx, g, accent, now);
  drawGems(ctx, g, now);
  if (g.chest) drawChest(ctx, g.chest, now);
  drawHearts(ctx, g, now);
  if (g.skills.frost) drawFrost(ctx, g, now);
  drawMines(ctx, g, now);
  drawRunes(ctx, g, now);
  drawFx(ctx, g, accent, 'under');
  drawThreats(ctx, g, now, false);
  // Bosses come after the crowd and the hero's own weapons (saws, the frost's
  // ice), so neither a swarm nor the orbit hides them (the real one over its
  // clones; the final boss on top); their warnings and shots, and the hero, go over them.
  const rank = (e: Enemy) => (e.kind !== 'boss' ? 0 : e.clone ? 1 : e.final ? 3 : 2);
  for (const e of g.enemies) if (rank(e) === 0 && onScreen(e, 120)) drawEnemy(ctx, e, now);
  // Fused arrows' tracks go under the arrows.
  drawParticles(ctx, g, true);
  drawShots(ctx, g, accent, accent2);
  drawFireballs(ctx, g);
  // With the Phoenix wings on, the spirits go over them (drawn after the hero below).
  if (!g.loadout.wings || pal.retro) drawSpirits(ctx, g, now);
  drawZaps(ctx, g);
  if (g.skills.blades) drawBlades(ctx, g, accent);
  if (g.skills.frost) drawFrostTop(ctx, g, now);
  // The Core's dragon goes over its own attacks (its fire, its ring of orbs, their tracks); the others under theirs.
  const overShots = (e: Enemy) => e.bossId === 'chimera' && !e.clone;
  for (const r of [1, 2, 3]) for (const e of g.enemies) if (rank(e) === r && !overShots(e) && onScreen(e, 120)) drawEnemy(ctx, e, now);
  drawThreats(ctx, g, now, true);
  drawOrbs(ctx, g);
  for (const e of g.enemies) if (overShots(e) && onScreen(e, 120)) drawEnemy(ctx, e, now);
  if (pal.retro) drawPlayerRetro(ctx, g, pal, now);
  else {
    // The firebird rises from behind the hero.
    for (const f of g.fx) if (f.kind === 'phoenix') drawPhoenixRise(ctx, f, g.time, 'over');
    if (g.loadout.wings) drawHeroWings(ctx, g, pal, now, false);
    drawPlayer(ctx, g, pal, now);
    drawSafeBubble(ctx, g, now);
    drawGaze(ctx, g, now);
    if (g.loadout.wings) {
      drawHeroWings(ctx, g, pal, now, true);
      drawSpirits(ctx, g, now);
    }
  }
  drawFx(ctx, g, accent, 'over');
  drawPicFx(ctx, g, true);
  drawBeams(ctx, g);
  drawStrikes(ctx, g, now);
  drawParticles(ctx, g, false);
  ctx.globalAlpha = 1;
  if (g.hazard === 'fog' && !g.showcase) drawFog(ctx, g, vis);
  if (g.player.dark > 0 && g.phase === 'play') drawDark(ctx, g, vis);
}

/** The particles: arrow tracks (`Particle.low`) in a pass under the shots, the rest over everything. */
function drawParticles(ctx: CanvasRenderingContext2D, g: Game, low: boolean) {
  for (const q of g.particles) {
    if (!!q.low !== low) continue;
    const k = Math.max(0, q.life / q.max);
    ctx.globalAlpha = q.kind === 'puff' ? k * 0.55 : k;
    ctx.fillStyle = q.color;
    ctx.strokeStyle = q.color;
    if (q.kind === 'spark') {
      // A short streak along its flight.
      const sp = Math.hypot(q.vx, q.vy) || 1;
      ctx.lineWidth = q.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x - (q.vx / sp) * 11, q.y - (q.vy / sp) * 11);
      ctx.stroke();
    } else if (q.kind === 'flake') {
      ctx.lineWidth = 1.3;
      snowflake(ctx, q.x, q.y, q.size, q.life * 4);
    } else if (q.kind === 'glow') {
      // Plasma: a hot bead of light that shrinks as it cools.
      const r = q.size * (0.5 + 0.5 * k);
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 2.2);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.3, q.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(q.x, q.y, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else if (q.kind === 'crackle') {
      // Electrocution: a tiny zigzag of current, a new shape each frame.
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const a = Math.random() * Math.PI * 2;
      let x = q.x - Math.cos(a) * q.size;
      let y = q.y - Math.sin(a) * q.size;
      ctx.moveTo(x, y);
      for (let i = 1; i <= 3; i++) {
        x += Math.cos(a) * (q.size * 2) / 3 + (Math.random() - 0.5) * q.size * 0.9;
        y += Math.sin(a) * (q.size * 2) / 3 + (Math.random() - 0.5) * q.size * 0.9;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    } else if (q.kind === 'puff') {
      // Steam: a soft cloud that swells as it fades.
      const r = q.size * (1 + (1 - k) * 1.6);
      const grad = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      grad.addColorStop(0, q.color);
      grad.addColorStop(1, 'rgba(226,232,240,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Wisps shrink as they rise.
      const r = q.kind === 'wisp' ? q.size * (0.4 + 0.6 * k) : q.size;
      ctx.beginPath();
      ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/* On call: the open field. The world's arena floor has painted walls round
   it, so only its plain middle is tiled, mirrored tile by tile so the seams
   join; flat tiles in retro. The field has no edge: whatever the canvas
   shows gets floor. */
const FLOOR_CROP = { x: 0.21, y: 0.16, w: 0.58, h: 0.68 };
/** The field's floor as a repeating pattern: a 2×2 block of the floor's plain middle and its mirrors. */
const fieldPatterns = new Map<HTMLImageElement, CanvasPattern>();
function fieldPattern(ctx: CanvasRenderingContext2D, floor: HTMLImageElement, tw: number, th: number) {
  let pat = fieldPatterns.get(floor);
  if (!pat) {
    const sx = floor.naturalWidth * FLOOR_CROP.x;
    const sy = floor.naturalHeight * FLOOR_CROP.y;
    const sw = Math.round(floor.naturalWidth * FLOOR_CROP.w);
    const sh = Math.round(floor.naturalHeight * FLOOR_CROP.h);
    const block = document.createElement('canvas');
    block.width = sw * 2;
    block.height = sh * 2;
    const b = block.getContext('2d');
    if (!b) return null;
    for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      b.save();
      b.translate(i * sw + sw / 2, j * sh + sh / 2);
      b.scale(i ? -1 : 1, j ? -1 : 1);
      b.drawImage(floor, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
      b.restore();
    }
    pat = ctx.createPattern(block, 'repeat') ?? undefined;
    if (!pat) return null;
    pat.setTransform(new DOMMatrix().scale(tw / sw, th / sh));
    fieldPatterns.set(floor, pat);
  }
  return pat;
}

/** The world whose floor and blocks are drawn: the run's own, or the one picked in Customise. */
const sceneOf = (g: Game) => g.scene || g.world;

function drawField(ctx: CanvasRenderingContext2D, g: Game, vis: Rect, now: number) {
  const theme = WORLDS[sceneOf(g) - 1];
  const floor = retroLook ? undefined : floorImage(sceneOf(g));
  const tw = W * FLOOR_CROP.w;
  const th = H * FLOOR_CROP.h;
  ctx.fillStyle = theme.floor;
  ctx.fillRect(vis.x, vis.y, vis.w, vis.h);
  const pattern = floor && floor.complete && floor.naturalWidth ? fieldPattern(ctx, floor, tw, th) : null;
  if (pattern) {
    // One seamless pattern (the crop and its mirrors, baked once): tiles drawn one by one left hairline seams
    // where the background showed through at fractional camera positions.
    ctx.fillStyle = pattern;
    ctx.fillRect(vis.x, vis.y, vis.w, vis.h);
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
  const theme = WORLDS[sceneOf(g) - 1];
  // Floor: the world's painted arena, or flat tiles in its colours (retro, or while it loads).
  const floor = retroLook ? undefined : floorImage(sceneOf(g));
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

}

/** The blocks in a room (racks, or the world's stone blocks), drawn after the hazards so a pool never lies over a wall. */

/** Every block of every layout (`LAYOUTS` in world.ts), by size and place: the pieces drawn for the viking and Greek worlds. */
const LAYOUT_PIECES = new Set(['64x26-0', '64x26-1', '40x40-0', '40x40-1', '50x50-0', '100x24-0', '100x24-1', '60x24-0', '36x36-0', '36x36-1', '36x36-2', '36x36-3']);

/** Worlds whose pieces are drawn at one scale, the picture's pixels per unit, instead of by their block's width:
    the haunted servers' graves, fences and mausoleum were cut at one scale but do not share their blocks' shapes,
    so by the block's width the fences ran far past their ends and the mausoleum came out squat. A piece is never
    drawn wider than twice its block (only the picture; the block you bump into stays). */
const LAYOUT_PX: Partial<Record<string, number>> = { nightmare: 4 };
/** Each world's pieces drawn for every layout block, by its file prefix (none for the jungle, which picks by shape). */
const LAYOUT_SET: Record<string, string> = { viking: 'ice-', greek: 'arena-', demon: 'lava-', original: 'server-', robot: 'forge-', nightmare: 'grave-', core: 'core-', jungle: '' };

/** The part of a picture that shows (alpha over half), as fractions of its width and height, read once from its pixels. */
const opaqueCache = new WeakMap<HTMLImageElement, { l: number; r: number; t: number; b: number }>();
function opaqueBox(img: HTMLImageElement) {
  let box = opaqueCache.get(img);
  if (box) return box;
  box = { l: 0, r: 1, t: 0, b: 1 };
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const t = c.getContext('2d', { willReadFrequently: true });
    if (t) {
      t.drawImage(img, 0, 0);
      const d = t.getImageData(0, 0, w, h).data;
      let l = w, r = -1, top = h, b = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] <= 128) continue;
        if (x < l) l = x;
        if (x > r) r = x;
        if (y < top) top = y;
        if (y > b) b = y;
      }
      if (r >= l) box = { l: l / w, r: (r + 1) / w, t: top / h, b: (b + 1) / h };
    }
  } catch { /* keep the whole picture */ }
  opaqueCache.set(img, box);
  return box;
}
function drawObstacles(ctx: CanvasRenderingContext2D, g: Game, accent: string, now: number) {
  // The jungle world: the owner's mossy stone blocks instead of racks, the piece whose shape is closest.
  const look = WORLDS[sceneOf(g) - 1].look;
  // World 8 mixes the casts, but its blocks are its own: the Core's obsidian and crystals.
  const stones = retroLook ? null : look === 'random' ? 'core' : look;
  // The mud world stands on the vikings' old wet stones with lily pads, picked by shape like the jungle's.
  const set = stones === 'mud' ? 'viking' : stones;
  const byShape = stones === 'jungle' || stones === 'viking' || stones === 'mud';
  for (const o of stones ? g.obstacles : []) {
    const ratio = o.w / o.h;
    // Every world but the jungle: the owner drew one piece for each block of each layout (servers, volcanic
    // stone, ice, marble and gold, furnace crates, graves, the Core's obsidian), named by its size and its place among the blocks of that size (left to right, top to bottom).
    const size = `${o.w}x${o.h}`;
    // The open field's blocks say which piece they are; a room's are named by their place in its layout.
    const slot = `${size}-${o.piece ?? g.obstacles.filter((b) => `${b.w}x${b.h}` === size).indexOf(o)}`;
    const own = stones && LAYOUT_SET[stones] ? LAYOUT_SET[stones] + slot : '';
    const pic = setImage(set!, LAYOUT_PIECES.has(slot) && own ? own : !byShape
      ? LAYOUT_SET[stones!] + (ratio > 3.2 ? '100x24-0' : ratio > 1.7 ? '64x26-0' : '36x36-0')
      : ratio > 3.2 ? 'stone-long-1' : ratio > 1.7 ? 'stone-long-0' : (o.x + o.y) % 2 ? 'stone-0' : 'stone-1');
    if (!ready(pic)) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(o.x + o.w / 2, o.y + o.h, o.w * 0.55, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    const px = LAYOUT_PX[stones!];
    if (px) {
      const w = Math.min(pic.naturalWidth / px, o.w * 2);
      const h = (w * pic.naturalHeight) / pic.naturalWidth;
      ctx.drawImage(pic, o.x + o.w / 2 - w / 2, o.y + o.h + 4 - h, w, h);
      continue;
    }
    // Fitted by what shows, not by the file (whose margins are see-through): the visible part 4% wider than the
    // block and centred on it, standing on its bottom edge, and stretched upwards only if it would not reach the
    // block's top, so the block you bump into is all covered (the mud and jungle walls were half their block's height).
    const vis = opaqueBox(pic);
    const w = (o.w * 1.04) / (vis.r - vis.l);
    let h = (w * pic.naturalHeight) / pic.naturalWidth;
    const base = o.y + o.h + 3.5;
    if ((vis.b - vis.t) * h < o.h + 3.5) h = (o.h + 3.5) / (vis.b - vis.t);
    ctx.drawImage(pic, o.x + o.w / 2 - w * (vis.l + vis.r) / 2, base - vis.b * h, w, h);
  }
  // Server racks, with blinking lights.
  for (const o of stones && set && ready(setImage(set, !byShape ? `${LAYOUT_SET[stones]}36x36-0` : 'stone-0')) ? [] : g.obstacles) {
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
  // Blinking while invulnerable, but never once the run is over (inv stops running down there).
  if (p.inv > 0 && g.phase === 'play' && Math.floor(now * 20) % 2 === 0) return;
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
  if (g.phase === 'won') return 'cheer';
  if (p.ouch > 0) return 'hurt';
  if (p.moving) {
    const step = Math.floor(now * 7) % 2;
    // Walking up or down shows the back or the front, in both modes (there are no aiming poses for those).
    if (Math.sin(p.heading) < -0.75) return 'back';
    if (Math.sin(p.heading) > 0.75 && full) return step ? 'fwalk' : 'fwalk2';
    // On call fires on the move: sideways it walks aiming the blaster while there are bugs about.
    if (full && g.mode === 'horde' && g.enemies.some((e) => e.spawn <= 0)) return step ? 'wshoot' : 'wshoot2';
    return full ? (step ? 'walk' : 'walk2') : step ? 'walk' : 'idle';
  }
  if (g.enemies.length === 0 && g.door) return 'cheer';
  if (g.enemies.some((e) => e.spawn <= 0)) return 'shoot';
  return full && g.enemies.length === 0 ? 'front' : 'idle';
}

/* A boss's hit tints the hero for as long as it lasts: green poisoned, yellow stunned, icy blue chilled,
   violet in the dark. Safari has no canvas filter, so the picture is tinted on a small canvas of its own. */
let tintCanvas: HTMLCanvasElement | null = null;
function heroTint(g: Game): [string, number] | null {
  const p = g.player;
  if (p.stone > 0) return ['120,113,108', Math.min(1, p.stone / 0.15) * 1.8];
  if (p.stun > 0) return ['250,204,21', Math.min(1, p.stun / 0.15)];
  if (p.poison > 0) return ['74,222,128', Math.min(1, p.poison / 0.15)];
  if (p.chill > 0) return ['125,211,252', Math.min(1, p.chill / 0.3)];
  if (p.mired > 0) return ['133,77,14', Math.min(1, p.mired / 0.3)];
  if (p.dark > 0) return ['167,139,250', Math.min(1, p.dark / 0.3)];
  return null;
}
function drawTinted(ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLCanvasElement, x: number, y: number, w: number, h: number, tint: [string, number] | null) {
  if (!tint) { ctx.drawImage(img, x, y, w, h); return; }
  tintCanvas ??= document.createElement('canvas');
  const c = tintCanvas;
  c.width = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
  c.height = img instanceof HTMLImageElement ? img.naturalHeight : img.height;
  const t = c.getContext('2d');
  if (!t) { ctx.drawImage(img, x, y, w, h); return; }
  t.drawImage(img, 0, 0);
  t.globalCompositeOperation = 'source-atop';
  t.fillStyle = `rgba(${tint[0]},${0.42 * tint[1]})`;
  t.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(c, x, y, w, h);
}
/* Something burning (an enemy set alight, or you after a fire hit): orange flames, the will-o'-wisp's flame turned
   orange (`fx/flame-orange`), flickering all round it from its feet to its head, each on its own beat, about as tall
   as the body is wide (11px at least, so a small bug's show too); false until the picture is in (or in retro), so the
   dots stand in. */
const FLAMES = 9;
function drawFlames(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, now: number, seed: number, blue = false) {
  // the will-o'-wisp's own blue flame for its burns, the orange one for every other fire
  const img = fxImage(blue ? 'wisp-flame' : 'flame-orange');
  if (retroLook || !ready(img)) return false;
  const base = ctx.globalAlpha;
  ctx.save();
  for (let i = 0; i < FLAMES; i++) {
    const t = now * (2.2 + (i % 3) * 0.45) + seed * 0.37 + i * 0.61;
    const k = (t % 1 + 1) % 1;
    // All round the body, from the feet up to the head: each rises a little, shrinks and fades, and starts again.
    const a = i * 2.39 + seed;
    const up = i / (FLAMES - 1);
    const fx = x + Math.cos(a) * r * (0.75 + 0.25 * Math.sin(i * 1.7));
    const fy = y + r * 0.85 - up * r * 1.7 - k * r * 0.45;
    const h = Math.max(11, r * (0.95 + 0.3 * Math.sin(t * 3.1))) * (1 - k * 0.45);
    const w = (h * img.naturalWidth) / img.naturalHeight;
    ctx.globalAlpha = base * (1 - k * 0.75);
    ctx.drawImage(img, fx - w / 2, fy - h, w, h);
  }
  ctx.restore();
  return true;
}

/** What shows round the hero while a boss's hit lasts: bubbles of poison, sparks of the stun, frost. */
function drawStatus(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  const p = g.player;
  ctx.save();
  // Burnt by lava or a fireball: the same flames as a burning bug, over the hero's body.
  if (p.burn > 0) {
    ctx.globalAlpha = Math.min(1, p.burn / 0.3);
    drawFlames(ctx, p.x, p.y - p.r * 0.9, p.r * 1.3, now, 3);
    ctx.globalAlpha = 1;
  }
  if (p.poison > 0) {
    for (let i = 0; i < 4; i++) {
      const k = (now * 1.6 + i / 4) % 1;
      ctx.globalAlpha = (1 - k) * 0.85;
      ctx.fillStyle = i % 2 ? '#86efac' : '#22c55e';
      ctx.beginPath();
      ctx.arc(p.x + Math.sin(i * 2.1 + now * 3) * p.r * 0.8, p.y - p.r * (0.4 + k * 2.2), 2 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (p.stun > 0) {
    // Three little bolts circling the head.
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 8;
    for (let i = 0; i < 3; i++) {
      const a = now * 7 + (i * Math.PI * 2) / 3;
      const x = p.x + Math.cos(a) * p.r * 0.9;
      const y = p.y - p.r * 2.6 + Math.sin(a) * p.r * 0.3;
      ctx.beginPath();
      ctx.moveTo(x - 3, y - 5);
      ctx.lineTo(x + 1, y - 1);
      ctx.lineTo(x - 2, y + 1);
      ctx.lineTo(x + 3, y + 5);
      ctx.stroke();
    }
  }
  if (p.stone > 0) {
    // Turned to stone: grey chips crumbling off.
    ctx.fillStyle = '#a8a29e';
    for (let i = 0; i < 5; i++) {
      const k = (now * 1.2 + i / 5) % 1;
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.fillRect(p.x + Math.sin(i * 2.4) * p.r * 0.9 - 2, p.y - p.r * 2.2 + k * p.r * 2.4, 4, 3);
    }
    ctx.globalAlpha = 1;
  }
  if (p.mired > 0) {
    // Stuck in the mud: brown drops dripping off.
    ctx.fillStyle = '#854d0e';
    for (let i = 0; i < 4; i++) {
      const k = (now * 1.4 + i / 4) % 1;
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.beginPath();
      ctx.arc(p.x + Math.sin(i * 1.9) * p.r * 0.8, p.y - p.r * 0.5 + k * p.r * 1.2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (p.chill > 0) {
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = Math.min(1, p.chill / 0.3) * 0.9;
    for (let i = 0; i < 3; i++) {
      const a = now * 1.5 + (i * Math.PI * 2) / 3;
      snowflake(ctx, p.x + Math.cos(a) * p.r * 1.1, p.y - p.r * 1.2 + Math.sin(a) * p.r * 0.5, 4, now * 2 + i);
    }
  }
  ctx.restore();
}
/** The Shadow Wraith's hit: the view closes in round the hero for a moment. */
function drawDark(ctx: CanvasRenderingContext2D, g: Game, vis: Rect) {
  const p = g.player;
  const k = Math.min(1, p.dark / 0.4);
  // The view closes in tight round you, far tighter than the world's fog (the owner wanted it to cut the view more).
  const grad = ctx.createRadialGradient(p.x, p.y, 30, p.x, p.y, 120);
  grad.addColorStop(0, 'rgba(10,6,22,0)');
  grad.addColorStop(0.5, `rgba(10,6,22,${0.75 * k})`);
  grad.addColorStop(1, `rgba(10,6,22,${0.96 * k})`);
  ctx.fillStyle = grad;
  ctx.fillRect(vis.x, vis.y, vis.w, vis.h);
}

/** The haunted servers' fog, for good: only what is near you shows (as it was before it was taken out). */
function drawFog(ctx: CanvasRenderingContext2D, g: Game, vis: Rect) {
  const p = g.player;
  const grad = ctx.createRadialGradient(p.x, p.y, 70, p.x, p.y, 200);
  grad.addColorStop(0, 'rgba(8,9,15,0)');
  grad.addColorStop(0.6, 'rgba(8,9,15,0.6)');
  grad.addColorStop(1, 'rgba(8,9,15,0.86)');
  ctx.fillStyle = grad;
  ctx.fillRect(vis.x, vis.y, vis.w, vis.h);
}

/* Walking sideways, the two step pictures are nearly the same, so the legs are walked in code too. Nothing is cut:
   each picture is warped smoothly below the hip (the lowest 30% of the figure), every pixel moved sideways by more the
   nearer it is to the feet (so the hands and the blaster by the hip hardly move), the back leg one way and the front
   leg the other, blended across the gap between the shoes (`stepFrames`, read from the picture's own pixels), and the
   leg swinging forward lifts its foot a little. Each output pixel is sampled from where it came from (bilinear, on
   premultiplied colour), so no hole or seam can open. `STEP_FRAMES` frames a stride are worked out once per picture. */
const SIDE_WALK = new Set<Pose>(['walk', 'walk2', 'wshoot', 'wshoot2']);
/* Sets with the owner's own side walk cycle (`hero/<set>-swalk-0..3` and, aiming, `-saim-0..3`: contact, passing,
   the other contact, passing), cut from his sheet on one canvas per row, head centred and feet on the bottom, at the
   walk picture's scale (`scratchpad` `sidewalk/cut.py`); the other sets keep the warp below until theirs come. */
const SIDE_CYCLE = new Set(['boy-base', 'boy-wizard', 'boy-helm', 'boy-bandana', 'boy-crown']);
/** Seconds each frame of the side walk cycle shows (a full stride is four). */
const SIDE_STEP = 0.12;
const sideCycles = new Map<string, HTMLImageElement[]>();
function sideCycle(key: string, aim: boolean) {
  if (!SIDE_CYCLE.has(key)) return null;
  const name = `${key}-${aim ? 'saim' : 'swalk'}`;
  let frames = sideCycles.get(name);
  if (!frames) {
    frames = [0, 1, 2, 3].map((i) => Object.assign(new Image(), { src: `./images/game/hero/${name}-${i}.webp` }));
    sideCycles.set(name, frames);
  }
  return frames.every(ready) ? frames : null;
}
const STRIDE = 0.42;
/** How far a foot swings, as a share of the leg's length, and how high the passing foot lifts (share of the figure). */
const LEG_SWING = 0.42;
const FOOT_LIFT = 0.035;
const STEP_FRAMES = 12;
type Steps = { frames: HTMLCanvasElement[]; pad: number };
const stepCache = new WeakMap<HTMLImageElement, Steps | null>();
function stepFrames(img: HTMLImageElement): Steps | null {
  if (stepCache.has(img)) return stepCache.get(img)!;
  let steps: Steps | null = null;
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const t = c.getContext('2d', { willReadFrequently: true });
    if (t) {
      t.drawImage(img, 0, 0);
      const src = t.getImageData(0, 0, w, h).data;
      const alpha = (x: number, y: number) => src[(y * w + x) * 4 + 3];
      let top = 0;
      while (top < h - 1 && !Array.from({ length: w }, (_, x) => alpha(x, top) > 100).some(Boolean)) top += 1;
      let bottom = h - 1;
      while (bottom > top && !Array.from({ length: w }, (_, x) => alpha(x, bottom) > 100).some(Boolean)) bottom -= 1;
      const fig = bottom - top;
      const hip = bottom - fig * 0.3;
      const leg = bottom - hip;
      // Between the shoes: the widest empty run across the lowest rows (the middle of the feet when they touch).
      const rows = Math.max(3, Math.round(fig * 0.08));
      const filled = Array.from({ length: w }, (_, x) => { for (let y = bottom - rows + 1; y <= bottom; y++) if (alpha(x, y) > 100) return true; return false; });
      const first = filled.indexOf(true);
      const last = filled.lastIndexOf(true);
      if (first < 0) throw new Error('no feet');
      let split = (first + last) / 2;
      let best = 0;
      for (let x = first; x <= last; x++) {
        if (filled[x]) continue;
        let e = x;
        while (e <= last && !filled[e]) e += 1;
        if (e - x > best) { best = e - x; split = (x + e) / 2; }
        x = e;
      }
      const soft = Math.max(2.5, (last - first) * 0.12);
      // Premultiplied copy, so the edges blend cleanly.
      const pm = new Float32Array(w * h * 4);
      for (let k = 0; k < w * h; k++) {
        const a = src[k * 4 + 3] / 255;
        pm[k * 4] = src[k * 4] * a; pm[k * 4 + 1] = src[k * 4 + 1] * a; pm[k * 4 + 2] = src[k * 4 + 2] * a; pm[k * 4 + 3] = src[k * 4 + 3];
      }
      const pad = Math.ceil(leg * LEG_SWING) + 4;
      const W = w + pad * 2;
      const frames: HTMLCanvasElement[] = [];
      for (let f = 0; f < STEP_FRAMES; f++) {
        const phase = (f / STEP_FRAMES) * Math.PI * 2;
        const swing = Math.sin(phase) * LEG_SWING * leg;
        const out = new ImageData(W, h);
        const d = out.data;
        for (let y = 0; y < h; y++) {
          const k = y <= hip ? 0 : Math.min(1, (y - hip) / leg) ** 1.6;
          for (let X = 0; X < W; X++) {
            const x = X - pad;
            const side = Math.tanh((x - split) / soft);
            const lift = side < 0 ? Math.max(0, Math.cos(phase)) : Math.max(0, -Math.cos(phase));
            const sx = x + side * swing * k;
            const sy = y + FOOT_LIFT * h * lift * k * (Math.abs(side));
            // Bilinear sample of the premultiplied picture.
            const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
            let r = 0, gg = 0, b = 0, a = 0;
            for (const [px, py, wt] of [[x0, y0, (1 - fx) * (1 - fy)], [x0 + 1, y0, fx * (1 - fy)], [x0, y0 + 1, (1 - fx) * fy], [x0 + 1, y0 + 1, fx * fy]]) {
              if (wt <= 0 || px < 0 || py < 0 || px >= w || py >= h) continue;
              const q = (py * w + px) * 4;
              r += pm[q] * wt; gg += pm[q + 1] * wt; b += pm[q + 2] * wt; a += pm[q + 3] * wt;
            }
            if (a < 1) continue;
            const o = (y * W + X) * 4;
            const un = 255 / a;
            d[o] = r * un; d[o + 1] = gg * un; d[o + 2] = b * un; d[o + 3] = a;
          }
        }
        const fc = document.createElement('canvas');
        fc.width = W;
        fc.height = h;
        fc.getContext('2d')?.putImageData(out, 0, 0);
        frames.push(fc);
      }
      steps = { frames, pad };
    }
  } catch { steps = null; }
  stepCache.set(img, steps);
  return steps;
}
function drawStriding(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, steps: Steps, now: number, tint: [string, number] | null) {
  const cycle = (now / STRIDE) % 1;
  const frame = steps.frames[Math.floor(cycle * STEP_FRAMES) % STEP_FRAMES];
  // A little lift as each foot passes under the body.
  const lift = Math.abs(Math.cos(cycle * Math.PI * 2)) * h * 0.012;
  const k = w / img.naturalWidth;
  drawTinted(ctx, frame, -w / 2 - steps.pad * k, -h - lift, frame.width * k, h, tint);
}

/** The Medusa's deep gaze: while you stand within it, her reach as a dashed ring in her colour and, round your feet,
    an arc filling as it builds towards the stone. */
function drawGaze(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  const m = g.enemies.find((e) => e.bossId === 'medusa' && e.gaze && !e.dead);
  if (!m) return;
  const p = g.player;
  const tone = m.phase > 1 ? '45, 212, 191' : '192, 132, 252';
  const k = Math.min(1, p.gaze / GAZE.hold);
  ctx.save();
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.lineDashOffset = -now * 30;
  ctx.strokeStyle = `rgba(${tone}, ${0.35 + 0.4 * k})`;
  ctx.beginPath();
  ctx.arc(m.x, m.y, GAZE.reach + m.r + GAZE.out, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 4;
  ctx.strokeStyle = `rgba(${tone}, 0.25)`;
  ctx.beginPath();
  ctx.arc(p.x, p.y + 4, p.r + 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(${k > 0.75 ? '248, 113, 113' : tone}, 0.95)`;
  ctx.beginPath();
  ctx.arc(p.x, p.y + 4, p.r + 8, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
/** Safe mode: the owner's golden force-field bubble round the hero while it lasts, breathing, fading in and out. */
function drawSafeBubble(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  const p = g.player;
  if (p.safe <= 0 || retroLook) return;
  const pic = fxImage('safe-bubble');
  if (!ready(pic)) return;
  const w = p.r * 4.4 * (1 + 0.04 * Math.sin(now * 9));
  const h = (w * pic.naturalHeight) / pic.naturalWidth;
  ctx.globalAlpha = Math.min(1, p.safe / 0.3) * 0.85;
  ctx.drawImage(pic, p.x - w / 2, p.y - p.r * 0.9 - h / 2, w, h);
  ctx.globalAlpha = 1;
}
function drawPlayer(ctx: CanvasRenderingContext2D, g: Game, pal: Palette, now: number) {
  const { accent, accent2 } = pal;
  const p = g.player;
  // Blinking while invulnerable, but never once the run is over (inv stops running down there).
  if (p.inv > 0 && g.phase === 'play' && Math.floor(now * 20) % 2 === 0) return;
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
    const tint = g.phase === 'play' ? heroTint(g) : null;
    // The owner's own side walk cycle when the set has one (four frames, legs passing in turn); otherwise the warp.
    const cycle = full && p.moving && SIDE_WALK.has(pose) ? sideCycle(heroKey(pal.skin ?? 'boy', pal.hat), pose === 'wshoot' || pose === 'wshoot2') : null;
    const steps = !cycle && full && p.moving && SIDE_WALK.has(pose) ? stepFrames(img) : null;
    if (cycle) {
      const f = cycle[Math.floor(now / SIDE_STEP) % cycle.length];
      const fh = p.r * 3.05 * (f.naturalHeight / FULL_BASE_H);
      const fw = (fh * f.naturalWidth) / f.naturalHeight;
      drawTinted(ctx, f, -fw / 2, -fh, fw, fh, tint);
    } else if (steps) drawStriding(ctx, img, w, h, steps, now, tint);
    else drawTinted(ctx, img, -w / 2, -h, w, h, tint);
    ctx.restore();
    barTop = p.y + p.r * 0.9 - h - 9;
    if (g.phase === 'play') drawStatus(ctx, g, now);
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
  // Down on the floor: no aim marker and no empty health bar over the fallen hero.
  if (g.phase === 'over') return;
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

/** Fusions whose arrow is an animated sheet with its trail painted in (`arrows/fusion-<id>-<frame>.webp`), and how long it is drawn. */
const FUSION_ANIM: Partial<Record<Fusion, { frames: number; len: number }>> = { plasma: { frames: 4, len: 100 }, shock: { frames: 4, len: 100 }, steam: { frames: 4, len: 100 } };

/* An arrow's picture (and its trail) reaches back only as far as the arrow has flown, so a fresh shot grows
   out of the bow instead of starting with its whole trail laid over the hero. */
const flown = new WeakMap<Shot, { x: number; y: number; d: number }>();
function clipFlown(ctx: CanvasRenderingContext2D, a: Shot) {
  let f = flown.get(a);
  if (!f) { f = { x: a.x, y: a.y, d: 0 }; flown.set(a, f); }
  f.d += Math.hypot(a.x - f.x, a.y - f.y);
  f.x = a.x;
  f.y = a.y;
  const back = f.d + 12;
  if (back > 400) return;
  ctx.beginPath();
  ctx.rect(-back, -60, back + 8, 120);
  ctx.clip();
}

function drawShots(ctx: CanvasRenderingContext2D, g: Game, accent: string, accent2: string) {
  const look = arrowLook(g);
  const element = look && ARROW_PICTURES.includes(look) ? look : null;
  // The fused arrow only while that look is worn (the fusion's effects apply whatever the look).
  const fusion = look === 'fusion' ? fusionOf(g) : null;
  ctx.lineCap = 'round';
  for (const [i, a] of g.shots.entries()) {
    // A fused arrow with the owner's animated sheet (the arrow and its trail in one, looping): drawn long, tip on the shot.
    const anim = fusion && FUSION_ANIM[fusion];
    if (anim && a.bow && a.kind === 'arrow' && !retroLook) {
      const pic = arrowImage(`fusion-${fusion}-${Math.floor(g.time * 12 + i) % anim.frames}`);
      if (ready(pic)) {
        const w = anim.len;
        const h = (w * pic.naturalHeight) / pic.naturalWidth;
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(Math.atan2(a.vy, a.vx));
        clipFlown(ctx, a);
        ctx.drawImage(pic, -w, -h / 2, w, h);
        ctx.restore();
        continue;
      }
    }
    // A fused arrow: the owner's arrow for that fusion (it carries its own trail), else a glow in its colour.
    if (fusion && a.bow && a.kind === 'arrow' && !retroLook) {
      const pic = arrowImage(`fusion-${fusion}`);
      if (ready(pic)) {
        // About as long as a plain arrow with its trail, over a glow in the fusion's colour.
        const w = Math.min(64, (10 * pic.naturalWidth) / pic.naturalHeight);
        const h = (w * pic.naturalHeight) / pic.naturalWidth;
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(Math.atan2(a.vy, a.vx));
        clipFlown(ctx, a);
        ctx.globalCompositeOperation = 'lighter';
        const glow = ctx.createRadialGradient(-w * 0.3, 0, 1, -w * 0.3, 0, w * 0.55);
        glow.addColorStop(0, `rgba(${FUSION_COLOR[fusion]},0.3)`);
        glow.addColorStop(1, `rgba(${FUSION_COLOR[fusion]},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(-w * 0.3, 0, w * 0.6, h * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
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
        const w = 30 * grow(g, 'knives');
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
        const h = 26 * grow(g, 'boomerang');
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
      // Once fused, the trail is always the fusion's (particles from world.ts), whatever arrow is worn.
      const whole = element === 'bolt';
      const ownTrail = !whole && !fusionOf(g);
      const trail = arrowImage(`${element}-trail`);
      if (arrow.complete && arrow.naturalWidth) {
        // The tip sits on the shot's point; the picture points right.
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(Math.atan2(a.vy, a.vx));
        clipFlown(ctx, a);
        if (ownTrail && trail.complete && trail.naturalWidth) {
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
/** Weapon pictures grow with the weapon's level: 15% a level, so level 3 is drawn 1.3 times level 1 (an evolved
    form has its own, bigger picture and size). */
const grow = (g: Game, k: SkillId) => 1 + 0.15 * Math.max(0, (g.skills[k] ?? 1) - 1);
const SHOT_PIC: Partial<Record<Shot['kind'], (g: Game, a: Shot) => [string, number, number, boolean]>> = {
  brick: (g) => (g.evolved.brick ? ['iron', 52, 0.5, false] : ['brick', 30 * grow(g, 'brick'), 0.6, true]),
  molotov: (g) => (g.evolved.molotov ? ['barrel', 44, 0.6, true] : ['molotov', 36 * grow(g, 'molotov'), 0.6, true]),
  durian: (g, a) => [g.evolved.durian ? 'durian-big' : 'durian', (a.size ?? 14) * 2.5, 0.62, true],
  drill: (g, a) => [g.evolved.drill ? 'drill-evo' : 'drill', 38 * ((a.size ?? 7) / 7), 0.75, true],
  rocket: (g) => (g.evolved.rocket ? ['rocket-shark', 56, 0.75, true] : ['rocket', 42 * grow(g, 'rocket'), 0.75, true]),
  // The quantum ball's picture is mostly glow (the ball itself is under half its width): drawn wider to match its hit.
  ball: (g, a) => (g.evolved.ball ? ['ball-evo', (a.size ?? 14) * 4.2, 0.55, true] : ['ball', (a.size ?? 8) * 3.2, 0.62, true]),
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
      // The molotov and the barrel tumble round their middle as they fly.
      const tumble = a.kind === 'molotov';
      if (tumble) ctx.rotate(a.spin);
      else if (turn) ctx.rotate(Math.atan2(a.vy, a.vx));
      else ctx.rotate(Math.sin(t * 6 + a.x) * 0.15);
      ctx.drawImage(pic, -w * (tumble ? 0.5 : back), -h / 2, w, h);
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
    if (f.vine) {
      // A vine row: its whole length along the line, growing out from the boss's end, fading at the last.
      // The picture is laid end to end at the row's thickness (about its thorns' reach), not stretched.
      const w = f.r * 2;
      const h = 46;
      const tile = (h * pic.naturalWidth) / pic.naturalHeight;
      const grow = Math.min(1, (f.max - f.life) / 0.25);
      ctx.globalAlpha = Math.min(1, f.life / 0.4);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.a);
      ctx.beginPath();
      ctx.rect(-w / 2, -h, w * grow, h * 2);
      ctx.clip();
      for (let x = -w / 2; x < w / 2; x += tile * 0.92) ctx.drawImage(pic, x, -h * 0.6, tile, h);
      ctx.restore();
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
/** A fire pool picture over a circle of radius `r`: never turned, only zooming in and out a little (`FIRE_ZOOM`),
   each pool on its own beat. Molotov pools, the inferno's ground and lava all use it. */
const FIRE_ZOOM = { by: 0.07, rate: 2.2 };
function drawFirePool(ctx: CanvasRenderingContext2D, pic: HTMLImageElement, x: number, y: number, r: number, now: number) {
  const w = r * 2.1 * (1 + FIRE_ZOOM.by * Math.sin(now * FIRE_ZOOM.rate + x * 0.07 + y * 0.05));
  const h = (w * pic.naturalHeight) / pic.naturalWidth;
  ctx.drawImage(pic, x - w / 2, y - h / 2, w, h);
}
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
      // The owner's fire pool, breathing in and out a little, fading in its last half second.
      ctx.globalAlpha = Math.min(1, em.life * 2) * 0.72;
      drawFirePool(ctx, pool, em.x, em.y, em.r, now);
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
    if (evolved && e.kind !== 'boss') {
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
  const orbit = sawOrbit(g);
  const glow = BLADE_LOOK[el][3];
  const size = 24 * sawScale(g);
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
  const orbit = sawOrbit(g);
  const [edge, base, hilt, glow] = BLADE_LOOK[bladeElement(g)];
  for (let i = 0; i < n; i++) {
    const a = g.gear.bladeAngle + (i / n) * Math.PI * 2;
    ctx.save();
    ctx.translate(p.x + Math.cos(a) * orbit, p.y + Math.sin(a) * orbit);
    ctx.rotate(a + Math.PI / 2);
    ctx.scale(sawScale(g), sawScale(g));
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
  for (const n of ['fireball', 'boom-small', 'boom-big', 'knife', 'boomerang', 'slash', 'chest', 'slam', 'crystals', 'gem', 'gem-big', 'bolt-1', 'bolt-2', 'bolt-3', 'bolt-4', 'bolt-5', 'bolt-6', 'bolt-y-1', 'bolt-y-2', 'bolt-y-3', 'bolt-y-4', 'bolt-y-5', 'bolt-y-6',
    'brick', 'iron', 'molotov', 'barrel', 'durian', 'durian-big', 'drill', 'drill-evo', 'rocket', 'rocket-shark', 'ball', 'ball-evo', 'phoenix-0', 'phoenix-1', 'phoenix-2', 'phoenix-3', 'wings-0', 'wings-1', 'wings-2',
    'fire-pool', 'fire-pool-big', 'caltrops', 'mine', 'mine-on', 'mine-volt', 'volt-burst', 'impact', 'heart', 'rune', 'crescent',
    'steam-cloud', 'plasma-burst', 'segfault', 'crit-spark', 'lag-trail', 'safe-bubble', 'nova-burst', 'wisp-flame', 'shock-ring', 'ice-block', 'spectral-bolt', 'laser-yellow', 'laser-orange', 'laser-red', 'laser-purple', 'drakkar-wreck', 'vine-row-0', 'vine-row-1', 'wave-strip-0', 'wave-strip-1', 'wave-strip-2', ...Array.from({ length: 7 }, (_, i) => `tornado-${i}`), 'vortex-0', 'vortex-1']) fxImage(n);
}

function drawFireballs(ctx: CanvasRenderingContext2D, g: Game) {
  const pic = fxImage('fireball');
  for (const f of g.fireballs) {
    if (!retroLook && ready(pic)) {
      // The ball sits at the picture's right end, the flames trail behind it.
      const w = 52 * grow(g, 'fireball');
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

/* The Phoenix plate: wings of fire. Worn and unused, faint wings spread
   behind the hero (`g.revives`); when it saves you, a firebird rises off you
   with its wings wide and a ring of flame runs out over the floor. Drawn in
   code; retro shows neither. */
/** A bird's wing in unit coordinates (side 1 points right): the leading edge sweeps up to the tip, and pointed feathers come back to the body. */
const WING: [number, number][] = [[1.15, -0.95], [0.95, -0.55], [1.08, -0.42], [0.8, -0.22], [0.88, 0.0], [0.6, 0.02], [0.62, 0.28], [0.4, 0.14], [0.34, 0.4], [0.1, 0.14]];
function flameWing(ctx: CanvasRenderingContext2D, side: number, span: number, flap: number) {
  const px = (x: number) => side * span * x;
  const py = (y: number, x: number) => span * y - flap * x;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(px(0.25), py(-0.6, 0.25), px(0.75), py(-1.0, 0.75), px(WING[0][0]), py(WING[0][1], WING[0][0]));
  for (let i = 1; i < WING.length; i++) {
    const [x, y] = WING[i];
    const [x0, y0] = WING[i - 1];
    // Into each notch on a soft curve, out to each feather's point straight.
    if (i % 2) ctx.quadraticCurveTo(px((x + x0) / 2 + 0.06), py((y + y0) / 2, x), px(x), py(y, x));
    else ctx.lineTo(px(x), py(y, x));
  }
  ctx.closePath();
}
function drawPhoenixWings(ctx: CanvasRenderingContext2D, x: number, y: number, span: number, now: number, alpha: number) {
  if (retroLook) return;
  const flap = Math.sin(now * 5) * span * 0.1;
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = 'rgba(255,120,20,0.9)';
  ctx.shadowBlur = span * 0.25;
  for (const side of [-1, 1]) {
    const grad = ctx.createLinearGradient(0, 0, side * span * 1.1, -span * 0.6);
    grad.addColorStop(0, `rgba(255,236,150,${alpha})`);
    grad.addColorStop(0.3, `rgba(255,170,30,${alpha})`);
    grad.addColorStop(0.7, `rgba(240,80,20,${alpha * 0.9})`);
    grad.addColorStop(1, `rgba(190,30,20,${alpha * 0.25})`);
    ctx.fillStyle = grad;
    flameWing(ctx, side, span, flap);
    ctx.fill();
    // The hot inner feathers.
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(255,230,140,${alpha * 0.55})`;
    flameWing(ctx, side, span * 0.55, flap * 0.55);
    ctx.fill();
    ctx.shadowBlur = span * 0.25;
  }
  ctx.shadowBlur = 0;
  // Embers drifting up off the wings.
  for (let i = 0; i < 6; i++) {
    const k = (now * 0.6 + i / 6) % 1;
    const side = i % 2 ? 1 : -1;
    ctx.fillStyle = `rgba(255,190,70,${alpha * (1 - k)})`;
    ctx.beginPath();
    ctx.arc(side * span * (0.35 + ((i * 0.37) % 0.6)), -span * (0.3 + k * 0.9), 1.6 + (1 - k) * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
/* The owner's wings of fire behind the shoulders, three poses (half open, spread, raised) on one canvas with
   the join between the wings at the same point (`WINGS_JOIN` of the height), flapping slowly; the drawn
   wings stand in until they load. */
const WINGS_JOIN = 0.5733;
/* The Phoenix cloak at ★3: the owner's wings of fire (`wings-0..2`), the same pair from every side, at the owner's
   request: in front of the hero walking away, behind it facing us, and side on only the wing on its back. */
function drawHeroWings(ctx: CanvasRenderingContext2D, g: Game, pal: Palette, now: number, overHero: boolean) {
  if (retroLook || g.phase === 'over') return;
  const p = g.player;
  if (p.inv > 0 && g.phase === 'play' && Math.floor(now * 20) % 2 === 0) return;
  const full = FULL_SETS.has(heroKey(pal.skin ?? 'boy', pal.hat));
  const pose = heroPose(g, now, full);
  const back = pose === 'back';
  if (back !== overHero) return;
  const x = p.x;
  const y = p.y - p.r * 0.75;
  // From the back and from the front, the same pair of wings (behind the hero when it faces you); from the
  // side, only the wing on its back: the left one when it faces right, the right one when it faces left.
  const facing = pose === 'front' || pose === 'fwalk' || pose === 'fwalk2' || pose === 'cheer';
  if (back || facing) { drawWornWings(ctx, x, y, p.r, now); return; }
  const turn = pose === 'wshoot' || pose === 'wshoot2' || !p.moving ? p.face : p.heading;
  drawWornWings(ctx, x, y, p.r, now, Math.cos(turn) < 0 ? 'right' : 'left');
}

/* One flap: spread, raised, spread, half open; each pose fades into the next, so it flows rather than steps. */
const WING_FLAP = [1, 2, 1, 0];
const FLAPS_PER_SECOND = 1.4;
function drawWornWings(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, now: number, only?: 'left' | 'right') {
  if (retroLook) return;
  const pics = [0, 1, 2].map((i) => fxImage(`wings-${i}`));
  if (!pics.every(ready)) { drawPhoenixWings(ctx, x, y, r * 1.7, now, 0.55); return; }
  const t = now * FLAPS_PER_SECOND * WING_FLAP.length;
  const i = Math.floor(t) % WING_FLAP.length;
  const k = t - Math.floor(t);
  const blend = k * k * (3 - 2 * k);
  const w = r * 5.2;
  // Between the poses the wings also sweep open and shut without a break, and the body lifts on each downstroke.
  const beat = Math.sin(now * FLAPS_PER_SECOND * Math.PI * 2);
  const lift = beat * 1.4;
  ctx.save();
  ctx.translate(x, y);
  // Seen from the side only the wing on the hero's back shows: the other half of the picture is clipped away.
  if (only) {
    ctx.beginPath();
    ctx.rect(only === 'left' ? -w : 0, -w * 2, w, w * 4);
    ctx.clip();
  }
  ctx.scale(0.86 + 0.14 * (beat * 0.5 + 0.5), 1);
  for (const [pose, alpha] of [[WING_FLAP[i], 1 - blend], [WING_FLAP[(i + 1) % WING_FLAP.length], blend]]) {
    if (alpha <= 0.01) continue;
    const pic = pics[pose];
    const h = (w * pic.naturalHeight) / pic.naturalWidth;
    ctx.globalAlpha = 0.92 * alpha;
    ctx.drawImage(pic, -w / 2, -h * WINGS_JOIN + lift, w, h);
  }
  ctx.restore();
}
function drawPhoenixRise(ctx: CanvasRenderingContext2D, f: Fx, now: number, layer: 'under' | 'over') {
  const t = 1 - f.life / f.max;
  const fade = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
  if (layer === 'under') {
    // The ring of flame running out over the floor.
    const r = f.r * (0.4 + t * 2.2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (1 - t) * 0.9;
    const ring = ctx.createRadialGradient(f.x, f.y + 10, r * 0.7, f.x, f.y + 10, r);
    ring.addColorStop(0, 'rgba(255,170,40,0)');
    ring.addColorStop(0.7, 'rgba(255,190,60,0.85)');
    ring.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.ellipse(f.x, f.y + 10, r, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  // The owner's firebird, four frames: rising out of its flame, opening its wings, spread wide, breaking into sparks.
  const frame = t < 0.18 ? 0 : t < 0.36 ? 1 : t < 0.72 ? 2 : 3;
  const pic = fxImage(`phoenix-${frame}`);
  if (ready(pic)) {
    const h = f.r * 1.75;
    const w = (h * pic.naturalWidth) / pic.naturalHeight;
    const lift = Math.max(0, t - 0.3) * 80;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.drawImage(pic, f.x - w / 2, f.y + 18 - h - lift, w, h);
    ctx.restore();
    return;
  }
  // Until the pictures are in: the firebird drawn in code opens its wings over you, then rises and fades.
  const open = Math.min(1, t / 0.3);
  const rise = Math.max(0, t - 0.25) * 140;
  const y = f.y - 30 - rise;
  ctx.save();
  ctx.globalAlpha = fade;
  // A column of light under it.
  const col = ctx.createLinearGradient(0, f.y, 0, y - 40);
  col.addColorStop(0, 'rgba(255,150,30,0.5)');
  col.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = col;
  ctx.fillRect(f.x - 14, y - 40, 28, f.y - y + 40);
  drawPhoenixWings(ctx, f.x, y, f.r * (0.35 + 0.85 * open), now, 0.95);
  ctx.shadowColor = 'rgba(255,120,20,0.9)';
  ctx.shadowBlur = 14;
  // Its body and long tail of fire.
  const body = ctx.createLinearGradient(0, y - 20, 0, y + 56);
  body.addColorStop(0, '#fff3b0');
  body.addColorStop(0.35, '#ffa51f');
  body.addColorStop(0.8, '#e5441a');
  body.addColorStop(1, 'rgba(200,30,20,0)');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(f.x, y - 18);
  ctx.bezierCurveTo(f.x + 13, y - 6, f.x + 10, y + 18, f.x + Math.sin(now * 18) * 4, y + 56);
  ctx.bezierCurveTo(f.x - 10, y + 18, f.x - 13, y - 6, f.x, y - 18);
  ctx.fill();
  // The head, with a beak and a crest of three flames.
  ctx.fillStyle = '#ffd25a';
  ctx.beginPath();
  ctx.arc(f.x, y - 22, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff7a1a';
  ctx.beginPath();
  ctx.moveTo(f.x + 6, y - 24);
  ctx.lineTo(f.x + 15, y - 21);
  ctx.lineTo(f.x + 6, y - 18);
  ctx.fill();
  ctx.fillStyle = '#ff9a2a';
  for (const [dx, h] of [[-5, 12], [0, 16], [5, 11]]) {
    ctx.beginPath();
    ctx.moveTo(f.x + dx - 3, y - 27);
    ctx.quadraticCurveTo(f.x + dx - 2, y - 27 - h * 0.6, f.x + dx + 1, y - 27 - h);
    ctx.quadraticCurveTo(f.x + dx + 2, y - 27 - h * 0.5, f.x + dx + 3, y - 27);
    ctx.fill();
  }
  ctx.fillStyle = '#3b1d00';
  ctx.beginPath();
  ctx.arc(f.x + 3, y - 23, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFx(ctx: CanvasRenderingContext2D, g: Game, accent: string, layer: 'under' | 'over') {
  for (const f of g.fx) {
    if (f.kind === 'phoenix') {
      // The firebird rises with you, wherever you run.
      f.x = g.player.x;
      f.y = g.player.y;
      // The ring goes on the floor; the bird itself is drawn just before the hero (drawPhoenixBirds).
      if (!retroLook && layer === 'under') drawPhoenixRise(ctx, f, g.time, layer);
      continue;
    }
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
      } else if (!retroLook && ready(fxImage(f.blue ? 'bolt-6' : 'bolt-y-6'))) {
        // The painted strike: a bolt frame for the first part, then the ground burst (the owner's blue
        // for evolved weapons and Zeus, a yellow copy for the rest).
        const frame = t < 0.6 ? 1 + Math.floor(t * 8) % 5 : 6;
        const pic = fxImage(`${f.blue ? 'bolt' : 'bolt-y'}-${frame}`);
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

/* Boss shots drawn with the weapons' pictures: which picture, how wide, and where along it the shot's
   point sits (1 = the right-hand tip; the fireball's ball is at 0.78). Arrows bring their trail.
   Drawn well past their hit circles (a rocket of r 6 is 48 wide) so they read as big boss shots. */
const ORB_PIC: Record<OrbPic | 'medusa2', { src: 'fx' | 'arrow'; name: string; w: number; at: number; trail?: string; glow?: number }> = {
  // The backlog's bug reports: a crumpled error sheet in purple glitch energy, four of them (`glitch-0..3`, one per shot).
  glitch: { src: 'fx', name: 'glitch-0', w: 66, at: 0.8 },
  // The mud world's: the Medusa's purple bolt, the Mud Monster's mud ball, the bats' venom.
  medusa: { src: 'fx', name: 'medusa-bolt', w: 48, at: 0.95 },
  medusa2: { src: 'fx', name: 'medusa-bolt-2', w: 48, at: 0.95 },
  // The haunted servers' Lich: purple embers, the orange flame turned purple and laid on its side.
  ember: { src: 'fx', name: 'ember-purple', w: 34, at: 0.72 },
  mudball: { src: 'fx', name: 'mudball', w: 36, at: 0.72 },
  venom: { src: 'fx', name: 'venom', w: 26, at: 0.75 },
  tornado: { src: 'fx', name: 'tornado-0', w: 0, at: 0 },
  fireball: { src: 'fx', name: 'fireball', w: 44, at: 0.78 },
  rocket: { src: 'fx', name: 'rocket', w: 48, at: 0.75 },
  shark: { src: 'fx', name: 'rocket-shark', w: 62, at: 0.75 },
  durian: { src: 'fx', name: 'durian', w: 38, at: 0.5 },
  leaf: { src: 'arrow', name: 'leaf', w: 32, at: 1, trail: 'leaf-trail' },
  // The Queen's acid: a bigger leaf arrow in a wide, pale glow, so it stands out on the jungle floor.
  acid: { src: 'arrow', name: 'leaf', w: 46, at: 1, trail: 'leaf-trail', glow: 2.6 },
  water: { src: 'arrow', name: 'water', w: 32, at: 1, trail: 'water-trail' },
  ghost: { src: 'arrow', name: 'ghost', w: 32, at: 1, trail: 'ghost-trail' },
  spark: { src: 'arrow', name: 'spark', w: 32, at: 1, trail: 'spark-trail' },
  bolt: { src: 'arrow', name: 'bolt', w: 40, at: 1 },
};
function drawOrbs(ctx: CanvasRenderingContext2D, g: Game) {
  // Boss shots' tracks first, under the shots: soft dabs in the shot's colour, shrinking as they fade.
  for (const d of g.bossTrail) {
    const k = d.life / d.max;
    const r = d.r * (0.5 + 0.5 * k);
    ctx.globalAlpha = 0.75 * k;
    const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r * 1.5);
    grad.addColorStop(0, '#fff3c4');
    grad.addColorStop(0.35, d.tone);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(d.x, d.y, r * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const o of g.orbs) {
    // Nocthrax's tornadoes, the owner's pictures: a turning vortex on the floor while it forms, then the
    // funnel standing on its spot, its seven shapes in a loop so it churns, swaying a little.
    if (o.pic === 'tornado' && !retroLook) {
      const forming = (o.wait ?? 0) > 0;
      const pic = forming ? fxImage(`vortex-${o.x > o.y ? 0 : 1}`) : fxImage(`tornado-${Math.floor(g.time * 14 + o.x) % 7}`);
      if (ready(pic)) {
        ctx.save();
        ctx.translate(o.x, o.y);
        if (forming) {
          const k = 1 - Math.min(1, (o.wait ?? 0) / 0.9);
          ctx.globalAlpha = 0.5 + 0.5 * k;
          ctx.scale(1, 0.5);
          ctx.rotate(g.time * 5);
          const s = o.r * (1.6 + 1.4 * k);
          ctx.drawImage(pic, -s, -s, s * 2, s * 2);
        } else {
          ctx.rotate(Math.sin(g.time * 6 + o.y) * 0.06);
          const h = o.r * 5.2;
          const w = (h * pic.naturalWidth) / pic.naturalHeight;
          ctx.drawImage(pic, -w / 2, o.r * 0.8 - h, w, h);
        }
        ctx.restore();
        continue;
      }
    }
    const look = o.pic && !retroLook ? ORB_PIC[o.pic === 'medusa' && o.alt ? 'medusa2' : o.pic] : undefined;
    const pic = look && (look.src === 'fx' ? fxImage(o.pic === 'glitch' ? `glitch-${Math.abs(Math.round(o.vx * 7 + o.vy * 13)) % 4}` : look.name) : arrowImage(look.name));
    if (look && pic && ready(pic)) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(Math.atan2(o.vy, o.vx));
      // A soft glow in the shot's colour so it still reads as dangerous.
      const gr = o.r * (look.glow ?? 1.6);
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, gr);
      glow.addColorStop(0, `${o.tone || '#ff6b6b'}${look.glow ? 'cc' : '88'}`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, gr, 0, Math.PI * 2);
      ctx.fill();
      if (look.trail) {
        const trail = arrowImage(look.trail);
        if (ready(trail)) {
          const tw = 46;
          const th = (tw * trail.naturalHeight) / trail.naturalWidth;
          ctx.globalAlpha = 0.85;
          ctx.drawImage(trail, -look.w * look.at - tw * 0.85, -th / 2, tw, th);
          ctx.globalAlpha = 1;
        }
      }
      const h = (look.w * pic.naturalHeight) / pic.naturalWidth;
      ctx.drawImage(pic, -look.w * look.at, -h / 2, look.w, h);
      ctx.restore();
      continue;
    }
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
    // Lightning is yellow; blue only for evolved weapons and Zeus.
    const sky = !!z.blue;
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
  fire: ['249,115,22', '254,215,170'], water: ['56,189,248', '224,242,254'], mud: ['161,98,7', '253,230,138'], arcane: ['192,38,211', '245,208,254'], leaf: ['74,222,128', '220,252,231'],
  bolt: ['250,204,21', '254,249,195'], laser: ['239,68,68', '254,226,226'], shadow: ['167,139,250', '237,233,254'], glitch: ['192,132,252', '243,232,255'],
};

/** Scratch canvases for the wave's two sides, grown as needed and reused every frame. */
const waveCanvases: HTMLCanvasElement[] = [];
let waveTurn = 0;
function waveCanvas(w: number, h: number): HTMLCanvasElement {
  const c = (waveCanvases[waveTurn++ % 4] ??= document.createElement('canvas'));
  if (c.width < w) c.width = w;
  if (c.height < h) c.height = h;
  return c;
}

function drawThreats(ctx: CanvasRenderingContext2D, g: Game, now: number, top: boolean) {
  for (const t of g.threats) {
    const live = t.warn <= 0;
    if (top !== (live && (t.kind === 'beam' || t.kind === 'wave'))) continue;
    const [c, light] = t.blue ? THREAT_TONE.water : t.alt ? ['45,212,191', '204,251,241'] : THREAT_TONE[t.el];
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
        ctx.setLineDash([]);
        // Mud balls: the painted ball lobbed down onto its circle; the Medusa's rune opening and turning in hers.
        const mud = t.el === 'mud' && !retroLook ? fxImage('mudball') : null;
        if (mud && ready(mud) && k > 0.3) {
          const f = (k - 0.3) / 0.7;
          const w = 34;
          const h = (w * mud.naturalHeight) / mud.naturalWidth;
          ctx.save();
          ctx.translate(t.x, t.y - Math.sin(f * Math.PI) * 120 - (1 - f) * 40);
          ctx.rotate(f * 6);
          ctx.drawImage(mud, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
        // Lobbed weapons from the arsenal (the Mech's fuel barrels, the Archdemon's molotovs, the Kernel's bricks):
        // the picture falling onto its circle, tumbling. The Drakkar's mines lie on theirs, blinking.
        const mine = t.mine && !retroLook ? fxImage('mine-volt') : null;
        if (mine && ready(mine)) {
          const w = 30 * (Math.sin(now * (6 + k * 14)) > 0 ? 1 : 0.92);
          const h = (w * mine.naturalHeight) / mine.naturalWidth;
          ctx.drawImage(mine, t.x - w / 2, t.y - h / 2, w, h);
        }
        const barrel = t.lob && !retroLook ? fxImage(t.lob) : null;
        if (barrel && ready(barrel) && k > 0.2) {
          const f = (k - 0.2) / 0.8;
          const w = t.lob === 'brick' ? 26 : 34;
          const h = (w * barrel.naturalHeight) / barrel.naturalWidth;
          ctx.save();
          ctx.translate(t.x, t.y - Math.sin(f * Math.PI) * 130 - (1 - f) * 50);
          ctx.rotate(f * 7);
          ctx.drawImage(barrel, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
        const rune = t.el === 'arcane' && !retroLook ? fxImage(t.alt ? 'medusa-rune-2' : 'medusa-rune') : null;
        if (rune && ready(rune)) {
          const s = t.r * 2.3 * (0.5 + 0.5 * k);
          ctx.save();
          ctx.translate(t.x, t.y);
          ctx.rotate(now * 2);
          ctx.globalAlpha = 0.5 + 0.5 * k;
          ctx.drawImage(rune, -s / 2, -s / 2, s, s);
          ctx.restore();
        }
        // Meteors: the painted fireball falling onto its circle, a little slanted.
        const ball = fxImage('fireball');
        if (t.after === 'lava' && !retroLook && ready(ball) && k > 0.35) {
          const f = (k - 0.35) / 0.65;
          const w = 54 + t.r * 0.4;
          const h = (w * ball.naturalHeight) / ball.naturalWidth;
          ctx.save();
          ctx.translate(t.x + (1 - f) * 70, t.y - (1 - f) * 260);
          ctx.rotate(Math.atan2(260, -70));
          ctx.drawImage(ball, -w * 0.78, -h / 2, w, h);
          ctx.restore();
        }
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
        // The storm grid's bolts and the Mech's sweeping lasers: the laser weapon's painted column laid along the
        // line (blue for Zeus, yellow for anyone else's grid, red for the Mech's lasers).
        const look = retroLook ? null : t.el === 'laser' ? 'red' : t.el === 'bolt' && t.kind === 'line' && !t.shot ? (t.blue ? 'blue' : 'yellow') : null;
        const beam = look ? fxImage(`laser-${look}`) : null;
        if (look && beam && ready(beam)) {
          const [cx, , colW] = LASER_PIC[look === 'blue' ? 'yellow' : look];
          const dw = (t.r * 3.2) / colW;
          const split = beam.naturalHeight * LASER_SPLIT;
          ctx.globalAlpha = flick;
          ctx.rotate(-Math.PI / 2);
          ctx.drawImage(beam, 0, 0, beam.naturalWidth, split, -dw * cx, 0, dw, t.len);
          ctx.globalAlpha = 1;
          ctx.restore();
          continue;
        }
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
      } else if (!retroLook && ready(fxImage('wave-strip-1'))) {
        // The owner's three strips by where the wave is in the room: calm swell over the first third,
        // cresting foam in the middle, breaking surf at the end, fading from one into the next.
        // Each strip is one long picture, wider than the room, so nothing repeats; it drifts sideways and bobs.
        const p = Math.min(1, (t.done ?? 0) / (t.span ?? 600));
        const mix = (a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
        const m1 = mix(0.25, 0.42); const m2 = mix(0.6, 0.77);
        // Each strip comes in over the one before, which stays whole underneath until it is covered,
        // so the water never turns see-through halfway between two.
        const layers: [number, number][] = [[0, m1 < 1 ? 1 : 0], [1, m2 < 1 ? m1 : 0], [2, m2]];
        const k = (t.r * 3.1) / 160;
        const top = -t.r * 3; const bottom = t.r * 2.4; const q = 2;
        for (const [from, to] of [[-t.len, gap - gapW], [gap + gapW, t.len]]) {
          if (to <= from) continue;
          // Each side is built on its own canvas so its back and its ends can fade instead of stopping in a straight edge.
          const len = to - from;
          const c = waveCanvas(Math.ceil(len * q), Math.ceil((bottom - top) * q));
          const w2 = c.getContext('2d')!;
          w2.setTransform(1, 0, 0, 1, 0, 0);
          w2.clearRect(0, 0, c.width, c.height);
          w2.setTransform(q, 0, 0, q, 0, -top * q);
          w2.globalCompositeOperation = 'source-over';
          for (const [n, alpha] of layers) {
            if (alpha <= 0.01) continue;
            const pic = fxImage(`wave-strip-${n}`);
            if (!ready(pic)) continue;
            const w = pic.naturalWidth * k; const h = pic.naturalHeight * k;
            // The foot sits a fixed way behind the front, so the crest grows forward as the strips change,
            // and the cresting strip's foam lies on the band that hurts (the front ± r).
            const foot = t.r * 2.1 + Math.sin(now * 3 + n);
            // Both sides cut from the same stretch of the strip, so the wave reads as one across the gap.
            const drift = Math.max(0, w - t.len * 2) * (0.5 + 0.5 * Math.sin(now * 0.25 + n * 2));
            w2.globalAlpha = alpha;
            w2.drawImage(pic, -(from + t.len) - drift, foot - h, w, h);
          }
          w2.globalAlpha = 1;
          w2.globalCompositeOperation = 'destination-in';
          const back = w2.createLinearGradient(0, bottom, 0, bottom - t.r * 1.2);
          back.addColorStop(0, 'rgba(0,0,0,0)');
          back.addColorStop(1, 'rgba(0,0,0,1)');
          w2.fillStyle = back;
          w2.fillRect(0, top, len, bottom - top);
          // The ends by the gap and the walls melt over 14px.
          const ends = w2.createLinearGradient(0, 0, len, 0);
          const e = Math.min(0.45, 14 / len);
          ends.addColorStop(0, 'rgba(0,0,0,0)');
          ends.addColorStop(e, 'rgba(0,0,0,1)');
          ends.addColorStop(1 - e, 'rgba(0,0,0,1)');
          ends.addColorStop(1, 'rgba(0,0,0,0)');
          w2.fillStyle = ends;
          w2.fillRect(0, top, len, bottom - top);
          const o = waveAt(t, from);
          ctx.save();
          ctx.translate(o.x, o.y);
          ctx.rotate(t.a + Math.PI / 2);
          ctx.drawImage(c, 0, 0, Math.ceil(len * q), Math.ceil((bottom - top) * q), 0, top, len, bottom - top);
          ctx.restore();
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

/* The Medusa's snakes, from the owner's sheet (`enemies/snake-{p,t}-0..5.webp`, purple and turquoise: five slithering
   poses and the bite, cut from his black sheet on one canvas per colour, belly on the bottom edge, `scratchpad` `snake/cut.py`).
   They face right, are mirrored to face left, slither back and forth through the five poses as they cover ground and bite
   while close to you; `SNAKE_W` is how many times their radius the picture is drawn wide. */
const snakeSets = new Map<number, HTMLImageElement[]>();
const SNAKE_SLITHER = [0, 1, 2, 3, 4, 3, 2, 1];
const SNAKE_W = 7;
function snakeFrames(colour: number) {
  let set = snakeSets.get(colour);
  if (!set) {
    set = Array.from({ length: 6 }, (_, i) => Object.assign(new Image(), { src: `./images/game/enemies/snake-${colour === 2 ? 't' : 'p'}-${i}.webp` }));
    snakeSets.set(colour, set);
  }
  return set;
}
function drawSnake(ctx: CanvasRenderingContext2D, e: Enemy) {
  const set = snakeFrames(e.snake);
  const pic = set[e.swing > 0 ? 5 : SNAKE_SLITHER[((Math.floor(e.step) % 8) + 8) % 8]];
  if (retroLook || !ready(pic)) return false;
  const w = e.r * SNAKE_W;
  const h = (w * pic.naturalHeight) / pic.naturalWidth;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + e.r * 0.8, w * 0.36, e.r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(e.x, e.y + e.r * 0.9);
  if (e.face < 0) ctx.scale(-1, 1);
  if (e.hit > 0) ctx.globalAlpha = 0.55;
  ctx.drawImage(pic, -w / 2, -h, w, h);
  ctx.restore();
  return true;
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
  if (e.bossId === 'medusa') { snakeFrames(1); snakeFrames(2); }
  if (e.snake && e.spawn <= 0 && drawSnake(ctx, e)) return;
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
  // Its last stand (`rage`, from 20% health): a red glow pulsing fast behind it.
  if (e.rage) {
    const k = 0.5 + Math.sin(now * 12) * 0.5;
    const glow = ctx.createRadialGradient(0, -e.r * 0.3, e.r * 0.3, 0, -e.r * 0.3, e.r * (1.9 + k * 0.3));
    glow.addColorStop(0, `rgba(248,113,113,${0.35 + k * 0.2})`);
    glow.addColorStop(0.6, 'rgba(220,38,38,0.22)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -e.r * 0.3, e.r * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // The world's final boss: a crown of light turning round it (its clones wear it too, to fool you); red and fast in its last stand.
  if (e.final) {
    const tone = e.rage ? '#ef4444' : e.tint || '#fcd34d';
    ctx.save();
    ctx.rotate(now * (e.rage ? 3 : 0.8));
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
  // The wraith is drawn nearly black: a cold backlight keeps it readable on the nightmare floor.
  if (e.bossId === 'wraith' && !retroLook) {
    const back = ctx.createRadialGradient(0, -e.r * 0.4, e.r * 0.2, 0, -e.r * 0.4, e.r * 2);
    back.addColorStop(0, 'rgba(147,197,253,0.42)');
    back.addColorStop(0.6, 'rgba(99,102,241,0.18)');
    back.addColorStop(1, 'transparent');
    ctx.fillStyle = back;
    ctx.beginPath();
    ctx.arc(0, -e.r * 0.4, e.r * 2, 0, Math.PI * 2);
    ctx.fill();
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
  // The Core's dark dragon is nearly black on a dark floor: a violet backlight and a magenta rim round its
  // silhouette (a shadow glow, which Safari draws too) keep it readable.
  const rim = e.bossId === 'chimera' && !retroLook;
  if (rim) {
    const back = ctx.createRadialGradient(0, -e.r * 0.3, e.r * 0.2, 0, -e.r * 0.3, e.r * 2.2);
    back.addColorStop(0, 'rgba(192,132,252,0.38)');
    back.addColorStop(0.6, 'rgba(139,92,246,0.16)');
    back.addColorStop(1, 'transparent');
    ctx.fillStyle = back;
    ctx.beginPath();
    ctx.arc(0, -e.r * 0.3, e.r * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'rgba(232,121,249,0.95)';
    ctx.shadowBlur = Math.max(8, e.r * 0.3);
  }
  const painted = !retroLook && drawEnemySprite(ctx, e);
  if (!painted) LOOKS[e.look][e.kind](ctx, e, now);
  if (rim) ctx.shadowBlur = 0;
  // Status: white flash on hit (not on a painted boss, which shows its hit pose: a disc as big as the boss
  // covered it whenever the arrows kept it lit), blue tint when slowed, little flames when burning.
  if (e.hit > 0 && !(painted && e.kind === 'boss')) {
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
    if (!drawFlames(ctx, 0, 0, e.r, now, e.id, !!e.blueFire)) {
      ctx.fillStyle = '#ff9a1f';
      for (let i = 0; i < 3; i++) {
        const a = now * 4 + i * 2.1;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * e.r * 0.6, -e.r * 0.6 + Math.sin(a * 1.3) * 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
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

/* The mud world in the retro look: a frog, a bat, a blob of mud and the Mud Monster. */
const mudFrog: Drawer = (ctx, e, now) => {
  const r = e.r;
  const hop = -Math.abs(Math.sin(e.step * Math.PI)) * r * 0.25;
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.2 + hop, r, r * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.45 + hop, r * 0.6, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const x of [-0.45, 0.45]) {
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(x * r, -r * 0.45 + hop, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
  eyes(ctx, r * 0.45, -r * 0.45 + hop, r * 0.16, '#facc15');
  void now;
};
const mudBat: Drawer = (ctx, e, now) => {
  const r = e.r;
  const flap = Math.sin(now * 14 + e.wobble) * 0.5;
  ctx.fillStyle = '#db2777';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.4, -r * 0.1);
    ctx.lineTo(side * r * 1.5, -r * (0.7 + flap));
    ctx.lineTo(side * r * 1.2, r * 0.4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#6d28d9';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, r * 0.28, -r * 0.1, r * 0.13, '#facc15');
};
const mudBlob: Drawer = (ctx, e, now) => {
  const r = e.r;
  const squish = 1 + Math.sin(now * 4 + e.wobble) * 0.05;
  const mud = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.1);
  mud.addColorStop(0, '#a16207');
  mud.addColorStop(1, '#422006');
  ctx.fillStyle = mud;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.1, r * squish, r * 0.9 / squish, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -r * 0.85, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, r * 0.35, -r * 0.05, r * 0.15, '#fde047');
};
const mudMonster: Drawer = (ctx, e, now) => {
  const r = e.r;
  mudBlob(ctx, e, now);
  ctx.fillStyle = '#713f12';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * r * 1.05, r * 0.25, r * 0.28, r * 0.55, side * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#1c1917';
  roundRect(ctx, -r * 0.4, r * 0.35, r * 0.8, r * 0.25, 4);
  ctx.fill();
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
   with the ground the enemy covers (`Enemy.step`, which starts at a random
   point so a crowd never steps in unison); the sprite
   is sized to the collision circle (bosses a little bigger) with its feet on
   the shadow. Looks without a sheet fall back to the hand-drawn figures. */
/* Frames per look: the first three sheets have four walking frames; the
   later ones six: three walking, two attacking (wind-up, strike) and one
   taking a hit. */
const SPRITE_FRAMES: Partial<Record<Look, number>> = { original: 4, demon: 4, greek: 4, viking: 6, mud: 6, jungle: 6, robot: 6, nightmare: 6 };
/* Every set is cut on one canvas for all its frames (each frame registered against the first by its head
   and torso, `scratchpad` `walkfix/fix.py`), so a stride or a swing never resizes or shifts the figure:
   how much larger than its first frame's own size to draw that canvas, so the body keeps its size, and how
   much of the canvas lies under the first frame's feet (dust, a long stride). */
const SPRITE_CANVAS: Record<string, { k: number; feet: number }> = {
  'viking-boss': { k: 1.265, feet: 0 }, 'jungle-boss': { k: 1.276, feet: 0 },
  'original-bug': { k: 1.018, feet: 0.0186 }, 'original-ticket': { k: 1.076, feet: 0.0283 }, 'original-legacy': { k: 1.113, feet: 0.0437 },
  'original-boss': { k: 1.108, feet: 0.0533 }, 'demon-bug': { k: 1.05, feet: 0.1387 }, 'demon-ticket': { k: 1.062, feet: 0 },
  'demon-legacy': { k: 1.148, feet: 0.0248 }, 'demon-boss': { k: 1.183, feet: 0.0549 }, 'greek-bug': { k: 1.059, feet: 0.0409 },
  'greek-ticket': { k: 1.215, feet: 0 }, 'greek-legacy': { k: 1.134, feet: 0 }, 'greek-boss': { k: 1.125, feet: 0.0455 },
  'viking-bug': { k: 1.067, feet: 0.0083 }, 'viking-ticket': { k: 1.091, feet: 0.0051 }, 'viking-legacy': { k: 1.166, feet: 0.023 },
  'jungle-bug': { k: 1.43, feet: 0 }, 'jungle-ticket': { k: 1.193, feet: 0.0271 }, 'jungle-legacy': { k: 1.455, feet: 0 },
  'robot-bug': { k: 1.431, feet: 0.0051 }, 'robot-ticket': { k: 1.4, feet: 0 }, 'robot-legacy': { k: 1.446, feet: 0.0299 },
  'robot-boss': { k: 1.127, feet: 0.0083 }, 'nightmare-bug': { k: 1.31, feet: 0.0165 }, 'nightmare-ticket': { k: 1.369, feet: 0 },
  'nightmare-legacy': { k: 1.098, feet: 0 }, 'nightmare-boss': { k: 1.137, feet: 0 },
  'mud-bug': { k: 1.667, feet: 0.0959 }, 'mud-ticket': { k: 1.291, feet: 0.086 }, 'mud-legacy': { k: 1.097, feet: 0.06 },
};
/* The walk cycles: the four-frame sheets loop; the three walking frames of the others are a stride, the
   standing frame and the other stride (step, pass, step, pass), and the final bosses' are left foot,
   feet together, right foot. */
const WALK4 = [0, 1, 2, 3];
const WALK3 = [1, 0, 2, 0];
const WALK_FINAL = [0, 1, 2, 1];
const walkFrame = (e: Enemy, cycle: number[]) => cycle[((Math.floor(e.step) % cycle.length) + cycle.length) % cycle.length];
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
function enemyFrame(e: Enemy, count: number) {
  if (count === 4) return walkFrame(e, WALK4);
  if (e.kind === 'boss' ? e.pain > 0 : e.hit > 0) return 5;
  // Attacks: a boss winding up (aim) or charging (dash); a ticket just after it threw (its cooldown was reset high).
  // A boss or a big one winding up (aim) and charging or pouncing (dash).
  if ((e.kind === 'boss' || e.kind === 'legacy') && e.aim > 0) return 3;
  if ((e.kind === 'boss' || e.kind === 'legacy') && e.dash > 0) return 4;
  if (e.kind === 'ticket' && e.cd > 1.5) return e.cd > 1.75 ? 3 : 4;
  // Close to you: wind-up and hit in turn (the damage itself is still on contact).
  if (e.kind !== 'boss' && e.swing > 0) return (e.swing / ATTACK_CYCLE) % 1 < 0.5 ? 3 : 4;
  return walkFrame(e, WALK3);
}
/* Final bosses with a sheet of their own (static/images/game/bosses/<id>-<frame>.webp, nine poses, the same
   order as the prompts: three walking, wind-up and charge, the ring of orbs, the world's move, the signature
   and a hit). Add an id here once its pictures are in; until then a final boss wears its cast's boss, bigger. */
const BOSS_ART = new Set<string>(['kernel', 'archdemon', 'drakkar', 'valdur', 'medusa', 'zeus', 'queen', 'mech', 'wraith', 'chimera', 'kratos']);
/* Each final sheet is cut on one canvas for its nine poses (body centred, its lowest point on the baseline):
   how many times the body's width the canvas is drawn, and how much of the canvas lies under the feet
   (dust, a dash's trail, the volley's orbs). */
const BOSS_CANVAS: Record<string, { k: number; feet: number }> = {
  kernel: { k: 2.155, feet: 0.1766 }, archdemon: { k: 2.028, feet: 0.1232 },
  drakkar: { k: 1.081, feet: 0.12 }, valdur: { k: 1.538, feet: 0.1954 }, zeus: { k: 1.782, feet: 0.2063 }, queen: { k: 1.348, feet: 0.1484 },
  wraith: { k: 1.295, feet: 0.1974 }, valkyrie: { k: 2.6, feet: 0.1691 }, medusa: { k: 2.116, feet: 0.012 }, medusa2: { k: 2.066, feet: 0.012 }, mudmonster: { k: 1.615, feet: 0.072 }, monolith: { k: 2.9, feet: 0.2121 }, minotaur: { k: 2.99, feet: 0.2765 }, mainframe: { k: 2.3, feet: 0.2248 }, overlord: { k: 3.186, feet: 0.2265 }, kratos: { k: 2.4, feet: 0.1892 }, kratos2: { k: 3.12, feet: 0.3172 }, mech: { k: 1.412, feet: 0.0878 }, chimera: { k: 2.226, feet: 0.1553 }, chimera2: { k: 1.749, feet: 0.1787 }, chimera3: { k: 1.706, feet: 0.2686 },
};
/** Room-6 bosses with a nine-pose sheet of their own, in the final bosses' order: the backlog's Monolith, the fire world's Overlord, the vikings'
    Valkyrie, the Mud Monster, the Arena's Minotaur, the Forge's Mainframe. */
const MID_ART: Partial<Record<Look, string>> = { original: 'monolith', demon: 'overlord', viking: 'valkyrie', mud: 'mudmonster', greek: 'minotaur', robot: 'mainframe' };
const finalSprites = new Map<string, HTMLImageElement[]>();
/* Nine-pose bosses hold an action pose at least `POSE_HOLD` before it changes, unless something weightier comes
   (the signature over the move or ring, those over the charge, the charge over the wind-up, any of them over the
   gaze, the hurt pose or a step), and the last pose fades out over the next in `POSE_FADE`; only to be seen. */
const POSE_HOLD = 0.28;
const POSE_FADE = 0.09;
/** How weighty each of the nine (and the Medusa's tenth) poses is: steps 0, the hurt pose 1, the gaze 2, wind-up 3,
    charge 4, ring and move 5, signature 6. */
const POSE_WEIGHT = [0, 0, 0, 3, 4, 5, 5, 6, 1, 2];
const poseShown = new WeakMap<Enemy, { f: number; sheet: string; t: number; prev?: HTMLImageElement; pt: number }>();
function heldFrame(e: Enemy, sheet: string, want: number, frames: HTMLImageElement[]) {
  const now = performance.now() / 1000;
  const s = poseShown.get(e);
  if (!s || s.sheet !== sheet) { poseShown.set(e, { f: want, sheet, t: now, pt: -1 }); return want; }
  if (want === s.f) return want;
  if (POSE_WEIGHT[s.f] > 0 && now - s.t < POSE_HOLD && POSE_WEIGHT[want] <= POSE_WEIGHT[s.f]) return s.f;
  s.prev = frames[s.f];
  s.pt = now;
  s.f = want;
  s.t = now;
  return want;
}
/** Milliseconds each picture of Nocthrax's wing beat shows (six to a beat). */
const FLAP_STEP = 105;
function finalFrame(e: Enemy) {
  // Kratos taking up the Blade of Olympus: his tenth picture, leaping with it raised out of a burst of lightning.
  if (e.rise) return 9;
  if (e.pain > 0) return 8;
  // The Medusa's deep gaze (her tenth picture) while the hero stands within it and she is doing nothing else.
  if (e.gaze && e.bossId === 'medusa' && e.chan <= 0 && e.pose <= 0 && e.aim <= 0 && e.dash <= 0) return 9;
  if (e.chan > 0) return 7;
  if (e.pose > 0) return e.act === 'sig' ? 7 : e.act === 'move' ? 6 : 5;
  if (e.aim > 0) return 3;
  if (e.dash > 0) return 4;
  // In the air Nocthrax flaps whether it moves or not: in its phase 2 the owner's six-picture wing beat (`chimera2-9..14`,
  // the body still and only the wings moving, `FLAP_STEP` a picture), in its final form the sheet's first three poses.
  if (e.phase === 2 && e.bossId === 'chimera') return 9 + (Math.floor(performance.now() / FLAP_STEP) % 6);
  if (e.phase > 1 && e.bossId === 'chimera') return [0, 1, 2, 1][Math.floor(performance.now() / 120) % 4];
  return walkFrame(e, WALK_FINAL);
}
function drawEnemySprite(ctx: CanvasRenderingContext2D, e: Enemy) {
  let count = SPRITE_FRAMES[e.look];
  let frames: HTMLImageElement[] | undefined;
  let img: HTMLImageElement | undefined;
  // A boss with phases has a sheet per phase (`chimera2` for Nocthrax in the air).
  // A cast's room-6 boss can have a nine-pose sheet too (`MID_ART`); the bosses a final boss calls keep the cast's own.
  // The secret shift's first Kratos wears his own sheet too, with the room-6 kit.
  const mid = e.kind === 'boss' && !e.final && !e.minion ? (e.bossId === 'kratos' ? (e.phase > 1 ? 'kratos2' : 'kratos') : MID_ART[e.look]) : undefined;
  const sheet = mid ?? (e.phase > 1 ? `${e.bossId}${e.phase}` : e.bossId);
  if ((e.final && BOSS_ART.has(e.bossId)) || mid) {
    frames = finalSprites.get(sheet);
    if (!frames) {
      frames = Array.from({ length: sheet === 'chimera2' ? 15 : sheet.startsWith('medusa') || sheet === 'kratos2' ? 10 : 9 }, (_, i) => Object.assign(new Image(), { src: `./images/game/bosses/${sheet}-${i}.webp` }));
      finalSprites.set(sheet, frames);
      // The next phase's sheet loads now, so it is in when the boss changes.
      if ((e.bossId === 'chimera' && sheet === 'chimera') || ((e.bossId === 'medusa' || e.bossId === 'kratos') && sheet === e.bossId)) for (const n of e.bossId === 'medusa' ? ['medusa2'] : e.bossId === 'kratos' ? ['kratos2'] : ['chimera2', 'chimera3']) finalSprites.set(n, Array.from({ length: n === 'chimera2' ? 15 : n.startsWith('medusa') || n === 'kratos2' ? 10 : 9 }, (_, i) => Object.assign(new Image(), { src: `./images/game/bosses/${n}-${i}.webp` })));
    }
    img = frames[heldFrame(e, sheet, finalFrame(e), frames)];
    count = 9;
  }
  if (!count) return false;
  frames ??= enemyFrames(e.look, e.kind, count);
  img ??= frames[enemyFrame(e, count)] ?? frames[0];
  if (!img.complete || !img.naturalWidth) return false;
  const fit = count === 9 ? BOSS_CANVAS[sheet] : SPRITE_CANVAS[`${e.look}-${e.kind}`];
  const size = e.r * (e.kind === 'boss' ? 2.6 : 2.5) * (fit ? fit.k : 1);
  const ratio = img.naturalWidth / img.naturalHeight;
  const w = ratio >= 1 ? size : size * ratio;
  const h = ratio >= 1 ? size / ratio : size;
  const under = fit ? h * fit.feet : 0;
  // A small lift on each stride (none while it stands).
  const bob = -Math.abs(Math.sin(e.step * Math.PI)) * 1.4;
  // The painted sprites face right (or the viewer): mirrored when it faces left.
  if (e.face < 0) ctx.scale(-1, 1);
  // Swinging at you: a lunge forward on each hit, the whole attack for the sets that have no attack frames.
  const lunge = e.kind !== 'boss' && e.swing > 0 ? Math.max(0, Math.sin((e.swing / ATTACK_CYCLE) * Math.PI * 2 - Math.PI / 2)) * e.r * (count === 4 ? 0.45 : 0.2) : 0;
  // A big one crouching before its pounce squats a little (the four-frame sets have no wind-up picture).
  if (e.kind === 'legacy' && e.aim > 0) {
    const foot = e.r * 0.85 + under;
    ctx.translate(0, foot);
    ctx.scale(1.08, 0.88);
    ctx.translate(0, -foot);
  }
  ctx.drawImage(img, -w / 2 + lunge, e.r * 0.85 - h + under + bob, w, h);
  // A nine-pose boss's last pose fades out over the new one for a moment, so a change never cuts.
  const shown = count === 9 ? poseShown.get(e) : undefined;
  const fade = shown?.prev && shown.prev.complete && shown.prev.naturalWidth ? 1 - (performance.now() / 1000 - shown.pt) / POSE_FADE : 0;
  if (shown?.prev && fade > 0) {
    const pr = shown.prev.naturalWidth / shown.prev.naturalHeight;
    const pw = pr >= 1 ? size : size * pr;
    const ph = pr >= 1 ? size / pr : size;
    const alpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha * fade;
    ctx.drawImage(shown.prev, -pw / 2, e.r * 0.85 - ph + ph * (fit ? fit.feet : 0) + bob, pw, ph);
    ctx.globalAlpha = alpha;
  }
  return true;
}

const LOOKS: Record<Look, Record<Enemy['kind'], Drawer>> = {
  viking: { bug: vikingRaider, ticket: vikingThrower, legacy: vikingShieldWall, boss: vikingJarl },
  mud: { bug: mudFrog, ticket: mudBat, legacy: mudBlob, boss: mudMonster },
  jungle: { bug: jungleSpider, ticket: junglePlant, legacy: jungleStump, boss: jungleTreant },
  robot: { bug: robotDrone, ticket: robotTurret, legacy: robotCrate, boss: robotMainframe },
  original: { bug: drawBug, ticket: (ctx, e) => drawTicket(ctx, e), legacy: (ctx, e) => drawLegacy(ctx, e), boss: drawBoss },
  demon: { bug: demonImp, ticket: demonSkull, legacy: demonGargoyle, boss: demonOverlord },
  greek: { bug: greekGladiator, ticket: greekHoplite, legacy: greekShieldWall, boss: greekMinotaur },
  nightmare: { bug: nightmareZombie, ticket: nightmareSkeleton, legacy: nightmareTombstone, boss: nightmareLich },
};


/* ------------------------------------------------------------- the worlds */

/** A world's own pieces (`static/images/game/<set>/`): the jungle's mossy blocks and thorny vines, the
    vikings' wet blocks and water pools. */
const setImages = new Map<string, HTMLImageElement>();
function setImage(set: Look | 'core', name: string) {
  const key = `${set}/${name}`;
  let img = setImages.get(key);
  if (!img) { img = new Image(); img.src = `./images/game/${key}.webp`; setImages.set(key, img); }
  return img;
}
const jungleImage = (name: string) => setImage('jungle', name);

function drawHazards(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  for (const h of g.hazards) {
    if (h.hidden && !retroLook) continue;
    // Lava is drawn as the molotov's fire pool, zooming a little (the owner's pick; the seven bubbling
    // `lava-0..6` frames are kept in the files, unused).
    const lava = h.kind === 'lava' && !retroLook ? fxImage(h.r > 40 ? 'fire-pool-big' : 'fire-pool') : null;
    if (lava && ready(lava)) {
      ctx.globalAlpha = 0.9;
      drawFirePool(ctx, lava, h.x, h.y, h.r, now);
      ctx.globalAlpha = 1;
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
    } else if (h.kind === 'puddle' && !retroLook && ready(setImage('viking', 'pool-2'))) {
      // The owner's rippling pool: the bigger the puddle the bigger picture, its rings turning slowly.
      const pic = setImage('viking', `pool-${Math.min(4, Math.max(0, Math.round((h.r - 24) / 7)))}`);
      const w = h.r * 2.3;
      const ht = (w * pic.naturalHeight) / pic.naturalWidth;
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.scale(1 + Math.sin(now * 2 + h.x) * 0.02, 1 + Math.cos(now * 2 + h.y) * 0.02);
      ctx.drawImage(pic, -w / 2, -ht / 2, w, ht);
      ctx.restore();
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
    } else if (!retroLook && ready(jungleImage('vine-0'))) {
      // Thorns: the owner's coiled thorny vine (two of them, picked by place), its spikes reaching past the circle.
      const pic = jungleImage(Math.floor(h.x + h.y) % 2 ? 'vine-1' : 'vine-0');
      const w = h.r * 3;
      const ht = (w * pic.naturalHeight) / pic.naturalWidth;
      ctx.drawImage(pic, h.x - w / 2, h.y - ht * 0.55, w, ht);
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
    if (st.ice) { drawIcicle(ctx, st, now); continue; }
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

/** Ice spikes: while they warn, an icy ring with the floor cracking open more and more inside it; then a
   cluster of spikes bursts up out of it, stays a moment and crumbles back down. */
/* The owner's ice spikes, four variants of seven frames (`fx/icicle-<v>-<f>.webp`: the floor cracking, then the spikes
   growing), each variant cut on one canvas so its frames share the floor point: where the crack's middle sits (`cx`, `cy`,
   fractions of the picture) and how wide the crack is (`cw`), so it is drawn as wide as the warned ring. */
const ICICLE_PIC = [
  { cx: 0.494, cy: 0.824, cw: 0.629 },
  { cx: 0.547, cy: 0.743, cw: 0.727 },
  { cx: 0.502, cy: 0.783, cw: 0.658 },
  { cx: 0.543, cy: 0.7, cw: 0.703 },
];
/** How long the spikes take to grow through their six frames once they strike. */
const ICICLE_GROW = 0.18;
function drawIcicleArt(ctx: CanvasRenderingContext2D, st: { x: number; y: number; t: number; r?: number }, now: number) {
  const v = Math.abs(Math.floor(st.x * 7 + st.y * 13)) % 4;
  const warn = st.t > 0;
  const age = -st.t;
  const frame = warn ? 0 : Math.min(6, 1 + Math.floor((age / ICICLE_GROW) * 6));
  // Every frame is asked for while the floor cracks, so the spikes are loaded by the time they strike.
  if (warn) for (let f = 1; f < 7; f++) fxImage(`icicle-${v}-${f}`);
  const pic = fxImage(`icicle-${v}-${frame}`);
  if (!ready(pic) || !ready(fxImage(`icicle-${v}-6`))) return false;
  const r = st.r ?? ICICLE_R;
  const m = ICICLE_PIC[v];
  // The ring still marks where it will strike while the floor cracks open inside it.
  let alpha = 1;
  let grow = 1;
  if (warn) {
    const t = 1 - st.t / 0.9;
    // A soft dark pool and a deep blue ring, since the pale crack alone hardly shows on the frozen floor.
    const pool = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, r * 1.1);
    pool.addColorStop(0, `rgba(3,37,76,${0.3 + t * 0.25})`);
    pool.addColorStop(1, 'rgba(3,37,76,0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(st.x, st.y, r * 1.1, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(3,105,161,${0.55 + t * 0.45})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(st.x, st.y, r, now * 2, now * 2 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    alpha = 0.5 + 0.5 * t;
    grow = 0.55 + 0.45 * t;
  } else alpha = Math.min(1, (ICICLE_STAY - age) / (ICICLE_STAY * 0.35));
  if (alpha <= 0) return true;
  const w = ((r * 2.5) / m.cw) * grow;
  const h = (w * pic.naturalHeight) / pic.naturalWidth;
  ctx.globalAlpha = alpha;
  ctx.drawImage(pic, st.x - w * m.cx, st.y - h * m.cy, w, h);
  ctx.globalAlpha = 1;
  return true;
}
function drawIcicle(ctx: CanvasRenderingContext2D, st: { x: number; y: number; t: number; hit?: boolean; r?: number }, now: number) {
  if (!retroLook && drawIcicleArt(ctx, st, now)) return;
  const r = st.r ?? ICICLE_R;
  if (st.t > 0) {
    const t = 1 - st.t / 0.9;
    ctx.strokeStyle = `rgba(186,230,253,${0.45 + t * 0.5})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(st.x, st.y, r, now * 2, now * 2 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(56,189,248,${0.08 + t * 0.22})`;
    ctx.beginPath();
    ctx.arc(st.x, st.y, r * t, 0, Math.PI * 2);
    ctx.fill();
    // Cracks running out from the middle.
    ctx.strokeStyle = `rgba(224,242,254,${0.4 + t * 0.6})`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + st.x * 0.13;
      const l = r * 0.9 * t;
      ctx.beginPath();
      ctx.moveTo(st.x, st.y);
      ctx.lineTo(st.x + Math.cos(a) * l * 0.5 + Math.sin(a) * 3, st.y + Math.sin(a) * l * 0.5 * 0.6 - Math.cos(a) * 2);
      ctx.lineTo(st.x + Math.cos(a) * l, st.y + Math.sin(a) * l * 0.6);
      ctx.stroke();
    }
    return;
  }
  // Up in a tenth of a second, down over the last third of its stay.
  const age = -st.t;
  const up = Math.min(1, age / 0.1) * Math.min(1, (ICICLE_STAY - age) / (ICICLE_STAY * 0.35));
  if (up <= 0) return;
  ctx.fillStyle = 'rgba(8,20,35,0.35)';
  ctx.beginPath();
  ctx.ellipse(st.x, st.y + 4, r * 0.95, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  // Back ones first, so the front ones stand over them.
  for (const [dx, dy, h, w] of ICE_SPIKES) {
    const bx = st.x + dx * r; const by = st.y + dy * r * 0.5;
    const tall = h * up; const half = w;
    const grad = ctx.createLinearGradient(bx - half, 0, bx + half, 0);
    grad.addColorStop(0, '#bae6fd');
    grad.addColorStop(0.45, '#ffffff');
    grad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(14,116,144,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx - half, by);
    ctx.lineTo(bx - half * 0.2, by - tall);
    ctx.lineTo(bx + half, by);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(bx - half * 0.45, by - 2);
    ctx.lineTo(bx - half * 0.25, by - tall + 6);
    ctx.stroke();
  }
}
/** The spikes of one cluster: where each stands (share of the ring), how tall and how wide; back to front. */
const ICE_SPIKES: [number, number, number, number][] = [
  [-0.45, -0.5, 26, 7], [0.4, -0.55, 30, 8], [0.05, -0.35, 44, 10], [-0.65, 0.15, 22, 7], [0.7, 0.1, 24, 7], [-0.25, 0.35, 34, 9], [0.3, 0.4, 30, 8],
];

