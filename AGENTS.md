# AGENTS.md — MyPersonalWeb

This repository contains the portfolio and BUG HUNTER, sharing one root Node/Vite toolchain. It is public: never add private or job-search information.

## Current source locations

- Portfolio: `src/`, `static/`, root site HTML pages, `scripts/build/` and `scripts/radar/`.
- Game: **[`bug-hunter/`](./bug-hunter/)**.
- Game guide: [`bug-hunter/README.md`](./bug-hunter/README.md).
- Game asset guide: [`bug-hunter/docs/assets.md`](./bug-hunter/docs/assets.md).
- Game structure/build guide: [`bug-hunter/docs/structure.md`](./bug-hunter/docs/structure.md).
- Game release history: [`bug-hunter/CHANGELOG.md`](./bug-hunter/CHANGELOG.md).
- Shared configuration: root `package.json`, lockfile, TypeScript/Vite configuration and `vercel.json`.

Game source is `bug-hunter/src/`; art is `bug-hunter/assets/`; the editable HTML template is `bug-hunter/game.html`; game-specific checks live in `bug-hunter/scripts/` and `bug-hunter/tests/`.

Public routes remain `/game.html` and `/images/game/...`. Root `game.html`, `.cache/`, `dist/` and `public/` are generated/non-authoritative. Do not recreate retired source directories.

## Preserved detailed notes

The previous detailed repository/design guide is retained at [`bug-hunter/docs/legacy-repository-guide.md`](./bug-hunter/docs/legacy-repository-guide.md). Its pre-migration paths are historical; translate them with [the current structure guide](./bug-hunter/docs/structure.md).

## Working rules

Keep tasks scoped. A directory or documentation change must not silently alter gameplay, layout, animations, save keys, art quality, portfolio behavior or deployment URLs.

Portfolio UI strings belong in all eleven `src/i18n/locales/` files. Game strings belong in `bug-hunter/src/strings.ts`.

Use the root Node 24.x requirement and commands. Run applicable typecheck/game/build checks and report them accurately. Never describe fixture checks as visual gameplay validation.

For game behavior/features/fixes, update the game version and changelog together. Pure documentation cleanup does not require a runtime version bump. Preserve historical version entries.

Do not edit generated `dist/`, `public/`, `.cache/` or root `game.html`.
