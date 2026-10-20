import { BENCH, BENCH_Y, BOARD_H, BOARD_W, CELL, COLS, HOME_ROW, ROWS, TIER_KIND, TIER_STATS, homeCell, pieceAt, waveSpots, type BoardGame, type Piece, type Slot, type Tier } from './board';
import { boardFloor, drawBoardFigure } from './draw';
import { WORLDS } from './world';

/* Drawing the board mode on the game's canvas: the world's floor under a grid, your half lit, the bench under it,
   the units with the cast's own pictures and, while you prepare, the enemy faintly on their half. */

/** The units are drawn bigger than their hit circles, so they fill their cells. */
const FIG = 1.4;

export type BoardLayout = { s: number; ox: number; oy: number };
/** The whole picture: the board and the bench under it. */
const TOTAL_H = BENCH_Y + CELL;

/** Fits the board and bench into the area between the top bar and the shop. */
export function layoutBoard(w: number, top: number, bottom: number): BoardLayout {
  const room = Math.max(120, bottom - top);
  const s = Math.min((w - 16) / BOARD_W, room / TOTAL_H);
  return { s, ox: (w - BOARD_W * s) / 2, oy: top + (room - TOTAL_H * s) / 2 };
}

/** The slot under a point on the screen (any cell of the board, or a bench slot), or null. */
export function slotAt(lay: BoardLayout, px: number, py: number): Slot | null {
  const x = (px - lay.ox) / lay.s;
  const y = (py - lay.oy) / lay.s;
  if (x < 0 || x >= BOARD_W) return null;
  if (y >= 0 && y < BOARD_H) return { where: 'board', c: Math.floor(x / CELL), r: Math.floor(y / CELL) };
  if (y >= BENCH_Y && y < BENCH_Y + CELL) {
    const i = Math.floor(x / (BOARD_W / BENCH));
    return i >= 0 && i < BENCH ? { where: 'bench', i } : null;
  }
  return null;
}

export const slotCentre = (s: Slot) =>
  s.where === 'bench' ? { x: (s.i + 0.5) * (BOARD_W / BENCH), y: BENCH_Y + CELL / 2 } : { x: (s.c + 0.5) * CELL, y: (s.r + 0.5) * CELL };

export type BoardDrag = { piece: Piece; x: number; y: number; over: Slot | null };

const figureOf = (b: BoardGame, tier: Tier, face: number, step: number, swing: number, hit: number) => ({
  look: b.look,
  kind: TIER_KIND[tier],
  final: tier === 4,
  bossId: tier === 4 ? FINAL_ID[b.world - 1] : b.look,
  face,
  step,
  swing,
  hit,
  r: TIER_STATS[tier].r,
});
const FINAL_ID = ['kernel', 'archdemon', 'drakkar', 'medusa', 'queen', 'zeus', 'mech', 'wraith', 'chimera'];

