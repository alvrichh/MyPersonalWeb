import { useEffect, useState } from 'react';

// The AI radar data the daily bot writes to /data. Fetched in the browser,
// never at build time, so the page always shows the latest run.

export type RadarItem = {
  title: string;
  source: string;
  date: string;
  url: string;
  summary?: string;
  image?: string;
  tags?: string[];
};

export type RadarData = {
  date: string | null;
  insight: string;
  items: RadarItem[];
};

export type ArchiveItem = RadarItem & { displayTitle: string; searchText: string };

export const isSafeUrl = (value?: string) => {
  try {
    return Boolean(value) && ['https:', 'http:'].includes(new URL(value as string).protocol);
  } catch {
    return false;
  }
};

/** Feed text sometimes arrives with HTML entities (&#8217;); decode them as inert text. */
export const decodeEntities = (value: string) =>
  new DOMParser().parseFromString(String(value), 'text/html').documentElement.textContent ?? '';

/** WordPress feeds append "The post <title> appeared first on <site>"; drop it. */
export const cleanSummary = (value = '') => decodeEntities(value).replace(/\s+The post\s[\s\S]*$/, '').trim();

// WordPress image CDNs (The Verge, GitHub blog…) resize on request with ?w=.
// Without it a 64px thumbnail would download the full original.
const RESIZABLE_IMAGE_HOSTS = ['platform.theverge.com', 'github.blog', 'blogs.microsoft.com'];
export const sizedImage = (url: string, width: number) => {
  try {
    const parsed = new URL(url);
    const resizable = RESIZABLE_IMAGE_HOSTS.includes(parsed.hostname) || parsed.hostname.endsWith('.wp.com');
    if (!resizable) return url;
    parsed.searchParams.set('w', String(width));
    return parsed.href;
  } catch {
    return url;
  }
};

const getJson = async (path: string) => {
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
};

/** Today's radar: undefined while loading, null if it failed. */
export function useRadar() {
  const [data, setData] = useState<RadarData | null | undefined>(undefined);

  useEffect(() => {
    getJson('./data/ai-radar.json')
      .then((json) => setData({
        date: json.date ?? null,
        insight: json.insight ? decodeEntities(json.insight) : '',
        items: (Array.isArray(json.items) ? json.items : []).filter((item: RadarItem) => item?.title && isSafeUrl(item.url)),
      }))
      .catch(() => setData(null));
  }, []);

  return data;
}

/** Every story since the radar started; empty until it loads. */
export function useRadarArchive() {
  const [items, setItems] = useState<ArchiveItem[]>([]);

  useEffect(() => {
    getJson('./data/ai-radar-archive.json')
      .then((json) => setItems((Array.isArray(json.items) ? json.items : [])
        .filter((item: RadarItem) => item?.title && isSafeUrl(item.url))
        .map((item: RadarItem) => {
          const displayTitle = decodeEntities(item.title);
          return { ...item, displayTitle, searchText: `${displayTitle} ${item.source}`.toLowerCase() };
        })))
      .catch(() => setItems([]));
  }, []);

  return items;
}
