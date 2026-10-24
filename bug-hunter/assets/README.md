# Bug Hunter assets

The game guide is [one level up](../README.md). This folder is the single source of the game's art.

## Public URLs are not repository paths

`bug-hunter/assets/<path>` is published as `/images/game/<path>` by [the build integration](../build/integration.mjs). Existing URLs in the renderer, CSS, HTML and portfolio are intentionally preserved. Do not change those URLs to `/bug-hunter/assets/` or recreate `static/images/game/`.

## Organization

- `hero/`, `enemies/`, `bosses/`: character sprites, with one file per animation frame.
- `skills/`, `items/`, `store/`, `slots/`: abilities, equipment and shop illustrations.
- `fx/`, `arrows/`, `blades/`, `spirits/`: effects, weapons and companions.
- `ui/`: panels, buttons, HUD and logos.
- `map/`, `floors/` and world-themed folders: islands, floors, walls and scenery.
- `readme/`: documentation images.

## Editing safely

Keep filenames, frame order, transparency, anchor points and per-character canvas sizes consistent with the renderer. Do not batch-resize or recompress sprites during a folder migration. Numeric frame names do not by themselves identify an animation; check the selection code in `../src/draw.ts`.

Run development from the repository root with `npm run dev`; asset additions, changes and deletions are mirrored into the disposable public cache. Never edit `.cache/`, `dist/` or the root `public/` output.
