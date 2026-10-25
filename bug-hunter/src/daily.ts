/* The daily chest: once every 24 hours from the last one opened, the cover's
   chest opens a wheel of free prizes: coins, an arsenal weapon, an outfit or
   an accessory from the shop, and very rarely a skin. The prize is drawn by
   its odds before the wheel spins; the spin only lands on a slice of it.
   Nothing here is ever bought with money. */

import { ARSENAL, ITEMS, type ItemId } from './shop';
import { FREE_SKINS, SKINS, SKIN_GATE, SKIN_PRICE, ownsSkin, worldWon, type HeroSkin, type Save } from './save';
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

/** A chest every 24 hours, counted from the moment the last one was opened. */
export const DAILY_EVERY = 24 * 3600 * 1000;
/** Milliseconds until the next chest (0 when it is ready). */
export const dailyLeft = (save: Save, now = Date.now()) => Math.max(0, save.dailyAt + DAILY_EVERY - now);
export const dailyReady = (save: Save, now = Date.now()) => dailyLeft(save, now) === 0;

export type DailyResult = { prize: DailyPrize; coins?: number; weapon?: SkillId; item?: ItemId; skin?: HeroSkin };

/* What can still be won: weapons on sale (their world won) and not bought,
   armour not owned (outfits are body items, accessories head and boots), and
   the paid skins not owned. */
const pools = (save: Save) => ({
  weapon: ARSENAL.filter((a) => worldWon(save, a.world) && !save.arsenal.includes(a.id)).map((a) => a.id),
  outfit: ITEMS.filter((i) => i.slot === 'body' && !i.legendary && !save.owned.includes(i.id)).map((i) => i.id),
  accessory: ITEMS.filter((i) => (i.slot === 'head' || i.slot === 'boots') && !i.legendary && !save.owned.includes(i.id)).map((i) => i.id),
  // Only the skins with nothing to open them (robot, Kitty): the rest are won by playing.
  skin: SKINS.filter((s) => s !== 'boy' && !SKIN_GATE[s] && SKIN_PRICE[s] > 1000 && !FREE_SKINS && !ownsSkin(save, s)),
});

/** Opens the chest: draws the prize, gives it and starts the next 24 hours. A prize with nothing left to win becomes coins. */
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
  save.dailyAt = Date.now();
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
