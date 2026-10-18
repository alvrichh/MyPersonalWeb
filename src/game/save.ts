import { storage } from '../lib/storage';
import type { ItemId, Slot } from './shop';

/* Everything Bug Hunter remembers between runs, in one localStorage key. */

export type EnemyStyle = 'world' | 'original' | 'demon' | 'viking' | 'jungle' | 'greek' | 'robot' | 'nightmare' | 'random';
export const STYLES: EnemyStyle[] = ['world', 'original', 'demon', 'viking', 'jungle', 'greek', 'robot', 'nightmare', 'random'];

export type HeroSkin = 'boy' | 'robot';
export const SKINS: HeroSkin[] = ['boy', 'robot'];

export type Save = {
  coins: number;
  /** Which figure the hero is drawn as. */
  skin: HeroSkin;
  owned: ItemId[];
  equipped: Partial<Record<Slot, ItemId>>;
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
  runs: number;
  /** All the XP ever picked up: the profile level on the title screen. */
  xp: number;
};

const KEY = 'bugHunter';

const fresh = (): Save => ({
  coins: 0,
  skin: 'boy',
  owned: [],
  equipped: {},
  style: 'world',
  styleV2: true,
  music: 0.6,
  sfx: 0.8,
  best: { room: 0 },
  bestByWorld: {},
  unlocked: 1,
  world: 1,
  runs: 0,
  xp: 0,
});

export function loadSave(): Save {
  const base = fresh();
  try {
    const data = JSON.parse(storage.get(KEY) || '{}') as Partial<Save>;
    const save = { ...base, ...data, equipped: { ...data.equipped }, best: { ...base.best, ...data.best }, bestByWorld: { ...data.bestByWorld } };
    if (!STYLES.includes(save.style)) save.style = 'world';
    if (!SKINS.includes(save.skin)) save.skin = 'boy';
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

export function writeSave(save: Save) {
  storage.set(KEY, JSON.stringify(save));
}
