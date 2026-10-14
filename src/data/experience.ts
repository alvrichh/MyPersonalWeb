import type { MessageKey } from '../i18n/I18nContext';

// Work history, newest first. Text that changes with the language is a
// message key; names, titles and technologies stay as written.

export type Period = {
  /** "YYYY-MM" */
  start: string;
  /** "YYYY-MM"; omitted while the role is current. */
  end?: string;
  type?: 'fulltime' | 'parttime' | 'temporary' | 'internship';
  place?: 'ireland' | 'usa' | 'seville';
  mode?: 'remote' | 'hybrid' | 'onsite';
  /** Show only the duration (used for a company that groups several roles). */
  hideDates?: boolean;
};

export type Role = {
  title: string;
  period: Period;
  summary?: MessageKey;
  points?: MessageKey[];
  tags?: string[];
  tagsLabel?: 'Technologies' | 'Skills';
};

export type Job = {
  company: string;
  url?: string;
  logo: string;
  /** A company with several roles is listed once, LinkedIn-style. */
  period?: Period;
  roles: Role[];
  media?: { href: string; image: string; alt: string; width: number; height: number; label: string };
};

export const JOBS: Job[] = [
  {
    company: 'Synovia Digital',
    url: 'https://synoviadigital.com/',
    logo: 'synovia-digital.png',
    roles: [{
      title: 'Fusion Analyst',
      period: { start: '2026-01', type: 'fulltime', place: 'ireland', mode: 'remote' },
      summary: 'xp.synovia.summary',
      points: ['xp.synovia.p1', 'xp.synovia.p2', 'xp.synovia.p3', 'xp.synovia.p4', 'xp.synovia.p5', 'xp.synovia.p6'],
      tags: ['Python', 'FastAPI', 'Flask', 'Azure', 'Microsoft Graph', 'Entra ID', 'SAP EWM', 'Snowflake'],
    }],
  },
  {
    company: 'Mercor',
    url: 'https://www.mercor.com/',
    logo: 'mercor.png',
    roles: [{
      title: 'AI Visual QA Specialist',
      period: { start: '2026-07', end: '2026-08', type: 'temporary', place: 'usa', mode: 'remote' },
      summary: 'xp.mercor.summary',
      points: ['xp.mercor.p1', 'xp.mercor.p2', 'xp.mercor.p3', 'xp.mercor.p4'],
      tags: ['Visual QA', 'Typography', 'Data visualisation', 'Evaluation rubrics'],
    }],
  },
  {
    company: 'Outlier',
    url: 'https://outlier.ai/',
    logo: 'outlier.svg',
    roles: [{
      title: 'Multimodal AI Training Specialist',
      period: { start: '2025-11', end: '2026-02', type: 'parttime', place: 'usa', mode: 'remote' },
      summary: 'xp.outlier.summary',
      tags: ['Multimodal AI', 'Human-in-the-loop', 'Content creation'],
    }],
  },
  {
    company: 'Primeline Group',
    url: 'https://primeline.ie/',
    logo: 'primeline-group.png',
    period: { start: '2024-09', end: '2026-02', type: 'fulltime', place: 'ireland', hideDates: true },
    roles: [
      {
        title: 'SAP Administrator',
        period: { start: '2025-05', end: '2026-02' },
        summary: 'xp.sap.summary',
        points: ['xp.sap.p1', 'xp.sap.p2', 'xp.sap.p3', 'xp.sap.p4', 'xp.sap.p5', 'xp.sap.p6', 'xp.sap.p7'],
        tags: ['SAP S/4HANA', 'SAP EWM', 'Power BI', 'SQL', 'Excel', 'SharePoint', 'Microsoft Teams', 'UAT', 'SOPs'],
      },
      {
        title: 'System Admin',
        period: { start: '2024-11', end: '2025-05', place: 'ireland' },
        points: ['xp.sysadmin.p1', 'xp.sysadmin.p2', 'xp.sysadmin.p3'],
        tags: ['Gaina', 'Excel', 'Microsoft Office'],
      },
      {
        title: 'General Operative',
        period: { start: '2024-09', end: '2024-11', place: 'ireland', mode: 'onsite' },
      },
    ],
  },
  {
    company: 'Getronics',
    url: 'https://www.getronics.com/',
    logo: 'getronics.png',
    roles: [{
      title: 'Software Developer',
      period: { start: '2024-04', end: '2024-07', type: 'internship', place: 'seville', mode: 'hybrid' },
      summary: 'xp.getronics.summary',
      tags: ['Java', 'Spring Boot', 'JUnit', 'Mockito'],
    }],
  },
  {
    company: 'Stratton Global',
    logo: 'stratton-global.png',
    period: { start: '2023-01', end: '2024-04', place: 'seville', hideDates: true },
    roles: [
      {
        title: 'Energy Advisor & Business Consultant',
        period: { start: '2023-01', end: '2024-04', mode: 'onsite' },
        points: ['xp.stratton.p1', 'xp.stratton.p2'],
        tags: ['Customer insight', 'Comparative marketing analysis', 'Sales', 'Mentoring'],
        tagsLabel: 'Skills',
      },
      {
        title: 'Energy Advisor',
        period: { start: '2023-01', end: '2024-01', type: 'fulltime' },
      },
    ],
  },
  {
    company: 'El Tortillón',
    logo: 'el-tortillon.png',
    roles: [{
      title: 'Store Clerk & Digital Manager',
      period: { start: '2018-08', end: '2020-12', type: 'temporary', place: 'seville' },
      summary: 'xp.tortillon.summary',
      tags: ['Social media', 'Branding', 'Web design', 'Teamwork'],
      tagsLabel: 'Skills',
    }],
    media: {
      href: 'https://www.instagram.com/don.heladon/',
      image: 'logos/don-heladon-wide.png',
      alt: 'Don Heladón, helados artesanos: logo with a white outline ice-cream cone on teal',
      width: 191,
      height: 56,
      label: 'Instagram',
    },
  },
];

