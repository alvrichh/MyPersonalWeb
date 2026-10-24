# AGENTS.md — MyPersonalWeb

This repository contains the portfolio and Bug Hunter, sharing one root Node/Vite toolchain. It is public: never add private or job-search information.

## Current source locations

- Portfolio: `src/`, `static/`, the root site HTML pages, `scripts/build/` and `scripts/radar/`.
- Game: **`bug-hunter/`**. Read `bug-hunter/README.md`, `bug-hunter/AGENTS.md` and `bug-hunter/CHANGELOG.md` before editing it.
- Shared configuration: root `package.json`, lockfile, TypeScript/Vite configuration and `vercel.json`.
- Game source: `bug-hunter/src/`; art: `bug-hunter/assets/`; HTML template: `bug-hunter/game.html`; game-specific checks: `bug-hunter/scripts/` and `bug-hunter/tests/`.
- Public routes stay `/game.html` and `/images/game/...`. The root `game.html` and `.cache/` are generated and ignored. Do not recreate the retired source directories.

## Preserved detailed notes

The full previous guide, including portfolio conventions and extensive game design history, is retained byte-for-byte at [bug-hunter/docs/legacy-repository-guide.md](./bug-hunter/docs/legacy-repository-guide.md). Read the relevant sections for the area being changed. Its old paths must be translated using [the migration map](./bug-hunter/docs/structure.md); current paths above take precedence. This move does not discard those behavioral requirements.

## Working rules

Keep tasks scoped. A directory move must not silently alter gameplay, game layout, animations, save keys, art quality, portfolio content or deployment URLs. Portfolio UI strings belong in all eleven `src/i18n/locales/` files; game strings belong in the game's own English/Spanish dictionary. Do not publish secrets or private records.

Use the root Node 24.x requirement and commands. Run the applicable typecheck, game tests and production build, and state accurately which checks ran. Never describe fixture checks as visual gameplay validation. Update the game version and its changelog together for game releases; preserve historical version entries. Do not edit generated `dist/`, `public/`, `.cache/` or the root `game.html`.
