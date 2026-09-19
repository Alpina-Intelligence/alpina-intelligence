---
description: "Never run `drizzle-kit migrate` from CI or scripts — it exits 0 without applying when it cannot prompt"
condition: "drizzle-kit migrate"
scope: "tool:edit(*.yml), tool:edit(*.yaml), tool:edit(package.json), tool:edit(justfile), tool:write(*.yml), tool:write(*.yaml), tool:write(package.json), tool:write(justfile)"
interruptMode: never
---

`drizzle-kit migrate` is interactive. Without a TTY it exits 0 and applies nothing — a silent no-op in CI.

## Use

The programmatic migrator, which is what `apps/www` already wires as `db:migrate`:

```sh
bun run src/db/migrate.ts     # drizzle-orm/migrator, fails loudly
```

Migrations run from CI as `<db>_migrator` (ADR-0005), never a laptop; the Worker's `<db>_svc` role has no DDL rights.
