'use strict';

const revealSelectors = [
  '.panel-heading',
  '.intro-copy',
  '.intro-visual',
  '.feature-card',
  '.mini-card',
  '.timeline-item',
  '.project-card',
  '.channel-card',
  '.contact-copy-block',
  '.meta-item',
];

const createPremiumScrollPolishStyles = () => {
  if (document.querySelector('[data-premium-scroll-polish-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-premium-scroll-polish-style', 'true');
  style.textContent = `
    body.premium-scroll-polish .content-stack {
      gap: clamp(1.25rem, 3vw, 2.15rem);
    }

    body.premium-scroll-polish .panel {
      position: relative;
      overflow: hidden;
    }

    body.premium-scroll-polish .panel::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      background:
        radial-gradient(circle at 12% 0%, rgba(var(--accent-rgb), .08), transparent 28%),
        radial-gradient(circle at 100% 18%, rgba(var(--secondary-rgb), .06), transparent 32%);
      opacity: .9;
    }

    body.premium-scroll-polish .panel > * {
      position: relative;
      z-index: 1;
    }

    body.premium-scroll-polish .filter-row {
      margin-bottom: clamp(1rem, 2.5vw, 1.45rem);
    }

    .alvrich-manifesto {
      margin-bottom: 1.3rem;
      padding: clamp(1.15rem, 3vw, 1.8rem);
      border-radius: clamp(24px, 4vw, 36px);
      border: 1px solid rgba(255,255,255,.14);
      background:
        radial-gradient(circle at 0% 0%, rgba(var(--accent-rgb), .16), transparent 34%),
        radial-gradient(circle at 100% 12%, rgba(var(--secondary-rgb), .12), transparent 34%),
        linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02));
      box-shadow:
        0 28px 80px rgba(0,0,0,.25),
        inset 0 1px 0 rgba(255,255,255,.08);
      backdrop-filter: blur(24px) saturate(1.2);
      -webkit-backdrop-filter: blur(24px) saturate(1.2);
    }

    .alvrich-manifesto__kicker {
      margin: 0 0 .8rem;
      color: var(--accent-strong);
      font-size: .76rem;
      font-weight: 900;
      letter-spacing: .18em;
      text-transform: uppercase;
    }

    .alvrich-manifesto__title {
      max-width: 13ch;
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(2.45rem, 8vw, 5.8rem);
      line-height: .91;
      letter-spacing: -.07em;
    }

    .alvrich-manifesto__title span {
      color: var(--accent);
    }

    .alvrich-manifesto__body {
      max-width: 64ch;
      margin: 1.15rem 0 0;
      color: var(--text-muted);
      font-size: clamp(1rem, 2vw, 1.18rem);
      line-height: 1.55;
    }

    .alvrich-manifesto__rail {
      display: flex;
      flex-wrap: wrap;
      gap: .58rem;
      margin-top: 1.15rem;
    }

    .alvrich-manifesto__rail span {
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 999px;
      padding: .52rem .75rem;
      background: rgba(255,255,255,.045);
      color: var(--text-muted);
      font-weight: 800;
      font-size: .88rem;
    }

    .premium-reveal {
      opacity: 0;
      transform: translateY(22px);
      transition:
        opacity .62s cubic-bezier(.22, 1, .36, 1),
        transform .62s cubic-bezier(.22, 1, .36, 1);
      transition-delay: var(--premium-delay, 0ms);
      will-change: opacity, transform;
    }

    .premium-reveal.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  document.head.appendChild(style);
};

const initPremiumScrollPolish = () => {
  document.body.classList.add('premium-scroll-polish');
  createPremiumScrollPolishStyles();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPremiumScrollPolish);
} else {
  initPremiumScrollPolish();
}
