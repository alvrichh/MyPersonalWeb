/* The coin store: packs of coins for real money, each a bigger heap than the
   last, and a limited-time offer that adds a skin. Prices are in euro cents.
   Nothing here takes money by itself: `payments.ts` decides whether a
   purchase can happen at all (today only the test checkout on localhost). */

import { FREE_SKINS, ownsSkin, type HeroSkin, type Save } from './save';

export type CoinPack = { id: string; price: number; coins: number; pic: number; tag?: 'popular' | 'best' | 'ultra' };
export const COIN_PACKS: CoinPack[] = [
  { id: 'coins-1', price: 99, coins: 1000, pic: 1 },
  { id: 'coins-2', price: 249, coins: 2800, pic: 2 },
  { id: 'coins-3', price: 499, coins: 6000, pic: 3, tag: 'popular' },
  { id: 'coins-4', price: 999, coins: 13000, pic: 4 },
  { id: 'coins-5', price: 1999, coins: 28000, pic: 5 },
  { id: 'coins-6', price: 4999, coins: 75000, pic: 6, tag: 'best' },
  { id: 'coins-7', price: 9999, coins: 250000, pic: 7, tag: 'ultra' },
];
/** How many more coins a pack gives than the smallest one at the same price, in percent. */
export const packBonus = (p: CoinPack) => Math.round((p.coins / ((p.price / COIN_PACKS[0].price) * COIN_PACKS[0].coins) - 1) * 100);

/* The special offer: a paid skin with a heap of coins, for a limited time.
   The offers take turns in windows of `OFFER_WINDOW`, the same for every
   player, skipping a skin already owned; each can be bought once. */
export type SkinOffer = { id: string; skin: HeroSkin; coins: number; price: number };
export const SKIN_OFFERS: SkinOffer[] = [
  { id: 'offer-robot', skin: 'robot', coins: 8000, price: 999 },
  { id: 'offer-kitty', skin: 'kitty', coins: 8000, price: 999 },
];
export const OFFER_WINDOW = 3 * 24 * 3600 * 1000;
/** The offer on now and when it ends, or null when every offered skin is owned. */
export function currentOffer(save: Save, now = Date.now()): { offer: SkinOffer; ends: number } | null {
  // No paid skin pack while every skin is on sale for 0 coins.
  if (FREE_SKINS) return null;
  const slot = Math.floor(now / OFFER_WINDOW);
  const ends = (slot + 1) * OFFER_WINDOW;
  for (let i = 0; i < SKIN_OFFERS.length; i++) {
    const offer = SKIN_OFFERS[(slot + i) % SKIN_OFFERS.length];
    if (!ownsSkin(save, offer.skin) && !save.purchases.includes(offer.id)) return { offer, ends };
  }
  return null;
}

/* The Halloween sale, from 31 October to 2 November (the player's own calendar), every year: every coin pack at half
   price, and the two spooky skins (the Vampiress and El Weso) offered together, each with coins, also at half price. */
export const HALLOWEEN_OFFERS: SkinOffer[] = [
  { id: 'halloween-vampire', skin: 'vampire', coins: 8000, price: 999 },
  { id: 'halloween-weso', skin: 'weso', coins: 8000, price: 999 },
];
/** When the Halloween sale ends, or null when it is not on. */
export function halloweenEnds(now = Date.now()): number | null {
  const d = new Date(now), y = d.getFullYear(), start = new Date(y, 9, 31).getTime(), end = new Date(y, 10, 3).getTime();
  return now >= start && now < end ? end : null;
}
/** What a pack or an offer costs now: half during the Halloween sale, ending in 9 cents like the full prices (4,99 for 9,99). */
export const priceNow = (what: { price: number }, now = Date.now()) => (halloweenEnds(now) ? Math.max(9, Math.round(what.price / 20) * 10 - 1) : what.price);
/** The offers on now: during Halloween its own spooky ones (those not owned yet), otherwise the turn's skin offer. */
export function currentOffers(save: Save, now = Date.now()): { offer: SkinOffer; ends: number }[] {
  const ends = halloweenEnds(now);
  if (ends && !FREE_SKINS) return HALLOWEEN_OFFERS.filter((o) => !ownsSkin(save, o.skin) && !save.purchases.includes(o.id)).map((offer) => ({ offer, ends }));
  const one = currentOffer(save, now);
  return one ? [one] : [];
}

/** Gives what was paid for: the coins, and the skin of an offer. */
export function grant(save: Save, what: CoinPack | SkinOffer) {
  save.coins += what.coins;
  save.purchases.push(what.id);
  if ('skin' in what && !save.skins.includes(what.skin)) save.skins.push(what.skin);
}
