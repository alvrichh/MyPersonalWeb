// One-off: give archive stories that lack them a picture and a summary, read
// from each article's own og:image / og:description tags. Saves progress as it
// goes, so it can be stopped and re-run; stories already enriched are skipped.
//
//   node scripts/enrich-radar-archive.mjs

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ARCHIVE_PATH = path.join(process.cwd(), 'assets', 'data', 'ai-radar-archive.json');
const CONCURRENCY = 6;
const TIMEOUT_MS = 10000;
const SAVE_EVERY = 60;

const decodeEntities = (value = '') => value
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replaceAll('&apos;', "'")
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replace(/\s+/g, ' ')
  .trim();

const cleanImageUrl = (value = '', base = '') => {
  try {
    const parsed = new URL(decodeEntities(value), base || undefined);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
};

const metaContent = (html, names) => {
  for (const name of names) {
    const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`, 'i'))?.[0];
    const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
    if (content) return content;
  }
  return '';
};

const fetchPageMeta = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'alvrich-maintenance-bot/1.0 (+https://alvrich.vercel.app)', accept: 'text/html' },
    });
    if (!response.ok) return { status: response.status };
    // Meta tags live in <head>; no need to read the whole article.
    const html = (await response.text()).slice(0, 250000);
    return {
      status: response.status,
      image: cleanImageUrl(metaContent(html, ['og:image', 'twitter:image', 'twitter:image:src']), response.url),
      summary: decodeEntities(metaContent(html, ['og:description', 'description', 'twitter:description'])).slice(0, 280),
    };
  } catch (error) {
    return { status: error.name === 'AbortError' ? 'timeout' : 'error' };
  } finally {
    clearTimeout(timeout);
  }
};

const archive = JSON.parse(await readFile(ARCHIVE_PATH, 'utf8'));
const todo = archive.items.filter((item) => !item.image || !item.summary);
const save = () => writeFile(ARCHIVE_PATH, `${JSON.stringify(archive)}\n`, 'utf8');

console.log(`Stories to enrich: ${todo.length} of ${archive.items.length}`);

let done = 0;
let images = 0;
let summaries = 0;
const failures = {};

for (let index = 0; index < todo.length; index += CONCURRENCY) {
  await Promise.all(todo.slice(index, index + CONCURRENCY).map(async (item) => {
    const meta = await fetchPageMeta(item.url);
    if (meta.image && !item.image) { item.image = meta.image; images += 1; }
    if (meta.summary && !item.summary) { item.summary = meta.summary; summaries += 1; }
    if (!meta.image) failures[meta.status] = (failures[meta.status] || 0) + 1;
    done += 1;
  }));

  if (done % SAVE_EVERY < CONCURRENCY) {
    await save();
    console.log(`${done}/${todo.length} · images +${images} · summaries +${summaries}`);
  }
}

await save();
console.log(`Done. Images added: ${images}. Summaries added: ${summaries}.`);
console.log(`Without image, by reason: ${JSON.stringify(failures)}`);
