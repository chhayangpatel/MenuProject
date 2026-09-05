# Restaurant Template System — Implementation Plan

> **Spec**: `docs/superpowers/specs/2026-09-04-restaurant-template-system-design.md`
> **Method**: Subagent-driven development (per skill)
> **Batches**: 6 batches, 28 tasks

---

## Global Constraints

- Node >= 22.12.0
- All schema changes: `.optional()` + `.default()` — backward compatible
- No React for scroll animations — vanilla IntersectionObserver
- `prefers-reduced-motion: reduce` → instant end state
- React islands < 50KB gzipped combined
- Only animate `transform` + `opacity`
- `backdrop-blur` only on fixed/sticky elements
- Custom cubic-bezier on ALL transitions
- Mobile collapse: asymmetric → single-column `w-full px-4` < 768px
- `min-h-[100dvh]` not `h-screen`

---

## BATCH 1: Foundation — Schema, Registry, Asset Resolver

### Task 1: Schema — Add `template` field + keep `moodPreset`
**Files:** `src/schemas/restaurant.schema.ts`
- Add `template` enum (5 values) optional, default `"editorial-classic"`
- Keep `moodPreset` for backward compat

### Task 2: Template Registry — Core Types + Registry
**Files:** `src/lib/templates/registry.ts` (new)
- Define `Template` interface (layout, components, motion, typography, colors)
- Register all 5 templates with their configs
- Export `getTemplate(restaurant)` resolver with moodPreset fallback mapping

### Task 3: Template Resolver Utility
**Files:** `src/lib/templateResolver.ts` (new)
- `getTemplate(restaurant)` — returns full Template object
- `getTemplateComponent(templateId, componentName)` — dynamic import path
- MoodPreset → Template mapping table

### Task 4: Asset Resolver
**Files:** `src/lib/assets.ts` (new)
- `resolveAsset(restaurant, path, type)` — handles http + local
- Used by all components for logo, cover, menu images

### Task 5: Update Configs — Assign Templates
**Files:** `restaurants/bella-italia/config.json`, `matcha-minimal`, `neon-burger`
- Add `"template": "editorial-classic"` / `"modern-minimal"` / `"bold-street"`
- Ensure logos are local, covers/items use Unsplash URLs

---

## BATCH 2: Template 1 — Editorial Classic (Fine Dining)

### Task 6: Editorial Styles + CSS Variables
**Files:** `src/lib/templates/editorial-classic/styles.css` (new)
- CSS custom properties for colors, motion curves, typography scale
- Noise texture, gold accents, hairline dividers
- Double-Bezel card styles, floating pill nav, eyebrow tags

### Task 7: Editorial Hero Component
**Files:** `src/lib/templates/editorial-classic/Hero.astro` (new)
- Full-bleed cover, slow zoom (15s), multi-layer scrim
- Editorial type: massive serif, gold divider, centered
- Scroll cue, text scramble on entry

### Task 8: Editorial Header + CategoryNav
**Files:** `src/lib/templates/editorial-classic/Header.astro`, `CategoryNav.astro` (new)
- Floating glass pill with gold ring, scroll progress bar
- CategoryNav: sticky, elegant, scroll-spy active state

### Task 9: Editorial CategoryHero + MenuCard
**Files:** `src/lib/templates/editorial-classic/CategoryHero.astro`, `MenuCard.astro` (new)
- CategoryHero: full-bleed banner, editorial quote, slow parallax
- MenuCard: Double-Bezel (sharp outer, 0.5rem inner), popularity badges, 3D tilt

### Task 10: Editorial FeaturedCarousel + Footer
**Files:** `src/lib/templates/editorial-classic/FeaturedCarousel.astro`, `Footer.astro` (new)
- Carousel: gradient edges, snap, gold accent
- Footer: warm, contact + map, gold divider

---

## BATCH 3: Template 2 — Modern Minimal (Café)

### Task 11: Minimal Styles + CSS Variables
**Files:** `src/lib/templates/modern-minimal/styles.css` (new)
- Silver-grey palette, sage accent, massive whitespace
- Clean motion curves, single-bezel cards, clip-path reveals

### Task 12: Minimal Components (Hero, Header, CategoryNav, CategoryHero, MenuCard, FeaturedCarousel, Footer)
**Files:** `src/lib/templates/modern-minimal/*.astro` (7 new)
- Hero: minimal (no cover), centered type
- Nav: glass pill, minimal
- Cards: subtle border, no shadow, 0.75rem radius
- Grid: single-col centered, max 720px

---

## BATCH 4: Template 3 — Bold Street (Burgers)

### Task 13: Bold Styles + CSS Variables
**Files:** `src/lib/templates/bold-street/styles.css` (new)
- True black/white, hot pink/acid green, halftone texture
- Glitch motion, spring bounce, magnetic buttons, 3D tilt

