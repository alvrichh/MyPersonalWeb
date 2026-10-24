import { BOARD_H, BOARD_W, CELL, COLS, FINAL_ID, HOME_ROW, WALL_ROW, LEAP, MERGE_DELAY, STRIKE, homeCell, ROWS, TIER_KIND, TIER_STATS, canMerge, castLook, cellCentre, pieceAt, waveSpots, ABILITY, type Ability, type BoardGame, type Piece, type Slot, type Tier } from './board';
import { boardFx, boardWallPieces, drawBoardBackdrop, drawBoardFigure, drawBoardOrb } from './draw';

/* Draw the board mode: bugs and waves on the grid, with the worn hero and the rival on their portals. On phones they
   keep the board corners; on desktop they move into the open strip beside it. The heroes, health and fireballs all
   follow those positions. */

/** The units are drawn bigger than their hit circles, so they fill their cells. */
const FIG = 1.4;
/** Room above the board for the rival's hearts (yours float over your hero, inside the board). */
const TOP = 16;
/** The size of the heart over each commander. */
const HEARTS = { size: 11 };
/** How long the fireball flies, and how long its blast lasts, in seconds (main.ts waits for both). */
export const FIREBALL = { fly: 0.75, blast: 0.45 };

export type BoardLayout = { s: number; sx: number; ox: number; oy: number };

/** Fits the board (and the strip above it) into the area between the top bar and the shop. */
export function layoutBoard(w: number, top: number, bottom: number, arenaWidth = w, widthScale = 1, maxBoardWidth = w, fillHeight = false): BoardLayout {
  // The commanders float over the arena, so their art must not take height away from the grid.
  const room = Math.max(120, bottom - top);
  const s = fillHeight ? room / (BOARD_H + TOP) : Math.min((Math.min(w, arenaWidth) - 8) / BOARD_W, room / (BOARD_H + TOP));
  const spare = Math.max(0, room - (BOARD_H + TOP) * s);
  // Expand only the spacing between columns. Keep the previous height and never shrink the grid to fit its controls.
  const sx = fillHeight ? Math.min(w - 8, maxBoardWidth) / BOARD_W : s * Math.max(1, Math.min(widthScale, maxBoardWidth / (BOARD_W * s)));
  return { s, sx, ox: (w - BOARD_W * sx) / 2, oy: top + spare + TOP * s };
}

/** The cell under a point on the screen, or null off the board. */
export function slotAt(lay: BoardLayout, px: number, py: number): Slot | null {
  const x = (px - lay.ox) / lay.sx;
  const y = (py - lay.oy) / lay.s;
  if (x < 0 || x >= BOARD_W || y < 0 || y >= BOARD_H) return null;
  return { c: Math.floor(x / CELL), r: Math.floor(y / CELL) };
}

export type BoardDrag = { piece: Piece; x: number; y: number; over: Slot | null };
/** Your commander's pictures: the worn skin and headwear's poses, and the portal it stands on. */
type Poses = { front: HTMLImageElement; shoot: HTMLImageElement; hurt: HTMLImageElement; cheer: HTMLImageElement; down: HTMLImageElement };
/** Your hero's poses and portals, and against a friend their own hero's poses (`rival`), drawn as they are. */
export type HeroPics = Poses & { pad: HTMLImageElement; padRed: HTMLImageElement; rival?: Poses };

/** How big each step is drawn (the radius the sprites are sized by): in the game's own order, bug, ticket, legacy,
    room-6 boss, final boss, each bigger than the one before, a little under the game's sizes (12, 14, 20, 40, 52)
    for the bosses so they fit the board. The fight's own hit circles stay `TIER_STATS`. */
export const DRAW_R = [12, 14, 17, 21, 24, 26, 28];
/** A final boss's next phases on the board: the Drakkar's is Valdur out of the wreck; the others, their own phase's
    sheet (`medusa2`, `chimera2`, `chimera3`, chosen by `drawEnemySprite` from the phase). */
const phaseOf = (tier: Tier) => Math.max(1, tier - 3);
const bossOf = (tier: Tier, cast: number) => (tier < 4 ? castLook(cast) : FINAL_ID[cast - 1] === 'drakkar' && tier > 4 ? 'valdur' : FINAL_ID[cast - 1]);
const figureOf = (tier: Tier, cast: number, face: number, step: number, swing: number, hit: number, move?: { aim: number; dash: number; dir: { x: number; y: number }; pose?: number; act?: 'move' | 'sig' | 'burst'; chan?: number }) => ({
  ...move,
  look: castLook(cast),
  kind: TIER_KIND[tier],
  final: tier >= 4,
  bossId: bossOf(tier, cast),
  phase: bossOf(tier, cast) === 'valdur' ? 1 : phaseOf(tier),
  face,
  step,
  swing,
  hit,
  r: DRAW_R[tier],
});

/* Boss telegraphs use the same floor pictures and colours as their native attacks. The warning stays readable
   before its damage window opens, with the cast's own effect asset over the marker once it lands. */
