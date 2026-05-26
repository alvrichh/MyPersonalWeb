'use strict';

const techCardsCopy = {
  en: {
    reactTitle: 'React interface layer',
    reactBody: 'Reusable component thinking, state-driven UI, routing patterns, and modern front-end structure ready for richer apps.',
    reactTagOne: 'React',
    reactTagTwo: 'Frontend',
    jsTitle: 'JavaScript systems and Webpack',
    jsBody: 'Clean browser logic, modular scripts, build flow, responsive behavior, UI states, and progressive enhancement.',
    jsTagOne: 'JavaScript',
    jsTagTwo: 'Webpack',
    azureTitle: 'Azure, auth and APIs',
    azureBody: 'Microsoft ecosystem direction: authentication, Graph-style integrations, connected data flows, and automation-friendly architecture.',
    azureTagOne: 'Azure',
    azureTagTwo: 'APIs',
    pythonTitle: 'Python automation backend',
    pythonBody: 'Scripts, data extraction, API orchestration, backend utilities, and process automation for real operational work.',
    pythonTagOne: 'Python',
    pythonTagTwo: 'Automation',
    dockerTitle: 'Docker and deployment base',
    dockerBody: 'Container-ready thinking, local-to-cloud setup, Render/Vercel workflows, and clean structure for future production delivery.',
    dockerTagOne: 'Docker',
    dockerTagTwo: 'Deploy',
    action: 'Stack proof',
  },
  es: {
    reactTitle: 'Capa de interfaz en React',
    reactBody: 'Pensamiento por componentes reutilizables, UI basada en estado, patrones de routing y estructura moderna para apps más completas.',
    reactTagOne: 'React',
    reactTagTwo: 'Frontend',
    jsTitle: 'Sistemas JavaScript y Webpack',
    jsBody: 'Lógica limpia en navegador, scripts modulares, flujo de build, responsive, estados de UI y mejora progresiva.',
    jsTagOne: 'JavaScript',
    jsTagTwo: 'Webpack',
    azureTitle: 'Azure, auth y APIs',
    azureBody: 'Dirección Microsoft: autenticación, integraciones tipo Graph, flujos de datos conectados y arquitectura preparada para automatización.',
    azureTagOne: 'Azure',
    azureTagTwo: 'APIs',
    pythonTitle: 'Backend y automatización Python',
    pythonBody: 'Scripts, extracción de datos, orquestación de APIs, utilidades backend y automatización de procesos reales.',
    pythonTagOne: 'Python',
    pythonTagTwo: 'Automatización',
    dockerTitle: 'Docker y base de despliegue',
    dockerBody: 'Mentalidad container-ready, setup local-to-cloud, flujos Render/Vercel y estructura limpia para producción futura.',
    dockerTagOne: 'Docker',
    dockerTagTwo: 'Deploy',
    action: 'Stack proof',
  },
  ga: {
    reactTitle: 'Ciseal comhéadain React',
    reactBody: 'Smaointeoireacht comhpháirteanna, UI bunaithe ar staid, routing agus struchtúr nua-aimseartha do apps níos saibhre.',
    reactTagOne: 'React',
    reactTagTwo: 'Frontend',
    jsTitle: 'JavaScript agus Webpack',
    jsBody: 'Loighic bhrabhsálaí ghlan, scripteanna modúlacha, build flow, responsive agus stáit UI.',
    jsTagOne: 'JavaScript',
    jsTagTwo: 'Webpack',
    azureTitle: 'Azure, auth agus APIs',
    azureBody: 'Treo Microsoft: fíordheimhniú, comhtháthuithe, sreafaí sonraí ceangailte agus ailtireacht uathoibrithe.',
    azureTagOne: 'Azure',
    azureTagTwo: 'APIs',
    pythonTitle: 'Python backend automation',
    pythonBody: 'Scripteanna, eastóscadh sonraí, API orchestration agus uathoibriú próiseas.',
    pythonTagOne: 'Python',
    pythonTagTwo: 'Automation',
    dockerTitle: 'Docker agus deployment',
    dockerBody: 'Smaointeoireacht container-ready, local-to-cloud agus struchtúr glan le haghaidh táirgeadh.',
    dockerTagOne: 'Docker',
    dockerTagTwo: 'Deploy',
    action: 'Stack proof',
  },
  fr: {
    reactTitle: 'Couche interface React',
    reactBody: 'Composants réutilisables, UI pilotée par l’état, routing et structure front-end moderne pour des apps plus riches.',
    reactTagOne: 'React',
    reactTagTwo: 'Frontend',
    jsTitle: 'Systèmes JavaScript et Webpack',
    jsBody: 'Logique navigateur propre, scripts modulaires, build flow, responsive, états UI et amélioration progressive.',
    jsTagOne: 'JavaScript',
    jsTagTwo: 'Webpack',
    azureTitle: 'Azure, auth et APIs',
    azureBody: 'Direction Microsoft: authentification, intégrations, flux de données connectés et architecture prête pour l’automatisation.',
    azureTagOne: 'Azure',
    azureTagTwo: 'APIs',
    pythonTitle: 'Backend automation Python',
    pythonBody: 'Scripts, extraction de données, orchestration d’APIs, utilitaires backend et automatisation de processus.',
    pythonTagOne: 'Python',
    pythonTagTwo: 'Automatisation',
    dockerTitle: 'Docker et base de déploiement',
    dockerBody: 'Approche container-ready, local-to-cloud, workflows Render/Vercel et structure propre pour la production.',
    dockerTagOne: 'Docker',
    dockerTagTwo: 'Deploy',
    action: 'Stack proof',
  },
  de: {
    reactTitle: 'React Interface Layer',
    reactBody: 'Wiederverwendbare Komponenten, state-driven UI, Routing-Muster und moderne Frontend-Struktur.',
    reactTagOne: 'React',
    reactTagTwo: 'Frontend',
    jsTitle: 'JavaScript Systeme und Webpack',
    jsBody: 'Saubere Browser-Logik, modulare Skripte, Build Flow, Responsive-Verhalten, UI-States und Progressive Enhancement.',
    jsTagOne: 'JavaScript',
    jsTagTwo: 'Webpack',
    azureTitle: 'Azure, Auth und APIs',
    azureBody: 'Microsoft-Richtung: Authentifizierung, Integrationen, verbundene Datenflüsse und automatisierungsfreundliche Architektur.',
    azureTagOne: 'Azure',
    azureTagTwo: 'APIs',
    pythonTitle: 'Python Automation Backend',
    pythonBody: 'Skripte, Datenextraktion, API-Orchestrierung, Backend Utilities und Prozessautomatisierung.',
    pythonTagOne: 'Python',
    pythonTagTwo: 'Automation',
    dockerTitle: 'Docker und Deployment-Basis',
    dockerBody: 'Container-ready Denken, local-to-cloud Setup, Render/Vercel Workflows und saubere Struktur.',
    dockerTagOne: 'Docker',
    dockerTagTwo: 'Deploy',
    action: 'Stack proof',
  },
  ru: {
    reactTitle: 'Интерфейсный слой React',
    reactBody: 'Компонентный подход, UI на основе состояния, routing и современная frontend-структура.',
    reactTagOne: 'React',
    reactTagTwo: 'Frontend',
    jsTitle: 'JavaScript и Webpack',
    jsBody: 'Чистая браузерная логика, модульные скрипты, build flow, responsive, UI states и progressive enhancement.',
    jsTagOne: 'JavaScript',
    jsTagTwo: 'Webpack',
    azureTitle: 'Azure, auth и APIs',
    azureBody: 'Направление Microsoft: аутентификация, интеграции, связанные потоки данных и архитектура для автоматизации.',
    azureTagOne: 'Azure',
    azureTagTwo: 'APIs',
    pythonTitle: 'Python automation backend',
    pythonBody: 'Скрипты, извлечение данных, orchestration APIs, backend utilities и автоматизация процессов.',
    pythonTagOne: 'Python',
    pythonTagTwo: 'Automation',
    dockerTitle: 'Docker и deployment base',
    dockerBody: 'Container-ready подход, local-to-cloud setup, Render/Vercel workflows и чистая структура.',
    dockerTagOne: 'Docker',
    dockerTagTwo: 'Deploy',
    action: 'Stack proof',
  },
  pl: {
    reactTitle: 'Warstwa interfejsu React',
    reactBody: 'Komponenty wielokrotnego użytku, UI oparte na stanie, routing i nowoczesna struktura front-end.',
    reactTagOne: 'React',
    reactTagTwo: 'Frontend',
    jsTitle: 'Systemy JavaScript i Webpack',
    jsBody: 'Czysta logika przeglądarkowa, modułowe skrypty, build flow, responsive, stany UI i progressive enhancement.',
    jsTagOne: 'JavaScript',
    jsTagTwo: 'Webpack',
    azureTitle: 'Azure, auth i APIs',
    azureBody: 'Kierunek Microsoft: uwierzytelnianie, integracje, przepływy danych i architektura gotowa pod automatyzację.',
    azureTagOne: 'Azure',
    azureTagTwo: 'APIs',
    pythonTitle: 'Backend automatyzacji Python',
    pythonBody: 'Skrypty, ekstrakcja danych, orkiestracja API, utilities backendowe i automatyzacja procesów.',
    pythonTagOne: 'Python',
    pythonTagTwo: 'Automatyzacja',
    dockerTitle: 'Docker i baza deploymentu',
    dockerBody: 'Podejście container-ready, local-to-cloud, Render/Vercel workflows i czysta struktura.',
    dockerTagOne: 'Docker',
    dockerTagTwo: 'Deploy',
    action: 'Stack proof',
  },
  zh: {
    reactTitle: 'React 界面层',
    reactBody: '组件化思维、状态驱动 UI、路由模式，以及面向更完整应用的现代前端结构。',
    reactTagOne: 'React',
    reactTagTwo: 'Frontend',
    jsTitle: 'JavaScript 与 Webpack',
    jsBody: '清晰的浏览器逻辑、模块化脚本、构建流程、响应式行为、UI 状态和渐进增强。',
    jsTagOne: 'JavaScript',
    jsTagTwo: 'Webpack',
    azureTitle: 'Azure、认证与 APIs',
    azureBody: 'Microsoft 方向：认证、Graph 类集成、连接数据流，以及适合自动化的架构。',
    azureTagOne: 'Azure',
    azureTagTwo: 'APIs',
    pythonTitle: 'Python 自动化后端',
    pythonBody: '脚本、数据提取、API 编排、后端工具和真实流程自动化。',
    pythonTagOne: 'Python',
    pythonTagTwo: 'Automation',
    dockerTitle: 'Docker 与部署基础',
    dockerBody: '容器化思维、本地到云端设置、Render/Vercel 流程和清晰的生产结构。',
    dockerTagOne: 'Docker',
    dockerTagTwo: 'Deploy',
    action: 'Stack proof',
  },
  ar: {
    reactTitle: 'طبقة واجهة React',
    reactBody: 'تفكير بالمكونات، واجهة مبنية على الحالة، routing، وبنية front-end حديثة لتطبيقات أكثر غنى.',
    reactTagOne: 'React',
    reactTagTwo: 'Frontend',
    jsTitle: 'JavaScript و Webpack',
    jsBody: 'منطق متصفح نظيف، سكربتات modular، build flow، responsive، حالات UI وتحسين تدريجي.',
    jsTagOne: 'JavaScript',
    jsTagTwo: 'Webpack',
    azureTitle: 'Azure و auth و APIs',
    azureBody: 'اتجاه Microsoft: مصادقة، تكاملات، تدفقات بيانات متصلة وبنية مناسبة للأتمتة.',
    azureTagOne: 'Azure',
    azureTagTwo: 'APIs',
    pythonTitle: 'Python automation backend',
    pythonBody: 'سكربتات، استخراج بيانات، orchestration للـ APIs، أدوات backend وأتمتة عمليات.',
    pythonTagOne: 'Python',
    pythonTagTwo: 'Automation',
    dockerTitle: 'Docker وقاعدة النشر',
    dockerBody: 'تفكير container-ready، إعداد local-to-cloud، Render/Vercel workflows وبنية نظيفة.',
    dockerTagOne: 'Docker',
    dockerTagTwo: 'Deploy',
    action: 'Stack proof',
  },
  and: {
    reactTitle: 'Capa de interfaz en React',
    reactBody: 'Componentes reutilizableh, UI con estado, routing y estructura moderna pa apps má completa, zabe.',
    reactTagOne: 'React',
    reactTagTwo: 'Frontend',
    jsTitle: 'JavaScript y Webpack',
    jsBody: 'Lógica limpia, scripts modulareh, build, responsive, estados de UI y mejora progresiva.',
    jsTagOne: 'JavaScript',
    jsTagTwo: 'Webpack',
    azureTitle: 'Azure, auth y APIs',
    azureBody: 'Dirección Microsoft: autenticación, integrazioneh tipo Graph, datoh conectao y arquitectura pa automatizar.',
    azureTagOne: 'Azure',
    azureTagTwo: 'APIs',
    pythonTitle: 'Backend Python y automatización',
    pythonBody: 'Scripts, sacar datoh, orquestar APIs, utilidadeh backend y automatizar procesoh realeh.',
    pythonTagOne: 'Python',
    pythonTagTwo: 'Automatización',
    dockerTitle: 'Docker y despliegue',
    dockerBody: 'Mentalidad container-ready, local-to-cloud, Render/Vercel y estructura limpia pa producción.',
    dockerTagOne: 'Docker',
    dockerTagTwo: 'Deploy',
    action: 'Stack proof',
  },
};

