'use strict';

const personalPortfolioHighlights = [
  'Premium UI',
  'Responsive UX',
  'Dynamic Cards',
  'i18n',
  'AI Radar',
  'GitHub Actions',
  'Vercel',
  'Performance'
];

const personalPortfolioOldTags = new Set([
  'html',
  'css',
  'javascript',
  'bootstrap',
  'webpack',
  'performance'
]);

const ensurePersonalPortfolioHighlightStyles = () => {
  if (document.querySelector('[data-personal-portfolio-highlights-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-personal-portfolio-highlights-style', 'true');
  style.textContent = `
    .personal-portfolio-highlights {
      display: flex;
      flex-wrap: wrap;
      gap: .38rem;
      margin-top: .72rem;
    }

    .personal-portfolio-highlights .portfolio-micro-tag,
    .project-card .portfolio-micro-tag {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      border: 1px solid rgba(var(--accent-rgb), .18);
      border-radius: 999px;
      padding: .27rem .48rem;
      color: var(--text-muted);
      background: rgba(255,255,255,.04);
      font-size: .62rem;
      font-weight: 850;
      letter-spacing: .025em;
      line-height: 1;
      white-space: nowrap;
    }

    .project-card[data-personal-portfolio-card="true"] .project-tags .tag:not(.portfolio-category-tag) {
      font-size: .66rem;
      padding: .32rem .52rem;
    }
  `;

  document.head.appendChild(style);
};

const getPersonalPortfolioCard = () => {
  const title = document.querySelector('[data-i18n="work.projectOneTitle"]');
  return title?.closest('.project-card') || null;
};

const buildMicroTagMarkup = () => personalPortfolioHighlights
  .map((tag) => `<span class="portfolio-micro-tag">${tag}</span>`)
  .join('');

const replaceOldDetailTags = (card) => {
  card.querySelectorAll('.tag, .chip, li, span').forEach((node) => {
    const text = node.textContent?.trim().toLowerCase();
    if (!personalPortfolioOldTags.has(text)) return;

    const parentText = node.parentElement?.textContent?.toLowerCase() || '';
    const looksLikeTechList = [...personalPortfolioOldTags].filter((tag) => parentText.includes(tag)).length >= 3;
    if (!looksLikeTechList) return;

    const container = node.parentElement;
    if (!container || container.dataset.personalHighlightsReplaced === 'true') return;

    container.dataset.personalHighlightsReplaced = 'true';
    container.classList.add('personal-portfolio-highlights');
    container.innerHTML = buildMicroTagMarkup();
  });
};

const addHighlightRow = (card) => {
  const copy = card.querySelector('.project-copy');
  if (!copy || copy.querySelector('[data-personal-portfolio-highlights]')) return;

  const links = copy.querySelector('.project-links');
  const row = document.createElement('div');
  row.className = 'personal-portfolio-highlights';
  row.setAttribute('data-personal-portfolio-highlights', 'true');
  row.innerHTML = buildMicroTagMarkup();

  if (links) links.insertAdjacentElement('beforebegin', row);
  else copy.appendChild(row);
};

const refinePersonalPortfolioCard = () => {
  const card = getPersonalPortfolioCard();
  if (!card) return;

  card.setAttribute('data-personal-portfolio-card', 'true');
  addHighlightRow(card);
  replaceOldDetailTags(card);
};

const initPersonalPortfolioHighlights = () => {
  ensurePersonalPortfolioHighlightStyles();
  refinePersonalPortfolioCard();

  const work = document.getElementById('work');
  if (work) {
    new MutationObserver(refinePersonalPortfolioCard).observe(work, {
      childList: true,
      subtree: true,
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPersonalPortfolioHighlights);
} else {
  initPersonalPortfolioHighlights();
}
