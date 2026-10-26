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
export type Form = Partial<Pick<Spec, 'cost' | 'hp' | 'damage' | 'speed' | 'range' | 'rate' | 'splash' | 'hitsAir' | 'infantry' | 'shot' | 'spin' | 'sprite' | 'size'>> & { price: number }
/** Cartoon Wars 2's rosters (docs/siege-roster.md), with the owner's sheets (`siege/units/<side>-<name>-<pose>`: 0 stand,
    1 attack, 2 hurt). `size` is the drawn height in field units, from the stand picture's height (0.62 a pixel) and how
    big the unit is meant to be. Every unit's `id` is its place in this list: ours first (10 land, then 5 air), then
    the enemy's, each one stated as the ally it equals in the reference. */
const unit = (name: string, px: number, k = 1) => ({ sprite: `siege/units/${name}`, size: Math.round(px * 0.62 * k), facesLeft: name.startsWith('foe-') || undefined });
/** A six-pose sheet (drawn at a higher resolution: 0.4 a pixel of its first walking pose). */
/** `k` evens out a sheet drawn at another scale than the swordsman's. */
const six = (name: string, px: number, k = 1) => ({ sprite: `siege/units/${name}`, size: Math.round(px * 0.4 * k), six: true });
export const UNITS: readonly Spec[] = [
  // Ours, land.
  // The swordsman's five forms (the reference's six, its fifth dropped): club, dagger, sword and shield, greatsword,
  // and the master, whose slash leaves fire and reaches flyers. Energy follows the reference's mana, doubled.
  { id: 0, cost: 20, hp: 115, damage: 16, speed: 43, range: 35, rate: 0.8, cooldown: 2, unlock: 1, infantry: true, ...six('ally-swordsman-1', 119), forms: [
    { price: 120, cost: 30, hp: 135, damage: 21, speed: 46, ...six('ally-swordsman-2', 123) },
    { price: 300, cost: 50, hp: 190, damage: 23, ...six('ally-swordsman-3', 129) },
    { price: 400, cost: 60, hp: 220, damage: 34, range: 42, ...six('ally-swordsman-4', 145) },
    { price: 2000, cost: 200, hp: 340, damage: 58, speed: 62, range: 45, splash: 30, hitsAir: true, ...six('ally-swordsman-5', 142) },
  ] },
  // The spearman's five forms (docs/cw2-reference.md): basic spear, longer, longer still, the horned fox helmet, and the
  // lancer on a white horse. The reference gives no prices: a little above the swordsman's.
  { id: 1, cost: 30, hp: 150, damage: 20, speed: 40, range: 55, rate: 0.9, cooldown: 3, unlock: 1, infantry: true, ...six('ally-spearman-1', 119), forms: [
    { price: 250, cost: 40, hp: 175, damage: 24, range: 65, ...six('ally-spearman-2', 119) },
    { price: 400, cost: 50, hp: 210, damage: 28, range: 75, ...six('ally-spearman-3', 121) },
    { price: 600, cost: 65, hp: 270, damage: 34, range: 80, ...six('ally-spearman-4', 155) },
    { price: 2200, cost: 220, hp: 620, damage: 60, speed: 70, range: 90, splash: 30, infantry: false, ...six('ally-spearman-5', 191) },
  ] },
  // The archer's four forms (docs/cw2-reference.md): rock thrower, javelin thrower, archer with a bow, and the ninja
  // throwing shurikens; each throws its own sheet's projectile. The reference gives no prices.
  { id: 2, cost: 30, hp: 80, damage: 18, speed: 33, range: 150, rate: 1.3, cooldown: 4, unlock: 1, infantry: true, shot: 'rock', spin: true, ...six('ally-archer-1', 155), forms: [
    { price: 250, cost: 40, hp: 90, damage: 24, range: 175, shot: 'javelin', spin: false, ...six('ally-archer-2', 159) },
    { price: 400, cost: 50, hp: 100, damage: 27, range: 200, shot: 'arrow', spin: false, ...six('ally-archer-3', 187) },
    { price: 1500, cost: 120, hp: 150, damage: 32, speed: 50, range: 195, rate: 0.8, shot: 'shuriken', spin: true, ...six('ally-archer-4', 195) },
  ] },
  // The heavy armour swordsman's four forms (docs/cw2-reference.md): a knight with two swords, a bigger one with maces
  // for hands, the samurai who punches, and a bigger samurai. The reference gives no prices.
  { id: 3, cost: 65, hp: 430, damage: 24, speed: 22, range: 40, rate: 1.5, cooldown: 7, unlock: 1, infantry: true, ...six('ally-heavy-1', 199, 0.8), forms: [
    { price: 300, cost: 80, hp: 560, damage: 30, ...six('ally-heavy-2', 200, 0.8) },
    { price: 500, cost: 100, hp: 700, damage: 34, rate: 1.2, ...six('ally-heavy-3', 216, 0.8) },
    { price: 1800, cost: 180, hp: 980, damage: 48, rate: 1.2, splash: 30, ...six('ally-heavy-4', 261, 0.8) },
  ] },
  // The gunner's four forms (docs/cw2-reference.md): pistol, rifle, two Uzis (fast), sniper rifle (long reach, slow and
  // heavy). They fire bullets (`shot: 'bullet'`, a tracer drawn in code). The reference gives no prices.
  { id: 4, cost: 45, hp: 95, damage: 24, speed: 32, range: 200, rate: 1.4, cooldown: 6, unlock: 1, infantry: true, shot: 'bullet', ...six('ally-gunner-1', 192, 0.65), forms: [
    { price: 300, cost: 55, hp: 110, damage: 30, range: 230, ...six('ally-gunner-2', 213, 0.65) },
    { price: 500, cost: 70, hp: 125, damage: 22, range: 210, rate: 0.6, ...six('ally-gunner-3', 203, 0.65) },
    { price: 1600, cost: 140, hp: 150, damage: 90, range: 320, rate: 2.4, ...six('ally-gunner-4', 214, 0.65) },
  ] },
  // The blaster's four forms (docs/cw2-reference.md): bazooka, rocket launcher, ray gun, flamethrower. Rockets fly as
  // their own pictures and blast an area; the ray is drawn in code; the flame is in the attack pose (no projectile).
  { id: 5, cost: 85, hp: 260, damage: 34, speed: 28, range: 200, rate: 1.6, cooldown: 8, unlock: 2, infantry: true, splash: 40, shot: 'rocket', spin: false, ...six('ally-blaster-1', 186, 0.65), forms: [
    { price: 350, cost: 100, hp: 290, damage: 44, splash: 50, shot: 'rockets', ...six('ally-blaster-2', 208, 0.65) },
    { price: 600, cost: 120, hp: 320, damage: 52, range: 240, rate: 1.3, splash: 0, shot: 'ray', ...six('ally-blaster-3', 211, 0.65) },
    { price: 1800, cost: 170, hp: 420, damage: 32, range: 110, rate: 0.5, splash: 70, shot: 'none', ...six('ally-blaster-4', 207, 0.65) },
  ] },
  // The wizard's three forms (docs/cw2-reference.md), the same staff: lightning striking the ground, a tornado, and a
  // meteor that leaves flames. The spell lands on the target from the sheet (`shot-lightning|tornado|meteor`); from
  // level 3 he reaches flyers. The reference gives no prices.
  { id: 6, cost: 95, hp: 150, damage: 40, speed: 26, range: 220, rate: 1.9, cooldown: 10, unlock: 3, splash: 55, infantry: true, shot: 'lightning', ...six('ally-wizard-1', 226, 0.6), forms: [
    { price: 600, cost: 120, hp: 180, damage: 46, splash: 75, shot: 'tornado', ...six('ally-wizard-2', 241, 0.6) },
    { price: 2000, cost: 190, hp: 230, damage: 70, splash: 90, hitsAir: true, shot: 'meteor', ...six('ally-wizard-3', 265, 0.6) },
  ] },
  { id: 7, cost: 75, hp: 260, damage: 40, speed: 85, range: 38, rate: 0.8, cooldown: 7, unlock: 4, ...unit('ally-vulture', 90, 1.1) },
  // The armed robot's three forms (docs/cw2-reference.md): claw and arm rocket, the walker with twin cannons (fast and
  // strong), and the walker behind a wall-like shield firing missiles.
  { id: 8, cost: 110, hp: 320, damage: 38, speed: 50, range: 180, rate: 1, cooldown: 10, unlock: 5, shot: 'rocket', spin: false, ...six('ally-robot-1', 199, 0.69), forms: [
    { price: 700, cost: 140, hp: 420, damage: 22, rate: 0.45, range: 190, shot: 'bullet', ...six('ally-robot-2', 255, 0.69) },
    { price: 1800, cost: 180, hp: 800, damage: 60, rate: 1.4, range: 200, splash: 40, shot: 'rockets', ...six('ally-robot-3', 309, 0.69) },
  ] },
  // The heavy armed robot's four forms (docs/cw2-reference.md): gatling bursts, small rockets added (MK2), a frozen
  // cannon on its back (from here it reaches flyers), and a huge one firing rocket salvos.
  { id: 9, cost: 200, hp: 1300, damage: 70, speed: 18, range: 200, rate: 2, cooldown: 22, unlock: 5, splash: 80, shot: 'bullet', ...six('ally-heavy-robot-1', 188, 1.29), forms: [
    { price: 1200, cost: 230, hp: 1500, damage: 80, shot: 'rockets', ...six('ally-heavy-robot-2', 199, 1.29) },
    { price: 2200, cost: 260, hp: 1800, damage: 90, hitsAir: true, shot: 'bullet', ...six('ally-heavy-robot-3', 234, 1.29) },
    { price: 4000, cost: 320, hp: 2600, damage: 120, splash: 100, hitsAir: true, shot: 'rockets', ...six('ally-heavy-robot-4', 253, 1.29) },
  ] },
  // Ours, air (Cartoon Wars 2's A row): they fly over the field, out of reach of melee troops; only ranged ones hit them.
  // The aircraft fighter's four forms: a sword under a propeller pack, then with goggles and scarf, two rotors and blue
  // steel, and gold rotors with a flaming sword.
  { id: 10, cost: 30, hp: 70, damage: 12, speed: 70, range: 40, rate: 0.7, cooldown: 3, unlock: 1, air: true, ...six('ally-fighter-1', 176, 0.7), forms: [
    { price: 150, cost: 40, hp: 100, damage: 16, ...six('ally-fighter-2', 182, 0.7) },
    { price: 400, cost: 55, hp: 140, damage: 22, ...six('ally-fighter-3', 190, 0.7) },
    { price: 1200, cost: 90, hp: 220, damage: 34, speed: 80, splash: 25, ...six('ally-fighter-4', 195, 0.7) },
  ] },
  { id: 11, cost: 55, hp: 110, damage: 20, speed: 55, range: 190, rate: 0.8, cooldown: 5, unlock: 2, air: true, ...unit('ally-armed-fighter', 74) },
  { id: 12, cost: 95, hp: 320, damage: 44, speed: 35, range: 210, rate: 1.8, cooldown: 10, unlock: 4, air: true, splash: 50, ...unit('ally-helicopter', 84) },
  // The drill aircraft, the flying shield, in six forms: a rocket fist, a laser, a plasma beam, an ice burst, a gatling,
  // and a giant golden fist.
  { id: 13, cost: 80, hp: 300, damage: 32, speed: 55, range: 45, rate: 0.9, cooldown: 8, unlock: 5, air: true, ...six('ally-drill-1', 126, 0.92), forms: [
    { price: 500, cost: 95, hp: 340, damage: 30, range: 130, shot: 'ray', ...six('ally-drill-2', 136, 0.92) },
    { price: 800, cost: 110, hp: 380, damage: 38, range: 150, shot: 'ray', ...six('ally-drill-3', 146, 0.92) },
    { price: 1200, cost: 130, hp: 450, damage: 46, range: 60, splash: 40, ...six('ally-drill-4', 149, 0.92) },
    { price: 1800, cost: 150, hp: 520, damage: 20, rate: 0.4, range: 160, shot: 'bullet', ...six('ally-drill-5', 145, 0.92) },
    { price: 3000, cost: 200, hp: 800, damage: 80, range: 60, splash: 50, ...six('ally-drill-6', 175, 0.92) },
  ] },
  { id: 14, cost: 220, hp: 700, damage: 60, speed: 65, range: 45, rate: 0.9, cooldown: 20, unlock: 6, air: true, splash: 40, ...unit('ally-angel', 120) },
  // The enemy's.
  { id: 15, cost: 0, hp: 115, damage: 16, speed: 43, range: 35, rate: 0.8, cooldown: 0, unlock: 1, foe: true, infantry: true, ...unit('foe-swordsman', 74) },
  { id: 16, cost: 0, hp: 150, damage: 20, speed: 40, range: 55, rate: 0.9, cooldown: 0, unlock: 1, foe: true, infantry: true, ...unit('foe-spearman', 74) },
  { id: 17, cost: 0, hp: 130, damage: 18, speed: 70, range: 35, rate: 0.7, cooldown: 0, unlock: 1, foe: true, ...unit('foe-dog', 64) },
  { id: 18, cost: 0, hp: 480, damage: 26, speed: 24, range: 42, rate: 1.5, cooldown: 0, unlock: 1, foe: true, ...unit('foe-bear', 94, 1.15) },
  { id: 19, cost: 0, hp: 240, damage: 32, speed: 40, range: 60, rate: 1, cooldown: 0, unlock: 1, foe: true, infantry: true, ...unit('foe-reaper', 80, 1.05) },
  { id: 20, cost: 0, hp: 560, damage: 30, speed: 22, range: 45, rate: 1.6, cooldown: 0, unlock: 1, foe: true, splash: 40, infantry: true, ...unit('foe-hammer', 81, 1.1) },
  { id: 21, cost: 0, hp: 720, damage: 34, speed: 21, range: 48, rate: 1.6, cooldown: 0, unlock: 1, foe: true, splash: 40, infantry: true, ...unit('foe-axeman', 88, 1.15) },
  { id: 22, cost: 0, hp: 100, damage: 30, speed: 30, range: 230, rate: 1.5, cooldown: 0, unlock: 1, foe: true, infantry: true, ...unit('foe-gunner', 74) },
  { id: 23, cost: 0, hp: 300, damage: 38, speed: 28, range: 210, rate: 1.5, cooldown: 0, unlock: 1, foe: true, infantry: true, ...unit('foe-blaster', 70) },
  { id: 24, cost: 0, hp: 150, damage: 42, speed: 26, range: 220, rate: 1.9, cooldown: 0, unlock: 1, foe: true, splash: 60, infantry: true, ...unit('foe-wizard', 82) },
  { id: 25, cost: 0, hp: 280, damage: 36, speed: 60, range: 40, rate: 1, cooldown: 0, unlock: 1, foe: true, ...unit('foe-tiger', 81, 1.1) },
  { id: 26, cost: 0, hp: 420, damage: 40, speed: 45, range: 120, rate: 1.4, cooldown: 0, unlock: 1, foe: true, splash: 50, ...unit('foe-dragon', 89, 1.2) },
  { id: 27, cost: 0, hp: 380, damage: 40, speed: 55, range: 45, rate: 0.9, cooldown: 0, unlock: 1, foe: true, air: true, ...unit('foe-death-angel', 94) },
  { id: 28, cost: 0, hp: 70, damage: 12, speed: 70, range: 40, rate: 0.7, cooldown: 0, unlock: 1, foe: true, air: true, ...unit('foe-eagle', 78) },
  { id: 29, cost: 0, hp: 110, damage: 18, speed: 60, range: 40, rate: 0.7, cooldown: 0, unlock: 1, foe: true, air: true, ...unit('foe-ninja-bat', 45, 1.3) },
  { id: 30, cost: 0, hp: 130, damage: 24, speed: 45, range: 180, rate: 1.2, cooldown: 0, unlock: 1, foe: true, air: true, ...unit('foe-hypno-bat', 67, 1.1) },
  { id: 31, cost: 0, hp: 900, damage: 55, speed: 40, range: 130, rate: 1.4, cooldown: 0, unlock: 1, foe: true, air: true, splash: 50, steady: true, ...unit('foe-red-dragon-rider', 93, 1.3) },
  { id: 32, cost: 0, hp: 760, damage: 40, speed: 24, range: 180, rate: 1.4, cooldown: 0, unlock: 1, foe: true, splits: 2, ...unit('foe-gatling', 88, 1.1) },
];
/** The enemy's land and air troops by act, each act adding to the last (docs/siege-roster.md): early waves draw
    from the first two of the land list. */
