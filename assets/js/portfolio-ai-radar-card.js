'use strict';

const AI_RADAR_DATA_URL = './data/ai-radar.json';
const DEFAULT_VISIBLE_RADAR_ITEMS = 3;

const aiRadarStaticCopy = {
  en: {
    tagOne: 'AI Radar',
    tagTwo: 'Daily signal',
    title: 'Live AI Radar',
    body: 'Daily AI, agent and developer-tooling updates collected from official feeds. Safe data-driven card: the bot updates JSON, not the layout.',
    open: 'Open source',
    empty: 'Waiting for the next AI maintenance run.',
    updated: 'Updated',
    all: 'All',
    showMore: 'Show more',
    showLess: 'Show less',
  },
  es: {
    tagOne: 'Radar IA',
    tagTwo: 'Señal diaria',
    title: 'Live AI Radar',
    body: 'Novedades diarias sobre IA, agentes y herramientas developer desde fuentes oficiales. Card segura por datos: el bot actualiza JSON, no el layout.',
    open: 'Abrir fuente',
    empty: 'Esperando la siguiente ejecución de mantenimiento IA.',
    updated: 'Actualizado',
    all: 'Todo',
    showMore: 'Ver más',
    showLess: 'Ver menos',
  },
  and: {
    tagOne: 'Radar IA',
    tagTwo: 'Señal diaria',
    title: 'Live AI Radar',
    body: 'Novedadeh diariah sobre IA, agenteh y herramienta developer desde fuenteh oficialeh. Card segura por datoh: el bot actualiza JSON, no el layout.',
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
    .ai-radar-card {
      position: relative;
      overflow: hidden;
      border-color: rgba(142, 255, 207, .26) !important;
      background:
        radial-gradient(circle at 8% 0%, rgba(142,255,207,.16), transparent 34%),
        radial-gradient(circle at 92% 8%, rgba(157,125,255,.18), transparent 34%),
        linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.026)),
        rgba(255,255,255,.035);
    }

    .ai-radar-card::before,
    .ai-radar-card::after {
      content: "";
      position: absolute;
      border-radius: 999px;
      pointer-events: none;
    }

    .ai-radar-card::before {
      right: -4rem;
      top: -4rem;
      width: 14rem;
      height: 14rem;
      background: radial-gradient(circle, rgba(142,255,207,.18), transparent 64%);
    }

    .ai-radar-card::after {
      left: -3.8rem;
      bottom: -3.8rem;
      width: 10rem;
      height: 10rem;
      background: radial-gradient(circle, rgba(157,125,255,.16), transparent 64%);
    }

    .ai-radar-card > * {
      position: relative;
      z-index: 1;
    }

    .ai-radar-media {
      min-height: clamp(13rem, 30vw, 18rem);
      display: grid;
      place-items: center;
      border-bottom: 1px solid rgba(255,255,255,.11);
      background:
        linear-gradient(90deg, rgba(255,255,255,.065) 1px, transparent 1px),
        linear-gradient(180deg, rgba(255,255,255,.065) 1px, transparent 1px),
        radial-gradient(circle at 50% 50%, rgba(142,255,207,.18) 0 17%, transparent 18% 42%, rgba(157,125,255,.19) 43% 44%, transparent 45%),
        linear-gradient(145deg, rgba(9,15,26,.92), rgba(25,18,50,.68));
      background-size: 25px 25px, 25px 25px, auto, auto;
    }

    .ai-radar-visual {
      width: min(86%, 22rem);
      display: grid;
      gap: .66rem;
    }

    .ai-radar-core {
      justify-self: center;
      width: clamp(7rem, 19vw, 9rem);
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

    .ai-radar-feed,
    .ai-radar-list {
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

    .ai-radar-filters {
      display: flex;
      flex-wrap: wrap;
      gap: .45rem;
      margin-top: .9rem;
    }

    .ai-radar-filter {
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 999px;
      padding: .48rem .66rem;
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
      margin-top: .85rem;
    }

    .ai-radar-item {
      display: grid;
      gap: .46rem;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 1.05rem;
      padding: .76rem;
      background: rgba(255,255,255,.045);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
    }

    .ai-radar-item strong {
      color: var(--text);
      font-size: .94rem;
      line-height: 1.18;
    }

    .ai-radar-item p {
      margin: 0;
      color: var(--text-muted);
      font-size: .82rem;
      line-height: 1.42;
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
      padding: .48rem .64rem;
      color: var(--accent-strong, #8effcf);
      background: rgba(142,255,207,.08);
      font-size: .76rem;
      font-weight: 950;
      text-decoration: none;
    }

    .ai-radar-actions {
      display: flex;
      margin-top: .75rem;
    }

    .ai-radar-toggle {
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 999px;
      padding: .62rem .78rem;
      color: var(--text);
      background: rgba(255,255,255,.055);
      font-weight: 950;
      cursor: pointer;
    }

    @media (min-width: 860px) {
      .ai-radar-card {
        grid-column: span 2;
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

const renderRadarList = (card) => {
  if (!card || !aiRadarState.data) return;
  const copy = getAiRadarCopy();
  const allItems = getRadarItems(aiRadarState.data);
  const filtered = getFilteredItems(allItems);
  const visible = aiRadarState.expanded ? filtered : filtered.slice(0, DEFAULT_VISIBLE_RADAR_ITEMS);
  const list = card.querySelector('[data-ai-radar-list]');
  const filters = card.querySelector('[data-ai-radar-filters]');
  const actions = card.querySelector('[data-ai-radar-actions]');
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

const createAiRadarCard = () => {
  const projectGrid = document.querySelector('#work .project-grid');
  if (!projectGrid || document.querySelector('[data-ai-radar-card]')) return null;

  const copy = getAiRadarCopy();
  const card = document.createElement('article');
  card.className = 'project-card ai-radar-card';
  card.setAttribute('data-category', 'ai');
  card.setAttribute('data-ai-radar-card', 'true');
  card.innerHTML = `
    <div class="project-media ai-radar-media" aria-hidden="true">
      <div class="ai-radar-visual">
        <div class="ai-radar-core"><div><span>Live</span><strong>AI Radar</strong></div></div>
        <div class="ai-radar-feed" data-ai-radar-feed>
          <span>${escapeRadarHtml(copy.empty)}</span>
        </div>
      </div>
    </div>
    <div class="project-copy">
      <div class="project-tags">
        <span class="tag" data-ai-radar-copy="tagOne">${escapeRadarHtml(copy.tagOne)}</span>
        <span class="tag" data-ai-radar-copy="tagTwo">${escapeRadarHtml(copy.tagTwo)}</span>
      </div>
      <h3 data-ai-radar-title>${escapeRadarHtml(copy.title)}</h3>
      <p data-ai-radar-body>${escapeRadarHtml(copy.body)}</p>
      <div class="ai-radar-meta" data-ai-radar-meta></div>
      <div class="ai-radar-filters" data-ai-radar-filters></div>
      <div class="ai-radar-list" data-ai-radar-list></div>
      <div class="ai-radar-actions" data-ai-radar-actions></div>
    </div>
  `;

  const firstAiCard = projectGrid.querySelector('[data-ai-card]');
  const flowCard = projectGrid.querySelector('[data-flow-bkd-card]');
  const anchor = firstAiCard || flowCard || projectGrid.querySelector('[data-planning-project-card]');
  if (anchor) anchor.insertAdjacentElement('afterend', card);
  else projectGrid.insertAdjacentElement('afterbegin', card);

  return card;
};

const renderAiRadarData = (card, data) => {
  if (!card || !data) return;
  const copy = getAiRadarCopy();
  aiRadarState.data = data;
  const items = getRadarItems(data).slice(0, 3);

  const title = card.querySelector('[data-ai-radar-title]');
  const body = card.querySelector('[data-ai-radar-body]');
  const feed = card.querySelector('[data-ai-radar-feed]');
  const meta = card.querySelector('[data-ai-radar-meta]');

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

  renderRadarList(card);
};

const syncAiRadarFilter = () => {
  const card = document.querySelector('[data-ai-radar-card]');
  const activeFilter = document.querySelector('.filter-chip.is-active')?.getAttribute('data-filter') || 'all';
  if (!card) return;
  card.hidden = !(activeFilter === 'all' || activeFilter === 'ai');
};

const refreshStaticCopy = () => {
  const copy = getAiRadarCopy();
  document.querySelectorAll('[data-ai-radar-copy]').forEach((node) => {
    const key = node.getAttribute('data-ai-radar-copy');
    if (copy[key]) node.textContent = copy[key];
  });
  renderRadarList(document.querySelector('[data-ai-radar-card]'));
};

const initAiRadarCard = async () => {
  ensureAiRadarStyles();
  const card = createAiRadarCard();
  refreshStaticCopy();
  syncAiRadarFilter();
  const data = await fetchAiRadarData();
  renderAiRadarData(card || document.querySelector('[data-ai-radar-card]'), data);

  document.addEventListener('click', (event) => {
    const radarFilter = event.target.closest('[data-ai-radar-filter]');
    if (radarFilter) {
      aiRadarState.activeTag = radarFilter.getAttribute('data-ai-radar-filter') || 'all';
      aiRadarState.expanded = false;
      renderRadarList(document.querySelector('[data-ai-radar-card]'));
      return;
    }

    if (event.target.closest('[data-ai-radar-toggle]')) {
      aiRadarState.expanded = !aiRadarState.expanded;
      renderRadarList(document.querySelector('[data-ai-radar-card]'));
      return;
    }

    if (event.target.closest('.filter-chip')) window.requestAnimationFrame(syncAiRadarFilter);
  });

  if (document.body) {
    new MutationObserver(refreshStaticCopy).observe(document.body, {
      attributes: true,
      attributeFilter: ['data-language'],
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAiRadarCard);
} else {
  initAiRadarCard();
}
