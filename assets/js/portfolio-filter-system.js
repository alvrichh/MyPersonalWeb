'use strict';

const portfolioFilterCopy = {
  en: {
    all: 'All',
    ui: 'UI',
    systems: 'Systems',
    automation: 'Automation',
    ai: 'AI',
    quality: 'Quality',
  },
  es: {
    all: 'Todo',
    ui: 'UI',
    systems: 'Sistemas',
    automation: 'Automatización',
    ai: 'IA',
    quality: 'Calidad',
  },
  ga: {
    all: 'Uile',
    ui: 'UI',
    systems: 'Córais',
    automation: 'Uathoibriú',
    ai: 'AI',
    quality: 'Cáilíocht',
  },
  fr: {
    all: 'Tout',
    ui: 'UI',
    systems: 'Systèmes',
    automation: 'Automatisation',
    ai: 'IA',
    quality: 'Qualité',
  },
  de: {
    all: 'Alle',
    ui: 'UI',
    systems: 'Systeme',
    automation: 'Automatisierung',
    ai: 'KI',
    quality: 'Qualität',
  },
  ru: {
    all: 'Все',
    ui: 'UI',
    systems: 'Системы',
    automation: 'Автоматизация',
    ai: 'AI',
    quality: 'Качество',
  },
  pl: {
    all: 'Wszystko',
    ui: 'UI',
    systems: 'Systemy',
    automation: 'Automatyzacja',
    ai: 'AI',
    quality: 'Jakość',
  },
  zh: {
    all: '全部',
    ui: 'UI',
    systems: '系统',
    automation: '自动化',
    ai: 'AI',
    quality: '质量',
  },
  ar: {
    all: 'الكل',
    ui: 'UI',
    systems: 'أنظمة',
    automation: 'أتمتة',
    ai: 'AI',
    quality: 'جودة',
  },
  and: {
    all: 'Tó',
    ui: 'UI',
    systems: 'Sistemah',
    automation: 'Automatización',
    ai: 'IA',
    quality: 'Calidá',
  },
};

const portfolioFilters = ['all', 'ui', 'systems', 'automation', 'ai', 'quality'];
let activePortfolioFilter = 'all';
let portfolioFilterObserver;

const getPortfolioLanguage = () => document.body?.dataset?.language || 'en';
const getPortfolioFilterCopy = () => portfolioFilterCopy[getPortfolioLanguage()] || portfolioFilterCopy.en;

