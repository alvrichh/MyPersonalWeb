/* The link with a friend: two phones joined straight to each other by WebRTC (PeerJS), once, from the cover: one
   makes a code and the other types it in, and the link stays open while you play on (either can then invite the
   other to a board game). PeerJS's free public server only introduces the two; after that
   the messages go from phone to phone (on the same Wi-Fi they never leave the house). What is sent is tiny: who you
   are, the game's world, way and seed, and each round your army as it stands when you press «¡A luchar!». Both
   phones then play the same fight from the same seed (`startOnlineFight` in `board.ts`). */
import Peer, { type DataConnection } from 'peerjs';
import type { Piece, Variant } from './board';

/** Who you are: your name, your hero's set (for its poses) and its standing picture. */
export type NetProfile = { level: number; masteries: number; skin: string; equipped: string[]; upgrades: number; items: number };
export type NetHello = { t: 'hello'; name: string; key: string; still: string; profile?: NetProfile };
/** What we play together: the board in either way, a sprint run each side by side, or one On call shift. */
export type Together = 'board' | 'sprints' | 'horde';
/** An invitation: what to play, its way on the board, the world and the seed. */
export type NetInvite = { t: 'invite'; mode?: Together; variant: Variant; world: number; seed: number };
/** Where you are in a run, a few times a second: the mode and world, the sprint (room), your place on the field,
    which way you walk, your health and level, and how the run stands. */
export type NetState = { t: 'state'; mode: 'sprints' | 'horde'; world: number; room: number; x: number; y: number; vx: number; vy: number; hp: number; level: number; phase: string };
export type NetMsg = NetHello | NetInvite | { t: 'accept' } | { t: 'decline' } | { t: 'uninvite' }
  | { t: 'ready'; round: number; army: Piece[] } | NetState | { t: 'quit' } | { t: 'bye' };

export type NetHandlers = {
  /** The host's code, once PeerJS has it. */
  code?: (code: string) => void;
  /** The other phone is joined (again, after a drop). */
  open: () => void;
  msg: (m: NetMsg) => void;
  /** The link dropped without a goodbye: it is being tried again (`RETRY`). */
  drop?: () => void;
  /** The link is gone for good (the other left, or it could not be made again). */
  close: () => void;
  /** Making the link failed before it was ever joined (a wrong code, no internet). */
  error: (why: string) => void;
};

const PREFIX = 'bughunter-board-';
// No letters that read alike (O and 0, I and 1, …).
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = () => Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
export const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
/** A dropped link (a phone asleep for a moment, a blip in the Wi-Fi) is tried again: the host keeps its code open
    and the guest calls it again every few seconds, for about half a minute, before giving up. */
const RETRY = { every: 3000, times: 10 };

let peer: Peer | null = null;
let conn: DataConnection | null = null;
let quitting = false;
let joined = false;
let role: 'host' | 'guest' | null = null;
let code = '';
let handlers: NetHandlers | null = null;
let retries = 0;
let retryTimer = 0;

export const netOn = () => !!conn?.open;
const typeOf = (e: unknown) => (e as { type?: string }).type ?? 'error';

function wire(c: DataConnection, h: NetHandlers) {
  conn = c;
  let gone = false;
  c.on('open', () => { joined = true; retries = 0; h.open(); });
  c.on('data', (d) => h.msg(d as NetMsg));
  const lost = () => {
    if (gone || quitting) return;
    gone = true;
    if (conn === c) conn = null;
    // Never joined: the guest's call simply failed.
    if (!joined) { h.error('peer-unavailable'); return; }
    h.drop?.();
    if (role === 'guest') retry();
  };
  c.on('close', lost);
  c.on('error', lost);
}

/** The guest calls the host's code again, a few times, after a drop. */
function retry() {
  window.clearTimeout(retryTimer);
  if (quitting || conn || !handlers) return;
  if (retries >= RETRY.times) { handlers.close(); leave(); return; }
  retries += 1;
  retryTimer = window.setTimeout(() => {
    if (quitting || conn || !handlers) return;
    const h = handlers;
    const call = () => { if (peer && !quitting) { wire(peer.connect(PREFIX + code, { reliable: true }), h); window.setTimeout(() => { if (!conn?.open) { conn = null; retry(); } }, RETRY.every); } };
    if (peer && !peer.destroyed && peer.open) call();
    else { peer?.destroy(); peer = new Peer(); peer.on('open', call); peer.on('error', () => retry()); }
  }, RETRY.every);
}

function watchPeer(p: Peer, h: NetHandlers) {
  // The introduction server went away (the phone slept): the link itself may still stand; ask to come back.
  p.on('disconnected', () => { if (!quitting && !p.destroyed) { try { p.reconnect(); } catch { /* tried */ } } });
  p.on('error', (e) => {
    if (quitting) return;
    // The code was taken by someone else: try another (only while making the game).
    if (typeOf(e) === 'unavailable-id' && role === 'host' && !joined) { hostGame(h); return; }
    // Before the first join an error means it could not be made; afterwards it is only a drop to ride out.
    if (!joined) h.error(typeOf(e));
    else if (role === 'guest' && !conn?.open) { conn = null; retry(); }
  });
}

/** Makes a game and waits for the other phone: the code comes through `h.code`. */
export function hostGame(h: NetHandlers) {
  leave();
  quitting = false;
  joined = false;
  role = 'host';
  handlers = h;
  code = makeCode();
  peer = new Peer(PREFIX + code);
  peer.on('open', () => { if (!joined) h.code?.(code); });
  peer.on('connection', (c) => {
    // One rival only: a third phone is turned away (the same friend calling again after a drop is let in).
    if (conn?.open) { c.on('open', () => c.close()); return; }
    wire(c, h);
  });
  watchPeer(peer, h);
}

/** Joins the game with that code. */
export function joinGame(to: string, h: NetHandlers) {
  leave();
  quitting = false;
  joined = false;
  role = 'guest';
  handlers = h;
  code = to;
  retries = 0;
  peer = new Peer();
  peer.on('open', () => { if (peer) wire(peer.connect(PREFIX + code, { reliable: true }), h); });
  watchPeer(peer, h);
}

export function send(m: NetMsg) {
  if (conn?.open) { try { conn.send(m); } catch { /* dropped: the retry will bring it back */ } }
}

/** Leaves the game (telling the other first) and frees the code. */
export function leave() {
  quitting = true;
  window.clearTimeout(retryTimer);
  if (conn?.open) { try { conn.send({ t: 'bye' } satisfies NetMsg); } catch { /* gone already */ } }
  conn?.close();
  peer?.destroy();
  conn = null;
  peer = null;
  role = null;
  handlers = null;
  joined = false;
}

// On localhost only, a way for a test script to cut the link as a drop would (no goodbye).
if (typeof location !== 'undefined' && location.hostname === 'localhost') (window as unknown as { bugHunterNet: object }).bugHunterNet = { cut: () => conn?.close() };
