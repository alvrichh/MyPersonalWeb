import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, afterRenderEffect, computed, inject, input, signal, viewChild,
} from '@angular/core';
import { BUBBLE_LINES, I18n } from '../i18n/i18n';
import { Preferences } from '../lib/preferences';
import { Icon } from './icon';
import { AccentPicker, LanguagePicker } from './pickers';
import { MobileMenu } from './mobile-menu';
import { NAV } from './nav';

@Component({
  selector: 'app-site-header',
  imports: [Icon, LanguagePicker, AccentPicker, MobileMenu],
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="site-header" [class.is-scrolled]="scrolled()">
      <div class="wrap">
        <div class="topbar">
          <!-- Hover the little figure and it says something; every hover moves
               on to the next line, and it gets grumpier the more you poke it. -->
          <a
            class="brand"
            [class.is-talking]="talking()"
            [href]="home() || '#top'"
            aria-label="Álvaro Rodríguez Molina, back to top"
            (mouseenter)="talk()"
            (mouseleave)="stop()"
            (focus)="talk()"
            (blur)="stop()"
          >
            <span class="brand-mark" aria-hidden="true">
              <img src="./images/favicon-192.png" alt="" width="44" height="44" />
            </span>
            <span class="brand-copy">
              <strong>alvrich</strong>
              <small>{{ i18n.t('brand.sub') }}</small>
            </span>
            <span class="brand-bubble" aria-hidden="true">{{ bubble() }}</span>
          </a>

          <nav class="section-nav" #tabRow [attr.aria-label]="i18n.t('nav.aria')">
            @for (item of nav; track item.id) {
              <a
                class="nav-tab"
                [class.is-current]="current() === item.id"
                [href]="home() + '#' + item.id"
                [attr.aria-current]="current() === item.id ? 'true' : null"
              >{{ i18n.t(item.label) }}</a>
            }
          </nav>

          <div class="topbar-controls">
            <app-language-picker />
            <app-accent-picker />
            <button
              class="icon-button"
              type="button"
              [attr.aria-label]="i18n.t(prefs.theme() === 'dark' ? 'controls.toLight' : 'controls.toDark')"
              (click)="prefs.toggleTheme()"
            >
              <svg icon="sun" class="icon-sun"></svg>
              <svg icon="moon" class="icon-moon"></svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <app-mobile-menu [home]="home()" [current]="current()" />
  `,
})
export class SiteHeader {
  /** '' on the home page; './' elsewhere, so tabs link back home. */
  readonly home = input('');

  protected readonly i18n = inject(I18n);
  protected readonly prefs = inject(Preferences);
  protected readonly nav = NAV;

  protected readonly scrolled = signal(false);
  protected readonly talking = signal(false);
  private readonly line = signal(-1);
  private readonly section = signal('about');
  private readonly navRef = viewChild<ElementRef<HTMLElement>>('tabRow');
  private timer?: ReturnType<typeof setTimeout>;

  private readonly lines = computed(() => BUBBLE_LINES[this.i18n.lang().code] ?? BUBBLE_LINES['en']);
  protected readonly bubble = computed(() => (this.line() >= 0 ? this.lines()[this.line() % this.lines().length] : ''));
  /** The section in the middle of the viewport (home page only). */
  protected readonly current = computed(() => (this.home() === '' ? this.section() : ''));

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const onScroll = () => this.scrolled.set(window.scrollY > 8);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));

      if (this.home() !== '' || !('IntersectionObserver' in window)) return;
      const observer = new IntersectionObserver(
        (entries) => entries.forEach((entry) => {
          if (entry.isIntersecting) this.section.set(entry.target.id === 'top' ? 'about' : entry.target.id);
        }),
        { rootMargin: '-40% 0px -55% 0px' },
      );
      ['top', ...NAV.map((item) => item.id)].forEach((id) => {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
      });
      destroyRef.onDestroy(() => observer.disconnect());
    });

    // Keep the active tab visible when the tab row scrolls on small screens.
    afterRenderEffect(() => {
      this.current();
      const nav = this.navRef()?.nativeElement;
      const tab = nav?.querySelector<HTMLElement>('.is-current');
      if (tab) nav?.scrollTo({ left: tab.offsetLeft - 16, behavior: 'smooth' });
    });
  }

  protected talk() {
    clearTimeout(this.timer);
    this.line.update((value) => (value + 1) % this.lines().length);
    // Drop the class for a frame so the pop and the little hop replay even
    // when the bubble is already open.
    this.talking.set(false);
    requestAnimationFrame(() => requestAnimationFrame(() => this.talking.set(true)));
  }

  protected stop() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.talking.set(false), 900);
  }
}
