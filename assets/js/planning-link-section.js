'use strict';

const planningCopy = {
  en: {
    tagOne: 'Tool',
    tagTwo: 'Planning',
    title: 'Bubble Planning OS',
    body: 'A soft, visual agenda for daily focus, tasks, weekly planning, and decision-making with a premium bubble interface.',
    primary: 'Open planning',
  },
  es: {
    tagOne: 'Herramienta',
    tagTwo: 'Planning',
    title: 'Bubble Planning OS',
    body: 'Una agenda visual y suave para foco diario, tareas, semana y decisiones con una interfaz premium estilo burbuja.',
    primary: 'Abrir planning',
  },
  ga: {
    tagOne: 'Uirlis',
    tagTwo: 'Pleanáil',
    title: 'Bubble Planning OS',
    body: 'Clár oibre bog, amhairc le haghaidh fócas laethúil, tascanna, pleanáil seachtainiúil agus cinnteoireacht.',
    primary: 'Oscail planning',
  },
  fr: {
    tagOne: 'Outil',
    tagTwo: 'Planning',
    title: 'Bubble Planning OS',
    body: 'Un agenda visuel et doux pour le focus quotidien, les tâches, la semaine et la prise de décision.',
    primary: 'Ouvrir planning',
  },
  de: {
    tagOne: 'Tool',
    tagTwo: 'Planung',
    title: 'Bubble Planning OS',
    body: 'Eine weiche, visuelle Agenda für täglichen Fokus, Aufgaben, Wochenplanung und Entscheidungen.',
    primary: 'Planning öffnen',
  },
  ru: {
    tagOne: 'Инструмент',
    tagTwo: 'Планирование',
    title: 'Bubble Planning OS',
    body: 'Мягкая визуальная agenda для ежедневного фокуса, задач, недельного планирования и принятия решений.',
    primary: 'Открыть planning',
  },
  pl: {
    tagOne: 'Narzędzie',
    tagTwo: 'Planowanie',
    title: 'Bubble Planning OS',
    body: 'Miękka, wizualna agenda do codziennego fokusu, zadań, planowania tygodnia i decyzji.',
    primary: 'Otwórz planning',
  },
  zh: {
    tagOne: '工具',
    tagTwo: '计划',
    title: 'Bubble Planning OS',
    body: '一个柔和的可视化日程工具，用于每日专注、任务、周计划和决策整理。',
    primary: '打开 planning',
  },
  ar: {
    tagOne: 'أداة',
    tagTwo: 'تخطيط',
    title: 'Bubble Planning OS',
    body: 'أجندة مرئية وناعمة للتركيز اليومي، المهام، التخطيط الأسبوعي واتخاذ القرار.',
    primary: 'افتح planning',
  },
  and: {
    tagOne: 'Herramienta',
    tagTwo: 'Planning',
    title: 'Bubble Planning OS',
    body: 'Una agenda vizuá y suave pa foco diario, tareah, semana y decizioneh con una interfaz premium de burbujah.',
    primary: 'Abrí planning',
  },
};

const getPlanningCopy = () => {
  const language = document.body?.dataset?.language || 'en';
  return planningCopy[language] || planningCopy.en;
};

