# AGENTS.md — alpina-intelligence working notes

Canonical agent guidance for this monorepo. Deliberately thin — the *reasoning* lives in
`docs/adr/` (cite the ADR, don't restate it) and `docs/architecture.md` (the narrative).
Read the relevant ADR before changing related design.

## What this is

All Alpina projects in one repo (ADR-0001): shared substrate (`infra/` — Postgres,
cloudflared, k3s, sm-operator), deployable apps (`apps/*`, grouped by deployable unit,
not language — ADR-0002), shared libs (`packages-ts/`, `packages-py/`). One Hetzner VPS
behind a Cloudflare tunnel; no inbound ports but `:22`.

## Workspace rules (ADR-0002)

- **Bun** workspace: root `package.json` globs `apps/*` + `packages-ts/*`; TS deps pinned
  exact (`bunfig.toml` sets `exact = true`); shared version pins go in the root
  `catalog`, members reference `"catalog:"`. TanStack packages: pin exact, bump the
  whole family together.
- **uv** workspace: virtual root `pyproject.toml` (never add a `[project]` table), one
  `uv.lock` + one `.venv`. Add deps to the *member's* pyproject, not the root.
- **Adding a TS app to `apps/` takes both sides:** Bun claims it via glob, and it MUST be
  added to `[tool.uv.workspace] exclude` in `pyproject.toml` — `uv sync` fails loudly
  until it's classified. That failure is by design.
- Shared TS packages export raw source (no `dist/`, no build step). Package litmus:
  ≥2 consuming apps AND no owned persistent state — a package that needs a DB connection
  belongs to one app.
- Python shared code lives in the `alpina.*` PEP 420 namespace. Never create
  `src/alpina/__init__.py`.

## Frontend (TanStack Start / Query / Router + shadcn/ui)

- **Before editing TanStack Start/Router/Query code, load the matching skill** from the
  installed packages: `bunx @tanstack/intent list` (discovers skills shipped inside
  `@tanstack/*` deps — they match the installed versions), then
  `bunx @tanstack/intent load <id>`. Don't work from pre-trained TanStack knowledge;
  the APIs move fast.
  - The routing table for these skills is the `intent-skills` block in
    `apps/www/AGENTS.md` — a **static snapshot**, regenerated only by
    `bunx @tanstack/intent install --map` (run in `apps/www`). Re-run it after any
    dependency bump so the map can't lag the lockfile. Belongs in the post-install
    path once a justfile exists.
- **shadcn/ui:** the `shadcn` skill (`.agents/skills/shadcn`, installed via skills.sh —
  `skills-lock.json` tracks it, `bunx skills update` refreshes it) carries composition/
  forms/styling rules and the CLI reference; the `shadcn` MCP server (`.mcp.json`)
  provides live registry search and component sources. Use both rather than guessing
  component APIs; the skill activates on any project with a `components.json`.
- For visual/aesthetic direction on new UI, load the `frontend-design` skill.
- **Icons are Phosphor-only** (`@phosphor-icons/react`) in every alpina frontend;
  `lucide-react` is banned. `components.json` still says `lucide` (shadcn has no
  phosphor option), so part of landing any `shadcn add` is swapping the generated
  lucide imports for Phosphor equivalents (alias to the `*Icon` names the generated
  body uses). Set the global voice once per app via `IconContext.Provider`
  (`weight: "bold"`) in `__root.tsx`; emphasis states override per-icon.
- **shadcn base library is Base UI** (`base-*` styles, `@base-ui/react`) for every
  alpina frontend — never Radix. Composition is `render`-prop, not `asChild`; see the
  `shadcn` skill's `rules/base-vs-radix.md`.
- **Theming is token-only** (`apps/www/src/styles.css`): components speak semantic
  utilities (`bg-background`, `text-primary`); palettes are CSS-var blocks —
  `:root`/`.dark` = default theme (lagoon), `[data-theme='<name>']` (+ `.dark` compose)
  = alternates. Adding a theme = two var blocks + the name in `ThemeControls`. NEVER
  hardcode colors in components or add CSS that bypasses the tokens. Mode/theme persist
  as cookies (`theme-mode`, `theme-name`); first paint is handled by the inline script
  in `__root.tsx`.

## Substrate boundaries (ADR-0001, architecture.md)

- **The Postgres superuser password never enters CI, an app env, or this repo.**
  Provisioning (`infra/postgres/provision-db.sh`) is hand-run; per-app credentials come
  from Bitwarden via sm-operator.
- App deploy manifests live in `apps/<name>/deploy/`; the shared tunnel/Terraform config
  changes only when an *auth boundary* is added, never per app.
- Docker builds always use the repo root as context: `docker build -f apps/<name>/Dockerfile .`
- **Database naming contract:** app dir name = database name = role prefix
  (`apps/www` → DB `www`, role `www_svc`) — derived by code at both tiers, never
  chosen freely. Apps read only libpq vars (`PGHOST/PGPORT/PGDATABASE/PGUSER/
  PGPASSWORD`) and stay tier-blind: locally they point at `127.0.0.1:5434`
  (`infra/local/`, fake creds from `.env.local`); deployed they get ConfigMap +
  Bitwarden-synced Secret.
- **New app needs a DB? Two touches, one per tier:**
  1. local: add the name to `APPS=(…)` in `infra/local/initdb/01-roles-and-dbs.sh`,
     then `docker compose down -v && up -d` (initdb only runs on first volume init;
     local data is throwaway by design)
  2. VPS: mint the password (see Secrets below), then
     `bwsl secret get <uuid> | jq -r .value | ssh alpina 'cd /opt/platform/postgres && ./provision-db.sh <name>'`
  There is deliberately no automation bridging these — the VPS step needs superuser
  and stays hand-run.

## Secrets

- Never commit secrets in any form — Bitwarden Secrets Manager is the source of truth
  (architecture.md §7). `.env*` is gitignored; local-only convenience.
- **Agent access to Secrets Manager is via `bwsl`** (a `~/.bashrc` wrapper): injects
  `BWS_ACCESS_TOKEN` from the gnome-keyring per-invocation
  (`secret-tool lookup service bws account alpina-dev`) — the token is never exported
  into a session env or written to disk. The machine account behind it is scoped to
  the SM project **`platform`** (`7007b64e-b136-4a7c-ab23-b4910179952f`, org
  `1e847db2-0efb-4c9d-ac5b-b3890164b6a1`).
- **Provisioning a deployed app's DB credential** (the 2026-08-02 flow — Bitwarden
  authoritative, nothing durable on any host):
  1. mint + store: `bwsl secret create PGPASSWORD "$(openssl rand -hex 32)" <project-id>`
     (alphanumeric only — `provision-db.sh` rejects symbols by design)
  2. map the returned UUID in `apps/<name>/deploy/bitwardensecret.yaml`
  3. apply to the role: `bwsl secret get <uuid> | jq -r .value | ssh alpina 'cd /opt/platform/postgres && ./provision-db.sh <name>'`
  4. rotation = the same three steps with a new value (`bws secret edit` keeps the
     UUID stable, so step 2 becomes a no-op), then `kubectl rollout restart`.

## GitHub account

- **All `gh` operations in this repo use the `eric-austin` account** (personal — it can
  see the private Alpina-Intelligence repos and holds the `workflow` scope for pushing
  CI changes). The keyring also holds `eric-austin-oraq` (work); if it's the active
  account, `gh` silently sees a different world (e.g. private org repos vanish from
  listings). Two safe patterns:
  - per-invocation, no global state: `GH_TOKEN="$(gh auth token --user eric-austin)" gh …`
  - or switch globally: `gh auth switch --user eric-austin`
- Git commit identity needs nothing: `~/.gitconfig` `includeIf` already scopes
  `~/dev/` to the personal email.
