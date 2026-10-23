# Bug Hunter - Changelog

This changelog tracks game-version changes starting with v1.12.55. Earlier releases are not reconstructed here.

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
