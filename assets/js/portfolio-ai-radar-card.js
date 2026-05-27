'use strict';

const AI_RADAR_DATA_URL = './data/ai-radar.json';
const DEFAULT_VISIBLE_RADAR_ITEMS = 3;

const aiRadarStaticCopy = {
  en: {
    eyebrow: 'Market intelligence',
    sectionTitle: 'AI Radar',
    sectionIntro: 'A compact, auto-maintained stream of AI, agent and developer-tooling signals. It stays separate from Portfolio so projects remain projects, and market updates remain research.',
    tagOne: 'AI Radar',
    tagTwo: 'Daily signal',
    title: 'Live AI Radar',
    body: 'Daily AI, agent and developer-tooling updates collected from official feeds. Safe data-driven section: the bot updates JSON, not the layout.',
    open: 'Open source',
    empty: 'Waiting for the next AI maintenance run.',
    updated: 'Updated',
    all: 'All',
    showMore: 'Show more',
    showLess: 'Show less',
  },
  es: {
    eyebrow: 'Inteligencia de mercado',
    sectionTitle: 'AI Radar',
    sectionIntro: 'Un stream compacto y auto-mantenido de señales sobre IA, agentes y herramientas developer. Va separado de Portfolio para que los proyectos sigan siendo proyectos y las novedades sean research.',
    tagOne: 'Radar IA',
    tagTwo: 'Señal diaria',
    title: 'Live AI Radar',
    body: 'Novedades diarias sobre IA, agentes y herramientas developer desde fuentes oficiales. Sección segura por datos: el bot actualiza JSON, no el layout.',
    open: 'Abrir fuente',
    empty: 'Esperando la siguiente ejecución de mantenimiento IA.',
    updated: 'Actualizado',
    all: 'Todo',
    showMore: 'Ver más',
    showLess: 'Ver menos',
  },
  and: {
    eyebrow: 'Inteligencia de mercao',
    sectionTitle: 'AI Radar',
    sectionIntro: 'Un stream compacto y auto-mantenío de señaleh sobre IA, agenteh y herramienta developer. Separao de Portfolio pa que loh proyectoh sigan siendo proyectoh.',
    tagOne: 'Radar IA',
    tagTwo: 'Señal diaria',
    title: 'Live AI Radar',
    body: 'Novedadeh diariah sobre IA, agenteh y herramienta developer desde fuenteh oficialeh. Sección segura por datoh: el bot actualiza JSON, no el layout.',
    open: 'Abrí fuente',
    empty: 'Esperando la siguiente ejecución de mantenimiento IA.',
    updated: 'Actualizao',
    all: 'Tó',
    showMore: 'Vé má',
    showLess: 'Vé meno',
  },
};

let aiRadarState = {
  data: null,
  activeTag: 'all',
  expanded: false,
};

const getAiRadarCopy = () => aiRadarStaticCopy[document.body?.dataset?.language || 'en'] || aiRadarStaticCopy.en;

const escapeRadarHtml = (value) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const normalizeTag = (tag) => String(tag || '').trim();
const tagKey = (tag) => normalizeTag(tag).toLowerCase().replace(/[^a-z0-9]+/g, '-');

