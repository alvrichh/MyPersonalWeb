import { drawSprite } from './draw';
import { LOOKS, newGame, type Enemy, type EnemyKind } from './world';

/*
 * The title screen's little show: a parade of enemies from every world
 * wanders across the bottom of the screen while the hero trots after them,
 * loosing arrows. Drawn on the canvas behind the menu panel.
 */

type Actor = { e: Enemy; speed: number; bob: number; dir: number };
type Arrow = { x: number; y: number; vx: number; vy: number; life: number };
type Puff = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const KINDS: EnemyKind[] = ['bug', 'bug', 'ticket', 'bug', 'legacy', 'bug', 'ticket'];
const COLORS = ['#ff6b6b', '#ffd166', '#c084fc', '#67dfa0', '#7ad8ff', '#ffffff'];

export class Scene {
  private actors: Actor[] = [];
  private arrows: Arrow[] = [];
  private puffs: Puff[] = [];
  private hero = { x: -60, y: 0, face: 0, shot: 0, bob: 0 };
  private stars: { x: number; y: number; s: number; tw: number }[] = [];
  private last = 0;
  private spawnIn = 0;
  private look = 0;
  private template: Enemy;

  constructor() {
    // One real enemy to clone shapes and timers from; the scene never runs rules.
    this.template = newGame().enemies[0];
    for (let i = 0; i < 60; i++) this.stars.push({ x: Math.random(), y: Math.random(), s: Math.random() * 1.6 + 0.4, tw: Math.random() * 6.28 });
  }

  private spawn(w: number, groundY: number) {
    const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
    const look = LOOKS[this.look % LOOKS.length];
    if (Math.random() < 0.3) this.look += 1;
    const e: Enemy = {
      ...this.template,
      id: Math.floor(Math.random() * 1e6),
      kind,
      look,
      tint: '',
      r: kind === 'legacy' ? 20 : 14,
      hp: kind === 'legacy' ? 400 : 160,
      x: w + 40,
      y: groundY - (kind === 'legacy' ? 20 : 14) + Math.random() * 8,
      spawn: 0,
      hit: 0,
      burn: 0,
      slow: 0,
      wobble: Math.random() * 6,
      aim: 0,
      dash: 0,
      dead: false,
    };
    this.actors.push({ e, speed: 38 + Math.random() * 30, bob: Math.random() * 6, dir: -1 });
  }

  draw(ctx: CanvasRenderingContext2D, cw: number, ch: number, now: number, accent: string, accent2: string, hat?: string) {
    const dt = Math.min(0.05, this.last ? now - this.last : 0.016);
    this.last = now;
    // The scene is drawn zoomed in, so the parade reads at any screen size.
    const k = Math.min(2.2, Math.max(1.35, cw / 620));
    const w = cw / k;
    const h = ch / k;
    ctx.save();
    ctx.scale(k, k);
    const groundY = h - Math.min(90, h * 0.2);

    // Sky: the slow drift of the accent colours, and a field of stars.
    ctx.fillStyle = '#07090f';
    ctx.fillRect(0, 0, w, h);
    for (const [i, color] of [accent, accent2].entries()) {
      const x = w * (0.3 + 0.4 * i) + Math.sin(now * 0.3 + i * 2) * w * 0.15;
      const y = h * (0.3 + 0.25 * i) + Math.cos(now * 0.25 + i) * h * 0.12;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(w, h) * 0.45);
      // Hex accents take an alpha suffix; Disco's hsl() walk needs the slash form.
      grad.addColorStop(0, color.startsWith('#') ? color + '2e' : color.replace(')', ' / 0.18)'));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    for (const st of this.stars) {
      ctx.globalAlpha = 0.35 + Math.sin(now * 1.5 + st.tw) * 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(st.x * w, st.y * groundY * 0.9, st.s, st.s);
    }
    ctx.globalAlpha = 1;

    // Ground: a strip of server-room floor with a glowing seam.
    ctx.fillStyle = '#0f141d';
    ctx.fillRect(0, groundY, w, h - groundY);
    const seam = ctx.createLinearGradient(0, groundY, 0, groundY + 3);
    seam.addColorStop(0, accent);
    seam.addColorStop(1, 'transparent');
    ctx.fillStyle = seam;
    ctx.fillRect(0, groundY, w, 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    for (let x = (now * 20) % 36; x < w; x += 36) { ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x, h); ctx.stroke(); }

    // The parade.
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.actors.length < 8) {
      this.spawn(w, groundY);
      this.spawnIn = 0.9 + Math.random() * 1.4;
    }
    for (const a of this.actors) {
      a.e.x += a.dir * a.speed * dt;
      a.e.wobble += dt * 6;
      a.e.hit = Math.max(0, a.e.hit - dt);
    }
    this.actors = this.actors.filter((a) => a.e.x > -60 && !a.e.dead);

