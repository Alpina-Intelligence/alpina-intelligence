# PlanetScale Postgres — the deployed database tier

Deployed counterpart to [`infra/postgres/`](../postgres/) (local + legacy box). Decisions and
their reasoning live in [ADR-0004](../../docs/adr/0004-managed-postgres.md) and
[ADR-0005](../../docs/adr/0005-deployed-data-tier.md) — this file is the runbook only.

Nothing here is automated yet. Every step below is hand-run, and the whole file is a
candidate for a `just` recipe once a justfile exists.

## The cluster

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

## Provisioning a new app database

Replace `www` with the app directory name. **Create the two roles on the platform first**
(dashboard → *Settings → Roles*, or `pscale role create alpina-intelligence main www_svc`)
so their role-ids exist for the grants:

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

### `pg_stat_statements` is deliberately NOT enabled

Insights (`pginsights`) is always on, already collecting, and strictly better on every axis
we care about: p50/p95/p99/p99.9 latency, 7 days of history, ~30 per-pattern metrics,
full-table-scan flags, per-index usage, and *individual* outlier executions (>1 s, >10k rows,
or erroring) attributed to the role that ran them. `pg_stat_statements` has **no percentiles
and no time series** — cumulative counters since reset, nothing more.

The argument that nearly justified it was per-logical-database attribution in a
one-cluster-many-databases design (`pg_stat_statements.dbid` joined to `pg_database`).
That argument is void: Insights already has **Schema**, **Table schema** and
**Qualified table** columns, all `database.schema`-qualified.

What is left is genuinely unique — raw SQL access, `pg_stat_statements_reset()` for A/B
measurement, and planning-time stats — and none of it is worth the price here: a restart is a
visible outage on a single-node cluster, and `shared_preload_libraries` plus 5000 entries is
resident memory on the 512 MiB instance ADR-0005 names as the binding constraint. Spending
the scarcest resource to get *less* than the free tool is a bad trade.

Revisit only for SQL-native alerting that the MCP server below cannot cover.

### Insights settings that stay off

- **`pginsights.raw_queries` → `false`.** Enabling it collects query text *with literals*;
  PlanetScale's own note warns this "may result in sensitive data … being sent to
  PlanetScale." Normalized patterns carry no user data, raw literals could. This is a
  privacy decision consistent with ADR-0005's residency posture, not a performance one.
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
a human can read. Auth is OAuth, so the first call prompts an interactive authorize.

**Authorizing it.** OAuth, so it cannot be provisioned from a script and an agent cannot
complete it — calling a tool with no credential returns an MCP auth error, not a browser.
Run `/mcp reauth planetscale-insights` in the TUI: omp registers as an OAuth client, starts
a loopback callback listener, and you grant scopes (choose **read-only** at the org level —
the insights-only server needs nothing more).

The credential is stored under `mcp_oauth:profile:<profile>:<url>` in the active profile's
auth storage — **never in `.mcp.json`**. Our entry is definition-only, and `/mcp reauth`
leaves the file untouched, so a committed config never picks up local auth state and each
profile signs in as its own account. No secret enters the repo.

Two consequences worth knowing:

- **The callback port is pinned to `3334`** (`oauth.callbackPort`) because omp's listener
  defaults to **3000**, which is exactly what `apps/www`'s `vite dev --port 3000` occupies.
  Left at the default, authorizing while the dev server runs would fail to bind.
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
