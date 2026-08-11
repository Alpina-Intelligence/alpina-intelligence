> **DEPRECATED 2026-08-11 (ADR-0003).** HTTP ingress moved to Cloudflare
> Workers; `cloudflared` is stopped and disabled on the VPS (unit + env file
> left in place). The wildcard DNS record should be deleted from the zone.
> A tunnel may return in a narrower shape — TCP-only, as a Hyperdrive origin
> for the VPS Postgres — under its own ADR. Everything below describes the
> deprecated HTTP-ingress design.

# cloudflared (host service on the VPS)

The tunnel connector. It is the **only** path from the internet to this box — no inbound
port but `:22` is open — so everything every project serves goes through this process.

Runs as a systemd unit on the Hetzner host, outside k3s. Deployed to
`/opt/platform/cloudflared/`; the unit itself lives at
`/etc/systemd/system/cloudflared.service`.

## What's here

| File | Role |
| --- | --- |
| `cloudflared.service` | systemd unit — token via `EnvironmentFile`, never on the command line. |
| `.env.example` | Shape of the connector token; the real file lives only on the box. |
| `migrate-token-to-envfile.sh` | One-shot, idempotent move of an inline `--token` into that file. |

## Remotely managed, deliberately

The tunnel (`alpina-server`, `de93facd-807f-4d47-8342-9da76c885b24`) reports
`config_src: cloudflare`. There is **no `config.yml`** on the box and there shouldn't be:
ingress rules are API state, owned by Terraform as
`cloudflare_zero_trust_tunnel_cloudflared_config`.

Local config would buy git-versioned, reviewable routing — but Terraform already provides
exactly that, *and* detects drift, which a file on a box cannot. Choosing local would trade
an API call for SSH-plus-restart, split config across N replicas if the connector is ever
scaled, and add config management for a single file. The one scenario that would justify
it — a hard "no Cloudflare API credential in CI" rule — is undercut by Terraform needing
that credential for DNS regardless.

Practical consequence: **changing a route never touches this directory.** It's a Terraform
change that propagates over the existing connections, with no restart and no SSH.

## The two tokens

Easy to conflate, different in every way that matters:

| | Connector token | `CLOUDFLARE_API_TOKEN` |
| --- | --- | --- |
| Used by | `cloudflared`, continuously | Terraform, only during an apply |
| Authorizes | "I am the connector for this tunnel" | DNS + tunnel config changes |
| Lives | `/etc/cloudflared/cloudflared.env` on the box | CI secret — never on the box |

The connector token **cannot** move into CI. A daemon that must reauthenticate on every
start and reconnect can't depend on a secret that exists only during a pipeline run.

What it *can* do is stay out of the process table, which is what the unit here enforces:
`--token <value>` in `ExecStart` is readable by any local user via `ps -eo args`,
`/proc/*/cmdline` and `systemctl cat`. An `EnvironmentFile` at `0600` is not.

## Migrating an existing install

```bash
scp -r infra/cloudflared root@<vps>:/opt/platform/
ssh root@<vps> 'bash /opt/platform/cloudflared/migrate-token-to-envfile.sh'
```

It backs the unit up to `cloudflared.service.bak`, extracts the token without echoing it,
writes the env file, restarts, and prints the process table so you can confirm the token is
gone. Rollback is `mv` the backup back and `daemon-reload`.

The tunnel drops for a second or two on restart. Harmless while ingress is still the
`http_status:404` catch-all; once apps are live, it's a brief blip.

## Rotating the connector token

Worth doing if the token has ever been pasted somewhere it shouldn't live — a terminal
transcript, a chat log, a screenshot. Rotation invalidates the old value, so the box must
be updated in the same sitting:

1. **Dashboard → Networking → Tunnels → `alpina-server` → Overview → Refresh token.**
   (Not the `All / Basic Information / Connectors` detail view — the control isn't there.
   There are two tunnel UIs; this is the Core Dashboard one.) The new token is the `eyJ…`
   string inside the install command it reveals — copy it, don't run the command.
   API equivalent: `PATCH /accounts/<acct>/cfd_tunnel/<id>` with a new `tunnel_secret`,
   then `GET /cfd_tunnel/<id>/token`.
