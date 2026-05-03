'use strict';

const getGymFocusTarget = (viewId) => {
  const view = document.getElementById(viewId);
  if (!view) return null;

  return view.querySelector('.today, .card, .day') || view;
};

const focusGymViewContent = (viewId) => {
  const target = getGymFocusTarget(viewId);
  if (!target) return;

  const bottomTabs = document.querySelector('.tabs');
  const topPadding = window.innerWidth <= 700 ? 10 : 16;
  const targetTop = target.getBoundingClientRect().top + window.scrollY - topPadding;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  window.scrollTo({
    top: Math.max(0, Math.min(targetTop, maxScroll)),
    behavior: 'smooth',
  });

  if (bottomTabs) {
    bottomTabs.setAttribute('aria-live', 'polite');
  }
};

const patchGymSwitchViewFocus = () => {
  if (typeof window.switchView !== 'function' || window.switchView.__gymFocusPatched) return;

  const originalSwitchView = window.switchView;

  window.switchView = function patchedGymSwitchView(viewId, ...args) {
    const result = originalSwitchView.call(this, viewId, ...args);

    window.requestAnimationFrame(() => {
      window.setTimeout(() => focusGymViewContent(viewId), 90);
    });

    return result;
  };

  window.switchView.__gymFocusPatched = true;
};

const hookGymFocusFallback = () => {
  if (document.body?.dataset?.gymFocusHooked === 'true') return;
  if (document.body) document.body.dataset.gymFocusHooked = 'true';

  document.addEventListener('click', (event) => {
    const control = event.target.closest('.tab[data-view], [data-go]');
    if (!control) return;

    const viewId = control.dataset.view || control.dataset.go;
    if (!viewId) return;

    window.requestAnimationFrame(() => {
      window.setTimeout(() => focusGymViewContent(viewId), 140);
    });
  });
};

const initGymViewFocus = () => {
  patchGymSwitchViewFocus();
  hookGymFocusFallback();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGymViewFocus);
} else {
  initGymViewFocus();
}
