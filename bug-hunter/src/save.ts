import { CONVERGENCE_SCENE } from './scenery';
import { storage } from '../lib/storage';
import { ARSENAL, ITEMS, type ItemId, type Slot, type Upgrades } from './shop';
import { WORLD_COUNT, type Mode, type SkillId } from './world';
import type { SongPick } from './audio';

/* Everything Bug Hunter remembers between runs, in one localStorage key. */

export type EnemyStyle = 'world' | 'original' | 'demon' | 'viking' | 'mud' | 'jungle' | 'greek' | 'robot' | 'nightmare' | 'core' | 'random';
export const STYLES: EnemyStyle[] = ['world', 'original', 'demon', 'viking', 'mud', 'jungle', 'greek', 'robot', 'nightmare', 'core', 'random'];

/** Alvrich, the robot, Kitty, and Alvrich dressed for each world (the owner's sheets, one a world in order). */
export type HeroSkin = 'boy' | 'robot' | 'kitty' | 'intern' | 'lava' | 'arctic' | 'swamp' | 'jungle' | 'gladiator' | 'mech' | 'ghost' | 'dragon' | 'kratos' | 'medusa' | 'weso' | 'reaper'
  | 'duck' | 'box' | 'hacker' | 'king' | 'potato' | 'suit';
/** Special skins, the dearest kind (the owner's rule), hatless like the world ones. */
export const SPECIAL_SKINS = ['kratos', 'medusa', 'weso', 'reaper'] as const;
/** The owner's second family of special skins (1.14.35), on sale from the start, with their own back walk. */
export const NEW_SKINS = ['duck', 'box', 'hacker', 'king', 'potato', 'suit'] as const;
export const WORLD_SKINS = ['intern', 'lava', 'arctic', 'swamp', 'jungle', 'gladiator', 'mech', 'ghost', 'dragon'] as const;
// Alvrich, then the world skins in world order, and the special ones (the dearest) at the end of the list.
export const SKINS: HeroSkin[] = ['boy', ...WORLD_SKINS, 'robot', 'kitty', ...NEW_SKINS, ...SPECIAL_SKINS];
/** What each figure costs in coins; Alvrich comes free. The owner's rule: skins are always the dearest thing in the game (items, forge levels, the revive), so raise these if anything else goes past them. */
/** What each figure costs in coins once it is open (`skinOpen`); Alvrich comes free. The owner's rule: the special
    skins (robot, Kitty and the boss-like ones) are the dearest thing in the game; the world skins are plain outfits,
    1000, and the intern, the first, 500. */
export const SKIN_PRICE: Record<HeroSkin, number> = {
  boy: 0, robot: 10000, kitty: 10000, kratos: 10000, medusa: 10000, weso: 10000, reaper: 10000,
  duck: 5000, box: 5000, hacker: 8000, king: 10000, potato: 5000, suit: 8000,
  intern: 500, lava: 1000, arctic: 1000, swamp: 1000, jungle: 1000, gladiator: 1000, mech: 1000, ghost: 1000, dragon: 1000,
};
/** The hats are painted on the hero's pictures; a skin listed here has no hat versions and always shows its base set. */
const HATLESS: HeroSkin[] = ['kitty', ...SPECIAL_SKINS, ...WORLD_SKINS, ...NEW_SKINS];
const HAT_SET: Record<string, string> = { wizardHat: 'wizard', gladHelm: 'helm', bandana: 'bandana', crown: 'crown' };
/** Hats painted only for some skins (Kitty wears none, see HATLESS). */
const HAT_SKINS: Record<string, HeroSkin[]> = { crown: ['boy', 'robot'] };
/** The picture set for a skin with a head item: `hero/<key>-<pose>.webp`. */
export const heroKey = (skin: HeroSkin, head?: string) =>
  `${skin}-${(!HATLESS.includes(skin) && head && (HAT_SKINS[head]?.includes(skin) ?? true) && HAT_SET[head]) || 'base'}`;
/** Picture sets with the owner's full nine poses (front, second step, hurt, knocked out). */
export const FULL_HERO_SETS = [
  'boy-base', 'boy-wizard', 'boy-helm', 'boy-bandana', 'boy-crown',
  'robot-base', 'robot-wizard', 'robot-helm', 'robot-bandana', 'robot-crown', 'kitty-base',
  ...[...SPECIAL_SKINS, ...WORLD_SKINS, ...NEW_SKINS].map((s) => `${s}-base`),
];
/** The still picture for menus: facing the camera where the set has it, else the side idle. */
export const heroStill = (skin: HeroSkin, head?: string) => {
  const key = heroKey(skin, head);
  return `${key}-${FULL_HERO_SETS.includes(key) ? 'front' : 'idle'}`;
};

