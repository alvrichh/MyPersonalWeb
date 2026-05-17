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

- Main portfolio lives in `index.html`.
- `gym.html` and `planning.html` are extra pages/tools.
- Portfolio project cards are partly static and partly injected by JS.
- Dynamic cards include Planning OS, Fusion Flow BKD, AI capability cards, React/JS/Azure/Python/Docker cards.
- AI Radar is now a separate section directly below Portfolio, not inside the Portfolio grid and not in the nav.
- AI Radar reads from `assets/data/ai-radar.json`.
- Daily AI maintenance updates only safe data/docs paths:
  - `docs/ai-watch/**`
  - `assets/data/ai-radar.json`
- Daily streak heartbeat lives in `docs/ai-watch/streak.md`.

## Portfolio filters

Portfolio filters should stay consistent and working for static and dynamic cards:

- `all`
- `ui`
- `systems`
- `automation`
- `ai`
- `quality`

The filters must work on mobile and desktop. Dynamic cards injected after initial page load must still be categorized and filtered correctly.

## Review priorities

When reviewing changes, focus on:

1. Mobile layout regressions and broken buttons.
2. Portfolio filters and category consistency.
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
