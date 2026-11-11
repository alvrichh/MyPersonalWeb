<p align="center">
  <img src="./assets/shared/readme/logo.png" alt="Bug Hunter" width="420">
</p>

# BUG HUNTER

Action roguelite + tactical auto-battler by **Álvaro Rodríguez Molina**, playable in the browser on mobile and desktop.

<p align="center">
  <strong><a href="https://alvrich.vercel.app/game.html">Play BUG HUNTER</a></strong>
</p>

**[Release history](./CHANGELOG.md) · [Asset guide](./docs/assets.md) · [Browse assets](./assets/) · [Source code](./src/) · [Documentation](./docs/) · [Repository structure](./docs/structure.md)**

`bug-hunter/` is the canonical home of the game inside MyPersonalWeb. Edit the game here; do not edit generated root `game.html`, `.cache/`, `dist/` or `public/` output.

<p align="center">
  <img src="./assets/shared/readme/screenshot-menu.webp" alt="Bug Hunter main menu" width="720">
</p>

## Rights and licensing

**Proprietary — All Rights Reserved.** BUG HUNTER's original code and assets
owned by Álvaro Rodríguez Molina are covered by the repository's
[rights notice](../LICENSE), including original art, characters, sprites,
animations, maps, music and sound effects. No permission to copy, redistribute,
modify or reuse them is granted without prior written permission, subject to
the notice's exceptions for applicable law, third-party terms, valid prior
grants and GitHub's platform permissions. Third-party material retains its
own licenses. Development instructions and links to assets grant no reuse rights.

## Game modes

| Mode | Core loop |
|---|---|
| **Sprints** | Clear rooms, collect XP, choose roguelite upgrades and defeat each world's bosses. |
| **On Call** | Survive an open-field run while enemies arrive from every direction and bosses interrupt the run. |
| **Battle — Tactics** | Buy cards, deploy an army and reserve bench, upgrade identical units by stars, then watch automatic combat. |
| **Battle — Fusion** | Summon units, merge matching characters into higher tiers, position the army, then resolve automatic combat. |

**Siege / Asedio — Coming soon · Playable preview:** available inside the fourth main-menu option, Coming Soon, alongside the separate Fortress prototype. Choose five troops, manage energy, defend your fortress and conquer nine themed enemy bases. Separate progress, upgrades and rewards. [Mode guide](./docs/siege.md).

**Fortress (planned, not playable yet):** landscape-first base-building and PvE raids, with a portrait management layout, nine world themes and modular walls. [Design foundation](./docs/fortress.md) · [Data types](./src/fortress/types.ts).

Boss Rush, Nightmare and the boss showcase are additional game options where available. English and Spanish game copy lives in [`src/strings.ts`](./src/strings.ts).

## Controls

**Action modes:** drag on touch, or use WASD / arrow keys. In Sprints, ranged weapons fire while stationary; melee and magic continue while moving. On Call also permits ranged attacks while moving at a reduced rate.

**Battle modes:** use the preparation phase to buy or summon, deploy, reposition and upgrade units. Press **Fight** when the formation is ready; combat then resolves automatically.

## Worlds

Each world owns its gameplay cast and canonical art. Use these links when replacing or adding world-specific assets.

| # | World | Enemies | Bosses | Floor | Scenery |
|---:|---|---|---|---|---|
| 1 | **The Backlog** | [enemies](./assets/worlds/01-backlog/enemies/) | [bosses](./assets/worlds/01-backlog/bosses/) | [floors](./assets/worlds/01-backlog/floors/) | [scenery](./assets/worlds/01-backlog/scenery/) |
| 2 | **Hotfix Inferno** | [enemies](./assets/worlds/02-hotfix-inferno/enemies/) | [bosses](./assets/worlds/02-hotfix-inferno/bosses/) | [floors](./assets/worlds/02-hotfix-inferno/floors/) | [scenery](./assets/worlds/02-hotfix-inferno/scenery/) |
| 3 | **Code Freeze** | [enemies](./assets/worlds/03-code-freeze/enemies/) | [bosses](./assets/worlds/03-code-freeze/bosses/) | [floors](./assets/worlds/03-code-freeze/floors/) | [scenery](./assets/worlds/03-code-freeze/scenery/) |
| 4 | **Big Ball of Mud** | [enemies](./assets/worlds/04-big-ball-of-mud/enemies/) | [bosses](./assets/worlds/04-big-ball-of-mud/bosses/) | [floors](./assets/worlds/04-big-ball-of-mud/floors/) | — |
| 5 | **Legacy Jungle** | [enemies](./assets/worlds/05-legacy-jungle/enemies/) | [bosses](./assets/worlds/05-legacy-jungle/bosses/) | [floors](./assets/worlds/05-legacy-jungle/floors/) | [scenery](./assets/worlds/05-legacy-jungle/scenery/) |
| 6 | **The Arena** | [enemies](./assets/worlds/06-the-arena/enemies/) | [bosses](./assets/worlds/06-the-arena/bosses/) | [floors](./assets/worlds/06-the-arena/floors/) | [scenery](./assets/worlds/06-the-arena/scenery/) |
| 7 | **The Forge** | [enemies](./assets/worlds/07-the-forge/enemies/) | [bosses](./assets/worlds/07-the-forge/bosses/) | [floors](./assets/worlds/07-the-forge/floors/) | [scenery](./assets/worlds/07-the-forge/scenery/) |
| 8 | **Haunted Servers** | [enemies](./assets/worlds/08-haunted-servers/enemies/) | [bosses](./assets/worlds/08-haunted-servers/bosses/) | [floors](./assets/worlds/08-haunted-servers/floors/) | [scenery](./assets/worlds/08-haunted-servers/scenery/) |
| 9 | **The Core** | [enemies](./assets/worlds/09-the-core/enemies/) | [bosses](./assets/worlds/09-the-core/bosses/) | [floors](./assets/worlds/09-the-core/floors/) | [scenery](./assets/worlds/09-the-core/scenery/) |

