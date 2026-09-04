# MenuProject: One-of-a-Kind Awwwards-Tier Transformation Plan

## Context

A multi-restaurant digital menu platform (Astro 7 + React 19 + Tailwind 4 + Framer Motion 13 + Zod 4) on GitHub Pages. Has solid foundations (Zod validation, 5 mood presets, CI/CD) but needs two transformations:

1. **JSON data structure** — flat and limited; can't express sizes, modifiers, nutrition, allergens, scheduling, or immersive category content
2. **UI/UX** — generic patterns, unused components, no signature interaction, no Awwwards-tier polish

**Goal:** Transform from functional prototype → **one-of-a-kind, immersive menu experience** with Awwwards-tier design.
**Signature Feature:** Immersive Category Storytelling — each menu section becomes a cinematic chapter with full-bleed hero images, editorial quotes, and mood-specific scroll choreography.
**Constraint:** Read-only digital menu. Static site on GitHub Pages.

---

## Design Standards (Awwwards-Tier Checklist)

All code must pass this filter before delivery:

- [ ] No banned fonts (Inter, Roboto, Arial, Open Sans, Helvetica)
- [ ] No banned icons (thick Lucide, FontAwesome, Material)
- [ ] No banned borders (generic `1px solid gray`)
- [ ] No banned shadows (`rgba(0,0,0,0.3)`)
- [ ] No banned motion (`linear`, `ease-in-out`)
- [ ] Double-Bezel card architecture on all major cards
- [ ] Eyebrow tags on all section headings
- [ ] Button-in-Button CTA pattern
- [ ] Section padding minimum `py-24`
- [ ] Custom cubic-bezier curves on all transitions
- [ ] Scroll entry animations on all content
- [ ] Graceful mobile collapse below 768px
- [ ] Only `transform` and `opacity` animated (no layout triggers)

---

## BATCH 1: Quick Wins — Activate Existing Code
> 1-2 days. Zero schema changes.

### 1.1 SectionDivider Between Categories
- **File:** `src/pages/r/[slug]/index.astro` — replace `.category-divider` div with `<SectionDivider presetName={restaurant.moodPreset} />`
- **Impact:** Instant personality per preset

### 1.2 ScrollReveal on Menu Items (Vanilla JS, No React)
- **File:** `src/pages/r/[slug]/index.astro`
- Add `data-reveal` to each `MenuItemCard`, with staggered `transition-delay` based on index
- IntersectionObserver in `<script>` adds `.revealed` class
- **CSS:** `opacity: 0; transform: translateY(16px) blur-md` → `opacity: 1; transform: translateY(0) blur-0` over 800ms with `cubic-bezier(0.16, 1, 0.3, 1)`
- **NO React hydration** — matches CategoryNav pattern

### 1.3 Dietary Filter Chips
- **File:** `src/components/SearchFilterBar.tsx`
- Extract unique tags from `window.__RESTAURANT_ITEMS__`
- Render toggleable pill chips with spring animation
- Show "Showing X of Y items" counter
- Empty state: "No items match your filters"
- **File:** `src/pages/r/[slug]/index.astro` — pass `enableDietaryFilters` prop

### 1.4 Dead Code Cleanup
- **Delete:** `src/components/menus/MagneticNav.jsx`, `FullScreenOverlay.jsx`, `FloatingScrollMenu.jsx`
- **Keep:** `ScrollReveal.jsx` (reference for animation values), `SectionDivider.astro`

### 1.5 Back Navigation
- **File:** `src/components/Header.astro` — add ← arrow linking to `/`

---

## BATCH 2: Schema Evolution + Supporting UI
> 3-5 days.

### 2.1 Restaurant-Level Metadata
```ts
// Add to RestaurantSchema
cuisine: z.array(z.string()).optional(),      // ["Italian", "Pasta"]
priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
```
**Files:** `src/schemas/restaurant.schema.ts`, all `config.json`

### 2.2 Immersive Category Schema (SIGNATURE FEATURE)
```ts
// Extend MenuCategorySchema
heroImage: z.string().optional(),     // full-bleed background for this section
heroQuote: z.string().optional(),     // editorial subheading/quote
```
**Files:** `src/schemas/restaurant.schema.ts`, `restaurants/_template/config.json`

