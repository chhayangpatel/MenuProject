# Technical Guide — for Developers

Everything about the MenuProject codebase: architecture, schema, workflows, deployment, and how to extend it.

## Stack

| Layer | Technology |
|---|---|
| Static site generator | **Astro 7** |
| UI islands | **React 19** (only where interactivity is needed) |
| Styling | **Tailwind CSS 4** + CSS custom properties per restaurant |
| Animations | **Framer Motion 13** (React) + vanilla IntersectionObserver (scroll) |
| Data validation | **Zod 4** at build time |
| Icons | Lucide React + inline thin-stroke SVGs |
| Deploy | GitHub Actions → **GitHub Pages** + Cloudflare Pages (see [Cloudflare setup](08-cloudflare-setup.md)) |

## Repository layout

```
docs/                          ← Documentation (business + technical)
public/                        ← Static assets (favicon, shared textures)
restaurants/                   ← ONE FOLDER PER RESTAURANT
  <slug>/
    config.json                ← the entire restaurant as validated JSON
    assets/                    ← logo, cover, menu images
scripts/                       ← CLI tooling (new-restaurant, validate, contrast)
src/
  schemas/restaurant.schema.ts ← Zod schema (the contract for config.json)
  lib/
    loadRestaurants.ts         ← build-time reader + backward-compat migration
    theme.ts                   ← generates CSS vars + Google Fonts link
    moodPresets.ts             ← 5 design presets (fonts, motifs, textures)
    hours.ts, formatCurrency.ts, parallax.ts,
    textScramble.ts, swipeNav.ts, magnetic.ts
  components/                  ← Astro + React (island) components
  layouts/RestaurantLayout.astro
  pages/
    index.astro                ← directory of restaurants
    r/[slug]/index.astro       ← one page per restaurant
```

## Key design decisions

1. **Everything is derived from `config.json`.** A restaurant is data, not code. Adding a folder = adding a restaurant.
2. **Zod validates at build time.** Bad configs fail the build loudly rather than breaking in production.
3. **Scroll animations are vanilla JS.** `IntersectionObserver` in Astro `<script>` blocks — no React hydration cost on the critical path.
4. **Backward compatibility by design.** New schema fields are `.optional()` with `.default()`; `loadRestaurants.ts` migrates old shapes (e.g. flat hours → structured hours) automatically.

## Guides

1. [Architecture overview](01-architecture.md)
2. [JSON schema reference](02-schema-reference.md)
3. [Development workflow](03-development-workflow.md)
4. [Deployment (GitHub Pages)](04-deployment.md)
5. [Extending the platform](05-extending.md)
6. [Cloudflare setup (Pages site + admin worker)](08-cloudflare-setup.md)
