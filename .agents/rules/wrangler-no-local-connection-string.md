---
description: "Never put `localConnectionString` in a committed wrangler.jsonc — local Hyperdrive origins come from the env var"
condition: "localConnectionString"
scope: "tool:edit(wrangler.jsonc), tool:edit(wrangler.json), tool:edit(wrangler.toml), tool:write(wrangler.jsonc), tool:write(wrangler.json), tool:write(wrangler.toml)"
interruptMode: never
---

`wrangler.jsonc` is committed. A `localConnectionString` on a `hyperdrive` binding is a database URL in git.

## Use

Feed the binding locally through the environment instead (ADR-0005 §7):

```sh
# .envrc (gitignored)
export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="postgres://www_svc:…@127.0.0.1:5434/www"
```

App code reads `env.HYPERDRIVE.connectionString` everywhere — no tier branching.
