# alvrich — portfolio

Personal site of Álvaro Rodríguez Molina: [alvrich.vercel.app](https://alvrich.vercel.app).

React 19, TypeScript and SCSS, built with Vite. The pages are prerendered at
build time, so they read fine without JavaScript, and React takes over in the
browser. Eleven languages, light and dark themes and eight accent colours.

## BUG HUNTER

The browser game has its own clearly separated home: **[bug-hunter/](./bug-hunter/)**.
Open that folder for its README, action and Battle modes, code, sprites, development commands and release history.

**[Play](https://alvrich.vercel.app/game.html) · [Game guide](./bug-hunter/README.md) · [Game code](./bug-hunter/src/) · [Assets](./bug-hunter/assets/) · [Changelog](./bug-hunter/CHANGELOG.md)**

## Run it

Use Node 24.x and run commands from this repository root:

```bash
npm ci
npm run dev               # portfolio and game development server
npm run dev:game          # opens /game.html
npm run build             # site + game into dist/ and public/; verifies game assets
npm run preview
npm run typecheck
npm run test:game:layout   # source/build integration checks
npm run test:game          # game rules regression checks
```

## Layout

```text
bug-hunter/                 All game-specific source, art, HTML, docs and checks
  README.md                 Game entry point for readers
  CHANGELOG.md              Game releases
  game.html                 Editable game page template
  src/                      Rules, canvas/UI, sound, saves and game version
  assets/                   Sprites, effects, UI and worlds
  build/                    Integration with the shared Vite build
  scripts/, tests/, docs/    Game checks and documentation
index.html, ai-radar.html    React page shells
calendar.html, gym.html,     Other standalone tools
planning.html
src/                        Portfolio code, translations, styles and shared helpers
static/                     Site-only public files: images/, cv/, data/, legal pages
scripts/build/              Shared client/SSR build and prerender pipeline
scripts/radar/              Daily AI radar bot
docs/ai-watch/              Daily radar reports
```

The game still runs at `/game.html` and its images still use `/images/game/...`.
Vite generates an ignored root `game.html` and a disposable `.cache/` public
staging area from `bug-hunter/`. Edit the source folder, not generated files.
The root package, lockfile, Vite/TypeScript configuration and deployment remain
shared; the game does not require a second install or a new Vercel project.

## Adding text

Portfolio strings live in `src/i18n/locales/`. Add keys to `en.json` first;
keep the other languages aligned. Game text is separate, in
`bug-hunter/src/strings.ts` (English and Spanish).

## AI Radar

A GitHub Action (`.github/workflows/daily-ai-maintenance.yml`) runs every
morning. It reads official AI and developer-tooling sources
(`scripts/radar/radar-sources.mjs`), keeps the stories that match my work
(`scripts/radar/radar-tags.mjs`), and commits `static/data/ai-radar.json`, the
growing `static/data/ai-radar-archive.json` and a report in `docs/ai-watch/`.
It never touches the site's code.

## Deploy

Vercel builds every push with `npm run build` and publishes `public/`
(see `vercel.json`). `dist/`, `public/`, `.cache/` and the generated root
`game.html` are not committed. See the [game migration notes](./bug-hunter/docs/structure.md)
for source-path changes and preserved public URLs.