/** The three ways to play: the two of `world.ts` and the board's. */
export type PlayMode = Mode | 'board';

/** A friend kept in the save: their id, name and standing picture as last seen. */
export type Friend = { id: string; name: string; still: string };
export const NET_ID = /^[a-z0-9]{10}$/;
export const makeNetId = () => Array.from({ length: 10 }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 32)]).join('');
export type Save = {
  /** The player's name, shown on the cover and the profile (the hero is alvrich by default). */
  name: string;
  coins: number;
  /** Which figure the hero is drawn as. */
  skin: HeroSkin;
  /** The figures bought (Alvrich is always there). */
  skins: HeroSkin[];
  /** Retro look: no painted textures, the plain panels and the ring hero from before. */
  retro: boolean;
  owned: ItemId[];
  /** Levels of the owned items that can be upgraded (the Phoenix cloak); missing means level 1. */
  itemLevels: Partial<Record<ItemId, number>>;
  /** Arsenal weapons bought in the shop. */
  arsenal: SkillId[];
  /** When the shop's ad gift was last taken (ms since 1970; one every `AD_GIFT_EVERY`). */
  adGiftAt: number;
  /** The guide (the book on the cover) has been opened once: until then the first visit dims the cover round it. */
  bookSeen: boolean;
  /** Your id among players, made once: friends find you by it (`bughunter-p-<id>`, `presence` in `net.ts`). */
  netId: string;
  /** The friends you have linked with, to find again without a code. */
  friends: Friend[];
  /** When the daily chest was last opened (ms since 1970); the next is ready 24 hours later (`daily.ts`). */
  dailyAt: number;
  /** Coin-store purchases made (pack and offer ids, `store.ts`); an offer can be bought once. */
  purchases: string[];
  equipped: Partial<Record<Slot, ItemId>>;
  /** The extra charm: bought once, it holds one more item of any kind besides the six slots (the slot stays through a reset or a mastery; what it holds goes with the items). */
  extraSlot: boolean;
  extra?: ItemId;
  /** The forge: permanent upgrade levels. */
  upgrades: Upgrades;
  style: EnemyStyle;
  /** Saves from before worlds had their own cast default to 'world' once. */
  styleV2: boolean;
  /** Saves from before the mud world was put in as world 4: their records from world 4 on move up one, once. */
  mudWorld: boolean;
  /** The world whose floor and blocks every run draws (0: each world its own), to try them out. */
  scene: number;
  /** Which song plays: 'auto' (the original, and the final boss's own song in that fight), or one song always. */
  song: SongPick;
  music: number;
  sfx: number;
  best: { room: number; time?: number };
  /** Best run per world (world 1 is also `best`, kept for older saves). */
  bestByWorld: Record<number, { room: number; time?: number }>;
  /** Worlds you may enter: 1 to `unlocked`. */
  unlocked: number;
  /** The world picked on the map. */
  world: number;
  /** Sprints (rooms), on call (the ten-minute horde) or the board (the auto battler, `board.ts`). */
  mode: PlayMode;
  /** On call keeps its own world progress: worlds you may enter there, and the one picked. */
  hordeUnlocked: number;
  hordeWorld: number;
  /** The board keeps its own world progress and records too: the furthest round reached, and whether it was won. */
  boardUnlocked: number;
  boardWorld: number;
  boardBest: Record<number, { round: number; won: boolean }>;
  /** Tactics, the board's second way to play: its own records (the worlds it opens are shared), and the last pick. */
  boardBestT: Record<number, { round: number; won: boolean }>;
  boardVariant: 'fusion' | 'tactics';
  /** Masteries earned: one each time every world of both modes is cleared and the progress reset, for a small
      permanent boost. (Older saves kept one count per mode, `mastery`; `loadSave()` adds them up.) */
  masteries: number;
  /** The colour of the mastery stars by the player's name. */
  starColor: StarColor;
  /** Best on-call shift per world: how long you held out, bugs squashed, whether the last boss fell. */
  hordeBest: Record<number, { time: number; kills: number; won: boolean }>;
  /** Nightmare's longest run (no clock, so the time is the record). */
  nightmareBest: { time: number; kills: number } | null;
  /** Boss Rush: the furthest boss reached (out of how many), and the time, the fastest of the cleared ones. */
  rushBest: { stage: number; stages: number; time: number; won: boolean } | null;
  /** The secret shift (Kratos, behind the map's «coming soon» island on call): the best run, a won one above all. */
  secretBest: { time: number; kills: number; won: boolean } | null;
  runs: number;
  /** Seconds played in runs, all told; kept through a reset or a mastery. */
  playTime: number;
  /** All the XP ever picked up: the profile level on the title screen. */
  xp: number;
  /** Lifetime totals the achievements count (kept through a reset or a mastery): bugs squashed, per world (by the
      world a run is played in) and in Nightmare, and Nightmare's longest run in seconds. */
  stats: { kills: number; killsByWorld: Record<number, number>; nightmareKills: number; nightmareLongest: number };
  /** Achievements earned (id → when, ms since 1970), kept through a reset or a mastery (`achievements.ts`). */
  achieved: Record<string, number>;
  /** Achievements earned but not announced yet: the menu toasts them the next time it opens. */
  achNew: string[];
};

