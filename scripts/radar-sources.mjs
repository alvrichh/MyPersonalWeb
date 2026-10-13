// Where the AI radar reads from, and how. Shared by the daily bot and the
// archive backfill so both see stories the same way.

import { isRelevantStory } from './radar-tags.mjs';

const USER_AGENT = 'alvrich-maintenance-bot/1.0 (+https://alvrich.vercel.app)';

// aiNative: the whole source is about AI, so a story only has to touch the
// owner's skill set. Other sources must also be explicitly about AI.
export const SOURCES = [
  { name: 'OpenAI News', url: 'https://openai.com/news/rss.xml', homepage: 'https://openai.com/news/', aiNative: true },
  { name: 'Anthropic News', url: 'https://www.anthropic.com/news', homepage: 'https://www.anthropic.com/news', aiNative: true, type: 'anthropic' },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', homepage: 'https://blog.google/technology/ai/', aiNative: true },
  { name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml', homepage: 'https://deepmind.google/discover/blog/', aiNative: true },
  { name: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml', homepage: 'https://huggingface.co/blog', aiNative: true },
  { name: 'Simon Willison', url: 'https://simonwillison.net/atom/everything/', homepage: 'https://simonwillison.net/', aiNative: true },
  { name: 'GitHub AI & ML Blog', url: 'https://github.blog/ai-and-ml/feed/', homepage: 'https://github.blog/ai-and-ml/', aiNative: true },
  { name: 'GitHub Changelog', url: 'https://github.blog/changelog/feed/', homepage: 'https://github.blog/changelog/' },
  { name: 'Azure Blog', url: 'https://azure.microsoft.com/en-us/blog/feed/', homepage: 'https://azure.microsoft.com/en-us/blog/' },
  { name: 'AWS Machine Learning', url: 'https://aws.amazon.com/blogs/machine-learning/feed/', homepage: 'https://aws.amazon.com/blogs/machine-learning/' },
  { name: 'NVIDIA Developer', url: 'https://developer.nvidia.com/blog/feed', homepage: 'https://developer.nvidia.com/blog/' },
  { name: 'Ars Technica AI', url: 'https://arstechnica.com/ai/feed/', homepage: 'https://arstechnica.com/ai/' },
  { name: 'MIT Technology Review AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', homepage: 'https://www.technologyreview.com/topic/artificial-intelligence/' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', homepage: 'https://www.theverge.com/ai-artificial-intelligence' },
];

export const sourceByName = new Map(SOURCES.map((source) => [source.name, source]));

export const isRelevantForSource = (item) => isRelevantStory(item, { aiNative: Boolean(sourceByName.get(item.source)?.aiNative) });

// ------------------------------------------------------------------ Parsing

export const decodeEntities = (value = '') => String(value)
  .replaceAll('<![CDATA[', '')
  .replaceAll(']]>', '')
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replaceAll('&apos;', "'")
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&nbsp;', ' ');

const strip = (value = '') => decodeEntities(String(value)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const getTag = (item, tag) => {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? strip(match[1]) : '';
};

// A bare day like "Oct 6, 2026" is read as UTC so it doesn't shift a day back.
const toDay = (value, fallback) => {
  const text = String(value).trim();
  const date = new Date(/\d:\d/.test(text) ? text : `${text} UTC`);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString().slice(0, 10);
};

// Images: only absolute http(s) URLs, with feed entities (&#038;, &amp;) undone.
export const cleanImageUrl = (value = '', base = undefined) => {
  try {
    const parsed = new URL(decodeEntities(value).replaceAll('&#038;', '&').trim(), base);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
};

// Feeds put the picture in different places: media tags, enclosures, or the
// first <img> of the (often entity-encoded) article body.
const getImage = (raw) => {
  const media = raw.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i)?.[1];
  if (media) return cleanImageUrl(media);

  const enclosure = raw.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image\//i)?.[1]
    || raw.match(/<enclosure[^>]+type=["']image\/[^"']*["'][^>]*url=["']([^"']+)["']/i)?.[1];
  if (enclosure) return cleanImageUrl(enclosure);

  const html = raw.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"');
  const img = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  return img ? cleanImageUrl(img) : '';
};

export const parseFeed = (xml, source, today) => {
  const rssItems = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  const atomItems = [...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi)].map((match) => match[0]);
  const items = rssItems.length ? rssItems : atomItems;

  return items.map((raw) => {
    const title = getTag(raw, 'title');
    const description = getTag(raw, 'description') || getTag(raw, 'summary') || getTag(raw, 'content');
    const pubDate = getTag(raw, 'pubDate') || getTag(raw, 'published') || getTag(raw, 'updated') || getTag(raw, 'dc:date');
    const guid = getTag(raw, 'guid');
    const rssLink = getTag(raw, 'link');
    const atomLink = raw.match(/<link[^>]+rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)?.[1]
      || raw.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || '';
    const link = rssLink || atomLink || guid || source.homepage;

    return {
      source: source.name,
      title,
      description,
      date: pubDate ? toDay(pubDate, today) : today,
      url: link,
      link,
      image: getImage(raw),
    };
  }).filter((item) => item.title);
};

// Anthropic has no feed: read the cards on anthropic.com/news. Each link holds
// the date, a category, the title and sometimes a one-line summary.
const ANTHROPIC_CATEGORIES = new Set([
  'Announcements', 'Product', 'Policy', 'Research', 'Societal Impacts', 'Economic Research',
  'Interpretability', 'Alignment', 'Case Study', 'Customer Stories', 'Event', 'Education',
]);
const DATE_TEXT = /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}, \d{4}$/;

export const parseAnthropicNews = (html, source, today) => {
  const seen = new Set();
  const items = [];

  for (const [, href, inner] of html.matchAll(/<a[^>]+href="(\/news\/[a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    if (seen.has(href)) continue;
    const parts = decodeEntities(inner.replace(/<[^>]+>/g, '\n'))
      .split('\n').map((part) => part.trim()).filter(Boolean);
    const dateText = parts.find((part) => DATE_TEXT.test(part));
    const text = parts.filter((part) => part !== dateText && !ANTHROPIC_CATEGORIES.has(part));
    if (!text.length) continue;
    seen.add(href);
    items.push({
      source: source.name,
      title: text[0],
      description: text[1] || '',
      date: dateText ? toDay(dateText, today) : today,
      url: `https://www.anthropic.com${href}`,
      link: `https://www.anthropic.com${href}`,
      image: '',
    });
  }

  return items;
};

// ------------------------------------------------------------------ Fetching

const fetchText = async (url, accept, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow', headers: { 'user-agent': USER_AGENT, accept } });
    return { ok: response.ok, status: response.status, url: response.url, text: response.ok ? await response.text() : '' };
  } catch (error) {
    return { ok: false, status: error.name === 'AbortError' ? 'Timeout' : error.message, text: '' };
  } finally {
    clearTimeout(timeout);
  }
};

// Every story a source currently lists (no relevance filter).
export const readSource = async (source, today) => {
  const accept = source.type === 'anthropic' ? 'text/html' : 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*';
  const response = await fetchText(source.url, accept);
  if (!response.ok) return { source, ok: false, error: `HTTP ${response.status}`, items: [] };
  const items = source.type === 'anthropic'
    ? parseAnthropicNews(response.text, source, today)
    : parseFeed(response.text, source, today);
  return { source, ok: true, items };
};

// Relevant stories, a few per source, for the daily run.
export const fetchSource = async (source, today, perSource = 8) => {
  const result = await readSource(source, today);
  return { ...result, items: result.items.filter(isRelevantForSource).slice(0, perSource) };
};

// og:image and og:description from an article page, for stories whose feed
// had no picture or summary.
const metaContent = (html, names) => {
  for (const name of names) {
    const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`, 'i'))?.[0];
    const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
    if (content) return content;
  }
  return '';
};

export const fetchPageMeta = async (url) => {
  const response = await fetchText(url, 'text/html', 10000);
  if (!response.ok) return { status: response.status };
  const html = response.text.slice(0, 250000);
  return {
    status: response.status,
    image: cleanImageUrl(metaContent(html, ['og:image', 'twitter:image', 'twitter:image:src']), response.url),
    summary: strip(metaContent(html, ['og:description', 'description', 'twitter:description'])).slice(0, 280),
    published: metaContent(html, ['article:published_time', 'og:published_time', 'date', 'publish-date']),
    title: strip(metaContent(html, ['og:title', 'twitter:title'])),
  };
};

// Fill in pictures and summaries, a few requests at a time.
export const addMissingMeta = async (items, concurrency = 4) => {
  const missing = items.filter((item) => item.url && (!item.image || !item.summary));
  for (let index = 0; index < missing.length; index += concurrency) {
    await Promise.all(missing.slice(index, index + concurrency).map(async (item) => {
      const meta = await fetchPageMeta(item.url);
      if (!item.image && meta.image) item.image = meta.image;
      if (!item.summary && meta.summary) item.summary = meta.summary;
    }));
  }
  return items;
};
