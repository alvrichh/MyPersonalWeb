# alvrich — portfolio

Personal site of Álvaro Rodríguez Molina: [alvrich.vercel.app](https://alvrich.vercel.app).

Angular 22 (standalone components and signals, no zone.js), TypeScript and
SCSS. The pages are prerendered at build time, so they read fine without
JavaScript, and Angular hydrates them in the browser. Ten languages, light and
dark themes and eight accent colours.

## Run it

Angular 22 needs Node 22.22+ or 24 (Vercel uses 24).

```bash
npm install
npm run dev        # ng serve: http://localhost:4200 with hot reload
npm run build      # production build into dist/ (and a copy in public/ for Vercel)
npm run preview    # serve that build
npm run typecheck  # TypeScript and template checks
```

## Layout

```
angular.json                  build config (prerenders "/" and "/ai-radar")
src/
  index.html                  the HTML shell
  main.ts, main.server.ts     browser entry and build-time renderer
  app.ts                      routes and app config
  pages/                      home and AI radar pages, shared layout
  sections/                   page sections (hero, work, experience, radar…)
  components/                 header, mobile menu, pickers, icons
  data/                       experience, projects and skills
  i18n/                       I18n service; locales/ has one JSON per language
  lib/                        storage, preferences, dates, radar data
  styles/                     SCSS, one partial per area
static/                       copied as-is: images/, cv/, data/, and the older
                              standalone tools (gym, planning, calendar + legacy/)
scripts/
  build/                      ng build, plus ai-radar.html for the old URL
  radar/                      daily AI radar bot (one-off/ holds backfill scripts)
docs/ai-watch/                daily radar reports written by the bot
```

## Adding text

Every visible string lives in `src/i18n/locales/`. Add the key to `en.json`
first; the other languages fall back to English until they get their own
translation.

## AI Radar

A GitHub Action (`.github/workflows/daily-ai-maintenance.yml`) runs every
morning. It reads official AI and developer-tooling sources
(`scripts/radar/radar-sources.mjs`), keeps the stories that match my work
(`scripts/radar/radar-tags.mjs`), and commits `static/data/ai-radar.json`, the
growing `static/data/ai-radar-archive.json` and a report in `docs/ai-watch/`.
It never touches the site's code.

## Deploy

Vercel builds every push with `npm run build` and publishes `public/`
(see `vercel.json`). `dist/` is not committed.
