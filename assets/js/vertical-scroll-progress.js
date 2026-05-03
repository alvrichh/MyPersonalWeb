'use strict';

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
      overflow: hidden;
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
    }

    @media (max-width: 760px) {
      .vertical-scroll-progress {
        top: max(0.42rem, env(safe-area-inset-top));
        width: min(270px, calc(100vw - 5.5rem));
        height: 4px;
        opacity: 0.78;
      }

      .vertical-scroll-progress__dot {
        width: 10px;
        height: 10px;
      }
    }

    @media (max-width: 430px) {
      .vertical-scroll-progress {
        width: min(230px, calc(100vw - 5.1rem));
        opacity: 0.68;
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

  bar.style.width = percentage;
  dot.style.left = percentage;
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
