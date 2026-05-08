'use strict';

const aiCardsCopy = {
  en: {
    filter: 'AI',
    mcpTitle: 'MCP agent architecture',
    mcpBody: 'AI-agent integration pattern using MCP thinking: connect assistants with tools, repositories, business data and operational workflows instead of isolated prompts.',
    mcpTagOne: 'MCP',
    mcpTagTwo: 'Agents',
    chatgptTitle: 'ChatGPT workflow design',
    chatgptBody: 'Prompt systems, structured reasoning, file analysis, image understanding, automation ideas and product-facing assistant workflows.',
    chatgptTagOne: 'ChatGPT',
    chatgptTagTwo: 'Workflows',
    claudeTitle: 'Claude research and docs flow',
    claudeBody: 'Long-form analysis, documentation refinement, product thinking and structured collaboration around complex technical context.',
    claudeTagOne: 'Claude',
    claudeTagTwo: 'Research',
    copilotTitle: 'GitHub Copilot developer loop',
    copilotBody: 'Coding assistant workflow for inline suggestions, code chat, project context, pull-request support and faster iteration in real repositories.',
    copilotTagOne: 'Copilot',
    copilotTagTwo: 'Dev',
    geminiTitle: 'Gemini multimodal exploration',
    geminiBody: 'Multimodal and long-context AI direction for mixing text, images, code, documents and tool-aware application ideas.',
    geminiTagOne: 'Gemini',
    geminiTagTwo: 'Multimodal',
    action: 'AI capability',
  },
  es: {
    filter: 'IA',
    mcpTitle: 'Arquitectura de agentes MCP',
    mcpBody: 'Patrón de integración para agentes IA con enfoque MCP: conectar asistentes con herramientas, repositorios, datos de negocio y flujos operativos.',
    mcpTagOne: 'MCP',
    mcpTagTwo: 'Agentes',
    chatgptTitle: 'Diseño de workflows con ChatGPT',
    chatgptBody: 'Sistemas de prompts, razonamiento estructurado, análisis de archivos, lectura visual, ideas de automatización y asistentes orientados a producto.',
    chatgptTagOne: 'ChatGPT',
    chatgptTagTwo: 'Workflows',
    claudeTitle: 'Claude para research y documentación',
    claudeBody: 'Análisis largo, refinamiento de documentación, pensamiento de producto y colaboración estructurada con contexto técnico complejo.',
    claudeTagOne: 'Claude',
    claudeTagTwo: 'Research',
    copilotTitle: 'Loop de desarrollo con GitHub Copilot',
    copilotBody: 'Flujo de coding assistant para sugerencias inline, chat de código, contexto de proyecto, apoyo en PRs e iteración rápida en repos reales.',
    copilotTagOne: 'Copilot',
    copilotTagTwo: 'Dev',
    geminiTitle: 'Exploración multimodal con Gemini',
    geminiBody: 'Dirección IA multimodal y long-context para mezclar texto, imágenes, código, documentos e ideas de aplicaciones con herramientas.',
    geminiTagOne: 'Gemini',
    geminiTagTwo: 'Multimodal',
    action: 'Capacidad IA',
  },
  and: {
    filter: 'IA',
    mcpTitle: 'Arquitectura de agenteh MCP',
    mcpBody: 'Patrón de integración IA con enfoque MCP pa conectar asistenteh con herramienta, repos, datoh de negocio y flujoh operativo.',
    mcpTagOne: 'MCP',
    mcpTagTwo: 'Agenteh',
    chatgptTitle: 'Workflows con ChatGPT',
    chatgptBody: 'Prompt systems, razonamiento estructurado, análisis de archivoh, lectura visual, automatización y asistentes pa producto.',
    chatgptTagOne: 'ChatGPT',
    chatgptTagTwo: 'Workflows',
    claudeTitle: 'Claude pa research y docs',
    claudeBody: 'Análisis largo, documentación, pensamiento de producto y colaboración con contexto técnico complejo.',
    claudeTagOne: 'Claude',
    claudeTagTwo: 'Research',
    copilotTitle: 'Loop dev con GitHub Copilot',
    copilotBody: 'Coding assistant pa sugerencias, chat de código, contexto de proyecto, PRs e iteración rápida en repos realeh.',
    copilotTagOne: 'Copilot',
    copilotTagTwo: 'Dev',
    geminiTitle: 'Exploración multimodal con Gemini',
    geminiBody: 'IA multimodal y long-context pa mezclar texto, imágeneh, código, documento e ideas de apps con herramientah.',
    geminiTagOne: 'Gemini',
    geminiTagTwo: 'Multimodal',
    action: 'Capacidad IA',
  },
};

