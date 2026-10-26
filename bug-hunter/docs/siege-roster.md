# Siege roster (target, assets in progress)

Siege is moving to Cartoon Wars 2's campaign roster: our army of 10 land and 5 air units, a separate enemy roster, and one boss per act. Every unit gets new art. This file is the contract for that art and for the code that will use it. The current troops (bugs reused from the main game) stay until each new sheet lands.

Reference: the Cartoon Wars 2 wiki pages on friendly units, enemy units and bosses (text supplied by the owner), and the owner's research on each unit's levels and looks: [cw2-reference.md](./cw2-reference.md). Unit level art (N1, N2…) follows that file; what it marks as pending is not a confirmed design.

## Rules taken from the reference

- **Stun and knockback.** Every unit rocks back or is stunned for a moment under heavy fire. Infantry hit hard by one blow fly back a long way and get up quickly (so they keep fighting); non-infantry stay stunned, so repeated hits can lock them.
- **Air.** All air units can be hit by our bow. Land units hit air only when listed (Wizard from level 3, Heavy Armed Robot from level 3).
- **Unit levels.** Our units level up (workshop). Some change role with level: Archer starts as a rock thrower; Armed Aircraft becomes an "air magician" at level 4; Heavy Armed Robot level 4 is huge and is hit by the enemy bow too.
- **Gatling robots split.** Small and medium gatling robots explode into a damaged copy (one arm, no gun, scratch attack), then into a crawling wreck (head and right arm on debris). The large one (act 2 boss) does not split; neither does the flying ray rider.
- **Horned enemies are elites.** Horned archers shoot lightning arrows; horned wizards summon shadows (the plain ones ice crystals).
- **Bosses** come only after the enemy fortress is destroyed; its health bar then becomes the boss's. Act 6 also brings a Giant Dinosaur Brute in the stage before the last.
- **Red Dragon Rider** cannot be stunned by any of our units.

## Our army

Cost and order follow the reference; numbers are to be balanced in code.

| # | Unit | Kind | Role and notes |
|---|---|---|---|
| L1 | Swordsman | land, infantry, melee | Cheap spam unit, weak later. |
| L2 | Spearman | land, infantry, melee | A bit better than the swordsman. |
| L3 | Archer | land, infantry, ranged | Level 1 throws rocks; best behind a Heavy Armor Swordsman. |
| L4 | Heavy Armor Swordsman | land, infantry, melee | High health: the shield; hits hard too. |
| L5 | Gunner | land, ranged | Keeps enemies away early. |
| L6 | Blaster | land, ranged | Good attack, carries a shield. |
| L7 | Wizard | land, ranged, area | Strong early, grows with level; hits air from level 3. |
| L8 | Vulture | land (mount), fast melee | Very fast, strong; weak at the end. |
| L9 | Armed Robot | land, ranged | Fast, strong at level 2. |
| L10 | Heavy Armed Robot | land, ranged, heavy | 2000 mana (second dearest). Slow at levels 1-3; hits air at 3-4; level 4 is huge and is hit by the enemy bow. |
| A1 | Aircraft Fighter | air | Fragile. |
| A2 | Armed Aircraft Fighter | air, ranged | Longer range; "air magician" at level 4. |
| A3 | Armed Helicopter | air, missiles | High health, slow attack, missiles. |
| A4 | Drill Aircraft | air, melee | Used as a shield; good attack. |
| A5 | Angel Army | air | The dearest. Very fast at level 1, slower afterwards. |

## Enemy roster

Each enemy is "equivalent" to one of our units at a level: that sets its stats. Acts are a proposal (the reference does not give the order).

| Act | Enemies | Equivalent | Boss |
|---|---|---|---|
| 1 | Swordsman (grey, ragged), Spearman, Archer (horned: lightning), Dog (bites), Eagle (air) | our Swordsman, Spearman, Archer, Spearman 1, Aircraft 1 | Large Slinger |
| 2 | Gunner, Blaster (spike blaster = level 2), Gatling Robot small and medium (split), Ninja Bat (land and air), Gatling Ray Rider (air), Inter-Galactic Ray Rider (air) | Gunner, Blaster, Armed Robot 2, Heavy Armed Robot 1, Aircraft 2, Armed Helicopter | Large Gatling Robot |
| 3 | Grim Reaper (scythe), Undead Turkey, Dragon Breather, Dragon Rider (air), Death Angel (air), Red-eyed Eagle (air) | Spearman 3, Archer 2, Vulture 1, Drill Aircraft 1, Angel 2, Aircraft 3-4 | Large Red Dragon Rider |
| 4 | Bear (one eye, scratch), Heavy Armor Hammer Wielder (skeletal), Slinger, Heavy Armor Axeman, Wizard (ice; horned: shadows), Hypnotist Bat (land and air) | HAS 1, HAS 2, HAS 3, HAS 3, Wizard 1/3, Armed Aircraft 1 | Giant Brute Eater |
| 5 | Rex Head, Rhinoceratops, Flightless Terror Bird, Tiger (leaps over and turns back), Spider Spearman | Spearman 4, about HAS 2, Spearman 4, Archer 4, Spearman 5 | Giant Dinosaur Brute |
| 6 | Mammothsaurus, Giant Heavy Armor Axeman, Inter-Galactic Shooter, Green Ninja Bat, Red Dragon Rider (air, unstunnable), Devil Army (air) | Vulture 6, HAS 4, Gunner 2, Swordsman 6, Drill Aircraft 2, Angel | Giant King Dinosaur Brute |