2. Write the new value into `/etc/cloudflared/cloudflared.env` (`umask 077`). Keep it out
   of shell history by piping rather than passing it as an argument:

   ```bash
   read -rs TOKEN     # paste ONLY the eyJ… string — see the warning below
   printf 'TUNNEL_TOKEN=%s\n' "$TOKEN" | ssh root@<vps> \
     'umask 077; cat > /etc/cloudflared/cloudflared.env && chmod 600 /etc/cloudflared/cloudflared.env'
   unset TOKEN
   ```

   ⚠️ **The dashboard gives you a whole install command, not a token.** `read -rs` doesn't
   echo, so pasting `cloudflared service install eyJ…` looks identical to pasting the token
   and fails later with a misleading auth error. Strip the prefix first. Validate before
   restarting — this prints nothing secret:

   ```bash
   V=$(sed -n 's/^TUNNEL_TOKEN=//p' /etc/cloudflared/cloudflared.env)
   echo "len=${#V} starts_eyJ=$(case "$V" in eyJ*) echo yes;; *) echo NO;; esac)"
   ```

   A good token is ~248 chars, starts `eyJ`, and has no spaces. It decodes to
   `{"a": <account>, "t": <tunnel>, "s": <96-char secret>}` — check `a` and `t` match this
   tunnel before blaming anything else.
3. `systemctl restart cloudflared`, then confirm 4 connections come back.

**Rotate it yourself — never through an agent or a shared terminal.** Whoever performs the
rotation necessarily sees the new secret, so a path that avoids re-exposing it has to be one
where the value goes dashboard → clipboard → box and nowhere else.

Cloudflare's zero-downtime procedure assumes **≥2 replicas** (rotate half, wait 10 min,
rotate the rest). There is one connector here, so rotation *is* a brief outage — schedule
it accordingly once apps are live. If the token is believed compromised rather than merely
over-exposed, also `DELETE /cfd_tunnel/<id>/connections` to drop any unauthorized connector.

Blast radius if leaked: an attacker could run a connector for this tunnel and receive
traffic Cloudflare routes to it. Bad — but it grants no shell, no API access, and no
ability to change routing.

## Upgrading

The unit sets `--no-autoupdate` deliberately: this process carries all traffic to the box,
and an unattended binary swap on it isn't worth the convenience. The cost is that upgrades
are a scheduled task, not a background one — check the connector's Version column in the
dashboard, which flags a stale build.

It's the apt package from `pkg.cloudflare.com`, so:

```bash
apt-get update -qq && apt-get install -y --only-upgrade cloudflared && cloudflared --version
```

`needrestart` restarts the service as part of the install. Confirm the new version reached
Cloudflare (not just the binary on disk) with `GET /cfd_tunnel/<id>` — every connection
should report the new `client_version`.

Upgrades and token rotation both need a restart. Do them in one sitting.

## Troubleshooting

**`Unauthorized: Invalid tunnel secret`** — the token on the box no longer matches
Cloudflare's. Almost always means a rotation was started (dashboard → Refresh token) and
never finished; the old token dies the moment you click it. Finish step 2 of the rotation.

Note how it presents: the logs fill with generic
`control stream encountered a failure while serving` at every retry, and the actual cause
appears **once**, several lines up, as `Register tunnel error from server side`. Grep for
`unauthor|invalid|denied` rather than reading the tail — the loud error is not the useful
one. All prechecks (DNS, QUIC, TCP, API) pass throughout, because connectivity is fine and
only auth is failing.

**Service stuck `activating`, `NRestarts` climbing** — see the `TimeoutStartSec` comment in
`cloudflared.service`. A start timeout shorter than the internal retry backoff turns any
sustained failure into an endless restart loop.

## Verifying

```bash
systemctl is-active cloudflared
ps -eo args | grep '[c]loudflared'          # token must NOT appear
journalctl -u cloudflared -n 20 --no-pager  # expect 4 registered connections
```

Live config and health, from anywhere with the API token:

```
GET /accounts/<acct>/cfd_tunnel/<id>              # status, connection count, config_src
GET /accounts/<acct>/cfd_tunnel/<id>/configurations # the live ingress rules
```
