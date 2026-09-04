# Build Prompt: Multi-Restaurant Digital Menu Platform

Use this document as a prompt to hand to an AI coding agent (Claude Code, etc.) or as an engineering spec for a developer. It assumes the PRD's decisions: **Astro + Tailwind CSS, path-based multi-tenancy, GitHub Actions → GitHub Pages, one JSON config per restaurant.**

---

## OBJECTIVE

Build a static, responsive, multi-tenant restaurant menu website. Hundreds of restaurants, each with its own URL, logo, color theme, and menu — all driven entirely by data files under `restaurants/`, with zero code changes required to add a restaurant. Must build and deploy for free via GitHub Actions to GitHub Pages.

## TECH STACK

- **Framework:** Astro (static output, `output: 'static'`)
- **Styling:** Tailwind CSS, theming via CSS custom properties injected per page
- **Validation:** Zod schemas for restaurant config, enforced at build time
- **Images:** Astro's built-in image optimization (`astro:assets`)
- **Motion & transitions:** Astro View Transitions (`<ClientRouter />`) for navigation, CSS scroll-driven animations for reveal effects, hand-rolled JS only where CSS can't do the job — animation budget kept deliberately tiny
- **CI/CD:** GitHub Actions → `actions/deploy-pages`
- **Package manager:** npm (or pnpm)
- **Language:** TypeScript throughout

## REPOSITORY STRUCTURE

```
repo-root/
├── .github/
│   └── workflows/
│       ├── validate.yml        # runs on PRs
│       └── deploy.yml          # runs on push to main
├── restaurants/
│   ├── _template/
│   │   ├── config.json
│   │   └── assets/
│   │       ├── logo.png
│   │       ├── cover.jpg
│   │       └── menu/
│   └── bella-italia/            # example real restaurant
│       ├── config.json
│       └── assets/...
├── src/
│   ├── layouts/
│   │   └── RestaurantLayout.astro
│   ├── components/
│   │   ├── Hero.astro               # full-bleed cover, logo medallion, entrance animation
│   │   ├── Header.astro
│   │   ├── CategoryNav.astro        # sticky, animated active-tab indicator
│   │   ├── FeaturedCarousel.astro   # "Chef's Picks" spotlight for featured items
│   │   ├── StorySection.astro       # chef's note / restaurant history, editorial typography
│   │   ├── SectionDivider.astro     # mood-preset decorative motif between categories
│   │   ├── MenuItemCard.astro
│   │   ├── ItemDetailSheet.tsx      # interactive island: bottom sheet / modal on tap
│   │   ├── SearchFilterBar.tsx      # small island component (interactive)
│   │   └── Footer.astro
│   ├── pages/
│   │   ├── index.astro              # restaurant directory
│   │   └── r/
│   │       └── [slug]/
│   │           └── index.astro      # dynamic per-restaurant page
│   ├── lib/
│   │   ├── loadRestaurants.ts       # reads/parses/validates all configs
│   │   ├── theme.ts                 # builds CSS variables from a theme object
│   │   └── moodPresets.ts           # curated design-token presets (fonts, motif, rhythm)
│   ├── schemas/
│   │   └── restaurant.schema.ts     # Zod schema (source of truth)
│   └── styles/
│       └── global.css
├── scripts/
│   ├── new-restaurant.mjs           # CLI scaffold tool
│   ├── validate-configs.mjs         # run in CI + locally
│   └── check-contrast.mjs           # WCAG contrast check on theme colors
├── astro.config.mjs
├── tailwind.config.mjs
├── package.json
└── README.md
```

## DATA MODEL — RESTAURANT CONFIG SCHEMA

Implement as a Zod schema at `src/schemas/restaurant.schema.ts`:

