import type { MessageKey } from '../i18n/I18nContext';

// Selected work, in the order it appears on the home page.

export type Project = {
  /** A literal name, or a message key when the name is translated. */
  title: string | { key: MessageKey };
  href?: string;
  external?: boolean;
  summary: MessageKey;
  points?: MessageKey[];
  stack: string;
  year: string;
  status: MessageKey;
  /** Private client work: the status is shown in the accent colour. */
  private?: boolean;
};

export const PROJECTS: Project[] = [
  {
    title: { key: 'work.flow.title' },
    summary: 'work.bkd',
    stack: 'Flask · Azure SQL · Microsoft Graph · TSS API · Docker · Render',
    year: '2026',
    status: 'work.private',
    private: true,
  },
  {
    title: { key: 'work.sync.title' },
    summary: 'work.sync.summary',
    points: ['work.sync.p1', 'work.sync.p2', 'work.sync.p3', 'work.sync.p4', 'work.sync.p5'],
    stack: 'Microsoft Entra ID · JWT · RBAC · SAP S/4HANA API · Snowflake · SMTP · In-house AI',
    year: '2026',
    status: 'work.private',
    private: true,
  },
  {
    title: 'Live AI Radar',
    href: './ai-radar.html',
    summary: 'work.radar',
    stack: 'Node.js · GitHub Actions · RSS · JSON',
    year: '2026',
    status: 'work.live',
  },
  {
    title: 'Bubble Planning OS',
    href: './planning.html',
    summary: 'work.planning',
    stack: 'HTML · CSS · JavaScript · localStorage',
    year: '2026',
    status: 'work.personal',
  },
  {
    title: 'alvrich gym',
    href: './gym.html',
    summary: 'work.gym',
    stack: 'HTML · CSS · JavaScript',
    year: '2026',
    status: 'work.personal',
  },
  {
    title: 'This site',
    href: 'https://github.com/alvrichh/MyPersonalWeb',
    external: true,
    summary: 'work.site',
    stack: 'React · TypeScript · SCSS · Vite · GitHub Actions · Vercel',
    year: '2024 –',
    status: 'work.open',
  },
];

export const SKILLS: { label: MessageKey; value: string | { key: MessageKey } }[] = [
  { label: 'skills.langs', value: 'Python, Java, JavaScript, TypeScript, SQL' },
  { label: 'skills.frameworks', value: 'React, Angular, Node.js, Express, Spring Boot, Django, Flask' },
  { label: 'skills.cloud', value: 'Azure, Azure SQL, Microsoft Graph, REST, Docker, Render, Vercel' },
  { label: 'skills.auth', value: 'OAuth2, JWT, Microsoft identity, CORS, API security' },
  { label: 'skills.data', value: 'PostgreSQL, MySQL, MongoDB, Pandas, Power BI, Excel' },
  { label: 'skills.business', value: 'SAP S/4HANA EWM, CRM, ServiceNow, SharePoint' },
  { label: 'skills.ai', value: { key: 'skills.aiList' } },
  { label: 'skills.ways', value: { key: 'skills.waysList' } },
];