export const FOE_LAND = [[15, 16, 17], [22, 19], [23, 18], [24, 25, 20], [26, 21], [32]];
export const FOE_AIR = [[28], [29], [27], [30], [], [31]];
/** The enemy's troops in a battle: every earlier act's, and its own act's coming in one more each stage. */
export const foesAt = (lists: number[][], stage: number) => [...lists.slice(0, actOf(stage) - 1).flat(), ...(lists[actOf(stage) - 1] ?? []).slice(0, stageIn(stage))];
/** What recruiting each of our troops costs in gold (the swordsman is everyone's first). Bought once, kept. */
export const RECRUIT: Record<number, number> = { 0: 0, 1: 100, 2: 120, 3: 350, 4: 300, 5: 600, 6: 900, 7: 700, 8: 900, 9: 1600, 10: 250, 11: 500, 12: 900, 13: 900, 14: 2000 };
/** The guardian of each act, drawn bigger: the Large Gatling Robot and the Large Red Dragon Rider are their troops;
    the others stand in for their own pictures (Large Slinger, Giant Brute Eater, Giant Dinosaur Brute, Giant King
    Dinosaur Brute) until those exist. */
export const GUARDIAN = [18, 32, 31, 21, 26, 26];
/** Up to this many land and this many air troops in an army. */
export const DECK = 5;
const isAir = (id: number) => !!UNITS[id]?.air;
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
/** Can fighter `u` hit fighter `v`? Flyers are out of reach of ground troops that fight up close. */
const reaches = (u: Fighter, v: Fighter) => { const a = specOf(u); return !isAir(v.id) || !!a.air || a.range >= 100 || !!a.hitsAir; };
/** Can a fighter of `id` hit one of `target`? Melee troops on the ground cannot reach the air. */
export const canHit = (id: number, target: number) => !isAir(target) || isAir(id) || UNITS[id].range >= 100;
/** Keep at most `DECK` of each kind, in order. */
export function capDeck(deck: number[]) { const land = deck.filter(id => !isAir(id)).slice(0, DECK), air = deck.filter(isAir).slice(0, DECK); return deck.filter(id => land.includes(id) || air.includes(id)); }
export interface Progress { version: 1; unlocked: number; coins: number; victories: number[]; upgrades: [number, number, number, number]; deck: number[];
  /** Each troop's level (index: its id), 1 to `levelsOf(id)`. */
  levels: number[];
  /** The troops recruited so far (the swordsman from the start). */
  owned: number[] }
