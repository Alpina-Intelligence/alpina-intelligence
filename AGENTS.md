# AGENTS.md — alpina-intelligence working notes

Canonical agent guidance for this monorepo. Deliberately thin — the *reasoning* lives in
`docs/adr/` (cite the ADR, don't restate it) and `docs/architecture.md` (the narrative).
Read the relevant ADR before changing related design.

## What this is

All Alpina projects in one repo (ADR-0001): shared substrate (`infra/` — local Postgres,
PlanetScale runbook, Terraform; cloudflared/k3s/sm-operator deprecated per ADR-0003 and
ADR-0004), deployable apps (`apps/*`, grouped by deployable unit, not language — ADR-0002),
shared libs (`packages-ts/`, `packages-py/`). HTTP apps deploy to Cloudflare Workers
(ADR-0003) against managed Postgres (ADR-0004, ADR-0005); the Hetzner VPS is retained for
always-on daemons, reachable only via `:22`.

## Workspace rules (ADR-0002)

- **Bun** workspace: root `package.json` globs `apps/*` + `packages-ts/*`; TS deps pinned
  exact (`bunfig.toml` sets `exact = true`); shared version pins go in the root
  `catalog`, members reference `"catalog:"`. TanStack packages: pin exact, bump the
  whole family together.
- **uv** workspace: virtual root `pyproject.toml` (never add a `[project]` table), one
  `uv.lock` + one `.venv`. Add deps to the *member's* pyproject, not the root.
- **Adding a TS app to `apps/` takes both sides:** Bun claims it via glob, and it MUST be
  added to `[tool.uv.workspace] exclude` in `pyproject.toml` — `uv sync` fails loudly
  until it's classified. That failure is by design.
- Shared TS packages export raw source (no `dist/`, no build step). Package litmus:
  ≥2 consuming apps AND no owned persistent state — a package that needs a DB connection
  belongs to one app.
- Python shared code lives in the `alpina.*` PEP 420 namespace. Never create
  `src/alpina/__init__.py`.
- **Every import must be a declared dependency, and "it resolves" is not proof.**
  `@cloudflare/vite-plugin` and `wrangler` were imported, scripted and `$schema`-referenced
  while absent from every `package.json` *and* from `bun.lock` — present only as orphaned
  installs on one laptop, so a clean checkout could not build. Check `bun.lock`, not
  `node_modules/`.

## Frontend (TanStack Start / Query / Router + shadcn/ui)

- **Before editing TanStack Start/Router/Query code, load the matching skill** from the
  installed packages, which match the installed versions. **Invoke the CLI by path, not via
  `bunx`:** `bunx @tanstack/intent …` resolves `@tanstack/devtools-vite`'s bin shim, which
  imports `./intent-library` — a subpath `@tanstack/intent@0.3.6` no longer exports, so it
  dies with `ERR_PACKAGE_PATH_NOT_EXPORTED`. Working form, from `apps/www`:
  - `bun node_modules/@tanstack/intent/dist/cli.mjs list`
  - `bun node_modules/@tanstack/intent/dist/cli.mjs load <id>`

  Don't work from pre-trained TanStack knowledge; the APIs move fast. And check the skill's
  `library_version` against what's installed — the shipped skills document a newer API than
  this repo's `@tanstack/react-start`, so their examples can fail to typecheck.
  - The routing table for these skills is the `intent-skills` block in
    `apps/www/AGENTS.md` — a **static snapshot**, regenerated only by
    `… /dist/cli.mjs install --map` (run in `apps/www`). Re-run it after any
    dependency bump so the map can't lag the lockfile. Belongs in the post-install
    path once a justfile exists.
  - **The TanStack family is currently version-drifted** (`react-start` 1.168.40,
    `router-plugin` 1.168.27, `start-server-core` 1.169.23, `start-client-core` 1.170.19,
    `react-router` 1.170.23, `router-core` 1.171.19) against this file's own
    "bump the whole family together" rule. Consequence: no server-route API
    (`server` on `createFileRoute`) — fix by bumping the family as one change.
  - **`@tanstack/devtools-vite` declares `vite ^6 || ^7`** while the app runs `vite ^8`.
    Unresolved peer mismatch; fold into the same family bump.
- **Drizzle ORM: retrieve from official docs, never pre-trained knowledge or
  third-party skills** (none are vendor-maintained; we checked). Index:
  `https://orm.drizzle.team/llms.txt`; pinpoint lookups:
  `curl -s https://orm.drizzle.team/llms-full.txt | grep -A20 <term>` (3.6MB full
  dump). CRITICAL version gotcha: stable 0.x and the 1.0 beta have incompatible
  relations APIs (`relations()` per table + `where: eq(...)` vs one
  `defineRelations()` + object-style `where`) — check the installed `drizzle-orm`
  version in the app's package.json first; the docs' main pages describe 1.0.
- **shadcn/ui:** the `shadcn` skill (`.agents/skills/shadcn`, installed via skills.sh —
  `skills-lock.json` tracks it, `bunx skills update` refreshes it) carries composition/
  forms/styling rules and the CLI reference; the `shadcn` MCP server (`.mcp.json`)
  provides live registry search and component sources. Use both rather than guessing
  component APIs; the skill activates on any project with a `components.json`.
- **Cloudflare skills are vendor-direct:** `cloudflare` + `wrangler` installed from
  `cloudflare/skills` (GitHub) via skills.sh into `.agents/skills/`, same channel as
  shadcn. More from that repo (`workers-best-practices`, `durable-objects`, …) are one
  `bunx skills add cloudflare/skills --skill <name>` away. No Claude-marketplace
  plugins: the `claude-plugins-official` copies were cleared 2026-08-11 (they were
  verbatim mirrors of `cloudflare/skills` anyway); the `frontend-design` plugin went
  with them — aesthetic conventions live in this file (theming, icons, base library).
  Cloudflare's `agent-setup/prompt.md` bootstrap is superseded by this setup; its one
  addition we took (2026-08-11) is the public `cloudflare-docs` MCP server in
  `.mcp.json` (live doc search — the skill prefers it over webFetch). The OAuth'd
  siblings (`mcp.cloudflare.com`, `bindings`, `builds`, `observability`) are deferred
  until Workers actually deploy from this repo.
- **Icons are Phosphor-only** (`@phosphor-icons/react`) in every alpina frontend;
  `lucide-react` is banned. `components.json` still says `lucide` (shadcn has no
  phosphor option), so part of landing any `shadcn add` is swapping the generated
  lucide imports for Phosphor equivalents (alias to the `*Icon` names the generated
  body uses). Set the global voice once per app via `IconContext.Provider`
  (`weight: "bold"`) in `__root.tsx`; emphasis states override per-icon.
- **shadcn base library is Base UI** (`base-*` styles, `@base-ui/react`) for every
  alpina frontend — never Radix. Composition is `render`-prop, not `asChild`; see the
  `shadcn` skill's `rules/base-vs-radix.md`.
- **Theming is token-only** (`apps/www/src/styles.css`): components speak semantic
  utilities (`bg-background`, `text-primary`); palettes are CSS-var blocks —
  `:root`/`.dark` = default theme (lagoon), `[data-theme='<name>']` (+ `.dark` compose)
  = alternates. Adding a theme = two var blocks + the name in `ThemeControls`. NEVER
  hardcode colors in components or add CSS that bypasses the tokens. Mode/theme persist
  as cookies (`theme-mode`, `theme-name`); first paint is handled by the inline script
  in `__root.tsx`.

## Substrate boundaries (ADR-0001, architecture.md)

- **The Postgres superuser password never enters CI, an app env, or this repo.** Still
  true, now narrower: `infra/postgres/provision-db.sh` is hand-run and **local/legacy-box
  only** (ADR-0004). No deployed role is ever provisioned by hand.
- HTTP apps deploy to Workers (ADR-0003): each owns `apps/<name>/wrangler.jsonc`
  (worker name = app dir name), deploys via `bun run deploy` (= `vite build &&
  wrangler deploy`); custom domains are `routes` in that file. The k3s/`deploy/`
  manifest path and Docker-image builds are shelved with ADR-0003.
- **Database naming contract (amended by ADR-0005):** app dir name = database name at both
  tiers (`apps/www` → DB `www`). The *role* half is **local-only** — PlanetScale role names
  are cosmetic labels over a generated `<role-id>`. Locally, apps read libpq vars
  (`PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD`) pointing at `127.0.0.1:5434`
  (`infra/local/`, fake creds from `.env.local`); deployed, they read the connection string
  from the Hyperdrive binding (`env.HYPERDRIVE.connectionString`) and see no libpq var at all.
- **Deployed Postgres is ONE PlanetScale cluster holding many logical databases (ADR-0005)** —
  `alpina-intelligence`, `ca-central-1`, branch `main`, port **5432**, bought through the
  Cloudflare dashboard so it bills on the Cloudflare invoice. Never spin up a second cluster
  for a new app. Build the client **per request** — a module-scope `postgres()` singleton is a
  workerd footgun — with `max: 5`, `fetch_types: false`, `prepare: true`. Migrations run from
  CI as `<db>_migrator`, never a laptop; the Worker's `<db>_svc` role has no DDL rights.
  Hyperdrive configs are created **`--caching-disabled`**.
- **App DB code has NO tier branching (ADR-0005 §7):** read
  `env.HYPERDRIVE.connectionString` everywhere. `apps/www` runs SSR under workerd in dev
  (`cloudflare({ viteEnvironment: { name: "ssr" } })`), so the binding resolves under
  `bun run dev` too — point it at local Postgres with
  `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` from `.envrc`. **Never** put
  `localConnectionString` in `wrangler.jsonc` — that file is committed. Local mode connects
  direct: no pooling (accepted), no caching (already matches prod). The libpq vars are for
  `drizzle-kit`/`psql` only, not app code. Driver note: Cloudflare recommends `pg`, we run
  postgres-js — deliberate, since its only cited advantage is caching compatibility and we
  disable caching.
- **New app needs a DB? One touch per tier:**
  1. local: add the name to `APPS=(…)` in `infra/local/initdb/01-roles-and-dbs.sh`,
     then `docker compose down -v && up -d` (initdb only runs on first volume init;
     local data is throwaway by design)
  2. deployed: follow [`infra/planetscale/README.md`](infra/planetscale/README.md) — roles on
     the platform, then `CREATE DATABASE` + `REVOKE CONNECT … FROM PUBLIC` + grants in SQL,
     then `wrangler hyperdrive create … --caching-disabled` and add the binding to
     `apps/<name>/wrangler.jsonc`
- **Canadian residency is partial (ADR-0005):** Postgres is in Canada; the R2 lake **cannot
  be** — jurisdictions are `eu`/`fedramp`/`us`, there is no `ca`. Never claim "all your data
  stays in Canada."
- **NEVER rescale, resize, or rebuild the Hetzner box** (ADR-0004). It holds a
  grandfathered CPX41 price ($46.49/mo; $141.49 to re-order after 2026-06-15) and any of
  those actions forfeits it permanently — Ashburn carries no cost-optimized line.
- **PlanetScale operational traps** (details in
  [`infra/planetscale/README.md`](infra/planetscale/README.md), reasoning in ADR-0005):
  - Port is **5432**. Roles are created **on the platform**, logical databases in **SQL**;
    roles-first collapses all the SQL into one session.
  - You *connect* as `<role-id>.<branch-id>` but reference the **bare `<role-id>`** in
    `GRANT`/`REVOKE`. Mixing them yields confusing "role does not exist" errors.
  - Role permissions are **cluster-wide**; `REVOKE CONNECT … FROM PUBLIC` + selective
    `GRANT CONNECT` is the *entire* isolation boundary. Verify with
    `has_database_privilege`, never assume.
  - **`pg_strict` is per-role Query safety** (*Settings → Roles → `<role>` → Edit*), not an
    Extensions-tab item, and **SQL cannot set it** (needs `ADMIN OPTION` / superuser, which
    the Default role lacks). It is **invisible to `pg_db_role_setting`** — audit by
    connecting as the role and reading `current_setting('pg_strict.…', true)`.
  - Restart-gated extensions (`pg_stat_statements`, `pg_duckdb`, `timescaledb`, `pg_cron`)
    live under *Clusters → Branch → Extensions → Queue → Apply* and can **only** be enabled
    there. `pgvector` needs no restart.
  - `CONNECT` on the `postgres` maintenance DB is **deliberately left open** — `datacl` is
    NULL, so every `pscale_*` role rides the implicit PUBLIC grant and a pooler fronts 5432.

## Secrets

- Never commit secrets in any form — Bitwarden Secrets Manager is the source of truth
  (architecture.md §7). `.env*` is gitignored; local-only convenience.
- **Agent access to Secrets Manager is via `bwsl`** (a `~/.bashrc` wrapper): injects
  `BWS_ACCESS_TOKEN` from the gnome-keyring per-invocation
  (`secret-tool lookup service bws account alpina-dev`) — the token is never exported
  into a session env or written to disk. The machine account behind it is scoped to
  the SM project **`platform`** (`7007b64e-b136-4a7c-ab23-b4910179952f`, org
  `1e847db2-0efb-4c9d-ac5b-b3890164b6a1`).
- **Bitwarden free tier: unlimited secrets, but 3 projects and 3 machine accounts.**
  Projects are the scarce resource *and* the access boundary machine accounts are scoped
  to — never a folder. So group by **consumer identity**, not by app: an `alpina-site`-style
  per-app project burns a capped slot on a boundary that separates nothing, because
  `<db>_svc` (pasted once into Hyperdrive, never read at runtime) and `<db>_migrator`
  (held by CI) have nothing in common as credentials. Target split: `platform`
  (admin/bootstrap, dev only) · `ci` (only what Actions reads) · one spare for Modal.
  A machine account may be granted several projects, so only genuinely separate identities
  consume the 3. **CI must never be able to read `PLANETSCALE_ADMIN_URL`.**
- **Cloudflare Access provisioning is agent-drivable:** `CLOUDFLARE_ACCESS_TOKEN`
  (SM secret `3f9aec0a-…`, account-owned, scoped to Access apps/policies + orgs/IdPs)
  drives the Access API via `bwsl secret get … | jq -r .value` per-invocation. The
  Zero Trust org is `alpina-intelligence.cloudflareaccess.com` (One-time PIN IdP);
  the site sits behind app `www (pre-launch gate)` until launch — un-gating is
  deleting that app, no code change.
- **Cloudflare's secret stores are write-only and Workers-only** (ADR-0005): a Secrets Store
  secret *"can no longer be decrypted or accessed via API or on the dashboard"*, and only
  Workers/AI Gateway can read one. Modal, CI and your terminal cannot — so **Bitwarden stays
  the vault of record** and Secrets Store is not adopted. `apps/www` correctly has zero
  Worker secrets: its DB credential arrives only via the Hyperdrive binding.
- **Provisioning a deployed app's DB credential** (ADR-0005 — one secret per role × database,
  holding the **whole connection URL**, never split into host/port/user/password parts):
  1. mint + store: `bwsl secret create WWW_SVC_DATABASE_URL "postgres://…" <project-id>`,
     password from `openssl rand -hex 32` (alphanumeric only, so it pastes into a URL
     unescaped; `provision-db.sh` rejects symbols by design for the local tier)
  2. bake it into Hyperdrive: `bunx wrangler hyperdrive create <name>
     --connection-string="postgres://…" --caching-disabled`
  3. rotation is three steps — `pscale role reset` → `bws secret edit` (UUID stays stable) →
     `bunx wrangler hyperdrive update <id> --connection-string=…`. **Hyperdrive holds its own
     copy**, so skipping step 3 breaks the Worker; there is no 300s re-read the way
     sm-operator had.
  CI needs no copy of its own: give it only `BWS_ACCESS_TOKEN` and have it fetch the
  `<db>_migrator` URL at run time. The sm-operator / `apps/<name>/deploy/bitwardensecret.yaml`
  / `kubectl rollout restart` path is shelved with ADR-0003 and dead for deployed DBs under
  ADR-0004.

