# PRD: Multi-Restaurant Digital Menu Platform

**Owner:** You (platform admin)
**Status:** Draft v1
**Target hosting:** GitHub Pages (free tier)

---

## 1. Summary

A single static website that hosts digital menus for potentially hundreds of independent restaurants. Each restaurant gets its own URL, its own branding (logo, colors, fonts), and its own menu — all driven by a per-restaurant **configuration file**, not custom code. Adding a new restaurant should be a content operation (edit a JSON file, add a logo, push), not an engineering task.

## 2. Problem

Restaurants need a simple, good-looking, mobile-friendly digital menu (for QR codes on tables, Instagram bio links, Google Business listings, etc.) without:
- Paying for a menu SaaS per restaurant
- Needing their own website/hosting
- Requiring a developer every time a menu item or price changes

You want one platform that scales to hundreds of restaurants, costs nothing to host, and is easy for **you** to maintain even as the number of restaurants grows.

## 3. Goals

1. One codebase serves unlimited restaurants — no forking/duplicating the site per restaurant.
2. Each restaurant looks and feels distinct (own logo, color palette, fonts) without any restaurant needing custom code.
3. Adding/updating a restaurant = editing one config file (+ assets), not touching the app code.
4. Fully responsive — genuinely good on a phone (this is the primary device for scanning a QR code at a table) and on desktop/tablet.
5. Fast: static-first, minimal JavaScript, good Lighthouse scores.
6. Deployable entirely on GitHub Pages (no paid backend, no server).
7. Easy ongoing management as the number of restaurants grows into the hundreds (build times, repo size, review workflow).

## 4. Non-Goals (v1)

Explicitly out of scope for the first version — call these out so scope doesn't creep:
- Online ordering / checkout / payments
- Real-time table reservations
- POS or kitchen-display integration
- Restaurant self-service login/dashboard (v1 = you or the restaurant edits a JSON file via PR; a real admin UI is a v2+ idea)
- Real-time stock/86'd-item sync (v1 supports a manual `available: true/false` flag per item, not live sync)

## 5. Users & Personas

| Persona | Need |
|---|---|
| **Platform admin (you)** | Add/update restaurants quickly, keep the repo maintainable at scale, not babysit every push |
| **Restaurant owner/manager** | Wants their menu to look "theirs" (their colors/logo), wants to update a price or add a dish without calling you every time |
| **Diner (end user)** | Scans a QR code or taps a link, sees a fast, clean, readable menu on their phone; occasionally on a laptop before visiting |

## 6. Key User Stories

- As a diner, I scan the table QR code and see the restaurant's menu load instantly, styled like their brand, with categories I can jump between.
- As a diner, I can filter for vegetarian/vegan/spicy items or search for a dish by name.
- As a restaurant owner, I send you (or edit myself) a JSON file with my menu, logo, and 3 brand colors, and my page looks like *my* restaurant, not a generic template.
- As the platform admin, I run one command to scaffold a new restaurant folder, fill in the config, push, and it's live within minutes — with no risk of it breaking any other restaurant's page.
- As the platform admin, I can tell at a glance (via CI) if someone submitted a malformed config before it goes live.

## 7. Functional Requirements

| ID | Requirement |
|---|---|
| FR1 | A homepage/directory listing all restaurants (searchable by name/cuisine), each with logo + link |
| FR2 | Each restaurant has a unique URL and only ever shows its own data |
| FR3 | Menus are structured as **categories → items**, each item has name, description, price, image (optional), dietary tags, availability flag |
| FR4 | In-menu search and dietary/tag filtering (vegetarian, vegan, gluten-free, spicy level, etc.) |
| FR5 | Fully responsive: mobile-first, works well from ~320px to large desktop |
| FR6 | Everything restaurant-specific (menu, theme, contact info, hours) lives in one config file + an assets folder — zero code changes needed to onboard a restaurant |
| FR7 | Theming (colors, fonts, logo, cover image, border radius, light/dark default) is fully config-driven |
| FR8 | Pushing a new/updated config automatically rebuilds and redeploys the site via CI |
| FR9 | Each restaurant page has correct SEO metadata (title, description, Open Graph image) for link previews |
| FR10 | Each restaurant page has a clean, shareable, QR-code-friendly URL |
| FR11 (v2) | Multi-language menus, installable "Add to Home Screen" per restaurant, "specials/featured" badges, basic page-view analytics |

## 8. Non-Functional Requirements

