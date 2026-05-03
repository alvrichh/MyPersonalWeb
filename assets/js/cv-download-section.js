'use strict';

const CV_FILE_PATH = './cv/alvaro-rodriguez-molina-cv.pdf';
const CV_FILE_NAME = 'alvaro-rodriguez-molina-cv.pdf';

const cvCopy = {
  en: {
    nav: 'CV',
    eyebrow: 'Resume',
    title: 'Download my CV.',
    body: 'A compact resume focused on full-stack development, integrations, automation, Azure-connected workflows and technical delivery.',
    download: 'Download CV',
    fallback: 'If the PDF file is not deployed yet, the button generates a clean PDF version directly in your browser.',
    chips: ['Full Stack', 'Integration', 'Automation', 'Azure', 'APIs'],
  },
  es: {
    nav: 'CV',
    eyebrow: 'Currículum',
    title: 'Descarga mi CV.',
    body: 'Un currículum enfocado en desarrollo full-stack, integraciones, automatización, flujos conectados con Azure y entrega técnica.',
    download: 'Descargar CV',
    fallback: 'Si el PDF todavía no está desplegado, el botón genera una versión limpia en PDF directamente desde el navegador.',
    chips: ['Full Stack', 'Integración', 'Automatización', 'Azure', 'APIs'],
  },
  and: {
    nav: 'CV',
    eyebrow: 'Currículum',
    title: 'Dezcarga mi CV.',
    body: 'Un currículum enfocado en dezarrollo full-stack, integrazioneh, automatizazión, flujoh con Azure y entrega técnica, zabe.',
    download: 'Dezcargar CV',
    fallback: 'Zi el PDF todavía no está desplegao, el botón genera una verzión limpia en PDF desde el navegador.',
    chips: ['Full Stack', 'Integrazión', 'Automatizazión', 'Azure', 'APIs'],
  },
};

