# Architecture Overview

## Data flow

```
config.json (restaurants/<slug>/)
        │
        ▼
Zod validation (src/schemas)          ← fails build on invalid config
        │
        ▼
loadRestaurants.ts                    ← reads all folders, migrates old shapes
        │
        ▼
Astro static generation (pages/r/[slug]/index.astro)
        │
        ├── getThemeStyles()          → inline <style> with CSS vars + fonts
        ├── Astro components         → server-rendered (no JS runtime needed)
        └── React islands  (client:load) → hydrate only interactive parts
        │
        ▼
dist/  →  GitHub Pages
```

## Build-time vs runtime

**Build time (Node):**
- Read every `restaurants/<slug>/config.json`
- Validate with Zod → any failure aborts the build
- Generate one static HTML page per restaurant
- Inject per-restaurant CSS variables + Google Fonts `<link>`

**Runtime (browser):**
- `ClientRouter` for View Transitions between pages
- React islands hydrate: `ItemDetailSheet`, `SearchFilterBar`, `DirectorySearch`
- Vanilla JS `<script>` blocks handle scroll reveal, swipe nav, card tilt, text scramble, header scroll-progress, magnetic buttons — **no React involved**
- Menu data injected once via `window.__RESTAURANT_ITEMS__` for the detail sheet

## Theming model

Three layers combine to style a page:

1. **Mood preset** (`src/lib/moodPresets.ts`) — the default personality: heading font, body font, radius, divider motif, optional texture, plus the *behavior* of animations (fine-dining = slow/gentle, bold-street = punchy).
2. **Theme override** (`theme.{primaryColor,secondaryColor,accentColor,fontHeading,fontBody,borderRadius,mode}`) — per-restaurant colors that win over preset defaults.
3. **Inline CSS variables** (`theme.ts`) — everything at runtime reads `var(--color-primary)`, `var(--font-heading)`, `var(--radius)`, `--ease-*`, `--text-*`, etc. Components are theme-agnostic.

## Animation strategy

| Layer | Mechanism | Respects reduced-motion |
|---|---|---|
| Scroll reveal (menu items) | `IntersectionObserver` + `.revealed` class | ✅ |
| Text scramble (headings) | rAF loop, guarded by `prefers-reduced-motion` | ✅ |
| Swipe nav (mobile) | `touchstart`/`touchend`, `scrollIntoView` | ✅ |
| 3D card tilt | `mousemove`, transform only | ✅ |
| Header pill / progress | `scroll` listener, transform/width on fixed el | ✅ |
| Magnetic buttons | `mousemove`, transform only | n/a (pointer devices) |
| Parallax (`data-parallax`) | `mousemove` at document level, rAF-throttled | ✅ |

**Rules enforced across the repo:**
- Only `transform` and `opacity` are animated in scroll paths — no layout triggers.
- `backdrop-blur` appears only on the fixed/sticky header pill and modal overlay.
- Custom cubic-bezier motion curves only — no `linear`/`ease-in-out`.

## Isolation

- Each restaurant is a static page under its own URL `/r/<slug>/`. Configs are validated independently — a broken `bella-italia.json` fails the build but does not corrupt another restaurant's data.
- Shared components render from the per-restaurant CSS variables, so restaurants stay visually distinct without forks.

## Cost / size budget

- React islands must stay under **50KB gzipped combined** per page (currently: detail sheet + search bar + directory search).
- Item photos are referenced by path; keeping them small is a data responsibility (see [business image guide](../business/06-images.md)).