const KEY = 'bugHunter';

export const STAR_COLORS = { gold: '#fcd34d', cyan: '#67e8f9', pink: '#f472b6', green: '#4ade80', purple: '#c084fc', red: '#f87171', white: '#f8fafc' } as const;
export type StarColor = keyof typeof STAR_COLORS;
export const DEFAULT_NAME = 'alvrich';
export const NAME_MAX = 14;
/** A name as typed, made safe to keep: trimmed, single spaces, no control characters, at most NAME_MAX long. */
export const cleanName = (raw: string) => raw.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);

const fresh = (): Save => ({
  name: DEFAULT_NAME,
  coins: 0,
  skin: 'boy',
  skins: ['boy'],
  retro: false,
  owned: [],
  itemLevels: {},
  arsenal: [],
  adGiftAt: 0,
  bookSeen: false,
  netId: '',
  friends: [],
  dailyAt: 0,
  purchases: [],
  equipped: {},
  extraSlot: false,
  upgrades: {},
  style: 'world',
  styleV2: true,
  mudWorld: true,
  scene: 0,
  song: 'worlds',
  music: 0.6,
  sfx: 0.8,
  best: { room: 0 },
  bestByWorld: {},
  unlocked: 1,
  world: 1,
  mode: 'sprints',
  hordeUnlocked: 1,
  hordeWorld: 1,
  boardUnlocked: 1,
  boardWorld: 1,
  boardBest: {},
  boardBestT: {},
  boardVariant: 'fusion',
  masteries: 0,
  starColor: 'gold',
  hordeBest: {},
  nightmareBest: null,
  rushBest: null,
  secretBest: null,
  runs: 0,
  playTime: 0,
  xp: 0,
  stats: { kills: 0, killsByWorld: {}, nightmareKills: 0, nightmareLongest: 0 },
  achieved: {},
  achNew: [],
});

