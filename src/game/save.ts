import { storage } from '../lib/storage';
import type { ItemId, Slot } from './shop';

/* Everything Bug Hunter remembers between runs, in one localStorage key. */

export type EnemyStyle = 'original' | 'demon' | 'greek' | 'nightmare' | 'random';
export const STYLES: EnemyStyle[] = ['original', 'demon', 'greek', 'nightmare', 'random'];

export type Save = {
  coins: number;
  owned: ItemId[];
  equipped: Partial<Record<Slot, ItemId>>;
  style: EnemyStyle;
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
};

const KEY = 'bugHunter';

const fresh = (): Save => ({
  coins: 0,
  owned: [],
  equipped: {},
  style: 'original',
  music: 0.6,
  sfx: 0.8,
  best: { room: 0 },
  bestByWorld: {},
  unlocked: 1,
  world: 1,
  runs: 0,
});

export function loadSave(): Save {
  const base = fresh();
  try {
    const data = JSON.parse(storage.get(KEY) || '{}') as Partial<Save>;
    const save = { ...base, ...data, equipped: { ...data.equipped }, best: { ...base.best, ...data.best }, bestByWorld: { ...data.bestByWorld } };
    if (!STYLES.includes(save.style)) save.style = 'original';
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

export function writeSave(save: Save) {
  storage.set(KEY, JSON.stringify(save));
}
