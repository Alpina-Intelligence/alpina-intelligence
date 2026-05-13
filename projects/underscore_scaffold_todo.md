# Underscore — Scaffold Todo

Steps to scaffold `projects/underscore/{frontend,backend,shared}` cleanly. Order:
**shared → backend → frontend**, with `bun install` from the repo root between steps so workspace links resolve.

Already in place from the prior attempt (no need to redo unless reverted):

- [x] `package.json` workspaces glob: `["projects/*", "projects/*/*", "packages/*"]`
- [x] `tsconfig.json` references for the three subpackages
- [x] `scripts/init-databases.sql` adds `CREATE DATABASE underscore;`
- [x] `CLAUDE.md` project-table row

> Note: TS references currently point to non-existent dirs. They'll resolve once the dirs exist; do not run `tsc --build` from root until at least `shared/` exists.

---

## 1. Shared — `projects/underscore/shared/`

Pattern mirrors `packages/themes/` minus Storybook/Zustand. No scaffolder, hand-built.

### Libraries
- [x] `zod` — peer dependency (not direct), keeps version alignment with consumers

### Configs
- [x] `package.json` — name `underscore-shared`, `private: true`, `type: "module"`, `exports` field pointing **directly to TS source** (`"types": "./src/index.ts", "default": "./src/index.ts"`), `peerDependencies: { zod: "^4.0.0" }`. Add zod to `devDependencies` too so type-checking works in isolation.
- [x] `tsconfig.json` — `composite: true` + `noEmit: true` (matches `@alpina/themes` pattern). **Do not** use `declaration: true` + `outDir: "./dist"` — both Vite and Bun consume TS source directly, so a build step is unnecessary, and dist-build adds an ordering constraint we don't need.

### Source files
- [x] `src/index.ts` — re-exports from `schemas/`
- [x] `src/schemas/index.ts` — re-exports schema modules
- [x] `src/schemas/books.ts` — zod schema + `z.infer<typeof X>` type alias
- [x] `src/schemas/library-entry.ts` — same pattern
- [x] `src/schemas/reading-position.ts` — same pattern

---

## 2. Backend — `projects/underscore/backend/`

No scaffolder — fully hand-built.

### Libraries
- [x] `hono` — web framework, runs on `Bun.serve()`
- [x] `@hono/zod-validator` — zod middleware for Hono
- [x] `drizzle-orm` — ORM
- [x] `pg` — Postgres driver (matches alpina-site)
- [x] `zod` — validation + env parsing
- [x] `underscore-shared` — workspace:* dep for shared schemas
- [x] **dev:** `drizzle-kit`, `@types/pg`, `@types/bun`

### Configs
- [x] `package.json` — name `underscore-backend`; scripts: `dev: "bun --watch src/index.ts"`, `db:generate`, `db:migrate`, `db:studio`, `format`, `lint`, `check`
- [x] `tsconfig.json` — standalone, `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`, `strict: true`, `noEmit: true`, `types: ["bun-types"]`
- [x] `drizzle.config.ts` — mirror `projects/puck-prophet/drizzle.config.ts`, but **replace the `process.env.DATABASE_URL!` non-null assertion with an explicit null check + throw** — Biome's `noNonNullAssertion` rule (enabled at the root config level) flags it as an error. Puck-prophet was scaffolded before this rule was added.
- [x] `.env.example` — `DATABASE_URL`, `BETTER_AUTH_SECRET` (stub), `PORT=3001`

### Source files
- [x] `src/index.ts` — `Bun.serve({ fetch: app.fetch, port: env.PORT })`
- [x] `src/app.ts` — Hono app composition, `export type AppType = typeof app` for RPC
- [x] `src/env.ts` — zod schema parsing `process.env`, throws on missing
- [x] `src/db/client.ts` — `drizzle(new Pool({ connectionString: env.DATABASE_URL }))`
- [x] `src/db/schema.ts` — placeholder Drizzle tables: `books`, `library_entries`, `reading_positions`
- [x] `src/routes/health.ts` — `c.json({ ok: true })`
- [x] `src/routes/books.ts` — placeholder GET, validated through shared zod schema. Import the **exported `Book` type** from `underscore-shared/schemas` (`import { type Book, bookSchema } from '...'`); do **not** use `typeof bookSchema._type` — that's a zod 3 trick that doesn't compile in zod 4.

---

## 3. Frontend — `projects/underscore/frontend/`

Scaffold + manual cleanup + post-scaffold setup.

### Scaffold step
```bash
cd projects/underscore
bunx --bun @tanstack/cli@latest create frontend \
  --router-only \
  --package-manager bun \
  --toolchain biome \
  --no-git \
  --no-examples \
  --no-intent
```