const aiCardDefinitions = [
  { id: 'mcp', titleKey: 'mcpTitle', bodyKey: 'mcpBody', tagOneKey: 'mcpTagOne', tagTwoKey: 'mcpTagTwo', label: 'MCP', icon: 'git-network-outline' },
  { id: 'chatgpt', titleKey: 'chatgptTitle', bodyKey: 'chatgptBody', tagOneKey: 'chatgptTagOne', tagTwoKey: 'chatgptTagTwo', label: 'GPT', icon: 'sparkles-outline' },
  { id: 'claude', titleKey: 'claudeTitle', bodyKey: 'claudeBody', tagOneKey: 'claudeTagOne', tagTwoKey: 'claudeTagTwo', label: 'CLD', icon: 'document-text-outline' },
  { id: 'copilot', titleKey: 'copilotTitle', bodyKey: 'copilotBody', tagOneKey: 'copilotTagOne', tagTwoKey: 'copilotTagTwo', label: 'CODE', icon: 'terminal-outline' },
  { id: 'gemini', titleKey: 'geminiTitle', bodyKey: 'geminiBody', tagOneKey: 'geminiTagOne', tagTwoKey: 'geminiTagTwo', label: 'GEM', icon: 'aperture-outline' },
];

const getAiCopy = () => aiCardsCopy[document.body?.dataset?.language || 'en'] || aiCardsCopy.en;
const escapeAiHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const ensureAiStyles = () => {
  if (document.querySelector('[data-ai-card-style]')) return;
  const style = document.createElement('style');
  style.setAttribute('data-ai-card-style', 'true');
  style.textContent = `
    .ai-project-card { position: relative; overflow: hidden; border-color: rgba(157, 125, 255, .3) !important; background: radial-gradient(circle at 8% 0%, rgba(157,125,255,.2), transparent 34%), radial-gradient(circle at 92% 10%, rgba(91,255,196,.14), transparent 34%), linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.026)), rgba(255,255,255,.035); }
    .ai-project-card::before { content: ""; position: absolute; inset: -4rem -4rem auto auto; width: 13rem; height: 13rem; border-radius: 999px; background: radial-gradient(circle, rgba(157,125,255,.24), transparent 64%); pointer-events: none; }
    .ai-project-card::after { content: ""; position: absolute; inset: auto auto -3.8rem -3.8rem; width: 10rem; height: 10rem; border-radius: 999px; background: radial-gradient(circle, rgba(91,255,196,.16), transparent 64%); pointer-events: none; }
    .ai-project-card > * { position: relative; z-index: 1; }
    .ai-project-media { min-height: clamp(12rem, 28vw, 16.5rem); display: grid; place-items: center; border-bottom: 1px solid rgba(255,255,255,.11); background: linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,.07) 1px, transparent 1px), radial-gradient(circle at 50% 50%, rgba(157,125,255,.2) 0 17%, transparent 18% 42%, rgba(91,255,196,.18) 43% 44%, transparent 45%), linear-gradient(145deg, rgba(13,13,27,.92), rgba(29,20,52,.72)); background-size: 24px 24px, 24px 24px, auto, auto; }
    .ai-visual { width: min(86%, 21rem); min-height: 10rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: .52rem; align-items: center; }
    .ai-core { grid-column: 1 / -1; justify-self: center; width: 6.8rem; aspect-ratio: 1; display: grid; place-items: center; border-radius: 999px; color: #fff; background: radial-gradient(circle at 30% 24%, rgba(255,255,255,.56), rgba(157,125,255,.35) 32%, rgba(67,34,135,.92)); box-shadow: 0 0 0 14px rgba(255,255,255,.05), 0 24px 60px rgba(0,0,0,.32); font-weight: 1000; letter-spacing: -.06em; }
    .ai-node { min-height: 2.7rem; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.14); border-radius: .9rem; color: rgba(255,255,255,.82); background: rgba(255,255,255,.07); box-shadow: inset 0 1px 0 rgba(255,255,255,.08); font-size: .72rem; font-weight: 900; }
    .ai-project-card .project-link.ai-proof-link { pointer-events: none; border-color: rgba(157,125,255,.28); color: #d7c8ff; background: rgba(157,125,255,.1); }
    .filter-chip[data-filter="ai"] { border-color: rgba(157,125,255,.28); }
    @media (min-width: 860px) { .ai-project-card[data-ai-card="mcp"] { grid-column: span 2; } }
  `;
  document.head.appendChild(style);
};

