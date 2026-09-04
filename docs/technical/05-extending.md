# Extending the Platform

Roadmap hooks and how-to for adding capabilities. The platform was built so that *features* are code but *content* is config — keep that split when extending.

## Where to add things

| Need | Where it goes |
|---|---|
| New data a restaurant can set | `src/schemas/restaurant.schema.ts` + template + this reference |
| New page section/component | `src/components/` + wire into `src/pages/r/[slug]/index.astro` |
| New behavior (animations, gestures) | vanilla JS in the page `<script>` or a new `src/lib/*.ts`, guarded by reduced-motion |
| New interactive UI (stateful) | React island (`client:load`) |
| New shared template/logic | `src/lib/*.ts` |

## Planned features (schema already supports them)

These exist in the schema and template but are **not yet wired to UI**:

### Menu variants / scheduling (`menuVariants`)
- **Schema:** ready — `menuVariants[]`, each with `availableFrom`/`availableTo`/`availableDays` and a full replacement `categories` list.
- **To build:** a tab switcher above `CategoryNav` in `src/pages/r/[slug]/index.astro`. On load, pick the active variant (date/time match) and render its `categories`. Design decision needed: active-variant SSR (build-time time check, no JS) vs client tab switching.

### Combos / meal deals (`combos`)
- **Schema:** ready — `combos[]` referencing item IDs + `comboPrice`.
- **To build:** a `ComboCard.astro` (Double-Bezel style) + render before the menu sections. Link combo items to the item detail sheet via their IDs.

### Dark mode (`theme.mode`)
- **Schema:** ready. Layout currently renders `mode` but no toggle.
- **To build:** a `ThemeToggle` + `data-theme` attribute switching, per-mood dark palettes, `localStorage` persistence. Extend `theme.ts` to emit a dark-mode CSS block.

### QR codes
- **Original plan:** a build script `scripts/generate-qr.mjs` (e.g. `qrcode` npm package) emitting per-restaurant QR SVGs pointing at `/r/<slug>/`. Natural place: render into each restaurant page footer.

## How-to: add a new menu field (worked example)

Add a `goodForGroups` boolean to items.

1. **Schema** (`src/schemas/restaurant.schema.ts`):
   ```ts
   goodForGroups: z.boolean().default(false),
   ```
2. **Template** (`restaurants/_template/config.json`): add `"goodForGroups": true` to the sample item.
3. **UI** (`src/components/MenuItemCard.astro`): conditionally render a badge:
   ```astro
   {item.goodForGroups && <span class="tag tag--muted">👥 Groups</span>}
   ```
4. **Detail sheet** (`src/components/ItemDetailSheet.tsx`, if it should show there too).
5. **Docs**: update `docs/technical/02-schema-reference.md`.

No migration needed — `.default(false)` handles existing configs, and `validate:configs` confirms.

## How-to: add a new mood preset

The presets are the design *personalities*. Adding one:

1. **`src/lib/moodPresets.ts`** — add to the `MoodPresetName` union and `moodPresets` record: fonts, `radius`, `motif` SVG, optional `texture`.
2. **`src/schemas/restaurant.schema.ts`** — add the name to the `moodPreset` enum.
3. Consider **scroll choreography**: per-preset entry styles live with the reveal classes in `src/pages/r/[slug]/index.astro`; add preset-specific transitions if it should feel different.
4. **Docs**: add a row to the table in `02-schema-reference.md` and the business mood table.

## How-to: disable / remove a feature selectively

All optional features are already behind config flags where it matters:
- `settings.showPrices`, `settings.enableSearch`, `settings.enableDietaryFilters`
- Omit `story`, `combos`, `menuVariants`, `heroImage`, etc. and the UI simply doesn't render them.

Always gate new features the same way: optional in the schema, conditional in the template.

## Performance guardrails (keep these)

- Adds to the menu page render path should stay static (Astro) — only add a React island when state is unavoidable.
- Scroll animation code: `IntersectionObserver`, transform/opacity, reduced-motion guard.
- Keep Google Fonts per-preset (two families max per restaurant).
- Re-measure React bundle after adding islands: combined ≤ 50KB gzip.

## Tests & verification for new features

```powershell
npm run validate:configs     # schema-safe
npm run check:contrast       # readable themes
npm run build                # static output clean
npm run preview              # visually verify the shipped artifact
```

For a new animation: verify it (a) fires on view-entry, (b) is idempotent across View-Transition navigations, (c) resolves instantly under `prefers-reduced-motion`.