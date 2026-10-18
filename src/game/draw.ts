import { H, W, WALL, isBossRoom, type Enemy, type Game } from './world';

/* Bug Hunter's renderer: everything is drawn in room units (360 × 600) and
   scaled to fit the screen. The accent colours are the player's. */

export type Palette = { accent: string; accent2: string; ink: string; rainbow: boolean };

export type View = { scale: number; ox: number; oy: number; dpr: number };

const avatar = new Image();
avatar.src = './images/favicon-192.png';

const hue = (t: number, l = 70, s = 85) => `hsl(${Math.round((t * 60) % 360)} ${s}% ${l}%)`;

export function draw(ctx: CanvasRenderingContext2D, g: Game, view: View, pal: Palette, now: number) {
  const accent = pal.rainbow ? hue(now) : pal.accent;
  const accent2 = pal.rainbow ? hue(now + 1.5) : pal.accent2;
  const { scale, ox, oy, dpr } = view;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#07090f';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const shake = g.shake > 0 ? g.shake * 10 : 0;
  const sx = shake ? (Math.random() - 0.5) * shake : 0;
  const sy = shake ? (Math.random() - 0.5) * shake : 0;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (ox + sx), dpr * (oy + sy));

  drawRoom(ctx, g, accent, now);
  for (const e of g.enemies) drawEnemy(ctx, e, now);
  drawOrbs(ctx, g);
  drawArrows(ctx, g, accent, accent2);
  drawZaps(ctx, g);
  drawPlayer(ctx, g, accent, accent2, now);
  for (const q of g.particles) {
    ctx.globalAlpha = Math.max(0, q.life / q.max);
    ctx.fillStyle = q.color;
    ctx.beginPath();
    ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawRoom(ctx: CanvasRenderingContext2D, g: Game, accent: string, now: number) {
  // Floor tiles.
  ctx.fillStyle = isBossRoom(g.room) ? '#140f1c' : '#0f141d';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  for (let x = WALL; x < W; x += 36) { ctx.beginPath(); ctx.moveTo(x, WALL); ctx.lineTo(x, H - WALL); ctx.stroke(); }
  for (let y = WALL; y < H; y += 36) { ctx.beginPath(); ctx.moveTo(WALL, y); ctx.lineTo(W - WALL, y); ctx.stroke(); }

  // Walls, with the door gap at the top.
  ctx.fillStyle = '#1d2533';
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
    grad.addColorStop(0, accent);
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

function drawPlayer(ctx: CanvasRenderingContext2D, g: Game, accent: string, accent2: string, now: number) {
  const p = g.player;
  if (p.inv > 0 && Math.floor(now * 20) % 2 === 0) return;
  // Shadow, ring and the portfolio's little figure.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + p.r * 0.9, p.r * 0.9, p.r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  const ring = ctx.createLinearGradient(p.x - p.r, p.y - p.r, p.x + p.r, p.y + p.r);
  ring.addColorStop(0, accent);
  ring.addColorStop(1, accent2);
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r + 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#e9edf5';
  ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
  if (avatar.complete && avatar.naturalWidth) ctx.drawImage(avatar, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
  ctx.restore();
  // Aim marker.
  ctx.fillStyle = accent;
  ctx.beginPath();
  const fx = p.x + Math.cos(p.face) * (p.r + 8);
  const fy = p.y + Math.sin(p.face) * (p.r + 8);
  ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Health bar above the head.
  const w = 34;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, p.x - w / 2, p.y - p.r - 14, w, 5, 2.5);
  ctx.fill();
  ctx.fillStyle = p.hp / p.maxHp > 0.3 ? '#67dfa0' : '#ff6b6b';
  roundRect(ctx, p.x - w / 2, p.y - p.r - 14, (w * p.hp) / p.maxHp, 5, 2.5);
  ctx.fill();
}

function drawArrows(ctx: CanvasRenderingContext2D, g: Game, accent: string, accent2: string) {
  const fire = g.skills.fire > 0;
  const water = g.skills.water > 0;
  ctx.lineCap = 'round';
  for (const a of g.arrows) {
    const len = Math.hypot(a.vx, a.vy) || 1;
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
  if (e.kind === 'bug') drawBug(ctx, e, now);
  else if (e.kind === 'ticket') drawTicket(ctx, e);
  else if (e.kind === 'legacy') drawLegacy(ctx, e);
  else drawBoss(ctx, e, now);
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
  if (e.aim > 0) {
    // Telegraph the charge.
    ctx.strokeStyle = `rgba(255,107,107,${0.35 + Math.sin(now * 30) * 0.2})`;
    ctx.lineWidth = r * 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(e.dir.x * 260, e.dir.y * 260);
    ctx.stroke();
  }
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
