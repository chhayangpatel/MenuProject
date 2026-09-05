# MenuProject Documentation

A multi-restaurant digital menu platform. Each restaurant has its own JSON config file — no code changes needed to add, update, or remove a restaurant.

## 📚 Documentation Index

### For Business Owners & Managers
**[Business Guide → `docs/business/`](business/README.md)**

Everything you need to manage restaurants in plain language — no code required:
- [Quickstart — run the site](business/01-quickstart.md)
- [Add a new restaurant](business/02-add-a-restaurant.md)
- [Edit the menu & prices](business/03-edit-menu.md)
- [Restaurant settings (hours, contact, theme)](business/04-restaurant-settings.md)
- [Categories & storytelling](business/05-categories-and-storytelling.md)
- [Images & logos](business/06-images.md)

### Strategy & Planning
- **[Roadmap → `roadmap.md`](roadmap.md)** — the end-to-end phased implementation plan (Phase 0: consolidation → Phase 1: design/motion excellence → Phase 2: onboarding ops → Phase 3: scale & self-service) with acceptance criteria and Definition of Done.
- **[Codebase Review → `review/01-codebase-review.md`](review/01-codebase-review.md)** — full enterprise architecture audit: findings, severity-ranked backlog, scale-readiness gaps.

### For Designers & Template Authors
**[Design System → `docs/design/`](design/)**
- [Design system spec (`01-design-system.md`)](design/01-design-system.md) — design philosophy, `--mr-*` token architecture, the five template design languages (identity, layout grammar, signature moments, motion choreography), platform-wide motion rules, imagery system, states, accessibility.
- [Template authoring guide (`02-template-authoring-guide.md`)](design/02-template-authoring-guide.md) — the exact checklist for adding template #6+: registry entry, component map, component contract, design quality gate, validation checklist.

### For Developers
**[Technical Guide → `docs/technical/`](technical/README.md)**

Everything about the codebase, architecture, and project updates:
- [Architecture overview](technical/01-architecture.md)
- [JSON schema reference](technical/02-schema-reference.md)
- [Development workflow](technical/03-development-workflow.md)
- [Deployment (GitHub Pages)](technical/04-deployment.md)
- [Extending the platform](technical/05-extending.md)
- [Scaling architecture (`06-scaling-architecture.md`)](technical/06-scaling-architecture.md) — build strategy, asset tiers, CDN topology, and the onboarding SLA for thousands of restaurants.
- [Self-service editing options (`07-self-service-options.md`)](technical/07-self-service-options.md) — git-CMS vs headless-CMS vs thin-admin comparison and staged recommendation.

---

## Quick Start (60 seconds)

### Prerequisites
- **Node.js** v22.12+ (`node --version` to check)
- Dependencies installed (`npm install` once, if never run)

### Run the site locally
```powershell
npm run dev
```
Open **http://localhost:4321** in your browser.

### Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start local dev server (live reload) |
| `npm run build` | Build the production static site to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run validate:configs` | Check all `restaurants/*/config.json` files are valid |
| `npm run new-restaurant "My Place"` | Scaffold a new restaurant folder |