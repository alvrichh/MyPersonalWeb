import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { I18n, type MessageKey } from '../i18n/i18n';
import { Icon } from '../components/icon';

@Component({
  selector: 'section[appHero]',
  imports: [Icon],
  host: { class: 'hero wrap', id: 'top' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hero-copy">
      <p class="status-pill">
        <span class="status-dot" aria-hidden="true"></span>
        <span>{{ i18n.t('hero.status') }}</span>
      </p>

      <h1 class="hero-name">
        <span>Álvaro</span>
        <em>Rodríguez Molina</em>
      </h1>

      <p class="hero-role">{{ i18n.t('hero.kicker') }}</p>

      <p class="hero-location">
        <svg icon="pin"></svg>
        <span>Dublin, Ireland</span>
      </p>

      <div class="hero-actions">
        <a class="button button-primary" href="https://www.linkedin.com/in/alvrich/" target="_blank" rel="noreferrer">
          <svg icon="linkedin"></svg>
          <span>LinkedIn</span>
        </a>
        <a class="button button-ghost" href="#contact">
          <svg icon="mail"></svg>
          <span>{{ i18n.t('hero.contact') }}</span>
        </a>
        <a class="button button-ghost" href="./cv/alvaro-molina-cv.pdf" download>
          <svg icon="download"></svg>
          <span>{{ i18n.t('hero.cv') }}</span>
        </a>
      </div>
    </div>

    <figure class="hero-figure">
      <div class="hero-portrait">
        <img
          src="./images/author-portrait.jpg"
          alt="Álvaro Rodríguez Molina in a black suit and white shirt, arms crossed"
          width="640"
          height="640"
        />
      </div>
    </figure>
  `,
})
export class Hero {
  protected readonly i18n = inject(I18n);
}

const FACTS: [MessageKey, MessageKey][] = [
  ['facts.nowLabel', 'facts.now'],
  ['facts.baseLabel', 'facts.base'],
  ['facts.focusLabel', 'facts.focus'],
  ['facts.langLabel', 'facts.lang'],
];

@Component({
  selector: 'section[appAbout]',
  host: { class: 'section wrap about', id: 'about', 'aria-labelledby': 'about-title' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="about-title" id="about-title">
      <span>{{ i18n.t('hero.titleOne') }}</span>&ngsp;<em>{{ i18n.t('hero.titleTwo') }}</em>&ngsp;<span>{{ i18n.t('hero.titleThree') }}</span>
    </h2>

    <p class="about-lead">{{ i18n.t('hero.lead') }}</p>

    <dl class="hero-facts">
      @for (fact of facts; track fact[0]) {
        <div>
          <dt>{{ i18n.t(fact[0]) }}</dt>
          <dd>{{ i18n.t(fact[1]) }}</dd>
        </div>
      }
    </dl>
  `,
})
export class About {
  protected readonly i18n = inject(I18n);
  protected readonly facts = FACTS;
}

/** Number, title and optional intro at the top of a section. */
@Component({
  selector: 'header[appSectionHead]',
  host: { class: 'section-head' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="section-index">{{ index() }}</p>
    <h2 [id]="headingId()">{{ i18n.t(title()) }}</h2>
    @if (intro(); as intro) {
      <p class="section-intro">{{ i18n.t(intro) }}</p>
    }
  `,
})
export class SectionHead {
  readonly index = input.required<string>();
  readonly headingId = input.required<string>();
  readonly title = input.required<MessageKey>();
  readonly intro = input<MessageKey>();

  protected readonly i18n = inject(I18n);
}
