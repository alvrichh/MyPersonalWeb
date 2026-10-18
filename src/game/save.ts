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
  runs: 0,
});

export function loadSave(): Save {
  const base = fresh();
  try {
    const data = JSON.parse(storage.get(KEY) || '{}') as Partial<Save>;
    const save = { ...base, ...data, equipped: { ...data.equipped }, best: { ...base.best, ...data.best } };
    if (!STYLES.includes(save.style)) save.style = 'original';
    // The old best-run key from the first version, if any.
    if (!save.best.room) {
      try {
        const old = JSON.parse(storage.get('bugHunterBest') || '') as Save['best'];
        if (old && old.room) save.best = old;
      } catch {
        /* nothing saved */
      }
    }
    return save;
  } catch {
    return base;
  }
}

export function writeSave(save: Save) {
  storage.set(KEY, JSON.stringify(save));
}