> `create-tsrouter-app` is deprecated — it now forwards to `@tanstack/cli`. `--tailwind` is also deprecated (always on). `--router-only` disables Start-only add-ons including `shadcn`, so run `shadcn init` manually after.
>
> `--no-intent` skips the post-scaffold `bunx --bun @tanstack/intent install` step, which fails because the CLI invokes it without `@latest` (bunx only looks for a locally-installed binary in that form). Run it manually with `@latest` if you want the skill mappings — see below.

### TanStack Intent (optional, after scaffold)

TanStack Intent is a runtime skill-discovery tool: it doesn't install a `skills/` directory, it just adds an `AGENTS.md` block telling agents to call `bunx --bun @tanstack/intent@latest list` to see available skills and `... load <package>#<skill>` to fetch a specific `SKILL.md` on demand. The 17 skills span `@tanstack/router-core` (data-loading, auth-and-guards, search-params, navigation, type-safety, etc.) and devtools.

```bash
cd projects/underscore/frontend
bunx --bun @tanstack/intent@latest install   # creates AGENTS.md
```

> Optional: a nested `CLAUDE.md` in `projects/underscore/frontend/` can mirror the AGENTS.md guidance (using `bunx --bun` instead of `npx`) so Claude Code picks it up automatically — Claude Code reads `CLAUDE.md`, not `AGENTS.md`.

### Cleanup of scaffolded output
- [x] Delete any generated `eslint.config.*` if `--toolchain biome` didn't already prevent it

### Libraries to add manually
- [x] `@tanstack/react-query` — server state, not bundled with Router scaffold
- [x] shadcn deps (`class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`) — auto-added by `shadcn init`
- [ ] **Deferred until first form:** `react-hook-form`, `@hookform/resolvers`, `zod`

### Init shadcn
```bash
cd projects/underscore/frontend
bunx --bun shadcn@canary init -t vite -b radix -p nova -y --no-monorepo --force
```

