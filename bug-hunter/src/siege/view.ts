import { CASTS, FIELD, UNITS, energyMax, type Effect, type Fighter, type Siege } from './model';

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
/** Each world's guardian is its own room-6 boss (the jungle and the haunted servers use their only boss). */
const GUARDIANS = ['monolith', 'overlord', 'valkyrie', 'mudmonster', 'queen', 'minotaur', 'mainframe', 'wraith', 'hydra'];
/** The world map's own picture of each world, the battle's backdrop. */
const BACKDROPS = ['original', 'infierno', 'vikingos', 'lodo', 'jungla', 'rayo', 'robots', 'demonios', 'nucleo'];
/** Six-pose sets; the rest walk on four, the boss sheets on their first three (two steps and a stand). */
const SIX = new Set(['enemies/greek-bug', 'enemies/greek-ticket', 'enemies/greek-legacy', 'enemies/demon-bug', 'enemies/demon-ticket', 'enemies/demon-legacy']);
const frames = (path: string) => path.startsWith('bosses/') ? 3 : SIX.has(path) ? 6 : 4;
export function sprite(s: Siege, u: Fighter) {
  const spec = UNITS[u.id];
  if (!u.side) return spec.sprite;
  if (u.boss) return `bosses/${GUARDIANS[s.world - 1]}`;
  const kind = u.id === 1 ? 'ticket' : u.id === 2 ? 'legacy' : 'bug';
  return `enemies/${CASTS[s.world - 1]}-${kind}`;
}
export const portrait = (id: number) => `/images/game/${UNITS[id].sprite}-0.webp`;
export function preload(world: number, deck: number[]) {
  const paths = new Set([...deck.map(id => UNITS[id].sprite), ...['bug', 'ticket', 'legacy'].map(kind => `enemies/${CASTS[world - 1]}-${kind}`), `bosses/${GUARDIANS[world - 1]}`]);
  paths.forEach(path => { for (let f = 0; f < frames(path); f++) picture(`${path}-${f}`); });
  [backdropPath(world), `floors/world${world}`, wallPath(world, false), wallPath(world, true), ...FX].forEach(still);
}
const backdropPath = (world: number) => `map/pv-${BACKDROPS[world - 1]}.jpg`;
/** The story scenes' pictures: the world's map picture behind, its guardian's standing pose speaking. */
export const backdropUrl = (world: number) => `/images/game/${backdropPath(world)}`;
export const guardianUrl = (world: number) => `/images/game/bosses/${GUARDIANS[world - 1]}-2.webp`;
const FX = ['fx/wings-1.webp', 'fx/gem-big.webp', 'arrows/water.webp', 'arrows/leaf.webp', 'arrows/fire.webp', 'fx/boom-big.webp', 'fx/impact.webp', ...[1, 2, 3, 4, 5, 6].map(n => `fx/bolt-y-${n}.webp`)];
/** Pictures drawn whole (backdrop, floor, effects): no alpha crop needed. */
const stills = new Map<string, HTMLImageElement>();
function still(path: string) {
  let image = stills.get(path);
  if (!image) { image = new Image(); image.src = `/images/game/${/\.\w+$/.test(path) ? path : `${path}.webp`}`; stills.set(path, image); }
  return image;
}
const ok = (image: HTMLImageElement) => image.complete && image.naturalWidth > 0;
/** The fortresses are the Tactics benches' walled fronts (`ui/bench/boss-N`): ours the Backlog's, the enemy's its world's
    (the Backlog itself defends with its plain bench, so the two never match). Falls back to the drawn tower while loading. */
