# Codebase Review — Enterprise Architecture Audit

**Reviewer lens:** Senior/Staff engineer, multi-tenant SaaS & design-systems background
**Scope:** Full repository audit against the end-state goal — *a menu-hosting platform that onboards thousands of restaurants with zero code changes, UI-switchable one-of-a-kind templates, and world-class design.*
**Date:** 2026-09-05 · **Verdict per section:** 🟢 Good · 🟡 Needs work · 🔴 Blocks scale

---

## 1. Executive Summary

The project has an unusually strong foundation for its age: a correct static multi-tenant architecture (Astro + Zod + per-restaurant JSON), **five fully-built template systems**, a schema that is ahead of commercial menu platforms (variants, modifiers, allergens, combos, menu variants), and working onboarding tooling.

However, the codebase has accumulated **three structural debts that will compound painfully** as templates and restaurants multiply, and several production-readiness gaps (CI/CD, SEO, scale strategy). None are hard to fix now; all are expensive to fix after 50+ restaurants exist.

**Top 5 actions (in order):**

1. 🔴 Consolidate template configuration into the registry (currently defined in 3+ places).
2. 🔴 Eliminate the 40-import + switch-statement component resolution in `r/[slug]/index.astro` — use a dynamic component map.
3. 🔴 Add the missing CI/CD workflows (nothing deploys today).
4. 🟡 Remove `ec-*` (editorial-classic) class-name bleed from shared page code.
5. 🟡 Ship the template preview/switcher experience (assets already exist, unconnected).

---

## 2. Architecture & Multi-Tenancy

### 🟢 What's right

| Area | Assessment |
|---|---|
| `restaurants/` = data, `src/` = code | Correctly enforced; adding a restaurant requires no code changes. |
| Zod schema as source of truth | Rich, validated at build time, good enum discipline. |
| Path-based tenancy (`/r/[slug]/`) | Right call for static hosting; `getStaticPaths` isolates each restaurant. |
| Registry pattern (`src/lib/templates/registry.ts`) | The right abstraction — typed `Template` interface with motion, typography, color defaults. |
| Template-per-component-set | Each template owning its full component set is what enables "one-of-a-kind" designs vs. one parametric template. |

### 🔴 Finding AR-1: Template configuration is defined in 3+ places

The same facts (fonts, colors, radius, mood-preset mapping) are independently hardcoded in:

1. `src/lib/templates/registry.ts` — `colorDefaults`, `typography`, `defaultMoodPreset` ✅ (intended source of truth)
2. `src/layouts/RestaurantLayout.astro` — a **second** `templates` font map (lines 25–41), a **second** `moodMap` (lines 15–21), and ~230 lines of `--tpl-*` CSS duplicating the registry's `colorDefaults` (lines 64–92)
3. `src/pages/r/[slug]/index.astro` — a **third** resolution via `getTemplate()` plus a 55-line `switch` that duplicates `registry.components`

**Impact:** Every new template requires 3 synchronized edits; the layout's inline CSS and the registry have *already drifted* (e.g., registry says editorial radius `lg`, layout hardcodes `1rem` for a different scale; layout's `--tpl-*` tokens are never consumed by template components that use their own `--ec-*`/`--bs-*`/etc. tokens).

**Fix (Phase 0):** Registry becomes the single source of truth. Layout derives font `<link>`, CSS custom properties, and body class **from** `getTemplate()`. Delete the inline maps and the hardcoded `:root` blocks.

### 🔴 Finding AR-2: Component resolution doesn't scale

`r/[slug]/index.astro` statically imports **35 component files** and resolves them via a hand-written `switch`. Adding template #6 means +7 imports, +7 case branches, ~30 lines of copy-paste per template — in the hottest file in the app.

**Fix:** Build a `src/lib/templates/components.ts` (or `astro:content`-style map): one object literal `{ 'editorial-classic': { Hero, Header, ... }, ... }` imported once. Astro statically analyzes object-literal member access, so tree-shaking is preserved. One line per template, forever.

### 🟡 Finding AR-3: `ec-*` class-prefix bleed

The shared `[slug]` page uses `ec-story-section`, `ec-reveal`, `ec-divider`, `ec-items-grid`, `data-scramble` — editorial-classic's namespace — for **all** templates. This means (a) other templates' pages carry dead editorial styling hooks, and (b) a template can't restyle the shared reveal/divider behavior without fighting a foreign prefix.

**Fix:** Shared page scaffolding should use neutral names (`mr-reveal`, `mr-divider`, `mr-story`) or, better, move reveal/divider/story into per-template components as the registry interface already anticipates. Keep `data-scramble` opt-in per template via the registry's `motion.intensity`.

