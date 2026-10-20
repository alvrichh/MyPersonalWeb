/* The link with a friend: two phones joined straight to each other by WebRTC (PeerJS), once, from the cover: one
   makes a code and the other types it in, and the link stays open while you play on (either can then invite the
   other to a board game). PeerJS's free public server only introduces the two; after that
   the messages go from phone to phone (on the same Wi-Fi they never leave the house). What is sent is tiny: who you
   are, the game's world, way and seed, and each round your army as it stands when you press «¡A luchar!». Both
   phones then play the same fight from the same seed (`startOnlineFight` in `board.ts`). */
import Peer, { type DataConnection } from 'peerjs';
import type { Piece, Variant } from './board';

/** Who you are: your name, your hero's set (for its poses) and its standing picture. */
export type NetHello = { t: 'hello'; name: string; key: string; still: string };
/** An invitation to a board game: its way, world and seed. */
export type NetInvite = { t: 'invite'; variant: Variant; world: number; seed: number };
export type NetMsg = NetHello | NetInvite | { t: 'accept' } | { t: 'decline' } | { t: 'uninvite' }
  | { t: 'ready'; round: number; army: Piece[] } | { t: 'quit' } | { t: 'bye' };

export type NetHandlers = {
  /** The host's code, once PeerJS has it. */
  code?: (code: string) => void;
  /** The other phone is joined. */
  open: () => void;
  msg: (m: NetMsg) => void;
  /** The link is gone (the other left, or the connection dropped). */
  close: () => void;
  error: (why: string) => void;
};

const PREFIX = 'bughunter-board-';
// No letters that read alike (O and 0, I and 1, …).
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = () => Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
export const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);

let peer: Peer | null = null;
let conn: DataConnection | null = null;
let quitting = false;

export const netOn = () => !!conn?.open;

function wire(c: DataConnection, h: NetHandlers) {
  conn = c;
  c.on('open', () => h.open());
  c.on('data', (d) => h.msg(d as NetMsg));
  c.on('close', () => { if (!quitting) h.close(); });
  c.on('error', () => { if (!quitting) h.close(); });
}

/** Makes a game and waits for the other phone: the code comes through `h.code`. */
export function hostGame(h: NetHandlers, tries = 0) {
  leave();
  quitting = false;
  const code = makeCode();
  peer = new Peer(PREFIX + code);
  peer.on('open', () => h.code?.(code));
  peer.on('connection', (c) => {
    // One rival only: a third phone is turned away.
    if (conn) { c.on('open', () => c.close()); return; }
    wire(c, h);
  });
  peer.on('error', (e) => {
    // The code was taken by someone else: try another.
    if ((e as { type?: string }).type === 'unavailable-id' && tries < 3) { hostGame(h, tries + 1); return; }
    if (!quitting) h.error((e as { type?: string }).type ?? 'error');
  });
}

/** Joins the game with that code. */
export function joinGame(code: string, h: NetHandlers) {
  leave();
  quitting = false;
  peer = new Peer();
  peer.on('open', () => { if (peer) wire(peer.connect(PREFIX + code, { reliable: true }), h); });
  peer.on('error', (e) => { if (!quitting) h.error((e as { type?: string }).type ?? 'error'); });
}

export function send(m: NetMsg) {
  if (conn?.open) conn.send(m);
}

/** Leaves the game (telling the other first) and frees the code. */
export function leave() {
  quitting = true;
  if (conn?.open) { try { conn.send({ t: 'bye' } satisfies NetMsg); } catch { /* gone already */ } }
  conn?.close();
  peer?.destroy();
  conn = null;
  peer = null;
}
