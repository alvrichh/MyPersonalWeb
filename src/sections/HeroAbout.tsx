import { useI18n, type MessageKey } from '../i18n/I18nContext';
import { CalendarIcon, DownloadIcon, GitHubIcon, MailIcon, PinIcon } from '../components/icons';
import { CALENDLY } from '../data/contact';

export function Hero() {
  const { t } = useI18n();
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
          <a className="button button-primary" href="https://github.com/alvrichh" target="_blank" rel="noreferrer">
            <GitHubIcon />
            <span>GitHub</span>
          </a>
          <a className="button button-ghost" href={CALENDLY} target="_blank" rel="noreferrer">
            <CalendarIcon />
            <span>{t('hero.call')}</span>
          </a>
          <a className="button button-ghost" href="#contact">
            <MailIcon />
            <span>{t('hero.contact')}</span>
          </a>
          <a className="button button-ghost" href="./cv/alvaro-molina-cv.pdf" download>
            <DownloadIcon />
            <span>{t('hero.cv')}</span>
          </a>
        </div>
      </div>

      <figure className="hero-figure">
        <div className="hero-portrait">
          <img
            src="./images/author-portrait.jpg"
            alt="Álvaro Rodríguez Molina in a black suit and white shirt, arms crossed"
            width={640}
            height={640}
          />
        </div>
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