const cvLines = [
  'ALVARO RODRIGUEZ MOLINA',
  'FULL STACK DEVELOPER | INTEGRATION, AUTOMATION & AZURE SOLUTIONS',
  '',
  'CONTACT',
  'Phone: +3530858187983',
  'Email: alvrodmol@gmail.com',
  'LinkedIn: https://www.linkedin.com/in/alvrich/',
  'GitHub: https://github.com/alvrichh',
  'Web: https://alvrich.vercel.app/',
  '',
  'PROFILE',
  'R&D Technical Specialist, Full Stack Developer, and System Administrator with experience in SAP S/4 HANA, web application development, and system administration.',
  'Experienced in API integration, authentication workflows, Azure-based services, and automation-driven solutions for real-time and client-oriented digital processes.',
  '',
  'PROFESSIONAL EXPERIENCE',
  'Fusion Analyst | Full Stack & Automation - Synovia Digital - 01/2026 - Present - Ireland',
  '- Built and supported full-stack solutions involving frontend, backend, APIs, authentication, and cloud-connected services.',
  '- Worked with Azure-based tools and services to deliver scalable integration and automation solutions.',
  '- Implemented authentication flows across web applications, including Microsoft-based and third-party login providers.',
  '- Developed API-driven workflows for real-time data extraction, processing, and database updates.',
  '- Automated operational and client-facing processes to improve efficiency, usability, and delivery speed.',
  '- Helped define project setup, repository structure, infrastructure decisions, and development best practices.',
  '',
  'IT Business Consultant SAP Analyst - Primeline Group - 05/2025 - 01/2026 - Ashbourne, Ireland',
  '- SAP S/4 HANA management.',
  '- Trained 3 end-users on SAP S/4 HANA, boosting adoption rates.',
  '- Optimized SAP S/4 HANA workflows, improving process efficiency.',
  '',
  'Multimodal AI Training Specialist - Outlier (Remote, Freelance) - 12/2025 - Present',
  '- Created video, image, audio, and text content to simulate AI-generated outputs and provide human feedback for training multimodal AI models.',
  '',
  'System Admin - Primeline Group - 11/2024 - 05/2025 - Ashbourne, Ireland',
  '- Managed order distribution, system updates, and shipment coordination to ensure timely deliveries and KPI.',
  '- Conducted data analysis and reporting using Excel.',
  '- Optimized workflows and team performance through communication on Microsoft Teams.',
  '',
  'Junior Programmer Intern - Getronics - 04/2024 - 06/2024 - Seville, Spain',
  '- Performed Java testing with Spring Boot, JUnit, and Mockito for Notific@, a government notification system.',
  '- Identified and resolved software bugs, improving product stability.',
  '- Implemented frontend and backend improvements to increase application stability and scalability.',
  '',
  'SKILLS',
  'Programming: Python, Java, JavaScript, TypeScript, SQL, HTML, CSS.',
  'Frameworks: Spring Boot, Spring Security, JUnit, Mockito, Angular, React, Django, Node.js, Express, Hibernate, Webpack, Bootstrap, Tailwind CSS, Pandas.',
  'Cloud, APIs & Deployment: Azure, Azure SQL, AWS, Google Cloud Platform, REST APIs, API Integration, Swagger, Docker, Kubernetes, Firebase, Render.',
  'Authentication & Security: OAuth2, JWT, Authentication Flows, HTTPS, SSL, CORS, API Security, Data Encryption, Cybersecurity.',
  'Databases & Data: PostgreSQL, MySQL, MariaDB, MongoDB, Power BI, Excel, Data Preprocessing, Real-Time Data Workflows.',
  'Tools: GitHub, GitLab, Bitbucket, Jenkins, Postman, Jira, Eclipse, VS Code, IntelliJ IDEA, PyCharm, NPM, Gradle, WebStorm.',
  '',
  'EDUCATION',
  'Specialist in Web Application Development - I.E.S. ALIXAR - 2022 - 2024 - Seville, Spain.',
  'Degree in Computer Engineering - University of Seville (ETSSII) - 2019 - 2024 - Seville, Spain.',
  'Technological Bachelor - School Inmaculado Corazon de Maria Portaceli - 2017 - 2019 - Seville, Spain.',
  '',
  'LANGUAGES',
  'Spanish: Native. English: Professional Working Proficiency. German: Basic.',
];

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
  `;

  document.head.appendChild(style);
};

const escapePdfText = (value) => String(value)
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201c\u201d]/g, '"')
  .replace(/[\u2013\u2014]/g, '-')
  .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');

const wrapLine = (line, limit = 86) => {
  if (!line) return [''];
  const words = line.split(/\s+/);
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > limit) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });

  if (current) lines.push(current);
  return lines;
};

const buildPdf = () => {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 46;
  const lineHeight = 13;
  const maxLines = Math.floor((pageHeight - margin * 2) / lineHeight);
  const wrappedLines = cvLines.flatMap((line) => wrapLine(line));
  const pages = [];

  for (let i = 0; i < wrappedLines.length; i += maxLines) {
    pages.push(wrappedLines.slice(i, i + maxLines));
  }

  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject('<< /Type /Catalog /Pages 2 0 R >>');
  const pagesId = addObject('');
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds = [];

  pages.forEach((pageLines, pageIndex) => {
    const commands = ['BT', `/F1 ${pageIndex === 0 ? 11 : 10} Tf`, `${margin} ${pageHeight - margin} Td`];
    pageLines.forEach((line, index) => {
      if (index > 0) commands.push(`0 -${lineHeight} Td`);
      const isHeading = line && line === line.toUpperCase() && line.length < 48;
      if (isHeading) commands.push('/F1 12 Tf');
      commands.push(`(${escapePdfText(line)}) Tj`);
      if (isHeading) commands.push(`/F1 ${pageIndex === 0 ? 11 : 10} Tf`);
    });
    commands.push('ET');

    const stream = commands.join('\n');
    const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const downloadCv = async () => {
  try {
    const response = await fetch(CV_FILE_PATH, { method: 'HEAD', cache: 'no-store' });
    if (response.ok) {
      const link = document.createElement('a');
      link.href = CV_FILE_PATH;
      link.download = CV_FILE_NAME;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }
  } catch (error) {
    // Fallback below.
  }

  const pdf = buildPdf();
  downloadBlob(new Blob([pdf], { type: 'application/pdf' }), CV_FILE_NAME);
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
  document.querySelector('[data-cv-copy="title"]')?.replaceChildren(document.createTextNode(data.title));
  document.querySelector('[data-cv-copy="body"]')?.replaceChildren(document.createTextNode(data.body));
  document.querySelector('[data-cv-copy="fallback"]')?.replaceChildren(document.createTextNode(data.fallback));
  const chips = document.querySelector('[data-cv-chips]');
  if (chips) chips.innerHTML = data.chips.map((chip) => `<span>${chip}</span>`).join('');
  document.querySelector('[data-download-cv]')?.replaceChildren(document.createTextNode(data.download));
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
