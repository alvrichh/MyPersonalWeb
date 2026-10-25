# Bug Hunter - Changelog

[Game README](./README.md) · [Asset guide](./docs/assets.md) · [Documentation](./docs/) · [Browse assets](./assets/)

This changelog tracks game-version changes starting with v1.12.55. Earlier releases are not reconstructed here.

## 1.14.25 - 2026-10-25

### Added - Siege breaking robots and horned elite shooters (Cartoon Wars 2)
- The Forge's heavy robots break twice before they are gone, like Cartoon Wars 2's gatling robots: the enemy's heavy in world 7 and our own Crusher fall into a wreck of themselves (45% of the last one's health and damage, smaller and darker), then into a crawling one, each break with a blast.
- From one minute on, every fourth wave's ranged enemies are elites, like the horned archers: 1.6 times the health, 1.8 times the damage, a gold glow and horns, and their shots are lightning.

## 1.14.24 - 2026-10-25

### Changed - Siege guardian after the fortress, and enemy flyers (Cartoon Wars 2)
- As in Cartoon Wars 2, the world's guardian no longer joins when the fortress is half down or at 2:30: it comes out only once the fortress falls (its scene plays then), 2.6 times a troop's health instead of 1.35, and the battle is won when it falls too. The enemy's health bar becomes the guardian's, in purple.
- Flyers join the enemy's waves as the battle goes on (from 1:42 in world 1 down to 0:40 in world 9), every third troop of a wave, each world its own (bat, imp, gargoyle, drone, dragon whelp…); only our ranged troops, flyers and arrows reach them. After two minutes the waves bring the heavy troop more often.

## 1.14.23 - 2026-10-25

### Changed - Siege bow lasts longer and empties like a ball
- A full quiver now keeps the arrows going about ten seconds (twice as many shots: each takes 2.5 of 100 instead of 5); it refills at 12 a second while the bow is stopped.
- The quiver bar is gone: the round bow button is the meter, as in Cartoon Wars 2. Its orange fill sinks from the top as the quiver empties, leaving see-through glass, and rises again as it refills.

## 1.14.22 - 2026-10-25

### Added - Siege sounds
- Each bow shot is heard: a new `arrow` sound, a bowstring's twang and the arrow's whoosh, its pitch a little different each time so a volley rattles instead of droning (at most one a frame).
- The missile booms, the discharge strikes and summoning a troop clicks, all with the game's own sound effects and its effects volume.

## 1.14.21 - 2026-10-25

### Changed - Siege aim stick
- The aim is a stick as in Cartoon Wars 2: two big arrows and a green knob resting between them. Drag the knob up and the arrows' landing spot moves further (down, nearer) for as long as it is held, faster the further it is pushed; let go and the knob springs back to the middle while the landing spot stays where it was. Tapping the field still aims, and the stick takes the up/down keys when focused.

## 1.14.20 - 2026-10-25

### Changed - Siege arrows rain from the sky at long range
- Aimed far (from 760 on, the furthest aim 1080), the fortress's arrows stop arcing from the wall and fall from above the view, steep and accelerating, a little behind their landing spot; between the two they blend, so the further the aim, the steeper the rain. Damage and where they land are unchanged.

## 1.14.19 - 2026-10-25

### Fixed - Siege troop portraits fill their cards
- Troop pictures are cropped to what shows (alpha over 40) on the Army tab and the battle's cards, once per picture, so the ones with wide empty margins (the Monolith, Kernel Panic, gladiator, hoplite, mud blob, crusher…) are as big as the rest.

## 1.14.18 - 2026-10-25

### Added - 17 more Siege troops
- Every world's own cast joins the army, unlocked world by world (29 troops in all): land: raider (world 2), axe thrower and shield line (3), gladiator, frog and mud blob (4), hoplite, snapper and treant (5), turret (6, the longest range), crusher and zombie (7), skeleton and haunted tomb (8) and the stone drake (9); air: the gargoyle (3) and the dragon whelp (9).
- Armies still take five land and five air troops, so there is more to choose from. A new check keeps each troop's id equal to its place in the list.

## 1.14.17 - 2026-10-25

### Changed - Siege preparation with the worlds and the game's art
- The preparation screen has three tabs as button bars (`btn1_*`, the open one gold): Map, Army and Workshop, under a header with a back button, the title and the mode's gold (`store/coins-2`), over the world map's backdrop.
- Map: the nine worlds are the action modes' own islands (`map/*.webp`) in a row to scroll, numbered, won ones with the check ring and locked ones greyed with the padlock ring. The picked world's card shows its picture, name and description, its guardian standing on the right, the gold its first (or each new) victory gives, and the green play bar to launch.
- Army: the land and air troop cards in blue frames, gold when picked, padlocked until their world.
- Workshop: each upgrade a row with its picture in a ring (army helmet, fortress plate, energy orb, bow quiver), five level pips and its price in coins.
- «How to play» keeps the instructions, keys and the preview note.

## 1.14.16 - 2026-10-25

### Changed - Siege: the Town Hall as our fortress, and a notice to turn the phone
- Our fortress is now the Backlog's Town Hall, cut from its building sheet (`fortress/backlog/town-hall.webp`): wider and more of a castle than the Inferno Tower, which stays in the same folder for later. It is also our picture beside the health bars.
- Holding a phone upright, a notice at the top of the field asks to turn it sideways for a better view; it can be dismissed and is never shown once the phone is sideways or on desktop.

## 1.14.15 - 2026-10-25

### Changed - Siege proportions on phones held sideways
- On short landscape screens the HUD and the bottom bar are thin, as in Cartoon Wars 2: square 46 px cards, shorter L·A·S tabs, a smaller bow button and camera slider, so the field takes most of the screen (the bar took almost a third of it).
- Wide fields (phones sideways, and wide desktops) zoom in a little and put the bridge deck lower (62% down instead of the middle), so less of the chasm shows and the troops keep their size. The aim control now follows the deck's height on every screen.

## 1.14.14 - 2026-10-25

### Changed - Siege: our fortress is the Backlog's Inferno Tower
- Our fortress is the Inferno Tower cut from the Backlog's building sheet (`fortress/backlog/inferno-tower.webp`, its dark backdrop removed and its neighbours' corners dropped), standing on our end of the bridge; it is also our picture beside the health bars. It is never drawn taller than the room above the deck, so its health bar stays in view.
- The camera keeps a margin left of the field, so the aim control stands clear of the tower and the bridge's own left end shows; the backdrop and the chasm's shade cover that margin too.
- The enemy wall is its world's walled bench front in every world (world 1 used the plain bench while ours was the Backlog's walled one).

