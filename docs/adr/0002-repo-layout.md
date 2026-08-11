# ADR-0002: Repo layout — deployable-unit apps, per-language packages

- **Status:** Accepted, 2026-08-10 (scaffolding pending; nothing in `apps/` yet)
- **Depends on:** ADR-0001.

## Context

The fleet mixes ecosystems: TanStack Start web apps (Bun/TypeScript), AI/data services
(Python/uv), and the k8s/Terraform substrate. Two layouts were considered:

1. **Ecosystem-first:** `apps/` = TS, `services/` = Python.
2. **Deployable-unit-first:** `apps/` = every deployable regardless of language; shared
   libs split per ecosystem.

Evidence from two prior monorepos informed the choice: the UIP archive
(`archive/uip-final` — committed build output, one shared compose file, duplicated
skills dirs) and a production monorepo of the same TS+Python shape we operate elsewhere,
which runs deployable-unit grouping successfully and documents its costs.

## Decision

```
infra/           # substrate (ADR-0001) — postgres, cloudflared, host, sm-operator, terraform
apps/            # one directory per DEPLOYABLE, any language
  <name>/
    Dockerfile   # build context is ALWAYS the repo root: docker build -f apps/<name>/Dockerfile .
    deploy/      # k8s manifests: Deployment, Service, Ingress, BitwardenSecret CR, kustomization
packages-ts/     # shared TS libs — Bun workspace members, consumed as raw source
packages-py/     # shared Python libs — uv workspace members, alpina.* PEP 420 namespace
contracts/       # cross-language wire contracts — created on first TS↔Python API (see below)
docs/
justfile         # single cross-language task surface: just dev-<app>, just db-migrate, …
package.json     # Bun workspace root: workspaces = ["apps/*", "packages-ts/*"]
bunfig.toml      # supply-chain policy (see below)
pyproject.toml   # uv VIRTUAL workspace root — no [project] table, ever
uv.lock          # ONE lock, ONE .venv for all Python
```

### Workspace mechanics — the double-registration dance

Both workspaces glob `apps/*`. pnpm/Bun only claim directories containing a
`package.json`, but **uv errors on any `members` match without a `pyproject.toml`** — so
every TS app must be listed in `[tool.uv.workspace] exclude`. Adding a TS app touches
both `package.json` workspaces (implicitly, via glob) and `pyproject.toml` (explicitly).
The failure mode is loud (uv refuses to sync), which is why this is acceptable.

### Python rules

- **Single resolution.** One `uv.lock` means every member agrees on dependency versions.
  A service with genuinely conflicting pins (torch/CUDA stacks are the expected offender)
  gets `[tool.uv.workspace] exclude` and its own lock — escape hatch, not default.
- **Namespace:** all shared code lives under the `alpina.*` PEP 420 namespace. **Never
  create `src/alpina/__init__.py`** — it shadows sibling distributions and breaks the
  namespace merge.
- **Distribution vs module:** a new distribution in `packages-py/` requires a heavy or
  conflict-prone dependency set, or a trust/deletion boundary. Otherwise it's a module
  inside the foundation package. Start folded; split on a real signal. `packages-py/`
  itself is created lazily — no shared lib until two services actually share code.
- Workspace-wide dev tooling (ruff, type checker, pytest) is a root PEP 735
  `[dependency-groups] dev`; container builds use `uv sync --no-default-groups` so none
  of it ships in images.

### TypeScript rules

- **Packages export raw source** (`"exports": { ".": "./src/index.ts" }`) — every
  consumer runs a bundler, so no `dist/`, no build step, no stale-artifact bugs.
- **Package litmus:** a `packages-ts/` member needs **≥2 consuming apps AND no owned
  persistent state**. A package that needs a DB connection belongs to one app and is not
  a package. Cross-app operations on owned data go through an internal API on the owning
  app — never shared DB access, never a shared lib holding another app's credentials.
- **Pin TanStack packages exact and bump the family together** — floating ranges have
  hit broken upstream publishes mid-family.

### Supply chain (`bunfig.toml` / `package.json`)

- Bun blocks lifecycle scripts for untrusted deps by default; the allowlist is
  `trustedDependencies` — keep it minimal and commented per entry.
- Set `[install] minimumReleaseAge` (Bun ≥1.2.20) so freshly-published, possibly
  compromised releases are never installed. Gotcha inherited from experience elsewhere:
  the policy validates the existing lockfile, so raising it while any locked entry is
  younger than the cutoff bricks installs until the entries age past it.

### Cross-language boundary

No package-level sharing between ecosystems. TS↔Python contracts are HTTP/JSON or the
shared Postgres. When a direct API appears, it gets a `contracts/<name>/` directory:
normative `spec.md` + JSON Schemas + golden example vectors that **both** sides'
test suites must round-trip. Change the contract first, then the implementations.

### Agent context

One canonical `.agents/skills/` at the root — never a second skills directory (the UIP
archive had two). Root agents doc carries platform rules and cites ADRs instead of
restating them; per-app docs carry app-specific context only.

## Consequences

- Every Dockerfile assumes repo-root build context; root `.dockerignore` required.
- Root `.gitignore` must cover build output and agent-tooling artifacts from day one
  (`storybook-static/`, `.playwright-mcp/`, `*_cache/`, `.venv/`, `node_modules/`) —
  both prior monorepos leaked these into git.
- Renaming later is cheap for `packages-*` (nothing imports paths) but expensive for
  `apps/` once Flux `Kustomization` paths and CI filters reference it — get `apps/`
  right first.
