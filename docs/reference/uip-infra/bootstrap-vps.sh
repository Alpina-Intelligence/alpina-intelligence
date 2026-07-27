#!/usr/bin/env bash
set -euo pipefail

# First-time VPS bootstrap. Only needed once per machine.
# After this runs successfully, all infra and app updates flow through
# GitHub Actions — do not re-run this for ongoing deploys.
#
# Usage:
#   ./infra/bootstrap-vps.sh
#   VPS_HOST=x VPS_USER=y ./infra/bootstrap-vps.sh
#
# Required env vars on first-time setup:
#   POSTGRES_PASSWORD - written to .env on VPS if .env doesn't exist yet.
#                      Generated automatically if not provided.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

VPS_HOST="${VPS_HOST:-5.161.205.27}"
VPS_USER="${VPS_USER:-root}"
SSH_KEY="${VPS_SSH_KEY_PATH:-$HOME/.ssh/hetzner_vps_large}"

if [[ -n "${VPS_SSH_KEY:-}" ]]; then
  SSH_KEY="$(mktemp)"
  echo "$VPS_SSH_KEY" > "$SSH_KEY"
  chmod 600 "$SSH_KEY"
  trap "rm -f $SSH_KEY" EXIT
fi

SSH_CMD="ssh -i $SSH_KEY -o StrictHostKeyChecking=accept-new $VPS_USER@$VPS_HOST"
SCP_CMD="scp -i $SSH_KEY -o StrictHostKeyChecking=accept-new"

REMOTE_DIR="/opt/alpina"

echo "==> Ensuring $REMOTE_DIR exists on VPS..."
$SSH_CMD "mkdir -p $REMOTE_DIR"

echo "==> Copying infra files..."
$SCP_CMD "$REPO_ROOT/infra/docker-compose.yml"     "$VPS_USER@$VPS_HOST:$REMOTE_DIR/docker-compose.yml"
$SCP_CMD "$REPO_ROOT/infra/ensure-databases.sql"   "$VPS_USER@$VPS_HOST:$REMOTE_DIR/ensure-databases.sql"

echo "==> Checking .env on VPS..."
HAS_ENV=$($SSH_CMD "test -f $REMOTE_DIR/.env && echo yes || echo no")

if [[ "$HAS_ENV" == "no" ]]; then
  if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
    echo "==> No .env on VPS and POSTGRES_PASSWORD not set. Generating one..."
    POSTGRES_PASSWORD="$(openssl rand -base64 32)"
    echo "==> Generated POSTGRES_PASSWORD (save this somewhere safe):"
    echo "    $POSTGRES_PASSWORD"
  fi

  echo "==> Creating .env on VPS..."
  $SSH_CMD "cat > $REMOTE_DIR/.env" <<EOF
POSTGRES_USER=alpina
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=postgres
EOF
  echo "==> .env created. Remember to add app-specific secrets later:"
  echo "    ALPINA_SITE_BETTER_AUTH_SECRET, PUCK_PROPHET_BETTER_AUTH_SECRET, UNDERSCORE_BETTER_AUTH_SECRET"
else
  echo "==> .env already exists, skipping."
fi

echo "==> Bringing up db + mlflow..."
$SSH_CMD "cd $REMOTE_DIR && docker compose up -d db mlflow"

echo "==> Waiting for postgres to be healthy..."
$SSH_CMD "cd $REMOTE_DIR && until docker compose exec -T db pg_isready -U alpina >/dev/null 2>&1; do sleep 1; done"

echo "==> Ensuring databases via ensure-databases.sql..."
$SSH_CMD "cd $REMOTE_DIR && docker compose exec -T db psql -U alpina -d postgres -f /docker-entrypoint-initdb.d/init.sql"

echo "==> Done. Services running:"
$SSH_CMD "cd $REMOTE_DIR && docker compose ps"

echo
echo "==> Next steps:"
echo "    1. Add app secrets (BETTER_AUTH_SECRET values) to $REMOTE_DIR/.env"
echo "    2. Push to main — GitHub Actions will deploy each app"
