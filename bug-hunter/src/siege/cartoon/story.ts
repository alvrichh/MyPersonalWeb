import type { Key } from '../../strings';

/** Who speaks: the narrator; King Álvaro (the leader); Captain Jorge (`hero`, who commands the army); Felipe the Wizard
    (the clever one); Manolo the swordsman (the funny one); or the act's guardian. */
export type Speaker = 'narrator' | 'king' | 'hero' | 'wizard' | 'joker' | 'boss';
/** `pose`: the speaker's picture for a heated line (2 the wind-up, 3 the blow, 4 hurt); the standing one otherwise. */
export interface Line { who: Speaker; key: Key; pose?: number }
/** Siege Cartoon's story: the Darkness rises in the east to destroy everything, and our King marches to push it back. */
/** The heated lines: who says them is shown mid-action. */
const POSES: Record<string, number> = {
  siegeCtPrologue9: 2, siegeCtHalf1_1: 4, siegeCtHalf2_1: 4, siegeCtHalf3_1: 4, siegeCtHalf4_1: 4, siegeCtHalf5_1: 4, siegeCtHalf6_1: 4,
  siegeCtDown1_1: 5, siegeCtDown2_1: 5, siegeCtDown3_1: 5, siegeCtDown4_1: 5, siegeCtDown5_1: 5, siegeCtDown6_1: 5, siegeCtTalk3_3: 2, siegeCtTalk5_3: 2, siegeCtTalk6_4: 3,
  siegeCtBoss1_1: 3, siegeCtBoss1_2: 4, siegeCtBoss1_3: 3, siegeCtBoss2_1: 3, siegeCtBoss2_2: 2, siegeCtBoss3_1: 3, siegeCtBoss3_3: 3,
  siegeCtBoss4_1: 2, siegeCtBoss4_3: 3, siegeCtBoss5_1: 2, siegeCtBoss5_2: 3, siegeCtBoss5_3: 4, siegeCtBoss6_1: 2, siegeCtBoss6_2: 2, siegeCtBoss6_3: 3,
};
const line = (who: Speaker, key: string): Line => ({ who, key: key as Key, pose: POSES[key] });
const lines = (prefix: string, who: Speaker[]) => who.map((w, i) => line(w, `${prefix}${i + 1}`));
/** Told before the first act. */
const PROLOGUE = lines('siegeCtPrologue', ['narrator', 'narrator', 'king', 'wizard', 'joker', 'wizard', 'king', 'joker', 'hero']);
/** Each act's scene: the narrator sets it, then our side talks it over. */
const INTRO: Speaker[][] = [
  ['wizard', 'joker', 'hero'],
  ['joker', 'wizard', 'hero'],
  ['wizard', 'joker', 'hero'],
  ['joker', 'wizard', 'hero'],
  ['wizard', 'joker', 'hero'],
  ['king', 'wizard', 'joker', 'hero'],
];
/** What is said when the act's guardian joins the battle. */
const BOSS: Speaker[][] = [
  ['boss', 'joker', 'hero'],
  ['boss', 'wizard', 'joker'],
  ['boss', 'joker', 'hero'],
  ['boss', 'joker', 'wizard'],
  ['wizard', 'boss', 'joker'],
  ['boss', 'king', 'hero'],
];
/** The scene before an act (the prologue first in act 1). */
/** After the talk, the narrator tells what the act opens in the shop (acts 2 to 6). */
const NEWS = (act: number): Line[] => (act >= 2 ? [line('narrator', `siegeCtNew${act}`)] : []);
export const intro = (act: number): Line[] => [...(act === 1 ? PROLOGUE : []), line('narrator', `siegeCtStory${act}`), ...lines(`siegeCtTalk${act}_`, INTRO[act - 1] ?? []), ...NEWS(act)];
/** What is said when an act's guardian falls: its last words, then ours. */
const DOWN: Speaker[][] = [['boss', 'hero', 'joker'], ['boss', 'wizard', 'joker'], ['boss', 'joker', 'hero'], ['boss', 'joker', 'wizard'], ['boss', 'wizard', 'king'], ['boss', 'king', 'hero']];
export const bossDown = (act: number): Line[] => lines(`siegeCtDown${act}_`, DOWN[act - 1] ?? []);
export const bossTalk = (act: number): Line[] => lines(`siegeCtBoss${act}_`, BOSS[act - 1] ?? []);
/** A short exchange when the guardian joins the battle, the fight held for it. */
const ARRIVE: Speaker[][] = [['boss', 'joker'], ['boss', 'joker'], ['boss', 'hero'], ['boss', 'joker'], ['boss', 'wizard'], ['boss', 'king']];
/** What the guardian says at half its health, hurt (its hurt pose), and one of ours answers. */
const HALF: Speaker[][] = [['boss', 'hero'], ['boss', 'joker'], ['boss', 'wizard'], ['boss', 'joker'], ['boss', 'wizard'], ['boss', 'king']];
export const bossHalf = (act: number): Line[] => lines(`siegeCtHalf${act}_`, HALF[act - 1] ?? []);
export const bossArrive = (act: number): Line[] => lines(`siegeCtArrive${act}_`, ARRIVE[act - 1] ?? []);
/** After the last act is won. */
export const ending: Line[] = lines('siegeCtEnding', ['king', 'wizard', 'joker', 'hero']);
/** How far the Darkness has spread by an act, 0 (none) to 1: it darkens the act's battlefield and scenes. */
export const gloom = (act: number) => (act <= 0 ? 0 : 0.08 + (Math.min(6, act) - 1) * 0.15);
