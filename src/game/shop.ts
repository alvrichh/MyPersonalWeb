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
/**
 * The spirit companion's look and element. `water` is the friendly ghost you
 * get by default; the rest are bought for the magic slot and each gives the
 * spirit's orb its own effect (see `hitWithShot` in world.ts).
 */
export type SpiritSkin = 'water' | 'fire' | 'tide' | 'thorn' | 'volt' | 'shade';
export const SPIRIT_COLOR: Record<SpiritSkin, [string, string, string]> = {
  // trail, core, glow
  water: ['rgba(125,211,252,0.5)', '#f0f9ff', '#38bdf8'],
  fire: ['rgba(251,146,60,0.55)', '#fff7ed', '#f97316'],
  tide: ['rgba(56,189,248,0.55)', '#e0f2fe', '#0284c7'],
  thorn: ['rgba(132,204,22,0.55)', '#f7fee7', '#65a30d'],
  volt: ['rgba(250,204,21,0.55)', '#fefce8', '#eab308'],
  shade: ['rgba(168,85,247,0.55)', '#f5f3ff', '#7e22ce'],
};
export type ItemId =
  | 'wizardHat' | 'gladHelm' | 'bandana' | 'crown'
  | 'potion' | 'phoenix' | 'pompom' | 'plate'
  | 'windBoots' | 'ironBoots' | 'magnetBoots'
  | 'orb' | 'hourglass' | 'spellbook' | 'lantern' | 'seniorTome'
  | 'spiritFire' | 'spiritTide' | 'spiritThorn' | 'spiritVolt' | 'spiritShade'
  | 'keySword' | 'chainBlades' | 'warHammer'
  | 'quiver' | 'knifeSet' | 'huntBoomerang';

/*
 * The forge: permanent upgrades bought level by level. They always apply,
 * worn items or not, and each level costs more than the last.
 */
export type UpgradeId = 'vitality' | 'might' | 'swiftness' | 'fortune' | 'wisdom' | 'magnet' | 'armor';
export type Upgrade = { id: UpgradeId; icon: string; max: number; /** price of level 1 */ base: number };
/** Forge icons: the owner's painted medallions (emoji in retro). */
export const upgradePic = (id: UpgradeId) => `forge/${id}.webp`;
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
  /** Emoji, shown in retro. */
  icon: string;
  /** Painted icon, relative to images/game/ (the item's own, or the weapon it starts you with). */
  pic?: string;
  /** What wearing it does to a fresh run. */
  effect: Partial<Loadout>;
  /** A legendary item: absurdly strong and absurdly dear (still under a skin's price). */
  legendary?: boolean;
  /** On sale only once this world is won, in either mode (`worldWon` in save.ts). */
  world?: number;
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
  /** This many random weapons start at their top level, with the upgrade that evolves them. */
  startMaxed: number;
  maxHp: number;
  speedMult: number;
  /** Weapons fire this much faster. */
  hasteMult: number;
  /** Extra gem pull radius, in room units. */
  magnet: number;
  /** Fraction of damage taken that armour absorbs. */
  armor: number;
  /** Which spirit companion comes with the Spirits skill. */
  spirit: SpiritSkin;
  /** On call weapons unlocked in the shop's arsenal: only these can come up in level ups. */
  arsenal: SkillId[];
};

export const BASE_LOADOUT: Loadout = {
  mult: { melee: 1, magic: 1, ranged: 1, upgrade: 1 },
  xpMult: 1,
  coinMult: 1,
  revives: 0,
  startSkills: [],
  startMaxed: 0,
  maxHp: 100,
  speedMult: 1,
  hasteMult: 1,
  magnet: 0,
  armor: 0,
  spirit: 'water',
  arsenal: [],
};

