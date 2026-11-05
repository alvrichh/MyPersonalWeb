/* Siege Cartoon's duels: one player's hero army against the other's villain army, phone to phone. The link is the
   game's own (`net.ts`, PeerJS: one makes a room code, the other types it in). The one who made the room runs the
   battle and sends it, turned round to the other's side (`mirrorDuel`), ten times a second; the other plays on what it
   receives and sends back only the cards it plays and its generator. On localhost a `?duel=local` page talks to another
   tab of the same browser instead (a BroadcastChannel), so two tabs can play a duel for testing. */
import { hostGame, joinGame, leave, send, type NetMsg } from '../net';
import type { DuelArmy, Siege } from './cartoon/model';

export type DuelMsg =
  /** The room's maker, once joined: its version, its side and the field. */
  | { t: 'host'; v: string; villain: boolean; world: number; name: string }
  /** The one who joined: its version and its army (on the other side). */
  | { t: 'join'; v: string; army: DuelArmy; name: string }
  /** The battle starts (the maker's army, for the other to know what it faces). */
  | { t: 'go' }
  /** The battle as the joiner sees it. */
  | { t: 'snap'; s: Siege }
  /** The joiner plays a card or raises its generator. */
  | { t: 'cmd'; k: 'summon' | 'gen'; c?: number }
  /** A player leaves the duel. */
  | { t: 'bye' }
  /** The versions differ. */
  | { t: 'version'; v: string };

export type DuelHandlers = { code?: (code: string) => void; open: () => void; msg: (m: DuelMsg) => void; close: () => void; error: (why: string) => void };
export interface DuelLink { send(m: DuelMsg): void; close(): void }

const local = () => typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).get('duel') === 'local';

/** Makes a duel room (`join` false) or joins one by its code. */
export function openDuel(join: string | null, h: DuelHandlers): DuelLink {
  if (local()) return localLink(join, h);
  let closed = false;
  const handlers = {
    code: (c: string) => h.code?.(c), open: () => h.open(),
    msg: (m: NetMsg) => { if (m.t === 'sg') h.msg(m.d as DuelMsg); else if (m.t === 'bye') { if (!closed) { closed = true; h.close(); } } },
    close: () => { if (!closed) { closed = true; h.close(); } }, error: (why: string) => h.error(why),
  };
  if (join) joinGame(join, handlers); else hostGame(handlers);
  return { send: (m) => send({ t: 'sg', d: m }), close: () => { closed = true; leave(); } };
}

/** Two tabs of one browser on localhost, for tests. */
function localLink(join: string | null, h: DuelHandlers): DuelLink {
  const code = join ?? 'TEST', ch = new BroadcastChannel(`bh-duel-${code}`), me = Math.random().toString(36).slice(2);
  let open = false;
  ch.onmessage = (e) => {
    const m = e.data as { from: string; hi?: boolean; d?: DuelMsg };
    if (m.from === me) return;
    if (m.hi) { if (!open) { open = true; if (!join) ch.postMessage({ from: me, hi: true }); h.open(); } return; }
    if (m.d) { if (m.d.t === 'bye') h.close(); else h.msg(m.d); }
  };
  if (join) ch.postMessage({ from: me, hi: true }); else setTimeout(() => h.code?.(code), 50);
  return { send: (d) => ch.postMessage({ from: me, d: JSON.parse(JSON.stringify(d)) }), close: () => { try { ch.postMessage({ from: me, d: { t: 'bye' } }); } catch { /* closed */ } ch.close(); } };
}
