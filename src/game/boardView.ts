import { BOARD_H, BOARD_W, CELL, COLS, FINAL_ID, ROWS, TIER_KIND, TIER_STATS, canMerge, castLook, cellCentre, heroFor, pieceAt, type BoardGame, type Piece, type Slot, type Tier } from './board';
import { boardFloor, drawBoardFigure } from './draw';

/* Drawing the board mode on the game's canvas: the world's floor under a grid, your bugs on it with their casts'
   own pictures, and the hero, drawn from the worn skin's poses, coming down from the top (faintly above the board
   while you prepare, with its round's strength). */

/** The units are drawn bigger than their hit circles, so they fill their cells. */
const FIG = 1.4;
/** Room above the board for the hero waiting to come in. */
const TOP = 46;

export type BoardLayout = { s: number; ox: number; oy: number };

/** Fits the board (and the strip above it) into the area between the top bar and the shop. */
export function layoutBoard(w: number, top: number, bottom: number): BoardLayout {
  const room = Math.max(120, bottom - top);
  const s = Math.min((w - 16) / BOARD_W, room / (BOARD_H + TOP));
  return { s, ox: (w - BOARD_W * s) / 2, oy: top + TOP * s + (room - (BOARD_H + TOP) * s) / 2 };
}

/** The cell under a point on the screen, or null off the board. */
export function slotAt(lay: BoardLayout, px: number, py: number): Slot | null {
  const x = (px - lay.ox) / lay.s;
  const y = (py - lay.oy) / lay.s;
  if (x < 0 || x >= BOARD_W || y < 0 || y >= BOARD_H) return null;
  return { c: Math.floor(x / CELL), r: Math.floor(y / CELL) };
}

export type BoardDrag = { piece: Piece; x: number; y: number; over: Slot | null };
/** The hero's pictures: the worn skin and headwear's poses. */
export type HeroPics = { front: HTMLImageElement; walk: HTMLImageElement; walk2: HTMLImageElement; shoot: HTMLImageElement; hurt: HTMLImageElement; cheer: HTMLImageElement; down: HTMLImageElement };

const figureOf = (tier: Tier, cast: number, face: number, step: number, swing: number, hit: number) => ({
  look: castLook(cast),
  kind: TIER_KIND[tier],
  final: tier === 4,
  bossId: tier === 4 ? FINAL_ID[cast - 1] : castLook(cast),
  face,
  step,
  swing,
  hit,
  r: TIER_STATS[tier].r,
});

