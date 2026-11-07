# BUG HUNTER asset guide

[← Game README](../README.md) · [Documentation index](./README.md) · [Browse all assets](../assets/) · [Structure guide](./structure.md)

This is the canonical guide for locating and editing BUG HUNTER art. The asset files live under [`bug-hunter/assets/`](../assets/); there is intentionally **no README inside the asset folder** so the game's main README remains visible at `bug-hunter/README.md`.

## Asset tree

```text
assets/
├── worlds/
│   ├── 01-backlog/
│   ├── 02-hotfix-inferno/
│   ├── 03-code-freeze/
│   ├── 04-big-ball-of-mud/
│   ├── 05-legacy-jungle/
│   ├── 06-the-arena/
│   ├── 07-the-forge/
│   ├── 08-haunted-servers/
│   └── 09-the-core/
├── shared/
└── special/
    ├── secret-shift/
    └── siege/
```

## World-specific assets

Each world contains its own enemies, bosses and floor. Scenery is stored with the world when a dedicated scenery set exists.

| World | Folder | Enemies | Bosses | Floor | Scenery |
|---|---|---|---|---|---|
| The Backlog | [`01-backlog/`](../assets/worlds/01-backlog/) | [open](../assets/worlds/01-backlog/enemies/) | [open](../assets/worlds/01-backlog/bosses/) | [open](../assets/worlds/01-backlog/floors/) | [open](../assets/worlds/01-backlog/scenery/) |
| Hotfix Inferno | [`02-hotfix-inferno/`](../assets/worlds/02-hotfix-inferno/) | [open](../assets/worlds/02-hotfix-inferno/enemies/) | [open](../assets/worlds/02-hotfix-inferno/bosses/) | [open](../assets/worlds/02-hotfix-inferno/floors/) | [open](../assets/worlds/02-hotfix-inferno/scenery/) |
| Code Freeze | [`03-code-freeze/`](../assets/worlds/03-code-freeze/) | [open](../assets/worlds/03-code-freeze/enemies/) | [open](../assets/worlds/03-code-freeze/bosses/) | [open](../assets/worlds/03-code-freeze/floors/) | [open](../assets/worlds/03-code-freeze/scenery/) |
| Big Ball of Mud | [`04-big-ball-of-mud/`](../assets/worlds/04-big-ball-of-mud/) | [open](../assets/worlds/04-big-ball-of-mud/enemies/) | [open](../assets/worlds/04-big-ball-of-mud/bosses/) | [open](../assets/worlds/04-big-ball-of-mud/floors/) | no dedicated scenery folder |
| Legacy Jungle | [`05-legacy-jungle/`](../assets/worlds/05-legacy-jungle/) | [open](../assets/worlds/05-legacy-jungle/enemies/) | [open](../assets/worlds/05-legacy-jungle/bosses/) | [open](../assets/worlds/05-legacy-jungle/floors/) | [open](../assets/worlds/05-legacy-jungle/scenery/) |
| The Arena | [`06-the-arena/`](../assets/worlds/06-the-arena/) | [open](../assets/worlds/06-the-arena/enemies/) | [open](../assets/worlds/06-the-arena/bosses/) | [open](../assets/worlds/06-the-arena/floors/) | [open](../assets/worlds/06-the-arena/scenery/) |
| The Forge | [`07-the-forge/`](../assets/worlds/07-the-forge/) | [open](../assets/worlds/07-the-forge/enemies/) | [open](../assets/worlds/07-the-forge/bosses/) | [open](../assets/worlds/07-the-forge/floors/) | [open](../assets/worlds/07-the-forge/scenery/) |
| Haunted Servers | [`08-haunted-servers/`](../assets/worlds/08-haunted-servers/) | [open](../assets/worlds/08-haunted-servers/enemies/) | [open](../assets/worlds/08-haunted-servers/bosses/) | [open](../assets/worlds/08-haunted-servers/floors/) | [open](../assets/worlds/08-haunted-servers/scenery/) |
| The Core | [`09-the-core/`](../assets/worlds/09-the-core/) | [open](../assets/worlds/09-the-core/enemies/) | [open](../assets/worlds/09-the-core/bosses/) | [open](../assets/worlds/09-the-core/floors/) | [open](../assets/worlds/09-the-core/scenery/) |

### Scenery public prefixes

The repository groups scenery by world, but the browser keeps the older cast prefixes:

| World folder | Public scenery prefix |
|---|---|
| `01-backlog/scenery/` | `/images/game/original/` |
| `02-hotfix-inferno/scenery/` | `/images/game/demon/` |
| `03-code-freeze/scenery/` | `/images/game/viking/` |
| `04-big-ball-of-mud/` | `/images/game/mud/` for world files; no dedicated scenery directory currently |
| `05-legacy-jungle/scenery/` | `/images/game/jungle/` |
| `06-the-arena/scenery/` | `/images/game/greek/` |
| `07-the-forge/scenery/` | `/images/game/robot/` |
| `08-haunted-servers/scenery/` | `/images/game/nightmare/` |
| `09-the-core/scenery/` | `/images/game/core/` |

