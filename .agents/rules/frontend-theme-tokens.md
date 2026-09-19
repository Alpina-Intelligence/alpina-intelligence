---
description: "Theming is token-only — components use semantic utilities, never literal colors or Tailwind palette classes"
condition: "#[0-9a-fA-F]{3,8}\\b|\\b(?:oklch|rgba?|hsla?)\\(|\\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|shadow|decoration|accent|caret|divide)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b"
scope: "tool:edit(*.tsx), tool:write(*.tsx)"
interruptMode: never
---

Components speak semantic tokens (`bg-background`, `text-primary`, `border-border`, `text-muted-foreground`). Palettes live only in the CSS-variable blocks of the app's `styles.css`.

## Why

- Themes are swapped by CSS vars: `:root`/`.dark` is the default (lagoon), `[data-theme='<name>']` (composing with `.dark`) are alternates. A literal color in a component is invisible to every theme.
- Mode/theme persist as cookies (`theme-mode`, `theme-name`) and are applied before first paint by the inline script in `__root.tsx`; hardcoded colors flash or mismatch.

## Avoid

```tsx
<div className="bg-[#0f766e] text-slate-100" style={{ borderColor: "oklch(0.5 0.08 200)" }}>
```

## Use

```tsx
<div className="bg-primary text-primary-foreground border-border">
```

Need a new color? Add a semantic token to every palette block in `styles.css`, then use it. Adding a theme = two var blocks + the name in `ThemeControls`.

## Exceptions

- `styles.css` itself (not matched by this rule).
- Data-driven fills in charts/diagrams that consume a token via `var(--…)` — still no literals.
