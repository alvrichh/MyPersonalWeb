import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { ACCENTS, I18n, LANGUAGES, type Accent } from '../i18n/i18n';
import { Preferences } from '../lib/preferences';
import { Icon } from './icon';
import { NAV } from './nav';

// On phones the topbar steps aside and a floating button opens a full menu:
// big section tabs, then language, accent and theme.
@Component({
  selector: 'app-mobile-menu',
  imports: [Icon],
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="mobile-menu-trigger"
      type="button"
      [attr.aria-expanded]="open()"
      aria-controls="mobile-menu"
      [attr.aria-label]="i18n.t('nav.aria')"
      (click)="mounted() ? closeMenu() : openMenu()"
    >
      <span aria-hidden="true"></span>
    </button>

    <div class="mobile-menu-backdrop" id="mobile-menu" [hidden]="!mounted()" (click)="onBackdropClick($event)">
      <aside class="mobile-menu-panel" role="dialog" aria-modal="true" [attr.aria-label]="i18n.t('nav.aria')">
        <header class="mobile-menu-head">
          <a class="brand" [href]="home() || '#top'" data-menu-close>
            <span class="brand-mark" aria-hidden="true"><img src="./images/favicon-192.png" alt="" width="40" height="40" /></span>
            <span class="brand-copy"><strong>alvrich</strong></span>
          </a>
          <button class="mobile-menu-close" type="button" aria-label="×" data-menu-close #closeButton>
            <svg icon="close"></svg>
          </button>
        </header>

        <nav class="mobile-menu-nav">
          @for (item of nav; track item.id) {
            <a [href]="home() + '#' + item.id" [class.is-current]="current() === item.id" data-menu-close>{{ i18n.t(item.label) }}</a>
          }
          <!-- The "Life" tab from the old site, pointing to the gym page. -->
          <a href="./gym.html">Life</a>
        </nav>

        <div class="mobile-menu-controls">
          <div class="mobile-control" [class.is-open]="control() === 'language'">
            <button class="mobile-control-trigger" type="button" [attr.aria-expanded]="control() === 'language'" (click)="toggleControl('language')">
              <span class="mobile-control-label">{{ i18n.t('controls.language') }}</span>
              <span class="mobile-control-value">
                <img class="flag" [src]="'./images/flag-' + i18n.lang().flag + '.svg'" alt="" width="20" height="14" />
                <span>{{ i18n.lang().label }}</span>
              </span>
            </button>
            <div class="mobile-control-menu" [hidden]="control() !== 'language'">
              @for (option of languages; track option.code) {
                <button
                  type="button"
                  class="mobile-control-option"
                  [attr.lang]="option.htmlLang"
                  [attr.aria-pressed]="option.code === i18n.lang().code"
                  (click)="i18n.setLang(option.code); control.set(null)"
                >
                  <span>{{ option.label }}</span>
                  <img class="flag" [src]="'./images/flag-' + option.flag + '.svg'" alt="" width="20" height="14" />
                </button>
              }
            </div>
          </div>

          <div class="mobile-control" [class.is-open]="control() === 'accent'">
            <button class="mobile-control-trigger" type="button" [attr.aria-expanded]="control() === 'accent'" (click)="toggleControl('accent')">
              <span class="mobile-control-label">{{ i18n.t('controls.accent') }}</span>
              <span class="mobile-control-value">
                <span class="swatch-dot"></span>
                <span>{{ i18n.t('theme.' + prefs.accent()) }}</span>
              </span>
            </button>
            <div class="mobile-control-menu" [hidden]="control() !== 'accent'">
              @for (option of accents; track option) {
                <button
                  type="button"
                  class="mobile-control-option"
                  [attr.aria-pressed]="option === prefs.accent()"
                  (click)="chooseAccent(option)"
                >
                  <span>{{ i18n.t('theme.' + option) }}</span>
                  <span class="swatch-dot" [attr.data-accent]="option"></span>
                </button>
              }
            </div>
          </div>

          <button class="mobile-control-trigger mobile-theme-toggle" type="button" (click)="prefs.toggleTheme()">
            <span class="mobile-control-label">{{ i18n.t(prefs.theme() === 'dark' ? 'controls.toLight' : 'controls.toDark') }}</span>
            <span class="mobile-control-value"><svg icon="sun" class="icon-sun"></svg><svg icon="moon" class="icon-moon"></svg></span>
          </button>
        </div>
      </aside>
    </div>
  `,
})
export class MobileMenu {
  readonly home = input('');
  readonly current = input('');

  protected readonly i18n = inject(I18n);
  protected readonly prefs = inject(Preferences);
  protected readonly nav = NAV;
  protected readonly languages = LANGUAGES;
  protected readonly accents = ACCENTS;

  protected readonly mounted = signal(false); // in the layout
  protected readonly open = signal(false); // slid in
  protected readonly control = signal<'language' | 'accent' | null>(null);
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private returnFocus: HTMLElement | null = null;
  private removeListeners?: () => void;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.removeListeners?.());
  }

  protected openMenu() {
    this.returnFocus = document.activeElement as HTMLElement;
    this.mounted.set(true);
    // Next frame, so the slide-in transition runs.
    requestAnimationFrame(() => {
      this.open.set(true);
      document.body.classList.add('mobile-menu-open');
      document.body.style.overflow = 'hidden';
      this.closeButton()?.nativeElement.focus();
    });

    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') this.closeMenu(); };
    const query = window.matchMedia('(max-width: 760px)');
    const onChange = (event: MediaQueryListEvent) => { if (!event.matches) this.closeMenu(); };
    document.addEventListener('keydown', onKey);
    query.addEventListener('change', onChange);
    this.removeListeners = () => {
      document.removeEventListener('keydown', onKey);
      query.removeEventListener('change', onChange);
    };
  }

  protected closeMenu() {
    this.open.set(false);
    this.control.set(null);
    document.body.classList.remove('mobile-menu-open');
    document.body.style.overflow = '';
    this.removeListeners?.();
    this.removeListeners = undefined;
    setTimeout(() => this.mounted.set(false), 220);
    this.returnFocus?.focus?.();
  }

  protected onBackdropClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('[data-menu-close]') || !target.closest('.mobile-menu-panel')) this.closeMenu();
  }

  protected toggleControl(name: 'language' | 'accent') {
    this.control.update((value) => (value === name ? null : name));
  }

  protected chooseAccent(accent: Accent) {
    this.prefs.setAccent(accent);
    this.control.set(null);
  }
}
