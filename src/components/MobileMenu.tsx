import { useEffect, useRef, useState } from 'react';
import { ACCENTS, LANGUAGES, useI18n, type Accent, type MessageKey } from '../i18n/I18nContext';
import { CloseIcon, DownloadIcon, MoonIcon, SunIcon } from './icons';
import { NAV } from './Header';

type Props = {
  home: string;
  current: string;
  accent: Accent;
  setAccent: (accent: Accent) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

// On phones the topbar steps aside and a floating button opens a full menu:
// big section tabs, then language, accent and theme.
export function MobileMenu({ home, current, accent, setAccent, theme, toggleTheme }: Props) {
  const { lang, setLang, t } = useI18n();
  const [mounted, setMounted] = useState(false); // in the DOM
  const [open, setOpen] = useState(false); // slid in
  const [control, setControl] = useState<'language' | 'accent' | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const openMenu = () => {
    returnFocus.current = document.activeElement as HTMLElement;
    setMounted(true);
    requestAnimationFrame(() => setOpen(true)); // next frame, so the slide-in runs
  };

  const closeMenu = () => {
    setOpen(false);
    setControl(null);
    window.setTimeout(() => setMounted(false), 220);
    returnFocus.current?.focus?.();
  };

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!mounted) return undefined;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeMenu(); };
    const query = window.matchMedia('(max-width: 760px)');
    const onChange = (event: MediaQueryListEvent) => { if (!event.matches) closeMenu(); };
    document.addEventListener('keydown', onKey);
    query.addEventListener('change', onChange);
    return () => {
      document.removeEventListener('keydown', onKey);
      query.removeEventListener('change', onChange);
    };
  }, [mounted]);

  const toggleControl = (name: 'language' | 'accent') => setControl((value) => (value === name ? null : name));

  return (
    <>
      <button
        className="mobile-menu-trigger"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={t('nav.aria')}
        onClick={() => (mounted ? closeMenu() : openMenu())}
      >
        <span aria-hidden="true" />
      </button>

      <div
        className="mobile-menu-backdrop"
        id="mobile-menu"
        hidden={!mounted}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('[data-menu-close]') || !target.closest('.mobile-menu-panel')) closeMenu();
        }}
      >
        <aside className="mobile-menu-panel" role="dialog" aria-modal="true" aria-label={t('nav.aria')}>
          <header className="mobile-menu-head">
            <a className="brand" href={home || '#top'} data-menu-close>
              <span className="brand-mark" aria-hidden="true"><img src="./images/favicon-192.png" alt="" width={40} height={40} /></span>
              <span className="brand-copy"><strong>alvrich</strong></span>
            </a>
            <button className="mobile-menu-close" type="button" aria-label="×" data-menu-close ref={closeRef}>
              <CloseIcon />
            </button>
          </header>

          <nav className="mobile-menu-nav">
            {NAV.map((item) => (
              <a key={item.id} href={`${home}#${item.id}`} className={current === item.id ? 'is-current' : undefined} data-menu-close>
                {t(item.label)}
              </a>
            ))}
            {/* The "Life" tab from the old site, pointing to the gym page. */}
            <a href="./gym.html">Life</a>
          </nav>

          {/* The one thing a recruiter on a phone is most likely after. */}
          <div className="mobile-menu-cta">
            <a className="button button-primary" href="./cv/alvaro-molina-cv.pdf" download data-menu-close>
              <DownloadIcon />
              <span>{t('hero.cv')}</span>
            </a>
          </div>

          <div className="mobile-menu-controls">
            <div className={`mobile-control${control === 'language' ? ' is-open' : ''}`}>
              <button className="mobile-control-trigger" type="button" aria-expanded={control === 'language'} onClick={() => toggleControl('language')}>
                <span className="mobile-control-label">{t('controls.language')}</span>
                <span className="mobile-control-value">
                  <img className="flag" src={`./images/flag-${lang.flag}.svg`} alt="" width={20} height={14} />
                  <span>{lang.label}</span>
                </span>
              </button>
              <div className="mobile-control-menu" hidden={control !== 'language'}>
                {LANGUAGES.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    className="mobile-control-option"
                    lang={option.htmlLang}
                    aria-pressed={option.code === lang.code}
                    onClick={() => { setLang(option.code); setControl(null); }}
                  >
                    <span>{option.label}</span>
                    <img className="flag" src={`./images/flag-${option.flag}.svg`} alt="" width={20} height={14} />
                  </button>
                ))}
              </div>
            </div>

            <div className={`mobile-control${control === 'accent' ? ' is-open' : ''}`}>
              <button className="mobile-control-trigger" type="button" aria-expanded={control === 'accent'} onClick={() => toggleControl('accent')}>
                <span className="mobile-control-label">{t('controls.accent')}</span>
                <span className="mobile-control-value">
                  <span className="swatch-dot" />
                  <span>{t(`theme.${accent}` as MessageKey)}</span>
                </span>
              </button>
              <div className="mobile-control-menu" hidden={control !== 'accent'}>
                {ACCENTS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="mobile-control-option"
                    aria-pressed={option === accent}
                    onClick={() => { setAccent(option); setControl(null); }}
                  >
                    <span>{t(`theme.${option}` as MessageKey)}</span>
                    <span className="swatch-dot" data-accent={option} />
                  </button>
                ))}
              </div>
            </div>

            <button className="mobile-control-trigger mobile-theme-toggle" type="button" onClick={toggleTheme}>
              <span className="mobile-control-label">{t(theme === 'dark' ? 'controls.toLight' : 'controls.toDark')}</span>
              <span className="mobile-control-value"><SunIcon /><MoonIcon /></span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
