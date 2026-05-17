'use strict';

const getRadarSourceCopy = () => {
  const language = document.body?.dataset?.language || 'en';
  if (language === 'es') return 'Leer fuente';
  if (language === 'and') return 'Leé fuente';
  return 'Read source';
};

const polishAiRadarSourceLinks = () => {
  const section = document.querySelector('[data-ai-radar-section]');
  if (!section) return;

  section.querySelectorAll('.ai-radar-item a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const item = link.closest('.ai-radar-item');
    const sourceText = item?.querySelector('.ai-radar-item-meta span')?.textContent?.toLowerCase() || '';

    if (!/^https?:\/\//i.test(href) || href.includes('alvrich.vercel.app') || sourceText.includes('portfolio radar')) {
      link.remove();
      return;
    }

    const label = link.querySelector('span');
    if (label) label.textContent = getRadarSourceCopy();
    link.setAttribute('aria-label', getRadarSourceCopy());
  });
};

const initAiRadarLinkPolish = () => {
  polishAiRadarSourceLinks();

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-ai-radar-filter], [data-ai-radar-toggle]')) {
      window.requestAnimationFrame(polishAiRadarSourceLinks);
    }
  });

  if (document.body) {
    new MutationObserver(polishAiRadarSourceLinks).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-language'],
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAiRadarLinkPolish);
} else {
  initAiRadarLinkPolish();
}
