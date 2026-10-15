// Renders scripts/cv/cv.html to static/cv/alvaro-molina-cv.pdf.
// Needs Playwright with a Chromium build: `npx playwright install chromium` once,
// then `node scripts/cv/build.mjs`.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../static/cv/alvaro-molina-cv.pdf');

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(here, 'cv.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log(`Wrote ${path.relative(process.cwd(), out)}`);
