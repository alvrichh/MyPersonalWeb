'use strict';

const flowBkdCopy = {
  en: {
    tagOne: 'Enterprise',
    tagTwo: 'Operations',
    title: 'Fusion Flow BKD',
    body: 'Private customs operations platform work: Flask portal, Azure SQL, Microsoft Graph ingestion, Docker/Render deployment, background workers, and TSS API workflows.',
    action: 'Private enterprise case',
    metricOne: 'Flask',
    metricTwo: 'Azure SQL',
    metricThree: 'Graph + TSS APIs',
  },
  es: {
    tagOne: 'Enterprise',
    tagTwo: 'Operaciones',
    title: 'Fusion Flow BKD',
    body: 'Trabajo real en plataforma privada de operaciones aduaneras: portal Flask, Azure SQL, ingesta con Microsoft Graph, despliegue Docker/Render, workers y flujos con TSS API.',
    action: 'Caso enterprise privado',
    metricOne: 'Flask',
    metricTwo: 'Azure SQL',
    metricThree: 'Graph + TSS APIs',
  },
  ga: {
    tagOne: 'Enterprise',
    tagTwo: 'Oibríochtaí',
    title: 'Fusion Flow BKD',
    body: 'Obair ar ardán príobháideach oibríochtaí custaim: Flask, Azure SQL, Microsoft Graph ingestion, Docker/Render, workers agus TSS API workflows.',
    action: 'Cás enterprise príobháideach',
    metricOne: 'Flask',
    metricTwo: 'Azure SQL',
    metricThree: 'Graph + TSS APIs',
  },
  fr: {
    tagOne: 'Enterprise',
    tagTwo: 'Opérations',
    title: 'Fusion Flow BKD',
    body: 'Travail réel sur une plateforme privée d’opérations douanières: portail Flask, Azure SQL, ingestion Microsoft Graph, déploiement Docker/Render, workers et workflows TSS API.',
    action: 'Cas enterprise privé',
    metricOne: 'Flask',
    metricTwo: 'Azure SQL',
    metricThree: 'Graph + TSS APIs',
  },
  de: {
    tagOne: 'Enterprise',
    tagTwo: 'Operations',
    title: 'Fusion Flow BKD',
    body: 'Arbeit an einer privaten Zolloperations-Plattform: Flask Portal, Azure SQL, Microsoft Graph Ingestion, Docker/Render Deployment, Background Workers und TSS API Workflows.',
    action: 'Privater Enterprise Case',
    metricOne: 'Flask',
    metricTwo: 'Azure SQL',
    metricThree: 'Graph + TSS APIs',
  },
  ru: {
    tagOne: 'Enterprise',
    tagTwo: 'Операции',
    title: 'Fusion Flow BKD',
    body: 'Работа над приватной платформой customs operations: Flask portal, Azure SQL, Microsoft Graph ingestion, Docker/Render deployment, workers и TSS API workflows.',
    action: 'Приватный enterprise кейс',
    metricOne: 'Flask',
    metricTwo: 'Azure SQL',
    metricThree: 'Graph + TSS APIs',
  },
  pl: {
    tagOne: 'Enterprise',
    tagTwo: 'Operacje',
    title: 'Fusion Flow BKD',
    body: 'Praca nad prywatną platformą operacji celnych: portal Flask, Azure SQL, Microsoft Graph ingestion, Docker/Render deployment, workery i TSS API workflows.',
    action: 'Prywatny case enterprise',
    metricOne: 'Flask',
    metricTwo: 'Azure SQL',
    metricThree: 'Graph + TSS APIs',
  },
  zh: {
    tagOne: '企业级',
    tagTwo: '运营系统',
    title: 'Fusion Flow BKD',
    body: '私有海关运营平台项目：Flask portal、Azure SQL、Microsoft Graph ingestion、Docker/Render 部署、后台 workers 与 TSS API workflows。',
    action: '私有企业案例',
    metricOne: 'Flask',
    metricTwo: 'Azure SQL',
    metricThree: 'Graph + TSS APIs',
  },
  ar: {
    tagOne: 'Enterprise',
    tagTwo: 'عمليات',
    title: 'Fusion Flow BKD',
    body: 'عمل حقيقي على منصة خاصة لعمليات الجمارك: Flask portal، Azure SQL، Microsoft Graph ingestion، Docker/Render، workers و TSS API workflows.',
    action: 'حالة enterprise خاصة',
    metricOne: 'Flask',
    metricTwo: 'Azure SQL',
    metricThree: 'Graph + TSS APIs',
  },
  and: {
    tagOne: 'Enterprise',
    tagTwo: 'Operacioneh',
    title: 'Fusion Flow BKD',
    body: 'Trabajo real en una plataforma privada de operacioneh aduanera: portal Flask, Azure SQL, ingesta con Microsoft Graph, Docker/Render, workers y TSS API.',
    action: 'Caso enterprise privao',
    metricOne: 'Flask',
    metricTwo: 'Azure SQL',
    metricThree: 'Graph + TSS APIs',
  },
};

