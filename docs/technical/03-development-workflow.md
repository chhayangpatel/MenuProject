# Development Workflow

## Setup

```powershell
nvm use 22            # or ensure node >= 22.12
npm install
```

## Day-to-day commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with live reload |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the built output locally |
| `npm run validate:configs` | Zod-check every `config.json` |
| `npm run check:contrast` | WCAG contrast check per restaurant theme |
| `npm run new-restaurant "Name"` | Scaffold a restaurant |

## Making changes

### Adding a schema field (the safe pattern)

1. Edit `src/schemas/restaurant.schema.ts`:
   ```ts
   myNewField: z.string().optional()   // or .default("x")
   ```
2. If old configs could ever carry an older shape, add a migration in
   `src/lib/loadRestaurants.ts` (see the hours migration as the reference pattern).
3. Update the template `restaurants/_template/config.json` with an example.
4. Update `docs/technical/02-schema-reference.md`.

### Adding an Astro component
- Components that render menu data have no client JS → plain `.astro`, theme-agnostic via `var(--color-*)`.
- If it needs browser interaction (filters, detail sheet), build it as a **React island** with `client:load` in the page, or a vanilla `<script>` block when a tiny behavior (reveal, tilt) suffices. **Prefer vanilla JS** for scroll effects to avoid React payload.

### Adding a restaurant page behavior (e.g. new swipe action)
- Add vanilla JS inside the `<script>` block of `src/pages/r/[slug]/index.astro`, guarded by `prefers-reduced-motion` and attached via both `astro:view-transition:enter` and direct call (see existing `setupScrollReveal` pattern).
- Keep `astro:page-load` listeners idempotent (they run on every client navigation).

## Code quality gates (Review Checklist)

Before committing, ensure:
- [ ] `npm run build` passes clean
- [ ] `npm run validate:configs` passes
- [ ] No `Inter`, `Roboto`, Arial, Open Sans, Helvetica as a design font
- [ ] No `linear` / `ease-in-out` transitions in new CSS
- [ ] New scroll animations use `IntersectionObserver`, transform/opacity only
- [ ] `prefers-reduced-motion` guard present on every animation
- [ ] `backdrop-blur` only on fixed/sticky elements
- [ ] Mobile: layout collapses below 768px
- [ ] React islands still under 50KB gz combined

## Git workflow

- The repo uses conventional-style commit messages (`feat:`, `fix:`, `docs:`).
- Work on a branch for non-trivial features; merge to `main`; CI deploys on push to `main`.
- Keep `restaurants/_template/` current — it's what new restaurants are copied from.

## Common gotchas
- **SSR-safe React:** never touch `window`/`document` during render. Do it in `useEffect`, or guard the access like `SearchFilterBar` does (it reads `window.__RESTAURANT_ITEMS__` inside `useEffect`, not in `useMemo` during render).
- **Astro `define:vars`:** injecting `flatItems` via `define:vars` means the object must be JSON-serializable.
- **View Transitions:** `ClientRouter` is loaded in `RestaurantLayout`. Scripts that re-query the DOM must re-run on `astro:page-load`.