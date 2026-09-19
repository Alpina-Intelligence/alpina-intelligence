# AGENTS.md — alpina-intelligence

Contracts and boundaries for this monorepo. The *reasoning* lives in `docs/adr/` (cite the
ADR, don't restate it) and `docs/architecture.md`. Read the relevant ADR before changing
related design.

## What this is

All Alpina projects in one repo (ADR-0001): shared substrate (`infra/`), deployable apps
(`apps/*`, grouped by deployable unit — ADR-0002), shared libs (`packages-ts/`,
`packages-py/`). HTTP apps deploy to Cloudflare Workers (ADR-0003) against one managed
PlanetScale Postgres cluster (ADR-0004, ADR-0005). No VPS: the pre-ADR-0003 host path
(`infra/cloudflared`, `infra/host`, `infra/postgres`, `infra/sm-operator`) is retired.

## Where guidance lives

- `AGENTS.md` (this file, plus `apps/<name>/AGENTS.md`) — contracts and judgment calls.
- `.agents/rules/` — invariants a pattern can catch; stream-checked on edits.
- `.agents/skills/` — how-tos: `alpina-frontend`, `alpina-data-tier` (ours);
  `cloudflare`, `wrangler`, `shadcn`, `postgres` (vendor, managed by `skills-lock.json` /
  `bunx skills update`). `.mcp.json` provides live Cloudflare docs, shadcn registry, and
  PlanetScale Insights.

## Workspace (ADR-0002)

- **Bun** workspace: root `package.json` globs `apps/*` + `packages-ts/*`; deps pinned exact
  (`bunfig.toml` `exact = true`); shared pins in the root `catalog`, members use
  `"catalog:"`. TanStack: pin exact, bump the whole family together.
- **uv** workspace: virtual root `pyproject.toml` (never add a `[project]` table), one
  `uv.lock` + one `.venv`. Deps go in the member's pyproject. Python shared code is the
  `alpina.*` PEP 420 namespace — never create `src/alpina/__init__.py`.
- **Adding a TS app takes both sides:** Bun claims it via glob, and it MUST be added to
  `[tool.uv.workspace] exclude` in `pyproject.toml` — `uv sync` fails loudly until then.
- Shared TS packages export raw source (no `dist/`). Package litmus: ≥2 consuming apps AND
  no owned persistent state — anything needing a DB connection belongs to one app.
- **Every import is a declared dependency; "it resolves" is not proof.** Check `bun.lock`,
  not `node_modules/`.
- `bun run <script>` is per-workspace-member: `build`/`check`/`db:*`/`deploy` run from
  `apps/<name>`, not the root.

## Frontend

Stack: TanStack Start/Router/Query, shadcn/ui on **Base UI** (never Radix), Tailwind,
Drizzle ORM + postgres-js. Invariants, enforced by `.agents/rules/frontend-*`:

- Icons are **Phosphor-only** (`@phosphor-icons/react`); `lucide-react` is banned.
- Composition is Base UI's `render` prop, never `asChild`.
- Theming is **token-only**: components use semantic utilities; palettes live in
  `styles.css` var blocks.

Judgment calls:

- TanStack and Drizzle APIs move fast — **load the version-matched guidance before editing**
  (`alpina-frontend` skill; routing table in `apps/www/AGENTS.md`) and check the skill's
  `library_version` against the installed package. Never work from pre-trained knowledge.
- The TanStack family is currently version-drifted against the "bump together" rule; fix as
  one change, not piecemeal.

## Data tier (ADR-0005)

- **One PlanetScale cluster, many logical databases.** Never create a second cluster.
  App dir name = database name (`apps/www` → `www`).
- **App DB code has NO tier branching:** read `env.HYPERDRIVE.connectionString` everywhere.
  Locally the binding is fed by `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`
  (`.envrc`); libpq vars are for `drizzle-kit`/`psql` only. Never `localConnectionString`
  in `wrangler.jsonc`.
- DB client is **per request** (`max: 5`, `fetch_types: false`, `prepare: true`);
  Hyperdrive configs are `--caching-disabled`.
- Migrations run from CI as `<db>_migrator` through `src/db/migrate.ts`, never a laptop and
  never `drizzle-kit migrate`. The Worker's `<db>_svc` role has no DDL rights.
- `REVOKE CONNECT … FROM PUBLIC` + selective `GRANT CONNECT` is the *entire* per-database
  isolation boundary. Verify with `has_database_privilege`.
- Real SQL goes through `psql`; the MCP server is insights-only. Never register the full
  PlanetScale MCP server.
- Canadian residency is partial: Postgres is in Canada, the R2 lake cannot be. Never claim
  "all your data stays in Canada."
- Worker name = app dir name (`apps/<name>/wrangler.jsonc`); custom domains are `routes`
  there; `bun run deploy` = `vite build && wrangler deploy`.

Provisioning steps, PlanetScale traps, rotation, toolchain gotchas: `alpina-data-tier` skill
and `infra/planetscale/README.md`.

## Secrets

- Never commit secrets in any form. `.env*` is gitignored, local convenience only.
- **Bitwarden Secrets Manager is the vault of record**; access via `bwsl` per invocation
  (token never lands in a session env or on disk). Cloudflare Secrets Store is not adopted.
- One secret per role × database holding the **whole connection URL** — never split parts.
- **CI must never be able to read `PLANETSCALE_ADMIN_URL`.** CI holds only
  `BWS_ACCESS_TOKEN` and fetches the `<db>_migrator` URL at run time.
- Hyperdrive keeps its own copy of the credential: rotation is not done until
  `wrangler hyperdrive update` has run.

## Git / GitHub

- Work happens on `platform` (tracks `origin/platform`). `main` is the pre-restart line,
  left alone; no PR is open against it.
- Bare `git` is already correct inside `~/dev/` (identity and credential helper come from
  `~/.gitconfig` `includeIf`); inject nothing. Diagnose with
  `git config --show-origin --get-regexp '^credential'`, not `--get credential.helper`.
- `gh` is the exception (global active account): pin per call —
  `GH_TOKEN="$(gh auth token --user eric-austin)" gh …` — or `gh auth switch --user
  eric-austin`. The work account sees a different world (private org repos vanish).