export const freshProgress = (): Progress => ({ version: 1, unlocked: 1, coins: 0, victories: [], upgrades: [0, 0, 0, 0], deck: [0], levels: ALLIES.map(() => 1), owned: [0] });
/** Has the battles won opened this troop's act? */
export const isOpen = (p: Progress, id: number) => !!UNITS[id] && !UNITS[id].foe && UNITS[id].unlock <= actOf(p.unlocked);
export const owns = (p: Progress, id: number) => p.owned.includes(id);
export const troopPrice = (id: number) => RECRUIT[id] ?? 0;
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
    p.levels = ALLIES.map(u => integer(v.levels?.[u.id], 1, levelsOf(u.id), 1));
    p.owned = [...new Set<number>([0, ...(Array.isArray(v.owned) ? v.owned.filter((n: unknown) => typeof n === 'number' && isOpen(p, n)) : [])])];
    p.deck = Array.isArray(v.deck) ? capDeck([...new Set<number>(v.deck.filter((n: unknown) => typeof n === 'number' && owns(p, n)))]) : [];
    if (!p.deck.length) p.deck = [0];
  } catch { /* corrupt or unavailable storage starts a safe, isolated preview */ }
  return p;
}
export const upgradePrice = (level: number) => 100 + level * 100;
/** A troop's next form's gold price, or 0 at its last. */
export const levelPrice = (p: Progress, id: number) => UNITS[id]?.forms?.[(p.levels[id] ?? 1) - 1]?.price ?? 0;
/** Buys a troop's next form. */
export function levelUp(p: Progress, id: number): boolean {
  const price = levelPrice(p, id);
  if (!price || !owns(p, id) || p.coins < price) return false;
  p.coins -= price; p.levels[id] = (p.levels[id] ?? 1) + 1; return true;
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
  knock?: number; stun?: number }