```ts
import { z } from "zod";

export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  image: z.string().optional(), // relative path within assets/menu/
  tags: z.array(z.enum(["vegetarian", "vegan", "gluten-free", "dairy-free", "nut-free"])).default([]),
  spicyLevel: z.number().min(0).max(3).default(0),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export const MenuCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  items: z.array(MenuItemSchema).min(1),
});

export const ThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontHeading: z.string().default("Playfair Display"),
  fontBody: z.string().default("Inter"),
  borderRadius: z.enum(["none", "sm", "md", "lg", "full"]).default("md"),
  mode: z.enum(["light", "dark"]).default("light"),
});

export const RestaurantSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  logo: z.string(),
  favicon: z.string().optional(),
  coverImage: z.string().optional(),
  contact: z.object({
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    googleMapsUrl: z.string().url().optional(),
    socials: z.record(z.string().url()).optional(),
  }),
  hours: z.record(z.string()).optional(),
  theme: ThemeSchema,
  settings: z.object({
    currency: z.string().default("USD"),
    currencySymbol: z.string().default("$"),
    language: z.string().default("en"),
    showPrices: z.boolean().default(true),
    enableSearch: z.boolean().default(true),
    enableDietaryFilters: z.boolean().default(true),
  }),
  menu: z.array(MenuCategorySchema).min(1),
});

export type Restaurant = z.infer<typeof RestaurantSchema>;
```

## EXAMPLE CONFIG (`restaurants/bella-italia/config.json`)

```json
{
  "slug": "bella-italia",
  "name": "Bella Italia",
  "tagline": "Authentic Italian Cuisine Since 1985",
  "description": "Family-run Italian trattoria serving handmade pasta and wood-fired pizza.",
  "logo": "logo.png",
  "favicon": "favicon.png",
  "coverImage": "cover.jpg",
  "moodPreset": "fine-dining",
  "story": {
    "heading": "Our Story",
    "body": "Founded in 1985 by the Rossi family, Bella Italia still makes every pasta by hand, using a recipe passed down three generations."
  },
  "hero": { "style": "fullbleed" },
  "contact": {
    "phone": "+1-555-0100",
    "whatsapp": "+1-555-0100",
    "email": "info@bellaitalia.example",
    "address": "123 Main St, Springfield",
    "googleMapsUrl": "https://maps.google.com/?q=123+Main+St+Springfield",
    "socials": { "instagram": "https://instagram.com/bellaitalia" }
  },
  "hours": {
    "monday": "11:00-22:00",
    "tuesday": "11:00-22:00",
    "sunday": "12:00-21:00"
  },
  "theme": {
    "primaryColor": "#8B0000",
    "secondaryColor": "#F5F0E6",
    "accentColor": "#D4AF37",
    "fontHeading": "Playfair Display",
    "fontBody": "Inter",
    "borderRadius": "md",
    "mode": "light"
  },
  "settings": {
    "currency": "USD",
    "currencySymbol": "$",
    "language": "en",
    "showPrices": true,
    "enableSearch": true,
    "enableDietaryFilters": true
  },
  "menu": [
    {
      "id": "starters",
      "name": "Starters",
      "items": [
        {
          "id": "bruschetta",
          "name": "Bruschetta al Pomodoro",
          "description": "Grilled bread, tomato, basil, olive oil",
          "price": 8.5,
          "image": "menu/bruschetta.jpg",
          "tags": ["vegetarian"],
          "available": true
        }
      ]
    },
    {
      "id": "mains",
      "name": "Main Courses",
      "items": [
        {
          "id": "carbonara",
          "name": "Spaghetti Carbonara",
          "description": "Guanciale, egg, pecorino, black pepper",
          "price": 16,
          "image": "menu/carbonara.jpg",
          "gallery": ["menu/carbonara-2.jpg"],
          "pairsWith": "Try with our house Chianti",
          "tags": [],
          "available": true,
          "featured": true
        }
      ]
    }
  ]
}
```

## THEMING APPROACH

Each restaurant page injects CSS custom properties from `theme` into a `<style>` block or inline `style` attribute on the page root, e.g.:

```css
:root {
  --color-primary: #8B0000;
  --color-secondary: #F5F0E6;
  --color-accent: #D4AF37;
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;
  --radius: 0.5rem;
}
```

