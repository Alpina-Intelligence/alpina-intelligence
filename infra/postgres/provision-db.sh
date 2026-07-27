#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Idempotent per-project provisioning for the shared platform Postgres.
#
#   ./provision-db.sh <project> [--conn-limit N] [--rotate]
#
# Creates (or reconciles) for <project>:
#   • database  <project>
#   • role      <project>_svc   — LOGIN, owns the database and its public schema
#   • a password, written to ./secrets/<project>.env (root-600)
#   • REVOKE CONNECT ON DATABASE <project> FROM PUBLIC
#
# Run it as many times as you like. Re-running does NOT rotate the password: the
# existing one is read back from ./secrets/<project>.env and re-applied, so the value
# converges instead of drifting. Use --rotate to deliberately mint a new one.
#
# WHY THIS EXISTS AND initdb/ DOESN'T: docker-entrypoint-initdb.d runs exactly once,
# on first volume init. It could never provision project #2. Everything here is
# `IF NOT EXISTS`-shaped so it works against a live cluster.
#
# WHY `REVOKE CONNECT … FROM PUBLIC` IS THE IMPORTANT LINE: Postgres does NOT isolate
# databases by default. The PUBLIC pseudo-role holds CONNECT on every new database, so
# without this any project's credentials could open any other project's database. This
# is the single control that makes one shared instance safe for unrelated projects.
#
# SECRETS: the generated password is never printed and never passed in argv (where
# `ps` could see it) — it goes to stdout of `openssl`, into a root-600 file, and into
# psql over stdin. Read it yourself with `cat secrets/<project>.env` when you need to
# put it in Bitwarden under `<project>/db-password`.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SECRETS_DIR="${SECRETS_DIR:-$DIR/secrets}"
CONN_LIMIT=20
ROTATE=0

die() { echo "error: $*" >&2; exit 1; }

PROJECT="${1:-}"
[[ -n "$PROJECT" ]] || die "usage: $0 <project> [--conn-limit N] [--rotate]"
shift
while [[ $# -gt 0 ]]; do
  case "$1" in
    --conn-limit) CONN_LIMIT="${2:-}"; shift 2 ;;
    --rotate)     ROTATE=1; shift ;;
    *)            die "unknown argument: $1" ;;
  esac
done

# Identifiers are interpolated into SQL below, so validation IS the injection defense.
# Keep it strict: lowercase, starts with a letter, no quoting games possible.
[[ "$PROJECT" =~ ^[a-z][a-z0-9_]{1,30}$ ]] \
  || die "project must match ^[a-z][a-z0-9_]{1,30}$ (got '$PROJECT')"
[[ "$CONN_LIMIT" =~ ^[0-9]{1,4}$ ]] || die "--conn-limit must be a number"

DB="$PROJECT"
ROLE="${PROJECT}_svc"
SECRET_FILE="$SECRETS_DIR/$PROJECT.env"

compose() { docker compose --project-directory "$DIR" -f "$DIR/compose.yaml" "$@"; }

# Cheapest reliable liveness check, and portable across compose versions (the
# `ps --status` flag isn't). Also catches "container up but still initialising".
compose exec -T postgres pg_isready -U postgres -q 2>/dev/null \
  || die "platform postgres is not accepting connections (try: systemctl start platform-postgres)"

# ── password: reuse, or mint ────────────────────────────────────────────────
mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"

if [[ -f "$SECRET_FILE" && $ROTATE -eq 0 ]]; then
  # shellcheck disable=SC1090
  PASSWORD="$(grep -oE '^PGPASSWORD=.*' "$SECRET_FILE" | cut -d= -f2-)"
  [[ -n "$PASSWORD" ]] || die "$SECRET_FILE exists but has no PGPASSWORD line"
  ACTION="reusing existing password"
else
  [[ $ROTATE -eq 1 && -f "$SECRET_FILE" ]] && ACTION="ROTATING password" || ACTION="new password"
  PASSWORD="$(openssl rand -hex 24)"
fi

# Hex only, by construction — guarantees the value is safe inside a SQL literal.
[[ "$PASSWORD" =~ ^[A-Za-z0-9]+$ ]] || die "generated password has unexpected characters"

# ── SQL, all of it re-runnable ──────────────────────────────────────────────
# `\gexec` runs the text returned by the query, which is how you get a conditional
# CREATE DATABASE (it can't run inside a DO block / transaction).
compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d postgres <<SQL
SELECT format('CREATE ROLE %I LOGIN', '$ROLE')
 WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$ROLE')\gexec

ALTER ROLE "$ROLE" WITH LOGIN PASSWORD '$PASSWORD' CONNECTION LIMIT $CONN_LIMIT;

SELECT format('CREATE DATABASE %I OWNER %I', '$DB', '$ROLE')
 WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB')\gexec

-- The control that makes a shared instance safe: strip the default PUBLIC grant so
-- only this project's role can open this database.
REVOKE CONNECT ON DATABASE "$DB" FROM PUBLIC;
GRANT  CONNECT ON DATABASE "$DB" TO "$ROLE";
SQL

compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d "$DB" <<SQL
-- Own the schema so the project's own migration tool (drizzle, alembic, …) can run
-- DDL as the app role without CREATE-privilege surprises.
ALTER SCHEMA public OWNER TO "$ROLE";
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO "$ROLE";
SQL

# ── record the credential (root-600), never echoed ──────────────────────────
umask 077
cat > "$SECRET_FILE" <<ENVFILE
# Generated by provision-db.sh for project '$PROJECT'. NOT committed.
# Store in Bitwarden as: $PROJECT/db-password
PGUSER=$ROLE
PGPASSWORD=$PASSWORD
PGDATABASE=$DB
ENVFILE
chmod 600 "$SECRET_FILE"

cat <<DONE

✓ provisioned '$PROJECT' ($ACTION)
    database          $DB
    role              $ROLE  (CONNECTION LIMIT $CONN_LIMIT)
    credential file   $SECRET_FILE

  The app's connection string, once it runs in k3s:
    postgresql://$ROLE:<password>@postgres:5432/$DB

  'postgres' there is a selector-less k8s Service backed by manual Endpoints pointing
  at this host, so the app never hardcodes an IP.

  Next: copy the password into Bitwarden ($PROJECT/db-password), then into the
  project's k8s Secret.  cat $SECRET_FILE
DONE
