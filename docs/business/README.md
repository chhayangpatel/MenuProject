# Business Guide — Manage Your Digital Menu

> Written for restaurant owners and staff. No coding required — everything is plain JSON text files.

## What you can do

- ➕ **Add a restaurant** — copy a template, edit a text file, done
- ✏️ **Change prices** — open one file, type a new number
- 🍽️ **Add/remove menu items & categories**
- ⏰ **Update hours, contact info, address**
- 🎨 **Change colors, fonts, and the whole look** via mood presets
- 🖼️ **Add images & logos** by dropping files in a folder

## How it works (the 30-second version)

Every restaurant lives in a folder inside `restaurants/`:

```
restaurants/
├── bella-italia/
│   ├── config.json      ← ALL your menu, prices, hours, theme live here
│   └── assets/          ← your images & logo go here
├── matcha-minimal/
│   └── config.json
└── neon-burger/
    └── config.json
```

The whole site is **generated from these files**. When you save `config.json`, the site updates (in dev mode, instantly). No databases, no servers, nothing to break.

---

## 📖 Guides

1. **[Quickstart — run the site](01-quickstart.md)** — get it running on your computer
2. **[Add a new restaurant](02-add-a-restaurant.md)** — step-by-step
3. **[Edit the menu & prices](03-edit-menu.md)** — items, categories, customizations
4. **[Restaurant settings](04-restaurant-settings.md)** — hours, contact, theme, mood
5. **[Categories & storytelling](05-categories-and-storytelling.md)** — the immersive sections
6. **[Images & logos](06-images.md)** — file formats, sizes, where they go

---

## Golden rules

1. **Never break a JSON comma or quote.** If you see red errors after saving, you missed a `,` or `"`. Use an editor like VS Code or Notepad++ which highlights these.
2. **Always validate after editing:** run `npm run validate:configs` to check your file is correct.
3. **Keep the template folder** (`restaurants/_template/`) as your starting point — it's the safe copy.
4. **Use unique IDs.** Each menu item and category needs its own `id` — never duplicate one.