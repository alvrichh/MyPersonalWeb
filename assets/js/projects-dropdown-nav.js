'use strict';

const PROJECTS_DROPDOWN_SELECTOR = '[data-projects-dropdown]';
const PROJECTS_MENU_SELECTOR = '[data-projects-menu]';

const projectFallbacks = [
  {
    key: 'planning',
    label: 'Planning OS',
    description: 'Bubble agenda',
    href: './planning.html',
    icon: 'sparkles-outline',
  },
  {
    key: 'life',
    label: 'Life',
    description: 'Gym tracker',
    href: './gym.html',
    icon: 'barbell-outline',
  },
];

const ensureProjectsDropdownStyles = () => {
  if (document.querySelector('[data-projects-dropdown-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-projects-dropdown-style', 'true');
  style.textContent = `
    .topbar.card,
    .section-nav {
      overflow: visible !important;
    }

    .projects-dropdown {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      z-index: 4;
    }

    .projects-dropdown-trigger {
      min-height: var(--nav-tab-height, 3rem);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: .38rem;
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 999px;
      padding: .68rem .82rem;
      color: var(--text, #fff);
      background: rgba(255,255,255,.045);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.055);
      font: inherit;
      font-size: .92rem;
      font-weight: 700;
      line-height: 1;
      white-space: nowrap;
      cursor: pointer;
      transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
    }

    .projects-dropdown-trigger:hover,
    .projects-dropdown-trigger:focus-visible,
    .projects-dropdown.is-open .projects-dropdown-trigger {
      transform: translateY(-1px);
      border-color: rgba(112,225,161,.28);
      background: rgba(255,255,255,.07);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.07), 0 14px 32px rgba(0,0,0,.12);
    }

    .projects-dropdown-label {
      display: inline-flex;
      align-items: center;
    }

    .projects-dropdown-label::before {
      content: none !important;
      display: none !important;
    }

    .projects-dropdown-chevron {
      display: inline-grid;
      place-items: center;
      opacity: .68;
      transition: transform .2s ease;
    }

    .projects-dropdown.is-open .projects-dropdown-chevron {
      transform: rotate(180deg);
    }

    .projects-dropdown-menu {
      position: fixed;
      z-index: 9999;
      min-width: min(17rem, 86vw);
      display: grid;
      gap: .45rem;
      padding: .55rem;
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 1.2rem;
      background:
        radial-gradient(circle at 10% 0%, rgba(112,225,161,.14), transparent 38%),
        linear-gradient(135deg, rgba(20,29,44,.96), rgba(9,13,22,.96));
      box-shadow: 0 28px 70px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.08);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
    }

    .projects-dropdown-menu[hidden] {
      display: none;
    }

    .projects-dropdown-item {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: .68rem;
      min-height: 3.35rem;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: .95rem;
      padding: .58rem .68rem;
      color: var(--text, #fff);
      text-decoration: none;
      background: rgba(255,255,255,.045);
      transition: transform .18s ease, border-color .18s ease, background .18s ease;
    }

    .projects-dropdown-item:hover,
    .projects-dropdown-item:focus-visible {
      transform: translateY(-1px);
      border-color: rgba(112,225,161,.34);
      background: rgba(255,255,255,.075);
    }

    .projects-dropdown-icon {
      width: 2.15rem;
      height: 2.15rem;
      display: inline-grid;
      place-items: center;
      border-radius: .78rem;
      background: rgba(112,225,161,.13);
      color: var(--accent, #70e1a1);
    }

    .projects-dropdown-copy {
      min-width: 0;
      display: grid;
      gap: .14rem;
    }

    .projects-dropdown-copy strong {
      display: block;
      color: var(--text, #fff);
      font-size: .9rem;
      line-height: 1.05;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .projects-dropdown-copy span {
      display: block;
      color: var(--text-muted, rgba(255,255,255,.62));
      font-size: .72rem;
      line-height: 1.1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .projects-dropdown-arrow {
      opacity: .55;
    }

    .projects-dropdown-source-link {
      display: none !important;
    }

    @media (max-width: 760px) {
      .projects-dropdown-trigger {
        min-height: 2.85rem;
        padding: .66rem .78rem;
        font-size: .9rem;
      }
    }
  `;

  document.head.appendChild(style);
};

const getExistingProjectLinks = () => {
  const planningLink = document.querySelector('[data-planning-nav-link]');
  const lifeLink = document.querySelector('[data-gym-nav-link]');

  return [
    planningLink && {
      key: 'planning',
      label: 'Planning OS',
      description: 'Bubble agenda',
      href: planningLink.getAttribute('href') || './planning.html',
      icon: 'sparkles-outline',
      source: planningLink,
    },
    lifeLink && {
      key: 'life',
      label: 'Life',
      description: 'Gym tracker',
      href: lifeLink.getAttribute('href') || './gym.html',
      icon: 'barbell-outline',
      source: lifeLink,
    },
  ].filter(Boolean);
};

const getProjectItems = () => {
  const existing = getExistingProjectLinks();
  const byKey = new Map();

  [...projectFallbacks, ...existing].forEach((item) => {
    byKey.set(item.key, { ...byKey.get(item.key), ...item });
  });

  return Array.from(byKey.values());
};

const getProjectsDropdown = () => document.querySelector(PROJECTS_DROPDOWN_SELECTOR);
const getProjectsMenu = () => document.querySelector(PROJECTS_MENU_SELECTOR);

const positionProjectsMenu = () => {
  const dropdown = getProjectsDropdown();
  const trigger = dropdown?.querySelector('[data-projects-toggle]');
  const menu = getProjectsMenu();
  if (!trigger || !menu || menu.hidden) return;

  const rect = trigger.getBoundingClientRect();
  const menuWidth = Math.min(272, window.innerWidth - 24);
  const left = Math.min(Math.max(12, rect.right - menuWidth), window.innerWidth - menuWidth - 12);
  const top = Math.min(rect.bottom + 8, window.innerHeight - 12);

  menu.style.width = `${menuWidth}px`;
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
};

const closeProjectsDropdown = () => {
  const dropdown = getProjectsDropdown();
  const menu = getProjectsMenu();
  if (!dropdown) return;

  const trigger = dropdown.querySelector('[data-projects-toggle]');

  dropdown.classList.remove('is-open');
  trigger?.setAttribute('aria-expanded', 'false');
  if (menu) menu.hidden = true;
};

const toggleProjectsDropdown = () => {
  const dropdown = getProjectsDropdown();
  const menu = getProjectsMenu();
  if (!dropdown || !menu) return;

  const trigger = dropdown.querySelector('[data-projects-toggle]');
  const isOpen = !dropdown.classList.contains('is-open');

  dropdown.classList.toggle('is-open', isOpen);
  trigger?.setAttribute('aria-expanded', String(isOpen));
  menu.hidden = !isOpen;

  if (isOpen) window.requestAnimationFrame(positionProjectsMenu);
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const renderProjectsDropdownItems = () => {
  const menu = getProjectsMenu();
  if (!menu) return;

  const items = getProjectItems();
  menu.innerHTML = items.map((item) => `
    <a class="projects-dropdown-item" href="${escapeHtml(item.href)}" data-project-key="${escapeHtml(item.key)}">
      <span class="projects-dropdown-icon" aria-hidden="true">
        <ion-icon name="${escapeHtml(item.icon)}"></ion-icon>
      </span>
      <span class="projects-dropdown-copy">
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.description)}</span>
      </span>
      <span class="projects-dropdown-arrow" aria-hidden="true">
        <ion-icon name="arrow-forward-outline"></ion-icon>
      </span>
    </a>
  `).join('');

  getExistingProjectLinks().forEach((item) => {
    item.source?.classList.add('projects-dropdown-source-link');
    item.source?.setAttribute('aria-hidden', 'true');
    item.source?.setAttribute('tabindex', '-1');
  });
};

const ensureProjectsMenu = () => {
  let menu = getProjectsMenu();
  if (menu) return menu;

  menu = document.createElement('div');
  menu.className = 'projects-dropdown-menu';
  menu.setAttribute('data-projects-menu', 'true');
  menu.hidden = true;
  document.body.appendChild(menu);

  menu.addEventListener('click', (event) => {
    event.stopPropagation();
    if (event.target.closest('.projects-dropdown-item')) closeProjectsDropdown();
  });

  return menu;
};

const createProjectsDropdown = () => {
  const sectionNav = document.querySelector('.section-nav');
  if (!sectionNav) return;

  let dropdown = getProjectsDropdown();
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.className = 'projects-dropdown';
    dropdown.setAttribute('data-projects-dropdown', 'true');
    dropdown.innerHTML = `
      <button class="projects-dropdown-trigger" type="button" data-projects-toggle aria-expanded="false" aria-haspopup="true">
        <span class="projects-dropdown-label">Projects</span>
        <span class="projects-dropdown-chevron" aria-hidden="true">
          <ion-icon name="chevron-down-outline"></ion-icon>
        </span>
      </button>
    `;

    const firstProjectLink = sectionNav.querySelector('[data-planning-nav-link], [data-gym-nav-link]');
    sectionNav.insertBefore(dropdown, firstProjectLink || null);

    dropdown.querySelector('[data-projects-toggle]')?.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleProjectsDropdown();
    });
  }

  ensureProjectsMenu();
  renderProjectsDropdownItems();
};

const initProjectsDropdown = () => {
  ensureProjectsDropdownStyles();
  createProjectsDropdown();

  document.addEventListener('click', closeProjectsDropdown);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeProjectsDropdown();
  });
  window.addEventListener('resize', positionProjectsMenu);
  window.addEventListener('scroll', positionProjectsMenu, true);

  const sectionNav = document.querySelector('.section-nav');
  if (!sectionNav) return;

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(() => {
      createProjectsDropdown();
      positionProjectsMenu();
    });
  });

  observer.observe(sectionNav, { childList: true, subtree: false });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectsDropdown);
} else {
  initProjectsDropdown();
}
