/* The Siege grew into its own game, Cartoon Siege, on its own site. The cover's Siege slot opens it in a new tab and
   hands over the Siege progress kept here (`bugHunter.siege.cartoon.*`) in the address's hash, which never reaches a
   server: the new site copies it into its own save only when it has none yet. */
export const CARTOON_SIEGE_URL = 'https://cartoon-siege.onrender.com/';
const PREFIX = 'bugHunter.siege.cartoon.';

function siegeSave(): Record<string, string> {
  const data: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      // A battle left half-way (`resume`) is not carried over: it belongs to this game's version.
      if (k?.startsWith(PREFIX) && !k.endsWith('.resume')) { const v = localStorage.getItem(k); if (v != null) data[k.slice(PREFIX.length)] = v; }
    }
  } catch { /* no storage */ }
  return data;
}

const toB64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/** The address that opens Cartoon Siege on its front page, in this language, carrying the Siege progress if there is any. */
export function cartoonSiegeLink(lang: string): string {
  const data = siegeSave();
  const hash = Object.keys(data).length ? `#save=${toB64(JSON.stringify({ v: 1, data }))}` : '';
  return `${CARTOON_SIEGE_URL}?lang=${lang === 'es' ? 'es' : 'en'}${hash}`;
}

export function openCartoonSiege(lang: string) {
  const url = cartoonSiegeLink(lang);
  // A blocked pop-up (or a home-screen app without tabs) goes there in this tab instead.
  // (`noopener` would make `window.open` answer null even when the tab opened, so the opener is cut by hand.)
  const tab = window.open(url, '_blank');
  if (tab) tab.opener = null;
  else location.href = url;
}
