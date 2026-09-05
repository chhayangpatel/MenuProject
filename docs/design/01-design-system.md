# Design System — "MenuCraft" Experience Specification

**Author lens:** Design leader, 20 years — hospitality brands, editorial design, motion systems
**Purpose:** The definitive design specification for the platform. Every template, component, and animation must trace back to this document. Written to be handed to a developer (or agent) and implemented without ambiguity.
**Status:** v1 · Companion docs: `02-template-authoring-guide.md`, `../roadmap.md`

---

## 1. Design Philosophy

### 1.1 The core tension, and how we resolve it

A menu generated from a JSON file must feel **bespoke**. Infinite freedom produces inconsistent design; a single parametric template produces generic design. The resolution:

> **A small number of expertly-designed, fully-realized design languages (templates), each expressing the restaurant's own brand assets (colors, logo, photography, voice) through its own lens.**

A template is not a color theme. It is a complete design language: typography, layout grammar, spacing rhythm, decorative motif, imagery treatment, and — critically — its own **motion personality**.

### 1.2 Non-negotiables (apply to every template)

1. **The food is the hero.** Every design decision defers to legibility of dish names and prices. If an effect competes with scanning a menu, the effect loses.
2. **Motion is seasoning, never the meal.** Every animation has a `prefers-reduced-motion: reduce` fallback showing the end state instantly. The menu is 100% readable with JavaScript off.
3. **Thumb-first.** Primary device is a phone scanning a QR at a table. One-handed reach, ≥44px targets, no precision gestures required.
4. **Brand tokens flow through templates.** Restaurant colors/fonts/logo are data; the template decides *how* they're expressed. Precedence: restaurant config → template defaults → global fallbacks.
5. **No template ever looks like "the same site, different colors."** If two templates can be told apart only by hue, one of them is wrong.

### 1.3 The 60-second test

A diner scans a QR code. Within 60 seconds, without scrolling past the hero, they should know: **what kind of place this is, what it feels like, and how to find food.** Each template's hero (below) is engineered for this.

---

## 2. Token Architecture

All tokens are CSS custom properties emitted by the layout from the template registry + restaurant config. This is the contract every template component consumes.

### 2.1 Token naming contract

```css
/* ── Brand (from restaurant config, validated for contrast) ── */
--mr-primary;        /* dominant text/surface ink */
--mr-secondary;      /* page background */
--mr-accent;         /* price, active states, highlights */

/* ── Template voice (from registry, NOT restaurant-configurable) ── */
--mr-font-heading;
--mr-font-body;
--mr-radius;             /* px value derived from borderRadius enum */
--mr-radius-sm;          /* radius × 0.6 */
--mr-gutter;             /* spacing rhythm: compact 16px / classic 20px / generous 24px */
--mr-section-space;      /* vertical rhythm between sections */
--mr-maxw;               /* content max-width: 640–1200px depending on template */

/* ── Motion (from registry MotionConfig — Phase 1 makes these live) ── */
--mr-ease-out-expo;      /* cubic-bezier(0.16, 1, 0.3, 1) */
--mr-ease-spring;        /* cubic-bezier(0.34, 1.56, 0.64, 1) */
--mr-ease-fluid;         /* cubic-bezier(0.32, 0.72, 0, 1) */
--mr-ease-snap;          /* cubic-bezier(0.76, 0, 0.24, 1) */
--mr-entry-duration;     /* per-template: 500–1500ms */
--mr-stagger;            /* per-template: 50–150ms */
--mr-motion-scale;       /* registry intensity 1–10 → multiplier for effect amplitude */

/* ── Semantic (derived, computed in theme.ts) ── */
--mr-on-accent;          /* accessible text color on accent, computed for contrast */
--mr-surface;            /* card surface: secondary or white depending on mode */
--mr-surface-border;     /* color-mix(in srgb, var(--mr-primary) 12%, transparent) */
--mr-ink-60;             /* color-mix primary 60% — secondary text */
--mr-ink-40;             /* tertiary text */
```

**Rules:**
- Template components may only reference `--mr-*` tokens. No hardcoded hex in components (textures/motif SVG fills may use `currentColor`).
- Restaurant config never changes a template's fonts, radius, spacing rhythm, or motion — those are the template's identity. Only brand colors, logo, imagery, and copy.
- `theme.ts` computes `--mr-on-accent` and contrast-checks the final palette; failing combinations are flagged by CI (`check:contrast`).

