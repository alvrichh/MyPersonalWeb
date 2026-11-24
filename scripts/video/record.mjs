// Records the 60-second portfolio tour from the live site, frame by frame, into
// .cache/video/frames (see README.md in this folder). Needs Playwright with Chromium.
import fs from 'node:fs';
import path from 'node:path';

const W = 1920, H = 1080, SITE = process.env.SITE || 'https://alvrich.vercel.app/';
const OUT = path.resolve(process.env.OUT || '.cache/video');
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}
fs.rmSync(path.join(OUT, 'frames'), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });
process.chdir(OUT);
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p = await b.newPage({ viewport: { width: W, height: H }, locale: 'es-ES', colorScheme: 'light' });

// On every page: a drawn cursor, no skip link, a smooth scroll helper, and a brand
// click that glides to the top without focusing the brand (focus counts as a poke).
await p.addInitScript(() => {
  const setup = () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const st = document.createElement('style'); st.textContent = '.skip-link { display: none !important; }'; document.head.appendChild(st);
    const c = document.createElement('div');
    c.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.7 L11.5 14 L17.5 14 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483647, pointerEvents: 'none', transform: 'translate(-100px,-100px)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.35))' });
    document.documentElement.appendChild(c);
    addEventListener('mousemove', e => { c.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 2}px)`; }, true);
    document.body.style.transformOrigin = '0 0';
    document.addEventListener('click', e => { if (e.target.closest('.site-header .brand')) { e.preventDefault(); window.__scroll(0, 1500); } }, true);
    document.addEventListener('mousedown', e => { if (e.target.closest('.site-header .brand')) e.preventDefault(); }, true);
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', setup) : setup();
  window.__scroll = (to, ms) => new Promise(res => {
    const from = scrollY, t0 = performance.now();
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = now => { const k = Math.min(1, (now - t0) / ms); scrollTo(0, from + (to - from) * ease(k)); k < 1 ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  });
});

// Warm the cache for the subpages, then start fresh on the home page.
for (const u of ['calendar.html', 'ai-radar.html']) await p.goto(SITE + u, { waitUntil: 'networkidle' });
await p.goto(SITE, { waitUntil: 'networkidle' });
await p.evaluate(() => localStorage.clear());
await p.goto(SITE, { waitUntil: 'networkidle' });
await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 110)); } scrollTo(0, 0); });
await p.waitForTimeout(900);

const cdp = await p.context().newCDPSession(p);
const frames = []; let live = true;
cdp.on('Page.screencastFrame', f => {
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  if (!live) return;
  const i = frames.length; frames.push(f.metadata.timestamp);
  fs.writeFileSync(`frames/${String(i).padStart(5, '0')}.jpg`, Buffer.from(f.data, 'base64'));
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });

const segs = []; const seg = name => segs.push({ name, at: frames.length });
let mx = 1100, my = 700;
const wait = ms => p.waitForTimeout(ms);
const glide = async (x, y, ms) => { const sx = mx, sy = my, t0 = Date.now();
  for (;;) { const t = Math.min(1, (Date.now() - t0) / ms), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; await p.mouse.move(sx + (x - sx) * e, sy + (y - sy) * e); if (t >= 1) break; await p.waitForTimeout(10); } mx = x; my = y; };
const box = async sel => { const r = await p.locator(sel).first().boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
const clickAt = async (sel, ms = 650) => { const [x, y] = await box(sel); await glide(x, y, ms); await wait(120); await p.mouse.down(); await wait(70); await p.mouse.up(); };
const yOf = id => p.evaluate(id => { const e = document.getElementById(id); return Math.min(e.getBoundingClientRect().top + scrollY - 100, document.documentElement.scrollHeight - innerHeight); }, id);
const bottom = () => p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const showCursor = async () => { await p.mouse.move(mx + 1, my); await p.mouse.move(mx, my); await wait(100); };
// Frame-by-frame scroll: one screenshot per video frame, with every animation
// (the Disco colour cycle) advanced exactly one frame, so colours keep their real pace.
const stepScroll = async (to, n) => {
  live = false;
  const from = await p.evaluate(() => scrollY);
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let ts = frames.at(-1) ?? 0;
  for (let k = 1; k <= n; k++) {
    await p.evaluate(y => { scrollTo(0, y); for (const a of document.getAnimations()) { if (a.playState !== 'paused') a.pause(); a.currentTime = (a.currentTime ?? 0) + 1000 / 30; } }, from + (to - from) * ease(k / n));
    const buf = await p.screenshot({ type: 'jpeg', quality: 90 });
    const i = frames.length; ts += 1 / 30; frames.push(ts);
    fs.writeFileSync(`frames/${String(i).padStart(5, '0')}.jpg`, buf);
  }
  await p.evaluate(() => document.getAnimations().forEach(a => a.play()));
  live = true;
};

await p.mouse.move(mx, my);
seg('intro'); await wait(1200);

seg('controls');
await clickAt('.topbar-controls .icon-button', 800); await wait(1000);
await clickAt('#accent-menu >> xpath=.. >> .picker-trigger', 500); await wait(350);
await clickAt('#accent-menu [data-accent="rainbow"]', 450); await wait(900);
await clickAt('#language-menu >> xpath=.. >> .picker-trigger', 500); await wait(350);
await clickAt('#language-menu .picker-option[lang^="en"]', 450); await wait(900);

seg('buttons');
for (const n of [1, 2, 3]) { const [x, y] = await box(`.hero-actions a:nth-child(${n})`); await glide(x, y, 450); await wait(650); }
await glide(1000, 640, 400);

// The avatar easter egg: zoom in and show only its first two lines.
seg('egg');
const [bx, by] = await box('.site-header .brand-mark');
await glide(bx + 150, by + 90, 500);
const S = 2.6, tx = W / 2 - bx * S - 60, ty = H / 2 - by * S - 110;
await p.evaluate(([tx, ty, S]) => { document.body.style.transition = 'transform 1.2s cubic-bezier(.65,0,.35,1)'; document.body.style.transform = `translate(${tx}px, ${ty}px) scale(${S})`; }, [tx, ty, S]);
const zx = bx * S + tx, zy = by * S + ty;
await glide(zx + 200, zy + 260, 1100);
for (let i = 0; i < 2; i++) { seg('egg-move'); await glide(zx, zy, 260); seg('egg-line'); await wait(1100); seg('egg-move'); await glide(zx + 130, zy + 170, 200); }
seg('zoomout');
await p.evaluate(() => { document.body.style.transform = 'none'; });
await glide(1700, 900, 1100);
await p.evaluate(() => { document.body.style.transition = 'none'; document.body.style.removeProperty('transform'); });

const ghY = await p.evaluate(() => { const r = document.querySelector('.gh').getBoundingClientRect(); return r.top + scrollY - (innerHeight - r.height) / 2; });
const p3Y = await p.evaluate(() => document.querySelectorAll('#work .work-item')[2].getBoundingClientRect().top + scrollY - 140);
seg('down1a'); await stepScroll(p3Y, 120);
seg('down1b'); await stepScroll(ghY, 165);
seg('gh'); await wait(1000);
seg('down2'); await stepScroll(await bottom(), 180);
seg('bottom'); await wait(600);

seg('up'); await stepScroll(await yOf('experience'), 60);
seg('calendar'); await clickAt('#experience a[href="./calendar.html"]', 600);
seg('cut');
await p.waitForURL('**/calendar.html'); await p.waitForLoadState('networkidle'); await wait(500); await showCursor();
seg('calendar-page');
await glide(1000, 640, 600); await wait(500);
for (let year = 0; year < 3; year++) { for (const dx of [-120, -120, -120]) { await p.mouse.wheel(dx, 0); await wait(60); } await wait(1400); }
await wait(400);
seg('cut');
await p.goBack({ waitUntil: 'networkidle' });
await p.evaluate(y => scrollTo(0, y), await yOf('experience')); await wait(500); await showCursor();

seg('to-work'); await stepScroll(await yOf('work'), 60);
seg('news'); await clickAt('#work a[href="./ai-radar.html"]', 600);
seg('cut');
await p.waitForURL('**/ai-radar.html'); await p.waitForLoadState('networkidle'); await wait(500); await showCursor();
seg('news-page'); await glide(1500, 700, 600); await wait(400);
seg('news-scroll'); await stepScroll(1300, 90);
seg('news-hold'); await wait(500);
seg('news-scroll2'); await stepScroll(2500, 90);
seg('news-hold2'); await wait(600);
seg('cut');
await p.goBack({ waitUntil: 'networkidle' });
await p.evaluate(y => scrollTo(0, y), await yOf('work')); await wait(500); await showCursor();
// Off camera: poke the avatar until it shows the line just before "Hey! That tickles.".
{
  const [hx, hy] = await box('.site-header .brand-mark');
  for (let i = 0; i < 20; i++) {
    const shown = await p.evaluate(() => document.querySelector('.site-header .brand-bubble')?.textContent ?? '');
    if (shown.includes('try clicking')) break;
    await p.mouse.move(hx, hy); await wait(200); await p.mouse.move(hx + 300, hy + 400); await wait(200);
  }
  console.log('bubble before final click:', await p.evaluate(() => document.querySelector('.site-header .brand-bubble')?.textContent ?? ''));
  await p.mouse.move(mx, my); await wait(1400);
}

seg('brand');
await clickAt('.site-header .brand-mark', 700);
await wait(1800);
seg('final');
const [px, py] = await box('.hero-portrait');
await glide(W - 80, H - 60, 500);
const Z = 2.4;
await p.evaluate(([x, y, z]) => { document.body.style.transition = 'transform 2.2s cubic-bezier(.45,0,.2,1)'; document.body.style.transform = `translate(${x}px, ${y}px) scale(${z})`; }, [W / 2 - px * Z, H / 2 - py * Z, Z]);
await wait(3200);
seg('end'); await wait(800);
await cdp.send('Page.stopScreencast'); await wait(300);
fs.writeFileSync('frames/times.json', JSON.stringify(frames)); fs.writeFileSync('frames/segs.json', JSON.stringify(segs));
await b.close();
console.log('frames', frames.length);