const techCardDefinitions = [
  {
    id: 'react',
    category: 'ui',
    icon: 'logo-react',
    glow: 'react',
    imageSrc: './images/react-blog.png',
    titleKey: 'reactTitle',
    bodyKey: 'reactBody',
    tagOneKey: 'reactTagOne',
    tagTwoKey: 'reactTagTwo',
  },
  {
    id: 'javascript',
    category: 'systems',
    icon: 'code-slash-outline',
    glow: 'js',
    imageSrc: './images/javascript-blog.png',
    titleKey: 'jsTitle',
    bodyKey: 'jsBody',
    tagOneKey: 'jsTagOne',
    tagTwoKey: 'jsTagTwo',
  },
  {
    id: 'azure',
    category: 'systems',
    icon: 'cloud-outline',
    glow: 'azure',
    imageSrc: './images/azure-blog.jpeg',
    titleKey: 'azureTitle',
    bodyKey: 'azureBody',
    tagOneKey: 'azureTagOne',
    tagTwoKey: 'azureTagTwo',
  },
  {
    id: 'python',
    category: 'systems',
    icon: 'terminal-outline',
    glow: 'python',
    imageSrc: './images/python-blog.png',
    titleKey: 'pythonTitle',
    bodyKey: 'pythonBody',
    tagOneKey: 'pythonTagOne',
    tagTwoKey: 'pythonTagTwo',
  },
  {
    id: 'docker',
    category: 'performance',
    icon: 'cube-outline',
    glow: 'docker',
    imageSrc: './images/docker-blog.jpeg',
    titleKey: 'dockerTitle',
    bodyKey: 'dockerBody',
    tagOneKey: 'dockerTagOne',
    tagTwoKey: 'dockerTagTwo',
  },
];

