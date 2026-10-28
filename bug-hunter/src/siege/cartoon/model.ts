/** Siege has its own balance and save schema. Nothing here changes action/board stats. */
export const FIELD = 1600;
export const LIMIT = 300;
export const CAP = 36;
/** Its own save, apart from Siege Legacy's (`bugHunter.siege.v1`); v2 since battles became stages within acts. */
export const SAVE_KEY = 'bugHunter.siege.cartoon.v2';
/** Cartoon Wars 2-style acts, each with its own guardian, each fought over `STAGES` battles: the guardian comes in the
    last. A battle's number (`world` in the model) runs from 1 to `LAST` across all the acts. */
export const ACTS = 6;
export const STAGES = 5;
export const LAST = ACTS * STAGES;
export const actOf = (stage: number) => Math.min(ACTS, Math.max(1, Math.ceil(stage / STAGES)));
export const stageIn = (stage: number) => ((Math.max(1, stage) - 1) % STAGES) + 1;
/** Is this the act's last battle, the one its guardian joins? */
export const guarded = (stage: number) => stageIn(stage) === STAGES;
/** How hard a battle is, on the old nine-world scale (the first 1, the last 9). */
const hard = (stage: number) => 1 + 8 * Math.pow((Math.min(LAST, Math.max(1, stage)) - 1) / (LAST - 1), 0.75);
export const CASTS = ['original', 'demon', 'viking', 'mud', 'jungle', 'greek', 'robot', 'nightmare', 'core'];
export interface Spec { id: number; cost: number; hp: number; damage: number; speed: number; range: number; rate: number; cooldown: number; unlock: number; sprite: string; size: number; splash?: number; air?: boolean;
  /** Breaks into a weaker copy of itself when it falls, this many times (Cartoon Wars 2's gatling robots). */
  splits?: number;
  /** An enemy-only unit (Cartoon Wars 2's enemy roster): never in our army. */
  foe?: boolean;
  /** Infantry: knocked back by a heavy blow (and up again), where the others only rock. */
  infantry?: boolean;
  /** Cannot be stunned (the Red Dragon Rider). */
  steady?: boolean;
  /** Its sheet has the six poses (walk A, walk B, ready, attack, hurt, dead) instead of three (stand, attack, hurt). */
  six?: boolean;
  /** Reaches flyers although it fights up close (the master swordsman). */
  hitsAir?: boolean;
  /** Its rockets blow up where they land (the robots' last forms). */
  blast?: boolean;
  /** A sweeping blow: every enemy it can reach within `reach` field units in front is hit and thrown back `back` units (the
      archangel's golden crescent). */
  sweep?: { reach: number; back: number };
  /** A flyer that only fights other flyers (and the fortress), never troops on the ground. */
  skyOnly?: boolean;
  /** What it throws or shoots, a picture from its own sheet (`siege/units/shot-<name>`), and whether it spins in flight
      (a rock, a shuriken) or points along its path (a javelin, an arrow). */
  shot?: string; spin?: boolean;
  /** Its sheet is drawn facing left (the owner's enemy sheets); the rest face right. */
  facesLeft?: boolean;
  /** Its upgrade forms, level 2 on (docs/cw2-reference.md): each replaces these stats and looks, bought in the workshop. */
  forms?: Form[] }
/** Spells that land on their target instead of flying to it (the wizard's). */
export const SPELLS = ['lightning', 'tornado', 'meteor'];
/** An upgrade form: its gold price in the workshop and what it changes. */
export type Form = Partial<Pick<Spec, 'cost' | 'hp' | 'damage' | 'speed' | 'range' | 'rate' | 'splash' | 'hitsAir' | 'blast' | 'sweep' | 'infantry' | 'shot' | 'spin' | 'sprite' | 'size'>> & { price: number }
/** Cartoon Wars 2's rosters (docs/siege-roster.md), every unit from the owner's six-pose sheets. Every unit's `id` is
    its place in this list: ours first (10 land, then 5 air), then the enemy's, each one stated as the ally it equals
    in the reference, then our flying mech and the enemy's guardians. */
