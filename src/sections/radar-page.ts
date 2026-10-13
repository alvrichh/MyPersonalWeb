import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { I18n } from '../i18n/i18n';
import { Radar, RadarArchive, cleanSummary, decodeEntities, isSafeUrl, sizedImage, type ArchiveItem, type RadarItem } from '../lib/radar';
import { formatDay } from '../lib/format';
import { Icon } from '../components/icon';

const MAX_FILTERS = 8;
const ARCHIVE_PAGE = 50;

const hasTag = (tag: string) => (item: RadarItem) => tag === 'all' || (item.tags ?? []).includes(tag);

// Pictures come from third-party sites; a broken one falls back to a tinted
// panel with the source name.
@Component({
  selector: 'span[appCardMedia]',
  host: { class: 'radar-card-media' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src(); as src) {
      <img [src]="src" alt="" [attr.loading]="eager() ? 'eager' : 'lazy'" decoding="async" referrerpolicy="no-referrer" (error)="failed.set(true)" />
    } @else {
      <span class="radar-card-fallback">{{ item().source }}</span>
    }
  `,
})
export class CardMedia {
  readonly item = input.required<RadarItem>({ alias: 'appCardMedia' });
  readonly width = input(800);
  readonly eager = input(false);

  protected readonly failed = signal(false);
  protected readonly src = computed(() => {
    const image = this.item().image;
    return image && isSafeUrl(image) && !this.failed() ? sizedImage(image, this.width()) : null;
  });
}

@Component({
  selector: 'span[appArchiveThumb]',
  host: { class: 'radar-archive-thumb', 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src(); as src) {
      <img [src]="src" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" (error)="failed.set(true)" />
    }
  `,
})
export class ArchiveThumb {
  readonly image = input<string | undefined>(undefined, { alias: 'appArchiveThumb' });

  protected readonly failed = signal(false);
  protected readonly src = computed(() => {
    const image = this.image();
    return image && isSafeUrl(image) && !this.failed() ? sizedImage(image, 160) : null;
  });
}

