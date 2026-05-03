---
name: alpina-frontend
description: Build distinctive frontend interfaces for alpina-intelligence projects using shadcn/ui, Tailwind CSS v4, and the TanStack stack (Start or Router). Use this skill when creating pages, components, themes, or any UI work. Ensures proper typography with Google Fonts, CSS variable theming, and avoids generic AI aesthetics.
allowed-tools: mcp__shadcn__search_items_in_registries, mcp__shadcn__view_items_in_registries, mcp__shadcn__get_item_examples_from_registries, mcp__shadcn__get_add_command_for_items
---

# Alpina Frontend Design System

This skill guides the creation of distinctive, production-grade frontend interfaces for alpina-intelligence projects. It ensures consistent use of our tech stack while avoiding generic "AI slop" aesthetics.

## When to Use This Skill

Use this skill when:

- Creating new pages or routes
- Building UI components
- Designing themes or color schemes
- Setting up typography systems
- Styling existing components
- Any frontend/UI work in this monorepo

## Pick Your TanStack Flavor

Frontend projects use one of two TanStack flavors. Pick based on the project's needs:

| Project type | Use | Why |
| --- | --- | --- |
| SEO-driven content site (marketing, blog, docs) | **TanStack Start** | SSR for crawlability and first-paint |
| SPA bound for PWA / Capacitor / native | **TanStack Router** (no Start) | Static client bundle, no Node runtime required |
| Internal tools, dashboards behind auth | Either; default Router | SEO doesn't matter; SPA is simpler |

Most rules in this skill apply to both flavors. Framework-specific items are clearly marked **Start-only** or **Router-only**.

| Project | Flavor |
| --- | --- |
| `projects/alpina-site` | TanStack Start |
| `projects/puck-prophet` | TanStack Start |
| `projects/ebook/frontend` (planned) | TanStack Router |

## Tech Stack

| Technology | Purpose |
| ------------ | --------- |
| **TanStack Start** *or* **Router** | See "Pick Your TanStack Flavor" above |
| **Tailwind CSS v4** | Utility-first CSS with `@theme inline` blocks |
| **shadcn/ui** | Component library consuming CSS variables |
| **oklch colors** | Perceptually uniform color space |
| **Google Fonts** | Distinctive typography |

## Critical: Typography Setup

### Font Variables (REQUIRED)

Every theme MUST define these CSS variables:

```css
[data-theme='theme-name'] {
  --font-display: 'Display Font', fallback;
  --font-body: 'Body Font', fallback;
}
```

### Font Application (REQUIRED)

The fonts MUST be applied to actual elements:

```css
body {
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6, .font-display {
  font-family: var(--font-display);
}
```

### Tailwind Mapping (REQUIRED)

Map the variables in `@theme inline`:

```css
@theme inline {
  --font-sans: var(--font-body);
  --font-display: var(--font-display);
}
```

This ensures shadcn/ui components (which use `font-sans`) inherit theme fonts.

### Google Fonts Import

**CRITICAL**: Google Fonts `@import url(...)` statements MUST come BEFORE `@import 'tailwindcss'`. When Tailwind expands during build, any `@import` after it violates CSS spec and causes build errors.

```css
/* ✅ CORRECT ORDER */
@import url('https://fonts.googleapis.com/css2?family=DisplayFont&family=BodyFont&display=swap');
@import 'tailwindcss';
@import 'tw-animate-css';

/* ❌ WRONG - causes "@import must precede all other statements" error */
@import 'tailwindcss';
@import url('https://fonts.googleapis.com/css2?...');
```

See [references/font-pairings.md](./references/font-pairings.md) for curated combinations.

## Color System

### Use oklch Colors

oklch provides perceptually uniform colors - equal changes in values produce equal perceived changes:

```css
--primary: oklch(0.6 0.25 260);
/*         L    C     H
           |    |     |
           |    |     Hue (0-360)
           |    Chroma (saturation, 0-0.4+)
           Lightness (0-1)
*/
```

### Required Color Tokens

shadcn/ui requires these tokens. Define all of them:

```css
--background / --foreground
--card / --card-foreground
--popover / --popover-foreground
--primary / --primary-foreground
--secondary / --secondary-foreground
--muted / --muted-foreground
--accent / --accent-foreground
--destructive / --destructive-foreground
--border / --input / --ring
```

See [references/css-variables.md](./references/css-variables.md) for complete templates.

### Theme Selectors

Use data attributes for theme switching:

```css
[data-theme='light'] { /* light theme tokens */ }
[data-theme='dark'] { /* dark theme tokens */ }
[data-theme='custom'] { /* custom theme tokens */ }
```

## Visual Design Principles

### Typography: Be Distinctive

**DO**: Choose characterful fonts that match the project's personality