## Six-pose sheets and levels (current format)

New sheets have **6 poses** in one row: 1 walk A, 2 walk B (A and B alternated read as walking), 3 attack ready, 4 attack, 5 hurt (feet on the ground), 6 dead (lying on the ground); simple stick figures (white round head, stick body). One row per level form, in order. A unit with such a sheet has `six: true` in `UNITS` (scale 0.4 a pixel of its first walk pose); its forms (`forms`) are bought in the workshop's Troops rows. Cut as `siege/units/ally-<name>-<level>-<pose>.webp` (pose 0-5).

- **Swordsman:** 5 forms (the reference's six with its fifth, the piercing swordsman, dropped): club, dagger, sword and shield, greatsword, master (fire slash, reaches flyers). Prices 200, 300, 400, 2000 gold; energy 20, 30, 50, 60, 200. Its scarf, capes and the level 4 crest are blue in every form (the owner's call: the first ally wears blue).
- **Archer:** 4 forms: rock thrower, javelin thrower, archer with a bow, ninja with shurikens. Each throws the projectile cut from its own sheet's attack pose (`siege/units/shot-rock|javelin|arrow|shuriken`; rocks and shurikens spin, javelins and arrows point along their path). Prices 250, 400, 1500 gold; energy 30, 40, 50, 120. Projectiles in new sheets: leave them separate in the attack pose and they are cut out as the shot.
- **Heavy armour:** 4 forms: knight with two swords, bigger knight with maces for hands, samurai who punches, bigger samurai. Prices 300, 500, 1800 gold; energy 65, 80, 100, 180. Its sheet is drawn larger than the swordsman's, so it is scaled by 0.8 (`six(name, px, k)`).
- **Gunner:** 4 forms: pistol, rifle, two Uzis (fast), sniper (long reach, slow and heavy). Bullets are a tracer drawn in code (`shot: 'bullet'`). Prices 300, 500, 1600 gold; energy 45, 55, 70, 140; scaled by 0.65.
- **Blaster:** 4 forms: bazooka, rocket launcher, ray gun, flamethrower. Rockets are cut from the sheet's attack poses (`shot-rocket`, `shot-rockets`) and blast an area; the ray is a beam drawn in code (`shot: 'ray'`); the flame is in the attack pose (`shot: 'none'`, short reach, wide area). Prices 350, 600, 1800 gold; energy 85, 100, 120, 170; scaled by 0.65.
- **Spearman:** 5 forms: basic spear, longer, longer still, horned fox helmet, lancer on a white horse (not thrown back by heavy blows, only stunned). The reference gives no prices: 250, 400, 600, 2200 gold; energy 30, 40, 50, 65, 220.

## In the game now (test set)

