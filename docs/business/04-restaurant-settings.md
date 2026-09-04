# Restaurant Settings — Hours, Contact, Theme

All settings live in `restaurants/<slug>/config.json`.

## 🕐 Hours

```json
"hours": {
  "regular": {
    "monday":    "11:00-22:00",
    "tuesday":   "11:00-22:00",
    "wednesday": "11:00-22:00",
    "thursday":  "11:00-22:00",
    "friday":    "11:00-23:00",
    "saturday":  "12:00-23:00",
    "sunday":    "Closed"
  },
  "notes": "Kitchen closes 30 minutes before close."   // optional, shown in footer
}
```

> **Backward compatible:** older files used a flat format (`"hours": { "monday": "..." }`). Those still work — the system converts them automatically. You can upgrade to the `regular`/`notes` structure any time.

### Special holiday hours (optional)
```json
"hours": {
  "regular": { "monday": "11:00-22:00" },
  "special": [
    { "date": "2026-12-25", "hours": "Closed", "label": "Christmas Day" }
  ]
}
```

### Open/Closed rules
- Use 24-hour times: `"11:00-22:00"` not `11am-10pm`.
- Write `"Closed"` (capital C) for a closed day.
- A day that's missing means the restaurant is **not considered open** that day.

## 📞 Contact

```json
"contact": {
  "phone": "+1-555-0100",
  "whatsapp": "+1-555-0100",
  "email": "hello@example.com",
  "address": "123 Main St, Springfield",
  "googleMapsUrl": "https://maps.google.com/?q=...",
  "socials": {
    "instagram": "https://instagram.com/myplace",
    "facebook": "https://facebook.com/myplace"
  }
}
```
Everything is optional. The footer shows whatever you include.

## 🎨 Theme

```json
"theme": {
  "primaryColor":  "#8B0000",   // headings & main text
  "secondaryColor": "#F5F0E6",  // background
  "accentColor":   "#D4AF37",   // highlights, badges, buttons
  "fontHeading":   "Playfair Display",  // optional — leave "" to use preset
  "fontBody":      "Inter",             // optional — leave "" to use preset
  "borderRadius":  "md",                // "none" | "sm" | "md" | "lg" | "full"
  "mode":          "light"              // "light" | "dark"
}
```

Colors must be 6-digit hex (`#RRGGBB`). Tips:
- Primary = text/headings color (usually dark).
- Secondary = page background (usually light/cream).
- Accent = the pop color (gold, burgundy, orange, etc.) used on badges & buttons.

### Checking contrast (accessibility)
```powershell
npm run check:contrast
```
Ensures text is readable against backgrounds.

## 🧭 Mood preset

```json
"moodPreset": "fine-dining"
```
This is the **easiest way to change the whole personality** of a menu — it controls fonts, spacing, divider artwork, scroll animations, loading screen, and cursor. See the table in [Add a Restaurant](02-add-a-restaurant.md) for the five presets and when to use them.

## ⚙️ Settings

```json
"settings": {
  "currency": "USD",          // currency code
  "currencySymbol": "$",      // symbol shown before prices
  "language": "en",
  "showPrices": true,         // set false to hide ALL prices (e.g. "market price" menus)
  "enableSearch": true,       // show the search bar
  "enableDietaryFilters": true  // show the vegan/GF/… filter chips
}
```

## 📖 Story section (optional)

A short "Our Story" blurb between the hero and the menu:

```json
"story": {
  "heading": "Our Story",
  "body": "Founded in 1985 by the Rossi family..."
}
```

## Hero style

```json
"hero": { "style": "fullbleed" }
```
`"fullbleed"` (image fills the screen) · `"split"` · `"minimal"`

---

## Validation

After any change:

```powershell
npm run validate:configs
npm run check:contrast
```