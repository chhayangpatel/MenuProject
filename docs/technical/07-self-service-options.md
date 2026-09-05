# Self-Service Editing — Options & Recommendation

**Question this document answers:** *"How do hundreds/thousands of non-technical restaurant owners (or a lean ops team) edit menus without touching JSON in a git repo?"*
**Decision needed for:** Phase 3 of the roadmap. Written so the decision can be made with full information and implemented without re-architecting.

---

## 1. The Invariant

Whatever option is chosen, one rule does not change:

> **`restaurants/<slug>/config.json` + assets in git remain the canonical, build-time source of truth.** Any editing UI is a *writer* to those files, never a parallel database.

This keeps builds self-contained, keeps git history as the audit log, and means we can swap editing tools without touching the renderer.

---

## 2. Options Compared

### Option A — Git-based CMS (Decap CMS / static admin page)

A single-page admin app (Decap — formerly Netlify CMS — or similar) committed into the repo. It authenticates via GitHub OAuth, edits the JSON through the GitHub API, and commits/PRs directly.

| Pros | Cons |
|---|---|
| Free, no server | Editor UX is form-per-schema — workable, not delightful |
| Writes straight to canonical JSON + assets | Asset uploads via git = repo bloat pressure (needs Tier-B asset strategy sooner) |
| Auth handled by GitHub (no user store) | One GitHub auth shared by ops; per-restaurant scoping is coarse |
| Matches current architecture perfectly | Editorial experience on a 150-item menu is clunky |

**Effort:** ~1–2 weeks. **Recurring cost:** $0.

### Option B — Headless CMS (Sanity / Directus / Strapi) with build webhook

Restaurant data lives in a real CMS with a purpose-built editing studio; CI rebuilds on publish webhook, or a sync job exports CMS → `restaurants/*/config.json` → PR.

| Pros | Cons |
|---|---|
| Best editor UX (real forms, image cropper, live preview) | Recurring cost (Sanity free tier generous; Directus self-host = a server) |
| Per-restaurant role scoping done properly | **Two sources of truth** — the sync/PR step must be flawless or configs drift |
| Image handling/cropping pipeline solved by the CMS | Rebuild-per-publish economics at thousands of restaurants (mitigate: debounced batch publishes) |
| Scales to genuinely self-service | Most moving parts of any option |

**Effort:** 3–6 weeks. **Recurring cost:** $0–$99/mo depending on tier.

### Option C — Purpose-built thin admin (recommended target)

A small web app (could be a single Astro serverless function or a tiny Node service on Fly.io/Render free tier) that:
1. Authenticates the operator/owner (simple magic-link; a user→restaurant map in one JSON).
2. Presents a **menu-optimized editor**: category list → item rows → inline edit, price steppers, photo crop-upload (client-side resize to ≤400KB WebP before upload), 86-toggle.
3. On save: opens a PR (or auto-merges, per trust level) to `restaurants/<slug>/config.json`, uploads assets per the Tier-B strategy.
4. Shows a live preview link (`?template=` override page) before publishing.

| Pros | Cons |
|---|---|
| UX built exactly for the domain (fastest for restaurant staff) | We build & maintain it (mitigate: it's small — one editor screen + one auth screen) |
| Still writes to canonical JSON/git | Needs a tiny server (free tiers suffice) |
| Preview-before-publish is native to our template system | Asset pipeline (client resize) is our responsibility |

**Effort:** 4–8 weeks phased. **Recurring cost:** ~$0–20/mo.

---

## 3. Decision Matrix

| Criterion | A: Decap | B: Headless CMS | C: Thin admin |
|---|---|---|---|
| Time to first usable version | 🟢 1–2 wks | 🟡 3–6 wks | 🔴 4–8 wks |
| Editor UX for restaurant staff | 🔴 | 🟢 | 🟢 |
| Keeps single source of truth | 🟢 | 🟡 (sync needed) | 🟢 |
| Per-restaurant scoping/auth | 🔴 | 🟢 | 🟢 |
| Recurring cost | 🟢 $0 | 🟡 | 🟢–🟡 |
| Repo/asset bloat risk | 🔴 | 🟢 | 🟢 |
| Operational complexity | 🟢 | 🟡 | 🟡 |

---

## 4. Recommendation (staged, reversible)

1. **Now → ~50 restaurants:** Stay with the JSON + PR workflow and the business docs (`docs/business/`). It works, it's free, and the operator is the bottleneck by design.
2. **At ~50 restaurants (or first non-you editor):** Stand up **Option A (Decap)** as a stopgap — it's a weekend of config and immediately de-risks "what if I'm unavailable."
3. **At scale / true self-service demand:** Build **Option C**, having learned from A which forms matter. Option C's PR-writer is the exact same GitHub API code A uses — nothing learned is thrown away.
4. **Skip Option B** unless a client demands an enterprise CMS integration; the two-sources-of-truth sync is the worst trade in this list for our use case.

---

## 5. What Must Exist *Before* Any Option (Phase 0–2 deliverables)

- [ ] `configVersion` field in schema (migrations stay safe once tools write configs).
- [ ] Item-ID uniqueness validation (tools must not be able to create collisions).
- [ ] Per-restaurant build isolation (a bad PR breaks one page, not the platform).
- [ ] `?template=` preview override + `/templates` gallery (preview-before-publish UX depends on it).
- [ ] Asset-tier decision implemented in `loadRestaurants.ts` (resolver abstraction), since editors move asset weight earlier.

These are all Phase 0–2 items in `../roadmap.md` — the self-service decision never blocks the core platform.