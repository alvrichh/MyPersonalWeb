'use strict';

const CV_FILE_PATH = './cv/alvrodmol%20CV.pdf';
const CV_FILE_NAME = 'alvrodmol CV.pdf';

const cvCopy = {
  en: {
    nav: 'CV',
    eyebrow: 'Resume',
    title: 'Download my <span class="cv-accent-word">resume</span>.',
    body: 'A compact resume focused on full-stack development, integrations, automation, Azure-connected workflows and technical delivery.',
    download: 'Download CV',
    fallback: 'Downloads the exact PDF resume uploaded to this portfolio.',
    chips: ['Full Stack', 'Integration', 'Automation', 'Azure', 'APIs'],
  },
  es: {
    nav: 'CV',
    eyebrow: 'Currículum',
    title: 'Descarga mi <span class="cv-accent-word">currículum</span>.',
    body: 'Un currículum enfocado en desarrollo full-stack, integraciones, automatización, flujos conectados con Azure y entrega técnica.',
    download: 'Descargar CV',
    fallback: 'Descarga el PDF exacto subido a este portfolio.',
    chips: ['Full Stack', 'Integración', 'Automatización', 'Azure', 'APIs'],
  },
  ga: {
    nav: 'CV',
    eyebrow: 'CV',
    title: 'Íoslódáil mo <span class="cv-accent-word">CV</span>.',
    body: 'CV dlúth dírithe ar fhorbairt full-stack, comhtháthuithe, uathoibriú, workflows ceangailte le Azure agus seachadadh teicniúil.',
    download: 'Íoslódáil CV',
    fallback: 'Íoslódálann sé an PDF cruinn atá curtha leis an bpunann seo.',
    chips: ['Full Stack', 'Comhtháthú', 'Uathoibriú', 'Azure', 'APIs'],
  },
  fr: {
    nav: 'CV',
    eyebrow: 'CV',
    title: 'Téléchargez mon <span class="cv-accent-word">CV</span>.',
    body: 'Un CV compact axé sur le développement full-stack, les intégrations, l’automatisation, les workflows connectés à Azure et la livraison technique.',
    download: 'Télécharger le CV',
    fallback: 'Télécharge le PDF exact ajouté à ce portfolio.',
    chips: ['Full Stack', 'Intégration', 'Automatisation', 'Azure', 'APIs'],
  },
  de: {
    nav: 'CV',
    eyebrow: 'Lebenslauf',
    title: 'Lade meinen <span class="cv-accent-word">Lebenslauf</span> herunter.',
    body: 'Ein kompakter Lebenslauf mit Fokus auf Full-Stack-Entwicklung, Integrationen, Automatisierung, Azure-verbundene Workflows und technische Umsetzung.',
    download: 'CV herunterladen',
    fallback: 'Lädt die exakte PDF-Datei herunter, die in dieses Portfolio hochgeladen wurde.',
    chips: ['Full Stack', 'Integration', 'Automatisierung', 'Azure', 'APIs'],
  },
  ru: {
    nav: 'CV',
    eyebrow: 'Резюме',
    title: 'Скачать мое <span class="cv-accent-word">резюме</span>.',
    body: 'Краткое резюме с фокусом на full-stack разработке, интеграциях, автоматизации, рабочих процессах с Azure и технической поставке.',
    download: 'Скачать CV',
    fallback: 'Скачивает точный PDF-файл резюме, загруженный в это портфолио.',
    chips: ['Full Stack', 'Интеграции', 'Автоматизация', 'Azure', 'APIs'],
  },
  pl: {
    nav: 'CV',
    eyebrow: 'CV',
    title: 'Pobierz moje <span class="cv-accent-word">CV</span>.',
    body: 'Kompaktowe CV skupione na full-stack developmencie, integracjach, automatyzacji, przepływach pracy połączonych z Azure i dostarczaniu technicznym.',
    download: 'Pobierz CV',
    fallback: 'Pobiera dokładny plik PDF CV dodany do tego portfolio.',
    chips: ['Full Stack', 'Integracje', 'Automatyzacja', 'Azure', 'APIs'],
  },
  zh: {
    nav: 'CV',
    eyebrow: '简历',
    title: '下载我的<span class="cv-accent-word">简历</span>。',
    body: '一份简洁的简历，聚焦 full-stack 开发、集成、自动化、Azure 连接的工作流和技术交付。',
    download: '下载 CV',
    fallback: '下载此作品集中上传的准确 PDF 简历。',
    chips: ['Full Stack', '集成', '自动化', 'Azure', 'APIs'],
  },
  ar: {
    nav: 'CV',
    eyebrow: 'السيرة الذاتية',
    title: 'حمّل <span class="cv-accent-word">سيرتي الذاتية</span>.',
    body: 'سيرة ذاتية مختصرة تركز على تطوير full-stack، التكاملات، الأتمتة، سير العمل المرتبط بـ Azure، والتسليم التقني.',
    download: 'تحميل CV',
    fallback: 'يحمّل ملف PDF الدقيق للسيرة الذاتية المرفوع إلى هذا البورتفوليو.',
    chips: ['Full Stack', 'تكاملات', 'أتمتة', 'Azure', 'APIs'],
  },
  and: {
    nav: 'CV',
    eyebrow: 'Currículum',
    title: 'Dezcarga mi <span class="cv-accent-word">currículum</span>.',
    body: 'Un currículum enfocado en dezarrollo full-stack, integrazioneh, automatizazión, flujoh con Azure y entrega técnica, zabe.',
    download: 'Dezcargar CV',
    fallback: 'Dezcarga el PDF exacto subío a este portfolio, zabe.',
    chips: ['Full Stack', 'Integrazión', 'Automatizazión', 'Azure', 'APIs'],
  },
};

