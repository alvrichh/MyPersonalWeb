'use strict';

const gymCopy = {
  en: {
    tagOne: 'Life',
    tagTwo: 'Tracker',
    title: 'alvrich gym · May plan',
    body: 'A personal training tracker for May with daily workout checks, weight logs, notes, and progress history.',
    action: 'Open gym tracker',
    nav: 'Life',
  },
  es: {
    tagOne: 'Life',
    tagTwo: 'Seguimiento',
    title: 'alvrich gym · plan de mayo',
    body: 'Un tracker personal para mayo con checks diarios de entrenamiento, peso, notas e historial de progreso.',
    action: 'Abrir gym tracker',
    nav: 'Life',
  },
};

const getCopy = () => {
  const language = document.body?.dataset?.language || 'en';
  return gymCopy[language] || gymCopy.en;
};

const ensureGymStyles = () => {
  if (document.querySelector('[data-gym-project-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-gym-project-style', 'true');
  style.textContent = `
    .gym-project-card .project-media {
      min-height: 210px;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at 20% 20%, rgba(112,225,161,.34), transparent 34%),
        radial-gradient(circle at 80% 10%, rgba(101,167,255,.28), transparent 30%),
        linear-gradient(135deg, rgba(112,225,161,.14), rgba(101,167,255,.12));
    }

    .gym-project-visual {
      width: min(76%, 250px);
      aspect-ratio: 1 / .72;
      border-radius: 26px;
      border: 1px solid rgba(255,255,255,.18);
      background: rgba(7,10,18,.72);
      box-shadow: 0 24px 50px rgba(0,0,0,.28);
      padding: 18px;
      display: grid;
      gap: 10px;
      align-content: center;
    }

    .gym-project-visual span {
      display: block;
      height: 12px;
      border-radius: 999px;
      background: rgba(255,255,255,.14);
    }

    .gym-project-visual span:nth-child(1) {
      width: 54%;
      background: linear-gradient(135deg, #70e1a1, #65a7ff);
    }

    .gym-project-visual span:nth-child(2) { width: 82%; }
    .gym-project-visual span:nth-child(3) { width: 68%; }

    .gym-project-visual strong {
      color: #70e1a1;
      font-size: clamp(1.4rem, 6vw, 2.1rem);
      line-height: 1;
      letter-spacing: -.04em;
      text-transform: lowercase;
    }

    .gym-nav-link {
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `;

  document.head.appendChild(style);
};

const createGymProjectCard = () => {
  const projectGrid = document.querySelector('.project-grid');
  if (!projectGrid || document.querySelector('[data-gym-project-card]')) return;

  const copy = getCopy();
  const card = document.createElement('article');
  card.className = 'project-card gym-project-card';
  card.dataset.category = 'systems';
  card.setAttribute('data-gym-project-card', 'true');
  card.innerHTML = `
    <a class="project-media" href="./gym.html" aria-label="${copy.action}">
      <div class="gym-project-visual" aria-hidden="true">
        <strong>gym</strong>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </a>
    <div class="project-copy">
      <div class="project-tags">
        <span class="tag" data-gym-copy="tagOne">${copy.tagOne}</span>
        <span class="tag" data-gym-copy="tagTwo">${copy.tagTwo}</span>
      </div>
      <h3 data-gym-copy="title">${copy.title}</h3>
      <p data-gym-copy="body">${copy.body}</p>
      <div class="project-links">
        <a class="project-link has-icon" href="./gym.html">
          <ion-icon name="barbell-outline" aria-hidden="true"></ion-icon>
          <span data-gym-copy="action">${copy.action}</span>
        </a>
      </div>
    </div>
  `;

  projectGrid.prepend(card);
};

const createLifeNavShortcut = () => {
  const sectionNav = document.querySelector('.section-nav');
  if (!sectionNav || document.querySelector('[data-gym-nav-link]')) return;

  const copy = getCopy();
  const link = document.createElement('a');
  link.className = 'nav-tab gym-nav-link';
  link.href = './gym.html';
  link.setAttribute('data-gym-nav-link', 'true');
  link.setAttribute('data-gym-copy', 'nav');
  link.textContent = copy.nav;
  sectionNav.appendChild(link);
};

const refreshGymCopy = () => {
  const copy = getCopy();
  document.querySelectorAll('[data-gym-copy]').forEach((node) => {
    const key = node.getAttribute('data-gym-copy');
    if (copy[key]) node.textContent = copy[key];
  });
};

const observeLanguageChanges = () => {
  if (!document.body) return;

  const observer = new MutationObserver(refreshGymCopy);
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-language'] });
};

const initGymEntryPoints = () => {
  ensureGymStyles();
  createGymProjectCard();
  createLifeNavShortcut();
  refreshGymCopy();
  observeLanguageChanges();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGymEntryPoints);
} else {
  initGymEntryPoints();
}
