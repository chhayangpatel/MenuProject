# Roadmap — End-to-End Implementation Plan

**Source documents:** `review/01-codebase-review.md` (findings), `design/01-design-system.md` (design spec), `design/02-template-authoring-guide.md` (per-template process), `technical/06-scaling-architecture.md` (scale), `technical/07-self-service-options.md` (editing UX decision).

**End-state definition:** A platform where a new restaurant is onboarded in <30 minutes with zero code changes; where 5+ fully-distinct, expertly-designed templates are switchable per restaurant (preview-able from a UI); where every page passes the design quality bar and Lighthouse ≥90; and where the architecture holds to thousands of restaurants at ~$0 infra cost.

---

## Phase 0 — Consolidation & Production Foundation ⛏ *highest leverage, do first*

**Theme:** Remove structural debt before it compounds; make the platform deployable and self-guarding.

| # | Task | Detail | Acceptance criteria |
|---|---|---|---|
| 0.1 | **CI/CD workflows** | `.github/workflows/validate.yml` (PRs touching `restaurants/**` or `src/**`: install → `validate:configs` → `check:contrast` → build) and `deploy.yml` (push to `main`: validate → build → `actions/deploy-pages`). Configure `site`/`base` in `astro.config.mjs`. | A PR with a broken config is rejected with a named error; a merge to `main` results in a live site. |
| 0.2 | **Registry = single source of truth** | Add `fonts` field to `Template`; `RestaurantLayout.astro` derives font links, CSS custom properties (`--mr-*` per design doc §2), body class from `getTemplate()`. Delete the layout's inline font map, moodMap, and ~230 lines of `--tpl-*` CSS. | Zero template facts hardcoded in the layout; adding a registry field changes the layout automatically. |
| 0.3 | **Component map** | Create `src/lib/templates/components.ts` (static imports + object literal). Replace the 35-import + switch in `r/[slug]/index.astro` with `templateComponents[template.id]`. | `[slug]` page has no switch; adding a template touches only the map. |
| 0.4 | **Neutralize shared class names** | `ec-*` classes in `[slug]` page → `mr-*` (or move story/reveal/divider into per-template components). Remove `data-scramble` from shared code; gate per-template in Phase 1. | No editorial-classic namespace outside its folder. |
| 0.5 | **Client script modularization** | Extract `reveal.ts`, `detailSheet.ts`, `tilt.ts`, `swipeNav.ts` into `src/lib/client/`; each idempotent on `astro:page-load`, each removing its own listeners (fix tilt leak). Adopt existing `src/lib/swipeNav.ts`/`textScramble.ts` or delete them. | No duplicate setup across view transitions; no listener growth across navigations (verify in DevTools memory panel). |
| 0.6 | **Repo hygiene** | Replace boilerplate root README; delete/move `body.json`, `template-showcase.html` (superseded by 1.3 showcase); `.gitignore` check for `dist/`, `node_modules/`. | Clean root; README points into `docs/`. |
| 0.7 | **Validation hardening (cheap half)** | Item-ID uniqueness per restaurant in `loadRestaurants.ts`; day-name enum for `hours.regular`; `configVersion: 1` in schema + template. | `validate:configs` catches duplicate IDs and bogus day keys. |

**Estimate:** 3–5 working sessions. **Risk:** low — all refactors are behavior-preserving and covered by build + visual check on 3 demo restaurants.

---

## Phase 1 — Design & Motion Excellence ✨ *the "one-of-a-kind" phase*

**Theme:** Make the registry's design intent real in code; ship the template showcase; bring every template up to the design-system bar.

| # | Task | Detail | Acceptance criteria |
|---|---|---|---|
| 1.1 | **Motion tokens live** | Emit `--mr-entry-duration`, `--mr-stagger`, `--mr-motion-scale`, easings from registry MotionConfig. Reveal/stagger/entry in `[slug]` page + all template components consume tokens. | Vibrant-playful visibly springs faster than editorial-classic — from data, not hardcoded values. |
| 1.2 | **Per-template narrative effects gated** | Scramble only where identity calls for it (bold-street, vibrant-playful per design doc §3). Typewriter for warm-rustic tagline; Ken-Burns for editorial; numeral-fill for minimal. Each with reduced-motion end state. | Each template has ≥2 signature effects unique to it. |
| 1.3 | **`/templates` showcase page** | Build-time generated: each template rendered with the same demo dataset, screenshot-ready cards, live links. Directory nav entry ("See the designs"). | One URL shows all templates side-by-side; zero JS on the page. |
| 1.4 | **`?template=` preview override** | Restaurant pages accept a guarded query param (documented for admins; never linked publicly) rendering that restaurant through a different template — the core "switch templates from UI" loop for evaluation. | `?template=bold-street` on bella-italia renders full bold-street experience. |
| 1.5 | **Self-host fonts** | `@fontsource` packages per template; preload heading font; drop Google Fonts CSS2 runtime requests. | No third-party font requests; LCP improves ≥100ms on cold 4G. |
| 1.6 | **Per-template QA sweep to design bar** | Run design doc §5 quality gate + authoring guide §6 checklist for all 5 templates: squint test, JS-off pass, reduced-motion pass, 44px targets, focus rings, placeholder motifs, 86'd state, empty states. | Checklist green for all 5; fixes logged. |
| 1.7 | **Item detail sheet polish** | Focus trap, Escape/backdrop close, gallery swipe, `pairsWith`, allergen icons; branded skeletons during view-transition loads. | Matches design doc §6 states table exactly. |

