/* The link with a friend: two phones joined straight to each other by WebRTC (PeerJS), once, from the cover: one
   makes a code and the other types it in, and the link stays open while you play on (either can then invite the
   other to a board game). PeerJS's free public server only introduces the two; after that
   the messages go from phone to phone (on the same Wi-Fi they never leave the house). What is sent is tiny: who you
   are, the game's world, way and seed, and each round your army as it stands when you press «¡A luchar!». Both
   phones then play the same fight from the same seed (`startOnlineFight` in `board.ts`). */
import Peer, { type DataConnection } from 'peerjs';
import type { Piece, Variant } from './board';
import type { CoopSnap } from './world';

/** Who you are: your name, your hero's set (for its poses) and its standing picture. */
export type NetProfile = { level: number; masteries: number; skin: string; equipped: string[]; upgrades: number; items: number };
export type NetHello = { t: 'hello'; name: string; key: string; still: string; id?: string; profile?: NetProfile };
/** What we play together: the board in either way, a sprint run each side by side, or one On call shift. */
export type Together = 'board' | 'sprints' | 'horde';
/** An invitation: what to play, its way on the board, the world and the seed. */
export type NetInvite = { t: 'invite'; mode?: Together; variant: Variant; world: number; seed: number };
/** Where you are in a run, a few times a second: the mode and world, the sprint (room), your place on the field,
    which way you walk, your health and level, and how the run stands. */
export type NetState = { t: 'state'; mode: 'sprints' | 'horde'; world: number; room: number; x: number; y: number; vx: number; vy: number; hp: number; level: number; phase: string; w?: NetWeapons };
/** On call together: what the friend's weapons are doing, so their phone draws them beside you. Shots as
    [kind, x, y, vx, vy, size, element, flags (1 bow, 2 ghost), spin]; effects as [kind, x, y, r, a, life, max, blue,
    spin, w, pic, top, big, foot]; lightning as [points (x, y, x, y, …), life, blue]; the saws' angle; and now and then
    the looks (`look`: skill levels, evolved skills, the fusion, the arrow and blade picks, the spirit). */
export type NetWeapons = { sh: (string | number)[][]; fx: (string | number)[][]; zp: (number | number[])[][]; ba: number; look?: { sk: Record<string, number>; ev: string[]; fu: boolean; ap: string | null; bp: string | null; sp: string } };
export type NetMsg = NetHello | NetInvite | { t: 'accept' } | { t: 'decline' } | { t: 'uninvite' }
  | { t: 'ready'; round: number; army: Piece[] } | NetState | { t: 'quit' } | { t: 'bye' }
  | ({ t: 'snap' } & CoopSnap) | { t: 'hits'; h: [number, number][] }
  /** A Siege duel's own messages (`siege/duel.ts`), carried as they are. */
  | { t: 'sg'; d: unknown };

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

/** How the two phones find a way to each other. STUN finds each phone's public address (enough on most home Wi-Fi);
    when both sit behind a carrier's NAT (mobile data) only a TURN relay gets through. PeerJS's own free relay is
    kept, but it is often full or down, so a relay of our own can be set at build time (`VITE_TURN_URL`,
    `VITE_TURN_USER`, `VITE_TURN_PASS`; several urls split by commas). */
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const ICE: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
  ...(env.VITE_TURN_URL ? [{ urls: env.VITE_TURN_URL.split(',').map((u) => u.trim()).filter(Boolean), username: env.VITE_TURN_USER, credential: env.VITE_TURN_PASS }] : []),
  { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
];
const makePeer = (id?: string) => (id ? new Peer(id, { config: { iceServers: ICE } }) : new Peer({ config: { iceServers: ICE } }));
/** The introduction server said nobody holds the id called: a wrong code. Without that, the game is there and only
    the phones could not reach each other (`no-route`). */
let noSuchPeer = false;

const PREFIX = 'bughunter-board-';
/** Where a player waits for friends while the game is open: their own id, the same every time. */
const PERSONAL = 'bughunter-p-';
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
/** The peer id the guest calls (a game's code, or a friend's own id). */
let target = '';
/** Waiting under your own id (`presence`), so a saved friend can call you. */
let present = false;
/** Your own id while waiting under it, to ask for it again when the server still holds it. */
let presentId = '';
let presentTimer = 0;
let handlers: NetHandlers | null = null;
let retries = 0;
/** Joining by code: the host's page may be asleep for a moment (an iPhone hides it while the code is passed on in
    another app), so the guest calls again for a while before saying there is no such game. */
