import { ARSENAL, ITEMS, UPGRADES, itemLevel } from './shop';
import { SKINS, WORLD_SKINS, worldWon, type Save } from './save';
import { WORLD_COUNT } from './world';

/* Achievements: shown in the profile (`achievementsScreen` in `main.ts`) and announced by a toast the next time the
   menu opens. Each one is checked against the save (`checkAchievements`, after every run and purchase); once earned
   it stays, through a reset or a mastery too (`save.achieved`). The ones that count something come in tiers (bronze,
   silver, gold): each tier is earned on its own, the first under the achievement's id and the next as `id:2`, `id:3`.
   Each shows one of the game's own pictures (`pic`, under `static/images/game/`). Their name and text are `ach<Id>`
   and `ach<Id>Text` in `strings.ts`, the text with the tier's goal as `{n}`. */

export type AchId =
  | 'firstRun' | 'helloWorld' | 'exterminator' | 'croak' | 'nightmareHater' | 'insomniac' | 'dragonSlayer'
  | 'sprinter' | 'onCall' | 'rushKing' | 'somethingMoves' | 'spartan' | 'collector' | 'senior' | 'armoury'
  | 'smith' | 'fashion' | 'based' | 'scrooge' | 'legend' | 'veteran' | 'master' | 'reborn';

export type Ach = {
  id: AchId;
  /** The picture in its medal, and how much to zoom it (boss canvases have room round the figure). */
  pic: string;
  zoom?: number;
  /** The emoji for the retro look. */
  icon: string;
  /** How far along the save is, and the goal of each tier (one goal for a plain achievement). */
  value: (s: Save) => number;
  goals: number[];
};

const worlds = Array.from({ length: WORLD_COUNT }, (_, i) => i + 1);
const yes = (b: boolean) => (b ? 1 : 0);
const shopItems = ITEMS.filter((it) => !it.legendary);

export const ACHIEVEMENTS: Ach[] = [
  { id: 'firstRun', pic: 'skills/double.webp', icon: '🐛', value: (s) => s.runs, goals: [1, 25, 100] },
  { id: 'helloWorld', pic: 'map/pv-original.jpg', icon: '👋', value: (s) => yes(worldWon(s, 1)), goals: [1] },
  { id: 'exterminator', pic: 'enemies/original-bug-icon.webp', icon: '🧯', value: (s) => s.stats.killsByWorld[1] ?? 0, goals: [500, 2000, 5000] },
  { id: 'croak', pic: 'enemies/mud-bug-icon.webp', icon: '🐸', value: (s) => s.stats.killsByWorld[4] ?? 0, goals: [500, 2000, 5000] },
  { id: 'nightmareHater', pic: 'enemies/core-bug-icon.webp', icon: '😈', value: (s) => s.stats.nightmareKills, goals: [1000, 5000, 20000] },
  { id: 'insomniac', pic: 'fx/tornado-0.webp', icon: '🌙', value: (s) => Math.floor(s.stats.nightmareLongest / 60), goals: [5, 10, 20] },
  { id: 'dragonSlayer', pic: 'bosses/chimera-0.webp', zoom: 1.7, icon: '🐉', value: (s) => yes(worldWon(s, WORLD_COUNT)), goals: [1] },
  { id: 'sprinter', pic: 'skills/shoes.webp', icon: '🏃', value: (s) => worlds.filter((w) => s.bestByWorld[w]?.time !== undefined).length, goals: [3, 6, WORLD_COUNT] },
  { id: 'onCall', pic: 'skills/safe.webp', icon: '📟', value: (s) => worlds.filter((w) => s.hordeBest[w]?.won).length, goals: [3, 6, WORLD_COUNT] },
  { id: 'rushKing', pic: 'items/crown.webp', icon: '👑', value: (s) => yes(!!s.rushBest?.won), goals: [1] },
  { id: 'somethingMoves', pic: 'map/soon.webp', zoom: 1.2, icon: '❓', value: (s) => yes(!!s.secretBest), goals: [1] },
  { id: 'spartan', pic: 'bosses/kratos2-0.webp', zoom: 1.8, icon: '⚔️', value: (s) => yes(!!s.secretBest?.won), goals: [1] },
  { id: 'collector', pic: 'fx/chest.webp', icon: '🛍️', value: (s) => shopItems.filter((it) => s.owned.includes(it.id)).length, goals: [5, 15, shopItems.length] },
  { id: 'senior', pic: 'items/seniorTome.webp', icon: '📜', value: (s) => yes(s.owned.includes('seniorTome')), goals: [1] },
  { id: 'armoury', pic: 'skills/rocket.webp', icon: '💣', value: (s) => ARSENAL.filter((a) => s.arsenal.includes(a.id)).length, goals: [1, 4, ARSENAL.length] },
  { id: 'smith', pic: 'forge/might.webp', icon: '⚒️', value: (s) => UPGRADES.filter((u) => (s.upgrades[u.id] ?? 0) >= u.max).length, goals: [1, 4, UPGRADES.length] },
  { id: 'fashion', pic: 'hero/robot-base-front.webp', zoom: 1.5, icon: '🕶️', value: (s) => SKINS.filter((k) => s.skins.includes(k)).length, goals: [2, SKINS.length] },
  { id: 'based', pic: 'hero/swamp-base-front.webp', zoom: 1.5, icon: '😎', value: (s) => WORLD_SKINS.filter((k) => s.skins.includes(k)).length, goals: [WORLD_SKINS.length] },
  { id: 'scrooge', pic: 'ui/wheel/coins.webp', icon: '💰', value: (s) => Math.floor(s.coins), goals: [5000, 20000, 50000] },
  { id: 'legend', pic: 'skills/headshot.webp', icon: '🏆', value: (s) => s.stats.kills, goals: [1000, 10000, 50000] },
  { id: 'veteran', pic: 'items/hourglass.webp', icon: '⏱️', value: (s) => Math.floor((s.playTime || 0) / 3600), goals: [1, 5, 20] },
  { id: 'master', pic: 'ui/mastery.webp', icon: '⭐', value: (s) => s.masteries, goals: [1, 2, 3] },
  { id: 'reborn', pic: 'items/phoenix.webp', icon: '🔥', value: (s) => yes(s.owned.includes('phoenix') && itemLevel(s.itemLevels, 'phoenix') >= 3), goals: [1] },
];

/** The key a tier is kept under: the achievement's id for the first, `id:2`, `id:3` for the next. */
export const tierKey = (id: AchId, tier: number) => (tier <= 1 ? id : `${id}:${tier}`);
/** How many tiers of it are earned. */
export const tiersDone = (s: Save, a: Ach) => a.goals.filter((_, i) => s.achieved[tierKey(a.id, i + 1)]).length;
/** Every tier there is, and every tier earned. */
export const achTotal = () => ACHIEVEMENTS.reduce((n, a) => n + a.goals.length, 0);
export const achEarned = (s: Save) => ACHIEVEMENTS.reduce((n, a) => n + tiersDone(s, a), 0);

/** Marks every tier the save now meets, and queues each new one for the menu's toast; the new ones. */
export function checkAchievements(s: Save): string[] {
  const fresh: string[] = [];
  for (const a of ACHIEVEMENTS) {
    const now = a.value(s);
    a.goals.forEach((goal, i) => {
      const key = tierKey(a.id, i + 1);
      if (!s.achieved[key] && now >= goal) { s.achieved[key] = Date.now(); fresh.push(key); }
    });
  }
  s.achNew.push(...fresh);
  return fresh;
}