/** A six-pose sheet (drawn at a higher resolution: 0.4 a pixel of its first walking pose). */
/** `k` evens out a sheet drawn at another scale than the swordsman's. */
const six = (name: string, px: number, k = 1) => ({ sprite: `siege/units/${name}`, size: Math.round(px * 0.4 * k), six: true });
/** The enemy's six-pose sheets, drawn facing left (our way). */
const foe = (name: string, px: number, k = 1) => ({ ...six(name, px, k), facesLeft: true as const });
export const UNITS: readonly Spec[] = [
  // Ours, land.
  // The swordsman's five forms (the reference's six, its fifth dropped): club, dagger, sword and shield, greatsword,
  // and the master, whose slash leaves fire and reaches flyers. Energy follows the reference's mana, doubled.
  { id: 0, cost: 20, hp: 115, damage: 16, speed: 43, range: 35, rate: 0.8, cooldown: 2, unlock: 1, infantry: true, ...six('ally-swordsman-1', 166, 0.7229), forms: [
    { price: 120, cost: 30, hp: 135, damage: 21, speed: 46, ...six('ally-swordsman-2', 154, 0.8279) },
    { price: 300, cost: 50, hp: 190, damage: 23, ...six('ally-swordsman-3', 168, 0.8185) },
    { price: 400, cost: 60, hp: 220, damage: 34, range: 42, ...six('ally-swordsman-4', 200, 0.7625) },
    { price: 2000, cost: 200, hp: 340, damage: 58, speed: 62, range: 45, splash: 30, hitsAir: true, ...six('ally-swordsman-5', 187, 0.9358) },
  ] },
  // The spearman's five forms (docs/cw2-reference.md): basic spear, longer, longer still, the horned fox helmet, and the
  // lancer on a white horse. The reference gives no prices: a little above the swordsman's.
  { id: 1, cost: 30, hp: 150, damage: 20, speed: 40, range: 55, rate: 0.9, cooldown: 3, unlock: 1, infantry: true, ...six('ally-spearman-1', 126, 0.9524), forms: [
    { price: 250, cost: 40, hp: 175, damage: 24, range: 65, ...six('ally-spearman-2', 148, 0.9122) },
    { price: 400, cost: 50, hp: 210, damage: 28, range: 75, ...six('ally-spearman-3', 153, 0.9804) },
    { price: 600, cost: 65, hp: 270, damage: 34, range: 80, ...six('ally-spearman-4', 182, 0.9341) },
    { price: 2200, cost: 220, hp: 620, damage: 60, speed: 70, range: 90, splash: 30, infantry: false, ...six('ally-spearman-5', 216, 0.9491) },
  ] },
  // The archer's four forms (docs/cw2-reference.md): rock thrower, javelin thrower, archer with a bow, and the ninja
  // throwing shurikens; each throws its own sheet's projectile. The reference gives no prices.
  { id: 2, cost: 30, hp: 80, damage: 18, speed: 33, range: 150, rate: 1.3, cooldown: 4, unlock: 1, infantry: true, shot: 'rock', spin: true, ...six('ally-archer-1', 218, 0.5505), forms: [
    { price: 250, cost: 40, hp: 90, damage: 24, range: 175, shot: 'javelin', spin: false, ...six('ally-archer-2', 236, 0.572) },
    { price: 400, cost: 50, hp: 100, damage: 27, range: 200, shot: 'arrow', spin: false, ...six('ally-archer-3', 250, 0.58) },
    { price: 1500, cost: 120, hp: 150, damage: 32, speed: 50, range: 195, rate: 0.8, shot: 'shuriken', spin: true, ...six('ally-archer-4', 262, 0.5821) },
  ] },
  // The heavy armour swordsman's four forms (docs/cw2-reference.md): a knight with two swords, the armoured one who
  // punches, a bigger one with maces for hands, and the crowned giant (the King). The reference gives no prices.
  { id: 3, cost: 65, hp: 430, damage: 24, speed: 22, range: 40, rate: 1.5, cooldown: 7, unlock: 1, infantry: true, ...six('ally-heavy-1', 167, 0.96), forms: [
    { price: 300, cost: 80, hp: 560, damage: 30, ...six('ally-heavy-2', 185, 0.96) },
    { price: 500, cost: 100, hp: 700, damage: 34, rate: 1.2, ...six('ally-heavy-3', 214, 0.96) },
    { price: 1800, cost: 180, hp: 980, damage: 48, rate: 1.2, splash: 30, ...six('ally-heavy-4', 232, 0.96) },
  ] },
  // The gunner's four forms (docs/cw2-reference.md): pistol, rifle, two Uzis (fast), sniper rifle (long reach, slow and
  // heavy). They fire bullets, each gun its own (`shot: 'bullet'`, `bullet-rifle|uzi|sniper`). The reference gives no prices.
  { id: 4, cost: 45, hp: 95, damage: 24, speed: 32, range: 200, rate: 1.4, cooldown: 6, unlock: 1, infantry: true, shot: 'bullet', ...six('ally-gunner-1', 246, 0.437), forms: [
    { price: 300, cost: 55, hp: 110, damage: 30, range: 230, shot: 'bullet-rifle', ...six('ally-gunner-2', 277, 0.4242) },
    { price: 500, cost: 70, hp: 125, damage: 22, range: 210, rate: 0.6, shot: 'bullet-uzi', ...six('ally-gunner-3', 278, 0.4676) },
    { price: 1600, cost: 140, hp: 150, damage: 90, range: 320, rate: 2.4, shot: 'bullet-sniper', ...six('ally-gunner-4', 283, 0.4859) },
  ] },
  // The blaster's four forms (docs/cw2-reference.md): bazooka, rocket launcher, ray gun, flamethrower. Rockets fly as
  // their own pictures and blast an area; the ray is drawn in code; the flame is in the attack pose (no projectile).
  { id: 5, cost: 85, hp: 260, damage: 34, speed: 28, range: 200, rate: 1.6, cooldown: 8, unlock: 2, infantry: true, splash: 40, shot: 'rocket', spin: false, ...six('ally-blaster-1', 256, 0.3906), forms: [
    { price: 350, cost: 100, hp: 290, damage: 44, splash: 50, shot: 'rockets', ...six('ally-blaster-2', 278, 0.4227) },
    { price: 600, cost: 120, hp: 320, damage: 52, range: 240, rate: 1.3, splash: 0, shot: 'ray', ...six('ally-blaster-3', 238, 0.5252) },
    { price: 1800, cost: 170, hp: 420, damage: 32, range: 110, rate: 0.5, splash: 70, shot: 'none', ...six('ally-blaster-4', 251, 0.5279) },
  ] },
  // The wizard's three forms (docs/cw2-reference.md), the same staff: lightning striking the ground, a tornado, and a
  // meteor that leaves flames. The spell lands on the target from the sheet (`shot-lightning|tornado|meteor`); from
  // level 3 he reaches flyers. The reference gives no prices.
  { id: 6, cost: 95, hp: 150, damage: 40, speed: 26, range: 220, rate: 1.9, cooldown: 10, unlock: 3, splash: 55, infantry: true, shot: 'lightning', ...six('ally-wizard-1', 249, 0.4418), forms: [
    { price: 600, cost: 120, hp: 180, damage: 46, splash: 75, shot: 'tornado', ...six('ally-wizard-2', 289, 0.4585) },
    { price: 2000, cost: 190, hp: 230, damage: 70, splash: 90, hitsAir: true, shot: 'meteor', ...six('ally-wizard-3', 296, 0.5068) },
  ] },
  // The vulture rider: a knight with a spear on a walking vulture.
  { id: 7, cost: 75, hp: 260, damage: 40, speed: 85, range: 38, rate: 0.8, cooldown: 7, unlock: 4, ...six('ally-vulture-1', 234, 0.7799), forms: [
    { price: 1600, cost: 105, hp: 440, damage: 62, range: 46, splash: 30, ...six('ally-vulture-2', 290, 0.7586) },
  ] },
  // The armed robot's three forms (docs/cw2-reference.md): claw and arm rocket, the walker with twin cannons (fast and
  // strong), and the walker behind a wall-like shield firing missiles.
  { id: 8, cost: 110, hp: 320, damage: 38, speed: 50, range: 180, rate: 1, cooldown: 10, unlock: 5, shot: 'rocket', spin: false, ...six('ally-robot-1', 167, 0.82), forms: [
    { price: 700, cost: 140, hp: 420, damage: 22, rate: 0.45, range: 190, shot: 'bullet', ...six('ally-robot-2', 231, 0.82) },
    { price: 1800, cost: 180, hp: 800, damage: 60, rate: 1.4, range: 200, splash: 40, shot: 'rockets', blast: true, ...six('ally-robot-3', 253, 0.82) },
  ] },
  // The heavy armed robot's four forms (docs/cw2-reference.md): gatling bursts, small rockets added (MK2), a frozen
  // cannon on its back (from here it reaches flyers), and a huge one firing rocket salvos.
  { id: 9, cost: 200, hp: 1300, damage: 70, speed: 18, range: 200, rate: 2, cooldown: 22, unlock: 5, splash: 80, shot: 'bullet', ...six('ally-heavy-robot-1', 166, 1.17), forms: [
    { price: 1200, cost: 230, hp: 1500, damage: 80, shot: 'rockets', ...six('ally-heavy-robot-2', 186, 1.17) },
    { price: 2200, cost: 260, hp: 1800, damage: 90, hitsAir: true, shot: 'ice', ...six('ally-heavy-robot-3', 214, 1.17) },
    { price: 4000, cost: 320, hp: 2600, damage: 120, splash: 100, hitsAir: true, blast: true, shot: 'salvo', ...six('ally-heavy-robot-4', 254, 1.17) },
  ] },
  // Ours, air (Cartoon Wars 2's A row): they fly over the field, out of reach of melee troops; only ranged ones hit them.
  // The aircraft fighter's four forms: a sword under a propeller pack, then with goggles and scarf, two rotors and blue
  // steel, and gold rotors with a flaming sword.
  { id: 10, cost: 30, hp: 70, damage: 12, speed: 70, range: 40, rate: 0.7, cooldown: 3, unlock: 2, air: true, skyOnly: true, ...six('ally-fighter-1', 242, 0.5062), forms: [
    { price: 150, cost: 40, hp: 100, damage: 16, ...six('ally-fighter-2', 269, 0.4833) },
    { price: 400, cost: 55, hp: 140, damage: 22, ...six('ally-fighter-3', 267, 0.5243) },
    { price: 1200, cost: 90, hp: 220, damage: 34, speed: 80, splash: 25, ...six('ally-fighter-4', 274, 0.5748) },
  ] },
  // The armed aircraft fighter's four forms (docs/cw2-reference.md): a rifleman under a propeller pack, a veteran
  // sniper, a laser gun, and the air magician casting pink lightning.
  { id: 11, cost: 55, hp: 110, damage: 20, speed: 55, range: 190, rate: 0.8, cooldown: 5, unlock: 3, air: true, skyOnly: true, shot: 'bullet-rifle', ...six('ally-armed-fighter-1', 261, 0.4789), forms: [
    { price: 400, cost: 70, hp: 130, damage: 45, range: 260, rate: 1.6, shot: 'bullet-sniper', ...six('ally-armed-fighter-2', 273, 0.4853) },
    { price: 900, cost: 90, hp: 170, damage: 34, range: 230, rate: 0.9, shot: 'plasma', ...six('ally-armed-fighter-3', 257, 0.5642) },
    { price: 2000, cost: 140, hp: 240, damage: 55, range: 220, rate: 1.4, splash: 60, shot: 'ray-pink', ...six('ally-armed-fighter-4', 285, 0.5702) },
  ] },
  // The armed helicopter's three forms: green with one rocket, blue with a pair, and the black and gold gunship's salvo.
  { id: 12, cost: 95, hp: 320, damage: 44, speed: 35, range: 210, rate: 1.8, cooldown: 10, unlock: 4, air: true, splash: 50, shot: 'rocket', spin: false, ...six('ally-helicopter-1', 169, 1.0355), forms: [
    { price: 800, cost: 120, hp: 420, damage: 54, splash: 55, shot: 'rockets', ...six('ally-helicopter-2', 196, 1.0204) },
    { price: 2000, cost: 170, hp: 620, damage: 70, range: 230, splash: 70, shot: 'salvo', ...six('ally-helicopter-3', 201, 1.1443) },
  ] },
  // The drill aircraft, the flying shield (docs/cw2-reference.md): a drill rocket that rams, then a heavier gold one.
  { id: 13, cost: 80, hp: 360, damage: 30, speed: 55, range: 40, rate: 0.9, cooldown: 8, unlock: 3, air: true, ...six('ally-drill-1', 199, 0.5528), forms: [
    { price: 1000, cost: 130, hp: 700, damage: 48, rate: 0.8, ...six('ally-drill-2', 242, 0.6095) },
  ] },
  // The angel army, the dearest: an axe and shield (very fast), a staff throwing a violet crescent, and the golden
  // archangel, bigger, whose sweeping golden crescent hits everything ahead of it and throws it far back.
  { id: 14, cost: 220, hp: 700, damage: 60, speed: 75, range: 45, rate: 0.9, cooldown: 20, unlock: 6, air: true, splash: 40, ...six('ally-angel-1', 246, 0.5793), forms: [
    { price: 1500, cost: 260, hp: 900, damage: 70, speed: 55, range: 180, rate: 1.1, splash: 50, shot: 'crescent', ...six('ally-angel-2', 282, 0.594) },
    { price: 4000, cost: 340, hp: 1300, damage: 110, speed: 55, range: 120, rate: 1.5, splash: 0, shot: 'crescent-gold', sweep: { reach: 230, back: 170 }, ...six('ally-angel-3', 298, 0.7718) },
  ] },
  // The enemy's.
  { id: 15, cost: 0, hp: 115, damage: 16, speed: 43, range: 35, rate: 0.8, cooldown: 0, unlock: 1, foe: true, infantry: true, ...foe('foe-swordsman-1', 141, 0.82) },
  { id: 16, cost: 0, hp: 150, damage: 20, speed: 40, range: 55, rate: 0.9, cooldown: 0, unlock: 1, foe: true, infantry: true, ...foe('foe-spearman-1', 132, 0.87) },
  { id: 17, cost: 0, hp: 130, damage: 18, speed: 70, range: 35, rate: 0.7, cooldown: 0, unlock: 1, foe: true, ...foe('foe-dog-1', 102, 0.98) },
  { id: 18, cost: 0, hp: 480, damage: 26, speed: 24, range: 42, rate: 1.5, cooldown: 0, unlock: 1, foe: true, ...foe('foe-bear-1', 141, 1.19) },
  { id: 19, cost: 0, hp: 240, damage: 32, speed: 40, range: 60, rate: 1, cooldown: 0, unlock: 1, foe: true, infantry: true, ...foe('foe-reaper-1', 140, 0.93) },
  { id: 20, cost: 0, hp: 560, damage: 30, speed: 22, range: 45, rate: 1.6, cooldown: 0, unlock: 1, foe: true, splash: 40, infantry: true, ...foe('foe-hammer-1', 133, 1.03) },
  { id: 21, cost: 0, hp: 720, damage: 34, speed: 21, range: 48, rate: 1.6, cooldown: 0, unlock: 1, foe: true, splash: 40, infantry: true, ...foe('foe-axeman-1', 147, 1.07) },
  { id: 22, cost: 0, hp: 100, damage: 30, speed: 30, range: 230, rate: 1.5, cooldown: 0, unlock: 1, foe: true, infantry: true, ...foe('foe-gunner-1', 134, 0.86) },
  { id: 23, cost: 0, hp: 300, damage: 38, speed: 28, range: 210, rate: 1.5, cooldown: 0, unlock: 1, foe: true, infantry: true, ...foe('foe-blaster-1', 158, 0.68) },
  { id: 24, cost: 0, hp: 150, damage: 42, speed: 26, range: 220, rate: 1.9, cooldown: 0, unlock: 1, foe: true, splash: 60, infantry: true, ...foe('foe-wizard-1', 165, 0.77) },
  { id: 25, cost: 0, hp: 280, damage: 36, speed: 60, range: 40, rate: 1, cooldown: 0, unlock: 1, foe: true, ...foe('foe-tiger-1', 115, 1.2) },
  { id: 26, cost: 0, hp: 420, damage: 40, speed: 45, range: 120, rate: 1.4, cooldown: 0, unlock: 1, foe: true, splash: 50, ...foe('foe-dragon-1', 120, 1.38) },
  { id: 27, cost: 0, hp: 380, damage: 40, speed: 55, range: 45, rate: 0.9, cooldown: 0, unlock: 1, foe: true, air: true, ...foe('foe-death-angel-1', 156, 0.93) },
  { id: 28, cost: 0, hp: 70, damage: 12, speed: 70, range: 40, rate: 0.7, cooldown: 0, unlock: 1, foe: true, air: true, skyOnly: true, ...foe('foe-eagle-1', 171, 0.7) },
  { id: 29, cost: 0, hp: 110, damage: 18, speed: 60, range: 40, rate: 0.7, cooldown: 0, unlock: 1, foe: true, air: true, skyOnly: true, ...foe('foe-ninja-bat-1', 128, 0.7) },
  { id: 30, cost: 0, hp: 130, damage: 24, speed: 45, range: 180, rate: 1.2, cooldown: 0, unlock: 1, foe: true, air: true, skyOnly: true, ...foe('foe-hypno-bat-1', 139, 0.83) },
  { id: 31, cost: 0, hp: 900, damage: 55, speed: 40, range: 130, rate: 1.4, cooldown: 0, unlock: 1, foe: true, air: true, splash: 50, steady: true, ...foe('foe-red-dragon-rider-1', 179, 1.05) },
  { id: 32, cost: 0, hp: 760, damage: 40, speed: 24, range: 180, rate: 1.4, cooldown: 0, unlock: 1, foe: true, splits: 2, ...foe('foe-gatling-1', 123, 1.22) },
  // Ours again, appended (ids are places in this list):
  // The flying mech, in six forms: a rocket fist, a laser, a plasma beam, an ice burst, a gatling,
  // and a giant golden fist.
  { id: 33, cost: 80, hp: 300, damage: 32, speed: 55, range: 45, rate: 0.9, cooldown: 8, unlock: 5, air: true, ...six('ally-mech-1', 215, 0.6977), forms: [
    { price: 500, cost: 95, hp: 340, damage: 30, range: 130, shot: 'ray-blue', ...six('ally-mech-2', 242, 0.6612) },
    { price: 800, cost: 110, hp: 380, damage: 38, range: 150, shot: 'plasma', ...six('ally-mech-3', 268, 0.6437) },
    { price: 1200, cost: 130, hp: 450, damage: 46, range: 60, splash: 40, ...six('ally-mech-4', 280, 0.6518) },
    { price: 1800, cost: 150, hp: 520, damage: 20, rate: 0.4, range: 160, shot: 'bullet', ...six('ally-mech-5', 212, 0.908) },
    { price: 3000, cost: 200, hp: 800, damage: 80, range: 60, splash: 50, ...six('ally-mech-6', 259, 0.8398) },
  ] },
  // The guardians (`GUARDIAN`), each act's own picture; their stats are those of the troops that stood in for them.
  { id: 34, cost: 0, hp: 480, damage: 26, speed: 24, range: 42, rate: 1.5, cooldown: 0, unlock: 1, foe: true, ...foe('boss-slinger-1', 221, 0.85) },
  { id: 35, cost: 0, hp: 760, damage: 40, speed: 24, range: 180, rate: 1.4, cooldown: 0, unlock: 1, foe: true, ...foe('boss-gatling-1', 224, 0.84) },
  { id: 36, cost: 0, hp: 900, damage: 55, speed: 40, range: 130, rate: 1.4, cooldown: 0, unlock: 1, foe: true, air: true, splash: 50, steady: true, ...foe('boss-dragon-rider-1', 217, 0.92) },
  { id: 37, cost: 0, hp: 720, damage: 34, speed: 21, range: 48, rate: 1.6, cooldown: 0, unlock: 1, foe: true, splash: 40, ...foe('boss-brute-eater-1', 176, 1.07) },
  { id: 38, cost: 0, hp: 420, damage: 40, speed: 45, range: 120, rate: 1.4, cooldown: 0, unlock: 1, foe: true, splash: 50, ...foe('boss-dino-1', 199, 1.0) },
  { id: 39, cost: 0, hp: 420, damage: 40, speed: 45, range: 120, rate: 1.4, cooldown: 0, unlock: 1, foe: true, splash: 50, ...foe('boss-king-dino-1', 258, 0.87) },
];
/** The enemy's land and air troops by act, each act adding to the last (docs/siege-roster.md): early waves draw
    from the first two of the land list. No flyers in the first world: they come from the second. */