/** A blow taking at least this share of a troop's health knocks it: infantry fly back (`KNOCK.back` field units over
    `KNOCK.time`) and get up, the rest are stunned for `KNOCK.stun`; bosses and the steady never. */
export const KNOCK = { share: 0.2, time: 0.55, back: 70, stun: 0.35 };
export interface Effect { x: number; from: number; lane: number; life: number; max: number; kind: 'shot' | 'burst' | 'arrow' | 'rocket' | 'bolt'; side: 0 | 1;
  /** A shot's own projectile picture (`Spec.shot`) and whether it spins. */
  art?: string; spin?: boolean }
export interface Siege {
  world: number; phase: 'fight' | 'won' | 'lost'; time: number; energy: number; generator: number; cooldowns: number[];
  hp: [number, number]; maxHp: [number, number]; units: Fighter[]; effects: Effect[]; nextId: number; nextWave: number; waves: number; kills: number;
  spell: number; rocket: number; aim: number; bow: Bow;
  /** The troops' sounds since the view last took them (attacks and deaths, where they happened); kept short. */
  sounds?: { k: string; x: number }[];
  /** How many times the bow has shot this battle (the view plays a sound for each new one). */
  shots?: number; bossSpawned: boolean; paid: boolean; power: number; economy: number; deck: number[];
  /** The workshop's fortress level (0-5): it picks how our fortress looks. */
  fort: number;
  /** Our troops' levels, from the save. */
  levels: number[];
  /** The gold the enemies dropped this battle: kept whether it is won or lost. */
  loot?: number;
}
/** The gold an enemy drops when it falls: by its toughness, double for a horned one, a guardian far more. */
export const dropOf = (u: Fighter) => (u.boss ? 60 : Math.max(3, Math.round(UNITS[u.id].hp / 30)) * (u.elite ? 2 : 1));
/** Which of the three pictures a workshop level (0-5) shows, for our fortress and its crossbow: 0-1, 2-3, 4-5. */
export const looksTier = (level: number) => (level >= 4 ? 3 : level >= 2 ? 2 : 1);
/** Which of the enemy fortress's three pictures a battle shows, by its act: acts 1-2, 3-4, 5-6. */
export const enemyTier = (stage: number) => Math.min(3, Math.max(1, Math.ceil(actOf(stage) / 2)));

