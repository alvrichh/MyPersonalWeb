'use strict';

const cvLanguageTranslations = {
  ru: {
    eyebrow: 'Резюме',
    title: 'Скачать мое <span class="cv-accent-word">резюме</span>.',
    body: 'Краткое резюме с фокусом на full-stack разработке, интеграциях, автоматизации, рабочих процессах с Azure и технической поставке.',
    download: 'Скачать CV',
    fallback: 'Скачивает точный PDF-файл резюме, загруженный в это портфолио.',
    chips: ['Full Stack', 'Интеграции', 'Автоматизация', 'Azure', 'APIs'],
  },
  zh: {
    eyebrow: '简历',
    title: '下载我的<span class="cv-accent-word">简历</span>。',
    body: '一份简洁的简历，聚焦 full-stack 开发、集成、自动化、Azure 连接的工作流和技术交付。',
    download: '下载 CV',
    fallback: '下载此作品集中上传的准确 PDF 简历。',
    chips: ['Full Stack', '集成', '自动化', 'Azure', 'APIs'],
  },
  pl: {
    eyebrow: 'CV',
    title: 'Pobierz moje <span class="cv-accent-word">CV</span>.',
    body: 'Kompaktowe CV skupione na full-stack developmencie, integracjach, automatyzacji, przepływach pracy połączonych z Azure i dostarczaniu technicznym.',
    download: 'Pobierz CV',
    fallback: 'Pobiera dokładny plik PDF CV dodany do tego portfolio.',
    chips: ['Full Stack', 'Integracje', 'Automatyzacja', 'Azure', 'APIs'],
  },
  de: {
    eyebrow: 'Lebenslauf',
    title: 'Lade meinen <span class="cv-accent-word">Lebenslauf</span> herunter.',
    body: 'Ein kompakter Lebenslauf mit Fokus auf Full-Stack-Entwicklung, Integrationen, Automatisierung, Azure-verbundene Workflows und technische Umsetzung.',
    download: 'CV herunterladen',
    fallback: 'Lädt die exakte PDF-Datei herunter, die in dieses Portfolio hochgeladen wurde.',
    chips: ['Full Stack', 'Integration', 'Automatisierung', 'Azure', 'APIs'],
  },
  ar: {
    eyebrow: 'السيرة الذاتية',
    title: 'حمّل <span class="cv-accent-word">سيرتي الذاتية</span>.',
    body: 'سيرة ذاتية مختصرة تركز على تطوير full-stack، التكاملات، الأتمتة، سير العمل المرتبط بـ Azure، والتسليم التقني.',
    download: 'تحميل CV',
    fallback: 'يحمّل ملف PDF الدقيق للسيرة الذاتية المرفوع إلى هذا البورتفوليو.',
    chips: ['Full Stack', 'تكاملات', 'أتمتة', 'Azure', 'APIs'],
  },
  fr: {
    eyebrow: 'CV',
    title: 'Téléchargez mon <span class="cv-accent-word">CV</span>.',
    body: 'Un CV compact axé sur le développement full-stack, les intégrations, l’automatisation, les workflows connectés à Azure et la livraison technique.',
    download: 'Télécharger le CV',
    fallback: 'Télécharge le PDF exact ajouté à ce portfolio.',
    chips: ['Full Stack', 'Intégration', 'Automatisation', 'Azure', 'APIs'],
  },
  ga: {
    eyebrow: 'CV',
    title: 'Íoslódáil mo <span class="cv-accent-word">CV</span>.',
    body: 'CV dlúth dírithe ar fhorbairt full-stack, comhtháthuithe, uathoibriú, workflows ceangailte le Azure agus seachadadh teicniúil.',
    download: 'Íoslódáil CV',
    fallback: 'Íoslódálann sé an PDF cruinn atá curtha leis an bpunann seo.',
    chips: ['Full Stack', 'Comhtháthú', 'Uathoibriú', 'Azure', 'APIs'],
  },
};

const applyCvLanguageTranslation = () => {
  const language = document.body?.dataset?.language;
  const copy = cvLanguageTranslations[language];
  if (!copy) return;

  document.querySelector('[data-cv-copy="eyebrow"]')?.replaceChildren(document.createTextNode(copy.eyebrow));

  const title = document.querySelector('[data-cv-copy="title"]');
  if (title) title.innerHTML = copy.title;

  document.querySelector('[data-cv-copy="body"]')?.replaceChildren(document.createTextNode(copy.body));
  document.querySelector('[data-cv-copy="fallback"]')?.replaceChildren(document.createTextNode(copy.fallback));

  const chips = document.querySelector('[data-cv-chips]');
  if (chips) chips.innerHTML = copy.chips.map((chip) => `<span>${chip}</span>`).join('');

  document.querySelectorAll('[data-cv-button-copy]').forEach((node) => {
    node.textContent = copy.download;
  });

  document.querySelectorAll('.cv-download-section__button[data-download-cv]').forEach((button) => {
    button.textContent = copy.download;
  });
};

const initCvLanguageTranslations = () => {
  applyCvLanguageTranslation();

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(applyCvLanguageTranslation);
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-language'],
  });

  document.addEventListener('click', () => {
    window.setTimeout(applyCvLanguageTranslation, 120);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCvLanguageTranslations);
} else {
  initCvLanguageTranslations();
}