export function loadSave(): Save {
  const base = fresh();
  try {
    const data = JSON.parse(storage.get(KEY) || '{}') as Partial<Save>;
    const save: Save = { ...base, ...data, equipped: {}, upgrades: { ...data.upgrades }, itemLevels: { ...data.itemLevels }, best: { ...base.best, ...data.best }, bestByWorld: { ...data.bestByWorld }, hordeBest: { ...data.hordeBest }, boardBest: { ...data.boardBest }, boardBestT: { ...data.boardBestT } };
    if (save.mode !== 'sprints' && save.mode !== 'horde' && save.mode !== 'board') save.mode = 'sprints';
    save.stats = { ...base.stats, ...data.stats, killsByWorld: { ...data.stats?.killsByWorld } };
    // Older saves knew Nightmare's longest run before the totals came in.
    save.stats.nightmareLongest = Math.max(save.stats.nightmareLongest, data.nightmareBest?.time ?? 0);
    save.achieved = { ...data.achieved };
    if (!NET_ID.test(save.netId)) save.netId = makeNetId();
    save.friends = (Array.isArray(data.friends) ? data.friends : []).filter((f) => f && NET_ID.test(f.id) && f.id !== save.netId).slice(0, 30).map((f) => ({ id: f.id, name: cleanName(String(f.name)) || '?', still: String(f.still ?? '').replace(/[^a-z-]/g, '') }));
    save.achNew = Array.isArray(data.achNew) ? data.achNew.filter((id) => typeof id === 'string') : [];
    // The mud world came in as world 4: what an older save kept for worlds 4–8 belongs to 5–9 now.
    if (!data.mudWorld) {
      const up = <T,>(rec: Record<number, T>) => Object.fromEntries(Object.entries(rec).map(([w, v]) => [Number(w) >= 4 ? Number(w) + 1 : Number(w), v])) as Record<number, T>;
      save.bestByWorld = up(save.bestByWorld);
      save.hordeBest = up(save.hordeBest);
      for (const key of ['world', 'hordeWorld', 'scene', 'hordeUnlocked'] as const) if (save[key] >= 4) save[key] += 1;
      save.mudWorld = true;
    }
    // Saves from before the split: on call opens the worlds after any shift it already cleared.
    if (!data.hordeUnlocked) {
      const cleared = Object.entries(save.hordeBest).filter(([, b]) => b.won).map(([w]) => Number(w));
      save.hordeUnlocked = Math.max(1, ...cleared.map((w) => w + 1));
    }
    save.hordeUnlocked = Math.min(Math.max(1, save.hordeUnlocked || 1), WORLD_COUNT);
    save.hordeWorld = Math.min(Math.max(1, save.hordeWorld || 1), save.hordeUnlocked);
    // The masteries were one per mode; now there is one, for clearing both: what an older save earned counts.
    const old = (data as { mastery?: { sprints?: number; horde?: number } }).mastery;
    delete (save as { mastery?: unknown }).mastery;
    save.masteries = Math.max(0, Math.floor(Number(data.masteries ?? (old?.sprints ?? 0) + (old?.horde ?? 0)) || 0));
    if (!(save.starColor in STAR_COLORS)) save.starColor = 'gold';
    // The first daily chest counted calendar days: one opened on a day is ready again at the next midnight.
    const oldDay = (data as { dailyDay?: string }).dailyDay;
    delete (save as { dailyDay?: string }).dailyDay;
    if (!save.dailyAt && oldDay) {
      const [y, m, d] = oldDay.split('-').map(Number);
      save.dailyAt = new Date(y, m - 1, d).getTime() || 0;
    }
    save.name = cleanName(typeof save.name === 'string' ? save.name : '') || DEFAULT_NAME;
    save.arsenal = (data.arsenal ?? []).filter((id) => ARSENAL.some((w) => w.id === id));
    // Items are re-seated by their current slot (older saves had `charm` and `relic`).
    save.owned = (data.owned ?? []).filter((id) => ITEMS.some((item) => item.id === id));
    for (const id of Object.values(data.equipped ?? {})) {
      const item = ITEMS.find((it) => it.id === id);
      if (item && save.owned.includes(item.id)) save.equipped[item.slot] = item.id;
    }
    // The extra charm holds an owned item that is not already worn in its own slot.
    save.extraSlot = data.extraSlot === true;
    if (!save.extraSlot || !save.extra || !save.owned.includes(save.extra) || Object.values(save.equipped).includes(save.extra)) delete save.extra;
    if (!STYLES.includes(save.style)) save.style = 'world';
    // Only the first world kept both versions of its song: a first version picked for another world plays its second now.
    if (/^w[2-8]$/.test(save.song)) save.song = `${save.song}v2` as SongPick;
    if (!/^(auto|worlds|b2b|breaks|doom|w1|w[1-8]v2|mudv2|boss-(kernel|archdemon|drakkar|medusa|queen|zeus|mech|wraith|chimera))$/.test(save.song)) save.song = 'worlds';
    if (save.scene !== CONVERGENCE_SCENE && !(Number.isInteger(save.scene) && save.scene >= 0 && save.scene <= WORLD_COUNT)) save.scene = 0;
    if (!SKINS.includes(save.skin)) save.skin = 'boy';
    // Skins cost coins now: the free one, plus whichever an older save already wore.
    save.skins = [...new Set<HeroSkin>(['boy', save.skin, ...(data.skins ?? [])])].filter((s) => SKINS.includes(s));
    if (!data.styleV2) { save.style = 'world'; save.styleV2 = true; }
    save.unlocked = Math.max(1, save.unlocked || 1);
    save.world = Math.min(Math.max(1, save.world || 1), save.unlocked);
    // The old best-run key from the first version, if any.
    if (!save.best.room) {
      try {
        const old = JSON.parse(storage.get('bugHunterBest') || '') as Save['best'];
        if (old && old.room) save.best = old;
      } catch {
        /* nothing saved */
      }
    }
    if (!save.bestByWorld[1] && save.best.room) save.bestByWorld[1] = save.best;
    // A finished world 1 from before the map unlocks world 2.
    if (save.best.time !== undefined && save.unlocked < 2) save.unlocked = 2;
    // Each mode's progress is what its own records show: a world is open once the one before it was won in
    // that mode. Before the split (and on a page cached from then) an on-call win also opened sprint worlds.
    const nextAfter = (won: number[]) => Math.min(WORLD_COUNT, Math.max(1, ...won.map((w) => w + 1)));
    save.unlocked = nextAfter(Object.entries(save.bestByWorld).filter(([, b]) => b?.time !== undefined).map(([w]) => Number(w)));
    save.hordeUnlocked = nextAfter(Object.entries(save.hordeBest).filter(([, b]) => b?.won).map(([w]) => Number(w)));
    save.world = Math.min(save.world, save.unlocked);
    save.hordeWorld = Math.min(save.hordeWorld, save.hordeUnlocked);
    save.boardUnlocked = nextAfter([...Object.entries(save.boardBest), ...Object.entries(save.boardBestT)].filter(([, b]) => b?.won).map(([w]) => Number(w)));
    save.boardWorld = Math.min(Math.max(1, save.boardWorld || 1), save.boardUnlocked);
    return save;
  } catch {
    return { ...base, netId: makeNetId() };
  }
}

