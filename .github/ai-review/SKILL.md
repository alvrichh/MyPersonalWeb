# MyPersonalWeb AI Review Guide

Use this file as persistent project memory for automated AI reviews in this repository. Treat it as the review brief before commenting on commits or pull requests.

## Project identity

- Repository: `alvrichh/MyPersonalWeb`
- Live site: `https://alvrich.vercel.app`
- Purpose: personal portfolio / vCard for Alvaro Molina.
- Professional positioning: Full Stack Developer focused on integration, automation, Azure solutions, front-end polish, APIs, auth, Docker/Render/Vercel deployment, Microsoft Graph-style data flows, and AI-assisted workflows.

## Design direction

Keep the UI premium, modern and memorable:

- High-end SaaS / Apple / Linear / Stripe / Vercel feeling.
- Clean hierarchy, elegant spacing, strong readability.
- Glassmorphism, soft gradients, subtle glow, realistic depth.
- Purple/violet energy with soft green accents where appropriate.
- Polished mobile experience is critical.
- Avoid generic template energy.

## Current architecture and features

- Angular 22 (standalone components, signals, zoneless) + TypeScript + SCSS (`angular.json`).
- The home page and the AI radar page are prerendered at build time (`src/main.server.ts`) and hydrated in the browser. `/ai-radar.html` is kept as a copy of `/ai-radar` for old links.
- `src/pages/` holds the pages and layout, `src/sections/` the page sections, `src/components/` shared UI, `src/data/` experience and projects, `src/i18n/` the I18n service and one JSON per language (10 languages), `src/styles/partials/` the SCSS.
- `gym.html`, `planning.html` and `calendar.html` are older standalone tools in `static/`, with their code in `static/legacy/`.
- Static files (images, CV, radar data) live in `static/` and keep their URLs (`./images`, `./cv`, `./data`).
- The AI Radar reads `static/data/ai-radar.json` (latest) and `static/data/ai-radar-archive.json` (everything collected).
- Daily AI maintenance (`scripts/radar/`) updates only safe data/docs paths:
  - `docs/ai-watch/**`
  - `static/data/ai-radar.json`
  - `static/data/ai-radar-archive.json`
- Daily streak heartbeat lives in `docs/ai-watch/streak.md`.
- `dist/` is not committed; Vercel runs `npm run build` on each deploy.

## AI Radar filters

The radar page filters by tag (counted over the whole archive) and has a search box that covers every story. Both must work on mobile and desktop.

## Review priorities

When reviewing changes, focus on:

1. Mobile layout regressions and broken buttons.
2. Hydration: prerendered HTML must match the first client render (no browser-only values in the first render).
3. AI Radar separation, filters, show more/show less, and source links.
4. Accessibility: focus states, keyboard controls, semantic buttons/links, aria states.
5. Performance and maintainability: avoid duplicate logic, fragile selectors, unnecessary DOM rewrites.
6. Internationalization: do not break existing language switching or translated dynamic copy.
7. Safety: automated workflows must not edit live layout files unless intentionally changed by a human.

## Content rules

- Do not invent certifications, job experience, or claims.
- AI/IA cards should present capability/knowledge unless manually confirmed as real project experience.
- Fusion Flow BKD should stay framed as a private enterprise case, without exposing confidential details.
- AI Radar is market intelligence/research, not personal achievement.

## Output style for automated reviews

Write in Spanish. Be direct, critical and constructive. Do not say everything is fine by default.

Return at most 5 bullets:

- Start with the highest-risk issue first.
- Mention exact files/functions/selectors when possible.
- Separate real problems from optional improvements.
- If there is no useful issue, say that the change looks safe and mention what was checked.
- Do not create generic advice.
