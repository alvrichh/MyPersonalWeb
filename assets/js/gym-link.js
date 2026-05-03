'use strict';

const createGymLink = () => {
  if (document.querySelector('[data-gym-life-link]')) return;

  const link = document.createElement('a');
  link.href = './gym.html';
  link.setAttribute('data-gym-life-link', 'true');
  link.setAttribute('aria-label', 'Abrir alvrich gym');
  link.innerHTML = '<span class="gym-life-kicker">Life</span><strong>Gym</strong>';

  const style = document.createElement('style');
  style.textContent = `
    [data-gym-life-link] {
      position: fixed;
      right: max(16px, env(safe-area-inset-right));
      bottom: calc(18px + env(safe-area-inset-bottom));
      z-index: 9999;
      display: inline-flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 1px;
      min-width: 82px;
      min-height: 58px;
      padding: 11px 15px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,.22);
      background: linear-gradient(135deg, #70e1a1, #65a7ff);
      color: #06101a;
      font-family: inherit;
      text-decoration: none;
      box-shadow: 0 16px 42px rgba(0,0,0,.35);
      -webkit-tap-highlight-color: transparent;
      transition: transform .18s ease, box-shadow .18s ease;
    }

    [data-gym-life-link]:active {
      transform: scale(.96);
    }

    [data-gym-life-link] .gym-life-kicker {
      font-size: .68rem;
      line-height: 1;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .12em;
      opacity: .74;
    }

    [data-gym-life-link] strong {
      font-size: 1rem;
      line-height: 1;
      font-weight: 1000;
      text-transform: lowercase;
    }

    @media (min-width: 900px) {
      [data-gym-life-link] {
        right: 28px;
        bottom: 28px;
      }

      [data-gym-life-link]:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 52px rgba(0,0,0,.45);
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(link);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createGymLink);
} else {
  createGymLink();
}
