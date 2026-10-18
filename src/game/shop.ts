import type { Category, SkillId } from './world';

/*
 * The shop. Items are nods to the PS2 era (a key-shaped sword, a phoenix
 * feather, a glowing orb, a pompom charm, chained blades) without using any
 * real name. One item per slot can be worn; everything owned stays owned.
 */

/*
 * Six slots, dressed on the customise screen: three armour pieces down the
 * left of the hero (head, body, boots) and three weapon slots down the right
 * (magic, melee, ranged). Older saves had `charm` and `relic`; loadSave()
 * re-seats those items by their new slot.
 */
export type Slot = 'head' | 'body' | 'boots' | 'magic' | 'melee' | 'ranged';
export type ItemId =
  | 'wizardHat' | 'gladHelm' | 'bandana' | 'crown'
  | 'potion' | 'phoenix' | 'pompom' | 'plate'
  | 'windBoots' | 'ironBoots' | 'magnetBoots'
  | 'orb' | 'hourglass' | 'spellbook' | 'lantern'
  | 'keySword' | 'chainBlades' | 'warHammer'
  | 'quiver' | 'knifeSet' | 'huntBoomerang';

/*
 * The forge: permanent upgrades bought level by level. They always apply,
 * worn items or not, and each level costs more than the last.
 */
export type UpgradeId = 'vitality' | 'might' | 'swiftness' | 'fortune' | 'wisdom' | 'magnet' | 'armor';
export type Upgrade = { id: UpgradeId; icon: string; max: number; /** price of level 1 */ base: number };
export const UPGRADES: Upgrade[] = [
  { id: 'vitality', icon: '❤️', max: 5, base: 100 },
  { id: 'might', icon: '💪', max: 5, base: 150 },
  { id: 'armor', icon: '🛡️', max: 4, base: 150 },
  { id: 'swiftness', icon: '👟', max: 3, base: 120 },
  { id: 'magnet', icon: '🧲', max: 3, base: 90 },
  { id: 'fortune', icon: '🪙', max: 5, base: 120 },
  { id: 'wisdom', icon: '📘', max: 5, base: 120 },
];
export const upgradeById = (id: UpgradeId) => UPGRADES.find((u) => u.id === id) as Upgrade;
/** Price of the next level: base, then +60% per level already owned. */
export const upgradePrice = (u: Upgrade, level: number) => Math.round(u.base * Math.pow(1.6, level) / 10) * 10;
/** Per level: what each upgrade gives. */
export const UPGRADE_STEP = { vitality: 15, might: 0.06, armor: 0.06, swiftness: 0.05, magnet: 35, fortune: 0.1, wisdom: 0.1 } as const;
export type Upgrades = Partial<Record<UpgradeId, number>>;

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
  /** Weapons fire this much faster. */
  hasteMult: number;
  /** Extra gem pull radius, in room units. */
  magnet: number;
  /** Fraction of damage taken that armour absorbs. */
  armor: number;
};

export const BASE_LOADOUT: Loadout = {
  mult: { melee: 1, magic: 1, ranged: 1, upgrade: 1 },
  xpMult: 1,
  coinMult: 1,
  revives: 0,
  startSkills: [],
  maxHp: 100,
  speedMult: 1,
  hasteMult: 1,
  magnet: 0,
  armor: 0,
};