export type School = {
  name: MessageKey;
  org: string;
  url?: string;
  years: string;
  logo: string;
  /** Round logos already trimmed to their circle fill it edge to edge. */
  fill?: boolean;
  note?: MessageKey;
  /** Shown in the Education section's columns. */
  summary?: MessageKey;
  place?: 'seville';
  /** A short paragraph about the years, shown under the summary. */
  bio?: MessageKey;
  /** What I learned or worked with, shown as chips like a job's tags. */
  tags?: string[];
  tagsLabel?: string;
};

export const EDUCATION: School[] = [
  {
    name: 'exp.eduOne', org: 'Universidad de Sevilla · ETSII', url: 'https://www.us.es/', years: '2019 — 2024', logo: 'universidad-sevilla.png', fill: true,
    place: 'seville', summary: 'edu.us.summary', bio: 'edu.us.bio',
    tags: ['Programming', 'Statistics', 'Discrete Mathematics', 'Calculus', 'Algebra', 'Electronic Circuits', 'Verilog', 'HDL', 'RSA', 'Linux'],
    tagsLabel: 'Core subjects',
  },
  {
    name: 'exp.eduTwo', org: 'IES Alixar', url: 'https://iesalixar.org/', years: '2022 — 2024', logo: 'ies-alixar.png', fill: true,
    place: 'seville', summary: 'edu.daw.summary', bio: 'edu.daw.bio',
    tags: ['Java', 'JavaScript', 'Python', 'HTML5', 'CSS', 'Spring Boot', 'Angular', 'React', 'Node.js', 'Django', 'Docker', 'AWS', 'SQL', 'JSP', 'JPA', 'Thymeleaf', 'Maven', 'Servlets'],
    tagsLabel: 'Technologies',
  },
  {
    name: 'exp.eduThree', org: 'Inmaculado Corazón de María Portaceli', url: 'https://fundacionloyola.com/portaceli/', years: '2017 — 2019', logo: 'portaceli.png',
    place: 'seville', summary: 'edu.bach.summary',
    tags: ['Mathematics', 'Physics', 'Technical Drawing', 'Industrial Technology', 'ICT'],
    tagsLabel: 'Core subjects',
  },
];