export const FOE_LAND = [[15, 16, 17], [22, 19], [23, 18], [24, 25, 20], [26, 21], [32]];
export const FOE_AIR = [[], [28], [29, 27], [30], [], [31]];
/** The enemy's troops in a battle: every earlier act's, and its own act's coming in one more each stage. */
export const foesAt = (lists: number[][], stage: number) => [...lists.slice(0, actOf(stage) - 1).flat(), ...(lists[actOf(stage) - 1] ?? []).slice(0, stageIn(stage))];
/** What recruiting each of our troops costs in gold (the swordsman is everyone's first). Bought once, kept. */
export const RECRUIT: Record<number, number> = { 0: 0, 1: 100, 2: 120, 3: 350, 4: 300, 5: 600, 6: 900, 7: 700, 8: 900, 9: 1600, 10: 250, 11: 500, 12: 900, 13: 700, 14: 2000, 33: 1200 };
/** The guardian of each act, drawn bigger: Large Slinger, Large Gatling Robot, Large Red Dragon Rider, Giant Brute
    Eater, Giant Dinosaur Brute, Giant King Dinosaur Brute. */
export const GUARDIAN = [34, 35, 36, 37, 38, 39];
/** Up to this many land and this many air troops in an army. */
export const DECK = 6;
/** An army card: a troop at one of its levels, `id + (level - 1) * 100` (so a level-1 card is the troop's id). Two forms
    of a troop can both be in the army. */
export const card = (id: number, level = 1) => id + (level - 1) * 100;
export const cardId = (c: number) => c % 100;
export const cardLevel = (c: number) => Math.floor(c / 100) + 1;
const isAir = (c: number) => !!UNITS[cardId(c)]?.air;
/** Ours: the units an army can hold. */
export const ALLIES = UNITS.filter(u => !u.foe);
/** How many levels a troop has (its forms and the first). */
export const levelsOf = (id: number) => 1 + (UNITS[id]?.forms?.length ?? 0);
/** A troop at a level: its stats and looks with that form's changes. */
export function specAt(id: number, level = 1): Spec {
  const spec = UNITS[id], form = spec.forms?.[Math.min(level, levelsOf(id)) - 2];
  if (!form) return spec;
  const { price: _price, ...changes } = form;
  return { ...spec, ...changes };
}
/** A fighter's own stats: ours at their level, the enemy's as listed. */
export const specOf = (u: { id: number; side: number; lv?: number }) => (u.side ? UNITS[u.id] : specAt(u.id, u.lv));
/** Who can hit whom: troops on the ground reach flyers only when they say so (`hitsAir`: the master swordsman, the
    wizard's meteor, the heavy armed robot's last two forms); flyers reach each other, and the ground unless they only
    fight in the sky (`skyOnly`: the aircraft fighters, the eagle and the bats). */
const hits = (a: Spec, target: number) => (isAir(target) ? !!a.air || !!a.hitsAir : !a.skyOnly);
const reaches = (u: Fighter, v: Fighter) => hits(specOf(u), v.id);
/** Can a fighter of `id` (at its first form) hit one of `target`? */
export const canHit = (id: number, target: number) => hits(UNITS[id], target);
/** Keep at most `DECK` of each kind, in order. */
export function capDeck(deck: number[]) { const land = deck.filter(id => !isAir(id)).slice(0, DECK), air = deck.filter(isAir).slice(0, DECK); return deck.filter(id => land.includes(id) || air.includes(id)); }
export interface Progress { version: 1; unlocked: number; coins: number; victories: number[]; upgrades: [number, number, number, number]; deck: number[];
  /** Each troop's level (index: its id), 1 to `levelsOf(id)`. */
  levels: number[];
  /** The troops recruited so far (the swordsman from the start). */
  owned: number[];
  /** The special powers bought (`POWERS`): each one's level, 0 when not bought. */
  powers: number[];
  /** The power forms taken into battle (at most `KIT`), as cards (`powerCard`): any form already bought, so an upgraded power
      can still bring its earlier forms. */
  kit: number[];
  /** Set once the deck holds cards (`card`), not troop ids. */
  cards: 1 }
export const freshProgress = (): Progress => ({ version: 1, unlocked: 1, coins: 0, victories: [], upgrades: [0, 0, 0, 0], deck: [0], levels: UNITS.map(() => 1), owned: [0], powers: POWERS.map(() => 0), kit: [], cards: 1 });
/** Can this card go in the army: its troop recruited and its level bought? */
export const hasCard = (p: Progress, c: number) => Number.isInteger(c) && c >= 0 && owns(p, cardId(c)) && cardLevel(c) <= (p.levels[cardId(c)] ?? 1);
/** The owner's testing switch: every troop and power open from the start and recruited and levelled for free, the base's
    upgrades free, and endless energy in battle. Set `free` to
    false to bring back the act unlocks and the gold prices. */
