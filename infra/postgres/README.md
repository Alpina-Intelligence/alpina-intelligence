# Shared Postgres (host service on the VPS)

Postgres 17 for **every** project on the box, run as a Docker container on the
Hetzner host — outside k3s and outside Terraform. The `compose.yaml` header explains
why it's one shared instance and what that costs.

## What's here

| File | Role |
| --- | --- |
| `compose.yaml` | The server: pinned `postgres:17`, named volume, loopback bind. |
| `provision-db.sh` | **Idempotent** per-project database + role. Password supplied on stdin. |
| `platform-postgres.service` | systemd unit — makes it a first-class host service. |
| `.env.example` | Shape of the superuser secret; real `.env` lives only on the box. |

Deployed to `/opt/platform/postgres/` on the VPS.

## Install

```bash
ssh root@<vps> 'mkdir -p /opt/platform'
scp -r infra/postgres root@<vps>:/opt/platform/

ssh root@<vps>
cd /opt/platform/postgres

# superuser password, generated on the box — never echoed, never committed
umask 077
printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 24)" > .env

cp platform-postgres.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now platform-postgres
systemctl status platform-postgres --no-pager
```

Back the superuser password up in Bitwarden as `platform/postgres-superuser`.

## Adding a project

**Mint the password first, in Bitwarden** (`<project>/db-password`, in a project the
cluster's machine account can read). This script no longer generates one — Bitwarden is the
source of truth and the value must exist there before it exists anywhere else.

Generate it on your laptop, put it straight into Bitwarden, then apply it:

```bash
PW=$(openssl rand -hex 32)      # alphanumeric by construction; the script rejects symbols
printf '%s' "$PW" | ssh alpina 'cd /opt/platform/postgres && ./provision-db.sh blog'
unset PW
```

Re-run any time — it converges. Rotation is the same command with a different value; there
is no `--rotate`, because supplying a password *is* the rotation.

```bash
printf '%s' "$PW" | ssh alpina 'cd /opt/platform/postgres && ./provision-db.sh blog --conn-limit 10'
```

Nothing is written to disk on the host.

> **Scope, per ADR-0004 (2026-08-13):** this script is **local and legacy-box only**.
> Deployed databases are PlanetScale, and their credential reaches the Worker through a
> Hyperdrive config, not through this box. The `sm-operator`/`kubectl rollout restart`
> half of the old flow is dead — k3s is shelved (ADR-0003) and no cluster reads this
> server.

Then commit the invocation to this repo's history (a line in this README or a
follow-up script) so the fleet's databases are documented, not folklore.

### Rotating

1. New value in Bitwarden.
2. `printf '%s' "$PW" | ssh alpina '… ./provision-db.sh <project>'` — updates the role.

That is the whole procedure now. Nothing downstream caches the value: the only consumers
left are a local stack that is recreated from scratch anyway, and — until `www` finishes
moving — a legacy database with no deployed reader.

### What it guarantees

- `REVOKE CONNECT ON DATABASE <db> FROM PUBLIC` — **the important one.** Postgres
  grants CONNECT to the PUBLIC pseudo-role on every new database, so without this any
  project's credentials could open any other project's database.
- Per-role `CONNECTION LIMIT` — `max_connections` is instance-wide, so one project
  leaking pool connections would otherwise starve every other project.
- The app role owns its database and its `public` schema, so the project's own
  migration tool runs DDL without needing superuser.

### What it deliberately doesn't do

Hide project names. Any role can still read `pg_database` and `pg_roles`, and see other
backends in `pg_stat_activity` (query text is masked from non-superusers). That's fine
when one person owns every project; it is **not** a boundary you'd put between tenants.

## Provisioned so far

| Project | Database | Role |
| --- | --- | --- |
| puck-prophet | `puck` | `puck_svc` |

## Deployed consumers: none, by design

The container stays bound to `127.0.0.1:5432`. The old "rebind to a node-internal IP so
k3s pods can reach it" step is **dropped** — k3s is shelved (ADR-0003) and deployed
Postgres is PlanetScale over Hyperdrive (ADR-0004), so nothing off this box connects.

## Backups

**Closed by ADR-0004.** PlanetScale owns backups for deployed data; the local stack
(`infra/local/`) is throwaway by design. The `pg_dump` → R2 cron this section used to
specify was never built and is no longer needed.
