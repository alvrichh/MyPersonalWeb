// Saves GitHub contributions (the profile's green squares) to
// static/data/github-contributions.json for the activity graph under
// Experience: the last twelve months plus every calendar year since the
// account was created. Runs before every build; if GitHub can't be reached
// the file already in the repo is kept, so a build never fails because of it.
//
// Each period is stored compactly: its first date, one level digit per day
// ("0".."4") and the daily counts.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const USER = 'alvrichh';
const FIRST_YEAR = 2021; // account created in April 2021
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outFile = join(rootDir, 'static', 'data', 'github-contributions.json');
const today = new Date().toISOString().slice(0, 10);

async function fetchPeriod(query = '') {
  const response = await fetch(`https://github.com/users/${USER}/contributions${query}`, {
    headers: { 'User-Agent': 'alvrich-portfolio-build' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  const html = await response.text();

  // Each day is a <td data-date data-level id>; its count lives in a <tool-tip for=id>.
  const counts = new Map();
  for (const [, id, text] of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)</g)) {
    const match = text.match(/^(\d[\d,]*) contributions?/);
    counts.set(id, match ? Number(match[1].replace(/,/g, '')) : 0);
  }

  const days = [];
  for (const [tag] of html.matchAll(/<td\b[^>]*\bdata-date="[^"]+"[^>]*>/g)) {
    const date = tag.match(/data-date="([^"]+)"/)[1];
    if (date > today) continue;
    const level = Number(tag.match(/data-level="(\d)"/)?.[1] ?? 0);
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    days.push({ date, level, count: counts.get(id) ?? 0 });
  }
  if (days.length < 28) throw new Error(`only ${days.length} days found; the page layout may have changed`);
  days.sort((a, b) => a.date.localeCompare(b.date));

  return {
    start: days[0].date,
    total: days.reduce((sum, day) => sum + day.count, 0),
    levels: days.map((day) => day.level).join(''),
    counts: days.map((day) => day.count),
  };
}

try {
  const periods = [{ id: 'last', ...(await fetchPeriod()) }];
  for (let year = Number(today.slice(0, 4)); year >= FIRST_YEAR; year -= 1) {
    periods.push({ id: String(year), ...(await fetchPeriod(`?from=${year}-01-01&to=${year}-12-31`)) });
  }
  writeFileSync(outFile, `${JSON.stringify({ user: USER, fetchedAt: new Date().toISOString(), periods })}\n`);
  console.log(`GitHub contributions: ${periods.map((p) => `${p.id} ${p.total}`).join(', ')}`);
} catch (error) {
  const kept = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')).fetchedAt : null;
  console.warn(`GitHub contributions not refreshed (${error.message}); ${kept ? `keeping the copy from ${kept}` : 'no copy yet'}`);
  if (!kept) writeFileSync(outFile, `${JSON.stringify({ user: USER, fetchedAt: null, periods: [] })}\n`);
}
