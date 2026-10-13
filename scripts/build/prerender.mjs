// Write real HTML into the built pages, so the site is readable without
// JavaScript and by search engines and link previews. React then hydrates it.
//
// Runs after `vite build` (client, into dist/) and `vite build --ssr`
// (server renderer, into dist-ssr/).

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const { render } = await import(pathToFileURL(path.join(ROOT, 'dist-ssr', 'server.mjs')).href);

const PAGES = [
  ['index.html', 'home'],
  ['ai-radar.html', 'radar'],
];

for (const [file, page] of PAGES) {
  const target = path.join(ROOT, 'dist', file);
  const html = await readFile(target, 'utf8');
  if (!html.includes('<!--app-html-->')) throw new Error(`${file}: no <!--app-html--> placeholder`);
  await writeFile(target, html.replace('<!--app-html-->', render(page)));
  console.log(`Prerendered ${file}`);
}