export const ITEMS: Item[] = [
  // Head
  { id: 'wizardHat', slot: 'head', price: 120, icon: '🧙', pic: 'items/wizardHat.webp', effect: { mult: { melee: 1, magic: 1.3, ranged: 1, upgrade: 1 } } },
  { id: 'gladHelm', slot: 'head', price: 120, icon: '🪖', pic: 'items/gladHelm.webp', effect: { mult: { melee: 1.3, magic: 1, ranged: 1, upgrade: 1 } } },
  { id: 'bandana', slot: 'head', price: 90, icon: '🎀', pic: 'items/bandana.webp', effect: { speedMult: 1.12 } },
  { id: 'crown', slot: 'head', price: 320, icon: '👑', pic: 'items/crown.webp', effect: { xpMult: 1.15, coinMult: 1.15 } },
  // Body
  { id: 'potion', slot: 'body', price: 80, icon: '🦺', pic: 'items/potion.webp', effect: { maxHp: 130 } },
  { id: 'pompom', slot: 'body', price: 150, icon: '🧸', pic: 'items/pompom.webp', effect: { coinMult: 1.4 } },
  { id: 'plate', slot: 'body', price: 180, icon: '🛡️', pic: 'items/plate.webp', effect: { armor: 0.1 } },
  { id: 'phoenix', slot: 'body', price: 220, icon: '🪶', pic: 'items/phoenix.webp', effect: { revives: 1 } },
  // Boots
  { id: 'windBoots', slot: 'boots', price: 110, icon: '👟', pic: 'items/windBoots.webp', effect: { speedMult: 1.15 } },
  { id: 'magnetBoots', slot: 'boots', price: 120, icon: '🧲', pic: 'items/magnetBoots.webp', effect: { magnet: 70 } },
  { id: 'ironBoots', slot: 'boots', price: 140, icon: '🥾', pic: 'items/ironBoots.webp', effect: { armor: 0.08, maxHp: 115 } },
  // Magic (the spirit companion lives here)
  { id: 'orb', slot: 'magic', price: 150, icon: '🔮', pic: 'items/orb.webp', effect: { xpMult: 1.25 } },
  { id: 'hourglass', slot: 'magic', price: 200, icon: '⏳', pic: 'items/hourglass.webp', effect: { hasteMult: 1.15 } },
  { id: 'spellbook', slot: 'magic', price: 260, icon: '📖', pic: 'items/spellbook.webp', effect: { startSkills: ['fireball'] } },
  { id: 'seniorTome', slot: 'magic', price: 8000, icon: '📜', pic: 'items/seniorTome.webp', legendary: true, world: 8, effect: { startMaxed: 2 } },
  { id: 'lantern', slot: 'magic', price: 300, icon: '👻', pic: 'spirits/water-float-0.webp', effect: { startSkills: ['spirits'], spirit: 'water' } },
  { id: 'spiritFire', slot: 'magic', price: 420, icon: '👻', pic: 'spirits/fire-float-0.webp', effect: { startSkills: ['spirits'], spirit: 'fire' } },
  { id: 'spiritTide', slot: 'magic', price: 420, icon: '👻', pic: 'spirits/tide-float-0.webp', effect: { startSkills: ['spirits'], spirit: 'tide' } },
  { id: 'spiritThorn', slot: 'magic', price: 420, icon: '👻', pic: 'spirits/thorn-float-0.webp', effect: { startSkills: ['spirits'], spirit: 'thorn' } },
  { id: 'spiritVolt', slot: 'magic', price: 480, icon: '👻', pic: 'spirits/volt-float-0.webp', effect: { startSkills: ['spirits'], spirit: 'volt' } },
  { id: 'spiritShade', slot: 'magic', price: 480, icon: '👻', pic: 'spirits/shade-float-0.webp', effect: { startSkills: ['spirits'], spirit: 'shade' } },
  // Melee
  { id: 'keySword', slot: 'melee', price: 260, icon: '🗝️', pic: 'skills/sword.webp', effect: { startSkills: ['sword'] } },
  { id: 'chainBlades', slot: 'melee', price: 260, icon: '⛓️', pic: 'skills/blades.webp', effect: { startSkills: ['blades'] } },
  { id: 'warHammer', slot: 'melee', price: 300, icon: '🔨', pic: 'skills/hammer.webp', effect: { startSkills: ['hammer'] } },
  // Ranged
  { id: 'quiver', slot: 'ranged', price: 140, icon: '🏹', pic: 'items/quiver.webp', effect: { mult: { melee: 1, magic: 1, ranged: 1.3, upgrade: 1 } } },
  { id: 'knifeSet', slot: 'ranged', price: 260, icon: '🔪', pic: 'skills/knives.webp', effect: { startSkills: ['knives'] } },
  { id: 'huntBoomerang', slot: 'ranged', price: 260, icon: '🪃', pic: 'skills/boomerang.webp', effect: { startSkills: ['boomerang'] } },
];

export const SLOTS: Slot[] = ['head', 'body', 'boots', 'magic', 'melee', 'ranged'];
/** The customise screen: armour down the left of the hero, weapons down the right. */
export const ARMOUR_SLOTS: Slot[] = ['head', 'body', 'boots'];
export const WEAPON_SLOTS: Slot[] = ['magic', 'melee', 'ranged'];
export const itemById = (id: ItemId) => ITEMS.find((item) => item.id === id) as Item;

/** Combine the worn items and the forge's levels into one loadout. */
/** What each mastery (either mode) adds for good: damage, health, coins and XP. */
export const MASTERY_STEP = { damage: 0.05, hp: 10, coins: 0.05, xp: 0.05 } as const;

/* The arsenal: On call's extra weapons are bought once, and from then on
   they can come up in that mode's level ups. Dearer the stronger they are,
   and always under a skin's price. */
/* The arsenal: one weapon per world from 1 to 7. Winning that world, in either mode, puts it on sale;
   once bought it can come up in the level ups of both modes. */
export const ARSENAL: { id: SkillId; price: number; world: number }[] = [
  { id: 'brick', price: 900, world: 1 }, { id: 'molotov', price: 900, world: 2 }, { id: 'mines', price: 1100, world: 3 },
  { id: 'durian', price: 1100, world: 4 }, { id: 'ball', price: 1300, world: 5 }, { id: 'drill', price: 1300, world: 6 },
  { id: 'rocket', price: 1500, world: 7 },
];
export function buildLoadout(equipped: Partial<Record<Slot, ItemId>>, upgrades: Upgrades = {}, masteries = 0, arsenal: SkillId[] = []): Loadout {
  const out: Loadout = { ...BASE_LOADOUT, mult: { ...BASE_LOADOUT.mult }, startSkills: [], arsenal: [...arsenal] };
  out.maxHp += MASTERY_STEP.hp * masteries;
  for (const k of Object.keys(out.mult) as Category[]) out.mult[k] *= 1 + MASTERY_STEP.damage * masteries;
  out.coinMult *= 1 + MASTERY_STEP.coins * masteries;
  out.xpMult *= 1 + MASTERY_STEP.xp * masteries;
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
    if (effect.startMaxed) out.startMaxed += effect.startMaxed;
    if (effect.maxHp) out.maxHp += effect.maxHp - BASE_LOADOUT.maxHp;
    if (effect.speedMult) out.speedMult *= effect.speedMult;
    if (effect.hasteMult) out.hasteMult *= effect.hasteMult;
    if (effect.magnet) out.magnet += effect.magnet;
    if (effect.armor) out.armor = Math.min(0.6, out.armor + effect.armor);
    if (effect.spirit) out.spirit = effect.spirit;
  }
  return out;
}