const wallPath = (world: number, enemy: boolean) => !enemy ? 'ui/bench/boss-1' : world === 1 ? 'ui/bench/bench-1' : `ui/bench/boss-${world}`;
function base(ctx: CanvasRenderingContext2D, x: number, ground: number, color: string, hp: number, max: number, enemy: boolean, world: number) {
  const wall = still(wallPath(world, enemy));
  ctx.save(); ctx.translate(x, ground);
  let top = -169;
  if (ok(wall)) {
    const w = 230, h = w * wall.naturalHeight / wall.naturalWidth;
    ctx.shadowColor = color; ctx.shadowBlur = 16;
    ctx.drawImage(wall, -w / 2, -h + 8, w, h);
    ctx.shadowBlur = 0; top = -h - 4;
  } else {
    ctx.shadowColor = color; ctx.shadowBlur = 18;
    ctx.fillStyle = '#111f32'; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-49, 0); ctx.lineTo(-49, -115); ctx.lineTo(-32, -115); ctx.lineTo(-32, -145); ctx.lineTo(32, -145); ctx.lineTo(32, -115); ctx.lineTo(49, -115); ctx.lineTo(49, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = '#050d18'; ctx.fillRect(-60, top - 6, 120, 9); ctx.fillStyle = color; ctx.fillRect(-59, top - 5, 118 * Math.max(0, hp / max), 7);
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
  const scale = Math.min(h / 340, w / 650);
  camera.width = w / scale;
  camera.x = Math.max(0, Math.min(Math.max(0, FIELD - camera.width), camera.x));
  const ground = h / scale * 0.72;
  // Cartoon Wars-style backdrop: the world's own map picture behind the field, scrolling slower than the troops.
  const back = still(backdropPath(s.world));
  if (ok(back)) {
    const bh = ground * scale + 6, bw = Math.max(w * 1.35, bh * back.naturalWidth / back.naturalHeight);
    const pan = FIELD > camera.width ? camera.x / (FIELD - camera.width) : 0.5;
    ctx.drawImage(back, -(bw - w) * pan, 0, bw, bh);
    const shade = ctx.createLinearGradient(0, 0, 0, bh); shade.addColorStop(0, '#080f2155'); shade.addColorStop(1, '#080f21cc');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, w, bh);
  }
  ctx.scale(scale, scale); ctx.translate(-camera.x + Math.max(0, (camera.width - FIELD) / 2), 0);
  const viewH = h / scale;
  ctx.fillStyle = '#101d29'; ctx.fillRect(0, ground - 10, FIELD, viewH);
  // The ground is the world's own floor, the one its sprints are played on.
  const floor = still(`floors/world${s.world}`);
  if (ok(floor)) {
    const tile = 420, th = tile * floor.naturalHeight / floor.naturalWidth;
    ctx.save(); ctx.beginPath(); ctx.rect(0, ground - 10, FIELD, viewH); ctx.clip();
    for (let x = 0; x < FIELD; x += tile) for (let y = ground - 10; y < viewH; y += th) ctx.drawImage(floor, x, y, tile, th);
    const fade = ctx.createLinearGradient(0, ground - 10, 0, viewH); fade.addColorStop(0, '#08101c33'); fade.addColorStop(1, '#08101caa');
    ctx.fillStyle = fade; ctx.fillRect(0, ground - 10, FIELD, viewH); ctx.restore();
  }
  ctx.strokeStyle = color; ctx.globalAlpha = 0.6; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, ground - 10); ctx.lineTo(FIELD, ground - 10); ctx.stroke(); ctx.globalAlpha = 1;
  base(ctx, 80, ground, '#55e5c4', s.hp[0], s.maxHp[0], false, s.world);
  base(ctx, FIELD - 80, ground, '#ff718c', s.hp[1], s.maxHp[1], true, s.world);
  mana(ctx, s, ground);
  const aimY = ground + 10;
  ctx.strokeStyle = '#ffe3a0'; ctx.globalAlpha = 0.65; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.ellipse(s.aim, aimY, 45, 13, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  for (const u of [...s.units].sort((a, b) => a.lane - b.lane || a.x - b.x)) {
    const spec = UNITS[u.id]; const y = ground + u.lane * 12;
    const path = sprite(s, u);
    // A blow shows: the boss sheets' wind-up pose (3) and flinch (8), the others lunge and lean back when hit.
    const boss = path.startsWith('bosses/');
    const frame = boss && u.hit ? 3 : boss && u.flash ? 8 : reduced ? 0 : Math.floor(s.time * 6 + u.uid) % frames(path);
    const art = picture(`${path}-${frame}`); const size = spec.size * (u.boss ? 1.2 : 1);
    ctx.fillStyle = u.side ? '#ff648577' : '#43ebce77'; ctx.beginPath(); ctx.ellipse(u.x, y + 2, size * 0.3, 7, 0, 0, Math.PI * 2); ctx.fill();
    if (art.image.complete && art.image.naturalWidth) {
      const crop = art.crop ?? [0, 0, art.image.width, art.image.height];
      const ratio = Math.min(size * 1.2 / crop[2], size / crop[3]);
      const dw = crop[2] * ratio, dh = crop[3] * ratio;
      const bob = reduced ? 0 : Math.sin(s.time * 9 + u.uid) * 1.8;
      const lunge = u.hit ? Math.sin((1 - u.hit / 0.3) * Math.PI) * 12 : 0;
      ctx.save(); ctx.translate(u.x + (u.side ? -lunge : lunge), y + bob); if (u.side) ctx.scale(-1, 1);
      if (!boss && u.flash) ctx.rotate(-0.12);
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
    if (effect(ctx, e, p, y, ground)) continue;
    ctx.globalAlpha = e.life / e.max; ctx.strokeStyle = e.side ? '#ff98b0' : '#fff0ae'; ctx.lineWidth = 3;
    ctx.beginPath();
    if (e.kind === 'shot') { ctx.moveTo(e.from + (e.x - e.from) * p, y - Math.sin(p * Math.PI) * 30); ctx.lineTo(e.from + (e.x - e.from) * Math.min(1, p + 0.15), y); }
    else ctx.ellipse(e.x, ground + 10, 30 + p * 100, 12 + p * 26, 0, 0, Math.PI * 2);
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/** The game's own effect art: the bow's painted arrows (wood from our fortress, water for our troops, leaf for theirs),
    impacts up close, and a blast with the yellow lightning for the discharge. */
function effect(ctx: CanvasRenderingContext2D, e: Effect, p: number, y: number, ground: number) {
  if (e.kind === 'arrow' || e.kind === 'shot') {
    const close = e.kind === 'shot' && Math.abs(e.x - e.from) < 60;
    const art = still(e.kind === 'arrow' ? 'arrows/fire.webp' : close ? 'fx/impact.webp' : e.side ? 'arrows/leaf.webp' : 'arrows/water.webp');
    if (!ok(art)) return false;
    if (close) { ctx.save(); ctx.globalAlpha = 1 - p; ctx.drawImage(art, e.x - 15, y - 15, 30, 30); ctx.restore(); return true; }
    // A high arc for the fortress's arrows (from its wall top), a flat one for the troops'.
    const startY = e.kind === 'arrow' ? ground - 110 : y, endY = e.kind === 'arrow' ? ground + e.lane * 12 - 14 : y;
    const lift = e.kind === 'arrow' ? 150 : 30;
    const at = (t: number) => ({ x: e.from + (e.x - e.from) * t, y: startY + (endY - startY) * t - Math.sin(t * Math.PI) * lift });
    const here = at(p), ahead = at(Math.min(1, p + 0.02));
    const len = e.kind === 'arrow' ? 72 : 40, h = len * art.naturalHeight / art.naturalWidth;
    ctx.save(); ctx.translate(here.x, here.y); ctx.rotate(Math.atan2(ahead.y - here.y, ahead.x - here.x || 0.001));
    ctx.drawImage(art, -len / 2, -h / 2, len, h); ctx.restore(); return true;
  }
  const big = e.max > 0.6;
  const art = still(big ? `fx/bolt-y-${1 + Math.min(5, Math.floor(p * 6))}.webp` : 'fx/boom-big.webp');
  const blast = still('fx/boom-big.webp');
  if (!ok(art) || !ok(blast)) return false;
  ctx.save(); ctx.globalAlpha = 1 - p * 0.8;
  const bw = 90 + p * 90; ctx.drawImage(blast, e.x - bw / 2, ground + 10 - bw * 0.7, bw, bw * blast.naturalHeight / blast.naturalWidth);
  if (big) { const h = ground + 10, w = h * art.naturalWidth / art.naturalHeight; ctx.drawImage(art, e.x - w / 2, 0, w, h); }
  ctx.restore(); return true;
}

/** The mana angel, Cartoon Wars 2's statue on our side of the field: a crystal with wings on a pedestal that glows
    brighter the more energy there is, and pulses when it is full. */
const ANGEL_X = 290;
function mana(ctx: CanvasRenderingContext2D, s: Siege, ground: number) {
  const wings = still('fx/wings-1.webp'), gem = still('fx/gem-big.webp');
  const fill = s.energy / energyMax(s), full = fill >= 0.999;
  const glow = 0.35 + 0.65 * fill, beat = full ? 1 + Math.sin(s.time * 6) * 0.05 : 1;
  const base = ground - 10, top = base - 48;
  ctx.save();
  // Pedestal.
  ctx.fillStyle = '#3a4a5e'; ctx.strokeStyle = '#7f95b0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ANGEL_X - 26, base); ctx.lineTo(ANGEL_X - 18, top + 16); ctx.lineTo(ANGEL_X + 18, top + 16); ctx.lineTo(ANGEL_X + 26, base); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillRect(ANGEL_X - 24, top + 10, 48, 8);
  if (ok(wings)) {
    ctx.save(); ctx.globalAlpha = 0.55 + 0.45 * fill;
    try { ctx.filter = 'hue-rotate(185deg) saturate(1.2)'; } catch { /* older canvases keep the fire wings */ }
    const ww = 130 * beat, wh = ww * wings.naturalHeight / wings.naturalWidth;
    ctx.drawImage(wings, ANGEL_X - ww / 2, top - wh * 0.62, ww, wh); ctx.restore();
  }
  ctx.shadowColor = '#5fd8ff'; ctx.shadowBlur = 8 + 30 * glow;
  if (ok(gem)) {
    const gw = 40 * beat, gh = gw * gem.naturalHeight / gem.naturalWidth;
    ctx.globalAlpha = 0.5 + 0.5 * glow;
    try { ctx.filter = 'hue-rotate(-75deg)'; } catch { /* purple gem */ }
    ctx.drawImage(gem, ANGEL_X - gw / 2, top + 10 - gh, gw, gh);
  }
  ctx.restore();
  // The energy rising inside the pedestal.
  ctx.fillStyle = '#5fd8ff66'; const h = (base - top - 18) * fill; ctx.fillRect(ANGEL_X - 14, base - h, 28, h);
}
