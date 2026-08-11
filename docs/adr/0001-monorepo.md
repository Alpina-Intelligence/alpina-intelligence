# ADR-0001: Consolidate to a monorepo

- **Status:** Accepted, 2026-08-10
- **Supersedes:** the "two repos, one boundary" model documented in earlier revisions of
  `docs/architecture.md` §1 and the README (an app's code, image, manifests, and schema
  in "its own repo").

## Context

The platform restart planned one repo per project beside this substrate repo. Before any
project repo was actually created, the calculus changed:

- **Agent-assisted development is the dominant workflow.** Per-repo skills, agent
  guidance, and conventions were already duplicating (the UIP archive contains both
  `.agents/skills/` and `.claude/skills/`), and cross-repo context is exactly what coding
  agents are worst at.
- **One person owns everything.** The isolation a repo boundary buys — access control,
  independent release cadence, blame boundaries — protects against coordination problems
  this org doesn't have.
- **The fleet's history already lives here.** `archive/uip-final` contains every project;
  "consolidation" is porting directories forward, not merging repos.

The strongest argument for the two-repo split was never layout — it was the rule that
**the Postgres superuser password never leaves the substrate tier**. That rule is
enforced by credential scoping (password in Bitwarden and on the host, `provision-db.sh`
run by hand, nothing in CI), not by git topology. It survives consolidation untouched.

## Decision

One monorepo: substrate (`infra/`), all deployables (`apps/`), shared libraries
(`packages-ts/`, `packages-py/`). Layout details are ADR-0002.

What replaces each property the repo boundary used to provide:

| Was (per-repo) | Becomes (monorepo) |
| --- | --- |
| Repo = deploy unit | `apps/<name>/` owns `Dockerfile` + `deploy/` (manifests, `Ingress`, `BitwardenSecret` CR) |
| Flux: one `GitRepository` + `Kustomization` per repo | One `GitRepository`, one path-scoped `Kustomization` per app (`path: ./apps/<name>/deploy`) — native Flux, no workaround |
| CI isolation by repo | One workflow per deployable, `paths:` filtered; shared packages appear in every dependent app's filter |
| Infra changes gated by repo ownership | Infra pipelines stay separate from app pipelines; superuser operations remain hand-run |

## Consequences

- `docs/architecture.md` §§1, 3, 4, 7 rewritten from repo-boundary to directory-boundary
  language (done in the same change as this ADR).
- Docker build context becomes the repo root for every app (workspace installs need the
  root lockfiles), so a root `.dockerignore` is load-bearing.
- Path-filtered CI is a maintenance obligation: forgetting to add `packages-ts/**` to an
  app's filter silently skips rebuilds. Accepted at this fleet size; change-graph tooling
  (turborepo/nx) is deliberately out of scope until filters actually bite.
- GitHub-level access control per project is gone. Acceptable: single-owner org, and the
  secrets model never depended on it.
