# Fortress — foundation (draft v0.1)

Status: **early test preview**. Three static layout stages can be inspected via `/fortress-lab.html`; Fortress is not yet a playable or menu-integrated mode.
Owner: BUG HUNTER. This document is the starting contract for implementation.

## Vision
Build and defend **one persistent player fortress**, using buildings, walls, traps and auto-defenses. Conquer nine themed PvE enemy fortresses to unlock building styles, defense tech and rewards. Reuse BUG HUNTER characters as possible raid troops later. Do not clone Clash of Clans gameplay or art one-for-one.

## Screen/orientation decisions
- **Landscape-first** for full base editing, attacking, camera navigation and battle replay.
- **Portrait-supported** for inspection, harvesting, upgrades and light editing; no gameplay data may depend on screen orientation.
- On narrow portrait screens offer zoom/pan and concise toolbars rather than shrinking the entire base into illegibility.
- Camera and input can change by orientation; tile positions, combat physics and saved layouts cannot.
- Desktop: mouse drag, click, scroll zoom and keyboard shortcuts; mobile: touch pan, pinch zoom, long-press or select-then-place.

## Player progression
- Exactly **one player-owned persistent base** for MVP.
- Nine world themes are visual/tech unlocks, **not nine separate player save slots**.
- PvE enemy fortresses belong to each world. PvP is a future option, not MVP.
- Building theme and building function are separate: e.g. Core Hall from The Core, ice wall, fire tower. Visual skins must not silently change stats.
- Town Hall / **Core Hall** is the premium focal-point asset: largest, most distinctive silhouette, themed versions for all nine worlds.

## World themes
1. The Backlog — bug/code, cyan circuit masonry.
2. Hotfix Inferno — volcanic metal, fire, horns.
3. Code Freeze — Nordic wood/stone, snow, ice.
4. Big Ball of Mud — marsh, poisonous sludge, fungi.
5. Legacy Jungle — ancient ruins, roots, lush growth.
6. The Arena — Greek marble, gold, blue lightning.
7. The Forge — robotic industry, furnace and gears.
8. Haunted Servers — spectral blue/purple, haunted technology.
9. The Core — black obsidian, magenta crystal, dragon motifs.

## Full candidate building catalogue (concept only)
**Civic / army:** Core Hall (Town Hall), Clan Castle equivalent (alliance future), Builder Hut, Hero Hall, Hero Altar, Barracks, Dark Barracks, Army Camp, Laboratory, Blacksmith, Spell Factory, Dark Spell Factory, Workshop, Pet House.

**Economy:** Gold Mine, Gold Storage, Elixir/Energy Collector, Elixir/Energy Storage, Dark Essence Drill, Dark Essence Storage. Final resource names/economy to be designed before implementation.

**Defenses:** Cannon, Archer/Ranged Tower, Mortar, Air Defense, Wizard/Elemental Tower, Hidden Tesla, Bomb Tower, X-Bow, Inferno Tower, Scattershot, Eagle Artillery, Monolith, Spell Tower; later consider Ricochet Cannon, Multi-Archer Tower and other evolved/fused variants.

**Traps:** Bomb, Giant Bomb, Spring Trap, Air Bomb, Seeking Air Mine, Skeleton Trap, Tornado Trap and thematic extensions.

**Walls:** repeatable straight segment, corner, end cap and gate. Consistent tile footprints and modular joins in every world; wall placement as continuous drag-paint is a later editor feature. Walls affect pathfinding and collision, not only visuals.

The atlas images discussed are **concept references**, not runtime-ready cropped sprite files. Each final asset needs an individual transparent file and common anchor/isometric footprint. No level variants until level design is agreed.

