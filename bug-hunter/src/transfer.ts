/* Moving a saved game to another place: on an iPhone the game added to the home screen keeps its own saved game,
   apart from Safari's (and every browser or phone has its own), so «Copy my game» puts the whole of it in one text
   code and «Paste a game» on the other side puts it back. The code holds every key the game keeps (`bugHunter…`:
   the runs, the Siege and the Villain), packed (deflate, where the browser has it) and in URL-safe base64. */

const PREFIX = 'bugHunter';
/** `BH1` packed, `BH0` plain (a browser without `CompressionStream`). */
const HEAD = { packed: 'BH1:', plain: 'BH0:' };

const toB64 = (bytes: Uint8Array) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = (s: string) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

function gameKeys(): string[] {
  const keys: string[] = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith(PREFIX)) keys.push(k); } } catch { /* no storage */ }
  return keys;
}

/** The whole saved game as one code. */
export async function exportGame(): Promise<string> {
  const data: Record<string, string> = {};
  for (const k of gameKeys()) { const v = localStorage.getItem(k); if (v != null) data[k] = v; }
  const bytes = new TextEncoder().encode(JSON.stringify({ v: 1, at: Date.now(), data }));
  if (typeof CompressionStream === 'function') {
    try { return HEAD.packed + toB64(await pipe(bytes, new CompressionStream('deflate-raw'))); } catch { /* plain below */ }
  }
  return HEAD.plain + toB64(bytes);
}

/** Reads a code: the keys it would put back, or null if it is not one of ours (or was cut short when copied). */
export async function readGame(raw: string): Promise<Record<string, string> | null> {
  const code = raw.replace(/\s+/g, '');
  const packed = code.startsWith(HEAD.packed);
  if (!packed && !code.startsWith(HEAD.plain)) return null;
  try {
    let bytes = fromB64(code.slice(HEAD.packed.length));
    if (packed) {
      if (typeof DecompressionStream !== 'function') return null;
      bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    }
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as { v?: number; data?: unknown };
    if (parsed.v !== 1 || !parsed.data || typeof parsed.data !== 'object') return null;
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed.data as Record<string, unknown>)) if (k.startsWith(PREFIX) && typeof v === 'string') data[k] = v;
    // The main save must be there and be a saved game.
    if (!data[PREFIX]) return null;
    JSON.parse(data[PREFIX]);
    return data;
  } catch {
    return null;
  }
}

/** Puts a read code's game in place of this one (every game key replaced); the page is reloaded after. */
export function restoreGame(data: Record<string, string>): boolean {
  try {
    for (const k of gameKeys()) localStorage.removeItem(k);
    for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
    return true;
  } catch {
    return false;
  }
}
