---
description: "shadcn base library is Base UI — compose with the `render` prop, never Radix `asChild`"
condition: "\\basChild\\b"
scope: "tool:edit(*.tsx), tool:write(*.tsx)"
interruptMode: never
---

Every alpina frontend runs shadcn on **Base UI** (`@base-ui/react`, `base-*` styles), not Radix. Base UI has no `asChild`; composition is the `render` prop.

## Why

- `asChild` is a Radix Slot API. On Base UI it is an unknown prop that silently lands on the DOM element.
- Mixing Radix snippets into a Base UI tree breaks focus management and accessibility wiring.

## Avoid

```tsx
<Button asChild>
  <Link to="/docs">Docs</Link>
</Button>
```

## Use

```tsx
<Button render={<Link to="/docs" />}>Docs</Button>
```

Details and edge cases: `.agents/skills/shadcn/rules/base-vs-radix.md`.