## 1.14.13 - 2026-10-25

### Fixed - Siege aim always on screen
- The aim control stays at the field's left edge whatever the camera shows, as before 1.14.12's follow-the-wall change, so the arrows can be aimed while looking at the enemy's side.

## 1.14.12 - 2026-10-25

### Changed - Siege on a bridge
- The battle is fought on one long bridge over the abyss, across the middle of the field: each world's Tactics bridge (`ui/bench/bench-N`) keeps its own two ends, and its two middle slabs repeat between them from wall to wall, the troops walking on its deck. The world's backdrop now fills the whole field and darkens into the chasm under it. The floor tiles are no longer used here.
- The aim is a compact ▲ ● ▼ control standing on our wall, at most half the field's height, so it no longer runs off the screen on phones; it scrolls with the wall and hides once the wall is out of view.
- The arrows' and the missile's arcs are capped so they never leave the top of the view.
- New layout rule for this mode (`docs/siege.md`, linked from `AGENTS.md`): every visual change is checked with desktop and phone screenshots, looking at where each element sits.

## 1.14.11 - 2026-10-25

### Changed - Siege bow is a switch
- The arrows button no longer has to be held: one tap starts the archers (arrows one after another, faster and more at a time the longer they keep on), another tap stops them, and an empty quiver stops them too. The quiver refills only while they are not shooting; «Reloading…» shows while it holds less than one shot. F toggles them on the keyboard.

## 1.14.10 - 2026-10-25

### Changed - Siege ground without tile corners
- The battlefield's ground is still each world's own floor, the one On Call is played on, but only its inside: the frame of walls round its edge showed as corners every time it repeated. Every other piece is mirrored so the joins match, and a band in the world's earth colours sits under it while it loads.

## 1.14.9 - 2026-10-25

### Added - Siege L · A · S tabs, air troops and the missile
- The bottom bar has Cartoon Wars 2's three tabs: L (land troops), A (air troops) and S (special powers); the cards in the middle change with the tab (keys L/A/S, and 1–5 for the tab's cards).
- Air troops fly above the field, their shadow under them, out of reach of melee troops (only ranged ones and other flyers hit them). The flame skull is now one, and four join: the bat (from world 1), the imp (2), the drone (4, ranged) and the crystal harpy (6, area damage), all from the worlds' own flying enemies.
- Armies take up to five land and five air troops; the preparation shows them in two groups. Older saves keep their troops.
- S holds the generator, the discharge and a new missile (`fx/rocket`): it arcs from our wall to the aim and blasts there (12 s recharge, key R).

## 1.14.8 - 2026-10-25

### Changed - Siege battle laid out like Cartoon Wars 2
- Top bar: mana (energy, its rate and the army count) on the left; both fortresses' health bars face to face with «VS» in the middle, our wall and the enemy guardian at their ends; time left, coins and pause on the right.
- The field: the bow's aim is a big ▲▼ control with a green orb standing on our wall; the camera is a small slider at the field's foot (dragging still pans).
- A mana angel stands on our side of the field, a winged crystal on a pedestal that glows brighter, and fills, with the energy, pulsing when full (`fx/wings-1` tinted blue, `fx/gem-big`).
- One bottom bar: the generator and the discharge as square magic buttons on the left, the five troop cards in the middle, and the bow as a big round button on the right with its quiver meter. On phones the cards take a second row.

## 1.14.7 - 2026-10-25

### Fixed - Arena thrower and shield wall sizes
- The Arena's thrower (`greek-ticket`) drew about 48 px tall, taller than its own shield wall and every other world's thrower (28–45 px); `SPRITE_CANVAS` k 3.5 → 2.6 brings it to about 36 px.
- Its shield wall (`greek-legacy`), the cast's tank, drew about 46 px; k 1.381 → 1.69 makes it about 56 px tall and 61 px wide, the biggest of the three as in the other worlds. The board's equal-height rule is unchanged.

## 1.14.6 - 2026-10-25

### Changed - Siege bow with a quiver meter
- Arrows no longer fly on their own or as a fixed volley. Hold the arrows button (or F) and they fly one after another at the aim, faster the longer it is held (up to twice as fast after 2.5 s, plus one more arrow at a time); each shot empties the quiver meter on the button, and let go it fills again. Run dry, it shows «Reloading…» until a third is back.
- New workshop upgrade, the Bow (five levels): shoots more often and adds an arrow per shot every two levels. Older saves start it at level 0.

## 1.14.5 - 2026-10-25

### Added - Siege story
- The campaign is told in story scenes, Cartoon Wars-style: the world's map picture behind, the speaker's portrait on their side and one line at a time (Next, or Skip to the end).
- Launching a fortress opens its world's scene: the narrator and your commander (your hero, under your name). World 1 starts with a three-line prologue.
- Each world's guardian speaks when it joins the battle (its standing pose on the right, its name from the action modes), and your commander answers; the battle waits until the scene ends.
- Retrying a battle skips the intro. All lines are in `src/strings.ts` in English and Spanish (`src/siege/story.ts` sets who says what).

## 1.14.4 - 2026-10-25

### Changed - Final bosses' songs sound like their worlds
- Six final-boss songs were whole new tunes that only shared their world's sounds; they are now their world's song as a boss version (same key, lead and melody, darker chords and a harder bass, starting on the drop):
  - Kernel Panic: the Backlog's chiptune melody in C minor, back on the Amen break.
  - Medusa: back in the mud world's D (it was a semitone lower), on its snake charmer tune.
  - Drakkar/Valdur: Code Freeze's horn call as a war march.
  - Carnivorous Queen: Legacy Jungle's marimba tune with a Phrygian bite.
  - Overclock Mech: The Forge's robot riff, faster.
  - Shadow Wraith: Haunted Servers' music box tune with the tritone.
- The Archdemon and Zeus already followed their worlds; Nocthrax plays Doomsday.

## 1.14.3 - 2026-10-25

### Changed - Nocthrax fights to Doomsday
- With the music «by world», the last boss, Nocthrax, now plays Doomsday (the final-boss song) instead of its own boss song.

## 1.14.2 - 2026-10-25

### Changed - Siege troops show their blows
- The boss sheets swap to their wind-up pose to strike and their flinch when hit; the other troops lunge forward and lean back.

## 1.14.1 - 2026-10-25

