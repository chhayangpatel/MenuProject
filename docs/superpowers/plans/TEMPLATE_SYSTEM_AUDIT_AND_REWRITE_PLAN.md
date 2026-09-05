# Restaurant Template System - Complete Rewrite Plan

> **Status**: Awaiting Approval
> **Goal**: Apple-level restaurant digital experiences
> **Approach**: Complete rewrite with world-class design principles

---

## Executive Summary

Current state: Broken template system with CSS loading failures, variable mismatches, missing assets, and inconsistent design.

Target state: 5 world-class, visually distinct restaurant templates that feel like Apple-designed products.

---

## Root Cause Analysis

### Critical Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| Template CSS not loading via `<link>` | CRITICAL | Templates have no styling |
| Variable naming mismatch (theme vs templates) | CRITICAL | Variables resolve to nothing |
| `max-w-5xl mx-auto` constrains full-bleed designs | HIGH | Templates can't use full width |
| Missing fonts for templates | HIGH | Wrong typography |
| Assets path inconsistency | MEDIUM | Images don't load |

---

## Design Principles (Apple-Level)

### Typography
- Each template has a distinct typographic voice
- Proper font loading via Google Fonts
- Fluid type scale using `clamp()`
- Careful attention to line-height, tracking, and leading

### Layout
- Full-bleed hero sections
- Generous whitespace
- Asymmetric layouts where appropriate
- Grid systems that breathe

### Motion
- `prefers-reduced-motion` support everywhere
- Custom cubic-bezier curves
- Staggered reveals
- Smooth page transitions

### Color
- Template-specific color palettes
- Semantic variable naming
- Dark mode support

### Images
- Proper aspect ratios
- Parallax scrolling
- Lazy loading
- Placeholder states

---

## Implementation Phases

### Phase 1: Foundation Fixes (2-3 hours)
1. Fix RestaurantLayout to load template CSS properly
2. Add proper font loading for all template fonts
3. Remove `max-w-5xl mx-auto` constraint
4. Fix variable naming to match between theme and templates

### Phase 2: Template Polish (4-6 hours)
1. **Editorial Classic** - Refine gold accents, add noise texture, smooth parallax
2. **Modern Minimal** - Refine spacing, add subtle hover states, fix radius
3. **Bold Street** - Add glitch animations, fix hardcoded colors, improve bento grid
4. **Warm Rustic** - Add paper texture, typewriter effects, wheat dividers
5. **Vibrant Playful** - Add spring physics, bounce animations, confetti

### Phase 3: Integration & Polish (2-3 hours)
1. Fix asset paths
2. Add template-specific loading screens
3. View Transitions between directory and restaurant
4. Mobile optimization pass
5. Accessibility audit

### Phase 4: Testing & Quality (1-2 hours)
1. Cross-browser testing
2. Performance audit (Lighthouse)
3. Accessibility audit (axe)
4. Final visual polish

---

## Success Criteria

- [ ] All 5 templates load and render correctly
- [ ] Each template is visually distinct and recognizable
- [ ] Font loading works for all template fonts
- [ ] Images load properly
- [ ] Motion animations feel premium and natural
- [ ] Mobile experience is excellent
- [ ] Accessibility score 90+
- [ ] Lighthouse performance 90+
- [ ] No console errors

---

## Design Specifications Per Template

### Editorial Classic
**Fonts**: PP Editorial New + Plus Jakarta Sans
**Motion**: Slow, cinematic (1200ms entries)
**Colors**: Cream (#FDFBF7), Espresso (#1A1612), Gold (#C9A227)
**Features**: Slow zoom hero, gold dividers, glass nav pill, double-bezel cards

### Modern Minimal
**Fonts**: Space Grotesk + Plus Jakarta Sans
**Motion**: Clean, functional (800ms entries)
**Colors**: Off-white (#FAFAF8), Charcoal (#1A1A1A), Sage (#4A7C59)
**Features**: Minimal hero, centered layout, single-bezel cards, subtle reveals

### Bold Street
**Fonts**: Archivo Black + DM Sans
**Motion**: Aggressive, kinetic (600ms entries)
**Colors**: True black (#0A0A0A), Hot pink (#FF1744), Acid green (#00FF87)
**Features**: Bento hero, neon glow cards, horizontal scroll strips, glitch effects

### Warm Rustic
**Fonts**: Fraunces + Crimson Pro
**Motion**: Warm, human (1500ms entries)
**Colors**: Cream (#FEF9F0), Dark brown (#2D1B10), Terracotta (#C45A2A)
**Features**: Paper texture, typewriter reveals, wheat dividers, story-first layout

### Vibrant Playful
**Fonts**: Outfit (display and body)
**Motion**: Spring physics (500ms entries)
**Colors**: Cream (#FFFDF5), Coral (#FF8A65), Pastel accents
**Features**: Bounce animations, floating blobs, confetti interactions, carousel sections

---

## Approval Required

Before proceeding, confirm:

1. **Approach**: Complete rewrite with world-class design
2. **Timeline**: 10-14 hours of focused implementation
3. **Quality bar**: Apple-level, Awwwards-tier
4. **Scope**: All 5 templates + directory page + integration

---

*Plan created: 2026-09-05*