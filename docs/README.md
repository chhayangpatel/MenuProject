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

### For Developers
**[Technical Guide → `docs/technical/`](technical/README.md)**

Everything about the codebase, architecture, and project updates:
- [Architecture overview](technical/01-architecture.md)
- [JSON schema reference](technical/02-schema-reference.md)
- [Development workflow](technical/03-development-workflow.md)
- [Deployment (GitHub Pages)](technical/04-deployment.md)
- [Extending the platform](technical/05-extending.md)

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