This mapping is defined in [`build/asset-paths.mjs`](../build/asset-paths.mjs).

## Shared assets

Cross-world art belongs in [`assets/shared/`](../assets/shared/).

| Category | Folder |
|---|---|
| Hero sprites / skins | [`hero/`](../assets/shared/hero/) |
| Ability medallions | [`skills/`](../assets/shared/skills/) |
| Arrows | [`arrows/`](../assets/shared/arrows/) |
| Blades / rotating weapons | [`blades/`](../assets/shared/blades/) |
| Spectres / companions | [`spirits/`](../assets/shared/spirits/) |
| Combat effects | [`fx/`](../assets/shared/fx/) |
| UI / HUD / buttons / panels | [`ui/`](../assets/shared/ui/) |
| Equipment | [`items/`](../assets/shared/items/) |
| Store art | [`store/`](../assets/shared/store/) |
| Equipment slots | [`slots/`](../assets/shared/slots/) |
| Forge / upgrade icons | [`forge/`](../assets/shared/forge/) |
| World-map art | [`map/`](../assets/shared/map/) |
| Backgrounds | [`backgrounds/`](../assets/shared/backgrounds/) |
| Guide / book art | [`book/`](../assets/shared/book/) |
| Music-related art/data | [`music/`](../assets/shared/music/) |
| README screenshots/logo | [`readme/`](../assets/shared/readme/) |
| App icons / covers | [`shared/`](../assets/shared/) |

The shared `forge/` directory is for upgrade/forge UI art; it is **not** World 7 scenery. World 7 scenery belongs in [`assets/worlds/07-the-forge/scenery/`](../assets/worlds/07-the-forge/scenery/).

## Special assets

Special-mode art that does not belong to one of the nine normal worlds lives under [`assets/special/`](../assets/special/).

Current special set:

