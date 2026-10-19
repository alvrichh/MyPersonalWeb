/* The daily chest: once a day (by the player's own calendar) the cover's
   chest opens a wheel of free prizes: coins, an arsenal weapon, an outfit or
   an accessory from the shop, and very rarely a skin. The prize is drawn by
   its odds before the wheel spins; the spin only lands on a slice of it.
   Nothing here is ever bought with money. */

import { ARSENAL, ITEMS, type ItemId } from './shop';
import { SKINS, worldWon, type HeroSkin, type Save } from './save';
import type { SkillId } from './world';

export type DailyPrize = 'coins' | 'coinsBig' | 'jackpot' | 'weapon' | 'outfit' | 'accessory' | 'skin';

/** The slices clockwise from the top, on the wheel's painted wedges (gold,
    red, green, gold, purple, gold, red, green, purple, blue): gold coins, red
    the two jackpots, purple a weapon, green an outfit, blue an accessory. */
export const DAILY_WHEEL: DailyPrize[] = ['coins', 'skin', 'outfit', 'coinsBig', 'weapon', 'coins', 'jackpot', 'outfit', 'weapon', 'accessory'];

/** Chances in percent (they add up to 100): a skin is 0.3%. */
export const DAILY_ODDS: Record<DailyPrize, number> = {
  coins: 45, coinsBig: 24, jackpot: 4, weapon: 9, outfit: 9, accessory: 8.7, skin: 0.3,
};
export const DAILY_COINS = { coins: 150, coinsBig: 400, jackpot: 1500 };

/** The player's own calendar day, YYYY-MM-DD. */
export const today = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
export const dailyReady = (save: Save, now = new Date()) => save.dailyDay !== today(now);
/** Milliseconds until midnight, when the next chest is ready. */
export const untilTomorrow = (now = new Date()) => {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
};

export type DailyResult = { prize: DailyPrize; coins?: number; weapon?: SkillId; item?: ItemId; skin?: HeroSkin };

/* What can still be won: weapons on sale (their world won) and not bought,
   armour not owned (outfits are body items, accessories head and boots), and
   the paid skins not owned. */
const pools = (save: Save) => ({
  weapon: ARSENAL.filter((a) => worldWon(save, a.world) && !save.arsenal.includes(a.id)).map((a) => a.id),
  outfit: ITEMS.filter((i) => i.slot === 'body' && !i.legendary && !save.owned.includes(i.id)).map((i) => i.id),
  accessory: ITEMS.filter((i) => (i.slot === 'head' || i.slot === 'boots') && !i.legendary && !save.owned.includes(i.id)).map((i) => i.id),
  skin: SKINS.filter((s) => s !== 'boy' && !save.skins.includes(s)),
});

/** Opens today's chest: draws the prize, gives it and marks the day. A prize with nothing left to win becomes coins. */
export function openDaily(save: Save, rand = Math.random): DailyResult {
  const any = <T>(list: T[]) => list[Math.floor(rand() * list.length)];
  let roll = rand() * 100;
  let prize: DailyPrize = 'coins';
  for (const p of Object.keys(DAILY_ODDS) as DailyPrize[]) {
    if (roll < DAILY_ODDS[p]) { prize = p; break; }
    roll -= DAILY_ODDS[p];
  }
  const left = pools(save);
  if ((prize === 'weapon' || prize === 'outfit' || prize === 'accessory' || prize === 'skin') && !left[prize].length) prize = 'coinsBig';
  save.dailyDay = today();
  switch (prize) {
    case 'weapon': {
      const weapon = any(left.weapon);
      save.arsenal.push(weapon);
      return { prize, weapon };
    }
    case 'outfit':
    case 'accessory': {
      const item = any(left[prize]);
      save.owned.push(item);
      return { prize, item };
    }
    case 'skin': {
      const skin = any(left.skin);
      save.skins.push(skin);
      return { prize, skin };
    }
    default: {
      const coins = DAILY_COINS[prize];
      save.coins += coins;
      return { prize, coins };
    }
  }
}
