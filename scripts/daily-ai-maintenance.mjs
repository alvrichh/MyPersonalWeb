import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TODAY = new Date().toISOString().slice(0, 10);
const AI_WATCH_DIR = path.join(ROOT, 'docs', 'ai-watch');
const HISTORY_DIR = path.join(AI_WATCH_DIR, 'history');
const DATA_DIR = path.join(ROOT, 'assets', 'data');
const LATEST_PATH = path.join(AI_WATCH_DIR, 'latest.md');
const HISTORY_PATH = path.join(HISTORY_DIR, `${TODAY}.md`);
const IDEAS_PATH = path.join(AI_WATCH_DIR, 'portfolio-candidates.json');
const RADAR_PATH = path.join(DATA_DIR, 'ai-radar.json');

const SOURCES = [
  { name: 'OpenAI News', url: 'https://openai.com/news/rss.xml', homepage: 'https://openai.com/news/' },
  { name: 'Anthropic News', url: 'https://www.anthropic.com/news/rss.xml', homepage: 'https://www.anthropic.com/news' },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', homepage: 'https://blog.google/technology/ai/' },
  { name: 'GitHub AI & ML Blog', url: 'https://github.blog/ai-and-ml/feed/', homepage: 'https://github.blog/ai-and-ml/' },
  { name: 'Microsoft AI Blog', url: 'https://blogs.microsoft.com/ai/feed/', homepage: 'https://blogs.microsoft.com/ai/' },
];

const KEYWORDS = [
  'ai', 'agent', 'agents', 'agentic', 'mcp', 'model context protocol', 'tool use',
  'chatgpt', 'claude', 'copilot', 'gemini', 'openai', 'anthropic', 'multimodal',
  'coding', 'developer', 'automation', 'workflow', 'reasoning', 'assistant', 'tools',
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
  ['automation', 'AI automation and workflow design'],
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

    if (!response.ok) return { source, ok: false, error: `HTTP ${response.status}` };

    const xml = await response.text();
    const items = parseItems(xml, source).filter(isRelevant).slice(0, 8);
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
          status: 'safe-data-candidate',
          reason: 'Detected in official AI/news feeds. Displayed as radar data, not as a personal certification claim.',
          examples: [],
        });
      }
      const signal = signals.get(label);
      if (signal.examples.length < 3) {
        signal.examples.push({ title: item.title, source: item.source, link: item.link, date: item.date });
      }
    }
  }

  return [...signals.values()].slice(0, 8);
};

const buildRadarItems = (items) => items.slice(0, 8).map((item) => ({
  title: item.title,
  source: item.source,
  date: item.date || TODAY,
  url: item.link,
  summary: item.description ? `${item.description.slice(0, 180)}${item.description.length > 180 ? '...' : ''}` : 'AI update detected from an official or high-signal source.',
}));

const enhanceWithOpenAI = async (radarItems, candidates) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !radarItems.length) return { radarItems, candidates, usedOpenAI: false };

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input: [
          {
            role: 'system',
            content: 'You create conservative portfolio radar summaries. Do not claim personal experience or certifications. Return valid JSON only.',
          },
          {
            role: 'user',
            content: JSON.stringify({ radarItems, candidates }).slice(0, 18000),
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'ai_radar_enrichment',
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                headline: { type: 'string' },
                insight: { type: 'string' },
                portfolioAngle: { type: 'string' },
              },
              required: ['headline', 'insight', 'portfolioAngle'],
            },
          },
        },
      }),
    });

    if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);
    const payload = await response.json();
    const text = payload.output_text || payload.output?.flatMap((part) => part.content || []).map((part) => part.text).filter(Boolean).join('\n') || '';
    const enrichment = JSON.parse(text);
    return { radarItems, candidates, enrichment, usedOpenAI: true };
  } catch (error) {
    console.log(`OpenAI enrichment skipped: ${error.message}`);
    return { radarItems, candidates, usedOpenAI: false };
  }
};

const buildReport = (results, items, candidates, enrichmentMeta) => {
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

  const enrichmentRows = enrichmentMeta?.usedOpenAI && enrichmentMeta.enrichment
    ? `\n## AI enrichment\n\n- **Headline:** ${enrichmentMeta.enrichment.headline}\n- **Insight:** ${enrichmentMeta.enrichment.insight}\n- **Portfolio angle:** ${enrichmentMeta.enrichment.portfolioAngle}\n`
    : '\n## AI enrichment\n\n- OpenAI enrichment was not used. RSS/rules fallback generated the radar safely.\n';

  return `# Daily AI maintenance report — ${TODAY}\n\nThis file is generated automatically by the daily maintenance workflow. It updates safe research/data files and feeds the AI Radar card inside Portfolio.\n\n## Source status\n\n${sourceRows}\n\n## Relevant AI updates\n\n${itemRows}\n\n## Portfolio candidates\n\n${candidateRows}\n${enrichmentRows}\n## Safety policy\n\n- Do not edit live HTML/CSS layout automatically.\n- Only update docs/ai-watch and assets/data/ai-radar.json.\n- Do not claim certifications or experience that has not been manually confirmed.\n- Production build must pass before commit/push.\n`;
};

const readExisting = async (filePath) => existsSync(filePath) ? readFile(filePath, 'utf8') : '';

const writeIfChanged = async (filePath, content) => {
  const previous = await readExisting(filePath);
  if (previous === content) return false;
  await writeFile(filePath, content, 'utf8');
  return true;
};

await mkdir(HISTORY_DIR, { recursive: true });
await mkdir(DATA_DIR, { recursive: true });

const results = await Promise.all(SOURCES.map(fetchSource));
const items = results
  .flatMap((result) => result.ok ? result.items : [])
  .sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.source.localeCompare(b.source))
  .slice(0, 32);
const candidates = buildPortfolioCandidates(items);
const radarItems = buildRadarItems(items);
const enriched = await enhanceWithOpenAI(radarItems, candidates);
const report = buildReport(results, items, candidates, enriched);

const radarPayload = {
  generatedAt: new Date().toISOString(),
  date: TODAY,
  mode: enriched.usedOpenAI ? 'rss-plus-openai' : 'rss-rules-fallback',
  headline: enriched.enrichment?.headline || 'AI radar update',
  insight: enriched.enrichment?.insight || 'Recent AI, agent and developer-tooling signals collected from official feeds.',
  portfolioAngle: enriched.enrichment?.portfolioAngle || 'Use these signals to decide whether new AI/agent capabilities deserve a future portfolio card.',
  items: enriched.radarItems,
  candidates: enriched.candidates,
};

const candidatePayload = `${JSON.stringify({ generatedAt: radarPayload.generatedAt, candidates }, null, 2)}\n`;
const radarJson = `${JSON.stringify(radarPayload, null, 2)}\n`;

const changed = [
  await writeIfChanged(LATEST_PATH, report),
  await writeIfChanged(HISTORY_PATH, report),
  await writeIfChanged(IDEAS_PATH, candidatePayload),
  await writeIfChanged(RADAR_PATH, radarJson),
].some(Boolean);

console.log(changed ? 'AI maintenance report and radar updated.' : 'AI maintenance files already up to date.');
console.log(`Relevant items: ${items.length}`);
console.log(`Portfolio candidates: ${candidates.length}`);
console.log(`OpenAI enrichment: ${enriched.usedOpenAI ? 'yes' : 'no'}`);