- Playful: Bangers, Fredoka, Nunito
- Professional: Playfair Display, Source Serif, DM Sans
- Futuristic: Orbitron, Exo 2, Rajdhani
- Athletic: Bebas Neue, Oswald, IBM Plex Sans
- Vintage: Righteous, Libre Baskerville

**DON'T**: Use generic fonts

- Inter, Roboto, Arial, system-ui (as primary choices)
- These scream "AI generated"

### Color: Commit to Bold Choices

**DO**:

- Pick a dominant color with sharp accents
- Use high chroma for primary actions
- Create contrast between elements

**DON'T**:

- Purple gradients on white (AI cliché)
- Evenly-distributed, timid palettes
- Low-contrast, washed-out colors

### Texture: Create Atmosphere

**DO**: Add depth with:

- Background patterns (dots, grids, noise)
- Gradient overlays
- Subtle shadows and glows
- Card borders and effects

**DON'T**:

- Plain solid color backgrounds
- Flat, textureless surfaces
- Generic drop shadows

### Motion: Purposeful Animation

**DO**:

- Page load reveals with staggered delays
- Meaningful hover state changes
- Theme-appropriate timing (bouncy vs elegant)

**DON'T**:

- Animation for animation's sake
- Jarring or distracting motion
- Inconsistent timing

## Component Guidelines

### Using shadcn/ui

1. **Search first**: Use `mcp__shadcn__search_items_in_registries` to find components
2. **Install via CLI**: `bunx --bun shadcn@canary add <component>`
3. **Don't modify installed components** - they update from the registry
4. **Extend with wrapper components** if customization needed

### Form Element Rules

**Always use shadcn/ui components instead of native HTML elements:**

| Native Element | shadcn Replacement | Import |
| -------------- | ------------------ | ------ |
| `<input>` | `<Input>` | `@/components/ui/input` |
| `<button>` | `<Button>` | `@/components/ui/button` |
| `<label>` | `<Label>` | `@/components/ui/label` |
| `<select>` | `<Select>` (Radix) | `@/components/ui/select` |
| checkbox | `<Switch>` or `<Checkbox>` | `@/components/ui/switch` |

**Why not native elements?** Native form elements render browser-chrome UI (dropdown popups, spinners, checkboxes) that ignores CSS theming. In dark themes, this means white backgrounds, blue highlights, and grey spinners.

**Select components:** Use `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` from `@/components/ui/select` (Radix-based). Do NOT use `NativeSelect` — it wraps a native `<select>` whose dropdown popup cannot be styled.

**Number inputs:** Use `type="text"` with `inputMode="decimal"` and regex filtering instead of `type="number"`:
- `type="number"` shows unstyled browser spinners and has quirky backspace behavior (leading zeros)
- Hide spinners: `[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`
- Filter input with regex: `if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;`
- Reset to original value on blur if empty/invalid

### Form Validation (react-hook-form + zod)

All forms use react-hook-form with zod schemas and shadcn `Field` layout components.

**Standard pattern:**
```tsx
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { mySchema, type MyData } from "@/lib/schemas/my-schema";

const form = useForm<MyData>({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
});

<form onSubmit={form.handleSubmit(onSubmit)}>
  <FieldGroup>
    <Controller
      name="fieldName"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="field-id">Label</FieldLabel>
          <Input {...field} id="field-id" aria-invalid={fieldState.invalid} />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  </FieldGroup>
</form>
```

**Key rules:**
- Define zod schemas in `src/lib/schemas/` — reuse in both client forms and server function `inputValidator`
- Use `Controller` from react-hook-form (not `register`) for shadcn components
- Wrap fields in `Field`/`FieldLabel`/`FieldError` from `@/components/ui/field`
- Set `data-invalid` on `Field` and `aria-invalid` on inputs for styling
- Server function validators: `.inputValidator((d: unknown) => schema.parse(d))`

### Data Fetching (TanStack Query)

All data fetching uses TanStack Query with `queryOptions()` helpers defined in `src/lib/queries/`.

**Route loader + component pattern:**
```tsx
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { myQuery } from "@/lib/queries/my-domain";

export const Route = createFileRoute("/my-route")({
  loader: ({ context }) => context.queryClient.ensureQueryData(myQuery()),
  component: MyPage,
});

function MyPage() {
  const { data } = useSuspenseQuery(myQuery());
  // ...
}
```

**Mutations:**
```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (data) => updateSomething({ data }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: myKeys.all }),
});
```

**Key rules:**
- Define query key factories per domain in `src/lib/queries/`
- Use `ensureQueryData` in loaders (SSR-safe), `useSuspenseQuery` in components
- Use `useMutation` for writes — provides `isPending`/`isError` states
- Invalidate related queries after mutations
- Use `refetchInterval` for polling instead of `setInterval` + `router.invalidate()`

### TanStack Start-only Gotchas

Applies only to projects using TanStack Start (SSR + server functions). Skip for pure-Router SPAs.

