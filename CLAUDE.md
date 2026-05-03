# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Monorepo Structure

Projects live in `projects/`; cross-product shared libraries in `packages/`. Root provides shared TypeScript and Biome config.

**Layout convention:**
- **Single-deploy projects** (frontend-only or backend-only) live as flat siblings under `projects/`.
- **Full-stack products** (separate frontend + backend deploys) live nested: `projects/<product>/{frontend,backend,shared}`. Product-specific shared zod schemas and TS types live in the `shared/` package and are imported by both sides. Reserve `packages/` for things genuinely shared *across* products.

**Default stack for new full-stack products:** TanStack Router SPA (frontend) + Hono on Bun (backend) + Drizzle ORM + Better Auth + zod. Hono RPC gives end-to-end type safety without codegen. This stack is mobile-ready (PWA → Capacitor → native) by default.

| Project | Stack | Notes |
| --- | --- | --- |
| `projects/alpina-site` | TanStack Start + shadcn/ui | Frontend — use the `alpina-frontend` skill |
| `projects/puck-prophet` | TanStack Start + Drizzle/PostgreSQL | Frontend + DB layer — use `alpina-frontend` skill for UI |
| `projects/unified-data-platform` | Python / uv | Data/backend; no frontend |

## Bun Over Node

Always use Bun commands and APIs:

```bash
bun install          # not npm/yarn/pnpm
bun run <script>     # not npm run
bun test             # not jest/vitest CLI
bun <file.ts>        # not node/ts-node
```

Prefer Bun built-in APIs:
- `Bun.file()` / `Bun.write()` instead of `node:fs`
- `Bun.serve()` for servers (supports WebSocket, HTTPS)
- `Bun.$\`cmd\`` instead of execa for shell commands
- Bun auto-loads `.env` — no dotenv needed

## Tooling

**Biome** for linting and formatting (config at repo root).

## Frontend work → use the `alpina-frontend` skill

For any UI/frontend work in `alpina-site` or `puck-prophet` (pages, components, themes, forms, data fetching with TanStack Query, TanStack Start gotchas), invoke the `alpina-frontend` skill. It is the source of truth for shadcn/ui usage, typography, color tokens, form patterns, and TanStack Start framework gotchas.