const JOIN = { every: 2500, times: 6 };
let joinTries = 0;
let joinTimer = 0;
function joinAgain(h: NetHandlers): boolean {
  if (quitting || joined || present || role !== 'guest' || joinTries >= JOIN.times || !peer) return false;
  joinTries += 1;
  window.clearTimeout(joinTimer);
  joinTimer = window.setTimeout(() => {
    if (quitting || joined || !peer || peer.destroyed) return;
    const c = peer.connect(target, { reliable: true });
    wire(c, h);
    // PeerJS may not say again that nobody is there: give each try its own deadline.
    joinTimer = window.setTimeout(() => {
      if (joined || quitting || conn !== c) return;
      conn = null;
      try { c.close(); } catch { /* never opened */ }
      if (!joinAgain(h)) h.error(noSuchPeer ? 'peer-unavailable' : 'no-route');
    }, JOIN.every);
  }, JOIN.every);
  return true;
}
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
    if (!joined) { if (present) role = 'host'; if (joinAgain(h)) return; h.error(noSuchPeer || present ? 'peer-unavailable' : 'no-route'); return; }
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
    const call = () => { if (peer && !quitting) { wire(peer.connect(target, { reliable: true }), h); window.setTimeout(() => { if (!conn?.open) { conn = null; retry(); } }, RETRY.every); } };
    if (peer && !peer.destroyed && peer.open) call();
    else { peer?.destroy(); peer = makePeer(); peer.on('open', call); peer.on('error', () => retry()); }
  }, RETRY.every);
}

function watchPeer(p: Peer, h: NetHandlers) {
  // The introduction server went away (the phone slept): the link itself may still stand; ask to come back.
  p.on('disconnected', () => { if (!quitting && !p.destroyed) { try { p.reconnect(); } catch { /* tried */ } } });
  p.on('error', (e) => {
    if (quitting) return;
    if (typeOf(e) === 'peer-unavailable') noSuchPeer = true;
    // The code was taken by someone else: try another (only while making the game).
    if (typeOf(e) === 'unavailable-id' && role === 'host' && !joined) { hostGame(h); return; }
    // Before the first join an error means it could not be made; afterwards it is only a drop to ride out.
    // Your own id still held by the server (it was given up a moment ago, after a disconnect or removing a friend):
    // ask for it again in a while, or nobody could ever call you until the page is reloaded.
    if (present && !joined && typeOf(e) === 'unavailable-id' && role === 'host') {
      window.clearTimeout(presentTimer);
      const id = presentId;
      presentTimer = window.setTimeout(() => { if (present && !joined && !conn?.open && presentId === id) presence(id, h); }, 3000);
      return;
    }
    // Waiting under your own id: a friend not there, or the id open in another tab, is nothing to show.
    if (present && !joined) { if (role === 'guest' && typeOf(e) === 'peer-unavailable') h.error('peer-unavailable'); return; }
    if (!joined && typeOf(e) === 'peer-unavailable' && joinAgain(h)) return;
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
  present = false;
  peer = makePeer(PREFIX + code);
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
  joinTries = 0;
  target = PREFIX + to;
  noSuchPeer = false;
  present = false;
  retries = 0;
  peer = makePeer();
  peer.on('open', () => { if (peer) wire(peer.connect(target, { reliable: true }), h); });
  watchPeer(peer, h);
}

/** Waits under your own id while the game is open, so a saved friend who opens it can call you: the first to call
    is linked, as if they had typed a code. */
export function presence(me: string, h: NetHandlers) {
  leave();
  quitting = false;
  joined = false;
  present = true;
  presentId = me;
  role = 'host';
  handlers = h;
  peer = makePeer(PERSONAL + me);
  peer.on('connection', (c) => {
    if (conn?.open) { c.on('open', () => c.close()); return; }
    role = 'host';
    wire(c, h);
  });
  watchPeer(peer, h);
}
export const presenceOn = () => present && !!peer && !peer.destroyed;
export const presenceReady = () => present && !!peer?.open;

/** Calls a saved friend from your own id; `h.error` comes if they are not there within a few seconds. */
export function dial(friendId: string, h: NetHandlers) {
  if (!peer || !present || conn?.open) { h.error('busy'); return; }
  role = 'guest';
  joined = false;
  handlers = h;
  target = PERSONAL + friendId;
  retries = 0;
  const c = peer.connect(target, { reliable: true });
  wire(c, h);
  window.setTimeout(() => {
    if (joined || conn !== c) return;
    conn = null;
    try { c.close(); } catch { /* never opened */ }
    role = 'host';
    h.error('peer-unavailable');
  }, 5000);
}

export function send(m: NetMsg) {
  if (conn?.open) { try { conn.send(m); } catch { /* dropped: the retry will bring it back */ } }
}

/** Leaves the game (telling the other first) and frees the code. */
export function leave() {
  quitting = true;
  window.clearTimeout(retryTimer);
  window.clearTimeout(joinTimer);
  window.clearTimeout(presentTimer);
  if (conn?.open) { try { conn.send({ t: 'bye' } satisfies NetMsg); } catch { /* gone already */ } }
  conn?.close();
  peer?.destroy();
  conn = null;
  peer = null;
  role = null;
  present = false;
  handlers = null;
  joined = false;
}

// Back on the page (the phone woke, or the player came back from another app): the introduction server dropped us
// while the page slept, so ask to be known again at once, the code or your own id open for the other to call.
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && peer && !peer.destroyed && peer.disconnected && !quitting) { try { peer.reconnect(); } catch { /* tried */ } }
});

// On localhost only, a way for a test script to cut the link as a drop would (no goodbye).
if (typeof location !== 'undefined' && location.hostname === 'localhost') (window as unknown as { bugHunterNet: object }).bugHunterNet = { cut: () => conn?.close() };