### 2.3 Item Variants & Modifiers
```ts
// Add to MenuItemSchema
variants: z.array(z.object({
  id: z.string(),
  name: z.string(),           // "Small", "Medium", "Large"
  priceModifier: z.number(),  // +0, +3, +5
})).optional(),

modifiers: z.array(z.object({
  id: z.string(),
  name: z.string(),           // "Extra Cheese"
  price: z.number(),
  group: z.string().optional(), // "Toppings", "Sides"
})).optional(),
```
**Files:** schema, `ItemDetailSheet.tsx`, `MenuItemCard.astro`

### 2.4 Nutritional & Allergen Data
```ts
// Add to MenuItemSchema
nutrition: z.object({
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
}).optional(),

allergens: z.array(z.object({
  name: z.string(),
  severity: z.enum(["contains", "may-contain", "traces"]),
})).optional(),

// Expand tags enum
tags: z.array(z.enum([
  "vegetarian", "vegan", "gluten-free", "dairy-free", "nut-free",
  "halal", "kosher", "organic", "house-made", "seasonal"
])).default([]),
```

### 2.5 Ordering Context Hints
```ts
// Add to MenuItemSchema
prepTime: z.number().optional(),        // minutes
portionSize: z.string().optional(),     // "Serves 2-3"
popularity: z.enum(["most-ordered", "staff-favorite", "new", "trending"]).optional(),
```

### 2.6 Enhanced Hours Schema
```ts
hours: z.object({
  regular: z.record(z.string()).optional(),
  special: z.array(z.object({
    date: z.string(),
    hours: z.string(),
    label: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
}).optional()
```
**Backward compat:** `loadRestaurants.ts` auto-wraps old flat format.

### 2.7 Directory Search & Filters
- **New file:** `src/components/DirectorySearch.tsx` React island
- Text search, cuisine filter chips, mood filter, "Open Now" badges
- **New file:** `src/lib/hours.ts` — `isCurrentlyOpen()` utility

### 2.8 Item Detail Sheet Upgrade
- Variant selector (animated pill toggle)
- Modifier chips (scrollable, grouped)
- Nutrition accordion
- Allergen severity badges (red/amber/yellow)
- Prep time + portion size
- Share button (Web Share API)
- **File:** `src/components/ItemDetailSheet.tsx`

---

## BATCH 3: Immersive Category Storytelling (SIGNATURE)
> 5-7 days. The centerpiece.

### 3.1 Category Hero Section Component
- **New file:** `src/components/CategoryHero.astro`
- Full-bleed background image with gradient scrim
- Eyebrow tag (preset motif icon + category number)
- Category name in preset heading font (massive, `clamp(2rem, 5vw, 3.5rem)`)
- Optional `heroQuote` in italic editorial style
- Scroll-linked parallax on background image
- **Respects `prefers-reduced-motion`**

### 3.2 Mood-Specific Scroll Choreography
- **New file:** `src/lib/scrollChoreography.ts`
- Defines per-preset entry animations:

| Preset | Hero Image Entry | Text Entry | Item Stagger |
|---|---|---|---|
| `fine-dining` | Slow fade + gentle rise (1200ms) | Letter-by-letter typewriter | Items rise with subtle vertical offset, 120ms stagger |
| `modern-minimal` | Clip-path circle expands from center | Clean slide-up (800ms) | Items morph from transparent rectangles, 80ms stagger |
| `bold-street` | Slam-in with 3deg skew + bounce | Glitch-style reveal | Items drop in with spring bounce, 100ms stagger |
| `rustic-traditional` | Fade through paper texture overlay | Warm typewriter (slower, 1500ms) | Items fade with grain overlay, 150ms stagger |
| `playful-casual` | Bounce-in with scale overshoot | Pop-in per word | Items pop with spring physics, 90ms stagger |

- **Implementation:** IntersectionObserver on category sections + CSS classes per preset + staggered `transition-delay`

### 3.3 Ambient Texture Activation
- **File:** `src/lib/theme.ts` — inject CSS `::after` pseudo-element styles
- **Textures finally applied:** linen (fine-dining), paper (rustic), halftone (bold-street)
- `pointer-events: none; position: absolute; mix-blend-mode: overlay; opacity: 0.03-0.08`

### 3.4 Category Background Integration
- **File:** `src/pages/r/[slug]/index.astro` — for each category:
  1. Render `<CategoryHero>` if `heroImage` exists
  2. Wrap items grid in a section with the category's scroll choreography data attributes
  3. Apply mood-specific entry classes

---

## BATCH 4: Awwwards-Tier Visual Overhaul
> 5-7 days.

