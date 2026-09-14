# Immersive 3D Template — Design Spec

**Date:** 2026-09-14
**Status:** Draft
**Author:** Claude Code + user

---

## 1. Summary

A new premium menu template (`immersive-3d`) that uses Three.js (React Three Fiber) for a 3D hero scene and featured carousel, combined with CSS perspective tilt on menu cards. The goal is a "wow factor" dining experience that stands apart from the 10 existing templates.

**Key constraint:** Zero impact on existing templates. Three.js code is tree-shaken out of every other template's bundle. Supabase egress is unchanged.

---

## 2. Architecture

### Template identity

| Field | Value |
|-------|-------|
| `id` | `immersive-3d` |
| `name` | Immersive 3D |
| `prefix` | `id` |
| `layout` | `three-dimensional` (new) |
| `defaultMoodPreset` | `fine-dining` |
| `effects` | `['3d-tilt', 'floating-orbit', 'glassmorphism']` |

### File structure

```
src/lib/templates/immersive-3d/
├── Hero.astro              # Three.js canvas (client:only="react")
├── Header.astro            # Glassmorphism sticky header
├── CategoryNav.astro       # Pill tabs with 3D active indicator
├── CategoryHero.astro      # Parallax category header
├── MenuCard.astro          # CSS perspective tilt cards
├── FeaturedCarousel.astro  # Three.js 3D turntable carousel
├── Footer.astro            # Minimal dark footer
├── styles.css              # Template-scoped styles
└── three/                  # Three.js React components
    ├── HeroScene.tsx       # R3F Canvas + floating food planes
    ├── CarouselScene.tsx   # R3F 3D card carousel
    ├── FoodPlane.tsx       # Individual 3D food image plane
    ├── Particles.tsx       # Floating particle effects
    └── FallbackHero.astro  # Static fallback when WebGL unavailable
```

### Registration points (3 places + 1 folder)

1. `src/lib/templates/registry.ts` — `TemplateId` union + `templates` record entry + `LayoutType` + `TemplateEffect`
2. `src/schemas/restaurant.schema.ts` — `template` enum addition
3. `src/lib/templates/components.ts` — import block + `templateComponents` entry
4. `src/lib/templates/immersive-3d/` — the component folder

### Dependencies (new, only imported by this template)

- `@react-three/fiber` — React renderer for Three.js
- `@react-three/drei` — Helpers (OrbitControls, etc.)
- `three` — Three.js core

---

## 3. Component Design

### 3.1 Hero.astro + HeroScene.tsx

**Purpose:** Full-viewport Three.js canvas with floating food images.

**What it renders:**
- A `<Canvas>` from R3F filling the hero viewport
- 4-6 menu item images mapped onto 3D planes (`planeGeometry` + `meshBasicMaterial` with `<Texture>`)
- Each plane floats at a different depth (z) and drifts in a gentle orbit
- 50-100 small glowing particle dots (bokeh-style) drift upward
- Mouse/touch tracking tilts the entire scene (parallax depth)
- Restaurant identity overlay (HTML, not 3D) with glassmorphism backdrop

**Loading strategy:** `client:only="react"` + dynamic `import()` — Three.js only loads when this template is active.

**Performance guardrails:**
- Max 6 food planes
- Textures capped at 800px wide (`?w=800` URL param)
- `dpr={[1, 1.5]}` — caps pixel ratio
- `frameloop="demand"` — only re-renders on change

**Reduced motion:** AutoRotate stops, particles hidden, scene becomes static.

**Fallback:** If WebGL unavailable, renders `FallbackHero.astro` (static cover image + CSS parallax).

### 3.2 FeaturedCarousel.astro + CarouselScene.tsx

**Purpose:** 3D turntable showcasing featured/chef's-pick items.

**What it renders:**
- A `<Canvas>` with cards arranged in a circle on the Y-axis
- Each card is a 3D plane with dish image + name + price overlay
- Auto-rotates at 0.5 RPM, pauses on interaction, resumes after 3s
- Click/tap a card to scroll to it in the menu grid

**Interaction:**
- Desktop: Click-drag to rotate, scroll wheel also rotates
- Mobile: Swipe left/right, tap to jump