## Toolchain traps hit in practice

One line each; the reasoning lives in the ADR or the file's own comment.

- **`postgres:18` changed the image's data layout.** 18+ stores data in
  major-version-specific subdirectories, and the entrypoint *hard-refuses to start* against
  a volume mounted at the old `/var/lib/postgresql/data`. Mount `/var/lib/postgresql`.
- **Local Postgres tracks the DEPLOYED major (18.x), not the legacy box.** The old parity
  comment pointed at a server ADR-0004 demoted, so drift shipped silently. Extension parity
  is unattainable and not the goal: no stock image ships `pg_strict`, so its guard is
  deployed-only — an unqualified `db.delete(table)` succeeds locally, is refused deployed.
- **postgres-js cannot read libpq URLs.** It forwards unknown query params as Postgres
  *runtime* parameters, so `?sslrootcert=system` becomes `SET sslrootcert` →
  `42704 unrecognized configuration parameter`. Bitwarden keeps the libpq-correct form (so
  `psql` verifies by default); `pgDriverConfig()` in `apps/www/src/db/env.ts` lifts them
  into `ssl: 'verify-full'`. Workers are unaffected — Hyperdrive's string has no SSL params.
- **`drizzle-kit migrate` exits 0 without applying anything** when it cannot prompt. Silent
  failure in CI. Migrations run through `apps/www/src/db/migrate.ts` (drizzle-orm's
  programmatic migrator). Do not restore the CLI in the CI path.
