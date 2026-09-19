---
name: alpina-frontend
description: How-to reference for alpina frontends (apps/www): loading version-matched TanStack Start/Router/Query guidance via the intent CLI, current TanStack version drift, looking up Drizzle ORM docs by installed version, landing shadcn components on Base UI + Phosphor, and adding themes. Load before editing TanStack, Drizzle, shadcn, or theming code in any apps/* frontend.
---

# alpina frontend how-tos

Hard invariants (Phosphor-only, Base UI `render` props, token-only theming) are enforced by
`.agents/rules/frontend-*.md`; this file is the *how*.

## TanStack Start / Router / Query — always load the installed skill first

The APIs move fast; pre-trained knowledge is stale. The installed packages ship
version-matched skills through `@tanstack/intent`. The routing table (skill id → what it
covers) is the `intent-skills` block in `apps/www/AGENTS.md`.

```sh
cd apps/www
bunx @tanstack/intent@latest list               # packages, versions, skill ids
bunx @tanstack/intent@latest load <skill-id>    # e.g. @tanstack/router-core#router-core/data-loading
```

- **Pin the version.** Bare `bunx @tanstack/intent` resolves `@tanstack/devtools-vite`'s
  bin shim, which imports a subpath `@tanstack/intent` no longer exports →
  `ERR_PACKAGE_PATH_NOT_EXPORTED`. `@latest` (or the local
  `bun node_modules/@tanstack/intent/dist/cli.mjs …`) works.
- **Check the skill's `library_version` against the installed package** before trusting an
  example. Regenerate the routing table after any dependency bump:
  `bunx @tanstack/intent@latest install --map` (in `apps/www`).

### Known version drift (verify with `list`; fix as one family bump)

| package | installed |
| --- | --- |
| `@tanstack/react-start` | 1.168.40 |
| `@tanstack/router-plugin` | 1.168.27 |
| `@tanstack/start-server-core` | 1.169.23 |
| `@tanstack/start-client-core` | 1.170.19 |
| `@tanstack/react-router` | 1.170.23 |
| `@tanstack/router-core` | 1.171.19 |

Consequences: no server-route API (`server` on `createFileRoute`) at the installed
`react-start`; `@tanstack/devtools-vite` 0.8.3 declares `vite ^6 || ^7` while the app runs
`vite ^8`. Both resolve by bumping the whole TanStack family together (pin exact, root
`catalog`).

## Drizzle ORM — official docs, by installed version

Check `drizzle-orm` in `apps/www/package.json` first (currently `0.45.2`, stable 0.x).
Stable 0.x and the 1.0 beta have **incompatible relations APIs** (`relations()` per table +
`where: eq(...)` vs one `defineRelations()` + object-style `where`); the docs' main pages
describe 1.0.

```sh
curl -s https://orm.drizzle.team/llms.txt                          # index
curl -s https://orm.drizzle.team/llms-full.txt | grep -A20 <term>  # pinpoint (3.6 MB)
```

No third-party Drizzle skills — none are vendor-maintained.

## Landing a shadcn component

Use the `shadcn` skill (composition/forms/styling rules, CLI) and the `shadcn` MCP server
(live registry, component source). Then:

1. `components.json` says `lucide` (no phosphor option) — swap every generated
   `lucide-react` import for the Phosphor equivalent, aliased to the `*Icon` name the body
   uses: `import { CaretDown as ChevronDownIcon } from "@phosphor-icons/react"`.
2. Confirm the generated code composes via `render`, not `asChild`
   (`.agents/skills/shadcn/rules/base-vs-radix.md`).
3. Colors must be semantic tokens; replace any palette class the registry emitted.

Global icon voice: `IconContext.Provider` (`weight: "bold"`) in `src/routes/__root.tsx`.

## Theming

`apps/www/src/styles.css`: `:root`/`.dark` = default theme (lagoon); `[data-theme='<name>']`
(+ `.dark` composes) = alternates. Adding a theme = two var blocks + the name in
`src/components/theme-controls.tsx`. Mode/theme persist as cookies (`theme-mode`,
`theme-name`); the inline script in `__root.tsx` applies them before first paint.

## Scripts are per-workspace-member

`build`, `check` (biome), `db:*`, `deploy` live in `apps/www/package.json`; run them from
`apps/www`, not the repo root.
