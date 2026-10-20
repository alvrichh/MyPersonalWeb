import { BOARD_H, BOARD_W, CELL, COLS, FINAL_ID, HOME_ROW, ROUNDS, ROWS, TIER_KIND, TIER_STATS, canMerge, castLook, cellCentre, pieceAt, waveSpots, type BoardGame, type Piece, type Slot, type Tier } from './board';
import { boardFloor, boardFx, drawBoardFigure } from './draw';

/* Drawing the board mode on the game's canvas: the world's floor under a grid, your bugs on the lower half and the
   round's enemy on the upper (faint while you prepare), each with its cast's own pictures, and the two commanders
   in the corners outside the board: your hero, from the worn skin's poses, on Customise's portal at the lower
   right, and the world's final boss on a red halo at the upper left, with the fireball one throws at the other
   when a fight ends. */

/** The units are drawn bigger than their hit circles, so they fill their cells. */
const FIG = 1.4;
/** Room above and below the board for the commanders. */
const TOP = 64;
const BOT = 64;
/** How long the fireball flies, and how long its blast lasts, in seconds (main.ts waits for both). */
export const FIREBALL = { fly: 0.75, blast: 0.45 };

export type BoardLayout = { s: number; ox: number; oy: number };

/** Fits the board (and the strip above it) into the area between the top bar and the shop. */
export function layoutBoard(w: number, top: number, bottom: number): BoardLayout {
  const room = Math.max(120, bottom - top);
  const s = Math.min((w - 16) / BOARD_W, room / (BOARD_H + TOP + BOT));
  return { s, ox: (w - BOARD_W * s) / 2, oy: top + TOP * s + (room - (BOARD_H + TOP + BOT) * s) / 2 };
}

/** The cell under a point on the screen, or null off the board. */
export function slotAt(lay: BoardLayout, px: number, py: number): Slot | null {
  const x = (px - lay.ox) / lay.s;
  const y = (py - lay.oy) / lay.s;
  if (x < 0 || x >= BOARD_W || y < 0 || y >= BOARD_H) return null;
  return { c: Math.floor(x / CELL), r: Math.floor(y / CELL) };
}

export type BoardDrag = { piece: Piece; x: number; y: number; over: Slot | null };
/** Your commander's pictures: the worn skin and headwear's poses, and the portal it stands on. */
export type HeroPics = { front: HTMLImageElement; shoot: HTMLImageElement; hurt: HTMLImageElement; cheer: HTMLImageElement; down: HTMLImageElement; pad: HTMLImageElement };

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

const ok = (img: HTMLImageElement) => img.complete && img.naturalWidth > 0;
/** Where each commander stands (its feet), outside the board's corners. */
const MINE = { x: BOARD_W - 40, y: BOARD_H + BOT - 14 };
const RIVAL = { x: 40, y: -12 };

function drawHero(ctx: CanvasRenderingContext2D, pics: HeroPics, pose: HTMLImageElement, now: number, hit: number) {
  const { x, y } = MINE;
  // Customise's portal under its feet, its ring's middle at 74.6% of the picture's height.
  if (ok(pics.pad)) {
    const w = 92;
    const h = (w * pics.pad.naturalHeight) / pics.pad.naturalWidth;
    ctx.drawImage(pics.pad, x - w / 2, y - h * 0.746, w, h);
  } else {
    ctx.fillStyle = 'rgba(56,189,248,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y, 30, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const img = ok(pose) ? pose : pics.front;
  if (!ok(img)) return;
  const h = 62;
  const w = (h * img.naturalWidth) / img.naturalHeight;
  ctx.save();
  ctx.translate(x, y + Math.sin(now * 2.2) * 0.8);
  ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h, w, h);
  if (hit > 0) { ctx.globalAlpha = hit; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(img, -w / 2, -h, w, h); }
  ctx.restore();
}

