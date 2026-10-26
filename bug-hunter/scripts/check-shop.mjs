// Browser check of the shop and Customise's skin list on the built game: `npm run build`, then
// `npm run test:game:shop`. Needs Playwright with a Chromium; without one it says so and skips (exit 0).
// It opens every shop section and sub-section with a fresh save and an advanced one (items owned, worn and levelled,
// forge maxed, arsenal and spirits bought) at 360 and 430 px wide and on desktop, and fails when a card's child
// spills out of its sides, a text runs under a lit card's band, the button is not centred in the band's panel or the
// cards of a row are not the same height. It also wears an owned skin from the shop and checks the skin groups.
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';

const repo = fileURLToPath(new URL('../../', import.meta.url));
if (!existsSync(join(repo, 'dist/game.html'))) { console.error('check-shop: run `npm run build` first (no dist/game.html).'); process.exit(1); }
const require = createRequire(import.meta.url);
let chromium;
for (const from of [repo, process.env.NODE_PATH, '/usr/local/lib/node_modules', '/usr/lib/node_modules'].filter(Boolean)) {
  try { ({ chromium } = require(require.resolve('playwright', { paths: [from] }))); break; } catch { /* next */ }
}
if (!chromium) { console.log('check-shop: Playwright not found, skipped.'); process.exit(0); }

const server = await preview({ root: repo, logLevel: 'silent', preview: { port: 0, open: false } });
const url = `${server.resolvedUrls.local[0]}game.html`;
const ADVANCED = {
  skin: 'robot', skins: ['boy', 'intern', 'lava', 'robot', 'kitty', 'duck', 'glitch'], coins: 2600,
  owned: ['wizardHat', 'bandana', 'potion', 'phoenix', 'plate', 'windBoots', 'orb', 'lantern', 'spiritFire', 'keySword', 'quiver', 'knifeSet'],
  itemLevels: { phoenix: 2 }, equipped: { head: 'wizardHat', body: 'potion', boots: 'windBoots', magic: 'lantern', melee: 'keySword', ranged: 'quiver' },
  arsenal: ['brick', 'molotov'], upgrades: { vitality: 5, might: 2, armor: 4, wisdom: 1 }, extraSlot: true,
  bestByWorld: { 1: { time: 100 }, 2: { time: 100 }, 3: { time: 100 } }, hordeBest: { 1: { won: true } },
};
const SAVES = { fresh: { coins: 300 }, advanced: ADVANCED };
const VIEWS = { 360: { width: 360, height: 780 }, 430: { width: 430, height: 932 }, desktop: { width: 1280, height: 720 } };
const problems = [];
let checks = 0;

/** Every card on screen: nothing out of its sides, texts above a lit card's band, its button in the band's panel,
    one height per row. */
const measure = () => {
  const out = [];
  for (const card of document.querySelectorAll('.panel .items .item')) {
    const a = card.getBoundingClientRect();
    const band = parseFloat(getComputedStyle(card).borderBottomWidth);
    const name = card.querySelector('b')?.textContent.trim();
    const kids = [...card.children].filter((k) => getComputedStyle(k).display !== 'none');
    for (const k of kids) { const r = k.getBoundingClientRect(); if (r.left < a.left - 1 || r.right > a.right + 1) out.push(`${name}: ${k.tagName.toLowerCase()}.${k.className} out of its sides`); }
    const last = kids.at(-1);
    if (band > 40 && last) {
      for (const k of kids.slice(0, -1)) { const r = k.getBoundingClientRect(); if (r.bottom > a.bottom - band + 2) out.push(`${name}: ${k.tagName.toLowerCase()}.${k.className} runs under the band`); }
      const r = last.getBoundingClientRect(), mid = (r.top + r.bottom) / 2 - (a.bottom - band);
      if (mid < 30 || mid > 56) out.push(`${name}: button not centred in the band's panel (${Math.round(mid)} of 17-68)`);
    }
  }
  const rows = new Map();
  for (const card of document.querySelectorAll('.panel .items .item')) {
    const a = card.getBoundingClientRect(), key = `${[...document.querySelectorAll('.panel .items')].indexOf(card.parentElement)}:${Math.round(a.top)}`;
    rows.set(key, [...(rows.get(key) ?? []), Math.round(a.height)]);
  }
  for (const [, heights] of rows) if (new Set(heights).size > 1) out.push(`a row of cards ${heights.join(' / ')} px tall`);
  return out;
};

const browser = await chromium.launch();
try {
  for (const [saveName, save] of Object.entries(SAVES)) for (const [viewName, viewport] of Object.entries(VIEWS)) {
    const page = await browser.newPage({ viewport, locale: 'es-ES' });
    await page.addInitScript((save) => { if (!sessionStorage.seeded) { sessionStorage.seeded = '1'; localStorage.setItem('bugHunter', JSON.stringify(save)); } }, save);
    await page.goto(url);
    await page.waitForSelector('#screen');
    await page.evaluate(() => document.getElementById('consent')?.remove());
    const act = (data) => page.evaluate((data) => { const b = document.createElement('button'); Object.assign(b.dataset, data); document.getElementById('screen').append(b); b.click(); }, data);
    await act({ act: 'shop' });
    await page.waitForSelector('[data-shop-sec]');
    const where = `${saveName} ${viewName}`;
    // The coins sit on the frame at the X's height.
    const coins = await page.evaluate(() => { const w = document.querySelector('.shop-wallet')?.getBoundingClientRect(), x = document.querySelector('.ui-close')?.getBoundingClientRect(); return w && x ? Math.abs((w.top + w.bottom) / 2 - (x.top + x.bottom) / 2) : -1; });
    checks++; if (coins < 0 || coins > 2) problems.push(`${where}: the shop's coins are not level with the X`);
    for (const sec of await page.$$eval('[data-shop-sec]', (els) => els.map((e) => e.dataset.shopSec))) {
      await page.click(`[data-shop-sec="${sec}"]`);
      for (const sub of await page.$$eval('[data-shop-sec^="slot:"]', (els) => els.map((e) => e.dataset.shopSec))) await page.click(`[data-shop-sec="${sub}"]`);
      await page.waitForTimeout(300);
      checks++;
      for (const p of await page.evaluate(measure)) problems.push(`${where} ${sec}: ${p}`);
      if (sec === 'skins') {
        const groups = await page.$$eval('.skin-group', (els) => els.length);
        const world = await page.evaluate(() => document.querySelector('.skin-items')?.querySelectorAll('.skin-item').length ?? 0);
        checks++; if (groups !== 3 || world < 10) problems.push(`${where}: shop skins not in 3 groups with alvrich's 10 world looks (${groups} groups, ${world} in the first)`);
      }
      await page.click(`[data-shop-sec="${sec}"]`);
    }
    if (saveName === 'advanced' && viewName === '360') {
      // An owned skin is worn straight from the shop.
      await page.click('[data-shop-sec="skins"]');
      await page.click('[data-skin-wear="kitty"]');
      await page.waitForTimeout(200);
      const worn = await page.evaluate(() => JSON.parse(localStorage.getItem('bugHunter')).skin);
      checks++; if (worn !== 'kitty') problems.push(`${where}: Wear in the shop did not wear Kitty (${worn})`);
      // Customise: the same three groups.
      await act({ act: 'styles-skin' });
      await page.waitForSelector('.gear-row[data-skin]');
      const titles = await page.$$eval('.skin-group', (els) => els.length);
      checks++; if (titles !== 3) problems.push(`${where}: Customise shows ${titles} skin groups, not 3`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
for (const p of problems) console.error(`FAIL ${p}`);
console.log(`${checks} shop checks, ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
