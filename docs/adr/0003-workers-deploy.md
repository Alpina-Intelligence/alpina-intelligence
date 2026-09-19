# ADR-0003: HTTP apps deploy to Cloudflare Workers; tunnel ingress deprecated

- **Status:** Accepted, 2026-08-11 (`apps/www` live on Workers same day). The
  "VPS keeps Postgres and SSH" retention clause is **superseded by
  [ADR-0006](0006-vps-retired.md)** (2026-09-19) — the VPS is retired.
- **Depends on:** ADR-0001, ADR-0002.
- **Supersedes:** the k3s/Flux/Traefik ingress path of ADR-0001 and
  `docs/architecture.md` §2–3 *for HTTP apps*. The VPS remains the stateful
  substrate (Postgres, batch); nothing about the superuser boundary changes.

## Context

The platform restart (ADR-0001) assumed HTTP apps ship as containers into k3s
behind a Cloudflare tunnel. Before the first app deployed, two things changed
the calculus:

1. **Cloudflare's serverless platform covers our actual workload shape.**
   TanStack Start has first-party Workers support (`@cloudflare/vite-plugin` —
   dev, preview, and prod all run workerd, *less* runtime skew than the
   Bun-dev/Bun-prod nitro setup it replaced). The wider roadmap (copilot agents
   on Durable Objects, Pipelines→Iceberg ETL, R2 SQL dashboards) is
   Workers-native; the business thesis is "intelligence platforms on
   Cloudflare," so the flagship site running there is dogfood, not drift.
2. **The k3s path was still unbuilt.** No Ingress, no registry, no image
   builds, no Flux — the tunnel's catch-all pointed at a 404. Deprecating it
   deleted zero working functionality.

Evidence from the 2026-08-11 spike: `bun run deploy` from `apps/www` built,
uploaded, and attached both custom domains in <10s; all routes 200 from the
edge with ~130ms TTFB cold. Free tier covers current traffic (100k req/day).

## Decision

- An HTTP app in `apps/<name>/` owns a `wrangler.jsonc` (worker name = app dir
  name, same derivation rule as the DB contract) and deploys with
  `vite build && wrangler deploy`. Custom domains are declared in that file as
  `routes` — per-app ingress stays in the app's directory, preserving
  ADR-0001's "adding an app touches one directory" rule with Workers instead
  of Kustomizations.
- `cloudflared` on the VPS is **stopped and disabled** (unit + env file left
  in place; `infra/cloudflared/` docs marked deprecated). The wildcard
  `*.alpina-intelligence.com` CNAME to the tunnel now 530s and should be
  deleted from the zone — needs DNS-edit rights the agent token deliberately
  lacks (dashboard task).
- k3s and the container/Flux registry roadmap are **shelved, not removed** —
  revisit only if a workload appears that Workers/Containers genuinely can't
  hold. The VPS keeps Postgres (still loopback-bound, still hand-provisioned
  per ADR-0001's superuser rule) and SSH.
- When a deployed app needs the VPS Postgres, the path is **Hyperdrive over a
  re-scoped tunnel** (TCP service, no HTTP ingress) or a managed pg — decided
  in its own ADR when the first consumer lands. Nothing today reads a prod DB.

## Consequences

- Deploy = one command, no cluster, no registry, no image builds; rollback =
  `wrangler rollback`. CI can hold a narrowly-scoped Workers API token instead
  of cluster credentials.
- Single-vendor concentration deepens (DNS, ingress, compute, soon data). The
  exit story is unchanged and honest: TanStack app is runtime-portable
  (reverting to nitro `preset: "bun"` on the VPS is a one-line vite change and
  was the previous state), data stays Postgres/Iceberg.
- Free-tier limits (10ms CPU/request median, 100k req/day) are the operating
  envelope until traffic argues otherwise; Workers Paid ($5/mo) is the known
  next step and also unlocks the agents/DO roadmap.
- The architecture doc's §2–3 (tunnel/Traefik/k3s routing) describe the
  *previous* design; they stand as history until the doc's next revision, per
  the ADR convention.