- **Performance:** Lighthouse ≥ 90 on Performance, Accessibility, Best Practices, SEO. First Contentful Paint < 1.5s on 4G. Minimal JS shipped per page (islands/partial hydration only where needed, e.g. search box).
- **Accessibility:** WCAG 2.1 AA — semantic HTML, alt text (from config), color-contrast checked for each restaurant's theme (a validation script should warn if a restaurant's chosen colors fail contrast).
- **Scalability:** Must comfortably support 100s of restaurant pages without build times becoming unmanageable (design the build so it can be optimized/incrementalized later if needed).
- **Maintainability:** A new restaurant should be addable by someone who is comfortable editing a JSON file and following a checklist — not by someone who needs to understand the app's internals.
- **Security:** Pure static output; no backend, no user data collection, no attack surface beyond standard static hosting.
- **Hosting constraints (GitHub Pages):** No server-side code at request time; deploy via GitHub Actions to `gh-pages`/Pages environment; be mindful of the ~1GB recommended site size and 100GB/month soft bandwidth guidance; public repos get free unlimited Actions minutes, which matters once you have hundreds of restaurants rebuilding on every push.

## 9. Technical Architecture

### 9.1 Rendering approach
Static-site generation at **build time**. Every restaurant's page is pre-rendered into plain HTML/CSS with minimal JS — ideal for GitHub Pages (no server) and best possible performance/SEO.

| Option | Pros | Cons |
|---|---|---|
| **Astro** (recommended) | Ships ~0 JS by default ("islands"), first-class content collections with schema validation, excellent image pipeline, very fast builds, great fit for "many independent pages from data files" | Slightly newer ecosystem than Next.js |
| Next.js (static export) | Huge ecosystem, familiar to many devs | Ships more JS by default; static export has some feature limitations |
| Eleventy (11ty) | Extremely simple, no JS framework required, fast | Less built-in tooling for schema validation/images; more manual wiring |
| Plain Vite + React SPA | Simple mental model | Everything client-rendered — worse SEO, worse first paint, one big JS bundle that grows with restaurant count unless carefully code-split |

**Recommendation: Astro + Tailwind CSS.** It's purpose-built for "lots of content-driven pages with minimal JS," has native JSON/content-collection support with schema validation (catches bad restaurant configs at build time), and produces very fast, static output — a great match for GitHub Pages.

### 9.2 Multi-tenancy model
Path-based routing under one site: `https://<you>.github.io/<repo>/r/<restaurant-slug>/`. All restaurants share one GitHub Pages deployment.

**Trade-off to know:** GitHub Pages supports only **one custom domain per Pages site**. If some restaurants later want their own dedicated domain (e.g. `menu.bellaitalia.com` instead of a shared-domain subpath), that requires either (a) each such restaurant gets its own repo/Pages site (more management overhead, but simple per-restaurant), or (b) a proper backend/CDN reverse-proxy later (out of scope for a free static setup). Recommend defaulting every restaurant to the shared-domain path model, and treating custom domains as an explicit opt-in "premium" path for the rare restaurant that needs it.

### 9.3 Build & deploy pipeline
- GitHub Actions workflow triggers on push to `main` (and on PRs, for validation only).
- Steps: validate every restaurant config against a schema → optimize/compress images → run Astro build → deploy build output via `actions/deploy-pages`.
- PRs that touch `restaurants/**` get automatic schema validation as a required check, so a broken config can't reach production.

## 10. Data Model

Each restaurant is fully described by one JSON config + an assets folder. High-level shape:

- **Identity:** slug, name, tagline, description
- **Branding/theme:** logo, favicon, cover image, primary/secondary/accent colors, heading/body fonts, border radius, light/dark default
- **Contact:** phone, WhatsApp, email, address, map link, socials
- **Hours:** per day of week
- **Settings:** currency, language, feature toggles (search, dietary filters)
- **Menu:** array of categories, each with an array of items (name, description, price, image, tags, spice level, availability, featured flag)

