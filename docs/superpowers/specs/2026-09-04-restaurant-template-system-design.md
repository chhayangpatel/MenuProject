# Restaurant Template System — Design Specification

> **Status**: Ready for implementation plan
> **Scope**: 5 distinct end-to-end templates, directory page redesign, asset handling fix
> **Compatibility**: Backward-compatible with existing moodPreset system

---

## Executive Summary

Transform MenuProject from a single-layout platform with mood presets into a **template-driven system** where each restaurant selects a complete design personality. Each template owns its layout, typography, motion, components, and composition — not just colors.

Current state: 3 restaurants, 1 shared layout, 5 mood presets (colors only).
Target state: 3+ restaurants, 5 templates, each a complete visual language.

---

## Template Definitions

### Template 1: Editorial Classic — "The Michelin Experience"
**Archetype**: Fine dining, heritage establishments, multi-course tasting menus
**Vibe**: Editorial Luxury (warm creams, deep espresso, gold accents, high-contrast serif)

| Aspect | Specification |
|--------|---------------|
| **Layout** | Asymmetric editorial split: massive type left, staggered content right. Hero = full-bleed with slow zoom. Sections alternate: full-width quote → bento grid → split text/image. |
| **Typography** | Display: `PP Editorial New` / `Playfair Display` (serif, high contrast). Body: `Plus Jakarta Sans` (geometric sans). Scale: `--text-hero: clamp(3rem, 8vw, 5.5rem)`. |
| **Color** | Cream `#FDFBF7`, Espresso `#1A1612`, Gold `#C9A227`, Charcoal `#2D2926`. No pure black/white. |
| **Motion** | `MOTION_INTENSITY: 4` — Slow, deliberate. Hero zoom 15s. Scroll reveal: fade + gentle rise (1200ms, cubic-bezier(0.16,1,0.3,1)). Text scramble on section entry. Parallax depth: 0.3x. |
| **Components** | Double-Bezel cards (sharp outer, 0.5rem inner). Hairline dividers (gold). Floating pill nav (gold ring). Eyebrow: uppercase tracking-wide, gold. Buttons: pill, gold fill, inset highlight. |
| **Grid** | Bento: asymmetric (2fr 1fr, 1fr 2fr). Section padding: `py-24` to `py-32`. |
| **Imagery** | Full-bleed hero, category banners 16:9. Noise texture overlay (opacity 0.03). |

---

### Template 2: Modern Minimal — "The Specialty Café"
**Archetype**: Coffee shops, bakeries, plant-forward, aesthetic-first brands
**Vibe**: Ethereal Glass / Soft Structuralism (silver-grey, clean lines, massive whitespace)

| Aspect | Specification |
|--------|---------------|
| **Layout** | Centered, single-column flow. Hero = minimal (logo + name + tagline, no cover). Sections: generous whitespace, centered content max 600px. Sticky TOC nav on desktop. |
| **Typography** | Display: `Space Grotesk` (geometric, wide). Body: `Plus Jakarta Sans` (humanist geometric). Scale: `--text-hero: clamp(2.5rem, 6vw, 4rem)`. Tight leading (1.05). |
| **Color** | Off-white `#FAFAF8`, Charcoal `#1A1A1A`, Sage `#4A7C59`, Warm Grey `#6B6B6B`. Single accent. |
| **Motion** | `MOTION_INTENSITY: 3` — Clean, functional. Fade + slide up (800ms). Clip-path circle expand on hero image. Stagger: 80ms. No parallax. |
| **Components** | Single-bezel cards (subtle border, 0.75rem radius). No shadows. Divider: single dot. Floating nav: glass pill, blur 24px. Buttons: outline → fill on hover. |
| **Grid** | Single column, 2-col only ≥ 768px. Section padding: `py-20`. Max width 720px. |
| **Imagery** | Square/4:5 item photos. No banners. Clean product photography. |

---

### Template 3: Bold Street — "The Late-Night Energy"
**Archetype**: Burgers, tacos, street food, high-volume, social-first
**Vibe**: Dark Tech / Kinetic (true black, hot pink/acid green, glitch, high contrast)

