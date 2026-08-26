# PlanetScale Postgres — the deployed database tier

Deployed counterpart to [`infra/postgres/`](../postgres/) (local + legacy box). Decisions and
their reasoning live in [ADR-0004](../../docs/adr/0004-managed-postgres.md) and
[ADR-0005](../../docs/adr/0005-deployed-data-tier.md) — this file is the runbook only.

**This is a transplantable procedure, not just notes on our cluster.** The section below
builds a Cloudflare-billed PlanetScale Postgres tier from nothing; everything after it is
reference for the cluster we already run. Two steps genuinely require a browser; the rest
is scripted.

## Zero to running

### What is scriptable and what is not

| Step | How |
| --- | --- |
| Mint the first service token | **browser** (or one interactive `pscale auth login`) |
| Create the Cloudflare-billed database | `wrangler` + `pscale` |
| Database settings (residency, deletion, raw queries) | `PATCH` API |
| Roles + permissions + **`pg_strict`** | `POST` API — [`provision-db.sh`](provision-db.sh) |
| Logical database, `REVOKE CONNECT`, grants | `psql` — same script |
| Hyperdrive config + binding | `wrangler` |
| `pg_strict` on an **already-created** role | **browser** — no documented `PATCH` |

Only those two rows need a human in a browser. Everything else is a command, which is what
makes this repeatable for a new client or a new app.

### 0. Prerequisites

```bash
brew install pscale                      # or .deb/.rpm from github.com/planetscale/cli
pscale auth login                        # one time, browser — only to mint the token below
pscale service-token create              # note the ID and secret; the secret is shown once
```

The token needs org `create_databases` plus, on the database, `write_database`,
`create_branch`, `read_branch`, `create_production_branch_password` and
`delete_branch_password`. Then, for every command that follows:

```bash
export PLANETSCALE_SERVICE_TOKEN_ID=…    # never in a shell that logs history
export PLANETSCALE_SERVICE_TOKEN=…
export PLANETSCALE_ORG=<org>
```

### 1. Create the cluster, billed to Cloudflare

The signature is what attaches billing to the Cloudflare account; the database itself is
created through PlanetScale. Requires `pscale` ≥ 0.313.0, and the `wrangler` subcommand is
flagged experimental.

```bash
bunx wrangler hyperdrive planetscale signature \
  | pscale database create <cluster> --org "$PLANETSCALE_ORG" \
      --engine postgresql --region <region-slug> --major-version 18 \
      --cloudflare-billing @- --format json
```

Discover valid values rather than hard-coding them — SKUs and regions change:
`GET /v1/organizations/{org}/cluster-size-skus` and `list_regions_for_organization`.
Region is **immutable after creation**; choose deliberately (ADR-0005 §4).

### 2. Lock the cluster down before it holds anything

One `PATCH` covers all three. Do it now: the first two are cheap here and expensive later,
and the third is a privacy setting you do not want to discover is on.

```bash
curl -sS -X PATCH \
  "https://api.planetscale.com/v1/organizations/$PLANETSCALE_ORG/databases/<cluster>" \
  -H "Authorization: ${PLANETSCALE_SERVICE_TOKEN_ID}:${PLANETSCALE_SERVICE_TOKEN}" \
  -H 'Content-Type: application/json' \
  --data '{"restrict_branch_region":true,"deletion_protected":true,"insights_raw_queries":false}'
```

- `restrict_branch_region` pins new branches to the default branch's region. Branch regions
  are fixed at creation, so without this one wrong click is permanent.
- `deletion_protected` on the database. The `pscale` CLI has **no** `--deletion-protected`
  flag for databases — only for branches — so this is API-only.
- `insights_raw_queries` false keeps query *literals* off PlanetScale's pipeline.

### 3. Per app: one logical database and two roles