- **No RSC support yet.** Don't use `'use client'` or `'use server'` directives — they're not recognized.
- **Use `useId()` for form field IDs** to avoid SSR hydration mismatches; never hardcode IDs.
- **Server functions must return plain serializable data.** `db.execute()` returns a pg `Result` object that crashes seroval — extract `.rows` before returning.
- **Loader data must be serializable** (no React components, functions, or class instances). For non-serializable data like MDX components, access them directly in the route component via eager `import.meta.glob` — not through the loader. This preserves SSR without `useEffect` hacks.

### TanStack Router-only Patterns

Applies only to projects using plain TanStack Router (SPA, no Start). The TanStack Query patterns above work identically in both.

- **No SSR, no server functions, no `useId` requirement.** Same API surface as Start minus the server runtime.
- **Talk to a remote API.** All data calls go through `fetch` (typically wrapped in `queryOptions`) to a separate hosted backend — never import `@/db` or server-only code into route files. For new full-stack products, the backend lives at `projects/<product>/backend/`.
- **Configure the API base URL via env.** Use `VITE_API_URL` (or similar `VITE_*` prefix) so the same client bundle works in dev, deployed web, PWA, and Capacitor.
- **`createLink()` for typed nav-as-button.** When a shadcn `Button` or `NavigationMenuItem` should navigate, wrap it with `createLink()` from `@tanstack/react-router` to get type-safe `to`/`params`/`search` props instead of raw `<a>` tags.
- **Defer the Sheet/Dialog portal-root pattern.** TanStack Router's docs describe a `<div id="portal-root">` + `RouterSheet`/`RouterDialog` wrapper pattern to fix Radix portal animation glitches on route transitions. **Don't add this preemptively** — only wire it up if you actually observe an animation issue (e.g., a Link inside an open Dialog). For most apps, raw shadcn `Dialog`/`Sheet` work fine.

### Card Styling by Theme

Cards should feel different per theme:

```css
/* Playful - offset shadow */
[data-theme='playful'] .card:hover {
  transform: rotate(0.5deg);
  box-shadow: 8px 8px 0 var(--secondary);
}

/* Professional - subtle elevation */
[data-theme='pro'] .card:hover {
  box-shadow: 0 20px 40px oklch(0 0 0 / 0.08);
}

/* Neon - glow effect */
[data-theme='neon'] .card {
  box-shadow: 0 0 20px var(--primary);
}
```

## Pre-Flight Checklist

Before finishing any frontend work, verify:

- [ ] Google Fonts `@import url()` comes BEFORE `@import 'tailwindcss'`
- [ ] `--font-body` variable defined per theme
- [ ] `--font-display` variable defined per theme
- [ ] Body element uses `font-family: var(--font-body)`
- [ ] Headings use `font-family: var(--font-display)`
- [ ] `@theme inline` maps `--font-sans: var(--font-body)`
- [ ] All shadcn color tokens defined
- [ ] Theme switching actually changes fonts (test it!)
- [ ] Visual design is distinctive, not generic
- [ ] No native `<input>`, `<select>`, `<button>`, or `<label>` — use shadcn components
- [ ] Number inputs use `type="text"` with `inputMode`, not `type="number"`
- [ ] Dropdowns use Radix `Select`, not `NativeSelect`
- [ ] Forms use react-hook-form + zod (not manual useState)
- [ ] Zod schemas defined in `src/lib/schemas/`
- [ ] Server function validators use `.parse()` not identity functions
- [ ] Data fetching uses `queryOptions()` + `useSuspenseQuery`, not direct server fn calls
- [ ] Mutations use `useMutation` with cache invalidation, not manual `router.invalidate()`

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Alternative |
| -------------- | -------------- | ------------- |
| System fonts only | Looks AI-generated | Use Google Fonts |
| Purple gradient hero | Overused AI cliché | Pick theme-appropriate colors |
| Missing body fonts | Only headings change | Apply `--font-body` to body |
| Flat solid backgrounds | Lacks atmosphere | Add texture, patterns |
| Generic card shadows | Cookie-cutter feel | Theme-specific effects |
| Even color distribution | Timid, unfocused | Bold dominant + accents |
| Native `<select>` | Browser dropdown ignores theme | Use Radix `Select` component |
| Native `<input type="number">` | Grey spinners, leading zeros | `type="text"` + `inputMode="decimal"` |
| Native `<button>` | Inconsistent styling | Use shadcn `Button` variants |
| Manual `useState` for forms | No validation, fragile | react-hook-form + zod |
| Identity input validators | No runtime checks | `schema.parse(d)` with zod |
| Direct server fn in loader | No caching, no background refetch | `ensureQueryData(myQuery())` |
| `router.invalidate()` after mutation | Refetches everything | `queryClient.invalidateQueries()` |
| `setInterval` + `router.invalidate()` | No stale-while-revalidate | `refetchInterval` on query |
| `useState` for mutation loading | Manual state management | `useMutation` `isPending` |
