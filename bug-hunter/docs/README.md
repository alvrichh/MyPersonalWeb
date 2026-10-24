# BUG HUNTER documentation

[← Game README](../README.md) · [Release history](../CHANGELOG.md) · [Browse assets](../assets/) · [Source code](../src/)

This folder contains supporting documentation for BUG HUNTER. The main user/developer entry point remains [`bug-hunter/README.md`](../README.md).

## Documentation map

- **[Fortress foundation](./fortress.md)** — new landscape-first base-building mode design, MVP scope, nine world styles, buildings and walls. Code scaffold: [`../src/fortress/types.ts`](../src/fortress/types.ts).


| Document | Use it for |
|---|---|
| **[assets.md](./assets.md)** | Finding world/shared/special art, replacing sprites, and understanding repository paths versus `/images/game/...` URLs. |
| **[structure.md](./structure.md)** | Understanding the dedicated `bug-hunter/` folder, Vite integration, generated files, compatibility and validation. |
| **[../CHANGELOG.md](../CHANGELOG.md)** | Version-by-version release history. |
| **[../AGENTS.md](../AGENTS.md)** | Development guardrails and required checks. |
| **[legacy-repository-guide.md](./legacy-repository-guide.md)** | Historical design/repository notes retained from before the folder migration. Its old paths are not authoritative. |

## Sources of truth

- Game code: [`../src/`](../src/)
- Game assets: [`../assets/`](../assets/)
- Editable HTML: [`../game.html`](../game.html)
- Runtime version: [`../src/version.ts`](../src/version.ts)
- Release notes: [`../CHANGELOG.md`](../CHANGELOG.md)
- Asset projection: [`../build/asset-paths.mjs`](../build/asset-paths.mjs)
- Build integration: [`../build/integration.mjs`](../build/integration.mjs)

Do not use generated root `game.html`, `.cache/`, `dist/` or `public/` as editable sources.
