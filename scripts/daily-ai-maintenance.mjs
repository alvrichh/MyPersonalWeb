import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TODAY = new Date().toISOString().slice(0, 10);
const AI_WATCH_DIR = path.join(ROOT, 'docs', 'ai-watch');
const HISTORY_DIR = path.join(AI_WATCH_DIR, 'history');
const LATEST_PATH = path.join(AI_WATCH_DIR, 'latest.md');
const HISTORY_PATH = path.join(HISTORY_DIR, `${TODAY}.md`);
const IDEAS_PATH = path.join(AI_WATCH_DIR, 'portfolio-candidates.json');

const SOURCES = [
  {
    name: 'OpenAI News',
    url: 'https://openai.com/news/rss.xml',
    homepage: 'https://openai.com/news/',
  },
  {
    name: 'Anthropic News',
    url: 'https://www.anthropic.com/news/rss.xml',
    homepage: 'https://www.anthropic.com/news',
  },
  {
    name: 'Google AI Blog',
    url: 'https://blog.google/technology/ai/rss/',
    homepage: 'https://blog.google/technology/ai/',
  },
  {
    name: 'GitHub AI & ML Blog',
    url: 'https://github.blog/ai-and-ml/feed/',
    homepage: 'https://github.blog/ai-and-ml/',
  },
  {
    name: 'Microsoft AI Blog',
    url: 'https://blogs.microsoft.com/ai/feed/',
    homepage: 'https://blogs.microsoft.com/ai/',
  },
];

const KEYWORDS = [
  'ai',
  'agent',
  'agents',
  'agentic',
  'mcp',
  'model context protocol',
  'tool use',
  'chatgpt',
  'claude',
  'copilot',
  'gemini',
  'openai',
  'anthropic',
  'multimodal',
  'coding',
  'developer',
  'automation',
  'workflow',
  'reasoning',
];

const PORTFOLIO_SIGNALS = [
  ['agent', 'AI agents / automation workflows'],
  ['mcp', 'MCP / tool-connected assistants'],
  ['model context protocol', 'MCP / tool-connected assistants'],
  ['coding', 'AI coding assistant workflows'],
  ['developer', 'AI developer tooling'],
  ['multimodal', 'Multimodal AI product workflows'],
  ['copilot', 'GitHub Copilot developer loop'],
  ['chatgpt', 'ChatGPT workflow design'],
  ['claude', 'Claude research and documentation flow'],
  ['gemini', 'Gemini multimodal exploration'],
];

const decodeEntities = (value = '') => value
  .replaceAll('<![CDATA[', '')
  .replaceAll(']]>', '')
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replaceAll('&apos;', "'")
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replace(/<[^>]+>/g, '')
  .trim();

const strip = (value = '') => decodeEntities(String(value).replace(/\s+/g, ' '));

const getTag = (item, tag) => {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? strip(match[1]) : '';
};

const parseItems = (xml, source) => {
  const rssItems = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  const atomItems = [...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi)].map((match) => match[0]);
  const items = rssItems.length ? rssItems : atomItems;

  return items.map((raw) => {
    const title = getTag(raw, 'title');
    const description = getTag(raw, 'description') || getTag(raw, 'summary') || getTag(raw, 'content');
    const pubDate = getTag(raw, 'pubDate') || getTag(raw, 'updated') || getTag(raw, 'published');
    const guid = getTag(raw, 'guid');
    const rssLink = getTag(raw, 'link');
    const atomLink = raw.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || '';
    const link = rssLink || atomLink || guid || source.homepage;

    return {
      source: source.name,
      title,
      description,
      date: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : '',
      link,
    };
  }).filter((item) => item.title);
};

const isRelevant = (item) => {
  const haystack = `${item.title} ${item.description}`.toLowerCase();
  return KEYWORDS.some((keyword) => haystack.includes(keyword));
};

const fetchSource = async (source) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'alvrich-maintenance-bot/1.0 (+https://alvrich.vercel.app)',
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });

    if (!response.ok) {
      return { source, ok: false, error: `HTTP ${response.status}` };
    }

    const xml = await response.text();
    const items = parseItems(xml, source).filter(isRelevant).slice(0, 6);
    return { source, ok: true, items };
  } catch (error) {
    return { source, ok: false, error: error.name === 'AbortError' ? 'Timeout' : error.message };
  } finally {
    clearTimeout(timeout);
  }
};

const buildPortfolioCandidates = (items) => {
  const signals = new Map();

  for (const item of items) {
    const haystack = `${item.title} ${item.description}`.toLowerCase();
    for (const [keyword, label] of PORTFOLIO_SIGNALS) {
      if (!haystack.includes(keyword)) continue;
      if (!signals.has(label)) {
        signals.set(label, {
          label,
          status: 'manual-review',
          reason: 'Detected in official AI/news feeds. Review before adding to the live portfolio.',
          examples: [],
        });
      }
      const signal = signals.get(label);
      if (signal.examples.length < 3) {
        signal.examples.push({ title: item.title, source: item.source, link: item.link, date: item.date });
      }
    }
  }

  return [...signals.values()];
};

const buildReport = (results, items, candidates) => {
  const sourceRows = results.map((result) => {
    if (result.ok) return `- ${result.source.name}: OK (${result.items.length} relevant items)`;
    return `- ${result.source.name}: unavailable (${result.error})`;
  }).join('\n');

  const itemRows = items.length
    ? items.map((item) => `- **${item.title}** — ${item.source}${item.date ? ` · ${item.date}` : ''}\n  ${item.link}`).join('\n')
    : '- No relevant items detected today from the configured sources.';

  const candidateRows = candidates.length
    ? candidates.map((candidate) => `- **${candidate.label}** — ${candidate.reason}`).join('\n')
    : '- No new portfolio candidates generated today.';

  return `# Daily AI maintenance report — ${TODAY}\n\nThis file is generated automatically by the daily maintenance workflow. It does **not** change the live portfolio UI. It only records AI-related signals and portfolio ideas for manual review.\n\n## Source status\n\n${sourceRows}\n\n## Relevant AI updates\n\n${itemRows}\n\n## Portfolio candidates for manual review\n\n${candidateRows}\n\n## Safety policy\n\n- Do not edit live portfolio cards automatically.\n- Do not claim certifications or experience that has not been manually confirmed.\n- Open a pull request with research/report files only.\n- Human review is required before turning candidates into live portfolio content.\n`;
};

const readExisting = async (filePath) => {
  if (!existsSync(filePath)) return '';
  return readFile(filePath, 'utf8');
};

const writeIfChanged = async (filePath, content) => {
  const previous = await readExisting(filePath);
  if (previous === content) return false;
  await writeFile(filePath, content, 'utf8');
  return true;
};

await mkdir(HISTORY_DIR, { recursive: true });

const results = await Promise.all(SOURCES.map(fetchSource));
const items = results
  .flatMap((result) => result.ok ? result.items : [])
  .sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.source.localeCompare(b.source))
  .slice(0, 24);
const candidates = buildPortfolioCandidates(items);
const report = buildReport(results, items, candidates);
const candidatePayload = `${JSON.stringify({ generatedAt: new Date().toISOString(), candidates }, null, 2)}\n`;

const changed = [
  await writeIfChanged(LATEST_PATH, report),
  await writeIfChanged(HISTORY_PATH, report),
  await writeIfChanged(IDEAS_PATH, candidatePayload),
].some(Boolean);

console.log(changed ? 'AI maintenance report updated.' : 'AI maintenance report already up to date.');
console.log(`Relevant items: ${items.length}`);
console.log(`Portfolio candidates: ${candidates.length}`);
