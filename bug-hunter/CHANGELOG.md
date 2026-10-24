# Bug Hunter - Changelog

This changelog tracks game-version changes starting with v1.12.55. Earlier releases are not reconstructed here.

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