- [`special/secret-shift/bosses/`](../assets/special/secret-shift/bosses/) — Secret Shift boss sprites.
- [`special/siege/`](../assets/special/siege/) — Siege's battlefield (`backdrop`, ground included) and its side-view fortresses: ours (`castle-1..4`, a round turret on the right for the crossbow) and the enemy's (`enemy-1..3`), one per upgrade/difficulty level, and our crossbow (`xbow-1..4`, one picture each, drawn horizontal and pointing right, turning on its wheel; the fourth is a rocket launcher). Also each world's battlefield (`bg-clean` all clean for the first world, `bg-islands`, `bg-forest`, `bg-desert`, `bg-snow`, `bg-final` all corrupt for the last world, and `bg-sky`, `bg-swamp` for the fourth stage of worlds 2 and 3; clean on our side, corrupt on the enemy's, every ground edge on the same row, the rockets' explosion (`fx-boom-0..7`, eight frames standing on the ground; `fx-boom-dark-0..7` the same with black smoke; `fx-boom-cyan-0..7` the heavy robot's plasma ball), the new powers' three-part animations (`fx/blackhole|judgement|sanctuary|glacial|wall|rift-0..11`: coming in 0–3, looping 4–7, going 8–11; `fx/dragonpass-0..7` the flying dragon, wings then breathing, and `fx/dragonfire-0..3` its fire on the ground; `fx/anchor-0..11` the reaper's anchor thrown, hauled back and its impact, also as `fx/anchor-hit-0..3`), the King of Darkness, the last guardian (`units/boss-dark-king-air-0..11` on his flying throne: wings, orb, hurt, the throne breaking, then the eye ray, skulls and portal poses; `units/boss-dark-king-ground-0..9` on foot: steps, slam, hurt, spikes and pulse; `units/shot-darkorb`, `units/shot-skull` and `fx/king-portal-0..1`), the power icons (`powers/power-<power>-<form>`, the owner's badges for the Special shop tab and the battle's S tab, their rim richer per form), the owner's drawn battle effects (`fx/`, cut from the owner's effect sheets: per-weapon hits `hit-bullet|thrown|energy|ice|magic|heavy`, `stun`, `ice-block` and its `shatter`, `heal`, the elite `aura`, `wreck` and the scrap pieces `piece-gear|bolt|plate`, the enemy's `soul`, a flyer's `crash`, `loot`, rocket `trail` and launcher `smoke`, the gun `casing`, the arrow `streak`, arrivals `arrive-land|air|heavy|foe` and the catapult's `rock-land`; from the second batch: fortress `burn` and `smoke`, its `collapse`, `rubble` and the pieces `piece-stone|beam|flag`, the crossbow's `bowflash-1..4`, power `warn`, `storm-sky` and `storm-bolt`, tsunami `spray`, meteor `crater`, ground `scorch-0..2`, `crack-0..2`, `step` and `charge` dust, each world's drifting `amb-<leaf|firefly|sand|snow|ember>-0..5` and `bird-blue|brown`, the `horn` and `skull` moments, and the screen flourishes `firework`, `confetti-0..7`, `defeat`, `levelup`, `shine`, `energy`, `coin` and `ring`; animations are `<name>-<frame>` on one canvas per animation, drawn by the `anim` and `piece` effects), the owner's UI kit (`ui/`: panels, card and slot frames, buttons in five colours with pressed states, round buttons, the gold plate, the ribbon, map spots and the guardian's spot, tabs), the maps (`map-worlds`, the six worlds' road; `map-1..6`, each world's five stages; buttons are laid on their platforms by `MAP_SPOTS` in `src/siege/index.ts`); `backdrop` is the old single picture, kept as a fallback), the aim stick (`aim-track`, the double arrow, and `aim-knob`, the green orb), the mana monument in mid-field (`mana`, a winged crystal pillar; `mana-dark` the Villain's, recoloured black and red), the Villain's weapon (`fx/eye-1..4` and `fx/eye-fire-1..4` the Eye of Darkness in its turret, `fx/hand-1..4-0..5` the hands bursting from the ground where its volley lands, `bow-dark` its bar button's three frames) and Siege Cartoon's battle bar, the owner's picture whole (`bar`; `bar-dark` and `bar-tab-l|a|s-dark` the Villain's, its blue parts recoloured red; the tabs, the seven card slots and the bow ball are buttons laid on it; `bar-tab-l|a|s` light the picked tab).

## Repository path vs browser URL

Never assume the repository folder is the browser path.

| Canonical source | Published URL |
|---|---|
| `assets/worlds/02-hotfix-inferno/bosses/overlord-0.webp` | `/images/game/bosses/overlord-0.webp` |
| `assets/worlds/03-code-freeze/scenery/ice-36x36-0.webp` | `/images/game/viking/ice-36x36-0.webp` |
| `assets/worlds/05-legacy-jungle/scenery/stone-0.webp` | `/images/game/jungle/stone-0.webp` |
| `assets/shared/skills/fire.webp` | `/images/game/skills/fire.webp` |
| `assets/shared/ui/logo.webp` | `/images/game/ui/logo.webp` |
| `assets/special/secret-shift/bosses/kratos-0.webp` | `/images/game/bosses/kratos-0.webp` |
| `assets/special/siege/castle-1.webp` | `/images/game/siege/castle-1.webp` |

Runtime TypeScript, CSS and HTML should continue to reference `/images/game/...`. Do not introduce runtime URLs containing `/worlds/`, `/shared/` or `/special/`.

## Replacing an existing asset safely

1. Find the canonical source file in `assets/worlds/`, `assets/shared/` or `assets/special/`.
2. Keep the filename unchanged unless the code is intentionally being updated to a new public URL.
3. Preserve canvas size, transparency, sprite framing and anchor behavior when replacing animation frames.
4. For numbered animations, preserve frame numbering/order unless the renderer is updated at the same time.
5. Do not create a duplicate flat copy under `static/images/game/`; that source directory is retired.
6. Run the relevant checks from the repository root.

```bash
npm run test:game:layout
npm run typecheck
npm run test:game
npm run build
```

The production build verifies that the published game asset set matches the canonical source mapping and that copied bytes have not changed unexpectedly.

Browsers may keep showing the old picture for days after a redraw that keeps its filename: `/images/` is served with `max-age=3600, stale-while-revalidate=604800`. When a Siege Cartoon sprite is redrawn under the same name, raise or add its revision in `ART_REV` (`src/siege/cartoon/view.ts`). Its URL then carries `?r=<n>`, and every player fetches the new art at once. Other parts of the game have no such revision yet: give a redrawn picture a new filename there.

## Adding a new asset

Choose the source folder by ownership:

- belongs to one world → that world's `enemies/`, `bosses/`, `floors/` or `scenery/`;
- reused across worlds/modes → `assets/shared/`;
- belongs only to a special mode/set → `assets/special/<set>/`.

Then reference the asset through its **published** `/images/game/...` URL in runtime code.

If a new top-level world is ever added, update the explicit world list/cast mapping in [`build/asset-paths.mjs`](../build/asset-paths.mjs); unknown world folders intentionally fail validation.

## Naming and animation rules

- Keep related animation frames together and consistently numbered.
- Do not infer pose meaning from the number alone; inspect the selecting code, especially [`src/draw.ts`](../src/draw.ts) and Battle rendering in [`src/boardViewRender.ts`](../src/boardViewRender.ts).
- Avoid silent resizing or recompression during folder moves.
- Preserve transparency where sprites are expected to composite over the arena.
- Do not rename a public asset path casually: CSS and renderer code deliberately keep stable `/images/game/...` URLs.

## Generated files

Do **not** edit:

- root generated `game.html`;
- `.cache/`;
- `dist/`;
- `public/`;
- retired `static/images/game/` (do not recreate it).

Canonical asset sources are always under [`bug-hunter/assets/`](../assets/).
