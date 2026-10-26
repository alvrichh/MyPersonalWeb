import type { Key } from '../../strings';

/** Who speaks: the narrator; our King (the leader); the player's own hero, who commands the army; our Wizard (the clever
    one); our Swordsman (the funny one); or the act's guardian. */
export type Speaker = 'narrator' | 'king' | 'hero' | 'wizard' | 'joker' | 'boss';
export interface Line { who: Speaker; key: Key }
/** Siege Cartoon's story: the Darkness rises in the east to destroy everything, and our King marches to push it back. */
const line = (who: Speaker, key: string): Line => ({ who, key: key as Key });
const lines = (prefix: string, who: Speaker[]) => who.map((w, i) => line(w, `${prefix}${i + 1}`));
/** Told before the first act. */
const PROLOGUE = lines('siegeCtPrologue', ['narrator', 'king', 'wizard', 'joker', 'hero']);
/** Each act's scene: the narrator sets it, then our side talks it over. */
const INTRO: Speaker[][] = [
  ['wizard', 'joker', 'hero'],
  ['joker', 'wizard', 'hero'],
  ['wizard', 'joker', 'king'],
  ['joker', 'wizard', 'hero'],
  ['wizard', 'joker', 'king'],
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
export const intro = (act: number): Line[] => [...(act === 1 ? PROLOGUE : []), line('narrator', `siegeCtStory${act}`), ...lines(`siegeCtTalk${act}_`, INTRO[act - 1] ?? [])];
export const bossTalk = (act: number): Line[] => lines(`siegeCtBoss${act}_`, BOSS[act - 1] ?? []);
/** After the last act is won. */
export const ending: Line[] = lines('siegeCtEnding', ['king', 'wizard', 'joker', 'hero']);
/** How far the Darkness has spread by an act, 0 (none) to 1: it darkens the act's battlefield and scenes. */
export const gloom = (act: number) => (act <= 0 ? 0 : 0.08 + (Math.min(6, act) - 1) * 0.15);
