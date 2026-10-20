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
  | 'quiver' | 'knifeSet' | 'huntBoomerang'
  | 'stormRod' | 'frostAmulet' | 'prism' | 'brickSack' | 'molotovCrate'
  | 'gauntlets' | 'mineCrate' | 'luckyDurian'
  | 'signedBall' | 'pocketDrill' | 'pocketRocket';

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
  /** On sale only once this arsenal weapon is bought (the items that start you with one). */
  needs?: SkillId;
  /** Prices of the upgrades past level 1 (level 2, level 3…), bought in the shop once it is owned. */
  levels?: number[];
};
export type ItemLevels = Partial<Record<ItemId, number>>;
/** An owned item's level: 1 unless upgraded. */
export const itemLevel = (levels: ItemLevels, id: ItemId) => Math.max(1, levels[id] ?? 1);
/** The Phoenix cloak: level 2 gets you up with all your health, level 3 adds the wings and their speed. */
export const PHOENIX_WING_SPEED = 1.12;

/** The bonuses a run starts with, from the items worn. */
export type Loadout = {
  /** Damage multipliers per weapon category. */
  mult: Record<Category, number>;
  xpMult: number;
  coinMult: number;
  /** Extra lives: get back up once with half your health (all of it from the Phoenix cloak's level 2). */
  revives: number;
  /** Share of health a free revive gives back. */
  reviveHp: number;
  /** The Phoenix cloak at its top level: wings of fire on the hero, and faster. */
  wings: boolean;
  startSkills: SkillId[];
  /** The level each starting weapon begins at (an upgraded item starts it higher). */
  startLevels: Partial<Record<SkillId, number>>;
  /** This many random weapons start at their top level, with the upgrade that evolves them. */
  startMaxed: number;
  /** Sprint masteries taken: from one on, the final bosses of sprints call smaller bosses to their side. */
  sprintMastery: number;
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
  reviveHp: 0.5,
  wings: false,
  startSkills: [],
  startLevels: {},
  startMaxed: 0,
  sprintMastery: 0,
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
  { id: 'wizardHat', slot: 'head', price: 250, icon: '🧙', pic: 'items/wizardHat.webp', effect: { mult: { melee: 1, magic: 1.3, ranged: 1, upgrade: 1 } } },
  { id: 'gladHelm', slot: 'head', price: 250, icon: '🪖', pic: 'items/gladHelm.webp', effect: { mult: { melee: 1.3, magic: 1, ranged: 1, upgrade: 1 } } },
  { id: 'bandana', slot: 'head', price: 180, icon: '🎀', pic: 'items/bandana.webp', effect: { speedMult: 1.12 } },
  { id: 'crown', slot: 'head', price: 1500, icon: '👑', pic: 'items/crown.webp', effect: { xpMult: 1.15, coinMult: 1.15 } },
  // Body
  { id: 'potion', slot: 'body', price: 160, icon: '🦺', pic: 'items/potion.webp', effect: { maxHp: 130 } },
  { id: 'pompom', slot: 'body', price: 1200, icon: '🧸', pic: 'items/pompom.webp', effect: { coinMult: 1.4 } },
  { id: 'plate', slot: 'body', price: 350, icon: '🛡️', pic: 'items/plate.webp', effect: { armor: 0.1 } },
  { id: 'phoenix', slot: 'body', price: 2000, levels: [3000, 4500], icon: '🪶', pic: 'items/phoenix.webp', effect: { revives: 1 } },
  // Boots
  { id: 'windBoots', slot: 'boots', price: 220, icon: '👟', pic: 'items/windBoots.webp', effect: { speedMult: 1.15 } },
  { id: 'magnetBoots', slot: 'boots', price: 220, icon: '🧲', pic: 'items/magnetBoots.webp', effect: { magnet: 70 } },
  { id: 'ironBoots', slot: 'boots', price: 300, icon: '🥾', pic: 'items/ironBoots.webp', effect: { armor: 0.08, maxHp: 115 } },
  // Magic (the spirit companion lives here)
  { id: 'orb', slot: 'magic', price: 600, levels: [1000, 1600], icon: '🔮', pic: 'items/orb.webp', effect: { xpMult: 1.25 } },
  { id: 'hourglass', slot: 'magic', price: 450, levels: [750, 1200], icon: '⏳', pic: 'items/hourglass.webp', effect: { hasteMult: 1.15 } },
  { id: 'spellbook', slot: 'magic', price: 450, levels: [750, 1200], icon: '📖', pic: 'items/spellbook.webp', effect: { startSkills: ['fireball'] } },
  { id: 'seniorTome', slot: 'magic', price: 8000, icon: '📜', pic: 'items/seniorTome.webp', legendary: true, world: 9, effect: { startMaxed: 2 } },
  { id: 'lantern', slot: 'magic', price: 500, levels: [800, 1300], icon: '👻', pic: 'spirits/water-float-0.webp', effect: { startSkills: ['spirits'], spirit: 'water' } },
  { id: 'spiritFire', slot: 'magic', price: 700, levels: [1150, 1850], icon: '👻', pic: 'spirits/fire-float-0.webp', effect: { startSkills: ['spirits'], spirit: 'fire' } },
  { id: 'spiritTide', slot: 'magic', price: 700, levels: [1150, 1850], icon: '👻', pic: 'spirits/tide-float-0.webp', effect: { startSkills: ['spirits'], spirit: 'tide' } },
  { id: 'spiritThorn', slot: 'magic', price: 700, levels: [1150, 1850], icon: '👻', pic: 'spirits/thorn-float-0.webp', effect: { startSkills: ['spirits'], spirit: 'thorn' } },
  { id: 'spiritVolt', slot: 'magic', price: 800, levels: [1300, 2100], icon: '👻', pic: 'spirits/volt-float-0.webp', effect: { startSkills: ['spirits'], spirit: 'volt' } },
  { id: 'spiritShade', slot: 'magic', price: 800, levels: [1300, 2100], icon: '👻', pic: 'spirits/shade-float-0.webp', effect: { startSkills: ['spirits'], spirit: 'shade' } },
  { id: 'stormRod', slot: 'magic', price: 450, levels: [750, 1200], icon: '⚡', pic: 'skills/storm.webp', effect: { startSkills: ['storm'] } },
  { id: 'frostAmulet', slot: 'magic', price: 450, levels: [750, 1200], icon: '❄️', pic: 'skills/frost.webp', effect: { startSkills: ['frost'] } },
  { id: 'prism', slot: 'magic', price: 500, levels: [800, 1300], icon: '🔺', pic: 'skills/laser.webp', effect: { startSkills: ['laser'] } },
  { id: 'brickSack', slot: 'magic', price: 600, levels: [1000, 1600], icon: '🧱', pic: 'skills/brick.webp', needs: 'brick', effect: { startSkills: ['brick'] } },
  { id: 'molotovCrate', slot: 'magic', price: 600, levels: [1000, 1600], icon: '🍾', pic: 'skills/molotov.webp', needs: 'molotov', effect: { startSkills: ['molotov'] } },
  // Melee
  { id: 'keySword', slot: 'melee', price: 450, levels: [750, 1200], icon: '🗝️', pic: 'skills/sword.webp', effect: { startSkills: ['sword'] } },
  { id: 'chainBlades', slot: 'melee', price: 450, levels: [750, 1200], icon: '⛓️', pic: 'skills/blades.webp', effect: { startSkills: ['blades'] } },
  { id: 'warHammer', slot: 'melee', price: 500, levels: [800, 1300], icon: '🔨', pic: 'skills/hammer.webp', effect: { startSkills: ['hammer'] } },
  { id: 'gauntlets', slot: 'melee', price: 280, levels: [450, 750], icon: '🥊', pic: 'forge/might.webp', effect: { mult: { melee: 1.3, magic: 1, ranged: 1, upgrade: 1 } } },
  { id: 'mineCrate', slot: 'melee', price: 650, levels: [1050, 1700], icon: '💣', pic: 'skills/mines.webp', needs: 'mines', effect: { startSkills: ['mines'] } },
  { id: 'luckyDurian', slot: 'melee', price: 650, levels: [1050, 1700], icon: '🌰', pic: 'skills/durian.webp', needs: 'durian', effect: { startSkills: ['durian'] } },
  // Ranged
  { id: 'quiver', slot: 'ranged', price: 280, levels: [450, 750], icon: '🏹', pic: 'items/quiver.webp', effect: { mult: { melee: 1, magic: 1, ranged: 1.3, upgrade: 1 } } },
  { id: 'knifeSet', slot: 'ranged', price: 450, levels: [750, 1200], icon: '🔪', pic: 'skills/knives.webp', effect: { startSkills: ['knives'] } },
  { id: 'huntBoomerang', slot: 'ranged', price: 450, levels: [750, 1200], icon: '🪃', pic: 'skills/boomerang.webp', effect: { startSkills: ['boomerang'] } },
  { id: 'signedBall', slot: 'ranged', price: 700, levels: [1150, 1850], icon: '⚽', pic: 'skills/ball.webp', needs: 'ball', effect: { startSkills: ['ball'] } },
  { id: 'pocketDrill', slot: 'ranged', price: 700, levels: [1150, 1850], icon: '🌀', pic: 'skills/drill.webp', needs: 'drill', effect: { startSkills: ['drill'] } },
  { id: 'pocketRocket', slot: 'ranged', price: 800, levels: [1300, 2100], icon: '🚀', pic: 'skills/rocket.webp', needs: 'rocket', effect: { startSkills: ['rocket'] } },
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
  { id: 'durian', price: 1100, world: 5 }, { id: 'ball', price: 1300, world: 6 }, { id: 'drill', price: 1300, world: 7 },
  { id: 'rocket', price: 1500, world: 8 },
];
export function buildLoadout(equipped: Partial<Record<Slot, ItemId>>, upgrades: Upgrades = {}, masteries = 0, arsenal: SkillId[] = [], levels: ItemLevels = {}): Loadout {
  const out: Loadout = { ...BASE_LOADOUT, mult: { ...BASE_LOADOUT.mult }, startSkills: [], startLevels: {}, arsenal: [...arsenal] };
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
    const item = itemById(id);
    const { effect } = item;
    // The weapon slots' items with levels: a starting weapon begins one level higher for each, and a bonus
    // (damage, XP, haste) grows by half of itself for each (+30% becomes +45% and then +60%).
    const ilv = item.levels && WEAPON_SLOTS.includes(item.slot) ? itemLevel(levels, id) : 1;
    const grow = (m: number) => 1 + (m - 1) * (1 + 0.5 * (ilv - 1));
    if (effect.mult) for (const k of Object.keys(effect.mult) as Category[]) out.mult[k] *= grow(effect.mult[k]);
    if (effect.xpMult) out.xpMult *= grow(effect.xpMult);
    if (effect.coinMult) out.coinMult *= effect.coinMult;
    if (effect.revives) out.revives += effect.revives;
    if (effect.startSkills) for (const s of effect.startSkills) { out.startSkills.push(s); out.startLevels[s] = Math.max(out.startLevels[s] ?? 1, ilv); }
    if (effect.startMaxed) out.startMaxed += effect.startMaxed;
    if (effect.maxHp) out.maxHp += effect.maxHp - BASE_LOADOUT.maxHp;
    if (effect.speedMult) out.speedMult *= effect.speedMult;
    if (effect.hasteMult) out.hasteMult *= grow(effect.hasteMult);
    if (effect.magnet) out.magnet += effect.magnet;
    if (effect.armor) out.armor = Math.min(0.6, out.armor + effect.armor);
    if (effect.spirit) out.spirit = effect.spirit;
    if (id === 'phoenix') {
      const lv = itemLevel(levels, id);
      if (lv >= 2) out.reviveHp = 1;
      if (lv >= 3) { out.wings = true; out.speedMult *= PHOENIX_WING_SPEED; }
    }
  }
  return out;
}
