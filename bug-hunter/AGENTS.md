# Bug Hunter development

Read [README.md](./README.md), [docs/assets.md](./docs/assets.md), [docs/structure.md](./docs/structure.md) and [CHANGELOG.md](./CHANGELOG.md) before structural or asset work.

This folder is the canonical home of BUG HUNTER. Current source paths take precedence over old paths preserved in historical notes.

## Boundaries

- `src/`: gameplay, rendering, UI, sound, save data and version metadata.
- `assets/worlds/`: numbered worlds, each owning its enemies, bosses, floor and existing dedicated scenery.
- `assets/shared/`: heroes, UI, skills, effects, weapons, equipment, map art and other cross-world resources.
- `assets/special/`: assets owned by special modes/sets.
- `docs/assets.md`: canonical asset-location and public-URL guide.
- `game.html`: editable HTML template. Root `/game.html` is generated during dev/build.
- `build/`: projection of organized source assets into stable `/images/game/...` public URLs.
- `lib/storage.ts`: adapter to the shared portfolio storage implementation.
- `scripts/` and `tests/`: game-specific checks.

## Asset rules

Public asset URLs remain `/images/game/...`. Do not rewrite renderer/CSS/HTML URLs to repository-only `/worlds/`, `/shared/` or `/special/` paths.

Do not recreate the retired `static/images/game/` source tree or duplicate assets merely to preserve old URLs; the build projection exists for that purpose.

When changing sprites, preserve filename, canvas size, transparency, frame order and anchor behavior unless the task explicitly requires changing them. See [docs/assets.md](./docs/assets.md).

## Change discipline

Preserve layout, collision coordinates, wall animations, sprites, frame order, gameplay and balance unless the task explicitly asks to change them.

When changing game behavior/features/fixes, update `src/version.ts` and `CHANGELOG.md` together. Do not renumber historical releases. Pure documentation cleanup does not require a runtime game-version bump.

## Checks

Run applicable commands from the repository root:

```bash
npm run test:game:layout
npm run typecheck
npm run test:game
npm run build
```

State which checks actually ran. Do not describe fixture tests as a full production build or visual gameplay validation.

## Historical guide

The previous detailed repository guide is preserved in [docs/legacy-repository-guide.md](./docs/legacy-repository-guide.md). It contains useful history but old source paths. Translate old paths using [docs/structure.md](./docs/structure.md); current source locations always win.