### Changed - Siege looks like Cartoon Wars 2, with the game's own art
- The battlefield is a side-scrolling scene: each world's map picture (`map/pv-*.jpg`) is the backdrop, panning slower than the troops, over the world's own sprint floor (`floors/worldN`).
- Each world sends its own guardian, its room-6 boss sheet (monolith, overlord, valkyrie, mud monster, queen, minotaur, mainframe, wraith, hydra), instead of the monolith everywhere.
- Troops walk on all their poses (six for the Arena and fire-world sets, four for the rest, the boss sheets' two steps and a stand) instead of two.
- Our fortress has archers instead of a cannon, like Cartoon Wars' castle bow: three arrows every 2.2 s on their own, and the volley button (was the cannon) rains seven. A vertical bow slider at the field's left sets where they land (up is farther); tapping the field still aims.
- Arrows are the bow's painted ones (`arrows/fire` wood from the fortress, `arrows/water` for our troops, `arrows/leaf` for theirs), flying in an arc; hits up close are impacts, and the discharge drops the yellow lightning bolt over a blast.
- The fortresses are the Tactics benches' walled fronts (`ui/bench/boss-N`): ours the Backlog's blue one, the enemy's its world's (the Backlog defends with its plain bench); the drawn tower stays only while they load.
- Pause, launch, generator, cannon and discharge use the `btn1_*` button bars (grey when unavailable).

## 1.14.0 - 2026-10-25

### Added - Siege / Asedio playable preview
- Playable Siege entry inside the existing fourth main-cover Coming Soon hub, preserving its separate Fortress link. Labelled “Coming soon · Playable preview” in English and Spanish. Opens preparation and a complete lateral fortress battle without changing the existing PlayMode save schema.
- Choose five troops, summon with regenerating energy and cooldowns, upgrade the in-battle generator, aim a friendly-fire-free cannon and trigger an area discharge. Troops fight automatically; opposing waves and a guardian defend the rival fortress. Includes victory, defeat, a five-minute limit, retry and pause/resume.
- Nine themed preview fortresses, eight troop families, independent unlocks, workshop upgrades and gold rewards. Validated versioned local save; reward settlement is idempotent. Existing action/Battle economies and Fortress are unchanged.
- Responsive portrait/landscape layout, camera drag/slider/base shortcuts, keyboard controls, background/tab pause, focus containment, reduced-motion handling and listener/animation cleanup.
- Existing sprites are reused unchanged. The fortresses/scenery and shared guardian are preview visuals; balance and campaign content remain experimental.
- New isolated `src/siege/` implementation and mode documentation. `test:game` also runs the Siege model regressions.

## 1.13.51 - 2026-10-24

### Added
- A fourth **Coming Soon** position in the main cover's game-mode carousel, using the same existing button artwork in grayscale with a gray indicator.
- The fourth slot opens a new-modes preview hub containing a link to the experimental Fortress Siege lab.
- The fourth position is not a persisted PlayMode; existing Sprints, On Call and Battle save values and game logic remain unchanged.

## 1.13.50 - 2026-10-24

### Fixed - Locked worlds on the map
- A locked world's play button is the same art in grey, and it no longer offers the Boss Rush, the bosses' showcase or Nightmare.

## 1.13.49 - 2026-10-24

### Fixed - Boss Rush
- Two stages a world again, its room-6 boss and then its final boss; the small-boss stages, which wore the cast's old four-frame sprites, are gone (world 1 alone is 2 rounds, five worlds 10).

## 1.13.48 - 2026-10-24

### Added - Fortress PvE assault prototype
- Three small isometric enemy bases can now be assaulted from outside their perimeter.
- Three temporary troop archetypes (warrior, thrower and tank), eight deployments, auto-moving and building damage with a basic wall and cannon combat model.
- Percentage destruction and up to three stars: 50%, Core Hall down, and 100%.
- Retry and troop choice controls, simple attack timer and troop/building health feedback.

### Limitations
- Troops are placeholder markers rather than existing BUG HUNTER unit sprites; damage/pathfinding are early prototypes, not production-ready.
- Fortress remains an isolated lab, not integrated into the game's main menu.

## 1.13.47 - 2026-10-24

### Added - Fortress isometric scene
- Fortress Lab now draws diamond-shaped isometric terrain instead of the initial rectangular CSS grid.
- Pan with drag, zoom with pinch or wheel, tap a diamond to inspect its coordinate and building; reset controls work in both orientations.
- Five adjacent wall segments in test level 3 are displayed as a continuous stone wall with end caps.
- The existing three simple test layouts and temporary building sprites are preserved; the lab remains separate from the live game menu.

## 1.13.46 - 2026-10-24

### Fixed - Fire-world cast and Kernel Panic recut from their own transparency
- Both sheets already came transparent, but they were opened as RGB, which dropped their alpha and left the painted backdrop; they were then cut against that backdrop, losing wings, fire and the Kernel's glitch effects and leaving its fringes. They are now laid out straight from the sheet's own alpha, untouched (`scratchpad` `cutalpha.py`: each cell's pieces, specks under 30 px dropped, feet on a shared baseline): the imp, skull and gargoyle with whole wings and fire (the gargoyle walks with its own first poses again, the imp flinches with its own), and the Kernel Panic with its full orbs, spirals and spark. New `SPRITE_CANVAS`/`BOSS_CANVAS` to match.

## 1.13.45 - 2026-10-24

### Changed - New Kernel Panic
- The Backlog's final boss, the Kernel Panic (`bosses/kernel-0..8.webp`), redrawn by the owner at a higher resolution in the game's pose order: two steps and a stand, the red-screened wind-up, the charge in a dust cloud, the ring of red error orbs, the glitch volley, the double spiral and the cracked-screen flinch. The sheet came on a purple gradient, so it was cut by colour distance from the inpainted backdrop like the fire world's cast (`scratchpad` `kp/cutk.py`), wider and more sensitive in the three poses whose effects share the backdrop's purple, pieces touching a cell's edge dropped; the flinch's square shadow from the sheet faded by hand. `BOSS_CANVAS.kernel` k 2.0, feet 0.0772. The old pictures are kept in `assets/old/01-backlog/bosses/`.

## 1.13.44 - 2026-10-24

### Changed - New Arena shield wall
- The Arena's legacy, the shield wall (`enemies/greek-legacy-0..5.webp`), redrawn by the owner as a chibi six-pose sheet: three warriors behind two big shields, a hoplite's spear over them; two steps and a stand, the wind-up with swords and spear raised, the thrust and a flinch. Cut like the gladiator and the hoplite, each pose kept to its own figure so the neighbouring pose's spear streak does not come in; `SET_FRAMES['greek-legacy']` 6, `SPRITE_CANVAS['greek-legacy']` k 1.381, feet 0.0048. The Arena's whole cast now has six poses; the old pictures are kept in `assets/old/06-the-arena/enemies/`.

## 1.13.43 - 2026-10-24

### Changed - New Monolith
- The Backlog's room-6 boss, the Monolith (`bosses/monolith-0..8.webp`), redrawn by the owner as one 3×3 sheet on white at a far higher resolution (its body was about 90 px tall, now about 330): stance, two steps, wind-up, the charge with a purple trail, the ring of rocks, the bug-report volley, the ground slam and a flinch with an X-eyed screen. Cut with `kernel/cut.py` `seg`, `EDGECUT=1`, `HOT=1` at up to 520 px, its cells set by hand where the trail, the ring and the slam ran past the thirds; `BOSS_CANVAS.monolith` k 2.45, feet 0.2243. The old pictures are kept in `assets/old/01-backlog/bosses/`.

## 1.13.42 - 2026-10-24

### Changed - New fire-world cast
- The fire world's bug, ticket and legacy redrawn by the owner as six-pose sets: a flying imp, a floating flaming skull that spits a fireball, and a stone gargoyle with lava cracks (`enemies/demon-{bug,ticket,legacy}-0..5.webp`, `SET_FRAMES` 6, new `SPRITE_CANVAS`; the imp's icon remade). The sheet came on a red gradient, so they were cut by their colour's distance from the backdrop, inpainted and blurred, with the segmentation mask for the figure (`scratchpad` `demon/cutd.py`): dark wings and bright fire are kept, the haze is not; the gargoyle's two first poses lost part of their wings against the dark, so its walk uses its full-winged poses, and the imp's ragged flinch is its stance.
- The four-frame pictures they replace are kept in `assets/old/02-hotfix-inferno/enemies/` (with a README), not loaded by the game. The sheet's bottom row, an infernal sorcerer, has too few poses for a skin.

## 1.13.41 - 2026-10-24

### Changed - New Arena hoplite
- The Arena's ticket, the hoplite (`enemies/greek-ticket-0..5.webp`), redrawn by the owner as a chibi six-pose sheet in blue with a spear: two steps and a stand, the wind-up, the throw with the spear flying off and a flinch. Cut like the gladiator (`greek/cut6.py`, spear tips kept solid), and both recut with their rims pulled in a pixel and unblended from the paper's white so no pale halo shows on the floor, the paper trapped between a spear or sword and the body dropped, and every blade filled to its outline (its white ridge and tip were cut away as paper); `SET_FRAMES['greek-ticket']` 6, `SPRITE_CANVAS['greek-ticket']` k 2.928, feet 0.0078.

## 1.13.40 - 2026-10-24

### Added - Skins in the shop
- A «Skins» section at the top of the shop, folded like the others, with the worn hero as its icon and how many you own: every skin as a card with its standing picture, name, joke and price, in the list's order. A skin on sale is unlocked here («Desbloquear · 🪙 N», `data-skin-buy`); one not yet open shows its gate («🔒 Gana el mundo N»…) greyed; one owned offers «Ponérsela en Personalizar», which opens Customise's character list, and the worn one reads «✓ Equipado». As with items, the shop only unlocks: skins are still worn (and can still be bought) in Customise.

## 1.13.39 - 2026-10-24

### Changed - New Arena gladiator
- The Arena's bug, the gladiator (`enemies/greek-bug-0..5.webp`), redrawn by the owner as a chibi six-pose sheet: two steps and a stand, the wind-up, the strike with a golden swoosh and a flinch. Cut on one canvas (segmentation mask for the figure, effects unblended from white, each pose centred on its body with its feet on the bottom; the white and pale metal its outlines enclose, the sword blades, kept solid, since the mask left them see-through; `scratchpad` `greek/cut6.py`), its icon for Customise remade from the stand. The Arena's other kinds keep their four frames: a set can now have its own frame count (`SET_FRAMES` in `draw.ts`); `SPRITE_CANVAS['greek-bug']` k 2.084, feet 0.0084.

## 1.13.38 - 2026-10-24

### Added - Fortress early prototype
- Ten distinct transparent SVG placeholders for the first Backlog fortress buildings and wall; one asset file per building, not level upgrades.
- Three very easy Fortress layout test stages: Core Hall, resources, and a cannon with five wall pieces.
- Standalone responsive layout inspector at `/fortress-lab.html`; select buildings in landscape or portrait. Fortress is still not a playable or integrated game mode.
- Asset projection support for `assets/special/fortress/` and asset manifest for future integration.

### Scope
- These are new simple placeholders, not actual crops from the earlier concept sheets. Original gameplay modes remain unchanged.

## 1.13.37 - 2026-10-24

### Changed - New Minotaur
- The Arena's room-6 boss, the Minotaur (`bosses/minotaur-0..8.webp`), redrawn by the owner as one chibi 3×3 sheet, all poses at one scale: stance, two steps, wind-up, horns-first charge, sword spin (ring), three golden javelins (move), sword slam (signature), flinch (hit). Cut at full resolution (up to 520 px, the old one came from a sheet shrunk to 63%) with `kernel/cut.py` `seg`, `EDGECUT=1`, `HOT=1`, its cells set by hand where the javelins and the ring ran past the thirds; `BOSS_CANVAS.minotaur` k 2.83, feet 0.2455.

## 1.13.36 - 2026-10-24

### Changed
- Phone Tactics: the arena's floor picture ends at the shop's middle instead of the bottom of the screen, a little squashed, so its own lower wall shows round the bench rather than hidden below the shop; the top fence stays whole.

## 1.13.35 - 2026-10-24

### Changed
- Phone Tactics: the shop panel (cards and buttons) sits lower, 22 px into the home bar's safe area on an iPhone (2 px from the bottom elsewhere), and the bench 12 px lower than before against it; the board grows into the room they leave.

## 1.13.34 - 2026-10-24

### Changed
- Phone Tactics: your hearts move to the lower right of the screen, still on the bench caption's line; the caption is back at the left.

## 1.13.33 - 2026-10-24

### Changed
- Phone Tactics: your hearts (♥ ×N, red from 3 down) sit at the lower left on the bench caption's line, the caption beside them, while preparing and fighting (`.board-life`); they are no longer drawn over your hero there. Desktop and Fusion are unchanged.

## 1.13.32 - 2026-10-24

### Fixed - Units on the board's last row could not be dragged
- Since the board moved half a cell lower (1.13.30) the bench's seats lie over its last row on the phone, and they took the touch, so a unit standing there could not be dragged. Now only the seats themselves take the pointer (empty seats none; the tray, the bench and its art never), a press on a seat over a board unit is handed to the board, and a drop counts as the bench only on a seat itself (`benchSeatAt`), so the last row stays the board's.
- Checked with Playwright at 390 px: last-row units drag with the bench empty and full, reserves still deploy, and shop cards still drop onto the last row. On localhost `window.bugHunterBoardLay` exposes the board's layout for such tests.

## 1.13.31 - 2026-10-24

### Changed
- World 8's scenery (`scenery/grave-*.webp`: the graves, fences and coffins used as blocks in every mode and as the board's wall) has its purple flames turned blue like its floor and bench; the orange candles stay.

