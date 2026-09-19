---
description: "Icons are Phosphor-only in every alpina frontend — never import from `lucide-react`"
condition: "lucide-react"
scope: "tool:edit(*.tsx), tool:edit(*.ts), tool:write(*.tsx), tool:write(*.ts)"
interruptMode: never
---

Every alpina frontend uses `@phosphor-icons/react`. `lucide-react` is banned, even though `components.json` still says `lucide` (shadcn has no phosphor option).

## Why

- One icon voice per app, set once via `IconContext.Provider` (`weight: "bold"`) in `__root.tsx`.
- Two icon libraries double the bundle for no visual gain.

## Avoid

```tsx
import { ChevronDownIcon } from "lucide-react";
```

## Use

```tsx
// Alias to the *Icon name the generated shadcn body already uses.
import { CaretDown as ChevronDownIcon } from "@phosphor-icons/react";
```

Landing a `shadcn add` includes swapping its generated lucide imports for Phosphor equivalents. Emphasis states override `weight` per icon; the default voice stays in the provider.
