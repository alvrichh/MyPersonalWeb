'use strict';

const HEADER_CONTROLS_ALIGN_BREAKPOINT = 1032;
const HEADER_CONTROLS_STACKED_MAX = 1280;

const alignHeaderControlsWithNav = () => {
  const controls = document.querySelector('.floating-controls');
  const topbar = document.querySelector('.topbar');
  const firstNavButton = document.querySelector('.topbar .section-nav .nav-tab');

  if (!controls || !topbar || !firstNavButton) return;

  if (window.innerWidth < HEADER_CONTROLS_ALIGN_BREAKPOINT) {
    controls.style.top = '';
    return;
  }

  const topbarRect = topbar.getBoundingClientRect();
  const controlsRect = controls.getBoundingClientRect();

  if (window.innerWidth <= HEADER_CONTROLS_STACKED_MAX) {
    const centeredTop = topbarRect.top + ((topbarRect.height - controlsRect.height) / 2);
    controls.style.top = `${Math.round(centeredTop)}px`;
    return;
  }

  const navRect = firstNavButton.getBoundingClientRect();
  controls.style.top = `${Math.round(navRect.top)}px`;
};

const scheduleHeaderControlsAlign = () => {
  window.requestAnimationFrame(alignHeaderControlsWithNav);
};

const initHeaderControlsAlign = () => {
  alignHeaderControlsWithNav();
  window.addEventListener('resize', scheduleHeaderControlsAlign, { passive: true });
  window.addEventListener('scroll', scheduleHeaderControlsAlign, { passive: true });
  window.addEventListener('load', scheduleHeaderControlsAlign);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeaderControlsAlign);
} else {
  initHeaderControlsAlign();
}