const ensureAiRadarStyles = () => {
  if (document.querySelector('[data-ai-radar-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-ai-radar-style', 'true');
  style.textContent = `
    .ai-radar-section {
      position: relative;
      overflow: hidden;
      margin-top: clamp(1rem, 3vw, 1.4rem);
      border-color: rgba(142, 255, 207, .22) !important;
      background:
        radial-gradient(circle at 8% 0%, rgba(142,255,207,.14), transparent 34%),
        radial-gradient(circle at 92% 8%, rgba(157,125,255,.16), transparent 34%),
        linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.022)),
        rgba(255,255,255,.032);
    }

    .ai-radar-section::before,
    .ai-radar-section::after {
      content: "";
      position: absolute;
      border-radius: 999px;
      pointer-events: none;
    }

    .ai-radar-section::before {
      right: -5rem;
      top: -5rem;
      width: 16rem;
      height: 16rem;
      background: radial-gradient(circle, rgba(142,255,207,.16), transparent 64%);
    }

    .ai-radar-section::after {
      left: -4rem;
      bottom: -4rem;
      width: 12rem;
      height: 12rem;
      background: radial-gradient(circle, rgba(157,125,255,.14), transparent 64%);
    }

    .ai-radar-section > * {
      position: relative;
      z-index: 1;
    }

    .ai-radar-heading {
      display: grid;
      gap: .6rem;
      margin-bottom: 1rem;
    }

    .ai-radar-heading .eyebrow {
      width: fit-content;
    }

    .ai-radar-heading h2 {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(2rem, 7vw, 4.2rem);
      letter-spacing: -.065em;
      line-height: .92;
    }

    .ai-radar-heading p {
      max-width: 64ch;
      margin: 0;
      color: var(--text-muted);
      line-height: 1.55;
    }

    .ai-radar-shell {
      display: grid;
      grid-template-columns: minmax(0, .78fr) minmax(0, 1.22fr);
      gap: clamp(1rem, 3vw, 1.35rem);
      align-items: stretch;
    }

    .ai-radar-visual-card,
    .ai-radar-feed-card {
      border: 1px solid rgba(255,255,255,.12);
      border-radius: clamp(1.25rem, 4vw, 1.75rem);
      background: rgba(255,255,255,.045);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.07);
      overflow: hidden;
    }

    .ai-radar-visual-card {
      min-height: clamp(15rem, 32vw, 22rem);
      display: grid;
      place-items: center;
      padding: clamp(1rem, 3vw, 1.25rem);
      background:
        linear-gradient(90deg, rgba(255,255,255,.065) 1px, transparent 1px),
        linear-gradient(180deg, rgba(255,255,255,.065) 1px, transparent 1px),
        radial-gradient(circle at 50% 50%, rgba(142,255,207,.18) 0 17%, transparent 18% 42%, rgba(157,125,255,.19) 43% 44%, transparent 45%),
        linear-gradient(145deg, rgba(9,15,26,.92), rgba(25,18,50,.68));
      background-size: 25px 25px, 25px 25px, auto, auto;
    }

    .ai-radar-visual {
      width: min(88%, 23rem);
      display: grid;
      gap: .7rem;
    }

    .ai-radar-core {
      justify-self: center;
      width: clamp(7.4rem, 19vw, 9.6rem);
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      text-align: center;
      border-radius: 999px;
      color: #07110d;
      background: linear-gradient(135deg, #8effcf, #d7c3ff);
      box-shadow: 0 0 0 16px rgba(255,255,255,.055), 0 24px 66px rgba(0,0,0,.3);
      font-weight: 1000;
      letter-spacing: -.06em;
    }

    .ai-radar-core span {
      display: block;
      font-size: .62rem;
      letter-spacing: .14em;
      text-transform: uppercase;
      opacity: .68;
    }

    .ai-radar-core strong {
      display: block;
      font-size: clamp(1.4rem, 5vw, 2.05rem);
      line-height: .95;
    }

    .ai-radar-feed {
      display: grid;
      gap: .5rem;
    }

    .ai-radar-feed span {
      display: block;
      border: 1px solid rgba(255,255,255,.14);
      border-radius: .95rem;
      padding: .62rem .72rem;
      color: rgba(255,255,255,.82);
      background: rgba(255,255,255,.07);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
      font-size: .78rem;
      font-weight: 850;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ai-radar-feed-card {
      padding: clamp(1rem, 3vw, 1.2rem);
    }

    .ai-radar-card-top {
      display: grid;
      gap: .65rem;
      margin-bottom: .9rem;
    }

    .ai-radar-card-top h3 {
      margin: 0;
      font-size: clamp(1.35rem, 4vw, 2rem);
      letter-spacing: -.045em;
      line-height: 1;
    }

    .ai-radar-card-top p {
      margin: 0;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .ai-radar-filters {
      display: flex;
      flex-wrap: wrap;
      gap: .45rem;
      margin-top: .85rem;
    }

    .ai-radar-filter {
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 999px;
      padding: .5rem .68rem;
      color: var(--text-muted);
      background: rgba(255,255,255,.045);
      font-size: .76rem;
      font-weight: 900;
      cursor: pointer;
      transition: border-color .18s ease, background .18s ease, color .18s ease, transform .18s ease;
    }

    .ai-radar-filter:hover,
    .ai-radar-filter:focus-visible,
    .ai-radar-filter.is-active {
      color: var(--text);
      border-color: rgba(142,255,207,.34);
      background: rgba(142,255,207,.1);
      transform: translateY(-1px);
    }

    .ai-radar-list {
      display: grid;
      gap: .6rem;
      margin-top: .95rem;
    }

    .ai-radar-item {
      display: grid;
      gap: .5rem;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 1.05rem;
      padding: .8rem;
      background: rgba(255,255,255,.045);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
    }

    .ai-radar-item strong {
      color: var(--text);
      font-size: .96rem;
      line-height: 1.18;
    }

    .ai-radar-item p {
      margin: 0;
      color: var(--text-muted);
      font-size: .84rem;
      line-height: 1.45;
    }

    .ai-radar-item-meta,
    .ai-radar-item-tags,
    .ai-radar-meta {
      display: flex;
      flex-wrap: wrap;
      gap: .42rem;
      align-items: center;
    }

    .ai-radar-item-meta span,
    .ai-radar-item-tags span,
    .ai-radar-meta span {
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 999px;
      padding: .36rem .52rem;
      color: var(--text-muted);
      background: rgba(255,255,255,.04);
      font-size: .68rem;
      font-weight: 850;
    }

    .ai-radar-item a {
      justify-self: start;
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      border: 1px solid rgba(142,255,207,.24);
      border-radius: 999px;
      padding: .5rem .66rem;
      color: var(--accent-strong, #8effcf);
      background: rgba(142,255,207,.08);
      font-size: .76rem;
      font-weight: 950;
      text-decoration: none;
    }

    .ai-radar-actions {
      display: flex;
      margin-top: .8rem;
    }

    .ai-radar-toggle {
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 999px;
      padding: .66rem .82rem;
      color: var(--text);
      background: rgba(255,255,255,.055);
      font-weight: 950;
      cursor: pointer;
    }

    @media (max-width: 920px) {
      .ai-radar-shell {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .ai-radar-section {
        margin-top: 1rem;
        padding: clamp(1rem, 5vw, 1.1rem) !important;
      }

      .ai-radar-heading h2 {
        font-size: clamp(2.25rem, 12vw, 3.35rem);
      }

      .ai-radar-visual-card {
        min-height: 13.5rem;
      }

      .ai-radar-filters {
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: .2rem;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .ai-radar-filters::-webkit-scrollbar {
        width: 0;
        height: 0;
        display: none;
      }

      .ai-radar-filter {
        flex: 0 0 auto;
      }

      .ai-radar-item a,
      .ai-radar-toggle {
        width: 100%;
        justify-content: center;
      }
    }
  `;

  document.head.appendChild(style);
};

const fetchAiRadarData = async () => {
  try {
    const response = await fetch(`${AI_RADAR_DATA_URL}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch {
    return null;
  }
};

const getRadarItems = (data) => Array.isArray(data?.items) ? data.items : [];

const getAvailableTags = (items, copy) => {
  const tags = items.flatMap((item) => Array.isArray(item.tags) ? item.tags : []);
  return [copy.all, ...Array.from(new Set(tags)).slice(0, 9)];
};

const getFilteredItems = (items) => {
  if (aiRadarState.activeTag === 'all') return items;
  return items.filter((item) => (item.tags || []).some((tag) => tagKey(tag) === aiRadarState.activeTag));
};

const getAiRadarSection = () => document.querySelector('[data-ai-radar-section]');

const renderRadarList = (section) => {
  if (!section || !aiRadarState.data) return;
  const copy = getAiRadarCopy();
  const allItems = getRadarItems(aiRadarState.data);
  const filtered = getFilteredItems(allItems);
  const visible = aiRadarState.expanded ? filtered : filtered.slice(0, DEFAULT_VISIBLE_RADAR_ITEMS);
  const list = section.querySelector('[data-ai-radar-list]');
  const filters = section.querySelector('[data-ai-radar-filters]');
  const actions = section.querySelector('[data-ai-radar-actions]');
  const tags = getAvailableTags(allItems, copy);

  if (filters) {
    filters.innerHTML = tags.map((tag, index) => {
      const key = index === 0 ? 'all' : tagKey(tag);
      const isActive = key === aiRadarState.activeTag;
      return `<button class="ai-radar-filter ${isActive ? 'is-active' : ''}" type="button" data-ai-radar-filter="${escapeRadarHtml(key)}">${escapeRadarHtml(tag)}</button>`;
    }).join('');
  }

  if (list) {
    list.innerHTML = visible.length
      ? visible.map((item) => `
        <article class="ai-radar-item">
          <div class="ai-radar-item-meta">
            <span>${escapeRadarHtml(item.source || 'AI Radar')}</span>
            <span>${escapeRadarHtml(item.date || '')}</span>
          </div>
          <strong>${escapeRadarHtml(item.title)}</strong>
          <p>${escapeRadarHtml(item.summary || '')}</p>
          <div class="ai-radar-item-tags">
            ${(item.tags || ['AI']).slice(0, 4).map((tag) => `<span>${escapeRadarHtml(tag)}</span>`).join('')}
          </div>
          ${item.url ? `<a href="${escapeRadarHtml(item.url)}" target="_blank" rel="noreferrer"><ion-icon name="open-outline" aria-hidden="true"></ion-icon><span>${escapeRadarHtml(copy.open)}</span></a>` : ''}
        </article>
      `).join('')
      : `<article class="ai-radar-item"><strong>${escapeRadarHtml(copy.empty)}</strong></article>`;
  }

  if (actions) {
    const shouldShowToggle = filtered.length > DEFAULT_VISIBLE_RADAR_ITEMS;
    actions.innerHTML = shouldShowToggle
      ? `<button class="ai-radar-toggle" type="button" data-ai-radar-toggle>${escapeRadarHtml(aiRadarState.expanded ? copy.showLess : copy.showMore)}</button>`
      : '';
  }
};

const getAiRadarMount = () => document.querySelector('[data-ai-radar-mount]');

const createAiRadarSection = () => {
  const mount = getAiRadarMount();
  const workSection = document.getElementById('work');
  if ((!mount && !workSection) || getAiRadarSection()) return getAiRadarSection();

  document.querySelectorAll('[data-ai-radar-card]').forEach((node) => node.remove());

  const copy = getAiRadarCopy();
  const section = document.createElement('section');
  section.id = 'ai-radar';
  section.className = 'panel card ai-radar-section premium-reveal';
  section.setAttribute('data-ai-radar-section', 'true');
  section.setAttribute('data-scroll-section', 'true');
  section.innerHTML = `
    <div class="ai-radar-heading">
      <span class="eyebrow" data-ai-radar-copy="eyebrow">${escapeRadarHtml(copy.eyebrow)}</span>
      <h2 data-ai-radar-copy="sectionTitle">${escapeRadarHtml(copy.sectionTitle)}</h2>
      <p data-ai-radar-copy="sectionIntro">${escapeRadarHtml(copy.sectionIntro)}</p>
    </div>
    <div class="ai-radar-shell">
      <div class="ai-radar-visual-card" aria-hidden="true">
        <div class="ai-radar-visual">
          <div class="ai-radar-core"><div><span>Live</span><strong>AI Radar</strong></div></div>
          <div class="ai-radar-feed" data-ai-radar-feed>
            <span>${escapeRadarHtml(copy.empty)}</span>
          </div>
        </div>
      </div>
      <div class="ai-radar-feed-card">
        <div class="project-tags">
          <span class="tag" data-ai-radar-copy="tagOne">${escapeRadarHtml(copy.tagOne)}</span>
          <span class="tag" data-ai-radar-copy="tagTwo">${escapeRadarHtml(copy.tagTwo)}</span>
        </div>
        <div class="ai-radar-card-top">
          <h3 data-ai-radar-title>${escapeRadarHtml(copy.title)}</h3>
          <p data-ai-radar-body>${escapeRadarHtml(copy.body)}</p>
          <div class="ai-radar-meta" data-ai-radar-meta></div>
        </div>
        <div class="ai-radar-filters" data-ai-radar-filters></div>
        <div class="ai-radar-list" data-ai-radar-list></div>
        <div class="ai-radar-actions" data-ai-radar-actions></div>
      </div>
    </div>
  `;

  if (mount) {
    mount.appendChild(section);
  } else {
    workSection.insertAdjacentElement('afterend', section);
  }

  return section;
};

const renderAiRadarData = (section, data) => {
  if (!section || !data) return;
  const copy = getAiRadarCopy();
  aiRadarState.data = data;
  const items = getRadarItems(data).slice(0, 3);

  const title = section.querySelector('[data-ai-radar-title]');
  const body = section.querySelector('[data-ai-radar-body]');
  const feed = section.querySelector('[data-ai-radar-feed]');
  const meta = section.querySelector('[data-ai-radar-meta]');

  if (title) title.textContent = data.headline || copy.title;
  if (body) body.textContent = data.insight || copy.body;
  if (feed) {
    feed.innerHTML = items.length
      ? items.map((item) => `<span>${escapeRadarHtml(item.title)}</span>`).join('')
      : `<span>${escapeRadarHtml(copy.empty)}</span>`;
  }
  if (meta) {
    meta.innerHTML = `
      <span>${escapeRadarHtml(copy.updated)}: ${escapeRadarHtml(data.date || '')}</span>
      <span>${escapeRadarHtml(data.mode || 'safe-data')}</span>
    `;
  }

  renderRadarList(section);
};

const refreshStaticCopy = () => {
  const copy = getAiRadarCopy();
  document.querySelectorAll('[data-ai-radar-copy]').forEach((node) => {
    const key = node.getAttribute('data-ai-radar-copy');
    if (copy[key]) node.textContent = copy[key];
  });
  renderRadarList(getAiRadarSection());
};

const initAiRadarSection = async () => {
  ensureAiRadarStyles();
  const section = createAiRadarSection();
  refreshStaticCopy();
  const data = await fetchAiRadarData();
  renderAiRadarData(section || getAiRadarSection(), data);

  document.addEventListener('click', (event) => {
    const radarFilter = event.target.closest('[data-ai-radar-filter]');
    if (radarFilter) {
      aiRadarState.activeTag = radarFilter.getAttribute('data-ai-radar-filter') || 'all';
      aiRadarState.expanded = false;
      renderRadarList(getAiRadarSection());
      return;
    }

    if (event.target.closest('[data-ai-radar-toggle]')) {
      aiRadarState.expanded = !aiRadarState.expanded;
      renderRadarList(getAiRadarSection());
    }
  });

  if (document.body) {
    new MutationObserver(refreshStaticCopy).observe(document.body, {
      attributes: true,
      attributeFilter: ['data-language'],
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAiRadarSection);
} else {
  initAiRadarSection();
}
