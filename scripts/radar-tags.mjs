// Topic tags for AI radar stories, shared by the daily bot and the archive backfill.

export const RADAR_TAG_RULES = [
  ['Agents', ['agent', 'agents', 'agentic', 'assistant', 'tool use', 'tools']],
  ['MCP', ['mcp', 'model context protocol']],
  ['ChatGPT', ['chatgpt', 'openai', 'gpt']],
  ['Claude', ['claude', 'anthropic']],
  ['Copilot', ['copilot', 'github copilot']],
  ['Gemini', ['gemini', 'google ai']],
  ['Dev Tools', ['developer', 'coding', 'code', 'dev tool', 'developer tools']],
  ['Automation', ['automation', 'workflow', 'workflows', 'orchestration']],
  ['Multimodal', ['multimodal', 'image', 'vision', 'audio', 'video']],
  ['Models', ['model', 'llm', 'reasoning']],
];

export const getRadarTags = (item) => {
  const haystack = `${item.title || ''} ${item.description || ''} ${item.summary || ''} ${item.source || ''}`.toLowerCase();
  const tags = RADAR_TAG_RULES
    .filter(([, keywords]) => keywords.some((keyword) => haystack.includes(keyword)))
    .map(([tag]) => tag);

  return tags.length ? [...new Set(tags)].slice(0, 4) : ['AI'];
};

// ---------------------------------------------------------------- Relevance
// The radar is about the owner's own field: AI engineering, agents, LLMs,
// developer tooling, cloud, automation and data. Not money, courts, politics
// or entertainment.

const words = (terms) => new RegExp(`\\b(?:${terms.join('|')})\\b`, 'i');

// Something from the skill set has to be in the title or summary.
const SKILL = words([
  'ai agents?', 'agents?', 'agentic', 'llms?', 'large language models?', 'language models?',
  'foundation models?', 'frontier models?', 'open[- ]weights?', 'open[- ]source models?', 'models?',
  'gpt[- ]?\\d[\\w.-]*', 'chatgpt', 'codex', 'claude', 'gemini', 'gemma', 'llama', 'mistral', 'copilot',
  'mcp', 'model context protocol', 'apis?', 'sdks?', 'developers?', 'coding', 'code', 'programming',
  'open[- ]source', 'python', 'typescript', 'javascript', 'azure', 'aws', 'bedrock', 'sagemaker',
  'vertex ai', 'cloud', 'kubernetes', 'docker', 'serverless', 'automation', 'automate\\w*', 'workflows?',
  'rag', 'retrieval', 'embeddings?', 'vector (?:search|databases?)', 'fine[- ]?tun\\w*', 'inference',
  'benchmarks?', 'reasoning', 'multimodal', 'speech', 'transcription', 'text[- ]to[- ]\\w+',
  'image generation', 'video generation', 'transformers?', 'datasets?', 'evals?', 'evaluations?',
  'prompt\\w*', 'context windows?', 'tokens?', 'sap', 'data pipelines?', 'databases?', 'github',
  'vs code', 'ide', 'cli', 'terminal', 'devops', 'ci/cd', 'machine learning', 'deep learning',
  'neural', 'computer use', 'tool use', 'function calling', 'structured outputs?', 'interpretability',
  'alignment', 'safety research', 'red[- ]teaming', 'security', 'cyber\\w*','vulnerabilit\\w*', 'sandbox\\w*',
]);

// General-interest sources must also be explicitly about AI.
const AI = words([
  'ai', 'a\\.i\\.', 'artificial intelligence', 'genai', 'generative', 'llms?', 'machine learning', 'ml',
  'agents?', 'agentic', 'copilot', 'gpt[- ]?\\d[\\w.-]*', 'chatgpt', 'codex', 'claude', 'gemini',
  'openai', 'anthropic', 'deepmind', 'hugging face', 'mcp', 'neural', 'inference', 'models?',
]);

// Never: money, deals, courts, politics, entertainment, social feeds, ads.
const EXCLUDE = words([
  'funding', 'fundraising?', 'valuations?', 'valued at', 'investors?', 'investments?', 'invests?',
  'venture capital', 'series [a-f]', 'ipo', 'acquisitions?', 'acquires?', 'acquired', 'merger',
  'stock market', 'earnings', 'revenue', 'profits?', 'layoffs?', 'lawsuits?', 'sues', 'sued',
  'court', 'antitrust', 'trump', 'biden', 'elections?',
  'congress', 'senate', 'politic\\w*', 'bankruptcy', 'celebrit\\w*', 'actress', 'actors?', 'movies?',
  'films?', 'hollywood', 'music', 'songs?', 'singers?', 'albums?', 'games?', 'gaming', 'gamers?',
  'xbox', 'playstation', 'nintendo', 'steam', 'tv shows?', 'netflix', 'disney', 'tiktok', 'instagram',
  'facebook', 'dating', 'ads', 'advertis\\w*', 'price hikes?', 'smartphones?', 'iphone', 'pixel',
]);

// Money amounts ("raises $50M", "a $2bn deal") don't fit word boundaries, so
// they get their own pattern. "Raises the bar" is fine; "raises $40M" is not.
const MONEY = /\$\s?\d[\d.,]*\s?(?:k|m|mn|bn?|million|billion)\b|\braise[sd]?\s+(?:\$|\d)/i;

// Summaries mention money and markets in passing ("saved $2M a year"), so only
// clearly financial or legal stories are dropped on the summary alone.
const EXCLUDE_LEAD = words([
  'funding', 'fundraising?', 'valuations?', 'investors?', 'venture capital', 'series [a-f]', 'ipo',
  'acquisitions?', 'acquires?', 'merger', 'layoffs?', 'lawsuits?', 'sues', 'sued', 'antitrust', 'bankruptcy',
]);

export const isRelevantStory = (item, { aiNative = false } = {}) => {
  const title = String(item.title || '');
  const lead = String(item.description || item.summary || '').slice(0, 240);
  const text = `${title} ${item.description || item.summary || ''}`;
  if (EXCLUDE.test(title) || MONEY.test(title) || EXCLUDE_LEAD.test(lead)) return false;
  if (!SKILL.test(text)) return false;
  return aiNative || AI.test(text);
};

// Every story ever collected, newest first, one entry per URL. A story seen
// again keeps the richer fields (picture, summary) from either copy.
export const mergeIntoArchive = (archiveItems, freshItems) => {
  const byUrl = new Map();

  for (const item of [...freshItems, ...archiveItems]) {
    if (!item?.url || !item.title) continue;
    const known = byUrl.get(item.url);
    if (!known) {
      byUrl.set(item.url, {
        title: item.title,
        source: item.source || 'AI Radar',
        date: item.date,
        url: item.url,
        tags: Array.isArray(item.tags) && item.tags.length ? item.tags : getRadarTags(item),
        ...(item.summary ? { summary: item.summary } : {}),
        ...(item.image ? { image: item.image } : {}),
      });
      continue;
    }
    if (!known.summary && item.summary) known.summary = item.summary;
    if (!known.image && item.image) known.image = item.image;
  }

  return [...byUrl.values()].sort((a, b) => String(b.date).localeCompare(String(a.date)));
};