### 4.1 Font System Upgrade
| Current | Replacement | Role |
|---|---|---|
| `Inter` (all body) | `Plus Jakarta Sans` | New default body — geometric, modern |
| `Work Sans` | `DM Sans` | bold-street body |
| `Nunito` | `Outfit` | playful-casual body |
| `Source Sans 3` | `Crimson Pro` | rustic-traditional body — editorial warmth |
| Display fonts | ✓ stay as-is | per-preset headings |

**Files:** `src/lib/moodPresets.ts`, `src/lib/theme.ts`

### 4.2 "Double-Bezel" Card Architecture
- **File:** `src/components/MenuItemCard.astro` — outer shell + inner core
- **Outer:** `bg-[color-mix]`, `ring-1 ring-[color-mix]`, `rounded-[calc(var(--radius)+0.25rem)]`, `p-1.5`
- **Inner:** `bg-[var(--color-secondary)]`, `rounded-[var(--radius)]`, `shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]`
- Same pattern for `FeaturedCarousel` cards

### 4.3 Floating Glass Navigation
- **File:** `src/components/Header.astro` — complete redesign
- **Detached pill:** `mt-4 mx-auto w-max rounded-full backdrop-blur-2xl`
- **Scroll-linked:** Compact on scroll down, expand on scroll up (Framer Motion `useScroll` or vanilla JS)
- **Scroll progress bar:** Thin accent line inside the pill top edge
- **Z-index discipline:** `z-50` only

### 4.4 Eyebrow Tags
- **New component:** `src/components/Eyebrow.astro`
- Renders: icon + text in `rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium`
- Used on: category headings, "Featured" section, "Our Story" section
- Color: `var(--color-accent)`

### 4.5 Button-in-Button CTA Pattern
- **File:** Apply to `rcard-cta` in `src/pages/index.astro` and "View Menu" buttons
- Text in main pill, arrow icon in nested `w-8 h-8 rounded-full` circle inside the button right edge
- Hover: arrow circle slides right + scales, main button does `active:scale-[0.98]`

### 4.6 Custom Motion Curves
```css
:root {
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-fluid: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-snap: cubic-bezier(0.76, 0, 0.24, 1);
}
```
Apply to all transitions. Replace every `ease-in-out` and `ease` in existing CSS.

### 4.7 Custom Cursor Per Mood
- **New file:** `src/lib/cursor.ts` + CSS in `theme.ts`
- Vanilla JS `mousemove` listener creates custom cursor element
- **fine-dining:** 12px gold dot with soft glow, spring-follow (slight lag)
- **bold-street:** Crosshair with accent glow
- **modern-minimal:** 20px thin ring, expands on hover over interactive elements
- **rustic-traditional:** 14px warm brown dot
- **playful-casual:** Bouncy circle, squishes on click
- Hidden on mobile, respects `prefers-reduced-motion`

### 4.8 Scroll-Linked Hero Typography
- **File:** `src/components/Hero.astro`
- Restaurant name responds to scroll: scale 1→0.95, weight 900→700, opacity 1→0.7
- Implementation: IntersectionObserver on hero + CSS transition class toggle

### 4.9 Ambient Mood Animations
- **File:** `src/lib/theme.ts` — inject per-preset CSS animations:
  - **fine-dining:** Subtle gold particle float (CSS `@keyframes` on pseudo-elements)
  - **modern-minimal:** Slow accent color gradient shift on section borders
  - **bold-street:** Halftone texture overlay on category sections
  - **rustic-traditional:** Paper texture on category sections
  - **playful-casual:** Gentle floating motion on decorative elements

### 4.10 Typography Scale
```css
:root {
  --text-hero: clamp(2.4rem, 7vw, 4.5rem);
  --text-section: clamp(1.5rem, 4vw, 2rem);
  --text-body: 1rem;
  --text-caption: 0.8125rem;
  --text-micro: 0.6875rem;
  --leading-heading: 1.05;
  --leading-body: 1.75;
  --tracking-heading: -0.02em;
  --tracking-wide: 0.04em;
  --tracking-micro: 0.08em;
}
```

### 4.11 Featured Carousel Polish
- Gradient fade edges (left/right CSS `mask-image`)
- Animated swipe indicator on mobile
- Larger card treatment than regular grid

### 4.12 Scroll Progress Bar
- **File:** `src/components/Header.astro`
- Thin accent-colored bar at top of floating nav pill
- Width linked to scroll percentage via JS

