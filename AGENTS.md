# AGENTS.md — MyPersonalWeb

Guide for any AI agent (Claude Code, Codex, Cursor, Gemini CLI…) working in this repo from scratch. Read it first, then the files it points to. This repo is **public**: never add private or job-search data here (that lives in a separate private repo).

## What this is
Álvaro Rodríguez Molina's portfolio, deployed at https://alvrich.vercel.app. React + TypeScript + SCSS, built with Vite and **prerendered** so pages read without JavaScript. Ten UI languages, light/dark themes, eight accent colours.

## Layout
- `src/components/` — header, mobile menu, pickers, icons.
- `src/sections/` — page sections (Hero, Experience, Education, Work, Skills, Contact, GitHub activity, Radar).
- `src/data/` — **content**: `experience.ts` (jobs and roles), `work.ts` (projects), `contact.ts`.
- `src/i18n/locales/*.json` — ten translation files. Any user-visible text must be added to **all ten** (`en` is the reference).
- `src/styles/partials/` — SCSS by section. `_mobile.scss` and `_responsive.scss` hold the phone layout (≤760px).
- `static/data/experience.json` — a second copy of the experience data used by the legacy calendar page (`src/legacy/calendar`). **Keep it in sync** with `src/data/experience.ts`.
- `static/cv/alvaro-molina-cv.pdf` — the CV served by the "Download CV" button. Generated from `scripts/cv/cv.html` (see below).
- `scripts/build/` — build pipeline (prerender, GitHub contributions, sitemaps).
- `scripts/cv/` — CV source (`cv.html` + `assets/`) and `build.mjs` to render the PDF.

## Commands
- `npm install`, then `npm run dev` (Vite dev server).
- `npm run typecheck` — TypeScript check. **Run before committing.**
- `npm run build` — full build with prerender. Also rewrites `static/data/github-contributions.json` from the GitHub API; if you did not mean to change it, `git checkout -- static/data/github-contributions.json` before committing.
- There is no test suite (`npm test` is a placeholder). Verify UI changes in a browser: serve with `npx vite preview --port 4179`, then take screenshots with Playwright. In this environment use the installed headless shell `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` as `executablePath`; do **not** run `playwright install`.

## Working rules
- **Mobile first check.** Anything visual must be checked at 360–390px wide as well as desktop.
- **Edit content in data files, not in components**, when the change is a fact (dates, titles, projects). Components only render.
- **Dates:** `YYYY-MM` strings. Keep them consistent with the CV (see the CV section below).
- **Git:** commit as the configured user; **no `Co-Authored-By` or AI attribution lines** unless the owner asks. Push to `main` only when asked. Pull (`--ff-only`) before you work; never force-push `main`.
- Keep commits small and in English conventional style (`feat(experience): …`, `fix(mobile): …`).

## The CV (`scripts/cv/`)
- The CV is an HTML template (`cv.html`) that reproduces the original Canva layout in Open Sans, A4, two pages. Edit text there, then `node scripts/cv/build.mjs` (needs Playwright; set `CHROMIUM_PATH` if the default browser is missing).
- Keep the CV and the website in agreement: same titles, same dates, same company names. The website's `src/data/experience.ts` is the reference for the public record; after changing it, update the CV too.
- Check the result visually: two pages, A4, no text overflowing a column, bottom margin roughly even on both pages.

## Things that caused bugs before
- Menus and pickers on phones must fit inside the screen (they were once offset to the right).
- Background decoration in the CV must not overlap text; the bottom decoration is mirrored on purpose.
- Adding a new `.xp-…` element without the matching SCSS leaves it unstyled; check the section after every change.
