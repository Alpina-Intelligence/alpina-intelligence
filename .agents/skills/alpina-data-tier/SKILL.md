---
name: alpina-data-tier
description: Operational reference for alpina's data tier and secrets — PlanetScale Postgres (roles, logical DBs, pg_strict, extensions, Insights), Hyperdrive bindings, provisioning a new app's database locally and deployed, Bitwarden Secrets Manager via bwsl, credential rotation, Cloudflare Access/API-token gotchas, and the toolchain traps hit in practice (postgres:18 volumes, postgres-js URLs, drizzle-kit, wrangler types, MCP config). Load before touching infra/, wrangler.jsonc bindings, DB credentials, migrations, or .mcp.json.
---

# alpina data tier — how-tos and traps

Design lives in ADR-0004/0005 and `infra/planetscale/README.md`; this is the operator's
cheat sheet. Contracts every agent must know are in the root `AGENTS.md`.

## Topology

One PlanetScale cluster (`alpina-intelligence`, `ca-central-1`, branch `main`, port
**5432**) holds many logical databases; bought via the Cloudflare dashboard, bills on the
Cloudflare invoice. App dir name = database name at both tiers (`apps/www` → `www`).
Workers reach it through a Hyperdrive binding created `--caching-disabled`.

Local tier: Postgres 18 at `127.0.0.1:5434` (`infra/local/compose.yaml`), throwaway data,
fake creds in `.env.local`. libpq vars (`PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD`) are for
`drizzle-kit`/`psql` only — app code reads `env.HYPERDRIVE.connectionString` everywhere,
fed locally by `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` in `.envrc`.

## New app needs a DB — one touch per tier

1. **Local:** add the name to `APPS=(…)` in `infra/local/initdb/01-roles-and-dbs.sh`, then
   `docker compose down -v && up -d` (initdb runs only on first volume init).
2. **Deployed:** follow `infra/planetscale/README.md` / `provision-db.sh` — roles on the
   platform first, then `CREATE DATABASE` + `REVOKE CONNECT … FROM PUBLIC` + grants in SQL,
   then `bunx wrangler hyperdrive create <name> --connection-string="postgres://…"
   --caching-disabled` and add the binding to `apps/<name>/wrangler.jsonc`.

Credential per role × database is **one secret holding the whole URL** (never split parts):

```sh
openssl rand -hex 32                                   # alphanumeric → pastes into a URL unescaped
bwsl secret create WWW_SVC_DATABASE_URL "postgres://…" <project-id>
```

Rotation is three steps, all required: `pscale role reset` → `bws secret edit` (UUID stays
stable) → `bunx wrangler hyperdrive update <id> --connection-string=…`. **Hyperdrive holds its
own copy**; skipping step 3 breaks the Worker.

## PlanetScale traps

- Roles are created **on the platform**, logical databases in **SQL**; roles-first collapses
  all the SQL into one session.
- You *connect* as `<role-id>.<branch-id>` but reference the **bare `<role-id>`** in
  `GRANT`/`REVOKE`. Mixing them yields "role does not exist".
- Role permissions are **cluster-wide**; `REVOKE CONNECT … FROM PUBLIC` + selective
  `GRANT CONNECT` is the *entire* isolation boundary. Verify with
  `has_database_privilege`, never assume.
- `pg_strict` is per-role Query safety (*Settings → Roles → `<role>` → Edit*), not an
  Extensions item; SQL cannot set it (needs ADMIN OPTION). Invisible to
  `pg_db_role_setting` — audit by connecting as the role and reading
  `current_setting('pg_strict.…', true)`. No stock local image ships it, so an unqualified
  `db.delete(table)` succeeds locally and is refused deployed.
- Preload-gated extensions (`pg_stat_statements`, `pg_duckdb`, `timescaledb`, `pg_cron`)
  are enabled via the cluster preload list (dashboard *Clusters → Branch → Extensions* or
  `pscale branch resize --parameters pgconf.shared_preload_libraries=…`). `pscale branch
  extensions list` is catalog-only. `pgvector` is **not** gated: `CREATE EXTENSION vector`
  works as admin.
- `pg_available_extensions` is filtered by `pgextwlist` — absence ≠ unavailable. Real state:
  `pg_extension` (installed: `plpgsql`, `hypopg`, `pg_strict` per-DB).
- Query observability is **Insights**, not `pg_stat_statements` (which is preloaded by the
  platform but deliberately not `CREATE EXTENSION`-ed: Insights already gives percentiles,
  7-day history, scan flags, index usage). `raw_queries` is **off** — the database object's
  `insights_raw_queries: true` is a misreported flag; `pscale branch extensions list` shows
  the control-plane truth (`pginsights.raw_queries: off`).
- `CONNECT` on the `postgres` maintenance DB is deliberately open (`datacl` NULL) — every
  `pscale_*` role rides the implicit PUBLIC grant; a pooler fronts 5432.
- `.mcp.json` registers the **insights-only** MCP server. Never the full
  `…/mcp/planetscale`: its `planetscale_execute_write_query` runs on ephemeral credentials,
  bypassing the role split and `pg_strict`. Real SQL goes through `psql` with
  `PLANETSCALE_ADMIN_URL`.