### Task 14: Bold Components (Hero, Header, CategoryNav, CategoryHero, MenuCard, FeaturedCarousel, Footer)
**Files:** `src/lib/templates/bold-street/*.astro` (7 new)
- Hero: bento grid, asymmetric tiles
- Nav: detached bar, category chips horizontal scroll
- Cards: sharp (0 radius), neon glow double-bezel
- Horizontal scroll strips for categories

---

## BATCH 5: Templates 4 & 5 — Warm Rustic + Vibrant Playful

### Task 15: Rustic Styles + Components (7 files)
**Files:** `src/lib/templates/warm-rustic/*.astro` + `styles.css`
- Fraunces + Crimson Pro, paper texture, wheat dividers
- Story-first layout, chapter banners, typewriter reveal

### Task 16: Playful Styles + Components (7 files)
**Files:** `src/lib/templates/vibrant-playful/*.astro` + `styles.css`
- Poppins/Outfit, multi-accent pastels, spring physics
- Bottom sheet nav, carousel categories, bounce animations

---

## BATCH 6: Integration + Directory Page + Polish

### Task 17: Template Resolver Integration in Restaurant Page
**Files:** `src/pages/r/[slug]/index.astro` (modify)
- Import `getTemplate`, resolve template
- Dynamic import template components
- Pass template styles via `<style>` injection

### Task 18: Directory Page — Immersive Landing
**Files:** `src/pages/index.astro` (rewrite)
- Full-bleed kinetic hero, masonry/bento cards
- Floating glass search/filter (cuisine, template, open now)
- Parallax covers, staggered entry, View Transition names
- Empty state illustration

### Task 19: View Transitions + Page Choreography
**Files:** `src/layouts/RestaurantLayout.astro`, `index.astro`, template Heroes
- `transition:name` on covers, logos, names
- Morphing cover → hero, reverse on back

### Task 20: Asset Resolver Integration
**Files:** `Hero.astro`, `Header.astro`, `CategoryHero.astro`, `MenuItemCard.astro`, `FeaturedCarousel.astro`, `ItemDetailSheet.tsx`, `index.astro` (all)
- Replace manual URL logic with `resolveAsset()`

### Task 21: new-restaurant Scaffold — Template Selection
**Files:** `scripts/new-restaurant.mjs` (modify)
- Add `--template` flag + interactive prompt
- Copy template default config + placeholder assets

### Task 22: Fallback Shared Components
**Files:** `src/components/shared/*.astro` (new, minimal)
- Base fallbacks for any template component not overridden
- Used when template doesn't provide a specific component

### Task 23: Global CSS Cleanup + Motion Curves
**Files:** `src/styles/global.css`, `src/lib/theme.ts`
- Remove duplicate styles now in template styles.css
- Ensure motion curves defined globally for shared use

### Task 24: Reduced Motion Audit
**Files:** All template components
- Verify every animation has `prefers-reduced-motion` guard
- Test with DevTools emulation

### Task 25: Mobile Collapse Audit
**Files:** All template components
- Verify < 768px: single-column, `w-full px-4`, no horizontal scroll
- Touch targets ≥ 44px

### Task 26: Build Validation + Performance
**Commands:** `npm run validate:configs`, `npm run build`, `npm run check:contrast`
- All 3+ restaurants validate
- Build clean, React islands < 50KB
- Contrast passes WCAG AA

### Task 27: Visual QA — Template Distinctness
**Manual:** Visit each restaurant, verify:
- Unrecognizable as same platform
- Motion feels match archetype
- Typography, color, layout all distinct

### Task 28: Documentation Update
**Files:** `docs/business/02-add-a-restaurant.md`, `docs/technical/05-extending.md`
- Document template selection, customization, adding new templates

---

## Task Dependencies

```
1 → 2 → 3 → 4 → 5
              ↓
6 → 7 → 8 → 9 → 10  (Editorial)
              ↓
11 → 12           (Minimal)
              ↓
13 → 14           (Bold)
              ↓
15 → 16           (Rustic + Playful)
              ↓
17 → 18 → 19 → 20 → 21 → 22 → 23 → 24 → 25 → 26 → 27 → 28
```

---

## Execution Order

**Phase 1** (Foundation): Tasks 1-5 — run sequentially
**Phase 2** (Templates): Tasks 6-16 — Editorial first (reference), then others in parallel-ish
**Phase 3** (Integration): Tasks 17-28 — sequential

---

## Verification Checklist per Template

- [ ] Hero renders correctly (cover, type, animation)
- [ ] Header floats, scroll progress works
- [ ] CategoryNav sticky, active state visible
- [ ] CategoryHero banners load, parallax works
- [ ] MenuCards: double-bezel, 3D tilt, badges
- [ ] FeaturedCarousel: snap, gradient edges
- [ ] Footer: contact, map, template-styled
- [ ] Mobile: collapses, touch targets OK
- [ ] Reduced motion: instant, no broken layout
- [ ] Assets: no 404s (logo local, covers external)

---

## Rollback Plan

If template system breaks existing restaurants:
1. `git revert` to pre-template commit
2. Old moodPreset system intact
3. Re-implement with more isolation