function teamRing(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, mine: boolean) {
  ctx.fillStyle = mine ? 'rgba(56,189,248,0.32)' : 'rgba(248,113,113,0.32)';
  ctx.strokeStyle = mine ? 'rgba(125,211,252,0.9)' : 'rgba(252,165,165,0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.7, r * 1.15, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function tierPips(ctx: CanvasRenderingContext2D, x: number, y: number, tier: number) {
  const n = tier + 1;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = tier >= 3 ? '#fcd34d' : '#e2e8f0';
    ctx.beginPath();
    ctx.arc(x + (i - (n - 1) / 2) * 6, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawBoard(ctx: CanvasRenderingContext2D, b: BoardGame, lay: BoardLayout, now: number, drag: BoardDrag | null, retro: boolean, dpr: number) {
  ctx.setTransform(dpr * lay.s, 0, 0, dpr * lay.s, dpr * lay.ox, dpr * lay.oy);
  // The world's floor under the board, its middle shown.
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
  // The enemy's half a little darker, yours a little lit.
  ctx.fillStyle = 'rgba(10,6,24,0.35)';
  ctx.fillRect(0, 0, BOARD_W, HOME_ROW * CELL);
  ctx.fillStyle = 'rgba(56,189,248,0.06)';
  ctx.fillRect(0, HOME_ROW * CELL, BOARD_W, (ROWS - HOME_ROW) * CELL);
  // The grid.
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for (let c = 1; c < COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, BOARD_H); ctx.stroke(); }
  for (let r = 1; r < ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(BOARD_W, r * CELL); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(125,211,252,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, HOME_ROW * CELL); ctx.lineTo(BOARD_W, HOME_ROW * CELL); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(148,163,184,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(0, 0, BOARD_W, BOARD_H, 10);
  ctx.stroke();
  // The bench.
  const bw = BOARD_W / BENCH;
  for (let i = 0; i < BENCH; i++) {
    ctx.fillStyle = 'rgba(15,23,42,0.75)';
    ctx.strokeStyle = 'rgba(148,163,184,0.45)';
    ctx.beginPath();
    ctx.roundRect(i * bw + 3, BENCH_Y + 3, bw - 6, CELL - 6, 8);
    ctx.fill();
    ctx.stroke();
  }
  // Where the dragged unit would go: green to move, gold to merge, red where it cannot.
  if (drag?.over) {
    const target = pieceAt(b, drag.over);
    const ok = homeCell(drag.over);
    const merge = ok && target && target !== drag.piece && target.tier === drag.piece.tier && target.tier < 4;
    const c = slotCentre(drag.over);
    const w = drag.over.where === 'bench' ? bw : CELL;
    ctx.fillStyle = !ok ? 'rgba(248,113,113,0.28)' : merge ? 'rgba(252,211,77,0.4)' : 'rgba(74,222,128,0.28)';
    ctx.fillRect(c.x - w / 2 + 2, c.y - CELL / 2 + 2, w - 4, CELL - 4);
  }
  const tint = WORLDS[b.world - 1].tint;
  if (b.phase === 'prep' || b.phase === 'result' && !b.fighters.length) {
    // The coming enemy, faint.
    ctx.globalAlpha = 0.45;
    for (const w of waveSpots(b)) {
      ctx.save();
      ctx.translate(w.x, w.y);
      teamRing(ctx, 0, 0, TIER_STATS[w.tier].r, false);
      ctx.scale(FIG, FIG);
      drawBoardFigure(ctx, figureOf(b, w.tier, -1, 0, 0, 0), now, retro);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // Your units on the board (the one being dragged follows the finger).
    const pieces = b.army.filter((p) => p.slot.where === 'board').sort((p, q) => slotCentre(p.slot).y - slotCentre(q.slot).y);
    for (const p of pieces) {
      if (drag?.piece === p) continue;
      const c = slotCentre(p.slot);
      ctx.save();
      ctx.translate(c.x, c.y);
      teamRing(ctx, 0, 0, TIER_STATS[p.tier].r, true);
      ctx.scale(FIG, FIG);
      drawBoardFigure(ctx, figureOf(b, p.tier, 1, 0, 0, 0), now, retro);
      ctx.restore();
      tierPips(ctx, c.x, c.y + CELL * 0.42, p.tier);
    }
  } else {
    // The fight.
    const live = [...b.fighters].filter((f) => !f.dead).sort((p, q) => p.y - q.y);
    for (const f of live) {
      ctx.save();
      ctx.translate(f.x, f.y);
      teamRing(ctx, 0, 0, f.r, f.side === 0);
      ctx.scale(FIG, FIG);
      drawBoardFigure(ctx, figureOf(b, f.tier, f.face, f.step, f.swing, f.hit), now, retro);
      ctx.restore();
      // Health.
      const w = Math.max(22, f.r * 2);
      const y = f.y - f.r * FIG * (f.tier >= 3 ? 3.2 : 2.3);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(f.x - w / 2, y, w, 4);
      ctx.fillStyle = f.side === 0 ? '#4ade80' : '#f87171';
      ctx.fillRect(f.x - w / 2, y, (w * Math.max(0, f.hp)) / f.maxHp, 4);
    }
    for (const s of b.shots) {
      ctx.fillStyle = s.ring ? '#e879f9' : s.side === 0 ? '#7dd3fc' : tint;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.ring ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  // The bench, in the fight too.
  for (const p of b.army) {
    if (p.slot.where !== 'bench' || drag?.piece === p) continue;
    const c = slotCentre(p.slot);
    ctx.save();
    ctx.translate(c.x, c.y - 4);
    ctx.scale(FIG * 0.85, FIG * 0.85);
    drawBoardFigure(ctx, figureOf(b, p.tier, 1, 0, 0, 0), now, retro);
    ctx.restore();
    tierPips(ctx, c.x, c.y + CELL * 0.4, p.tier);
  }
  if (drag) {
    const x = (drag.x - lay.ox) / lay.s;
    const y = (drag.y - lay.oy) / lay.s;
    ctx.save();
    ctx.translate(x, y - 10);
    ctx.scale(FIG * 1.12, FIG * 1.12);
    drawBoardFigure(ctx, figureOf(b, drag.piece.tier, 1, 0, 0, 0), now, retro);
    ctx.restore();
  }
}