For heroes, abilities, UI, effects, equipment, map art and other shared resources, use the **[asset guide](./docs/assets.md)**.

## Project map

```text
bug-hunter/
├── README.md                 Start here
├── CHANGELOG.md              Version history
├── AGENTS.md                 Development guardrails
├── game.html                 Editable page template
├── src/
│   ├── main.ts               Page/UI/input/frame loop
│   ├── world.ts              Sprints / On Call rules
│   ├── board.ts              Fusion / Tactics rules
│   ├── boardBoss.ts          Battle boss planning
│   ├── draw.ts               Action + shared canvas rendering
│   ├── boardView*.ts         Battle renderer and mobile viewport
│   ├── game.css              Game UI/layout styling
│   ├── audio.ts              Procedural music and sound
│   ├── save.ts               Persistent progress
│   ├── strings.ts            English / Spanish game copy
│   └── version.ts            Runtime game version
├── assets/
│   ├── worlds/               Nine world folders
│   ├── shared/               Cross-world/common art
│   └── special/              Special-mode art
├── docs/
│   ├── README.md             Documentation index
│   ├── assets.md             Asset locations and URL mapping
│   ├── structure.md          Build and compatibility rules
│   └── legacy-repository-guide.md
├── build/                    Vite/public asset integration
├── lib/storage.ts            Adapter to shared portfolio storage
├── scripts/                  Regression/public-output checks
└── tests/                    Layout/integration tests
```

## Assets: source path vs public URL

Repository organization is intentionally different from browser URLs.

| Canonical source | Runtime/public URL |
|---|---|
| `assets/worlds/02-hotfix-inferno/bosses/overlord-0.webp` | `/images/game/bosses/overlord-0.webp` |
| `assets/worlds/05-legacy-jungle/scenery/stone-0.webp` | `/images/game/jungle/stone-0.webp` |
| `assets/shared/skills/fire.webp` | `/images/game/skills/fire.webp` |
| `assets/shared/ui/logo.webp` | `/images/game/ui/logo.webp` |
| `assets/special/secret-shift/bosses/kratos-0.webp` | `/images/game/bosses/kratos-0.webp` |
| `game.html` | `/game.html` |

The projection is implemented by [`build/asset-paths.mjs`](./build/asset-paths.mjs) and [`build/integration.mjs`](./build/integration.mjs). Runtime code should continue to reference `/images/game/...`; do **not** rewrite browser paths to `/worlds/`, `/shared/` or `/special/`.

See **[Asset guide](./docs/assets.md)** for the full folder map and safe-editing rules.

## Development

Run commands from the **repository root** using Node 24.x:

```bash
npm ci
npm run dev:game
npm run typecheck
npm run test:game:layout
npm run test:game
npm run build
npm run preview
```

Useful source-of-truth rules:

- Edit `bug-hunter/game.html`, not generated root `game.html`.
- Edit `bug-hunter/assets/`, not the retired `static/images/game/`.
- Keep sprite filenames, dimensions, transparency, frame order and anchor behavior stable unless the change explicitly requires otherwise.
- Update [`src/version.ts`](./src/version.ts) and [`CHANGELOG.md`](./CHANGELOG.md) together for game releases.
- Do not claim a fixture test is a visual gameplay test or a full production build.

## Documentation

- **[Asset guide](./docs/assets.md)** — where every class of game art belongs and how source paths map to public URLs.
- **[Structure & compatibility](./docs/structure.md)** — how the dedicated game folder integrates with Vite and preserves existing URLs/saves.
- **[Release history](./CHANGELOG.md)** — current and historical game versions.
- **[Development guardrails](./AGENTS.md)** — rules for code/asset changes.
- **[Legacy repository guide](./docs/legacy-repository-guide.md)** — preserved historical notes; old paths inside it are not authoritative.

<p align="center">
  <img src="./assets/shared/readme/screenshot-gameplay.webp" alt="Bug Hunter action gameplay" width="720">
</p>