The owner's first two sheets are in: our 15 units and 18 enemy troops, **3 poses each** (0 standing, 1 attacking with its effect, 2 hurt), cut into `assets/special/siege/units/<ally|foe>-<name>-<pose>.webp`. `UNITS` in `src/siege/model.ts` lists them (ours 0-14, the enemy's 15-32) with stats from the equivalences above; `FOE_LAND` / `FOE_AIR` add the enemy's troops world by world, and each world's guardian is its toughest troop so far, drawn bigger (no boss sheets yet). The story scenes still show the old guardians. Walking (a hop, squash and lean on each step), breathing, the strike's lunge, the knock-back of infantry (thrown back, turned over, up again) and the others' stun are animated in code. Heavy blows (20% of a troop's health) knock: `KNOCK` in the model; the Red Dragon Rider is never knocked.

## Sheet format (the same for every unit)

- One sheet per unit and visual level; transparent background (real alpha); no text, no shadow; poses in **one row**, with wide empty space between them; all poses at the same scale, standing on the same ground line.
- **Side view.** Our units face RIGHT. The enemy sheets so far face LEFT (`facesLeft` in `UNITS`); a sheet that faces the other way is turned in code. Keep every pose of a sheet facing the same way.
- **5 poses, in this order, for every unit:** 1 walk with legs wide apart (a full stride), 2 walk with legs together (passing step), 3 attack ready (wind-up), 4 attack (the strike; ranged units only the muzzle flash, the shot is drawn in game), 5 hurt (rocking back). Air units: 1 and 2 are two flying frames (wings up, wings down).
- **Animated in code, not drawn:** walking alternates poses 1 and 2 (about 6 a second) with a bounce, a squash on each footfall and a forward lean; standing is pose 1 breathing; the strike lunges forward; heavy hits push back, and infantry fly back on pose 5 spinning, land and get up; death is pose 5 falling over and fading; flyers float on a sine.
- **Gatling robots:** 3 sheets, one per stage (whole, one arm, crawling wreck).
- **Bosses:** the land format at about twice a normal unit's size.
- Cut and placed in `assets/special/siege/units/<unit>-<level>-<pose>.webp` (public `/images/game/siege/units/...`), scaled so a Swordsman is the reference height.

## Prompt (one per unit sheet)

Replace `<UNIT>` with one line from the lists below.

```
Game sprite sheet, transparent background, no text, no shadow, no ground.
Side view (pure 2D profile), facing RIGHT, of <UNIT>, for a cartoon side-scrolling army battle game like Cartoon Wars 2.
Style: glossy stylised cartoon, chunky proportions with a big head, thick clean outlines, strong rim light, same rendering as a mobile strategy game.
5 poses in ONE row, left to right, same scale, same ground line, wide empty space between them, no pose touching another:
1) walking, legs wide apart in a full stride, 2) walking, legs together passing each other, 3) attack ready (wind-up), 4) attacking (the strike), 5) hurt, rocking backwards.
```

For air units replace poses 1 and 2 with: `1) flying, wings up, 2) flying, wings down`.

**Our army** (blue and steel, cyan neon trims, like our fortress):
- `a young swordsman in light steel armour with a blue tunic and a short sword`
- `a spearman in light steel armour with a blue tunic and a long spear`
- `an archer in a blue hood throwing rocks with a sling (level 1)` / `an archer in a blue hood with a wooden bow (level 2+)`
- `a heavy armour swordsman, bulky full plate armour with cyan neon seams, big sword and a tower shield`
- `a gunner in a blue uniform and helmet with a musket rifle`
- `a blaster soldier with a round shield on one arm and a short blaster cannon in the other`
- `a wizard in a blue robe and pointy hat with a glowing cyan crystal staff`
- `a knight riding a big vulture bird that runs on the ground`
- `a small armed robot, steel and cyan neon, with a gun arm, running fast`
- `a heavy armed robot, a huge steel walker with cyan neon, twin cannons on its shoulders`
- `a small propeller aircraft fighter, steel with cyan trims, a pilot in goggles` (air)
- `an armed aircraft fighter with two wing guns, steel and cyan` (air)
- `an armed helicopter, steel and cyan, with missile pods` (air)
- `a drill aircraft, a flying machine with a big spinning drill on its nose` (air)
- `an angel soldier with white wings, golden armour and a spear` (air)

**Enemies** (grey, ragged, dark red glowing eyes and red trims, like the bug fortress):
- `a grey goblin swordsman with a ragged notched sword`, `a grey goblin spearman with a broken spear`, `a grey goblin archer with a crude bow` (and `with horns, shooting lightning arrows`)
- `a mean grey dog`, `a one-eyed brown bear with big claws`, `a skeletal grey brute in heavy armour with a hammer`
- `a grim reaper with a big scythe`, `an undead turkey`, `a flightless terror bird`, `a tiger`, `a spider with a spear`
- `a slinger brute swinging a sling`, `a heavy armour axeman`, `a giant heavy armour axeman`
- `a grey goblin gunner`, `a grey goblin blaster shooting spikes`, `a goblin wizard summoning ice crystals` (and `horned, summoning shadows`)
- `a T-rex head on legs`, `a rhinoceros-triceratops`, `a mammoth-dinosaur`, `a dragon breathing fire, walking`
- `a skeletal grey gatling robot with a big round red eye holding a heavy minigun` (and its two damaged stages)
- `a ninja bat`, `a horned hypnotist bat with hands on its wings`, `a green ninja bat`, `an eagle`, `a red-eyed eagle` (air where they fly)
- `a gatling robot riding a flying one-eyed ray with two curved teeth`, `a spiky alien shooter riding a small toothy flying ray` (air)
- `a grey dragon with a rider holding a spear`, `a red-patterned dragon with a rider holding a big red-patterned sword`, `a dark death angel`, `a devil soldier with bat wings` (air)
- `an inter-galactic shooter: thick legs, huge head with spikes for hair, a spike rifle grown into its left arm`

**Bosses** (twice the size): `a large slinger brute`, `a large gatling robot (does not split)`, `a large red dragon rider`, `a giant brute eater with a huge mouth`, `a giant dinosaur brute`, `a giant king dinosaur brute with a crown of horns`.
