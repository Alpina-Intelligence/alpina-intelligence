# Host configuration (the VPS itself)

Settings that belong to the machine rather than to any service running on it. Small by
design — most of the box's behaviour lives in `infra/postgres/` and `infra/cloudflared/`.

| File | Deployed to | Role |
| --- | --- | --- |
| `52unattended-upgrades-local` | `/etc/apt/apt.conf.d/` | Reboot policy for unattended security upgrades. |

## Install

```bash
scp infra/host/52unattended-upgrades-local root@<vps>:/etc/apt/apt.conf.d/
ssh root@<vps> 'unattended-upgrade --dry-run --debug 2>&1 | head -5'   # parses config
```

## Patching model

`unattended-upgrades` installs security updates on its own; `APT::Periodic::Unattended-Upgrade "1"`
is already set by the distro. What was missing was the reboot that makes kernel and libc
updates take effect — see the rationale in the drop-in itself.

Checking where the box stands:

```bash
uname -r                                    # what is RUNNING
dpkg -l 'linux-image-*' | awk '/^ii/{print $2}'   # what is INSTALLED
ls /var/run/reboot-required                 # flag set when they diverge
cat /var/run/reboot-required.pkgs           # and why
```

If `uname -r` doesn't match the newest installed `linux-image-*`, the box is carrying
patches it isn't running. That's the state this config exists to prevent.

**Not covered:** non-security upgrades. Those accumulate (47 pending as of 2026-08-01) and
are applied deliberately with `apt-get upgrade`, not automatically — the same reasoning as
`--no-autoupdate` on cloudflared. Review them when touching the box for other reasons.
