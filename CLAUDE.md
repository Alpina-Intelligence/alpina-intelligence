# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Tech Stack

- **TanStack Start** - Full-stack React framework with SSR
- **Bun** - Runtime and package manager
- **shadcn/ui** - UI components
- **Tailwind CSS v4** - Styling
- **Drizzle ORM** - Database (PostgreSQL)
- **Biome** - Linting and formatting

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
- Bun auto-loads `.env` - no dotenv needed

## shadcn/ui Components

1. **Search/explore** with MCP tools (`mcp__shadcn__search_items_in_registries`, etc.)
2. **Install** with CLI: `bunx --bun shadcn@canary add <component>`

## TanStack Start Notes

- No React Server Components support yet
- Don't use `'use client'` or `'use server'` directives
- Use `useId()` hook for form field IDs (SSR hydration safety)

## Monorepo Structure

Projects live in `projects/` and `packages/`. Root provides shared TypeScript and Biome config.
