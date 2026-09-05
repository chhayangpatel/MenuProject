# Scaling Architecture — From 3 Restaurants to 5,000

**Audience:** Platform maintainers.
**Goal:** Define the architecture that keeps onboarding restaurant #5,000 as cheap as #3 — in build time, repo health, cost, and operational burden.
**Related:** `07-self-service-options.md` (editing experience), `../review/01-codebase-review.md` (§7 scale findings).

---

## 1. Scale Model Assumptions

| Dimension | Assumption at end-state |
|---|---|
| Restaurants | 1,000–10,000 configs |
| Menu size | ~30–150 items each (~20–60KB JSON) |
| Photos | 0–80 per restaurant (the dominant weight) |
| Traffic | QR scans = spiky, meal-time concentrated; mostly cacheable static hits |
| Editing | Daily price/item edits across many restaurants; no hot reload requirement (minutes are fine) |

Static-first remains the right architecture at this scale: **everything expensive is precomputed; everything at request time is a CDN cache hit.**

---

## 2. Build Strategy

### 2.1 Where build time actually goes

1. **Image optimization (dominant):** sharp processing of thousands of photos.
2. Config parse/validate: negligible (seconds even at 10k).
3. HTML render per page: linear, but Astro handles 10k pages in minutes.

### 2.2 Levers, in order of adoption

| Lever | When | How |
|---|---|---|
| **Asset pipeline caching** | >50 restaurants | Cache Astro's image store (`node_modules/.astro` or `ASTRO_IMAGE_CACHE`) between CI runs via `actions/cache` keyed on image file hashes. This alone flattens rebuild cost: only changed restaurants re-optimize. |
| **Content-addressed images** | >200 | Name asset files by content hash at upload (`bruschetta.a3f9c2.jpg`); unchanged file = cache hit + immutable CDN URL. |
| **Per-restaurant build skip** | >500 (optional) | A CI script diffs changed `restaurants/*` folders; pass the changed set to Astro to rebuild only affected pages. Complexity is real — adopt only if full builds exceed ~20 min. |
| **Parallel validation** | >500 | `validate-configs.mjs` already trivially parallelizable (`Promise.all` over folders). |
| **Directory pagination** | >200 restaurants | `/` renders page 1 (featured + recent, ~60 cards) + cuisine-alphabet index pages; client-side search loads a compact JSON index (~10KB per 1k restaurants: slug, name, cuisine, logo hash) on demand. |

### 2.3 Build output math

~10k pages × ~40KB HTML + shared assets ≈ well under GitHub Pages' 1GB soft limit **if images are disciplined** (see §3). Revisit only if per-page HTML balloons (it shouldn't; menus are text).

---

## 3. Asset & Repository Strategy

**The problem:** menu photos in git will bloat the repo (10k restaurants × 5MB uploads = dead repo in months).

**Strategy tiers:**

| Tier | When | Approach |
|---|---|---|
| **A. In-repo (today)** | <50 restaurants | `restaurants/<slug>/assets/` as now. Enforce per-file ≤ 400KB pre-optimization via CI size check. |
| **B. External object storage + CDN** | >50 restaurants | Uploads go to Cloudflare R2 (free egress) / GitHub Releases / S3. Config references `"image": "r2://bruschetta.jpg"` or an absolute CDN URL; build pipeline downloads → optimizes → caches. Keeps repo lean and git operations fast. |
| **C. Client-side-only optimization** | >2,000 | Pre-optimized AVIF/WebP at upload time (admin tool does the sharp pass on ingest); build pipeline only copies. `settings.imagesOptimized: true` flag per restaurant skips build-time processing. |

**Recommendation:** Tier A now; design the `loadRestaurants.ts` image-resolution layer so Tier B is a drop-in resolver change; adopt Tier B before repo hits ~2GB.

**Upload guardrails (CI-enforced from day 1):**
- Per-file max size (400KB raw) → fail with "compress before committing."
- Total per-restaurant assets ≤ 25MB.
- Image dimensions sanity check (hero ≥ 1600px wide, item photos ≥ 800px).

---

## 4. CDN & Hosting Topology

```
Diner's phone
   │
   ▼
Cloudflare (free)  ← optional but recommended at >100 restaurants
   │  - full-page caching (menu pages are immutable per deploy)
   │  - cache purge on deploy (via webhook/Action)
   │  - image resizing (free tier: Polish/resize where available)
   ▼
GitHub Pages (origin)
```

- Menu pages are **immutable between deploys** → set `Cache-Control: max-age=31536000, immutable` at the edge for hash-named assets; `max-age=600` + `stale-while-revalidate` for HTML.
- If/when Pages bandwidth guidance binds, Cloudflare in front solves it without changing the app.
- **Custom domains (per-restaurant):** static hosting can't do path-tenancy + arbitrary domains. Escape hatch: a small script provisions a per-restaurant repo/Pages site with only that restaurant's build (rare, premium-tier customers only). Document; don't build until demand exists.

---

## 5. Data Layer Evolution

Today: JSON files in git. This stays the **canonical store** even after self-service tooling lands (see `07-self-service-options.md`) — the tooling writes PRs/commits to the same files.

Why keep files as canonical:
1. Builds stay self-contained and replayable (no API dependency at build time).
2. Free, versioned, auditable (git history = menu change log — a genuinely useful feature for restaurant owners).
3. Disaster recovery is `git clone`.

The file format is already right; add `configVersion` (see review DA-2) to allow painless migrations, and keep item `id` stable forever — QR codes may deep-link `?item=` eventually.

---

## 6. Reliability & Ops

| Concern | Practice |
|---|---|
| Bad config blocks every deploy | CI validates per-restaurant and reports **all** failures; never let one typo take down 5,000 live menus — deploy continues for valid restaurants, failing ones are skipped with loud alerts (build-time isolation in `loadRestaurants.ts`). |
| Rollback | GitHub Pages deploys are atomic; rollback = re-run previous workflow or `git revert`. Document a 5-minute rollback runbook. |
| Monitoring | Uptime check on `/` + one canary restaurant page (UptimeRobot free). Deploy failures alert via GitHub notifications → email. |
| Analytics | Plausible/GoatCounter script (see PRD §14); per-restaurant page via path filtering. |
| QR codes | Build-time generation per restaurant → PNG/SVG committed to `dist/r/<slug>/qr.svg`, downloadable from the admin bar / directory card. |

---

## 7. The Onboarding SLA (end-state definition of done)

Onboarding a new restaurant end-to-end:

| Step | Time |
|---|---|
| `npm run new-restaurant -- --name "X"` | 10 sec |
| Fill config (menu, hours, contact) — from owner-supplied spreadsheet/photo of menu | 10–30 min (human) |
| Drop in logo + photos (compressed) | 5 min |
| `npm run validate:configs && npm run check:contrast` | 5 sec |
| PR → CI validate → merge → deploy | ~5 min |
| Download QR, send to owner | 1 min |

**Zero `src/` edits. Zero risk to other restaurants (enforced by per-restaurant build isolation + CI).** That's the bar every phase of the roadmap protects.

---

## 8. Cost Model

| Stage | Infra cost |
|---|---|
| 0–100 restaurants | $0 (GitHub Pages + Actions free) |
| 100–2,000 | $0–$20/mo (Cloudflare free tier; optional Plausible $9/mo) |
| 2,000+ | $20–40/mo (R2 storage cents; still no servers) |

Self-service editing (Phase 3) adds the only real cost line (see options doc) — still under $50/mo with the recommended path.