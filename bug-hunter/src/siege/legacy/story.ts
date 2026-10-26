import type { Key } from '../../strings';

/** Who speaks a line: the narrator, the player's commander (their hero), or the world's guardian. */
export type Speaker = 'narrator' | 'hero' | 'boss';
export interface Line { who: Speaker; key: Key }
/** Each world's guardian name, the same names its bosses carry in the action modes. */
export const GUARDIAN_NAMES: Key[] = ['bossOriginal', 'bossDemon', 'bossViking', 'bossMud', 'finalQueen', 'bossGreek', 'bossRobot', 'finalWraith', 'bossCore'];
const line = (who: Speaker, key: string): Line => ({ who, key: key as Key });
/** The campaign's prologue, told before the first fortress. */
const PROLOGUE = [line('narrator', 'siegePrologue1'), line('hero', 'siegePrologue2'), line('narrator', 'siegePrologue3')];
/** The scene before a world's fortress (the prologue first in world 1). */
export const intro = (world: number): Line[] => [...(world === 1 ? PROLOGUE : []), line('narrator', `siegeStory${world}a`), line('hero', `siegeStory${world}b`)];
/** What the guardian says when it joins the battle, and the answer. */
export const bossTalk = (world: number): Line[] => [line('boss', `siegeBoss${world}a`), line('hero', `siegeBoss${world}b`)];