**Fallback:** Horizontal-scroll CSS strip with `scroll-snap-type: x mandatory`.

### 3.3 MenuCard.astro

**Purpose:** Individual menu item with CSS perspective tilt.

**Props:** Same as all templates — `item`, `currencySymbol`, `showPrices`, `restaurant`.

**Visual style:** Dark glassmorphism cards (`backdrop-filter: blur(12px)`) on dark background. Food image as full-bleed background with text overlaid at bottom.

**3D effect:** Vanilla JS tilt module (`src/lib/client/threeDtilt.ts`):
- `mousemove` → `perspective(800px) rotateY(Xdeg) rotateX(-Ydeg) translateZ(8px)`
- Dynamic shadow follows tilt direction
- `mouseleave` → snaps back to flat

**Reduced motion:** Tilt disabled, flat glass panels with static shadows.

### 3.4 Header.astro

Glassmorphism sticky header. `backdrop-filter: blur(20px)` on semi-transparent dark background. Restaurant name + phone/WhatsApp links. ≥44px touch targets.

### 3.5 CategoryNav.astro

Pill-style tabs with 3D active indicator. Selected tab has subtle `rotateX` tilt + glowing underline via `transform: scaleX()`. Horizontal scroll-snap on mobile.

### 3.6 CategoryHero.astro

Full-bleed parallax image. Image moves at 0.5x scroll speed (`transform: translateY()`). Text overlay with glassmorphism.

### 3.7 Footer.astro

Minimal dark footer — hours, address, socials. Glassmorphism style matching header.

---

## 4. Category Transitions

When switching categories:
- Current cards fold outward on X-axis and fade out (400ms, 30ms stagger)
- New cards fold in from opposite direction
- CSS `transform-style: preserve-3d` — no JS library
- Reduced motion: instant swap

---

## 5. Performance Budget

| Component | Library | Size (gz) | Loading |
|-----------|---------|-----------|---------|
| HeroScene | R3F + drei | ~220KB | `client:only="react"` + dynamic import |
| CarouselScene | R3F + drei | (shared chunk) | Same as HeroScene |
| Tilt effect | Vanilla JS | ~1KB | `client:load` |
| Other components | Astro only | ~0KB | Static HTML |

**Total extra: ~221KB gz** — only when `immersive-3d` is active. Other templates unaffected.

---

## 6. Fallbacks & Accessibility

### WebGL fallback
- `WebGLRenderingContext` test before mounting canvas
- Hero → static cover image + CSS parallax
- Carousel → horizontal scroll CSS strip
- Cards → flat glassmorphism (no tilt)

### Reduced motion
- `prefers-reduced-motion: reduce` disables all 3D animations
- AutoRotate, particles, tilt, category transitions all disabled
- Content remains fully readable

### Mobile
- Touch events for carousel and tilt
- Gyroscope tilt on hero (optional, graceful degradation)
- `dpr={[1, 1.5]}` caps pixel ratio

---

## 7. Integration Points

### Ordering
- `MenuCard.astro` uses `data-item-id` attribute (same as all templates)
- `cartStore` events work identically
- `OrderingFlow.tsx` and `OrdersDashboard.tsx` are template-agnostic

### Admin
- No admin changes needed — template is selected via `config.json` `"template": "immersive-3d"`
- Preview at `/admin/preview/<slug>/immersive-3d`

### Validation
- `npm run validate:configs` must pass with demo restaurant
- `npm run build` must succeed (49+ pages)
- Lighthouse mobile ≥ 90

---

## 8. Demo Restaurant

`restaurants/immersive-3d-demo/config.json`:
- Reuse `bella-italia` menu data
- Dark theme: `primaryColor: "#0A0A0A"`, `secondaryColor: "#111111"`, `accentColor: "#D4AF37"`
- `template: "immersive-3d"`

---

## 9. Out of Scope

- Actual 3D food model files (.glb/.gltf) — images mapped onto planes
- Spline embeds — pure Three.js
- Payment integration — ordering only (existing flow)
- Per-restaurant 3D customization beyond theme colors
