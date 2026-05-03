'use strict';

const createVerticalScrollProgressStyles = () => {
  if (document.querySelector('[data-vertical-scroll-progress-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-vertical-scroll-progress-style', 'true');
  style.textContent = `
    .vertical-scroll-progress {
      position: fixed;
      top: 50%;
      right: max(0.72rem, env(safe-area-inset-right));
      z-index: 110;
      width: 4px;
      height: min(42vh, 320px);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.095);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow:
        0 16px 40px rgba(0, 0, 0, 0.28),
        inset 0 0 0 1px rgba(255, 255, 255, 0.035);
      overflow: hidden;
      transform: translateY(-50%);
      pointer-events: none;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }

    .vertical-scroll-progress__bar {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: 0%;
      border-radius: inherit;
      background: linear-gradient(180deg, var(--accent), var(--secondary));
      box-shadow:
        0 0 18px rgba(var(--accent-rgb), 0.55),
        0 0 34px rgba(var(--secondary-rgb), 0.22);
      transition: height 90ms linear;
    }

    .vertical-scroll-progress__dot {
      position: absolute;
      left: 50%;
      top: 0%;
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: var(--accent-strong);
      box-shadow:
        0 0 0 5px rgba(var(--accent-rgb), 0.12),
        0 0 22px rgba(var(--accent-rgb), 0.58);
      transform: translate(-50%, -50%);
      transition: top 90ms linear;
    }

    @media (max-width: 760px) {
      .vertical-scroll-progress {
        right: max(0.42rem, env(safe-area-inset-right));
        width: 3px;
        height: min(34vh, 230px);
        opacity: 0.74;
      }

      .vertical-scroll-progress__dot {
        width: 9px;
        height: 9px;
      }
    }

    @media (max-width: 430px) {
      .vertical-scroll-progress {
        right: max(0.28rem, env(safe-area-inset-right));
        opacity: 0.62;
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
    <span class="vertical-scroll-progress__dot" data-vertical-scroll-progress-dot></span>
  `;

  document.body.appendChild(progress);
  return progress;
};

const updateVerticalScrollProgress = () => {
  const bar = document.querySelector('[data-vertical-scroll-progress-bar]');
  const dot = document.querySelector('[data-vertical-scroll-progress-dot]');
  if (!bar || !dot) return;

  const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
  const percentage = `${progress * 100}%`;

  bar.style.height = percentage;
  dot.style.top = percentage;
};

const initVerticalScrollProgress = () => {
  createVerticalScrollProgressStyles();
  createVerticalScrollProgress();
  updateVerticalScrollProgress();

  let ticking = false;
  const requestUpdate = () => {
    if (ticking) return;

    ticking = true;
    window.requestAnimationFrame(() => {
      updateVerticalScrollProgress();
      ticking = false;
    });
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('load', updateVerticalScrollProgress);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVerticalScrollProgress);
} else {
  initVerticalScrollProgress();
}
