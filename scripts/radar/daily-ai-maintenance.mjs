import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { getRadarTags, mergeIntoArchive } from './radar-tags.mjs';
import { SOURCES, addMissingMeta, fetchSource, isRelevantForSource } from './radar-sources.mjs';

const ROOT = process.cwd();
const TODAY = new Date().toISOString().slice(0, 10);
const AI_WATCH_DIR = path.join(ROOT, 'docs', 'ai-watch');
const HISTORY_DIR = path.join(AI_WATCH_DIR, 'history');
const DATA_DIR = path.join(ROOT, 'static', 'data');
const LATEST_PATH = path.join(AI_WATCH_DIR, 'latest.md');
const HISTORY_PATH = path.join(HISTORY_DIR, `${TODAY}.md`);
const IDEAS_PATH = path.join(AI_WATCH_DIR, 'portfolio-candidates.json');
const RADAR_PATH = path.join(DATA_DIR, 'ai-radar.json');
// Every story ever collected, for the archive on ai-radar.html.
const ARCHIVE_PATH = path.join(DATA_DIR, 'ai-radar-archive.json');

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

// How many of the 20 latest stories one source may take.
const LATEST_PER_SOURCE = 4;

const DEFAULT_FALLBACK = {
  headline: 'AI radar update',
  insight: 'Recent AI, agent and developer-tooling signals collected from official and high-signal feeds.',
  portfolioAngle: 'Use these signals to decide whether new AI/agent capabilities deserve a future portfolio card.',
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
          reason: 'Detected in AI/news feeds. Displayed as radar data, not as a personal certification claim.',
          examples: [],
        });
      }
      const signal = signals.get(label);
      if (signal.examples.length < 3) {
        signal.examples.push({ title: item.title, source: item.source, link: item.url, date: item.date });
      }
    }
  }

  return [...signals.values()].slice(0, 8);
};

const buildRadarItems = (items) => items.slice(0, 60).map((item) => {
  const summary = item.description ? `${item.description.slice(0, 220)}${item.description.length > 220 ? '...' : ''}` : 'AI update detected from an official or high-signal source.';
  const normalized = {
    title: item.title,
    source: item.source,
    date: item.date || TODAY,
    url: item.url || item.link,
    summary,
    image: item.image || '',
  };

  return {
    ...normalized,
    tags: getRadarTags({ ...item, summary }),
  };
});

const readExistingJson = async (filePath, fallback) => {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return fallback;
  }
};

const mergeRadarItems = (freshItems, existingRadar) => {
  const existingItems = Array.isArray(existingRadar?.items) ? existingRadar.items : [];
  const seen = new Set();
  const merged = [];

  const perSource = new Map();

  for (const item of [...freshItems, ...existingItems]) {
    const url = item.url || item.link || item.title;
    if (!url || seen.has(url)) continue;
    if (!isRelevantForSource(item)) continue;
    const count = perSource.get(item.source) || 0;
    if (count >= LATEST_PER_SOURCE) continue;
    seen.add(url);
    perSource.set(item.source, count + 1);
    const normalized = {
      title: item.title,
      source: item.source || 'AI Radar',
      date: item.date || TODAY,
      url,
      summary: item.aiSummary || item.summary || item.description || item.title,
      tags: Array.isArray(item.tags) && item.tags.length ? item.tags : getRadarTags(item),
      image: item.image || '',
    };
    merged.push(normalized);
    if (merged.length >= 20) break;
  }

  return merged;
};

