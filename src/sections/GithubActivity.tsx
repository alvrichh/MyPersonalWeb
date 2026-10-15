import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import contributions from '../../static/data/github-contributions.json';

// The GitHub contributions graph in the accent colour, at the end of
// Experience. It opens on the last twelve months; swiping, scrolling sideways
// or the arrows move to earlier calendar years, like the calendar page.
// The data is refreshed on every build by scripts/build/github-contributions.mjs.

type Period = { id: string; start: string; total: number; levels: string; counts: number[] };
type Day = { date: string; level: number; count: number };

const PROFILE = 'https://github.com/alvrichh';
const PERIODS = contributions.periods as Period[];
const parse = (date: string) => new Date(`${date}T12:00:00`);
const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const SWIPE_THRESHOLD = 90;
const SWIPE_COOLDOWN = 550;

function daysOf(period: Period): Day[] {
  const start = parse(period.start);
  return period.counts.map((count, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return { date: iso(date), level: Number(period.levels[i]), count };
  });
}

/** Weeks run Sunday to Saturday, like GitHub; both ends are padded. */
function weeksOf(days: Day[]) {
  const weeks: (Day | null)[][] = [];
  let week: (Day | null)[] = Array(parse(days[0].date).getDay()).fill(null);
  days.forEach((day) => {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);
  return weeks;
}

export function GithubActivity() {
  const { t, lang } = useI18n();
  const [index, setIndex] = useState(0); // 0 = last twelve months, then newer → older years
  const [slide, setSlide] = useState('');
  const area = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  indexRef.current = index;

  // index + 1 goes back in time, index - 1 forward.
  const go = (step: number) => {
    const next = Math.min(PERIODS.length - 1, Math.max(0, indexRef.current + step));
    if (next === indexRef.current) return;
    setSlide('');
    requestAnimationFrame(() => setSlide(step > 0 ? 'slide-older' : 'slide-newer'));
    setIndex(next);
  };

  // Sideways scroll (trackpad, or Shift + wheel) and swipes, as on the calendar.
  useEffect(() => {
    const node = area.current;
    if (!node) return undefined;
    let sum = 0;
    let lockedUntil = 0;
    let reset: ReturnType<typeof setTimeout>;
    let touch: { x: number; y: number; time: number } | null = null;

    const onWheel = (event: WheelEvent) => {
      const dx = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
      if (Math.abs(dx) <= Math.abs(event.shiftKey ? 0 : event.deltaY)) return;
      event.preventDefault();
      if (Date.now() < lockedUntil) return;
      sum += dx;
      clearTimeout(reset);
      reset = setTimeout(() => { sum = 0; }, 200);
      if (Math.abs(sum) >= SWIPE_THRESHOLD) {
        go(sum > 0 ? -1 : 1);
        sum = 0;
        lockedUntil = Date.now() + SWIPE_COOLDOWN;
      }
    };
    const onTouchStart = (event: TouchEvent) => {
      const point = event.touches[0];
      touch = { x: point.clientX, y: point.clientY, time: Date.now() };
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (!touch) return;
      const point = event.changedTouches[0];
      const dx = point.clientX - touch.x;
      const dy = point.clientY - touch.y;
      const quick = Date.now() - touch.time < 600;
      touch = null;
      if (quick && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? -1 : 1);
    };

    node.addEventListener('wheel', onWheel, { passive: false });
    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      node.removeEventListener('wheel', onWheel);
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  if (!PERIODS.length) return null;

  const period = PERIODS[index];
  const weeks = weeksOf(daysOf(period));
  const isLast = period.id === 'last';

  // A month label sits over the first week that starts in that month.
  const monthLabels = weeks.map((items, i) => {
    const first = items.find(Boolean);
    if (!first) return '';
    const previous = i > 0 ? weeks[i - 1].find(Boolean) : null;
    return !previous || parse(previous.date).getMonth() !== parse(first.date).getMonth()
      ? parse(first.date).toLocaleDateString(lang.locale, { month: 'short' }).replace('.', '')
      : '';
  });
  // Monday, Wednesday and Friday, as GitHub labels the rows.
  const weekday = (offset: number) => new Date(2024, 0, 7 + offset).toLocaleDateString(lang.locale, { weekday: 'short' }).replace('.', '');
  const total = new Intl.NumberFormat(lang.locale).format(period.total);
  const title = (isLast ? t('gh.title') : t('gh.titleYear')).replace('{n}', total).replace('{year}', period.id);

  return (
    <div className="edu gh" ref={area}>
      <div className="gh-head">
        <h3 className="edu-title" aria-live="polite">{title}</h3>
        <div className="gh-nav">
          <button type="button" onClick={() => go(1)} disabled={index === PERIODS.length - 1} aria-label={t('gh.older')}>‹</button>
          <span>{isLast ? t('gh.lastYear') : period.id}</span>
          <button type="button" onClick={() => go(-1)} disabled={index === 0} aria-label={t('gh.newer')}>›</button>
        </div>
      </div>

      <div className={`gh-graph ${slide}`} style={{ ['--weeks' as string]: weeks.length }} key={period.id}>
        <span />
        <div className="gh-months" aria-hidden="true">
          {monthLabels.map((label, i) => <span key={i}>{label}</span>)}
        </div>
        <div className="gh-weekdays" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6].map((row) => <span key={row}>{row % 2 === 1 ? weekday(row) : ''}</span>)}
        </div>
        <div className="gh-weeks">
          {weeks.map((items, i) => (
            <div className="gh-week" key={i} style={{ ['--week' as string]: i }}>
              {items.map((day, row) => day ? (
                <span
                  key={day.date}
                  className={`gh-day level-${day.level}`}
                  title={t('gh.day').replace('{n}', String(day.count)).replace('{date}', parse(day.date).toLocaleDateString(lang.locale, { day: 'numeric', month: 'short', year: 'numeric' }))}
                />
              ) : <span key={`pad-${row}`} className="gh-day is-pad" />)}
            </div>
          ))}
        </div>
      </div>

      <div className="gh-foot">
        <a className="gh-link" href={PROFILE} target="_blank" rel="noreferrer">{t('gh.profile')} <span aria-hidden="true">↗</span></a>
        <p className="gh-legend" aria-hidden="true">
          <span>{t('gh.less')}</span>
          {[0, 1, 2, 3, 4].map((level) => <span key={level} className={`gh-day level-${level}`} style={{ ['--week' as string]: level * 10 }} />)}
          <span>{t('gh.more')}</span>
        </p>
      </div>
    </div>
  );
}
