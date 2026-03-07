# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Tech Stack

- **TanStack Start** - Full-stack React framework with SSR
- **Bun** - Runtime and package manager
- **shadcn/ui** - UI components
- **Tailwind CSS v4** - Styling
- **Drizzle ORM** - Database (PostgreSQL)
- **TanStack Query** - Server state management (caching, refetch, mutations)
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
3. **Always use shadcn components** — never use native `<input>`, `<select>`, `<button>`, or `<label>` directly. Use `Input`, `Select`, `Button`, `Label` from `@/components/ui/`.
4. **Use Radix `Select`** (not `NativeSelect`) for dropdowns — native `<select>` dropdown popups are rendered by the browser and cannot be themed with CSS.
5. **Forms**: Use shadcn `Field`/`FieldLabel`/`FieldError` + react-hook-form (`Controller`/`useForm`) + zod for validation. Define schemas in `src/lib/schemas/`.

## TanStack Start Notes

- No React Server Components support yet
- Don't use `'use client'` or `'use server'` directives
- Use `useId()` hook for form field IDs (SSR hydration safety)
- Server functions must return plain serializable data — `db.execute()` returns a pg `Result` object that crashes seroval. Extract `.rows` before returning.
- Use zod schemas in `inputValidator`: `.inputValidator((d: unknown) => schema.parse(d))` — not identity functions.

## TanStack Query

- Use `queryOptions()` to define queries in `src/lib/queries/` — reuse in loaders and components
- Route loaders: `context.queryClient.ensureQueryData(myQuery())`
- Components: `useSuspenseQuery(myQuery())` for data, `useMutation()` for writes
- Invalidate after mutations: `queryClient.invalidateQueries({ queryKey: ... })`
- Define query key factories per domain (e.g. `adminKeys.dashboard()`)

## Monorepo Structure

Projects live in `projects/` and `packages/`. Root provides shared TypeScript and Biome config.
