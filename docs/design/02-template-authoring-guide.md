# Template Authoring Guide

**Audience:** Developers (or AI agents) adding template #6, #7, #100 to the platform.
**Promise:** After Phase 0 refactor, adding a template touches **exactly 3 places** + 1 folder. This guide is the checklist.
**Prerequisite reading:** `01-design-system.md` (§2 tokens, §3 format, §4 motion rules).

---

## 1. What a template is

A template is a **complete design language** shipped as:

```
src/lib/templates/<template-id>/
├── Hero.astro              # signature first impression (60-second test)
├── Header.astro            # sticky compact header post-hero
├── CategoryNav.astro       # sticky horizontal category tabs
├── CategoryHero.astro      # optional immersive category header (when heroImage set)
├── MenuCard.astro          # THE most important component — item presentation
├── FeaturedCarousel.astro  # chef's picks spotlight
├── Footer.astro            # hours, contact, socials
└── styles.css              # template-scoped styles, --mr-* tokens only
```

Plus **one registry entry** and **one demo restaurant**. That's the whole contract.

---

## 2. The Registry Entry (single source of truth)

Add to `src/lib/templates/registry.ts`:

```ts
'neon-night': {
  id: 'neon-night',
  name: 'Neon Night',
  description: 'Izakaya, late-night kitchens, bars. Dark glass surfaces, neon-stroke type, glow accents.',
  layout: 'bento',
  defaultMoodPreset: 'bold-street',   // map to closest existing mood preset
  components: {
    Hero: 'neon-night/Hero',           // used by the component map, see §3
    Header: 'neon-night/Header',
    CategoryNav: 'neon-night/CategoryNav',
    CategoryHero: 'neon-night/CategoryHero',
    MenuCard: 'neon-night/MenuCard',
    FeaturedCarousel: 'neon-night/FeaturedCarousel',
    Footer: 'neon-night/Footer',
  },
  motion: {
    intensity: 6,
    entryDuration: 700,
    staggerDelay: 70,
    easings: EASINGS,                  // shared constants — never custom easings
    parallaxDepth: 0.3,
    reducedMotionFallback: 'fade',
  },
  typography: {
    ...TYPOGRAPHY_BASE,
    hero: 'clamp(2.8rem, 8vw, 5rem)',
  },
  colorDefaults: {
    primaryColor: '#F5F3EF',           // on-dark: light ink
    secondaryColor: '#0B0B10',         // dark surface
    accentColor: '#39FF88',            // neon
    fontHeading: '"Archivo", sans-serif',
    fontBody: '"Inter", sans-serif',
    borderRadius: 'md',
  },
},
```

Also: add the id to `TemplateId` union, `RestaurantSchema.template` enum (`src/schemas/restaurant.schema.ts`), and the font `<link>` list (which after Phase 0 lives **only** in the registry, e.g. a `fonts` field on `Template`).

**Do not** add template CSS or fonts to `RestaurantLayout.astro`. After the Phase 0 refactor the layout reads everything from `getTemplate()`.

---

## 3. The Component Map

Register components in `src/lib/templates/components.ts`:

```ts
import NeonHero from './neon-night/Hero.astro';
// ... 7 imports
import type { TemplateId } from './registry';

export const templateComponents = {
  'neon-night': { Hero: NeonHero, Header: NeonHeader, /* ... */ },
  // ...
} satisfies Record<TemplateId, TemplateComponents>;
```

`r/[slug]/index.astro` resolves via `templateComponents[template.id]` — one new import block per template, **no switch statement**, no edits to page logic.

---

## 4. Component Contract

Every template component must implement this interface (props may be a superset):

