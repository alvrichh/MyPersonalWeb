import { DOCUMENT, Injectable, afterNextRender, computed, effect, inject, signal } from '@angular/core';
import meta from './languages.json';
import bubble from './bubble.json';
import en from './locales/en.json';
import es from './locales/es.json';
import ga from './locales/ga.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import ru from './locales/ru.json';
import pl from './locales/pl.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';
import and from './locales/and.json';
import { storage } from '../lib/storage';

export type Language = {
  code: string;
  label: string;
  flag: string;
  htmlLang: string;
  locale: string;
  dir?: 'rtl' | 'ltr';
};

export type Accent = (typeof meta.accents)[number];
export type MessageKey = keyof typeof en;

export const LANGUAGES = meta.languages as Language[];
export const ACCENTS = meta.accents as Accent[];
export const BUBBLE_LINES = bubble as Record<string, string[]>;

const LOCALES: Record<string, Partial<Record<string, string>>> = { en, es, ga, fr, de, ru, pl, zh, ar, and };
const ENGLISH = en as Record<string, string>;

// First visit: the browser's language if we have it; afterwards, the saved one.
const detectLanguage = () => {
  const saved = storage.get('lang');
  if (saved && LOCALES[saved]) return saved;
  const browser = (navigator.language || 'en').toLowerCase().split('-')[0];
  return LOCALES[browser] ? browser : 'en';
};

@Injectable({ providedIn: 'root' })
export class I18n {
  // Always render English first (that is what the prerendered HTML holds),
  // then switch after hydration so server and client markup match.
  private readonly code = signal('en');

  readonly lang = computed(() => LANGUAGES.find((item) => item.code === this.code()) ?? LANGUAGES[0]);

  constructor() {
    const document = inject(DOCUMENT);
    afterNextRender(() => this.code.set(detectLanguage()));
    effect(() => {
      const lang = this.lang();
      document.documentElement.lang = lang.htmlLang;
      document.documentElement.dir = lang.dir ?? 'ltr';
    });
  }

  setLang(code: string) {
    if (!LOCALES[code]) return;
    this.code.set(code);
    storage.set('lang', code);
  }

  /** Text for a key in the current language, falling back to English. */
  t(key: MessageKey | (string & {}), values?: Record<string, string | number>) {
    let text = LOCALES[this.code()]?.[key] ?? ENGLISH[key] ?? key;
    if (values) {
      for (const [name, value] of Object.entries(values)) text = text.replace(`{${name}}`, String(value));
    }
    return text;
  }
}