const ensureAiFilter = () => {
  const filterRow = document.querySelector('#work .filter-row');
  if (!filterRow || filterRow.querySelector('[data-filter="ai"]')) return;
  const copy = getAiCopy();
  const button = document.createElement('button');
  button.className = 'filter-chip';
  button.type = 'button';
  button.dataset.filter = 'ai';
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('data-ai-copy', 'filter');
  button.textContent = copy.filter;
  filterRow.appendChild(button);
};

const buildAiCard = (definition, copy) => {
  const card = document.createElement('article');
  card.className = 'project-card ai-project-card';
  card.dataset.category = 'ai';
  card.dataset.aiCard = definition.id;
  card.innerHTML = `
    <div class="project-media ai-project-media" aria-hidden="true">
      <div class="ai-visual">
        <div class="ai-core">${escapeAiHtml(definition.label)}</div>
        <div class="ai-node">Tools</div><div class="ai-node">Data</div><div class="ai-node">Code</div>
      </div>
    </div>
    <div class="project-copy">
      <div class="project-tags"><span class="tag" data-ai-copy="${definition.tagOneKey}">${escapeAiHtml(copy[definition.tagOneKey])}</span><span class="tag" data-ai-copy="${definition.tagTwoKey}">${escapeAiHtml(copy[definition.tagTwoKey])}</span></div>
      <h3 data-ai-copy="${definition.titleKey}">${escapeAiHtml(copy[definition.titleKey])}</h3>
      <p data-ai-copy="${definition.bodyKey}">${escapeAiHtml(copy[definition.bodyKey])}</p>
      <div class="project-links"><span class="project-link ai-proof-link has-icon"><ion-icon name="${definition.icon}" aria-hidden="true"></ion-icon><span data-ai-copy="action">${escapeAiHtml(copy.action)}</span></span></div>
    </div>
  `;
  return card;
};

const insertAiCards = () => {
  const projectGrid = document.querySelector('#work .project-grid');
  if (!projectGrid || document.querySelector('[data-ai-card]')) return;
  const copy = getAiCopy();
  const flowCard = projectGrid.querySelector('[data-flow-bkd-card]');
  let insertAfter = flowCard || projectGrid.querySelector('[data-planning-project-card]') || projectGrid.firstElementChild;
  aiCardDefinitions.forEach((definition) => {
    const card = buildAiCard(definition, copy);
    if (insertAfter) insertAfter.insertAdjacentElement('afterend', card); else projectGrid.appendChild(card);
    insertAfter = card;
  });
};

const refreshAiCopy = () => {
  const copy = getAiCopy();
  document.querySelectorAll('[data-ai-copy]').forEach((node) => {
    const key = node.getAttribute('data-ai-copy');
    if (copy[key]) node.textContent = copy[key];
  });
};

const syncAiFilter = () => {
  const activeFilter = document.querySelector('.filter-chip.is-active')?.getAttribute('data-filter') || 'all';
  document.querySelectorAll('[data-ai-card]').forEach((card) => { card.hidden = !(activeFilter === 'all' || activeFilter === 'ai'); });
};

const initAiCards = () => {
  ensureAiStyles();
  ensureAiFilter();
  insertAiCards();
  refreshAiCopy();
  syncAiFilter();
  document.addEventListener('click', (event) => { if (event.target.closest('.filter-chip')) window.requestAnimationFrame(syncAiFilter); });
  if (document.body) new MutationObserver(refreshAiCopy).observe(document.body, { attributes: true, attributeFilter: ['data-language'] });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAiCards); else initAiCards();
