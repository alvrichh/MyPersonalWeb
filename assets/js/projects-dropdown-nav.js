'use strict';

const PROJECTS_DROPDOWN_SELECTOR = '[data-projects-dropdown]';

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
    .projects-dropdown {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .projects-dropdown-trigger {
      min-height: var(--nav-tab-height, 3rem);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: .48rem;
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 999px;
      padding: .72rem 1rem;
      color: var(--text, #fff);
      background: rgba(255,255,255,.055);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
      font: inherit;
      font-weight: 800;
      line-height: 1;
      white-space: nowrap;
      cursor: pointer;
      transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
    }

    .projects-dropdown-trigger:hover,
    .projects-dropdown-trigger:focus-visible,
    .projects-dropdown.is-open .projects-dropdown-trigger {
      transform: translateY(-1px);
      border-color: rgba(112,225,161,.36);
      background: rgba(255,255,255,.085);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 18px 40px rgba(0,0,0,.16);
    }

    .projects-dropdown-label {
      display: inline-flex;
      align-items: center;
      gap: .42rem;
    }

    .projects-dropdown-label::before {
      content: "";
      width: .45rem;
      height: .45rem;
      border-radius: 999px;
      background: var(--accent, #70e1a1);
      box-shadow: 0 0 0 5px rgba(112,225,161,.12);
    }

    .projects-dropdown-chevron {
      display: inline-grid;
      place-items: center;
      opacity: .75;
      transition: transform .2s ease;
    }

    .projects-dropdown.is-open .projects-dropdown-chevron {
      transform: rotate(180deg);
    }

    .projects-dropdown-menu {
      position: absolute;
      z-index: 60;
      right: 0;
      top: calc(100% + .55rem);
      min-width: min(18rem, 84vw);
      display: grid;
      gap: .45rem;
      padding: .55rem;
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 1.25rem;
      background:
        radial-gradient(circle at 10% 0%, rgba(112,225,161,.14), transparent 38%),
        linear-gradient(135deg, rgba(20,29,44,.94), rgba(9,13,22,.94));
      box-shadow: 0 28px 70px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.08);
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
      gap: .75rem;
      min-height: 3.45rem;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: .95rem;
      padding: .62rem .72rem;
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
      width: 2.25rem;
      height: 2.25rem;
      display: inline-grid;
      place-items: center;
      border-radius: .8rem;
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
      font-size: .92rem;
      line-height: 1.05;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .projects-dropdown-copy span {
      display: block;
      color: var(--text-muted, rgba(255,255,255,.62));
      font-size: .74rem;
      line-height: 1.1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .projects-dropdown-arrow {
      opacity: .58;
    }

    .projects-dropdown-source-link {
      display: none !important;
    }

    @media (max-width: 760px) {
      .projects-dropdown {
        width: auto;
      }

      .projects-dropdown-trigger {
        min-height: 2.85rem;
        padding: .68rem .88rem;
      }

      .projects-dropdown-menu {
        right: auto;
        left: 0;
        min-width: min(18rem, 88vw);
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
      label: planningLink.textContent?.trim() || 'Planning OS',
      description: 'Bubble agenda',
      href: planningLink.getAttribute('href') || './planning.html',
      icon: 'sparkles-outline',
      source: planningLink,
    },
    lifeLink && {
      key: 'life',
      label: lifeLink.textContent?.trim() || 'Life',
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

const closeProjectsDropdown = () => {
  const dropdown = document.querySelector(PROJECTS_DROPDOWN_SELECTOR);
  if (!dropdown) return;

  const trigger = dropdown.querySelector('[data-projects-toggle]');
  const menu = dropdown.querySelector('[data-projects-menu]');

  dropdown.classList.remove('is-open');
  trigger?.setAttribute('aria-expanded', 'false');
  if (menu) menu.hidden = true;
};

const toggleProjectsDropdown = () => {
  const dropdown = document.querySelector(PROJECTS_DROPDOWN_SELECTOR);
  if (!dropdown) return;

  const trigger = dropdown.querySelector('[data-projects-toggle]');
  const menu = dropdown.querySelector('[data-projects-menu]');
  const isOpen = !dropdown.classList.contains('is-open');

  dropdown.classList.toggle('is-open', isOpen);
  trigger?.setAttribute('aria-expanded', String(isOpen));
  if (menu) menu.hidden = !isOpen;
};

const renderProjectsDropdownItems = () => {
  const menu = document.querySelector('[data-projects-menu]');
  if (!menu) return;

  const items = getProjectItems();
  menu.innerHTML = items.map((item) => `
    <a class="projects-dropdown-item" href="${item.href}" data-project-key="${item.key}">
      <span class="projects-dropdown-icon" aria-hidden="true">
        <ion-icon name="${item.icon}"></ion-icon>
      </span>
      <span class="projects-dropdown-copy">
        <strong>${item.label}</strong>
        <span>${item.description}</span>
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

const createProjectsDropdown = () => {
  const sectionNav = document.querySelector('.section-nav');
  if (!sectionNav) return;

  let dropdown = document.querySelector(PROJECTS_DROPDOWN_SELECTOR);
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
      <div class="projects-dropdown-menu" data-projects-menu hidden></div>
    `;

    sectionNav.appendChild(dropdown);

    dropdown.querySelector('[data-projects-toggle]')?.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleProjectsDropdown();
    });

    dropdown.addEventListener('click', (event) => {
      event.stopPropagation();
      if (event.target.closest('.projects-dropdown-item')) closeProjectsDropdown();
    });
  }

  renderProjectsDropdownItems();
};

const initProjectsDropdown = () => {
  ensureProjectsDropdownStyles();
  createProjectsDropdown();

  document.addEventListener('click', closeProjectsDropdown);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeProjectsDropdown();
  });

  const sectionNav = document.querySelector('.section-nav');
  if (!sectionNav) return;

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(renderProjectsDropdownItems);
  });

  observer.observe(sectionNav, { childList: true, subtree: false });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectsDropdown);
} else {
  initProjectsDropdown();
}