export const energyMax = (s: Siege) => 180 + s.generator * 70;
export const energyRate = (s: Siege) => 7 + s.generator * 2.5 + s.economy;
export const generatorPrice = (s: Siege) => 65 + s.generator * 45;
export function newSiege(p: Progress, world: number): Siege {
  world = integer(world, 1, Math.min(LAST, p.unlocked), 1);
  const maxHp: [number, number] = [1700 + p.upgrades[1] * 200, 1700 + hard(world) * 150];
  return { world, phase: 'fight', time: 0, energy: 80, generator: 0, cooldowns: UNITS.map(() => 0), hp: [...maxHp], maxHp, units: [], effects: [], nextId: 1, nextWave: 7, waves: 0, kills: 0, spell: 0, rocket: 0, aim: 700, bossSpawned: false, paid: false, power: 1 + p.upgrades[0] * 0.08, economy: p.upgrades[2] * 0.6, deck: [...p.deck], bow: { quiver: BOW.max, drawing: false, held: 0, next: 0, level: p.upgrades[3] }, fort: p.upgrades[1], levels: [...(p.levels ?? [])] };
}
/** The guardian, Cartoon Wars 2-style: it only comes out once the enemy fortress falls, far tougher than a troop, and
    the battle is won when it falls too. */
const BOSS_HP = 2.6;
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
function spawn(s: Siege, id: number, side: 0 | 1, boss = false) {
  if (s.units.filter(u => u.side === side).length >= CAP) return;
  const lv = side ? undefined : s.levels[id] ?? 1;
  const spec = side ? UNITS[id] : specAt(id, lv); const scale = side ? 0.95 + hard(s.world) * 0.04 : s.power;
  const hp = spec.hp * scale * (boss ? BOSS_HP : 1);
  // One gunner in every few (counted by its spawn number) comes horned.
  const elite = !!side && !boss && id === ELITE_ID && s.time >= ELITE.from && s.nextId % ELITE.every === 0;
  const life = hp * (elite ? ELITE.hp : 1);
  s.units.push({ uid: s.nextId++, id, side, x: side ? FIELD - 120 : 120, lane: s.nextId % 3, hp: life, maxHp: life, damage: spec.damage * scale * (elite ? ELITE.damage : 1), attack: 0, flash: 0, boss, elite: elite || undefined, lv });
}
/** What a troop's attack sounds like (its weapon) and its death (its body), by id; an array is per level. Projectile
    troops sound like what they fire (`SHOT_SOUND`). Names are the audio engine's `SiegeSound`s. */
