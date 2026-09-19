# ADR-0006: The VPS is retired

- **Status:** Accepted, 2026-09-19
- **Depends on:** ADR-0003, ADR-0004, ADR-0005.
- **Supersedes:** ADR-0004 decision §2 ("the VPS keeps running … as a host for always-on
  daemons only") and §5's "the grandfathered box is its first home" clause for genuine
  daemons, plus ADR-0003's "the VPS keeps Postgres and SSH".

## Context

Three ADRs in a row each shrank what the Hetzner box was for, and the last one emptied it.

- **ADR-0003** (2026-08-11) took HTTP ingress off the box: HTTP apps deploy as Workers;
  `cloudflared` was stopped and k3s shelved before either ever served traffic.
- **ADR-0004** (2026-08-13) demoted the box's Postgres out of the production path and
  explicitly predicted that the "always-on daemon" category *"may turn out to be empty"* —
  Workflows, Durable Objects, Queues and Cron Triggers cover Dagster's scheduling role and
  MLflow's tracking store.
- **ADR-0005** (2026-08-23) moved the last production data consumer (`apps/www`) to the
  Cloudflare-billed PlanetScale cluster, completing what ADR-0003's deprecation started.

Since then nothing has landed on the box: no daemon was ever built, no repo artifact
targets it, and its Postgres container hosts no production data. ADR-0004's cost argument
— "at $46.49/mo it is cheaper than its own replacement by 3×" — only holds while the box
hosts something. Idle, it is $46.49/mo of pure waste, and the grandfathered price that
made rescale irreversible now rewards keeping hardware that does nothing.

## Decision

1. **The VPS is retired from the platform.** The repo no longer carries its artifacts:
   `infra/cloudflared/`, `infra/host/`, `infra/postgres/` and `infra/sm-operator/` are
   deleted (recoverable from git history; the UIP-era equivalents remain in
   `docs/reference/uip-infra/` as archive). Nothing in this repo may be pointed at a VPS
   again.
2. **The substrate has no always-on self-hosted compute.** Always-on work belongs to
   Cloudflare — Durable Objects, Queues/Workflows, Containers, Cron Triggers. If a
   workload appears that genuinely cannot run there (the honest current case is long-lived
   GPU), that is a **new ADR with a new cost line**, not a resurrection of this box.
3. **Releasing the server is the operator's out-of-repo action** (Hetzner console).
   Deleting it forfeits the grandfathered price — accepted deliberately; that price was
   only an asset while the box hosted something. Leftover tunnel remnants in the
   Cloudflare zone (the wildcard CNAME to `cfargotunnel.com` left 530ing since ADR-0003,
   and the tunnel itself) are safe to delete; the site's ingress is `routes` in
   `apps/*/wrangler.jsonc` and Access apps at the edge.

## Consequences

- The Hetzner line item ends once the server is released; the platform's fixed costs
  become Cloudflare-only.
- The standing caution "never rescale, resize, or rebuild the box" (ADR-0004) is moot —
  there is no box to preserve.
- ADR-0001's superuser rule narrows one final time: `provision-db.sh` survives only as the
  PlanetScale deployed script; the local tier is `infra/local/initdb/` with throwaway
  credentials and no superuser secret at all.
- `docs/architecture.md` §2–5 and §7's k3s/sm-operator machinery are now fully historical;
  the doc's status note carries the flag. `README.md` describes the current substrate.