const getFlowBkdCopy = () => {
  const language = document.body?.dataset?.language || 'en';
  return flowBkdCopy[language] || flowBkdCopy.en;
};

const ensureFlowBkdStyles = () => {
  if (document.querySelector('[data-flow-bkd-card-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-flow-bkd-card-style', 'true');
  style.textContent = `
    .flow-bkd-card {
      position: relative;
      overflow: hidden;
      border-color: rgba(var(--accent-rgb), .28) !important;
      background:
        radial-gradient(circle at 7% 0%, rgba(var(--accent-rgb), .18), transparent 35%),
        radial-gradient(circle at 94% 12%, rgba(80, 160, 255, .18), transparent 34%),
        linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.026)),
        rgba(255,255,255,.035);
    }

    .flow-bkd-card::before {
      content: "";
      position: absolute;
      right: -4rem;
      top: -4rem;
      width: 14rem;
      height: 14rem;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(var(--accent-rgb), .2), transparent 65%);
      pointer-events: none;
    }

    .flow-bkd-card::after {
      content: "";
      position: absolute;
      left: -3.6rem;
      bottom: -3.6rem;
      width: 10rem;
      height: 10rem;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(80,160,255,.16), transparent 64%);
      pointer-events: none;
    }

    .flow-bkd-card > * {
      position: relative;
      z-index: 1;
    }

    .flow-bkd-media {
      min-height: clamp(13rem, 30vw, 18rem);
      display: grid;
      place-items: center;
      border-bottom: 1px solid rgba(255,255,255,.11);
      background:
        linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px),
        linear-gradient(180deg, rgba(255,255,255,.08) 1px, transparent 1px),
        radial-gradient(circle at center, rgba(var(--accent-rgb), .18) 0 18%, transparent 19% 44%, rgba(80,160,255,.18) 45% 46%, transparent 47%),
        linear-gradient(145deg, rgba(10,16,28,.88), rgba(20,31,48,.58));
      background-size: 28px 28px, 28px 28px, auto, auto;
    }

    .flow-bkd-system {
      width: min(82%, 21rem);
      display: grid;
      gap: .72rem;
    }

    .flow-bkd-node {
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 1rem;
      padding: .78rem .9rem;
      color: var(--text, #fff);
      background: rgba(255,255,255,.07);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 16px 38px rgba(0,0,0,.22);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      font-weight: 900;
      text-align: center;
    }

    .flow-bkd-node.main {
      color: var(--accent-text, #07110d);
      background: linear-gradient(135deg, var(--accent), var(--accent-strong));
      border-color: transparent;
    }

    .flow-bkd-metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: .5rem;
      margin-top: 1rem;
    }

    .flow-bkd-metrics span {
      min-width: 0;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 999px;
      padding: .48rem .58rem;
      background: rgba(255,255,255,.045);
      color: var(--text-muted);
      font-size: .75rem;
      font-weight: 850;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .flow-bkd-card .project-link.flow-bkd-link {
      pointer-events: none;
      border-color: rgba(var(--accent-rgb), .26);
      color: var(--accent-strong);
      background: rgba(var(--accent-rgb), .1);
    }

    @media (min-width: 860px) {
      .flow-bkd-card {
        grid-column: span 2;
      }
    }

    @media (max-width: 520px) {
      .flow-bkd-metrics {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);
};

const escapeFlowHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const createFlowBkdCard = () => {
  const projectGrid = document.querySelector('#work .project-grid');
  if (!projectGrid || document.querySelector('[data-flow-bkd-card]')) return;

  const copy = getFlowBkdCopy();
  const card = document.createElement('article');
  card.className = 'project-card flow-bkd-card';
  card.setAttribute('data-category', 'systems');
  card.setAttribute('data-flow-bkd-card', 'true');
  card.innerHTML = `
    <div class="project-media flow-bkd-media" aria-hidden="true">
      <div class="flow-bkd-system">
        <div class="flow-bkd-node main">Fusion Flow</div>
        <div class="flow-bkd-node">Ingest → Validate → Submit → Sync</div>
        <div class="flow-bkd-node">Azure SQL · Graph · TSS API</div>
      </div>
    </div>
    <div class="project-copy">
      <div class="project-tags">
        <span class="tag" data-flow-bkd-copy="tagOne">${escapeFlowHtml(copy.tagOne)}</span>
        <span class="tag" data-flow-bkd-copy="tagTwo">${escapeFlowHtml(copy.tagTwo)}</span>
      </div>
      <h3 data-flow-bkd-copy="title">${escapeFlowHtml(copy.title)}</h3>
      <p data-flow-bkd-copy="body">${escapeFlowHtml(copy.body)}</p>
      <div class="flow-bkd-metrics">
        <span data-flow-bkd-copy="metricOne">${escapeFlowHtml(copy.metricOne)}</span>
        <span data-flow-bkd-copy="metricTwo">${escapeFlowHtml(copy.metricTwo)}</span>
        <span data-flow-bkd-copy="metricThree">${escapeFlowHtml(copy.metricThree)}</span>
      </div>
      <div class="project-links">
        <span class="project-link flow-bkd-link has-icon">
          <ion-icon name="briefcase-outline" aria-hidden="true"></ion-icon>
          <span data-flow-bkd-copy="action">${escapeFlowHtml(copy.action)}</span>
        </span>
      </div>
    </div>
  `;

  const planningCard = projectGrid.querySelector('[data-planning-project-card]');
  if (planningCard) {
    planningCard.insertAdjacentElement('afterend', card);
  } else {
    projectGrid.insertAdjacentElement('afterbegin', card);
  }
};

const refreshFlowBkdCopy = () => {
  const copy = getFlowBkdCopy();
  document.querySelectorAll('[data-flow-bkd-copy]').forEach((node) => {
    const key = node.getAttribute('data-flow-bkd-copy');
    if (copy[key]) node.textContent = copy[key];
  });
};

const syncFlowBkdFilter = () => {
  const card = document.querySelector('[data-flow-bkd-card]');
  const activeFilter = document.querySelector('.filter-chip.is-active')?.getAttribute('data-filter') || 'all';
  if (!card) return;

  card.hidden = !(activeFilter === 'all' || activeFilter === card.getAttribute('data-category'));
};

const initFlowBkdCard = () => {
  ensureFlowBkdStyles();
  createFlowBkdCard();
  refreshFlowBkdCopy();
  syncFlowBkdFilter();

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.filter-chip')) return;
    window.requestAnimationFrame(syncFlowBkdFilter);
  });

  if (document.body) {
    new MutationObserver(refreshFlowBkdCopy).observe(document.body, {
      attributes: true,
      attributeFilter: ['data-language'],
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFlowBkdCard);
} else {
  initFlowBkdCard();
}
