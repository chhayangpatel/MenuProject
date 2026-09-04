# Categories & Immersive Storytelling

Menu categories can be plain headers — or cinematic full-bleed chapter openers. This is the signature feature of the platform.

## Plain category (default)

```json
{
  "id": "drinks",
  "name": "Drinks",
  "description": "Brewed to order.",
  "items": [ ]
}
```

## Immersive category (with banner)

Add `heroImage` and optionally `heroQuote`. The category becomes a full-width banner with a slowly zooming image, an eyebrow chip, the category name in large type, and an editorial quote:

```json
{
  "id": "drinks",
  "name": "Matcha Drinks",
  "description": "Ceremonial-grade matcha from Uji, Kyoto.",
  "heroImage": "menu/matcha-bar.svg",
  "heroQuote": "\"Every cup is a small ritual.\" — Our barista, Yuki",
  "items": [ /* ... */ ]
}
```

### What each field does
- `heroImage` — the banner image. Relative path inside `restaurants/<slug>/assets/` (e.g. `menu/drinks.jpg`). If omitted, the category uses a normal header instead.
- `heroQuote` — italic editorial line shown over the banner. If omitted but `description` exists, the description is shown there instead.

## Page-level storytelling

Beyond categories, each restaurant can have:

### The "Our Story" section (between hero and menu)
See [Settings → Story](04-restaurant-settings.md#--story-section-optional).

### Featured items carousel
Any item with `"featured": true` appears in an auto-rotating carousel near the top. Great for chef's picks and best-sellers.

## How it animates (no work needed from you)

Animations are automatic and mood-aware:
- **Section dividers** — each mood preset has its own artwork between categories (laurel for fine-dining, wheat for rustic, stripes for street, etc.)
- **Scroll choreography** — items fade and rise in as you scroll, with a subtle blur that clears
- **Headings** — category titles "scramble" into place (text character shuffle) unless reduced-motion is on
- **3D hover** — cards tilt gently as you move your mouse over them
- **Mobile** — swipe left/right to jump between categories
- **Loading screen** — a mood-matched entrance (gold pulse for fine-dining, glitch for street, bounce for playful)

All animations automatically disable themselves for visitors with `prefers-reduced-motion` enabled.

## Image tips for banner art
- Suggested minimum width **1600px** — banners are wide, not tall.
- Your theme's `secondaryColor` is blended over the bottom edge, so pick images that look good with that gradient.
- Darker or moody images work best — text sits on top.