## MVP (first playable milestone)
1. Landscape fortress scene; portrait management layout.
2. Grid map with pan/zoom and snap-to-grid, placement preview and collision/occupancy check.
3. Persistent local save, schema version and safe migration path.
4. One Core Hall; Gold Mine + Gold Storage; Energy Collector + Energy Storage; Cannon + Archer Tower + Mortar; Barracks; modular Walls. ~10 building families.
5. Resource loop with deterministic capped collection; spend to build/upgrade. Define costs and timers in separate balance tables, **not yet**.
6. First PvE mock raid against a fixed enemy base, with deploy/attack feedback; reuse available character art only when integration is safe.
7. Nine themed looks via a **theme selector**, initially placeholder styling, not a promise of 9x finished sprites.

## Non-goals for MVP
- Real-time PvP, online matchmaking, clans, trading, cloud persistence.
- Paid currencies, intrusive hours/days timers, multiplayer state synchronization.
- Nine independent player bases or all candidate buildings at launch.

## Candidate folder boundaries
- `src/fortress/types.ts`: serializable domain types and named identifiers (initial scaffold).
- `src/fortress/catalog.ts`: building footprints/costs/rules (future).
- `src/fortress/save.ts`: versioned local save/migration (future).
- `src/fortress/world.ts`: simulation/resource progression (future).
- `src/fortress/view.ts`: renderer/camera (future).
- `src/fortress/input.ts`: pointer controls (future).
- `assets/special/fortress/`: only when finalized asset files exist.
- `docs/fortress.md`: decisions, phase plan and open questions.

Keep Battle, Sprints and On Call untouched while scaffolding. Integrate into the game menu only after a working scene exists.

## Implementation checkpoints
1. Foundation: design and types.
2. Prototype: grid + camera, landscape and portrait reflow, selection, one placed Core Hall.
3. Construction: building catalog, preview, valid placement, modular walls, save/load.
4. Economy: production/storage, cost/balance, upgrading and rewards.
5. Combat: first single-player raid + defense loop, troop deployment, pathing around walls.
6. Content: themed art, world PvE bases, additional buildings and traps.
7. QA: mobile Safari portrait/landscape orientation changes, touch gestures, no save corruption, performance, UI overlap, responsive safe areas.

## Open choices (not decided)
- Final public name: **Fortress** is the working title.
- Map grid size/shape and isometric-versus-top-down camera.
- Final resource names, construction time policy, attack troop supply and combat balance.
- When to unlock PvE enemy fortresses and which buildings are available per Core Hall level.
- Whether any cosmetic world-specific defense variants have distinct gameplay stats.

## First test assets and levels (1.13.38)
- Source assets: `assets/special/fortress/backlog/` (ten separate transparent SVG placeholder files: Core Hall, gold/energy generators and storage, cannon, archer tower, mortar, barracks, wall).
- Browser assets: `/images/game/fortress/backlog/<building>.svg` via `build/asset-paths.mjs`.
- `src/fortress/levels.ts` defines three fixtures: one Core Hall; Core Hall plus two gold buildings; and Core Hall, cannon plus five straight wall sections.
- `../static/fortress-lab.html` publishes `/fortress-lab.html` to inspect/select buildings in both orientations without changing saved game data.
- Current SVGs are simple editable original placeholders, **not cropped final concept art**. Nine world-specific render-quality building families remain unimplemented.

## Isometric lab update (1.13.47)
- The independent `/fortress-lab.html` preview uses a diamond-isometric canvas with camera pan, mouse-wheel/pinch zoom, tap selection and responsive landscape/portrait layout.
- In level 3, contiguous walls are rendered with a connected geometry placeholder rather than isolated square items.
- These are visual/interaction prototypes, not a persistent building-placement system or final art.

## First raid prototype (1.13.48)
- Use `/fortress-lab.html` to choose one of three small enemy bases and tap **Atacar**.
- Select Guerrero, Lanzador or Tanque (temporary archetypes), deploy a maximum of eight units near any outside boundary tile; they move toward and damage structures automatically.
- Basic walls and a firing cannon are test mechanics, not final collision/pathfinding. Percentage and stars are based on buildings destroyed (>=50%, Core Hall, 100%).
- The visual troops are placeholders. Future work is to map actual owned BUG HUNTER bugs/sprites and their existing stats/behavior.