const parseJsonFromText = (text) => {
  const clean = String(text || '').replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

const normalizeEnrichment = (enrichment = {}) => ({
  headline: String(enrichment.headline || DEFAULT_FALLBACK.headline).slice(0, 90),
  insight: String(enrichment.insight || DEFAULT_FALLBACK.insight).slice(0, 320),
  portfolioAngle: String(enrichment.portfolioAngle || DEFAULT_FALLBACK.portfolioAngle).slice(0, 260),
});

const enhanceWithClaude = async (radarItems, candidates) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !radarItems.length) return null;

  const prompt = `Eres un radar de novedades de IA para el portfolio de un desarrollador Full Stack.\n\nAnaliza estas noticias/candidatos y devuelve SOLO JSON válido con esta forma:\n{\n  "headline": "máx 90 caracteres",\n  "insight": "resumen técnico útil en español, máx 320 caracteres",\n  "portfolioAngle": "cómo puede inspirar una card futura de portfolio sin afirmar certificaciones, máx 260 caracteres"\n}\n\nNo inventes nada y no afirmes experiencia personal nueva.\n\n${JSON.stringify({ radarItems, candidates }).slice(0, 18000)}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 900,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`Claude HTTP ${response.status}`);
    const payload = await response.json();
    const text = payload.content?.map((part) => part.text || '').join('\n') || '';
    return { enrichment: normalizeEnrichment(parseJsonFromText(text)), provider: 'claude' };
  } catch (error) {
    console.log(`Claude enrichment skipped: ${error.message}`);
    return null;
  }
};

const enhanceWithOpenAI = async (radarItems, candidates) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !radarItems.length) return null;

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
          { role: 'system', content: 'You create conservative Spanish portfolio radar summaries. Do not claim personal experience or certifications. Return valid JSON only.' },
          { role: 'user', content: JSON.stringify({ radarItems, candidates }).slice(0, 18000) },
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
    return { enrichment: normalizeEnrichment(parseJsonFromText(text)), provider: 'openai' };
  } catch (error) {
    console.log(`OpenAI enrichment skipped: ${error.message}`);
    return null;
  }
};

const enrichRadar = async (radarItems, candidates) => {
  const claude = await enhanceWithClaude(radarItems, candidates);
  if (claude) return claude;
  const openai = await enhanceWithOpenAI(radarItems, candidates);
  if (openai) return openai;
  return { enrichment: DEFAULT_FALLBACK, provider: 'rules' };
};

const buildReport = (results, items, candidates, enrichmentMeta) => {
  const sourceRows = results.map((result) => {
    if (result.ok) return `- ${result.source.name}: OK (${result.items.length} relevant items)`;
    return `- ${result.source.name}: unavailable (${result.error})`;
  }).join('\n');

  const itemRows = items.length
    ? items.map((item) => `- **${item.title}** — ${item.source}${item.date ? ` · ${item.date}` : ''}\n  ${item.url}`).join('\n')
    : '- No relevant items detected today from the configured sources.';

  const candidateRows = candidates.length
    ? candidates.map((candidate) => `- **${candidate.label}** — ${candidate.reason}`).join('\n')
    : '- No new portfolio candidates generated today.';

  return `# Daily AI maintenance report — ${TODAY}\n\nThis file is generated automatically by the daily maintenance workflow. It updates safe research/data files and feeds the AI Radar card inside Portfolio.\n\n## Source status\n\n${sourceRows}\n\n## Relevant AI updates\n\n${itemRows}\n\n## Portfolio candidates\n\n${candidateRows}\n\n## AI enrichment\n\n- **Provider:** ${enrichmentMeta.provider}\n- **Headline:** ${enrichmentMeta.enrichment.headline}\n- **Insight:** ${enrichmentMeta.enrichment.insight}\n- **Portfolio angle:** ${enrichmentMeta.enrichment.portfolioAngle}\n\n## Safety policy\n\n- Do not edit live HTML/CSS layout automatically.\n- Only update docs/ai-watch and the radar data in static/data.\n- Do not claim certifications or experience that has not been manually confirmed.\n- Production build must pass before commit/push.\n`;
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

const results = await Promise.all(SOURCES.map((source) => fetchSource(source, TODAY)));
const items = results
  .flatMap((result) => result.ok ? result.items : [])
  .sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.source.localeCompare(b.source))
  .slice(0, 80);
const candidates = buildPortfolioCandidates(items);
const freshRadarItems = buildRadarItems(items);
const existingRadar = await readExistingJson(RADAR_PATH, { items: [] });
const mergedRadarItems = await addMissingMeta(mergeRadarItems(freshRadarItems, existingRadar));
const enriched = await enrichRadar(freshRadarItems, candidates);
const report = buildReport(results, items, candidates, enriched);

const radarPayload = {
  generatedAt: new Date().toISOString(),
  date: TODAY,
  mode: enriched.provider === 'claude' ? 'rss-plus-claude' : enriched.provider === 'openai' ? 'rss-plus-openai' : 'rss-rules-fallback',
  headline: enriched.enrichment.headline,
  insight: enriched.enrichment.insight,
  portfolioAngle: enriched.enrichment.portfolioAngle,
  items: mergedRadarItems,
  candidates,
};

const candidatePayload = `${JSON.stringify({ generatedAt: radarPayload.generatedAt, candidates }, null, 2)}\n`;
const existingArchive = await readExistingJson(ARCHIVE_PATH, { items: [] });
const archiveItems = mergeIntoArchive(
  Array.isArray(existingArchive.items) ? existingArchive.items : [],
  mergedRadarItems,
);
const archiveJson = `${JSON.stringify({ generatedAt: radarPayload.generatedAt, items: archiveItems })}\n`;
const radarJson = `${JSON.stringify(radarPayload, null, 2)}\n`;

const changed = [
  await writeIfChanged(LATEST_PATH, report),
  await writeIfChanged(HISTORY_PATH, report),
  await writeIfChanged(IDEAS_PATH, candidatePayload),
  await writeIfChanged(RADAR_PATH, radarJson),
  await writeIfChanged(ARCHIVE_PATH, archiveJson),
].some(Boolean);

console.log(changed ? 'AI maintenance report and radar updated.' : 'AI maintenance files already up to date.');
console.log(`Relevant items: ${items.length}`);
console.log(`Portfolio candidates: ${candidates.length}`);
console.log(`AI enrichment provider: ${enriched.provider}`);