### 2.2 Spacing rhythm

| Rhythm | Value | Used by |
|---|---|---|
| `compact` | gutter 16, section-space 48px, item-gap 12px | bold-street |
| `classic` | gutter 20, section-space 64px, item-gap 16px | modern-minimal, vibrant-playful |
| `generous` | gutter 24, section-space 88px, item-gap 20px | editorial-classic, warm-rustic |

### 2.3 Type scale

Base scale (clamp-fluid), adjusted per template via registry `TypographyScale`:

| Role | Scale |
|---|---|
| `hero` | `clamp(2.4rem, 7vw, 4.5rem)` — template may override |
| `category` | `clamp(1.5rem, 4vw, 2rem)` |
| `item-name` | `1.05–1.2rem` |
| `body/desc` | `0.9rem` |
| `price` | `1rem`, weight 700, accent color |
| `caption/tags` | `0.6875rem`, uppercase, tracking +0.08em |

**Editorial rule:** headings never wrap past 2 lines — set `text-wrap: balance` on all headings.

---

## 3. The Template Design Languages

> Each template below is specified as: identity → layout grammar → signature moments → motion choreography → imagery treatment → do/don't. These are the specs the five existing template folders implement (and the bar template #6+ must meet).

### 3.1 `editorial-classic` — Quiet Luxury

**For:** fine dining, steakhouses, heritage restaurants, tasting menus.

- **Identity:** a Michelin-starred printed menu photographed by Kinfolk. Serif display (Playfair), hairline rules, gold accent used like gilding — sparingly, only on price and one motif per viewport.
- **Layout grammar:** single centered column, max-w 640px for narrative, 2-col asymmetric grid for items (name-dotted-leader-price, no card boxes — the page *is* the menu paper). Category transitions are full-width hairline rules with a small centered motif.
- **Signature moments:**
  - **Hero:** full-bleed cover with heavy top-lit scrim, logo medallion in a thin gold ring overlapping the image edge, tagline in italic serif. Slow Ken-Burns drift (120s, imperceptible but alive).
  - **Item reveal:** cards rise 16px + fade over 1200ms with 120ms stagger — deliberate, like a maître d' pacing.
  - **Price treatment:** gold, serif, old-style figures if available.
- **Motion personality:** intensity 4. Nothing springs. Everything eases-out-expo. Parallax 0.3 on hero only.
- **Imagery:** desaturated slightly (CSS filter `saturate(0.92)`), consistent 4:3, subtle vignette.
- **Don't:** pill shapes, bright tags, bento grids, bold uppercase. A fine-dining menu never shouts.

### 3.2 `modern-minimal` — Confident Clarity

**For:** specialty coffee, bakeries, poke/health bowls, design-led fast-casual.

- **Identity:** Aesop meets Apple menu board. Geometric sans (Space Grotesk), extreme whitespace, photography does all the talking.
- **Layout grammar:** card-forward, generous 2-col grid, cards with hairline borders (no shadows until hover), left-aligned everything, oversized category numerals (01, 02…) as wayfinding.
- **Signature moments:**
  - **Hero:** split composition — left third is pure typography on background color, right two-thirds full-bleed image. Logo sits small and confident in the corner, not centered.
  - **Category numeral** tracks scroll: the active category's numeral fills with accent via background-clip animation.
  - **Hover:** card border brightens to primary, image scales 1.03 inside fixed mask — 200ms ease-fluid.
- **Motion personality:** intensity 3. Short distances, quick fades, zero bounce.
- **Imagery:** natural color, matte, generous negative space in photos; enforced 1:1 for item photos.
- **Don't:** gradients, textures, decorative motifs, more than 2 type sizes per viewport.

### 3.3 `bold-street` — Loud & Hungry

**For:** burgers, wings, tacos, fried chicken, night markets, social-first brands.

