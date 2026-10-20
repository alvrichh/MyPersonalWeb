import { BOARD_H, BOARD_W, CELL, COLS, FINAL_ID, HOME_ROW, ROUNDS, STRIKE, homeCell, ROWS, TIER_KIND, TIER_STATS, canMerge, castLook, cellCentre, pieceAt, waveSpots, type BoardGame, type Piece, type Slot, type Tier } from './board';
import { boardFx, drawBoardBackdrop, drawBoardFigure } from './draw';

/* Drawing the board mode on the game's canvas: the world's floor under a grid, your bugs on the lower half and the
   round's enemy on the upper (faint while you prepare), each with its cast's own pictures, and the two commanders
   in the board's own corner cells (left free for them): your hero, from the worn skin's poses, on Customise's
   portal at the lower right, and the the rival, your own hero with its colours inverted, on the same portal turned red at the upper left, their names and health
   in thin strips above and below the board, with the fireball one throws at the other
   when a fight ends. */

/** The units are drawn bigger than their hit circles, so they fill their cells. */
const FIG = 1.4;
/** Room above the board for the rival's hearts (yours float over your hero, inside the board). */
const TOP = 16;
const BOT = 4;
/** The size of the heart over each commander. */
const HEARTS = { size: 11 };
/** How long the fireball flies, and how long its blast lasts, in seconds (main.ts waits for both). */
export const FIREBALL = { fly: 0.75, blast: 0.45 };

export type BoardLayout = { s: number; ox: number; oy: number };

