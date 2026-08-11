#!/bin/bash
# Runs ONCE, on first cluster init (docker-entrypoint-initdb.d). Edits here do NOT
# re-apply to an existing volume — to pick up changes, `docker compose down -v` and
# bring the stack back up.
#
# Mints one least-privilege role + two databases PER APP (a dedicated *_test
# database so the test runner never truncates dev data). Apps connect as their
# own <app>_svc role, never as postgres: DML through least privilege, DDL only
# via migrations. New app needs a DB? Add it to APPS below and re-init.
set -euo pipefail

APPS=(www)

for app in "${APPS[@]}"; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
	  CREATE ROLE ${app}_svc WITH LOGIN PASSWORD '${APP_DB_PASSWORD}';

	  CREATE DATABASE ${app} OWNER ${app}_svc;
	  CREATE DATABASE ${app}_test OWNER ${app}_svc;

	  -- Parity with prod's provision-db.sh: PUBLIC holds CONNECT on every new
	  -- database by default, so without this any local role could open any app's
	  -- DB. Locally that's a nuisance, not a breach — but dev should fail the
	  -- same way prod does when an app points at the wrong database.
	  REVOKE CONNECT ON DATABASE ${app} FROM PUBLIC;
	  REVOKE CONNECT ON DATABASE ${app}_test FROM PUBLIC;
	EOSQL

  # Lock down the public schema: PG15+ already revokes CREATE from PUBLIC; this
  # makes ownership explicit so migrations run as the app role without surprises.
  for db in "${app}" "${app}_test"; do
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db" <<-EOSQL
		  ALTER SCHEMA public OWNER TO ${app}_svc;
	EOSQL
  done
done
