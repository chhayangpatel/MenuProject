# Add a New Restaurant

Adding a restaurant takes about 5 minutes. Two ways to do it — the script or copying manually.

## Method 1: Using the script (easiest)

In PowerShell, from the project folder:

```powershell
npm run new-restaurant "My Restaurant Name"
```

This creates a folder `restaurants/my-restaurant-name/` with a fresh copy of the template.

*(Optional: specify the folder name yourself:)*
```powershell
npm run new-restaurant "My Place" -- --slug my-place
```

## Method 2: Copying manually

1. Copy the folder `restaurants/_template/`
2. Paste it and rename to a short lowercase name with dashes, e.g. `restaurants/my-restaurant/`
3. Open its `config.json`

---

## Fill in the config

The single most important file is `restaurants/<your-slug>/config.json`. Here's what to set:

### Identity
```json
{
  "slug": "my-restaurant",          // must match the folder name
  "name": "My Restaurant",          // shown on the site
  "tagline": "Short slogan",        // optional one-liner
  "description": "A sentence about your place."   // optional
}
```

### Look & feel (mood)
Pick **one** mood preset — it styles everything (fonts, spacing, divider art, animations):

| `moodPreset` | Best for | Vibe |
|---|---|---|
| `"fine-dining"` | Elegant, upscale | Serif typography, gold accents, clean |
| `"modern-minimal"` | Cafés, clean concepts | Geometric, airy, lots of white space |
| `"rustic-traditional"` | Family run, traditional | Warm serif, cozy, hand-crafted |
| `"playful-casual"` | Ice cream, desserts, family | Rounded, colorful, bouncy |
| `"bold-street"` | Burgers, street food | Punchy, strong, high-energy |

### Theme colors
```json
"theme": {
  "primaryColor": "#8B0000",   // headings, main text
  "secondaryColor": "#F5F0E6", // page background
  "accentColor": "#D4AF37"     // highlights, buttons, badges
}
```

### Menu
Add your categories and items (see the [menu guide](03-edit-menu.md) for full detail):
```json
"menu": [
  {
    "id": "mains",
    "name": "Main Courses",
    "items": [
      {
        "id": "example-item",
        "name": "Example Item",
        "price": 10,
        "available": true
      }
    ]
  }
]
```

---

## Add your logo & images

Drop your images into `restaurants/<your-slug>/assets/`. Full details in the [images guide](06-images.md).

Required:
- `logo.svg` or `logo.png` — your logo

Recommended:
- `cover.svg` or `cover.png` — a cover/hero image shown at the top

## Validate & preview

```powershell
npm run validate:configs     # must say your restaurant is valid
npm run dev                  # then visit http://localhost:4321/r/<your-slug>/
```

---

## Remove a restaurant

Simply **delete its folder**:

```powershell
Remove-Item -Recurse -Force restaurants/my-restaurant
```

Ensure `restaurants/_template/` is never deleted — it's the starter copy.