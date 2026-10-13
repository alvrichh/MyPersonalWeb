import { useCallback, useEffect, useState } from 'react';
import { ACCENTS, type Accent } from '../i18n/I18nContext';
import { storage } from './storage';

// Theme and accent live on <html data-theme / data-accent>. An inline script
// in each page's <head> sets them before first paint; these hooks keep React
// in step and save changes.

const root = () => document.documentElement;

export function useAccent() {
  const [accent, setAccentState] = useState<Accent>('blue');

  useEffect(() => {
    const current = root().dataset.accent as Accent | undefined;
    if (current && ACCENTS.includes(current)) setAccentState(current);
  }, []);

  const setAccent = useCallback((next: Accent) => {
    const value = ACCENTS.includes(next) ? next : 'blue';
    root().dataset.accent = value;
    storage.set('accent', value);
    setAccentState(value);
  }, []);

  return [accent, setAccent] as const;
}

type Theme = 'light' | 'dark';

const systemTheme = (): Theme => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const saved = root().dataset.theme as Theme | undefined;
    setThemeState(saved ?? systemTheme());
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      root().dataset.theme = next;
      storage.set('theme', next);
      return next;
    });
  }, []);

  return [theme, toggleTheme] as const;
}