**Estimate:** 5–8 working sessions (1.6 is the long pole). **Risk:** motion work is subjective — mitigate by reviewing against `design/01-design-system.md` §3–4, template by template.

---

## Phase 2 — Onboarding Ops & Growth 🚀 *make scale boring*

| # | Task | Detail | Acceptance criteria |
|---|---|---|---|
| 2.1 | **SEO pack** | Per-restaurant OG image generation at build (Satori: logo + name + palette on template-scouted background), sitemap integration, canonical URLs, per-restaurant favicon. | Link previews look designed in iMessage/WhatsApp/Slack for all restaurants. |
| 2.2 | **QR generation** | Build-time QR SVG/PNG per restaurant at `dist/r/<slug>/qr.*`; downloadable from directory card + a discreet admin affordance. | Onboarding checklist includes "print the QR" without any manual tool. |
| 2.3 | **Directory at scale** | Pagination/cuisine index pages + lazy JSON search index (per scaling doc §2.2). | 500 demo restaurants generate & search smoothly; page 1 stays <1s. |
| 2.4 | **Onboarding playbook final** | Update `docs/business/02-add-a-restaurant.md` to the full SLA flow incl. QR download, template selection guide (which preset for which venue type), photo guidelines (ratios, sizes, compression). | A non-developer can onboard a restaurant following only the doc. |
| 2.5 | **Asset guardrails in CI** | File size limits + dimension checks per scaling doc §3. | Oversized uploads fail CI with actionable message. |
| 2.6 | **Lighthouse CI** | Automated Lighthouse on one canary restaurant page per deploy; budget: ≥90 all categories, JS ≤50KB gz. | Regression visible in PR checks. |

**Estimate:** 4–6 sessions.

---

## Phase 3 — Scale & Self-Service 🏔 *the thousands phase (demand-triggered)*

| # | Task | Detail |
|---|---|---|
| 3.1 | Asset Tier B (external storage + resolver abstraction) | per `technical/06-scaling-architecture.md` §3 |
| 3.2 | Image-pipeline caching in CI | `actions/cache` on Astro asset store |
| 3.3 | Per-restaurant build isolation | invalid configs skip + alert rather than fail the deploy |
| 3.4 | Self-service editing | Decision + staged implementation per `technical/07-self-service-options.md` (recommend: Decap stopgap → thin admin) |
| 3.5 | Cloudflare edge in front | cache rules + deploy-time purge |
| 3.6 | Custom-domain escape hatch | per-restaurant repo provisioning script (documented, built on demand) |
| 3.7 | Template #6+ (`neon-night`, `coastal-fresh`, `night-bistro` concepts) | per `design/02-template-authoring-guide.md` — demand-driven |

**Trigger rule:** start 3.1–3.3 when >50 restaurants or build >10 min; 3.4 when a non-you editor exists; 3.7 when restaurants outgrow the 5 presets' audience coverage.

---

## Sequencing & Dependencies

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3
  │           │            │
  │ 0.2/0.3 must precede 1.1–1.4 (tokens + map)
  │           1.4 preview ──► 3.4 self-service preview UX
  └─ 0.1 CI must precede everything that ships
```

Phases 1 and 2 can interleave (2.1/2.2 don't depend on 1.x), but Phase 0 strictly precedes all.

## Definition of Done (platform v1)

- [ ] Deploy pipeline live; broken configs cannot reach production
- [ ] 5 templates pass the full design quality gate (§5/§6 of authoring guide)
- [ ] `/templates` showcase + `?template=` preview working
- [ ] Onboard a brand-new restaurant end-to-end in <30 min using only `docs/business/`
- [ ] Lighthouse ≥90 (perf/a11y/best-practices/SEO) on a canary page, enforced in CI
- [ ] OG images + QR codes per restaurant
- [ ] All Phase 0/1/2 acceptance criteria checked