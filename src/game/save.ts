import { storage } from '../lib/storage';
import { ITEMS, type ItemId, type Slot, type Upgrades } from './shop';
import type { Mode } from './world';

/* Everything Bug Hunter remembers between runs, in one localStorage key. */

export type EnemyStyle = 'world' | 'original' | 'demon' | 'viking' | 'jungle' | 'greek' | 'robot' | 'nightmare' | 'random';
export const STYLES: EnemyStyle[] = ['world', 'original', 'demon', 'viking', 'jungle', 'greek', 'robot', 'nightmare', 'random'];

export type HeroSkin = 'boy' | 'robot' | 'kitty';
export const SKINS: HeroSkin[] = ['boy', 'robot', 'kitty'];
/** What each figure costs in coins; Alvrich comes free. The owner's rule: skins are always the dearest thing in the game (items, forge levels, the revive), so raise these if anything else goes past them. */
export const SKIN_PRICE: Record<HeroSkin, number> = { boy: 0, robot: 10000, kitty: 10000 };
/** The hats are painted on the hero's pictures; a skin listed here has no hat versions and always shows its base set. */
const HATLESS: HeroSkin[] = ['kitty'];
const HAT_SET: Record<string, string> = { wizardHat: 'wizard', gladHelm: 'helm', bandana: 'bandana' };
/** The picture set for a skin with a head item: `hero/<key>-<pose>.webp`. */
export const heroKey = (skin: HeroSkin, head?: string) =>
  `${skin}-${(!HATLESS.includes(skin) && head && HAT_SET[head]) || 'base'}`;

export type Save = {
  /** The player's name, shown on the cover and the profile (the hero is alvrich by default). */
  name: string;
  coins: number;
  /** Which figure the hero is drawn as. */
  skin: HeroSkin;
  /** The figures bought (Alvrich is always there). */
  skins: HeroSkin[];
  /** Retro look: no painted textures, the plain panels and the ring hero from before. */
  retro: boolean;
  owned: ItemId[];
  equipped: Partial<Record<Slot, ItemId>>;
  /** The forge: permanent upgrade levels. */
  upgrades: Upgrades;
  style: EnemyStyle;
  /** Saves from before worlds had their own cast default to 'world' once. */
  styleV2: boolean;
  music: number;
  sfx: number;
  best: { room: number; time?: number };
  /** Best run per world (world 1 is also `best`, kept for older saves). */
  bestByWorld: Record<number, { room: number; time?: number }>;
  /** Worlds you may enter: 1 to `unlocked`. */
  unlocked: number;
  /** The world picked on the map. */
  world: number;
  /** Sprints (rooms) or on call (the ten-minute horde). */
  mode: Mode;
  /** On call keeps its own world progress: worlds you may enter there, and the one picked. */
  hordeUnlocked: number;
  hordeWorld: number;
  /** Masteries earned per mode (clear all eight worlds, then reset for a small permanent boost). */
  mastery: { sprints: number; horde: number };
  /** The colour of the mastery stars by the player's name. */
  starColor: StarColor;
  /** Best on-call shift per world: how long you held out, bugs squashed, whether the last boss fell. */
  hordeBest: Record<number, { time: number; kills: number; won: boolean }>;
  runs: number;
  /** All the XP ever picked up: the profile level on the title screen. */
  xp: number;
};

const KEY = 'bugHunter';

export const STAR_COLORS = { gold: '#fcd34d', cyan: '#67e8f9', pink: '#f472b6', green: '#4ade80', purple: '#c084fc', red: '#f87171', white: '#f8fafc' } as const;
export type StarColor = keyof typeof STAR_COLORS;
export const DEFAULT_NAME = 'alvrich';
export const NAME_MAX = 14;
/** A name as typed, made safe to keep: trimmed, single spaces, no control characters, at most NAME_MAX long. */
export const cleanName = (raw: string) => raw.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);