function drawBossMoves(ctx: CanvasRenderingContext2D, b: BoardGame, live: BoardGame['fighters'], now: number, retro: boolean, spread = 1) {
  const colours = { fire: '#fb923c', water: '#38bdf8', mud: '#a3a36d', arcane: '#c084fc', leaf: '#4ade80', bolt: '#fde047', laser: '#fb7185', shadow: '#a78bfa', glitch: '#e879f9' };
  for (const attack of b.bossAttacks) {
    if (attack.age < 0 || attack.age > attack.warn + attack.life) continue;
    const warning = attack.age < attack.warn;
    const progress = warning ? Math.max(0, Math.min(1, attack.age / Math.max(0.01, attack.warn))) : 1;
    const colour = colours[attack.el];
    const alpha = warning ? 0.28 + progress * 0.34 : Math.max(0.18, 1 - (attack.age - attack.warn) / Math.max(0.01, attack.life) * 0.55);
    const img = !warning && !retro ? boardFx(attack.asset) : null;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (attack.kind === 'circle' || attack.kind === 'clone') {
      ctx.save();
      ctx.scale(spread, 1);
      ctx.fillStyle = `${colour}22`;
      ctx.strokeStyle = warning ? '#fff7ed' : colour;
      ctx.lineWidth = warning ? 2 : 1.5;
      ctx.setLineDash(warning ? [6, 4] : []);
      ctx.beginPath(); ctx.arc(attack.x, attack.y, attack.r * (warning ? 0.86 + progress * 0.14 : 1), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      if (img && img.complete && img.naturalWidth) {
        const size = attack.r * (attack.asset === 'boom-big' ? 3 : 2.5);
        const h = size * img.naturalHeight / img.naturalWidth;
        ctx.drawImage(img, attack.x * spread - size / 2, attack.y - h / 2, size, h);
      }
    } else if (attack.kind === 'wave') {
      const h = attack.r * 4;
      ctx.save();
      ctx.scale(spread, 1);
      ctx.fillStyle = `${colour}55`;
      ctx.fillRect(attack.x - attack.len / 2, attack.y - h / 2, attack.len, h);
      ctx.strokeStyle = warning ? '#fff7ed' : colour; ctx.lineWidth = 2;
      ctx.setLineDash(warning ? [8, 6] : []);
      ctx.beginPath(); ctx.moveTo(attack.x - attack.len / 2, attack.y); ctx.lineTo(attack.x + attack.len / 2, attack.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      if (img && img.complete && img.naturalWidth) ctx.drawImage(img, (attack.x - attack.len / 2) * spread, attack.y - h * spread, attack.len * spread, h * 2 * spread);
    } else {
      const angle = attack.a + (attack.kind === 'beam' && !warning ? (attack.spin ?? 0) * (attack.age - attack.warn) : 0);
      ctx.save();
      ctx.scale(spread, 1);
      ctx.translate(attack.x, attack.y); ctx.rotate(angle);
      const grad = ctx.createLinearGradient(0, 0, attack.len, 0);
      grad.addColorStop(0, `${colour}dd`); grad.addColorStop(1, `${colour}22`);
      ctx.fillStyle = grad; ctx.fillRect(0, -attack.r, attack.len, attack.r * 2);
      ctx.strokeStyle = warning ? '#fff7ed' : colour; ctx.lineWidth = warning ? 2 : 1.5;
      ctx.setLineDash(warning ? [8, 6] : []); ctx.strokeRect(0, -attack.r, attack.len, attack.r * 2); ctx.setLineDash([]);
      ctx.restore();
      if (img && img.complete && img.naturalWidth && (attack.asset.startsWith('vine-row') || attack.asset.startsWith('laser-'))) {
        const dx = Math.cos(angle) * spread, dy = Math.sin(angle);
        const lengthScale = Math.hypot(dx, dy);
        ctx.translate(attack.x * spread, attack.y); ctx.rotate(Math.atan2(dy, dx));
        ctx.globalAlpha *= 0.85;
        ctx.drawImage(img, 0, -attack.r * 1.6 * lengthScale, attack.len * lengthScale, attack.r * 3.2 * lengthScale);
      }
    }
    ctx.restore();
  }
  for (const i of b.impacts) {
    const k = i.age / 0.5;
    const img = boardFx(i.kind === 'slam' ? 'slam' : 'shock-ring');
    ctx.save();
    ctx.globalAlpha = 1 - k;
    const w = (i.kind === 'slam' ? LEAP.reach * 2.4 : 50) * (0.7 + k * 0.5);
    if (!retro && ok(img)) ctx.drawImage(img, i.x * spread - w / 2, i.y - (w * img.naturalHeight) / img.naturalWidth / 2, w, (w * img.naturalHeight) / img.naturalWidth);
    else { ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(i.x * spread, i.y, w / 2, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  void live; void now;
}

/* The wall between the halves: the world's own long blocks in a row along the halfway line, standing while you lay
   your army out; it sinks into the floor as the fight starts and rises again when it ends, shaking a little as it
   moves, with dust where it meets the floor. */
const WALL = { move: 0.5 };
let wallUp = 1;
let wallAt = 0;
function drawWall(ctx: CanvasRenderingContext2D, b: BoardGame, now: number, retro: boolean) {
  const dt = Math.min(0.05, Math.max(0, now - wallAt));
  wallAt = now;
  const target = b.phase === 'fight' ? 0 : 1;
  const was = wallUp;
  // Towards the target, and still once there (a plain `>` sent it down a step every frame it stood up).
  if (target > wallUp) wallUp = Math.min(1, wallUp + dt / WALL.move);
  else if (target < wallUp) wallUp = Math.max(0, wallUp - dt / WALL.move);
  const pieces = boardWallPieces(b.world);
  if (retro || wallUp <= 0 || !pieces.every(ok)) return;
  // Exactly three segments, each two columns wide and one reserved row tall.
  const n = 3;
  const h = CELL;
  const base = (WALL_ROW + 1) * CELL;
  const moving = wallUp !== was && wallUp > 0 && wallUp < 1;
  const shake = moving ? Math.sin(now * 60) * 1.2 : 0;
  ctx.save();
  // It sinks below the floor: only what is above the line it stands on shows.
  ctx.beginPath();
  ctx.rect(-20, -200, BOARD_W + 40, base + 200);
  ctx.clip();
  const k = 1 - wallUp;
  const mid = pieces[1];
  const pw = BOARD_W / n;
  const overlap = pw * 0.06;
  // Extend into the neighbouring segment, keeping the outer edges inside the board.
  // Paint the distinct centre last so its details stay visible over both joins.
  for (const i of [0, 2, 1]) {
    const middle = i === (n - 1) / 2;
    const left = i > 0 ? overlap : 0;
    const right = i < n - 1 ? overlap : 0;
    ctx.drawImage(middle ? mid : pieces[0], i * pw - left + shake, base - h + k * (h + 2), pw + left + right, h);
  }
  ctx.restore();
  // Dust along its foot while it moves.
  if (moving) {
    ctx.save();
    ctx.globalAlpha = 0.3 * Math.sin(wallUp * Math.PI);
    ctx.fillStyle = '#cbd5e1';
    for (let i = 0; i < 14; i++) {
      const x = (i + 0.5) * (BOARD_W / 14) + Math.sin(now * 9 + i) * 4;
      ctx.beginPath();
      ctx.ellipse(x, base - 2 - Math.abs(Math.sin(now * 11 + i * 1.7)) * 5, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/* Fusion's auto-merge: while the lightning plays, the newer unit walks over to its twin, slowly and then quicker,
   and the twin leans a little towards it and back, so the two meet where the merged unit will stand. */
const ease = (k: number) => k * k * (3 - 2 * k);
function mergePos(b: BoardGame, p: Piece, now: number) {
  const at = cellCentre(p.slot);
  const m = b.pending;
  if (!m || (m.a !== p.id && m.b !== p.id)) return at;
  const other = b.army.find((x) => x.id === (m.a === p.id ? m.b : m.a));
  if (!other) return at;
  const to = cellCentre(other.slot);
  const k = Math.max(0, Math.min(1, 1 - m.t / MERGE_DELAY));
  // The newer one goes the whole way; the twin only leans in, a quarter of it at most, back as they meet.
  const f = m.a === p.id ? ease(k) : 0.25 * Math.sin(k * Math.PI);
  // A little hop as they go.
  const hop = m.a === p.id ? -Math.abs(Math.sin(now * 14)) * 3 * (1 - k) : 0;
  return { x: at.x + (to.x - at.x) * f, y: at.y + (to.y - at.y) * f + hop };
}

/* A merge: a puff of smoke on the cell (the steam fusion's cloud, `fx/steam-cloud`) and the new unit popping up
   bigger and settling. */
const PUFF = 0.65;
const POP = 0.4;
let puffs: { x: number; y: number; at: number }[] = [];
let popped: { id: number; at: number } | null = null;
/** The rival building its army while you prepare, as a player would by hand: each unit is summoned as a bug, then
    merged up a step at a time, round robin, each merge a twin picked up from a free cell and dragged onto it (lifted,
    a little bigger, like your own drag) before the smoke and the step up. One step every `RIVAL_STEP` s, squeezed so
    it is all done in `RIVAL_ALL`, from when the round's prep began. Only to be seen: the wave is set from the start. */
const RIVAL_STEP = 0.8, RIVAL_ALL = 14, RIVAL_WAIT = 0.6, RIVAL_DRAG = 0.7;
let rival = { key: '', start: 0, seen: [] as number[] };
type RivalDrag = { tier: number; cast: number; x: number; y: number };
function rivalShown(b: BoardGame, spots: { tier: number; cast: number; x: number; y: number }[], now: number) {
  const key = `${b.world}:${b.round}:${b.lives}:${b.wave.join(',')}:${b.waveCasts.join(',')}`;
  if (rival.key !== key) rival = { key, start: now, seen: spots.map(() => -1) };
  const order: [number, number][] = [];
  const top = Math.max(0, ...spots.map((w) => w.tier));
  for (let lv = 0; lv <= top; lv++) spots.forEach((w, i) => { if (w.tier >= lv) order.push([i, lv]); });
  const step = Math.min(RIVAL_STEP, RIVAL_ALL / Math.max(1, order.length));
  const t = (now - rival.start - RIVAL_WAIT) / step;
  const shown = spots.map(() => -1);
  let drag: RivalDrag | null = null;
  for (let k = 0; k < order.length && k <= t; k++) {
    const [i, lv] = order[k];
    const into = t - k; // how far through its step this event is
    if (lv === 0 || into >= RIVAL_DRAG) { shown[i] = lv; continue; }
    // The twin, dragged from a free cell of the rival's half (the back row, by turn) onto the unit.
    const from = cellCentre({ c: (k * 2 + 1) % COLS, r: 0 });
    const e = into / RIVAL_DRAG;
    const ease = e < 0.5 ? 2 * e * e : 1 - (-2 * e + 2) ** 2 / 2;
    drag = { tier: lv - 1, cast: spots[i].cast, x: from.x + (spots[i].x - from.x) * ease, y: from.y + (spots[i].y - from.y) * ease - Math.sin(e * Math.PI) * 14 };
  }
  shown.forEach((lv, i) => {
    if (lv > rival.seen[i]) { puffs.push({ x: spots[i].x, y: spots[i].y, at: now }); rival.seen[i] = lv; }
  });
  return { shown, drag };
}

export function boardMerged(slot: Slot, id: number, now: number) {
  const c = cellCentre(slot);
  puffs.push({ x: c.x, y: c.y, at: now });
  popped = { id, at: now };
}
function drawPuffs(ctx: CanvasRenderingContext2D, now: number, retro: boolean, spread = 1) {
  puffs = puffs.filter((p) => now - p.at < PUFF);
  const img = boardFx('steam-cloud');
  for (const p of puffs) {
    const k = (now - p.at) / PUFF;
    ctx.save();
    ctx.globalAlpha = (1 - k) * 0.95;
    if (!retro && ok(img)) {
      // Three clouds swelling out from the cell.
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1 + 0.4;
        const w = CELL * (0.9 + k * 0.9);
        const h = (w * img.naturalHeight) / img.naturalWidth;
        ctx.drawImage(img, p.x * spread + Math.cos(a) * k * 16 - w / 2, p.y - 6 + Math.sin(a) * k * 10 - h / 2, w, h);
      }
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(p.x * spread, p.y, 14 + k * 22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
/** The size a unit just merged is drawn at: up to 1.35 at once, back to 1 over `POP`. */
const popScale = (id: number, now: number) => {
  if (!popped || popped.id !== id) return 1;
  const k = (now - popped.at) / POP;
  return k >= 1 ? 1 : 1 + 0.35 * (1 - k) * (1 - k);
};

/* Keep the enemy's own art intact. Its red ground ring, small downward marker and red health bar identify its
   side without covering the painted silhouette. */
function drawEnemyFigure(ctx: CanvasRenderingContext2D, fig: ReturnType<typeof figureOf>, now: number, retro: boolean, star = 1) {
  const k = FIG * boardStarScale(star);
  ctx.scale(k, k);
  drawBoardFigure(ctx, fig, now, retro);
}

function ring(ctx: CanvasRenderingContext2D, r: number, colour: string) {
  ctx.fillStyle = `${colour}55`;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.7, r * 1.15, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
function enemyBase(ctx: CanvasRenderingContext2D, r: number) {
  ring(ctx, r, '#f87171');
  ctx.fillStyle = '#fecaca';
  ctx.strokeStyle = 'rgba(69,10,10,0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-4, r * 0.95);
  ctx.lineTo(4, r * 0.95);
  ctx.lineTo(0, r * 0.95 + 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** Star upgrades grow the figure gently; rarity still colours the ring under its feet. */
const STAR_SCALE = [1, 1.1, 1.23];
export const RARITY_COLOUR = ['#94a3b8', '#38bdf8', '#c084fc', '#fb923c', '#f87171'];
export const boardStarScale = (star: number | undefined) => STAR_SCALE[Math.max(0, Math.min(2, (star ?? 1) - 1))];

/** Approximate body bounds relative to its cell/fighter origin, including draw.ts's offset to the ground shadow. */
export function boardUnitBounds(p: { tier: number; star?: number }) {
  const r = DRAW_R[p.tier];
  const k = FIG * boardStarScale(p.star);
  const h = r * k * (p.tier < 3 ? 2.3 : p.tier === 3 ? 2.8 : 3.3);
  const w = Math.max(CELL * 0.7, h * 0.8);
  return { x: -w / 2, y: r * k * 0.85 - h, w, h };
}

/* The existing star medallion contains the game's painted star. Isolate that centre once, recolour its shading
   to bronze/silver/gold, and cache the three small canvases instead of filtering sprites every frame. */
const STAR_METAL = [
  { dark: [112, 66, 20], light: [222, 149, 70], fallback: '#cd8b48' },
  { dark: [78, 94, 111], light: [247, 252, 255], fallback: '#d5e1ec' },
  { dark: [139, 74, 0], light: [255, 247, 170], fallback: '#facc15' },
];
const starPictures = new Map<number, HTMLCanvasElement>();
function starPicture(level: number) {
  const cached = starPictures.get(level);
  if (cached) return cached;
  const img = bonusImage('ui/icon_star.webp');
  if (!ok(img)) return null;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 120;
  const s = c.getContext('2d');
  if (!s) return null;
  const points = [[84, 29], [103, 61], [143, 67], [115, 96], [121, 136], [85, 118], [48, 136], [53, 96], [26, 68], [65, 61]];
  s.beginPath();
  points.forEach(([x, y], i) => i ? s.lineTo((x - 25) * 128 / 120, (y - 27) * 120 / 112) : s.moveTo((x - 25) * 128 / 120, (y - 27) * 120 / 112));
  s.closePath(); s.clip();
  s.drawImage(img, 25, 27, 120, 112, 0, 0, c.width, c.height);
  const pixels = s.getImageData(0, 0, c.width, c.height);
  const { dark, light } = STAR_METAL[level - 1];
  for (let i = 0; i < pixels.data.length; i += 4) {
    if (!pixels.data[i + 3]) continue;
    const shade = Math.max(0, Math.min(1, (pixels.data[i] * 0.2126 + pixels.data[i + 1] * 0.7152 + pixels.data[i + 2] * 0.0722 - 25) / 230));
    for (let ch = 0; ch < 3; ch++) pixels.data[i + ch] = dark[ch] + (light[ch] - dark[ch]) * shade;
  }
  s.putImageData(pixels, 0, 0);
  starPictures.set(level, c);
  return c;
}

function drawStars(ctx: CanvasRenderingContext2D, x: number, y: number, star: number | undefined, now: number, retro: boolean) {
  const n = Math.max(1, Math.min(3, star ?? 1));
  const size = 14;
  const width = size * (1 + (n - 1) * 0.5);
  const img = retro ? null : starPicture(n);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const sx = x - width / 2 + i * size * 0.5;
    if (img) ctx.drawImage(img, sx, y - size / 2, size, size);
    else {
      ctx.fillStyle = STAR_METAL[n - 1].fallback;
      ctx.strokeStyle = '#172033'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let j = 0; j < 10; j++) {
        const a = -Math.PI / 2 + j * Math.PI / 5;
        const r = size * (j % 2 ? 0.22 : 0.49);
        const px = sx + size / 2 + Math.cos(a) * r, py = y + Math.sin(a) * r;
        if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  void now;
  ctx.restore();
}

/** Fusion's tier pips or Tactics' asset stars, plus the same bonus icon the shop and side panel use. */
function marks(ctx: CanvasRenderingContext2D, x: number, y: number, p: { tier: number; cast: number; star?: number }, tactics: boolean, retro: boolean, now: number, native: boolean) {
  if (tactics) {
    drawStars(ctx, x, y - CELL * 0.42 + boardUnitBounds(p).y - 9, p.star, now, retro);
  } else {
    const n = p.tier + 1;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = p.tier >= 3 ? '#fcd34d' : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(x + (i - (n - 1) / 2) * 6, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(8,12,28,0.85)';
  ctx.beginPath();
  ctx.arc(x + CELL * 0.36, y - CELL * 0.62, 7, 0, Math.PI * 2);
  ctx.fill();
  if (native) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const icon = bonusImage(tactics ? ABILITY_PIC[ABILITY[p.cast]] : SYNERGY_PIC[p.cast]);
  if (!retro && ok(icon)) {
    ctx.drawImage(icon, x + CELL * 0.36 - 7, y - CELL * 0.62 - 7, 14, 14);
    return;
  }
  if (tactics) {
    // Tactics: the unit's world ability, not its world's number.
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillStyle = '#e0f2fe';
    ctx.fillText(ABILITY_ICON[ABILITY[p.cast]] ?? String(p.cast), x + CELL * 0.36, y - CELL * 0.62 + 1);
    return;
  }
  ctx.fillStyle = '#fcd34d';
  ctx.font = '700 9px system-ui, sans-serif';
  ctx.fillText(String(p.cast), x + CELL * 0.36, y - CELL * 0.62 + 0.5);
}

/** Each world ability's symbol on a Tactics unit. */
export const ABILITY_ICON: Record<Ability, string> = { poison: '☠', burn: '🔥', freeze: '❄', slow: '🐌', drain: '🩸', shock: '⚡', armor: '🛡', dodge: '👻', power: '💪' };
export const ABILITY_PIC: Record<Ability, string> = {
  poison: 'fx/venom.webp', burn: 'fx/flame-orange.webp', freeze: 'skills/frost.webp', slow: 'fx/mud-splat.webp',
  drain: 'skills/vampire.webp', shock: 'skills/bolt.webp', armor: 'forge/armor.webp', dodge: 'skills/dodge.webp', power: 'skills/power.webp',
};
export const SYNERGY_PIC: Record<number, string> = {
  1: 'forge/vitality.webp', 2: ABILITY_PIC.burn, 3: 'fx/ice-block.webp', 4: ABILITY_PIC.armor,
  5: 'skills/drink.webp', 6: 'skills/speed.webp', 7: ABILITY_PIC.shock, 8: ABILITY_PIC.dodge, 9: ABILITY_PIC.power,
};
const bonusImages = new Map<string, HTMLImageElement>();
function bonusImage(path: string) {
  let img = bonusImages.get(path);
  if (!img) { img = Object.assign(new Image(), { src: `./images/game/${path}` }); bonusImages.set(path, img); }
  return img;
}

function drawFighterBonuses(ctx: CanvasRenderingContext2D, f: BoardGame['fighters'][number], now: number, retro: boolean, healthY: number, spread = 1) {
  const picture = (path: string, x: number, y: number, size: number, alpha = 1) => {
    const img = bonusImage(path);
    if (retro || !ok(img)) return;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  };
  const x = f.x * spread;
  if (f.synLv > 0) picture(f.tac ? ABILITY_PIC[ABILITY[f.syn]] : SYNERGY_PIC[f.syn], x + f.r + 7, healthY + 2, 12);
  if (f.poison > 0) picture(ABILITY_PIC.poison, x - f.r, f.y - 6 + Math.sin(now * 6) * 3, 14);
  if (f.burn > 0) picture('fx/flame-orange.webp', x + f.r * 0.7, f.y - 4, 22 + Math.sin(now * 11) * 2);
  if (f.freeze > 0) picture('fx/ice-block.webp', x, f.y - f.r, f.r * 3.2, 0.72);
  else if (f.slow > 0) picture(f.slowKind === 'mud' ? ABILITY_PIC.slow : ABILITY_PIC.freeze, x, f.y + f.r * 0.55, 16, 0.85);
}

function drawBonusEffects(ctx: CanvasRenderingContext2D, b: BoardGame, retro: boolean, spread = 1) {
  for (const e of b.effects) {
    const k = e.age / 0.5;
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k);
    const x = e.x * spread;
    if (e.kind === 'arc' && e.tx !== undefined && e.ty !== undefined) {
      const tx = e.tx * spread;
      const dx = tx - x, dy = e.ty - e.y;
      const bolt = bonusImage('fx/bolt-y-1.webp');
      if (!retro && ok(bolt)) {
        ctx.translate(x, e.y - 8); ctx.rotate(Math.atan2(dy, dx) - Math.PI / 2);
        ctx.drawImage(bolt, -7, 0, 14, Math.hypot(dx, dy));
      } else {
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, e.y - 8); ctx.lineTo((x + tx) / 2 + 5, (e.y + e.ty) / 2 - 12); ctx.lineTo(tx, e.ty - 8); ctx.stroke();
      }
    } else {
      const path = e.kind === 'heal' ? 'fx/heart.webp' : e.kind === 'armor' ? ABILITY_PIC.armor : e.kind === 'power' ? 'fx/crit-spark.webp' : ABILITY_PIC.dodge;
      const img = bonusImage(path);
      const size = e.kind === 'power' ? 27 : 18;
      const y = e.y - 30 - k * 16;
      if (!retro && ok(img)) ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
      else { ctx.fillStyle = e.kind === 'heal' ? '#4ade80' : '#fde047'; ctx.font = 'bold 12px system-ui'; ctx.fillText(e.kind === 'heal' ? '+' : e.kind === 'dodge' ? '↷' : '✦', x, y); }
    }
    ctx.restore();
  }
}

const ok = (img: HTMLImageElement) => img.complete && img.naturalWidth > 0;
/** Where each commander stands (its feet), in the board's corner cells. */
const MINE = { x: BOARD_W - 30, y: BOARD_H + 4 };
const RIVAL = { x: CELL / 2 + 4, y: CELL - 12 };

/** A round won: the hero cheers, hopping, with gold sparks and confetti bursting round it (`party`, seconds since the
   fireball struck the rival). */
const CONFETTI = ['#fde047', '#f472b6', '#38bdf8', '#4ade80', '#fb923c', '#c084fc'];
function drawParty(ctx: CanvasRenderingContext2D, party: number, x = MINE.x, y = MINE.y) {
  // Two bursts of confetti over the hero's head, one at once and one a little later, falling and fading.
  for (let burst = 0; burst < 2; burst++) {
    const t = party - burst * 0.7;
    if (t < 0 || t > 1.6) continue;
    for (let i = 0; i < 22; i++) {
      const a = -Math.PI / 2 + ((i * 2.399 + burst) % 1.9) - 0.95;
      const v = 70 + ((i * 37) % 50);
      const px = x + Math.cos(a) * v * t;
      const py = y - 46 + Math.sin(a) * v * t + 70 * t * t;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / 1.6);
      ctx.translate(px, py);
      ctx.rotate(t * 9 + i);
      ctx.fillStyle = CONFETTI[i % CONFETTI.length];
      ctx.fillRect(-2.5, -1.2, 5, 2.4 * Math.abs(Math.cos(t * 7 + i)) + 0.6);
      ctx.restore();
    }
  }
  // Gold sparkles twinkling round it the whole time.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const tw = Math.sin(party * 6 + i * 1.7);
    if (tw < 0) continue;
    const a = i * 1.05 + party * 0.8;
    const sx = x + Math.cos(a) * 26, sy = y - 30 + Math.sin(a) * 22;
    const r = 2 + tw * 3.5;
    ctx.globalAlpha = tw;
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.moveTo(sx, sy - r); ctx.lineTo(sx + r * 0.3, sy - r * 0.3); ctx.lineTo(sx + r, sy); ctx.lineTo(sx + r * 0.3, sy + r * 0.3);
    ctx.lineTo(sx, sy + r); ctx.lineTo(sx - r * 0.3, sy + r * 0.3); ctx.lineTo(sx - r, sy); ctx.lineTo(sx - r * 0.3, sy - r * 0.3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawHero(ctx: CanvasRenderingContext2D, pics: HeroPics, pose: HTMLImageElement, now: number, hit: number, party = -1, at = MINE, scale = 1) {
  const { x, y } = at;
  // Customise's portal under its feet, its ring's middle at 74.6% of the picture's height.
  if (ok(pics.pad)) {
    const w = 80 * scale;
    const h = (w * pics.pad.naturalHeight) / pics.pad.naturalWidth;
    ctx.drawImage(pics.pad, x - w / 2, y - h * 0.746, w, h);
  } else {
    ctx.fillStyle = 'rgba(56,189,248,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y, 34 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const img = ok(pose) ? pose : pics.front;
  if (!ok(img)) return;
  const h = Math.min(72 * scale, (72 * scale * img.naturalHeight) / img.naturalWidth);
  const w = (h * img.naturalWidth) / img.naturalHeight;
  ctx.save();
  // Celebrating, it hops, squashing a little as it lands.
  const hop = party >= 0 ? Math.abs(Math.sin(party * 7)) : 0;
  const footY = y + (Math.sin(now * 2.2) * 0.8 - hop * 9) * scale;
  ctx.translate(x, footY);
  ctx.scale(-1 * (1 + (1 - hop) * 0.05 * (party >= 0 ? 1 : 0)), 1 - (1 - hop) * 0.05 * (party >= 0 ? 1 : 0));
  ctx.drawImage(img, -w / 2, -h, w, h);
  if (hit > 0) { ctx.globalAlpha = hit; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(img, -w / 2, -h, w, h); }
  ctx.restore();
  if (party >= 0) drawParty(ctx, party, x, y);
}

/** A pose of your hero with its colours inverted, for the rival (worked out once per picture and kept). */
const negatives = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
function negative(img: HTMLImageElement) {
  let c = negatives.get(img);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const t = c.getContext('2d');
  if (!t) return img;
  t.drawImage(img, 0, 0);
  // White minus every colour, then the picture's own alpha back on.
  t.globalCompositeOperation = 'difference';
  t.fillStyle = '#fff';
  t.fillRect(0, 0, c.width, c.height);
  t.globalCompositeOperation = 'destination-in';
  t.drawImage(img, 0, 0);
  negatives.set(img, c);
  return c;
}

function drawRival(ctx: CanvasRenderingContext2D, pics: HeroPics, pose: HTMLImageElement, now: number, hit: number, gone: number, at = RIVAL, scale = 1) {
  const { x, y } = at;
  ctx.save();
  ctx.translate(x, y);
  // Customise's portal turned red under its feet (its ring's middle at 74.6% of the picture's height).
  const pad = pics.padRed;
  if (ok(pad)) {
    const w = 80 * scale;
    const h = (w * pad.naturalHeight) / pad.naturalWidth;
    ctx.drawImage(pad, -w / 2, -h * 0.746, w, h);
  } else {
    ctx.strokeStyle = 'rgba(248,113,113,0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 34 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Your own hero, its colours inverted, facing the board (against a friend, their own hero as it is); it sinks and
  // fades once beaten.
  const key = (['front', 'shoot', 'hurt', 'cheer', 'down'] as const).find((k) => pics[k] === pose) ?? 'front';
  const theirs = pics.rival && ok(pics.rival[key]) ? pics.rival[key] : null;
  const img = theirs ?? (ok(pose) ? pose : pics.front);
  if (ok(img)) {
    const h = Math.min(72 * scale, (72 * scale * img.naturalHeight) / img.naturalWidth);
    const w = (h * img.naturalWidth) / img.naturalHeight;
    const pic = theirs ?? negative(img);
    ctx.globalAlpha = 1 - gone;
    ctx.translate(0, gone * 8 + Math.sin(now * 2.2 + 1) * 0.8);
    ctx.drawImage(pic, -w / 2, -h, w, h);
    if (hit > 0) { ctx.globalAlpha = (1 - gone) * hit; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(pic, -w / 2, -h, w, h); }
  }
  ctx.restore();
}

/** A commander's health over its head: one heart and «×N». Until the fireball strikes it still counts the hearts
    the round has just cost (`pop`); then the heart beats and the count drops. */
function hearts(ctx: CanvasRenderingContext2D, cx: number, y: number, left: number, pop: number, popAt: number, retro: boolean) {
  const img = boardFx('heart');
  const { size } = HEARTS;
  const n = popAt > 0 ? left : left + pop;
  const beat = pop && popAt > 0 ? 1 + Math.sin(Math.min(1, popAt) * Math.PI) * 0.6 : 1;
  const label = `×${n}`;
  ctx.save();
  ctx.font = '800 11px system-ui, sans-serif';
  const w = size + 2 + ctx.measureText(label).width;
  const x = cx - w / 2;
  // A dark pill behind, so it reads on any floor.
  ctx.fillStyle = 'rgba(8,12,28,0.72)';
  ctx.beginPath();
  ctx.roundRect(x - 4, y - size / 2 - 2, w + 8, size + 4, (size + 4) / 2);
  ctx.fill();
  ctx.translate(x + size / 2, y);
  ctx.scale(beat, beat);
  if (!retro && ok(img)) ctx.drawImage(img, -size / 2, -size / 2, size, size);
  else { ctx.fillStyle = '#f472b6'; ctx.font = `${size + 2}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('❤', 0, 0.5); }
  ctx.restore();
  ctx.save();
  ctx.font = '800 11px system-ui, sans-serif';
  ctx.fillStyle = n <= 3 ? '#fca5a5' : '#f8fafc';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + size + 2, y + 0.5);
  ctx.restore();
}

/** The rival commander's remaining lives after round damage. */
const rivalHp = (b: BoardGame) => b.online ? b.online.rivalLives : b.rivalLives;

/** Against a person the fight is the same on both phones, the host's army on side 0 at the bottom; the guest's
    screen draws it turned round, so its own army is at the bottom too: every unit, shot and blow put at the opposite
    point of the board, its side and its facing swapped. Only to be drawn: the rules go on with the real fight. */
export function mirrorFight(b: BoardGame): BoardGame {
  const mx = (x: number) => BOARD_W - x, my = (y: number) => BOARD_H - y;
  return {
    ...b,
    fighters: b.fighters.map((f) => ({
      ...f, x: mx(f.x), y: my(f.y), side: (1 - f.side) as 0 | 1, face: -f.face, dir: { x: -f.dir.x, y: -f.dir.y },
      leap: f.leap && { ...f.leap, fx: mx(f.leap.fx), fy: my(f.leap.fy), tx: mx(f.leap.tx), ty: my(f.leap.ty) },
    })),
    shots: b.shots.map((s) => ({ ...s, x: mx(s.x), y: my(s.y), vx: -s.vx, vy: -s.vy, side: (1 - s.side) as 0 | 1 })),
    impacts: b.impacts.map((i) => ({ ...i, x: mx(i.x), y: my(i.y) })),
    effects: b.effects.map((e) => ({ ...e, x: mx(e.x), y: my(e.y), ...(e.tx !== undefined && e.ty !== undefined ? { tx: mx(e.tx), ty: my(e.ty) } : {}) })),
    bossAttacks: b.bossAttacks.map((a) => ({ ...a, x: mx(a.x), y: my(a.y), a: a.a + Math.PI, side: (1 - a.side) as 0 | 1 })),
  };
}

export function drawBoard(ctx: CanvasRenderingContext2D, b: BoardGame, lay: BoardLayout, now: number, drag: BoardDrag | null, retro: boolean, dpr: number, pics: HeroPics, ended: number | null, floor: { top: number; bottom: number; width?: number; widthScale?: number; controlsTop?: number; scene?: number }, commandersOutsideBoard = false) {
  const tactics = b.variant === 'tactics';
  // Move the complete hero and portal together. Their sizes never stretch to fill the side margin.
  const fieldRight = floor.width ?? ctx.canvas.width / dpr;
  const spread = lay.sx / lay.s;
  const boardRight = lay.ox + BOARD_W * lay.sx;
  const heroScale = (commandersOutsideBoard ? 1.15 : 1) / lay.s;
  const rivalScale = heroScale;
  // Near-square desktop windows put the hero below the shorter card stack, clear of the fight controls.
  const compactShop = tactics && fieldRight <= 1200 && fieldRight / (ctx.canvas.height / dpr) <= 1.2;
  // Both desktop variants use the open margins beside the grid, clear of the shop and its controls.
  const marginPoint = (x: number, height: number, bottom = floor.bottom - 24) => ({
    x: (x - lay.ox) / lay.s,
    y: (Math.min(bottom, Math.max(floor.top + 112, floor.top + (floor.bottom - floor.top) * height)) - lay.oy) / lay.s,
  });
  const mineX = Math.min(fieldRight - 54, boardRight + 64);
  const mineBottom = mineX + 46 > fieldRight - 220 ? Math.min(floor.bottom - 32, (floor.controlsTop ?? floor.bottom) - 42) : floor.bottom - 32;
  const commanders = {
    mine: commandersOutsideBoard
      ? compactShop
        ? { x: (mineX - lay.ox) / lay.s, y: (floor.bottom - 96 - lay.oy) / lay.s }
        : marginPoint(mineX, 0.75, mineBottom)
      : { x: (fieldRight - 52 - lay.ox) / lay.s, y: BOARD_H - 64 },
    rival: commandersOutsideBoard
      ? marginPoint(Math.max(54, lay.ox - 64), 0.25)
      : { x: (52 - lay.ox) / lay.s, y: (floor.top + 90 - lay.oy) / lay.s },
  };
  // The world's whole arena floor, walls and corners, as in a sprint, from under the top bar to over the buttons;
  // the board is only its grid.
  drawBoardBackdrop(ctx, b.world, ctx.canvas.width / dpr, floor.top, floor.bottom, dpr, retro, floor.width, floor.widthScale, !commandersOutsideBoard, floor.scene);
  ctx.setTransform(dpr * lay.s, 0, 0, dpr * lay.s, dpr * lay.ox, dpr * lay.oy);
  // Only the grid and its wall use the wider transform; sprites and effects keep their own proportions.
  ctx.save();
  ctx.scale(spread, 1);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, BOARD_W, BOARD_H, 10);
  ctx.clip();
  // The enemy's half a little darker and redder, yours a little bluer.
  ctx.fillStyle = 'rgba(40,6,16,0.22)';
  ctx.fillRect(0, 0, BOARD_W, WALL_ROW * CELL);
  ctx.fillStyle = 'rgba(8,12,20,0.35)';
  ctx.fillRect(0, WALL_ROW * CELL, BOARD_W, CELL);
  ctx.fillStyle = 'rgba(6,14,40,0.12)';
  ctx.fillRect(0, HOME_ROW * CELL, BOARD_W, BOARD_H - HOME_ROW * CELL);
  // The grid and the line between the halves are only there to lay the units out: once the fight starts they go.
  if (b.phase === 'prep') {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, BOARD_H); ctx.stroke(); }
    for (let r = 1; r < ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(BOARD_W, r * CELL); ctx.stroke(); }
    ctx.strokeRect(0.5, 0.5, BOARD_W - 1, BOARD_H - 1);
    // The dashed line, until the world's wall pieces are in (and in retro).
    if (retro || !boardWallPieces(b.world).every(ok)) {
      ctx.strokeStyle = 'rgba(252,211,77,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, HOME_ROW * CELL);
      ctx.lineTo(BOARD_W, HOME_ROW * CELL);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.restore();
  drawWall(ctx, b, now, retro);
  ctx.restore();

  // The fireball at the end of a fight: yours at the rival after a win, the rival's at you otherwise.
  const won = b.last?.result === 'win';
  const fly = ended === null ? -1 : ended / FIREBALL.fly;
  const struck = ended === null ? 0 : Math.max(0, 1 - Math.abs(ended - FIREBALL.fly) / FIREBALL.blast);
  const done = ended !== null && ended > FIREBALL.fly;
  const rivalGone = b.phase === 'won' && done ? Math.min(1, (ended! - FIREBALL.fly) / 0.6) : 0;
  // The rival's pose, from your hero's: aiming while it throws at you, hurt when struck, cheering once you are out.
  const rivalPose = b.phase === 'over' && done ? pics.cheer : ended !== null && !won && !done ? pics.shoot : won && struck > 0 ? pics.hurt : pics.front;
  drawRival(ctx, pics, rivalPose, now, won ? struck : 0, rivalGone, commanders.rival, rivalScale);
  // A round won: it cheers and celebrates once its fireball has struck (the world won too).
  const party = won && done ? ended! - FIREBALL.fly : -1;
  const pose = b.phase === 'over' && done ? pics.down : ended !== null && won && !done ? pics.shoot : party >= 0 ? pics.cheer : !won && struck > 0 ? pics.hurt : pics.front;
  // Phone Tactics shows your hearts at the lower left, by the bench's caption (`.board-life` in main.ts).
  if (commandersOutsideBoard || !tactics) {
    drawHero(ctx, pics, pose, now, won ? 0 : struck * 0.6, party, commanders.mine, heroScale);
  }

  // Where the dragged unit would go: green to move, gold to merge.
  if (drag?.over) {
    const target = pieceAt(b, drag.over);
    const merge = target && canMerge(drag.piece, target, b.variant);
    const c = cellCentre(drag.over);
    ctx.save();
    ctx.scale(spread, 1);
    ctx.fillStyle = !homeCell(drag.over) ? 'rgba(248,113,113,0.2)' : merge ? 'rgba(252,211,77,0.42)' : 'rgba(74,222,128,0.26)';
    ctx.fillRect(c.x - CELL / 2 + 2, c.y - CELL / 2 + 2, CELL - 4, CELL - 4);
    ctx.restore();
  }
  if (b.phase === 'prep' || !b.fighters.length) {
    // The coming wave, faint, on its half, built up before your eyes while you prepare: the rival summons its units one
    // by one and merges them up to what it will field (`rivalShown`), with the merge's smoke on each step.
    const spots = waveSpots(b);
    const { shown, drag: twin } = rivalShown(b, spots, now);
    spots.forEach((w, i) => {
      const tier = shown[i];
      if (tier < 0) return;
      ctx.save();
      ctx.translate(w.x * spread, w.y);
      ctx.globalAlpha = 0.5 + Math.sin(now * 2.5) * 0.08;
      enemyBase(ctx, TIER_STATS[tier].r);
      drawEnemyFigure(ctx, figureOf(tier as Tier, w.cast, -1, 0, 0, 0), now, retro, tactics ? w.star : 1);
      if (tactics) drawStars(ctx, 0, boardUnitBounds({ tier, star: w.star }).y - 9, w.star, now, retro);
      ctx.restore();
    });
    if (twin) {
      ctx.save();
      ctx.translate(twin.x * spread, twin.y);
      ctx.globalAlpha = 0.75;
      ctx.scale(1.12, 1.12);
      drawEnemyFigure(ctx, figureOf(twin.tier as Tier, twin.cast, -1, 0, 0, 0), now, retro);
      ctx.restore();
    }
    const pieces = [...b.army].sort((p, q) => p.slot.r - q.slot.r);
    for (const p of pieces) {
      if (drag?.piece === p) continue;
      const c = mergePos(b, p, now);
      ctx.save();
      ctx.translate(c.x * spread, c.y);
      ring(ctx, TIER_STATS[p.tier].r, tactics ? RARITY_COLOUR[p.tier] : '#38bdf8');
      const pop = popScale(p.id, now) * (tactics ? boardStarScale(p.star) : 1);
      ctx.scale(FIG * pop, FIG * pop);
      drawBoardFigure(ctx, figureOf(p.tier, p.cast, 1, 0, 0, 0), now, retro);
      ctx.restore();
      marks(ctx, c.x * spread, c.y + CELL * 0.42, p, tactics, retro, now, p.cast === b.world);
    }
  } else {
    const live = b.fighters.filter((f) => !f.dead).sort((p, q) => p.y - q.y);
    drawBossMoves(ctx, b, live, now, retro, spread);
    for (const f of live) {
      const colour = f.side === 0 ? '#38bdf8' : '#f87171';
      // A leap: the figure up in an arc over its shadow on the floor, in its charge pose.
      const lift = f.leap ? Math.sin(Math.min(1, f.leap.t / LEAP.time) * Math.PI) * 70 : 0;
      const dirLength = Math.hypot(f.dir.x * spread, f.dir.y) || 1;
      const move = { aim: f.aim, dash: f.leap ? 1 : f.dash, dir: { x: f.dir.x * spread / dirLength, y: f.dir.y / dirLength }, pose: f.bossPoseTime, act: f.bossPose === 'sig' ? 'sig' as const : f.bossPose ? 'move' as const : 'burst' as const, chan: f.channel };
      ctx.save();
      ctx.translate(f.x * spread, f.y);
      if (f.leap) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(0, f.r * 0.7, f.r * (1.2 - lift / 140), f.r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.translate(0, -lift);
      } else if (f.side === 1) enemyBase(ctx, f.r);
      else ring(ctx, f.r, tactics ? RARITY_COLOUR[f.tier] : colour);
      if (f.side === 1) drawEnemyFigure(ctx, figureOf(f.tier, f.cast, f.face, f.step, f.swing, f.hit, move), now, retro, tactics ? f.star : 1);
      else { const k = FIG * (tactics ? boardStarScale(f.star) : 1); ctx.scale(k, k); drawBoardFigure(ctx, figureOf(f.tier, f.cast, f.face, f.step, f.swing, f.hit, move), now, retro); }
      ctx.restore();
      const w = Math.max(22, f.r * 2);
      const headY = f.y - lift + boardUnitBounds({ tier: f.tier, star: tactics ? f.star : 1 }).y;
      const y = headY - (tactics ? 22 : 7);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(f.x * spread - w / 2, y, w, 4);
      ctx.fillStyle = f.side === 0 ? '#4ade80' : '#f87171';
      ctx.fillRect(f.x * spread - w / 2, y, (w * Math.max(0, f.hp)) / f.maxHp, 4);
      drawFighterBonuses(ctx, f, now, retro, y, spread);
      // Keep Tactics' metal star marks visible over every unit during the fight. The top-row marks stay inside the board.
      if (tactics) drawStars(ctx, f.x * spread, Math.max(headY - 32, 12), f.star, now, retro);
    }
    for (const s of b.shots) {
      if (s.delay && s.delay > 0) continue;
      if (s.pic && s.el) drawBoardOrb(ctx, s.pic, s.x * spread, s.y, s.vx * spread, s.vy, s.r ?? 6, s.el, now, retro, s.from ?? 0);
      else {
        ctx.fillStyle = s.ring ? '#e879f9' : s.side === 0 ? '#7dd3fc' : '#fca5a5';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(s.x * spread, s.y, s.ring ? 5 : 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      }
    }
    drawBonusEffects(ctx, b, retro, spread);
  }
  if (ended !== null && fly < 1) {
    const mine = commanders.mine;
    const rival = commanders.rival;
    const from = won ? { x: mine.x - 12 * heroScale, y: mine.y - 36 * heroScale } : { x: rival.x + 10 * rivalScale, y: rival.y - 20 * rivalScale };
    const to = won ? { x: rival.x, y: rival.y - 22 * rivalScale } : { x: mine.x, y: mine.y - 30 * heroScale };
    const k = Math.max(0, fly);
    const x = from.x + (to.x - from.x) * k;
    const y = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * 60 * heroScale;
    const dx = to.x - from.x, dy = to.y - from.y - Math.cos(k * Math.PI) * 60 * Math.PI * heroScale;
    const ball = boardFx('fireball');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(dy, dx));
    if (!retro && ok(ball)) {
      const w = 58 * heroScale;
      ctx.drawImage(ball, -w * 0.75, -w * 0.3, w, w * (ball.naturalHeight / ball.naturalWidth));
    } else {
      ctx.fillStyle = '#fb923c';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 16 * heroScale;
      ctx.beginPath();
      ctx.arc(0, 0, 10 * heroScale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  if (ended !== null && ended > FIREBALL.fly && ended < FIREBALL.fly + FIREBALL.blast) {
    const hit = won ? commanders.rival : commanders.mine;
    const at = { x: hit.x, y: hit.y - (won ? 22 * rivalScale : 30 * heroScale) };
    const k = (ended - FIREBALL.fly) / FIREBALL.blast;
    const boom = boardFx('boom-big');
    ctx.save();
    ctx.globalAlpha = 1 - k;
    if (!retro && ok(boom)) {
      const w = (70 + k * 40) * (won ? rivalScale : heroScale);
      ctx.drawImage(boom, at.x - w / 2, at.y - w / 2, w, w * (boom.naturalHeight / boom.naturalWidth));
    } else {
      ctx.fillStyle = '#fdba74';
      ctx.beginPath();
      ctx.arc(at.x, at.y, (20 + k * 30) * (won ? rivalScale : heroScale), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  // The hearts last, over everything on the board: the rival's above it, yours over your hero's head. Until the
  // fireball strikes they still show the hearts the round has just cost; then those burst.
  const popAt = ended === null ? 1 : Math.max(0, Math.min(1, (ended - FIREBALL.fly) / FIREBALL.blast));
  const rivalPop = ended === null ? 0 : b.online ? b.online.rivalLost ?? 0 : b.last?.rivalLost ?? 0;
  const minePop = !won && ended !== null ? b.last?.lost ?? 0 : 0;
  const mine = commanders.mine;
  const rival = commanders.rival;
  const rivalHeartY = rival.y - (commandersOutsideBoard ? 82 : 48) * rivalScale;
  hearts(ctx, commandersOutsideBoard ? rival.x : rival.x + 50, rivalHeartY, rivalHp(b), rivalPop, done ? popAt : 0, retro);
  // Phone Tactics shows your hearts at the lower left, by the bench's caption (`.board-life` in main.ts).
  if (commandersOutsideBoard || !tactics) {
    hearts(ctx, mine.x, mine.y - 82 * heroScale, b.lives, minePop, done ? popAt : 0, retro);
  }
  // Your commander's fireball in the fight: from your hero onto the enemies' thickest knot, then its blast.
  if (b.strike) {
    const k = 1 - b.strike.t / STRIKE.fly;
    const from = { x: mine.x - 12 * heroScale, y: mine.y - 36 * heroScale };
    const x = from.x + (b.strike.x * spread - from.x) * k;
    const y = from.y + (b.strike.y - from.y) * k - Math.sin(k * Math.PI) * 70 * heroScale;
    const ball = boardFx('fireball');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(b.strike.y - from.y - Math.cos(k * Math.PI) * 70 * Math.PI * heroScale, b.strike.x * spread - from.x));
    if (!retro && ok(ball)) { const w = 54 * heroScale; ctx.drawImage(ball, -w * 0.74, -w * 0.26, w, w * (ball.naturalHeight / ball.naturalWidth)); }
    else { ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.arc(0, 0, 9 * heroScale, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  if (b.boom) {
    const k = b.boom.age / 0.5;
    const boom = boardFx('boom-big');
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - k);
    const w = STRIKE.reach * 2 * (0.7 + k * 0.4);
    if (!retro && ok(boom)) ctx.drawImage(boom, b.boom.x * spread - w / 2, b.boom.y - (w * boom.naturalHeight) / boom.naturalWidth / 2, w, (w * boom.naturalHeight) / boom.naturalWidth);
    else { ctx.fillStyle = '#fdba74'; ctx.beginPath(); ctx.arc(b.boom.x * spread, b.boom.y, w / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  // The auto-merge's lightning between the two units about to merge: the lightning arrows' yellow arcs, redrawn
  // jagged a dozen times a second, thicker as the merge comes, both units glowing.
  if (b.pending) {
    const p = b.army.find((x) => x.id === b.pending!.a);
    const q = b.army.find((x) => x.id === b.pending!.b);
    if (p && q) {
      const k = 1 - b.pending.t / MERGE_DELAY;
      const A = mergePos(b, p, now), B = mergePos(b, q, now);
      const from = { x: A.x * spread, y: A.y - 10 }, to = { x: B.x * spread, y: B.y - 10 };
      const seed = Math.floor(now * 14);
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = retro ? 0 : 12;
      for (let arc = 0; arc < 2; arc++) {
        const pts = [from];
        const n = 7;
        for (let i = 1; i < n; i++) {
          const f = i / n;
          const r = Math.sin((seed + arc * 7) * 12.9898 + i * 78.233) * 43758.5453;
          const off = (r - Math.floor(r) - 0.5) * 22;
          const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy) || 1;
          pts.push({ x: from.x + dx * f - (dy / len) * off, y: from.y + dy * f + (dx / len) * off });
        }
        pts.push(to);
        for (const [w, c] of [[5 + k * 4, 'rgba(250,204,21,0.45)'], [1.8 + k * 1.4, '#fef9c3']] as [number, string][]) {
          ctx.strokeStyle = c;
          ctx.lineWidth = w;
          ctx.beginPath();
          pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
          ctx.stroke();
        }
      }
      // A glow on each, growing.
      for (const c of [from, to]) {
        const gl = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, 26 + k * 10);
        gl.addColorStop(0, `rgba(254,249,195,${0.55 + k * 0.35})`);
        gl.addColorStop(1, 'rgba(250,204,21,0)');
        ctx.fillStyle = gl;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 36, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  drawPuffs(ctx, now, retro, spread);
}

/** The unit being dragged, on its own canvas over the board's top bar and shop, so it is never hidden under them. */
export function drawBoardDrag(ctx: CanvasRenderingContext2D, lay: BoardLayout, drag: BoardDrag | null, now: number, retro: boolean, dpr: number, tactics: boolean) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (!drag) return;
  ctx.setTransform(dpr * lay.s, 0, 0, dpr * lay.s, dpr * lay.ox, dpr * lay.oy);
  const x = (drag.x - lay.ox) / lay.s;
  const y = (drag.y - lay.oy) / lay.s;
  ctx.translate(x, y - 10);
  const k = FIG * 1.12 * (tactics ? boardStarScale(drag.piece.star) : 1);
  ctx.save();
  ctx.scale(k, k);
  drawBoardFigure(ctx, figureOf(drag.piece.tier, drag.piece.cast, 1, 0, 0, 0), now, retro);
  ctx.restore();
  if (tactics) drawStars(ctx, 0, boardUnitBounds(drag.piece).y * 1.12 - 9, drag.piece.star, now, retro);
}