/** Profile level from lifetime XP: 200 for the first, a little more each time. */
export function profileLevel(xp: number) {
  let level = 1;
  let need = 200;
  let left = xp;
  while (left >= need) {
    left -= need;
    level += 1;
    need = Math.round(need * 1.15);
  }
  return { level, progress: left / need };
}

/** A world won in either mode: a sprint run cleared or an on-call shift completed (the board, with no shop of its own, opens nothing). */
export const worldWon = (save: Save, n: number) => save.bestByWorld[n]?.time !== undefined || !!save.hordeBest[n]?.won;

/** Back to a fresh start: progress, coins, gear and level go; name, skins bought, settings, masteries, star colour, the lifetime totals, the achievements and the extra charm's slot (empty: what it held goes with the items) stay. */
export function wipeProgress(save: Save) {
  const keep = { name: save.name, skin: save.skin, skins: [...save.skins], retro: save.retro, style: save.style, scene: save.scene, song: save.song, music: save.music, sfx: save.sfx, mode: save.mode, masteries: save.masteries, extraSlot: save.extraSlot, starColor: save.starColor, playTime: save.playTime, dailyAt: save.dailyAt, purchases: [...save.purchases], stats: save.stats, achieved: save.achieved, achNew: save.achNew, bookSeen: save.bookSeen, netId: save.netId, friends: [...save.friends] };
  Object.assign(save, fresh(), keep);
  // `fresh()` has no `extra`, so the item the charm held would stay worn without being owned.
  delete save.extra;
}

export function writeSave(save: Save) {
  storage.set(KEY, JSON.stringify(save));
}

/** What opens a skin for sale (the owner's rules): world skin n once world n − 1 is won in any mode (the intern, world
    1's, from the start); a special one once its final boss falls in On call (the secret shift's Kratos for the Spartan).
    Robot and Kitty are on sale from the start. */
export type SkinGate = { world: number } | { boss: number } | { secret: true } | null;
export const SKIN_GATE: Record<HeroSkin, SkinGate> = {
  boy: null, robot: null, kitty: null, intern: null,
  duck: null, box: null, hacker: null, king: null, potato: null, suit: null,
  lava: { world: 1 }, arctic: { world: 2 }, swamp: { world: 3 }, jungle: { world: 4 }, gladiator: { world: 5 }, mech: { world: 6 }, ghost: { world: 7 }, dragon: { world: 8 },
  weso: { boss: 1 }, medusa: { boss: 4 }, reaper: { boss: 8 }, kratos: { secret: true },
};
/** Testing switch (the owner's call, 1.14.31): every skin on sale for 0 coins. Each still has to be bought to be owned
    (it is then in the save); set to false to bring back the gates and prices above. */
export const FREE_SKINS = false;
/** What a skin costs now: 0 while `FREE_SKINS` is on. */
export const skinPrice = (skin: HeroSkin) => (FREE_SKINS ? 0 : SKIN_PRICE[skin]);
/** Whether the player has bought a skin. */
export const ownsSkin = (save: Save, skin: HeroSkin) => save.skins.includes(skin);
export function skinOpen(save: Save, skin: HeroSkin) {
  if (FREE_SKINS) return true;
  const g = SKIN_GATE[skin];
  if (!g || save.skins.includes(skin)) return true;
  if ('world' in g) return worldWon(save, g.world) || save.boardUnlocked > g.world;
  if ('boss' in g) return !!save.hordeBest[g.boss]?.won;
  return !!save.secretBest?.won;
}

