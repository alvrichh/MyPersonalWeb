'use strict';

const SECTION_IDS = ['about', 'focus', 'work', 'cv', 'contact'];

const getSectionLabel = (id) => {
  const navButton = document.querySelector(`.nav-tab[data-target="${id}"]`);
  const heading = document.querySelector(`#${id} .panel-heading h2`);

  return navButton?.textContent?.trim() || heading?.textContent?.trim() || id;
};

const createScrollExperienceStyles = () => {
  if (document.querySelector('[data-scroll-experience-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-scroll-experience-style', 'true');
  style.textContent = `
    html {
      scroll-padding-top: 7.4rem;
    }

    body.scroll-experience .content-stack {
      gap: clamp(1rem, 2vw, 1.45rem);
    }

    body.scroll-experience .panel,
    body.scroll-experience .panel[hidden] {
      display: block !important;
    }

    body.scroll-experience .panel {
      scroll-margin-top: 7.4rem;
      opacity: 1;
      transform: none;
    }

    body.scroll-experience .panel + .panel {
      margin-top: .3rem;
    }

    body.scroll-experience .topbar {
      background:
        linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.015)),
        linear-gradient(180deg, rgba(22,28,38,.72), rgba(12,18,28,.66));
      backdrop-filter: blur(28px) saturate(1.2);
      -webkit-backdrop-filter: blur(28px) saturate(1.2);
    }

    body.scroll-experience .nav-tab.is-active {
      box-shadow: 0 10px 28px rgba(var(--accent-rgb), .16);
    }

    .section-toast {
      display: none !important;
    }

    @media (min-width: 980px) {
      body.scroll-experience .portfolio-shell {
        align-items: start;
      }

      body.scroll-experience .sidebar {
        position: sticky;
        top: 1rem;
      }
    }

    @media (max-width: 760px) {
      html {
        scroll-padding-top: 1rem;
      }

      body.scroll-experience .panel {
        scroll-margin-top: .9rem;
      }

      body.scroll-experience .content-stack {
        gap: 1rem;
      }

      body.scroll-experience .topbar {
        position: relative;
      }
    }
  `;

  document.head.appendChild(style);
};

const notifyProgressSection = (sectionId) => {
  window.dispatchEvent(new CustomEvent('alvrich:section-change', {
    detail: {
      sectionId,
      label: getSectionLabel(sectionId),
    },
  }));
};

const closeMobileMenuAfterNavigation = () => {
  window.dispatchEvent(new CustomEvent('alvrich:close-mobile-menu'));
};

const revealAllPanels = () => {
  SECTION_IDS.forEach((id) => {
    const panel = document.getElementById(id);
    if (!panel) return;

    panel.hidden = false;
    panel.classList.add('is-active');
    panel.setAttribute('data-scroll-section', 'true');
  });
};

const setActiveNav = (sectionId) => {
  document.querySelectorAll('.nav-tab[data-target]').forEach((button) => {
    const isActive = button.dataset.target === sectionId;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  notifyProgressSection(sectionId);
};

const scrollToSection = (sectionId) => {
  const section = document.getElementById(sectionId);
  if (!section) return;

  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setActiveNav(sectionId);
};

const interceptNavClicks = () => {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.nav-tab[data-target]');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    revealAllPanels();
    scrollToSection(button.dataset.target);

    if (button.closest('.mobile-vcard-nav')) {
      closeMobileMenuAfterNavigation();
    }
  }, true);
};

const observeSections = () => {
  const sections = SECTION_IDS
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!sections.length || !('IntersectionObserver' in window)) return;

  let currentSection = '';
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible?.target?.id || visible.target.id === currentSection) return;

    currentSection = visible.target.id;
    setActiveNav(currentSection);
  }, {
    root: null,
    threshold: [0.24, 0.38, 0.52],
    rootMargin: '-18% 0px -55% 0px',
  });

  sections.forEach((section) => observer.observe(section));
};

const patchHashLinks = () => {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const sectionId = link.getAttribute('href').slice(1);
    if (!SECTION_IDS.includes(sectionId)) return;

    event.preventDefault();
    revealAllPanels();
    scrollToSection(sectionId);
    if (link.closest('.mobile-vcard-nav')) {
      closeMobileMenuAfterNavigation();
    }
  });
};

const initScrollExperience = () => {
  document.body.classList.add('scroll-experience');
  createScrollExperienceStyles();
  document.querySelector('[data-section-toast]')?.remove();
  revealAllPanels();
  interceptNavClicks();
  patchHashLinks();
  window.requestAnimationFrame(() => {
    revealAllPanels();
    observeSections();
    setActiveNav('about');
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollExperience);
} else {
  initScrollExperience();
}
