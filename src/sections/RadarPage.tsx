import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { cleanSummary, decodeEntities, isSafeUrl, sizedImage, useRadar, useRadarArchive, type ArchiveItem, type RadarItem } from '../lib/radar';
import { formatDay } from '../lib/format';
import { SearchIcon } from '../components/icons';

const MAX_FILTERS = 8;
const ARCHIVE_PAGE = 50;

const hasTag = (tag: string) => (item: RadarItem) => tag === 'all' || (item.tags ?? []).includes(tag);

// Pictures come from third-party sites; a broken one falls back to a tinted
// panel with the source name.
function CardMedia({ item, featured, index }: { item: RadarItem; featured: boolean; index: number }) {
  const [failed, setFailed] = useState(false);
  if (!item.image || !isSafeUrl(item.image) || failed) {
    return <span className="radar-card-media"><span className="radar-card-fallback">{item.source}</span></span>;
  }
  return (
    <span className="radar-card-media">
      <img
        src={sizedImage(item.image, featured ? 1200 : 800)}
        alt=""
        loading={index < 3 ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function RadarCard({ item, featured, index }: { item: RadarItem; featured: boolean; index: number }) {
  const { t, lang } = useI18n();
  const title = decodeEntities(item.title);
  const summary = cleanSummary(item.summary);
  return (
    <li className={`radar-card${featured ? ' is-featured' : ''}`}>
      <a className="radar-card-link" href={item.url} target="_blank" rel="noreferrer">
        <CardMedia item={item} featured={featured} index={index} />
        <span className="radar-card-body">
          <span className="radar-card-meta">
            <span>{item.source}</span>
            <span>{formatDay(item.date, lang.locale)}</span>
          </span>
          <span className="radar-card-title">{title}</span>
          {summary && summary !== title && <span className="radar-card-summary">{summary}</span>}
          {!!item.tags?.length && (
            <span className="radar-card-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</span>
          )}
          <span className="radar-card-cta">{t('radar.read', { source: item.source })}</span>
        </span>
      </a>
    </li>
  );
}

function ArchiveThumb({ image }: { image?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="radar-archive-thumb" aria-hidden="true">
      {image && isSafeUrl(image) && !failed && (
        <img src={sizedImage(image, 160)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      )}
    </span>
  );
}

/** Archive rows grouped by month, newest first. */
function ArchiveList({ items }: { items: ArchiveItem[] }) {
  const { t, lang } = useI18n();
  const months = useMemo(() => {
    const groups: { key: string; items: ArchiveItem[] }[] = [];
    items.forEach((item) => {
      const key = String(item.date).slice(0, 7);
      if (groups.at(-1)?.key !== key) groups.push({ key, items: [] });
      groups.at(-1)!.items.push(item);
    });
    return groups;
  }, [items]);

  if (!items.length) return <ol className="radar-archive-list"><li className="radar-empty">{t('radar.noResults')}</li></ol>;

  return (
    <ol className="radar-archive-list" id="archive-list">
      {months.map((month) => {
        const [year, number] = month.key.split('-').map(Number);
        return (
          <li className="radar-archive-month" key={month.key}>
            <h3>{new Date(year, number - 1, 1).toLocaleDateString(lang.locale, { month: 'long', year: 'numeric' })}</h3>
            <ul>
              {month.items.map((item) => (
                <li key={item.url}>
                  <ArchiveThumb image={item.image} />
                  <span className="radar-date">{formatDay(item.date, lang.locale, { day: 'numeric', month: 'short' })}</span>
                  <a href={item.url} target="_blank" rel="noreferrer">{item.displayTitle}</a>
                  <span className="radar-source">{item.source}</span>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

export function RadarPage() {
  const { t, lang } = useI18n();
  const radar = useRadar();
  const archive = useRadarArchive();
  const [tag, setTag] = useState('all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(ARCHIVE_PAGE);

  // Debounce typing a little so long archives stay smooth.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim().toLowerCase()), 150);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => setShown(ARCHIVE_PAGE), [tag, search]);

  const items = radar?.items ?? [];
  const latest = items.filter(hasTag(tag));

  // Filters count the whole archive when it is there.
  const pool: RadarItem[] = archive.length ? archive : items;
  const filters = useMemo(() => {
    const counts = new Map<string, number>();
    pool.forEach((item) => (item.tags ?? []).forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_FILTERS);
  }, [pool]);

  const matching = archive.filter((item) => hasTag(tag)(item) && (!search || item.searchText.includes(search)));
  const remaining = matching.length - Math.min(shown, matching.length);

  return (
    <section className="radar-page wrap" id="radar">
      <a className="radar-back" href="./index.html#radar">
        <span aria-hidden="true">←</span>
        <span>{t('radarPage.back')}</span>
      </a>

      <header className="radar-page-head">
        <div className="radar-page-copy">
          <p className="section-index">{t('radarPage.kicker')}</p>
          <h1 className="radar-page-title">{t('radarPage.title')}</h1>
          <p className="radar-page-intro">{t('radarPage.intro')}</p>
          <p className="radar-page-meta">
            <span>{radar?.date ? `${t('radar.updated')} ${formatDay(radar.date, lang.locale)}` : ''}</span>
            <span>{items.length ? t('radar.count', { n: latest.length }) : ''}</span>
          </p>
        </div>

        <div className="radar-page-side">
          <label className="radar-search">
            <SearchIcon />
            <input
              type="search"
              placeholder={t('radarPage.search')}
              aria-label={t('radarPage.search')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          {radar?.insight && (
            <aside className="radar-insight">
              <p className="radar-insight-label">{t('radarPage.take')}</p>
              <p>{radar.insight}</p>
            </aside>
          )}
        </div>
      </header>

      {!!filters.length && (
        <div className="radar-filters" role="group" aria-label={t('radar.filterAria')}>
          {[['all', pool.length] as [string, number], ...filters].map(([name, count]) => (
            <button key={name} type="button" className="radar-chip" aria-pressed={tag === name} onClick={() => setTag(name)}>
              <span>{name === 'all' ? t('radar.all') : name}</span>
              <small>{count}</small>
            </button>
          ))}
        </div>
      )}

      {/* While searching, the results replace the "Latest" cards. */}
      <div className="radar-latest" hidden={Boolean(search)}>
        <h2 className="radar-block-title">{t('radarPage.latest')}</h2>
        <ul className="radar-grid">
          {radar === undefined && <li className="radar-empty">{t('radar.loading')}</li>}
          {radar !== undefined && !latest.length && <li className="radar-empty">{t('radar.empty')}</li>}
          {latest.map((item, index) => (
            <RadarCard key={item.url} item={item} index={index} featured={index === 0 && tag === 'all'} />
          ))}
        </ul>
      </div>

      {!!archive.length && (
        <section className="radar-archive" aria-labelledby="archive-title">
          <header className="radar-archive-head">
            <h2 className="radar-block-title" id="archive-title">{t('radarPage.archive')}</h2>
            <p className="radar-archive-intro">
              <span>{t('radarPage.archiveIntro')}</span>
              <span className="radar-archive-count">{t('radar.count', { n: matching.length })}</span>
            </p>
          </header>

          <ArchiveList items={matching.slice(0, shown)} />

          {remaining > 0 && (
            <button className="radar-archive-more" type="button" aria-controls="archive-list" onClick={() => setShown((value) => value + ARCHIVE_PAGE)}>
              {t('radar.loadMore')} ({remaining})
            </button>
          )}
        </section>
      )}
    </section>
  );
}
