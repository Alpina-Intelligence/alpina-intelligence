# Production infra

Source of truth for the prod topology on the Hetzner VPS. Everything in this directory ships to `/opt/alpina/` on the box via GitHub Actions — do **not** hand-edit files on the VPS.

## Files

| File | Role |
|---|---|
| `docker-compose.yml` | Canonical prod compose. Defines `db`, `mlflow`, and every deployable app service. SHA-pinned image tags come from `/opt/alpina/.env` on the VPS. |
| `ensure-databases.sql` | Idempotent `CREATE DATABASE` for every project DB. Mounted by Postgres for first-time init **and** re-run by every deploy. |
| `bootstrap-vps.sh` | First-time-only VPS setup. After this runs, never invoke again — updates flow through CI. |

## How deploys work

- **App push** (`projects/<app>/**` changes): the app's `deploy-<app>.yml` workflow builds + pushes the image, scp's `infra/docker-compose.yml` + `infra/ensure-databases.sql` to `/opt/alpina`, updates the app's `<APP>_TAG` in `.env` to the new commit SHA, ensures all DBs exist, then `docker compose up -d <app>`.
- **Infra push** (`infra/**` changes): `deploy-infra.yml` runs. Ships the compose file, ensures DBs, then `docker compose up -d` (no args) to reconcile every service against the new compose definition.

Both paths are safe to run any number of times — idempotent end-to-end.

## Adding a new app

1. Add a service block to `infra/docker-compose.yml` referencing an `${YOUR_APP_TAG:-latest}` image tag.
2. If the app uses a new database, add a line to `infra/ensure-databases.sql`.
3. Create `.github/workflows/deploy-your-app.yml` modeled on an existing one — use the matching `<APP>_TAG` env var name.
4. Push. The first deploy will create the DB, write the tag to `.env`, and bring the service up. No SSH required.

## First-time VPS bootstrap

```bash
./infra/bootstrap-vps.sh
```

What it does:
- Creates `/opt/alpina/` on the VPS
- Writes a starter `.env` (generates `POSTGRES_PASSWORD` if not provided)
- Ships `docker-compose.yml` + `ensure-databases.sql`
- Brings up `db` + `mlflow`
- Runs `ensure-databases.sql`

After it succeeds, **add app secrets to `/opt/alpina/.env`** (`ALPINA_SITE_BETTER_AUTH_SECRET`, `PUCK_PROPHET_BETTER_AUTH_SECRET`, `UNDERSCORE_BETTER_AUTH_SECRET`) before the first app deploy lands.

## Where secrets live

`/opt/alpina/.env` on the VPS. Never committed. Contains:

```
POSTGRES_USER=alpina
POSTGRES_PASSWORD=<generated>
POSTGRES_DB=postgres
ALPINA_SITE_BETTER_AUTH_SECRET=...
PUCK_PROPHET_BETTER_AUTH_SECRET=...
UNDERSCORE_BETTER_AUTH_SECRET=...
ALPINA_SITE_TAG=<sha>
PUCK_PROPHET_TAG=<sha>
UNDERSCORE_BACKEND_TAG=<sha>
UNDERSCORE_FRONTEND_TAG=<sha>
```

The `<APP>_TAG=<sha>` lines are managed by each app's deploy workflow. To roll back, edit a tag to a previous SHA and run `docker compose up -d <app>` on the VPS (or push an empty commit that touches the relevant path).

## Rollback

```bash
ssh root@<vps>
cd /opt/alpina
sed -i 's|^ALPINA_SITE_TAG=.*|ALPINA_SITE_TAG=<previous-sha>|' .env
docker compose up -d alpina-site
```