@Component({
  selector: 'section[appRadarPage]',
  imports: [Icon, CardMedia, ArchiveThumb],
  host: { class: 'radar-page wrap', id: 'radar' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="radar-back" href="./#radar">
      <span aria-hidden="true">←</span>
      <span>{{ i18n.t('radarPage.back') }}</span>
    </a>

    <header class="radar-page-head">
      <div class="radar-page-copy">
        <p class="section-index">{{ i18n.t('radarPage.kicker') }}</p>
        <h1 class="radar-page-title">{{ i18n.t('radarPage.title') }}</h1>
        <p class="radar-page-intro">{{ i18n.t('radarPage.intro') }}</p>
        <p class="radar-page-meta">
          <span>{{ radar()?.date ? i18n.t('radar.updated') + ' ' + day(radar()!.date!) : '' }}</span>
          <span>{{ items().length ? i18n.t('radar.count', { n: latest().length }) : '' }}</span>
        </p>
      </div>

      <div class="radar-page-side">
        <label class="radar-search">
          <svg icon="search"></svg>
          <input
            type="search"
            [placeholder]="i18n.t('radarPage.search')"
            [attr.aria-label]="i18n.t('radarPage.search')"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
        </label>

        @if (radar()?.insight; as insight) {
          <aside class="radar-insight">
            <p class="radar-insight-label">{{ i18n.t('radarPage.take') }}</p>
            <p>{{ insight }}</p>
          </aside>
        }
      </div>
    </header>

    @if (filters().length) {
      <div class="radar-filters" role="group" [attr.aria-label]="i18n.t('radar.filterAria')">
        @for (filter of chips(); track filter[0]) {
          <button type="button" class="radar-chip" [attr.aria-pressed]="tag() === filter[0]" (click)="tag.set(filter[0])">
            <span>{{ filter[0] === 'all' ? i18n.t('radar.all') : filter[0] }}</span>
            <small>{{ filter[1] }}</small>
          </button>
        }
      </div>
    }

    <!-- While searching, the results replace the "Latest" cards. -->
    <div class="radar-latest" [hidden]="!!search()">
      <h2 class="radar-block-title">{{ i18n.t('radarPage.latest') }}</h2>
      <ul class="radar-grid">
        @if (radar() === undefined) {
          <li class="radar-empty">{{ i18n.t('radar.loading') }}</li>
        } @else if (!latest().length) {
          <li class="radar-empty">{{ i18n.t('radar.empty') }}</li>
        }
        @for (item of latest(); track item.url; let index = $index) {
          @let featured = index === 0 && tag() === 'all';
          @let title = decode(item.title);
          @let summary = clean(item.summary);
          <li class="radar-card" [class.is-featured]="featured">
            <a class="radar-card-link" [href]="item.url" target="_blank" rel="noreferrer">
              <span [appCardMedia]="item" [width]="featured ? 1200 : 800" [eager]="index < 3"></span>
              <span class="radar-card-body">
                <span class="radar-card-meta">
                  <span>{{ item.source }}</span>
                  <span>{{ day(item.date) }}</span>
                </span>
                <span class="radar-card-title">{{ title }}</span>
                @if (summary && summary !== title) {
                  <span class="radar-card-summary">{{ summary }}</span>
                }
                @if (item.tags?.length) {
                  <span class="radar-card-tags">
                    @for (name of item.tags; track name) {
                      <span>{{ name }}</span>
                    }
                  </span>
                }
                <span class="radar-card-cta">{{ i18n.t('radar.read', { source: item.source }) }}</span>
              </span>
            </a>
          </li>
        }
      </ul>
    </div>

    @if (archive().length) {
      <section class="radar-archive" aria-labelledby="archive-title">
        <header class="radar-archive-head">
          <h2 class="radar-block-title" id="archive-title">{{ i18n.t('radarPage.archive') }}</h2>
          <p class="radar-archive-intro">
            <span>{{ i18n.t('radarPage.archiveIntro') }}</span>
            <span class="radar-archive-count">{{ i18n.t('radar.count', { n: matching().length }) }}</span>
          </p>
        </header>

        @if (months().length) {
          <ol class="radar-archive-list" id="archive-list">
            @for (month of months(); track month.key) {
              <li class="radar-archive-month">
                <h3>{{ monthName(month.key) }}</h3>
                <ul>
                  @for (item of month.items; track item.url) {
                    <li>
                      <span [appArchiveThumb]="item.image"></span>
                      <span class="radar-date">{{ shortDay(item.date) }}</span>
                      <a [href]="item.url" target="_blank" rel="noreferrer">{{ item.displayTitle }}</a>
                      <span class="radar-source">{{ item.source }}</span>
                    </li>
                  }
                </ul>
              </li>
            }
          </ol>
        } @else {
          <ol class="radar-archive-list"><li class="radar-empty">{{ i18n.t('radar.noResults') }}</li></ol>
        }

        @if (remaining() > 0) {
          <button class="radar-archive-more" type="button" aria-controls="archive-list" (click)="shown.set(shown() + pageSize)">
            {{ i18n.t('radar.loadMore') }} ({{ remaining() }})
          </button>
        }
      </section>
    }
  `,
})
export class RadarPage {
  protected readonly i18n = inject(I18n);
  private readonly radarService = inject(Radar);
  private readonly archiveService = inject(RadarArchive);
  protected readonly radar = this.radarService.latest;
  protected readonly archive = this.archiveService.items;
  protected readonly pageSize = ARCHIVE_PAGE;

  protected readonly tag = signal('all');
  protected readonly query = signal('');
  protected readonly search = signal('');
  protected readonly shown = signal(ARCHIVE_PAGE);

  protected readonly items = computed(() => this.radar()?.items ?? []);
  protected readonly latest = computed(() => this.items().filter(hasTag(this.tag())));

  // Filters count the whole archive when it is there.
  private readonly pool = computed<RadarItem[]>(() => (this.archive().length ? this.archive() : this.items()));
  protected readonly filters = computed(() => {
    const counts = new Map<string, number>();
    this.pool().forEach((item) => (item.tags ?? []).forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_FILTERS);
  });
  protected readonly chips = computed<[string, number][]>(() => [['all', this.pool().length], ...this.filters()]);

  protected readonly matching = computed(() => {
    const search = this.search();
    return this.archive().filter((item) => hasTag(this.tag())(item) && (!search || item.searchText.includes(search)));
  });
  protected readonly remaining = computed(() => this.matching().length - Math.min(this.shown(), this.matching().length));

  /** Archive rows grouped by month, newest first. */
  protected readonly months = computed(() => {
    const groups: { key: string; items: ArchiveItem[] }[] = [];
    this.matching().slice(0, this.shown()).forEach((item) => {
      const key = String(item.date).slice(0, 7);
      if (groups.at(-1)?.key !== key) groups.push({ key, items: [] });
      groups.at(-1)!.items.push(item);
    });
    return groups;
  });

  constructor() {
    this.radarService.load();
    this.archiveService.load();

    // Debounce typing a little so long archives stay smooth.
    effect((onCleanup) => {
      const value = this.query().trim().toLowerCase();
      const timer = setTimeout(() => this.search.set(value), 150);
      onCleanup(() => clearTimeout(timer));
    });

    // A new filter or search starts the archive from the top again.
    effect(() => {
      this.tag();
      this.search();
      untracked(() => this.shown.set(ARCHIVE_PAGE));
    });
  }

  protected day(value: string) {
    return formatDay(value, this.i18n.lang().locale);
  }

  protected shortDay(value: string) {
    return formatDay(value, this.i18n.lang().locale, { day: 'numeric', month: 'short' });
  }

  protected monthName(key: string) {
    const [year, number] = key.split('-').map(Number);
    return new Date(year, number - 1, 1).toLocaleDateString(this.i18n.lang().locale, { month: 'long', year: 'numeric' });
  }

  protected decode(value: string) {
    return decodeEntities(value);
  }

  protected clean(value?: string) {
    return cleanSummary(value);
  }
}
