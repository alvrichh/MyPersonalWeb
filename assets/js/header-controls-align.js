'use strict';

const HEADER_CONTROLS_ALIGN_BREAKPOINT = 1032;

const alignHeaderControlsWithNav = () => {
  const controls = document.querySelector('.floating-controls');
  const firstNavButton = document.querySelector('.topbar .section-nav .nav-tab');

  if (!controls || !firstNavButton) return;

  if (window.innerWidth < HEADER_CONTROLS_ALIGN_BREAKPOINT) {
    controls.style.top = '';
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
