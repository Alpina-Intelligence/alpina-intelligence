# Reference — the previous stack

Kept for **reference only**. None of this is live, and none of it should be followed as
a runbook: the philosophy here (one big compose file, config hand-shipped by CI, apps
connecting as the Postgres superuser) is precisely what the current design moves away
from. Read it to see what was tried and why the shape changed.

The full history of that stack is at the tag **`archive/uip-final`**.

## `uip-infra/`

The old `infra/` directory. It was **gitignored** — the only part of the previous stack
that wasn't in version control, which is why it's copied in here rather than left to
`git checkout`. Contents:

| File | What it did | Why it's interesting |
| --- | --- | --- |
| `ensure-databases.sql` | Idempotent `CREATE DATABASE` per project, re-run on every deploy | **Direct prior art** for `infra/postgres/provision-db.sh`. The `SELECT … WHERE NOT EXISTS \gexec` trick is borrowed from it verbatim. |
| `docker-compose.yml` | Every service — `db`, `mlflow`, and all four apps — in one file | Shows the coupling that pushed us to k3s: adding an app meant editing a file shared by every project. |
| `bootstrap-vps.sh` | One-shot VPS setup, generated the superuser password | Same job as the install section of `infra/postgres/README.md`. |
| `README.md` | The old deploy model | Documents the SHA-pinned `<APP>_TAG` in `/opt/alpina/.env` rollback scheme. |

### The gap worth noting

`ensure-databases.sql` creates databases but **no roles** — every app connected as the
`alpina` superuser, and nothing revoked the default `PUBLIC` CONNECT grant, so every
app could read every other app's database. `provision-db.sh` exists to close exactly
that gap: one role per project, `REVOKE CONNECT … FROM PUBLIC`, per-role connection
limits.
