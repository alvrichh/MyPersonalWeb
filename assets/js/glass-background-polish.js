'use strict';

const createGlassBackgroundPolish = () => {
  if (document.querySelector('[data-glass-background-polish]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-glass-background-polish', 'true');
  style.textContent = `
    :root {
      --surface-high: rgba(34, 39, 47, 0.68);
      --surface-low: rgba(23, 26, 32, 0.76);
      --card-high: rgba(40, 45, 54, 0.52);
      --card-low: rgba(30, 35, 43, 0.66);
      --line: rgba(255, 255, 255, 0.13);
      --line-strong: rgba(255, 255, 255, 0.24);
      --shadow: 0 28px 90px rgba(0, 0, 0, 0.34);
    }

    body::before {
      opacity: 0.075;
      background-size: 380px;
    }

    body::after {
      background:
        radial-gradient(circle at 50% 18%, rgba(var(--accent-rgb), 0.055), transparent 32%),
        linear-gradient(180deg, rgba(7, 9, 12, 0.01) 0%, rgba(7, 9, 12, 0.18) 100%);
    }

    .page-glow {
      opacity: 0.74;
      filter: blur(82px);
    }

    .glow-one {
      background: rgba(var(--accent-rgb), 0.28);
    }

    .glow-two {
      background: rgba(var(--secondary-rgb), 0.24);
    }

    .card,
    .portrait-card,
    .picker-menu,
    .picker-trigger {
      backdrop-filter: blur(30px) saturate(1.22);
      -webkit-backdrop-filter: blur(30px) saturate(1.22);
    }

    .card {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.015)),
        linear-gradient(180deg, var(--surface-high) 0%, var(--surface-low) 100%);
      box-shadow:
        var(--shadow),
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        inset 0 -1px 0 rgba(255, 255, 255, 0.025);
    }

    .topbar.card {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.018)),
        linear-gradient(180deg, rgba(34, 39, 47, 0.58), rgba(23, 26, 32, 0.68));
    }

    .sidebar.card {
      background:
        radial-gradient(circle at 18% 12%, rgba(var(--accent-rgb), 0.095), transparent 34%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.014)),
        linear-gradient(180deg, rgba(34, 39, 47, 0.64), rgba(23, 26, 32, 0.72));
    }

    .panel.card {
      background:
        radial-gradient(circle at 95% 0%, rgba(var(--secondary-rgb), 0.075), transparent 28%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.012)),
        linear-gradient(180deg, rgba(34, 39, 47, 0.62), rgba(23, 26, 32, 0.74));
    }

    .meta-item,
    .feature-card,
    .mini-card,
    .project-card,
    .channel-card,
    .control-group {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.012)),
        linear-gradient(180deg, var(--card-high) 0%, var(--card-low) 100%);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.055),
        0 18px 48px rgba(0, 0, 0, 0.16);
    }

    .sidebar-note,
    .contact-toggle,
    .btn-secondary,
    .nav-tab,
    .filter-chip,
    .toggle-row,
    .picker-option {
      background: rgba(255, 255, 255, 0.055);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
    }

    .portrait-card {
      background:
        radial-gradient(circle at top left, rgba(var(--accent-rgb), 0.2), transparent 34%),
        radial-gradient(circle at bottom right, rgba(var(--secondary-rgb), 0.12), transparent 34%),
        linear-gradient(180deg, rgba(38, 42, 50, 0.66), rgba(22, 25, 31, 0.76));
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        0 20px 58px rgba(0, 0, 0, 0.24);
    }

    .metric-card {
      background: rgba(11, 16, 24, 0.64);
      backdrop-filter: blur(22px) saturate(1.18);
      -webkit-backdrop-filter: blur(22px) saturate(1.18);
      border-color: rgba(255, 255, 255, 0.16);
    }

    .project-media {
      background-color: rgba(255, 255, 255, 0.025);
    }

    @media (max-width: 760px) {
      :root {
        --surface-high: rgba(34, 39, 47, 0.72);
        --surface-low: rgba(23, 26, 32, 0.8);
        --card-high: rgba(40, 45, 54, 0.56);
        --card-low: rgba(30, 35, 43, 0.7);
      }

      body::before {
        opacity: 0.06;
        background-size: 320px;
      }

      .card,
      .portrait-card,
      .picker-menu,
      .picker-trigger {
        backdrop-filter: blur(24px) saturate(1.16);
        -webkit-backdrop-filter: blur(24px) saturate(1.16);
      }
    }
  `;

  document.head.appendChild(style);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createGlassBackgroundPolish);
} else {
  createGlassBackgroundPolish();
}
