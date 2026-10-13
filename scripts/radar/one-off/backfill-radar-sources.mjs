// One-off: bring the archive in line with the current sources and relevance
// rules. Drops stories that no longer pass the filter, adds every relevant
// story the sources still list since OLDEST_DATE (Anthropic via its sitemap),
// then fills in pictures and summaries. Safe to re-run.
//
//   node scripts/radar/one-off/backfill-radar-sources.mjs

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { mergeIntoArchive } from '../radar-tags.mjs';
import { SOURCES, addMissingMeta, fetchPageMeta, isRelevantForSource, readSource } from '../radar-sources.mjs';

const ARCHIVE_PATH = path.join(process.cwd(), 'static', 'data', 'ai-radar-archive.json');
const OLDEST_DATE = '2026-04-01';
const TODAY = new Date().toISOString().slice(0, 10);

const count = (items) => items.reduce((map, item) => map.set(item.source, (map.get(item.source) || 0) + 1), new Map());

const archive = JSON.parse(await readFile(ARCHIVE_PATH, 'utf8'));
const before = archive.items.length;
const kept = archive.items.filter(isRelevantForSource);
console.log(`Archive: ${before} stories, ${before - kept.length} dropped by the relevance filter.`);

// Feeds.
const fresh = [];
for (const source of SOURCES.filter((item) => item.type !== 'anthropic')) {
  const { ok, error, items } = await readSource(source, TODAY);
  const relevant = items.filter((item) => item.date >= OLDEST_DATE && isRelevantForSource(item));
  console.log(`${source.name.padEnd(26)} ${ok ? 'OK' : error} · ${relevant.length} relevant since ${OLDEST_DATE}`);
  fresh.push(...relevant);
}

// Anthropic: every /news/ page in the sitemap, dated from the article itself.
const anthropic = SOURCES.find((item) => item.type === 'anthropic');
const sitemap = await (await fetch('https://www.anthropic.com/sitemap.xml')).text();
const newsUrls = [...new Set([...sitemap.matchAll(/<loc>(https:\/\/www\.anthropic\.com\/news\/[^<]+)<\/loc>/g)].map((match) => match[1]))];
const anthropicItems = [];
for (let index = 0; index < newsUrls.length; index += 6) {
  await Promise.all(newsUrls.slice(index, index + 6).map(async (url) => {
    const meta = await fetchPageMeta(url);
    const date = meta.published ? new Date(meta.published).toISOString().slice(0, 10) : '';
    if (!meta.title || !date || date < OLDEST_DATE) return;
    const item = { source: anthropic.name, title: meta.title.replace(/\s*\\?\s*Anthropic$/, ''), description: meta.summary, summary: meta.summary, image: meta.image, date, url };
    if (isRelevantForSource(item)) anthropicItems.push(item);
  }));
}
console.log(`${anthropic.name.padEnd(26)} sitemap ${newsUrls.length} pages · ${anthropicItems.length} relevant since ${OLDEST_DATE}`);
fresh.push(...anthropicItems);

// Merge, then fill pictures and summaries for anything still missing them.
const items = mergeIntoArchive(kept, fresh.map(({ description, link, ...item }) => ({ ...item, summary: item.summary || description || '' })));
const missing = items.filter((item) => !item.image || !item.summary).length;
console.log(`Merged: ${items.length} stories. Fetching pictures/summaries for ${missing}…`);
await addMissingMeta(items, 6);

archive.items = items;
archive.generatedAt = new Date().toISOString();
await writeFile(ARCHIVE_PATH, `${JSON.stringify(archive)}\n`, 'utf8');

console.log(`\nArchive: ${before} → ${items.length} stories (${items.at(-1)?.date} → ${items[0]?.date})`);
console.log(`With picture: ${items.filter((item) => item.image).length} · with summary: ${items.filter((item) => item.summary).length}`);
console.log([...count(items)].sort((a, b) => b[1] - a[1]).map(([name, n]) => `  ${name}: ${n}`).join('\n'));
