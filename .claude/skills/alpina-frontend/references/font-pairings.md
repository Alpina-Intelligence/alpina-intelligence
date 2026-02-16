# Curated Google Font Pairings

Distinctive font combinations for different project aesthetics. Each pairing includes a **display font** (headings) and **body font** (text).

## Playful / Cartoon

| Display | Body | Vibe |
|---------|------|------|
| **Bangers** | Nunito | Comic book energy |
| **Fredoka** | Quicksand | Friendly, rounded |
| **Boogaloo** | Varela Round | Retro fun |
| **Luckiest Guy** | Rubik | Bold playful |
| **Pacifico** | Poppins | Casual script |

### Example Import
```css
@import url('https://fonts.googleapis.com/css2?family=Bangers&family=Nunito:wght@400;500;600;700&display=swap');

[data-theme='playful'] {
  --font-display: 'Bangers', cursive;
  --font-body: 'Nunito', sans-serif;
}
```

---

## Professional / Editorial

| Display | Body | Vibe |
|---------|------|------|
| **Playfair Display** | Source Sans 3 | Classic editorial |
| **Cormorant Garamond** | Lato | Elegant serif |
| **DM Serif Display** | DM Sans | Modern editorial |
| **Libre Baskerville** | Open Sans | Traditional |
| **Merriweather** | Source Sans 3 | Readable luxury |

### Example Import
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+3:wght@400;500;600&display=swap');

[data-theme='professional'] {
  --font-display: 'Playfair Display', serif;
  --font-body: 'Source Sans 3', sans-serif;
}
```

---

## Retro-Futuristic / Synthwave

| Display | Body | Vibe |
|---------|------|------|
| **Orbitron** | Exo 2 | Sci-fi digital |
| **Audiowide** | Rajdhani | Cyber tech |
| **Electrolize** | Outfit | Clean future |
| **Oxanium** | Space Grotesk | Gaming tech |
| **Michroma** | Titillium Web | Space age |

### Example Import
```css
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Exo+2:wght@400;500;600&display=swap');

[data-theme='synthwave'] {
  --font-display: 'Orbitron', sans-serif;
  --font-body: 'Exo 2', sans-serif;
}
```

---

## Athletic / Industrial

| Display | Body | Vibe |
|---------|------|------|
| **Bebas Neue** | IBM Plex Sans | Sports broadcast |
| **Oswald** | Source Sans 3 | Athletic bold |
| **Anton** | Work Sans | Impact headlines |
| **Teko** | Barlow | Industrial sports |
| **Big Shoulders Display** | Inter Tight | Modern athletic |

### Example Import
```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

[data-theme='athletic'] {
  --font-display: 'Bebas Neue', sans-serif;
  --font-body: 'IBM Plex Sans', sans-serif;
}
```

---

## Vintage / Nostalgic

| Display | Body | Vibe |
|---------|------|------|
| **Righteous** | Libre Baskerville | 70s groovy |
| **Abril Fatface** | Crimson Text | Victorian poster |
| **Lobster** | Josefin Sans | Retro script |
| **Passion One** | Old Standard TT | Vintage bold |
| **Alfa Slab One** | Quattrocento Sans | Slab retro |

### Example Import
```css
@import url('https://fonts.googleapis.com/css2?family=Righteous&family=Libre+Baskerville:wght@400;700&display=swap');

[data-theme='vintage'] {
  --font-display: 'Righteous', cursive;
  --font-body: 'Libre Baskerville', serif;
}
```

---

## Usage Checklist

After selecting fonts:

1. **Import at top of CSS file**
   ```css
   @import url('https://fonts.googleapis.com/css2?family=...');
   ```

2. **Define CSS variables per theme**
   ```css
   [data-theme='your-theme'] {
     --font-display: 'DisplayFont', fallback;
     --font-body: 'BodyFont', fallback;
   }
   ```

3. **Apply to elements**
   ```css
   body {
     font-family: var(--font-body);
   }

   h1, h2, h3, h4, h5, h6, .font-display {
     font-family: var(--font-display);
   }
   ```

4. **Map in Tailwind @theme inline**
   ```css
   @theme inline {
     --font-sans: var(--font-body);
     --font-display: var(--font-display);
   }
   ```