function drawRival(ctx: CanvasRenderingContext2D, world: number, now: number, hit: number, gone: number) {
  const { x, y } = RIVAL;
  // A red halo on the floor and its light rising.
  ctx.save();
  ctx.translate(x, y);
  const rise = ctx.createLinearGradient(0, 0, 0, -60);
  rise.addColorStop(0, 'rgba(248,113,113,0.35)');
  rise.addColorStop(1, 'rgba(248,113,113,0)');
  ctx.fillStyle = rise;
  ctx.fillRect(-26, -60, 52, 60);
  const pulse = 0.75 + Math.sin(now * 3) * 0.15;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 14;
  ctx.strokeStyle = `rgba(248,113,113,${pulse})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(127,29,29,0.45)';
  ctx.fill();
  ctx.globalAlpha = 1 - gone;
  ctx.translate(0, 2 + gone * 8);
  ctx.scale(0.95, 0.95);
  drawBoardFigure(ctx, figureOf(4, world, 1, now * 1.5, 0, hit), now, false);
  ctx.restore();
}

function lifeBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, p: number, colour: string, label: string, right: boolean) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x, y, w, 7);
  ctx.fillStyle = colour;
  const f = w * Math.max(0, Math.min(1, p));
  ctx.fillRect(right ? x + w - f : x, y, f, 7);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, 7);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = right ? 'right' : 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, right ? x + w : x, y - 2);
}

/** The rival's health: one for each round still to win. */
const rivalHp = (b: BoardGame) => ROUNDS - b.round + (b.phase !== 'prep' && b.phase !== 'fight' && b.last?.result === 'win' ? 0 : 1);

export type BoardNames = { mine: string; rival: string };

export function drawBoard(ctx: CanvasRenderingContext2D, b: BoardGame, lay: BoardLayout, now: number, drag: BoardDrag | null, retro: boolean, dpr: number, pics: HeroPics, names: BoardNames, ended: number | null) {
  ctx.setTransform(dpr * lay.s, 0, 0, dpr * lay.s, dpr * lay.ox, dpr * lay.oy);
  // The world's floor under the board.
  const floor = boardFloor(b.world);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, BOARD_W, BOARD_H, 10);
  ctx.clip();
  if (!retro && ok(floor)) {
    const k = Math.max(BOARD_W / (floor.naturalWidth * 0.8), BOARD_H / (floor.naturalHeight * 0.8));
    const w = floor.naturalWidth * k, h = floor.naturalHeight * k;
    ctx.drawImage(floor, (BOARD_W - w) / 2, (BOARD_H - h) / 2, w, h);
  } else {
    ctx.fillStyle = '#141b2e';
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);
  }
  // The enemy's half a little darker and redder, yours a little bluer.
  ctx.fillStyle = 'rgba(40,6,16,0.28)';
  ctx.fillRect(0, 0, BOARD_W, HOME_ROW * CELL);
  ctx.fillStyle = 'rgba(6,14,40,0.18)';
  ctx.fillRect(0, HOME_ROW * CELL, BOARD_W, BOARD_H - HOME_ROW * CELL);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for (let c = 1; c < COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, BOARD_H); ctx.stroke(); }
  for (let r = 1; r < ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(BOARD_W, r * CELL); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(252,211,77,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, HOME_ROW * CELL);
  ctx.lineTo(BOARD_W, HOME_ROW * CELL);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  ctx.strokeStyle = 'rgba(148,163,184,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(0, 0, BOARD_W, BOARD_H, 10);
  ctx.stroke();

  // The fireball at the end of a fight: yours at the rival after a win, the rival's at you otherwise.
  const won = b.last?.result === 'win';
  const fly = ended === null ? -1 : ended / FIREBALL.fly;
  const struck = ended === null ? 0 : Math.max(0, 1 - Math.abs(ended - FIREBALL.fly) / FIREBALL.blast);
  const done = ended !== null && ended > FIREBALL.fly;
  const rivalGone = b.phase === 'won' && done ? Math.min(1, (ended! - FIREBALL.fly) / 0.6) : 0;
  drawRival(ctx, b.world, now, won ? struck : 0, rivalGone);
  lifeBar(ctx, RIVAL.x + 40, -TOP + 22, 150, (rivalHp(b) + (won && ended !== null && !done ? 1 : 0)) / ROUNDS, '#ef4444', names.rival, false);
  const pose = b.phase === 'over' && done ? pics.down : ended !== null && won && !done ? pics.shoot : b.phase === 'won' && done ? pics.cheer : !won && struck > 0 ? pics.hurt : pics.front;
  drawHero(ctx, pics, pose, now, won ? 0 : struck * 0.6);
  lifeBar(ctx, MINE.x - 40 - 150, BOARD_H + BOT - 18, 150, b.lives / 10, '#4ade80', `${names.mine} · ❤ ${b.lives}`, true);

  // Where the dragged unit would go: green to move, gold to merge.
  if (drag?.over) {
    const target = pieceAt(b, drag.over);
    const merge = target && canMerge(drag.piece, target);
    const c = cellCentre(drag.over);
    ctx.fillStyle = drag.over.r < HOME_ROW ? 'rgba(248,113,113,0.2)' : merge ? 'rgba(252,211,77,0.42)' : 'rgba(74,222,128,0.26)';
    ctx.fillRect(c.x - CELL / 2 + 2, c.y - CELL / 2 + 2, CELL - 4, CELL - 4);
  }
  if (b.phase === 'prep' || !b.fighters.length) {
    // The coming wave, faint, on its half.
    for (const w of waveSpots(b).sort((p, q) => p.y - q.y)) {
      ctx.save();
      ctx.translate(w.x, w.y);
      ctx.globalAlpha = 0.5 + Math.sin(now * 2.5) * 0.08;
      ring(ctx, TIER_STATS[w.tier].r, '#f87171');
      ctx.scale(FIG, FIG);
      drawBoardFigure(ctx, figureOf(w.tier, b.world, -1, 0, 0, 0), now, retro);
      ctx.restore();
    }
    const pieces = [...b.army].sort((p, q) => p.slot.r - q.slot.r);
    for (const p of pieces) {
      if (drag?.piece === p) continue;
      const c = cellCentre(p.slot);
      ctx.save();
      ctx.translate(c.x, c.y);
      ring(ctx, TIER_STATS[p.tier].r, '#38bdf8');
      ctx.scale(FIG, FIG);
      drawBoardFigure(ctx, figureOf(p.tier, p.cast, 1, 0, 0, 0), now, retro);
      ctx.restore();
      marks(ctx, c.x, c.y + CELL * 0.42, p);
    }
  } else {
    const live = b.fighters.filter((f) => !f.dead).sort((p, q) => p.y - q.y);
    for (const f of live) {
      const colour = f.side === 0 ? '#38bdf8' : '#f87171';
      ctx.save();
      ctx.translate(f.x, f.y);
      ring(ctx, f.r, colour);
      ctx.scale(FIG, FIG);
      drawBoardFigure(ctx, figureOf(f.tier, f.cast, f.face, f.step, f.swing, f.hit), now, retro);
      ctx.restore();
      const w = Math.max(22, f.r * 2);
      const y = f.y - f.r * FIG * (f.tier >= 3 ? 3.2 : 2.3);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(f.x - w / 2, y, w, 4);
      ctx.fillStyle = f.side === 0 ? '#4ade80' : '#f87171';
      ctx.fillRect(f.x - w / 2, y, (w * Math.max(0, f.hp)) / f.maxHp, 4);
    }
    for (const s of b.shots) {
      ctx.fillStyle = s.ring ? '#e879f9' : s.side === 0 ? '#7dd3fc' : '#fca5a5';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.ring ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  if (ended !== null && fly < 1) {
    const from = won ? { x: MINE.x - 12, y: MINE.y - 36 } : { x: RIVAL.x + 10, y: RIVAL.y - 20 };
    const to = won ? { x: RIVAL.x, y: RIVAL.y - 22 } : { x: MINE.x, y: MINE.y - 30 };
    const k = Math.max(0, fly);
    const x = from.x + (to.x - from.x) * k;
    const y = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * 60;
    const dx = to.x - from.x, dy = to.y - from.y - Math.cos(k * Math.PI) * 60 * Math.PI;
    const ball = boardFx('fireball');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(dy, dx));
    if (!retro && ok(ball)) {
      const w = 58;
      ctx.drawImage(ball, -w * 0.75, -w * 0.3, w, w * (ball.naturalHeight / ball.naturalWidth));
    } else {
      ctx.fillStyle = '#fb923c';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  if (ended !== null && ended > FIREBALL.fly && ended < FIREBALL.fly + FIREBALL.blast) {
    const at = won ? { x: RIVAL.x, y: RIVAL.y - 22 } : { x: MINE.x, y: MINE.y - 30 };
    const k = (ended - FIREBALL.fly) / FIREBALL.blast;
    const boom = boardFx('boom-big');
    ctx.save();
    ctx.globalAlpha = 1 - k;
    if (!retro && ok(boom)) {
      const w = 70 + k * 40;
      ctx.drawImage(boom, at.x - w / 2, at.y - w / 2, w, w * (boom.naturalHeight / boom.naturalWidth));
    } else {
      ctx.fillStyle = '#fdba74';
      ctx.beginPath();
      ctx.arc(at.x, at.y, 20 + k * 30, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
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