/** Fits the board (and the strip above it) into the area between the top bar and the shop. */
export function layoutBoard(w: number, top: number, bottom: number): BoardLayout {
  const room = Math.max(120, bottom - top);
  const s = Math.min((w - 8) / BOARD_W, room / (BOARD_H + TOP + BOT));
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
export type HeroPics = { front: HTMLImageElement; shoot: HTMLImageElement; hurt: HTMLImageElement; cheer: HTMLImageElement; down: HTMLImageElement; pad: HTMLImageElement; padRed: HTMLImageElement };

/** How big each step is drawn (the radius the sprites are sized by): in the game's own order, bug, ticket, legacy,
    room-6 boss, final boss, each bigger than the one before, a little under the game's sizes (12, 14, 20, 40, 52)
    for the bosses so they fit the board. The fight's own hit circles stay `TIER_STATS`. */
export const DRAW_R = [12, 14, 17, 21, 24, 26, 28];
/** A final boss's next phases on the board: the Drakkar's is Valdur out of the wreck; the others, their own phase's
    sheet (`medusa2`, `chimera2`, `chimera3`, chosen by `drawEnemySprite` from the phase). */
const phaseOf = (tier: Tier) => Math.max(1, tier - 3);
const bossOf = (tier: Tier, cast: number) => (tier < 4 ? castLook(cast) : FINAL_ID[cast - 1] === 'drakkar' && tier > 4 ? 'valdur' : FINAL_ID[cast - 1]);
const figureOf = (tier: Tier, cast: number, face: number, step: number, swing: number, hit: number) => ({
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

/* A merge: a puff of smoke on the cell (the steam fusion's cloud, `fx/steam-cloud`) and the new unit popping up
   bigger and settling. */
const PUFF = 0.65;
const POP = 0.4;
let puffs: { x: number; y: number; at: number }[] = [];
let popped: { id: number; at: number } | null = null;
export function boardMerged(slot: Slot, id: number, now: number) {
  const c = cellCentre(slot);
  puffs.push({ x: c.x, y: c.y, at: now });
  popped = { id, at: now };
}
function drawPuffs(ctx: CanvasRenderingContext2D, now: number, retro: boolean) {
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
        ctx.drawImage(img, p.x + Math.cos(a) * k * 16 - w / 2, p.y - 6 + Math.sin(a) * k * 10 - h / 2, w, h);
      }
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14 + k * 22, 0, Math.PI * 2);
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

/* The enemy's units are the same pictures as yours, so they are drawn with a red outline round them, the owner's
   pick, to tell the two armies apart at a glance in the fight. The outlined picture is worked out once per sprite
   picture and kept (`outlined` in `draw.ts`); it was built on two scratch canvases for every unit every frame. */
const OUTLINE = { colour: '#ef4444' };
function drawEnemyFigure(ctx: CanvasRenderingContext2D, fig: ReturnType<typeof figureOf>, now: number, retro: boolean) {
  ctx.scale(FIG, FIG);
  drawBoardFigure(ctx, fig, now, retro, OUTLINE.colour);
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
/** Pips for the step (gold for the bosses), and the number of the world its cast comes from. */
/** Tactics: a ★2 unit wears a silver outline and a ★3 one a gold one, each star 12% bigger; its ring under its
    feet takes its rarity's colour (common grey, rare blue, epic purple, legendary orange, mythic red). */
export const STAR_BORDER = ['', '#e2e8f0', '#fbbf24'];
const STAR_GROW = 0.12;
export const RARITY_COLOUR = ['#94a3b8', '#38bdf8', '#c084fc', '#fb923c', '#f87171'];
const starScale = (star: number | undefined) => 1 + STAR_GROW * ((star ?? 1) - 1);

function marks(ctx: CanvasRenderingContext2D, x: number, y: number, p: { tier: number; cast: number; star?: number }, tactics: boolean) {
  if (tactics) {
    // Its stars, gold.
    const n = p.star ?? 1;
    ctx.fillStyle = '#fcd34d';
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★'.repeat(n), x, y);
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
  ctx.fillStyle = '#fcd34d';
  ctx.font = '700 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(p.cast), x + CELL * 0.36, y - CELL * 0.62 + 0.5);
}

const ok = (img: HTMLImageElement) => img.complete && img.naturalWidth > 0;
/** Where each commander stands (its feet), in the board's corner cells. */
const MINE = { x: BOARD_W - CELL / 2 - 6, y: BOARD_H - 12 };
const RIVAL = { x: CELL / 2 + 4, y: CELL - 12 };

function drawHero(ctx: CanvasRenderingContext2D, pics: HeroPics, pose: HTMLImageElement, now: number, hit: number) {
  const { x, y } = MINE;
  // Customise's portal under its feet, its ring's middle at 74.6% of the picture's height.
  if (ok(pics.pad)) {
    const w = 70;
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
  const h = 58;
  const w = (h * img.naturalWidth) / img.naturalHeight;
  ctx.save();
  ctx.translate(x, y + Math.sin(now * 2.2) * 0.8);
  ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h, w, h);
  if (hit > 0) { ctx.globalAlpha = hit; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(img, -w / 2, -h, w, h); }
  ctx.restore();
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

function drawRival(ctx: CanvasRenderingContext2D, pics: HeroPics, pose: HTMLImageElement, now: number, hit: number, gone: number) {
  const { x, y } = RIVAL;
  ctx.save();
  ctx.translate(x, y);
  // Customise's portal turned red under its feet (its ring's middle at 74.6% of the picture's height).
  const pad = pics.padRed;
  if (ok(pad)) {
    const w = 70;
    const h = (w * pad.naturalHeight) / pad.naturalWidth;
    ctx.drawImage(pad, -w / 2, -h * 0.746, w, h);
  } else {
    ctx.strokeStyle = 'rgba(248,113,113,0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Your own hero, its colours inverted, facing the board; it sinks and fades once beaten.
  const img = ok(pose) ? pose : pics.front;
  if (ok(img)) {
    const h = 58;
    const w = (h * img.naturalWidth) / img.naturalHeight;
    const pic = negative(img);
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

/** The rival's health: one for each round still to win. */
const rivalHp = (b: BoardGame) => ROUNDS - b.round + (b.phase !== 'prep' && b.phase !== 'fight' && b.last?.result === 'win' ? 0 : 1);

export function drawBoard(ctx: CanvasRenderingContext2D, b: BoardGame, lay: BoardLayout, now: number, drag: BoardDrag | null, retro: boolean, dpr: number, pics: HeroPics, ended: number | null, floor: { top: number; bottom: number }) {
  const tactics = b.variant === 'tactics';
  // The world's whole arena floor, walls and corners, as in a sprint, from under the top bar to over the buttons;
  // the board is only its grid.
  drawBoardBackdrop(ctx, b.world, ctx.canvas.width / dpr, floor.top, floor.bottom, dpr, retro);
  ctx.setTransform(dpr * lay.s, 0, 0, dpr * lay.s, dpr * lay.ox, dpr * lay.oy);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, BOARD_W, BOARD_H, 10);
  ctx.clip();
  // The enemy's half a little darker and redder, yours a little bluer.
  ctx.fillStyle = 'rgba(40,6,16,0.22)';
  ctx.fillRect(0, 0, BOARD_W, HOME_ROW * CELL);
  ctx.fillStyle = 'rgba(6,14,40,0.12)';
  ctx.fillRect(0, HOME_ROW * CELL, BOARD_W, BOARD_H - HOME_ROW * CELL);
  // The grid and the line between the halves are only there to lay the units out: once the fight starts they go.
  if (b.phase === 'prep') {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, BOARD_H); ctx.stroke(); }
    for (let r = 1; r < ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(BOARD_W, r * CELL); ctx.stroke(); }
    ctx.strokeRect(0.5, 0.5, BOARD_W - 1, BOARD_H - 1);
    ctx.strokeStyle = 'rgba(252,211,77,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, HOME_ROW * CELL);
    ctx.lineTo(BOARD_W, HOME_ROW * CELL);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  // The fireball at the end of a fight: yours at the rival after a win, the rival's at you otherwise.
  const won = b.last?.result === 'win';
  const fly = ended === null ? -1 : ended / FIREBALL.fly;
  const struck = ended === null ? 0 : Math.max(0, 1 - Math.abs(ended - FIREBALL.fly) / FIREBALL.blast);
  const done = ended !== null && ended > FIREBALL.fly;
  const rivalGone = b.phase === 'won' && done ? Math.min(1, (ended! - FIREBALL.fly) / 0.6) : 0;
  // The rival's pose, from your hero's: aiming while it throws at you, hurt when struck, cheering once you are out.
  const rivalPose = b.phase === 'over' && done ? pics.cheer : ended !== null && !won && !done ? pics.shoot : won && struck > 0 ? pics.hurt : pics.front;
  drawRival(ctx, pics, rivalPose, now, won ? struck : 0, rivalGone);
  const pose = b.phase === 'over' && done ? pics.down : ended !== null && won && !done ? pics.shoot : b.phase === 'won' && done ? pics.cheer : !won && struck > 0 ? pics.hurt : pics.front;
  drawHero(ctx, pics, pose, now, won ? 0 : struck * 0.6);

  // Where the dragged unit would go: green to move, gold to merge.
  if (drag?.over) {
    const target = pieceAt(b, drag.over);
    const merge = target && canMerge(drag.piece, target, b.variant);
    const c = cellCentre(drag.over);
    ctx.fillStyle = !homeCell(drag.over) ? 'rgba(248,113,113,0.2)' : merge ? 'rgba(252,211,77,0.42)' : 'rgba(74,222,128,0.26)';
    ctx.fillRect(c.x - CELL / 2 + 2, c.y - CELL / 2 + 2, CELL - 4, CELL - 4);
  }
  if (b.phase === 'prep' || !b.fighters.length) {
    // The coming wave, faint, on its half.
    for (const w of waveSpots(b).sort((p, q) => p.y - q.y)) {
      ctx.save();
      ctx.translate(w.x, w.y);
      ctx.globalAlpha = 0.5 + Math.sin(now * 2.5) * 0.08;
      ring(ctx, TIER_STATS[w.tier].r, '#f87171');
      drawEnemyFigure(ctx, figureOf(w.tier, b.world, -1, 0, 0, 0), now, retro);
      ctx.restore();
    }
    const pieces = [...b.army].sort((p, q) => p.slot.r - q.slot.r);
    for (const p of pieces) {
      if (drag?.piece === p) continue;
      const c = cellCentre(p.slot);
      ctx.save();
      ctx.translate(c.x, c.y);
      ring(ctx, TIER_STATS[p.tier].r, tactics ? RARITY_COLOUR[p.tier] : '#38bdf8');
      const pop = popScale(p.id, now) * starScale(p.star);
      ctx.scale(FIG * pop, FIG * pop);
      drawBoardFigure(ctx, figureOf(p.tier, p.cast, 1, 0, 0, 0), now, retro, STAR_BORDER[(p.star ?? 1) - 1] || null);
      ctx.restore();
      marks(ctx, c.x, c.y + CELL * 0.42, p, tactics);
    }
  } else {
    const live = b.fighters.filter((f) => !f.dead).sort((p, q) => p.y - q.y);
    for (const f of live) {
      const colour = f.side === 0 ? '#38bdf8' : '#f87171';
      ctx.save();
      ctx.translate(f.x, f.y);
      ring(ctx, f.r, tactics && f.side === 0 ? RARITY_COLOUR[f.tier] : colour);
      if (f.side === 1) drawEnemyFigure(ctx, figureOf(f.tier, f.cast, f.face, f.step, f.swing, f.hit), now, retro);
      else { const k = FIG * starScale(f.star); ctx.scale(k, k); drawBoardFigure(ctx, figureOf(f.tier, f.cast, f.face, f.step, f.swing, f.hit), now, retro, STAR_BORDER[f.star - 1] || null); }
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
  // The hearts last, over everything on the board: the rival's above it, yours over your hero's head. Until the
  // fireball strikes they still show the hearts the round has just cost; then those burst.
  const popAt = ended === null ? 1 : Math.max(0, Math.min(1, (ended - FIREBALL.fly) / FIREBALL.blast));
  const rivalPop = won && ended !== null ? 1 : 0;
  const minePop = !won && ended !== null ? b.last?.lost ?? 0 : 0;
  hearts(ctx, RIVAL.x + 50, -TOP / 2, rivalHp(b), rivalPop, done ? popAt : 0, retro);
  hearts(ctx, MINE.x, MINE.y - 72, b.lives, minePop, done ? popAt : 0, retro);
  // Your commander's fireball in the fight: from your hero onto the enemies' thickest knot, then its blast.
  if (b.strike) {
    const k = 1 - b.strike.t / STRIKE.fly;
    const from = { x: MINE.x - 12, y: MINE.y - 36 };
    const x = from.x + (b.strike.x - from.x) * k;
    const y = from.y + (b.strike.y - from.y) * k - Math.sin(k * Math.PI) * 70;
    const ball = boardFx('fireball');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(b.strike.y - from.y - Math.cos(k * Math.PI) * 70 * Math.PI, b.strike.x - from.x));
    if (!retro && ok(ball)) ctx.drawImage(ball, -40, -14, 54, 54 * (ball.naturalHeight / ball.naturalWidth));
    else { ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  if (b.boom) {
    const k = b.boom.age / 0.5;
    const boom = boardFx('boom-big');
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - k);
    const w = STRIKE.reach * 2 * (0.7 + k * 0.4);
    if (!retro && ok(boom)) ctx.drawImage(boom, b.boom.x - w / 2, b.boom.y - (w * boom.naturalHeight) / boom.naturalWidth / 2, w, (w * boom.naturalHeight) / boom.naturalWidth);
    else { ctx.fillStyle = '#fdba74'; ctx.beginPath(); ctx.arc(b.boom.x, b.boom.y, w / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  drawPuffs(ctx, now, retro);
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
  const k = FIG * 1.12 * (tactics ? starScale(drag.piece.star) : 1);
  ctx.scale(k, k);
  drawBoardFigure(ctx, figureOf(drag.piece.tier, drag.piece.cast, 1, 0, 0, 0), now, retro, tactics ? STAR_BORDER[(drag.piece.star ?? 1) - 1] || null : null);
}