const getCurrentLanguage = () => document.body?.dataset?.language || 'en';
const getCvCopy = () => cvCopy[getCurrentLanguage()] || cvCopy.en;

const createCvStyles = () => {
  if (document.querySelector('[data-cv-download-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-cv-download-style', 'true');
  style.textContent = `
    .cv-download-section {
      margin-top: 1.15rem;
      padding: clamp(1rem, 3vw, 1.35rem);
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 28px;
      background:
        radial-gradient(circle at top right, rgba(var(--accent-rgb), .14), transparent 34%),
        linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.018)),
        rgba(255,255,255,.035);
      box-shadow:
        0 22px 60px rgba(0,0,0,.22),
        inset 0 1px 0 rgba(255,255,255,.07);
    }

    .cv-accent-word {
      color: var(--accent);
      text-shadow: 0 0 28px rgba(var(--accent-rgb), .18);
    }

    .cv-download-section__eyebrow {
      margin: 0 0 .45rem;
      color: var(--accent-strong);
      font-size: .74rem;
      font-weight: 900;
      letter-spacing: .16em;
      text-transform: uppercase;
    }

    .cv-download-section__title {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(1.7rem, 5vw, 3rem);
      letter-spacing: -.055em;
      line-height: .98;
    }

    .cv-download-section__body {
      max-width: 62ch;
      margin: .85rem 0 0;
      color: var(--text-muted);
      line-height: 1.55;
    }

    .cv-download-section__chips {
      display: flex;
      flex-wrap: wrap;
      gap: .5rem;
      margin-top: 1rem;
    }

    .cv-download-section__chips span {
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 999px;
      padding: .48rem .68rem;
      background: rgba(255,255,255,.045);
      color: var(--text-muted);
      font-weight: 800;
      font-size: .84rem;
    }

    .cv-download-section__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: .8rem;
      margin-top: 1.15rem;
    }

    .cv-download-section__button {
      border: 0;
      border-radius: 999px;
      padding: .86rem 1rem;
      color: var(--accent-text);
      background: linear-gradient(135deg, var(--accent), var(--accent-strong));
      font-weight: 1000;
      cursor: pointer;
      box-shadow: 0 18px 40px rgba(var(--accent-rgb), .18);
    }

    .cv-download-section__note {
      margin: 0;
      color: var(--text-soft);
      font-size: .84rem;
      line-height: 1.45;
    }

    .cv-priority-action,
    .cv-hero-download {
      border: 1px solid rgba(var(--accent-rgb), .28) !important;
      background:
        linear-gradient(135deg, rgba(var(--accent-rgb), .18), rgba(var(--secondary-rgb), .11)),
        rgba(255,255,255,.055) !important;
      color: var(--text) !important;
      box-shadow: 0 16px 34px rgba(var(--accent-rgb), .12);
    }

    .cv-priority-action ion-icon,
    .cv-hero-download ion-icon {
      color: var(--accent-strong);
    }

    @media (max-width: 760px) {
      .cv-hero-download {
        order: 3;
        width: 100%;
      }
    }
  `;

  document.head.appendChild(style);
};

const downloadCv = () => {
  const link = document.createElement('a');
  link.href = CV_FILE_PATH;
  link.download = CV_FILE_NAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const createCvButton = (className, markerAttribute) => {
  const button = document.createElement('button');
  button.className = className;
  button.type = 'button';
  button.setAttribute('data-download-cv', 'true');
  button.setAttribute(markerAttribute, 'true');
  button.innerHTML = `
    <ion-icon name="document-text-outline" aria-hidden="true"></ion-icon>
    <span data-cv-button-copy>${getCvCopy().download}</span>
  `;
  return button;
};

const insertPriorityCvActions = () => {
  const sidebarActions = document.querySelector('.sidebar-actions');
  if (sidebarActions && !sidebarActions.querySelector('[data-cv-sidebar-action]')) {
    const sidebarButton = createCvButton('btn btn-secondary has-icon cv-priority-action', 'data-cv-sidebar-action');
    const secondaryAction = sidebarActions.querySelector('.btn-secondary');
    sidebarActions.insertBefore(sidebarButton, secondaryAction || null);
  }

  const aboutActions = document.querySelector('#about .cta-row');
  if (aboutActions && !aboutActions.querySelector('[data-cv-hero-action]')) {
    const heroButton = createCvButton('btn btn-secondary has-icon cv-hero-download', 'data-cv-hero-action');
    aboutActions.appendChild(heroButton);
  }
};

const insertCvNav = () => {
  const nav = document.querySelector('.topbar .section-nav') || document.querySelector('.section-nav');
  if (!nav || nav.querySelector('[data-target="cv"]')) return;

  const contactButton = nav.querySelector('[data-target="contact"]');
  const button = document.createElement('button');
  button.className = 'nav-tab';
  button.type = 'button';
  button.dataset.target = 'cv';
  button.setAttribute('aria-pressed', 'false');
  button.textContent = getCvCopy().nav;

  if (contactButton) {
    nav.insertBefore(button, contactButton);
  } else {
    nav.appendChild(button);
  }
};

const insertCvSection = () => {
  if (document.getElementById('cv')) return;

  const contact = document.getElementById('contact');
  const stack = document.querySelector('.content-stack');
  if (!contact || !stack) return;

  const data = getCvCopy();
  const section = document.createElement('section');
  section.id = 'cv';
  section.className = 'panel card is-active premium-reveal';
  section.setAttribute('data-scroll-section', 'true');
  section.innerHTML = `
    <div class="panel-heading">
      <span class="eyebrow" data-cv-copy="eyebrow">${data.eyebrow}</span>
      <h2 data-cv-copy="title">${data.title}</h2>
    </div>
    <div class="cv-download-section">
      <p class="cv-download-section__body" data-cv-copy="body">${data.body}</p>
      <div class="cv-download-section__chips" data-cv-chips>${data.chips.map((chip) => `<span>${chip}</span>`).join('')}</div>
      <div class="cv-download-section__actions">
        <button class="cv-download-section__button" type="button" data-download-cv>${data.download}</button>
        <p class="cv-download-section__note" data-cv-copy="fallback">${data.fallback}</p>
      </div>
    </div>
  `;

  stack.insertBefore(section, contact);
};

const refreshCvCopy = () => {
  const data = getCvCopy();
  document.querySelectorAll('[data-target="cv"]').forEach((button) => {
    button.textContent = data.nav;
  });
  document.querySelector('[data-cv-copy="eyebrow"]')?.replaceChildren(document.createTextNode(data.eyebrow));
  const title = document.querySelector('[data-cv-copy="title"]');
  if (title) title.innerHTML = data.title;
  document.querySelector('[data-cv-copy="body"]')?.replaceChildren(document.createTextNode(data.body));
  document.querySelector('[data-cv-copy="fallback"]')?.replaceChildren(document.createTextNode(data.fallback));
  const chips = document.querySelector('[data-cv-chips]');
  if (chips) chips.innerHTML = data.chips.map((chip) => `<span>${chip}</span>`).join('');
  document.querySelectorAll('[data-download-cv]').forEach((button) => {
    button.replaceChildren(document.createTextNode(data.download));
  });
  document.querySelectorAll('[data-cv-button-copy]').forEach((node) => {
    node.textContent = data.download;
  });
};

const bindCvEvents = () => {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-download-cv]');
    if (!button) return;

    event.preventDefault();
    downloadCv();
  });
};

const initCvDownloadSection = () => {
  createCvStyles();
  insertCvNav();
  insertPriorityCvActions();
  insertCvSection();
  refreshCvCopy();
  bindCvEvents();

  if (document.body) {
    new MutationObserver(refreshCvCopy).observe(document.body, {
      attributes: true,
      attributeFilter: ['data-language'],
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCvDownloadSection);
} else {
  initCvDownloadSection();
}
