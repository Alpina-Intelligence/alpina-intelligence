# ADR-0004: Deployed Postgres is managed (PlanetScale via Hyperdrive); the VPS becomes a daemon host

- **Status:** Accepted, 2026-08-13. Decision §2 (the VPS as always-on daemon host) is
  **superseded by [ADR-0006](0006-vps-retired.md)** (2026-09-19) — the VPS is retired.
- **Depends on:** ADR-0001, ADR-0002, ADR-0003.
- **Supersedes:** `docs/architecture.md` §4–6 *for deployed databases* — Postgres placement
  ("shared, and outside the cluster") now describes the local stack and the legacy box
  only. ADR-0001's `infra/`-owns-Postgres row still holds for the local tier.
- **Resolves:** ADR-0003's deferral — *"when a deployed app needs the VPS Postgres, the
  path is Hyperdrive over a re-scoped tunnel or a managed pg — decided in its own ADR when
  the first consumer lands."*

## Context

Three inputs, none of which existed when ADR-0003 was written on 2026-08-11.

**1. Hetzner repriced the box out of its own upgrade path.** Instance metadata identifies
it as a **CPX41 in `us-east` / `ash-dc1`** (Ashburn) — 8 vCPU, 15 GB RAM, 226 GB disk, no
GPU. Per Hetzner's price-adjustment doc (`docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/`):

| | old | new, 2026-06-15 | change |
| --- | --- | --- | --- |
| CPX41 (USA) | $46.49/mo | **$141.49/mo** | **+204%** |
| CX43 / CAX41 (EU **only**) | $13.99 / $36.99 | $18.49 / $48.49 | ~+31% |

The June round applies to **new orders and rescales**; existing servers keep their terms,
and Hetzner warns that *"certain changes to servers with legacy pricing may trigger a
switch to the current pricing."* (The earlier 1 April round, up to 37%, *did* hit existing
servers.) Two consequences that invert earlier reasoning:

- `architecture.md` §8 accepted "vertical scaling only" as the tradeoff for one node.
  Exercising that escape hatch now costs +204%. The box is **fixed at its current size for
  as long as we want its price** — scaling is no longer an option, it's a repurchase.
- The cost-optimized CX/CAX lines that barely moved are **EU-only**. Ashburn offers only
  CPX/CCX, so there is no cheap same-region replacement. The grandfathered price is not
  reproducible; it is a one-way asset.

**2. Workers + Containers now cover the compute this ADR's predecessor deferred.**
Workflows give unlimited wall time per step (CPU 30 s default, configurable to 5 min),
25,000 steps, and — on Workers Paid — one hour per cron firing without consuming a
concurrency slot. Containers run up to 4 vCPU / 12 GiB / 20 GB ephemeral disk, billed per
10 ms active. **ADR-0003's premise that "training also doesn't fit request-scoped compute
(Cron Triggers cap at 15 minutes)" is therefore obsolete for CPU-bound tabular work** — a
nightly 30-minute `standard-4` retrain costs roughly $5/mo marginal. It is *not* obsolete
for GPU: no GPU container instance type exists, and Workers AI serves catalog models plus
uploaded LoRA adapters only. Arbitrary weights remain off-platform.

**3. Nothing reads a production database yet.** `apps/www` is the only app; `src/db/env.ts`
defaults to `127.0.0.1:5434`. There is no data to migrate — this is greenfield wiring, which
is the cheapest possible moment to move.

## Decision

1. **Deployed Postgres is PlanetScale**, reached from Workers through **Hyperdrive**.
   Single-node to start (3-node HA is a later, separate call driven by an actual SLO).
2. **The VPS keeps running, untouched, as a host for always-on daemons only.** No rescale,
   no resize, no rebuild, no plan change — each forfeits the grandfathered price. Postgres
   stays installed until the last consumer has moved, then the *container* is stopped. The
   **server is not deleted**: at $46.49/mo it is cheaper than its own replacement by 3×,
   and deletion is the one irreversible action available.
3. **The database naming contract is unchanged** (ADR-0001, AGENTS.md): app dir name =
   database name = role prefix, derived by code at both tiers. It now derives a PlanetScale
   database and role instead of a local one. Apps stay tier-blind; the deployed connection
   string lives in Hyperdrive, not in app config.
4. **`infra/postgres/provision-db.sh` is local-only from here.** It keeps the superuser
   boundary for the local stack and the legacy box. No deployed role is ever provisioned by
   hand again, so ADR-0001's "the superuser password never leaves the substrate tier" rule
   survives by becoming narrower rather than being relaxed.
5. **Daemons remain hypothetical until a service exists.** No `packages-py/` directory, no
   Python workspace members, no MLflow or Dagster deployment exists today; the ML names in
   `apps/www/src/routes/stack.tsx` are site copy. When a real always-on daemon appears, the
   first question is **"why isn't this a Workflow?"** — Dagster's scheduling role and
   MLflow's tracking store are both already covered by Workflows + PlanetScale + R2, so the
   always-on category may turn out to be empty. If a genuine daemon survives that question,
   the grandfathered box is its first home.