## 1.13.30 - 2026-10-24

### Changed - Bench seats, board position and world 8's colours
- Bench seats are fixed: a reserve keeps the seat it is put on and gaps are allowed (`slot.r`, `freeSeat`, `moveBenchSeat` in `board.ts`). A shop card or a board unit dragged onto a seat goes to that seat (onto an occupied seat a board unit swaps with the reserve there); a reserve dragged onto another seat moves there, swapping. A tapped card that overflows still takes the first free seat.
- Phone Tactics: the bench sits higher (24 px) and the whole board, wall included, half a cell lower.
- World 8's floor (`floors/world8.webp`, used by every mode) has its purple mist and flames turned blue, like its bench; the orange candles stay.
- New regression check for the bench seats (28 in all).

## 1.13.29 - 2026-10-24

### Changed
- The bench's stars float clear above each unit's head instead of over it; on desktop the bench caption moved up so the stars do not run into it.

## 1.13.28 - 2026-10-24

### Added - Convergence background in Customize
- Added the original Convergence arena as a free selectable scene in Customize → World, with its own thumbnail and saved selection.
- Battle draws the selected background within the existing arena bounds; board geometry, unit positions, divider animation, bench and shop layout remain unchanged.
- Sprints can use the same floor and On Call its tiled interior, following the existing cosmetic scene behavior. Gameplay worlds and progression are unchanged.
- Reuses the original JPEG without editing, resizing or recompressing the source asset.

