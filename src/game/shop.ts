import type { Category, SkillId } from './world';

/*
 * The shop. Items are nods to the PS2 era (a key-shaped sword, a phoenix
 * feather, a glowing orb, a pompom charm, chained blades) without using any
 * real name. One item per slot can be worn; everything owned stays owned.
 */

export type Slot = 'head' | 'charm' | 'relic';
export type ItemId =
  | 'wizardHat' | 'gladHelm' | 'bandana'
  | 'phoenix' | 'orb' | 'pompom' | 'potion'
  | 'keySword' | 'chainBlades' | 'quiver';

export type Item = {
  id: ItemId;
  slot: Slot;
  price: number;
  icon: string;
  /** What wearing it does to a fresh run. */
  effect: Partial<Loadout>;
};

/** The bonuses a run starts with, from the items worn. */
export type Loadout = {
  /** Damage multipliers per weapon category. */
  mult: Record<Category, number>;
  xpMult: number;
  coinMult: number;
  /** Extra lives: get back up once with half your health. */
  revives: number;
  startSkills: SkillId[];
  maxHp: number;
  speedMult: number;
};

export const BASE_LOADOUT: Loadout = {
  mult: { melee: 1, magic: 1, ranged: 1, upgrade: 1 },
  xpMult: 1,
  coinMult: 1,
  revives: 0,
  startSkills: [],
  maxHp: 100,
  speedMult: 1,
};

export const ITEMS: Item[] = [
  { id: 'wizardHat', slot: 'head', price: 120, icon: '🧙', effect: { mult: { melee: 1, magic: 1.3, ranged: 1, upgrade: 1 } } },
  { id: 'gladHelm', slot: 'head', price: 120, icon: '🪖', effect: { mult: { melee: 1.3, magic: 1, ranged: 1, upgrade: 1 } } },
  { id: 'bandana', slot: 'head', price: 90, icon: '🎀', effect: { speedMult: 1.12 } },
  { id: 'potion', slot: 'charm', price: 80, icon: '🧪', effect: { maxHp: 130 } },
  { id: 'orb', slot: 'charm', price: 150, icon: '🔮', effect: { xpMult: 1.25 } },
  { id: 'pompom', slot: 'charm', price: 150, icon: '🧸', effect: { coinMult: 1.4 } },
  { id: 'phoenix', slot: 'charm', price: 220, icon: '🪶', effect: { revives: 1 } },
  { id: 'quiver', slot: 'relic', price: 140, icon: '🏹', effect: { mult: { melee: 1, magic: 1, ranged: 1.3, upgrade: 1 } } },
  { id: 'keySword', slot: 'relic', price: 260, icon: '🗝️', effect: { startSkills: ['sword'] } },
  { id: 'chainBlades', slot: 'relic', price: 260, icon: '⛓️', effect: { startSkills: ['blades'] } },
];

export const SLOTS: Slot[] = ['head', 'charm', 'relic'];
export const itemById = (id: ItemId) => ITEMS.find((item) => item.id === id) as Item;

/** Combine the worn items into one loadout. */
export function buildLoadout(equipped: Partial<Record<Slot, ItemId>>): Loadout {
  const out: Loadout = { ...BASE_LOADOUT, mult: { ...BASE_LOADOUT.mult }, startSkills: [] };
  for (const slot of SLOTS) {
    const id = equipped[slot];
    if (!id) continue;
    const { effect } = itemById(id);
    if (effect.mult) for (const k of Object.keys(effect.mult) as Category[]) out.mult[k] *= effect.mult[k];
    if (effect.xpMult) out.xpMult *= effect.xpMult;
    if (effect.coinMult) out.coinMult *= effect.coinMult;
    if (effect.revives) out.revives += effect.revives;
    if (effect.startSkills) out.startSkills.push(...effect.startSkills);
    if (effect.maxHp) out.maxHp = Math.max(out.maxHp, effect.maxHp);
    if (effect.speedMult) out.speedMult *= effect.speedMult;
  }
  return out;
}