export const testing = { free: false };
/** Has the battles won opened this troop's act? */
export const isOpen = (p: Progress, id: number) => !!UNITS[id] && !UNITS[id].foe && (testing.free || UNITS[id].unlock <= actOf(p.unlocked));
export const owns = (p: Progress, id: number) => p.owned.includes(id);
export const troopPrice = (id: number) => (testing.free ? 0 : RECRUIT[id] ?? 0);
/** Recruits a troop with gold, into the army if there is room. */
export function buyTroop(p: Progress, id: number): boolean {
  if (owns(p, id) || !isOpen(p, id) || p.coins < troopPrice(id)) return false;
  p.coins -= troopPrice(id); p.owned.push(id);
  if (p.deck.filter(n => isAir(n) === isAir(id)).length < DECK) p.deck.push(id);
  return true;
}
const integer = (v: unknown, min: number, max: number, fallback: number) => typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v))) : fallback;
export function readProgress(raw: string | null): Progress {
  const p = freshProgress();
  try {
    const v = JSON.parse(raw || 'null');
    if (!v || v.version !== 1) return p;
    p.unlocked = integer(v.unlocked, 1, LAST, 1); p.coins = integer(v.coins, 0, 1000000, 0);
    p.victories = Array.isArray(v.victories) ? [...new Set<number>(v.victories.filter((n: unknown) => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= LAST))] : [];
    p.upgrades = [0, 1, 2, 3].map(i => integer(v.upgrades?.[i], 0, 5, 0)) as Progress['upgrades'];
    p.levels = UNITS.map(u => (u.foe ? 1 : integer(v.levels?.[u.id], 1, levelsOf(u.id), 1)));
    p.powers = POWERS.map((w, i) => integer(v.powers?.[i], 0, w.forms.length, 0));
    p.kit = Array.isArray(v.kit) ? [...new Set<number>(v.kit.filter((n: unknown): n is number => typeof n === 'number' && hasPower(p, n)))].slice(0, KIT) : [];
    p.owned = [...new Set<number>([0, ...(Array.isArray(v.owned) ? v.owned.filter((n: unknown) => typeof n === 'number' && isOpen(p, n)) : [])])];
    // An older save's deck holds troop ids, each meaning the troop at its level then.
    const deck: number[] = Array.isArray(v.deck) ? v.deck.filter((n: unknown): n is number => typeof n === 'number').map((n: number) => (v.cards === 1 ? n : owns(p, n) ? card(n, p.levels[n]) : -1)) : [];
    p.deck = capDeck([...new Set<number>(deck.filter(c => hasCard(p, c)))]);
    if (!p.deck.length) p.deck = [0];
  } catch { /* corrupt or unavailable storage starts a safe, isolated preview */ }
  return p;
}
export const upgradePrice = (level: number) => (testing.free ? 0 : 100 + level * 100);
/** A troop's next form's gold price, or 0 at its last. */
export const levelPrice = (p: Progress, id: number) => UNITS[id]?.forms?.[(p.levels[id] ?? 1) - 1]?.price ?? 0;
/** Buys a troop's next form. */
export function levelUp(p: Progress, id: number): boolean {
  const price = levelPrice(p, id);
  const pay = testing.free ? 0 : price;
  if (!price || !owns(p, id) || p.coins < pay) return false;
  p.coins -= pay; p.levels[id] = (p.levels[id] ?? 1) + 1; return true;
}
export function upgrade(p: Progress, slot: number): boolean {
  if (!Number.isInteger(slot) || slot < 0 || slot > 3) return false;
  const level = p.upgrades[slot]; const cost = upgradePrice(level);
  if (level >= 5 || p.coins < cost) return false;
  p.coins -= cost; p.upgrades[slot]++; return true;
}
export interface Fighter { uid: number; id: number; side: 0 | 1; x: number; lane: number; hp: number; maxHp: number; damage: number; attack: number; flash: number; boss: boolean; hit?: number;
  /** A breaking robot's stage (0 whole, 1 one arm and no gun, 2 a crawling wreck) and whether it is an elite (horned,
      shooting lightning). */
  stage?: number; elite?: boolean;
  /** Our troop's level (its form). */
  lv?: number;
  /** Walking this step (the view swings its stride). */
  moving?: boolean;
  /** Seconds left flying back from a heavy blow (infantry), or stunned by one (the rest). */
  knock?: number; stun?: number;
  /** How far this knock throws it (a guardian's blow throws further than `KNOCK.back`). */
  knockBack?: number;
  /** Seconds left being blown back by the corrupt wind. */
  blown?: number;
  /** An arrow's nudge: seconds left being pushed back, and until it can be nudged again. */
  nudge?: number; nudgeCd?: number;
  /** A flyer's height over the ground (`FLY`), lower while it fights a walker; a walker aiming up at a flyer. */
  alt?: number;
  /** How much bigger an enemy is drawn than its troop (it grows world by world, stage by stage). */
  grow?: number }
/** A blow taking at least this share of a troop's health knocks it: infantry fly back (`KNOCK.back` field units over
    `KNOCK.time`) and get up, the rest are stunned for `KNOCK.stun`; bosses and the steady never. */
export const KNOCK = { share: 0.2, time: 0.55, back: 70, stun: 0.35 };
export interface Effect { x: number; from: number; lane: number; life: number; max: number; kind: 'shot' | 'burst' | 'arrow' | 'rocket' | 'bolt' | 'gust' | 'loot' | 'boom' | 'fire' | 'stuck' | 'fall' | 'ground' | 'zap' | 'wave' | 'sweep'; side: 0 | 1;
  /** A `boom` (an explosion) or a `fire` (a burning pool on the ground): its size, and the height it is at. */
  size?: number; up?: number;
  /** A `boom` with black smoke (the robots' rockets) instead of grey (our crossbow's). */
  dark?: boolean;
  /** A fallen enemy's bounty, shown rising where it fell. */
  gold?: number; mana?: number;
  /** A shot's own projectile picture (`Spec.shot`) and whether it spins. */
  art?: string; spin?: boolean;
  /** A shot from a flyer, or at one: the height (`Fighter.alt`) it leaves from, or flies to, instead of the ground's. */
  fromUp?: number; toUp?: number }
export interface Siege {
  world: number; phase: 'fight' | 'won' | 'lost'; time: number; energy: number; generator: number; cooldowns: Record<number, number>;
  hp: [number, number]; maxHp: [number, number]; units: Fighter[]; effects: Effect[]; nextId: number; nextWave: number; waves: number; kills: number;
  spell: number; rocket: number; aim: number; bow: Bow;
  /** The special powers taken into this battle (`POWERS`, at the level bought), their recharges, the blows each has
      scheduled to land (`Hit`), and the stretch of field on screen (set by the view) that they cover. */
  kit: { id: number; level: number; card: number }[]; kitCd: Record<number, number>; hitq: Hit[]; view: { x: number; width: number }; casts: number;
  /** The troops' sounds since the view last took them (attacks and deaths, where they happened); kept short. */
  sounds?: { k: string; x: number }[];
  /** How many times the bow has shot this battle (the view plays a sound for each new one). */
  /** Our crossbow's tip as the view draws it (x, and height over the ground): the arrows' path starts there. */
  bowFrom?: { x: number; up: number };
  shots?: number; bossSpawned: boolean; paid: boolean; power: number; economy: number; deck: number[];
  /** The workshop's fortress level (0-5): it picks how our fortress looks. */
  fort: number;
  /** Our troops' levels, from the save. */
  levels: number[];
  /** The gold the enemies dropped this battle: kept whether it is won or lost. */
  loot?: number;
  /** The corrupt wind has blown this battle. */
  gusted?: boolean;
}
/** The gold an enemy drops when it falls: by its toughness, double for a horned one, a guardian far more. */
export const dropOf = (u: Fighter) => (u.boss ? 120 : Math.max(3, Math.round((UNITS[u.id].hp / 30) ** 1.3 / 2.2)) * (u.elite ? 2 : 1));
/** The energy an enemy gives as it falls: a little for the weak, a lot for the strong. */
export const manaOf = (u: Fighter) => (u.boss ? 80 : Math.max(2, Math.round(UNITS[u.id].hp / 25)) * (u.elite ? 2 : 1));
/** The corrupt wind: once the enemy fortress is down to `at` of its health, a gust from it blows our troops back
    (`back` field units a second for `time` seconds) and the enemy pours out a horde that grows world by world: `weak` of
    its first troops plus one a world, and one of its toughest every `strongEvery` worlds. */
export const GUST = { at: 0.5, back: 330, time: 0.7, weak: 3, strongEvery: 3 };
export const hordeOf = (stage: number) => ({ weak: GUST.weak + actOf(stage), strong: Math.ceil(actOf(stage) / GUST.strongEvery) });
/** How much bigger the enemy grows: 0 on the first battle, `GROW` at the last. */
export const GROW = 0.3;
const growAt = (stage: number) => 1 + GROW * (Math.min(LAST, Math.max(1, stage)) - 1) / (LAST - 1);
/** Which of the four pictures a workshop level (0-5) shows, for our fortress and its crossbow: 0-1, 2-3, 4, 5. */
export const looksTier = (level: number) => (level >= 5 ? 4 : level >= 4 ? 3 : level >= 2 ? 2 : 1);
/** Which of the five castle pictures a workshop level (0-5) shows for our fortress. */
export const castleTier = (level: number) => Math.max(1, Math.min(5, level));
/** Which of the enemy fortress's five pictures a battle shows, by its act (six acts: 1, 2, 3, 4, 4, 5). */
export const enemyTier = (stage: number) => [1, 2, 3, 4, 4, 5][Math.min(ACTS, Math.max(1, actOf(stage))) - 1];

export const energyMax = (s: Siege) => 180 + s.generator * 70;
export const energyRate = (s: Siege) => 7 + s.generator * 2.5 + s.economy;
export const generatorPrice = (s: Siege) => 65 + s.generator * 45;
export function newSiege(p: Progress, world: number): Siege {
  world = integer(world, 1, Math.min(LAST, p.unlocked), 1);
  const maxHp: [number, number] = [1700 + p.upgrades[1] * 200, 1700 + hard(world) * 150];
  return { world, phase: 'fight', time: 0, energy: 80, generator: 0, cooldowns: {}, hp: [...maxHp], maxHp, units: [], effects: [], nextId: 1, nextWave: 7, waves: 0, kills: 0, spell: 0, rocket: 0, aim: 700, bossSpawned: false, paid: false, power: 1 + p.upgrades[0] * 0.08, economy: p.upgrades[2] * 0.6, deck: [...p.deck], bow: { quiver: BOW.max, drawing: false, held: 0, next: 0, level: p.upgrades[3] }, fort: p.upgrades[1], levels: [...(p.levels ?? [])], kit: p.kit.filter(c => hasPower(p, c)).map(c => ({ id: c % 100, level: Math.floor(c / 100) + 1, card: c })), kitCd: {}, hitq: [], view: { x: 0, width: 650 }, casts: 0 };
}
/** The guardian, Cartoon Wars 2-style: it only comes out once the enemy fortress falls, far tougher than a troop, and
    the battle is won when it falls too. */