| Component | Required props | Must honor |
|---|---|---|
| `Hero` | `restaurant` | `hero.style` (fullbleed/split/minimal), scrim law, logo medallion, one entry animation honoring `--mr-entry-duration`, one ambient effect max |
| `Header` | `restaurant` | appears after hero scroll, name + phone/map/WhatsApp links, ≥44px targets |
| `CategoryNav` | `categories` | sticky, horizontal scroll-snap, active-tab indicator animated via transform, IO-driven |
| `CategoryHero` | `category`, `slug`, `categoryIndex`, `restaurant` | only rendered when `category.heroImage` present; must not assume it's always mounted |
| `MenuCard` | `item`, `currencySymbol`, `showPrices`, `restaurant` | aspect-ratio-reserved image or motif placeholder, price via `formatCurrency`, unavailable state (§6 design doc), tag chips with aria-labels, opens detail sheet via `data-item-id` |
| `FeaturedCarousel` | `items`, `currencySymbol`, `showPrices`, `restaurant` | renders nothing when `items` empty (parent already guards, but stay defensive) |
| `Footer` | `restaurant` | hours table, address/map, socials, currency-consistent |

**Hard rules for all components:**

1. Style **only** with `--mr-*` tokens + your `styles.css` scoped classes. Prefix classes with your template's 2–3-letter namespace (`nn-`, `ec-`, `bs-`…). Never rely on another template's classes.
2. No hardcoded brand hex anywhere. Textures and motif SVGs use `currentColor` / tokens.
3. No `document`/`window` access in `.astro` frontmatter; interactions go in `src/lib/client/*` modules or inline `<script>` that is idempotent on `astro:page-load`.
4. `astro:assets` `<Image />` for every raster image; `loading="lazy"` below the fold; `fetchpriority="high"` only on the hero image.
5. Every animation has a reduced-motion end state. Test with DevTools emulation before PR.

---

## 5. Design Quality Bar (the "one-of-a-kind" gate)

Before merging, the template must pass this review:

- [ ] **Squint test:** screenshot 3 sections; the silhouette is recognizably *this* template, not a color-swapped other.
- [ ] **Same data, different soul:** render the *same* demo restaurant in your template and the closest sibling; at least 5 structural differences are visible (layout, hierarchy, motif, imagery treatment, motion).
- [ ] **Motion identity:** at least 2 signature effects exist that no other template uses (see design doc §3 examples).
- [ ] **Restaurant brand shines:** swapping only colors/logo/photos across 3 different fake brands produces 3 visibly distinct sites.
- [ ] **Nothing competes with the food:** dish names/prices are the highest-contrast elements on every screen.
- [ ] **The 60-second test:** hero communicates venue type + feeling + how to reach food, on a 360px phone, in under 60 seconds.

---

## 6. Validation Checklist (CI will enforce the mechanical parts)

```
[ ] registry.ts: TemplateId union + entry + schema enum updated
[ ] components.ts map entry added
[ ] 7 components + styles.css committed
[ ] Demo restaurant added: restaurants/<template-id>-demo/config.json (+ assets)
[ ] Showcase entry added (templates gallery page)
[ ] npm run validate:configs passes (demo included)
[ ] npm run check:contrast passes on colorDefaults
[ ] prefers-reduced-motion pass: page fully readable, effects at end-state
[ ] JS-off pass: full menu readable and navigable
[ ] Lighthouse mobile ≥ 90 across the board on the demo page
[ ] Tap targets ≥ 44px, keyboard-navigable, focus rings visible
[ ] No console errors on load + on view-transition round-trip
```

---

## 7. Worked Example Checklist (adding `neon-night`)

1. Copy `src/lib/templates/modern-minimal/` → `src/lib/templates/neon-night/` as scaffolding; rename classes to `nn-*`.
2. Rewrite `styles.css` and each component against the design spec (dark glass surfaces, neon stroke headings via `-webkit-text-stroke` + glow `text-shadow`, glow pulse as the single ambient effect).
3. Add registry entry (above), schema enum, font link.
4. Add components map entry.
5. Create `restaurants/neon-night-demo/config.json` using the demo menu pattern from `bella-italia`, with dark-mode theme colors.
6. `npm run dev` → `/r/neon-night-demo/` → run the §5 + §6 checklists.
7. Ship. Total: 1 folder + 3 registration points. Nothing else in `src/` changes.