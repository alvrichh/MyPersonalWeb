import { useEffect, useRef, useState } from 'react';
import { BUBBLE_LINES, useI18n, type Accent, type MessageKey } from '../i18n/I18nContext';
import { AccentPicker, LanguagePicker } from './Pickers';
import { MoonIcon, SunIcon } from './icons';
import { MobileMenu } from './MobileMenu';

export const NAV: { id: string; label: MessageKey }[] = [
  { id: 'about', label: 'nav.about' },
  { id: 'experience', label: 'nav.experience' },
  { id: 'work', label: 'nav.work' },
  { id: 'skills', label: 'nav.skills' },
  { id: 'education', label: 'nav.education' },
  { id: 'contact', label: 'nav.contact' },
];

type HeaderProps = {
  /** '' on the home page; './index.html' elsewhere, so tabs link back home. */
  home?: string;
  accent: Accent;
  setAccent: (accent: Accent) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

// Hover the little figure and it says something; every hover moves on to the
// next line, and it gets grumpier the more you poke it.
function Brand({ href }: { href: string }) {
  const { lang } = useI18n();
  const [line, setLine] = useState(-1);
  const [talking, setTalking] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const lines = BUBBLE_LINES[lang.code] ?? BUBBLE_LINES.en;
  const talk = () => {
    window.clearTimeout(timer.current);
    setLine((value) => (value + 1) % lines.length);
    // Drop the class for a frame so the pop and the little hop replay even
    // when the bubble is already open.
    setTalking(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setTalking(true)));
  };
  const stop = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTalking(false), 900);
  };

  return (
    <a
      className={`brand${talking ? ' is-talking' : ''}`}
      href={href}
      aria-label="Álvaro Rodríguez Molina, back to top"
      onMouseEnter={talk}
      onMouseLeave={stop}
      onFocus={talk}
      onBlur={stop}
    >
      <span className="brand-mark" aria-hidden="true">
        <img src="./images/favicon-192.png" alt="" width={44} height={44} />
      </span>
      <span className="brand-copy">
        <strong>alvrich</strong>
        <BrandSub />
      </span>
      <span className="brand-bubble" aria-hidden="true">
        {line >= 0 ? lines[line] : ''}
      </span>
    </a>
  );
}

function BrandSub() {
  const { t } = useI18n();
  return <small>{t('brand.sub')}</small>;
}

/** The section currently in the middle of the viewport (home page only). */
function useCurrentSection(enabled: boolean) {
  const [current, setCurrent] = useState('about');

  useEffect(() => {
    if (!enabled || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) setCurrent(entry.target.id === 'top' ? 'about' : entry.target.id);
      }),
      { rootMargin: '-40% 0px -55% 0px' },
    );
    ['top', ...NAV.map((item) => item.id)].forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [enabled]);

  return enabled ? current : '';
}

export function Header({ home = '', accent, setAccent, theme, toggleTheme }: HeaderProps) {
  const { t } = useI18n();
  const current = useCurrentSection(home === '');
  const navRef = useRef<HTMLElement>(null);

  // Keep the active tab visible when the tab row scrolls on small screens.
  useEffect(() => {
    const tab = navRef.current?.querySelector<HTMLElement>('.is-current');
    if (tab) navRef.current?.scrollTo({ left: tab.offsetLeft - 16, behavior: 'smooth' });
  }, [current]);

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <div className="topbar">
            <Brand href={home ? home : '#top'} />

            <nav className="section-nav" aria-label={t('nav.aria')} ref={navRef}>
              {NAV.map((item) => (
                <a
                  key={item.id}
                  className={`nav-tab${current === item.id ? ' is-current' : ''}`}
                  href={`${home}#${item.id}`}
                  aria-current={current === item.id ? 'true' : undefined}
                >
                  {t(item.label)}
                </a>
              ))}
            </nav>

            <div className="topbar-controls">
              <LanguagePicker />
              <AccentPicker accent={accent} setAccent={setAccent} />
              <button
                className="icon-button"
                type="button"
                aria-label={t(theme === 'dark' ? 'controls.toLight' : 'controls.toDark')}
                onClick={toggleTheme}
              >
                <SunIcon />
                <MoonIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu home={home} current={current} accent={accent} setAccent={setAccent} theme={theme} toggleTheme={toggleTheme} />
    </>
  );
}
