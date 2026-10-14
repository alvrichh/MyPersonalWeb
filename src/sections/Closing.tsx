import { useI18n, type MessageKey } from '../i18n/I18nContext';
import { decodeEntities, useRadar } from '../lib/radar';
import { formatDay } from '../lib/format';
import { CalendarIcon, OffIcon, type OFF_ICONS } from '../components/icons';
import { CALENDLY } from '../data/contact';
import { SectionHead } from './Work';

const RADAR_PREVIEW = 5;

/** Home: the five newest radar stories and a link to the full page. */
export function RadarPreview() {
  const { t, lang } = useI18n();
  const radar = useRadar();
  const items = radar?.items.slice(0, RADAR_PREVIEW) ?? [];

  return (
    <section className="section wrap" id="radar" aria-labelledby="radar-title">
      <header className="section-head">
        <p className="section-index">05</p>
        <h2 id="radar-title">{t('radar.title')}</h2>
        <p className="section-intro">
          <span>{t('radar.intro')}</span>{' '}
          <span className="radar-updated">{radar?.date ? `${t('radar.updated')} ${formatDay(radar.date, lang.locale)}` : ''}</span>
        </p>
      </header>

      <ul className="radar-list">
        {radar === undefined && <li className="radar-empty">{t('radar.loading')}</li>}
        {radar !== undefined && !items.length && <li className="radar-empty">{t('radar.empty')}</li>}
        {items.map((item) => (
          <li key={item.url}>
            <span className="radar-date">{formatDay(item.date, lang.locale)}</span>
            <a href={item.url} target="_blank" rel="noreferrer">{decodeEntities(item.title)}</a>
            <span className="radar-source">{item.source}</span>
          </li>
        ))}
      </ul>

      <a className="radar-see-all" href="./ai-radar.html">
        <span>{t('radar.seeAll')}</span>
        <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}

type OffCard = {
  icon: keyof typeof OFF_ICONS;
  title: MessageKey;
  text: MessageKey;
  chips: (MessageKey | string)[];
  href: string;
  link: MessageKey;
  arrow: string;
  wide?: boolean;
};

const OFF_CARDS: OffCard[] = [
  { icon: 'barbell', title: 'off.gymTitle', text: 'off.gymText', chips: ['off.gymC1', 'off.gymC2', 'off.gymC3'], href: './gym.html', link: 'off.gymLink', arrow: '↗' },
  { icon: 'calendar', title: 'off.planTitle', text: 'off.planText', chips: ['off.planC1', 'off.planC2', 'Eisenhower'], href: './planning.html', link: 'off.planLink', arrow: '↗' },
  { icon: 'sparkles', title: 'off.aiTitle', text: 'off.aiText', chips: ['off.aiC1', 'LLMs', 'Dev tools'], href: '#radar', link: 'off.aiLink', arrow: '↘' },
  { icon: 'calendarMonth', title: 'off.calTitle', text: 'off.calText', chips: ['off.calC1', 'off.calC2', 'off.calC3', 'off.calC4'], href: './calendar.html', link: 'off.calLink', arrow: '↗', wide: true },
];

export function OffTheClock() {
  const { t } = useI18n();
  // Chips are message keys when they contain a dot ("off.gymC1"), literals otherwise.
  const chip = (value: string) => (value.startsWith('off.') ? t(value as MessageKey) : value);

  return (
    <section className="section wrap off" id="off" aria-labelledby="off-title">
      <SectionHead index="06" id="off-title" title="off.title" />

      <div className="off-body">
        <figure className="off-photo">
          <img src="./images/giralda.png" alt="La Giralda in Seville at sunset" width={419} height={366} loading="lazy" />
          <figcaption>{t('off.caption')}</figcaption>
        </figure>

        <div className="off-copy">
          <p className="off-route">
            <span>{t('off.from')}</span>
            <span className="off-route-line" aria-hidden="true" />
            <span>{t('off.to')}</span>
          </p>
          <p className="off-lead">{t('off.lead')}</p>
          <p className="off-note">{t('off.note')}</p>
        </div>
      </div>

      <ul className="off-cards">
        {OFF_CARDS.map((card) => (
          <li className={`off-card${card.wide ? ' off-card-wide' : ''}`} key={card.title}>
            <OffIcon name={card.icon} className="off-card-mark" />
            <div className="off-card-head">
              <span className="off-card-icon" aria-hidden="true"><OffIcon name={card.icon} /></span>
              <h3>{t(card.title)}</h3>
            </div>
            <p>{t(card.text)}</p>
            <ul className="off-chips">
              {card.chips.map((value) => <li key={value}>{chip(value)}</li>)}
            </ul>
            <a className="off-card-link" href={card.href}><span>{t(card.link)}</span> <span aria-hidden="true">{card.arrow}</span></a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Contact() {
  const { t } = useI18n();
  return (
    <section className="contact wrap" id="contact" aria-labelledby="contact-title">
      <p className="section-index">07</p>
      <h2 id="contact-title" className="contact-title">
        <span>{t('contact.titleOne')}</span>
        <em>{t('contact.titleTwo')}</em>
      </h2>
      <p className="contact-lead">{t('contact.lead')}</p>

      <a className="contact-mail" href="mailto:alvrodmol@gmail.com">alvrodmol@gmail.com</a>

      <a className="button button-primary contact-call" href={CALENDLY} target="_blank" rel="noreferrer">
        <CalendarIcon />
        <span>{t('contact.call')}</span>
        <span aria-hidden="true">↗</span>
      </a>

      <ul className="contact-links">
        <li><a href="https://www.linkedin.com/in/alvrich/" target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a></li>
        <li><a href="https://github.com/alvrichh" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a></li>
        <li><a href="https://wa.link/41utbj" target="_blank" rel="noreferrer">WhatsApp <span aria-hidden="true">↗</span></a></li>
        <li><a href="https://openwebinars.net/@QVN2PXMV/" target="_blank" rel="noreferrer"><span>{t('contact.certs')}</span> <span aria-hidden="true">↗</span></a></li>
        <li><a href="./cv/alvaro-molina-cv.pdf" download><span>{t('hero.cv')}</span> <span aria-hidden="true">↓</span></a></li>
      </ul>
    </section>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <p>© <span suppressHydrationWarning>{new Date().getFullYear()}</span> Álvaro Rodríguez Molina</p>
        <p>{t('footer.note')}</p>
      </div>
    </footer>
  );
}