const ensurePortfolioFilterStyles = () => {
  if (document.querySelector('[data-portfolio-filter-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-portfolio-filter-style', 'true');
  style.textContent = `
    #work .filter-row {
      align-items: center;
    }

    #work .filter-chip {
      white-space: nowrap;
    }

    .portfolio-category-tag {
      border-color: rgba(var(--accent-rgb), .28) !important;
      color: var(--accent-strong) !important;
      background: rgba(var(--accent-rgb), .095) !important;
    }

    .project-card.is-hidden,
    .project-card[hidden] {
      display: none !important;
    }

    @media (max-width: 760px) {
      #work .filter-row {
        display: flex;
        flex-wrap: nowrap;
        gap: .5rem;
        overflow-x: auto;
        padding-bottom: .2rem;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      #work .filter-row::-webkit-scrollbar {
        width: 0;
        height: 0;
        display: none;
      }

      #work .filter-chip {
        flex: 0 0 auto;
      }
    }
  `;

  document.head.appendChild(style);
};

const getPortfolioFilterRow = () => document.querySelector('#work .filter-row');
const getPortfolioCards = () => Array.from(document.querySelectorAll('#work .project-card'));

const inferPortfolioCategory = (card) => {
  if (card.matches('[data-ai-card]')) return 'ai';
  if (card.matches('[data-flow-bkd-card]')) return 'systems';
  if (card.matches('[data-planning-project-card]')) return 'automation';

  const techId = card.getAttribute('data-tech-card');
  if (techId === 'react') return 'ui';
  if (techId === 'python') return 'automation';
  if (techId === 'javascript' || techId === 'azure' || techId === 'docker') return 'systems';

  const category = card.getAttribute('data-category');
  if (category === 'performance') return 'quality';
  if (portfolioFilters.includes(category)) return category;

  const text = card.textContent?.toLowerCase() || '';
  if (text.includes('chatgpt') || text.includes('claude') || text.includes('gemini') || text.includes('copilot') || text.includes('mcp')) return 'ai';
  if (text.includes('automation') || text.includes('automatiz')) return 'automation';
  if (text.includes('performance') || text.includes('accessibility') || text.includes('core web vitals')) return 'quality';
  if (text.includes('azure') || text.includes('python') || text.includes('docker') || text.includes('api')) return 'systems';
  return 'ui';
};

const renderPortfolioFilters = () => {
  const row = getPortfolioFilterRow();
  if (!row) return;

  const copy = getPortfolioFilterCopy();
  row.innerHTML = portfolioFilters.map((filter) => `
    <button class="filter-chip ${filter === activePortfolioFilter ? 'is-active' : ''}" type="button" data-filter="${filter}" aria-pressed="${filter === activePortfolioFilter}">${copy[filter]}</button>
  `).join('');
};

const normalizePortfolioCards = () => {
  const copy = getPortfolioFilterCopy();

  getPortfolioCards().forEach((card) => {
    const category = inferPortfolioCategory(card);
    card.setAttribute('data-category', category);
    card.setAttribute('data-portfolio-category', category);

    const tagContainer = card.querySelector('.project-tags');
    if (!tagContainer) return;

    let categoryTag = tagContainer.querySelector('[data-portfolio-category-tag]');
    if (!categoryTag) {
      categoryTag = document.createElement('span');
      categoryTag.className = 'tag portfolio-category-tag';
      categoryTag.setAttribute('data-portfolio-category-tag', 'true');
      tagContainer.prepend(categoryTag);
    }

    categoryTag.textContent = copy[category] || category;
  });
};

const applyPortfolioFilter = (filter = activePortfolioFilter) => {
  activePortfolioFilter = portfolioFilters.includes(filter) ? filter : 'all';

  const row = getPortfolioFilterRow();
  if (row) {
    row.querySelectorAll('[data-filter]').forEach((button) => {
      const isActive = button.getAttribute('data-filter') === activePortfolioFilter;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  getPortfolioCards().forEach((card) => {
    const category = card.getAttribute('data-portfolio-category') || inferPortfolioCategory(card);
    const isVisible = activePortfolioFilter === 'all' || category === activePortfolioFilter;
    card.hidden = !isVisible;
    card.classList.toggle('is-hidden', !isVisible);
  });
};

const refreshPortfolioFilters = () => {
  renderPortfolioFilters();
  normalizePortfolioCards();
  applyPortfolioFilter(activePortfolioFilter);
};

const bindPortfolioFilters = () => {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('#work .filter-chip[data-filter]');
    if (!button) return;

    event.preventDefault();
    refreshPortfolioFilters();
    window.requestAnimationFrame(() => applyPortfolioFilter(button.getAttribute('data-filter')));
  });
};

const observePortfolioGrid = () => {
  const grid = document.querySelector('#work .project-grid');
  if (!grid || portfolioFilterObserver) return;

  portfolioFilterObserver = new MutationObserver(() => {
    window.requestAnimationFrame(refreshPortfolioFilters);
  });

  portfolioFilterObserver.observe(grid, { childList: true, subtree: true });
};

const initPortfolioFilterSystem = () => {
  ensurePortfolioFilterStyles();
  refreshPortfolioFilters();
  bindPortfolioFilters();
  observePortfolioGrid();

  if (document.body) {
    new MutationObserver(refreshPortfolioFilters).observe(document.body, {
      attributes: true,
      attributeFilter: ['data-language'],
    });
  }

  window.setTimeout(refreshPortfolioFilters, 50);
  window.setTimeout(refreshPortfolioFilters, 250);
  window.setTimeout(refreshPortfolioFilters, 800);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPortfolioFilterSystem);
} else {
  initPortfolioFilterSystem();
}
