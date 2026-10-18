# AGENTS.md — MyPersonalWeb

Guide for any AI agent (Claude Code, Codex, Cursor, Gemini CLI…) working in this repo from scratch. Read it first, then the files it points to. This repo is **public**: never add private or job-search data here (that lives in a separate private repo).

## What this is
Álvaro Rodríguez Molina's portfolio, deployed at https://alvrich.vercel.app. React + TypeScript + SCSS, built with Vite and **prerendered** so pages read without JavaScript. Eleven UI languages, light/dark themes, eight accent colours.

## Layout
- `src/components/` — header, mobile menu, pickers, icons.
- `src/sections/` — page sections (Hero, Experience, Education, Work, Skills, Contact, GitHub activity, Radar).
- `src/data/` — **content**: `experience.ts` (jobs and roles), `work.ts` (projects), `contact.ts`.
- `src/i18n/locales/*.json` — eleven translation files. Any user-visible text must be added to **all eleven** (`en` is the reference).
- `src/styles/partials/` — SCSS by section. `_mobile.scss` and `_responsive.scss` hold the phone layout (≤760px).
- `game.html` + `src/game/` — **Bug Hunter**, an Archero-style canvas game with Survivor.io-style weapons (move to dodge, stand still and ranged weapons fire; melee and magic work all the time; bugs drop XP gems; ten rooms, bosses in rooms 5 and 10; each level up offers one melee, one magic and one ranged or upgrade pick). Balance changes are best checked by simulating games in Node against `world.ts`. Rules in `world.ts` (no DOM, so it can be simulated in Node), drawing in `draw.ts`, screens and input in `main.ts`, text in `strings.ts` (English and Spanish only). It reads the site's saved `lang` and `accent`.
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

## Portrait easter egg
- A click on the hero portrait spins it like a coin and sets off the current accent's element: blue water ripples, green leaves blown left, red flames round the ring, orange fireworks (streaks that fall as dots), yellow lightning, white ghosts, pink hearts orbiting, and confetti under Disco. Quick repeat clicks build a combo (more pieces, further).
- Code: `src/sections/HeroAbout.tsx` (click, combo, piece lifetime), `src/components/portraitFx.ts` (which effect per accent, where each piece starts and goes) and `src/styles/partials/_portrait-fx.scss` (shapes and animations). Keep the durations in `portraitFx.ts` (`LIFE`) in step with the SCSS.
- It is hidden on purpose: default cursor, no button role. The hints are one line in `src/i18n/bubble.json` (desktop, after the CV line) and a single wiggle of the portrait on touch screens if nobody taps it within 4 s of loading the page or of changing the accent.
- Rules it must keep: nothing runs with `prefers-reduced-motion`; on phones (≤760px) no piece may leave the screen sideways (check `document.documentElement.scrollWidth` while it plays); every piece is removed after its burst.

## Things that caused bugs before
- Menus and pickers on phones must fit inside the screen (they were once offset to the right).
- Background decoration in the CV must not overlap text; the bottom decoration is mirrored on purpose.
- Adding a new `.xp-…` element without the matching SCSS leaves it unstyled; check the section after every change.
