# Alpina Intelligence — monorepo

All projects in one repo: the shared infrastructure substrate, the apps that run on it,
and the libraries they share. HTTP apps deploy to Cloudflare Workers against managed
Postgres; a legacy Hetzner VPS is retained for always-on daemons, reachable only on `:22`.

This lineage is a **deliberate restart**: the previous stack (the "UIP" monorepo — a Bun
workspace with every app, one big `docker-compose.yml`, and five deploy workflows) was
torn down. Its history is intact at the tag **`archive/uip-final`**, and the parts worth
learning from are copied into [`docs/reference/`](docs/reference/). Projects are ported
out of that tag into the layout below one at a time.

## Layout

```
infra/         # substrate: local postgres, planetscale (deployed), host, terraform (planned)
apps/          # deployable units, ANY language — each owns its wrangler.jsonc (ADR-0003)
packages-ts/   # shared TypeScript, consumed as source (Bun workspace)
packages-py/   # shared Python, alpina.* namespace (uv workspace) — created on first need
docs/          # architecture, ADRs, reference material from the previous stack
```

Apps are grouped **by deployable unit, not language** ([ADR-0002](docs/adr/0002-repo-layout.md)):
a TanStack Start app sits next to a Python service in `apps/`. TS members belong to the
Bun workspace rooted here; Python members to the uv workspace rooted here.

## The boundary

The substrate — the things every project shares and exactly one person should be able to
change — lives in `infra/`. Each app owns everything specific to itself:

| Concern | Owner |
| --- | --- |
| Local dev Postgres — container, version, provisioning | **`infra/`** |
| The legacy VPS — host policy, the retained Postgres | **`infra/`** |
| Cloudflare DNS, Access — via Terraform | **`infra/`** (planned) |
| An app's worker config, routes, schema, migrations, seed data | **`apps/<name>/`** |

The load-bearing rule: **the Postgres superuser password never leaves the substrate
tier.** It was never repo membership that enforced this — it's credential scoping: the
password lives in Bitwarden and on the host, `provision-db.sh` is run by hand, and no
app or CI environment ever holds it ([ADR-0001](docs/adr/0001-monorepo.md)).

Adding an app is now one directory (ADR-0003) and, since deployed Postgres is managed
(ADR-0004), needs no `infra/` touch at all. The `infra/` PR is a local-tier concern.

```mermaid
flowchart LR
    subgraph repo["alpina-intelligence (this repo)"]
        subgraph plat["infra/ — substrate"]
            loc["local/<br/>dev Postgres :5434"]
            pg["postgres/<br/>legacy box, local-only script"]
            host["host/<br/>patch + reboot policy"]
        end
        subgraph apps["apps/ — one directory per deployable"]
            www["www/<br/>+ wrangler.jsonc"]
            nxt["… future apps"]
        end
    end
    apps -->|"own worker, own routes"| cf["Cloudflare Workers<br/>+ Hyperdrive → PlanetScale"]
```

## Current state

- **`apps/www`** is live on Cloudflare Workers ([ADR-0003](docs/adr/0003-workers-deploy.md)),
  behind a Cloudflare Access gate until launch. Deploy is `bun run deploy` from the app
  directory; ingress is `routes` in its `wrangler.jsonc`.
- **Deployed Postgres is PlanetScale over Hyperdrive**
  ([ADR-0004](docs/adr/0004-managed-postgres.md)) — wiring pending a PlanetScale account.
- **Local dev Postgres** runs on `127.0.0.1:5434` — see [`infra/local/`](infra/local/).
- **Deprecated and shelved:** k3s, `cloudflared` HTTP ingress, GHCR image builds, Flux,
  and `infra/sm-operator/`. Kept for history, marked in place, not live.
- **The legacy VPS** runs Postgres and SSH only. Never rescale or rebuild it — it holds a
  grandfathered price that any of those actions forfeits (ADR-0004).
- **Not built yet:** `infra/terraform/`, `packages-ts/`, `packages-py/`.

## Where the ADRs are

Start with [`docs/adr/`](docs/adr/) for decisions and
[`docs/architecture.md`](docs/architecture.md) for the narrative — the latter is a living
doc whose §2–6 stand as superseded history, flagged in place.
