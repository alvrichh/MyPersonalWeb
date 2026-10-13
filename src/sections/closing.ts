import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18n, type MessageKey } from '../i18n/i18n';
import { Radar, decodeEntities } from '../lib/radar';
import { formatDay } from '../lib/format';
import { Icon, type IconName } from '../components/icon';
import { SectionHead } from './hero-about';

const RADAR_PREVIEW = 5;

/** Home: the five newest radar stories and a link to the full page. */
@Component({
  selector: 'section[appRadarPreview]',
  host: { class: 'section wrap', id: 'radar', 'aria-labelledby': 'radar-title' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="section-head">
      <p class="section-index">04</p>
      <h2 id="radar-title">{{ i18n.t('radar.title') }}</h2>
      <p class="section-intro">
        <span>{{ i18n.t('radar.intro') }}</span>&ngsp;<span class="radar-updated">{{ updated() }}</span>
      </p>
    </header>

    <ul class="radar-list">
      @if (radar() === undefined) {
        <li class="radar-empty">{{ i18n.t('radar.loading') }}</li>
      } @else if (!items().length) {
        <li class="radar-empty">{{ i18n.t('radar.empty') }}</li>
      }
      @for (item of items(); track item.url) {
        <li>
          <span class="radar-date">{{ day(item.date) }}</span>
          <a [href]="item.url" target="_blank" rel="noreferrer">{{ title(item.title) }}</a>
          <span class="radar-source">{{ item.source }}</span>
        </li>
      }
    </ul>

    <a class="radar-see-all" href="./ai-radar.html">
      <span>{{ i18n.t('radar.seeAll') }}</span>
      <span aria-hidden="true">→</span>
    </a>
  `,
})
export class RadarPreview {
  protected readonly i18n = inject(I18n);
  private readonly service = inject(Radar);
  protected readonly radar = this.service.latest;
  protected readonly items = computed(() => this.radar()?.items.slice(0, RADAR_PREVIEW) ?? []);
  protected readonly updated = computed(() => {
    const date = this.radar()?.date;
    return date ? `${this.i18n.t('radar.updated')} ${formatDay(date, this.i18n.lang().locale)}` : '';
  });

  constructor() {
    this.service.load();
  }

  protected day(value: string) {
    return formatDay(value, this.i18n.lang().locale);
  }

  protected title(value: string) {
    return decodeEntities(value);
  }
}

type OffCard = {
  icon: IconName;
  title: MessageKey;
  text: MessageKey;
  chips: string[];
  href: string;
  link: MessageKey;
  arrow: string;
  wide?: boolean;
};

const OFF_CARDS: OffCard[] = [
  { icon: 'barbell', title: 'off.gymTitle', text: 'off.gymText', chips: ['off.gymC1', 'off.gymC2', 'off.gymC3'], href: './gym.html', link: 'off.gymLink', arrow: '↗' },
  { icon: 'calendar', title: 'off.planTitle', text: 'off.planText', chips: ['off.planC1', 'off.planC2', 'Eisenhower'], href: './planning.html', link: 'off.planLink', arrow: '↗' },
  { icon: 'sparkles', title: 'off.aiTitle', text: 'off.aiText', chips: ['off.aiC1', 'LLMs', 'Dev tools'], href: '#radar', link: 'off.aiLink', arrow: '↘' },
  { icon: 'calendarMonth', title: 'off.calTitle', text: 'off.calText', chips: ['off.calC1', 'off.calC2', 'off.calC3', 'off.calC4'], href: './calendar.html', link: 'off.calLink', arrow: '↗', wide: true },
];

@Component({
  selector: 'section[appOffTheClock]',
  imports: [SectionHead, Icon],
  host: { class: 'section wrap off', id: 'off', 'aria-labelledby': 'off-title' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header appSectionHead index="05" headingId="off-title" title="off.title"></header>

    <div class="off-body">
      <figure class="off-photo">
        <img src="./images/giralda.png" alt="La Giralda in Seville at sunset" width="419" height="366" loading="lazy" />
        <figcaption>{{ i18n.t('off.caption') }}</figcaption>
      </figure>

      <div class="off-copy">
        <p class="off-route">
          <span>{{ i18n.t('off.from') }}</span>
          <span class="off-route-line" aria-hidden="true"></span>
          <span>{{ i18n.t('off.to') }}</span>
        </p>
        <p class="off-lead">{{ i18n.t('off.lead') }}</p>
        <p class="off-note">{{ i18n.t('off.note') }}</p>
      </div>
    </div>

    <ul class="off-cards">
      @for (card of cards; track card.title) {
        <li class="off-card" [class.off-card-wide]="card.wide">
          <svg [icon]="card.icon" class="off-card-mark"></svg>
          <div class="off-card-head">
            <span class="off-card-icon" aria-hidden="true"><svg [icon]="card.icon"></svg></span>
            <h3>{{ i18n.t(card.title) }}</h3>
          </div>
          <p>{{ i18n.t(card.text) }}</p>
          <ul class="off-chips">
            @for (value of card.chips; track value) {
              <li>{{ chip(value) }}</li>
            }
          </ul>
          <a class="off-card-link" [href]="card.href"><span>{{ i18n.t(card.link) }}</span>&ngsp;<span aria-hidden="true">{{ card.arrow }}</span></a>
        </li>
      }
    </ul>
  `,
})
export class OffTheClock {
  protected readonly i18n = inject(I18n);
  protected readonly cards = OFF_CARDS;

  /** Chips are message keys when they start with "off.", literals otherwise. */
  protected chip(value: string) {
    return value.startsWith('off.') ? this.i18n.t(value) : value;
  }
}

@Component({
  selector: 'section[appContact]',
  host: { class: 'contact wrap', id: 'contact', 'aria-labelledby': 'contact-title' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="section-index">06</p>
    <h2 id="contact-title" class="contact-title">
      <span>{{ i18n.t('contact.titleOne') }}</span>
      <em>{{ i18n.t('contact.titleTwo') }}</em>
    </h2>
    <p class="contact-lead">{{ i18n.t('contact.lead') }}</p>

    <a class="contact-mail" href="mailto:alvrodmol@gmail.com">alvrodmol&#64;gmail.com</a>

    <ul class="contact-links">
      <li><a href="https://www.linkedin.com/in/alvrich/" target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a></li>
      <li><a href="https://github.com/alvrichh" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a></li>
      <li><a href="https://wa.link/41utbj" target="_blank" rel="noreferrer">WhatsApp <span aria-hidden="true">↗</span></a></li>
      <li><a href="https://openwebinars.net/@QVN2PXMV/" target="_blank" rel="noreferrer"><span>{{ i18n.t('contact.certs') }}</span>&ngsp;<span aria-hidden="true">↗</span></a></li>
      <li><a href="./cv/alvaro-molina-cv.pdf" download><span>{{ i18n.t('hero.cv') }}</span>&ngsp;<span aria-hidden="true">↓</span></a></li>
    </ul>
  `,
})
export class Contact {
  protected readonly i18n = inject(I18n);
}

@Component({
  selector: 'footer[appFooter]',
  host: { class: 'site-footer' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap footer-inner">
      <p>© {{ year }} Álvaro Rodríguez Molina</p>
      <p>{{ i18n.t('footer.note') }}</p>
    </div>
  `,
})
export class Footer {
  protected readonly i18n = inject(I18n);
  protected readonly year = new Date().getFullYear();
}
