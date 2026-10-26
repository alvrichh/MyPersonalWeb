import type { Key } from '../../strings';

/** Who speaks: the narrator, our King (prologue and ending), our Wizard on the field (`hero`), or the act's guardian. */
export type Speaker = 'narrator' | 'king' | 'hero' | 'boss';
export interface Line { who: Speaker; key: Key }
/** Siege Cartoon's story: the Darkness rises in the east to destroy everything, and our King marches to push it back. */
const line = (who: Speaker, key: string): Line => ({ who, key: key as Key });
/** Told before the first act. */
const PROLOGUE = [line('narrator', 'siegeCtPrologue1'), line('king', 'siegeCtPrologue2')];
/** The scene before an act (the prologue first in act 1). */
export const intro = (act: number): Line[] => [...(act === 1 ? PROLOGUE : []), line('narrator', `siegeCtStory${act}`)];
/** What is said when the act's guardian joins the battle (in act 5 our Wizard speaks first). */
export const bossTalk = (act: number): Line[] => (act === 5
  ? [line('hero', 'siegeCtBoss5a'), line('boss', 'siegeCtBoss5b')]
  : [line('boss', `siegeCtBoss${act}a`), line('hero', `siegeCtBoss${act}b`)]);
/** After the last act is won. */
export const ending: Line[] = [line('king', 'siegeCtEnding')];
/** How far the Darkness has spread by an act, 0 (none) to 1: it darkens the act's battlefield and scenes. */
export const gloom = (act: number) => (act <= 0 ? 0 : 0.08 + (Math.min(6, act) - 1) * 0.15);
