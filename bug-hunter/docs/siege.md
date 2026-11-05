# Siege / Asedio — playable preview

Siege opens on a mode screen with two modes, each with its own engine, look and save:

- **Siege Legacy / Asedio Legacy** (`src/siege/legacy/`, save `bugHunter.siege.v1`): the first troops (the game's own bugs, tickets, legacy code and bosses such as the Monolith), the nine worlds of the map with their story scenes and guardians, the bridge battlefield with each world's map picture, the Town Hall as our fortress and the Tactics bench front as the enemy's. It is kept as it was before the Cartoon troops arrived, but no longer offered: Siege opens straight on Siege Cartoon's world map (v1.15.14).
- **Siege Cartoon / Asedio Cartoon** (`src/siege/cartoon/`, save `bugHunter.siege.cartoon.v2`): the new troops (white round faces in blue and gold armour, the owner's sheets), six worlds (the code calls them acts) of five stages each, the enemies tougher and drawn bigger stage by stage (`hard`, up to `GROW` larger at the last), a corrupt wind blowing our troops back once the enemy fortress is down to half while a horde pours out (`GUST`, `hordeOf`, growing world by world), every fallen enemy giving gold and energy, more for the strong (`dropOf`, `manaOf`), (`STAGES`; the guardian comes in the fifth), the swordsman alone at first and the other troops recruited with gold (`RECRUIT`) once their act opens, gold dropped by every enemy (`dropOf`, kept even in defeat), the green/red battlefield with ground, our upgradable tech castle and crossbow, the enemy hive, troop levels in the workshop, and its own paper-and-ink look outside battle, with a shop laid out like Cartoon Wars 2's (Land / Air / Base tabs, a row of tiles per troop's forms or upgrade's levels, equipped slots, Purchase and Equip). Each act's guardian: Large Slinger, Large Gatling Robot, Large Red Dragon Rider, Giant Brute Eater, Giant Dinosaur Brute, Giant King Dinosaur Brute (`GUARDIAN` in its model, ids 34-39, each from the owner's boss sheets). Its story (`src/siege/cartoon/story.ts`): the Darkness against our King, who leads (the crowned giant, the heavy armour's last form); named King Álvaro; Captain Jorge commands, Felipe the Wizard is the clever one and Manolo the swordsman the funny one; they talk before each world and answer each guardian. Each act opens on its title card, and the world darkens act by act (`gloom` in that file: the battlefield, the scenes and the act's card).

Siege Cartoon follows Cartoon Wars 2 on purpose (its battles, troops and rules: [siege-roster.md](./siege-roster.md), [cw2-reference.md](./cw2-reference.md), [cw2-upgrades.md](./cw2-upgrades.md)); keep it that way.

Status: **Coming soon · Playable preview**. Available in the fourth main-cover option, Coming Soon, after Sprints, On Call and Battle. The hub keeps its separate Fortress link. Battle still contains Fusion and Tactics. Fortress remains its separate construction prototype.

## Player flow

1. Select Coming Soon on the cover using the arrows or swipe, press the play bar, then choose Siege.
2. Pick an unlocked enemy world and exactly five troops. Eight troop families exist; the last three unlock at worlds 3, 5 and 7.
3. Summon with regenerating energy. Troops advance and fight automatically on a lateral battlefield.
4. Upgrade the generator during the battle (four levels). Tap the field to aim the cannon or area discharge; neither harms allies. Cannon range is capped at 1,080 world units, with a 3.5-second recharge; discharge recharges in 24 seconds.
5. Destroy the enemy fortress within five minutes (ten on a guardian's stage). A guardian joins once the enemy base drops below 45% health or at 150 seconds. Losing your own base or reaching the time limit is defeat; simultaneous destruction is defeat.
6. Victories award mode-specific gold and unlock the next fortress, through all nine worlds. The workshop offers five levels each of army strength, base health and energy production. Repeat victories give smaller rewards. Defeats and abandoned battles give no reward.

The nine preview stages reuse world enemy art and share the initial guardian silhouette. Fortress scenery is procedural preview art. This is not a promise of nine fully authored campaigns or finished balance. Existing source images are reused without rewriting/recompressing their bytes; alpha bounds are measured only at render time.

## Controls and accessibility

- Touch/mouse: five unit cards, generator/cannon/discharge buttons. Tap the battlefield to aim; drag to pan. Camera slider and home/enemy buttons are alternative controls.
- Keyboard while the battlefield is focused: 1–5 summon, E generator, F cannon, Q discharge, left/right arrows pan, Escape pause.
- Landscape shows more of the field. Portrait keeps all five cards on screen and supports camera panning.
- The battlefield pauses on tab hiding or window blur. Returning requires Resume. Time does not advance while paused.
- The mode is a modal with background content inert, a focus loop, accessible button labels and reduced-motion support. All copy is in `src/strings.ts` in English and Spanish.

The roster is moving to Cartoon Wars 2's (our 15 units, the enemy roster by act, six bosses), with all-new art: see [siege-roster.md](./siege-roster.md) for the units, their rules and the sprite-sheet format, and [cw2-reference.md](./cw2-reference.md) for each unit's levels and looks.

## Layout rule (always)

Every Siege change that touches what is drawn or where controls sit is checked by looking at it, not only by tests:

1. Take screenshots of a real battle at **desktop 1280×720** and **phone 390×844** (more sizes when the change is about scaling), with troops on the field and the bow shooting.
2. Look at where each thing is and say it: the HUD (mana left, health bars and VS centre, time/coins/pause right), our wall and the aim control standing on it, the mana angel, the picture's ground under the troops' feet, the enemy wall, the L·A·S tabs, cards and bow button in the bottom bar.
3. Nothing may leave the view: projectiles' arcs, the aim control, labels, cards. Nothing may float off the deck or sink below it; flyers stay above their own shadow.
4. Compare both orientations; a fix for one must not break the other.
5. Report what was checked and what was not (for example "only world 4 was looked at").

In Siege Cartoon the fortresses are one design each for now (world-themed ones may come later as skins): ours `siege/castle-1..4` by the workshop's Fortress level (0-1, 2-3, 4, 5), the enemy's `siege/enemy-1..3` by act (1-2, 3-4, 5-6), both side on. Our crossbow (`siege/xbow-1..4`, by the Bow level the same way: three crossbows, then a rocket launcher) sits in the castle's turret; it turns on its wheel towards the aim and the arrows and missile leave from it. Damage shows as smoke under 60% health and flames under 30%, drawn over the picture. Their sizes and the crossbow's seat are `CASTLES`, `ENEMY_H` and `XBOW` in `src/siege/cartoon/view.ts`.

Siege Cartoon's battlefield is one picture for every world for now (`siege/backdrop`, the owner's: our green side left, the bugs' red one right), ground included, drawn across the whole field and moving with the troops: `SCENE_FIT` in `src/siege/cartoon/view.ts` sets how far it runs past each end and where its walking ground sits (a share of its height) on the troops' ground line. On an upright phone the ground line comes down so the picture reaches the bottom, and its sky colours carry on above it. The aim control's place is in `src/siege/siege.css` (`.sg-aim`).

## Architecture and compatibility

- `src/siege/cartoon/model.ts` and `src/siege/legacy/model.ts`: each mode's deterministic, DOM-free simulation, balance, save validation, upgrades and reward settlement. Legacy's answers the same calls as Cartoon's (its troops have one level).
- `src/siege/cartoon/view.ts` and `src/siege/legacy/view.ts`: each mode's canvas renderer, camera and sprite loading.
- `src/siege/legacy/story.ts`: Legacy's story scenes.
- `src/siege/index.ts`: the mode screen, preparation, inputs, pause/results, lifecycle and each mode's local save.
- `src/siege/siege.css`: scoped responsive UI plus the fourth cover option's color.
- `tests/siege.test.mjs` (Cartoon) and `tests/siege-legacy.test.mjs` (Legacy): meaningful model regressions, including a complete first-stage win.

The existing `PlayMode`/action/board schema is intentionally unchanged. The cover has a separate four-entry selection; choosing Siege never writes an unsupported value into the previous save. Legacy uses `bugHunter.siege.v1` and Cartoon `bugHunter.siege.cartoon.v2`, through the shared safe storage adapter. Coins, unlocks, workshop levels and deck selection are separate from other modes and from each other. Battles are not resumed after reload. No server, multiplayer, paid currency or online synchronization is introduced.

Simulation runs at a fixed 30 Hz, rendering with requestAnimationFrame and DOM counters at 10 Hz. Each side has a 36-unit cap. Leaving cancels the animation frame, removes listeners and restores background interactivity. New-game initialization copies upgrade values and the deck, and in-battle generators reset every battle.

## Validation

From the repository root using Node 24:

```bash
npm run typecheck
npm run test:game:layout
npm run test:game
npm run build
```

`npm run test:game:siege` runs only the Siege model suite. UI checks must also cover the fourth cover option, choosing a deck, starting/restarting, a win/loss result, pause/resume, hidden-tab pausing, portrait/landscape, return to menu and storage isolation. Model and fixture tests are not visual gameplay verification.

## Special powers (Siege Cartoon)

The shop's **Especial** tab sells powers (`POWERS` in `cartoon/model.ts`): arrow rain (arrows → ice → fire → rockets), lightning rain, tsunami and meteor shower. Level 1 costs the power's `price` (an act opens it), each later form its own `price`; the save keeps each power's level (`powers`) and the three taken into battle (`kit`). `castPower` spreads a power's blows over the stretch of field on screen (`Siege.view`, set by the view each frame): blows are queued (`hitq`) and land with their effects (`fall`, `ground`, `zap`, `wave`; meteors reuse `shot`/`fire`/`boom`). Add a power by adding to `POWERS`, its strings (`siegePower<id>`, `siegePower<id>F<level>`, `siegePower<id>Text`), its pictures in `POWER_PICS` (`siege/index.ts`) and its cast in `castPower`.

## Villain campaign (v1.15.193)

Opened by winning the hero's last battle (the map's top bar shows a **Villain** switch). It has its own save (`VILLAIN_KEY`) and plays the 30 stages from the other side: the player's troops are the enemy's, in eight lines (`VILLAIN_LINES`: skeletons, fast beasts, heavy beasts, armoured, shooters, dark artillery, fast wings, dark wings), each level another enemy troop (`memberOf`) opened in the act it first comes in (`lineAct`) and the six guardians as cards (each opened by winning its act's last stage, one a battle, `bossUsed`); our heroes come against it (`HERO_LAND`, `HERO_AIR` at `heroLevel`, `HERO_GUARDIAN` on the last stage of each act, as tough as that act's guardian). The model keeps the player on side 0 (left), so the screen is the hero's turned round: the dark fortress is drawn on the left, our castle on the right and the backdrop mirrored. Balance: `VILLAIN_PACE` (the heroes' strength per act and how fast they reach their last form), set with simulations without the crossbow, powers or guardian cards.

