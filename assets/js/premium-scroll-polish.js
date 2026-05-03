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

    .capabilities-studio {
      margin-top: 1.45rem;
    }

    .capabilities-studio__head {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 1rem;
      margin-bottom: .95rem;
    }

    .capabilities-studio__head h3 {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(1.45rem, 4vw, 2.25rem);
      letter-spacing: -.045em;
    }

    .capabilities-studio__head span {
      color: var(--text-soft);
      font-size: .78rem;
      font-weight: 900;
      letter-spacing: .14em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .capability-list {
      display: grid;
      gap: .75rem;
    }

    .capability-item {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 1rem;
      padding: clamp(1rem, 2vw, 1.25rem);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 24px;
      background:
        linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.018)),
        rgba(255,255,255,.035);
      transition: transform .2s ease, border-color .2s ease, background .2s ease;
    }

    .capability-item:hover {
      transform: translateY(-4px);
      border-color: rgba(var(--accent-rgb), .34);
      background:
        linear-gradient(180deg, rgba(var(--accent-rgb), .08), rgba(255,255,255,.018)),
        rgba(255,255,255,.04);
    }

    .capability-item__index {
      color: var(--accent);
      font-family: var(--font-display);
      font-weight: 900;
      font-size: .92rem;
      line-height: 1.2;
    }

    .capability-item h4 {
      margin: 0 0 .35rem;
      font-family: var(--font-display);
      font-size: 1.12rem;
      letter-spacing: -.025em;
    }

    .capability-item p {
      margin: 0;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .terminal-contact {
      margin-top: 1.15rem;
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 26px;
      overflow: hidden;
      background:
        radial-gradient(circle at 100% 0%, rgba(var(--accent-rgb), .1), transparent 30%),
        rgba(3, 7, 13, .74);
      box-shadow:
        0 22px 60px rgba(0,0,0,.25),
        inset 0 1px 0 rgba(255,255,255,.06);
    }

    .terminal-contact__bar {
      display: flex;
      align-items: center;
      gap: .42rem;
      padding: .8rem 1rem;
      border-bottom: 1px solid rgba(255,255,255,.1);
      background: rgba(255,255,255,.045);
    }

    .terminal-contact__dot {
      width: .7rem;
      height: .7rem;
      border-radius: 999px;
      background: rgba(255,255,255,.28);
    }

    .terminal-contact__dot:nth-child(1) { background: #ff7777; }
    .terminal-contact__dot:nth-child(2) { background: #ffd45f; }
    .terminal-contact__dot:nth-child(3) { background: #70e1a1; }

    .terminal-contact__body {
      padding: clamp(1rem, 3vw, 1.35rem);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      color: var(--text-muted);
      line-height: 1.65;
      font-size: .92rem;
    }

    .terminal-contact__body p {
      margin: 0;
    }

    .terminal-contact__body p + p {
      margin-top: .5rem;
    }

    .terminal-contact__prompt {
      color: var(--accent);
      font-weight: 900;
    }

    .terminal-contact__value {
      color: var(--text);
    }

    .terminal-contact__links {
      display: flex;
      flex-wrap: wrap;
      gap: .55rem;
      margin-top: 1rem;
      font-family: var(--font-body);
    }

    .terminal-contact__links a {
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 999px;
      padding: .6rem .82rem;
      background: rgba(255,255,255,.055);
      color: var(--text);
      font-weight: 900;
      transition: transform .18s ease, border-color .18s ease, background .18s ease;
    }

    .terminal-contact__links a:hover {
      transform: translateY(-2px);
      border-color: rgba(var(--accent-rgb), .34);
      background: rgba(var(--accent-rgb), .12);
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

    body.premium-scroll-polish .project-card,
    body.premium-scroll-polish .feature-card,
    body.premium-scroll-polish .mini-card,
    body.premium-scroll-polish .channel-card,
    body.premium-scroll-polish .meta-item,
    body.premium-scroll-polish .capability-item {
      transform-style: preserve-3d;
    }

    body.premium-scroll-polish .project-card:hover,
    body.premium-scroll-polish .feature-card:hover,
    body.premium-scroll-polish .mini-card:hover,
    body.premium-scroll-polish .channel-card:hover {
      box-shadow:
        0 26px 70px rgba(0,0,0,.28),
        0 0 0 1px rgba(var(--accent-rgb), .13),
        inset 0 1px 0 rgba(255,255,255,.08);
    }

    body.premium-scroll-polish .project-link,
    body.premium-scroll-polish .btn,
    body.premium-scroll-polish .nav-tab {
      position: relative;
      overflow: hidden;
    }

    body.premium-scroll-polish .project-link::after,
    body.premium-scroll-polish .btn::after,
    body.premium-scroll-polish .nav-tab::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,.16) 45%, transparent 70%);
      transform: translateX(-130%);
      transition: transform .55s ease;
      pointer-events: none;
    }

    body.premium-scroll-polish .project-link:hover::after,
    body.premium-scroll-polish .btn:hover::after,
    body.premium-scroll-polish .nav-tab:hover::after {
      transform: translateX(130%);
    }

    @media (prefers-reduced-motion: reduce) {
      .premium-reveal {
        opacity: 1;
        transform: none;
        transition: none;
      }

      body.premium-scroll-polish .project-link::after,
      body.premium-scroll-polish .btn::after,
      body.premium-scroll-polish .nav-tab::after {
        display: none;
      }
    }

    @media (max-width: 760px) {
      .alvrich-manifesto {
        margin-bottom: 1rem;
      }

      .alvrich-manifesto__title {
        max-width: 10ch;
      }

      .capabilities-studio__head {
        display: grid;
        gap: .35rem;
      }

      .capability-item {
        grid-template-columns: 1fr;
        gap: .55rem;
      }

      .terminal-contact__body {
        font-size: .86rem;
      }
    }
  `;

  document.head.appendChild(style);
};

const getCurrentLanguage = () => document.body?.dataset?.language || 'en';

const copy = {
  en: {
    manifestoKicker: 'Alvrich operating system',
    manifestoTitle: 'Interfaces. APIs. Automation. Real workflows.',
    manifestoBody: 'I build full-stack systems that connect visual interfaces, backend logic, authentication, APIs and business processes into something clean, useful and easy to operate.',
    rail: ['Full-stack', 'Integration', 'Automation', 'Azure', 'APIs', 'Product thinking'],
    capabilitiesKicker: 'Capabilities',
    capabilitiesTitle: 'Built across disciplines.',
    capabilities: [
      ['Frontend systems', 'Responsive interfaces with strong hierarchy, polished UI and clear user flows.'],
      ['Backend & APIs', 'Data movement, endpoints, authentication flows and integrations that connect real tools.'],
      ['Automation', 'Manual or repetitive workflows converted into lightweight systems and scripts.'],
      ['Cloud connected work', 'Azure-oriented thinking, deployments, services and scalable project structure.'],
    ],
    terminal: {
      status: 'available for full-stack / automation / integration work',
      stack: 'javascript · python · azure · apis · auth · docker',
      signal: 'clean systems, useful interfaces, measurable process impact',
    },
  },
  es: {
    manifestoKicker: 'Sistema operativo alvrich',
    manifestoTitle: 'Interfaces. APIs. Automatización. Procesos reales.',
    manifestoBody: 'Construyo sistemas full-stack que conectan interfaces visuales, backend, autenticación, APIs y procesos de negocio en algo limpio, útil y fácil de operar.',
    rail: ['Full-stack', 'Integración', 'Automatización', 'Azure', 'APIs', 'Producto'],
    capabilitiesKicker: 'Capacidades',
    capabilitiesTitle: 'Trabajo entre disciplinas.',
    capabilities: [
      ['Frontend systems', 'Interfaces responsive con jerarquía clara, UI cuidada y flujos fáciles de seguir.'],
      ['Backend & APIs', 'Movimiento de datos, endpoints, autenticación e integraciones entre herramientas reales.'],
      ['Automation', 'Procesos manuales o repetitivos convertidos en sistemas ligeros y scripts útiles.'],
      ['Cloud connected work', 'Mentalidad Azure, despliegues, servicios y estructura escalable de proyecto.'],
    ],
    terminal: {
      status: 'disponible para full-stack / automatización / integración',
      stack: 'javascript · python · azure · apis · auth · docker',
      signal: 'sistemas limpios, interfaces útiles, impacto real en procesos',
    },
  },
  and: {
    manifestoKicker: 'Zistema operativo alvrich',
    manifestoTitle: 'Interfazeh. APIs. Automatizazión. Prozesoh realeh.',
    manifestoBody: 'Construyo zistemah full-stack que conectan interfazeh, backend, autenticazión, APIs y prozesoh de negosio en argo limpio, útil y fácil de llevá, zabe.',
    rail: ['Full-stack', 'Integrazión', 'Automatizazión', 'Azure', 'APIs', 'Producto'],
    capabilitiesKicker: 'Capazidadeh',
    capabilitiesTitle: 'Trabajo entre diziplinah.',
    capabilities: [
      ['Frontend systems', 'Interfazeh responsive con jerarquía clara, UI cuidá y flujoh fáciles de seguí.'],
      ['Backend & APIs', 'Movimiento de datoh, endpoints, autenticazión e integrazioneh entre herramientah realeh.'],
      ['Automation', 'Prozesoh manualeh o repetitivoh convertíos en zistemah ligeroh y scripts útileh.'],
      ['Cloud connected work', 'Mentalidá Azure, despliegueh, servisioh y ehtructura ehcalable de proyecto.'],
    ],
    terminal: {
      status: 'disponible pa full-stack / automatizazión / integrazión',
      stack: 'javascript · python · azure · apis · auth · docker',
      signal: 'zistemah limpioh, interfazeh útileh, impacto real en prozesoh',
    },
  },
};

const getCopy = () => copy[getCurrentLanguage()] || copy.en;

const insertManifesto = () => {
  const about = document.getElementById('about');
  if (!about || about.querySelector('[data-alvrich-manifesto]')) return;

  const data = getCopy();
  const manifesto = document.createElement('section');
  manifesto.className = 'alvrich-manifesto premium-reveal';
  manifesto.setAttribute('data-alvrich-manifesto', 'true');
  manifesto.innerHTML = `
    <p class="alvrich-manifesto__kicker" data-premium-copy="manifestoKicker">${data.manifestoKicker}</p>
    <h2 class="alvrich-manifesto__title" data-premium-copy="manifestoTitle">${data.manifestoTitle.replace('Automation', '<span>Automation</span>').replace('Automatización', '<span>Automatización</span>').replace('Automatizazión', '<span>Automatizazión</span>')}</h2>
    <p class="alvrich-manifesto__body" data-premium-copy="manifestoBody">${data.manifestoBody}</p>
    <div class="alvrich-manifesto__rail" data-premium-rail>${data.rail.map((item) => `<span>${item}</span>`).join('')}</div>
  `;

  about.prepend(manifesto);
};

const insertCapabilities = () => {
  const focus = document.getElementById('focus');
  if (!focus || focus.querySelector('[data-capabilities-studio]')) return;

  const data = getCopy();
  const block = document.createElement('section');
  block.className = 'capabilities-studio premium-reveal';
  block.setAttribute('data-capabilities-studio', 'true');
  block.innerHTML = `
    <div class="capabilities-studio__head">
      <h3 data-premium-copy="capabilitiesTitle">${data.capabilitiesTitle}</h3>
      <span data-premium-copy="capabilitiesKicker">${data.capabilitiesKicker}</span>
    </div>
    <div class="capability-list" data-premium-capabilities>
      ${data.capabilities.map(([title, body], index) => `
        <article class="capability-item premium-reveal" style="--premium-delay:${index * 70}ms">
          <span class="capability-item__index">${String(index + 1).padStart(2, '0')}</span>
          <div>
            <h4>${title}</h4>
            <p>${body}</p>
          </div>
        </article>
      `).join('')}
    </div>
  `;

  focus.appendChild(block);
};

const insertTerminalContact = () => {
  const contact = document.getElementById('contact');
  if (!contact || contact.querySelector('[data-terminal-contact]')) return;

  const data = getCopy();
  const block = document.createElement('section');
  block.className = 'terminal-contact premium-reveal';
  block.setAttribute('data-terminal-contact', 'true');
  block.innerHTML = `
    <div class="terminal-contact__bar" aria-hidden="true">
      <span class="terminal-contact__dot"></span>
      <span class="terminal-contact__dot"></span>
      <span class="terminal-contact__dot"></span>
    </div>
    <div class="terminal-contact__body">
      <p><span class="terminal-contact__prompt">&gt; status</span> <span class="terminal-contact__value" data-premium-terminal="status">${data.terminal.status}</span></p>
      <p><span class="terminal-contact__prompt">&gt; stack</span> <span class="terminal-contact__value" data-premium-terminal="stack">${data.terminal.stack}</span></p>
      <p><span class="terminal-contact__prompt">&gt; signal</span> <span class="terminal-contact__value" data-premium-terminal="signal">${data.terminal.signal}</span></p>
      <div class="terminal-contact__links">
        <a href="https://wa.link/41utbj" target="_blank" rel="noreferrer">WhatsApp</a>
        <a href="https://github.com/alvrichh" target="_blank" rel="noreferrer">GitHub</a>
        <a href="https://www.linkedin.com/in/alvaro-rodriguez-molina/" target="_blank" rel="noreferrer">LinkedIn</a>
      </div>
    </div>
  `;

  contact.appendChild(block);
};

const refreshPremiumCopy = () => {
  const data = getCopy();

  document.querySelector('[data-premium-copy="manifestoKicker"]')?.replaceChildren(document.createTextNode(data.manifestoKicker));
  const manifestoTitle = document.querySelector('[data-premium-copy="manifestoTitle"]');
  if (manifestoTitle) {
    manifestoTitle.innerHTML = data.manifestoTitle
      .replace('Automation', '<span>Automation</span>')
      .replace('Automatización', '<span>Automatización</span>')
      .replace('Automatizazión', '<span>Automatizazión</span>');
  }
  document.querySelector('[data-premium-copy="manifestoBody"]')?.replaceChildren(document.createTextNode(data.manifestoBody));
  document.querySelector('[data-premium-copy="capabilitiesKicker"]')?.replaceChildren(document.createTextNode(data.capabilitiesKicker));
  document.querySelector('[data-premium-copy="capabilitiesTitle"]')?.replaceChildren(document.createTextNode(data.capabilitiesTitle));

  const rail = document.querySelector('[data-premium-rail]');
  if (rail) rail.innerHTML = data.rail.map((item) => `<span>${item}</span>`).join('');

  const capabilities = document.querySelector('[data-premium-capabilities]');
  if (capabilities) {
    capabilities.innerHTML = data.capabilities.map(([title, body], index) => `
      <article class="capability-item premium-reveal is-visible" style="--premium-delay:${index * 70}ms">
        <span class="capability-item__index">${String(index + 1).padStart(2, '0')}</span>
        <div>
          <h4>${title}</h4>
          <p>${body}</p>
        </div>
      </article>
    `).join('');
  }

  Object.entries(data.terminal).forEach(([key, value]) => {
    document.querySelector(`[data-premium-terminal="${key}"]`)?.replaceChildren(document.createTextNode(value));
  });
};

const setupRevealAnimations = () => {
  const targets = [
    ...document.querySelectorAll(revealSelectors.join(',')),
    ...document.querySelectorAll('.alvrich-manifesto, .capabilities-studio, .terminal-contact'),
  ];

  targets.forEach((element, index) => {
    element.classList.add('premium-reveal');
    element.style.setProperty('--premium-delay', `${Math.min(index % 8, 5) * 55}ms`);
  });

  if (!('IntersectionObserver' in window)) {
    targets.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    root: null,
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px',
  });

  targets.forEach((element) => observer.observe(element));
};

const setupPointerGlow = () => {
  document.addEventListener('pointermove', (event) => {
    const card = event.target.closest('.project-card, .feature-card, .mini-card, .channel-card, .capability-item');
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    card.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(var(--accent-rgb), .11), transparent 32%), linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.018)), rgba(255,255,255,.035)`;
  });

  document.addEventListener('pointerleave', (event) => {
    const card = event.target.closest?.('.project-card, .feature-card, .mini-card, .channel-card, .capability-item');
    if (card) card.style.background = '';
  }, true);
};

const observeLanguageChanges = () => {
  if (!document.body) return;

  const observer = new MutationObserver(refreshPremiumCopy);
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-language'] });
};

const initPremiumScrollPolish = () => {
  document.body.classList.add('premium-scroll-polish');
  createPremiumScrollPolishStyles();
  insertManifesto();
  insertCapabilities();
  insertTerminalContact();
  refreshPremiumCopy();
  setupRevealAnimations();
  setupPointerGlow();
  observeLanguageChanges();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPremiumScrollPolish);
} else {
  initPremiumScrollPolish();
}
