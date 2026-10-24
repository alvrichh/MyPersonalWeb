# Bug Hunter development

Read the repository's root AGENTS.md, this folder's README.md and CHANGELOG.md. This folder is the canonical home of the game; use its source paths, not the pre-1.13.1 locations in historical comments or notes.

## Boundaries

- `src/`: gameplay, rendering, UI, sound, save data and version metadata.
- `assets/`: all existing game art; public URLs are still `/images/game/...`.
- `game.html`: editable HTML template. The root `/game.html` file is generated during development/build and ignored by Git.
- `build/`: integration with the shared root Vite configuration.
- `lib/storage.ts`: intentional boundary to the portfolio's shared storage implementation. Do not duplicate it or change save keys as part of directory work.
- `scripts/` and `tests/`: game checks. Run npm commands from the repository root.

Preserve layout, collision coordinates, wall animations, sprites, frame order, gameplay and balance unless the task explicitly asks to change them. When changing features or fixing bugs, update `src/version.ts` and `CHANGELOG.md` together; do not renumber past releases.

Run `npm run test:game:layout`, `npm run typecheck`, `npm run test:game` and `npm run build` as applicable. The build checks every published game asset against its canonical bytes. Report which checks actually ran; do not call a fixture test a complete build or visual validation.

The full earlier repository guide was preserved byte-for-byte in `docs/legacy-repository-guide.md`. It contains useful design history but old paths: translate `src/game/` to `bug-hunter/src/`, `static/images/game/` to `bug-hunter/assets/`, and `scripts/game/` to `bug-hunter/scripts/`. Shared portfolio configuration and dependencies still live at the repository root.