6. **If a free box is ever the answer, it is Oracle, not GCP.** Recorded so it isn't
   re-litigated (checked 2026-08-13):

   | | GCP always-free | Oracle always-free |
   | --- | --- | --- |
   | CPU | `e2-micro`: **0.25 vCPU sustained** (2 vCPUs exposed at 12.5% each), 30 s burst | A1: **2 OCPU** |
   | Memory | **1 GB** | **12 GB** |
   | Disk | 30 GB | 200 GB block |
   | Egress | **1 GB/mo** from North America | — |
   | Vendor risk | 30 days' notice to change or eliminate | idle reclamation |

   Oracle is 8× the CPU and 12× the memory. Dagster alone does not fit in `e2-micro`: its
   own guidance is 0.25 vCPU **+ 1 GB for the code server**, before the 256Mi daemon and
   the webserver. Oracle's idle-reclamation rule (7-day window; 95th-percentile CPU < 20%
   *and* network < 20% *and* memory < 20%) was disqualifying for Postgres and is merely
   inconvenient for a rebuildable daemon — losing one costs a redeploy, not data. Either
   way a free box is **never** a home for durable state.
7. **GPU work stays on the local RTX 3090 workstation.** Hetzner's GPU line starts at
   €232.30/mo + setup (GEX44-1); renting is not justified by any current workload.

### Implementation order

Blocked on a PlanetScale account, which needs a human with a payment method. Everything
below is otherwise decided — no further design calls.

1. Create the PlanetScale Postgres database named `www` (naming contract), plus its role.
2. Mint and store the credential per AGENTS.md: `bwsl secret create PGPASSWORD "$(openssl
   rand -hex 32)" 7007b64e-b136-4a7c-ab23-b4910179952f`, then map the returned UUID.
3. `bunx wrangler hyperdrive create www --connection-string="postgres://…"`, then add the
   binding to `apps/www/wrangler.jsonc`:
   `"hyperdrive": [{ "binding": "HYPERDRIVE", "id": "<id>" }]`.
   `nodejs_compat` is already set and is still **required** — the app's
   `compatibility_date` is `2026-08-01`, and the flag only becomes implicit at
   `2026-08-04` or later.
4. Rewrite `apps/www/src/db/index.ts`. The current module-scope `postgres(databaseUrl(),
   { max: 10 })` singleton is a workerd footgun: build the client **per request** from
   `env.HYPERDRIVE.connectionString` with `max: 5` (Workers' concurrent-external-connection
   limit), `fetch_types: false` (no array types in `schema.ts`, saves a round-trip), and
   `prepare: true` (Hyperdrive caches prepared statements). Keep `databaseUrl()` for
   `drizzle-kit` and local dev only. Its docstring still claims the deployed target is the
   nitro `bun` preset — stale since ADR-0003; fix it in the same change.
5. Migrations run from CI against the PlanetScale URL at deploy, never from a laptop;
   `drizzle.config.ts`'s `strict` guard stays as the backstop.
6. Keep the driver as `postgres-js` (pinned 3.4.9; Hyperdrive requires ≥ 3.4.5).
   Cloudflare recommends `pg` for "best compatibility with Hyperdrive's caching," but
   `drizzle-orm/postgres-js` is already wired and the delta does not justify a driver
   migration. Revisit only if cache-hit metrics disappoint.

## Consequences

- **The backup chore disappears before it was ever built.** `architecture.md` open question
  #4 (`pg_dump` → R2, encrypted) narrows to the local throwaway stack and the legacy box,
  and is closed for production. This was unbuilt work with real risk attached; deleting it
  is most of this ADR's value.
- **Vendor concentration deepens again** — DNS, ingress, compute, and now the data path all
  route through Cloudflare, with PlanetScale as the one non-Cloudflare dependency in the
  request path. Honest exit story: the schema stays plain Postgres and `drizzle-kit`
  migrations replay against any Postgres, so the exit is a connection-string change plus a
  dump/restore, not a rewrite.
- **A new latency profile.** Colocated loopback queries (architecture.md §8: sub-millisecond)
  are gone; Hyperdrive's pooling and caching replace colocation. Cloudflare's own figures
  are 1–3 ms per query when execution is pinned near the database, 20–30 ms when it isn't.
  For loader-driven SSR making several sequential queries this is the main regression, and
  the mitigation is the one already identified in §8: **cache the `_public` route group at
  the edge**, where a hit reaches neither Worker nor database.
- **Cost, per month:** Workers Paid $5 + PlanetScale from $5 (single-node) + ~$5 marginal
  for a nightly training container, against the box's $46.49 — which stays on the bill until
  the daemons question resolves. Retiring the box later is the saving; this ADR does not
  claim it yet.
- **`infra/` stops growing per app.** Adding an app was already one directory (ADR-0003);
  now it no longer needs the two-tier database touch either. AGENTS.md's "New app needs a
  DB? Two touches, one per tier" applies to local only.

### Deliberately unresolved

- **Who bills the PlanetScale instance.** `architecture.md` §8 asserted "billed by
  Cloudflare"; Cloudflare's Hyperdrive docs list only generic PostgreSQL and MySQL guides
  with no provider-specific PlanetScale integration, so that claim is **unverified**.
  Confirm at signup and record the answer here in a follow-up ADR if it changes the cost
  model.
- **Instance size.** PlanetScale's entry tier is PS-5 (512 MB, 1/16 vCPU). No traffic data
  exists to size against, so start at the bottom and resize on evidence rather than guessing.
- **HA.** Single-node accepts a restart window. Revisit when there is a user-facing SLO.
