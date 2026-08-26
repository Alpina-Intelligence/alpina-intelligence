# ADR-0005: Deployed data tier — Cloudflare-billed PlanetScale, one cluster many databases, Canada-first placement

- **Status:** Accepted, 2026-08-23 (cluster `alpina-intelligence` live same day)
- **Depends on:** ADR-0001, ADR-0002, ADR-0003, ADR-0004.
- **Amends ADR-0004:** its provisioning recipe assumed **one PlanetScale database per app**;
  the unit is now one *cluster* holding many *logical databases*. Its
  `app dir name = database name = role prefix` contract survives only in part — see
  *Naming* below.
- **Supersedes** the unwritten intent to migrate app secrets from Bitwarden to Cloudflare
  Secrets Store, and revises `docs/architecture.md` §7 accordingly.
- **Resolves** ADR-0004's *"Deliberately unresolved: who bills the PlanetScale instance."*

## Context

Four things were learned actually building what ADR-0004 specified.

**1. Cloudflare now sells PlanetScale directly.** Shipped 2026-06-18
([changelog](https://developers.cloudflare.com/changelog/post/2026-06-18-planetscale-databases-cloudflare-billing/),
[docs](https://developers.cloudflare.com/hyperdrive/planetscale/)). Creating the database
from the Cloudflare dashboard bills it as a line item on the Cloudflare invoice, at
*"the same PlanetScale pricing as when you buy directly from PlanetScale"* — no markup —
and wires the Hyperdrive configuration automatically. ADR-0004 recorded this as unverified
because Hyperdrive's docs then carried only generic Postgres guides.

**2. A cluster is not a database.** PlanetScale's guidance is explicit —
*"clusters start at $5/month, but this doesn't mean you have to create a new one for every
new app idea"* ([one-cluster-many-apps](https://planetscale.com/blog/one-postgres-cluster-many-apps)).
Logical databases are created with `CREATE DATABASE` **inside** the cluster; roles are
created **outside** it on the platform. ADR-0004's "create the PlanetScale database (same
derived name)" read as one $5 cluster per app.

**3. Placement is immutable, and the operator is in Canada.** A PlanetScale cluster's
region cannot be changed after creation. The default `ca-central-1` was initially inherited
from a form, then adopted deliberately as a Canada-first pattern.

**4. Cloudflare's secret stores are unreachable from a second compute vendor.** Secrets
Store: *"Once a secret is added to the Secrets Store, it can no longer be decrypted or
accessed via API or on the dashboard. Only the service associated with a given secret will
be able to access it."* Per-Worker secrets are likewise write-only. Both are compatible
only with Workers and AI Gateway. Since the transform tier runs on Modal (ADR-0006, pending),
a Cloudflare-only store structurally cannot be the source of truth.

## Decision

**1. Buy PlanetScale through Cloudflare.** One invoice, no markup, Hyperdrive auto-wired.
Support still routes to PlanetScale, and per-database usage is still introspected in the
PlanetScale dashboard.

**2. One cluster, many logical databases.** Cluster `alpina-intelligence`
(org `eric-james-austin`, branch `main`, PS-5 single-node arm64/EBS, PostgreSQL 18.6,
`aws-ca-central-1-1.pg.psdb.cloud:5432`). Each app gets a logical database named after its
app directory; `www` is the first.

This makes the deployed topology **identical to local** — one server, N databases, one
service role each, `REVOKE CONNECT … FROM PUBLIC` — which is what makes
`infra/postgres/provision-db.sh`'s isolation logic the shared shape rather than a local
quirk. It also closes the gap the previous stack had, where every app connected as the
`alpina` superuser (`docs/reference/README.md`).

**Isolation is `CONNECT`, not the data grants.** `pg_read_all_data` / `pg_write_all_data`
are cluster-wide predefined roles; they cannot be scoped to one logical database. A role
holding them can read any database it can *connect* to. The boundary is therefore
`REVOKE CONNECT ON DATABASE <db> FROM PUBLIC` plus selective `GRANT CONNECT`, and nothing
else. Verified on the fresh cluster: every database shipped with public `CONNECT` = true.

**3. Three roles per database, split by consumer.**

| Role | Grants | `pg_strict` | Held by |
| --- | --- | --- | --- |
| default (`postgres`) | `CREATEDB CREATEROLE REPLICATION BYPASSRLS`, `NOSUPERUSER` | — | Bitwarden only; bootstrap DDL by hand |
| `<db>_svc` | `pg_read_all_data`, `pg_write_all_data`, `CONNECT` | `on` / `on` | Hyperdrive |
| `<db>_migrator` | the above **plus** `CREATE ON DATABASE`, `CREATE ON SCHEMA public` | `warn` / `warn` | CI only |

The split is not ceremony. ADR-0004 already requires migrations to run from CI, so there
are two consumers; and **Hyperdrive stores its own copy** of the credential it is given,
making it the hardest to rotate. The hardest-to-rotate credential must therefore be the
least privileged — if `<db>_svc` leaks, rows are exposed but the schema cannot be dropped.
`pg_strict` (`require_where_on_update` / `require_where_on_delete`) is intended to block
unqualified `UPDATE`/`DELETE` at parse time for the runtime role, with the migrator only
warning, because backfills are legitimately unqualified.

`pg_strict` is **dashboard-only**, and that constrains how it is operated. PlanetScale
documents `ALTER ROLE …` / `ALTER DATABASE … SET pg_strict.*`, but both are refused with
our Default role: `ALTER ROLE` needs `ADMIN OPTION` on a control-plane-created role, and
`pg_strict.*` is a superuser-only parameter while the Default role is `NOSUPERUSER`. Their
documented SQL path assumes a superuser they do not grant. It **is** editable on an existing
role — *Settings → Roles → `<role>` → **Query safety** → Edit* — so no role recreation is
needed, which matters because role-ids are baked into Bitwarden *and* Hyperdrive's own copy.

**It is not auditable from the catalog.** `pg_db_role_setting` stays empty even when the
guard is active; PlanetScale applies it outside standard Postgres role settings. The only
checks are `current_setting('pg_strict.require_where_on_delete', true)` on a live connection
as that role, or the dashboard. Any drift check must connect, not query the catalog.

> **Verified 2026-08-25 on `www`:** as `www_svc`, `DELETE FROM posts` and
> `UPDATE posts SET …` are both refused (*"blocked by pg_strict"*), while the same
> statements with a `WHERE` succeed, and the documented escape hatch
> (`BEGIN; SET LOCAL pg_strict.require_where_on_delete='off'; …; COMMIT`) works.
> `www_migrator` is currently `off`/`off` rather than the intended `warn`/`warn` — an
> unqualified delete succeeds there silently. Flip it to `warn` so backfills are logged.
> Settings apply only to connections opened after the change, so a warm Hyperdrive pool
> can lag briefly.

`<db>_svc` needs exactly one grant — `CONNECT`. Postgres' predefined roles already confer
*"USAGE rights on all schemas, even without having it explicitly,"* so no schema grants and
no `ALTER DEFAULT PRIVILEGES` are required for tables the migrator creates later.

**4. Canada-first placement, with the residency limit stated.**

| Component | Setting | Canadian? |
| --- | --- | --- |
| PlanetScale | `ca-central-1` (Montreal) | **yes** — real AWS region |
| Worker | `placement.region = "aws:ca-central-1"` | runs in the CF datacentre nearest Montreal |
| R2 (the lake) | location hint `enam` | **no** — best-effort hint, may sit in the US |
| Modal | default (`us-east` control plane) | **no** — deliberately not pinned |

**R2 is the hard blocker.** Location hints are `wnam`/`enam`/`weur`/`eeur`/`apac`/`oc` and
are *"a best effort and not a guarantee."* Jurisdictional Restrictions — the ones that do
guarantee residency — are `eu`, `fedramp`, `us`. There is **no Canadian jurisdiction**, and
the only North American one guarantees the opposite.

Therefore: *"our transactional database is in Canada"* is defensible. *"all your data stays
in Canada"* **is not**, and must not be claimed until R2 offers a `ca` jurisdiction.

**Modal is not pinned**, though `region="ca"` (broad, 1.5× multiplier) and
`routing_region="ca-central"` both exist. Montreal↔Virginia is ~15–20 ms, fine for a
nightly batch job, and the multiplier would buy a residency guarantee that R2 already
prevents claiming. Revisit only if Canadian residency becomes contractual — at which point
R2 is the blocker to solve first.

**5. Bitwarden remains the vault of record.** Cloudflare and Modal are leaf *distribution
targets*, not vaults. One secret per (role × database), holding the **whole connection
URL** — not split into host/port/user/password parts.

The reason is atomicity, not confidentiality. A connection string is a unit of validity,
and on PlanetScale unusually so: the username embeds the branch id
(`<role-id>.<branch-id>`), so resetting a role changes username and password together.
Splitting invites a rotation that updates three of five fields — the drift generator
`architecture.md` §7 already condemns. Every consumer wants a URL anyway (`wrangler
hyperdrive create --connection-string`, `MLFLOW_TRACKING_URI`, Drizzle, `psql`), so
splitting would only add string assembly, which is where escaping bugs live.

Host, port, database and username are **internal, not secret**. They are bundled because no
consumer needs a part without the whole, not because they are sensitive.

Consumers that can fetch (CI, Modal) hold only a bootstrap `BWS_ACCESS_TOKEN` and read at
run time — one durable copy of a token, not of database credentials. **Hyperdrive cannot
fetch**, so it is the sole holder of a real duplicate and the only entry in the rotation
runbook.

Local development splits by consumer, not by tier: the **app** reads
`env.HYPERDRIVE.connectionString` in both places (see 7), while **drizzle-kit and `psql`**
keep discrete libpq vars against `127.0.0.1:5434` with throwaway credentials. There is no
secret to protect locally, so tooling optimises for ergonomics; deployed there is, so it
optimises for atomicity.

**6. Hyperdrive query caching is disabled by default.** It is *on* by default, with
`max_age` 60 s and `stale_while_revalidate` 15 s — up to 75 s of stale reads — and
*"Hyperdrive does not purge or invalidate cached read query results when your application
writes."* Cloudflare names the hazard directly: with an ORM owning the SQL, use separate
cached and cache-disabled bindings. Drizzle owns our SQL, and caching is worth ~nothing at
pre-launch traffic, so the default is `--caching-disabled`. Connection pooling and the
p90 4 ms connection setup — the actual reason Hyperdrive exists — are unaffected.

A second, cached configuration may be added later for a specific read path that tolerates
staleness. Auth, sessions and permissions must always use the cache-disabled binding.

**7. The client is built per request, and local dev exercises the same code path.**
Cloudflare's instruction is explicit — *"Hyperdrive maintains the underlying database
connection pool, so creating a new client on each request is fast and recommended"* — with
three options that are not stylistic: `max: 5` (Workers' concurrent-connection limit),
`fetch_types: false` (drops a round-trip; we use no array types), and `prepare: true`
(*"Hyperdrive will not cache prepared statements when this option is set to false and will
require additional round-trips"*). A module-scope `postgres()` singleton is the anti-pattern.

Because `apps/www` already runs its SSR environment under workerd in dev
(`cloudflare({ viteEnvironment: { name: "ssr" } })`), the binding resolves under
`bun run dev` as well, so there is **no tier branching in app code at all**. The local
connection string arrives via `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`
(exported from `.envrc`, sourced from `infra/local/.env.local`) — never
`localConnectionString` in `wrangler.jsonc`, which is committed. Two divergences remain and
are accepted: local connects direct, so there is no connection pooling, and no query
caching — the latter already matches production per 6. `wrangler dev --remote` covers the
true pooled path when it matters.

*Sequencing:* a `hyperdrive` binding requires `id` (schema-required), and Hyperdrive
validates connectivity before creating a configuration, so the binding cannot be declared —
even for local-only use — until the PlanetScale database and role exist.

**Driver deviation, accepted.** Cloudflare now names node-postgres (`pg`) the *recommended*
driver and postgres-js merely *supported*, on the grounds that `pg` has *"the best
compatibility with Hyperdrive's caching."* We disable caching (6), so the stated advantage
does not apply, and `postgres@3.4.9` clears the documented 3.4.5 Hyperdrive minimum.
Revisit if a cached binding is ever added.

## Consequences

- **Cost:** $5/mo, billed daily by Cloudflare *"whether or not you execute queries or store
  data"* — PlanetScale does not scale to zero. PS-5 includes 10 GiB disk and **10 GB egress**;
  every tier above includes 100 GB. That 10× egress cliff is the likeliest surprise.
- **Canada carries a price premium above the entry tier.** PS-5 is $5 in every region, but
  PS-10-ARM is **$13 in `ca-central-1` vs $10 in `us-west-2`/`us-east-1`** — +30% at exactly
  the resize we expect. Accepted as the cost of the placement decision.
- **Naming, amended.** `app dir name = database name` holds at both tiers. `= role prefix`
  is **local-only**: PlanetScale's dashboard role name is cosmetic, and the in-database
  identity is a generated `<role-id>`. Raw `CREATE ROLE` would preserve the literal name but
  such roles *"will not display on your database settings"* and forfeit
  `pscale role reset`/`reassign`/`delete --successor`. Managed roles win; the contract is
  amended instead.
- **Rotation fan-out is three steps, and step three fails silently:** `pscale role reset` →
  `bws secret edit` (UUID stable) → `wrangler hyperdrive update --connection-string`. There
  is no re-read window the way sm-operator had.
- **`apps/www` needs no Worker secrets at all.** Its database credential reaches it only via
  the Hyperdrive binding, so `wrangler secret list --name www` is correctly empty and
  Cloudflare Secrets Store is not adopted. Secrets Store's beta limits (1 store/account,
  100 secrets, **1024 bytes each**, `workers`/`ai-gateway` scopes only, production secrets
  unreadable in local dev) buy nothing while there is one Worker.
- **Modal's residency leak is avoidable by design, not structural.** Modal defines inputs and
  outputs as *"function arguments"* and *"function return values"*; payloads over 2 MiB are
  stored in object storage in `us-east` with a 7-day TTL. A container's own I/O — boto3 to
  R2, psycopg2 to Postgres — is data plane and never enters that path. Under the
  return-cursors-not-data rule the control plane stays empty, and a no-arg scheduled function
  returning nothing stores nothing at all.
- **Two Modal choices follow from the same page:** use **Volumes v2** (v1 is out of scope of
  Modal's HIPAA BAA; v2 is compliant), and prefer the `Server` primitive over a Web Function
  if endpoint payloads ever need zero retention (Web Function requests/responses are retained
  as inputs/outputs for 7 days; `Server` and Auto Endpoints are *"not stored"*).
- **Workers Free is the current binding constraint.** Hyperdrive on the Free plan caps at
  **100,000 database queries/day**, counting every statement including DDL; it is unlimited
  and free on Workers Paid. Modal's direct psycopg2 path is unaffected.

## Deliberately unresolved

- **An R2 Canadian jurisdiction.** The single feature gap between the current posture and a
  defensible end-to-end Canadian-residency claim. Recheck before making any such claim.
- **512 MiB headroom.** MLflow's schema plus Alembic plus app tables on PS-5 is untested, and
  `mlflow db upgrade` against PlanetScale's Neki engine remains unverified — Alembic needs
  `CREATE`/`ALTER` on schema `public`. Test early; the resize trigger is evidence, not guesswork.
- **Whether Cloudflare credits apply to PlanetScale.** Claimed in Cloudflare's
  [launch blog](https://blog.cloudflare.com/deploy-planetscale-postgres-with-workers/) but
  **absent from the docs and changelog**. Treat as unverified.

  **Cloudflare *billing* is confirmed, though** (2026-08-25, primary source): the PlanetScale
  API reports `cloudflare_billed: true` and a `cloudflare_uid` matching this account's
  Cloudflare account id, alongside `region: AWS ca-central-1 (Montreal)` and
  `insights_enabled: true`. Decision 1 and the placement decision are therefore verified
  against the platform, not just the marketing page. Credits remain the only unverified half.
- **The stored URL is libpq-shaped, and postgres-js cannot read it.** postgres-js parses
  URLs itself and forwards unknown query params as Postgres *runtime* parameters, so
  `?sslrootcert=system` becomes `SET sslrootcert` → `42704 unrecognized configuration
  parameter`. The canonical Bitwarden value stays libpq-correct (so `psql` verifies by
  default); `pgDriverConfig()` in `apps/www/src/db/env.ts` lifts those params into the
  driver's own `ssl: 'verify-full'`. The Worker is unaffected — the string Hyperdrive hands
  it carries no SSL params, because TLS to the origin is Hyperdrive's job.
- **`drizzle-kit migrate` exits 0 without applying anything** when it cannot prompt, which
  is silent failure in CI. Migrations run through `apps/www/src/db/migrate.ts`
  (drizzle-orm's programmatic migrator) instead. Do not restore the CLI in the CI path.
- **`CONNECT` on the `postgres` maintenance database was deliberately left open.** Decision
  3's revoke was applied to `www` only. `pg_database.datacl` for `postgres` is NULL — no
  `pscale_*` role holds an explicit grant, so all of them ride the implicit PUBLIC one, and
  a pooler sits in front of 5432 (`pscale_pgbouncer` exists as both role and database).
  Revoking risks locking out the cluster to close a metadata-only hole in an empty
  maintenance database. Each new logical database still gets its own revoke, so the
  exposure does not grow. Revisit with PlanetScale support, not by experiment on the live
  cluster.
- **`pg_strict` coverage.** Guards `UPDATE`/`DELETE` only. `TRUNCATE` is not covered and
  `WHERE false` counts as safe. An accident guardrail, not a security control.
