'use strict';

const SECTION_IDS = ['about', 'focus', 'work', 'contact'];

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
      position: fixed;
      left: 50%;
      bottom: calc(1.15rem + env(safe-area-inset-bottom));
      z-index: 120;
      max-width: min(calc(100vw - 2rem), 420px);
      display: inline-flex;
      align-items: center;
      gap: .62rem;
      padding: .76rem 1rem;
      border-radius: 999px;
      color: var(--text);
      border: 1px solid rgba(255,255,255,.16);
      background:
        linear-gradient(180deg, rgba(255,255,255,.105), rgba(255,255,255,.045)),
        rgba(8, 13, 22, .74);
      box-shadow:
        0 18px 52px rgba(0,0,0,.32),
        inset 0 1px 0 rgba(255,255,255,.08);
      backdrop-filter: blur(22px) saturate(1.22);
      -webkit-backdrop-filter: blur(22px) saturate(1.22);
      transform: translate(-50%, 18px) scale(.97);
      opacity: 0;
      pointer-events: none;
      transition: opacity .18s ease, transform .18s ease;
    }

    .section-toast.is-visible {
      opacity: 1;
      transform: translate(-50%, 0) scale(1);
    }

    .section-toast-dot {
      width: .62rem;
      height: .62rem;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--accent), var(--secondary));
      box-shadow: 0 0 0 6px rgba(var(--accent-rgb), .12);
      flex: 0 0 auto;
    }

    .section-toast-copy {
      display: grid;
      gap: .02rem;
      min-width: 0;
    }

    .section-toast-kicker {
      color: var(--text-soft);
      font-size: .68rem;
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: .13em;
      font-weight: 900;
    }

    .section-toast-title {
      color: var(--text);
      font-weight: 900;
      font-size: .92rem;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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

      .section-toast {
        bottom: calc(5.65rem + env(safe-area-inset-bottom));
      }
    }
  `;

  document.head.appendChild(style);
};

const createToast = () => {
  let toast = document.querySelector('[data-section-toast]');
  if (toast) return toast;

  toast = document.createElement('div');
  toast.className = 'section-toast';
  toast.setAttribute('data-section-toast', 'true');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <span class="section-toast-dot" aria-hidden="true"></span>
    <span class="section-toast-copy">
      <span class="section-toast-kicker">Sección</span>
      <strong class="section-toast-title" data-section-toast-title></strong>
    </span>
  `;

  document.body.appendChild(toast);
  return toast;
};

let toastTimer;
const showSectionToast = (sectionId) => {
  const toast = createToast();
  const title = toast.querySelector('[data-section-toast-title]');
  if (title) title.textContent = getSectionLabel(sectionId);

  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 1500);
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
};

const scrollToSection = (sectionId) => {
  const section = document.getElementById(sectionId);
  if (!section) return;

  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setActiveNav(sectionId);
  showSectionToast(sectionId);
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
    showSectionToast(currentSection);
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
  });
};

const initScrollExperience = () => {
  document.body.classList.add('scroll-experience');
  createScrollExperienceStyles();
  createToast();
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