## 1.13.27 - 2026-10-24

### Changed - The board's own stars on the bench
- The bench's stars are the ones the board draws: the painted star of `ui/icon_star.webp` recoloured bronze (★1), silver (★★) and gold (★★★), overlapping in a row over the unit's head. Baked once as `assets/shared/ui/star-1..3.webp` with the board's own crop and colours (`starPicture` in `boardViewRender.ts`). ★1 now shows too, as on the board.

## 1.13.26 - 2026-10-24

### Changed - Rarity and stars on the bench
- Under each reserve a glowing oval in its rarity's colour, the same as the board's rings: grey common, blue rare, purple epic, orange legendary, red mythic (half as bright while fighting).
- Its stars are gold ★ over its head, plain glowing text, in place of the dark pill at its feet that hid under the seats.

## 1.13.25 - 2026-10-24

### Changed
- On the phone the Tactics bench runs from one edge of the screen to the other, like the bonuses' rail.

## 1.13.24 - 2026-10-24

### Fixed - Reserves lined up on the bench
- The reserves stood at different heights: each sheet's picture carries its own empty margin under the feet and round the figure, and they were fitted to one box by its bottom edge, so a picture with more margin floated higher and one with more room round it came out smaller. Each picture is now cropped to what shows (`trimPic` in `main.ts`, alpha over 40, kept per picture) and stood with its feet on the seats' line, at one height per step (bug, thrower, heavy, sub-boss, boss: `--u` in `game.css`), on the phone and on desktop. On desktop the stars sit under the unit.

## 1.13.23 - 2026-10-24

### Changed
- The phone's Tactics bench sits 3 px higher.

## 1.13.22 - 2026-10-24

### Changed - Bench lower, behind the shop, and kept in the fight
- Phone: the bench hangs from the tray's top (100 px, it was 140) with its seats just over the shop and the rest of the picture going on down behind the shop's panel, uncropped; the tray sits under the shop (`z-index`). The reserves are drawn bigger on their seats.
- The bench stays in view while fighting (phone and desktop), its reserves dimmed (`brightness(0.5)`) and not draggable; its caption hides in the fight on the phone, where it ran into the army counter.

## 1.13.21 - 2026-10-24

### Changed - One four-seat bench per world in Tactics
- The Tactics reserve is now a single bench, the owner's four-seat art for the world being played (`assets/shared/ui/bench/bench-1..9.webp`, 640 px wide), cut from his dark sheets with the segmentation model, the glows (flames, lava, ghost fire, crystals) kept as light unblended from the backdrop and the drop shadows dropped. It replaces the per-unit platforms of 1.13.12–1.13.13, whose pictures (`world-N`, `boss-N`) are no longer used.
- The reserves stand on its four seats (`BENCH_ART` in `main.ts`: each bench's height and the seats' line, the seats between 15% and 85% of its width), their stars at their feet.
- Phone: the bench spans the tray's width at its own shape; the tray is 140 px (it was 94), and the bench's tops rise a little over the board's bottom edge. Desktop: the bench is horizontal, 340 px, in the open strip left of the board (beside it when there is no room).

## 1.13.20 - 2026-10-24

### Added - Guide pages for the worlds and the shop
- «Mundos / Worlds» (9 pages now): a screenshot of the World map (`book/map.webp`, `map-en.webp`) and how it works: islands and their badges, each mode's own progress, and the play button's options by swiping or its arrows (world, Boss Rush and See the bosses in Sprints; world and Nightmare in On call; Fusion and Tactics on the Board).
- «Tienda / Shop»: a screenshot of the shop (`book/shop.webp`, `shop-en.webp`; the localhost-only test-ad gift was removed before taking it) and its sections: coins, the Forge, Armour and Weapons, the Arsenal and Spirits.
- Both shots are shown whole (`object-fit: contain`), so the map's play button and the shop's coins are in view.

## 1.13.19 - 2026-10-24

### Changed - English guide screenshots
- The guide's pictures that show the game's words (Fusion, Tactics, the abilities panel and Customise) have English copies, `book/<name>-en.webp`, taken the same way, shown when the game is in English (`bookPic`). Sprints and On call have no words in them and stay shared.

## 1.13.18 - 2026-10-24