const getTechCardCopy = () => {
  const language = document.body?.dataset?.language || 'en';
  return techCardsCopy[language] || techCardsCopy.en;
};

const ensureTechCardStyles = () => {
  if (document.querySelector('[data-tech-card-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-tech-card-style', 'true');
  style.textContent = `
    .portfolio-tech-card {
      position: relative;
      overflow: hidden;
      min-height: 100%;
    }

    .portfolio-tech-card::before {
      content: "";
      position: absolute;
      inset: auto -3rem -4rem auto;
      width: 12rem;
      height: 12rem;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(var(--accent-rgb), .18), transparent 62%);
      pointer-events: none;
      opacity: .9;
    }

    .portfolio-tech-card::after {
      content: "";
      position: absolute;
      inset: -3rem auto auto -3rem;
      width: 8rem;
      height: 8rem;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(var(--secondary-rgb), .12), transparent 64%);
      pointer-events: none;
    }

    .portfolio-tech-card > * {
      position: relative;
      z-index: 1;
    }

    .portfolio-tech-media {
      min-height: clamp(10rem, 24vw, 14rem);
      display: grid;
      place-items: center;
      border-bottom: 1px solid rgba(255,255,255,.1);
      background:
        radial-gradient(circle at 50% 50%, rgba(var(--accent-rgb), .18) 0 18%, transparent 19% 44%, rgba(var(--secondary-rgb), .16) 45% 46%, transparent 47%),
        linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.025));
    }

    .portfolio-tech-media.has-photo {
      display: block;
      min-height: 0;
      background: linear-gradient(145deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
    }

    .portfolio-tech-media.has-photo img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      object-position: center;
    }

    .portfolio-tech-orb {
      width: clamp(5.8rem, 16vw, 7.8rem);
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      border-radius: 999px;
      background:
        linear-gradient(145deg, rgba(var(--accent-rgb), .28), rgba(var(--secondary-rgb), .16)),
        rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.14);
      box-shadow: 0 0 0 14px rgba(255,255,255,.04), 0 22px 55px rgba(0,0,0,.24);
      color: var(--accent-strong);
      font-size: clamp(2.4rem, 6vw, 3.3rem);
    }

    .portfolio-tech-card[data-tech-glow="react"] .portfolio-tech-orb {
      color: #8ee7ff;
    }

    .portfolio-tech-card[data-tech-glow="azure"] .portfolio-tech-orb {
      color: #74b7ff;
    }

    .portfolio-tech-card[data-tech-glow="python"] .portfolio-tech-orb {
      color: #ffd66f;
    }

    .portfolio-tech-card[data-tech-glow="docker"] .portfolio-tech-orb {
      color: #7db8ff;
    }

    .portfolio-tech-card .project-link.tech-proof-link {
      pointer-events: none;
      opacity: .88;
    }
  `;

  document.head.appendChild(style);
};

const escapeTechHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const buildTechCard = (definition, copy) => {
  const card = document.createElement('article');
  card.className = 'project-card portfolio-tech-card';
  card.setAttribute('data-category', definition.category);
  card.setAttribute('data-tech-card', definition.id);
  card.setAttribute('data-tech-glow', definition.glow);
  card.innerHTML = `
    <div class="project-media portfolio-tech-media has-photo" aria-hidden="true">
      <img src="${escapeTechHtml(definition.imageSrc)}" alt="" loading="lazy" decoding="async">
    </div>
    <div class="project-copy">
      <div class="project-tags">
        <span class="tag" data-tech-copy="${definition.tagOneKey}">${escapeTechHtml(copy[definition.tagOneKey])}</span>
        <span class="tag" data-tech-copy="${definition.tagTwoKey}">${escapeTechHtml(copy[definition.tagTwoKey])}</span>
      </div>
      <h3 data-tech-copy="${definition.titleKey}">${escapeTechHtml(copy[definition.titleKey])}</h3>
      <p data-tech-copy="${definition.bodyKey}">${escapeTechHtml(copy[definition.bodyKey])}</p>
      <div class="project-links">
        <span class="project-link muted tech-proof-link" data-tech-copy="action">${escapeTechHtml(copy.action)}</span>
      </div>
    </div>
  `;
  return card;
};

const insertTechCards = () => {
  const projectGrid = document.querySelector('#work .project-grid');
  if (!projectGrid || document.querySelector('[data-tech-card]')) return;

  const copy = getTechCardCopy();
  const planningCard = projectGrid.querySelector('[data-planning-project-card]');
  let insertAfter = planningCard || projectGrid.firstElementChild;

  techCardDefinitions.forEach((definition) => {
    const card = buildTechCard(definition, copy);
    if (insertAfter) {
      insertAfter.insertAdjacentElement('afterend', card);
    } else {
      projectGrid.appendChild(card);
    }
    insertAfter = card;
  });
};

const refreshTechCardsCopy = () => {
  const copy = getTechCardCopy();
  document.querySelectorAll('[data-tech-copy]').forEach((node) => {
    const key = node.getAttribute('data-tech-copy');
    if (copy[key]) node.textContent = copy[key];
  });
};

const syncTechCardsFilter = () => {
  const activeFilter = document.querySelector('.filter-chip.is-active')?.getAttribute('data-filter') || 'all';
  document.querySelectorAll('[data-tech-card]').forEach((card) => {
    const shouldShow = activeFilter === 'all' || activeFilter === card.getAttribute('data-category');
    card.hidden = !shouldShow;
  });
};

const bindTechCardsFilter = () => {
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.filter-chip')) return;
    window.requestAnimationFrame(syncTechCardsFilter);
  });
};

const observeTechCardsLanguage = () => {
  if (!document.body) return;
  const observer = new MutationObserver(refreshTechCardsCopy);
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-language'] });
};

const initPortfolioTechCards = () => {
  ensureTechCardStyles();
  insertTechCards();
  refreshTechCardsCopy();
  syncTechCardsFilter();
  bindTechCardsFilter();
  observeTechCardsLanguage();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPortfolioTechCards);
} else {
  initPortfolioTechCards();
}
