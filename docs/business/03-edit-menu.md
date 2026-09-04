# Edit the Menu & Prices

This guide shows every field you can use on a menu item. Everything is optional except `id`, `name`, and `price`.

## Where things live

Open `restaurants/<slug>/config.json`. The `menu` is a list of categories, each with a list of items:

```jsonc
"menu": [
  {
    "id": "drinks",              // category ID (unique, lowercase, no spaces)
    "name": "Drinks",            // category title shown on site
    "description": "Optional blurb",
    "heroImage": "menu/bar.svg", // optional: full-bleed section banner
    "heroQuote": "Optional italic quote over the banner",
    "items": [ /* ... see below ... */ ]
  }
]
```

## The complete menu item

```jsonc
{
  // == Required ==
  "id": "classic-latte",          // unique ID — never duplicate
  "name": "Classic Latte",        // dish name
  "price": 6.5,                   // base price — CHANGE ME to update pricing

  // == Looks ==
  "description": "Whisked matcha, oat milk.",  // shown on the card
  "image": "menu/latte.svg",                  // small photo (path inside assets/)

  // == Availability & flags ==
  "available": true,        // set false to show "Sold Out"
  "featured": true,         // highlights as "Chef's Pick" + shows in carousel

  // == Dietary tags ==
  "tags": ["vegetarian", "vegan", "gluten-free"],
  "spicyLevel": 2,          // 0 (mild) to 3 (very spicy) — shows chili icons

  // == Sizes / Variants (optional) ==
  // Shows "From $6.50" on the card; customer picks a size in the detail sheet
  "variants": [
    { "id": "small",  "name": "Small",  "priceModifier": 0 },
    { "id": "large",  "name": "Large",  "priceModifier": 2.5 }   // +$2.50
  ],

  // == Add-ons / Modifiers (optional) ==
  "modifiers": [
    { "id": "extra-shot", "name": "Extra Shot", "price": 1, "group": "Extras" }
  ],

  // == Nutrition (optional) ==
  "nutrition": {
    "calories": 210,
    "protein": 8,
    "carbs": 30,
    "fat": 6
  },

  // == Allergens (optional) ==
  "allergens": [
    { "name": "Milk",  "severity": "contains" },
    { "name": "Nuts",  "severity": "may-contain" },   // or "traces"
  ],

  // == Ordering hints (optional) ==
  "prepTime": 5,              // minutes — shows ⏱ 5min
  "portionSize": "Serves 2",  // shows on the card
  "popularity": "most-ordered"  // "most-ordered" | "staff-favorite" | "new" | "trending"
}
```

## Changing a price (the common task)

1. Open `restaurants/<slug>/config.json`
2. Find the item's `"price"` line
3. Change the number
4. Save — the site updates instantly

> Prices that depend on a choice (sizes, add-ons) are handled with `priceModifier` / `price`, not the base `price`. The base price is always the smallest.

## Common edits

| I want to... | Do this |
|---|---|
| Hide an item today | Set `"available": false` |
| Remove an item permanently | Delete its `{ }` block (and the comma before it) |
| Add an item | Copy an existing item `{ }`, paste after it, add a comma, change the id/name/price |
| Change "Sold Out" back | Set `"available": true` |
| Add a category | Add a new `{ }` block to `menu`, with its own `items` list |
| Reorder items | Cut/paste blocks within the `items` list |
| Add a size option | Add a `"variants"` array |
| Feature on homepage carousel | Set `"featured": true` |

## Dietary tags — what you can use

`vegetarian` · `vegan` · `gluten-free` · `dairy-free` · `nut-free` · `halal` · `kosher` · `organic` · `house-made` · `seasonal`

## Validation

After any edit:

```powershell
npm run validate:configs
```

This catches typos and duplicate IDs. If it lists a problem, the message points to the exact file — fix it and run again.

---

## Tips
- **Keep IDs stable** — they're used in links and features. Change the `name` to rename a dish, not the `id`.
- **Don't leave trailing `,`** after the last item in a list — it's a JSON error.
- **Descriptions under ~120 characters** display best on cards (they clip with "…").