### Changed - Guide: swipe between pages, Fusion and Tactics explained apart
- A clear sideways swipe on a guide page turns it (left for the next, right for the last), with a short slide; the Next and Back buttons stay, and the page counter says «desliza para pasar página». The mode bar on the first page keeps its own swipe, which changes the mode. The guide's pictures take no drag of their own and its box only scrolls vertically, so the swipe is not cancelled.
- The single Board page is now two (7 pages in all): «Tablero · Fusión» (summon, merging by dragging or the auto-merge, the fight) and «Tablero · Táctica», explained further with two world-1 screenshots: the shop, bench and army (`book/tactics.webp`) with rarity, price, stars, bench and the +15% for the world being played; and the abilities panel (`book/tactics-bonus.webp`) with each world's ability and the two-worlds / five-units boost. Fusion's picture is `book/fusion.webp`. Screenshots taken with Playwright at 390 px.

## 1.13.17 - 2026-10-24

### Changed - Clearer guide: the play bar to learn on, and a Customise page
- The guide's first page no longer lists the three modes as separate buttons: it shows the cover's own play bar (the arrowed bar in the mode's colour, with the mode's description), which is swiped or turned by its arrows like on the cover, with dots under it, a pulsing «⬅️ Swipe it or tap its arrows ➡️» and a finger sliding across it. Picking a mode there still sets the cover's mode.
- New guide page, «Customise» (6 pages now): a screenshot of the screen (`assets/shared/book/custom.webp`, taken with Playwright at 390 px) and three short points: the slots and the amulet, the round buttons (character, enemies, world, music), and that items are unlocked in the Shop.
- The finger and the hint stand still under `prefers-reduced-motion`; retro shows plain bars with ‹ › arrows.

## 1.13.16 - 2026-10-24

### Changed - Wider play bar on the phone cover
- The cover's play bar now spans from the left card's edge to the right card's, with its tap area and arrows moved out to match. The desktop cover is unchanged.

## 1.13.15 - 2026-10-24

### Changed - Gold achievements button
- The profile's «Logros» button is the gold simple bar (`btn1_gold`) with black text.

## 1.13.14 - 2026-10-24

### Changed - One button rule: tap or swipe
- Every button you only tap now uses the simple bar, the shape of «Conectar con código», in its own colour: new `assets/shared/ui/btn1_{blue,green,orange,red,gold,purple}.webp`, the grey `btn_gray` with its face recoloured. This covers every dialog (profile, pause, end of run, shop, Customise, the guide, the board's buttons, the friends' «Conectar»), keeping each button's colour and icon.
- The bar with the big arrows and leaves (`btn2_*`) now means «swipe me»: only the cover's play bar and the map's play button when it has more than one option wear it.
- The cover's play bar is that arrowed bar in the mode's colour (green Sprints, red On call, blue Board), laid over the painted one with its words centred, on a dark rail of the same shape.
- Swiping a play bar now drags it with the finger; let go past 40 px and the next option slides in from that side, otherwise it springs back. Nothing moves under `prefers-reduced-motion` beyond the drag itself. The cover's painted cards (map, shop, Customise, options) are unchanged.

## 1.13.13 - 2026-10-24

### Changed - One platform per reserve, grander ones for bosses
- The single mobile platform of 1.13.12 was stretched to the bench's width and came out squashed, half hidden under the shop. Every reserve now stands on its own platform at its own shape, on mobile as on desktop.
- The platform is the unit's own world. Sub-bosses and bosses (tier 3 and up) stand on the owner's second, grander set (`assets/shared/ui/bench/boss-1..9.webp`, `/images/game/ui/bench/boss-N.webp`), cut from his opaque black sheet: solid body, glows unblended from the black.
- An empty slot shows the played world's platform, faint. Retro look and bench behaviour are unchanged.

## 1.13.12 - 2026-10-24

### Changed - World platforms for the Tactics bench
- The Tactics bench now stands on the owner's platform art, one per world (`assets/shared/ui/bench/world-1..9.webp`, served as `/images/game/ui/bench/world-N.webp`), cut from his 3×3 sheet: Backlog server slab, lava rock, frozen Viking dais, mud swamp, jungle ruin, Arena marble, Forge furnace, haunted grave stone and Core crystal.
- The platform is the world being played. On mobile it spans the whole width of the bench and the reserve units stand on it; on desktop, where the bench is a column, each slot stands on its own copy at its own shape.
- It replaces the small per-unit world blocks of 1.13.6. Retro look, bench behaviour, drag and drop and capacity are unchanged.

## 1.13.11 - 2026-10-24