/** The guardians: much tougher than the troop they are drawn from, harder hitting, every blow landing on an area
    (`area` field units round its target) and throwing our troops back far (`knock`); and as one comes out, a gust from
    the fallen fortress blows our army back (`gust` seconds). */
export const BOSS = { hp: 4.2, damage: 1.7, area: 95, knock: 150, gust: 0.9 };
const BOSS_HP = BOSS.hp;
/** From how many seconds into the battle the enemy's flyers come. */
const airFrom = (stage: number) => Math.max(40, 110 - hard(stage) * 8);
/** The Forge's heavy robots, ours and theirs, break twice before they are gone: each wreck keeps this share of the
    last one's health and damage, and is drawn smaller and darker. */
export const SPLIT = { hp: 0.45, damage: 0.45 };
const splitsOf = (u: Fighter) => (u.boss ? 0 : UNITS[u.id].splits ?? 0);
/** Elite ranged enemies, Cartoon Wars 2's horned shooters: from this time on, about one gunner in four, tougher and
    hitting harder, its shots lightning. */
export const ELITE = { from: 60, every: 4, hp: 1.6, damage: 1.8 };
/** The enemy troop that comes horned: the gunner. */
export const ELITE_ID = 22;
function spawn(s: Siege, id: number, side: 0 | 1, boss = false, level?: number) {
  if (s.units.filter(u => u.side === side).length >= CAP) return;
  const lv = side ? undefined : level ?? s.levels[id] ?? 1;
  const spec = side ? UNITS[id] : specAt(id, lv); const scale = side ? 0.95 + hard(s.world) * 0.03 : s.power;
  const hp = spec.hp * scale * (boss ? BOSS_HP : 1);
  // One gunner in every few (counted by its spawn number) comes horned.
  const elite = !!side && !boss && id === ELITE_ID && s.time >= ELITE.from && s.nextId % ELITE.every === 0;
  const life = hp * (elite ? ELITE.hp : 1);
  s.units.push({ uid: s.nextId++, id, side, x: side ? FIELD - 120 : 120, lane: s.nextId % 3, hp: life, maxHp: life, damage: spec.damage * scale * (elite ? ELITE.damage : 1) * (boss ? BOSS.damage : 1), attack: 0, flash: 0, boss, elite: elite || undefined, lv, grow: side ? growAt(s.world) : undefined });
}
/** What a troop's attack sounds like (its weapon) and its death (its body), by id; an array is per level. Projectile
    troops sound like what they fire (`SHOT_SOUND`). Names are the audio engine's `SiegeSound`s. */
const ATTACK_SOUND: Record<number, string | string[]> = {
  0: ['blunt', 'blade', 'blade', 'blade', 'blade'], 1: 'pierce', 3: ['blade', 'blunt', 'blunt', 'blunt'], 4: ['gun', 'rifle', 'uzi', 'sniper'],
  7: 'claw', 8: ['rocket', 'gatling', 'rocket'], 9: ['gatling', 'gatling', 'gatling', 'gatling'], 10: 'blade', 11: ['rifle', 'sniper', 'ray', 'thunder'], 12: 'rocket', 13: 'drill', 14: ['blade', 'magic', 'magic'], 33: ['blunt', 'ray', 'ray', 'blunt', 'gatling', 'blunt'],
  15: 'blade', 16: 'pierce', 17: 'bite', 18: 'claw', 19: 'blade', 20: 'blunt', 21: 'blade', 22: 'rifle', 23: 'throw', 24: 'magic',
  25: 'claw', 26: 'breath', 27: 'blade', 28: 'claw', 29: 'claw', 30: 'magic', 31: 'blade', 32: 'gatling',
  34: 'throw', 35: 'gatling', 36: 'breath', 37: 'blunt', 38: 'bite', 39: 'bite',
};
const SHOT_SOUND: Record<string, string> = { 'crescent-gold': 'wind', rock: 'throw', javelin: 'throw', shuriken: 'throw', arrow: 'bow', rocket: 'rocket', rockets: 'rocket', salvo: 'rocket', ray: 'ray', 'ray-blue': 'ray', 'ray-gold': 'ray', 'ray-pink': 'thunder', plasma: 'ray', ice: 'ray', crescent: 'magic', none: 'flame', lightning: 'thunder', tornado: 'wind', meteor: 'meteor' };
/** Bullets (`bullet`, `bullet-rifle|uzi|sniper`) sound like the gun that fires them; beams (`ray`, `ray-blue|gold|pink`) reach at once. */
export const isBullet = (shot?: string) => !!shot?.startsWith('bullet');
export const isBeam = (shot?: string) => !!shot?.startsWith('ray');
const DEATH_SOUND: Record<number, string | string[]> = {
  1: ['die-man', 'die-man', 'die-man', 'die-man', 'die-horse'], 3: 'die-armor', 7: 'die-beast', 8: 'die-bot', 9: 'die-bot',
  10: 'die-flyer', 11: 'die-flyer', 12: 'die-flyer', 13: 'die-bot', 14: 'die-flyer', 33: 'die-bot',
  17: 'die-beast', 18: 'die-brute', 20: 'die-armor', 21: 'die-armor', 25: 'die-beast', 26: 'die-dragon', 27: 'die-flyer', 28: 'die-flyer',
  29: 'die-flyer', 30: 'die-flyer', 31: 'die-dragon', 32: 'die-bot',
  34: 'die-brute', 35: 'die-bot', 36: 'die-dragon', 37: 'die-brute', 38: 'die-dragon', 39: 'die-dragon',
};
const pickLevel = (v: string | string[] | undefined, lv: number) => (Array.isArray(v) ? v[Math.min(lv, v.length) - 1] : v);
/** A fighter's attack and death sounds. */
export function soundsOf(u: Fighter): [string, string] {
  const lv = u.side ? 1 : u.lv ?? 1, a = specOf(u);
  const attack = (a.shot && !isBullet(a.shot) && SHOT_SOUND[a.shot]) || pickLevel(ATTACK_SOUND[u.id], lv) || 'blade';
  return [attack, pickLevel(DEATH_SOUND[u.id], lv) ?? 'die-man'];
}
function hear(s: Siege, k: string, x: number) { const q = (s.sounds ??= []); q.push({ k, x }); if (q.length > 24) q.shift(); }
/** What summoning a troop costs now (its level's energy). */
export const costOf = (_s: Siege, c: number) => specAt(cardId(c), cardLevel(c)).cost;
export function canSummon(s: Siege, c: number): boolean {
  return s.phase === 'fight' && !!UNITS[cardId(c)] && !UNITS[cardId(c)].foe && s.deck.includes(c) && s.energy >= costOf(s, c) && (s.cooldowns[c] ?? 0) <= 0 && s.units.filter(u => !u.side).length < CAP;
}
/** Sends a card's troop at its level; each card has its own cooldown. */
export function summon(s: Siege, c: number): boolean {
  if (!canSummon(s, c)) return false;
  s.energy -= costOf(s, c); s.cooldowns[c] = UNITS[cardId(c)].cooldown; spawn(s, cardId(c), 0, false, cardLevel(c)); return true;
}
export function improveGenerator(s: Siege): boolean {
  if (s.phase !== 'fight' || s.generator >= 4 || s.energy < generatorPrice(s)) return false;
  s.energy -= generatorPrice(s); s.generator++; return true;
}
function damageArea(s: Siege, x: number, radius: number, damage: number, life = 0.45) {
  for (const u of s.units) if (u.side === 1 && Math.abs(u.x - x) <= radius) { u.hp -= damage; u.flash = 0.18; }
  s.effects.push({ x, from: 80, lane: 1, life, max: life, kind: 'burst', side: 0 });
}
/** Our fortress's bow, Cartoon Wars-style: one tap sets the archers shooting, arrows one after another at the aim (the
    left slider), faster and more at a time the longer they keep on; another tap stops them, and so does an empty quiver.
    The quiver fills again only while they are not shooting. The workshop's bow upgrade shoots more often and more arrows. */
/** Our crossbow: a steady volley while it shoots (always the same speed and count), each volley taking `cost` from the
    quiver. Only the shop's Bow level changes it: its look (`looksTier`), how many arrows (or rockets) a volley has and
    how often it fires. */
/** Our arrows' nudge: `back` field units a second for `time` seconds, at most once every `every` seconds. */
export const NUDGE = { back: 85, time: 0.14, every: 0.8 };
/** How high flyers fly (field units over the ground): cruising, and swooping down on a walker they fight (lower still
    for one that strikes in close), changing height at `rate` a second. */
/** How long a rocket's explosion and a meteor's fire on the ground last (seconds). */
export const BOOM = 0.8, FIRE = 2.4;
/** How long a crossbow arrow stays stuck in the ground after it lands (seconds), fading in its last part. */
export const STUCK = 2.5;
/** How far an arrow strays from the aim: up to `along` field units either way, and up to two steps of `deep` up or
    down the ground (nearer or further). */
export const SCATTER = { along: 14, deep: 4 };
/** Where the wizard's three meteors land round the target: field units along the ground, and up it (back) or down
    (front): two at the back, one in front between them. */
