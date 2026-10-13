import type { ReactNode } from 'react';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { useAccent, useTheme } from './lib/preferences';
import { Header } from './components/Header';
import { ScrollProgress, useReveal } from './components/PageEffects';
import { About, Hero } from './sections/HeroAbout';
import { Skills, Work } from './sections/Work';
import { Experience } from './sections/Experience';
import { Contact, Footer, OffTheClock, RadarPreview } from './sections/Closing';
import { RadarPage } from './sections/RadarPage';

/** Shared frame: progress bar, skip link, header (+ mobile menu), footer. */
function Layout({ home, children }: { home?: string; children: ReactNode }) {
  const { t } = useI18n();
  const [accent, setAccent] = useAccent();
  const [theme, toggleTheme] = useTheme();

  return (
    <>
      <ScrollProgress />
      <a className="skip-link" href="#main">{t('nav.skip')}</a>
      <Header home={home} accent={accent} setAccent={setAccent} theme={theme} toggleTheme={toggleTheme} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}

function HomeContent() {
  useReveal('.section-head, .work-item, .xp-item, .edu, .skills-grid > div, .off-body, .off-card, .contact > *');
  return (
    <Layout>
      <Hero />
      <About />
      <Work />
      <Experience />
      <Skills />
      <RadarPreview />
      <OffTheClock />
      <Contact />
    </Layout>
  );
}

export const HomePage = () => (
  <I18nProvider>
    <HomeContent />
  </I18nProvider>
);

export const AiRadarPage = () => (
  <I18nProvider>
    <Layout home="./index.html">
      <RadarPage />
    </Layout>
  </I18nProvider>
);

export const PAGES = {
  home: HomePage,
  radar: AiRadarPage,
} as const;

export type PageName = keyof typeof PAGES;
