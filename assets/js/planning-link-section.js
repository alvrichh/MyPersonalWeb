'use strict';

const planningCopy = {
  en: {
    nav: 'Planning',
    eyebrow: 'New personal tool',
    title: 'Bubble Planning OS',
    body: 'A soft, visual agenda for daily focus, tasks, weekly planning, and decision-making with a premium bubble interface.',
    primary: 'Open planning',
    secondary: 'View live site',
    statOneLabel: 'Mode',
    statOneValue: 'Light / Dark',
    statTwoLabel: 'Focus',
    statTwoValue: 'Daily cockpit',
    statThreeLabel: 'Storage',
    statThreeValue: 'Local',
  },
  es: {
    nav: 'Planning',
    eyebrow: 'Nueva herramienta personal',
    title: 'Bubble Planning OS',
    body: 'Una agenda visual y suave para foco diario, tareas, semana y decisiones con una interfaz premium estilo burbuja.',
    primary: 'Abrir planning',
    secondary: 'Ver web live',
    statOneLabel: 'Modo',
    statOneValue: 'Claro / Oscuro',
    statTwoLabel: 'Foco',
    statTwoValue: 'Cockpit diario',
    statThreeLabel: 'Datos',
    statThreeValue: 'Local',
  },
  and: {
    nav: 'Planning',
    eyebrow: 'Nueva herramienta personá',
    title: 'Bubble Planning OS',
    body: 'Una agenda vizuá y suave pa foco diario, tareah, semana y decizioneh con una interfaz premium de burbujah.',
    primary: 'Abrí planning',
    secondary: 'Vé la web live',
    statOneLabel: 'Modo',
    statOneValue: 'Claro / Oscuro',
    statTwoLabel: 'Foco',
    statTwoValue: 'Cockpit diario',
    statThreeLabel: 'Dato',
    statThreeValue: 'Local',
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
    .planning-showcase {
      position: relative;
      overflow: hidden;
      display: grid;
      gap: 1.2rem;
      margin: clamp(1.2rem, 4vw, 2rem) 0 0;
      padding: clamp(1.15rem, 4vw, 1.7rem);
      border: 1px solid rgba(255, 255, 255, .14);
      border-radius: clamp(1.65rem, 5vw, 2.35rem);
      background:
        radial-gradient(circle at 9% 14%, rgba(186, 255, 213, .3), transparent 30%),
        radial-gradient(circle at 92% 4%, rgba(184, 137, 255, .38), transparent 31%),
        linear-gradient(135deg, rgba(255,255,255,.095), rgba(255,255,255,.036));
      box-shadow: 0 28px 90px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.08);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
    }

    .planning-showcase::before,
    .planning-showcase::after {
      content: "";
      position: absolute;
      border-radius: 999px;
      pointer-events: none;
    }

    .planning-showcase::before {
      width: clamp(8.2rem, 30vw, 14rem);
      height: clamp(8.2rem, 30vw, 14rem);
      right: clamp(-3rem, -5vw, -1rem);
      top: clamp(-2rem, -4vw, -.6rem);
      background: radial-gradient(circle at 32% 25%, rgba(255,255,255,.9), rgba(255,255,255,.28) 34%, rgba(184,137,255,.2) 68%, rgba(184,137,255,.04));
      box-shadow: inset 0 1px 1px rgba(255,255,255,.68), 0 30px 90px rgba(184,137,255,.2);
      opacity: .92;
    }

    .planning-showcase::after {
      width: clamp(5.8rem, 18vw, 8.8rem);
      height: clamp(5.8rem, 18vw, 8.8rem);
      left: clamp(-2.6rem, -4vw, -1.2rem);
      bottom: -2.8rem;
      background: radial-gradient(circle at 35% 25%, rgba(255,255,255,.82), rgba(255,255,255,.18) 38%, rgba(102,240,178,.18));
      opacity: .85;
    }

    .planning-showcase-main,
    .planning-showcase-visual {
      position: relative;
      z-index: 1;
    }

    .planning-showcase-main {
      display: grid;
      gap: 1rem;
      align-content: center;
    }

    .planning-showcase-kicker {
      margin: 0;
      color: var(--accent, #70e1a1);
      font-size: .74rem;
      font-weight: 900;
      letter-spacing: .16em;
      text-transform: uppercase;
    }

    .planning-showcase h3 {
      margin: 0;
      max-width: 9ch;
      font-size: clamp(2.35rem, 9vw, 5rem);
      line-height: .82;
      letter-spacing: -.075em;
    }

    .planning-gradient-text {
      background: linear-gradient(125deg, #fff 0%, #d7c3ff 38%, #ff7bd5 60%, #8effcf 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .planning-showcase p:not(.planning-showcase-kicker) {
      margin: 0;
      max-width: 56ch;
      color: var(--text-muted, rgba(255,255,255,.72));
      line-height: 1.55;
      font-size: clamp(.98rem, 2.4vw, 1.08rem);
    }

    .planning-showcase-actions {
      display: flex;
      flex-wrap: wrap;
      gap: .72rem;
      margin-top: .2rem;
    }

    .planning-showcase .planning-action {
      min-height: 3.15rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: .45rem;
      border-radius: 999px;
      padding: 0 1rem;
      text-decoration: none;
      font-weight: 900;
      border: 1px solid rgba(255,255,255,.14);
      transition: transform .18s ease, filter .18s ease, border-color .18s ease;
    }

    .planning-showcase .planning-action.primary {
      color: #160f22;
      background: linear-gradient(135deg, #d7c3ff, #ff7bd5 46%, #8effcf);
      border-color: transparent;
      box-shadow: 0 22px 54px rgba(184,137,255,.2);
    }

    .planning-showcase .planning-action.secondary {
      color: var(--text, #fff);
      background: rgba(255,255,255,.055);
    }

    .planning-showcase .planning-action:hover,
    .planning-showcase .planning-action:focus-visible {
      transform: translateY(-2px);
      filter: brightness(1.04);
    }

    .planning-showcase-visual {
      min-height: 15rem;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 2rem;
      background:
        radial-gradient(circle at center, rgba(255,255,255,.12) 0 18%, transparent 19% 42%, rgba(184,137,255,.16) 43% 44%, transparent 45% 63%, rgba(142,255,207,.2) 64% 65%, transparent 66%),
        linear-gradient(145deg, rgba(18, 12, 31, .72), rgba(31, 22, 48, .4));
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
    }

    .planning-showcase-core {
      width: clamp(7.4rem, 28vw, 10rem);
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      text-align: center;
      border-radius: 999px;
      background: linear-gradient(145deg, rgba(255,255,255,.94), rgba(255,255,255,.56));
      color: #17131f;
      box-shadow: 0 0 0 16px rgba(255,255,255,.075), 0 24px 70px rgba(0,0,0,.22);
    }

    .planning-showcase-core span {
      display: block;
      color: #776b86;
      font-size: .68rem;
      font-weight: 900;
      letter-spacing: .12em;
      text-transform: uppercase;
    }

    .planning-showcase-core strong {
      display: block;
      margin-top: .18rem;
      font-size: clamp(1.65rem, 6vw, 2.2rem);
      line-height: 1;
      letter-spacing: -.06em;
    }

    .planning-stats {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: .65rem;
    }

    .planning-stat {
      min-width: 0;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 1.25rem;
      padding: .8rem;
      background: rgba(255,255,255,.055);
    }

    .planning-stat span {
      display: block;
      color: var(--text-muted, rgba(255,255,255,.62));
      font-size: .68rem;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .planning-stat strong {
      display: block;
      margin-top: .25rem;
      color: var(--text, #fff);
      font-size: clamp(.94rem, 2.6vw, 1.08rem);
      line-height: 1.05;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .planning-nav-link {
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    @media (min-width: 860px) {
      .planning-showcase {
        grid-template-columns: minmax(0, 1.05fr) minmax(320px, .95fr);
        align-items: center;
        padding: clamp(1.4rem, 3vw, 2rem);
      }

      .planning-showcase-visual {
        min-height: 21rem;
      }

      .planning-showcase h3 {
        font-size: clamp(3.7rem, 6.2vw, 5.9rem);
      }
    }

    @media (max-width: 640px) {
      .planning-showcase {
        margin-top: 1rem;
      }

      .planning-showcase-actions {
        display: grid;
        grid-template-columns: 1fr;
      }

      .planning-stats {
        grid-template-columns: 1fr;
      }

      .planning-showcase-visual {
        min-height: 12.5rem;
      }
    }
  `;

  document.head.appendChild(style);
};

const createPlanningShowcase = () => {
  const aboutPanel = document.querySelector('#about');
  if (!aboutPanel || document.querySelector('[data-planning-showcase]')) return;

  const copy = getPlanningCopy();
  const section = document.createElement('section');
  section.className = 'planning-showcase';
  section.setAttribute('data-planning-showcase', 'true');
  section.innerHTML = `
    <div class="planning-showcase-main">
      <p class="planning-showcase-kicker" data-planning-copy="eyebrow">${copy.eyebrow}</p>
      <h3><span class="planning-gradient-text" data-planning-copy="title">${copy.title}</span></h3>
      <p data-planning-copy="body">${copy.body}</p>
      <div class="planning-showcase-actions">
        <a class="planning-action primary" href="./planning.html">
          <ion-icon name="sparkles-outline" aria-hidden="true"></ion-icon>
          <span data-planning-copy="primary">${copy.primary}</span>
        </a>
        <a class="planning-action secondary" href="https://alvrich.vercel.app" target="_blank" rel="noreferrer">
          <ion-icon name="open-outline" aria-hidden="true"></ion-icon>
          <span data-planning-copy="secondary">${copy.secondary}</span>
        </a>
      </div>
    </div>
    <div class="planning-showcase-visual" aria-hidden="true">
      <div class="planning-showcase-core">
        <div>
          <span>Bubble</span>
          <strong>OS</strong>
        </div>
      </div>
    </div>
    <div class="planning-stats">
      <div class="planning-stat">
        <span data-planning-copy="statOneLabel">${copy.statOneLabel}</span>
        <strong data-planning-copy="statOneValue">${copy.statOneValue}</strong>
      </div>
      <div class="planning-stat">
        <span data-planning-copy="statTwoLabel">${copy.statTwoLabel}</span>
        <strong data-planning-copy="statTwoValue">${copy.statTwoValue}</strong>
      </div>
      <div class="planning-stat">
        <span data-planning-copy="statThreeLabel">${copy.statThreeLabel}</span>
        <strong data-planning-copy="statThreeValue">${copy.statThreeValue}</strong>
      </div>
    </div>
  `;

  const introGrid = aboutPanel.querySelector('.intro-grid');
  if (introGrid) {
    introGrid.insertAdjacentElement('afterend', section);
  } else {
    aboutPanel.appendChild(section);
  }
};

const createPlanningNavShortcut = () => {
  const sectionNav = document.querySelector('.section-nav');
  if (!sectionNav || document.querySelector('[data-planning-nav-link]')) return;

  const copy = getPlanningCopy();
  const link = document.createElement('a');
  link.className = 'nav-tab planning-nav-link';
  link.href = './planning.html';
  link.setAttribute('data-planning-nav-link', 'true');
  link.setAttribute('data-planning-copy', 'nav');
  link.textContent = copy.nav;
  sectionNav.appendChild(link);
};

const refreshPlanningCopy = () => {
  const copy = getPlanningCopy();
  document.querySelectorAll('[data-planning-copy]').forEach((node) => {
    const key = node.getAttribute('data-planning-copy');
    if (copy[key]) node.textContent = copy[key];
  });
};

const observeLanguageChanges = () => {
  if (!document.body) return;

  const observer = new MutationObserver(refreshPlanningCopy);
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-language'] });
};

const initPlanningEntryPoints = () => {
  ensurePlanningStyles();
  createPlanningShowcase();
  createPlanningNavShortcut();
  refreshPlanningCopy();
  observeLanguageChanges();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPlanningEntryPoints);
} else {
  initPlanningEntryPoints();
}
