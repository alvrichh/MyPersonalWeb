import type { Key } from '../../strings';
import type { Line, Speaker } from '../legacy/story';

/** Siege Cartoon's story, the Blue Kingdom against the Red Ink: the narrator, our Wizard (`hero`) and each act's
    guardian (`boss`) speak. */
const line = (who: Speaker, key: string): Line => ({ who, key: key as Key });
/** Told before the first act. */
const PROLOGUE = [line('narrator', 'siegeCtPrologue1'), line('hero', 'siegeCtPrologue2')];
/** The scene before an act (the prologue first in act 1). */
export const intro = (act: number): Line[] => [...(act === 1 ? PROLOGUE : []), line('narrator', `siegeCtStory${act}`)];
/** What is said when the act's guardian joins the battle (in act 5 our Wizard speaks first). */
export const bossTalk = (act: number): Line[] => (act === 5
  ? [line('hero', 'siegeCtBoss5a'), line('boss', 'siegeCtBoss5b')]
  : [line('boss', `siegeCtBoss${act}a`), line('hero', `siegeCtBoss${act}b`)]);
/** After the last act is won. */
export const ending: Line[] = [line('narrator', 'siegeCtEnding')];
