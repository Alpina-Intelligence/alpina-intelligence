---
name: alpina-frontend
description: Build distinctive frontend interfaces for alpina-intelligence projects using shadcn/ui, Tailwind CSS v4, and TanStack Start. Use this skill when creating pages, components, themes, or any UI work. Ensures proper typography with Google Fonts, CSS variable theming, and avoids generic AI aesthetics.
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

## Tech Stack

| Technology | Purpose |
| ------------ | --------- |
| **TanStack Start** | Full-stack React framework with SSR |
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

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Alternative |
| -------------- | -------------- | ------------- |
| System fonts only | Looks AI-generated | Use Google Fonts |
| Purple gradient hero | Overused AI cliché | Pick theme-appropriate colors |
| Missing body fonts | Only headings change | Apply `--font-body` to body |
| Flat solid backgrounds | Lacks atmosphere | Add texture, patterns |
| Generic card shadows | Cookie-cutter feel | Theme-specific effects |
| Even color distribution | Timid, unfocused | Bold dominant + accents |