### 🟡 Finding AR-4: One mega inline script does five jobs

Item-detail click wiring, scroll reveal, text scramble, swipe nav, and 3D card tilt all live in one `define:vars` script (~145 lines). Concerns: not cacheable per-concern, re-runs setup logic on every `astro:page-load`, tilt listeners are never removed (leak on view-transition navigation), and the reveal CSS is duplicated (page `<style>` vs. template CSS).

**Fix:** Split into `src/lib/client/` modules (`reveal.ts`, `detailSheet.ts`, `tilt.ts`, `swipeNav.ts` — note `swipeNav.ts` and `magnetic.ts` already exist in `src/lib/` but are unused here), each idempotent under `astro:page-load`, each removing its own listeners.

---

## 3. Design System & Templates

### 🟢 What's right

- The 5 templates are genuinely distinct design languages (editorial serif / geometric minimal / street bento / rustic paper / playful spring), with per-template motion intensity (3–8), stagger rhythm, and parallax depth recorded in the registry. This is exactly the "curated presets, not blank canvas" strategy the PRD prescribes.
- `check-contrast.mjs` exists — user-supplied colors treated as untrusted data is the correct enterprise instinct.

### 🟡 Finding DS-1: Motion polish is uneven and partially hardcoded

- Text-scramble effect runs on **every** template's category headings via shared page code — thematically wrong for editorial/fine-dining (should be bold-street/vibrant only). Gate it per template via registry `motion` config.
- Reveal timing (800ms, 100ms stagger inline `style`) ignores the registry's per-template `entryDuration`/`staggerDelay`.
- Registry `MotionConfig` and `TypographyScale` are declared but **never consumed** by components — they're documentation, not behavior, today.

**Fix (Phase 1):** Layout emits registry motion/typography values as CSS custom properties (`--mr-entry-duration`, `--mr-stagger`, etc.); components consume tokens. This makes "vibrant-playful springs faster than editorial-classic" true in code, not in comments.

### 🟡 Finding DS-2: No template showcase/preview experience

`template-showcase.html` (repo root, orphaned) and `src/components/TemplateSwitcher.tsx` exist but are unwired. The end-state requirement — "5–6 basic templates easily switchable from UI" — needs:

1. A `/templates` gallery page rendering all templates with the same demo data (build-time generated, zero JS).
2. A `?template=` preview override on restaurant pages for admin/demo use (guarded so it never affects production pages of other restaurants).

### 🟡 Finding DS-3: Brand tokens vs. template defaults precedence is implicit

`colorDefaults` in the registry compete with `theme` in restaurant config. Define and document precedence explicitly: **restaurant config > template defaults > global fallbacks**, and validate the merge in `theme.ts`.

---

## 4. Data & Schema

### 🟢 Good

- Schema covers far more than v1 needs (variants, modifiers, nutrition, allergens, combos, menu variants) without breaking config simplicity — optional fields done right.
- `menuVariants` with day/time windows is a differentiator (lunch/dinner switching).

### 🟡 Findings

- **DA-1:** `hours.regular` is `z.record(z.string())` — accepts any keys. Constrain to day-name enum so the hours UI can't silently miss a day.
- **DA-2:** No `configVersion` field. Before thousands of restaurants exist, add one so future schema migrations can be detected and validated per-version (`"configVersion": 1`).
- **DA-3:** Item `id` uniqueness within a restaurant isn't validated across categories (item detail sheet looks up by flat `id` — collisions across categories would show the wrong item). Validate uniqueness in `loadRestaurants.ts`.
- **DA-4:** Prices as `z.number()` — fine, but document currency rounding rules; `formatCurrency` should be the only formatter (it exists — enforce usage; some components format inline).

---

## 5. Performance & Accessibility

| Finding | Severity | Detail |
|---|---|---|
| Fonts fetched from Google Fonts CSS2 API at runtime per page | 🟡 | Blocks first paint ~100–300ms on cold 4G; consider `fontsource` npm packages (self-hosted, subset, preloaded) per template. |
| `LoadingScreen` on every restaurant page | 🟡 | A branded loading screen on a **static** page adds perceived latency with no fetch to wait for. Reserve it for view-transition navigation only, or drop it. |
| `will-change: transform, opacity` on every reveal element | 🟡 | Hundreds of menu items × will-change = memory pressure on low-end Android. Apply only during animation (add/remove class). |
| 3D tilt on every card via JS mousemove | 🟡 | Layout thrash risk on large menus; cap to devices with hover + fine pointer, throttle via rAF (partially done), and disable over ~60 visible cards. |
| Inline `style` attributes throughout `[slug]` page | 🟡 | Defeats CSS caching and CSP-friendliness; move to classes. |
| `prefers-reduced-motion` | 🟢 | Consistently respected in reveal, scramble, swipe, tilt. Keep this discipline. |
| Keyboard access to item sheet | 🟢 | Enter/Space handlers present. Verify focus trap in `ItemDetailSheet` and `Escape`/backdrop close during Phase 1 QA. |