| Aspect | Specification |
|--------|---------------|
| **Layout** | Bento grid hero (asymmetric tiles). Sections = horizontal scroll strips (hijack). Sticky category bar with swipe. Full-bleed everything. |
| **Typography** | Display: `Archivo Black` (ultra-bold, condensed). Body: `DM Sans` (compact, legible). Scale: `--text-hero: clamp(2rem, 5vw, 3.5rem)`. All caps for eyebrows. |
| **Color** | True black `#0A0A0A`, White `#FFFFFF`, Hot Pink `#FF1744`, Acid Green `#00FF87`, Cyan `#00E5FF`. High contrast only. |
| **Motion** | `MOTION_INTENSITY: 8` — Aggressive, kinetic. Glitch text on load. Horizontal scroll hijack (GSAP). 3D card tilt (15deg). Magnetic buttons. Slam-in reveals (spring bounce). |
| **Components** | Sharp cards (0 radius). Double-bezel: outer neon glow, inner black. Divider: skewed bars. Nav: detached top bar, category chips. Buttons: fill + neon outline, magnetic. |
| **Grid** | Bento: mixed spans (hero 2x2, items 1x1). Horizontal scroll strips for categories. Section padding: `py-16`. |
| **Imagery** | High-saturation, flash photography style. Halftone texture overlay. Animated GIFs supported. |

---

### Template 4: Warm Rustic — "The Family Table"
**Archetype**: Farm-to-table, BBQ, comfort food, heritage, storytelling
**Vibe**: Editorial Luxury (warm, paper textures, hand-drawn, serif warmth)

| Aspect | Specification |
|--------|---------------|
| **Layout** | Story-first: hero → "Our Story" → categories as chapters. Each category = full-bleed banner + editorial quote. Footer = contact + map. |
| **Typography** | Display: `Fraunces` (editorial serif, variable). Body: `Crimson Pro` (readable serif). Scale: `--text-hero: clamp(2.5rem, 6vw, 4rem)`. Loose leading (1.15). |
| **Color** | Cream `#FEF9F0`, Dark Brown `#2D1B10`, Terracotta `#C45A2A`, Olive `#5A6B3D`, Warm Gold `#D4A843`. Paper texture base. |
| **Motion** | `MOTION_INTENSITY: 4` — Warm, human. Typewriter text reveal (1500ms). Paper texture parallax. Gentle float on illustrations. |
| **Components** | Double-bezel: outer paper, inner cream. Divider: wheat/leaf motif. Nav: sticky bar with wood texture. Buttons: terracotta fill, rounded. Cards: soft shadow, 1rem radius. |
| **Grid** | Single column, centered. Category banners full-bleed. Section padding: `py-24`. Max width 680px. |
| **Imagery** | Lifestyle/process shots (hands, fire, ingredients). Paper grain overlay (opacity 0.05). Hand-drawn divider SVGs. |

---

### Template 5: Vibrant Playful — "The Joyful Spot"
**Archetype**: Dessert, ice cream, brunch, bubble tea, family-friendly
**Vibe**: Soft Structuralism (pastels, rounded, bouncy, illustrated)

| Aspect | Specification |
|--------|---------------|
| **Layout** | Hero = illustrated mascot + kinetic type. Sections = card carousel (snap). Floating action button for "Build Your Own". Bottom sheet nav on mobile. |
| **Typography** | Display: `Poppins` / `Outfit` (rounded geometric). Body: `Outfit` (friendly). Scale: `--text-hero: clamp(2.5rem, 7vw, 4.5rem)`. Rounded letterforms. |
| **Color** | Cream `#FFFDF5`, Blush `#FCE4EC`, Mint `#E0F2F1`, Lavender `#F3E5F5`, Peach `#FFF3E0`, Coral `#FF8A65`. Multi-accent palette. |
| **Motion** | `MOTION_INTENSITY: 7` — Spring physics everywhere. Bounce-in (cubic-bezier(0.34,1.56,0.64,1)). Squish on click. Floating blobs. Confetti on "Add to Favorites". |
| **Components** | Full-pill cards (9999px). Double-bezel: outer pastel, inner white. Divider: wave motif. Nav: bottom sheet (mobile), floating pills (desktop). Buttons: gradient fill, bounce. |
| **Grid** | Carousel/snap for categories. 2-col ≥ 640px. Section padding: `py-20`. |
| **Imagery** | Illustrated heroes + real photos. Floating decorative blobs. Confetti burst on interactions. |

---

## Directory Page (Landing) — "The Gateway"

**Single page, template-agnostic, but immersive.**

| Aspect | Specification |
|--------|---------------|
| **Hero** | Full-viewport, kinetic type "Discover Our Restaurants". Count badge animated. Subtle mesh gradient background (template-agnostic neutrals). |
| **Cards** | Masonry/bento grid. Each card: parallax cover (mouse + scroll), logo, name, tagline, cuisine chips, price range, "Open Now" pulse. Hover: lift + zoom + CTA reveal. |
| **Search/Filter** | Floating glass pill (top-center). Cuisine chips, template filter, "Open Now" toggle. Real-time filter with count. |
| **Motion** | Staggered card entry (120ms). Scroll reveal on filter change. View Transition to restaurant page (morphing cover). |
| **Empty State** | Illustrated, friendly, "No matches — try broadening filters." |

---

## Technical Architecture

