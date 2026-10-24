# Repository structure and compatibility

## Canonical locations after 1.13.1

| Previous location | New editable location |
|---|---|
| `src/game/` | `bug-hunter/src/` |
| `static/images/game/` | `bug-hunter/assets/` (grouped by world since 1.13.2) |
| Root `game.html` | `bug-hunter/game.html` |
| `scripts/game/check-regressions.mjs` | `bug-hunter/scripts/check-regressions.mjs` |
| `docs/game-changelog.md` | `bug-hunter/CHANGELOG.md` |
| Game introduction hidden in the asset README | `bug-hunter/README.md` |

The root README remains the portfolio entry and links here. The old changelog location contains only a navigation link, not an independently maintained history. The original detailed AGENTS.md was preserved as `legacy-repository-guide.md`; treat its old paths as historical and follow the current root/game AGENTS.md for locations.

## Asset organization since 1.13.2

`assets/worlds/01-backlog/` through `09-the-core/` group each world's enemies, bosses, floor and existing scenery. `assets/shared/` contains heroes, UI, effects, weapons, equipment, global backgrounds, map-selection art and documentation pictures. `assets/special/secret-shift/` contains the secret-shift bosses. The [asset guide](../assets/README.md) lists each world and its cast.

Original filenames and Git blob contents are retained: this is an organizational move, not an image conversion. Existing legacy copies are retained where they represent distinct public paths. Shared files are not duplicated into every world.

## What remains shared

`package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.mts`, Vercel settings and the site build pipeline belong to the whole repository. Site-only source stays in root `src/`; site public files stay in `static/`. Legal pages continue to be shared site pages. Procedural music remains implemented in `src/audio.ts`; asset folders are preserved without changing their use.

The game imports `../lib/storage` through the game-local adapter, which re-exports the existing `src/lib/storage.ts`. Internal game module imports stay unchanged. TypeScript includes the game paths explicitly.

## Why browser URLs do not move

A repository folder is not necessarily a public web route. The Vite configuration calls `build/integration.mjs` before the client build or dev server:

1. Copy the site's `static/` into `.cache/site-public-<command>/`. Project the game's assets through `build/asset-paths.mjs` into `images/game/`, stripping organization prefixes and restoring original scenery cast prefixes. For example, `assets/worlds/02-hotfix-inferno/bosses/overlord-0.webp` becomes `images/game/bosses/overlord-0.webp`.
2. Generate the root `game.html` from the canonical template. The original module-entry sentinel `/src/game/main.ts` is rewritten to `/bug-hunter/src/main.ts`; templates already using the new entry work too. All other HTML is preserved.
3. Build the same multipage inputs and preserve `/game.html`, `/images/game/...`, portfolio links and deployment output directories.

The entire asset projection is validated before replacing a cache. Duplicate public paths, case-only collisions, file/directory conflicts and symlinks are rejected. New assets must fit the same naming rules; adding a world requires an explicit resolver entry.

The SSR build does not regenerate or publish public files. Dev and build caches are separate. A dev watcher mirrors edits, additions and deletion of game/static assets through the same mapping. Removing one world's directory cannot remove another world's files from their shared public category. TypeScript continues to be handled by Vite normally. Source-folder page links in development redirect to `/game.html`.

`npm run build` additionally runs `scripts/check-public.mjs`, failing if `dist/` or `public/` lacks the compiled game page, the public asset set differs, or any asset differs from its canonical bytes. No root generated HTML, caches or output folders should be committed.

## Validation scope

`npm run test:game:layout` runs the original 12 preparation-layer tests and the 24 world-asset tests. These use temporary fixtures and a mocked development server; output-verifier tests use temporary generated pages, not a real Vite bundle. They check public paths, byte preservation, collisions, cache separation, live file changes and deletion isolation.

The 24 new tests passed locally on Node 22.16.0. The repository's Node 24.x requirement is unchanged. This does not certify a full Vite production build, full TypeScript check or gameplay. Run the root typecheck, build and gameplay regression command with installed dependencies, then smoke-test the portfolio and `/game.html`.

## Save compatibility

The public domain/path, storage implementation and gameplay/save modules are preserved. This reorganization does not intentionally migrate or reset player data. Do not change save keys, storage behavior or deploy to a new origin as part of a directory move.