export const METEORS = [[-30, 10], [32, 10], [2, -10]];
export const FLY = { high: 70, ranged: 45, close: 22, rate: 90 };
export const BOW = { max: 100, cost: 1.2, regen: 12, every: 0.42, step: 0.03, damage: 16, gap: 24, friendly: 0.35 };
export interface Bow { quiver: number; drawing: boolean; held: number; next: number; level: number }
export const aimAt = (x: number) => Math.max(140, Math.min(1080, x));
/** Seconds between shots and arrows per shot, for the bow's level and how long it has been held. */
export const bowEvery = (b: Bow) => BOW.every - b.level * BOW.step;
export const bowCount = (b: Bow) => looksTier(b.level);
/** Our crossbow's shots: one launch speed and gravity (field units, seconds). */
const SHOT = { v: 1900, g: 900 };
/** The screen angle (y down) to hit a spot `dx` ahead and `dy` below at `SHOT`'s speed: the flatter solution; out of
    reach, 45° up. */
export function launchAngle(dx: number, dy: number) {
  const { v, g } = SHOT, x = Math.max(1, dx), up = -dy, d = v ** 4 - g * (g * x * x + 2 * up * v * v);
  return d < 0 ? -Math.PI / 4 : -Math.atan((v * v - Math.sqrt(d)) / (g * x));
}
/** From this aim on, shots rise more and more, until at the furthest they climb steeply and fall from the sky. */
const LOB = { from: 650, to: 1080, steepest: -1.0 };
/** A shot's launch angle and speed to land `dx` ahead and `dy` below: a hard, nearly straight shot (`SHOT.v`, the
    flatter solution) up to `LOB.from`; past it the angle climbs towards `LOB.steepest` and the speed is the one that
    still lands it there. */
export function shotFor(dx: number, dy: number, aim: number) {
  const flat = launchAngle(dx, dy), k = Math.max(0, Math.min(1, (aim - LOB.from) / (LOB.to - LOB.from)));
  const a = k > 0 ? Math.min(flat, flat + (LOB.steepest - flat) * k * k) : flat;
  if (a === flat) return { a, v: SHOT.v };
  const x = Math.max(1, dx), c = Math.cos(a), drop = dy - x * Math.tan(a);
  return { a, v: drop > 0 ? Math.sqrt(SHOT.g * x * x / (2 * c * c * drop)) : SHOT.v };
}
/** A shot's flight from `from` to the spot `to`: the launch angle for it, and the point at a share `p` of the way (by
    time), under gravity, so it leaves along that angle and lands on the spot. */
export function flight(from: { x: number; y: number }, to: { x: number; y: number }) {
  const { a, v } = shotFor(to.x - from.x, to.y - from.y, to.x), vx = v * Math.cos(a), vy = v * Math.sin(a);
  const T = Math.max(0.05, (to.x - from.x) / Math.max(1, vx));
  return (p: number) => { const t = p * T; return { x: from.x + vx * t, y: from.y + vy * t + SHOT.g * t * t / 2 }; };
}
/** The height (over the ground) a flyer is drawn at, its feet: its flying height and its lane's step. */
const flyerFoot = (u: Fighter) => (u.alt ?? FLY.high) + u.lane * 8;
/** Where our crossbow's tip is when the battle has not been drawn yet (tests, simulations). */
const BOW_FROM = { x: 150, up: 140 };
function arrows(s: Siege, count: number) {
  const x = aimAt(s.aim), from = s.bowFrom ?? BOW_FROM;
  for (let i = 0; i < count; i++) {
    // Each arrow strays a little from the aim, along the field and in depth (`SCATTER`; a fixed pattern by volley, so a
    // battle replays the same), so a volley lands spread out instead of in one line.
    const k = (s.shots ?? 0) * 7 + i * 5, stray = ((k * 37) % 11 - 5) / 5, deep = ((k * 53) % 5) - 2;
    const at = x + (i - (count - 1) / 2) * BOW.gap + stray * SCATTER.along;
    // What it lands on, and the flyers its path crosses on the way (a flyer is a box from its feet up its height).
    const path = flight({ x: from.x, y: -from.up }, { x: at, y: -2 });
    const span = Math.max(1, at - from.x);
    const crossed = (u: Fighter) => {
      if (!UNITS[u.id].air || u.x < from.x || u.x > at + 28) return false;
      const spec = UNITS[u.id], h = spec.size * (u.boss ? 1.6 : 1) * (u.grow ?? 1), foot = flyerFoot(u);
      // The path's heights across its body (a third of its height either side of its middle).
      const ys = [-h / 3, 0, h / 3].map(d => -path(Math.max(0, Math.min(1, (u.x + d - from.x) / span))).y);
      return Math.max(...ys) >= foot - 6 && Math.min(...ys) <= foot + h;
    };
    // It strikes whoever is there, ours too: aim past your own troops.
    for (const u of s.units) if (u.hp > 0 && (Math.abs(u.x - at) <= 28 && !(u.side === 0 && UNITS[u.id].air) || crossed(u))) {
      u.hp -= BOW.damage * (u.side ? s.power : BOW.friendly); u.flash = 0.18;
      if (u.side === 0) continue;
      // A hit nudges it back a little (not the guardians or the steady), at most once every `NUDGE.every`, so it still
      // makes its way forward.
      if (!u.boss && !UNITS[u.id].steady && !(u.nudgeCd! > 0)) { u.nudge = NUDGE.time; u.nudgeCd = NUDGE.every; }
    }
    // Far shots are lobbed (the view draws them climbing and falling from the sky): they stay longer in the air.
    const air = 0.5 + 0.45 * Math.max(0, Math.min(1, (x - 650) / 430));
    s.effects.push({ x: at, from: 80, lane: 1, life: air, max: air, kind: 'arrow', side: 0, up: deep * SCATTER.deep });
    // An arrow stays stuck in the ground where it lands, fading after a moment (rockets blow up instead).
    if (looksTier(s.bow.level) < 4) s.effects.push({ x: at, from: 80, lane: 1, life: air + STUCK, max: STUCK, kind: 'stuck', side: 0, up: deep * SCATTER.deep });
    // The rocket launcher's rockets blow up where they land (`life` past `max`: it waits for the rocket to get there).
    if (looksTier(s.bow.level) === 4) s.effects.push({ x: at, from: at, lane: 1, life: air + BOOM + i * 0.08, max: BOOM, kind: 'boom', side: 0, size: 58 + (i % 2) * 22, up: (i % 2) * 8 });
  }
}
/** What a fighter's attack shows flying to `x` (a troop, or the enemy fortress): its own projectile, the wizard's three
    meteors with their fire, and a blast where a rocket of the robots' last forms lands. Damage is dealt apart. */
function launch(s: Siege, u: Fighter, a: Spec, x0: number, lane: number, toUp: number) {
  // A thrown or shot projectile of its own flies a little longer, so it is seen on its way.
  const flight = isBullet(a.shot) || isBeam(a.shot) ? 0.16 : SPELLS.includes(a.shot ?? '') ? 0.6 : a.shot ? 0.35 : 0.2;
  if (a.shot === 'meteor') {
    // The wizard's last form calls three meteors around the target, one after another, each leaving fire.
    for (let k = 0; k < 3; k++) {
      // Spread over the ground: two at the back, one in front between them.
      const [dx, dy] = METEORS[k], x = x0 + dx, wait = k * 0.14;
      s.effects.push({ x, from: u.x, lane: lane, life: flight + wait, max: flight, kind: 'shot', side: u.side, art: 'meteor', up: dy });
      s.effects.push({ x, from: x, lane: lane, life: flight + wait + FIRE, max: FIRE, kind: 'fire', side: u.side, size: 60, up: dy });
    }
  } else s.effects.push({ x: x0, from: u.x, lane: lane, life: flight, max: flight, kind: u.elite ? 'bolt' : 'shot', side: u.side, art: a.shot, spin: a.spin, fromUp: a.air ? u.alt ?? FLY.high : 0, toUp });
  if (a.blast) s.effects.push({ x: x0, from: x0, lane: lane, life: flight + BOOM, max: BOOM, kind: 'boom', side: u.side, size: a.shot === 'salvo' ? 90 : 70, up: toUp, dark: true });
}
/** Start (true) or stop (false) the archers; they only start with at least one shot in the quiver. */
export function draw(s: Siege, on: boolean) { if (s.phase === 'fight') s.bow.drawing = on && s.bow.quiver >= BOW.cost; }
/** The bow button: one tap starts the arrows, the next stops them. */
export const toggleBow = (s: Siege) => draw(s, !s.bow.drawing);
function bow(s: Siege, dt: number) {
  const b = s.bow;
  if (b.drawing) {
    b.held += dt; b.next -= dt;
    if (b.next <= 0) { arrows(s, bowCount(b)); s.shots = (s.shots ?? 0) + 1; b.quiver -= BOW.cost; b.next = bowEvery(b); }
    if (b.quiver < BOW.cost) b.drawing = false;
    if (b.drawing) return;
  }
  b.held = 0; b.next = 0;
  b.quiver = Math.min(BOW.max, b.quiver + BOW.regen * dt);
}
/** The missile: one heavy blast at the aim, a shorter recharge than the discharge. */
export const ROCKET = { radius: 70, damage: 150, every: 12 };
/** The discharge's recharge (seconds). */
export const STRIKE_EVERY = 24;
export function missile(s: Siege): boolean {
  if (s.phase !== 'fight' || s.rocket > 0) return false;
  const x = aimAt(s.aim);
  s.effects.push({ x, from: 80, lane: 1, life: 0.55, max: 0.55, kind: 'rocket', side: 0 });
  damageArea(s, x, ROCKET.radius, ROCKET.damage * s.power); s.rocket = ROCKET.every;
  // The blast shows as the missile lands: its effect waits out the flight (drawn only once its life is under `max`).
  s.effects[s.effects.length - 1].life += 0.55; return true;
}
export function strike(s: Siege): boolean {
  if (s.phase !== 'fight' || s.spell > 0) return false;
  damageArea(s, s.aim, 155, 210 * s.power, 0.7); s.spell = STRIKE_EVERY; return true;
}
/** The special powers (the shop's Especial tab): bought with gold, each covers the stretch of field on screen. Level 1
    is `price` gold, each later form its own `price`; `unlock` is the act that opens it. `damage` is per blow. */
