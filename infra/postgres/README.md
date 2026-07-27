# Shared Postgres (host service on the VPS)

Postgres 17 for **every** project on the box, run as a Docker container on the
Hetzner host — outside k3s and outside Terraform. The `compose.yaml` header explains
why it's one shared instance and what that costs.

## What's here

| File | Role |
| --- | --- |
| `compose.yaml` | The server: pinned `postgres:17`, named volume, loopback bind. |
| `provision-db.sh` | **Idempotent** per-project database + role + password. Re-runnable. |
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

```bash
cd /opt/platform/postgres
./provision-db.sh blog                  # database `blog`, role `blog_svc`
./provision-db.sh blog --conn-limit 10  # re-run any time; converges, doesn't rotate
./provision-db.sh blog --rotate         # deliberately mint a new password
cat secrets/blog.env                    # → copy into Bitwarden as blog/db-password
```

Then commit the invocation to this repo's history (a line in this README or a
follow-up script) so the fleet's databases are documented, not folklore.

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

## ⚠️ Before the first app deploys to k3s

The container binds `127.0.0.1:5432` — safe, but **unreachable from k3s pods** (they're
on the flannel CNI, not loopback). Rebind `ports:` to the node-internal IP pods can
reach, then point the k8s `Endpoints` at it. One deliberate step at deploy time.

## Backups (TODO, before real traffic)

The volume `platform_pgdata` is the one piece of state that can't be rebuilt from git.
Add a per-database `pg_dump` cron → R2 (already in the Cloudflare account,
S3-compatible), plus `pg_dumpall --globals-only` for the roles. Per-database rather
than `pg_dumpall` so a single project can be restored without touching the others.
Not wired yet.
