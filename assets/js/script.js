'use strict';

import '../css/style.css';

const sidebar = document.querySelector('[data-sidebar]');
const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
const sidebarPanel = document.querySelector('[data-sidebar-panel]');
const sectionButtons = Array.from(document.querySelectorAll('.nav-tab'));
const panels = Array.from(document.querySelectorAll('[data-panel]'));
const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
const projectCards = Array.from(document.querySelectorAll('.project-card'));
const desktopQuery = window.matchMedia('(min-width: 1100px)');

const getPanelById = (id) => panels.find((panel) => panel.id === id);

const updateSidebarState = (expanded) => {
  if (!sidebar || !sidebarPanel || !sidebarToggle) {
    return;
  }

  const shouldStayOpen = desktopQuery.matches;
  const nextState = shouldStayOpen ? true : expanded;

  sidebar.classList.toggle('is-open', nextState);
  sidebarPanel.hidden = !nextState;
  sidebarToggle.setAttribute('aria-expanded', String(nextState));
};

const setActivePanel = (panelId, options = {}) => {
  const { updateHash = true } = options;
  const nextPanel = getPanelById(panelId) || panels[0];

  if (!nextPanel) {
    return;
  }

  panels.forEach((panel) => {
    const isActive = panel === nextPanel;
    panel.classList.toggle('is-active', isActive);
    panel.hidden = !isActive;
  });

  sectionButtons.forEach((button) => {
    const isActive = button.dataset.target === nextPanel.id;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  if (updateHash) {
    window.history.replaceState(null, '', `#${nextPanel.id}`);
  }
};

const setProjectFilter = (filter) => {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  projectCards.forEach((card) => {
    const matches = filter === 'all' || card.dataset.category === filter;
    card.classList.toggle('is-hidden', !matches);
  });
};

sectionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setActivePanel(button.dataset.target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const targetId = link.getAttribute('href')?.slice(1);

  if (!targetId || !getPanelById(targetId)) {
    return;
  }

  link.addEventListener('click', (event) => {
    event.preventDefault();
    setActivePanel(targetId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setProjectFilter(button.dataset.filter);
  });
});

sidebarToggle?.addEventListener('click', () => {
  const expanded = sidebarToggle.getAttribute('aria-expanded') === 'true';
  updateSidebarState(!expanded);
});

const handleViewportChange = () => {
  const expanded = sidebar?.classList.contains('is-open') ?? false;
  updateSidebarState(expanded);
};

if (typeof desktopQuery.addEventListener === 'function') {
  desktopQuery.addEventListener('change', handleViewportChange);
} else {
  desktopQuery.addListener(handleViewportChange);
}

window.addEventListener('hashchange', () => {
  const hashPanelId = window.location.hash.replace('#', '');

  if (getPanelById(hashPanelId)) {
    setActivePanel(hashPanelId, { updateHash: false });
  }
});

const initialPanelId = window.location.hash.replace('#', '') || panels[0]?.id;

setActivePanel(initialPanelId, { updateHash: Boolean(window.location.hash) });
setProjectFilter('all');
updateSidebarState(false);

window.requestAnimationFrame(() => {
  document.body.classList.add('is-ready');
});