---

## BATCH 5: Immersive Directory + Architecture
> 3-5 days.

### 5.1 Immersive Directory Page
- **File:** `src/pages/index.astro` — complete redesign
- **Full-bleed restaurant cards** (not small grid cards)
- Each card: parallax cover image, logo, name, tagline, cuisine badges, price range, "Open Now" indicator
- **Hover:** Card lifts, cover zooms slightly, CTA animates
- **Search:** Floating glass input at top
- **Filter chips:** Cuisine + mood filters in floating glass pills
- **Empty state:** "No restaurants match your filters" with illustration

### 5.2 Page Transition Choreography
- **File:** `src/layouts/RestaurantLayout.astro`, `src/pages/index.astro`
- `transition:name` directives on matching elements between pages
- Directory card → Restaurant hero: morphing expansion
- Restaurant hero → Directory card: reverse shrink
- Within restaurant: smooth crossfade + vertical slide

### 5.3 Component Architecture
- **New:** `src/lib/formatCurrency.ts` — `Intl.NumberFormat` locale-aware
- **New:** `src/components/Eyebrow.astro` — reusable eyebrow tag
- **Refactor:** `SearchFilterBar.tsx` — move DOM manipulation to React state
- **Refactor:** Extract shared `TagBadge` component (currently duplicated)

### 5.4 Dark Mode Support
- Extend `ThemeSchema` with optional `darkTheme` variant
- `ThemeToggle.astro` (vanilla JS, sun/moon icon)
- `data-theme` attribute on `<html>`, persist in `localStorage`
- Each mood preset gets a dark color variant

### 5.5 SEO Enhancement
- Open Graph meta tags per restaurant
- JSON-LD structured data (Restaurant + MenuItems)
- Canonical URLs
- **File:** `src/layouts/RestaurantLayout.astro`

### 5.6 Skeleton Loading States
- **New:** `src/components/SkeletonCard.astro` — branded shimmer matching restaurant colors
- Used during View Transitions

### 5.7 Print-Friendly Menu
- `@media print` — removes nav, search, hero, footer. Clean single-column, black-on-white.

### 5.8 Menu Variants / Scheduling
```ts
menuVariants: z.array(z.object({
  id: z.string(),
  name: z.string(),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
  availableDays: z.array(z.string()).optional(),
  categories: z.array(MenuCategorySchema),
})).optional()
```
- Tab switcher above category nav

### 5.9 QR Code Generation
- Build-time script generates QR SVGs per restaurant
- **New:** `scripts/generate-qr.mjs`

### 5.10 Combo/Meal Deal Bundling
```ts
combos: z.array(z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  items: z.array(z.string()),
  comboPrice: z.number(),
  available: z.boolean().default(true),
})).optional()
```
- **New:** `src/components/ComboCard.astro`

---

## Complete Implementation Priority

