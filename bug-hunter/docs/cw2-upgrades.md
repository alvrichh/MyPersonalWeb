# Cartoon Wars 2 — upgrade levels, costs and unit notes (research)

Owner-supplied research (a player's empirical testing of Cartoon Wars 2), kept as Siege's reference for upgrade effects, costs and unit balance. Hero sections are left out (the owner's call). Numbers are measured in the original game, often roughly; they are a guide for Siege's balance, not values to copy blindly. See also [cw2-reference.md](./cw2-reference.md) (unit looks) and [siege-roster.md](./siege-roster.md).

## Castle and bow upgrades

- **Castle defense:** 100% +20% per level. The look changes every 4th level up to 16; it gets wider, moving the turret's pivot and the summon point to the right (the map effectively shrinks). Level 4 has the lowest pivot (hard to shoot over your air units), level 8 the highest (marginally) but the leftmost spawn relative to the pivot.
- **Bow power:** lv0-2 1 arrow, lv3-5 2, lv6-7 3, lv8-9 2 big, lv10-11 3, lv12-14 3 fire, lv15-16 3 ice, lv17-25 1 missile. Rough damage: lv0-2 5, 7, 9; lv3-5 8, 12, 12; lv6-7 14, 16; lv8-9 15, 17; lv10-11 16, 19; lv12-14 25, 26, 27; lv15-16 28, 28; lv17-20 28, 28, 29, 29; hell 30-34 (inconsistent). Energy per shot grows with power (proportional to lv + 20), so upgrading past lv15 can hurt: more energy for little damage. Lv12 is the one big damage step; afterwards only knockback keeps growing. Levels that add projectiles lower each one's damage to compensate. The turret gets taller at lv8 and lv17 (helps shooting over close air units).
- **Bow range:** about +1% arrow speed per level, +3% at multiples of 3 (as range about +3% a level, +9% at multiples of 3, compounding). Faster arrows may do less damage (less time overlapping the target). With triple shots the furthest arrow follows the single-shot path, the other two fall shorter. Measured extra range (map ticks, act 6 boss, castle lv16, power 0, max angle): 0.75, 0.87, 1.11, 1.74, 1.98, 2.13, 3.01, 3.13, 3.40, 4.27, 4.51; hell: 4.76, 5.81, 6.18, 6.46, 7.72.
- **Bow speed:** in steps: lv0-2 0.4 s (24 frames), lv3-5 0.35 s, lv6-8 0.3 s, lv9-10 0.267 s. Energy use runs on 0.1 s ticks, so lv0-2 spends 4x energy per shot, lv3-8 3x, lv9-10 about 2.33x.
- **Max energy (arrows):** 50 shots at power and speed 0, +15% per level. **Energy regen:** 1 shot a second at power and speed 0, +10% per level; no regen while shooting; regen is not proportional to capacity.

## Economy upgrades

- **Additional gold:** +6% gold drop rate per level (low confidence); does not change the amount per kill or bonus gold.
- **Max mana:** 100 +50 per level.
- **Mana regen:** 3.5/s at lv0, then 3.0 +2.0 per level. Hell mode gives +10/s until the first mana pool upgrade.
- **Cool time:** -4.167% (1/24) per level; nothing past level 23.

## Upgrade cost progressions (gold)

- **Slow** (max 20 levels, and bow range): 300, 400, 500, 800, 1000; 1500, 2000, 3000, 4000, 5000; 7000, 9000, 10000, 12000, 15000; 18000, 20000, 40000, 60000, 80000; hell 100000 each.
- **Medium** (max 10): 300, 500, 800, 1000, 1500; 2000, 3000, 4000, 5000, 7000; hell 10000, 12000, 15000, 18000, 20000; 40000, 60000, 80000, 100000, 100000.
- **Fast** (bow speed only): 300, 500, 1000, 2000, 5000; 10000, 20000, 40000, 80000, 100000; no hell levels.

## Difficulty

Higher difficulty sends enemies faster and raises their health and damage: about 0.65x, 0.85x, 1.00x and 1.18x of normal for the four difficulties (spawn rate not measured). Probably no effect on knockback or stun.

## Skills

- **Arrows** and **bomb 1/3** rain from the top left of the screen: support while attacking the enemy base, or for a flyer at the top left. All arrow skills do the same with a longer cooldown and price for more damage; the first is the most mana-efficient. Bombs 1/3 are much less efficient than arrows and have long cooldowns.
- **All other abilities, bomb 2 included,** cover the screen evenly but cannot land on the enemy castle; with the screen there they bunch up to its left (very strong). Rocks: very weak. Tornado and wave: weak damage, strong knockback; wave hits ground only. Lightning: moderate damage, ground and air alike. Sword, meteor and bomb 2: high ground damage (they leave a residue); sword is better against bosses (thin hitbox).
- **Energy refill** skills restore a fixed amount (37.5, 75, 112.5 shots at power and speed 0); cost and cooldown grow with it. **Purify:** worthless (destroy the enemy spell tower with attacks instead). **Meteor turret:** worthless (spawns too far forward, too little knockback, dies at once if attacked). **Warp gate:** a gate on each side for a few seconds that you and the enemy can walk through; good for rushing the base. **Gold to mana:** converts gold 1:1 to fill mana.

## How damage works (important for balance)

Damage is dealt per frame while a hitbox overlaps its target, so lingering attacks are much stronger than quick pulses (every rocket is weak for its cost). The same holds in defence: a unit that is pushed out of an attack survives far longer than one holding its ground. Tanks get stunned in place by strong enemies and die at once, while "squishy" units are pushed back, take little damage and attack again.

## Which units are good (the tester's view)

- **Best:** spearman 5 (fast, dominates weaker units, dies to stronger ones as it is never pushed back); wizard 1 (glass cannon that survives and hits better than it should); wizard 3 (fast close attack, enough stun resistance late); heavy armed robot 2 and 4 (strong, very long range; 4 has decent anti-air); drill aircraft 1 (stun resistance and lingering attack, dominates ground; 2 costs far more for nearly the same); angel 2 and 3 (huge attack, good stun resistance).
- **Also good:** swordsman 6 (easy to unlock); gunner 2-4 (4 weaker than wizard 1 but usable late); wizard 2 (slightly better than 1, not worth the mana); vulture 4 (like heavy armed robot 2, faster, less sturdy); armed robot 2 (like a tier 0 heavy robot; skip to heavy robot 1); heavy armed robot 1 and 3 (3 hits harder with less range, needs air support); armed aircraft 2 (air gunner 4).
- **Stalling (cheap fodder):** swordsman 1-2, archer 1, aircraft 1; more expensive: blaster 1, archer 4.

## Unit costs per form: gold, mana, cooldown (in 0.15 s units)

| Unit | Forms |
|---|---|
| Swordsman | 200, 10, 8; 200, 15, 12; 300, 25, 25; 400, 30, 30; 700, 50, 30; 3000, 250, 80 |
| Spearman | 300, 20, 15; 400, 25, 15; 500, 50, 25; 1200, 70, 35; 10000, 600, 100 |
| Archer | 600, 20, 20; 1200, 50, 30; 1500, 100, 40; 8000, 400, 100 |
| Heavy armor swordsman | 3000, 100, 100; 5000, 250, 120; 10000, 800, 180; 24000, 1200, 280 |
| Gunner | 4000, 150, 100; 7000, 200, 120; 9000, 300, 120; 15000, 450, 150 |
| Blaster | 6000, 200, 120; 12000, 500, 150; 15000, 500, 150; 18000, 800, 180 |
| Wizard | 12000, 450, 180; 30000, 800, 240; 36000, 1200, 300 |
| Vulture | 12000, 300, 100; 15000, 400, 130; 18000, 500, 180; 24000, 1000, 250; 30000, 1000, 220; 30000, 1200, 250 |
| Armed robot | 12000, 300, 180; 25000, 600, 250; 32000, 800, 250 |
| Heavy armed robot | 45000, 800, 220; 60000, 1000, 250; 75000, 1200, 250; 120000, 2000, 450 |
| Aircraft | 3000, 50, 30; 3600, 80, 50; 5000, 130, 70; 9000, 150, 80 |
| Armed aircraft | 9000, 250, 100; 12000, 400, 150; 15000, 500, 180; 20000, 1400, 380 |
| Armed chopper | 12000, 800, 130; 16000, 1500, 280 |
| Drill aircraft | 30000, 1000, 150; 32000, 1500, 280 |
| Angel | 45000, 500, 120; 60000, 1500, 350; 120000, 2500, 450 |

| Skill | Levels |
|---|---|
| Arrow | 1000, 50, 35; 3000, 100, 65; 6000, 150, 85; 8000, 250, 95; 10000, 350, 108; 18000, 450, 150 |
| Anger | 6000, 300, 165; 9000, 400, 165; 12000, 400, 180; 14000, 500, 200; 18000, 600, 220; 30000, 300, 105 |
| Bomb | 18000, 400, 225; 18000, 600, 225; 18000, 700, 225 |
| Energy | 25000, 200, 200; 32000, 400, 400; 50000, 600, 600 |
| Purify | 18000, 800, 99999 |
| Meteor | 15000, 800, 99999 |
| Gate | 20000, 300, 800 |
| Mana | 35000, 2, 250 |

Note for Siege: the first gold figure is the unit's unlock price; the following ones are each upgrade's price. Siege's swordsman drops the reference's fifth form, so its five forms map to the reference's 1, 2, 3, 4 and 6.
