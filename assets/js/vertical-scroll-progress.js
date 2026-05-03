'use strict';

const PROGRESS_SECTION_IDS = ['about', 'focus', 'work', 'contact'];

const getProgressSectionLabel = (id) => {
  const navButton = document.querySelector(`.nav-tab[data-target="${id}"]`);
  const heading = document.querySelector(`#${id} .panel-heading h2`);

  return navButton?.textContent?.trim() || heading?.textContent?.trim() || id;
};

const getSectionScrollPercent = (section) => {
  const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const targetTop = section.getBoundingClientRect().top + window.scrollY;
  return Math.min(100, Math.max(0, (targetTop / scrollable) * 100));
};

const createVerticalScrollProgressStyles = () => {
  if (document.querySelector('[data-vertical-scroll-progress-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-vertical-scroll-progress-style', 'true');
  style.textContent = `
    .vertical-scroll-progress {
      position: fixed;
      top: max(0.55rem, env(safe-area-inset-top));
      left: 50%;
      z-index: 130;
      width: min(520px, calc(100vw - 2rem));
      height: 5px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.095);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow:
        0 16px 40px rgba(0, 0, 0, 0.24),
        inset 0 0 0 1px rgba(255, 255, 255, 0.035);
      transform: translateX(-50%);
      pointer-events: none;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }

    .vertical-scroll-progress__bar {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 0%;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--accent), var(--secondary));
      box-shadow:
        0 0 18px rgba(var(--accent-rgb), 0.55),
        0 0 34px rgba(var(--secondary-rgb), 0.22);
      transition: width 90ms linear;
      overflow: hidden;
    }

    .vertical-scroll-progress__dot {
      position: absolute;
      left: 0%;
      top: 50%;
      width: 13px;
      height: 13px;
      border-radius: 999px;
      background: var(--accent-strong);
      box-shadow:
        0 0 0 5px rgba(var(--accent-rgb), 0.12),
        0 0 22px rgba(var(--accent-rgb), 0.58);
      transform: translate(-50%, -50%);
      transition: left 90ms linear;
      z-index: 3;
    }

    .vertical-scroll-progress__sections {
      position: absolute;
      inset: 0;
      z-index: 2;
      overflow: visible;
    }

    .vertical-scroll-progress__section-dot {
      position: absolute;
      top: 50%;
      width: 9px;
      height: 9px;
      border: 1px solid rgba(255,255,255,.42);
      border-radius: 999px;
      background: rgba(8,13,22,.92);
      box-shadow: 0 0 0 4px rgba(255,255,255,.035);
      transform: translate(-50%, -50%);
      transition: transform .18s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease;
    }

    .vertical-scroll-progress__section-dot.is-active {
      background: var(--accent-strong);
      border-color: rgba(255,255,255,.8);
      transform: translate(-50%, -50%) scale(1.22);
      box-shadow:
        0 0 0 6px rgba(var(--accent-rgb), .14),
        0 0 22px rgba(var(--accent-rgb), .48);
    }

    .vertical-scroll-progress__bubble {
      position: absolute;
      left: 0%;
      top: calc(100% + .85rem);
      max-width: 12rem;
      padding: .48rem .68rem;
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 999px;
      color: var(--text);
      background:
        linear-gradient(180deg, rgba(255,255,255,.11), rgba(255,255,255,.045)),
        rgba(8, 13, 22, .82);
      box-shadow:
        0 18px 48px rgba(0,0,0,.32),
        inset 0 1px 0 rgba(255,255,255,.08);
      backdrop-filter: blur(20px) saturate(1.2);
      -webkit-backdrop-filter: blur(20px) saturate(1.2);
      font-size: .78rem;
      font-weight: 900;
      line-height: 1;
      white-space: nowrap;
      transform: translateX(-50%) translateY(-4px) scale(.96);
      opacity: 0;
      transition: left .18s ease, opacity .18s ease, transform .18s ease;
      pointer-events: none;
    }

    .vertical-scroll-progress__bubble::after {
      content: "";
      position: absolute;
      left: 50%;
      bottom: calc(100% - 1px);
      width: .55rem;
      height: .55rem;
      border-left: 1px solid rgba(255,255,255,.15);
      border-top: 1px solid rgba(255,255,255,.15);
      background: rgba(8, 13, 22, .82);
      transform: translateX(-50%) rotate(45deg);
    }

    .vertical-scroll-progress__bubble.is-visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
    }

    @media (max-width: 760px) {
      .vertical-scroll-progress {
        top: max(0.42rem, env(safe-area-inset-top));
        width: min(270px, calc(100vw - 5.5rem));
        height: 4px;
        opacity: 0.8;
      }

      .vertical-scroll-progress__dot {
        width: 10px;
        height: 10px;
      }

      .vertical-scroll-progress__section-dot {
        width: 7px;
        height: 7px;
      }

      .vertical-scroll-progress__bubble {
        top: calc(100% + .7rem);
        font-size: .72rem;
        max-width: 9rem;
      }
    }

    @media (max-width: 430px) {
      .vertical-scroll-progress {
        width: min(230px, calc(100vw - 5.1rem));
        opacity: 0.7;
      }
    }
  `;

  document.head.appendChild(style);
};

const createVerticalScrollProgress = () => {
  let progress = document.querySelector('[data-vertical-scroll-progress]');
  if (progress) return progress;

  progress = document.createElement('div');
  progress.className = 'vertical-scroll-progress';
  progress.setAttribute('data-vertical-scroll-progress', 'true');
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = `
    <span class="vertical-scroll-progress__bar" data-vertical-scroll-progress-bar></span>
    <span class="vertical-scroll-progress__sections" data-vertical-scroll-progress-sections></span>
    <span class="vertical-scroll-progress__dot" data-vertical-scroll-progress-dot></span>
    <span class="vertical-scroll-progress__bubble" data-vertical-scroll-progress-bubble></span>
  `;

  document.body.appendChild(progress);
  return progress;
};

const renderSectionDots = () => {
  const sectionsLayer = document.querySelector('[data-vertical-scroll-progress-sections]');
  if (!sectionsLayer) return;

  sectionsLayer.innerHTML = PROGRESS_SECTION_IDS.map((id) => {
    const section = document.getElementById(id);
    if (!section) return '';

    const left = getSectionScrollPercent(section);
    const label = getProgressSectionLabel(id);
    return `<span class="vertical-scroll-progress__section-dot" data-progress-section="${id}" aria-label="${label}" style="left:${left}%"></span>`;
  }).join('');
};

let activeSectionId = 'about';
let bubbleTimer;

const setActiveProgressSection = (sectionId, label = getProgressSectionLabel(sectionId), forceVisible = false) => {
  activeSectionId = sectionId;

  const bubble = document.querySelector('[data-vertical-scroll-progress-bubble]');
  const dot = document.querySelector(`[data-progress-section="${sectionId}"]`);

  document.querySelectorAll('[data-progress-section]').forEach((node) => {
    node.classList.toggle('is-active', node.dataset.progressSection === sectionId);
  });

  if (!bubble || !dot) return;

  const left = dot.style.left || '0%';
  bubble.textContent = label;
  bubble.style.left = left;
  bubble.classList.add('is-visible');

  window.clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => {
    if (!forceVisible) bubble.classList.remove('is-visible');
  }, 1400);
};

