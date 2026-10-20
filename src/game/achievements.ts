import { ARSENAL, ITEMS, UPGRADES, itemLevel } from './shop';
import { SKINS, worldWon, type Save } from './save';
import { WORLD_COUNT } from './world';

/* Achievements: shown in the profile (`achievementsScreen` in `main.ts`) and announced by a toast the next time the
   menu opens. Each one is checked against the save (`checkAchievements`, after every run and purchase); once earned
   it stays, through a reset or a mastery too (`save.achieved`). Their name and text are `ach<Id>` and
   `ach<Id>Text` in `strings.ts`. */

export type AchId =
  | 'firstRun' | 'helloWorld' | 'exterminator' | 'croak' | 'nightmareHater' | 'insomniac' | 'dragonSlayer'
  | 'sprinter' | 'onCall' | 'rushKing' | 'somethingMoves' | 'spartan' | 'collector' | 'senior' | 'armoury'
  | 'smith' | 'fashion' | 'scrooge' | 'legend' | 'veteran' | 'master' | 'reborn';

type Ach = { id: AchId; icon: string; /** How far along: [now, goal]. */ progress: (s: Save) => [number, number] };

const worlds = Array.from({ length: WORLD_COUNT }, (_, i) => i + 1);
const yes = (b: boolean): [number, number] => [b ? 1 : 0, 1];
const shopItems = ITEMS.filter((it) => !it.legendary);

export const ACHIEVEMENTS: Ach[] = [
  { id: 'firstRun', icon: '🐛', progress: (s) => [Math.min(s.runs, 1), 1] },
  { id: 'helloWorld', icon: '👋', progress: (s) => yes(worldWon(s, 1)) },
  { id: 'exterminator', icon: '🧯', progress: (s) => [s.stats.killsByWorld[1] ?? 0, 500] },
  { id: 'croak', icon: '🐸', progress: (s) => [s.stats.killsByWorld[4] ?? 0, 500] },
  { id: 'nightmareHater', icon: '😈', progress: (s) => [s.stats.nightmareKills, 1000] },
  { id: 'insomniac', icon: '🌙', progress: (s) => [Math.floor(s.stats.nightmareLongest / 60), 10] },
  { id: 'dragonSlayer', icon: '🐉', progress: (s) => yes(worldWon(s, WORLD_COUNT)) },
  { id: 'sprinter', icon: '🏃', progress: (s) => [worlds.filter((w) => s.bestByWorld[w]?.time !== undefined).length, WORLD_COUNT] },
  { id: 'onCall', icon: '📟', progress: (s) => [worlds.filter((w) => s.hordeBest[w]?.won).length, WORLD_COUNT] },
  { id: 'rushKing', icon: '👑', progress: (s) => yes(!!s.rushBest?.won) },
  { id: 'somethingMoves', icon: '❓', progress: (s) => yes(!!s.secretBest) },
  { id: 'spartan', icon: '⚔️', progress: (s) => yes(!!s.secretBest?.won) },
  { id: 'collector', icon: '🛍️', progress: (s) => [shopItems.filter((it) => s.owned.includes(it.id)).length, shopItems.length] },
  { id: 'senior', icon: '📜', progress: (s) => yes(s.owned.includes('seniorTome')) },
  { id: 'armoury', icon: '💣', progress: (s) => [ARSENAL.filter((a) => s.arsenal.includes(a.id)).length, ARSENAL.length] },
  { id: 'smith', icon: '⚒️', progress: (s) => [UPGRADES.filter((u) => (s.upgrades[u.id] ?? 0) >= u.max).length, UPGRADES.length] },
  { id: 'fashion', icon: '🕶️', progress: (s) => [SKINS.filter((k) => s.skins.includes(k)).length, SKINS.length] },
  { id: 'scrooge', icon: '💰', progress: (s) => [Math.min(Math.floor(s.coins), 20000), 20000] },
  { id: 'legend', icon: '🏆', progress: (s) => [s.stats.kills, 10000] },
  { id: 'veteran', icon: '⏱️', progress: (s) => [Math.floor((s.playTime || 0) / 3600), 5] },
  { id: 'master', icon: '⭐', progress: (s) => yes(s.mastery.sprints + s.mastery.horde > 0) },
  { id: 'reborn', icon: '🔥', progress: (s) => yes(s.owned.includes('phoenix') && itemLevel(s.itemLevels, 'phoenix') >= 3) },
];

export const achDone = (s: Save, id: AchId) => !!s.achieved[id];

/** Marks every achievement the save now meets, and queues each new one for the menu's toast; the new ones. */
export function checkAchievements(s: Save): AchId[] {
  const fresh: AchId[] = [];
  for (const a of ACHIEVEMENTS) {
    if (s.achieved[a.id]) continue;
    const [now, goal] = a.progress(s);
    if (now >= goal) { s.achieved[a.id] = Date.now(); fresh.push(a.id); }
  }
  s.achNew.push(...fresh);
  return fresh;
}