export const VOLUNTEERING: School[] = [
  { name: 'exp.volRole', org: 'Tu mundo Portaceli', years: '2017 — 2018', logo: 'portaceli.png', note: 'exp.volText' },
];

export type Certificate = {
  name: string;
  issuer: 'OpenWebinars' | 'LinkedIn';
  year: number;
  url: string;
  /** A picture of the certificate itself, when there is one. */
  thumb?: string;
};

const OPENWEBINARS_PROFILE = 'https://openwebinars.net/@QVN2PXMV/';
const LINKEDIN_CERTS = 'https://www.linkedin.com/in/alvrich/details/certifications/';

export const CERTIFICATES: Certificate[] = [
  { name: 'React', issuer: 'OpenWebinars', year: 2024, url: OPENWEBINARS_PROFILE },
  { name: 'Aplicaciones Web con Django', issuer: 'OpenWebinars', year: 2024, url: 'https://openwebinars.net/certificacion/82jiToOg', thumb: 'django.jpg' },
  { name: 'Creando un CRUD con PHP, MySQL, HTML, CSS y JavaScript', issuer: 'OpenWebinars', year: 2024, url: 'https://openwebinars.net/certificacion/PF1oAvra', thumb: 'crud-php.jpg' },
  { name: 'Desarrollo full-stack práctico: configuración profesional de proyectos', issuer: 'LinkedIn', year: 2024, url: LINKEDIN_CERTS },
  { name: 'Fundamentos del desarrollo web: Full Stack o Front-end', issuer: 'LinkedIn', year: 2024, url: LINKEDIN_CERTS },
  { name: 'Python', issuer: 'OpenWebinars', year: 2024, url: OPENWEBINARS_PROFILE },
  { name: 'Despliega con Docker Compose tu app compuesta por Spring Boot, Angular y PostgreSQL', issuer: 'OpenWebinars', year: 2023, url: 'https://openwebinars.net/certificacion/hC6opJDr', thumb: 'docker-compose.jpg' },
  { name: 'Desarrolla una app con Spring Boot y Angular', issuer: 'OpenWebinars', year: 2023, url: 'https://openwebinars.net/certificacion/dD9Iojy0', thumb: 'spring-angular.jpg' },
  { name: 'Cómo montar tu WebApp de Angular en Docker', issuer: 'OpenWebinars', year: 2023, url: 'https://openwebinars.net/certificacion/jxyRv3kC', thumb: 'angular-docker.jpg' },
  { name: 'Desplegar app Spring Boot con Docker', issuer: 'OpenWebinars', year: 2023, url: 'https://openwebinars.net/certificacion/LYRVi7Q5', thumb: 'spring-docker.jpg' },
  { name: 'Curso de Introducción a Docker', issuer: 'OpenWebinars', year: 2023, url: 'https://openwebinars.net/certificacion/iOsDZht0', thumb: 'docker-intro.jpg' },
  { name: 'Node.js', issuer: 'OpenWebinars', year: 2023, url: OPENWEBINARS_PROFILE },
  { name: 'Java', issuer: 'OpenWebinars', year: 2023, url: OPENWEBINARS_PROFILE },
  { name: 'Fundamentos de JavaScript', issuer: 'OpenWebinars', year: 2023, url: 'https://openwebinars.net/certificacion/je7AeIlW', thumb: 'javascript.jpg' },
  { name: 'MySQL', issuer: 'OpenWebinars', year: 2023, url: OPENWEBINARS_PROFILE },
];