const inferCurrentSection = () => {
  const viewportPoint = window.scrollY + window.innerHeight * 0.34;
  let current = PROGRESS_SECTION_IDS[0];

  PROGRESS_SECTION_IDS.forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return;

    const top = section.getBoundingClientRect().top + window.scrollY;
    if (top <= viewportPoint) current = id;
  });

  return current;
};

const updateVerticalScrollProgress = () => {
  const bar = document.querySelector('[data-vertical-scroll-progress-bar]');
  const dot = document.querySelector('[data-vertical-scroll-progress-dot]');
  if (!bar || !dot) return;

  const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
  const percentage = `${progress * 100}%`;

  bar.style.width = percentage;
  dot.style.left = percentage;

  const current = inferCurrentSection();
  if (current && current !== activeSectionId) {
    setActiveProgressSection(current, getProgressSectionLabel(current));
  }
};

const initVerticalScrollProgress = () => {
  createVerticalScrollProgressStyles();
  createVerticalScrollProgress();
  renderSectionDots();
  updateVerticalScrollProgress();
  setActiveProgressSection(activeSectionId, getProgressSectionLabel(activeSectionId), true);

  let ticking = false;
  const requestUpdate = () => {
    if (ticking) return;

    ticking = true;
    window.requestAnimationFrame(() => {
      renderSectionDots();
      updateVerticalScrollProgress();
      ticking = false;
    });
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('load', () => {
    renderSectionDots();
    updateVerticalScrollProgress();
  });

  window.addEventListener('alvrich:section-change', (event) => {
    const sectionId = event.detail?.sectionId;
    const label = event.detail?.label || getProgressSectionLabel(sectionId);
    if (!sectionId) return;

    window.requestAnimationFrame(() => {
      renderSectionDots();
      setActiveProgressSection(sectionId, label, true);
    });
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVerticalScrollProgress);
} else {
  initVerticalScrollProgress();
}
