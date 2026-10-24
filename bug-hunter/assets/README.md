# Bug Hunter assets by world

[Game guide](../README.md) | [Changelog](../CHANGELOG.md)

## Editable folders

| Folder under `worlds/` | World | Main cast |
|---|---|---|
| `01-backlog/` | The Backlog | original enemies, Monolith, Kernel |
| `02-hotfix-inferno/` | Hotfix Inferno | demons, Overlord, Archdemon |
| `03-code-freeze/` | Code Freeze | vikings, Valkyrie, Drakkar, Valdur |
| `04-big-ball-of-mud/` | Big Ball of Mud | mud enemies, snakes, Mud Monster, Medusa |
| `05-legacy-jungle/` | Legacy Jungle | jungle enemies, Ancient Tree, Queen |
| `06-the-arena/` | The Arena | Greek enemies, Minotaur, Zeus |
| `07-the-forge/` | The Forge | robots, Mainframe, Mech |
| `08-haunted-servers/` | Haunted Servers | nightmare enemies, Lich, Wraith |
| `09-the-core/` | The Core | dragon cast, Hydra, all Nocthrax phases |

Each world has `enemies/`, `bosses/` and `floors/`. Existing world-specific scenery is in `scenery/`; no empty or invented scenery set was added for Mud. Older cast-boss files remain in `enemies/` where their public names require it.

`shared/` holds heroes, UI, skills, weapons, companions, effects, equipment, global backgrounds, map-selection art, documentation images and upgrade icons. The shared `forge/` contains upgrade icons, not World 7 scenery. `special/secret-shift/bosses/` holds Kratos and his second form. Files are not duplicated into multiple worlds.

## Repository paths are not browser URLs

The build-only resolver [asset-paths.mjs](../build/asset-paths.mjs) preserves the existing URL suffixes:

| Editable source | Public URL |
|---|---|
| `worlds/02-hotfix-inferno/bosses/overlord-0.webp` | `/images/game/bosses/overlord-0.webp` |
| `worlds/04-big-ball-of-mud/enemies/snake-p-0.webp` | `/images/game/enemies/snake-p-0.webp` |
| `worlds/05-legacy-jungle/scenery/wall.webp` (path example) | `/images/game/jungle/wall.webp` |
| `shared/ui/logo.webp` | `/images/game/ui/logo.webp` |
| `special/secret-shift/bosses/kratos-0.webp` | `/images/game/bosses/kratos-0.webp` |

Do not rewrite runtime URLs to `/worlds/` or `/shared/`. The resolver removes the organization prefix and restores each scenery cast prefix. Duplicate public paths, case-only collisions and file/directory conflicts fail explicitly instead of silently overwriting art.

## Editing safely

Keep filenames, numbered frames, transparency, dimensions and anchor points unchanged unless intentionally updating a character. Check `../src/draw.ts` for frame selection; filenames alone do not describe the pose. No asset was resized or recompressed for this reorganization.

Run commands from the repository root. `npm run dev` mirrors additions, edits and deletions to the old public URLs; deleting one world's folder cannot remove another world's files from a shared public category. `npm run test:game:layout` includes mapping tests. `npm run build` checks the exact published URL set and every output asset's bytes. Never edit `.cache/`, `dist/` or root `public/`.
