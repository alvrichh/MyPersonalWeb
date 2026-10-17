import { useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { useI18n, type MessageKey } from '../i18n/I18nContext';
import { CalendarIcon, DownloadIcon, GitHubIcon, PinIcon } from '../components/icons';
import { CALENDLY } from '../data/contact';

type Confetti = { id: number; burst: number; style: CSSProperties };

// Clicks closer together than this build a combo: each burst in a row throws
// more pieces, further, up to a cap so a frantic clicker can't flood the page.
const COMBO_WINDOW = 1200;
const MAX_COMBO = 8;
const MAX_PIECES = { wide: 500, phone: 360 };
const CONFETTI_LIFE = 2100;

let nextPiece = 0;

// One burst: pieces leave the ring in every direction, each with its own
// distance, spin, shape and colour slot (or hue, under the Disco accent).
// On wide screens there are more pieces and they fly further (both up to
// twice as many/far) and may leave the window; on phones, sideways travel eases off before the screen edge on each
// side (a soft limit, so pieces don't stack up in a line) so they never scroll.
const makeConfetti = (burst: number, combo: number, figure: DOMRect): Confetti[] => {
  const wide = window.innerWidth > 760;
  const screen = wide ? Math.min(2, window.innerWidth / 640) : 1;
  const count = Math.round((28 + (combo - 1) * 10) * screen);
  const reach = (1 + (combo - 1) * 0.12) * screen;
  const ring = figure.width * 0.44;
  const centre = figure.left + figure.width / 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = ((i + Math.random() * 0.6) / count) * Math.PI * 2;
    const distance = (80 + Math.random() * 100) * reach;
    const x0 = Math.cos(angle) * ring;
    const room = (x0 < 0 ? centre : window.innerWidth - centre) - 12;
    const maxDx = Math.max(1, room / 1.1 - Math.abs(x0));
    const dx = wide
      ? Math.cos(angle) * distance
      : Math.sign(x0) * maxDx * Math.tanh(Math.abs(Math.cos(angle) * distance) / maxDx);
    return {
      id: nextPiece++,
      burst,
      style: {
        ['--x0' as string]: `${x0}px`,
        ['--y0' as string]: `${Math.sin(angle) * ring}px`,
        ['--dx' as string]: `${dx}px`,
        ['--dy' as string]: `${Math.sin(angle) * distance}px`,
        ['--turn' as string]: `${(Math.random() - 0.5) * 900}deg`,
        ['--piece-hue' as string]: Math.round(Math.random() * 360),
        ['--delay' as string]: `${Math.random() * 60}ms`,
      },
    };
  });
};

export function Hero() {
  const { t } = useI18n();
  // Hidden easter egg: a click spins the portrait like a tossed coin and
  // throws accent-coloured confetti off the ring; quick repeat clicks pile on
  // bigger bursts. No pointer cursor or button role on purpose, so it stays a
  // surprise.
  const [spinning, setSpinning] = useState(false);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const bursts = useRef(0);
  const combo = useRef({ count: 0, last: 0 });
  const spin = (event: MouseEvent<HTMLElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!spinning) setSpinning(true);

    const now = performance.now();
    const streak = now - combo.current.last < COMBO_WINDOW ? Math.min(combo.current.count + 1, MAX_COMBO) : 1;
    combo.current = { count: streak, last: now };

    const burst = ++bursts.current;
    const pieces = makeConfetti(burst, streak, event.currentTarget.getBoundingClientRect());
    setConfetti((current) => [...current, ...pieces].slice(-(window.innerWidth > 760 ? MAX_PIECES.wide : MAX_PIECES.phone)));
    window.setTimeout(() => {
      setConfetti((current) => current.filter((piece) => piece.burst !== burst));
    }, CONFETTI_LIFE);
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
        className={spinning ? 'hero-figure is-spinning' : 'hero-figure'}
        onClick={spin}
        onAnimationEnd={(event) => {
          if (event.animationName === 'coin-spin') setSpinning(false);
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
        <span className="hero-confetti" aria-hidden="true">
          {confetti.map((piece) => <i key={piece.id} style={piece.style} />)}
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