### Fixed - Board bugs (Tactics and Fusion)
- Online board fights could play out differently on each phone: an army arriving over the link was still clamped to the old rows 4–7, while your half is now rows 5–8. A unit on the back row was moved forward (onto the wall row or another unit) on the rival's phone only. It is now clamped to the real board (`COLS`, `HOME_ROW`, `ROWS`).
- A run could lock: with no units on the board or the bench and not enough gold for the cheapest card (Tactics) or a summon (Fusion), the fight button stayed disabled for good. It is now enabled in that case (`stranded`/`canFight` in `board.ts`); the round is lost and its gold paid as usual.
- Fusion auto-merge: when a unit waiting to merge was sold or moved during the lightning, the other pairs on the board stopped merging until the next summon. They now merge in turn.
- Fixed two TypeScript errors (`openPrivacyChoices` on `window`, an unused parameter in `queenVineWalls`), so `npm run typecheck` passes again.
- Regression checks updated to the current Tactics rules (a bought card's slot is refilled; at army capacity an extra unit goes to the bench) and new checks added for the lock and the auto-merge. 27/27 pass.
- No combat values, prices or balance changed.

## 1.13.10 - 2026-10-24

### Fixed - Tactics bonus counters
- Fixed the Tactics bonus rail showing the same `x/5` value on every world medallion. Since 1.13.3 each icon was incorrectly displaying the total deployed army size, so all bonuses repeated the same counter.
- Each medallion now shows the deployed count for its own world, capped at `5/5`. Example: two Backlog units, one Jungle unit and two Forge units display `2/5`, `1/5` and `2/5` respectively.
- Updated the bonus-panel hint to make the distinction explicit: the per-icon counter describes world composition, while the actual Tactics power-up rule remains global — mix at least two worlds, then reach five deployed units for the stronger combo.
- No Tactics combat values, synergy thresholds or unit stats changed.

## 1.13.9 - 2026-10-24

### Fixed - Mobile Tactics bench positioning
- Fixed the actual cause of the reserve disappearing on mobile: the bench container was being given viewport `left/top` coordinates by the desktop/floating positioning path while also being `position: relative` inside the mobile tray.
- Mobile Tactics now lets `boardMobileTray` own the reserve position and explicitly clears stale inline `left/top` offsets.
- The four world-plinth reserve slots and the overlaid `Bench · n/4` caption remain, and the board keeps the extra vertical space reclaimed in 1.13.7.
- Desktop reserve positioning and drag/drop behavior are unchanged.

## 1.13.8 - 2026-10-24

### Fixed - Tactics bench visible again
- Fixed the mobile Tactics reserve disappearing after the 1.13.7 bench-caption overlay change.
- The reserve now uses an explicit four-column grid with a fixed 94 px tray and 88 px visible slots instead of relying on flexible square aspect-ratio sizing that could collapse or overflow off-screen.
- The `Bench · n/4` caption remains overlaid in front of the board, so the board keeps the space reclaimed in 1.13.7.
- Bench drag/drop behavior, capacity, unit art, world plinths and desktop layout are unchanged.

## 1.13.7 - 2026-10-24

### Changed - More mobile board space
- Mobile Tactics no longer reserves a separate row for the `Bench · n/4` caption. The caption now floats over the lower edge of the board, in front of the arena.
- Reclaimed the former caption height for the playable board by reducing only the reserve tray's reserved height by 18 px; the reserve-unit plinths keep approximately the same usable size.
- The army-capacity chip remains positioned under the divider and neither label intercepts unit dragging.
- Desktop layout, combat geometry, bench capacity, shop layout and gameplay are unchanged.

## 1.13.6 - 2026-10-24

### Changed - Tactics reserve and world identity
- Replaced Tactics bench rarity-card frames with physical world plinths: each reserve unit now stands directly on an existing square scenery block from its own world. Character names are removed from the compact bench; stars remain as the progression indicator.
- The bench reuses existing world art without adding, resizing or recompressing assets. Mud intentionally uses the same wet-stone fallback already used by its arena wall rendering.
- Gave all nine world-ability medallions distinct identity colours through their background, ring and glow: Backlog lime, Inferno orange-red, Code Freeze cyan, Mud ochre, Legacy Jungle emerald, Arena gold, Forge royal blue, Haunted Servers violet and Core magenta.
- The same world colours appear in the bonus details panel, making similarly coloured source icons such as Code Freeze and Legacy Jungle easier to distinguish.
- Gameplay, Tactics/Fusion balance, unit stats, drag/drop behavior and public asset URLs are unchanged.

## 1.13.5 - 2026-10-24

### Changed - Harder Fusion AI
- Fusion round 1 remains introductory. From round 2 every rival wave is guaranteed at least one merged Ticket-tier unit.
- From round 4 every Fusion rival wave is guaranteed at least one Legacy-tier unit; from round 7 it is guaranteed two. Sub-bosses and final bosses remain confined to their intended rounds.
- From round 2 Fusion rival waves receive 20% more composition budget and strongly prefer spending that budget on higher merged tiers instead of filling the board with base Bugs.
- Fusion enemy combat strength rises from 95% in round 1 to 105% in round 2, then gains 4.5% per round, reaching about 138% by round 9 and 143% by round 10 before tier, world and boss effects.
- Tactics star progression, player Fusion economy, summon probabilities, merge rules and player unit stats are unchanged.

## 1.13.4 - 2026-10-24

### Changed - Much harder Tactics AI
- Round 1 remains the introductory fight, but from round 2 the rival is guaranteed at least one 2-star unit.
- Rival star progression is much faster: more 2-star units appear each round, the first 3-star unit appears from round 7, and up to two 3-star units appear from round 9.
- From round 2 the Tactics rival receives 20% more wave budget, allowing stronger and/or fuller enemy boards without changing Fusion waves.
- Tactics AI combat strength rises from 90% in round 1 to 100% in round 2, then gains an additional 4% per round, reaching 132% base strength by round 10 before star multipliers and world abilities.
- Fusion enemy strength, Fusion star behavior, player unit stats and player economy are unchanged.

## 1.13.3 - 2026-10-24

### Changed - Tactics bonus rail
- Tactics world-ability medallions are pinned flush to the right edge of the viewport with no horizontal margin.
- Their compact counter now shows team progress toward the five-unit enhanced-combo threshold as `current/5` (capped at `5/5`) instead of repeating the number of distinct worlds.
- The bonus details panel uses the same numeric progress. Fusion synergy counters and combat rules are unchanged.

## 1.13.2 - 2026-10-24

### Maintenance - Assets organized by world
- Grouped the nine worlds under `assets/worlds/`, with their existing enemies, bosses, floors and scenery. Common art is under `assets/shared/`; secret-shift bosses are under `assets/special/secret-shift/`.
- Preserved sprite filenames, numbered frames and original Git blob contents. No image resizing or recompression, gameplay changes, save changes or combat-layout changes are included.
- Added a build-only asset-path resolver: the browser still receives the same `/images/game/...` URLs. Runtime renderers, CSS and HTML image URLs are unchanged.
- Development asset watching uses the same mapping and isolates per-world deletion. Duplicate URLs, case-only collisions, file/directory conflicts and symlinks fail explicitly instead of overwriting files.
- The post-build check now compares the exact mapped public asset set and its bytes in both `dist/` and `public/`.
- Updated README images, source-path examples, asset documentation and development guidance. Added 24 asset-layout tests to the existing layout test command.

### Verification and limits
- The 24 new fixture tests passed locally on Node 22.16.0; the changed integration JavaScript passed syntax checks. The project requirement remains Node 24.x.
- These checks exercise asset projection, copying, development-watcher behavior and output verification with temporary fixtures. They are not a full production build, a complete project typecheck or in-game visual validation. The existing preparation tests remain in the command; no new claim is made here about running the complete project suite.

## 1.13.1 - 2026-10-24

### Maintenance - Dedicated game directory
- Consolidated game source, HTML, art, development scripts, documentation and release notes under `bug-hunter/`, with a README visible when opening that folder.
- Moved `src/game/` to `bug-hunter/src/` and `static/images/game/` to `bug-hunter/assets/`. Gameplay modules and art bytes are unchanged; the version metadata and asset documentation were updated.
- The shared Vite configuration prepares disposable public files while preserving `/game.html` and `/images/game/...` in development and production. The root `game.html` is now generated and ignored, not a second editable source.
- Kept the shared storage implementation through a small adapter, without changing save keys. Updated TypeScript includes and the existing game regression script's source paths.
- Added 12 dependency-free integration tests for the preparation layer, plus a post-build check that verifies every game asset in both `dist/` and `public/` byte-for-byte against its source.
- Root documentation links to the game; the previous detailed agent notes are retained as a historical document. The old changelog path remains a navigation link.

### Verification and limits
- All 12 integration tests passed locally with temporary fixtures and a mocked development-server interface. The integration JavaScript passed Node's syntax check.
- These checks do not constitute a full Vite production build, a complete project typecheck, or in-game visual validation. No gameplay, balance, layout, sprite-resolution, save-schema or combat-animation changes are included in this release.

## 1.13.0 - 2026-10-23

### Release - Tactics update
This minor-version milestone consolidates the Tactics work and related boss changes already released through v1.12.61. The entries below retain their original version numbers and details; they are not retroactively renamed.

### Tactics and mobile battle layout
- Stable board geometry and floor framing across preparation, combat and results, while preserving the divider's original lowering/raising animation.
- Mobile board shifted down 8 CSS pixels without resizing cells; dragging and hit testing use the same origin. The army-capacity counter sits below the divider on the left, and the bench heading is left-aligned above the reserve cards.
- Queen's visible vine-wall segments, five-lane roots and staggered thorn volleys; Wraith's ghost formations and delayed targeted strike. Final-boss conditions use the reachable tier 4, and delayed geometric volleys retain their intended flight lifetime.
- Existing tactical damage budgets, shop/card positions and desktop layout are preserved.

### Related boss changes in Sprints / On Call
- Queen's warned thorn-vine walls and expanded root patterns; Wraith's additional clone projectiles and staggered ghost fans.
- Medusa keeps her generic backup summons, using purple or turquoise snakes instead of frogs according to her phase.
- Kernel Panic's introductory difficulty remains unchanged.

### Versioning and scope
- The game version advances from 1.12.61 to 1.13.0. Follow-up fixes to this milestone use 1.13.1, 1.13.2, and so on; a future substantial feature milestone can advance the minor version again.
- This commit changes only version metadata and release notes. It introduces no additional gameplay, balance, layout or asset changes, and does not imply new runtime or visual validation. The verification limits recorded for earlier patches still apply.

## 1.12.61 - 2026-10-23

### Changed
- Mobile battle board: translate the grid, units and divider 8 CSS pixels down without resizing cells. Hit testing uses the same translated origin.
- Mobile Tactics: move the existing army-capacity label below the divider on the left, and left-align the bench heading above the reserve cards. Live counts and localized labels are preserved.
- Shop/card positions, desktop layout, combat rules and the divider's raise/lower animation are unchanged. Preparation/fight/results keep the stable viewport introduced in 1.12.60.

### Verification and limits
- Ten local mocked integration/geometry checks passed, covering phase stability, unchanged cell scale, hit coordinates, label positioning, 600-frame non-accumulation, rerendering and desktop restoration.
- The integration module passed an isolated strict TypeScript check against the renderer's public signatures. Full production build and in-game visual testing were not run for this change.

## 1.12.60 - 2026-10-23

### Fixed
- Restored the divider's original sink-on-fight and rise-on-results animation. Version 1.12.58 incorrectly disabled that animation instead of fixing the layout.
- Mobile board geometry and floor framing now retain preparation's reserved shop/bench space while combat controls replace them. This fixes the divider's screen-position jump without freezing its animation.
- Split the existing, restored rendering implementation into boardViewRender.ts and the small viewport integration into boardView.ts; existing imports and desktop geometry are preserved.
- Queen's five-lane tactical roots and Wraith's delayed tactical strike now activate at their reachable final tier (4), rather than requiring an unavailable tier 5.
- Queen/Wraith delayed geometric volleys include the waiting period in their lifetime, so later waves retain the intended 2.4 seconds of flight.
- Queen's tactical wall endpoints now agree with the planner's 20-unit clamp, preserving the full 70-unit opening.

### Verification and limits
- Local geometry/integration tests and boss-planner regression tests passed (18 checks). The modified TypeScript modules also passed an isolated strict typecheck against the renderer's public signatures.
- Non-target boss plans were compared against v1.12.59, including Kernel Panic: unchanged. Shared damage budgets are preserved.
- This is not a full production build or an in-game visual certification. Other animation/assets, Medusa summon-limit interactions, and action-mode pattern visuals remain to be validated; they are not claimed fixed by this release.

## 1.12.59 - 2026-10-23

### Fixed
- Carnivorous Queen (World 5): her regular acid move now also creates two visibly warned rows of persistent thorn-vine walls with alternating safe openings in On Call/Sprints.
- Tactical final Queen: her root signature additionally creates paired vine-wall segments with distinct safe gaps.
- Existing thorn projectiles, roots, boss attack damage rules and other bosses remain unchanged.

## 1.12.58 - 2026-10-23

### Fixed
- Tactical battle: the divider wall remains at the exact same row during preparation, combat and round results instead of sinking as the fight starts.
- Unit, board and other asset positions are unchanged.

## 1.12.57 - 2026-10-23

### Added
- Carnivorous Queen (World 5): staggered geometric thorn volleys with alternating escape corridors, alongside her existing roots. The extra pattern starts below half health in On Call/Sprints and accompanies her final-boss root cast on the tactical board.
- Shadow Wraith (World 8): three delayed ghost projectile fans arranged in a triangular attack pattern alongside its clone ability, in both action and tactical boss modes.
- Tactical boss projectiles now preserve individually staggered launch delays after their cast wind-up.

### Unchanged
- Kernel Panic's introductory difficulty and attacks.
- Existing boss damage budgets, other bosses' unique attacks, and all sprite assets.

## 1.12.56 - 2026-10-23

### Changed
- Carnivorous Queen: below half health, the root attack expands from three to five staggered lanes in On Call/Sprints. Tactical final-boss roots also expand to five staggered lanes.
- Shadow Wraith: clones add a aimed, dodgeable ghost projectile in On Call/Sprints. Tactical final-boss clones add a delayed targeted ghost strike.
- Kernel Panic and other boss kits remain unchanged.

## 1.12.55 - 2026-10-23

### Fixed
- Medusa (World 4) keeps the standard two-enemy backup summons on their existing schedule, but they appear as snakes rather than the Mud world's frogs.
- Medusa's separate snake-from-hair summons are unchanged: purple in phase 1, turquoise in phase 2, with the same timing and limits.

### Scope
- Other bosses' generic backup summons are unchanged.
- No sprite files or combat attack timings were changed.