(Full JSON Schema and example are in the companion implementation prompt document, since that's the artifact a developer/AI agent would actually build against.)

## 11. Repository Structure (high level)

```
repo-root/
├── restaurants/              # one folder per restaurant — the "content"
│   ├── _template/             # starter config to copy for new restaurants
│   └── bella-italia/
│       ├── config.json
│       └── assets/ (logo, cover, menu images)
├── src/                       # the app — rarely touched once built
│   ├── layouts/, components/, pages/, schemas/, styles/
├── scripts/                   # scaffolding + validation tooling
├── .github/workflows/         # CI: validate + build + deploy
└── package.json
```

The key design point: **`restaurants/` is data, `src/` is code.** Onboarding a restaurant never requires touching `src/`.

## 12. Content Management Workflow (adding/updating a restaurant)

1. Run a scaffold script (`npm run new-restaurant -- --name "Bella Italia"`) → creates a pre-filled folder from the template.
2. Fill in `config.json` (menu, contact, hours) and drop in logo/menu images.
3. Run a local validation script → catches schema errors, missing images, low color-contrast themes before pushing.
4. Push / open a PR → CI re-validates automatically.
5. Merge to `main` → GitHub Actions builds and deploys automatically. Live in a few minutes.
6. Updating an existing restaurant (price change, new dish) = edit the same `config.json`, repeat steps 3–5.

## 13. UI/UX & Experience Design Requirements

**Design philosophy:** this should not read as a form filled into a template. Each restaurant page should feel like a bespoke, considered piece of hospitality branding — comparable in polish to a boutique restaurant's own microsite — while still being 100% generated from a config file. The way to reconcile "bespoke" with "generated at scale" is a small set of curated **mood presets** (see the implementation prompt for the full spec): each preset is an expert-designed pairing of typography, spacing rhythm, a decorative motif, and an imagery treatment. A restaurant picks a preset and supplies its own colors/logo/photos; the result is cohesive by construction but still visually distinct from every other restaurant using the same preset.

- **Directory homepage:** grid of restaurant cards (logo, name, cuisine/tag, search bar to filter by name).
- **Restaurant page — signature moments:** a full-bleed hero (cover image, logo medallion, tagline), an optional "Chef's Picks" featured spotlight, an optional "Our Story" narrative section, mood-preset decorative dividers between categories, and a rich item-detail view (larger photo, full description, pairing note) on tap — not just a flat list of cards.
- **Navigation:** sticky, horizontally-scrollable category tabs with an animated active-tab indicator; smooth, app-like transitions between the directory and a restaurant page, and between sections within a page.
- **Mobile-first:** single-column item list, ≥44px tap targets, thumb-reachable search/filter, bottom-sheet item details on small screens.
- **Desktop:** gracefully expands to 2–3 column grid with more generous whitespace; same content and moments, not a stripped-down mobile experience.
- **Theming:** each restaurant's page resolves its chosen mood preset + its own brand colors/fonts into CSS custom properties — same components, meaningfully different look per restaurant.
- **Motion, done responsibly:** subtle entrance/reveal animation and hover/tap feedback add polish, but every effect must respect `prefers-reduced-motion`, stay within a small JS budget, and never gate access to content — the page must be fully readable and navigable with motion off or JavaScript disabled.
- **States:** branded skeleton loaders (not generic gray), a tasteful placeholder illustration for missing item photos, a clear "no results" state for search/filter, and clear "currently unavailable" styling for 86'd items.

## 14. Analytics & Monitoring

Since there's no backend, use a privacy-friendly, script-tag-based analytics service (e.g., Plausible or GoatCounter) rather than collecting any data yourselves. No PII is ever collected — diners are anonymous.

## 15. Rollout Plan

| Phase | Scope |
|---|---|
| **Phase 0 — Foundation** | Repo scaffold, one fully working sample restaurant end-to-end, CI/CD pipeline working |
| **Phase 1 — MVP** | Directory page + real restaurants onboarded, theming, responsive layout, in-menu search |
| **Phase 2** | Dietary filters, QR-code generation per restaurant, contrast validation, "Add to Home Screen"/PWA per restaurant |
| **Phase 3 (optional)** | Multi-language menus, per-restaurant custom domains for those who need it, lightweight analytics dashboard |

## 16. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Build time grows unmanageable at 100s of restaurants | Astro/static builds handle thousands of pages well in practice; if it becomes an issue, investigate splitting into multiple Pages deployments or caching build steps |
| Non-technical restaurant staff submit malformed configs | Strict schema validation in CI as a required PR check; a filled-out `_template` folder; clear inline comments/docs in the template |
| Repo bloats from uncompressed images | Enforce a max upload size + automated image compression/resizing step in CI |
| GitHub Pages bandwidth/size guidance exceeded at scale | Monitor usage; move to a CDN (e.g., Cloudflare in front of Pages) if needed — still free |
| A restaurant wants a fully custom domain | Treat as an explicit, separate opt-in path (own repo/Pages site), not the default model |

## 17. Success Metrics

- New restaurant onboarding takes < 15 minutes end-to-end, with zero app-code changes.
- Lighthouse scores ≥ 90 across the board on a representative restaurant page.
- Page loads in < 2 seconds on a typical 4G connection.
- Zero cross-restaurant bugs (one restaurant's config/assets never affect another's page).

## 18. Open Questions

- Will any restaurants need true self-service editing (a form-based admin UI) rather than editing JSON via PR?
- Is online ordering/reservations a future requirement? (Would eventually require a backend, which changes the "pure static/free" model.)
- How many restaurants realistically need a dedicated custom domain vs. being fine with a shared-domain path?
