# CSS Variables Reference

Complete template for shadcn/ui theming with Tailwind CSS v4.

## Required Token Set

shadcn/ui components require these CSS custom properties:

```css
[data-theme='theme-name'] {
  /* Base colors */
  --background: oklch(0.98 0 0);
  --foreground: oklch(0.1 0 0);

  /* Card surfaces */
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.1 0 0);

  /* Popover/dropdown surfaces */
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.1 0 0);

  /* Primary action color */
  --primary: oklch(0.5 0.2 260);
  --primary-foreground: oklch(0.98 0 0);

  /* Secondary/subtle actions */
  --secondary: oklch(0.95 0.02 260);
  --secondary-foreground: oklch(0.2 0 0);

  /* Muted/disabled states */
  --muted: oklch(0.95 0 0);
  --muted-foreground: oklch(0.5 0 0);

  /* Accent highlights */
  --accent: oklch(0.95 0.02 260);
  --accent-foreground: oklch(0.2 0 0);

  /* Destructive/error states */
  --destructive: oklch(0.55 0.25 25);
  --destructive-foreground: oklch(0.98 0 0);

  /* Borders and inputs */
  --border: oklch(0.9 0 0);
  --input: oklch(0.9 0 0);
  --ring: oklch(0.5 0.2 260);

  /* Chart colors (optional) */
  --chart-1: oklch(0.6 0.2 220);
  --chart-2: oklch(0.6 0.2 160);
  --chart-3: oklch(0.6 0.2 300);
  --chart-4: oklch(0.6 0.2 40);
  --chart-5: oklch(0.6 0.2 80);

  /* Typography */
  --font-display: 'Display Font', fallback;
  --font-body: 'Body Font', fallback;

  /* Border radius */
  --radius: 0.5rem;

  /* Sidebar (if using) */
  --sidebar: oklch(0.98 0 0);
  --sidebar-foreground: oklch(0.1 0 0);
  --sidebar-primary: oklch(0.5 0.2 260);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  --sidebar-accent: oklch(0.95 0.02 260);
  --sidebar-accent-foreground: oklch(0.2 0 0);
  --sidebar-border: oklch(0.9 0 0);
  --sidebar-ring: oklch(0.5 0.2 260);
}
```

---

## oklch Color Guide

```
oklch(L C H)
       │ │ │
       │ │ └─ Hue: 0-360 (color wheel position)
       │ └─── Chroma: 0-0.4+ (saturation intensity)
       └───── Lightness: 0-1 (dark to light)
```

### Common Hue Values
| Hue | Color |
|-----|-------|
| 0 | Red |
| 30 | Orange |
| 60 | Yellow |
| 120 | Green |
| 180 | Cyan |
| 220 | Blue |
| 260 | Purple |
| 300 | Magenta |
| 330 | Pink |

### Chroma Guidelines
- **0**: Neutral gray
- **0.05-0.1**: Subtle tint
- **0.15-0.25**: Visible color
- **0.3+**: Vivid/saturated

---

## Tailwind @theme inline Mapping

Map CSS variables to Tailwind tokens:

```css
@theme inline {
  /* Typography */
  --font-sans: var(--font-body);
  --font-display: var(--font-display);

  /* Colors */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  /* Border radius */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

---

## Font Application (Critical)

**This is the most commonly missed step!**

After defining `--font-body` and `--font-display`, you MUST apply them:

```css
/* Apply body font to document */
body {
  font-family: var(--font-body);
}

/* Apply display font to headings */
h1, h2, h3, h4, h5, h6, .font-display {
  font-family: var(--font-display);
}
```

This ensures:
1. Body text changes when theme switches
2. shadcn/ui components inherit `--font-body` via `font-sans`
3. Headings get distinctive display typography

---

## Complete Theme Example

```css
/* 1. Import fonts */
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

/* 2. Define theme tokens */
[data-theme='athletic'] {
  /* Colors */
  --background: oklch(0.97 0.01 220);
  --foreground: oklch(0.15 0 0);
  --card: oklch(1 0 0 / 0.8);
  --card-foreground: oklch(0.15 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.15 0 0);
  --primary: oklch(0.55 0.2 220);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.55 0.25 25);
  --secondary-foreground: oklch(0.98 0 0);
  --muted: oklch(0.92 0.01 220);
  --muted-foreground: oklch(0.45 0 0);
  --accent: oklch(0.92 0.02 220);
  --accent-foreground: oklch(0.15 0 0);
  --destructive: oklch(0.55 0.25 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.88 0.02 220);
  --input: oklch(0.88 0.02 220);
  --ring: oklch(0.55 0.2 220);

  /* Typography */
  --font-display: 'Bebas Neue', sans-serif;
  --font-body: 'IBM Plex Sans', sans-serif;

  --radius: 0.375rem;
}

/* 3. Apply fonts to elements */
body {
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6, .font-display {
  font-family: var(--font-display);
}

/* 4. Map in @theme inline */
@theme inline {
  --font-sans: var(--font-body);
  --font-display: var(--font-display);
  /* ... other mappings */
}
```

---

## Verification Checklist

After setting up themes:

- [ ] Fonts imported via `@import url(...)`
- [ ] `--font-body` defined for each theme
- [ ] `--font-display` defined for each theme
- [ ] `body { font-family: var(--font-body) }` in base styles
- [ ] Headings use `var(--font-display)`
- [ ] `@theme inline` maps `--font-sans: var(--font-body)`
- [ ] Theme switching changes BOTH body AND heading fonts
- [ ] shadcn components inherit the theme font (check Button, Card text)
