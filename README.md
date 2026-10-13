# alvrich — portfolio

Personal site of Álvaro Rodríguez Molina: [alvrich.vercel.app](https://alvrich.vercel.app).

React 19, TypeScript and SCSS, built with Vite. The pages are prerendered at
build time, so they read fine without JavaScript, and React takes over in the
browser. Ten languages, light and dark themes and eight accent colours.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 with hot reload
npm run build      # production build into dist/ (and a copy in public/ for Vercel)
npm run preview    # serve that build
npm run typecheck
```

## Layout

```
index.html, ai-radar.html     React pages (the HTML shell; content comes from src/)
gym.html, planning.html,      older standalone tools
calendar.html
src/
  client.tsx, server.tsx      browser entry (hydrate) and build-time renderer
  pages.tsx                   page layouts
  sections/                   page sections (hero, work, experience, radar…)
  components/                 header, menus, pickers, icons
  data/                       experience, projects and skills
  i18n/locales/               one JSON per language; en.json is the reference
  lib/                        storage, preferences, dates, radar data
  styles/                     SCSS, one partial per area
  legacy/                     code for gym and calendar
static/                       copied as-is: images/, cv/, data/
scripts/
  build/                      Vite build + prerender
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