- **Identity:** a menu that feels like a hype poster / streetwear drop. Archivo Black, brutal contrast, accent color used at full saturation, zero radius.
- **Layout grammar:** bento grid — featured items get oversized tiles, prices are the largest text on the card, tags are hard-edged stamps. Section headers may rotate -2° and overlap their rule.
- **Signature moments:**
  - **Hero:** massive typographic hero — restaurant name set enormous, slight skew, hard accent underline block; cover photo duotoned in brand colors (CSS `mix-blend-mode`). Marquee strip (CSS animation, pauses on reduced-motion) of "HOT • FRESH • DAILY" style words along the bottom edge.
  - **Text scramble** on category headings (this is its home — gated off for other templates).
  - **Featured tile:** subtle parallax (depth 0.5), hard 4px accent shadow that collapses to 0 on press (spring 120ms) — feels physical.
- **Motion personality:** intensity 8. Fast entry (600ms), tight stagger (60ms), snap easings.
- **Imagery:** high-contrast, high-saturation food glamour shots; duotone treatment on non-featured imagery.
- **Don't:** pastel, serif, whisper. But also don't animate more than two things per viewport — loud ≠ busy.

### 3.4 `warm-rustic` — Handmade Heritage

**For:** farm-to-table, BBQ, pizzerias, breweries, family restaurants with a story.

- **Identity:** letterpress on warm paper. Fraunces + Crimson Pro, ink-brown palette, hand-drawn sprig/underline motifs, textures at low opacity.
- **Layout grammar:** story-led — narrative sections interleave with the menu; category headers get hand-drawn underline SVG strokes that draw themselves on scroll (stroke-dashoffset animation, CSS-only via `animation-timeline: view()` where supported, IO fallback otherwise).
- **Signature moments:**
  - **Hero:** full-bleed with paper-grain texture overlay and warm scrim; logo in a hand-drawn oval frame; the tagline types itself (typewriter, 40ms/char, reduced-motion → instant).
  - **Our Story:** drop-cap first letter in Fraunces, body set in Crimson Pro at 1.85 leading — this template owns the editorial narrative moment.
  - **Divider:** the sprig motif draws itself between categories.
- **Motion personality:** intensity 4, slow (1500ms entries, 150ms stagger), fluid ease. Parallax 0.2.
- **Imagery:** warm grade (slight sepia via `filter: sepia(0.12) saturate(1.05)`), photos may be casually cropped — the paper texture unifies them.
- **Don't:** neon, geometric sans, hard shadows, pill buttons.

### 3.5 `vibrant-playful` — Joy Physics

**For:** dessert bars, ice cream, bubble tea, brunch, family spots.

- **Identity:** candy-store energy with real craft. Outfit rounded, pastel+neon palette, pill everything, spring physics on every interaction.
- **Layout grammar:** carousel-led — a horizontal snap-scroll featured rail under the hero; items in soft cards with thick (2px) borders in accent; wobble-on-tap.
- **Signature moments:**
  - **Hero:** overlapping organic blob shapes (SVG, brand-colored, slow morph via CSS border-radius animation) behind the logo; tagline letters bounce in with 40ms stagger using `--mr-ease-spring`.
  - **Card press:** scale 0.97 + rotate -0.5°, releases with overshoot spring — deliberately toy-like.
  - **Add-to-favorites heart** (local only, no backend): bursts 6 particles on tap (CSS keyframes, one-shot).
- **Motion personality:** intensity 7, fastest entries (500ms), tightest stagger (50ms), spring everywhere.
- **Imagery:** bright, high-key, playful angles; photos get a sticker treatment (white border + slight rotation, alternating ±2°).
- **Don't:** dark mode by default, thin serifs, corporate restraint. But keep tap targets and contrast — playful never means hard to read.

---

## 4. Motion System (platform-wide rules)

### 4.1 The choreography layers

| Layer | What | Where | Budget |
|---|---|---|---|
| **Entry** | Hero → tagline → nav → first items, sequenced | Page load, once | One sequence; total ≤ 1.2s to interactive-feel |
| **Scroll reveal** | Items/categories fade-rise as they enter viewport | Per element, once | IO-driven; amplitude scaled by `--mr-motion-scale` |
| **Ambient** | Ken-Burns, blob morph, marquee | Hero/backgrounds | Max 1 ambient effect per page; always paused under reduced-motion |
| **Feedback** | Hover lift, press, toggle | Interaction | 150–250ms; transform+opacity only |
| **Narrative** | Scramble, typewriter, SVG draw | Category headers/dividers | Only in templates whose identity calls for it |

