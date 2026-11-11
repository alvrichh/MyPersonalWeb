# alvrich — portfolio

Personal site of Álvaro Rodríguez Molina: [alvrich.vercel.app](https://alvrich.vercel.app).

React 19, TypeScript and SCSS, built with Vite. The pages are prerendered at
build time, so they read fine without JavaScript, and React takes over in the
browser. Eleven languages, light and dark themes and eight accent colours.

## Rights and licensing

**Proprietary — All Rights Reserved.** The original code and content owned by
Álvaro Rodríguez Molina, including BUG HUNTER's original art, characters,
sprites, animations, maps, music and other original assets, are covered by
[the rights notice](./LICENSE). No permission to copy, redistribute, modify
or reuse that material is granted without prior written permission, subject
to the exceptions stated there.

Third-party dependencies and resources retain their own licenses and notices.
Earlier package metadata declared ISC; the rights notice preserves any valid
prior grants. GitHub's applicable platform permissions also remain in effect.
The development and asset instructions below do not grant reuse rights.

## BUG HUNTER

BUG HUNTER lives in its own top-level folder: **[bug-hunter/](./bug-hunter/)**.
That folder is the source of truth for the game: code, art, HTML, documentation,
tests and release notes all live together there.

**[Play](https://alvrich.vercel.app/game.html) · [Game README](./bug-hunter/README.md) · [Asset guide](./bug-hunter/docs/assets.md) · [Browse assets](./bug-hunter/assets/) · [Changelog](./bug-hunter/CHANGELOG.md) · [Game docs](./bug-hunter/docs/)**

The game still publishes at `/game.html`, and runtime images still use
`/images/game/...`. Those public URLs are intentionally independent from the
repository's organized `bug-hunter/assets/` tree.

## Run it

Use Node 24.x and run commands from this repository root:

```bash
npm ci
npm run dev               # portfolio and game development server
npm run dev:game          # opens /game.html
npm run typecheck
npm run test:game:layout  # source/build + asset projection checks
npm run test:game         # game-rule regression checks
npm run build             # site + game; verifies published game assets
npm run preview
```

## Repository layout

```text
bug-hunter/                 Game home
  README.md                 Main game guide
  CHANGELOG.md              Release history
  AGENTS.md                 Game development guardrails
  game.html                 Canonical game page template
  src/                      Gameplay, rendering, UI, audio, saves and version
  assets/
    worlds/                 World-specific enemies, bosses, floors and scenery
    shared/                 Heroes, UI, skills, effects, equipment and common art
    special/                Special-mode art
  docs/
    README.md               Documentation index
    assets.md               Canonical asset guide
    structure.md            Build, paths and compatibility
  build/                    Asset/public-URL projection and Vite integration
  scripts/, tests/          Game checks

src/                        Portfolio application code
static/                     Portfolio-only public files
scripts/build/              Shared client/SSR build and prerender pipeline
scripts/radar/              AI Radar automation
docs/ai-watch/              AI Radar reports
```

The root package, lockfile, Vite/TypeScript configuration and Vercel deployment
are shared. BUG HUNTER does not have a second package installation or a separate
deployment project.

## Adding text

Portfolio strings live in `src/i18n/locales/`. Add keys to `en.json` first
and keep the other languages aligned.

Game text is separate and currently maintained in English and Spanish in
[`bug-hunter/src/strings.ts`](./bug-hunter/src/strings.ts).

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
`game.html` are not committed.

For BUG HUNTER path rules and source/public URL compatibility, see
[the game structure guide](./bug-hunter/docs/structure.md).
