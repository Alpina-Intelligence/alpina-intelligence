#!/usr/bin/env bash
# Move the tunnel token out of the systemd ExecStart line and into a root-600
# EnvironmentFile, so it stops appearing in `ps`, /proc/*/cmdline and `systemctl cat`.
#
# One-shot and idempotent: re-running after a successful migration is a no-op.
# Run as root ON THE VPS. Safe to run any time — the tunnel drops for ~2s on restart.
#
#   scp -r infra/cloudflared root@<vps>:/opt/platform/
#   ssh root@<vps> 'bash /opt/platform/cloudflared/migrate-token-to-envfile.sh'

set -euo pipefail

UNIT=/etc/systemd/system/cloudflared.service
ENVFILE=/etc/cloudflared/cloudflared.env

[ "$(id -u)" -eq 0 ] || { echo "must run as root" >&2; exit 1; }
[ -f "$UNIT" ] || { echo "no unit at $UNIT" >&2; exit 1; }

if grep -q '^EnvironmentFile=' "$UNIT" && [ -f "$ENVFILE" ]; then
  echo "already migrated — nothing to do"
  exit 0
fi

# Pull the token out of ExecStart without ever echoing it.
TOKEN=$(grep -oP '(?<=--token )\S+' "$UNIT" || true)
[ -n "$TOKEN" ] || { echo "no --token found in $UNIT; migrate by hand" >&2; exit 1; }

cp -a "$UNIT" "$UNIT.bak"
echo "backed up → $UNIT.bak"

install -d -m 0700 /etc/cloudflared
umask 077
printf 'TUNNEL_TOKEN=%s\n' "$TOKEN" > "$ENVFILE"
chmod 0600 "$ENVFILE"

# Rewrite ExecStart and add the EnvironmentFile, leaving everything else intact.
sed -i \
  -e 's|^ExecStart=.*|ExecStart=/usr/bin/cloudflared --no-autoupdate tunnel run|' \
  -e "\|^ExecStart=|i EnvironmentFile=$ENVFILE" \
  "$UNIT"

systemctl daemon-reload
systemctl restart cloudflared
sleep 5

echo "=== active: $(systemctl is-active cloudflared) ==="
echo "=== process table — the token must NOT appear below ==="
ps -eo args | grep '[c]loudflared'
echo "=== envfile perms ==="
ls -l "$ENVFILE"
echo
echo "Verify the tunnel reconnected (expect 4 healthy connections):"
echo "  journalctl -u cloudflared -n 20 --no-pager"
echo "Rollback if needed:"
echo "  mv $UNIT.bak $UNIT && systemctl daemon-reload && systemctl restart cloudflared"