const ATTACK_SOUND: Record<number, string | string[]> = {
  0: ['blunt', 'blade', 'blade', 'blade', 'blade'], 1: 'pierce', 3: ['blade', 'blunt', 'blunt', 'blunt'], 4: ['gun', 'rifle', 'uzi', 'sniper'],
  7: 'claw', 8: ['rocket', 'gatling', 'rocket'], 9: ['gatling', 'gatling', 'gatling', 'gatling'], 10: 'blade', 11: 'rifle', 12: 'rocket', 13: ['blunt', 'ray', 'ray', 'blunt', 'gatling', 'blunt'], 14: 'magic',
  15: 'blade', 16: 'pierce', 17: 'bite', 18: 'claw', 19: 'blade', 20: 'blunt', 21: 'blade', 22: 'rifle', 23: 'throw', 24: 'magic',
  25: 'claw', 26: 'breath', 27: 'blade', 28: 'claw', 29: 'claw', 30: 'magic', 31: 'blade', 32: 'gatling',
};
const SHOT_SOUND: Record<string, string> = { rock: 'throw', javelin: 'throw', shuriken: 'throw', arrow: 'bow', rocket: 'rocket', rockets: 'rocket', ray: 'ray', none: 'flame', lightning: 'thunder', tornado: 'wind', meteor: 'meteor' };
const DEATH_SOUND: Record<number, string | string[]> = {
  1: ['die-man', 'die-man', 'die-man', 'die-man', 'die-horse'], 3: 'die-armor', 7: 'die-beast', 8: 'die-bot', 9: 'die-bot',
  10: 'die-flyer', 11: 'die-flyer', 12: 'die-flyer', 13: 'die-bot', 14: 'die-flyer',
  17: 'die-beast', 18: 'die-brute', 20: 'die-armor', 21: 'die-armor', 25: 'die-beast', 26: 'die-dragon', 27: 'die-flyer', 28: 'die-flyer',
  29: 'die-flyer', 30: 'die-flyer', 31: 'die-dragon', 32: 'die-bot',
};
const pickLevel = (v: string | string[] | undefined, lv: number) => (Array.isArray(v) ? v[Math.min(lv, v.length) - 1] : v);
/** A fighter's attack and death sounds. */
export function soundsOf(u: Fighter): [string, string] {
  const lv = u.side ? 1 : u.lv ?? 1, a = specOf(u);
  const attack = (a.shot && a.shot !== 'bullet' && SHOT_SOUND[a.shot]) || pickLevel(ATTACK_SOUND[u.id], lv) || 'blade';
  return [attack, pickLevel(DEATH_SOUND[u.id], lv) ?? 'die-man'];
}
function hear(s: Siege, k: string, x: number) { const q = (s.sounds ??= []); q.push({ k, x }); if (q.length > 24) q.shift(); }
/** What summoning a troop costs now (its level's energy). */
export const costOf = (s: Siege, id: number) => specAt(id, s.levels[id]).cost;
export function canSummon(s: Siege, id: number): boolean {
  return s.phase === 'fight' && !UNITS[id]?.foe && s.deck.includes(id) && s.energy >= costOf(s, id) && s.cooldowns[id] <= 0 && s.units.filter(u => !u.side).length < CAP;
}
export function summon(s: Siege, id: number): boolean {
  if (!canSummon(s, id)) return false;
  s.energy -= costOf(s, id); s.cooldowns[id] = UNITS[id].cooldown; spawn(s, id, 0); return true;
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
export const BOW = { max: 100, cost: 2.5, regen: 12, every: 0.42, step: 0.04, fastest: 0.13, ramp: 2.5, damage: 16, gap: 24 };
export interface Bow { quiver: number; drawing: boolean; held: number; next: number; level: number }
export const aimAt = (x: number) => Math.max(140, Math.min(1080, x));
/** Seconds between shots and arrows per shot, for the bow's level and how long it has been held. */
export const bowEvery = (b: Bow) => Math.max(BOW.fastest, (BOW.every - b.level * BOW.step) * (1 - Math.min(1, b.held / BOW.ramp) * 0.5));
export const bowCount = (b: Bow) => 1 + Math.floor(b.level / 2) + (b.held >= BOW.ramp ? 1 : 0);
function arrows(s: Siege, count: number) {
  const x = aimAt(s.aim);
  for (let i = 0; i < count; i++) {
    const at = x + (i - (count - 1) / 2) * BOW.gap;
    for (const u of s.units) if (u.side === 1 && Math.abs(u.x - at) <= 28) { u.hp -= BOW.damage * s.power; u.flash = 0.18; }
    s.effects.push({ x: at, from: 80, lane: i % 3, life: 0.5, max: 0.5, kind: 'arrow', side: 0 });
  }
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
  damageArea(s, s.aim, 155, 210 * s.power, 0.7); s.spell = 24; return true;
}
/** Fixed-step caller. Accumulate damage before removal so opposing lethal hits resolve fairly. */
export function tick(s: Siege, dt: number) {
  if (s.phase !== 'fight' || !Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, 0.1); s.time += dt;
  s.energy = Math.min(energyMax(s), s.energy + energyRate(s) * dt);
  s.spell = Math.max(0, s.spell - dt); s.rocket = Math.max(0, s.rocket - dt);
  s.cooldowns = s.cooldowns.map(c => Math.max(0, c - dt));
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
  if (!s.bossSpawned && s.hp[1] <= 0 && guarded(s.world)) { s.bossSpawned = true; spawn(s, GUARDIAN[actOf(s.world) - 1], 1, true); }
  const alive = s.units.filter(u => u.hp > 0);
  const hits: { target: Fighter; damage: number }[] = [];
  for (const u of alive) {
    const a = specOf(u); u.attack -= dt; u.flash = Math.max(0, u.flash - dt); u.hit = Math.max(0, (u.hit ?? 0) - dt);
    u.moving = false;
    if (u.knock) { u.knock = Math.max(0, u.knock - dt); u.x = Math.max(110, Math.min(FIELD - 110, u.x + (u.side ? 1 : -1) * KNOCK.back / KNOCK.time * dt)); continue; }
    if (u.stun) { u.stun = Math.max(0, u.stun - dt); continue; }
    const enemy = alive.filter(v => v.side !== u.side && reaches(u, v)).sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
    const baseX = u.side ? 80 : FIELD - 80;
    const distance = enemy ? Math.abs(enemy.x - u.x) : Infinity;
    if (enemy && distance <= a.range + UNITS[enemy.id].size * 0.25) {
      if (u.attack <= 0) {
        u.attack = a.rate; u.hit = 0.3;
        for (const v of alive) if (v.side !== u.side && reaches(u, v) && (v === enemy || (a.splash && Math.abs(v.x - enemy.x) < a.splash))) hits.push({ target: v, damage: u.damage });
        // A thrown or shot projectile of its own flies a little longer, so it is seen on its way.
        const flight = a.shot === 'bullet' || a.shot === 'ray' ? 0.16 : SPELLS.includes(a.shot ?? '') ? 0.6 : a.shot ? 0.35 : 0.2;
        s.effects.push({ x: enemy.x, from: u.x, lane: enemy.lane, life: flight, max: flight, kind: u.elite ? 'bolt' : 'shot', side: u.side, art: a.shot, spin: a.spin });
        hear(s, soundsOf(u)[0], u.x);
      }
    } else if (Math.abs(baseX - u.x) <= a.range + 35) {
      if (u.attack <= 0) { u.attack = a.rate; u.hit = 0.3; s.hp[u.side ? 0 : 1] -= u.damage; hear(s, soundsOf(u)[0], u.x); }
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
    if (v.hp > 0 && !v.boss && !spec.steady && hit.damage >= v.maxHp * KNOCK.share) { if (spec.infantry) v.knock = KNOCK.time; else v.stun = KNOCK.stun; }
  }
  // Breaking robots fall into a weaker wreck of themselves where they stood, with a blast.
  for (const u of s.units) if (u.hp <= 0 && (u.stage ?? 0) < splitsOf(u)) {
    const hp = u.maxHp * SPLIT.hp;
    s.units.push({ ...u, uid: s.nextId++, hp, maxHp: hp, damage: u.damage * SPLIT.damage, attack: 0.8, flash: 0.3, hit: 0, stage: (u.stage ?? 0) + 1 });
    s.effects.push({ x: u.x, from: u.x, lane: u.lane, life: 0.4, max: 0.4, kind: 'burst', side: u.side });
  }
  for (const u of s.units) if (u.hp <= 0) { hear(s, soundsOf(u)[1], u.x); if (u.side) s.loot = (s.loot ?? 0) + dropOf(u); }
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