### 4.2 Universal rules

1. **Transform and opacity only.** Never animate layout properties (width, top, margin).
2. **Sequenced entry, one conductor.** Entry delays are computed (`index × --mr-stagger`), capped at 8 elements before everything enters together.
3. **Sticky nav is never animated in position** — only its background/indicator.
4. **Every narrative/ambient effect has a reduced-motion static end-state** and the menu functions fully with JS disabled (reveal elements default-visible in `<noscript>` context: gate initial hidden state behind a `js` class on `<html>`).
5. **View Transitions** (`<ClientRouter />`) between directory ↔ restaurant: hero morphs (shared `transition:name` per restaurant logo). Non-supporting browsers get normal navigation.
6. **JS budget:** islands + client modules ≤ 50KB gzipped per page. Reveal/scramble/tilt/swipe live in small shared modules (`src/lib/client/`), each idempotent on `astro:page-load` and cleaning up its listeners.

### 4.3 Reduced-motion contract

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Plus per-effect explicit end-states (e.g., `.mr-reveal { opacity: 1; transform: none; }`). The registry's `reducedMotionFallback` (`instant` | `fade`) chooses the per-template feel for non-critical transitions.

---

## 5. Imagery System

| Slot | Ratio | Treatment |
|---|---|---|
| Cover/hero | 16:9 (mobile crop-safe: center 60%) | Template scrim + optional duotone/texture per template |
| Item photo | 4:3 (menu card), 1:1 (minimal) | `object-fit: cover`, aspect-ratio box reserved (zero CLS) |
| Detail sheet | 3:2 | Full-width, template scrim top |
| Logo | Square-safe medallion area 1:1 | Never stretched; medallion ring per template |

- All images via `astro:assets` (`<Image />`) → AVIF/WebP + srcset; restaurants upload once, pipeline handles sizes.
- **Placeholder discipline:** missing item photo renders the template's motif placeholder (an SVG plate/cup illustration in ink-12% color) — never a broken-image icon, never a gray box.
- **Scrim law:** no text over imagery without the template's gradient scrim; scrim opacity is a token (`--mr-scrim`), minimum 0.35 at the text edge.

---

## 6. States & Empty Content

| State | Spec |
|---|---|
| Unavailable (86'd) item | Name struck-through at 55% opacity, "Unavailable" chip, no hover affordance, excluded from search results unless query matches |
| No search results | Template-toned empty state: motif illustration + "Nothing matches — try clearing filters" + reset button |
| No featured items | Carousel section simply doesn't render (never an empty rail) |
| No story config | Story section omitted |
| Skeletons (view-transition) | Branded: `--mr-surface` blocks with a shimmer tinted `--mr-accent` at 8% — never generic gray |
| Tag chips | Colored per template but always AA-contrast; dietary icons carry `aria-label` and text labels on desktop |

---

## 7. Accessibility (design-level)

- Contrast: enforced by CI per-restaurant palette (≥4.5:1 body, ≥3:1 large text). `theme.ts` auto-derives `--mr-on-accent` rather than trusting restaurant choices.
- Focus: every interactive element shows a 2px accent focus ring offset 2px — the focus ring is part of each template's design, not a browser default.
- Touch: 44×44px minimum; category nav has scroll-snap + momentum, never precision-dependent.
- Motion: per §4.3. Content never depends on animation to be reachable.
- Semantics: one `<h1>` per page (restaurant name), categories are `<h2>` within `<section aria-labelledby>`, item sheet is `role="dialog"` with focus trap and Escape.

---

## 8. Template #6 Horizon (approved concepts, pick per demand)

Kept intentionally out of v1 — but designed to slot into the same registry interface:

1. **`neon-night`** — izakaya/late-night: dark glass, neon stroke type, glow pulses. (Dark-mode native.)
2. **`coastal-fresh`** — seafood/mediterranean: airy blue-greens, wave dividers, light film-grain.
3. **`night-bistro`** — wine bars: candlelit darks, gold hairlines, slowest motion of all templates (intensity 2).

Each must ship: 7 components + styles.css + registry entry + demo restaurant + showcase entry + contrast defaults. See `02-template-authoring-guide.md`.