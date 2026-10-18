import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useI18n, type MessageKey } from '../i18n/I18nContext';
import { CalendarIcon, DownloadIcon, GitHubIcon, PinIcon } from '../components/icons';
import { CALENDLY } from '../data/contact';
import { effectFor, effectLife, makeBurst, type FxPiece } from '../components/portraitFx';

// Clicks closer together than this build a combo: each burst in a row throws
// more pieces, further, up to a cap so a frantic clicker can't flood the page.
const COMBO_WINDOW = 1200;
const MAX_COMBO = 8;
const MAX_PIECES = { wide: 500, phone: 360 };
// Phones get no bubble hint (there's no hover), so the portrait wiggles once
// this long after load if nobody has tapped it yet.
const NUDGE_AFTER = 4000;

export function Hero() {
  const { t } = useI18n();
  // Hidden easter egg: a click spins the portrait like a tossed coin and sets
  // off the accent's element (ripples, leaves, fire, sparks, lightning,
  // ghosts, hearts, or confetti under Disco); quick repeat clicks pile on
  // bigger bursts. No pointer cursor or button role on purpose, so it stays a
  // surprise.
  const [spinning, setSpinning] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [fx, setFx] = useState<FxPiece[]>([]);
  const figure = useRef<HTMLElement>(null);
  const tapped = useRef(false);
  const bursts = useRef(0);
  const combo = useRef({ count: 0, last: 0 });

  useEffect(() => {
    if (!window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => {
      const box = figure.current?.getBoundingClientRect();
      const onScreen = box && box.bottom > 0 && box.top < window.innerHeight;
      if (!tapped.current && onScreen) setNudging(true);
    }, NUDGE_AFTER);
    return () => window.clearTimeout(timer);
  }, []);

  const spin = (event: MouseEvent<HTMLElement>) => {
    tapped.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setNudging(false);
    if (!spinning) setSpinning(true);

    const now = performance.now();
    const streak = now - combo.current.last < COMBO_WINDOW ? Math.min(combo.current.count + 1, MAX_COMBO) : 1;
    combo.current = { count: streak, last: now };

    const kind = effectFor(document.documentElement.dataset.accent);
    const burst = ++bursts.current;
    const pieces = makeBurst(kind, burst, streak, event.currentTarget.getBoundingClientRect());
    setFx((current) => [...current, ...pieces].slice(-(window.innerWidth > 760 ? MAX_PIECES.wide : MAX_PIECES.phone)));
    window.setTimeout(() => {
      setFx((current) => current.filter((piece) => piece.burst !== burst));
    }, effectLife(kind));
  };

  return (
    <section className="hero wrap" id="top">
      <div className="hero-copy">
        {/* Hidden for now; uncomment to show "Open to new opportunities" again.
        <p className="status-pill">
          <span className="status-dot" aria-hidden="true" />
          <span>{t('hero.status')}</span>
        </p>
        */}

        <h1 className="hero-name">
          <span>Álvaro</span>
          <em>Rodríguez Molina</em>
        </h1>

        <p className="hero-role">{t('hero.kicker')}</p>

        <p className="hero-location">
          <PinIcon />
          <span>Dublin, Ireland</span>
        </p>

        <div className="hero-actions">
          <a className="button button-primary" href={CALENDLY} target="_blank" rel="noreferrer">
            <CalendarIcon />
            <span>{t('hero.call')}</span>
          </a>
          <a className="button button-ghost" href="https://github.com/alvrichh" target="_blank" rel="noreferrer">
            <GitHubIcon />
            <span>GitHub</span>
          </a>
          <a className="button button-ghost" href="./cv/alvaro-molina-cv.pdf" download>
            <DownloadIcon />
            <span>{t('hero.cv')}</span>
          </a>
        </div>
      </div>

      <figure
        ref={figure}
        className={`hero-figure${spinning ? ' is-spinning' : ''}${nudging ? ' is-nudging' : ''}`}
        onClick={spin}
        onAnimationEnd={(event) => {
          if (event.animationName === 'coin-spin') setSpinning(false);
          if (event.animationName === 'portrait-nudge') setNudging(false);
        }}
      >
        <div className="hero-portrait">
          <img
            src="./images/author-portrait.jpg"
            alt="Álvaro Rodríguez Molina in a black suit and white shirt, arms crossed"
            width={640}
            height={640}
          />
        </div>
        <span className="hero-fx" aria-hidden="true">
          {fx.map((piece) => <i key={piece.id} className={`fx-${piece.kind}`} style={piece.style} />)}
        </span>
      </figure>
    </section>
  );
}

const FACTS: [MessageKey, MessageKey][] = [
  ['facts.nowLabel', 'facts.now'],
  ['facts.baseLabel', 'facts.base'],
  ['facts.focusLabel', 'facts.focus'],
  ['facts.langLabel', 'facts.lang'],
];

export function About() {
  const { t } = useI18n();
  return (
    <section className="section wrap about" id="about" aria-labelledby="about-title">
      <h2 className="about-title" id="about-title">
        <span>{t('hero.titleOne')}</span>{' '}
        <em>{t('hero.titleTwo')}</em>{' '}
        <span>{t('hero.titleThree')}</span>
      </h2>

      <p className="about-lead">{t('hero.lead')}</p>

      <dl className="hero-facts">
        {FACTS.map(([label, value]) => (
          <div key={label}>
            <dt>{t(label)}</dt>
            <dd>{t(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