> Gotchas:
> - `-t vite` is the right template (no `tanstack-router` template exists).
> - `-b radix` is required even with `-y` (the radix-vs-base prompt ignores `-y`).
> - **`-p nova` (or another preset: `vega`, `maia`, `lyra`, `mira`, `luma`) is required** even with `-y` — the canary CLI now prompts for a preset and `-y` doesn't pick a default. The CLI also takes `-d / --defaults` but that pins `--template=next` which is wrong here.
> - `--force` if `components.json` already exists from a prior aborted run.
> - Verify `components.json` has `rsc: false` after; aliases use `#/...` (matches the scaffold's `imports` field in package.json).
> - shadcn pulls in `@fontsource-variable/geist` as a dep and adds `@import "@fontsource-variable/geist"` to `styles.css`.

### Configs to edit/create
- [x] `package.json` — rename `frontend` → `underscore-frontend`; format/lint/check scripts already added by `--toolchain biome`; delete generated `pnpm` block
- [x] `tsconfig.json` — already has both `#/*` and `@/*` aliases (shadcn works out of the box). Add `composite: true`. **Do NOT add `references: [{ path: "../shared" }]`** — TS6310 fires because shared has `noEmit: true`. Resolution works fine through node_modules + package.json `exports`.
- [x] `components.json` — verify `rsc: false` (TanStack Router has no RSC support)
- [x] `biome.json` — replace the per-package one written by the scaffold (which conflicts with repo-root config on tabs/quotes) with a **minimal `"root": false, "extends": "//"`** config that excludes `src/routeTree.gen.ts` and `src/styles.css`. Without the styles.css exclude, biome's `noUnknownAtRules` flags Tailwind v4's `@apply`/`@custom-variant`/`@theme` directives.
- [x] `.env.example` — `VITE_API_URL=http://localhost:3001`
- [x] `src/lib/env.ts` — typed env accessor that throws on missing values (per `alpina-frontend` skill's Router-only section)
- [x] `src/lib/api-client.ts` — `apiFetch` wrapper that uses `VITE_API_URL`
- [x] `src/main.tsx` + `src/router.tsx` — **the scaffold ships duplicated router creation in both files** (`router.tsx` exports an unused `getRouter`, `main.tsx` creates its own). Consolidate: one `createRouter()` factory in `router.tsx` that returns `{ router, queryClient }` and wires queryClient into router context; `main.tsx` calls it and wraps in `<QueryClientProvider>`.
- [x] `src/routes/__root.tsx` — switch to `createRootRouteWithContext<RouterContext>()`. **`RouterContext` must be exported** (not just declared) — `composite: true` triggers TS4023/TS4058 ("name `RouterContext`...cannot be named") in the generated `routeTree.gen.ts` otherwise.
- [x] `src/main.tsx` — replace the scaffold's `document.getElementById('app')!` non-null assertion with an explicit null check (Biome `noNonNullAssertion`).

---

## 4. Wire & verify

- [x] `bun install` from repo root — accepts new workspaces, links `underscore-shared` into both consumers
- [x] **First-run only**: `cd projects/underscore/frontend && bun run dev` (briefly, then kill) to generate `src/routeTree.gen.ts` via the TanStack Router Vite plugin. Without this file, `tsc --build` fails with TS2307. There is no standalone CLI for this; `bunx tsr generate` runs an unrelated `tsr` package.
- [x] `bunx tsc --build projects/underscore/{shared,backend,frontend}` — composite project references compile clean
- [x] `bunx biome check projects/underscore` — Biome passes on all three packages (skipping the pre-existing alpina-site warning, see Known issues)
- [x] `cd projects/underscore/backend && bun run db:generate` — created `drizzle/0000_useful_adam_destine.sql` (3 tables, FKs)
- [x] Boot backend: `bun run dev` → `curl http://localhost:3001/health` returns `{"ok":true}`, `curl 'http://localhost:3001/books?limit=3'` returns `{"books":[],"limit":3}` _(verified with stub DB env; `Pool` is lazy and doesn't connect until first query)_
- [x] Boot frontend: `bun run dev` — verified end-to-end via the reader (library page renders, EPUB opens in foliate-js)
- [x] `docker compose up -d db` — Postgres 17 running, healthy, `underscore` database present
- [x] `cd projects/underscore/backend && bun run db:migrate` — migrations applied (now `0000_numerous_speed.sql` + `0001_salty_demogoblin.sql`, regenerated from the original `0000_useful_adam_destine.sql` after schema changes incl. Better Auth)

---

## Known issues (pre-existing, not introduced by this scaffold)

- ~~`bun run check` from the **repo root** fails because `projects/alpina-site/biome.json` is treated as a nested root config under Biome 2.x.~~ **Fixed** by adding `"root": false` to `projects/alpina-site/biome.json`.
- However, that fix surfaced **226 pre-existing formatting errors in alpina-site** — the codebase has mixed tab/space indentation drift across files. `bun run check` from root still exits non-zero. Underscore packages are clean (`bunx biome check projects/underscore` passes). The alpina-site cleanup is a separate task: either `bunx biome check --write projects/alpina-site` (mechanical reformat to declared tab/double-quote style, big diff) or update its config to match what's actually there.

---

## Post-scaffold progress (as of 2026-05-11)

Work moved past the scaffold. Snapshot of what's been built on top:

### Backend

- [x] Better Auth wired (`backend/src/lib/auth.ts`, drizzle adapter, UUIDv7 IDs, email+password enabled). Handler mounted at `/api/auth/*` in `app.ts`. Auth schema in `db/auth-schema.ts`, tables (`user`/`session`/`account`/`verification`) live in DB via migration `0001`.
- [x] EPUB storage layer: `lib/storage.ts` (`resolveStorageKey()` — single seam for future S3/R2 swap), `books.storage_key` column, `GET /books/:id/file` streaming endpoint with immutable caching.
- [x] Wire-shape helpers: `lib/wire.ts` (`toWire()` drops internal uuid, renames `publicId` → `id`).
- [x] Dev-data scripts: `bun run fetch:epubs`, `bun run seed:books` (idempotent on `storage_key`); `dev-data/epubs/` directory.
- [x] Dual-ID convention codified (`db/columns.ts` helpers); zod schemas use `publicIdSchema`.

### Frontend

- [x] foliate-js added as git submodule at `frontend/vendor/foliate-js/` (see `.gitmodules`).
- [x] Reader component (`components/reader.tsx`) — imports `view.js` for side-effect, opens EPUB blob, calls `view.next()` once on load to render first page.
- [x] Reader UI: `reader-settings-popover`, `reader-shortcuts-dialog`, `reader-skeleton`, `reader-settings.ts` + `use-reader-settings.ts` (persistent font/theme prefs).
- [x] App shell: `app-sidebar`, library skeleton, recents (`recents.ts` + `use-recents.ts`).
- [x] React Query factories in `lib/queries.ts`: `['books']`, `['book', id]`, `['book-file', id]` with `staleTime: Infinity` + 10-min `gcTime` for the blob.
- [x] shadcn components added: button, sidebar, sheet, popover, dialog, slider, toggle/toggle-group, scroll-area, tooltip, separator, skeleton, input.

### Conventions docs

- [x] `projects/underscore/CLAUDE.md` written (zod 4 forms, schema sharing pattern, dual-ID convention, EPUB storage + serving, foliate-js gotcha, React Query keys).

---

## Open / next

- [ ] **Frontend auth integration** — no auth client, no login/signup routes yet. Backend `/api/auth/*` is live but unused from the SPA. Likely next thread. Use `email-and-password-best-practices` + `better-auth-best-practices` skills.
- [ ] Commit the scaffold + post-scaffold work (still uncommitted on `feature/scaffold-ereader`).
- [ ] Capacitor wrapper (only after PWA works in browser).
- [ ] Storybook, e2e tests, CI workflow for the new project.
- [ ] PWA manifest + service worker.