## Bitwarden Secrets Manager

- Agent access is `bwsl` (a `~/.bashrc` wrapper): injects `BWS_ACCESS_TOKEN` from
  gnome-keyring per invocation (`secret-tool lookup service bws account alpina-dev`) — never
  exported into a session env or written to disk. Machine account scoped to SM project
  **`platform`** (`7007b64e-b136-4a7c-ab23-b4910179952f`, org
  `1e847db2-0efb-4c9d-ac5b-b3890164b6a1`).
- Free tier: unlimited secrets, **3 projects, 3 machine accounts**. Projects are the access
  boundary — group by **consumer identity**, not by app. Target split: `platform`
  (admin/bootstrap, dev only) · `ci` (only what Actions reads) · one spare (Modal). CI gets
  only `BWS_ACCESS_TOKEN` and fetches the `<db>_migrator` URL at run time.
- Cloudflare Secrets Store is write-only and Workers-only → not adopted; Bitwarden is the
  vault of record. `apps/www` has zero Worker secrets: its DB credential arrives via the
  Hyperdrive binding.
- Cloudflare Access is agent-drivable: `CLOUDFLARE_ACCESS_TOKEN` (SM secret `3f9aec0a-…`,
  scoped to Access apps/policies + orgs/IdPs) via `bwsl secret get … | jq -r .value`. Zero
  Trust org `alpina-intelligence.cloudflareaccess.com` (One-time PIN). The site sits behind
  app `www (pre-launch gate)`; un-gating is deleting that app.
- **Account API token client-IP filters must pin the /64, never a /128.** IPv6 privacy
  extensions rotate the interface id, so a full address matches nothing days later: every
  call 401s. The dashboard's "Add my IP" button inserts the current /128 — edit it down to
  the /64. Bit `CLOUDFLARE_ACCESS_TOKEN` on 2026-09-12; fix was
  `2604:3d09:1a8b:2700::/64`.
- **`CLOUDFLARE_ACCESS_TOKEN` is an *account-owned* token (`cfat_` prefix, created under
  Account API Tokens) — it is a service principal, not a user credential.** User-level
  endpoints (`/user/tokens/verify`, `/user/tokens/{id}`) reject it with
  `Invalid API Token` / `Valid user-level authentication not found`, which reads exactly
  like a dead token. Verify and manage it at `/accounts/{account_id}/tokens/verify` and
  `/accounts/{account_id}/tokens/{id}` instead. Tunnel visibility needs the account
  permission **Connectivity Directory: Read** (Cloudflare Tunnel's permission group was
  renamed); token *edits* never regenerate the secret — only Roll (or delete + recreate)
  does.

## Toolchain traps

- **`postgres:18` image:** data lives in major-version subdirs; the entrypoint refuses a
  volume mounted at `/var/lib/postgresql/data`. Mount `/var/lib/postgresql`. Local tracks
  the deployed major (18.x).
- **postgres-js cannot read libpq URLs:** unknown query params become runtime `SET`s, so
  `?sslrootcert=system` → `42704 unrecognized configuration parameter`. Bitwarden keeps the
  libpq-correct form (so `psql` verifies by default); `pgDriverConfig()` in
  `apps/www/src/db/env.ts` lifts them into `ssl: 'verify-full'`. Hyperdrive strings carry
  no SSL params, so Workers are unaffected.
- **Per-request DB client** with `max: 5`, `fetch_types: false`, `prepare: true` — a
  module-scope `postgres()` singleton is a workerd footgun (`apps/www/src/db/index.ts`
  explains).
- **`drizzle-kit migrate` exits 0 without applying** when it cannot prompt. Migrations run
  through `apps/www/src/db/migrate.ts` (enforced by `.agents/rules/ci-no-drizzle-kit-migrate.md`).
- **`apps/www/worker-configuration.d.ts` is tracked deliberately** — the only place
  `env.HYPERDRIVE` is typed. Regenerate after editing `wrangler.jsonc`; `wrangler types
  --check` asserts freshness.
- **A `hyperdrive` binding requires `id`**, and Hyperdrive validates connectivity on create
  — the binding cannot exist until the database and role do.
- **Worker placement is `{ mode }` XOR `{ region }` XOR `{ host }`.** One back-end in a
  known region → `"placement": { "region": "aws:ca-central-1" }`, not `mode: smart`.
- **Remote MCP servers in `.mcp.json` need `"type": "http"`** — omitted defaults to stdio,
  and `/mcp reauth` refuses. The bundled `mcp-schema.json` wrongly rejects `oauth`/`auth`/
  `timeout`/`enabled` on http servers; omp doesn't enforce it. Don't delete
  `planetscale-insights.oauth.callbackPort` to silence an editor — it is deliberate.
- **Deprecated dirs still under `infra/`:** `cloudflared/`, `host/`, `postgres/`,
  `sm-operator/` are the pre-ADR-0003/0004 VPS path. Do not extend them.