    // The hero trots along behind the parade and shoots at the nearest one.
    const hero = this.hero;
    hero.y = groundY - 16;
    const target = this.actors.reduce<Actor | null>((best, a) => (a.e.x > hero.x + 40 && (!best || a.e.x < best.e.x) ? a : best), null);
    const wantX = target ? Math.min(target.e.x - 110, w * 0.45) : w * 0.3;
    hero.x += (wantX - hero.x) * Math.min(1, dt * 1.5);
    hero.bob = Math.sin(now * 9) * 2;
    hero.shot -= dt;
    if (target && hero.shot <= 0) {
      hero.shot = 0.9;
      const dx = target.e.x - hero.x;
      const dy = target.e.y - hero.y;
      const d = Math.hypot(dx, dy) || 1;
      this.arrows.push({ x: hero.x + 14, y: hero.y - 4, vx: (dx / d) * 380, vy: (dy / d) * 380, life: 1.2 });
      hero.face = Math.atan2(dy, dx);
    }
    this.arrows = this.arrows.filter((ar) => {
      ar.x += ar.vx * dt;
      ar.y += ar.vy * dt;
      ar.life -= dt;
      for (const a of this.actors) {
        if (Math.hypot(ar.x - a.e.x, ar.y - a.e.y) > a.e.r + 4) continue;
        a.e.hit = 0.1;
        a.e.hp -= 34;
        if (a.e.hp <= 0) {
          a.e.dead = true;
          for (let i = 0; i < 12; i++) {
            const ang = Math.random() * 6.28;
            const sp = 40 + Math.random() * 120;
            this.puffs.push({ x: a.e.x, y: a.e.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 40, life: 0.6, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
          }
        }
        return false;
      }
      return ar.life > 0 && ar.x < w + 20;
    });
    this.puffs = this.puffs.filter((pf) => {
      pf.x += pf.vx * dt;
      pf.y += pf.vy * dt;
      pf.vy += 160 * dt;
      pf.life -= dt;
      return pf.life > 0;
    });

    // Draw: shadows, enemies (through the real sprite drawers), arrows, hero.
    for (const a of this.actors) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(a.e.x, groundY + 2, a.e.r * 0.9, a.e.r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(0, Math.sin(now * 8 + a.bob) * 1.5);
      drawSprite(ctx, a.e, now);
      ctx.restore();
    }
    for (const ar of this.arrows) {
      const len = Math.hypot(ar.vx, ar.vy) || 1;
      ctx.strokeStyle = accent2;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ar.x - (ar.vx / len) * 12, ar.y - (ar.vy / len) * 12);
      ctx.lineTo(ar.x, ar.y);
      ctx.stroke();
    }
    for (const pf of this.puffs) {
      ctx.globalAlpha = Math.max(0, pf.life / 0.6);
      ctx.fillStyle = pf.color;
      ctx.beginPath();
      ctx.arc(pf.x, pf.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawHero(ctx, hero.x, hero.y + hero.bob, hero.face, accent, accent2, hat);
    ctx.restore();
  }
}

const avatar = new Image();
avatar.src = './images/favicon-192.png';

function drawHero(ctx: CanvasRenderingContext2D, x: number, y: number, face: number, accent: string, accent2: string, hat?: string) {
  const r = 15;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(x, y + r + 2, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
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
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x + Math.cos(face) * (r + 8), y + Math.sin(face) * (r + 8), 2.5, 0, Math.PI * 2);
  ctx.fill();
  if (hat) {
    ctx.save();
    ctx.translate(x, y - r * 0.55);
    if (hat === 'wizardHat') {
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
    } else if (hat === 'gladHelm') {
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
    } else if (hat === 'bandana') {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-r * 0.95, -r * 0.15, r * 1.9, r * 0.32);
    }
    ctx.restore();
  }
}