| # | Task | Batch | Effort | Impact |
|---|---|---|---|---|
| 1 | SectionDivider activation | 1 | 10 min | 🔥 |
| 2 | ScrollReveal (vanilla JS) | 1 | 30 min | 🔥 |
| 3 | Dietary filter chips | 1 | 2 hrs | 🔥 |
| 4 | Back navigation | 1 | 30 min | Medium |
| 5 | Dead code cleanup | 1 | 15 min | Medium |
| 6 | Restaurant metadata schema | 2 | 2 hrs | 🔥 |
| 7 | **Immersive category schema** | 2 | 1 hr | 🔥🔥 |
| 8 | Item variants & modifiers | 2 | 3 hrs | 🔥 |
| 9 | Nutritional & allergen data | 2 | 2 hrs | 🔥 |
| 10 | Ordering context hints | 2 | 1 hr | Medium |
| 11 | Enhanced hours schema | 2 | 2 hrs | Medium |
| 12 | Directory search & filters | 2 | 3 hrs | 🔥 |
| 13 | Item detail sheet upgrade | 2 | 4 hrs | 🔥 |
| 14 | **CategoryHero component** | 3 | 3 hrs | 🔥🔥 |
| 15 | **Mood-specific scroll choreography** | 3 | 4 hrs | 🔥🔥 |
| 16 | Ambient texture activation | 3 | 2 hrs | 🔥 |
| 17 | **Font system upgrade** | 4 | 2 hrs | 🔥 |
| 18 | **Double-Bezel cards** | 4 | 3 hrs | 🔥🔥 |
| 19 | **Floating glass navigation** | 4 | 3 hrs | 🔥🔥 |
| 20 | **Eyebrow tags** | 4 | 1 hr | 🔥 |
| 21 | Button-in-Button CTAs | 4 | 1.5 hrs | Medium |
| 22 | Custom motion curves | 4 | 1 hr | 🔥 |
| 23 | **Custom cursor per mood** | 4 | 2 hrs | 🔥 |
| 24 | Scroll-linked hero typography | 4 | 1.5 hrs | 🔥 |
| 25 | Ambient mood animations | 4 | 2 hrs | Medium |
| 26 | Typography scale | 4 | 1 hr | Medium |
| 27 | Featured carousel polish | 4 | 1 hr | Medium |
| 28 | Scroll progress bar | 4 | 30 min | Medium |
| 29 | **Immersive directory page** | 5 | 4 hrs | 🔥🔥 |
| 30 | **Page transition choreography** | 5 | 3 hrs | 🔥 |
| 31 | Component architecture | 5 | 2 hrs | Medium |
| 32 | Dark mode support | 5 | 3 hrs | Medium |
| 33 | SEO (OG, JSON-LD) | 5 | 1.5 hrs | Medium |
| 34 | Skeleton loading states | 5 | 2 hrs | Medium |
| 35 | Print-friendly menu | 5 | 1.5 hrs | Low |
| 36 | Menu variants / scheduling | 5 | 3 hrs | Medium |
| 37 | QR code generation | 5 | 1 hr | Low-Medium |
| 38 | Combo/meal deal bundling | 5 | 3 hrs | Medium |

---

## Verification Plan

1. **Schema:** `npm run validate:configs` passes with updated template
2. **Visual:** `npm run dev` — each restaurant page checked at 360px, 768px, 1024px, 1440px
3. **Reduced motion:** `prefers-reduced-motion: reduce` — all animations resolve instantly
4. **Build:** `npm run build` — clean static output
5. **Isolation:** Changing one config doesn't affect others
6. **Backward compat:** Old configs work via defaults
7. **A11y:** Focus indicators, ARIA labels, semantic HTML, contrast ratios pass
8. **Performance:** React islands under 50KB gzipped combined

---

## Critical Files

| File | Changes |
|---|---|
| `src/schemas/restaurant.schema.ts` | All schema additions (variants, nutrition, allergens, category heroes, combos, scheduling) |
| `src/pages/r/[slug]/index.astro` | CategoryHero integration, ScrollReveal, choreography classes, menu variant tabs |
| `src/pages/index.astro` | Complete immersive directory redesign |
| `src/components/Hero.astro` | Scroll-linked typography, custom cursor integration |
| `src/components/Header.astro` | Floating glass nav, scroll progress, back button |
| `src/components/MenuItemCard.astro` | Double-Bezel architecture, scroll-reveal, popularity badges |
| `src/components/ItemDetailSheet.tsx` | Variants, modifiers, nutrition, allergens, share |
| `src/components/SearchFilterBar.tsx` | Dietary filter chips, result count |
| `src/components/FeaturedCarousel.astro` | Gradient edges, swipe indicator, Double-Bezel |
| `src/lib/theme.ts` | Typography scale, motion curves, ambient animations, dark mode, textures, cursor |
| `src/lib/moodPresets.ts` | Font replacements, scroll choreography definitions |
| `src/lib/scrollChoreography.ts` | **New:** Per-preset animation choreography definitions |
| `src/lib/cursor.ts` | **New:** Custom cursor system per mood |
| `src/lib/hours.ts` | **New:** isCurrentlyOpen utility |
| `src/lib/formatCurrency.ts` | **New:** Locale-aware currency formatting |
| `src/components/CategoryHero.astro` | **New:** Full-bleed category section hero |
| `src/components/Eyebrow.astro` | **New:** Microscopic pill badge |
| `src/components/DirectorySearch.tsx` | **New:** Directory page search & filters |
| `src/components/ComboCard.astro` | **New:** Meal deal display |
| `src/components/SkeletonCard.astro` | **New:** Branded loading skeletons |
| `src/layouts/RestaurantLayout.astro` | View Transition names, dark mode support |
| `restaurants/_template/config.json` | Updated with hero images, variants, nutrition, allergens |
| All `restaurants/*/config.json` | Add cuisine, priceRange, category heroImages |