export interface PowerForm { price: number; damage: number; art?: string; freeze?: number; radius?: number; count?: number; push?: number }
export const POWERS: { id: number; unlock: number; price: number; cooldown: number; forms: PowerForm[] }[] = [
  // Arrow rain: arrows, ice arrows (they freeze), fire arrows (they leave flames), rockets (they explode).
  { id: 0, unlock: 1, price: 400, cooldown: 30, forms: [{ price: 0, damage: 24, art: 'arrow' }, { price: 500, damage: 28, art: 'ice', freeze: 1.3 }, { price: 900, damage: 34, art: 'fire' }, { price: 1500, damage: 46, art: 'rocket', radius: 52 }] },
  // Lightning rain: bolts across the field, the later forms more of them and stunning.
  { id: 1, unlock: 2, price: 600, cooldown: 34, forms: [{ price: 0, damage: 60, count: 12 }, { price: 800, damage: 66, count: 18, freeze: 0.8 }, { price: 1400, damage: 76, count: 26, freeze: 1.3 }] },
  // Tsunami: a wall of water sweeping the field, throwing the enemy back.
  { id: 2, unlock: 3, price: 900, cooldown: 42, forms: [{ price: 0, damage: 90, push: 240 }, { price: 1100, damage: 140, push: 360 }, { price: 1900, damage: 210, push: 520, freeze: 1.2 }] },
  // Meteor shower: burning rocks across the field, each leaving a fire.
  { id: 3, unlock: 4, price: 1200, cooldown: 40, forms: [{ price: 0, damage: 95, count: 6, radius: 62 }, { price: 1500, damage: 115, count: 9, radius: 66 }, { price: 2400, damage: 135, count: 13, radius: 70 }] },
];
/** At most this many power forms go into a battle. */
export const KIT = 4;
/** A blow a power has scheduled to land at `at` (battle time) on the enemies within `r` of `x`; `seen` makes a sweeping
    one (the wave) strike each enemy only once. */