export const ITEMS: Item[] = [
  // Head
  { id: 'wizardHat', slot: 'head', price: 120, icon: '🧙', effect: { mult: { melee: 1, magic: 1.3, ranged: 1, upgrade: 1 } } },
  { id: 'gladHelm', slot: 'head', price: 120, icon: '🪖', effect: { mult: { melee: 1.3, magic: 1, ranged: 1, upgrade: 1 } } },
  { id: 'bandana', slot: 'head', price: 90, icon: '🎀', effect: { speedMult: 1.12 } },
  { id: 'crown', slot: 'head', price: 320, icon: '👑', effect: { xpMult: 1.15, coinMult: 1.15 } },
  // Body
  { id: 'potion', slot: 'body', price: 80, icon: '🦺', effect: { maxHp: 130 } },
  { id: 'pompom', slot: 'body', price: 150, icon: '🧸', effect: { coinMult: 1.4 } },
  { id: 'plate', slot: 'body', price: 180, icon: '🛡️', effect: { armor: 0.1 } },
  { id: 'phoenix', slot: 'body', price: 220, icon: '🪶', effect: { revives: 1 } },
  // Boots
  { id: 'windBoots', slot: 'boots', price: 110, icon: '👟', effect: { speedMult: 1.15 } },
  { id: 'magnetBoots', slot: 'boots', price: 120, icon: '🧲', effect: { magnet: 70 } },
  { id: 'ironBoots', slot: 'boots', price: 140, icon: '🥾', effect: { armor: 0.08, maxHp: 115 } },
  // Magic (the spirit companion lives here)
  { id: 'orb', slot: 'magic', price: 150, icon: '🔮', effect: { xpMult: 1.25 } },
  { id: 'hourglass', slot: 'magic', price: 200, icon: '⏳', effect: { hasteMult: 1.15 } },
  { id: 'spellbook', slot: 'magic', price: 260, icon: '📖', effect: { startSkills: ['fireball'] } },
  { id: 'lantern', slot: 'magic', price: 300, icon: '🏮', effect: { startSkills: ['spirits'] } },
  // Melee
  { id: 'keySword', slot: 'melee', price: 260, icon: '🗝️', effect: { startSkills: ['sword'] } },
  { id: 'chainBlades', slot: 'melee', price: 260, icon: '⛓️', effect: { startSkills: ['blades'] } },
  { id: 'warHammer', slot: 'melee', price: 300, icon: '🔨', effect: { startSkills: ['hammer'] } },
  // Ranged
  { id: 'quiver', slot: 'ranged', price: 140, icon: '🏹', effect: { mult: { melee: 1, magic: 1, ranged: 1.3, upgrade: 1 } } },
  { id: 'knifeSet', slot: 'ranged', price: 260, icon: '🔪', effect: { startSkills: ['knives'] } },
  { id: 'huntBoomerang', slot: 'ranged', price: 260, icon: '🪃', effect: { startSkills: ['boomerang'] } },
];

export const SLOTS: Slot[] = ['head', 'body', 'boots', 'magic', 'melee', 'ranged'];
/** The customise screen: armour down the left of the hero, weapons down the right. */
export const ARMOUR_SLOTS: Slot[] = ['head', 'body', 'boots'];
export const WEAPON_SLOTS: Slot[] = ['magic', 'melee', 'ranged'];
export const itemById = (id: ItemId) => ITEMS.find((item) => item.id === id) as Item;

/** Combine the worn items and the forge's levels into one loadout. */
export function buildLoadout(equipped: Partial<Record<Slot, ItemId>>, upgrades: Upgrades = {}): Loadout {
  const out: Loadout = { ...BASE_LOADOUT, mult: { ...BASE_LOADOUT.mult }, startSkills: [] };
  const lv = (id: UpgradeId) => Math.min(upgradeById(id).max, upgrades[id] ?? 0);
  out.maxHp += UPGRADE_STEP.vitality * lv('vitality');
  for (const k of Object.keys(out.mult) as Category[]) out.mult[k] *= 1 + UPGRADE_STEP.might * lv('might');
  out.armor = Math.min(0.5, UPGRADE_STEP.armor * lv('armor'));
  out.speedMult *= 1 + UPGRADE_STEP.swiftness * lv('swiftness');
  out.magnet = UPGRADE_STEP.magnet * lv('magnet');
  out.coinMult *= 1 + UPGRADE_STEP.fortune * lv('fortune');
  out.xpMult *= 1 + UPGRADE_STEP.wisdom * lv('wisdom');
  for (const slot of SLOTS) {
    const id = equipped[slot];
    if (!id) continue;
    const { effect } = itemById(id);
    if (effect.mult) for (const k of Object.keys(effect.mult) as Category[]) out.mult[k] *= effect.mult[k];
    if (effect.xpMult) out.xpMult *= effect.xpMult;
    if (effect.coinMult) out.coinMult *= effect.coinMult;
    if (effect.revives) out.revives += effect.revives;
    if (effect.startSkills) out.startSkills.push(...effect.startSkills);
    if (effect.maxHp) out.maxHp += effect.maxHp - BASE_LOADOUT.maxHp;
    if (effect.speedMult) out.speedMult *= effect.speedMult;
    if (effect.hasteMult) out.hasteMult *= effect.hasteMult;
    if (effect.magnet) out.magnet += effect.magnet;
    if (effect.armor) out.armor = Math.min(0.6, out.armor + effect.armor);
  }
  return out;
}