---

## 6. Operations, CI/CD, Deployment

- 🔴 **No `.github/workflows/` directory exists.** The PRD specifies `validate.yml` + `deploy.yml`; neither is implemented. Nothing is deployed, and nothing gates bad configs. This is the single highest-priority ops item.
- 🟡 `astro.config.mjs` must set `site` + `base` correctly for GitHub Pages project-scope URLs; sitemap integration missing.
- 🟡 No OG image generation per restaurant (link previews are a QR-code menu's storefront). Plan: build-time OG image generation (Satori or Astro OG) per restaurant using logo + palette.
- 🟡 `body.json` and orphaned `template-showcase.html` at repo root — remove or relocate.
- 🟡 Root `README.md` is still Astro starter boilerplate — replace with the real project README pointing into `docs/`.

---

## 7. Scale Readiness (the "thousands of restaurants" question)

| Concern | Current state | Gap |
|---|---|---|
| Build time | 3 restaurants | At ~5k restaurants × ~30KB config, config parse + validation is fine; **image optimization becomes the bottleneck**. Plan sharp/asset caching + optional "images already optimized" flag per config. |
| Directory page | Renders all restaurants | Needs pagination/search-at-scale beyond ~200 cards; or category/cuisine index pages. |
| Fonts | Google CDN | Self-host per template; per-restaurant font choice should be constrained to the template's licensed set. |
| Repo size | Small | Menu photos will bloat git. See `06-scaling-architecture.md` for the external-asset strategy. |
| Self-service editing | None (JSON + PR) | Decision needed: git-based CMS vs. headless API. See `07-self-service-options.md`. |
| Custom domains | Not supported | Fine for v1; document the per-restaurant-repo escape hatch. |

---

## 8. Code Quality Notes

- TypeScript throughout 🟢; zod inference types exported 🟢.
- Unused lib utilities (`magnetic.ts`, `parallax.ts`, `swipeNav.ts`, `textScramble.ts` in `src/lib`) duplicate logic inline in the page script — either adopt them (preferred) or delete.
- `DirectorySearch.js` + `DirectorySearchInit.astro` pattern (plain JS island) is the right lightweight approach — reuse it for the template switcher.
- Component prop interfaces are implicit in several `.astro` files; document required props per template component in the authoring guide.

---

## 9. Severity-Ranked Backlog (feeds `docs/roadmap.md`)

| # | Item | Severity | Phase |
|---|---|---|---|
| 1 | CI/CD workflows (validate + deploy) | 🔴 | 0 |
| 2 | Registry = single source of truth (layout consumes it) | 🔴 | 0 |
| 3 | Dynamic template component map; delete switch | 🔴 | 0 |
| 4 | Neutral shared class names; kill `ec-*` bleed | 🟡 | 0 |
| 5 | Split mega-script into lib modules; fix listener leaks | 🟡 | 1 |
| 6 | Registry motion/typography → CSS tokens, consumed by components | 🟡 | 1 |
| 7 | `/templates` showcase + `?template=` preview override | 🟡 | 1 |
| 8 | Self-host fonts (fontsource), drop runtime Google CSS | 🟡 | 1 |
| 9 | SEO: per-restaurant OG images, sitemap, canonical URLs | 🟡 | 2 |
| 10 | QR code generation per restaurant (build-time) | 🟡 | 2 |
| 11 | Directory pagination/search for 200+ restaurants | 🟡 | 2 |
| 12 | Schema hardening (hours enum, configVersion, item-id uniqueness) | 🟡 | 2 |
| 13 | Scale architecture (image caching, external asset strategy) | 🟡 | 3 |
| 14 | Self-service editing path (decision + implementation) | 🟡 | 3 |
| 15 | Per-restaurant custom domains escape hatch | 🟢 | 3 |
| 16 | Repo hygiene (body.json, orphaned files, README) | 🟡 | 0 |

---

## 10. Conclusion

This is a **B+ codebase with an A roadmap document set missing**. The architecture decisions are correct; the debts are consolidation and productionization, not redesign. Executing Phases 0–2 in `docs/roadmap.md` gets the platform to a state where onboarding restaurant #500 is as boring as onboarding #3 — which is the entire point.