```bash
export PLANETSCALE_CLUSTER=<cluster>
export PLANETSCALE_ADMIN_URL="postgresql://postgres.<branch-id>:…@<host>:5432/postgres?sslmode=verify-full&sslrootcert=system"

./provision-db.sh <app> --bws-project <bitwarden-project-uuid>
```

That creates both roles with query safety set **at creation** (the only programmatic path —
see *Extensions and query safety*), creates the logical database, revokes `CONNECT` from
`PUBLIC`, applies the grants, asserts the privilege boundary, and stores both connection
URLs in Bitwarden. Re-runnable for the database and grants; role creation is not idempotent,
so a second run mints new roles.

### 4. Hyperdrive

See [Hyperdrive](#hyperdrive) below — `wrangler hyperdrive create … --caching-disabled`,
then the binding, then `wrangler types`.

## Reference: the cluster we run

| | |
| --- | --- |
| Organization | `eric-james-austin` |
| Cluster | `alpina-intelligence` |
| Branch | `main` |
| Host | `aws-ca-central-1-1.pg.psdb.cloud` **port 5432** |
| SKU | PS-5, single node, arm64, Amazon EBS |
| Engine | PostgreSQL 18.6 |
| Bought via | **Cloudflare dashboard** — billed on the Cloudflare invoice (ADR-0005) |

Region is **immutable**. Placement rationale and the residency limits are in ADR-0005 §4.

One cluster holds many logical databases, one per app, named after the app directory.

## Two rules that cause most of the confusion

**Usernames carry a branch suffix.** PlanetScale routes on the username, so you *connect* as
`<role-id>.<branch-id>` but reference the bare `<role-id>` inside SQL (`GRANT`, `REVOKE`,
`ALTER ROLE`). Mixing them up produces "role does not exist".

**Roles are created outside the database, logical databases inside it.** Roles come from the
dashboard / `pscale role` / the API. `CREATE DATABASE` and every `GRANT`/`REVOKE` is SQL. You
can create the roles first and then do all the SQL in one session — that is the recommended
order.

## Connecting as the bootstrap role

The default role is near-superuser (`CREATEDB CREATEROLE REPLICATION BYPASSRLS`, but
`NOSUPERUSER`). It exists to run the DDL below and for nothing else — it never reaches an
app, CI, or Hyperdrive.

```bash
bwsl() { BWS_ACCESS_TOKEN="$(secret-tool lookup service bws account alpina-dev)" bws "$@"; }
psql "$(bwsl secret get <PLANETSCALE_ADMIN_URL-id> | jq -r .value)"
```

`bwsl` is the `~/.bashrc` wrapper (AGENTS.md); it is a shell *function*, so non-interactive
shells must redefine it as above. Prefer passing the URL through an environment variable or
`PG*` vars over putting it in `argv`, which exposes it in the process table.

One admin URL covers the whole cluster — libpq lets later options win, so
`psql "$ADMIN_URL" -d www` reaches another logical database without a second secret.

## Provisioning a new app database, by hand

> [`provision-db.sh`](provision-db.sh) does all of this. Keep this section as the
> explanation of *what* it does and the path to follow when something fails midway — but
> change the script when the procedure changes, or the two will drift.

Replace `www` with the app directory name. **Create the two roles first** so their role-ids
exist for the grants — dashboard (*Settings → Roles*), `pscale role create <cluster> main
www_svc --inherited-roles pg_read_all_data,pg_write_all_data`, or the create_role API. Note
the CLI cannot set query safety; only the API and the dashboard can:

| Role | Checkboxes | `pg_strict` | Destination |
| --- | --- | --- | --- |
| `www_svc` | `pg_read_all_data`, `pg_write_all_data` | `on` / `on` | Hyperdrive |
| `www_migrator` | `pg_read_all_data`, `pg_write_all_data` | `warn` / `warn` | CI |

Never check `postgres` on either. Capture each password into Bitwarden as it is shown — it is
shown once.

Then, connected to `postgres` as the bootstrap role:

```sql
CREATE DATABASE www;

-- PUBLIC means every existing AND future role; new databases are world-connectable.
-- This REVOKE is the entire isolation boundary between logical databases.
REVOKE CONNECT ON DATABASE www      FROM PUBLIC;
REVOKE CONNECT ON DATABASE postgres FROM PUBLIC;
GRANT  CONNECT ON DATABASE postgres TO postgres;

GRANT CONNECT ON DATABASE www TO <www_svc-role-id>;
GRANT CONNECT ON DATABASE www TO <www_migrator-role-id>;
GRANT CREATE  ON DATABASE www TO <www_migrator-role-id>;   -- migrator only
```

Then **reconnect to `www`** — `public` schema grants are per-database and do not apply from
the `postgres` session:

```sql
GRANT CREATE ON SCHEMA public TO <www_migrator-role-id>;
```

`www_svc` needs no schema grant: `pg_read_all_data` / `pg_write_all_data` already confer
implicit `USAGE` on all schemas, and cover tables the migrator creates later without any
`ALTER DEFAULT PRIVILEGES`.

### Verify the boundary rather than assuming it

```sql
SELECT has_database_privilege('<www_svc-role-id>', 'www',      'CONNECT') AS svc_www,       -- t
       has_database_privilege('<www_svc-role-id>', 'postgres', 'CONNECT') AS svc_postgres;  -- f
```

## Hyperdrive

Create the configuration with **wrangler**, not the dashboard: the dashboard mints its own
role and cannot express `--caching-disabled` (ADR-0005 §6).

```bash
npx wrangler hyperdrive create www \
  --connection-string="postgres://<www_svc-role-id>.<branch-id>:<pw>@aws-ca-central-1-1.pg.psdb.cloud:5432/www" \
  --caching-disabled
```

Add the returned id to `apps/www/wrangler.jsonc`, alongside the placement hint that puts the
Worker next to the database:

```jsonc
{
  "placement": { "region": "aws:ca-central-1" },
  "hyperdrive": [{ "binding": "HYPERDRIVE", "id": "<config-id>" }]
}
```

One configuration per logical database — plus a second, cached one only if a specific read
path is proven to tolerate up to 75 s of staleness. Auth, sessions and permissions always use
the cache-disabled binding.

## Rotating a credential

Three steps. **Skipping step 3 breaks the Worker silently** — Hyperdrive holds its own copy
and there is no re-read window.

```bash
pscale role reset --org eric-james-austin alpina-intelligence main <role-id>
bws secret edit <secret-uuid> --value "postgres://…"      # UUID stays stable
npx wrangler hyperdrive update <config-id> --connection-string="postgres://…"
```

CI needs no equivalent step: it holds only `BWS_ACCESS_TOKEN` and fetches the migrator URL at
run time, so Bitwarden is its only durable copy.

## Secrets layout

One secret per (role × database), holding the **whole URL** — see ADR-0005 §5 for why parts
are a bad idea.

```
PLANETSCALE_ADMIN_URL          bootstrap only, never an app
WWW_SVC_DATABASE_URL           → Hyperdrive
WWW_MIGRATOR_DATABASE_URL      → CI
```

Mint application passwords alphanumeric — `openssl rand -hex 32` — so they are safe to paste
into a URL unescaped. Include `?sslmode=verify-full&sslrootcert=system` for direct clients
(`psql`, MLflow's psycopg2); Hyperdrive manages origin TLS itself.

## Extensions and query safety

Two different mechanisms, often confused:

**`pg_strict` is not an Extensions-tab item.** PlanetScale installs it always and it cannot
be disabled; what you configure is **per role**, at *Settings → Roles → `<role>` →
**Query safety** → Edit*. It is editable on existing roles, so enabling it never requires
recreating a role (which would churn the role-id baked into Bitwarden and Hyperdrive).

SQL cannot set it here. `ALTER ROLE … SET pg_strict.*` fails without `ADMIN OPTION` on a
control-plane role, and `ALTER DATABASE … SET pg_strict.*` fails because it is a
superuser-only parameter and the Default role is `NOSUPERUSER` — PlanetScale's own docs
show a SQL path that assumes privileges they don't grant.

**It is invisible to the catalog.** `pg_db_role_setting` is empty even while the guard is
active. Audit by connecting as the role:

```sql
SELECT current_setting('pg_strict.require_where_on_update', true) AS upd,
       current_setting('pg_strict.require_where_on_delete', true) AS del;
```

Target is `on`/`on` for `<db>_svc` and `warn`/`warn` for `<db>_migrator`. Changes bind only
to connections opened afterwards. For a deliberate unqualified write:

```sql
BEGIN; SET LOCAL pg_strict.require_where_on_delete = 'off';
DELETE FROM staging_import; COMMIT;
```

**Restart-gated extensions** live on the other page: *Clusters → `Branch` dropdown →
**Extensions** tab → enable → Queue extension changes → Apply changes*. Anything marked
"Restart required" (`pg_stat_statements`, `pg_cron`, `pg_duckdb`, `timescaledb`,
`pg_partman_bgw`, `pg_squeeze`, `pg_hint_plan`) can **only** be enabled there, never with
`CREATE EXTENSION`. `pgvector` and `pgvectorscale` need no restart.

`pg_duckdb` and `timescaledb` stay off deliberately — they would move analytical compute
onto the smallest, least elastic, most expensive-per-vCPU box in the stack and blur the
boundary ADR-0006 exists to draw.

### `pg_stat_statements` is not installed — but the cost argument is void

Insights (`pginsights`) is always on and better on every axis we care about: p50/p95/p99/p99.9
latency, 7 days of history, ~30 per-pattern metrics, full-table-scan flags, per-index usage,
and *individual* outlier executions (>1 s, >10k rows, or erroring) attributed to the role that
ran them. `pg_stat_statements` has **no percentiles and no time series** — cumulative counters
since reset, nothing more. Per-logical-database attribution, once the strongest argument for
it, is already covered: Insights carries **Schema**, **Table schema** and **Qualified table**,
all `database.schema`-qualified, and results cleanly separate `postgres.public` from
`www.public`.

**Correction (2026-08-25).** The original rejection also argued it would cost a restart and
resident memory on a 512 MiB instance. That is no longer true, and probably never was:

```
SHOW shared_preload_libraries;  -- pg_stat_statements,pg_strict
SELECT installed_version FROM pg_available_extensions WHERE name='pg_stat_statements';  -- (empty)
```

PlanetScale **preloads it** — almost certainly because Insights is built on it — with the
documented defaults already live (`max=5000`, `track=top`, `save=on`, `track_planning=off`,
`track_utility=on`). The library and its 5000 entries are resident whether we use them or not,
and the platform reads shared memory directly rather than through the SQL view. So
`CREATE EXTENSION pg_stat_statements` in `postgres` would cost **no restart and no extra
memory** — it only exposes a view over memory already allocated.

The conclusion stands but on narrower grounds: not "too expensive," just **not needed**, since
Insights answers the same questions with more detail. Enable it for free the moment a
SQL-native need appears — joins against our own tables, a cron poller, `reset()` for A/B
measurement, or planning-time stats.

Related: `pg_strict` needed that preload too, and the platform restarted the node
automatically (2026-08-25 22:54 UTC) when the per-role Query safety setting was applied. The
original instinct that a preload was required was right; the wrong part was assuming a human
had to arrange it.

### Insights settings

- **`raw_queries` — two controls, and they disagree.** The branch-scoped extension parameter
  (*Clusters → Branch → Extensions → pginsights*, the one the docs name, default `false`)
  reads **off** in the dashboard. The database object returned by `planetscale_list_databases`
  reports `insights_raw_queries: **true**`. Which governs is **unresolved**: there is no
  `pginsights.raw_queries` GUC in the database (`pg_settings` exposes only
  `pginsights.tag_value_max_bytes`), so SQL cannot adjudicate it. Aggregate Insights output is
  normalized either way (`… where name like $1`); raw text would only appear on the
  notable-query detail path. Confirm with support before the first real user row lands —
  PlanetScale warns raw collection "may result in sensitive data … being sent to PlanetScale,"
  which matters under ADR-0005's residency posture. A privacy question, not a performance one.
- **`pginsights.normalize_schema_names` → `false`.** It exists for schema-per-tenant designs.
  We are database-per-app, so normalizing would collapse the distinction we want visible.
- **`track_io_timing` → off.** Required for the `% of I/O` and `I/O time` columns, but the
  docs warn it "may impact query performance." Not worth it on 1/16 vCPU until there is an
  actual I/O question.

### MCP access to Insights

`.mcp.json` registers the **insights-only** server:

```
https://mcp.pscale.dev/mcp/planetscale-insights-only
```

Not the full `…/mcp/planetscale`. The full server ships
`planetscale_execute_read_query` **and `planetscale_execute_write_query`**, whose queries run
on *"short-lived, ephemeral credentials created on demand"* — i.e. **not** as `<db>_svc`, so
they would bypass the entire least-privilege split *and* `pg_strict`. PlanetScale itself
advises "caution when giving LLMs write access to any production database." The insights-only
server excludes both tools; real SQL goes through `psql` with the admin URL, under a command
a human can read.

**Authorizing it.** OAuth, so it cannot be provisioned from a script and an agent cannot
complete it — calling a tool with no credential returns an MCP auth error, not a browser.
Run `/mcp reauth planetscale-insights` in the TUI: omp registers as an OAuth client, starts
a loopback callback listener, and you grant scopes (choose **read-only** at the org level —
the insights-only server needs nothing more).

The credential is stored under `mcp_oauth:profile:<profile>:<url>` in the active profile's
auth storage — **never in `.mcp.json`**. Our entry is definition-only, and `/mcp reauth`
leaves the file untouched, so a committed config never picks up local auth state and each
profile signs in as its own account. No secret enters the repo.

Three consequences worth knowing:

- **The entry needs `"type": "http"` explicitly.** Omit it and `type` defaults to `stdio`;
  the server still connects, but `/mcp reauth` refuses — *"stdio servers manage their own
  credentials, so OMP has no OAuth to reauthorize."*
- **The callback port is pinned to `3334`** (`oauth.callbackPort`) because omp's listener
  defaults to **3000**, which is exactly what `apps/www`'s `vite dev --port 3000` occupies.
  Left at the default, authorizing while the dev server runs would fail to bind. Note the
  bundled `mcp-schema.json` wrongly rejects `oauth` (and `timeout`/`enabled`/`auth`) on http
  servers — an `allOf` + `additionalProperties: false` bug, not a real constraint. Keep it.
- **Subagents cannot authorize.** Headless mode has no `/mcp` UX, so a scout that hits this
  server before the parent profile is authorized just gets a per-server error. Authorize once
  interactively; the binding is per *profile*, not per project, so any checkout defining the
  same URL reuses it.

## Watch-outs

- **10 GB egress** is included on PS-5; every tier above includes 100 GB. A couple of
  `pg_dump`s plus Hyperdrive plus Modal traffic can brush it.
- **512 MiB RAM** is the binding constraint, not price. `mlflow db upgrade` against this
  engine is unverified — test it before depending on it.
- **PS-10 costs $13 here vs $10 in us-west-2/us-east-1.** The Canada premium lands at exactly
  the resize we expect.
- **Billed daily whether or not you query it.** PlanetScale does not scale to zero.
- **Deleting a role that owns objects fails** without a successor:
  `pscale role delete … --successor postgres`. Tables created by `<db>_migrator` are owned by it.
