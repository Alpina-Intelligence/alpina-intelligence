# Architecture Decision Records

Numbered, immutable once accepted. A change of mind is a **new ADR that supersedes the
old one** — never an edit that makes history lie. `docs/architecture.md` stays the
narrative overview and cites ADRs rather than restating them; when the two disagree, the
newest ADR wins and the narrative doc owes an update.

Statuses: `Proposed` → `Accepted` → (`Superseded by ADR-NNNN`).

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-monorepo.md) | Consolidate to a monorepo | Accepted |
| [0002](0002-repo-layout.md) | Repo layout: deployable-unit apps, per-language packages | Accepted |
| [0003](0003-workers-deploy.md) | HTTP apps deploy to Cloudflare Workers; tunnel ingress deprecated | Accepted |
| [0004](0004-managed-postgres.md) | Deployed Postgres is managed (PlanetScale via Hyperdrive); the VPS becomes a daemon host | Accepted — VPS clause superseded by [0006](0006-vps-retired.md) |
| [0005](0005-deployed-data-tier.md) | Deployed data tier: Cloudflare-billed PlanetScale, one cluster many databases, Canada-first placement | Accepted |
| [0006](0006-vps-retired.md) | The VPS is retired; always-on compute belongs to Cloudflare | Accepted |
