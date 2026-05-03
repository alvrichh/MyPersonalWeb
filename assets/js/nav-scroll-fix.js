'use strict';

const MOBILE_BREAKPOINT = 760;

const getScrollTarget = (targetId) => {
  const panel = document.getElementById(targetId);
  if (panel) return panel;

  return document.querySelector('.content-stack') || document.querySelector('.main-stage');
};

const getTopOffset = () => {
  const topbar = document.querySelector('.topbar');
  const isSticky = topbar && getComputedStyle(topbar).position === 'sticky';

  return isSticky ? topbar.getBoundingClientRect().height + 18 : 14;
};

const scrollToActiveContent = (targetId) => {
  if (window.innerWidth > MOBILE_BREAKPOINT) return;

  const target = getScrollTarget(targetId);
  if (!target) return;

  window.requestAnimationFrame(() => {
    const top = target.getBoundingClientRect().top + window.scrollY - getTopOffset();

    window.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth',
    });
  });
};

const initMobileNavScrollFix = () => {
  document.addEventListener('click', (event) => {
    const navButton = event.target.closest('.nav-tab[data-target]');
    if (!navButton) return;

    const targetId = navButton.dataset.target;
    window.setTimeout(() => scrollToActiveContent(targetId), 80);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNavScrollFix);
} else {
  initMobileNavScrollFix();
}