const ensurePlanningStyles = () => {
  if (document.querySelector('[data-planning-section-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-planning-section-style', 'true');
  style.textContent = `
    [data-planning-nav-link],
    [data-planning-showcase],
    [data-projects-dropdown],
    [data-projects-menu] {
      display: none !important;
    }

    .planning-project-card {
      position: relative;
      overflow: hidden;
      border-color: rgba(var(--accent-rgb), .24) !important;
      background:
        radial-gradient(circle at 12% 0%, rgba(var(--accent-rgb), .17), transparent 34%),
        radial-gradient(circle at 92% 10%, rgba(255,123,213,.16), transparent 30%),
        linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.026)),
        rgba(255,255,255,.035);
    }

    .planning-project-card::before,
    .planning-project-card::after {
      content: "";
      position: absolute;
      border-radius: 999px;
      pointer-events: none;
    }

    .planning-project-card::before {
      width: 9rem;
      height: 9rem;
      right: -3rem;
      top: -3rem;
      background: radial-gradient(circle at 32% 24%, rgba(255,255,255,.86), rgba(255,255,255,.22) 35%, rgba(184,137,255,.18) 68%, transparent);
      opacity: .9;
    }

    .planning-project-card::after {
      width: 6.2rem;
      height: 6.2rem;
      left: -2.5rem;
      bottom: -2.5rem;
      background: radial-gradient(circle at 32% 24%, rgba(255,255,255,.78), rgba(255,255,255,.16) 38%, rgba(142,255,207,.16));
      opacity: .8;
    }

    .planning-project-card > * {
      position: relative;
      z-index: 1;
    }

    .planning-project-media {
      min-height: clamp(12rem, 28vw, 17rem);
      display: grid;
      place-items: center;
      border-bottom: 1px solid rgba(255,255,255,.11);
      background:
        radial-gradient(circle at center, rgba(255,255,255,.12) 0 18%, transparent 19% 42%, rgba(184,137,255,.2) 43% 44%, transparent 45% 63%, rgba(142,255,207,.22) 64% 65%, transparent 66%),
        linear-gradient(145deg, rgba(18,12,31,.78), rgba(31,22,48,.42));
    }

    .planning-project-orb {
      width: clamp(7.5rem, 20vw, 10rem);
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      text-align: center;
      border-radius: 999px;
      color: #17131f;
      background: linear-gradient(145deg, rgba(255,255,255,.96), rgba(255,255,255,.58));
      box-shadow: 0 0 0 16px rgba(255,255,255,.08), 0 24px 70px rgba(0,0,0,.24);
    }

    .planning-project-orb span {
      display: block;
      color: #776b86;
      font-size: .68rem;
      font-weight: 950;
      letter-spacing: .12em;
      text-transform: uppercase;
    }

    .planning-project-orb strong {
      display: block;
      margin-top: .15rem;
      font-size: clamp(1.75rem, 5vw, 2.3rem);
      letter-spacing: -.06em;
      line-height: 1;
    }

    .planning-project-card .project-link.primary-planning-link {
      color: var(--accent-text, #07110d);
      background: linear-gradient(135deg, var(--accent), var(--accent-strong));
      border-color: transparent;
      box-shadow: 0 18px 38px rgba(var(--accent-rgb), .16);
    }

    @media (min-width: 860px) {
      .planning-project-card {
        grid-column: span 2;
      }

      .planning-project-card .project-copy {
        display: grid;
        align-content: center;
      }
    }

    @media (max-width: 640px) {
      .planning-project-media {
        min-height: 12rem;
      }
    }
  `;

  document.head.appendChild(style);
};

const removeOldPlanningEntrypoints = () => {
  document.querySelectorAll('[data-planning-nav-link], [data-planning-showcase], [data-projects-dropdown], [data-projects-menu]').forEach((node) => node.remove());
};

const createPlanningPortfolioCard = () => {
  const projectGrid = document.querySelector('#work .project-grid');
  if (!projectGrid || document.querySelector('[data-planning-project-card]')) return;

  const copy = getPlanningCopy();
  const card = document.createElement('article');
  card.className = 'project-card planning-project-card';
  card.setAttribute('data-category', 'systems');
  card.setAttribute('data-planning-project-card', 'true');
  card.innerHTML = `
    <div class="project-media planning-project-media" aria-hidden="true">
      <div class="planning-project-orb">
        <div>
          <span>Bubble</span>
          <strong>OS</strong>
        </div>
      </div>
    </div>
    <div class="project-copy">
      <div class="project-tags">
        <span class="tag" data-planning-copy="tagOne">${copy.tagOne}</span>
        <span class="tag" data-planning-copy="tagTwo">${copy.tagTwo}</span>
      </div>
      <h3 data-planning-copy="title">${copy.title}</h3>
      <p data-planning-copy="body">${copy.body}</p>
      <div class="project-links">
        <a class="project-link has-icon primary-planning-link" href="./planning.html">
          <ion-icon name="sparkles-outline" aria-hidden="true"></ion-icon>
          <span data-planning-copy="primary">${copy.primary}</span>
        </a>
      </div>
    </div>
  `;

  projectGrid.insertAdjacentElement('afterbegin', card);
};

const refreshPlanningCopy = () => {
  const copy = getPlanningCopy();
  document.querySelectorAll('[data-planning-copy]').forEach((node) => {
    const key = node.getAttribute('data-planning-copy');
    if (copy[key]) node.textContent = copy[key];
  });
};

const updatePlanningFilterVisibility = () => {
  const card = document.querySelector('[data-planning-project-card]');
  const activeFilter = document.querySelector('.filter-chip.is-active')?.getAttribute('data-filter') || 'all';
  if (!card) return;

  const shouldShow = activeFilter === 'all' || activeFilter === card.getAttribute('data-category');
  card.hidden = !shouldShow;
};

const observeLanguageChanges = () => {
  if (!document.body) return;

  const observer = new MutationObserver(refreshPlanningCopy);
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-language'] });
};

const bindPlanningFilterSync = () => {
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.filter-chip')) return;
    window.requestAnimationFrame(updatePlanningFilterVisibility);
  });
};

const initPlanningEntryPoints = () => {
  ensurePlanningStyles();
  removeOldPlanningEntrypoints();
  createPlanningPortfolioCard();
  refreshPlanningCopy();
  updatePlanningFilterVisibility();
  observeLanguageChanges();
  bindPlanningFilterSync();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPlanningEntryPoints);
} else {
  initPlanningEntryPoints();
}
