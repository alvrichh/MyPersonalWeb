import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
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

const LOCALES: Record<string, Partial<Record<MessageKey, string>>> = { en, es, ga, fr, de, ru, pl, zh, ar, and };

type I18n = {
  lang: Language;
  setLang: (code: string) => void;
  /** Text for a key in the current language, falling back to English. */
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18n | null>(null);

// First visit: the browser's language if we have it; afterwards, the saved one.
const detectLanguage = () => {
  const saved = storage.get('lang');
  if (saved && LOCALES[saved]) return saved;
  const browser = (navigator.language || 'en').toLowerCase().split('-')[0];
  return LOCALES[browser] ? browser : 'en';
};

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always render English first (that is what the prerendered HTML holds),
  // then switch after hydration so server and client markup match.
  const [code, setCode] = useState('en');

  useEffect(() => {
    setCode(detectLanguage());
  }, []);

  const lang = LANGUAGES.find((item) => item.code === code) ?? LANGUAGES[0];

  useEffect(() => {
    document.documentElement.lang = lang.htmlLang;
    document.documentElement.dir = lang.dir ?? 'ltr';
  }, [lang]);

  const setLang = useCallback((next: string) => {
    if (!LOCALES[next]) return;
    setCode(next);
    storage.set('lang', next);
  }, []);

  const t = useCallback<I18n['t']>((key, values) => {
    let text = LOCALES[code]?.[key] ?? en[key] ?? key;
    if (values) {
      for (const [name, value] of Object.entries(values)) text = text.replace(`{${name}}`, String(value));
    }
    return text;
  }, [code]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>');
  return context;
};