export interface Hit { at: number; x: number; r: number; damage: number; freeze?: number; push?: number; seen?: Set<number> }
const powerOpen = (p: Progress, id: number) => testing.free || POWERS[id].unlock <= actOf(p.unlocked);
/** What a power's level costs in gold (level 1 is the power itself). */
export const powerCost = (id: number, level: number) => (testing.free ? 0 : level <= 1 ? POWERS[id].price : POWERS[id].forms[level - 1]?.price ?? 0);
export const isPowerOpen = (p: Progress, id: number) => !!POWERS[id] && powerOpen(p, id);
/** A power form as a kit card: `id + (level - 1) * 100`, like a troop's. */
export const powerCard = (id: number, level = 1) => id + (level - 1) * 100;
/** Is this card a form of a power that has been bought (that level or beyond)? */
export const hasPower = (p: Progress, c: number) => Number.isInteger(c) && c >= 0 && !!POWERS[c % 100] && Math.floor(c / 100) + 1 <= (p.powers[c % 100] ?? 0);
/** Buys a power's first level or its next form; a new form goes into the kit if there is room. */
export function buyPower(p: Progress, id: number): boolean {
  const w = POWERS[id]; if (!w) return false;
  const level = p.powers[id] ?? 0, cost = powerCost(id, level + 1);
  if (level >= w.forms.length || !powerOpen(p, id) || p.coins < cost) return false;
  p.coins -= cost; p.powers[id] = level + 1;
  if (p.kit.length < KIT) p.kit.push(powerCard(id, level + 1));
  return true;
}
/** Takes a form that has been bought into the kit, or out of it; false when the kit is full or the form is not bought. */
export function toggleKit(p: Progress, id: number, level = p.powers[id] ?? 1): boolean {
  const c = powerCard(id, level);
  if (p.kit.includes(c)) { p.kit = p.kit.filter(n => n !== c); return true; }
  if (!hasPower(p, c) || p.kit.length >= KIT) return false;
  p.kit.push(c); return true;
}
/** A fixed pseudo-random 0..1 for a number (so a battle replays the same). */
const rnd = (n: number) => { const x = Math.sin(n * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };
/** A scheduled blow lands: it hurts (and freezes or throws back) each enemy it reaches, flyers too. */
function land(s: Siege, h: Hit) {
  for (const u of s.units) {
    if (u.side !== 1 || u.hp <= 0 || Math.abs(u.x - h.x) > h.r || h.seen?.has(u.uid)) continue;
    h.seen?.add(u.uid); u.hp -= h.damage * s.power; u.flash = 0.18;
    if (!u.boss && h.freeze) u.stun = Math.max(u.stun ?? 0, h.freeze);
    if (!u.boss && h.push && !UNITS[u.id].steady) { u.knock = KNOCK.time; u.knockBack = h.push; }
  }
}
/** Sets off a power from the kit: its blows spread over the stretch of field on screen. */
export function castPower(s: Siege, card: number): boolean {
  const k = s.kit.find(n => n.card === card), id = k?.id ?? -1, w = POWERS[id];
  if (!k || !w || s.phase !== 'fight' || (s.kitCd[card] ?? 0) > 0) return false;
  const form = w.forms[Math.min(k.level, w.forms.length) - 1], c = ++s.casts;
  let x0 = Math.max(110, s.view.x + 20), x1 = Math.min(FIELD - 90, s.view.x + s.view.width - 20);
  if (x1 - x0 < 160) { x0 = 110; x1 = FIELD - 90; }
  const span = x1 - x0, push = (e: Effect) => s.effects.push(e), foes = s.units.filter(u => u.side === 1 && u.x >= x0 && u.x <= x1);
  if (id === 0) {
    const n = Math.max(8, Math.round(span / 22)), fall = 0.55, r = form.radius ?? 32;
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.5) * span / n + (rnd(i * 3 + c) - 0.5) * 18, delay = rnd(i * 7 + c * 5) * 1.7, deep = Math.floor(rnd(i + c * 11) * 3) - 1, up = deep * 8, at = delay + fall;
      push({ x, from: x, lane: 1, life: at, max: fall, kind: 'fall', side: 0, art: form.art, up });
      s.hitq.push({ at: s.time + at, x, r, damage: form.damage, freeze: form.freeze });
      if (form.art === 'rocket') push({ x, from: x, lane: 1, life: at + BOOM, max: BOOM, kind: 'boom', side: 0, size: 54, up });
      else if (form.art === 'fire') push({ x, from: x, lane: 1, life: at + 1.4, max: 1.4, kind: 'fire', side: 0, size: 46, up });
      else if (form.art === 'ice') push({ x, from: x, lane: 1, life: at + 0.9, max: 0.9, kind: 'ground', side: 0, art: 'ice', up });
      else push({ x, from: x, lane: 1, life: at + 2.4, max: 2.4, kind: 'ground', side: 0, art: 'arrow', up });
    }
  } else if (id === 1) {
    const n = form.count ?? 9;
    for (let i = 0; i < n; i++) {
      // Half the bolts go for the enemies on screen, the rest are spread over the field.
      const x = foes.length && i % 2 ? foes[(i >> 1) % foes.length].x : x0 + (i + 0.5) * span / n + (rnd(i * 3 + c) - 0.5) * 24, delay = rnd(i * 5 + c * 3) * 1.4;
      push({ x, from: x, lane: 1, life: delay + 0.65, max: 0.65, kind: 'zap', side: 0, up: (i % 3 - 1) * 8 });
      s.hitq.push({ at: s.time + delay, x, r: 44, damage: form.damage, freeze: form.freeze });
      push({ x, from: x, lane: 1, life: delay + 0.8, max: 0.8, kind: 'ground', side: 0, art: 'volt', up: (i % 3 - 1) * 8 });
      hear(s, 'thunder', x);
    }
  } else if (id === 2) {
    // The wave runs from the left of the screen to the right in two seconds; each enemy is struck as the front reaches it.
    const dur = 2, seen = new Set<number>();
    push({ x: x1, from: x0 - 40, lane: 1, life: dur, max: dur, kind: 'wave', side: 0, art: String(k.level) });
    for (let x = x0; x <= x1 + 40; x += 45) s.hitq.push({ at: s.time + (x - x0) / span * dur * 0.8, x, r: 62, damage: form.damage, freeze: form.freeze, push: form.push, seen });
  } else if (id === 3) {
    const n = form.count ?? 6, flight = 0.6, r = form.radius ?? 62;
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.5) * span / n + (rnd(i * 3 + c) - 0.5) * 30, wait = rnd(i * 5 + c * 7) * 1.2, up = (i % 3 - 1) * 10;
      push({ x, from: x, lane: 1, life: flight + wait, max: flight, kind: 'shot', side: 0, art: 'meteor', up });
      push({ x, from: x, lane: 1, life: flight + wait + FIRE, max: FIRE, kind: 'fire', side: 0, size: 60, up });
      push({ x, from: x, lane: 1, life: flight + wait + BOOM, max: BOOM, kind: 'boom', side: 0, size: 64, up });
      s.hitq.push({ at: s.time + wait + flight, x, r, damage: form.damage });
    }
    hear(s, 'meteor', (x0 + x1) / 2);
  }
  s.kitCd[card] = w.cooldown; return true;
}
/** Fixed-step caller. Accumulate damage before removal so opposing lethal hits resolve fairly. */
export function tick(s: Siege, dt: number) {
  if (s.phase !== 'fight' || !Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, 0.1); s.time += dt;
  s.energy = testing.free ? energyMax(s) : Math.min(energyMax(s), s.energy + energyRate(s) * dt);
  s.spell = Math.max(0, s.spell - dt); s.rocket = Math.max(0, s.rocket - dt);
  for (const k in s.kitCd) s.kitCd[k] = Math.max(0, s.kitCd[k] - dt);
  if (s.hitq.length) { const due = s.hitq.filter(h => h.at <= s.time); if (due.length) { s.hitq = s.hitq.filter(h => h.at > s.time); for (const h of due) land(s, h); } }
  for (const k in s.cooldowns) s.cooldowns[k] = Math.max(0, s.cooldowns[k] - dt);
  bow(s, dt);
  s.effects = s.effects.filter(e => (e.life -= dt) > 0);
  s.nextWave -= dt;
  if (s.nextWave <= 0) {
    s.waves++; s.nextWave = Math.max(4.5, 9 - hard(s.world) * 0.3 - s.time / 90);
    const count = Math.min(3, 1 + Math.floor(s.time / 70));
    const land = foesAt(FOE_LAND, s.world), flyers = foesAt(FOE_AIR, s.world);
    // Early waves only the first two land troops; later the whole list, the newest (toughest) more often.
    const pick = s.time < 25 ? land.slice(0, 2) : [...land, ...land.slice(-2)];
    for (let i = 0; i < count; i++) {
      const flyer = flyers.length > 0 && s.time >= airFrom(s.world) && (s.waves + i) % 3 === 2;
      spawn(s, flyer ? flyers[(s.waves + i) % flyers.length] : pick[(s.waves * 3 + i) % pick.length], 1);
    }
  }
  // The corrupt wind, once a battle, when the enemy fortress is down to half.
  if (!s.gusted && s.hp[1] > 0 && s.hp[1] <= s.maxHp[1] * GUST.at) {
    s.gusted = true;
    for (const u of s.units) if (!u.side) { u.blown = GUST.time; u.knock = 0; u.stun = 0; }
    s.effects.push({ x: FIELD - 120, from: FIELD - 120, lane: 1, life: 1.2, max: 1.2, kind: 'gust', side: 1 });
    hear(s, 'corrupt-wind', FIELD - 300);
    const land = foesAt(FOE_LAND, s.world), tough = [...land].sort((a, b) => UNITS[b].hp - UNITS[a].hp);
    const horde = hordeOf(s.world);
    for (let i = 0; i < horde.weak; i++) { spawn(s, land[i % Math.min(2, land.length)], 1); const u = s.units[s.units.length - 1]; if (u?.side) u.x -= i * 18; }
    for (let i = 0; i < horde.strong; i++) spawn(s, tough[i % tough.length], 1);
  }
  if (!s.bossSpawned && s.hp[1] <= 0 && guarded(s.world)) {
    s.bossSpawned = true; spawn(s, GUARDIAN[actOf(s.world) - 1], 1, true);
    // Its arrival: a gust from the ruins blows our army back.
    for (const u of s.units) if (!u.side) { u.blown = BOSS.gust; u.knock = 0; u.stun = 0; }
    s.effects.push({ x: FIELD - 120, from: FIELD - 120, lane: 1, life: 1.2, max: 1.2, kind: 'gust', side: 1 });
    hear(s, 'corrupt-wind', FIELD - 300);
  }
  const alive = s.units.filter(u => u.hp > 0);
  const hits: { target: Fighter; damage: number; boss?: boolean; push?: number }[] = [];
  for (const u of alive) {
    const a = specOf(u); u.attack -= dt; u.flash = Math.max(0, u.flash - dt); u.hit = Math.max(0, (u.hit ?? 0) - dt);
    u.moving = false;
    if (u.nudgeCd) u.nudgeCd = Math.max(0, u.nudgeCd - dt);
    if (u.nudge) { u.nudge = Math.max(0, u.nudge - dt); u.x = Math.min(FIELD - 110, u.x + NUDGE.back * dt); continue; }
    if (u.blown) { u.blown = Math.max(0, u.blown - dt); u.x = Math.max(110, u.x - GUST.back * dt); continue; }
    if (u.knock) { u.knock = Math.max(0, u.knock - dt); u.x = Math.max(110, Math.min(FIELD - 110, u.x + (u.side ? 1 : -1) * (u.knockBack ?? KNOCK.back) / KNOCK.time * dt)); continue; }
    if (u.stun) { u.stun = Math.max(0, u.stun - dt); continue; }
    const enemy = alive.filter(v => v.side !== u.side && reaches(u, v)).sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
    const baseX = u.side ? 80 : FIELD - 80;
    const distance = enemy ? Math.abs(enemy.x - u.x) : Infinity;
    const near = !!enemy && distance <= a.range + UNITS[enemy.id].size * 0.25 + 60;
    if (a.air) {
      const want = near && !UNITS[enemy.id].air ? (a.range <= 60 ? FLY.close : FLY.ranged) : FLY.high, alt = u.alt ?? FLY.high;
      u.alt = alt + Math.max(-FLY.rate * dt, Math.min(FLY.rate * dt, want - alt));
    }
    if (enemy && distance <= a.range + UNITS[enemy.id].size * 0.25) {
      if (u.attack <= 0) {
        u.attack = a.rate; u.hit = 0.3;
        const area = u.boss ? Math.max(a.splash ?? 0, BOSS.area) : a.splash;
        if (a.sweep) {
          // Everything it can reach in front of it, out to `reach`, is struck and thrown back.
          const dir = u.side ? -1 : 1;
          for (const v of alive) if (v.side !== u.side && reaches(u, v) && (v.x - u.x) * dir >= -20 && (v.x - u.x) * dir <= a.sweep.reach) hits.push({ target: v, damage: u.damage, push: a.sweep.back });
          s.effects.push({ x: u.x + dir * a.sweep.reach, from: u.x, lane: u.lane, life: 0.5, max: 0.5, kind: 'sweep', side: u.side, fromUp: a.air ? u.alt ?? FLY.high : 0 });
        } else {
        for (const v of alive) if (v.side !== u.side && reaches(u, v) && (v === enemy || (area && Math.abs(v.x - enemy.x) < area))) hits.push({ target: v, damage: u.damage, boss: u.boss });
        if (u.boss) s.effects.push({ x: enemy.x, from: enemy.x, lane: enemy.lane, life: BOOM, max: BOOM, kind: 'boom', side: u.side, size: 80, dark: true });
        launch(s, u, a, enemy.x, enemy.lane, UNITS[enemy.id].air ? enemy.alt ?? FLY.high : 0);
        }
        hear(s, soundsOf(u)[0], u.x);
      }
    } else if (Math.abs(baseX - u.x) <= a.range + 35) {
      // At the fortress, what it throws or shoots flies into the wall (a little up it), as at a troop.
      if (u.attack <= 0) { u.attack = a.rate; u.hit = 0.3; s.hp[u.side ? 0 : 1] -= u.damage; if (a.shot) launch(s, u, a, baseX + (u.side ? 30 : -30), 1, 40); hear(s, soundsOf(u)[0], u.x); }
    } else {
      const movement = a.speed * dt; u.moving = true;
      // Never step through an opponent, even during a long frame.
      u.x += (u.side ? -1 : 1) * Math.max(0, Math.min(movement, distance - 24));
      u.x = Math.max(110, Math.min(FIELD - 110, u.x));
    }
  }
  for (const hit of hits) {
    const v = hit.target, spec = UNITS[v.id];
    v.hp -= hit.damage; v.flash = 0.12;
    // A guardian's every blow throws back what it hits (stuns machines and flyers); others only a heavy blow.
    if (v.hp > 0 && !v.boss && !spec.steady && (hit.boss || hit.push || hit.damage >= v.maxHp * KNOCK.share)) {
      if (spec.infantry || hit.boss || hit.push) { v.knock = KNOCK.time; v.knockBack = hit.boss ? BOSS.knock : hit.push; } else v.stun = KNOCK.stun;
    }
  }
  // Breaking robots fall into a weaker wreck of themselves where they stood, with a blast.
  for (const u of s.units) if (u.hp <= 0 && (u.stage ?? 0) < splitsOf(u)) {
    const hp = u.maxHp * SPLIT.hp;
    s.units.push({ ...u, uid: s.nextId++, hp, maxHp: hp, damage: u.damage * SPLIT.damage, attack: 0.8, flash: 0.3, hit: 0, stage: (u.stage ?? 0) + 1 });
    s.effects.push({ x: u.x, from: u.x, lane: u.lane, life: 0.4, max: 0.4, kind: 'burst', side: u.side });
  }
  for (const u of s.units) if (u.hp <= 0) {
    if (!((u.stage ?? 0) < splitsOf(u))) hear(s, u.side ? 'death-foe' : 'death-ally', u.x);
    hear(s, soundsOf(u)[1], u.x);
    // A fallen enemy's bounty: gold (kept win or lose) and energy, shown rising where it fell.
    if (u.side && !((u.stage ?? 0) < splitsOf(u))) {
      const gold = dropOf(u), mana = manaOf(u);
      s.loot = (s.loot ?? 0) + gold; s.energy = Math.min(energyMax(s), s.energy + mana);
      s.effects.push({ x: u.x, from: u.uid, lane: 0, life: 0.9, max: 0.9, kind: 'loot', side: 1, gold, mana });
    }
  }
  s.kills += s.units.filter(u => u.side && u.hp <= 0).length;
  s.units = s.units.filter(u => u.hp > 0);
  s.hp = s.hp.map(h => Math.max(0, h)) as [number, number];
  if (s.hp[0] <= 0 || s.time >= LIMIT) s.phase = 'lost';
  else if (s.hp[1] <= 0 && (!guarded(s.world) || (s.bossSpawned && !s.units.some(u => u.boss && u.side)))) s.phase = 'won';
}
/** Rewards settle once per battle; a reload cannot replay a settled result. */
/** What winning a battle pays the first time (a guardian's half as much again), and again after (a third of it). */
export const prize = (stage: number, first: boolean) => { const full = Math.round((80 + stage * 10) * (guarded(stage) ? 1.5 : 1)); return first ? full : Math.round(full / 3); };
/** Rewards settle once per battle; a reload cannot replay a settled result. The enemies' gold (`loot`) is kept win or
    lose; the return is the victory's prize alone. */
export function settle(p: Progress, s: Siege): number {
  if (s.phase === 'fight' || s.paid) return 0;
  s.paid = true;
  p.coins += s.loot ?? 0;
  if (s.phase !== 'won') return 0;
  const first = !p.victories.includes(s.world);
  const reward = prize(s.world, first);
  p.coins += reward;
  if (first) p.victories.push(s.world);
  p.unlocked = Math.min(LAST, Math.max(p.unlocked, s.world + 1));
  return reward;
}
