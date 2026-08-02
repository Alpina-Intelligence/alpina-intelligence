#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Idempotent per-project provisioning for the shared platform Postgres.
#
#   printf '%s' "$PASSWORD" | ./provision-db.sh <project> [--conn-limit N]
#
# Creates (or reconciles) for <project>:
#   • database  <project>
#   • role      <project>_svc   — LOGIN, owns the database and its public schema
#   • REVOKE CONNECT ON DATABASE <project> FROM PUBLIC
#
# Run it as many times as you like; everything here is `IF NOT EXISTS`-shaped.
#
# THE PASSWORD COMES FROM STDIN, and this script no longer generates or stores one
# (revised 2026-08-02). Bitwarden Secrets Manager is the source of truth: you mint the
# value there, this applies it to the role, and sm-operator syncs it into the cluster.
# Rotation is the same command with a different value — there is no --rotate, because
# supplying a password IS the rotation.
#
# What that buys: the old flow generated on the box, wrote secrets/<project>.env, and
# ended with "now copy this into Bitwarden" — a manual step that `--rotate` silently
# invalidated, so the two could disagree with nothing to notice it. Now there is one
# authoritative copy and no plaintext file on the host at all.
#
# What it costs, recorded honestly: the cluster's Bitwarden machine account can now read
# the database password, so a stolen bw-auth-token reaches the database. Accepted because
# that token and the k8s Secret holding the same password live in the same namespace —
# anyone who can read one can already read the other.
#
# WHY THIS EXISTS AND initdb/ DOESN'T: docker-entrypoint-initdb.d runs exactly once, on
# first volume init. It could never provision project #2.
#
# WHY `REVOKE CONNECT … FROM PUBLIC` IS THE IMPORTANT LINE: Postgres does NOT isolate
# databases by default. The PUBLIC pseudo-role holds CONNECT on every new database, so
# without this any project's credentials could open any other project's database. This
# is the single control that makes one shared instance safe for unrelated projects.
#
# SECRETS: the password is never printed, never written to disk, and never passed in
# argv (where `ps` would expose it). It goes stdin → shell variable → psql over stdin.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONN_LIMIT=20

die() { echo "error: $*" >&2; exit 1; }

PROJECT="${1:-}"
[[ -n "$PROJECT" ]] || die "usage: printf '%s' \"\$PASSWORD\" | $0 <project> [--conn-limit N]"
shift
while [[ $# -gt 0 ]]; do
  case "$1" in
    --conn-limit) CONN_LIMIT="${2:-}"; shift 2 ;;
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

# ── password: from stdin, first line, never echoed ──────────────────────────
# NOTE: this consumes stdin, so do NOT pipe this script itself into bash while also
# piping a password — scp it to the box and run it as a file.
[[ ! -t 0 ]] || die "password must arrive on stdin: printf '%s' \"\$PASSWORD\" | $0 $PROJECT"
IFS= read -r PASSWORD || true
[[ -n "$PASSWORD" ]] || die "no password on stdin"

# Alphanumeric by requirement, which is what guarantees the value is safe inside the SQL
# literal below. Generate with: openssl rand -hex 32
# (base64 would introduce +/= and is rejected here rather than escaped — a narrower
# charset is a cheaper defense than getting quoting right.)
[[ "$PASSWORD" =~ ^[A-Za-z0-9]{16,}$ ]] \
  || die "password must be >=16 alphanumeric chars (no spaces/symbols). Use: openssl rand -hex 32"

compose() { docker compose --project-directory "$DIR" -f "$DIR/compose.yaml" "$@"; }

# Cheapest reliable liveness check, and portable across compose versions (the
# `ps --status` flag isn't). Also catches "container up but still initialising".
# `</dev/null` matters: `compose exec -T` inherits stdin, so without it this check
# would eat the password we just read.
compose exec -T postgres pg_isready -U postgres -q </dev/null 2>/dev/null \
  || die "platform postgres is not accepting connections (try: systemctl start platform-postgres)"

# ── SQL, all of it re-runnable ──────────────────────────────────────────────
# `\gexec` runs the text returned by the query, which is how you get a conditional
# CREATE DATABASE (it can't run inside a DO block / transaction).
compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d postgres <<SQL
SELECT format('CREATE ROLE %I LOGIN', '$ROLE')
 WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$ROLE')\gexec

ALTER ROLE "$ROLE" WITH LOGIN PASSWORD '$PASSWORD' CONNECTION LIMIT $CONN_LIMIT;

SELECT format('CREATE DATABASE %I OWNER %I', '$DB', '$ROLE')
 WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB')\gexec

-- The control that makes a shared instance safe: strip the default PUBLIC grants so
-- only this project's role can open this database. ALL rather than just CONNECT —
-- otherwise PUBLIC keeps a residual TEMP grant (harmless while CONNECT is gone, but
-- "no grants at all" is easier to verify in \l than "one grant, but the inert one").
REVOKE ALL   ON DATABASE "$DB" FROM PUBLIC;
GRANT  CONNECT ON DATABASE "$DB" TO "$ROLE";
SQL

compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d "$DB" <<SQL
-- Own the schema so the project's own migration tool (drizzle, alembic, …) can run
-- DDL as the app role without CREATE-privilege surprises.
ALTER SCHEMA public OWNER TO "$ROLE";
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO "$ROLE";
SQL

cat <<DONE

✓ provisioned '$PROJECT'
    database          $DB
    role              $ROLE  (CONNECTION LIMIT $CONN_LIMIT)
    password          applied from stdin; not stored on this host

  The app's connection string, once it runs in k3s:
    postgresql://$ROLE:<password>@postgres:5432/$DB

  'postgres' there is a selector-less k8s Service backed by manual Endpoints pointing
  at this host, so the app never hardcodes an IP.

  Next: make sure the SAME value is in Bitwarden as $PROJECT/db-password, in a project
  the cluster's machine account can read. sm-operator syncs it into the namespace; the
  pods only pick it up after a rollout restart.
DONE
