'use strict';

const visualLabels = {
  react: ['State', 'UI', 'Route'],
  javascript: ['Build', 'DOM', 'Flow'],
  azure: ['Auth', 'Graph', 'Cloud'],
  python: ['API', 'Data', 'Jobs'],
  docker: ['Image', 'Ship', 'Cloud'],
};

const createVisualStyles = () => {
  if (document.querySelector('[data-portfolio-visual-upgrade-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-portfolio-visual-upgrade-style', 'true');
  style.textContent = `
    .portfolio-tech-media.is-upgraded {
      min-height: clamp(12rem, 27vw, 16.8rem);
      padding: 1rem;
      background:
        linear-gradient(90deg, rgba(255,255,255,.065) 1px, transparent 1px),
        linear-gradient(180deg, rgba(255,255,255,.065) 1px, transparent 1px),
        radial-gradient(circle at 52% 42%, rgba(var(--accent-rgb), .19), transparent 34%),
        radial-gradient(circle at 88% 8%, rgba(var(--secondary-rgb), .16), transparent 28%),
        linear-gradient(145deg, rgba(10,14,24,.88), rgba(23,31,46,.62));
      background-size: 26px 26px, 26px 26px, auto, auto, auto;
    }

    .stack-visual {
      width: min(92%, 22rem);
      min-height: 10.6rem;
      position: relative;
      display: grid;
      place-items: center;
      color: #fff;
    }

    .stack-visual::before,
    .stack-visual::after {
      content: "";
      position: absolute;
      border-radius: 999px;
      pointer-events: none;
    }

    .stack-visual::before {
      width: 11rem;
      height: 11rem;
      background: radial-gradient(circle, rgba(var(--accent-rgb), .2), transparent 64%);
    }

    .stack-visual::after {
      width: 16rem;
      height: 16rem;
      border: 1px solid rgba(255,255,255,.12);
      border-left-color: rgba(var(--accent-rgb), .34);
      border-right-color: rgba(var(--secondary-rgb), .25);
      transform: rotate(-18deg);
    }

    .stack-core {
      position: relative;
      z-index: 2;
      width: clamp(6.2rem, 18vw, 8rem);
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 2rem;
      background:
        radial-gradient(circle at 30% 22%, rgba(255,255,255,.42), transparent 28%),
        linear-gradient(145deg, rgba(var(--accent-rgb), .28), rgba(var(--secondary-rgb), .18)),
        rgba(255,255,255,.07);
      box-shadow: 0 0 0 14px rgba(255,255,255,.045), 0 22px 58px rgba(0,0,0,.28);
      font-size: clamp(1.55rem, 4vw, 2.15rem);
      font-weight: 1000;
      letter-spacing: -.07em;
    }

    .stack-core small {
      display: block;
      color: rgba(255,255,255,.74);
      font-size: .55rem;
      line-height: 1;
      letter-spacing: .12em;
      text-transform: uppercase;
      text-align: center;
    }

    .stack-node {
      position: absolute;
      z-index: 3;
      min-width: 4.6rem;
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 999px;
      padding: .48rem .68rem;
      background: rgba(255,255,255,.075);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 14px 34px rgba(0,0,0,.18);
      color: rgba(255,255,255,.82);
      font-size: .72rem;
      font-weight: 900;
      text-align: center;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }

    .stack-node.one { left: 3%; top: 12%; }
    .stack-node.two { right: 2%; top: 20%; }
    .stack-node.three { left: 50%; bottom: 2%; transform: translateX(-50%); }

    .portfolio-tech-card[data-tech-glow="react"] .stack-core { color: #9beeff; }
    .portfolio-tech-card[data-tech-glow="azure"] .stack-core { color: #86bdff; }
    .portfolio-tech-card[data-tech-glow="python"] .stack-core { color: #ffd86f; }
    .portfolio-tech-card[data-tech-glow="docker"] .stack-core { color: #7db8ff; }
  `;

  document.head.appendChild(style);
};

const upgradeTechVisuals = () => {
  document.querySelectorAll('.portfolio-tech-card[data-tech-card]').forEach((card) => {
    const id = card.getAttribute('data-tech-card');
    const media = card.querySelector('.portfolio-tech-media');
    if (!media || media.classList.contains('is-upgraded')) return;

    const labels = visualLabels[id] || ['Build', 'Ship', 'Scale'];
    const display = id === 'javascript' ? 'JS' : id === 'azure' ? 'AZ' : id === 'python' ? 'PY' : id === 'docker' ? 'DKR' : 'RE';
    media.classList.add('is-upgraded');
    media.innerHTML = `
      <div class="stack-visual" aria-hidden="true">
        <div class="stack-core"><div>${display}<small>${id}</small></div></div>
        <span class="stack-node one">${labels[0]}</span>
        <span class="stack-node two">${labels[1]}</span>
        <span class="stack-node three">${labels[2]}</span>
      </div>
    `;
  });
};

const initVisualUpgrade = () => {
  createVisualStyles();
  upgradeTechVisuals();

  const grid = document.querySelector('#work .project-grid');
  if (!grid) return;
  new MutationObserver(upgradeTechVisuals).observe(grid, { childList: true, subtree: true });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVisualUpgrade);
} else {
  initVisualUpgrade();
}
