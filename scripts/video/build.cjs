// Turns the recorded frames into an ffmpeg concat list (.cache/video/list.txt), giving each
// part of the tour its on-screen length. FINAL (seconds) stretches the last zoom to reach 60 s.
const fs = require('fs'), path = require('path');
process.chdir(path.resolve(process.env.OUT || '.cache/video'));
const t = require(path.resolve('frames/times.json')), segs = require(path.resolve('frames/segs.json'));
const FINAL = +(process.env.FINAL || 3);
const TARGET = { intro: 1.2, controls: 6, buttons: 3.5, egg: 0.9, 'egg-move': 0.2, 'egg-line': 0.85, zoomout: 0.9,
  down1a: 4, down1b: 5.5, gh: 1.2, down2: 6, bottom: 0.5, up: 2, calendar: 1, 'calendar-page': 6.5, 'to-work': 2, news: 1, 'news-page': 1,
  'news-scroll': 3, 'news-hold': 0.5, 'news-scroll2': 3, 'news-hold2': 0.6, brand: 2.6, final: FINAL, end: 0.8, cut: 0 };
const gap = i => i < t.length - 1 ? Math.min(0.5, Math.max(0.001, t[i + 1] - t[i])) : 0.05;
let s = '', total = 0, last = 0; const report = [];
for (let k = 0; k < segs.length; k++) {
  const a = segs[k].at, b = k + 1 < segs.length ? segs[k + 1].at : t.length, tg = TARGET[segs[k].name];
  if (tg === undefined) throw new Error('no target ' + segs[k].name);
  if (!tg || b <= a) continue;
  let real = 0; for (let i = a; i < b; i++) real += gap(i);
  for (let i = a; i < b; i++) { const d = gap(i) * tg / real; total += d; s += `file frames/${String(i).padStart(5, '0')}.jpg\nduration ${d.toFixed(4)}\n`; last = i; }
  if (!segs[k].name.startsWith('egg-')) report.push(`${segs[k].name}@${(total - tg).toFixed(1)}`);
}
s += `file frames/${String(last).padStart(5, '0')}.jpg\n`;
fs.writeFileSync('list.txt', s);
console.log('total', total.toFixed(1), report.join(' '));
