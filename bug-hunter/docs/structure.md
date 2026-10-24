# BUG HUNTER repository structure and compatibility

[← Game README](../README.md) · [Documentation index](./README.md) · [Asset guide](./assets.md) · [Changelog](../CHANGELOG.md)

This document explains why BUG HUNTER is organized under `bug-hunter/` while keeping the browser routes and saved-game origin used before the reorganization.

## Canonical source locations

| Purpose | Canonical location |
|---|---|
| Game entry documentation | `bug-hunter/README.md` |
| Gameplay / renderer / UI code | `bug-hunter/src/` |
| Game assets | `bug-hunter/assets/` |
| Editable game HTML | `bug-hunter/game.html` |
| Release history | `bug-hunter/CHANGELOG.md` |
| Game-specific scripts | `bug-hunter/scripts/` |
| Game tests | `bug-hunter/tests/` |
| Build/public-URL integration | `bug-hunter/build/` |
| Supporting docs | `bug-hunter/docs/` |

Previous locations such as `src/game/` and `static/images/game/` are retired source locations.

## Historical path migration

| Previous location | Current source |
|---|---|
| `src/game/` | `bug-hunter/src/` |
| `static/images/game/` | `bug-hunter/assets/` |
| root editable `game.html` | `bug-hunter/game.html` |
| `scripts/game/check-regressions.mjs` | `bug-hunter/scripts/check-regressions.mjs` |
| `docs/game-changelog.md` | `bug-hunter/CHANGELOG.md` |
| old asset-folder game README | `bug-hunter/README.md` |

The old [`docs/game-changelog.md`](../../docs/game-changelog.md) remains only as a compatibility/navigation file for existing bookmarks.

## Current asset organization

The asset tree is documented separately in **[assets.md](./assets.md)**.

At a high level:

```text
assets/
├── worlds/     enemies, bosses, floors and world scenery
├── shared/     heroes, UI, skills, effects, equipment, map art, etc.
└── special/    art owned by special modes/sets
```

Do not put an additional main README in `assets/`; the game's visible entry point is `bug-hunter/README.md`.

## What remains shared with the portfolio

The following stay at repository root because the portfolio and game use the same toolchain/deployment:

- `package.json` and `package-lock.json`;
- `tsconfig.json`;
- `vite.config.mts`;
- Vercel configuration;
- root build/prerender scripts;
- the shared storage implementation.

[`bug-hunter/lib/storage.ts`](../lib/storage.ts) is a deliberate adapter to the existing shared storage module. Directory organization must not silently change save keys or storage origin.

## Public URLs stay stable

Repository paths are not public routes.

The game still publishes at:

- `/game.html`
- `/images/game/...`

Examples:

| Source | Published URL |
|---|---|
| `assets/worlds/02-hotfix-inferno/bosses/overlord-0.webp` | `/images/game/bosses/overlord-0.webp` |
| `assets/worlds/05-legacy-jungle/scenery/stone-0.webp` | `/images/game/jungle/stone-0.webp` |
| `assets/shared/ui/logo.webp` | `/images/game/ui/logo.webp` |
| `assets/special/secret-shift/bosses/kratos-0.webp` | `/images/game/bosses/kratos-0.webp` |

See [the asset guide](./assets.md) for the full mapping model.

## Build flow

The root Vite configuration uses the game-local build helpers before dev/build output is served.

### 1. Asset projection

[`build/asset-paths.mjs`](../build/asset-paths.mjs) walks `bug-hunter/assets/` and converts organized repository paths into stable public suffixes.

It:

- strips `shared/`;
- strips `worlds/<world>/`;
- maps world scenery back to its public cast prefix (for example Jungle → `jungle/`);
- strips `special/secret-shift/`;
- rejects unknown worlds/special groups;
- rejects duplicate public paths and case-only collisions;
- rejects file/directory conflicts;
- rejects symlinks.

### 2. Disposable public staging

[`build/integration.mjs`](../build/integration.mjs) creates a command-specific `.cache/site-public-<command>/` staging directory, copies portfolio `static/`, then projects game assets into `images/game/`.

The cache is disposable; it is not an editable source.

### 3. Game HTML generation

The canonical template is [`bug-hunter/game.html`](../game.html).

The integration generates root `game.html` with the module entry pointing at `/bug-hunter/src/main.ts`. The browser route remains `/game.html`.

### 4. Vite output

The normal shared build emits the portfolio and game. The deployment continues to use the existing root project and Vercel configuration.

## Development watcher

During development, the game integration watches:

- `bug-hunter/game.html`;
- `bug-hunter/assets/`;
- portfolio `static/`.

Asset additions, edits and deletions are re-projected through the same mapping used by the build. Removing a file from one world does not delete unrelated assets from another world even when their public files share categories such as `bosses/` or `enemies/`.

## Validation

Run from repository root:

```bash
npm run test:game:layout
npm run typecheck
npm run test:game
npm run build
```

The checks cover different scopes:

- `test:game:layout` — structure/projection/layout fixture checks;
- `typecheck` — TypeScript consistency;
- `test:game` — game-rule regressions;
- `build` — production build plus public-asset verification.

A fixture check is not the same as an in-game visual test. Report the checks that actually ran.

## Generated / non-authoritative locations

Do not edit or commit generated output as a source of truth:

- root generated `game.html`;
- `.cache/`;
- `dist/`;
- `public/`.

Do not recreate the retired `static/images/game/` source tree.

## Save compatibility

The directory reorganization intentionally preserves the public origin/path and the existing storage implementation. It does not intentionally migrate or reset player progress.

Changes to save keys, storage format or deployment origin are separate product changes and should not be bundled into folder/documentation maintenance.

## Historical notes

[`legacy-repository-guide.md`](./legacy-repository-guide.md) is retained for design/history context. It contains pre-migration paths, so current files and this structure guide take precedence.
