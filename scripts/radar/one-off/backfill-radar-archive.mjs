// One-off: rebuild static/data/ai-radar-archive.json from the daily reports in
// docs/ai-watch/history plus today's radar. Safe to re-run; the daily bot keeps
// the archive up to date afterwards.
//
//   node scripts/radar/one-off/backfill-radar-archive.mjs

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getRadarTags, mergeIntoArchive } from '../radar-tags.mjs';

const ROOT = process.cwd();
const HISTORY_DIR = path.join(ROOT, 'docs', 'ai-watch', 'history');
const RADAR_PATH = path.join(ROOT, 'static', 'data', 'ai-radar.json');
const ARCHIVE_PATH = path.join(ROOT, 'static', 'data', 'ai-radar-archive.json');

// The radar started in May 2026; a few feeds resurfaced years-old posts.
const OLDEST_DATE = '2026-04-01';

const decodeEntities = (value) => value
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>');

// Report lines look like:
// - **Title** — Source · 2026-10-13
//   https://example.com/story
const STORY = /^- \*\*(.+?)\*\* — (.+?) · (\d{4}-\d{2}-\d{2})\r?\n\s+(https?:\/\/\S+)/gm;

const files = (await readdir(HISTORY_DIR)).filter((name) => name.endsWith('.md')).sort();
const fromReports = [];

for (const file of files) {
  const text = await readFile(path.join(HISTORY_DIR, file), 'utf8');
  for (const [, title, source, date, url] of text.matchAll(STORY)) {
    if (date < OLDEST_DATE) continue;
    const story = { title: decodeEntities(title), source, date, url };
    fromReports.push({ ...story, tags: getRadarTags(story) });
  }
}

const radar = JSON.parse(await readFile(RADAR_PATH, 'utf8'));
const items = mergeIntoArchive(fromReports, Array.isArray(radar.items) ? radar.items : []);

await writeFile(ARCHIVE_PATH, `${JSON.stringify({ generatedAt: new Date().toISOString(), items })}\n`, 'utf8');

console.log(`Reports read: ${files.length}`);
console.log(`Archive stories: ${items.length} (${items.at(-1)?.date} → ${items[0]?.date})`);
