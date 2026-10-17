import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import meta from './languages.json';
import bubble from './bubble.json';
import en from './locales/en.json';
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

type Messages = Partial<Record<MessageKey, string>>;

// English ships in the bundle (it is what the prerendered HTML holds and the
// fallback for any missing key); every other language is its own small chunk,
// fetched only when someone picks it.
const LOADERS = import.meta.glob<Messages>(['./locales/*.json', '!./locales/en.json'], { import: 'default' });
const loaderFor = (code: string) => LOADERS[`./locales/${code}.json`];
const isKnown = (code: string) => code === 'en' || Boolean(loaderFor(code));

const loaded: Record<string, Messages> = { en };
const loadMessages = async (code: string) => {
  if (!loaded[code]) loaded[code] = await loaderFor(code)();
  return loaded[code];
};

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
  if (saved && isKnown(saved)) return saved;
  const browser = (navigator.language || 'en').toLowerCase().split('-')[0];
  return isKnown(browser) ? browser : 'en';
};

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always render English first (that is what the prerendered HTML holds),
  // then switch after hydration so server and client markup match.
  // The language only switches once its messages are in, so the page never
  // shows a half-translated state while a chunk downloads.
  const [code, setCode] = useState('en');
  const wanted = useRef('en');

  const switchTo = useCallback((next: string) => {
    wanted.current = next;
    // Two quick picks: whichever was chosen last wins, not whichever loads last.
    loadMessages(next).then(() => {
      if (wanted.current === next) setCode(next);
    }, () => {});
  }, []);

  useEffect(() => {
    switchTo(detectLanguage());
  }, [switchTo]);

  const lang = LANGUAGES.find((item) => item.code === code) ?? LANGUAGES[0];

  useEffect(() => {
    document.documentElement.lang = lang.htmlLang;
    document.documentElement.dir = lang.dir ?? 'ltr';
  }, [lang]);

  const setLang = useCallback((next: string) => {
    if (!isKnown(next)) return;
    storage.set('lang', next);
    switchTo(next);
  }, [switchTo]);

  const t = useCallback<I18n['t']>((key, values) => {
    let text = loaded[code]?.[key] ?? en[key] ?? key;
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
