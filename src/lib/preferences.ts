import { DOCUMENT, Injectable, afterNextRender, inject, signal } from '@angular/core';
import { ACCENTS, type Accent } from '../i18n/i18n';
import { storage } from './storage';

export type Theme = 'light' | 'dark';

// Theme and accent live on <html data-theme / data-accent>. An inline script
// in index.html sets them before first paint; this service keeps Angular in
// step and saves changes.
@Injectable({ providedIn: 'root' })
export class Preferences {
  private readonly root = inject(DOCUMENT).documentElement;

  readonly accent = signal<Accent>('blue');
  readonly theme = signal<Theme>('light');

  constructor() {
    afterNextRender(() => {
      const accent = this.root.dataset['accent'] as Accent | undefined;
      if (accent && ACCENTS.includes(accent)) this.accent.set(accent);
      const saved = this.root.dataset['theme'] as Theme | undefined;
      this.theme.set(saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    });
  }

  setAccent(next: Accent) {
    const value = ACCENTS.includes(next) ? next : 'blue';
    this.root.dataset['accent'] = value;
    storage.set('accent', value);
    this.accent.set(value);
  }

  toggleTheme() {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.root.dataset['theme'] = next;
    storage.set('theme', next);
    this.theme.set(next);
  }
}