All components use Tailwind utility classes wired to these variables (via Tailwind's `theme.extend.colors` referencing `var(--color-primary)`, etc.) rather than hardcoded colors — this is what lets one component set render 100s of visually distinct restaurants.

## DESIGN & EXPERIENCE SYSTEM (Senior UI/UX Architecture Layer)

This is the layer that separates "a JSON file rendered into a page" from "a menu that feels bespoke, considered, and a little bit special." Design every screen the way a senior brand/UX designer would approach a boutique hospitality site — then implement it in a way that stays fast, accessible, and fully config-driven, so it scales to hundreds of restaurants without a designer touching each one individually.

### Design philosophy

- No restaurant should ever look like "the template with different colors." Typography, spacing rhythm, decorative motifs, and motion — not just a color swap — are what create individuality.
- Every restaurant must still feel *cohesive*, even built by non-designers. Solve this with a small number of **curated presets**, not an open-ended blank canvas — infinite freedom produces inconsistent design; a handful of excellent, opinionated presets produces consistently great design.
- Motion and flourish are seasoning, not the meal. Every decorative effect must degrade gracefully, respect `prefers-reduced-motion`, and stay within a strict, small JS budget.

### Mood presets — the "20-years-of-taste" shortcut

Instead of restaurants picking fonts/spacing/motifs from scratch, they choose one `moodPreset` and supply their own colors, logo, and photos. The preset supplies expert-level typography pairing, spacing rhythm, a decorative motif, and an imagery treatment; the restaurant's own brand assets supply the individuality. Same preset, different brand colors and photos → still two visibly distinct restaurants.

Implement `src/lib/moodPresets.ts` as the single source of truth:

| Preset | Feel | Heading font | Body font | Motif | Radius | Texture |
|---|---|---|---|---|---|---|
| `fine-dining` | Elegant, quiet luxury | Playfair Display | Cormorant / Inter | thin laurel/line divider | sharp / `none` | subtle linen grain, ~3% opacity |
| `modern-minimal` | Clean, confident | Space Grotesk | Inter | geometric dot/line rule | `sm` | none |
| `rustic-traditional` | Warm, handmade | Fraunces | Source Sans 3 | hand-drawn wheat/leaf sprig | `md` | warm paper texture |
| `playful-casual` | Fun, energetic | Poppins (bold) | Nunito | squiggle/blob divider | `full` (pill shapes) | none — bold color blocks instead |
| `bold-street` | Loud, urban | Archivo Black | Work Sans | angled stripe/tape motif | `none` | halftone dot texture, low opacity |

Each preset defines: heading/body font pair, a decorative SVG motif (used for section dividers and subtle background accents), a default border-radius scale, a spacing rhythm (compact vs. generous), and an optional background texture. A restaurant's `primaryColor` / `secondaryColor` / `accentColor` are applied **through** the chosen preset.

### Signature experience moments

Build these as first-class pieces, not afterthoughts — they're what make a menu feel like an experience rather than a list:

1. **Hero moment** (`Hero.astro`) — full-bleed cover photo, soft gradient scrim for legibility, a logo "medallion" overlapping the image edge, tagline set in the preset's display font, subtle entrance animation (fade + rise, ~400ms, plays once, respects reduced motion). Optional slow Ken-Burns drift on the cover image, pure CSS, paused under `prefers-reduced-motion`.
2. **Featured spotlight** (`FeaturedCarousel.astro`) — items flagged `featured: true` are pulled into a large, swipeable "Chef's Picks" / "Today's Specials" carousel near the top — bigger imagery and more breathing room than the regular grid below.
3. **Our Story section** (`StorySection.astro`) — a config-driven narrative block (chef's note, history, sourcing philosophy) with editorial typography (large pull-quote or drop-cap treatment). This is what turns "menu" into "brand experience."
4. **Item detail interaction** (`ItemDetailSheet.tsx`) — tapping an item opens a polished bottom sheet (mobile) / centered modal (desktop) with a larger photo, full description, allergen/dietary icons, and an optional "Pairs well with" note, instead of cramming everything into a small card.
5. **Section dividers** (`SectionDivider.astro`) — the preset's decorative motif marks the transition between categories instead of a plain rule or heading — a small detail with outsized impact on "does this feel designed."
6. **Scroll-aware category nav** — the sticky nav's active tab gets an animated sliding underline/pill as the user scrolls, via `IntersectionObserver` + CSS transforms — not a heavy scrollspy library.
7. **Page & section transitions** — use Astro's built-in View Transitions (`<ClientRouter />`) so moving from the directory into a restaurant, and between a restaurant's own sections, feels like one continuous, smooth experience rather than a hard reload, while the site remains fully static under the hood.

### Motion & micro-interaction rules

- CSS-first: `animation-timeline: view()` / scroll-driven animations for reveal-on-scroll, CSS transitions for hover/tap, native View Transitions for navigation.
- Any JS-driven interactivity (item detail sheet, active-tab tracking, search/filter) stays isolated to small Astro islands — never balloon the global JS bundle for a page-load flourish.
- Every animation has a `prefers-reduced-motion: reduce` fallback that shows the end state instantly, no motion.
- Hover/tap feedback: gentle lift (`translateY(-2px)` + soft shadow bloom), ~150–200ms ease-out — nothing jarring or slow.
- Loading states use branded skeleton shapes built from the restaurant's own color tokens, not generic gray, so even in-between moments feel intentional.

### Photography & imagery treatment

- Enforce consistent aspect ratios per image slot (cover 16:9, item photos 4:3) so mismatched source photos still look curated.
- Apply a subtle, theme-tinted overlay/vignette on the hero image so text stays legible regardless of the source photo's own contrast — don't rely on restaurants submitting pre-edited images.
- Default to a tasteful placeholder illustration matching the mood preset (never a broken-image icon) when an item has no photo.

### Config additions to support this (extend the schemas above)

```ts
export const RestaurantSchema = RestaurantSchema.extend({
  moodPreset: z.enum([
    "fine-dining",
    "modern-minimal",
    "rustic-traditional",
    "playful-casual",
    "bold-street",
  ]),
  story: z.object({
    heading: z.string().optional(),
    body: z.string(),
  }).optional(),
  hero: z.object({
    style: z.enum(["fullbleed", "split", "minimal"]).default("fullbleed"),
  }).optional(),
});

export const MenuItemSchema = MenuItemSchema.extend({
  gallery: z.array(z.string()).optional(),   // extra photos shown in the detail sheet
  pairsWith: z.string().optional(),          // e.g. "Try with our house Chianti"
});
```

`theme.primaryColor` / `secondaryColor` / `accentColor` stay exactly as defined earlier — they're applied *through* whichever `moodPreset` is chosen, per the table above.

## DYNAMIC PER-RESTAURANT ROUTE (`src/pages/r/[slug]/index.astro`)

```astro
---
import { getCollection } from "astro:content"; // or a custom loader from src/lib/loadRestaurants.ts
import RestaurantLayout from "../../../layouts/RestaurantLayout.astro";

export async function getStaticPaths() {
  const restaurants = await loadAllRestaurants(); // reads restaurants/*/config.json, validates with Zod
  return restaurants.map((r) => ({
    params: { slug: r.slug },
    props: { restaurant: r },
  }));
}

const { restaurant } = Astro.props;
---
<RestaurantLayout restaurant={restaurant}>
  <!-- header, category nav, menu items, footer -->
</RestaurantLayout>
```

`loadAllRestaurants()` should: read every folder under `restaurants/` (skip `_template`), parse `config.json`, run it through `RestaurantSchema.parse()`, and throw a clear build-time error naming the offending restaurant folder if invalid.

## GITHUB ACTIONS — DEPLOY WORKFLOW (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run validate:configs
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## GITHUB ACTIONS — PR VALIDATION WORKFLOW (`.github/workflows/validate.yml`)

```yaml
name: Validate Restaurant Configs

on:
  pull_request:
    paths:
      - "restaurants/**"

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run validate:configs
      - run: npm run check:contrast
```

## SCAFFOLD SCRIPT (`scripts/new-restaurant.mjs`)

Behavior to implement:
1. Accept `--name "Restaurant Name"` (and optionally `--slug`).
2. Derive a slug from the name if not given (lowercase, hyphenated, strip special chars).
3. Copy `restaurants/_template/` to `restaurants/<slug>/`.
4. Pre-fill `config.json`'s `slug` and `name` fields.
5. Print next steps (fill in menu, add logo/images, run `npm run validate:configs`).

## VALIDATION SCRIPT (`scripts/validate-configs.mjs`)

Behavior to implement:
1. Glob every `restaurants/*/config.json` (excluding `_template`).
2. Parse each with `RestaurantSchema.safeParse`.
3. Also check: referenced image files (`logo`, `coverImage`, item `image`) actually exist in that restaurant's `assets/` folder.
4. Check for duplicate slugs across restaurants.
5. Exit with a non-zero code and a clear per-restaurant error list if anything fails (this is what CI uses as a required check).

## CONTRAST CHECK SCRIPT (`scripts/check-contrast.mjs`)

For each restaurant's theme, compute the WCAG contrast ratio between `primaryColor`/`accentColor` text and `secondaryColor` background (and vice versa where used). Warn (non-blocking, or blocking if you want to be strict) if ratio < 4.5:1 for normal text.

## PACKAGE.JSON SCRIPTS

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "new-restaurant": "node scripts/new-restaurant.mjs",
    "validate:configs": "node scripts/validate-configs.mjs",
    "check:contrast": "node scripts/check-contrast.mjs"
  }
}
```

## UI COMPONENTS TO BUILD

1. **`Hero.astro`** — full-bleed cover image (or `split`/`minimal` per `hero.style`), gradient scrim, logo medallion, tagline in the mood preset's display font, one-time entrance animation (skipped under reduced motion).
2. **`Header.astro`** — sticky compact header that appears once the hero scrolls out of view: name, quick contact links (phone/WhatsApp/map).
3. **`FeaturedCarousel.astro`** — spotlight carousel for `featured: true` items ("Chef's Picks"), swipeable on mobile, larger imagery than the standard grid.
4. **`CategoryNav.astro`** — sticky horizontal-scroll tab bar linking to each menu category, animated sliding active-tab indicator driven by `IntersectionObserver`.
5. **`SectionDivider.astro`** — renders the current mood preset's decorative motif between categories.
6. **`MenuItemCard.astro`** — image (lazy-loaded, `astro:assets` optimized, placeholder illustration if none provided), name, price (respect `showPrices`), description, dietary tag icons, "unavailable" styling, featured badge, hover/tap lift interaction, opens `ItemDetailSheet` on click.
7. **`ItemDetailSheet.tsx`** — interactive island: bottom sheet (mobile) / modal (desktop) with larger photo(s) from `gallery`, full description, allergen icons, `pairsWith` note.
8. **`StorySection.astro`** — renders `story.heading`/`story.body` with editorial typography, only if present in config.
9. **`SearchFilterBar.tsx`** — text search across item names/descriptions + dietary tag filter chips; the one other genuinely interactive island besides the detail sheet — keep both lean and code-split so pages that don't need them (if any) aren't penalized.
10. **`Footer.astro`** — hours table, address/map link, socials.
11. **Directory `index.astro`** — grid/list of all restaurants (card = logo, name, tagline), simple client-side name filter.

## RESPONSIVE / UX REQUIREMENTS FOR THE AGENT TO ENFORCE

- Mobile-first Tailwind breakpoints; test at 360px, 768px, 1024px, 1440px.
- Tap targets ≥ 44×44px.
- Category nav must be usable one-handed on mobile (horizontal scroll with snap, not a dropdown that requires precision).
- Images must use responsive `srcset`/`sizes` via `astro:assets` — never ship a single huge image to mobile.
- All text meets WCAG AA contrast against its background, per-theme (this is why the contrast-check script matters — themes are user-supplied data, not hardcoded, so they can't be manually eyeballed at scale).
- No layout shift from images loading (reserve aspect-ratio boxes).
- Total per-page JS from islands (search/filter + item detail sheet + nav-tracking) stays within a strict budget (aim for well under 50KB gzipped combined) — fancy must never mean slow.
- Every decorative animation has a `prefers-reduced-motion: reduce` fallback, and the site is fully usable (all content reachable, nothing hidden) with JavaScript disabled — motion and interactivity are progressive enhancement on top of a working static page, never a requirement to see the menu.
- View Transitions are a progressive enhancement too: browsers without support simply get a normal navigation, not a broken one.

## ACCEPTANCE CRITERIA FOR THE INITIAL BUILD

- [ ] `npm run dev` runs locally and serves the directory page + at least one working restaurant page from `restaurants/_template`-derived data.
- [ ] `npm run validate:configs` fails loudly on a deliberately broken config (missing required field, bad slug, non-hex color).
- [ ] `npm run new-restaurant -- --name "Test Cafe"` produces a working, ready-to-fill restaurant folder.
- [ ] `npm run build` produces a static `dist/` with one HTML file per restaurant under `r/<slug>/index.html`, plus the directory `index.html`.
- [ ] Pushing to `main` triggers the GitHub Actions workflow and the site is live on GitHub Pages.
- [ ] A restaurant page changes its entire visual identity (colors/fonts/logo/mood) purely by changing `config.json` + assets — no code touched.
- [ ] Two restaurants using the *same* `moodPreset` but different colors/logo/photos are clearly, visibly distinct — the preset guides taste, it doesn't clone the design.
- [ ] Hero, featured spotlight, story section, section dividers, and item detail sheet are all present, all optional-if-missing-data (e.g., no `story` in config → section simply doesn't render, page doesn't break).
- [ ] Every decorative animation instantly resolves to its end state with `prefers-reduced-motion: reduce` enabled, and the page is fully navigable/readable with JavaScript off.
- [ ] Lighthouse (mobile) on a sample restaurant page scores ≥ 90 on Performance, Accessibility, Best Practices, SEO — despite the added motion/interactivity.
- [ ] Adding a second restaurant does not require touching `src/` at all, and does not affect the first restaurant's page.

## SUGGESTED BUILD ORDER FOR THE AGENT

1. Scaffold the Astro + Tailwind project, set `output: 'static'`, configure `base` path if deploying to a repo subpath (`<username>.github.io/<repo>/`).
2. Write the Zod schema (`restaurant.schema.ts`, including `moodPreset`/`story`/`hero`/`gallery`/`pairsWith`) and the `_template` config + placeholder assets.
3. Build `moodPresets.ts` with all five presets (fonts, motif SVGs, radius, spacing rhythm, texture).
4. Write `loadRestaurants.ts` (reads + validates all configs) and wire up `getStaticPaths` for `/r/[slug]/`.
5. Build `RestaurantLayout.astro` that resolves the chosen preset + theme colors into CSS variables.
6. Build the baseline reading experience: `Header`, `CategoryNav`, `MenuItemCard`, `Footer` — get one full restaurant page looking correct and responsive using the `bella-italia` example config above.
7. Layer in the experience components: `Hero`, `FeaturedCarousel`, `StorySection`, `SectionDivider`, `ItemDetailSheet` — confirm each degrades gracefully when its optional config data is absent.
8. Add View Transitions (`<ClientRouter />`), scroll-driven reveal animations, and the animated category-nav indicator — verify `prefers-reduced-motion` fallbacks.
9. Build the directory `index.astro`.
10. Add the search/filter island component.
11. Write `scripts/new-restaurant.mjs`, `scripts/validate-configs.mjs`, `scripts/check-contrast.mjs`.
12. Add the two GitHub Actions workflows.
13. Add a `README.md` documenting exactly how to add a new restaurant, including how to choose a `moodPreset` (this becomes the onboarding doc referenced in the PRD).
14. Do a second restaurant end-to-end, deliberately reusing the same `moodPreset` as the first but different colors/photos, to prove both that multi-tenancy works and that the preset system still produces a visibly distinct result.
