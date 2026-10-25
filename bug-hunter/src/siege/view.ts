import { CASTS, FIELD, UNITS, type Fighter, type Siege } from './model';

export const THEMES = ['#50e6d0', '#ff885c', '#89d7ff', '#a8c36a', '#75d891', '#e9c66d', '#ffad60', '#a2b5ff', '#e688ff'];
const pictures = new Map<string, { image: HTMLImageElement; crop?: [number, number, number, number] }>();
function picture(path: string) {
  let entry = pictures.get(path);
  if (!entry) {
    const image = new Image(); entry = { image }; pictures.set(path, entry);
    image.onload = () => {
      // Runtime alpha bounds keep existing sprite files and animation canvases untouched.
      const c = document.createElement('canvas'); c.width = image.width; c.height = image.height;
      const cx = c.getContext('2d', { willReadFrequently: true }); if (!cx) return;
      cx.drawImage(image, 0, 0);
      try {
        const data = cx.getImageData(0, 0, c.width, c.height).data;
        let left = c.width, top = c.height, right = 0, bottom = 0;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (data[(y * c.width + x) * 4 + 3] > 35) {
          left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
        }
        if (right >= left && bottom >= top) entry!.crop = [left, top, right - left + 1, bottom - top + 1];
      } catch { /* fallback still renders if pixel reads are unavailable */ }
    };
    image.src = `/images/game/${path}.webp`;
  }
  return entry;
}
/** Only known, existing Backlog boss art is used until each world's Siege boss is authored. */
export function sprite(s: Siege, u: Fighter) {
  const spec = UNITS[u.id];
  if (!u.side) return spec.sprite;
  if (u.boss) return 'bosses/monolith';
  const kind = u.id === 1 ? 'ticket' : u.id === 2 ? 'legacy' : 'bug';
  return `enemies/${CASTS[s.world - 1]}-${kind}`;
}
export const portrait = (id: number) => `/images/game/${UNITS[id].sprite}-0.webp`;
export function preload(world: number, deck: number[]) {
  const paths = new Set([...deck.map(id => UNITS[id].sprite), ...['bug', 'ticket', 'legacy'].map(kind => `enemies/${CASTS[world - 1]}-${kind}`), 'bosses/monolith']);
  paths.forEach(path => [0, 1, 2, 3].forEach(frame => picture(`${path}-${frame}`)));
}
function base(ctx: CanvasRenderingContext2D, x: number, ground: number, color: string, hp: number, max: number, enemy: boolean) {
  ctx.save(); ctx.translate(x, ground);
  ctx.shadowColor = color; ctx.shadowBlur = 18;
  ctx.fillStyle = '#111f32'; ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-49, 0); ctx.lineTo(-49, -115); ctx.lineTo(-32, -115); ctx.lineTo(-32, -145); ctx.lineTo(32, -145); ctx.lineTo(32, -115); ctx.lineTo(49, -115); ctx.lineTo(49, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) ctx.fillRect(-29 + col * 24, -102 + row * 26, 10, 10);
  ctx.fillRect(enemy ? -76 : 34, -120, 42, 9);
  ctx.fillStyle = '#050d18'; ctx.fillRect(-16, -28, 32, 28);
  ctx.fillRect(-52, -169, 104, 8); ctx.fillStyle = color; ctx.fillRect(-52, -169, 104 * hp / max, 8);
  ctx.restore();
}
export interface Camera { x: number; width: number }
export function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, s: Siege, camera: Camera, reduced: boolean) {
  const rect = canvas.getBoundingClientRect(); const w = rect.width, h = rect.height;
  if (!w || !h) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const color = THEMES[s.world - 1];
  const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#080f21'); sky.addColorStop(1, '#172c3c');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = color;
  for (let i = 0; i < 45; i++) { ctx.globalAlpha = 0.1 + (i % 4) * 0.1; ctx.fillRect((i * 113.7) % w, (i * 59.3) % (h * 0.6), 1.5, 1.5); }
  ctx.globalAlpha = 1;
  const scale = Math.min(h / 340, w / 650);
  camera.width = w / scale;
  camera.x = Math.max(0, Math.min(Math.max(0, FIELD - camera.width), camera.x));
  const ground = h / scale * 0.72;
  ctx.scale(scale, scale); ctx.translate(-camera.x + Math.max(0, (camera.width - FIELD) / 2), 0);
  const viewH = h / scale;
  ctx.fillStyle = '#101d29'; ctx.fillRect(0, ground - 10, FIELD, viewH);
  ctx.strokeStyle = color; ctx.globalAlpha = 0.16; ctx.lineWidth = 1;
  for (let x = 0; x < FIELD; x += 65) { ctx.beginPath(); ctx.moveTo(x, ground - 10); ctx.lineTo(x - 45, viewH); ctx.stroke(); }
  for (let y = ground; y < viewH; y += 25) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(FIELD, y); ctx.stroke(); }
  ctx.globalAlpha = 0.6; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, ground - 10); ctx.lineTo(FIELD, ground - 10); ctx.stroke(); ctx.globalAlpha = 1;
  base(ctx, 80, ground, '#55e5c4', s.hp[0], s.maxHp[0], false);
  base(ctx, FIELD - 80, ground, '#ff718c', s.hp[1], s.maxHp[1], true);
  const aimY = ground + 10;
  ctx.strokeStyle = '#ffe3a0'; ctx.globalAlpha = 0.65; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.ellipse(s.aim, aimY, 45, 13, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  for (const u of [...s.units].sort((a, b) => a.lane - b.lane || a.x - b.x)) {
    const spec = UNITS[u.id]; const y = ground + u.lane * 12;
    const path = sprite(s, u);
    const frame = reduced ? 0 : Math.floor(s.time * 5 + u.uid) % 2;
    const art = picture(`${path}-${frame}`); const size = spec.size * (u.boss ? 1.2 : 1);
    ctx.fillStyle = u.side ? '#ff648577' : '#43ebce77'; ctx.beginPath(); ctx.ellipse(u.x, y + 2, size * 0.3, 7, 0, 0, Math.PI * 2); ctx.fill();
    if (art.image.complete && art.image.naturalWidth) {
      const crop = art.crop ?? [0, 0, art.image.width, art.image.height];
      const ratio = Math.min(size * 1.2 / crop[2], size / crop[3]);
      const dw = crop[2] * ratio, dh = crop[3] * ratio;
      const bob = reduced ? 0 : Math.sin(s.time * 9 + u.uid) * 1.8;
      ctx.save(); ctx.translate(u.x, y + bob); if (u.side) ctx.scale(-1, 1);
      if (u.flash) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 10; }
      ctx.drawImage(art.image, ...crop, -dw / 2, -dh, dw, dh); ctx.restore();
    } else {
      ctx.fillStyle = u.side ? '#fd9aac' : color; ctx.beginPath(); ctx.roundRect(u.x - size / 4, y - size * 0.65, size / 2, size * 0.65, 10); ctx.fill();
      ctx.fillStyle = '#102132'; ctx.fillRect(u.x - 9, y - size * 0.45, 5, 5); ctx.fillRect(u.x + 4, y - size * 0.45, 5, 5);
    }
    ctx.fillStyle = '#07111c'; ctx.fillRect(u.x - 21, y - size - 10, 42, 4);
    ctx.fillStyle = u.side ? '#ff718c' : '#55e5c4'; ctx.fillRect(u.x - 21, y - size - 10, 42 * Math.max(0, u.hp / u.maxHp), 4);
  }
  for (const e of s.effects) {
    const p = 1 - e.life / e.max; const y = ground + e.lane * 12 - 26;
    ctx.globalAlpha = e.life / e.max; ctx.strokeStyle = e.side ? '#ff98b0' : '#fff0ae'; ctx.lineWidth = 3;
    ctx.beginPath();
    if (e.kind === 'shot') { ctx.moveTo(e.from + (e.x - e.from) * p, y - Math.sin(p * Math.PI) * 30); ctx.lineTo(e.from + (e.x - e.from) * Math.min(1, p + 0.15), y); }
    else ctx.ellipse(e.x, ground + 10, 30 + p * 100, 12 + p * 26, 0, 0, Math.PI * 2);
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