function ring(ctx: CanvasRenderingContext2D, r: number, colour: string) {
  ctx.fillStyle = `${colour}55`;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.7, r * 1.15, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
/** Pips for the step (gold for the bosses), and the number of the world its cast comes from. */
function marks(ctx: CanvasRenderingContext2D, x: number, y: number, p: { tier: number; cast: number }) {
  const n = p.tier + 1;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = p.tier >= 3 ? '#fcd34d' : '#e2e8f0';
    ctx.beginPath();
    ctx.arc(x + (i - (n - 1) / 2) * 6, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(8,12,28,0.85)';
  ctx.beginPath();
  ctx.arc(x + CELL * 0.36, y - CELL * 0.62, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fcd34d';
  ctx.font = '700 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(p.cast), x + CELL * 0.36, y - CELL * 0.62 + 0.5);
}

function drawHero(ctx: CanvasRenderingContext2D, pics: HeroPics, x: number, y: number, pose: HTMLImageElement, face: number, alpha: number, hit: boolean) {
  const img = pose.complete && pose.naturalWidth ? pose : pics.front;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fcd34d';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 14, 17, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (img.complete && img.naturalWidth) {
    const h = 64;
    const w = (h * img.naturalWidth) / img.naturalHeight;
    if (face < 0) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, 16 - h, w, h);
    if (hit) { ctx.globalAlpha = alpha * 0.45; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(img, -w / 2, 16 - h, w, h); }
  } else {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -6, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawBoard(ctx: CanvasRenderingContext2D, b: BoardGame, lay: BoardLayout, now: number, drag: BoardDrag | null, retro: boolean, dpr: number, pics: HeroPics) {
  ctx.setTransform(dpr * lay.s, 0, 0, dpr * lay.s, dpr * lay.ox, dpr * lay.oy);
  // The world's floor under the board.
  const floor = boardFloor(b.world);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, BOARD_W, BOARD_H, 10);
  ctx.clip();
  if (!retro && floor.complete && floor.naturalWidth) {
    const k = Math.max(BOARD_W / (floor.naturalWidth * 0.8), BOARD_H / (floor.naturalHeight * 0.8));
    const w = floor.naturalWidth * k, h = floor.naturalHeight * k;
    ctx.drawImage(floor, (BOARD_W - w) / 2, (BOARD_H - h) / 2, w, h);
  } else {
    ctx.fillStyle = '#141b2e';
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);
  }
  ctx.fillStyle = 'rgba(10,6,24,0.18)';
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for (let c = 1; c < COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, BOARD_H); ctx.stroke(); }
  for (let r = 1; r < ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(BOARD_W, r * CELL); ctx.stroke(); }
  // Where the hero comes in.
  const glow = ctx.createLinearGradient(0, 0, 0, CELL * 1.2);
  glow.addColorStop(0, 'rgba(252,211,77,0.28)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, BOARD_W, CELL * 1.2);
  ctx.restore();
  ctx.strokeStyle = 'rgba(148,163,184,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(0, 0, BOARD_W, BOARD_H, 10);
  ctx.stroke();
  // Where the dragged unit would go: green to move, gold to merge.
  if (drag?.over) {
    const target = pieceAt(b, drag.over);
    const merge = target && canMerge(drag.piece, target);
    const c = cellCentre(drag.over);
    ctx.fillStyle = merge ? 'rgba(252,211,77,0.42)' : 'rgba(74,222,128,0.26)';
    ctx.fillRect(c.x - CELL / 2 + 2, c.y - CELL / 2 + 2, CELL - 4, CELL - 4);
  }
  if (b.phase === 'prep' || !b.fighters.length) {
    // The coming hero, faint, above the board, with its health this round.
    const h = heroFor(b.world, b.round);
    drawHero(ctx, pics, BOARD_W / 2, -TOP / 2 + 6, pics.front, 1, 0.55 + Math.sin(now * 3) * 0.1, false);
    ctx.fillStyle = 'rgba(252,211,77,0.9)';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`♥ ${h.maxHp}`, BOARD_W / 2 + 22, -TOP / 2 + 2);
    const pieces = [...b.army].sort((p, q) => p.slot.r - q.slot.r);
    for (const p of pieces) {
      if (drag?.piece === p) continue;
      const c = cellCentre(p.slot);
      ctx.save();
      ctx.translate(c.x, c.y);
      ring(ctx, TIER_STATS[p.tier].r, '#f87171');
      ctx.scale(FIG, FIG);
      drawBoardFigure(ctx, figureOf(p.tier, p.cast, 1, 0, 0, 0), now, retro);
      ctx.restore();
      marks(ctx, c.x, c.y + CELL * 0.42, p);
    }
  } else {
    const live = b.fighters.filter((f) => !f.dead).sort((p, q) => p.y - q.y);
    for (const f of live) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ring(ctx, f.r, '#f87171');
      ctx.scale(FIG, FIG);
      drawBoardFigure(ctx, figureOf(f.tier, f.cast, f.face, f.step, f.swing, f.hit), now, retro);
      ctx.restore();
      const w = Math.max(22, f.r * 2);
      const y = f.y - f.r * FIG * (f.tier >= 3 ? 3.2 : 2.3);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(f.x - w / 2, y, w, 4);
      ctx.fillStyle = '#f87171';
      ctx.fillRect(f.x - w / 2, y, (w * Math.max(0, f.hp)) / f.maxHp, 4);
    }
    const h = b.hero;
    if (h) {
      const walking = Math.floor(h.step) % 2 ? pics.walk2 : pics.walk;
      const pose = h.dead ? pics.down : b.phase !== 'fight' ? pics.cheer : h.hit > 0 ? pics.hurt : h.shoot > 0 ? pics.shoot : walking;
      // The sword's sweep round it.
      if (h.slash > 0) {
        ctx.strokeStyle = `rgba(226,232,240,${h.slash / 0.3})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(h.x, h.y, 58, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawHero(ctx, pics, h.x, h.y, pose, h.face, 1, h.hit > 0);
      // Its health over the board.
      const w = BOARD_W - 40;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(20, -TOP + 14, w, 7);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(20, -TOP + 14, (w * Math.max(0, h.hp)) / h.maxHp, 7);
    }
    for (const s of b.shots) {
      if (s.mine) {
        ctx.fillStyle = s.ring ? '#e879f9' : '#fca5a5';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.ring ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // The hero's arrows.
        const a = Math.atan2(s.vy, s.vx);
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(s.x - Math.cos(a) * 12, s.y - Math.sin(a) * 12);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }
    }
  }
  if (drag) {
    const x = (drag.x - lay.ox) / lay.s;
    const y = (drag.y - lay.oy) / lay.s;
    ctx.save();
    ctx.translate(x, y - 10);
    ctx.scale(FIG * 1.12, FIG * 1.12);
    drawBoardFigure(ctx, figureOf(drag.piece.tier, drag.piece.cast, 1, 0, 0, 0), now, retro);
    ctx.restore();
  }
}