- **`apps/www/worker-configuration.d.ts` is tracked deliberately** — the only place
  `env.HYPERDRIVE` is typed, so a fresh clone must typecheck before anyone runs
  `wrangler types`. Regenerate after editing `wrangler.jsonc`; `wrangler types --check`
  asserts freshness and is what makes committed generated types trustworthy.
- **A `hyperdrive` binding requires `id`** (schema-required), and Hyperdrive validates
  connectivity before creating a config — so the binding cannot be declared, even for
  local-only dev, until the database and role exist.
- **Worker placement is `{ mode }` XOR `{ region }` XOR `{ host }`.** For one back-end in a
  known cloud region use `"placement": { "region": "aws:ca-central-1" }`, not `mode: smart`.
- **`bun run <script>` is per-workspace-member.** `build`/`check`/`db:*` live in
  `apps/www/package.json`; running them from the repo root fails with "Script not found".

## Git

- **Work happens on the `platform` branch**, tracking `origin/platform`. It is 28 commits
  ahead of `main` and shares no recent history with it: `main` (`e332e00`) is the
  pre-restart line, deliberately left alone, and no PR is open against it.
- **`git push` needs credentials supplied explicitly.** `origin` is HTTPS with **no**
  `credential.helper` configured, so a bare `git push` hangs on an interactive prompt.
  Per-invocation, nothing persisted to config:

  ```bash
  GH_TOKEN="$(gh auth token --user eric-austin)" \
    git -c credential."https://github.com".helper='!gh auth git-credential' push
  ```

## GitHub account

- **All `gh` operations in this repo use the `eric-austin` account** (personal — it can
  see the private Alpina-Intelligence repos and holds the `workflow` scope for pushing
  CI changes). The keyring also holds `eric-austin-oraq` (work); if it's the active
  account, `gh` silently sees a different world (e.g. private org repos vanish from
  listings). Two safe patterns:
  - per-invocation, no global state: `GH_TOKEN="$(gh auth token --user eric-austin)" gh …`
  - or switch globally: `gh auth switch --user eric-austin`
- Git commit identity needs nothing: `~/.gitconfig` `includeIf` already scopes
  `~/dev/` to the personal email.