const fresh = (): Save => ({
  name: DEFAULT_NAME,
  coins: 0,
  skin: 'boy',
  skins: ['boy'],
  retro: false,
  owned: [],
  equipped: {},
  upgrades: {},
  style: 'world',
  styleV2: true,
  music: 0.6,
  sfx: 0.8,
  best: { room: 0 },
  bestByWorld: {},
  unlocked: 1,
  world: 1,
  mode: 'sprints',
  hordeUnlocked: 1,
  hordeWorld: 1,
  mastery: { sprints: 0, horde: 0 },
  starColor: 'gold',
  hordeBest: {},
  runs: 0,
  xp: 0,
});

export function loadSave(): Save {
  const base = fresh();
  try {
    const data = JSON.parse(storage.get(KEY) || '{}') as Partial<Save>;
    const save: Save = { ...base, ...data, equipped: {}, upgrades: { ...data.upgrades }, best: { ...base.best, ...data.best }, bestByWorld: { ...data.bestByWorld }, hordeBest: { ...data.hordeBest } };
    if (save.mode !== 'sprints' && save.mode !== 'horde') save.mode = 'sprints';
    // Saves from before the split: on call opens the worlds after any shift it already cleared.
    if (!data.hordeUnlocked) {
      const cleared = Object.entries(save.hordeBest).filter(([, b]) => b.won).map(([w]) => Number(w));
      save.hordeUnlocked = Math.max(1, ...cleared.map((w) => w + 1));
    }
    save.hordeUnlocked = Math.min(Math.max(1, save.hordeUnlocked || 1), 8);
    save.hordeWorld = Math.min(Math.max(1, save.hordeWorld || 1), save.hordeUnlocked);
    save.mastery = { sprints: Math.max(0, data.mastery?.sprints ?? 0), horde: Math.max(0, data.mastery?.horde ?? 0) };
    if (!(save.starColor in STAR_COLORS)) save.starColor = 'gold';
    save.name = cleanName(typeof save.name === 'string' ? save.name : '') || DEFAULT_NAME;
    // Items are re-seated by their current slot (older saves had `charm` and `relic`).
    save.owned = (data.owned ?? []).filter((id) => ITEMS.some((item) => item.id === id));
    for (const id of Object.values(data.equipped ?? {})) {
      const item = ITEMS.find((it) => it.id === id);
      if (item && save.owned.includes(item.id)) save.equipped[item.slot] = item.id;
    }
    if (!STYLES.includes(save.style)) save.style = 'world';
    if (!SKINS.includes(save.skin)) save.skin = 'boy';
    // Skins cost coins now: the free one, plus whichever an older save already wore.
    save.skins = [...new Set<HeroSkin>(['boy', save.skin, ...(data.skins ?? [])])].filter((s) => SKINS.includes(s));
    if (!data.styleV2) { save.style = 'world'; save.styleV2 = true; }
    save.unlocked = Math.max(1, save.unlocked || 1);
    save.world = Math.min(Math.max(1, save.world || 1), save.unlocked);
    // The old best-run key from the first version, if any.
    if (!save.best.room) {
      try {
        const old = JSON.parse(storage.get('bugHunterBest') || '') as Save['best'];
        if (old && old.room) save.best = old;
      } catch {
        /* nothing saved */
      }
    }
    if (!save.bestByWorld[1] && save.best.room) save.bestByWorld[1] = save.best;
    // A finished world 1 from before the map unlocks world 2.
    if (save.best.time !== undefined && save.unlocked < 2) save.unlocked = 2;
    return save;
  } catch {
    return base;
  }
}

/** Profile level from lifetime XP: 200 for the first, a little more each time. */
export function profileLevel(xp: number) {
  let level = 1;
  let need = 200;
  let left = xp;
  while (left >= need) {
    left -= need;
    level += 1;
    need = Math.round(need * 1.15);
  }
  return { level, progress: left / need };
}

/** Back to a fresh start: progress, coins, gear and level go; name, skins bought, settings, masteries and star colour stay. */
export function wipeProgress(save: Save) {
  const keep = { name: save.name, skin: save.skin, skins: [...save.skins], retro: save.retro, style: save.style, music: save.music, sfx: save.sfx, mode: save.mode, mastery: { ...save.mastery }, starColor: save.starColor };
  Object.assign(save, fresh(), keep);
}

export function writeSave(save: Save) {
  storage.set(KEY, JSON.stringify(save));
}
