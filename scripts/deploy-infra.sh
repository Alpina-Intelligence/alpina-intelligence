#!/usr/bin/env bash
set -euo pipefail

# Deploy infrastructure (docker-compose + postgres) to VPS.
# Run manually or as a CI/CD step.
#
# Usage:
#   ./scripts/deploy-infra.sh              # manual (uses defaults)
#   VPS_HOST=x VPS_USER=y ./scripts/deploy-infra.sh  # CI override
#
# Required env vars for first-time setup:
#   POSTGRES_PASSWORD - will be written to .env on VPS if .env doesn't exist
#
# In CI, set these as GitHub Secrets:
#   VPS_HOST, VPS_USER, VPS_SSH_KEY (private key content)

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# SSH connection — defaults for manual use, overridable in CI
VPS_HOST="${VPS_HOST:-5.161.205.27}"
VPS_USER="${VPS_USER:-root}"
SSH_KEY="${VPS_SSH_KEY_PATH:-$HOME/.ssh/hetzner_vps_large}"

# If CI passes the key as content (VPS_SSH_KEY), write it to a temp file
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

echo "==> Copying infrastructure files..."
$SCP_CMD "$REPO_ROOT/docker-compose.prod.yml" "$VPS_USER@$VPS_HOST:$REMOTE_DIR/docker-compose.yml"

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
  echo "==> .env created."
else
  echo "==> .env already exists, skipping."
fi

echo "==> Starting docker compose..."
$SSH_CMD "cd $REMOTE_DIR && docker compose up -d"

echo "==> Waiting for postgres to be healthy..."
$SSH_CMD "cd $REMOTE_DIR && docker compose exec -T db pg_isready -U alpina --timeout=30"

# Databases to create — add new ones here
DATABASES="alpina puck_prophet mlflow"

echo "==> Ensuring databases exist..."
for db in $DATABASES; do
  $SSH_CMD "cd $REMOTE_DIR && docker compose exec -T db psql -U alpina -d postgres -tc \"SELECT 1 FROM pg_database WHERE datname = '$db'\" | grep -q 1 || docker compose exec -T db psql -U alpina -d postgres -c \"CREATE DATABASE $db;\""
  echo "    $db: ok"
done

echo "==> Done. Services running:"
$SSH_CMD "cd $REMOTE_DIR && docker compose ps"
