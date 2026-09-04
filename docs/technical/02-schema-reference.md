# JSON Schema Reference

Source of truth: `src/schemas/restaurant.schema.ts` (Zod). Anything below that's present in a `config.json` must satisfy these rules or the build fails.

**Backward-compat rule:** every optional field is `.optional()` with `.default()` so old configs keep working without edits.

---

## Restaurant (top level)

| Field | Type | Required | Notes |
|---|---|---|---|
| `slug` | `string` | ✅ | `^[a-z0-9-]+$` — must match the folder name |
| `name` | `string` | ✅ | |
| `tagline` | `string` | | shown under name |
| `description` | `string` | | meta description + fallback copy |
| `logo` | `string` | ✅ | path inside `assets/` |
| `favicon` | `string` | | |
| `coverImage` | `string` | | hero backdrop |
| `cuisine` | `string[]` | | e.g. `["Italian","Pizza"]` — used in directory filters |
| `priceRange` | `"$" \| "$$" \| "$$$" \| "$$$$"` | | used in directory cards |
| `contact` | object | ✅ | see below |
| `hours` | object | | see below |
| `theme` | object | ✅ | see below |
| `moodPreset` | enum | ✅ default `"fine-dining"` | see mood presets |
| `story` | `{ heading?, body }` | | "Our Story" section |
| `hero` | `{ style: "fullbleed"\|"split"\|"minimal" }` | | |
| `settings` | object | ✅ | see below |
| `menu` | `MenuCategory[]` | ✅ min 1 | |
| `combos` | `Combo[]` | | meal deals (see below) |
| `menuVariants` | `MenuVariant[]` | | time-based menu tabs (see below) |

### `contact`
All optional: `phone`, `whatsapp`, `email` (validated), `address`, `googleMapsUrl` (validated URL), `socials` (`Record<string, url>`).

### `hours`
```ts
{
  regular?: Record<string, string>,   // day → "11:00-22:00" | "Closed"
  special?: { date, hours, label? }[], // holiday exceptions
  notes?: string,
}
```
> Old flat format (`hours: { monday: "..." }`) is auto-migrated to `{ regular: {...} }` in `loadRestaurants.ts`.

### `theme`
```ts
{
  primaryColor:   string,   // 6-digit hex
  secondaryColor: string,   // 6-digit hex
  accentColor?:   string,   // 6-digit hex
  fontHeading?:   string,   // Google Fonts name
  fontBody?:      string,
  borderRadius:   "none"|"sm"|"md"|"lg"|"full"  (default "md"),
  mode:           "light"|"dark" (default "light"),
}
```

### `settings`
```ts
{
  currency:             string (default "USD"),
  currencySymbol:       string (default "$"),
  language:             string (default "en"),
  showPrices:           boolean (default true),
  enableSearch:         boolean (default true),
  enableDietaryFilters: boolean (default true),
}
```

---

## MenuCategory

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | unique, used for anchor + swipe nav |
| `name` | `string` | ✅ | |
| `description` | `string` | | |
| `items` | `MenuItem[]` | ✅ min 1 | |
| `heroImage` | `string` | | **immersive banner** — path inside `assets/` |
| `heroQuote` | `string` | | italic editorial line over the banner |

---

## MenuItem

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | unique |
| `name` | `string` | ✅ | |
| `description` | `string` | | |
| `price` | `number ≥ 0` | ✅ | base price |
| `image` | `string` | | thumbnail path |
| `gallery` | `string[]` | | extra photos in detail sheet |
| `pairsWith` | `string` | | pairing hint |
| `tags` | `Tag[]` | default `[]` | `vegetarian` `vegan` `gluten-free` `dairy-free` `nut-free` `halal` `kosher` `organic` `house-made` `seasonal` |
| `spicyLevel` | `number 0–3` | default 0 | |
| `available` | `boolean` | default true | |
| `featured` | `boolean` | default false | carousel + "Chef's Pick" |
| `variants` | `Variant[]` | | sizes: `{ id, name, priceModifier }` |
| `modifiers` | `Modifier[]` | | add-ons: `{ id, name, price, group? }` |
| `nutrition` | object | | `{ calories?, protein?, carbs?, fat? }` |
| `allergens` | `Allergen[]` | | `{ name, severity: "contains"\|"may-contain"\|"traces" }` |
| `prepTime` | `number` | | minutes |
| `portionSize` | `string` | | e.g. `"Serves 2–3"` |
| `popularity` | enum | | `"most-ordered"` \| `"staff-favorite"` \| `"new"` \| `"trending"` |

---

## Combos (meal deals)

```ts
{
  id, name, description?,
  items: string[],       // references MenuItem ids
  comboPrice: number,
  available: boolean (default true),
}
```

## MenuVariants (scheduled menus)

```ts
{
  id, name,
  availableFrom?: string,   // 24h "17:00"
  availableTo?: string,     // 24h "22:00"
  availableDays?: string[], // "Monday"…
  categories: MenuCategory[], // full replacement menu
}
```
Not yet wired to UI — reserved for a future tab switcher (see `docs/technical/05-extending.md`).

---

## Mood presets

Defined in `src/lib/moodPresets.ts`:

| Preset | Heading font | Body font | Radius | Divider motif |
|---|---|---|---|---|
| `fine-dining` | Playfair Display | Plus Jakarta Sans* | 0 | hairline rule |
| `modern-minimal` | Space Grotesk | Plus Jakarta Sans* | sm | single dot |
| `rustic-traditional` | Fraunces | Crimson Pro | md | wheat |
| `playful-casual` | Poppins | Outfit | full | wave |
| `bold-street` | Archivo Black | DM Sans | 0 | skewed bars |

\* Body presets listed per config; `theme.fontBody` in a config overrides. `Inter` is no longer the default anywhere.

## Migration notes
- **Flat hours → structured:** handled automatically in `loadRestaurants.ts`.
- Adding a field = add to the Zod schema as `.optional()` with `.default()`. Never make a new field required on an existing shape.