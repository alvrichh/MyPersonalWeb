import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, input, viewChild,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { I18n } from '../i18n/i18n';
import { SiteHeader } from '../components/header';
import { About, Hero } from '../sections/hero-about';
import { Skills, Work } from '../sections/work';
import { Experience } from '../sections/experience';
import { Contact, Footer, OffTheClock, RadarPreview } from '../sections/closing';
import { RadarPage } from '../sections/radar-page';

/** Shared frame: progress bar, skip link, header (+ mobile menu), footer. */
@Component({
  selector: 'app-layout',
  imports: [SiteHeader, Footer],
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- A thin bar pinned to the top of the viewport that fills as you scroll. -->
    <div class="scroll-progress" aria-hidden="true" #progress></div>
    <a class="skip-link" href="#main">{{ i18n.t('nav.skip') }}</a>
    <app-site-header [home]="home()" />
    <main id="main"><ng-content /></main>
    <footer appFooter></footer>
  `,
})
export class Layout {
  readonly home = input('');
  protected readonly i18n = inject(I18n);
  private readonly progress = viewChild.required<ElementRef<HTMLElement>>('progress');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const bar = this.progress().nativeElement;
      let frame = 0;
      const update = () => {
        frame = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      };
      const onScroll = () => { frame ||= requestAnimationFrame(update); };
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', update);
      destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', update);
        cancelAnimationFrame(frame);
      });
    });
  }
}

/** Title and description for the page, in the prerendered HTML too. */
function setHead(title: string, description: string) {
  inject(Title).setTitle(title);
  const meta = inject(Meta);
  meta.updateTag({ name: 'description', content: description });
  meta.updateTag({ property: 'og:title', content: title });
}

/**
 * Fade blocks in as they scroll into view. Runs after hydration, so content is
 * fully visible without JavaScript.
 */
function revealOnScroll(selector: string) {
  const destroyRef = inject(DestroyRef);
  afterNextRender(() => {
    document.documentElement.classList.add('js');
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    document.querySelectorAll(selector).forEach((element) => {
      if (element.classList.contains('is-visible')) return;
      element.classList.add('reveal');
      observer.observe(element);
    });
    destroyRef.onDestroy(() => observer.disconnect());
  });
}

@Component({
  selector: 'app-home-page',
  imports: [Layout, Hero, About, Work, Experience, Skills, RadarPreview, OffTheClock, Contact],
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-layout>
      <section appHero></section>
      <section appAbout></section>
      <section appWork></section>
      <section appExperience></section>
      <section appSkills></section>
      <section appRadarPreview></section>
      <section appOffTheClock></section>
      <section appContact></section>
    </app-layout>
  `,
})
export class HomePage {
  constructor() {
    setHead(
      'Álvaro Rodríguez Molina · Software Engineer',
      'Álvaro Rodríguez Molina, software engineer working across full-stack development, integrations, automation, SAP and AI. Seville-born, based in Ireland.',
    );
    revealOnScroll('.section-head, .work-item, .xp-item, .edu, .skills-grid > div, .off-body, .off-card, .contact > *');
  }
}

@Component({
  selector: 'app-ai-radar-page',
  imports: [Layout, RadarPage],
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-layout home="./">
      <section appRadarPage></section>
    </app-layout>
  `,
})
export class AiRadarPage {
  constructor() {
    setHead(
      'AI Radar · Álvaro Rodríguez Molina',
      'Every AI and developer-tooling story collected each morning by an automated radar on Álvaro Rodríguez Molina’s portfolio.',
    );
  }
}
