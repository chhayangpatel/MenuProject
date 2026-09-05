# MenuProject — Multi-Restaurant Menu Hosting Platform

One static codebase hosts beautiful, branded digital menus for unlimited restaurants. Each restaurant gets its own URL (`/r/<slug>/`), its own branding, and its own menu — driven entirely by a JSON config file. **Onboarding a restaurant is a content operation, not an engineering task.**

## How it works

```
restaurants/<slug>/          ← per-restaurant data (the only thing you edit)
├── config.json              ← menu, theme, hours, contact, template choice
└── assets/                  ← logo, cover, menu photos

src/                         ← the app (rarely touched)
├── lib/templates/           ← 5 complete design languages (Editorial Classic,
│                               Modern Minimal, Bold Street, Warm Rustic,
│                               Vibrant Playful) — each with its own layout,
│                               typography, motifs, and motion personality
├── schemas/                 ← Zod validation (bad configs fail at build time)
└── pages/r/[slug]/          ← generates one static page per restaurant
```

Add a new restaurant → `npm run new-restaurant -- --name "Bella Italia"` → fill in the config → `npm run validate:configs` → push. Zero code changes, zero risk to other restaurants.

## Templates (switchable per restaurant via `config.json`)

| Template | For | Feel |
|---|---|---|
| `editorial-classic` | Fine dining, heritage | Quiet luxury — serif display, hairline rules, gold accents |
| `modern-minimal` | Coffee, bakeries, fast-casual | Confident clarity — geometric sans, extreme whitespace |
| `bold-street` | Burgers, tacos, street food | Loud & hungry — bento grid, duotone, kinetic type |
| `warm-rustic` | Farm-to-table, BBQ, pizzerias | Handmade heritage — letterpress paper, hand-drawn motifs |
| `vibrant-playful` | Dessert, boba, brunch | Joy physics — spring motion, blobs, pill everything |

Every template respects `prefers-reduced-motion`, works with JavaScript disabled, and renders the restaurant's own colors/logo/photos through its own design language.

## Quick start

```bash
npm install
npm run dev          # http://localhost:4321
```

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run validate:configs` | Validate every restaurant config (schema, assets, contrast) |
| `npm run check:contrast` | WCAG contrast check on every restaurant's palette |
| `npm run new-restaurant -- --name "X"` | Scaffold a new restaurant folder |

## Documentation

Everything lives in [`docs/`](docs/README.md):

- **[Roadmap](docs/roadmap.md)** — the phased plan to the end-state (thousands of restaurants, UI-switchable templates, self-service onboarding)
- **[Codebase review](docs/review/01-codebase-review.md)** — enterprise audit: what's strong, what blocks scale, severity-ranked backlog
- **[Design system](docs/design/01-design-system.md)** — token architecture, the five design languages, motion choreography, accessibility law
- **[Template authoring guide](docs/design/02-template-authoring-guide.md)** — add template #6 in one folder + three registration points
- **[Scaling architecture](docs/technical/06-scaling-architecture.md)** — build strategy, asset tiers, CDN topology, onboarding SLA
- **[Self-service options](docs/technical/07-self-service-options.md)** — how restaurant owners will edit menus at scale
- **[Business guide](docs/business/)** — plain-language docs for managing restaurants
- **[Technical guide](docs/technical/)** — architecture, schema reference, deployment

## Tech stack

Astro (static output) · Tailwind CSS · React islands (item detail sheet, search/filter) · Zod (config validation) · GitHub Actions → GitHub Pages. No backend, no database, ~$0 hosting.