### Schema Addition (Backward-Compatible)
```typescript
// In RestaurantSchema
template: z.enum([
  "editorial-classic",
  "modern-minimal", 
  "bold-street",
  "warm-rustic",
  "vibrant-playful"
]).optional().default("editorial-classic"),

// Keep moodPreset for backward compat (maps to template if template absent)
moodPreset: z.enum([...]).optional(),
```

### Template Registry
```typescript
// src/lib/templates/registry.ts
export interface Template {
  id: string;
  name: string;
  description: string;
  layout: 'editorial' | 'minimal' | 'bento' | 'story' | 'carousel';
  defaultMoodPreset: MoodPresetName; // fallback
  components: {
    Hero: string;        // path to template Hero
    Header: string;
    CategoryHero: string;
    MenuCard: string;
    FeaturedCarousel: string;
    Footer: string;
    CategoryNav: string;
  };
  motion: MotionConfig;
  typography: TypographyScale;
  colorDefaults: Partial<Theme>;
}
```

### File Structure
```
src/
├── lib/
│   ├── templates/
│   │   ├── registry.ts           # Template definitions + resolver
│   │   ├── editorial-classic/
│   │   │   ├── config.ts         # Defaults, component map
│   │   │   ├── Hero.astro
│   │   │   ├── Header.astro
│   │   │   ├── CategoryHero.astro
│   │   │   ├── MenuCard.astro
│   │   │   ├── FeaturedCarousel.astro
│   │   │   ├── Footer.astro
│   │   │   ├── CategoryNav.astro
│   │   │   └── styles.css        # CSS vars + template styles
│   │   ├── modern-minimal/       # ... same structure
│   │   ├── bold-street/
│   │   ├── warm-rustic/
│   │   └── vibrant-playful/
│   └── templateResolver.ts       # getTemplate(restaurant) → Template
├── pages/
│   ├── index.astro               # Directory page (new)
│   └── r/[slug]/index.astro      # Uses template resolver
├── components/
│   └── shared/                   # Shared base components (fallbacks)
```

### Resolution Logic
```typescript
function getTemplate(restaurant: Restaurant): Template {
  // 1. Explicit template field
  if (restaurant.template) return registry[restaurant.template];
  // 2. Fallback: moodPreset → template mapping
  const moodToTemplate: Record<MoodPresetName, TemplateId> = {
    'fine-dining': 'editorial-classic',
    'modern-minimal': 'modern-minimal',
    'bold-street': 'bold-street',
    'rustic-traditional': 'warm-rustic',
    'playful-casual': 'vibrant-playful',
  };
  return registry[moodToTemplate[restaurant.moodPreset] || 'editorial-classic'];
}
```

---

## Asset Handling Fix

**Problem**: Components reference `/r/<slug>/assets/...` for logos/covers even when config uses external URLs.

**Solution**: Centralized asset resolver in `src/lib/assets.ts`:
```typescript
export function resolveAsset(restaurant: Restaurant, path: string, type: 'logo' | 'cover' | 'menu'): string {
  const value = type === 'logo' ? restaurant.logo : type === 'cover' ? restaurant.coverImage : path;
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return `/r/${restaurant.slug}/assets/${value}`;
}
```

All components import and use this. Logos stay local (brand assets), covers/items support both.

---

## new-restaurant Scaffold Update

```bash
npm run new-restaurant "My Place" --template editorial-classic
```

Interactive prompt:
```
? Restaurant name: My Place
? Template: (use arrow keys)
  ▸ editorial-classic  — Fine dining, heritage, editorial
    modern-minimal     — Cafés, clean, aesthetic-first
    bold-street        — Burgers, street, high-energy
    warm-rustic        — Farm-to-table, cozy, storytelling
    vibrant-playful    — Dessert, brunch, fun, colorful
```

Creates folder with template's default config + placeholder assets.

---

## Migration for Existing Restaurants

| Restaurant | Current moodPreset | Assigned Template |
|------------|-------------------|-------------------|
| bella-italia | fine-dining | editorial-classic |
| matcha-minimal | modern-minimal | modern-minimal |
| neon-burger | bold-street | bold-street |

Config updated with `"template": "..."` field. No breaking changes.

---

## Success Criteria

1. ✅ Each template renders distinctly different — same content, unrecognizable as same platform
2. ✅ Directory page is Awwwards-tier — immersive, not a grid
3. ✅ Zero 404s — all assets resolve (local + external)
4. ✅ `npm run validate:configs` passes
5. ✅ `npm run build` passes
6. ✅ Mobile: all templates collapse gracefully < 768px
7. ✅ Reduced motion: all animations collapse instantly
8. ✅ Template switchable per-restaurant via single config field
9. ✅ Backward compatible — old configs without `template` still work via moodPreset mapping